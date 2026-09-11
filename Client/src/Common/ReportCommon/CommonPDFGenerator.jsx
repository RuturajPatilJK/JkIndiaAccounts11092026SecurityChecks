// import { jsPDF } from 'jspdf';
// import 'jspdf-autotable';
// import '../../Common/Fonts/Signika-Bold-normal';
// import '../../Common/Fonts/Signika-Regular-normal';

// // ── helpers ────────────────────────────────────────────────────
// const loadImage = (src) =>
//   new Promise((resolve) => {
//     if (!src) { resolve(null); return; }
//     const img = new Image();
//     img.onload  = () => resolve(img);
//     img.onerror = () => resolve(null);
//     img.src = src;
//   });


// export const generateReportPDF = ({
//   title          = '',
//   subtitle       = '',
//   companyName    = '',
//   companyGST     = '',
//   columns        = [],
//   columnWidths   = [],
//   rows           = [],
//   footerRow      = [],
//   numericCols    = [],
//   centerCols     = [],
//   amountInWords  = '',
//   headerImgSrc   = null,
//   footerImgSrc   = null,
//   onComplete     = () => {},
// }) => {
//   Promise.all([loadImage(headerImgSrc), loadImage(footerImgSrc)]).then(
//     ([headerImg, footerImg]) => {

//       const doc     = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
//       const PAGE_W  = doc.internal.pageSize.getWidth();   // 210 mm
//       const PAGE_H  = doc.internal.pageSize.getHeight();  // 297 mm
//       const ML      = 7;   // left margin
//       const MR      = 7;   // right margin
//       const HEADER_H = headerImg ? 38 : 0;  // header image height
//       const FOOTER_H = footerImg ? 30 : 0;  // footer image height

//       // ── Fixed layout constants ─────────────────────────────
//       const CONTENT_TOP   = 8;                // page 2+ table top (mm)
//       const FOOTER_AREA   = FOOTER_H + 10;    // reserved at bottom for footer + page num
//       const PAGE_NUM_Y    = PAGE_H - 4;       // Y for page number text

//       // ── Build title block to measure its height ────────────
//       const titleParts = [];
//       if (companyName) titleParts.push({ text: companyName.toUpperCase(), size: 10.5, bold: true,  color: [0,0,0]     });
//       if (companyGST)  titleParts.push({ text: `GSTN: ${companyGST}`,     size: 7.5,  bold: false, color: [60,60,60]  });
//       if (title)       titleParts.push({ text: title.toUpperCase(),        size: 11,   bold: true,  color: [0,0,0], underline: true });
//       if (subtitle)    titleParts.push({ text: subtitle,                   size: 8,    bold: false, color: [80,80,80]  });

//       const LINE_H       = 5.5;
//       const titleBlockH  = titleParts.length * LINE_H;
//       const titleStartY  = HEADER_H + 6;
//       const tableStartY  = titleStartY + titleBlockH + 2;

//       // ── Column styles ──────────────────────────────────────
//       const colStyles = {};
//       numericCols.forEach(i => { colStyles[i] = { halign: 'right'  }; });
//       centerCols.forEach(i  => { colStyles[i] = { halign: 'center' }; });
//       if (columnWidths.length === columns.length) {
//         columns.forEach((_, i) => {
//           colStyles[i] = { ...(colStyles[i] || {}), cellWidth: columnWidths[i] };
//         });
//       }

//       // ── Draw autoTable ─────────────────────────────────────
//       doc.autoTable({
//         startY    : tableStartY,
//         head      : [columns],
//         body      : rows,
//         foot      : footerRow.length ? [footerRow] : [],
//         showFoot  : 'lastPage',

//         margin : {
//           top    : CONTENT_TOP,
//           bottom : FOOTER_AREA,
//           left   : ML,
//           right  : MR,
//         },

//         tableWidth : PAGE_W - ML - MR,

//         styles : {
//           font        : 'Signika-Regular',
//           fontSize    : 6.5,
//           cellPadding : { top: 1.5, right: 2, bottom: 1.5, left: 2 },
//           textColor   : [30, 30, 30],
//           lineWidth   : 0,
//           overflow    : 'linebreak',
//           valign      : 'top',
//         },

//         headStyles : {
//           font        : 'Signika-Bold',
//           fontSize    : 7,
//           fillColor   : [255, 255, 255],
//           textColor   : [0, 0, 0],
//           halign      : 'center',
//           lineWidth   : 0,
//           cellPadding : { top: 2.5, right: 2, bottom: 2.5, left: 2 },
//         },

