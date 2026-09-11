// import React, { useState, useEffect, useMemo } from 'react';
// import axios from 'axios';
// import {
//   XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
// } from 'recharts';
// import {
//   TrendingUp, Inventory, AttachMoney, Refresh, KeyboardArrowUp, KeyboardArrowDown,
//   Groups, AssignmentTurnedIn, PictureAsPdf, GridView
// } from '@mui/icons-material';
// import {
//   Box, Card, CardContent, Typography, Grid, TextField, Button,
//   Chip, LinearProgress, IconButton, Collapse, Table, TableBody,
//   TableCell, TableContainer, TableHead, TableRow, TablePagination,
//   Avatar, Tooltip as MuiTooltip, Zoom, TableSortLabel,
//   Menu, MenuItem, Divider
// } from '@mui/material';
// import { styled } from '@mui/material/styles';
// import * as XLSX from 'xlsx';
// import BackButton from '../../Common/Buttons/BackButton';
// import { useNavigate } from "react-router-dom";

// const StyledCard = styled(Card)(({ theme }) => ({
//   borderRadius: '16px',
//   boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)',
//   transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
//   '&:hover': {
//     transform: 'translateY(-5px)',
//     boxShadow: '0 8px 30px 0 rgba(0,0,0,0.12)',
//   },
// }));

// const MetricIcon = styled(Avatar)(({ bgcolor }) => ({
//   backgroundColor: bgcolor,
//   width: 56,
//   height: 56,
//   borderRadius: '12px',
//   boxShadow: `0 4px 12px 0 ${bgcolor}44`,
// }));

// const API_URL = process.env.REACT_APP_API;

// const SaleTopBuyers = () => {
//   const [buyers, setBuyers] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [monthwiseData, setMonthwiseData] = useState([]);
//   const [monthLoading, setMonthLoading] = useState(false);

//   const [expandedBuyerPan, setExpandedBuyerPan] = useState(null);

//   const [order, setOrder] = useState('desc');
//   const [orderBy, setOrderBy] = useState('TotalNetQntl');

//   const [filters, setFilters] = useState({
//     from_date: new Date().toISOString().split('T')[0],
//     to_date: new Date().toISOString().split('T')[0],
//   });

//   const [page, setPage] = useState(0);
//   const [rowsPerPage, setRowsPerPage] = useState(100);

//   const [exportAnchorEl, setExportAnchorEl] = useState(null);
//   const exportOpen = Boolean(exportAnchorEl);

//   const navigate = useNavigate();

//   const numberToWords = (n) => {
//     if (n === 0) return 'Zero';
//     if (!n) return '';
//     let num = Math.floor(parseFloat(n));
//     const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
//     const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
//     const formatPart = (v, suffix) => {
//       if (v === 0) return '';
//       let str = v > 19 ? b[Math.floor(v / 10)] + ' ' + a[v % 10] : a[v];
//       return str + suffix;
//     };
//     let words = '';
//     words += formatPart(Math.floor(num / 10000000), 'Crore ');
//     words += formatPart(Math.floor((num / 100000) % 100), 'Lakh ');
//     words += formatPart(Math.floor((num / 1000) % 100), 'Thousand ');
//     words += formatPart(Math.floor((num / 100) % 10), 'Hundred ');
//     const lastTwo = num % 100;
//     if (num > 100 && lastTwo > 0) words += 'and ';
//     words += formatPart(lastTwo, '');
//     return words.trim() + ' Rupees Only';
//   };

//   const formatSmartCurrency = (num) => {
//     const absNum = Math.abs(num);
//     if (absNum >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
//     if (absNum >= 100000) return `₹${(num / 100000).toFixed(2)} Lac`;
//     return `₹${parseFloat(num).toLocaleString('en-IN')}`;
//   };

//   const formatNumber = (num) => parseFloat(num).toLocaleString('en-IN');

//   const getSessionData = () => ({
//     companyCode: sessionStorage.getItem('Company_Code') || '1'
//   });

//   const handleRequestSort = (property) => {
//     const isAsc = orderBy === property && order === 'asc';
//     setOrder(isAsc ? 'desc' : 'asc');
//     setOrderBy(property);
//   };

//   const sortedBuyers = useMemo(() => {
//     const comparator = (a, b) => {
//       let valA = a[orderBy];
//       let valB = b[orderBy];
//       if (['TotalNetQntl', 'TotalBillAmount', 'BillCount'].includes(orderBy)) {
//         valA = parseFloat(valA) || 0;
//         valB = parseFloat(valB) || 0;
//       }
//       if (valB < valA) return order === 'desc' ? -1 : 1;
//       if (valB > valA) return order === 'desc' ? 1 : -1;
//       return 0;
//     };
//     return [...buyers].sort(comparator);
//   }, [buyers, order, orderBy]);

//   const fetchTopBuyers = async () => {
//     setLoading(true);
//     try {
//       const { companyCode } = getSessionData();
//       const response = await axios.get(`${API_URL}/sale-top-buyers`, {
//         params: { ...filters, company_code: companyCode }
//       });
//       setBuyers(response.data.buyers || []);
//     } catch (err) {
//       console.error("Error fetching buyers:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const toggleAccordion = async (pan, totalBuyerQuintal) => {
//     if (expandedBuyerPan === pan) {
//       setExpandedBuyerPan(null);
//       return;
//     }

//     setExpandedBuyerPan(pan);
//     setMonthLoading(true);
//     try {
//       const { companyCode } = getSessionData();
//       const response = await axios.get(`${API_URL}/sale-buyer-monthwise-quintal`, {
//         params: { ...filters, company_code: companyCode, carporate_pan: pan }
//       });
//       const rawData = response.data.monthwise_quintal || [];
//       const dataWithPercent = rawData.map(item => ({
//         ...item,
//         percentage: totalBuyerQuintal > 0 ? ((parseFloat(item.total_quintal) / parseFloat(totalBuyerQuintal)) * 100).toFixed(2) : 0
//       }));
//       setMonthwiseData(dataWithPercent);
//     } catch (err) {
//       console.error(err);
//     } finally {
//       setMonthLoading(false);
//     }
//   };

//   const handleExportClick = (event) => {
//     setExportAnchorEl(event.currentTarget);
//   };

//   const handleExportClose = () => {
//     setExportAnchorEl(null);
//   };

//   const exportToExcel = () => {
//     const top20Buyers = sortedBuyers.slice(0, 20);

//     const grandTotalVolume = buyers.reduce((a, b) => a + (parseFloat(b.TotalNetQntl) || 0), 0);
//     const grandTotalValue = buyers.reduce((a, b) => a + (parseFloat(b.TotalBillAmount) || 0), 0);
//     const totalBills = buyers.reduce((a, b) => a + (parseInt(b.BillCount) || 0), 0);

