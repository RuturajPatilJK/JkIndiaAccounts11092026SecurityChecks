// import { useState, useEffect, useCallback } from "react";
// import "../../Common/Fonts/Signika-Bold-normal";
// import "../../Common/Fonts/Signika-Regular-normal";
// import "../../Common/Fonts/Signika-Medium-normal";

// const API_BASE = process.env.REACT_APP_API;

// const fmt = (n) =>
//   Math.abs(n).toLocaleString("en-IN", {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   });

// const S = {
//   root: {
//     background: "#fff",
//     minHeight: "100vh",
//     fontFamily: "Signika, sans-serif",
//     fontSize: 14,
//     color: "#1e293b",
//     padding: "20px",
//   },
//   pageTitle: {
//     padding: "0 0 15px 0",
//     borderBottom: "2px solid #e2e8f0",
//     marginBottom: "20px",
//   },
//   h1: {
//     fontSize: 22,
//     fontWeight: 700,
//     fontFamily: "Signika, sans-serif",
//     color: "#0f172a",
//     margin: 0,
//   },
//   bodyCols: {
//     display: "flex",
//     flexDirection: "row",
//     alignItems: "flex-start",
//     gap: "15px", 
//     width: "100%",
//   },
//   leftCol: {
//     width: "28%", 
//     flexShrink: 0,
//     padding: "15px",
//     background: "#f8fafc",
//     borderRadius: "10px",
//     border: "1px solid #e2e8f0",
//     boxSizing: "border-box",
//   },
//   rightCol: {
//     width: "72%", 
//     flexShrink: 0,
//     minWidth: 0,
//     boxSizing: "border-box",
//   },
//   sectionLabel: {
//     display: "flex",
//     alignItems: "center",
//     gap: 10,
//     marginBottom: 15,
//   },
//   dot: {
//     width: 10,
//     height: 10,
//     borderRadius: "50%",
//     background: "#2563eb",
//   },
//   sectionText: {
//     fontSize: 14,
//     fontWeight: 700,
//     textTransform: "uppercase",
//     letterSpacing: "0.1em",
//   },
//   table: {
//     width: "100%",
//     borderCollapse: "collapse",
//   },
//   th: {
//     fontSize: 11,
//     fontWeight: 700,
//     color: "#64748b",
//     textTransform: "uppercase",
//     paddingBottom: 8,
//     borderBottom: "2px solid #cbd5e1",
//   },
//   acRow: {
//     display: "flex",
//     gap: "6px",
//     alignItems: "baseline",
//     fontSize: 14,
//   },
//   acCodeBold: {
//     fontWeight: 700,
//     color: "#64748b",
//     fontSize: 12,
//   },
//   tdBase: {
//     borderBottom: "1px solid #e2e8f0",
//     padding: "10px 5px",
//     verticalAlign: "top",
//   },
//   textLeft: { textAlign: "left" },
//   amountRight: { textAlign: "right", fontWeight: 600 },
//   debitColor: { color: "#059669" },
//   creditColor: { color: "#dc2626" },

//   bankBlock: {
//     border: "1px solid #e2e8f0",
//     borderRadius: "12px",
//     padding: "18px",
//     marginBottom: "20px",
//     background: "#fff",
//     boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
//   },
//   bankHeader: {
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "space-between",
//     marginBottom: 12,
//     paddingBottom: 8,
//     borderBottom: "1px solid #f1f5f9",
//   },
//   bankName: { fontSize: 18, fontWeight: 700, color: "#1e293b" },

//   // FIXED TOGGLE BUTTON
//   toggleBtn: {
//     background: "#2563eb", // Solid Blue
//     color: "#ffffff",      // White Text
//     border: "none",
//     cursor: "pointer",
//     borderRadius: "6px",
//     width: "32px",
//     height: "32px",
//     fontWeight: "bold",
//     fontSize: "18px",
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     transition: "background 0.2s ease",
//     boxShadow: "0 2px 4px rgba(37, 99, 235, 0.2)",
//   },

//   txnGrid: {
//     display: "grid",
//     gridTemplateColumns: "1fr 1fr", 
//     gap: "25px",
//   },
//   sideLabel: {
//     fontSize: 12,
//     fontWeight: 700,
//     textTransform: "uppercase",
//     marginBottom: 8,
//     padding: "5px 10px",
//     borderRadius: "4px",
//     display: "inline-block",
//   },
//   wrapCell: {
//     wordBreak: "break-word",
//     whiteSpace: "pre-wrap",
//     lineHeight: "1.4",
//     fontSize: 12.5,
//   },
//   totalRow: {
//     borderTop: "1px dotted #64748b",
//     marginTop: "8px",
//     paddingTop: "8px",
//     textAlign: "right",
//     fontWeight: 700,
//     fontSize: 14,
//   }
// };

// export default function AccountsClosingReport({ toDate }) {
//   const companyCode = sessionStorage.getItem("Company_Code");
//   const Year_Code = sessionStorage.getItem("Year_Code")
//   const [balances, setBalances] = useState([]);
//   const [bankData, setBankData] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [collapsedBanks, setCollapsedBanks] = useState({});

//   useEffect(() => {
//     if (!document.getElementById("signika-font")) {
//       const link = document.createElement("link");
//       link.id = "signika-font";
//       link.href = "https://fonts.googleapis.com/css2?family=Signika:wght@300;400;500;600;700&display=swap";
//       link.rel = "stylesheet";
//       document.head.appendChild(link);
//     }
//   }, []);

