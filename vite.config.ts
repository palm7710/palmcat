import { defineConfig, type HtmlTagDescriptor, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'

import siteConfiguration from './.figma/make/site.json' with { type: 'json' }
import { posts } from './src/data/content.ts'


// Vite config — https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // .figma/make/deploy-preview passes `--mode development` for cached-preview builds.
  const emitSourcemaps = mode === 'development'

  return {
    base: process.env.FIGMA_PUBLIC_URL ? `${process.env.FIGMA_PUBLIC_URL}/` : '/',
    build: {
      sourcemap: emitSourcemaps ? 'inline' : false,
      minify: !emitSourcemaps,
    },
    plugins: [
react(),
      tailwindcss(),
      figmaSiteConfiguration(siteConfiguration),
      seoPages(),
      figmaErrorOverlayReplay(),
      figmaReactRefreshBoundaryFallback(),
      figmaMakeKitPlugin({ storiesGlob: '/src/**/*.stories.{ts,tsx,js,jsx}' }),
      figmaLinkedPackageSourcemaps(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
    server: {
      host: process.env.FIGMA_DEV_SERVER_HOST || '0.0.0.0',
      port: parseInt(process.env.PORT || '8443'),
      strictPort: true,
      watch: {
        ignored: [
          '**/.figma/**',
],
      },
    },
    preview: {
      host: process.env.FIGMA_DEV_SERVER_HOST || '0.0.0.0',
      port: parseInt(process.env.PORT || '8443'),
    },
  }
})

const siteUrl = 'https://palmcat.dev'
const socialImageUrl = `${siteUrl}/og-image.png?v=20261102`
const siteName = 'PALM'
const authorName = 'Palm'
const twitterHandle = '@59kja'
const homeTitle = 'PALM — Create Your Own Reality'
const homeDescription = 'PALM — 技術でまだ見ぬ世界をつくるソフトウェアエンジニアのポートフォリオ。'
const blogTitle = 'THINK / PALM — 学びと個人開発の記録'
const blogDescription = 'ソフトウェア開発、読書、未来思考、個人開発を通して得た学びと問いを記録するPALMのブログ。'

type SeoPage = {
  title: string
  description: string
  url: string
  type: 'website' | 'article'
  imageAlt: string
  structuredData: object
  article?: {
    publishedTime: string
    modifiedTime: string
    section: string
  }
}

function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function escapeXml(value: string): string {
  return escapeHtmlAttribute(value).replace(/'/g, '&apos;')
}

function removeMetaTag(html: string, attribute: 'name' | 'property', key: string): string {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(
    `<meta\\b(?=[^>]*\\b${attribute}=["']${escapedKey}["'])[^>]*>\\s*`,
    'gi',
  )
  return html.replace(pattern, '')
}

function serializeStructuredData(data: object): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}

function applySeoMetadata(html: string, page: SeoPage): string {
  const nameTags = [
    'description',
    'robots',
    'author',
    'twitter:card',
    'twitter:site',
    'twitter:creator',
    'twitter:title',
    'twitter:description',
    'twitter:image',
    'twitter:image:alt',
  ]
  const propertyTags = [
    'og:type',
    'og:site_name',
    'og:locale',
    'og:url',
    'og:title',
    'og:description',
    'og:image',
    'og:image:secure_url',
    'og:image:type',
    'og:image:width',
    'og:image:height',
    'og:image:alt',
    'article:published_time',
    'article:modified_time',
    'article:section',
    'article:author',
  ]

  let result = html
  for (const name of nameTags) result = removeMetaTag(result, 'name', name)
  for (const property of propertyTags) result = removeMetaTag(result, 'property', property)

  result = result
    .replace(/<title>[\s\S]*?<\/title>\s*/i, '')
    .replace(/<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>\s*/gi, '')
    .replace(
      /<link\b(?=[^>]*\brel=["']alternate["'])(?=[^>]*\btype=["']application\/rss\+xml["'])[^>]*>\s*/gi,
      '',
    )
    .replace(
      /<link\b(?=[^>]*\brel=["']alternate["'])(?=[^>]*\btype=["']text\/plain["'])[^>]*>\s*/gi,
      '',
    )
    .replace(/<script\b(?=[^>]*\bid=["']page-structured-data["'])[^>]*>[\s\S]*?<\/script>\s*/gi, '')

  const articleTags = page.article
    ? `
    <meta property="article:published_time" content="${page.article.publishedTime}" />
    <meta property="article:modified_time" content="${page.article.modifiedTime}" />
    <meta property="article:section" content="${escapeHtmlAttribute(page.article.section)}" />
    <meta property="article:author" content="${siteUrl}/" />`
    : ''

  const metadata = `
    <title>${escapeHtmlAttribute(page.title)}</title>
    <meta name="description" content="${escapeHtmlAttribute(page.description)}" />
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
    <meta name="author" content="${authorName}" />
    <link rel="canonical" href="${page.url}" />
    <link rel="alternate" type="application/rss+xml" title="PALM Blog RSS" href="${siteUrl}/feed.xml" />
    <link rel="alternate" type="text/plain" title="PALM LLM content index" href="${siteUrl}/llms.txt" />

    <meta property="og:type" content="${page.type}" />
    <meta property="og:site_name" content="${siteName}" />
    <meta property="og:locale" content="ja_JP" />
    <meta property="og:url" content="${page.url}" />
    <meta property="og:title" content="${escapeHtmlAttribute(page.title)}" />
    <meta property="og:description" content="${escapeHtmlAttribute(page.description)}" />
    <meta property="og:image" content="${socialImageUrl}" />
    <meta property="og:image:secure_url" content="${socialImageUrl}" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${escapeHtmlAttribute(page.imageAlt)}" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="${twitterHandle}" />
    <meta name="twitter:creator" content="${twitterHandle}" />
    <meta name="twitter:title" content="${escapeHtmlAttribute(page.title)}" />
    <meta name="twitter:description" content="${escapeHtmlAttribute(page.description)}" />
    <meta name="twitter:image" content="${socialImageUrl}" />
    <meta name="twitter:image:alt" content="${escapeHtmlAttribute(page.imageAlt)}" />${articleTags}

    <script id="page-structured-data" type="application/ld+json">${serializeStructuredData(page.structuredData)}</script>
  `

  return result.replace('</head>', `${metadata}</head>`)
}

function publisherStructuredData() {
  return {
    '@type': 'Organization',
    '@id': `${siteUrl}/#organization`,
    name: siteName,
    url: `${siteUrl}/`,
    logo: {
      '@type': 'ImageObject',
      url: `${siteUrl}/favicon.svg`,
    },
  }
}

function authorStructuredData() {
  return {
    '@type': 'Person',
    '@id': `${siteUrl}/#author`,
    name: authorName,
    url: `${siteUrl}/`,
    jobTitle: 'Software Engineer',
    sameAs: ['https://github.com/palm7710', 'https://x.com/59kja'],
    knowsAbout: ['Swift', 'Go', 'Cloudflare', 'Mobile development', 'Software engineering'],
  }
}

function homeStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        url: `${siteUrl}/`,
        name: siteName,
        description: homeDescription,
        inLanguage: 'ja-JP',
        publisher: { '@id': `${siteUrl}/#organization` },
      },
      publisherStructuredData(),
      authorStructuredData(),
    ],
  }
}

function blogStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': ['Blog', 'CollectionPage'],
        '@id': `${siteUrl}/blog/#blog`,
        url: `${siteUrl}/blog/`,
        name: blogTitle,
        description: blogDescription,
        inLanguage: 'ja-JP',
        publisher: { '@id': `${siteUrl}/#organization` },
        author: { '@id': `${siteUrl}/#author` },
        blogPost: posts.map((post) => ({
          '@type': 'BlogPosting',
          '@id': `${siteUrl}/blog/${post.no}/#article`,
          url: `${siteUrl}/blog/${post.no}/`,
          headline: post.title,
          datePublished: `${post.date.replace(/\./g, '-')}T00:00:00+09:00`,
          keywords: post.keywords.join(', '),
        })),
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${siteUrl}/blog/#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'HOME', item: `${siteUrl}/` },
          { '@type': 'ListItem', position: 2, name: 'BLOG', item: `${siteUrl}/blog/` },
        ],
      },
      publisherStructuredData(),
      authorStructuredData(),
    ],
  }
}

