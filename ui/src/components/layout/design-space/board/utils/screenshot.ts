let _canvas: HTMLCanvasElement | null = null
let _ctx: CanvasRenderingContext2D | null = null

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
      } catch {
        // Ignore a single image failure and continue
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
      resolve(null)
    }

    image.src = svgUrl
  })

  if (!canvas) return null

  const blobPromise = new Promise<Blob | null>((resolve) =>
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          resolve(null)
        }
        resolve(blob)
      },
      'image/' + options.type,
      options.quality,
    ),
  )

  return blobPromise
}


