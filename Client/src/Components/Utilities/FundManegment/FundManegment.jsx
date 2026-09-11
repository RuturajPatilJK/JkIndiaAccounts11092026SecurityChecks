import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import ActionButtonGroup from '../../../Common/CommonButtons/ActionButtonGroup';
import NavigationButtons from "../../../Common/CommonButtons/NavigationButtons";
import { useNavigate } from 'react-router-dom';
import AccountMasterHelp from "../../../Helper/AccountMasterHelp";
import GSTRateMasterHelp from "../../../Helper/GSTRateMasterHelp";
import { toast } from 'react-toastify';
import { useLocation } from "react-router-dom";
import { Box, Grid, TextField, Typography, Checkbox, FormControlLabel } from '@mui/material';
import UserAuditInfo from "../../../Common/UserAuditInfo/UserAuditInfo";
import { purple } from '@mui/material/colors';
import FundAdjustmentHelp from "../../../Helper/FundAdjustmentHelp"
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount"
import Paper from '@mui/material/Paper';


var newBillFromCode = ''
var newBillFromName = ''

var newBilltoCode = ''
var newBilltoName = ''

var newPurcBillToCode = ''
var newPurcBillToName = ''


var gstRateCode = "";
var gstName = "";

var fundIdCode = "";
var fundDocNo = "";

var PaymentDelayDays = 0;

var previousRefNo = 0;

const API_URL = process.env.REACT_APP_API


