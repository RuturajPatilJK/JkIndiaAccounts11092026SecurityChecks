// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import {
//     Table,
//     TableBody,
//     TableCell,
//     TableContainer,
//     TableHead,
//     TableRow,
//     TablePagination,
//     TextField,
//     Paper,
//     Box,
//     Button,
//     Snackbar,
//     Alert,
//     TableSortLabel,
//     TableFooter
// } from "@mui/material";
// import EwayBillTokenGenerator from "./genrateToken";
// import NoDataAlert from '../../Alert/Alert';
// import { HashLoader } from 'react-spinners';
// import CircularSpinner from "../../../../Common/Spinners/CircularSpinner"
// import "../GenrateEWayBill/EWayBills.css"
// import io from 'socket.io-client';
// import SearchBar from "../../../../Common/SearchBar/SearchBar";
// import ImportButton from "../../../../Common/Buttons/Import";
// import { formatReadableAmount } from "../../../../Common/FormatFunctions/FormatAmount";

// const apikey = process.env.REACT_APP_API
// const API_URL = "https://api.mastergst.com/ewaybillapi/v1.03/ewayapi/getewaybillsbydate";
// const API_URL_GET = `${apikey}/get-eway-bills`;
// const DETAILS_API_URL = "https://api.mastergst.com/ewaybillapi/v1.03/ewayapi/getewaybill";
// const EayBill_By_Other_Party_API = "https://api.mastergst.com/ewaybillapi/v1.03/ewayapi/getewaybillsofotherparty"
// //const socketURL = 'wss://accounts-enterprises-api.ebuysugar.com';
// const socketURL = process.env.REACT_APP_API_URL;

// const HEADERS = {
//     ip_address: "",
//     client_id: process.env.REACT_APP_EWAYBILL_CLIENT_ID,
//     client_secret: process.env.REACT_APP_EWAYBILL_CLIENT_SECRET,
//     gstin: process.env.REACT_APP_EWAYBILL_GSTIN,
// };

// const tableCellStyleHeader = {
//     fontSize: '16px',
//     fontWeight: 'bold',
//     backgroundColor: '#f4f4f4',
//     whiteSpace: 'nowrap',
//     position: 'sticky',
//     top: 0,
//     zIndex: 1,
// };


// const tableCellStyle = {
//     fontSize: '16px',
//     fontWeight: 'bold',
//     whiteSpace: 'nowrap',
// };


// const EWayBills = ({ fromDate }) => {
//     const [ewayBills, setEwayBills] = useState([]);
//     const [filteredBills, setFilteredBills] = useState([]);
//     const [error, setError] = useState(null);
//     const [searchQuery, setSearchQuery] = useState("");
//     const [page, setPage] = useState(0);
//     const [rowsPerPage, setRowsPerPage] = useState(500);
//     const [isEmpty, setIsEmpty] = useState(false);
//     const [isLoading, setIsLoading] = useState(false);
//     const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

//     const [ewayBillInput, setEwayBillInput] = useState('');

//     // Snackbar state for success/failure messages
//     const [snackbarOpen, setSnackbarOpen] = useState(false);
//     const [snackbarMessage, setSnackbarMessage] = useState('');
//     const [snackbarSeverity, setSnackbarSeverity] = useState('success');

//     const isToday = new Date(fromDate).toDateString() === new Date().toDateString();

//     //Socket IO implementation
//     useEffect(() => {

// //   const isSecure = socketURL.startsWith("https");
//     const socket = io(`${socketURL}`, {
//           transports: ["websocket", "polling"],
//           withCredentials: true,
//         //   secure: isSecure,
//     });

//         socket.on('connect', () => {
//         });

//         socket.on('createdata', () => {
//             fetchAllEwayBillData();
//         });

//         socket.on('disconnect', () => {
//         });

//         return () => {
//             socket.disconnect();
//         };
//     }, []);


//     // Format the date
//     const formatDate = (date) => {
//         const d = new Date(date);
//         const day = ("0" + d.getDate()).slice(-2);
//         const month = ("0" + (d.getMonth() + 1)).slice(-2);
//         const year = d.getFullYear();
//         return `${day}/${month}/${year}`;
//     };

//     //Formated Date at the time of insert the data into the table.
//     const formatteddatesForInsert = (date) => {
//         const datePart = date.split(' ')[0];
//         const [day, month, year] = datePart.split('/');
//         return `${year}-${month}-${day}`;
//     };

//     // GET All eway bill data from the database.
//     const fetchAllEwayBillData = async () => {
//         try {
//             const response = await axios.get(API_URL_GET, {
//                 params: { ewayBillDate: fromDate },
//                 headers: HEADERS,
//             });

//             if (response.status === 200) {
//                 const data = response.data.data;
//                 setEwayBills(data);
//                 setFilteredBills(data);
//                 setIsEmpty(data.length === 0);
//             } else {
//                 setError("Failed to fetch E-Way Bills.");
//                 setIsEmpty(true);
//             }
//         } catch (err) {
//             console.error("Error fetching E-Way Bills:", err);
//             setIsEmpty(true);
//         }
//     };

//     useEffect(() => {
//         fetchAllEwayBillData()
//     }, [])

//     // Function to fetch details for each remaining E-Way Bill number
//     const fetchAllEwayBillDetails = async (ewbNos, token) => {
//         const details = [];
//         for (let ewbNo of ewbNos) {
//             const detail = await fetchEwayBillDetails(ewbNo, token);
//             if (detail) {
//                 details.push(detail);
//             }
//         }
//         return details;
//     };

//     // Function to fetch individual E-Way Bill details
//     const fetchEwayBillDetails = async (ewbNo, token) => {
//         try {
//             const response = await axios.get(DETAILS_API_URL, {
//                 params: { email: process.env.REACT_APP_EWAYBILL_EMAIL, ewbNo },
//                 headers: {
//                     ...HEADERS,
//                     Authorization: `Bearer ${token}`,
//                 },
//             });
//             return response.data.data || {};
//         } catch (error) {
//             console.error(`Error fetching details for EWB No: ${ewbNo}`, error);
//             return null;
//         }
//     };

//     // Function to send the E-Way Bill details to the backend API to store in the database
//     const createEwayBillInDatabase = async (ewayBillDetails, token) => {
//         debugger
//         console.log('ewayBillDetails', ewayBillDetails)
//         try {
//             const dataToSend = ewayBillDetails.map(bill => {
//                 let totalQuantity = 0;
//                 let totalTaxableAmount = 0;

