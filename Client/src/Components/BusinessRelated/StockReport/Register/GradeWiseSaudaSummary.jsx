
// import React, { useState, useEffect,useMemo } from "react";
// import MultipleAccountMasterHelp from "../../../../Helper/AccountMasterMultipleSelect";
// import AccountMasterHelp from "../../../../Helper/AccountMasterHelp";
// import SelectMultipleTenderNo from "../../../../Helper/selectMultiploetenderNo";
// import * as XLSX from "xlsx";
// import PrintButton from "../../../../Common/Buttons/PrintPDF";
// import { Grid, Typography, Paper, Button, TableContainer, Table, TableHead, TableCell, TableBody, TableRow, } from "@mui/material";
// import { formatReadableAmount } from "../../../../Common/FormatFunctions/FormatAmount";
// import SearchBar from "../../../../Common/UtilityCommon/SearchBar";


// const API_URL = process.env.REACT_APP_API;

// const GradeSaudaSummary = () => {
//     const [accounts, setAccounts] = useState([]);
//     const [mill, setMill] = useState({ code: "", accoid: "", name: "" });
//     const [tenders, setTenders] = useState([]);
//     const [reportData, setReportData] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const [showCombined, setShowCombined] = useState(false);
//     const [searchText, setSearchText] = useState("");

//     const getTodayDate = () => {
//         const today = new Date();
//         return today.toISOString().split("T")[0];
//     };

//     const [tenderMaster, setTenderMaster] = useState([]);
//     const [selectedTenders, setSelectedTenders] = useState([]);



//     const loadTenderMaster = async () => {
//         try {
//             const res = await fetch(`${API_URL}/get-tender-data`);
//             const data = await res.json();

//             console.log(data); // check response

//             setTenderMaster(Array.isArray(data.tender_master) ? data.tender_master : []);
//         } catch (error) {
//             console.error(error);
//         }
//     };

//     const handleShowReport = async () => {
//         try {
//             // if (selectedTenders.length === 0) {
//             //     alert("Please select at least one Tender");
//             //     return;
//             // }

//             const query = selectedTenders.join(",");

//             const res = await fetch(
//                 `${API_URL}/get-tender-data?tender_nos=${query}`
//             );

//             const data = await res.json();

//             setReportData(data.tender_details || []);

//         } catch (error) {
//             console.error(error);
//         }
//     };

//     useEffect(() => {
//         loadTenderMaster();
//     }, []);

//     useEffect(() => {
//         handleShowReport();
//     }, []);

//     const generateGradeWiseHTMLTable = (gradeWiseData) => {
//         return `
//     <table border="1" style="width:100%; border-collapse: collapse; font-family: Arial;">
//       <tbody>
//         ${gradeWiseData
//                 .map(
//                     (grade) => `
//             <tr style="background:#c8e6c9; font-weight:bold;">
//               <td colspan="12" style="padding:6px;">Grade : ${grade.grade}</td>
//             </tr>

//             <tr style="background:#f5f5f5; font-weight:bold;">
//               <th>Tender No</th><th>NetQntl</th><th>Grade Id</th><th>Grade Name</th>
//             </tr>

//             ${grade.saudaGroups
//                             .map(
//                                 (sauda) => `
//                 <tr style="background:#e3f2fd; font-weight:bold;">
//                   <td colspan="12">Sauda Name : ${sauda.saudaName}</td>
//                 </tr>

//                 ${sauda.rows
//                                         .map(
//                                             (r) => `
//                     <tr>
//                       <td>${r.Tender_No}</td>
//                       <td>${r.NetQntl}</td>
//                       <td>${r.gradeid}</td>
//                       <td>${r.System_Name_E}</td>
//                     </tr>
//                   `
//                                         )
//                                         .join("")}

//                 <tr style="background:#fffde7; font-weight:bold;">
//                   <td colspan="3" style="text-align:right;">Sauda Total DO Quantal</td>
//                   <td>${sauda.saudaTotal}</td>
//                   <td colspan="2"></td>
//                 </tr>
//               `
//                             )
//                             .join("")}

