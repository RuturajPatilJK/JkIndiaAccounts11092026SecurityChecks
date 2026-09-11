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
  Dialog,
  DialogTitle,
  DialogContent,
} from "@mui/material";
import axios from "axios";
import { initialFormData } from "./InitialEInvoiceData";
import { GSPTokenGenerator } from "../TokenGeneration/AuthTokenEwayBillGenrate";
import { invoiceDataEwayBills } from "./InvoiceBody";
import { useNavigate } from "react-router-dom";
import { CircularProgress } from '@mui/material';
import Swal from "sweetalert2";

const emailId = process.env.REACT_APP_EMAILID;
const phoneNo = process.env.REACT_APP_PHONENO;

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

const EInvoiceGeneration = ({
  doc_no,
  do_no,
  handleClose,
  tran_type,
  Company_Code,
  Year_Code,
}) => {
 
  const [formData, setFormData] = useState(initialFormData);
  const resizableRef = useRef(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const [fetchData, setFetchedData] = useState([]);
  const { generateTokenData } = GSPTokenGenerator();
  const [isLoading, setIsLoading] = useState(false);


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
      EmailId:emailId,
      IGSTOnIntra: prev.Company_Name_E !== prev.Buyer_Name ? "N" : "Y",
      docType: ["DN", "DS"].includes(tran_type)
        ? "DBN"
        : ["CN", "CS"].includes(tran_type)
        ? "CRN"
        : prev.docType,
      Doc_No: `${tran_type}${prev.year}-${prev.Doc_No || doc_no}`,
      unit: tran_type === "SO" ? "MTS" : prev.unit,
    }));
  }, [formData.Company_Name_E, formData.Buyer_Name, tran_type, doc_no]);


  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    
    try {
      const token = await generateTokenData();
      if (!token) {
        Swal.fire({
          icon: "error",
          title: "Token Generation Failed",
          text: "Unable to generate a token. Please try again.",
        });
        return;
      }
  
      const apiUrl = `${API_URL}/create-invoice`;
      const headers = {
        "Content-Type": "application/json",
      };
      
      let invoiceData = invoiceDataEwayBills(formData, tran_type);
      invoiceData.token = token;
  
      const response = await axios.post(apiUrl, invoiceData, { headers });
      if (!response.data.success) {
        Swal.fire({
          icon: "error",
          title: "Invoice Generation Failed",
          text: response.data.message,
        });
        return;
      }
  
      const result = response.data.result;
      const updateData = {
        AckNo: result.AckNo,
        Irn: result.Irn,
        SignedQRCode: result.SignedQRCode,
      };
  
      const updateUrl = `${API_URL}/updateEInvoiceData?doc_no=${doc_no}&Company_Code=${Company_Code}&Year_Code=${Year_Code}&tran_type=${tran_type}&do_no=${do_no}`;
      const updateEInvoiceResponse = await axios.put(updateUrl, updateData);
  
      if (updateEInvoiceResponse.status === 200) {
        Swal.fire({
          icon: "success",
          title: "Invoice Generated!",
          text: `Successfully generated invoice for Doc No: ${doc_no}.`,
          confirmButtonColor: "#3085d6",
        }).then(() => {
          window.location.reload(); 
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error Updating Invoice Data",
          text: "Failed to update AckNo/Irn. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({
        icon: "error",
        title: "An Error Occurred",
        text: error.message,
      });
    } finally {
      setTimeout(() => {
        handleClose();
      }, 500);
      setIsLoading(false);
    }
  };

  
  useEffect(() => {
    let isMounted = true; 
    const fetchRecord = async () => {
      try {
        let url = "";
        if (['DN', 'CN', 'DS', 'CS'].includes(tran_type)) {
          url = `${API_URL}/get_eWayBill_generationData_for_DebitCredit?Company_Code=${Company_Code}&Year_Code=${Year_Code}&doc_no=${doc_no}&tran_type=${tran_type}`;
        } else if (tran_type === 'RB') {
          url = `${API_URL}/get_eWayBill_generationData_for_ServiceBill?Company_Code=${Company_Code}&Year_Code=${Year_Code}&doc_no=${doc_no}`;
        } 
        else if (tran_type === 'SB') {
          url = `${API_URL}/get_eInvoice_generationData_SB?Company_Code=${Company_Code}&Year_Code=${Year_Code}&doc_no=${doc_no}&do_no=${do_no}&tran_type=${tran_type}`;
        } 
           else if (tran_type === 'SO') {
          url = `${API_URL}/get_eInvoice_generationData_SB?Company_Code=${Company_Code}&Year_Code=${Year_Code}&doc_no=${doc_no}&do_no=${do_no}&tran_type=${tran_type}`;
        } 

        else if (tran_type === 'PR') {
          url = `${API_URL}/getEInvoiceGeneration_PR?Company_Code=${Company_Code}&Year_Code=${Year_Code}&doc_no=${doc_no}`;
        } 

        else if (tran_type === 'RS') {
          url = `${API_URL}/get_RS_EwayBill_EInvoiceData?Company_Code=${Company_Code}&Year_Code=${Year_Code}&doc_no=${doc_no}`;
        } 
        else if (tran_type === 'LV') {
          url = `${API_URL}/get_LV_EInvoiceData?Company_Code=${Company_Code}&Year_Code=${Year_Code}&doc_no=${doc_no}`;
        } 
        if (url) {
          const response = await axios.get(url);
          if (response.status === 200) {
            const data = response.data.all_data[0];
            if (isMounted) {
              setFetchedData(response.data);
              setFormData((prevFormData) => ({
                ...prevFormData,
                ...data,
              }));
            }
          } else {
            console.error("Failed to fetch data:", response.status, response.statusText);
          }
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
  }, [API_URL, Company_Code, Year_Code, doc_no, tran_type]);
  

  // Resizer object at the time of resize the modal.
  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      entries.forEach((entry) => {});
    });
    if (resizableRef.current) {
      observer.observe(resizableRef.current);
    }
    return () => observer.disconnect();
  }, []);

  const handleEdit = () => {
    setIsEditMode(true);
  };

  const handleCancel = () => {
    handleClose();
  };

  return (
    <div>
      <Paper ref={resizableRef} elevation={3} sx={{ p: 4, marginTop: 2 }}>
        <Grid
          container
          spacing={2}
          sx={{ marginTop: -2, justifyContent: "flex-end" }}
        >
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
            <Button variant="contained" color="primary" onClick={handleCancel}>
              Cancel
            </Button>
          </Grid>

          <Grid item>
            <Button variant="contained" color="primary" onClick={handleSubmit}  disabled={isLoading} 
            startIcon={isLoading ? <CircularProgress size={24} /> : null}>
              
              {isLoading ? 'Loading...' : 'Generate eInvoice'} 
            </Button>
          </Grid>
        </Grid>

        <Box sx={doubleLineStyle}>
          <Typography variant="h6" gutterBottom>
            Transaction Details
          </Typography>
        </Box>
        <FormGroup>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={2} marginTop={-2}>
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
                  <MenuItem value="EXPWP">EXPWP</MenuItem>
                  <MenuItem value="DXEP">DXEP</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2} marginTop={-2}>
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
            <Grid item xs={12} sm={2} marginTop={-2}>
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
                value={formData.Doc_No}
                onChange={handleChange}
                variant="outlined"
                fullWidth
                margin="normal"
                size="small"
                disabled
              />
            </Grid>
            <Grid item xs={12} sm={2} marginTop={-2}>
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
              <Box sx={doubleLineStyle}>
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
                    value={formData.EmailId}
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
              <Box sx={doubleLineStyle}>
                <Typography variant="h6" gutterBottom>
                  Buyer Details
                </Typography>
              </Box>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4} marginTop={-2}>
                  <TextField
                    label="GSTIN"
                    name="BuyerGst_No"
                    value={
                      ["DN", "CN", "DS", "CS"].includes(tran_type)
                        ? formData.ShipToGst_No
                        : formData.BuyerGst_No
                    }
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
                    value={
                      ["DN", "CN", "DS", "CS"].includes(tran_type)
                        ? formData.ShipTo_Name
                        : formData.Buyer_Name
                    }
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
                    value={
                      ["DN", "CN", "DS", "CS"].includes(tran_type)
                        ? formData.ShipTo_Address
                        : formData.Buyer_Address
                    }
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
                    value={
                      ["DN", "CN", "DS", "CS"].includes(tran_type)
                        ? formData.ShipTo_City
                        : formData.Buyer_City
                    }
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
                    value={
                      ["DN", "CN", "DS", "CS"].includes(tran_type)
                        ? formData.ShipTo_Pincode
                        : formData.Buyer_Pincode
                    }
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
                    value={
                      ["DN", "CN", "DS", "CS"].includes(tran_type)
                        ? ""
                        : formData.Buyer_State_name
                    }
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
                    value={
                      ["DN", "CN", "DS", "CS"].includes(tran_type)
                        ? formData.ShipTo_GSTStateCode
                        : formData.Buyer_State_Code
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
                    label="POS"
                    name="pos"
                    value={
                      ["DN", "CN", "DS", "CS"].includes(tran_type)
                        ? formData.ShipTo_GSTStateCode
                        : formData.Buyer_State_Code
                    }
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
                    value={
                      ["DN", "CN", "DS", "CS"].includes(tran_type)
                        ? ""
                        : formData.Buyer_Phno
                    }
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
                    value={
                      ["DN", "CN", "DS", "CS"].includes(tran_type)
                        ? ""
                        : formData.Buyer_Email_Id
                    }
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
              <Box sx={doubleLineStyle}>
                <Typography variant="h6" gutterBottom>
                  Dispatch From
                </Typography>
              </Box>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4} marginTop={-2}>
                  <TextField
                    label="GSTIN"
                    name="DispatchGst_No"
                    value={
                      tran_type === "RB" || tran_type ==="LV"
                        ? formData.GST
                        : formData.DispatchGst_No
                    }
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
                    value={
                      tran_type === "RB" || tran_type ==="LV"
                        ? formData.Company_Name_E
                        : formData.Dispatch_Name
                    }
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
                    value={
                       tran_type === "RB" || tran_type ==="LV"
                        ? formData.Address_E
                        : formData.Dispatch_Address
                    }
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
                    value={
                      tran_type === "RB" || tran_type ==="LV"
                        ? formData.City_E
                        : formData.DispatchCity_City
                    }
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
                    value={
                       tran_type === "RB" || tran_type ==="LV"
                        ? formData.GSTStateCode
                        : formData.Dispatch_GSTStateCode
                    }
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
                    value={
                      tran_type === "RB" || tran_type ==="LV"
                        ? formData.PIN
                        : formData.Dispatch_Pincode
                    }
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
              <Box sx={doubleLineStyle}>
                <Typography variant="h6" gutterBottom>
                  Dispatch To
                </Typography>
              </Box>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4} marginTop={-2}>
                  <TextField
                    label="GSTIN"
                    name="ShipToGst_No"
                    value={
                      tran_type === "RB" || tran_type ==="LV"
                        ? formData.BuyerGst_No
                        : formData.ShipToGst_No
                    }
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
                    value={
                      tran_type === "RB" || tran_type ==="LV"
                        ? formData.Buyer_Name
                        : formData.ShipTo_Name
                    }
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
                    value={
                      tran_type === "RB" || tran_type ==="LV"
                        ? formData.Buyer_Address
                        : formData.ShipTo_Address
                    }
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
                    value={
                       tran_type === "RB" || tran_type ==="LV"
                        ? formData.Buyer_City
                        : formData.ShipTo_City
                    }
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
                    value={
                      tran_type === "RB" || tran_type ==="LV"
                        ? formData.Buyer_State_Code
                        : formData.ShipTo_GSTStateCode
                    }
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
                    value={
                      tran_type === "RB" || tran_type ==="LV"
                        ? formData.Buyer_Pincode
                        : formData.ShipTo_Pincode
                    }
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
              <Box sx={doubleLineStyle}>
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
                    value={formData.HSN || "17011490"}
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
                    value={
                      (parseFloat(formData.rate) || 0) +
                      (parseFloat(formData.LESS_FRT_RATE) || 0)
                    }
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
                    value={parseFloat(
                      (parseFloat(formData.TaxableAmount) || 0) +
                        (parseFloat(formData.CGSTAmount) || 0) +
                        (parseFloat(formData.SGSTAmount) || 0) +
                        (parseFloat(formData.IGSTAmount) || 0) +
                        (parseFloat(formData.cessAmount) || 0) +
                        (parseFloat(formData.stateCessValue) || 0) +
                        (parseFloat(formData.otherAmount) || 0)
                    ).toFixed(2)}
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
                    value={parseFloat(
                      (parseFloat(formData.TaxableAmount) || 0) +
                        (parseFloat(formData.CGSTAmount) || 0) +
                        (parseFloat(formData.SGSTAmount) || 0) +
                        (parseFloat(formData.IGSTAmount) || 0) +
                        (parseFloat(formData.cessAmount) || 0) +
                        (parseFloat(formData.stateCessValue) || 0) +
                        (parseFloat(formData.otherAmount) || 0)
                    ).toFixed(2)}
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
              <Box sx={doubleLineStyle}>
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
      </Paper>
    </div>
  );
};

export default EInvoiceGeneration;