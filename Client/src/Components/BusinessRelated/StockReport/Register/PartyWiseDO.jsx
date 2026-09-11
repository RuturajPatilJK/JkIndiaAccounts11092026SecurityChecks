// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import * as XLSX from 'xlsx';
// import { jsPDF } from 'jspdf';
// import 'jspdf-autotable';
// import { useNavigate, useLocation } from 'react-router-dom';
// import PdfPreview from '../../../../Common/PDFPreview';
// import { RingLoader } from 'react-spinners';
// import { Typography } from '@mui/material';
// import { FormaDateBalanceSheet } from "../../../../Common/FormatFunctions/FormatDate"
// import { formatReadableAmount } from "../../../../Common/FormatFunctions/FormatAmount";
// import PrintButton from '../../../../Common/Buttons/PrintPDF';

// const apikey = process.env.REACT_APP_API;

// const PartyWiseDo = () => {
//     const navigate = useNavigate();
//     const location = useLocation();

//     const searchParams = new URLSearchParams(location.search);
//     const fromDate = searchParams.get('fromDate');
//     const toDate = searchParams.get('toDate');
//     const acCode = searchParams.get('acCode');
//     const companyCode = sessionStorage.getItem('Company_Code');
//     const Year_Code = sessionStorage.getItem('Year_Code');
//     const Company_Name = sessionStorage.getItem('Company_Name');
//     const Company_GSTNO = sessionStorage.getItem('Company_GSTNO')

//     const [reportData, setReportData] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState('');
//     const [pdfPreview, setPdfPreview] = useState(null);

//     const API_URL = `${apikey}/PartyWiseDO`;

//     useEffect(() => {
//         const fetchReportData = async () => {
//             setLoading(true);
//             setError('');
//             try {
//                 const response = await axios.get(API_URL, {
//                     params: {
//                         fromDT: fromDate,
//                         toDT: toDate,
//                         Company_Code: companyCode,
//                         Year_Code: Year_Code,
//                         acCode: acCode
//                     },
//                 });

//                 // Ensure response data is an array
//                 const data = Array.isArray(response.data) ? response.data : [];
//                 setReportData(data);

//             } catch (error) {
//                 console.error('Error fetching report:', error);
//                 setError('Error fetching report');
//             } finally {
//                 setLoading(false);
//             }
//         };

//         if (fromDate && toDate) {
//             fetchReportData();
//         }
//     }, [fromDate, toDate, companyCode, Year_Code, acCode]);

//     const handlePrint = () => {
//         const printContent = document.getElementById('reportTable').outerHTML;
//         const win = window.open('', '', 'height=700,width=900');
//         win.document.write(`
//             <html>
//                 <head>
//                     <title>Print Report</title>
//                     <style>
//                         body { font-family: Arial; margin: 20px; }
//                         .company-name { text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 20px; }
//                         table { width: 100%; border-collapse: collapse; }
//                         th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
//                         th { background-color: #f2f2f2; font-weight: bold; }
//                         tr:nth-child(even) { background-color: #f9f9f9; }
//                         .total-row { background-color: #e0f7fa; font-weight: bold; }
//                     </style>
//                 </head>
//                 <body>
//                     <div class="company-name">${Company_Name}</div>
//                     ${printContent}
//                 </body>
//             </html>
//         `);
//         win.document.close();
//         win.print();
//     };

//     const generatePdf = () => {
//         const doc = new jsPDF();
//         const pageWidth = doc.internal.pageSize.getWidth();
//         const textWidth = doc.getTextWidth(Company_Name);
//         const xPosition = (pageWidth - textWidth) / 2;

//         doc.text(Company_Name, xPosition, 10);
//         doc.autoTable({ html: '#reportTable' });

//         const pdfBlob = doc.output('blob');
//         const url = URL.createObjectURL(pdfBlob);
//         setPdfPreview(url);
//     };