//   const fetchData = useCallback(async () => {
//     if (!companyCode || !toDate) return;
//     setLoading(true);
//     try {
//       const [balRes, txnRes] = await Promise.all([
//         fetch(`${API_BASE}/getAllCashbankbalance?company_code=${companyCode}&doc_date=${toDate}`),
//         fetch(`${API_BASE}/getcashbankreportgroupwise?company_code=${companyCode}&doc_date=${toDate}&year_code=${Year_Code}`),
//       ]);
//       const [balJson, txnJson] = await Promise.all([balRes.json(), txnRes.json()]);
//       setBalances(balJson);
//       setBankData(txnJson);
//     } catch (e) {
//       console.error(e);
//     } finally {
//       setLoading(false);
//     }
//   }, [companyCode, toDate]);

//   useEffect(() => { fetchData(); }, [fetchData]);

//   const toggleBank = (code) =>
//     setCollapsedBanks((prev) => ({ ...prev, [code]: !prev[code] }));

//   let grandTotalDr = 0;
//   let grandTotalCr = 0;
//   balances.forEach((row) => {
//     const b = parseFloat(row.balance) || 0;
//     if (b >= 0) grandTotalDr += b; else grandTotalCr += Math.abs(b);
//   });

//   const TableSection = ({ records, typeColor, label, total }) => (
//     <div>
//       <div style={{ ...S.sideLabel, background: typeColor === "Dr" ? "#dcfce7" : "#fee2e2", color: typeColor === "Dr" ? "#166534" : "#991b1b" }}>
//         {label}
//       </div>
//       <table style={S.table}>
//         <thead>
//           <tr>
//             <th style={{ ...S.th, ...S.textLeft }}>Tran Type</th>
//             <th style={{ ...S.th, ...S.textLeft }}>Doc No</th>
//             <th style={{ ...S.th, ...S.textLeft }}>A/c Name</th>
//             <th style={{ ...S.th, ...S.textLeft }}>Narration</th>
//             <th style={{ ...S.th, ...S.amountRight }}>Amount</th>
//           </tr>
//         </thead>
//         <tbody>
//           {records.length === 0 ? (
//             <tr><td colSpan={5} style={{ ...S.tdBase, textAlign: "center", color: "#94a3b8", fontSize: 12 }}>—</td></tr>
//           ) : (
//             records.map((r, i) => (
//               <tr key={i}>
//                 <td style={{ ...S.tdBase, ...S.textLeft, fontSize: 12.5 }}>{r.TRAN_TYPE}</td>
//                 <td style={{ ...S.tdBase, ...S.textLeft, fontSize: 12.5 }}>{r.DOC_NO}</td>
//                 <td style={{ ...S.tdBase, ...S.textLeft, ...S.wrapCell, fontWeight: 600 }}>{r.contra_ac_name}</td>
//                 <td style={{ ...S.tdBase, ...S.textLeft, ...S.wrapCell }}>{r.NARRATION}</td>
//                 <td style={{ ...S.tdBase, ...S.amountRight, fontSize: 12.5, color: typeColor === "Dr" ? "#059669" : "#dc2626" }}>{fmt(r.AMOUNT)}</td>
//               </tr>
//             ))
//           )}
//         </tbody>
//       </table>
//       <div style={{ ...S.totalRow, color: typeColor === "Dr" ? "#059669" : "#dc2626" }}>
//         {typeColor} Total: {fmt(total || 0)}
//       </div>
//     </div>
//   );

//   if (loading) return <div style={{ padding: 50, textAlign: "center", fontFamily: "Signika" }}>Loading...</div>;

//   return (
//     <div style={S.root}>
//       <div style={S.pageTitle}>
//         <h1 style={S.h1}>Accounts Closing Report — {toDate}</h1>
//       </div>

//       <div style={S.bodyCols}>
//         {/* LEFT: BALANCES */}
//         <div style={S.leftCol}>
//           <div style={S.sectionLabel}>
//             <span style={S.dot} />
//             <span style={S.sectionText}>Balance Summary</span>
//           </div>
//           <table style={S.table}>
//             <thead>
//               <tr>
//                 <th style={{ ...S.th, ...S.textLeft }}>A/c Details</th>
//                 <th style={{ ...S.th, ...S.amountRight }}>CR (-)</th>
//                 <th style={{ ...S.th, ...S.amountRight }}>DR (+)</th>
//               </tr>
//             </thead>
//             <tbody>
//               {balances.map((row, i) => {
//                 const b = parseFloat(row.balance) || 0;
//                 const isDr = b >= 0;
//                 return (
//                   <tr key={i}>
//                     <td style={{ ...S.tdBase, ...S.textLeft }}>
//                       <div style={S.acRow}>
//                         <span style={S.acCodeBold}>{row.AC_CODE}</span>
//                         <span>{row.Ac_Name_E}</span>
//                       </div>
//                     </td>
//                     <td style={{ ...S.tdBase, ...S.amountRight, ...(!isDr ? S.creditColor : { color: "#cbd5e1" }) }}>
//                       {!isDr ? fmt(Math.abs(b)) : "—"}
//                     </td>
//                     <td style={{ ...S.tdBase, ...S.amountRight, ...(isDr ? S.debitColor : { color: "#cbd5e1" }) }}>
//                       {isDr ? fmt(b) : "—"}
//                     </td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//             <tfoot>
//               <tr>
//                 <td style={{ ...S.tdBase, fontWeight: 800, fontSize: 15 }}>TOTAL</td>
//                 <td style={{ ...S.tdBase, ...S.amountRight, ...S.creditColor, fontSize: 15 }}>{fmt(grandTotalCr)}</td>
//                 <td style={{ ...S.tdBase, ...S.amountRight, ...S.debitColor, fontSize: 15 }}>{fmt(grandTotalDr)}</td>
//               </tr>
//             </tfoot>
//           </table>
//         </div>

