export async function messageFromDownloadResponse(
  response: Response,
  fallback = 'Failed to download file'
): Promise<{ message: string; code?: string; url?: string; filename?: string }> {
  const body = (await response.json().catch(() => null)) as
    | { error?: string; code?: string; url?: string; filename?: string }
    | null
  return {
    message: body?.error || fallback,
    code: body?.code,
    url: body?.url,
    filename: body?.filename,
  }
}

export function triggerBrowserDownload(url: string) {
  const link = document.createElement('a')
  link.href = url
  link.rel = 'noopener noreferrer'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export async function startDownloadFromResponse(
  response: Response,
  fallbackName?: string
): Promise<string> {
  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    const data = (await response.json()) as { url?: string; filename?: string; error?: string }
    if (!data.url) {
      throw new Error(data.error || 'Failed to download file')
    }
    triggerBrowserDownload(data.url)
    return data.filename || fallbackName || 'download'
  }

  const blob = await response.blob()
  const contentDisposition = response.headers.get('Content-Disposition')
  let filename = fallbackName || 'download'
  if (contentDisposition) {
    const matches = /filename\*?=(?:UTF-8''|["']?)([^"';]+)/i.exec(contentDisposition)
    if (matches?.[1]) {
      filename = decodeURIComponent(matches[1].replace(/['"]/g, ''))
    }
  }

  const blobUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = blobUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100)
  return filename
}
