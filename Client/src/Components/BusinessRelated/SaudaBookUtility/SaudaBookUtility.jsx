import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Grid,
  TextField,
  Button,
  Typography,
  Box,
  MenuItem,
  Select
} from "@mui/material";
import axios from "axios";
import SaudaBookUtilityHelp from "../../../Helper/SaudaBookUtilityHelp";
import AccountMasterHelp from "../../../Helper/AccountMasterHelp";
import Swal from "sweetalert2";
import BackButton from "../../../Common/Buttons/BackButton";
import LiveTenders from '../../BusinessRelated/TenderPurchase/LiveeTenders/LiveTenders';


const API_URL = process.env.REACT_APP_API;

const SaudaBookUtility = () => {
  const companyCode = sessionStorage.getItem("Company_Code");
  const yearCode = sessionStorage.getItem("Year_Code");
  const location = useLocation();
  const tenderData = location.state?.tenderData;

  const buyerRef = useRef();
  const navigate = useNavigate();

const today = new Date().toISOString().split("T")[0];

  const initialFormState = {
    Tender_No: "",
    ID: "",
    Delivery_Type: "C",
    Buyer: "",
    ShipTo: "",
    Buyer_Party: "",
    sub_broker: "",
    buyerid: "",
    buyerpartyid: "",
    sbr: "",
    shiptoid: "",
    Buyer_Quantal: "",
    Sale_Rate: "",
    Commission_Rate: "",
    Sauda_Date: today,
    Lifting_Date: today,
    Sauda_Lifting_Date: today,
    Sauda_Type: "F",
    Ex_Mill_Type: "Ex Mill",
    Narration: "",
    tcs_rate: 0.0,
    gst_rate: 5.0,
    tcs_amt: 0.0,
    gst_amt: 0.0,
    tenderid: "",
    tenderdetailid: null,
    gradeCode: '',
    gradeid: '',
    Mill_Rate: 0.00,
    Purchase_Rate: 0.00,
    EbuySelectedParty: "",
    EbuySelectedAccoid: "",
    EbuySugarLiftingDate: "",
    Payment_To: "",
    pt:"",
    from_software:"S"
  };

  const [formData, setFormData] = useState(initialFormState);
  const [netAmount, setNetAmount] = useState("0.00");
  const [millCode, setMillCode] = useState("");
  const [millId, setMillId] = useState("");
  const [millName, setMillName] = useState("");
  const [buyerCode, setBuyerCode] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [shipToName, setShipToName] = useState("");
  const [brokerName, setBrokerName] = useState("");
  const [subBrokerName, setSubBrokerName] = useState("");
  const [tenderDisplayText, setTenderDisplayText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shouldFocusBuyer, setShouldFocusBuyer] = useState(false);
  const [grades, setGrades] = useState([]);
  const [selectedPartyName, setSelectedPartyName] = useState("");
  // Kept outside formData (not sent to the backend - TenderDetails has no
  // minRate/maxRate columns, so including them would break the save call).
  const [minRate, setMinRate] = useState(0);
  const [maxRate, setMaxRate] = useState(0);
  const [tenderBalance, setTenderBalance] = useState(null);
  // "Ex Mill" = the preset value gets saved as-is, comment box hidden.
  // "Ex" = reveals a comment box; whatever the user types is saved instead.
  const [exMillSelection, setExMillSelection] = useState("Ex Mill");

  // Unified logic to handle initialization from tenderData
  useEffect(() => {
    if (tenderData) {
      const availableGrades = tenderData.Grades || [];
      const firstGrade = availableGrades.length > 0 ? availableGrades[0] : null;

      setMillCode(tenderData.Mill_Code || "");
      setMillName(tenderData.millshortname || "");
      setMillId(tenderData.mc || "");
      setGrades(availableGrades);
      setMinRate(parseFloat(tenderData.minRate) || 0);
      setMaxRate(parseFloat(tenderData.maxRate) || 0);
      setTenderBalance(
        tenderData.BALANCE !== undefined && tenderData.BALANCE !== null
          ? parseFloat(tenderData.BALANCE)
          : null
      );

      setFormData((prev) => ({
        ...prev,
        Tender_No: tenderData.Tender_No || "",
        tenderid: tenderData.tenderid || "",
        Sauda_Date: today,
        Lifting_Date: today,
        Sauda_Lifting_Date: today,
        Narration: "",
        // Fix: Use first available grade if gradeCode is not already set
        gradeCode: firstGrade ? firstGrade.gradeCode : (tenderData.GradeCode || ''),
        gradeid: firstGrade ? firstGrade.gradeid : (tenderData.gradeid || ''),
        Mill_Rate: firstGrade ? firstGrade.gradeRate : (tenderData.MillRate || 0.00),
        Purchase_Rate: firstGrade ? firstGrade.Purchase_Rate || (tenderData.Purchase_Rate || 0.00) : 0.00,
        Payment_To: tenderData.Payment_To ,
        pt: tenderData.pt
      }));

      const displayText = `Balance:${tenderData.BALANCE || "0.00"} Grade:${tenderData.Grade || ""} Mill Rate:${tenderData.Mill_Rate || ""} Tender Date:${tenderData.Tender_Date || ""} `;
      setTenderDisplayText(displayText);
      setShouldFocusBuyer(true);
    }
  }, [tenderData]);

  useEffect(() => {
    if (shouldFocusBuyer && buyerRef.current) {
      buyerRef.current.focus();
      setShouldFocusBuyer(false);
    }
  }, [shouldFocusBuyer]);

  // const handleInputChange = (e) => {
  //   const { name, value } = e.target;
  //   setFormData((prev) => ({ ...prev, [name]: value }));
  // };

const handleInputChange = (e) => {
  const { name, value } = e.target;
  setFormData((prev) => ({ ...prev, [name]: value }));
};

const handleExMillSelectionChange = (e) => {
  const value = e.target.value;
  setExMillSelection(value);
  setFormData((prev) => ({
    ...prev,
    Ex_Mill_Type: value === "Ex Mill" ? "Ex Mill" : "",
  }));
};

  const handleMillCode = (code, accoid, name) => {
    setMillCode(code);
    setMillId(accoid);
    setMillName(name);
    setFormData(prev => ({
      ...prev,
      Tender_No: "",
      tenderid: "",
      Narration: "",
    }));
    setTenderDisplayText("");
    setShouldFocusBuyer(true);
  };

  const handleBuyerCode = (code, accoid, name) => {
    setBuyerCode(code);
    setBuyerName(name);
    setShipToName(name);
    setBrokerName("SELF");
    setSubBrokerName("SELF");

    setTimeout(() => {
      const qtyInput = document.querySelector('input[name="Buyer_Quantal"]');
      if (qtyInput) qtyInput.focus();
    }, 100);

    setFormData((prev) => ({
      ...prev,
      Buyer: code,
      buyerid: accoid,
      ShipTo: code,
      shiptoid: accoid,
      Buyer_Party: 2,
      buyerpartyid: 2,
      sub_broker: 2,
      sbr: 2,
    }));
  };


  const handleSelectedParty = (code, accoid, name) => {
    setSelectedPartyName(name);
    setFormData((prev) => ({
      ...prev,
      EbuySelectedParty: code,
      EbuySelectedAccoid: accoid,
    }));

    setTimeout(() => {
      const qtyInput = document.querySelector('input[name="Buyer_Quantal"]');
      if (qtyInput) qtyInput.focus();
    }, 100);
  };


  const handleTenderSelection = (item) => {
    const selectionDate = new Date().toISOString().split("T")[0];
    setFormData((prev) => ({
      ...prev,
      Tender_No: item.Tender_No || "",
      ID: item.ID || "",
      Delivery_Type: "C",
      tenderid: item.tenderid || "",
      Sauda_Date: selectionDate,
      Lifting_Date: selectionDate,
      Sauda_Lifting_Date: selectionDate,
      Narration: "",
    }));
    setMinRate(parseFloat(item.minRate) || 0);
    setMaxRate(parseFloat(item.maxRate) || 0);
    setTenderBalance(
      item.balance !== undefined && item.balance !== null
        ? parseFloat(item.balance)
        : null
    );

    const display = `Balance:${item.balance || "0.00"} Season:${item.season || ""} Grade:${item.Grade || ""} Lifting Date:${item.Lifting_Date || ""} Mill Rate:${item.Mill_Rate || ""} Purchase rate${item.Purc_Rate || ""}`;
    setTenderDisplayText(display);
    setShouldFocusBuyer(true);
  };

  const handleAccountSelect = (field, idField) => (code, accoid, selectedName) => {
    setFormData((prev) => ({
      ...prev,
      [field]: code,
      [idField]: accoid,
      ...(field === "BuyerParty" && {
        ShipTo: code,
        shiptoid: accoid,
        Buyer_Party: 2,
        sub_broker: 2,
        buyerpartyid: 2,
        sbr: 2
      }),
    }));

    if (field === "BuyerParty") {
      setBuyerName(selectedName);
      setShipToName(selectedName);
      setBrokerName("SELF");
      setSubBrokerName("SELF");
      setTimeout(() => {
        const qtyInput = document.querySelector('input[name="Buyer_Quantal"]');
        if (qtyInput) qtyInput.focus();
      }, 100);
    } else if (field === "millCode") {
      setMillName(selectedName);
    } else if (field === "ShipTo") {
      setShipToName(selectedName);
    } else if (field === "Buyer_Party") {
      setBrokerName(selectedName);
    } else if (field === "sub_broker") {
      setSubBrokerName(selectedName);
    }
  };

  useEffect(() => {
    const qty = parseFloat(formData.Buyer_Quantal) || 0;
    const rate = parseFloat(formData.Sale_Rate) || 0;
    const gstRate = parseFloat(formData.gst_rate) || 0;
    const tcsRate = parseFloat(formData.tcs_rate) || 0;

    const baseAmount = qty * rate;
    const gstAmt = (baseAmount * gstRate) / 100;
    const tcsAmt = (baseAmount * tcsRate) / 100;
    const netAmt = baseAmount + gstAmt + tcsAmt;

    setFormData((prev) => ({
      ...prev,
      gst_amt: gstAmt.toFixed(2),
      tcs_amt: tcsAmt.toFixed(2),
    }));
    setNetAmount(netAmt.toFixed(2));
  }, [formData.Buyer_Quantal, formData.Sale_Rate, formData.gst_rate, formData.tcs_rate]);

  const handleSubmit = async () => {
    if (isSubmitting) return;

    // Critical Fix: Ensure Grade is present before submission
    if (!formData.gradeCode || !formData.gradeid) {
      Swal.fire("Validation Error", "Grade information is missing. Please select a grade.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const saleRate = parseFloat(formData.Sale_Rate) || 0;

      if (minRate > 0 && saleRate < minRate) {
        await Swal.fire({
          title: "Sale Rate Validation Failed",
          html: `<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px;">
              <p style="margin: 0; font-size: 1.1rem;">The Sale Rate is too low.</p>
              <p style="margin: 0; color: #d33; font-weight: bold; font-size: 1.2rem;">Minimum allowed: ${minRate.toFixed(2)}</p>
          </div>`,
          icon: "error",
          confirmButtonText: "OK",
          confirmButtonColor: "#d33",
        });
        setIsSubmitting(false);
        return;
      }

      if (maxRate > 0 && saleRate > maxRate) {
        await Swal.fire({
          title: "Sale Rate Validation Failed",
          html: `<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px;">
              <p style="margin: 0; font-size: 1.1rem;">The Sale Rate is too high.</p>
              <p style="margin: 0; color: #d33; font-weight: bold; font-size: 1.2rem;">Maximum allowed: ${maxRate.toFixed(2)}</p>
          </div>`,
          icon: "error",
          confirmButtonText: "OK",
          confirmButtonColor: "#d33",
        });
        setIsSubmitting(false);
        return;
      }

      const buyerQty = parseFloat(formData.Buyer_Quantal) || 0;
      if (buyerQty <= 0) {
        await Swal.fire("Invalid Quantity", "Buyer Quintal cannot be 0. Minimum allowed is 5.", "warning");
        setIsSubmitting(false);
        return;
      }
      if (buyerQty < 5) {
        await Swal.fire("Invalid Quantity", "Buyer Quintal must be at least 5.", "warning");
        setIsSubmitting(false);
        return;
      }
      const buyerQtyRemainder = Math.round((buyerQty % 5) * 1000) / 1000;
      if (buyerQtyRemainder !== 0) {
        await Swal.fire("Invalid Quantity", "Buyer Quintal must be a multiple of 5 (e.g. 5, 10, 15, ...).", "warning");
        setIsSubmitting(false);
        return;
      }

      if (tenderBalance !== null && buyerQty > tenderBalance) {
        await Swal.fire({
          title: "Quantity Exceeds Balance",
          html: `<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px;">
              <p style="margin: 0; font-size: 1.1rem;">Buyer Quintal cannot exceed the available tender balance.</p>
              <p style="margin: 0; color: #d33; font-weight: bold; font-size: 1.2rem;">Available balance: ${tenderBalance.toFixed(2)}</p>
          </div>`,
          icon: "error",
          confirmButtonText: "OK",
          confirmButtonColor: "#d33",
        });
        setIsSubmitting(false);
        return;
      }

      let missingFields = [];
      if (!formData.Buyer) missingFields.push("Bill To");
      if (!formData.ShipTo) missingFields.push("Ship To");
      if (!formData.Buyer_Party) missingFields.push("Broker");
      if (!formData.sub_broker) missingFields.push("Sub Broker");

      if (missingFields.length > 0) {
        Swal.fire("Warning", `Please select the following fields: ${missingFields.join(", ")}`, "warning");
        setIsSubmitting(false);
        return;
      }

      const commission = parseFloat(formData.Commission_Rate) || 0;
      if (commission < 0) {
        const result = await Swal.fire({
          title: "Negative Commission Rate",
          text: "The Commission Rate entered is negative. Save anyway?",
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Yes, Save",
        });
        if (!result.isConfirmed) { setIsSubmitting(false); return; }
      } else if (commission > 0) {
        const confirmApply = await Swal.fire({
          title: "Confirm Commission Rate",
          text: `You entered a Commission Rate of ${commission}. Is this correct?`,
          icon: "question",
          showCancelButton: true,
          confirmButtonText: "Yes",
        });
        if (!confirmApply.isConfirmed) {
          const resetConfirm = await Swal.fire({
            title: "Set Commission Rate to 0?",
            text: "Would you like to set the Commission Rate to 0 and save automatically?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, Set to 0 and Save",
          });
          if (resetConfirm.isConfirmed) {
            await saveTenderDetail(0);
            setIsSubmitting(false);
            return;
          } else {
            setIsSubmitting(false);
            return;
          }
        }
      }

      await saveTenderDetail(commission);
    } catch (error) {
      console.error("Error submitting form:", error);
      Swal.fire("Error", "Failed to save Sauda detail", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const refreshTenderBalance = async () => {
    if (!formData.tenderid) return;
    try {
      const res = await axios.get(`${API_URL}/get-tender-balance`, {
        params: { tenderid: formData.tenderid, Company_Code: companyCode }
      });
      let balance = 0;
      if (Array.isArray(res.data) && res.data.length > 0) {
        const row = res.data.find(r => r.tenderdetailid === formData.tenderdetailid) || res.data[0];
        balance = row.balance;
      }
      const displayText = `Balance:${balance.toFixed(2)} Grade:${formData.gradeCode} Mill Rate:${formData.Mill_Rate} Tender Date:${tenderData.Tender_Date || ""}`;
      setTenderDisplayText(displayText);
      setTenderBalance(parseFloat(balance) || 0);
    } catch (err) {
      console.error("Failed to refresh tender balance", err);
    }
  };

  // const saveTenderDetail = async (commissionValue) => {
  //   await axios.post(`${API_URL}/add_tender_detail`, {
  //     detailData: {
  //       ...formData,
  //       Commission_Rate: commissionValue,
  //       Buyer_Quantal: parseFloat(formData.Buyer_Quantal) || 0.0,
  //       Sale_Rate: parseFloat(formData.Sale_Rate) || 0.0,
  //       tcs_amt: parseFloat(formData.tcs_amt) || 0.0,
  //       gst_amt: parseFloat(formData.gst_amt) || 0.0,
  //       tcs_rate: parseFloat(formData.tcs_rate) || 0.0,
  //       gst_rate: parseFloat(formData.gst_rate) || 0.0,
  //       Company_Code: companyCode,
  //       year_code: yearCode,
  //       EbuySelectedParty: formData.EbuySelectedParty,
  //       EbuySelectedAccoid: formData.EbuySelectedAccoid,
  //       EbuySugarLiftingDate: formData.Lifting_Date,
  //       Payment_To: formData.Payment_To,
  //       pt: formData.pt,
  //     },
  //   });

  //   await Swal.fire("Success!", "Sauda Updated Successfully!", "success");
  //   await refreshTenderBalance();

  //   // Preserve Grade info during reset for continuous entry
  //   setFormData(prev => ({
  //     ...initialFormState,
  //     Tender_No: prev.Tender_No,
  //     tenderid: prev.tenderid,
  //     Narration: prev.Narration,
  //     gradeCode: prev.gradeCode,
  //     gradeid: prev.gradeid,
  //     Mill_Rate: prev.Mill_Rate,
  //     Purchase_Rate: prev.Purchase_Rate,
  //     Sauda_Date: new Date().toISOString().split("T")[0],
  //     Lifting_Date: new Date().toISOString().split("T")[0],
  //   }));

  //   setNetAmount("0.00");
  //   setBuyerName("");
  //   setShipToName("");
  //   setBrokerName("");
  //   setSubBrokerName("");
  //   setShouldFocusBuyer(true);
  // };



  const saveTenderDetail = async (commissionValue) => {
    const freshToday = new Date().toISOString().split("T")[0]; // ← fresh date at save time

    await axios.post(`${API_URL}/add_tender_detail`, {
      detailData: {
        ...formData,
        Commission_Rate: commissionValue,
        Buyer_Quantal: parseFloat(formData.Buyer_Quantal) || 0.0,
        Sale_Rate: parseFloat(formData.Sale_Rate) || 0.0,
        tcs_amt: parseFloat(formData.tcs_amt) || 0.0,
        gst_amt: parseFloat(formData.gst_amt) || 0.0,
        tcs_rate: parseFloat(formData.tcs_rate) || 0.0,
        gst_rate: parseFloat(formData.gst_rate) || 0.0,
        Company_Code: companyCode,
        year_code: yearCode,
        EbuySelectedParty: formData.EbuySelectedParty,
        EbuySelectedAccoid: formData.EbuySelectedAccoid,
        EbuySugarLiftingDate: formData.Lifting_Date,
        Payment_To: formData.Payment_To,
        pt: formData.pt,
      },
    });

    await Swal.fire("Success!", "Sauda Updated Successfully!", "success");
    await refreshTenderBalance();

    setFormData(prev => ({
      ...initialFormState,
      Tender_No: prev.Tender_No,
      tenderid: prev.tenderid,
      Narration: prev.Narration,
      gradeCode: prev.gradeCode,
      gradeid: prev.gradeid,
      Mill_Rate: prev.Mill_Rate,
      Purchase_Rate: prev.Purchase_Rate,
      Sauda_Date: freshToday,
      Lifting_Date: freshToday,
      Sauda_Lifting_Date: freshToday,
    }));

    setNetAmount("0.00");
    setBuyerName("");
    setShipToName("");
    setBrokerName("");
    setSubBrokerName("");
    setExMillSelection("Ex Mill");
    setShouldFocusBuyer(true);
};

  const handleBack = () => {
    navigate("/sauda-book-utility-page");
  };

  return (
    <>
      <Box mr={2} mt={5}>
        <BackButton onClick={handleBack} />
      </Box>
      <Box minHeight="100vh" display="flex" justifyContent="center" alignItems="start" pt={4} mt={-10} mb={8}>
        <Box width="800px" bgcolor="white" p={3} borderRadius={2} boxShadow={2}>
          <Typography variant="h6" align="center" gutterBottom sx={{ color: "black", fontWeight: 'bold', mb: 1 }}>
            Sauda Book Utility
          </Typography>

          <Grid container spacing={0.5}>
            <Grid item xs={12} sm={4} display="flex" alignItems="center">
              <Typography fontWeight="bold">Mill Code :</Typography>
            </Grid>
            <Grid item xs={12} sm={8}>
              <AccountMasterHelp
                name="Mill_Code"
                CategoryCode={millCode}
                CategoryName={millName}
                onAcCodeClick={handleMillCode}
              />
            </Grid>

            <Grid item xs={12} sm={4} display="flex" alignItems="center">
              <Typography fontWeight="bold">Tender No :</Typography>
            </Grid>
            <Grid item xs={12} sm={8}>
              <Box display="flex" alignItems="center" ml={1}>
                <SaudaBookUtilityHelp
                  name="tender_no"
                  Millcode={millCode}
                  Tenderno={formData.Tender_No}
                  Tenderid={formData.tenderid}
                  onRecordDoubleClick={handleTenderSelection}
                />
                <Typography variant="body2" sx={{ color: "#0056b3", fontWeight: 600, fontSize: "13px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>
                  {tenderDisplayText}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={4} display="flex" alignItems="center">
              <Typography fontWeight="bold">Bill To :</Typography>
            </Grid>
            <Grid item xs={12} sm={8}>
              <AccountMasterHelp
                name="BuyerParty"
                CategoryCode={buyerCode}
                CategoryName={buyerName}
                onAcCodeClick={handleBuyerCode}
              />
            </Grid>

            <Grid item xs={12} sm={4} display="flex" alignItems="center">
              <Typography fontWeight="bold">Ship To :</Typography>
            </Grid>
            <Grid item xs={12} sm={8}>
              <AccountMasterHelp
                name="ShipTo"
                CategoryCode={formData.ShipTo}
                CategoryName={shipToName}
                onAcCodeClick={handleAccountSelect("ShipTo", "shiptoid")}
              />
            </Grid>

            <Grid item xs={12} sm={4} display="flex" alignItems="center">
              <Typography fontWeight="bold">Delivery Type :</Typography>
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField select size="small" fullWidth name="Delivery_Type" value={formData.Delivery_Type} onChange={handleInputChange}
                sx={{ '& .MuiInputBase-root': { height: '40px', fontSize: '14px', width: '26%', marginLeft: '10px' } }}>
                <MenuItem value="N">With GST Naka Delivery</MenuItem>
                <MenuItem value="A">Naka Delivery without GST Rate</MenuItem>
                <MenuItem value="C">Commission</MenuItem>
                <MenuItem value="D">DO</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={4} display="flex" alignItems="center">
              <Typography fontWeight="bold">Broker :</Typography>
            </Grid>
            <Grid item xs={12} sm={8}>
              <AccountMasterHelp
                name="Buyer_Party"
                CategoryCode={formData.Buyer_Party}
                CategoryName={brokerName}
                onAcCodeClick={handleAccountSelect("Buyer_Party", "buyerpartyid")}
              />
            </Grid>

            <Grid item xs={12} sm={4} display="flex" alignItems="center">
              <Typography fontWeight="bold">Sub Broker :</Typography>
            </Grid>
            <Grid item xs={12} sm={8}>
              <AccountMasterHelp
                name="sub_broker"
                CategoryCode={formData.sub_broker}
                CategoryName={subBrokerName}
                onAcCodeClick={handleAccountSelect("sub_broker", "sbr")}
              />
            </Grid>

            <Grid item xs={12} sm={4} display="flex" alignItems="center">
              <Typography fontWeight="bold">Select Party :</Typography>
            </Grid>
            <Grid item xs={12} sm={8}>
              <AccountMasterHelp
                name="EbuySelectedParty"
                CategoryCode={formData.EbuySelectedParty}
                CategoryName={selectedPartyName}
                onAcCodeClick={handleSelectedParty}
              />
            </Grid> 

            <Grid item xs={12} sm={4} display="flex" alignItems="center">
              <Typography fontWeight="bold">Buyer Quintal :</Typography>
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField size="small" fullWidth name="Buyer_Quantal" autoComplete="off" value={formData.Buyer_Quantal} onChange={handleInputChange}
                onInput={(e) => {
                  e.target.value = e.target.value.replace(/[^0-9.]/g, '');
                  const parts = e.target.value.split('.');
                  if (parts.length > 2) e.target.value = parts[0] + '.' + parts.slice(1).join('');
                }} />
            </Grid>

            <Grid item xs={12} sm={4} display="flex" alignItems="center">
              <Typography fontWeight="bold">Grade :</Typography>
            </Grid>
            <Grid item xs={12} sm={8}>
              <Select size="small" fullWidth value={formData.gradeCode || ""} displayEmpty
                onChange={(e) => {
                  const selectedGrade = grades.find(g => g.gradeCode === e.target.value);
                  if (selectedGrade) {
                    setFormData(prev => ({ ...prev, gradeCode: selectedGrade.gradeCode, gradeid: selectedGrade.gradeid, Mill_Rate: selectedGrade.gradeRate, Purchase_Rate: selectedGrade.Purchase_Rate }));
                  }
                }}>
                {grades.length === 0 ? <MenuItem value=""><em>Select Grade</em></MenuItem> : grades.map((g) => (
                  <MenuItem key={g.gradeid} value={g.gradeCode}>
                    {g.gradeCode} - {g.gradeName} - MillRate: {g.gradeRate}
                  </MenuItem>
                ))}
              </Select>
            </Grid>

            <Grid item xs={12} sm={4} display="flex" alignItems="center">
              <Typography fontWeight="bold">Mill Rate :</Typography>
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField size="small" fullWidth name="Mill_Rate" value={formData.Mill_Rate} disabled />
            </Grid>

            <Grid item xs={12} sm={4} display="flex" alignItems="center">
              <Typography fontWeight="bold">Purchase Rate :</Typography>
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField size="small" fullWidth name="Purchase_Rate" value={formData.Purchase_Rate} disabled />
            </Grid>

            <Grid item xs={12} sm={4} display="flex" alignItems="center">
              <Typography fontWeight="bold">Sale Rate :</Typography>
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField size="small" fullWidth name="Sale_Rate" value={formData.Sale_Rate} onChange={handleInputChange}
                onInput={(e) => {
                  e.target.value = e.target.value.replace(/[^0-9.]/g, '');
                  const parts = e.target.value.split('.');
                  if (parts.length > 2) e.target.value = parts[0] + '.' + parts.slice(1).join('');
                }} />
            </Grid>

            <Grid item xs={12} sm={4} display="flex" alignItems="center">
              <Typography fontWeight="bold">Commission :</Typography>
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField size="small" fullWidth name="Commission_Rate" value={formData.Commission_Rate} disabled />
            </Grid>

            <Grid item xs={12} sm={4} display="flex" alignItems="center" >
              <Typography fontWeight="bold">Dates :</Typography>
            </Grid>
            <Grid item xs={12} sm={8}>
              <Box display="flex" gap={2}>
                <TextField style={{ marginTop:"10px"}} type="date" size="small" fullWidth name="Sauda_Date" label="Sauda Date" value={formData.Sauda_Date} onChange={handleInputChange} InputLabelProps={{ shrink: true }} />
                <TextField style={{ marginTop:"10px"}} type="date" size="small" fullWidth name="Lifting_Date" label="Payment Date" value={formData.Lifting_Date} onChange={handleInputChange} InputLabelProps={{ shrink: true }} />
                <TextField style={{ marginTop:"10px"}} type="date" size="small" fullWidth name="Sauda_Lifting_Date" label="Sauda Lifting Date" value={formData.Sauda_Lifting_Date} onChange={handleInputChange} InputLabelProps={{ shrink: true }} />
              </Box>
            </Grid>

            <Grid item xs={12} sm={4} display="flex" alignItems="center">
              <Typography fontWeight="bold">Sauda Type :</Typography>
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField select size="small" fullWidth name="Sauda_Type" value={formData.Sauda_Type} onChange={handleInputChange}>
                <MenuItem value="F">Flexible</MenuItem>
                <MenuItem value="X">Sold Full Quantity</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={4} display="flex" alignItems="center">
              <Typography fontWeight="bold">Delivery From :</Typography>
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField select size="small" fullWidth value={exMillSelection} onChange={handleExMillSelectionChange}>
                <MenuItem value="Ex Mill">Ex Mill</MenuItem>
                <MenuItem value="Ex">Ex</MenuItem>
              </TextField>
              {exMillSelection === "Ex" && (
                <TextField
                  size="small"
                  fullWidth
                  sx={{ mt: 1 }}
                  placeholder="Please add Delivery From."
                  name="Ex_Mill_Type"
                  value={formData.Ex_Mill_Type}
                  onChange={handleInputChange}
                />
              )}
            </Grid>

            <Grid item xs={12} sm={4} display="flex" alignItems="center">
              <Typography fontWeight="bold">Narration :</Typography>
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField size="small" fullWidth name="Narration" value={formData.Narration} onChange={handleInputChange} multiline rows={2} />
            </Grid>

            <Grid item xs={12} sm={4} display="flex" alignItems="center">
              <Typography fontWeight="bold">GST Amount :</Typography>
            </Grid>
            <Grid item xs={6} sm={4} mt={1}>
              <TextField label="GST Rate" type="number" size="small" fullWidth name="gst_rate" value={formData.gst_rate} onChange={handleInputChange} />
            </Grid>
            <Grid item xs={6} sm={4} mt={1}>
              <TextField label="GST Amount" size="small" fullWidth value={formData.gst_amt} InputProps={{ readOnly: true }} />
            </Grid>

            <Grid item xs={12} sm={4} display="flex" alignItems="center">
              <Typography fontWeight="bold">TCS Amount :</Typography>
            </Grid>
            <Grid item xs={6} sm={4} mt={1}>
              <TextField label="TCS Rate" type="number" size="small" fullWidth name="tcs_rate" value={formData.tcs_rate} onChange={handleInputChange} />
            </Grid>
            <Grid item xs={6} sm={4} mt={1}>
              <TextField label="TCS Amount" size="small" fullWidth value={formData.tcs_amt} InputProps={{ readOnly: true }} />
            </Grid>

            <Grid item xs={12} sm={4} display="flex" alignItems="center">
              <Typography fontWeight="bold">Net Amount :</Typography>
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField size="small" fullWidth value={netAmount} InputProps={{ readOnly: true, sx: { fontWeight: 'bold', fontSize: '1rem' } }} />
            </Grid>

            <Grid item xs={12} sx={{ mt: 2 }}>
              <Button variant="contained" fullWidth onClick={handleSubmit} disabled={isSubmitting}
                sx={{ width: '150px', height: '36px', fontWeight: 'bold' }}>
                {isSubmitting ? 'Saving...' : 'Update'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Box>
      <Box sx={{ borderBottom: '1px dotted #000000ff', width: '100%', my: 10 }} />
      <LiveTenders />
    </>
  );
};

export default SaudaBookUtility;