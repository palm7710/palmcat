import { useState } from 'react'

type SiteHeaderProps = {
  page?: 'home' | 'blog'
}

export function SiteHeader({ page = 'home' }: SiteHeaderProps) {
  const isBlog = page === 'blog'
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = () => setMenuOpen(false)

  return (
    <header className={`site-header ${isBlog ? 'blog-header' : ''} ${menuOpen ? 'menu-open' : ''}`}>
      <a href={isBlog ? '/' : '#home'} className="brand" aria-label="PALM home">
        <span className="brand-mark" aria-hidden="true">🐈‍⬛</span>
        <span>PALM</span>
      </a>
      <nav id="site-navigation" aria-label={isBlog ? 'Blog navigation' : 'Main navigation'}>
        <a href={isBlog ? '/' : '#home'} className={!isBlog ? 'active' : ''} onClick={closeMenu}>HOME</a>
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