//     const excelData = [
//       ['SALES INSIGHTS REPORT'],
//       [`Report Period: ${filters.from_date} to ${filters.to_date}`],
//       [`Generated on: ${new Date().toLocaleDateString()}`],
//       [],
//       ['OVERALL SUMMARY'],
//       [`Total Buyers`, buyers.length],
//       [`Total Sale Volume (Qntl)`, grandTotalVolume],
//       [`Total Revenue`, grandTotalValue],
//       [`Total Bills`, totalBills],
//       [],
//       ['TOP 20 BUYERS'],
//       ['Rank', 'Customer Name', 'GSTN', 'PAN', 'Volume (Qntl)', 'Volume Share %', 'Bills', 'Total Revenue', 'Value Share %'],
//       ...top20Buyers.map((buyer, index) => [
//         index + 1,
//         buyer.Customer_Name || '',
//         buyer.Customer_GSTN || '',
//         buyer.Carporate_Pan || '',
//         parseFloat(buyer.TotalNetQntl) || 0,
//         grandTotalVolume > 0 ? ((parseFloat(buyer.TotalNetQntl) / grandTotalVolume) * 100).toFixed(2) : 0,
//         parseInt(buyer.BillCount) || 0,
//         parseFloat(buyer.TotalBillAmount) || 0,
//         grandTotalValue > 0 ? ((parseFloat(buyer.TotalBillAmount) / grandTotalValue) * 100).toFixed(2) : 0
//       ])
//     ];

//     const wb = XLSX.utils.book_new();
//     const ws = XLSX.utils.aoa_to_sheet(excelData);

//     ws['!merges'] = [
//       { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
//       { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } },
//       { s: { r: 2, c: 0 }, e: { r: 2, c: 8 } },
//       { s: { r: 4, c: 0 }, e: { r: 4, c: 8 } },
//       { s: { r: 10, c: 0 }, e: { r: 10, c: 8 } },
//     ];

//     XLSX.utils.book_append_sheet(wb, ws, 'Sales Insights');

//     const maxWidth = Math.max(...top20Buyers.map(b => b.Customer_Name?.length || 0), 15);
//     ws['!cols'] = [
//       { wch: 6 },
//       { wch: Math.min(maxWidth, 40) },
//       { wch: 20 },
//       { wch: 15 },
//       { wch: 12 },
//       { wch: 12 },
//       { wch: 10 },
//       { wch: 15 },
//       { wch: 12 },
//     ];

//     XLSX.writeFile(wb, `Sales_Insights_${filters.from_date}_to_${filters.to_date}.xlsx`);

//     handleExportClose();
//   };

//   const generatePDF = () => {
//     handleExportClose();

//     const grandTotalVolume = buyers.reduce((a, b) => a + (parseFloat(b.TotalNetQntl) || 0), 0);
//     const grandTotalValue = buyers.reduce((a, b) => a + (parseFloat(b.TotalBillAmount) || 0), 0);
//     const totalBills = buyers.reduce((a, b) => a + (parseInt(b.BillCount) || 0), 0);
//     const top20Buyers = sortedBuyers.slice(0, 20);

//     const printWindow = window.open('', '_blank');

//     printWindow.document.write(`
//       <!DOCTYPE html>
//       <html>
//       <head>
//         <title>Sales Insights Report</title>
//         <style>
//           @media print {
//             body {
//               font-family: Arial, sans-serif;
//               margin: 20px;
//               color: #333;
//             }
//             .report-title {
//               text-align: center;
//               margin-bottom: 20px;
//             }
//             .report-title h1 {
//               color: #0f172a;
//               margin-bottom: 5px;
//               font-size: 28px;
//             }
//             .report-title .date-info {
//               color: #64748b;
//               font-size: 14px;
//             }
//             .summary-section {
//               margin: 30px 0;
//             }
//             .summary-grid {
//               display: grid;
//               grid-template-columns: repeat(4, 1fr);
//               gap: 15px;
//               margin-top: 15px;
//             }
//             .summary-card {
//               background: #f8fafc;
//               padding: 15px;
//               border-radius: 8px;
//               text-align: center;
//             }
//             .summary-label {
//               color: #64748b;
//               font-weight: 600;
//               margin-bottom: 8px;
//             }
//             .summary-value {
//               font-size: 24px;
//               font-weight: 800;
//             }
//             .table-title {
//               color: #334155;
//               margin: 25px 0 15px 0;
//               padding-bottom: 10px;
//               border-bottom: 2px solid #e2e8f0;
//             }
//             .data-table {
//               width: 100%;
//               border-collapse: collapse;
//               margin-bottom: 30px;
//             }
//             .data-table th {
//               background-color: #f1f5f9;
//               color: #475569;
//               font-weight: bold;
//               padding: 12px 8px;
//               text-align: left;
//               border-bottom: 2px solid #e2e8f0;
//             }
//             .data-table td {
//               padding: 12px 8px;
//               border-bottom: 1px solid #e2e8f0;
//             }
//             .data-table tr:hover {
//               background-color: #f8fafc;
//             }
//             .rank-badge {
//               display: inline-block;
//               width: 28px;
//               height: 28px;
//               background-color: #0465ee;
//               color: white;
//               border-radius: 50%;
//               text-align: center;
//               line-height: 28px;
//               font-weight: 600;
//               font-size: 0.75rem;
//             }
//             .customer-name {
//               font-weight: 700;
//               margin-bottom: 4px;
//               font-size: 0.875rem;
//             }
//             .customer-details {
//               font-size: 12px;
//               color: #3b82f6;
//             }
//             .volume-value {
//               font-weight: 700;
//               margin-bottom: 4px;
//             }
//             .volume-share {
//               font-size: 12px;
//               color: #10b981;
//               font-weight: 600;
//             }
//             .bill-count {
//               display: inline-block;
//               border: 1px solid #e2e8f0;
//               padding: 4px 8px;
//               border-radius: 16px;
//               font-size: 14px;
//             }
//             .revenue-value {
//               font-weight: 800;
//               color: #3b82f6;
//               margin-bottom: 4px;
//             }
//             .value-share {
//               font-size: 12px;
//               color: #f59e0b;
//               font-weight: 600;
//             }
//             .footer {
//               text-align: center;
//               color: #64748b;
//               font-size: 12px;
//               margin-top: 40px;
//               padding-top: 20px;
//               border-top: 1px solid #e2e8f0;
//             }
//             @page {
//               margin: 20mm;
//             }
//           }
//         </style>
//       </head>
//       <body>
//         <div class="report-title">
//           <h1>Sales Insights Report</h1>
//           <div class="date-info">
//             <p>Report Period: ${filters.from_date} to ${filters.to_date}</p>
//             <p>Generated on: ${new Date().toLocaleDateString()}</p>
//           </div>
//         </div>
        