//         footStyles : {
//           font      : 'Signika-Bold',
//           fontSize  : 6.5,
//           fillColor : [255, 255, 255],
//           textColor : [0, 0, 0],
//           lineWidth : 0,
//         },

//         columnStyles       : colStyles,
//         alternateRowStyles : { fillColor: [255, 255, 255] },

//         didDrawCell: (data) => {
//           const { doc: d, cell, section } = data;
//           const lastColIdx = columns.length - 1;

//           if (section === 'head' && data.column.index === lastColIdx) {
//             d.setDrawColor(40, 40, 40);
//             d.setLineWidth(0.4);
//             d.line(ML, cell.y + cell.height, PAGE_W - MR, cell.y + cell.height);
//           }

//           if (section === 'foot' && data.column.index === 0) {
//             d.setDrawColor(40, 40, 40);
//             d.setLineWidth(0.4);
//             d.line(ML, cell.y,                PAGE_W - MR, cell.y);
//             d.line(ML, cell.y + cell.height,  PAGE_W - MR, cell.y + cell.height);
//           }
//         },

//         didDrawPage: () => {},
//       });

//       // ── Amount in words (last page, below table) ──────────
//       if (amountInWords) {
//         const lastY = doc.lastAutoTable.finalY + 5;
//         doc.setPage(doc.internal.getNumberOfPages());
//         doc.setFont('Signika-Bold', 'normal');
//         doc.setFontSize(7.5);
//         doc.setTextColor(0, 0, 0);
//         doc.text(`Total Amount (In Words): ${amountInWords}`, ML, lastY);
//       }

//       // ── Post-process: paint header/footer/page-number on every page ─
//       const totalPages = doc.internal.getNumberOfPages();

//       for (let p = 1; p <= totalPages; p++) {
//         doc.setPage(p);

//         // ════ PAGE 1: header image + title block ════════════
//         if (p === 1) {
//           if (headerImg) {
//             doc.addImage(headerImg, 'PNG', 0, 0, PAGE_W, HEADER_H);
//           }

//           let ty = titleStartY;
//           for (const part of titleParts) {
//             doc.setFont('Signika-' + (part.bold ? 'Bold' : 'Regular'), 'normal');
//             doc.setFontSize(part.size);
//             doc.setTextColor(...part.color);
//             doc.text(part.text, PAGE_W / 2, ty, { align: 'center' });

//             if (part.underline) {
//               const tw = doc.getTextWidth(part.text);
//               doc.setDrawColor(0, 0, 0);
//               doc.setLineWidth(0.25);
//               doc.line(PAGE_W / 2 - tw / 2, ty + 0.7, PAGE_W / 2 + tw / 2, ty + 0.7);
//             }
//             ty += LINE_H;
//           }
//         }

//         // ════ EVERY PAGE: page number + powered-by ══════════
//         doc.setFont('Signika-Regular', 'normal');
//         doc.setFontSize(6.5);
//         doc.setTextColor(130, 130, 130);
//         doc.text(`Page ${p} of ${totalPages}`, PAGE_W / 2, PAGE_NUM_Y, { align: 'center' });
//         doc.text('Powered by: Sugarian.app', ML, PAGE_NUM_Y);

//         // ════ LAST PAGE: footer image (shifted right) ═══════
//         if (p === totalPages && footerImg) {
//           const footerY     = PAGE_H - FOOTER_H - 6;
//           const imgAspect   = footerImg.width / footerImg.height;
//           const drawWidth   = FOOTER_H * imgAspect;
          
//           // Shift 10mm to the right from center (increase for more right shift)
//           const drawX       = ML + (PAGE_W - ML - MR - drawWidth) / 2 + 10;
          
//           doc.addImage(footerImg, 'PNG', drawX, footerY, drawWidth, FOOTER_H);
//         }
//       }

//       onComplete(doc.output('bloburl'));
//     }
//   );
// };


