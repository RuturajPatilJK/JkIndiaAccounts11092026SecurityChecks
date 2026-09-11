// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import AccountMasterHelp from "../../../../Helper/AccountMasterHelp";
// import {
//   Grid,
//   TextField,
//   Typography,
//   Paper,
// } from "@mui/material";
// import ReportButton from "../../../../Common/Buttons/ReportButton"
// import { FaDownload } from 'react-icons/fa';
// import Swal from "sweetalert2";

// const Register = () => {
//   const today = new Date().toISOString().split("T")[0];
//   const [acCode, setAcCode] = useState("");
//   const [fromDate, setFromDate] = useState(today);
//   const [toDate, setToDate] = useState(today);
//   const [lotNo, setLotNo] = useState("");
//   const [srNo, setSrNo] = useState("");
//   const [accoid, setAccoid] = useState("");
//   const [acname, setAcName] = useState("");
//   const AccountYear = sessionStorage.getItem("Accounting_Year");


//   const navigate = useNavigate();

//   // useEffect(() => {
//   //   if (AccountYear) {
//   //     const dates = AccountYear.split(" - ");
//   //     if (dates.length === 2) {
//   //       setFromDate(dates[0]);
//   //       setToDate(dates[1]);
//   //     }
//   //   }
//   // }, [AccountYear]);

//   const handleAcCode = (code, accoid, name) => {
//     setAcCode(code);
//     setAccoid(accoid);
//     setAcName(name);
//   };

//   const handleButtonClick = (label) => {
//     const params = new URLSearchParams({
//       acCode: acCode || '',
//       fromDate,
//       toDate,
//       lotNo: lotNo || '',
//       srNo: srNo || ''
//     }).toString();

//     switch (label) {
//       case "Dispatch Mill Wise":
//         window.open(`/dispatch-mill-wise?${params}`, "_blank");
//         break;
//       case "Dispatch Details":
//         window.open(`/DispatchDetailsRegister?${params}`, "_blank");
//         window.open(`/DispatchDetailsNewRegister?${params}`, "_blank");
//         break;
//       case "Dispatch Grade Wise":
//         window.open(`/dispatch-grade-wise?${params}`, "_blank");
//         break;
//       case "Dispatch Detail For Mill":
//         window.open(`/DispatchDetailsForMill?${params}`, "_blank");
//         break;
//       case "Dispatch Summary":
//         window.open(`/DispatchSummary?fromDate=${fromDate}&toDate=${toDate}`, "_blank");
//         break;
//       case "Category wise Dispatch":
//         const params22 = new URLSearchParams({
//           fromDate,
//           toDate,
//         }).toString();
//         window.open(`/MillwiseDispatch?${params22}`, '_blank');
//         window.open(`/TransportWiseDispatch?${params22}`, '_blank');
//         window.open(`/DOWiseDispatch?${params22}`, '_blank');
//         break;
//       case "Party Wise DO":
//         window.open(`/Party-wise-DO?${params}`, "_blank");
//         window.open(`/Party-wise-DO_with-Mill?${params}`, "_blank");
//         break;
//       case "Transport A/C":
//         const params8 = new URLSearchParams({
//           acCode,
//           fromDate,
//           toDate,

//         }).toString();

//         window.open(`/TransportAc-Register?${params8}`, '_blank');
//         break;
//       case "Dispatch Difference":
//         window.open(`/DispatchDiffRecieve?fromDate=${fromDate}&toDate=${toDate}`, "_blank");
//         window.open(`/DispatchDiffPay?fromDate=${fromDate}&toDate=${toDate}`, "_blank");
//         break;
//       case "Balance Stock Summary":
//         const params12 = new URLSearchParams({
//           acCode: acCode || '',
//           fromDate,
//           toDate,
//           lotNo: lotNo || '',
//           srNo: srNo || ''
//         }).toString();
//         window.open(`/BalanceStockSummary-Register?${params12}`, '_blank');
//         break;
//       case "Dispatch Register":
//         const params11 = new URLSearchParams({
//           acCode,
//           fromDate,
//           toDate,
//         }).toString();

//         window.open(`/NewDispatchRegister-Register?${params11}`, '_blank');
//         break;

