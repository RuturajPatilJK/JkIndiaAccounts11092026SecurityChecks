import React, { useState, useRef, useEffect } from "react";
import { TextField, Grid, InputLabel, FormControl, Select, MenuItem, FormControlLabel, Checkbox, TextareaAutosize, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import "bootstrap/dist/css/bootstrap.min.css";
import CloseIcon from '@mui/icons-material/Close';
import AccountMasterHelp from "../../../Helper/AccountMasterHelp";
import GSTRateMasterHelp from "../../../Helper/GSTRateMasterHelp";
import ItemMasterHelp from "../../../Helper/SystemmasterHelp";
import BrandMasterHelp from "../../../Helper/BrandMasterHelp";
import axios from "axios";
// import axios from '../../../api/axiosInstance';
import { useNavigate, useLocation } from "react-router-dom";
import ActionButtonGroup from "../../../Common/CommonButtons/ActionButtonGroup";
import NavigationButtons from "../../../Common/CommonButtons/NavigationButtons";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
// import SaleBillReport from './SaleBillReport'
import EWayBillReport from "../../../Common/EwaybillNEInvoice/Ewaybill/EwayBillPrint";
import { useRecordLocking } from '../../../hooks/useRecordLocking';
// import "./SaleBill.css"
import AddButton from "../../../Common/Buttons/AddButton";
import EditButton from "../../../Common/Buttons/EditButton";
import DeleteButton from "../../../Common/Buttons/DeleteButton";
import OpenButton from "../../../Common/Buttons/OpenButton";
import UserAuditInfo from "../../../Common/UserAuditInfo/UserAuditInfo";
import SaveUpdateSpinner from "../../../Common/Spinners/SaveUpdateSpinner";
import Swal from "sweetalert2";
import EwayBillGeneration from "../../../Common/EwaybillNEInvoice/Ewaybill/EwayBillGeneration";
import EInvoiceGeneration from "../../../Common/EwaybillNEInvoice/EInvoiceGenerationProcess/EInvoiceGeneration";
import DetailAddButtom from "../../../Common/Buttons/DetailAddButton";
import DetailCloseButton from "../../../Common/Buttons/DetailCloseButton";
import DetailUpdateButton from "../../../Common/Buttons/DetailUpdateButton";
import { OutwordPostDateRecordLock } from "../../../Common/PostDateLock/PostDateRangeCheck"
import { validateDocumentDate } from "../../../Common/ValidateDateRange/ValidateDateRange"
import formatTruckNumber from "../../../Common/FormatFunctions/FormatTruckNumber"
// import CustomizeSBReport from "./CustomizeSBReport";
import OtherCustomizeSBReport from "./OtherSaleBillReport";
// import CarporateSaleBillPrint from "./CarporateSaleBillPrint"
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";

//Global Variables
var newSaleid = "";
var partyName = "";
var partyCode = "";
var millName = "";
var millCode = "";
var unitName = "";
var unitCode = "";
var brokerName = "";
var brokerCode = "";
var itemName = "";
var item_Code = "";
var gstrate = "";
var gstRateCode = "";
var gstName = "";
var brandName = "";
var brandCode = "";
var transportName = "";
var transportCode = "";
var billToName = "";
var billToCode = "";
var selectedfilter = "";
var PartyMobNo = "";
var TransportMobNo = "";
var UnitMobNo = "";
var millgstno = "";
var newGodownCode = ''
var lblGodownName = ''


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

//API URL
const API_URL = process.env.REACT_APP_API;

const OtherSaleBill = () => {

  //GET Values from session
  const companyCode = sessionStorage.getItem("Company_Code");
  const Year_Code = sessionStorage.getItem("Year_Code");
  const Outword_Date = sessionStorage.getItem("Outword_Date")
  const Post_Date = sessionStorage.getItem("Post_Date")
  const username = sessionStorage.getItem("username");
  const TCSApplicable = sessionStorage.getItem("TCSApplicable");
  const User_Id = sessionStorage.getItem("User_ID");

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const navigatedRecord = searchParams.get('navigatedRecord');
  const permissions = location.state?.permissionsData;

  //State Management
  const [users, setUsers] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMode, setPopupMode] = useState("add");
  const [selectedUser, setSelectedUser] = useState({});
  const [deleteMode, setDeleteMode] = useState(false);
  const [itemCode, setItemCode] = useState("");
  const [item_Name, setItemName] = useState("");
  const [brand_code, setBrandCode] = useState("");
  const [brand_name, setBrandName] = useState("");
  const [itemCodeAccoid, setItemCodeAccoid] = useState("");
  const [formDataDetail, setFormDataDetail] = useState({
    narration: "",
    packing: 50,
    Quantal: 0.0,
    bags: 0,
    rate: 0.0,
    item_Amount: 0.0,
  });

  //Head Section State Managements
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
  const [isChecked, setIsChecked] = useState(false);
  const [gstNo, setGstNo] = useState("");
  const [isHandleChange, setIsHandleChange] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpenEInvoice, setIsOpenEInvoice] = useState(false);
  const [isOpenEwayBill, setIsOpenEwayBill] = useState(false);

  const [billToManuallySet, setBillToManuallySet] = useState(false);
  const [shipToManuallySet, setShipToManuallySet] = useState(false);
  const [bill_To_Name, setBillToName] = useState('')
  const [ship_To_Name, setShipToName] = useState('')


  const selectedRecord = location.state?.selectedRecord;
  const navigate = useNavigate();
  const inputRef = useRef(null)

  //SET Focus to the ADD Buttons.
  const addButtonRef = useRef(null);
  const firstInputRef = useRef(null);
  const setFocusToFirstField = () => {
    if (firstInputRef.current) {
      firstInputRef.current.focus();
    }
  };

  //Initial Formdata
  const initialFormData = {
    doc_no: "",
    PURCNO: 0,
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
    Tran_Type: 'SO',
    DO_No: 0,
    Transport_Code: "",
    RateDiff: 0,
    ASN_No: "",
    GstRateCode: "",
    CGSTRate: 0.0,
    CGSTAmount: 0.0,
    SGSTRate: 0.0,
    SGSTAmount: 0.0,
    IGSTRate: 0.0,
    IGSTAmount: 0.0,
    TaxableAmount: 0.0,
    EWay_Bill_No: "",
    EWayBill_Chk: "N",
    MillInvoiceNo: "",
    RoundOff: 0.0,
    ac: 0,
    uc: 0,
    mc: 0,
    bk: 0,
    tc: 0,
    Purcid: 0,
    DoNarrtion: "",
    TCS_Rate: 0.0,
    TCS_Amt: 0.0,
    TCS_Net_Payable: 0.0,
    saleidnew: 0,
    newsbno: 0,
    newsbdate: new Date().toISOString().split("T")[0],
    einvoiceno: "",
    ackno: "",
    Delivery_type: "",
    Bill_To: 0,
    bt: 0,
    EwayBillValidDate: new Date().toISOString().split("T")[0],
    IsDeleted: 1,
    TDS_Amt: 0.0,
    TDS_Rate: 0.0,
    SBNarration: "",
    QRCode: "",
    gstid: 0,
    Unit: "",
    godownCode: 0,
    godownId: 0
  };

  //ALL Help Section State managements
  const [formData, setFormData] = useState(initialFormData);
  const [billFrom, setBillFrom] = useState("");
  const [partyMobNo, setPartyMobNo] = useState("");
  const [billTo, setBillTo] = useState("");
  const [mill, setMill] = useState("");
  const [millname, setMillName] = useState("");
  const [millGSTNo, setMillGSTNo] = useState("");
  const [shipTo, setShipTo] = useState("");
  const [shipToMobNo, setShipToMobNo] = useState("");
  const [gstCode, setGstCode] = useState("");
  const [transport, setTransport] = useState("");
  const [transportMob, setTransportMob] = useState("");
  const [broker, setBroker] = useState("");
  const [GstRate, setGstRate] = useState(0.0);
  const [matchStatus, setMatchStatus] = useState(null);
  const [godown_Code, setGoDownCode] = useState('')
  const [godownId, setGodownId] = useState('')
  const [godownName, setGodownName] = useState('')


  // Manage the lock-unlock record at the same time multiple users edit the same record.
  const { isRecordLockedByUser, lockRecord, unlockRecord } = useRecordLocking(formData.doc_no, undefined, companyCode, Year_Code, "sugar_sale");

  //Validation Input feilds
  const validateNumericInput = (e) => {
    e.target.value = e.target.value.replace(/[^0-9.-]/g, '');
  };

  //Handle Records OnChange Method
  const handleChange = (event) => {
    const { name, value } = event.target;
    const updatedValue = name === "LORRYNO" ? formatTruckNumber(value) : value;
    setFormData((prevData) => ({
      ...prevData,
      [name]: updatedValue,
    }));
  };

  //Calculations on GST Rate Code
  const handleKeyDownCalculations = async (event) => {
    if (event.key === "Tab") {
      const { name, value } = event.target;
      const matchStatus = await checkMatchStatus(
        formData.Ac_Code,
        companyCode,
        Year_Code
      );
      let gstRate = GstRate;

      if (!gstRate || gstRate === 0) {
        const cgstRate = parseFloat(formData.CGSTRate) || 0;
        const sgstRate = parseFloat(formData.SGSTRate) || 0;
        const igstRate = parseFloat(formData.IGSTRate) || 0;
        gstRate = igstRate > 0 ? igstRate : cgstRate + sgstRate;
      }
      const updatedFormData = await calculateDependentValues(
        name,
        value,
        formData,
        matchStatus,
        gstRate
      );
      setFormData(updatedFormData);
    }
  };

  const handleOnChange = () => {
    setIsChecked((prev) => {
      const newValue = !prev;
      const value = newValue ? "Y" : "N";

      setFormData((prevData) => ({
        ...prevData,
        EWayBill_Chk: value,
      }));
      return newValue;
    });
  };

  //handle the Date OnChange Values
  const handleDateChange = (event, fieldName) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      [fieldName]: event.target.value,
    }));
  };

  useEffect(() => {
    if (isHandleChange) {
      handleCancel();
      setIsHandleChange(false);
    }
  }, []);

  //fetchLast Records to get the next doc no
  const fetchLastRecord = () => {
    fetch(
      `${API_URL}/get-nextother-doc-no?Company_Code=${companyCode}&Year_Code=${Year_Code}&Tran_Type=${formData.Tran_Type}`
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch last record");
        }
        return response.json();
      })
      .then((data) => {
        const newDocNo = data.next_doc_no;
        setFormData((prevState) => ({
          ...prevState,
          doc_no: newDocNo,
        }));
      })
      .catch((error) => {
        console.error("Error fetching last record:", error);
      });
  };

  //handle record Add.
  const handleAddOne = async () => {
    setAddOneButtonEnabled(false);
    setSaveButtonEnabled(true);
    setCancelButtonEnabled(true);
    setEditButtonEnabled(false);
    setDeleteButtonEnabled(false);
    setIsEditMode(false);
    setIsEditing(true);
    fetchLastRecord();
    setFormData(initialFormData);
    partyName = "";
    partyCode = "";
    millName = "";
    millCode = "";
    unitName = "";
    unitCode = "";
    brokerName = "";
    brokerCode = "";
    itemName = "";
    item_Code = "";
    gstrate = "";
    gstRateCode = "";
    brandName = "";
    brandCode = "";
    transportName = "";
    transportCode = "";
    billToName = "";
    billToCode = "";
    gstName = "";
    newGodownCode = '';
    lblGodownName = '';
    setLastTenderDetails([]);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  //handle Edit record functionality.
  const handleEdit = async () => {
    const Post_Date = sessionStorage.getItem("Post_Date");
    const Outword_Date = sessionStorage.getItem("Outword_Date")
    if (await OutwordPostDateRecordLock(formData.doc_date, Post_Date, Outword_Date)) {
      return;
    }

    if (
      (formData.einvoiceno && formData.einvoiceno.trim() !== "" && formData.ackno && formData.ackno.trim() !== "") ||
      (formData.EWay_Bill_No && formData.EWay_Bill_No.trim() !== "")
    ) {
      let message = "";

      if (formData.einvoiceno && formData.einvoiceno.trim() !== "" && formData.ackno && formData.ackno.trim() !== "") {
        message += "E-Invoice has already been generated for this record.";
      }

      if (formData.EWay_Bill_No && formData.EWay_Bill_No.trim() !== "") {
        message += (message ? "\n" : "") + "E-WayBill has already been generated for this record.";
      }

      Swal.fire({
        icon: "warning",
        text: message,
        confirmButtonColor: "#d33",
      });

    }

    axios.get(`${API_URL}/otherSaleBillByid?saleid=${formData.saleid}&Company_Code=${companyCode}&Year_Code=${Year_Code}`)
      .then((response) => {
        const data = response.data;
        const isLockedNew = data.last_head_data.LockedRecord;
        const isLockedByUserNew = data.last_head_data.LockedUser;

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
          ...data.last_head_data
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
        window.alert("This record is already deleted! Showing the previous record.");
      });
  };

  // Record save and update functionality
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

    let missingFields = [];
    // if (!formData.GstRateCode) missingFields.push("GST Code");
    if (formData.GstRateCode === "" || formData.GstRateCode === null || formData.GstRateCode === undefined) {
      missingFields.push("GST Code");
    }
    if (!formData.Ac_Code) missingFields.push("Bill From");
    if (!formData.Bill_To) missingFields.push("Bill To");
    if (!formData.Unit_Code) missingFields.push("Ship To");
    if (!formData.mill_code) missingFields.push("Mill Name");

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
      GstRateCode: gstCode || gstRateCode,
      RateDiff: formData.RateDiff || 0,
      Tran_Type: "SO",
      ...(isEditMode
        ? {
          Modified_By: username,
          User_Id: User_Id
        }
        : {
          Created_By: username
        }
      )
    };
    delete headData[""];
    delete headData.RateDiffAmount
    if (isEditMode) {
      delete headData.saleid;
      // headData.Modified_By = username
      // headData.User_Id = User_Id
    } else {
      // headData.Created_By = username;
    }
    const detailData = users.map((user) => ({
      rowaction: user.rowaction,
      saledetailid: user.saledetailid,
      item_code: user.item_code,
      Quantal: user.Quantal,
      ic: user.ic,
      detail_id: 1,
      Company_Code: companyCode,
      Year_Code: Year_Code,
      Tran_Type: user.Tran_Type,
      narration: user.narration,
      packing: user.packing,
      bags: user.bags,
      rate: user.rate,
      item_Amount: user.item_Amount,
      Brand_Code: user.Brand_Code,
    }));

    const requestData = {
      headData,
      detailData,
    };

    try {
      if (isEditMode) {
        const updateApiUrl = `${API_URL}/update-otherSaleBill?saleid=${newSaleid}`;
        const response = await axios.put(updateApiUrl, requestData);

        unlockRecord();
        Swal.fire({
          title: "Success!",
          text: "Record updated successfully!",
          icon: "success",
          confirmButtonText: "OK"
        });

        setTimeout(() => {
          window.onbeforeunload = null;
          window.location.reload();
        }, 1000);
        navigate(`/othersale-bill?navigatedRecord=${formData.doc_no}`);
      } else {
        const response = await axios.post(
          `${API_URL}/insert-otherSaleBill`,
          requestData
        );
        Swal.fire({
          title: "Success!",
          text: "Record saved successfully!",
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
        setIsEditing(true);

        setTimeout(() => {
          window.location.reload();
        }, 1000);
        navigate(`/othersale-bill?navigatedRecord=${formData.doc_no}`);
      }
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
    const Outword_Date = sessionStorage.getItem("Outword_Date")
    if (await OutwordPostDateRecordLock(formData.doc_date, Post_Date, Outword_Date)) {
      return;
    }

    if (parseInt(formData.DO_No) !== 0) {
      Swal.fire({
        title: "Error",
        text: `Couldn't delete this record it is currently referenced in DO No. ${formData.DO_No}`.trim(),
        icon: "error",
        confirmButtonText: "OK"
      });
      return;
    }

    if (parseInt(formData.einvoiceno) !== "" && formData.ackno !== "") {
      Swal.fire({
        icon: "warning",
        text: "E-Invoice has already been generated for this record.Cannot Delete.",
        confirmButtonColor: "#d33",
      });
      return
    }

    if (formData.EWay_Bill_No !== "") {
      Swal.fire({
        icon: "warning",
        text: "E-WayBill has already been generated for this record.Cannot Delete.",
        confirmButtonColor: "#d33",
      });
      return
    }

    try {
      const response = await axios.get(
        `${API_URL}/otherSaleBillByid?saleid=${newSaleid}&Company_Code=${companyCode}&Year_Code=${Year_Code}`
      );

      const data = response.data;
      const isLockedNew = data.last_head_data.LockedRecord;
      const isLockedByUserNew = data.last_head_data.LockedUser;

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
        text: `Do you really want to delete this Doc No: ${formData.doc_no}?`,
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

        const deleteApiUrl = `${API_URL}/delete_otherdata_by_saleid?saleid=${newSaleid}&Company_Code=${companyCode}&doc_no=${formData.doc_no}&Year_Code=${Year_Code}&User_Id=${User_Id}&Tran_Type=${formData.Tran_Type}`;
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


  //Common Feilds that we haev to set the record on the navigations.
  const NavigationSetFields = (headData, detailData) => {
    const details = detailData[0];
    newSaleid = headData.saleid;
    partyName = details.partyname;
    partyCode = headData.Ac_Code;
    unitName = details.unitname;
    unitCode = details.unitaccode;
    billToName = details.billtoname;
    billToCode = headData.Bill_To;
    gstrate = details.gstrate;
    gstRateCode = headData.GstRateCode;
    millName = details.millname;
    millCode = headData.mill_code;
    itemName = details.itemname;
    item_Code = details.System_Code;
    brandName = details.brandname;
    brandCode = details.brandocno;
    brokerCode = details.brokeraccode;
    brokerName = details.brokername;
    transportCode = details.transportaccode;
    transportName = details.transportname;
    millgstno = details.MillGSTNo;
    gstName = details.GSTName;
    lblGodownName = details.godownName;
    newGodownCode = headData.godownCode;

    setFormData((prevData) => ({
      ...prevData,
      ...headData,
    }));

    setLastTenderData(headData || {});
    setLastTenderDetails(detailData || []);
  };

  // handle cancel get last record data and set to
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
      const response = await axios.get(
        `${API_URL}/get-lastotherSaleBill-navigation?Company_Code=${companyCode}&Year_Code=${Year_Code}&Tran_Type=${formData.Tran_Type}`
      );
      if (response.status === 200) {
        const data = response.data;
        NavigationSetFields(data.last_head_data, data.last_details_data);
        setIsChecked(true);
        unlockRecord();
      } else {
        console.error(
          "Failed to fetch last data:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error during API call:", error);
    }
  };

  // handle back button to navigate to the dashboard page.
  const handleBack = () => {
    navigate("/OtherSaleBill-utility");
  };

  // Navigation Funtionality 
  const handleFirstButtonClick = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/get-firstotherSaleBill-navigation?Company_Code=${companyCode}&Year_Code=${Year_Code}&Tran_Type=${formData.Tran_Type}`
      );
      if (response.status === 200) {
        const data = response.data;
        NavigationSetFields(data.first_head_data, data.first_details_data);
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
        `${API_URL}/get-lastotherSaleBill-navigation?Company_Code=${companyCode}&Year_Code=${Year_Code}&Tran_Type=${formData.Tran_Type}`
      );
      if (response.status === 200) {
        const data = response.data;
        NavigationSetFields(data.last_head_data, data.last_details_data);
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
        `${API_URL}/get-nextotherSaleBill-navigation?Company_Code=${companyCode}&Year_Code=${Year_Code}&currentDocNo=${formData.doc_no}&Tran_Type=${formData.Tran_Type}`
      );
      if (response.status === 200) {
        const data = response.data;
        NavigationSetFields(data.next_head_data, data.next_details_data);
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
        `${API_URL}/get-previousotherSaleBill-navigation?Company_Code=${companyCode}&Year_Code=${Year_Code}&currentDocNo=${formData.doc_no}&Tran_Type=${formData.Tran_Type}`
      );

      if (response.status === 200) {
        const data = response.data;
        NavigationSetFields(data.previous_head_data, data.previous_details_data);
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
        `${API_URL}/otherSaleBillByid?saleid=${selectedRecord.saleid}&Company_Code=${companyCode}&Year_Code=${Year_Code}`
      );
      if (response.status === 200) {
        const data = response.data;

        newSaleid = data.last_head_data.saleid;
        partyName = data.last_details_data[0].partyname;
        partyCode = data.last_head_data.Ac_Code;
        unitName = data.last_details_data[0].unitname;
        unitCode = data.last_details_data[0].unitaccode;
        billToName = data.last_details_data[0].billtoname;
        billToCode = data.last_head_data.Bill_To;
        gstrate = data.last_details_data[0].gstrate;
        gstRateCode = data.last_head_data.GstRateCode;
        millName = data.last_details_data[0].millname;
        millCode = data.last_head_data.mill_code;
        itemName = data.last_details_data[0].itemname;
        item_Code = data.last_details_data[0].System_Code;
        brandName = data.last_details_data[0].brandName;
        brandCode = data.last_details_data[0].brandCode;
        brokerCode = data.last_head_data.BROKER;
        brokerName = data.last_details_data[0].brokername;
        transportCode = data.last_details_data[0].transportaccode;
        transportName = data.last_details_data[0].transportname;
        millgstno = data.last_details_data[0].MillGSTNo;
        gstName = data.last_details_data[0].GSTName;
        lblGodownName = data.last_details_data[0].godownName;
        newGodownCode = data.last_head_data.godownCode;
        setFormData((prevData) => ({
          ...prevData,
          ...data.last_head_data,
        }));
        setLastTenderData(data.last_head_data || {});
        setLastTenderDetails(data.last_details_data || []);
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
        `${API_URL}/otherSaleBillByDocNo?doc_no=${navigatedRecord}&Company_Code=${companyCode}&Year_Code=${Year_Code}&Tran_Type=${formData.Tran_Type}`
      );
      if (response.status === 200) {
        const data = response.data;

        newSaleid = data.last_head_data.saleid;
        partyName = data.last_details_data[0].partyname;
        partyCode = data.last_head_data.Ac_Code;
        unitName = data.last_details_data[0].unitname;
        unitCode = data.last_details_data[0].unitaccode;
        billToName = data.last_details_data[0].billtoname;
        billToCode = data.last_head_data.Bill_To;
        gstrate = data.last_details_data[0].gstrate;
        gstRateCode = data.last_head_data.GstRateCode;
        millName = data.last_details_data[0].millname;
        millCode = data.last_head_data.mill_code;
        itemName = data.last_details_data[0].itemname;
        item_Code = data.last_details_data[0].System_Code;
        brandName = data.last_details_data[0].brandName;
        brandCode = data.last_details_data[0].brandCode;
        brokerCode = data.last_head_data.BROKER;
        brokerName = data.last_details_data[0].brokername;
        transportCode = data.last_details_data[0].transportaccode;
        transportName = data.last_details_data[0].transportname;
        millgstno = data.last_details_data[0].MillGSTNo;
        gstName = data.last_details_data[0].GSTName;
        lblGodownName = data.last_details_data[0].godownName;
        newGodownCode = data.last_head_data.godownCode;
        setFormData((prevData) => ({
          ...prevData,
          ...data.last_head_data,
        }));
        setLastTenderData(data.last_head_data || {});
        setLastTenderDetails(data.last_details_data || []);
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

  const handleKeyDown = async (event) => {
    if (event.key === "Tab") {
      const changeNoValue = event.target.value;
      try {
        const response = await axios.get(
          `${API_URL}/otherSaleBillByDocNo?doc_no=${changeNoValue}&Company_Code=${companyCode}&Year_Code=${Year_Code}&Tran_Type=${formData.Tran_Type}`
        );
        const data = response.data;
        // newSaleid = data.last_head_data.saleid;
        partyName = data.last_details_data[0].partyname;
        partyCode = data.last_head_data.Ac_Code;
        unitName = data.last_details_data[0].unitname;
        unitCode = data.last_details_data[0].unitaccode;
        billToName = data.last_details_data[0].billtoname;
        billToCode = data.last_head_data.Bill_To;
        gstrate = data.last_details_data[0].gstrate;
        gstRateCode = data.last_head_data.GstRateCode;
        millName = data.last_details_data[0].millname;
        millCode = data.last_head_data.mill_code;
        itemName = data.last_details_data[0].itemname;
        item_Code = data.last_details_data[0].System_Code;
        brandName = data.last_details_data[0].brandname;
        brandCode = data.last_details_data[0].brandCode;
        brokerCode = data.last_head_data.BROKER;
        brokerName = data.last_details_data[0].brokername;
        transportCode = data.last_details_data[0].transportaccode;
        transportName = data.last_details_data[0].transportname;
        millgstno = data.last_details_data[0].MillGSTNo;
        lblGodownName = data.last_details_data[0].godownName;
        newGodownCode = data.last_head_data.godownCode;

        setFormData({
          ...formData,
          ...data.last_head_data,
        });
        setLastTenderData(data.last_head_data || {});
        setLastTenderDetails(data.last_details_data || []);
        setIsEditing(false);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }
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

  useEffect(() => {
    if (!isChecked) {
      fetchCompanyGSTCode(companyCode);
    }
  }, [isChecked, companyCode]);

  const fetchCompanyGSTCode = async (company_code) => {
    try {
      const { data } = await axios.get(
        `${API_URL}/get_company_by_code?company_code=${company_code}`
      );
      setGstNo(data.GST);
    } catch (error) {
      console.error("Error:", error);
      setGstNo("");
    }
  };

  const calculateTotalItemAmount = (users) => {
    return users
      .filter((user) => user.rowaction !== "delete" && user.rowaction !== "DNU")
      .reduce((sum, user) => sum + parseFloat(user.item_Amount || 0), 0);
  };

  const calculateRateDiffAmount = () => {
    const NETQNTL = Number(formData.NETQNTL);
    const RateDiff = Number(formData.RateDiff);
    return !isNaN(NETQNTL) && !isNaN(RateDiff) ? NETQNTL * RateDiff : 0;
  };

  const calculateDependentValues = async (
    name,
    input,
    formData,
    matchStatus,
    gstRate
  ) => {
    const updatedFormData = { ...formData, [name]: input };
    const subtotal = parseFloat(updatedFormData.subTotal) || 0.0;

    const rate = gstRate;

    const netQntl = parseFloat(updatedFormData.NETQNTL) || 0.0;
    const freightRate = parseFloat(updatedFormData.LESS_FRT_RATE) || 0.0;

    updatedFormData.freight = netQntl * freightRate;

    updatedFormData.TaxableAmount = updatedFormData.freight + subtotal;

    if (matchStatus === "TRUE") {
      updatedFormData.CGSTRate = (rate / 2).toFixed(2);
      updatedFormData.SGSTRate = (rate / 2).toFixed(2);
      updatedFormData.IGSTRate = 0.0;

      updatedFormData.CGSTAmount = (
        (updatedFormData.TaxableAmount * updatedFormData.CGSTRate) /
        100
      ).toFixed(2);
      updatedFormData.SGSTAmount = (
        (updatedFormData.TaxableAmount * updatedFormData.SGSTRate) /
        100
      ).toFixed(2);
      updatedFormData.IGSTAmount = 0.0;
    } else {
      updatedFormData.IGSTRate = rate.toFixed(2);
      updatedFormData.CGSTRate = 0.0;
      updatedFormData.SGSTRate = 0.0;

      updatedFormData.IGSTAmount = (
        (updatedFormData.TaxableAmount * updatedFormData.IGSTRate) /
        100
      ).toFixed(2);
      updatedFormData.CGSTAmount = 0.0;
      updatedFormData.SGSTAmount = 0.0;
    }

    const RateDiffAmt = updatedFormData.RateDiff * updatedFormData.NETQNTL;

    const RoundOff = parseFloat(updatedFormData.RoundOff) || 0.0;

    const cashAdvance = parseFloat(updatedFormData.cash_advance) || 0.0;

    const miscAmount = parseFloat(updatedFormData.OTHER_AMT) || 0.0;
    updatedFormData.Bill_Amount = (
      updatedFormData.TaxableAmount +
      parseFloat(updatedFormData.CGSTAmount) +
      parseFloat(updatedFormData.SGSTAmount) +
      parseFloat(updatedFormData.IGSTAmount) +
      miscAmount +
      RateDiffAmt +
      RoundOff +
      cashAdvance
    ).toFixed(2);

    const tcsRate = parseFloat(updatedFormData.TCS_Rate) || 0.0;
    updatedFormData.TCS_Amt = (
      (updatedFormData.Bill_Amount * tcsRate) /
      100
    ).toFixed(2);
    updatedFormData.TCS_Net_Payable = (
      parseFloat(updatedFormData.Bill_Amount) +
      parseFloat(updatedFormData.TCS_Amt)
    ).toFixed(2);

    const tdsRate = parseFloat(updatedFormData.TDS_Rate) || 0.0;
    updatedFormData.TDS_Amt = (
      (updatedFormData.TaxableAmount * tdsRate) /
      100
    ).toFixed(2);
    updatedFormData.TCS_Rate = tcsRate;
    updatedFormData.TDS_Rate = tdsRate;
    return updatedFormData;
  };

  //-------------------------------------------- Detail Section Start ----------------------------------------------------
  useEffect(() => {
    if (selectedRecord) {
      setUsers(
        lastTenderDetails.map((detail) => ({
          item_code: detail.item_code,
          item_Name: detail.item_Name,
          rowaction: "Normal",
          Brand_Code: detail.Brand_Code,
          brand_name: detail.brand_name,
          ic: detail.ic,
          id: detail.saledetailid,
          saledetailid: detail.saledetailid,
          narration: detail.narration,
          Quantal: detail.Quantal,
          bags: detail.bags,
          packing: detail.packing,
          rate: detail.rate,
          item_Amount: detail.item_Amount,
        }))
      );
    }
  }, [selectedRecord, lastTenderDetails]);

  useEffect(() => {
    const updatedUsers = lastTenderDetails.map((detail) => ({
      item_code: detail.item_code,
      item_Name: detail.itemname,
      rowaction: "Normal",
      Brand_Code: detail.Brand_Code,
      brand_name: detail.brandname,
      ic: detail.ic,
      id: detail.saledetailid,
      saledetailid: detail.saledetailid,
      narration: detail.narration,
      Quantal: detail.Quantal,
      bags: detail.bags,
      packing: detail.packing,
      rate: detail.rate,
      item_Amount: detail.item_Amount,
    }));
    setUsers(updatedUsers);
  }, [lastTenderDetails]);

  const calculateDetails = (quantal, packing, rate) => {
    const bags = packing !== 0 ? (quantal / packing) * 100 : 0;
    const item_Amount = quantal * rate;
    return { bags, item_Amount };
  };

  const calculateNetQuantal = (users) => {
    return users
      .filter((user) => user.rowaction !== "delete" && user.rowaction !== "DNU")
      .reduce((sum, user) => sum + parseFloat(user.Quantal || 0), 0);
  };

  const handleChangeDetail = (event) => {
    const { name, value } = event.target;
    setFormDataDetail((prevDetail) => {
      const updatedDetail = {
        ...prevDetail,
        [name]:
          name === "packing" || name === "bags"
            ? parseInt(value) || 0
            : parseFloat(value) || value,
      };

      const { Quantal, packing, rate } = updatedDetail;
      const { bags, item_Amount } = calculateDetails(Quantal, packing, rate);

      updatedDetail.bags = bags;
      updatedDetail.item_Amount = item_Amount;

      return updatedDetail;
    });
  };

  const addUser = async () => {
    if (itemCode === "") {
      Swal.fire({
        icon: "warning",
        text: "Please Select Item.",
        confirmButtonColor: "#d33",
      });
      return false;
    }
    const newUser = {
      id: users.length > 0 ? Math.max(...users.map((user) => user.id)) + 1 : 1,
      item_code: itemCode,
      item_Name: item_Name,
      ic: itemCodeAccoid,
      Brand_Code: brand_code,
      brand_name: brand_name,
      ...formDataDetail,
      rowaction: "add",
    };

    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);

    const netQuantal = calculateNetQuantal(updatedUsers);

    const subtotal = calculateTotalItemAmount(updatedUsers);
    let updatedFormData = {
      ...formData,
      NETQNTL: netQuantal,
      subTotal: subtotal,
    };

    const matchStatus = await checkMatchStatus(
      updatedFormData.Ac_Code,
      companyCode,
      Year_Code
    );
    let gstRate = GstRate;
    if (!gstRate || gstRate === 0) {
      const cgstRate = parseFloat(formData.CGSTRate) || 0;
      const sgstRate = parseFloat(formData.SGSTRate) || 0;
      const igstRate = parseFloat(formData.IGSTRate) || 0;

      gstRate = igstRate > 0 ? igstRate : cgstRate + sgstRate;
    }

    updatedFormData = await calculateDependentValues(
      "GstRateCode",
      gstRate,
      updatedFormData,
      matchStatus,
      gstRate
    );

    setFormData(updatedFormData);
    closePopup();
  };

  const updateUser = async () => {
    const updatedUsers = users.map((user) => {
      if (user.id === selectedUser.id) {
        const updatedRowaction =
          user.rowaction === "Normal" ? "update" : user.rowaction;
        return {
          ...user,
          Brand_Code: brand_code,
          brand_name: brand_name,
          item_code: itemCode,
          item_Name: item_Name,
          packing: formDataDetail.packing,
          bags: formDataDetail.bags,
          Quantal: formDataDetail.Quantal,
          rate: formDataDetail.rate,
          item_Amount: formDataDetail.item_Amount,
          narration: formDataDetail.narration,
          rowaction: updatedRowaction,
        };
      } else {
        return user;
      }
    });

    setUsers(updatedUsers);

    const netQuantal = calculateNetQuantal(updatedUsers);

    const subtotal = calculateTotalItemAmount(updatedUsers);

    let updatedFormData = {
      ...formData,
      NETQNTL: netQuantal,
      subTotal: subtotal,
    };
    const matchStatus = await checkMatchStatus(
      updatedFormData.Ac_Code,
      companyCode,
      Year_Code
    );

    let gstRate = GstRate;
    if (!gstRate || gstRate === 0) {
      const cgstRate = parseFloat(formData.CGSTRate) || 0;
      const sgstRate = parseFloat(formData.SGSTRate) || 0;
      const igstRate = parseFloat(formData.IGSTRate) || 0;

      gstRate = igstRate > 0 ? igstRate : cgstRate + sgstRate;
    }

    updatedFormData = await calculateDependentValues(
      "GstRateCode",
      gstRate,
      updatedFormData,
      matchStatus,
      gstRate
    );

    setFormData(updatedFormData);
    closePopup();
  };

  const deleteModeHandler = async (user) => {
    let updatedUsers;
    if (isEditMode && user.rowaction === "add") {
      setDeleteMode(true);
      setSelectedUser(user);
      updatedUsers = users.map((u) =>
        u.id === user.id ? { ...u, rowaction: "DNU" } : u
      );
    } else if (isEditMode) {
      setDeleteMode(true);
      setSelectedUser(user);
      updatedUsers = users.map((u) =>
        u.id === user.id ? { ...u, rowaction: "delete" } : u
      );
    } else {
      setDeleteMode(true);
      setSelectedUser(user);
      updatedUsers = users.map((u) =>
        u.id === user.id ? { ...u, rowaction: "DNU" } : u
      );
    }
    setUsers(updatedUsers);
    setSelectedUser({});

    const netQuantal = calculateNetQuantal(updatedUsers);

    const subtotal = calculateTotalItemAmount(updatedUsers);
    let updatedFormData = {
      ...formData,
      NETQNTL: netQuantal,
      subTotal: subtotal,
    };

    const matchStatus = await checkMatchStatus(
      updatedFormData.Ac_Code,
      companyCode,
      Year_Code
    );

    let gstRate = GstRate;
    if (!gstRate || gstRate === 0) {
      const cgstRate = parseFloat(formData.CGSTRate) || 0;
      const sgstRate = parseFloat(formData.SGSTRate) || 0;
      const igstRate = parseFloat(formData.IGSTRate) || 0;

      gstRate = igstRate > 0 ? igstRate : cgstRate + sgstRate;
    }

    updatedFormData = await calculateDependentValues(
      "GstRateCode",
      gstRate,
      updatedFormData,
      matchStatus,
      gstRate
    );
    setFormData(updatedFormData);
  };

  const openDelete = async (user) => {
    setDeleteMode(true);
    setSelectedUser(user);
    let updatedUsers;
    if (isEditMode && user.rowaction === "delete") {
      updatedUsers = users.map((u) =>
        u.id === user.id ? { ...u, rowaction: "Normal" } : u
      );
    } else {
      updatedUsers = users.map((u) =>
        u.id === user.id ? { ...u, rowaction: "add" } : u
      );
    }
    setUsers(updatedUsers);
    setSelectedUser({});

    const netQuantal = calculateNetQuantal(updatedUsers);

    const subtotal = calculateTotalItemAmount(updatedUsers);
    let updatedFormData = {
      ...formData,
      NETQNTL: netQuantal,
      subTotal: subtotal,
    };

    const matchStatus = await checkMatchStatus(
      updatedFormData.Ac_Code,
      companyCode,
      Year_Code
    );

    let gstRate = GstRate;
    if (!gstRate || gstRate === 0) {
      const cgstRate = parseFloat(formData.CGSTRate) || 0;
      const sgstRate = parseFloat(formData.SGSTRate) || 0;
      const igstRate = parseFloat(formData.IGSTRate) || 0;

      gstRate = igstRate > 0 ? igstRate : cgstRate + sgstRate;
    }

    updatedFormData = await calculateDependentValues(
      "GstRateCode",
      gstRate,
      updatedFormData,
      matchStatus,
      gstRate
    );

    setFormData(updatedFormData);
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
    setFormDataDetail({
      narration: "",
      packing: 50 || 0,
      Quantal: 0.0,
      bags: 0,
      rate: 0.0,
      item_Amount: 0.0,
    });
    setItemCode("");
    setItemName("");
    setBrandCode("");
    setBrandName("");
  };

  const editUser = (user) => {
    setSelectedUser(user);
    setItemCode(user.item_code);
    setItemName(user.item_Name);
    setBrandCode(user.Brand_Code);
    setBrandName(user.brand_name);
    setFormDataDetail({
      narration: user.narration || "",
      packing: user.packing || 0,
      Quantal: user.Quantal || 0.0,
      bags: user.bags || 0,
      rate: user.rate || 0.0,
      item_Amount: user.item_Amount || 0.0,
    });
    openPopup("edit");
  };

  const handleItemCode = (code, accoid, hsn, name) => {
    setItemCode(code);
    setItemName(name);
    setItemCodeAccoid(accoid);
  };

  const handleBrandCode = (code, name) => {
    setBrandCode(code);
    setBrandName(name);
  };

  //TDS Amount Calculation.
  const AmountCalculation = async (name, input, formData) => {
    formData = {
      ...formData,
      TCS_Rate: 0.00,
      TDS_Rate: 0.00,
      TDS_Amt: 0.00,
      TCS_Amt: 0.00
    }

    let updatedFormData = { ...formData, [name]: input };
    let Ac_Code = input;
    const updateApiUrl = `${API_URL}/getAmountcalculationDataForOutword?CompanyCode=${companyCode}&Ac_Code=${Ac_Code}&Year_Code=${Year_Code}`;

    const response = await axios.get(updateApiUrl);
    const details = response.data;
    let balancelimit = details['Balancelimt']
    let TDSApplicable = details['SaleTDSApplicable_Data']
    let SBAmt = 0.00;
    let SBBalAmt = 0.00;
    // let PSRate = parseFloat(updatedFormData.PurchaseRate) || 0.00;
    let SBAmountf = 0.00;
    let SBAmount = 0.00;
    let SaleTDSRate = details['SaleTDSRate']
    let TCSRate = TCSApplicable === 'Y' ? details['TCSRate'] : 0.00;
    SBBalAmt = formData.TaxableAmount;
    SBAmountf = details['SBAmt']
    if (SBAmountf == 0) {
      SBAmountf = 0.00
    }
    SBAmount = SBAmountf + SBBalAmt;

    if (SBAmount >= balancelimit) {
      if (TDSApplicable === 'Y') {
        updatedFormData.TDS_Rate = SaleTDSRate;
        updatedFormData.TCS_Rate = 0.00;
        const tdsAmount = ((SBBalAmt * SaleTDSRate) / 100).toFixed(2);
        updatedFormData.TDS_Amt = tdsAmount;
      }
      else {
        updatedFormData.TDS_Rate = 0.00;
        updatedFormData.TCS_Rate = TCSRate
        const tcsAmount = (
          ((parseFloat(formData.Bill_Amount) || 0) * TCSRate) /
          100
        ).toFixed(2);
        updatedFormData.TCS_Amt = tcsAmount;
      }
    }
    else {
      updatedFormData.TDS_Rate = 0.00;
      updatedFormData.TCS_Rate = TCSRate
      const tcsAmount = (
        ((parseFloat(formData.Bill_Amount) || 0) * TCSRate) /
        100
      ).toFixed(2);
      updatedFormData.TCS_Amt = tcsAmount;
    }


    setFormData((prevFormData) => ({
      ...prevFormData,
      ...updatedFormData

    }));
    return updatedFormData;
  }


  //Head Section help Functions to manage the Ac_Code and accoid
  const handleBillFrom = async (code, accoid, Name, Mobile_No, Gst_No, TDSApplicable, GSTStateCode, cityname) => {
    setBillFrom(code);
    setPartyMobNo(Mobile_No);
    let updatedFormData = {
      ...formData,
      Ac_Code: code,
      ac: accoid,
      TO_STATION: cityname
    };
    try {
      const matchStatusResult = await checkMatchStatus(
        code,
        companyCode,
        Year_Code
      );
      setMatchStatus(matchStatusResult);
      let gstRate = GstRate;

      if (!gstRate || gstRate === 0) {
        const cgstRate = parseFloat(formData.CGSTRate) || 0;
        const sgstRate = parseFloat(formData.SGSTRate) || 0;
        const igstRate = parseFloat(formData.IGSTRate) || 0;

        gstRate = igstRate > 0 ? igstRate : cgstRate + sgstRate;
      }
      updatedFormData = await calculateDependentValues(
        "GstRateCode",
        GstRate,
        updatedFormData,
        matchStatusResult,
        gstRate
      );
      const name = formData?.name || "";
      const value = formData?.value || "";
      let TDSTCSData = ''
      if (code !== '') {
        if (!isEditMode) {
          TDSTCSData = await AmountCalculation(name, code, updatedFormData);
        }
      }
      if (!billToManuallySet) {
        setBillTo(code);
        billToName = Name;
        billToCode = code;

        updatedFormData.Bill_To = code;
        updatedFormData.bt = accoid;
      }

      if (!shipToManuallySet) {
        setShipTo(code);
        setShipToName(Name);
        setShipToMobNo(Mobile_No);
        unitCode = code;
        unitName = Name;

        updatedFormData.Unit_Code = code;
        updatedFormData.uc = accoid;
      }

      setFormData(updatedFormData, TDSTCSData);

    } catch (error) {
      console.error("Error in handleBillFrom:", error);
    }
  };

  const handleBillTo = (code, accoid) => {
    setBillToManuallySet(true)
    setBillTo(code);
    setFormData({
      ...formData,
      Bill_To: code,
      bt: accoid,
    });
  };

  const handleMillData = (code, accoid, Name, Mobile_No, Gst_No, TDSApplicable, GSTStateCode, cityname) => {
    setMill(code);
    setMillName(Name);
    setMillGSTNo(Gst_No);
    setFormData({
      ...formData,
      mill_code: code,
      mc: accoid,
      FROM_STATION: cityname
    });
  };

  const handleShipTo = (code, accoid, name, Mobile_No) => {
    setShipToManuallySet(true)
    setShipTo(code);
    setShipToMobNo(Mobile_No);
    setFormData({
      ...formData,
      Unit_Code: code,
      uc: accoid,
    });
  };


  const handleGstCode = async (code, Rate, name, gstId) => {
    setGstCode(code);
    const rate = parseFloat(Rate);
    setGstRate(rate);

    const updatedFormData = {
      ...formData,
      GstRateCode: code,
      gstid: gstId
    };

    try {
      const matchStatusResult = await checkMatchStatus(
        updatedFormData.Ac_Code,
        companyCode,
        Year_Code
      );
      setMatchStatus(matchStatusResult);

      const finalCalculatedData = await calculateDependentValues(
        "GstRateCode",
        rate,
        updatedFormData,
        matchStatusResult,
        rate
      );
      setFormData(finalCalculatedData);

    } catch (error) {
      console.error("Error in GST Code selection:", error);
    }
  };


  const handleGoDown = (code, accoid, name) => {
    setGoDownCode(code);
    setGodownId(accoid);
    setGodownName(name);
    setFormData({
      ...formData,
      godownCode: code,
      godownId: accoid,
    });
  };

  const handleTransport = (code, accoid, name, mobileNo) => {
    setTransport(code);
    setTransportMob(mobileNo);
    setFormData({
      ...formData,
      Transport_Code: code,
      tc: accoid,
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

  //WayBill and EInvoice Generation
  const handleGenerateEInvoice = () => {
  
    setIsOpenEInvoice(true);
  };

  const handleCloseEInvoice = () => {
    setIsOpenEInvoice(false);
  };

  const handleGenerateEwayBill = () => {
   
    setIsOpenEwayBill(true);
  };

  const handleCloseEwayBill = () => {
    setIsOpenEwayBill(false);
  };



  const handleKeyDownRef = async (event) => {
    if (event.key === "Tab") {
      const changeNoValue = event.target.value;
      try {
        const response = await axios.get(
          `${API_URL}/otherSaleBillByDocNo?doc_no=${changeNoValue}&Company_Code=${companyCode}&Year_Code=${Year_Code}&Tran_Type=${formData.Tran_Type}`
        );
        const data = response.data;

        partyName = data.last_details_data[0].partyname;
        partyCode = data.last_head_data.Ac_Code;
        unitName = data.last_details_data[0].unitname;
        unitCode = data.last_details_data[0].unitaccode;
        billToName = data.last_details_data[0].billtoname;
        billToCode = data.last_head_data.Bill_To;
        gstrate = data.last_details_data[0].gstrate;
        gstRateCode = data.last_head_data.GstRateCode;
        millName = data.last_details_data[0].millname;
        millCode = data.last_head_data.mill_code;
        itemName = data.last_details_data[0].itemname;
        item_Code = data.last_details_data[0].System_Code;
        brandName = data.last_details_data[0].brandname;
        brandCode = data.last_details_data[0].brandCode;
        brokerCode = data.last_head_data.BROKER;
        brokerName = data.last_details_data[0].brokername;
        transportCode = data.last_details_data[0].transportaccode;
        transportName = data.last_details_data[0].transportname;
        millgstno = data.last_details_data[0].MillGSTNo;
        gstName = data.last_details_data[0].GSTName;
        lblGodownName = data.last_details_data[0].godownName;
        newGodownCode = data.last_head_data.godownCode;

        const { saleid, ...headDataWithoutSaleid } = data.last_head_data;

        setFormData({
          ...formData,
          ...headDataWithoutSaleid,
          doc_no: formData.doc_no,
          doc_date: formData.doc_date,
          DO_No: formData.DO_No,
          EwayBillValidDate: formData.EwayBillValidDate,
          MillInvoiceNo: formData.MillInvoiceNo,
          EWay_Bill_No: formData.EWay_Bill_No,
          ackno: formData.ackno,
          einvoiceno: formData.einvoiceno
        });

        setLastTenderData(data.last_head_data || {});

        const copiedUsers = data.last_details_data.map((detail, index) => ({
          id: index + 1,
          item_code: detail.item_code,
          item_Name: detail.itemname,
          rowaction: "add",
          Brand_Code: detail.Brand_Code,
          brand_name: detail.brandname,
          ic: detail.ic,
          narration: detail.narration,
          Quantal: detail.Quantal,
          bags: detail.bags,
          packing: detail.packing,
          rate: detail.rate,
          item_Amount: detail.item_Amount,
        }));

        setUsers(copiedUsers);
        setIsEditing(true);

      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }
  };





  return (
    <>
      <UserAuditInfo
        createdBy={formData.Created_By}
        modifiedBy={formData.Modified_By}
        title={"Other Sugar Sale Bill"}
      />
      <ToastContainer autoClose={500} />
      <br></br>
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
        isDeleted={formData.IsDeleted === 0}
        permissions={permissions}
        component={<div style={{ display: 'flex' }} >
          {/* <SaleBillReport doc_no={formData.doc_no} disabledFeild={!addOneButtonEnabled} /> */}
          <OtherCustomizeSBReport doc_no={formData.doc_no} disabledFeild={!addOneButtonEnabled} />
          {/* <CarporateSaleBillPrint doc_no={formData.doc_no} disabledFeild={!addOneButtonEnabled} /> */}
          <EWayBillReport doc_no={formData.doc_no} ewayBillNo={formData.EWay_Bill_No} Company_Code={companyCode} Year_Code={Year_Code} disabledFeild={formData.EWay_Bill_No === "" || !addOneButtonEnabled}
          />
          <div>
            <Button
              variant="contained"
              color="success"
              onClick={() => handleGenerateEwayBill()}
              disabled={isEditing || formData.EWay_Bill_No !== "" || formData.IsDeleted === 0}
              style={{ whiteSpace: 'nowrap' }}
            >
              Generate EwayBill
            </Button>
          </div>
          <Dialog open={isOpenEwayBill} onClose={handleCloseEwayBill} maxWidth={650} >
            <DialogTitle style={{ textAlign: "center" }}>EwayBill Generation</DialogTitle>
            <IconButton
              edge="end"
              color="inherit"
              onClick={handleCloseEwayBill}
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
              <EwayBillGeneration
                doc_no={formData.doc_no}
                do_no={0}
                tran_type={"SB"}
                handleClose={handleCloseEwayBill}
                Company_Code={companyCode}
                Year_Code={Year_Code}
              />
            </DialogContent>
          </Dialog>

          <div style={{ marginLeft: '5px' }}>
            <Button
              variant="contained"
              color="success"
              onClick={() => handleGenerateEInvoice()}
              disabled={isEditing || formData.einvoiceno !== "" || formData.IsDeleted === 0}
              style={{ whiteSpace: 'nowrap' }}
            >
              Generate eInvoice
            </Button>
          </div>
          <Dialog open={isOpenEInvoice} onClose={handleCloseEInvoice} maxWidth={650} >
            <DialogTitle GSTData style={{ textAlign: "center" }}>E-Invoice Generation</DialogTitle>
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
                do_no={formData.DO_No}
                tran_type={"SB"}
                handleClose={handleCloseEInvoice}
                Company_Code={companyCode}
                Year_Code={Year_Code}
              />
            </DialogContent>
          </Dialog>

        </div>}
      />
      <NavigationButtons
        handleFirstButtonClick={handleFirstButtonClick}
        handlePreviousButtonClick={handlePreviousButtonClick}
        handleNextButtonClick={handleNextButtonClick}
        handleLastButtonClick={handleLastButtonClick}
        highlightedButton={highlightedButton}
        isEditing={isEditing}
      />

      <form onSubmit={handleSubmit}>
        <Grid container alignItems="center" spacing={1} mt={0.5}>
          <Grid item xs={12} sm={1}>
            <FormControl fullWidth>
              <TextField
                label="Change No"
                variant="outlined"
                name="changeNo"
                autoComplete="off"
                onKeyDown={handleKeyDown}
                disabled={!addOneButtonEnabled}
                fullWidth
                size="small"
              />
            </FormControl>
          </Grid>

          <Grid item xs={6} sm={1}>
            <FormControl >
              <TextField
                label="Bill No"
                variant="outlined"
                name="doc_no"
                autoComplete="off"
                value={formData.doc_no}
                onChange={handleChange}
                disabled
                fullWidth
                size="small"
              />
            </FormControl>
          </Grid>

          <Grid item xs={6} sm={1}>
            <FormControl >
              <TextField
                inputRef={inputRef}
                type="date"
                label="Date"
                variant="outlined"
                name="doc_date"
                value={formData.doc_date}
                onChange={handleChange}
                disabled={!isEditing && addOneButtonEnabled}
                fullWidth
                size="small"
                InputLabelProps={{
                  style: { fontSize: '14px' },
                }}
                InputProps={{
                  style: { fontSize: '12px', height: '40px' },
                }}
              />
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={1} ml={7}>
            <FormControl >
              <TextField
                label="DO No"
                variant="outlined"
                name="DO_No"
                autoComplete="off"
                value={formData.DO_No}
                // onChange={handleChange}
                disabled
                fullWidth
                size="small"
              />
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
                disabled={!isEditing || isEditMode}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </FormControl>
          </Grid>

        </Grid>

        <div className="SugarSaleBill-row" style={{ marginTop: "10px" }}>
          <label htmlFor="Bill_From" className="SugarSaleBillLabel" >
            Bill From :
          </label>
          <div >
            <div >
              <AccountMasterHelp
                onAcCodeClick={handleBillFrom}
                CategoryName={partyName}
                CategoryCode={partyCode}
                name="Ac_Code"
                Ac_type={[]}
                disabledFeild={!isEditing && addOneButtonEnabled}
              />
            </div>
          </div>
        </div>

        <div className="SugarSaleBill-row">
          <label htmlFor="Bill_To" className="SugarSaleBillLabel" >
            Bill To :
          </label>
          <div >
            <div >
              <AccountMasterHelp
                onAcCodeClick={handleBillTo}
                CategoryName={billToName || bill_To_Name}
                CategoryCode={billToCode || formData.Bill_To}
                name="Bill_To"
                Ac_type={[]}
                disabledFeild={!isEditing && addOneButtonEnabled}
              />
            </div>
          </div>
        </div>

        <div className="SugarSaleBill-row">
          <label htmlFor="Ship_To" className="SugarSaleBillLabel" >
            Ship To :
          </label>
          <div >
            <div >
              <AccountMasterHelp
                onAcCodeClick={handleShipTo}
                CategoryName={unitName || ship_To_Name}
                CategoryCode={unitCode}
                name="Unit_Code"
                Ac_type={[]}
                disabledFeild={!isEditing && addOneButtonEnabled}
              />
            </div>
          </div>
        </div>

        <div className="SugarSaleBill-row">
          <label htmlFor="Mill_Name" className="SugarSaleBillLabel" >
            Mill Name :
          </label>
          <div >
            <div >
              <AccountMasterHelp
                onAcCodeClick={handleMillData}
                CategoryName={millName}
                CategoryCode={millCode}
                name="mill_code"
                Ac_type={[]}
                disabledFeild={!isEditing && addOneButtonEnabled}
              />
            </div>
          </div>
        </div>

        <div className="SaleBill-row">
          <Grid container spacing={1} mt={1.5}>
            <Grid item xs={6} sm={1}>
              <FormControl fullWidth>
                <TextField
                  label="From"
                  name="FROM_STATION"
                  autoComplete="off"
                  value={formData.FROM_STATION}
                  onChange={handleChange}
                  disabled={!isEditing && addOneButtonEnabled}
                  tabIndex={5}
                  size="small"
                />
              </FormControl>
            </Grid>

            <Grid item xs={6} sm={1}>
              <FormControl fullWidth>
                <TextField
                  label="To"
                  name="TO_STATION"
                  autoComplete="off"
                  value={formData.TO_STATION}
                  onChange={handleChange}
                  disabled={!isEditing && addOneButtonEnabled}
                  tabIndex={6}
                  size="small"
                />
              </FormControl>
            </Grid>

            <Grid item xs={6} sm={1}>
              <FormControl fullWidth>
                <TextField
                  label="Lorry No"
                  name="LORRYNO"
                  autoComplete="off"
                  value={formData.LORRYNO}
                  onChange={handleChange}
                  disabled={!isEditing && addOneButtonEnabled}
                  tabIndex={7}
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
              </FormControl>
            </Grid>

            <Grid item xs={6} sm={1}>
              <FormControl fullWidth>
                <TextField
                  label="Warehouse"
                  name="wearhouse"
                  autoComplete="off"
                  value={formData.wearhouse}
                  onChange={handleChange}
                  disabled={!isEditing && addOneButtonEnabled}
                  tabIndex={8}
                  size="small"
                />
              </FormControl>
            </Grid>

            <div className="SugarSaleBill-row" style={{ marginTop: '-5px' }}>
              <label htmlFor="Mill_Name" style={{ fontWeight: "bold", marginLeft: "10px" }} >
                Broker :
              </label>
              <div >
                <div >
                  <AccountMasterHelp
                    onAcCodeClick={handleBroker}
                    CategoryName={brokerName}
                    CategoryCode={brokerCode}
                    name="BROKER"
                    Ac_type=""
                    disabledFeild={!isEditing && addOneButtonEnabled}
                  />
                </div>
              </div>
            </div>

            <div className="SugarSaleBill-row" style={{ marginTop: '-5px', marginLeft: "5px" }}>
              <label htmlFor="Mill_Name" style={{ fontWeight: "bold", marginLeft: "10px" }} >
                GST Code :
              </label>
              <div >
                <div >
                  <GSTRateMasterHelp
                    name="GstRateCode"
                    onAcCodeClick={handleGstCode}
                    GstRateName={gstName}
                    GstRateCode={gstRateCode || formData.GstRateCode}
                    disabledFeild={!isEditing && addOneButtonEnabled}
                  />
                </div>
              </div>
            </div>
            <div className="SugarSaleBill-row" style={{ marginTop: '-5px', marginLeft: "5px" }}>
              <label htmlFor="Godown" style={{ fontWeight: "bold", marginLeft: "10px" }} >
                Godown :
              </label>
              <div >
                <div >
                  <ItemMasterHelp
                    onAcCodeClick={handleGoDown}
                    CategoryName={lblGodownName}
                    CategoryCode={newGodownCode}
                    name="godownCode"
                    SystemType="W"
                    className="account-master-help"
                    disabledField={!isEditing && addOneButtonEnabled}
                  />
                </div>
              </div>
            </div>

            {/* <div >
              <select
                id="Unit"
                name="Unit"
                value={formData.Unit}
                onChange={handleChange}
                disabled={!isEditing && addOneButtonEnabled}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  fontSize: "14px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                  backgroundColor: "#fff",
                  boxSizing: "border-box",
                  marginLeft: "10px",
                  marginTop: "8px"
                }}
              >
                <option value="QTL">QUINTAL</option>
                <option value="LTR">LITRE</option>
                <option value="MTS"> METRIC TON</option>
              </select>
            </div> */}
          </Grid>
        </div>

        {isLoading && (
          <div className="loading-overlay">
            <div className="spinner-container">
              <SaveUpdateSpinner />
            </div>
          </div>
        )}

        <div style={{ marginTop: "10px" }}>
          <AddButton openPopup={openPopup} isEditing={isEditing} ref={addButtonRef} setFocusToFirstField={setFocusToFirstField} />
        </div>

        {/*detail part popup functionality and Validation part Grid view */}
        <div className="">
          {showPopup && (
            <div className="sugar-salebill-modal" role="dialog" style={{ display: "block" }}>
              <div className="sugar-salebill-modal-dialog" role="document">
                <div className="modal-content">
                  <div className="sugar-salebill-modal-header">
                    <h5 className="sugar-salebill-modal-title">
                      {selectedUser.id ? "Update Sale Bill" : "Add Sale Bill"}
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
                  <div className="sugar-salebill-body ">
                    <form>
                      <div className="SugarSaleBill-row" style={{ marginLeft: '10px' }} >
                        <label htmlFor="Mill_Name" className="SugarSaleBillLabel" >
                          Item Code :
                        </label>
                        <div >
                          <div >
                            <ItemMasterHelp
                              onAcCodeClick={handleItemCode}
                              CategoryName={item_Name}
                              CategoryCode={itemCode}
                              SystemType="I"
                              name="item_code"
                              firstInputRef={firstInputRef}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="SugarSaleBill-row" >
                        <label htmlFor="Mill_Name" className="SugarSaleBillLabel" >
                          Brand Code :
                        </label>
                        <div >
                          <div >
                            <BrandMasterHelp
                              onAcCodeClick={handleBrandCode}
                              brandName={brand_name}
                              brandCode={brand_code}
                              name="Brand_Code"
                            />
                          </div>
                        </div>
                      </div>
                      <Grid container spacing={2} className="mt-3">
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Quintal"
                            name="Quantal"
                            type="number"
                            value={formDataDetail.Quantal}
                            onChange={handleChangeDetail}
                            fullWidth
                            autoComplete="off"
                            variant="outlined"
                            size="small"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Packing"
                            name="packing"
                            value={formDataDetail.packing}
                            onChange={handleChangeDetail}
                            fullWidth
                            autoComplete="off"
                            variant="outlined"
                            size="small"
                          />
                        </Grid>
                      </Grid>

                      <Grid container spacing={2} className="mt-3">
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Bags"
                            name="bags"
                            value={formDataDetail.bags}
                            onChange={handleChangeDetail}
                            fullWidth
                            autoComplete="off"
                            variant="outlined"
                            size="small"
                            disabled
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Rate"
                            name="rate"
                            type="number"
                            value={formDataDetail.rate}
                            onChange={handleChangeDetail}
                            fullWidth
                            autoComplete="off"
                            variant="outlined"
                            size="small"
                          />
                        </Grid>
                      </Grid>

                      <Grid container spacing={2} className="mt-3">
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Item Amount"
                            name="item_Amount"
                            value={formDataDetail.item_Amount}
                            onChange={handleChangeDetail}
                            fullWidth
                            autoComplete="off"
                            variant="outlined"
                            size="small"
                            disabled
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Narration"
                            name="narration"
                            value={formDataDetail.narration}
                            onChange={handleChangeDetail}
                            fullWidth
                            autoComplete="off"
                            variant="outlined"
                            size="small"
                          />
                        </Grid>
                      </Grid>
                    </form>
                  </div>

                  <div className="modal-footer">
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
          <div >

            <TableContainer component={Paper} className="mt-4" sx={{ width: "70%" }} >
              <Table aria-label="user table">
                <TableHead>
                  <TableRow>
                    <TableCell sx={headerCellStyle}>Actions</TableCell>
                    {/* <TableCell sx={headerCellStyle}>RowAction</TableCell> */}
                    <TableCell sx={headerCellStyle}>ID</TableCell>
                    <TableCell sx={headerCellStyle}>Item</TableCell>
                    <TableCell sx={headerCellStyle}>Item Name</TableCell>
                    <TableCell sx={headerCellStyle}>Brand Code</TableCell>
                    <TableCell sx={headerCellStyle}>Brand Name</TableCell>
                    <TableCell sx={headerCellStyle}>Quintal</TableCell>
                    <TableCell sx={headerCellStyle}>Packing</TableCell>
                    <TableCell sx={headerCellStyle}>Bags</TableCell>
                    <TableCell sx={headerCellStyle}>Rate</TableCell>
                    <TableCell sx={headerCellStyle}>Item Amount</TableCell>
                    {/* <TableCell sx={headerCellStyle}>Saledetailid</TableCell> */}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell sx={{ padding: '4px 8px' }}>
                        {user.rowaction === "add" || user.rowaction === "update" || user.rowaction === "Normal" ? (
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
                        ) : user.rowaction === "DNU" || user.rowaction === "delete" ? (
                          <OpenButton openDelete={openDelete} user={user} />
                        ) : null}
                      </TableCell>
                      {/* <TableCell>{user.rowaction}</TableCell> */}
                      <TableCell sx={{ padding: '4px 8px', textAlign: "center" }}>{user.id}</TableCell>
                      <TableCell sx={{ padding: '4px 8px', textAlign: "center" }}>{user.item_code}</TableCell>
                      <TableCell sx={{ padding: '4px 8px', textAlign: "center" }}>{user.item_Name}</TableCell>
                      <TableCell sx={{ padding: '4px 8px', textAlign: "center" }}>{user.Brand_Code}</TableCell>
                      <TableCell sx={{ padding: '4px 8px', textAlign: "center" }}>{user.brand_name}</TableCell>
                      <TableCell sx={{ padding: '4px 8px', textAlign: "center" }}>{user.Quantal}</TableCell>
                      <TableCell sx={{ padding: '4px 8px', textAlign: "center" }}>{user.packing}</TableCell>
                      <TableCell sx={{ padding: '4px 8px', textAlign: "center" }}>{user.bags}</TableCell>
                      <TableCell sx={{ padding: '4px 8px', textAlign: "center" }}>{formatReadableAmount(user.rate)}</TableCell>
                      <TableCell sx={{ padding: '4px 8px', textAlign: "center" }}>{formatReadableAmount(user.item_Amount)}</TableCell>
                      {/* <TableCell>{user.saledetailid}</TableCell> */}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
        </div>

        <div style={{ display: 'grid' }} >
          <div>
            <div>
              <Grid container spacing={1} mt={1}>
                <Grid item xs={4} sm={1}>
                  <TextField
                    label="Net Quantal"
                    name="NETQNTL"
                    variant="outlined"
                    autoComplete="off"
                    value={formData.NETQNTL}
                    onChange={handleChange}
                    onKeyDown={handleKeyDownCalculations}
                    disabled={!isEditing && addOneButtonEnabled}
                    fullWidth
                    size="small"
                    inputProps={{
                      inputMode: 'decimal',
                      pattern: '[0-9]*[.,]?[0-9]+',
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

                <Grid item xs={4} sm={1}>
                  <TextField
                    label="Due Days"
                    name="Due_Days"
                    variant="outlined"
                    autoComplete="off"
                    value={formData.Due_Days}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    fullWidth
                    size="small"
                    inputProps={{
                      inputMode: 'decimal',
                      pattern: '[0-9]*[.,]?[0-9]+',
                      onInput: validateNumericInput,
                    }}
                  />
                </Grid>

                <Grid item xs={4} sm={1}>
                  <TextField
                    label="ASN/GRN No"
                    name="ASN_No"
                    variant="outlined"
                    autoComplete="off"
                    value={formData.ASN_No}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={4} sm={4} mt={-2}>
                  <div className="SugarSaleBill-row">
                    <label htmlFor="Transport_Code" className="SugarSaleBillLabel" >
                      Transport :
                    </label>
                    <div >
                      <div >
                        <AccountMasterHelp
                          onAcCodeClick={handleTransport}
                          CategoryName={transportName}
                          CategoryCode={transportCode}
                          name="Transport_Code"
                          Ac_type={[]}
                          disabledFeild={!isEditing && addOneButtonEnabled}
                        />
                      </div>
                    </div>
                  </div>
                </Grid>
              </Grid>
              <Grid container spacing={1} mt={0.2}>
                <Grid item xs={4} sm={2}>
                  <TextField
                    label="Eway Bill No"
                    name="EWay_Bill_No"
                    variant="outlined"
                    autoComplete="off"
                    value={formData.EWay_Bill_No}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    fullWidth
                    size="small"
                  />
                </Grid>

                <Grid item xs={4} sm={1}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        id="EWayBill_Chk"
                        checked={isChecked}
                        onChange={handleOnChange}
                        disabled={!isEditing && addOneButtonEnabled}
                      />
                    }
                    label={isChecked ? millname || millName : "EWay Bill Checkbox"}
                  />
                </Grid>

                <Grid item xs={4} sm={1}>
                  <TextField
                    label="EWayBill Validate Date"
                    type="date"
                    name="EwayBillValidDate"
                    value={formData.EwayBillValidDate}
                    onChange={(e) => handleDateChange(e, "EwayBillValidDate")}
                    disabled={!isEditing && addOneButtonEnabled}
                    InputLabelProps={{
                      style: { fontSize: '12px' },
                    }}
                    InputProps={{
                      style: { fontSize: '12px', height: '35px' },
                    }}
                    fullWidth
                    size="small"
                  />
                </Grid>

                <Grid item xs={4} sm={1}>
                  <TextField
                    label="Party Mo. No."
                    name="partyMobNo"
                    variant="outlined"
                    autoComplete="off"
                    // value={PartyMobNo || partyMobNo || 0}
                    // onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    fullWidth
                    size="small"
                    inputProps={{
                      maxLength: 10,
                      inputMode: 'numeric',
                      pattern: '[0-9]*',
                    }}
                  />
                </Grid>

                <Grid item xs={4} sm={1}>
                  <TextField
                    label="Transport"
                    name="TransportMobNo"
                    variant="outlined"
                    autoComplete="off"
                    // value={TransportMobNo || transportMob || 0}
                    // onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    fullWidth
                    size="small"
                    inputProps={{
                      maxLength: 10,
                      inputMode: 'numeric',
                      pattern: '[0-9]*',
                    }}
                  />
                </Grid>

                <Grid item xs={4} sm={1}>
                  <TextField
                    label="Driver"
                    name="Driver"
                    variant="outlined"
                    autoComplete="off"
                    // value={formData.Driver}
                    // onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    fullWidth
                    size="small"
                    inputProps={{
                      maxLength: 10,
                      inputMode: 'numeric',
                      pattern: '[0-9]*',
                    }}
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2} mt={0.1}>
                <Grid item xs={4} sm={2}>
                  <TextField
                    label="GST No"
                    name="GSTNo"
                    variant="outlined"
                    autoComplete="off"
                    value={isChecked ? millGSTNo || millgstno : gstNo}
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
                <Grid item xs={4} sm={1}>
                  <TextField
                    label="Unit"
                    name="UnitMobNo"
                    variant="outlined"
                    autoComplete="off"
                    value={UnitMobNo || shipToMobNo || 0}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    fullWidth
                    size="small"
                    inputProps={{
                      inputMode: 'decimal',
                      pattern: '[0-9]*[.,]?[0-9]+',
                      onInput: validateNumericInput,
                    }}
                  />
                </Grid>

                <Grid item xs={2} sm={1}>
                  <Button variant="contained" color="primary">
                    SMS
                  </Button>
                </Grid>
              </Grid>

              <Grid container spacing={2} mt={0.2}>
                <Grid item xs={4} sm={1}>
                  <TextField
                    label="New SB No"
                    name="newsbno"
                    variant="outlined"
                    autoComplete="off"
                    value={formData.newsbno}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    fullWidth
                    size="small"
                  />
                </Grid>

                <Grid item xs={4} sm={2}>
                  <TextField
                    label="EInvoice No"
                    name="einvoiceno"
                    variant="outlined"
                    autoComplete="off"
                    value={formData.einvoiceno}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    fullWidth
                    size="small"
                  />
                </Grid>

                <Grid item xs={4} sm={1}>
                  <TextField
                    label="ACK No"
                    name="ackno"
                    variant="outlined"
                    autoComplete="off"
                    value={formData.ackno}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    fullWidth
                    size="small"
                  />
                </Grid>

                <Grid item xs={6} sm={3}>
                  <FormControl fullWidth size="small" disabled={!isEditing && addOneButtonEnabled}>
                    <InputLabel htmlFor="SBNarration">Narration</InputLabel>
                    <TextareaAutosize
                      id="SBNarration"
                      name="SBNarration"
                      value={formData.SBNarration}
                      onChange={handleChange}
                      autoComplete="off"
                      minRows={1}
                      disabled={!isEditing && addOneButtonEnabled}
                    />
                  </FormControl>
                </Grid>
              </Grid>
            </div>
          </div>

          <div>
            <div className="SaleBill-row" >
              <Grid container spacing={1} mt={-45} sx={{ textAlign: 'left' }}>
                <Grid container spacing={1} justifyContent="flex-end" alignItems="center" >
                  <Grid item xs={1}>
                    <label className="SugarSaleBillLabel">SubTotal :</label>
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <TextField
                      variant="outlined"
                      name="subTotal"
                      autoComplete="off"
                      value={formData.subTotal}
                      disabled
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      error={!!formErrors.subTotal}
                      helperText={formErrors.subTotal}
                      size="small"
                      inputProps={{
                        sx: { textAlign: 'right' },
                        inputMode: 'decimal',
                        pattern: '[0-9]*[.,]?[0-9]+',
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
                <Grid container spacing={1} justifyContent="flex-end" alignItems="center" style={{ marginTop: '-6px' }} >
                  <Grid item xs={1}>
                    <label className="SugarSaleBillLabel">Freight :</label>
                  </Grid>
                  <Grid item xs={12} sm={1}>
                    <TextField
                      variant="outlined"
                      name="LESS_FRT_RATE"
                      autoComplete="off"
                      value={formData.LESS_FRT_RATE}
                      onChange={handleChange}
                      onKeyDown={handleKeyDownCalculations}
                      disabled={!isEditing && addOneButtonEnabled}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      error={!!formErrors.LESS_FRT_RATE}
                      helperText={formErrors.LESS_FRT_RATE}
                      size="small"
                      inputProps={{
                        sx: { textAlign: 'right' },
                        inputMode: 'decimal',
                        pattern: '[0-9]*[.,]?[0-9]+',
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
                      onKeyDown={handleKeyDownCalculations}
                      onChange={handleChange}
                      disabled={!isEditing && addOneButtonEnabled}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      error={!!formErrors.freight}
                      helperText={formErrors.freight}
                      size="small"
                      inputProps={{
                        sx: { textAlign: 'right' },
                        inputMode: 'decimal',
                        pattern: '[0-9]*[.,]?[0-9]+',
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

                <Grid container spacing={1} justifyContent="flex-end" alignItems="center"  >
                  <Grid item xs={1} mt={1}>
                    <label className="SugarSaleBillLabel">Taxable Amount :</label>
                  </Grid>
                  <Grid item xs={12} sm={2} mt={0.4}>
                    <TextField
                      variant="outlined"
                      fullWidth
                      name="TaxableAmount"
                      value={formData.TaxableAmount}
                      onChange={handleChange}
                      onKeyDown={handleKeyDownCalculations}
                      disabled
                      error={Boolean(formErrors.TaxableAmount)}
                      helperText={formErrors.TaxableAmount || ''}
                      size="small"
                      inputProps={{
                        sx: { textAlign: 'right' },
                        inputMode: 'decimal',
                        pattern: '[0-9]*[.,]?[0-9]+',
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

                <Grid container spacing={1} justifyContent="flex-end" alignItems="center" style={{ marginTop: '-6px' }} >
                  <Grid item xs={1}>
                    <label className="SugarSaleBillLabel">CGST :</label>
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
                        sx: { textAlign: 'right' },
                        inputMode: 'decimal',
                        pattern: '[0-9]*[.,]?[0-9]+',
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
                        sx: { textAlign: 'right' },
                        inputMode: 'decimal',
                        pattern: '[0-9]*[.,]?[0-9]+',
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

                <Grid container spacing={1} justifyContent="flex-end" alignItems="center" style={{ marginTop: '-6px' }} >
                  <Grid item xs={1}>
                    <label className="SugarSaleBillLabel">SGST :</label>
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
                        sx: { textAlign: 'right' },
                        inputMode: 'decimal',
                        pattern: '[0-9]*[.,]?[0-9]+',
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
                        sx: { textAlign: 'right' },
                        inputMode: 'decimal',
                        pattern: '[0-9]*[.,]?[0-9]+',
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

                <Grid container spacing={1} justifyContent="flex-end" alignItems="center" style={{ marginTop: '-6px' }} >
                  <Grid item xs={1}>
                    <label className="SugarSaleBillLabel">IGST :</label>
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
                        sx: { textAlign: 'right' },
                        inputMode: 'decimal',
                        pattern: '[0-9]*[.,]?[0-9]+',
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
                        sx: { textAlign: 'right' },
                        inputMode: 'decimal',
                        pattern: '[0-9]*[.,]?[0-9]+',
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

                <Grid container spacing={1} justifyContent="flex-end" alignItems="center" style={{ marginTop: '-6px' }} >
                  <Grid item xs={1}>
                    <label className="SugarSaleBillLabel">RateDiff :</label>
                  </Grid>
                  <Grid item xs={12} sm={1}>
                    <TextField
                      variant="outlined"
                      fullWidth
                      name="RateDiff"
                      autoComplete="off"
                      value={formData.RateDiff || 0}
                      onChange={handleChange}
                      onKeyDown={handleKeyDownCalculations}
                      disabled={!isEditing && addOneButtonEnabled}
                      error={Boolean(formErrors.RateDiff)}
                      helperText={formErrors.RateDiff || ''}
                      size="small"
                      inputProps={{
                        sx: { textAlign: 'right' },
                        inputMode: 'decimal',
                        pattern: '[0-9]*[.,]?[0-9]+',
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
                      name="RateDiffAmount"
                      autoComplete="off"
                      value={calculateRateDiffAmount()}
                      onChange={handleChange}
                      onKeyDown={handleKeyDownCalculations}
                      disabled={!isEditing && addOneButtonEnabled}
                      error={Boolean(formErrors.RateDiffAmount)}
                      helperText={formErrors.RateDiffAmount || ''}
                      size="small"
                      inputProps={{
                        sx: { textAlign: 'right' },
                        inputMode: 'decimal',
                        pattern: '[0-9]*[.,]?[0-9]+',
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

                <Grid container spacing={1} justifyContent="flex-end" alignItems="center" style={{ marginTop: '-6px' }}>
                  <Grid item xs={1}>
                    <label className="SugarSaleBillLabel">Other +/- :</label>
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <TextField
                      variant="outlined"
                      fullWidth
                      name="OTHER_AMT"
                      autoComplete="off"
                      value={formData.OTHER_AMT}
                      onKeyDown={handleKeyDownCalculations}
                      onChange={handleChange}
                      disabled={!isEditing && addOneButtonEnabled}
                      error={Boolean(formErrors.OTHER_AMT)}
                      helperText={formErrors.OTHER_AMT || ''}
                      size="small"
                      inputProps={{
                        sx: { textAlign: 'right' },
                        inputMode: 'decimal',
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

                <Grid container spacing={1} justifyContent="flex-end" alignItems="center" style={{ marginTop: '-6px' }}>
                  <Grid item xs={1}>
                    <label className="SugarSaleBillLabel">Cash Advance :</label>
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <TextField
                      variant="outlined"
                      fullWidth
                      name="cash_advance"
                      autoComplete="off"
                      value={formData.cash_advance}
                      onKeyDown={handleKeyDownCalculations}
                      onChange={handleChange}
                      disabled={!isEditing && addOneButtonEnabled}
                      error={Boolean(formErrors.cash_advance)}
                      helperText={formErrors.cash_advance || ''}
                      size="small"
                      inputProps={{
                        sx: { textAlign: 'right' },
                        inputMode: 'decimal',
                        pattern: '[0-9]*[.,]?[0-9]+',
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

                <Grid container spacing={1} justifyContent="flex-end" alignItems="center" style={{ marginTop: '-6px' }}>
                  <Grid item xs={1}>
                    <label className="SugarSaleBillLabel">Round Off :</label>
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <TextField
                      variant="outlined"
                      fullWidth
                      name="RoundOff"
                      autoComplete="off"
                      value={formData.RoundOff}
                      onKeyDown={handleKeyDownCalculations}
                      onChange={handleChange}
                      disabled={!isEditing && addOneButtonEnabled}
                      error={Boolean(formErrors.RoundOff)}
                      helperText={formErrors.RoundOff || ''}
                      size="small"
                      inputProps={{
                        sx: { textAlign: 'right' },
                        inputMode: 'decimal',
                        pattern: '[0-9]*[.,]?[0-9]+',
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

                <Grid container spacing={1} justifyContent="flex-end" alignItems="center" style={{ marginTop: '-6px' }}>
                  <Grid item xs={1}>
                    <label className="SugarSaleBillLabel">Bill Amount :</label>
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <TextField
                      variant="outlined"
                      fullWidth
                      name="Bill_Amount"
                      value={formData.Bill_Amount}
                      onChange={handleChange}
                      disabled
                      error={Boolean(formErrors.Bill_Amount)}
                      helperText={formErrors.Bill_Amount || ''}
                      size="small"
                      inputProps={{
                        sx: { textAlign: 'right' },
                        inputMode: 'decimal',
                        pattern: '[0-9]*[.,]?[0-9]+',
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

                <Grid container spacing={1} justifyContent="flex-end" alignItems="center" style={{ marginTop: '-6px' }} >
                  <Grid item xs={1}>
                    <label className="SugarSaleBillLabel">TCS :</label>
                  </Grid>
                  <Grid item xs={12} sm={1}>
                    <TextField
                      variant="outlined"
                      fullWidth
                      name="TCS_Rate"
                      autoComplete="off"
                      value={formData.TCS_Rate}
                      onKeyDown={handleKeyDownCalculations}
                      onChange={handleChange}
                      disabled={TCSApplicable !== 'Y' || (!isEditing && addOneButtonEnabled)}
                      error={Boolean(formErrors.TCS_Rate)}
                      helperText={formErrors.TCS_Rate || ''}
                      size="small"
                      inputProps={{
                        sx: { textAlign: 'right' },
                        inputMode: 'decimal',
                        pattern: '[0-9]*[.,]?[0-9]+',
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
                      value={formData.TCS_Amt}
                      onKeyDown={handleKeyDownCalculations}
                      onChange={handleChange}
                      disabled={TCSApplicable !== 'Y' || (!isEditing && addOneButtonEnabled)}
                      error={Boolean(formErrors.TCS_Amt)}
                      helperText={formErrors.TCS_Amt || ''}
                      size="small"
                      inputProps={{
                        sx: { textAlign: 'right' },
                        inputMode: 'decimal',
                        pattern: '[0-9]*[.,]?[0-9]+',
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

                <Grid container spacing={1} justifyContent="flex-end" alignItems="center" style={{ marginTop: '-6px' }}>
                  <Grid item xs={1}>
                    <label className="SugarSaleBillLabel">Net Payable :</label>
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <TextField
                      variant="outlined"
                      fullWidth
                      name="TCS_Net_Payable"
                      value={formData.TCS_Net_Payable}
                      onChange={handleChange}
                      disabled
                      error={Boolean(formErrors.TCS_Net_Payable)}
                      helperText={formErrors.TCS_Net_Payable || ''}
                      size="small"
                      inputProps={{
                        sx: { textAlign: 'right' },
                        inputMode: 'decimal',
                        pattern: '[0-9]*[.,]?[0-9]+',
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

                <Grid container spacing={1} justifyContent="flex-end" alignItems="center" style={{ marginTop: '-6px' }} mb={8} >
                  <Grid item xs={1}>
                    <label className="SugarSaleBillLabel">TDS :</label>
                  </Grid>
                  <Grid item xs={12} sm={1}>
                    <TextField
                      variant="outlined"
                      fullWidth
                      name="TDS_Rate"
                      autoComplete="off"
                      value={formData.TDS_Rate}
                      onChange={handleChange}
                      onKeyDown={handleKeyDownCalculations}
                      disabled={!isEditing && addOneButtonEnabled}
                      error={Boolean(formErrors.TDS_Rate)}
                      helperText={formErrors.TDS_Rate || ''}
                      size="small"
                      inputProps={{
                        sx: { textAlign: 'right' },
                        inputMode: 'decimal',
                        pattern: '[0-9]*[.,]?[0-9]+',
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
                  <Grid item xs={12} sm={1} >
                    <TextField
                      variant="outlined"
                      fullWidth
                      name="TDS_Amt"
                      autoComplete="off"
                      value={formData.TDS_Amt}
                      onChange={handleChange}
                      onKeyDown={handleKeyDownCalculations}
                      disabled={!isEditing && addOneButtonEnabled}
                      error={Boolean(formErrors.TDS_Amt)}
                      helperText={formErrors.TDS_Amt || ''}
                      size="small"
                      inputProps={{
                        sx: { textAlign: 'right' },
                        inputMode: 'decimal',
                        pattern: '[0-9]*[.,]?[0-9]+',
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
          </div>
        </div>
      </form>
    </>
  );
};
export default OtherSaleBill;