//                 const firstItem = bill.itemList[0];

//                 bill.itemList.forEach(item => {
//                     let quantity = item.quantity;

//                     if (item.qtyUnit === "MTS") {
//                         quantity = quantity * 10;
//                     } else if (item.qtyUnit === "NOS") {
//                         quantity = quantity / 2;
//                     } else if (item.qtyUnit === "KGS") {
//                         quantity = quantity / 100;
//                     } else if (item.qtyUnit === "BAG") {
//                         quantity = quantity / 2;
//                     }

//                     totalQuantity += quantity;
//                     totalTaxableAmount += item.taxableAmount;
//                 });

//                 return {
//                     supplyType: bill.supplyType,
//                     ewbNo: bill.ewbNo,
//                     ewayBillDate: formatteddatesForInsert(bill.ewayBillDate),
//                     docNo: bill.docNo,
//                     docDate: formatteddatesForInsert(bill.docDate),
//                     fromPlace: bill.fromPlace,
//                     fromStateCode: bill.fromStateCode,
//                     fromAddr1: bill.fromAddr1,
//                     fromAddr2: bill.fromAddr2,
//                     fromGstin: bill.fromGstin,
//                     toAddr1: bill.toAddr1,
//                     toAddr2: bill.toAddr2,
//                     toPlace: bill.toPlace,
//                     toStateCode: bill.toStateCode,
//                     toGstin: bill.toGstin,
//                     vehicleNo: bill.VehiclListDetails[0]?.vehicleNo,
//                     cgstValue: bill.cgstValue,
//                     sgstValue: bill.sgstValue,
//                     igstValue: bill.igstValue,
//                     hsnCode: firstItem?.hsnCode,
//                     productId: firstItem?.productId,
//                     productName: firstItem?.productName,
//                     transporterId: bill.transporterId,
//                     actualDist: bill.actualDist,
//                     totInvValue: bill.totInvValue,
//                     quantity: totalQuantity,
//                     taxableAmount: totalTaxableAmount,
//                     validUpto: formatteddatesForInsert(bill.validUpto),
//                     toPincode: bill.toPincode
//                 };
//             });

//             const response = await axios.post(
//                 `${apikey}/create-eway-bill`,
//                 dataToSend,
//                 {
//                     headers: {
//                         'Content-Type': 'application/json',
//                     },
//                 }
//             );

//             return response;
//         } catch (error) {
//             console.error('Error creating E-Way Bill in database:', error);
//             setError('Failed to create E-Way Bills in the database.');
//             return null;
//         }
//     };


//     const fetchAndProcessEwayBills = async () => {
//         if (isLoading) return;
//         setIsLoading(true);

//         try {
//             const { generateToken } = EwayBillTokenGenerator();
//             const tokenResponse = await generateToken();

//             if (tokenResponse) {
//                 const token = tokenResponse.token;

//                 const processedEwbNumbers = ewayBillInput
//                     .replace(/\s+/g, '')
//                     .match(/\d{12}(\.00)?/g)
//                     ?.map((num) => (num.endsWith(".00") ? num.slice(0, -3) : num))
//                     .map(Number) || [];

//                 const ewbNumbers = [...new Set(processedEwbNumbers)];

//                 const removeEwayBillsResponse = await axios.post(
//                     `${apikey}/check-remove-eway-bills`,
//                     ewbNumbers,
//                     {
//                         headers: {
//                             Authorization: `Bearer ${token}`,
//                             'Content-Type': 'application/json',
//                         },
//                     }
//                 );

//                 if (removeEwayBillsResponse.status === 200) {
//                     const existingEwayBillNos = removeEwayBillsResponse.data.remainingEwayBillNos || [];

//                     if (existingEwayBillNos.length === 0) {
//                         setSnackbarMessage('All e-way bills already exist!');
//                         setSnackbarSeverity('info');
//                         setSnackbarOpen(true);
//                         setIsLoading(false);
//                         return;
//                     }

//                     setIsEmpty(existingEwayBillNos.length === 0);

//                     const allDetails = await fetchAllEwayBillDetails(existingEwayBillNos, token);

//                     if (allDetails.length === 0) {
//                         setSnackbarMessage('No details fetched for the given e-way bills.');
//                         setSnackbarSeverity('info');
//                         setSnackbarOpen(true);
//                         setIsLoading(false);
//                         return;
//                     }

//                     const createEwayBillResponse = await createEwayBillInDatabase(allDetails);

//                     if (createEwayBillResponse.status === 201 && allDetails.length > 0) {
//                         setSnackbarMessage('E-Way Bills generated successfully!');
//                         setSnackbarSeverity('success');
//                     } else if (allDetails.length === 0) {
//                         setSnackbarMessage('No new E-Way Bills were created.');
//                         setSnackbarSeverity('info');
//                     } else {
//                         setSnackbarMessage('Failed to store E-Way Bills.');
//                         setSnackbarSeverity('error');
//                     }
//                 } else {
//                     setSnackbarMessage("Failed to check E-Way Bills in the database.");
//                     setSnackbarSeverity('error');
//                 }
//             } else {
//                 setSnackbarMessage("No valid E-Way Bill numbers found.");
//                 setSnackbarSeverity('error');
//             }
//         } catch (err) {
//             console.error("Error:", err);
//             setSnackbarMessage("Error occurred while generating the token or fetching data.");
//             setSnackbarSeverity('error');
//         } finally {
//             setIsLoading(false);
//             setSnackbarOpen(true);
//         }
//     };


//     //GET all Eway bill numbers from the Eway bill API to get the detail information of the individual eway bill data
//     const fetchEwayBills = async () => {
//         if (isLoading) return;
//         setIsLoading(true);
//         debugger

//         try {
//             const { generateToken } = EwayBillTokenGenerator();
//             const tokenResponse = await generateToken();

//             if (tokenResponse) {
//                 const formattedDate = formatDate(fromDate);

//                 // First API call to fetch E-Way Bills
//                 const response = await axios.get(EayBill_By_Other_Party_API, {
//                     params: { email: process.env.REACT_APP_EWAYBILL_EMAIL, date: formattedDate },
//                     headers: {
//                         ...HEADERS,
//                         Authorization: `Bearer ${tokenResponse.token}`,
//                     },
//                 });