const FundForm = () => {
  const Company_Code = sessionStorage.getItem('Company_Code')
  const username = sessionStorage.getItem("username")

  const [completedCheckboxEnabled, setCompletedCheckboxEnabled] = useState(false);
  const [isUsedAsRef, setIsUsedAsRef] = useState(false);


  const initialFormData = {
    Doc_no: "",
    Doc_date: new Date().toISOString().split("T")[0],
    Riceipt_date: new Date().toISOString().split("T")[0],
    Riceipt_amount: 0.0,
    Funding_from: "",
    ff: "",
    Funding_rate: 0.0,
    Bill_to: "",
    bt: "",
    Bill_rate: 0.0,
    Quintal: 0,
    Due_days: "20",
    Interest_rate: "10.5",
    Interest_amount: 0.0,
    Purchase_rate: 0.0,
    Purchase_bill_amount: 0.0,
    Actual_payment_date: '',
    Interest_adjusted_rate: 0.0,
    Payment_adjustment_no: 0,
    Payment_adjustment_amount: 0.0,
    less_rate: 0.0,
    Actual_payment_amount: 0.0,
    Other_amount: 0,
    Company_code: Company_Code,
    Created_By: "",
    Modify_By: "",
    Remark: "",
    PurcBillTo: "",
    pt: "",
    TDS_rate: "0.1",
    gstid: "",
    GST_rate_code: "",
    Total_amount: 0.0,
    GST_rate: 0,
    GST_amount: 0.0,
    TDS_amount: 0.0,
    Is_completed: 0,
    Ref_no: "",
    Advance_amount: 0.0,
    Funding_Adjust: 0.0,

    Purchase_TDS_rate: "0.1",
    Purchase_GST_amount: 0.0,
    Purchase_GST_rate: 0,
    Purchase_TDS_amount: 0.0,

    Purchase_taxable_amount: 0,
    Net_payable_amount: 0,
    Bill_amount: 0,
    prevQty: 0


  };
  const [formData, setFormData] = useState(initialFormData);

  const [gstCode, setGstCode] = useState("");

  const [updateButtonClicked, setUpdateButtonClicked] = useState(false);
  const [saveButtonClicked, setSaveButtonClicked] = useState(false);
  const [addOneButtonEnabled, setAddOneButtonEnabled] = useState(false);
  const [saveButtonEnabled, setSaveButtonEnabled] = useState(true);
  const [cancelButtonEnabled, setCancelButtonEnabled] = useState(true);
  const [editButtonEnabled, setEditButtonEnabled] = useState(false);
  const [deleteButtonEnabled, setDeleteButtonEnabled] = useState(false);
  const [backButtonEnabled, setBackButtonEnabled] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [highlightedButton, setHighlightedButton] = useState(null);
  const [cancelButtonClicked, setCancelButtonClicked] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isCheckboxEnabled, setCheckboxEnabled] = useState(false);

  const [billFromCode, setBillFromCode] = useState('')
  const [billToCode, setBillToCode] = useState('')
  const [PurcBillToCode, setPurcBillTOcode] = useState('')
  const [isManualAmount, setIsManualAmount] = useState(false);
  const [isManualAmounts, setManualRate] = useState(false);
  const [purchaseBillToManuallySet, setPurchaseBillToManuallySet] = useState(false);
  const [fundcode, setFundCode] = useState('')
  let [paymentDelayDays, setPaymentDelayDays] = useState(0)

  const [formErrors, setFormErrors] = useState({});

  let drpType = useRef(null)
  let receiptRef = useRef(null)
  let fundingRateRef = useRef(null)

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const navigatedRecord = searchParams.get('navigatedRecord');
  const selectedRecord = location.state?.selectedRecord;
  const permissions = location.state?.permissionsData;
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    const newValue = type === "checkbox" ? checked : value;

    if (name === "Payment_adjustment_no" && (value === "" || value === "0" || value === 0)) {
      setFormData((prev) => ({
        ...prev,
        [name]: newValue,
        Ref_no: "0",
      }));
      return;
    }



    // Update form data
    setFormData((prev) => ({
      ...prev,
      [name]: newValue
    }));

    if (name === "Riceipt_amount") {
      setIsManualAmount(true);
      setManualRate(false);
    } else if (name === "Bill_rate") {
      setManualRate(true);
      setIsManualAmount(false);
    }
    else if (name === "Quintal") {
      setIsManualAmount(false);
    }
  };


  const calculatedDueDate = (receiptDateStr, dueDays) => {
    try {
      const receiptDate = new Date(receiptDateStr);
      if (isNaN(receiptDate.getTime())) return "";

      receiptDate.setDate(receiptDate.getDate() + parseInt(dueDays, 10));
      return receiptDate.toISOString().split("T")[0]; // "YYYY-MM-DD"
    } catch (err) {
      return "";
    }
  };




  const checkIfFundIsUsed = async (docNo) => {
    try {
      const response = await axios.get(`${API_URL}/check_fund_usage?Doc_no=${docNo}&Company_Code=${Company_Code}`);
      setIsUsedAsRef(response.data.isUsed);
    } catch (error) {
      console.error("Error checking fund usage:", error);
      setIsUsedAsRef(false);
    }
  };



  const calculateFields = () => {
    const quintal = parseFloat(formData.Quintal) || 0;
    const interestRate = parseFloat(formData.Interest_rate) || 0;
    const dueDays = parseFloat(formData.Due_days) || 0;
    const fundingRate = parseFloat(formData.Funding_rate) || 0;
    const tdsRate = parseFloat(formData.TDS_rate) || 0;
    const gstRate = parseFloat(formData.GST_rate) || 0;

    const purchasetdsrate = parseFloat(formData.Purchase_TDS_rate) || 0;
    const purchasegstrate = parseFloat(formData.Purchase_GST_rate) || 0;

    let billRate = isManualAmounts
      ? parseFloat(formData.Bill_rate) || 0
      : Math.round(fundingRate - 1);

    let Payment_adjustment_amount = parseFloat(formData.Payment_adjustment_amount) || 0;
    let Interest_adjusted_rate = parseFloat(formData.Interest_adjusted_rate) || 0;
    let purchaseRate = 0;
    let purchaseBillAmount = 0;
    let actualPaymentAmount = parseFloat(formData.Actual_payment_amount) || 0;
    let Advance_amount = parseFloat(formData.Advance_amount) || 0;

    let riceiptAmount = parseFloat(formData.Riceipt_amount) || 0;
    let fundingadj = parseFloat(formData.Funding_Adjust) || 0;
    let prevQty = parseFloat(formData.prevQty) || 0;

    const less_rate = parseFloat(formData.less_rate) || 0;

    fundingadj = Math.round(fundingRate * quintal);

    if (!isManualAmount && quintal > 0 && billRate > 0) {
      riceiptAmount = Math.round(quintal * billRate);
    }

    if (!isManualAmounts && quintal > 0 && riceiptAmount > 0) {
      billRate = Math.round(riceiptAmount / quintal);
    }

    const interestAmount = Math.round((riceiptAmount * interestRate * dueDays) / (100 * 365));
    const tdsAmount = Math.round((riceiptAmount * tdsRate) / 100);
    const gstAmount = Math.round((riceiptAmount * gstRate) / 100);
    const total = riceiptAmount + gstAmount - tdsAmount;

    const receiptDate = new Date(formData.Riceipt_date);
    const actualPaymentDate = new Date(formData.Actual_payment_date);
    const dueDate = new Date(receiptDate);
    dueDate.setDate(dueDate.getDate() + dueDays);

    let daysDifference = 0;
    if (!isNaN(dueDate) && !isNaN(actualPaymentDate)) {
      const diffInMs = dueDate - actualPaymentDate;
      daysDifference = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
    }

    let newpurchasegstamount = 0;
    let newpurchasetdsamount = 0;
    const Bill_amount = riceiptAmount + gstAmount;
    let purchasetaxableAmount = 0;

    if (!formData.Payment_adjustment_no || formData.Payment_adjustment_no === "") {
      Payment_adjustment_amount = 0;
      Interest_adjusted_rate = 0;
      purchaseRate = quintal > 0
        ? ((fundingRate * interestRate) / 100 / 365 * dueDays + fundingRate).toFixed(2)
        : 0;

      Advance_amount = Math.round(total * (interestRate / 100) / 365 * daysDifference);
      purchasetaxableAmount = Math.round(purchaseRate * quintal);
      newpurchasegstamount = Math.round((purchaseRate * quintal) * (purchasegstrate / 100));
      newpurchasetdsamount = Math.round((purchaseRate * quintal) * (purchasetdsrate / 100));
      purchaseBillAmount = purchasetaxableAmount + newpurchasegstamount;
      actualPaymentAmount = purchaseBillAmount;

    } else {
      const PaymentDelayDays = paymentDelayDays;

      Interest_adjusted_rate = Math.round((fundingadj * (interestRate / 100) / 365) * PaymentDelayDays);
      Advance_amount = Math.round((total * interestRate / 100 / 365) * daysDifference);
      purchaseRate = (((less_rate * prevQty) + Interest_adjusted_rate) / prevQty).toFixed(2);

      purchasetaxableAmount = Math.round(purchaseRate * prevQty);
      newpurchasegstamount = Math.round(purchasetaxableAmount * (purchasegstrate / 100));
      newpurchasetdsamount = Math.round(purchasetaxableAmount * (purchasetdsrate / 100));

      purchaseBillAmount = purchasetaxableAmount + newpurchasegstamount;
      actualPaymentAmount = purchasetaxableAmount + newpurchasegstamount - newpurchasetdsamount;
    }

    const netpayable = purchasetaxableAmount + newpurchasegstamount - newpurchasetdsamount;

    const isCompletionAllowed = isCompletionEligible(formData.Actual_payment_date, formData.Due_days, formData.Riceipt_date);
    setCompletedCheckboxEnabled(isCompletionAllowed);

    setFormData((prev) => ({
      ...prev,
      Riceipt_amount: !isManualAmount ? riceiptAmount : prev.Riceipt_amount,
      Bill_rate: !isManualAmounts ? billRate : prev.Bill_rate,
      Interest_amount: interestAmount,
      Purchase_rate: purchaseRate,
      Actual_payment_amount: actualPaymentAmount,
      Purchase_bill_amount: purchaseBillAmount,
      TDS_amount: tdsAmount,
      GST_amount: gstAmount,
      Total_amount: total,
      Interest_adjusted_rate: Interest_adjusted_rate,
      Advance_amount: Advance_amount,
      Purchase_GST_amount: newpurchasegstamount,
      Purchase_TDS_amount: newpurchasetdsamount,
      Bill_amount: Bill_amount,
      Purchase_taxable_amount: purchasetaxableAmount,
      Net_payable_amount: netpayable,
      Funding_Adjust: fundingadj
    }));
  };



  const handleKeyDown = (e) => {
    if (e.key === "Tab") {
      calculateFields(); // Recalculate when Enter is pressed
    }
  };

  const fetchLastGSTRateDocNo = () => {
    fetch(`${API_URL}/getLastFundNO?company_code=${Company_Code}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch last Doc NO');
        }
        return response.json();
      })
      .then(data => {
        const lastDocNo = Number(data.Doc_no);
        const nextDocNo = isNaN(lastDocNo) ? 1 : lastDocNo + 1;

        setFormData(prevState => ({
          ...prevState,
          Doc_no: nextDocNo
        }));
      })
      .catch(error => {
        console.error('Error fetching last company code:', error);
        setFormData(prevState => ({
          ...prevState,
          Doc_no: 1
        }));
      });
  };



  const handleAddOne = () => {
    setAddOneButtonEnabled(false);
    setSaveButtonEnabled(true);
    setCancelButtonEnabled(true);
    setEditButtonEnabled(false);
    setDeleteButtonEnabled(false);
    setIsEditing(true);
    setFormData(initialFormData);
    fetchLastGSTRateDocNo();
    setBillFromCode('')
    setBillToCode('')
    setPurcBillTOcode('')
    newBillFromCode = ''
    newBillFromName = ''
    newBilltoCode = ''
    newBilltoName = ''
    newPurcBillToCode = ''
    newPurcBillToName = ''
    setGstCode('')
    gstName = ''
    gstRateCode = ''
    fundDocNo = ''
    fundIdCode = ''
    setTimeout(() => {
      receiptRef.current?.focus();
    }, 0);
  }

  const formatDateToDDMMYYYY = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${year}-${month}-${day}`;
  };

  const handleSaveOrUpdate = () => {
    // Basic validation
    const requiredFields = ["Funding_rate", "Bill_rate", "Quintal", "Riceipt_amount", "Interest_rate"];
    let errors = {};

    requiredFields.forEach((field) => {
      if (!formData[field]) {
        errors[field] = "This field is required";
      } else if (isNaN(formData[field])) {
        errors[field] = "Must be a number";
      }
    });

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      Swal.fire({
        title: "Validation Error",
        text: "Please correct the highlighted fields.",
        icon: "warning",
        confirmButtonText: "OK"
      });
      return;
    }

    if (!formData.Funding_from || formData.Funding_from === 0) {
      Swal.fire({
        title: "Error",
        text: "Funding from is required.",
        icon: "error",
        confirmButtonText: "OK"
      });
      return;
    }

    if (!formData.Bill_to || formData.Bill_to === 0) {
      Swal.fire({
        title: "Error",
        text: "Bill to is required.",
        icon: "error",
        confirmButtonText: "OK"
      });
      return;
    }

    if (!formData.PurcBillTo || formData.PurcBillTo === 0) {
      Swal.fire({
        title: "Error",
        text: "Purc Bill to is required.",
        icon: "error",
        confirmButtonText: "OK"
      });
      return;
    }

    // ✅ If Actual_payment_date is not provided, calculate from Riceipt_date + Due_days
    if (!formData.Actual_payment_date) {
      const autoDueDate = calculatedDueDate(formData.Riceipt_date, formData.Due_days);
      formData.Actual_payment_date = autoDueDate; // Make sure calculatedDueDate returns "YYYY-MM-DD"
    }

    const formattedDocDate = formatDateToDDMMYYYY(formData.Doc_date);
    const formattedPaymentDate = formatDateToDDMMYYYY(formData.Riceipt_date);
    const formattedPaymentDates = formatDateToDDMMYYYY(formData.Actual_payment_date);

    let updatedFormData = {
      ...formData,
      Doc_date: formattedDocDate,
      Riceipt_date: formattedPaymentDate,
      Actual_payment_date: formattedPaymentDates,
      Created_By: username,
      previousRefNo: previousRefNo
    };

    if (isEditMode) {
      updatedFormData = {
        ...updatedFormData,
        Modify_By: username
      };

      axios
        .put(`${API_URL}/update_fund_record?fundId=${formData.fundId}`, updatedFormData)
        .then((response) => {
          Swal.fire({
            title: "Success!",
            text: "Record updated successfully!",
            icon: "success",
            confirmButtonText: "OK"
          });

          setIsEditMode(false);
          setAddOneButtonEnabled(true);
          setEditButtonEnabled(true);
          setDeleteButtonEnabled(true);
          setBackButtonEnabled(true);
          setSaveButtonEnabled(false);
          setCancelButtonEnabled(false);
          setIsEditing(false);
          setTimeout(() => {
            window.location.reload();
          }, 1000);
          navigate(`/funds?navigatedRecord=${formData.Doc_no}`);
        })
        .catch((error) => {
          handleCancel();
          console.error("Error updating data:", error);
        });

      const isCompletionAllowed = isCompletionEligible(formData.Actual_payment_date, formData.Due_days, formData.Riceipt_date);
      setCompletedCheckboxEnabled(isCompletionAllowed);
    } else {
      axios
        .post(`${API_URL}/createnewfunds`, updatedFormData)
        .then((response) => {
          Swal.fire({
            title: "Success!",
            text: "Record created successfully!",
            icon: "success",
            confirmButtonText: "OK"
          });

          setIsEditMode(false);
          setAddOneButtonEnabled(true);
          setEditButtonEnabled(true);
          setDeleteButtonEnabled(true);
          setBackButtonEnabled(true);
          setSaveButtonEnabled(false);
          setCancelButtonEnabled(false);
          setIsEditing(false);
          setTimeout(() => {
            window.location.reload();
          }, 1000);
          navigate(`/funds?navigatedRecord=${formData.Doc_no}`);
        })
        .catch((error) => {
          console.error("Error saving data:", error);
        });
    }
  };






  const isCompletionEligible = (Riceipt_datestr, Due_days, Actual_payment_date) => {
    if (!Riceipt_datestr || isNaN(Due_days) || !Actual_payment_date) return false;

    const paymentDate = new Date(Actual_payment_date);
    const targetDate = new Date(Riceipt_datestr);

    if (isNaN(paymentDate.getTime()) || isNaN(targetDate.getTime())) return false;

    targetDate.setDate(targetDate.getDate() + parseInt(Due_days, 10));

    // Normalize both dates to avoid time comparison issues
    paymentDate.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);

    return paymentDate >= targetDate;
  };



  // navigate buttons
  const handleFirstButtonClick = async () => {
    try {
      const response = await fetch(`${API_URL}/get_first_fund?Doc_no=${formData.Doc_no}&company_code=${Company_Code}`);

      if (!response.ok) {
        throw new Error("Failed to fetch first fund record");
      }

      const data = await response.json();
      const lastData = data.data;

      // Set billing fields
      newBillFromCode = data.lable?.[0]?.Funding_from || "";
      newBillFromName = data.lable?.[0]?.FundingFromName || "";
      newBilltoCode = data.lable?.[0]?.Bill_to || "";
      newBilltoName = data.lable?.[0]?.bill_to_name || "";
      newPurcBillToCode = data.lable?.[0]?.PurcBillTo || "";
      newPurcBillToName = data.lable?.[0]?.purches_bill_to_name || "";
      gstName = data.lable?.[0]?.GST_Name || "";
      gstRateCode = data.lable?.[0]?.GST_rate_code || "";
      PaymentDelayDays = data.lable?.[0]?.paymentDelayDays || "";
      fundIdCode = data.lable?.[0]?.fundIdCode
      fundDocNo = lastData.Ref_no
      previousRefNo = lastData.Ref_no



      const isCompletionAllowed = isCompletionEligible(lastData.Actual_payment_date, lastData.Due_days, lastData.Riceipt_date);
      setCompletedCheckboxEnabled(isCompletionAllowed);

      // Set form data
      setFormData({
        ...formData,
        ...lastData,
      });
      checkIfFundIsUsed(lastData.Doc_no)

    } catch (error) {
      console.error("Error during API call:", error);
      alert("Failed to fetch first fund record.");
    }
  };


  const handlePreviousButtonClick = async () => {
    try {
      const response = await fetch(`${API_URL}/get_previous_funds?Doc_no=${formData.Doc_no}&company_code=${Company_Code}`);

      if (!response.ok) {
        throw new Error("Failed to fetch previous fund record");
      }

      const data = await response.json();
      const lastRecord = data.data;

      if (!lastRecord) {
        alert("No previous record found.");
        return;
      }

      // Set billing fields
      newBillFromCode = data.lable?.[0]?.Funding_from || "";
      newBillFromName = data.lable?.[0]?.FundingFromName || "";
      newBilltoCode = data.lable?.[0]?.Bill_to || "";
      newBilltoName = data.lable?.[0]?.bill_to_name || "";
      newPurcBillToCode = data.lable?.[0]?.PurcBillTo || "";
      newPurcBillToName = data.lable?.[0]?.purches_bill_to_name || "";
      gstName = data.lable?.[0]?.GST_Name || "";
      gstRateCode = data.lable?.[0]?.GST_rate_code || "";
      PaymentDelayDays = data.lable?.[0]?.paymentDelayDays || "";
      fundIdCode = data.lable?.[0]?.fundIdCode
      fundDocNo = lastRecord.Ref_no
      previousRefNo = lastRecord.Ref_no

      const isCompletionAllowed = isCompletionEligible(lastRecord.Actual_payment_date, lastRecord.Due_days, lastRecord.Riceipt_date);
      setCompletedCheckboxEnabled(isCompletionAllowed);

      // Set form data
      setFormData({
        ...formData,
        ...lastRecord,
      });
      checkIfFundIsUsed(lastRecord.Doc_no)

    } catch (error) {
      console.error("Error fetching previous record:", error);
      alert("Failed to fetch previous record.");
    }
  };


  const handleNextButtonClick = async () => {
    try {
      const response = await fetch(`${API_URL}/get_next_fund?Doc_no=${formData.Doc_no}&company_code=${Company_Code}`);

      if (!response.ok) {
        throw new Error("Failed to fetch next fund record");
      }

      const data = await response.json();
      const lastRecord = data.data;

      // Set billing fields
      newBillFromCode = data.lable?.[0]?.Funding_from || "";
      newBillFromName = data.lable?.[0]?.FundingFromName || "";
      newBilltoCode = data.lable?.[0]?.Bill_to || "";
      newBilltoName = data.lable?.[0]?.bill_to_name || "";
      newPurcBillToCode = data.lable?.[0]?.PurcBillTo || "";
      newPurcBillToName = data.lable?.[0]?.purches_bill_to_name || "";
      gstName = data.lable?.[0]?.GST_Name || "";
      gstRateCode = data.lable?.[0]?.GST_rate_code || "";
      fundIdCode = data.lable?.[0]?.fundIdCode
      fundDocNo = lastRecord.Ref_no
      previousRefNo = lastRecord.Ref_no
      const isCompletionAllowed = isCompletionEligible(lastRecord.Actual_payment_date, lastRecord.Due_days, lastRecord.Riceipt_date);
      PaymentDelayDays = data.lable?.[0]?.paymentDelayDays || "";
      setCompletedCheckboxEnabled(isCompletionAllowed);

      // Set form data
      setFormData({
        ...formData,
        ...lastRecord
      });
      checkIfFundIsUsed(lastRecord.Doc_no)

    } catch (error) {
      console.error("Error during API call:", error);
      alert("Failed to fetch next record.");
    }
  };

  const handleLastButtonClick = async () => {
    try {
      const response = await fetch(`${API_URL}/getLastFundData?Doc_no=${formData.Doc_no}&company_code=${Company_Code}`);
      if (!response.ok) {
        throw new Error("Failed to fetch last record");
      }

      const data = await response.json();
      const lastData = data.data;

      // Set billing fields
      newBillFromCode = data.label?.[0]?.Funding_from || "";
      newBillFromName = data.label?.[0]?.FundingFromName || "";
      newBilltoCode = data.label?.[0]?.Bill_to || "";
      newBilltoName = data.label?.[0]?.bill_to_name || "";
      newPurcBillToCode = data.label?.[0]?.PurcBillTo || "";
      newPurcBillToName = data.label?.[0]?.purches_bill_to_name || "";
      gstName = data.label?.[0]?.GST_Name || "";
      gstRateCode = data.label?.[0]?.GST_rate_code || "";
      PaymentDelayDays = data.label?.[0]?.paymentDelayDays || "";

      fundIdCode = data.label?.[0]?.fundIdCode
      fundDocNo = lastData.Ref_no
      previousRefNo = lastData.Ref_no
      const isCompletionAllowed = isCompletionEligible(lastData.Actual_payment_date, lastData.Due_days, lastData.Riceipt_date);

      setCompletedCheckboxEnabled(isCompletionAllowed);

      // Set form data
      setFormData({
        ...formData,
        ...lastData,
      });
      checkIfFundIsUsed(lastData.Doc_no)
      setIsEditing(false);
      setIsEditMode(false);
      setAddOneButtonEnabled(true);
      setEditButtonEnabled(true);
      setDeleteButtonEnabled(true);
      setBackButtonEnabled(true);
      setSaveButtonEnabled(false);
      setCancelButtonEnabled(false);
      setCancelButtonClicked(true);
      setCompletedCheckboxEnabled(isCompletionAllowed);


    } catch (error) {
      console.error("Error during API call:", error);
      alert("Failed to fetch last record.");
    }
  };


  const handleEdit = () => {
    setIsEditMode(true);
    setAddOneButtonEnabled(false);
    setSaveButtonEnabled(true);
    setCancelButtonEnabled(true);
    setEditButtonEnabled(false);
    setDeleteButtonEnabled(false);
    setBackButtonEnabled(true);
    setIsEditing(true);

  };


  const handleDelete = async () => {
    try {
      const checkResponse = await axios.get(
        `${API_URL}/check_fund_usage?Doc_no=${formData.Doc_no}&Company_Code=${Company_Code}`
      );

      if (checkResponse.data.isUsed) {
        const inUseMessage = checkResponse.data.FundNo
          ? `Cannot delete: This record is currently associated with Fund No: ${checkResponse.data.FundNo}.` : ''


        Swal.fire({
          title: "Error",
          text: inUseMessage,
          icon: "error",
        });
        return;
      }

      const result = await Swal.fire({
        title: "Are you sure?",
        html: `You won't be able to revert this <strong>Doc No : ${formData.Doc_no}</strong>`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        cancelButtonText: "Cancel",
        confirmButtonText: "Delete",
        reverseButtons: true,
        focusCancel: true,
      });

      if (!result.isConfirmed) {
        Swal.fire({
          title: "Cancelled",
          text: "Your record is safe 🙂",
          icon: "info",
        });
        return;
      }

      setIsEditMode(false);
      setAddOneButtonEnabled(true);
      setEditButtonEnabled(true);
      setDeleteButtonEnabled(true);
      setBackButtonEnabled(true);
      setSaveButtonEnabled(false);
      setCancelButtonEnabled(false);
      //setIsLoading(true);

      const deleteApiUrl = `${API_URL}/delete_fund_records?Doc_no=${formData.Doc_no}`;
      await axios.delete(deleteApiUrl);

      await Swal.fire({
        title: "Deleted!",
        text: "Record deleted successfully!",
        icon: "success",
        confirmButtonText: "OK",
      });

      handleCancel();

    } catch (error) {
      toast.error(`Error deleting record: ${error.response?.data?.message || error.message}`);
      console.error("Error during API call:", error);
    }
  };



  function formatToInputDate(dateStr) {
    if (!dateStr || typeof dateStr !== "string") return "";

    if (dateStr.includes("-")) {
      // Already in YYYY-MM-DD → return as is
      return dateStr;
    }

    const parts = dateStr.split("/").map(Number); // expects "DD/MM/YYYY"
    if (parts.length !== 3) return "";

    const [day, month, year] = parts;
    const fullYear = year < 100 ? 2000 + year : year;
    const date = new Date(fullYear, month - 1, day);
    return date.toISOString().split("T")[0];
  }




  const handleCancel = async () => {
    try {
      const response = await fetch(`${API_URL}/getLastFundData?Doc_no=${formData.Doc_no}&company_code=${Company_Code}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch last record");
      }

      const data = await response.json();
      const lastData = data.data;

      if (!lastData) {
        alert("No last record found.");
        return;
      }



      // Set billing fields
      newBillFromCode = data.label?.[0]?.Funding_from || "";
      newBillFromName = data.label?.[0]?.FundingFromName || "";
      newBilltoCode = data.label?.[0]?.Bill_to || "";
      newBilltoName = data.label?.[0]?.bill_to_name || "";
      newPurcBillToCode = data.label?.[0]?.PurcBillTo || "";
      newPurcBillToName = data.label?.[0]?.purches_bill_to_name || "";
      gstName = data.label?.[0]?.GST_Name || "";
      gstRateCode = data.label?.[0]?.GST_rate_code || "";
      PaymentDelayDays = data.label?.[0]?.paymentDelayDays || "";
      fundIdCode = data.label?.[0]?.fundIdCode
      fundDocNo = lastData.Ref_no
      previousRefNo = lastData.Ref_no


      const isCompletionAllowed = isCompletionEligible(lastData.Actual_payment_date, lastData.Due_days, lastData.Riceipt_date);
      setCompletedCheckboxEnabled(isCompletionAllowed);

      // Set form data
      setFormData({
        ...formData,
        ...lastData,
      });

      checkIfFundIsUsed(lastData.Doc_no)

      setCompletedCheckboxEnabled(isCompletionAllowed);
      setIsEditing(false);
      setIsEditMode(false);
      setAddOneButtonEnabled(true);
      setEditButtonEnabled(true);
      setDeleteButtonEnabled(true);
      setBackButtonEnabled(true);
      setSaveButtonEnabled(false);
      setCancelButtonEnabled(false);
      setCancelButtonClicked(true);
    } catch (error) {
      console.error("Error fetching last record:", error);
      handleAddOne()
    }
  };




  const handlerecordDoubleClicked = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/get_funds_Selected_Record?Doc_no=${selectedRecord.Doc_no}&company_code=${Company_Code}`
      );
      const data = response.data;
      const lastData = data.data;

      if (!lastData) {
        alert("No data found for selected record.");
        return;
      }

      const label = data.label?.[0] || data.lable?.[0] || {};
      newBillFromCode = label.Funding_from || "";
      newBillFromName = label.FundingFromName || "";
      newBilltoCode = label.Bill_to || "";
      newBilltoName = label.bill_to_name || "";
      newPurcBillToCode = label.PurcBillTo || "";
      newPurcBillToName = label.purches_bill_to_name || "";
      PaymentDelayDays = label.paymentDelayDays || "";
      gstName = label.GST_Name || "";
      gstRateCode = label.GST_rate_code || "";
      fundIdCode = label?.fundIdCode
      fundDocNo = lastData.Ref_no
      previousRefNo = lastData.Ref_no

      const isCompletionAllowed = isCompletionEligible(lastData.Actual_payment_date, lastData.Due_days, lastData.Riceipt_date);
      setCompletedCheckboxEnabled(isCompletionAllowed);

      setFormData({
        ...formData,
        ...lastData,
      });
      checkIfFundIsUsed(lastData.Doc_no)

      setIsEditing(false);
      setIsEditMode(false);
      setAddOneButtonEnabled(true);
      setEditButtonEnabled(true);
      setDeleteButtonEnabled(true);
      setBackButtonEnabled(true);
      setSaveButtonEnabled(false);
      setCancelButtonEnabled(false);
      setUpdateButtonClicked(true);
    } catch (error) {
      console.error("Error fetching selected record:", error);
      alert("Failed to fetch selected record.");
    }
  };

  useEffect(() => {
    if (selectedRecord) {
      handlerecordDoubleClicked();
    }
    else if (navigatedRecord && !isNaN(navigatedRecord) && parseInt(navigatedRecord) > 0) {
      handleNavigateRecord();
    }
    else {
      handleAddOne();
    }
  }, [selectedRecord, navigatedRecord]);

  const handleBillfrom = async (code, accoid, name) => {
    setBillFromCode(code)
    newBillFromCode = code;
    newBillFromName = name;
    let updatedFormData = {
      ...formData,
      Funding_from: code,
      ff: accoid,
    };

    if (!purchaseBillToManuallySet) {
      setPurcBillTOcode(code);
      newPurcBillToName = name;
      newBillFromCode = code;

      updatedFormData.PurcBillTo = code;
      updatedFormData.pt = accoid;
    }

    setFormData(updatedFormData);

  }

  const handleBillTO = async (code, accoid) => {

    setBillToCode(code);
    setFormData({
      ...formData,
      Bill_to: code,
      bt: accoid,
    });

  }

  const hamdelPurcBillTo = async (code, accoid) => {
    setPurchaseBillToManuallySet(true)
    setPurcBillTOcode(code);
    setFormData({
      ...formData,
      PurcBillTo: code,
      pt: accoid,
    });

  }

  const handleFundAdjustment = async (item) => {
    setFundCode(item?.Doc_no);
    newPurcBillToCode = item?.PurcBillTo || ''
    newPurcBillToName = item?.purches_bill_to_name || ''
    newBillFromCode = item?.Funding_from || ''
    newBillFromName = item?.FundingFromName || ''
    newBilltoCode = item?.Bill_to || ''
    newBilltoName = item?.bill_to_name || ''
    PaymentDelayDays = item?.PaymentDelayDays
    setFormData({
      ...formData,
      Payment_adjustment_no: item?.Doc_no,
      Payment_adjustment_amount: item?.Funding_Adjust || 0.0,
      Bill_to: item?.Bill_to,
      Funding_from: item?.Funding_from,
      pt: item?.pt,
      GST_rate_code: item?.GST_rate_code,
      ff: item?.ff,
      bt: item?.bt,
      PurcBillTo: item?.PurcBillTo,
      GST_rate: item?.GST_rate,
      gstid: item?.gstid,
      Ref_no: item?.Doc_no,
      less_rate: item?.Purchase_rate,
      prevQty: item?.Quintal





    });
    setPaymentDelayDays(item?.PaymentDelayDays)

    setTimeout(() => {
      fundingRateRef.current.focus()
    }, 1000);
  }

  const handleNavigateRecord = async () => {
    setIsEditing(false);
    setIsEditMode(false);
    setAddOneButtonEnabled(true);
    setEditButtonEnabled(true);
    setDeleteButtonEnabled(true);
    setBackButtonEnabled(true);
    setSaveButtonEnabled(false);
    setCancelButtonEnabled(false);
    setCancelButtonClicked(true);
    try {
      const response = await axios.get(`${API_URL}/get_funds_Selected_Record?Doc_no=${navigatedRecord}&company_code=${Company_Code}`);
      const data = response.data;

      const lastData = data.data

      const label = data.label?.[0] || data.lable?.[0] || {};
      newBillFromCode = label.Funding_from || "";
      newBillFromName = label.FundingFromName || "";
      newBilltoCode = label.Bill_to || "";
      newBilltoName = label.bill_to_name || "";
      newPurcBillToCode = label.PurcBillTo || "";
      newPurcBillToName = label.purches_bill_to_name || "";
      PaymentDelayDays = label.paymentDelayDays || "";
      gstName = label.GST_Name || "";
      gstRateCode = label.GST_rate_code || "";
      fundIdCode = label?.[0]?.fundIdCode
      fundDocNo = lastData.Ref_no
      const isCompletionAllowed = isCompletionEligible(lastData.Actual_payment_date, lastData.Due_days, lastData.Riceipt_date);
      setCompletedCheckboxEnabled(isCompletionAllowed);

      setFormData({
        ...formData,
        ...lastData,
      });

      checkIfFundIsUsed(lastData.Doc_no)



    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }

  const handleBack = () => {
    navigate('/fundmanagement')
  }

  const handleCheckbox = (e) => {
    const { name, checked } = e.target;
    const value =
      checked ? 1 : 0;

    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };
  const handleGstCode = async (code, Rate, name, gstId) => {

    setGstCode(code);
    setFormData(prev => ({
      ...prev,
      GST_rate_code: code,
      gstid: gstId,
      GST_rate: Rate,
      Purchase_GST_rate: Rate
    }));

    setTimeout(() => {
      drpType.current?.focus();
    }, 0);
  }

  return (
    <>
      <UserAuditInfo
        createdBy={formData.Created_By}
        modifiedBy={formData.Modify_By}
      />

      <div style={{ marginTop: "50px" }}>
        <ActionButtonGroup
          handleAddOne={handleAddOne}
          addOneButtonEnabled={addOneButtonEnabled}
          handleSaveOrUpdate={handleSaveOrUpdate}
          saveButtonEnabled={saveButtonEnabled}
          isEditMode={isEditMode}
          handleEdit={handleEdit}
          editButtonEnabled={editButtonEnabled}
          handleDelete={handleDelete}
          deleteButtonEnabled={deleteButtonEnabled}
          handleCancel={handleCancel}
          cancelButtonEnabled={cancelButtonEnabled}
          handleBack={handleBack}
          backButtonEnabled={backButtonEnabled}
        />

        <NavigationButtons
          handleFirstButtonClick={handleFirstButtonClick}
          handlePreviousButtonClick={handlePreviousButtonClick}
          handleNextButtonClick={handleNextButtonClick}
          handleLastButtonClick={handleLastButtonClick}
          highlightedButton={highlightedButton}
          isEditing={isEditing}
        />
      </div>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          maxWidth: 1400,
          // bgcolor: '#611818ff',
          p: 3,
          borderRadius: 2,
          boxShadow: 3,

          ml: 'auto',
          mr: 'auto'
        }}
      >
        <Grid container spacing={1}  >

          <Box sx={{ p: 2 }}>

            <Paper elevation={2} sx={{ p: 1, borderRadius: 2, mt: -4, ml: -3 }}>
              <Grid container spacing={1} alignItems="center"  >

                <Grid item xs={12} sm={1}>
                  <TextField
                    label="Entry No"
                    name="Doc_no"
                    value={formData.Doc_no}
                    onChange={handleChange}
                    fullWidth
                    size="small"
                    disabled
                    InputLabelProps={{
                      sx: {
                        fontSize: '13px',
                        top: '-6px'
                      }
                    }}
                    InputProps={{
                      sx: {
                        height: '32px',
                        fontSize: '13px',
                        padding: '0 8px'
                      }
                    }}
                  />
                </Grid>


                <Grid item xs={2} sm={1.2}>
                  <TextField
                    label="Entry Date"
                    name="Doc_date"
                    type="date"
                    value={formData.Doc_date}
                    onChange={handleChange}
                    InputLabelProps={{
                      shrink: true,
                      sx: {
                        fontSize: '13px',
                        top: '-6px'
                      }
                    }}
                    InputProps={{
                      sx: {
                        height: '32px', // Reduce height
                        fontSize: '13px',
                        padding: '0 8px'
                      }
                    }}
                    fullWidth
                    size="small"
                    disabled={!isEditing && addOneButtonEnabled}
                  />
                </Grid>


                <Grid item xs={2} sm={1}>
                  <TextField
                    label="Ref No"
                    name="Ref_no"
                    value={formData.Ref_no}
                    onChange={handleChange}
                    fullWidth
                    size="small"
                    disabled
                    InputLabelProps={{
                      shrink: true,
                      sx: {
                        fontSize: '13px',
                        top: '-6px'
                      }
                    }}
                    InputProps={{
                      sx: {
                        height: '32px',
                        fontSize: '13px',
                        padding: '0 8px'
                      }
                    }}
                  />
                </Grid>


                <Grid item xs={2} sm={1.2}>
                  <TextField
                    label="Receipt Date"
                    name="Riceipt_date"
                    type="date"
                    value={formData.Riceipt_date}
                    onChange={handleChange}
                    InputLabelProps={{
                      shrink: true,
                      sx: {
                        fontSize: '13px',
                        top: '-6px'
                      }
                    }}
                    InputProps={{
                      sx: {
                        height: '32px',        // Reduce input height
                        fontSize: '13px',      // Optional: smaller text
                        padding: '0 8px'       // Tight padding
                      }
                    }}
                    fullWidth
                    size="small"
                    disabled={!isEditing && addOneButtonEnabled}
                    inputRef={receiptRef}
                  />
                </Grid>

                <Grid item xs={2} sm={6} sx={{ display: 'flex', alignItems: 'center' }}>

                  <Typography variant="body2" sx={{ fontWeight: "bold", mb: 1 }}>
                    Fund Adj No:
                  </Typography>
                  <FundAdjustmentHelp
                    onFundSelect={handleFundAdjustment}
                    fundIdCode={fundIdCode}
                    fundDocNo={fundDocNo}
                    name="Payment_adjustment_no"
                    disabledField={!isEditing && addOneButtonEnabled}
                    InputProps={{
                      sx: {
                        height: '32px', // Adjust as needed (default ~40px for small)
                        fontSize: '13px'
                      }
                    }}
                    InputLabelProps={{
                      sx: {
                        fontSize: '13px',
                        top: '-6px' // Moves label closer to input
                      }
                    }}
                  />

                </Grid>

                <Grid item xs={12} sm={1.5} mt={1} ml={-50}>
                  <TextField label="Ref Quintal" name="prevQty" value={formData.prevQty} onChange={handleChange} onKeyDown={handleKeyDown} fullWidth size="small" disabled={!isEditing && addOneButtonEnabled} InputProps={{
                    sx: {
                      height: '32px', // Adjust as needed (default ~40px for small)
                      fontSize: '13px'
                    }
                  }}
                    InputLabelProps={{
                      sx: {
                        fontSize: '13px',
                        top: '-6px' // Moves label closer to input
                      }
                    }} />
                </Grid>
                <Grid container alignItems="center" spacing={1} mt={0.5}>
                  <div className="SugarSaleBill-row" style={{ marginTop: "2px" }} >
                    <label htmlFor="Funding_from" className="SugarSaleBillLabel">
                      Bill From :
                    </label>
                    <div >
                      <div >



                        <AccountMasterHelp
                          onAcCodeClick={handleBillfrom}
                          CategoryName={newBillFromName}
                          CategoryCode={newBillFromCode}
                          name="Funding_from"
                          Ac_type={[]}
                          disabledFeild={!isEditing && addOneButtonEnabled}
                        />
                      </div>
                    </div>
                  </div>
                  <Grid item xs={2} sm={1.5} mt={1}>
                    <TextField
                      label="Funding Rate"
                      name="Funding_rate"
                      value={formData.Funding_rate}
                      onChange={handleChange}
                      onKeyDown={handleKeyDown}
                      fullWidth
                      size="small"
                      required
                      error={!!formErrors.Funding_rate}
                      helperText={formErrors.Funding_rate}
                      disabled={!isEditing && addOneButtonEnabled}
                      inputRef={fundingRateRef}
                      InputLabelProps={{
                        shrink: true,
                        sx: {
                          fontSize: '13px',
                          top: '-6px'
                        }
                      }}
                      InputProps={{
                        sx: {
                          height: '32px',
                          fontSize: '13px',
                          padding: '0 8px'
                        }
                      }}
                    />
                  </Grid>


                  <Grid item xs={12} sm={1.5} mt={1}>
                    <TextField
                      label="Quintal"
                      name="Quintal"
                      value={formData.Quintal}
                      onChange={handleChange}
                      onKeyDown={handleKeyDown}
                      fullWidth
                      size="small"
                      required
                      error={!!formErrors.Quintal}
                      helperText={formErrors.Quintal}
                      disabled={!isEditing && addOneButtonEnabled}
                      InputProps={{
                        sx: {
                          height: '32px', // Adjust as needed (default ~40px for small)
                          fontSize: '13px'
                        }
                      }}
                      InputLabelProps={{
                        sx: {
                          fontSize: '13px',
                          top: '-6px' // Moves label closer to input
                        }
                      }}
                    />
                  </Grid>


                  <Grid item xs={12} sm={1.5} mt={1}>
                    <TextField label="Funding Amount" name="Funding_Adjust" value={formData.Funding_Adjust} onChange={handleChange} onKeyDown={handleKeyDown} fullWidth size="small" required error={!!formErrors.Funding_Adjust} helperText={formErrors.Funding_Adjust} disabled={!isEditing && addOneButtonEnabled} InputProps={{
                      sx: {
                        height: '32px', // Adjust as needed (default ~40px for small)
                        fontSize: '13px'
                      }
                    }}
                      InputLabelProps={{
                        sx: {
                          fontSize: '13px',
                          top: '-6px' // Moves label closer to input
                        }
                      }} />
                  </Grid>


                </Grid>

              </Grid>
            </Paper>
          </Box>
          {/* Funding From Label + Help Component */}

        </Grid>





        <Grid container spacing={2}   >
          <Grid container spacing={2} sx={{ mt: -1 }} >
            <Grid item xs={12} md={6}  >
              <Paper elevation={3} sx={{ p: 2, borderRadius: 2, bgcolor: '#fff' }}>
                <Grid container spacing={2}>


                  <Grid item xs={2} sm={10} sx={{ display: 'flex', alignItems: 'center' }}>

                    <Typography variant="body2" sx={{ fontWeight: "bold", mb: 1, }}>
                      Bill To:
                    </Typography>
                    <AccountMasterHelp
                      onAcCodeClick={handleBillTO}
                      CategoryName={newBilltoName}
                      CategoryCode={newBilltoCode}
                      name="Bill_to"
                      Ac_type={[]}
                      disabledFeild={!isEditing && addOneButtonEnabled}
                    />

                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField label="Bill Rate" name="Bill_rate" value={formData.Bill_rate} onChange={handleChange} onKeyDown={handleKeyDown} fullWidth size="small" disabled={!isEditing && addOneButtonEnabled} InputProps={{
                      sx: {
                        height: '32px', // Adjust as needed (default ~40px for small)
                        fontSize: '13px'
                      }
                    }}
                      InputLabelProps={{
                        sx: {
                          fontSize: '13px',
                          top: '-6px' // Moves label closer to input
                        }
                      }} />
                  </Grid>



                  <Grid item xs={12} sm={3}>
                    <TextField label="Receipt Amount" name="Riceipt_amount" value={formatReadableAmount(formData.Riceipt_amount)} onChange={handleChange} onKeyDown={handleKeyDown} fullWidth size="small" required error={!!formErrors.Riceipt_amount} helperText={formErrors.Riceipt_amount} disabled={!isEditing && addOneButtonEnabled} InputProps={{
                      sx: {
                        height: '32px', // Adjust as needed (default ~40px for small)
                        fontSize: '13px'
                      }
                    }}
                      InputLabelProps={{
                        sx: {
                          fontSize: '13px',
                          top: '-6px' // Moves label closer to input
                        }
                      }} />
                  </Grid>

                  <Grid item xs={12} sm={3}>
                    <TextField label="Due Days" name="Due_days" value={formData.Due_days} onChange={handleChange} onKeyDown={handleKeyDown} fullWidth size="small" disabled={!isEditing && addOneButtonEnabled} InputProps={{
                      sx: {
                        height: '32px', // Adjust as needed (default ~40px for small)
                        fontSize: '13px'
                      }
                    }}
                      InputLabelProps={{
                        sx: {
                          fontSize: '13px',
                          top: '-6px' // Moves label closer to input
                        }
                      }} />
                    <Typography variant="caption">
                      Due Date: {calculatedDueDate(formData.Riceipt_date, formData.Due_days)}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={3}>
                    <TextField label="Interest Rate" name="Interest_rate" value={formData.Interest_rate} onChange={handleChange} onKeyDown={handleKeyDown} fullWidth size="small" required error={!!formErrors.Interest_rate} helperText={formErrors.Interest_rate} disabled={!isEditing && addOneButtonEnabled} InputProps={{
                      sx: {
                        height: '32px', // Adjust as needed (default ~40px for small)
                        fontSize: '13px'
                      }
                    }}
                      InputLabelProps={{
                        sx: {
                          fontSize: '13px',
                          top: '-6px' // Moves label closer to input
                        }
                      }} />
                  </Grid>

                  <Grid item xs={12} sm={3}>
                    <TextField label="Interest Amount" name="Interest_amount" value={formatReadableAmount(formData.Interest_amount)} onChange={handleChange} onKeyDown={handleKeyDown} fullWidth size="small" disabled={!isEditing && addOneButtonEnabled} InputProps={{
                      sx: {
                        height: '32px', // Adjust as needed (default ~40px for small)
                        fontSize: '13px'
                      }
                    }}
                      InputLabelProps={{
                        sx: {
                          fontSize: '13px',
                          top: '-6px' // Moves label closer to input
                        }
                      }} />
                  </Grid>

                  <Grid item xs={12} sm={6} mt={-2}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', mr: 20 }}>
                      GST Code:
                    </Typography>
                    <GSTRateMasterHelp
                      name="GST_rate_code"
                      onAcCodeClick={handleGstCode}
                      GstRateName={gstName}
                      GstRateCode={gstRateCode}
                      disabledFeild={!isEditing && addOneButtonEnabled}
                    />
                  </Grid>

                  <Grid item xs={12} sm={3}>
                    <TextField label="GST Rate" name="GST_rate" value={formData.GST_rate} InputProps={{ readOnly: true }} onChange={handleChange} onKeyDown={handleKeyDown} inputRef={drpType} fullWidth size="small" disabled={!isEditing && addOneButtonEnabled}
                      InputPropss={{
                        sx: {
                          height: '32px', // Adjust as needed (default ~40px for small)
                          fontSize: '13px'
                        }
                      }}
                      InputLabelProps={{
                        sx: {
                          fontSize: '13px',
                          top: '-6px' // Moves label closer to input
                        }
                      }} />
                  </Grid>

                  <Grid item xs={12} sm={3}>
                    <TextField label="GST Amount" name="GST_amount" value={formatReadableAmount(formData.GST_amount)} onChange={handleChange} onKeyDown={handleKeyDown} fullWidth size="small" disabled={!isEditing && addOneButtonEnabled} InputProps={{
                      sx: {
                        height: '32px', // Adjust as needed (default ~40px for small)
                        fontSize: '13px'
                      }
                    }}
                      InputLabelProps={{
                        sx: {
                          fontSize: '13px',
                          top: '-6px' // Moves label closer to input
                        }
                      }} />
                  </Grid>

                  <Grid item xs={12} sm={3}>
                    <TextField label="Bill Amount" name="Bill_amount" value={formatReadableAmount(formData.Bill_amount)} onChange={handleChange} onKeyDown={handleKeyDown} fullWidth size="small" disabled={!isEditing && addOneButtonEnabled} InputProps={{
                      sx: {
                        height: '32px', // Adjust as needed (default ~40px for small)
                        fontSize: '13px'
                      }
                    }}
                      InputLabelProps={{
                        sx: {
                          fontSize: '13px',
                          top: '-6px' // Moves label closer to input
                        }
                      }} />
                  </Grid>

                  <Grid item xs={12} sm={3}>
                    <TextField label="TDS Rate" name="TDS_rate" value={formData.TDS_rate} onChange={handleChange} onKeyDown={handleKeyDown} fullWidth size="small" disabled={!isEditing && addOneButtonEnabled} InputProps={{
                      sx: {
                        height: '32px', // Adjust as needed (default ~40px for small)
                        fontSize: '13px'
                      }
                    }}
                      InputLabelProps={{
                        sx: {
                          fontSize: '13px',
                          top: '-6px' // Moves label closer to input
                        }
                      }} />
                  </Grid>

                  <Grid item xs={12} sm={3}>
                    <TextField label="TDS Amount" name="TDS_amount" value={formatReadableAmount(formData.TDS_amount)} onChange={handleChange} onKeyDown={handleKeyDown} fullWidth size="small" disabled={!isEditing && addOneButtonEnabled} InputProps={{
                      sx: {
                        height: '32px', // Adjust as needed (default ~40px for small)
                        fontSize: '13px'
                      }
                    }}
                      InputLabelProps={{
                        sx: {
                          fontSize: '13px',
                          top: '-6px' // Moves label closer to input
                        }
                      }} />
                  </Grid>

                  <Grid item xs={12} sm={3}>
                    <TextField label="Total Amount" name="Total_amount" value={formatReadableAmount(formData.Total_amount)} onChange={handleChange} onKeyDown={handleKeyDown} fullWidth size="small" disabled={!isEditing && addOneButtonEnabled} InputProps={{
                      sx: {
                        height: '32px', // Adjust as needed (default ~40px for small)
                        fontSize: '13px'
                      }
                    }}
                      InputLabelProps={{
                        sx: {
                          fontSize: '13px',
                          top: '-6px' // Moves label closer to input
                        }
                      }} />
                  </Grid>

                  <Grid item xs={12} sm={3}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.Is_completed}
                          onChange={handleChange}
                          onKeyDown={handleKeyDown}
                          name="Is_completed"
                          disabled={!completedCheckboxEnabled || (!isEditing && addOneButtonEnabled)}
                        />
                      }
                      label="Is Completed"
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>


          <Grid container justifyContent="center" sx={{ mt: -37.5, ml: -4.5 }}>
            <Grid item xs={12} ml={90}  >
              <Paper elevation={3} sx={{ p: 2, bgcolor: '#fff' }}>
                <Grid container spacing={2}>

                  <Grid item xs={2} sm={10} sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Purc Bill To:</Typography>
                    <AccountMasterHelp
                      onAcCodeClick={hamdelPurcBillTo}
                      CategoryName={newPurcBillToName}
                      CategoryCode={newPurcBillToCode || formData.PurcBillTo}
                      name="PurcBillTo"
                      Ac_type={[]}
                      disabledFeild={!isEditing && addOneButtonEnabled}
                    />
                  </Grid>

                  {/* Fields in 2-column layout */}
                  <Grid item xs={12} sm={3}>
                    <TextField size="small" label="Purchase Rate" name="Purchase_rate" value={formData.Purchase_rate} onChange={handleChange} onKeyDown={handleKeyDown} fullWidth disabled={!isEditing && addOneButtonEnabled} InputProps={{
                      sx: {
                        height: '32px', // Adjust as needed (default ~40px for small)
                        fontSize: '13px'
                      }
                    }}
                      InputLabelProps={{
                        sx: {
                          fontSize: '13px',
                          top: '-6px' // Moves label closer to input
                        }
                      }} />
                  </Grid>

                  <Grid item xs={12} sm={3}>
                    <TextField size="small" label="Purchase Tax Amount" name="Purchase_taxable_amount" value={formatReadableAmount(formData.Purchase_taxable_amount)} onChange={handleChange} onKeyDown={handleKeyDown} fullWidth disabled={!isEditing && addOneButtonEnabled} InputProps={{
                      sx: {
                        height: '32px', // Adjust as needed (default ~40px for small)
                        fontSize: '13px'
                      }
                    }}
                      InputLabelProps={{
                        sx: {
                          fontSize: '13px',
                          top: '-6px' // Moves label closer to input
                        }
                      }} />
                  </Grid>

                  <Grid item xs={12} sm={3}>
                    <TextField size="small" label="Purchase GST Rate" name="Purchase_GST_rate" value={formData.Purchase_GST_rate} onChange={handleChange} onKeyDown={handleKeyDown} fullWidth disabled={!isEditing && addOneButtonEnabled} InputProps={{
                      sx: {
                        height: '32px', // Adjust as needed (default ~40px for small)
                        fontSize: '13px'
                      }
                    }}
                      InputLabelProps={{
                        sx: {
                          fontSize: '13px',
                          top: '-6px' // Moves label closer to input
                        }
                      }} />
                  </Grid>

                  <Grid item xs={12} sm={3}>
                    <TextField size="small" label="Purchase GST Amount" name="Purchase_GST_amount" value={formData.Purchase_GST_amount} onChange={handleChange} onKeyDown={handleKeyDown} fullWidth disabled={!isEditing && addOneButtonEnabled} InputProps={{
                      sx: {
                        height: '32px', // Adjust as needed (default ~40px for small)
                        fontSize: '13px'
                      }
                    }}
                      InputLabelProps={{
                        sx: {
                          fontSize: '13px',
                          top: '-6px' // Moves label closer to input
                        }
                      }} />
                  </Grid>

                  <Grid item xs={12} sm={3}>
                    <TextField size="small" label="Purchase Bill Amount" name="Purchase_bill_amount" value={formatReadableAmount(formData.Purchase_bill_amount)} onChange={handleChange} onKeyDown={handleKeyDown} fullWidth disabled={!isEditing && addOneButtonEnabled} InputProps={{
                      sx: {
                        height: '32px', // Adjust as needed (default ~40px for small)
                        fontSize: '13px'
                      }
                    }}
                      InputLabelProps={{
                        sx: {
                          fontSize: '13px',
                          top: '-6px' // Moves label closer to input
                        }
                      }} />
                  </Grid>

                  <Grid item xs={12} sm={3}>
                    <TextField size="small" label="Purchase TDS Rate" name="Purchase_TDS_rate" value={formData.Purchase_TDS_rate} onChange={handleChange} onKeyDown={handleKeyDown} fullWidth disabled={!isEditing && addOneButtonEnabled} InputProps={{
                      sx: {
                        height: '32px', // Adjust as needed (default ~40px for small)
                        fontSize: '13px'
                      }
                    }}
                      InputLabelProps={{
                        sx: {
                          fontSize: '13px',
                          top: '-6px' // Moves label closer to input
                        }
                      }} />
                  </Grid>

                  <Grid item xs={12} sm={3}>
                    <TextField size="small" label="Purchase TDS Amount" name="Purchase_TDS_amount" value={formatReadableAmount(formData.Purchase_TDS_amount)} onChange={handleChange} onKeyDown={handleKeyDown} fullWidth disabled={!isEditing && addOneButtonEnabled} InputProps={{
                      sx: {
                        height: '32px', // Adjust as needed (default ~40px for small)
                        fontSize: '13px'
                      }
                    }}
                      InputLabelProps={{
                        sx: {
                          fontSize: '13px',
                          top: '-6px' // Moves label closer to input
                        }
                      }} />
                  </Grid>

                  <Grid item xs={12} sm={3}>
                    <TextField size="small" label="Net Payable Amount" name="Net_payable_amount" value={formatReadableAmount(formData.Net_payable_amount)} onChange={handleChange} onKeyDown={handleKeyDown} fullWidth disabled={!isEditing && addOneButtonEnabled} InputProps={{
                      sx: {
                        height: '32px', // Adjust as needed (default ~40px for small)
                        fontSize: '13px'
                      }
                    }}
                      InputLabelProps={{
                        sx: {
                          fontSize: '13px',
                          top: '-6px' // Moves label closer to input
                        }
                      }} />
                  </Grid>

                  <Grid item xs={12} sm={3}>
                    <TextField
                      size="small"
                      type="date"
                      label="Actual Payment Date"
                      name="Actual_payment_date"
                      value={formData.Actual_payment_date || calculatedDueDate(formData.Riceipt_date, formData.Due_days)}
                      onChange={handleChange}
                      onKeyDown={handleKeyDown}
                      InputLabelProps={{
                        shrink: true,
                        sx: {
                          fontSize: '13px',
                          top: '-6px'
                        }
                      }}
                      InputProps={{
                        sx: {
                          height: '32px',
                          fontSize: '13px',
                          padding: '0 8px'
                        }
                      }}
                      fullWidth
                      disabled={!isEditing && addOneButtonEnabled || isUsedAsRef}
                    />
                  </Grid>


                  <Grid item xs={12} sm={3}>
                    <TextField size="small" label="Advance Amount" name="Advance_amount" value={formatReadableAmount(formData.Advance_amount)} onChange={handleChange} onKeyDown={handleKeyDown} fullWidth disabled={!isEditing && addOneButtonEnabled} InputProps={{
                      sx: {
                        height: '32px', // Adjust as needed (default ~40px for small)
                        fontSize: '13px'
                      }
                    }}
                      InputLabelProps={{
                        sx: {
                          fontSize: '13px',
                          top: '-6px' // Moves label closer to input
                        }
                      }} />
                  </Grid>





                  <Grid item xs={12} sm={3}>
                    <TextField size="small" label="Interest Adj Rate" name="Interest_adjusted_rate" value={formData.Interest_adjusted_rate} onChange={handleChange} onKeyDown={handleKeyDown} fullWidth disabled={!isEditing && addOneButtonEnabled} InputProps={{
                      sx: {
                        height: '32px', // Adjust as needed (default ~40px for small)
                        fontSize: '13px'
                      }
                    }}
                      InputLabelProps={{
                        sx: {
                          fontSize: '13px',
                          top: '-6px' // Moves label closer to input
                        }
                      }} />
                  </Grid>

                  <Grid item xs={12} sm={3}>
                    <TextField size="small" label="Payment Adj Amount" name="Payment_adjustment_amount" value={formatReadableAmount(formData.Payment_adjustment_amount)} onChange={handleChange} onKeyDown={handleKeyDown} fullWidth disabled={!isEditing && addOneButtonEnabled} InputProps={{
                      sx: {
                        height: '32px', // Adjust as needed (default ~40px for small)
                        fontSize: '13px'
                      }
                    }}
                      InputLabelProps={{
                        sx: {
                          fontSize: '13px',
                          top: '-6px' // Moves label closer to input
                        }
                      }} />
                  </Grid>

                  <Grid item xs={12} sm={3}>
                    <TextField size="small" label="Less Rate" name="less_rate" value={formData.less_rate} onChange={handleChange} onKeyDown={handleKeyDown} fullWidth disabled={!isEditing && addOneButtonEnabled} InputProps={{
                      sx: {
                        height: '32px', // Adjust as needed (default ~40px for small)
                        fontSize: '13px'
                      }
                    }}
                      InputLabelProps={{
                        sx: {
                          fontSize: '13px',
                          top: '-6px' // Moves label closer to input
                        }
                      }} />
                  </Grid>

                  <Grid item xs={12} sm={3}>
                    <TextField size="small" label="Actual Payment Amount" name="Actual_payment_amount" value={formatReadableAmount(formData.Actual_payment_amount)} onChange={handleChange} onKeyDown={handleKeyDown} fullWidth disabled={!isEditing && addOneButtonEnabled} InputProps={{
                      sx: {
                        height: '32px', // Adjust as needed (default ~40px for small)
                        fontSize: '13px'
                      }
                    }}
                      InputLabelProps={{
                        sx: {
                          fontSize: '13px',
                          top: '-6px' // Moves label closer to input
                        }
                      }} />
                  </Grid>

                  <Grid item xs={12} sm={3}>
                    <TextField size="small" label="Other Amount" name="Other_amount" value={formData.Other_amount} onChange={handleChange} onKeyDown={handleKeyDown} fullWidth disabled={!isEditing && addOneButtonEnabled} InputProps={{
                      sx: {
                        height: '32px', // Adjust as needed (default ~40px for small)
                        fontSize: '13px'
                      }
                    }}
                      InputLabelProps={{
                        sx: {
                          fontSize: '13px',
                          top: '-6px' // Moves label closer to input
                        }
                      }} />
                  </Grid>

                  <Grid item xs={9}>
                    <TextField
                      multiline
                      minRows={2}
                      fullWidth
                      label="Narration"
                      name="Remark"
                      value={formData.Remark}
                      onChange={handleChange}
                      disabled={!isEditing && addOneButtonEnabled}
                      InputProps={{
                        sx: {
                          height: '32px', // Adjust as needed (default ~40px for small)
                          fontSize: '13px'
                        }
                      }}
                      InputLabelProps={{
                        sx: {
                          fontSize: '13px',
                          top: '-6px' // Moves label closer to input
                        }
                      }}
                    />
                  </Grid>


                </Grid>
              </Paper>
            </Grid>
          </Grid>

        </Grid>
      </Box>
    </>

  );
}
export default FundForm
