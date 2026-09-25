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
// import { useRecordLocking } from "../../../hooks/useRecordLocking";
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
// import "./JournalVoucher.css"
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
import MillMasterHelp from "../../../Helper/MillMasterHelp";
import GradeMasterHelp from "../../../Helper/GradeMasterHelp";
import SystemHelpMaster from "../../../Helper/SystemmasterHelp";
import GSTRateMasterHelp from "../../../Helper/GSTRateMasterHelp";
import { Grade } from "@mui/icons-material";
import SearchBar from "../../../Common/UtilityCommon/SearchBar";

var newDebit_ac;
var lblacname;
var globalTotalAmount = 0.0;
var globalCreditTotalAmount = 0.0;
var globalDebitTotalAmount = 0.0;
var newGrade = "";
var newSeason = "";
var gstrate = "";
var gstRateCode = "";
var gstName = "";


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


const OfflineTender = () => {
    const companyCode = sessionStorage.getItem("Company_Code");
    const YearCode = sessionStorage.getItem("Year_Code");
    const username = sessionStorage.getItem("username");
    const Post_Date = sessionStorage.getItem("Post_Date")
    const User_Id = sessionStorage.getItem("User_ID");
    const [grade, setGrade] = useState("");
    const [season, setSeason] = useState("");
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
    const [GstRate, setGstRate] = useState(0.0);
    const [GstRateCode, setGstRateCode] = useState(0.0);
    const [GstName, setGstName] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    const [creditTotal, setCreditTotal] = useState(0);
    const [debitTotal, setDebitTotal] = useState(0);
    const [diff, setDiff] = useState(0);

    const [accountbalance, setAccountsetBalance] = useState(0);

    const DEFAULT_GST_RATE = 5;

    //SET Focus to the first feild of modal dialog
    const addButtonRef = useRef(null);
    const firstInputRef = useRef(null);
    const setFocusToFirstField = () => {
        if (firstInputRef.current) {
            firstInputRef.current.focus();
        }
    };

    const initialFormData = {
        Doc_Date: new Date().toISOString().split("T")[0],
    };


    const [formDataDetail, setFormDataDetail] = useState({
        TenderDate: new Date().toISOString().split("T")[0],
        TenderNumber: "",
        MillCode: "",
        MillName: "",
        MillShortName: "",
        StateZone: "",
        LastDateOfPayment: new Date().toISOString().split("T")[0],
        LiftingDate: new Date().toISOString().split("T")[0],
        Grade: "",
        Season: "",
        Rate: 0.0,
        RateGST: DEFAULT_GST_RATE,
        RateWithGST: 0.0,
        tranid: 0,
        detail_id: 1,
        Tender_Type: 'R',

    });

    const navigate = useNavigate();
    const location = useLocation();
    const selectedRecord = location.state?.selectedRecord;
    const permissions = location.state?.permissionsData;

    const searchParams = new URLSearchParams(location.search);
    const navigatedRecord = searchParams.get('navigatedRecord');
    const navigatedTranType = searchParams.get('navigatedTranType');

    const [formData, setFormData] = useState(initialFormData);



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
        // let TranType = "JV";
        fetch(
            `${API_URL}/get_next_offlinetender_id`
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
                    Id: data.next_id,
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
        // let tran_type = "JV";
        newGrade = "";
        newSeason = "";
        setDiff(0);
        setDebitTotal(0);
        setCreditTotal(0);
        setFormData((prevData) => ({
            ...prevData,
            // tran_type: "JV",
        }));
        setTimeout(() => {
            docDateRef.current?.focus();
        }, 0);
    };

    const handleSaveOrUpdate = async () => {



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
                // Modified_By: username,
                // User_Id: User_Id
            };
            delete head_data.Id;
        } else {
            head_data = {
                ...head_data,
                // Created_By: username,
            };
        }
        const detail_data = users.map((user) => ({
            rowaction: user.rowaction,
            TenderNumber: user.TenderNumber,
            TenderDate: user.TenderDate,
            MillCode: user.MillCode,
            MillName: user.MillName,
            MillShortName: user.MillShortName,
            StateZone: user.StateZone,
            LastDateOfPayment: user.LastDateOfPayment,
            LiftingDate: user.LiftingDate,
            Grade: user.Grade,
            Season: user.Season,
            Rate: user.Rate,
            RateGST: user.RateGST,
            RateWithGST: user.RateWithGST,
            Tender_Type: user.Tender_Type,
            tranid: formData.tranid,
            detail_id: user.detail_id,
            TenderId: user.TenderId,
        }));

        const requestData = {
            head_data,
            detail_data,
        };

        try {
            const apiUrl = isEditMode
                ? `${API_URL}/update-offlinetender?Id=${formData.Id}`
                : `${API_URL}/insert-offlinetender`;

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

            // unlockRecord();
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
            navigate(`/offline-tender?navigatedRecord=${formData.Id}`);
        } catch (error) {
            console.error("Error during save/update:", error);
            toast.error("An error occurred during save/update.");
            setIsLoading(false);
        }

    };

    //handle Edit record functionality.
    const handleEdit = async () => {
        // const Post_Date = sessionStorage.getItem("Post_Date")
        // if (await PostDateRecordLock(formData.doc_date, Post_Date)) {
        //     return;
        // }

        axios
            .get(
                `${API_URL}/getofflinetenderByid?Id=${formData.Id}`
            )
            .then((response) => {
                const data = response.data;
                // const isLockedNew = data.offline_tender_head.LockedRecord;
                // const isLockedByUserNew = data.offline_tender_head.LockedUser;
                // if (isLockedNew) {
                //     Swal.fire({
                //         icon: "warning",
                //         title: "Record Locked",
                //         text: `This record is locked by ${isLockedByUserNew}`,
                //         confirmButtonColor: "#d33",
                //     });
                // }
                // else {
                //     lockRecord();
                // }
                setFormData({
                    ...formData,
                    ...data.offline_tender_head,
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
                `${API_URL}/get-lastofflinetender-navigation`
            );
            if (response.status === 200) {
                const data = response.data;
                const { last_head_data, last_details_data } = data;

                const detailsArray = Array.isArray(last_details_data)
                    ? last_details_data
                    : [];

                const enrichedDetails = detailsArray.map((detail) => ({
                    ...detail,
                    AcName: detail.MillName || "",
                    gstName: detail.GST_Name || "",
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
                }));
                setLastTenderData(last_head_data || {});
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
        // const Post_Date = sessionStorage.getItem("Post_Date")
        // if (await PostDateRecordLock(formData.doc_date, Post_Date)) {
        //     return;
        // }

        // const Total =
        //     parseFloat(globalCreditTotalAmount) - parseFloat(globalDebitTotalAmount);
        // if (Total !== 0) {
        //     Swal.fire({
        //         title: "Error",
        //         text: "Difference must be zero!!!",
        //         icon: "error",
        //         confirmButtonText: "OK"
        //     });
        //     return;
        // }

        try {
            const response = await axios.get(
                `${API_URL}/getofflinetenderByid?Id=${formData.Id}`
            );
            const data = response.data;
            // const isLockedNew = data.receipt_payment_head.LockedRecord;
            // const isLockedByUserNew = data.receipt_payment_head.LockedUser;

            // if (isLockedNew) {
            //     Swal.fire({
            //         icon: "warning",
            //         title: "Record Locked",
            //         text: `This record is locked by ${isLockedByUserNew}`,
            //         confirmButtonColor: "#d33",
            //     });
            //     return;
            // }

            const result = await Swal.fire({
                title: "Are you sure?",
                text: `You won't be able to revert this ID : ${formData.Id}`,
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
                const deleteApiUrl = `${API_URL}/delete-offlinetender?tranid=${formData.tranid}&Id=${formData.Id}`;
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
        navigate("/OfflineTender_Utility");
    };

    useEffect(() => {
        if (selectedRecord) {
            setUsers(
                lastTenderDetails.map((detail) => ({
                    rowaction: "Normal",
                    TenderId: detail.TenderId,
                    id: detail.TenderId,
                    TenderNumber: detail.TenderNumber,
                    MillCode: detail.MillCode,
                    MillName: detail.MillName,
                    MillShortName: detail.MillShortName,
                    StateZone: detail.StateZone,
                    LastDateOfPayment: detail.LastDateOfPayment,
                    LiftingDate: detail.LiftingDate,
                    TenderDate: detail.TenderDate,
                    Grade: detail.Grade,
                    Season: detail.Season,
                    Rate: detail.Rate,
                    RateGST: detail.RateGST,
                    Tender_Type: detail.Tender_Type,
                    RateWithGST: detail.RateWithGST,
                    tranid: detail.tranid,
                    detail_id: detail.detail_id,
                    GST_Name: detail.GST_Name || detail.gstName || "",
                }))
            );
        }
    }, [selectedRecord, lastTenderDetails]);

    useEffect(() => {
        setUsers(
            lastTenderDetails.map((detail) => ({
                rowaction: "Normal",
                TenderId: detail.TenderId,
                id: detail.TenderId,
                TenderNumber: detail.TenderNumber,
                MillCode: detail.MillCode,
                MillName: detail.MillName,
                MillShortName: detail.MillShortName,
                StateZone: detail.StateZone,
                LastDateOfPayment: detail.LastDateOfPayment,
                LiftingDate: detail.LiftingDate,
                TenderDate: detail.TenderDate,
                Grade: detail.Grade,
                Season: detail.Season,
                Rate: detail.Rate,
                RateGST: detail.RateGST,
                Tender_Type: detail.Tender_Type,
                RateWithGST: detail.RateWithGST,
                tranid: detail.tranid,
                detail_id: detail.detail_id,
                GST_Name: detail.GST_Name || detail.gstName || "",
            }))
        );
    }, [lastTenderDetails]);


    const handleAccode = async (code, accoid, hsn, name, shortName, state, zone) => {
        console.log("handleAccode", code, accoid, hsn, name, shortName, state, zone);
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

        setFormDataDetail((prev) => ({
            ...prev,
            MillCode: code,
            MillId: accoid,
            MillName: name,
            MillShortName: shortName,
            StateZone: state,
        }));

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



    const handleChangeDetail = (event) => {
        const { name, value } = event.target;
        let updatedFormDataDetail = { ...formDataDetail, [name]: value };

        // Prevent future dates for TenderDate
        if (name === 'TenderDate') {
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

            if (value > today) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Invalid Date',
                    text: 'Tender Date cannot be a Further date. It has been reset to today.',
                    confirmButtonText: 'OK',
                });

                updatedFormDataDetail = {
                    ...updatedFormDataDetail,
                    TenderDate: today,
                };
            }
        }

        if (name === 'amount') {
            const convertedAmountInWords = ConvertNumberToWord(value);
            setAmountInWords(convertedAmountInWords);
        }

        if (name === 'Rate') {
            // Always default GST to 5%, and auto-calculate Rate With GST
            const rateWithGST = calculateRateWithGST(value, DEFAULT_GST_RATE);
            updatedFormDataDetail = {
                ...updatedFormDataDetail,
                RateGST: DEFAULT_GST_RATE,
                RateWithGST: rateWithGST,
            };
        }

        setFormDataDetail(updatedFormDataDetail);
    };




    // const handleChangeDetail = (event) => {
    //     const { name, value } = event.target;
    //     let updatedFormDataDetail = { ...formDataDetail, [name]: value };

    //     if (name === 'amount') {
    //         const convertedAmountInWords = ConvertNumberToWord(value);
    //         setAmountInWords(convertedAmountInWords);
    //     }
    //     setFormDataDetail(updatedFormDataDetail);
    // };




    const [popupMode, setPopupMode] = useState("add");



    // const openPopup = (mode) => {
    //     if (mode === "add") {
    //         const initialAmount = users.length === 0 ? 0 : diff;
    //         // const lastNarration = users.length > 0 ? users[users.length - 1].narration : "";
    //         setFormDataDetail(prevDetail => ({
    //             ...prevDetail,
    //             // amount: Math.abs(initialAmount),
    //             // drcr: diff <= 0 ? "C" : "D",
    //             // narration: lastNarration
    //         }));
    //     }
    //     setAccountsetBalance(0)
    //     setPopupMode(mode);
    //     setShowPopup(true);
    // };

    const openPopup = (mode) => {
        if (mode === "add") {
            const lastUser = users.length > 0 ? users[users.length - 1] : null;

            if (lastUser) {
                setFormDataDetail({
                    TenderNumber: lastUser.TenderNumber || "",
                    MillCode: lastUser.MillCode || "",
                    MillName: lastUser.MillName || "",
                    MillShortName: lastUser.MillShortName || "",
                    StateZone: lastUser.StateZone || "",
                    LastDateOfPayment: lastUser.LastDateOfPayment || new Date().toISOString().split("T")[0],
                    LiftingDate: lastUser.LiftingDate || new Date().toISOString().split("T")[0],
                    TenderDate: lastUser.TenderDate || new Date().toISOString().split("T")[0],
                    Grade: "",                     // reset — not carried over
                    Season: lastUser.Season || "",
                    Rate: 0.0,                     // reset — not carried over
                    RateGST: DEFAULT_GST_RATE,      // reset since Rate resets
                    RateWithGST: 0.0,               // reset since Rate resets
                    tranid: 0,
                    Tender_Type: 'R',
                    detail_id: 1,
                });

                // MillMasterHelp reads these separate states for display, so sync them too
                setDebitcode(lastUser.MillCode || "");
                setDebitcodeid(lastUser.MillId || "");
                setCreditcodecodename(lastUser.MillName || "");

                // Grade helper (GradeMasterHelp) shows `grade` state as fallback — reset it
                setGrade("");
            } else {
                // No previous entries yet — just use blank defaults
                clearForm();
            }
        }

        setAccountsetBalance(0);
        setPopupMode(mode);
        setShowPopup(true);
    };


    const clearForm = () => {
        setFormDataDetail({
            TenderNumber: "",
            MillCode: "",
            MillName: "",
            MillShortName: "",
            StateZone: "",
            LastDateOfPayment: new Date().toISOString().split("T")[0],
            LiftingDate: new Date().toISOString().split("T")[0],
            Grade: "",
            // Season: "",
            Rate: 0.0,
            RateGST: DEFAULT_GST_RATE,
            RateWithGST: 0.0,
            TenderDate: new Date().toISOString().split("T")[0],
            tranid: 0,
            Tender_Type: 'R',
            detail_id: 1,
        });
        fetchLatestSeason();
        setCreditcodecodename("");
        setGstRate("");
        setGstName("");
        gstRateCode = "";
        gstName = "";
        lblacname = "";
    };

    // const addUser = () => {
    //     setAmountInWords("");
    //     if (formDataDetail.amount === 0 || formDataDetail.amount === "") {
    //         Swal.fire({
    //             title: "Error",
    //             text: "Please Enter Amount",
    //             icon: "error",
    //             confirmButtonText: "OK"
    //         });
    //         return;
    //     }

    //     const maxDetailId =
    //         users.length > 0
    //             ? Math.max(...users.map((user) => user.detail_id)) + 1
    //             : 1;

    //     const nextUserId =
    //         users.length > 0 ? Math.max(...users.map((user) => user.id)) + 1 : 1;

    //     const newUser = {
    //         id: nextUserId,
    //         AcName: Debitcodename,
    //         Grade: grade,
    //         ...formDataDetail,
    //         RateGST: formDataDetail.RateGST,
    //         detail_id: maxDetailId,
    //         rowaction: "add",
    //     };

    //     const updatedUsers = [...users, newUser];
    //     setUsers(updatedUsers);

    //     const updatedCreditTotal = updatedUsers
    //         .filter((user) => user.drcr === "C" && user.rowaction !== "delete" && user.rowaction !== "DNU")
    //         .reduce((total, user) => total + parseFloat(user.amount || 0), 0);

    //     const updatedDebitTotal = updatedUsers
    //         .filter((user) => user.drcr === "D" && user.rowaction !== "delete" && user.rowaction !== "DNU")
    //         .reduce((total, user) => total + parseFloat(user.amount || 0), 0);

    //     const diff = updatedCreditTotal - updatedDebitTotal;

    //     setCreditTotal(updatedCreditTotal.toFixed(2));
    //     setDebitTotal(updatedDebitTotal.toFixed(2));
    //     setDiff(diff.toFixed(2));

    //     setFormData((prevFormData) => ({
    //         ...prevFormData,
    //     }));
    //     closePopup();
    //     setTimeout(() => {
    //         addButtonRef.current.focus();
    //     }, 500)

    // };


    const addUser = () => {
        setAmountInWords("");
        if (
            formDataDetail.Rate === "" ||
            formDataDetail.Rate === null ||
            formDataDetail.Rate === undefined ||
            parseFloat(formDataDetail.Rate) === 0 ||
            isNaN(parseFloat(formDataDetail.Rate))
        ) {
            Swal.fire({
                title: "Error",
                text: "Please Enter Rate",
                icon: "error",
                confirmButtonText: "OK"
            });
            return;
        }

        if (
            !formDataDetail.Grade ||
            formDataDetail.Grade.trim() === ""
        ) {
            Swal.fire({
                title: "Error",
                text: "Please Select Grade",
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
            Grade: grade,
            ...formDataDetail,
            RateGST: formDataDetail.RateGST,
            detail_id: maxDetailId,
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
        }));

        // Instead of closePopup(), re-open the popup for the next entry,
        // carrying forward the just-added row's Mill/Tender info the
        // same way openPopup("add") does — but built from `newUser`
        // directly, since `users` state hasn't flushed yet at this point.
        reopenPopupForNextEntry(newUser);
    };

    // Reopens the Add popup pre-filled from the row that was just added,
    // so the user can keep adding entries without clicking "Add" again.
    const reopenPopupForNextEntry = (lastUser) => {
        setSelectedUser({});
        setAmountInWords("");

        setFormDataDetail({
            TenderNumber: lastUser.TenderNumber || "",
            MillCode: lastUser.MillCode || "",
            MillName: lastUser.MillName || "",
            MillShortName: lastUser.MillShortName || "",
            StateZone: lastUser.StateZone || "",
            LastDateOfPayment: lastUser.LastDateOfPayment || new Date().toISOString().split("T")[0],
            LiftingDate: lastUser.LiftingDate || new Date().toISOString().split("T")[0],
            TenderDate: lastUser.TenderDate || new Date().toISOString().split("T")[0],
            Grade: "",                      // reset — not carried over
            Season: lastUser.Season || "",
            Rate: 0.0,                      // reset — not carried over
            RateGST: DEFAULT_GST_RATE,      // reset since Rate resets
            RateWithGST: 0.0,               // reset since Rate resets
            tranid: 0,
            Tender_Type: 'R',
            detail_id: 1,
        });

        // MillMasterHelp / GradeMasterHelp read these separate states for display
        setDebitcode(lastUser.MillCode || "");
        setDebitcodeid(lastUser.MillId || "");
        setCreditcodecodename(lastUser.MillName || "");
        setGrade("");

        setAccountsetBalance(0);
        setPopupMode("add");
        setShowPopup(true);

        setTimeout(() => {
            setFocusToFirstField();
        }, 100);
    };

    const editUser = (user) => {
        debugger
        setSelectedUser(user);
        setDebitcode(user.MillCode);
        setDebitcodeid(user.MillId);
        setCreditcodecodename(user.MillName);
        setFormDataDetail({
            TenderNumber: user.TenderNumber,
            MillCode: user.MillCode,
            MillName: user.MillName,
            MillShortName: user.MillShortName,
            StateZone: user.StateZone,
            LastDateOfPayment: user.LastDateOfPayment,
            LiftingDate: user.LiftingDate,
            TenderDate: user.TenderDate,
            Grade: user.Grade,
            Season: user.Season,
            Rate: user.Rate,
            RateGST: user.RateGST,
            RateWithGST: user.RateWithGST,
            tranid: user.tranid,
            Tender_Type: user.Tender_Type,
            detail_id: user.detail_id,
            TenderId: user.TenderId,
            id: user.TenderId,
        });

        openPopup("edit");

    };

    const updateUser = async () => {
        if (
            formDataDetail.Rate === "" ||
            formDataDetail.Rate === null ||
            formDataDetail.Rate === undefined ||
            parseFloat(formDataDetail.Rate) === 0 ||
            isNaN(parseFloat(formDataDetail.Rate))
        ) {
            Swal.fire({
                title: "Error",
                text: "Please Enter Rate",
                icon: "error",
                confirmButtonText: "OK"
            });
            return;
        }


        if (
            !formDataDetail.Grade ||
            formDataDetail.Grade.trim() === ""
        ) {
            Swal.fire({
                title: "Error",
                text: "Please Select Grade",
                icon: "error",
                confirmButtonText: "OK"
            });
            return;
        }
        setTimeout(() => {
            addButtonRef.current.focus();
        }, 500)
        const updatedUsers = users.map((user) => {

            console.log(users);
            if (user.id === selectedUser.id) {
                const updatedRowaction =
                    user.rowaction === "Normal" ? "update" : user.rowaction;

                return {
                    ...user,
                    rowaction: updatedRowaction,
                    TenderNumber: formDataDetail.TenderNumber,
                    TenderDate: formDataDetail.TenderDate,
                    MillCode: Debitcode || formDataDetail.MillCode,
                    MillName: Debitcodename || formDataDetail.MillName,
                    MillShortName: formDataDetail.MillShortName,
                    StateZone: formDataDetail.StateZone,
                    LastDateOfPayment: formDataDetail.LastDateOfPayment,
                    LiftingDate: formDataDetail.LiftingDate,
                    Grade: formDataDetail.Grade,
                    Season: formDataDetail.Season,
                    Rate: formDataDetail.Rate,
                    RateGST: formDataDetail.RateGST,
                    RateWithGST: formDataDetail.RateWithGST,
                    Tender_Type: formDataDetail.Tender_Type,
                    tranid: user.tranid,
                    detail_id: user.detail_id,
                    TenderId: user.TenderId,
                    id: user.TenderId,
                    MillId: Debitcodeid || user.MillId || "",
                };
            } else {
                return user;
            }
        });



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
            // total: total.toFixed(2),
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
            // total: total.toFixed(2),
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


    const handleNavigation = async (url, headKey, detailsKey) => {
        try {
            const response = await fetch(url);

            if (response.ok) {
                const data = await response.json();
                const { [headKey]: headData, [detailsKey]: detailsData } = data;

                const DetailsArray = Array.isArray(detailsData) ? detailsData : [];

                const enrichedDetails = DetailsArray.map((detail) => ({
                    ...detail,
                    lblacname: detail.MillName || "",
                    // gstName: detail.GST_Name || "",
                    // gstrate: detail.RateGST || "",

                }));

                const { creditTotal, debitTotal, total } =
                    calculateTotals(enrichedDetails);

                setCreditTotal(creditTotal.toFixed(2));
                setDebitTotal(debitTotal.toFixed(2));
                setFormData((prevData) => ({
                    ...prevData,
                    ...headData,
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

        const url = `${API_URL}/getofflinetenderByid?tranid=${selectedRecord.tranid}&Id=${selectedRecord.Id}`;

        try {
            await handleNavigation(
                url,
                "offline_tender_head",
                "offline_tender_details"
            );
            setIsEditing(false);
        } catch (error) {
            console.error("Error fetching data on double click:", error);
        }
    };

    const handleKeyDown = async (event) => {
        if (event.key === "Tab") {
            const changeNoValue = event.target.value;
            const url = `${API_URL}/getofflinetenderByid?Id=${changeNoValue}`;
            console.log("changeNoValue:", changeNoValue);
            console.log("URL:", url);
            try {
                await handleNavigation(
                    url,
                    "offline_tender_head",
                    "offline_tender_details"
                );
                setIsEditing(false);
            } catch (error) {
                console.error("Error fetching data on Tab keydown:", error);
            }
        }
    };

    const handleNavigateRecord = async () => {
        const url = `${API_URL}/getofflinetenderByid?Id=${navigatedRecord}`;

        try {
            await handleNavigation(
                url,
                "offline_tender_head",
                "offline_tender_details"
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
        const url = `${API_URL}/get-firstofflinetender-navigation`;
        await handleNavigation(url, "first_head_data", "first_details_data");
    };

    const handlePreviousButtonClick = async () => {
        const url = `${API_URL}/get-previousofflinetender-navigation?currentId=${formData.Id}`;
        await handleNavigation(url, "previous_head_data", "previous_details_data");
    };

    const handleNextButtonClick = async () => {
        const url = `${API_URL}/get-nextofflinetender-navigation?currentId=${formData.Id}`;
        await handleNavigation(url, "next_head_data", "next_details_data");
    };

    const handleLastButtonClick = async () => {
        const url = `${API_URL}/get-lastofflinetender-navigation`;
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

    const handleGradeUpdate = (grade) => {
        setFormDataDetail((prevFormDataDetail) => ({
            ...prevFormDataDetail,
            Grade: grade,
        }));
    };

    const handleGrade = (name) => {
        setGrade(name);
        setFormDataDetail({
            ...formDataDetail,
            Grade: name,
        });
    };


    const handleSeasonUpdate = (Season) => {
        setFormDataDetail((prevFormDataDetail) => ({
            ...prevFormDataDetail,
            Season: Season,
        }));
    };


    const fetchLatestSeason = async () => {
        try {
            const response = await axios.get(
                `${API_URL}/system_master_help?CompanyCode=${companyCode}&SystemType=Z`
            );

            const seasons = response.data;

            if (Array.isArray(seasons) && seasons.length > 0) {
                // If API returns oldest -> newest
                const latestSeason = seasons[seasons.length - 1].Category_Name;

                setSeason(latestSeason);
                newSeason = latestSeason;

                setFormDataDetail((prev) => ({
                    ...prev,
                    Season: latestSeason,
                }));
            }
        } catch (error) {
            console.error("Error fetching latest season:", error);
        }
    };

    useEffect(() => {
        fetchLatestSeason();
    }, []);

    const handleSeason = (name) => {
        setSeason(name);
        setFormDataDetail({
            ...formDataDetail,
            Season: name,
        });
    };

    const calculateRateWithGST = (rate, gstPercent) => {
        const r = parseFloat(rate) || 0;
        const g = parseFloat(gstPercent) || 0;
        return (r + (r * g) / 100).toFixed(2);
    };

    // Shared styles for consistent field alignment in the modal
    const fieldRowStyle = {
        marginBottom: "16px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
    };

    const fieldLabelStyle = {
        fontSize: "14px",
        fontWeight: "bold",
        width: "130px",
        flexShrink: 0,
        display: "inline-block",
    };

    const fieldInputStyle = {
        width: "180px",
        height: "39px",
        padding: "8px 12px",
        fontSize: "14px",
        borderRadius: "4px",
        border: "1px solid #ccc",
        backgroundColor: "#fff",
        boxSizing: "border-box",
    };

    const fieldInputDisabledStyle = {
        ...fieldInputStyle,
        backgroundColor: "#eeeeee",
        color: "#555",
    };

    const fieldGroupStyle = {
        display: "flex",
        alignItems: "center",
        minWidth: "330px", // label + input, keeps second column starting at the same x-position on every row
    };

    const fieldSelectStyle = {
        width: "100%",
        padding: "8px",
        border: "1px solid #ccc",
        borderRadius: "4px",
        fontSize: "14px",
        height: "38px",
    };

    const filteredUsers = users.filter((user) => {
        const search = searchTerm.toLowerCase();

        return (
            (user.MillName || "").toLowerCase().includes(search)
        );
    });


    return (
        <>
            <UserAuditInfo
                // createdBy={formData.Created_By}
                // modifiedBy={formData.Modified_By}
                title={"Offline Tender"}
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
                // component={<PrintButton disabledFeild={!addOneButtonEnabled} fetchData={handleJVreport} />}
                />
                <div>
                    <NavigationButtons
                        handleFirstButtonClick={handleFirstButtonClick}
                        handlePreviousButtonClick={handlePreviousButtonClick}
                        handleNextButtonClick={handleNextButtonClick}
                        handleLastButtonClick={handleLastButtonClick}
                        highlightedButton={highlightedButton}
                        isEditing={isEditing}
                    // isFirstRecord={formData.Company_Code === 1}
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
                                label="Id"
                                id="Id"
                                name="Id"
                                value={formData.Id}
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
                                id="Doc_Date"
                                name="Doc_Date"
                                value={formData.Doc_Date}
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


                <div style={{ marginTop: "-15px", display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

                    <AddButton openPopup={openPopup} isEditing={isEditing} ref={addButtonRef} setFocusToFirstField={setFocusToFirstField} />

                    {/* <Typography
                    
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
                    </Typography> */}

                    <SearchBar
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        fullWidth
                        size="small"
                    />

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
                                                ? "Update Offline Tender"
                                                : "Add Offline Tender"}
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

                                    {/* <div className="JournanalVouchermodal-body" style={{ padding: "20px" }}>
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
                                                        Mill Code:
                                                    </label>
                                                    <MillMasterHelp
                                                        name="MillCode"
                                                        onAcCodeClick={handleAccode}
                                                        CategoryName={lblacname ? lblacname : Debitcodename}
                                                        CategoryCode={newDebit_ac || formDataDetail.MillCode}
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

                                            </div>

                                            <div
                                                style={{
                                                    marginBottom: "15px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                }}
                                            >


                                                <Grid item xs={4} sm={2} marginRight={15}>
                                                    <div className="TenderPurchaseHelp-row">
                                                        <label htmlFor="Grade"
                                                            style={{
                                                                fontWeight: "600",
                                                                marginRight: "10px",
                                                                display: "inline-block",
                                                                fontSize: "16px",
                                                                fontWeight: "bold",

                                                            }}
                                                        >
                                                            Grade :
                                                        </label>
                                                        <div>
                                                            <div>
                                                                <GradeMasterHelp
                                                                    name="Grade"
                                                                    onAcCodeClick={handleGrade}
                                                                    CategoryName={formDataDetail.Grade || newGrade}
                                                                    disabledField={!isEditing || !addOneButtonEnabled}
                                                                    onCategoryChange={handleGradeUpdate}
                                                                    SystemType={'S'}
                                                                />
                                                            </div>
                                                        </div>


                                                    </div>


                                                </Grid>
                                                <label
                                                    htmlFor="drcr"
                                                    style={{
                                                        fontSize: "16px",
                                                        fontWeight: "bold",
                                                        marginRight: "10px",
                                                        display: "inline-block",
                                                    }}
                                                >
                                                    Lifting Date:
                                                </label>
                                                <input
                                                    type="date"
                                                    id="LiftingDate"
                                                    name="LiftingDate"
                                                    value={formDataDetail.LiftingDate}
                                                    onChange={handleChangeDetail}
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


                                            </div>







                                            <div
                                                style={{
                                                    marginBottom: "19px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                }}
                                            >


                                                <Grid item xs={12} sm={6} marginRight={15}>
                                                    <div className="TenderPurchaseHelp-row">
                                                        <label htmlFor="Season"
                                                            style={{
                                                                fontWeight: "600",
                                                                marginRight: "10px",
                                                                display: "inline-block",
                                                                fontSize: "16px",
                                                                fontWeight: "bold",

                                                            }}
                                                        >
                                                            Season :
                                                        </label>
                                                        <div>
                                                            <div>
                                                                <GradeMasterHelp
                                                                    name="Season"
                                                                    onAcCodeClick={handleSeason}
                                                                    CategoryName={formDataDetail.Season || newSeason}
                                                                    disabledField={!isEditing || !addOneButtonEnabled}
                                                                    onCategoryChange={handleSeasonUpdate}
                                                                    SystemType={'Z'}
                                                                />
                                                            </div>
                                                        </div>


                                                    </div>


                                                </Grid>

                                                <label
                                                    htmlFor="Rate"
                                                    style={{
                                                        fontSize: "16px",
                                                        fontWeight: "bold",
                                                        display: "inline-block",
                                                        marginRight: "50px",
                                                    }}
                                                >
                                                    Rate:
                                                </label>
                                                <input
                                                    type="text"
                                                    name="Rate"
                                                    value={formDataDetail.Rate}
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
                                                        // marginLeft:"45px"
                                                    }}
                                                />
                                            </div>



                                            <div
                                                style={{
                                                    marginBottom: "15px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "24px",
                                                }}
                                            >
                                                <label
                                                    htmlFor="RateGST"
                                                    style={{
                                                        fontSize: "16px",
                                                        fontWeight: "bold",
                                                        display: "inline-block",
                                                    }}
                                                >
                                                    Rate GST:
                                                </label>
                                                <input
                                                    type="text"
                                                    name="RateGST"
                                                    value={formDataDetail.RateGST}
                                                    onChange={handleChangeDetail}
                                                    autoComplete="off"
                                                    disabled
                                                    style={{
                                                        width: "16%",
                                                        padding: "8px 12px",
                                                        fontSize: "14px",
                                                        borderRadius: "4px",
                                                        border: "1px solid #ccc",
                                                        backgroundColor: "#eeeeee",
                                                        boxSizing: "border-box",
                                                    }}
                                                />



                                                <label
                                                    htmlFor="RateWithGST"
                                                    style={{
                                                        fontSize: "16px",
                                                        fontWeight: "bold",
                                                        display: "inline-block",
                                                    }}
                                                >
                                                    Rate With GST:
                                                </label>
                                                <input
                                                    type="text"
                                                    name="RateWithGST"
                                                    value={formDataDetail.RateWithGST}
                                                    onChange={handleChangeDetail}
                                                    autoComplete="off"
                                                    disabled
                                                    style={{
                                                        width: "16%",
                                                        padding: "8px 12px",
                                                        fontSize: "14px",
                                                        borderRadius: "4px",
                                                        border: "1px solid #ccc",
                                                        backgroundColor: "#eeeeee",
                                                        boxSizing: "border-box",
                                                    }}
                                                />
                                            </div>


                                            <div
                                                style={{
                                                    marginBottom: "15px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "24px",
                                                }}
                                            >
                                                <label
                                                    htmlFor="LastDateOfPayment"
                                                    style={{
                                                        fontSize: "16px",
                                                        fontWeight: "bold",
                                                        display: "inline-block",
                                                    }}
                                                >
                                                    Payment Date:
                                                </label>
                                                <input
                                                    type="date"
                                                    id="LastDateOfPayment"
                                                    name="LastDateOfPayment"
                                                    value={formDataDetail.LastDateOfPayment}
                                                    onChange={handleChangeDetail}
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

                                                <label
                                                    htmlFor="TenderDate"
                                                    style={{
                                                        fontSize: "16px",
                                                        fontWeight: "bold",
                                                        display: "inline-block",
                                                    }}
                                                >
                                                    Tender Date:
                                                </label>
                                                <input
                                                    type="date"
                                                    id="TenderDate"
                                                    name="TenderDate"
                                                    value={formDataDetail.TenderDate}
                                                    onChange={handleChangeDetail}
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
                                            </div> */}


                                    {/* </form> */}
                                    {/* </div> */}


                                    <div className="JournanalVouchermodal-body" style={{ padding: "20px" }}>
                                        <form>
                                            {/* Mill Code */}
                                            <div style={fieldRowStyle}>


                                                <div style={fieldGroupStyle}>
                                                    <label htmlFor="TenderDate" style={fieldLabelStyle}>
                                                        Tender Date:
                                                    </label>
                                                    <input
                                                        type="date"
                                                        id="TenderDate"
                                                        name="TenderDate"
                                                        value={formDataDetail.TenderDate}
                                                        onChange={handleChangeDetail}
                                                        ref={docDateRef}
                                                        disabled={!isEditing && addOneButtonEnabled}
                                                        firstInputRef={firstInputRef}
                                                        style={fieldInputStyle}
                                                    />
                                                </div>
                                                <div style={fieldGroupStyle}>
                                                    <label htmlFor="MillCode" style={fieldLabelStyle}>
                                                        Mill Code:
                                                    </label>
                                                    <MillMasterHelp
                                                        name="MillCode"
                                                        onAcCodeClick={handleAccode}
                                                        CategoryName={lblacname ? lblacname : Debitcodename}
                                                        CategoryCode={newDebit_ac || formDataDetail.MillCode}
                                                        Ac_type={[]}
                                                        tabIndex={4}
                                                        disabledFeild={!isEditing && addOneButtonEnabled}
                                                        style={fieldInputStyle}
                                                    />
                                                </div>
                                            </div>

                                            {/* Grade + Lifting Date */}
                                            <div style={fieldRowStyle}>
                                                <div style={fieldGroupStyle}>
                                                    <label htmlFor="Grade" style={fieldLabelStyle}>
                                                        Grade:
                                                    </label>
                                                    <GradeMasterHelp
                                                        name="Grade"
                                                        onAcCodeClick={handleGrade}
                                                        CategoryName={formDataDetail.Grade || newGrade}
                                                        disabledField={!isEditing || !addOneButtonEnabled}
                                                        onCategoryChange={handleGradeUpdate}
                                                        SystemType={'S'}
                                                    />
                                                </div>


                                                <div style={fieldGroupStyle}>
                                                    <label htmlFor="Season" style={fieldLabelStyle}>
                                                        Season:
                                                    </label>
                                                    <GradeMasterHelp
                                                        name="Season"
                                                        onAcCodeClick={handleSeason}
                                                        CategoryName={formDataDetail.Season || newSeason}
                                                        disabledField={!isEditing || !addOneButtonEnabled}
                                                        onCategoryChange={handleSeasonUpdate}
                                                        SystemType={'Z'}
                                                    />
                                                </div>


                                            </div>

                                            {/* Season + Rate */}
                                            <div style={fieldRowStyle}>


                                                <div style={fieldGroupStyle}>
                                                    <label htmlFor="Rate" style={fieldLabelStyle}>
                                                        Rate:
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="Rate"
                                                        value={formDataDetail.Rate}
                                                        onChange={handleChangeDetail}
                                                        autoComplete="off"
                                                        style={fieldInputStyle}
                                                    />
                                                </div>

                                                <div style={fieldGroupStyle}>
                                                    <label htmlFor="RateGST" style={fieldLabelStyle}>
                                                        Rate GST:
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="RateGST"
                                                        value={formDataDetail.RateGST}
                                                        onChange={handleChangeDetail}
                                                        autoComplete="off"
                                                        disabled
                                                        style={fieldInputDisabledStyle}
                                                    />
                                                </div>
                                            </div>

                                            {/* Rate GST + Rate With GST */}
                                            <div style={fieldRowStyle}>


                                                <div style={fieldGroupStyle}>
                                                    <label htmlFor="RateWithGST" style={fieldLabelStyle}>
                                                        Rate With GST:
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="RateWithGST"
                                                        value={formDataDetail.RateWithGST}
                                                        onChange={handleChangeDetail}
                                                        autoComplete="off"
                                                        disabled
                                                        style={fieldInputDisabledStyle}
                                                    />
                                                </div>


                                                <div style={fieldGroupStyle}>
                                                    <label htmlFor="Tender_Type" style={fieldLabelStyle}>
                                                        Tender Type:
                                                    </label>
                                                    <select
                                                        name="Tender_Type"
                                                        value={formDataDetail.Tender_Type || 'R'}
                                                        onChange={handleChangeDetail}
                                                        style={fieldSelectStyle}>
                                                        <option value="R">Regular</option>
                                                        <option value="O">Open</option>
                                                    </select>
                                                </div>

                                            </div>

                                            {/* Payment Date + Tender Date */}
                                            <div style={fieldRowStyle}>
                                                <div style={fieldGroupStyle}>
                                                    <label htmlFor="LastDateOfPayment" style={fieldLabelStyle}>
                                                        Payment Date:
                                                    </label>
                                                    <input
                                                        type="date"
                                                        id="LastDateOfPayment"
                                                        name="LastDateOfPayment"
                                                        value={formDataDetail.LastDateOfPayment}
                                                        onChange={(e) => {
                                                            const { value } = e.target;
                                                            setFormDataDetail((prev) => ({
                                                                ...prev,
                                                                LastDateOfPayment: value,
                                                                LiftingDate: value,
                                                            }));
                                                        }}
                                                        ref={docDateRef}
                                                        disabled={!isEditing && addOneButtonEnabled}
                                                        style={fieldInputStyle}
                                                    />
                                                </div>

                                                <div style={fieldGroupStyle}>
                                                    <label htmlFor="LiftingDate" style={fieldLabelStyle}>
                                                        Lifting Date:
                                                    </label>
                                                    <input
                                                        type="date"
                                                        id="LiftingDate"
                                                        name="LiftingDate"
                                                        value={formDataDetail.LiftingDate}
                                                        onChange={handleChangeDetail}
                                                        ref={docDateRef}
                                                        disabled={!isEditing && addOneButtonEnabled}
                                                        style={fieldInputStyle}
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
                    <TableContainer component={Paper} className="mt-4" >
                        <Table sx={{ minWidth: 650 }} aria-label="simple table">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={headerCellStyle}>Actions</TableCell>
                                    <TableCell sx={headerCellStyle}>ID</TableCell>
                                    <TableCell sx={headerCellStyle}>Tender Date</TableCell>
                                    <TableCell sx={headerCellStyle}>Mill Name</TableCell>
                                    <TableCell sx={headerCellStyle}>Season</TableCell>
                                    <TableCell sx={headerCellStyle}>Grade</TableCell>
                                    <TableCell sx={headerCellStyle}>Rate</TableCell>
                                    <TableCell sx={headerCellStyle}>Rate With GST</TableCell>
                                    <TableCell sx={headerCellStyle}>Payment Date</TableCell>
                                    <TableCell sx={headerCellStyle}>Lifting Date</TableCell>
                                    <TableCell sx={headerCellStyle}>Tender Type</TableCell>
                                    {/* <TableCell sx={headerCellStyle}>Rowaction</TableCell> */}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredUsers.map((user) => (
                                    <TableRow key={user.id} sx={{
                                        height: '30px', '&:hover': {
                                            backgroundColor: '#f3f388',
                                            cursor: "pointer",
                                        },
                                    }}>
                                        <TableCell sx={{ padding: '0px 2px' }}>
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
                                        <TableCell sx={{ padding: '0px 2px', textAlign: 'left', fontSize: '12px' }}>{user.detail_id}</TableCell>
                                        <TableCell sx={{ padding: '0px 2px', textAlign: 'left', fontSize: '12px' }}>{user.TenderDate}</TableCell>
                                        <TableCell sx={{ padding: '0px 2px', textAlign: 'left', fontSize: '12px' }}>{user.MillName}</TableCell>
                                        <TableCell sx={{ padding: '0px 2px', textAlign: 'left', fontSize: '12px' }}>{user.Season}</TableCell>
                                        <TableCell sx={{ padding: '0px 2px', textAlign: 'left', fontSize: '12px' }}>{user.Grade || grade || newGrade}</TableCell>
                                        <TableCell align="right" sx={{ padding: '0px 2px', textAlign: 'left', fontSize: '12px' }}>{user.Rate}</TableCell>
                                        <TableCell sx={{ padding: '0px 2px', textAlign: 'left', fontSize: '12px' }}>{user.RateWithGST}</TableCell>
                                        <TableCell sx={{ padding: '0px 2px', textAlign: 'left', fontSize: '12px' }}>{user.LastDateOfPayment}</TableCell>
                                        <TableCell sx={{ padding: '0px 2px', textAlign: 'left', fontSize: '12px' }}>{user.LiftingDate}</TableCell>
                                        <TableCell sx={{ padding: '0px 2px', textAlign: 'left', fontSize: '12px' }}>{user.Tender_Type === "R" ? "Regular" : user.Tender_Type === "O" ? "Open" : ""}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </div>

            </div>
        </>
    );
};
export default OfflineTender;