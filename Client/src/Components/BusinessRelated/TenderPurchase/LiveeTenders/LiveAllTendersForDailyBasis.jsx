// import React, { useEffect, useState, useRef, useMemo } from "react";
// import {
//     Box, Grid, Typography, Table, TableBody, TableCell, TableContainer,
//     TableHead, TableRow, Paper, Divider, Dialog, DialogContent, DialogActions,
//     Button, TextField, TableSortLabel, CircularProgress
// } from "@mui/material";
// import axios from "axios";
// import io from "socket.io-client";
// import * as XLSX from 'xlsx';
// import SearchBar from "../../../../Common/UtilityCommon/SearchBar";
// import { formatReadableAmount } from "../../../../Common/FormatFunctions/FormatAmount";
// import AccountMasterHelp from "../../../../Helper/AccountMasterHelp";
// import PrintButton from "../../../../Common/Buttons/PrintPDF";

// // PDF Generator Imports
// import { generateReportPDF } from "../../../../Common/ReportCommon/CommonPDFGenerator";
// import { ConvertNumberToWord } from "../../../../Common/FormatFunctions/ConvertNumberToWord";
// import HeaderJK from '../../../../Assets/HeaderJK.png';
// import FooterJK from '../../../../Assets/FooterJK.png';
// import { ScaleLoader } from "react-spinners";

// const headerCellStyle = {
//     fontWeight: "bold",
//     backgroundColor: "#3f51b5",
//     color: "white",
//     padding: "4px",
//     fontSize: "0.75rem",
//     textAlign: "center",
// };

// const LiveAllTendersForDailyBasis = () => {
//     const apikey = process.env.REACT_APP_API;
//     const socketURL = process.env.REACT_APP_API_URL;
//     const company_code = sessionStorage.getItem("Company_Code");
//     const year_code = sessionStorage.getItem("Year_Code");

//     const [tenders, setTenders] = useState([]);
//     const [searchTerm, setSearchTerm] = useState("");
//     const [openEdit, setOpenEdit] = useState(false);
//     const [netAmount, setNetAmount] = useState("0.00");
//     const [sortConfig, setSortConfig] = useState({ key: 'Sauda_Date', direction: 'desc' });
//     const [loading, setLoading] = useState(false); // ← ADDED

//     const [formData, setFormData] = useState({
//         Tender_No: "", Buyer: "", ShipTo: "", Buyer_Party: "", sub_broker: "",
//         buyerid: "", buyerpartyid: "", sbr: "", shiptoid: "", Buyer_Quantal: "",
//         Sale_Rate: "", Commission_Rate: "", gst_rate: 5.0, tcs_rate: 0.1,
//         gst_amt: 0.0, tcs_amt: 0.0, Delivery_Type: "C",
//         Sauda_Date: new Date().toISOString().split("T")[0],
//         Lifting_Date: new Date().toISOString().split("T")[0],
//         Narration: "", Sauda_Time: new Date().toLocaleTimeString("en-GB", { hour12: false }),
//         EbuySelectedParty: "", EbuySelectedAccoid: "", EbuySugarLiftingDate: "",
//         Payment_To: "", pt: "",
//     });

//     const [millName, setMillName] = useState("");
//     const [buyerName, setBuyerName] = useState("");
//     const [shipToName, setShipToName] = useState("");
//     const [brokerName, setBrokerName] = useState("");
//     const [subBrokerName, setSubBrokerName] = useState("");
//     const [tenderdetailid, settenderDetailId] = useState(0);
//     const [tenderNo, setTenderNo] = useState(0);
//     const [selectedPartyName, setSelectedPartyName] = useState("");

//     const fetchTenders = async () => {
//         setLoading(true); // ← ADDED
//         try {
//             const res = await axios.get(
//                 `${apikey}/get_live_tendersall?Company_Code=${company_code}&Year_Code=${year_code}`
//             );
//             if (res.data.all_data) {
//                 setTenders(res.data.all_data);
//             }
//         } catch (err) {
//             console.error("Error fetching tenders:", err);
//         } finally {
//             setLoading(false); // ← ADDED
//         }
//     };

//     useEffect(() => {
//         const socket = io(`${socketURL}`, { transports: ["websocket"] });
//         socket.on("tender_added", fetchTenders);
//         socket.on("tender_updated", fetchTenders);
//         socket.on("tender_deleted", fetchTenders);
//         fetchTenders();
//         return () => socket.disconnect();
//     }, []);

//     const handleSort = (key) => {
//         let direction = 'asc';
//         if (sortConfig.key === key && sortConfig.direction === 'asc') {
//             direction = 'desc';
//         }
//         setSortConfig({ key, direction });
//     };

//     const calculateRowProfit = (row) => {
//         const purcRate = parseFloat(row?.Purc_Rate) || 0;
//         const millRate = parseFloat(row?.Mill_Rate) || 0;
//         const saleRate = parseFloat(row?.Sale_Rate) || 0;
//         const quantity = parseFloat(row?.Qntl) || 0;
//         const effectivePurchaseRate = purcRate > 0 ? purcRate : millRate;
//         const profit = (saleRate - effectivePurchaseRate) * quantity;
//         return isNaN(profit) ? 0 : parseFloat(profit.toFixed(2));
//     };

//     const processedData = useMemo(() => {
//         let filteredData = tenders.filter((item) =>
//             Object.values(item).some((val) =>
//                 String(val).toLowerCase().includes(searchTerm.toLowerCase())
//             )
//         );

