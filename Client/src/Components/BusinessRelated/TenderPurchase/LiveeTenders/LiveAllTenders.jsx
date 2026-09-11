// import React, { useEffect, useState } from "react";
// import {
//     Box, Grid, Typography, Table, TableBody, TableCell,
//     TableContainer, TableHead, TableRow, Paper, Divider
// } from "@mui/material";
// import axios from "axios";
// import io from "socket.io-client";
// import CircularSpinner from "../../../../Common/Spinners/CircularSpinner";
// import SearchBar from "../../../../Common/UtilityCommon/SearchBar";
// import { formatReadableAmount } from "../../../../Common/FormatFunctions/FormatAmount";

// const headerCellStyle = {
//     fontWeight: "bold",
//     backgroundColor: "#3f51b5",
//     color: "white",
//     padding: "8px",
//     textAlign: "center",
//     "&:hover": {
//         backgroundColor: "#303f9f",
//         cursor: "pointer",
//     },
// };

// const LiveAllTenders = () => {
//     const apikey = process.env.REACT_APP_API;
//     const socketURL = process.env.REACT_APP_API_URL;
//     const company_code = sessionStorage.getItem("Company_Code");
//     const year_code = sessionStorage.getItem("Year_Code");

//     const [tenders, setTenders] = useState([]);
//     const [filtered, setFiltered] = useState([]);
//     const [searchTerm, setSearchTerm] = useState("");
//     const [loading, setLoading] = useState(true);

//     // Fetch Tenders Data
//     const fetchTenders = async () => {
//         try {
//             // setLoading(true);
//             const res = await axios.get(
//                 `${apikey}/get_allTenders?Company_Code=${company_code}&Year_Code=${year_code}`
//             );
//             if (res.data.get_allTenders) {
//                 setTenders(res.data.get_allTenders);
//                 setFiltered(res.data.get_allTenders);
//             }
//         } catch (err) {
//             console.error("Error fetching tenders:", err);
//         }
//         // finally {
//         //     setLoading(false); 
//         // }
//     };

//     useEffect(() => {
//         const socket = io(`${socketURL}`, { transports: ["websocket"] });
//         socket.on("connect", () => console.log("Socket connected:", socket.id));
//         socket.on("get_allTenders", (data) => console.log("Connected to server:", data));
//         socket.on("tender_added", fetchTenders);
//         socket.on("tender_updated", fetchTenders);
//         socket.on("tender_deleted", fetchTenders);
//         fetchTenders();
//         return () => socket.disconnect();
//     }, []);

//     useEffect(() => {
//         const search = searchTerm.toLowerCase();
//         const filteredData = tenders.filter((item) =>
//             Object.values(item).some((val) =>
//                 String(val).toLowerCase().includes(search)
//             ));
//         setFiltered(filteredData);
//     }, [searchTerm, tenders]);

//     const handleSearchTermChange = (event) => {
//         setSearchTerm(event.target.value);
//     };

//     const groupByTenderDate = (data) => {
//         const grouped = {};
//         data.forEach(item => {
//             if (!grouped[item.Tender_Date]) {
//                 grouped[item.Tender_Date] = [];
//             }
//             grouped[item.Tender_Date].push(item);
//         });
//         return grouped;
//     };

//     const calculateTotalQuantity = (group) => {
//         return group.reduce((total, item) => total + parseFloat(item.Quantal || 0), 0);
//     };

//     const calculateResaleDifference = (item) => {
//         const purchaseRate = item.Purc_Rate === 0 ? 0 : parseFloat(item.Purc_Rate || 0);
//         const millRate = parseFloat(item.Mill_Rate || 0);
//         const Quantal = parseFloat(item.Quantal || 0);
//         return purchaseRate === 0 ? 0 : (millRate - purchaseRate) * Quantal;
//     };

//     const calculateTotalResaleDifference = (group) => {
//         return group.reduce((total, item) => total + calculateResaleDifference(item), 0);
//     };

//     return (
//         <Box style={{ marginTop: '-100px' }}>
//             <Grid spacing={2} alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
//                 <Grid item xs={12} sm={6}>
//                     <SearchBar value={searchTerm} onChange={handleSearchTermChange} />
//                 </Grid>
//             </Grid>

