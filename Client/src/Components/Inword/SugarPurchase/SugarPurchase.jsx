import React, { useState, useRef, useEffect } from "react";
import AccountMasterHelp from "../../../Helper/AccountMasterHelp";
import GSTRateMasterHelp from "../../../Helper/GSTRateMasterHelp";
import axios from "axios";
import io from "socket.io-client";
import { useNavigate, useLocation } from "react-router-dom";
import ActionButtonGroup from "../../../Common/CommonButtons/ActionButtonGroup";
import NavigationButtons from "../../../Common/CommonButtons/NavigationButtons";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { useRecordLocking } from "../../../hooks/useRecordLocking";
import SugarPurchaseDetail from "./SugarPurchaseDetail";
import AddButton from "../../../Common/Buttons/AddButton";
import EditButton from "../../../Common/Buttons/EditButton";
import DeleteButton from "../../../Common/Buttons/DeleteButton";
import OpenButton from "../../../Common/Buttons/OpenButton";
import UserAuditInfo from "../../../Common/UserAuditInfo/UserAuditInfo";
import "./SugarPurchase.css"
import SugarPurchaseReport from "./SugarPurchaseReport";
import SaveUpdateSpinner from "../../../Common/Spinners/SaveUpdateSpinner";
import Swal from "sweetalert2";
import { InWordPostDateRecordLock } from "../../../Common/PostDateLock/PostDateRangeCheck"
import { validateDocumentDate } from "../../../Common/ValidateDateRange/ValidateDateRange"
import formatTruckNumber from "../../../Common/FormatFunctions/FormatTruckNumber"
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";

//Global Variables
var purchaseidNew = "";
var FromName = "";
var FromCode = "";
var Unitname = "";
var UnitCode = "";
var MillName = "";
var MillCode = "";
var BrokerName = "";
var BrokerCode = "";
var GstRateName = "";
var GstRateCode = "";
var ItemName = "";
var ItemCodeNew = "";
var BrandName = "";
var BrandCode = "";
var subTotal = 0.0;
var globalQuantalTotal = 0;
var CGSTRate = 0.0;
var SGSTRate = 0.0;
var IGSTRate = 0.0;
var BillAmountNew = 0.0;
var newAcCode = 0;

var selectedfilter = "";

// Common style for all table headers
const headerCellStyle = {
  fontWeight: "bold",
  backgroundColor: "#3f51b5",
  color: "white",
  padding: "6px",
  textAlign: "center",
  "&:hover": {
    backgroundColor: "#303f9f",
    cursor: "pointer",
  },
};

