import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AccountMasterHelp from "../../../../Helper/AccountMasterHelp";
import {
  Box,
  TextField,
  Grid,
  Button,
  Typography,
  Paper,
  Container
} from "@mui/material";

const InterestStatement = () => {
  // GET ACCOUNT YEAR from session storage
  const AccountYear = sessionStorage.getItem("Accounting_Year");

  const [acCode, setAcCode] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [email, setEmail] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [interestDays, setInterestDays] = useState("");
  const [accoid, setAccoid] = useState("");
  const [acname, setAcName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (AccountYear) {
      const dates = AccountYear.split(" - ");
      if (dates.length === 2) {
        setFromDate(dates[0]);
        setToDate(dates[1]);
      }
    }
  }, [AccountYear]);

  const handleAcCode = (code, accoid, name) => {
    setAcCode(code);
    setAccoid(accoid);
    setAcName(name);
  };

  // const handleGetReportClick = (e) => {
  //   e.preventDefault();
  //   navigate(`/interest-statement-report`, {
  //     state: {
  //       acCode,
  //       fromDate,
  //       toDate,
  //       email,
  //       interestRate,
  //       interestDays,
  //       acname,
  //       filter: "All",
  //     },
  //   });
  // };

  // const handleOnlyDrClick = (e) => {
  //   e.preventDefault();
  //   navigate(`/interest-statement-report`, {
  //     state: {
  //       acCode,
  //       fromDate,
  //       toDate,
  //       email,
  //       interestRate,
  //       interestDays,
  //       acname,
  //       filter: "OnlyDr",
  //     },
  //   });
  // };




  const handleGetReportClick = (e) => {
    e.preventDefault();
    const params = new URLSearchParams({
      acCode,
      fromDate,
      toDate,
      email,
      interestRate,
      interestDays,
      acname,
      filter: "All",
    }).toString();

    window.open(`/interest-statement-report?${params}`, "_blank");
  };

  const handleOnlyDrClick = (e) => {
    e.preventDefault();
    const params = new URLSearchParams({
      acCode,
      fromDate,
      toDate,
      email,
      interestRate,
      interestDays,
      acname,
      filter: "OnlyDr",
    }).toString();

    window.open(`/interest-statement-report?${params}`, "_blank");
  };

  return (
    <>
      <form >
        <Container maxWidth="sm" >
          <Typography mt={10} variant="h4" style={{ textAlign: 'center', fontSize: "24px", fontWeight: "bold" }}>Interest Statement</Typography>
          <Paper sx={{ p: 4, mt: 1 }}>
            <Box component="form" noValidate autoComplete="off">
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <div className="debitCreditNote-row">
                    <label className="label" style={{ whiteSpace: "nowrap" }}>Account Code :</label>
                    <div className="form-element">
                      <AccountMasterHelp
                        onAcCodeClick={handleAcCode}
                        name="AC_CODE"
                        CategoryName={acname}
                        CategoryCode={acCode}
                        tabIndexHelp={1}
                        Ac_type=""
                      />
                    </div>
                  </div>
                </Grid>

                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="From Date"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    value={fromDate}
                    autoComplete="off"
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </Grid>

                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="To Date"
                    type="date"
                    autoComplete="off"
                    InputLabelProps={{ shrink: true }}
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email Id"
                    type="email"
                    autoComplete="off"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Grid>

                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Interest Rate"
                    type="number"
                    autoComplete="off"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                  />
                </Grid>

                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Days"
                    type="number"
                    autoComplete="off"
                    value={interestDays}
                    onChange={(e) => setInterestDays(e.target.value)}
                  />
                </Grid>

                <Grid item xs={6} textAlign="center">
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    onClick={handleGetReportClick}
                  >
                    Show
                  </Button>
                </Grid>

                <Grid item xs={6} textAlign="center">
                  <Button
                    fullWidth
                    variant="outlined"
                    color="secondary"
                    onClick={handleOnlyDrClick}
                  >
                    Only Dr
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Container>
      </form>
    </>
  );
};

export default InterestStatement;