//             <Paper elevation={3} sx={{ overflow: "auto", maxHeight: "90vh" }}>
//                 <TableContainer>
//                     {/* {loading ? (
//                         <Box display="flex" justifyContent="center" alignItems="center" height="300px">
//                             <CircularSpinner />
//                         </Box>
//                     ) : ( */}
//                     <div style={{ maxHeight: '750px', overflow: 'auto' }}>
//                         <Table size="small" stickyHeader>
//                             <TableHead>
//                                 <TableRow>
//                                     <TableCell style={{ whiteSpace: "nowrap" }} sx={headerCellStyle}><strong>Tender No</strong></TableCell>
//                                     <TableCell sx={headerCellStyle}><strong>Tender Date</strong></TableCell>
//                                     <TableCell sx={headerCellStyle}><strong>Lifting date</strong></TableCell>
//                                     <TableCell sx={headerCellStyle}><strong>Payment To</strong></TableCell>
//                                     <TableCell sx={headerCellStyle}><strong>Mill Name</strong></TableCell>
//                                     <TableCell sx={headerCellStyle}><strong>Grade</strong></TableCell>
//                                     <TableCell sx={headerCellStyle}><strong>Season</strong></TableCell>
//                                     <TableCell sx={headerCellStyle}><strong>Quantity</strong></TableCell>
//                                     <TableCell sx={headerCellStyle}><strong>Packing</strong></TableCell>
//                                     <TableCell sx={headerCellStyle}><strong>Bags</strong></TableCell>
//                                     <TableCell sx={headerCellStyle}><strong>Mill Rate</strong></TableCell>
//                                     <TableCell style={{ whiteSpace: "nowrap" }} sx={headerCellStyle}><strong>Purchase Rate</strong></TableCell>
//                                     <TableCell sx={headerCellStyle}><strong>Resale Diff.</strong></TableCell>
//                                 </TableRow>
//                             </TableHead>
//                             <TableBody>
//                                 {filtered.length > 0 ? (
//                                     Object.entries(groupByTenderDate(filtered)).map(([date, group], groupIndex) => (
//                                         <React.Fragment key={date}>
//                                             {group.map((item, index) => (
//                                                 <TableRow key={`${groupIndex}-${index}`} hover>
//                                                     <TableCell>{item.Tender_No}</TableCell>
//                                                     <TableCell>{item.Tender_Date}</TableCell>
//                                                     <TableCell>{item.Lifting_Date}</TableCell>
//                                                     <TableCell>{item.DO}</TableCell>
//                                                     <TableCell>{item.Mill_Name}</TableCell>
//                                                     <TableCell align="center">{item.Grade}</TableCell>
//                                                     <TableCell>{item.season}</TableCell>
//                                                     <TableCell align="right">{item.Quantal}</TableCell>
//                                                     <TableCell align="right">{item.Packing}</TableCell>
//                                                     <TableCell align="right">{item.Bags}</TableCell>
//                                                     <TableCell align="right">{item.Mill_Rate}</TableCell>
//                                                     <TableCell align="right">{item.Purc_Rate}</TableCell>
//                                                     <TableCell align="right" style={{
//                                                         color: calculateResaleDifference(item) >= 0 ? 'green' : 'red',
//                                                         fontWeight: 'bold'
//                                                     }}>{formatReadableAmount(calculateResaleDifference(item).toFixed(2))}</TableCell>
//                                                 </TableRow>
//                                             ))}

//                                             <TableRow sx={{ backgroundColor: '#edf0dfff' }}>
//                                                 <TableCell colSpan={7} align="right">
//                                                     <strong>Total for {date}:</strong>
//                                                 </TableCell>
//                                                 <TableCell align="right">
//                                                     <strong>{formatReadableAmount(calculateTotalQuantity(group).toFixed(2))}</strong>
//                                                 </TableCell>
//                                                 <TableCell colSpan={4}></TableCell>
//                                                 <TableCell align="right" style={{
//                                                     color: calculateTotalResaleDifference(group) >= 0 ? 'green' : 'red',
//                                                     fontWeight: 'bold',
//                                                     whiteSpace: 'nowrap',
//                                                 }}

//                                                 >
//                                                     Resale Diff : <strong>{formatReadableAmount(calculateTotalResaleDifference(group).toFixed(2))}</strong>
//                                                 </TableCell>
//                                             </TableRow>

//                                             <TableRow>
//                                                 <TableCell colSpan={12} sx={{ height: '10px', borderBottom: 'none' }} />
//                                             </TableRow>

