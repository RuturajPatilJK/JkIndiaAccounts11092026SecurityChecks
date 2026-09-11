// import React, { useState, useEffect, useMemo, useRef } from 'react';
// import axios from 'axios';
// import {
//   XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
// } from 'recharts';
// import {
//   Inventory, AttachMoney, Refresh, KeyboardArrowDown, KeyboardArrowUp, Storefront,
//   AssignmentTurnedIn,
//   TrendingUp,
//   PictureAsPdf,
//   GridView
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

// const PurchaseTopSellers = () => {
//   const [sellers, setSellers] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [monthwiseData, setMonthwiseData] = useState([]);
//   const [monthLoading, setMonthLoading] = useState(false);

//   const [expandedSellerPan, setExpandedSellerPan] = useState(null);

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

//   const formatSmartCurrency = (num) => {
//     const absNum = Math.abs(num);
//     if (absNum >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
//     if (absNum >= 100000) return `₹${(num / 100000).toFixed(2)} Lac`;
//     return `₹${parseFloat(num).toLocaleString('en-IN')}`;
//   };

//   const formatNumber = (num) => parseFloat(num).toLocaleString('en-IN');

//   const getSessionData = () => ({
//     companyCode: sessionStorage.getItem('Company_Code')
//   });

//   const handleRequestSort = (property) => {
//     const isAsc = orderBy === property && order === 'asc';
//     setOrder(isAsc ? 'desc' : 'asc');
//     setOrderBy(property);
//   };

//   const sortedSellers = useMemo(() => {
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
//     return [...sellers].sort(comparator);
//   }, [sellers, order, orderBy]);

//   const fetchTopSellers = async () => {
//     setLoading(true);
//     try {
//       const { companyCode } = getSessionData();
//       const response = await axios.get(`${API_URL}/purchase-top-sellers`, {
//         params: { ...filters, company_code: companyCode }
//       });
//       setSellers(response.data.sellers || []);
//     } catch (err) { console.error(err); } finally { setLoading(false); }
//   };

//   const toggleAccordion = async (sellerPan, totalSellerQuintal) => {
//     if (expandedSellerPan === sellerPan) {
//       setExpandedSellerPan(null);
//       return;
//     }
//     setExpandedSellerPan(sellerPan);
//     setMonthLoading(true);

//     try {
//       const { companyCode } = getSessionData();
//       const response = await axios.get(`${API_URL}/purchase-seller-monthwise-quintal`, {
//         params: { ...filters, company_code: companyCode, company_pan: sellerPan }
//       });
//       const rawData = response.data.monthwise_quintal || [];
//       const dataWithPercent = rawData.map(item => ({
//         ...item,
//         percentage: totalSellerQuintal > 0 ? ((parseFloat(item.total_quintal) / parseFloat(totalSellerQuintal)) * 100).toFixed(2) : 0
//       }));
//       setMonthwiseData(dataWithPercent);
//     } catch (err) { console.error(err); } finally { setMonthLoading(false); }
//   };

//   const handleExportClick = (event) => {
//     setExportAnchorEl(event.currentTarget);
//   };

//   const handleExportClose = () => {
//     setExportAnchorEl(null);
//   };

//   const exportToExcel = () => {
//     const top20Sellers = sortedSellers.slice(0, 20);

//     const totalVolumeOverall = sellers.reduce((a, b) => a + (parseFloat(b.TotalNetQntl) || 0), 0);
//     const totalValuationOverall = sellers.reduce((a, b) => a + (parseFloat(b.TotalBillAmount) || 0), 0);
//     const totalInvoices = sellers.reduce((a, b) => a + (parseInt(b.BillCount) || 0), 0);

//     const excelData = [
//       ['SELLER INSIGHTS REPORT'],
//       [`Report Period: ${filters.from_date} to ${filters.to_date}`],
//       [`Generated on: ${new Date().toLocaleDateString()}`],
//       [],
//       ['OVERALL SUMMARY'],
//       [`Total Suppliers`, sellers.length],
//       [`Total Volume (Qntl)`, totalVolumeOverall],
//       [`Total Valuation`, totalValuationOverall],
//       [`Total Invoices`, totalInvoices],
//       [],
//       ['TOP 20 SUPPLIERS'],
//       ['Rank', 'Supplier Name', 'GSTN', 'PAN', 'Volume (Qntl)', 'Volume Share %', 'Invoices', 'Total Valuation', 'Value Share %'],
//       ...top20Sellers.map((seller, index) => [
//         index + 1,
//         seller.suppliername || '',
//         seller.suppliergstno || '',
//         seller.CompanyPan || '',
//         parseFloat(seller.TotalNetQntl) || 0,
//         totalVolumeOverall > 0 ? ((parseFloat(seller.TotalNetQntl) / totalVolumeOverall) * 100).toFixed(2) : 0,
//         parseInt(seller.BillCount) || 0,
//         parseFloat(seller.TotalBillAmount) || 0,
//         totalValuationOverall > 0 ? ((parseFloat(seller.TotalBillAmount) / totalValuationOverall) * 100).toFixed(2) : 0
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

