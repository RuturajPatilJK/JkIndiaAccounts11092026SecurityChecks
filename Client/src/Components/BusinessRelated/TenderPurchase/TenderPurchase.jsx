import React from "react";
import { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ActionButtonGroup from "../../../Common/CommonButtons/ActionButtonGroup";
import NavigationButtons from "../../../Common/CommonButtons/NavigationButtons";
import "./TenderPurchase.css";
import SaveUpdateSpinner from "../../../Common/Spinners/SaveUpdateSpinner";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AccountMasterHelp from "../../../Helper/AccountMasterHelp";
import GSTRateMasterHelp from "../../../Helper/GSTRateMasterHelp";
import SystemHelpMaster from "../../../Helper/SystemmasterHelp";
import GradeMasterHelp from "../../../Helper/GradeMasterHelp";
import { useRecordLocking } from "../../../hooks/useRecordLocking";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Stack,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Grid,
  Typography,
  Link,
  Box
} from "@mui/material";

import AddButton from "../../../Common/Buttons/AddButton";
import EditButton from "../../../Common/Buttons/EditButton";
import DeleteButton from "../../../Common/Buttons/DeleteButton";
import OpenButton from "../../../Common/Buttons/OpenButton";
import UserAuditInfo from "../../../Common/UserAuditInfo/UserAuditInfo";
import DetailAddButtom from "../../../Common/Buttons/DetailAddButton";
import DetailCloseButton from "../../../Common/Buttons/DetailCloseButton";
import DetailUpdateButton from "../../../Common/Buttons/DetailUpdateButton";
import Swal from "sweetalert2";
import io from "socket.io-client";
import { validateDocumentDate } from "../../../Common/ValidateDateRange/ValidateDateRange";
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";

var millCodeName;
var newMill_Code;
var gradeName;
var newGrade;
var paymentToName;
var newPayment_To;
var tenderFromName;
var newTender_From;
var tenderDOName;
var newTender_DO;
var voucherByName;
var newVoucher_By;
var brokerName;
var newBroker;
var itemName;
var newitemcode;
var gstRateName;
var gstRateCode;
var newgstratecode;
var bpAcName;
var newBp_Account;
var billToName;
var newBillToCode;
var shipToName;
var shipToCode;
var subBrokerName;
var subBrokerCode;
var newTenderId;
var selfAcCode;
var selfAcName;
var selfAccoid;
var buyerPartyCode;
var buyer_party_name;
var balance = 0.00;
var dispatched = 0.00;

const headerCellStyle = {
  fontWeight: "bold",
  backgroundColor: "#3f51b5",
  color: "white",
  padding: "2px",
  textAlign: "center",
  "&:hover": {
    backgroundColor: "#303f9f",
    cursor: "pointer",
  },
};


const headerCellStylelog = {
  fontWeight: "bold",
  backgroundColor: "#3f51b5",
  color: "white",
  padding: "2px",
  textAlign: "left",
  "&:hover": {
    backgroundColor: "#303f9f",
    cursor: "pointer",
  },
};

const API_URL = process.env.REACT_APP_API;
const socketURL = process.env.REACT_APP_API_URL
const ebuyAcCode = process.env.REACT_APP_EBUY_SUGAR_AC_CODE



