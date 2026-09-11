

import React, { useEffect } from 'react';

const CommonPrintView = ({
    title = '',
    subtitle = '',
    companyName = '',
    companyGST = '',
    columns = [],
    rows = [],
    rowRenderer = () => [],
    footerValues = [],
    amountInWords = '',
    headerImg = null,
    footerImg = null,
}) => {

    useEffect(() => {
        const id = 'cpr-print-style';
        const existing = document.getElementById(id);
        if (existing) existing.remove();  

        const style = document.createElement('style');
        style.id = id;
        style.textContent = `
      /* ════════════════════════════════════════════════
         SCREEN — hide print root completely
         ════════════════════════════════════════════════ */
      @media screen {
        #cpr-root { display: none !important; }
      }

      /* ════════════════════════════════════════════════
         PRINT
         ════════════════════════════════════════════════ */
      @media print {

        /* Hide every other element */
        body > *:not(#cpr-root) { display: none !important; }
        #cpr-root { display: block !important; }

        /* ── Page setup ──────────────────────────────
           margin: top=0 (header image sits in normal flow on p1,
                          zero margin on p2+ so NO gap)
                   sides=0 (we pad in .cpr-wrap)
                   bottom=7mm (room for page number) */
        @page {
          size: A4 portrait;
          margin: 0 0 7mm 0;
        }

        /* ── Root wrapper ── */
        #cpr-root {
          width: 210mm;
          font-family: Arial, sans-serif;
          font-size: 8pt;
          color: #000;
          background: #fff;
        }

        /* ── Header image ─────────────────────────────
           Sits at the very beginning of the document flow.
           It occupies ~38mm on page 1. When page 2 starts,
           the browser simply continues the table — no image
           reserved there, so ZERO gap on page 2+. */
        .cpr-header-img {
          display: block;
          width: 210mm;
          height: auto;
          page-break-after: avoid;
          margin: 0;
          padding: 0;
        }

        /* ── Content padding ── */
        .cpr-wrap {
          padding: 2mm 7mm 2mm 7mm;
        }

        /* ── Title block ── */
        .cpr-company {
          text-align: center;
          font-size: 10.5pt;
          font-weight: bold;
          text-transform: uppercase;
          margin: 0 0 0.8mm 0;
          line-height: 1.2;
        }
        .cpr-gst {
          text-align: center;
          font-size: 7.5pt;
          margin: 0 0 0.8mm 0;
        }
        .cpr-title {
          text-align: center;
          font-size: 11pt;
          font-weight: bold;
          text-decoration: underline;
          margin: 0 0 0.8mm 0;
          line-height: 1.2;
        }
        .cpr-sub {
          text-align: center;
          font-size: 8pt;
          color: #333;
          margin: 0 0 2.5mm 0;
        }

        /* ── Table ───────────────────────────────────── */
        .cpr-table {
          width: 192mm;           /* 210 - 7 - 7 - 4 spare */
          border-collapse: collapse;
          table-layout: fixed;
          font-size: 7pt;
          margin: 0;
        }

        /* thead repeats on every page */
        .cpr-table thead {
          display: table-header-group;
        }

        .cpr-table th {
          font-weight: bold;
          font-size: 7.5pt;
          text-align: center;
          padding: 2.5pt 2pt;
          border-bottom: 0.6pt solid #000;
          border-top: none;
          border-left: none;
          border-right: none;
          background: #fff;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          word-break: normal;
          white-space: nowrap;
          overflow: hidden;
        }

        /* tfoot repeats at end of table */
        .cpr-table tfoot {
          display: table-footer-group;
        }
        .cpr-table tfoot td {
          font-weight: bold;
          font-size: 7pt;
          padding: 2.5pt 2pt;
          border-top: 0.6pt solid #000;
          border-bottom: 0.6pt solid #000;
          border-left: none;
          border-right: none;
          background: #fff;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .cpr-table td {
          padding: 1.8pt 2pt;
          border: none;
          vertical-align: top;
          word-break: break-word;
          background: #fff;
        }

        .cpr-table tbody tr { page-break-inside: avoid; }

        /* Alignments */
        .cpr-num { text-align: right  !important; }
        .cpr-cen { text-align: center !important; }
        .cpr-lft { text-align: left   !important; }

        /* ── Amount in words ── */
        .cpr-words {
          margin-top: 3mm;
          font-size: 7.5pt;
          font-weight: bold;
        }

        /* ── Footer image ─────────────────────────────
           Sits at the very end of content — appears on
           the last page naturally, no fixed positioning. */
      .cpr-footer-img {
          display: block;
          width: 210mm;        /* Full A4 Width */
          height: auto;
          /* -7mm offset cancels out the .cpr-wrap padding */
          margin: 10mm 0 0 -7mm; 
          page-break-before: avoid;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        /* ── Page number ─────────────────────────────
           Uses CSS counter via a fixed-position div.
           Positioned in the 7mm bottom margin space. */
        .cpr-pgnum {
          position: fixed;
          bottom: 1.5mm;
          left: 0;
          width: 210mm;
          text-align: center;
          font-size: 6.5pt;
          color: #555;
        }
        .cpr-pgnum::after {
          content: "Page " counter(page) " of " counter(pages);
        }
        .cpr-powered {
          position: fixed;
          bottom: 1.5mm;
          left: 7mm;
          font-size: 6pt;
          color: #050505;
        }

        .no-print { display: none !important; }
      }
    `;
        document.head.appendChild(style);
        return () => {
            const el = document.getElementById(id);
            if (el) el.remove();
        };
    }, []);

    // Build cell class from column definition
    const cellClass = (col) =>
        col?.numeric ? 'cpr-num' : col?.center ? 'cpr-cen' : 'cpr-lft';

    return (
        <div id="cpr-root" aria-hidden="true">

            {/* Page number + powered-by — fixed, sits in bottom margin */}
            <div className="cpr-pgnum" />
            <div className="cpr-powered">Powered by: Sugarian.app</div>

            {/* ── Header image: page 1 only via DOM flow ── */}
            {headerImg && (
                <img src={headerImg} alt="" className="cpr-header-img" />
            )}

            {/* ── Content ── */}
            <div className="cpr-wrap">
                {companyName && <div className="cpr-company">{companyName}</div>}
                {companyGST && <div className="cpr-gst">GSTN: {companyGST}</div>}
                {title && <div className="cpr-title">{title}</div>}
                {subtitle && <div className="cpr-sub">{subtitle}</div>}

                <table className="cpr-table">
                    <thead>
                        <tr>
                            {columns.map((col, i) => (
                                <th
                                    key={i}
                                    className={cellClass(col)}
                                    style={col.printWidth ? { width: col.printWidth } : col.width ? { width: col.width } : {}}
                                >
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {rows.map((item, idx) => {
                            const cells = rowRenderer(item, idx);
                            return (
                                <tr key={idx}>
                                    {cells.map((cell, ci) => (
                                        <td key={ci} className={cellClass(columns[ci])}>
                                            {cell ?? ''}
                                        </td>
                                    ))}
                                </tr>
                            );
                        })}
                    </tbody>

                    {footerValues.length > 0 && (
                        <tfoot>
                            <tr>
                                {footerValues.map((val, fi) => (
                                    <td key={fi} className={cellClass(columns[fi])}>
                                        {val ?? ''}
                                    </td>
                                ))}
                            </tr>
                        </tfoot>
                    )}
                </table>

                {amountInWords && (
                    <div className="cpr-words">
                        Total Amount (In Words): {amountInWords}
                    </div>
                )}

                {/* Footer image: end of content = last page */}
                {footerImg && (
                    <img src={footerImg} alt="" className="cpr-footer-img" />
                )}
            </div>
        </div>
    );
};

export default CommonPrintView;