//             <tr style="background:#ffccbc; font-weight:bold;">
//               <td colspan="3" style="text-align:right;">Grade Total DO Quantal</td>
//               <td>${grade.gradeTotal}</td>
//               <td colspan="2"></td>
//             </tr>

//             <tr><td colspan="12" style="height:20px"></td></tr>
//           `
//                 )
//                 .join("")}
//       </tbody>
//     </table>
//   `;
//     };


//     const handlePrint = () => {
//         if (!reportData.length) return alert("No report data to print!");

//         const html = showCombined
//             ? generateGradeWiseHTMLTable(gradeWiseData)
//             : generateHTMLTable(groupedDataForDisplay);

//         const win = window.open("", "", "height=700,width=900");
//         win.document.write(`
//     <html>
//       <head>
//         <title>Grade-wise Summary Report</title>
//         <style>
//           body { font-family: Arial; margin: 20px; }
//           th, td { border: 1px solid #ccc; padding: 6px; }
//           th { background: #f2f2f2; }
//         </style>
//       </head>
//       <body>
        
//         ${html}
//       </body>
//     </html>
//   `);
//         win.document.close();
//         win.print();
//     };
//     const handleExportToExcel = () => {
//         if (!reportData.length) return alert("No report data!");

//         const wb = XLSX.utils.book_new();
//         const wsData = [];

//         const header = [
//             "Tender No", "Grade Id", "Grade Name", "NetQntl",
//         ];

//         if (!showCombined) {

//             groupedDataForDisplay.forEach((group) => {
//                 // wsData.push([`Sauda Name : ${group.saudaName}`]);
//                 wsData.push(header);

//                 Object.values(group.gradeGroups).forEach((g) => {
//                     g.rows.forEach((r) => {
//                         wsData.push([
//                             r.Tender_No, r.gradeid, r.System_Name_E, r.NetQntl,
//                         ]);
//                     });
//                     // wsData.push(["", "", "Grade Total", g.gradeTotal]);
//                 });

//                 wsData.push(["", "", "Total", group.totalDO]);
//                 wsData.push([]);
//             });
//         }

//         const ws = XLSX.utils.aoa_to_sheet(wsData);
//         XLSX.utils.book_append_sheet(wb, ws, "Grade-wise Summuary Report ");
//         XLSX.writeFile(wb, "Grade-wise Summuary Report.xlsx");
//     };


//     const getGroupedData = (data) => {
//         const groups = {};

//         data.forEach((item) => {
//             const sauda = item.saudaname || "";
//             const grade = item.Grade || "";
//             const doQty = Number(item.NetQntl || 0);

//             if (!groups[sauda]) {
//                 groups[sauda] = {
//                     gradeGroups: {},
//                     totalDO: 0,
//                 };
//             }

//             if (!groups[sauda].gradeGroups[grade]) {
//                 groups[sauda].gradeGroups[grade] = {
//                     rows: [],
//                     gradeTotal: 0,
//                 };
//             }

//             groups[sauda].gradeGroups[grade].rows.push(item);
//             groups[sauda].gradeGroups[grade].gradeTotal += doQty;

//             groups[sauda].totalDO += doQty;
//         });

//         return Object.entries(groups).map(([saudaName, s]) => ({
//             saudaName,
//             gradeGroups: s.gradeGroups,
//             totalDO: s.totalDO,
//         }));
//     };

//     const gradeWiseData = Object.values(
//         (Array.isArray(reportData) ? reportData : []).reduce((acc, row) => {
//             const grade = row.Grade;
//             const sauda = row.saudaname;

//             // Create Grade
//             if (!acc[grade]) {
//                 acc[grade] = {
//                     grade,
//                     gradeTotal: 0,
//                     saudaGroups: {},
//                 };
//             }

//             // Create Sauda under Grade
//             if (!acc[grade].saudaGroups[sauda]) {
//                 acc[grade].saudaGroups[sauda] = {
//                     saudaName: sauda,
//                     rows: [],
//                     saudaTotal: 0,
//                 };
//             }