// export const generateLedgerPDF = ({
//   companyName       = '',
//   useHeaderImage    = true,
//   headerImgSrc      = null,
//   footerImgSrc      = null,
//   logoSrc           = null,
//   addressLines      = [],
//   accountName       = '',
//   accountCode       = '',
//   accountAddress    = [],
//   accountCity       = '',
//   accountGST        = '',
//   accountEmail      = '',
//   fromDate          = '',
//   toDate            = '',
//   summary           = {},
//   rows              = [],
//   totals            = { debit: 0, credit: 0 },
//   onComplete        = () => {},
// }) => {
//   Promise.all([
//     loadImage(headerImgSrc),
//     loadImage(footerImgSrc),
//     loadImage(logoSrc),
//   ]).then(([headerImg, footerImg, logoImg]) => {

//     const doc     = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
//     const PAGE_W  = doc.internal.pageSize.getWidth();
//     const PAGE_H  = doc.internal.pageSize.getHeight();
//     const ML      = 10;
//     const MR      = 10;
//     const HEADER_H = 38;
//     const FOOTER_H = footerImg ? 30 : 0;
//     const USABLE_BOTTOM = PAGE_H - FOOTER_H - 12;   
//     const PAGE_NUM_Y    = PAGE_H - 4;

//     const bold    = (sz) => { doc.setFont('Signika-Bold',    'normal'); doc.setFontSize(sz); };
//     const regular = (sz) => { doc.setFont('Signika-Regular', 'normal'); doc.setFontSize(sz); };
//     const color   = (r, g, b) => doc.setTextColor(r, g, b);
//     const black   = () => color(0, 0, 0);
//     const grey    = () => color(80, 80, 80);
//     const green   = () => color(0, 128, 0);
//     const hline   = (y, x1 = ML, x2 = PAGE_W - MR, w = 0.3) => {
//       doc.setDrawColor(80, 80, 80);
//       doc.setLineWidth(w);
//       doc.line(x1, y, x2, y);
//     };

//     let Y = 0; 

//     const drawColHeader = () => {
//       hline(Y - 1);
//       bold(7.5); black();
//       doc.text('Date',         ML + 2,      Y + 3.5);
//       doc.text('Particulars',  ML + 25,     Y + 3.5);
//       doc.text('Vch Type',     ML + 87,     Y + 3.5, { align: 'center' });
//       doc.text('Vch No.',      ML + 105,    Y + 3.5, { align: 'center' });
//       doc.text('Debit',        PAGE_W - MR - 52, Y + 3.5, { align: 'right' });
//       doc.text('Credit',       PAGE_W - MR - 28, Y + 3.5, { align: 'right' });
//       doc.text('Balance',      PAGE_W - MR,      Y + 3.5, { align: 'right' });
//       hline(Y + 6);
//       Y += 10;
//     };

//     const drawPage1Header = () => {
//       if (useHeaderImage && headerImg) {
//         doc.addImage(headerImg, 'PNG', 0, 0, PAGE_W, HEADER_H);
//       } else if (logoImg) {
//         doc.addImage(logoImg, 'PNG', ML, 5, 28, 28);
//         bold(13); black();
//         doc.text(companyName, ML + 32, 12);
//         regular(8.5); grey();
//         addressLines.forEach((line, i) => doc.text(line, ML + 32, 18 + i * 4.5));
//       }

//       hline(HEADER_H + 2);
//       bold(10); green();
//       doc.text('LEDGER ACCOUNT', PAGE_W / 2, HEADER_H + 8, { align: 'center' });
//       black();
//       hline(HEADER_H + 11);

//       let LY = HEADER_H + 17;
//       regular(8); grey();
//       doc.text('To,', ML + 2, LY); LY += 5;
//       bold(8.5); green();
//       doc.text(`${accountName} (${accountCode})`, ML + 2, LY); LY += 5;
//       regular(8); black();
//       accountAddress.forEach(line => { doc.text(line, ML + 2, LY); LY += 4.5; });
//       if (accountCity) { doc.text(accountCity, ML + 2, LY); LY += 4.5; }
//       if (accountGST)  { doc.text(`GST: ${accountGST}`, ML + 2, LY); LY += 4.5; }
//       if (accountEmail){ doc.text(`Email: ${accountEmail}`, ML + 2, LY); }

//       const SX  = PAGE_W / 2 + 12; 
//       const RX  = PAGE_W - MR - 2; 
//       let   RY  = HEADER_H + 17;

//       regular(7.5); grey();
//       doc.text(`Ledger from ${fromDate} to ${toDate}`, SX, RY); RY += 5;
//       bold(8); black();
//       doc.text('SUMMARY', SX, RY); RY += 5;
//       regular(7.5);