//         <div class="summary-section">
//           <h2>Overall Summary</h2>
//           <div class="summary-grid">
//             <div class="summary-card">
//               <div class="summary-label">Top 20 Buyers</div>
//               <div class="summary-value">${buyers.length}</div>
//             </div>
//             <div class="summary-card">
//               <div class="summary-label">Top 20 Volume</div>
//               <div class="summary-value">${formatNumber(grandTotalVolume)} Q</div>
//             </div>
//             <div class="summary-card">
//               <div class="summary-label">Top 20 Volume</div>
//               <div class="summary-value">${formatSmartCurrency(grandTotalValue)}</div>
//             </div>
//             <div class="summary-card">
//               <div class="summary-label">Top 20 Buyer Invoices</div>
//               <div class="summary-value">${totalBills}</div>
//             </div>
//           </div>
//         </div>
        
//         <h2 class="table-title">Top 20 Buyers</h2>
//         <table class="data-table">
//           <thead>
//             <tr>
//               <th width="60">Rank</th>
//               <th>Customer Details</th>
//               <th width="120" align="right">Volume (Qntl)</th>
//               <th width="100" align="right">Bills</th>
//               <th width="150" align="right">Total Revenue</th>
//             </tr>
//           </thead>
//           <tbody>
//     `);

//     top20Buyers.forEach((buyer, index) => {
//       const volShare = grandTotalVolume > 0 ? ((parseFloat(buyer.TotalNetQntl) / grandTotalVolume) * 100).toFixed(2) : 0;
//       const valShare = grandTotalValue > 0 ? ((parseFloat(buyer.TotalBillAmount) / grandTotalValue) * 100).toFixed(2) : 0;

//       printWindow.document.write(`
//         <tr>
//           <td>
//             <div class="rank-badge">${index + 1}</div>
//           </td>
//           <td>
//             <div class="customer-name">${buyer.Customer_Name || ''}</div>
//             <div class="customer-details">
//               GSTN: ${buyer.Customer_GSTN || ''} | PAN: ${buyer.Carporate_Pan || ''}
//             </div>
//           </td>
//           <td align="right">
//             <div class="volume-value">${formatNumber(buyer.TotalNetQntl)} Q</div>
//             <div class="volume-share">${volShare}% Share</div>
//           </td>
//           <td align="right">
//             <div class="bill-count">${buyer.BillCount || 0}</div>
//           </td>
//           <td align="right">
//             <div class="revenue-value">${formatSmartCurrency(buyer.TotalBillAmount)}</div>
//             <div class="value-share">${valShare}% Share</div>
//           </td>
//         </tr>
//       `);
//     });

//     printWindow.document.write(`
//           </tbody>
//         </table>
        
//         <div class="footer">
//         </div>
        
//         <script>
//           // Auto print and close
//           window.onload = function() {
//             setTimeout(function() {
//               window.print();
//               setTimeout(function() {
//                 window.close();
//               }, 500);
//             }, 500);
//           };
//         </script>
//       </body>
//       </html>
//     `);

//     printWindow.document.close();
//   };

//   const grandTotalVolume = buyers.reduce((a, b) => a + (parseFloat(b.TotalNetQntl) || 0), 0);
//   const grandTotalValue = buyers.reduce((a, b) => a + (parseFloat(b.TotalBillAmount) || 0), 0);

//   useEffect(() => { fetchTopBuyers(); }, []);

//   return (
//     <Box sx={{ p: 4, backgroundColor: '#f1f5f9', minHeight: '100vh', mb: 20 }}>

      
//       <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
//          <Grid item>
//           <BackButton onClick={() => navigate("/Analytics")} />
//         </Grid>
//         <Box>
//           <Typography variant="h4" fontWeight="900" sx={{ color: '#0f172a' }}>Sales Insights</Typography>
//           <Typography variant="body1" sx={{ color: '#64748b' }}>Customers & Revenue Distribution</Typography>
//         </Box>
//         <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
//           <Box sx={{ display: 'flex', gap: 2, bgcolor: 'white', p: 1, borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
//             <TextField type="date" label="From" size="small" value={filters.from_date} onChange={(e) => setFilters({ ...filters, from_date: e.target.value })} InputLabelProps={{ shrink: true }} variant="standard" sx={{ width: 150, px: 1 }} />
//             <TextField type="date" label="To" size="small" value={filters.to_date} onChange={(e) => setFilters({ ...filters, to_date: e.target.value })} InputLabelProps={{ shrink: true }} variant="standard" sx={{ width: 150, px: 1 }} />
//             <Button variant="contained" disableElevation onClick={fetchTopBuyers} startIcon={<Refresh />} sx={{ borderRadius: '8px', bgcolor: '#0ea5e9' }}>Refresh</Button>
//           </Box>

//           <Button
//             variant="outlined"
//             startIcon={<GridView />}
//             onClick={handleExportClick}
//             sx={{ borderRadius: '8px', borderColor: '#0ea5e9', color: '#0ea5e9', '&:hover': { borderColor: '#0284c7' } }}
//           >
//             Export
//           </Button>

//           <Menu
//             anchorEl={exportAnchorEl}
//             open={exportOpen}
//             onClose={handleExportClose}
//             PaperProps={{
//               sx: {
//                 mt: 1,
//                 borderRadius: '8px',
//                 boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
//               }
//             }}
//           >
//             <MenuItem onClick={exportToExcel} sx={{ py: 1.5, px: 3 }}>
//               <GridView sx={{ mr: 2, color: '#10b981' }} />
//               <Box>
//                 <Typography variant="body1" fontWeight="600">Export to Excel</Typography>
//                 <Typography variant="caption" color="text.secondary">Top 20 buyers in single sheet</Typography>
//               </Box>
//             </MenuItem>
//             <Divider />
//             <MenuItem onClick={generatePDF} sx={{ py: 1.5, px: 3 }}>
//               <PictureAsPdf sx={{ mr: 2, color: '#ef4444' }} />
//               <Box>
//                 <Typography variant="body1" fontWeight="600">Generate PDF</Typography>
//                 <Typography variant="caption" color="text.secondary">Printable report with proper formatting</Typography>
//               </Box>
//             </MenuItem>
//           </Menu>
//         </Box>
//       </Box>

