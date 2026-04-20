import type { VercelRequest, VercelResponse } from '@vercel/node'

const DEEZER_BASE = 'https://api.deezer.com'

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  const { path, ...rest } = req.query

  const pathStr = Array.isArray(path) ? path.join('/') : (path ?? '')
  const url = new URL(`/${pathStr}`, DEEZER_BASE)

  for (const [key, value] of Object.entries(rest)) {
    if (typeof value === 'string') {
      url.searchParams.set(key, value)
    }
  }

  const response = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  })

  const data = await response.json()

  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
  res.status(response.status).json(data)
}
