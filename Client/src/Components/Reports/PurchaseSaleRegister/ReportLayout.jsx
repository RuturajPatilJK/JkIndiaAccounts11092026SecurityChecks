import { jsPDF } from "jspdf";
import "jspdf-autotable";
import HeaderJK from "../../../Assets/HeaderJK.png";
import FooterJK from "../../../Assets/FooterJK.png";

export const generateStandardPDF = (config) => {
    const { 
        title, fromDate, toDate, tableHead, tableBody, tableFoot, columnStyles, amountInWords, companyGST 
    } = config;

    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const headerHeight = 40;
    const footerHeight = 35;

    const addHeader = () => {
        doc.addImage(HeaderJK, "PNG", 0, 0, pageWidth, headerHeight);
    };

    const addFooter = (isLastPage) => {
        if (isLastPage) {
            doc.addImage(FooterJK, "PNG", 0, pageHeight - footerHeight - 5, pageWidth, footerHeight);
        }
        doc.setFont("Signika-Regular");
        doc.setFontSize(9);
        doc.text(`Page ${doc.internal.getNumberOfPages()}`, pageWidth / 2, pageHeight - 8, { align: "center" });
    };

    addHeader();

    let startY = headerHeight + 5;
    doc.setFont("Signika-Bold");
    doc.setFontSize(14);
    doc.text(title.toUpperCase(), pageWidth / 2, startY, { align: "center" });
    
    doc.setFontSize(10);
    doc.text(`GSTN: ${companyGST}`, pageWidth / 2, startY + 5, { align: "center" });
    doc.text(`${fromDate} to ${toDate}`, pageWidth / 2, startY + 10, { align: "center" });

    doc.autoTable({
        startY: startY + 15,
        head: tableHead,
        body: tableBody,
        foot: tableFoot,
        margin: { top: headerHeight + 10, bottom: footerHeight + 10 },
        styles: { font: "Signika-Regular", fontSize: 8, cellPadding: 1 },
        headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineWidth: 0.1, font: "Signika-Bold" },
        footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], font: "Signika-Bold", fontSize: 9 },
        columnStyles: columnStyles,
        didDrawPage: () => addFooter(false)
    });

    if (amountInWords) {
        doc.setFont("Signika-Bold");
        doc.text(`Amount In Words: ${amountInWords}`, 10, doc.lastAutoTable.finalY + 10);
    }

    addFooter(true);
    return doc;
};