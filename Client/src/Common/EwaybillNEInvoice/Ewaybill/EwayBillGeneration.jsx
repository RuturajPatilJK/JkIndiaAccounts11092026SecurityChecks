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
  Grid
} from "@mui/material";
import axios from "axios";
import { initialFormData } from "./InitialEwayBillData";
import { GSPTokenGenerator } from "../TokenGeneration/AuthTokenEwayBillGenrate";
import { ewaybillData } from "./EwayBillBody";
import { CircularProgress } from "@mui/material";
import Swal from "sweetalert2";
import GSTStateMasterHelp from "../../../Helper/GSTStateMasterHelp";

const API_URL = process.env.REACT_APP_API;

var newDispatchToStateName = ''
var newDispatchToStateCode = ''

var newDispatchFromStateName = ''
var newDispatchFromStateCode = ''

const EwayBillGeneration = ({
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
  const [billToStateCode, setBillToStateCode] = useState('')
  const [dispatchFromStateCode, setDispatchFromStateCode] = useState('')
  const [dispatchToStateCode, setDispatchToStateCode] = useState('')
  const [dispatchToStatename, setDispatchToStateName] = useState('')
  const [isDispatchToHandledManually, setDispatchToHandledManually] = useState(false)


  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  useEffect(() => {
    let isMounted = true;

    const fetchRecord = async () => {
      try {
        let response;

        if (tran_type === "SB") {
          response = await axios.get(
            `${API_URL}/getEwayBillGeneratioData_SB?Company_Code=${Company_Code}&Year_Code=${Year_Code}&doc_no=${doc_no}&do_no=${do_no}`
          );
        } else if (tran_type === "RS") {
          response = await axios.get(
            `${API_URL}/getEwayBillGeneratioData_RS?Company_Code=${Company_Code}&Year_Code=${Year_Code}&doc_no=${doc_no}`
          );
        }

        if (response?.status === 200) {
          const data = response.data.all_data[0];

          if (isMounted) {
            setFetchedData(response.data);
            newDispatchToStateCode = data.toStateCode
            newDispatchToStateName = data.State_Name
            newDispatchFromStateCode = data.fromStateCode
            newDispatchFromStateName = data.State_Name
            setFormData((prevFormData) => {
              const updatedDocNo = `${tran_type}${data.year}-${data.doc_no}`;

              let transactionType = "4";
              if (
                data.BillToPinCode === data.ShipToPinCode &&
                data.PIN === data.millpincode
              ) {
                transactionType = "1";
              } else if (data.BillToPinCode === data.ShipToPinCode) {
                transactionType = "2";
              } else if (data.PIN === data.millpincode) {
                transactionType = "3";
              }

              return {
                ...prevFormData,
                ...data,
                doc_no: updatedDocNo,
                actFromStateCode: data.fromStateCode,
                // actToStateCode: data.toStateCode,
                actToStateCode: isDispatchToHandledManually ? dispatchToStateCode : data.toStateCode,
                actFromStateCode: isDispatchToHandledManually ? dispatchFromStateCode : data.fromStateCode,
                tranType: transactionType,
              };
            });
          }
        } else {
          console.error(
            "Failed to fetch data:",
            response?.status,
            response?.statusText
          );
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


  const handleGSTStateCode = (code) => {
    setDispatchToHandledManually(true)
    setDispatchToStateCode(code);
    setFormData({
      ...formData,
      actToStateCode: code,
    });
  };


  const handleGSTFromStateCode = (code) => {
    setDispatchToHandledManually(true)
    setDispatchFromStateCode(code);
    setFormData({
      ...formData,
      actFromStateCode: code,
    });
  };


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

      const apiUrl = `${API_URL}/create-ewaybill`;
      const headers = {
        "Content-Type": "application/json",
      };

      let invoiceData = ewaybillData(formData, tran_type);
      invoiceData.token = token;

      const response = await axios.post(apiUrl, invoiceData, { headers });
      if (!response.data.success) {
        Swal.fire({
          icon: "error",
          title: "EwayBill Generation Failed",
          text: response.data.message,
        });
        return;
      }

      const result = response.data.result;
      const distanceMatch = result.alert.match(/(\d+)/);
      const distance = distanceMatch ? distanceMatch[0] : null;
      const updateData = {
        ewayBillDate: result.ewayBillDate,
        ewayBillNo: result.ewayBillNo,
        distance: distance,
        validUpto: result.validUpto,
      };

      const updateUrl = `${API_URL}/updateEwayBillData?doc_no=${doc_no}&Company_Code=${Company_Code}&Year_Code=${Year_Code}&tran_type=${tran_type}&do_no=${do_no}`;
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
        newDispatchToStateCode = ''
        newDispatchToStateName = ''
        newDispatchFromStateCode = ''
      }, 500);
      setIsLoading(false);
    }
  };

  // Resizer object at the time of resize the modal.
  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      entries.forEach((entry) => { });
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
      <Paper
        elevation={3}
        sx={{
          p: 4,
          marginTop: 2,
          position: "relative",
          zIndex: 1
        }}
      >
        <Grid container spacing={3} sx={{ display: "flex" }}>
        </Grid>
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
            <Button variant="contained" color="primary" onClick={handleSubmit} disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={24} /> : null}>

              {isLoading ? 'Loading...' : 'Generate eWayBill'}
            </Button>
          </Grid>
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
                  name="subSupplyType"
                  value={formData.subSupplyType}
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
            <Grid item xs={12} sm={1.5} marginTop={-2}>
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
            <Grid item xs={12} sm={2} marginTop={-2}>
              <TextField
                label="Doc No"
                name="doc_no"
                value={formData.doc_no}
                onChange={handleChange}
                variant="outlined"
                fullWidth
                margin="normal"
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={1.5} marginTop={-2}>
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
                  style: { fontSize: '12px' },
                }}
                InputProps={{
                  style: { fontSize: '12px', height: '35px' },
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
                <Grid item xs={12} sm={6} marginTop={-1.5}>
                  <TextField
                    label="Name"
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
                    label="fromGstin"
                    name="GST"
                    value={formData.fromGstin}
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
                    name="companyState"
                    value={formData.companyState}
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
                <Grid item xs={12} sm={5} marginTop={-1.5}>
                  <TextField
                    label="Address"
                    name="millname"
                    value={formData.millname}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={5} marginTop={-2}>
                  <TextField
                    name="milladdress"
                    value={formData.milladdress}
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
                    name="millcityname"
                    value={formData.millcityname}
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
                    label="fromPincode"
                    name="millpincode"
                    value={formData.millpincode}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={3} marginTop={-2}>
                  <TextField
                    label="State"
                    name="millstatename"
                    value={formData.millstatename}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>


                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    marginTop: "8px",
                    gap: 1, // space between label and field
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      color: "rgba(0, 0, 0, 0.7)",
                    }}
                  >
                    Dispatch From State Code:
                  </Typography>

                  <Box sx={{ flexGrow: 1 }}>
                    <GSTStateMasterHelp
                      name="actFromStateCode"
                      onAcCodeClick={handleGSTFromStateCode}
                      GstStateName={dispatchFromStateCode || newDispatchFromStateName}
                      GstStateCode={dispatchFromStateCode || newDispatchFromStateCode}
                    />
                  </Box>
                </Box>



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
                <Grid item xs={12} sm={6} marginTop={-1.5}>
                  <TextField
                    label="Name"
                    name="BillToName"
                    value={formData.BillToName}
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
                    name="BillToGst"
                    value={formData.BillToGst}
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
                    name="State_Name"
                    value={formData.State_Name}
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
                <Grid item xs={12} sm={5} marginTop={-1.5}>
                  <TextField
                    label="Address"
                    name="ShippTo"
                    value={formData.ShippTo}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={5} marginTop={-2}>
                  <TextField
                    name="Address_E"
                    value={formData.Address_E}
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
                    name="city_name_e"
                    value={formData.city_name_e}
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
                    name="ShipToPinCode"
                    value={formData.ShipToPinCode}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      marginTop: "8px",
                      gap: 1, // space between label and field
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                        color: "rgba(0, 0, 0, 0.7)",
                      }}
                    >
                      Dispatch To State Code:
                    </Typography>

                    <Box sx={{ flexGrow: 1 }}>
                      <GSTStateMasterHelp
                        name="actToStateCode"
                        onAcCodeClick={handleGSTStateCode}
                        GstStateName={dispatchToStatename || newDispatchToStateName}
                        GstStateCode={dispatchToStateCode || newDispatchToStateCode}
                      />
                    </Box>
                  </Box>
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
                    name="System_Name_E"
                    value={formData.System_Name_E}
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
                    name="productDesc"
                    value={formData.System_Name_E}
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
                    name="HSN"
                    value={formData.HSN}
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
                    name="qtyUnit"
                    value={formData.qtyUnit}
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
                    name="TaxableAmount"
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
                    label="CESS Advol Amount"
                    name="cessValue"
                    value={formData.cessValue}
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
                    name="cessAdvol"
                    value={formData.cessAdvol}
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
                    value={formData.RoundOff}
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
                    name="totInvValue"
                    value={parseFloat(
                      (parseFloat(formData.TaxableAmount) || 0) +
                      (parseFloat(formData.CGSTAmount) || 0) +
                      (parseFloat(formData.SGSTAmount) || 0) +
                      (parseFloat(formData.IGSTAmount) || 0) +
                      (parseFloat(formData.cessValue) || 0) +
                      (parseFloat(formData.otherAmount) || 0)
                    ).toFixed(2)}
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
                    name="transporterId"
                    value={formData.transporterId}
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
                    name="Distance"
                    value={formData.Distance}
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
                      name="transMode"
                      value={formData.transMode}
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
        </FormGroup>
      </Paper>
    </div>
  );
};

export default EwayBillGeneration;