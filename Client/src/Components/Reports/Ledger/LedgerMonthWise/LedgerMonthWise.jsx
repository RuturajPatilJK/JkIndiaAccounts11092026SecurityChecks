import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AccountMasterHelp from "../../../../Helper/AccountMasterHelp";

const companyCode = sessionStorage.getItem("Company_Code");

const LedgerMonthWise = () => {
  const [acCode, setAcCode]     = useState("");
  const [accoid, setAccoid]     = useState("");
  const [acName, setAcName]     = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate]     = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const accountYear = sessionStorage.getItem("Accounting_Year");
    if (accountYear) {
      const parts = accountYear.split(" - ");
      if (parts.length === 2) {
        setFromDate(parts[0]);
        setToDate(parts[1]);
      }
    }
  }, []);

  const handleAcCode = (code, id, name) => {
    setAcCode(code || "");
    setAccoid(id || "");
    setAcName(name || "");
  };

  const handleGetReport = () => {
    if (!acCode) {
      alert("Please select an account.");
      return;
    }
    if (!fromDate || !toDate) {
      alert("Please enter From Date and To Date.");
      return;
    }
    navigate("/ledger-monthwise-report", {
      state: { acCode, accoid, acName, fromDate, toDate, companyCode },
    });
  };

  const card = {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: "20px 22px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  };

  const labelStyle = {
    fontSize: 12,
    fontWeight: 600,
    color: "#6b7280",
    display: "block",
    marginBottom: 6,
  };

  const inputStyle = {
    width: "100%",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    padding: "8px 12px",
    fontSize: 13,
    color: "#111827",
    background: "#fff",
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", display: "flex", justifyContent: "center", padding: "32px 16px" }}>
      <div style={{ width: "100%", maxWidth: 520 }}>

        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111827", margin: 0 }}>
            Month Wise Ledger Report
          </h1>
          <p style={{ fontSize: 13, color: "#6b7280", margin: "4px 0 0" }}>
            View monthly debit, credit and balance for an account
          </p>
        </div>

        <div style={card}>
          {/* Account */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Account</label>
            <AccountMasterHelp
              onAcCodeClick={handleAcCode}
              name="Ac_Code"
              AcName={acName}
              AcCode={acCode}
            />
            {acName && (
              <span style={{ fontSize: 11, color: "#6b7280", marginTop: 4, display: "block" }}>
                {acCode} — {acName}
              </span>
            )}
          </div>

          {/* Date row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            <div>
              <label style={labelStyle}>From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={handleGetReport}
              style={{
                background: "#2563eb",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "10px 28px",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Get Report
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LedgerMonthWise;