//             // Push row
//             acc[grade].saudaGroups[sauda].rows.push(row);

//             // Totals
//             acc[grade].saudaGroups[sauda].saudaTotal += Number(row.DO_Quantal || 0);
//             acc[grade].gradeTotal += Number(row.DO_Quantal || 0);

//             return acc;
//         }, {}),
//     ).map((grade) => ({
//         ...grade,
//         saudaGroups: Object.values(grade.saudaGroups),
//     }));



//     const generateHTMLTable = (groupedData) => {
//         return `
//     <table border="1" style="width:100%; border-collapse:collapse; font-family:Arial;">
//       <thead>
//         <tr style="background:#1976d2;color:white;">
//           <th>Tender No</th>
//           <th>Grade Id</th>
//           <th>Grade Name</th>
//           <th>NetQntl</th>
//         </tr>
//       </thead>
//       <tbody>

//         ${groupedData
//                 .map(
//                     (group) => `
//             ${Object.entries(group.gradeGroups)
//                             .map(
//                                 ([grade, gData]) => `
//                 ${gData.rows
//                                         .map(
//                                             (r) => `
//                     <tr>
//                       <td>${r.Tender_No}</td>
//                       <td>${r.gradeid}</td>
//                       <td>${r.System_Name_E}</td>
//                       <td style="text-align:right;">${formatReadableAmount(r.NetQntl)}</td>
//                     </tr>
//                   `
//                                         )
//                                         .join("")}

//               `
//                             )
//                             .join("")}

//             <tr style="background:#fff3e0;font-weight:bold;">
//               <td colspan="3" style="text-align:right;">Total Net Quantal</td>
//               <td style="text-align:right;">${formatReadableAmount(group.totalDO)}</td>
//             </tr>
//           `
//                 )
//                 .join("")}

//       </tbody>
//     </table>
//   `;
//     };

//     const groupedDataForDisplay = getGroupedData(reportData);

//     const formatDate = (date) => {
//         if (!date) return "";
//         const d = new Date(date);
//         const day = String(d.getDate()).padStart(2, "0");
//         const month = String(d.getMonth() + 1).padStart(2, "0");
//         const year = d.getFullYear();
//         return `${day}/${month}/${year}`;
//     };
//     const overallGrandTotal = groupedDataForDisplay.reduce(
//         (sum, group) => sum + group.totalDO,
//         0,
//     );

//     const handleCheckboxChange = (tenderNo) => {
//         setSelectedTenders((prev) => {
//             if (prev.includes(tenderNo)) {
//                 setReportData((prevReport) =>
//                     prevReport.filter((r) => r.Tender_No !== tenderNo)
//                 );

//                 return prev.filter((t) => t !== tenderNo);
//             } else {
//                 return [...prev, tenderNo];
//             }
//         });
//     };

//     const filteredTenderMaster = useMemo(() => {
//         return tenderMaster.filter((item) => {
//             if (!searchText) return true;

//             const tenderNo = String(item.Tender_No || "").toLowerCase();
//             const quantal = String(item.Quantal || "").toLowerCase();
//             const millrate = String(item.Mill_Rate || "").toLowerCase();
//             const partyrate = String(item.Party_Bill_Rate || "").toLowerCase();
//             const shortname = String(item.Short_Name || "").toLowerCase();
//             const search = searchText.toLowerCase();

//             return (
//                 tenderNo.includes(search) ||
//                 quantal.includes(search) ||
//                 shortname.includes(search) ||
//                 millrate.includes(search) ||
//                 partyrate.includes(search)
//             );
//         });
//     }, [tenderMaster, searchText]);

//     return (
//         <Paper sx={{ padding: 1 }}>
//             <div style={{ justifyContent: "center" }}>
//                 <SearchBar
//                     value={searchText}
//                     onChange={(e) => setSearchText(e.target.value)}
//                     onSearch={(value) => setSearchText(value)}
//                 />
//             </div>
//             <Typography variant="h6" align="center" mb={2}>
//                 Grade-wise Summary Report
//             </Typography>