//     const handleExportToExcel = () => {
//         const wb = XLSX.utils.book_new();
//         const wsData = [];

//         wsData.push([Company_Name]);
//         wsData.push([]);
//         wsData.push(['Party Wise DO Report']);
//         wsData.push([]);
//         wsData.push(['DoNo', 'Date', 'Mill', 'Grade', 'Quantal', 'M Rate', 'Lorry No', 'SRate', 'Dispatch To', 'SB No']);

//         Object.entries(groupedReportData).forEach(([key, { items }]) => {
//             wsData.push([key]);

//             let totalQty = 0;

//             items.forEach(item => {
//                 const qty = parseFloat(item.DI_Qty) || 0;
//                 totalQty += qty;

//                 wsData.push([
//                     item.detail_id,
//                     item.DI_Date,
//                     item.millshortname,
//                     item.grade,
//                     qty,
//                     item.mill_rate,
//                     item.truck_no,
//                     item.sale_rate,
//                     item.getpassname,
//                     item.SB_No
//                 ]);
//             });

//             wsData.push(['', '', '', 'Total', totalQty.toFixed(2), '', '', '', '', '']);
//             wsData.push([]);
//         });

//         const ws = XLSX.utils.aoa_to_sheet(wsData);
//         XLSX.utils.book_append_sheet(wb, ws, 'PartyWiseDO');
//         XLSX.writeFile(wb, 'PartyWiseDO.xlsx');
//     };

//     const handleVoucherClick = (doc_no) => {
//         const url = `${window.location.origin}/delivery-order`;
//         const params = new URLSearchParams({ navigatedRecord: doc_no });
//         window.open(`${url}?${params.toString()}`, '_blank');
//     };

//     const handleSBNoClick = (doc_no) => {
//         const url = `${window.location.origin}/sale-bill`;
//         const params = new URLSearchParams({ navigatedRecord: doc_no });
//         window.open(`${url}?${params.toString()}`, '_blank');
//     };

//     const groupReportData = (data) => {
//         const grouped = {};

//         if (!Array.isArray(data)) {
//             console.error("Expected array in groupReportData, received:", data);
//             return grouped;
//         }

//         data.forEach(item => {
//             const key = `${item.voucher_by}-${item.voucherbyname}`;
//             if (!grouped[key]) {
//                 grouped[key] = { items: [] };
//             }
//             grouped[key].items.push(item);
//         });

//         return grouped;
//     };

//     const groupedReportData = groupReportData(reportData);

//     return (
//         <div style={{ marginTop: '-80px' }}>
//             {/* <Typography variant="h6" style={{ textAlign: 'center', fontSize: "24px", fontWeight: "bold" }}>{Company_Name}</Typography>
//             <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px", textDecoration: 'underline', fontWeight: "550" }}>GSTN : {Company_GSTNO}</Typography> */}

//             <div className="d-flex justify-content-between align-items-center ">
//                 <div style={{ flex: 1, textAlign: 'center', marginLeft: "280px" }}>
//                     <Typography variant="h6" style={{ textAlign: 'center', fontSize: "20px", fontWeight: "bold" }}>Party Wise DO</Typography>
//                     <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px" }}>{FormaDateBalanceSheet(fromDate)} to {FormaDateBalanceSheet(toDate)}</Typography>
//                 </div>

//                 <div className="d-flex justify-content-end gap-2">
//                     <PrintButton disabledFeild={""} fetchData={handlePrint} />
//                     <button className="btn btn-success me-2" onClick={handleExportToExcel}>Export to Excel</button>
//                     <button className="btn btn-secondary" onClick={generatePdf}>PDF</button>
//                 </div>
//             </div>