//         if (sortConfig.key) {
//             filteredData.sort((a, b) => {
//                 let aVal = a[sortConfig.key];
//                 let bVal = b[sortConfig.key];

//                 if (sortConfig.key === "Sauda_Date") {
//                     const [ad, am, ay] = aVal.split("/");
//                     const [bd, bm, by] = bVal.split("/");
//                     aVal = new Date(`${ay}-${am}-${ad}`);
//                     bVal = new Date(`${by}-${bm}-${bd}`);
//                 } else if (sortConfig.key === "Sauda_Time") {
//                     aVal = new Date(`1970-01-01T${aVal}`);
//                     bVal = new Date(`1970-01-01T${bVal}`);
//                 } else if (!isNaN(aVal) && !isNaN(bVal)) {
//                     aVal = parseFloat(aVal);
//                     bVal = parseFloat(bVal);
//                 }

//                 if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
//                 if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
//                 return 0;
//             });
//         }
//         return filteredData;
//     }, [tenders, searchTerm, sortConfig]);

//     const groupedData = useMemo(() => {
//         const grouped = {};
//         processedData.forEach((item) => {
//             if (!grouped[item.Sauda_Date]) grouped[item.Sauda_Date] = [];
//             grouped[item.Sauda_Date].push(item);
//         });
//         return grouped;
//     }, [processedData]);

//     const handlePrint = () => {
//         const columns = ["No", "Date", "Mill", "Buyer", "DO", "Qty", "Grd", "M.Rate", "P.Rate", "S.Rate", "P&L"];
//         const rows = [];
//         let grandTotalQty = 0;
//         let grandTotalProfit = 0;

//         const yellowStyle = {
//             fillColor: [255, 249, 196],
//             fontStyle: 'bold'
//         };

//         Object.entries(groupedData).forEach(([date, group]) => {
//             let subQty = 0;
//             let subProfit = 0;

//             group.forEach(item => {
//                 const profit = calculateRowProfit(item);
//                 subQty += parseFloat(item.Qntl || 0);
//                 subProfit += profit;

//                 rows.push([
//                     item.Tender_No, item.Sauda_Date, item.Mill, item.buyerName, item.DO,
//                     { content: formatReadableAmount(item.Qntl), styles: { halign: 'right' } },
//                     item.Grade,
//                     { content: formatReadableAmount(item.Mill_Rate), styles: { halign: 'right' } },
//                     { content: formatReadableAmount(item.Purc_Rate || item.Mill_Rate), styles: { halign: 'right' } },
//                     { content: formatReadableAmount(item.Sale_Rate), styles: { halign: 'right' } },
//                     { content: formatReadableAmount(profit.toFixed(2)), styles: { halign: 'right', fontStyle: 'bold' } }
//                 ]);
//             });

//             rows.push([
//                 { content: `Total for ${date}:`, colSpan: 5, styles: { ...yellowStyle, halign: 'right' } },
//                 { content: formatReadableAmount(subQty.toFixed(2)), styles: { ...yellowStyle, halign: 'right' } },
//                 { content: '', colSpan: 4, styles: yellowStyle },
//                 { content: formatReadableAmount(subProfit.toFixed(2)), styles: { ...yellowStyle, halign: 'right' } }
//             ]);

//             rows.push([
//                 {
//                     content: '------------------------------------------------------------------------------------------------------------------------------------------------------------------',
//                     colSpan: 11,
//                     styles: {
//                         halign: 'center',
//                         textColor: [150, 150, 150],
//                         fontSize: 8,
//                         cellPadding: 1
//                     }
//                 }
//             ]);

//             grandTotalQty += subQty;
//             grandTotalProfit += subProfit;
//         });

//         generateReportPDF({
//             title: 'Daily Sauda Report',
//             columns,
//             rows,
//             footerRow: [
//                 { content: 'GRAND TOTAL', colSpan: 5, styles: { ...yellowStyle, halign: 'right' } },
//                 { content: formatReadableAmount(grandTotalQty.toFixed(2)), styles: { ...yellowStyle, halign: 'right' } },
//                 { content: '', colSpan: 4, styles: yellowStyle },
//                 { content: formatReadableAmount(grandTotalProfit.toFixed(2)), styles: { ...yellowStyle, halign: 'right' } }
//             ],
//             orientation: 'landscape',
//             headerImgSrc: HeaderJK,
//             footerImgSrc: FooterJK,
//             styles: { fontSize: 7 },
//             onComplete: (url) => window.open(url, "_blank"),
//         });
//     };

//     const handleExportExcel = () => {
//         const data = processedData.map(item => ({
//             "Tender No": item.Tender_No,
//             "Sauda Date": item.Sauda_Date,
//             "Mill": item.Mill,
//             "Buyer": item.buyerName,
//             "DO": item.DO,
//             "Quantity": item.Qntl,
//             "Grade": item.Grade,
//             "Mill Rate": item.Mill_Rate,
//             "Purchase Rate": item.Purc_Rate || item.Mill_Rate,
//             "Sale Rate": item.Sale_Rate,
//             "Profit/Loss": calculateRowProfit(item)
//         }));
//         const ws = XLSX.utils.json_to_sheet(data);
//         const wb = XLSX.utils.book_new();
//         XLSX.utils.book_append_sheet(wb, ws, "Daily Sauda");
//         XLSX.writeFile(wb, "Daily_Sauda_Report.xlsx");
//     };