//       const sumRows = [
//         { label: 'Opening Balance',  val: `${summary.openingBalance} Cr.` },
//         { label: 'Credited Amount',  val: `${summary.creditedAmount} Cr.` },
//         { label: 'Debited Amount',   val: `${summary.debitedAmount} Dr.`  },
//         { label: 'Closing Balance',  val: summary.closingBalance, bold: true },
//       ];
//       sumRows.forEach((r, i) => {
//         const isLast = i === sumRows.length - 1;
//         if (isLast) {
//           hline(RY - 1, SX, RX + 5);
//           bold(7.5);
//         } else {
//           regular(7.5);
//         }
//         black();
//         doc.text(r.label, SX, RY);
//         doc.text(r.val,   RX + 5, RY, { align: 'right' });
//         if (isLast) hline(RY + 2, SX, RX + 5);
//         RY += 5;
//       });

//       Y = Math.max(LY, RY) + 4;
//       drawColHeader();
//     };

//     drawPage1Header();

//     const ROW_H_BASE = 5;  
//     const LINE_H     = 4.5;

//     for (let i = 0; i < rows.length; i++) {
//       const item     = rows[i];
//       const narLines = doc.splitTextToSize(item.narration || '', 55);
//       const rowH     = Math.max(ROW_H_BASE, narLines.length * LINE_H);

//       if (Y + rowH + 4 > USABLE_BOTTOM) {
//         _drawPageFooter(false);
//         doc.addPage();
//         Y = CONTENT_TOP_P2 + 4;
//         drawColHeader();
//       }

//       regular(7.5); black();
//       doc.text(item.date     || '', ML + 2,           Y + 2);
//       doc.text(item.tranType || '', ML + 87,           Y + 2, { align: 'center' });
//       doc.text(String(item.vchNo || ''), ML + 105,    Y + 2, { align: 'center' });

//       if (parseFloat(item.debit || 0) > 0) color(150, 0, 0);
//       else grey();
//       doc.text(item.debit  || '0.00', PAGE_W - MR - 52, Y + 2, { align: 'right' });

//       if (parseFloat(item.credit || 0) > 0) color(0, 100, 0);
//       else grey();
//       doc.text(item.credit || '0.00', PAGE_W - MR - 28, Y + 2, { align: 'right' });

//       black();
//       doc.text(item.balance || '0.00', PAGE_W - MR, Y + 2, { align: 'right' });

//       regular(6.5); grey();
//       doc.text(item.drcr || '', PAGE_W - MR + 1, Y + 2);

//       regular(7.5); black();
//       narLines.forEach((line, li) => doc.text(line, ML + 25, Y + 2 + li * LINE_H));

//       Y += rowH;
//     }

//     if (Y + 10 > USABLE_BOTTOM) {
//       _drawPageFooter(false);
//       doc.addPage();
//       Y = CONTENT_TOP_P2 + 4;
//       drawColHeader();
//     }

//     const net = totals.debit - totals.credit;
//     hline(Y - 1);
//     bold(7.5); black();
//     doc.text(String(totals.debit.toFixed(2)),      PAGE_W - MR - 52, Y + 3, { align: 'right' });
//     doc.text(String(totals.credit.toFixed(2)),     PAGE_W - MR - 28, Y + 3, { align: 'right' });
//     doc.text(String(Math.abs(net).toFixed(2)),     PAGE_W - MR,      Y + 3, { align: 'right' });
//     regular(7); grey();
//     doc.text(net > 0 ? 'Dr.' : 'Cr.', PAGE_W - MR + 1, Y + 3);
//     hline(Y + 6);
//     regular(7.5); grey();
//     doc.text('*** END OF LEDGER ***', PAGE_W / 2, Y + 10, { align: 'center' });
//     Y += 14;

//     const totalPages = doc.getNumberOfPages();
//     for (let p = 1; p <= totalPages; p++) {
//       doc.setPage(p);
//       regular(6.5); color(130, 130, 130);
//       doc.text(`Page ${p} of ${totalPages}`, PAGE_W / 2, PAGE_NUM_Y, { align: 'center' });
//       doc.text('Powered by: Sugarian.app', ML, PAGE_NUM_Y);

//       // ════ LAST PAGE: footer image (shifted right) ═════════
//       if (p === totalPages && footerImg) {
//         const imgAspect = footerImg.width / footerImg.height;
//         const drawWidth = FOOTER_H * imgAspect;
        
