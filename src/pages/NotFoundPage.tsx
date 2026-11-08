import { BlackCat } from '@/components/cat/BlackCat'

export default function NotFoundPage() {
  return (
    <main className="not-found">
      <div className="noise" aria-hidden="true" />
      <div className="nf-code">ERR_0x404 / UNMAPPED_COORDINATE</div>
      <h1>
        404
        <span>REALITY NOT FOUND.</span>
      </h1>
      <p>The system cannot locate your reality.</p>
      <BlackCat small />
      <a href="/">← RETURN TO BASE REALITY</a>
    </main>
  )
}