//     const handleSaveEdit = async () => {
//         try {
//             await axios.put(`${apikey}/update_tender_detail`, {
//                 detailData: { ...formData, Company_Code: company_code, Year_Code: year_code, tenderdetailid, Tender_No: tenderNo },
//             });
//             setOpenEdit(false);
//             fetchTenders();
//             alert("Tender updated successfully!");
//         } catch (err) {
//             alert("Error updating tender!");
//         }
//     };

//     const handleInputChange = (e) => {
//         const { name, value } = e.target;
//         setFormData((prev) => ({ ...prev, [name]: value }));
//     };

//     return (
//         <Box sx={{ mt: -10 }}>
//             <Typography variant="h6" sx={{ textAlign: 'center', fontWeight: 'bold', color: '#3f51b5' }}>
//                 DATE WISE DAILY SAUDA REPORT
//             </Typography>

//             <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }} style={{ marginLeft: '600px' }}>
//                 <Box sx={{ flexGrow: 1, maxWidth: '600px' }}>
//                     <SearchBar value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
//                 </Box>
//                 <Box sx={{ display: 'flex', gap: 1 }}>
//                     <PrintButton fetchData={handlePrint} />
//                     <Button
//                         variant="contained"
//                         color="success"
//                         onClick={handleExportExcel}
//                         sx={{ textTransform: 'none', fontWeight: 'bold', height: '35px' }}
//                     >
//                         Export Excel
//                     </Button>
//                 </Box>
//             </Box>

//             <Paper elevation={3} sx={{ mx: 2 }}>
//                 {/* ← ADDED LOADER */}
//                 {loading ? (
//                     <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8, gap: 2 }}>
//                         <ScaleLoader size={50} thickness={4} sx={{ color: '#3f51b5' }} />
//                         <Typography variant="body2" sx={{ color: '#3f51b5', fontWeight: 600 }}>
//                             Loading data, please wait...
//                         </Typography>
//                     </Box>
//                 ) : (
//                     <TableContainer sx={{ maxHeight: "75vh" }}>
//                         <Table size="small" stickyHeader>
//                             <TableHead>
//                                 <TableRow>
//                                     {[
//                                         { id: 'Tender_No', label: 'Tender No' },
//                                         { id: 'Sauda_Date', label: 'Sauda Date' },
//                                         { id: 'Sauda_Time', label: 'Time' },
//                                         { id: 'Mill', label: 'Mill Name' },
//                                         { id: 'buyerName', label: 'Buyer Name' },
//                                         { id: 'DO', label: 'DO Name' },
//                                         { id: 'Qntl', label: 'Quintal' },
//                                         { id: 'Grade', label: 'Grade' },
//                                         { id: 'Mill_Rate', label: 'Mill Rate' },
//                                         { id: 'Purc_Rate', label: 'Purc Rate' },
//                                         { id: 'Sale_Rate', label: 'Sale Rate' },
//                                         { id: 'profit', label: 'Profit & Loss' }
//                                     ].map((col) => (
//                                         <TableCell key={col.id} sx={headerCellStyle}>
//                                             <TableSortLabel
//                                                 active={sortConfig.key === col.id}
//                                                 direction={sortConfig.key === col.id ? sortConfig.direction : 'asc'}
//                                                 onClick={() => handleSort(col.id)}
//                                                 sx={{ '& .MuiTableSortLabel-icon': { color: 'white !important' }, color: 'white !important' }}
//                                             >
//                                                 {col.label}
//                                             </TableSortLabel>
//                                         </TableCell>
//                                     ))}
//                                 </TableRow>
//                             </TableHead>
//                             <TableBody>
//                                 {Object.entries(groupedData).map(([date, group], gIdx) => (
//                                     <React.Fragment key={date}>
//                                         {group.map((item, idx) => {
//                                             const rowProfit = calculateRowProfit(item);
//                                             return (
//                                                 <TableRow key={`${gIdx}-${idx}`} hover>
//                                                     <TableCell sx={{ fontSize: '0.75rem' }}>{item.Tender_No}</TableCell>
//                                                     <TableCell sx={{ fontSize: '0.75rem' }}>{item.Sauda_Date}</TableCell>
//                                                     <TableCell sx={{ fontSize: '0.75rem' }}>{item.Sauda_Time}</TableCell>
//                                                     <TableCell sx={{ fontSize: '0.75rem' }}>{item.Mill}</TableCell>
//                                                     <TableCell sx={{ fontSize: '0.75rem' }}>{item.buyerName}</TableCell>
//                                                     <TableCell sx={{ fontSize: '0.75rem' }}>{item.DO}</TableCell>
//                                                     <TableCell align="right" sx={{ fontSize: '0.75rem' }}>{item.Qntl}</TableCell>
//                                                     <TableCell sx={{ fontSize: '0.75rem' }}>{item.Grade}</TableCell>
//                                                     <TableCell align="right" sx={{ fontSize: '0.75rem' }}>{item.Mill_Rate}</TableCell>
//                                                     <TableCell align="right" sx={{ fontSize: '0.75rem' }}>{item.Purc_Rate || item.Mill_Rate}</TableCell>
//                                                     <TableCell align="right" sx={{ fontSize: '0.75rem' }}>{item.Sale_Rate}</TableCell>
//                                                     <TableCell align="right" style={{ color: rowProfit >= 0 ? "green" : "red", fontWeight: "bold", fontSize: '0.75rem' }}>
//                                                         {formatReadableAmount(rowProfit.toFixed(2))}
//                                                     </TableCell>
//                                                 </TableRow>
//                                             );
//                                         })}
//                                         <TableRow sx={{ backgroundColor: "#edf0df" }}>
//                                             <TableCell colSpan={6} align="right"><strong>Total for {date}:</strong></TableCell>
//                                             <TableCell align="right"><strong>{formatReadableAmount(group.reduce((t, i) => t + parseFloat(i.Qntl || 0), 0).toFixed(2))}</strong></TableCell>
//                                             <TableCell colSpan={4} align="right"><strong>Subtotal P&L:</strong></TableCell>
//                                             <TableCell align="right" style={{ color: group.reduce((t, i) => t + calculateRowProfit(i), 0) >= 0 ? "green" : "red", fontWeight: "bold" }}>
//                                                 {formatReadableAmount(group.reduce((t, i) => t + calculateRowProfit(i), 0).toFixed(2))}
//                                             </TableCell>
//                                         </TableRow>
//                                     </React.Fragment>
//                                 ))}
//                             </TableBody>
//                         </Table>
//                     </TableContainer>
//                 )}
//             </Paper>