function postStructuredData(post: (typeof posts)[number]) {
  const url = `${siteUrl}/blog/${post.no}/`
  const publishedTime = `${post.date.replace(/\./g, '-')}T00:00:00+09:00`

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BlogPosting',
        '@id': `${url}#article`,
        url,
        mainEntityOfPage: { '@type': 'WebPage', '@id': url },
        headline: post.title,
        alternativeHeadline: post.titleEn,
        description: post.summary,
        abstract: post.keyPoints.join(' '),
        articleBody: post.body
          .map((block) => block.replace(/^##\s+/, '').replace(/^>\s+/, '').replace(/\*\*/g, ''))
          .join('\n\n'),
        keywords: post.keywords.join(', '),
        about: post.keywords.map((keyword) => ({ '@type': 'Thing', name: keyword })),
        image: {
          '@type': 'ImageObject',
          url: socialImageUrl,
          width: 1200,
          height: 630,
        },
        datePublished: publishedTime,
        dateModified: publishedTime,
        author: { '@id': `${siteUrl}/#author` },
        publisher: { '@id': `${siteUrl}/#organization` },
        articleSection: post.category,
        inLanguage: 'ja-JP',
        wordCount: post.body.join('').length,
        isPartOf: { '@id': `${siteUrl}/blog/#blog` },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'HOME', item: `${siteUrl}/` },
          { '@type': 'ListItem', position: 2, name: 'BLOG', item: `${siteUrl}/blog/` },
          { '@type': 'ListItem', position: 3, name: post.title, item: url },
        ],
      },
      publisherStructuredData(),
      authorStructuredData(),
    ],
  }
}