//                 if (response.status === 200) {

//                     const ewbNumbers = response.data.data.map((bill) => bill.ewbNo);


//                     // Now make a POST request to check and remove E-Way Bills
//                     const removeEwayBillsResponse = await axios.post(
//                         `${apikey}/check-remove-eway-bills`,
//                         ewbNumbers,
//                         {
//                             headers: {
//                                 Authorization: `Bearer ${tokenResponse.token}`,
//                                 'Content-Type': 'application/json',
//                             },
//                         }
//                     );

//                     if (removeEwayBillsResponse.status === 200) {
//                         // Set the remaining E-Way Bills into state
//                         const remainingEwayBillNos = removeEwayBillsResponse.data.remainingEwayBillNos;
//                         setIsEmpty(remainingEwayBillNos.length === 0);

//                         // Now call the fetchEwayBillDetails for each remaining EWB No
//                         const allDetails = await fetchAllEwayBillDetails(remainingEwayBillNos, tokenResponse.token);

//                         const createEwayBillResponse = await createEwayBillInDatabase(allDetails);

//                         if (createEwayBillResponse.status === 201) {
//                             setSnackbarMessage('E-Way Bills Genrate successfully!');
//                             setSnackbarSeverity('success');
//                         } else {
//                             setSnackbarMessage('Failed to store E-Way Bills.');
//                             setSnackbarSeverity('error');
//                         }

//                     } else {
//                         setSnackbarMessage("Failed to process E-Way Bills.");
//                         setSnackbarSeverity('error');
//                     }
//                 } else {
//                     setSnackbarMessage("Failed to fetch E-Way Bills.");
//                     setSnackbarSeverity('error');
//                 }
//             }
//         } catch (err) {
//             setSnackbarMessage("Error occurred while generating the token or fetching data.");
//             setSnackbarSeverity('error');
//         }

//         setIsLoading(false);
//         setSnackbarOpen(true);
//     };


//     const handleOnSubmit = () => {
//         if (isToday) {
//             fetchAndProcessEwayBills();
//         } else {
//             fetchEwayBills();
//         }
//     }


//     const handleSort = (key) => {
//         let direction = 'asc';
//         if (sortConfig.key === key && sortConfig.direction === 'asc') {
//             direction = 'desc';
//         }
//         setSortConfig({ key, direction });

//         const sortedData = [...filteredBills].sort((a, b) => {
//             if (key === 'validUpto' && a[key] && b[key]) {
//                 const dateA = new Date(a[key].split('/').reverse().join('-'));
//                 const dateB = new Date(b[key].split('/').reverse().join('-'));
//                 return direction === 'asc' ? dateA - dateB : dateB - dateA;
//             } else if (key === 'validUpto') {
//                 if (!a[key]) return direction === 'asc' ? 1 : -1;
//                 if (!b[key]) return direction === 'asc' ? -1 : 1;
//             }

//             // Fallback to normal sorting for other fields and handle nulls
//             if (!a[key] || !b[key]) {
//                 return (!a[key] && !b[key]) ? 0 : (!a[key] ? 1 : -1);
//             }
//             if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
//             if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
//             return 0;
//         });
//         setFilteredBills(sortedData);
//     };


//     // Close the Snackbar
//     const handleCloseSnackbar = () => {
//         setSnackbarOpen(false);
//     };

//     //Search Records
//     useEffect(() => {
//         const lowerCaseQuery = searchQuery.toLowerCase();
//         const filtered = ewayBills.filter((row) =>
//             Object.values(row).some((value) =>
//                 String(value).toLowerCase().includes(lowerCaseQuery)
//             )
//         );
//         setFilteredBills(filtered);
//     }, [searchQuery, ewayBills]);

//     const totals = filteredBills.reduce((acc, row) => {
//         acc.taxableAmount += parseFloat(row.taxableAmount || 0);
//         acc.cgstValue += parseFloat(row.cgstValue || 0);
//         acc.sgstValue += parseFloat(row.sgstValue || 0);
//         acc.igstValue += parseFloat(row.igstValue || 0);
//         return acc;
//     }, { taxableAmount: 0, cgstValue: 0, sgstValue: 0, igstValue: 0 });

//     const handleChangePage = (event, newPage) => {
//         setPage(newPage);
//     };

//     const handleChangeRowsPerPage = (event) => {
//         setRowsPerPage(parseInt(event.target.value, 10));
//         setPage(0);
//     };

//     return (
//         <Paper>
//             {error && <p style={{ color: "red" }}>{error}</p>}
//             <Box sx={{ padding: 1, display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
//                 {isToday && (
//                     <TextField
//                         label="Please Enter E-Way Bill numbers.."
//                         value={ewayBillInput}
//                         autoComplete="off"
//                         onChange={(e) => setEwayBillInput(e.target.value)}
//                         sx={{ flexGrow: 1, marginRight: 2, width: { xs: '100%', sm: '40%', md: '30%' } }}
//                         size="small"
//                     />
//                 )}

//                 <ImportButton
//                     onClick={handleOnSubmit}
//                     isLoading={isLoading}
//                     disabled={isToday ? isLoading || !ewayBillInput : false}
//                     buttonText={"Import Portal data"}
//                     sx={{ marginRight: 2 }}
//                 />

//                 <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'flex-end' }}>
//                     <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
//                 </Box>
//             </Box>

//             {isLoading && (
//                 <div className="loading-overlay">
//                     <div className="spinner-container">
//                         <CircularSpinner color="#007bff" loading={isLoading} size={80} />
//                     </div>
//                 </div>
//             )}

//             <Snackbar
//                 open={snackbarOpen}
//                 autoHideDuration={2000}
//                 onClose={handleCloseSnackbar}
//                 anchorOrigin={{
//                     vertical: 'top',
//                     horizontal: 'center',
//                 }}
//                 sx={{
//                     width: '100%',
//                     textAlign: 'right'
//                 }}
//             >
//                 <Alert
//                     onClose={handleCloseSnackbar}
//                     severity="success"
//                     variant="filled"
//                     sx={{ width: '30%', height: "5vh" }}
//                 >
//                     {snackbarMessage}
//                 </Alert>
//             </Snackbar>