//         {/* RIGHT: TRANSACTIONS SIDE-BY-SIDE */}
//         <div style={S.rightCol}>
//           <div style={S.sectionLabel}>
//             <span style={S.dot} />
//             <span style={S.sectionText}>Daily Bank Transactions</span>
//           </div>

//           {bankData.map((bank) => (
//             <div key={bank.AC_CODE} style={S.bankBlock}>
//               <div style={S.bankHeader}>
//                 <span style={S.bankName}>{bank.bankname}</span>
//                 <button 
//                   onClick={() => toggleBank(bank.AC_CODE)}
//                   style={S.toggleBtn}
//                   onMouseOver={(e) => e.target.style.background = "#1d4ed8"}
//                   onMouseOut={(e) => e.target.style.background = "#2563eb"}
//                 >
//                   {collapsedBanks[bank.AC_CODE] ? "+" : "-"}
//                 </button>
//               </div>

//               {!collapsedBanks[bank.AC_CODE] && (
//                 <div style={S.txnGrid}>
//                   <TableSection 
//                     records={bank.credit.records} 
//                     typeColor="Cr" 
//                     label="Credit" 
//                     total={bank.credit.total_amount}
//                   />
//                   <TableSection 
//                     records={bank.debit.records} 
//                     typeColor="Dr" 
//                     label="Debit" 
//                     total={bank.debit.total_amount}
//                   />
//                 </div>
//               )}
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }















import { useState, useEffect, useCallback } from "react";
import "../../Common/Fonts/Signika-Bold-normal";
import "../../Common/Fonts/Signika-Regular-normal";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import PdfPreview from "../../Common/PDFPreview";
import HeaderJK from "../../Assets/HeaderJK.png";
import FooterJK from "../../Assets/FooterJK.png";
import { ScaleLoader } from "react-spinners";
import { Typography } from "@mui/material";

const API_BASE = process.env.REACT_APP_API;

/* ─── Number formatter (en-IN, 2 dp) ─────────────────────────────────────── */
const fmt = (n) =>
  Number(Math.abs(n)).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/* ─── Load image helper (same pattern as generateReportPDF) ──────────────── */
const loadImage = (src) =>
  new Promise((resolve) => {
    if (!src) { resolve(null); return; }
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });



