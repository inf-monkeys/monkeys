import { LiveImageShape } from '../components/LiveImageShapeUtil'
import { fastGetSvgAsImage } from '../utils/screenshot'
import * as fal from '@fal-ai/serverless-client'
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
	AssetRecordType,
	Editor,
	FileHelpers,
	TLShape,
	TLShapeId,
	getHashForObject,
	useEditor,
} from 'tldraw'

type LiveImageResult = { url: string }
type LiveImageRequest = {
	prompt: string
	image_url: string
	sync_mode: boolean
	strength: number
	seed: number
	enable_safety_checks: boolean
}
type LiveImageContextType = null | ((req: LiveImageRequest) => Promise<LiveImageResult>)
const LiveImageContext = createContext<LiveImageContextType>(null)

export function LiveImageProvider({
	children,
	appId,
	throttleTime = 0,
	timeoutTime = 5000,
}: {
	children: React.ReactNode
	appId: string
	throttleTime?: number
	timeoutTime?: number
}) {
	const [count, setCount] = useState(0)
	const [fetchImage, setFetchImage] = useState<{ current: LiveImageContextType }>({ current: null })

	// 配置通过后端代理的请求，避免在前端暴露密钥
	useEffect(() => {
		try {
			fal.config({
				requestMiddleware: fal.withProxy({
					targetUrl: '/api/fal/proxy',
				}),
			})
		} catch (e) {
			console.warn('FAL proxy config failed:', e)
		}
	}, [])

	useEffect(() => {
		const requestsById = new Map<
			string,
			{
				resolve: (result: LiveImageResult) => void
				reject: (err: unknown) => void
				timer: ReturnType<typeof setTimeout>
			}
		>()

		const genId = () =>
			typeof crypto !== 'undefined' && 'randomUUID' in crypto
				? (crypto as any).randomUUID()
				: `${Date.now()}-${Math.random().toString(36).slice(2)}`

		const { send, close } = fal.realtime.connect(appId, {
			connectionKey: 'fal-realtime-example',
			clientOnly: false,
			throttleInterval: throttleTime,
			onError: (error) => {
				console.error(error)
				// force re-connect
				setTimeout(() => {
					setCount((count) => count + 1)
				}, 500)
			},
			onResult: (result) => {
				if (result.images && result.images[0]) {
					const id = result.request_id
					const request = requestsById.get(id)
					if (request) {
						request.resolve(result.images[0])
					}
				}
			},
		})

		setFetchImage({
			current: (req) => {
				return new Promise((resolve, reject) => {
					const id = genId()
					const timer = setTimeout(() => {
						requestsById.delete(id)
						reject(new Error('Timeout'))
					}, timeoutTime)
					requestsById.set(id, {
						resolve: (res) => {
							resolve(res)
							clearTimeout(timer)
						},
						reject: (err) => {
							reject(err)
							clearTimeout(timer)
						},
						timer,
					})
					send({ ...req, request_id: id })
				})
			},
		})

		return () => {
			for (const request of requestsById.values()) {
				request.reject(new Error('Connection closed'))
			}
			try {
				close()
			} catch (e) {
				// noop
			}
		}
	}, [appId, count, throttleTime, timeoutTime])

	return (
		<LiveImageContext.Provider value={fetchImage.current}>{children}</LiveImageContext.Provider>
	)
}