//       <Grid container spacing={3} sx={{ mb: 4 }}>
//         {[
//           { label: 'Top 20 Buyers', value: buyers.length, icon: <Groups />, color: '#0ea5e9' },
//           { label: 'Top 20 Volume', value: `${grandTotalVolume.toLocaleString('en-IN')} Q`, icon: <Inventory />, color: '#10b981' },
//           { label: 'Top 20 Turnover', value: formatSmartCurrency(grandTotalValue), icon: <AttachMoney />, color: '#f59e0b' },
//           { label: 'Top 20 Buyer Invoices', value: buyers.reduce((a, b) => a + (parseInt(b.BillCount) || 0), 0), icon: <AssignmentTurnedIn />, color: '#6366f1' },
//         ].map((stat, i) => (
//           <Grid item xs={12} sm={6} md={3} key={i}>
//             <Zoom in={true} style={{ transitionDelay: `${i * 100}ms` }}>
//               <StyledCard>
//                 <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
//                   <MetricIcon bgcolor={stat.color} variant="rounded">{stat.icon}</MetricIcon>
//                   <Box sx={{ ml: 2 }}>
//                     <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>{stat.label}</Typography>
//                     <Typography variant="h5" sx={{ fontWeight: 800 }}>{stat.value}</Typography>
//                   </Box>
//                 </CardContent>
//               </StyledCard>
//             </Zoom>
//           </Grid>
//         ))}
//       </Grid>

//       <StyledCard>
//         <TableContainer>
//           <Table>
//             <TableHead sx={{ bgcolor: '#f8fafc' }}>
//               <TableRow>
//                 <TableCell sx={{ fontWeight: 700 }}>RANK</TableCell>
//                 <TableCell sx={{ fontWeight: 700 }}>CUSTOMER NAME</TableCell>
//                 <TableCell align="right" sx={{ fontWeight: 700 }}>
//                   <TableSortLabel active={orderBy === 'TotalNetQntl'} direction={orderBy === 'TotalNetQntl' ? order : 'asc'} onClick={() => handleRequestSort('TotalNetQntl')}>
//                     VOLUME (QNTL)
//                   </TableSortLabel>
//                 </TableCell>
//                 <TableCell align="right" sx={{ fontWeight: 700 }}>
//                   <TableSortLabel active={orderBy === 'BillCount'} direction={orderBy === 'BillCount' ? order : 'asc'} onClick={() => handleRequestSort('BillCount')}>
//                     BILLS
//                   </TableSortLabel>
//                 </TableCell>
//                 <TableCell align="right" sx={{ fontWeight: 700 }}>
//                   <TableSortLabel active={orderBy === 'TotalBillAmount'} direction={orderBy === 'TotalBillAmount' ? order : 'asc'} onClick={() => handleRequestSort('TotalBillAmount')}>
//                     TOTAL VALUATION
//                   </TableSortLabel>
//                 </TableCell>
//                 <TableCell align="center" sx={{ fontWeight: 700 }}>TREND</TableCell>
//               </TableRow>
//             </TableHead>
//             <TableBody>
//               {loading ? (
//                 <TableRow><TableCell colSpan={6}><LinearProgress sx={{ my: 2 }} /></TableCell></TableRow>
//               ) : (
//                 sortedBuyers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((buyer, index) => {
//                   const volShare = grandTotalVolume > 0 ? ((buyer.TotalNetQntl / grandTotalVolume) * 100).toFixed(2) : 0;
//                   const valShare = grandTotalValue > 0 ? ((buyer.TotalBillAmount / grandTotalValue) * 100).toFixed(2) : 0;

//                   const isExpanded = expandedBuyerPan === buyer.Carporate_Pan;

//                   return (
//                     <React.Fragment key={buyer.Carporate_Pan}>
//                       <TableRow
//                         hover
//                         onClick={() => toggleAccordion(buyer.Carporate_Pan, buyer.TotalNetQntl)}
//                         sx={{
//                           cursor: 'pointer',
//                           backgroundColor: isExpanded ? '#f1f5f9' : 'inherit',
//                           '&:hover': { backgroundColor: '#f1f5f9 !important' }
//                         }}
//                       >
//                         <TableCell>
//                           <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem', bgcolor: isExpanded ? '#42555eff' : '#0465eeff' }}>
//                             {page * rowsPerPage + index + 1}
//                           </Avatar>
//                         </TableCell>
//                         <TableCell>
//                           <Typography variant="subtitle2" fontWeight="700">{buyer.Customer_Name}</Typography>
//                           <Typography variant="caption" color="blue">GSTN : {buyer.Customer_GSTN} | PAN No. : {buyer.Carporate_Pan}</Typography>
//                         </TableCell>
//                         <TableCell align="right">
//                           <Typography variant="body2" fontWeight="700">{parseFloat(buyer.TotalNetQntl).toLocaleString('en-IN')} Q</Typography>
//                           <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 700, display: 'block' }}>{volShare}% Share</Typography>
//                         </TableCell>
//                         <TableCell align="right">
//                           <Chip label={buyer.BillCount} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
//                         </TableCell>
//                         <TableCell align="right">
//                           <MuiTooltip >
//                             <Box >
//                               <Typography variant="body2" fontWeight="800" color="primary">{formatSmartCurrency(buyer.TotalBillAmount)}</Typography>
//                               <Typography variant="caption" sx={{ color: '#f59e0b', fontWeight: 700 }}>{valShare}% Share</Typography>
//                             </Box>
//                           </MuiTooltip>
//                         </TableCell>
//                         <TableCell align="center">
//                           <IconButton size="small">
//                             {isExpanded ? <KeyboardArrowUp color="primary" /> : <TrendingUp />}
//                           </IconButton>
//                         </TableCell>
//                       </TableRow>

