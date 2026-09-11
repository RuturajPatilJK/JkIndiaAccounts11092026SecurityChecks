import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from "sweetalert2";
import AccountMasterHelp from "../../../../Helper/AccountMasterHelp";
import { generateReportPDF } from "../../../../Common/ReportCommon/CommonPDFGenerator";
import PdfPreview from "../../../../Common/PDFPreview";
import HeaderJK from "../../../../Assets/HeaderJK.png";
import FooterJK from "../../../../Assets/FooterJK.png";

const API_URL = process.env.REACT_APP_API;
const WEBSOCKET_URL = process.env.REACT_APP_API_WEBSOCKET;

const CustomerLimit = () => {
  const company_code = sessionStorage.getItem("Company_Code");
  const user_id = sessionStorage.getItem("User_ID");
  const username = sessionStorage.getItem("username");

  const [selectedAcCode, setSelectedAcCode] = useState("");
  const [selectedAcName, setSelectedAcName] = useState("");
  const [selectedAccoid, setSelectedAccoid] = useState(null);


  const [dailyBuyLimit, setDailyBuyLimit] = useState("");
  const [dailySellLimit, setDailySellLimit] = useState("");


  const [additionalBuyAmount, setAdditionalBuyAmount] = useState("");
  const [additionalSellAmount, setAdditionalSellAmount] = useState("");


  const [entries, setEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [buyBalance, setBuyBalance] = useState(null);
  const [sellBalance, setSellBalance] = useState(null);
  const [posting, setPosting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [pdfPreview, setPdfPreview] = useState(null);
  const [ledgerTab, setLedgerTab] = useState("all"); // all | BL | SL

  // ── Ledger entries with running balances ──
  // combinedBalance: one running total across ALL entries (Buy + Sell mixed, chronological) — used on "All Entries".
  // typeBalance: running total scoped to the entry's own Tran_Type only — used when filtered to Buy or Sell,
  // so the balance shown doesn't drift with the other type's unrelated transactions.
  const entriesWithBalance = useMemo(() => {
    const chronological = [...entries].reverse(); // oldest → newest
    let combinedRunning = 0;
    let buyRunning = 0;
    let sellRunning = 0;
    const withBalance = chronological.map((e) => {
      const amt = parseFloat(e.Limit) || 0;
      const signed = e.DRCR === "C" ? amt : -amt;
      combinedRunning += signed;
      if (e.Tran_Type === "BL") buyRunning += signed;
      else if (e.Tran_Type === "SL") sellRunning += signed;
      return {
        ...e,
        combinedBalance: combinedRunning,
        typeBalance: e.Tran_Type === "BL" ? buyRunning : sellRunning,
      };
    });
    return withBalance.reverse(); // back to newest → oldest for display
  }, [entries]);

  const buyEntriesCount = useMemo(() => entries.filter((e) => e.Tran_Type === "BL").length, [entries]);
  const sellEntriesCount = useMemo(() => entries.filter((e) => e.Tran_Type === "SL").length, [entries]);

  const filteredEntries = useMemo(() => {
    if (ledgerTab === "BL") return entriesWithBalance.filter((e) => e.Tran_Type === "BL");
    if (ledgerTab === "SL") return entriesWithBalance.filter((e) => e.Tran_Type === "SL");
    return entriesWithBalance;
  }, [entriesWithBalance, ledgerTab]);

  // Which balance field each row should display, based on the active tab
  const runningBalanceKey = ledgerTab === "all" ? "combinedBalance" : "typeBalance";

  const ledgerTotals = useMemo(() => {
    const totalDebit = filteredEntries.reduce((s, e) => s + (e.DRCR !== "C" ? parseFloat(e.Limit || 0) : 0), 0);
    const totalCredit = filteredEntries.reduce((s, e) => s + (e.DRCR === "C" ? parseFloat(e.Limit || 0) : 0), 0);
    // Use the authoritative buy/sell balances (computed across ALL entries in fetchAccountEntries,
    // same as the left-panel cards) rather than the latest entry's own-type balance —
    // the latest entry only reflects whichever type (Buy or Sell) happened to change last.
    let closingBalance;
    if (ledgerTab === "BL") closingBalance = buyBalance || 0;
    else if (ledgerTab === "SL") closingBalance = sellBalance || 0;
    else closingBalance = (buyBalance || 0) + (sellBalance || 0);
    return { totalDebit, totalCredit, closingBalance };
  }, [filteredEntries, ledgerTab, buyBalance, sellBalance]);

  const isToday = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  };

  const selectedAccoidRef = useRef(selectedAccoid);
  useEffect(() => {
    selectedAccoidRef.current = selectedAccoid;
  }, [selectedAccoid]);


  useEffect(() => {
    let socket;
    let reconnectTimer;
    let isMounted = true;

    const connect = () => {
      if (!isMounted) return;
      socket = new WebSocket(WEBSOCKET_URL);
      socket.onopen = () => { };
      socket.onmessage = (event) => {
        const msg = String(event.data).toLowerCase();
        if (msg.includes("refresh_tenders") && selectedAccoidRef.current) {
          fetchAccountEntries(selectedAccoidRef.current);
        }
      };
      socket.onclose = () => {
        if (!isMounted) return;
        reconnectTimer = setTimeout(connect, 3000);
      };
    };

    connect();
    return () => {
      isMounted = false;
      clearTimeout(reconnectTimer);
      if (socket) socket.close();
    };
  }, []);


  useEffect(() => {
    if (selectedAccoid) {
      setBuyBalance(null);
      setSellBalance(null);
      setEntries([]);
      fetchAccountEntries(selectedAccoid);
    } else {
      setEntries([]);
      setBuyBalance(null);
      setSellBalance(null);
    }
  }, [selectedAccoid]);

  const fetchAccountEntries = async (accoid) => {
    setLoadingEntries(true);
    try {
      const res = await axios.get(`${API_URL}/getall-balance-limits`, {
        params: { company_code },
      });
      if (res.data?.success) {
        const accountEntries = res.data.data.filter(
          (e) => String(e.accoid) === String(accoid)
        );
        setEntries(accountEntries);


        const buyBal = accountEntries
          .filter((e) => e.Tran_Type === "BL")
          .reduce((sum, e) => {
            const amt = parseFloat(e.Limit) || 0;
            return e.DRCR === "C" ? sum + amt : sum - amt;
          }, 0);


        const sellBal = accountEntries
          .filter((e) => e.Tran_Type === "SL")
          .reduce((sum, e) => {
            const amt = parseFloat(e.Limit) || 0;
            return e.DRCR === "C" ? sum + amt : sum - amt;
          }, 0);

        setBuyBalance(buyBal);
        setSellBalance(sellBal);
      }
    } catch (err) {
      toast.error("Failed to load ledger.");
    } finally {
      setLoadingEntries(false);
    }
  };



  const handleAccountSelect = (
    code, accoid, name, mobile, gst,
    tds, gstState, city, stateName,
    ebuyLimit, ebuySlLimit
  ) => {

    setEntries([]);
    setBuyBalance(null);
    setSellBalance(null);
    setAdditionalBuyAmount("");
    setAdditionalSellAmount("");


    setDailyBuyLimit("");
    setDailySellLimit("");

    setSelectedAcCode(code);
    setSelectedAcName(name);
    setSelectedAccoid(accoid);

    if (ebuyLimit !== null && ebuyLimit !== undefined && ebuyLimit !== "") {
      setDailyBuyLimit(String(ebuyLimit));
    }
    if (ebuySlLimit !== null && ebuySlLimit !== undefined && ebuySlLimit !== "") {
      setDailySellLimit(String(ebuySlLimit));
    }
  };


  const validateAmount = (val, fieldName) => {
    if (val < 0) {
      Swal.fire(
        "Negative Value Not Allowed",
        `${fieldName} cannot be negative.`,
        "error"
      );
      return false;
    }
    if (val % 5 !== 0) {
      Swal.fire(
        "Invalid Amount",
        `${fieldName} must be a multiple of 5 (e.g. 5, 10, 15, 20...).`,
        "error"
      );
      return false;
    }
    return true;
  };


  const handleSave = async (section) => {
    if (!selectedAccoid) {
      Swal.fire("Account Missing", "Please select a customer account first.", "info");
      return;
    }

    const payload = {
      Ac_Code: selectedAcCode,
      accoid: selectedAccoid,
      Doc_Date: new Date().toISOString().split("T")[0],
      User_Id: user_id,
      username: username,
    };

    let hasAnything = false;


    if ((section === "buy" || section === "both") && dailyBuyLimit !== "") {
      const val = parseFloat(dailyBuyLimit);
      if (isNaN(val)) {
        Swal.fire("Invalid", "Daily Buy Limit must be a valid number.", "warning");
        return;
      }
      if (!validateAmount(val, "Daily Buy Limit")) return;
      payload.daily_buy_limit = val;
      hasAnything = true;
    }


    if ((section === "sell" || section === "both") && dailySellLimit !== "") {
      const val = parseFloat(dailySellLimit);
      if (isNaN(val)) {
        Swal.fire("Invalid", "Daily Sell Limit must be a valid number.", "warning");
        return;
      }
      if (!validateAmount(val, "Daily Sell Limit")) return;
      payload.daily_sell_limit = val;
      hasAnything = true;
    }


    if ((section === "buy" || section === "both") && additionalBuyAmount !== "") {
      const val = parseFloat(additionalBuyAmount);
      if (isNaN(val) || val <= 0) {
        Swal.fire("Invalid", "Additional Buy amount must be positive.", "warning");
        return;
      }
      if (!validateAmount(val, "Additional Buy Limit")) return;
      payload.additional_buy_amount = val;
      payload.buy_drcr = "C";
      payload.buy_narration = `${username} added Buy limit ${val}`;
      hasAnything = true;
    }


    if ((section === "sell" || section === "both") && additionalSellAmount !== "") {
      const val = parseFloat(additionalSellAmount);
      if (isNaN(val) || val <= 0) {
        Swal.fire("Invalid", "Additional Sell amount must be positive.", "warning");
        return;
      }
      if (!validateAmount(val, "Additional Sell Limit")) return;
      payload.additional_sell_amount = val;
      payload.sell_drcr = "C";
      payload.sell_narration = `${username} added Sell limit ${val}`;
      hasAnything = true;
    }

    if (!hasAnything) {
      Swal.fire("Nothing to Save", "Please enter at least one value.", "info");
      return;
    }

    const confirm = await Swal.fire({
      title: "Confirm Save",
      html: `Save limit changes for <b>${selectedAcName}</b>?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Save",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });
    if (!confirm.isConfirmed) return;

    setPosting(true);
    try {
      const res = await axios.post(
        `${API_URL}/save-customer-limit`,
        payload,
        { params: { company_code } }
      );
      if (res.data?.success) {
        Swal.fire("Saved!", res.data.message, "success");
        setAdditionalBuyAmount("");
        setAdditionalSellAmount("");
        fetchAccountEntries(selectedAccoid);
      }
    } catch (err) {
      Swal.fire("Error", err.response?.data?.error || "Server error.", "error");
    } finally {
      setPosting(false);
    }
  };


  const handleReduce = async (type) => {
    if (!selectedAccoid) {
      Swal.fire("Account Missing", "Please select a customer account first.", "info");
      return;
    }

    const rawAmt = type === "buy" ? additionalBuyAmount : additionalSellAmount;
    const amt = parseFloat(rawAmt);

    if (!amt || amt <= 0) {
      Swal.fire("Invalid Amount", "Please enter a positive numeric value.", "warning");
      return;
    }


    if (!validateAmount(amt, `${type === "buy" ? "Buy" : "Sell"} Reduction Amount`))
      return;


    const currentBalance = type === "buy" ? (buyBalance || 0) : (sellBalance || 0);
    if (amt > currentBalance) {
      Swal.fire({
        title: "Insufficient Balance",
        html: `You are trying to reduce <b>${amt.toFixed(2)} Qntl</b> but the 
               current <b>${type === "buy" ? "Buy" : "Sell"} Balance</b> is only 
               <b>${currentBalance.toFixed(2)} Qntl</b>.<br/><br/>
               Reduction cannot exceed available balance.`,
        icon: "error",
        confirmButtonColor: "#e53e3e",
      });
      return;
    }

    const confirm = await Swal.fire({
      title: `Reduce ${type === "buy" ? "Buy" : "Sell"} Limit?`,
      html: `Reduce <b>${amt.toFixed(2)} Qntl</b> for <b>${selectedAcName}</b><br/>
             <small style="color:#718096">
               Remaining after reduction: <b>${(currentBalance - amt).toFixed(2)} Qntl</b>
             </small>`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Confirm",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });
    if (!confirm.isConfirmed) return;

    setPosting(true);
    try {
      const payload = {
        Ac_Code: selectedAcCode,
        accoid: selectedAccoid,
        Doc_Date: new Date().toISOString().split("T")[0],
        User_Id: user_id,
        username: username,
      };

      if (type === "buy") {
        payload.additional_buy_amount = amt;
        payload.buy_drcr = "D";
        payload.buy_narration = `${username} reduced Buy limit ${amt}`;
      } else {
        payload.additional_sell_amount = amt;
        payload.sell_drcr = "D";
        payload.sell_narration = `${username} reduced Sell limit ${amt}`;
      }

      const res = await axios.post(
        `${API_URL}/save-customer-limit`,
        payload,
        { params: { company_code } }
      );
      if (res.data?.success) {
        Swal.fire(
          "Done!",
          `${type === "buy" ? "Buy" : "Sell"} limit reduced successfully.`,
          "success"
        );
        type === "buy"
          ? setAdditionalBuyAmount("")
          : setAdditionalSellAmount("");
        fetchAccountEntries(selectedAccoid);
      }
    } catch (err) {
      Swal.fire("Error", err.response?.data?.error || "Server error.", "error");
    } finally {
      setPosting(false);
    }
  };


  const handleGeneratePDF = () => {
    if (filteredEntries.length === 0) return;
    setIsPrinting(true);

    const columns = ["Type", "Entry No", "Date", "Narration", "Debit", "Credit", "Balance", "DR/CR"];
    const rows = filteredEntries.map((entry) => [
      entry.Tran_Type || "BL",
      entry.gledgereBuyId ?? "",
      new Date(entry.Doc_Date).toLocaleString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit", hour12: true,
      }),
      entry.Narration || "",
      entry.DRCR !== "C" ? parseFloat(entry.Limit || 0).toFixed(2) : "",
      entry.DRCR === "C" ? parseFloat(entry.Limit || 0).toFixed(2) : "",
      parseFloat(entry[runningBalanceKey] || 0).toFixed(2),
      entry.DRCR === "C" ? "Cr" : "Dr",
    ]);

    generateReportPDF({
      title: "Transaction Ledger",
      subtitle: `${selectedAcCode} — ${selectedAcName}  ·  Total Debit: ${ledgerTotals.totalDebit.toFixed(2)}  ·  Total Credit: ${ledgerTotals.totalCredit.toFixed(2)}  ·  Closing Balance: ${ledgerTotals.closingBalance.toFixed(2)}`,
      columns,
      rows,
      headerImgSrc: HeaderJK,
      footerImgSrc: FooterJK,
      numericCols: [4, 5, 6],
      centerCols: [0, 1, 7],
      onComplete: (url) => { setPdfPreview(url); setIsPrinting(false); },
    });
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
    transition: "border-color 0.15s, box-shadow 0.15s",
  };

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

  const sectionCard = {
    background: "#f8fafc",
    borderRadius: "12px",
    padding: "16px",
    marginBottom: "16px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
  };

  const btnGreen = {
    flex: 1, padding: "10px 8px", background: "linear-gradient(135deg,#38a169,#276749)",
    color: "white", border: "none", borderRadius: "8px",
    fontWeight: "700", cursor: "pointer", fontSize: "12.5px",
    fontFamily: "'Signika', sans-serif", letterSpacing: "0.02em",
    boxShadow: "0 2px 6px rgba(56,161,105,0.3)", transition: "opacity 0.15s",
  };

  const btnRed = {
    flex: 1, padding: "10px 8px", background: "linear-gradient(135deg,#e53e3e,#9b2c2c)",
    color: "white", border: "none", borderRadius: "8px",
    fontWeight: "700", cursor: "pointer", fontSize: "12.5px",
    fontFamily: "'Signika', sans-serif", letterSpacing: "0.02em",
    boxShadow: "0 2px 6px rgba(229,62,62,0.3)", transition: "opacity 0.15s",
  };


  return (
    <div style={{ fontFamily: "'Signika', 'Segoe UI', sans-serif", marginTop: "-60px" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Signika:wght@300;400;500;600;700&display=swap');`}</style>
      <ToastContainer autoClose={2000} />
      {pdfPreview && <PdfPreview pdfData={pdfPreview} label="CustomerLedgerBalance" />}
      {isPrinting && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(255,255,255,0.8)', zIndex: 9999, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ fontWeight: 700, color: '#1a237e' }}>Generating PDF...</div>
        </div>
      )}

      <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "700", textAlign: "center", color: "#1e293b", marginBottom: "30px", letterSpacing: "0.01em" }}>
        eBuy Sugar Customer Limit
      </h2>

      <div style={{ display: "flex", gap: "14px", width: "100%" }}>

        <div style={{
          flex: "0 0 320px", background: "white",
          borderRadius: "14px", boxShadow: "0 4px 24px rgba(0,0,0,0.09)",
          height: "fit-content", padding: "28px",
          position: "sticky", top: "25px",
          border: "1px solid #e2e8f0",
        }}>


          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Customer Account</label>
            <AccountMasterHelp
              onAcCodeClick={handleAccountSelect}
              CategoryName={selectedAcName}
              CategoryCode={selectedAcCode}
              name="Customer_Account"
              Ac_type={["P", "M","Z"]}
            />
          </div>


          <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            <div style={{
              flex: 1, background: "linear-gradient(135deg,#ebf8ff,#bee3f8)", padding: "16px",
              borderRadius: "12px", textAlign: "center", border: "1px solid #90cdf4",
              boxShadow: "0 2px 10px rgba(43,108,176,0.12)",
            }}>
              <div style={{ fontSize: "10px", fontWeight: "800", color: "#2b6cb0", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                🛒 Current Buy Limit
              </div>
              <div style={{
                fontSize: "24px", fontWeight: "800",
                color: (buyBalance || 0) >= 0 ? "#276749" : "#9b2c2c",
                fontFamily: "'Signika', sans-serif",
              }}>
                {buyBalance === null ? "0.00" : buyBalance.toFixed(2)}
                <small style={{ fontSize: "11px", fontWeight: 500, marginLeft: 3 }}>Qntl</small>
              </div>
            </div>

            <div style={{
              flex: 1, background: "linear-gradient(135deg,#fff5f5,#fed7d7)", padding: "16px",
              borderRadius: "12px", textAlign: "center", border: "1px solid #fc8181",
              boxShadow: "0 2px 10px rgba(197,48,48,0.12)",
            }}>
              <div style={{ fontSize: "10px", fontWeight: "800", color: "#c53030", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                📦 Current Sell Limit
              </div>
              <div style={{
                fontSize: "24px", fontWeight: "800",
                color: (sellBalance || 0) >= 0 ? "#276749" : "#9b2c2c",
                fontFamily: "'Signika', sans-serif",
              }}>
                {sellBalance === null ? "0.00" : sellBalance.toFixed(2)}
                <small style={{ fontSize: "11px", fontWeight: 500, marginLeft: 3 }}>Qntl</small>
              </div>
            </div>
          </div>


          <div style={sectionCard}>
            <div style={{ fontSize: "12px", fontWeight: "800", color: "#2b6cb0", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 6 }}>
              🛒 Buy Limit
            </div>


            <div style={{ marginBottom: "12px" }}>
              <label style={labelStyle}>Daily Buy Limit</label>
              <input
                type="number"
                min="0"
                step="5"
                value={dailyBuyLimit}
                onChange={(e) => setDailyBuyLimit(e.target.value)}
                placeholder=""
                style={inputStyle}
                disabled={!selectedAccoid}
              />
            </div>


            <div style={{ marginBottom: "12px" }}>
              <label style={labelStyle}>Daily Additional Buy Limit</label>
              <input
                type="number"
                min="0"
                step="5"
                value={additionalBuyAmount}
                onChange={(e) => setAdditionalBuyAmount(e.target.value)}
                placeholder="Multiples of 5 only"
                style={inputStyle}
                disabled={!selectedAccoid}
              />
            </div>


            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => handleSave("buy")}
                disabled={posting || !selectedAccoid}
                style={btnGreen}
              >
                + ADD BUY LIMIT
              </button>
              <button
                onClick={() => handleReduce("buy")}
                disabled={posting || !selectedAccoid}
                style={btnRed}
              >
                − REDUCE BUY LIMIT
              </button>
            </div>
          </div>


          <div style={sectionCard}>
            <div style={{ fontSize: "12px", fontWeight: "800", color: "#c53030", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 6 }}>
              📦 Sell Limit
            </div>


            <div style={{ marginBottom: "12px" }}>
              <label style={labelStyle}>Daily Sell Limit </label>
              <input
                type="number"
                min="0"
                step="5"
                value={dailySellLimit}
                onChange={(e) => setDailySellLimit(e.target.value)}
                placeholder=""
                style={inputStyle}
                disabled={!selectedAccoid}
              />
            </div>


            <div style={{ marginBottom: "12px" }}>
              <label style={labelStyle}>Daily Additional Sell Limit</label>
              <input
                type="number"
                min="0"
                step="5"
                value={additionalSellAmount}
                onChange={(e) => setAdditionalSellAmount(e.target.value)}
                placeholder="Multiples of 5 only"
                style={inputStyle}
                disabled={!selectedAccoid}
              />
            </div>


            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => handleSave("sell")}
                disabled={posting || !selectedAccoid}
                style={btnGreen}
              >
                + ADD SELL LIMIT
              </button>
              <button
                onClick={() => handleReduce("sell")}
                disabled={posting || !selectedAccoid}
                style={btnRed}
              >
                − REDUCE SELL LIMIT
              </button>
            </div>
          </div>


          <button
            onClick={() => handleSave("both")}
            disabled={posting || !selectedAccoid}
            style={{
              width: "100%", padding: "13px",
              background: "linear-gradient(135deg,#1a365d,#2a4a7f)", color: "white",
              border: "none", borderRadius: "10px",
              fontWeight: "700", cursor: "pointer", fontSize: "14px",
              fontFamily: "'Signika', sans-serif", letterSpacing: "0.04em",
              boxShadow: "0 3px 12px rgba(26,54,93,0.35)", transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.88"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
          >
            SAVE ALL CHANGES
          </button>
        </div>


        <div style={{
          flex: 1, background: "white", borderRadius: "14px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.09)",
          overflow: "hidden", display: "flex", flexDirection: "column",
          border: "1px solid #e2e8f0",
        }}>
          {/* ── Header: title / subtitle / entry count / print ── */}
          <div style={{
            padding: "18px 24px 14px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10,
          }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#1e293b", fontFamily: "'Signika', sans-serif" }}>
                Transaction Ledger
              </h3>
              {selectedAcCode && (
                <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: 2, fontWeight: 600 }}>
                  {selectedAcCode} — {selectedAcName}
                </div>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: "11px", color: "#cbd5e1", fontWeight: 700, letterSpacing: "0.05em" }}>
                {entries.length} ENTRIES
              </span>
              <button
                onClick={handleGeneratePDF}
                disabled={!selectedAccoid || filteredEntries.length === 0 || isPrinting}
                style={{
                  padding: "6px 14px", background: "#1e293b", color: "#f1f5f9",
                  border: "1px solid #334155", borderRadius: "7px",
                  fontWeight: "700", fontSize: "12px", cursor: "pointer",
                  fontFamily: "'Signika', sans-serif", letterSpacing: "0.02em",
                  opacity: (!selectedAccoid || filteredEntries.length === 0) ? 0.4 : 1,
                }}
              >
                🖨 Print
              </button>
            </div>
          </div>

          {/* ── Summary cards ── */}
          <div style={{ display: "flex", borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ flex: 1, padding: "14px 24px", borderRight: "1px solid #f1f5f9" }}>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                Total Debit
              </div>
              <div style={{ fontSize: "20px", fontWeight: 800, color: "#e53e3e" }}>
                {ledgerTotals.totalDebit.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <small style={{ fontSize: "12px", fontWeight: 700, marginLeft: 4 }}>Dr</small>
              </div>
              <div style={{ fontSize: "10px", color: "#cbd5e1", marginTop: 2 }}>Qntl</div>
            </div>
            <div style={{ flex: 1, padding: "14px 24px", borderRight: "1px solid #f1f5f9" }}>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                Total Credit
              </div>
              <div style={{ fontSize: "20px", fontWeight: 800, color: "#15803d" }}>
                {ledgerTotals.totalCredit.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <small style={{ fontSize: "12px", fontWeight: 700, marginLeft: 4 }}>Cr</small>
              </div>
              <div style={{ fontSize: "10px", color: "#cbd5e1", marginTop: 2 }}>Qntl</div>
            </div>
            <div style={{ flex: 1, padding: "14px 24px", background: "#f0fdf4" }}>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                Closing Balance
              </div>
              <div style={{ fontSize: "20px", fontWeight: 800, color: "#15803d" }}>
                {ledgerTotals.closingBalance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <small style={{ fontSize: "12px", fontWeight: 700, marginLeft: 4 }}>Cr</small>
              </div>
              <div style={{ fontSize: "10px", color: "#a7d8b7", marginTop: 2 }}>Qntl</div>
            </div>
          </div>

          {/* ── Filter tabs ── */}
          <div style={{ display: "flex", gap: 8, padding: "12px 24px", background: "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
            {[
              { key: "all", label: "All Entries", count: entries.length },
              { key: "BL", label: "Buy", count: buyEntriesCount },
              { key: "SL", label: "Sell", count: sellEntriesCount },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setLedgerTab(t.key)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "6px 14px", borderRadius: "8px", border: "1px solid",
                  borderColor: ledgerTab === t.key ? "#e2e8f0" : "transparent",
                  background: ledgerTab === t.key ? "white" : "transparent",
                  boxShadow: ledgerTab === t.key ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  color: ledgerTab === t.key ? "#e53e3e" : "#64748b",
                  fontWeight: 700, fontSize: "12.5px", cursor: "pointer",
                  fontFamily: "'Signika', sans-serif",
                }}
              >
                {t.label}
                <span style={{
                  fontSize: "10px", fontWeight: 800, padding: "1px 7px", borderRadius: 50,
                  background: ledgerTab === t.key ? "#fef2f2" : "#e2e8f0",
                  color: ledgerTab === t.key ? "#e53e3e" : "#64748b",
                }}>
                  {t.count}
                </span>
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: "auto", maxHeight: "calc(100vh - 180px)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "80px", fontFamily: "'Signika', sans-serif" }}>
              <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                <tr style={{ background: "linear-gradient(to bottom,#f8fafc,#f1f5f9)" }}>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "11px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "2px solid #e2e8f0" }}>Type</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "11px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "2px solid #e2e8f0" }}>Entry No</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "2px solid #e2e8f0" }}>Date</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "2px solid #e2e8f0" }}>Narration</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", fontSize: "11px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "2px solid #e2e8f0" }}>Debit</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", fontSize: "11px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "2px solid #e2e8f0" }}>Credit</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", fontSize: "11px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "2px solid #e2e8f0" }}>Balance</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "11px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "2px solid #e2e8f0" }}>DR/CR</th>
                </tr>
              </thead>
              <tbody>
                {loadingEntries ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: "center", padding: "60px", color: "#94a3b8", fontSize: 13 }}>
                      Loading records...
                    </td>
                  </tr>
                ) : filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: "center", padding: "80px 0", color: "#94a3b8", fontSize: 13 }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                        <svg style={{ width: 36, height: 36, opacity: 0.3 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {selectedAccoid ? "No entries for this filter" : "Select an account to view balance"}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((entry, idx) => {
                    const isCredit = entry.DRCR === "C";
                    const isBL = entry.Tran_Type === "BL";
                    return (
                      <tr
                        key={entry.gledgereBuyId ?? idx}
                        style={{ borderBottom: "1px solid #f1f5f9", background: idx % 2 === 0 ? "white" : "#fafcff", transition: "background 0.12s", cursor: "default" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "#eff6ff"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = idx % 2 === 0 ? "white" : "#fafcff"; }}
                      >
                        <td style={{ padding: "11px 16px", textAlign: "center" }}>
                          <span style={{
                            padding: "3px 10px", borderRadius: 50,
                            fontSize: "10px", fontWeight: "800",
                            background: isBL ? "#f0fdf4" : "#fff5f5",
                            color: isBL ? "#15803d" : "#c53030",
                            border: `1px solid ${isBL ? "#bbf7d0" : "#fed7d7"}`,
                          }}>
                            {entry.Tran_Type || "BL"}
                          </span>
                        </td>
                        <td style={{ padding: "11px 16px", textAlign: "center", fontSize: "13px", color: "#374151", fontWeight: 600 }}>
                          {entry.gledgereBuyId}
                        </td>
                        <td style={{ padding: "11px 16px", fontSize: "13px", color: "#374151", fontWeight: 500 }}>
                          {new Date(entry.Doc_Date).toLocaleString("en-IN", {
                            day: "2-digit", month: "short", year: "numeric",
                            hour: "2-digit", minute: "2-digit", hour12: true,
                          })}
                          {isToday(entry.Doc_Date) && (
                            <div style={{ fontSize: "9.5px", fontWeight: 800, color: "#c2410c", letterSpacing: "0.06em", marginTop: 1 }}>
                              TODAY
                            </div>
                          )}
                        </td>
                        <td style={{ padding: "11px 16px", fontSize: "12.5px", color: "#2563eb", textAlign: "left" }}>
                          {entry.Narration}
                        </td>
                        <td style={{ padding: "11px 16px", fontWeight: "700", color: "#e53e3e", textAlign: "right", fontSize: 13 }}>
                          {!isCredit ? parseFloat(entry.Limit).toFixed(2) : "—"}
                        </td>
                        <td style={{ padding: "11px 16px", fontWeight: "700", color: "#15803d", textAlign: "right", fontSize: 13 }}>
                          {isCredit ? parseFloat(entry.Limit).toFixed(2) : "—"}
                        </td>
                        <td style={{ padding: "11px 16px", fontWeight: "700", color: "#1e293b", textAlign: "right", fontSize: 13 }}>
                          {parseFloat(entry[runningBalanceKey] || 0).toFixed(2)}
                        </td>
                        <td style={{ padding: "11px 16px", textAlign: "center" }}>
                          <span style={{
                            padding: "2px 9px", borderRadius: 50,
                            fontSize: "10px", fontWeight: "800",
                            background: isCredit ? "#f0fdf4" : "#fef2f2",
                            color: isCredit ? "#15803d" : "#b91c1c",
                            border: `1px solid ${isCredit ? "#bbf7d0" : "#fecaca"}`,
                          }}>
                            {isCredit ? "Cr" : "Dr"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CustomerLimit;