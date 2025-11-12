let _canvas: HTMLCanvasElement | null = null
let _ctx: CanvasRenderingContext2D | null = null

const TRANSPARENT_PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg=='

async function inlineExternalImages(svgString: string): Promise<string> {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(svgString, 'image/svg+xml')
    const images = Array.from(doc.querySelectorAll('image')) as SVGImageElement[]
    for (const img of images) {
      // Try both href and xlink:href
      const hrefAttr = (img.getAttribute('href') || img.getAttribute('xlink:href') || '').trim()
      if (!hrefAttr || hrefAttr.startsWith('data:')) continue
      try {
        const resp = await fetch(hrefAttr, { mode: 'cors' })
        if (!resp.ok) continue
        const blob = await resp.blob()
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = () => reject(reader.error)
          reader.readAsDataURL(blob)
        })
        img.setAttribute('href', base64)
        img.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', base64)
        // Ensure crossOrigin-safe rendering
        img.setAttribute('crossorigin', 'anonymous')
      } catch (error) {
        console.warn('[screenshot] inline image failed, fallback to transparent placeholder', hrefAttr, error)
        img.setAttribute('href', TRANSPARENT_PIXEL)
        img.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', TRANSPARENT_PIXEL)
      }
    }
    const serializer = new XMLSerializer()
    return serializer.serializeToString(doc)
  } catch {
    return svgString
  }
}

export async function fastGetSvgAsImage(
  svgString: string,
  options: {
    type: 'png' | 'jpeg' | 'webp'
    quality: number
    width: number
    height: number
  },
) {
  // Inline external images to avoid canvas taint
  const inlinedSvg = await inlineExternalImages(svgString)
  const svgUrl = URL.createObjectURL(new Blob([inlinedSvg], { type: 'image/svg+xml' }))

  if (!_canvas) {
    _canvas = document.createElement('canvas')
    _ctx = _canvas?.getContext('2d')!
    _ctx.imageSmoothingEnabled = true
    _ctx.imageSmoothingQuality = 'high'
  }

  const canvas = await new Promise<HTMLCanvasElement | null>((resolve) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'

    image.onload = async () => {
      if (!_canvas || !_ctx) {
        throw new Error('Canvas not initialized for fast screenshotting')
      }
      const canvas = _canvas
      const ctx = _ctx

      if (canvas.width !== options.width || canvas.height !== options.height) {
        canvas.width = options.width
        canvas.height = options.height
      }

      ctx.drawImage(image, 0, 0, options.width, options.height)
      URL.revokeObjectURL(svgUrl)
      resolve(canvas)
    }

    image.onerror = () => {
      URL.revokeObjectURL(svgUrl)
      resolve(null)
    }

    image.src = svgUrl
  })

  if (!canvas) return null

  const ensureNotTainted = () => {
    if (!_canvas || !_ctx) return false
    try {
      // 尝试读取一个像素或导出数据，如果失败说明画布被污染
      _ctx.getImageData(0, 0, 1, 1)
      return true
    } catch (error) {
      console.warn('[screenshot] canvas is tainted, skip exporting', error)
      return false
    }
  }

  if (!ensureNotTainted()) {
    _canvas = null
    _ctx = null
    return null
  }

  try {
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(null)
            return
          }
          resolve(blob)
        },
        'image/' + options.type,
        options.quality,
      ),
    )
    return blob
  } catch (error) {
    console.warn('[screenshot] canvas.toBlob failed, return null', error)
    _canvas = null
    _ctx = null
    return null
  }
}


