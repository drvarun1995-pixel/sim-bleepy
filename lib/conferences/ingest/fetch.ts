export const INGEST_USER_AGENT = 'BleepyConferenceIngest/1.0 (local development; +https://bleepy.co.uk)'

export async function fetchIngestText(url: string, accept = 'text/html') {
  const response = await fetch(url, {
    headers: {
      'User-Agent': INGEST_USER_AGENT,
      Accept: accept,
    },
    cache: 'no-store',
  })
  if (!response.ok) {
    throw new Error(`Fetch failed ${response.status} for ${url}`)
  }
  return response.text()
}

export async function fetchIngestTextOptional(url: string, accept = 'text/html') {
  try {
    return await fetchIngestText(url, accept)
  } catch {
    return null
  }
}