//             <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth maxWidth="md">
//                 <Box sx={{ backgroundColor: "#3f51b5", color: "white", textAlign: "center", py: 1.2, fontWeight: 600 }}>Edit Live Tender</Box>
//                 <DialogContent sx={{ mt: 1 }}>
//                     <Grid container spacing={1}>
//                         <Grid item xs={12} sm={4}><Typography fontWeight="bold">Buyer:</Typography></Grid>
//                         <Grid item xs={12} sm={8}>
//                             <AccountMasterHelp name="Buyer" CategoryCode={formData.Buyer} CategoryName={buyerName} onAcCodeClick={(code, accoid, name) => { setFormData(p => ({ ...p, Buyer: code, buyerid: accoid })); setBuyerName(name); }} />
//                         </Grid>
//                         <Grid item xs={12} sm={4}><Typography fontWeight="bold">Buyer Quantal:</Typography></Grid>
//                         <Grid item xs={12} sm={8}><TextField size="small" fullWidth name="Buyer_Quantal" type="number" value={formData.Buyer_Quantal} onChange={handleInputChange} /></Grid>
//                         <Grid item xs={12} sm={4}><Typography fontWeight="bold">Sale Rate:</Typography></Grid>
//                         <Grid item xs={12} sm={8}><TextField size="small" fullWidth name="Sale_Rate" type="number" value={formData.Sale_Rate} onChange={handleInputChange} /></Grid>
//                     </Grid>
//                 </DialogContent>
//                 <DialogActions sx={{ justifyContent: "center", mb: 1 }}>
//                     <Button variant="outlined" color="secondary" onClick={() => setOpenEdit(false)}>Cancel</Button>
//                     <Button variant="contained" color="primary" onClick={handleSaveEdit}>Save</Button>
//                 </DialogActions>
//             </Dialog>
//         </Box>
//     );
// };

// export default LiveAllTendersForDailyBasis;
















import React, { useEffect, useState, useRef, useMemo } from "react";
import {
    Box, Grid, Typography, Dialog, DialogContent, DialogActions,
    TextField
} from "@mui/material";
import axios from "axios";
import io from "socket.io-client";
import * as XLSX from 'xlsx';
import AccountMasterHelp from "../../../../Helper/AccountMasterHelp";

// PDF Generator Imports
import { generateReportPDF } from "../../../../Common/ReportCommon/CommonPDFGenerator";
import { formatReadableAmount } from "../../../../Common/FormatFunctions/FormatAmount";
import HeaderJK from '../../../../Assets/HeaderJK.png';
import FooterJK from '../../../../Assets/FooterJK.png';

const apikey = process.env.REACT_APP_API;
const socketURL = process.env.REACT_APP_API_URL;
const WEBSOCKET_URL = process.env.REACT_APP_API_WEBSOCKET;

