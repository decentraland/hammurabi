type FlatFetchResponse = {
  ok: boolean
  status: number
  statusText: string
  headers: Record<string, string>
  json?: any
  text?: string
}

type BodyType = 'json' | 'text'

export type FlatFetchInit = RequestInit & { responseBodyType?: BodyType }

/**
 * Utility function that wraps the fetch API and returns a promise with the
 * body of the promise resolved.
 */
export async function flatFetch(url: string, init?: FlatFetchInit): Promise<FlatFetchResponse> {
  const response = await fetch(url, init)

  const responseBodyType = init?.responseBodyType || 'text'

  const headers: Record<string, string> = {}

  response.headers.forEach((value, key) => (headers[key] = value))

  const flatFetchResponse: FlatFetchResponse = {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    headers
  }

  switch (responseBodyType) {
    case 'json':
      flatFetchResponse.json = await response.json()
      break
    case 'text':
      flatFetchResponse.text = await response.text()
      break
  }

  return flatFetchResponse
}
