// import React, { useState, useEffect, useRef } from "react";
// import {
//   TextField,
//   Button,
//   FormControl,
//   InputLabel,
//   Select,
//   MenuItem,
//   Typography,
//   Box,
//   Paper,
//   FormGroup,
//   Grid,
//   Snackbar,
//   Alert,
// Dialog, DialogTitle, DialogContent

// } from "@mui/material";
// import axios from "axios";
// import { initialFormData } from "./InitialEwayBillData";
// import { GSPTokenGenerator } from "./AuthTokenEwayBillGenrate";
// import { invoiceDataEwayBills } from './InvoiceBody';
// import { useNavigate } from "react-router-dom";
// import EwayBillTokenGenerator from "../EWayBillPortal/GenrateEWayBill/genrateToken";
// import SaleBillReport from '../Reports/SaleBillReport/SaleBillReport'

// const emailId = process.env.REACT_APP_EMAILID
// const phoneNo = process.env.REACT_APP_PHONENO

// const doubleLineStyle = {
//   textAlign: "left",
//   position: "relative",
//   "&::before, &::after": {
//     content: '""',
//     position: "absolute",
//     left: 0,
//     right: 0,
//     height: "1px",
//     backgroundColor: "black",
//   },
//   "&::before": {
//     top: "-2px",
//   },
//   "&::after": {
//     bottom: "-2px",
//   },
//   my: 2,
// };

// const API_URL = process.env.REACT_APP_API;

// const EWayBillNEInvoiceGen = ({ saleId, handleClose, vehicleNo, doNo, fromDate, ewayBillNo,millDoc_No }) => {

//   const Company_Code = sessionStorage.getItem('Company_Code');
//   const Year_Code = sessionStorage.getItem('Year_Code');

//     //   const Company_Code = 1
//     // const Year_Code = 4

//   const DETAILS_API_URL = "https://api.mastergst.com/ewaybillapi/v1.03/ewayapi/getewaybill";

//   const HEADERS = {
//     ip_address: "",
//     client_id: process.env.REACT_APP_EWAYBILL_CLIENT_ID,
//     client_secret: process.env.REACT_APP_EWAYBILL_CLIENT_SECRET,
//     gstin: process.env.REACT_APP_EWAYBILL_GSTIN,
//   };

//   const [formData, setFormData] = useState(initialFormData);
//   const resizableRef = useRef(null);
//   const [isEditMode, setIsEditMode] = useState(false);

//   const [fetchData, setFetchedData] = useState([]);
//   const [showReport, setShowReport] = useState(false);
//     const [reportData, setReportData] = useState(null);

//   const { generateTokenData } = GSPTokenGenerator();

//   const navigate = useNavigate()

//   const handleChange = (event) => {
//     const { name, value } = event.target;
//     setFormData({
//       ...formData,
//       [name]: value,
//     });
//   };

//   useEffect(() => {
//     setFormData((prev) => ({
//       ...prev,
//       IGSTOnIntra: prev.Company_Name_E !== prev.Buyer_Name ? "N" : "Y",
//     }));
//   }, [formData.Company_Name_E, formData.Buyer_Name]);


// //Fetch Eway bill details
//   const fetchEwayBillDetails = async (ewbNo) => {
//     const { generateToken } = EwayBillTokenGenerator();
//     const tokenResponse = generateToken();
//     try {
//       const response = await axios.get(DETAILS_API_URL, {
//         params: { email: process.env.REACT_APP_EWAYBILL_EMAIL, ewbNo },
//         headers: {
//           ...HEADERS,
//           Authorization: `Bearer ${tokenResponse.token}`,
//         },
//       });

//       return response.data.data.actualDist;
//     } catch (error) {
//       console.error(`Error fetching details for EWB No: ${ewbNo}`, error);
//       return null;
//     }
//   };

//   const handleSubmit = async (event) => {
//     event.preventDefault();
//     try {
//       const token = await generateTokenData();
//       if (!token) {
//         alert('Token generation failed');
//         return;
//       }

//       const apiUrl = `${API_URL}/create-invoice-onlineportal`;
//       const headers = {
//         "Content-Type": "application/json"
//       };
//       let invoiceData = invoiceDataEwayBills(formData);
//       invoiceData.token = token;

//       const response = await axios.post(apiUrl, invoiceData, { headers });
//       if (!response.data.success) {
//         alert('Error: ' + response.data.message);
//         return;
//       }

//       alert('Success: Invoice generated successfully!');
//       const result = response.data.result;
//       if (!result.EwbNo) {
//         alert("EWay Bill Not Generated");
//       }

//       const actualDistance = await fetchEwayBillDetails(result.EwbNo);
//       const updateData = {
//         AckNo: result.AckNo,
//         Irn: result.Irn,
//         SignedQRCode: result.SignedQRCode,
//         EwbNo: result.EwbNo,
//         EwbValidTill: result.EwbValidTill,
//         EwbDt: result.EwbDt,
//         Actual_Distance: actualDistance
//       };

//       const updateApiUrl = `${API_URL}/update-salesugar?saleid=${saleId}&Company_Code=${Company_Code}&Year_Code=${Year_Code}`;
//       const updateResponse = await axios.put(updateApiUrl, updateData, { headers });

//       if (updateResponse.status !== 200) {
//         console.error("Update failed with status:", updateResponse.status);
//         alert("Update failed: " + updateResponse.status);
//       }


//       setReportData(result);
//       setShowReport(true);
//       setTimeout (()=>{
//         handleClose();
//       }, 3000)


//       // Proceed with the potentially problematic last update
//       // const updateMillInvoiceUrl = `${API_URL}/updatemillinvoiceno?doc_date=${fromDate}&vehicle_no=${vehicleNo}&Company_Code=${Company_Code}&Year_Code=${Year_Code}&do_no=${doNo}`;
//       const updateMillInvoiceUrl = `${API_URL}/updatemillinvoiceno?doNo=${doNo}&millDoc_No=${millDoc_No}&Company_Code=${Company_Code}&Year_Code=${Year_Code}&ewayBillNo=${ewayBillNo}`;
//       const updateMillInvoiceResponse = await axios.put(updateMillInvoiceUrl);
//       if (updateMillInvoiceResponse.status !== 200) {
//         console.error("Failed to update mill invoice number:", updateMillInvoiceResponse.status);
//       }

//     } catch (error) {
//       console.error('Error:', error);
//       alert('An error occurred: ' + error.message);
//     } finally {
//     }
// };

//   const handleCloseReport = () => {
//     setShowReport(false);
//     handleClose();
//     navigate('/ewaybill');
// };

//   useEffect(() => {
//     let isMounted = true;
//     const fetchRecord = async () => {
//       try {
//         const response = await axios.get(`${API_URL}/get_eWayBill_generationData?Company_Code=${Company_Code}&Year_Code=${Year_Code}&saleId=${saleId}`);
//         if (response.status === 200) {
//           const data = response.data.all_data[0];
//           if (isMounted) {
//             setFetchedData(response.data);
//             setFormData(prevFormData => ({
//               ...prevFormData,
//               ...data,
//             }));
//           }
//         } else {
//           console.error("Failed to fetch data:", response.status, response.statusText);
//         }
//       } catch (error) {
//         console.error("Error fetching data:", error);
//         if (isMounted) {
//           setFetchedData([]);
//         }
//       }
//     };
//     fetchRecord();
//     return () => {
//       isMounted = false;
//     };
//   }, []);

//   // Resizer object at the time of resize the modal.
//   useEffect(() => {
//     const observer = new ResizeObserver(entries => {
//       entries.forEach(entry => {
//       });
//     });
//     if (resizableRef.current) {
//       observer.observe(resizableRef.current);
//     }
//     return () => observer.disconnect();
//   }, []);


//   const handleEdit = () => {
//     setIsEditMode(true);
//   }

//   const handleCancel = () => {
//     handleClose()
//   }

//   return (
//     <div>
//       <Paper ref={resizableRef} elevation={3} sx={{ p: 4, marginTop: 2 }}>

//         <Typography variant="h4" align="center">
//           eWayBill eInvoice
//         </Typography>
//         <Grid container spacing={2} sx={{ marginTop: -2, justifyContent: 'flex-end' }}>
//           <Grid item>
//             <Button
//               variant="contained"
//               color="primary"
//               onClick={handleEdit}
//               disabled
//             >
//               Edit
//             </Button>
//           </Grid>

//           <Grid item>
//             <Button
//               variant="contained"
//               color="primary"
//               onClick={handleCancel}
//             >
//               Cancel
//             </Button>
//           </Grid>

