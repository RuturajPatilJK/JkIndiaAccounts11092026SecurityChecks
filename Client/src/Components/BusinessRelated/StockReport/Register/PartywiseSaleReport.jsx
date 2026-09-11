import React, { useState } from "react";
import MultipleAccountMasterHelp from "../../../../Helper/AccountMasterMultipleSelect";
import AccountMasterHelp from "../../../../Helper/AccountMasterHelp";
import SelectMultipleTenderNo from "../../../../Helper/selectMultiploetenderNo";
import * as XLSX from "xlsx";
import PrintButton from "../../../../Common/Buttons/PrintPDF";
import { Grid, Typography, Paper, Button } from "@mui/material";
import { formatReadableAmount } from "../../../../Common/FormatFunctions/FormatAmount";

const companyCode = sessionStorage.getItem("Company_Code");
const API_URL = process.env.REACT_APP_API;

const NewReports = () => {
    const [accounts, setAccounts] = useState([]);
    const [mill, setMill] = useState({ code: "", accoid: "", name: "" });
    const [tenders, setTenders] = useState([]);
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showCombined, setShowCombined] = useState(false);

    const getTodayDate = () => {
        const today = new Date();
        return today.toISOString().split("T")[0];
    };

    const [fromDate, setFromDate] = useState(getTodayDate());
    const [toDate, setToDate] = useState(getTodayDate());

    const handleMultipleAccounts = (data) => setAccounts(data || []);
    const handleMill = (code, accoid, name) => {
        setMill({ code, accoid, name });
        setTenders([]);
        setReportData([]);
    };

    const handleShowReport = async () => {
        // if (!accounts.length) {
        //   alert("Please select Account(s) or Mill and Tender(s)");
        //   return;
        // }

        const saleBillTo = accounts.map((a) => a.Ac_Code).join(",");
        const tenderNos = tenders.map((t) => t.Tender_No).join(",");

        const params = {
            SaleBillTo: saleBillTo,
            Mill_Code: mill.code,
            Tender_No: tenderNos,
        };

        if (fromDate && toDate) {
            params.From_Date = formatDate(fromDate);
            params.To_Date = formatDate(toDate);
        }

        const query = new URLSearchParams(params).toString();

        try {
            setLoading(true);
            const res = await fetch(
                `${API_URL}/select-tender-dispatch-details?${query}`,
            );
            const data = await res.json();
            setReportData(data || []);
        } catch (err) {
            console.error("API Error:", err);
            alert("Failed to load report");
        } finally {
            setLoading(false);
        }
    };

    const generateGradeWiseHTMLTable = (gradeWiseData) => {
        return `
    <table border="1" style="width:100%; border-collapse: collapse; font-family: Arial;">
      <tbody>
        ${gradeWiseData
                .map(
                    (grade) => `
            <tr style="background:#c8e6c9; font-weight:bold;">
              <td colspan="12" style="padding:6px;">Grade : ${grade.grade}</td>
            </tr>

            <tr style="background:#f5f5f5; font-weight:bold;">
              <th>Tender No</th><th>Mill</th><th>Sauda Name</th><th>Bill To</th>
              <th>Tender Date</th><th>Dispatch Date</th><th>Grade</th>
              <th>Mill Rate</th><th>Buyer Quantal</th><th>DO Quantal</th>
              <th>Truck No</th><th>Sale Rate</th>
            </tr>

            ${grade.saudaGroups
                            .map(
                                (sauda) => `
                <tr style="background:#e3f2fd; font-weight:bold;">
                  <td colspan="12">Sauda Name : ${sauda.saudaName}</td>
                </tr>

                ${sauda.rows
                                        .map(
                                            (r) => `
                    <tr>
                      <td>${r.Tender_No}</td>
                      <td>${r.millname}</td>
                      <td>${r.saudaname}</td>
                      <td>${r.billto}</td>
                      <td>${r.Tender_Date}</td>
                      <td>${r.doc_date}</td>
                      <td>${r.Grade}</td>
                      <td>${r.Mill_Rate}</td>
                      <td>${r.Buyer_Quantal}</td>
                      <td>${r.DO_Quantal}</td>
                      <td>${r.Truck_No}</td>
                      <td>${r.Sale_Rate}</td>
                    </tr>
                  `
                                        )
                                        .join("")}

                <tr style="background:#fffde7; font-weight:bold;">
                  <td colspan="9" style="text-align:right;">Sauda Total DO Quantal</td>
                  <td>${sauda.saudaTotal}</td>
                  <td colspan="2"></td>
                </tr>
              `
                            )
                            .join("")}

            <tr style="background:#ffccbc; font-weight:bold;">
              <td colspan="9" style="text-align:right;">Grade Total DO Quantal</td>
              <td>${grade.gradeTotal}</td>
              <td colspan="2"></td>
            </tr>

            <tr><td colspan="12" style="height:20px"></td></tr>
          `
                )
                .join("")}
      </tbody>
    </table>
  `;
    };


    const handlePrint = () => {
        if (!reportData.length) return alert("No report data to print!");

        const html = showCombined
            ? generateGradeWiseHTMLTable(gradeWiseData)
            : generateHTMLTable(groupedDataForDisplay);

        const win = window.open("", "", "height=700,width=900");
        win.document.write(`
    <html>
      <head>
        <title>Mill-wise Grade-wise Lifting Report</title>
        <style>
          body { font-family: Arial; margin: 20px; }
          th, td { border: 1px solid #ccc; padding: 6px; }
          th { background: #f2f2f2; }
        </style>
      </head>
      <body>
        
        ${html}
      </body>
    </html>
  `);
        win.document.close();
        win.print();
    };
    const handleExportToExcel = () => {
        if (!reportData.length) return alert("No report data!");

        const wb = XLSX.utils.book_new();
        const wsData = [];

        const header = [
            "Tender No", "Mill", "Sauda Name", "Bill To", "Tender Date",
            "Dispatch Date", "Grade", "Mill Rate", "Buyer Quantal",
            "DO Quantal", "Truck No", "Sale Rate",
        ];

        if (!showCombined) {
            // 🔹 Sauda → Grade
            groupedDataForDisplay.forEach((group) => {
                wsData.push([`Sauda Name : ${group.saudaName}`]);
                wsData.push(header);

                Object.values(group.gradeGroups).forEach((g) => {
                    g.rows.forEach((r) => {
                        wsData.push([
                            r.Tender_No, r.millname, r.saudaname, r.billto,
                            r.Tender_Date, r.doc_date, r.Grade,
                            r.Mill_Rate, r.Buyer_Quantal, r.DO_Quantal,
                            r.Truck_No, r.Sale_Rate,
                        ]);
                    });
                    wsData.push(["", "", "", "", "", "", "", "", "Grade Total", g.gradeTotal]);
                });

                wsData.push(["", "", "", "", "", "", "", "", "Sauda Total", group.totalDO]);
                wsData.push([]);
            });
        } else {
            // 🔸 Grade → Sauda
            gradeWiseData.forEach((grade) => {
                wsData.push([`Grade : ${grade.grade}`]);
                wsData.push(header);

                grade.saudaGroups.forEach((sauda) => {
                    wsData.push([`Sauda Name : ${sauda.saudaName}`]);

                    sauda.rows.forEach((r) => {
                        wsData.push([
                            r.Tender_No, r.millname, r.saudaname, r.billto,
                            r.Tender_Date, r.doc_date, r.Grade,
                            r.Mill_Rate, r.Buyer_Quantal, r.DO_Quantal,
                            r.Truck_No, r.Sale_Rate,
                        ]);
                    });

                    wsData.push(["", "", "", "", "", "", "", "", "Sauda Total", sauda.saudaTotal]);
                    wsData.push([]);
                });

                wsData.push(["", "", "", "", "", "", "", "", "Grade Total", grade.gradeTotal]);
                wsData.push([]);
            });
        }

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, "Mill-wise Grade-wise Lifting ");
        XLSX.writeFile(wb, "Mill-wise Grade-wise Lifting .xlsx");
    };


    const getGroupedData = (data) => {
        const groups = {};

        data.forEach((item) => {
            const sauda = item.saudaname || "";
            const grade = item.Grade || "";
            const doQty = Number(item.DO_Quantal || 0);

            if (!groups[sauda]) {
                groups[sauda] = {
                    gradeGroups: {},
                    totalDO: 0,
                };
            }

            if (!groups[sauda].gradeGroups[grade]) {
                groups[sauda].gradeGroups[grade] = {
                    rows: [],
                    gradeTotal: 0,
                };
            }

            groups[sauda].gradeGroups[grade].rows.push(item);
            groups[sauda].gradeGroups[grade].gradeTotal += doQty;

            groups[sauda].totalDO += doQty;
        });

        return Object.entries(groups).map(([saudaName, s]) => ({
            saudaName,
            gradeGroups: s.gradeGroups,
            totalDO: s.totalDO,
        }));
    };

    const gradeWiseData = Object.values(
        reportData.reduce((acc, row) => {
            const grade = row.Grade;
            const sauda = row.saudaname;

            // Create Grade
            if (!acc[grade]) {
                acc[grade] = {
                    grade,
                    gradeTotal: 0,
                    saudaGroups: {},
                };
            }

            // Create Sauda under Grade
            if (!acc[grade].saudaGroups[sauda]) {
                acc[grade].saudaGroups[sauda] = {
                    saudaName: sauda,
                    rows: [],
                    saudaTotal: 0,
                };
            }

            // Push row
            acc[grade].saudaGroups[sauda].rows.push(row);

            // Totals
            acc[grade].saudaGroups[sauda].saudaTotal += Number(row.DO_Quantal || 0);
            acc[grade].gradeTotal += Number(row.DO_Quantal || 0);

            return acc;
        }, {}),
    ).map((grade) => ({
        ...grade,
        saudaGroups: Object.values(grade.saudaGroups),
    }));



    const generateHTMLTable = (groupedData) => {
        return `
    <table border="1" style="width:100%; border-collapse:collapse; font-family:Arial;">
      <thead>
        <tr style="background:#1976d2;color:white;">
          <th>Tender No</th>
          <th>Mill</th>
          <th>Sauda Name</th>
          <th>Bill To</th>
          <th>Tender Date</th>
          <th>Dispatch Date</th>
          <th>Grade</th>
          <th>Mill Rate</th>
          <th>Buyer Quantal</th>
          <th>DO Quantal</th>
          <th>Truck No</th>
          <th>Sale Rate</th>
        </tr>
      </thead>
      <tbody>

        ${groupedData
                .map(
                    (group) => `
            <tr style="background:#e3f2fd;font-weight:bold;">
              <td colspan="12">Sauda Name : ${group.saudaName}</td>
            </tr>

            ${Object.entries(group.gradeGroups)
                            .map(
                                ([grade, gData]) => `
                <tr style="background:#f1f8e9;font-weight:bold;">
                  <td colspan="12">Grade : ${grade}</td>
                </tr>

                ${gData.rows
                                        .map(
                                            (r) => `
                    <tr>
                      <td>${r.Tender_No}</td>
                      <td>${r.millname}</td>
                      <td>${r.saudaname}</td>
                      <td>${r.billto}</td>
                      <td>${r.Tender_Date}</td>
                      <td>${r.doc_date}</td>
                      <td>${r.Grade}</td>
                      <td>${r.Mill_Rate}</td>
                      <td>${r.Buyer_Quantal}</td>
                      <td>${r.DO_Quantal}</td>
                      <td>${r.Truck_No}</td>
                      <td>${r.Sale_Rate}</td>
                    </tr>
                  `
                                        )
                                        .join("")}

                <tr style="background:#e8f5e9;font-weight:bold;">
                  <td colspan="9" style="text-align:right;">Total DO Quantal (Grade : ${grade})</td>
                  <td>${gData.gradeTotal}</td>
                  <td colspan="2"></td>
                </tr>
              `
                            )
                            .join("")}

            <tr style="background:#fff3e0;font-weight:bold;">
              <td colspan="9" style="text-align:right;">Total DO Quantal (Sauda)</td>
              <td>${group.totalDO}</td>
              <td colspan="2"></td>
            </tr>

            <tr><td colspan="12" style="height:20px"></td></tr>
          `
                )
                .join("")}

      </tbody>
    </table>
  `;
    };

    const groupedDataForDisplay = getGroupedData(reportData);

    const formatDate = (date) => {
        if (!date) return "";
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    };
    const overallGrandTotal = groupedDataForDisplay.reduce(
        (sum, group) => sum + group.totalDO,
        0,
    );

    return (
        <Paper sx={{ padding: 2 }}>
            <Typography variant="h6" align="center" mb={3}>
                Mill-wise Grade-wise Lifting Report
            </Typography>
            <Grid container spacing={1} mt={1}>
                <Grid item xs={12} sm={2}>
                    <div
                        className="SugarSaleBill-row"
                        style={{ display: "flex", alignItems: "center", marginTop: "0px" }}
                    >
                        <label className="SugarSaleBillLabel" style={{ width: "10px" }}>
                            From Date :
                        </label>
                        <input
                            type="date"
                            className="form-control"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                        />
                    </div>
                </Grid>

                <Grid item xs={12} sm={2}>
                    <div
                        className="SugarSaleBill-row"
                        style={{ display: "flex", alignItems: "center", marginTop: "0px" }}
                    >
                        <label className="SugarSaleBillLabel" style={{ width: "10px" }}>
                            To Date :
                        </label>
                        <input
                            type="date"
                            className="form-control"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                        />
                    </div>
                </Grid>
            </Grid>
            <div className="d-flex justify-content-end mb-2">
                <PrintButton disabledFeild={""} fetchData={handlePrint} />
                <button className="btn btn-success ms-2" onClick={handleExportToExcel}>
                    Export to Excel
                </button>
            </div>

            <Grid container spacing={2}>
                <Grid item xs={12} sm={12}>
                    <div
                        className="SugarSaleBill-rows"
                        style={{ marginTop: "10px", display: "flex", alignItems: "center" }}
                    >
                        <label htmlFor="Bill_From" className="SugarSaleBillLabel">
                            Select Accounts:
                        </label>

                        <div>
                            <MultipleAccountMasterHelp
                                name="MULTI_AC_CODE"
                                onAcCodeClick={handleMultipleAccounts}
                                CategoryName={accounts.map((a) => a.Ac_Name_E).join(", ")}
                                CategoryCode={accounts.map((a) => a.Ac_Code).join(",")}
                                tabIndexHelp={1}
                                Ac_type={["P", "M"]}
                            />
                        </div>
                    </div>
                </Grid>

                <Grid item xs={12} sm={9}>
                    <div
                        className="SugarSaleBill-rows"
                        style={{
                            marginTop: "10px",
                            display: "flex",
                            alignItems: "center",
                        }}
                    >
                        <label
                            htmlFor="MILL_CODE"
                            className="SugarSaleBillLabel"
                            style={{
                                width: "130px",
                                marginBottom: 0,
                            }}
                        >
                            Mill code :
                        </label>

                        <div style={{ flexGrow: 1 }}>
                            <AccountMasterHelp
                                name="MILL_CODE"
                                onAcCodeClick={handleMill}
                                CategoryName={mill.name}
                                CategoryCode={mill.code}
                                tabIndexHelp={2}
                                Ac_type={["P", "M"]}
                            />
                        </div>
                    </div>
                </Grid>

                <Grid item xs={12} sm={4}>
                    <div className="SugarSaleBill-row" style={{ marginTop: "10px" }}>
                        <label htmlFor="Bill_From" className="SugarSaleBillLabel">
                            Select Tender NO:
                        </label>
                        <div>
                            <SelectMultipleTenderNo
                                name="TENDER_HELP"
                                companyCode={companyCode}
                                millCode={mill.code}
                                onTenderSelect={setTenders}
                                tabIndex={3}
                                disabled={!mill.code}
                            />
                        </div>
                    </div>
                </Grid>
            </Grid>

            <Grid container justifyContent="center" mt={3}>
                <Button
                    variant="contained"
                    color="success"
                    onClick={() => {
                        setShowCombined(false);
                        handleShowReport();
                    }}
                >
                    Party wise Mill wise grade wise lifting
                </Button>
            </Grid>

            <Grid container justifyContent="center" mt={3}>
                <Button
                    variant="contained"
                    color="success"
                    onClick={() => {
                        setShowCombined(true);
                        handleShowReport();
                    }}
                >
                    Mill Wise Grade wise lifting
                </Button>
            </Grid>

            {loading && (
                <Typography align="center" mt={3}>
                    Loading report...
                </Typography>
            )}

            {!showCombined && groupedDataForDisplay.length > 0 && (
                <Paper sx={{ mt: 4, overflowX: "auto", padding: 1 }}>
                    {groupedDataForDisplay.map((group, gIndex) => (
                        <div key={gIndex} style={{ marginBottom: "30px" }}>
                            <div
                                style={{
                                    fontWeight: "bold",
                                    background: "#e3f2fd",
                                    padding: "6px",
                                    textAlign: "left",
                                }}
                            >
                                Sauda Name : {group.saudaName}
                            </div>

                            <table
                                style={{
                                    width: "100%",
                                    borderCollapse: "collapse",
                                    marginTop: 5,
                                }}
                            >
                                <thead>
                                    <tr>
                                        {[
                                            "Tender No",
                                            "Mill",
                                            "Sauda Name",
                                            "Bill To",
                                            "Tender Date",
                                            "Dispatch Date",
                                            "Grade",
                                            "Mill Rate",
                                            "Buyer Quantal",
                                            "DO Quantal",
                                            "Truck No",
                                            "Sale Rate",
                                        ].map((h) => (
                                            <th key={h} style={th}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>

                                <tbody>
                                    {Object.entries(group.gradeGroups).map(
                                        ([grade, gData], idx) => (
                                            <React.Fragment key={idx}>
                                                <tr
                                                    style={{ background: "#f1f8e9", fontWeight: "bold" }}
                                                >
                                                    <td
                                                        colSpan={12}
                                                        style={{ padding: "6px", textAlign: "left" }}
                                                    >
                                                        Grade : {grade}
                                                    </td>
                                                </tr>

                                                {gData.rows.map((r, i) => (
                                                    <tr key={i}>
                                                        <td style={td}>{r.Tender_No}</td>
                                                        <td style={tdd}>{r.millname}</td>
                                                        <td style={tdd}>{r.saudaname}</td>
                                                        <td style={tdd}>{r.billto}</td>
                                                        <td style={td}>{r.Tender_Date}</td>
                                                        <td style={td}>{r.doc_date}</td>
                                                        <td style={td}>{r.Grade}</td>
                                                        <td style={tdds}>
                                                            {formatReadableAmount(r.Mill_Rate)}
                                                        </td>
                                                        <td style={tdds}>{r.Buyer_Quantal}</td>
                                                        <td style={tdds}>{r.DO_Quantal}</td>
                                                        <td style={td}>{r.Truck_No}</td>
                                                        <td style={tdds}>
                                                            {formatReadableAmount(r.Sale_Rate)}
                                                        </td>
                                                    </tr>
                                                ))}

                                                {/* GRADE TOTAL */}
                                                <tr
                                                    style={{ background: "#e8f5e9", fontWeight: "bold" }}
                                                >
                                                    <td
                                                        colSpan={9}
                                                        style={{ textAlign: "right", padding: "6px" }}
                                                    >
                                                        Total DO Quantal (Grade : {grade})
                                                    </td>
                                                    <td style={td}>
                                                        {formatReadableAmount(gData.gradeTotal)}
                                                    </td>
                                                    <td colSpan={2}></td>
                                                </tr>
                                            </React.Fragment>
                                        ),
                                    )}

                                    <tr style={{ background: "#fff3e0", fontWeight: "bold" }}>
                                        <td
                                            colSpan={9}
                                            style={{ textAlign: "right", padding: "6px" }}
                                        >
                                            Total DO Quantal (Sauda)
                                        </td>
                                        <td style={td}>{group.totalDO}</td>
                                        <td colSpan={2}></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    ))}
                </Paper>
            )}

            {showCombined && gradeWiseData.length > 0 && (
                <Paper sx={{ mt: 4, overflowX: "auto", p: 1 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "50px" }}>
                        <tbody>
                            {gradeWiseData.map((gradeItem, gIdx) => (
                                <React.Fragment key={gIdx}>
                                    <tr style={{ background: "#c8e6c9", fontWeight: "bold" }}>
                                        <td
                                            colSpan={12}
                                            style={{ padding: "8px", textAlign: "left" }}
                                        >
                                            Grade : {gradeItem.grade}
                                        </td>
                                    </tr>

                                    {gradeItem.saudaGroups.map((sauda, sIdx) => (
                                        <React.Fragment key={sIdx}>
                                            <tr>
                                                {[
                                                    "Tender No",
                                                    "Mill",
                                                    "Sauda Name",
                                                    "Bill To",
                                                    "Tender Date",
                                                    "Dispatch Date",
                                                    "Grade",
                                                    "Mill Rate",
                                                    "Buyer Quantal",
                                                    "DO Quantal",
                                                    "Truck No",
                                                    "Sale Rate",
                                                ].map((h) => (
                                                    <th key={h} style={th}>
                                                        {h}
                                                    </th>
                                                ))}
                                            </tr>
                                            <tr style={{ background: "#e3f2fd", fontWeight: "bold" }}>
                                                <td
                                                    colSpan={12}
                                                    style={{ padding: "6px", textAlign: "left" }}
                                                >
                                                    Sauda Name : {sauda.saudaName}
                                                </td>
                                            </tr>

                                            {sauda.rows.map((r, i) => (
                                                <tr key={i}>
                                                    <td style={td}>{r.Tender_No}</td>
                                                    <td style={td}>{r.millname}</td>
                                                    <td style={td}>{r.saudaname}</td>
                                                    <td style={td}>{r.billto}</td>
                                                    <td style={td}>{r.Tender_Date}</td>
                                                    <td style={td}>{r.doc_date}</td>
                                                    <td style={td}>{r.Grade}</td>
                                                    <td style={td}>{formatReadableAmount(r.Mill_Rate)}</td>
                                                    <td style={td}>{r.Buyer_Quantal}</td>
                                                    <td style={td}>{r.DO_Quantal}</td>
                                                    <td style={td}>{r.Truck_No}</td>
                                                    <td style={td}>{formatReadableAmount(r.Sale_Rate)}</td>

                                                </tr>
                                            ))}

                                            {/* Sauda Total */}
                                            <tr style={{ background: "#fffde7", fontWeight: "bold" }}>
                                                <td
                                                    colSpan={9}
                                                    style={{ textAlign: "right", padding: "6px" }}
                                                >
                                                    Sauda Total DO Quantal
                                                </td>
                                                <td style={td}>
                                                    {formatReadableAmount(sauda.saudaTotal)}
                                                </td>
                                                <td colSpan={2}></td>
                                            </tr>

                                            <tr>
                                                <td colSpan={12} style={{ height: "20px" }}></td>
                                            </tr>
                                        </React.Fragment>
                                    ))}

                                    <tr style={{ background: "#ffccbc", fontWeight: "bold" }}>
                                        <td
                                            colSpan={9}
                                            style={{ textAlign: "right", padding: "8px", marginBottom: "20px" }}
                                        >
                                            Grade Total DO Quantal ({gradeItem.grade})
                                        </td>
                                        <td style={td}>
                                            {formatReadableAmount(gradeItem.gradeTotal)}
                                        </td>
                                        <td colSpan={2}></td>
                                    </tr>

                                    <tr>
                                        <td colSpan={12} style={{ height: "20px" }}></td>
                                    </tr>
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </Paper>
            )}
        </Paper>
    );
};

const th = {
    border: "1px solid #ccc",
    padding: "8px",
    background: "#f5f5f5",
    fontSize: "13px",
};
const td = {
    border: "1px solid #ccc",
    padding: "6px",
    fontSize: "13px",
};

const tdd = {
    border: "1px solid #ccc",
    padding: "6px",
    fontSize: "13px",
    textAlign: "left",
};

const tdds = {
    border: "1px solid #ccc",
    padding: "6px",
    fontSize: "13px",
    textAlign: "right",
};
export default NewReports;