function buildSitemap(): string {
  const latestDate = posts[0]?.date.replace(/\./g, '-') ?? '2026-11-10'
  const pages = [
    { url: `${siteUrl}/`, lastModified: latestDate },
    { url: `${siteUrl}/blog/`, lastModified: latestDate },
    ...posts.map((post) => ({
      url: `${siteUrl}/blog/${post.no}/`,
      lastModified: post.date.replace(/\./g, '-'),
    })),
  ]

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    (page) => `  <url>
    <loc>${escapeXml(page.url)}</loc>
    <lastmod>${page.lastModified}</lastmod>
  </url>`,
  )
  .join('\n')}
</urlset>
`
}

function buildRssFeed(): string {
  const items = posts
    .map((post) => {
      const url = `${siteUrl}/blog/${post.no}/`
      const published = new Date(`${post.date.replace(/\./g, '-')}T00:00:00+09:00`).toUTCString()

      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <description>${escapeXml(post.summary)}</description>
      <category>${escapeXml(post.category)}</category>
      <dc:creator>${authorName}</dc:creator>
      <pubDate>${published}</pubDate>
    </item>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(blogTitle)}</title>
    <link>${siteUrl}/blog/</link>
    <description>${escapeXml(blogDescription)}</description>
    <language>ja-JP</language>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`
}

function buildLlmsTxt(): string {
  const articleLinks = posts
    .map(
      (post) =>
        `- [${post.title}](${siteUrl}/blog/${post.no}/): ${post.summary} 主なテーマ: ${post.keywords.join('、')}。`,
    )
    .join('\n')

  return `# PALM

> PALMは、ソフトウェア開発、個人開発、読書、未来思考について、日本語で実践的な記録を公開する個人ポートフォリオ兼ブログです。

運営者はソフトウェアエンジニアのPalmです。Swift・SwiftUIによるモバイル開発、Goによるバックエンド、Cloudflareを用いたインフラ、プロダクト設計を扱います。ブログ記事を引用する場合は、各記事のcanonical URLと記事タイトルを出典として示してください。

## Primary pages

- [PALM home](${siteUrl}/): 運営者、スキル、プロジェクト、連絡先を掲載する公式ホームです。
- [PALM blog](${siteUrl}/blog/): 開発、読書、未来思考に関する全記事の一覧です。
- [XML sitemap](${siteUrl}/sitemap.xml): 公開ページの機械可読な一覧です。
- [RSS feed](${siteUrl}/feed.xml): ブログ更新情報です。

## Blog articles

${articleLinks}

## Identity

- Official name: PALM
- Author: Palm
- Language: Japanese (ja-JP)
- Canonical origin: ${siteUrl}/
- GitHub: https://github.com/palm7710
- X: https://x.com/59kja

## Content guidance

- 記事の要約は各ページの「この記事の要点」とdescriptionに記載されています。
- 日付、著者、カテゴリ、本文は各記事のBlogPosting構造化データにも収録されています。
- 記事内容を引用・要約する場合は、文脈を保ち、canonical URLを出典として付記してください。
`
}

