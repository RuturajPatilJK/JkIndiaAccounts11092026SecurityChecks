import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import PdfPreview from "../../../../Common/PDFPreview";

const COLUMNS = [
  { key: "Ac_Code",      label: "Account Code" },
  { key: "Ac_Name_E",   label: "Account Name" },
  { key: "group_Name_E",label: "Group Name"   },
  { key: "State_Name",  label: "State"        },
  { key: "Ac_type",     label: "Type"         },
];

const SortIcon = ({ col, sortCol, sortDir }) => {
  const active = sortCol === col;
  return (
    <span style={{ marginLeft: 6, display: "inline-flex", flexDirection: "column", gap: 1, verticalAlign: "middle" }}>
      <span style={{ fontSize: 8, lineHeight: 1, color: active && sortDir === "asc"  ? "#2563eb" : "#bbb" }}>▲</span>
      <span style={{ fontSize: 8, lineHeight: 1, color: active && sortDir === "desc" ? "#2563eb" : "#bbb" }}>▼</span>
    </span>
  );
};

const AccountMasterPrintReport = () => {
  const [reportData, setReportData] = useState({});
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [pdfPreview, setPdfPreview] = useState(null);
  const [sortCol,    setSortCol]    = useState("Ac_Name_E");
  const [sortDir,    setSortDir]    = useState("asc");

  const location     = useLocation();
  const navigate     = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const acType     = searchParams.get("acType")    || "";
  const groupCode  = searchParams.get("groupCode") || "";
  const companyCode= searchParams.get("Company_Code") || sessionStorage.getItem("Company_Code");
  const stateWise  = searchParams.get("stateWise") === "true";

  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      setError("");
      try {
        let params = { Company_Code: companyCode };
        if (stateWise)  params.Statewise  = true;
        else if (acType)    params.Ac_type    = acType;
        else if (groupCode) params.Group_Code = groupCode;

        const response = await axios.get(
          `${process.env.REACT_APP_API}/accountmaster-print`,
          { params }
        );
        const data = response.data.data || [];

        const groupData = (arr, key) =>
          arr.reduce((acc, item) => {
            const k = item[key] || "Unknown";
            acc[k] = acc[k] || [];
            acc[k].push(item);
            return acc;
          }, {});

        if (stateWise)      setReportData(groupData(data, "State_Name"));
        else if (acType)    setReportData(groupData(data.filter(i => i.Ac_type === acType), "Ac_type"));
        else if (groupCode) setReportData(groupData(data.filter(i => i.Group_Code === groupCode), "group_Name_E"));
        else                setReportData({ "All Accounts": data });
      } catch (err) {
        console.error(err);
        setError("Failed to fetch report data.");
      } finally {
        setLoading(false);
      }
    };
    fetchReportData();
  }, [acType, groupCode, companyCode, stateWise]);

  const handleSort = (col) => {
    if (sortCol === col) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  };

  const sortRows = (rows) =>
    [...rows].sort((a, b) => {
      const va = (a[sortCol] ?? "").toString().toLowerCase();
      const vb = (b[sortCol] ?? "").toString().toLowerCase();
      if (va < vb) return sortDir === "asc" ? -1 :  1;
      if (va > vb) return sortDir === "asc" ?  1 : -1;
      return 0;
    });

  const totalRecords = Object.values(reportData).reduce((s, arr) => s + arr.length, 0);

  // ── Excel ──────────────────────────────────────────────────────────────────
  const handleExportToExcel = () => {
    const rows = [["#", "Account Code", "Account Name", "Group Name", "State", "Type"]];
    let serial = 1;
    Object.entries(reportData).forEach(([group, data]) => {
      rows.push([group, "", "", "", "", ""]);
      sortRows(data).forEach(row => {
        rows.push([serial++, row.Ac_Code, row.Ac_Name_E, row.group_Name_E, row.State_Name, row.Ac_type]);
      });
    });
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{ wch: 5 }, { wch: 12 }, { wch: 30 }, { wch: 22 }, { wch: 20 }, { wch: 8 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Account Master");
    XLSX.writeFile(wb, "AccountMasterReport.xlsx");
  };

  // ── Print ──────────────────────────────────────────────────────────────────
  const handlePrint = () => {
    const printArea = document.getElementById('printArea').innerHTML;
    const w = window.open('', '', 'height=660,width=1350');
    w.document.write(`<html><head><title>Account Master Report</title><style>
      body{font-family:Arial,sans-serif;font-size:12px}
      table{width:100%;border-collapse:collapse}
      th,td{padding:8px;text-align:left;border-bottom:1px solid #ddd}
      th{background:#f2f2f2;font-weight:bold;border-bottom:2px solid #ccc}
      .group-row td{background:#e8e8e8;font-weight:bold;padding:8px 10px}
    </style></head><body>${printArea}</body></html>`);
    w.document.close();
    setTimeout(() => { w.print(); w.close(); }, 500);
  };

  // ── PDF ────────────────────────────────────────────────────────────────────
  const generatePDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(16);
    doc.text("Account Master Report", 148.5, 15, { align: "center" });
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}  |  Total Records: ${totalRecords}`, 148.5, 22, { align: "center" });

    const body = [];
    Object.entries(reportData).forEach(([group, data]) => {
      body.push([{ content: `${group}  (${data.length} records)`, colSpan: 6, styles: { fillColor: [232, 232, 232], fontStyle: "bold" } }]);
      let serial = 1;
      sortRows(data).forEach(row => {
        body.push([serial++, row.Ac_Code, row.Ac_Name_E, row.group_Name_E, row.State_Name, row.Ac_type]);
      });
    });

    doc.autoTable({
      head: [["#", "Account Code", "Account Name", "Group Name", "State", "Type"]],
      body,
      startY: 28,
      theme: "grid",
      styles: { fontSize: 9, overflow: "linebreak" },
      headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: "bold" },
      columnStyles: { 0: { cellWidth: 10 }, 1: { cellWidth: 22 }, 2: { cellWidth: 70 }, 3: { cellWidth: 55 }, 4: { cellWidth: 45 }, 5: { cellWidth: 20 } },
    });

    const blob = doc.output("blob");
    setPdfPreview(URL.createObjectURL(blob));
  };

  // ── Styles ─────────────────────────────────────────────────────────────────
  const thStyle = {
    backgroundColor: "#f2f2f2",
    padding: "10px 10px",
    fontWeight: "bold",
    borderBottom: "2px solid #ddd",
    textAlign: "left",
    cursor: "pointer",
    userSelect: "none",
    whiteSpace: "nowrap",
    position: "sticky",
    top: 0,
    zIndex: 2,
  };

  const cellStyle   = { padding: "8px 10px", textAlign: "left" };
  const headerStyle = { textAlign: "center", marginBottom: 16, fontSize: 22, fontWeight: "bold" };
  const errorStyle  = { color: "red", textAlign: "center", marginTop: 20 };

  return (
    <div>
      {/* Toolbar */}
      <div className="d-flex mb-3 mt-1" style={{ gap: 8 }}>
        {pdfPreview && <PdfPreview pdfData={pdfPreview} apiData={reportData} label={"Account Master List"} />}
        <button onClick={generatePDF}>PDF Preview</button>
        <button onClick={handlePrint}>Print</button>
        <button className="btn btn-secondary" onClick={handleExportToExcel}>Export to Excel</button>
        <button onClick={() => navigate(-1)}>Back</button>
      </div>

      <div id="printArea" style={{ padding: "0 20px 20px" }}>
        <h1 style={headerStyle}>Account Master Report</h1>

        {loading && <p style={{ textAlign: "center" }}>Loading...</p>}
        {error   && <p style={errorStyle}>{error}</p>}

        {!loading && !error && Object.keys(reportData).length === 0 && (
          <p style={{ textAlign: "center" }}>No records found.</p>
        )}

        {!loading && !error && Object.keys(reportData).length > 0 && (
          <>
            <p style={{ marginBottom: 8, fontSize: 13, color: "#555" }}>
              Total: <strong>{totalRecords}</strong> record{totalRecords !== 1 ? "s" : ""}
              {sortCol && (
                <span style={{ marginLeft: 12, color: "#888" }}>
                  Sorted by <strong>{COLUMNS.find(c => c.key === sortCol)?.label}</strong> ({sortDir})
                </span>
              )}
            </p>

            {/* Single scrollable table with sticky header */}
            <div style={{ overflowY: "auto", maxHeight: "calc(100vh - 200px)", border: "1px solid #e5e7eb", borderRadius: 8 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, textAlign: "center", width: 40 }}>#</th>
                    {COLUMNS.map(col => (
                      <th
                        key={col.key}
                        style={thStyle}
                        onClick={() => handleSort(col.key)}
                      >
                        {col.label}
                        <SortIcon col={col.key} sortCol={sortCol} sortDir={sortDir} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(reportData).map(([group, data]) => {
                    const sorted = sortRows(data);
                    return (
                      <React.Fragment key={group}>
                        {/* Group header row */}
                        <tr className="group-row">
                          <td
                            colSpan={6}
                            style={{
                              backgroundColor: "#e8e8e8",
                              padding: "8px 12px",
                              fontWeight: "bold",
                              fontSize: 13,
                              borderTop: "2px solid #ccc",
                              borderBottom: "1px solid #ddd",
                            }}
                          >
                            {group}
                            <span style={{ marginLeft: 12, fontWeight: "normal", fontSize: 12, color: "#666" }}>
                              {data.length} record{data.length !== 1 ? "s" : ""}
                            </span>
                          </td>
                        </tr>

                        {/* Data rows */}
                        {sorted.map((row, index) => (
                          <tr
                            key={index}
                            style={{ backgroundColor: index % 2 === 0 ? "#fff" : "#fafafa", borderBottom: "1px solid #f0f0f0" }}
                          >
                            <td style={{ ...cellStyle, textAlign: "center", color: "#999", fontSize: 11 }}>{index + 1}</td>
                            <td style={cellStyle}>{row.Ac_Code}</td>
                            <td style={cellStyle}>{row.Ac_Name_E}</td>
                            <td style={cellStyle}>{row.group_Name_E}</td>
                            <td style={cellStyle}>{row.State_Name}</td>
                            <td style={cellStyle}>{row.Ac_type}</td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AccountMasterPrintReport;
