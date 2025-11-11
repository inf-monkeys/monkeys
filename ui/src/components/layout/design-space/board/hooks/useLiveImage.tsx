import { LiveImageShape } from '../shapes/live-image/LiveImageShapeUtil'
import { fastGetSvgAsImage } from '../utils/screenshot'
import * as fal from '@fal-ai/serverless-client'
import { createContext, useContext, useEffect, useState } from 'react'
import { AssetRecordType, Editor, FileHelpers, TLShape, TLShapeId, getHashForObject, useEditor } from 'tldraw'
import { v4 as uuid } from 'uuid'

// Configure fal client to use backend proxy
fal.config({
  requestMiddleware: fal.withProxy({
    targetUrl: '/api/fal/proxy',
  }),
})

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

  useEffect(() => {
    const requestsById = new Map<
      string,
      {
        resolve: (result: LiveImageResult) => void
        reject: (err: unknown) => void
        timer: ReturnType<typeof setTimeout>
      }
    >()

    const { send, close } = fal.realtime.connect(appId, {
      connectionKey: 'fal-realtime-example',
      clientOnly: false,
      throttleInterval: throttleTime,
      onError: (error) => {
        console.error(error)
        setTimeout(() => {
          setCount((count) => count + 1)
        }, 500)
      },
      onResult: (result: any) => {
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
          const id = uuid()
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
      } catch {
        // noop
      }
    }
  }, [appId, count, throttleTime, timeoutTime])

  return <LiveImageContext.Provider value={fetchImage.current}>{children}</LiveImageContext.Provider>
}

export function useLiveImage(shapeId: TLShapeId, { throttleTime = 64 }: { throttleTime?: number } = {}) {
  const editor = useEditor()
  const fetchImage = useContext(LiveImageContext)

  useEffect(() => {
    if (!fetchImage) {
      return
    }

    const fetchImageFn = fetchImage

    let prevHash = ''
    let prevPrompt = ''

    let startedIteration = 0
    let finishedIteration = 0

    async function updateDrawing() {
      const frame = editor.getShape<LiveImageShape>(shapeId)
      if (!frame) {
        return
      }
      const shapes = getShapesTouching(shapeId, editor)

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

        if (iteration <= finishedIteration) return

        const prompt = frameName
          ? frameName + ' hd award-winning impressive'
          : 'A random image that is safe for work and not surprising—something boring like a city or shoe watercolor'

        const result = await fetchImageFn({
          prompt,
          image_url: imageUrl,
          sync_mode: true,
          strength: 0.65,
          seed: 42,
          enable_safety_checks: false,
        })

        if (iteration <= finishedIteration) return

        finishedIteration = iteration
        updateImage(editor, frame.id, result.url)
      } catch (e: any) {
        const msg = e instanceof Error ? e.message : String(e)
        const isTimeout = msg === 'Timeout'
        const isClosed = msg === 'Connection closed'
        if (!isTimeout && !isClosed) {
          console.error(e)
        }

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
      } as any,
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
    const bounds = editor.getShapePageBounds(id)
    if (!bounds) continue
    if (bounds.collides(targetBounds)) {
      const shape = editor.getShape(id)
      if (shape) {
        shapesTouching.push(shape)
      }
    }
  }
  return shapesTouching
}


