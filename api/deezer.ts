import type { VercelRequest, VercelResponse } from '@vercel/node'

const DEEZER_BASE = 'https://api.deezer.com'

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  const { path, ...rest } = req.query

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const pathStr = (Array.isArray(path) ? path.join('/') : (path ?? '')).replace(/^\/+/, '')
  const url = new URL(`/${pathStr}`, DEEZER_BASE)

  if (url.hostname !== 'api.deezer.com') {
    res.status(400).json({ error: 'Invalid path' })
    return
  }

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