//           <Grid item>
//             <Button
//               variant="contained"
//               color="primary"
//               onClick={handleSubmit}

//             >
//               Generate eWayBill eInvoice
//             </Button>
//           </Grid>
//         </Grid>

//         <Box
//           sx={doubleLineStyle}
//         >
//           <Typography variant="h6" gutterBottom>
//             Transaction Details
//           </Typography>
//         </Box>
//         <FormGroup>
//           <Grid container spacing={3}>
//             <Grid item xs={12} sm={1} marginTop={-2}>
//               <FormControl fullWidth margin="normal">
//                 <InputLabel>Supply Type</InputLabel>
//                 <Select
//                   name="supplyType"
//                   value={formData.supplyType}
//                   onChange={handleChange}
//                   size="small"
//                   label="Supply Type"

//                 >
//                   <MenuItem value="B2B">B2B</MenuItem>
//                   <MenuItem value="SEZWP">SEZWP</MenuItem>
//                   <MenuItem value="SEZWOP">SEZWOP</MenuItem>
//                   <MenuItem value="EXP">EXP</MenuItem>
//                   <MenuItem value="WP">WP</MenuItem>
//                   <MenuItem value="EXPWOP">EXPWOP</MenuItem>
//                   <MenuItem value="DXEP">DXEP</MenuItem>
//                 </Select>
//               </FormControl>
//             </Grid>
//             <Grid item xs={12} sm={1.5} marginTop={-2}>
//               <FormControl fullWidth margin="normal">
//                 <InputLabel>Reverse Charge</InputLabel>
//                 <Select
//                   name="reverseCharge"
//                   value={formData.reverseCharge}
//                   onChange={handleChange}
//                   size="small"
//                   label="Reverse Charge"

//                 >
//                   <MenuItem value="Y">Yes</MenuItem>
//                   <MenuItem value="N">No</MenuItem>
//                 </Select>
//               </FormControl>
//             </Grid>
//             <Grid item xs={12} sm={1} marginTop={-2}>
//               <FormControl fullWidth margin="normal">
//                 <InputLabel>IGSTOnIntra</InputLabel>
//                 <Select
//                   name="IGSTOnIntra"
//                   value={formData.IGSTOnIntra}
//                   onChange={handleChange}
//                   size="small"
//                   label="IGSTOnIntra"

//                 >
//                   <MenuItem value="Y">Yes</MenuItem>
//                   <MenuItem value="N">No</MenuItem>
//                 </Select>
//               </FormControl>
//             </Grid>
//           </Grid>
//           <Grid container spacing={3}>
//             <Grid item xs={12} sm={2} marginTop={-2}>
//               <TextField
//                 label="Doc No"
//                 name="Doc_No"
//                 value={`SB${formData.year}-${formData.Doc_No}`}
//                 onChange={handleChange}
//                 variant="outlined"
//                 fullWidth
//                 margin="normal"
//                 size="small"
//                 disabled
//               />
//             </Grid>
//             <Grid item xs={12} sm={1.1} marginTop={-2}>
//               <TextField
//                 label="Doc Date"
//                 type="date"
//                 name="doc_date"
//                 value={formData.doc_date}
//                 onChange={handleChange}
//                 variant="outlined"
//                 fullWidth
//                 margin="normal"
//                 size="small"

//                 InputLabelProps={{
//                   shrink: true,
//                 }}
//               />
//             </Grid>
//             <Grid item xs={12} sm={1.7} marginTop={-2}>
//               <FormControl fullWidth margin="normal">
//                 <InputLabel>Doc Type</InputLabel>
//                 <Select
//                   name="docType"
//                   value={formData.docType}
//                   onChange={handleChange}
//                   size="small"
//                   label="Doc Type"

//                 >
//                   <MenuItem value="INV">Invoice</MenuItem>
//                   <MenuItem value="CRN">Credit Note</MenuItem>
//                   <MenuItem value="DBN">Debit Note</MenuItem>
//                 </Select>
//               </FormControl>
//             </Grid>
//           </Grid>
//           <Grid container spacing={2}>
//             <Grid item xs={12} sm={6}>
//               <Box
//                 sx={doubleLineStyle}
//               >
//                 <Typography variant="h6" gutterBottom>
//                   Seller Details
//                 </Typography>
//               </Box>
//               <Grid container spacing={3}>
//                 <Grid item xs={12} sm={4} marginTop={-2}>
//                   <TextField
//                     label="GSTIN"
//                     name="GST"
//                     value={formData.GST}
//                     onChange={handleChange}
//                     variant="outlined"
//                     fullWidth
//                     margin="normal"
//                     size="small"

//                     InputLabelProps={{
//                       shrink: true,
//                     }}
//                   />
//                 </Grid>
//                 <Grid item xs={12} sm={8} marginTop={-2}>
//                   <TextField
//                     label="Legal Name"
//                     name="Company_Name_E"
//                     value={formData.Company_Name_E}
//                     onChange={handleChange}
//                     variant="outlined"
//                     fullWidth
//                     margin="normal"
//                     size="small"

//                   />
//                 </Grid>
//               </Grid>
//               <Grid container spacing={3}>
//                 <Grid item xs={12} sm={5} marginTop={-2}>
//                   <TextField
//                     label="Address"
//                     name="Address_E"
//                     value={formData.Address_E}
//                     onChange={handleChange}
//                     variant="outlined"
//                     fullWidth
//                     margin="normal"
//                     size="small"

//                     multiline
//                     rows={2}
//                     InputLabelProps={{
//                       shrink: true,
//                     }}
//                   />
//                 </Grid>
//                 <Grid item xs={12} sm={6} marginTop={-2}>
//                   <TextField
//                     name="billFromAdd"
//                     value={''}
//                     onChange={handleChange}
//                     variant="outlined"
//                     fullWidth
//                     margin="normal"
//                     size="small"

//                   />
//                 </Grid>
//               </Grid>
//               <Grid container spacing={3}>
//                 <Grid item xs={12} sm={4} marginTop={-2}>
//                   <TextField
//                     label="Location"
//                     name="City_E"
//                     value={formData.City_E}
//                     onChange={handleChange}
//                     variant="outlined"
//                     fullWidth
//                     margin="normal"
//                     size="small"

//                   />
//                 </Grid>
//                 <Grid item xs={12} sm={4} marginTop={-2}>
//                   <TextField
//                     label="PinCode"
//                     name="PIN"
//                     value={formData.PIN}
//                     onChange={handleChange}
//                     variant="outlined"
//                     fullWidth
//                     margin="normal"
//                     size="small"

//                   />
//                 </Grid>
//                 <Grid item xs={12} sm={4} marginTop={-2}>
//                   <TextField
//                     label="State"
//                     name="State_E"
//                     value={formData.State_E}
//                     onChange={handleChange}
//                     variant="outlined"
//                     fullWidth
//                     margin="normal"
//                     size="small"

//                   />
//                 </Grid>
//               </Grid>
//               <Grid container spacing={3}>
//                 <Grid item xs={12} sm={4} marginTop={-2}>
//                   <TextField
//                     label="State Code"
//                     name="GSTStateCode"
//                     value={formData.GSTStateCode}
//                     onChange={handleChange}
//                     variant="outlined"
//                     fullWidth
//                     margin="normal"
//                     size="small"

//                   />
//                 </Grid>
//                 <Grid item xs={12} sm={4} marginTop={-2}>
//                   <TextField
//                     label="Phone"
//                     name="PHONE"
//                     value={phoneNo}
//                     onChange={handleChange}
//                     variant="outlined"
//                     fullWidth
//                     margin="normal"
//                     size="small"

//                     InputLabelProps={{
//                       shrink: true,
//                     }}
//                   />
//                 </Grid>
//                 <Grid item xs={12} sm={4} marginTop={-2}>
//                   <TextField
//                     label="Email"
//                     name="EmailId"
//                     value={emailId}
//                     onChange={handleChange}
//                     variant="outlined"
//                     fullWidth
//                     margin="normal"
//                     size="small"

//                     InputLabelProps={{
//                       shrink: true,
//                     }}
//                   />
//                 </Grid>
//               </Grid>
//             </Grid>
//             <Grid item xs={12} sm={6}>
//               <Box
//                 sx={doubleLineStyle}
//               >
//                 <Typography variant="h6" gutterBottom>
//                   Buyer Details
//                 </Typography>
//               </Box>
//               <Grid container spacing={3}>
//                 <Grid item xs={12} sm={4} marginTop={-2}>
//                   <TextField
//                     label="GSTIN"
//                     name="BuyerGst_No"
//                     value={formData.BuyerGst_No}
//                     onChange={handleChange}
//                     variant="outlined"
//                     fullWidth
//                     margin="normal"
//                     size="small"