//                                             <TableRow>
//                                                 <TableCell colSpan={12} sx={{ padding: 0, border: 0 }}>
//                                                     <Divider
//                                                         sx={{
//                                                             borderBottomWidth: 2,
//                                                             backgroundColor: '#3f51b5',
//                                                             height: '2px',
//                                                             transition: 'background-color 0.3s ease',
//                                                             '&:hover': {
//                                                                 backgroundColor: '#0a1deeff',
//                                                             },
//                                                         }}
//                                                     />
//                                                 </TableCell>
//                                             </TableRow>

//                                             <TableRow>
//                                                 <TableCell colSpan={12} sx={{ height: '10px', borderBottom: 'none' }} />
//                                             </TableRow>
//                                         </React.Fragment>
//                                     ))
//                                 ) : (
//                                     <TableRow>
//                                         <TableCell colSpan={12} align="center">Data Not Found!</TableCell>
//                                     </TableRow>
//                                 )}
//                             </TableBody>
//                         </Table>
//                     </div>
//                     {/* )} */}
//                 </TableContainer>
//             </Paper>
//         </Box>
//     );
// };

// export default LiveAllTenders;













import React, { useEffect, useState, useMemo } from "react";
import {
    Box, Typography, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, TableSortLabel, Button
} from "@mui/material";
import axios from "axios";
import io from "socket.io-client";
import * as XLSX from 'xlsx';
import { ScaleLoader } from 'react-spinners';
import SearchBar from "../../../../Common/UtilityCommon/SearchBar";
import { formatReadableAmount } from "../../../../Common/FormatFunctions/FormatAmount";
import PrintButton from "../../../../Common/Buttons/PrintPDF";

// PDF Generator Imports
import { generateReportPDF } from "../../../../Common/ReportCommon/CommonPDFGenerator";
import { ConvertNumberToWord } from "../../../../Common/FormatFunctions/ConvertNumberToWord";
import HeaderJK from '../../../../Assets/HeaderJK.png';
import FooterJK from '../../../../Assets/FooterJK.png';

const headerCellStyle = {
    fontWeight: "bold",
    backgroundColor: "#3f51b5",
    color: "white",
    padding: "8px",
    textAlign: "center",
};

