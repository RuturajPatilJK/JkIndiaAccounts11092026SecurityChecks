import React from "react";
import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ActionButtonGroup from "../../../Common/CommonButtons/ActionButtonGroup";
import NavigationButtons from "../../../Common/CommonButtons/NavigationButtons";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AccountMasterHelp from "../../../Helper/AccountMasterHelp";
import { TextField, Box } from "@mui/material";
import { useRecordLocking } from "../../../hooks/useRecordLocking";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Grid,
} from "@mui/material";
import UserAuditInfo from "../../../Common/UserAuditInfo/UserAuditInfo";
import AddButton from "../../../Common/Buttons/AddButton";
import EditButton from "../../../Common/Buttons/EditButton";
import DeleteButton from "../../../Common/Buttons/DeleteButton";
import OpenButton from "../../../Common/Buttons/OpenButton";
import "./JournalVoucher.css"
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount"
import { fetchAccountBalance } from "../../../Common/GetAccountBalance/GetAccountBalance";
import Swal from "sweetalert2";
import { ConvertNumberToWord } from "../../../Common/FormatFunctions/ConvertNumberToWord";
import PrintButton from "../../../Common/Buttons/PrintPDF";
import DetailAddButtom from "../../../Common/Buttons/DetailAddButton";
import DetailCloseButton from "../../../Common/Buttons/DetailCloseButton";
import DetailUpdateButton from "../../../Common/Buttons/DetailUpdateButton";
import SaveUpdateSpinner from "../../../Common/Spinners/SaveUpdateSpinner";
import { PostDateRecordLock } from "../../../Common/PostDateLock/PostDateRangeCheck";
import { validateDocumentDate } from "../../../Common/ValidateDateRange/ValidateDateRange"

var newDebit_ac;
var lblacname;
var globalTotalAmount = 0.0;
var globalCreditTotalAmount = 0.0;
var globalDebitTotalAmount = 0.0;

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

const API_URL = process.env.REACT_APP_API;