//     XLSX.utils.book_append_sheet(wb, ws, 'Seller Insights');

//     const maxWidth = Math.max(...top20Sellers.map(s => s.suppliername?.length || 0), 15);
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

//     XLSX.writeFile(wb, `Seller_Insights_${filters.from_date}_to_${filters.to_date}.xlsx`);

//     handleExportClose();
//   };

//   const generatePDF = () => {
//     handleExportClose();

//     const totalVolumeOverall = sellers.reduce((a, b) => a + (parseFloat(b.TotalNetQntl) || 0), 0);
//     const totalValuationOverall = sellers.reduce((a, b) => a + (parseFloat(b.TotalBillAmount) || 0), 0);
//     const totalInvoices = sellers.reduce((a, b) => a + (parseInt(b.BillCount) || 0), 0);
//     const top20Sellers = sortedSellers.slice(0, 20);

//     // Create a new window for PDF generation
//     const printWindow = window.open('', '_blank');

//     printWindow.document.write(`
//       <!DOCTYPE html>
//       <html>
//       <head>
//         <title>Seller Insights Report</title>
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
//               color: #1e293b;
//               margin-bottom: 5px;
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
//               width: 30px;
//               height: 30px;
//               background-color: #6366f1;
//               color: white;
//               border-radius: 50%;
//               text-align: center;
//               line-height: 30px;
//               font-weight: 600;
//             }
//             .supplier-name {
//               font-weight: 700;
//               margin-bottom: 4px;
//             }
//             .supplier-details {
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
//             .invoice-count {
//               display: inline-block;
//               border: 1px solid #e2e8f0;
//               padding: 4px 8px;
//               border-radius: 16px;
//               font-size: 14px;
//             }
//             .valuation-value {
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
//           <h1>Seller Insights Report</h1>
//           <div class="date-info">
//             <p>Report Period: ${filters.from_date} to ${filters.to_date}</p>
//             <p>Generated on: ${new Date().toLocaleDateString()}</p>
//           </div>
//         </div>
        
//         <div class="summary-section">
//           <h2>Overall Summary</h2>
//           <div class="summary-grid">
//             <div class="summary-card">
//               <div class="summary-label">Top Sellers</div>
//               <div class="summary-value">${sellers.length}</div>
//             </div>
//             <div class="summary-card">
//               <div class="summary-label">Top 20 Volume</div>
//               <div class="summary-value">${formatNumber(totalVolumeOverall)} Q</div>
//             </div>
//             <div class="summary-card">
//               <div class="summary-label">Top 20 Turnover</div>
//               <div class="summary-value">${formatSmartCurrency(totalValuationOverall)}</div>
//             </div>
//             <div class="summary-card">
//               <div class="summary-label">Top 20 Seller Invoices</div>
//               <div class="summary-value">${totalInvoices}</div>
//             </div>
//           </div>
//         </div>
        
//         <h2 class="table-title">Top 20 Suppliers</h2>
//         <table class="data-table">
//           <thead>
//             <tr>
//               <th width="60">Rank</th>
//               <th>Supplier Details</th>
//               <th width="120" align="right">Volume (Qntl)</th>
//               <th width="100" align="right">Invoices</th>
//               <th width="150" align="right">Total Valuation</th>
//             </tr>
//           </thead>
//           <tbody>
//     `);

//     // Add table rows
//     top20Sellers.forEach((seller, index) => {
//       const volShare = totalVolumeOverall > 0 ? ((parseFloat(seller.TotalNetQntl) / totalVolumeOverall) * 100).toFixed(2) : 0;
//       const valShare = totalValuationOverall > 0 ? ((parseFloat(seller.TotalBillAmount) / totalValuationOverall) * 100).toFixed(2) : 0;

