'use client'

export default function PDFExportButton({ projectName }: { projectName: string }) {
  function handlePrint() {
    const title = document.title
    document.title = `AlertGA4 — ${projectName} — ${new Date().toLocaleDateString('en-GB')}`
    window.print()
    document.title = title
  }

  return (
    <>
      <style>{`
        @media print {
          /* Hide everything non-essential */
          .app-sidebar,
          .sidebar-hamburger,
          .sidebar-overlay,
          nav,
          .no-print,
          [data-no-print] {
            display: none !important;
          }

          /* Reset layout for print */
          body {
            background: white !important;
            color: #111 !important;
            font-size: 11pt !important;
          }

          /* Make content full width */
          main, #main-content {
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Page breaks */
          .section-break {
            page-break-before: always;
          }

          /* Fix colors for print */
          [style*="var(--color-background-primary)"] {
            background: white !important;
          }
          [style*="var(--color-background-secondary)"] {
            background: #f9fafb !important;
          }
          [style*="var(--color-text-primary)"] {
            color: #111 !important;
          }
          [style*="var(--color-text-secondary)"] {
            color: #555 !important;
          }
          [style*="var(--color-border-tertiary)"] {
            border-color: #e5e7eb !important;
          }

          /* Print header */
          .print-header {
            display: block !important;
            text-align: center;
            padding: 12px 0 20px;
            border-bottom: 1px solid #e5e7eb;
            margin-bottom: 20px;
          }
        }

        @media screen {
          .print-header { display: none; }
        }
      `}</style>

      {/* Hidden print header shown only when printing */}
      <div className="print-header">
        <strong style={{ fontSize: 16 }}>AlertGA4 — GA4 Quality Report</strong>
        <div style={{ fontSize: 11, color: '#555', marginTop: 4 }}>
          {projectName} · Generated {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      <button
        onClick={handlePrint}
        className="no-print"
        style={{
          fontSize: 12,
          padding: '4px 12px',
          borderRadius: 6,
          border: '1px solid var(--color-border-tertiary)',
          backgroundColor: 'var(--color-background-primary)',
          color: 'var(--color-text-secondary)',
          cursor: 'pointer',
        }}
      >
        ↓ Export PDF
      </button>
    </>
  )
}
