import React, { useState, useRef, useEffect } from "react";
import AccountMasterHelp from "../../../Helper/AccountMasterHelp";
import GSTRateMasterHelp from "../../../Helper/GSTRateMasterHelp";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import ActionButtonGroup from "../../../Common/CommonButtons/ActionButtonGroup";
import NavigationButtons from "../../../Common/CommonButtons/NavigationButtons";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AccountMaster from "../../Master/AccountInformation/AccountMaster/AccountMaster";
import ShetkariCretateModal from "../../Inword/ShetkariPurchase/ShetkariCreateModel";
import {
  Box,
  Button,
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
import ShetkariPurchaseDetail from "./ShetkariPurchaseDetail";
import AddButton from "../../../Common/Buttons/AddButton";
import EditButton from "../../../Common/Buttons/EditButton";
import DeleteButton from "../../../Common/Buttons/DeleteButton";
import OpenButton from "../../../Common/Buttons/OpenButton";
import UserAuditInfo from "../../../Common/UserAuditInfo/UserAuditInfo";
import "./ShetkariPurchase.css"
import SaveUpdateSpinner from "../../../Common/Spinners/SaveUpdateSpinner";
import Swal from "sweetalert2";
import { InWordPostDateRecordLock } from "../../../Common/PostDateLock/PostDateRangeCheck"
import { validateDocumentDate } from "../../../Common/ValidateDateRange/ValidateDateRange"
import formatTruckNumber from "../../../Common/FormatFunctions/FormatTruckNumber"
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";
import GSTStateMasterHelp from "../../../Helper/GSTStateMasterHelp";
import CityMasterHelp from "../../../Helper/CityMasterHelp";
import ShetkariPurchaseReport from "./ShetkariPurchaseReport";
//Global Variables
var purchaseidNew = "";
var FromName = "";
var FromCode = "";
var BrokerName = "";
var BrokerCode = "";
var GstRateCode = "";
var GST_Name = "";
var GstRateName = "";
var ItemName = "";
var ItemCodeNew = "";
var GSTrate = "";
var BrandName = "";
var BrandCode = "";
var subTotal = 0.0;
var CGSTAmount = 0.0;
var SGSTAmount = 0.0;
var IGSTAmount = 0.0;
var HamaliAmount = 0.00;
var globalQuantalTotal = 0;
var CGSTRate = 0.0;
var SGSTRate = 0.0;
var IGSTRate = 0.0;
var BillAmountNew = 0.0;
var newAcCode = 0;
var fright = 0.00;
var postage = 0.00;
var vatav = 0.00;

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

const ShetkariPurchase = () => {
  const API_URL = process.env.REACT_APP_API;
  const companyCode = sessionStorage.getItem("Company_Code");
  const Year_Code = sessionStorage.getItem("Year_Code");
  const username = sessionStorage.getItem("username");
  const Post_Date = sessionStorage.getItem("Post_Date");
  const Inword_Date = sessionStorage.getItem("Inword_Date");
  const TCSApplicable = sessionStorage.getItem("TCSApplicable");
  const User_Id = sessionStorage.getItem("User_ID");

  // ----------------------------------------- Shetakri Purchase Head Functionality -----------------------------------------

  const [users, setUsers] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMode, setPopupMode] = useState("add");
  const [selectedUser, setSelectedUser] = useState({});
  const [deleteMode, setDeleteMode] = useState(false);
  const [brandCode, setBrandCode] = useState("");
  const [brandCodeAccoid, setBrandCodeAccoid] = useState("");
  const [itemSelect, setItemSelect] = useState("");
  const [itemSelectAccoid, setItemSelectAccoid] = useState("");
  const [showCityPopup, setShowCityPopup] = useState(false);
  const [AccountMasterData, setAccountMasterData] = useState("");
  // Shetakri Purchase Detail States.
  const [formDataDetail, setFormDataDetail] = useState({
    Cash_Credit: "CS",
    detail_id: 1,
    Qty: 0.00,
    Wt_Per: 0.00,
    Wt_Qty: 0.00,
    Rate: 0.00,
    Value: 0.00,
    SGST: 0.00,
    CGST: 0.00,
    IGST: 0.00,
    Hamali_Rate: 0.00,
    Hamali: 0.00,
    FrieghtperqntlDetail: 0.00,
    Net_wt: 0.00,
    pac: 0,
    purcac: 0
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
  const AccountMasterRef = useRef(null);

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const navigatedRecord = searchParams.get('navigatedRecord');

  const selectedRecord = location.state?.selectedRecord;
  const permissions = location.state?.permissionsData;
  const tranType = location.state?.tranType;

  const navigate = useNavigate();
  const [isHandleChange, setIsHandleChange] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [itemNameLabel, setItemNameLabel] = useState("");
  const [GSTNameLabel, setGSTNameLabel] = useState("");
  const [BrandNameLabel, setBrandNameLabel] = useState("");

  const [PurchaseAc, setPurchaseAc] = useState("");
  const [SaleAc, setSaleAc] = useState("");
  const [PurchaseAcid, setPurchaseAcid] = useState("");
  const [SaleAcid, setSaleAcid] = useState("");
  const [RatePer, setRatePer] = useState("");


  const [brandName, setBrandName] = useState("");
  let [TyanTypeState, setTyanTypeState] = useState("");
  const [secondSelectOptions, setSecondSelectOptions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("BR");
  const inputRef = useRef(null);
  const acNameRef = useRef(null); // 👈 Add this

  // const AccountMasterRef = useRef();


  const addButtonRef = useRef(null);
  const firstInputRef = useRef(null);
  const setFocusToFirstField = () => {
    if (firstInputRef.current) {
      firstInputRef.current.focus();
    }
  };
  useEffect(() => {
    if (showCityPopup && acNameRef.current) {
      // Small delay to ensure modal is fully rendered
      setTimeout(() => {
        acNameRef.current.focus();
      }, 100);
    }
  }, [showCityPopup]);




  const initialFormData = {
    purchaseid: null,        // from model
    Cash_Credit: tranType ? tranType : "CS",         // from model
    Doc_No: "",              // from model
    Doc_Date: new Date().toISOString().split("T")[0], // from model
    Ac_Code: "",             // from model
    Broker: "",              // from model
    LR_No: "",               // from model
    Truck_No: "",            // from model
    Taxable_Amount: 0.0,    // from model
    CGST_Amount: 0.0,       // from model
    SGST_Amount: 0.0,       // from model
    IGST_Amount: 0.0,       // from model
    Hamali: 0.0,            // from model
    postage: 0.0,           // from model
    Amount: 0.0,            // from model
    TCS_Par: 0.0,           // from model
    TCS_Amount: 0.0,        // from model
    Company_Code: companyCode, // from model
    Year_Code: Year_Code,   // from model
    Created_By: "",         // from model
    Modified_By: "",        // from model
    Branch_Code: "",        // from model
    Bill_No: "",            // from model
    ac: 0,                 // from model
    bc: 0,                 // from model
    TDS_Rate: 0.0,          // from model
    TDS_Amt: 0.0,           // from model
    oldcode: "",            // from model
    Frieghtperqntl: 0.0,    // from model
    Vatavrate: 0.0,        // from model
    Vatavamt: 0.0
  };

  const [formData, setFormData] = useState(initialFormData);
  const [DoNo, setDoNo] = useState("");
  const [from, setFrom] = useState("");
  const [unit, setUnit] = useState("");
  const [mill, setMill] = useState("");
  const [broker, setBroker] = useState("");
  const [gstCode, setGstCode] = useState("");
  let [gstRate, setGstRate] = useState("");
  const [acName, setAcName] = useState("");
  const [acAddress, setAcAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [PANNumber, setPANNumber] = useState("");
  const [AccountNumber, setAccountNumber] = useState("");
  const [AcIFSCCode, setAcIFSCCode] = useState("");
  const [AcBankName, setAcBankName] = useState("");
  const [AcAdharNumber, setAcAdharNumber] = useState("");
  const [AcStateCode, setAcStateCode] = useState("");
  const [gstStateName, setgstStateName] = useState("");
  const [citycode, setcitycode] = useState("");
  const [cityname, setcityname] = useState("");
  const [cityid, setcityid] = useState("");

  //Using the useRecordLocking to manage the multiple user cannot edit the same record at a time.
  const { isRecordLockedByUser, lockRecord, unlockRecord } = useRecordLocking(
    formData.Doc_No,
    undefined,
    companyCode,
    Year_Code,
    "sherkari_purchase"
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
      (total, user) => total + (parseFloat(user.Value) || 0),
      0
    );
    const quantalTotal = users.reduce(
      (total, user) => total + (parseFloat(user.Qty) || 0),
      0
    );

    const cgstTotal = users.reduce(
      (total, user) => total + (parseFloat(user.CGST) || 0),
      0
    );

    const sgstTotal = users.reduce(
      (total, user) => total + (parseFloat(user.SGST) || 0),
      0
    );

    const igstTotal = users.reduce(
      (total, user) => total + (parseFloat(user.IGST) || 0),
      0
    );
    // const cgstRate = parseFloat(formData.CGSTRate) || 0;
    // const sgstRate = parseFloat(formData.SGSTRate) || 0;
    // const igstRate = parseFloat(formData.IGSTRate) || 0;
    const tcsRate = parseFloat(formData.TCS_Par) || 0;
    const tdsRate = parseFloat(formData.TDS_Rate) || 0;
    const cgstAmount = ((cgstTotal)).toFixed(2);
    const sgstAmount = ((sgstTotal)).toFixed(2);
    const igstAmount = ((igstTotal)).toFixed(2);
    const tcsAmount = (
      ((parseFloat(formData.Amount) || 0) * tcsRate) /
      100
    ).toFixed(2);
    const tdsAmount = ((subTotal * tdsRate) / 100).toFixed(2);
    const vatavamt = (((parseFloat(formData.Amount) || 0) * formData.Vatavrate) /
      100
    ).toFixed(2);

    const billAmount =
      subTotal +
      parseFloat(cgstAmount) +
      parseFloat(sgstAmount) +
      parseFloat(igstAmount)

    setFormData((prev) => ({
      ...prev,
      Taxable_Amount: subTotal.toFixed(2),
      CGST_Amount: cgstAmount,
      SGST_Amount: sgstAmount,
      IGST_Amount: igstAmount,
      Amount: billAmount.toFixed(2),
      TCS_Amount: tcsAmount,
      TDS_Amt: tdsAmount,
      TCS_Par: tcsRate,
      TDS_Rate: tdsRate,
      Vatavamt: vatavamt

    }));
  };

  const fetchLastRecord = () => {
    fetch(
      `${API_URL}/get-next-doc-no-shetkaripurchaseBill?Company_Code=${companyCode}&Year_Code=${Year_Code}&Cash_Credit=${formData.Cash_Credit || tranType}`
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
          Doc_No: data.next_doc_no,
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
    setIsRecordSelected(false);

    FromName = "";
    FromCode = "";
    BrokerName = "";
    BrokerCode = "";
    GstRateName = "";
    GstRateCode = "";
    ItemName = "";
    ItemCodeNew = "";
    BrandName = "";
    BrandCode = "";
    subTotal = 0.00;
    globalQuantalTotal = "";
    const effectiveTranType = tranType || TyanTypeState || formData.Cash_Credit;
    setFormData((prevData) => ({
      ...prevData,
      Cash_Credit: effectiveTranType
    }));
    setLastTenderDetails([]);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  //Edit button Functionality
  const handleEdit = async () => {

    axios
      .get(
        `${API_URL}/getshetkaripurchasebyid?doc_no=${formData.Doc_No}&Company_Code=${companyCode}&Year_Code=${Year_Code}&Cash_Credit=${formData.Cash_Credit}`
      )
      .then((response) => {
        const data = response.data;
        const isLockedNew = data.getData_shetkaripurchaseDetail_data.LockedRecord;
        const isLockedByUserNew =
          data.getData_shetkaripurchaseDetail_data.LockedUser;

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
          ...data.getData_shetkaripurchaseDetail_data,
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

    // if (await InWordPostDateRecordLock(formData.doc_date, Post_Date, Inword_Date)) {
    //   return;
    // }

    const accountingYearData = sessionStorage.getItem('Accounting_Year');
    const formattedEntryDate = formData.Doc_Date;
    const isValid = validateDocumentDate(formattedEntryDate, accountingYearData);

    if (!isValid) {
      return
    }

    let missingFields = [];
    if (!formData.Ac_Code) missingFields.push("Supplier A/c");


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
        Created_By: username,
        Cash_Credit: formData.Cash_Credit

      }
    }
    delete headData["0"];
    delete headData["Vatav"];
    delete headData["1"];


    const detailData = users.map((user) => ({
      rowaction: user.rowaction,
      purchasedetailid: user.purchasedetailid,
      Cash_Credit: formData.Cash_Credit,
      Item_Code: parseInt(user.Item_Code) || 0,
      ic: parseInt(user.ic) || 0,
      Brand_Code: parseInt(user.Brand_Code) || 0,

      Qty: parseInt(user.Qty) || 0,
      Wt_Per: parseFloat(user.Wt_Per) || 0.00,
      Wt_Qty: parseFloat(user.Wt_Qty) || 0.00,
      Rate: parseFloat(user.Rate) || 0.00,
      Value: parseFloat(user.Value) || 0.00,
      SGST: parseFloat(user.SGST) || 0.00,
      CGST: parseFloat(user.CGST) || 0.00,
      IGST: parseFloat(user.IGST) || 0.00,
      Hamali_Rate: parseFloat(user.Hamali_Rate) || 0.00,
      Hamali: parseFloat(user.Hamali) || 0.00,
      FrieghtperqntlDetail: parseFloat(user.FrieghtperqntlDetail) || 0.00,
      Net_wt: parseFloat(user.Net_wt) || 0.00,
      purcac: parseInt(user.purcac) || 0,
      pac: parseInt(user.pac) || 0,
      Company_Code: companyCode,
      Year_Code: Year_Code,
      Branch_Code: 1,
      detail_id: 1,
      GST_Code: parseFloat(user.GST_Code) || 0,
    }));
    const requestData = {
      headData,
      detailData,
    };
    try {
      if (isEditMode) {
        const updateApiUrl = `${API_URL}/update-shetkaripurchase?purchaseid=${purchaseidNew}`;
        const response = await axios.put(updateApiUrl, requestData);

        //await unlockRecord();
        Swal.fire({
          title: "Success!",
          text: "Record Updated Successfully!",
          icon: "success",
          confirmButtonText: "OK"
        });

      } else {
        const response = await axios.post(
          `${API_URL}/insert_shetkaripurchase`,
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
      navigate(`/shetkaripurchase?navigatedRecord=${formData.Doc_No}`);
    } catch (error) {
      console.error("Error during API call:", error);
      toast.error("Error occurred while saving data");
    } finally {
      setIsEditing(false);
      setIsLoading(false);
    }
  };


  const handleDelete = async () => {
    // if (await InWordPostDateRecordLock(formData.Doc_Date, Post_Date, Inword_Date)) {
    //   return;
    // }


    try {

      const result = await Swal.fire({
        title: "Are you sure?",
        text: `Do you really want to delete Doc No: ${formData.Doc_No}?`,
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

        const deleteApiUrl = `${API_URL}/delete_data_shetkaripurchase?purchaseid=${formData.purchaseid}&Company_Code=${companyCode}&doc_no=${formData.Doc_No}&Year_Code=${Year_Code}&Cash_Credit=${formData.Cash_Credit}&User_Id=${User_Id}`;
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
    setIsRecordSelected(true);
    const details = detailData[0];
    purchaseidNew = headData.purchaseid;
    FromName = details.FromName;
    FromCode = headData.Ac_Code;
    newAcCode = headData.Ac_Code;

    BrokerName = details.Broker_Name;
    BrokerCode = headData.Broker;
    GstRateName = details.GST_Name;
    GstRateCode = details.GST_Code;
    ItemName = details.ItemName;
    ItemCodeNew = details.Item_Code;
    BrandName = details.Brand_Name;
    BrandCode = details.Brand_Code;
    subTotal = headData.Taxable_Amount;
    GSTrate = details.GSTRate;
    // setGstRate(details.GSTRate);


    //GST_Code =details.GST_Code;
    // GstRateCode =details.GST_Code;



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
      const effectiveTranType = tranType || TyanTypeState || formData.Cash_Credit;
      setFormData((prevData) => ({
        ...prevData,
        Cash_Credit: effectiveTranType
      }));

      const response2 = await axios.get(
        `${API_URL}/get-lastrecordshetkaripurchase?Company_Code=${companyCode}&Year_Code=${Year_Code}&Cash_Credit=${effectiveTranType}`
      );

      if (response2.status === 200) {
        const data = response2.data;
        NavigationSetFields(
          data.last_shetkaripurchasehead,
          data.last_shetkaripurchasedetail
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
    navigate("/ShetkariPurchaseBillUtility");
  };

  // Navigation Function to navigate to the first to last record easily.
  const handleFirstButtonClick = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/get-firstshetkaripurchase-navigation?Company_Code=${companyCode}&Year_Code=${Year_Code}&Cash_Credit=${formData.Cash_Credit}`
      );
      if (response.status === 200) {
        const data = response.data;
        NavigationSetFields(
          data.first_shetkaripurchaseHead_data,
          data.first_shetkaripurchasedetail_data
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
        `${API_URL}/getlastshetkaripurchase-record-navigation?Company_Code=${companyCode}&Year_Code=${Year_Code}&Cash_Credit=${formData.Cash_Credit}`
      );
      if (response.status === 200) {
        const data = response.data;
        NavigationSetFields(
          data.last_shetkaripurchaseHead_data,
          data.last_shetkaripurchasedetail_data
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
        `${API_URL}/getnextshetkaripurchase-navigation?Company_Code=${companyCode}&Year_Code=${Year_Code}&doc_no=${formData.Doc_No}&Cash_Credit=${formData.Cash_Credit}`
      );
      if (response.status === 200) {
        const data = response.data;
        NavigationSetFields(
          data.next_shetkaripurchasehead_data,
          data.next_shetkaripurchasedetails_data
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
        `${API_URL}/getpreviousshetkaripurchase-navigation?Company_Code=${companyCode}&Year_Code=${Year_Code}&doc_no=${formData.Doc_No}&Cash_Credit=${formData.Cash_Credit}`
      );

      if (response.status === 200) {
        const data = response.data;
        NavigationSetFields(
          data.previous_shetkaripurchaseHead_data,
          data.previous_shetkaripurchasedetail_data
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
        `${API_URL}/getshetkaripurchasebyid?doc_no=${selectedRecord.Doc_No}&Company_Code=${companyCode}&Year_Code=${Year_Code}&Cash_Credit=${selectedRecord.Cash_Credit}`
      );
      if (response.status === 200) {
        const data = response.data;
        NavigationSetFields(
          data.getData_shetkaripurchaseHead_data,
          data.getData_shetkaripurchaseDetail_data
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
        `${API_URL}/getshetkaripurchasebyid?doc_no=${navigatedRecord}&Company_Code=${companyCode}&Year_Code=${Year_Code}&Cash_Credit=${formData.Cash_Credit}`
      );
      if (response.status === 200) {
        const data = response.data;
        NavigationSetFields(
          data.getData_shetkaripurchaseHead_data,
          data.getData_shetkaripurchaseDetail_data
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
  const handleDropdownChange = async (event) => {
    const selectedValue = event.target.value;

    setTyanTypeState(selectedValue);
    setFormData((prevData) => ({
      ...prevData,
      Cash_Credit: selectedValue,
    }));

    const response = await axios.get(
      `${API_URL}/getlastshetkaripurchase-record-navigation?Company_Code=${companyCode}&Year_Code=${Year_Code}&Cash_Credit=${selectedValue}`
    );
    if (response.status === 200) {
      const data = response.data;
      NavigationSetFields(
        data.last_shetkaripurchaseHead_data,
        data.last_shetkaripurchasedetail_data
      );
    }

    // const url = `${API_URL}/get-lastreceiptpayment-navigation?Company_Code=${companyCode}&Year_Code=${YearCode}&tran_type=${selectedValue}`;
    // await handleNavigation(url, "last_head_data", "last_details_data");
  };

  //change No functionality to get that particular record
  const handleKeyDown = async (event) => {
    if (event.key === "Tab") {
      const changeNoValue = event.target.value;
      try {
        const response = await axios.get(
          `${API_URL}/getshetkaripurchasebyid?Company_Code=${companyCode}&doc_no=${changeNoValue}&Year_Code=${Year_Code}&Cash_Credit=${formData.Cash_Credit}`
        );
        const data = response.data;
        NavigationSetFields(
          data.getData_shetkaripurchaseHead_data,
          data.getData_shetkaripurchaseDetail_data
        );
        setIsEditing(false);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }
  };

  // ----------------------------------------- Shetakri Purchase Detail Functionality -----------------------------------------

  useEffect(() => {
    if (selectedRecord) {
      setUsers(
        lastTenderDetails.map((detail) => ({
          rowaction: "Normal",
          id: detail.purchasedetailid,
          purchasedetailid: detail.purchasedetailid,
          Cash_Credit: detail.Cash_Credit,
          Item_Code: detail.itemSelect,
          ic: detail.ic,
          Brand_Code: detail.Brand_Code,
          BrandNameLabel: detail.BrandNameLabel,
          itemNameLabel: detail.itemNameLabel,
          Qty: detail.Qty,
          Wt_Per: detail.Wt_Per,
          Wt_Qty: detail.Wt_Qty,
          Rate: detail.Rate,
          Value: detail.Value,
          SGST: detail.SGST,
          CGST: detail.CGST,
          IGST: detail.IGST,
          Hamali_Rate: detail.Hamali_Rate || 0,
          Hamali: detail.Hamali || 0,
          FrieghtperqntlDetail: detail.FrieghtperqntlDetail || 0,
          Net_wt: detail.Net_wt,
          Company_Code: companyCode,
          Year_Code: Year_Code,
          Branch_Code: 1,
          detail_id: detail.detail_id,
          pac: detail.pac,
          purcac: detail.purcac,
          GST_Code: detail.GST_Code,
          GSTNameLabel: detail.GSTNameLabel,
          gstRate: detail.gstRate
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
        Cash_Credit: detail.Cash_Credit,
        Item_Code: detail.Item_Code,
        itemNameLabel: detail.ItemName,
        ic: detail.ic,
        Brand_Code: detail.Brand_Code,
        BrandNameLabel: detail.Brand_Name,
        Qty: detail.Qty,
        Wt_Per: detail.Wt_Per,
        Wt_Qty: detail.Wt_Qty,
        Rate: detail.Rate,
        Value: detail.Value,
        SGST: detail.SGST,
        CGST: detail.CGST,
        IGST: detail.IGST,
        Hamali_Rate: detail.Hamali_Rate || 0,
        Hamali: detail.Hamali || 0,
        FrieghtperqntlDetail: detail.FrieghtperqntlDetail || 0,
        Net_wt: detail.Net_wt,
        Company_Code: companyCode,
        Year_Code: Year_Code,
        Branch_Code: 1,
        detail_id: detail.detail_id,
        GST_Code: detail.GST_Code,
        GSTNameLabel: detail.GST_Name,
        pac: detail.pac,
        purcac: detail.purcac,
        gstRate: detail.GSTRate
      }))
    );

  }, [lastTenderDetails]);

  const calculateDetail = async (name, value, existingData) => {
    let updatedFormDataDetail = { ...existingData, [name]: value };
    let rateper = RatePer;
    let rate = updatedFormDataDetail.Rate;
    let gstcode = updatedFormDataDetail.GST_Code || gstCode;

    const quantal = parseFloat(updatedFormDataDetail.Qty);
    const Wt_per = parseFloat(updatedFormDataDetail.Wt_Per);
    const Hamalirate = parseFloat(updatedFormDataDetail.Hamali_Rate) || 0;

    updatedFormDataDetail = {
      ...updatedFormDataDetail,
      Wt_Qty:
        !isNaN(quantal) && !isNaN(Wt_per) && Wt_per !== 0
          ? Math.round((quantal * Wt_per))
          : "",

      Value: rateper === "Q"
        ? Math.round(quantal * rate)
        : Math.round(((!isNaN(quantal) && !isNaN(Wt_per) && Wt_per !== 0)
          ? quantal * Wt_per
          : 0) / 100 * rate),

    };

    let taxaamt = updatedFormDataDetail.Value;
    const matchStatusResult = await fetchMatchStatus({
      Company_Code: companyCode,
      Year_Code: Year_Code,
      Ac_Code: from || formData.Ac_Code,
    });

    let cgstAmount = 0.00;
    let sgstAmount = 0.00;
    let igstAmount = 0.00;
    const gstRateDivide = GSTrate;

    if (gstcode !== "") {
      if (matchStatusResult === "TRUE") {
        const cgstRate = gstRateDivide / 2;
        const sgstRate = gstRateDivide / 2;
        const igstRate = 0.00;

        cgstAmount = parseFloat(calculateGSTAmount(taxaamt, cgstRate)).toFixed(2);
        sgstAmount = parseFloat(calculateGSTAmount(taxaamt, sgstRate)).toFixed(2);
        igstAmount = parseFloat(calculateGSTAmount(taxaamt, igstRate)).toFixed(2);
      } else {
        const igstRate = gstRateDivide;
        igstAmount = parseFloat(calculateGSTAmount(taxaamt, igstRate)).toFixed(2);
        cgstAmount = 0.00;
        sgstAmount = 0.00;
      }
    }

    updatedFormDataDetail = {
      ...updatedFormDataDetail,
      CGST: cgstAmount,
      SGST: sgstAmount,
      IGST: igstAmount,
    };

    return updatedFormDataDetail;
  };

  const handleKeyDownDetail = async (event) => {
    if (event.key === 'Tab') {
      const { name, value } = event.target;
      const updatedData = await calculateDetail(name, value, formDataDetail);
      setFormDataDetail(updatedData);
    }
  };

  // Function to handle changes in the form fields
  const handleChangeDetail = (event) => {
    const { name, value } = event.target;

    setFormDataDetail((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Validation: Qty and Wt_Per should not be the same
    if ((name === "Qty" && parseFloat(value) === parseFloat(formDataDetail.Wt_Per)) ||
      (name === "Wt_Per" && parseFloat(value) === parseFloat(formDataDetail.Qty))) {
      toast.warning("Qty and Wt_Per cannot be the same!");
    }
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

      Cash_Credit: tranType ? tranType : "CS",
      Qty: "",
      Wt_Per: "",
      Wt_Qty: "",
      Rate: "",
      Value: "",
      SGST: "",
      CGST: "",
      IGST: "",
      Hamali_Rate: 0,
      Hamali: 0,
      FrieghtperqntlDetail: 0,
      Net_wt: "",
    });
    setItemSelect("");
    setItemNameLabel("");
    setBrandCode("");
    setBrandName("");
    setGstCode("")
    setSelectedUser({});
    setGstRate("");

  };

  const editUser = (user) => {
    setSelectedUser(user);
    setItemSelect(user.Item_Code);
    setBrandCode(user.Brand_Code);
    setBrandNameLabel(user.BrandNameLabel);
    setItemNameLabel(user.itemNameLabel);
    setPurchaseAc(user.purcac);
    setPurchaseAcid(user.pac)
    setGstCode(user.GST_Code)
    setGSTNameLabel(user.GSTNameLabel);
    setGstRate(user.GSTRate);
    console.log(gstRate);

    setFormDataDetail({

      Cash_Credit: formData.Cash_Credit,
      Qty: user.Qty,
      Wt_Per: user.Wt_Per,
      Wt_Qty: user.Wt_Qty,
      Rate: user.Rate,
      Value: user.Value,
      SGST: user.SGST,
      CGST: user.CGST,
      IGST: user.IGST,
      Hamali_Rate: user.Hamali_Rate || 0,
      Hamali: user.Hamali || 0,
      FrieghtperqntlDetail: user.FrieghtperqntlDetail,
      Net_wt: user.Net_wt,
      purcac: user.purcac,
      pac: user.pac,
    });
    if (from !== "" || FromCode !== "") {
      const match_status = fetchMatchStatus({
        Company_Code: companyCode,
        Year_Code: Year_Code,
        Ac_Code: cancelButtonClicked
          ? FromCode || formData.Ac_Code
          : from,
      });

    }

    openPopup("edit");
  };
  console.log(gstRate);
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

    const TCSRate = parseFloat(formData.TCS_Par) || 0;
    const TDSRate = parseFloat(formData.TDS_Rate) || 0;

    let billAmount;
    let netPayable;
    let TCSAmount;
    let TDSAmount;

    if (match_status === "TRUE") {
      billAmount =
        parseFloat(subTotal) +
        parseFloat(CGSTAmount) +
        parseFloat(SGSTAmount)


      netPayable = billAmount.toFixed(2);
      TCSAmount = (billAmount * TCSRate) / 100;
      TDSAmount = (subTotal * TDSRate) / 100;
      setFormData({
        ...formData,


        Amount: billAmount,

        TCS_Amount: TCSAmount,
        TDS_Amt: TDSAmount,
      });
    } else {
      billAmount =
        parseFloat(subTotal) +
        parseFloat(IGSTAmount);
      netPayable = billAmount.toFixed(2);
      TCSAmount = (billAmount * TCSRate) / 100;
      TDSAmount = (subTotal * TDSRate) / 100;

      setFormData({
        ...formData,


        Amount: billAmount,

        TCS_Amount: TCSAmount,
        TDS_Amt: TDSAmount,
      });
    }
  };

  const addUser = async () => {
    if (!itemSelect) {
      Swal.fire({
        icon: "warning",
        text: "Please Select Item.",
        confirmButtonColor: "#d33",
      });
      return;
    }

    // Validation: Qty and Wt_Per cannot be the same
    const qty = parseFloat(formDataDetail.Qty || 0);
    const wtPer = parseFloat(formDataDetail.Wt_Per || 0);
    if (qty === wtPer) {
      Swal.fire({
        icon: "error",
        text: "Qty and Wt_Per cannot be the same!",
        confirmButtonColor: "#d33",
      });
      return; // Stop adding
    }

    const newUser = {
      id: users.length > 0 ? Math.max(...users.map((user) => user.id)) + 1 : 1,
      Item_Code: itemSelect,
      ic: itemSelectAccoid,
      Brand_Code: brandCode,
      itemNameLabel: itemNameLabel,
      BrandNameLabel: BrandNameLabel,
      Cash_Credit: TyanTypeState,
      Qty: formDataDetail.Qty,
      Wt_Per: formDataDetail.Wt_Per,
      Wt_Qty: formDataDetail.Wt_Qty,
      Rate: formDataDetail.Rate,
      Value: formDataDetail.Value,
      SGST: formDataDetail.SGST,
      CGST: formDataDetail.CGST,
      IGST: formDataDetail.IGST,
      Hamali_Rate: formDataDetail.Hamali_Rate || 0,
      Hamali: formDataDetail.Hamali || 0,
      FrieghtperqntlDetail: formDataDetail.FrieghtperqntlDetail || 0,
      Net_wt: formDataDetail.Net_wt,
      GST_Code: gstCode,
      GSTNameLabel: GSTNameLabel,
      purcac: PurchaseAc,
      pac: PurchaseAcid,
      gstRate: formDataDetail.GSTRate,
      ...formDataDetail,
      rowaction: "add",
    };

    const newUsers = [...users, newUser];

    const totalItemAmount = newUsers.reduce(
      (total, user) => total + parseFloat(user.Value || 0),
      0
    );
    const totalQuantal = newUsers.reduce(
      (total, user) => total + parseFloat(user.Qty || 0),
      0
    );

    subTotal = totalItemAmount.toFixed(2);
    globalQuantalTotal = totalQuantal;

    const totalCGST = newUsers.reduce(
      (total, user) => total + parseFloat(user.CGST || 0),
      0
    );
    const totalSGST = newUsers.reduce(
      (total, user) => total + parseFloat(user.SGST || 0),
      0
    );
    const totalIGST = newUsers.reduce(
      (total, user) => total + parseFloat(user.IGST || 0),
      0
    );
    const totalHamali = newUsers.reduce(
      (total, user) => total + parseFloat(user.Hamali || 0),
      0
    );

    setFormDataDetail({
      ...formDataDetail,
    });

    setFormData((prev) => ({
      ...prev,
      Taxable_Amount: totalItemAmount.toFixed(2),
      CGST_Amount: totalCGST.toFixed(2),
      SGST_Amount: totalSGST.toFixed(2),
      IGST_Amount: totalIGST.toFixed(2),
      Amount: (totalItemAmount + totalCGST + totalSGST + totalIGST).toFixed(2),
      Hamali: totalHamali.toFixed(2),
    }));

    setUsers(newUsers);

    closePopup();

    setTimeout(() => {
      addButtonRef.current.focus();
    }, 500);
  };

  const updateUser = async () => {


    // Focus the button after a delay (optional)
    setTimeout(() => {
      if (addButtonRef.current) {
        addButtonRef.current.focus();
      }
    }, 500);

    // Update users array immutably
    const updatedUsers = users.map((user) => {
      if (user.id === selectedUser.id) {
        const updatedRowaction =
          user.rowaction === "Normal" ? "update" : user.rowaction;

        return {
          ...user,
          Item_Code: itemSelect,
          itemNameLabel,
          ic: itemSelectAccoid,
          Brand_Code: brandCode,
          BrandNameLabel: BrandNameLabel,
          GST_Code: gstCode,
          GSTNameLabel: GSTNameLabel,
          gstRate: gstRate,
          purcac: PurchaseAc,
          pac: PurchaseAcid,
          ...formDataDetail,
          rowaction: updatedRowaction,
        };
      }
      return user;
    });

    // Find updated user
    const updatedUser = updatedUsers.find((u) => u.id === selectedUser.id);

    // Update formDataDetail only with selected user
    if (updatedUser) {
      setFormDataDetail(updatedUser);
    }

    // Totals based on updatedUsers
    const totalItemAmount = updatedUsers.reduce((total, user) => total + parseFloat(user.Value || 0), 0);
    const totalQuantal = updatedUsers.reduce((total, user) => total + parseFloat(user.Qty || 0), 0);

    subTotal = totalItemAmount.toFixed(2);
    globalQuantalTotal = totalQuantal;

    let totalCGST = updatedUsers.reduce((total, user) => total + parseFloat(user.CGST || 0), 0);
    let totalSGST = updatedUsers.reduce((total, user) => total + parseFloat(user.SGST || 0), 0);
    let totalIGST = updatedUsers.reduce((total, user) => total + parseFloat(user.IGST || 0), 0);
    let totalHamali = updatedUsers.reduce((total, user) => total + parseFloat(user.Hamali || 0), 0);

    // Update formData totals
    setFormData((prev) => ({
      ...prev,
      Taxable_Amount: totalItemAmount.toFixed(2),
      CGST_Amount: totalCGST.toFixed(2),
      SGST_Amount: totalSGST.toFixed(2),
      IGST_Amount: totalIGST.toFixed(2),
      Amount: (totalItemAmount + totalCGST + totalSGST + totalIGST).toFixed(2),
      Hamali: totalHamali.toFixed(2),
    }));

    // ✅ Correct way: replace users with updatedUsers
    setUsers(updatedUsers);

    // Close the popup
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

    // ✅ Calculate totals excluding deleted/DNU rows
    const activeUsers = updatedUsers.filter(
      (u) => u.rowaction !== "delete" && u.rowaction !== "DNU"
    );

    const totalItemAmount = activeUsers.reduce(
      (total, u) => total + parseFloat(u.Value || 0),
      0
    );

    const totalQuantal = activeUsers.reduce(
      (total, u) => total + parseFloat(u.Qty || 0),
      0
    );

    subTotal = totalItemAmount.toFixed(2);
    globalQuantalTotal = totalQuantal;

    let totalCGST = activeUsers.reduce(
      (total, u) => total + parseFloat(u.CGST || 0),
      0
    );
    let totalSGST = activeUsers.reduce(
      (total, u) => total + parseFloat(u.SGST || 0),
      0
    );
    let totalIGST = activeUsers.reduce(
      (total, u) => total + parseFloat(u.IGST || 0),
      0
    );
    let totalHamali = activeUsers.reduce(
      (total, u) => total + parseFloat(u.Hamali || 0),
      0
    );
    if (from !== "" || FromCode !== "") {
      const updatedFormData = { ...formData };
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

    // ✅ Update totals in formData
    setFormData((prev) => ({
      ...prev,
      Taxable_Amount: totalItemAmount.toFixed(2),
      CGST_Amount: totalCGST.toFixed(2),
      SGST_Amount: totalSGST.toFixed(2),
      IGST_Amount: totalIGST.toFixed(2),
      Amount: (totalItemAmount + totalCGST + totalSGST + totalIGST).toFixed(2),
      Hamali: totalHamali.toFixed(2),
    }));

    // ✅ Update formDataDetail only with selected user

    // ✅ External API call for match status


    setUsers(updatedUsers);

    setDeleteMode(true);
    setSelectedUser({});
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
        return total + parseFloat(u.Value || 0);
      }
      return total;
    }, 0);

    const updatedSubTotal = totalItemAmount.toFixed(2);
    subTotal = updatedSubTotal;
    const activeUsers = updatedUsers.filter(
      (u) => u.rowaction !== "DNU" && u.rowaction !== "delete"
    );
    let totalCGST = activeUsers.reduce(
      (total, u) => total + parseFloat(u.CGST || 0),
      0
    );
    let totalSGST = activeUsers.reduce(
      (total, u) => total + parseFloat(u.SGST || 0),
      0
    );
    let totalIGST = activeUsers.reduce(
      (total, u) => total + parseFloat(u.IGST || 0),
      0
    );
    let totalHamali = activeUsers.reduce(
      (total, u) => total + parseFloat(u.Hamali || 0),
      0
    );
    const totalQuantal = updatedUsers.reduce((total, u) => {
      if (u.rowaction !== "DNU" && u.rowaction !== "delete") {
        return total + parseFloat(u.Quantal || 0);
      }
      return total;
    }, 0);

    globalQuantalTotal = totalQuantal;

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
    setFormData((prev) => ({
      ...prev,
      Taxable_Amount: totalItemAmount.toFixed(2),
      CGST_Amount: totalCGST.toFixed(2),
      SGST_Amount: totalSGST.toFixed(2),
      IGST_Amount: totalIGST.toFixed(2),
      Amount: (totalItemAmount + totalCGST + totalSGST + totalIGST).toFixed(2),
      Hamali: totalHamali.toFixed(2),
    }));


    setUsers(updatedUsers);
    setSelectedUser({});
  };

  const handleItemSelect = (code, accoid, HSN, Name, GST_Code, Purchase_AC, Sale_AC, RatePer, pac, sac) => {

    setItemSelect(code);
    setItemSelectAccoid(accoid);
    setItemNameLabel(Name);
    setPurchaseAc(Purchase_AC);
    setSaleAc(Sale_AC);
    setRatePer(RatePer);
    setPurchaseAcid(pac);
    setSaleAcid(sac);
    setFormDataDetail(prevData => ({
      ...prevData,
      purcac: Purchase_AC,
      pac: pac
    }));

  };

  const handleBrandCode = (code, Name) => {
    setBrandCode(code);
    setBrandNameLabel(Name);
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



  const handleBroker = (code, accoid) => {
    setBroker(code);
    setFormData({
      ...formData,
      Broker: code,
      bc: accoid,
    });
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

    const TCSRate = parseFloat(formData.TCS_Par) || 0;
    const TDSRate = parseFloat(formData.TDS_Rate) || 0;
    const vatavrate = parseFloat(formData.Vatavrate) || 0;

    let billAmount;
    let netPayable;
    let TCSAmount;
    let TDSAmount;
    let vatavamt = 0;

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
      vatavamt = (billAmount * vatavrate) / 100;

      setFormData((prevFormData) => ({
        ...prevFormData,
        Amount: billAmount,
        TCS_Amount: TCSAmount,
        TDS_Amt: TDSAmount,
        Vatavamt: vatavamt
      }));
    } else {
      billAmount =
        (parseFloat(subTotal) || 0) +
        (parseFloat(igstAmount) || 0) +
        (parseFloat(formData.OTHER_AMT) || 0) +
        (parseFloat(formData.cash_advance) || 0);

      netPayable = billAmount.toFixed(2);
      TCSAmount = (billAmount * TCSRate) / 100;
      TDSAmount = (subTotal * TDSRate) / 100;

      setFormData((prevFormData) => ({
        ...prevFormData,


        Amount: billAmount,

        TCS_Amount: TCSAmount,
        TDS_Amt: TDSAmount,
      }));
    }
  };

  const handleGstCode = async (code, Rate, name, gstId) => {
    setGstCode(code);
    setGstRate(Rate);
    setGSTNameLabel(name);


    if (from != "" || FromCode != "") {
      const match_status = await fetchMatchStatus({
        Company_Code: companyCode,
        Year_Code: Year_Code,
        Ac_Code: cancelButtonClicked ? FromCode : from,
      });

      const gstRateDivide = parseFloat(Rate);
      GSTrate = Rate;
      const updatedData = await calculateDetail("GST_Code", code, formDataDetail);
      setFormDataDetail(updatedData);
      // await calculateAndUpdateFormData(subTotal, gstRateDivide, match_status);
    }
  };


  const AmountCalculation = async (name, input, formData) => {
    formData = {
      ...formData,
      TCS_Par: 0.00,
      TDS_Rate: 0.00,
      TDS_Amt: 0.00,
      TCS_Amount: 0.00
    }

    let updatedFormData = { ...formData, [name]: input };
    let Ac_Code = input;
    const updateApiUrl = `${API_URL}/getAmountcalculationDataForInword?CompanyCode=${companyCode}&Ac_Code=${Ac_Code}&Year_Code=${Year_Code}`;

    const response = await axios.get(updateApiUrl);
    const details = response.data;
    let balancelimit = details['Balancelimt']
    let PSAmt = 0.00;
    let PSBalAmt = 0.00;
    let PSRate = parseFloat(updatedFormData.PurchaseRate) || 0.00;
    let PSAmountf = 0.00;
    let PSAmount = 0.00;
    let PurchaseTDSRate = details['PurchaseTDSRate']
    let TCSRate = TCSApplicable === 'Y' ? details['TCSRate'] : 0.00;
    PSBalAmt = formData.Amount;
    PSAmountf = details['PSAmt']
    if (PSAmountf == 0) {
      PSAmountf = 0.00
    }
    PSAmount = PSAmountf + PSBalAmt;

    if (PSAmount >= balancelimit) {

      updatedFormData.TDS_Rate = PurchaseTDSRate;
      updatedFormData.TCS_Par = 0.00;
      const tdsAmount = ((PSBalAmt * PurchaseTDSRate) / 100).toFixed(2);
      updatedFormData.TDS_Amt = tdsAmount;
    }
    else {
      updatedFormData.TDS_Rate = 0.00;
      updatedFormData.TCS_Par = TCSRate
      const tcsAmount = (
        ((parseFloat(formData.Bill_Amount) || 0) * TCSRate) /
        100
      ).toFixed(2);
      updatedFormData.TCS_Amount = tcsAmount;
    }


    setFormData((prevFormData) => ({
      ...prevFormData,
      ...updatedFormData

    }));
    return updatedFormData;
  }

  const [isRecordSelected, setIsRecordSelected] = useState(false);

  const handleFrom = async (
    code,
    accoid,
    Name,
    Mobile_No,
    Gst_No,
    TDSApplicable,
    GSTStateCode,
    cityname
  ) => {
    setFrom(code);

    // Disable the button if a code is selected, enable if code is empty
    setIsRecordSelected(true);

    const matchStatusResult = await fetchMatchStatus({
      Company_Code: companyCode,
      Year_Code: Year_Code,
      Ac_Code: code,
    });

    // let GSTRate = gstRate;

    // if (!GSTRate || GSTRate === 0 || GSTRate === "") {
    //   const cgstRate = parseFloat(formData.CGSTRate) || 0;
    //   const sgstRate = parseFloat(formData.SGSTRate) || 0;
    //   const igstRate = parseFloat(formData.IGSTRate) || 0;

    //   GSTRate = igstRate > 0 ? igstRate : cgstRate + sgstRate;
    // }

    // const gstRateDivide = parseFloat(GSTRate);

    let GSTRate = gstRate;

    // If update mode OR blank GST rate → reconstruct from existing GST amounts
    if (!GSTRate || GSTRate === 0 || GSTRate === "" || isEditMode) {

      const sub = parseFloat(subTotal) || 0;

      if (sub > 0) {

        const CGSTAmount = parseFloat(formData.CGST_Amount) || 0;
        const SGSTAmount = parseFloat(formData.SGST_Amount) || 0;
        const IGSTAmount = parseFloat(formData.IGST_Amount) || 0;

        if (IGSTAmount > 0) {
          // ✔ IGST bill
          GSTRate = (IGSTAmount * 100) / sub;
        } else if (CGSTAmount > 0 && SGSTAmount > 0) {
          // ✔ CGST + SGST bill
          const halfRate = (CGSTAmount * 100) / sub;
          GSTRate = halfRate * 2;   // because CGST + SGST
        }
      }
    }

    const gstRateDivide = parseFloat(GSTRate);


    await calculateAndUpdateFormData(subTotal, gstRateDivide, matchStatusResult);

    const name = formData?.name || "";
    const value = formData?.value || "";
    if (code !== "") {
      if (!isEditMode) {
        const TDSTCSData = await AmountCalculation(name, code, formData);
      }
    }

    setFormData((prevFormData) => ({
      ...prevFormData,
      Ac_Code: code,
      ac: accoid,
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



  const handleAddShetkari = (event) => {
    event.preventDefault();
    setShowCityPopup(true);
  };
  const handleClosePopup = () => {
    setShowCityPopup(false);
  };
  const handleGSTStateCode = (code) => {
    setAcStateCode(code);

  };
  const handleCity_Code = (code, cityId, cityName, pinCode) => {
    setcitycode(code);
    setcityname(cityName);
    setcityid(cityId)

  };


  const handleMasterSave = async (event) => {
    event.preventDefault();


    if (
      !acName.trim() ||
      !acAddress.trim() ||
      AcStateCode === null || AcStateCode === undefined || AcStateCode === "" ||
      citycode === null || citycode === undefined || citycode === ""
    ) {
      let missingFields = [];
      if (!acName.trim()) missingFields.push("Ac_name");
      if (!acAddress.trim()) missingFields.push("Ac_address");
      if (AcStateCode === null || AcStateCode === undefined || AcStateCode === "") missingFields.push("State");
      if (citycode === null || citycode === undefined || citycode === "") missingFields.push("City");

      Swal.fire({
        icon: "warning",
        title: "Missing Fields",
        text: `Please fill/select the following fields: ${missingFields.join(", ")}`,
        confirmButtonText: "OK",
      });
      return;
    }

    if (AccountMasterRef.current) {
      let cityData = {
        Ac_Name_E: acName,
        Ac_type: 'SP',
        Address_E: acAddress,
        Mobile_No: phoneNumber,
        UnregisterGST: 1,
        CompanyPan: PANNumber,
        Short_Name: acName.slice(0, 15),
        adhar_no: AcAdharNumber,
        GSTStateCode: AcStateCode,
        Bank_Name: AcBankName,
        Bank_Ac_No: AccountNumber,
        IFSC: AcIFSCCode,
        Group_Code: 0,
        bsid: 0,
        cityid: cityid,
        City_Code: citycode,
        Year_Code: Year_Code,
        company_code: companyCode,
        PurchaseTDSApplicable: 'X',
      };

      const requestData = { cityData };

      try {
        const response = await axios.post(
          `${API_URL}/insertShetkari-accountmaster?company_code=${companyCode}`,
          requestData
        );
        toast.success("Account created successfully!");
        setAccountMasterData(response.data);

        handleFrom(
          response.data.Ac_code,
          response.data.auto_id,
          acName,
          '',
          '',
          '',
          '',
          '',
          ''
        );
        setFrom(response.data.Ac_code)
        newAcCode = response.data.Ac_code
        FromName = acName
        FromCode = response.data.Ac_code

        setFormData((prevState) => ({
          ...prevState,
          Ac_Code: response.data.Ac_code,
          ac: response.data.auto_id,
        }));
        setShowCityPopup(false);
      } catch (error) {
        toast.error(
          "Error occurred while creating city: " +
          (error.response?.data?.error || error.message)
        );
        console.error("Error creating city:", error);
      }
    } else {
      console.error("CityMaster is not loaded yet");
    }
  };



  const showCGSTHeader = users.some(u => Number(u.CGST) !== 0);
  const showSGSTHeader = users.some(u => Number(u.SGST) !== 0);
  const showIGSTHeader = users.some(u => Number(u.IGST) !== 0);
  const showHamaliRateHeader = users.some(u => Number(u.Hamali_Rate) !== 0);
  const showHamaliHeader = users.some(u => Number(u.Hamali) !== 0);
  const showFreightHeader = users.some(u => Number(u.FrieghtperqntlDetail) !== 0);

  const showBrandHeader = users.some(
    u => Number(u.Brand_Code) !== 0 && u.Brand_Code !== null
  );





  const handleAc_Code = async (code, accoid, Name, Mobile_No, Gst_No, TDSApplicable, GSTStateCode, cityname) => {
    setFrom(code);
    const matchStatusResult = await fetchMatchStatus({
      Company_Code: companyCode,
      Year_Code: Year_Code,
      Ac_Code: code,
    });
  }

  return (
    <>
      <UserAuditInfo
        createdBy={formData.Created_By}
        modifiedBy={formData.Modified_By}
        title={"Shetakri Purchase Bill"}
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
          component={<ShetkariPurchaseReport doc_no={formData.Doc_No} Tran_Type={formData.Cash_Credit} disabledFeild={!addOneButtonEnabled} />}
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
                <FormControl fullWidth>
                  <InputLabel id="Cash_Credit">CashCredit</InputLabel>
                  <Select
                    labelId="Cash_Credit"
                    id="Cash_Credit"
                    name="Cash_Credit"
                    value={formData.Cash_Credit}
                    onChange={handleDropdownChange}
                    disabled={!addOneButtonEnabled}
                    size="small"
                    InputLabelProps={{
                      style: { fontWeight: 'bold' },
                    }}
                  >
                    <MenuItem value="CS">Cash</MenuItem>
                    <MenuItem value="CR">Cash Credit</MenuItem>

                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={1}>
                <FormControl>
                  <TextField
                    label="Doc No"
                    name="doc_no"
                    variant="outlined"
                    autoComplete="off"
                    value={formData.Doc_No}
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
                  name="Doc_Date"
                  value={formData.Doc_Date}
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


            </Grid>

            <div className="SugarPurchaseBill-row" style={{ marginTop: "20px" }}>
              <label htmlFor="Bill_From" className="SugarPurchaseBilllabel" >
                Supplier A/c :
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
              <Button
                variant="contained"
                size="small"
                onClick={(e) => handleAddShetkari(e)}
                ref={AccountMasterRef}
                disabled={isRecordSelected || !isEditing && addOneButtonEnabled}
              >
                Create Shetkari
              </Button>


              <Box
                sx={{ display: "flex" }} >
                <div
                  className={`modal fade ${showCityPopup ? 'show' : ''}`}
                  style={{ display: showCityPopup ? 'block' : 'none', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                  tabIndex="-1"
                  role="dialog"
                  aria-hidden={!showCityPopup}
                >
                  <div className="modal-dialog" style={{ maxWidth: '30%' }}>
                    <div className="modal-content">
                      <div className="modal-header">
                        <Button
                          sx={{
                            fontSize: "16px",
                            border: "none",
                            cursor: "pointer",
                            marginLeft: "900px",
                          }}
                          onClick={handleClosePopup}
                        >
                          &times;
                        </Button>
                      </div>
                      <div style={{ padding: '20px' }}>
                        <TextField
                          inputRef={acNameRef}
                          label="Ac_name"
                          variant="outlined"
                          name="Ac_name"
                          value={acName}
                          onChange={(e) => setAcName(e.target.value)}
                          fullWidth
                          size="small"
                          required
                          sx={{ mb: 2 }}
                        />


                        <TextField
                          label="Ac_address"
                          variant="outlined"
                          name="Ac_address"
                          value={acAddress}
                          onChange={(e) => setAcAddress(e.target.value)}
                          fullWidth
                          size="small"
                          sx={{ mb: 2 }}
                          required
                          inputProps={{ min: 15 }}
                        />

                        <TextField
                          label="Phone Number"
                          variant="outlined"
                          name="Phone_number"
                          value={phoneNumber}
                          onChange={(e) => {

                            const numericValue = e.target.value.replace(/\D/g, "");
                            setPhoneNumber(numericValue);
                          }}
                          fullWidth
                          size="small"
                          sx={{ mb: 2 }}
                        />

                        <TextField
                          label="PAN Number"
                          variant="outlined"
                          name="PAN_number"
                          value={PANNumber}
                          onChange={(e) => setPANNumber(e.target.value.toUpperCase())}
                          fullWidth
                          size="small"
                          sx={{ mb: 2 }}
                        />
                        <TextField
                          label="Account Number"
                          variant="outlined"
                          name="Account_number"
                          value={AccountNumber}
                          onChange={(e) => setAccountNumber(e.target.value)}
                          fullWidth
                          size="small"
                          sx={{ mb: 2 }}
                        />
                        <TextField
                          label="IFSC Number"
                          variant="outlined"
                          name="IFSC_number"
                          value={AcIFSCCode}
                          onChange={(e) => setAcIFSCCode(e.target.value)}
                          fullWidth
                          size="small"
                          sx={{ mb: 2 }}
                        />
                        <TextField
                          label="Bank Name"
                          variant="outlined"
                          name="Bank_Name"
                          value={AcBankName}
                          onChange={(e) => setAcBankName(e.target.value)}
                          fullWidth
                          size="small"
                          sx={{ mb: 2 }}
                        />
                        <div style={{ display: "flex", alignItems: "center", marginBottom: "16px" }}>
                          <label
                            htmlFor="GSTStateCode"
                            style={{ fontWeight: "bold", marginRight: "10px", minWidth: "100px" }}
                          >
                            State Code :
                          </label>
                          <div style={{ flex: 1 }}>
                            <GSTStateMasterHelp
                              name="GSTStateCode"
                              onAcCodeClick={handleGSTStateCode}
                              GstStateName={gstStateName}
                              GstStateCode={AcStateCode}
                              tabIndex={44}
                            />
                          </div>
                        </div>



                        <div style={{ display: "flex", alignItems: "center", marginBottom: "16px" }}>
                          <label
                            htmlFor="City_Code"
                            style={{ fontWeight: "bold", marginRight: "10px", minWidth: "100px" }}
                          >
                            City Code :
                          </label>
                          <div style={{ flex: 1 }}>
                            <CityMasterHelp
                              name="City_Code"
                              onAcCodeClick={handleCity_Code}
                              CityName={cityname}
                              CityCode={citycode}
                              tabIndex={8}
                            />
                          </div>
                        </div>



                      </div>
                      <div className="modal-footer">
                        <Button variant="contained" color="primary" onClick={handleMasterSave}>
                          Save
                        </Button>
                        <Button variant="contained" color="error" onClick={handleClosePopup}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                {showCityPopup && (
                  <Box
                    sx={{
                      position: "fixed",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100% ",
                      transform: "translate(-50%, 50%)",
                      bgcolor: "rgba(0, 0, 0, 0)",
                      zIndex: 999,
                    }}
                    onClick={handleClosePopup}
                  ></Box>
                )}
              </Box>
            </div>
            <div className="SugarPurchaseBill-row">
              <label htmlFor="Bill_From" style={{ fontWeight: "bold", marginLeft: "px" }} >
                Broker :
              </label>
              <div style={{ marginLeft: "55px" }}>
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


            </div>


            <div className="SugarPurchaseBill-row">
              <Grid container spacing={2}>
                <Grid item xs={1.5}>
                  <TextField
                    label="LR_No"
                    variant="outlined"
                    name="LR_No"
                    autoComplete="off"
                    value={formData.LR_No}
                    onChange={(e) =>
                      handleChange({
                        target: { name: e.target.name, value: e.target.value.toUpperCase() },
                      })
                    } // 👈 converts input to uppercase as user types
                    disabled={!isEditing && addOneButtonEnabled}
                    fullWidth
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: 'black',
                        backgroundColor: 'white',
                        textTransform: 'uppercase', // 👈 visually uppercase too
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
                    label="Truck_No"
                    variant="outlined"
                    name="Truck_No"
                    autoComplete="off"
                    value={formData.Truck_No}
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
                <Grid item xs={2}>
                  <TextField
                    label="Freight/Qntl"
                    variant="outlined"
                    name="Frieghtperqntl"
                    autoComplete="off"
                    value={formData.Frieghtperqntl}
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
            <ShetkariPurchaseDetail
              show={showPopup}
              onClose={() => setShowPopup(false)}
              selectedUser={selectedUser}
              formDataDetail={formDataDetail}
              handleChangeDetail={handleChangeDetail}
              handleItemSelect={handleItemSelect}
              handleBrandCode={handleBrandCode}
              handleGstCode={handleGstCode}
              gstCode={gstCode}
              GSTNameLabel={GSTNameLabel}
              itemNameLabel={itemNameLabel}
              itemSelect={itemSelect}
              BrandNameLabel={BrandNameLabel}
              brandCode={brandCode}
              addUser={addUser}
              updateUser={updateUser}
              isEditing={true}
              addOneButtonEnabled={false}
              firstInputRef={firstInputRef}
              handleKeyDownDetail={handleKeyDownDetail}
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
                    {showBrandHeader && (
                      <>
                        <TableCell sx={headerCellStyle}>Brand Code</TableCell>
                        <TableCell sx={headerCellStyle}>Brand Name</TableCell>
                      </>
                    )}
                    <TableCell sx={headerCellStyle}>Qty</TableCell>
                    <TableCell sx={headerCellStyle}>Wt_per</TableCell>
                    <TableCell sx={headerCellStyle}>Wt_qty</TableCell>
                    <TableCell sx={headerCellStyle}>Less wt</TableCell>
                    <TableCell sx={headerCellStyle}>Rate</TableCell>
                    <TableCell sx={headerCellStyle}>Value</TableCell>

                    <TableCell sx={headerCellStyle}>Gst code</TableCell>
                    <TableCell sx={headerCellStyle}>Gst rate</TableCell>
                    {showCGSTHeader && (
                      <TableCell sx={headerCellStyle}>CGST</TableCell>
                    )}

                    {showSGSTHeader && (
                      <TableCell sx={headerCellStyle}>SGST</TableCell>
                    )}

                    {showIGSTHeader && (
                      <TableCell sx={headerCellStyle}>IGST</TableCell>
                    )}

                    {showHamaliRateHeader && (
                      <TableCell sx={headerCellStyle}>Hamali Rate</TableCell>
                    )}

                    {showHamaliHeader && (
                      <TableCell sx={headerCellStyle}>Hamali Amount</TableCell>
                    )}

                    {showFreightHeader && (
                      <TableCell sx={headerCellStyle}>Freight / Qntl</TableCell>
                    )}


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
                      <TableCell sx={{ padding: '4px 8px', textAlign: "center" }}>{user.Item_Code || itemSelect}</TableCell>
                      <TableCell sx={{ padding: '4px 8px', textAlign: "center" }}>{user.itemNameLabel}</TableCell>
                      {Number(user.Brand_Code) !== 0 && (
                        <>
                          <TableCell sx={{ padding: "4px 8px", textAlign: "center" }}>
                            {user.Brand_Code}
                          </TableCell>

                          <TableCell sx={{ padding: "4px 8px", textAlign: "center" }}>
                            {user.BrandNameLabel}
                          </TableCell>
                        </>
                      )}
                      <TableCell sx={{ padding: '4px 8px', textAlign: "center" }}>{user.Qty}</TableCell>
                      <TableCell sx={{ padding: '4px 8px', textAlign: "center" }}>{user.Wt_Per}</TableCell>
                      <TableCell sx={{ padding: '4px 8px', textAlign: "center" }}>{user.Wt_Qty}</TableCell>
                      <TableCell sx={{ padding: '4px 8px', textAlign: "center" }}>{user.Net_wt}</TableCell>

                      <TableCell sx={{ padding: '4px 8px', textAlign: "center" }}>{user.Rate}</TableCell>
                      <TableCell sx={{ padding: '4px 8px', textAlign: "center" }}>{user.Value}</TableCell>
                      <TableCell sx={{ padding: '4px 8px', textAlign: "center" }}>{user.GST_Code || gstCode}</TableCell>
                      <TableCell sx={{ padding: '4px 8px', textAlign: "center" }}>{user.GSTNameLabel}</TableCell>
                      {showCGSTHeader && (
                        <TableCell sx={{ textAlign: "center" }}>
                          {Number(user.CGST) !== 0 ? user.CGST : ""}
                        </TableCell>
                      )}

                      {showSGSTHeader && (
                        <TableCell sx={{ textAlign: "center" }}>
                          {Number(user.SGST) !== 0 ? user.SGST : ""}
                        </TableCell>
                      )}

                      {showIGSTHeader && (
                        <TableCell sx={{ textAlign: "center" }}>
                          {Number(user.IGST) !== 0 ? user.IGST : ""}
                        </TableCell>
                      )}

                      {showHamaliRateHeader && (
                        <TableCell sx={{ textAlign: "center" }}>
                          {Number(user.Hamali_Rate) !== 0 ? user.Hamali_Rate : ""}
                        </TableCell>
                      )}

                      {showHamaliHeader && (
                        <TableCell sx={{ textAlign: "center" }}>
                          {Number(user.Hamali) !== 0 ? user.Hamali : ""}
                        </TableCell>
                      )}

                      {showFreightHeader && (
                        <TableCell sx={{ textAlign: "center" }}>
                          {Number(user.FrieghtperqntlDetail) !== 0 ? user.FrieghtperqntlDetail : ""}
                        </TableCell>
                      )}



                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
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
                <label className="SugarPurchaseBilllabel">Taxable Amt:</label>
              </Grid>
              <Grid item xs={12} sm={2}>
                <TextField
                  variant="outlined"
                  name="Taxable_Amount"
                  autoComplete="off"
                  value={subTotal || formData.Taxable_Amount}
                  disabled
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  error={!!formErrors.Taxable_Amount}
                  helperText={formErrors.Taxable_Amount}
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

                <Grid item xs={12} sm={2}>
                  <TextField
                    variant="outlined"
                    name="CGSTAmount"
                    autoComplete="off"
                    value={CGSTAmount || formData.CGST_Amount}
                    onChange={handleChange}
                    disabled
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    error={!!formErrors.CGST_Amount}
                    helperText={formErrors.CGST_Amount}
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

                <Grid item xs={12} sm={2}>
                  <TextField
                    variant="outlined"
                    name="SGST Amount"
                    autoComplete="off"
                    value={SGSTAmount || formData.SGST_Amount}
                    onChange={handleChange}
                    disabled
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    error={!!formErrors.SGST_Amount}
                    helperText={formErrors.SGST_Amount}
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

                <Grid item xs={12} sm={2}>
                  <TextField
                    variant="outlined"
                    name="IGSTAmount"
                    autoComplete="off"
                    value={IGSTAmount || formData.IGST_Amount}
                    onChange={handleChange}
                    disabled
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    error={!!formErrors.IGST_Amount}
                    helperText={formErrors.IGST_Amount}
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

                <Grid item xs={12} sm={2}>
                  <TextField
                    variant="outlined"
                    name="Hamali"
                    autoComplete="off"
                    value={HamaliAmount || formData.Hamali}
                    onKeyDown={handleKeyDownOther}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    error={!!formErrors.Hamali}
                    helperText={formErrors.Hamali}
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
                    Postage:
                  </label>
                </Grid>
                <Grid item xs={12} sm={2}>
                  <TextField
                    variant="outlined"
                    fullWidth
                    name="postage"
                    autoComplete="off"
                    value={formData.postage}
                    onChange={handleChange}
                    onKeyDown={handleKeyDownOther}
                    disabled={!isEditing && addOneButtonEnabled}
                    error={Boolean(formErrors.postage)}
                    helperText={formErrors.postage || ""}
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
                    Amount :
                  </label>
                </Grid>
                <Grid item xs={12} sm={2}>
                  <TextField
                    variant="outlined"
                    fullWidth
                    name="Amount"
                    autoComplete="off"
                    value={formData.Amount}
                    onKeyDown={handleKeyDownOther}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    error={Boolean(formErrors.Amount)}
                    helperText={formErrors.Amount || ""}
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
                  <label className="SugarPurchaseBilllabel">Vatav :</label>
                </Grid>
                <Grid item xs={12} sm={1}>
                  <TextField
                    variant="outlined"
                    fullWidth
                    name="Vatavrate"
                    autoComplete="off"
                    value={formData.Vatavrate}
                    onKeyDown={handleKeyDownOther}
                    onChange={handleChange}
                    disabled={(!isEditing && addOneButtonEnabled)}
                    error={Boolean(formErrors.Vatavrate)}
                    helperText={formErrors.Vatavrate || ""}
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
                    name="Vatavamt"
                    autoComplete="off"
                    value={formData.Vatavamt || 0}
                    onKeyDown={handleKeyDownOther}
                    onChange={handleChange}
                    disabled={(!isEditing && addOneButtonEnabled)}
                    error={Boolean(formErrors.Vatavamt)}
                    helperText={formErrors.Vatavamt || ""}
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
                    name="TCS_Par"
                    autoComplete="off"
                    value={formData.TCS_Par}
                    onKeyDown={handleKeyDownOther}
                    onChange={handleChange}
                    disabled={(!isEditing && addOneButtonEnabled)}
                    error={Boolean(formErrors.TCS_Par)}
                    helperText={formErrors.TCS_Par || ""}
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
                    value={formData.TCS_Amount || 0}
                    onKeyDown={handleKeyDownOther}
                    onChange={handleChange}
                    disabled={(!isEditing && addOneButtonEnabled)}
                    error={Boolean(formErrors.TCS_Amount)}
                    helperText={formErrors.TCS_Amount || ""}
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


            </Grid>
          </div>
        </form>
      </div>
    </>
  );
};
export default ShetkariPurchase;
