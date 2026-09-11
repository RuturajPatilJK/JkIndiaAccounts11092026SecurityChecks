import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AccountMasterHelp from "../../../Helper/AccountMasterHelp";
import {  Grid,  TextField,
  Typography,
  Paper,
} from "@mui/material";
import ReportButton from "../../../Common/Buttons/ReportButton"
import { FaDownload } from 'react-icons/fa';
import Swal from "sweetalert2";

const CarporateRegister = () => {
  const today = new Date().toISOString().split("T")[0];
  const [acCode, setAcCode] = useState("");
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [lotNo, setLotNo] = useState("");
  const [srNo, setSrNo] = useState("");
  const [accoid, setAccoid] = useState("");
  const [acname, setAcName] = useState("");
  const AccountYear = sessionStorage.getItem("Accounting_Year");
    const [accountType, setAccountType] = useState('C');

  const navigate = useNavigate();

  // useEffect(() => {
  //   if (AccountYear) {
  //     const dates = AccountYear.split(" - ");
  //     if (dates.length === 2) {
  //       setFromDate(dates[0]);
  //       setToDate(dates[1]);
  //     }
  //   }
  // }, [AccountYear]);

  const handleAcCode = (code, accoid, name) => {
    setAcCode(code);
    setAccoid(accoid);
    setAcName(name);
  };

  const handleChange = (event) => {
        setAccountType(event.target.value);
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
     
     
      case "Balance Report":
        window.open(`/CarporateSaleBalanceRegister?fromDate=${fromDate}&toDate=${toDate}&acCode=${acCode}`, "_blank");
        
        break;
     
      case "Lotwise Detail":
        const params11 = new URLSearchParams({
          acCode,
          fromDate,
          toDate,
          lotNo ,
          accountType

        }).toString();

        window.open(`/CarporateSaleDetailRegister?${params11}`, '_blank');
        break;

      
      default:
        break;
    }
  };

  return (
    <>
      <Paper
        elevation={3}
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

        <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
  <label htmlFor="SaleTCSTDS" className="GSTUtilitieslabel">Carporate Type :</label>
            <select
                id="SaleTCSTDS"
                name="SaleTCSTDS"
                value={accountType}
                onChange={handleChange}
                className="form-select"
            >
      <option value="C">Carporate sale</option>
      <option value="P">PDS Sale</option>
  </select>
</Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              label="From Date"
              type="date"
              size="small"
              fullWidth
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              InputLabelProps={{ shrink: true, style: { fontSize: '12px' } }}
              InputProps={{
                style: { fontSize: '12px', height: '35px' },
              }}
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <TextField
              label="To Date"
              type="date"
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true, style: { fontSize: '12px' } }}
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              InputProps={{
                style: { fontSize: '12px', height: '35px' },
              }}
            />
          </Grid>

          <Grid container spacing={2} mt={2} ml={1} >
            <div className="receiptpaymentdiv" >
              <label htmlFor="AC_CODE" className="receiptpaymentlabel">
                Mill Name :
              </label>
              <div className="receiptpayment-col">
                <div className="receiptpayment-form-group">
                  <AccountMasterHelp
                    onAcCodeClick={handleAcCode}
                    name="AC_CODE"
                    CategoryName={acname}
                    CategoryCode={acCode}
                    tabIndexHelp={1}
                    Ac_type={[]}
                  />
                </div>
              </div>
            </div>
          </Grid>

          <Grid item xs={12} sm={3}>
            <TextField
              label="Lot No"
              size="small"
              fullWidth
              value={lotNo}
              onChange={(e) => setLotNo(e.target.value)}
            />
          </Grid>

         
        </Grid>
      </Paper>

      <Grid item xs={12} sx={{ width: "100%" }}>
        <Grid container spacing={2} justifyContent="center">
          {[
            "Balance Report",
            "Lotwise Detail"
           
          ].map((label, index) => (
            <Grid item key={index}>
              <ReportButton
                label={label}
                icon={FaDownload}
                onClick={() => handleButtonClick(label)}
              />
            </Grid>
          ))}
        </Grid>
      </Grid>
    </>
  );
};

export default CarporateRegister;