//                     InputLabelProps={{
//                       shrink: true,
//                     }}
//                   />
//                 </Grid>
//                 <Grid item xs={12} sm={8} marginTop={-2}>
//                   <TextField
//                     label="Legal Name"
//                     name="Buyer_Name"
//                     value={formData.Buyer_Name}
//                     onChange={handleChange}
//                     variant="outlined"
//                     fullWidth
//                     margin="normal"
//                     size="small"

//                   />
//                 </Grid>
//               </Grid>
//               <Grid container spacing={3}>
//                 <Grid item xs={12} sm={5} marginTop={-2}>
//                   <TextField
//                     label="Address"
//                     name="Buyer_Address"
//                     value={formData.Buyer_Address}
//                     onChange={handleChange}
//                     variant="outlined"
//                     fullWidth
//                     margin="normal"
//                     size="small"

//                     multiline
//                     rows={2}
//                     InputLabelProps={{
//                       shrink: true,
//                     }}
//                   />
//                 </Grid>
//                 <Grid item xs={12} sm={6} marginTop={-2}>
//                   <TextField
//                     name="BuyerAdd1"
//                     value={""}
//                     onChange={handleChange}
//                     variant="outlined"
//                     fullWidth
//                     margin="normal"
//                     size="small"

//                   />
//                 </Grid>
//               </Grid>
//               <Grid container spacing={3}>
//                 <Grid item xs={12} sm={4} marginTop={-2}>
//                   <TextField
//                     label="Location"
//                     name="Buyer_City"
//                     value={formData.Buyer_City}
//                     onChange={handleChange}
//                     variant="outlined"
//                     fullWidth
//                     margin="normal"
//                     size="small"

//                   />
//                 </Grid>
//                 <Grid item xs={12} sm={4} marginTop={-2}>
//                   <TextField
//                     label="PinCode"
//                     name="Buyer_Pincode"
//                     value={formData.Buyer_Pincode}
//                     onChange={handleChange}
//                     variant="outlined"
//                     fullWidth
//                     margin="normal"
//                     size="small"

//                   />
//                 </Grid>
//                 <Grid item xs={12} sm={4} marginTop={-2}>
//                   <TextField
//                     label="State"
//                     name="Buyer_State_name"
//                     value={formData.Buyer_State_name}
//                     onChange={handleChange}
//                     variant="outlined"
//                     fullWidth
//                     margin="normal"
//                     size="small"

//                   />
//                 </Grid>
//               </Grid>
//               <Grid container spacing={3}>
//                 <Grid item xs={12} sm={2} marginTop={-2}>
//                   <TextField
//                     label="State Code"
//                     name="Buyer_State_Code"
//                     value={formData.Buyer_State_Code}
//                     onChange={handleChange}
//                     variant="outlined"
//                     fullWidth
//                     margin="normal"
//                     size="small"

//                   />
//                 </Grid>
//                 <Grid item xs={12} sm={2} marginTop={-2}>
//                   <TextField
//                     label="POS"
//                     name="pos"
//                     value={formData.Buyer_State_Code}
//                     onChange={handleChange}
//                     variant="outlined"
//                     fullWidth
//                     margin="normal"
//                     size="small"

//                   />
//                 </Grid>
//                 <Grid item xs={12} sm={4} marginTop={-2}>
//                   <TextField
//                     label="Phone"
//                     name="Buyer_Phno"
//                     value={formData.Buyer_Phno}
//                     onChange={handleChange}
//                     variant="outlined"
//                     fullWidth
//                     margin="normal"
//                     size="small"

//                   />
//                 </Grid>
//                 <Grid item xs={12} sm={4} marginTop={-2}>
//                   <TextField
//                     label="Email"
//                     name="Buyer_Email_Id"
//                     value={formData.Buyer_Email_Id}
//                     onChange={handleChange}
//                     variant="outlined"
//                     fullWidth
//                     margin="normal"
//                     size="small"

//                   />
//                 </Grid>
//               </Grid>
//             </Grid>
//           </Grid>
//           <Grid container spacing={2}>
//             <Grid item xs={12} sm={6}>
//               <Box
//                 sx={doubleLineStyle}
//               >
//                 <Typography variant="h6" gutterBottom>
//                   Dispatch From
//                 </Typography>
//               </Box>
//               <Grid container spacing={3}>
//                 <Grid item xs={12} sm={4} marginTop={-2}>
//                   <TextField
//                     label="GSTIN"
//                     name="DispatchGst_No"
//                     value={formData.DispatchGst_No}
//                     onChange={handleChange}
//                     variant="outlined"
//                     fullWidth
//                     margin="normal"
//                     size="small"

//                     InputLabelProps={{
//                       shrink: true,
//                     }}
//                   />
//                 </Grid>
//                 <Grid item xs={12} sm={8} marginTop={-2}>
//                   <TextField
//                     label="Legal Name"
//                     name="Dispatch_Name"
//                     value={formData.Dispatch_Name}
//                     onChange={handleChange}
//                     variant="outlined"
//                     fullWidth
//                     margin="normal"
//                     size="small"

//                   />
//                 </Grid>
//               </Grid>
//               <Grid container spacing={3}>
//                 <Grid item xs={12} sm={5} marginTop={-2}>
//                   <TextField
//                     label="Address"
//                     name="Dispatch_Address"
//                     value={formData.Dispatch_Address}
//                     onChange={handleChange}
//                     variant="outlined"
//                     fullWidth
//                     margin="normal"
//                     size="small"

//                     multiline
//                     rows={2}
//                   />
//                 </Grid>
//                 <Grid item xs={12} sm={6} marginTop={-2}>
//                   <TextField
//                     name="dispatchAdd"
//                     value={""}
//                     onChange={handleChange}
//                     variant="outlined"
//                     fullWidth
//                     margin="normal"
//                     size="small"

//                   />
//                 </Grid>
//               </Grid>
//               <Grid container spacing={3}>
//                 <Grid item xs={12} sm={4} marginTop={-2}>
//                   <TextField
//                     label="Location"
//                     name="DispatchCity_City"
//                     value={formData.DispatchCity_City}
//                     onChange={handleChange}
//                     variant="outlined"
//                     fullWidth
//                     margin="normal"
//                     size="small"

//                   />
//                 </Grid>
//                 <Grid item xs={12} sm={4} marginTop={-2}>
//                   <TextField
//                     label="State"
//                     name="Dispatch_GSTStateCode"
//                     value={formData.Dispatch_GSTStateCode}
//                     onChange={handleChange}
//                     variant="outlined"
//                     fullWidth
//                     margin="normal"
//                     size="small"

//                   />
//                 </Grid>
//                 <Grid item xs={12} sm={4} marginTop={-2}>
//                   <TextField
//                     label="PinCode"
//                     name="Dispatch_Pincode"
//                     value={formData.Dispatch_Pincode}
//                     onChange={handleChange}
//                     variant="outlined"
//                     fullWidth
//                     margin="normal"
//                     size="small"

//                   />
//                 </Grid>

//               </Grid>
//             </Grid>
//             <Grid item xs={12} sm={6}>
//               <Box
//                 sx={doubleLineStyle}
//               >
//                 <Typography variant="h6" gutterBottom>
//                   Dispatch To
//                 </Typography>
//               </Box>
//               <Grid container spacing={3}>
//                 <Grid item xs={12} sm={4} marginTop={-2}>
//                   <TextField
//                     label="GSTIN"
//                     name="ShipToGst_No"
//                     value={formData.ShipToGst_No}
//                     onChange={handleChange}
//                     variant="outlined"
//                     fullWidth
//                     margin="normal"
//                     size="small"

//                     InputLabelProps={{
//                       shrink: true,
//                     }}
//                   />
//                 </Grid>
//                 <Grid item xs={12} sm={8} marginTop={-2}>
//                   <TextField
//                     label="Legal Name"
//                     name="ShipTo_Name"
//                     value={formData.ShipTo_Name}
//                     onChange={handleChange}
//                     variant="outlined"
//                     fullWidth
//                     margin="normal"
//                     size="small"

//                   />
//                 </Grid>
//               </Grid>
//               <Grid container spacing={3}>
//                 <Grid item xs={12} sm={5} marginTop={-2}>
//                   <TextField
//                     label="Address"
//                     name="ShipTo_Address"
//                     value={formData.ShipTo_Address}
//                     onChange={handleChange}
//                     variant="outlined"
//                     fullWidth
//                     margin="normal"
//                     size="small"