const JournalVoucher = () => {
  const companyCode = sessionStorage.getItem("Company_Code");
  const YearCode = sessionStorage.getItem("Year_Code");
  const username = sessionStorage.getItem("username");
  const Post_Date = sessionStorage.getItem("Post_Date")
  const User_Id = sessionStorage.getItem("User_ID");

  const [isLoading, setIsLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
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
  const [Debitcode, setDebitcode] = useState("");
  const [Debitcodeid, setDebitcodeid] = useState("");
  const [Debitcodename, setCreditcodecodename] = useState("");
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState({});
  const [users, setUsers] = useState([]);
  const [tenderDetails, setTenderDetails] = useState({});
  const [lastTenderDetails, setLastTenderDetails] = useState([]);
  const [lastTenderData, setLastTenderData] = useState({});
  const docDateRef = useRef(null);

  const [creditTotal, setCreditTotal] = useState(0);
  const [debitTotal, setDebitTotal] = useState(0);
  const [diff, setDiff] = useState(0);

  const [accountbalance, setAccountsetBalance] = useState(0);

  //SET Focus to the first feild of modal dialog
  const addButtonRef = useRef(null);
  const firstInputRef = useRef(null);
  const setFocusToFirstField = () => {
    if (firstInputRef.current) {
      firstInputRef.current.focus();
    }
  };

  const initialFormData = {
    tran_type: "",
    doc_no: "",
    doc_date: new Date().toISOString().split("T")[0],
    total: 0,
    company_code: companyCode,
    year_code: YearCode,
    Created_By: "",
    Modified_By: "",
  };

  const [formDataDetail, setFormDataDetail] = useState({
    credit_ac: 0,
    amount: 0,
    narration: "",
    narration2: "",
    detail_id: 1,
    debit_ac: 0,
    da: 0,
    drcr: "C",
    Unit_Code: 0,
    Voucher_No: 0,
    Voucher_Type: "",
    Adjusted_Amount: 0.0,
    Tender_No: 0,
    TenderDetail_ID: 0,
    drpFilterValue: "",
    ca: 0,
    uc: 0,
    tenderdetailid: 0,
    AcadjAccode: 0,
    AcadjAmt: 0.0,
    ac: 0,
    TDS_Rate: 0.0,
    TDS_Amt: 0.0,
    GRN: "",
    TReceipt: "",
  });

  const navigate = useNavigate();
  const location = useLocation();
  const selectedRecord = location.state?.selectedRecord;
  const permissions = location.state?.permissionsData;

  const searchParams = new URLSearchParams(location.search);
  const navigatedRecord = searchParams.get('navigatedRecord');
  const navigatedTranType = searchParams.get('navigatedTranType');

  const [formData, setFormData] = useState(initialFormData);

  const { isRecordLockedByUser, lockRecord, unlockRecord } = useRecordLocking(
    formData.doc_no,
    formData.tran_type,
    companyCode,
    YearCode,
    "journal_voucher"
  );

  const [amountInWords, setAmountInWords] = useState('');

  //handleChange For Input Fields
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevState) => {
      const updatedFormData = { ...prevState, [name]: value };
      return updatedFormData;
    });
  };

  //get Next Doc No
  const fetchLastRecord = () => {
    let TranType = "JV";
    fetch(
      `${API_URL}/get_next_paymentRecord_docNo?Company_Code=${companyCode}&tran_type=${TranType}&Year_Code=${YearCode}`
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
    globalTotalAmount = "";
    globalCreditTotalAmount = "";
    globalDebitTotalAmount = "";
    let tran_type = "JV";
    setDiff(0);
    setDebitTotal(0);
    setCreditTotal(0);
    setFormData((prevData) => ({
      ...prevData,
      tran_type: "JV",
    }));
    setTimeout(() => {
      docDateRef.current?.focus();
    }, 0);
  };

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

    if (users.length === 0 || users.every(user => user.rowaction === "DNU" || user.rowaction === "delete")) {
      await Swal.fire({
        title: "Error",
        text: "Please add at least one entry in the detail grid.",
        icon: "error",
        confirmButtonText: "OK"
      });
      return;
    }
    setIsEditing(true);
    setIsLoading(true);

    const Total = parseFloat(creditTotal) - parseFloat(debitTotal);
    if (Total !== 0) {
      Swal.fire({
        title: "Error",
        text: "Differnece Must Be Zero.!",
        icon: "error",
        confirmButtonText: "OK"
      });
      setIsLoading(false);
      return;
    }

    let head_data = { ...formData };

    if (isEditMode) {
      head_data = {
        ...head_data,
        Modified_By: username,
        User_Id: User_Id
      };
      delete head_data.tranid;
    } else {
      head_data = {
        ...head_data,
        Created_By: username,
      };
    }
    const detail_data = users.map((user) => ({
      rowaction: user.rowaction,
      detail_id: user.detail_id,
      debit_ac: user.debit_ac,
      credit_ac: user.debit_ac,
      drcr: user.drcr,
      amount: user.amount,
      narration: user.narration,
      trandetailid: user.trandetailid,
      da: user.da,
      ca: user.ca,
      Company_Code: companyCode,
      Year_Code: YearCode,
      Tran_Type: "JV",
      tranid: formData.tranid,
    }));

    const requestData = {
      head_data,
      detail_data,
    };

    try {
      const apiUrl = isEditMode
        ? `${API_URL}/update-receiptpayment?tranid=${formData.tranid}`
        : `${API_URL}/insert-receiptpayment`;

      const apiCall = isEditMode
        ? axios.put(apiUrl, requestData)
        : axios.post(apiUrl, requestData);

      const response = await apiCall;

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
      setIsLoading(false);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      navigate(`/journal-voucher?navigatedRecord=${formData.doc_no}&navigatedTranType=JV`);
    } catch (error) {
      console.error("Error during save/update:", error);
      toast.error("An error occurred during save/update.");
      setIsLoading(false);
    }

  };

  //handle Edit record functionality.
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
        } else {
          lockRecord();
        }
        setFormData({
          ...formData,
          ...data.receipt_payment_head,
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
        console.log(error);
      });
  };

  const handleCancel = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/get-lastreceiptpayment-navigation?Company_Code=${companyCode}&Year_Code=${YearCode}&tran_type=${formData.tran_type}`
      );
      if (response.status === 200) {
        const data = response.data;
        const { last_head_data, last_details_data, labels } = data;

        const detailsArray = Array.isArray(last_details_data)
          ? last_details_data
          : [];

        const itemNameMap = labels.reduce((map, label) => {
          if (label.debit_ac !== undefined && label.debitacname) {
            map[label.debit_ac] = label.debitacname;
          }
          return map;
        }, {});

        const enrichedDetails = detailsArray.map((detail) => ({
          ...detail,
          AcName: itemNameMap[detail.debit_ac] || "",
        }));
        let creditTotal = 0;
        let debitTotal = 0;

        enrichedDetails.forEach((user) => {
          const amount = parseFloat(user.amount || 0);
          if (user.drcr === "C") {
            creditTotal += amount;
          } else if (user.drcr === "D") {
            debitTotal += amount;
          }
        });

        const total = creditTotal + debitTotal;

        globalCreditTotalAmount = creditTotal.toFixed(2);
        globalDebitTotalAmount = debitTotal.toFixed(2);
        globalTotalAmount = total.toFixed(2);

        setCreditTotal(creditTotal.toFixed(2));
        setDebitTotal(debitTotal.toFixed(2));

        setFormData((prevData) => ({
          ...prevData,
          ...last_head_data,
          total: total.toFixed(2),
        }));
        setLastTenderData(data.last_head_data || {});
        setLastTenderDetails(enrichedDetails || []);
      } else {
        if (response.status === 404) {
          toast.error("Data not found.");
          Swal.fire({
            icon: "warning",
            title: "No Record Found.!",
            confirmButtonColor: "#d33",
          });
        } else {
          console.log(`error,${response.statusText}`)
        }
      }
    } catch (error) {
      console.error("Error occurred:", error);
      if (error.response && error.response.status === 404) {
        Swal.fire({
          icon: "warning",
          title: "No Record Found.!",
          confirmButtonColor: "#d33",
        });
      } else {
        console.log(`An error occurred while fetching data.`)
      }
    }
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

  const handleDelete = async () => {
    const Post_Date = sessionStorage.getItem("Post_Date")
    if (await PostDateRecordLock(formData.doc_date, Post_Date)) {
      return;
    }

    const Total =
      parseFloat(globalCreditTotalAmount) - parseFloat(globalDebitTotalAmount);
    if (Total !== 0) {
      Swal.fire({
        title: "Error",
        text: "Difference must be zero!!!",
        icon: "error",
        confirmButtonText: "OK"
      });
      return;
    }

    try {
      const response = await axios.get(
        `${API_URL}/getreceiptpaymentByid?Company_Code=${companyCode}&Year_Code=${YearCode}&tran_type=${formData.tran_type}&doc_no=${formData.doc_no}`
      );
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
        const deleteApiUrl = `${API_URL}/delete_data_by_tranid?tranid=${formData.tranid}&company_code=${companyCode}&year_code=${YearCode}&doc_no=${formData.doc_no}&Tran_Type=${formData.tran_type}`;
        await axios.delete(deleteApiUrl);

        Swal.fire({
          title: "Deleted!",
          text: "Record deleted successfully!",
          icon: "success",
          confirmButtonText: "OK",
        });
        handleCancel();
      } else {
        Swal.fire({
          title: "Cancelled",
          text: "Your record is safe 🙂",
          icon: "info",
        });
      }
    } catch (error) {
      toast.error("Deletion cancelled");
      console.error("Error during API call:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/JournalVoucher_Utility");
  };

  useEffect(() => {
    if (selectedRecord) {
      setUsers(
        lastTenderDetails.map((detail) => ({
          rowaction: "Normal",
          Company_Code: companyCode,
          Year_Code: YearCode,
          Tran_Type: "JV",
          debit_ac: detail.debit_ac,
          AcName: detail.AcName,
          drcr: detail.drcr || "C",
          amount: detail.amount,
          narration: detail.narration,
          detail_id: detail.detail_id,
          da: detail.da || "",
          trandetailid: detail.trandetailid,
          id: detail.trandetailid,
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
        Tran_Type: "JV",
        debit_ac: detail.debit_ac,
        AcName: detail.AcName,
        drcr: detail.drcr || "C",
        amount: detail.amount,
        narration: detail.narration,
        detail_id: detail.detail_id,
        da: detail.da || "",
        trandetailid: detail.trandetailid,
        id: detail.trandetailid,
      }))
    );
  }, [lastTenderDetails]);


  const handleAccode = async (code, accoid, name) => {
    if (!code) {
      setDebitcode("");
      setDebitcodeid("");
      setCreditcodecodename("");
      setAccountsetBalance(0);
      return;
    }
    setDebitcode(code);
    setDebitcodeid(accoid);
    setCreditcodecodename(name);

    setFormDataDetail({
      ...formDataDetail,
      debit_ac: code,
      da: accoid,
      lblacname: name,
    });

    const { balance, gstNo } = await fetchAccountBalance(code);
    if (balance !== null) {
      setAccountsetBalance(balance);
    }
  };

  //calculation For Handling Total, CreditTotal, DebitTotal
  const calculateTotals = (details) => {
    let creditTotal = 0;
    let debitTotal = 0;

    details.forEach((user) => {
      const amount = parseFloat(user.amount || 0);
      if (user.drcr === "C") {
        creditTotal += amount;
      } else if (user.drcr === "D") {
        debitTotal += amount;
      }
    });

    const total = creditTotal + debitTotal;

    globalCreditTotalAmount = creditTotal.toFixed(2);
    globalDebitTotalAmount = debitTotal.toFixed(2);
    globalTotalAmount = total.toFixed(2);

    return { creditTotal, debitTotal, total };
  };

  // const handleChangeDetail = (event) => {
  //   const { name, value } = event.target;
  //   let updatedFormDataDetail = { ...formDataDetail, [name]: value };

  //   setFormDataDetail(updatedFormDataDetail);
  // };


  const handleChangeDetail = (event) => {
    const { name, value } = event.target;
    let updatedFormDataDetail = { ...formDataDetail, [name]: value };

    if (name === 'amount') {
      const convertedAmountInWords = ConvertNumberToWord(value);
      setAmountInWords(convertedAmountInWords);
    }
    setFormDataDetail(updatedFormDataDetail);
  };


  const [popupMode, setPopupMode] = useState("add");

  // const openPopup = () => {
  //   setShowPopup(true);
  //   const selectedValue = formData.tran_type;
  //   setAccountsetBalance(0)
  // };


  const openPopup = (mode) => {
    if (mode === "add") {
      const initialAmount = users.length === 0 ? 0 : diff;
      const lastNarration = users.length > 0 ? users[users.length - 1].narration : "";
      setFormDataDetail(prevDetail => ({
        ...prevDetail,
        amount: Math.abs(initialAmount),
        drcr: diff <= 0 ? "C" : "D",
        narration: lastNarration
      }));
    }
    setAccountsetBalance(0)
    let amount = ConvertNumberToWord(formDataDetail.amount)
    setAmountInWords(amount)
    setPopupMode(mode);
    setShowPopup(true);
  };


  const clearForm = () => {
    setFormDataDetail({
      debit_ac: "",
      credit_ac: "",
      Unit_Code: 0,
      amount: 0,
      // narration: "",
      // narration2: "",
      detail_id: 1,
      Voucher_No: 0,
      Voucher_Type: "",
      Adjusted_Amount: 0.0,
      Tender_No: 0,
      TenderDetail_ID: 0,
      drpFilterValue: "",
      ca: 0,
      uc: 0,
      da: 0,
      tenderdetailid: 0,
      AcadjAccode: 0,
      AcadjAmt: 0.0,
      ac: 0,
      TDS_Rate: 0.0,
      TDS_Amt: 0.0,
      GRN: "",
      TReceipt: "",
    });
    setCreditcodecodename("");
    lblacname = "";
  };

  const addUser = () => {
    setAmountInWords("");
    if (formDataDetail.amount === 0 || formDataDetail.amount === "") {
      Swal.fire({
        title: "Error",
        text: "Please Enter Amount",
        icon: "error",
        confirmButtonText: "OK"
      });
      return;
    }

    const maxDetailId =
      users.length > 0
        ? Math.max(...users.map((user) => user.detail_id)) + 1
        : 1;

    const nextUserId =
      users.length > 0 ? Math.max(...users.map((user) => user.id)) + 1 : 1;

    const newUser = {
      id: nextUserId,
      AcName: Debitcodename,
      ...formDataDetail,
      detail_id: maxDetailId,
      drcr: formDataDetail.drcr || "C",
      rowaction: "add",
    };

    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);

    const updatedCreditTotal = updatedUsers
      .filter((user) => user.drcr === "C" && user.rowaction !== "delete" && user.rowaction !== "DNU")
      .reduce((total, user) => total + parseFloat(user.amount || 0), 0);

    const updatedDebitTotal = updatedUsers
      .filter((user) => user.drcr === "D" && user.rowaction !== "delete" && user.rowaction !== "DNU")
      .reduce((total, user) => total + parseFloat(user.amount || 0), 0);

    const diff = updatedCreditTotal - updatedDebitTotal;

    setCreditTotal(updatedCreditTotal.toFixed(2));
    setDebitTotal(updatedDebitTotal.toFixed(2));
    setDiff(diff.toFixed(2));

    setFormData((prevFormData) => ({
      ...prevFormData,
      total: (updatedCreditTotal + updatedDebitTotal).toFixed(2),
    }));
    closePopup();
    setTimeout(() => {
      addButtonRef.current.focus();
    }, 500)

  };

  const editUser = (user) => {
    setSelectedUser(user);
    setDebitcode(user.debit_ac);
    setDebitcodeid(user.da);
    setCreditcodecodename(user.AcName);
    setFormDataDetail({
      debit_ac: user.debit_ac || "",
      lblacname: user.AcName,
      drcr: user.drcr || "C",
      amount: user.amount || "",
      narration: user.narration || "",
      detail_id: user.detail_id,
      da: user.da || "",
      trandetailid: user.trandetailid,
      id: user.trandetailid,
    });

    openPopup("edit");
    let amount = ConvertNumberToWord(user.amount)
    setAmountInWords(amount)
  };

  const updateUser = async () => {
    if (formDataDetail.amount === "0" || formDataDetail.amount === "") {
      Swal.fire({
        title: "Error",
        text: "Please Enter Amount",
        icon: "error",
        confirmButtonText: "OK"
      });
      return;
    }
    setTimeout(() => {
      addButtonRef.current.focus();
    }, 500)
    const updatedUsers = users.map((user) => {
      if (user.id === selectedUser.id) {
        const updatedRowaction =
          user.rowaction === "Normal" ? "update" : user.rowaction;

        return {
          ...user,

          rowaction: updatedRowaction,
          debit_ac: Debitcode,
          AcName: Debitcodename,
          drcr: formDataDetail.drcr || "C",
          amount: formDataDetail.amount,
          narration: formDataDetail.narration,
          detail_id: user.detail_id,
          da: Debitcodeid || "",
        };
      } else {
        return user;
      }
    });

    let creditTotal = 0;
    let debitTotal = 0;

    updatedUsers.forEach((user) => {
      const amount = parseFloat(user.amount || 0);
      if (user.drcr === "C") {
        creditTotal += amount;
      } else if (user.drcr === "D") {
        debitTotal += amount;
      }
    });

    const diff = creditTotal - debitTotal;

    setCreditTotal(creditTotal.toFixed(2));
    setDebitTotal(debitTotal.toFixed(2));
    setDiff(diff.toFixed(2));

    setFormData((prevFormData) => ({
      ...prevFormData,
      total: (creditTotal + debitTotal).toFixed(2),
    }));

    setUsers(updatedUsers);

    closePopup();

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

    setFormDataDetail({
      ...formDataDetail,
    });

    const amountToAdd = parseFloat(user.amount || 0);
    const isCredit = user.drcr === "C";
    const updatedCreditTotal = isCredit
      ? parseFloat(creditTotal || 0) + amountToAdd
      : parseFloat(creditTotal || 0);

    const updatedDebitTotal = !isCredit
      ? parseFloat(debitTotal || 0) + amountToAdd
      : parseFloat(debitTotal || 0);

    const total = updatedCreditTotal + updatedDebitTotal;
    const diff = isCredit
      ? updatedCreditTotal - updatedDebitTotal
      : updatedDebitTotal - updatedCreditTotal;


    setCreditTotal(updatedCreditTotal.toFixed(2));
    setDebitTotal(updatedDebitTotal.toFixed(2));
    setDiff(diff.toFixed(2));
    setFormData((prevFormData) => ({
      ...prevFormData,
      total: total.toFixed(2),
    }));

    setUsers(updatedUsers);
    setSelectedUser({});
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

    let updatedCreditTotal = 0;
    let updatedDebitTotal = 0;
    updatedUsers.forEach((u) => {
      if (u.rowaction !== "delete" && u.rowaction !== "DNU") {
        const amount = parseFloat(u.amount || 0);
        if (u.drcr === "C") {
          updatedCreditTotal += amount;
        } else {
          updatedDebitTotal += amount;
        }
      }
    });

    // Calculate the diff and total
    const diff = updatedCreditTotal - updatedDebitTotal;
    const total = updatedCreditTotal + updatedDebitTotal;

    // Set the new totals and diff
    setCreditTotal(updatedCreditTotal.toFixed(2));
    setDebitTotal(updatedDebitTotal.toFixed(2));
    setDiff(diff.toFixed(2));

    // Update form data with the new total
    setFormData((prevData) => ({
      ...prevData,
      total: total.toFixed(2),
    }));

    // Update the users state
    setUsers(updatedUsers);
    setSelectedUser({});
  };

  const closePopup = () => {
    setShowPopup(false);
    setSelectedUser({});
    clearForm();
  };

  //Navigation Buttons
  const handleNavigation = async (url, headKey, detailsKey) => {
    try {
      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        const { labels, [headKey]: headData, [detailsKey]: detailsData } = data;

        const DetailsArray = Array.isArray(detailsData) ? detailsData : [];

        const itemNameMap = labels.reduce((map, label) => {
          if (label.debit_ac !== undefined && label.debitacname) {
            map[label.debit_ac] = label.debitacname;
          }
          return map;
        }, {});

        const enrichedDetails = DetailsArray.map((detail) => ({
          ...detail,
          AcName: itemNameMap[detail.debit_ac] || "",
        }));

        const { creditTotal, debitTotal, total } =
          calculateTotals(enrichedDetails);

        setCreditTotal(creditTotal.toFixed(2));
        setDebitTotal(debitTotal.toFixed(2));
        setFormData((prevData) => ({
          ...prevData,
          ...headData,
          total: total.toFixed(2),
        }));

        setLastTenderData(headData || {});
        setLastTenderDetails([]);
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

    try {
      await handleNavigation(
        url,
        "receipt_payment_head",
        "receipt_payment_details"
      );
      setIsEditing(false);
    } catch (error) {
      console.error("Error fetching data on double click:", error);
    }
  };

  const handleKeyDown = async (event) => {
    if (event.key === "Tab") {
      const changeNoValue = event.target.value;
      const url = `${API_URL}/getreceiptpaymentByid?Company_Code=${companyCode}&Year_Code=${YearCode}&tran_type=${formData.tran_type}&doc_no=${changeNoValue}`;

      try {
        await handleNavigation(
          url,
          "receipt_payment_head",
          "receipt_payment_details"
        );
        setIsEditing(false);
      } catch (error) {
        console.error("Error fetching data on Tab keydown:", error);
      }
    }
  };

  const handleNavigateRecord = async () => {
    const url = `${API_URL}/getreceiptpaymentByid?Company_Code=${companyCode}&Year_Code=${YearCode}&tran_type=${navigatedTranType}&doc_no=${navigatedRecord}`;

    try {
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
    } catch (error) {
      console.error("Error fetching data on Tab keydown:", error);
    }
  };


  useEffect(() => {
    if (selectedRecord) {
      handleRecordDoubleClicked();
    } else if (navigatedRecord) {
      handleNavigateRecord()
    } else {
      handleAddOne();
    }
  }, [selectedRecord, navigatedRecord]);

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

  //Validate the input feilds
  const validateNumericInput = (e) => {
    e.target.value = e.target.value.replace(/[^0-9.]/g, "");
  };

  const handleJVreport = () => {
    let doc_no = formData.doc_no;
    let selectType = '';
    let receiptPaymentType = '';
    let fromDate = formData.doc_date;
    let toDate = formData.doc_date;

    setTimeout(() => {
      const url = `/JVReport-reports?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&doc_no=${encodeURIComponent(doc_no)}&selectType=${encodeURIComponent(selectType)}&receiptPaymentType=${encodeURIComponent(receiptPaymentType)}`;
      window.open(url, '_blank', 'toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=800,height=600');
      setIsLoading(false);
    }, 500);

  };

  return (
    <>
      <UserAuditInfo
        createdBy={formData.Created_By}
        modifiedBy={formData.Modified_By}
        title={"Journal Voucher"}
      />
      <div>
        <br></br>
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
          component={<PrintButton disabledFeild={!addOneButtonEnabled} fetchData={handleJVreport} />}
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
        <Box
          component="form"
          sx={{
            display: "flex",
            flexDirection: "column",
          }}
          mt={0.5}
        >
          <Grid sx={{ display: "flex", gap: 1, marginBottom: "10px" }}>
            <Grid container item xs={12} sm={6} md={0.6} >
              <TextField
                label="Change No"
                id="changeNo"
                name="changeNo"
                autoComplete="off"
                onKeyDown={handleKeyDown}
                disabled={!addOneButtonEnabled}
                variant="outlined"
                size="small"
                InputLabelProps={{
                  shrink: true,
                  style: { fontWeight: 'bold' },
                }}
              />
            </Grid>
            <Grid container item xs={12} sm={4} md={0.5} >
              <TextField
                label="Doc No"
                id="doc_no"
                name="doc_no"
                value={formData.doc_no}
                onChange={handleChange}
                disabled
                variant="outlined"
                size="small"
                InputLabelProps={{
                  shrink: true,
                  style: { fontWeight: 'bold' },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4} md={1} mt={-0.5} sx={{ padding: 0.5, minWidth: '100px', maxWidth: '100px' }}>
              <TextField
                label="Doc Date"
                type="date"
                id="doc_date"
                name="doc_date"
                value={formData.doc_date}
                onChange={handleChange}
                inputRef={docDateRef}
                disabled={!isEditing && addOneButtonEnabled}
                InputLabelProps={{
                  style: { fontSize: '12px' },
                }}
                InputProps={{
                  style: { fontSize: '12px', height: '39px' },
                }}
                variant="outlined"
                size="small"
              />
            </Grid>
          </Grid>

        </Box>
        {isLoading && (
          <div className="loading-overlay">
            <div className="spinner-container">
              <SaveUpdateSpinner />
            </div>
          </div>
        )}
        {/* <AddButton openPopup={openPopup} isEditing={isEditing} ref={addButtonRef} setFocusToFirstField={setFocusToFirstField} /> */}


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


        <div>
          {showPopup && (
            <div className="JournanalVouchermodal" role="dialog">
              <div
                className="JournanalVouchermodal-dialog"
                style={{
                  width: "40%",
                  margin: "auto",
                  position: "absolute",
                  top: "50%",
                  left: "35%",
                  transform: "translate(-50%, -50%)",
                }}
              >
                <div className="JournanalVouchermodal-content">
                  <div className="JournanalVouchermodal-header">
                    <h5 className="JournalVoucherModal-title">
                      {selectedUser.id
                        ? "Update Journal Voucher"
                        : "Add Journal Voucher"}
                    </h5>
                    <button
                      type="button"
                      onClick={closePopup}
                      aria-label="Close"
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "4px",
                      }}
                    >
                      <span aria-hidden="true">&times;</span>
                    </button>
                  </div>

                  <div className="JournanalVouchermodal-body" style={{ padding: "20px" }}>
                    <form>
                      <div
                        style={{
                          marginBottom: "5px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", flex: 1 }}>
                          <label
                            htmlFor="debit_ac"
                            style={{
                              fontWeight: "600",
                              marginRight: "10px",
                              display: "inline-block",
                              fontSize: "16px",
                              fontWeight: "bold",
                              marginBottom: "20px",
                            }}
                          >
                            Account Code:
                          </label>
                          <AccountMasterHelp
                            name="debit_ac"
                            onAcCodeClick={handleAccode}
                            CategoryName={lblacname ? lblacname : Debitcodename}
                            CategoryCode={newDebit_ac || formDataDetail.debit_ac}
                            Ac_type={[]}
                            tabIndex={4}
                            disabledFeild={!isEditing && addOneButtonEnabled}
                            firstInputRef={firstInputRef}
                            style={{
                              width: "50%",
                              fontSize: "14px",
                              borderRadius: "4px",
                              border: "1px solid #ccc",
                              backgroundColor: "#fff",
                              boxSizing: "border-box",
                            }}
                          />
                        </div>

                        <h4
                          style={{
                            marginLeft: "20px",
                            alignSelf: "center",
                          }}
                        >
                          ₹ {formatReadableAmount(accountbalance)}
                        </h4>
                      </div>

                      <div
                        style={{
                          marginBottom: "15px",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <label
                          htmlFor="drcr"
                          style={{
                            fontSize: "16px",
                            fontWeight: "bold",
                            marginRight: "10px",
                            display: "inline-block",
                          }}
                        >
                          DRCR:
                        </label>
                        <select
                          id="drcr"
                          name="drcr"
                          value={formDataDetail.drcr}
                          onChange={handleChangeDetail}
                          disabled={!isEditing && addOneButtonEnabled}
                          style={{
                            width: "16%",
                            padding: "8px 12px",
                            fontSize: "14px",
                            borderRadius: "4px",
                            border: "1px solid #ccc",
                            backgroundColor: "#fff",
                            boxSizing: "border-box",
                            marginLeft: "70px"
                          }}
                        >
                          <option value="C">Credit</option>
                          <option value="D">Debit</option>
                        </select>
                      </div>

                      <div
                        style={{
                          marginBottom: "15px",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <label
                          htmlFor="amount"
                          style={{
                            fontSize: "16px",
                            fontWeight: "bold",
                            marginRight: "10px",
                            display: "inline-block",
                          }}
                        >
                          Amount:
                        </label>
                        <input
                          type="text"
                          name="amount"
                          value={formDataDetail.amount}
                          onChange={handleChangeDetail}
                          autoComplete="off"
                          style={{
                            width: "16%",
                            padding: "8px 12px",
                            fontSize: "14px",
                            borderRadius: "4px",
                            border: "1px solid #ccc",
                            backgroundColor: "#fff",
                            boxSizing: "border-box",
                            marginLeft: "56px"
                          }}
                        />
                      </div>

                      <div
                        style={{
                          marginBottom: "15px",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <label
                          htmlFor="narration"
                          style={{
                            fontSize: "16px",
                            fontWeight: "bold",
                            marginRight: "10px",
                            display: "inline-block",
                          }}
                        >
                          Narration:
                        </label>
                        <textarea
                          name="narration"
                          value={formDataDetail.narration}
                          onChange={handleChangeDetail}
                          autoComplete="off"
                          disabled={!isEditing && addOneButtonEnabled}
                          style={{
                            width: "50%",
                            fontSize: "14px",
                            borderRadius: "4px",
                            height: "60px",
                            marginLeft: "45px"
                          }}
                        />
                      </div>
                      <div
                        style={{
                          marginBottom: "15px",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <label
                          htmlFor="narration"
                          style={{
                            fontSize: "16px",
                            fontWeight: "bold",
                            marginRight: "10px",
                            display: "inline-block",
                          }}
                        >
                          Amount in Words:
                        </label>
                        <p style={{ marginLeft: "20px", marginTop: '20px', color: "blue", fontWeight: "bold" }}> {amountInWords}</p>
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
          <TableContainer component={Paper} className="mt-4" >
            <Table sx={{ minWidth: 650 }} aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell sx={headerCellStyle}>Actions</TableCell>
                  <TableCell sx={headerCellStyle}>ID</TableCell>
                  <TableCell sx={headerCellStyle}>Account Code</TableCell>
                  <TableCell sx={headerCellStyle}>Account Name</TableCell>
                  <TableCell sx={headerCellStyle}>DRCR</TableCell>
                  <TableCell sx={headerCellStyle}>Amount</TableCell>
                  <TableCell sx={headerCellStyle}>Narration</TableCell>
                  <TableCell sx={headerCellStyle}>Trandetailid</TableCell>
                  <TableCell sx={headerCellStyle}>Debitid</TableCell>
                  {/* <TableCell sx={headerCellStyle}>Rowaction</TableCell> */}
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
                      {user.rowaction === "add" ||
                        user.rowaction === "update" ||
                        user.rowaction === "Normal" ? (
                        <>
                          <EditButton editUser={editUser} user={user} isEditing={isEditing} />
                          <DeleteButton deleteModeHandler={deleteModeHandler} user={user} isEditing={isEditing} />

                        </>
                      ) : user.rowaction === "DNU" ||
                        user.rowaction === "delete" ? (
                        <OpenButton openDelete={openDelete} user={user} />
                      ) : null}
                    </TableCell>
                    <TableCell sx={{ padding: '2px 4px', textAlign: 'left', fontSize: '12px' }}>{user.detail_id}</TableCell>
                    <TableCell sx={{ padding: '2px 4px', textAlign: 'left', fontSize: '12px' }}>{user.debit_ac}</TableCell>
                    <TableCell sx={{ padding: '2px 4px', textAlign: 'left', fontSize: '12px' }}>{user.AcName}</TableCell>
                    <TableCell sx={{ padding: '2px 4px', textAlign: 'left', fontSize: '12px' }}>{user.drcr || "C"}</TableCell>
                    <TableCell align="right" sx={{ padding: '2px 4px', textAlign: 'left', fontSize: '12px' }}>{user.amount}</TableCell>
                    <TableCell sx={{ padding: '2px 4px', textAlign: 'left', fontSize: '12px' }}>{user.narration}</TableCell>
                    <TableCell sx={{ padding: '2px 4px', textAlign: 'left', fontSize: '12px' }}>{user.trandetailid}</TableCell>
                    <TableCell sx={{ padding: '2px 4px', textAlign: 'left', fontSize: '12px' }}>{user.da}</TableCell>
                    {/* <TableCell>{user.rowaction}</TableCell> */}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
        <Box
          sx={{
            display: "flex",
            gap: 3,
            alignItems: "center",
            marginTop: 2,
            justifyContent: "center",
            marginBottom: 10
          }}
        >
          <TextField
            label="Total"
            id="total"
            name="total"
            value={formatReadableAmount(formData.total)}
            onChange={handleChange}
            disabled
            variant="outlined"
            size="small"
            inputProps={{
              sx: { textAlign: "right" },
              inputMode: "decimal",
              pattern: "[0-9]*[.,]?[0-9]+",
              onInput: validateNumericInput,
            }}
          />
          <TextField
            label="Credit Total"
            id="creditTotal"
            name="creditTotal"
            value={formatReadableAmount(creditTotal)}
            onChange={handleChange}
            disabled
            variant="outlined"
            size="small"
            inputProps={{
              sx: { textAlign: "right" },
              inputMode: "decimal",
              pattern: "[0-9]*[.,]?[0-9]+",
              onInput: validateNumericInput,
            }}
          />
          <TextField
            label="Debit Total"
            id="debitTotal"
            name="debitTotal"
            value={formatReadableAmount(debitTotal)}
            onChange={handleChange}
            disabled
            variant="outlined"
            size="small"
            inputProps={{
              sx: { textAlign: "right" },
              inputMode: "decimal",
              pattern: "[0-9]*[.,]?[0-9]+",
              onInput: validateNumericInput,
            }}
          />
          <TextField
            label="Difference"
            id="diff"
            name="diff"
            value={formatReadableAmount(diff)}
            disabled
            variant="outlined"
            size="small"
            inputProps={{
              sx: { textAlign: "right" },
              inputMode: "decimal",
              pattern: "[0-9]*[.,]?[0-9]+",
              onInput: validateNumericInput,
            }}
          />
        </Box>
      </div>
    </>
  );
};
export default JournalVoucher;