//         // Shift 10mm to the right from center (change +10 to move more/less)
//         const drawX     = ML + (PAGE_W - ML - MR - drawWidth) / 2 + 10;
        
//         doc.addImage(footerImg, 'PNG', drawX, PAGE_H - FOOTER_H - 4, drawWidth, FOOTER_H);
//       }
//     }

//     onComplete(doc.output('bloburl'));
//     function _drawPageFooter(showImage) {}
//   });
// };

// const CONTENT_TOP_P2 = 8;













import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import '../../Common/Fonts/Signika-Bold-normal';
import '../../Common/Fonts/Signika-Regular-normal';

// ── helpers ────────────────────────────────────────────────────
const loadImage = (src) =>
  new Promise((resolve) => {
    if (!src) { resolve(null); return; }
    const img = new Image();
    img.onload  = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });


export const generateReportPDF = ({
  title          = '',
  subtitle       = '',
  companyName    = '',
  companyGST     = '',
  columns        = [],
  columnWidths   = [],
  rows           = [],
  footerRow      = [],   // single footer row (legacy support)
  footerRows     = [],   // ✅ NEW: multiple footer rows — takes priority if provided
  numericCols    = [],
  centerCols     = [],
  amountInWords  = '',
  headerImgSrc   = null,
  footerImgSrc   = null,
  onComplete     = () => {},
}) => {
  Promise.all([loadImage(headerImgSrc), loadImage(footerImgSrc)]).then(
    ([headerImg, footerImg]) => {

      const doc     = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const PAGE_W  = doc.internal.pageSize.getWidth();   // 210 mm
      const PAGE_H  = doc.internal.pageSize.getHeight();  // 297 mm
      const ML      = 7;   // left margin
      const MR      = 7;   // right margin
      const HEADER_H = headerImg ? 38 : 0;  // header image height
      const FOOTER_H = footerImg ? 30 : 0;  // footer image height

      // ── Fixed layout constants ─────────────────────────────
      const CONTENT_TOP   = 8;                // page 2+ table top (mm)
      const FOOTER_AREA   = FOOTER_H + 10;    // reserved at bottom for footer + page num
      const PAGE_NUM_Y    = PAGE_H - 4;       // Y for page number text

      // ── Build title block to measure its height ────────────
      const titleParts = [];
      if (companyName) titleParts.push({ text: companyName.toUpperCase(), size: 10.5, bold: true,  color: [0,0,0]     });
      if (companyGST)  titleParts.push({ text: `GSTN: ${companyGST}`,     size: 7.5,  bold: false, color: [60,60,60]  });
      if (title)       titleParts.push({ text: title.toUpperCase(),        size: 11,   bold: true,  color: [0,0,0], underline: true });
      if (subtitle)    titleParts.push({ text: subtitle,                   size: 8,    bold: false, color: [80,80,80]  });

      const LINE_H       = 5.5;
      const titleBlockH  = titleParts.length * LINE_H;
      const titleStartY  = HEADER_H + 6;
      const tableStartY  = titleStartY + titleBlockH + 2;

      // ── Column styles ──────────────────────────────────────
      const colStyles = {};
      numericCols.forEach(i => { colStyles[i] = { halign: 'right'  }; });
      centerCols.forEach(i  => { colStyles[i] = { halign: 'center' }; });
      if (columnWidths.length === columns.length) {
        columns.forEach((_, i) => {
          colStyles[i] = { ...(colStyles[i] || {}), cellWidth: columnWidths[i] };
        });
      }

      // ── Resolve footer rows ────────────────────────────────
      // footerRows (array of rows) takes priority over legacy footerRow (single row)
      const resolvedFooterRows =
        footerRows.length > 0
          ? footerRows
          : footerRow.length > 0
          ? [footerRow]
          : [];

      // ── Draw autoTable ─────────────────────────────────────
      doc.autoTable({
        startY    : tableStartY,
        head      : [columns],
        body      : rows,
        foot      : resolvedFooterRows,   // ✅ now supports multiple footer rows
        showFoot  : 'lastPage',

        margin : {
          top    : CONTENT_TOP,
          bottom : FOOTER_AREA,
          left   : ML,
          right  : MR,
        },

        tableWidth : PAGE_W - ML - MR,

        styles : {
          font        : 'Signika-Regular',
          fontSize    : 6.5,
          cellPadding : { top: 1.5, right: 2, bottom: 1.5, left: 2 },
          textColor   : [30, 30, 30],
          lineWidth   : 0,
          overflow    : 'linebreak',
          valign      : 'top',
        },

        headStyles : {
          font        : 'Signika-Bold',
          fontSize    : 7,
          fillColor   : [255, 255, 255],
          textColor   : [0, 0, 0],
          halign      : 'center',
          lineWidth   : 0,
          cellPadding : { top: 2.5, right: 2, bottom: 2.5, left: 2 },
        },

        footStyles : {
          font      : 'Signika-Bold',
          fontSize  : 6.5,
          fillColor : [255, 255, 255],
          textColor : [0, 0, 0],
          lineWidth : 0,
        },

        columnStyles       : colStyles,
        alternateRowStyles : { fillColor: [255, 255, 255] },

        didDrawCell: (data) => {
          const { doc: d, cell, section } = data;
          const lastColIdx = columns.length - 1;

          if (section === 'head' && data.column.index === lastColIdx) {
            d.setDrawColor(40, 40, 40);
            d.setLineWidth(0.4);
            d.line(ML, cell.y + cell.height, PAGE_W - MR, cell.y + cell.height);
          }

          // ✅ Draw top border only on FIRST footer row, bottom border on LAST footer row
          if (section === 'foot') {
            const isFirstFootRow = data.row.index === 0;
            const isLastFootRow  = data.row.index === resolvedFooterRows.length - 1;

            if (data.column.index === 0) {
              d.setDrawColor(40, 40, 40);
              d.setLineWidth(0.4);
              if (isFirstFootRow) {
                d.line(ML, cell.y, PAGE_W - MR, cell.y);
              }
              if (isLastFootRow) {
                d.line(ML, cell.y + cell.height, PAGE_W - MR, cell.y + cell.height);
              }
            }
          }
        },

        didDrawPage: () => {},
      });

      // ── Amount in words (last page, below table) ──────────
      if (amountInWords) {
        const lastY = doc.lastAutoTable.finalY + 5;
        doc.setPage(doc.internal.getNumberOfPages());
        doc.setFont('Signika-Bold', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(0, 0, 0);
        doc.text(`Total Amount (In Words): ${amountInWords}`, ML, lastY);
      }

      // ── Post-process: paint header/footer/page-number on every page ─
      const totalPages = doc.internal.getNumberOfPages();

      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);

        // ════ PAGE 1: header image + title block ════════════
        if (p === 1) {
          if (headerImg) {
            doc.addImage(headerImg, 'PNG', 0, 0, PAGE_W, HEADER_H);
          }

          let ty = titleStartY;
          for (const part of titleParts) {
            doc.setFont('Signika-' + (part.bold ? 'Bold' : 'Regular'), 'normal');
            doc.setFontSize(part.size);
            doc.setTextColor(...part.color);
            doc.text(part.text, PAGE_W / 2, ty, { align: 'center' });

            if (part.underline) {
              const tw = doc.getTextWidth(part.text);
              doc.setDrawColor(0, 0, 0);
              doc.setLineWidth(0.25);
              doc.line(PAGE_W / 2 - tw / 2, ty + 0.7, PAGE_W / 2 + tw / 2, ty + 0.7);
            }
            ty += LINE_H;
          }
        }

        // ════ EVERY PAGE: page number + powered-by ══════════
        doc.setFont('Signika-Regular', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(130, 130, 130);
        doc.text(`Page ${p} of ${totalPages}`, PAGE_W / 2, PAGE_NUM_Y, { align: 'center' });
        doc.text('Powered by: Sugarian.app', ML, PAGE_NUM_Y);

        // ════ LAST PAGE: footer image (shifted right) ═══════
        if (p === totalPages && footerImg) {
          const footerY     = PAGE_H - FOOTER_H - 6;
          const imgAspect   = footerImg.width / footerImg.height;
          const drawWidth   = FOOTER_H * imgAspect;
          
          // Shift 10mm to the right from center
          const drawX       = ML + (PAGE_W - ML - MR - drawWidth) / 2 + 10;
          
          doc.addImage(footerImg, 'PNG', drawX, footerY, drawWidth, FOOTER_H);
        }
      }

      onComplete(doc.output('bloburl'));
    }
  );
};