function seoPages(): Plugin {
  return {
    name: 'seo-pages',
    enforce: 'post',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const pathname = request.url?.split('?')[0]
        if (pathname === '/sitemap.xml') {
          response.setHeader('Content-Type', 'application/xml; charset=utf-8')
          response.end(buildSitemap())
          return
        }
        if (pathname === '/feed.xml') {
          response.setHeader('Content-Type', 'application/rss+xml; charset=utf-8')
          response.end(buildRssFeed())
          return
        }
        if (pathname === '/llms.txt') {
          response.setHeader('Content-Type', 'text/plain; charset=utf-8')
          response.end(buildLlmsTxt())
          return
        }
        next()
      })
    },
    generateBundle(_, bundle) {
      const indexAsset = bundle['index.html']
      if (!indexAsset || indexAsset.type !== 'asset' || typeof indexAsset.source !== 'string') return

      const documentShell = indexAsset.source

      for (const post of posts) {
        const url = `${siteUrl}/blog/${post.no}/`
        const title = `${post.title} / PALM`
        const publishedTime = `${post.date.replace(/\./g, '-')}T00:00:00+09:00`
        const html = applySeoMetadata(documentShell, {
          title,
          description: post.summary,
          url,
          type: 'article',
          imageAlt: `${post.title} — PALM`,
          structuredData: postStructuredData(post),
          article: {
            publishedTime,
            modifiedTime: publishedTime,
            section: post.category,
          },
        })

        this.emitFile({
          type: 'asset',
          fileName: `blog/${post.no}/index.html`,
          source: html,
        })
      }

      this.emitFile({
        type: 'asset',
        fileName: 'blog/index.html',
        source: applySeoMetadata(documentShell, {
          title: blogTitle,
          description: blogDescription,
          url: `${siteUrl}/blog/`,
          type: 'website',
          imageAlt: '黒猫と蝶をあしらったPALMブログ',
          structuredData: blogStructuredData(),
        }),
      })

      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: buildSitemap() })
      this.emitFile({ type: 'asset', fileName: 'feed.xml', source: buildRssFeed() })
      this.emitFile({ type: 'asset', fileName: 'llms.txt', source: buildLlmsTxt() })

      indexAsset.source = applySeoMetadata(documentShell, {
        title: homeTitle,
        description: homeDescription,
        url: `${siteUrl}/`,
        type: 'website',
        imageAlt: '黒猫と蝶をあしらったPALMのソフトウェアエンジニア・ポートフォリオ',
        structuredData: homeStructuredData(),
      })
    },
  }
}

type FigmaSiteConfiguration = {
  title?: string
  description?: string
  language?: string
  robots?: {
    index?: boolean
  }
  icons?: {
    icon?: string
  }
  openGraph?: {
    image?: string
  }
  analytics?: {
    googleAnalyticsId?: string
  }
  customScripts?: {
    headStart?: string
    headEnd?: string
    bodyStart?: string
    bodyEnd?: string
  }
  accessibility?: {
    addBypassLinks?: boolean
  }
}