//             {loading ? (
//                 <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
//                     <RingLoader />
//                 </div>
//             ) : error ? (
//                 <div className="alert alert-danger">{error}</div>
//             ) : (
//                 <div style={{ maxHeight: "800px", overflowY: "auto" }}>
//                     <table className="table table-striped table-bordered mt-4" id="reportTable" style={{ marginBottom: "60px", width: "100%" }}>
//                         <thead className="table-light" style={{ position: "sticky", top: 0, backgroundColor: "#fff", zIndex: 1, whiteSpace: "nowrap" }}>
//                             <tr>
//                                 <th>Do No.</th>
//                                 <th>Date</th>
//                                 <th>Mill Name</th>
//                                 <th>Grade</th>
//                                 <th>Quintal</th>
//                                 <th>Mill Rate</th>
//                                 <th>Sale Rate</th>
//                                 <th>Lorry No</th>
//                                 <th>Dispatch To</th>
//                                 <th>Sale Bill No.</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {Object.entries(groupedReportData).map(([key, { items }]) => {
//                                 const totalQty = items.reduce((sum, item) => sum + parseFloat(item.DI_Qty || 0), 0);

//                                 return (
//                                     <React.Fragment key={key}>
//                                         <tr>
//                                             <td colSpan={10} align="left" className="table-primary" style={{ color: 'blue', fontWeight: 'bold' }}>{key}</td>
//                                         </tr>
//                                         {items.map((item, index) => (
//                                             <tr key={index}>
//                                                 <td
//                                                     align="center"
//                                                     style={{ cursor: 'pointer', color: 'blue', textDecoration: 'underline' }}
//                                                     onClick={() => handleVoucherClick(item.detail_id)}
//                                                 >
//                                                     {item.detail_id}
//                                                 </td>
//                                                 <td align="center" style={{ fontWeight: 'bold' }}>{item.DI_Date}</td>
//                                                 <td align="left">{item.millshortname}</td>
//                                                 <td align="left">{item.grade}</td>
//                                                 <td align="right">{item.DI_Qty}</td>
//                                                 <td align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(item.mill_rate)}</td>
//                                                 <td align="right">{formatReadableAmount(item.sale_rate)}</td>
//                                                 <td align="center">{item.truck_no}</td>
//                                                 <td align="left">{item.getpassname}</td>
//                                                 <td
//                                                     align="center"
//                                                     style={{ cursor: 'pointer', color: 'blue', textDecoration: 'underline' }}
//                                                     onClick={() => handleSBNoClick(item.SB_No)}
//                                                 >
//                                                     {item.SB_No}
//                                                 </td>
//                                             </tr>
//                                         ))}
//                                         <tr style={{ fontWeight: 'bold', backgroundColor: '#f0f8ff' }}>
//                                             <td colSpan={4} align="right">Total</td>
//                                             <td>{totalQty.toFixed(2)}</td>
//                                             <td colSpan={5}></td>
//                                         </tr>
//                                     </React.Fragment>
//                                 );
//                             })}
//                         </tbody>
//                     </table>
//                 </div>
//             )}

//             {pdfPreview && (
//                 <div className="centered-container">
//                     <PdfPreview pdfData={pdfPreview} apiData={reportData} label={'NewDispatchRegister'} />
//                 </div>
//             )}
//         </div>
//     );
// };

// export default PartyWiseDo;


















import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as XLSX from 'xlsx';
import { useLocation } from 'react-router-dom';
import { formatReadableAmount } from '../../../../Common/FormatFunctions/FormatAmount';
import { ScaleLoader } from 'react-spinners';
import {
    Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, Paper, Typography, TableSortLabel, TableFooter, Box
} from '@mui/material';
import { FormaDateBalanceSheet } from '../../../../Common/FormatFunctions/FormatDate';
import PdfPreview from '../../../../Common/PDFPreview';
import HeaderJK from '../../../../Assets/HeaderJK.png';
import FooterJK from '../../../../Assets/FooterJK.png';
import { generateReportPDF } from '../../../../Common/ReportCommon/CommonPDFGenerator';
import CommonSearchBar from '../../../../Common/SearchBar/ReportSearchBar';