//             {isLoading ? (
//                 <Box display="flex" justifyContent="center" alignItems="center" height="600px">
//                     <CircularSpinner />
//                 </Box>
//             ) : isEmpty ? (
//                 <NoDataAlert />
//             ) : (
//                 <>
//                     <TableContainer style={{
//                         maxWidth: '98%',
//                         margin: '0 auto',
//                         height: "75vh"
//                     }}>
//                         <Table>
//                             <TableHead>
//                                 <TableRow>
//                                     <TableCell style={tableCellStyleHeader}>EWB No</TableCell>
//                                     <TableCell style={tableCellStyleHeader}>Supply Type</TableCell>
//                                     <TableCell style={tableCellStyleHeader}>EwayBill Date</TableCell>
//                                     <TableCell style={tableCellStyleHeader}>
//                                         <TableSortLabel
//                                             active={sortConfig.key === 'validUpto'}
//                                             direction={sortConfig.key === 'validUpto' ? sortConfig.direction : 'asc'}
//                                             onClick={() => handleSort('validUpto')}
//                                         >
//                                             EWayBill Valid Till
//                                         </TableSortLabel>
//                                     </TableCell>
//                                     <TableCell style={tableCellStyleHeader}>Doc No</TableCell>
//                                     <TableCell style={tableCellStyleHeader}>Doc Date</TableCell>
//                                     <TableCell style={tableCellStyleHeader}>From Place</TableCell>
//                                     <TableCell style={tableCellStyleHeader}>FromState Code</TableCell>
//                                     <TableCell style={tableCellStyleHeader}>FromAddr1</TableCell>
//                                     <TableCell style={tableCellStyleHeader}>FromAddr2</TableCell>
//                                     <TableCell style={tableCellStyleHeader}>From Pincode</TableCell>
//                                     <TableCell style={tableCellStyleHeader}>Bill To Place</TableCell>
//                                     <TableCell style={tableCellStyleHeader}>ToState Code</TableCell>
//                                     <TableCell style={tableCellStyleHeader}>To GSTIN</TableCell>
//                                     <TableCell style={tableCellStyleHeader}>ToAddr1</TableCell>
//                                     <TableCell style={tableCellStyleHeader}>ToAddr2</TableCell>
//                                     <TableCell style={tableCellStyleHeader}>Bill To Pin-Code</TableCell>
//                                     <TableCell style={tableCellStyleHeader}>Ship To Place</TableCell>
//                                     <TableCell style={tableCellStyleHeader}>Ship To Pin-Code</TableCell>
//                                     <TableCell style={tableCellStyleHeader}>Vehicle No</TableCell>
//                                     <TableCell style={tableCellStyleHeader}>Taxable Amount</TableCell>
//                                     <TableCell style={tableCellStyleHeader}>CGST Value</TableCell>
//                                     <TableCell style={tableCellStyleHeader}>SGST Value</TableCell>
//                                     <TableCell style={tableCellStyleHeader}>IGST Value</TableCell>
//                                     <TableCell style={tableCellStyleHeader}>Product</TableCell>
//                                     <TableCell style={tableCellStyleHeader}>HSN</TableCell>
//                                     <TableCell style={tableCellStyleHeader}>Transporter Id</TableCell>
//                                     <TableCell style={tableCellStyleHeader}>Actual Dist</TableCell>
//                                     <TableCell style={tableCellStyleHeader}>Quantity</TableCell>
//                                 </TableRow>
//                             </TableHead>
//                             <TableBody>
//                                 {filteredBills
//                                     .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
//                                     .map((bill, index) => (
//                                         bill ? (
//                                             <TableRow key={index} sx={{
//                                                 cursor: "pointer",
//                                                 transition: "background-color 0.3s ease, box-shadow 0.2s ease",
//                                                 '&:hover': {
//                                                     backgroundColor: '#f3f388',
//                                                     boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
//                                                 },
//                                             }}>
//                                                 <TableCell style={tableCellStyle}>{bill.ewbNo}</TableCell>
//                                                 <TableCell style={tableCellStyle}>{bill.supplyType}</TableCell>
//                                                 <TableCell style={tableCellStyle}>{bill.ewayBillDate}</TableCell>
//                                                 <TableCell style={tableCellStyle}>{bill.validUpto}</TableCell>
//                                                 <TableCell style={tableCellStyle}>{bill.docNo}</TableCell>
//                                                 <TableCell style={tableCellStyle}>{bill.docDate}</TableCell>
//                                                 <TableCell style={tableCellStyle}>{bill.fromPlace}</TableCell>
//                                                 <TableCell style={tableCellStyle}>{bill.fromStateCode}</TableCell>
//                                                 <TableCell style={tableCellStyle}>{bill.fromAddr1}</TableCell>
//                                                 <TableCell style={tableCellStyle}>{bill.fromAddr2}</TableCell>
//                                                 <TableCell style={tableCellStyle}>{bill.fromPincode}</TableCell>
//                                                 <TableCell style={tableCellStyle}>{bill.toPlace}</TableCell>
//                                                 <TableCell style={tableCellStyle}>{bill.toStateCode}</TableCell>
//                                                 <TableCell style={tableCellStyle}>{bill.toGstin}</TableCell>
//                                                 <TableCell style={tableCellStyle}>{bill.toAddr1}</TableCell>
//                                                 <TableCell style={tableCellStyle}>{bill.toAddr2}</TableCell>
//                                                 <TableCell style={tableCellStyle}>{bill.toPincode}</TableCell>
//                                                 <TableCell style={tableCellStyle}>{bill.toPlace}</TableCell>
//                                                 <TableCell style={tableCellStyle}>{bill.toPincode}</TableCell>
//                                                 <TableCell style={tableCellStyle}>{bill.vehicleNo}</TableCell>
//                                                 <TableCell style={tableCellStyle}>{formatReadableAmount(bill.taxableAmount)}</TableCell>
//                                                 <TableCell style={tableCellStyle}>{formatReadableAmount(bill.cgstValue)}</TableCell>
//                                                 <TableCell style={tableCellStyle}>{formatReadableAmount(bill.sgstValue)}</TableCell>
//                                                 <TableCell style={tableCellStyle}>{formatReadableAmount(bill.igstValue)}</TableCell>
//                                                 <TableCell style={tableCellStyle}>{bill.productName}</TableCell>
//                                                 <TableCell style={tableCellStyle}>{bill.hsnCode}</TableCell>
//                                                 <TableCell style={tableCellStyle}>{bill.transporterId}</TableCell>
//                                                 <TableCell style={tableCellStyle}>{bill.actualDist}</TableCell>
//                                                 <TableCell style={tableCellStyle}>{bill.quantity}</TableCell>
//                                             </TableRow>
//                                         ) : null
//                                     ))}
//                             </TableBody>
//                             <TableFooter>
//                                 <TableRow>
//                                     <TableCell colSpan={20} style={{ textAlign: 'right', fontWeight: 'bold' }}>Total</TableCell>
//                                     <TableCell style={tableCellStyle}>{totals.taxableAmount.toFixed(2)}</TableCell>
//                                     <TableCell style={tableCellStyle}>{totals.cgstValue.toFixed(2)}</TableCell>
//                                     <TableCell style={tableCellStyle}>{totals.sgstValue.toFixed(2)}</TableCell>
//                                     <TableCell style={tableCellStyle}>{totals.igstValue.toFixed(2)}</TableCell>
//                                 </TableRow>
//                             </TableFooter>
//                         </Table>
//                     </TableContainer>

