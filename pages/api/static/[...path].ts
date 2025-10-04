import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'
import { lookup as getType } from 'mime-types'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const parts = (req.query.path ?? []) as string[]

  if (!Array.isArray(parts) || parts.length === 0 || parts[0] !== 'uploads') {
    res.status(400).json({ ok: false, error: 'bad_path' })
    return
  }

  const rel = parts.join('/')
  const publicRoot = path.join(process.cwd(), 'public')
  const abs = path.join(publicRoot, rel)

  if (!abs.startsWith(publicRoot)) {
    res.status(403).json({ ok: false, error: 'forbidden' })
    return
  }

  try {
    const stat = fs.statSync(abs)
    if (!stat.isFile()) {
      res.status(404).end('Not Found')
      return
    }
  } catch {
    res.status(404).end('Not Found')
    return
  }

  const type = getType(abs) || 'application/octet-stream'
  res.setHeader('Content-Type', type)
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')

  const stream = fs.createReadStream(abs)
  stream.on('error', () => res.status(500).end('Read error'))
  stream.pipe(res)
}