const apikey = process.env.REACT_APP_API;

// Column definitions for the screen
const SCREEN_COLUMNS = [
    { label: 'Do No.', key: 'detail_id', width: '8%', isLink: true },
    { label: 'Date', key: 'DI_Date', width: '10%' },
    { label: 'Mill Name', key: 'millshortname', width: '15%' },
    { label: 'Grade', key: 'grade', width: '8%' },
    { label: 'Quintal', key: 'DI_Qty', width: '10%', numeric: true, isTotal: true },
    { label: 'Mill Rate', key: 'mill_rate', width: '10%', numeric: true },
    { label: 'Sale Rate', key: 'sale_rate', width: '10%', numeric: true },
    { label: 'Lorry No', key: 'truck_no', width: '10%' },
    { label: 'Dispatch To', key: 'getpassname', width: '12%' },
    { label: 'SB No.', key: 'SB_No', width: '7%', isLink: true },
];

// Column definitions for the PDF
const PRINT_COLUMNS = [
    { label: 'Do No', key: 'detail_id', printWidth: 20 },
    { label: 'Date', key: 'DI_Date', printWidth: 25 },
    { label: 'Mill', key: 'millshortname', printWidth: 35 },
    { label: 'Grade', key: 'grade', printWidth: 20 },
    { label: 'Quintal', key: 'DI_Qty', printWidth: 25, numeric: true, isTotal: true },
    { label: 'Mill Rate', key: 'mill_rate', printWidth: 25, numeric: true },
    { label: 'Sale Rate', key: 'sale_rate', printWidth: 25, numeric: true },
    { label: 'Lorry No', key: 'truck_no', printWidth: 30 },
    { label: 'Sale Bill No.', key: 'SB_No', printWidth: 20 },
];