//       printWindow.document.write(`
//         <tr>
//           <td>
//             <div class="rank-badge">${index + 1}</div>
//           </td>
//           <td>
//             <div class="supplier-name">${seller.suppliername || ''}</div>
//             <div class="supplier-details">
//               GSTN: ${seller.suppliergstno || ''} | PAN: ${seller.CompanyPan || ''}
//             </div>
//           </td>
//           <td align="right">
//             <div class="volume-value">${formatNumber(seller.TotalNetQntl)} Q</div>
//             <div class="volume-share">${volShare}% Volume Share</div>
//           </td>
//           <td align="right">
//             <div class="invoice-count">${seller.BillCount || 0}</div>
//           </td>
//           <td align="right">
//             <div class="valuation-value">${formatSmartCurrency(seller.TotalBillAmount)}</div>
//             <div class="value-share">${valShare}% Value Share</div>
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

//   const totalVolumeOverall = sellers.reduce((a, b) => a + (parseFloat(b.TotalNetQntl) || 0), 0);
//   const totalValuationOverall = sellers.reduce((a, b) => a + (parseFloat(b.TotalBillAmount) || 0), 0);

//   useEffect(() => { fetchTopSellers(); }, []);

//   return (
//     <Box sx={{ p: 4, backgroundColor: '#f8fafc', minHeight: '100vh', mb: 20 }}>
//       <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
//         <Grid item>
//           <BackButton onClick={() => navigate("/Analytics")} />
//         </Grid>
//         <Box>
//           <Typography variant="h4" fontWeight="800" sx={{ color: '#1e293b' }}>Seller Insights</Typography>
//           <Typography variant="body1" sx={{ color: '#64748b' }}>Supplier Analytics</Typography>
//         </Box>
//         <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
//           <Box sx={{ display: 'flex', gap: 2, bgcolor: 'white', p: 1, borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
//             <TextField type="date" label="From" size="small" value={filters.from_date} onChange={(e) => setFilters({ ...filters, from_date: e.target.value })} InputLabelProps={{ shrink: true }} variant="standard" sx={{ width: 150, px: 1 }} />
//             <TextField type="date" label="To" size="small" value={filters.to_date} onChange={(e) => setFilters({ ...filters, to_date: e.target.value })} InputLabelProps={{ shrink: true }} variant="standard" sx={{ width: 150, px: 1 }} />
//             <Button variant="contained" disableElevation onClick={fetchTopSellers} startIcon={<Refresh />} sx={{ borderRadius: '8px', bgcolor: '#0ea5e9' }}>Refresh</Button>
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
//                 <Typography variant="caption" color="text.secondary">Top 20 sellers in single sheet</Typography>
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
//           { label: 'Top Sellers', value: sellers.length, icon: <Storefront />, color: '#6366f1' },
//           { label: 'Top 20 Volume', value: `${formatNumber(totalVolumeOverall)} Q`, icon: <Inventory />, color: '#10b981' },
//           { label: 'Top 20 Turnover', value: formatSmartCurrency(totalValuationOverall), icon: <AttachMoney />, color: '#f59e0b' },
//           { label: 'Top 20 Seller Invoices', value: sellers.reduce((a, b) => a + (parseInt(b.BillCount) || 0), 0), icon: <AssignmentTurnedIn />, color: '#ec4899' },
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
//                 <TableCell sx={{ fontWeight: 700 }}>
//                   <TableSortLabel active={orderBy === 'suppliername'} direction={orderBy === 'suppliername' ? order : 'asc'} onClick={() => handleRequestSort('suppliername')}>
//                     SUPPLIER DETAILS
//                   </TableSortLabel>
//                 </TableCell>
//                 <TableCell align="right" sx={{ fontWeight: 700 }}>
//                   <TableSortLabel active={orderBy === 'TotalNetQntl'} direction={orderBy === 'TotalNetQntl' ? order : 'asc'} onClick={() => handleRequestSort('TotalNetQntl')}>
//                     VOLUME (QNTL)
//                   </TableSortLabel>
//                 </TableCell>
//                 <TableCell align="right" sx={{ fontWeight: 700 }}>
//                   <TableSortLabel active={orderBy === 'BillCount'} direction={orderBy === 'BillCount' ? order : 'asc'} onClick={() => handleRequestSort('BillCount')}>
//                     INVOICES
//                   </TableSortLabel>
//                 </TableCell>
//                 <TableCell align="right" sx={{ fontWeight: 700 }}>
//                   <TableSortLabel active={orderBy === 'TotalBillAmount'} direction={orderBy === 'TotalBillAmount' ? order : 'asc'} onClick={() => handleRequestSort('TotalBillAmount')}>
//                     TOTAL VALUATION
//                   </TableSortLabel>
//                 </TableCell>
//                 <TableCell align="center" sx={{ fontWeight: 700 }}>DETAILS</TableCell>
//               </TableRow>
//             </TableHead>
//             <TableBody>
//               {loading ? (
//                 <TableRow><TableCell colSpan={6}><LinearProgress sx={{ my: 2 }} /></TableCell></TableRow>
//               ) : (
//                 sortedSellers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((seller, index) => {
//                   const volShare = totalVolumeOverall > 0 ? ((parseFloat(seller.TotalNetQntl) / totalVolumeOverall) * 100).toFixed(2) : 0;
//                   const valShare = totalValuationOverall > 0 ? ((parseFloat(seller.TotalBillAmount) / totalValuationOverall) * 100).toFixed(2) : 0;
//                   const isExpanded = expandedSellerPan === seller.CompanyPan;