export function generateAccountsClosingPDF({
  toDate = "",
  balances = [],
  bankData = [],
  grandTotalCr = 0,
  grandTotalDr = 0,
  headerImgSrc = null,
  footerImgSrc = null,
  onComplete = () => { },
}) {
  Promise.all([loadImage(headerImgSrc), loadImage(footerImgSrc)]).then(
    ([headerImg, footerImg]) => {

      /* ── Page geometry ──────────────────────────────────────────── */
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const PAGE_W = doc.internal.pageSize.getWidth();
      const PAGE_H = doc.internal.pageSize.getHeight();
      const ML = 7;
      const MR = 7;
      const HEADER_H = headerImg ? 38 : 0;
      const FOOTER_H = footerImg ? 30 : 0;
      const CONTENT_TOP_P2 = 8;
      const FOOTER_AREA = FOOTER_H + 12;
      const PAGE_NUM_Y = PAGE_H - 4;

      /* ── Font helpers ───────────────────────────────────────────── */
      const bold = (sz) => { doc.setFont("Signika-Bold", "normal"); doc.setFontSize(sz); };
      const regular = (sz) => { doc.setFont("Signika-Regular", "normal"); doc.setFontSize(sz); };
      const black = () => doc.setTextColor(0, 0, 0);
      const white = () => doc.setTextColor(255, 255, 255);

      /* ── Shared autoTable config ────────────────────────────────── */
      const tblCfg = {
        margin: { left: ML, right: MR, top: CONTENT_TOP_P2, bottom: FOOTER_AREA },
        tableWidth: PAGE_W - ML - MR,
        styles: {
          font: "Signika-Regular",
          fontSize: 7,
          cellPadding: { top: 0.8, right: 1.5, bottom: 0.8, left: 1.5 },
          textColor: [30, 30, 30],
          lineWidth: 0,
          overflow: "linebreak",
          valign: "top",
        },
        headStyles: {
          font: "Signika-Bold",
          fontSize: 7.5,
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          halign: "center",
        },
        footStyles: {
          font: "Signika-Bold",
          fontSize: 7.5,
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
        },
        showHead: "everyPage",
        showFoot: "lastPage",
        didDrawCell: (data) => {
          const { doc: d, cell, section, column } = data;
          if (section === "head" && column.index === data.table.columns.length - 1) {
            d.setDrawColor(40, 40, 40); d.setLineWidth(0.3);
            d.line(ML, cell.y + cell.height, PAGE_W - MR, cell.y + cell.height);
          }
          if (section === "foot" && column.index === 0) {
            d.setDrawColor(40, 40, 40); d.setLineWidth(0.3);
            d.line(ML, cell.y, PAGE_W - MR, cell.y);
            d.line(ML, cell.y + cell.height, PAGE_W - MR, cell.y + cell.height);
          }
        },
      };

      const sectionBar = (label, y, fill = [30, 41, 59]) => {
        doc.setFillColor(...fill);
        doc.rect(ML, y, PAGE_W - ML - MR, 6, "F");
        bold(8); white();
        doc.text(label.toUpperCase(), ML + 3, y + 4.2);
        return y + 7;
      };

      /* ── Initial Headers ────────────────────────────────────────── */
      if (headerImg) doc.addImage(headerImg, "PNG", 0, 0, PAGE_W, HEADER_H);

      let curY = HEADER_H + 6;
      bold(12); black();
      doc.text("ACCOUNTS CLOSING REPORT", PAGE_W / 2, curY, { align: "center" });
      curY += 5;
      regular(8); doc.setTextColor(80, 80, 80);
      doc.text(toDate, PAGE_W / 2, curY, { align: "center" });
      curY += 6;

      /* ════════════════════════════════════════════════════════════
         SECTION I — Balance Summary
         ════════════════════════════════════════════════════════════ */
      curY = sectionBar("Section I — Balance Summary", curY);

      doc.autoTable({
        ...tblCfg,
        startY: curY,
        head: [["SR", "A/C Code", "Account Name", "Credit (−)", "Debit (+)"]],

        // ── CHANGE 1: pass object { name, avail } for column 2 ──
        body: balances.map((r, i) => {
          const b = parseFloat(r.balance) || 0;
          const avail = parseFloat(r.Avialable) || 0;
          return [
            i + 1,
            r.AC_CODE || "",
            // Object carries both name and available amount
            { name: r.Ac_Name_E || "", avail: avail > 0 ? fmt(avail) : null },
            b < 0 ? fmt(Math.abs(b)) : "—",
            b >= 0 ? fmt(b) : "—",
          ];
        }),

        foot: [["", "Total", "", fmt(grandTotalCr), fmt(grandTotalDr)]],

        columnStyles: {
          0: { cellWidth: 10, halign: "center" },
          1: { cellWidth: 25, halign: "left", font: "Signika-Bold" },
          2: { halign: "left" },
          3: { cellWidth: 35, halign: "right", textColor: [185, 28, 28] },
          4: { cellWidth: 35, halign: "right", textColor: [21, 128, 61] },
        },

        didParseCell: (data) => {
          // Footer alignment
          if (data.section === "foot") {
            if (data.column.index === 3 || data.column.index === 4) data.cell.styles.halign = "right";
            if (data.column.index === 1) data.cell.styles.halign = "left";
          }
          // ── CHANGE 2: expand object into multiline text for row height ──
          if (data.section === "body" && data.column.index === 2) {
            const raw = data.cell.raw;
            if (raw && typeof raw === "object") {
              // Tell autoTable about the lines so row height is calculated correctly
              data.cell.text = raw.avail
                ? [raw.name, raw.avail]
                : [raw.name];
            }
          }
        },

        // ── CHANGE 3: custom draw — name in dark, avail in blue ──
        didDrawCell: (data) => {
          // Re-use the shared head/foot border logic
          const { doc: d, cell, section, column } = data;
          if (section === "head" && column.index === data.table.columns.length - 1) {
            d.setDrawColor(40, 40, 40); d.setLineWidth(0.3);
            d.line(ML, cell.y + cell.height, PAGE_W - MR, cell.y + cell.height);
          }
          if (section === "foot" && column.index === 0) {
            d.setDrawColor(40, 40, 40); d.setLineWidth(0.3);
            d.line(ML, cell.y, PAGE_W - MR, cell.y);
            d.line(ML, cell.y + cell.height, PAGE_W - MR, cell.y + cell.height);
          }

          // Custom render for Account Name column
          if (section === "body" && column.index === 2) {
            const raw = cell.raw;
            if (!raw || typeof raw !== "object") return;

            // Clear the autoTable-rendered text (white out the cell content area)
            doc.setFillColor(255, 255, 255);
            doc.rect(cell.x + 0.4, cell.y + 0.4, cell.width - 0.8, cell.height - 0.8, "F");

            let textY = cell.y + 3;

            // 1. Account Name — dark, regular
            doc.setFont("Signika-Regular", "normal")
              .setFontSize(7)
              .setTextColor(30, 30, 30);
            const nameLines = doc.splitTextToSize(raw.name, cell.width - 3);
            doc.text(nameLines, cell.x + 1.5, textY);

            // 2. Available amount — bold, blue (only when avail exists)
            if (raw.avail) {
              textY += nameLines.length * 3.2;
              doc.setFont("Signika-Bold", "normal")
                .setFontSize(6.5)
                .setTextColor(0, 0, 139);
              doc.text(`Available Balance : ${raw.avail}`, cell.x + 1.5, textY);
            }
          }
        },
      });

      curY = doc.lastAutoTable.finalY + 8;

      /* ════════════════════════════════════════════════════════════
         SECTION II — Daily Bank Transactions
         ════════════════════════════════════════════════════════════ */
      if (curY > PAGE_H - FOOTER_AREA - 15) { doc.addPage(); curY = CONTENT_TOP_P2; }
      curY = sectionBar("Section II — Daily Bank Transactions", curY);

      bankData.forEach((bank) => {
        if (curY > PAGE_H - FOOTER_AREA - 20) { doc.addPage(); curY = CONTENT_TOP_P2; }

        doc.setFillColor(71, 85, 105);
        doc.rect(ML, curY, PAGE_W - ML - MR, 5, "F");
        bold(7.5); white();
        doc.text(`Bank: ${bank.bankname}`, ML + 3, curY + 3.5);
        curY += 6;

        const txns = [
          ...(bank.credit?.records || []).map(r => ({ ...r, _side: "CR" })),
          ...(bank.debit?.records || []).map(r => ({ ...r, _side: "DR" })),
        ];

        doc.autoTable({
          ...tblCfg,
          startY: curY,
          head: [["SR", "Type", "Doc No", "A/C Name & Narration", "Credit (−)", "Debit (+)"]],
          body: txns.map((r, i) => [
            i + 1,
            r.TRAN_TYPE || "",
            r.DOC_NO || "",
            { acName: r.contra_ac_name || "", narration: r.NARRATION || "" },
            r._side === "CR" ? fmt(r.AMOUNT) : "—",
            r._side === "DR" ? fmt(r.AMOUNT) : "—",
          ]),
          foot: [["", "", "", "Bank Totals",
            fmt(bank.credit?.total_amount || 0),
            fmt(bank.debit?.total_amount || 0),
          ]],
          columnStyles: {
            0: { cellWidth: 8, halign: "center" },
            1: { cellWidth: 12 },
            2: { cellWidth: 15 },
            3: { halign: "left" },
            4: { cellWidth: 32, halign: "right", textColor: [185, 28, 28] },
            5: { cellWidth: 32, halign: "right", textColor: [21, 128, 61] },
          },
          didParseCell: (data) => {
            if (data.section === "foot") {
              if (data.column.index === 4 || data.column.index === 5) data.cell.styles.halign = "right";
              if (data.column.index === 3) data.cell.styles.halign = "left";
            }
            if (data.section === "body" && data.column.index === 3) {
              const raw = data.cell.raw;
              if (raw && typeof raw === "object") {
                data.cell.text = [raw.acName, raw.narration];
              }
            }
          },
          didDrawCell: (data) => {
            const { doc: d, cell, section, column } = data;
            if (section === "head" && column.index === data.table.columns.length - 1) {
              d.setDrawColor(40, 40, 40); d.setLineWidth(0.3);
              d.line(ML, cell.y + cell.height, PAGE_W - MR, cell.y + cell.height);
            }
            if (section === "foot" && column.index === 0) {
              d.setDrawColor(40, 40, 40); d.setLineWidth(0.3);
              d.line(ML, cell.y, PAGE_W - MR, cell.y);
              d.line(ML, cell.y + cell.height, PAGE_W - MR, cell.y + cell.height);
            }
            if (section === "body" && column.index === 3) {
              const raw = cell.raw;
              if (!raw || typeof raw !== "object") return;

              doc.setFillColor(255, 255, 255);
              doc.rect(cell.x + 0.4, cell.y + 0.4, cell.width - 0.8, cell.height - 0.8, "F");

              let textY = cell.y + 3;

              // A/C Name — bold
              doc.setFont("Signika-Bold", "normal")
                .setFontSize(7)
                .setTextColor(30, 30, 30);
              const acLines = doc.splitTextToSize(raw.acName, cell.width - 3);
              doc.text(acLines, cell.x + 1.5, textY);

              // Narration — regular, grey, smaller
              if (raw.narration) {
                textY += acLines.length * 3.2;
                doc.setFont("Signika-Regular", "normal")
                  .setFontSize(6)
                  .setTextColor(100, 100, 100);
                const narrLines = doc.splitTextToSize(raw.narration, cell.width - 3);
                doc.text(narrLines, cell.x + 1.5, textY);
              }
            }
          },
        });

        curY = doc.lastAutoTable.finalY + 5;
      });

      /* ── Final Stamping (Page Numbers / Footer Image) ─────────── */
      const totalPages = doc.internal.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        regular(6); doc.setTextColor(130, 130, 130);
        doc.text(`Page ${p} of ${totalPages}`, PAGE_W / 2, PAGE_NUM_Y, { align: "center" });
        doc.text("Powered by: Sugarian.app", ML, PAGE_NUM_Y);

        if (p === 1 && headerImg) {
          doc.addImage(headerImg, "PNG", 0, 0, PAGE_W, HEADER_H);
        }
        if (p === totalPages && footerImg) {
          const imgAspect = footerImg.width / footerImg.height;
          const drawWidth = FOOTER_H * imgAspect;
          const drawX = ML + (PAGE_W - ML - MR - drawWidth) / 2 + 10;
          doc.addImage(footerImg, "PNG", drawX, PAGE_H - FOOTER_H - 6, drawWidth, FOOTER_H);
        }
      }

      onComplete(doc.output("bloburl"));
    }
  );
}