const PartyWiseDo = () => {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const acCode = searchParams.get('acCode');

    const companyCode = sessionStorage.getItem('Company_Code');
    const Year_Code = sessionStorage.getItem('Year_Code');
    const Company_Name = sessionStorage.getItem("Company_Name");

    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const [error, setError] = useState('');
    const [pdfPreview, setPdfPreview] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'detail_id', direction: 'asc' });

    const API_URL = `${apikey}/PartyWiseDO`;

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await axios.get(API_URL, {
                    params: { fromDT: fromDate, toDT: toDate, Company_Code: companyCode, Year_Code: Year_Code, acCode: acCode },
                });
                setReportData(Array.isArray(res.data) ? res.data : []);
            } catch (err) { setError('Error fetching report'); }
            finally { setLoading(false); }
        };
        if (fromDate && toDate) fetchData();
    }, [fromDate, toDate, companyCode, Year_Code, acCode]);

    const filteredAndSortedData = useMemo(() => {
        let items = [...reportData];
        if (searchTerm) {
            items = items.filter((item) =>
                Object.values(item).some((val) => String(val).toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }
        if (sortConfig.key) {
            items.sort((a, b) => {
                const va = a[sortConfig.key] || 0;
                const vb = b[sortConfig.key] || 0;
                if (va < vb) return sortConfig.direction === 'asc' ? -1 : 1;
                if (va > vb) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return items;
    }, [reportData, sortConfig, searchTerm]);

    const { groupedData, grandTotals } = useMemo(() => {
        const groups = {};
        let grandQty = 0;
        filteredAndSortedData.forEach(item => {
            const key = `${item.voucher_by}-${item.voucherbyname}`;
            if (!groups[key]) {
                groups[key] = { items: [], totalQty: 0 };
            }
            const qty = parseFloat(item.DI_Qty) || 0;
            groups[key].items.push(item);
            groups[key].totalQty += qty;
            grandQty += qty;
        });
        return { groupedData: groups, grandTotals: { DI_Qty: grandQty } };
    }, [filteredAndSortedData]);

    const requestSort = (key) =>
        setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));

    const handleVoucherClick = (doc_no) => {
        window.open(`${window.location.origin}/delivery-order?navigatedRecord=${doc_no}`, '_blank');
    };

    const handleSBNoClick = (doc_no) => {
        if(doc_no) window.open(`${window.location.origin}/sale-bill?navigatedRecord=${doc_no}`, '_blank');
    };

    const handleExportToExcel = () => {
        const wb = XLSX.utils.book_new();
        const wsData = [
            [Company_Name?.toUpperCase()],
            [`Party Wise DO Report`],
            [`Period: ${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}`],
            [],
            SCREEN_COLUMNS.map(c => c.label)
        ];

        Object.entries(groupedData).forEach(([party, group]) => {
            wsData.push([party]);
            group.items.forEach(item => {
                wsData.push(SCREEN_COLUMNS.map(c => c.numeric ? (parseFloat(item[c.key]) || 0) : item[c.key]));
            });
            wsData.push(['', '', '', 'Sub Total:', group.totalQty, '', '', '', '', '']);
            wsData.push([]);
        });

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, 'PartyWiseDO');
        XLSX.writeFile(wb, `PartyWiseDO.xlsx`);
    };

   const handleGeneratePDF = () => {
    setIsPrinting(true);
    const rows = [];

    Object.entries(groupedData).forEach(([party, group]) => {
   
        rows.push([
            { 
                content: party, 
                colSpan: PRINT_COLUMNS.length, 
                styles: { fillColor: [232, 234, 246], fontStyle: 'bold', textColor: [26, 35, 126] } 
            }
        ]);

        // 2. Item Data Rows
        group.items.forEach(item => {
            rows.push(PRINT_COLUMNS.map(col => 
                col.numeric ? formatReadableAmount(item[col.key]) : item[col.key]
            ));
        });


        rows.push(PRINT_COLUMNS.map(col => {
            if (col.key === 'DI_Qty') {
                return { content: formatReadableAmount(group.totalQty), styles: { fontStyle: 'bold', halign: 'right' } };
            }
            if (col.key === 'grade') {
                return { content: 'Total:', styles: { fontStyle: 'bold', halign: 'right' } };
            }
            return '';
        }));

    
        rows.push([
            { 
                content: '-----------------------------------------------------------------------------------------------------------------------------------', 
                colSpan: PRINT_COLUMNS.length, 
                styles: { halign: 'center', textColor: [150, 150, 150], fontSize: 7, cellPadding: 1 } 
            }
        ]);
    });


    generateReportPDF({
        title: 'Party Wise DO',
        subtitle: `Period: ${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}`,
        columns: PRINT_COLUMNS.map(c => c.label),
        rows: rows,
        // 5. Grand Total Footer Row
        footerRow: PRINT_COLUMNS.map(col => {
            if (col.key === 'DI_Qty') {
                return { 
                    content: formatReadableAmount(grandTotals.DI_Qty), 
                    styles: { fontStyle: 'bold', halign: 'right', fillColor: [255, 249, 196] } 
                };
            }
            if (col.key === 'grade') {
                return { 
                    content: 'GRAND TOTAL:', 
                    styles: { fontStyle: 'bold', halign: 'right', fillColor: [255, 249, 196] } 
                };
            }
            return { content: '', styles: { fillColor: [255, 249, 196] } };
        }),
        headerImgSrc: HeaderJK,
        footerImgSrc: FooterJK,
        // Dotted borders configuration for the table itself
        tableStyles: { lineWidth: 0.1, lineColor: [200, 200, 200], lineDash: [1, 1] },
        numericCols: PRINT_COLUMNS.map((c, i) => c.numeric ? i : null).filter(i => i !== null),
        onComplete: (url) => {
            setPdfPreview(url);
            setIsPrinting(false);
        },
    });
};

    return (
        <Box sx={{ padding: '15px' }}>
            <Box sx={{ textAlign: 'center', marginTop: '-80px' }}>
                <Typography variant="h6" sx={{ textDecoration: 'underline', fontWeight: 'bold' }}>Party Wise DO</Typography>
                <Typography variant="subtitle2">
                    Date: {FormaDateBalanceSheet(fromDate)} to {FormaDateBalanceSheet(toDate)}
                </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center'}} className="no-print">
                <CommonSearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search Party, Mill, Truck..." />
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <button className="btn btn-danger btn-sm" onClick={handleGeneratePDF} disabled={isPrinting}>
                        {isPrinting ? 'Generating...' : 'Print'}
                    </button>
                    <button className="btn btn-success btn-sm" onClick={handleExportToExcel}>Export Excel</button>
                </Box>
            </Box>

            <TableContainer component={Paper} sx={{ maxHeight: '700px', boxShadow: 5 }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            {SCREEN_COLUMNS.map(col => (
                                <TableCell key={col.key} align={col.numeric ? 'right' : 'left'} style={{ backgroundColor: '#1a237e', color: '#fff', fontWeight: 'bold' }}>
                                    <TableSortLabel active={sortConfig.key === col.key} direction={sortConfig.direction} onClick={() => requestSort(col.key)} sx={{ '& .MuiTableSortLabel-icon': { color: '#fff !important' }, color: '#fff !important' }}>
                                        {col.label}
                                    </TableSortLabel>
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {Object.entries(groupedData).map(([party, group]) => (
                            <React.Fragment key={party}>
                                <TableRow>
                                    <TableCell colSpan={SCREEN_COLUMNS.length} sx={{ fontWeight: 'bold', backgroundColor: '#e8eaf6', color: '#1a237e' }}>{party}</TableCell>
                                </TableRow>
                                {group.items.map((item, idx) => (
                                    <TableRow key={idx} hover>
                                        {SCREEN_COLUMNS.map(col => (
                                            <TableCell key={col.key} align={col.numeric ? 'right' : 'left'} 
                                                onClick={col.key === 'detail_id' ? () => handleVoucherClick(item.detail_id) : col.key === 'SB_No' ? () => handleSBNoClick(item.SB_No) : undefined}
                                                style={col.isLink ? { cursor: 'pointer', color: '#1a237e', textDecoration: 'underline' } : {}}
                                            >
                                                {col.numeric ? formatReadableAmount(item[col.key]) : item[col.key]}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                    <TableCell colSpan={4} sx={{ fontWeight: 'bold', textAlign: 'right' }}>Party Total:</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>{formatReadableAmount(group.totalQty)}</TableCell>
                                    <TableCell colSpan={5}></TableCell>
                                </TableRow>
                            </React.Fragment>
                        ))}
                    </TableBody>
                    <TableFooter sx={{ position: 'sticky', bottom: 0, zIndex: 10, backgroundColor: '#fff9c4' }}>
                        <TableRow>
                            <TableCell colSpan={4} sx={{ fontWeight: 'bold', fontSize: '1rem' }}>GRAND TOTAL</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>{formatReadableAmount(grandTotals.DI_Qty)}</TableCell>
                            <TableCell colSpan={5}></TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </TableContainer>

            {pdfPreview && <PdfPreview pdfData={pdfPreview} label="PartyWiseDO" />}

            {(loading || isPrinting) && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(255,255,255,0.8)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Box sx={{ textAlign: 'center' }}>
                        <ScaleLoader color="#1a237e" height={40} margin={2} />
                        <Typography sx={{ mt: 2, fontWeight: 'bold', color: '#1a237e' }}>
                            {isPrinting ? "Generating PDF..." : "Loading Data..."}
                        </Typography>
                    </Box>
                </div>
            )}
            {error && <div className="alert alert-danger mt-3">{error}</div>}
        </Box>
    );
};

export default PartyWiseDo;
