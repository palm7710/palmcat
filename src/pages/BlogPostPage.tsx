import { useEffect } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { posts } from '@/data/content'

function renderInlineMarkdown(text: string) {
  return text.split(/(\*\*.+?\*\*)/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>
    }

    return part
  })
}

export default function BlogPostPage() {
  const { postNo } = useParams()
  const post = posts.find((item) => item.no === postNo)

  useEffect(() => {
    if (!post) return
    document.title = `${post.title} / PALM`
    return () => {
      document.title = 'PALM — Create Your Own Reality'
    }
  }, [post])

  if (!post) return <Navigate to="/404" replace />

  return (
    <main className="blog-post-page">
      <div className="page-noise" aria-hidden="true" />
      <SiteHeader page="blog" />

      <article className="blog-post">
        <Link className="post-back" to="/blog">← BACK TO BLOG</Link>
        <header className="post-header">
          <div className="post-header-meta">
            <span>[{post.no}]</span>
            <span>{post.category}</span>
            <time dateTime={post.date.replace(/\./g, '-')}>{post.date}</time>
            <span>{post.time} READ</span>
          </div>
          <h1>{post.title}</h1>
          <h2>{post.titleEn}</h2>
          <p>{post.summary}</p>
        </header>

        <div className="post-body">
          {post.body.map((block, index) => {
            if (block.startsWith('## ')) {
              return <h3 key={index}>{block.slice(3)}</h3>
            }

            if (block.startsWith('> ')) {
              return <blockquote key={index}>{renderInlineMarkdown(block.slice(2))}</blockquote>
            }

            return <p key={index}>{renderInlineMarkdown(block)}</p>
          })}
        </div>

        <footer className="post-end">
          <span>END OF TRANSMISSION / {post.no}</span>
          <Link to="/blog">BLOG INDEX ↗</Link>
        </footer>
      </article>
    </main>
  )
}
