import React, { useEffect, useState, useRef } from "react";
import {
  Box, Grid, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Divider, Dialog, DialogContent, DialogActions,
  Button, TextField, MenuItem, Snackbar, Alert
} from "@mui/material";
import axios from "axios";
import io from "socket.io-client";
import SearchBar from "../../../../Common/UtilityCommon/SearchBar";
import { formatReadableAmount } from "../../../../Common/FormatFunctions/FormatAmount";
import AccountMasterHelp from "../../../../Helper/AccountMasterHelp";
import eBuySugarLogo from "../../../../Assets/eBuySugarlogo.jpg";

const headerCellStyle = {
  fontWeight: "bold",
  backgroundColor: "#3f51b5",
  color: "white",
  padding: "8px",
  textAlign: "center",
};

const EBUY_AC_CODE = Number(process.env.REACT_APP_EBUY_SUGAR_AC_CODE);

const LiveTenders = () => {
  const apikey = process.env.REACT_APP_API;
  const socketURL = process.env.REACT_APP_API_URL;
  const WEBSOCKET_URL = process.env.REACT_APP_API_WEBSOCKET;
  const company_code = sessionStorage.getItem("Company_Code");
  const year_code = sessionStorage.getItem("Year_Code");

  const [tenders, setTenders] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [openEdit, setOpenEdit] = useState(false);
  const [netAmount, setNetAmount] = useState("0.00");
  const [wsStatus, setWsStatus] = useState("Disconnected");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [ebuyPopupOpen, setEbuyPopupOpen] = useState(false);
  const [ebuyPopupData, setEbuyPopupData] = useState([]);
  const [ebuyPopupRow, setEbuyPopupRow] = useState(null);
  const [ebuyPopupLoading, setEbuyPopupLoading] = useState(false);


  const formatDateForInput = (dateString) => {
  if (!dateString) return new Date().toISOString().split("T")[0];
  const date = new Date(dateString);
  return date.toISOString().split("T")[0];
};

  const [formData, setFormData] = useState({
    Tender_No: "",
    Buyer: "",
    ShipTo: "",
    Buyer_Party: "",
    sub_broker: "",
    buyerid: "",
    buyerpartyid: "",
    sbr: "",
    shiptoid: "",
    Buyer_Quantal: "",
    Sale_Rate: "",
    Commission_Rate: "",
    gst_rate: 5.0,
    tcs_rate: 0.1,
    gst_amt: 0.0,
    tcs_amt: 0.0,
    Delivery_Type: "C",
    Sauda_Date: new Date().toISOString().split("T")[0],
    Lifting_Date: new Date().toISOString().split("T")[0],
    Narration: "",
    Sauda_Time: new Date().toLocaleTimeString("en-GB", { hour12: false }),
    EbuySelectedParty: "",
    EbuySelectedAccoid: "",
    EbuySugarLiftingDate: "",
    Payment_To: "",
    pt: "",
  });

  const [millCode, setMillCode] = useState("");
  const [millName, setMillName] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [shipToName, setShipToName] = useState("");
  const [brokerName, setBrokerName] = useState("");
  const [subBrokerName, setSubBrokerName] = useState("");
  const [tenderdetailid, settenderDetailId] = useState(0)
  const [tenderNo, setTenderNo] = useState(0)
  const buyerRef = useRef();
  const [selectedPartyName, setSelectedPartyName] = useState("");

  const fetchTenders = async () => {
    try {
      const res = await axios.get(
        `${apikey}/get_live_tenders?Company_Code=${company_code}&Year_Code=${year_code}`
      );
      if (res.data.all_data) {
        setTenders(res.data.all_data);
        setFiltered(res.data.all_data);
      }
    } catch (err) {
      console.error("Error fetching tenders:", err);
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

  useEffect(() => {
    let socket;

    const connect = () => {
      socket = new WebSocket(WEBSOCKET_URL);

      socket.onopen = () => {
        setWsStatus("Connected");
      };

      socket.onmessage = (event) => {
        const dataStr = String(event.data).toLowerCase();
        if (dataStr.includes("refresh_tenders")) {
          setSnackbarOpen(true);
          setRefreshKey((prev) => prev + 1);
        }
      };

      socket.onclose = () => {
        setWsStatus("Disconnected");
        setTimeout(connect, 3000);
      };

      socket.onerror = (err) => {
        setWsStatus("Error");
        console.error("Socket Error:", err);
      };
    };

    connect();

    return () => {
      if (socket) socket.close();
    };
  }, []);

  useEffect(() => {
    if (refreshKey > 0) fetchTenders();
  }, [refreshKey]);

  useEffect(() => {
    const search = searchTerm.toLowerCase();
    setFiltered(
      tenders.filter((item) =>
        Object.values(item).some((val) =>
          String(val).toLowerCase().includes(search)
        )
      )
    );
  }, [searchTerm, tenders]);

  const handleSearchTermChange = (e) => setSearchTerm(e.target.value);

  const handleEbuyRowClick = async (item) => {
    if (!item.tenderdetailid) return;
    setEbuyPopupRow(item);
    setEbuyPopupData([]);
    setEbuyPopupLoading(true);
    setEbuyPopupOpen(true);
    try {
      const res = await axios.get(`${apikey}/tender-ebuy-popup`, {
        params: {
          tenderdetailid: item.tenderdetailid,
          tender_no: item.Tender_No,
          Company_Code: company_code,
        },
      });
      if (res.data.success) setEbuyPopupData(res.data.data);
    } catch (err) {
      console.error("eBuy popup fetch error:", err);
    } finally {
      setEbuyPopupLoading(false);
    }
  };

  const groupBySaudaDate = (data) => {
    const grouped = {};
    data.forEach((item) => {
      if (!grouped[item.Sauda_Date]) grouped[item.Sauda_Date] = [];
      grouped[item.Sauda_Date].push(item);
    });
    return grouped;
  };

  // const calculateRowProfit = (i) => {
  //   const pRate = i.Purc_Rate === 0 ? parseFloat(i.Mill_Rate || 0) : parseFloat(i.Purc_Rate || 0);
  //   const sRate = parseFloat(i.Sale_Rate || 0);
  //   const qty = parseFloat(i.Qntl || 0);
  //   return (sRate - pRate) * qty;
  // };

  const calculateRowProfit = (row) => {
    const purcRate = parseFloat(row?.Purc_Rate) || 0;
    const millRate = parseFloat(row?.Mill_Rate) || 0;
    const saleRate = parseFloat(row?.Sale_Rate) || 0;
    const quantity = parseFloat(row?.Qntl) || 0;


    const effectivePurchaseRate = purcRate > 0 ? purcRate : millRate;


    const profit = (saleRate - effectivePurchaseRate) * quantity;


    return isNaN(profit) ? 0 : parseFloat(profit.toFixed(2));
  };



  const calculateTotalProfit = (group) =>
    group.filter((i) => Number(i.Buyer) !== EBUY_AC_CODE).reduce((t, i) => t + calculateRowProfit(i), 0);
  const calculateTotalQuantity = (group) =>
    group.filter((i) => Number(i.Buyer) !== EBUY_AC_CODE).reduce((t, i) => t + parseFloat(i.Qntl || 0), 0);

  const handleEditClick = (item) => {

    const formattedLiftingDate = formatDateForInput(item.Lifting_Date);

    setFormData({
      ...formData,
      Tender_No: item.Tender_No,
      Buyer_Quantal: item.Qntl,
      Sale_Rate: item.Sale_Rate,
      Commission_Rate: item.Commission_Rate,
      Sauda_Date: item.Sauda_Date,
      Lifting_Date: formattedLiftingDate,
      Buyer: item.Buyer,
      buyerid: item.buyerid,
      buyerpartyid: item.buyerpartyid,
      sub_broker: item.sub_broker,
      sbr: item.sbr,
      Buyer_Party: item.Buyer_Party,
      ShipTo: item.ShipTo,
      shiptoid: item.shiptoid,
      EbuySelectedParty: item.EbuySelectedParty,
      EbuySelectedAccoid: item.EbuySelectedAccoid ,
      EbuySugarLiftingDate: formattedLiftingDate,
      Payment_To: item.Buyer,
      pt: item.buyerid
    });
    setBuyerName(item.buyerName);
    settenderDetailId(item.tenderdetailid)
    setTenderNo(item.Tender_No)
    setBrokerName(item.brokername)
    setShipToName(item.shipToName);
    setSubBrokerName(item.subBrokerName)
    setMillName(item.Mill);
    setSelectedPartyName(item.selectedPartyName || "");
    setOpenEdit(true);
  };

  const handleAccountSelect =
    (field, idField) => (code, accoid, selectedName) => {
      setFormData((prev) => {
        const updatedData = { 
            ...prev, 
            [field]: code, 
            [idField]: accoid 
        };

        if (field === "Buyer") {
            updatedData.Payment_To = code;  
            updatedData.pt = accoid;      
        }

        return updatedData;
    });
      if (field === "Buyer") setBuyerName(selectedName);
      if (field === "ShipTo") setShipToName(selectedName);
      if (field === "Buyer_Party") setBrokerName(selectedName);
      if (field === "sub_broker") setSubBrokerName(selectedName);
      if (field === "EbuySelectedParty") setSelectedPartyName(selectedName);
    };

  const handleMillCode = (code, accoid, name) => {
    setMillCode(code);
    setMillName(name);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // GST / TCS / Net Amount Calculation
  useEffect(() => {
    const qty = parseFloat(formData.Buyer_Quantal || 0);
    const rate = parseFloat(formData.Sale_Rate || 0);
    const gstRate = parseFloat(formData.gst_rate || 0);
    const tcsRate = parseFloat(formData.tcs_rate || 0);

    const taxable = qty * rate;
    const gst_amt = (taxable * gstRate) / 100;
    const tcs_amt = ((taxable + gst_amt) * tcsRate) / 100;
    const net = taxable + gst_amt + tcs_amt;

    setFormData((prev) => ({
      ...prev,
      gst_amt: gst_amt.toFixed(2),
      tcs_amt: tcs_amt.toFixed(2),
    }));
    setNetAmount(net.toFixed(2));
  }, [formData.Buyer_Quantal, formData.Sale_Rate, formData.gst_rate, formData.tcs_rate]);

  const handleSaveEdit = async () => {
    try {
      await axios.put(`${apikey}/update_tender_detail`, {
        detailData: {
          ...formData, Company_Code: company_code, Year_Code: year_code, tenderdetailid: tenderdetailid,
          Tender_No: tenderNo
        },
      });
      setOpenEdit(false);
      fetchTenders();
      alert("Tender updated successfully!");
      setTenderNo(0)
      settenderDetailId(0)
    } catch (err) {
      console.error(err);
      alert("Error updating tender!");
    }
  };

  return (
    <Box sx={{ mt: -10, mb: 20 }}>
      <Grid container spacing={2} alignItems="center" sx={{ mb: 1 }}>
        <Grid item xs={12} sm={6} ml={30}>
          <SearchBar value={searchTerm} onChange={handleSearchTermChange} />
        </Grid>
      </Grid>

      <Paper elevation={3} sx={{ overflow: "auto", maxHeight: "90vh" }}>
        <TableContainer>
          <div style={{ maxHeight: "750px", overflow: "auto" }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={headerCellStyle}>Action</TableCell>
                  <TableCell sx={headerCellStyle}>Sauda Date</TableCell>
                  <TableCell sx={headerCellStyle}>Sauda Time</TableCell>
                  <TableCell sx={headerCellStyle}>Mill Name</TableCell>
                  <TableCell sx={headerCellStyle}>Buyer Name</TableCell>
                  <TableCell sx={headerCellStyle}>DO Name</TableCell>
                  <TableCell sx={headerCellStyle}>Quantity</TableCell>
                  <TableCell sx={headerCellStyle}>Grade</TableCell>
                  <TableCell sx={headerCellStyle}>Season</TableCell>
                  <TableCell sx={headerCellStyle}>Mill Rate</TableCell>
                  <TableCell sx={headerCellStyle}>Purchase Rate</TableCell>
                  <TableCell sx={headerCellStyle}>Sale Rate</TableCell>
                  <TableCell sx={headerCellStyle}>Profit & Loss</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length > 0 ? (
                  Object.entries(groupBySaudaDate(filtered)).map(([date, group], groupIndex) => (
                    <React.Fragment key={date}>
                      {group.map((item, index) => (
                        <TableRow key={`${groupIndex}-${index}`} hover>
                          <TableCell align="center">
                            <div style={{ display: "flex", gap: "4px", justifyContent: "center", alignItems: "center" }}>
                              <Button
                                variant="outlined"
                                size="small"
                                color="primary"
                                disabled={Number(item.Buyer) === EBUY_AC_CODE}
                                onClick={Number(item.Buyer) !== EBUY_AC_CODE ? () => handleEditClick(item) : undefined}
                              >
                                Edit
                              </Button>
                              {/* eBuy eye icon */}
                              {(() => {
                                const isEbuyClickable = Number(item.Buyer) === EBUY_AC_CODE;
                                return (
                                  <button
                                    disabled={!isEbuyClickable}
                                    onClick={isEbuyClickable ? (e) => { e.stopPropagation(); handleEbuyRowClick(item); } : undefined}
                                    title={isEbuyClickable ? "View eBuy Sales" : "Not an eBuy record"}
                                    style={{
                                      border: `1px solid ${isEbuyClickable ? "#1976d2" : "#bdbdbd"}`,
                                      background: isEbuyClickable ? "#e3f2fd" : "#f5f5f5",
                                      cursor: isEbuyClickable ? "pointer" : "not-allowed",
                                      color: isEbuyClickable ? "#1976d2" : "#bdbdbd",
                                      opacity: isEbuyClickable ? 1 : 0.45,
                                      borderRadius: "4px",
                                      padding: "3px 6px",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      minWidth: "28px",
                                      height: "28px",
                                    }}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zm0 12.5c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                                    </svg>
                                  </button>
                                );
                              })()}
                            </div>
                          </TableCell>
                          <TableCell>{item.Sauda_Date}</TableCell>
                          <TableCell style={{ whiteSpace: "nowrap" }}>{item.Sauda_Time}</TableCell>
                          <TableCell>{item.Mill}</TableCell>
                          <TableCell>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              {Number(item.Buyer) === EBUY_AC_CODE && (
                                <img
                                  src={eBuySugarLogo}
                                  alt="eBuySugar"
                                  title="eBuySugar Record"
                                  style={{ height: "18px", width: "auto", borderRadius: "3px", flexShrink: 0 }}
                                />
                              )}
                              {item.buyerName}
                            </div>
                          </TableCell>
                          <TableCell>{item.DO}</TableCell>
                          <TableCell align="right">{item.Qntl}</TableCell>
                          <TableCell>{item.Grade}</TableCell>
                          <TableCell>{item.season}</TableCell>
                          <TableCell align="right">{item.Mill_Rate}</TableCell>
                          <TableCell align="right">
                            {item.Purc_Rate === 0 ? item.Mill_Rate : item.Purc_Rate}
                          </TableCell>
                          <TableCell align="right">{item.Sale_Rate}</TableCell>
                          <TableCell
                            align="right"
                            style={{
                              color: Number(item.Buyer) === EBUY_AC_CODE ? "#bdbdbd" : calculateRowProfit(item) >= 0 ? "green" : "red",
                              fontWeight: "bold",
                            }}
                          >
                            {Number(item.Buyer) === EBUY_AC_CODE ? "-" : formatReadableAmount(calculateRowProfit(item).toFixed(2))}
                          </TableCell>
                        </TableRow>
                      ))}

                      <TableRow sx={{ backgroundColor: "#edf0df" }}>
                        <TableCell colSpan={6} align="right">
                          <strong>Total for {date}:</strong>
                        </TableCell>
                        <TableCell align="right">
                          <strong>
                            {formatReadableAmount(calculateTotalQuantity(group).toFixed(2))}
                          </strong>
                        </TableCell>
                        <TableCell colSpan={4}></TableCell>
                        <TableCell align="right" style={{ whiteSpace: "nowrap" }}>
                          <strong>Expected Profit & Loss:</strong>
                        </TableCell>
                        <TableCell
                          align="right"
                          style={{
                            color: calculateTotalProfit(group) >= 0 ? "green" : "red",
                            fontWeight: "bold",
                          }}
                        >
                          <strong>
                            {formatReadableAmount(calculateTotalProfit(group).toFixed(2))}
                          </strong>
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell colSpan={12} sx={{ height: "10px", borderBottom: "none" }} />
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={12} sx={{ padding: 0, border: 0 }}>
                          <Divider sx={{ borderBottomWidth: 2, backgroundColor: "#3f51b5" }} />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={12} sx={{ height: "10px", borderBottom: "none" }} />
                      </TableRow>
                    </React.Fragment>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={12} align="center">
                      Data Not Found!
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TableContainer>
      </Paper>

      {/* Edit Tender Modal */}
      <Dialog
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        fullWidth
        maxWidth="md"
        TransitionProps={{ timeout: 0 }}
        transitionDuration={0}
        keepMounted
      >
        <Box sx={{
          backgroundColor: "#3f51b5",
          color: "white",
          textAlign: "center",
          py: 1.2,
          fontWeight: 600,
        }}>
          Edit Live Tender
        </Box>
        <DialogContent sx={{ mt: 1 }}>
          <Grid container spacing={1}>
            {/* <Grid item xs={12} sm={4}><Typography fontWeight="bold">Mill:</Typography></Grid> */}
            {/* <Grid item xs={12} sm={8}>
              <AccountMasterHelp name="Mill_Code" CategoryCode={millCode} CategoryName={millName} onAcCodeClick={handleMillCode} />
            </Grid> */}

            <Grid item xs={12} sm={4}><Typography fontWeight="bold">Buyer:</Typography></Grid>
            <Grid item xs={12} sm={8}>
              <AccountMasterHelp name="Buyer" CategoryCode={formData.Buyer} CategoryName={buyerName} onAcCodeClick={handleAccountSelect("Buyer", "buyerid")} />
            </Grid>

            <Grid item xs={12} sm={4}><Typography fontWeight="bold">Ship To:</Typography></Grid>
            <Grid item xs={12} sm={8}>
              <AccountMasterHelp name="ShipTo" CategoryCode={formData.ShipTo} CategoryName={shipToName} onAcCodeClick={handleAccountSelect("ShipTo", "shiptoid")} />
            </Grid>

            <Grid item xs={12} sm={4}><Typography fontWeight="bold">Broker:</Typography></Grid>
            <Grid item xs={12} sm={8}>
              <AccountMasterHelp
                name="Buyer_Party"
                CategoryCode={formData.Buyer_Party}
                CategoryName={brokerName}
                onAcCodeClick={handleAccountSelect("Buyer_Party", "buyerpartyid")}
              />
            </Grid>

            <Grid item xs={12} sm={4}><Typography fontWeight="bold">Sub Broker:</Typography></Grid>
            <Grid item xs={12} sm={8}>
              <AccountMasterHelp
                name="sub_broker"
                CategoryCode={formData.sub_broker}
                CategoryName={subBrokerName}
                onAcCodeClick={handleAccountSelect("sub_broker", "sbr")}
              />
            </Grid>


            {/* <Grid item xs={12} sm={4}>
              <Typography fontWeight="bold">Select Party:</Typography>
            </Grid>
            <Grid item xs={12} sm={8}>
              <AccountMasterHelp
                name="EbuySelectedParty"
                CategoryCode={formData.EbuySelectedParty}
                CategoryName={selectedPartyName}
                onAcCodeClick={handleAccountSelect("EbuySelectedParty", "EbuySelectedAccoid")}
              />
            </Grid>

        
            <Grid item xs={12} sm={4}><Typography fontWeight="bold">Lifting Date:</Typography></Grid>
            <Grid item xs={12} sm={8}>
              <TextField size="small" fullWidth name="Lifting_Date" type="date" value={formData.Lifting_Date} onChange={handleInputChange} />
            </Grid> */}


            <Grid item xs={12} sm={4}><Typography fontWeight="bold">Buyer Quantal:</Typography></Grid>
            <Grid item xs={12} sm={8}>
              <TextField size="small" fullWidth name="Buyer_Quantal" type="number" value={formData.Buyer_Quantal} onChange={handleInputChange} />
            </Grid>

            <Grid item xs={12} sm={4}><Typography fontWeight="bold">Sale Rate:</Typography></Grid>
            <Grid item xs={12} sm={8}>
              <TextField size="small" fullWidth name="Sale_Rate" type="number" value={formData.Sale_Rate} onChange={handleInputChange} />
            </Grid>

            <Grid item xs={12} sm={4}><Typography fontWeight="bold">GST Rate:</Typography></Grid>
            <Grid item xs={12} sm={4}>
              <TextField size="small" fullWidth name="gst_rate" type="number" value={formData.gst_rate} onChange={handleInputChange} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField size="small" fullWidth label="GST Amount" value={formData.gst_amt} InputProps={{ readOnly: true }} />
            </Grid>

            <Grid item xs={12} sm={4}><Typography fontWeight="bold">TCS Rate:</Typography></Grid>
            <Grid item xs={12} sm={4}>
              <TextField size="small" fullWidth name="tcs_rate" type="number" value={formData.tcs_rate} onChange={handleInputChange} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField size="small" fullWidth label="TCS Amount" value={formData.tcs_amt} InputProps={{ readOnly: true }} />
            </Grid>

            <Grid item xs={12} sm={4}><Typography fontWeight="bold">Net Amount:</Typography></Grid>
            <Grid item xs={12} sm={8}>
              <TextField size="small" fullWidth value={netAmount} InputProps={{ readOnly: true, sx: { fontWeight: "bold", fontSize: "1rem" } }} />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ justifyContent: "center", mb: 1 }}>
          <Button variant="outlined" color="secondary" onClick={() => setOpenEdit(false)} sx={{ width: 120 }}>
            Cancel
          </Button>
          <Button variant="contained" color="primary" onClick={handleSaveEdit} sx={{ width: 120 }}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity="info" sx={{ width: "100%" }}>
          Tenders updated in real-time!
        </Alert>
      </Snackbar>

      {/* eBuy Sales Popup */}
      {ebuyPopupOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={() => setEbuyPopupOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 overflow-hidden"
            style={{ maxHeight: "85vh", display: "flex", flexDirection: "column" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Popup Header */}
            <div className="bg-gradient-to-r from-blue-700 to-blue-500 px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zm0 12.5c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                </svg>
                <span className="text-white font-bold text-base tracking-wide">eBuySugar Sale Sauda</span>
              </div>
              <button
                onClick={() => setEbuyPopupOpen(false)}
                className="text-white hover:text-red-200 transition-colors text-xl font-bold leading-none"
              >
                ✕
              </button>
            </div>

            {/* Info Cards */}
            <div className="bg-blue-50 border-b border-blue-100 px-6 py-3 grid grid-cols-3 gap-3">
              <div className="bg-white rounded-xl shadow-sm border border-blue-100 px-4 py-2 flex flex-col items-center">
                <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Mill Name</span>
                <span className="text-sm font-bold text-blue-800 mt-0.5">{ebuyPopupRow?.Mill || "-"}</span>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-blue-100 px-4 py-2 flex flex-col items-center">
                <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Grade</span>
                <span className="text-sm font-bold text-blue-800 mt-0.5">{ebuyPopupRow?.Grade || "-"}</span>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-blue-100 px-4 py-2 flex flex-col items-center">
                <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Buyer Quantal</span>
                <span className="text-sm font-bold text-blue-800 mt-0.5">{ebuyPopupRow?.Qntl ?? "-"}</span>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-auto flex-1 px-4 py-3">
              {ebuyPopupLoading ? (
                <div className="flex items-center justify-center h-24 text-blue-600 font-medium text-sm">
                  Loading...
                </div>
              ) : ebuyPopupData.length === 0 ? (
                <div className="flex items-center justify-center h-24 text-gray-400 text-sm">
                  No sale records found.
                </div>
              ) : (
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-blue-700 text-white">
                      {/* <th className="px-3 py-2 text-center rounded-tl-lg" style={{ minWidth: "80px" }}>Actions</th> */}
                      <th className="px-3 py-2 text-left">Sauda Date</th>
                      <th className="px-3 py-2 text-left">Lifting Date</th>
                      <th className="px-3 py-2 text-center">Buyer Code</th>
                      <th className="px-3 py-2 text-left">Buyer Name</th>
                      <th className="px-3 py-2 text-right">Buyer Quantal</th>
                      <th className="px-3 py-2 text-right">Sale Rate</th>
                      <th className="px-3 py-2 text-left rounded-tr-lg">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ebuyPopupData.map((row, idx) => (
                      <tr
                        key={idx}
                        className={idx % 2 === 0 ? "bg-white hover:bg-blue-50" : "bg-gray-50 hover:bg-blue-50"}
                      >
                        {/* <td className="px-3 py-2 text-center">
                          <div className="flex gap-1 justify-center">
                            <button
                              disabled
                              title="Edit (disabled in Live Tenders)"
                              style={{
                                border: "1px solid #bdbdbd",
                                background: "#f5f5f5",
                                cursor: "not-allowed",
                                color: "#bdbdbd",
                                opacity: 0.45,
                                borderRadius: "4px",
                                padding: "2px 6px",
                                fontSize: "11px",
                              }}
                            >
                              Edit
                            </button>
                            <button
                              disabled
                              title="Delete (disabled in Live Tenders)"
                              style={{
                                border: "1px solid #bdbdbd",
                                background: "#f5f5f5",
                                cursor: "not-allowed",
                                color: "#bdbdbd",
                                opacity: 0.45,
                                borderRadius: "4px",
                                padding: "2px 6px",
                                fontSize: "11px",
                              }}
                            >
                              Del
                            </button>
                          </div>
                        </td> */}
                        <td className="px-3 py-2 text-left whitespace-nowrap">{row.Sauda_Date}</td>
                        <td className="px-3 py-2 text-left whitespace-nowrap">{row.Lifting_Date}</td>
                        <td className="px-3 py-2 text-center">{row.Buyer}</td>
                        <td className="px-3 py-2 text-left">{row.buyername}</td>
                        <td className="px-3 py-2 text-right">{row.Buyer_Quantal}</td>
                        <td className="px-3 py-2 text-right">{row.Sale_Rate}</td>
                        <td className="px-3 py-2 text-left">{row.detailgrade}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-blue-100 font-bold text-blue-900">
                      <td colSpan={4} className="px-3 py-2 text-right">Total Quantal:</td>
                      <td className="px-3 py-2 text-right">
                        {ebuyPopupData.reduce((sum, r) => sum + parseFloat(r.Buyer_Quantal || 0), 0).toFixed(2)}
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 flex justify-end">
              <button
                onClick={() => setEbuyPopupOpen(false)}
                className="px-5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors shadow"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </Box>
  );
};

export default LiveTenders;