//                   return (
//                     <React.Fragment key={seller.CompanyPan}>
//                       <TableRow
//                         hover
//                         onClick={() => toggleAccordion(seller.CompanyPan, seller.TotalNetQntl)}
//                         sx={{
//                           cursor: 'pointer',
//                           backgroundColor: isExpanded ? '#f1f5f9' : 'inherit',
//                           '&:hover': { backgroundColor: '#f1f5f9 !important' }
//                         }}
//                       >
//                         <TableCell>
//                           <Avatar sx={{ width: 30, height: 30, fontSize: '0.8 rem', bgcolor: isExpanded ? '#0ea5e9' : '#6366f1' }}>
//                             {page * rowsPerPage + index + 1}
//                           </Avatar>
//                         </TableCell>
//                         <TableCell>
//                           <Typography variant="subtitle2" fontWeight="800" >{seller.suppliername}</Typography>
//                           <Typography variant="caption" color="blue">GSTN : {seller.suppliergstno || ''} | PAN No. : {seller.CompanyPan}</Typography>
//                         </TableCell>
//                         <TableCell align="right">
//                           <Typography variant="body2" fontWeight="700">{formatNumber(seller.TotalNetQntl)} Q</Typography>
//                           <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 700, display: 'block' }}>{volShare}% Volume Share</Typography>
//                         </TableCell>
//                         <TableCell align="right">
//                           <Chip label={seller.BillCount} size="small" variant="outlined" />
//                         </TableCell>
//                         <TableCell align="right">
//                           <Typography variant="body2" fontWeight="800" color="primary">{formatSmartCurrency(seller.TotalBillAmount)}</Typography>
//                           <Typography variant="caption" sx={{ color: '#f59e0b', fontWeight: 700 }}>{valShare}% Value Share</Typography>
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
//                             <Box sx={{ p: 4, bgcolor: '#fcfcfd' }}>
//                               {monthLoading ? <LinearProgress /> : (
//                                 <Grid container spacing={4}>
//                                   <Grid item xs={12} md={7}>
//                                     <Typography variant="subtitle1" fontWeight="700" mb={2}>Supply Trend</Typography>
//                                     <Box height={200}>
//                                       <ResponsiveContainer>
//                                         <AreaChart data={monthwiseData}>
//                                           <CartesianGrid strokeDasharray="3 3" vertical={false} />
//                                           <XAxis dataKey="month_name" />
//                                           <YAxis />
//                                           <Tooltip />
//                                           <Area type="monotone" dataKey="total_quintal" stroke="#6366f1" fill="#6366f1" fillOpacity={0.1} />
//                                         </AreaChart>
//                                       </ResponsiveContainer>
//                                     </Box>
//                                   </Grid>
//                                   <Grid item xs={12} md={5}>
//                                     <Typography variant="subtitle1" fontWeight="700" mb={2}>Monthly Breakdown</Typography>
//                                     {monthwiseData.map((m, idx) => (
//                                       <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', p: 1, borderBottom: '1px solid #f1f5f9' }}>
//                                         <Typography variant="body2">{m.month}</Typography>
//                                         <Box sx={{ textAlign: 'right' }}>
//                                           <Typography variant="body2" fontWeight="700">{m.total_quintal} Q</Typography>
//                                           <Typography variant="caption" color="primary">{m.percentage}% of total</Typography>
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
//           count={sellers.length}
//           rowsPerPage={rowsPerPage}
//           page={page}
//           onPageChange={(_, newPage) => setPage(newPage)}
//           onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
//         />
//       </StyledCard>
//     </Box>
//   );
// };

