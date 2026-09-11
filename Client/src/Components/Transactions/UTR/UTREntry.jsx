import React, { useState, useRef, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import AccountMasterHelp from "../../../Helper/AccountMasterHelp";
import UTRLotnoHelp from "../../../Helper/UTRLotnoHelp";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import ActionButtonGroup from "../../../Common/CommonButtons/ActionButtonGroup";
import NavigationButtons from "../../../Common/CommonButtons/NavigationButtons";
import { ToastContainer, toast } from "react-toastify";
import { TextField, Grid, Checkbox, FormControlLabel } from "@mui/material";
import "react-toastify/dist/ReactToastify.css";
import UTRReport from "./UTRReport";
import { useRecordLocking } from "../../../hooks/useRecordLocking"
import UserAuditInfo from "../../../Common/UserAuditInfo/UserAuditInfo";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Typography } from '@mui/material';
import AddButton from "../../../Common/Buttons/AddButton";
import EditButton from "../../../Common/Buttons/EditButton";
import DeleteButton from "../../../Common/Buttons/DeleteButton";
import OpenButton from "../../../Common/Buttons/OpenButton";
import "./Utr.css"
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount"
import Swal from "sweetalert2";
import { ConvertNumberToWord } from "../../../Common/FormatFunctions/ConvertNumberToWord";
import DetailAddButtom from "../../../Common/Buttons/DetailAddButton";
import DetailCloseButton from "../../../Common/Buttons/DetailCloseButton";
import DetailUpdateButton from "../../../Common/Buttons/DetailUpdateButton";
import SaveUpdateSpinner from "../../../Common/Spinners/SaveUpdateSpinner";
import { validateDocumentDate } from "../../../Common/ValidateDateRange/ValidateDateRange"
import { PostDateRecordLock } from "../../../Common/PostDateLock/PostDateRangeCheck";

var lblBankname;
var newbank_ac;
var lblmillname;
var newmill_code;
var newLot_no;

//Common css for the table.
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