export function useLiveImage(
	shapeId: TLShapeId,
	{ throttleTime = 64 }: { throttleTime?: number } = {}
) {
	const editor = useEditor()
	const fetchImageFromContext = useContext(LiveImageContext)

	// Fallback: 如果没有 Provider，使用单例连接（避免在页面增加新组件）
	const fetchImage = useMemo<LiveImageContextType>(() => {
		if (fetchImageFromContext) return fetchImageFromContext

		// 单例实例，跨 hook 共享
		const globalAny = globalThis as any
		if (!globalAny.__live_image_singleton__) {
			const DEFAULT_APP_ID = '110602490-lcm-sd15-i2i'

			try {
				fal.config({
					requestMiddleware: fal.withProxy({
						targetUrl: '/api/fal/proxy',
					}),
				})
			} catch {}

			const requestsById = new Map<
				string,
				{
					resolve: (result: LiveImageResult) => void
					reject: (err: unknown) => void
					timer: ReturnType<typeof setTimeout>
				}
			>()

			const genId = () =>
				typeof crypto !== 'undefined' && 'randomUUID' in crypto
					? (crypto as any).randomUUID()
					: `${Date.now()}-${Math.random().toString(36).slice(2)}`

			let reconnect = 0
			let sender: ((msg: any) => void) | null = null
			let closer: (() => void) | null = null

			const connect = () => {
				const { send, close } = fal.realtime.connect(DEFAULT_APP_ID, {
					connectionKey: 'fal-realtime-example',
					clientOnly: false,
					throttleInterval: throttleTime,
					onError: () => {
						setTimeout(() => {
							reconnect++
							connect()
						}, 500)
					},
					onResult: (result) => {
						if (result.images && result.images[0]) {
							const id = result.request_id
							const request = requestsById.get(id)
							if (request) {
								request.resolve(result.images[0])
							}
						}
					},
				})
				sender = send
				closer = close
			}

			connect()

			globalAny.__live_image_singleton__ = {
				fetch: (req: LiveImageRequest) => {
					return new Promise<LiveImageResult>((resolve, reject) => {
						if (!sender) {
							reject(new Error('Realtime not ready'))
							return
						}
						const id = genId()
						const timer = setTimeout(() => {
							requestsById.delete(id)
							reject(new Error('Timeout'))
						}, 5000)
						requestsById.set(id, {
							resolve: (res) => {
								resolve(res)
								clearTimeout(timer)
							},
							reject: (err) => {
								reject(err)
								clearTimeout(timer)
							},
							timer,
						})
						sender!({ ...req, request_id: id })
					})
				},
				close: () => closer?.(),
			}
		}

		return globalAny.__live_image_singleton__.fetch as LiveImageContextType
	}, [fetchImageFromContext, throttleTime])

	useEffect(() => {
		let prevHash = ''
		let prevPrompt = ''

		let startedIteration = 0
		let finishedIteration = 0

		async function updateDrawing() {
			const shapes = getShapesTouching(shapeId, editor)
			const frame = editor.getShape<LiveImageShape>(shapeId)
			if (!frame) {
				// Shape no longer exists; nothing to do
				return
			}

			const hash = getHashForObject([...shapes])
			const frameName = frame.props.name
			if (hash === prevHash && frameName === prevPrompt) return

			startedIteration += 1
			const iteration = startedIteration

			prevHash = hash
			prevPrompt = frame.props.name

			try {
				const bounds = editor.getShapePageBounds(shapeId)
				if (!bounds) {
					console.warn('No bounds for shape')
					updateImage(editor, frame.id, null)
					return
				}

				const svgStringResult = await editor.getSvgString([...shapes], {
					background: true,
					padding: 0,
					darkMode: editor.user.getIsDarkMode(),
					bounds,
					scale: 512 / frame.props.w,
				})

				if (!svgStringResult) {
					console.warn('No SVG')
					updateImage(editor, frame.id, null)
					return
				}

				const svgString = svgStringResult.svg

				// cancel if stale:
				if (iteration <= finishedIteration) return

				const blob = await fastGetSvgAsImage(svgString, {
					type: 'jpeg',
					quality: 0.5,
					width: svgStringResult.width,
					height: svgStringResult.height,
				})

				if (iteration <= finishedIteration) return

				if (!blob) {
					console.warn('No Blob')
					updateImage(editor, frame.id, null)
					return
				}

				const imageUrl = await FileHelpers.blobToDataUrl(blob)

				// cancel if stale:
				if (iteration <= finishedIteration) return

				const prompt = frameName
					? frameName + ' hd award-winning impressive'
					: 'A random image that is safe for work and not surprising—something boring like a city or shoe watercolor'

				const result = await fetchImage!({
					prompt,
					image_url: imageUrl,
					sync_mode: true,
					strength: 0.65,
					seed: 42,
					enable_safety_checks: false,
				})

				// cancel if stale:
				if (iteration <= finishedIteration) return

				finishedIteration = iteration
				updateImage(editor, frame.id, result.url)
			} catch (e) {
				const isTimeout = e instanceof Error && e.message === 'Timeout'
				if (!isTimeout) {
					console.error(e)
				}

				// retry if this was the most recent request:
				if (iteration === startedIteration) {
					requestUpdate()
				}
			}
		}

		let timer: ReturnType<typeof setTimeout> | null = null
		function requestUpdate() {
			if (timer !== null) return
			timer = setTimeout(() => {
				timer = null
				updateDrawing()
			}, throttleTime)
		}

		editor.on('update-drawings' as any, requestUpdate)
		return () => {
			editor.off('update-drawings' as any, requestUpdate)
		}
	}, [editor, fetchImage, shapeId, throttleTime])
}

function updateImage(editor: Editor, shapeId: TLShapeId, url: string | null) {
	const shape = editor.getShape<LiveImageShape>(shapeId)
	if (!shape) {
		return
	}
	const id = AssetRecordType.createId(shape.id.split(':')[1])

	const asset = editor.getAsset(id)

	if (!asset) {
		editor.createAssets([
			AssetRecordType.create({
				id,
				type: 'image',
				props: {
					name: shape.props.name,
					w: shape.props.w,
					h: shape.props.h,
					src: url,
					isAnimated: false,
					mimeType: 'image/jpeg',
				},
			}),
		])
	} else {
		editor.updateAssets([
			{
				...asset,
				type: 'image',
				props: {
					...asset.props,
					w: shape.props.w,
					h: shape.props.h,
					src: url,
				},
			},
		])
	}
}

function getShapesTouching(shapeId: TLShapeId, editor: Editor) {
	const shapeIdsOnPage = editor.getCurrentPageShapeIds()
	const shapesTouching: TLShape[] = []
	const targetBounds = editor.getShapePageBounds(shapeId)
	if (!targetBounds) return shapesTouching
	for (const id of [...shapeIdsOnPage]) {
		if (id === shapeId) continue
		const bounds = editor.getShapePageBounds(id)!
		if (bounds.collides(targetBounds)) {
			shapesTouching.push(editor.getShape(id)!)
		}
	}
	return shapesTouching
}

function downloadDataURLAsFile(dataUrl: string, filename: string) {
	const link = document.createElement('a')
	link.href = dataUrl
	link.download = filename
	link.click()
}