//                     multiline
//                     rows={2}
//                   />
//                 </Grid>
//                 <Grid item xs={12} sm={6} marginTop={-2}>
//                   <TextField
//                     name="shipToAdd"
//                     value={""}
//                     onChange={handleChange}
//                     variant="outlined"
//                     fullWidth
//                     margin="normal"
//                     size="small"

//                   />
//                 </Grid>
//               </Grid>
//               <Grid container spacing={3}>
//                 <Grid item xs={12} sm={4} marginTop={-2}>
//                   <TextField
//                     label="Location"
//                     name="ShipTo_City"
//                     value={formData.ShipTo_City}
//                     onChange={handleChange}
//                     variant="outlined"
//                     fullWidth
//                     margin="normal"
//                     size="small"

//                   />
//                 </Grid>
//                 <Grid item xs={12} sm={4} marginTop={-2}>
//                   <TextField
//                     label="State"
//                     name="ShipTo_GSTStateCode"
//                     value={formData.ShipTo_GSTStateCode}
//                     onChange={handleChange}
//                     variant="outlined"
//                     fullWidth
//                     margin="normal"
//                     size="small"

//                   />
//                 </Grid>
//                 <Grid item xs={12} sm={4} marginTop={-2}>
//                   <TextField
//                     label="PinCode"
//                     name="ShipTo_Pincode"
//                     value={formData.ShipTo_Pincode}
//                     onChange={handleChange}
//                     variant="outlined"
//                     fullWidth
//                     margin="normal"
//                     size="small"

//                   />
//                 </Grid>
//               </Grid>
//             </Grid>
//           </Grid>
//           <Grid container spacing={3}>
//             <Grid item xs={12} sm={12}>
//               <Box
//                 sx={doubleLineStyle}
//               >
//                 <Typography variant="h6" gutterBottom>
//                   Item Details
//                 </Typography>
//               </Box>
//               <Grid container spacing={3}>
//                 <Grid item xs={12} sm={1.5} marginTop={-2}>
//                   <TextField
//                     label="Product Name"
//                     name="System_Name_E"
//                     value={formData.System_Name_E}
//                     onChange={handleChange}
//                     variant="outlined"
//                     fullWidth
//                     margin="normal"
//                     size="small"

//                   />
//                 </Grid>
//                 <Grid item xs={12} sm={1.5} marginTop={-2}>
//                   <TextField
//                     label="Description"
//                     name="itemDescription"
//                     value={formData.System_Name_E}
//                     onChange={handleChange}
//                     variant="outlined"
//                     fullWidth
//                     margin="normal"
//                     size="small"

//                   />
//                 </Grid>
//                 <Grid item xs={12} sm={1.5} marginTop={-2}>
//                   <TextField
//                     label="HSN"
//                     name="HSN"
//                     value={formData.HSN}
//                     onChange={handleChange}
//                     variant="outlined"
//                     fullWidth
//                     margin="normal"
//                     size="small"

//                   />
//                 </Grid>
//                 <Grid item xs={12} sm={1.5} marginTop={-2}>
//                   <FormControl fullWidth margin="normal">
//                     <InputLabel>Is Service</InputLabel>
//                     <Select
//                       name="IsService"
//                       value={formData.IsService}
//                       onChange={handleChange}
//                       size="small"
//                       label="IsService"

//                     >
//                       <MenuItem value="Y">Yes</MenuItem>
//                       <MenuItem value="N">No</MenuItem>
//                     </Select>
//                   </FormControl>
//                 </Grid>
//                 <Grid item xs={12} sm={1.5} marginTop={-2}>
//                   <TextField
//                     label="Quantity"
//                     name="NETQNTL"
//                     value={formData.NETQNTL}
//                     onChange={handleChange}
//                     variant="outlined"
//                     fullWidth
//                     margin="normal"
//                     size="small"

//                   />
//                 </Grid>
//                 <Grid item xs={12} sm={2} marginTop={-2}>
//                   <TextField
//                     label="Unit"
//                     name="unit"
//                     value={formData.unit}
//                     onChange={handleChange}
//                     variant="outlined"
//                     fullWidth
//                     margin="normal"
//                     size="small"

//                   />
//                 </Grid>
//                 <Grid item xs={12} sm={1.5} marginTop={-2}>
//                   <TextField
//                     label="Unit Price"
//                     name="rate"
//                     value={(parseFloat(formData.rate) || 0) + (parseFloat(formData.LESS_FRT_RATE) || 0)}
//                     onChange={handleChange}
//                     variant="outlined"
//                     fullWidth
//                     margin="normal"
//                     size="small"

//                   />
//                 </Grid>
//               </Grid>
//               <Grid container spacing={3}>
//                 <Grid item xs={12} sm={1.5} marginTop={-2}>
//                   <TextField
//                     label=" Assessable Value "
//                     name="assessableValue"
//                     value={formData.TaxableAmount}
//                     onChange={handleChange}
//                     variant="outlined"
//                     fullWidth
//                     margin="normal"
//                     size="small"

//                   />
//                 </Grid>
//                 <Grid item xs={12} sm={1.5} marginTop={-2}>
//                   <TextField
//                     label=" CGST Value"
//                     name="CGSTRate"
//                     value={formData.CGSTRate}
//                     onChange={handleChange}
//                     variant="outlined"
//                     fullWidth
//                     margin="normal"
//                     size="small"

//                   />
//                 </Grid>
//                 <Grid item xs={12} sm={1.5} marginTop={-2}>
//                   <TextField
//                     label=" SGST Value "
//                     name="SGSTRate"
//                     value={formData.SGSTRate}
//                     onChange={handleChange}
//                     variant="outlined"
//                     fullWidth
//                     margin="normal"
//                     size="small"

//                   />
//                 </Grid>
//                 <Grid item xs={12} sm={1.5} marginTop={-2}>
//                   <TextField
//                     label=" IGST Value "
//                     name="IGSTRate"
//                     value={formData.IGSTRate}
//                     onChange={handleChange}
//                     variant="outlined"
//                     fullWidth
//                     margin="normal"
//                     size="small"

//                   />
//                 </Grid>
//                 <Grid item xs={12} sm={1.5} marginTop={-2}>
//                   <TextField
//                     label=" Cess Value "
//                     name="cessValue"
//                     value={formData.cessValue}
//                     onChange={handleChange}
//                     variant="outlined"
//                     fullWidth
//                     margin="normal"
//                     size="small"

//                   />
//                 </Grid>
//                 <Grid item xs={12} sm={1.5} marginTop={-2}>
//                   <TextField
//                     label=" Total Invoice Value "
//                     name="totalInvoiceValue"
//                     value={
//                       (parseFloat(formData.TaxableAmount) || 0) +
//                       (parseFloat(formData.CGSTAmount) || 0) +
//                       (parseFloat(formData.SGSTAmount) || 0) +
//                       (parseFloat(formData.IGSTAmount) || 0) +
//                       (parseFloat(formData.cessValue) || 0) +
//                       (parseFloat(formData.stateCessValue) || 0) +
//                       (parseFloat(formData.otherAmount) || 0)
//                     }

//                     onChange={handleChange}
//                     variant="outlined"
//                     fullWidth
//                     margin="normal"
//                     size="small"

//                   />
//                 </Grid>
//                 <Grid item xs={12} sm={1.5} marginTop={-2}>
//                   <TextField
//                     label=" State Cess Value "
//                     name="stateCessValue"
//                     value={formData.stateCessValue}
//                     onChange={handleChange}
//                     variant="outlined"
//                     fullWidth
//                     margin="normal"
//                     size="small"

//                   />
//                 </Grid>
//               </Grid>
//               <Grid container spacing={3}>
//                 <Grid item xs={12} sm={2} marginTop={-2}>
//                   <TextField
//                     label="Discount"
//                     name="discount"
//                     value={formData.discount}
//                     onChange={handleChange}
//                     variant="outlined"
//                     fullWidth
//                     margin="normal"
//                     size="small"

//                   />
//                 </Grid>
//                 <Grid item xs={12} sm={2} marginTop={-2}>
//                   <TextField
//                     label="Other Charge"
//                     name="otherAmount"
//                     value={formData.otherAmount}
//                     onChange={handleChange}
//                     variant="outlined"
//                     fullWidth
//                     margin="normal"
//                     size="small"

//                   />
//                 </Grid>
//                 <Grid item xs={12} sm={2} marginTop={-2}>
//                   <TextField
//                     label="GST Rate"
//                     name="GSTRate"
//                     value={formData.GSTRate}
//                     onChange={handleChange}
//                     variant="outlined"
//                     fullWidth
//                     margin="normal"
//                     size="small"

