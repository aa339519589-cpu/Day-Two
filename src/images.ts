import { useEffect, useState } from 'react'
import { getImage } from './idb'

const urls = new Map<string, string>()

export function peekImage(image: string) {
  if (image.startsWith('/')) return image
  return urls.get(image) ?? null
}

export async function resolveImage(image: string) {
  const cached = peekImage(image)
  if (cached) return cached
  if (!image.startsWith('idb:')) return ''
  const blob = await getImage(image.slice(4))
  if (!blob) return ''
  const url = URL.createObjectURL(blob)
  urls.set(image, url)
  return url
}

export function revokeImage(image: string) {
  const url = urls.get(image)
  if (!url || image.startsWith('/')) return
  URL.revokeObjectURL(url)
  urls.delete(image)
}

export function useImage(image: string | undefined) {
  const [src, setSrc] = useState<string | null>(image ? peekImage(image) : null)
  useEffect(() => {
    let live = true
    if (!image) {
      setSrc(null)
      return
    }
    const cached = peekImage(image)
    if (cached) {
      setSrc(cached)
      return
    }
    setSrc(null)
    resolveImage(image).then((url) => {
      if (live) setSrc(url || null)
    })
    return () => {
      live = false
    }
  }, [image])
  return src
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('这张照片无法读取。请换一张 JPG 或 PNG。'))
    }
    img.src = url
  })
}

export async function fileToJpeg(file: File) {
  if (!file.type.startsWith('image/')) throw new Error('请选择图片文件。')
  if (file.size > 12 * 1024 * 1024) throw new Error('这张照片超过 12MB，请换一张小一些的。')
  const img = await loadImage(file)
  const edge = Math.max(img.naturalWidth, img.naturalHeight)
  const scale = edge > 1600 ? 1600 / edge : 1
  const width = Math.max(1, Math.round(img.naturalWidth * scale))
  const height = Math.max(1, Math.round(img.naturalHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return file
  ctx.drawImage(img, 0, 0, width, height)
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.86))
  if (!blob) throw new Error('照片处理失败，请换一张再试。')
  return blob
}
