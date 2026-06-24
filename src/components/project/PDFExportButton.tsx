'use client'

export default function PDFExportButton({ projectName }: { projectName: string }) {
  function handlePrint() {
    // Fix overflow on all containers before print
    const allDivs = document.querySelectorAll('div')
    const overflows: string[] = []
    allDivs.forEach(div => {
      overflows.push(div.style.overflow)
      div.style.overflow = 'visible'
    })

    const title = document.title
    document.title = `AlertGA4 — ${projectName} — ${new Date().toLocaleDateString('en-GB')}`

    setTimeout(() => {
      window.print()
      document.title = title
      // Restore overflow
      allDivs.forEach((div, i) => { div.style.overflow = overflows[i] })
    }, 300)
  }

  return (
    <>
      <style>{`
        @media print {
          .app-sidebar,
          .sidebar-hamburger,
          .sidebar-overlay,
          nav,
          .no-print,
          [data-no-print] { display: none !important; }

          body { background: white !important; color: #111 !important; }

          * {
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .print-header { display: block !important; }

          svg { overflow: visible !important; }

          div[style*="height: 36"] { height: auto !important; }
        }
        @media screen { .print-header { display: none; } }
      `}</style>

      <div className="print-header" style={{ textAlign: 'center', padding: '12px 0 20px', borderBottom: '1px solid #e5e7eb', marginBottom: 20 }}>
        <strong style={{ fontSize: 16 }}>AlertGA4 — GA4 Quality Report</strong>
        <div style={{ fontSize: 11, color: '#555', marginTop: 4 }}>
          {projectName} · {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      <button
        onClick={handlePrint}
        className="no-print"
        style={{
          fontSize: 12, padding: '4px 12px', borderRadius: 6,
          border: '1px solid var(--color-border-tertiary)',
          backgroundColor: 'var(--color-background-primary)',
          color: 'var(--color-text-secondary)', cursor: 'pointer',
        }}
      >
        ↓ Export PDF
      </button>
    </>
  )
}
