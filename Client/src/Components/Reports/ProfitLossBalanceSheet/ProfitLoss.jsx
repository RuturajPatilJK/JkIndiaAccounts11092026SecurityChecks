// import React, { useState, useEffect } from "react";
// import {
//   Box,
//   Grid,
//   Button,
//   TextField,
//   Typography,
//   Paper,
//   Container,
// } from "@mui/material";
// import BarChartIcon from '@mui/icons-material/BarChart';
// import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
// import GroupMasterHelp from "../../../Helper/SystemmasterHelp";

// const ProfitLoss = () => {
//   const [fromDate, setFromDate] = useState("");
//   const [toDate, setToDate] = useState("");
//   const [UptoDate, setUptoDate] = useState("");
//   const AccountYear = sessionStorage.getItem("Accounting_Year");
//   const [loading, setLoading] = useState(false);

//   const [groupCode, setGroupCode] = useState('');
//   const [gcId, setGCID] = useState('');
//   const [groupName, setGroupName] = useState('');

//   useEffect(() => {
//     if (AccountYear) {
//       const dates = AccountYear.split(" - ");
//       if (dates.length === 2) {
//         setFromDate(dates[0]);
//         setToDate(dates[1]);
//         setUptoDate(dates[1]);
//       }
//     }
//   }, [AccountYear]);


//   const handleGetReportClick = (e) => {
//     e.preventDefault();
//     if (!groupCode) {
//       setGroupCode('');
//       setGCID('');
//       setGroupName('');
//     }
//     setLoading(true);
//     setTimeout(() => {
//       const url = `/ProfitLoss-Report?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&gcid=${encodeURIComponent(gcId)}&groupCode=${encodeURIComponent(groupCode)}&groupName=${encodeURIComponent(groupName)}`;
//       window.open(url, '_blank', 'toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=800,height=600');
//       setLoading(false);
//       // window.location.reload();
//     }, 500);
//   };

//   const handleBalanceSheetReportClick = (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setTimeout(() => {
//       const url = `/Balancesheet-Report?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&fromDate=${encodeURIComponent(fromDate)}`;
//       window.open(url, '_blank', 'toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=800,height=600');
//       setLoading(false);
//     }, 500);
//   };


//   const handleGroupCode = (code, accoid, HSN, name) => {
//     if (!code) {
//       setGroupCode('');
//       setGCID('');
//       setGroupName('');
//     } else {
//       setGroupCode(code);
//       setGCID(accoid);
//       setGroupName(name);
//     }
//   };

//   return (
//     <div className=" mt-5">
//       <div className="p-4 mx-auto" style={{ maxWidth: "800px" }}>
//         <Container maxWidth="sm">
//           <Paper elevation={3} sx={{ p: 4, mt: 6 }}>
//             <Typography variant="h6"
//               component="h1"
//               gutterBottom
//               sx={{
//                 textAlign: 'center',
//                 fontSize: '1.2rem',
//                 fontWeight: 'bold',
//                 color: '#2c3e50',
//                 marginBottom: '30px',
//                 padding: '12px 0',
//                 position: 'relative',
//                 '&::after': {
//                   content: '""',
//                   position: 'absolute',
//                   bottom: '0',
//                   left: '50%',
//                   transform: 'translateX(-50%)',
//                   width: '80px',
//                   height: '4px',
//                   background: 'linear-gradient(90deg, #3498db, #2ecc71)',
//                   borderRadius: '2px',
//                   animation: 'underlineGrow 0.5s ease-out forwards'
//                 },
//                 '@keyframes underlineGrow': {
//                   '0%': { width: '0' },
//                   '100%': { width: '80px' }
//                 }
//               }}>
//               Profit Loss/Balance Sheet
//             </Typography>

//             <Box component="form" onSubmit={handleGetReportClick} mt={5}>
//               <Grid container spacing={3} justifyContent="center">
//                 <Grid item xs={7}>
//                   <TextField
//                     fullWidth
//                     label="Upto Date"
//                     type="date"
//                     InputLabelProps={{ shrink: true }}
//                     value={UptoDate}
//                     onChange={(e) => setUptoDate(e.target.value)}
//                     sx={{ maxWidth: 300 }}
//                   />
//                 </Grid>