export const generateLedgerPDF = ({
  companyName       = '',
  useHeaderImage    = true,
  headerImgSrc      = null,
  footerImgSrc      = null,
  logoSrc           = null,
  addressLines      = [],
  accountName       = '',
  accountCode       = '',
  accountAddress    = [],
  accountCity       = '',
  accountGST        = '',
  accountEmail      = '',
  fromDate          = '',
  toDate            = '',
  summary           = {},
  rows              = [],
  totals            = { debit: 0, credit: 0 },
  onComplete        = () => {},
}) => {
  Promise.all([
    loadImage(headerImgSrc),
    loadImage(footerImgSrc),
    loadImage(logoSrc),
  ]).then(([headerImg, footerImg, logoImg]) => {

    const doc     = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const PAGE_W  = doc.internal.pageSize.getWidth();
    const PAGE_H  = doc.internal.pageSize.getHeight();
    const ML      = 10;
    const MR      = 10;
    const HEADER_H = 38;
    const FOOTER_H = footerImg ? 30 : 0;
    const USABLE_BOTTOM = PAGE_H - FOOTER_H - 12;   
    const PAGE_NUM_Y    = PAGE_H - 4;

    const bold    = (sz) => { doc.setFont('Signika-Bold',    'normal'); doc.setFontSize(sz); };
    const regular = (sz) => { doc.setFont('Signika-Regular', 'normal'); doc.setFontSize(sz); };
    const color   = (r, g, b) => doc.setTextColor(r, g, b);
    const black   = () => color(0, 0, 0);
    const grey    = () => color(80, 80, 80);
    const green   = () => color(0, 128, 0);
    const hline   = (y, x1 = ML, x2 = PAGE_W - MR, w = 0.3) => {
      doc.setDrawColor(80, 80, 80);
      doc.setLineWidth(w);
      doc.line(x1, y, x2, y);
    };

    let Y = 0; 

    const drawColHeader = () => {
      hline(Y - 1);
      bold(7.5); black();
      doc.text('Date',         ML + 2,      Y + 3.5);
      doc.text('Particulars',  ML + 25,     Y + 3.5);
      doc.text('Vch Type',     ML + 87,     Y + 3.5, { align: 'center' });
      doc.text('Vch No.',      ML + 105,    Y + 3.5, { align: 'center' });
      doc.text('Debit',        PAGE_W - MR - 52, Y + 3.5, { align: 'right' });
      doc.text('Credit',       PAGE_W - MR - 28, Y + 3.5, { align: 'right' });
      doc.text('Balance',      PAGE_W - MR,      Y + 3.5, { align: 'right' });
      hline(Y + 6);
      Y += 10;
    };

    const drawPage1Header = () => {
      if (useHeaderImage && headerImg) {
        doc.addImage(headerImg, 'PNG', 0, 0, PAGE_W, HEADER_H);
      } else if (logoImg) {
        doc.addImage(logoImg, 'PNG', ML, 5, 28, 28);
        bold(13); black();
        doc.text(companyName, ML + 32, 12);
        regular(8.5); grey();
        addressLines.forEach((line, i) => doc.text(line, ML + 32, 18 + i * 4.5));
      }

      hline(HEADER_H + 2);
      bold(10); green();
      doc.text('LEDGER ACCOUNT', PAGE_W / 2, HEADER_H + 8, { align: 'center' });
      black();
      hline(HEADER_H + 11);

      let LY = HEADER_H + 17;
      regular(8); grey();
      doc.text('To,', ML + 2, LY); LY += 5;
      bold(8.5); green();
      doc.text(`${accountName} (${accountCode})`, ML + 2, LY); LY += 5;
      regular(8); black();
      accountAddress.forEach(line => { doc.text(line, ML + 2, LY); LY += 4.5; });
      if (accountCity) { doc.text(accountCity, ML + 2, LY); LY += 4.5; }
      if (accountGST)  { doc.text(`GST: ${accountGST}`, ML + 2, LY); LY += 4.5; }
      if (accountEmail){ doc.text(`Email: ${accountEmail}`, ML + 2, LY); }

      const SX  = PAGE_W / 2 + 12; 
      const RX  = PAGE_W - MR - 2; 
      let   RY  = HEADER_H + 17;

      regular(7.5); grey();
      doc.text(`Ledger from ${fromDate} to ${toDate}`, SX, RY); RY += 5;
      bold(8); black();
      doc.text('SUMMARY', SX, RY); RY += 5;
      regular(7.5);

      const sumRows = [
        { label: 'Opening Balance',  val: `${summary.openingBalance} Cr.` },
        { label: 'Credited Amount',  val: `${summary.creditedAmount} Cr.` },
        { label: 'Debited Amount',   val: `${summary.debitedAmount} Dr.`  },
        { label: 'Closing Balance',  val: summary.closingBalance, bold: true },
      ];
      sumRows.forEach((r, i) => {
        const isLast = i === sumRows.length - 1;
        if (isLast) {
          hline(RY - 1, SX, RX + 5);
          bold(7.5);
        } else {
          regular(7.5);
        }
        black();
        doc.text(r.label, SX, RY);
        doc.text(r.val,   RX + 5, RY, { align: 'right' });
        if (isLast) hline(RY + 2, SX, RX + 5);
        RY += 5;
      });

      Y = Math.max(LY, RY) + 4;
      drawColHeader();
    };

    drawPage1Header();

    const ROW_H_BASE = 5;  
    const LINE_H     = 4.5;

    for (let i = 0; i < rows.length; i++) {
      const item     = rows[i];
      const narLines = doc.splitTextToSize(item.narration || '', 55);
      const rowH     = Math.max(ROW_H_BASE, narLines.length * LINE_H);

      if (Y + rowH + 4 > USABLE_BOTTOM) {
        _drawPageFooter(false);
        doc.addPage();
        Y = CONTENT_TOP_P2 + 4;
        drawColHeader();
      }

      regular(7.5); black();
      doc.text(item.date     || '', ML + 2,           Y + 2);
      doc.text(item.tranType || '', ML + 87,           Y + 2, { align: 'center' });
      doc.text(String(item.vchNo || ''), ML + 105,    Y + 2, { align: 'center' });

      if (parseFloat(item.debit || 0) > 0) color(150, 0, 0);
      else grey();
      doc.text(item.debit  || '0.00', PAGE_W - MR - 52, Y + 2, { align: 'right' });

      if (parseFloat(item.credit || 0) > 0) color(0, 100, 0);
      else grey();
      doc.text(item.credit || '0.00', PAGE_W - MR - 28, Y + 2, { align: 'right' });

      black();
      doc.text(item.balance || '0.00', PAGE_W - MR, Y + 2, { align: 'right' });

      regular(6.5); grey();
      doc.text(item.drcr || '', PAGE_W - MR + 1, Y + 2);

      regular(7.5); black();
      narLines.forEach((line, li) => doc.text(line, ML + 25, Y + 2 + li * LINE_H));

      Y += rowH;
    }

    if (Y + 10 > USABLE_BOTTOM) {
      _drawPageFooter(false);
      doc.addPage();
      Y = CONTENT_TOP_P2 + 4;
      drawColHeader();
    }

    const net = totals.debit - totals.credit;
    hline(Y - 1);
    bold(7.5); black();
    doc.text(String(totals.debit.toFixed(2)),      PAGE_W - MR - 52, Y + 3, { align: 'right' });
    doc.text(String(totals.credit.toFixed(2)),     PAGE_W - MR - 28, Y + 3, { align: 'right' });
    doc.text(String(Math.abs(net).toFixed(2)),     PAGE_W - MR,      Y + 3, { align: 'right' });
    regular(7); grey();
    doc.text(net > 0 ? 'Dr.' : 'Cr.', PAGE_W - MR + 1, Y + 3);
    hline(Y + 6);
    regular(7.5); grey();
    doc.text('*** END OF LEDGER ***', PAGE_W / 2, Y + 10, { align: 'center' });
    Y += 14;

    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      regular(6.5); color(130, 130, 130);
      doc.text(`Page ${p} of ${totalPages}`, PAGE_W / 2, PAGE_NUM_Y, { align: 'center' });
      doc.text('Powered by: Sugarian.app', ML, PAGE_NUM_Y);

      if (p === totalPages && footerImg) {
        const imgAspect = footerImg.width / footerImg.height;
        const drawWidth = FOOTER_H * imgAspect;
        const drawX     = ML + (PAGE_W - ML - MR - drawWidth) / 2 + 10;
        doc.addImage(footerImg, 'PNG', drawX, PAGE_H - FOOTER_H - 4, drawWidth, FOOTER_H);
      }
    }

    onComplete(doc.output('bloburl'));
    function _drawPageFooter(showImage) {}
  });
};

const CONTENT_TOP_P2 = 8;
