import React, { useState, useEffect } from "react";
import {
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Container,
  Box,
  Paper,
  FormGroup,
  Grid,
} from "@mui/material";
import axios from "axios";
const API_URL = process.env.REACT_APP_API;

const EwayBillGeneration = () => {
  const companyCode = sessionStorage.getItem("Company_Code");
  const YearCode = sessionStorage.getItem("Year_Code");

  const [formData, setFormData] = useState({
    Doc_No: "",
    supplyType: "",
    subType: "",
    docType: "",
    doc_date: "",
    tranType: "",
    Company_Name_E: "",
    Address_E: "",
    GST: "",
    City_E: "",
    State_E: "",
    PIN: "",
    EmailId: "",
    GSTRate: "",
    LESS_FRT_RATE: 0.00,
    LORRYNO: "",
    Buyer_Name: "",
    Buyer_Address: "",
    BuyerGst_No: "",
    Buyer_City: "",
    Buyer_State_Code: 0,
    Buyer_State_name: "",
    Buyer_Phno: "",
    Buyer_Email_Id: "",
    Buyer_State_name: "",
    Buyer_Phno: "",
    Buyer_Pincode: "",
    System_Name_E: "",
    Mode_of_Payment: "",
    ShipToGst_No: "",
    ShipTo_Address: "",
    ShipTo_City: "",
    ShipTo_GSTStateCode: 0,
    ShipTo_Name: "",
    ShipTo_Pincode: 0,
    itemDescription: "",
    HSN: "",
    NETQNTL: "",
    unit: "",
    taxableValue: "",
    CGSTRate: "",
    SGSTRate: "",
    IGSTRate: "",
    CGSTAmount: "",
    SGSTAmount: "",
    IGSTAmount: "",
    DispatchCity_City: " ",
    DispatchGst_No: "",
    Dispatch_Address: "",
    Dispatch_GSTStateCode: 0,
    Dispatch_Name: "",
    Dispatch_Pincode: 0,
    Distance: 0.00,
    PHONE: "",
    Account_Details: "",
    Branch: "",
    IsService: "",
    cessAdvolRate: "",
    cessNonAdvolRate: "",
    TaxableAmount: "",
    cessAdvolAmount: "",
    cessNonAdvolAmount: "",
    otherAmount: "",
    totalBillAmount: "",
    transporterName: "",
    transporterID: "",
    approximateDistance: "",
    tranceMode: "",
    vehicleType: "",
    rate: ""
  });

  const [fetchData, setFetchedData] = useState([])

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
  };

  const fetchRecord = async () => {
 

    const response = await axios.get(
      `${API_URL}/get_eWayBill_generationData?Company_Code=${companyCode}&Year_Code=${YearCode}&saleId=18160`
    );
    if (response.status === 200) {
      const data = response.data.all_data[0];
      setFetchedData(data)
    } else {
      console.error(
        "Failed to fetch last data:",
        response.status,
        response.statusText
      );
    }
  };

  useEffect(() => {
    fetchRecord()
  }, []);

  return (
    <div>
      <Paper elevation={3} sx={{ p: 4, marginTop: 2 }}>
        <Grid container spacing={3} sx={{ marginLeft: 95 }}>
          <Typography variant="h6" gutterBottom>
            EWayBill Generation
          </Typography>
        </Grid>
        <Grid container spacing={6} sx={{ marginTop: -2 }}>
          <Box mt={2}>
            <Grid container spacing={2} sx={{ marginLeft: 55 }}>
              <Grid item xs={8} sm={2}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSubmit}
                  fullWidth
                >
                  Edit
                </Button>
              </Grid>
              <Grid item xs={8} sm={2}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSubmit}
                  fullWidth
                >
                  Cancel
                </Button>
              </Grid>
              <Grid item xs={8} sm={4}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSubmit}
                  fullWidth
                >
                  Generate eWayBill
                </Button>
              </Grid>
              <Grid item xs={8} sm={4}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSubmit}
                  fullWidth
                >
                  Update Pincode
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Grid>
        <Box
          sx={{
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
          }}
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
                  <MenuItem value="O">Outward</MenuItem>
                  <MenuItem value="I">Inward</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={1.5} marginTop={-2}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Sub Type</InputLabel>
                <Select
                  name="subType"
                  value={formData.subType}
                  onChange={handleChange}
                  size="small"
                  label="Sub Type"
                >
                  <MenuItem value="1">Supply</MenuItem>
                  <MenuItem value="3">Export</MenuItem>
                  <MenuItem value="4">Job Work</MenuItem>
                  <MenuItem value="9">SKD/CKD/Lots</MenuItem>
                  <MenuItem value="11">Recipient Not Known</MenuItem>
                  <MenuItem value="5">For Own Use</MenuItem>
                  <MenuItem value="12">Exhibition or Fairs</MenuItem>
                  <MenuItem value="10">Line Sales</MenuItem>
                  <MenuItem value="8">Others</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={1} marginTop={-2}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Doc Type</InputLabel>
                <Select
                  name="docType"
                  value={formData.docType}
                  onChange={handleChange}
                  size="small"
                  label="Doc Type"
                >
                  <MenuItem value="INV">Tax Invoice</MenuItem>
                  <MenuItem value="Y">Yes</MenuItem>
                  <MenuItem value="N">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={1} marginTop={-2}>
              <TextField
                label="Doc No"
                name="docNo"
                value={formData.docNo}
                onChange={handleChange}
                variant="outlined"
                fullWidth
                margin="normal"
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={1.1} marginTop={-2}>
              <TextField
                label="Doc Date"
                type="date"
                name="docDate"
                value={formData.docDate}
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
                <InputLabel>Transaction Type</InputLabel>
                <Select
                  name="tranType"
                  value={formData.tranType}
                  onChange={handleChange}
                  size="small"
                  label="Transaction Type"
                >
                  <MenuItem value="1">Regular</MenuItem>
                  <MenuItem value="2">Bill To-Ship To</MenuItem>
                  <MenuItem value="3">Bill Form-Dispatch From</MenuItem>
                  <MenuItem value="4">Combination of 2 and 3</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Box
                sx={{
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
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Bill From
                </Typography>
              </Box>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} marginTop={-2}>
                  <TextField
                    label="Name"
                    name="billFromName"
                    value={formData.billFromName}
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
                    label="GSTIN"
                    name="billFromGSTNo"
                    value={formData.billFromGSTNo}
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
                    label="State"
                    name="billFromState"
                    value={formData.billFromState}
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
                sx={{
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
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Dispatch From
                </Typography>
              </Box>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={5} marginTop={-2}>
                  <TextField
                    label="Address"
                    name="billFromAddress"
                    value={formData.billFromAddress}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={5} marginTop={-2}>
                  <TextField
                    name="billFromAddress"
                    // value={formData.bill}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
              </Grid>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={7} marginTop={-2}>
                  <TextField
                    label="Place"
                    name="billFromPlace"
                    value={formData.billFromPlace}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
              </Grid>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={3} marginTop={-2}>
                  <TextField
                    label="PinCode"
                    name="billFromPinCode"
                    value={formData.billFromPinCode}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={4} marginTop={-2}>
                  <TextField
                    name="billFromPinCode"
                    value={formData.billFromPinCode}
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
                sx={{
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
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Bill To
                </Typography>
              </Box>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} marginTop={-2}>
                  <TextField
                    label="Name"
                    name="billFromName"
                    value={formData.billFromName}
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
                    label="GSTIN"
                    name="billFromGSTNo"
                    value={formData.billFromGSTNo}
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
                    label="State"
                    name="billFromState"
                    value={formData.billFromState}
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
                sx={{
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
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Dispatch To
                </Typography>
              </Box>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={5} marginTop={-2}>
                  <TextField
                    label="Address"
                    name="billFromAddress"
                    value={formData.billFromAddress}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={5} marginTop={-2}>
                  <TextField
                    name="billFromAddress"
                    // value={formData.bill}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
              </Grid>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={7} marginTop={-2}>
                  <TextField
                    label="Place"
                    name="billFromPlace"
                    value={formData.billFromPlace}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
              </Grid>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={3} marginTop={-2}>
                  <TextField
                    label="PinCode"
                    name="billFromPinCode"
                    value={formData.billFromPinCode}
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
                sx={{
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
                  my: 3,
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Item Details
                </Typography>
              </Box>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={2} marginTop={-2}>
                  <TextField
                    label="Product Name"
                    name="itemName"
                    value={formData.itemName}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={2} marginTop={-2}>
                  <TextField
                    label="Description"
                    name="itemDescription"
                    value={formData.itemDescription}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={2} marginTop={-2}>
                  <TextField
                    label="HSN"
                    name="hsn"
                    value={formData.hsn}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={2} marginTop={-2}>
                  <TextField
                    label="Quantity"
                    name="quantity"
                    value={formData.quantity}
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
                <Grid item xs={12} sm={2} marginTop={-2}>
                  <TextField
                    label=" Value/Taxable Value(Rs) "
                    name="taxableValue"
                    value={formData.taxableValue}
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
                  <FormControl fullWidth margin="normal">
                    <InputLabel>CGST+SGST Rate(%)</InputLabel>
                    <Select
                      name="cgstSgstRate"
                      value={formData.cgstSgstRate}
                      onChange={handleChange}
                      size="small"
                      label="CGST+SGST Rate(%)"
                    >
                      <MenuItem value="Y">Yes</MenuItem>
                      <MenuItem value="N">No</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={2} marginTop={-2}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel> IGST Rate(%)</InputLabel>
                    <Select
                      name="igstRate"
                      value={formData.igstRate}
                      onChange={handleChange}
                      size="small"
                      label=" IGST Rate(%)"
                    >
                      <MenuItem value="Y">Yes</MenuItem>
                      <MenuItem value="N">No</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={2} marginTop={-2}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>CESS Advol Rate(%)</InputLabel>
                    <Select
                      name="cessAdvolRate"
                      value={formData.cessAdvolRate}
                      onChange={handleChange}
                      size="small"
                      label="CESS Advol Rate(%)"
                    >
                      <MenuItem value="Y">Yes</MenuItem>
                      <MenuItem value="N">No</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={2} marginTop={-2}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>CESS non Advol Rate</InputLabel>
                    <Select
                      name="cessNonAdvolRate"
                      value={formData.cessNonAdvolRate}
                      onChange={handleChange}
                      size="small"
                      label="CESS non Advol Rate"
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
                    label="Taxable Amount"
                    name="taxableAmount"
                    value={formData.taxableAmount}
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
                    name="cgstAmount"
                    value={formData.cgstAmount}
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
                    name="sgstAmount"
                    value={formData.sgstAmount}
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
                    name="igstAmount"
                    value={formData.igstAmount}
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
                    label="CESS Advol Amount"
                    name="cessAdvolAmount"
                    value={formData.cessAdvolAmount}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={2} marginTop={-2}>
                  <TextField
                    label="CESS non Advol Amount"
                    name="cessNonAdvolAmount"
                    value={formData.cessNonAdvolAmount}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={2} marginTop={-2}>
                  <TextField
                    label="Other Amount(+/-)"
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
                    label="Total Inv Amount"
                    name="totalBillAmount"
                    value={formData.totalBillAmount}
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
                sx={{
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
                  my: 3,
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Transport Details
                </Typography>
              </Box>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={3} marginTop={-2}>
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
                <Grid item xs={12} sm={2} marginTop={-2}>
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
                <Grid item xs={12} sm={2} marginTop={-2}>
                  <TextField
                    label="Approximate Distance(in KM) "
                    name="approximateDistance"
                    value={formData.approximateDistance}
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
                <Grid item xs={12} sm={2} marginTop={-2}>
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
                    name="vehicleNo"
                    value={formData.vehicleNo}
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

export default EwayBillGeneration;
