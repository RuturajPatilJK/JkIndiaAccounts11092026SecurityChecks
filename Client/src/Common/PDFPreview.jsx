import React from "react";
import PdfPreview_JK from "./PdfPreview_JK";
import PdfPreview_Default from "./PdfPreview_Default";

const PdfPreview = (props) => {
  const gstNo = sessionStorage.getItem("Company_GSTNO") || "";

  const jkGSTs = [
    "27AAECJ8332R1ZV",
    "27AEJPS9860D1Z0",
    "27ARCPS1606H1ZW",
    "27AAMFJ4182A1ZG",
  ];

  const isJK = jkGSTs.includes(gstNo.toUpperCase());

  return isJK ? (
    <PdfPreview_JK {...props} />
  ) : (
    <PdfPreview_Default {...props} />
  );
};

export default PdfPreview;