// export default PurchaseTopSellers;






















import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
} from 'recharts';
import {
  Inventory, AttachMoney, Refresh, KeyboardArrowDown, KeyboardArrowUp, Storefront,
  AssignmentTurnedIn,
  TrendingUp,
  PictureAsPdf,
  GridView
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

const PurchaseTopSellers = () => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [monthwiseData, setMonthwiseData] = useState([]);
  const [monthLoading, setMonthLoading] = useState(false);

  const [expandedSellerPan, setExpandedSellerPan] = useState(null);

  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('TotalNetQntl');

  // ── State filter (same as SaleTopBuyers) ──────────────────────────────────
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

  const formatSmartCurrency = (num) => {
    const absNum = Math.abs(num);
    if (absNum >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    if (absNum >= 100000) return `₹${(num / 100000).toFixed(2)} Lac`;
    return `₹${parseFloat(num).toLocaleString('en-IN')}`;
  };

  const formatNumber = (num) => parseFloat(num).toLocaleString('en-IN');

  const getSessionData = () => ({
    companyCode: sessionStorage.getItem('Company_Code')
  });

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedSellers = useMemo(() => {
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
    return [...sellers].sort(comparator);
  }, [sellers, order, orderBy]);

  // ── Derive dropdown options from actual seller GSTN data ──────────────────
  const stateOptions = useMemo(() => {
    const seen = new Map();
    sellers.forEach(s => {
      const st = getStateFromGSTN(s.suppliergstno);
      if (st && !seen.has(st.code)) seen.set(st.code, st.name);
    });
    return [
      { code: 'ALL', name: 'All States' },
      ...[...seen.entries()]
        .map(([code, name]) => ({ code, name }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    ];
  }, [sellers]);

  // ── Apply state filter on top of sort ─────────────────────────────────────
  const filteredSellers = useMemo(() => {
    if (selectedState === 'ALL') return sortedSellers;
    return sortedSellers.filter(s => {
      const st = getStateFromGSTN(s.suppliergstno);
      return st && st.code === selectedState;
    });
  }, [sortedSellers, selectedState]);
  // ──────────────────────────────────────────────────────────────────────────

  const fetchTopSellers = async () => {
    setLoading(true);
    try {
      const { companyCode } = getSessionData();
      const response = await axios.get(`${API_URL}/purchase-top-sellers`, {
        params: { ...filters, company_code: companyCode }
      });
      setSellers(response.data.sellers || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const toggleAccordion = async (sellerPan, totalSellerQuintal) => {
    if (expandedSellerPan === sellerPan) {
      setExpandedSellerPan(null);
      return;
    }
    setExpandedSellerPan(sellerPan);
    setMonthLoading(true);

    try {
      const { companyCode } = getSessionData();
      const response = await axios.get(`${API_URL}/purchase-seller-monthwise-quintal`, {
        params: { ...filters, company_code: companyCode, company_pan: sellerPan }
      });
      const rawData = response.data.monthwise_quintal || [];
      const dataWithPercent = rawData.map(item => ({
        ...item,
        percentage: totalSellerQuintal > 0 ? ((parseFloat(item.total_quintal) / parseFloat(totalSellerQuintal)) * 100).toFixed(2) : 0
      }));
      setMonthwiseData(dataWithPercent);
    } catch (err) { console.error(err); } finally { setMonthLoading(false); }
  };

  const handleExportClick = (event) => {
    setExportAnchorEl(event.currentTarget);
  };

  const handleExportClose = () => {
    setExportAnchorEl(null);
  };

  const exportToExcel = () => {
    const top20Sellers = filteredSellers.slice(0, 10000);

    const grandTotalVolume = filteredSellers.reduce((a, b) => a + (parseFloat(b.TotalNetQntl) || 0), 0);
    const grandTotalValue  = filteredSellers.reduce((a, b) => a + (parseFloat(b.TotalBillAmount) || 0), 0);
    const totalInvoices    = filteredSellers.reduce((a, b) => a + (parseInt(b.BillCount) || 0), 0);

    const stateLabel = selectedState === 'ALL' ? 'All States' : (STATE_CODES[selectedState] || selectedState);

    const excelData = [
      ['SELLER INSIGHTS REPORT'],
      [`Report Period: ${filters.from_date} to ${filters.to_date}`],
      [`State Filter: ${stateLabel}`],
      [`Generated on: ${new Date().toLocaleDateString()}`],
      [],
      ['OVERALL SUMMARY'],
      [`Total Suppliers`, filteredSellers.length],
      [`Total Volume (Qntl)`, grandTotalVolume],
      [`Total Valuation`, grandTotalValue],
      [`Total Invoices`, totalInvoices],
      [],
      ['TOP SUPPLIERS'],
      ['Rank', 'Supplier Name', 'GSTN', 'State', 'PAN', 'Volume (Qntl)', 'Volume Share %', 'Invoices', 'Total Valuation', 'Value Share %'],
      ...top20Sellers.map((seller, index) => [
        index + 1,
        seller.suppliername || '',
        seller.suppliergstno || '',
        getStateFromGSTN(seller.suppliergstno)?.name || '',
        seller.CompanyPan || '',
        parseFloat(seller.TotalNetQntl) || 0,
        grandTotalVolume > 0 ? ((parseFloat(seller.TotalNetQntl) / grandTotalVolume) * 100).toFixed(2) : 0,
        parseInt(seller.BillCount) || 0,
        parseFloat(seller.TotalBillAmount) || 0,
        grandTotalValue > 0 ? ((parseFloat(seller.TotalBillAmount) / grandTotalValue) * 100).toFixed(2) : 0,
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

    XLSX.utils.book_append_sheet(wb, ws, 'Seller Insights');

    const maxWidth = Math.max(...top20Sellers.map(s => s.suppliername?.length || 0), 15);
    ws['!cols'] = [
      { wch: 6 }, { wch: Math.min(maxWidth, 40) }, { wch: 20 }, { wch: 22 },
      { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 15 }, { wch: 12 },
    ];

    XLSX.writeFile(wb, `Seller_Insights_${filters.from_date}_to_${filters.to_date}.xlsx`);
    handleExportClose();
  };

  const generatePDF = () => {
    handleExportClose();

    const grandTotalVolume = filteredSellers.reduce((a, b) => a + (parseFloat(b.TotalNetQntl) || 0), 0);
    const grandTotalValue  = filteredSellers.reduce((a, b) => a + (parseFloat(b.TotalBillAmount) || 0), 0);
    const totalInvoices    = filteredSellers.reduce((a, b) => a + (parseInt(b.BillCount) || 0), 0);
    const top20Sellers     = filteredSellers.slice(0, 20);
    const stateLabel       = selectedState === 'ALL' ? 'All States' : (STATE_CODES[selectedState] || selectedState);

    const printWindow = window.open('', '_blank');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Seller Insights Report</title>
        <style>
          @media print {
            body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
            .report-title { text-align: center; margin-bottom: 20px; }
            .report-title h1 { color: #1e293b; margin-bottom: 5px; }
            .report-title .date-info { color: #64748b; font-size: 14px; }
            .summary-section { margin: 30px 0; }
            .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-top: 15px; }
            .summary-card { background: #f8fafc; padding: 15px; border-radius: 8px; text-align: center; }
            .summary-label { color: #64748b; font-weight: 600; margin-bottom: 8px; }
            .summary-value { font-size: 24px; font-weight: 800; }
            .table-title { color: #334155; margin: 25px 0 15px 0; padding-bottom: 10px; border-bottom: 2px solid #e2e8f0; }
            .data-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .data-table th { background-color: #f1f5f9; color: #475569; font-weight: bold; padding: 12px 8px; text-align: left; border-bottom: 2px solid #e2e8f0; }
            .data-table td { padding: 12px 8px; border-bottom: 1px solid #e2e8f0; }
            .data-table tr:hover { background-color: #f8fafc; }
            .rank-badge { display: inline-block; width: 30px; height: 30px; background-color: #6366f1; color: white; border-radius: 50%; text-align: center; line-height: 30px; font-weight: 600; }
            .supplier-name { font-weight: 700; margin-bottom: 4px; }
            .supplier-details { font-size: 12px; color: #3b82f6; }
            .volume-value { font-weight: 700; margin-bottom: 4px; }
            .volume-share { font-size: 12px; color: #10b981; font-weight: 600; }
            .invoice-count { display: inline-block; border: 1px solid #e2e8f0; padding: 4px 8px; border-radius: 16px; font-size: 14px; }
            .valuation-value { font-weight: 800; color: #3b82f6; margin-bottom: 4px; }
            .value-share { font-size: 12px; color: #f59e0b; font-weight: 600; }
            .footer { text-align: center; color: #64748b; font-size: 12px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
            @page { margin: 20mm; }
          }
        </style>
      </head>
      <body>
        <div class="report-title">
          <h1>Seller Insights Report</h1>
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
              <div class="summary-label">${selectedState === 'ALL' ? 'Top Sellers' : `Sellers · ${STATE_CODES[selectedState] || selectedState}`}</div>
              <div class="summary-value">${filteredSellers.length}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Total Volume</div>
              <div class="summary-value">${formatNumber(grandTotalVolume)} Q</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Total Turnover</div>
              <div class="summary-value">${formatSmartCurrency(grandTotalValue)}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Total Invoices</div>
              <div class="summary-value">${totalInvoices}</div>
            </div>
          </div>
        </div>

        <h2 class="table-title">Top Suppliers</h2>
        <table class="data-table">
          <thead>
            <tr>
              <th width="60">Rank</th>
              <th>Supplier Details</th>
              <th width="120" align="right">Volume (Qntl)</th>
              <th width="100" align="right">Invoices</th>
              <th width="150" align="right">Total Valuation</th>
            </tr>
          </thead>
          <tbody>
    `);

    top20Sellers.forEach((seller, index) => {
      const volShare   = grandTotalVolume > 0 ? ((parseFloat(seller.TotalNetQntl) / grandTotalVolume) * 100).toFixed(2) : 0;
      const valShare   = grandTotalValue  > 0 ? ((parseFloat(seller.TotalBillAmount) / grandTotalValue) * 100).toFixed(2) : 0;
      const stateName  = getStateFromGSTN(seller.suppliergstno)?.name || '';

      printWindow.document.write(`
        <tr>
          <td><div class="rank-badge">${index + 1}</div></td>
          <td>
            <div class="supplier-name">${seller.suppliername || ''}</div>
            <div class="supplier-details">
              GSTN: ${seller.suppliergstno || ''} (${stateName}) | PAN: ${seller.CompanyPan || ''}
            </div>
          </td>
          <td align="right">
            <div class="volume-value">${formatNumber(seller.TotalNetQntl)} Q</div>
            <div class="volume-share">${volShare}% Volume Share</div>
          </td>
          <td align="right">
            <div class="invoice-count">${seller.BillCount || 0}</div>
          </td>
          <td align="right">
            <div class="valuation-value">${formatSmartCurrency(seller.TotalBillAmount)}</div>
            <div class="value-share">${valShare}% Value Share</div>
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

  // totals reflect filtered data (same pattern as SaleTopBuyers)
  const totalVolumeOverall    = filteredSellers.reduce((a, b) => a + (parseFloat(b.TotalNetQntl) || 0), 0);
  const totalValuationOverall = filteredSellers.reduce((a, b) => a + (parseFloat(b.TotalBillAmount) || 0), 0);

  useEffect(() => { fetchTopSellers(); }, []);

  return (
    <Box sx={{ p: 4, backgroundColor: '#f8fafc', minHeight: '100vh', mb: 20 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Grid item>
          <BackButton onClick={() => navigate("/Analytics")} />
        </Grid>
        <Box>
          <Typography variant="h5" fontWeight="800" sx={{ color: '#1e293b' }}>Seller Insights</Typography>
          <Typography variant="body1" sx={{ color: '#64748b' }}>Supplier Analytics</Typography>
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

            {/* ── State filter dropdown (same as SaleTopBuyers) ── */}
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
              variant="contained" disableElevation onClick={fetchTopSellers}
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
                <Typography variant="caption" color="text.secondary">Top sellers in single sheet</Typography>
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

      {/* Summary metric cards — reflect filtered data */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { label: selectedState === 'ALL' ? 'Top Sellers' : `Sellers · ${STATE_CODES[selectedState] || selectedState}`, value: filteredSellers.length, icon: <Storefront />, color: '#6366f1' },
          { label: 'Total Volume',   value: `${totalVolumeOverall.toLocaleString('en-IN')} Q`, icon: <Inventory />,         color: '#10b981' },
          { label: 'Total Turnover', value: formatSmartCurrency(totalValuationOverall),          icon: <AttachMoney />,        color: '#f59e0b' },
          { label: 'Total Invoices', value: filteredSellers.reduce((a, b) => a + (parseInt(b.BillCount) || 0), 0), icon: <AssignmentTurnedIn />, color: '#ec4899' },
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
                <TableCell sx={{ fontWeight: 700 }}>
                  <TableSortLabel active={orderBy === 'suppliername'} direction={orderBy === 'suppliername' ? order : 'asc'} onClick={() => handleRequestSort('suppliername')}>
                    SUPPLIER DETAILS
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  <TableSortLabel active={orderBy === 'TotalNetQntl'} direction={orderBy === 'TotalNetQntl' ? order : 'asc'} onClick={() => handleRequestSort('TotalNetQntl')}>
                    VOLUME (QNTL)
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  <TableSortLabel active={orderBy === 'BillCount'} direction={orderBy === 'BillCount' ? order : 'asc'} onClick={() => handleRequestSort('BillCount')}>
                    INVOICES
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  <TableSortLabel active={orderBy === 'TotalBillAmount'} direction={orderBy === 'TotalBillAmount' ? order : 'asc'} onClick={() => handleRequestSort('TotalBillAmount')}>
                    TOTAL VALUATION
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>DETAILS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6}><LinearProgress sx={{ my: 2 }} /></TableCell></TableRow>
              ) : (
                filteredSellers
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((seller, index) => {
                    const volShare  = totalVolumeOverall    > 0 ? ((parseFloat(seller.TotalNetQntl)    / totalVolumeOverall)    * 100).toFixed(2) : 0;
                    const valShare  = totalValuationOverall > 0 ? ((parseFloat(seller.TotalBillAmount) / totalValuationOverall) * 100).toFixed(2) : 0;
                    const isExpanded = expandedSellerPan === seller.CompanyPan;
                    const stateName  = getStateFromGSTN(seller.suppliergstno)?.name || '';

                    return (
                      <React.Fragment key={seller.CompanyPan}>
                        <TableRow
                          hover
                          onClick={() => toggleAccordion(seller.CompanyPan, seller.TotalNetQntl)}
                          sx={{
                            cursor: 'pointer',
                            backgroundColor: isExpanded ? '#f1f5f9' : 'inherit',
                            '&:hover': { backgroundColor: '#f1f5f9 !important' }
                          }}
                        >
                          <TableCell>
                            <Avatar sx={{ width: 30, height: 30, fontSize: '0.8rem', bgcolor: isExpanded ? '#0ea5e9' : '#6366f1' }}>
                              {page * rowsPerPage + index + 1}
                            </Avatar>
                          </TableCell>
                          <TableCell>
                            <Typography variant="subtitle2" fontWeight="800">{seller.suppliername}</Typography>
                            {/* State name shown next to GSTN — same as SaleTopBuyers */}
                            <Typography variant="caption" color="blue">
                              GSTN : {seller.suppliergstno || ''} ({stateName}) | PAN No. : {seller.CompanyPan}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="700">{formatNumber(seller.TotalNetQntl)} Q</Typography>
                            <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 700, display: 'block' }}>{volShare}% Volume Share</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Chip label={seller.BillCount} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="800" color="primary">{formatSmartCurrency(seller.TotalBillAmount)}</Typography>
                            <Typography variant="caption" sx={{ color: '#f59e0b', fontWeight: 700 }}>{valShare}% Value Share</Typography>
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
                              <Box sx={{ p: 4, bgcolor: '#fcfcfd' }}>
                                {monthLoading ? <LinearProgress /> : (
                                  <Grid container spacing={4}>
                                    <Grid item xs={12} md={7}>
                                      <Typography variant="subtitle1" fontWeight="700" mb={2}>Supply Trend</Typography>
                                      <Box height={200}>
                                        <ResponsiveContainer>
                                          <AreaChart data={monthwiseData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="month_name" />
                                            <YAxis />
                                            <Tooltip />
                                            <Area type="monotone" dataKey="total_quintal" stroke="#6366f1" fill="#6366f1" fillOpacity={0.1} />
                                          </AreaChart>
                                        </ResponsiveContainer>
                                      </Box>
                                    </Grid>
                                    <Grid item xs={12} md={5}>
                                      <Typography variant="subtitle1" fontWeight="700" mb={2}>Monthly Breakdown</Typography>
                                      {monthwiseData.map((m, idx) => (
                                        <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', p: 1, borderBottom: '1px solid #f1f5f9' }}>
                                          <Typography variant="body2">{m.month}</Typography>
                                          <Box sx={{ textAlign: 'right' }}>
                                            <Typography variant="body2" fontWeight="700">{m.total_quintal} Q</Typography>
                                            <Typography variant="caption" color="primary">{m.percentage}% of total</Typography>
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
          count={filteredSellers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        />
      </StyledCard>
    </Box>
  );
};

export default PurchaseTopSellers;