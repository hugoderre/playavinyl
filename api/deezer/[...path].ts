import type { VercelRequest, VercelResponse } from '@vercel/node'

const DEEZER_BASE = 'https://api.deezer.com'

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  const { path } = req.query
  const segments = Array.isArray(path) ? path.join('/') : (path ?? '')

  const url = new URL(`/${segments}`, DEEZER_BASE)

  for (const [key, value] of Object.entries(req.query)) {
    if (key === 'path') continue
    if (typeof value === 'string') {
      url.searchParams.set(key, value)
    }
  }

  const response = await fetch(url.toString(), {
    headers: { 'Accept': 'application/json' },
  })

  const data = await response.json()

  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
  res.status(response.status).json(data)
}