//       case "Mill Wise Purchase":
//         const params111 = new URLSearchParams({
//           acCode,
//           fromDate,
//           toDate,

//         }).toString();

//         window.open(`/MillWisePurchase-Register?${params111}`, '_blank');
//         break;
//       case "Mill Payment for GST":
//         const params1111 = new URLSearchParams({
//           acCode,
//           fromDate,
//           toDate,
//         }).toString();

//         window.open(`/MillPaymentForGST-Register?${params1111}`, '_blank');
//         break;
//       default:
//         break;
//     }
//   };

//   return (
//     <>
//       <Paper
//         elevation={3}
//         sx={{
//           padding: 4,
//           maxWidth: 1000,
//           margin: "30px auto",
//           borderRadius: 2,
//         }}
//       >
//         <Typography variant="h6"
//           component="h1"
//           gutterBottom
//           sx={{
//             textAlign: 'center',
//             fontSize: '1.2rem',
//             fontWeight: 'bold',
//             color: '#2c3e50',
//             marginBottom: '30px',
//             padding: '12px 0',
//             position: 'relative',
//             '&::after': {
//               content: '""',
//               position: 'absolute',
//               bottom: '0',
//               left: '50%',
//               transform: 'translateX(-50%)',
//               width: '80px',
//               height: '4px',
//               background: 'linear-gradient(90deg, #3498db, #2ecc71)',
//               borderRadius: '2px',
//               animation: 'underlineGrow 0.5s ease-out forwards'
//             },
//             '@keyframes underlineGrow': {
//               '0%': { width: '0' },
//               '100%': { width: '80px' }
//             }
//           }}>
//           Register
//         </Typography>

//         <Grid container spacing={2}>

//           <Grid item xs={12} sm={3}>
//             <TextField
//               label="From Date"
//               type="date"
//               size="small"
//               fullWidth
//               value={fromDate}
//               onChange={(e) => setFromDate(e.target.value)}
//               InputLabelProps={{ shrink: true, style: { fontSize: '12px' } }}
//               InputProps={{
//                 style: { fontSize: '12px', height: '35px' },
//               }}
//             />
//           </Grid>

//           <Grid item xs={12} sm={3}>
//             <TextField
//               label="To Date"
//               type="date"
//               size="small"
//               fullWidth
//               InputLabelProps={{ shrink: true, style: { fontSize: '12px' } }}
//               value={toDate}
//               onChange={(e) => setToDate(e.target.value)}
//               InputProps={{
//                 style: { fontSize: '12px', height: '35px' },
//               }}
//             />
//           </Grid>

//           <Grid container spacing={2} mt={2} ml={1} >
//             <div className="receiptpaymentdiv" >
//               <label htmlFor="AC_CODE" className="receiptpaymentlabel">
//                 Mill Name :
//               </label>
//               <div className="receiptpayment-col">
//                 <div className="receiptpayment-form-group">
//                   <AccountMasterHelp
//                     onAcCodeClick={handleAcCode}
//                     name="AC_CODE"
//                     CategoryName={acname}
//                     CategoryCode={acCode}
//                     tabIndexHelp={1}
//                     Ac_type={[]}
//                   />
//                 </div>
//               </div>
//             </div>
//           </Grid>

//           <Grid item xs={12} sm={3}>
//             <TextField
//               label="Lot No"
//               size="small"
//               fullWidth
//               value={lotNo}
//               onChange={(e) => setLotNo(e.target.value)}
//             />
//           </Grid>

//           <Grid item xs={12} sm={3}>
//             <TextField
//               label="Sr No"
//               size="small"
//               fullWidth
//               value={srNo}
//               onChange={(e) => setSrNo(e.target.value)}
//             />
//           </Grid>
//         </Grid>
//       </Paper>