const TenderPurchase = () => {
  const [updateButtonClicked, setUpdateButtonClicked] = useState(false);
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
  const [millCode, setMillCode] = useState("");
  const [itemCode, setItemCode] = useState("");
  const [grade, setGrade] = useState("");
  const [bpAcCode, setBpAcCode] = useState("");
  const [paymentTo, setPaymentTo] = useState("");
  const [tdsApplicable, setTdsApplicalbe] = useState("N");
  const [tenderFrom, setTenderFrom] = useState("");
  const [tenderDO, setTenderDO] = useState("");
  const [voucherBy, setVoucherBy] = useState("");
  const [broker, setBroker] = useState("");
  const [GstRate, setGSTRate] = useState("");
  const [lastTenderDetails, setLastTenderDetails] = useState([]);
  const [lastTenderData, setLastTenderData] = useState({});
  const [gstCode, setGstCode] = useState("");
  const [billtoName, setBillToName] = useState("");
  const [brokerDetail, setBrokerDetail] = useState("");
  const [shiptoName, setShipToName] = useState("");
  const [isGstRateChanged, setIsGstRateChanged] = useState(false);
  const [tenderFrName, setTenderFrName] = useState("");
  const [tenderDONm, setTenderDOName] = useState("");
  const [voucherbyName, setVoucherByName] = useState("");
  const [dispatchType, setDispatchType] = useState(null);
  const [buyerParty, setBuyerParty] = useState(selfAcCode);
  const [buyerPartyAccoid, setBuyerPartyAccoid] = useState(selfAccoid);
  const [buyerPartyName, setBuyerPartyName] = useState(selfAcName);
  const [errors, setErrors] = useState({});
  const [payment_toName, setPaymenToName] = useState("");
  const [isAutoPurchaseDisabled, setIsAutoPurchaseDisabled] = useState(false);
  const [isDetailGradeDisabled, setIsDetailGradeDisabled] = useState(false)
  const [minRate, setMinRate] = useState(0.0);
  const [maxRate, setMaxRate] = useState(0.0);
  const [groupData, setGroupData] = useState([]);

  let [gstRateCode, setGstRateCode] = useState("");
  let [gstRate_Name, setGstRateName] = useState("");

  const [isGradeDisable, setIsGradeDisable] = useState(false);
  const [usedInDeliveryGrades, setUsedInDeliveryGrades] = useState([]);

  // eBuy popup state
  const [ebuyPopupOpen, setEbuyPopupOpen] = useState(false);
  const [ebuyPopupData, setEbuyPopupData] = useState([]);
  const [ebuyPopupRow, setEbuyPopupRow] = useState(null);
  const [ebuyPopupLoading, setEbuyPopupLoading] = useState(false);
  const [selfStockQty, setSelfStockQty] = useState(0);
  const [selfSoldQty, setSelfSoldQty] = useState(0);
  const [selfEbuySold, setSelfEbuySold] = useState(0);

  const [receivedInData, setReceivedInData] = useState([]);
  const [shiftedOutData, setShiftedOutData] = useState([]);

  const companyCode = sessionStorage.getItem("Company_Code");
  const Year_Code = sessionStorage.getItem("Year_Code");
  const username = sessionStorage.getItem("username");
  const SaleTDSRate = sessionStorage.getItem("SaleTDSRate");
  const SaleTCSRate = sessionStorage.getItem("SaleTCSRate");
  const Accounting_Year = sessionStorage.getItem("Accounting_Year");
  const TCSApplicable = sessionStorage.getItem("TCSApplicable");
  const User_Id = sessionStorage.getItem("User_ID");

  const addButtonRef = useRef(null);
  const firstInputRef = useRef(null);
  const setFocusToFirstField = () => {
    if (firstInputRef.current) {
      firstInputRef.current.focus();
    }
  };

  const drpType = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const selectedRecord = location.state?.selectedRecord;
  const permissions = location.state?.permissionsData;
  const selectedTenderNo = location.state?.selectedTenderNo;

  const searchParams = new URLSearchParams(location.search);
  const navigatedRecord = searchParams.get('navigatedRecord');

  const startDate = Accounting_Year.split(" - ")[0];
  const isNewFinancialYear = new Date(startDate) >= new Date("2025-04-01");

  const initialFormData = {
    Tender_No: 0,
    Company_Code: companyCode,
    Tender_Date: new Date().toISOString().split("T")[0],
    Lifting_Date: "",
    Mill_Code: 0,
    Grade: "",
    Quantal: 0.0,
    Packing: 50,
    Bags: 0,
    Payment_To: 0,
    Tender_From: selfAcCode,
    Tender_DO: selfAcCode,
    Voucher_By: selfAcCode,
    Broker: selfAcCode,
    Excise_Rate: 0.0,
    Narration: "",
    Mill_Rate: 0.0,
    Created_By: "",
    Modified_By: "",
    Year_Code: Year_Code,
    Purc_Rate: 0.0,
    type: "M",
    Branch_Id: 1,
    Voucher_No: 0,
    Sell_Note_No: "",
    Brokrage: 0.0,
    mc: 0,
    itemcode: 0,
    season: "",
    pt: 0,
    tf: selfAccoid,
    td: selfAccoid,
    vb: selfAccoid,
    bk: selfAccoid,
    ic: 0,
    gstratecode: "",
    CashDiff: 0.0,
    TCS_Rate: 0.0,
    TCS_Amt: 0.0,
    commissionid: 0,
    Voucher_Type: "",
    Party_Bill_Rate: 0.0,
    TDS_Rate: 0.0,
    TDS_Amt: 0.0,
    Temptender: "N",
    AutoPurchaseBill: "Y",
    Unit: "QTL",
    // Bp_Account: 0,
    // bp: 0,
    // groupTenderNo: 0,
    // groupTenderId: 0,
    tenderid: null,
    gstid: 0,
  };

  const [formData, setFormData] = useState(initialFormData);

  const [isLoading, setIsLoading] = useState(false);
  // "Ex Mill" = the preset value gets saved as-is, comment box hidden.
  // "Ex" = reveals a comment box; whatever the user types is saved instead.
  const [exMillSelection, setExMillSelection] = useState("Ex Mill");
  const [paymentToManuallySet, setPaymentToManuallySet] = useState(false);
  const [voucherByManuallySet, setVoucherByManuallySet] = useState(false);
  const [tenderDOManuallySet, setTenderDOManuallySet] = useState(false);
  const [tenderFromManuallySet, setTenderFromManuallySet] = useState(false);
  const [shipToManuallySet, setShipToManuallySet] = useState(false);

  //Deatil
  const [users, setUsers] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMode, setPopupMode] = useState("add");
  const [selectedUser, setSelectedUser] = useState({});
  const [deleteMode, setDeleteMode] = useState(false);
  const [billTo, setBillTo] = useState("");
  const [shipTo, setShipTo] = useState("");
  const [detailBroker, setDetailBroker] = useState("");
  const [subBroker, setSubBroker] = useState("");
  const [billToAccoid, setBillToAccoid] = useState("");
  const [shipToAccoid, setShipToAccoid] = useState("");
  const [subBrokerAccoid, setSubBrokerAccoid] = useState("");
  const [self_ac_Code, setSelf_ac_code] = useState("");
  const [self_accoid, set_self_accoid] = useState("");
  const [self_acName, set_self_acName] = useState("");



  const [formDataDetail, setFormDataDetail] = useState({
    Buyer_Quantal: 0.0,
    Sale_Rate: 0.0,
    Commission_Rate: 0.0,
    Sauda_Date: new Date().toISOString().split("T")[0],
    Lifting_Date: formData?.Lifting_Date || "",
    Sauda_Lifting_Date: "",
    Sauda_Type: "F",
    Ex_Mill_Type: "Ex Mill",
    Narration: "",
    tcs_rate: 0.0,
    gst_rate: 0.0,
    tcs_amt: 0.0,
    gst_amt: 0.0,
    CashDiff: 0.0,
    Delivery_Type: dispatchType,
    sub_broker: 2,
    gradeCode: '0',
    gradeid: 0,
    Mill_Rate: 0.0,
    Purchase_Rate: 0.0,
  });

  //lock mechanism
  const { isRecordLockedByUser, lockRecord, unlockRecord } = useRecordLocking(
    formData.Tender_No,
    undefined,
    companyCode,
    Year_Code,
    "tender_purchase"
  );

  const checkTenderUsage = async (tenderNo) => {
    try {
      const res = await axios.get(`${API_URL}/check-tender-usage`, {
        params: {
          Tender_No: tenderNo,
          Company_Code: companyCode,
          Year_Code: Year_Code,
        },
      });

      if (res.data.DOCount && res.data.DOCount >= 1) {
        setIsAutoPurchaseDisabled(true);
      } else {
        setIsAutoPurchaseDisabled(false);
      }
    } catch (err) {
      console.error("Error checking tender usage:", err);
    }
  };

  const checkRate = async (item_code) => {
    try {
      const res = await axios.get(
        `${API_URL}/get-SystemMaster-SelectedRecord`,
        {
          params: {
            system_code: item_code,
            Company_Code: companyCode,
            System_Type: "I",
          },
        }
      );

      const rateData = res.data.Selected_SystemMaster_data;

      if (rateData) {
        const minRate = parseFloat(rateData.minRate);
        const maxRate = parseFloat(rateData.maxRate);

        return { minRate, maxRate };
      }
    } catch (err) {
      console.error("Error fetching system rate range:", err);
    }

    return null;
  };


  const handleRateChange = (e, index) => {
    const { name, value } = e.target;
    const val = parseFloat(value) || 0;

    setGroupData(prev => {
      const updated = [...prev];
      const currentItem = updated[index];

      if (name === "rate") {
        updated[index] = {
          ...currentItem,
          [name]: val,
          Purchase_Rate: val
        };
      } else {
        updated[index] = {
          ...currentItem,
          [name]: val
        };
      }

      return updated;
    });
  };


  const fetchGroupData = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/system_master_help?CompanyCode=${companyCode}&SystemType=S`
      );

      const data = response.data.map(row => ({
        ...row,
        Category_Code: row.Category_Code?.toString(),
      }));

      setGroupData(data)
      return data;
    } catch (error) {
      console.error("❌ Error fetching group data:", error);
      return [];
    }
  };

  useEffect(() => {
    const fetchDispatchType = async () => {
      try {
        const response = await fetch(
          `${API_URL}/get_dispatch_type/${companyCode}`
        );
        const data = await response.json();
        setDispatchType(data.dispatchType);
      } catch (error) {
        console.error("Error fetching dispatch type:", error);
      }
    };

    fetchDispatchType();
  }, [companyCode]);

  useEffect(() => {
    const socket = io(`${socketURL}`, {
      transports: ["websocket"],
    });
    socket.on("tender_added", (data) => {
      console.log("New Tender Added:", data);
    });
    socket.on("tender_updated", async (data) => {
      try {
        const { tenderdetailid, Tender_No } = data;
        if (!Tender_No) return;

        console.log("Tender Updated:", data);

        const endpoint = `${API_URL}/getTenderByTenderNo?Company_Code=${companyCode}&Tender_No=${Tender_No}`;
        await fetchTenderData(endpoint, "last");

      } catch (error) {
        console.error("Error fetching updated tender after socket event:", error);
      }
    });

    socket.on("tender_deleted", (data) => {
      console.log("Tender Deleted:", data.tenderid);
    });

    return () => {
      socket.off("tender_added");
      socket.off("tender_updated");
      socket.off("tender_deleted");
    };
  }, []);

  const isGradeInDeliveryOrder = (group) => {
    if (!group || !usedInDeliveryGrades.length) return false;

    const gradeId = group?.accoid?.toString();
    const isUsed = usedInDeliveryGrades.some(deliveryGradeId =>
      deliveryGradeId?.toString() === gradeId
    );

    return isUsed;
  };

  const gradeNameByKey = useMemo(() => {
    const map = new Map();
    (groupData || []).forEach(g => {
      const key = `${String(g.Category_Code)}_${String(g.accoid)}`;
      map.set(key, `${g.Category_Code} - ${g.Category_Name}`);
    });
    return map;
  }, [groupData]);


  const calculateValues = async (
    updatedFormData,
    updatedFormDataDetail,
    tdsApplicable,
    gstCode
  ) => {
    let {
      Quantal = 0,
      Packing = 50,
      Mill_Rate = 0,
      Purc_Rate = 0,
      Excise_Rate = 0,
      TCS_Rate = 0,
      TDS_Rate = 0,
      type = "M",
    } = updatedFormData;


    const quantal = parseFloat(Quantal) || 0;
    const packing = parseFloat(Packing) || 50;
    const millRate = parseFloat(Mill_Rate) || 0;
    const purchaseRate = parseFloat(Purc_Rate) || 0;
    const exciseRate = (millRate * gstCode) / 100 || 0;
    const tcsRate = parseFloat(TCS_Rate) || 0;
    const tdsRate = parseFloat(TDS_Rate) || 0;

    const bags = +((quantal / packing) * 100).toFixed(2);
    const diff = +(type === "M" ? 0 : millRate - purchaseRate).toFixed(2);
    const exciseAmount = +exciseRate.toFixed(2);
    const gstAmt = +(exciseAmount + millRate).toFixed(2);
    const amount = +(
      quantal * (type === "M" ? millRate + exciseRate : diff)
    ).toFixed(2);

    let tcsAmt = 0;
    let tdsAmt = 0;

    if (tdsApplicable === "Y") {
      tdsAmt = +(quantal * millRate * (tdsRate / 100)).toFixed(2);
    } else {
      tcsAmt = +((quantal * gstAmt * tcsRate) / 100).toFixed(2);
    }

    // Calculate both regardless of TDS applicability
    const calculatedTcsAmt = +((quantal * gstAmt * tcsRate) / 100).toFixed(2);
    const calculatedTdsAmt = +(quantal * millRate * (tdsRate / 100)).toFixed(2);

    const {
      Buyer_Quantal = 0,
      Sale_Rate = 0,
      tcs_rate = 0,
      gst_rate = 0,
      Commission_Rate = 0,
    } = updatedFormDataDetail;

    const buyerQuantalNum = parseFloat(Buyer_Quantal) || 0;
    const saleRateNum = parseFloat(Sale_Rate) || 0;
    const commissionRate = parseFloat(Commission_Rate) || 0;
    const tcsRateNum =
      parseFloat(tcs_rate) || parseFloat(updatedFormData.TCS_Rate) || 0;
    const gstRateNum = parseFloat(gst_rate) || gstCode || 0;

    const lblRate = +(buyerQuantalNum * (saleRateNum + commissionRate)).toFixed(
      2
    );
    const gstAmtDetail = +(lblRate * (gstRateNum / 100)).toFixed(2);
    const tcsAmtDetail = +(
      ((buyerQuantalNum * saleRateNum + gstAmtDetail) * tcsRateNum) /
      100
    ).toFixed(2);
    const lblNetAmount = +(
      lblRate +
      gstAmtDetail +
      tcsAmtDetail / buyerQuantalNum
    ).toFixed(2);
    const lblValue = +(quantal * (millRate + exciseRate)).toFixed(2);
    const lblTCSAmtWithValue = +(lblValue + tcsAmt).toFixed(2);

    return {
      bags,
      diff,
      exciseAmount,
      gstAmt,
      amount,
      lblValue,
      tcsAmt,
      tdsAmt,
      calculatedTcsAmt,
      calculatedTdsAmt,
      lblRate,
      gstAmtDetail,
      TCSAmt: tcsAmtDetail,
      lblNetAmount,
      lblTCSAmtWithValue,
    };
  };


  useEffect(() => {
    // don’t run until the very first mount finishes
    let handler = setTimeout(async () => {
      const effectiveGst = gstCode;
      const calc = await calculateValues(
        formData,
        formDataDetail,
        tdsApplicable,
        effectiveGst
      );
      setCalculatedValues(calc);
      // setDidRecalc(true);
    }, 300);

    // if any dependency changes before 300ms, clear and restart
    return () => clearTimeout(handler);
  }, [formData, formDataDetail, gstCode, gstRateCode]);

  const [calculatedValues, setCalculatedValues] = useState({
    lblRate: 0,
    amount: 0,
    tdsAmt: 0,
    diff: 0,
    gstAmtDetail: 0,
    exciseAmount: 0,
    lblValue: 0,
    TCSAmt: 0.0,
    lblNetAmount: 0,
    bags: 0,
    gstAmt: 0,
    tcsAmt: 0,
  });

  const cleanFormData = (data) => {
    const {
      lblRate,
      amount,
      tdsAmt,
      diff,
      gstAmtDetail,
      exciseAmount,
      lblValue,
      TCSAmt,
      lblNetAmount,
      bags,
      gstAmt,
      tcsAmt,
      ...cleanedData
    } = data;
    return cleanedData;
  };

  // const validGrades = groupData.filter(g => parseFloat(g.rate) > 0) || parseFloat(g.Purchase_Rate || 0) > 0;

  const validGrades = groupData.filter(g =>
    parseFloat(g.rate) > 0 || parseFloat(g.Purchase_Rate || 0) > 0
  );


  const handleMill_Code = (
    code,
    accoid,
    name,
    mobileNo,
    gstNo,
    TdsApplicable
  ) => {
    setMillCode(code);
    setPaymenToName(name);
    setTenderFrName(name);
    setVoucherByName(name);
    setTenderDOName(name);

    setFormData((prevFormData) => {
      const updatedFormData = {
        ...prevFormData,
        Mill_Code: code,
        mc: accoid,
      };

      if (!paymentToManuallySet) {
        setPaymentTo(code);
        updatedFormData.Payment_To = code;
        updatedFormData.pt = accoid;
        updatedFormData.TDS_Rate = isNewFinancialYear
          ? SaleTDSRate
          : TdsApplicable === "Y"
            ? SaleTDSRate
            : prevFormData.TDS_Rate;

        updatedFormData.TCS_Rate = isNewFinancialYear
          ? 0
          : TdsApplicable === "N"
            ? SaleTCSRate
            : 0;
      }

      if (!tenderDOManuallySet) {
        setTenderDO(code);
        updatedFormData.Tender_DO = code;
        updatedFormData.td = accoid;
      }

      if (!tenderFromManuallySet) {
        setTenderFrom(code);
        updatedFormData.Tender_From = code;
        updatedFormData.tf = accoid;
      }

      if (!voucherByManuallySet) {
        setVoucherBy(code);
        updatedFormData.Voucher_By = code;
        updatedFormData.vb = accoid;
      }

      return updatedFormData;
    });
  };


  const handleGrade = (name) => {
    setGrade(name);
    setFormData({
      ...formData,
      Grade: name,
    });
  };

  const handlePayment_To = (
    code,
    accoid,
    name,
    mobileNo,
    gstNo,
    TdsApplicable
  ) => {
    setPaymentToManuallySet(true);
    setPaymentTo(code);
    setPaymenToName(name);
    setTenderFrName(name);
    setVoucherByName(name);
    setTenderDOName(name);

    setFormData((prevFormData) => {
      const updatedFormData = {
        ...prevFormData,
        Payment_To: code,
        pt: accoid,
        TDS_Rate: isNewFinancialYear
          ? SaleTDSRate
          : TdsApplicable === "Y"
            ? SaleTDSRate
            : prevFormData.TDS_Rate,
        TCS_Rate: isNewFinancialYear
          ? 0
          : TdsApplicable === "N"
            ? SaleTCSRate
            : 0,
      };

      if (
        !tenderFromManuallySet ||
        prevFormData.Tender_From === prevFormData.Payment_To
      ) {
        updatedFormData.Tender_From = code;
        updatedFormData.tf = accoid;
      }

      if (
        !voucherByManuallySet ||
        prevFormData.Voucher_By === prevFormData.Payment_To
      ) {
        updatedFormData.Voucher_By = code;
        updatedFormData.vb = accoid;
      }

      if (
        !tenderDOManuallySet ||
        prevFormData.Tender_DO === prevFormData.Payment_To
      ) {
        updatedFormData.Tender_DO = code;
        updatedFormData.td = accoid;
      }

      const calculated = calculateValues(
        updatedFormData,
        formDataDetail,
        TdsApplicable,
        gstCode
      );
      setCalculatedValues(calculated);

      return updatedFormData;
    });
  };

  const handleTender_From = (code, accoid, name) => {
    setTenderFromManuallySet(true);
    setTenderFrName(name);
    setTenderFrom(code);
    setFormData((prevFormData) => ({
      ...prevFormData,
      Tender_From: code,
      tf: accoid,
    }));
  };

  const handleTender_DO = (code, accoid, name) => {
    setTenderDOManuallySet(true);
    setTenderDO(code);
    setTenderDOName(name);
    setTenderFrName(name);
    setVoucherBy(code);
    setVoucherByName(name);

    setFormData((prevFormData) => {
      const updatedFormData = {
        ...prevFormData,
        Tender_DO: code,
        td: accoid,
      };

      if (
        !voucherByManuallySet ||
        prevFormData.Voucher_By === prevFormData.Tender_DO
      ) {
        updatedFormData.Voucher_By = code;
        updatedFormData.vb = accoid;
      }

      if (
        !tenderFromManuallySet ||
        prevFormData.Tender_From === prevFormData.Tender_DO
      ) {
        updatedFormData.Tender_From = code;
        updatedFormData.tf = accoid;
      }

      return updatedFormData;
    });
  };


  const handleVoucher_By = (code, accoid, name) => {
    setVoucherByManuallySet(true);
    setVoucherBy(code);
    setVoucherByName(name);
    setFormData((prevFormData) => ({
      ...prevFormData,
      Voucher_By: code,
      vb: accoid,
    }));
  };


  const handleBroker = (code, accoid) => {
    setBroker(code);
    setFormData({
      ...formData,
      Broker: code,
      bk: accoid,
    });
  };

  const handleitemcode = async (code, accoid, HSN, CategoryName, gst_code) => {

    setItemCode(code);
    setGstRateCode('');
    setGstRateName('');
    handlegstratecode('', '', '', '');

    if (!code) return;

    setFormData({
      ...formData,
      itemcode: code,
      ic: accoid,
    });

    if (gst_code) {
      try {
        const response = await axios.get(`${API_URL}/gst_rate_master?Company_Code=${companyCode}`);
        const gstData = response.data;
        const gstEntry = gstData.find((item) => Number(item.Doc_no) === Number(gst_code));

        if (gstEntry) {
          const rate = gstEntry.Rate;
          setGstRateCode(gstEntry.Doc_no);
          setGstRateName(gstEntry.GST_Name);
          handlegstratecode(gst_code, rate, '', gstEntry.gstid);
        }
      } catch (error) {
        console.error("Failed to fetch GST rate:", error);
      }
    }
  };

  const handlegstratecode = (code, Rate, name, gstId) => {
    const rate = parseFloat(Rate);
    setGSTRate(code);
    setGstCode(rate);

    setFormData((prevFormData) => {
      const updatedFormData = {
        ...prevFormData,
        gstratecode: code,
        gstid: gstId,
      };

      const calculatedValues = calculateValues(
        updatedFormData,
        formDataDetail,
        tdsApplicable,
        rate
      );
      setCalculatedValues(calculatedValues);

      return updatedFormData;
    });
  };

  // const handleBp_Account = (code, accoid) => {
  //   setBpAcCode(code);
  //   setFormData({
  //     ...formData,
  //     Bp_Account: code,
  //     bp: accoid,
  //   });
  // };

  const handleBillTo = (
    code,
    accoid,
    name,
    mobileNo,
    gstNo,
    tdsApplicable,
    gstStateCode,
    commission
  ) => {
    setBillTo(code);
    setBillToName(name);
    setBillToAccoid(accoid);
    setFormDataDetail((prevDetail) => ({
      ...prevDetail,
      // Buyer: code,
      // buyerid: accoid,
      Commission_Rate: parseFloat(commission) || 0.0,
    }));

    if (!shipToManuallySet) {
      setShipTo(code);
      setShipToAccoid(accoid);
      setShipToName(name);
      // setFormDataDetail((prevDetail) => ({
      //   ...prevDetail,
      //   ShipTo: code,
      //   shiptoid: accoid,
      // }));
    }
  };

  const handleShipTo = (code, accoid, name) => {
    setShipTo(code);
    setShipToAccoid(accoid);
    setShipToName(name);
    // setFormDataDetail({
    //   ...formDataDetail,
    //   ShipTo: code,
    //   shiptoid: accoid,
    // });
  };

  const handleBuyerParty = (code, accoid, name) => {
    setBuyerParty(code);
    setBuyerPartyAccoid(accoid);
    setBuyerPartyName(name);
    // setFormDataDetail({
    //   ...formDataDetail,
    //   Buyer_Party: code,
    //   buyerpartyid: accoid,
    // });
  };

  const handleDetailSubBroker = (code, accoid, name) => {
    setSubBroker(code);
    setBrokerDetail(name);
    setSubBrokerAccoid(accoid);
    // setFormDataDetail({
    //   ...formDataDetail,
    //   sub_broker: code,
    //   sbr: accoid,
    // });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prevFormData) => {
      const updatedFormData = {
        ...prevFormData,
        [name]: value,
      };

      if (name === "Mill_Rate" && prevFormData.type === "M") {
        updatedFormData.Party_Bill_Rate = parseFloat(value) || 0;
      } else if (name === "Mill_Rate" && prevFormData.type !== "M") {
        updatedFormData.Party_Bill_Rate = parseFloat(value) || 0;
      }

      return {
        ...updatedFormData,
        Excise_Rate: parseFloat(calculatedValues.exciseAmount).toFixed(2),
      };
    });

    if (name === "gstratecode") {
      handlegstratecode(value, parseFloat(value));
    }

    setFormDataDetail((prevFormDataDetail) => {
      const updatedFormDataDetail = {
        ...prevFormDataDetail,
        gst_rate:
          name === "gstratecode"
            ? parseFloat(value) || 0
            : prevFormDataDetail.gst_rate,
        tcs_rate:
          name === "TCS_Rate"
            ? parseFloat(value) || 0
            : parseFloat(prevFormDataDetail.tcs_rate),
      };

      const calculatedValues = calculateValues(
        { ...formData, [name]: value },
        updatedFormDataDetail,
        tdsApplicable,
        name === "gstratecode" ? parseFloat(value) : gstCode
      );

      return {
        ...updatedFormDataDetail,
        tcs_amt: calculatedValues.TCSAmt,
      };
    });

    if (name === "TCS_Rate" || name === "gstratecode") {
      const updatedRate = parseFloat(value) || 0;

      setUsers((prevUsers) =>
        prevUsers.map((user) => ({
          ...user,
          tcs_rate: name === "TCS_Rate" ? updatedRate : parseFloat(user.tcs_rate),
          tcs_amt:
            name === "TCS_Rate"
              ? (user.Buyer_Quantal * user.Sale_Rate * updatedRate) / 100
              : user.tcs_amt,
          gst_rate: name === "gstratecode" ? updatedRate : user.gst_rate,
          gst_amt:
            name === "gstratecode"
              ? (user.Buyer_Quantal * user.Sale_Rate * updatedRate) / 100
              : user.gst_amt,
        }))
      );
    }
  };

  const handleGradeUpdate = (grade) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      Grade: grade,
    }));
  };

  const handleChangeDetail = (e) => {
    const { name, value } = e.target;

    setFormDataDetail((prevFormDataDetail) => {
      const updatedFormDataDetail = {
        ...prevFormDataDetail,
        [name]: name === "tcs_rate" ? parseFloat(value) || 0 : value,
      };

      const calculatedValues = calculateValues(
        formData,
        updatedFormDataDetail,
        tdsApplicable,
        gstCode
      );

      return {
        ...updatedFormDataDetail,
        tcs_amt: calculatedValues.TCSAmt,
      };
    });
  };

  const validateNumericInput = (e) => {
    e.target.value = e.target.value.replace(/[^0-9.-]/g, "");
  };

  const handleDetailDateChange = (event, fieldName) => {
    setFormDataDetail((prevFormDetailData) => ({
      ...prevFormDetailData,
      [fieldName]: event.target.value,
    }));
  };

  const handleExMillSelectionChange = (e) => {
    const value = e.target.value;
    setExMillSelection(value);
    setFormDataDetail((prev) => ({
      ...prev,
      Ex_Mill_Type: value === "Ex Mill" ? "Ex Mill" : "",
    }));
  };

  const handleCheckbox = (e, valueType = "string") => {
    const { name, checked } = e.target;
    const value =
      valueType === "numeric" ? (checked ? 1 : 0) : checked ? "Y" : "N";

    setFormDataDetail((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const fetchLastRecord = () => {
    fetch(
      `${API_URL}/getNextTenderNo_SugarTenderPurchase?Company_Code=${companyCode}&Year_Code=${Year_Code}`,
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
          Tender_No: data.next_doc_no,
          Lifting_Date: data.lifting_date,
        }));
      })
      .catch((error) => {
        console.error("Error fetching last record:", error);
      });
  };

  let isProcessing = false;

  const handleAddOne = () => {
    setAddOneButtonEnabled(false);
    setSaveButtonEnabled(true);
    setCancelButtonEnabled(true);
    setEditButtonEnabled(false);
    setDeleteButtonEnabled(false);
    setIsEditMode(false);
    setIsEditing(true);
    setFormData(initialFormData);
    fetchLastRecord();
    setLastTenderDetails([]);
    setLastTenderData({});
    setUsers([]);

    setReceivedInData([]);
    setShiftedOutData([]);
    millCodeName = "";
    newMill_Code = "";
    gradeName = "";
    newGrade = "";
    paymentToName = "";
    newPayment_To = "";
    tenderFromName = "";
    newTender_From = "";
    tenderDOName = "";
    newTender_DO = "";
    voucherByName = "";
    newVoucher_By = "";
    brokerName = "";
    newBroker = "";
    itemName = "";
    newitemcode = "";
    // bpAcName = "";
    // newBp_Account = "";
    newgstratecode = "";
    gstRateName = "";
    gstRateCode = "";
    billToName = "";
    newBillToCode = "";
    shipToName = "";
    shipToCode = "";
    subBrokerName = "";
    subBrokerCode = "";
    newTenderId = "";
    selfAcCode = "";
    selfAcName = "";
    selfAccoid = "";
    buyerPartyCode = "";
    buyer_party_name = "";
    dispatched = 0.0;
    balance = 0.0;
    setGSTRate("");
    setGstRateName("");
    setGstRateCode("");
    setItemCode("");
    fetchGroupData();
    setGroupData(
      groupData.map(row => ({
        ...row,
        rate: '',
        Purchase_Rate: '',
      }))
    );

    setTimeout(() => {
      drpType.current?.focus();
    }, 0);

    if (isProcessing) return;

    isProcessing = true;

    try {
      fetchSelfAcData();
    } catch (error) {
      console.error("Error adding record:", error);
    } finally {
      isProcessing = false;
    }
  };

  const showAlert = async (title, text, icon = "warning") => {
    setIsLoading(false);
    await Swal.fire({
      title,
      text,
      icon,
      confirmButtonText: "OK",
    });
  };



  // update grade rates function
  const updateGradeRates = async (tenderid) => {
    try {
      const response = await axios.put(`${API_URL}/update-tender-detail-grade-data`, null, {
        params: {
          tenderid: tenderid
        }
      });

      if (response.data.success) {
        console.log(`Updated ${response.data.updated_rows} grade records`);
        return true;
      } else {
        console.error('Failed to update grade rates:', response.data.error);
        return false;
      }
    } catch (error) {
      console.error('Error updating grade rates:', error);
      return false;
    }
  };

  const handleSaveOrUpdate = async (event) => {

    let missingFields = [];
    if (!formData.Mill_Rate) missingFields.push("Mill Rate");
    if (!formData.Grade) missingFields.push("Grade");
    if (!formData.Mill_Code) missingFields.push("Mill Name");
    if (!formData.Quantal) missingFields.push("Quintal");
    if (!formData.Payment_To) missingFields.push("Payment To");
    if (!formData.itemcode || formData.itemcode.toString() === "0") missingFields.push("Item Code");

    if (missingFields.length > 0) {
      Swal.fire({
        title: "warning",
        text: `Please Select the following fields: ${missingFields.join(", ")}`,
        icon: "warning",
        confirmButtonText: "OK"
      });
      return;
    }

    if (
      (formData.type === "R" || formData.type === "P") &&
      (!formData.Mill_Rate || !formData.Purc_Rate || !formData.Party_Bill_Rate)
    ) {
      return showAlert(
        "Rate warning",
        "Mill Rate, Purchase Rate or Party Bill Rate are required."
      );
    }

    setIsEditing(true);
    setIsLoading(true);

    const rateCheck = await checkRate(formData.itemcode);

    if (rateCheck) {
      const { minRate, maxRate } = rateCheck;
      const millRate = parseFloat(formData.Mill_Rate);
      const purcRate = parseFloat(formData.Purc_Rate);
      const partyBillRate = parseFloat(formData.Party_Bill_Rate);

      const isMillRateInvalid = millRate < minRate || millRate > maxRate;
      const isPurcRateInvalid =
        formData.type !== "M" && (purcRate < minRate || purcRate > maxRate);
      const isPartyBillRateInvalid =
        partyBillRate < minRate || partyBillRate > maxRate;

      const invalidSaleRateUser = users.slice(1).find((user) => {
        const saleRate = parseFloat(user.Sale_Rate);
        return !isNaN(saleRate) && (saleRate < minRate || saleRate > maxRate);
      });

      if (
        isMillRateInvalid ||
        isPurcRateInvalid ||
        isPartyBillRateInvalid ||
        invalidSaleRateUser
      ) {
        return showAlert(
          "Invalid Rate",
          `Rates must be between ${minRate} and ${maxRate}.`
        );
      }
    }

    if (!formData.gstratecode || formData.gstratecode.toString() === "0") {
      return showAlert("", "GST Rate Code is mandatory.", "warning");
    }

    try {
      let gstRate = 0;
      if (formData.gstratecode) {
        const response = await axios.get(
          `${API_URL}/get-GSTRateMasterSelectedRecord?Company_Code=${companyCode}&Doc_no=${formData.gstratecode}`
        );
        gstRate = response.data?.Rate || 0;
      }

      const calculated = await calculateValues(
        formData,
        formDataDetail,
        tdsApplicable,
        gstRate
      );

      const updatedFormData = {
        ...formData,
        Bags: calculated.bags ?? formData.Bags,
        CashDiff: calculated.diff ?? formData.CashDiff,
        TCS_Amt: calculated.tcsAmt ?? formData.TCS_Amt,
        TDS_Amt:
          calculated.tdsAmt ?? calculated.calculatedTdsAmt ?? formData.TDS_Amt,
        Excise_Rate: calculated.exciseAmount ?? formData.Excise_Rate,
        gstratecode: formData.gstratecode,
        Voucher_By:
          !formData.Voucher_By || formData.Voucher_By === 0
            ? selfAcCode
            : formData.Voucher_By,
        vb: !formData.vb || formData.vb === 0 ? selfAccoid : formData.vb,
        Tender_DO:
          !formData.Tender_DO || formData.Tender_DO === 0
            ? selfAcCode
            : formData.Tender_DO,
        td: !formData.td || formData.td === 0 ? selfAccoid : formData.td,
        Tender_From:
          !formData.Tender_From || formData.Tender_From === 0
            ? selfAcCode
            : formData.Tender_From,
        tf: !formData.tf || formData.tf === 0 ? selfAccoid : formData.tf,
      };

      let cleanedHeadData = cleanFormData(updatedFormData);

      if (isEditMode) {
        delete cleanedHeadData.tenderid;

        cleanedHeadData = {
          ...cleanedHeadData,
          Modified_By: username,
          User_Id: User_Id
        };
      } else {
        cleanedHeadData = {
          ...cleanedHeadData,
          Created_By: username,
        };
      }

      const detailData = users.map((user, index) => ({
        rowaction: user.rowaction,
        Buyer: user.Buyer || 0,
        Buyer_Quantal: user.Buyer_Quantal || 0.0,
        Sale_Rate: user.Sale_Rate || 0.0,
        Commission_Rate: user.Commission_Rate || 0.0,
        Sauda_Date: user.Sauda_Date || "",
        Lifting_Date:
          index === 0 ? formData.Lifting_Date : user.Lifting_Date || "",
        Sauda_Lifting_Date: user.Sauda_Lifting_Date || "",
        Sauda_Type: user.Sauda_Type || "F",
        Ex_Mill_Type: user.Ex_Mill_Type || "Ex Mill",
        Narration: user.Narration || "",
        ID: user.id,
        ShipTo: user.ShipTo || 0,
        AutoID: user.AutoID || 0,
        IsActive: user.IsActive || "",
        year_code: Year_Code,
        Branch_Id: user.Branch_Id || 1,
        Delivery_Type: user.Delivery_Type || dispatchType,
        tenderdetailid: user.tenderdetailid,
        buyerid: user.buyerid,
        buyerpartyid: user.buyerpartyid,
        sub_broker: user.sub_broker,
        sbr: user.sbr,
        tcs_rate: user.tcs_rate || 0.0,
        gst_rate: gstRate || user.gst_rate || 0.0,
        tcs_amt: user.tcs_amt || 0.0,
        gst_amt: index === 0 ? parseFloat(formData.Excise_Rate) : user.gst_amt,
        CashDiff: user.CashDiff || 0.0,
        shiptoid: user.shiptoid,
        Company_Code: companyCode,
        Buyer_Party: user.Buyer_Party,
        gradeCode: user.gradeCode,
        gradeid: user.gradeid,
        Mill_Rate: user.Mill_Rate,
        Purchase_Rate: user.Purchase_Rate,
      }));


      const buildGradeRateData = (forInsert) => {
        const rows = forInsert
          ? groupData.filter(g => Number(g.rate) > 0)
          : groupData.filter(
            g => g.rate !== "" && g.rate !== null && Number.isFinite(Number(g.rate))
          );

        return rows.map(g => ({
          gradeCode: g.Category_Code,
          gradeid: g.accoid,
          gradeRate: Number(g.rate),
          ...(g.Purchase_Rate !== undefined && g.Purchase_Rate !== null && Number(g.Purchase_Rate) > 0 && {
            Purchase_Rate: Number(g.Purchase_Rate)
          })
        }));
      };

      const gradeRateData = buildGradeRateData(!isEditMode);

      if (!isEditMode) {
        const hasAnyPositive = groupData.some(g => Number(g.rate) > 0);
        if (!hasAnyPositive) {
          await Swal.fire({
            icon: "warning",
            title: "Add a grade rate",
            text: "Please enter at least one grade rate greater than 0 before saving.",
            confirmButtonText: "OK",
          });
          setIsLoading(false);
          return;
        }
      }
      const requestData = {
        headData: cleanedHeadData,
        detailData,
        gradeRateData
      };

      if (isEditMode) {
        const updateApiUrl = `${API_URL}/update_tender_purchase?tenderid=${newTenderId}`;
        await axios.put(updateApiUrl, requestData);

        await updateGradeRates(newTenderId, companyCode);


        Swal.fire({
          title: "Success!",
          text: "Record Updated Successfully!",
          icon: "success",
          confirmButtonText: "OK",
        });
        unlockRecord()
      } else {
        await axios.post(`${API_URL}/insert_tender_head_detail`, requestData);
        Swal.fire({
          title: "Success!",
          text: "Record Created Successfully!",
          icon: "success",
          confirmButtonText: "OK",
        });
      }

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
      navigate(`/tender_head?navigatedRecord=${formData.Tender_No}`);
    } catch (error) {
      console.error("Error during API call:", error.response || error);
      toast.error("Error occurred while saving data");
    } finally {
      setIsLoading(false);
    }
  };


  const handleEdit = async () => {
    // const accountingYearData = sessionStorage.getItem("Accounting_Year");
    // const formattedEntryDate = formData.Tender_Date;
    // const isValid = validateDocumentDate(
    //   formattedEntryDate,
    //   accountingYearData
    // );

    // if (!isValid) {
    //   setIsLoading(false);
    //   return;
    // }

    await checkTenderUsage(formData.Tender_No);

    axios
      .get(
        `${API_URL}/getTenderByTenderNo?Company_Code=${companyCode}&Tender_No=${formData.Tender_No}`
      )
      .then(async (response) => {
        const data = response.data;
        const isLockedNew = data.last_tender_head_data.LockedRecord;
        const isLockedByUserNew = data.last_tender_head_data.LockedUser;

        const headTenderId = data.last_tender_head_data.tenderid;
        const firstDetailTenderId = data.last_tender_details_data[0]?.tenderid;

        if (headTenderId !== firstDetailTenderId) {
          Swal.fire({
            icon: "error",
            title: "Cannot Edit",
            text: "Tender ID mismatch between head and detail records. Cannot edit this record.",
            confirmButtonColor: "#d33",
          });
          setIsLoading(false);
          return;
        }

        if (isLockedNew) {
          Swal.fire({
            icon: "warning",
            title: "Record Locked",
            text: `This record is locked by ${isLockedByUserNew}`,
            confirmButtonColor: "#d33",
          });
          return;
        } else {
          lockRecord();
        }
        setFormData({
          ...formData,
          ...data.last_tender_head_data,
        });

        try {
          const deliveryGradesResponse = await axios.get(
            `${API_URL}/get-deliveryorder-grades?tenderid=${headTenderId}&Company_Code=${companyCode}`
          );

          if (deliveryGradesResponse.data.DeliveryOrderGrades) {
            const usedGradeIds = deliveryGradesResponse.data.DeliveryOrderGrades.map(
              grade => grade.gradeid
            );
            setUsedInDeliveryGrades(usedGradeIds);
          }
        } catch (error) {
          console.error("Error fetching delivery order grades:", error);
          setUsedInDeliveryGrades([]);
        }

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
          "This record is already deleted! Showing the previous record."
        );
      });
  };


  const handleDelete = async () => {
    try {
      const checkResponse = await axios.get(
        `${API_URL}/check-tender-usage?Tender_No=${formData.Tender_No}&Company_Code=${companyCode}&Year_Code=${Year_Code}`
      );

      if (checkResponse.data.isUsed) {
        const inUseMessage = checkResponse.data.UTRNo
          ? `Cannot delete: This tender number is currently associated with UTR No: ${checkResponse.data.UTRNo}.`
          : `Cannot delete: This tender number is currently associated with Delivery Order No: ${checkResponse.data.DONo}.`;

        Swal.fire({
          title: "Error",
          text: inUseMessage,
          icon: "error",
        });
        return;
      }

      const result = await Swal.fire({
        title: "Are you sure?",
        text: `You won't be able to revert this ${formData.Tender_No}`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        cancelButtonText: "Cancel",
        confirmButtonText: "Delete",
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
        setIsLoading(true);

        const deleteApiUrl = `${API_URL}/delete_TenderBytenderid?tenderid=${newTenderId}&user_id=${User_Id}`;
        const response = await axios.delete(deleteApiUrl);

        if (response.status === 200) {
          Swal.fire({
            title: "Deleted!",
            text: "The record has been deleted successfully.!",
            icon: "success",
          });
          handleCancel();

          if (formData.Voucher_No !== 0) {
            const commissionDelete = `${API_URL}/delete-CommissionBill?doc_no=${formData.Voucher_No}&Company_Code=${companyCode}&Year_Code=${Year_Code}&Tran_Type=${formData.Voucher_Type}`;
            const result = await axios.delete(commissionDelete);
            if (result.status === 200 || result.status === 201) {
              Swal.fire({
                title: "Deleted!",
                text: "Commission record has been deleted successfully.",
                icon: "success",
              });
              handleCancel();
            }
          }
        } else {
          Swal.fire({
            title: "Error",
            text: "Failed to delete the tender.",
            icon: "error",
          });
        }
      } else {
        Swal.fire({
          title: "Cancelled",
          text: "Your record is safe 🙂",
          icon: "info",
        });
      }
    } catch (error) {
      console.error("Error during API call:", error);
      Swal.fire({
        title: "Error",
        text: `There was an error during the deletion: ${error.message}`,
        icon: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {

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
      const endpoint = `${API_URL}/getlasttender_record_navigation?Company_Code=${companyCode}`;

      await fetchTenderData(endpoint, "last");

      unlockRecord();
    } catch (error) {
      console.error("Error during handleCancel API call:", error);
    }
  };

  const handleBack = () => {
    navigate("/tender-purchaseutility");
  };

  const handlerecordDoubleClicked = async () => {
    try {
      const tenderNo = selectedTenderNo || selectedRecord?.Tender_No;

      if (!tenderNo) {
        console.error("No Tender No. provided.");
        return;
      }

      const endpoint = `${API_URL}/getTenderByTenderNo?Company_Code=${companyCode}&Tender_No=${tenderNo}`;

      await fetchTenderData(endpoint, "last");

      setIsEditMode(false);
      setAddOneButtonEnabled(true);
      setEditButtonEnabled(true);
      setDeleteButtonEnabled(true);
      setBackButtonEnabled(true);
      setSaveButtonEnabled(false);
      setCancelButtonEnabled(false);
      setUpdateButtonClicked(true);
      setIsEditing(false);
    } catch (error) {
      console.error("Error fetching data during double-click:", error);
    }
  };




  useEffect(() => {
    const executeOperations = async () => {
      if (selectedRecord || selectedTenderNo) {
        setIsLoading(true);
        try {
          await handlerecordDoubleClicked();
        } catch (error) {
          console.error("Error in handlerecordDoubleClicked:", error);
        } finally {
          setIsLoading(false);
        }
      }
      else if (navigatedRecord && !isNaN(navigatedRecord) && parseInt(navigatedRecord) > 0) {
        setIsLoading(true);
        try {
          await handleNavigateRecord();
        } catch (error) {
          console.error("Error in handleNavigateRecord:", error);
        } finally {
          setIsLoading(false);
        }
      }
      else {
        setIsLoading(true);
        try {
          await handleAddOne();
        } catch (error) {
          console.error("Error in handleAddOne:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    executeOperations();
  }, [selectedRecord, selectedTenderNo]);


  const handleKeyDown = async (event) => {
    if (event.key === "Tab") {
      const changeNoValue = event.target.value;

      setIsLoading(true);

      if (!changeNoValue) {
        console.error("No value provided for Tender No.");
        return;
      }

      try {
        const endpoint = `${API_URL}/getTenderByTenderNo?Company_Code=${companyCode}&Tender_No=${changeNoValue}`;

        await fetchTenderData(endpoint, "last");

        setIsEditing(false);
      } catch (error) {
        console.error("Error fetching data on Tab key press:", error);
      }
      finally {
        setIsLoading(false);
      }
    }
  };

  const fetchSelfAcData = async () => {
    setSelfStockQty(0);
    setSelfSoldQty(0);
    setSelfEbuySold(0);
    try {
      const response = await axios.get(`${API_URL}/get_SelfAc`, {
        params: { Company_Code: companyCode },
      });

      const selfAcCode = response.data.SELF_AC;
      const selfAccoid = response.data.Self_acid;
      const selfAcName = response.data.Self_acName;

      setSelf_ac_code(selfAcCode);
      set_self_accoid(selfAccoid);
      set_self_acName(selfAcName);

      setFormData((prevData) => ({
        ...prevData,
        Broker: selfAcCode,
        bk: selfAccoid,
      }));

      setUsers([
        {
          ...formDataDetail,
          rowaction: "add",
          id: 1,
          Buyer: selfAcCode,
          billtoName: selfAcName,
          buyerid: selfAccoid,
          ShipTo: selfAcCode,
          shiptoName: selfAcName,
          shiptoid: selfAccoid,
          buyerpartyid: selfAccoid,
          sub_broker: selfAcCode,
          brokerDetail: selfAcName,
          sbr: selfAccoid,
          Buyer_Party: selfAcCode,
          buyerPartyName: selfAcName,
          Lifting_Date: formData?.Lifting_Date,
          Sauda_Date: new Date().toISOString().split("T")[0],
          gst_rate: formData.gstratecode,
          tcs_rate: parseFloat(formData.TCS_Rate),
          Delivery_Type: dispatchType,
          ID: 1,
          gradeCode: '35',
          gradeid: 1079,
          balance: 0.0,
          despatched: 0.0
        },
      ]);
    } catch (error) {
      console.log(error.response?.data?.error || "An error occurred");
    }
  };

  const handleEbuyRowClick = async (user) => {
    if (!user.tenderdetailid) return;
    setEbuyPopupRow(user);
    setEbuyPopupData([]);
    setEbuyPopupLoading(true);
    setEbuyPopupOpen(true);
    try {
      const res = await axios.get(`${API_URL}/tender-ebuy-popup`, {
        params: {
          tenderdetailid: user.tenderdetailid,
          tender_no: formData.Tender_No,
          Company_Code: companyCode,
        },
      });
      if (res.data.success) setEbuyPopupData(res.data.data);
    } catch (err) {
      console.error("eBuy popup fetch error:", err);
    } finally {
      setEbuyPopupLoading(false);
    }
  };

  const handleVoucherClick = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      const url = `/commission-bill?selectedVoucherNo=${encodeURIComponent(
        formData.Voucher_No
      )}&selectedVoucherType=${encodeURIComponent(formData.Voucher_Type)}`;
      window.open(
        url,
        "_blank",
        "toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=800,height=600"
      );
      setIsLoading(false);
    }, 500);
  };

  //detail part
  const addUser = async (e) => {
    const rateCheck = await checkRate(formData.itemcode);

    if (
      formDataDetail.Buyer_Quantal === "0" ||
      formDataDetail.Buyer_Quantal === ""
    ) {
      return showAlert(
        "Warning",
        "Please Select Buyer Quintal"
      );
    }
    if (rateCheck) {
      const { minRate, maxRate } = rateCheck;

      const currentSaleRate = parseFloat(formDataDetail.Sale_Rate);
      if (
        !isNaN(currentSaleRate) &&
        (currentSaleRate < minRate || currentSaleRate > maxRate)
      ) {
        return showAlert(
          "Invalid Rate",
          `Sale Rate must be between ${minRate} and ${maxRate}.`
        );
      }
    }

    const ValidateSalerate = parseFloat(formDataDetail.Sale_Rate);
    if (isNaN(ValidateSalerate) || ValidateSalerate <= 0) {
      return showAlert(
        "Warning",
        "Please Enter Sale Rate."
      );
    }

    // 🛠 Recalculate here safely
    const quantal = parseFloat(formDataDetail.Buyer_Quantal || 0);
    const saleRate = parseFloat(formDataDetail.Sale_Rate || 0);
    const gstRate = parseFloat(formDataDetail.gst_rate || gstCode || 0);

    const gstAmount = (quantal * saleRate * gstRate) / 100 || 0.0;

    const tcsRate = parseFloat(
      formData.TCS_Rate || formDataDetail.tcs_rate || 0
    );
    const tcsAmount = ((quantal * saleRate + gstAmount) * tcsRate) / 100 || 0.0;

    const newUser = {
      id: users.length > 0 ? Math.max(...users.map((user) => user.id)) + 1 : 1,
      Buyer: billTo,
      billtoName: billtoName,
      buyerid: billToAccoid,
      ShipTo: shipTo,
      shiptoName: shiptoName,
      shiptoid: shipToAccoid,
      sub_broker: subBroker || selfAcCode || self_ac_Code,
      brokerDetail: brokerDetail || selfAcName || self_acName,
      sbr: subBrokerAccoid || selfAccoid || self_accoid,
      Buyer_Party: buyerParty || self_ac_Code || selfAcCode,
      buyerPartyName: buyerPartyName || selfAcName || self_acName,
      buyerpartyid: buyerPartyAccoid || selfAccoid || self_accoid,

      Lifting_Date: formData.Lifting_Date || "",
      Delivery_Type: formDataDetail.Delivery_Type || dispatchType,
      ...formDataDetail,
      gst_rate: gstRate,
      gst_amt: gstAmount || calculatedValues.gstAmt,
      tcs_rate: tcsRate,
      tcs_amt: tcsAmount || calculatedValues.TCSAmt,
      rowaction: "add",
    };

    const updatedUsers = [...users];
    if (updatedUsers.length > 0) {
      const firstUser = updatedUsers[0];
      updatedUsers[0] = {
        ...firstUser,
        Buyer_Quantal:
          firstUser.Buyer_Quantal - (formDataDetail.Buyer_Quantal || 0),
      };
    }
    updatedUsers.push(newUser);
    setUsers(updatedUsers);
    closePopup();
  };

  const updateUser = async () => {
    const selectedUserOriginalQuantal =
      users.find((user) => user.id === selectedUser.id)?.Buyer_Quantal || 0;
    const newBuyerQuantal = formDataDetail.Buyer_Quantal || 0;
    const quantalDifference = newBuyerQuantal - selectedUserOriginalQuantal;
    const rateCheck = await checkRate(formData.itemcode);
    if (rateCheck) {
      const { minRate, maxRate } = rateCheck;

      const currentSaleRate = parseFloat(formDataDetail.Sale_Rate);
      if (
        !isNaN(currentSaleRate) &&
        (currentSaleRate < minRate || currentSaleRate > maxRate)
      ) {
        return showAlert(
          "Invalid Rate",
          `Sale Rate must be between ${minRate} and ${maxRate}.`
        );
      }
    }

    if (
      formDataDetail.Buyer_Quantal === "0" ||
      formDataDetail.Buyer_Quantal === ""
    ) {
      return showAlert(
        "waring",
        "Buyer Quantal should not be zero in any entry."
      );
    }

    const updatedUsers = users.map((user) => {
      if (user.id === selectedUser.id) {
        const updatedRowaction =
          user.rowaction === "Normal" ? "update" : user.rowaction;

        return {
          ...user,
          Buyer: billTo || selfAcCode,
          billtoName: billtoName || selfAcName,
          ShipTo: shipTo || selfAcCode,
          shiptoName: shiptoName || selfAcName,
          sub_broker: subBroker || selfAcCode,
          brokerDetail: brokerDetail || selfAcName,
          //BP_Detail: formDataDetail.BP_Detail,
          buyerid: billToAccoid ? billToAccoid : user.buyerid,
          shiptoid: shipToAccoid ? shipToAccoid : user.shiptoid,
          sbr: subBrokerAccoid ? subBrokerAccoid : user.sbr,
          Buyer_Party: buyerParty || selfAcCode,
          buyerPartyName: buyerPartyName || selfAcName,
          buyerpartyid: buyerPartyAccoid ? buyerPartyAccoid : user.buyerpartyid,
          Buyer_Quantal: newBuyerQuantal,
          CashDiff: formDataDetail.CashDiff,
          Commission_Rate: formDataDetail.Commission_Rate,
          //DetailBrokrage: formDataDetail.DetailBrokrage,
          Lifting_Date: formDataDetail.Lifting_Date,
          Narration: formDataDetail.Narration,
          Sale_Rate: formDataDetail.Sale_Rate,
          Sauda_Date: formDataDetail.Sauda_Date,
          Sauda_Lifting_Date: formDataDetail.Sauda_Lifting_Date,
          gst_amt:
            calculatedValues.gstAmtDetail ||
            (newBuyerQuantal * formDataDetail.Sale_Rate * gstCode) / 100 ||
            0.0,
          gst_rate: formDataDetail.gst_rate || 0.0,
          //loding_by_us: formDataDetail.loding_by_us,
          Delivery_Type: formDataDetail.Delivery_Type,
          tcs_amt: calculatedValues.TCSAmt || formDataDetail.tcs_amt,
          tcs_rate: formData.TCS_Rate || formDataDetail.tcs_rate || 0.0,
          Broker: newBroker || selfAcCode,
          brokerName: brokerName || selfAcName,
          gradeCode: formDataDetail.gradeCode,
          gradeid: formDataDetail.gradeid,
          Mill_Rate: formDataDetail.Mill_Rate,
          Purchase_Rate: formDataDetail.Purchase_Rate,
          rowaction: updatedRowaction,
        };
      } else {
        return user;
      }
    });
    if (updatedUsers.length > 0 && updatedUsers[0]) {
      updatedUsers[0] = {
        ...updatedUsers[0],
        Buyer_Quantal: updatedUsers[0].Buyer_Quantal - quantalDifference,
      };
    }
    setUsers(updatedUsers);

    closePopup();
  };

  const deleteModeHandler = async (user) => {
    try {
      const checkResponse = await axios.get(
        `${API_URL}/check-tenderdetailid-usage?TenderDetailID=${user.tenderdetailid}&Company_Code=${companyCode}&Year_Code=${Year_Code}`
      );

      const { isUsed, DONo, message } = checkResponse.data;

      if (isUsed) {
        const inUseMessage = DONo
          ? `Cannot delete: This Tender Detail ID is associated with Delivery Order No: ${DONo}.`
          : message || "Cannot delete: This Tender Detail ID is in use.";

        await Swal.fire({
          title: "Error",
          text: inUseMessage,
          icon: "error",
        });
        return;
      }
      let updatedUsers = [...users];
      const userQuantal = parseFloat(user.Buyer_Quantal) || 0;

      if (isEditMode && user.rowaction === "add") {
        setDeleteMode(true);
        setSelectedUser(user);

        if (updatedUsers.length > 0) {
          updatedUsers[0] = {
            ...updatedUsers[0],
            Buyer_Quantal: updatedUsers[0].Buyer_Quantal + userQuantal,
          };
        }

        updatedUsers = updatedUsers.map((u) =>
          u.id === user.id ? { ...u, rowaction: "DNU" } : u
        );
      } else if (isEditMode) {
        setDeleteMode(true);
        setSelectedUser(user);

        if (updatedUsers.length > 0) {
          updatedUsers[0] = {
            ...updatedUsers[0],
            Buyer_Quantal: updatedUsers[0].Buyer_Quantal + userQuantal,
          };
        }

        updatedUsers = updatedUsers.map((u) =>
          u.id === user.id ? { ...u, rowaction: "delete" } : u
        );
      } else {
        setDeleteMode(true);
        setSelectedUser(user);

        if (updatedUsers.length > 0) {
          updatedUsers[0] = {
            ...updatedUsers[0],
            Buyer_Quantal: updatedUsers[0].Buyer_Quantal + userQuantal,
          };
        }

        updatedUsers = updatedUsers.map((u) =>
          u.id === user.id ? { ...u, rowaction: "DNU" } : u
        );
      }

      setUsers(updatedUsers);
      setSelectedUser({});
    } catch (error) {
      console.error("Error in deleteModeHandler:", error);
      await Swal.fire({
        title: "Error",
        text: "An error occurred while checking tender usage.",
        icon: "error",
      });
    }
  };

  const openDelete = async (user) => {
    setDeleteMode(true);
    setSelectedUser(user);
    let updatedUsers = [...users];
    const userQuantal = parseFloat(user.Buyer_Quantal) || 0;

    if (isEditMode && user.rowaction === "delete") {
      if (updatedUsers.length > 0) {
        updatedUsers[0] = {
          ...updatedUsers[0],
          Buyer_Quantal: updatedUsers[0].Buyer_Quantal - userQuantal,
        };
      }

      updatedUsers = updatedUsers.map((u) =>
        u.id === user.id ? { ...u, rowaction: "Normal" } : u
      );
    } else {
      if (updatedUsers.length > 0) {
        updatedUsers[0] = {
          ...updatedUsers[0],
          Buyer_Quantal: updatedUsers[0].Buyer_Quantal - userQuantal,
        };
      }

      updatedUsers = updatedUsers.map((u) =>
        u.id === user.id ? { ...u, rowaction: "add" } : u
      );
    }

    setUsers(updatedUsers);
    setSelectedUser({});
  };

  const openPopup = (mode) => {
    setPopupMode(mode);
    setShowPopup(true);
    if (mode === "add") {
      clearForm();
    }
  };

  const closePopup = () => {
    setShowPopup(false);
    setSelectedUser({});
    clearForm();
  };

  const clearForm = () => {
    setExMillSelection("Ex Mill");
    setFormDataDetail({
      Buyer_Quantal: "",
      Sale_Rate: 0.0,
      Commission_Rate: 0.0,
      Sauda_Date: new Date().toISOString().split("T")[0],
      Lifting_Date: formData.Lifting_Date,
      Sauda_Lifting_Date: "",
      Sauda_Type: "F",
      Ex_Mill_Type: "Ex Mill",
      Narration: "",
      tcs_rate: 0.0,
      gst_rate: 0.0,
      tcs_amt: 0.0,
      gst_amt: 0.0,
      CashDiff: 0.0,
      gradeCode: 0,
      gradeid: 0,
      Mill_Rate: 0.0,
      Purchase_Rate: 0.0,
      //BP_Detail: "",
      //loding_by_us: "",
      //DetailBrokrage: "",
    });
    setBillTo("");
    setShipTo("");
    setSubBroker("");
    setBillToAccoid("");
    setShipToAccoid("");
    setSubBrokerAccoid("");
    setBillToName("");
    setShipToName("");
    setBrokerDetail("");
    setDetailBroker("");
    setBuyerParty("");
    setBuyerPartyAccoid("");
    setBuyerPartyName("");

    selfAcCode = "";
    selfAcName = "";
    selfAccoid = "";
  };

  const editUser = async (user) => {
    const checkResponse = await axios.get(
      `${API_URL}/check-tenderdetailid-usage?TenderDetailID=${user.tenderdetailid}&Company_Code=${companyCode}&Year_Code=${Year_Code}`
    );

    const { isUsed, DONo, message } = checkResponse.data;
    if (isUsed) {
      setIsDetailGradeDisabled(true)
    }
    else {
      setIsDetailGradeDisabled(false)
    }
    setSelectedUser(user);

    setBillTo(user.Buyer);
    setShipTo(user.ShipTo);
    setSubBroker(user.sub_broker);
    setBillToName(user.billtoName);
    setShipToName(user.shiptoName);
    setBrokerDetail(user.brokerDetail);
    setBuyerParty(user.Buyer_Party);
    setBuyerPartyName(user.buyerPartyName);
    setBillToAccoid(user.billToAccoid);
    setBuyerPartyAccoid(user.buyerPartyAccoid);
    setShipToAccoid(user.shipToAccoid);
    setSubBrokerAccoid(user.subBrokerAccoid);
    // Reflect the loaded row's actual Ex_Mill_Type in the dropdown - not
    // exclusively "Ex Mill", the comment box stays hidden and the saved
    // custom text becomes invisible even though formDataDetail still holds it.
    setExMillSelection(user.Ex_Mill_Type && user.Ex_Mill_Type !== "Ex Mill" ? "Ex" : "Ex Mill");
    setFormDataDetail({
      Buyer_Quantal: user.Buyer_Quantal || 0.0,
      Sale_Rate: user.Sale_Rate || 0.0,
      Commission_Rate: user.Commission_Rate || 0.0,
      Sauda_Date: user.Sauda_Date || 0.0,
      Lifting_Date: user.Lifting_Date || 0.0,
      Sauda_Lifting_Date: user.Sauda_Lifting_Date || "",
      Sauda_Type: user.Sauda_Type || "F",
      Ex_Mill_Type: user.Ex_Mill_Type || "Ex Mill",
      Narration: user.Narration || 0.0,
      tcs_rate: user.tcs_rate || 0.0,
      gst_rate: user.gst_rate || 0.0,
      tcs_amt: user.tcs_amt || 0.0,
      gst_amt: parseFloat(user.gst_amt).toFixed(2) || 0.0,
      CashDiff: user.CashDiff || 0.0,
      Delivery_Type: user.Delivery_Type || dispatchType,
      gradeCode: user.gradeCode?.toString() || '',
      gradeid: user.gradeid,
      Mill_Rate: user.Mill_Rate,
      Purchase_Rate: user.Purchase_Rate,
      //BP_Detail: user.BP_Detail || 0.0,
      // loding_by_us: user.loding_by_us || 0.0,
      // DetailBrokrage: user.DetailBrokrage || 0.0,
    });
    openPopup("edit");
  };

  useEffect(() => {
    if (selectedRecord) {
      setUsers(
        lastTenderDetails.map((detail) => ({
          Buyer: detail.Buyer,
          billtoName: detail.billtoName,
          ShipTo: detail.ShipTo,
          shiptoName: detail.shiptoName,
          Buyer_Party: detail.Buyer_Party,
          buyerPartyName: detail.buyerPartyName,
          sub_broker: detail.sub_broker,
          brokerDetail: detail.brokerDetail,
          //BP_Detail: detail.BP_Detail,
          Buyer_Quantal:
            detail.Buyer_Quantal !== undefined ? detail.Buyer_Quantal : 0,
          CashDiff: detail.CashDiff,
          Commission_Rate: detail.Commission_Rate,
          //DetailBrokrage: detail.DetailBrokrage,
          Lifting_Date: detail.Lifting_Date,
          Narration: detail.Narration,
          Sale_Rate: detail.Sale_Rate,
          Sauda_Date: detail.Sauda_Date,
          Sauda_Lifting_Date: detail.Sauda_Lifting_Date,
          Sauda_Type: detail.Sauda_Type,
          Ex_Mill_Type: detail.Ex_Mill_Type,
          gst_amt: detail.gst_amt,
          gst_rate: detail.gst_rate,
          //loding_by_us: detail.loding_by_us,
          Delivery_Type: detail.Delivery_Type,
          tenderdetailid: detail.tenderdetailid,
          id: detail.ID,
          tcs_rate: detail.tcs_rate,
          tcs_amt: detail.tcs_amt,
          buyerid: detail.buyerid,
          buyerpartyid: detail.buyerpartyid,
          sbr: detail.sbr,
          gst_rate: detail.gst_rate,
          despatched: detail.despatched,
          balance: detail.balance,
          gradeCode: detail.gradeCode?.toString(),
          gradeid: detail.gradeid,
          Mill_Rate: detail.Mill_Rate,
          Purchase_Rate: detail.Purchase_Rate,
          ebuyid: detail.ebuyid ?? null,
          rowaction: "Normal",
        }))
      );
    }
  }, [selectedRecord, lastTenderDetails]);

  useEffect(() => {
    const updatedUsers = lastTenderDetails.map((detail) => ({
      Buyer: detail.Buyer,
      billtoName: detail.buyername,
      ShipTo: detail.ShipTo,
      shiptoName: detail.ShipToname,
      Buyer_Party: detail.Buyer_Party,
      buyerPartyName: detail.buyerpartyname,
      sub_broker: detail.sub_broker,
      brokerDetail: detail.subbrokername,
      //BP_Detail: detail.BP_Detail,
      Buyer_Quantal:
        detail.Buyer_Quantal !== undefined ? detail.Buyer_Quantal : 0,
      CashDiff: detail.CashDiff,
      Commission_Rate: detail.Commission_Rate,
      //DetailBrokrage: detail.DetailBrokrage,
      Lifting_Date: detail.payment_date,
      Narration: detail.Narration || "",
      Sale_Rate: detail.Sale_Rate,
      Sauda_Date: detail.Sauda_Date,
      Sauda_Lifting_Date: detail.Sauda_Lifting_Date,
      Sauda_Type: detail.Sauda_Type,
      Ex_Mill_Type: detail.Ex_Mill_Type,
      gst_amt: detail.gst_amt,
      gst_rate: detail.gst_rate,
      //loding_by_us: detail.loding_by_us,
      Delivery_Type: detail.Delivery_Type,
      tenderdetailid: detail.tenderdetailid,
      id: detail.ID,
      tcs_rate: detail.tcs_rate,
      tcs_amt: detail.tcs_amt,
      buyerid: detail.buyerid,
      buyerpartyid: detail.buyerpartyid,
      sbr: detail.sbr,
      despatched: detail.despatched,
      balance: detail.balance,
      gradeCode: detail.gradeCode?.toString(),
      gradeid: detail.gradeid,
      Mill_Rate: detail.Mill_Rate,
      Purchase_Rate: detail.Purchase_Rate,
      ebuyid: detail.ebuyid ?? null,
      rowaction: "Normal",
    }));
    setUsers(updatedUsers);
  }, [lastTenderDetails]);


  useEffect(() => {
    setUsers(prevUsers => {
      if (!prevUsers || prevUsers.length === 0) return prevUsers;

      const updated = [...prevUsers];

      // 1) First row: use Quantal if provided, otherwise keep existing
      const first = updated[0];
      const newBuyerQuantal =
        formData.Quantal !== undefined ? (parseFloat(formData.Quantal) || 0) : (first.Buyer_Quantal || 0);

      const saleRate = first.Sale_Rate || 0;
      const newGstRate = gstCode ?? first.gst_rate;
      const newGstAmt = ((newBuyerQuantal * newGstRate * saleRate) / 100) || 0;

      updated[0] = {
        ...first,
        Buyer_Quantal: newBuyerQuantal,
        gst_rate: newGstRate,
        gst_amt: newGstAmt,
        rowaction: first.rowaction === "add" ? "add" : "update",
      };

      // 2) Remaining = first - sum(others)
      let remaining = updated[0].Buyer_Quantal;
      for (let i = 1; i < updated.length; i++) {
        remaining -= parseFloat(updated[i].Buyer_Quantal || 0);
      }
      updated[0] = { ...updated[0], Buyer_Quantal: remaining };

      return updated;
    });
  }, [formData.Quantal, gstCode]);


  const handleBuyerQuantalUpdate = () => {
    if (users.length > 0) {
      const updatedUsers = [...users];

      if (formData.Quantal !== undefined) {
        const firstUser = updatedUsers[0];
        const newBuyerQuantal = parseFloat(formData.Quantal) || 0;
        const newGstRate = gstCode || firstUser.gst_rate;
        const newGstAmt =
          (newBuyerQuantal * newGstRate * (firstUser.Sale_Rate || 0)) / 100 ||
          0.0;

        updatedUsers[0] = {
          ...firstUser,
          Buyer_Quantal: newBuyerQuantal,
          gst_rate: newGstRate,
          gst_amt: newGstAmt,
          rowaction: firstUser.rowaction === "add" ? "add" : "update",
        };
      }

      if (updatedUsers.length > 1) {
        let remainingQuantal = updatedUsers[0].Buyer_Quantal;

        for (let i = 1; i < updatedUsers.length; i++) {
          const currentUser = updatedUsers[i];
          const userQuantal = currentUser.Buyer_Quantal || 0;

          remainingQuantal -= userQuantal;
          updatedUsers[0].Buyer_Quantal = remainingQuantal;
        }
      }
      setUsers(updatedUsers);
    }
  };

  const TCSCalculationDetail = (e) => {
    if (e.key === "Tab") {
      const updatedCalculatedValues = calculateValues(
        formData,
        formDataDetail,
        tdsApplicable,
        gstCode
      );
      setFormDataDetail((prevFormDataDetail) => ({
        ...prevFormDataDetail,
        tcs_amt: updatedCalculatedValues.TCSAmt || 0,
      }));
    }
  };

  //common function for navigation and fetching perticular record
  const fetchTenderData = async (endpoint, action) => {
    try {
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();


        const headData = data[`${action}_tender_head_data`] || {};
        const detailsData = data[`${action}_tender_details_data`] || [];
        const gradeData = data[`${action}_tender_grade_data`] || [];


        newTenderId = headData.tenderid;
        millCodeName = detailsData[0]?.MillName || "";
        newMill_Code = headData.Mill_Code;
        gradeName = headData.Grade;
        paymentToName = detailsData[0]?.PaymentToAcName || "";
        newPayment_To = headData.Payment_To;
        tenderFromName = detailsData[0]?.TenderFromAcName || "";
        newTender_From = headData.Tender_From;
        tenderDOName = detailsData[0]?.TenderDoAcName || "";
        newTender_DO = headData.Tender_DO;
        voucherByName = detailsData[0]?.VoucherByAcName || "";
        newVoucher_By = headData.Voucher_By;
        brokerName = detailsData[0]?.BrokerAcName || "";
        newBroker = headData.Broker;
        itemName = detailsData[0]?.ItemName || "";
        newitemcode = headData.itemcode;
        gstRateName = detailsData[0]?.GST_Name || "";
        gstRateCode = detailsData[0]?.GSTRate || 0;
        newgstratecode = headData.gstratecode;
        // bpAcName = detailsData[0]?.BPAcName || "";
        // newBp_Account = headData.Bp_Account;
        billToName = detailsData[0]?.buyername || "";
        newBillToCode = detailsData[0]?.Buyer || 0;
        shipToName = detailsData[0]?.ShipToname || "";
        shipToCode = detailsData[0]?.ShipTo || 0;
        subBrokerName = detailsData[0]?.subbrokername || "";
        subBrokerCode = detailsData[0]?.sub_broker || 0;
        buyerPartyCode = detailsData[0]?.Buyer_Party || 0;
        buyer_party_name = detailsData[0]?.buyerpartyname || "";
        balance = Number(detailsData?.[0]?.balance ?? 0);
        dispatched = Number(detailsData?.[0]?.despatched ?? 0);

        const tenderGradesFromDetails = gradeData.reduce((acc, item) => {
          const code = item.gradeCode?.toString();
          const id = item.gradeid?.toString();
          if (code && id) {
            acc[`${code}_${id}`] = {
              rate: parseFloat(item.gradeRate) || 0,
              Purchase_Rate: parseFloat(item.Purchase_Rate) || 0
            };
          }
          return acc;
        }, {});


        const fullGradeList = await fetchGroupData();
        if (!Array.isArray(fullGradeList)) {
          console.error("Invalid grade list from fetchGroupData");
          return;
        }

        const mergedGrades = fullGradeList.map((grade) => {
          const code = grade.Category_Code.toString();
          const id = grade.accoid.toString();
          const key = `${code}_${id}`;
          const gradeData = tenderGradesFromDetails[key];

          return {
            Category_Code: code,
            accoid: grade.accoid,
            Category_Name: grade.Category_Name,
            rate: gradeData?.rate || 0,
            Purchase_Rate: gradeData?.Purchase_Rate || 0,
          };
        });
        setGroupData(mergedGrades);

        // Shift tables — safe, independent of the rest of the logic
        setReceivedInData(Array.isArray(data.ReceivedIn) ? data.ReceivedIn : []);
        setShiftedOutData(Array.isArray(data.ShiftedOut) ? data.ShiftedOut : []);



        setFormData((prevData) => ({
          ...prevData,
          ...headData,
        }));

        // Fetch eBuySugar self stock qty for the Self row (id=1) — view only
        if (newTenderId) {
          try {
            const selfRes = await axios.get(`${API_URL}/ebuysugargetSelfStockByTender`, {
              params: { tenderid: newTenderId },
            });
            const selfRec = selfRes.data.records?.[0];
            setSelfStockQty(parseFloat(selfRec?.selfqty ?? 0));
            setSelfSoldQty(parseFloat(selfRec?.sqntl ?? 0));
            setSelfEbuySold(parseFloat(selfRec?.esold ?? 0));
          } catch {
            setSelfStockQty(0);
            setSelfSoldQty(0);
            setSelfEbuySold(0);
          }
        }

        setLastTenderData(headData || {});
        setLastTenderDetails(detailsData || []);
        setUsers(
          detailsData.map((detail) => ({
            Buyer: detail.Buyer,
            billtoName: detail.buyername,
            ShipTo: detail.ShipTo,
            shiptoName: detail.ShipToname,
            Buyer_Party: detail.Buyer_Party,
            buyerPartyName: detail.buyerpartyname,
            sub_broker: detail.sub_broker,
            brokerDetail: detail.subbrokername,
            // BP_Detail: detail.BP_Detail,
            Buyer_Quantal:
              detail.Buyer_Quantal !== undefined ? detail.Buyer_Quantal : 0,
            CashDiff: detail.CashDiff,
            Commission_Rate: detail.Commission_Rate,
            //DetailBrokrage: detail.DetailBrokrage,
            Lifting_Date: detail.payment_date,
            Narration: detail.Narration || "",
            Sale_Rate: detail.Sale_Rate,
            Sauda_Date: detail.Sauda_Date,
          Sauda_Lifting_Date: detail.Sauda_Lifting_Date,
          Sauda_Type: detail.Sauda_Type,
          Ex_Mill_Type: detail.Ex_Mill_Type,
            gst_amt: detail.gst_amt,
            gst_rate: detail.gst_rate,
            //loding_by_us: detail.loding_by_us,
            Delivery_Type: detail.Delivery_Type,
            tenderdetailid: detail.tenderdetailid,
            id: detail.ID,
            tcs_rate: detail.tcs_rate,
            tcs_amt: detail.tcs_amt,
            buyerid: detail.buyerid,
            buyerpartyid: detail.buyerpartyid,
            sbr: detail.sbr,
            rowaction: "Normal",
            despatched: detail.despatched,
            balance: detail.balance,
            gradeCode: detail.gradeCode?.toString(),
            gradeid: detail.gradeid,
            Mill_Rate: detail.Mill_Rate,
            Purchase_Rate: detail.Purchase_Rate,
            ebuyid: detail.ebuyid ?? null,
          }))
        );
      } else {
        console.error(
          `Failed to fetch ${action} record:`,
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error(`Error during API call for ${action}:`, error);
    }
  };

  // Handle the "First" button
  const handleFirstButtonClick = async () => {
    const endpoint = `${API_URL}/getfirsttender_record_navigation?Company_Code=${companyCode}`;
    await fetchTenderData(endpoint, "first");
  };

  // Handle the "Previous" button
  const handlePreviousButtonClick = async () => {
    const endpoint = `${API_URL}/getprevioustender_navigation?CurrenttenderNo=${formData.Tender_No}&Company_Code=${companyCode}`;
    await fetchTenderData(endpoint, "previous");
  };

  // Handle the "Next" button
  const handleNextButtonClick = async () => {
    const endpoint = `${API_URL}/getnexttender_navigation?CurrenttenderNo=${formData.Tender_No}&Company_Code=${companyCode}`;
    await fetchTenderData(endpoint, "next");
  };

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
      const endpoint = `${API_URL}/getTenderByTenderNo?Company_Code=${companyCode}&Tender_No=${navigatedRecord}`;

      await fetchTenderData(endpoint, "last");
    } catch (error) {
      console.error("Error during API call:", error);
    }
  };

  const isAnyDispatched = users.some(user => Number(user.despatched || user.dispatched || 0) > 0);

  return (
    <>
      <UserAuditInfo
        createdBy={formData.Created_By}
        modifiedBy={formData.Modified_By}
        title={"Tender Purchase"}
      />
      <ToastContainer autoClose={500} />
      <div style={{ marginTop: "30px" }}>
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
        />
        {/* <NavigationButtons
          handleFirstButtonClick={handleFirstButtonClick}
          handlePreviousButtonClick={handlePreviousButtonClick}
          handleNextButtonClick={handleNextButtonClick}
          handleLastButtonClick={handleCancel}
          highlightedButton={highlightedButton}
          isEditing={isEditing}
        /> */}
      </div>
      <form className="SugarTenderPurchase-container" onSubmit={handleSubmit}>
        <div className="SugarTenderPurchase-row">
          <Grid container spacing={1}>
            <Grid
              item
              xs={12}
              sm={4}
              md={0.5}
              sx={{ padding: 0, minWidth: "100px", maxWidth: "100px" }}
            >
              <TextField
                label="Change No"
                variant="outlined"
                name="changeNo"
                onKeyDown={handleKeyDown}
                disabled={!addOneButtonEnabled}
                fullWidth
                autoComplete="off"
                tabIndex={1}
                size="small"
                InputLabelProps={{
                  style: { fontSize: "12px" },
                }}
                InputProps={{
                  style: { fontSize: "12px", height: "30px" },
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    height: "30px",
                    padding: "0px 10px",
                  },
                }}
              />
            </Grid>

            <Grid
              item
              xs={12}
              sm={4}
              md={0.8}
              sx={{ padding: 0, minWidth: "100px", maxWidth: "100px" }}
            >
              <TextField
                label="Tender No"
                variant="outlined"
                name="Tender_No"
                value={formData.Tender_No}
                onChange={handleChange}
                disabled
                fullWidth
                size="small"
                InputLabelProps={{
                  style: { fontSize: "12px", marginTop: "-4px" },
                }}
                InputProps={{
                  style: { fontSize: "12px", height: "30px" },
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    height: "30px",
                    padding: "0px 10px",
                  },
                }}
              />
            </Grid>

            <Grid
              item
              xs={12}
              sm={4}
              md={1}
              sx={{ padding: 0, minWidth: "100px", maxWidth: "100px" }}
            >
              <FormControl
                fullWidth
                variant="outlined"
                disabled={!isEditing && addOneButtonEnabled}
                sx={{
                  "& .MuiInputLabel-root": {
                    fontSize: "14px",
                    paddingTop: "0px",
                  },
                }}
              >
                <InputLabel>Resale/Mill</InputLabel>
                <Select
                  value={formData.type}
                  onChange={handleChange}
                  disabled={isEditMode || addOneButtonEnabled}
                  label="Resale/Mill"
                  name="type"
                  size="small"
                  inputRef={drpType}
                  sx={{
                    fontSize: "10px",
                    "& .MuiOutlinedInput-root": {
                      height: "25px",
                      padding: "0px 5px",
                    },
                    "& .MuiSelect-icon": {
                      minWidth: "20px",
                    },
                  }}
                >
                  <MenuItem value="R">Resale</MenuItem>
                  <MenuItem value="M">Mill</MenuItem>
                  <MenuItem value="W">With Payment</MenuItem>
                  <MenuItem value="P">Party Bill Rate</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid
              item
              xs={12}
              sm={4}
              md={1}
              sx={{ padding: 0, minWidth: "100px", maxWidth: "100px" }}
            >
              <FormControl
                fullWidth
                variant="outlined"
                disabled={
                  isAutoPurchaseDisabled || (!isEditing && addOneButtonEnabled)
                }
                sx={{
                  "& .MuiInputLabel-root": {
                    fontSize: "14px",
                    paddingTop: "0px",
                  },
                }}
              >
                <InputLabel>Auto Purchase Bill</InputLabel>
                <Select
                  value={formData.AutoPurchaseBill}
                  onChange={handleChange}
                  label="Auto Purchase Bill"
                  name="AutoPurchaseBill"
                  size="small"
                  sx={{
                    fontSize: "10px",
                    "& .MuiOutlinedInput-root": {
                      height: "25px",
                      padding: "0px 5px",
                    },
                    "& .MuiSelect-icon": {
                      minWidth: "20px",
                    },
                  }}
                  InputLabelProps={{
                    style: { fontSize: "10px" },
                    shrink: true,
                  }}
                  InputProps={{
                    style: { fontSize: "10px", height: "25px" },
                  }}
                >
                  <MenuItem value="Y">Yes</MenuItem>
                  <MenuItem value="N">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={1} onClick={handleVoucherClick}>
              <TextField
                label="Voucher No"
                variant="outlined"
                name="Voucher_No"
                value={formData.Voucher_No}
                onChange={handleChange}
                disabled
                fullWidt
                size="small"
                InputLabelProps={{
                  style: { fontSize: "14px" },
                }}
                InputProps={{
                  style: { fontSize: "14px", height: "30px", fontWeight: "bold" },
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    height: "30px",
                    padding: "0px 10px",
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={0.2} >
              <Link
                onClick={handleVoucherClick}
                style={{ textDecoration: "none" }}
              >
                <Typography
                  color={"red"}
                  variant="h6"
                  style={{ cursor: "pointer" }}
                >
                  {formData.Voucher_Type}
                </Typography>
              </Link>
            </Grid>

            <Grid item xs={12} sm={6} md={0.8}>
              <TextField
                label="Date"
                variant="outlined"
                type="date"
                name="Tender_Date"
                value={formData.Tender_Date}
                onChange={handleChange}
                disabled={!isEditing && addOneButtonEnabled}
                fullWidth
                size="small"
                InputLabelProps={{
                  style: { fontSize: "14px" },
                  shrink: true,
                }}
                InputProps={{
                  style: {
                    fontSize: "12px",
                    height: "30px",
                    fontWeight: "700",
                  },
                }}
                tabIndex={7}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={0.8}>
              <TextField
                label="Payment Date"
                variant="outlined"
                type="date"
                name="Lifting_Date"
                value={formData.Lifting_Date}
                onChange={handleChange}
                disabled={!isEditing && addOneButtonEnabled}
                fullWidth
                size="small"
                InputLabelProps={{
                  style: { fontSize: "14px" },
                  shrink: true,
                }}
                InputProps={{
                  style: {
                    fontSize: "12px",
                    height: "30px",
                    fontWeight: "700",
                  },
                }}
                tabIndex={8}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={1}>
              <TextField
                label="Group Tender No"
                variant="outlined"
                type="text"
                name="groupTenderNo"
                value={formData.groupTenderNo}
                onChange={handleChange}
                disabled={!isEditing && addOneButtonEnabled}
                fullWidth
                size="small"
                InputLabelProps={{
                  style: { fontSize: "14px" },
                }}
                InputProps={{
                  style: {
                    fontSize: "12px",
                    height: "30px",
                    fontWeight: "700",
                  },
                }}
                tabIndex={9}
              />
            </Grid>
          </Grid>
        </div>

        <div className="SugarTenderPurchase-row">
          <Grid container spacing={1} mt={-2}>
            <Grid item xs={12} sm={6} md={3}>
              <div className="TenderPurchaseHelp-row">
                <label htmlFor="Mill_Code" className="TenderPurchaseHelpLabel">
                  Mill Name :
                </label>
                <div>
                  <div>
                    <AccountMasterHelp
                      name="Mill_Code"
                      onAcCodeClick={handleMill_Code}
                      CategoryName={millCodeName}
                      CategoryCode={newMill_Code}
                      Ac_type={["M"]}
                      disabledFeild={!isEditing && addOneButtonEnabled}
                      size="small"
                    />
                  </div>
                </div>
              </div>
            </Grid>
          </Grid>
        </div>

        <div className="SugarTenderPurchase-row">
          <Grid item xs={12} sm={6} md={3}>
            <div className="TenderPurchaseHelp-row">
              <label htmlFor="Bill_From" className="TenderPurchaseHelpLabel">
                Item Code:
              </label>
              <div>
                <div>
                  <SystemHelpMaster
                    name="itemcode"
                    onAcCodeClick={handleitemcode}
                    CategoryName={itemName}
                    CategoryCode={newitemcode}
                    disabledField={!isEditing && addOneButtonEnabled}
                    SystemType="I"
                  />
                </div>
              </div>
            </div>
          </Grid>

          <Grid
            item
            xs={12}
            sm={4}
            md={0.5}
            sx={{
              padding: 0,
              minWidth: "100px",
              maxWidth: "100px",
              marginLeft: "10px",
            }}
          >
            <TextField
              label="Season"
              variant="outlined"
              type="text"
              name="season"
              autoComplete="off"
              value={formData.season}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              size="small"
              InputLabelProps={{
                style: { fontSize: "14px" },
              }}
              InputProps={{
                style: { fontSize: "12px", height: "36px", fontWeight: "700" },
              }}
            />
          </Grid>

          <Grid item xs={12} sm={3} md={2.1}>
            <div className="TenderPurchaseHelp-row">
              <label htmlFor="Grade" className="TenderPurchaseHelpLabel">
                Grade :
              </label>
              <div>
                <div>
                  <GradeMasterHelp
                    name="Grade"
                    onAcCodeClick={handleGrade}
                    CategoryName={formData.Grade || newGrade}
                    disabledField={!isEditing || !addOneButtonEnabled}
                    onCategoryChange={handleGradeUpdate}
                  />
                </div>
              </div>
            </div>
          </Grid>

        </div>

        <Grid container spacing={1} alignItems="center" justifyContent="flex-start">
          <Grid item xs={12} sm={1}>
            <TextField
              fullWidth
              label="Quintal"
              variant="outlined"
              type="text"
              name="Quantal"
              autoComplete="off"
              value={formData.Quantal}
              onChange={(e) => {
                validateNumericInput(e);
                handleChange(e);
              }}
              disabled={!isEditing && addOneButtonEnabled}
              size="small"
              InputLabelProps={{ style: { fontSize: "14px" } }}
              InputProps={{
                style: {
                  fontSize: "12px",
                  height: "36px",
                  fontWeight: "700",
                  width: "100%",
                },
              }}
            />
          </Grid>

          <Grid item xs={12} sm={1}>
            <TextField
              fullWidth
              label="Packing"
              id="Packing"
              name="Packing"
              autoComplete="off"
              value={formData.Packing}
              onChange={(e) => {
                validateNumericInput(e);
                handleChange(e);
              }}
              disabled={!isEditing && addOneButtonEnabled}
              variant="outlined"
              type="text"
              size="small"
              InputLabelProps={{ style: { fontSize: "14px" } }}
              InputProps={{
                style: {
                  fontSize: "12px",
                  height: "36px",
                  fontWeight: "700",
                  width: "100%",
                },
              }}
            />
          </Grid>

          <Grid item xs={12} sm={1}>
            <TextField
              fullWidth
              label="Bags"
              id="Bags"
              name="Bags"
              autoComplete="off"
              value={formData.Bags || calculatedValues.bags}
              onChange={(e) => {
                validateNumericInput(e);
                handleChange(e);
              }}
              disabled
              variant="outlined"
              type="text"
              size="small"
              InputLabelProps={{
                style: { fontSize: "14px" },
              }}
              InputProps={{
                style: {
                  fontSize: "12px",
                  height: "36px",
                  fontWeight: "700",
                  width: "100%",
                },
              }}
            />
          </Grid>

          <Grid item xs={12} sm={1}>
            <TextField
              fullWidth
              label="Mill Rate"
              id="Mill_Rate"
              name="Mill_Rate"
              autoComplete="off"
              value={formData.Mill_Rate}
              onChange={(e) => {
                validateNumericInput(e);
                handleChange(e);
              }}
              disabled={!isEditing && addOneButtonEnabled}
              variant="outlined"
              type="text"
              size="small"
              InputLabelProps={{
                style: { fontSize: "14px" },
              }}
              InputProps={{
                style: {
                  fontSize: "12px",
                  height: "36px",
                  fontWeight: "700",
                  width: "100%",
                },
              }}
            />
          </Grid>

          <Grid item xs={12} sm={1}>
            <TextField
              fullWidth
              label="Purchase Rate"
              id="Purc_Rate"
              name="Purc_Rate"
              autoComplete="off"
              value={formData.Purc_Rate}
              onChange={(e) => {
                validateNumericInput(e);
                handleChange(e);
              }}
              disabled={(!isEditing && addOneButtonEnabled) || formData.type === "M"}
              variant="outlined"
              type="text"
              size="small"
              InputLabelProps={{
                style: { fontSize: "14px" },
              }}
              InputProps={{
                style: {
                  fontSize: "12px",
                  height: "36px",
                  fontWeight: "700",
                  width: "100%",
                },
              }}
            />
          </Grid>

          <Grid item xs={12} sm={1}>
            <TextField
              fullWidth
              label="Party Bill Rate"
              id="Party_Bill_Rate"
              name="Party_Bill_Rate"
              autoComplete="off"
              value={formData.Party_Bill_Rate}
              onChange={(e) => {
                validateNumericInput(e);
                handleChange(e);
              }}
              disabled={!isEditing && addOneButtonEnabled}
              variant="outlined"
              type="text"
              size="small"
              InputLabelProps={{
                style: { fontSize: "14px" },
              }}
              InputProps={{
                style: {
                  fontSize: "12px",
                  height: "36px",
                  fontWeight: "700",
                  width: "100%",
                },
              }}
            />
          </Grid>

          <Grid item xs={12} sm={1}>
            <TextField
              fullWidth
              label="Cash Diff"
              id="CashDiff"
              name="CashDiff"
              autoComplete="off"
              value={calculatedValues.diff || formData.CashDiff}
              onChange={(e) => {
                validateNumericInput(e);
                handleChange(e);
              }}
              disabled
              variant="outlined"
              type="text"
              size="small"
              InputLabelProps={{
                style: { fontSize: "14px" },
              }}
              InputProps={{
                style: {
                  fontSize: "12px",
                  height: "36px",
                  fontWeight: "700",
                  width: "100%",
                },
              }}
            />
          </Grid>

          {(calculatedValues.amount > 0 || calculatedValues.amount < 0) && (
            <div className="mill-balance-container">
              <h6 className="balance-value">
                <label>Amount  : {" "} {" "}</label>
                <span style={{ marginLeft: '10px' }}>
                  {formatReadableAmount(calculatedValues.amount)}
                </span>

              </h6>
            </div>
          )}
        </Grid>

        <div className="TenderPurchaseHelp-row" style={{ marginTop: "10px" }}>

          <div className="SugarTenderPurchase-col">
            <label
              htmlFor="Payment_To"
              className="SugarTenderPurchase-form-label"
            >
              Payment To:
            </label>
            <AccountMasterHelp
              name="Payment_To"
              onAcCodeClick={handlePayment_To}
              CategoryName={paymentToName || payment_toName}
              CategoryCode={newPayment_To || formData.Payment_To}
              Ac_type={[]}
              disabledFeild={!isEditing && addOneButtonEnabled || isAnyDispatched}
            />
          </div>
          <div className="SugarTenderPurchase-col">
            <label
              htmlFor="Tender_From"
              className="SugarTenderPurchase-form-label"
            >
              Tender From:
            </label>
            <AccountMasterHelp
              name="Tender_From"
              onAcCodeClick={handleTender_From}
              CategoryName={tenderFrName || tenderFromName || ""}
              CategoryCode={formData.Tender_From || tenderFrom || newTender_From || ""}
              tabIndexHelp={-1}
              Ac_type={[]}
              disabledFeild={!isEditing && addOneButtonEnabled}
            />
          </div>


        </div>
        <div className="SugarTenderPurchase-row">
          <div className="SugarTenderPurchase-col">
            <label
              htmlFor="Tender_DO"
              className="SugarTenderPurchase-form-label"
            >
              Tender D.O.:
            </label>
            <AccountMasterHelp
              name="Tender_DO"
              onAcCodeClick={handleTender_DO}
              CategoryName={
                tenderDONm || tenderDOName
              }
              CategoryCode={
                formData.Tender_DO
                  ? formData.Tender_DO
                  : newTender_From
              }
              Ac_type={[]}
              disabledFeild={!isEditing && addOneButtonEnabled}
            />
          </div>
          <div className="SugarTenderPurchase-col">
            <label
              htmlFor="Voucher_By"
              className="SugarTenderPurchase-form-label"
            >
              Voucher By:
            </label>
            <AccountMasterHelp
              onAcCodeClick={handleVoucher_By}
              name="Voucher_By"
              CategoryName={
                voucherbyName || voucherByName
              }
              CategoryCode={
                formData.Voucher_By ||
                voucherBy
                || newVoucher_By
              }
              disabledFeild={!isEditing && addOneButtonEnabled}
              Ac_type={[]}
            />
          </div>

        </div>


        <div className="SugarTenderPurchase-row" style={{ marginTop: "10px" }}>
          <div className="SugarTenderPurchase-col">
            <label
              htmlFor="Tender_From"
              className="SugarTenderPurchase-form-label"
            >
              Broker:
            </label>
            <AccountMasterHelp
              name="Broker"
              onAcCodeClick={handleBroker}
              CategoryName={
                formData.Broker === self_ac_Code ? self_acName : brokerName
              }
              CategoryCode={newBroker || self_ac_Code}
              Ac_type={[]}
              disabledFeild={!isEditing && addOneButtonEnabled}
            />
          </div>

          <div className="SugarTenderPurchase-col">
            <label
              htmlFor="Voucher_By"
              className="SugarTenderPurchase-form-label"
            >
              GST Code:
            </label>
            <GSTRateMasterHelp
              onAcCodeClick={handlegstratecode}
              GstRateName={gstRateName || gstRate_Name}
              GstRateCode={newgstratecode || gstRateCode}
              name="gstratecode"
              disabledFeild={true}
            />
          </div>
        </div>




        <Grid
          container
          spacing={1}
          wrap="nowrap"
          className="SugarTenderPurchase-row"
          alignItems="center"
        >
          {/* Brokerage */}
          <Grid item sm={1}>
            <TextField
              fullWidth
              label="Brokerage"
              id="Brokerage"
              name="Brokerage"
              autoComplete="off"
              value={formData.Brokrage}
              onChange={(e) => {
                validateNumericInput(e);
                handleChange(e);
              }}
              variant="outlined"
              size="small"
              InputLabelProps={{ style: { fontSize: "14px" } }}
              InputProps={{
                style: { fontSize: "12px", height: "36px", fontWeight: "700" },
              }}
              disabled={!isEditing && addOneButtonEnabled}
            />
          </Grid>

          {/* GST Rate */}
          <Grid item sm={0.8}>
            <TextField
              fullWidth
              label="GST Rate"
              id="Excise_Rate"
              name="Excise_Rate"
              autoComplete="off"
              value={calculatedValues.exciseAmount || formData.Excise_Rate}
              onChange={(e) => {
                validateNumericInput(e);
                handleChange(e);
              }}
              variant="outlined"
              size="small"
              InputLabelProps={{ style: { fontSize: "14px" } }}
              InputProps={{
                style: { fontSize: "12px", height: "36px", fontWeight: "700" },
              }}
              disabled={!isEditing && addOneButtonEnabled}
            />
          </Grid>

          {/* <div className="mill-balance-container">
            <h6 className="balance-value">
              <label>Value : {" "}</label>
              <span style={{ marginLeft: '10px' }}>
                {formatReadableAmount(calculatedValues.lblValue)}
              </span>
            </h6>
          </div> */}


          {calculatedValues.lblValue > 0 && (
            <div className="mill-balance-container">
              <h6 className="balance-value">
                <label>Value : {" "}</label>
                <span style={{ marginLeft: '10px' }}>
                  {formatReadableAmount(calculatedValues.lblValue)}
                </span>
              </h6>
            </div>
          )}

          <Grid item sm={1}>
            <TextField
              fullWidth
              label="GST Amount"
              id="GSTAmt"
              name="GSTAmt"
              autoComplete="off"
              value={calculatedValues.gstAmt || ""}
              onChange={(e) => {
                validateNumericInput(e);
                handleChange(e);
              }}
              variant="outlined"
              size="small"
              InputLabelProps={{ style: { fontSize: "14px" } }}
              InputProps={{
                style: { fontSize: "12px", height: "36px", fontWeight: "700" },
              }}
              disabled={!isEditing && addOneButtonEnabled}
            />
          </Grid>

          {/* Sell Note No */}
          <Grid item sm={2}>
            <TextField
              fullWidth
              label="Sell Note No"
              id="Sell_Note_No"
              name="Sell_Note_No"
              autoComplete="off"
              value={formData.Sell_Note_No}
              onChange={handleChange}
              variant="outlined"
              size="small"
              sx={{ minWidth: "150px" }}
              InputLabelProps={{ style: { fontSize: "14px" } }}
              InputProps={{
                style: { fontSize: "12px", height: "36px", fontWeight: "700" },
              }}
              disabled={!isEditing && addOneButtonEnabled}
            />
          </Grid>




          {/* <div className="mill-balance-container">
            <h6 className="balance-value">
              <label>TCS Amount With Value :</label>
              <span style={{ marginLeft: "10px" }}>
                {formatReadableAmount(calculatedValues.lblTCSAmtWithValue)}
              </span>
            </h6>
          </div> */}

          {calculatedValues.lblTCSAmtWithValue > 0 && (
            <div className="mill-balance-container">
              <h6 className="balance-value">
                <label>TCS Amount With Value :</label>
                <span style={{ marginLeft: "10px" }}>
                  {formatReadableAmount(calculatedValues.lblTCSAmtWithValue)}
                </span>
              </h6>
            </div>
          )}



        </Grid>





        <Grid
          container
          spacing={1}
          wrap="nowrap"
          className="SugarTenderPurchase-row"
          alignItems="center"
        >

          {/* TCS Rate */}
          <Grid item sm={0.8}>
            <TextField
              fullWidth
              label="TCS%"
              id="TCS_Rate"
              name="TCS_Rate"
              autoComplete="off"
              value={formData.TCS_Rate}
              onChange={(e) => {
                validateNumericInput(e);
                handleChange(e);
              }}
              variant="outlined"
              size="small"
              InputLabelProps={{ style: { fontSize: "14px" } }}
              InputProps={{
                style: { fontSize: "12px", height: "36px", fontWeight: "700" },
              }}
              disabled={TCSApplicable !== 'Y' || (!isEditing && addOneButtonEnabled)}
            />
          </Grid>

          {/* TCS Amount */}
          <Grid item sm={1}>
            <TextField
              fullWidth
              label="TCS Amount"
              id="TCS_Amt"
              name="TCS_Amt"
              autoComplete="off"
              value={
                calculatedValues.tcsAmt || calculatedValues.calculatedTcsAmt
              }
              onChange={(e) => {
                validateNumericInput(e);
                handleChange(e);
              }}
              variant="outlined"
              size="small"
              InputLabelProps={{ style: { fontSize: "14px" } }}
              InputProps={{
                style: { fontSize: "12px", height: "36px", fontWeight: "700" },
              }}
              disabled={TCSApplicable !== 'Y' || (!isEditing && addOneButtonEnabled)}
            />
          </Grid>

          {/* TDS Rate */}
          <Grid item sm={0.8}>
            <TextField
              fullWidth
              label="TDS Rate"
              id="TDS_Rate"
              name="TDS_Rate"
              autoComplete="off"
              value={formData.TDS_Rate}
              onChange={(e) => {
                validateNumericInput(e);
                handleChange(e);
              }}
              variant="outlined"
              size="small"
              InputLabelProps={{ style: { fontSize: "14px" } }}
              InputProps={{
                style: { fontSize: "12px", height: "36px", fontWeight: "700" },
              }}
              disabled={!isEditing && addOneButtonEnabled}
            />
          </Grid>

          {/* TDS Amount */}
          <Grid item sm={1}>
            <TextField
              fullWidth
              label="TDS Amount"
              id="TDS_Amt"
              name="TDS_Amt"
              autoComplete="off"
              value={
                calculatedValues.tdsAmt || calculatedValues.calculatedTdsAmt
              }
              onChange={(e) => {
                validateNumericInput(e);
                handleChange(e);
              }}
              variant="outlined"
              size="small"
              InputLabelProps={{ style: { fontSize: "14px" } }}
              InputProps={{
                style: { fontSize: "12px", height: "36px", fontWeight: "700" },
              }}
              disabled={!isEditing && addOneButtonEnabled}
            />
          </Grid>





        </Grid>

        <div
          className="SugarTenderPurchase-row"
          style={{
            display: "flex",
            gap: "7px",
            alignItems: "center",
            flexWrap: "wrap",
            marginTop: "-3px",
          }}
        >
          {/* Narration Field */}
          <Grid item xs={12} sm={8} md={8}>
            <TextField
              fullWidth
              label="Narration"
              id="Narration"
              name="Narration"
              autoComplete="off"
              value={formData.Narration}
              onChange={handleChange}
              variant="outlined"
              size="small"
              disabled={!isEditing && addOneButtonEnabled}
              multiline
              rows={1}
              sx={{
                "& .MuiInputBase-root": {
                  fontSize: "12px",
                  height: "38px",
                  width: "90vh",
                },
                "& .MuiInputLabel-root": { fontSize: "12px" },
              }}
            />
          </Grid>
        </div>

        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "flex-start",
            marginTop: -45,
          }}
        >
          <TableContainer
            component={Paper}
            sx={{
              width: "50%",
              maxWidth: 500,
              ml: -160,
              marginTop: -15,
              maxHeight: 480,
              overflowY: "auto",
            }}
          >
            <Table
              size="small"
              stickyHeader
              sx={{
                tableLayout: "auto",
                "& .MuiTableRow-root": { height: 28 },
                "& .MuiTableCell-root": { py: 0.25, px: 0.75 },
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold" }}>Code</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Id</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Grade Name</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Mill Rate</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Purchase Rate</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {groupData.map((group, index) => (
                  <TableRow key={`${group.Category_Code}_${group.accoid}`}>
                    <TableCell>{group.Category_Code}</TableCell>
                    <TableCell>{group.accoid}</TableCell>
                    <TableCell>{group.Category_Name}</TableCell>
                    <TableCell>
                      <TextField
                        variant="standard"
                        size="small"
                        type="number"
                        name="rate"
                        value={group.rate}
                        sx={{
                          "& .MuiInputBase-root": { height: 22, lineHeight: 1 },
                          "& .MuiInputBase-input": {
                            py: 0,
                            fontSize: 12,
                            "&::-webkit-outer-spin-button, &::-webkit-inner-spin-button": {
                              display: "none",
                              WebkitAppearance: "none",
                              margin: 0,
                            },
                            "&[type=number]": {
                              MozAppearance: "textfield",
                            },
                          },
                        }}
                        onChange={(e) => handleRateChange(e, index)}
                        inputProps={{ style: { textAlign: "right" } }}
                        disabled={!isEditing || isGradeInDeliveryOrder(group)}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        variant="standard"
                        size="small"
                        type="number"
                        name="Purchase_Rate"
                        sx={{
                          "& .MuiInputBase-root": { height: 22, lineHeight: 1 },
                          "& .MuiInputBase-input": {
                            py: 0,
                            fontSize: 12,
                            "&::-webkit-outer-spin-button, &::-webkit-inner-spin-button": {
                              display: "none",
                              WebkitAppearance: "none",
                              margin: 0,
                            },
                            "&[type=number]": {
                              MozAppearance: "textfield",
                            },
                          },
                        }}
                        value={group.Purchase_Rate}

                        onChange={(e) => handleRateChange(e, index)}
                        inputProps={{ style: { textAlign: "right" } }}
                        disabled={!isEditing || isGradeInDeliveryOrder(group)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>




        </Box>

        {isLoading && (
          <div className="loading-overlay">
            <div className="spinner-container">
              <SaveUpdateSpinner />
            </div>
          </div>
        )}


        <Box
          sx={{
            mt: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,               // keep it visible when scrolling the page
            zIndex: 2,
            background: 'transparent',
            py: 0.5,
            px: 1,
          }}
        >
          {/* <AddButton
    openPopup={openPopup}
    isEditing={isEditing}
    ref={addButtonRef}
    setFocusToFirstField={setFocusToFirstField}
  /> */}



          {/* Totals on right */}
          <div style={{ display: "flex", gap: "20px", fontSize: "13px" }}>
            <div>
              <b>Sauda Quintal: </b>
              {formatReadableAmount(
                users.filter(u => u.id !== 1)
                  .reduce((sum, u) => sum + Number(u?.Buyer_Quantal ?? 0), 0)
              )}
            </div>
            <div>
              <b>Dispatched: </b>
              {formatReadableAmount(
                users.reduce((sum, u) => sum + Number(u?.dispatched ?? u?.despatched ?? 0), 0)
              )}
            </div>
            <div>
              <b>Balance: </b>
              {formatReadableAmount(
                users.reduce((sum, u) => sum + Number(u?.balance ?? 0), 0)
              )}
            </div>
          </div>
        </Box>



        {/*detail part popup functionality and Validation part Grid view */}
        <div>
          {showPopup && (

            <div className="TenderPurchase-custom-modal">
              <div className="TenderPurchase-custom-modal-large-dialog">
                <div className="TenderPurchase-custom-modal-content">
                  <div className="TenderPurchase-custom-modal-header">
                    <h5 className="TenderPurchase-custom-modal-title">
                      {selectedUser.id
                        ? "Edit Tender Detail"
                        : "Add Tender Detail"}
                    </h5>
                    <button
                      type="button"
                      onClick={closePopup}
                      aria-label="Close"
                      style={{
                        width: "40px",
                        height: "45px",
                        borderRadius: "4px"
                      }}
                    >
                      <span aria-hidden="true">&times;</span>
                    </button>
                  </div>
                  <div className="TenderPurchase-custom-modal-body">
                    <form>
                      <div className="TenderPurchaseHelp-row ">
                        <label className="TenderPurchaseHelpLabel">
                          Bill To :
                        </label>
                        <div className="TenderPurchase-form-element">
                          <AccountMasterHelp
                            key={billTo}
                            onAcCodeClick={handleBillTo}
                            CategoryName={selfAcCode ? selfAcName : billtoName}
                            CategoryCode={billTo || selfAcCode}
                            name="Buyer"
                            Ac_type=""
                            className="TenderPurchase-account-master-help"
                            disabledFeild={!isEditing && addOneButtonEnabled}
                            firstInputRef={firstInputRef}
                          />
                        </div>
                        <label className="TenderPurchaseHelpLabel">
                          Ship To:
                        </label>
                        <div className="TenderPurchase-form-element">
                          <AccountMasterHelp
                            key={shipTo}
                            onAcCodeClick={handleShipTo}
                            CategoryName={selfAcCode ? selfAcName : shiptoName}
                            CategoryCode={shipTo || selfAcCode}
                            name="ShipTo"
                            Ac_type=""
                            className="TenderPurchase-account-master-help"
                            disabledFeild={!isEditing && addOneButtonEnabled}
                          />
                        </div>
                      </div>

                      <div className="TenderPurchaseHelp-row ">
                        <label className="TenderPurchaseHelpLabel">
                          Broker
                        </label>
                        <div className="TenderPurchase-form-element">
                          <AccountMasterHelp
                            key={buyerParty}
                            onAcCodeClick={handleBuyerParty}
                            CategoryName={
                              buyerPartyName
                                ? buyerPartyName
                                : self_ac_Code
                                  ? self_acName
                                  : buyerPartyName
                            }
                            CategoryCode={
                              buyerParty ||
                              selfAcCode ||
                              self_ac_Code ||
                              formDataDetail.Buyer_Party
                            }
                            name="Buyer_Party"
                            Ac_type=""
                            className="TenderPurchase-account-master-help"
                            disabledFeild={!isEditing && addOneButtonEnabled}
                          />
                        </div>
                        <label className="TenderPurchaseHelpLabel">
                          Sub Broker:
                        </label>
                        <div className="TenderPurchase-form-element">
                          <AccountMasterHelp
                            onAcCodeClick={handleDetailSubBroker}
                            CategoryName={
                              brokerDetail
                                ? brokerDetail
                                : self_ac_Code
                                  ? self_acName
                                  : subBrokerName
                            }
                            CategoryCode={
                              formDataDetail.sub_broker ||
                              subBroker ||
                              selfAcCode ||
                              self_ac_Code ||
                              2
                            }
                            name="sub_broker"
                            Ac_type=""
                            className="TenderPurchase-account-master-help"
                            disabledFeild={!isEditing && addOneButtonEnabled}
                          />
                        </div>
                      </div>

                      <div className="TenderPurchase-form-container">
                        <form>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={3}>
                              <TextField
                                label="Delivery Type"
                                select
                                fullWidth
                                id="Delivery_Type"
                                name="Delivery_Type"
                                value={
                                  formDataDetail.Delivery_Type || dispatchType
                                }
                                onChange={handleChangeDetail}
                                disabled={!isEditing && addOneButtonEnabled}
                                size="small"
                              >
                                <MenuItem value="N">
                                  With GST Naka Delivery
                                </MenuItem>
                                <MenuItem value="A">
                                  Naka Delivery without GST Rate
                                </MenuItem>
                                <MenuItem value="C">Commission</MenuItem>
                                <MenuItem value="D">DO</MenuItem>
                              </TextField>
                            </Grid>

                            <Grid item xs={12} sm={3}>
                              <TextField
                                label="Brokrage"
                                fullWidth
                                name="DetailBrokrage"
                                autoComplete="off"
                                value={formDataDetail.DetailBrokrage}
                                onChange={handleChangeDetail}
                                disabled={!isEditing && addOneButtonEnabled}
                                size="small"
                              />
                            </Grid>

                            <Grid item xs={12} sm={3}>
                              <TextField
                                label="Sub Broker"
                                fullWidth
                                value={formDataDetail.sub_broker}
                                onChange={handleChangeDetail}
                                size="small"
                                disabled={!isEditing && addOneButtonEnabled}
                              />
                            </Grid>

                            <Grid item xs={12} sm={2}>

                              <FormControl fullWidth size="small" disabled={
                                isDetailGradeDisabled || (!isEditing && addOneButtonEnabled)
                              }>
                                <InputLabel id="grade-select-label">Grade</InputLabel>
                                <Select
                                  labelId="grade-select-label"
                                  value={formDataDetail.gradeCode?.toString() || ""}
                                  onChange={(e) => {
                                    const selectedCode = e.target.value;
                                    const selectedGrade = validGrades.find(g => g.Category_Code.toString() === selectedCode);
                                    setFormDataDetail((prev) => ({
                                      ...prev,
                                      gradeCode: selectedGrade.Category_Code?.toString(),
                                      gradeid: selectedGrade.accoid,
                                      Mill_Rate: parseFloat(selectedGrade?.rate) || 0,
                                      Purchase_Rate: parseFloat(selectedGrade?.Purchase_Rate) || 0,

                                    }));
                                  }}
                                >
                                  {groupData
                                    .filter(
                                      (grade) =>
                                        parseFloat(grade.rate || 0) > 0 ||
                                        grade.Category_Code?.toString() === formDataDetail.gradeCode?.toString()
                                    )
                                    .map((grade) => (
                                      <MenuItem key={grade.accoid} value={grade.Category_Code?.toString()}>
                                        {grade.Category_Code} - {grade.Category_Name}
                                      </MenuItem>
                                    ))}

                                </Select>
                              </FormControl>

                            </Grid>

                            {/* <Grid item xs={12} sm={3}>
                              <TextField
                                label="Buyer Quintal"
                                fullWidth
                                name="Buyer_Quantal"
                                autoComplete="off"
                                value={formDataDetail.Buyer_Quantal}
                                onChange={(e) => {
                                  handleChangeDetail(e);
                                }}
                                size="small"
                                disabled={!isEditing && addOneButtonEnabled}
                              />
                            </Grid> */}
                          </Grid>

                          <Grid container spacing={2} mt={1}>

                            <Grid item xs={12} sm={2}>
                              <TextField
                                label="Buyer Quintal"
                                fullWidth
                                name="Buyer_Quantal"
                                autoComplete="off"
                                value={formDataDetail.Buyer_Quantal}
                                onChange={(e) => {
                                  handleChangeDetail(e);
                                }}
                                size="small"
                                disabled={!isEditing && addOneButtonEnabled}
                              />
                            </Grid>

                            <Grid item xs={12} sm={2}>
                              <TextField
                                label="Mill Rate"
                                fullWidth
                                size="small"
                                name="Mill_Rate"
                                autoComplete="off"
                                value={formDataDetail.Mill_Rate}
                                onChange={handleChangeDetail}
                                disabled
                              />
                            </Grid>

                            <Grid item xs={12} sm={2}>
                              <TextField
                                label="Purchase Rate"
                                fullWidth
                                size="small"
                                name="Purchase_Rate"
                                autoComplete="off"
                                value={formDataDetail.Purchase_Rate}
                                onChange={handleChangeDetail}
                                disabled
                              />
                            </Grid>

                            <Grid item xs={12} sm={2}>
                              <TextField
                                label="Sale Rate"
                                fullWidth
                                size="small"
                                name="Sale_Rate"
                                autoComplete="off"
                                value={formDataDetail.Sale_Rate}
                                onChange={(e) => {
                                  validateNumericInput(e);
                                  handleChangeDetail(e);
                                }}
                                disabled={!isEditing && addOneButtonEnabled}
                              />
                            </Grid>
                            <Grid item xs={12} sm={2}>
                              <TextField
                                label="Commission"
                                fullWidth
                                size="small"
                                name="Commission_Rate"
                                value={formDataDetail.Commission_Rate}
                                onChange={(e) => {
                                  validateNumericInput(e);
                                  handleChangeDetail(e);
                                }}
                                disabled={!isEditing && addOneButtonEnabled}
                              />
                            </Grid>
                            <Grid item xs={1}>
                              <label
                                style={{
                                  fontSize: "15px",
                                  fontWeight: "normal",
                                  display: "block",
                                }}
                              >
                                Value:{" "}
                                <span style={{ fontWeight: "bold" }}>
                                  {formatReadableAmount(calculatedValues.lblRate)}
                                </span>
                              </label>
                            </Grid>
                            <Grid item xs={12} sm={2}>
                              <TextField
                                label="Sauda Date"
                                type="date"
                                size="small"
                                fullWidth
                                name="Sauda_Date"
                                value={formDataDetail.Sauda_Date}
                                onChange={(e) =>
                                  handleDetailDateChange(e, "Sauda_Date")
                                }
                                disabled={!isEditing && addOneButtonEnabled}
                                InputLabelProps={{
                                  shrink: true,
                                }}
                                InputProps={{
                                  style: { fontSize: "12px", height: "35px" },
                                }}
                              />
                            </Grid>

                            <Grid item xs={12} sm={2}>
                              <TextField
                                label="Payment Date"
                                type="date"
                                size="small"
                                fullWidth
                                name="Lifting_Date"
                                value={formDataDetail.Lifting_Date}
                                onChange={(e) =>
                                  handleDetailDateChange(e, "Lifting_Date")
                                }
                                disabled={!isEditing && addOneButtonEnabled}
                                InputLabelProps={{
                                  shrink: true,
                                }}
                                InputProps={{
                                  style: { fontSize: "12px", height: "35px" },
                                }}
                              />
                            </Grid>

                            <Grid item xs={12} sm={2}>
                              <TextField
                                label="Sauda Lifting Date"
                                type="date"
                                size="small"
                                fullWidth
                                name="Sauda_Lifting_Date"
                                value={formDataDetail.Sauda_Lifting_Date}
                                onChange={(e) =>
                                  handleDetailDateChange(e, "Sauda_Lifting_Date")
                                }
                                disabled={!isEditing && addOneButtonEnabled}
                                InputLabelProps={{
                                  shrink: true,
                                }}
                                InputProps={{
                                  style: { fontSize: "12px", height: "35px" },
                                }}
                              />
                            </Grid>

                            <Grid item xs={12} sm={2}>
                              <TextField
                                select
                                label="Sauda Type"
                                size="small"
                                fullWidth
                                name="Sauda_Type"
                                value={formDataDetail.Sauda_Type}
                                onChange={handleChangeDetail}
                                disabled={!isEditing && addOneButtonEnabled}
                                InputLabelProps={{
                                  shrink: true,
                                }}
                                InputProps={{
                                  style: { fontSize: "12px", height: "35px" },
                                }}
                              >
                                <MenuItem value="F">Flexible</MenuItem>
                                <MenuItem value="X">Fix</MenuItem>
                              </TextField>
                            </Grid>

                            <Grid item xs={12} sm={2}>
                              <TextField
                                select
                                label="Delivery From"
                                size="small"
                                fullWidth
                                value={exMillSelection}
                                onChange={handleExMillSelectionChange}
                                disabled={!isEditing && addOneButtonEnabled}
                                InputLabelProps={{
                                  shrink: true,
                                }}
                                InputProps={{
                                  style: { fontSize: "12px", height: "35px" },
                                }}
                              >
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
                                  value={formDataDetail.Ex_Mill_Type}
                                  onChange={handleChangeDetail}
                                  disabled={!isEditing && addOneButtonEnabled}
                                  InputProps={{
                                    style: { fontSize: "12px", height: "35px" },
                                  }}
                                />
                              )}
                            </Grid>
                          </Grid>

                          <Grid container spacing={2} mt={1}>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                label="Narration"
                                fullWidth
                                size="small"
                                name="Narration"
                                value={formDataDetail.Narration}
                                onChange={handleChangeDetail}
                                disabled={!isEditing && addOneButtonEnabled}
                                multiline
                                rows={2}
                              />
                            </Grid>

                            {/* <Grid item xs={12} sm={4}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                <label
                                  htmlFor="loding_by_us"
                                  style={{
                                    whiteSpace: "nowrap",
                                    flexShrink: 0,
                                  }}
                                >
                                  Loading By Us
                                </label>
                                <input
                                  type="checkbox"
                                  id="loding_by_us"
                                  Name="loding_by_us"
                                  style={{ flexShrink: 0, marginLeft: "-12vh" }}
                                  checked={formDataDetail.loding_by_us === "Y"}
                                  onChange={(e) => handleCheckbox(e, "string")}
                                  disabled={!isEditing && addOneButtonEnabled}
                                />
                              </div>
                            </Grid> */}
                          </Grid>
                          <Grid container spacing={2} mt={1}>
                            <Grid item xs={12} sm={2}>
                              <TextField
                                label="GST Rate"
                                fullWidth
                                size="small"
                                name="gst_rate"
                                autoComplete="off"
                                value={
                                  formDataDetail.gst_rate ||
                                  gstCode ||
                                  gstRateCode
                                }
                                onChange={(e) => {
                                  validateNumericInput(e);
                                  handleChangeDetail(e);
                                }}
                                disabled={!isEditing && addOneButtonEnabled}
                              />
                            </Grid>
                            <Grid item xs={12} sm={2}>
                              <TextField
                                label="GST Amount"
                                fullWidth
                                size="small"
                                name="gst_amt"
                                autoComplete="off"
                                value={
                                  calculatedValues.gstAmtDetail ||
                                  (formDataDetail.Buyer_Quantal *
                                    formDataDetail.Sale_Rate *
                                    gstCode) /
                                  100
                                }
                                onChange={(e) => {
                                  validateNumericInput(e);
                                  handleChangeDetail(e);
                                }}
                                disabled={!isEditing && addOneButtonEnabled}
                              />
                            </Grid>
                            <Grid item xs={12} sm={2}>
                              <TextField
                                label="TCS Rate"
                                fullWidth
                                size="small"
                                name="tcs_rate"
                                autoComplete="off"
                                value={
                                  formDataDetail.tcs_rate ||
                                  formData.TCS_Rate ||
                                  ""
                                }
                                onChange={(e) => {
                                  handleChangeDetail(e);
                                }}
                                onKeyDown={TCSCalculationDetail}
                                disabled={TCSApplicable !== 'Y' || (!isEditing && addOneButtonEnabled)}
                              />
                            </Grid>

                            <Grid item xs={12} sm={2}>
                              <TextField
                                label="TCS Amount"
                                fullWidth
                                size="small"
                                name="tcs_amt"
                                autoComplete="off"
                                value={
                                  calculatedValues.TCSAmt ||
                                  formDataDetail.tcs_amt
                                }
                                onChange={(e) => {
                                  handleChangeDetail(e);
                                }}
                                disabled={TCSApplicable !== 'Y' || (!isEditing && addOneButtonEnabled)}
                              />
                            </Grid>

                            <Grid item xs={12} sm={2}>
                              <TextField
                                label="Net Amount"
                                fullWidth
                                size="small"
                                value={calculatedValues.lblNetAmount}
                                disabled
                              />
                            </Grid>
                          </Grid>
                        </form>
                      </div>
                    </form>
                  </div>
                  <div className="TenderPurchase-custom-modal-footer">
                    {selectedUser.id ? (
                      <DetailUpdateButton updateUser={updateUser} />
                    ) : (
                      <DetailAddButtom addUser={addUser} />
                    )}
                    <DetailCloseButton closePopup={closePopup} />
                  </div>
                </div>
              </div>
            </div>
          )}
          <TableContainer component={Paper} sx={{ marginBottom: "60px" }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={headerCellStyle}>Actions</TableCell>
                  <TableCell sx={headerCellStyle}>ID</TableCell>
                  <TableCell sx={headerCellStyle}>Party A/C</TableCell>
                  <TableCell sx={headerCellStyle}>Party Name</TableCell>
                  <TableCell sx={headerCellStyle}>Broker Name</TableCell>
                  <TableCell sx={headerCellStyle}>Ship To Name</TableCell>
                  <TableCell sx={headerCellStyle}>Quintal</TableCell>
                  <TableCell sx={headerCellStyle}>Sale Rate</TableCell>
                  <TableCell sx={headerCellStyle}>Commission</TableCell>
                  <TableCell sx={headerCellStyle}>Sauda Date</TableCell>
                  <TableCell sx={headerCellStyle}>Sauda Narration</TableCell>
                  <TableCell sx={headerCellStyle}>Delivery Type</TableCell>
                  <TableCell sx={headerCellStyle}>Grade Name</TableCell>
                  <TableCell sx={headerCellStyle}>Dispatched</TableCell>
                  <TableCell sx={headerCellStyle}>Balance</TableCell>
                  <TableCell sx={headerCellStyle}>Sold Qty</TableCell>
                  <TableCell sx={headerCellStyle}>eBuy Sold</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user, index) => {
                  const isEbuyClickable =
                    index !== 0 &&
                    (user.ebuyid == null || user.ebuyid === 0 || user.ebuyid === "");
                  const isEbuyBuyer = user.Buyer != null && String(user.Buyer) === String(ebuyAcCode);
                  const isEyeEnabled = isEbuyClickable && isEditing && isEbuyBuyer;
                  return (
                    <TableRow key={user.id}>
                      <TableCell
                        sx={{
                          padding: "2px 4px",
                          textAlign: "center",
                          fontSize: "12px",
                        }}
                      >
                        <Stack
                          direction="row"
                          spacing={0.5}
                          justifyContent="center"
                        >
                          {(user.rowaction === "add" ||
                            user.rowaction === "update" ||
                            user.rowaction === "Normal") && (
                              <>
                                <EditButton
                                  editUser={editUser}
                                  user={user}
                                  isEditing={isEditing}
                                  disabled={!isEditing || index === 0 || isEbuyBuyer}
                                />
                                <DeleteButton
                                  deleteModeHandler={deleteModeHandler}
                                  user={user}
                                  isEditing={isEditing}
                                  disabled={!isEditing || index === 0 || isEbuyBuyer}
                                />
                              </>
                            )}
                          {(user.rowaction === "DNU" ||
                            user.rowaction === "delete") && (
                              <OpenButton openDelete={openDelete} user={user} />
                            )}
                          {/* Eye icon — shown on all rows, enabled only when row buyer is eBuy account and has no ebuyid */}
                          <button
                            title={isEyeEnabled ? "eBuySugar" : "Not available"}
                            disabled={!isEyeEnabled}
                            onClick={isEyeEnabled ? (e) => { e.stopPropagation(); handleEbuyRowClick(user); } : undefined}
                            style={{
                              border: `1px solid ${isEyeEnabled ? "#1976d2" : "#bdbdbd"}`,
                              background: isEyeEnabled ? "#e3f2fd" : "#f5f5f5",
                              borderRadius: 4, padding: "2px 5px",
                              cursor: isEyeEnabled ? "pointer" : "not-allowed",
                              color: isEyeEnabled ? "#1976d2" : "#bdbdbd",
                              display: "inline-flex", alignItems: "center", justifyContent: "center",
                              opacity: isEyeEnabled ? 1 : 0.45,
                              transition: "all 0.15s",
                            }}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </button>
                        </Stack>
                      </TableCell>
                      <TableCell
                        sx={{
                          padding: "2px 4px",
                          textAlign: "center",
                          fontSize: "12px",
                        }}
                      >
                        {user.id}
                      </TableCell>
                      <TableCell
                        sx={{
                          padding: "2px 4px",
                          textAlign: "left",
                          fontSize: "12px",
                        }}
                      >
                        {user.Buyer}
                      </TableCell>
                      <TableCell
                        sx={{
                          padding: "2px 4px",
                          textAlign: "left",
                          fontSize: "12px",
                        }}
                      >
                        {user.billtoName}
                      </TableCell>
                      <TableCell
                        sx={{
                          padding: "2px 4px",
                          textAlign: "left",
                          fontSize: "12px",
                        }}
                      >
                        {user.buyerPartyName}
                      </TableCell>
                      <TableCell
                        sx={{
                          padding: "2px 4px",
                          textAlign: "left",
                          fontSize: "12px",
                        }}
                      >
                        {user.shiptoName}
                      </TableCell>
                      <TableCell
                        sx={{
                          padding: "2px 4px",
                          textAlign: "center",
                          fontSize: "12px",
                        }}
                      >
                        {/* Self row (id=1): show selfqty from eBuySugar self stock view */}
                        {formatReadableAmount(user.id === 1 ? selfStockQty : user.Buyer_Quantal)}
                      </TableCell>
                      <TableCell
                        sx={{
                          padding: "2px 4px",
                          textAlign: "center",
                          fontSize: "12px",
                        }}
                      >
                        {formatReadableAmount(user.Sale_Rate)}
                      </TableCell>
                      <TableCell
                        sx={{
                          padding: "2px 4px",
                          textAlign: "center",
                          fontSize: "12px",
                        }}
                      >
                        {user.Commission_Rate}
                      </TableCell>
                      <TableCell
                        sx={{
                          padding: "2px 4px",
                          textAlign: "center",
                          fontSize: "12px",
                        }}
                      >
                        {user.Sauda_Date}
                      </TableCell>
                      <TableCell
                        sx={{
                          padding: "2px 4px",
                          textAlign: "center",
                          fontSize: "12px",
                        }}
                      >
                        {user.Narration}
                      </TableCell>
                      <TableCell
                        sx={{
                          padding: "2px 4px",
                          textAlign: "center",
                          fontSize: "12px",
                        }}
                      >
                        {user.Delivery_Type || dispatchType}
                      </TableCell>
                      <TableCell
                        sx={{
                          padding: "2px 4px",
                          textAlign: "center",
                          fontSize: "12px",
                          textAlign: "right"
                        }}
                      >
                        {gradeNameByKey.get(`${String(user.gradeCode || "")}_${String(user.gradeid || "")}`) || ""}
                      </TableCell>
                      <TableCell
                        sx={{
                          padding: "2px 4px",
                          textAlign: "center",
                          fontSize: "12px",
                          textAlign: "right"
                        }}
                      >
                        {formatReadableAmount(user.despatched || dispatched)}
                      </TableCell>
                      <TableCell
                        sx={{
                          padding: "2px 4px",
                          textAlign: "center",
                          fontSize: "12px",
                          textAlign: "right"
                        }}
                      >
                        {/* Self row (id=1): show selfqty from eBuySugar self stock view */}
                        {formatReadableAmount(user.id === 1 ? selfStockQty : (user.balance || balance))}
                      </TableCell>
                      <TableCell
                        sx={{
                          padding: "2px 4px",
                          textAlign: "right",
                          fontSize: "12px",
                        }}
                      >
                        {user.id === 1 && selfSoldQty ? formatReadableAmount(selfSoldQty) : ""}
                      </TableCell>
                      <TableCell
                        sx={{
                          padding: "2px 4px",
                          textAlign: "right",
                          fontSize: "12px",
                        }}
                      >
                        {user.id === 1 && selfEbuySold ? formatReadableAmount(selfEbuySold) : ""}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {(shiftedOutData.length > 0 || receivedInData.length > 0) && (
              <Grid container spacing={2} sx={{ mt: 2, mb: 2, marginbottom: "60px" }}>
                {/* Shifted Out - left */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 0.5 }}>
                    Shifted Out
                  </Typography>
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={headerCellStylelog}>Tender No</TableCell>
                          <TableCell sx={headerCellStylelog}>Grade</TableCell>
                          <TableCell sx={headerCellStylelog}>Quantity</TableCell>
                          <TableCell sx={headerCellStylelog}>Sale Rate</TableCell>
                          <TableCell sx={headerCellStylelog}>Payment To</TableCell>
                          <TableCell sx={headerCellStylelog}>Shifted On</TableCell>
                          <TableCell sx={headerCellStylelog}>Shifted By</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {shiftedOutData.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell>{row.Tender_No}</TableCell>
                            <TableCell>{row.Grade}</TableCell>
                            <TableCell >{formatReadableAmount(row.Quantity)}</TableCell>
                            <TableCell>{row.Sale_Rate ?? "-"}</TableCell>
                            <TableCell>{row.Payment_To}</TableCell>
                            <TableCell>{[row.ShiftedOn, row.ShiftedTime].filter(Boolean).join(" ")}</TableCell>
                            <TableCell>{row.ShiftedBy || "-"}</TableCell>
                          </TableRow>
                        ))}
                        {shiftedOutData.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} align="center">No records</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>

                {/* Received In - right */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 0.5 }}>
                    Received In
                  </Typography>
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={headerCellStylelog}>Tender No</TableCell>
                          <TableCell sx={headerCellStylelog}>Grade</TableCell>
                          <TableCell sx={headerCellStylelog}>Quantity</TableCell>
                          <TableCell sx={headerCellStylelog}>Sale Rate</TableCell>
                          <TableCell sx={headerCellStylelog}>Payment To</TableCell>
                          <TableCell sx={headerCellStylelog}>Shifted On</TableCell>
                          <TableCell sx={headerCellStylelog}>Shifted By</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {receivedInData.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell>{row.Tender_No}</TableCell>
                            <TableCell>{row.Grade}</TableCell>
                            <TableCell >{formatReadableAmount(row.Quantity)}</TableCell>
                            <TableCell>{row.Sale_Rate ?? "-"}</TableCell>
                            <TableCell>{row.Payment_To}</TableCell>
                            <TableCell>{[row.ShiftedOn, row.ShiftedTime].filter(Boolean).join(" ")}</TableCell>
                            <TableCell>{row.ShiftedBy || "-"}</TableCell>
                          </TableRow>
                        ))}
                        {receivedInData.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} align="center">No records</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>
            )}
          </TableContainer>

        </div>
      </form>

      {/* ── eBuy Linked Sale Records Popup ───────────────────────────── */}
      {ebuyPopupOpen && (
        <div
          onClick={() => setEbuyPopupOpen(false)}
          className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{ width: "96vw", maxWidth: 1300, maxHeight: "88vh" }}
          >
            {/* ── Title bar ── */}
            <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-indigo-700 to-indigo-500 text-white flex-shrink-0">
              <div className="flex items-center gap-3">
                {/* <svg className="w-5 h-5 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg> */}
                <span className="font-bold text-base tracking-wide">eBuySugar</span>
                {/* <span className="text-indigo-200 text-sm">— TenderDetail ID: {ebuyPopupRow?.tenderdetailid}</span> */}
              </div>
              <button
                onClick={() => setEbuyPopupOpen(false)}
                className="text-white/70 hover:text-white hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center text-xl font-light transition-all"
              >×</button>
            </div>

            {/* ── Summary header cards (Mill, Grade, Buyer Quantal) ── */}
            <div className="flex gap-3 px-5 py-3 bg-indigo-50 border-b border-indigo-100 flex-shrink-0 flex-wrap">
              <div className="flex flex-col bg-white rounded-xl px-4 py-2 shadow-sm border border-indigo-100 min-w-[160px]">
                <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">Tender No</span>
                <span className="text-sm font-bold text-gray-800 mt-0.5">{formData.Tender_No}</span>
              </div>
              <div className="flex flex-col bg-white rounded-xl px-4 py-2 shadow-sm border border-indigo-100 min-w-[160px]">
                <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">Mill Name</span>
                <span className="text-sm font-bold text-gray-800 mt-0.5">{millCodeName || "—"}</span>
              </div>
              <div className="flex flex-col bg-white rounded-xl px-4 py-2 shadow-sm border border-indigo-100 min-w-[120px]">
                <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">Grade</span>
                <span className="text-sm font-bold text-gray-800 mt-0.5">{formData.Grade || "—"}</span>
              </div>
              <div className="flex flex-col bg-white rounded-xl px-4 py-2 shadow-sm border border-indigo-100 min-w-[140px]">
                <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">eBuySugar Quintal</span>
                <span className="text-sm font-bold text-indigo-700 mt-0.5">{formatReadableAmount(ebuyPopupRow?.Buyer_Quantal)}</span>
              </div>
              {/* <div className="flex flex-col bg-white rounded-xl px-4 py-2 shadow-sm border border-indigo-100 min-w-[120px]">
                <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">Buyer Code</span>
                <span className="text-sm font-bold text-gray-800 mt-0.5">{ebuyPopupRow?.Buyer}</span>
              </div> */}

            </div>

            {/* ── Table body ── */}
            <div className="overflow-auto flex-1">
              {ebuyPopupLoading ? (
                <div className="flex items-center justify-center h-40 text-indigo-500 text-sm gap-2">
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeOpacity="0.25" />
                    <path d="M21 12a9 9 0 00-9-9" />
                  </svg>
                  Loading records…
                </div>
              ) : ebuyPopupData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm gap-2">
                  <svg className="w-8 h-8 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                  </svg>
                  No linked sale records found for this entry.
                </div>
              ) : (
                <table className="w-full text-xs border-collapse">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-gradient-to-r from-slate-700 to-slate-600 text-white">
                      {["Sr No.", "Sauda Date", "Lifting Date", "Buyer Code", "Buyer Name", "Buyer Quantal", "Sale Rate", "Grade"].map(h => (
                        <th key={h} className="px-3 py-2 text-center font-semibold whitespace-nowrap text-xs tracking-wide">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ebuyPopupData.map((row, idx) => (
                      <tr
                        key={row.tenderdetailid ?? idx}
                        className={`border-b border-gray-100 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-slate-50"} hover:bg-indigo-50`}
                      >
                        {/* Actions — FIRST column */}
                        {/* <td className="px-3 py-2 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setEbuyPopupOpen(false);
                                const u = users.find(u => String(u.tenderdetailid) === String(row.tenderdetailid));
                                if (u) editUser(u);
                              }}
                              title="Edit"
                              className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-colors shadow-sm"
                            >
                              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                setEbuyPopupOpen(false);
                                const u = users.find(u => String(u.tenderdetailid) === String(row.tenderdetailid));
                                if (u) deleteModeHandler(u);
                              }}
                              title="Delete"
                              className="inline-flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-colors shadow-sm"
                            >
                              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                                <path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                              </svg>
                              Delete
                            </button>
                          </div>
                        </td> */}
                        <td className="px-3 py-2 text-center text-gray-400 font-medium">{idx + 1}</td>
                        <td className="px-3 py-2 text-center text-gray-700 font-medium">{row.Sauda_Date || "—"}</td>
                        <td className="px-3 py-2 text-center text-gray-700">{row.Lifting_Date || "—"}</td>
                        <td className="px-3 py-2 text-center">
                          <span className="bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-md text-[11px]">{row.Buyer}</span>
                        </td>
                        <td className="px-3 py-2 text-left text-gray-800 font-medium whitespace-nowrap">{row.buyername || "—"}</td>
                        <td className="px-3 py-2 text-right font-semibold text-emerald-700">{formatReadableAmount(row.Buyer_Quantal)}</td>
                        <td className="px-3 py-2 text-right font-semibold text-blue-700">{formatReadableAmount(row.Sale_Rate)}</td>
                        <td className="px-3 py-2 text-center">
                          <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[10px] font-semibold">{row.detailgrade || "—"}</span>
                        </td>
                        {/* <td className="px-3 py-2 text-center text-gray-500">{row.ebuyid}</td> */}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="sticky bottom-0 z-10">
                    <tr className="bg-indigo-50 border-t-2 border-indigo-200">
                      <td colSpan={5} className="px-3 py-2 text-right text-xs font-bold text-indigo-700 uppercase tracking-wide">
                        Total Quantal
                      </td>
                      <td className="px-3 py-2 text-right text-sm font-extrabold text-emerald-700">
                        {formatReadableAmount(
                          ebuyPopupData.reduce((sum, r) => sum + (parseFloat(r.Buyer_Quantal) || 0), 0)
                        )}
                      </td>
                      <td colSpan={3} />
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>

            {/* ── Footer ── */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200 bg-gray-50 flex-shrink-0">
              <span className="text-xs text-gray-500">
                <span className="font-semibold text-indigo-600">{ebuyPopupData.length}</span> linked record{ebuyPopupData.length !== 1 ? "s" : ""} found
              </span>
              <button
                onClick={() => setEbuyPopupOpen(false)}
                className="px-5 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-600 text-sm font-semibold hover:bg-gray-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
export default TenderPurchase;