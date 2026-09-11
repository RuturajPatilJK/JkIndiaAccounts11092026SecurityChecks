import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AccountMasterHelp from "../../../Helper/AccountMasterHelp";
import "./Ledger.css";
import { Typography, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { fetchAccountBalance } from "../../../Common/GetAccountBalance/GetAccountBalance";
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";
import Swal from "sweetalert2";
import { CircularProgress, Box } from '@mui/material'

const Ledger = () => {
  const [acCode, setAcCode] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [accoid, setAccoid] = useState("");
  const [acname, setacname] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingButton, setLoadingButton] = useState(false);
  const [balance, setBalance] = useState(0);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState("All");

  const navigate = useNavigate();

  const AccountYear = sessionStorage.getItem("Accounting_Year");
  const Compay_Code = sessionStorage.getItem("Company_Code");
  const Year_Code = sessionStorage.getItem("Year_Code");

  useEffect(() => {
    if (AccountYear) {
      const dates = AccountYear.split(" - ");
      if (dates.length === 2) {
        setFromDate(dates[0]);
        setToDate(dates[1]);
      }
    }
  }, [AccountYear]);

  useEffect(() => {
    if (acCode === "") {
      setBalance(0);
    }
  }, [acCode]);

  const handleAc_Code = async (code, accoid, name) => {
    if (!code) {
      setAcCode("");
      setAccoid("");
      setacname("");
      setBalance(0);
      return;
    }
    setAcCode(code);
    setAccoid(accoid);
    setacname(name);

    const { balance, gstNo } = await fetchAccountBalance(code);
    if (balance !== null) {
      setBalance(balance);
    }
  };

  const handleFilterChange = (e) => {
    setFilterType(e.target.value);
  };


  const handleGetReportClick = (e) => {
    e.preventDefault();
    if (!acCode) {
      Swal.fire({
        icon: 'warning',
        title: 'Account Not Selected',
        text: 'Please select an account before generating the report.',
      });
      return;
    }
    // setLoading(true);
    setLoadingButton('report');
    setTimeout(() => {
      const url = `/ledger-report?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&acname=${encodeURIComponent(acname)}&acCode=${encodeURIComponent(acCode)}&Trans_Type=${encodeURIComponent(filterType)}`;
      window.open(url, '_blank');
      setLoadingButton(null);
    }, 500);
  };


  const handleFetchCALedgerReport = (e) => {
    e.preventDefault();
    if (!acCode) {
      Swal.fire({
        icon: 'warning',
        title: 'Account Not Selected',
        text: 'Please select an account before generating the report.',
      });
      return;
    }
    // setLoading(true);
    setLoadingButton('ca_report');
    setTimeout(() => {
      const url = `/CA-ledger-report?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&acname=${encodeURIComponent(acname)}&acCode=${encodeURIComponent(acCode)}&Trans_Type=${encodeURIComponent(filterType)}`;
      window.open(url, '_blank');
      setLoadingButton(null);
    }, 500);
  };


  const getCAWiseLedger = (e) => {
    e.preventDefault();
    if (!acCode) {
      Swal.fire({
        icon: 'warning',
        title: 'Account Not Selected',
        text: 'Please select an account before generating the report.',
      });
      return;
    }
    setLoadingButton('ca');
    setTimeout(() => {
      const url = `/getAllledger-report?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&acCode=${encodeURIComponent(acCode)}`;
      window.open(url, '_blank');
      setLoadingButton(null);
    }, 500);
  };


  const handleStatistics = (e) => {
    setLoadingButton('stats');
    setTimeout(() => {
      // Change 'Tras_Type' to 'Trans_Type' to match what the report component expects
      const url = `/StatisticData-report?fromDT=${encodeURIComponent(fromDate)}&toDT=${encodeURIComponent(toDate)}&Company_Code=${encodeURIComponent(Compay_Code)}`;
      window.open(url, '_blank');
      setLoadingButton(null);
    }, 500);
  }


  const handleGenrateWithoutOpning = (e) => {
    e.preventDefault();
    if (!acCode) {
      Swal.fire({
        icon: 'warning',
        title: 'Account Not Selected',
        text: 'Please select an account before generating the report.',
      });
      return;
    }
    setLoadingButton('ledgerNoOp');
    setTimeout(() => {
      const url = `/ledger-withoutopeningbalance?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&acname=${encodeURIComponent(acname)}&acCode=${encodeURIComponent(acCode)}&Trans_Type=${encodeURIComponent(filterType)}`;
      window.open(url, '_blank');
      setLoadingButton(null);
    }, 500);
  };


  const handleMultipleSBPrint = (e) => {
    e.preventDefault();
    if (!acCode && !(fromDate && toDate)) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Filter',
        text: 'Please select an account or provide both From Date and To Date.',
      });
      return;
    }
    setLoadingButton('multipleSBPrint');
    setTimeout(() => {
      const params = new URLSearchParams();
      if (acCode) { params.set('acCode', acCode); params.set('acname', acname); }
      if (fromDate) params.set('fromDate', fromDate);
      if (toDate) params.set('toDate', toDate);
      window.open(`/multipleSBPrint?${params.toString()}`, '_blank');
      setLoadingButton(null);
    }, 500);
  };

  const handleMonthWiseLedger = (e) => {
    e.preventDefault();
    if (!acCode) {
      Swal.fire({
        icon: 'warning',
        title: 'Account Not Selected',
        text: 'Please select an account before generating the report.',
      });
      return;
    }
    setLoadingButton('monthWise');
    setTimeout(() => {
      const url = `/ledger-monthwise-report?acCode=${encodeURIComponent(acCode)}&acName=${encodeURIComponent(acname)}&fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}`;
      window.open(url, '_blank');
      setLoadingButton(null);
    }, 300);
  };


  return (
    <div className="ledger-container">
      <div className="ledger-card">
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
          Ledger Report
        </Typography>
        <form onSubmit={handleGetReportClick}>
          <div className="ledger-form">
            <div className="form-group" style={{ marginLeft: "-8px" }}>
              <label htmlFor="AC_CODE" className="form-label">
                Account Code:
              </label>
              <div className="account-help-container">
                <AccountMasterHelp
                  onAcCodeClick={handleAc_Code}
                  name="AC_CODE"
                  CategoryName={acname}
                  CategoryCode={acCode}
                  Ac_type={[]}
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="fromDate" className="form-label">
                From Date:
              </label>
              <input
                type="date"
                id="fromDate"
                className="form-input"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                min="1000-01-01"
                max="9999-12-31"
              />
            </div>
            <div className="form-group">
              <label htmlFor="toDate" className="form-label">
                To Date:
              </label>
              <input
                type="date"
                id="toDate"
                className="form-input"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                min="1000-01-01"
                max="9999-12-31"
              />
            </div>
            <div className="form-group">
              <label htmlFor="toDate" className="form-label">
                Trans Type :
              </label>
              <FormControl fullWidth variant="outlined" sx={{ width: "140px", marginTop: '10px' }}>
                <Select
                  value={filterType}
                  onChange={handleFilterChange}
                  size="small"
                >
                  <MenuItem value="All">All</MenuItem>
                  <MenuItem value="BP">Bank Payment</MenuItem>
                  <MenuItem value="BR">Bank Receipt</MenuItem>
                  <MenuItem value="CP">Cash Payment</MenuItem>
                  <MenuItem value="CS">Credit Note To Supplier</MenuItem>
                  <MenuItem value="CN">Credit Note To Customer</MenuItem>
                  <MenuItem value="CR">Cash Receipt</MenuItem>
                  <MenuItem value="DN">Debit Note To Customer</MenuItem>
                  <MenuItem value="DS">Debit Note To Supplier</MenuItem>
                  <MenuItem value="DO">Delivery Order</MenuItem>
                  <MenuItem value="JV">Journal Voucher</MenuItem>
                  <MenuItem value="CV">CV</MenuItem>
                  <MenuItem value="LV">LV</MenuItem>
                  <MenuItem value="XP">Other Purchase</MenuItem>
                  <MenuItem value="PS">Purchase Bill</MenuItem>
                  <MenuItem value="PR">Purchase Return</MenuItem>
                  <MenuItem value="RB">Service Bill</MenuItem>
                  <MenuItem value="SB">Sale Bill</MenuItem>
                  <MenuItem value="UI">UTR Entry</MenuItem>

                </Select>
              </FormControl>
            </div>
          </div>
          {/* <h4> Balance: ₹ {formatReadableAmount(balance)} {balance > 0 ? "Dr" : balance < 0 ? "Cr" : ""}</h4> */}
          <h4 className={`balance-display ${balance > 0 ? 'credit' : balance < 0 ? 'debit' : ''}`}>
            Balance: ₹ {formatReadableAmount(balance)} {balance > 0 ? "Dr" : balance < 0 ? "Cr" : ""}
          </h4>

          <button
            type="submit"
            className="submit-button"
            onClick={handleGetReportClick}
            disabled={loadingButton === 'report'}
          >
            {loadingButton === 'report' ? (
              <CircularProgress size={20} />
            ) : 'Get Report'}
          </button>


          <button
            type="submit"
            className="submit-button"
            onClick={handleFetchCALedgerReport}
            disabled={loadingButton === 'ca_report'}
          >
            {loadingButton === 'ca_report' ? (
              <CircularProgress size={20} />
            ) : 'Get Report CA View '}
          </button>

          <button
            type="submit"
            className="submit-button"
            onClick={getCAWiseLedger}
            disabled={loadingButton === 'ca'}
          >
            {loadingButton === 'ca' ? <CircularProgress size={20} /> : 'Get Report (As Per C.A.)'}
          </button>


          {/* Uncomment this button if you want the daybook functionality */}
          {/* <button className="submit-button" onClick={handleGetDayBook}>
            DAY BOOK
          </button> */}

        </form>
        <button
          type="submit"
          className="submit-button"
          onClick={handleStatistics}
          disabled={loadingButton === 'stats'}
        >
          {loadingButton === 'stats' ? (
            <CircularProgress size={20} />
          ) : (
            'Statistics'
          )}
        </button>


        <button
          type="submit"
          className="submit-button"
          onClick={handleGenrateWithoutOpning}
          disabled={loadingButton === 'ledgerNoOp'}
        >
          {loadingButton === 'ledgerNoOp' ? (
            <CircularProgress size={20} />
          ) : (
            'Ledger Without O/P'
          )}
        </button>

         <button
          type="submit"
          className="submit-button"
          onClick={handleMultipleSBPrint}
          disabled={loadingButton === 'multipleSBPrint'}
        >
          {loadingButton === 'multipleSBPrint' ? (
            <CircularProgress size={20} />
          ) : (
            'Multiple SB Print'
          )}
        </button>

        <button
          type="button"
          className="submit-button"
          onClick={handleMonthWiseLedger}
          disabled={loadingButton === 'monthWise'}
        >
          {loadingButton === 'monthWise' ? (
            <CircularProgress size={20} />
          ) : (
            'Month Wise Ledger'
          )}
        </button>

      </div>
    </div>
  );
};

export default Ledger;