const SugarPurchase = () => {
  const API_URL = process.env.REACT_APP_API;
  const WEBSOCKET_URL = process.env.REACT_APP_API_URL;
  const companyCode = sessionStorage.getItem("Company_Code");
  const Year_Code = sessionStorage.getItem("Year_Code");
  const username = sessionStorage.getItem("username");
  const Post_Date = sessionStorage.getItem("Post_Date");
  const Inword_Date = sessionStorage.getItem("Inword_Date");
  const TCSApplicable = sessionStorage.getItem("TCSApplicable");
  const User_Id = sessionStorage.getItem("User_ID");

  // ----------------------------------------- Sugar Purchase Head Functionality -----------------------------------------

  const [users, setUsers] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMode, setPopupMode] = useState("add");
  const [selectedUser, setSelectedUser] = useState({});
  const [deleteMode, setDeleteMode] = useState(false);
  const [brandCode, setBrandCode] = useState("");
  const [brandCodeAccoid, setBrandCodeAccoid] = useState("");
  const [itemSelect, setItemSelect] = useState("");
  const [itemSelectAccoid, setItemSelectAccoid] = useState("");

  // Sugar Purchase Detail States.
  const [formDataDetail, setFormDataDetail] = useState({
    Quantal: "",
    packing: "50",
    bags: "",
    rate: null,
    item_Amount: null,
    narration: "",
    detail_id: 1,
  });

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
  const [lastTenderDetails, setLastTenderDetails] = useState([]);
  const [lastTenderData, setLastTenderData] = useState({});
  const [formErrors, setFormErrors] = useState({});

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const navigatedRecord = searchParams.get('navigatedRecord');

  const selectedRecord = location.state?.selectedRecord;
  const permissions = location.state?.permissionsData;
  const navigate = useNavigate();
  const [isHandleChange, setIsHandleChange] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [itemNameLabel, setItemNameLabel] = useState("");
  const [brandName, setBrandName] = useState("");

  const inputRef = useRef(null);

  const addButtonRef = useRef(null);
  const firstInputRef = useRef(null);
  const setFocusToFirstField = () => {
    if (firstInputRef.current) {
      firstInputRef.current.focus();
    }
  };

  const initialFormData = {
    doc_no: "",
    Tran_Type: "PS",
    PURCNO: "",
    doc_date: new Date().toISOString().split("T")[0],
    Ac_Code: "",
    Unit_Code: "",
    mill_code: "",
    FROM_STATION: "",
    TO_STATION: "",
    LORRYNO: "",
    BROKER: "",
    wearhouse: "",
    subTotal: 0.0,
    LESS_FRT_RATE: 0.0,
    freight: 0.0,
    cash_advance: 0.0,
    bank_commission: 0.0,
    OTHER_AMT: 0.0,
    Bill_Amount: 0.0,
    Due_Days: 1,
    NETQNTL: 0.0,
    Company_Code: companyCode,
    Year_Code: Year_Code,
    Branch_Code: "",
    Created_By: "",
    Modified_By: "",
    Bill_No: "",
    GstRateCode: "",
    CGSTRate: 0.0,
    CGSTAmount: 0.0,
    SGSTRate: 0.0,
    SGSTAmount: 0.0,
    IGSTRate: 0.0,
    IGSTAmount: 0.0,
    EWay_Bill_No: "",
    purchaseid: null,
    ac: "",
    uc: "",
    mc: "",
    bk: "",
    grade: "",
    mill_inv_date: new Date().toISOString().split("T")[0],
    Purcid: "",
    SelfBal: "",
    TCS_Rate: 0.0,
    TCS_Amt: 0.0,
    TCS_Net_Payable: 0.0,
    TDS_Rate: 0.0,
    TDS_Amt: 0.0,
    Retail_Stock: "N",
    purchaseidnew: 1,
    gstid: 0,
    Unit: "QTL"
  };

  const [formData, setFormData] = useState(initialFormData);
  const [DoNo, setDoNo] = useState("");
  const [from, setFrom] = useState("");
  const [unit, setUnit] = useState("");
  const [mill, setMill] = useState("");
  const [broker, setBroker] = useState("");
  const [gstCode, setGstCode] = useState("");
  const [gstRate, setGstRate] = useState("");

  //Using the useRecordLocking to manage the multiple user cannot edit the same record at a time.
  const { isRecordLockedByUser, lockRecord, unlockRecord } = useRecordLocking(
    formData.doc_no,
    undefined,
    companyCode,
    Year_Code,
    "sugar_purchase"
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    const updatedValue = name === "LORRYNO" ? formatTruckNumber(value) : value;

    setFormData((prevState) => ({
      ...prevState,
      [name]: updatedValue,
    }));
  };

  useEffect(() => {
    if (isHandleChange) {
      handleCancel();
      setIsHandleChange(false);
    }
  }, []);

  const calculateTotals = () => {
    const subTotal = users.reduce(
      (total, user) => total + (parseFloat(user.item_Amount) || 0),
      0
    );
    const quantalTotal = users.reduce(
      (total, user) => total + (parseFloat(user.Quantal) || 0),
      0
    );
    const cgstRate = parseFloat(formData.CGSTRate) || 0;
    const sgstRate = parseFloat(formData.SGSTRate) || 0;
    const igstRate = parseFloat(formData.IGSTRate) || 0;
    const tcsRate = parseFloat(formData.TCS_Rate) || 0;
    const tdsRate = parseFloat(formData.TDS_Rate) || 0;
    const cgstAmount = ((subTotal * cgstRate) / 100).toFixed(2);
    const sgstAmount = ((subTotal * sgstRate) / 100).toFixed(2);
    const igstAmount = ((subTotal * igstRate) / 100).toFixed(2);
    const tcsAmount = (
      ((parseFloat(formData.Bill_Amount) || 0) * tcsRate) /
      100
    ).toFixed(2);
    const tdsAmount = ((subTotal * tdsRate) / 100).toFixed(2);
    const otherAmt = parseFloat(formData.OTHER_AMT) || 0;
    const cashAdvance = parseFloat(formData.cash_advance) || 0;
    const bankCommission = parseFloat(formData.bank_commission) || 0;
    const billAmount =
      subTotal +
      parseFloat(cgstAmount) +
      parseFloat(sgstAmount) +
      parseFloat(igstAmount) +
      otherAmt +
      cashAdvance +
      bankCommission;
    const freightRate = parseFloat(formData.LESS_FRT_RATE) || 0;
    const formattedFreightRate = freightRate.toFixed(2);
    const freightAmt = formattedFreightRate * quantalTotal;

    const netPayable = (billAmount + parseFloat(tcsAmount)).toFixed(2);
    setFormData((prev) => ({
      ...prev,
      subTotal: subTotal.toFixed(2),
      CGSTAmount: cgstAmount,
      SGSTAmount: sgstAmount,
      IGSTAmount: igstAmount,
      Bill_Amount: billAmount.toFixed(2),
      TCS_Amt: tcsAmount,
      TDS_Amt: tdsAmount,
      TCS_Net_Payable: netPayable,
      NETQNTL: quantalTotal.toFixed(2),
      freight: freightAmt.toFixed(2),
      TCS_Rate: tcsRate,
      TDS_Rate: tdsRate
    }));
  };

  const fetchLastRecord = () => {
    fetch(
      `${API_URL}/get-next-doc-no-purchaseBill?Company_Code=${companyCode}&Year_Code=${Year_Code}`
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

  const fetchDefaultGSTRate = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/get_default_gstrate?Company_Code=${companyCode}`
      );

      // Update the formData with the default GSTRate
      setFormData((prevData) => ({
        ...prevData,
        GstRateCode: response.data.def_gst_rate_code,
      }));
    } catch (error) {
      console.error("Error fetching default GSTRate:", error);
    }
  };

  const handleAddOne = async () => {
    setAddOneButtonEnabled(false);
    setSaveButtonEnabled(true);
    setCancelButtonEnabled(true);
    setEditButtonEnabled(false);
    setDeleteButtonEnabled(false);
    setIsEditMode(false);
    setIsEditing(true);
    fetchLastRecord();
    fetchDefaultGSTRate();
    setFormData(initialFormData);

    FromName = "";
    FromCode = "";
    Unitname = "";
    UnitCode = "";
    MillName = "";
    MillCode = "";
    BrokerName = "";
    BrokerCode = "";
    GstRateName = "";
    GstRateCode = "";
    ItemName = "";
    ItemCodeNew = "";
    BrandName = "";
    BrandCode = "";
    subTotal = "";
    globalQuantalTotal = "";
    setLastTenderDetails([]);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  //Edit button Functionality
  const handleEdit = async () => {
    const Post_Date = sessionStorage.getItem("Post_Date");
    const Inword_Date = sessionStorage.getItem("Inword_Date");
    if (await InWordPostDateRecordLock(formData.doc_date, Post_Date, Inword_Date)) {
      return;
    }
    if (parseInt(formData.PURCNO) !== 0) {
      Swal.fire({
        title: "Error",
        text: `Couldn't Edit this record it is currently referenced in DO No. ${formData.PURCNO}`.trim(),
        icon: "error",
        confirmButtonText: "OK"
      });
      return;
    }

    if (formData.EWay_Bill_No && formData.EWay_Bill_No.trim() !== "") {
      Swal.fire({
        icon: "warning",
        text: "E-WayBill has already been generated for this record.",
        confirmButtonColor: "#d33",
      });
    }

    axios
      .get(
        `${API_URL}/getsugarpurchasebyid?doc_no=${formData.doc_no}&Company_Code=${companyCode}&Year_Code=${Year_Code}`
      )
      .then((response) => {
        const data = response.data;
        const isLockedNew = data.getData_SugarPurchaseHead_data.LockedRecord;
        const isLockedByUserNew =
          data.getData_SugarPurchaseHead_data.LockedUser;

        if (isLockedNew) {
          Swal.fire({
            icon: "warning",
            title: "Record Locked",
            text: `This record is locked by ${isLockedByUserNew}`,
            confirmButtonColor: "#d33",
          });
          return
        }
        else {
          lockRecord();
        }
        setFormData({
          ...formData,
          ...data.getData_SugarPurchaseHead_data,
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
          "This record is already deleted! Showing the previous record."
        );
      });
  };

  const handleSaveOrUpdate = async () => {
    const Post_Date = sessionStorage.getItem("Post_Date");
    const Inword_Date = sessionStorage.getItem("Inword_Date");
    if (await InWordPostDateRecordLock(formData.doc_date, Post_Date, Inword_Date)) {
      return;
    }

    const accountingYearData = sessionStorage.getItem('Accounting_Year');
    const formattedEntryDate = formData.doc_date;
    const isValid = validateDocumentDate(formattedEntryDate, accountingYearData);

    if (!isValid) {
      return
    }

    let missingFields = [];
    if (!formData.Ac_Code) missingFields.push("From A/c");
    if (!formData.mill_code) missingFields.push("Mill Name");
    if (!formData.GstRateCode) missingFields.push("GST Code");

    if (missingFields.length > 0) {
      Swal.fire({
        text: `Please Select the following fields: ${missingFields.join(", ")}`,
        icon: "warning",
        confirmButtonText: "OK"
      });
      return;
    }

    if (users.length === 0 || users.every(user => user.rowaction === "DNU" || user.rowaction === "delete")) {
      Swal.fire({
        text: "Please add at least one entry in the detail grid.",
        icon: "warning",
        confirmButtonText: "OK"
      });
      return;
    }

    setIsEditing(true);
    setIsLoading(true);

    let headData = {
      ...formData,
      subTotal: subTotal,
      NETQNTL: globalQuantalTotal,
      GstRateCode: gstCode || GstRateCode,
    };
    delete headData[""];
    if (isEditMode) {
      headData = {
        ...headData,
        Modified_By: username,
        User_Id: User_Id
      }
      delete headData.purchaseid;
    }
    else {
      headData = {
        ...headData,
        Created_By: username
      }
    }
    const detailData = users.map((user) => ({
      rowaction: user.rowaction,
      purchasedetailid: user.purchasedetailid,
      Tran_Type: "PS",
      item_code: user.item_code,
      ic: user.ic,
      Brand_Code: user.Brand_Code,
      Quantal: user.Quantal,
      packing: user.packing,
      bags: user.bags,
      rate: user.rate,
      item_Amount: user.item_Amount,
      narration: user.narration,
      Company_Code: companyCode,
      Year_Code: Year_Code,
      Branch_Code: 1,
      detail_id: 1,
    }));
    const requestData = {
      headData,
      detailData,
    };
    try {
      if (isEditMode) {
        const updateApiUrl = `${API_URL}/update-SugarPurchase?purchaseid=${purchaseidNew}`;
        const response = await axios.put(updateApiUrl, requestData);

        await unlockRecord();
        Swal.fire({
          title: "Success!",
          text: "Record Updated Successfully!",
          icon: "success",
          confirmButtonText: "OK"
        });

      } else {
        const response = await axios.post(
          `${API_URL}/insert_SugarPurchase`,
          requestData
        );
        Swal.fire({
          title: "Success!",
          text: "Record Created Successfully!",
          icon: "success",
          confirmButtonText: "OK"
        });
      }
      setIsEditMode(false);
      setAddOneButtonEnabled(true);
      setEditButtonEnabled(true);
      setDeleteButtonEnabled(true);
      setBackButtonEnabled(true);
      setSaveButtonEnabled(false);
      setCancelButtonEnabled(false);
      setIsEditing(true);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      navigate(`/sugarpurchasebill?navigatedRecord=${formData.doc_no}`);
    } catch (error) {
      console.error("Error during API call:", error);
      toast.error("Error occurred while saving data");
    } finally {
      setIsEditing(false);
      setIsLoading(false);
    }
  };


  const handleDelete = async () => {
    const Post_Date = sessionStorage.getItem("Post_Date");
    const Inword_Date = sessionStorage.getItem("Inword_Date");
    if (await InWordPostDateRecordLock(formData.doc_date, Post_Date, Inword_Date)) {
      return;
    }

    if (parseInt(formData.PURCNO) !== 0) {
      Swal.fire({
        title: "Error",
        text: `Couldn't delete this record it is currently referenced in DO No. ${formData.PURCNO}`.trim(),
        icon: "error",
        confirmButtonText: "OK"
      });
      return;
    }

    if (formData.EWay_Bill_No && formData.EWay_Bill_No.trim() !== "") {
      Swal.fire({
        title: "Error",
        text: `E-WayBill has already been generated for this record. Deletion is not allowed.`,
        icon: "error",
        confirmButtonText: "OK"
      });
      return;
    }

    try {
      const response = await axios.get(
        `${API_URL}/getsugarpurchasebyid?doc_no=${formData.doc_no}&Company_Code=${companyCode}&Year_Code=${Year_Code}`
      );

      const data = response.data;
      const isLockedNew = data.getData_SugarPurchaseHead_data.LockedRecord;
      const isLockedByUserNew = data.getData_SugarPurchaseHead_data.LockedUser;

      if (isLockedNew) {
        Swal.fire({
          title: "Record Locked",
          text: `This record is locked by ${isLockedByUserNew}`,
          icon: "warning",
          confirmButtonText: "OK",
        });
        return;
      }

      const result = await Swal.fire({
        title: "Are you sure?",
        text: `Do you really want to delete Doc No: ${formData.doc_no}?`,
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

        const deleteApiUrl = `${API_URL}/delete_data_SugarPurchase?purchaseid=${formData.purchaseid}&Company_Code=${companyCode}&doc_no=${formData.doc_no}&Year_Code=${Year_Code}&tran_type=${formData.Tran_Type}&User_Id=${User_Id}`;
        const deleteResponse = await axios.delete(deleteApiUrl);

        if (deleteResponse.status === 200) {
          if (deleteResponse.data) {
            Swal.fire({
              title: "Deleted!",
              text: "Data deleted successfully!",
              icon: "success",
              confirmButtonText: "OK",
            });
            handleCancel();
          }
        } else {
          Swal.fire({
            title: "Error",
            text: "Failed to delete the record.",
            icon: "error",
            confirmButtonText: "OK",
          });
        }
      } else {
        Swal.fire({
          title: "Cancelled",
          text: "Your record is safe 🙂",
          icon: "info",
          confirmButtonText: "OK",
        });
      }
    } catch (error) {
      console.error("Error during API call:", error);
      Swal.fire({
        title: "Error",
        text: `There was an error during the deletion: ${error.message}`,
        icon: "error",
        confirmButtonText: "OK",
      });
    } finally {
      setIsLoading(false);
    }
  };


  // Common Feilds to set the feilds on the navigation.
  const NavigationSetFields = (headData, detailData) => {
    const details = detailData[0];
    purchaseidNew = headData.purchaseid;
    FromName = details.FromName;
    FromCode = headData.Ac_Code;
    newAcCode = headData.Ac_Code;
    Unitname = details.Unit_Name;
    UnitCode = headData.Unit_Code;
    MillName = details.Mill_Name;
    MillCode = headData.mill_code;
    BrokerName = details.Broker_Name;
    BrokerCode = headData.BROKER;
    GstRateName = details.GST_Name;
    GstRateCode = headData.GstRateCode;
    ItemName = details.ItemName;
    ItemCodeNew = details.item_code;
    BrandName = details.Brand_Name;
    BrandCode = details.Branch_Code;
    subTotal = headData.subTotal;
    globalQuantalTotal = headData.NETQNTL;
    CGSTRate = headData.CGSTRate;
    SGSTRate = headData.SGSTRate;
    IGSTRate = headData.IGSTRate;
    BillAmountNew = headData.Bill_Amount;

    setFormData((prevData) => ({
      ...prevData,
      ...headData,
    }));
    setLastTenderData(headData || {});
    setLastTenderDetails(detailData || []);
  };

  // handle cancel button is cliked show last record on the datatabse.
  const handleCancel = async () => {
    try {
      setIsEditing(false);
      setIsEditMode(false);
      setAddOneButtonEnabled(true);
      setEditButtonEnabled(true);
      setDeleteButtonEnabled(true);
      setBackButtonEnabled(true);
      setSaveButtonEnabled(false);
      setCancelButtonEnabled(false);
      setCancelButtonClicked(true);

      const response2 = await axios.get(
        `${API_URL}/get-lastrecordsugarpurchase?Company_Code=${companyCode}&Year_Code=${Year_Code}`
      );

      if (response2.status === 200) {
        const data = response2.data;
        NavigationSetFields(
          data.last_SugarPurchasehead,
          data.last_SugarPurchasedetail
        );

        unlockRecord();
      } else {
        console.error(
          "Failed to fetch last record data:",
          response2.status,
          response2.statusText
        );
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  // handle back button navigate to the dashboard page.
  const handleBack = () => {
    navigate("/sugarpurchasebill-utility");
  };

  // Navigation Function to navigate to the first to last record easily.
  const handleFirstButtonClick = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/get-firstsugarpurchase-navigation?Company_Code=${companyCode}&Year_Code=${Year_Code}`
      );
      if (response.status === 200) {
        const data = response.data;
        NavigationSetFields(
          data.first_SugarPurchaseHead_data,
          data.first_SugarPurchasedetail_data
        );
      } else {
        console.error(
          "Failed to fetch first tender data:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error during API call:", error);
    }
  };

  const handleLastButtonClick = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/getlastSugarPurchase-record-navigation?Company_Code=${companyCode}&Year_Code=${Year_Code}`
      );
      if (response.status === 200) {
        const data = response.data;
        NavigationSetFields(
          data.last_SugarPurchaseHead_data,
          data.last_SugarPurchasedetail_data
        );
      } else {
        console.error(
          "Failed to fetch last tender data:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error during API call:", error);
    }
  };

  const handleNextButtonClick = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/getnextsugarpurchase-navigation?Company_Code=${companyCode}&Year_Code=${Year_Code}&doc_no=${formData.doc_no}`
      );
      if (response.status === 200) {
        const data = response.data;
        NavigationSetFields(
          data.next_SugarPurchasehead_data,
          data.next_SugarPurchasedetails_data
        );
      } else {
        console.error(
          "Failed to fetch next tender data:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error during API call:", error);
    }
  };

  const handlePreviousButtonClick = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/getprevioussugarpurchase-navigation?Company_Code=${companyCode}&Year_Code=${Year_Code}&doc_no=${formData.doc_no}`
      );

      if (response.status === 200) {
        const data = response.data;
        NavigationSetFields(
          data.previous_SugarPurchaseHead_data,
          data.previous_SugarPurchasedetail_data
        );
      } else {
        console.error(
          "Failed to fetch previous tender data:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error during API call:", error);
    }
  };

  // Handle form submission (you can modify this based on your needs)
  const handleSubmit = (event) => {
    event.preventDefault();
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

  // Notify if the record currently open here gets changed/deleted by someone else
  useEffect(() => {
    const socket = io(WEBSOCKET_URL, { transports: ["websocket"] });

    socket.on("purchase_bill_updated", (data) => {
      if (data?.purchaseid && formData.purchaseid && String(data.purchaseid) === String(formData.purchaseid)) {
        axios.get(`${API_URL}/getsugarpurchasebyid?doc_no=${formData.doc_no}&Company_Code=${companyCode}&Year_Code=${Year_Code}`)
          .then((response) => {
            if (response.status === 200) {
              NavigationSetFields(
                response.data.getData_SugarPurchaseHead_data,
                response.data.getData_SugarPurchaseDetail_data
              );
            }
          })
          .catch((error) => {
            console.error("Error refreshing record after live update:", error);
          });
      }
    });

    socket.on("purchase_bill_deleted", (data) => {
      if (data?.purchaseid && formData.purchaseid && String(data.purchaseid) === String(formData.purchaseid)) {
        toast.warning("This record was deleted by another user.");
      }
    });

    return () => {
      socket.off("purchase_bill_updated");
      socket.off("purchase_bill_deleted");
      socket.disconnect();
    };
  }, [formData.purchaseid]);

  //After Record DoubleClicked on utility page show that record on User Creation for Edit Mode
  const handlerecordDoubleClicked = async () => {
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
      const response = await axios.get(
        `${API_URL}/getsugarpurchasebyid?doc_no=${selectedRecord.doc_no}&Company_Code=${companyCode}&Year_Code=${Year_Code}`
      );
      if (response.status === 200) {
        const data = response.data;
        NavigationSetFields(
          data.getData_SugarPurchaseHead_data,
          data.getData_SugarPurchaseDetail_data
        );
      } else {
        console.error(
          "Failed to fetch last tender data:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error during API call:", error);
    }
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
      const response = await axios.get(
        `${API_URL}/getsugarpurchasebyid?doc_no=${navigatedRecord}&Company_Code=${companyCode}&Year_Code=${Year_Code}`
      );
      if (response.status === 200) {
        const data = response.data;
        NavigationSetFields(
          data.getData_SugarPurchaseHead_data,
          data.getData_SugarPurchaseDetail_data
        );
      } else {
        console.error(
          "Failed to fetch last tender data:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error during API call:", error);
    }
  };

  //change No functionality to get that particular record
  const handleKeyDown = async (event) => {
    if (event.key === "Tab") {
      const changeNoValue = event.target.value;
      try {
        const response = await axios.get(
          `${API_URL}/getsugarpurchasebyid?Company_Code=${companyCode}&doc_no=${changeNoValue}&Year_Code=${Year_Code}`
        );
        const data = response.data;
        NavigationSetFields(
          data.getData_SugarPurchaseHead_data,
          data.getData_SugarPurchaseDetail_data
        );
        setIsEditing(false);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }
  };

  // ----------------------------------------- Sugar Purchase Detail Functionality -----------------------------------------

  useEffect(() => {
    if (selectedRecord) {
      setUsers(
        lastTenderDetails.map((detail) => ({
          rowaction: "Normal",
          id: detail.purchasedetailid,
          purchasedetailid: detail.purchasedetailid,
          item_code: detail.item_code,
          ic: detail.ic,
          Brand_Code: detail.Brand_Code,
          Quantal: detail.Quantal,
          packing: detail.packing,
          bags: detail.bags,
          rate: detail.rate,
          item_Amount: detail.item_Amount,
          narration: detail.narration,
          itemNameLabel: detail.itemNameLabel,
          brandName: detail.brandName,
          detail_id: detail.detail_id,
        }))
      );
    }
  }, [selectedRecord, lastTenderDetails]);

  useEffect(() => {
    setUsers(
      lastTenderDetails.map((detail) => ({
        rowaction: "Normal",
        id: detail.purchasedetailid,
        purchasedetailid: detail.purchasedetailid,
        item_code: detail.item_code,
        ic: detail.ic,
        Brand_Code: detail.Brand_Code,
        Quantal: detail.Quantal,
        packing: detail.packing,
        bags: detail.bags,
        rate: detail.rate,
        item_Amount: detail.item_Amount,
        narration: detail.narration,
        itemNameLabel: detail.ItemName,
        brandName: detail.Brand_Name,
        detail_id: detail.detail_id,
      }))
    );
  }, [lastTenderDetails]);

  // Function to handle changes in the form fields
  const handleChangeDetail = (event) => {
    const { name, value } = event.target;
    let updatedFormDataDetail = { ...formDataDetail, [name]: value };

    if (name === "Quantal") {
      const quantal = parseFloat(value);
      const packing = parseFloat(formDataDetail.packing);

      updatedFormDataDetail = {
        ...updatedFormDataDetail,
        bags:
          !isNaN(quantal) && !isNaN(packing) && packing !== 0
            ? Math.round((quantal * 100) / packing)
            : "",
      };
    }

    if (name === "packing") {
      const packing = parseFloat(value);
      const quantal = parseFloat(formDataDetail.Quantal);

      updatedFormDataDetail = {
        ...updatedFormDataDetail,
        bags:
          !isNaN(quantal) && !isNaN(packing) && packing !== 0
            ? Math.round((quantal * 100) / packing)
            : "",
      };
    }

    if (name === "rate" || name === "Quantal") {
      const quantal = parseFloat(updatedFormDataDetail.Quantal);
      const rate = parseFloat(updatedFormDataDetail.rate);

      updatedFormDataDetail = {
        ...updatedFormDataDetail,
        item_Amount:
          !isNaN(quantal) && !isNaN(rate)
            ? (quantal * rate).toFixed(2)
            : "0.00",
      };
    }

    setFormDataDetail(updatedFormDataDetail);
  };

  //open popup function
  const openPopup = (mode) => {
    setPopupMode(mode);
    setShowPopup(true);
    if (mode === "add") {
      clearForm();
    }
  };

  //close popup function
  const closePopup = () => {
    setShowPopup(false);
    setSelectedUser({});
    clearForm();
  };

  const clearForm = () => {
    setFormDataDetail({
      Quantal: "",
      packing: 50 || "",
      bags: "",
      rate: 0.0,
      item_Amount: 0.0,
      narration: "",
    });
    setItemSelect("");
    setItemNameLabel("");
    setBrandCode("");
    setBrandName("");
    setSelectedUser({});
  };

  const editUser = (user) => {
    setSelectedUser(user);
    setItemSelect(user.item_code);
    setBrandCode(user.Branch_Code);
    setBrandName(user.brandName);
    setItemNameLabel(user.itemNameLabel);
    setFormDataDetail({
      bags: user.bags || "",
      packing: user.packing || "",
      Quantal: user.Quantal || "",
      rate: user.rate || "",
      item_Amount: user.item_Amount || "",
      narration: user.narration || "",
    });
    openPopup("edit");
  };

  const fetchMatchStatus = async (params) => {
    try {
      const response = await axios.get(`${API_URL}/get_match_status`, {
        params,
      });
      return response.data.match_status;
    } catch (error) {
      console.error("Error fetching match status:", error);
      return null;
    }
  };

  const handleMatchStatus = (match_status, subTotal) => {
    const gstRateDivide = parseFloat(gstRate);

    // Calculate CGST, SGST, and IGST rates based on the given GST rate
    const cgstRate = cancelButtonClicked
      ? parseFloat(CGSTRate)
      : gstRateDivide / 2;
    const sgstRate = cancelButtonClicked
      ? parseFloat(SGSTRate)
      : gstRateDivide / 2;
    const igstRate = cancelButtonClicked ? parseFloat(IGSTRate) : gstRateDivide;

    const cgstAmount = parseFloat(
      calculateGSTAmount(subTotal, cgstRate)
    ).toFixed(2);
    const sgstAmount = parseFloat(
      calculateGSTAmount(subTotal, sgstRate)
    ).toFixed(2);
    const igstAmount = parseFloat(
      calculateGSTAmount(subTotal, igstRate)
    ).toFixed(2);

    const TCSRate = parseFloat(formData.TCS_Rate) || 0;
    const TDSRate = parseFloat(formData.TDS_Rate) || 0;

    let billAmount;
    let netPayable;
    let TCSAmount;
    let TDSAmount;

    if (match_status === "TRUE") {
      billAmount =
        parseFloat(subTotal) +
        parseFloat(cgstAmount) +
        parseFloat(sgstAmount) +
        parseFloat(formData.OTHER_AMT) +
        parseFloat(formData.cash_advance);
      netPayable = billAmount.toFixed(2);
      TCSAmount = (billAmount * TCSRate) / 100;
      TDSAmount = (subTotal * TDSRate) / 100;
      setFormData({
        ...formData,
        CGSTRate: cgstRate.toFixed(2),
        SGSTRate: sgstRate.toFixed(2),
        IGSTRate: 0.0,
        CGSTAmount: cgstAmount,
        SGSTAmount: sgstAmount,
        IGSTAmount: 0.0,
        Bill_Amount: billAmount,
        TCS_Net_Payable: netPayable,
        TCS_Amt: TCSAmount,
        TDS_Amt: TDSAmount,
      });
    } else {
      billAmount =
        parseFloat(subTotal) +
        parseFloat(igstAmount) +
        parseFloat(formData.OTHER_AMT) +
        parseFloat(formData.cash_advance);
      netPayable = billAmount.toFixed(2);
      TCSAmount = (billAmount * TCSRate) / 100;
      TDSAmount = (subTotal * TDSRate) / 100;
      setFormData({
        ...formData,
        CGSTRate: 0.0,
        SGSTRate: 0.0,
        IGSTRate: igstRate.toFixed(2),
        CGSTAmount: 0.0,
        SGSTAmount: 0.0,
        IGSTAmount: igstAmount,
        Bill_Amount: billAmount,
        TCS_Net_Payable: netPayable,
        TCS_Amt: TCSAmount,
        TDS_Amt: TDSAmount,
      });
    }
  };

  const addUser = async () => {

    if (itemSelect === "") {
      Swal.fire({
        icon: "warning",
        text: "Please Select Item.",
        confirmButtonColor: "#d33",
      });
      return false;
    }

    const newUser = {
      id: users.length > 0 ? Math.max(...users.map((user) => user.id)) + 1 : 1,
      item_code: itemSelect,
      ic: itemSelectAccoid,
      Brand_Code: brandCode,
      itemNameLabel: itemNameLabel,
      brandName: brandName,
      ...formDataDetail,
      rowaction: "add",
    };
    const newUsers = [...users, newUser];
    const totalItemAmount = newUsers.reduce((total, user) => {
      return total + parseFloat(user.item_Amount);
    }, 0);
    subTotal = totalItemAmount.toFixed(2);

    const totalQuantal = newUsers.reduce((total, user) => {
      return total + parseFloat(user.Quantal);
    }, 0);
    globalQuantalTotal = totalQuantal;

    setFormDataDetail({
      ...newUser,
      subTotal: subTotal,
    });

    const updatedFormData = {
      ...formData,
    };

    if (from !== "" || FromCode !== "") {
      const match_status = await fetchMatchStatus({
        Company_Code: companyCode,
        Year_Code: Year_Code,
        Ac_Code: cancelButtonClicked
          ? FromCode || updatedFormData.Ac_Code
          : from,
      });

      if (match_status) {
        handleMatchStatus(match_status, subTotal);
      }
    }
    setUsers([...users, newUser]);
    closePopup();
    setTimeout(() => {
      addButtonRef.current.focus();
    }, 500)
  };

  const updateUser = async () => {
    setTimeout(() => {
      addButtonRef.current.focus();
    }, 500)

    const updatedUsers = users.map((user) => {
      if (user.id === selectedUser.id) {
        const updatedRowaction =
          user.rowaction === "Normal" ? "update" : user.rowaction;
        const updatedItemAmount = (
          parseFloat(formDataDetail.Quantal) * parseFloat(formDataDetail.rate)
        ).toFixed(2);

        return {
          ...user,
          item_code: itemSelect,
          itemNameLabel: itemNameLabel,
          ic: itemSelectAccoid,
          Brand_Code: brandCode,
          brandName: brandName,
          ...formDataDetail,
          item_Amount: updatedItemAmount,
          rowaction: updatedRowaction,
        };
      } else {
        return user;
      }

    });

    const totalItemAmount = updatedUsers.reduce((total, user) => {
      return total + parseFloat(user.item_Amount);
    }, 0);
    subTotal = totalItemAmount.toFixed(2);
    const totalQuantal = updatedUsers.reduce((total, user) => {
      return total + parseFloat(user.Quantal);
    }, 0);
    globalQuantalTotal = totalQuantal;

    setFormDataDetail({
      ...updatedUsers,
      subTotal: subTotal,
    });

    const updatedFormData = {
      ...formData,
    };

    if (from !== "" || FromCode !== "") {
      const match_status = await fetchMatchStatus({
        Company_Code: companyCode,
        Year_Code: Year_Code,
        Ac_Code: cancelButtonClicked
          ? FromCode || updatedFormData.Ac_Code
          : from,
      });

      if (match_status) {
        handleMatchStatus(match_status, subTotal);
      }
    }

    setUsers(updatedUsers);
    closePopup();
  };

  const deleteModeHandler = async (userToDelete) => {
    let updatedUsers;

    if (isEditMode && userToDelete.rowaction === "add") {
      updatedUsers = users.map((u) =>
        u.id === userToDelete.id ? { ...u, rowaction: "DNU" } : u
      );
    } else if (isEditMode) {
      updatedUsers = users.map((u) =>
        u.id === userToDelete.id ? { ...u, rowaction: "delete" } : u
      );
    } else {
      updatedUsers = users.map((u) =>
        u.id === userToDelete.id ? { ...u, rowaction: "DNU" } : u
      );
    }
    const totalItemAmount = updatedUsers.reduce((total, u) => {
      if (u.rowaction !== "delete" && u.rowaction !== "DNU") {
        return total + parseFloat(u.item_Amount || 0);
      } else {
        return total;
      }
    }, 0);

    subTotal = totalItemAmount.toFixed(2);
    const totalQuantal = updatedUsers.reduce((total, u) => {
      if (u.rowaction !== "delete" && u.rowaction !== "DNU") {
        return total + parseFloat(u.Quantal);
      } else {
        return total;
      }
    }, 0);

    globalQuantalTotal = totalQuantal;

    const updatedFormData = {
      ...formData,
    };
    setFormDataDetail({
      ...formDataDetail,
      ...updatedUsers.find((u) => u.id === u.id),
      subTotal: subTotal,
    });

    if (from !== "" || FromCode !== "") {
      const match_status = await fetchMatchStatus({
        Company_Code: companyCode,
        Year_Code: Year_Code,
        Ac_Code: cancelButtonClicked
          ? FromCode || updatedFormData.Ac_Code
          : from,
      });

      if (match_status) {
        handleMatchStatus(match_status, subTotal);
      }
    }
    setUsers(updatedUsers);
    setDeleteMode(true);
    setSelectedUser(userToDelete);
  };

  const openDelete = async (user) => {
    let updatedUsers;
    setDeleteMode(true);
    setSelectedUser(user);

    if (isEditMode && user.rowaction === "delete") {
      updatedUsers = users.map((u) =>
        u.id === user.id ? { ...u, rowaction: "Normal" } : u
      );
    } else {
      updatedUsers = users.map((u) =>
        u.id === user.id ? { ...u, rowaction: "add" } : u
      );
    }

    const totalItemAmount = updatedUsers.reduce((total, u) => {
      if (u.rowaction !== "DNU" && u.rowaction !== "delete") {
        return total + parseFloat(u.item_Amount || 0);
      }
      return total;
    }, 0);

    const updatedSubTotal = totalItemAmount.toFixed(2);
    subTotal = updatedSubTotal;

    const totalQuantal = updatedUsers.reduce((total, u) => {
      if (u.rowaction !== "DNU" && u.rowaction !== "delete") {
        return total + parseFloat(u.Quantal || 0);
      }
      return total;
    }, 0);

    globalQuantalTotal = totalQuantal;

    setFormDataDetail((prevData) => ({
      ...prevData,
      subTotal: updatedSubTotal,
    }));

    if (from !== "" || FromCode !== "") {
      const match_status = await fetchMatchStatus({
        Company_Code: companyCode,
        Year_Code: Year_Code,
        Ac_Code: cancelButtonClicked ? FromCode || formData.Ac_Code : from,
      });

      if (match_status) {
        handleMatchStatus(match_status, updatedSubTotal);
      }
    }

    setUsers(updatedUsers);
    setSelectedUser({});
  };

  const handleItemSelect = (code, accoid, HSN, Name) => {
    setItemSelect(code);
    setItemSelectAccoid(accoid);
    setItemNameLabel(Name);
  };

  const handleBrandCode = (code, accoid, Name) => {
    setBrandCode(code);
    setBrandCodeAccoid(accoid);
    setBrandName(Name);
  };

  const handleDoNo = (code, accoid) => {
    setDoNo(code);
    setFormData({
      ...formData,
    });
  };

  const handleUnit = (code, accoid) => {
    setUnit(code);
    setFormData({
      ...formData,
      Unit_Code: code,
      uc: accoid,
    });
  };

  const handleMill = (code, accoid, name, Mobile_No, Gst_No, TDSApplicable, GSTStateCode, cityname) => {
    setMill(code);
    setFormData({
      ...formData,
      mill_code: code,
      mc: accoid,
      FROM_STATION: cityname
    });
  };

  const handleBroker = (code, accoid) => {
    setBroker(code);
    setFormData({
      ...formData,
      BROKER: code,
      bk: accoid,
    });
  };


  const tdsCalcInfoRef = useRef({ balancelimit: 0, purchaseTdsRate: 0, tcsRate: 0, priorAmt: 0 });

  const computePurchaseTdsTcsRates = (currentSubTotal) => {
    const info = tdsCalcInfoRef.current;
    const totalAmount = (info.priorAmt || 0) + (parseFloat(currentSubTotal) || 0);
    if (totalAmount >= (info.balancelimit || 0)) {
      return { TDS_Rate: info.purchaseTdsRate || 0, TCS_Rate: 0 };
    }
    return { TDS_Rate: 0, TCS_Rate: info.tcsRate || 0 };
  };

  const calculateAndUpdateFormData = async (subTotal, gstRate, matchStatus) => {
    const cgstRate = gstRate / 2;
    const sgstRate = gstRate / 2;
    const igstRate = gstRate;

    const cgstAmount = parseFloat(
      calculateGSTAmount(subTotal, cgstRate)
    ).toFixed(2);
    const sgstAmount = parseFloat(
      calculateGSTAmount(subTotal, sgstRate)
    ).toFixed(2);
    const igstAmount = parseFloat(
      calculateGSTAmount(subTotal, igstRate)
    ).toFixed(2);

    const { TDS_Rate: TDSRate, TCS_Rate: TCSRate } = computePurchaseTdsTcsRates(subTotal);

    let billAmount;
    let netPayable;
    let TCSAmount;
    let TDSAmount;

    if (matchStatus === "TRUE") {
      billAmount =
        parseFloat(subTotal) +
        parseFloat(cgstAmount) +
        parseFloat(sgstAmount) +
        parseFloat(formData.OTHER_AMT) +
        parseFloat(formData.cash_advance);
      netPayable = billAmount.toFixed(2);
      TCSAmount = (billAmount * TCSRate) / 100;
      TDSAmount = (subTotal * TDSRate) / 100;

      setFormData((prevFormData) => ({
        ...prevFormData,
        CGSTRate: cgstRate.toFixed(2),
        SGSTRate: sgstRate.toFixed(2),
        IGSTRate: "0.00",
        CGSTAmount: cgstAmount,
        SGSTAmount: sgstAmount,
        IGSTAmount: "0.00",
        Bill_Amount: billAmount,
        TCS_Net_Payable: netPayable,
        TCS_Rate: TCSRate,
        TCS_Amt: TCSAmount,
        TDS_Rate: TDSRate,
        TDS_Amt: TDSAmount,
      }));
    } else {
      billAmount =
        parseFloat(subTotal) +
        parseFloat(igstAmount) +
        parseFloat(formData.OTHER_AMT) +
        parseFloat(formData.cash_advance);
      netPayable = billAmount.toFixed(2);
      TCSAmount = (billAmount * TCSRate) / 100;
      TDSAmount = (subTotal * TDSRate) / 100;

      setFormData((prevFormData) => ({
        ...prevFormData,
        CGSTRate: "0.00",
        SGSTRate: "0.00",
        IGSTRate: igstRate.toFixed(2),
        CGSTAmount: "0.00",
        SGSTAmount: "0.00",
        IGSTAmount: igstAmount,
        Bill_Amount: billAmount,
        TCS_Net_Payable: netPayable,
        TCS_Rate: TCSRate,
        TCS_Amt: TCSAmount,
        TDS_Rate: TDSRate,
        TDS_Amt: TDSAmount,
      }));
    }
  };

  const handleGstCode = async (code, Rate, name, gstId) => {
    setGstCode(code);
    setGstRate(Rate);

    setFormData((prevFormData) => ({
      ...prevFormData,
      GstRateCode: code,
      gstid: gstId,
    }));

    if (from != "" || FromCode != "") {
      const match_status = await fetchMatchStatus({
        Company_Code: companyCode,
        Year_Code: Year_Code,
        Ac_Code: cancelButtonClicked ? FromCode : from,
      });

      const gstRateDivide = parseFloat(Rate);

      await calculateAndUpdateFormData(subTotal, gstRateDivide, match_status);
    }
  };


  const AmountCalculation = async (name, input, formData) => {
    let Ac_Code = input;
    const updateApiUrl = `${API_URL}/getAmountcalculationDataForInword?CompanyCode=${companyCode}&Ac_Code=${Ac_Code}&Year_Code=${Year_Code}`;

    const response = await axios.get(updateApiUrl);
    const details = response.data;

    tdsCalcInfoRef.current = {
      balancelimit: parseFloat(details['Balancelimt']) || 0,
      purchaseTdsRate: parseFloat(details['PurchaseTDSRate']) || 0,
      tcsRate: TCSApplicable === 'Y' ? (parseFloat(details['TCSRate']) || 0) : 0,
      priorAmt: parseFloat(details['PSAmt']) || 0,
    };

    const currentSubTotal = parseFloat(formData.subTotal) || 0;
    const { TDS_Rate, TCS_Rate } = computePurchaseTdsTcsRates(currentSubTotal);

    const updatedFormData = {
      ...formData,
      [name]: input,
      TDS_Rate,
      TCS_Rate,
      TDS_Amt: ((currentSubTotal * TDS_Rate) / 100).toFixed(2),
      TCS_Amt: (((parseFloat(formData.Bill_Amount) || 0) * TCS_Rate) / 100).toFixed(2),
    };

    setFormData((prevFormData) => ({
      ...prevFormData,
      ...updatedFormData

    }));
    return updatedFormData;
  }

  const handleFrom = async (code, accoid, Name, Mobile_No, Gst_No, TDSApplicable, GSTStateCode, cityname) => {
    setFrom(code);
    const matchStatusResult = await fetchMatchStatus({
      Company_Code: companyCode,
      Year_Code: Year_Code,
      Ac_Code: code,
    });

    let GSTRate = gstRate;

    if (!GSTRate || GSTRate === 0) {
      const cgstRate = parseFloat(formData.CGSTRate) || 0;
      const sgstRate = parseFloat(formData.SGSTRate) || 0;
      const igstRate = parseFloat(formData.IGSTRate) || 0;

      GSTRate = igstRate > 0 ? igstRate : cgstRate + sgstRate;
    }

    const gstRateDivide = parseFloat(GSTRate);

    await calculateAndUpdateFormData(
      subTotal,
      gstRateDivide,
      matchStatusResult
    );
    const name = formData?.name || "";
    const value = formData?.value || "";
    if (code !== '') {
      if (!isEditMode) {
        const TDSTCSData = await AmountCalculation(name, code, formData);
      }
    }
    setFormData((prevFormData) => ({
      ...prevFormData,
      Ac_Code: code,
      ac: accoid,
      TO_STATION: cityname
    }));
  };



  const calculateGSTAmount = (subTotal, rate) => {
    return (subTotal * (rate / 100)).toFixed(2);
  };

  const handleKeyDownOther = (e) => {
    if (e.key === "Tab") {
      calculateTotals();
    }
  };

  const validateNumericInput = (e) => {
    e.target.value = e.target.value.replace(/[^0-9.-]/g, "");
  };



  const handleKeyDownRef = async (event) => {
    if (event.key === "Tab") {
      const changeNoValue = event.target.value;
      try {
        const response = await axios.get(
          `${API_URL}/getsugarpurchasebyid?Company_Code=${companyCode}&doc_no=${changeNoValue}&Year_Code=${Year_Code}`
        );
        const data = response.data;

        FromName = data.getData_SugarPurchaseHead_data.Ac_Code
          ? data.getData_SugarPurchaseDetail_data[0].FromName
          : "";
        FromCode = data.getData_SugarPurchaseHead_data.Ac_Code;
        newAcCode = data.getData_SugarPurchaseHead_data.Ac_Code;
        Unitname = data.getData_SugarPurchaseDetail_data[0].Unit_Name;
        UnitCode = data.getData_SugarPurchaseHead_data.Unit_Code;
        MillName = data.getData_SugarPurchaseDetail_data[0].Mill_Name;
        MillCode = data.getData_SugarPurchaseHead_data.mill_code;
        BrokerName = data.getData_SugarPurchaseDetail_data[0].Broker_Name;
        BrokerCode = data.getData_SugarPurchaseHead_data.BROKER;
        GstRateName = data.getData_SugarPurchaseDetail_data[0].GST_Name;
        GstRateCode = data.getData_SugarPurchaseHead_data.GstRateCode;
        ItemName = data.getData_SugarPurchaseDetail_data[0].ItemName;
        ItemCodeNew = data.getData_SugarPurchaseDetail_data[0].item_code;
        BrandName = data.getData_SugarPurchaseDetail_data[0].Brand_Name;
        BrandCode = data.getData_SugarPurchaseDetail_data[0].Branch_Code;
        subTotal = data.getData_SugarPurchaseHead_data.subTotal;
        globalQuantalTotal = data.getData_SugarPurchaseHead_data.NETQNTL;
        CGSTRate = data.getData_SugarPurchaseHead_data.CGSTRate;
        SGSTRate = data.getData_SugarPurchaseHead_data.SGSTRate;
        IGSTRate = data.getData_SugarPurchaseHead_data.IGSTRate;
        BillAmountNew = data.getData_SugarPurchaseHead_data.Bill_Amount;


        const { purchaseid, ...headDataWithoutId } =
          data.getData_SugarPurchaseHead_data;


        setFormData({
          ...formData,
          ...headDataWithoutId,
          doc_no: formData.doc_no,
          doc_date: formData.doc_date,
          PURCNO: formData.PURCNO,
          mill_inv_date: formData.mill_inv_date,
          EWay_Bill_No: formData.EWay_Bill_No,
          Bill_No: formData.Bill_No,
        });

        setLastTenderData(data.getData_SugarPurchaseHead_data || {});

        const copiedUsers = data.getData_SugarPurchaseDetail_data.map(
          (detail, index) => ({
            id: index + 1,
            item_code: detail.item_code,
            item_Name: detail.ItemName,
            rowaction: "add",
            Brand_Code: detail.Branch_Code,
            brand_name: detail.Brand_Name,
            ic: detail.ic,
            purchasedetailid: null,
            narration: detail.narration,
            Quantal: detail.Quantal,
            bags: detail.bags,
            packing: detail.packing,
            rate: detail.rate,
            item_Amount: detail.item_Amount,
          })
        );

        setUsers(copiedUsers);
        setIsEditing(true);

      } catch (error) {
        console.error("Error fetching reference purchase record:", error);
      }
    }
  };



  return (
    <>
      <UserAuditInfo
        createdBy={formData.Created_By}
        modifiedBy={formData.Modified_By}
        title={"Sugar Purchase Bill"}
      />
      <ToastContainer autoClose={500} />
      <div className="main-container" style={{ marginTop: "30px" }}>
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
          component={<SugarPurchaseReport doc_no={formData.doc_no} Company_Code={companyCode} Year_Code={Year_Code} disabledFeild={!addOneButtonEnabled} />}
        />
        <div>
          <NavigationButtons
            handleFirstButtonClick={handleFirstButtonClick}
            handlePreviousButtonClick={handlePreviousButtonClick}
            handleNextButtonClick={handleNextButtonClick}
            handleLastButtonClick={handleLastButtonClick}
            highlightedButton={highlightedButton}
            isEditing={isEditing}
          />
        </div>

        <form onSubmit={handleSubmit}>
          <div>
            <Grid container spacing={1} mt={0.5}>
              <Grid item xs={1}>
                <FormControl>
                  <TextField
                    label="Change No"
                    name="changeNo"
                    variant="outlined"
                    autoComplete="off"
                    onKeyDown={handleKeyDown}
                    disabled={!addOneButtonEnabled}
                    size="small"
                  />
                </FormControl>
              </Grid>

              <Grid item xs={1}>
                <FormControl>
                  <TextField
                    label="Doc No"
                    name="doc_no"
                    variant="outlined"
                    autoComplete="off"
                    value={formData.doc_no}
                    onChange={handleChange}
                    disabled
                    size="small"
                  />
                </FormControl>
              </Grid>

              <Grid item xs={1}>
                <FormControl>
                  <TextField
                    label="DO NO."
                    name="PURCNO"
                    variant="outlined"
                    autoComplete="off"
                    value={formData.PURCNO}
                    onChange={handleChange}
                    disabled
                    size="small"
                  />
                </FormControl>
              </Grid>

              <Grid item xs={1}>
                <TextField
                  label="Date"
                  type="date"
                  inputRef={inputRef}
                  variant="outlined"
                  name="doc_date"
                  value={formData.doc_date}
                  onChange={handleChange}
                  disabled={!isEditing && addOneButtonEnabled}
                  InputLabelProps={{
                    style: { fontSize: '14px' },
                  }}
                  InputProps={{
                    style: { fontSize: '14px', height: '40px' },
                  }}
                  fullWidth
                  size="small"
                />
              </Grid>

              <Grid item xs={1}>
                <FormControl variant="outlined" fullWidth size="small">
                  <InputLabel id="retail-stock-label">Retail Stock</InputLabel>
                  <Select
                    labelId="retail-stock-label"
                    id="Retail_Stock"
                    name="Retail_Stock"
                    value={formData.Retail_Stock}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    label="Retail Stock"
                  >
                    <MenuItem value="Y">Yes</MenuItem>
                    <MenuItem value="N">No</MenuItem>
                  </Select>
                </FormControl>
              </Grid>



              <Grid item xs={1}>
                <FormControl fullWidth >
                  <TextField
                    type="text"
                    id="getreference"
                    label="Reference Doc No"
                    name="getreference"
                    autoComplete="off"
                    onKeyDown={handleKeyDownRef}
                    variant="outlined"
                    size="small"
                    // disabled={!isEditing || isEditMode}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </FormControl>
              </Grid>






            </Grid>

            <div className="SugarPurchaseBill-row" style={{ marginTop: "10px" }}>
              <label htmlFor="Bill_From" className="SugarPurchaseBilllabel" >
                From A/c :
              </label>
              <div >
                <div >
                  <AccountMasterHelp
                    onAcCodeClick={handleFrom}
                    CategoryName={FromName}
                    CategoryCode={FromCode}
                    name="From"
                    Ac_type=""
                    disabledFeild={!isEditing && addOneButtonEnabled}
                  />
                </div>
              </div>
            </div>

            <div className="SugarPurchaseBill-row">
              <label htmlFor="Bill_From" className="SugarPurchaseBilllabel" >
                Unit Code :
              </label>
              <div >
                <div >
                  <AccountMasterHelp
                    onAcCodeClick={handleUnit}
                    CategoryName={Unitname}
                    CategoryCode={UnitCode}
                    name="Unit"
                    Ac_type=""
                    disabledFeild={!isEditing && addOneButtonEnabled}
                  />
                </div>
              </div>
            </div>

            <div className="SugarPurchaseBill-row">
              <label htmlFor="Bill_From" className="SugarPurchaseBilllabel" >
                Mill Name :
              </label>
              <div >
                <div >
                  <AccountMasterHelp
                    onAcCodeClick={handleMill}
                    CategoryName={MillName}
                    CategoryCode={MillCode}
                    name="Mill"
                    Ac_type=""
                    disabledFeild={!isEditing && addOneButtonEnabled}
                  />
                </div>
              </div>
            </div>

            <div className="SugarPurchaseBill-row">
              <Grid container spacing={2}>
                <Grid item xs={1}>
                  <TextField
                    label="From"
                    variant="outlined"
                    name="FROM_STATION"
                    autoComplete="off"
                    value={formData.FROM_STATION}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    fullWidth
                    size="small"
                  />
                </Grid>

                <Grid item xs={1}>
                  <TextField
                    label="To"
                    variant="outlined"
                    name="TO_STATION"
                    autoComplete="off"
                    value={formData.TO_STATION}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    fullWidth
                    size="small"
                  />
                </Grid>

                <Grid item xs={1}>
                  <TextField
                    label="Grade"
                    variant="outlined"
                    name="grade"
                    autoComplete="off"
                    value={formData.grade}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    fullWidth
                    size="small"
                  />
                </Grid>

                <Grid item xs={1.5}>
                  <TextField
                    label="Lorry No"
                    variant="outlined"
                    name="LORRYNO"
                    autoComplete="off"
                    value={formData.LORRYNO}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    fullWidth
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: 'black',
                        backgroundColor: 'white',
                        opacity: 1,
                        '& .Mui-disabled': {
                          color: 'black',
                          WebkitTextFillColor: 'black',
                          opacity: 1,
                        },
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={1.5}>
                  <TextField
                    label="wearhouse"
                    variant="outlined"
                    name="wearhouse"
                    autoComplete="off"
                    value={formData.wearhouse}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    fullWidth
                    size="small"
                  />
                </Grid>

                <Grid item xs={1}>
                  <TextField
                    label="Bill No"
                    variant="outlined"
                    name="Bill_No"
                    autoComplete="off"
                    value={formData.Bill_No}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    fullWidth
                    size="small"
                  />
                </Grid>
              </Grid>
            </div>

            <div className="SugarPurchaseBill-row">
              <label htmlFor="Bill_From" style={{ fontWeight: "bold", marginLeft: "10px" }} >
                Broker :
              </label>
              <div >
                <div >
                  <AccountMasterHelp
                    onAcCodeClick={handleBroker}
                    CategoryName={BrokerName}
                    CategoryCode={BrokerCode}
                    name="broker"
                    Ac_type=""
                    disabledFeild={!isEditing && addOneButtonEnabled}
                  />
                </div>
              </div>

              <label htmlFor="Bill_From" style={{ fontWeight: "bold", marginLeft: "10px" }}>
                GST Code :
              </label>
              <div >
                <div >
                  <GSTRateMasterHelp
                    onAcCodeClick={handleGstCode}
                    GstRateName={GstRateName}
                    GstRateCode={GstRateCode || formData.GstRateCode}
                    name="gst_code"
                    disabledFeild={!isEditing && addOneButtonEnabled}
                  />
                </div>
              </div>

              <Grid item xs={1} ml={1}>
                <TextField
                  label="Mill Invoice Date"
                  type="date"
                  variant="outlined"
                  name="mill_inv_date"
                  value={formData.mill_inv_date}
                  onChange={handleChange}
                  disabled={!isEditing && addOneButtonEnabled}
                  InputLabelProps={{
                    style: { fontSize: '14px' },
                  }}
                  InputProps={{
                    style: { fontSize: '14px', height: '40px' },
                  }}
                  size="small"
                />
              </Grid>

              {/* <Grid item xs={1} ml={1}>
                <FormControl variant="outlined" fullWidth size="small">
                  <InputLabel id="retail-stock-label">Select Unit</InputLabel>
                  <Select
                    labelId="retail-stock-label"
                    id="Unit"
                    name="Unit"
                    value={formData.Unit}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    label="Retail Stock"
                  >
                    <MenuItem value="QTL">QUINTAL</MenuItem>
                    <MenuItem value="LTR">LITRE</MenuItem>
                    <MenuItem value="MTS">METRIC TON</MenuItem>
                  </Select>
                </FormControl>
              </Grid> */}
            </div>
          </div>

          {isLoading && (
            <div className="loading-overlay">
              <div className="spinner-container">
                <SaveUpdateSpinner />
              </div>
            </div>
          )}

          {/*detail part popup functionality and Validation part Grid view */}
          <div style={{ marginTop: "30px" }}>
            <AddButton openPopup={openPopup} isEditing={isEditing} ref={addButtonRef} setFocusToFirstField={setFocusToFirstField} />
          </div>
          <div className="mt-4">
            <SugarPurchaseDetail
              show={showPopup}
              onClose={() => setShowPopup(false)}
              selectedUser={selectedUser}
              formDataDetail={formDataDetail}
              handleChangeDetail={handleChangeDetail}
              handleItemSelect={handleItemSelect}
              handleBrandCode={handleBrandCode}
              itemNameLabel={itemNameLabel}
              itemSelect={itemSelect}
              brandName={brandName}
              brandCode={brandCode}
              addUser={addUser}
              updateUser={updateUser}
              isEditing={true}
              addOneButtonEnabled={false}
              firstInputRef={firstInputRef}
            />

            <TableContainer component={Paper} sx={{ width: "70%" }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={headerCellStyle}>Actions</TableCell>
                    {/* <TableCell sx={headerCellStyle}>Row Action</TableCell> */}
                    <TableCell sx={headerCellStyle}>ID</TableCell>
                    <TableCell sx={headerCellStyle}>Item Code</TableCell>
                    <TableCell sx={headerCellStyle}>Item Name</TableCell>
                    <TableCell sx={headerCellStyle}>Brand Code</TableCell>
                    <TableCell sx={headerCellStyle}>Brand Name</TableCell>
                    <TableCell sx={headerCellStyle}>Quintal</TableCell>
                    <TableCell sx={headerCellStyle}>Packing</TableCell>
                    <TableCell sx={headerCellStyle}>Rate</TableCell>
                    <TableCell sx={headerCellStyle}>Bags</TableCell>
                    <TableCell sx={headerCellStyle}>Item Amount</TableCell>
                    <TableCell sx={headerCellStyle}>Narration</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell sx={{ padding: '4px 8px' }}>
                        {(user.rowaction === "add" ||
                          user.rowaction === "update" ||
                          user.rowaction === "Normal") && (
                            <>
                              <EditButton
                                editUser={editUser}
                                user={user}
                                isEditing={isEditing}
                              />
                              <DeleteButton
                                deleteModeHandler={deleteModeHandler}
                                user={user}
                                isEditing={isEditing}
                              />
                            </>
                          )}
                        {(user.rowaction === "DNU" ||
                          user.rowaction === "delete") && (
                            <OpenButton openDelete={openDelete} user={user} />
                          )}
                      </TableCell>
                      {/* <TableCell>{user.rowaction}</TableCell> */}
                      <TableCell sx={{ padding: '4px 8px', textAlign: "center" }}>{user.id}</TableCell>
                      <TableCell sx={{ padding: '4px 8px', textAlign: "center" }}>{user.item_code}</TableCell>
                      <TableCell sx={{ padding: '4px 8px', textAlign: "center" }}>{user.itemNameLabel}</TableCell>
                      <TableCell sx={{ padding: '4px 8px', textAlign: "center" }}>{user.Brand_Code}</TableCell>
                      <TableCell sx={{ padding: '4px 8px', textAlign: "center" }}>{user.brandName}</TableCell>
                      <TableCell sx={{ padding: '4px 8px', textAlign: "center" }}>{user.Quantal}</TableCell>
                      <TableCell sx={{ padding: '4px 8px', textAlign: "center" }}>{user.packing}</TableCell>
                      <TableCell sx={{ padding: '4px 8px', textAlign: "center" }}>{formatReadableAmount(user.rate)}</TableCell>
                      <TableCell sx={{ padding: '4px 8px', textAlign: "center" }}>{user.bags}</TableCell>
                      <TableCell sx={{ padding: '4px 8px', textAlign: "center" }}>{formatReadableAmount(user.item_Amount)}</TableCell>
                      <TableCell sx={{ padding: '4px 8px', textAlign: "center" }}>{user.narration}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
          <div className="SugarPurchaseBill-row">
            <Grid container spacing={2}>
              <Grid item xs={1}>
                <TextField
                  label="Net Quental"
                  variant="outlined"
                  name="NETQNTL"
                  autoComplete="off"
                  value={globalQuantalTotal}
                  onChange={handleChange}
                  disabled={!isEditing && addOneButtonEnabled}
                  fullWidth
                  InputLabelProps={{
                    shrink: true,
                  }}
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      fontSize: '16px',
                      fontWeight: 'bold',
                      color: 'black',
                      backgroundColor: 'white',
                      opacity: 1,
                      '& .Mui-disabled': {
                        color: 'black',
                        WebkitTextFillColor: 'black',
                        opacity: 1,
                      },
                    },
                  }}
                />
              </Grid>

              <Grid item xs={2}>
                <TextField
                  label="EWay Bill"
                  variant="outlined"
                  name="EWay_Bill_No"
                  autoComplete="off"
                  value={formData.EWay_Bill_No}
                  onChange={handleChange}
                  disabled={!isEditing && addOneButtonEnabled}
                  fullWidth
                  InputLabelProps={{
                    shrink: true,
                  }}
                  size="small"
                />
              </Grid>

              <Grid item xs={1}>
                <TextField
                  label="Due Days"
                  variant="outlined"
                  name="Due_Days"
                  autoComplete="off"
                  value={formData.Due_Days}
                  onChange={handleChange}
                  disabled={!isEditing && addOneButtonEnabled}
                  fullWidth
                  InputLabelProps={{
                    shrink: true,
                  }}
                  size="small"
                />
              </Grid>
            </Grid>
          </div>

          <div >
            <Grid
              container
              spacing={1}
              justifyContent="flex-end"
              alignItems="center"
              mt={-25}
              mb={20}
              sx={{ textAlign: 'left' }}
            >
              <Grid item xs={1}>
                <label className="SugarPurchaseBilllabel">SubTotal :</label>
              </Grid>
              <Grid item xs={12} sm={2}>
                <TextField
                  variant="outlined"
                  name="subTotal"
                  autoComplete="off"
                  value={subTotal || formData.subTotal}
                  disabled
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  error={!!formErrors.subTotal}
                  helperText={formErrors.subTotal}
                  size="small"
                  inputProps={{
                    sx: { textAlign: "right" },
                    inputMode: "decimal",
                    pattern: "[0-9]*[.,]?[0-9]+",
                    onInput: validateNumericInput,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      fontSize: '16px',
                      fontWeight: 'bold',
                      color: 'black',
                      backgroundColor: 'white',
                      opacity: 1,
                      '& .Mui-disabled': {
                        color: 'black',
                        WebkitTextFillColor: 'black',
                        opacity: 1,
                      },
                    },
                  }}
                />
              </Grid>

              <Grid
                container
                spacing={1}
                justifyContent="flex-end"
                alignItems="center"
                style={{ marginTop: "-6px" }}
              >
                <Grid item xs={1}>
                  <label className="SugarPurchaseBilllabel">CGST :</label>
                </Grid>
                <Grid item xs={12} sm={1}>
                  <TextField
                    variant="outlined"
                    name="CGSTRate"
                    autoComplete="off"
                    value={formData.CGSTRate}
                    onChange={handleChange}
                    disabled
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    error={!!formErrors.CGSTRate}
                    helperText={formErrors.CGSTRate}
                    size="small"
                    inputProps={{
                      sx: { textAlign: "right" },
                      inputMode: "decimal",
                      pattern: "[0-9]*[.,]?[0-9]+",
                      onInput: validateNumericInput,
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: 'black',
                        backgroundColor: 'white',
                        opacity: 1,
                        '& .Mui-disabled': {
                          color: 'black',
                          WebkitTextFillColor: 'black',
                          opacity: 1,
                        },
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={1}>
                  <TextField
                    variant="outlined"
                    name="CGSTAmount"
                    autoComplete="off"
                    value={formData.CGSTAmount}
                    onChange={handleChange}
                    disabled
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    error={!!formErrors.CGSTAmount}
                    helperText={formErrors.CGSTAmount}
                    size="small"
                    inputProps={{
                      sx: { textAlign: "right" },
                      inputMode: "decimal",
                      pattern: "[0-9]*[.,]?[0-9]+",
                      onInput: validateNumericInput,
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: 'black',
                        backgroundColor: 'white',
                        opacity: 1,
                        '& .Mui-disabled': {
                          color: 'black',
                          WebkitTextFillColor: 'black',
                          opacity: 1,
                        },
                      },
                    }}
                  />
                </Grid>
              </Grid>

              <Grid
                container
                spacing={1}
                justifyContent="flex-end"
                alignItems="center"
                style={{ marginTop: "-6px" }}
              >
                <Grid item xs={1}>
                  <label className="SugarPurchaseBilllabel">SGST :</label>
                </Grid>
                <Grid item xs={12} sm={1}>
                  <TextField
                    variant="outlined"
                    name="SGSTRate"
                    autoComplete="off"
                    value={formData.SGSTRate}
                    onChange={handleChange}
                    disabled
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    error={!!formErrors.SGSTRate}
                    helperText={formErrors.SGSTRate}
                    size="small"
                    inputProps={{
                      sx: { textAlign: "right" },
                      inputMode: "decimal",
                      pattern: "[0-9]*[.,]?[0-9]+",
                      onInput: validateNumericInput,
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: 'black',
                        backgroundColor: 'white',
                        opacity: 1,
                        '& .Mui-disabled': {
                          color: 'black',
                          WebkitTextFillColor: 'black',
                          opacity: 1,
                        },
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={1}>
                  <TextField
                    variant="outlined"
                    name="SGSTAmount"
                    autoComplete="off"
                    value={formData.SGSTAmount}
                    onChange={handleChange}
                    disabled
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    error={!!formErrors.SGSTAmount}
                    helperText={formErrors.SGSTAmount}
                    size="small"
                    inputProps={{
                      sx: { textAlign: "right" },
                      inputMode: "decimal",
                      pattern: "[0-9]*[.,]?[0-9]+",
                      onInput: validateNumericInput,
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: 'black',
                        backgroundColor: 'white',
                        opacity: 1,
                        '& .Mui-disabled': {
                          color: 'black',
                          WebkitTextFillColor: 'black',
                          opacity: 1,
                        },
                      },
                    }}
                  />
                </Grid>
              </Grid>

              <Grid
                container
                spacing={1}
                justifyContent="flex-end"
                alignItems="center"
                style={{ marginTop: "-6px" }}
              >
                <Grid item xs={1}>
                  <label className="SugarPurchaseBilllabel">IGST :</label>
                </Grid>
                <Grid item xs={12} sm={1}>
                  <TextField
                    variant="outlined"
                    name="IGSTRate"
                    autoComplete="off"
                    value={formData.IGSTRate}
                    onChange={handleChange}
                    disabled
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    error={!!formErrors.IGSTRate}
                    helperText={formErrors.IGSTRate}
                    size="small"
                    inputProps={{
                      sx: { textAlign: "right" },
                      inputMode: "decimal",
                      pattern: "[0-9]*[.,]?[0-9]+",
                      onInput: validateNumericInput,
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: 'black',
                        backgroundColor: 'white',
                        opacity: 1,
                        '& .Mui-disabled': {
                          color: 'black',
                          WebkitTextFillColor: 'black',
                          opacity: 1,
                        },
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={1}>
                  <TextField
                    variant="outlined"
                    name="IGSTAmount"
                    autoComplete="off"
                    value={formData.IGSTAmount}
                    onChange={handleChange}
                    disabled
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    error={!!formErrors.IGSTAmount}
                    helperText={formErrors.IGSTAmount}
                    size="small"
                    inputProps={{
                      sx: { textAlign: "right" },
                      inputMode: "decimal",
                      pattern: "[0-9]*[.,]?[0-9]+",
                      onInput: validateNumericInput,
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: 'black',
                        backgroundColor: 'white',
                        opacity: 1,
                        '& .Mui-disabled': {
                          color: 'black',
                          WebkitTextFillColor: 'black',
                          opacity: 1,
                        },
                      },
                    }}
                  />
                </Grid>
              </Grid>

              <Grid
                container
                spacing={1}
                justifyContent="flex-end"
                alignItems="center"
                style={{ marginTop: "-6px" }}
              >
                <Grid item xs={1}>
                  <label className="SugarPurchaseBilllabel">Freight :</label>
                </Grid>
                <Grid item xs={12} sm={1}>
                  <TextField
                    variant="outlined"
                    name="LESS_FRT_RATE"
                    autoComplete="off"
                    value={formData.LESS_FRT_RATE}
                    onChange={handleChange}
                    onKeyDown={handleKeyDownOther}
                    disabled={!isEditing && addOneButtonEnabled}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    error={!!formErrors.LESS_FRT_RATE}
                    helperText={formErrors.LESS_FRT_RATE}
                    size="small"
                    inputProps={{
                      sx: { textAlign: "right" },
                      inputMode: "decimal",
                      pattern: "[0-9]*[.,]?[0-9]+",
                      onInput: validateNumericInput,
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: 'black',
                        backgroundColor: 'white',
                        opacity: 1,
                        '& .Mui-disabled': {
                          color: 'black',
                          WebkitTextFillColor: 'black',
                          opacity: 1,
                        },
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={1}>
                  <TextField
                    variant="outlined"
                    name="freight"
                    autoComplete="off"
                    value={formData.freight}
                    onKeyDown={handleKeyDownOther}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    error={!!formErrors.freight}
                    helperText={formErrors.freight}
                    size="small"
                    inputProps={{
                      sx: { textAlign: "right" },
                      inputMode: "decimal",
                      pattern: "[0-9]*[.,]?[0-9]+",
                      onInput: validateNumericInput,
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: 'black',
                        backgroundColor: 'white',
                        opacity: 1,
                        '& .Mui-disabled': {
                          color: 'black',
                          WebkitTextFillColor: 'black',
                          opacity: 1,
                        },
                      },
                    }}
                  />
                </Grid>
              </Grid>

              <Grid
                container
                spacing={1}
                justifyContent="flex-end"
                alignItems="center"
                style={{ marginTop: "-6px" }}
              >
                <Grid item xs={1}>
                  <label className="SugarPurchaseBilllabel">
                    Bank Commi.:
                  </label>
                </Grid>
                <Grid item xs={12} sm={2}>
                  <TextField
                    variant="outlined"
                    fullWidth
                    name="bank_commission"
                    autoComplete="off"
                    value={formData.bank_commission}
                    onChange={handleChange}
                    onKeyDown={handleKeyDownOther}
                    disabled={!isEditing && addOneButtonEnabled}
                    error={Boolean(formErrors.bank_commission)}
                    helperText={formErrors.bank_commission || ""}
                    size="small"
                    inputProps={{
                      sx: { textAlign: "right" },
                      inputMode: "decimal",
                      pattern: "[0-9]*[.,]?[0-9]+",
                      onInput: validateNumericInput,
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: 'black',
                        backgroundColor: 'white',
                        opacity: 1,
                        '& .Mui-disabled': {
                          color: 'black',
                          WebkitTextFillColor: 'black',
                          opacity: 1,
                        },
                      },
                    }}
                  />
                </Grid>
              </Grid>

              <Grid
                container
                spacing={1}
                justifyContent="flex-end"
                alignItems="center"
                style={{ marginTop: "-6px" }}
              >
                <Grid item xs={1}>
                  <label className="SugarPurchaseBilllabel">
                    Other +/- :
                  </label>
                </Grid>
                <Grid item xs={12} sm={2}>
                  <TextField
                    variant="outlined"
                    fullWidth
                    name="OTHER_AMT"
                    autoComplete="off"
                    value={formData.OTHER_AMT}
                    onKeyDown={handleKeyDownOther}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    error={Boolean(formErrors.OTHER_AMT)}
                    helperText={formErrors.OTHER_AMT || ""}
                    size="small"
                    inputProps={{
                      sx: { textAlign: "right" },
                      inputMode: "decimal",
                      pattern: "[0-9]*[.,]?[0-9]+",
                      onInput: validateNumericInput,
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: 'black',
                        backgroundColor: 'white',
                        opacity: 1,
                        '& .Mui-disabled': {
                          color: 'black',
                          WebkitTextFillColor: 'black',
                          opacity: 1,
                        },
                      },
                    }}
                  />
                </Grid>
              </Grid>

              <Grid
                container
                spacing={1}
                justifyContent="flex-end"
                alignItems="center"
                style={{ marginTop: "-6px" }}
              >
                <Grid item xs={1}>
                  <label className="SugarPurchaseBilllabel">
                    Cash Advance :
                  </label>
                </Grid>
                <Grid item xs={12} sm={2}>
                  <TextField
                    variant="outlined"
                    fullWidth
                    name="cash_advance"
                    autoComplete="off"
                    value={formData.cash_advance}
                    onKeyDown={handleKeyDownOther}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    error={Boolean(formErrors.cash_advance)}
                    helperText={formErrors.cash_advance || ""}
                    size="small"
                    inputProps={{
                      sx: { textAlign: "right" },
                      inputMode: "decimal",
                      pattern: "[0-9]*[.,]?[0-9]+",
                      onInput: validateNumericInput,
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: 'black',
                        backgroundColor: 'white',
                        opacity: 1,
                        '& .Mui-disabled': {
                          color: 'black',
                          WebkitTextFillColor: 'black',
                          opacity: 1,
                        },
                      },
                    }}
                  />
                </Grid>
              </Grid>

              <Grid
                container
                spacing={1}
                justifyContent="flex-end"
                alignItems="center"
                style={{ marginTop: "-6px" }}
              >
                <Grid item xs={1}>
                  <label className="SugarPurchaseBilllabel">
                    Bill Amount :
                  </label>
                </Grid>
                <Grid item xs={12} sm={2}>
                  <TextField
                    variant="outlined"
                    fullWidth
                    name="Bill_Amount"
                    value={formData.Bill_Amount || 0}
                    onChange={handleChange}
                    disabled
                    error={Boolean(formErrors.Bill_Amount)}
                    helperText={formErrors.Bill_Amount || ""}
                    size="small"
                    inputProps={{
                      sx: { textAlign: "right" },
                      inputMode: "decimal",
                      pattern: "[0-9]*[.,]?[0-9]+",
                      onInput: validateNumericInput,
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: 'black',
                        backgroundColor: 'white',
                        opacity: 1,
                        '& .Mui-disabled': {
                          color: 'black',
                          WebkitTextFillColor: 'black',
                          opacity: 1,
                        },
                      },
                    }}
                  />
                </Grid>
              </Grid>

              <Grid
                container
                spacing={1}
                justifyContent="flex-end"
                alignItems="center"
                style={{ marginTop: "-6px" }}
              >
                <Grid item xs={1}>
                  <label className="SugarPurchaseBilllabel">TCS :</label>
                </Grid>
                <Grid item xs={12} sm={1}>
                  <TextField
                    variant="outlined"
                    fullWidth
                    name="TCS_Rate"
                    autoComplete="off"
                    value={formData.TCS_Rate}
                    onKeyDown={handleKeyDownOther}
                    onChange={handleChange}
                    disabled={TCSApplicable !== 'Y' || (!isEditing && addOneButtonEnabled)}
                    error={Boolean(formErrors.TCS_Rate)}
                    helperText={formErrors.TCS_Rate || ""}
                    size="small"
                    inputProps={{
                      sx: { textAlign: "right" },
                      inputMode: "decimal",
                      pattern: "[0-9]*[.,]?[0-9]+",
                      onInput: validateNumericInput,
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: 'black',
                        backgroundColor: 'white',
                        opacity: 1,
                        '& .Mui-disabled': {
                          color: 'black',
                          WebkitTextFillColor: 'black',
                          opacity: 1,
                        },
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={1}>
                  <TextField
                    variant="outlined"
                    fullWidth
                    name="TCS_Amt"
                    autoComplete="off"
                    value={formData.TCS_Amt || 0}
                    onKeyDown={handleKeyDownOther}
                    onChange={handleChange}
                    disabled={TCSApplicable !== 'Y' || (!isEditing && addOneButtonEnabled)}
                    error={Boolean(formErrors.TCS_Amt)}
                    helperText={formErrors.TCS_Amt || ""}
                    size="small"
                    inputProps={{
                      sx: { textAlign: "right" },
                      inputMode: "decimal",
                      pattern: "[0-9]*[.,]?[0-9]+",
                      onInput: validateNumericInput,
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: 'black',
                        backgroundColor: 'white',
                        opacity: 1,
                        '& .Mui-disabled': {
                          color: 'black',
                          WebkitTextFillColor: 'black',
                          opacity: 1,
                        },
                      },
                    }}
                  />
                </Grid>
              </Grid>

              <Grid
                container
                spacing={1}
                justifyContent="flex-end"
                alignItems="center"
                style={{ marginTop: "-6px" }}
              >
                <Grid item xs={1}>
                  <label className="SugarPurchaseBilllabel">TDS :</label>
                </Grid>
                <Grid item xs={12} sm={1}>
                  <TextField
                    variant="outlined"
                    fullWidth
                    name="TDS_Rate"
                    autoComplete="off"
                    value={formData.TDS_Rate}
                    onChange={handleChange}
                    onKeyDown={handleKeyDownOther}
                    disabled={!isEditing && addOneButtonEnabled}
                    error={Boolean(formErrors.TDS_Rate)}
                    helperText={formErrors.TDS_Rate || ""}
                    size="small"
                    inputProps={{
                      sx: { textAlign: "right" },
                      inputMode: "decimal",
                      pattern: "[0-9]*[.,]?[0-9]+",
                      onInput: validateNumericInput,
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: 'black',
                        backgroundColor: 'white',
                        opacity: 1,
                        '& .Mui-disabled': {
                          color: 'black',
                          WebkitTextFillColor: 'black',
                          opacity: 1,
                        },
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={1}>
                  <TextField
                    variant="outlined"
                    fullWidth
                    name="TDS_Amt"
                    autoComplete="off"
                    value={formData.TDS_Amt !== null ? formData.TDS_Amt : ""}
                    onChange={handleChange}
                    onKeyDown={handleKeyDownOther}
                    disabled={!isEditing && addOneButtonEnabled}
                    error={Boolean(formErrors.TDS_Amt)}
                    helperText={formErrors.TDS_Amt || ""}
                    size="small"
                    inputProps={{
                      sx: { textAlign: "right" },
                      inputMode: "decimal",
                      pattern: "[0-9]*[.,]?[0-9]+",
                      onInput: validateNumericInput,
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: 'black',
                        backgroundColor: 'white',
                        opacity: 1,
                        '& .Mui-disabled': {
                          color: 'black',
                          WebkitTextFillColor: 'black',
                          opacity: 1,
                        },
                      },
                    }}
                  />
                </Grid>
              </Grid>

              <Grid
                container
                spacing={1}
                justifyContent="flex-end"
                alignItems="center"
                style={{ marginTop: "-6px" }}
              >
                <Grid item xs={1}>
                  <label className="SugarPurchaseBilllabel">
                    Net Payable :
                  </label>
                </Grid>
                <Grid item xs={12} sm={2}>
                  <TextField
                    variant="outlined"
                    fullWidth
                    name="TCS_Net_Payable"
                    value={formData.TCS_Net_Payable || 0}
                    onChange={handleChange}
                    disabled
                    error={Boolean(formErrors.TCS_Net_Payable)}
                    helperText={formErrors.TCS_Net_Payable || ""}
                    size="small"
                    inputProps={{
                      sx: { textAlign: "right" },
                      inputMode: "decimal",
                      pattern: "[0-9]*[.,]?[0-9]+",
                      onInput: validateNumericInput,
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: 'black',
                        backgroundColor: 'white',
                        opacity: 1,
                        '& .Mui-disabled': {
                          color: 'black',
                          WebkitTextFillColor: 'black',
                          opacity: 1,
                        },
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </Grid>
          </div>
        </form>
      </div>
    </>
  );
};
export default SugarPurchase;
