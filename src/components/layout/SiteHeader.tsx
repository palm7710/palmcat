type SiteHeaderProps = {
  page?: 'home' | 'blog' | 'works'
}

export function SiteHeader({ page = 'home' }: SiteHeaderProps) {
  const isBlog = page === 'blog'
  const isSubPage = page !== 'home'

  return (
    <header className={`site-header ${isSubPage ? 'blog-header' : ''}`}>
      <a href={isSubPage ? '/' : '#home'} className="brand" aria-label="PALM home">
        <span className="brand-mark" aria-hidden="true">🐈‍⬛</span>
        <span>PALM</span>
      </a>
      <nav id="site-navigation" aria-label={isBlog ? 'Blog navigation' : 'Main navigation'}>
        <a href={isSubPage ? '/' : '#home'} className={page === 'home' ? 'active' : ''}>HOME</a>
        <a href="/works" className={page === 'works' ? 'active' : ''}>WORKS</a>
        <a href="/blog" className={isBlog ? 'active' : ''}>BLOG</a>
      </nav>
      <a className="contact-link" href={isBlog ? '/#contact' : '#contact'}>CONTACT ↗</a>
    </header>
  )
}