//                       <TableRow>
//                         <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
//                           <Collapse in={isExpanded} timeout="auto" unmountOnExit>
//                             <Box sx={{ p: 4, bgcolor: '#f8fafc' }}>
//                               {monthLoading ? <LinearProgress /> : (
//                                 <Grid container spacing={4}>
//                                   <Grid item xs={12} md={8}>
//                                     <Typography variant="subtitle2" fontWeight="800" gutterBottom>Monthly Sales Volume Trend</Typography>
//                                     <Box height={250}>
//                                       <ResponsiveContainer>
//                                         <AreaChart data={monthwiseData}>
//                                           <defs>
//                                             <linearGradient id="colorSale" x1="0" y1="0" x2="0" y2="1">
//                                               <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
//                                               <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
//                                             </linearGradient>
//                                           </defs>
//                                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
//                                           <XAxis dataKey="month_name" />
//                                           <YAxis />
//                                           <Tooltip />
//                                           <Area type="monotone" dataKey="total_quintal" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorSale)" />
//                                         </AreaChart>
//                                       </ResponsiveContainer>
//                                     </Box>
//                                   </Grid>
//                                   <Grid item xs={12} md={4}>
//                                     <Typography variant="subtitle2" fontWeight="800" gutterBottom>Breakdown</Typography>
//                                     {monthwiseData.map((m, idx) => (
//                                       <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #e2e8f0' }}>
//                                         <Typography variant="body2">{m.month}</Typography>
//                                         <Box sx={{ textAlign: 'right' }}>
//                                           <Typography variant="body2" fontWeight="700">{m.total_quintal} Q</Typography>
//                                           <Typography variant="caption" color="primary">{m.percentage}% of buyer total</Typography>
//                                         </Box>
//                                       </Box>
//                                     ))}
//                                   </Grid>
//                                 </Grid>
//                               )}
//                             </Box>
//                           </Collapse>
//                         </TableCell>
//                       </TableRow>
//                     </React.Fragment>
//                   );
//                 })
//               )}
//             </TableBody>
//           </Table>
//         </TableContainer>
//         <TablePagination
//           rowsPerPageOptions={[5, 10, 25, 50]}
//           component="div"
//           count={buyers.length}
//           rowsPerPage={rowsPerPage}
//           page={page}
//           onPageChange={(_, p) => setPage(p)}
//           onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
//         />
//       </StyledCard>
//     </Box>
//   );
// };

// export default SaleTopBuyers;















import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
} from 'recharts';
import {
  TrendingUp, Inventory, AttachMoney, Refresh, KeyboardArrowUp, KeyboardArrowDown,
  Groups, AssignmentTurnedIn, PictureAsPdf, GridView
} from '@mui/icons-material';
import {
  Box, Card, CardContent, Typography, Grid, TextField, Button,
  Chip, LinearProgress, IconButton, Collapse, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TablePagination,
  Avatar, Tooltip as MuiTooltip, Zoom, TableSortLabel,
  Menu, MenuItem, Divider
} from '@mui/material';
import { styled } from '@mui/material/styles';
import * as XLSX from 'xlsx';
import BackButton from '../../Common/Buttons/BackButton';
import { useNavigate } from "react-router-dom";

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: '16px',
  boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)',
  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 8px 30px 0 rgba(0,0,0,0.12)',
  },
}));

const MetricIcon = styled(Avatar)(({ bgcolor }) => ({
  backgroundColor: bgcolor,
  width: 56,
  height: 56,
  borderRadius: '12px',
  boxShadow: `0 4px 12px 0 ${bgcolor}44`,
}));

// ─── State code map (first 2 digits of GSTN = state code) ───────────────────
const STATE_CODES = {
  '01': 'Jammu and Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Orissa',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '25': 'Daman and Diu',
  '26': 'Dadra and Nagar Haveli',
  '27': 'Maharashtra',
  '28': 'Andhra Pradesh',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman and Nicobar',
  '36': 'Telangana',
  '37': 'Andhra Pradesh (New)',
  '97': 'Other Territory',
  '98': 'NA',
};

const getStateFromGSTN = (gstn) => {
  if (!gstn || gstn.length < 2) return null;
  const code = gstn.substring(0, 2);
  return { code, name: STATE_CODES[code] || 'Unknown' };
};
// ─────────────────────────────────────────────────────────────────────────────

const API_URL = process.env.REACT_APP_API;