//             <div className="d-flex justify-content-end mb-2">
//                 <PrintButton disabledFeild={""} fetchData={handlePrint} />
//                 <button className="btn btn-success ms-2" onClick={handleExportToExcel}>
//                     Export to Excel
//                 </button>
//             </div>

//             <TableContainer component={Paper} style={{ maxHeight: '33vh', overflow: 'auto' }}>
//                 <Table stickyHeader size="small" aria-label="UTR Summary Table">
//                     <TableHead>
//                         <TableRow>
//                             {[
//                                 "Select", "Tender No", "Tender Date", "Lifting Date", "Short Name", "Quantal",
//                                 "Mill Rate", "Party Bill Rate",
//                             ].map((header, i) => (
//                                 <TableCell
//                                     key={i}
//                                     sx={{
//                                         position: 'sticky',
//                                         top: 0,
//                                         backgroundColor: '#f5f5f5',
//                                         fontWeight: 'bold',
//                                         textAlign: i >= 5 ? 'right' : 'left',
//                                         whiteSpace: 'nowrap'
//                                     }}
//                                 >
//                                     {header}
//                                 </TableCell>
//                             ))}
//                         </TableRow>
//                     </TableHead>

//                     <TableBody>
//                         {filteredTenderMaster.map((item, i) => (
//                             <React.Fragment key={i}>
//                                 <TableRow>
//                                     <TableCell>
//                                         <input
//                                             type="checkbox"
//                                             checked={selectedTenders.includes(item.Tender_No)}
//                                             onChange={() => handleCheckboxChange(item.Tender_No)}
//                                         />
//                                     </TableCell>
//                                     <TableCell>{item.Tender_No}</TableCell>
//                                     <TableCell>{formatDate(item.Tender_Date)}</TableCell>
//                                     <TableCell>{formatDate(item.Lifting_Date)}</TableCell>
//                                     <TableCell>{item.Short_Name}</TableCell>

//                                     <TableCell align="right">
//                                         {formatReadableAmount(item.Quantal)}
//                                     </TableCell>

//                                     <TableCell align="right">
//                                         {formatReadableAmount(item.Mill_Rate)}
//                                     </TableCell>

//                                     <TableCell align="right">
//                                         {formatReadableAmount(item.Party_Bill_Rate)}
//                                     </TableCell>
//                                 </TableRow>

//                                 {/* <TableRow>
//                                     <TableCell colSpan={4}></TableCell>
//                                     <TableCell align="right" sx={{ fontWeight: "bold", color: "blue" }}>
//                                         {formatReadableAmount(item.totalDO)}
//                                     </TableCell>
//                                     <TableCell colSpan={2}></TableCell>
//                                 </TableRow> */}
//                             </React.Fragment>
//                         ))}
//                     </TableBody>
//                 </Table>

//             </TableContainer>

//             <Button
//                 variant="contained"
//                 color="primary"
//                 onClick={handleShowReport}
//                 disabled={selectedTenders.length === 0}
//                 sx={{ mt: 2 }}
//             >
//                 Show Report
//             </Button>

//             {loading && (
//                 <Typography align="center" mt={3}>
//                     Loading report...
//                 </Typography>
//             )}

//             {!showCombined && groupedDataForDisplay.length > 0 && (
//                 <Paper sx={{ mt: 4, overflowX: "auto", padding: 1 }}>
//                     {groupedDataForDisplay.map((group, gIndex) => (
//                         <div key={gIndex} style={{ marginBottom: "40px" }}>

//                             <table
//                                 style={{
//                                     width: "100%",
//                                     borderCollapse: "collapse",
//                                     marginTop: 2,
//                                 }}
//                             >
//                                 <thead>
//                                     <tr>
//                                         {[
//                                             "Tender No",
//                                             "Grade Id",
//                                             "Grade Name",
//                                             "NetQntl",
//                                         ].map((h) => (
//                                             <th key={h} style={th}>
//                                                 {h}
//                                             </th>
//                                         ))}
//                                     </tr>
//                                 </thead>

