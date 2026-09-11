import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AccountMasterHelp from "../../../../Helper/AccountMasterHelp";
import "./BankBook.css";
import { Typography } from '@mui/material';
import Swal from "sweetalert2";

const BankBook = () => {
  const [acCode, setAcCode] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [accoid, setAccoid] = useState("");
  const [acname, setacname] = useState("");
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate();

  const AccountYear = sessionStorage.getItem("Accounting_Year");

  useEffect(() => {
    if (AccountYear) {
      const dates = AccountYear.split(" - ");
      if (dates.length === 2) {
        setFromDate(dates[0]);
        setToDate(dates[1]);
      }
    }
  }, [AccountYear]);

  const handleAc_Code = (code, accoid, name) => {
    setAcCode(code);
    setAccoid(accoid);
    setacname(name);
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
    setLoading(true);
    setTimeout(() => {
        const url = `/bank-book-report?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&acname=${encodeURIComponent(acname)}&acCode=${encodeURIComponent(acCode)}`;
        window.open(url, '_blank', 'toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=800,height=600');
        setLoading(false);
    }, 500);
};

  return (
    <div className="bankbook-container">
      <div className="bankbook-card">
        <Typography variant="h6" style={{ textAlign: 'center', fontSize: "24px", fontWeight: "bold", marginBottom: "40px" }}>Bank Book</Typography>
        <form onSubmit={handleGetReportClick} >
          <div className="bankbook-form" style={{marginLeft:"20px"}}>
            <div className="form-group" style={{marginLeft:"-8px"}}>
              <label htmlFor="AC_CODE" className="form-label">
                Bank Code:
              </label>
              <div className="account-help-container">
                <AccountMasterHelp
                  onAcCodeClick={handleAc_Code}
                  name="AC_CODE"
                  CategoryName={acname}
                  CategoryCode={acCode}
                  Ac_type={["B", "C"]}
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
              />
            </div>
          </div>
          <button type="submit" className="submit-button">
            Show Report
          </button>
        </form>
      </div>
    </div>
  );
};

export default BankBook;