const SaleTopBuyers = () => {
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [monthwiseData, setMonthwiseData] = useState([]);
  const [monthLoading, setMonthLoading] = useState(false);

  const [expandedBuyerPan, setExpandedBuyerPan] = useState(null);

  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('TotalNetQntl');

  // ── NEW: state filter ──────────────────────────────────────────────────────
  const [selectedState, setSelectedState] = useState('ALL');
  // ──────────────────────────────────────────────────────────────────────────

  const [filters, setFilters] = useState({
    from_date: new Date().toISOString().split('T')[0],
    to_date: new Date().toISOString().split('T')[0],
  });

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(100);

  const [exportAnchorEl, setExportAnchorEl] = useState(null);
  const exportOpen = Boolean(exportAnchorEl);

  const navigate = useNavigate();

  const numberToWords = (n) => {
    if (n === 0) return 'Zero';
    if (!n) return '';
    let num = Math.floor(parseFloat(n));
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const formatPart = (v, suffix) => {
      if (v === 0) return '';
      let str = v > 19 ? b[Math.floor(v / 10)] + ' ' + a[v % 10] : a[v];
      return str + suffix;
    };
    let words = '';
    words += formatPart(Math.floor(num / 10000000), 'Crore ');
    words += formatPart(Math.floor((num / 100000) % 100), 'Lakh ');
    words += formatPart(Math.floor((num / 1000) % 100), 'Thousand ');
    words += formatPart(Math.floor((num / 100) % 10), 'Hundred ');
    const lastTwo = num % 100;
    if (num > 100 && lastTwo > 0) words += 'and ';
    words += formatPart(lastTwo, '');
    return words.trim() + ' Rupees Only';
  };

  const formatSmartCurrency = (num) => {
    const absNum = Math.abs(num);
    if (absNum >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    if (absNum >= 100000) return `₹${(num / 100000).toFixed(2)} Lac`;
    return `₹${parseFloat(num).toLocaleString('en-IN')}`;
  };

  const formatNumber = (num) => parseFloat(num).toLocaleString('en-IN');

  const getSessionData = () => ({
    companyCode: sessionStorage.getItem('Company_Code') || '1'
  });

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedBuyers = useMemo(() => {
    const comparator = (a, b) => {
      let valA = a[orderBy];
      let valB = b[orderBy];
      if (['TotalNetQntl', 'TotalBillAmount', 'BillCount'].includes(orderBy)) {
        valA = parseFloat(valA) || 0;
        valB = parseFloat(valB) || 0;
      }
      if (valB < valA) return order === 'desc' ? -1 : 1;
      if (valB > valA) return order === 'desc' ? 1 : -1;
      return 0;
    };
    return [...buyers].sort(comparator);
  }, [buyers, order, orderBy]);

  // ── NEW: derive dropdown options from actual buyer data ────────────────────
  const stateOptions = useMemo(() => {
    const seen = new Map();
    buyers.forEach(b => {
      const s = getStateFromGSTN(b.Customer_GSTN);
      if (s && !seen.has(s.code)) seen.set(s.code, s.name);
    });
    return [
      { code: 'ALL', name: 'All States' },
      ...[...seen.entries()]
        .map(([code, name]) => ({ code, name }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    ];
  }, [buyers]);

  // ── NEW: apply state filter on top of sort ─────────────────────────────────
  const filteredBuyers = useMemo(() => {
    if (selectedState === 'ALL') return sortedBuyers;
    return sortedBuyers.filter(b => {
      const s = getStateFromGSTN(b.Customer_GSTN);
      return s && s.code === selectedState;
    });
  }, [sortedBuyers, selectedState]);
  // ──────────────────────────────────────────────────────────────────────────

  const fetchTopBuyers = async () => {
    setLoading(true);
    try {
      const { companyCode } = getSessionData();
      const response = await axios.get(`${API_URL}/sale-top-buyers`, {
        params: { ...filters, company_code: companyCode }
      });
      setBuyers(response.data.buyers || []);
    } catch (err) {
      console.error("Error fetching buyers:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAccordion = async (pan, totalBuyerQuintal) => {
    if (expandedBuyerPan === pan) {
      setExpandedBuyerPan(null);
      return;
    }

    setExpandedBuyerPan(pan);
    setMonthLoading(true);
    try {
      const { companyCode } = getSessionData();
      const response = await axios.get(`${API_URL}/sale-buyer-monthwise-quintal`, {
        params: { ...filters, company_code: companyCode, carporate_pan: pan }
      });
      const rawData = response.data.monthwise_quintal || [];
      const dataWithPercent = rawData.map(item => ({
        ...item,
        percentage: totalBuyerQuintal > 0 ? ((parseFloat(item.total_quintal) / parseFloat(totalBuyerQuintal)) * 100).toFixed(2) : 0
      }));
      setMonthwiseData(dataWithPercent);
    } catch (err) {
      console.error(err);
    } finally {
      setMonthLoading(false);
    }
  };

  const handleExportClick = (event) => {
    setExportAnchorEl(event.currentTarget);
  };

  const handleExportClose = () => {
    setExportAnchorEl(null);
  };

  const exportToExcel = () => {
    const top20Buyers = filteredBuyers.slice(0, 10000);

    const grandTotalVolume = filteredBuyers.reduce((a, b) => a + (parseFloat(b.TotalNetQntl) || 0), 0);
    const grandTotalValue = filteredBuyers.reduce((a, b) => a + (parseFloat(b.TotalBillAmount) || 0), 0);
    const totalBills = filteredBuyers.reduce((a, b) => a + (parseInt(b.BillCount) || 0), 0);

    const stateLabel = selectedState === 'ALL' ? 'All States' : (STATE_CODES[selectedState] || selectedState);

    const excelData = [
      ['SALES INSIGHTS REPORT'],
      [`Report Period: ${filters.from_date} to ${filters.to_date}`],
      [`State Filter: ${stateLabel}`],
      [`Generated on: ${new Date().toLocaleDateString()}`],
      [],
      ['OVERALL SUMMARY'],
      [`Total Buyers`, filteredBuyers.length],
      [`Total Sale Volume (Qntl)`, grandTotalVolume],
      [`Total Revenue`, grandTotalValue],
      [`Total Bills`, totalBills],
      [],
      ['TOP 20 BUYERS'],
      ['Rank', 'Customer Name', 'GSTN', 'State', 'PAN', 'Volume (Qntl)', 'Volume Share %', 'Bills', 'Total Revenue', 'Value Share %'],
      ...top20Buyers.map((buyer, index) => [
        index + 1,
        buyer.Customer_Name || '',
        buyer.Customer_GSTN || '',
        getStateFromGSTN(buyer.Customer_GSTN)?.name || '',
        buyer.Carporate_Pan || '',
        parseFloat(buyer.TotalNetQntl) || 0,
        grandTotalVolume > 0 ? ((parseFloat(buyer.TotalNetQntl) / grandTotalVolume) * 100).toFixed(2) : 0,
        parseInt(buyer.BillCount) || 0,
        parseFloat(buyer.TotalBillAmount) || 0,
        grandTotalValue > 0 ? ((parseFloat(buyer.TotalBillAmount) / grandTotalValue) * 100).toFixed(2) : 0
      ])
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(excelData);

    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 9 } },
      { s: { r: 3, c: 0 }, e: { r: 3, c: 9 } },
      { s: { r: 5, c: 0 }, e: { r: 5, c: 9 } },
      { s: { r: 11, c: 0 }, e: { r: 11, c: 9 } },
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Sales Insights');

    const maxWidth = Math.max(...top20Buyers.map(b => b.Customer_Name?.length || 0), 15);
    ws['!cols'] = [
      { wch: 6 }, { wch: Math.min(maxWidth, 40) }, { wch: 20 }, { wch: 22 },
      { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 15 }, { wch: 12 },
    ];

    XLSX.writeFile(wb, `Sales_Insights_${filters.from_date}_to_${filters.to_date}.xlsx`);
    handleExportClose();
  };

  const generatePDF = () => {
    handleExportClose();

    const grandTotalVolume = filteredBuyers.reduce((a, b) => a + (parseFloat(b.TotalNetQntl) || 0), 0);
    const grandTotalValue = filteredBuyers.reduce((a, b) => a + (parseFloat(b.TotalBillAmount) || 0), 0);
    const totalBills = filteredBuyers.reduce((a, b) => a + (parseInt(b.BillCount) || 0), 0);
    const top20Buyers = filteredBuyers.slice(0, 20);
    const stateLabel = selectedState === 'ALL' ? 'All States' : (STATE_CODES[selectedState] || selectedState);

    const printWindow = window.open('', '_blank');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Sales Insights Report</title>
        <style>
          @media print {
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              color: #333;
            }
            .report-title {
              text-align: center;
              margin-bottom: 20px;
            }
            .report-title h1 {
              color: #0f172a;
              margin-bottom: 5px;
              font-size: 28px;
            }
            .report-title .date-info {
              color: #64748b;
              font-size: 14px;
            }
            .summary-section {
              margin: 30px 0;
            }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 15px;
              margin-top: 15px;
            }
            .summary-card {
              background: #f8fafc;
              padding: 15px;
              border-radius: 8px;
              text-align: center;
            }
            .summary-label {
              color: #64748b;
              font-weight: 600;
              margin-bottom: 8px;
            }
            .summary-value {
              font-size: 24px;
              font-weight: 800;
            }
            .table-title {
              color: #334155;
              margin: 25px 0 15px 0;
              padding-bottom: 10px;
              border-bottom: 2px solid #e2e8f0;
            }
            .data-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            .data-table th {
              background-color: #f1f5f9;
              color: #475569;
              font-weight: bold;
              padding: 12px 8px;
              text-align: left;
              border-bottom: 2px solid #e2e8f0;
            }
            .data-table td {
              padding: 12px 8px;
              border-bottom: 1px solid #e2e8f0;
            }
            .data-table tr:hover {
              background-color: #f8fafc;
            }
            .rank-badge {
              display: inline-block;
              width: 28px;
              height: 28px;
              background-color: #0465ee;
              color: white;
              border-radius: 50%;
              text-align: center;
              line-height: 28px;
              font-weight: 600;
              font-size: 0.75rem;
            }
            .customer-name { font-weight: 700; margin-bottom: 4px; font-size: 0.875rem; }
            .customer-details { font-size: 12px; color: #3b82f6; }
            .volume-value { font-weight: 700; margin-bottom: 4px; }
            .volume-share { font-size: 12px; color: #10b981; font-weight: 600; }
            .bill-count { display: inline-block; border: 1px solid #e2e8f0; padding: 4px 8px; border-radius: 16px; font-size: 14px; }
            .revenue-value { font-weight: 800; color: #3b82f6; margin-bottom: 4px; }
            .value-share { font-size: 12px; color: #f59e0b; font-weight: 600; }
            .footer { text-align: center; color: #64748b; font-size: 12px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
            @page { margin: 20mm; }
          }
        </style>
      </head>
      <body>
        <div class="report-title">
          <h1>Sales Insights Report</h1>
          <div class="date-info">
            <p>Report Period: ${filters.from_date} to ${filters.to_date}</p>
            <p>State Filter: ${stateLabel}</p>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
          </div>
        </div>
        
        <div class="summary-section">
          <h2>Overall Summary</h2>
          <div class="summary-grid">
            <div class="summary-card">
              <div class="summary-label">Top 20 Buyers</div>
              <div class="summary-value">${filteredBuyers.length}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Top 20 Volume</div>
              <div class="summary-value">${formatNumber(grandTotalVolume)} Q</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Top 20 Turnover</div>
              <div class="summary-value">${formatSmartCurrency(grandTotalValue)}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Top 20 Buyer Invoices</div>
              <div class="summary-value">${totalBills}</div>
            </div>
          </div>
        </div>
        
        <h2 class="table-title">Top 20 Buyers</h2>
        <table class="data-table">
          <thead>
            <tr>
              <th width="60">Rank</th>
              <th>Customer Details</th>
              <th width="120" align="right">Volume (Qntl)</th>
              <th width="100" align="right">Bills</th>
              <th width="150" align="right">Total Revenue</th>
            </tr>
          </thead>
          <tbody>
    `);

    top20Buyers.forEach((buyer, index) => {
      const volShare = grandTotalVolume > 0 ? ((parseFloat(buyer.TotalNetQntl) / grandTotalVolume) * 100).toFixed(2) : 0;
      const valShare = grandTotalValue > 0 ? ((parseFloat(buyer.TotalBillAmount) / grandTotalValue) * 100).toFixed(2) : 0;
      const stateName = getStateFromGSTN(buyer.Customer_GSTN)?.name || '';

      printWindow.document.write(`
        <tr>
          <td><div class="rank-badge">${index + 1}</div></td>
          <td>
            <div class="customer-name">${buyer.Customer_Name || ''}</div>
            <div class="customer-details">
              GSTN: ${buyer.Customer_GSTN || ''} (${stateName}) | PAN: ${buyer.Carporate_Pan || ''}
            </div>
          </td>
          <td align="right">
            <div class="volume-value">${formatNumber(buyer.TotalNetQntl)} Q</div>
            <div class="volume-share">${volShare}% Share</div>
          </td>
          <td align="right">
            <div class="bill-count">${buyer.BillCount || 0}</div>
          </td>
          <td align="right">
            <div class="revenue-value">${formatSmartCurrency(buyer.TotalBillAmount)}</div>
            <div class="value-share">${valShare}% Share</div>
          </td>
        </tr>
      `);
    });

    printWindow.document.write(`
          </tbody>
        </table>
        <div class="footer"></div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }, 500);
          };
        </script>
      </body>
      </html>
    `);

    printWindow.document.close();
  };

  const grandTotalVolume = filteredBuyers.reduce((a, b) => a + (parseFloat(b.TotalNetQntl) || 0), 0);
  const grandTotalValue = filteredBuyers.reduce((a, b) => a + (parseFloat(b.TotalBillAmount) || 0), 0);

  useEffect(() => { fetchTopBuyers(); }, []);

  return (
    <Box sx={{ p: 4, backgroundColor: '#f1f5f9', minHeight: '100vh', mb: 20 }}>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Grid item>
          <BackButton onClick={() => navigate("/Analytics")} />
        </Grid>
        <Box>
          <Typography variant="h5" fontWeight="900" sx={{ color: '#0f172a' }}>Sales Insights</Typography>
          <Typography variant="body1" sx={{ color: '#64748b' }}>Customers & Revenue Distribution</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Box sx={{ display: 'flex', gap: 2, bgcolor: 'white', p: 1, borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <TextField
              type="date" label="From" size="small" value={filters.from_date}
              onChange={(e) => setFilters({ ...filters, from_date: e.target.value })}
              InputLabelProps={{ shrink: true }} variant="standard" sx={{ width: 150, px: 1 }}
            />
            <TextField
              type="date" label="To" size="small" value={filters.to_date}
              onChange={(e) => setFilters({ ...filters, to_date: e.target.value })}
              InputLabelProps={{ shrink: true }} variant="standard" sx={{ width: 150, px: 1 }}
            />

            {/* ── NEW: State filter dropdown ── */}
            <TextField
              select label="State" size="small" value={selectedState}
              onChange={(e) => { setSelectedState(e.target.value); setPage(0); }}
              variant="standard" sx={{ width: 180, px: 1 }}
            >
              {stateOptions.map(s => (
                <MenuItem key={s.code} value={s.code}>{s.name}</MenuItem>
              ))}
            </TextField>

            <Button
              variant="contained" disableElevation onClick={fetchTopBuyers}
              startIcon={<Refresh />} sx={{ borderRadius: '8px', bgcolor: '#0ea5e9' }}
            >
              Refresh
            </Button>
          </Box>

          <Button
            variant="outlined"
            startIcon={<GridView />}
            onClick={handleExportClick}
            sx={{ borderRadius: '8px', borderColor: '#0ea5e9', color: '#0ea5e9', '&:hover': { borderColor: '#0284c7' } }}
          >
            Export
          </Button>

          <Menu
            anchorEl={exportAnchorEl}
            open={exportOpen}
            onClose={handleExportClose}
            PaperProps={{ sx: { mt: 1, borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' } }}
          >
            <MenuItem onClick={exportToExcel} sx={{ py: 1.5, px: 3 }}>
              <GridView sx={{ mr: 2, color: '#10b981' }} />
              <Box>
                <Typography variant="body1" fontWeight="600">Export to Excel</Typography>
                <Typography variant="caption" color="text.secondary">Top 20 buyers in single sheet</Typography>
              </Box>
            </MenuItem>
            <Divider />
            <MenuItem onClick={generatePDF} sx={{ py: 1.5, px: 3 }}>
              <PictureAsPdf sx={{ mr: 2, color: '#ef4444' }} />
              <Box>
                <Typography variant="body1" fontWeight="600">Generate PDF</Typography>
                <Typography variant="caption" color="text.secondary">Printable report with proper formatting</Typography>
              </Box>
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* Summary metric cards — now reflect filtered data */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { label: selectedState === 'ALL' ? 'Top Buyers' : `Buyers · ${STATE_CODES[selectedState]}`, value: filteredBuyers.length, icon: <Groups />, color: '#0ea5e9' },
          { label: 'Total Volume', value: `${grandTotalVolume.toLocaleString('en-IN')} Q`, icon: <Inventory />, color: '#10b981' },
          { label: 'Total Turnover', value: formatSmartCurrency(grandTotalValue), icon: <AttachMoney />, color: '#f59e0b' },
          { label: 'Total Invoices', value: filteredBuyers.reduce((a, b) => a + (parseInt(b.BillCount) || 0), 0), icon: <AssignmentTurnedIn />, color: '#6366f1' },
        ].map((stat, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Zoom in={true} style={{ transitionDelay: `${i * 100}ms` }}>
              <StyledCard>
                <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
                  <MetricIcon bgcolor={stat.color} variant="rounded">{stat.icon}</MetricIcon>
                  <Box sx={{ ml: 2 }}>
                    <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>{stat.label}</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>{stat.value}</Typography>
                  </Box>
                </CardContent>
              </StyledCard>
            </Zoom>
          </Grid>
        ))}
      </Grid>

      <StyledCard>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>RANK</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>CUSTOMER NAME</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  <TableSortLabel
                    active={orderBy === 'TotalNetQntl'}
                    direction={orderBy === 'TotalNetQntl' ? order : 'asc'}
                    onClick={() => handleRequestSort('TotalNetQntl')}
                  >
                    VOLUME (QNTL)
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  <TableSortLabel
                    active={orderBy === 'BillCount'}
                    direction={orderBy === 'BillCount' ? order : 'asc'}
                    onClick={() => handleRequestSort('BillCount')}
                  >
                    BILLS
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  <TableSortLabel
                    active={orderBy === 'TotalBillAmount'}
                    direction={orderBy === 'TotalBillAmount' ? order : 'asc'}
                    onClick={() => handleRequestSort('TotalBillAmount')}
                  >
                    TOTAL VALUATION
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>TREND</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6}><LinearProgress sx={{ my: 2 }} /></TableCell>
                </TableRow>
              ) : (
                filteredBuyers
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((buyer, index) => {
                    const volShare = grandTotalVolume > 0 ? ((buyer.TotalNetQntl / grandTotalVolume) * 100).toFixed(2) : 0;
                    const valShare = grandTotalValue > 0 ? ((buyer.TotalBillAmount / grandTotalValue) * 100).toFixed(2) : 0;
                    const isExpanded = expandedBuyerPan === buyer.Carporate_Pan;
                    const stateName = getStateFromGSTN(buyer.Customer_GSTN)?.name || '';

                    return (
                      <React.Fragment key={buyer.Carporate_Pan}>
                        <TableRow
                          hover
                          onClick={() => toggleAccordion(buyer.Carporate_Pan, buyer.TotalNetQntl)}
                          sx={{
                            cursor: 'pointer',
                            backgroundColor: isExpanded ? '#f1f5f9' : 'inherit',
                            '&:hover': { backgroundColor: '#f1f5f9 !important' }
                          }}
                        >
                          <TableCell>
                            <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem', bgcolor: isExpanded ? '#42555eff' : '#0465eeff' }}>
                              {page * rowsPerPage + index + 1}
                            </Avatar>
                          </TableCell>
                          <TableCell>
                            <Typography variant="subtitle2" fontWeight="700">{buyer.Customer_Name}</Typography>
                            {/* ── State name shown next to GSTN ── */}
                            <Typography variant="caption" color="blue">
                              GSTN : {buyer.Customer_GSTN} ({stateName}) | PAN No. : {buyer.Carporate_Pan}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="700">{parseFloat(buyer.TotalNetQntl).toLocaleString('en-IN')} Q</Typography>
                            <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 700, display: 'block' }}>{volShare}% Share</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Chip label={buyer.BillCount} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                          </TableCell>
                          <TableCell align="right">
                            <MuiTooltip title={numberToWords(buyer.TotalBillAmount)}>
                              <Box>
                                <Typography variant="body2" fontWeight="800" color="primary">{formatSmartCurrency(buyer.TotalBillAmount)}</Typography>
                                <Typography variant="caption" sx={{ color: '#f59e0b', fontWeight: 700 }}>{valShare}% Share</Typography>
                              </Box>
                            </MuiTooltip>
                          </TableCell>
                          <TableCell align="center">
                            <IconButton size="small">
                              {isExpanded ? <KeyboardArrowUp color="primary" /> : <TrendingUp />}
                            </IconButton>
                          </TableCell>
                        </TableRow>

                        <TableRow>
                          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                              <Box sx={{ p: 4, bgcolor: '#f8fafc' }}>
                                {monthLoading ? <LinearProgress /> : (
                                  <Grid container spacing={4}>
                                    <Grid item xs={12} md={8}>
                                      <Typography variant="subtitle2" fontWeight="800" gutterBottom>Monthly Sales Volume Trend</Typography>
                                      <Box height={250}>
                                        <ResponsiveContainer>
                                          <AreaChart data={monthwiseData}>
                                            <defs>
                                              <linearGradient id="colorSale" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                              </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                            <XAxis dataKey="month_name" />
                                            <YAxis />
                                            <Tooltip />
                                            <Area type="monotone" dataKey="total_quintal" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorSale)" />
                                          </AreaChart>
                                        </ResponsiveContainer>
                                      </Box>
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                      <Typography variant="subtitle2" fontWeight="800" gutterBottom>Breakdown</Typography>
                                      {monthwiseData.map((m, idx) => (
                                        <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #e2e8f0' }}>
                                          <Typography variant="body2">{m.month}</Typography>
                                          <Box sx={{ textAlign: 'right' }}>
                                            <Typography variant="body2" fontWeight="700">{m.total_quintal} Q</Typography>
                                            <Typography variant="caption" color="primary">{m.percentage}% of buyer total</Typography>
                                          </Box>
                                        </Box>
                                      ))}
                                    </Grid>
                                  </Grid>
                                )}
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    );
                  })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50, 100]}
          component="div"
          count={filteredBuyers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        />
      </StyledCard>
    </Box>
  );
};

export default SaleTopBuyers;