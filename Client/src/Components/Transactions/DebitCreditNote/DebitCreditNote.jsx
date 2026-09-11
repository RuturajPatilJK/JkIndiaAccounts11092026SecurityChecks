import React, { useState, useRef, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import AccountMasterHelp from "../../../Helper/AccountMasterHelp";
import GSTRateMasterHelp from "../../../Helper/GSTRateMasterHelp";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import ActionButtonGroup from "../../../Common/CommonButtons/ActionButtonGroup";
import NavigationButtons from "../../../Common/CommonButtons/NavigationButtons";
import SystemHelpMaster from "../../../Helper/SystemmasterHelp";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./DebitCreditNote.css";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, TextField,
  Grid, Dialog, DialogTitle, DialogContent, IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useRecordLocking } from '../../../hooks/useRecordLocking';
import DebitCreditNoteHelp from "../../../Helper/DebitCreditNoteHelp";
import UserAuditInfo from "../../../Common/UserAuditInfo/UserAuditInfo";
import AddButton from "../../../Common/Buttons/AddButton";
import EditButton from "../../../Common/Buttons/EditButton";
import DeleteButton from "../../../Common/Buttons/DeleteButton";
import OpenButton from "../../../Common/Buttons/OpenButton";
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";
import DebitCreditNoteReport from "./DebitCreditNoteReport"
import EInvoiceGeneration from "../../../Common/EwaybillNEInvoice/EInvoiceGenerationProcess/EInvoiceGeneration";
import Swal from "sweetalert2";
import DetailAddButtom from "../../../Common/Buttons/DetailAddButton";
import DetailCloseButton from "../../../Common/Buttons/DetailCloseButton";
import DetailUpdateButton from "../../../Common/Buttons/DetailUpdateButton";
import SaveUpdateSpinner from "../../../Common/Spinners/SaveUpdateSpinner";
import { InWordPostDateRecordLock, OutwordPostDateRecordLock } from "../../../Common/PostDateLock/PostDateRangeCheck"
import { validateDocumentDate } from "../../../Common/ValidateDateRange/ValidateDateRange"

// Global Variables
var newDcid = "";
var BillFromName = "";
var BillFormCode = "";
var BillToName = "";
var BillToCode = "";
var GSTName = "";
var GSTCode = "";
var MillName = "";
var MillCode = "";
var ShipToName = "";
var ShipToCode = "";
var ExpAcaccountName = "";
var ExpAcaccountCode = "";
var ItemCodeName = "";
var ItemCodeDetail = "";
var HSN = "";
var CGSTRate = 0.0;
var SGSTRate = 0.0;
var IGSTRate = 0.0;
var Bill_No = '';
var Bill_Id = ''

const headerCellStyle = {
  fontWeight: 'bold',
  backgroundColor: '#3f51b5',
  color: 'white',
  padding: "6px",
  '&:hover': {
    backgroundColor: '#303f9f',
    cursor: 'pointer',
  },
};

const API_URL = process.env.REACT_APP_API;