//                                 <tbody>
//                                     {Object.entries(group.gradeGroups).map(
//                                         ([grade, gData], idx) => (
//                                             <React.Fragment key={idx}>

//                                                 {gData.rows.map((r, i) => (
//                                                     <tr key={i}>
//                                                         <td style={td}>{r.Tender_No}</td>
//                                                         <td style={td}>{r.gradeid}</td>
//                                                         <td style={td}>{r.System_Name_E}</td>
//                                                         <td style={td}>{formatReadableAmount(r.NetQntl)}</td>
//                                                     </tr>
//                                                 ))}

//                                                 {/* GRADE TOTAL */}
//                                                 <tr
//                                                     style={{ background: "#e8f5e9", fontWeight: "bold" }}
//                                                 >
//                                                     <td
//                                                         colSpan={3}
//                                                         style={{ textAlign: "right", padding: "6px" }}
//                                                     >
//                                                         Total Net Quantal
//                                                     </td>
//                                                     <td style={td}>
//                                                         {formatReadableAmount(group.totalDO)}
//                                                     </td>
//                                                 </tr>
//                                             </React.Fragment>
//                                         ),
//                                     )}
//                                 </tbody>
//                             </table>
//                         </div>
//                     ))}
//                 </Paper>
//             )}
//         </Paper>
//     );
// };

// const th = {
//     border: "1px solid #ccc",
//     padding: "8px",
//     background: "#f5f5f5",
//     fontSize: "13px",
// };
// const td = {
//     border: "1px solid #ccc",
//     padding: "6px",
//     fontSize: "13px",
// };

// const tdd = {
//     border: "1px solid #ccc",
//     padding: "6px",
//     fontSize: "13px",
//     textAlign: "left",
// };

// const tdds = {
//     border: "1px solid #ccc",
//     padding: "6px",
//     fontSize: "13px",
//     textAlign: "right",
// };
// export default GradeSaudaSummary;



















import React, { useState, useEffect, useMemo } from "react";
import axios from 'axios';
import * as XLSX from "xlsx";
import { 
    Grid, Typography, Paper, Button, TableContainer, Table, TableHead, 
    TableCell, TableBody, TableRow, Box, TableFooter, TableSortLabel 
} from "@mui/material";
import { ScaleLoader } from 'react-spinners';

// Common Utilities & Assets
import { formatReadableAmount } from "../../../../Common/FormatFunctions/FormatAmount";
import CommonSearchBar from "../../../../Common/SearchBar/ReportSearchBar";
import { generateReportPDF } from '../../../../Common/ReportCommon/CommonPDFGenerator';
import HeaderJK from '../../../../Assets/HeaderJK.png';
import FooterJK from '../../../../Assets/FooterJK.png';

const API_URL = process.env.REACT_APP_API;

// Column Configuration
const COLUMNS = [
    { label: "Tender No", key: "Tender_No", numeric: false },
    { label: "Grade Id", key: "gradeid", numeric: false },
    { label: "Grade Name", key: "System_Name_E", numeric: false },
    { label: "NetQntl", key: "NetQntl", numeric: true },
];

