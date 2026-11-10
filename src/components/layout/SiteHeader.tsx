import { useState } from 'react'

type SiteHeaderProps = {
  page?: 'home' | 'blog' | 'works'
}

export function SiteHeader({ page = 'home' }: SiteHeaderProps) {
  const isBlog = page === 'blog'
  const isSubPage = page !== 'home'
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = () => setMenuOpen(false)

  return (
    <header className={`site-header ${isSubPage ? 'blog-header' : ''} ${menuOpen ? 'menu-open' : ''}`}>
      <a href={isSubPage ? '/' : '#home'} className="brand" aria-label="PALM home">
        <span className="brand-mark" aria-hidden="true">🐈‍⬛</span>
        <span>PALM</span>
      </a>
      <nav id="site-navigation" aria-label={isBlog ? 'Blog navigation' : 'Main navigation'}>
        <a href={isSubPage ? '/' : '#home'} className={page === 'home' ? 'active' : ''} onClick={closeMenu}>HOME</a>
        <a href="/works" className={page === 'works' ? 'active' : ''} onClick={closeMenu}>WORKS</a>
        <a href="/blog" className={isBlog ? 'active' : ''} onClick={closeMenu}>BLOG</a>
      </nav>
      <a className="contact-link" href={isBlog ? '/#contact' : '#contact'}>CONTACT ↗</a>
      <button
        className="menu-toggle"
        type="button"
        aria-controls="site-navigation"
        aria-expanded={menuOpen}
        aria-label={menuOpen ? 'メニューを閉じる' : 'メニューを開く'}
        onClick={() => setMenuOpen((open) => !open)}
      >
        {menuOpen ? 'CLOSE' : 'MENU'}
      </button>
    </header>
  )
}