/* ══════════════════════════════════════════════════════════════════════════
   Inline styles
   ══════════════════════════════════════════════════════════════════════════ */
const S = {
  root: {
    background: "#fff",
    minHeight: "100vh",
    fontFamily: "'Signika', sans-serif",
    fontSize: 14,
    color: "#1e293b",
    padding: "20px",
  },
  pageTitle: {
    padding: "0 0 15px 0",
    borderBottom: "2px solid #e2e8f0",
    marginBottom: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  h1: {
    fontSize: 22,
    fontWeight: 700,
    color: "#0f172a",
    margin: 0,
    fontFamily: "'Signika', sans-serif",
  },
  actionBtns: { display: "flex", gap: "10px" },
  btn: {
    padding: "8px 18px",
    borderRadius: "6px",
    border: "none",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    color: "#fff",
    fontFamily: "'Signika', sans-serif",
  },
  bodyCols: {
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: "15px",
    width: "100%",
  },
  leftCol: {
    width: "40%",
    flexShrink: 0,
    padding: "15px",
    background: "#f8fafc",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    boxSizing: "border-box",
  },
  rightCol: { flex: 1, minWidth: 0, boxSizing: "border-box" },
  sectionLabel: { display: "flex", alignItems: "center", gap: 10, marginBottom: 12 },
  dot: { width: 10, height: 10, borderRadius: "50%", background: "#2563eb" },
  sectionText: {
    fontSize: 13,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontFamily: "'Signika', sans-serif",
  },
  /* Balance table */
  tbl: { width: "100%", borderCollapse: "collapse" },
  th: { fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", padding: "6px 5px", borderBottom: "2px solid #cbd5e1", textAlign: "left", fontFamily: "'Signika', sans-serif" },
  thR: { fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", padding: "6px 5px", borderBottom: "2px solid #cbd5e1", textAlign: "right", fontFamily: "'Signika', sans-serif" },
  td: { borderBottom: "1px solid #e2e8f0", padding: "8px 5px", fontSize: 13, verticalAlign: "top", textAlign: "left", fontFamily: "'Signika', sans-serif" },
  tdR: { borderBottom: "1px solid #e2e8f0", padding: "8px 5px", fontSize: 13, verticalAlign: "top", textAlign: "right", fontWeight: 600, fontFamily: "'Signika', sans-serif" },
  acRow: { display: "flex", gap: "5px", alignItems: "baseline" },
  acCode: { fontWeight: 700, color: "#64748b", fontSize: 11 },
  /* Bank block */
  bankBlock: {
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    marginBottom: "18px",
    background: "#fff",
    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
    overflow: "hidden",
  },
  bankHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    background: "#1e293b",
  },
  bankName: { fontSize: 15, fontWeight: 700, color: "#fff", fontFamily: "'Signika', sans-serif" },
  toggleBtn: {
    background: "#2563eb",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    borderRadius: "6px",
    width: "30px",
    height: "30px",
    fontWeight: "bold",
    fontSize: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  /* Transaction table */
  txnWrap: { overflowX: "auto" },
  txnTbl: { width: "100%", borderCollapse: "collapse", minWidth: 700 },
  txnTh: { padding: "8px 10px", fontWeight: 700, fontSize: 11, color: "#64748b", textTransform: "uppercase", borderBottom: "2px solid #cbd5e1", background: "#f8fafc", textAlign: "left", whiteSpace: "nowrap", fontFamily: "'Signika', sans-serif" },
  txnThR: { padding: "8px 10px", fontWeight: 700, fontSize: 11, color: "#64748b", textTransform: "uppercase", borderBottom: "2px solid #cbd5e1", background: "#f8fafc", textAlign: "right", whiteSpace: "nowrap", fontFamily: "'Signika', sans-serif" },
  txnTd: { padding: "7px 10px", borderBottom: "1px solid #f1f5f9", fontSize: 12.5, verticalAlign: "top", wordBreak: "break-word", lineHeight: "1.4", textAlign: "left", fontFamily: "'Signika', sans-serif" },
  txnTdR: { padding: "7px 10px", borderBottom: "1px solid #f1f5f9", fontSize: 12.5, verticalAlign: "top", textAlign: "right", fontWeight: 600, fontFamily: "'Signika', sans-serif" },
  txnFootL: { padding: "9px 10px", fontWeight: 800, fontSize: 13, background: "#f1f5f9", borderTop: "2px solid #cbd5e1", textAlign: "left", fontFamily: "'Signika', sans-serif" },
  txnFootR: { padding: "9px 10px", fontWeight: 800, fontSize: 13, background: "#f1f5f9", borderTop: "2px solid #cbd5e1", textAlign: "right", fontFamily: "'Signika', sans-serif" },
  overlay: {
    position: "fixed", top: 0, left: 0,
    width: "100vw", height: "100vh",
    background: "rgba(255,255,255,0.88)",
    zIndex: 9999,
    display: "flex", flexDirection: "column",
    justifyContent: "center", alignItems: "center",
  },
};

/* ─── Merged transaction table (screen UI) ───────────────────────────────── */
function MergedTxnTable({ bank }) {
  const allRows = [
    ...(bank.credit?.records || []).map((r) => ({ ...r, _side: "CR" })),
    ...(bank.debit?.records || []).map((r) => ({ ...r, _side: "DR" })),
  ];
  const crTotal = bank.credit?.total_amount || 0;
  const drTotal = bank.debit?.total_amount || 0;

  return (
    <div style={S.txnWrap}>
      <table style={S.txnTbl}>
        <thead>
          <tr>
            <th style={S.txnTh}>Tran Type</th>
            <th style={S.txnTh}>Doc No</th>
            <th style={{ ...S.txnTh, minWidth: 130 }}>A/c Name</th>
            <th style={{ ...S.txnTh, minWidth: 180 }}>Narration</th>
            <th style={{ ...S.txnThR, color: "#dc2626" }}>Credit (−)</th>
            <th style={{ ...S.txnThR, color: "#059669" }}>Debit (+)</th>
          </tr>
        </thead>
        <tbody>
          {allRows.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ ...S.txnTd, textAlign: "center", color: "#94a3b8" }}>
                No transactions
              </td>
            </tr>
          ) : (
            allRows.map((row, i) => {
              const isCr = row._side === "CR";
              return (
                <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>
                  <td style={S.txnTd}>{row.TRAN_TYPE || ""}</td>
                  <td style={S.txnTd}>{row.DOC_NO || ""}</td>
                  <td style={{ ...S.txnTd, fontWeight: 600 }}>{row.contra_ac_name || ""}</td>
                  <td style={S.txnTd}>{row.NARRATION || ""}</td>
                  <td style={{ ...S.txnTdR, color: isCr ? "#dc2626" : "#cbd5e1" }}>
                    {isCr ? fmt(row.AMOUNT) : "—"}
                  </td>
                  <td style={{ ...S.txnTdR, color: !isCr ? "#059669" : "#cbd5e1" }}>
                    {!isCr ? fmt(row.AMOUNT) : "—"}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={4} style={S.txnFootR}>Totals</td>
            <td style={{ ...S.txnFootR, color: "#dc2626" }}>{fmt(crTotal)}</td>
            <td style={{ ...S.txnFootR, color: "#059669" }}>{fmt(drTotal)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

/* ─── Main Component ──────────────────────────────────────────────────────── */
export default function AccountsClosingReport({ toDate }) {
  const companyCode = sessionStorage.getItem("Company_Code");
  const Year_Code = sessionStorage.getItem("Year_Code");

  const [balances, setBalances] = useState([]);
  const [bankData, setBankData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [collapsedBanks, setCollapsedBanks] = useState({});
  const [pdfPreview, setPdfPreview] = useState(null);

  useEffect(() => {
    if (!document.getElementById("signika-font")) {
      const link = document.createElement("link");
      link.id = "signika-font";
      link.href = "https://fonts.googleapis.com/css2?family=Signika:wght@300;400;500;600;700&display=swap";
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
  }, []);

  const fetchData = useCallback(async () => {
    if (!companyCode || !toDate) return;
    setLoading(true);
    try {
      const [balRes, txnRes] = await Promise.all([
        fetch(`${API_BASE}/getAllCashbankbalance?company_code=${companyCode}&doc_date=${toDate}`),
        fetch(`${API_BASE}/getcashbankreportgroupwise?company_code=${companyCode}&doc_date=${toDate}&year_code=${Year_Code}`),
      ]);
      const [balJson, txnJson] = await Promise.all([balRes.json(), txnRes.json()]);
      setBalances(balJson);
      setBankData(txnJson);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [companyCode, toDate, Year_Code]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleBank = (code) =>
    setCollapsedBanks((prev) => ({ ...prev, [code]: !prev[code] }));

  let grandTotalDr = 0, grandTotalCr = 0;
  balances.forEach((row) => {
    const b = parseFloat(row.balance) || 0;
    if (b >= 0) grandTotalDr += b;
    else grandTotalCr += Math.abs(b);
  });

  /* ── Print ────────────────────────────────────────────────────────── */
  const handlePrint = () => {
    if (!balances.length && !bankData.length) return;
    setIsPrinting(true);
    setPdfPreview(null);
    setTimeout(() => {
      generateAccountsClosingPDF({
        toDate,
        balances,
        bankData,
        grandTotalCr,
        grandTotalDr,
        headerImgSrc: HeaderJK,
        footerImgSrc: FooterJK,
        onComplete: (url) => {
          setPdfPreview(url);
          setIsPrinting(false);
        },
      });
    }, 50);
  };

  /* ── Excel ────────────────────────────────────────────────────────── */
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    const aoa = [];

    aoa.push([`Accounts Closing Report — ${toDate}`]);
    aoa.push([]);
    aoa.push(["BALANCE SUMMARY"]);
    aoa.push(["SR", "A/c Code", "A/c Name", "CR (−)", "DR (+)"]);
    balances.forEach((row, idx) => {
      const b = parseFloat(row.balance) || 0;
      const isDr = b >= 0;
      aoa.push([idx + 1, row.AC_CODE || "", row.Ac_Name_E || "",
      !isDr ? Math.abs(b) : "", isDr ? b : ""]);
    });
    aoa.push(["", "TOTAL", "", grandTotalCr, grandTotalDr]);
    aoa.push([]); aoa.push([]);
    aoa.push(["DAILY BANK TRANSACTIONS"]); aoa.push([]);

    bankData.forEach((bank) => {
      aoa.push([bank.bankname]);
      aoa.push(["SR", "Tran Type", "Doc No", "A/c Name", "Narration", "Credit (−)", "Debit (+)"]);
      let sr = 1;
      (bank.credit?.records || []).forEach((r) =>
        aoa.push([sr++, r.TRAN_TYPE || "", r.DOC_NO || "", r.contra_ac_name || "", r.NARRATION || "", parseFloat(r.AMOUNT) || 0, ""])
      );
      (bank.debit?.records || []).forEach((r) =>
        aoa.push([sr++, r.TRAN_TYPE || "", r.DOC_NO || "", r.contra_ac_name || "", r.NARRATION || "", "", parseFloat(r.AMOUNT) || 0])
      );
      aoa.push(["", "", "", "", "Total",
        parseFloat(bank.credit?.total_amount || 0),
        parseFloat(bank.debit?.total_amount || 0),
      ]);
      aoa.push([]);
    });

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!cols"] = [{ wch: 6 }, { wch: 16 }, { wch: 18 }, { wch: 35 }, { wch: 45 }, { wch: 18 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, ws, "AccountsClosingReport");
    XLSX.writeFile(wb, `AccountsClosingReport_${toDate}.xlsx`);
  };

  /* ── Render ───────────────────────────────────────────────────────── */
  if (loading)
    return (
      <div style={{ padding: 50, textAlign: "center", fontFamily: "'Signika', sans-serif" }}>
        Loading…
      </div>
    );

  return (
    <div style={S.root}>

      {/* Header row */}
      <div style={S.pageTitle}>
        <h1 style={S.h1}>Accounts Closing Report — {toDate}</h1>
        <div style={S.actionBtns}>
          <button
            style={{ ...S.btn, background: "#c62828" }}
            onClick={handlePrint}
            disabled={isPrinting || (!balances.length && !bankData.length)}
          >
            Print
          </button>
          <button
            style={{ ...S.btn, background: "#2e7d32" }}
            onClick={handleExportExcel}
            disabled={!balances.length && !bankData.length}
          >
            Export
          </button>
        </div>
      </div>

      {/* PDF preview */}
      {pdfPreview && (
        <PdfPreview pdfData={pdfPreview} label="AccountsReport" />
      )}

      <div style={S.bodyCols}>

        {/* LEFT — Balance Summary */}
        <div style={S.leftCol}>
          <div style={S.sectionLabel}>
            <span style={S.dot} />
            <span style={S.sectionText}>Balance Summary</span>
          </div>
          <table style={S.tbl}>
            <thead>
              <tr>
                <th style={S.th}>A/c Details</th>
                <th style={S.thR}>CR (−)</th>
                <th style={S.thR}>DR (+)</th>
              </tr>
            </thead>
            <tbody>
              {balances.map((row, i) => {
                const b = parseFloat(row.balance) || 0;
                const isDr = b >= 0;
                return (
                  <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>
                    <td style={S.td}>
                      <div style={S.acRow}>
                        <span style={S.acCode}>{row.AC_CODE}</span>
                        <span>{row.Ac_Name_E}</span> - {parseFloat(row.Avialable) > 0 && (
                          <span style={{ color: '#00008B', fontWeight: 'bold' }}>{fmt(row.Avialable)}</span>
                        )}
                      </div>
                    </td>
                    <td style={{ ...S.tdR, color: !isDr ? "#dc2626" : "#cbd5e1" }}>
                      {!isDr ? fmt(Math.abs(b)) : "—"}
                    </td>
                    <td style={{ ...S.tdR, color: isDr ? "#059669" : "#cbd5e1" }}>
                      {isDr ? fmt(b) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: "2px solid #cbd5e1" }}>
                <td style={{ ...S.tdR, fontWeight: 800, fontSize: 14 }}>TOTAL</td>
                <td style={{ ...S.tdR, color: "#dc2626", fontWeight: 800, fontSize: 14 }}>
                  {fmt(grandTotalCr)}
                </td>
                <td style={{ ...S.tdR, color: "#059669", fontWeight: 800, fontSize: 14 }}>
                  {fmt(grandTotalDr)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* RIGHT — Daily Bank Transactions */}
        <div style={S.rightCol}>
          <div style={S.sectionLabel}>
            <span style={S.dot} />
            <span style={S.sectionText}>Daily Bank Transactions</span>
          </div>

          {bankData.length === 0 && (
            <div style={{ color: "#94a3b8", padding: "20px 0" }}>
              No bank transaction data available.
            </div>
          )}

          {bankData.map((bank) => (
            <div key={bank.AC_CODE} style={S.bankBlock}>
              <div style={S.bankHeader}>
                <span style={S.bankName}>{bank.bankname}</span>
                <button
                  onClick={() => toggleBank(bank.AC_CODE)}
                  style={S.toggleBtn}
                  onMouseOver={(e) => (e.currentTarget.style.background = "#1d4ed8")}
                  onMouseOut={(e) => (e.currentTarget.style.background = "#2563eb")}
                >
                  {collapsedBanks[bank.AC_CODE] ? "+" : "−"}
                </button>
              </div>
              {!collapsedBanks[bank.AC_CODE] && <MergedTxnTable bank={bank} />}
            </div>
          ))}
        </div>
      </div>

      {/* Generating overlay */}
      {isPrinting && (
        <div style={S.overlay}>
          <ScaleLoader color="#1a237e" height={40} />
          <Typography sx={{ mt: 2, fontWeight: 700, color: "#1a237e", fontFamily: "'Signika', sans-serif" }}>
            Generating PDF…
          </Typography>
        </div>
      )}
    </div>
  );
}