/** Applies /.figma/make/site.json to the generated document shell. */
function figmaSiteConfiguration(config: FigmaSiteConfiguration): Plugin {
  function sanitizeHtmlValue(value: string | undefined): string {
    return value?.replace(/[^a-zA-Z0-9_-]/g, '') || ''
  }
  function escapeHtmlText(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }
  function replaceHtmlCommentSlot(html: string, slotName: string, content: string): string {
    return html.replace(`<!-- ${slotName} -->`, content)
  }

  const title = config.title ?? "Figma Make App"
  const description = config.description ?? ''
  // Imported HTML keeps its own favicon; new Makes default to the Make product icon.
  const favicon = config.icons?.icon ?? '/favicon.svg'
  const socialImage = config.openGraph?.image ?? ''
  const language = sanitizeHtmlValue(config.language) || 'en'
  const googleAnalyticsId = sanitizeHtmlValue(config.analytics?.googleAnalyticsId)
  const headStart = config.customScripts?.headStart ?? ''
  const headEnd = config.customScripts?.headEnd ?? ''
  const bodyStart = config.customScripts?.bodyStart ?? ''
  const bodyEnd = config.customScripts?.bodyEnd ?? ''
  const robotsTxt = config.robots?.index === false ? 'User-agent: *\nDisallow: /\n' : ''

  return {
    name: 'figma-site-configuration',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!robotsTxt || req.url?.split('?')[0] !== '/robots.txt') return next()

        res.setHeader('Content-Type', 'text/plain; charset=utf-8')
        res.end(robotsTxt)
      })
    },
    generateBundle() {
      if (!robotsTxt) return

      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: robotsTxt,
      })
    },
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        let result = html
        result = replaceHtmlCommentSlot(result, 'figma:lang', language)
        result = replaceHtmlCommentSlot(result, 'figma:title', escapeHtmlText(title))
        result = replaceHtmlCommentSlot(result, 'figma:head-start', headStart)
        result = replaceHtmlCommentSlot(result, 'figma:head-end', headEnd)
        result = replaceHtmlCommentSlot(result, 'figma:body-start', bodyStart)
        result = replaceHtmlCommentSlot(result, 'figma:body-end', bodyEnd)

        const tags: HtmlTagDescriptor[] = []
        if (description) {
          tags.push({ tag: 'meta', attrs: { name: 'description', content: description }, injectTo: 'head' })
        }
        if (config.robots?.index === false) {
          tags.push({ tag: 'meta', attrs: { name: 'robots', content: 'noindex, nofollow' }, injectTo: 'head' })
        }
        if (favicon) {
          tags.push({ tag: 'link', attrs: { rel: 'icon', href: favicon }, injectTo: 'head' })
        }
        if (title) {
          tags.push({ tag: 'meta', attrs: { property: 'og:title', content: title }, injectTo: 'head' })
        }
        if (description) {
          tags.push({ tag: 'meta', attrs: { property: 'og:description', content: description }, injectTo: 'head' })
        }
        if (socialImage) {
          tags.push(
            { tag: 'meta', attrs: { property: 'og:image', content: socialImage }, injectTo: 'head' },
            { tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' }, injectTo: 'head' },
            { tag: 'meta', attrs: { name: 'twitter:image', content: socialImage }, injectTo: 'head' },
          )
        }

        if (googleAnalyticsId) {
          tags.push(
            {
              tag: 'script',
              attrs: {
                async: true,
                src: `https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`,
              },
              injectTo: 'head',
            },
            {
              tag: 'script',
              children: `
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', ${JSON.stringify(googleAnalyticsId)});
`,
              injectTo: 'head',
            },
          )
        }

        if (config.accessibility?.addBypassLinks) {
          tags.push(
            {
              tag: 'style',
              children: `
  .figma-bypass-link {
    position: fixed;
    top: 8px;
    left: 8px;
    z-index: 2147483647;
    transform: translateY(-150%);
    border-radius: 6px;
    background: #111827;
    color: #fff;
    padding: 8px 12px;
    font: 600 14px/1.2 system-ui, sans-serif;
    text-decoration: none;
  }
  .figma-bypass-link:focus {
    transform: translateY(0);
  }
`,
              injectTo: 'head',
            },
            {
              tag: 'a',
              attrs: { class: 'figma-bypass-link', href: '#root' },
              children: 'Skip to content',
              injectTo: 'body-prepend',
            },
          )
        }

        return {
          html: result,
          tags,
        }
      },
    },
  }
}