//                 <Grid item xs={7}>
//                   <TextField
//                     fullWidth
//                     label="From Date"
//                     type="date"
//                     InputLabelProps={{ shrink: true }}
//                     value={fromDate}
//                     onChange={(e) => setFromDate(e.target.value)}
//                   />
//                 </Grid>

//                 <Grid item xs={7}>
//                   <TextField
//                     fullWidth
//                     label="To Date"
//                     type="date"
//                     InputLabelProps={{ shrink: true }}
//                     value={toDate}
//                     onChange={(e) => setToDate(e.target.value)}
//                   />
//                 </Grid>
// {/* 
//                 <div className="receiptpaymentdiv" style={{ marginTop: '10px', marginLeft: '-10px' }}>
//                   <label htmlFor="Group_Code" className="receiptpaymentlabel">
//                     Group Code :
//                   </label>
//                   <div className="receiptpayment-col">
//                     <div className="receiptpayment-form-group">
//                       <GroupMasterHelp
//                         onAcCodeClick={handleGroupCode}
//                         CategoryName={groupName}
//                         CategoryCode={groupCode}
//                         SystemType="C"
//                         name="Group_Code"
//                       />
//                     </div>
//                   </div>
//                 </div> */}

//                 <Grid item xs={12} container justifyContent="center" spacing={2}>
//                   <Grid item xs={12} sm={6}>
//                     <Button
//                       type="submit"
//                       fullWidth
//                       variant="contained"
//                       color="success"
//                       onClick={handleGetReportClick}
//                       startIcon={<BarChartIcon />}
//                       sx={{
//                         padding: '12px 16px',
//                         fontSize: '1rem',
//                         fontWeight: 600,
//                         boxShadow: 3,
//                         '&:hover': {
//                           boxShadow: 6,
//                           transform: 'scale(1.02)',
//                           backgroundColor: '#43a047',
//                         },
//                         transition: 'all 0.3s ease',
//                       }}
//                     >
//                       Profit & Loss
//                     </Button>
//                   </Grid>

//                   <Grid item xs={12} sm={6}>
//                     <Button
//                       fullWidth
//                       variant="contained"
//                       color="primary"
//                       onClick={handleBalanceSheetReportClick}
//                       startIcon={<AccountBalanceIcon />}
//                       sx={{
//                         padding: '12px 16px',
//                         fontSize: '1rem',
//                         fontWeight: 600,
//                         boxShadow: 3,
//                         '&:hover': {
//                           boxShadow: 6,
//                           transform: 'scale(1.02)',
//                           backgroundColor: '#1565c0',
//                         },
//                         transition: 'all 0.3s ease',
//                       }}
//                     >
//                       Balance Sheet
//                     </Button>
//                   </Grid>
//                 </Grid>
//               </Grid>
//             </Box>
//           </Paper>
//         </Container>
//       </div>
//     </div>
//   );
// };

// export default ProfitLoss;


import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Button,
  TextField,
  Typography,
  Paper,
  Container,
} from "@mui/material";
import BarChartIcon from "@mui/icons-material/BarChart";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import axios from "axios";
import Swal from "sweetalert2";