//                     <TablePagination
//                         component="div"
//                         count={filteredBills.length}
//                         page={page}
//                         onPageChange={handleChangePage}
//                         rowsPerPage={rowsPerPage}
//                         onRowsPerPageChange={handleChangeRowsPerPage}
//                         rowsPerPageOptions={[15, 50, 100]}
//                     />
//                 </>
//             )}
//         </Paper>
//     );
// };

// export default EWayBills;










































import React, { useEffect, useState } from "react";
import axios from "axios";
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    TextField,
    Paper,
    Box,
    Button,
    Snackbar,
    Alert,
    TableSortLabel,
    TableFooter
} from "@mui/material";
import EwayBillTokenGenerator from "./genrateToken";
import NoDataAlert from '../../Alert/Alert';
import { HashLoader } from 'react-spinners';
import CircularSpinner from "../../../../Common/Spinners/CircularSpinner"
import "../GenrateEWayBill/EWayBills.css"
import io from 'socket.io-client';
import SearchBar from "../../../../Common/SearchBar/SearchBar";
import ImportButton from "../../../../Common/Buttons/Import";
import { formatReadableAmount } from "../../../../Common/FormatFunctions/FormatAmount";

const apikey = process.env.REACT_APP_API
// const API_URL = "https://api.mastergst.com/ewaybillapi/v1.03/ewayapi/getewaybillsbydate";
// const API_URL_GET = `${apikey}/get-eway-bills`;
// const DETAILS_API_URL = "https://api.mastergst.com/ewaybillapi/v1.03/ewayapi/getewaybill";
// const EayBill_By_Other_Party_API = "https://api.mastergst.com/ewaybillapi/v1.03/ewayapi/getewaybillsofotherparty"


const API_URL = `${apikey}/whitebooks-get-ewaybills-by-date`;
const API_URL_GET = `${apikey}/get-eway-bills`;
const DETAILS_API_URL = `${apikey}/whitebooks-get-ewaybill`;
const EayBill_By_Other_Party_API = `${apikey}/whitebooks-get-ewaybills-of-other-party`;


//const socketURL = 'wss://accounts-enterprises-api.ebuysugar.com';
const socketURL = process.env.REACT_APP_API_URL;

const HEADERS = {};

const tableCellStyleHeader = {
    fontSize: '16px',
    fontWeight: 'bold',
    backgroundColor: '#f4f4f4',
    whiteSpace: 'nowrap',
    position: 'sticky',
    top: 0,
    zIndex: 1,
};


const tableCellStyle = {
    fontSize: '16px',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
};