/**
 * Replay the most recent build error to clients that connect after
 * it was first broadcast. Vite buffers an error payload only while
 * no clients are connected and clears the buffer on the first
 * reconnect (see `bufferedMessage` in `createWebSocketServer`), so
 * if the preview iframe reloads after Vite already delivered an
 * error to a live socket, the new socket misses the payload and
 * the overlay stays hidden even though the build is still broken.
 * We intercept `ws.send` to remember the latest error and replay
 * it on every new connection; the cache clears on a successful
 * `update` or `full-reload` so a stale overlay can't survive a
 * fixed build.
 */
function figmaErrorOverlayReplay(): Plugin {
  return {
    name: 'figma-error-overlay-replay',
    apply: 'serve',
    configureServer(server) {
      let lastError: object | null = null

      const origSend = server.ws.send.bind(server.ws) as (...args: any[]) => void
      server.ws.send = ((...args: any[]) => {
        const payload = args[0]
        if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
          const type = (payload as { type?: string }).type
          if (type === 'error') {
            lastError = payload as object
          } else if (type === 'update' || type === 'full-reload') {
            lastError = null
          }
        }
        return origSend(...args)
      }) as typeof server.ws.send

      server.ws.on('connection', (socket) => {
        if (lastError !== null) {
          socket.send(JSON.stringify(lastError))
        }
      })
    },
  }
}

/**
 * Reload when a module that previously defined a React Refresh boundary stops
 * defining one. This happens when an agent moves a component into a new file
 * and replaces the old module with a re-export:
 *
 *   export { default } from './app/App'
 *
 * Vite otherwise accepts the update using the previous module's HMR boundary,
 * but the re-export-only transform no longer registers a replacement for the
 * mounted component family. React reports a successful refresh while leaving
 * the old tree mounted until the page is reloaded.
 */
function figmaReactRefreshBoundaryFallback(): Plugin {
  type ModuleNode = import('vite').ModuleNode
  const hadRefreshBoundary = new Map<string, boolean>()
  const lostRefreshBoundaries = new Set<string>()
  let sendFullReload: (() => void) | null = null

  return {
    name: 'figma-react-refresh-boundary-fallback',
    apply: 'serve',
    enforce: 'post',
    configureServer(server) {
      sendFullReload = () => server.ws.send({ type: 'full-reload', path: '*' })
    },
    handleHotUpdate({ modules, server, timestamp }) {
      if (lostRefreshBoundaries.size === 0) return

      const visited = new Set<ModuleNode>()
      const pending = [...modules]
      while (pending.length > 0) {
        const current = pending.pop()
        if (!current || visited.has(current)) continue
        visited.add(current)

        const moduleId = current.id?.split('?')[0]
        if (moduleId && lostRefreshBoundaries.has(moduleId)) {
          const invalidated = new Set<ModuleNode>()
          for (const updatedModule of modules) {
            server.moduleGraph.invalidateModule(updatedModule, invalidated, timestamp, true)
          }
          sendFullReload?.()
          return []
        }

        pending.push(...current.importers)
      }
    },
    transform(code, id) {
      if (!/\.[jt]sx?(?:\?|$)/.test(id) || id.includes('/node_modules/')) return null

      const moduleId = id.split('?')[0] ?? id
      const hasRefreshBoundary = code.includes('registerExportsForReactRefresh')
      const previousHadRefreshBoundary = hadRefreshBoundary.get(moduleId)
      hadRefreshBoundary.set(moduleId, hasRefreshBoundary)

      if (hasRefreshBoundary) lostRefreshBoundaries.delete(moduleId)
      if (previousHadRefreshBoundary && !hasRefreshBoundary) {
        lostRefreshBoundaries.add(moduleId)
        queueMicrotask(() => sendFullReload?.())
      }

      return null
    },
  }
}

/**
 * Serves a blank render-target page at /.figma/make/kit.html that
 * the Figma preview script drives directly. The page exposes a
 * registry of every file matching `storiesGlob` on
 * window.__FIGMA__.stories so the design surface can dynamically
 * import + mount each entry into its own grid view.
 *
 * Dev-only: `apply: 'serve'` gates the plugin to `vite dev`. Prod
 * builds (`vite build`) skip it entirely so the route doesn't leak
 * into shipped bundles.
 */
