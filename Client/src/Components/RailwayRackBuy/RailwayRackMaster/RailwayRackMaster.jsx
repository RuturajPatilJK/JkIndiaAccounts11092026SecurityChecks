import React, { useState, useRef, useEffect } from "react";
import { TextField, Grid, InputLabel, FormControl, Select, MenuItem, FormControlLabel, Checkbox, TextareaAutosize, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import "bootstrap/dist/css/bootstrap.min.css";
import CloseIcon from '@mui/icons-material/Close';
import AccountMasterHelp from "../../../Helper/AccountMasterHelp";
import axios from "axios";
// import axios from '../../../api/axiosInstance';
import { useNavigate, useLocation } from "react-router-dom";
import ActionButtonGroup from "../../../Common/CommonButtons/ActionButtonGroup";
import NavigationButtons from "../../../Common/CommonButtons/NavigationButtons";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRecordLocking } from "../../../hooks/useRecordLocking";
import "./RailwayRack.css"
import AddButton from "../../../Common/Buttons/AddButton";
import EditButton from "../../../Common/Buttons/EditButton";
import DeleteButton from "../../../Common/Buttons/DeleteButton";
import OpenButton from "../../../Common/Buttons/OpenButton";
import UserAuditInfo from "../../../Common/UserAuditInfo/UserAuditInfo";
import SaveUpdateSpinner from "../../../Common/Spinners/SaveUpdateSpinner";
import Swal from "sweetalert2";
import DetailAddButtom from "../../../Common/Buttons/DetailAddButton";
import DetailCloseButton from "../../../Common/Buttons/DetailCloseButton";
import DetailUpdateButton from "../../../Common/Buttons/DetailUpdateButton";
import { OutwordPostDateRecordLock } from "../../../Common/PostDateLock/PostDateRangeCheck";
import { validateDocumentDate } from "../../../Common/ValidateDateRange/ValidateDateRange";
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";

//Global Variables
var newRailid = "";

var ACName = "";
var ac_Code = "";


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

