import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import * as XLSX from "xlsx";
import PdfPreview from "../../../Common/PDFPreview";
import { ScaleLoader } from "react-spinners";
import { Typography, Button, Box } from "@mui/material";
import PrintButton from "../../../Common/Buttons/PrintPDF";
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";
import SearchBar from "../../../Common/UtilityCommon/SearchBar";
import BackButton from "../../../Common/Buttons/BackButton";
import { generateReportPDF } from "../../../Common/ReportCommon/CommonPDFGenerator";
import { ConvertNumberToWord } from "../../../Common/FormatFunctions/ConvertNumberToWord";
import HeaderJK from "../../../Assets/HeaderJK.png";
import FooterJK from "../../../Assets/FooterJK.png";

const API_URL = process.env.REACT_APP_API;

const fmtDate = (val) => {
  if (!val) return "";
  const d = new Date(val);
  if (isNaN(d)) return val;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const EbuySugarSelfStock = () => {
  const navigate = useNavigate();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pdfPreview, setPdfPreview] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: "Lifting_Date", direction: "asc" });
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/ebuysugargetSelfStock`, {
          params: { CompanyCode: sessionStorage.getItem("Company_Code") },
        });
        setRecords(res.data.records || []);
      } catch (err) {
        console.error("Error fetching eBuySugar self stock:", err);
        setError("Failed to load data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const sortData = (key) => {
    const direction = sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc";
    setSortConfig({ key, direction });
  };

  const sorted = [...records].sort((a, b) => {
    const { key, direction } = sortConfig;
    let av = a[key] ?? "";
    let bv = b[key] ?? "";

    if (key === "Lifting_Date") {
      av = new Date(av).getTime() || 0;
      bv = new Date(bv).getTime() || 0;
    } else if (key === "Mill_Rate" || key === "selfqty" || key === "Tender_No") {
      av = parseFloat(av) || 0;
      bv = parseFloat(bv) || 0;
    } else {
      av = String(av).toLowerCase();
      bv = String(bv).toLowerCase();
    }

    if (av < bv) return direction === "asc" ? -1 : 1;
    if (av > bv) return direction === "asc" ? 1 : -1;
    return 0;
  });

  const filtered = sorted.filter((r) =>
    Object.values(r).join(" ").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalBalance = filtered.reduce((sum, r) => sum + parseFloat(r.selfqty || 0), 0);

  const COLS = [
    { label: "Tender No",    key: "Tender_No" },
    { label: "Mill Name",    key: "millshortname" },
    { label: "Grade",        key: "Grade" },
    { label: "Mill Rate",    key: "Mill_Rate" },
    { label: "Balance",      key: "selfqty" },
    { label: "Lifting Date", key: "Lifting_Date" },
    { label: "DO",           key: "doshortname" },
  ];

  const arrow = (key) =>
    sortConfig.key === key ? (sortConfig.direction === "asc" ? " ↑" : " ↓") : "";

  const handleGeneratePDF = () => {
    const columns = COLS.map((c) => c.label);
    const yellowFooterStyle = { fillColor: [255, 249, 196], fontStyle: "bold" };

    const rows = filtered.map((r) => [
      r.Tender_No,
      r.millshortname,
      r.Grade,
      { content: formatReadableAmount(r.Mill_Rate), styles: { halign: "right" } },
      { content: formatReadableAmount(r.selfqty),   styles: { halign: "right" } },
      fmtDate(r.Lifting_Date),
      r.doshortname,
    ]);

    generateReportPDF({
      title: "eBuySugar Self Stock Report",
      columns,
      rows,
      footerRow: [
        { content: "GRAND TOTAL", colSpan: 4, styles: yellowFooterStyle },
        { content: formatReadableAmount(totalBalance.toFixed(2)), styles: { ...yellowFooterStyle, halign: "right" } },
        { content: "", styles: yellowFooterStyle },
        { content: "", styles: yellowFooterStyle },
      ],
      numericCols: [3, 4],
      amountInWords: ConvertNumberToWord(totalBalance),
      headerImgSrc: HeaderJK,
      footerImgSrc: FooterJK,
      orientation: "landscape",
      onComplete: (url) => setPdfPreview(url),
    });
  };

  const handleExportToExcel = () => {
    const wb = XLSX.utils.book_new();
    const data = [["Tender No", "Mill Name", "Grade", "Mill Rate", "Balance", "Lifting Date", "DO"]];

    filtered.forEach((r) => {
      data.push([
        r.Tender_No,
        r.millshortname,
        r.Grade,
        r.Mill_Rate,
        r.selfqty,
        fmtDate(r.Lifting_Date),
        r.doshortname,
      ]);
    });

    data.push(["", "", "", "Grand Total", totalBalance.toFixed(2), "", ""]);

    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data), "Self Stock");
    XLSX.writeFile(wb, "EbuySugar_SelfStock_Report.xlsx");
  };

  return (
    <>
      <div style={{ position: "relative", marginTop: "-60px" }}>
        <Typography variant="h6" style={{ textAlign: "center", fontSize: "16px", fontWeight: "bold" }}>
          eBuySugar Self Stock Report
        </Typography>

        <div className="d-flex justify-content-between align-items-center flex-wrap" style={{ gap: "10px" }}>
          <div style={{ flex: 1, minWidth: "250px", maxWidth: "1100px" }}>
            <SearchBar value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div className="d-flex flex-wrap align-items-center" style={{ gap: "8px" }}>
            {pdfPreview && <PdfPreview pdfData={pdfPreview} label="eBuySugar Self Stock Report" />}
            <PrintButton disabledFeild="" fetchData={handleGeneratePDF} />
            <Button variant="outlined" color="secondary" onClick={handleExportToExcel}>
              Export to Excel
            </Button>
            <BackButton onClick={() => navigate("/dashboard")} />
          </div>
        </div>

        {error && <p className="text-danger">{error}</p>}

        <div style={{ maxHeight: "calc(100vh - 200px)", overflow: "auto", border: "1px solid #e0e0e0" }}>
          <table className="table" style={{ borderCollapse: "collapse", width: "100%", marginBottom: "50px" }}>
            <thead style={{ position: "sticky", top: 0, zIndex: 2 }}>
              <tr style={{ backgroundColor: "black", color: "white", textAlign: "center" }}>
                {COLS.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => sortData(col.key)}
                    style={{ border: "1px solid white", padding: "8px", cursor: "pointer", whiteSpace: "nowrap" }}
                  >
                    {col.label}{arrow(col.key)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((record, i) => (
                <tr key={i} style={{ textAlign: "center" }}>
                  <td style={{ border: "1px dashed black", padding: "8px" }}>{record.Tender_No}</td>
                  <td align="left" style={{ border: "1px dashed black", padding: "8px" }}>{record.millshortname}</td>
                  <td align="left" style={{ border: "1px dashed black", padding: "8px" }}>{record.Grade}</td>
                  <td align="right" style={{ border: "1px dashed black", padding: "8px" }}>{formatReadableAmount(record.Mill_Rate)}</td>
                  <td align="right" style={{ border: "1px dashed black", padding: "8px" }}>{formatReadableAmount(record.selfqty)}</td>
                  <td style={{ border: "1px dashed black", padding: "8px" }}>{fmtDate(record.Lifting_Date)}</td>
                  <td align="left" style={{ border: "1px dashed black", padding: "8px" }}>{record.doshortname}</td>
                </tr>
              ))}

              {/* Grand Total row */}
              <tr style={{ backgroundColor: "#f0f0f0", fontWeight: "bold" }}>
                <td colSpan="4" style={{ textAlign: "center", padding: "8px" }}>Grand Total</td>
                <td align="right" style={{ border: "1px dashed black", padding: "8px" }}>
                  {formatReadableAmount(totalBalance.toFixed(2))}
                </td>
                <td colSpan="2" />
              </tr>
            </tbody>
          </table>
        </div>

        {loading && (
          <Box
            style={{
              display: "flex", justifyContent: "center", alignItems: "center",
              position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: "rgba(255,255,255,0.7)", zIndex: 10,
            }}
          >
            <ScaleLoader color="#36d7b7" height={35} width={4} radius={2} margin={2} />
          </Box>
        )}
      </div>
    </>
  );
};

export default EbuySugarSelfStock;
