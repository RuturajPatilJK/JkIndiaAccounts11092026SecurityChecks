import React from "react";
import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ActionButtonGroup from "../../../Common/CommonButtons/ActionButtonGroup";
import NavigationButtons from "../../../Common/CommonButtons/NavigationButtons";
import axios from "axios";
import {
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Typography, Box
} from "@mui/material";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AccountMasterHelp from "../../../Helper/AccountMasterHelp";
import RecieptVoucherNoHelp from "../../../Helper/RecieptVoucherNoHelp";
import GroupMasterHelp from "../../../Helper/SystemmasterHelp";
import "./RecieptPayment.css";
import { useRecordLocking } from "../../../hooks/useRecordLocking";
import UserAuditInfo from "../../../Common/UserAuditInfo/UserAuditInfo";
import AddButton from "../../../Common/Buttons/AddButton";
import EditButton from "../../../Common/Buttons/EditButton";
import DeleteButton from "../../../Common/Buttons/DeleteButton";
import OpenButton from "../../../Common/Buttons/OpenButton";
import DetailAddButtom from "../../../Common/Buttons/DetailAddButton";
import DetailCloseButton from "../../../Common/Buttons/DetailCloseButton";
import DetailUpdateButton from "../../../Common/Buttons/DetailUpdateButton";
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";
import RecieptPaymentReport from "./RecieptPaymentReport";
import Swal from "sweetalert2";
import { ConvertNumberToWord } from "../../../Common/FormatFunctions/ConvertNumberToWord";
import SaveUpdateSpinner from "../../../Common/Spinners/SaveUpdateSpinner";
import { PostDateRecordLock } from "../../../Common/PostDateLock/PostDateRangeCheck";
import { validateDocumentDate } from "../../../Common/ValidateDateRange/ValidateDateRange"
import io from "socket.io-client";
import { fetchAccountBalance } from "../../../Common/GetAccountBalance/GetAccountBalance";

const API_URL = process.env.REACT_APP_API;
const socketURL = process.env.REACT_APP_API_URL;

var lblbankname;
var newcashbank;
var newcredit_ac;
var lblacname;
var newUnitCode;
var lblUnitname;
var newAcadjAccode;
var lblAcadjAccodename;
var newVoucher_No;
var globalTotalAmount = 0.0;
var GroupCode = ""
var GroupName = ""
var TDSAcCode = ''
var lblTDSAc_Name = ''

//Common table Heading style
const headerCellStyle = {
  fontWeight: "bold",
  backgroundColor: "#3f51b5",
  color: "white",
  padding: "6px",
  "&:hover": {
    backgroundColor: "#303f9f",
    cursor: "pointer",
  },
};