const LiveAllTendersForDailyBasis = () => {

    const company_code = sessionStorage.getItem("Company_Code");
    const year_code = sessionStorage.getItem("Year_Code");

    const [tenders, setTenders] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [openEdit, setOpenEdit] = useState(false);
    const [netAmount, setNetAmount] = useState("0.00");
    const [sortConfig, setSortConfig] = useState({ key: 'Sauda_Date', direction: 'desc' });
    const [loading, setLoading] = useState(false);
    const [wsRefreshing, setWsRefreshing] = useState(false);

    const [formData, setFormData] = useState({
        Tender_No: "", Buyer: "", ShipTo: "", Buyer_Party: "", sub_broker: "",
        buyerid: "", buyerpartyid: "", sbr: "", shiptoid: "", Buyer_Quantal: "",
        Sale_Rate: "", Commission_Rate: "", gst_rate: 5.0, tcs_rate: 0.1,
        gst_amt: 0.0, tcs_amt: 0.0, Delivery_Type: "C",
        Sauda_Date: new Date().toISOString().split("T")[0],
        Lifting_Date: new Date().toISOString().split("T")[0],
        Narration: "", Sauda_Time: new Date().toLocaleTimeString("en-GB", { hour12: false }),
        EbuySelectedParty: "", EbuySelectedAccoid: "", EbuySugarLiftingDate: "",
        Payment_To: "", pt: "",
    });

    const [millName, setMillName] = useState("");
    const [buyerName, setBuyerName] = useState("");
    const [shipToName, setShipToName] = useState("");
    const [brokerName, setBrokerName] = useState("");
    const [subBrokerName, setSubBrokerName] = useState("");
    const [tenderdetailid, settenderDetailId] = useState(0);
    const [tenderNo, setTenderNo] = useState(0);
    const [selectedPartyName, setSelectedPartyName] = useState("");

    const fetchTenders = async () => {
        setLoading(true);
        try {
            const res = await axios.get(
                `${apikey}/get_live_tendersall?Company_Code=${company_code}&Year_Code=${year_code}`
            );
            if (res.data.all_data) {
                setTenders(res.data.all_data);
            }
        } catch (err) {
            console.error("Error fetching tenders:", err);
        } finally {
            setLoading(false);
        }
    };

    // Silent refresh for WebSocket updates — table stays visible, only header indicator pulses
    const refreshTendersInBackground = async () => {
        setWsRefreshing(true);
        try {
            const res = await axios.get(
                `${apikey}/get_live_tendersall?Company_Code=${company_code}&Year_Code=${year_code}`
            );
            if (res.data.all_data) {
                setTenders(res.data.all_data);
            }
        } catch (err) {
            console.error("Error refreshing tenders:", err);
        } finally {
            setWsRefreshing(false);
        }
    };

    useEffect(() => {
        // ── 1. Socket.IO connection (tender events from this software) ──
        const socket = io(`${socketURL}`, { transports: ["websocket"] });
        socket.on("tender_added", refreshTendersInBackground);
        socket.on("tender_updated", refreshTendersInBackground);
        socket.on("tender_deleted", refreshTendersInBackground);

        fetchTenders(); // initial full-load (shows spinner)

        // ── 2. Native WebSocket (refresh_tenders from eBuySugar) ──
        let nativeSocket;
        let reconnectTimer;
        let isMounted = true;

        const connectNative = () => {
            if (!isMounted) return;
            nativeSocket = new WebSocket(WEBSOCKET_URL);

            nativeSocket.onopen = () => { };

            nativeSocket.onmessage = (event) => {
                const msg = String(event.data).toLowerCase();
                if (msg.includes("refresh_tenders")) {
                    refreshTendersInBackground(); // silent — table stays visible
                }
            };

            nativeSocket.onclose = () => {
                if (!isMounted) return;
                reconnectTimer = setTimeout(connectNative, 3000);
            };

            nativeSocket.onerror = () => {
                nativeSocket.close();
            };
        };

        connectNative();

        return () => {
            isMounted = false;
            socket.disconnect();
            clearTimeout(reconnectTimer);
            if (nativeSocket) nativeSocket.close();
        };
    }, []);

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const calculateRowProfit = (row) => {
        const purcRate = parseFloat(row?.Purc_Rate) || 0;
        const millRate = parseFloat(row?.Mill_Rate) || 0;
        const saleRate = parseFloat(row?.Sale_Rate) || 0;
        const quantity = parseFloat(row?.Qntl) || 0;
        const effectivePurchaseRate = purcRate > 0 ? purcRate : millRate;
        const profit = (saleRate - effectivePurchaseRate) * quantity;
        return isNaN(profit) ? 0 : parseFloat(profit.toFixed(2));
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

                if (sortConfig.key === "Sauda_Date") {
                    const [ad, am, ay] = aVal.split("/");
                    const [bd, bm, by] = bVal.split("/");
                    aVal = new Date(`${ay}-${am}-${ad}`);
                    bVal = new Date(`${by}-${bm}-${bd}`);
                } else if (sortConfig.key === "Sauda_Time") {
                    aVal = new Date(`1970-01-01T${aVal}`);
                    bVal = new Date(`1970-01-01T${bVal}`);
                } else if (!isNaN(aVal) && !isNaN(bVal)) {
                    aVal = parseFloat(aVal);
                    bVal = parseFloat(bVal);
                }

                if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
                return 0;
            });
        }
        return filteredData;
    }, [tenders, searchTerm, sortConfig]);

    const groupedData = useMemo(() => {
        const grouped = {};
        processedData.forEach((item) => {
            if (!grouped[item.Sauda_Date]) grouped[item.Sauda_Date] = [];
            grouped[item.Sauda_Date].push(item);
        });
        return grouped;
    }, [processedData]);

    const handlePrint = () => {
        const columns = ["No", "Date", "Mill", "Buyer", "DO", "Qty", "Grd", "M.Rate", "P.Rate", "S.Rate", "P&L"];
        const rows = [];
        let grandTotalQty = 0;
        let grandTotalProfit = 0;

        const yellowStyle = {
            fillColor: [255, 249, 196],
            fontStyle: 'bold'
        };

        Object.entries(groupedData).forEach(([date, group]) => {
            let subQty = 0;
            let subProfit = 0;

            group.forEach(item => {
                const profit = calculateRowProfit(item);
                subQty += parseFloat(item.Qntl || 0);
                subProfit += profit;

                rows.push([
                    item.Tender_No, item.Sauda_Date, item.Mill, item.buyerName, item.DO,
                    { content: formatReadableAmount(item.Qntl), styles: { halign: 'right' } },
                    item.Grade,
                    { content: formatReadableAmount(item.Mill_Rate), styles: { halign: 'right' } },
                    { content: formatReadableAmount(item.Purc_Rate || item.Mill_Rate), styles: { halign: 'right' } },
                    { content: formatReadableAmount(item.Sale_Rate), styles: { halign: 'right' } },
                    { content: formatReadableAmount(profit.toFixed(2)), styles: { halign: 'right', fontStyle: 'bold' } }
                ]);
            });

            rows.push([
                { content: `Total for ${date}:`, colSpan: 5, styles: { ...yellowStyle, halign: 'right' } },
                { content: formatReadableAmount(subQty.toFixed(2)), styles: { ...yellowStyle, halign: 'right' } },
                { content: '', colSpan: 4, styles: yellowStyle },
                { content: formatReadableAmount(subProfit.toFixed(2)), styles: { ...yellowStyle, halign: 'right' } }
            ]);

            rows.push([
                {
                    content: '------------------------------------------------------------------------------------------------------------------------------------------------------------------',
                    colSpan: 11,
                    styles: {
                        halign: 'center',
                        textColor: [150, 150, 150],
                        fontSize: 8,
                        cellPadding: 1
                    }
                }
            ]);

            grandTotalQty += subQty;
            grandTotalProfit += subProfit;
        });

        generateReportPDF({
            title: 'Daily Sauda Report',
            columns,
            rows,
            footerRow: [
                { content: 'GRAND TOTAL', colSpan: 5, styles: { ...yellowStyle, halign: 'right' } },
                { content: formatReadableAmount(grandTotalQty.toFixed(2)), styles: { ...yellowStyle, halign: 'right' } },
                { content: '', colSpan: 4, styles: yellowStyle },
                { content: formatReadableAmount(grandTotalProfit.toFixed(2)), styles: { ...yellowStyle, halign: 'right' } }
            ],
            orientation: 'landscape',
            headerImgSrc: HeaderJK,
            footerImgSrc: FooterJK,
            styles: { fontSize: 7 },
            onComplete: (url) => window.open(url, "_blank"),
        });
    };

    const handleExportExcel = () => {
        const data = processedData.map(item => ({
            "Tender No": item.Tender_No,
            "Sauda Date": item.Sauda_Date,
            "Mill": item.Mill,
            "Buyer": item.buyerName,
            "DO": item.DO,
            "Quantity": item.Qntl,
            "Grade": item.Grade,
            "Mill Rate": item.Mill_Rate,
            "Purchase Rate": item.Purc_Rate || item.Mill_Rate,
            "Sale Rate": item.Sale_Rate,
            "Profit/Loss": calculateRowProfit(item)
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Daily Sauda");
        XLSX.writeFile(wb, "Daily_Sauda_Report.xlsx");
    };

    const handleSaveEdit = async () => {
        try {
            await axios.put(`${apikey}/update_tender_detail`, {
                detailData: { ...formData, Company_Code: company_code, Year_Code: year_code, tenderdetailid, Tender_No: tenderNo },
            });
            setOpenEdit(false);
            fetchTenders();
            alert("Tender updated successfully!");
        } catch (err) {
            alert("Error updating tender!");
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const COLS = [
        { id: 'Tender_No', label: 'Tender No' },
        { id: 'Sauda_Date', label: 'Sauda Date' },
        { id: 'Sauda_Time', label: 'Time' },
        { id: 'Mill', label: 'Mill Name' },
        { id: 'buyerName', label: 'Buyer Name' },
        { id: 'DO', label: 'DO Name' },
        { id: 'Qntl', label: 'Quintal' },
        { id: 'Grade', label: 'Grade' },
        { id: 'Mill_Rate', label: 'Mill Rate' },
        { id: 'Purc_Rate', label: 'Purc Rate' },
        { id: 'Sale_Rate', label: 'Sale Rate' },
        { id: 'profit', label: 'Profit & Loss' },
    ];

    // th sticks at top:0 of the scroll container (table area below the static header bar)
    const thStyle = (col) => ({
        fontFamily: "'Signika', sans-serif",
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        color: sortConfig.key === col.id ? '#1e40af' : '#1e3a8a',
        background: sortConfig.key === col.id ? '#bfdbfe' : '#dbeafe',
        padding: '10px 12px',
        whiteSpace: 'nowrap',
        cursor: 'pointer',
        userSelect: 'none',
        textAlign: 'left',
        borderBottom: `2px solid ${sortConfig.key === col.id ? '#60a5fa' : '#93c5fd'}`,
        borderRight: '1px solid #93c5fd',
        position: 'sticky',
        top: 0,
        zIndex: 5,
    });

    return (
        // Fixed-height flex column — header bar STATIC at top, only table area scrolls
        <div style={{
            fontFamily: "'Signika', sans-serif",
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',          // use 'calc(100vh - 64px)' if you have a top navbar
            overflow: 'hidden',
        }}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Signika:wght@300;400;500;600;700&display=swap');
              @keyframes saudaSpin { to { transform: rotate(360deg) } }
              @keyframes saudaPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.85)} }
              .sauda-tr:hover td { background: #eff6ff !important; }
            `}</style>

            {/* ── Header bar — STATIC, never scrolls ── */}
            <div style={{
                flexShrink: 0,
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '8px 10px',
                background: 'linear-gradient(135deg,#60a5fa,#3b82f6)',
                boxShadow: '0 2px 8px rgba(59,130,246,0.25)',
                zIndex: 20,
            }}>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#000000', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: 8 }}>
                        Date Wise Daily Sauda Report
                        {wsRefreshing && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.25)', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600, color: '#1e3a8a', animation: 'saudaPulse 1s ease-in-out infinite' }}>
                                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#2563eb', display: 'inline-block' }} />
                                Refreshing…
                            </span>
                        )}
                    </div>
                    <div style={{ fontSize: 11, color: '#000000', marginTop: 2 }}>
                        {processedData.length} record{processedData.length !== 1 ? 's' : ''} · {Object.keys(groupedData).length} date{Object.keys(groupedData).length !== 1 ? 's' : ''}
                    </div>
                </div>


                <div style={{ position: 'relative', width: 260 }}>
                    <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, pointerEvents: 'none' }} fill="none" stroke="#64748b" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search anything…"
                        style={{
                            width: '100%',
                            padding: '8px 30px 8px 32px',
                            fontSize: 12.5,
                            border: '1.5px solid #fff',
                            borderRadius: 9,
                            background: '#ffffff',
                            color: '#1e293b',
                            outline: 'none',
                            fontFamily: "'Signika', sans-serif",
                            boxSizing: 'border-box',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
                            transition: 'box-shadow 0.15s',
                        }}
                        onFocus={(e) => { e.target.style.boxShadow = '0 0 0 3px rgba(255,255,255,0.5)'; }}
                        onBlur={(e) => { e.target.style.boxShadow = '0 1px 4px rgba(0,0,0,0.12)'; }}
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>×</button>
                    )}
                </div>


                <button onClick={handlePrint}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#4f46e5,#4338ca)', color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: "'Signika', sans-serif", boxShadow: '0 2px 8px rgba(135, 29, 161, 0.35)', transition: 'opacity 0.15s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                >
                    <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print
                </button>

                {/* Export Excel */}
                <button onClick={handleExportExcel}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#16a34a,#15803d)', color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: "'Signika', sans-serif", boxShadow: '0 2px 8px rgba(22,163,74,0.35)', transition: 'opacity 0.15s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                >
                    <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0121 9.414V19a2 2 0 01-2 2z" />
                    </svg>
                    Export Excel
                </button>
            </div>

            {/* ── Table area — the ONLY scroll container ── */}
            <div style={{ flex: 1, overflowY: 'auto', background: '#f8fafc' }}>
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12, fontFamily: "'Signika', sans-serif" }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #dbeafe', borderTopColor: '#4f46e5', animation: 'saudaSpin 0.8s linear infinite' }} />
                        <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Loading data, please wait…</span>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'Signika', sans-serif", fontSize: 12 }}>
                        <thead>
                            <tr>
                                {COLS.map((col) => (
                                    <th key={col.id} style={thStyle(col)} onClick={() => handleSort(col.id)}>
                                        {col.label}
                                        <span style={{ marginLeft: 4, fontSize: 9, opacity: sortConfig.key === col.id ? 1 : 0.35 }}>
                                            {sortConfig.key === col.id ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '⇅'}
                                        </span>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(groupedData).map(([date, group], gIdx) => {
                                const groupQty = group.reduce((t, i) => t + parseFloat(i.Qntl || 0), 0);
                                const groupPL = group.reduce((t, i) => t + calculateRowProfit(i), 0);
                                return (
                                    <React.Fragment key={date}>
                                        {/* Date group header */}
                                        <tr>
                                            <td colSpan={12} style={{ padding: '6px 12px', background: '#dbeafe', color: '#1e3a8a', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', borderTop: '2px solid #93c5fd' }}>
                                                📅 {date}
                                            </td>
                                        </tr>
                                        {group.map((item, idx) => {
                                            const rowProfit = calculateRowProfit(item);
                                            const isEven = idx % 2 === 0;
                                            return (
                                                <tr key={`${gIdx}-${idx}`} className="sauda-tr"
                                                    style={{ borderBottom: '1px solid #f1f5f9', cursor: 'default' }}>
                                                    <td style={{ padding: '8px 12px', background: isEven ? '#fff' : '#f0f9ff', fontWeight: 600, color: '#2563eb', whiteSpace: 'nowrap', textAlign: 'left' }}>#{item.Tender_No}</td>
                                                    <td style={{ padding: '8px 12px', background: isEven ? '#fff' : '#f0f9ff', color: '#374151', whiteSpace: 'nowrap', textAlign: 'left' }}>{item.Sauda_Date}</td>
                                                    <td style={{ padding: '8px 12px', background: isEven ? '#fff' : '#f0f9ff', color: '#64748b', whiteSpace: 'nowrap', textAlign: 'left' }}>{item.Sauda_Time}</td>
                                                    <td style={{ padding: '8px 12px', background: isEven ? '#fff' : '#f0f9ff', fontWeight: 500, color: '#1e293b', textAlign: 'left' }}>{item.Mill}</td>
                                                    <td style={{ padding: '8px 12px', background: isEven ? '#fff' : '#f0f9ff', color: '#374151', textAlign: 'left' }}>{item.buyerName}</td>
                                                    <td style={{ padding: '8px 12px', background: isEven ? '#fff' : '#f0f9ff', color: '#475569', textAlign: 'left' }}>{item.DO}</td>
                                                    <td style={{ padding: '8px 12px', background: isEven ? '#fff' : '#f0f9ff', textAlign: 'right', fontWeight: 600, color: '#374151' }}>{formatReadableAmount(item.Qntl)}</td>
                                                    <td style={{ padding: '8px 12px', background: isEven ? '#fff' : '#f0f9ff', textAlign: 'left' }}>
                                                        <span style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 4, padding: '1px 7px', fontSize: 11, fontWeight: 700, color: '#2563eb' }}>{item.Grade}</span>
                                                    </td>
                                                    <td style={{ padding: '8px 12px', background: isEven ? '#fff' : '#f0f9ff', textAlign: 'right', color: '#4338ca', fontWeight: 500 }}>{formatReadableAmount(item.Mill_Rate)}</td>
                                                    <td style={{ padding: '8px 12px', background: isEven ? '#fff' : '#f0f9ff', textAlign: 'right', color: '#7c3aed', fontWeight: 500 }}>{formatReadableAmount(item.Purc_Rate || item.Mill_Rate)}</td>
                                                    <td style={{ padding: '8px 12px', background: isEven ? '#fff' : '#f0f9ff', textAlign: 'right', color: '#15803d', fontWeight: 600 }}>{formatReadableAmount(item.Sale_Rate)}</td>
                                                    <td style={{ padding: '8px 12px', background: isEven ? '#fff' : '#f0f9ff', textAlign: 'right', fontWeight: 700, color: rowProfit >= 0 ? '#15803d' : '#dc2626' }}>
                                                        {rowProfit >= 0 ? '+' : ''}{formatReadableAmount(rowProfit.toFixed(2))}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {/* Subtotal row */}
                                        <tr style={{ background: 'linear-gradient(to right,#fefce8,#fef9c3)', borderTop: '1px solid #fde68a', borderBottom: '2px solid #fbbf24' }}>
                                            <td colSpan={6} style={{ padding: '7px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#92400e', letterSpacing: '0.02em' }}>
                                                📊 Subtotal — {date}
                                            </td>
                                            <td style={{ padding: '7px 12px', textAlign: 'right', fontWeight: 700, color: '#1e293b', fontSize: 12 }}>
                                                {formatReadableAmount(groupQty.toFixed(2))}
                                            </td>
                                            <td colSpan={4} style={{ padding: '7px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#92400e' }}>
                                                Subtotal P&L:
                                            </td>
                                            <td style={{ padding: '7px 12px', textAlign: 'right', fontWeight: 800, fontSize: 12.5, color: groupPL >= 0 ? '#15803d' : '#dc2626' }}>
                                                {groupPL >= 0 ? '+' : ''}{formatReadableAmount(groupPL.toFixed(2))}
                                            </td>
                                        </tr>
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* ── Edit Dialog ── */}
            <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth maxWidth="sm"
                PaperProps={{ style: { borderRadius: 14, fontFamily: "'Signika', sans-serif", overflow: 'hidden' } }}>
                <div style={{ background: 'linear-gradient(135deg,#1e293b,#0f172a)', color: '#f1f5f9', padding: '14px 22px', fontSize: 15, fontWeight: 700, fontFamily: "'Signika', sans-serif", letterSpacing: '0.01em' }}>
                    Edit Live Tender
                </div>
                <DialogContent sx={{ mt: 1, fontFamily: "'Signika', sans-serif" }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={4}><Typography fontWeight={700} fontSize={13} color="#475569" fontFamily="'Signika', sans-serif">Buyer</Typography></Grid>
                        <Grid item xs={8}>
                            <AccountMasterHelp name="Buyer" CategoryCode={formData.Buyer} CategoryName={buyerName}
                                onAcCodeClick={(code, accoid, name) => { setFormData(p => ({ ...p, Buyer: code, buyerid: accoid })); setBuyerName(name); }} />
                        </Grid>
                        <Grid item xs={4}><Typography fontWeight={700} fontSize={13} color="#475569" fontFamily="'Signika', sans-serif">Buyer Quantal</Typography></Grid>
                        <Grid item xs={8}><TextField size="small" fullWidth name="Buyer_Quantal" type="number" value={formData.Buyer_Quantal} onChange={handleInputChange} InputProps={{ style: { fontFamily: "'Signika', sans-serif" } }} /></Grid>
                        <Grid item xs={4}><Typography fontWeight={700} fontSize={13} color="#475569" fontFamily="'Signika', sans-serif">Sale Rate</Typography></Grid>
                        <Grid item xs={8}><TextField size="small" fullWidth name="Sale_Rate" type="number" value={formData.Sale_Rate} onChange={handleInputChange} InputProps={{ style: { fontFamily: "'Signika', sans-serif" } }} /></Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'center', pb: 2, gap: 1 }}>
                    <button onClick={() => setOpenEdit(false)} style={{ padding: '9px 22px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: 'white', color: '#475569', fontWeight: 600, cursor: 'pointer', fontSize: 13, fontFamily: "'Signika', sans-serif" }}>
                        Cancel
                    </button>
                    <button onClick={handleSaveEdit} style={{ padding: '9px 22px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#1e293b,#0f172a)', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: 13, fontFamily: "'Signika', sans-serif", boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                        Save Changes
                    </button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default LiveAllTendersForDailyBasis;