const LiveAllTenders = () => {
    const apikey = process.env.REACT_APP_API;
    const socketURL = process.env.REACT_APP_API_URL;
    const company_code = sessionStorage.getItem("Company_Code");
    const year_code = sessionStorage.getItem("Year_Code");

    const [tenders, setTenders] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: 'Tender_No', direction: 'desc' });

    const fetchTenders = async () => {
        try {
            setLoading(true);
            const res = await axios.get(
                `${apikey}/get_allTenders?Company_Code=${company_code}&Year_Code=${year_code}`
            );
            if (res.data.get_allTenders) {
                setTenders(res.data.get_allTenders);
            }
        } catch (err) {
            console.error("Error fetching tenders:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const socket = io(`${socketURL}`, { transports: ["websocket"] });
        socket.on("tender_added", fetchTenders);
        socket.on("tender_updated", fetchTenders);
        socket.on("tender_deleted", fetchTenders);
        fetchTenders();
        return () => socket.disconnect();
    }, []);

    const calculateResaleDifference = (item) => {
        const purchaseRate = parseFloat(item.Purc_Rate || 0);
        const millRate = parseFloat(item.Mill_Rate || 0);
        const quantal = parseFloat(item.Quantal || 0);
        return purchaseRate === 0 ? 0 : (millRate - purchaseRate) * quantal;
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const processedData = useMemo(() => {
        let filteredData = tenders.filter((item) =>
            Object.values(item).some((val) =>
                String(val).toLowerCase().includes(searchTerm.toLowerCase())
            )
        );

        if (sortConfig.key) {
            filteredData.sort((a, b) => {
                let aVal = a[sortConfig.key];
                let bVal = b[sortConfig.key];
                if (!isNaN(aVal) && !isNaN(bVal)) {
                    aVal = parseFloat(aVal);
                    bVal = parseFloat(bVal);
                }
                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return filteredData;
    }, [tenders, searchTerm, sortConfig]);

    const groupedData = useMemo(() => {
        const grouped = {};
        processedData.forEach(item => {
            if (!grouped[item.Tender_Date]) grouped[item.Tender_Date] = [];
            grouped[item.Tender_Date].push(item);
        });
        return grouped;
    }, [processedData]);

    const handleExportExcel = () => {
        const dataForExcel = processedData.map(item => ({
            "Tender No": item.Tender_No,
            "Date": item.Tender_Date,
            "Lifting": item.Lifting_Date,
            "Payment To": item.DO,
            "Mill Name": item.Mill_Name,
            "Grade": item.Grade,
            "Quantity": parseFloat(item.Quantal || 0),
            "Mill Rate": parseFloat(item.Mill_Rate || 0),
            "Purc Rate": parseFloat(item.Purc_Rate || 0),
            "Resale Diff": calculateResaleDifference(item)
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Daily Purchase");

        worksheet["!cols"] = [
            { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 25 }, { wch: 25 },
            { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 }
        ];

        XLSX.writeFile(workbook, "Daily_Purchase_Report.xlsx");
    };

    const handlePrint = () => {
        const columns = [
            "Tender No", "Date", "Lifting", "Payment To", "Mill Name",
            "Grade", "Qty", "Mill Rate", "Purc Rate", "Diff"
        ];
        const rows = [];
        let grandTotalQty = 0;
        let grandTotalDiff = 0;

        // Standard yellow highlight style [255, 249, 196]
        const yellowStyle = {
            fillColor: [255, 249, 196],
            fontStyle: 'bold'
        };

        Object.entries(groupedData).forEach(([date, items]) => {
            let dateSubtotalQty = 0;
            let dateSubtotalDiff = 0;

            items.forEach(item => {
                const diff = calculateResaleDifference(item);
                dateSubtotalQty += parseFloat(item.Quantal || 0);
                dateSubtotalDiff += diff;

                rows.push([
                    item.Tender_No, item.Tender_Date, item.Lifting_Date, item.DO, item.Mill_Name,
                    item.Grade,
                    { content: formatReadableAmount(item.Quantal), styles: { halign: 'right' } },
                    { content: formatReadableAmount(item.Mill_Rate), styles: { halign: 'right' } },
                    { content: formatReadableAmount(item.Purc_Rate), styles: { halign: 'right' } },
                    { content: formatReadableAmount(diff.toFixed(2)), styles: { halign: 'right' } }
                ]);
            });

            // 1. Date-wise Subtotal Row (Styled in YELLOW)
            rows.push([
                {
                    content: `Subtotal for ${date}:`,
                    colSpan: 6,
                    styles: { ...yellowStyle, halign: 'right' }
                },
                {
                    content: formatReadableAmount(dateSubtotalQty.toFixed(2)),
                    styles: { ...yellowStyle, halign: 'right' }
                },
                { content: '', styles: yellowStyle },
                { content: '', styles: yellowStyle },
                {
                    content: formatReadableAmount(dateSubtotalDiff.toFixed(2)),
                    styles: { ...yellowStyle, halign: 'right' }
                }
            ]);

            // 2. Dotted Separator Line
            rows.push([
                {
                    content: '------------------------------------------------------------------------------------------------------------------------------------------------------------------',
                    colSpan: 10,
                    styles: {
                        halign: 'center',
                        textColor: [150, 150, 150],
                        fontSize: 8,
                        cellPadding: 1
                    }
                }
            ]);

            grandTotalQty += dateSubtotalQty;
            grandTotalDiff += dateSubtotalDiff;
        });

        generateReportPDF({
            title: 'Date Wise Daily Purchase Report',
            columns: columns,
            rows: rows,
            // 3. Final Grand Total Row (Styled in YELLOW)
            footerRow: [
                { content: 'GRAND TOTAL', colSpan: 6, styles: { ...yellowStyle, halign: 'right' } },
                { content: formatReadableAmount(grandTotalQty.toFixed(2)), styles: { ...yellowStyle, halign: 'right' } },
                { content: '', styles: yellowStyle },
                { content: '', styles: yellowStyle },
                { content: formatReadableAmount(grandTotalDiff.toFixed(2)), styles: { ...yellowStyle, halign: 'right' } }
            ],
            orientation: 'landscape',
            headerImgSrc: HeaderJK,
            footerImgSrc: FooterJK,
            amountInWords: ConvertNumberToWord(Math.abs(grandTotalDiff)),
            onComplete: (url) => window.open(url, "_blank"),
        });
    };
    return (
        <Box style={{ marginTop: '-60px' }}>
            <Typography variant="h6" sx={{ textAlign: 'center', fontWeight: 'bold', color: '#3f51b5' }}>
                DATE WISE DAILY PURCHASE REPORT
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }} style={{ marginLeft: '600px' }}>
                <Box sx={{ flexGrow: 1, maxWidth: '600px' }}>
                    <SearchBar value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <PrintButton fetchData={handlePrint} />
                    <Button
                        variant="contained"
                        color="success"
                        onClick={handleExportExcel}
                        sx={{ textTransform: 'none', fontWeight: 'bold', height: '35px' }}
                    >
                        Export Excel
                    </Button>
                </Box>
            </Box>

            <Paper elevation={3}>
                <TableContainer sx={{ maxHeight: '75vh' }}>
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 5 }}>
                            <ScaleLoader color="#36d7b7" height={35} width={4} radius={2} margin={2} />
                        </Box>
                    ) : (
                        <Table size="small" stickyHeader>
                            <TableHead>
                                <TableRow>
                                    {[
                                        { id: 'Tender_No', label: 'Tender No', align: 'left' },
                                        { id: 'Tender_Date', label: 'Tender Date', align: 'left' },
                                        { id: 'Lifting_Date', label: 'Lifting Date', align: 'left' },
                                        { id: 'DO', label: 'Payment To', align: 'left' },
                                        { id: 'Mill_Name', label: 'Mill Name', align: 'left' },
                                        { id: 'Grade', label: 'Grade', align: 'center' },
                                        { id: 'Quantal', label: 'Quantity', align: 'right' },
                                        { id: 'Mill_Rate', label: 'Mill Rate', align: 'right' },
                                        { id: 'Purc_Rate', label: 'Purchase Rate', align: 'right' },
                                        { id: 'resale_diff', label: 'Resale Diff.', align: 'right' }

                                    ].map((col) => (
                                        <TableCell key={col.id} sx={headerCellStyle} align={col.align}>
                                            <TableSortLabel
                                                active={sortConfig.key === col.id}
                                                direction={sortConfig.key === col.id ? sortConfig.direction : 'asc'}
                                                onClick={() => handleSort(col.id)}
                                                sx={{ '& .MuiTableSortLabel-icon': { color: 'white !important' }, color: 'white !important' }}
                                            >
                                                <strong>{col.label}</strong>
                                            </TableSortLabel>
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {Object.entries(groupedData).map(([date, group], gIdx) => (
                                    <React.Fragment key={date}>
                                        {group.map((item, idx) => {
                                            const diff = calculateResaleDifference(item);
                                            return (
                                                <TableRow key={`${gIdx}-${idx}`} hover>
                                                    <TableCell>{item.Tender_No}</TableCell>
                                                    <TableCell>{item.Tender_Date}</TableCell>
                                                    <TableCell>{item.Lifting_Date}</TableCell>
                                                    <TableCell>{item.DO}</TableCell>
                                                    <TableCell>{item.Mill_Name}</TableCell>
                                                    <TableCell align="center">{item.Grade}</TableCell>
                                                    <TableCell align="right">{formatReadableAmount(item.Quantal)}</TableCell>
                                                    <TableCell align="right">{formatReadableAmount(item.Mill_Rate)}</TableCell>
                                                    <TableCell align="right">{formatReadableAmount(item.Purc_Rate)}</TableCell>
                                                    <TableCell align="right" style={{ color: diff >= 0 ? 'green' : 'red', fontWeight: 'bold' }}>
                                                        {formatReadableAmount(diff.toFixed(2))}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                        {/* Date-wise Subtotal in UI */}
                                        <TableRow sx={{ backgroundColor: '#fdfdea' }}>
                                            <TableCell colSpan={6} align="right"><strong>Subtotal for {date}:</strong></TableCell>
                                            <TableCell align="right"><strong>{formatReadableAmount(group.reduce((t, i) => t + parseFloat(i.Quantal || 0), 0).toFixed(2))}</strong></TableCell>
                                            <TableCell colSpan={2}></TableCell>
                                            <TableCell align="right" style={{ color: group.reduce((t, i) => t + calculateResaleDifference(i), 0) >= 0 ? 'green' : 'red', fontWeight: 'bold' }}>
                                                {formatReadableAmount(group.reduce((t, i) => t + calculateResaleDifference(i), 0).toFixed(2))}
                                            </TableCell>
                                        </TableRow>
                                    </React.Fragment>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </TableContainer>
            </Paper>
        </Box>
    );
};

export default LiveAllTenders;
