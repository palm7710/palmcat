import { DurableObject } from 'cloudflare:workers'

const postNumberPattern = /^\d{4}$/
const postViewPathPattern = /^\/api\/views\/(\d{4})\/?$/
const automatedUserAgentPattern = /bot|crawler|spider|slurp|headless|lighthouse/i

type ViewCountResponse = {
  count: number
  counted?: boolean
}

export class ViewCounter extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)

    ctx.blockConcurrencyWhile(async () => {
      this.ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS view_count (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          value INTEGER NOT NULL DEFAULT 0 CHECK (value >= 0)
        )
      `)
      this.ctx.storage.sql.exec(
        'INSERT OR IGNORE INTO view_count (id, value) VALUES (1, 0)',
      )
    })
  }

  getCount(): number {
    return this.ctx.storage.sql
      .exec<{ value: number }>('SELECT value FROM view_count WHERE id = 1')
      .one().value
  }

  increment(): number {
    return this.ctx.storage.sql
      .exec<{ value: number }>(
        'UPDATE view_count SET value = value + 1 WHERE id = 1 RETURNING value',
      )
      .one().value
  }
}

function json(data: object, status = 200): Response {
  return Response.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

function getCounter(env: Env, postNumber: string) {
  return env.VIEW_COUNTERS.getByName(`post-${postNumber}`)
}

function canIncrement(request: Request, url: URL): boolean {
  const origin = request.headers.get('Origin')
  const fetchSite = request.headers.get('Sec-Fetch-Site')
  const userAgent = request.headers.get('User-Agent') ?? ''

  return (
    origin === url.origin &&
    (!fetchSite || fetchSite === 'same-origin') &&
    !automatedUserAgentPattern.test(userAgent)
  )
}

async function handleViewRequest(request: Request, env: Env): Promise<Response | null> {
  const url = new URL(request.url)

  if (url.pathname === '/api/views') {
    if (request.method !== 'GET') {
      return json({ error: 'Method not allowed' }, 405)
    }

    const postNumbers = [
      ...new Set((url.searchParams.get('posts') ?? '').split(',').filter(Boolean)),
    ]

    if (
      postNumbers.length === 0 ||
      postNumbers.length > 50 ||
      postNumbers.some((postNumber) => !postNumberPattern.test(postNumber))
    ) {
      return json({ error: 'Invalid posts parameter' }, 400)
    }

    const counts = Object.fromEntries(
      await Promise.all(
        postNumbers.map(async (postNumber) => [
          postNumber,
          await getCounter(env, postNumber).getCount(),
        ]),
      ),
    )

    return json({ counts })
  }

  const match = url.pathname.match(postViewPathPattern)
  if (!match) return null

  const postNumber = match[1]
  const counter = getCounter(env, postNumber)

  if (request.method === 'GET') {
    return json({ count: await counter.getCount() } satisfies ViewCountResponse)
  }

  if (request.method === 'POST') {
    if (!canIncrement(request, url)) {
      return json(
        { count: await counter.getCount(), counted: false } satisfies ViewCountResponse,
        403,
      )
    }

    return json({ count: await counter.increment(), counted: true } satisfies ViewCountResponse)
  }

  return json({ error: 'Method not allowed' }, 405)
}

export default {
  async fetch(request, env): Promise<Response> {
    try {
      const viewResponse = await handleViewRequest(request, env)
      if (viewResponse) return viewResponse

      return env.ASSETS.fetch(request)
    } catch (error) {
      console.error(
        JSON.stringify({
          message: 'view counter request failed',
          path: new URL(request.url).pathname,
          error: error instanceof Error ? error.message : String(error),
        }),
      )
      return json({ error: 'View counter temporarily unavailable' }, 503)
    }
  },
} satisfies ExportedHandler<Env>
