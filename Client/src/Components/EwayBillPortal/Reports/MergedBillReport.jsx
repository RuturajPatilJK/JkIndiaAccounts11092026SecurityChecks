import React, { useEffect, useState } from "react";
import { PDFDocument } from "pdf-lib";
import CustomizeSBReport from "./SaleBillReport/SaleBillReport";
import EWayBillReport from "./EWayReport/EWayBillReport";
import PdfPreview from "../../../Common/PDFPreview";

const MergedBillReport = ({ saleId, ewayBillNo, signWithDSC = false, onClose }) => {
  const [saleResult, setSaleResult] = useState(null);
  const [ewayResult, setEwayResult] = useState(null);
  const [mergedUrl, setMergedUrl] = useState(null);

  useEffect(() => {
    setSaleResult(null);
    setEwayResult(null);
    setMergedUrl(null);
  }, [saleId, ewayBillNo]);

  useEffect(() => {
    if (!saleResult || !ewayResult) return;

    let cancelled = false;

    (async () => {
      const mergedPdf = await PDFDocument.create();

      const saleBytes = await saleResult.blob.arrayBuffer();
      const salePdf = await PDFDocument.load(saleBytes);
      const salePages = await mergedPdf.copyPages(salePdf, salePdf.getPageIndices());
      salePages.forEach((page) => mergedPdf.addPage(page));

      const ewayBytes = await ewayResult.blob.arrayBuffer();
      const ewayPdf = await PDFDocument.load(ewayBytes);
      const ewayPages = await mergedPdf.copyPages(ewayPdf, ewayPdf.getPageIndices());
      ewayPages.forEach((page) => mergedPdf.addPage(page));

      const mergedBytes = await mergedPdf.save();
      const mergedBlob = new Blob([mergedBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(mergedBlob);

      if (!cancelled) {
        setMergedUrl(url);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [saleResult, ewayResult]);

  useEffect(() => {
    return () => {
      if (mergedUrl) {
        URL.revokeObjectURL(mergedUrl);
      }
    };
  }, [mergedUrl]);

  const gstNo = sessionStorage.getItem("Company_GSTNO") || "";
  const jkGSTs = [
    "27AAECJ8332R1ZV",
    "27AEJPS9860D1Z0",
    "27ARCPS1606H1ZW",
    "27AAMFJ4182A1ZG",
  ];
  const isJK = jkGSTs.includes(gstNo.toUpperCase());
  const label = isJK ? "accounts_sale_bill_2" : "SaleBill";

  return (
    <div className="centered-container">
      {/* Hidden generators - reuse the existing, unmodified PDF-building
          logic for each report; they just hand their finished PDF back
          instead of showing their own preview. */}
      <div style={{ display: "none" }}>
        <CustomizeSBReport
          saleId={saleId}
          ewayBillNo={ewayBillNo}
          signWithDSC={signWithDSC}
          hidePreview
          onReady={(blob, data) => setSaleResult({ blob, data })}
        />
        <EWayBillReport
          saleId={saleId}
          ewayBillNo={ewayBillNo}
          hidePreview
          onReady={(blob, data) => setEwayResult({ blob, data })}
        />
      </div>

      {mergedUrl && (
        <PdfPreview
          pdfData={mergedUrl}
          apiData={saleResult?.data}
          label={label}
          ewayBillNo={ewayBillNo}
          onClose={onClose}
        />
      )}
    </div>
  );
};

export default MergedBillReport;
