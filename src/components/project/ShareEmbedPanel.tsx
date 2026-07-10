'use client'

import { useState } from 'react'

const SITE_URL = 'https://alertga4.bettersteps.pl'

export default function ShareEmbedPanel({ shareToken }: { shareToken: string }) {
  const [copied, setCopied] = useState(false)
  const badgeUrl = `${SITE_URL}/api/badge/${shareToken}`
  const snapshotUrl = `${SITE_URL}/api/snapshot/${shareToken}`
  const embedCode = `<a href="${SITE_URL}" target="_blank" rel="noopener noreferrer">\n  <img src="${badgeUrl}" alt="Sprawdź AlertGA4" width="168" height="36" />\n</a>`

  function copy() {
    navigator.clipboard.writeText(embedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ backgroundColor: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Share &amp; Embed</div>
      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 16 }}>
        Pokaż aktualny wynik na stronie klienta albo udostępnij go w social media.
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
        <div style={{ flex: '1 1 280px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Widget do osadzenia na stronie
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={badgeUrl} alt="Podgląd widgetu AlertGA4" width={168} height={36} style={{ display: 'block', marginBottom: 10, borderRadius: 6 }} />
          <textarea
            readOnly
            value={embedCode}
            rows={3}
            style={{ width: '100%', fontSize: 11, fontFamily: 'monospace', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--color-border-secondary)', backgroundColor: 'var(--color-background-secondary)', color: 'var(--color-text-primary)', resize: 'none', boxSizing: 'border-box' }}
          />
          <button
            onClick={copy}
            style={{ marginTop: 8, fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', backgroundColor: copied ? '#16a34a' : 'var(--color-background-secondary)', color: copied ? '#fff' : 'var(--color-text-primary)' }}
          >
            {copied ? '✓ Skopiowano' : 'Kopiuj kod'}
          </button>
        </div>

        <div style={{ flex: '1 1 200px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Grafika do social media
          </div>
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '0 0 10px' }}>
            Gotowy obrazek z aktualnym wynikiem — do ręcznego wrzucenia np. na LinkedIn.
          </p>
          <a
            href={snapshotUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 12, fontWeight: 600, padding: '7px 16px', borderRadius: 8, backgroundColor: '#16a34a', color: '#fff', textDecoration: 'none', display: 'inline-block' }}
          >
            Otwórz grafikę →
          </a>
        </div>
      </div>
    </div>
  )
}