const RailwayRack = () => {

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
    const [AcCode, setAcCode] = useState("");
    const [Ac_Name, setAcName] = useState("");
    const [brand_code, setBrandCode] = useState("");
    const [brand_name, setBrandName] = useState("");
    const [AcCodeAccoid, setAcCodeAccoid] = useState("");
    const [formDataDetail, setFormDataDetail] = useState({
        Local_Exp: 0.00,
        detail_id: 1,
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
        Doc_No: "",
        RailwayStation_Name: "",
        Address: "",
        City: "",
        Pincode: "",
        Created_By: "",
        Modified_By: "",
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
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    //Calculations on GST Rate Code
    const handleKeyDownCalculations = async (event) => {
        if (event.key === "Tab") {
            const { name, value } = event.target;
            // const matchStatus = await checkMatchStatus(
            //     formData.Ac_Code,
            //     companyCode,
            //     Year_Code
            // );
            let gstRate = GstRate;

            if (!gstRate || gstRate === 0) {
                const cgstRate = parseFloat(formData.CGSTRate) || 0;
                const sgstRate = parseFloat(formData.SGSTRate) || 0;
                const igstRate = parseFloat(formData.IGSTRate) || 0;
                gstRate = igstRate > 0 ? igstRate : cgstRate + sgstRate;
            }
            // const updatedFormData = await calculateDependentValues(
            //     name,
            //     value,
            //     formData,
            //     gstRate
            // );
            // setFormData(updatedFormData);
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
            `${API_URL}/get-next-doc-no-RackRailway`
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
                    Doc_No: newDocNo,
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
        ACName = "";
        ac_Code = "";
        setAcName("");
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

        axios.get(`${API_URL}/RackRailwayByRailid?RailId=${formData.RailId}`)
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
        // const isValid = validateDocumentDate(formattedEntryDate, accountingYearData);

        // if (!isValid) {
        //     return
        // }

        // let missingFields = [];
        // if (!formData.GstRateCode) missingFields.push("GST Code");
        // if (!formData.Ac_Code) missingFields.push("Bill From");
        // if (!formData.Bill_To) missingFields.push("Bill To");
        // if (!formData.Unit_Code) missingFields.push("Ship To");
        // if (!formData.mill_code) missingFields.push("Mill Name");

        // if (missingFields.length > 0) {
        //     Swal.fire({
        //         text: `Please Select the following fields: ${missingFields.join(", ")}`,
        //         icon: "warning",
        //         confirmButtonText: "OK"
        //     });
        //     return;
        // }

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
            // GstRateCode: gstCode || gstRateCode,
            // RateDiff: formData.RateDiff || 0,
            ...(isEditMode
                ? {
                    Modified_By: username,
                    // User_Id: User_Id
                }
                : {
                    Created_By: username
                }
            )
        };
        delete headData[""];
        // delete headData.RateDiffAmount
        if (isEditMode) {
            delete headData.RailId;
            // headData.Modified_By = username
            // headData.User_Id = User_Id
        } else {
            // headData.Created_By = username;
        }
        const detailData = users.map((user) => ({
            rowaction: user.rowaction,
            Raildetailid: user.Raildetailid,
            Ac_Code: user.Ac_Code,
            Local_Exp: user.Local_Exp,
            ac: user.ac,
            detail_id: user.detail_id,
        }));

        const requestData = {
            headData,
            detailData,
        };

        try {
            if (isEditMode) {
                const updateApiUrl = `${API_URL}/update-RailShed?RailId=${newRailid}`;
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
                navigate(`/rack-rail?navigatedRecord=${formData.Doc_No}`);
            } else {
                const response = await axios.post(
                    `${API_URL}/insert-RailShed`,
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
                navigate(`/rack-rail?navigatedRecord=${formData.Doc_No}`);
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

        // if (parseInt(formData.DO_No) !== 0) {
        //     Swal.fire({
        //         title: "Error",
        //         text: `Couldn't delete this record it is currently referenced in DO No. ${formData.DO_No}`.trim(),
        //         icon: "error",
        //         confirmButtonText: "OK"
        //     });
        //     return;
        // }

        // if (parseInt(formData.einvoiceno) !== "" && formData.ackno !== "") {
        //     Swal.fire({
        //         icon: "warning",
        //         text: "E-Invoice has already been generated for this record.Cannot Delete.",
        //         confirmButtonColor: "#d33",
        //     });
        //     return
        // }

        // if (formData.EWay_Bill_No !== "") {
        //     Swal.fire({
        //         icon: "warning",
        //         text: "E-WayBill has already been generated for this record.Cannot Delete.",
        //         confirmButtonColor: "#d33",
        //     });
        //     return
        // }

        try {
            const response = await axios.get(
                `${API_URL}/RackRailwayByRailid?RailId=${newRailid}`
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
                text: `Do you really want to delete this Doc No: ${formData.Doc_No}?`,
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

                const deleteApiUrl = `${API_URL}/delete_data_by_railid?RailId=${newRailid}&Doc_No=${formData.Doc_No}`;
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
        newRailid = headData.RailId;
        ACName = details.Ac_Name_E;
        ac_Code = details.Ac_Code;

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
                `${API_URL}/get-lastRailRack-navigation`
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
        navigate("/RailwayRack-utility");
    };

    // Navigation Funtionality 
    const handleFirstButtonClick = async () => {
        try {
            const response = await axios.get(
                `${API_URL}/get-firstRailRack-navigation`
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
                `${API_URL}/get-lastRailRack-navigation`
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
                `${API_URL}/get-nextRailRack-navigation?&currentDocNo=${formData.Doc_No}`
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
                `${API_URL}/get-previousRailRack-navigation?currentDocNo=${formData.Doc_No}`
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
                `${API_URL}/RackRailwayByRailid?RailId=${selectedRecord.RailId}`
            );
            if (response.status === 200) {
                const data = response.data;

                newRailid = data.last_head_data.RailId;
                ACName = data.last_details_data[0].Ac_Name_E;
                ac_Code = data.last_head_data.Ac_Code;

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
                `${API_URL}/RailByDocNo?Doc_No=${navigatedRecord}`
            );
            if (response.status === 200) {
                const data = response.data;

                newRailid = data.last_head_data.RailId;
                ACName = data.last_details_data[0].Ac_Name_E;
                ac_Code = data.last_head_data.Ac_Code;

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
                    `${API_URL}/RailByDocNo?Doc_No=${changeNoValue}`
                );
                const data = response.data;
                newRailid = data.last_head_data.RailId;
                ACName = data.last_details_data[0].Ac_Name_E;
                ac_Code = data.last_head_data.Ac_Code;

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


    const calculateTotalItemAmount = (users) => {
        return users
            .filter((user) => user.rowaction !== "delete" && user.rowaction !== "DNU")
            .reduce((sum, user) => sum + parseFloat(user.item_Amount || 0), 0);
    };

    // const calculateRateDiffAmount = () => {
    //     const NETQNTL = Number(formData.NETQNTL);
    //     const RateDiff = Number(formData.RateDiff);
    //     return !isNaN(NETQNTL) && !isNaN(RateDiff) ? NETQNTL * RateDiff : 0;
    // };

    // const calculateDependentValues = async (
    //     name,
    //     input,
    //     formData,
    //     gstRate
    // ) => {
    //     const updatedFormData = { ...formData, [name]: input };
    //     const subtotal = parseFloat(updatedFormData.subTotal) || 0.0;

    //     const rate = gstRate;

    //     const netQntl = parseFloat(updatedFormData.NETQNTL) || 0.0;
    //     const freightRate = parseFloat(updatedFormData.LESS_FRT_RATE) || 0.0;

    //     updatedFormData.freight = netQntl * freightRate;

    //     updatedFormData.TaxableAmount = updatedFormData.freight + subtotal;

    //     if (matchStatus === "TRUE") {
    //         updatedFormData.CGSTRate = (rate / 2).toFixed(2);
    //         updatedFormData.SGSTRate = (rate / 2).toFixed(2);
    //         updatedFormData.IGSTRate = 0.0;

    //         updatedFormData.CGSTAmount = (
    //             (updatedFormData.TaxableAmount * updatedFormData.CGSTRate) /
    //             100
    //         ).toFixed(2);
    //         updatedFormData.SGSTAmount = (
    //             (updatedFormData.TaxableAmount * updatedFormData.SGSTRate) /
    //             100
    //         ).toFixed(2);
    //         updatedFormData.IGSTAmount = 0.0;
    //     } else {
    //         updatedFormData.IGSTRate = rate.toFixed(2);
    //         updatedFormData.CGSTRate = 0.0;
    //         updatedFormData.SGSTRate = 0.0;

    //         updatedFormData.IGSTAmount = (
    //             (updatedFormData.TaxableAmount * updatedFormData.IGSTRate) /
    //             100
    //         ).toFixed(2);
    //         updatedFormData.CGSTAmount = 0.0;
    //         updatedFormData.SGSTAmount = 0.0;
    //     }

    //     const RateDiffAmt = updatedFormData.RateDiff * updatedFormData.NETQNTL;

    //     const RoundOff = parseFloat(updatedFormData.RoundOff) || 0.0;

    //     const cashAdvance = parseFloat(updatedFormData.cash_advance) || 0.0;

    //     const miscAmount = parseFloat(updatedFormData.OTHER_AMT) || 0.0;
    //     updatedFormData.Bill_Amount = (
    //         updatedFormData.TaxableAmount +
    //         parseFloat(updatedFormData.CGSTAmount) +
    //         parseFloat(updatedFormData.SGSTAmount) +
    //         parseFloat(updatedFormData.IGSTAmount) +
    //         miscAmount +
    //         RateDiffAmt +
    //         RoundOff +
    //         cashAdvance
    //     ).toFixed(2);

    //     const tcsRate = parseFloat(updatedFormData.TCS_Rate) || 0.0;
    //     updatedFormData.TCS_Amt = (
    //         (updatedFormData.Bill_Amount * tcsRate) /
    //         100
    //     ).toFixed(2);
    //     updatedFormData.TCS_Net_Payable = (
    //         parseFloat(updatedFormData.Bill_Amount) +
    //         parseFloat(updatedFormData.TCS_Amt)
    //     ).toFixed(2);

    //     const tdsRate = parseFloat(updatedFormData.TDS_Rate) || 0.0;
    //     updatedFormData.TDS_Amt = (
    //         (updatedFormData.TaxableAmount * tdsRate) /
    //         100
    //     ).toFixed(2);
    //     updatedFormData.TCS_Rate = tcsRate;
    //     updatedFormData.TDS_Rate = tdsRate;
    //     return updatedFormData;
    // };

    //-------------------------------------------- Detail Section Start ----------------------------------------------------
    useEffect(() => {
        if (selectedRecord) {
            setUsers(
                lastTenderDetails.map((detail) => ({
                    Ac_Code: detail.Ac_Code,
                    Ac_Name: detail.Ac_Name_E,
                    rowaction: "Normal",
                    Brand_Code: detail.Brand_Code,
                    brand_name: detail.brand_name,
                    ac: detail.ac,
                    id: detail.Raildetailid,
                    Raildetailid: detail.Raildetailid,
                    Local_Exp: detail.Local_Exp,
                    detail_id: detail.detail_id,
                }))
            );
        }
    }, [selectedRecord, lastTenderDetails]);

    useEffect(() => {
        const updatedUsers = lastTenderDetails.map((detail) => ({
            Ac_Code: detail.Ac_Code,
            Ac_Name: detail.Ac_Name_E,
            rowaction: "Normal",
            Brand_Code: detail.Brand_Code,
            brand_name: detail.brand_name,
            ac: detail.ac,
            id: detail.Raildetailid,
            Raildetailid: detail.Raildetailid,
            Local_Exp: detail.Local_Exp,
            detail_id: detail.detail_id,
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
        
        if (AcCode === "") {
            Swal.fire({
                icon: "warning",
                text: "Please Select Item.",
                confirmButtonColor: "#d33",
            });
            return false;
        }
        const maxDetailId =
            users.length > 0
                ? Math.max(...users.map((user) => user.detail_id)) + 1
                : 1;
        const newUser = {
            id: users.length > 0 ? Math.max(...users.map((user) => user.id)) + 1 : 1,
            Ac_Code: AcCode,
            Ac_Name: Ac_Name,
            ac: AcCodeAccoid,
            ...formDataDetail,
            detail_id: maxDetailId,
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

        // const matchStatus = await checkMatchStatus(
        //     updatedFormData.Ac_Code,
        //     companyCode,
        //     Year_Code
        // );
        let gstRate = GstRate;
        if (!gstRate || gstRate === 0) {
            const cgstRate = parseFloat(formData.CGSTRate) || 0;
            const sgstRate = parseFloat(formData.SGSTRate) || 0;
            const igstRate = parseFloat(formData.IGSTRate) || 0;

            gstRate = igstRate > 0 ? igstRate : cgstRate + sgstRate;
        }

        // updatedFormData = await calculateDependentValues(
        //     "GstRateCode",
        //     gstRate,
        //     updatedFormData,
        //     gstRate
        // );

        // setFormData(updatedFormData);
        closePopup();
    };

    const updateUser = async () => {
        const updatedUsers = users.map((user) => {
            if (user.id === selectedUser.id) {
                const updatedRowaction =
                    user.rowaction === "Normal" ? "update" : user.rowaction;
                return {
                    ...user,
                    Ac_Code: AcCode,
                    Ac_Name: Ac_Name,
                    ac: formDataDetail.ac,
                    Local_Exp: formDataDetail.Local_Exp,
                    rowaction: updatedRowaction,
                    detail_id: user.detail_id
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
        // const matchStatus = await checkMatchStatus(
        //     updatedFormData.Ac_Code,
        //     companyCode,
        //     Year_Code
        // );

        let gstRate = GstRate;
        if (!gstRate || gstRate === 0) {
            const cgstRate = parseFloat(formData.CGSTRate) || 0;
            const sgstRate = parseFloat(formData.SGSTRate) || 0;
            const igstRate = parseFloat(formData.IGSTRate) || 0;

            gstRate = igstRate > 0 ? igstRate : cgstRate + sgstRate;
        }

        // updatedFormData = await calculateDependentValues(
        //     "GstRateCode",
        //     gstRate,
        //     updatedFormData,
        //     gstRate
        // );

        // setFormData(updatedFormData);
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

        // const matchStatus = await checkMatchStatus(
        //     updatedFormData.Ac_Code,
        //     companyCode,
        //     Year_Code
        // );

        let gstRate = GstRate;
        if (!gstRate || gstRate === 0) {
            const cgstRate = parseFloat(formData.CGSTRate) || 0;
            const sgstRate = parseFloat(formData.SGSTRate) || 0;
            const igstRate = parseFloat(formData.IGSTRate) || 0;

            gstRate = igstRate > 0 ? igstRate : cgstRate + sgstRate;
        }

        // updatedFormData = await calculateDependentValues(
        //     "GstRateCode",
        //     gstRate,
        //     updatedFormData,
        //     gstRate
        // );
        // setFormData(updatedFormData);
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

        // const matchStatus = await checkMatchStatus(
        //     updatedFormData.Ac_Code,
        //     companyCode,
        //     Year_Code
        // );

        let gstRate = GstRate;
        if (!gstRate || gstRate === 0) {
            const cgstRate = parseFloat(formData.CGSTRate) || 0;
            const sgstRate = parseFloat(formData.SGSTRate) || 0;
            const igstRate = parseFloat(formData.IGSTRate) || 0;

            gstRate = igstRate > 0 ? igstRate : cgstRate + sgstRate;
        }

        // updatedFormData = await calculateDependentValues(
        //     "GstRateCode",
        //     gstRate,
        //     updatedFormData,
        //     gstRate
        // );

        // setFormData(updatedFormData);
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
            Local_Exp: 0.0,
            detail_id: 1,
        });
        setAcCode("");
        setAcName("");
    };

    const editUser = (user) => {
        setSelectedUser(user);
        setAcCode(user.Ac_Code);
        setAcName(user.Ac_Name);
        setAcCodeAccoid(user.ac)
        setFormDataDetail({
            Local_Exp: user.Local_Exp || 0.0,
            detail_id: user.detail_id,
        });
        openPopup("edit");
    };


    const handleBroker = (code, accoid, name) => {
        setAcCode(code);
        setAcCodeAccoid(accoid);
        setAcName(name);
        setFormDataDetail({
            ...formDataDetail,
            Ac_Code: code,
            ac: accoid,
            Ac_Name: name
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

    return (
        <>
            <UserAuditInfo
                createdBy={formData.Created_By}
                modifiedBy={formData.Modified_By}
                title={"Railway Rack Master"}
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
                {/* <Grid container alignItems="center" spacing={1} mt={0.5}>
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
                                label="Doc No"
                                variant="outlined"
                                name="Doc_No"
                                autoComplete="off"
                                value={formData.Doc_No}
                                onChange={handleChange}
                                disabled
                                fullWidth
                                size="small"
                            />
                        </FormControl>
                    </Grid>

                </Grid>

                <div className="SaleBill-row">
                    <Grid container spacing={1} mt={1.5}>
                        <Grid item xs={6} sm={2}>
                            <FormControl fullWidth>
                                <TextField
                                    label="Station Name"
                                    name="RailwayStation_Name"
                                    autoComplete="off"
                                    value={formData.RailwayStation_Name}
                                    onChange={handleChange}
                                    disabled={!isEditing && addOneButtonEnabled}
                                    tabIndex={5}
                                    size="small"
                                />
                            </FormControl>
                        </Grid>

                        <Grid container spacing={1} mt={1.5}>
                            <Grid item xs={6} sm={3}>
                                <FormControl fullWidth>
                                    <TextField fullWidth label="Address" id="Address"
                                        variant="outlined"
                                        size="small"
                                        name="Address"
                                        value={formData.Address}
                                        autoComplete="off"
                                        onChange={handleChange}
                                        disabled={(!isEditing && addOneButtonEnabled)}

                                        InputLabelProps={{
                                            shrink: true,
                                        }}
                                    />
                                </FormControl>
                            </Grid>
                        </Grid>

                        <Grid container spacing={1} mt={1.5}>
                            <Grid item xs={6} sm={1}>
                                <FormControl fullWidth>
                                    <TextField
                                        label="City"
                                        name="City"
                                        autoComplete="off"
                                        value={formData.City}
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
                        </Grid>

                        <Grid container spacing={1} mt={1.5}>
                            <Grid item xs={6} sm={1}>
                                <FormControl fullWidth>
                                    <TextField
                                        label="Pincode"
                                        name="Pincode"
                                        autoComplete="off"
                                        value={formData.Pincode}
                                        onChange={handleChange}
                                        disabled={!isEditing && addOneButtonEnabled}
                                        tabIndex={8}
                                        size="small"
                                    />
                                </FormControl>
                            </Grid>
                        </Grid>

                    </Grid>
                </div> */}

                <div className="flex justify-left items-center min-h-[30vh]">
                    <div className="w-full max-w-7xl p-6">
                        <form className="bg-white rounded-lg shadow-md p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="block text-left text-sm font-bold text-gray-800">
                                        Change No
                                    </label>
                                    <input
                                        type="text"
                                        name="changeNo"
                                        onKeyDown={handleKeyDown}
                                        disabled={!addOneButtonEnabled}
                                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-indigo-600 sm:text-sm/6"
                                    />
                                </div>


                                <div>
                                    <label className="block text-left text-sm font-bold text-gray-800">
                                        Doc No
                                        <span className="ml-1 text-xs text-gray-500">(Auto-generated)</span>
                                    </label>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            name="Doc_No"
                                            value={formData.Doc_No}
                                            onChange={handleChange}
                                            readOnly
                                            disabled
                                            className="w-full px-3 py-2 text-left border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-700 cursor-not-allowed focus:outline-none"
                                        />
                                        <div className="absolute right-3 top-2.5 text-gray-400">
                                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="absolute left-0 -top-6 hidden group-hover:block bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                            Auto-generated and read-only
                                        </div>
                                    </div>
                                </div>

                                {/* Marka Name */}

                                <div >
                                    <label className="block text-left text-sm font-bold text-gray-800 text-base">
                                        Railway Station Name
                                    </label>
                                    <input
                                        type="text"
                                        name="RailwayStation_Name"
                                        ref={inputRef}
                                        value={formData.RailwayStation_Name}
                                        onChange={handleChange}
                                        disabled={!isEditing && addOneButtonEnabled}
                                        className={`block w-full rounded-md px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-indigo-600 sm:text-sm
              ${(!isEditing && addOneButtonEnabled) ? "bg-gray-100 cursor-not-allowed" : "bg-white"}`}
                                    />
                                </div>

                                {/* English Name */}
                                <div>
                                    <label className="block text-left text-sm font-bold text-gray-800 text-base">
                                        Address
                                    </label>
                                    <textarea
                                        name="Address"
                                        value={formData.Address}
                                        onChange={handleChange}
                                        disabled={!isEditing && addOneButtonEnabled}
                                        rows={3}
                                        className={`block w-full rounded-md px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-indigo-600 sm:text-sm resize-none
        ${(!isEditing && addOneButtonEnabled) ? "bg-gray-100 cursor-not-allowed" : "bg-white"}`}
                                    />
                                </div>




                                {/* Aarambhi Nag */}
                                <div>
                                    <label className="block text-left text-sm font-bold text-gray-800 text-base">
                                        City
                                    </label>
                                    <input
                                        type="text"
                                        name="City"
                                        value={formData.City}
                                        onChange={handleChange}
                                        disabled={!isEditing && addOneButtonEnabled}
                                        className={`block w-full rounded-md px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-indigo-600 sm:text-sm
              ${(!isEditing && addOneButtonEnabled) ? "bg-gray-100 cursor-not-allowed" : "bg-white"}`}
                                    />
                                </div>

                                {/* Nagache Vajan */}
                                <div>
                                    <label className="block text-left text-sm font-bold text-gray-800 text-base">
                                        PinCode
                                    </label>
                                    <input
                                        type="text"
                                        name="Pincode"
                                        value={formData.Pincode}
                                        onChange={handleChange}
                                        disabled={!isEditing && addOneButtonEnabled}
                                        className={`block w-full rounded-md px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-indigo-600 sm:text-sm
              ${(!isEditing && addOneButtonEnabled) ? "bg-gray-100 cursor-not-allowed" : "bg-white"}`}
                                    />
                                </div>
                            </div>
                        </form>
                    </div>
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
                                            {selectedUser.id ? "Update Rack Entry" : "Add Rack Entry"}
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
                                            <div className="SugarSaleBill-row" style={{ marginTop: '-5px' }}>
                                                <label htmlFor="Mill_Name" style={{ fontWeight: "bold" }} >
                                                    Account Code:
                                                </label>
                                                <div >
                                                    <div >
                                                        <AccountMasterHelp
                                                            onAcCodeClick={handleBroker}
                                                            CategoryName={Ac_Name}
                                                            CategoryCode={AcCode}
                                                            name="Ac_Code"
                                                            Ac_type=""
                                                            firstInputRef={firstInputRef}
                                                            disabledFeild={!isEditing && addOneButtonEnabled}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <Grid container spacing={2} className="mt-3">
                                                <Grid item xs={12} sm={6}>
                                                    <TextField
                                                        label="Local_Exp"
                                                        name="Local_Exp"
                                                        value={formDataDetail.Local_Exp}
                                                        onChange={handleChangeDetail}
                                                        fullWidth
                                                        autoComplete="off"
                                                        variant="outlined"
                                                        size="small"
                                                    />
                                                </Grid>

                                            </Grid>

                                            {/* <Grid container spacing={2} className="mt-3">
                                                
                                    
                                            </Grid>

                                            <Grid container spacing={2} className="mt-3">
                                            
                            
                                            </Grid> */}
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
                                        <TableCell sx={headerCellStyle}>Account code</TableCell>
                                        <TableCell sx={headerCellStyle}>Account Name</TableCell>
                                        <TableCell sx={headerCellStyle}>Local Expenses</TableCell>
                                        {/* <TableCell sx={headerCellStyle}>Saledetailid</TableCell> */}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {users.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell sx={{ padding: '0px 1px' }}>
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
                                            <TableCell sx={{ padding: '0px 1px', textAlign: "center" }}>{user.detail_id}</TableCell>
                                            <TableCell sx={{ padding: '0px 1px', textAlign: "center" }}>{user.Ac_Code}</TableCell>
                                            <TableCell sx={{ padding: '0px 1px', textAlign: "center" }}>{user.Ac_Name}</TableCell>
                                            <TableCell sx={{ padding: '0px 1px', textAlign: "center" }}>{formatReadableAmount(user.Local_Exp)}</TableCell>
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
                            {/* <Grid container spacing={1} mt={1}>
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

                                

                    
                            </Grid>    */}
                        </div>
                    </div>

                    <div>
                        <div className="SaleBill-row" >
                            {/* <Grid container spacing={1} mt={-45} sx={{ textAlign: 'left' }}>
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
                            </Grid> */}
                        </div>
                    </div>
                </div>
            </form>
        </>
    );
};
export default RailwayRack;