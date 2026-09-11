import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, TextField, Typography, Grid, Paper } from "@mui/material";
import AccountMasterHelp from "../../../../Helper/AccountMasterHelp";
import LotNoHelp from "../../../../Helper/ProfitNLossLotNoHelp";

const ProfitNLoss = () => {
  const [acCode, setAcCode] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [accoid, setAccoid] = useState("");
  const [acname, setacname] = useState("");
  const [lotNo, setLotNo] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);

  const AccountYear = sessionStorage.getItem("Accounting_Year");
  const navigate = useNavigate();

  useEffect(() => {
    if (AccountYear) {
      const [start, end] = AccountYear.split(" - ");
      setFromDate(start || "");
      setToDate(end || "");
    }
  }, [AccountYear]);

  const handleAc_Code = (code, accoid, name) => {
    setAcCode(code);
    setAccoid(accoid);
    setacname(name);
  };

  const handleLotNo = (lot, lotDate) => {
    setLotNo(lot);
    setDate(lotDate);
  };

  const getProfitLossReport = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const url = `/profit-loss-report?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&millCode=${encodeURIComponent(acCode)}&lotNo=${encodeURIComponent(lotNo)}`;
      window.open(url, '_blank');
      setLoading(false);
    }, 500);
  };

  return (
    <Box maxWidth="600px" mx="auto" mt={4}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" align="center" gutterBottom fontWeight="bold">
          Tenderwise Profit & Loss Report
        </Typography>

        <Box component="form" onSubmit={getProfitLossReport}>
          <Grid container spacing={3}>
           <Grid item xs={12} container alignItems="center" spacing={2}>
  <Grid item xs={2}>
    <Typography fontWeight={600}>Mill Code:</Typography>
  </Grid>
  <Grid item xs={10}>
    <AccountMasterHelp
      onAcCodeClick={handleAc_Code}
      name="AC_CODE"
      CategoryName={acname}
      CategoryCode={acCode}
      tabIndexHelp={1}
      Ac_type=""
    />
  </Grid>
</Grid>

<Grid item xs={12} container alignItems="center" spacing={2}>
  <Grid item xs={2}>
    <Typography fontWeight={600}>Lot No:</Typography>
  </Grid>
  <Grid item xs={10}>
    <LotNoHelp
      onLotNoClick={handleLotNo}
      name="Lot_No"
      MillCode={acCode}
      tabIndexHelp={2}
    />
  </Grid>
</Grid>


            <Grid item xs={12} sm={6}>
              <TextField
                label="From Date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="To Date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} textAlign="center">
              <Button
                type="submit"
                variant="contained"
                color="primary"
                sx={{ px: 4, py: 1.5, fontWeight: "bold", fontSize: "16px" }}
              >
                Generate Report
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
};

export default ProfitNLoss;
