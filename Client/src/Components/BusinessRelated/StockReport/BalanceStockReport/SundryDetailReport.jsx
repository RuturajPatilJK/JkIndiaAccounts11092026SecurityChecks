import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { RingLoader } from "react-spinners";
import { Typography, Button } from "@mui/material";
import PdfPreview from "../../../../Common/PDFPreview";
import PrintButton from "../../../../Common/Buttons/PrintPDF";
import SearchBar from "../../../../Common/UtilityCommon/SearchBar";
import { formatReadableAmount } from "../../../../Common/FormatFunctions/FormatAmount";

const API_URL = process.env.REACT_APP_API;

const SundryDetailsReport = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const sp = new URLSearchParams(location.search);

  const companyName = sessionStorage.getItem("Company_Name");
  const Company_GSTNO = sessionStorage.getItem("Company_GSTNO");
  const AccountYear = sessionStorage.getItem("Accounting_Year");
  const Company_Code = sessionStorage.getItem("Company_Code");
  const Year_Code = sessionStorage.getItem("Year_Code");

  // Query params (fallback to AccountYear if missing)
  const ay = (AccountYear || "").split(" - ");
  const [fromDate] = useState(sp.get("fromDate") || (ay[0] || ""));
  const [toDate] = useState(sp.get("toDate") || (ay[1] || ""));
  const [groupCode] = useState(sp.get("groupCode") || "10"); // 10=Debtors, 4=Creditors

  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState({ Debtors: 0, Creditors: 0, Net: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pdfPreview, setPdfPreview] = useState(null);
  const [search, setSearch] = useState("");

  // Default sort: creditors → largest magnitude first, debtors → by balance desc
  const [sort, setSort] = useState(() =>
    String(groupCode) === "4"
      ? { key: "Balance", direction: "desc_abs" }
      : { key: "Ac_Name_E", direction: "asc" }
  );

  const label =
    String(groupCode) === "4"
      ? "Sundry Creditors (Group 4)"
      : "Sundry Debtors (Group 10)";

  // Fetch details
  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      setError("");
      try {
        const params = {
          from_date: fromDate,
          to_date: toDate,
          Company_Code: Company_Code,
          Year_Code: Year_Code,
          Group_Code: String(groupCode),
        };
        const res = await axios.get(`${API_URL}/TrialBalance-SundryDetails`, { params });
        setRows(res.data?.rows || []);
        setTotals(res.data?.totals || { Debtors: 0, Creditors: 0, Net: 0 });
      } catch (e) {
        console.error(e);
        setError("Failed to load details.");
        setRows([]);
        setTotals({ Debtors: 0, Creditors: 0, Net: 0 });
      } finally {
        setLoading(false);
      }
    };
    if (fromDate && toDate && Company_Code) fetchDetails();
  }, [fromDate, toDate, groupCode, Company_Code, Year_Code]);

  // Clear preview when filters change
  useEffect(() => {
    setPdfPreview(null);
  }, [fromDate, toDate, groupCode]);

  // Filter + sort (includes ac_type in search)
  const filteredSortedRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    let r = rows;

    if (q) {
      r = rows.filter((x) =>
        [
          x.ac_type,
          x.AC_CODE,
          x.Ac_Name_E,
          x.CityName,
          String(x.Debit),
          String(x.Credit),
          String(x.Balance),
        ]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }

    const { key, direction } = sort;
    const isNum = ["Debit", "Credit", "Balance"].includes(key);

    const getVal = (obj) => {
      if (!isNum) return String(obj[key] ?? "");
      const n = parseFloat(obj[key] ?? 0);
      return direction.endsWith("_abs") ? Math.abs(n) : n;
    };

    const dirFactor =
      direction === "asc" || direction === "asc_abs" ? 1 : -1;

    return [...r].sort((a, b) => {
      const av = getVal(a);
      const bv = getVal(b);
      if (av < bv) return -1 * dirFactor;
      if (av > bv) return 1 * dirFactor;
      return 0;
    });
  }, [rows, search, sort]);

  // Split by ac_type
  const byType = useMemo(() => {
    const M = filteredSortedRows.filter((r) => r.ac_type === "M");
    const P = filteredSortedRows.filter((r) => r.ac_type === "P");
    const S = filteredSortedRows.filter((r) => r.ac_type === "S");
    const sum = (arr) => ({
      Debtors: arr.reduce((t, x) => t + (parseFloat(x.Debit) || 0), 0),
      Creditors: arr.reduce((t, x) => t + (parseFloat(x.Credit) || 0), 0),
      Net: arr.reduce(
        (t, x) =>
          t + ((parseFloat(x.Debit) || 0) - (parseFloat(x.Credit) || 0)),
        0
      ),
    });
    return {
      M,
      P,
      S,
      totals: { M: sum(M), P: sum(P), S: sum(S) },
    };
  }, [filteredSortedRows]);

  const handleSort = (key) => {
    setSort((prev) => {
      // 3-state cycle for creditors on Balance: desc_abs -> asc -> desc -> desc_abs
      const isCreditors = String(groupCode) === "4";
      if (prev.key === key) {
        if (isCreditors && key === "Balance") {
          if (prev.direction === "desc_abs") return { key, direction: "asc" };
          if (prev.direction === "asc") return { key, direction: "desc" };
          if (prev.direction === "desc") return { key, direction: "desc_abs" };
          return { key, direction: "desc_abs" };
        }
        // normal toggle
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      // switching to a new key
      if (isCreditors && key === "Balance") {
        return { key, direction: "desc_abs" };
      }
      return { key, direction: "asc" };
    });
  };

  const fmtDrCr = (signed) => {
    const n = parseFloat(signed || 0);
    const abs = Math.abs(n);
    return n >= 0 ? `${formatReadableAmount(abs)} Dr` : `${formatReadableAmount(abs)} Cr`;
  };

  // Excel export (4 sheets: All, Mills, Parties, Suppliers)
  const handleExportToExcel = () => {
    const wb = XLSX.utils.book_new();

    const buildSheet = (title, arr) => {
      const sheet = [
        ["Type", "AC CODE", "Account Name", "City", "Debit", "Credit", "Balance (Dr/Cr)"],
      ];
      arr.forEach((r) => {
        sheet.push([
          r.ac_type,
          r.AC_CODE,
          r.Ac_Name_E,
          r.CityName,
          formatReadableAmount(r.Debit),
          formatReadableAmount(r.Credit),
          fmtDrCr(r.Balance),
        ]);
      });
      // section totals
      const secTotals = {
        Debtors: arr.reduce((t, x) => t + (parseFloat(x.Debit) || 0), 0),
        Creditors: arr.reduce((t, x) => t + (parseFloat(x.Credit) || 0), 0),
      };
      sheet.push([]);
      sheet.push([
        "",
        "",
        "TOTALS",
        "",
        formatReadableAmount(secTotals.Debtors),
        formatReadableAmount(secTotals.Creditors),
        fmtDrCr(secTotals.Debtors - secTotals.Creditors),
      ]);
      const ws = XLSX.utils.aoa_to_sheet(sheet);
      XLSX.utils.book_append_sheet(wb, ws, title);
    };

    buildSheet("All", filteredSortedRows);
    if (byType.M.length) buildSheet("Mills (M)", byType.M);
    if (byType.P.length) buildSheet("Parties (P)", byType.P);
    if (byType.S.length) buildSheet("Suppliers (S)", byType.S);

    XLSX.writeFile(
      wb,
      `${
        String(groupCode) === "4" ? "SundryCreditors" : "SundryDebtors"
      }_${fromDate}_to_${toDate}.xlsx`
    );
  };

  const getFinalY = (doc) =>
    (doc.lastAutoTable && doc.lastAutoTable.finalY) ||
    (doc.autoTable?.previous?.finalY) ||
    0;

  // PDF preview (sections for M, P, S)
  const generatePDF = () => {
    const doc = new jsPDF("landscape", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 10;

    // Company
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 200);
    doc.setFont("helvetica", "bold");
    const title1 = companyName || "Company";
    doc.text(title1, pageWidth / 2, y, { align: "center" });

    // Title
    y += 7;
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    const title2 = `${label} — ${fromDate || "-"} to ${toDate || "-"}`;
    doc.text(title2, pageWidth / 2, y, { align: "center" });

    const renderSection = (name, arr) => {
      if (!arr.length) return;
      y += 6;
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(name, 8, y);

      const body = arr.map((r) => [
        r.ac_type,
        r.AC_CODE,
        r.Ac_Name_E,
        r.CityName,
        formatReadableAmount(r.Debit),
        formatReadableAmount(r.Credit),
        fmtDrCr(r.Balance),
      ]);

      doc.autoTable({
        startY: y + 2,
        head: [["Type", "AC CODE", "Account Name", "City", "Debit", "Credit", "Balance (Dr/Cr)"]],
        body,
        styles: { fontSize: 8, cellPadding: 0.8, lineWidth: 0.1 },
        headStyles: { fillColor: [0, 0, 120], textColor: [255, 255, 255] },
        columnStyles: { 4: { halign: "right" }, 5: { halign: "right" }, 6: { halign: "right" } },
        theme: "grid",
        margin: { left: 8, right: 8 },
      });

      y = getFinalY(doc);
      // section subtotal
      const secDeb = arr.reduce((t, r) => t + (parseFloat(r.Debit) || 0), 0);
      const secCre = arr.reduce((t, r) => t + (parseFloat(r.Credit) || 0), 0);

      doc.setFontSize(9);
      y += 4;
      doc.text(
        `Subtotal — Debit: ${formatReadableAmount(secDeb)}, Credit: ${formatReadableAmount(
          secCre
        )}, Net: ${fmtDrCr(secDeb - secCre)}`,
        8,
        y
      );
    };

    renderSection("M — Mills", byType.M);
    renderSection("P — Parties", byType.P);
    renderSection("S — Suppliers", byType.S);

    // Overall totals
    y += 6;
    doc.setFontSize(10);
    doc.text(
      `Overall Totals — Debit: ${formatReadableAmount(
        totals.Debtors
      )}, Credit: ${formatReadableAmount(totals.Creditors)}, Net: ${fmtDrCr(
        totals.Net
      )}`,
      8,
      y
    );

    const blob = doc.output("blob");
    setPdfPreview(URL.createObjectURL(blob));
  };

  return (
    <div style={{ position: "relative", marginTop: "-70px" }}>
      <Typography variant="h6" style={{ textAlign: "center", fontWeight: "bold", color: "blue" }}>
        {label}
      </Typography>
      <Typography variant="subtitle2" style={{ textAlign: "center" }}>
        {fromDate || "-"} to {toDate || "-"} {Company_GSTNO ? ` • GST: ${Company_GSTNO}` : ""}
      </Typography>

      <div
        className="d-flex justify-content-between align-items-center flex-wrap"
        style={{ gap: 10, margin: "8px 0 12px" }}
      >
        <div style={{ flex: 1, minWidth: 280 }}>
          <SearchBar value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="d-flex align-items-center" style={{ gap: 8 }}>
          {pdfPreview && (
            <PdfPreview
              pdfData={pdfPreview}
              apiData={{ rows, totals }}
              label={String(groupCode) === "4" ? "SundryCreditors" : "SundryDebtors"}
            />
          )}
          <PrintButton disabledFeild={""} fetchData={generatePDF} />
          <Button variant="outlined" color="secondary" onClick={handleExportToExcel}>
            Export to Excel
          </Button>
          <Button variant="outlined" onClick={() => navigate("/self-stock")}>
            Back
          </Button>
        </div>
      </div>

      {error && <div className="alert alert-danger py-1 my-2">{error}</div>}

      <div
        style={{
          maxHeight: "calc(100vh - 220px)",
          overflow: "auto",
          border: "1px solid #e0e0e0",
          position: "relative",
        }}
      >
        <table className="table" style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead style={{ position: "sticky", top: 0, zIndex: 2 }}>
            <tr style={{ backgroundColor: "black", color: "white", textAlign: "center" }}>
              {[
                { label: "Type", key: "ac_type" },
                { label: "AC CODE", key: "AC_CODE" },
                { label: "Account Name", key: "Ac_Name_E" },
                { label: "City", key: "CityName" },
                { label: "Debit", key: "Debit" },
                { label: "Credit", key: "Credit" },
                { label: "Balance (Dr/Cr)", key: "Balance" },
              ].map((c) => (
                <th
                  key={c.key}
                  onClick={() => handleSort(c.key)}
                  style={{
                    border: "1px solid white",
                    padding: 8,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                  title={
                    String(groupCode) === "4" && c.key === "Balance"
                      ? "Click to cycle: |desc abs| → asc → desc → |desc abs|"
                      : "Click to toggle sort"
                  }
                >
                  {c.label}{" "}
                  {sort.key === c.key
                    ? sort.direction === "asc"
                      ? "↑"
                      : sort.direction === "desc"
                      ? "↓"
                      : "⇵" // for desc_abs / asc_abs
                    : ""}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {/* M — Mills */}
            {byType.M.length > 0 && (
              <>
                <tr style={{ backgroundColor: "#e8f4ff", fontWeight: "bold" }}>
                  <td colSpan={7} style={{ padding: 8 }}>
                    M — Mills
                  </td>
                </tr>
                {byType.M.map((r, idx) => (
                  <tr key={`M-${idx}`} style={{ textAlign: "center" }}>
                    <td style={{ border: "1px dashed #bbb", padding: 8 }}>{r.ac_type}</td>
                    <td style={{ border: "1px dashed #bbb", padding: 8 }}>{r.AC_CODE}</td>
                    <td style={{ border: "1px dashed #bbb", padding: 8, textAlign: "left" }}>{r.Ac_Name_E}</td>
                    <td style={{ border: "1px dashed #bbb", padding: 8, textAlign: "left" }}>{r.CityName}</td>
                    <td style={{ border: "1px dashed #bbb", padding: 8, textAlign: "right" }}>
                      {formatReadableAmount(r.Debit)}
                    </td>
                    <td style={{ border: "1px dashed #bbb", padding: 8, textAlign: "right" }}>
                      {formatReadableAmount(r.Credit)}
                    </td>
                    <td style={{ border: "1px dashed #bbb", padding: 8, textAlign: "right" }}>
                      {fmtDrCr(r.Balance)}
                    </td>
                  </tr>
                ))}
                <tr style={{ backgroundColor: "#f5fbff", fontWeight: "bold" }}>
                  <td colSpan={4} style={{ padding: 8, textAlign: "right" }}>
                    Subtotal
                  </td>
                  <td style={{ padding: 8, textAlign: "right" }}>
                    {formatReadableAmount(byType.totals.M.Debtors)}
                  </td>
                  <td style={{ padding: 8, textAlign: "right" }}>
                    {formatReadableAmount(byType.totals.M.Creditors)}
                  </td>
                  <td style={{ padding: 8, textAlign: "right" }}>{fmtDrCr(byType.totals.M.Net)}</td>
                </tr>
              </>
            )}

            {/* P — Parties */}
            {byType.P.length > 0 && (
              <>
                <tr style={{ backgroundColor: "#eafbea", fontWeight: "bold" }}>
                  <td colSpan={7} style={{ padding: 8 }}>
                    P — Parties
                  </td>
                </tr>
                {byType.P.map((r, idx) => (
                  <tr key={`P-${idx}`} style={{ textAlign: "center" }}>
                    <td style={{ border: "1px dashed #bbb", padding: 8 }}>{r.ac_type}</td>
                    <td style={{ border: "1px dashed #bbb", padding: 8 }}>{r.AC_CODE}</td>
                    <td style={{ border: "1px dashed #bbb", padding: 8, textAlign: "left" }}>{r.Ac_Name_E}</td>
                    <td style={{ border: "1px dashed #bbb", padding: 8, textAlign: "left" }}>{r.CityName}</td>
                    <td style={{ border: "1px dashed #bbb", padding: 8, textAlign: "right" }}>
                      {formatReadableAmount(r.Debit)}
                    </td>
                    <td style={{ border: "1px dashed #bbb", padding: 8, textAlign: "right" }}>
                      {formatReadableAmount(r.Credit)}
                    </td>
                    <td style={{ border: "1px dashed #bbb", padding: 8, textAlign: "right" }}>
                      {fmtDrCr(r.Balance)}
                    </td>
                  </tr>
                ))}
                <tr style={{ backgroundColor: "#f7fff7", fontWeight: "bold" }}>
                  <td colSpan={4} style={{ padding: 8, textAlign: "right" }}>
                    Subtotal
                  </td>
                  <td style={{ padding: 8, textAlign: "right" }}>
                    {formatReadableAmount(byType.totals.P.Debtors)}
                  </td>
                  <td style={{ padding: 8, textAlign: "right" }}>
                    {formatReadableAmount(byType.totals.P.Creditors)}
                  </td>
                  <td style={{ padding: 8, textAlign: "right" }}>{fmtDrCr(byType.totals.P.Net)}</td>
                </tr>
              </>
            )}

            {/* S — Suppliers */}
            {byType.S.length > 0 && (
              <>
                <tr style={{ backgroundColor: "#fff3e6", fontWeight: "bold" }}>
                  <td colSpan={7} style={{ padding: 8 }}>
                    S — Suppliers
                  </td>
                </tr>
                {byType.S.map((r, idx) => (
                  <tr key={`S-${idx}`} style={{ textAlign: "center" }}>
                    <td style={{ border: "1px dashed #bbb", padding: 8 }}>{r.ac_type}</td>
                    <td style={{ border: "1px dashed #bbb", padding: 8 }}>{r.AC_CODE}</td>
                    <td style={{ border: "1px dashed #bbb", padding: 8, textAlign: "left" }}>{r.Ac_Name_E}</td>
                    <td style={{ border: "1px dashed #bbb", padding: 8, textAlign: "left" }}>{r.CityName}</td>
                    <td style={{ border: "1px dashed #bbb", padding: 8, textAlign: "right" }}>
                      {formatReadableAmount(r.Debit)}
                    </td>
                    <td style={{ border: "1px dashed #bbb", padding: 8, textAlign: "right" }}>
                      {formatReadableAmount(r.Credit)}
                    </td>
                    <td style={{ border: "1px dashed #bbb", padding: 8, textAlign: "right" }}>
                      {fmtDrCr(r.Balance)}
                    </td>
                  </tr>
                ))}
                <tr style={{ backgroundColor: "#fff9f0", fontWeight: "bold" }}>
                  <td colSpan={4} style={{ padding: 8, textAlign: "right" }}>
                    Subtotal
                  </td>
                  <td style={{ padding: 8, textAlign: "right" }}>
                    {formatReadableAmount(byType.totals.S.Debtors)}
                  </td>
                  <td style={{ padding: 8, textAlign: "right" }}>
                    {formatReadableAmount(byType.totals.S.Creditors)}
                  </td>
                  <td style={{ padding: 8, textAlign: "right" }}>{fmtDrCr(byType.totals.S.Net)}</td>
                </tr>
              </>
            )}

            {/* Overall Totals (server totals; swap to filteredTotals if you want search-aware totals) */}
            <tr style={{ backgroundColor: "#f0f0f0", fontWeight: "bold" }}>
              <td colSpan={4} style={{ padding: 8, textAlign: "right" }}>
                Overall Totals
              </td>
              <td style={{ padding: 8, textAlign: "right" }}>
                {formatReadableAmount(totals.Debtors)}
              </td>
              <td style={{ padding: 8, textAlign: "right" }}>
                {formatReadableAmount(totals.Creditors)}
              </td>
              <td style={{ padding: 8, textAlign: "right" }}>{fmtDrCr(totals.Net)}</td>
            </tr>
          </tbody>
        </table>

        {loading && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              background: "rgba(255,255,255,0.6)",
              zIndex: 3,
            }}
          >
            <RingLoader />
          </div>
        )}
      </div>
    </div>
  );
};

export default SundryDetailsReport;
