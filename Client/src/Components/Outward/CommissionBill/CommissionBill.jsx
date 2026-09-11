import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ActionButtonGroup from "../../../Common/CommonButtons/ActionButtonGroup";
import NavigationButtons from "../../../Common/CommonButtons/NavigationButtons";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import { useRecordLocking } from "../../../hooks/useRecordLocking";
import "react-toastify/dist/ReactToastify.css";
import AccountMasterHelp from "../../../Helper/AccountMasterHelp";
import ItemMasterHelp from "../../../Helper/SystemmasterHelp";
import GSTRateMasterHelp from "../../../Helper/GSTRateMasterHelp";
import "../CommissionBill/CommissionBill.css";
import Swal from "sweetalert2";
import { TextField, MenuItem, Select, Grid, InputLabel, FormControl, Dialog, DialogTitle, DialogContent, IconButton, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import UserAuditInfo from "../../../Common/UserAuditInfo/UserAuditInfo";
import SaveUpdateSpinner from "../../../Common/Spinners/SaveUpdateSpinner";
import VoucherReport from "./VoucherReport";
import EInvoiceGeneration from "../../../Common/EwaybillNEInvoice/EInvoiceGenerationProcess/EInvoiceGeneration";
import { OutwordPostDateRecordLock } from "../../../Common/PostDateLock/PostDateRangeCheck"
import { validateDocumentDate } from "../../../Common/ValidateDateRange/ValidateDateRange"

const API_URL = process.env.REACT_APP_API;

let SupplierName = "";
let newac_code = "";
let UnitName = "";
let newunit_code = "";
let BrokerName = "";
let newbroker_code = "";
let TransportName = "";
let newtransport_code = "";
let GstRateName = "";
let newgst_code = "";
let MillName = "";
let newmill_code = "";
let newnarration1 = "";
let newnarration2 = "";
let ItemName = "";
let newitem_code = "";
let TdsName = "";
let newTDS_Ac = "";

const CommissionBill = () => {
  const companyCode = sessionStorage.getItem("Company_Code");
  const Year_Code = sessionStorage.getItem("Year_Code");
  const Outword_Date = sessionStorage.getItem("Outword_Date")
  const Post_Date = sessionStorage.getItem("Post_Date")
  const username = sessionStorage.getItem("username");
  const User_Id = sessionStorage.getItem("User_ID");
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
  const [accountCode, setAccountCode] = useState("");
  const [supplier, setSupplier] = useState();
  const [Unit, setUnit] = useState();
  const [broker, setBroker] = useState();
  const [mill, setMill] = useState();
  const [transport, setTransport] = useState();
  const [TDS, setTDS] = useState();
  const [GstRateCode, setGstRateCode] = useState();
  const [GstRate, setGstRate] = useState();
  const [item, setItem] = useState();
  const [supplierGSTStateCode, setSupplierGSTStateCode] = useState();
  const [matchStatus, setMatchStatus] = useState(null);
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate();
  const [isOpenEInvoice, setIsOpenEInvoice] = useState(false);

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const selectedRecord = location.state?.selectedRecord;


  const selectedfilter = location.state?.tranType;
  const [tranType, setTranType] = useState(selectedfilter);

  const selectedVoucherNo = searchParams.get('selectedVoucherNo');
  const selectedVoucherType = searchParams.get('selectedVoucherType');

  const permissions = location.state?.permissionsData;

  const TranTypeInputRef = useRef(null);

  const initialFormData = {
    doc_no: "",
    doc_date: new Date().toISOString().split("T")[0],
    link_no: 0,
    link_type: "",
    link_id: 0,
    ac_code: 0,
    unit_code: 0,
    broker_code: 2,
    qntl: 0,
    packing: 50,
    bags: 0,
    grade: "",
    transport_code: 0,
    mill_rate: 0.0,
    sale_rate: 0.0,
    purc_rate: 0.0,
    commission_amount: 0.0,
    resale_rate: 0.0,
    resale_commission: 0.0,
    misc_amount: 0.0,
    texable_amount: 0.0,
    gst_code: 1,
    cgst_rate: 0.0,
    cgst_amount: 0.0,
    sgst_rate: 0.0,
    sgst_amount: 0.0,
    igst_rate: 0.0,
    igst_amount: 0.0,
    bill_amount: 0.0,
    Company_Code: companyCode,
    Year_Code: Year_Code,
    Branch_Code: 0,
    Created_By: "",
    Modified_By: "",
    ac: 0,
    uc: 0,
    bc: 0,
    tc: 0,
    mill_code: 0,
    mc: 0,
    narration1: "",
    narration2: "",
    narration3: "",
    narration4: "",
    TCS_Rate: 0.0,
    TCS_Amt: 0.0,
    TCS_Net_Payable: 0.0,
    BANK_COMMISSION: 0.0,
    HSN: "",
    einvoiceno: "",
    ackno: 0,
    item_code: 1,
    ic: 0,
    Tran_Type: tranType,
    Frieght_Rate: 0.0,
    Frieght_amt: 0.0,
    subtotal: 0.0,
    IsTDS: "Y",
    TDS_Ac: 0,
    TDS_Per: 0.0,
    TDSAmount: 0.0,
    TDS: 0.0,
    ta: 0,
    QRCode: "",
  };

  const [formData, setFormData] = useState(initialFormData);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "TDS") {
      setFormData({
        ...formData,
        [name]: value,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  //Using the useRecordLocking to manage the multiple user cannot edit the same record at a time.
  const { isRecordLockedByUser, lockRecord, unlockRecord } = useRecordLocking(
    formData.doc_no,
    tranType || selectedVoucherType,
    companyCode,
    Year_Code,
    "commission_bill"
  );

  const validateNumericInput = (e) => {
    e.target.value = e.target.value.replace(/[^0-9.-]/g, "");
  };

  const handleSelectKeyDown = (event, field) => {
    const options = {
      IsTDS: ["Y", "N"],
      Tran_Type: ["LV", "CV"],
    };

    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      const currentOptions = options[field];
      const currentIndex = currentOptions.indexOf(formData[field]);
      const nextIndex =
        event.key === "ArrowUp"
          ? (currentIndex - 1 + currentOptions.length) % currentOptions.length
          : (currentIndex + 1) % currentOptions.length;
      setFormData({ ...formData, [field]: currentOptions[nextIndex] });
    }
  };

  const handleDateChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const checkMatchStatus = async (ac_code, company_code, year_code) => {
    try {
      const { data } = await axios.get(
        `${process.env.REACT_APP_API}/get_match_status`,
        {
          params: {
            Ac_Code: ac_code,
            Company_Code: company_code,
            Year_Code: year_code,
          },
        }
      );
      return data.match_status;
    } catch (error) {
      console.error("Couldn't able to match GST State Code:", error);
      return error;
    }
  };

  const handleAcCode = async (code, accoid) => {
    setSupplier(code);
    try {
      const matchStatus = await checkMatchStatus(code, companyCode, Year_Code);
      const match = matchStatus === "TRUE";
      const rate = parseFloat(GstRate) || 0;
      let newFormData = {
        ...formData,
        ac_code: code,
        ac: accoid,
        gst_code: formData.gst_code,
        cgst_rate: match ? rate / 2 : 0,
        sgst_rate: match ? rate / 2 : 0,
        igst_rate: match ? 0 : rate,
      };

      setMatchStatus(match);
      setFormData(newFormData);
      calculateAndSetGSTAmounts(newFormData);
    } catch (error) {
      console.error("Error in handleAcCode:", error);
      toast.error("Failed to update account code details.");
    }
  };
  const calculateAndSetGSTAmounts = async (formData) => {
    const taxableAmount = parseFloat(formData.texable_amount) || 0;
    const cgstAmount = (taxableAmount * formData.cgst_rate) / 100;
    const sgstAmount = (taxableAmount * formData.sgst_rate) / 100;
    const igstAmount = (taxableAmount * formData.igst_rate) / 100;

    const updatedFormData = {
      ...formData,
      cgst_amount: cgstAmount,
      sgst_amount: sgstAmount,
      igst_amount: igstAmount,
    };
    setFormData(updatedFormData);
  };

  const handleUnitCode = (code, accoid) => {
    setUnit(code);
    setFormData((prevState) => ({
      ...prevState,
      unit_code: code,
      uc: accoid,
    }));
  };

  const handleBrokerCode = (code, accoid) => {
    setBroker(code);
    setFormData((prevState) => ({
      ...prevState,
      broker_code: code,
      bc: accoid,
    }));
  };

  const handleTransportCode = (code, accoid) => {
    setTransport(code);
    setFormData((prevState) => ({
      ...prevState,
      transport_code: code,
      tc: accoid,
    }));
  };

  const handleGSTCode = async (code, Rate) => {
    const rate = parseFloat(Rate) || 0;

    try {
      const sameState = await checkMatchStatus(
        formData.ac_code,
        companyCode,
        Year_Code
      );

      const newFormData = {
        ...formData,
        gst_code: code,
        cgst_rate: sameState ? rate / 2 : 0,
        sgst_rate: sameState ? rate / 2 : 0,
        igst_rate: sameState ? 0 : rate,
      };

      setGstRateCode(code);
      setGstRate(rate);
      setFormData(newFormData);
      calculateAndSetGSTAmounts(newFormData);
    } catch (error) {
      console.error("Error handling GST Code change:", error);
      toast.error("Failed to update GST details. Please try again.");
    }
  };

  const handleMillCode = (code, accoid) => {
    setFormData((prevState) => ({
      ...prevState,
      mill_code: code,
      mc: accoid,
    }));
  };

  const handleNarration1 = (code) => {
    setAccountCode(code);
    setFormData((prevState) => ({
      ...prevState,
      narration1: code,
    }));
  };

  const handleNarration2 = (code) => {
    setAccountCode(code);
    setFormData((prevState) => ({
      ...prevState,
      narration2: code,
    }));
  };

  const handleItemCode = (code, accoid, HSN) => {
    setItem(code);
    setFormData((prevState) => ({
      ...prevState,
      item_code: code,
      ic: accoid,
      HSN: HSN,
    }));
  };

  const handleTDSAc = (code, accoid) => {
    setTDS(code);
    setFormData((prevState) => ({
      ...prevState,
      TDS_Ac: code,
      ta: accoid,
    }));
  };


  //calculations
  const calculateBags = (qntl, packing) => {
    return  Math.round((qntl / packing) * 100);
  };

  const calculateFreight = (freightRate, qntl) => {
    return freightRate * qntl;
  };

  const calculateRDiffTenderRate = (saleRate, millRate, purchaseRate) => {
    if (purchaseRate > 0) {
      return millRate - purchaseRate;
    }
    return saleRate - millRate;
  };

  const calculateTenderDiffRateAmount = (rDiffTenderRate, qntl) => {
    return rDiffTenderRate * qntl;
  };

  const calculateResaleRate = (resale_commission, qntl) => {
    return resale_commission * qntl;
  };

  const calculateSubtotal = (rDiffTenderRate, qntl, resale_rate) => {
    return rDiffTenderRate * qntl + resale_rate;
  };

  const calculateTaxable = (subtotal, freight) => {
    return subtotal + freight;
  };

  const calculateCGSTAmount = (taxable, cgstRate) => {
    return (taxable * cgstRate) / 100;
  };

  const calculateSGSTAmount = (taxable, sgstRate) => {
    return (taxable * sgstRate) / 100;
  };

  const calculateIGSTAmount = (taxable, igstRate) => {
    return (taxable * igstRate) / 100;
  };

  const calculateBillAmount = (
    taxable,
    cgstAmount,
    sgstAmount,
    igstAmount,
    bankCommission,
    misc_Amount
  ) => {
    return (
      taxable +
      cgstAmount +
      sgstAmount +
      igstAmount +
      bankCommission +
      misc_Amount
    );
  };

  const calculateTCSAmount = (billAmount, tcsRate) => {
    return (billAmount * tcsRate) / 100;
  };

  const calculateTDSAmount = (taxable, tdsRate) => {
    return Math.round((taxable * tdsRate) / 100);
  };

  const calculateNetPayable = (billAmount, tcsAmount, hasTCS) => {
    if (hasTCS) {
      return billAmount + tcsAmount;
    }
    return billAmount;
  };

  const handleKeyDownCalculations = async (event) => {
    if (event.key === "Tab") {
      const { name, value } = event.target;
      let newFormData = { ...formData };

      // Check if states match for GST calculations
      const sameState = await checkMatchStatus(
        formData.ac_code,
        companyCode,
        Year_Code
      );
      const parseNumber = (num) => parseFloat(num) || 0;
      if (
        [
          "Frieght_Rate",
          "qntl",
          "sale_rate",
          "texable_amount",
          "mill_rate",
          "resale_commission",
          "BANK_COMMISSION",
          "misc_amount",
          "packing",
          "purc_rate",
        ].includes(name)
      ) {
        const freightRate = parseNumber(formData.Frieght_Rate);
        const qntl = parseNumber(formData.qntl);
        const saleRate = parseNumber(formData.sale_rate);
        const millRate = parseNumber(formData.mill_rate);
        const resaleCommission = parseNumber(formData.resale_commission);
        const bankCommission = parseNumber(formData.BANK_COMMISSION);
        const miscAmount = parseNumber(formData.misc_amount);
        const purcRate = parseNumber(formData.purc_rate);


        const rDiffTenderRate = calculateRDiffTenderRate(
          saleRate,
          millRate,
          purcRate
        );
        const tenderDiffRate = calculateTenderDiffRateAmount(
          rDiffTenderRate,
          qntl
        );
        const packing = parseInt(formData.packing) || 0;
        const bag = calculateBags(qntl, packing);
        const freightAmt = calculateFreight(freightRate, qntl);
        const resaleRate = calculateResaleRate(resaleCommission, qntl);
        const subtotal = calculateSubtotal(rDiffTenderRate, qntl, resaleRate);
        const taxable = calculateTaxable(subtotal, freightAmt);

        const tdsBase = parseNumber(formData.TDS) || taxable;

        const cgstRate = parseNumber(formData.cgst_rate);
        const sgstRate = parseNumber(formData.sgst_rate);
        const igstRate = parseNumber(formData.igst_rate);

        const cgstAmount = sameState
          ? calculateCGSTAmount(taxable, cgstRate)
          : 0;
        const sgstAmount = sameState
          ? calculateSGSTAmount(taxable, sgstRate)
          : 0;
        const igstAmount = !sameState
          ? calculateIGSTAmount(taxable, igstRate)
          : 0;

        const billAmount = calculateBillAmount(
          taxable,
          cgstAmount,
          sgstAmount,
          igstAmount,
          bankCommission,
          miscAmount
        );

        const tcsRate =
          formData.IsTDS === "N" ? parseNumber(formData.TCS_Rate) : 0;
        const tcsAmount =
          formData.IsTDS === "N" ? calculateTCSAmount(billAmount, tcsRate) : 0;
        let tdsAmount = 0;
        const tdsRate =
          formData.IsTDS === "Y" ? parseNumber(formData.TDS_Per) : 0;
        if (formData.IsTDS === "Y" && tdsBase > 0 && tdsRate > 0) {
          tdsAmount = calculateTDSAmount(tdsBase, tdsRate);
        }

        const hasTCS = tcsAmount > 0;
        const netPayable = calculateNetPayable(billAmount, tcsAmount, hasTCS);

        newFormData = {
          ...newFormData,
          bags: bag,
          Frieght_amt: freightAmt,
          commission_amount: rDiffTenderRate,
          resale_rate: resaleRate,
          subtotal: subtotal,
          texable_amount: taxable,
          cgst_amount: cgstAmount,
          sgst_amount: sgstAmount,
          igst_amount: igstAmount,
          bill_amount: billAmount,
          TCS_Amt: tcsAmount,
          TCS_Net_Payable: netPayable,
          TDS: tdsBase,
          TDSAmount: tdsAmount,
          sale_rate: purcRate > 0 ? 0 : saleRate,
        };
      }

      // Perform GST-specific calculations
      if (
        [
          "cgst_rate",
          "sgst_rate",
          "texable_amount",
          "cgst_amount",
          "sgst_amount",
          "TCS_Rate",
          "bill_amount",
          "TDS_Per",
          "igst_rate",
          "BANK_COMMISSION",
          "misc_amount",
        ].includes(name)
      ) {
        const cgstRate = parseNumber(formData.cgst_rate);
        const sgstRate = parseNumber(formData.sgst_rate);
        const igstRate = parseNumber(formData.igst_rate);
        const taxable = parseNumber(formData.texable_amount);
        const tdsBase = parseNumber(formData.TDS) || taxable;


        const cgstAmount = sameState
          ? calculateCGSTAmount(taxable, cgstRate)
          : 0;
        const sgstAmount = sameState
          ? calculateSGSTAmount(taxable, sgstRate)
          : 0;
        const igstAmount = !sameState
          ? calculateIGSTAmount(taxable, igstRate)
          : 0;

        const bankCommission = parseNumber(formData.BANK_COMMISSION);
        const miscAmount = parseNumber(formData.misc_amount);

        const billAmount = calculateBillAmount(
          taxable,
          cgstAmount,
          sgstAmount,
          igstAmount,
          bankCommission,
          miscAmount
        );

        const tcsRate =
          formData.IsTDS === "N" ? parseNumber(formData.TCS_Rate) : 0;
        const tcsAmount =
          formData.IsTDS === "N" ? calculateTCSAmount(billAmount, tcsRate) : 0;

        let tdsAmount = 0;
        const tdsRate =
          formData.IsTDS === "Y" ? parseNumber(formData.TDS_Per) : 0;
        if (formData.IsTDS === "Y" && tdsBase > 0 && tdsRate > 0) {
          tdsAmount = calculateTDSAmount(tdsBase, tdsRate);
        }

        const hasTCS = tcsAmount > 0;
        const netPayable = calculateNetPayable(billAmount, tcsAmount, hasTCS);

        newFormData = {
          ...newFormData,
          cgst_rate: cgstRate,
          cgst_amount: cgstAmount,
          sgst_rate: sgstRate,
          sgst_amount: sgstAmount,
          igst_rate: igstRate,
          igst_amount: igstAmount,
          bill_amount: billAmount,
          TCS_Amt: tcsAmount,
          TCS_Net_Payable: netPayable,
          TDS: tdsBase,
          TDSAmount: tdsAmount,

        };

        await calculateAndSetGSTAmounts(newFormData);
      }

      setFormData(newFormData);
    }
  };

  const fetchLastRecord = (tranType) => {
    fetch(
      `${API_URL}/get-next-doc-no-commissionBill?Company_Code=${companyCode}&Year_Code=${Year_Code}&Tran_Type=${tranType || selectedVoucherType
      }`
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch last record");
        }
        return response.json();
      })
      .then((data) => {
        setFormData((prevState) => ({
          ...prevState,
          doc_no: data.next_doc_no,
        }));
      })
      .catch((error) => {
        console.error("Error fetching last record:", error);
      });
  };

  const fetchItemCode = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/system_master_help?CompanyCode=${companyCode}&SystemType=I`
      );
      const data = response.data;
      const item = data.find((item) => item.Category_Code === 1);
      return item
        ? {
          code: item.Category_Code,
          accoid: item.accoid,
          label: item.Category_Name,
          HSN: item.HSN,
        }
        : { code: null, accoid: null, label: null, HSN: null };
    } catch (error) {
      console.error("Error fetching item code:", error);
      return { code: null, accoid: null, label: null, HSN: null };
    }
  };

  const fetchBrokerCode = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/account_master_all?Company_Code=${companyCode}`
      );
      const data = response.data;
      const item = data.find((item) => item.Ac_Code === 2);
      return item
        ? { code: item.Ac_Code, accoid: item.accoid, label: item.Ac_Name_E }
        : { code: null, accoid: null, label: null };
    } catch (error) {
      console.error("Error fetching broker code:", error);
      return { code: null, accoid: null, label: null };
    }
  };

  const fetchGSTRateCode = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/gst_rate_master?Company_Code=${companyCode}`
      );
      const data = response.data;
      const item = data.find((item) => item.Doc_no === 1);

      if (item) {
        const rateWithoutPercent = parseFloat(item.Rate.replace("%", ""));
        setGstRate(rateWithoutPercent);

        return {
          code: item.Doc_no,
          accoid: item.gstid,
          label: item.GST_Name,
          Rate: rateWithoutPercent,
        };
      } else {
        return { code: null, accoid: null, label: null };
      }
    } catch (error) {
      console.error("Error fetching item code:", error);
      return { code: null, accoid: null, label: null };
    }
  };

  const handleAddOne = async () => {
    setAddOneButtonEnabled(false);
    setSaveButtonEnabled(true);
    setCancelButtonEnabled(true);
    setEditButtonEnabled(false);
    setDeleteButtonEnabled(false);
    setIsEditing(true);
    setTimeout(() => {
      TranTypeInputRef.current?.focus();
    }, 0);
    const itemCode = await fetchItemCode();
    const brokerCode = await fetchBrokerCode();
    const gstRateCode = await fetchGSTRateCode();
    setFormData((prevState) => ({
      ...initialFormData,
      doc_no: prevState.doc_no,
      item_code: itemCode.code,
      ic: itemCode.accoid,
      HSN: itemCode.HSN,
      broker_code: brokerCode.code,
      bc: brokerCode.accoid,
      gst_code: gstRateCode.code,
      Company_Code: companyCode,
      Year_Code: Year_Code,
    }));
    fetchLastRecord(tranType);
    ItemName = itemCode.label;
    BrokerName = brokerCode.label;
    GstRateName = gstRateCode.label;
    sessionStorage.getItem("Tran_Type");
    SupplierName = "";
    newac_code = "";
    UnitName = "";
    newunit_code = "";
    newbroker_code = "";
    TransportName = "";
    newtransport_code = "";
    newgst_code = "";
    MillName = "";
    newmill_code = "";
    newnarration1 = "";
    newnarration2 = "";
    newitem_code = "";
    TdsName = "";
    newTDS_Ac = "";


  };

  const handleSaveOrUpdate = async () => {
    const Post_Date = sessionStorage.getItem("Post_Date");
    const Outword_Date = sessionStorage.getItem("Outword_Date")
    if (await OutwordPostDateRecordLock(formData.doc_date, Post_Date, Outword_Date)) {
      return;
    }

    const accountingYearData = sessionStorage.getItem('Accounting_Year');
    const formattedEntryDate = formData.doc_date;
    const isValid = validateDocumentDate(formattedEntryDate, accountingYearData);

    if (!isValid) {
      return
    }

    setLoading(true)
    let preparedData = {
      ...formData,
    };

    if (isEditMode) {
      preparedData = {
        ...preparedData,
        Modified_By: username,
        User_Id : User_Id
      }
    }
    else {
      preparedData = {
        ...preparedData,
        Created_By: username
      }
    }

    const apiUrl = isEditMode
      ? `${API_URL}/update-CommissionBill?doc_no=${formData.doc_no}&Company_Code=${companyCode}&Year_Code=${Year_Code}&Tran_Type=${tranType || formData.Tran_Type}`
      : `${API_URL}/create-RecordCommissionBill?Company_Code=${companyCode}&Year_Code=${Year_Code}&Tran_Type=${tranType || formData.Tran_Type}`;

    const apiCall = isEditMode
      ? axios.put(apiUrl, preparedData)
      : axios.post(apiUrl, preparedData);

    apiCall
      .then((response) => {
        const successMessage = isEditMode
          ? "Record updated successfully!"
          : "Record created successfully!";

        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: successMessage,
        });
        unlockRecord();
        setIsEditMode(false);
        setAddOneButtonEnabled(true);
        setEditButtonEnabled(true);
        setDeleteButtonEnabled(true);
        setBackButtonEnabled(true);
        setSaveButtonEnabled(false);
        setCancelButtonEnabled(false);
        setUpdateButtonClicked(true);
        setIsEditing(false);
        setLoading(false)

      })
      .catch((error) => {
        if (isEditMode) handleCancel();
        console.error(
          `Error ${isEditMode ? "updating" : "saving"} data:`,
          error
        );
        setLoading(false)
      });
  };

  const handleEdit = async () => {
    const Post_Date = sessionStorage.getItem("Post_Date");
    const Outword_Date = sessionStorage.getItem("Outword_Date")
    if (await OutwordPostDateRecordLock(formData.doc_date, Post_Date, Outword_Date)) {
      return;
    }
    axios
      .get(
        `${API_URL}/get-CommissionBillSelectedRecord?Company_Code=${companyCode}&doc_no=${formData.doc_no}&Year_Code=${Year_Code}&Tran_Type=${tranType || selectedVoucherType}`
      )
      .then((response) => {
        const data = response.data;

        const isLockedNew = data.LockedRecord;
        const isLockedByUserNew = data.LockedUser;

        if (isLockedNew) {
          window.alert(`This record is locked by ${isLockedByUserNew}`);
          return;
        } else {
          lockRecord();
        }
        setFormData({
          ...formData,
          ...data,
        });
        setIsEditMode(true);
        setAddOneButtonEnabled(false);
        setSaveButtonEnabled(true);
        setCancelButtonEnabled(true);
        setEditButtonEnabled(false);
        setDeleteButtonEnabled(false);
        setBackButtonEnabled(true);
        setIsEditing(true);
      })
      .catch((error) => {
        window.alert(
          "This record is already deleted! Showing the previous record.",
          error
        );
      });
  };

  const handleCancel = () => {
    axios
      .get(
        `${API_URL}/get-CommissionBill-lastRecord?Company_Code=${companyCode}&Year_Code=${Year_Code}&Tran_Type=${tranType || selectedVoucherType
        }`
      )
      .then((response) => {
        const data = response.data;
        newac_code = data.PartyCode;
        SupplierName = data.PartyName;
        newunit_code = data.Unitcode;
        UnitName = data.UnitName;
        BrokerName = data.brokername;
        newbroker_code = data.broker_code;
        TransportName = data.transportname;
        newtransport_code = data.transportcode;
        GstRateName = data.gstratename;
        newgst_code = data.gstratecode;
        MillName = data.millname;
        newmill_code = data.millcode;
        newnarration1 = data.narration1;
        newnarration2 = data.narration2;
        TdsName = data.tdsacname;
        newTDS_Ac = data.tdsac;
        ItemName = data.Itemname;
        newitem_code = data.Itemcode;

        setFormData((prevState) => ({
          ...formData,
          ...data,
        }));
        unlockRecord()
        setTimeout(() => {
        }, 0);
      })
      .catch((error) => {
        console.error("Error fetching latest data for edit:", error);
      });

    setIsEditing(false);
    setIsEditMode(false);
    setAddOneButtonEnabled(true);
    setEditButtonEnabled(true);
    setDeleteButtonEnabled(true);
    setBackButtonEnabled(true);
    setSaveButtonEnabled(false);
    setCancelButtonEnabled(false);
    setCancelButtonClicked(true);
  };

  const handleDelete = async () => {

    const Post_Date = sessionStorage.getItem("Post_Date");
    const Outword_Date = sessionStorage.getItem("Outword_Date")
    if (await OutwordPostDateRecordLock(formData.doc_date, Post_Date, Outword_Date)) {
      return;
    }

    if (formData.ackno || formData.einvoiceno) {
          Swal.fire({
            icon: "warning",
            title: "Cannot Delete",
            text: "E-Invoice has already been generated for this record. Deletion is not allowed.",
            confirmButtonColor: "#d33",
          });
          return;
        }

    if (parseInt(formData.link_no) !== 0) {
      Swal.fire({
        title: "Error",
        text: `Couldn't delete this record it is currently referenced in DO No. ${formData.link_no}`.trim(),
        icon: "error",
        confirmButtonText: "OK"
      });
      return;
    }

    if (parseInt(formData.link_id) !== 0) {
      Swal.fire({
        title: "Error",
        text: `Couldn't delete this record it is currently referenced in Tender No. ${formData.link_id}`.trim(),
        icon: "error",
        confirmButtonText: "OK"
      });
      return;
    }
    try {
      const response = await axios.get(
        `${API_URL}/get-CommissionBillSelectedRecord?Company_Code=${companyCode}&doc_no=${formData.doc_no}&Year_Code=${Year_Code}&Tran_Type=${tranType}`
      );

      const data = response.data;
      const isLockedNew = data.LockedRecord;
      const isLockedByUserNew = data.LockedUser;

      if (isLockedNew) {
        Swal.fire({
          icon: 'warning',
          title: 'Record Locked',
          text: `This record is locked by ${isLockedByUserNew}`,
          confirmButtonColor: '#d33',
        });
        return;
      }

      if (formData.link_id && formData.link_id !== "" && formData.link_id !== 0) {
        Swal.fire({
          icon: 'error',
          title: 'Deletion Not Allowed',
          text: `This record has a reference in Tender No. ${formData.link_id}. Deletion is not allowed.`,
          confirmButtonColor: '#d33',
        });
        return;
      }

      const result = await Swal.fire({
        title: 'Are you sure?',
        text: `You won't be able to revert this Doc No: ${formData.doc_no}`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        cancelButtonText: 'Cancel',
        confirmButtonText: 'Delete',
        reverseButtons: true,
        focusCancel: true,
      });

      if (result.isConfirmed) {
        setIsEditMode(false);
        setAddOneButtonEnabled(true);
        setEditButtonEnabled(true);
        setDeleteButtonEnabled(true);
        setBackButtonEnabled(true);
        setSaveButtonEnabled(false);
        setCancelButtonEnabled(false);
        setLoading(true);

        const deleteApiUrl = `${API_URL}/delete-CommissionBill?doc_no=${formData.doc_no}&Company_Code=${companyCode}&Year_Code=${Year_Code}&Tran_Type=${tranType}&User_Id=${User_Id}`;
        try {
          await axios.delete(deleteApiUrl);
          Swal.fire({
            title: "Deleted!",
            text: "Data deleted successfully!",
            icon: "success",
            confirmButtonText: "OK",
          });

          setLoading(false);
          handleCancel();
        } catch (error) {
          toast.error("Deletion failed.");
          console.error("Error during API call:", error);
          setLoading(false);
        }
      } else {
        Swal.fire({
          title: 'Cancelled',
          text: 'Your record is safe 🙂',
          icon: 'info',
        });
      }
    } catch (error) {
      toast.error("Error fetching data.");
      console.error("Error during API call:", error);
      setLoading(false);
    }
  };


  const handleBack = () => {
    navigate("/CommissionBill-utility");
  };

  const handlerecordDoubleClicked = async () => {
    const voucherNo = selectedVoucherNo
      ? selectedVoucherNo
      : selectedRecord.doc_no;
    try {
      const response = await axios.get(
        `${API_URL}/get-CommissionBillSelectedRecord?Company_Code=${companyCode}&doc_no=${voucherNo}&Year_Code=${Year_Code}&Tran_Type=${tranType || selectedVoucherType
        }`
      );
      const data = response.data;
      newac_code = data.PartyCode;
      SupplierName = data.PartyName;
      newunit_code = data.Unitcode;
      UnitName = data.UnitName;
      BrokerName = data.brokername;
      newbroker_code = data.broker_code;
      TransportName = data.transportname;
      newtransport_code = data.transportcode;
      GstRateName = data.gstratename;
      newgst_code = data.gstratecode;
      MillName = data.millname;
      newmill_code = data.millcode;
      newnarration1 = data.narration1;
      newnarration2 = data.narration2;
      TdsName = data.tdsacname;
      newTDS_Ac = data.tdsac;
      ItemName = data.Itemname;
      newitem_code = data.Itemcode;

      setFormData({
        ...formData,
        ...data,
      });

      setIsEditing(false);
    } catch (error) {
      console.error("Error fetching data:", error);
    }

    setIsEditMode(false);
    setAddOneButtonEnabled(true);
    setEditButtonEnabled(true);
    setDeleteButtonEnabled(true);
    setBackButtonEnabled(true);
    setSaveButtonEnabled(false);
    setCancelButtonEnabled(false);
    setUpdateButtonClicked(true);
    setIsEditing(false);
  };

  useEffect(() => {
    if (selectedRecord || selectedVoucherNo) {
      handlerecordDoubleClicked();
    } else {
      handleAddOne();
    }
  }, [selectedRecord, selectedVoucherNo]);

  const handleKeyDown = async (event) => {
    if (event.key === "Tab") {
      const changeNoValue = event.target.value;
      try {
        const response = await axios.get(
          `${API_URL}/get-CommissionBillSelectedRecord?Company_Code=${companyCode}&doc_no=${changeNoValue}&Year_Code=${Year_Code}&Tran_Type=${tranType}`
        );
        const data = response.data;
        newac_code = data.PartyCode;
        SupplierName = data.PartyName;
        newunit_code = data.Unitcode;
        UnitName = data.UnitName;
        BrokerName = data.brokername;
        newbroker_code = data.broker_code;
        TransportName = data.transportname;
        newtransport_code = data.transportcode;
        GstRateName = data.gstratename;
        newgst_code = data.gstratecode;
        MillName = data.millname;
        newmill_code = data.millcode;
        newnarration1 = data.narration1;
        newnarration2 = data.narration2;
        TdsName = data.tdsacname;
        newTDS_Ac = data.tdsac;
        ItemName = data.Itemname;
        newitem_code = data.Itemcode;
        setFormData(data);
        setIsEditing(false);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }
  };

  // Common function for navigation
  const fetchRecord = async (url) => {
    try {
      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        const record = data[0];
        newac_code = record.PartyCode;
        SupplierName = record.PartyName;
        newunit_code = record.Unitcode;
        UnitName = record.UnitName;
        BrokerName = record.brokername;
        newbroker_code = record.broker_code;
        TransportName = record.transportname;
        newtransport_code = record.transportcode;
        GstRateName = record.gstratename;
        newgst_code = record.gstratecode;
        MillName = record.millname;
        newmill_code = record.millcode;
        newnarration1 = record.narration1;
        newnarration2 = record.narration2;
        TdsName = record.tdsacname;
        newTDS_Ac = record.tdsac;
        ItemName = record.Itemname;
        newitem_code = record.Itemcode;

        setFormData({
          ...formData,
          ...record,
          doc_date: record.Formatted_Doc_Date

        });
      } else {
        console.error(
          "Failed to fetch record:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error during API call:", error);
    }
  };

  // Navigation Button Handlers
  const handleFirstButtonClick = () => {
    const url = `${API_URL}/get-first-CommissionBill?Company_Code=${companyCode}&Year_Code=${Year_Code}&Tran_Type=${tranType}`;
    fetchRecord(url);
  };

  const handlePreviousButtonClick = () => {
    const url = `${API_URL}/get-previous-CommissionBill?doc_no=${formData.doc_no}&Company_Code=${companyCode}&Year_Code=${Year_Code}&Tran_Type=${tranType}`;
    fetchRecord(url);
  };

  const handleNextButtonClick = () => {
    const url = `${API_URL}/get-next-CommissionBill?doc_no=${formData.doc_no}&Company_Code=${companyCode}&Year_Code=${Year_Code}&Tran_Type=${tranType}`;
    fetchRecord(url);
  };

  const handleLastButtonClick = () => {
    const url = `${API_URL}/get-last-CommissionBill?Company_Code=${companyCode}&Year_Code=${Year_Code}&Tran_Type=${tranType}`;
    fetchRecord(url);
  };

  const handleTenderNo = () => {
    navigate("/tender_head", {
      state: {
        selectedTenderNo: formData.link_id,
      },
    });
  };

  const handleGenerateEInvoice = () => {
    setIsOpenEInvoice(true);
  };

  const handleCloseEInvoice = () => {
    setIsOpenEInvoice(false);
  };

  return (
    <>
      <div>
        <UserAuditInfo
          createdBy={formData.Created_By}
          modifiedBy={formData.Modified_By}
          title={"Commission Bill"}
        />
        <div style={{ marginTop: "40px" }}>
          <ToastContainer autoClose={500} />
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
            permissions={permissions}
            component={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div>
                  <VoucherReport
                    doc_no={formData.doc_no}
                    Company_Code={companyCode}
                    Year_Code={Year_Code}
                    tran_type={formData.Tran_Type || tranType}
                    disabledFeild={!addOneButtonEnabled}
                  />
                </div>

                <div style={{ marginLeft: '5px' }}>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={() => handleGenerateEInvoice()}
                    disabled={isEditing || formData.einvoiceno !== "" || formData.Tran_Type === "CV" || tranType === "CV"}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    Generate eInvoice
                  </Button>
                </div>

                <Dialog open={isOpenEInvoice} onClose={handleCloseEInvoice} maxWidth="1000px" fullWidth>
                  <DialogTitle style={{ textAlign: "center" }}>E-Invoice Generation</DialogTitle>
                  <IconButton
                    edge="end"
                    color="inherit"
                    onClick={handleCloseEInvoice}
                    aria-label="close"
                    style={{
                      position: 'absolute',
                      right: 30,
                      top: 8,
                      backgroundColor: '#555',
                    }}
                  >
                    <CloseIcon />
                  </IconButton>
                  <DialogContent>
                    <EInvoiceGeneration
                      doc_no={formData.doc_no}
                      do_no={formData.link_no}
                      tran_type={"LV"}
                      handleClose={handleCloseEInvoice}
                      Company_Code={companyCode}
                      Year_Code={Year_Code}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            }
          />
          <div>
            <NavigationButtons
              handleFirstButtonClick={handleFirstButtonClick}
              handlePreviousButtonClick={handlePreviousButtonClick}
              handleNextButtonClick={handleNextButtonClick}
              handleLastButtonClick={handleLastButtonClick}
              highlightedButton={highlightedButton}
              isEditing={isEditing}
              isFirstRecord={formData.Company_Code === companyCode}
            />
          </div>
        </div>

        <form style={{ marginTop: "20px" }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={2} sm={1}>
              <TextField
                label="Change No:"
                variant="outlined"
                fullWidth
                type="text"
                id="changeNo"
                name="changeNo"
                onKeyDown={handleKeyDown}
                disabled={!addOneButtonEnabled}
                size="small"
              />
            </Grid>

            <Grid item xs={2} sm={1}>
              <FormControl fullWidth variant="outlined" disabled={!isEditing && addOneButtonEnabled}>
                <InputLabel>Type</InputLabel>
                <Select
                  id="Tran_Type"
                  name="Tran_Type"
                  value={formData.Tran_Type || selectedVoucherType}
                  onChange={handleChange}
                  onKeyDown={(event) => handleSelectKeyDown(event, "Tran_Type")}
                  label="Type"
                  size="small"
                  inputRef={TranTypeInputRef}
                >
                  <MenuItem value="LV">LV</MenuItem>
                  <MenuItem value="CV">CV</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={2} sm={1}>
              <TextField
                label="Note No.:"
                variant="outlined"
                fullWidth
                type="text"
                id="doc_no"
                name="doc_no"
                value={formData.doc_no}
                onChange={handleChange}
                disabled={!isEditing && addOneButtonEnabled}
                size="small"
              />
            </Grid>
            <Grid item xs={2} sm={1}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <TextField
                  label="DO No.:"
                  variant="outlined"
                  fullWidth
                  type="text"
                  id="link_no"
                  name="link_no"
                  value={formData.link_no}
                  onChange={handleChange}
                  disabled={!isEditing && addOneButtonEnabled}
                  size="small"
                  style={{
                    marginLeft: 8,
                    fontWeight: 'bold',
                    color: 'red',
                    fontSize: '1.1rem',
                    cursor: 'pointer'
                  }}
                />
                <div style={{
                  marginLeft: 8,
                  fontWeight: 'bold',
                  color: 'red',
                  fontSize: '1.1rem',
                  cursor: 'pointer'
                }} onClick={handleTenderNo} >{formData.link_type}</div>
              </div>
            </Grid>

            <Grid item xs={2} sm={1}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <TextField
                  label="Tender No.:"
                  variant="outlined"
                  type="text"
                  id="link_id"
                  name="link_id"
                  value={formData.link_id}
                  onChange={handleChange}
                  disabled={!isEditing && addOneButtonEnabled}
                  size="small"
                  style={{ flex: 1 }}
                />
                <div style={{
                  marginLeft: 8,
                  fontWeight: 'bold',
                  color: 'red',
                  fontSize: '1.1rem',
                  cursor: 'pointer'
                }} onClick={handleTenderNo}>{formData.link_type}</div>
              </div>
            </Grid>

            <Grid item xs={2} sm={1}>
              <TextField
                label="Date:"
                variant="outlined"
                fullWidth
                type="date"
                id="doc_date"
                name="doc_date"
                value={formData.doc_date}
                onChange={handleDateChange}
                disabled={!isEditing && addOneButtonEnabled}
                size="small"

                InputLabelProps={{
                  style: { fontSize: '12px' },
                }}
                InputProps={{
                  style: { fontSize: '12px', height: '35px' },
                }}
              />
            </Grid>
          </Grid>
          <br></br>
          <div className="form-group">
            <div className="commissionBill-row">
              <label htmlFor="ac_code" className="commissionBilllabel">
                Party :
              </label>
              <AccountMasterHelp
                name="ac_code"
                onAcCodeClick={handleAcCode}
                CategoryName={SupplierName}
                CategoryCode={newac_code}
                Ac_type={[]}
                disabledFeild={!isEditing && addOneButtonEnabled}
              />
            </div>
            <div className="commissionBill-row">
              <label htmlFor="unit_code" className="commissionBilllabel">
                Unit :
              </label>
              <AccountMasterHelp
                name="unit_code"
                onAcCodeClick={handleUnitCode}
                CategoryName={UnitName}
                CategoryCode={newunit_code}
                Ac_type={[]}
                disabledFeild={!isEditing && addOneButtonEnabled}
              />
            </div>
            <div className="commissionBill-row">
              <label htmlFor="broker_code" className="commissionBilllabel">
                Broker :
              </label>
              <AccountMasterHelp
                name="broker_code"
                onAcCodeClick={handleBrokerCode}
                CategoryName={BrokerName}
                CategoryCode={newbroker_code || formData.broker_code}
                Ac_type={[]}
                disabledFeild={!isEditing && addOneButtonEnabled}
              />
            </div>
          </div>
          <div className="form-group" style={{ marginTop: "1px" }}>
            <div className="commissionBill-row">
              <label htmlFor="item_code" className="commissionBilllabel">
                Item Code :
              </label>
              <ItemMasterHelp
                name="item_code"
                onAcCodeClick={handleItemCode}
                CategoryName={ItemName}
                SystemType="I"
                CategoryCode={newitem_code || formData.item_code}
                disabledField={!isEditing && addOneButtonEnabled}
              />
            </div>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={2}>
                <TextField
                  label="Quantal"
                  variant="outlined"
                  fullWidth
                  type="text"
                  id="qntl"
                  name="qntl"
                  value={formData.qntl}
                  onChange={(e) => {
                    validateNumericInput(e);
                    handleChange(e);
                  }}
                  onKeyDown={handleKeyDownCalculations}
                  disabled={!isEditing && addOneButtonEnabled}
                  size="small"
                />
              </Grid>
              <Grid item xs={2}>
                <TextField
                  label="Packing"
                  variant="outlined"
                  fullWidth
                  type="text"
                  id="packing"
                  name="packing"
                  value={formData.packing}
                  onChange={(e) => {
                    validateNumericInput(e);
                    handleChange(e);
                  }}
                  onKeyDown={handleKeyDownCalculations}
                  disabled={!isEditing && addOneButtonEnabled}
                  size="small"
                />
              </Grid>
              <Grid item xs={2}>
                <TextField
                  label="Bags"
                  variant="outlined"
                  fullWidth
                  type="text"
                  id="bags"
                  name="bags"
                  value={formData.bags}
                  onChange={(e) => {
                    validateNumericInput(e);
                    handleChange(e);
                  }}
                  onKeyDown={handleKeyDownCalculations}
                  disabled={!isEditing && addOneButtonEnabled}
                  size="small"
                />
              </Grid>
              <Grid item xs={2}>
                <TextField
                  label="HSN"
                  variant="outlined"
                  fullWidth
                  type="text"
                  id="HSN"
                  name="HSN"
                  value={formData.HSN}
                  onChange={handleChange}
                  disabled={!isEditing && addOneButtonEnabled}
                  size="small"
                />
              </Grid>
              <Grid item xs={2}>
                <TextField
                  label="Grade"
                  variant="outlined"
                  fullWidth
                  type="text"
                  id="grade"
                  name="grade"
                  value={formData.grade}
                  onChange={handleChange}
                  disabled={!isEditing && addOneButtonEnabled}
                  size="small"
                />
              </Grid>
            </Grid>
          </div>

          <div className="form-group" style={{ marginTop: "10px" }} >
            <div className="commissionBill-row" >
              <label htmlFor="transport_code" className="commissionBilllabel">
                Transport :
              </label>
              <AccountMasterHelp
                name="transport_code"
                onAcCodeClick={handleTransportCode}
                CategoryName={TransportName}
                CategoryCode={newtransport_code}
                Ac_type={[]}
                disabledFeild={!isEditing && addOneButtonEnabled}
              />
            </div>

            <div className="commissionBill-row">
              <label htmlFor="transport_code" className="commissionBilllabel">
                Mill Name :
              </label>
              <AccountMasterHelp
                name="mill_code"
                onAcCodeClick={handleMillCode}
                CategoryName={MillName}
                CategoryCode={newmill_code}
                Ac_type={[]}
                disabledFeild={!isEditing && addOneButtonEnabled}
              />
            </div>
          </div>

          <Grid container spacing={1}>
            <Grid item xs={2} sm={1}>
              <TextField
                label="M.R."
                variant="outlined"
                fullWidth
                type="text"
                id="mill_rate"
                name="mill_rate"
                value={formData.mill_rate}
                onChange={(e) => {
                  validateNumericInput(e);
                  handleChange(e);
                }}
                onKeyDown={handleKeyDownCalculations}
                disabled={!isEditing && addOneButtonEnabled}
                size="small"
              />
            </Grid>

            <Grid item xs={2} sm={1}>
              <TextField
                label="S.R."
                variant="outlined"
                fullWidth
                type="text"
                id="sale_rate"
                name="sale_rate"
                value={formData.sale_rate}
                onChange={(e) => {
                  validateNumericInput(e);
                  handleChange(e);
                }}
                onKeyDown={handleKeyDownCalculations}
                disabled={!isEditing && addOneButtonEnabled}
                size="small"
              />
            </Grid>

            <Grid item xs={2} sm={1}>
              <TextField
                label="P.R."
                variant="outlined"
                fullWidth
                type="text"
                id="purc_rate"
                name="purc_rate"
                value={formData.purc_rate}
                onChange={(e) => {
                  validateNumericInput(e);
                  handleChange(e);
                }}
                onKeyDown={handleKeyDownCalculations}
                disabled={!isEditing && addOneButtonEnabled}
                size="small"
              />
            </Grid>

            <div className="commissionBill-row">
              <label htmlFor="gst_code" className="commissionBilllabel">
                GST Code :
              </label>
              <GSTRateMasterHelp
                name="gst_code"
                onAcCodeClick={handleGSTCode}
                GstRateName={GstRateName}
                GstRateCode={newgst_code || formData.gst_code}
                disabledFeild={!isEditing && addOneButtonEnabled}
              />
            </div>

            <Grid item xs={2}>
              <TextField
                label="Commission Amount"
                variant="outlined"
                fullWidth
                type="text"
                id="commission_amount"
                name="commission_amount"
                value={formData.commission_amount}
                onChange={(e) => {
                  validateNumericInput(e);
                  handleChange(e);
                }}
                onKeyDown={handleKeyDownCalculations}
                disabled
                size="small"
              />
            </Grid>
            <Grid item xs={2}>
              <TextField
                label="R.Diff.Tender"
                variant="outlined"
                fullWidth
                type="text"
                id="rDiffTenderRate"
                name="rDiffTenderRate"
                value={calculateTenderDiffRateAmount(
                  formData.commission_amount,
                  formData.qntl
                )}
                onKeyDown={handleKeyDownCalculations}
                onChange={(e) => {
                  validateNumericInput(e);
                  handleChange(e);
                }}
                disabled
                size="small"
              />
            </Grid>
          </Grid>

          <div className="form-group" style={{ marginTop: "10px" }}>
          </div>
          <br></br>
          <div className="form-group">
            <div className="commissionBill-row">
              <label htmlFor="narration1" className="commissionBilllabel">
                Narration 1 :
              </label>
              <AccountMasterHelp
                name="narration1"
                onAcCodeClick={handleNarration1}
                newnarration1={newnarration1}
                Ac_type={[]}
                disabledFeild={!isEditing && addOneButtonEnabled}
              />
            </div>

            <div className="commissionBill-row">
              <label htmlFor="narration2" className="commissionBilllabel">
                Narration 2:
              </label>
              <AccountMasterHelp
                name="narration2"
                onAcCodeClick={handleNarration2}
                newnarration2={newnarration2}
                Ac_type={[]}
                disabledFeild={!isEditing && addOneButtonEnabled}
              />
            </div>
          </div>

          <Grid container spacing={1}>
            <Grid item xs={2} sm={1}>
              <TextField
                label="Resale Commission"
                variant="outlined"
                fullWidth
                type="text"
                id="resale_commission"
                name="resale_commission"
                value={formData.resale_commission}
                onChange={(e) => {
                  validateNumericInput(e);
                  handleChange(e);
                }}
                onKeyDown={handleKeyDownCalculations}
                disabled={!isEditing && addOneButtonEnabled}
                size="small"
              />
            </Grid>

            <Grid item xs={2} sm={1}>
              <TextField
                label="Resale Rate"
                variant="outlined"
                fullWidth
                type="text"
                id="resale_rate"
                name="resale_rate"
                value={formData.resale_rate}
                onChange={(e) => {
                  validateNumericInput(e);
                  handleChange(e);
                }}
                onKeyDown={handleKeyDownCalculations}
                disabled
                size="small"
              />
            </Grid>

            <Grid item xs={2} sm={1}>
              <TextField
                label="Bank Commission"
                variant="outlined"
                fullWidth
                type="text"
                id="BANK_COMMISSION"
                name="BANK_COMMISSION"
                value={formData.BANK_COMMISSION}
                onChange={(e) => {
                  validateNumericInput(e);
                  handleChange(e);
                }}
                onKeyDown={handleKeyDownCalculations}
                disabled={!isEditing && addOneButtonEnabled}
                size="small"
              />
            </Grid>

            <Grid item xs={2} sm={1}>
              <TextField
                label="Sub Total"
                variant="outlined"
                fullWidth
                type="text"
                id="subtotal"
                name="subtotal"
                value={formData.subtotal}
                onChange={(e) => {
                  validateNumericInput(e);
                  handleChange(e);
                }}
                onKeyDown={handleKeyDownCalculations}
                disabled
                size="small"
              />
            </Grid>

            <Grid item xs={2} sm={1}>
              <TextField
                label="Freight"
                variant="outlined"
                fullWidth
                type="text"
                id="Frieght_Rate"
                name="Frieght_Rate"
                value={formData.Frieght_Rate}
                onChange={(e) => {
                  validateNumericInput(e);
                  handleChange(e);
                }}
                onKeyDown={handleKeyDownCalculations}
                disabled={!isEditing && addOneButtonEnabled}
                size="small"
              />
            </Grid>

            <Grid item xs={2} sm={1}>
              <TextField
                label="Freight Amount"
                variant="outlined"
                fullWidth
                type="text"
                id="Frieght_amt"
                name="Frieght_amt"
                value={formData.Frieght_amt}
                onChange={(e) => {
                  validateNumericInput(e);
                  handleChange(e);
                }}
                onKeyDown={handleKeyDownCalculations}
                disabled
                size="small"
              />
            </Grid>
          </Grid>

          <Grid container spacing={1} mt={1}>
            <Grid item xs={2} sm={1}>
              <TextField
                label="Taxable Amount"
                variant="outlined"
                fullWidth
                type="text"
                id="texable_amount"
                name="texable_amount"
                value={formData.texable_amount}
                onChange={(e) => {
                  validateNumericInput(e);
                  handleChange(e);
                }}
                onKeyDown={handleKeyDownCalculations}
                disabled
                size="small"
              />
            </Grid>

            <Grid item xs={2} sm={1}>
              <TextField
                label="CGST%"
                variant="outlined"
                fullWidth
                type="text"
                id="cgst_rate"
                name="cgst_rate"
                value={formData.cgst_rate}
                onChange={handleGSTCode}
                onKeyDown={handleKeyDownCalculations}
                disabled
                size="small"
              />
            </Grid>

            <Grid item xs={2} sm={1}>
              <TextField
                label="CGST Amount"
                variant="outlined"
                fullWidth
                type="text"
                id="cgst_amount"
                name="cgst_amount"
                value={formData.cgst_amount}
                onChange={(e) => {
                  validateNumericInput(e);
                  handleChange(e);
                }}
                onKeyDown={handleKeyDownCalculations}
                disabled
                size="small"
              />
            </Grid>

            <Grid item xs={2} sm={1}>
              <TextField
                label="SGST%"
                variant="outlined"
                fullWidth
                type="text"
                id="sgst_rate"
                name="sgst_rate"
                value={formData.sgst_rate}
                onChange={handleGSTCode}
                onKeyDown={handleKeyDownCalculations}
                disabled
                size="small"
              />
            </Grid>

            <Grid item xs={2} sm={1}>
              <TextField
                label="SGST Amount"
                variant="outlined"
                fullWidth
                type="text"
                id="sgst_amount"
                name="sgst_amount"
                value={formData.sgst_amount}
                onChange={(e) => {
                  validateNumericInput(e);
                  handleChange(e);
                }}
                onKeyDown={handleKeyDownCalculations}
                disabled
                size="small"
              />
            </Grid>

            <Grid item xs={2} sm={1}>
              <TextField
                label="IGST%"
                variant="outlined"
                fullWidth
                type="text"
                id="igst_rate"
                name="igst_rate"
                value={formData.igst_rate}
                onChange={handleGSTCode}
                onKeyDown={handleKeyDownCalculations}
                disabled
                size="small"
              />
            </Grid>

            <Grid item xs={2} sm={1}>
              <TextField
                label="IGST Amount"
                variant="outlined"
                fullWidth
                type="text"
                id="igst_amount"
                name="igst_amount"
                value={formData.igst_amount}
                onChange={(e) => {
                  validateNumericInput(e);
                  handleChange(e);
                }}
                onKeyDown={handleKeyDownCalculations}
                disabled
                size="small"
              />
            </Grid>
          </Grid>

          <Grid container spacing={1} mt={1}>
            <Grid item xs={3} sm={1} >
              <TextField
                label="Bill Amount"
                variant="outlined"
                fullWidth
                type="text"
                id="bill_amount"
                name="bill_amount"
                value={formData.bill_amount}
                onChange={(e) => {
                  validateNumericInput(e);
                  handleChange(e);
                }}
                onKeyDown={handleKeyDownCalculations}
                disabled
                size="small"
              />
            </Grid>
            <Grid item xs={3} sm={1}>
              <TextField
                label="TCS %"
                variant="outlined"
                fullWidth
                type="text"
                id="TCS_Rate"
                name="TCS_Rate"
                value={formData.TCS_Rate}
                onChange={(e) => {
                  validateNumericInput(e);
                  handleChange(e);
                }}
                onKeyDown={handleKeyDownCalculations}
                disabled={
                  formData.IsTDS === "Y" || (!isEditing && addOneButtonEnabled)
                }
                size="small"
              />
            </Grid>

            <Grid item xs={3} sm={1}>
              <TextField
                label="TCS Amount"
                variant="outlined"
                fullWidth
                type="text"
                id="TCS_Amt"
                name="TCS_Amt"
                value={formData.TCS_Amt}
                onChange={(e) => {
                  validateNumericInput(e);
                  handleChange(e);
                }}
                onKeyDown={handleKeyDownCalculations}
                disabled
                size="small"
              />
            </Grid>

            <Grid item xs={3} sm={1}>
              <TextField
                label="Other +-"
                variant="outlined"
                fullWidth
                type="text"
                id="misc_amount"
                name="misc_amount"
                value={formData.misc_amount}
                onChange={(e) => {
                  validateNumericInput(e);
                  handleChange(e);
                }}
                onKeyDown={handleKeyDownCalculations}
                disabled={!isEditing && addOneButtonEnabled}
                size="small"
              />
            </Grid>

            <Grid item xs={3} sm={1}>
              <TextField
                label="Net Payable"
                variant="outlined"
                fullWidth
                type="text"
                id="TCS_Net_Payable"
                name="TCS_Net_Payable"
                value={formData.TCS_Net_Payable}
                onChange={(e) => {
                  validateNumericInput(e);
                  handleChange(e);
                }}
                onKeyDown={handleKeyDownCalculations}
                disabled
                size="small"
              />
            </Grid>
          </Grid>

          <Grid container spacing={1} mt={1}>
            <Grid item xs={4} sm={1}>
              <FormControl fullWidth disabled={!isEditing && addOneButtonEnabled}>
                <InputLabel htmlFor="IsTDS">Is TDS:</InputLabel>
                <Select
                  id="IsTDS"
                  name="IsTDS"
                  value={formData.IsTDS}
                  onChange={handleChange}
                  onKeyDown={(event) => handleSelectKeyDown(event, "IsTDS")}
                  label="Is TDS"
                  size="small"
                >
                  <MenuItem value="Y">Yes</MenuItem>
                  <MenuItem value="N">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <div className="commissionBill-row">
              <label htmlFor="TDS_Ac" className="commissionBilllabel">
                TDS Ac :
              </label>
              <AccountMasterHelp
                name="TDS_Ac"
                onAcCodeClick={handleTDSAc}
                CategoryName={TdsName}
                CategoryCode={newTDS_Ac}
                Ac_type={[]}
                disabledFeild={
                  formData.IsTDS === "N" || (!isEditing && addOneButtonEnabled)
                }
              />
            </div>

            <Grid item xs={4} sm={1}>
              <TextField
                label="TDS Applicable Amount"
                variant="outlined"
                fullWidth
                type="text"
                id="TDS"
                name="TDS"
                value={formData.TDS}
                onChange={(e) => {
                  validateNumericInput(e);
                  handleChange(e);
                }}
                onKeyDown={handleKeyDownCalculations}
                disabled={formData.IsTDS === "N" || (!isEditing && addOneButtonEnabled)}
                size="small"
              />
            </Grid>

            <Grid item xs={4} sm={1}>
              <TextField
                label="TDS %"
                variant="outlined"
                fullWidth
                type="text"
                id="TDS_Per"
                name="TDS_Per"
                value={formData.TDS_Per}
                onChange={(e) => {
                  validateNumericInput(e);
                  handleChange(e);
                }}
                onKeyDown={handleKeyDownCalculations}
                disabled={formData.IsTDS === "N" || (!isEditing && addOneButtonEnabled)}
                size="small"
              />
            </Grid>

            <Grid item xs={4} sm={1}>
              <TextField
                label="TDS Amount"
                variant="outlined"
                fullWidth
                type="text"
                id="TDSAmount"
                name="TDSAmount"
                value={formData.TDSAmount}
                onChange={(e) => {
                  validateNumericInput(e);
                  handleChange(e);
                }}
                onKeyDown={handleKeyDownCalculations}
                disabled
                size="small"
              />
            </Grid>
          </Grid>

          <Grid container spacing={1} mt={1}>
            <Grid item xs={6} sm={4}>
              <TextField
                label="Einvoice No"
                variant="outlined"
                fullWidth
                type="text"
                id="einvoiceno"
                name="einvoiceno"
                value={formData.einvoiceno}
                onChange={handleChange}
                disabled={!isEditing && addOneButtonEnabled}
                size="small"
              />
            </Grid>

            <Grid item xs={6} sm={2}>
              <TextField
                label="Ack No"
                variant="outlined"
                fullWidth
                type="text"
                id="ackno"
                name="ackno"
                value={formData.ackno}
                onChange={handleChange}
                disabled={!isEditing && addOneButtonEnabled}
                size="small"
              />
            </Grid>
          </Grid>
          {loading && (
            <div className="loading-overlay">
              <div className="spinner-container">
                <SaveUpdateSpinner />
              </div>
            </div>
          )}
        </form>
      </div>
    </>
  );
};
export default CommissionBill;
