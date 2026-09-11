import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import AccountMasterHelp from "../../../../Helper/AccountMasterHelp";
import BackButton from "../../../../Common/Buttons/BackButton";
import { formatReadableAmount } from "../../../../Common/FormatFunctions/FormatAmount";

const API_URL = process.env.REACT_APP_API;

const labelStyle = {
  display: "block",
  fontSize: "11.5px",
  fontWeight: "700",
  color: "#475569",
  marginBottom: "5px",
  textAlign: "left",
  letterSpacing: "0.04em",
  textTransform: "uppercase",
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "9px",
  border: "1.5px solid #cbd5e0",
  fontSize: "14px",
  fontWeight: "600",
  boxSizing: "border-box",
  fontFamily: "'Signika', sans-serif",
  color: "#1e293b",
  outline: "none",
};

const RiskManagement = () => {
  const navigate = useNavigate();
  const companyCode = sessionStorage.getItem("Company_Code");

  const [selectedAcCode, setSelectedAcCode] = useState("");
  const [selectedAcName, setSelectedAcName] = useState("");
  const [selectedAccoid, setSelectedAccoid] = useState(null);

  const [limitBy, setLimitBy] = useState("Y");
  const [balLimit, setBalLimit] = useState("");
  // Kept separate from balLimit (which the user edits) so the previously
  // saved value stays visible for reference even after they start typing.
  const [currentBalLimit, setCurrentBalLimit] = useState(null);
  const [loadingAccount, setLoadingAccount] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleAccountSelect = (code, accoid, name) => {
    setSelectedAcCode(code);
    setSelectedAcName(name);
    setSelectedAccoid(accoid);
    setLimitBy("Y");
    setBalLimit("");
    setCurrentBalLimit(null);

    if (!code || !companyCode) return;

    setLoadingAccount(true);
    axios
      .get(`${API_URL}/getaccountmasterByid`, {
        params: { Ac_Code: code, Company_Code: companyCode },
      })
      .then((res) => {
        const data = res.data?.account_master_data || {};
        setLimitBy(data.Limit_By || "Y");
        const existingLimit =
          data.Bal_Limit !== null && data.Bal_Limit !== undefined
            ? parseFloat(data.Bal_Limit)
            : 0;
        setBalLimit(String(existingLimit));
        setCurrentBalLimit(existingLimit);
      })
      .catch(() => {
        toast.error("Failed to load current limit for this account.");
      })
      .finally(() => setLoadingAccount(false));
  };

  const handleSave = async () => {
    if (!selectedAccoid) {
      Swal.fire("Account Missing", "Please select an account first.", "info");
      return;
    }

    const val = balLimit === "" ? 0 : parseFloat(balLimit);
    if (isNaN(val) || val < 0) {
      Swal.fire(
        "Invalid Amount",
        "Balance Limit must be a valid non-negative number.",
        "warning"
      );
      return;
    }

    const confirm = await Swal.fire({
      title: "Confirm Save",
      html: `Update risk limit for <b>${selectedAcName}</b>?<br/><small>Limit By: <b>${limitBy}</b> &nbsp; Balance Limit: <b>${val.toFixed(2)}</b></small>`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Save",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });
    if (!confirm.isConfirmed) return;

    setSaving(true);
    try {
      await axios.put(`${API_URL}/update-account-risk-limit`, {
        accoid: selectedAccoid,
        Limit_By: limitBy,
        Bal_Limit: val,
      });
      Swal.fire("Saved!", `Risk limit updated for ${selectedAcName}.`, "success");
    } catch (err) {
      Swal.fire("Error", err.response?.data?.error || "Server error.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ fontFamily: "'Signika', 'Segoe UI', sans-serif", marginTop: "-60px" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Signika:wght@300;400;500;600;700&display=swap');`}</style>
      <ToastContainer autoClose={2000} />

      <div style={{ marginBottom: "20px" }}>
        <BackButton onClick={() => navigate("/DashBoard")} />
      </div>

      <h2
        style={{
          margin: 0,
          fontSize: "20px",
          fontWeight: "700",
          textAlign: "center",
          color: "#1e293b",
          marginBottom: "30px",
          letterSpacing: "0.01em",
        }}
      >
        Risk Management
      </h2>

      <div
        style={{
          maxWidth: "480px",
          margin: "0 auto",
          background: "white",
          borderRadius: "14px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.09)",
          padding: "28px",
          border: "1px solid #e2e8f0",
        }}
      >
        <div style={{ marginBottom: "20px" }}>
          <label style={labelStyle}>Select Party</label>
          <AccountMasterHelp
            onAcCodeClick={handleAccountSelect}
            CategoryName={selectedAcName}
            CategoryCode={selectedAcCode}
            name="RiskManagement_Account"
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={labelStyle}>Limit By</label>
          <select
            value={limitBy}
            onChange={(e) => setLimitBy(e.target.value)}
            disabled={!selectedAccoid || loadingAccount}
            style={inputStyle}
          >
            <option value="Y">Y - Balance Limit Applicable</option>
            <option value="N">N - Balance Limit Not Applicable</option>
          </select>
        </div>

        <div style={{ marginBottom: "24px" }}>
          <label style={labelStyle}>Balance Limit</label>
          {currentBalLimit !== null && (
            <div
              style={{
                fontSize: "12px",
                fontWeight: "700",
                color: "#2b6cb0",
                background: "#ebf8ff",
                border: "1px solid #90cdf4",
                borderRadius: "8px",
                padding: "6px 10px",
                marginBottom: "8px",
              }}
            >
              Current Balance Limit: {formatReadableAmount(currentBalLimit)}
            </div>
          )}
          <input
            type="number"
            min="0"
            step="0.01"
            value={balLimit}
            onChange={(e) => setBalLimit(e.target.value)}
            disabled={!selectedAccoid || loadingAccount}
            style={inputStyle}
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !selectedAccoid || loadingAccount}
          style={{
            width: "100%",
            padding: "13px",
            background: "linear-gradient(135deg,#1a365d,#2a4a7f)",
            color: "white",
            border: "none",
            borderRadius: "10px",
            fontWeight: "700",
            cursor: "pointer",
            fontSize: "14px",
            fontFamily: "'Signika', sans-serif",
            letterSpacing: "0.04em",
            boxShadow: "0 3px 12px rgba(26,54,93,0.35)",
            opacity: saving || !selectedAccoid || loadingAccount ? 0.6 : 1,
          }}
        >
          {saving ? "SAVING..." : "SAVE"}
        </button>
      </div>
    </div>
  );
};

export default RiskManagement;
