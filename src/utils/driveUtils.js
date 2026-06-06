export function extractDriveFileId(url) {
  if (!url) return null
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/)
  return match ? match[1] : null
}

export function getDriveThumbnail(url, width = 400) {
  const id = extractDriveFileId(url)
  return id ? `https://lh3.googleusercontent.com/d/${id}=w${width}` : null
}

export function getDriveFullImage(url) {
  return getDriveThumbnail(url, 1200)
}

export function getDriveLightboxImage(url) {
  return getDriveThumbnail(url, 1600)
}

export function getDrivePreviewUrl(url) {
  const id = extractDriveFileId(url)
  return id ? `https://drive.google.com/file/d/${id}/preview` : null
}

export function getDriveDownloadUrl(url) {
  const id = extractDriveFileId(url)
  return id ? `https://drive.google.com/uc?export=download&id=${id}` : null
}