//       <Grid item xs={12} sx={{ width: "100%" }}>
//         <Grid container spacing={2} justifyContent="center">
//           {[
//             "Dispatch Mill Wise",
//             "Dispatch Details",
//             "Dispatch Grade Wise",
//             "Dispatch Detail For Mill",
//             "Party Wise DO",
//             "Transport A/C",
//             "Category wise Dispatch",
//             "Balance Stock Summary",
//             "Dispatch Register",
//             "Dispatch Summary",
//             "Dispatch Difference",
//             "Mill Wise Purchase",
//             "Mill Payment for GST"
//           ].map((label, index) => (
//             <Grid item key={index}>
//               <ReportButton
//                 label={label}
//                 icon={FaDownload}
//                 onClick={() => handleButtonClick(label)}
//               />
//             </Grid>
//           ))}
//         </Grid>
//       </Grid>
//     </>
//   );
// };

// export default Register;































import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AccountMasterHelp from "../../../../Helper/AccountMasterHelp";
import {
  Grid,
  TextField,
  Typography,
  Paper,
  Box,
  Divider
} from "@mui/material";
import ReportButton from "../../../../Common/Buttons/ReportButton"
import { FaDownload } from 'react-icons/fa';
import Swal from "sweetalert2";

const Register = () => {
  const today = new Date().toISOString().split("T")[0];
  const [acCode, setAcCode] = useState("");
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [lotNo, setLotNo] = useState("");
  const [srNo, setSrNo] = useState("");
  const [accoid, setAccoid] = useState("");
  const [acname, setAcName] = useState("");
  const AccountYear = sessionStorage.getItem("Accounting_Year");
  const companyCode = sessionStorage.getItem("Company_Code");
  const YearCode = sessionStorage.getItem("Year_Code");



  const navigate = useNavigate();
  const handleAcCode = (code, accoid, name) => {
    setAcCode(code);
    setAccoid(accoid);
    setAcName(name);
  };

  const handleButtonClick = (label) => {
    const params = new URLSearchParams({
      acCode: acCode || '',
      fromDate,
      toDate,
      lotNo: lotNo || '',
      srNo: srNo || ''
    }).toString();

    switch (label) {
      case "Dispatch Mill Wise":
        window.open(`/dispatch-mill-wise?${params}`, "_blank");
        break;
      case "Dispatch Details":
        window.open(`/DispatchDetailsRegister?${params}`, "_blank");
        window.open(`/DispatchDetailsNewRegister?${params}`, "_blank");
        break;
      case "Dispatch Grade Wise":
        window.open(`/dispatch-grade-wise?${params}`, "_blank");
        break;
      case "Dispatch Detail For Mill":
        window.open(`/DispatchDetailsForMill?${params}`, "_blank");
        break;
      case "Dispatch Summary":
        window.open(`/DispatchSummary?fromDate=${fromDate}&toDate=${toDate}`, "_blank");
        break;
      case "Category wise Dispatch":
        const params22 = new URLSearchParams({
          fromDate,
          toDate,
        }).toString();
        window.open(`/MillwiseDispatch?${params22}`, '_blank');
        window.open(`/TransportWiseDispatch?${params22}`, '_blank');
        window.open(`/DOWiseDispatch?${params22}`, '_blank');
        break;
      case "Party Wise DO":
        window.open(`/Party-wise-DO?${params}`, "_blank");
        window.open(`/Party-wise-DO_with-Mill?${params}`, "_blank");
        break;
      case "Transport A/C":
        const params8 = new URLSearchParams({
          acCode,
          fromDate,
          toDate,

        }).toString();

        window.open(`/TransportAc-Register?${params8}`, '_blank');
        break;
      case "Dispatch Difference":
        window.open(`/DispatchDiffRecieve?fromDate=${fromDate}&toDate=${toDate}`, "_blank");
        window.open(`/DispatchDiffPay?fromDate=${fromDate}&toDate=${toDate}`, "_blank");
        break;
      case "Balance Stock Summary":
        const params12 = new URLSearchParams({
          acCode: acCode || '',
          fromDate,
          toDate,
          lotNo: lotNo || '',
          srNo: srNo || ''
        }).toString();
        window.open(`/BalanceStockSummary-Register?${params12}`, '_blank');
        break;
      case "Dispatch Register":
        const params11 = new URLSearchParams({
          acCode,
          fromDate,
          toDate,
        }).toString();

        window.open(`/NewDispatchRegister-Register?${params11}`, '_blank');
        break;

      case "Mill Wise Purchase":
        const params111 = new URLSearchParams({
          acCode,
          fromDate,
          toDate,

        }).toString();

        window.open(`/MillWisePurchase-Register?${params111}`, '_blank');
        break;
      case "Mill Payment for GST":
        const params1111 = new URLSearchParams({
          acCode,
          fromDate,
          toDate,
        }).toString();

        window.open(`/MillPaymentForGST-Register?${params1111}`, '_blank');
        break;


      case "Daliy suda Dispach":
        const params13 = new URLSearchParams({
          Company_Code: companyCode,
          Year_Code: YearCode,
          fromDT: fromDate,
          toDT: toDate,
        }).toString();

        window.open(`/DaliySudaDispatch?${params13}`, "_blank");
        break;

      default:
        break;
    }
  };

  return (
    <>
      <Paper
        sx={{
          padding: 4,
          maxWidth: 1000,
          margin: "30px auto",
          borderRadius: 2,
        }}
      >
        <Typography variant="h6"
          component="h1"
          gutterBottom
          sx={{
            textAlign: 'center',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            color: '#2c3e50',
            marginBottom: '30px',
            padding: '12px 0',
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: '0',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '80px',
              height: '4px',
              background: 'linear-gradient(90deg, #3498db, #2ecc71)',
              borderRadius: '2px',
              animation: 'underlineGrow 0.5s ease-out forwards'
            },
            '@keyframes underlineGrow': {
              '0%': { width: '0' },
              '100%': { width: '80px' }
            }
          }}>
          Register
        </Typography>



        <Grid container spacing={1} alignItems="center">
          {/* Row 1: Dates and Numbers */}
          <Grid item xs={6} sm={3}>
            <TextField
              label="From Date"
              type="date"
              fullWidth
              size="small"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField
              label="To Date"
              type="date"
              fullWidth
              size="small"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* Row 2: Mill Name */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
              <Typography sx={{ fontWeight: '600', minWidth: '85px', fontSize: '0.9rem' }}>
                Mill Name:
              </Typography>
              <Box sx={{ flexGrow: 1 }}>
                <AccountMasterHelp
                  onAcCodeClick={handleAcCode}
                  name="AC_CODE"
                  CategoryName={acname}
                  CategoryCode={acCode}
                  tabIndexHelp={1}
                  Ac_type={[]}
                />
              </Box>
            </Box>
          </Grid>

          <Grid item xs={6} sm={3}>
            <TextField
              label="Lot No"
              size="small"
              fullWidth
              value={lotNo}
              onChange={(e) => setLotNo(e.target.value)}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField
              label="Sr No"
              size="small"
              fullWidth
              value={srNo}
              onChange={(e) => setSrNo(e.target.value)}
            />
          </Grid>

        </Grid>
      </Paper>

      <Divider sx={{ borderStyle: 'dashed', my: 4, borderWidth: 1, borderColor: '#ccc' }} />

      <Grid container justifyContent="center" sx={{ width: "100%", mt: 2 }}>
        <Grid
          item
          xs={12}
          container
          spacing={2}
          justifyContent="center"
          sx={{ maxWidth: '1200px' }}
        >
          {[
            "Dispatch Mill Wise",
            "Party Wise DO",
            "Transport A/C",
            "Balance Stock Summary",
            "Category wise Dispatch",
            "Dispatch Register",
            "Dispatch Grade Wise",
            "Dispatch Detail For Mill",
            "Dispatch Summary",
            "Dispatch Difference",
            "Mill Wise Purchase",
            "Mill Payment for GST",
            "Dispatch Details",
             "Daliy suda Dispach"
          ].map((label, index) => (
            <Grid
              item
              key={index}
              sx={{
                /* 12 columns / 5 items = 20% */
                flexBasis: { xs: '80%', sm: '33.33%', md: '20%' },
                maxWidth: { xs: '80%', sm: '33.33%', md: '20%' },
                display: 'flex',
                justifyContent: 'center'
              }}
            >
              <ReportButton
                label={label}
                icon={FaDownload}
                onClick={() => handleButtonClick(label)}
                sx={{ width: '80%' }}
              />
            </Grid>
          ))}
        </Grid>
      </Grid>
    </>
  );
};

export default Register;