function figmaMakeKitPlugin(options: { storiesGlob: string | string[] }): Plugin {
  const storiesGlob = Array.isArray(options.storiesGlob) ? options.storiesGlob : [options.storiesGlob]
  const ROUTE = '/.figma/make/kit.html'
  const VIRTUAL_ID = 'virtual:figma-stories'
  const RESOLVED_ID = '\0' + VIRTUAL_ID
  const STORIES_MODULE = `export const stories = import.meta.glob(${JSON.stringify(storiesGlob)})`
  const HTML_BOOTSTRAP = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body>
<div id="figma-make-kit-root"></div>
<script type="module">
  import { stories } from 'virtual:figma-stories'
  window.__FIGMA__ = Object.assign(window.__FIGMA__ ?? {}, { stories })
  window.dispatchEvent(new CustomEvent('figma.ready'))
</script>
</body>
</html>`

  return {
    name: 'figma-make-kit',
    apply: 'serve',
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID
      return null
    },
    load(id) {
      if (id !== RESOLVED_ID) return null
      return STORIES_MODULE
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || ''
        if (url.split('?')[0] !== ROUTE) return next()

        try {
          res.setHeader('Content-Type', 'text/html')
          res.end(await server.transformIndexHtml(url, HTML_BOOTSTRAP))
        } catch (err) {
          next(err as Error)
        }
      })
    },
  }
}

/**
 * Reports the sources of dependencies linked from outside node_modules (pnpm
 * or npm workspaces, `file:`, `link:`) under `node_modules/<name>/`, the way
 * installed packages appear in sourcemaps. Vite otherwise reports their real
 * path, such as `libraries/<name>/`.
 */
function figmaLinkedPackageSourcemaps(): Plugin {
  const packageJson = JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, 'package.json'), 'utf8'))
  const linkedPackages = Object.keys({ ...packageJson.dependencies, ...packageJson.devDependencies }).flatMap((name) => {
    const installedDir = path.resolve(import.meta.dirname, 'node_modules', name)
    try {
      const realDir = fs.realpathSync(installedDir)
      return realDir.split(path.sep).includes('node_modules') ? [] : [{ installedDir, realDir }]
    } catch {
      return []
    }
  })
  const sourceMappingUrl = /\/\/# sourceMappingURL=(\S+)\s*$/

  function installedPath(file: string) {
    const linked = linkedPackages.find(({ realDir }) => file.startsWith(realDir + path.sep))
    return linked && path.join(linked.installedDir, path.relative(linked.realDir, file))
  }
  function readSourceMap(file: string, code: string) {
    const url = sourceMappingUrl.exec(code)?.[1]
    try {
      if (url?.startsWith('data:')) {
        return { map: JSON.parse(Buffer.from(url.split(',')[1], 'base64').toString()), mapDir: path.dirname(file) }
      }
      if (url) {
        const mapFile = path.resolve(path.dirname(file), url)
        return { map: JSON.parse(fs.readFileSync(mapFile, 'utf8')), mapDir: path.dirname(mapFile) }
      }
    } catch {}
    // Without a usable input map, map every line to itself.
    const mappings = code.split('\n').map((_, i) => (i ? 'AACA' : 'AAAA'))
    const map = { version: 3, sources: [file], sourcesContent: [code], names: [], mappings: mappings.join(';') }
    return { map, mapDir: path.dirname(file) }
  }

  return {
    name: 'figma-linked-package-sourcemaps',
    enforce: 'pre',
    load(id) {
      // Leave queried imports such as ?raw and ?url to Vite's own loaders.
      if (id.includes('?') || !/\.[cm]?[jt]sx?$/.test(id) || !installedPath(id)) return null

      const code = fs.readFileSync(id, 'utf8')
      const { map, mapDir } = readSourceMap(id, code)
      const sourceRoot = path.resolve(mapDir, map.sourceRoot ?? '')
      map.sources = map.sources.map((source: string) => {
        const original = path.resolve(sourceRoot, source)
        return installedPath(original) ?? original
      })
      delete map.sourceRoot
      return { code: code.replace(sourceMappingUrl, ''), map }
    },
  }
}