const EWayBills = ({ fromDate }) => {
    const [ewayBills, setEwayBills] = useState([]);
    const [filteredBills, setFilteredBills] = useState([]);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(500);
    const [isEmpty, setIsEmpty] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    const [ewayBillInput, setEwayBillInput] = useState('');

    // Snackbar state for success/failure messages
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');

    const isToday = new Date(fromDate).toDateString() === new Date().toDateString();

    //Socket IO implementation
    useEffect(() => {

//   const isSecure = socketURL.startsWith("https");
    const socket = io(`${socketURL}`, {
          transports: ["websocket", "polling"],
          withCredentials: true,
        //   secure: isSecure,
    });

        socket.on('connect', () => {
        });

        socket.on('createdata', () => {
            fetchAllEwayBillData();
        });

        socket.on('disconnect', () => {
        });

        return () => {
            socket.disconnect();
        };
    }, []);


    // Format the date
    const formatDate = (date) => {
        const d = new Date(date);
        const day = ("0" + d.getDate()).slice(-2);
        const month = ("0" + (d.getMonth() + 1)).slice(-2);
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    };

    //Formated Date at the time of insert the data into the table.
    const formatteddatesForInsert = (date) => {
        const datePart = date.split(' ')[0];
        const [day, month, year] = datePart.split('/');
        return `${year}-${month}-${day}`;
    };

    // ewayBillDate comes from the GSP API as "DD/MM/YYYY hh:mm:ss AM/PM"
    // (12-hour). ewayBillDate is now a DATETIME column, so this keeps the
    // time instead of dropping it like formatteddatesForInsert does.
    const formatDateTimeForInsert = (dateTimeStr) => {
        if (!dateTimeStr) return null;
        const [datePart, timePart, meridiem] = dateTimeStr.split(' ');
        const [day, month, year] = datePart.split('/');
        let [hours, minutes, seconds] = (timePart || '00:00:00').split(':').map(Number);

        if (meridiem) {
            const upperMeridiem = meridiem.toUpperCase();
            if (upperMeridiem === 'PM' && hours !== 12) hours += 12;
            if (upperMeridiem === 'AM' && hours === 12) hours = 0;
        }

        const pad = (n) => String(n).padStart(2, '0');
        return `${year}-${pad(month)}-${pad(day)}T${pad(hours)}:${pad(minutes)}:${pad(seconds || 0)}`;
    };

    // GET All eway bill data from the database.
    const fetchAllEwayBillData = async () => {
        try {
            const response = await axios.get(API_URL_GET, {
                params: { ewayBillDate: fromDate },
                headers: HEADERS,
            });

            if (response.status === 200) {
                const data = response.data.data;
                setEwayBills(data);
                setFilteredBills(data);
                setIsEmpty(data.length === 0);
            } else {
                setError("Failed to fetch E-Way Bills.");
                setIsEmpty(true);
            }
        } catch (err) {
            console.error("Error fetching E-Way Bills:", err);
            setIsEmpty(true);
        }
    };

    useEffect(() => {
        fetchAllEwayBillData()
    }, [])

    // Function to fetch details for each remaining E-Way Bill number
    const fetchAllEwayBillDetails = async (ewbNos, token) => {
        const details = [];
        for (let ewbNo of ewbNos) {
            const detail = await fetchEwayBillDetails(ewbNo, token);
            if (detail) {
                details.push(detail);
            }
        }
        return details;
    };

    // Function to fetch individual E-Way Bill details
    const fetchEwayBillDetails = async (ewbNo, token) => {
        try {
            const response = await axios.get(DETAILS_API_URL, {
                params: { ewbNo },
            });
            return response.data.data || {};
        } catch (error) {
            console.error(`Error fetching details for EWB No: ${ewbNo}`, error);
            return null;
        }
    };

    // Function to send the E-Way Bill details to the backend API to store in the database
    const createEwayBillInDatabase = async (ewayBillDetails, token) => {
        
        console.log('ewayBillDetails', ewayBillDetails)
        try {
            const dataToSend = ewayBillDetails.map(bill => {
                let totalQuantity = 0;
                let totalTaxableAmount = 0;

                const firstItem = bill.itemList[0];

                bill.itemList.forEach(item => {
                    let quantity = item.quantity;

                    if (item.qtyUnit === "MTS") {
                        quantity = quantity * 10;
                    } else if (item.qtyUnit === "NOS") {
                        quantity = quantity / 2;
                    } else if (item.qtyUnit === "KGS") {
                        quantity = quantity / 100;
                    } else if (item.qtyUnit === "BAG") {
                        quantity = quantity / 2;
                    }

                    totalQuantity += quantity;
                    totalTaxableAmount += item.taxableAmount;
                });

                return {
                    supplyType: bill.supplyType,
                    ewbNo: bill.ewbNo,
                    ewayBillDate: formatDateTimeForInsert(bill.ewayBillDate),
                    docNo: bill.docNo,
                    docDate: formatteddatesForInsert(bill.docDate),
                    fromPlace: bill.fromPlace,
                    fromStateCode: bill.fromStateCode,
                    fromAddr1: bill.fromAddr1,
                    fromAddr2: bill.fromAddr2,
                    fromGstin: bill.fromGstin,
                    toAddr1: bill.toAddr1,
                    toAddr2: bill.toAddr2,
                    toPlace: bill.toPlace,
                    toStateCode: bill.toStateCode,
                    toGstin: bill.toGstin,
                    vehicleNo: bill.VehiclListDetails[0]?.vehicleNo ? bill.VehiclListDetails[0]?.vehicleNo : "MH09aa1234"  ,
                    cgstValue: bill.cgstValue,
                    sgstValue: bill.sgstValue,
                    igstValue: bill.igstValue,
                    hsnCode: firstItem?.hsnCode,
                    productId: firstItem?.productId,
                    productName: firstItem?.productName,
                    transporterId: bill.transporterId,
                    actualDist: bill.actualDist,
                    totInvValue: bill.totInvValue,
                    quantity: totalQuantity,
                    taxableAmount: totalTaxableAmount,
                    validUpto: bill.validUpto ? formatteddatesForInsert(bill.validUpto) : "2025-01-01",
                    toPincode: bill.toPincode
                };
            });

            const response = await axios.post(
                `${apikey}/create-eway-bill`,
                dataToSend,
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            return response;
        } catch (error) {
            console.error('Error creating E-Way Bill in database:', error);
            setError('Failed to create E-Way Bills in the database.');
            return null;
        }
    };


    const fetchAndProcessEwayBills = async () => {
        if (isLoading) return;
        setIsLoading(true);

        try {
            const { generateToken } = EwayBillTokenGenerator();
            const tokenResponse = await generateToken();

            if (tokenResponse) {
                const token = tokenResponse.token;

                const processedEwbNumbers = ewayBillInput
                    .replace(/\s+/g, '')
                    .match(/\d{12}(\.00)?/g)
                    ?.map((num) => (num.endsWith(".00") ? num.slice(0, -3) : num))
                    .map(Number) || [];

                const ewbNumbers = [...new Set(processedEwbNumbers)];

                const removeEwayBillsResponse = await axios.post(
                    `${apikey}/check-remove-eway-bills`,
                    ewbNumbers,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );

                if (removeEwayBillsResponse.status === 200) {
                    const existingEwayBillNos = removeEwayBillsResponse.data.remainingEwayBillNos || [];

                    if (existingEwayBillNos.length === 0) {
                        setSnackbarMessage('All e-way bills already exist!');
                        setSnackbarSeverity('info');
                        setSnackbarOpen(true);
                        setIsLoading(false);
                        return;
                    }

                    setIsEmpty(existingEwayBillNos.length === 0);

                    const allDetails = await fetchAllEwayBillDetails(existingEwayBillNos, token);

                    if (allDetails.length === 0) {
                        setSnackbarMessage('No details fetched for the given e-way bills.');
                        setSnackbarSeverity('info');
                        setSnackbarOpen(true);
                        setIsLoading(false);
                        return;
                    }

                    const createEwayBillResponse = await createEwayBillInDatabase(allDetails);

                    if (createEwayBillResponse.status === 201 && allDetails.length > 0) {
                        setSnackbarMessage('E-Way Bills generated successfully!');
                        setSnackbarSeverity('success');
                    } else if (allDetails.length === 0) {
                        setSnackbarMessage('No new E-Way Bills were created.');
                        setSnackbarSeverity('info');
                    } else {
                        setSnackbarMessage('Failed to store E-Way Bills.');
                        setSnackbarSeverity('error');
                    }
                } else {
                    setSnackbarMessage("Failed to check E-Way Bills in the database.");
                    setSnackbarSeverity('error');
                }
            } else {
                setSnackbarMessage("No valid E-Way Bill numbers found.");
                setSnackbarSeverity('error');
            }
        } catch (err) {
            console.error("Error:", err);
            setSnackbarMessage("Error occurred while generating the token or fetching data.");
            setSnackbarSeverity('error');
        } finally {
            setIsLoading(false);
            setSnackbarOpen(true);
        }
    };


    //GET all Eway bill numbers from the Eway bill API to get the detail information of the individual eway bill data
    const fetchEwayBills = async () => {
        if (isLoading) return;
        setIsLoading(true);
        

        try {
            const { generateToken } = EwayBillTokenGenerator();
            const tokenResponse = await generateToken();

            if (tokenResponse) {
                const formattedDate = formatDate(fromDate);

                // First API call to fetch E-Way Bills
                const response = await axios.get(EayBill_By_Other_Party_API, {
                    params: { date: formattedDate },
                });

                if (response.status === 200) {

                    const ewbNumbers = response.data.data.map((bill) => bill.ewbNo);


                    // Now make a POST request to check and remove E-Way Bills
                    const removeEwayBillsResponse = await axios.post(
                        `${apikey}/check-remove-eway-bills`,
                        ewbNumbers,
                        {
                            headers: {
                                Authorization: `Bearer ${tokenResponse.token}`,
                                'Content-Type': 'application/json',
                            },
                        }
                    );

                    if (removeEwayBillsResponse.status === 200) {
                        // Set the remaining E-Way Bills into state
                        const remainingEwayBillNos = removeEwayBillsResponse.data.remainingEwayBillNos;
                        setIsEmpty(remainingEwayBillNos.length === 0);

                        // Now call the fetchEwayBillDetails for each remaining EWB No
                        const allDetails = await fetchAllEwayBillDetails(remainingEwayBillNos, tokenResponse.token);

                        const createEwayBillResponse = await createEwayBillInDatabase(allDetails);

                        if (createEwayBillResponse.status === 201) {
                            setSnackbarMessage('E-Way Bills Genrate successfully!');
                            setSnackbarSeverity('success');
                        } else {
                            setSnackbarMessage('Failed to store E-Way Bills.');
                            setSnackbarSeverity('error');
                        }

                    } else {
                        setSnackbarMessage("Failed to process E-Way Bills.");
                        setSnackbarSeverity('error');
                    }
                } else {
                    setSnackbarMessage("Failed to fetch E-Way Bills.");
                    setSnackbarSeverity('error');
                }
            }
        } catch (err) {
            setSnackbarMessage("Error occurred while generating the token or fetching data.");
            setSnackbarSeverity('error');
        }

        setIsLoading(false);
        setSnackbarOpen(true);
    };


    const handleOnSubmit = () => {
        if (isToday) {
            fetchAndProcessEwayBills();
        } else {
            fetchEwayBills();
        }
    }


    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });

        const sortedData = [...filteredBills].sort((a, b) => {
            if (key === 'validUpto' && a[key] && b[key]) {
                const dateA = new Date(a[key].split('/').reverse().join('-'));
                const dateB = new Date(b[key].split('/').reverse().join('-'));
                return direction === 'asc' ? dateA - dateB : dateB - dateA;
            } else if (key === 'validUpto') {
                if (!a[key]) return direction === 'asc' ? 1 : -1;
                if (!b[key]) return direction === 'asc' ? -1 : 1;
            }

            // Fallback to normal sorting for other fields and handle nulls
            if (!a[key] || !b[key]) {
                return (!a[key] && !b[key]) ? 0 : (!a[key] ? 1 : -1);
            }
            if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
            if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
            return 0;
        });
        setFilteredBills(sortedData);
    };


    // Close the Snackbar
    const handleCloseSnackbar = () => {
        setSnackbarOpen(false);
    };

    //Search Records
    useEffect(() => {
        const lowerCaseQuery = searchQuery.toLowerCase();
        const filtered = ewayBills.filter((row) =>
            Object.values(row).some((value) =>
                String(value).toLowerCase().includes(lowerCaseQuery)
            )
        );
        setFilteredBills(filtered);
    }, [searchQuery, ewayBills]);

    const totals = filteredBills.reduce((acc, row) => {
        acc.taxableAmount += parseFloat(row.taxableAmount || 0);
        acc.cgstValue += parseFloat(row.cgstValue || 0);
        acc.sgstValue += parseFloat(row.sgstValue || 0);
        acc.igstValue += parseFloat(row.igstValue || 0);
        return acc;
    }, { taxableAmount: 0, cgstValue: 0, sgstValue: 0, igstValue: 0 });

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    return (
        <Paper>
            {error && <p style={{ color: "red" }}>{error}</p>}
            <Box sx={{ padding: 1, display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                {isToday && (
                    <TextField
                        label="Please Enter E-Way Bill numbers.."
                        value={ewayBillInput}
                        autoComplete="off"
                        onChange={(e) => setEwayBillInput(e.target.value)}
                        sx={{ flexGrow: 1, marginRight: 2, width: { xs: '100%', sm: '40%', md: '30%' } }}
                        size="small"
                    />
                )}

                <ImportButton
                    onClick={handleOnSubmit}
                    isLoading={isLoading}
                    // disabled={isToday ? isLoading || !ewayBillInput : false}
                    buttonText={"Import Portal data"}
                    sx={{ marginRight: 2 }}
                />

                <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'flex-end' }}>
                    <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
                </Box>
            </Box>

            {isLoading && (
                <div className="loading-overlay">
                    <div className="spinner-container">
                        <CircularSpinner color="#007bff" loading={isLoading} size={80} />
                    </div>
                </div>
            )}

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={2000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                }}
                sx={{
                    width: '100%',
                    textAlign: 'right'
                }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity="success"
                    variant="filled"
                    sx={{ width: '30%', height: "5vh" }}
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>


            {isLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" height="600px">
                    <CircularSpinner />
                </Box>
            ) : isEmpty ? (
                <NoDataAlert />
            ) : (
                <>
                    <TableContainer style={{
                        maxWidth: '98%',
                        margin: '0 auto',
                        height: "75vh"
                    }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell style={tableCellStyleHeader}>EWB No</TableCell>
                                    <TableCell style={tableCellStyleHeader}>Supply Type</TableCell>
                                    <TableCell style={tableCellStyleHeader}>EwayBill Date</TableCell>
                                    <TableCell style={tableCellStyleHeader}>EWB Date Update</TableCell>
                                    <TableCell style={tableCellStyleHeader}>
                                        <TableSortLabel
                                            active={sortConfig.key === 'validUpto'}
                                            direction={sortConfig.key === 'validUpto' ? sortConfig.direction : 'asc'}
                                            onClick={() => handleSort('validUpto')}
                                        >
                                            EWayBill Valid Till
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell style={tableCellStyleHeader}>Doc No</TableCell>
                                    <TableCell style={tableCellStyleHeader}>Doc Date</TableCell>
                                    <TableCell style={tableCellStyleHeader}>From Place</TableCell>
                                    <TableCell style={tableCellStyleHeader}>FromState Code</TableCell>
                                    <TableCell style={tableCellStyleHeader}>FromAddr1</TableCell>
                                    <TableCell style={tableCellStyleHeader}>FromAddr2</TableCell>
                                    <TableCell style={tableCellStyleHeader}>From Pincode</TableCell>
                                    <TableCell style={tableCellStyleHeader}>Bill To Place</TableCell>
                                    <TableCell style={tableCellStyleHeader}>ToState Code</TableCell>
                                    <TableCell style={tableCellStyleHeader}>To GSTIN</TableCell>
                                    <TableCell style={tableCellStyleHeader}>ToAddr1</TableCell>
                                    <TableCell style={tableCellStyleHeader}>ToAddr2</TableCell>
                                    <TableCell style={tableCellStyleHeader}>Bill To Pin-Code</TableCell>
                                    <TableCell style={tableCellStyleHeader}>Ship To Place</TableCell>
                                    <TableCell style={tableCellStyleHeader}>Ship To Pin-Code</TableCell>
                                    <TableCell style={tableCellStyleHeader}>Vehicle No</TableCell>
                                    <TableCell style={tableCellStyleHeader}>Taxable Amount</TableCell>
                                    <TableCell style={tableCellStyleHeader}>CGST Value</TableCell>
                                    <TableCell style={tableCellStyleHeader}>SGST Value</TableCell>
                                    <TableCell style={tableCellStyleHeader}>IGST Value</TableCell>
                                    <TableCell style={tableCellStyleHeader}>Product</TableCell>
                                    <TableCell style={tableCellStyleHeader}>HSN</TableCell>
                                    <TableCell style={tableCellStyleHeader}>Transporter Id</TableCell>
                                    <TableCell style={tableCellStyleHeader}>Actual Dist</TableCell>
                                    <TableCell style={tableCellStyleHeader}>Quantity</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredBills
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map((bill, index) => (
                                        bill ? (
                                            <TableRow key={index} sx={{
                                                cursor: "pointer",
                                                transition: "background-color 0.3s ease, box-shadow 0.2s ease",
                                                '&:hover': {
                                                    backgroundColor: '#f3f388',
                                                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                                                },
                                            }}>
                                                <TableCell style={tableCellStyle}>{bill.ewbNo}</TableCell>
                                                <TableCell style={tableCellStyle}>{bill.supplyType}</TableCell>
                                                <TableCell style={tableCellStyle}>{bill.ewayBillDate}</TableCell>
                                                <TableCell style={tableCellStyle}>{bill.ewbdateupdate}</TableCell>
                                                <TableCell style={tableCellStyle}>{bill.validUpto}</TableCell>
                                                <TableCell style={tableCellStyle}>{bill.docNo}</TableCell>
                                                <TableCell style={tableCellStyle}>{bill.docDate}</TableCell>
                                                <TableCell style={tableCellStyle}>{bill.fromPlace}</TableCell>
                                                <TableCell style={tableCellStyle}>{bill.fromStateCode}</TableCell>
                                                <TableCell style={tableCellStyle}>{bill.fromAddr1}</TableCell>
                                                <TableCell style={tableCellStyle}>{bill.fromAddr2}</TableCell>
                                                <TableCell style={tableCellStyle}>{bill.fromPincode}</TableCell>
                                                <TableCell style={tableCellStyle}>{bill.toPlace}</TableCell>
                                                <TableCell style={tableCellStyle}>{bill.toStateCode}</TableCell>
                                                <TableCell style={tableCellStyle}>{bill.toGstin}</TableCell>
                                                <TableCell style={tableCellStyle}>{bill.toAddr1}</TableCell>
                                                <TableCell style={tableCellStyle}>{bill.toAddr2}</TableCell>
                                                <TableCell style={tableCellStyle}>{bill.toPincode}</TableCell>
                                                <TableCell style={tableCellStyle}>{bill.toPlace}</TableCell>
                                                <TableCell style={tableCellStyle}>{bill.toPincode}</TableCell>
                                                <TableCell style={tableCellStyle}>{bill.vehicleNo}</TableCell>
                                                <TableCell style={tableCellStyle}>{formatReadableAmount(bill.taxableAmount)}</TableCell>
                                                <TableCell style={tableCellStyle}>{formatReadableAmount(bill.cgstValue)}</TableCell>
                                                <TableCell style={tableCellStyle}>{formatReadableAmount(bill.sgstValue)}</TableCell>
                                                <TableCell style={tableCellStyle}>{formatReadableAmount(bill.igstValue)}</TableCell>
                                                <TableCell style={tableCellStyle}>{bill.productName}</TableCell>
                                                <TableCell style={tableCellStyle}>{bill.hsnCode}</TableCell>
                                                <TableCell style={tableCellStyle}>{bill.transporterId}</TableCell>
                                                <TableCell style={tableCellStyle}>{bill.actualDist}</TableCell>
                                                <TableCell style={tableCellStyle}>{bill.quantity}</TableCell>
                                            </TableRow>
                                        ) : null
                                    ))}
                            </TableBody>
                            <TableFooter>
                                <TableRow>
                                    <TableCell colSpan={20} style={{ textAlign: 'right', fontWeight: 'bold' }}>Total</TableCell>
                                    <TableCell style={tableCellStyle}>{totals.taxableAmount.toFixed(2)}</TableCell>
                                    <TableCell style={tableCellStyle}>{totals.cgstValue.toFixed(2)}</TableCell>
                                    <TableCell style={tableCellStyle}>{totals.sgstValue.toFixed(2)}</TableCell>
                                    <TableCell style={tableCellStyle}>{totals.igstValue.toFixed(2)}</TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </TableContainer>

                    <TablePagination
                        component="div"
                        count={filteredBills.length}
                        page={page}
                        onPageChange={handleChangePage}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        rowsPerPageOptions={[15, 50, 100]}
                    />
                </>
            )}
        </Paper>
    );
};

export default EWayBills;