//                   />
//                 </Grid>
//                 <Grid item xs={12} sm={2} marginTop={-2}>
//                   <TextField
//                     label="CGST Amount"
//                     name="CGSTAmount"
//                     value={formData.CGSTAmount}
//                     onChange={handleChange}
//                     variant="outlined"
//                     fullWidth
//                     margin="normal"
//                     size="small"

//                   />
//                 </Grid>
//                 <Grid item xs={12} sm={2} marginTop={-2}>
//                   <TextField
//                     label="SGST Amount"
//                     name="SGSTAmount"
//                     value={formData.SGSTAmount}
//                     onChange={handleChange}
//                     variant="outlined"
//                     fullWidth
//                     margin="normal"
//                     size="small"

//                   />
//                 </Grid>
//                 <Grid item xs={12} sm={2} marginTop={-2}>
//                   <TextField
//                     label="IGST Amount"
//                     name="IGSTAmount"
//                     value={formData.IGSTAmount}
//                     onChange={handleChange}
//                     variant="outlined"
//                     fullWidth
//                     margin="normal"
//                     size="small"

//                   />
//                 </Grid>
//               </Grid>
//               <Grid container spacing={3}>
//                 <Grid item xs={12} sm={2} marginTop={-2}>
//                   <TextField
//                     label="CESS Amount"
//                     name="cessAmount"
//                     value={formData.cessAmount}
//                     onChange={handleChange}
//                     variant="outlined"
//                     fullWidth
//                     margin="normal"
//                     size="small"

//                   />
//                 </Grid>
//                 <Grid item xs={12} sm={2} marginTop={-2}>
//                   <TextField
//                     label="Assessable Amount"
//                     name="assessableAmount"
//                     value={formData.TaxableAmount}
//                     onChange={handleChange}
//                     variant="outlined"
//                     fullWidth
//                     margin="normal"
//                     size="small"

//                   />
//                 </Grid>
//                 <Grid item xs={12} sm={2} marginTop={-2}>
//                   <TextField
//                     label="Total Item Amount"
//                     name="totalItemAmount"
//                     value={
//                       (parseFloat(formData.TaxableAmount) || 0) +
//                       (parseFloat(formData.CGSTAmount) || 0) +
//                       (parseFloat(formData.SGSTAmount) || 0) +
//                       (parseFloat(formData.IGSTAmount) || 0) +
//                       (parseFloat(formData.cessValue) || 0) +
//                       (parseFloat(formData.stateCessValue) || 0) +
//                       (parseFloat(formData.otherAmount) || 0)
//                     }
//                     onChange={handleChange}
//                     variant="outlined"
//                     fullWidth
//                     margin="normal"
//                     size="small"

//                   />
//                 </Grid>
//                 <Grid item xs={12} sm={2} marginTop={-2}>
//                   <TextField
//                     label="Total Inv Amount"
//                     name="totalInvAmount"
//                     value={formData.TaxableAmount}
//                     onChange={handleChange}
//                     variant="outlined"
//                     fullWidth
//                     margin="normal"
//                     size="small"

//                   />
//                 </Grid>
//               </Grid>
//               <Grid container spacing={3}>
//                 <Grid item xs={12} sm={2} marginTop={-2}>
//                   <TextField
//                     label="Transporter Name"
//                     name="transporterName"
//                     value={formData.transporterName}
//                     onChange={handleChange}
//                     variant="outlined"
//                     fullWidth
//                     margin="normal"
//                     size="small"

//                   />
//                 </Grid>
//                 <Grid item xs={12} sm={1.5} marginTop={-2}>
//                   <TextField
//                     label="Transporter ID "
//                     name="transporterID"
//                     value={formData.transporterID}
//                     onChange={handleChange}
//                     variant="outlined"
//                     fullWidth
//                     margin="normal"
//                     size="small"

//                   />
//                 </Grid>
//                 <Grid item xs={12} sm={1.5} marginTop={-2}>
//                   <TextField
//                     label="Approximate Distance(in KM) "
//                     name="Distance"
//                     value={formData.Distance}
//                     onChange={handleChange}
//                     variant="outlined"
//                     fullWidth
//                     margin="normal"
//                     size="small"

//                   />
//                 </Grid>
//                 <Grid item xs={12} sm={1.5} marginTop={-2}>
//                   <FormControl fullWidth margin="normal">
//                     <InputLabel>Mode</InputLabel>
//                     <Select
//                       name="tranceMode"
//                       value={formData.tranceMode}
//                       onChange={handleChange}
//                       size="small"
//                       label="Mode"

//                     >
//                       <MenuItem value="1">Road</MenuItem>
//                       <MenuItem value="2">Rail</MenuItem>
//                       <MenuItem value="3">Air</MenuItem>
//                       <MenuItem value="4">Ship</MenuItem>
//                     </Select>
//                   </FormControl>
//                 </Grid>
//                 <Grid item xs={12} sm={1.5} marginTop={-2}>
//                   <FormControl fullWidth margin="normal">
//                     <InputLabel> Vehicle Type </InputLabel>
//                     <Select
//                       name="vehicleType"
//                       value={formData.vehicleType}
//                       onChange={handleChange}
//                       size="small"
//                       label="  Vehicle Type "

//                     >
//                       <MenuItem value="R">Regular</MenuItem>
//                       <MenuItem value="O">Over Dimensional Cargo</MenuItem>
//                     </Select>
//                   </FormControl>
//                 </Grid>
//                 <Grid item xs={12} sm={2} marginTop={-2}>
//                   <TextField
//                     label="Vehicle Number "
//                     name="LORRYNO"
//                     value={formData.LORRYNO}
//                     onChange={handleChange}
//                     variant="outlined"
//                     fullWidth
//                     margin="normal"
//                     size="small"

//                   />
//                 </Grid>
//               </Grid>
//             </Grid>
//           </Grid>
//           <Grid container spacing={3}>
//             <Grid item xs={12} sm={12}>
//               <Box
//                 sx={doubleLineStyle}
//               >
//                 <Typography variant="h6" gutterBottom>
//                   Payment Details
//                 </Typography>
//               </Box>
//               <Grid container spacing={3}>
//                 <Grid item xs={12} sm={2} marginTop={-2}>
//                   <TextField
//                     label="Mode Of Payment "
//                     name="Mode_of_Payment"
//                     value={formData.Mode_of_Payment}
//                     onChange={handleChange}
//                     variant="outlined"
//                     fullWidth
//                     margin="normal"
//                     size="small"

//                   />
//                 </Grid>
//                 <Grid item xs={12} sm={2} marginTop={-2}>
//                   <TextField
//                     label="Account Details"
//                     name="Account_Details"
//                     value={formData.Account_Details}
//                     onChange={handleChange}
//                     variant="outlined"
//                     fullWidth
//                     margin="normal"
//                     size="small"

//                   />
//                 </Grid>
//                 <Grid item xs={12} sm={2} marginTop={-2}>
//                   <TextField
//                     label="Branch"
//                     name="Branch"
//                     value={formData.Branch}
//                     onChange={handleChange}
//                     variant="outlined"
//                     fullWidth
//                     margin="normal"
//                     size="small"

//                   />
//                 </Grid>
//                 <Grid item xs={12} sm={2} marginTop={-2}>
//                   <TextField
//                     label="Payee Name"
//                     name="payeeName"
//                     value={formData.payeeName}
//                     onChange={handleChange}
//                     variant="outlined"
//                     fullWidth
//                     margin="normal"
//                     size="small"

//                   />
//                 </Grid>
//               </Grid>
//             </Grid>
//           </Grid>
//         </FormGroup>
//         <Dialog open={showReport} onClose={handleCloseReport} fullWidth maxWidth="lg">
//                 <DialogTitle>Sale Bill Report</DialogTitle>
//                 <DialogContent>
//                     {showReport && <SaleBillReport saleId={saleId} ewayBillNo={ewayBillNo} />}
//                 </DialogContent>
//             </Dialog>
//       </Paper>
//     </div>
//   );
// };

// export default EWayBillNEInvoiceGen;
























import React, { useState, useEffect, useRef } from "react";
import {
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Paper,
  FormGroup,
  Grid,
  Snackbar,
  Alert,
  Dialog, DialogTitle, DialogContent

} from "@mui/material";
import axios from "axios";
import { initialFormData } from "./InitialEwayBillData";
import { GSPTokenGenerator } from "./AuthTokenEwayBillGenrate";
import { invoiceDataEwayBills } from './InvoiceBody';
import { useNavigate } from "react-router-dom";
import EwayBillTokenGenerator from "../EWayBillPortal/GenrateEWayBill/genrateToken";
import SaleBillReport from '../Reports/SaleBillReport/SaleBillReport'
import MergedBillReport from '../Reports/MergedBillReport'