const ProfitLoss = () => {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [UptoDate, setUptoDate] = useState("");
  const AccountYear = sessionStorage.getItem("Accounting_Year");
  const [loading, setLoading] = useState(false);

  const [groupCode, setGroupCode] = useState("");
  const [gcId, setGCID] = useState("");
  const [groupName, setGroupName] = useState("");

  const [closingQty, setClosingQty] = useState("");
  const [closingValue, setClosingValue] = useState("");

  // show stock fields only after clicking Get Stock Qty & Value
  const [showStockFields, setShowStockFields] = useState(false);

  const userType = sessionStorage.getItem("user_type"); // "A" show, "U" hide
  const API_URL = process.env.REACT_APP_API;

  useEffect(() => {
    if (AccountYear) {
      const dates = AccountYear.split(" - ");
      if (dates.length === 2) {
        setFromDate(dates[0]);
        setToDate(dates[1]);
        setUptoDate(dates[1]);
      }
    }
  }, [AccountYear]);

  const handleGetReportClick = (e) => {
    e.preventDefault();
    if (!groupCode) {
      setGroupCode("");
      setGCID("");
      setGroupName("");
    }
    setLoading(true);
    setTimeout(() => {
      const url = `/ProfitLoss-Report?fromDate=${encodeURIComponent(
        fromDate
      )}&toDate=${encodeURIComponent(
        toDate
      )}&gcid=${encodeURIComponent(gcId)}&groupCode=${encodeURIComponent(
        groupCode
      )}&groupName=${encodeURIComponent(groupName)}`;
      window.open(
        url,
        "_blank",
        "toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=800,height=600"
      );
      setLoading(false);
    }, 500);
  };

  const handleBalanceSheetReportClick = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const url = `/Balancesheet-Report?fromDate=${encodeURIComponent(
        fromDate
      )}&toDate=${encodeURIComponent(toDate)}&fromDate=${encodeURIComponent(
        fromDate
      )}`;
      window.open(
        url,
        "_blank",
        "toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=800,height=600"
      );
      setLoading(false);
    }, 500);
  };

  const handleGetStockQtyValue = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      const params = {
        fromDate,
        ToDate: toDate,
        Year_Code: sessionStorage.getItem("Year_Code"),
        company_code: sessionStorage.getItem("Company_Code"),
        Item_Code: 0,
      };

      const res = await axios.get(`${API_URL}/closing-stock-report`, { params });

      setClosingQty(
        res?.data?.ClosingQty !== undefined && res?.data?.ClosingQty !== null
          ? String(res.data.ClosingQty)
          : ""
      );
      setClosingValue(
        res?.data?.ClosingValue !== undefined && res?.data?.ClosingValue !== null
          ? String(res.data.ClosingValue)
          : ""
      );

      // show fields only after successful click
      setShowStockFields(true);
    } catch (err) {
      console.error(err);
      setClosingQty("");
      setClosingValue("");
      setShowStockFields(true); // still show, but empty
    } finally {
      setLoading(false);
    }
  };

  // // POST button (change endpoint as per your backend)
  // const handlePostStockValue = async (e) => {
  //   e.preventDefault();
  //   try {
  //     setLoading(true);

  //     const payload = {
  //       fromDate,
  //       ToDate: toDate,
  //       Year_Code: sessionStorage.getItem("Year_Code"),
  //       company_code: sessionStorage.getItem("Company_Code"),
  //       Item_Code: 0,
  //       ClosingQty: closingQty,
  //       ClosingValue: closingValue,
  //     };

  //     // change this URL to your actual POST endpoint
  //     const res = await axios.post(`${API_URL}/post-closing-stock`, payload);

  //     // optional: you can show toast here
  //     console.log("Posted:", res.data);
  //   } catch (err) {
  //     console.error(err);
  //   } finally {
  //     setLoading(false);
  //   }
  // };


 const handlePostStockValue = async (e) => {
  e.preventDefault();

  // validate amount (0 or negative)
  const amt = Number(closingValue);
  if (!Number.isFinite(amt) || amt < 0) {
    await Swal.fire({
      icon: "warning",
      title: "Invalid Amount",
      text: "Closing Value must be greater than 0.",
      confirmButtonText: "OK",
    });
    return;
  }

  try {
    setLoading(true);

    const params = {
      Company_Code: sessionStorage.getItem("Company_Code"),
      Year_Code: sessionStorage.getItem("Year_Code"),
      doc_date: toDate,
      ClosingValue: amt, // send numeric
      Created_By: sessionStorage.getItem("username") || "",
    };

    const res = await axios.get(`${API_URL}/post-closing-stock-gledger-only`, { params });

    if (res?.data?.ok) {
      await Swal.fire({
        icon: "success",
        title: "Posted Successfully",
        text: "File posted successfully",
        confirmButtonText: "OK",
      });
    } else {
      await Swal.fire({
        icon: "error",
        title: "Post Failed",
        text: res?.data?.message || "Post failed",
        confirmButtonText: "OK",
      });
    }
  } catch (err) {
    await Swal.fire({
      icon: "error",
      title: "Post Failed",
      text: err?.response?.data?.message || "Post failed",
      confirmButtonText: "OK",
    });
  } finally {
    setLoading(false);
  }
};

  return (
    <div className=" mt-5">
      <div className="p-4 mx-auto" style={{ maxWidth: "800px" }}>
        <Container maxWidth="sm">
          <Paper elevation={3} sx={{ p: 4, mt: 6 }}>
            <Typography
              variant="h6"
              component="h1"
              gutterBottom
              sx={{
                textAlign: "center",
                fontSize: "1.2rem",
                fontWeight: "bold",
                color: "#2c3e50",
                marginBottom: "30px",
                padding: "12px 0",
                position: "relative",
                "&::after": {
                  content: '""',
                  position: "absolute",
                  bottom: "0",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "80px",
                  height: "4px",
                  background: "linear-gradient(90deg, #3498db, #2ecc71)",
                  borderRadius: "2px",
                  animation: "underlineGrow 0.5s ease-out forwards",
                },
                "@keyframes underlineGrow": {
                  "0%": { width: "0" },
                  "100%": { width: "80px" },
                },
              }}
            >
              Profit Loss/Balance Sheet
            </Typography>

            <Box component="form" onSubmit={handleGetReportClick} mt={5}>
              <Grid container spacing={3} justifyContent="center">
                <Grid item xs={7}>
                  <TextField
                    fullWidth
                    label="Upto Date"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    value={UptoDate}
                    onChange={(e) => setUptoDate(e.target.value)}
                    sx={{ maxWidth: 300 }}
                  />
                </Grid>

                <Grid item xs={7}>
                  <TextField
                    fullWidth
                    label="From Date"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </Grid>

                <Grid item xs={7}>
                  <TextField
                    fullWidth
                    label="To Date"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </Grid>

                {userType === "A" && (
                  <>
                    <Grid item xs={7}>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={handleGetStockQtyValue}
                        startIcon={<Inventory2Icon />}
                        disabled={loading}
                        sx={{
                          padding: "10px 16px",
                          fontSize: "0.95rem",
                          fontWeight: 600,
                          boxShadow: 1,
                          "&:hover": { boxShadow: 3, transform: "scale(1.01)" },
                          transition: "all 0.3s ease",
                        }}
                      >
                        Get Stock Qty & Value
                      </Button>
                    </Grid>

                    {showStockFields && (
                      <>
                        <Grid item xs={7}>
                          <TextField
                            fullWidth
                            label="Closing Stock Qty"
                            value={closingQty}
                            disabled
                          />
                        </Grid>

                        <Grid item xs={7}>
                          <TextField
                            fullWidth
                            label="Closing Stock Value"
                            value={closingValue}
                            onChange={(e) => setClosingValue(e.target.value)}
                          />
                        </Grid>

                        <Grid item xs={7}>
                          <Button
                            fullWidth
                            variant="contained"
                            color="secondary"
                            onClick={handlePostStockValue}
                            disabled={loading}
                            sx={{
                              padding: "10px 16px",
                              fontSize: "0.95rem",
                              fontWeight: 700,
                              boxShadow: 2,
                              "&:hover": { boxShadow: 4, transform: "scale(1.01)" },
                              transition: "all 0.3s ease",
                            }}
                          >
                            Post
                          </Button>
                        </Grid>
                      </>
                    )}
                  </>
                )}

                <Grid item xs={12} container justifyContent="center" spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      color="success"
                      onClick={handleGetReportClick}
                      startIcon={<BarChartIcon />}
                      sx={{
                        padding: "12px 16px",
                        fontSize: "1rem",
                        fontWeight: 600,
                        boxShadow: 3,
                        "&:hover": {
                          boxShadow: 6,
                          transform: "scale(1.02)",
                          backgroundColor: "#43a047",
                        },
                        transition: "all 0.3s ease",
                      }}
                    >
                      Profit & Loss
                    </Button>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Button
                      fullWidth
                      variant="contained"
                      color="primary"
                      onClick={handleBalanceSheetReportClick}
                      startIcon={<AccountBalanceIcon />}
                      sx={{
                        padding: "12px 16px",
                        fontSize: "1rem",
                        fontWeight: 600,
                        boxShadow: 3,
                        "&:hover": {
                          boxShadow: 6,
                          transform: "scale(1.02)",
                          backgroundColor: "#1565c0",
                        },
                        transition: "all 0.3s ease",
                      }}
                    >
                      Balance Sheet
                    </Button>
                  </Grid>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Container>
      </div>
    </div>
  );
};

export default ProfitLoss;