const DebitCreditNote = () => {

  //GET values from the session
  const companyCode = sessionStorage.getItem("Company_Code");
  const Year_Code = sessionStorage.getItem("Year_Code");
  const username = sessionStorage.getItem("username");
  const Post_Date = sessionStorage.getItem("Post_Date")
  const Inword_Date = sessionStorage.getItem("Inword_Date")
  const Outword_Date = sessionStorage.getItem("Outword_Date")
  const TCSApplicable = sessionStorage.getItem("TCSApplicable");
  const User_Id = sessionStorage.getItem("User_ID");

  // Detail Help State Management
  const [users, setUsers] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMode, setPopupMode] = useState("add");
  const [selectedUser, setSelectedUser] = useState({});
  const [deleteMode, setDeleteMode] = useState(false);
  const [expacCode, setExpacCode] = useState("");
  const [expacAccoid, setExpacAccoid] = useState("");
  const [expacName, setExpacName] = useState("");
  const [itemCode, setItemCode] = useState("");
  const [itemCodeAccoid, setItemCodeAccoid] = useState("");
  const [itemName, setItemName] = useState("");
  const [hsnNo, setHSNNo] = useState("");
  const [gstId, setGstId] = useState("");
  const [billNumber, setBillNo] = useState("");
  const [bill_ID, setBillId] = useState("");
  const [formDataDetail, setFormDataDetail] = useState({
    value: 0.0,
    Quantal: 0,
  });

  // Head Section State Managements
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
  const [label, setlabel] = useState("")
  const [qty, setQty] = useState("")
  const [isOpen, setIsOpen] = useState(false);

  // In utility page record doubleClicked that record show for edit functionality
  const location = useLocation();
  const navigate = useNavigate();

  const resizableRef = useRef(null);

  const searchParams = new URLSearchParams(location.search);
  const navigatedRecord = searchParams.get('navigatedRecord');
  const navigatedTranType = searchParams.get('navigatedTranType');

  // Resizer object at the time of resize the modal.
  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      entries.forEach(entry => {
      });
    });
    if (resizableRef.current) {
      observer.observe(resizableRef.current);
    }
    return () => observer.disconnect();
  }, []);

  const selectedRecord = location.state?.selectedRecord;
  const handleTransType = location.state?.tran_type;
  const permissions = location.state?.permissionsData;

  const setFocusTaskdate = useRef(null);

  const [tranType, setTranType] = useState(handleTransType);
  const [isHandleChange, setIsHandleChange] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const addButtonRef = useRef(null);
  const firstInputRef = useRef(null);
  const setFocusToFirstField = () => {
    if (firstInputRef.current) {
      firstInputRef.current.focus();
    }
  };

  const initialFormData = {
    doc_no: "",
    doc_date: new Date().toISOString().split("T")[0],
    ac_code: "",
    bill_no: "",
    bill_date: new Date().toISOString().split("T")[0],
    bill_id: "",
    bill_type: "",
    texable_amount: 0.0,
    gst_code: "",
    cgst_rate: 0.0,
    cgst_amount: 0.0,
    sgst_rate: 0.0,
    sgst_amount: 0.0,
    igst_rate: 0.0,
    igst_amount: 0.0,
    bill_amount: 0.0,
    Company_Code: companyCode,
    Year_Code: Year_Code,
    Branch_Code: "",
    Created_By: "",
    Modified_By: "",
    misc_amount: 0.0,
    ac: "",
    ASNNO: "",
    Ewaybillno: "",
    Narration: "",
    Shit_To: 0,
    Mill_Code: 0,
    st: 0,
    mc: 0,
    ackno: "",
    Unit_Code: 0,
    uc: 0,
    TCS_Rate: 0.0,
    TCS_Amt: 0.0,
    TCS_Net_Payable: 0.0,
    TDS_Rate: 0.0,
    TDS_Amt: 0.0,
    tran_type: tranType ? tranType : "DN"
  };

  // ----------------------------------------------Debit Credit Note Head section Functionality---------------------------------------.
  const [formData, setFormData] = useState(initialFormData);
  const [billFrom, setBillFrom] = useState("");
  const [billTo, setBillTo] = useState("");
  const [mill, setMill] = useState("");
  const [shipTo, setShipTo] = useState("");
  const [gstCode, setGstCode] = useState("");
  const [GstRate, setGstRate] = useState(0.0);
  const [matchStatus, setMatchStatus] = useState(null);

  //Lock-Unlock record functionality
  const { isRecordLockedByUser, lockRecord, unlockRecord } = useRecordLocking(formData.doc_no, formData.tran_type, companyCode, Year_Code, "DebitCredit_Note");

  const PostDateRecordLock = async () => {
    const type = tranType || formData.tran_type;
const Post_Date = sessionStorage.getItem("Post_Date")
 const Outword_Date = sessionStorage.getItem("Outword_Date")
  const Inword_Date = sessionStorage.getItem("Inword_Date")
    if (["CS", "DS"].includes(type)) {
      const isLocked = await InWordPostDateRecordLock(
        formData.doc_date,
        Post_Date,
        Inword_Date
      );
      if (isLocked) return true;
    }

    if (["CN", "DN"].includes(type)) {
      const isLocked = await OutwordPostDateRecordLock(
        formData.doc_date,
        Post_Date,
        Outword_Date
      );
      if (isLocked) return true;
    }

    return false;
  };



  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === "tran_type") {
      setTranType(value);
      setIsEditing(false);
      setIsEditMode(false);
      setAddOneButtonEnabled(true);
      setEditButtonEnabled(true);
      setDeleteButtonEnabled(true);
      setBackButtonEnabled(true);
      setSaveButtonEnabled(false);
      setCancelButtonEnabled(false);
      setCancelButtonClicked(true);
      (async () => {
        try {
          const response = await axios.get(`${API_URL}/get-lastdebitcreditnotedata?Company_Code=${companyCode}&Year_Code=${Year_Code}&tran_type=${value}`);
          if (response.status === 200) {
            updateFormData(response.data);
            HSN = response.data.last_details_data[0].HSN;
          } else {
            console.error("Failed to get Data:", response.status, response.statusText);
          }
        } catch (error) {
          console.error("Error during API call:", error);
        }
      })();
    } else {
      setFormData(prevData => ({
        ...prevData,
        [name]: value,
      }));
    }
  };


  //Calculations
  const handleKeyDownCalculations = async (event) => {
    if (event.key === "Tab") {
      const { name, value } = event.target;
      let gstRate = GstRate;
      if (!gstRate || gstRate === 0) {
        const cgstRate = parseFloat(formData.cgst_rate) || 0;
        const sgstRate = parseFloat(formData.sgst_rate) || 0;
        const igstRate = parseFloat(formData.igst_rate) || 0;
        gstRate = igstRate > 0 ? igstRate : cgstRate + sgstRate;
      }

      const matchStatus = await checkMatchStatus(
        formData.Shit_To || BillToCode,
        companyCode,
        Year_Code
      );

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

  //Date format OnChnage
  const handleDateChange = (event, fieldName) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      [fieldName]: event.target.value,
    }));
  };

  useEffect(() => {
    setFocusTaskdate.current.focus();
  }, []);

  const fetchLastRecord = () => {
    fetch(`${API_URL}/getNextdocnodebitcreditnote?Company_Code=${companyCode}&Year_Code=${Year_Code}&tran_type=${formData.tran_type || tranType}`)
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
        console.error("Error fetching record:", error);
      });
  };

  // Handle Add button Functionality
  const handleAddOne = async () => {
    setBillFrom("");
    setAddOneButtonEnabled(false);
    setSaveButtonEnabled(true);
    setCancelButtonEnabled(true);
    setEditButtonEnabled(false);
    setDeleteButtonEnabled(false);
    setIsEditMode(false);
    setIsEditing(true);
    fetchLastRecord();
    setFormData(initialFormData);
    // setTranType();
    setBillNo("");
    BillFromName = "";
    BillFormCode = "";
    BillToName = "";
    BillToCode = "";
    GSTName = "";
    GSTCode = "";
    MillName = "";
    MillCode = "";
    ShipToName = "";
    ShipToCode = "";
    Bill_No = "";
    Bill_Id = "";
    const effectiveTranType = tranType || formData.tran_type;
    setFormData((prevData) => ({
      ...prevData,
      tran_type: effectiveTranType
    }));
    setLastTenderDetails([]);
    setUsers([])
  };

  //Edit Functionality
  const handleEdit = async () => {
    if (await PostDateRecordLock()) {
      return
    }
    axios.get(`${API_URL}/getdebitcreditByid?Company_Code=${companyCode}&doc_no=${formData.doc_no}&tran_type=${tranType || formData.tran_type}&Year_Code=${Year_Code}`)
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
          return;
        } else {
          lockRecord()
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
        window.alert("Error fetching data");
      });
  };

  // Handle New record insert in database and update the record Functionality
  const handleSaveOrUpdate = async () => {
    if (await PostDateRecordLock()) {
      return
    }

    const accountingYearData = sessionStorage.getItem('Accounting_Year');
    const formattedEntryDate = formData.doc_date;
    const isValid = validateDocumentDate(formattedEntryDate, accountingYearData);

    if (!isValid) {
      return
    }

    let missingFields = [];
    if (!formData.ac_code) missingFields.push("Bill From");
    if (!formData.Shit_To) missingFields.push("Bill To");
    if (!formData.Mill_Code) missingFields.push("Mill Name");
    if (!formData.Unit_Code) missingFields.push("Ship To");

    if (missingFields.length > 0) {
      Swal.fire({
        title: "Error",
        text: `Please Select the following fields: ${missingFields.join(", ")}`,
        icon: "error",
        confirmButtonText: "OK"
      });
      return;
    }

    if (["CN", "CS",].includes(formData.tran_type || tranType || navigatedTranType)) {
      if (users.length === 0 || users.some(user => !user.Item_Code || user.Item_Code === 0 || !user.expac_code || user.expac_code === "0")) {
        Swal.fire({
          title: "Error",
          text: "Please select Item and Expense Account in detail section.",
          icon: "error",
          confirmButtonText: "OK"
        });
        return;
      }
    }

    if (users.length === 0 || users.every(user => user.rowaction === "DNU" || user.rowaction === "delete")) {
      Swal.fire({
        title: "Error",
        text: "Please add at least one entry in the detail grid.",
        icon: "error",
        confirmButtonText: "OK"
      });
      return;
    }

    setIsEditing(true);
    setIsLoading(true);
    let headData = {
      ...formData,
      gst_code: gstCode || GSTCode,
      tran_type: tranType || navigatedTranType
    };
    if (isEditMode) {
      headData = {
        ...headData,
        Modified_By: username,
        User_Id: User_Id
      }
      delete headData.dcid;
    }
    else {
      headData = {
        ...headData,
        Created_By: username
      }
    }

    const detailData = users.map((user) => {
      const isNew = !user.detail_Id;
      return {
        rowaction: isNew ? "add" : user.rowaction || "Normal",
        dcdetailid: user.dcdetailid,
        expac_code: user.expac_code,
        tran_type: tranType,
        value: user.value,
        expac: user.expac,
        detail_Id: isNew
          ? (Math.max(...users.map((u) => u.detail_Id || 0)) || 0) + 1
          : user.detail_Id,
        company_code: companyCode,
        year_code: Year_Code,
        Item_Code: user.Item_Code,
        Quantal: user.Quantal,
        ic: user.ic,
      };
    });

    const requestData = {
      headData,
      detailData,
    };

    try {
      if (isEditMode) {
        const updateApiUrl = `${API_URL}/update-debitCreditnote?dcid=${newDcid}`;
        const response = await axios.put(updateApiUrl, requestData);
        await unlockRecord();
        Swal.fire({
          title: "Success!",
          text: "Record updated successfully!",
          icon: "success",
          confirmButtonText: "OK"
        });

        setTimeout(() => {
          window.location.reload();
        }, 1000);
        navigate(`/debitcreditnote?navigatedRecord=${formData.doc_no}&navigatedTranType=${formData.tran_type || tranType}`);

      } else {
        const response = await axios.post(
          `${API_URL}/insert-debitcreditnote`,
          requestData
        );
        Swal.fire({
          title: "Success!",
          text: "Record Created successfully!",
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
        navigate(`/debitcreditnote?navigatedRecord=${formData.doc_no}&navigatedTranType=${formData.tran_type || tranType}`);

      }
    } catch (error) {
      toast.error("Error occurred while saving data");
    } finally {
      setIsEditing(false);
      setIsLoading(false);
    }
  };

  // Handle Delete the record from database functionality
  const handleDelete = async () => {
    if (await PostDateRecordLock()) {
      return
    }
    try {
      const getRecordUrl = `${API_URL}/getdebitcreditByid?Company_Code=${companyCode}&doc_no=${formData.doc_no}&tran_type=${tranType}&Year_Code=${Year_Code}`;
      const response = await axios.get(getRecordUrl);

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
        return;
      }

      const result = await Swal.fire({
        title: "Are you sure?",
        text: `You won't be able to revert this Doc No : ${formData.doc_no}`,
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

        const deleteApiUrl = `${API_URL}/delete_data_by_dcid?dcid=${newDcid}&Company_Code=${companyCode}&doc_no=${formData.doc_no}&Year_Code=${Year_Code}&tran_type=${tranType}&User_Id=${User_Id}`;
        const deleteResponse = await axios.delete(deleteApiUrl);

        if (deleteResponse.status === 200) {
          if (deleteResponse.data) {
            Swal.fire({
              title: "Deleted!",
              text: "Record deleted successfully!",
              icon: "success",
              confirmButtonText: "OK",
            });
            handleCancel();
          } else if (deleteResponse.status === 404) {
            toast.error("No data found for deletion");
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
        });
      }
    } catch (error) {
      console.error("Error during API call:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Utility function to handle common data extraction and state updates
  const updateFormData = (data) => {
    const lastHeadData = data.last_head_data;
    const lastDetailsData = data.last_details_data[0];

    setFormData((prevData) => ({
      ...prevData,
      ...lastHeadData,
    }));

    setLastTenderData(lastHeadData || {});
    setLastTenderDetails(data.last_details_data || []);

    // Assign the common data values
    newDcid = lastHeadData.dcid;
    BillFromName = lastDetailsData.BillFromName;
    BillFormCode = lastHeadData.ac_code;
    ShipToName = lastDetailsData.UnitAcName;
    ShipToCode = lastHeadData.Unit_Code;
    BillToName = lastDetailsData.BillToName;
    BillToCode = lastHeadData.Shit_To;
    GSTName = lastDetailsData.GST_Name;
    GSTCode = lastHeadData.gst_code;
    MillName = lastDetailsData.MillName;
    MillCode = lastHeadData.Mill_Code;
    ExpAcaccountName = lastDetailsData.expacaccountname;
    ExpAcaccountCode = lastDetailsData.expac_code;
    ItemCodeName = lastDetailsData.Item_Name;
    ItemCodeDetail = lastDetailsData.Item_Code;
    Bill_No = lastHeadData.bill_no;
    Bill_Id = lastHeadData.bill_id;
  };

  // Handle Cancel button clicked show the last record for edit functionality
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
        `${API_URL}/get-lastdebitcreditnotedata?Company_Code=${companyCode}&Year_Code=${Year_Code}&tran_type=${tranType}`
      );
      if (response.status === 200) {
        updateFormData(response.data);
      } else {
        console.error(
          "Failed to fetch data!",
          response.status,
          response.statusText
        );
      }
      HSN = response.data.last_details_data[0].HSN;
      unlockRecord();
    } catch (error) {
      if (error.response && error.response.status === 404) {
        Swal.fire({
          icon: "warning",
          title: "Data not found.!",
          confirmButtonColor: "#d33",
        });
      } else {
        console.log(`An error occurred while fetching data.`)
      }
    }
  };

  // Handle back to Utility page
  const handleBack = () => {
    navigate("/debitcreditnote-utility");
  };

  // Navigation APIS
  const handleFirstButtonClick = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/get-firstdebitcredit-navigation?Company_Code=${companyCode}&Year_Code=${Year_Code}&tran_type=${tranType}`
      );
      if (response.status === 200) {
        updateFormData(response.data);
      } else {
        console.error(
          "Failed to fetch data:",
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
        `${API_URL}/get-lastdebitcredit-navigation?Company_Code=${companyCode}&Year_Code=${Year_Code}&tran_type=${tranType}`
      );
      if (response.status === 200) {
        updateFormData(response.data);
      } else {
        console.error(
          "Failed to fetch data",
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
        `${API_URL}/get-nextdebitcreditnote-navigation?Company_Code=${companyCode}&Year_Code=${Year_Code}&tran_type=${tranType}&doc_no=${formData.doc_no}`
      );
      if (response.status === 200) {
        updateFormData(response.data);
      } else {
        console.error(
          "Failed to fetch data",
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
        `${API_URL}/get-previousDebitcreditnote-navigation?Company_Code=${companyCode}&Year_Code=${Year_Code}&tran_type=${tranType}&doc_no=${formData.doc_no}`
      );
      if (response.status === 200) {
        updateFormData(response.data);
      } else {
        console.error(
          "Failed to fetch data",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error during API call:", error);
    }
  };

  //Gledger onCliked show record
  const handleNavigateRecord = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/getdebitcreditByid?Company_Code=${companyCode}&doc_no=${navigatedRecord}&tran_type=${navigatedTranType}&Year_Code=${Year_Code}`
      );
      updateFormData(response.data);
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
      console.error("Error fetching data:", error);
    }
  };

  // Handle form submission.
  const handleSubmit = (event) => {
    event.preventDefault();
  };

  //Record DoubleCliked.
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

  // After Record DoubleClicked on utility page show that record on User Creation for Edit Mode
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
        `${API_URL}/getdebitcreditByid?doc_no=${selectedRecord.doc_no}&Company_Code=${companyCode}&Year_Code=${Year_Code}&tran_type=${selectedRecord.tran_type}`
      );
      if (response.status === 200) {
        updateFormData(response.data);
        setTranType(selectedRecord.tran_type);
      } else {
        console.error(
          "Failed to fetch data",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error during API call:", error);
    }
  };

  // Change No functionality to get that particular record
  const handleKeyDown = async (event) => {
    if (event.key === "Tab") {
      const changeNoValue = event.target.value;
      try {
        const response = await axios.get(
          `${API_URL}/getdebitcreditByid?Company_Code=${companyCode}&doc_no=${changeNoValue}&tran_type=${tranType}&Year_Code=${Year_Code}`
        );
        updateFormData(response.data);
        setIsEditing(false);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }
  };

  //--------------------------------------------Debit Credit Note Detail Functionality--------------------------------------------------
  useEffect(() => {
    if (selectedRecord) {
      setUsers(
        lastTenderDetails.map((detail) => ({
          Item_Code: detail.Item_Code,
          rowaction: "Normal",
          expac_code: detail.expac_code,
          expacName: detail.expacName,
          expac: detail.expac,
          ic: detail.ic,
          itemName: itemName,
          id: detail.dcdetailid,
          dcdetailid: detail.dcdetailid,
          value: detail.value,
          HSN: hsnNo || detail.HSN,
          Quantal: detail.Quantal,
          detail_Id: detail.dcdetailid
        }))
      );
    }
  }, [selectedRecord, lastTenderDetails]);

  useEffect(() => {
    if (lastTenderDetails.length > 0) {
      const updatedUsers = lastTenderDetails.map((detail) => {
        const existingUser = users.find(
          (user) => user.detail_Id === detail.detail_Id
        );
        return {
          id: detail.dcdetailid || existingUser?.id || Math.max(...users.map(user => user.id || 0), 0) + 1,
          dcdetailid: detail.dcdetailid,
          Quantal: detail.Quantal || existingUser?.Quantal || 0,
          value: detail.value || existingUser?.value || 0,
          Item_Code: detail.Item_Code || existingUser?.Item_Code || "",
          itemName: detail.Item_Name || existingUser?.Item_Name || "",
          ic: detail.ic || existingUser?.ic || 0,
          expac_code: detail.expac_code || existingUser?.expac_code || "",
          expacName: detail.expacaccountname || existingUser?.expacName || "",
          expac: detail.expac || existingUser?.expac || "",
          rowaction: existingUser?.rowaction || "Normal",
          detail_Id: detail.dcdetailid,
          HSN: detail.HSN || existingUser?.HSN || "",
        };
      });
      setUsers(updatedUsers);
    }
  }, [lastTenderDetails]);

  // Function to handle changes in the form fields
  const handleChangeDetail = (event) => {
    const { name, value } = event.target;
    setFormDataDetail({
      ...formDataDetail,
      [name]: value,
    });
  };

  // Open popup function
  const openPopup = (mode) => {
    setPopupMode(mode);
    setShowPopup(true);
    if (mode === "add") {
      clearForm();
    }
  };

  // Close popup function
  const closePopup = () => {
    setShowPopup(false);
    setSelectedUser({});
    clearForm();
  };

  const clearForm = () => {
    setFormDataDetail({
      value: 0.0,
      Quantal: 0,
    });
    setExpacCode("");
    setExpacName("");
    setItemCode("");
    setItemName("");
    setHSNNo("");
  };

  const editUser = (user) => {
    setSelectedUser(user);
    setExpacCode(user.expac_code);

    setExpacName(user.expacName);

    setItemCode(user.Item_Code);
    setItemName(user.itemName);
    setFormDataDetail({
      value: user.value || 0.0,
      HSN: user.HSN || hsnNo,
      Quantal: user.Quantal || 0,
    });
    openPopup("edit");
  };

  //Add Record
  const addUser = async () => {
    const newUser = {
      id: users.length > 0 ? Math.max(...users.map((user) => user.id)) + 1 : 1,
      expac_code: expacCode,
      expac: expacAccoid,
      ic: itemCodeAccoid,
      expacName: expacName,
      Item_Code: itemCode,
      itemName: itemName,
      HSN: hsnNo || formDataDetail.HSN,
      Quantal: formDataDetail.Quantal,
      value: parseFloat(formDataDetail.value) || 0,
      ...formDataDetail,
      rowaction: "add",
    };

    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);

    const totalTaxableAmount = calculateTotalTaxableAmount(updatedUsers);
    let updatedFormData = { ...formData, texable_amount: totalTaxableAmount };

    const matchStatus = await checkMatchStatus(
      updatedFormData.Shit_To,
      companyCode,
      Year_Code
    );

    // Calculate GST rate from existing rates if GstRate is not set
    let gstRate = GstRate;
    if (!gstRate || gstRate === 0) {
      const cgstRate = parseFloat(formData.cgst_rate) || 0;
      const sgstRate = parseFloat(formData.sgst_rate) || 0;
      const igstRate = parseFloat(formData.igst_rate) || 0;
      gstRate = igstRate > 0 ? igstRate : cgstRate + sgstRate;
    }

    updatedFormData = await calculateDependentValues(
      "gst_code",
      gstRate,
      updatedFormData,
      matchStatus,
      gstRate
    );

    setFormData(updatedFormData);
    closePopup();
    setTimeout(() => {
      addButtonRef.current.focus();
    }, 500)
  };

  // Update Record
  const updateUser = async () => {
    setTimeout(() => {
      addButtonRef.current.focus();
    }, 500)
    const updatedUsers = users.map((user) => {
      if (user.id === selectedUser.id) {
        const updatedRowaction =
          user.rowaction === "Normal" ? "update" : user.rowaction;
        return {
          ...user,
          expac_code: expacCode,
          Item_Code: itemCode,
          itemName: itemName,
          expac: expacAccoid,
          expacName: expacName,
          value: parseFloat(formDataDetail.value) || 0,
          HSN: hsnNo || formDataDetail.HSN,
          Quantal: formDataDetail.Quantal || 0,
          rowaction: updatedRowaction,
          ic: itemCodeAccoid
        };
      }
      return user;
    });

    setUsers(updatedUsers);
    const totalTaxableAmount = calculateTotalTaxableAmount(updatedUsers);
    let updatedFormData = { ...formData, texable_amount: totalTaxableAmount };

    const matchStatus = await checkMatchStatus(
      updatedFormData.Shit_To,
      companyCode,
      Year_Code
    );

    let gstRate = GstRate;
    if (!gstRate || gstRate === 0) {
      const cgstRate = parseFloat(formData.cgst_rate) || 0;
      const sgstRate = parseFloat(formData.sgst_rate) || 0;
      const igstRate = parseFloat(formData.igst_rate) || 0;
      gstRate = igstRate > 0 ? igstRate : cgstRate + sgstRate;
    }
    updatedFormData = await calculateDependentValues(
      "gst_code",
      gstRate,
      updatedFormData,
      matchStatus,
      gstRate
    );

    setFormData(updatedFormData);
    closePopup();
  };

  // Delete Record
  const deleteModeHandler = async (user) => {
    setDeleteMode(true);
    setSelectedUser(user);
    let updatedUsers;

    if (isEditMode && user.rowaction === "add") {
      updatedUsers = users.map((u) =>
        u.id === user.id ? { ...u, rowaction: "DNU" } : u
      );
    } else if (isEditMode) {
      updatedUsers = users.map((u) =>
        u.id === user.id ? { ...u, rowaction: "delete" } : u
      );
    } else {
      updatedUsers = users.map((u) =>
        u.id === user.id ? { ...u, rowaction: "DNU" } : u
      );
    }
    setUsers(updatedUsers);
    setSelectedUser({});
    const totalTaxableAmount = calculateTotalTaxableAmount(updatedUsers);
    let updatedFormData = { ...formData, texable_amount: totalTaxableAmount };
    const matchStatus = await checkMatchStatus(
      updatedFormData.Shit_To,
      companyCode,
      Year_Code
    );
    let gstRate = GstRate;
    if (!gstRate || gstRate === 0) {
      const cgstRate = parseFloat(formData.cgst_rate) || 0;
      const sgstRate = parseFloat(formData.sgst_rate) || 0;
      const igstRate = parseFloat(formData.igst_rate) || 0;
      gstRate = igstRate > 0 ? igstRate : cgstRate + sgstRate;
    }
    updatedFormData = await calculateDependentValues(
      "gst_code",
      gstRate,
      updatedFormData,
      matchStatus,
      gstRate
    );
    setFormData(updatedFormData);
  };

  // Functionality After delete record undo deleted record
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
    const totalTaxableAmount = calculateTotalTaxableAmount(updatedUsers);
    let updatedFormData = { ...formData, texable_amount: totalTaxableAmount };
    const matchStatus = await checkMatchStatus(
      updatedFormData.Shit_To,
      companyCode,
      Year_Code
    );

    let gstRate = GstRate;
    if (!gstRate || gstRate === 0) {
      const cgstRate = parseFloat(formData.cgst_rate) || 0;
      const sgstRate = parseFloat(formData.sgst_rate) || 0;
      const igstRate = parseFloat(formData.igst_rate) || 0;
      gstRate = igstRate > 0 ? igstRate : cgstRate + sgstRate;
    }
    updatedFormData = await calculateDependentValues(
      "gst_code",
      gstRate,
      updatedFormData,
      matchStatus,
      gstRate
    );
    setFormData(updatedFormData);
  };

  // Functionality to help section to set the record
  const handleItemCode = (code, accoid, HSN, name) => {
    setItemCode(code);
    setItemCodeAccoid(accoid);
    setHSNNo(HSN);
    setItemName(name);
  };

  // Handle changes in the Mill_Code input (assuming SystemMasterHelp handles its own state
  const handleExpAcCode = (code, accoid, name) => {
    setExpacCode(code);
    setExpacAccoid(accoid);
    setExpacName(name);
    const updatedUsers = users.map((user) => {
      if (user.expac_code === code) {
        return {
          ...user,
          expac: accoid,
          expacName: name,
        };
      }
      return user;
    });
    setUsers(updatedUsers);
  };

  //Check Status
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
      console.error("Error checking GST State Code match.");

      return error;
    }
  };

  const handleBillTo = async (code, accoid) => {
    setBillTo(code);
    let updatedFormData = {
      ...formData,
      Shit_To: code,
      st: accoid,
    };
    try {
      const matchStatusResult = await checkMatchStatus(
        code,
        companyCode,
        Year_Code
      );
      setMatchStatus(matchStatusResult);

      if (matchStatusResult === "TRUE") {
        console.log("GST State Codes match!");
      } else {
        console.log("GST State Codes do not match.");
      }

      let gstRate = GstRate;

      if (!gstRate || gstRate === 0) {
        const cgstRate = parseFloat(formData.cgst_rate) || 0;
        const sgstRate = parseFloat(formData.sgst_rate) || 0;
        const igstRate = parseFloat(formData.igst_rate) || 0;

        gstRate = igstRate > 0 ? igstRate : cgstRate + sgstRate;
      }

      updatedFormData = await calculateDependentValues(
        "gst_code",
        GstRate,
        updatedFormData,
        matchStatusResult,
        gstRate
      );
      setFormData(updatedFormData);
    } catch (error) {
      console.log("Error in handleBillTo:", error);
    }
  };

  const handleMillData = (code, accoid) => {
    setMill(code);
    setFormData({
      ...formData,
      Mill_Code: code,
      mc: accoid,
    });
  };

  const handleShipTo = (code, accoid) => {
    setShipTo(code);
    setFormData({
      ...formData,
      Unit_Code: code,
      uc: accoid,
    });
  };

  const handleBillFrom = async (code, accoid) => {
    setBillFrom(code);
    setFormData({
      ...formData,
      ac_code: code,
      ac: accoid,
    });
  };


  const handleGstCode = async (code, Rate) => {
    setGstCode(code);
    let rate = parseFloat(Rate);
    setFormData({
      ...formData,
      gst_code: code,
    });
    setGstRate(rate);

    const updatedFormData = {
      ...formData,
      gst_code: code,
    };

    try {
      const matchStatusResult = await checkMatchStatus(
        updatedFormData.Shit_To,
        companyCode,
        Year_Code
      );
      setMatchStatus(matchStatusResult);
      const newFormData = await calculateDependentValues(
        "gst_code",
        rate,
        updatedFormData,
        matchStatusResult,
        rate
      );

      setFormData(newFormData);
    } catch (error) { }
  };

  const calculateTotalTaxableAmount = (users) => {
    return users
      .filter((user) => user.rowaction !== "delete" && user.rowaction !== "DNU")
      .reduce((sum, user) => sum + parseFloat(user.value || 0), 0);
  };

  //Calculations
  const calculateDependentValues = async (
    name,
    input,
    formData,
    matchStatus,
    gstRate
  ) => {
    const updatedFormData = { ...formData, [name]: input };
    const taxableAmount = parseFloat(updatedFormData.texable_amount) || 0.0;
    const rate = gstRate;

    if (matchStatus === "TRUE") {
      updatedFormData.cgst_rate = (rate / 2).toFixed(2);
      updatedFormData.sgst_rate = (rate / 2).toFixed(2);
      updatedFormData.igst_rate = 0.0;

      updatedFormData.cgst_amount = (
        (taxableAmount * updatedFormData.cgst_rate) /
        100
      ).toFixed(2);
      updatedFormData.sgst_amount = (
        (taxableAmount * updatedFormData.sgst_rate) /
        100
      ).toFixed(2);
      updatedFormData.igst_amount = 0.0;
    } else {
      updatedFormData.igst_rate = rate.toFixed(2);
      updatedFormData.cgst_rate = 0.0;
      updatedFormData.sgst_rate = 0.0;

      updatedFormData.igst_amount = (
        (taxableAmount * updatedFormData.igst_rate) /
        100
      ).toFixed(2);
      updatedFormData.cgst_amount = 0.0;
      updatedFormData.sgst_amount = 0.0;
    }

    const miscAmount = parseFloat(updatedFormData.misc_amount) || 0.0;
    updatedFormData.bill_amount = (
      taxableAmount +
      parseFloat(updatedFormData.cgst_amount) +
      parseFloat(updatedFormData.sgst_amount) +
      parseFloat(updatedFormData.igst_amount) +
      miscAmount
    ).toFixed(2);

    const tcsRate = parseFloat(updatedFormData.TCS_Rate) || 0.0;
    updatedFormData.TCS_Amt = (
      (updatedFormData.bill_amount * tcsRate) /
      100
    ).toFixed(2);
    updatedFormData.TCS_Net_Payable = (
      parseFloat(updatedFormData.bill_amount) +
      parseFloat(updatedFormData.TCS_Amt)
    ).toFixed(2);

    const tdsRate = parseFloat(updatedFormData.TDS_Rate) || 0.0;
    updatedFormData.TDS_Amt = (
      (updatedFormData.texable_amount * tdsRate) /
      100
    ).toFixed(2);

    return updatedFormData;
  };

  const validateNumericInput = (e) => {
    e.target.value = e.target.value.replace(/[^0-9.,-]/g, '');
  };

  const handleBillNo = (billNo, billId) => {
    setBillNo(billNo);
    setBillId(billId);
    setFormData({
      ...formData,
      bill_no: billNo,
      bill_id: billId,
    });
  };

  const fetchedData = async (data) => {
    if (!data) {
      console.error("No data provided");
      return;
    }

    BillFromName = data.Party_Name || "";
    BillFormCode = data.Ac_Code || "";
    BillToCode = data.Bill_To !== 0 ? data.Bill_To : BillFormCode;
    BillToName = data.BillToName !== "" ? data.BillToName : BillFromName;
    MillName = data.MillName || "";
    MillCode = data.MillCode || "";
    ShipToCode = data.ShipTo !== 0 ? data.ShipTo : BillFormCode;
    ShipToName = data.ShipToName !== "" ? data.ShipToName : BillFromName;

    const dateParts = data.docdate.split("/");
    const formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;

    setFormData((prevData) => ({
      ...prevData,
      Shit_To: data.Bill_To || "",
      Mill_Code: data.MillCode || "",
      Unit_Code: data.ShipTo || "",
      texable_amount: (tranType === "CN" || tranType === "CS") ? (data.subTotal || 0) : prevData.texable_amount,
      // Qty: data.Qty || "",
      bill_date: formattedDate,
      TCS_Net_Payable: data.TCS_Net_Payable || 0,
      mc: data.mc,
      uc: data.uc !== 0 ? data.uc : data.ac,
      st: data.bt !== 0 ? data.bt : data.ac,
      Narration: `As per bill no ${data.doc_no} and bill date ${data.docdate}`

    }));
    setLastTenderData(data || {});

    if (tranType === "CN" || tranType === "CS") {
      const existingDetailIds = users
        .map((user) => user.detail_Id)
        .filter((id) => id != null);

      const isExisting = users.some((user) => user.detail_Id === data.detail_Id);

      const newDetailId = isExisting
        ? data.detail_Id
        : existingDetailIds.length > 0
          ? Math.max(...existingDetailIds) + 1
          : 1;

      const newId =
        users.length > 0 ? Math.max(...users.map((user) => user.id)) + 1 : 1;

      const newDetailData = {
        id: newId,
        value: parseFloat(data.subTotal) || 0,
        Quantal: data.Qty,
        detail_Id: newDetailId,
        rowaction: isExisting ? "update" : "add",
        dcdetailid: isExisting ? data.dcdetailid : undefined,
        ...(isExisting && data.dcdetailid ? { dcdetailid: data.dcdetailid } : {}),
      };

      const updatedUsers = isExisting
        ? users.map((user) =>
          user.detail_Id === data.detail_Id ? { ...user, ...newDetailData } : user
        )
        : [...users, newDetailData];

      setUsers(updatedUsers);

      setLastTenderDetails(updatedUsers || []);

      const totalTaxableAmount = calculateTotalTaxableAmount(updatedUsers);
      let updatedFormData = { ...formData, texable_amount: totalTaxableAmount };

      const matchStatus = await checkMatchStatus(
        updatedFormData.Shit_To,
        companyCode,
        Year_Code
      );

      let gstRate = GstRate;
      if (!gstRate || gstRate === 0) {
        const cgstRate = parseFloat(formData.cgst_rate) || 0;
        const sgstRate = parseFloat(formData.sgst_rate) || 0;
        const igstRate = parseFloat(formData.igst_rate) || 0;
        gstRate = igstRate > 0 ? igstRate : cgstRate + sgstRate;
      }

      updatedFormData = await calculateDependentValues(
        "gst_code",
        gstRate,
        updatedFormData,
        matchStatus,
        gstRate
      );
    }
    setlabel("Net Qty");
    setQty(data.Qty);
  };

  const handleGenerate = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };


  return (
    <>
      <UserAuditInfo
        createdBy={formData.Created_By}
        modifiedBy={formData.Modified_By}
        title={"Debit Credit Note"}
      />
      <ToastContainer autoClose={500} />
      <br></br>
      <div ref={resizableRef}>
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
          component={<div style={{ display: 'flex' }} >
            <DebitCreditNoteReport doc_no={formData.doc_no} tran_type={formData.tran_type} disabledFeild={isEditing && cancelButtonEnabled} />
            <div >
              <Button
                variant="contained"
                color="success"
                onClick={() => handleGenerate()}
                disabled={isEditing || formData.Ewaybillno !== ""}
                style={{ whiteSpace: 'nowrap' }}
              >
                Generate eInvoice
              </Button>
            </div>
            <Dialog open={isOpen} onClose={handleClose} maxWidth={650} >
              <DialogTitle style={{ textAlign: "center" }}>E-Invoice Generation</DialogTitle>
              <IconButton
                edge="end"
                color="inherit"
                onClick={handleClose}
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
                  do_no={0}
                  tran_type={formData.tran_type}
                  handleClose={handleClose}
                  Company_Code={companyCode}
                  Year_Code={Year_Code}
                />
              </DialogContent>
            </Dialog>
          </div>}
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
      </div>

      <form onSubmit={handleSubmit}>
        <div className="debitCreditNote-form">
          <Grid container spacing={1} mt={0.5}>
            <Grid item xs={12} sm={0.8}>
              <TextField
                label="Change No"
                name="changeNo"
                variant="outlined"
                fullWidth
                onKeyDown={handleKeyDown}
                disabled={!addOneButtonEnabled}
                size="small"
              />
            </Grid>

            <Grid item xs={12} sm={1}>
              <TextField
                label="Entry No"
                name="doc_no"
                variant="outlined"
                fullWidth
                value={formData.doc_no}
                onChange={handleChange}
                disabled
                inputRef={setFocusTaskdate}
                size="small"
              />
            </Grid>


            {/* <Grid item xs={12} sm={1.5}>
              <select
                id="tran_type"
                name="tran_type"
                label="Type"
                style={{ height: "40px" }}
                value={formData.tran_type || tranType}
                onChange={handleChange}
                disabled={isEditing && cancelButtonEnabled}
              >
                <option value="DN">Debit Note To Customer</option>
                <option value="CN">Credit Note To Customer</option>
                <option value="DS">Debit Note To Supplier</option>
                <option value="CS">Credit Note To Supplier</option>
              </select>
            </Grid> */}


            <div className="w-full sm:w-[12.5%] mt-2 ml-1">
              <select
                id="tran_type"
                name="tran_type"
                value={formData.tran_type || tranType}
                onChange={handleChange}
                disabled={isEditing && cancelButtonEnabled}
                className="w-full h-10 px-3 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="DN">Debit Note To Customer</option>
                <option value="CN">Credit Note To Customer</option>
                <option value="DS">Debit Note To Supplier</option>
                <option value="CS">Credit Note To Supplier</option>
              </select>
            </div>


            <Grid item xs={12} sm={4} md={1} sx={{ padding: 0.5, minWidth: '100px', maxWidth: '100px' }}>
              <TextField
                label="Entry Date"
                type="date"
                name="doc_date"
                variant="outlined"
                fullWidth
                value={formData.doc_date}
                onChange={(e) => handleDateChange(e, "doc_date")}
                disabled={!isEditing && addOneButtonEnabled}
                InputLabelProps={{
                  style: { fontSize: '12px' },
                }}
                InputProps={{
                  style: { fontSize: '12px', height: '35px' },
                }}
                inputRef={setFocusTaskdate}
                size="small"
              />
            </Grid>
            <div className="debitCreditNote-row">
              <label htmlFor="Bill_From" className="label" >
                Bill From:
              </label>
              <div >
                <div >
                  <AccountMasterHelp
                    onAcCodeClick={handleBillFrom}
                    CategoryName={BillFromName}
                    CategoryCode={BillFormCode}
                    name="ac_code"
                    Ac_type={[]}
                    disabledFeild={!isEditing && addOneButtonEnabled}
                  />
                </div>
              </div>
            </div>
          </Grid>
        </div>
        <div className="debitCreditNote-row" style={{ marginTop: "10px" }}>
          <label htmlFor="Bill_No" className="label" >
            Bill No :
          </label>
          <div className="debitCreditNote-col">
            <div className="debitCreditNote-form-group">
              <DebitCreditNoteHelp
                onAcCodeClick={handleBillNo}
                name="Bill_No"
                ac_code={billFrom || formData.ac_code}
                billNo={Bill_No}
                billId={Bill_Id}
                OnFetchedData={fetchedData}
                disabledFeild={!isEditing && addOneButtonEnabled}
                tran_type={tranType}
              />
            </div>
          </div>
          <div className="debitdate">
            <div className="debitCreditNote-row">
              <label className="label">Bill Date :</label>
              <div >
                <div >
                  <input
                    type="date"
                    id="datePicker"
                    name="bill_date"
                    value={formData.bill_date}
                    onChange={(e) => handleDateChange(e, "bill_date")}
                    disabled={!isEditing && addOneButtonEnabled}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="debitCreditNote-row" style={{ marginTop: "5px" }}>
          <label htmlFor="Bill_To" className="label">
            Bill To :
          </label>
          <div className="debitCreditNote-col">
            <div className="debitCreditNote-form-group">
              <AccountMasterHelp
                onAcCodeClick={handleBillTo}
                CategoryName={BillToName}
                CategoryCode={BillToCode}
                name="Bill_To"
                Ac_type={[]}
                disabledFeild={!isEditing && addOneButtonEnabled}
              />
            </div>
          </div>
        </div>

        <div className="debitCreditNote-row">
          <label htmlFor="Mill" className="label">
            Mill Name :
          </label>
          <div className="debitCreditNote-col">
            <div className="debitCreditNote-form-group">
              <AccountMasterHelp
                onAcCodeClick={handleMillData}
                CategoryName={MillName}
                CategoryCode={MillCode}
                name="Mill"
                Ac_type={[]}
                disabledFeild={!isEditing && addOneButtonEnabled}
              />
            </div>
          </div>
        </div>

        <div className="debitCreditNote-row">
          <label htmlFor="Ship_To" className="label">
            Ship To :
          </label>
          <div className="debitCreditNote-col">
            <div className="debitCreditNote-form-group">
              <AccountMasterHelp
                onAcCodeClick={handleShipTo}
                CategoryName={ShipToName}
                CategoryCode={ShipToCode}
                name="Ship_To"
                Ac_type={[]}
                disabledFeild={!isEditing && addOneButtonEnabled}
              />
            </div>
          </div>
        </div>

        <div className="debitCreditNote-row">
          <label htmlFor="Ship_To" className="label">
            GST Rate :
          </label>
          <div className="debitCreditNote-col">
            <div className="debitCreditNote-form-group">
              <GSTRateMasterHelp
                onAcCodeClick={handleGstCode}
                GstRateName={GSTName}
                GstRateCode={GSTCode || formData.gst_code}
                name="gst_code"
                disabledFeild={!isEditing && addOneButtonEnabled}
              />
            </div>
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

        <div >
          <div style={{ marginTop: "10px" }}>
            <AddButton openPopup={openPopup} isEditing={isEditing} ref={addButtonRef} setFocusToFirstField={setFocusToFirstField} />
          </div>
          {showPopup && (
            <div className="modalmain" role="dialog" style={{ display: "block" }}>
              <div className="debitcreditnodemodaldialog" role="document">
                <div >
                  <div className="debitcreditnodemodaldialog-header">
                    <h5 className="debitcreditnodemodaldialog-title">
                      {selectedUser.id ? "Update Debit Credit Note" : "Add Debit Credit Note"}
                    </h5>
                    <button
                      type="button"
                      onClick={closePopup}
                      aria-label="Close"
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "4px"
                      }}
                    >
                      <span aria-hidden="true">&times;</span>
                    </button>
                  </div>
                  <div >
                    <form className="debitCreditForm">
                      <div className="debitCreditNote-row" style={{ marginLeft: "-10px" }}>
                        <label className="label">Exp A/c Code :</label>
                        <div className="form-element">
                          <AccountMasterHelp
                            onAcCodeClick={handleExpAcCode}
                            CategoryName={expacName}
                            CategoryCode={expacCode}
                            name="expac_code"
                            Ac_type=""
                            className="account-master-help"
                            firstInputRef={firstInputRef}
                          />
                        </div>
                      </div>

                      <div className="debitCreditNote-row">
                        <label className="label">Item Code :</label>
                        <div className="form-element">
                          <SystemHelpMaster
                            onAcCodeClick={handleItemCode}
                            CategoryName={itemName}
                            CategoryCode={itemCode}
                            name="Item_Code"
                            SystemType="I"
                          />
                        </div>
                      </div>

                      <div className="debitCreditNote-row" style={{ marginBottom: "10px" }}>
                        <label className="label" style={{ marginLeft: "10px" }}>
                          Value :
                        </label>
                        <div >
                          <div>
                            <input
                              type="text"
                              name="value"
                              autoComplete="off"
                              value={formDataDetail.value || 0.0}
                              onChange={handleChangeDetail}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="debitCreditNote-row">
                        <label className="label" style={{ marginLeft: "10px" }}>HSN :</label>
                        <div>
                          <div>
                            <input
                              type="text"
                              name="HSN"
                              autoComplete="off"
                              value={formDataDetail.HSN || hsnNo}
                              onChange={handleChangeDetail}
                            />
                          </div>
                        </div>
                      </div>

                      <div style={{ marginTop: "20px" }}></div>
                      <div className="debitCreditNote-row">
                        <label className="label" style={{ marginLeft: "10px" }}>
                          Quantal :
                        </label>
                        <div >
                          <div >
                            <input
                              type="text"
                              name="Quantal"
                              autoComplete="off"
                              value={formDataDetail.Quantal || 0}
                              onChange={handleChangeDetail}
                            />
                          </div>
                        </div>
                      </div>
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

          <TableContainer component={Paper} style={{ marginTop: '16px', width: '70%', marginBottom: "10px" }}>
            <Table sx={{ minWidth: 650 }} aria-label="user table">
              <TableHead>
                <TableRow>
                  <TableCell sx={headerCellStyle}>Actions</TableCell>
                  <TableCell sx={headerCellStyle}>Rowaction</TableCell>
                  <TableCell sx={headerCellStyle}>ID</TableCell>
                  <TableCell sx={headerCellStyle}>Expac Code</TableCell>
                  <TableCell sx={headerCellStyle}>Expac Name</TableCell>
                  <TableCell sx={headerCellStyle}>Item Code</TableCell>
                  <TableCell sx={headerCellStyle}>Item Name</TableCell>
                  <TableCell sx={headerCellStyle}>Value</TableCell>
                  <TableCell sx={headerCellStyle}>HSN</TableCell>
                  <TableCell sx={headerCellStyle}>Quantal</TableCell>
                  <TableCell sx={headerCellStyle}>DC Detail ID</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} sx={{
                    height: '30px', '&:hover': {
                      backgroundColor: '#f3f388',
                      cursor: "pointer",
                    },
                  }}>
                    <TableCell sx={{ padding: '4px 8px' }}>
                      {user.rowaction === 'add' || user.rowaction === 'update' || user.rowaction === 'Normal' ? (
                        <>
                          <EditButton editUser={editUser} user={user} isEditing={isEditing} />
                          <DeleteButton deleteModeHandler={deleteModeHandler} user={user} isEditing={isEditing} />
                        </>
                      ) : user.rowaction === 'DNU' || user.rowaction === 'delete' ? (
                        <OpenButton openDelete={openDelete} user={user} />
                      ) : null}
                    </TableCell>
                    <TableCell sx={{ padding: '4px 8px' }}>{user.rowaction}</TableCell>
                    <TableCell sx={{ padding: '4px 8px' }}>{user.id}</TableCell>
                    <TableCell sx={{ padding: '4px 8px' }}>{user.expac_code}</TableCell>
                    <TableCell sx={{ padding: '4px 8px' }}>{user.expacName}</TableCell>
                    <TableCell sx={{ padding: '4px 8px' }}>{user.Item_Code}</TableCell>
                    <TableCell sx={{ padding: '4px 8px' }}>{user.itemName}</TableCell>
                    <TableCell sx={{ padding: '4px 8px' }}>{formatReadableAmount(user.value)}</TableCell>
                    <TableCell sx={{ padding: '4px 8px' }}>{user.HSN}</TableCell>
                    <TableCell sx={{ padding: '4px 8px' }}>{formatReadableAmount(user.Quantal)}</TableCell>
                    <TableCell sx={{ padding: '4px 8px' }}>{user.dcdetailid}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
        <br></br>
        <div className="debitCreditNote-row">
          <div className="debitCreditNote-col">
            <div className="debitCreditNote-form-group">
              <Grid container spacing={1}>
                <Grid item xs={12} sm={2}>
                  <TextField
                    label="ASN No"
                    name="ASNNO"
                    variant="outlined"
                    fullWidth
                    value={formData.ASNNO}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    autoComplete="off"
                    size="small"
                  />
                </Grid>

                <Grid item xs={12} sm={2} >
                  <TextField
                    label="EInvoice No"
                    name="Ewaybillno"
                    variant="outlined"
                    fullWidth
                    value={formData.Ewaybillno}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    autoComplete="off"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <TextField
                    label="ACK No"
                    name="ackno"
                    variant="outlined"
                    fullWidth
                    value={formData.ackno}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    autoComplete="off"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={1} ml={-1}>
                  <label style={{ fontWeight: 'bold' }}>{`${label}: ${qty}`}</label>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Narration"
                    name="Narration"
                    variant="outlined"
                    fullWidth
                    multiline
                    rows={2}
                    value={formData.Narration}
                    onChange={handleChange}
                    autoComplete="off"
                    size="small"
                    disabled={!isEditing && addOneButtonEnabled}
                  />
                </Grid>
              </Grid>
            </div>
          </div>
        </div>

        <div className="debitcredit-taxation" style={{ marginBottom: "40px" }} >
          <Grid container spacing={1} mt={-25} sx={{ textAlign: 'left' }}>
            <Grid container spacing={1} justifyContent="flex-end" alignItems="center"  >
              <Grid item xs={1}>
                <label className="debitCreditNote-form-label">Taxable Amount :</label>
              </Grid>
              <Grid item xs={12} sm={2}>
                <TextField
                  type="text"
                  variant="outlined"
                  fullWidth
                  name="texable_amount"
                  autoComplete="off"
                  value={formData.texable_amount}
                  onChange={handleChange}
                  onKeyDown={handleKeyDownCalculations}
                  disabled={!isEditing && addOneButtonEnabled}
                  size="small"
                  inputProps={{
                    sx: { textAlign: 'right' },
                    inputMode: 'decimal',
                    pattern: '[0-9]*[.,]?[0-9]+',
                    onInput: validateNumericInput,
                  }}
                />
              </Grid>
            </Grid>

            <Grid container spacing={1} style={{ marginTop: '-6px' }} justifyContent="flex-end" alignItems="center">
              <Grid item xs={1}>
                <label className="debitCreditNote-form-label">CGST :</label>
              </Grid>
              <Grid item xs={12} sm={1}>
                <TextField
                  type="text"
                  variant="outlined"
                  fullWidth
                  name="cgst_rate"
                  autoComplete="off"
                  value={formData.cgst_rate}
                  onChange={handleChange}
                  onKeyDown={handleKeyDownCalculations}
                  disabled={!isEditing && addOneButtonEnabled}
                  size="small"
                  inputProps={{
                    sx: { textAlign: 'right' },
                    inputMode: 'decimal',
                    pattern: '[0-9]*[.,]?[0-9]+',
                    onInput: validateNumericInput,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={1}>
                <TextField
                  type="text"
                  variant="outlined"
                  fullWidth
                  name="cgst_amount"
                  autoComplete="off"
                  value={formData.cgst_amount}
                  onChange={handleChange}
                  onKeyDown={handleKeyDownCalculations}
                  disabled={!isEditing && addOneButtonEnabled}
                  size="small"
                  inputProps={{
                    sx: { textAlign: 'right' },
                    inputMode: 'decimal',
                    pattern: '[0-9]*[.,]?[0-9]+',
                    onInput: validateNumericInput,
                  }}
                />
              </Grid>
            </Grid>

            <Grid container spacing={1} justifyContent="flex-end" alignItems="center" style={{ marginTop: '-6px' }}>
              <Grid item xs={1}>
                <label className="debitCreditNote-form-label">SGST :</label>
              </Grid>
              <Grid item xs={12} sm={1}>
                <TextField
                  type="text"
                  variant="outlined"
                  fullWidth
                  name="sgst_rate"
                  autoComplete="off"
                  value={formData.sgst_rate}
                  onChange={handleChange}
                  onKeyDown={handleKeyDownCalculations}
                  disabled={!isEditing && addOneButtonEnabled}
                  size="small"
                  inputProps={{
                    sx: { textAlign: 'right' },
                    inputMode: 'decimal',
                    pattern: '[0-9]*[.,]?[0-9]+',
                    onInput: validateNumericInput,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={1}>
                <TextField
                  type="text"
                  variant="outlined"
                  fullWidth
                  name="sgst_amount"
                  autoComplete="off"
                  value={formData.sgst_amount}
                  onChange={handleChange}
                  onKeyDown={handleKeyDownCalculations}
                  disabled={!isEditing && addOneButtonEnabled}
                  size="small"
                  inputProps={{
                    sx: { textAlign: 'right' },
                    inputMode: 'decimal',
                    pattern: '[0-9]*[.,]?[0-9]+',
                    onInput: validateNumericInput,
                  }}
                />
              </Grid>
            </Grid>

            <Grid container spacing={1} justifyContent="flex-end" alignItems="center" style={{ marginTop: '-6px' }}>
              <Grid item xs={1}>
                <label className="debitCreditNote-form-label">IGST :</label>
              </Grid>
              <Grid item xs={12} sm={1}>
                <TextField
                  type="text"
                  variant="outlined"
                  fullWidth
                  name="igst_rate"
                  autoComplete="off"
                  value={formData.igst_rate}
                  onChange={handleChange}
                  onKeyDown={handleKeyDownCalculations}
                  disabled={!isEditing && addOneButtonEnabled}
                  size="small"
                  inputProps={{
                    sx: { textAlign: 'right' },
                    inputMode: 'decimal',
                    pattern: '[0-9]*[.,]?[0-9]+',
                    onInput: validateNumericInput,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={1}>
                <TextField
                  type="text"
                  variant="outlined"
                  fullWidth
                  name="igst_amount"
                  autoComplete="off"
                  value={formData.igst_amount}
                  onChange={handleChange}
                  onKeyDown={handleKeyDownCalculations}
                  disabled={!isEditing && addOneButtonEnabled}
                  size="small"
                  inputProps={{
                    sx: { textAlign: 'right' },
                    inputMode: 'decimal',
                    pattern: '[0-9]*[.,]?[0-9]+',
                    onInput: validateNumericInput,
                  }}
                />
              </Grid>
            </Grid>

            <Grid container spacing={1} justifyContent="flex-end" alignItems="center" style={{ marginTop: '-6px' }}>
              <Grid item xs={1}>
                <label className="debitCreditNote-form-label">MISC :</label>
              </Grid>
              <Grid item xs={12} sm={2}>
                <TextField
                  type="text"
                  variant="outlined"
                  fullWidth
                  name="misc_amount"
                  autoComplete="off"
                  value={formData.misc_amount}
                  onChange={handleChange}
                  onKeyDown={handleKeyDownCalculations}
                  disabled={!isEditing && addOneButtonEnabled}
                  size="small"
                  inputProps={{
                    sx: { textAlign: 'right' },
                    inputMode: 'decimal',
                    pattern: '[0-9]*[.,]?[0-9]+',
                    onInput: validateNumericInput,
                  }}
                />
              </Grid>
            </Grid>

            <Grid container spacing={1} justifyContent="flex-end" alignItems="center" style={{ marginTop: '-6px' }}>
              <Grid item xs={1}>
                <label className="debitCreditNote-form-label">Final Amount :</label>
              </Grid>
              <Grid item xs={12} sm={2}>
                <TextField
                  type="text"
                  variant="outlined"
                  fullWidth
                  name="bill_amount"
                  autoComplete="off"
                  value={formData.bill_amount}
                  onChange={handleChange}
                  onKeyDown={handleKeyDownCalculations}
                  disabled={!isEditing && addOneButtonEnabled}
                  size="small"
                  inputProps={{
                    sx: { textAlign: 'right' },
                    inputMode: 'decimal',
                    pattern: '[0-9]*[.,]?[0-9]+',
                    onInput: validateNumericInput,
                  }}
                />
              </Grid>
            </Grid>

            <Grid container spacing={1} justifyContent="flex-end" alignItems="center" style={{ marginTop: '-6px' }}>
              <Grid item xs={1}>
                <label className="debitCreditNote-form-label">TCS % :</label>
              </Grid>
              <Grid item xs={12} sm={1}>
                <TextField
                  type="text"
                  variant="outlined"
                  fullWidth
                  name="TCS_Rate"
                  autoComplete="off"
                  value={formData.TCS_Rate}
                  onChange={handleChange}
                  onKeyDown={handleKeyDownCalculations}
                  disabled={TCSApplicable !== 'Y' || (!isEditing && addOneButtonEnabled)}
                  size="small"
                  inputProps={{
                    sx: { textAlign: 'right' },
                    inputMode: 'decimal',
                    pattern: '[0-9]*[.,]?[0-9]+',
                    onInput: validateNumericInput,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={1}>
                <TextField
                  type="text"
                  variant="outlined"
                  fullWidth
                  name="TCS_Amt"
                  autoComplete="off"
                  value={formData.TCS_Amt}
                  onChange={handleChange}
                  onKeyDown={handleKeyDownCalculations}
                  disabled={TCSApplicable !== 'Y' || (!isEditing && addOneButtonEnabled)}
                  size="small"
                  inputProps={{
                    sx: { textAlign: 'right' },
                    inputMode: 'decimal',
                    pattern: '[0-9]*[.,]?[0-9]+',
                    onInput: validateNumericInput,
                  }}
                />
              </Grid>
            </Grid>

            <Grid container spacing={1} justifyContent="flex-end" alignItems="center" style={{ marginTop: '-6px' }}>
              <Grid item xs={1}>
                <label className="debitCreditNote-form-label">Net Payable :</label>
              </Grid>
              <Grid item xs={12} sm={2}>
                <TextField
                  type="text"
                  variant="outlined"
                  fullWidth
                  name="TCS_Net_Payable"
                  autoComplete="off"
                  value={formData.TCS_Net_Payable}
                  onChange={handleChange}
                  onKeyDown={handleKeyDownCalculations}
                  disabled={!isEditing && addOneButtonEnabled}
                  size="small"
                  inputProps={{
                    sx: { textAlign: 'right' },
                    inputMode: 'decimal',
                    pattern: '[0-9]*[.,]?[0-9]+',
                    onInput: validateNumericInput,
                  }}
                />
              </Grid>
            </Grid>

            <Grid container spacing={1} justifyContent="flex-end" alignItems="center" style={{ marginTop: '-6px' }} mb={10}>
              <Grid item xs={1}>
                <label className="debitCreditNote-form-label">TDS % :</label>
              </Grid>
              <Grid item xs={12} sm={1}>
                <TextField
                  type="text"
                  variant="outlined"
                  fullWidth
                  name="TDS_Rate"
                  autoComplete="off"
                  value={formData.TDS_Rate}
                  onChange={handleChange}
                  onKeyDown={handleKeyDownCalculations}
                  disabled={!isEditing && addOneButtonEnabled}
                  size="small"
                  inputProps={{
                    sx: { textAlign: 'right' },
                    inputMode: 'decimal',
                    pattern: '[0-9]*[.,]?[0-9]+',
                    onInput: validateNumericInput,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={1}>
                <TextField
                  type="text"
                  variant="outlined"
                  fullWidth
                  name="TDS_Amt"
                  autoComplete="off"
                  value={formData.TDS_Amt || ""}
                  onChange={handleChange}
                  onKeyDown={handleKeyDownCalculations}
                  disabled={!isEditing && addOneButtonEnabled}
                  size="small"
                  inputProps={{
                    sx: { textAlign: 'right' },
                    inputMode: 'decimal',
                    pattern: '[0-9]*[.,]?[0-9]+',
                    onInput: validateNumericInput,
                  }}
                />
              </Grid>
            </Grid>
          </Grid>
        </div>
      </form>
    </>
  );
};
export default DebitCreditNote;