const doubleLineStyle = {
  textAlign: "left",
  position: "relative",
  "&::before, &::after": {
    content: '""',
    position: "absolute",
    left: 0,
    right: 0,
    height: "1px",
    backgroundColor: "black",
  },
  "&::before": {
    top: "-2px",
  },
  "&::after": {
    bottom: "-2px",
  },
  my: 2,
};

const API_URL = process.env.REACT_APP_API;

const EWayBillNEInvoiceGen = ({ saleId, handleClose, vehicleNo, doNo, fromDate, ewayBillNo, millDoc_No }) => {



  const emailId = process.env.REACT_APP_EMAILID
const phoneNo = process.env.REACT_APP_PHONENO

  const Company_Code = sessionStorage.getItem('Company_Code');
  const Year_Code = sessionStorage.getItem('Year_Code');


  // Whitebooks is now called server-side (see WhitebooksProxyController.py) -
  // api.whitebooks.in rejects cross-origin browser calls (CORS preflight
  // fails in production), and calling it directly also leaked client_secret
  // to anyone opening DevTools.
  const DETAILS_API_URL = `${API_URL}/whitebooks-get-ewaybill`;

  const [formData, setFormData] = useState(initialFormData);
  const resizableRef = useRef(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const [fetchData, setFetchedData] = useState([]);
  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState(null);

  const { generateTokenData } = GSPTokenGenerator();

  const navigate = useNavigate()

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      IGSTOnIntra: prev.Company_Name_E !== prev.Buyer_Name ? "N" : "Y",
    }));
  }, [formData.Company_Name_E, formData.Buyer_Name]);


  //Fetch Eway bill details
  const fetchEwayBillDetails = async (ewbNo) => {
    const { generateToken } = EwayBillTokenGenerator();

    const tokenResponse = await generateToken();
    console.log("[fetchEwayBillDetails] auth response:", tokenResponse);
    try {
      const response = await axios.get(DETAILS_API_URL, {
        params: { ewbNo, token: tokenResponse?.token },
      });

      return response.data.data.actualDist;
    } catch (error) {
      console.error(`Error fetching details for EWB No: ${ewbNo}`, error);
      return null;
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const token = await generateTokenData();
      if (!token) {
        alert('Token generation failed');
        return;
      }

      const apiUrl = `${API_URL}/create-invoice-onlineportal`;
      const headers = {
        "Content-Type": "application/json"
      };
      let invoiceData = invoiceDataEwayBills(formData);
      invoiceData.token = token;

      const response = await axios.post(apiUrl, invoiceData, { headers });
      if (!response.data.success) {
        alert('Error: ' + response.data.message);
        return;
      }

      alert('Success: Invoice generated successfully!');
      const result = response.data.result;
      if (!result.EwbNo) {
        alert("EWay Bill Not Generated");
      }


      const infoArray = response.data.info || [];

      const distanceInfo = infoArray.find(item => item.InfCd === "EWBPPD");
      const distanceMatch = distanceInfo?.Desc?.match(/(\d+)/);
      const actualDistance = distanceMatch ? parseInt(distanceMatch[1], 10) : null;

      // const actualDistance = await fetchEwayBillDetails(result.EwbNo);
      const updateData = {
        AckNo: result.AckNo,
        Irn: result.Irn,
        SignedQRCode: result.SignedQRCode,
        EwbNo: result.EwbNo,
        EwbValidTill: result.EwbValidTill,
        EwbDt: result.EwbDt,
        Actual_Distance: actualDistance
      };

      const updateApiUrl = `${API_URL}/update-salesugar?saleid=${saleId}&Company_Code=${Company_Code}&Year_Code=${Year_Code}`;
      const updateResponse = await axios.put(updateApiUrl, updateData, { headers });

      if (updateResponse.status !== 200) {
        console.error("Update failed with status:", updateResponse.status);
        alert("Update failed: " + updateResponse.status);
      }


      setReportData(result);
      setShowReport(true);
      setTimeout(() => {
        handleClose();
      }, 3000)


      // Proceed with the potentially problematic last update
      // const updateMillInvoiceUrl = `${API_URL}/updatemillinvoiceno?doc_date=${fromDate}&vehicle_no=${vehicleNo}&Company_Code=${Company_Code}&Year_Code=${Year_Code}&do_no=${doNo}`;
      const updateMillInvoiceUrl = `${API_URL}/updatemillinvoiceno?doNo=${doNo}&millDoc_No=${millDoc_No}&Company_Code=${Company_Code}&Year_Code=${Year_Code}&ewayBillNo=${ewayBillNo}`;
      const updateMillInvoiceResponse = await axios.put(updateMillInvoiceUrl);
      if (updateMillInvoiceResponse.status !== 200) {
        console.error("Failed to update mill invoice number:", updateMillInvoiceResponse.status);
      }

    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred: ' + error.message);
    } finally {
    }
  };

  const handleCloseReport = () => {
    setShowReport(false);
    handleClose();
    navigate('/ewaybill');
  };

  useEffect(() => {
    let isMounted = true;
    const fetchRecord = async () => {
      try {
        const response = await axios.get(`${API_URL}/get_eWayBill_generationData?Company_Code=${Company_Code}&Year_Code=${Year_Code}&saleId=${saleId}`);
        if (response.status === 200) {
          const data = response.data.all_data[0];
          if (isMounted) {
            setFetchedData(response.data);
            setFormData(prevFormData => ({
              ...prevFormData,
              ...data,
            }));
          }
        } else {
          console.error("Failed to fetch data:", response.status, response.statusText);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        if (isMounted) {
          setFetchedData([]);
        }
      }
    };
    fetchRecord();
    return () => {
      isMounted = false;
    };
  }, []);

  // Resizer object at the time of resize the modal.
  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      entries.forEach(entry => {
      });
    });
    if (resizableRef.current) {
      observer.observe(resizableRef.current);
    }
    return () => observer.disconnect();
  }, []);


  const handleEdit = () => {
    setIsEditMode(true);
  }

  const handleCancel = () => {
    handleClose()
  }

  return (
    <div>
      <Paper ref={resizableRef} elevation={3} sx={{ p: 4, marginTop: 2 }}>

        <Typography variant="h4" align="center">
          eWayBill eInvoice
        </Typography>
        <Grid container spacing={2} sx={{ marginTop: -2, justifyContent: 'flex-end' }}>
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              onClick={handleEdit}
              disabled
            >
              Edit
            </Button>
          </Grid>

          <Grid item>
            <Button
              variant="contained"
              color="primary"
              onClick={handleCancel}
            >
              Cancel
            </Button>
          </Grid>

          <Grid item>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}

            >
              Generate eWayBill eInvoice
            </Button>
          </Grid>
        </Grid>

        <Box
          sx={doubleLineStyle}
        >
          <Typography variant="h6" gutterBottom>
            Transaction Details
          </Typography>
        </Box>
        <FormGroup>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={1} marginTop={-2}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Supply Type</InputLabel>
                <Select
                  name="supplyType"
                  value={formData.supplyType}
                  onChange={handleChange}
                  size="small"
                  label="Supply Type"

                >
                  <MenuItem value="B2B">B2B</MenuItem>
                  <MenuItem value="SEZWP">SEZWP</MenuItem>
                  <MenuItem value="SEZWOP">SEZWOP</MenuItem>
                  <MenuItem value="EXP">EXP</MenuItem>
                  <MenuItem value="WP">WP</MenuItem>
                  <MenuItem value="EXPWOP">EXPWOP</MenuItem>
                  <MenuItem value="DXEP">DXEP</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={1.5} marginTop={-2}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Reverse Charge</InputLabel>
                <Select
                  name="reverseCharge"
                  value={formData.reverseCharge}
                  onChange={handleChange}
                  size="small"
                  label="Reverse Charge"

                >
                  <MenuItem value="Y">Yes</MenuItem>
                  <MenuItem value="N">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={1} marginTop={-2}>
              <FormControl fullWidth margin="normal">
                <InputLabel>IGSTOnIntra</InputLabel>
                <Select
                  name="IGSTOnIntra"
                  value={formData.IGSTOnIntra}
                  onChange={handleChange}
                  size="small"
                  label="IGSTOnIntra"

                >
                  <MenuItem value="Y">Yes</MenuItem>
                  <MenuItem value="N">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={2} marginTop={-2}>
              <TextField
                label="Doc No"
                name="Doc_No"
                value={`SB${formData.year}-${formData.Doc_No}`}
                onChange={handleChange}
                variant="outlined"
                fullWidth
                margin="normal"
                size="small"
                disabled
              />
            </Grid>
            <Grid item xs={12} sm={1.1} marginTop={-2}>
              <TextField
                label="Doc Date"
                type="date"
                name="doc_date"
                value={formData.doc_date}
                onChange={handleChange}
                variant="outlined"
                fullWidth
                margin="normal"
                size="small"

                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={1.7} marginTop={-2}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Doc Type</InputLabel>
                <Select
                  name="docType"
                  value={formData.docType}
                  onChange={handleChange}
                  size="small"
                  label="Doc Type"

                >
                  <MenuItem value="INV">Invoice</MenuItem>
                  <MenuItem value="CRN">Credit Note</MenuItem>
                  <MenuItem value="DBN">Debit Note</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Box
                sx={doubleLineStyle}
              >
                <Typography variant="h6" gutterBottom>
                  Seller Details
                </Typography>
              </Box>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4} marginTop={-2}>
                  <TextField
                    label="GSTIN"
                    name="GST"
                    value={formData.GST}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"

                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={8} marginTop={-2}>
                  <TextField
                    label="Legal Name"
                    name="Company_Name_E"
                    value={formData.Company_Name_E}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"

                  />
                </Grid>
              </Grid>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={5} marginTop={-2}>
                  <TextField
                    label="Address"
                    name="Address_E"
                    value={formData.Address_E}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"

                    multiline
                    rows={2}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} marginTop={-2}>
                  <TextField
                    name="billFromAdd"
                    value={''}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"

                  />
                </Grid>
              </Grid>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4} marginTop={-2}>
                  <TextField
                    label="Location"
                    name="City_E"
                    value={formData.City_E}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"

                  />
                </Grid>
                <Grid item xs={12} sm={4} marginTop={-2}>
                  <TextField
                    label="PinCode"
                    name="PIN"
                    value={formData.PIN}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"

                  />
                </Grid>
                <Grid item xs={12} sm={4} marginTop={-2}>
                  <TextField
                    label="State"
                    name="State_E"
                    value={formData.State_E}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"

                  />
                </Grid>
              </Grid>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4} marginTop={-2}>
                  <TextField
                    label="State Code"
                    name="GSTStateCode"
                    value={formData.GSTStateCode}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"

                  />
                </Grid>
                <Grid item xs={12} sm={4} marginTop={-2}>
                  <TextField
                    label="Phone"
                    name="PHONE"
                    value={phoneNo}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"

                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={4} marginTop={-2}>
                  <TextField
                    label="Email"
                    name="EmailId"
                    value={emailId}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"

                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box
                sx={doubleLineStyle}
              >
                <Typography variant="h6" gutterBottom>
                  Buyer Details
                </Typography>
              </Box>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4} marginTop={-2}>
                  <TextField
                    label="GSTIN"
                    name="BuyerGst_No"
                    value={formData.BuyerGst_No}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"

                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={8} marginTop={-2}>
                  <TextField
                    label="Legal Name"
                    name="Buyer_Name"
                    value={formData.Buyer_Name}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"

                  />
                </Grid>
              </Grid>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={5} marginTop={-2}>
                  <TextField
                    label="Address"
                    name="Buyer_Address"
                    value={formData.Buyer_Address}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"

                    multiline
                    rows={2}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} marginTop={-2}>
                  <TextField
                    name="BuyerAdd1"
                    value={""}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"

                  />
                </Grid>
              </Grid>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4} marginTop={-2}>
                  <TextField
                    label="Location"
                    name="Buyer_City"
                    value={formData.Buyer_City}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"

                  />
                </Grid>
                <Grid item xs={12} sm={4} marginTop={-2}>
                  <TextField
                    label="PinCode"
                    name="Buyer_Pincode"
                    value={formData.Buyer_Pincode}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"

                  />
                </Grid>
                <Grid item xs={12} sm={4} marginTop={-2}>
                  <TextField
                    label="State"
                    name="Buyer_State_name"
                    value={formData.Buyer_State_name}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"

                  />
                </Grid>
              </Grid>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={2} marginTop={-2}>
                  <TextField
                    label="State Code"
                    name="Buyer_State_Code"
                    value={formData.Buyer_State_Code}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"

                  />
                </Grid>
                <Grid item xs={12} sm={2} marginTop={-2}>
                  <TextField
                    label="POS"
                    name="pos"
                    value={formData.Buyer_State_Code}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"

                  />
                </Grid>
                <Grid item xs={12} sm={4} marginTop={-2}>
                  <TextField
                    label="Phone"
                    name="Buyer_Phno"
                    value={formData.Buyer_Phno}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"

                  />
                </Grid>
                <Grid item xs={12} sm={4} marginTop={-2}>
                  <TextField
                    label="Email"
                    name="Buyer_Email_Id"
                    value={formData.Buyer_Email_Id}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"

                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Box
                sx={doubleLineStyle}
              >
                <Typography variant="h6" gutterBottom>
                  Dispatch From
                </Typography>
              </Box>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4} marginTop={-2}>
                  <TextField
                    label="GSTIN"
                    name="DispatchGst_No"
                    value={formData.DispatchGst_No}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"

                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={8} marginTop={-2}>
                  <TextField
                    label="Legal Name"
                    name="Dispatch_Name"
                    value={formData.Dispatch_Name}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"

                  />
                </Grid>
              </Grid>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={5} marginTop={-2}>
                  <TextField
                    label="Address"
                    name="Dispatch_Address"
                    value={formData.Dispatch_Address}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"

                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid item xs={12} sm={6} marginTop={-2}>
                  <TextField
                    name="dispatchAdd"
                    value={""}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"

                  />
                </Grid>
              </Grid>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4} marginTop={-2}>
                  <TextField
                    label="Location"
                    name="DispatchCity_City"
                    value={formData.DispatchCity_City}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"

                  />
                </Grid>
                <Grid item xs={12} sm={4} marginTop={-2}>
                  <TextField
                    label="State"
                    name="Dispatch_GSTStateCode"
                    value={formData.Dispatch_GSTStateCode}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"

                  />
                </Grid>
                <Grid item xs={12} sm={4} marginTop={-2}>
                  <TextField
                    label="PinCode"
                    name="Dispatch_Pincode"
                    value={formData.Dispatch_Pincode}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"

                  />
                </Grid>

              </Grid>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box
                sx={doubleLineStyle}
              >
                <Typography variant="h6" gutterBottom>
                  Dispatch To
                </Typography>
              </Box>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4} marginTop={-2}>
                  <TextField
                    label="GSTIN"
                    name="ShipToGst_No"
                    value={formData.ShipToGst_No}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"

                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={8} marginTop={-2}>
                  <TextField
                    label="Legal Name"
                    name="ShipTo_Name"
                    value={formData.ShipTo_Name}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"

                  />
                </Grid>
              </Grid>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={5} marginTop={-2}>
                  <TextField
                    label="Address"
                    name="ShipTo_Address"
                    value={formData.ShipTo_Address}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"

                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid item xs={12} sm={6} marginTop={-2}>
                  <TextField
                    name="shipToAdd"
                    value={""}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"

                  />
                </Grid>
              </Grid>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4} marginTop={-2}>
                  <TextField
                    label="Location"
                    name="ShipTo_City"
                    value={formData.ShipTo_City}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"

                  />
                </Grid>
                <Grid item xs={12} sm={4} marginTop={-2}>
                  <TextField
                    label="State"
                    name="ShipTo_GSTStateCode"
                    value={formData.ShipTo_GSTStateCode}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"

                  />
                </Grid>
                <Grid item xs={12} sm={4} marginTop={-2}>
                  <TextField
                    label="PinCode"
                    name="ShipTo_Pincode"
                    value={formData.ShipTo_Pincode}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"

                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={12}>
              <Box
                sx={doubleLineStyle}
              >
                <Typography variant="h6" gutterBottom>
                  Item Details
                </Typography>
              </Box>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={1.5} marginTop={-2}>
                  <TextField
                    label="Product Name"
                    name="System_Name_E"
                    value={formData.System_Name_E}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"

                  />
                </Grid>
                <Grid item xs={12} sm={1.5} marginTop={-2}>
                  <TextField
                    label="Description"
                    name="itemDescription"
                    value={formData.System_Name_E}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"

                  />
                </Grid>
                <Grid item xs={12} sm={1.5} marginTop={-2}>
                  <TextField
                    label="HSN"
                    name="HSN"
                    value={formData.HSN}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"

                  />
                </Grid>
                <Grid item xs={12} sm={1.5} marginTop={-2}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Is Service</InputLabel>
                    <Select
                      name="IsService"
                      value={formData.IsService}
                      onChange={handleChange}
                      size="small"
                      label="IsService"

                    >
                      <MenuItem value="Y">Yes</MenuItem>
                      <MenuItem value="N">No</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={1.5} marginTop={-2}>
                  <TextField
                    label="Quantity"
                    name="NETQNTL"
                    value={formData.NETQNTL}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"

                  />
                </Grid>
                <Grid item xs={12} sm={2} marginTop={-2}>
                  <TextField
                    label="Unit"
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"

                  />
                </Grid>
                <Grid item xs={12} sm={1.5} marginTop={-2}>
                  <TextField
                    label="Unit Price"
                    name="rate"
                    value={(parseFloat(formData.rate) || 0) + (parseFloat(formData.LESS_FRT_RATE) || 0)}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"

                  />
                </Grid>
              </Grid>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={1.5} marginTop={-2}>
                  <TextField
                    label=" Assessable Value "
                    name="assessableValue"
                    value={formData.TaxableAmount}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"

                  />
                </Grid>
                <Grid item xs={12} sm={1.5} marginTop={-2}>
                  <TextField
                    label=" CGST Value"
                    name="CGSTRate"
                    value={formData.CGSTRate}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"

                  />
                </Grid>
                <Grid item xs={12} sm={1.5} marginTop={-2}>
                  <TextField
                    label=" SGST Value "
                    name="SGSTRate"
                    value={formData.SGSTRate}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"

                  />
                </Grid>
                <Grid item xs={12} sm={1.5} marginTop={-2}>
                  <TextField
                    label=" IGST Value "
                    name="IGSTRate"
                    value={formData.IGSTRate}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"

                  />
                </Grid>
                <Grid item xs={12} sm={1.5} marginTop={-2}>
                  <TextField
                    label=" Cess Value "
                    name="cessValue"
                    value={formData.cessValue}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"

                  />
                </Grid>
                <Grid item xs={12} sm={1.5} marginTop={-2}>
                  <TextField
                    label=" Total Invoice Value "
                    name="totalInvoiceValue"
                    value={
                      (parseFloat(formData.TaxableAmount) || 0) +
                      (parseFloat(formData.CGSTAmount) || 0) +
                      (parseFloat(formData.SGSTAmount) || 0) +
                      (parseFloat(formData.IGSTAmount) || 0) +
                      (parseFloat(formData.cessValue) || 0) +
                      (parseFloat(formData.stateCessValue) || 0) +
                      (parseFloat(formData.otherAmount) || 0)
                    }

                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"

                  />
                </Grid>
                <Grid item xs={12} sm={1.5} marginTop={-2}>
                  <TextField
                    label=" State Cess Value "
                    name="stateCessValue"
                    value={formData.stateCessValue}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"

                  />
                </Grid>
              </Grid>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={2} marginTop={-2}>
                  <TextField
                    label="Discount"
                    name="discount"
                    value={formData.discount}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"

                  />
                </Grid>
                <Grid item xs={12} sm={2} marginTop={-2}>
                  <TextField
                    label="Other Charge"
                    name="otherAmount"
                    value={formData.otherAmount}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"

                  />
                </Grid>
                <Grid item xs={12} sm={2} marginTop={-2}>
                  <TextField
                    label="GST Rate"
                    name="GSTRate"
                    value={formData.GSTRate}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"

                  />
                </Grid>
                <Grid item xs={12} sm={2} marginTop={-2}>
                  <TextField
                    label="CGST Amount"
                    name="CGSTAmount"
                    value={formData.CGSTAmount}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"

                  />
                </Grid>
                <Grid item xs={12} sm={2} marginTop={-2}>
                  <TextField
                    label="SGST Amount"
                    name="SGSTAmount"
                    value={formData.SGSTAmount}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"

                  />
                </Grid>
                <Grid item xs={12} sm={2} marginTop={-2}>
                  <TextField
                    label="IGST Amount"
                    name="IGSTAmount"
                    value={formData.IGSTAmount}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"

                  />
                </Grid>
              </Grid>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={2} marginTop={-2}>
                  <TextField
                    label="CESS Amount"
                    name="cessAmount"
                    value={formData.cessAmount}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"

                  />
                </Grid>
                <Grid item xs={12} sm={2} marginTop={-2}>
                  <TextField
                    label="Assessable Amount"
                    name="assessableAmount"
                    value={formData.TaxableAmount}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"

                  />
                </Grid>
                <Grid item xs={12} sm={2} marginTop={-2}>
                  <TextField
                    label="Total Item Amount"
                    name="totalItemAmount"
                    value={
                      (parseFloat(formData.TaxableAmount) || 0) +
                      (parseFloat(formData.CGSTAmount) || 0) +
                      (parseFloat(formData.SGSTAmount) || 0) +
                      (parseFloat(formData.IGSTAmount) || 0) +
                      (parseFloat(formData.cessValue) || 0) +
                      (parseFloat(formData.stateCessValue) || 0) +
                      (parseFloat(formData.otherAmount) || 0)
                    }
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"

                  />
                </Grid>
                <Grid item xs={12} sm={2} marginTop={-2}>
                  <TextField
                    label="Total Inv Amount"
                    name="totalInvAmount"
                    value={formData.TaxableAmount}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"

                  />
                </Grid>
              </Grid>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={2} marginTop={-2}>
                  <TextField
                    label="Transporter Name"
                    name="transporterName"
                    value={formData.transporterName}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"

                  />
                </Grid>
                <Grid item xs={12} sm={1.5} marginTop={-2}>
                  <TextField
                    label="Transporter ID "
                    name="transporterID"
                    value={formData.transporterID}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"

                  />
                </Grid>
                <Grid item xs={12} sm={1.5} marginTop={-2}>
                  <TextField
                    label="Approximate Distance(in KM) "
                    name="Distance"
                    value={formData.Distance}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"

                  />
                </Grid>
                <Grid item xs={12} sm={1.5} marginTop={-2}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Mode</InputLabel>
                    <Select
                      name="tranceMode"
                      value={formData.tranceMode}
                      onChange={handleChange}
                      size="small"
                      label="Mode"

                    >
                      <MenuItem value="1">Road</MenuItem>
                      <MenuItem value="2">Rail</MenuItem>
                      <MenuItem value="3">Air</MenuItem>
                      <MenuItem value="4">Ship</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={1.5} marginTop={-2}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel> Vehicle Type </InputLabel>
                    <Select
                      name="vehicleType"
                      value={formData.vehicleType}
                      onChange={handleChange}
                      size="small"
                      label="  Vehicle Type "

                    >
                      <MenuItem value="R">Regular</MenuItem>
                      <MenuItem value="O">Over Dimensional Cargo</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={2} marginTop={-2}>
                  <TextField
                    label="Vehicle Number "
                    name="LORRYNO"
                    value={formData.LORRYNO}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"

                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={12}>
              <Box
                sx={doubleLineStyle}
              >
                <Typography variant="h6" gutterBottom>
                  Payment Details
                </Typography>
              </Box>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={2} marginTop={-2}>
                  <TextField
                    label="Mode Of Payment "
                    name="Mode_of_Payment"
                    value={formData.Mode_of_Payment}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"

                  />
                </Grid>
                <Grid item xs={12} sm={2} marginTop={-2}>
                  <TextField
                    label="Account Details"
                    name="Account_Details"
                    value={formData.Account_Details}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"

                  />
                </Grid>
                <Grid item xs={12} sm={2} marginTop={-2}>
                  <TextField
                    label="Branch"
                    name="Branch"
                    value={formData.Branch}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"

                  />
                </Grid>
                <Grid item xs={12} sm={2} marginTop={-2}>
                  <TextField
                    label="Payee Name"
                    name="payeeName"
                    value={formData.payeeName}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"

                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </FormGroup>
        <Dialog open={showReport} onClose={handleCloseReport} fullWidth maxWidth="lg">
          <DialogTitle>Sale Bill & EWay Bill Report</DialogTitle>
          <DialogContent>
            {showReport && <MergedBillReport saleId={saleId} ewayBillNo={ewayBillNo} onClose={handleCloseReport} />}
          </DialogContent>
        </Dialog>
      </Paper>
    </div>
  );
};

export default EWayBillNEInvoiceGen;