const RecieptPayment = () => {
  //GET Values from session
  const companyCode = sessionStorage.getItem("Company_Code");
  const YearCode = sessionStorage.getItem("Year_Code");
  const username = sessionStorage.getItem("username");
  const Post_Date = sessionStorage.getItem("Post_Date")
  const User_Id = sessionStorage.getItem("User_ID");

  const [isLoading, setIsLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMode, setPopupMode] = useState("add");
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
  const [cashbankcode, setcashbankcode] = useState("");
  const [cashbankcodeid, setcashbankcodeid] = useState("");
  const [Creditcodecode, setCreditcodecode] = useState("");
  const [Creditcodecodeid, setCreditcodecodeid] = useState("");
  const [Creditcodecodename, setCreditcodecodename] = useState("");

  const [unitcodestate, setunitcodestate] = useState("");
  const [unitcodestateid, setunitcodestateid] = useState("");
  const [unitcodestatename, setunitcodestatename] = useState("");

  const [AcadjAccodenamecode, setAcadjAccodenamecode] = useState("");
  const [AcadjAccodenameid, setAcadjAccodenameid] = useState("");
  const [AcadjAccodenamename, setAcadjAccodenamename] = useState("");

  const [groupCode, setGroupCode] = useState('');
  const [gcId, setGCID] = useState('');
  const [groupName, setGroupName] = useState('');

  const [TDS_Ac, setTDSAc] = useState('');
  const [TDSAccoid, setTDSAccoid] = useState('');
  const [TDSAcName, setTDSAcName] = useState('');

  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState({});
  const [users, setUsers] = useState([]);
  let [TyanTypeState, setTyanTypeState] = useState("");
  const [secondSelectOptions, setSecondSelectOptions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("BR");
  const [VoucherNoState, setVoucherNoState] = useState("");
  const [tenderDetails, setTenderDetails] = useState({});
  const [lastTenderDetails, setLastTenderDetails] = useState([]);
  const [lastTenderData, setLastTenderData] = useState({});
  const [cashBankBalance, setCashBankBalance] = useState(0);
  const [accountBalance, setAccountBalance] = useState(0);

  const inputRef = useRef(null);

  const addButtonRef = useRef(null);
  const firstInputRef = useRef(null);

  const [amountInWords, setAmountInWords] = useState('');

  //SET focus to first input feild
  const setFocusToFirstField = () => {
    if (firstInputRef.current) {
      firstInputRef.current.focus();
      setAmountInWords('')
    }
  };

  //Navigation state
  const navigate = useNavigate();
  const location = useLocation();

  //Record Double Click
  const selectedRecord = location.state?.selectedRecord;
  const tranType = location.state?.tranType;
  const permissions = location.state?.permissionsData;

  const searchParams = new URLSearchParams(location.search);
  const navigatedRecord = searchParams.get('navigatedRecord');
  const navigatedTranType = searchParams.get('navigatedTranType');


  const options = {
    CP: [
      { value: "A", text: "--Select--" },
      { value: "T", text: "Against Transport Advance" },
      { value: "N", text: "Against Manualy Purchase" },
      { value: "O", text: "Against OnAc" },
      { value: "Z", text: "Advance Payment" },
      { value: "Q", text: "Other Payment" },
    ],
    BP: [
      { value: "A", text: "--Select--" },
      { value: "T", text: "Against Transport Advance" },
      { value: "N", text: "Against Manualy Purchase" },
      { value: "O", text: "Against OnAc" },
      { value: "Z", text: "Advance Payment" },
      { value: "Q", text: "Other Payment" },
    ],
    CR: [
      { value: "X", text: "Against RetailSale Bill" },
      { value: "Y", text: "Against SaleBill" },
      { value: "Q", text: "Other Payment" },
    ],
    BR: [
      { value: "S", text: "Against Sauda" },
      { value: "B", text: "Against SaleBill" },
      { value: "D", text: "Against Debit Note" },
      { value: "P", text: "Against Credit Bill" },
      { value: "O", text: "Against OnAc" },
      { value: "R", text: "OAgainst RetailSale Bill" },
      { value: "Q", text: "Other Payment" },
      { value: "F", text: "Against Proforma" }
    ],
  };

  const validateNumericInput = (e) => {
    e.target.value = e.target.value.replace(/[^0-9.-]/g, "");
  };

  const initialFormData = {
    tran_type: tranType ? tranType : "CP",
    doc_no: "",
    doc_date: new Date().toISOString().split("T")[0],
    cashbank: 0,
    total: 0,
    company_code: companyCode,
    year_code: YearCode,
    cb: 0,
    Created_By: "",
    Modified_By: "",
  };

  const [formData, setFormData] = useState(initialFormData);

  const [formDataDetail, setFormDataDetail] = useState({
    amount: 0,
    narration: "",
    narration2: "",
    detail_id: 1,
    Voucher_No: 0,
    Voucher_Type: "",
    Adjusted_Amount: 0.0,
    Tender_No: 0,
    drpFilterValue: "O",
    AcadjAmt: 0.0,
    TDS_Rate: 0.0,
    TDS_Amt: 0.0,
    GRN: "",
    TReceipt: "",
    tenderdetailid: 0

  });

  //record lock-unlock
  const { isRecordLockedByUser, lockRecord, unlockRecord } = useRecordLocking(
    formData.doc_no,
    formData.tran_type,
    companyCode,
    YearCode,
    "receipt_payment"
  );

  // Keep refs in sync so the socket handler (registered once on mount) can
  // read the *current* open record / edit state without going stale.
  const formDataRef = useRef(formData);
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  const isEditingRef = useRef(isEditing);
  useEffect(() => {
    isEditingRef.current = isEditing;
  }, [isEditing]);

  useEffect(() => {
    const socket = io(`${socketURL}`, {
      transports: ["websocket"],
    });
    socket.on("receipt_payment_added", (data) => {
      console.log("New Receipt Payment Added:", data);
    });
    socket.on("receipt_payment_updated", async (data) => {
      try {
        const { doc_no, tran_type } = data;
        if (!doc_no) return;

        const current = formDataRef.current;
        const isCurrentlyOpenRecord =
          String(current?.doc_no) === String(doc_no) &&
          current?.tran_type === tran_type;

        // Only refresh if this update is for the record actually on screen,
        // and only while it's being passively viewed, not while the user is
        // actively editing it (isEditing) — otherwise this would silently
        // overwrite in-progress, unsaved input.
        if (!isCurrentlyOpenRecord || isEditingRef.current) return;

        console.log("Receipt Payment Updated:", data);

        const url = `${API_URL}/getreceiptpaymentByid?Company_Code=${companyCode}&Year_Code=${YearCode}&tran_type=${tran_type}&doc_no=${doc_no}`;
        await handleNavigation(
          url,
          "receipt_payment_head",
          "receipt_payment_details"
        );

      } catch (error) {
        console.error("Error fetching updated tender after socket event:", error);
      }
    });

    socket.on("receipt_payment_deleted", (data) => {
      console.log("Receipt Payment Deleted:", data.tranid);
    });

    return () => {
      socket.off("receipt_payment_added");
      socket.off("receipt_payment_updated");
      socket.off("receipt_payment_deleted");
      socket.disconnect();
    };
  }, []);

  //state management for user input
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevState) => {
      const updatedFormData = { ...prevState, [name]: value };
      return updatedFormData;
    });
  };

  const handleCashBank = async (code, accoid) => {
    if (!code) {
      setcashbankcode("");
      setcashbankcodeid("");
      setCashBankBalance(0);
      return
    }
    setcashbankcode(code);
    setcashbankcodeid(accoid);
    setFormData({
      ...formData,
      cashbank: code,
      cb: accoid,
    });
    const { balance, gstNo } = await fetchAccountBalance(code);
    if (balance !== null) {
      setCashBankBalance(balance)
    }
  };

  const handleAcadjAccodename = (code, accoid, name) => {
    setAcadjAccodenamecode(code);
    setAcadjAccodenameid(accoid);
    setAcadjAccodenamename(name);
  };


  const handleTDSAc = (code, accoid, name) => {
    setTDSAc(code);
    setTDSAccoid(accoid);
    setTDSAcName(name);
  };

  const handleUnitCode = (code, accoid, name) => {
    setunitcodestate(code);
    setunitcodestateid(accoid);
    setunitcodestatename(name);
  };

  const handleAccode = async (code, accoid, name) => {
    if (!code) {
      setCreditcodecode("");
      setCreditcodecodeid("");
      setCreditcodecodename("");
      setAccountBalance(0);
      return
    }
    setCreditcodecode(code);
    setCreditcodecodeid(accoid);
    setCreditcodecodename(name);
    const { balance, gstNo } = await fetchAccountBalance(code);
    if (balance !== null) {
      setAccountBalance(balance);
    }
  };

  const handleGroupCode = (code, accoid, HSN, name) => {
    setGroupCode(code);
    setGCID(accoid);
    setGroupName(name)
  };

  const handleDropdownvalueChange = (event) => {
    const { name, value } = event.target;
    setFormDataDetail((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  //GET Last record from the database
  const fetchLastRecord = () => {
    fetch(
      `${API_URL}/get_next_paymentRecord_docNo?Company_Code=${companyCode}&tran_type=${formData.tran_type || tranType
      }&Year_Code=${YearCode}`
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


  const handleDetailDropdownChange = (selectedValue) => {
    updateSecondSelect(selectedValue);
  };

  const updateSecondSelect = (selectedValue) => {
    setSelectedCategory(selectedValue);
    setSecondSelectOptions(options[selectedValue] || []);
  };

  const handleDropdownChange = async (event) => {
    const selectedValue = event.target.value;

    setTyanTypeState(selectedValue);
    setFormData((prevData) => ({
      ...prevData,
      tran_type: selectedValue,
    }));

    const url = `${API_URL}/get-lastreceiptpayment-navigation?Company_Code=${companyCode}&Year_Code=${YearCode}&tran_type=${selectedValue}`;
    await handleNavigation(url, "last_head_data", "last_details_data");
  };

  const handleAddOne = async () => {
    setAddOneButtonEnabled(false);
    setSaveButtonEnabled(true);
    setCancelButtonEnabled(true);
    setEditButtonEnabled(false);
    setDeleteButtonEnabled(false);
    setIsEditing(true);
    fetchLastRecord();
    setFormData(initialFormData);
    setLastTenderDetails([]);
    setAccountBalance(0)
    setCashBankBalance(0)
    globalTotalAmount = "";
    lblbankname = "";
    newcashbank = "";
    newcredit_ac = "";
    lblacname = "";
    newUnitCode = "";
    lblUnitname = "";
    newAcadjAccode = "";
    lblAcadjAccodename = "";
    TDSAcCode = '';
    lblTDSAc_Name = ''
    setCreditcodecodename("");
    setTDSAcName("");
    GroupName = "";
    GroupCode = "";

    const effectiveTranType = tranType || TyanTypeState || formData.tran_type;
    setFormData((prevData) => ({
      ...prevData,
      tran_type: effectiveTranType
    }));
    handleDetailDropdownChange(effectiveTranType);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  //Handle Save Or Update the information
  const handleSaveOrUpdate = async () => {
    const Post_Date = sessionStorage.getItem("Post_Date")
    if (await PostDateRecordLock(formData.doc_date, Post_Date)) {
      return;
    }

    const accountingYearData = sessionStorage.getItem('Accounting_Year');
    const formattedEntryDate = formData.doc_date;
    const isValid = validateDocumentDate(formattedEntryDate, accountingYearData);

    if (!isValid) {
      return
    }

    if (formData.cashbank === "" || formData.cashbank === 0) {
      await Swal.fire({
        title: "Error",
        text: "Please select Cash/Bank",
        icon: "error",
        confirmButtonText: "OK"
      });
      return;
    }

    // Check if there are any valid entries in the detail grid
    if (users.length === 0 || users.every(user => user.rowaction === "DNU" || user.rowaction === "delete")) {
      await Swal.fire({
        title: "Error",
        text: "Please add at least one entry in the detail grid.",
        icon: "error",
        confirmButtonText: "OK"
      });
      return;
    }



    const missingDetailIds = users
      .filter(u => (parseFloat(u.TDS_Amt) || 0) > 0)
      .filter(u => !u.TDSAc || u.TDSAc === 0 || u.TDSAc === "" || u.TDSAc === "0")
      .map(u => u.detail_id)
      .filter((v, i, a) => v != null && a.indexOf(v) === i); // unique + not null

    if (missingDetailIds.length > 0) {
      await Swal.fire({
        title: "Error",
        text: `Please select TDS Ac for ID(s): ${missingDetailIds.join(", ")}`,
        icon: "error",
        confirmButtonText: "OK"
      });
      return;
    }




    setIsLoading(true);
    try {
      let head_data = { ...formData };
      if (isEditMode) {
        head_data = {
          ...head_data,
          Modified_By: username,
          User_Id: User_Id
        };
      } else {
        head_data = {
          ...head_data,
          Created_By: username,
        };
      }
      const detail_data = users.map((user) => ({
        rowaction: user.rowaction,
        detail_id: user.detail_id,
        credit_ac: user.credit_ac,
        Unit_Code: user.Unit_Code,
        Voucher_No: user.Voucher_No,
        Voucher_Type: user.Voucher_Type,
        Tender_No: user.Tender_No,
        tenderdetailid: user.tenderdetailid,
        amount: user.amount,
        Adjusted_Amount: user.Adjusted_Amount,
        narration: user.narration,
        narration2: user.narration2,
        drpFilterValue: user.drpFilterValue,
        YearCodeDetail: user.YearCodeDetail,
        trandetailid: user.trandetailid,
        AcadjAmt: user.AcadjAmt || 0,
        Group_Code: user.Group_Code,
        AcadjAccode: user.AcadjAccode,
        ca: user.ca,
        uc: user.uc,
        ac: user.ac,
        gcid: user.gcid,
        TDS_Rate: user.TDS_Rate || 0,
        TDS_Amt: user.TDS_Amt || 0,
        GRN: user.GRN,
        TReceipt: user.TReceipt,
        Company_Code: companyCode,
        Year_Code: YearCode,
        TDSAc: user.TDSAc,
        TDSAcid: user.TDSAcid
      }));

      const requestData = {
        head_data: {
          ...head_data,
          tranid: isEditMode ? undefined : head_data.tranid,
        },
        detail_data,
      };

      const apiUrl = isEditMode
        ? `${API_URL}/update-receiptpayment?tranid=${formData.tranid}`
        : `${API_URL}/insert-receiptpayment`;

      const response = await axios[isEditMode ? "put" : "post"](
        apiUrl,
        requestData
      );

      if (response.status === 200 || response.status === 201) {

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

      }
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      navigate(`/receipt-payment?navigatedRecord=${formData.doc_no}&navigatedTranType=${formData.tran_type || tranType}`);
    } catch (error) {
      console.error("Error saving or updating data:", error);
      toast.error("An error occurred while saving or updating data.");
    } finally {
      setIsLoading(false);
    }
  };


  //Handle Edit the information
  const handleEdit = async () => {
    const Post_Date = sessionStorage.getItem("Post_Date")
    if (await PostDateRecordLock(formData.doc_date, Post_Date)) {
      return;
    }
    axios
      .get(
        `${API_URL}/getreceiptpaymentByid?Company_Code=${companyCode}&Year_Code=${YearCode}&tran_type=${formData.tran_type}&doc_no=${formData.doc_no}`
      )
      .then((response) => {
        const data = response.data;
        const isLockedNew = data.receipt_payment_head.LockedRecord;
        const isLockedByUserNew = data.receipt_payment_head.LockedUser;
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
          ...data.receipt_payment_head,
        });
        //       handleNavigation(
        //   `${API_URL}/getreceiptpaymentByid?Company_Code=${companyCode}&Year_Code=${YearCode}&tran_type=${formData.tran_type}&doc_no=${formData.doc_no}`,
        //   "receipt_payment_head",
        //   "receipt_payment_details"
        // );
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
        console.error(error);
      });
  };

  //Handle Cancel the information
  const handleCancel = async () => {
    const url = `${API_URL}/get-lastreceiptpayment-navigation?Company_Code=${companyCode}&Year_Code=${YearCode}&tran_type=${formData.tran_type || tranType
      }`;
    await handleNavigation(url, "last_head_data", "last_details_data");
    unlockRecord();
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

  //Handle Delete the information
  const handleDelete = async () => {
    const Post_Date = sessionStorage.getItem("Post_Date")
    if (await PostDateRecordLock(formData.doc_date, Post_Date)) {
      return;
    }
    try {
      const response = await axios.get(`${API_URL}/getreceiptpaymentByid`, {
        params: {
          Company_Code: companyCode,
          Year_Code: YearCode,
          tran_type: formData.tran_type,
          doc_no: formData.doc_no,
        },
      });
      const data = response.data;
      const isLockedNew = data.receipt_payment_head.LockedRecord;
      const isLockedByUserNew = data.receipt_payment_head.LockedUser;

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

        try {
          const deleteApiUrl = `${API_URL}/delete_data_by_tranid`;
          const deleteResponse = await axios.delete(deleteApiUrl, {
            params: {
              tranid: formData.tranid,
              company_code: companyCode,
              year_code: YearCode,
              doc_no: formData.doc_no,
              Tran_Type: formData.tran_type || tranType,
              user_id: User_Id,
            },
          });
          Swal.fire({
            title: "Deleted!",
            text: "Record deleted successfully!",
            icon: "success",
            confirmButtonText: "OK",
          });
          handleCancel();
        } catch (error) {
          toast.error("Deletion failed.");
          console.error("Error during API call:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        Swal.fire({
          title: "Cancelled",
          text: "Your record is safe 🙂",
          icon: "info",
        });
      }
    } catch (error) {
      toast.error("Error fetching data.");
    }
  };

  //hand back to Dashboard
  const handleBack = () => {
    navigate("/RecieptPaymentUtility");
  };

  useEffect(() => {
    if (selectedRecord) {
      handleRecordDoubleClicked();
    }
    else if (navigatedRecord && !isNaN(navigatedRecord) && parseInt(navigatedRecord) > 0) {
      handleNavigateRecord();
    }
    else {
      handleAddOne();
    }
  }, [selectedRecord, navigatedRecord]);

  // // //Handle Calculations
  // const handleKeyDownCalculations = (e) => {
  //   if (e.key === "Tab") {
  //     const { amount = 0, Adjusted_Amount = 0, TDS_Rate = 0 } = formDataDetail;

  //     const adjustedValue = parseFloat(Adjusted_Amount) || 0;
  //     const NewAmount = parseFloat(amount) || 0;

  //     const TDSApplicableAmount = NewAmount + adjustedValue;
  //     const NewTDSAmount = (TDSApplicableAmount * TDS_Rate) / 100;



  //     setFormDataDetail((prevData) => ({
  //       ...prevData,
  //       TDS_Amt: parseFloat(NewTDSAmount),
  //     }));
  //   }
  // };
  const handleKeyDownCalculations = (e) => {
    if (e.key !== "Tab") return;

    const amount = parseFloat(formDataDetail.amount) || 0;
    const adjusted = parseFloat(formDataDetail.Adjusted_Amount) || 0;
    const base = amount + adjusted;

    const tdsRate = parseFloat(formDataDetail.TDS_Rate) || 0;
    const tdsAmt = parseFloat(formDataDetail.TDS_Amt) || 0;

    // Tab from TDS_Rate
    if (e.target.name === "TDS_Rate") {
      if (tdsRate > 0 && base > 0) {
        const newAmt = (base * tdsRate) / 100;
        setFormDataDetail({ ...formDataDetail, TDS_Amt: newAmt.toFixed(2) });
      } else {
        // 🔁 Always reset amount if rate is cleared
        setFormDataDetail({ ...formDataDetail, TDS_Amt: "0.00", TDS_Rate: "0.00" });
      }
      return;
    }

    // Tab from TDS_Amt
    if (e.target.name === "TDS_Amt") {
      if (tdsAmt > 0 && base > 0) {
        const newRate = (tdsAmt * 100) / base;
        setFormDataDetail({ ...formDataDetail, TDS_Rate: newRate.toFixed(2) });
      } else {
        // 🔁 Always reset rate if amount is cleared
        setFormDataDetail({ ...formDataDetail, TDS_Rate: "0.00", TDS_Amt: "0.00" });
      }
      return;
    }
  };






  useEffect(() => {
    if (selectedRecord) {
      setUsers(
        lastTenderDetails.map((detail) => ({
          rowaction: "Normal",
          Company_Code: companyCode,
          Year_Code: YearCode,
          Tran_Type: TyanTypeState || tranType,
          credit_ac: detail.credit_ac,
          Creditcodecodename: detail.Creditcodecodename,
          Unit_Code: detail.Unit_Code,
          unitcodestatename: detail.unitcodestatename,
          Group_Code: detail.Group_Code,
          groupName: detail.groupName,
          amount: detail.amount,
          narration: detail.narration,
          narration2: detail.narration2,
          detail_id: detail.detail_id,
          Voucher_No: detail.Voucher_No,
          Voucher_Type: detail.Voucher_Type,
          Adjusted_Amount: detail.Adjusted_Amount,
          Tender_No: detail.Tender_No,
          TenderDetail_ID: detail.TenderDetail_ID,
          drpFilterValue: detail.drpFilterValue,
          ca: detail.ca,
          uc: detail.uc,
          gcid: detail.gcid,
          tenderdetailid: detail.tenderdetailid,
          AcadjAccode: detail.AcadjAccode,
          AcadjAccodenamename: detail.AcadjAccodenamename,
          AcadjAmt: detail.AcadjAmt,
          ac: detail.ac,
          TDS_Rate: detail.TDS_Rate,
          TDS_Amt: detail.TDS_Amt,
          GRN: detail.GRN,
          TReceipt: detail.TReceipt,
          trandetailid: detail.trandetailid,
          id: detail.trandetailid,
          TDSAc: detail.TDSAc,
          TDSAcid: detail.TDSAcid,
          TDSAcName: detail.TDSAcName
        }))
      );
    }
  }, [selectedRecord, lastTenderDetails]);

  useEffect(() => {
    setUsers(
      lastTenderDetails.map((detail) => ({
        rowaction: "Normal",
        Company_Code: companyCode,
        Year_Code: YearCode,
        Tran_Type: TyanTypeState || tranType,
        credit_ac: detail.credit_ac,
        Creditcodecodename: detail.creditacname,
        Unit_Code: detail.Unit_Code,
        unitcodestatename: detail.unitacname,
        Group_Code: detail.Group_Code,
        groupName: detail.System_Name_E,
        amount: detail.amount,
        narration: detail.narration,
        narration2: detail.narration2,
        detail_id: detail.detail_id,
        Voucher_No: detail.Voucher_No,
        Voucher_Type: detail.Voucher_Type,
        Adjusted_Amount: detail.Adjusted_Amount,
        Tender_No: detail.Tender_No,
        TenderDetail_ID: detail.TenderDetail_ID,
        drpFilterValue: detail.drpFilterValue,
        ca: detail.ca,
        uc: detail.uc,
        gcid: detail.gcid,
        tenderdetailid: detail.tenderdetailid,
        AcadjAccode: detail.AcadjAccode,
        AcadjAccodenamename: detail.adjustedacname,
        AcadjAmt: detail.AcadjAmt,
        ac: detail.ac,
        TDS_Rate: detail.TDS_Rate,
        TDS_Amt: detail.TDS_Amt,
        GRN: detail.GRN,
        TReceipt: detail.TReceipt,
        trandetailid: detail.trandetailid,
        id: detail.trandetailid,
        TDSAc: detail.TDSAc,
        TDSAcid: detail.TDSAcid,
        TDSAcName: detail.TDS_AcName
      }))
    );
  }, [lastTenderDetails]);

  // const handleNavigation = async (url, headKey, detailsKey) => {
  //   try {
  //     const response = await fetch(url);

  //     if (response.ok) {
  //       const data = await response.json();
  //       const { labels, [headKey]: headData, [detailsKey]: detailsData } = data;

  //       const DetailsArray = Array.isArray(detailsData) ? detailsData : [];

  //       lblbankname = labels[0]?.cashbankname || "";
  //       newcashbank = headData?.cashbank || "";
  //       lblAcadjAccodename = labels[0]?.adjustedacname || "";
  //       newAcadjAccode = headData?.AcadjAccode || "";
  //       lblUnitname = labels[0]?.unitacname || "";
  //       newUnitCode = headData?.Unit_Code || "";
  //       lblacname = labels[0]?.creditacname || "";
  //       newcredit_ac = headData?.credit_ac || "";
  //       GroupCode = headData?.Group_Code || "";
  //       GroupName = labels[0]?.System_Name_E;

  //       const itemNameMap = labels.reduce((map, label) => {
  //         if (label.credit_ac !== undefined && label.creditacname) {
  //           map[label.credit_ac] = label.creditacname;
  //           map[label.Unit_Code] = label.unitacname;
  //           map[label.AcadjAccode] = label.adjustedacname;
  //           map[label.cashAc] = label.cashbankname;
  //           map[label.Group_Code] = label.System_Name_E;
  //         }
  //         return map;
  //       }, {});

  //       const enrichedDetails = DetailsArray.map((detail) => ({
  //         ...detail,
  //         creditacname: itemNameMap[detail.credit_ac] || "",
  //         unitacname: itemNameMap[detail.Unit_Code] || "",
  //         adjustedacname: itemNameMap[detail.AcadjAccode] || "",
  //         cashbankname: itemNameMap[detail.cashAc] || "",
  //         System_Name_E: itemNameMap[detail.Group_Code] || "",
  //       }));

  //       const totalItemAmount = enrichedDetails.reduce(
  //         (total, user) => total + parseFloat(user.amount),
  //         0
  //       );
  //       globalTotalAmount = totalItemAmount.toFixed(2);

  //       setFormData((prevData) => ({
  //         ...prevData,
  //         ...headData,
  //         total: globalTotalAmount,
  //       }));

  //       setLastTenderData(headData || {});
  //       setLastTenderDetails(enrichedDetails);
  //     } else {
  //       console.error(
  //         `Failed to fetch data: ${response.status} ${response.statusText}`
  //       );
  //     }
  //   } catch (error) {
  //     console.error("Error during API call:", error);
  //   }
  // };
  const handleNavigation = async (url, headKey, detailsKey) => {
    try {
      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        const { labels, [headKey]: headData, [detailsKey]: detailsData } = data;

        const DetailsArray = Array.isArray(detailsData) ? detailsData : [];

        // Label assignments for top-level fields
        lblbankname = labels[0]?.cashbankname || "";
        newcashbank = headData?.cashbank || "";
        lblAcadjAccodename = labels[0]?.adjustedacname || "";
        newAcadjAccode = headData?.AcadjAccode || "";
        lblUnitname = labels[0]?.unitacname || "";
        newUnitCode = headData?.Unit_Code || "";
        lblacname = labels[0]?.creditacname || "";
        newcredit_ac = headData?.credit_ac || "";
        GroupCode = headData?.Group_Code || "";
        GroupName = labels[0]?.System_Name_E;
        TDSAcCode = labels[0]?.TDSAc || "";
        lblTDSAc_Name = labels[0]?.TDS_AcName;

        // Safer key mapping by prefixing field type to avoid clashes
        const itemNameMap = labels.reduce((map, label) => {
          if (label.credit_ac !== undefined && label.creditacname) {
            map[`credit_ac_${label.credit_ac}`] = label.creditacname;
          }
          if (label.Unit_Code !== undefined && label.unitacname) {
            map[`unit_${label.Unit_Code}`] = label.unitacname;
          }
          if (label.AcadjAccode !== undefined && label.adjustedacname) {
            map[`adjusted_${label.AcadjAccode}`] = label.adjustedacname;
          }
          if (label.cashAc !== undefined && label.cashbankname) {
            map[`cash_${label.cashAc}`] = label.cashbankname;
          }
          if (label.Group_Code !== undefined && label.System_Name_E) {
            map[`group_${label.Group_Code}`] = label.System_Name_E;
          }
          if (label.TDSAc !== undefined && label.TDS_AcName) {
            map[`TDSAc_${label.TDSAc}`] = label.TDS_AcName;
          }
          return map;
        }, {});

        // Enrich details with the correct scoped mappings
        const enrichedDetails = DetailsArray.map((detail) => ({
          ...detail,
          creditacname: itemNameMap[`credit_ac_${detail.credit_ac}`] || "",
          unitacname: itemNameMap[`unit_${detail.Unit_Code}`] || "",
          adjustedacname: itemNameMap[`adjusted_${detail.AcadjAccode}`] || "",
          cashbankname: itemNameMap[`cash_${detail.cashAc}`] || "",
          System_Name_E: itemNameMap[`group_${detail.Group_Code}`] || "",
          TDS_AcName: itemNameMap[`TDSAc_${detail.TDSAc}`] || "",
        }));

        const totalItemAmount = enrichedDetails.reduce(
          (total, user) => total + parseFloat(user.amount || 0),
          0
        );
        globalTotalAmount = totalItemAmount.toFixed(2);

        setFormData((prevData) => ({
          ...prevData,
          ...headData,
          total: globalTotalAmount,
        }));

        setLastTenderData(headData || {});
        setLastTenderDetails(enrichedDetails);
      } else {
        console.error(
          `Failed to fetch data: ${response.status} ${response.statusText}`
        );
      }
    } catch (error) {
      console.error("Error during API call:", error);
    }
  };

  // Function to handle the double-click action
  const handleRecordDoubleClicked = async () => {
    setIsEditing(false);
    setIsEditMode(false);
    setAddOneButtonEnabled(true);
    setEditButtonEnabled(true);
    setDeleteButtonEnabled(true);
    setBackButtonEnabled(true);
    setSaveButtonEnabled(false);
    setCancelButtonEnabled(false);
    setCancelButtonClicked(true);

    const url = `${API_URL}/getreceiptpaymentByid?Company_Code=${companyCode}&tranid=${selectedRecord.tranid}&tran_type=${selectedRecord.tran_type}&doc_no=${selectedRecord.doc_no}&Year_Code=${YearCode}`;

    await handleNavigation(
      url,
      "receipt_payment_head",
      "receipt_payment_details"
    );
  };

  // Navigation Button Handlers
  const handleFirstButtonClick = async () => {
    const url = `${API_URL}/get-firstreceiptpayment-navigation?Company_Code=${companyCode}&Year_Code=${YearCode}&tran_type=${formData.tran_type}`;
    await handleNavigation(url, "first_head_data", "first_details_data");
  };

  const handlePreviousButtonClick = async () => {
    const url = `${API_URL}/get-previousreceiptpayment-navigation?currentDocNo=${formData.doc_no}&Company_Code=${companyCode}&Year_Code=${YearCode}&tran_type=${formData.tran_type}`;
    await handleNavigation(url, "previous_head_data", "previous_details_data");
  };

  const handleNextButtonClick = async () => {
    const url = `${API_URL}/get-nextreceiptpayment-navigation?currentDocNo=${formData.doc_no}&Company_Code=${companyCode}&Year_Code=${YearCode}&tran_type=${formData.tran_type}`;
    await handleNavigation(url, "next_head_data", "next_details_data");
  };

  const handleLastButtonClick = async () => {
    const url = `${API_URL}/get-lastreceiptpayment-navigation?Company_Code=${companyCode}&Year_Code=${YearCode}&tran_type=${formData.tran_type}`;
    await handleNavigation(url, "last_head_data", "last_details_data");
  };

  // Tab Key Down Handler
  const handleKeyDown = async (event) => {
    if (event.key === "Tab") {
      const changeNoValue = event.target.value;
      const url = `${API_URL}/getreceiptpaymentByid?Company_Code=${companyCode}&Year_Code=${YearCode}&tran_type=${formData.tran_type}&doc_no=${changeNoValue}`;

      await handleNavigation(
        url,
        "receipt_payment_head",
        "receipt_payment_details"
      );
    }
  };

  const handleNavigateRecord = async () => {
    const url = `${API_URL}/getreceiptpaymentByid?Company_Code=${companyCode}&Year_Code=${YearCode}&tran_type=${navigatedTranType}&doc_no=${navigatedRecord}`;
    await handleNavigation(
      url,
      "receipt_payment_head",
      "receipt_payment_details"
    );
    setIsEditing(false);
    setIsEditMode(false);
    setAddOneButtonEnabled(true);
    setEditButtonEnabled(true);
    setDeleteButtonEnabled(true);
    setBackButtonEnabled(true);
    setSaveButtonEnabled(false);
    setCancelButtonEnabled(false);
    setCancelButtonClicked(true);
  }

  //Detail Part
  const handleChangeDetail = (event) => {
    const { name, value } = event.target;
    let updatedFormDataDetail = { ...formDataDetail, [name]: value };

    if (name === 'amount') {
      const convertedAmountInWords = ConvertNumberToWord(value);
      setAmountInWords(convertedAmountInWords);
    }

    if (name === "TDS_Rate") {
      const cleaned = value.trim();
      if (cleaned === "" || cleaned === "0" || cleaned === "0.00") {
        updatedFormDataDetail.TDS_Rate = "0.00";
        updatedFormDataDetail.TDS_Amt = "0.00";
      }
    }


    if (name === "TDS_Amt") {
      const cleaned = value.trim();
      if (cleaned === "" || cleaned === "0" || cleaned === "0.00") {
        updatedFormDataDetail.TDS_Amt = "0.00";
        updatedFormDataDetail.TDS_Rate = "0.00";
      }
    }


    setFormDataDetail(updatedFormDataDetail);
  };


  const openPopup = (mode) => {
    setShowPopup(true);
    const selectedValue = formData.tran_type || tranType;

    handleDetailDropdownChange(selectedValue);
    if (mode === "add") {
      clearForm();
    }
  };

  const clearForm = () => {
    setFormDataDetail({
      amount: 0,
      narration: "",
      narration2: null,
      detail_id: 1,
      Voucher_No: null,
      Voucher_Type: "",
      Adjusted_Amount: 0.0,
      Tender_No: 0,
      TenderDetail_ID: 0,
      drpFilterValue: "O",
      tenderdetailid: 0,
      AcadjAmt: 0.0,
      TDS_Rate: 0.0,
      TDS_Amt: 0.0,
      GRN: "",
      TReceipt: "",
    });
    setAcadjAccodenamecode("");
    setCreditcodecode("");
    setunitcodestate("");
    setAcadjAccodenamename("");
    setCreditcodecodename("");
    setunitcodestatename("");
    setGroupCode("")
    setGroupName("")
    setAccountBalance(0)
    setCashBankBalance(0)
    setTDSAc("")
    setTDSAcName("")
  };

  const deleteModeHandler = async (userToDelete) => {
    let updatedUsers;
    const amountToDeduct = parseFloat(userToDelete.amount || 0);

    if (isEditMode && userToDelete.rowaction === "add") {
      setDeleteMode(true);
      setSelectedUser(userToDelete);
      updatedUsers = users.map((u) =>
        u.id === userToDelete.id ? { ...u, rowaction: "DNU" } : u
      );
    } else if (isEditMode) {
      setDeleteMode(true);
      setSelectedUser(userToDelete);
      updatedUsers = users.map((u) =>
        u.id === userToDelete.id ? { ...u, rowaction: "delete" } : u
      );
    } else {
      setDeleteMode(true);
      setSelectedUser(userToDelete);
      updatedUsers = users.map((u) =>
        u.id === userToDelete.id ? { ...u, rowaction: "DNU" } : u
      );
    }

    setFormData((prevData) => ({
      ...prevData,
      total: (parseFloat(prevData.total || 0) - amountToDeduct).toFixed(2),
    }));

    setUsers(updatedUsers);
    setSelectedUser({});
  };

  //close popup function
  const closePopup = () => {
    setShowPopup(false);
    setSelectedUser({});
    clearForm();
    setAmountInWords('')
  };

  const handleRecieptvoucher = (Tenderno) => {
    setVoucherNoState(Tenderno);
    setFormDataDetail({
      ...formDataDetail,
      Voucher_No: Tenderno,
    });
  };

  // const handleTenderDetailsFetched = (details) => {
  //   debugger
  //   if (!details?.last_details_data || !details.last_details_data.length) {
  //     console.error("No last_details_data found in details:", details);
  //     return;
  //   }

  //   const last = details.last_details_data[0];

  //   setTenderDetails(last);

  //   setFormDataDetail((prevState) => ({
  //     ...prevState,
  //     Voucher_Type: last.Tran_Type,
  //     tenderdetailid: last.autoId,
  //     amount: last.Bill_Amount,
  //     narration: last.Narration,
  //     YearCodeDetail: last.EntryYearCode,
  //     Tran_Type: TyanTypeState || tranType || prevState.Tran_Type,
  //     debit_ac: formData.cashbank || prevState.debit_ac,
  //     da: formData.ca || prevState.da,
  //   }));

  //   return {
  //     Voucher_Type: last.Tran_Type,
  //     tenderdetailid: last.autoId,
  //     amount: last.Bill_Amount,
  //     narration: last.Narration,
  //     YearCodeDetail: last.EntryYearCode,
  //   };
  // };


  const handleTenderDetailsFetched = (details) => {
    if (!details?.last_details_data || !details.last_details_data.length) {
      console.error("No last_details_data found in details:", details);
      return;
    }

    const last = details.last_details_data[0];
    setVoucherNoState(last.doc_no);
    setTenderDetails(last);

    setFormDataDetail((prevState) => ({
      ...prevState,
      Voucher_Type: last.Tran_Type,
      Voucher_No: last.doc_no,
      tenderdetailid: last.autoId,
      amount: last.balance,
      // narration: last.Narration,
      YearCodeDetail: last.EntryYearCode,
      Tran_Type: TyanTypeState || tranType || prevState.Tran_Type,
      debit_ac: formData.cashbank || prevState.debit_ac,
      da: formData.ca || prevState.da,
    }));

  //  const newDetails = users.map((user) => ({
  //     ...user,
  //     Voucher_Type: last.Tran_Type,
  //     tenderdetailid: last.autoId,
  //     YearCodeDetail: last.EntryYearCode,
  //     Voucher_No: last.doc_no,
  //   }));
  //   setUsers(newDetails);


    return {
      Voucher_Type: last.Tran_Type,
      tenderdetailid: last.autoId,
      amount: last.balance,
      narration: last.Narration,
      YearCodeDetail: last.EntryYearCode,
    };
  };



  const updateUser = async () => {

    let missingFields = [];
    if (!Creditcodecode) missingFields.push("Account Code");
    if (!groupCode) missingFields.push("Group Code");
    if (!formDataDetail.amount) missingFields.push("Amount");

    if (missingFields.length > 0) {
      Swal.fire({
        title: "Error",
        text: `Please Select the following fields: ${missingFields.join(", ")}`,
        icon: "error",
        confirmButtonText: "OK"
      });
      return;
    }

    addButtonRef.current.focus();

    const updatedUsers = users.map((user) => {

      if (user.id === selectedUser.id) {

        const updatedRowaction =
          user.rowaction === "Normal" ? "update" : user.rowaction;

        return {
          ...user,
          credit_ac: Creditcodecode,
          Creditcodecodename: Creditcodecodename,
          ca: Creditcodecodeid,
          AcadjAccode: AcadjAccodenamecode,
          AcadjAccodenamename: AcadjAccodenamename,
          ac: AcadjAccodenameid,
          Unit_Code: unitcodestate,
          unitcodestatename: unitcodestatename,
          uc: unitcodestateid,
          Group_Code: groupCode,
          gcid: gcId,
          amount: formDataDetail.amount,
          narration: formDataDetail.narration,
          narration2: formDataDetail.narration2,
          detail_id: user.detail_id,
          // Voucher_No: user.Voucher_No,
          // Voucher_Type: user.Voucher_Type,
          Voucher_No: formDataDetail.Voucher_No || user.Voucher_No,
          Voucher_Type: formDataDetail.Voucher_Type || user.Voucher_Type,
          Adjusted_Amount: user.Adjusted_Amount,
          Tender_No: user.Tender_No,
          TenderDetail_ID: user.TenderDetail_ID,
          // drpFilterValue: user.drpFilterValue,
          drpFilterValue: formDataDetail.drpFilterValue,
          // tenderdetailid: user.tenderdetailid,
          tenderdetailid: formDataDetail.tenderdetailid || user.tenderdetailid,
          AcadjAccode: AcadjAccodenamecode,
          AcadjAmt: formDataDetail.AcadjAmt,
          TDS_Rate: formDataDetail.TDS_Rate,
          TDS_Amt: formDataDetail.TDS_Amt,
          GRN: formDataDetail.GRN,
          TReceipt: user.TReceipt,
          TDSAc: TDS_Ac,
          TDSAcid: TDSAccoid,
          TDSAcName: TDSAcName,
          rowaction: updatedRowaction,
        };
      } else {
        return user;
      }

    });

    setUsers(updatedUsers);

    const totalItemAmount = updatedUsers.reduce((total, user) => {
      return total + parseFloat(user.amount);
    }, 0);
    globalTotalAmount = totalItemAmount.toFixed(2);
    setFormData((prevData) => ({
      ...prevData,
      total: globalTotalAmount,
    }));

    closePopup();
  };

  const addUser = async () => {
    let missingFields = [];
    if (!Creditcodecode) missingFields.push("Account Code");
    if (!groupCode) missingFields.push("Group Code");
    if (!formDataDetail.amount) missingFields.push("Amount");

    if (missingFields.length > 0) {
      Swal.fire({
        title: "Error",
        text: `Please Select the following fields: ${missingFields.join(", ")}`,
        icon: "error",
        confirmButtonText: "OK"
      });
      return;
    }

    const nextUserId =
      users.length > 0 ? Math.max(...users.map((user) => user.id)) + 1 : 1;

    const maxDetailId =
      users.length > 0
        ? Math.max(...users.map((user) => user.detail_id)) + 1
        : 1;
    const newUser = {
      id: nextUserId,
      credit_ac: Creditcodecode,
      Creditcodecodename: Creditcodecodename,
      ca: Creditcodecodeid,
      Unit_Code: unitcodestate,
      unitcodestatename: unitcodestatename,
      uc: unitcodestateid,
      AcadjAccode: AcadjAccodenamecode,
      AcadjAccodenamename: AcadjAccodenamename,
      Group_Code: groupCode,
      gcid: gcId,
      groupName: groupName,
      ac: AcadjAccodenameid,
      TDSAc: TDS_Ac,
      TDSAcid: TDSAccoid,
      TDSAcName: TDSAcName,
      ...formDataDetail,
      detail_id: maxDetailId,
      Voucher_No: tenderDetails.doc_no || newVoucher_No || "",

      rowaction: "add",
    };
    const newUsers = [...users, newUser];
    setUsers(newUsers);
    const totalItemAmount = newUsers
      .filter((user) => user.rowaction !== "delete" && user.rowaction !== "DNU")
      .reduce((total, user) => total + parseFloat(user.amount || 0), 0);
    globalTotalAmount = totalItemAmount.toFixed(2);
    setFormData((prevData) => ({
      ...prevData,

      total: globalTotalAmount,
    }));
    closePopup();
    addButtonRef.current.focus();
  };

  const editUser = (user) => {
    setSelectedUser(user);
    setCreditcodecode(user.credit_ac);
    setCreditcodecodename(user.Creditcodecodename);
    setCreditcodecodeid(user.ca);
    setAcadjAccodenamecode(user.AcadjAccode);
    setAcadjAccodenamename(user.AcadjAccodenamename);
    setAcadjAccodenameid(user.ac);
    setunitcodestate(user.Unit_Code);
    setunitcodestatename(user.unitcodestatename);
    setunitcodestateid(user.uc);
    setGroupCode(user.Group_Code);
    setGCID(user.gcid);
    setGroupName(user.groupName);
    setTDSAc(user.TDSAc)
    setTDSAccoid(user.TDSAcid)
    setTDSAcName(user.TDSAcName)
    setFormDataDetail({
      amount: user.amount || "",
      narration: user.narration || "",
      narration2: user.narration2 || "",
      detail_id: user.trandetailid,
      Voucher_No: user.Voucher_No || "",
      Voucher_Type: user.Voucher_Type || "",
      tenderdetailid: user.tenderdetailid || 0,
      Adjusted_Amount: user.Adjusted_Amount || 0.0,
      Tender_No: user.Tender_No || "",
      TenderDetail_ID: user.TenderDetail_ID || "",
      drpFilterValue: user.drpFilterValue || "",
      AcadjAmt: user.AcadjAmt || "",
      TDS_Rate: user.TDS_Rate || "",
      TDS_Amt: user.TDS_Amt || "",
      GRN: user.GRN || "",
      TReceipt: user.TReceipt || "",
    });
    setVoucherNoState(user.Voucher_No);
    openPopup("edit");

    let amount = ConvertNumberToWord(user.amount)
    setAmountInWords(amount)
  };

  const openDelete = async (user) => {
    let updatedUsers;
    const amountToAdd = parseFloat(user.amount || 0);
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
    setFormData((prevData) => ({
      ...prevData,
      total: (parseFloat(prevData.total || 0) + amountToAdd).toFixed(2),
    }));
    setFormDataDetail({
      ...formDataDetail,
    });
    setUsers(updatedUsers);
    setSelectedUser({});
  };

  return (
    <>
      <UserAuditInfo
        createdBy={formData.Created_By}
        modifiedBy={formData.Modified_By}
        title={"Receipt Payment"}
      />
      <div>
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
          permissions={permissions}
          component={<RecieptPaymentReport doc_no={formData.doc_no} Tran_Type={formData.tran_type} disabledFeild={!addOneButtonEnabled} />}
        />
        <div>
          <NavigationButtons
            handleFirstButtonClick={handleFirstButtonClick}
            handlePreviousButtonClick={handlePreviousButtonClick}
            handleNextButtonClick={handleNextButtonClick}
            handleLastButtonClick={handleLastButtonClick}
            highlightedButton={highlightedButton}
            isEditing={isEditing}
            isFirstRecord={formData.Company_Code === 1}
          />
        </div>
      </div>
      <div>
        <form>
          <Grid
            container
            spacing={1}
            alignItems="center"
            sx={{ justifyContent: "flex-start" }}
            mt={0.5}
          >
            <Grid item xs={12} sm={1} sx={{ textAlign: "left" }}>
              <TextField
                label="Change No"
                id="changeNo"
                name="changeNo"
                autoComplete="off"
                onKeyDown={handleKeyDown}
                disabled={!addOneButtonEnabled}
                size="small"
                InputLabelProps={{
                  shrink: true,
                  style: { fontWeight: 'bold' },
                }}
              />
            </Grid>



            {/* <Grid item xs={12} sm={1.2}>
              <FormControl fullWidth>
                <InputLabel id="tran_type_label">Tran Type</InputLabel>
                <Select
                  labelId="tran_type_label"
                  id="tran_type"
                  name="tran_type"
                  value={formData.tran_type}
                  onChange={handleDropdownChange}
                  disabled={!addOneButtonEnabled}
                  size="small"
                  InputLabelProps={{
                    style: { fontWeight: 'bold' },
                  }}
                >
                  <MenuItem value="BR">Bank Receipt</MenuItem>
                  <MenuItem value="BP">Bank Payment</MenuItem>
                  <MenuItem value="CR">Cash Receipt</MenuItem>
                  <MenuItem value="CP">Cash Payment</MenuItem>
                </Select>
              </FormControl>
            </Grid> */}

            <div className="w-full sm:w-[10%] ml-1 mt-1">
              <select
                id="tran_type"
                name="tran_type"
                value={formData.tran_type}
                onChange={handleDropdownChange}
                disabled={!addOneButtonEnabled}
                className="w-full h-10 px-3 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="BR">Bank Receipt</option>
                <option value="BP">Bank Payment</option>
                <option value="CR">Cash Receipt</option>
                <option value="CP">Cash Payment</option>
              </select>
            </div>




            <Grid item xs={12} sm={0.8}>
              <TextField
                label="Doc No"
                id="doc_no"
                name="doc_no"
                value={formData.doc_no}
                onChange={handleChange}
                disabled={true}
                fullWidth
                size="small"
                InputLabelProps={{
                  style: { fontWeight: 'bold' },
                }}

                InputProps={{
                  style: { fontSize: '12px', height: '35px' },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4} md={1} sx={{ padding: 0.5, minWidth: '100px', maxWidth: '100px' }}>
              <TextField
                label="Doc Date"
                id="doc_date"
                name="doc_date"
                type="date"
                value={formData.doc_date}
                inputRef={inputRef}
                onChange={handleChange}
                disabled={!isEditing && addOneButtonEnabled}
                fullWidth
                InputLabelProps={{
                  style: { fontSize: '12px' },
                }}
                InputProps={{
                  style: { fontSize: '12px', height: '35px' },
                }}
                size="small"
              />
            </Grid>
            {/* <Grid item xs={12} sm={2}>
              <FormControl fullWidth>
                <InputLabel shrink style={{ fontWeight: 'bold' }}>Cash/Bank</InputLabel>
                <AccountMasterHelp
                  name="cashbank"
                  onAcCodeClick={handleCashBank}
                  CategoryName={lblbankname}
                  CategoryCode={newcashbank}
                  Ac_type={["B", "C"]}
                  disabledFeild={!isEditing && addOneButtonEnabled}
                  size="small"
                />
              </FormControl>
               <h4
                                        style={{
                                          marginLeft: "20px",
                                          alignSelf: "center",
                                        }}
                                      >
                                        ₹ {formatReadableAmount(cashBankBalance)}
                                      </h4>
            </Grid> */}

            <Grid item xs={12} sm={4}>
              <Box display="flex" alignItems="center">
                <Box flex="1" position="relative">
                  <FormControl fullWidth>
                    <InputLabel shrink style={{ fontWeight: 'bold' }}>
                      Cash/Bank
                    </InputLabel>

                    <AccountMasterHelp
                      name="cashbank"
                      onAcCodeClick={handleCashBank}
                      CategoryName={lblbankname}
                      CategoryCode={newcashbank}
                      Ac_type={["B", "C"]}
                      disabledFeild={!isEditing && addOneButtonEnabled}
                      size="small"
                    />
                  </FormControl>
                </Box>

                {/* BALANCE - NEAR THE FIELD */}
                {!(!isEditing && addOneButtonEnabled) && (
                  <Typography
                    sx={{
                      marginLeft: "6px",        // VERY CLOSE to input
                      whiteSpace: "nowrap",
                      fontWeight: "bold",
                      fontSize: "24px",
                      minWidth: "70px",
                      textAlign: "left",
                      color: accountBalance < 0 ? "red" : "green",
                    }}
                  >
                    ₹ {formatReadableAmount(Math.abs(cashBankBalance))}{""}
                    {/* {cashBankBalance < 0 ? "Dr" : cashBankBalance > 0 ? "Cr" : ""} */}
                  </Typography>
                )}
              </Box>
            </Grid>

          </Grid>
        </form>
        {isLoading && (
          <div className="loading-overlay">
            <div className="spinner-container">
              <SaveUpdateSpinner />
            </div>
          </div>
        )}
        <div>
          {/* <div style={{ marginTop: "10px" }}>
            <AddButton openPopup={openPopup} isEditing={isEditing} ref={addButtonRef} setFocusToFirstField={setFocusToFirstField} />
             <Typography variant="h6" sx={{ marginBottom: '10px' }}>
              Total Entries: {users.length}
            </Typography>

          </div> */}


          <div style={{ marginTop: "10px", display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <AddButton openPopup={openPopup} isEditing={isEditing} ref={addButtonRef} setFocusToFirstField={setFocusToFirstField} />
            <Typography
              variant="h6"
              sx={{
                marginBottom: '10px',
                fontWeight: 'bold',
                fontSize: '1.25rem',
                color: '#333',
                background: 'linear-gradient(45deg, #6a11cb 0%, #2575fc 100%)',
                WebkitBackgroundClip: 'text',
                display: 'inline',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                padding: '8px 16px',
                borderRadius: '5px',
                backgroundColor: 'white',
                textAlign: 'center',
                cursor: "pointer"
              }}
            >
              Total Entries: {users.length}
            </Typography>
          </div>

          {showPopup && (
            <div className="RecieptPaymentmodal" >
              <div className="RecieptPaymentmodal-dialog" style={{
                display: "block",
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: "1050",
                width: "100%",
                maxWidth: "1200px"
              }} >
                <div className="RecieptPaymentmodal-content">
                  <div className="RecieptPaymentmodal-header">
                    <h5 className="RecieptPaymentmodal-title" style={{ marginBottom: "-20px" }}>
                      {selectedUser.id
                        ? "Edit Receipt Payment"
                        : "Add Receipt Payment"}
                    </h5>
                    <button
                      type="button"
                      onClick={closePopup}
                      aria-label="Close"
                      style={{
                        marginLeft: "90%",
                        width: "40px",
                        height: "40px",
                        borderRadius: "4px",
                        marginTop: "-40px",
                      }}
                    >
                      <span aria-hidden="true">&times;</span>
                    </button>
                  </div>
                  <div className="RecieptPaymentmodal-body">
                    <form>
                      {/* <div className="receiptpaymentdiv">
                        <label htmlFor="credit_ac" className="receiptpaymentlabel">
                          A/C Code :
                        </label>
                        <div className="receiptpayment-col">
                          <div className="receiptpayment-form-group">
                            <AccountMasterHelp
                              name="credit_ac"
                              onAcCodeClick={handleAccode}
                              CategoryName={Creditcodecodename}
                              CategoryCode={Creditcodecode}
                              Ac_type={[]}
                              firstInputRef={firstInputRef}
                              disabledFeild={!isEditing && addOneButtonEnabled}
                            />
                          </div>
                        </div>
                      </div> */}
                      <div className="receiptpaymentdiv">
                        <label htmlFor="credit_ac" className="receiptpaymentlabel">
                          A/C Code :
                        </label>

                        <div className="receiptpayment-col" style={{ display: "flex", alignItems: "center" }}>

                          {/* FIELD */}
                          <div className="receiptpayment-form-group" style={{ flex: 1 }}>
                            <AccountMasterHelp
                              name="credit_ac"
                              onAcCodeClick={handleAccode}
                              CategoryName={Creditcodecodename}
                              CategoryCode={Creditcodecode}
                              Ac_type={[]}
                              firstInputRef={firstInputRef}
                              disabledFeild={!isEditing && addOneButtonEnabled}
                            />
                          </div>

                          {/* BALANCE — CLOSE TO FIELD */}
                          {!(!isEditing && addOneButtonEnabled) && (
                            <span
                              style={{
                                marginLeft: "6px",
                                fontWeight: "bold",
                                whiteSpace: "nowrap",
                                fontSize: "24px",
                                color: accountBalance < 0 ? "red" : "green",
                              }}
                            >
                              ₹ {formatReadableAmount(Math.abs(accountBalance))}{" "}
                              {/* {accountBalance < 0 ? "Dr" : accountBalance > 0 ? "Cr" : ""} */}
                            </span>
                          )}
                        </div>
                      </div>


                      <div className="receiptpaymentdiv">
                        <label htmlFor="Unit_Code" className="receiptpaymentlabel">
                          Unit A/C :
                        </label>
                        <div className="receiptpayment-col">
                          <div className="receiptpayment-form-group">
                            <AccountMasterHelp
                              name="Unit_Code"
                              onAcCodeClick={handleUnitCode}
                              CategoryName={unitcodestatename}
                              CategoryCode={unitcodestate}
                              Ac_type={[]}
                              disabledFeild={!isEditing && addOneButtonEnabled}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="receiptpaymentdiv">
                        <label htmlFor="Group_Code" className="receiptpaymentlabel">
                          Group Code :
                        </label>
                        <div className="receiptpayment-col">
                          <div className="receiptpayment-form-group">
                            <GroupMasterHelp
                              onAcCodeClick={handleGroupCode}
                              CategoryName={groupName}
                              CategoryCode={groupCode}
                              SystemType="C"
                              name="Group_Code"
                              disabledField={!isEditing && addOneButtonEnabled}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="receiptpaymentdiv">
                        <label htmlFor="drpFilterValue" className="receiptpaymentlabel">
                          Select :
                        </label>
                        <div className="receiptpayment-col">
                          <div className="receiptpayment-form-group  col-md-2">
                            <select
                              id="drpFilterValue"
                              name="drpFilterValue"
                              value={formDataDetail.drpFilterValue}
                              onChange={handleDropdownvalueChange}
                              disabled={!isEditing && !addOneButtonEnabled}
                              className="custom-select"
                            >
                              {secondSelectOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.text}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="receiptpaymentdiv">
                        <label htmlFor="Voucher_No" className="receiptpaymentlabel">
                          Voucher No :
                        </label>
                        <div className="receiptpayment-col">
                          <div className="receiptpayment-form-group">
                            <RecieptVoucherNoHelp
                              onAcCodeClick={handleRecieptvoucher}
                              name="Voucher_No"
                              VoucherNo={
                                newVoucher_No ||
                                VoucherNoState ||
                                formDataDetail.Voucher_No
                              }
                              disabledFeild={
                                (!isEditing && addOneButtonEnabled) ||
                                formDataDetail.drpFilterValue === "O"
                              }
                              Accode={formDataDetail.credit_ac || Creditcodecode}
                              onTenderDetailsFetched={handleTenderDetailsFetched}
                              FilterType={formDataDetail.drpFilterValue}
                              Tran_Type={
                                formData.tran_type || TyanTypeState || tranType
                              }
                              Ac_type={[]}
                            />
                          </div>
                        </div>

                        <label htmlFor="Voucher_Type" className="receiptpaymentlabel">
                          Voucher Type :
                        </label>
                        <div className="receiptpayment-col">
                          <div className="receiptpayment-form-group">
                            <input
                              type="text"
                              name="Voucher_Type"
                              autoComplete="off"
                              value={formDataDetail.Voucher_Type}
                              disabled={
                                (!isEditing && addOneButtonEnabled) ||
                                formDataDetail.drpFilterValue === "O"
                              }
                              onChange={handleChangeDetail}
                              style={{ maxWidth: 100 }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="receiptpaymentdiv" style={{ marginLeft: "10px" }}>
                        <label htmlFor="amount" className="receiptpaymentlabel">
                          Amount :
                        </label>
                        <div className="receiptpayment-col">
                          <div className="receiptpayment-form-group col-md-4">
                            <input
                              type="text"
                              name="amount"
                              autoComplete="off"
                              value={formDataDetail.amount}
                              onChange={(e) => {
                                validateNumericInput(e);
                                handleChangeDetail(e);
                              }}
                              onKeyDown={handleKeyDownCalculations}
                            />
                          </div>
                        </div>
                        <label htmlFor="tenderdetailid" className="receiptpaymentlabel">
                          Tender ID :
                        </label>
                        <div className="receiptpayment-col" style={{ marginRight: "40px" }}>
                          <div className="receiptpayment-form-group">
                            <input
                              type="text"
                              name="tenderdetailid"
                              autoComplete="off"
                              value={formDataDetail.tenderdetailid}
                              disabled={
                                (!isEditing && addOneButtonEnabled) ||
                                formDataDetail.drpFilterValue === "O"
                              }
                              onChange={handleChangeDetail}
                              style={{ maxWidth: 100, marginLeft: 10 }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="receiptpaymentdiv">
                        <div className="receiptpayment-col">
                          <div className="receiptpayment-form-group">
                            <label style={{ fontWeight: "bold" }}>Amount in Words : </label>
                            <p style={{ marginLeft: "5px", marginTop: '20px', color: "blue", fontWeight: "bold" }}>{amountInWords}</p>
                          </div>
                        </div>
                      </div>

                      <div className="receiptpaymentdiv" style={{ marginLeft: "10px" }}>
                        <label htmlFor="Adjusted_Amount" className="receiptpaymentlabel">
                          Adj Amount :
                        </label>
                        <div className="receiptpayment-col">
                          <div className="receiptpayment-form-group col-md-4">
                            <input
                              type="text"
                              name="Adjusted_Amount"
                              autoComplete="off"
                              value={formDataDetail.Adjusted_Amount}
                              onChange={(e) => {
                                validateNumericInput(e);
                                handleChangeDetail(e);
                              }}
                              onKeyDown={handleKeyDownCalculations}
                            />
                          </div>
                        </div>
                        <label htmlFor="AcadjAccode" className="receiptpaymentlabel">
                          Adjusted A/C :
                        </label>
                        <div className="receiptpayment-col">
                          <div className="receiptpayment-form-group">
                            <AccountMasterHelp
                              name="AcadjAccode"
                              onAcCodeClick={handleAcadjAccodename}
                              CategoryName={AcadjAccodenamename}
                              CategoryCode={AcadjAccodenamecode}
                              Ac_type={[]}
                              disabledFeild={!isEditing && addOneButtonEnabled}
                            />
                          </div>
                        </div>
                        <label htmlFor="TDS_Rate" className="receiptpaymentlabel">
                          TDS % :
                        </label>
                        <div className="receiptpayment-col">
                          <div className="receiptpayment-form-group col-md-6">
                            <input
                              type="text"
                              name="TDS_Rate"
                              autoComplete="off"
                              value={formDataDetail.TDS_Rate}
                              onChange={(e) => {
                                validateNumericInput(e);
                                handleChangeDetail(e);
                              }}
                              onKeyDown={handleKeyDownCalculations}
                              style={{ maxWidth: 100 }}
                            />
                          </div>
                        </div>

                        <label htmlFor="TDS_Amt" className="receiptpaymentlabel" style={{ marginLeft: "40px" }}>
                          TDS Amount :
                        </label>
                        <div className="receiptpayment-col" >
                          <div className="receiptpayment-form-group">
                            <input
                              type="text"
                              name="TDS_Amt"
                              autoComplete="off"
                              value={formDataDetail.TDS_Amt || "0.00"}
                              onChange={(e) => {
                                validateNumericInput(e);
                                handleChangeDetail(e);
                              }}
                              onKeyDown={handleKeyDownCalculations}

                              style={{ maxWidth: 100 }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="receiptpaymentdiv" style={{ marginLeft: "10px" }}>
                        <label htmlFor="AcadjAccode" className="receiptpaymentlabel">
                          TDS A/c :
                        </label>
                        <div className="receiptpayment-col">
                          <div className="receiptpayment-form-group">
                            <AccountMasterHelp
                              name="TDSAc"
                              onAcCodeClick={handleTDSAc}
                              CategoryName={TDSAcName}
                              CategoryCode={TDS_Ac}
                              Ac_type={[]}
                              disabledFeild={!isEditing && addOneButtonEnabled}
                            />
                          </div>
                        </div>

                      </div>

                      <div className="receiptpaymentdiv" style={{ marginLeft: "10px" }}>
                        <label htmlFor="narration" className="receiptpaymentlabel">
                          Narration :
                        </label>
                        <div className="receiptpayment-col">
                          <div className="receiptpayment-form-group col-md-6">
                            <textarea
                              name="narration"
                              autoComplete="off"
                              value={formDataDetail.narration}
                              onChange={handleChangeDetail}
                            />
                          </div>
                        </div>
                      </div>

                      {/* <div className="form-row">
                        <div className="form-group col-md-6">
                          <label>Narration 2:</label>
                          <textarea
                            name="narration2"
                            autoComplete="off"
                            value={formDataDetail.narration2}
                            onChange={handleChangeDetail}
                          />
                        </div>
                        <div className="form-group col-md-6">
                          <label>GRN:</label>
                          <input
                            type="text"
                            name="GRN"
                            autoComplete="off"
                            value={formDataDetail.GRN}
                            onChange={handleChangeDetail}
                          />
                        </div>
                      </div> */}

                      {/* <div className="form-row">
                        <div className="form-group col-md-6">
                          <label>TReceipt:</label>
                          <input
                            type="text"
                            name="TReceipt"
                            autoComplete="off"
                            value={formDataDetail.TReceipt}
                            onChange={handleChangeDetail}
                          />
                        </div>
                      </div> */}

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

          <TableContainer component={Paper} style={{ marginTop: '16px', width: '100%', marginBottom: "20px" }}>
            <Table sx={{ minWidth: 650 }} >
              <TableHead>
                <TableRow>
                  <TableCell sx={headerCellStyle}>Actions</TableCell>
                  <TableCell sx={headerCellStyle}>ID</TableCell>
                  <TableCell sx={headerCellStyle}>Account Code</TableCell>
                  <TableCell sx={headerCellStyle}>Account Name</TableCell>
                  <TableCell sx={headerCellStyle}>Amount</TableCell>
                  <TableCell sx={headerCellStyle}>Narration</TableCell>
                  {/* <TableCell sx={headerCellStyle}>RowAction</TableCell> */}
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} sx={{
                    height: '30px', '&:hover': {
                      backgroundColor: '#f3f388',
                      cursor: "pointer",
                    },
                  }} >
                    <TableCell sx={{ padding: '4px 8px' }}>
                      {user.rowaction === 'add' || user.rowaction === 'update' || user.rowaction === 'Normal' ? (
                        <>
                          <EditButton editUser={editUser} user={user} isEditing={isEditing} />
                          <DeleteButton deleteModeHandler={deleteModeHandler} user={user} isEditing={isEditing} />
                        </>
                      ) : user.rowaction === 'DNU' || user.rowaction === 'delete' ? (
                        <IconButton onClick={() => openDelete(user)}>
                          <OpenButton openDelete={openDelete} user={user} />
                        </IconButton>
                      ) : null}
                    </TableCell>
                    <TableCell sx={{ padding: '4px 8px' }}>{user.detail_id}</TableCell>
                    <TableCell sx={{ padding: '4px 8px' }}>{user.credit_ac}</TableCell>
                    <TableCell sx={{ padding: '4px 8px', textAlign: 'left' }}>{user.Creditcodecodename}</TableCell>
                    <TableCell align="right" sx={{ padding: '4px 8px' }}>{formatReadableAmount(user.amount)}</TableCell>
                    <TableCell sx={{ padding: '4px 8px' }}>{user.narration}</TableCell>
                    {/* <TableCell sx={{ padding: '4px 8px' }}>{user.rowaction}</TableCell> */}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

        </div>
        <div className="receiptpaymentdiv" style={{ marginTop: "10px", marginBottom: '60px', width: "20%" }}>
          <label htmlFor="total" className="receiptpaymentlabel">Total:</label>
          <input
            type="text"
            id="total"
            name="total"
            value={formatReadableAmount(formData.total)}
            onChange={handleChange}
            disabled
          />
        </div>
      </div>
    </>
  );
};
export default RecieptPayment;