const GradeSaudaSummary = () => {
    // State Management
    const [tenderMaster, setTenderMaster] = useState([]);
    const [selectedTenders, setSelectedTenders] = useState([]);
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: 'Tender_No', direction: 'asc' });

    // Initial load of Tender Master data
    useEffect(() => {
        const fetchMaster = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`${API_URL}/get-tender-data`);
                setTenderMaster(Array.isArray(res.data.tender_master) ? res.data.tender_master : []);
            } catch (error) {
                console.error("Error fetching master data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchMaster();
    }, []);

    // Fetch report data based on user selection
    const handleShowReport = async () => {
        if (selectedTenders.length === 0) return;
        setLoading(true);
        try {
            const query = selectedTenders.join(",");
            const res = await axios.get(`${API_URL}/get-tender-data`, { params: { tender_nos: query } });
            setReportData(res.data.tender_details || []);
        } catch (error) {
            console.error("Error fetching report details:", error);
        } finally {
            setLoading(false);
        }
    };

    // Sorting Handler
    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Filtered Master Table (Selection Table)
    const filteredMaster = useMemo(() => {
        return tenderMaster.filter(item => 
            Object.values(item).some(val => String(val).toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [tenderMaster, searchTerm]);

    // Sorted and Grouped Report Data
    const { groupedData, grandTotals } = useMemo(() => {
        let items = [...reportData];
        
        // Apply Sorting
        items.sort((a, b) => {
            let aVal = a[sortConfig.key];
            let bVal = b[sortConfig.key];
            if (sortConfig.key === 'NetQntl') {
                return sortConfig.direction === 'asc' ? parseFloat(aVal) - parseFloat(bVal) : parseFloat(bVal) - parseFloat(aVal);
            }
            return sortConfig.direction === 'asc' 
                ? String(aVal).localeCompare(String(bVal)) 
                : String(bVal).localeCompare(String(aVal));
        });

        // Grouping by Sauda
        const groups = {};
        let grandTotal = 0;
        items.forEach((item) => {
            const sauda = item.saudaname || "General";
            if (!groups[sauda]) groups[sauda] = { items: [], total: 0 };
            groups[sauda].items.push(item);
            const qty = parseFloat(item.NetQntl) || 0;
            groups[sauda].total += qty;
            grandTotal += qty;
        });

        return { groupedData: groups, grandTotals: grandTotal };
    }, [reportData, sortConfig]);

    const handleCheckboxChange = (tenderNo) => {
        setSelectedTenders(prev => 
            prev.includes(tenderNo) ? prev.filter(t => t !== tenderNo) : [...prev, tenderNo]
        );
    };

    // Export to Excel
    const handleExportToExcel = () => {
        const excelRows = [];
        Object.entries(groupedData).forEach(([sauda, group]) => {
            excelRows.push({ "Tender No": `SAUDA: ${sauda}`, "Grade Id": "", "Grade Name": "", "NetQntl": "" });
            group.items.forEach(item => {
                excelRows.push({
                    "Tender No": item.Tender_No,
                    "Grade Id": item.gradeid,
                    "Grade Name": item.System_Name_E,
                    "NetQntl": item.NetQntl
                });
            });
            excelRows.push({ "Tender No": "SUB TOTAL", "Grade Id": "", "Grade Name": "", "NetQntl": group.total });
            excelRows.push({}); // Spacer
        });
        excelRows.push({ "Tender No": "GRAND TOTAL", "Grade Id": "", "Grade Name": "", "NetQntl": grandTotals });

        const ws = XLSX.utils.json_to_sheet(excelRows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Summary");
        XLSX.writeFile(wb, "Grade_Sauda_Summary.xlsx");
    };

    // Print PDF
    const handlePrintPDF = () => {
        setIsPrinting(true);
        const rows = [];
        Object.entries(groupedData).forEach(([sauda, group]) => {
            rows.push([{ content: `Sauda: ${sauda}`, colSpan: 4, styles: { fillColor: [232, 234, 246], fontStyle: 'bold' } }]);
            group.items.forEach(item => {
                rows.push([item.Tender_No, item.gradeid, item.System_Name_E, formatReadableAmount(item.NetQntl)]);
            });
            rows.push([
                { content: 'Sub Total', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } },
                { content: formatReadableAmount(group.total), styles: { fontStyle: 'bold' } }
            ]);
        });

        generateReportPDF({
            title: 'Grade-wise Summary Report',
            columns: COLUMNS.map(c => c.label),
            rows,
            footerRow: ['GRAND TOTAL', '', '', formatReadableAmount(grandTotals)],
            headerImgSrc: HeaderJK,
            footerImgSrc: FooterJK,
            numericCols: [3],
            onComplete: () => setIsPrinting(false)
        });
    };

    return (
        <Box sx={{ p: 2 }}>
            {/* Loader Overlay */}
            {(loading || isPrinting) && (
                <Box sx={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    bgcolor: 'rgba(255,255,255,0.7)', zIndex: 9999,
                    display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'
                }}>
                    <ScaleLoader color="#1a237e" height={50} width={6} margin={4} />
                    <Typography sx={{ mt: 2, fontWeight: 'bold', color: '#1a237e' }}>
                        {isPrinting ? "Generating Report..." : "Loading Data..."}
                    </Typography>
                </Box>
            )}

            <Typography variant="h6" align="center" sx={{ fontWeight: 'bold', mb: 2, textTransform: 'uppercase' }}>
                Grade-wise Summary Report
            </Typography>

            {/* Toolbar */}
            <Paper sx={{ p: 2, mb: 2, display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                <CommonSearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Filter Tenders..." />
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="contained" color="primary" onClick={handleShowReport} disabled={selectedTenders.length === 0}>Show Report</Button>
                    <Button variant="contained" color="success" onClick={handleExportToExcel} disabled={!reportData.length}>Excel</Button>
                </Box>
            </Paper>

            {/* Selection Table */}
            <TableContainer component={Paper} sx={{ maxHeight: '250px', mb: 3 }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ bgcolor: '#eee', fontWeight: 'bold' }}>Select</TableCell>
                            <TableCell sx={{ bgcolor: '#eee', fontWeight: 'bold' }}>Tender No</TableCell>
                            <TableCell sx={{ bgcolor: '#eee', fontWeight: 'bold' }}>Mill Name</TableCell>
                            <TableCell sx={{ bgcolor: '#eee', fontWeight: 'bold' }}>Qty</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredMaster.map((row) => (
                            <TableRow key={row.Tender_No} hover>
                                <TableCell>
                                    <input type="checkbox" checked={selectedTenders.includes(row.Tender_No)} onChange={() => handleCheckboxChange(row.Tender_No)} />
                                </TableCell>
                                <TableCell>{row.Tender_No}</TableCell>
                                <TableCell>{row.Short_Name}</TableCell>
                                <TableCell>{formatReadableAmount(row.Quantal)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Result Report Table */}
            {reportData.length > 0 && (
                <TableContainer component={Paper} sx={{ maxHeight: '55vh' }}>
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                {COLUMNS.map(col => (
                                    <TableCell key={col.key} align={col.numeric ? 'right' : 'left'} sx={{ bgcolor: '#1a237e', color: 'white' }}>
                                        <TableSortLabel
                                            active={sortConfig.key === col.key}
                                            direction={sortConfig.key === col.key ? sortConfig.direction : 'asc'}
                                            onClick={() => requestSort(col.key)}
                                            sx={{ '&.MuiTableSortLabel-active': { color: 'white' }, '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                                        >
                                            {col.label}
                                        </TableSortLabel>
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {Object.entries(groupedData).map(([sauda, group]) => (
                                <React.Fragment key={sauda}>
                                    <TableRow sx={{ bgcolor: '#e8eaf6' }}>
                                        <TableCell colSpan={4} sx={{ fontWeight: 'bold', color: '#1a237e' }}>Sauda: {sauda}</TableCell>
                                    </TableRow>
                                    {group.items.map((row, i) => (
                                        <TableRow key={i} hover>
                                            <TableCell>{row.Tender_No}</TableCell>
                                            <TableCell>{row.gradeid}</TableCell>
                                            <TableCell>{row.System_Name_E}</TableCell>
                                            <TableCell align="right">{formatReadableAmount(row.NetQntl)}</TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow sx={{ bgcolor: '#f1f8e9' }}>
                                        <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>Sub Total:</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>{formatReadableAmount(group.total)}</TableCell>
                                    </TableRow>
                                </React.Fragment>
                            ))}
                        </TableBody>
                        <TableFooter sx={{ position: 'sticky', bottom: 0, bgcolor: '#fff9c4', zIndex: 10 }}>
                            <TableRow>
                                <TableCell colSpan={3} sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>GRAND TOTAL</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{formatReadableAmount(grandTotals)}</TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );
};

export default GradeSaudaSummary;