const UTREntry = () => {
  const docDateRef = useRef(null);
  //GET Values from the session Storage
  const companyCode = sessionStorage.getItem("Company_Code");
  const Year_Code = sessionStorage.getItem("Year_Code");
  const username = sessionStorage.getItem("username");
  const Post_Date = sessionStorage.getItem("Post_Date")
  const User_Id = sessionStorage.getItem("User_ID");
  const accountingYearData = sessionStorage.getItem('Accounting_Year');

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
  const [isLoading, setIsLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedUser, setSelectedUser] = useState({});
  const [users, setUsers] = useState([]);
  const [tenderDetails, setTenderDetails] = useState({});
  const [deleteMode, setDeleteMode] = useState(false);
  let [Tenderno, setTenderno] = useState("");
  const [bancode, setBankCode] = useState("");
  const [bankid, setBankId] = useState("");
  const [millcode, setMillCode] = useState("");
  const [millid, setMillId] = useState("");
  const [lastTenderDetails, setLastTenderDetails] = useState([]);
  const [lastTenderData, setLastTenderData] = useState({});
  const [globalTotalAmount, setGlobalTotalAmount] = useState(0.0);
  const [diff, setDiff] = useState(0.0);
  const [popupMode, setPopupMode] = useState("add");
  const [amountInWords, setAmountInWords] = useState('');

  const addButtonRef = useRef(null);
  const firstInputRef = useRef(null);

  //SET focus to first input feild
  const setFocusToFirstField = () => {
    if (firstInputRef.current) {
      firstInputRef.current.focus();
    }
  };

  const navigate = useNavigate();
  const location = useLocation();

  const selectedRecord = location.state?.selectedRecord;
  const permissions = location.state?.permissionsData;
  const inputRef = useRef(null)

  const searchParams = new URLSearchParams(location.search);
  const navigatedRecord = searchParams.get('navigatedRecord');

  const initialFormData = {
    doc_no: "",
    doc_date: new Date().toISOString().split("T")[0],
    bank_ac: 0,
    mill_code: 0,
    amount: 0.0,
    utr_no: "",
    narration_header: "",
    narration_footer: "",
    Company_Code: companyCode,
    Year_Code: Year_Code,
    Branch_Code: "",
    Created_By: "",
    Modified_By: "",
    Lott_No: 0,
    ba: 0,
    mc: 0,
    IsSave: 0,
  };

  const [formDataDetail, setFormDataDetail] = useState({
    grade_no: "",
    amount: 0.0,
    lotCompany_Code: 0,
    lotYear_Code: 0,
    Adjusted_Amt: 0.0,
    Detail_Id: 1,
    ln: null,
  });

  const [formData, setFormData] = useState(initialFormData);

  // Manage the lock-unlock record at the same time multiple users edit the same record.
  const { isRecordLockedByUser, lockRecord, unlockRecord } = useRecordLocking(formData.doc_no, "", companyCode, Year_Code, "utr_entry");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevState) => {
      const updatedFormData = { ...prevState, [name]: value };
      if (name === 'amount') {
        const convertedAmountInWords = ConvertNumberToWord(value);
        setAmountInWords(convertedAmountInWords);
      }
      return updatedFormData;
    });
  };

  const handleDateBlur = (event) => {
  if (isEditMode) return; 

  const { value } = event.target;
  const selected = new Date(value);
  const minAllowed = new Date();
  minAllowed.setDate(minAllowed.getDate() - 10);

  // Clear time for safe comparison
  selected.setHours(0, 0, 0, 0);
  minAllowed.setHours(0, 0, 0, 0);

  if (value && selected < minAllowed) {
    alert("Date must not be older than 10 days from today.");
    setFormData((prev) => ({
      ...prev,
      doc_date: new Date().toISOString().split("T")[0], // reset to today
    }));
  }
};


  const handleCheckbox = (e) => {
    const { name, checked } = e.target;
    const value =
      checked ? 1 : 0;

    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

 // Inside component
const [minDateStr, setMinDateStr] = useState('');

useEffect(() => {
  const today = new Date();
  const minDate = new Date();
  minDate.setDate(today.getDate() - 10);
  setMinDateStr(minDate.toISOString().split('T')[0]);
}, []);



  //Handling Bank Code Help
  const handleBankCode = (code, accoid) => {
    setBankCode(code);
    setBankId(accoid);

    setFormData({
      ...formData,
      bank_ac: code,
      ba: accoid,
    });
  };

  //Handling MillCode Help
  const handleMillCode = (code, accoid) => {
    setMillCode(code);
    setMillId(accoid);

    setFormData({
      ...formData,
      mill_code: code,
      mc: accoid,
    });
  };

  const fetchLastRecord = () => {
    fetch(`${API_URL}/get-lastutrdata?Company_Code=${companyCode}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch last record");
        }
        return response.json();
      })
      .then((data) => {
        const nextDocNo = data.last_head_data && data.last_head_data.doc_no ? data.last_head_data.doc_no + 1 : 1;
        setFormData((prevState) => ({
          ...prevState,
          doc_no: nextDocNo,
        }));
      })
      .catch((error) => {
        console.error("Error fetching last record:", error);
        setFormData((prevState) => ({
          ...prevState,
          doc_no: 1,
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
    fetchLastRecord();
    setFormData(initialFormData);
    setLastTenderDetails([]);
    setGlobalTotalAmount(0.0);
    setDiff(0.0);
    lblBankname = "";
    newbank_ac = "";
    lblmillname = "";
    newmill_code = "";
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleSaveOrUpdate = async () => {

    const Post_Date = sessionStorage.getItem("Post_Date")

    const formattedEntryDate = formData.doc_date;
    const isValid = validateDocumentDate(formattedEntryDate, accountingYearData);

    if (!isValid) {
      return
    }

    if (await PostDateRecordLock(formData.doc_date, Post_Date)) {
      return;
    }

    if (!formData.bank_ac || formData.bank_ac === 0) {
      Swal.fire({
        title: "Error",
        text: "Bank code is required.",
        icon: "error",
        confirmButtonText: "OK"
      });
      return;
    }

    if (!formData.mill_code || formData.mill_code === 0) {
      Swal.fire({
        title: "Error",
        text: "Mill code is required.",
        icon: "error",
        confirmButtonText: "OK"
      });
      return;
    }
    if (!formData.narration_header) {
      Swal.fire({
        title: "Error",
        text: "Narration Header Is Required.",
        icon: "error",
        confirmButtonText: "OK"
      });
      return;
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
    setIsLoading(true);

    let head_data = { ...formData, Year_Code: Year_Code };
    if (isEditMode) {
      head_data = {
        ...head_data,
        Modified_By: username,
        Year_Code: Year_Code,
        User_Id: User_Id
      };
      delete head_data.utrid;
    } else {
      head_data = {
        ...head_data,
        Created_By: username,
      };
    }
    delete head_data.lot_no
    const detail_data = users.map((user) => ({
      rowaction: user.rowaction,
      utrdetailid: user.utrdetailid,
      lot_no: user.lot_no,
      grade_no: user.grade_no,
      amount: parseFloat(user.amount) || 0,
      lotCompany_Code: user.lotCompany_Code,
      Detail_Id: 1,
      Company_Code: companyCode,
      Year_Code: Year_Code,
      lotYear_Code: user.lotYear_Code,
      LTNo: 0,
      Adjusted_Amt: parseFloat(user.Adjusted_Amt) || 0,
      ln: user.ln,
    }));

    const HeadAmount = parseFloat(head_data.amount) || 0;
    if (users.length > 0) {
      if (Math.abs(HeadAmount - globalTotalAmount) > 0.01) {
        Swal.fire({
          title: "Error",
          text: "Difference Must Be Zero.!!",
          icon: "error",
          confirmButtonText: "OK"
        });
        setIsLoading(false);
        return;
      }
    }

    const requestData = { head_data, detail_data };

    const apiEndpoint = isEditMode
      ? `${API_URL}/update-utr?utrid=${formData.utrid}`
      : `${API_URL}/insert-utr`;
    const apiMethod = isEditMode ? axios.put : axios.post;

    apiMethod(apiEndpoint, requestData)
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
        setIsLoading(false);

        setTimeout(() => {
          window.location.reload();
        }, 1000);
        // navigate(`/utr-entry?navigatedRecord=${formData.doc_no}`);
      })
      .catch((error) => {
        console.error("Error saving data:", error);
        toast.error("Error saving or updating record");
        setIsLoading(false);
      });
  };

  //handle Edit record functionality.
  const handleEdit = async () => {
    const Post_Date = sessionStorage.getItem("Post_Date")
    if (await PostDateRecordLock(formData.doc_date, Post_Date)) {
      return;
    }

  
    const formattedEntryDate = formData.doc_date;
    const isValid = validateDocumentDate(formattedEntryDate, accountingYearData);

    if (!isValid) {
      return
    }

    axios.get(`${API_URL}/getutrByid?Company_Code=${companyCode}&doc_no=${formData.doc_no}`)
      .then((response) => {
        const data = response.data;
        const isLockedNew = data.utr_head.LockedRecord;
        const isLockedByUserNew = data.utr_head.LockedUser;

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
          ...data.utr_head
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
        `${API_URL}/get-lastutrdata?Company_Code=${companyCode}`
      );
      if (response.status === 200) {
        const data = response.data;
        const { last_head_data, last_details_data, labels } = data;
        const detailsArray = Array.isArray(last_details_data)
          ? last_details_data
          : [];

        lblBankname = data.labels.bankAcName;
        lblmillname = data.labels.millName;
        newbank_ac = data.last_head_data.bank_ac;
        newmill_code = data.last_head_data.mill_code;
        newLot_no = data.last_details_data.lot_no;

        setFormData((prevData) => ({
          ...prevData,
          ...data.last_head_data,
        }));
        unlockRecord();
        setUsers([...users, data.last_details_data]);
        const totalItemAmount = detailsArray.reduce(
          (total, user) => total + parseFloat(user.amount),
          0
        );
        setGlobalTotalAmount(totalItemAmount.toFixed(2));
        const totalDiff =
          (parseFloat(data.last_head_data.amount) || 0) - totalItemAmount;
        setDiff(totalDiff.toFixed(2));
        setLastTenderData(data.last_head_data || {});
        setLastTenderDetails(detailsArray);

      } else {
        if (response.status === 404) {
          toast.error("Data not found.");
          Swal.fire({
            icon: "warning",
            title: "Data not found.!",
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
          title: "Data not found.!",
          confirmButtonColor: "#d33",
        });
      } else {
        console.log(`An error occurred while fetching data.`)
      }
    }
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

    const accountingYearData = sessionStorage.getItem('Accounting_Year');
    const formattedEntryDate = formData.doc_date;
    const isValid = validateDocumentDate(formattedEntryDate, accountingYearData);

    if (!isValid) {
      return
    }

    axios.get(`${API_URL}/getutrByid?Company_Code=${companyCode}&doc_no=${formData.doc_no}`)
      .then(async (response) => {
        const data = response.data;
        const isLockedNew = data.utr_head.LockedRecord;
        const isLockedByUserNew = data.utr_head.LockedUser;

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
          setIsLoading(true)
          setIsEditMode(false);
          setAddOneButtonEnabled(true);
          setEditButtonEnabled(true);
          setDeleteButtonEnabled(true);
          setBackButtonEnabled(true);
          setSaveButtonEnabled(false);
          setCancelButtonEnabled(false);

          try {
            const deleteApiUrl = `${API_URL}/delete_data_by_utrid?utrid=${formData.utrid}&Company_Code=${companyCode}&doc_no=${formData.doc_no}&Year_Code=${Year_Code}&User_Id=${User_Id}`;
            const response = await axios.delete(deleteApiUrl);
            Swal.fire({
              title: "Deleted!",
              text: "Record deleted successfully!",
              icon: "success",
              confirmButtonText: "OK",
            });
            handleCancel();
            setIsLoading(false)
          } catch (error) {
            toast.error("Deletion failed");
            console.error("Error during API call:", error);
          }
        } else {
          Swal.fire({
            title: "Cancelled",
            text: "Your record is safe 🙂",
            icon: "info",
          });
        }
      })
      .catch((error) => {
        console.error("Error fetching record lock status:", error);
        setIsLoading(false)
      });
  };

  useEffect(() => {
    if (users.length > 0) {
      const totalDiff = (parseFloat(formData.amount) || 0) - parseFloat(globalTotalAmount);
      setDiff(totalDiff.toFixed(2));
    } else {
      setDiff("0.00");
    }
  }, [formData.amount, globalTotalAmount, users.length]);



  const handleBack = () => {
    navigate("/utrentry-Utility");
  };

  const handleChangeDetail = (event) => {
    const { name, value } = event.target;
    setFormDataDetail((prevDetail) => ({
      ...prevDetail,
      [name]: value,
    }));
  };

  //Detail Part Functionality
  const openPopup = (mode) => {
    if (mode === "add") {
      const initialAmount = users.length === 0 ? 0 : diff;
      setFormDataDetail(prevDetail => ({
        ...prevDetail,
        amount: initialAmount,
      }));
      clearForm();
    }
    setPopupMode(mode);
    setShowPopup(true);
  };

  //close popup function
  const closePopup = () => {
    setShowPopup(false);
    setSelectedUser({});
    clearForm();
  };

  //Handling PurchaseNumber Help
  const handlePurcno = (Tenderno, Tenderid) => {
    setTenderno(Tenderno);

    setFormData({
      ...formData,
      lot_no: Tenderno,
    });
  };

  //Fetching Details Of Selected PurchaseNo
  const handleTenderDetailsFetched = (details) => {
    setTenderDetails(details.last_details_data[0]);

    const newData = {
      grade_no: details.last_details_data[0].Grade,
      lotCompany_Code: details.last_details_data[0].Company_Code,
      lotYear_Code: details.last_details_data[0].Year_Code,
      ln: details.last_details_data[0].tenderid,
      Adjusted_Amt: details.last_details_data[0].Packing,
      lot_no: details.last_details_data[0].Tender_No,
    };

    setFormDataDetail((prevState) => ({
      ...prevState,
      ...newData,
    }));

    return newData;
  };

  //Add Records In Detail
  const addUser = async () => {
    if (formDataDetail.amount === 0 || formDataDetail.amount === "") {
      Swal.fire({
        title: "Error",
        text: "Please Enter Amount.",
        icon: "error",
        confirmButtonText: "OK"
      });
      return;
    }
    setTimeout(() => {
      addButtonRef.current.focus();
    }, 500)
    const newUser = {
      id: users.length > 0 ? Math.max(...users.map((user) => user.id)) + 1 : 1,
      ...formDataDetail,
      lot_no: Tenderno,
      amount: users.length === 0 ? formDataDetail.amount : diff,
      rowaction: "add",
    };

    const newUsers = [...users, newUser];

    const totalItemAmount = newUsers
      .filter((user) => user.rowaction !== "delete" && user.rowaction !== "DNU")
      .reduce((total, user) => total + parseFloat(user.amount || 0), 0);
    setGlobalTotalAmount(totalItemAmount.toFixed(2));
    const totalDiff = (parseFloat(formData.amount) || 0) - totalItemAmount;
    setDiff(totalDiff.toFixed(2));
    setUsers(newUsers);
    closePopup();
  };

  const clearForm = () => {
    setFormDataDetail(prevDetail => ({
      ...prevDetail,
      lot_no: 0,
      grade_no: "",
      lotCompany_Code: 0,
      lotYear_Code: 0,
      Adjusted_Amt: null,
      ln: null,
    }));
    setTenderno("")
    newLot_no = 0
  };

  //Edit Record In Detail
  const editUser = (user) => {
    setSelectedUser(user);
    setTenderno(user.lot_no);
    setFormDataDetail({
      grade_no: user.grade_no || "",
      amount: user.amount || "",
      lotCompany_Code: user.lotCompany_Code || "",
      lotYear_Code: user.lotYear_Code || "",
      Adjusted_Amt: user.Adjusted_Amt || "",
      ln: user.ln || "",
    });

    openPopup("edit");
  };

  useEffect(() => {
    setTenderno(Tenderno);
  }, [Tenderno]);

  //Setting Calculations For Amount and Diff
  useEffect(() => {
    if (showPopup) {
      const initialAmount =
        selectedUser && selectedUser.id
          ? selectedUser.amount
          : users.length === 0
            ? formData.amount
            : diff;

      setFormDataDetail({
        ...formDataDetail,
        amount: initialAmount,
        grade_no: selectedUser?.grade_no || "",
        lotCompany_Code: selectedUser?.lotCompany_Code || 0,
        lotYear_Code: selectedUser?.lotYear_Code || 0,
        Adjusted_Amt: selectedUser?.Adjusted_Amt || 0,
        ln: selectedUser?.ln || null,
      });
    }
  }, [showPopup, selectedUser, users, formData, diff]);

  //Update Record In Detail
  const updateUser = async () => {
    if (formDataDetail.amount === "0" || formDataDetail.amount === "") {
      Swal.fire({
        title: "Error",
        text: "Please Enter Amount.",
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
          ...formDataDetail,
          lot_no: Tenderno,
          rowaction: updatedRowaction,
        };
      } else {
        return user;
      }
    });

    setUsers(updatedUsers);

    const totalItemAmount = updatedUsers.reduce(
      (total, user) => total + parseFloat(user.amount || 0),
      0
    );
    setGlobalTotalAmount(totalItemAmount.toFixed(2));
    const totalDiff = (parseFloat(formData.amount) || 0) - totalItemAmount;
    setDiff(totalDiff.toFixed(2));
    closePopup();
  };

  //Delete Records In Detail
  const deleteModeHandler = async (userToDelete) => {
    let updatedUsers;

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

    setDiff((prevDiff) =>
      (parseFloat(prevDiff) + parseFloat(userToDelete.amount)).toFixed(2)
    );

    setGlobalTotalAmount((prevTotal) =>
      (parseFloat(prevTotal) - parseFloat(userToDelete.amount)).toFixed(2)
    );

    setUsers(updatedUsers);
    setSelectedUser({});
  };

  //Open Records In Detail
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

    setDiff((prevDiff) =>
      (parseFloat(prevDiff) - parseFloat(user.amount)).toFixed(2)
    );

    setGlobalTotalAmount((prevTotal) =>
      (parseFloat(prevTotal) + parseFloat(user.amount)).toFixed(2)
    );

    setFormDataDetail({
      ...formDataDetail,
    });

    setUsers(updatedUsers);

    setSelectedUser({});
  };

  useEffect(() => {
    if (selectedRecord) {
      handlerecordDoubleClicked();
    }
    else if (navigatedRecord) {
      handleNavigateRecord()
    }
    else {
      handleAddOne();
    }
  }, [selectedRecord, navigatedRecord]);

  useEffect(() => {
    if (selectedRecord) {
      setUsers(
        lastTenderDetails.map((detail) => ({
          rowaction: "Normal",

          utrdetailid: detail.utrdetailid,
          lot_no: detail.lot_no,
          grade_no: detail.grade_no,
          amount: detail.amount,
          lotCompany_Code: detail.lotCompany_Code,
          Detail_Id: detail.Detail_Id,
          Company_Code: companyCode,
          Year_Code: Year_Code,
          lotYear_Code: detail.lotYear_Code,
          LTNo: 0,
          Adjusted_Amt: detail.Adjusted_Amt,
          ln: detail.ln,
          id: detail.utrdetailid,
        }))
      );
    }
  }, [selectedRecord, lastTenderDetails]);

  useEffect(() => {
    setUsers(
      lastTenderDetails.map((detail) => ({
        rowaction: "Normal",
        utrdetailid: detail.utrdetailid,
        lot_no: detail.lot_no,
        grade_no: detail.grade_no,
        amount: detail.amount,
        lotCompany_Code: detail.lotCompany_Code,
        Detail_Id: detail.Detail_Id,
        Company_Code: companyCode,
        Year_Code: Year_Code,
        lotYear_Code: detail.lotYear_Code,
        LTNo: 0,
        Adjusted_Amt: detail.Adjusted_Amt,
        ln: detail.ln,
        id: detail.utrdetailid,
      }))
    );
  }, [lastTenderDetails]);

  //get a particular record
  const handlerecordDoubleClicked = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/getutrByid?Company_Code=${companyCode}&doc_no=${selectedRecord.doc_no}`
      );
      const data = response.data;
      lblBankname = data.labels.bankAcName;
      lblmillname = data.labels.millName;
      newbank_ac = data.utr_head.bank_ac;
      newmill_code = data.utr_head.mill_code;

      setFormData((prevData) => ({
        ...prevData,
        ...data.utr_head,
      }));
      setLastTenderData(data.utr_head || {});
      setLastTenderDetails(data.utr_details || []);

      const totalItemAmount = data.utr_details.reduce(
        (total, user) => total + parseFloat(user.amount),
        0
      );
      setGlobalTotalAmount(totalItemAmount.toFixed(2));

      const totalDiff =
        (parseFloat(data.utr_head.amount) || 0) - totalItemAmount;
      setDiff(totalDiff.toFixed(2));

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

  //change No functionality to get that particular record
  const handleKeyDown = async (event) => {
    if (event.key === "Tab") {
      const changeNoValue = event.target.value;
      try {
        const response = await axios.get(
          `${API_URL}/getutrByid?Company_Code=${companyCode}&doc_no=${changeNoValue}`
        );
        const data = response.data;
        lblBankname = data.labels.bankAcName;
        lblmillname = data.labels.millName;
        newbank_ac = data.utr_head.bank_ac;
        newmill_code = data.utr_head.mill_code;

        setFormData((prevData) => ({
          ...prevData,
          ...data.utr_head,
        }));
        setLastTenderData(data.utr_head || {});
        setLastTenderDetails(data.utr_details || []);

        const totalItemAmount = data.utr_details.reduce(
          (total, user) => total + parseFloat(user.amount),
          0
        );
        setGlobalTotalAmount(totalItemAmount.toFixed(2));
        const totalDiff =
          (parseFloat(data.utr_head.amount) || 0) - totalItemAmount;
        setDiff(totalDiff.toFixed(2));
        setIsEditing(false);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }
  };

  //Navigation Buttons

  const handleNavigateRecord = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/getutrByid?Company_Code=${companyCode}&doc_no=${navigatedRecord}`
      );
      const data = response.data;
      lblBankname = data.labels.bankAcName;
      lblmillname = data.labels.millName;
      newbank_ac = data.utr_head.bank_ac;
      newmill_code = data.utr_head.mill_code;

      setFormData((prevData) => ({
        ...prevData,
        ...data.utr_head,
      }));
      setLastTenderData(data.utr_head || {});
      setLastTenderDetails(data.utr_details || []);

      const totalItemAmount = data.utr_details.reduce(
        (total, user) => total + parseFloat(user.amount),
        0
      );
      setGlobalTotalAmount(totalItemAmount.toFixed(2));
      const totalDiff =
        (parseFloat(data.utr_head.amount) || 0) - totalItemAmount;
      setDiff(totalDiff.toFixed(2));
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

  const handleFirstButtonClick = async () => {
    try {
      const response = await fetch(
        `${API_URL}/get-firstutr-navigation?Company_Code=${companyCode}`
      );
      if (response.ok) {
        const data = await response.json();

        lblBankname = data.labels.bankAcName;
        lblmillname = data.labels.millName;
        newbank_ac = data.first_head_data.bank_ac;
        newmill_code = data.first_head_data.mill_code;

        setFormData((prevData) => ({
          ...prevData,
          ...data.first_head_data,
        }));
        setLastTenderData(data.first_head_data || {});
        setLastTenderDetails(data.first_details_data || []);

        const totalItemAmount = data.first_details_data.reduce(
          (total, user) => total + parseFloat(user.amount),
          0
        );
        setGlobalTotalAmount(totalItemAmount.toFixed(2));
        const totalDiff =
          (parseFloat(data.first_head_data.amount) || 0) - totalItemAmount;
        setDiff(totalDiff.toFixed(2));
      } else {
        console.error(
          "Failed to fetch first record:",
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
      const response = await fetch(
        `${API_URL}/get-previousutr-navigation?Company_Code=${companyCode}&currentDocNo=${formData.doc_no}`
      );

      if (response.ok) {
        const data = await response.json();

        lblBankname = data.labels.bankAcName;
        lblmillname = data.labels.millName;
        newbank_ac = data.previous_head_data.bank_ac;
        newmill_code = data.previous_head_data.mill_code;

        setFormData((prevData) => ({
          ...prevData,
          ...data.previous_head_data,
        }));
        setLastTenderData(data.previous_head_data || {});
        setLastTenderDetails(data.previous_details_data || []);

        const totalItemAmount = data.previous_details_data.reduce(
          (total, user) => total + parseFloat(user.amount),
          0
        );
        setGlobalTotalAmount(totalItemAmount.toFixed(2));
        const totalDiff =
          (parseFloat(data.previous_head_data.amount) || 0) - totalItemAmount;
        setDiff(totalDiff.toFixed(2));
      } else {
        console.error(
          "Failed to fetch previous record:",
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
      const response = await fetch(
        `${API_URL}/get-nextutr-navigation?currentDocNo=${formData.doc_no}&Company_Code=${companyCode}`
      );

      if (response.ok) {
        const data = await response.json();
        lblBankname = data.labels.bankAcName;
        lblmillname = data.labels.millName;
        newbank_ac = data.next_head_data.bank_ac;
        newmill_code = data.next_head_data.mill_code;

        setFormData((prevData) => ({
          ...prevData,
          ...data.next_head_data,
        }));
        setLastTenderData(data.next_head_data || {});
        setLastTenderDetails(data.next_details_data || []);

        const totalItemAmount = data.next_details_data.reduce(
          (total, user) => total + parseFloat(user.amount),
          0
        );
        setGlobalTotalAmount(totalItemAmount.toFixed(2));
        const totalDiff =
          (parseFloat(data.next_head_data.amount) || 0) - totalItemAmount;
        setDiff(totalDiff.toFixed(2));
      } else {
        console.error(
          "Failed to fetch next record:",
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
      const response = await fetch(
        `${API_URL}/get-lastutrdata?Company_Code=${companyCode}`
      );
      if (response.ok) {
        const data = await response.json();
        lblBankname = data.labels.bankAcName;
        lblmillname = data.labels.millName;
        newbank_ac = data.last_head_data.bank_ac;
        newmill_code = data.last_head_data.mill_code;

        setFormData((prevData) => ({
          ...prevData,
          ...data.last_head_data,
        }));
        setLastTenderData(data.last_head_data || {});
        setLastTenderDetails(data.last_details_data || []);

        const totalItemAmount = data.last_details_data.reduce(
          (total, user) => total + parseFloat(user.amount),
          0
        );
        setGlobalTotalAmount(totalItemAmount.toFixed(2));
        const totalDiff =
          (parseFloat(data.last_head_data.amount) || 0) - totalItemAmount;
        setDiff(totalDiff.toFixed(2));
      } else {
        console.error(
          "Failed to fetch last record:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error during API call:", error);
    }
  };

  const validateNumericInput = (e) => {
    e.target.value = e.target.value.replace(/[^0-9.-]/g, '');
  };

  return (
    <>
      <UserAuditInfo
        createdBy={formData.Created_By}
        modifiedBy={formData.Modified_By}
        title={"UTR Entry"}
      />
      <div>
        <div>
        </div>
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
          component={<UTRReport doc_no={formData.doc_no} disabledFeild={!addOneButtonEnabled} />}
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
          <br />
          <div className="form-group ">
            <div>
              <Grid container spacing={2} mt={1} >
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Change No"
                    name="changeNo"
                    variant="outlined"
                    autoComplete="off"
                    fullWidth
                    onKeyDown={handleKeyDown}
                    disabled={!addOneButtonEnabled}
                    size="small"
                    style={{ width: "150px" }}
                    InputLabelProps={{
                      shrink: true,
                      style: { fontWeight: 'bold' },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2} ml={1}>
                  <TextField
                    label="Entry No"
                    name="doc_no"
                    variant="outlined"
                    fullWidth
                    value={formData.doc_no}
                    onChange={handleChange}
                    disabled
                    size="small"
                    InputLabelProps={{
                      shrink: true,
                      style: { fontWeight: 'bold' },
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={4} md={3} sx={{ padding: 0.5, minWidth: '100px', maxWidth: '100px' }}>
                  <TextField
                    label="Doc Date"
                    type="date"
                    name="doc_date"
                    variant="outlined"
                    fullWidth
                    value={formData.doc_date}
                    inputRef={inputRef}
                    onChange={handleChange}
                    onBlur={handleDateBlur} 
                    disabled={isEditMode || (!isEditing && addOneButtonEnabled)}
                    size="small"
            
    inputProps={{
      min: minDateStr,
    }}
                    InputLabelProps={{
                      shrink: true,
                      style: { fontWeight: 'bold' },
                    }}
                    InputProps={{
                      style: { fontSize: '12px', height: '39px' },
                    }}
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2} alignItems="center" mt={-1}>
                <Grid item xs={12} md={6} lg={4} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ mr: 1, whiteSpace: 'nowrap', flexShrink: 0, minWidth: 100, fontSize: "16px", fontWeight: "bold",textAlign:"left"}}>
                    Bank Code :
                  </Typography>
                  <AccountMasterHelp
                    name="bank_ac"
                    onAcCodeClick={handleBankCode}
                    CategoryName={lblBankname}
                    CategoryCode={newbank_ac}
                    tabIndex={3}
                    Ac_type={[]}
                    disabledFeild={!isEditing && addOneButtonEnabled}
                    sx={{ flexGrow: 1, minWidth: 150 }}
                  />
                </Grid>
              </Grid>
              <Grid Grid container spacing={2} alignItems="center" mt={-1}>
                <Grid item xs={12} md={6} lg={4} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ mr: 1, whiteSpace: 'nowrap', flexShrink: 0, minWidth: 100, fontSize: "16px", fontWeight: "bold",textAlign:"left" }}>
                    Mill Code :
                  </Typography>
                  <AccountMasterHelp
                    name="mill_code"
                    onAcCodeClick={handleMillCode}
                    CategoryName={lblmillname}
                    CategoryCode={newmill_code}
                    Ac_type={[]}
                    tabIndex={4}
                    disabledFeild={!isEditing && addOneButtonEnabled}
                    sx={{ flexGrow: 1, minWidth: 150 }}
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2} alignItems="center" mt={1}>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    label="Amount:"
                    name="amount"
                    variant="outlined"
                    autoComplete="off"
                    fullWidth
                    value={formData.amount}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    size="small"
                    inputProps={{
                      sx: { textAlign: 'right' },
                      onInput: validateNumericInput,
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={8}>
                  <TextField
                    label="UTR NO:"
                    name="utr_no"
                    variant="outlined"
                    autoComplete="off"
                    fullWidth
                    value={formData.utr_no}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    size="small"
                  />
                </Grid>
                <p style={{ marginLeft: "20px", marginTop: '20px', color: "blue", fontWeight: "bold" }}> {amountInWords}</p>
              </Grid>
              <Grid container spacing={2} >
                <Grid item xs={12} sm={6} mt={1}>
                  <TextField
                    label="Narration Header:"
                    name="narration_header"
                    variant="outlined"
                    autoComplete="off"
                    fullWidth
                    multiline
                    rows={2}
                    value={formData.narration_header}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6} mt={1}>
                  <TextField
                    label="Narration Footer:"
                    name="narration_footer"
                    variant="outlined"
                    autoComplete="off"
                    fullWidth
                    multiline
                    rows={2}
                    value={formData.narration_footer}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    size="small"
                  />
                </Grid>
              </Grid>

              <Grid item
                xs={12}
                sm={1}
                style={{ display: "flex", alignItems: "center" }}>

                <FormControlLabel
                  label="IsSave"
                  control={
                    <Checkbox
                      name="IsSave"
                      checked={formData.IsSave}
                      onChange={handleCheckbox}
                      size="small"
                      disabled={!isEditing && addOneButtonEnabled}
                    />
                  }
                />
              </Grid>

            </div>
          </div>
        </form>
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
      <div >
        {showPopup && (
          <div className="UtrEntrymodal" style={{ display: "block" }}>
            <div className="UtrEntry-dialog" style={{
              display: "block",
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: "1050",
              width: "100%",
              maxWidth: "1200px"
            }}>
              <div >
                <div className="UtrEntry-header">
                  <h5 className="UtrEntry-title">
                    {selectedUser.id ? "Update UTR Entry" : "Add UTR Entry"}
                  </h5>
                  <button
                    type="button"
                    onClick={closePopup}
                    aria-label="Close"
                    style={{
              
                      width: "40px",
                      height: "45px",
                      border: "none",
                  
                      borderRadius: "4px"
                    }}
                  >
                    <span aria-hidden="true">&times;</span>
                  </button>
                </div>
                <div >
                  <form>
                    <div className="utr-form-row">
                      <div className="utr-form-group col-md-6 utr-mt-10">
                        <label className="utr-label">Lot No:</label>
                        <UTRLotnoHelp
                          onAcCodeClick={handlePurcno}
                          name="lot_no"
                          Tenderno={popupMode === "add" ? '' : newLot_no || tenderDetails.Tender_No || Tenderno}
                          disabledFeild={!isEditing && addOneButtonEnabled}
                          Millcode={formData.mill_code}
                          onTenderDetailsFetched={handleTenderDetailsFetched}
                          firstInputRef={firstInputRef}
                          className="utr-input"
                        />
                      </div>
                    </div>

                    <div className="utr-form-row">
                      <div className="utr-form-group col-md-6 utr-mt-10">
                        <label className="utr-label">Lot Company Code:</label>
                        <input
                          type="text"
                          name="lotCompany_Code"
                          autoComplete="off"
                          value={formDataDetail.lotCompany_Code}
                          onChange={handleChangeDetail}
                          className="utr-input"
                        />
                      </div>
                      <div className="utr-form-group col-md-6 utr-mt-10">
                        <label className="utr-label">Lot Year Code:</label>
                        <input
                          type="text"
                          name="lotYear_Code"
                          autoComplete="off"
                          value={formDataDetail.lotYear_Code}
                          onChange={handleChangeDetail}
                          className="utr-input"
                        />
                      </div>
                    </div>
                    <div className="utr-form-row">
                      <div className="utr-form-group col-md-6 utr-mt-10">
                        <label className="utr-label">Grade:</label>
                        <input
                          type="text"
                          name="grade_no"
                          autoComplete="off"
                          value={formDataDetail.grade_no}
                          onChange={handleChangeDetail}
                          className="utr-input"
                        />
                      </div>
                    </div>
                    <div className="utr-form-row">
                      <div className="utr-form-group col-md-6 utr-mt-10">
                        <label className="utr-label">Amount:</label>
                        <input
                          type="text"
                          name="amount"
                          autoComplete="off"
                          value={formDataDetail.amount}
                          onChange={handleChangeDetail}
                          className="utr-input"
                        />
                      </div>
                      <div className="utr-form-group col-md-6 utr-mt-10">
                        <label className="utr-label">Adjusted Amount:</label>
                        <input
                          type="text"
                          name="Adjusted_Amt"
                          autoComplete="off"
                          value={formDataDetail.Adjusted_Amt}
                          onChange={handleChangeDetail}
                          className="utr-input"
                        />
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

        <TableContainer component={Paper} style={{ marginTop: '16px', width: '80%', marginBottom: "10px" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={headerCellStyle}>Actions</TableCell>
                <TableCell sx={headerCellStyle}>ID</TableCell>
                <TableCell sx={headerCellStyle}>Lot No</TableCell>
                <TableCell sx={headerCellStyle}>Grade No</TableCell>
                <TableCell sx={headerCellStyle}>Amount</TableCell>
                <TableCell sx={headerCellStyle}>Lot Company Code</TableCell>
                <TableCell sx={headerCellStyle}>Lot Year Code</TableCell>
                <TableCell sx={headerCellStyle}>Adjusted Amt</TableCell>
                <TableCell sx={headerCellStyle}>Tenderid</TableCell>
                {/* <TableCell sx={headerCellStyle}>Rowaction</TableCell> */}
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} sx={{ height: '30px' }}>
                  <TableCell sx={{ padding: '4px 8px' }}>
                    {user.rowaction === "add" || user.rowaction === "update" || user.rowaction === "Normal" ? (
                      <>
                        <EditButton editUser={editUser} user={user} isEditing={isEditing} />
                        <DeleteButton deleteModeHandler={deleteModeHandler} user={user} isEditing={isEditing} />
                      </>
                    ) : user.rowaction === "DNU" || user.rowaction === "delete" ? (

                      <OpenButton openDelete={openDelete} user={user} />
                    ) : null}
                  </TableCell>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{user.lot_no}</TableCell>
                  <TableCell>{user.grade_no}</TableCell>
                  <TableCell>{user.amount}</TableCell>
                  <TableCell>{user.lotCompany_Code}</TableCell>
                  <TableCell>{user.lotYear_Code}</TableCell>
                  <TableCell>{user.Adjusted_Amt}</TableCell>
                  <TableCell>{user.ln}</TableCell>
                  {/* <TableCell>{user.rowaction}</TableCell> */}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <br></br>
      </div>
      <Grid container alignItems="center" spacing={1} marginBottom={20}>
        <Grid item>
          <label htmlFor="globalTotalAmount">Total Amount:</label>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <TextField
            id="globalTotalAmount"
            name="globalTotalAmount"
            variant="outlined"
            fullWidth
            size="small"
            value={formatReadableAmount(globalTotalAmount)}
            onChange={handleChangeDetail}
            InputProps={{
              readOnly: true,
            }}
            disabled
          />
        </Grid>
        <Grid item>
          <label htmlFor="diff">Diff:</label>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <TextField
            id="diff"
            name="diff"
            variant="outlined"
            fullWidth
            size="small"
            value={formatReadableAmount(diff)}
            onChange={handleChangeDetail}
            InputProps={{
              readOnly: true,
            }}
            disabled
          />
        </Grid>
      </Grid>
    </>
  );
};
export default UTREntry;