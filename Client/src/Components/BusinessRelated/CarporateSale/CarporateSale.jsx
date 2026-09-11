import React, { useState, useRef, useEffect, useDebugValue } from "react";
import { TextField, Grid, InputLabel, FormControl, Select, MenuItem, FormControlLabel, Checkbox, TextareaAutosize, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import "bootstrap/dist/css/bootstrap.min.css";
import CloseIcon from '@mui/icons-material/Close';
import AccountMasterHelp from "../../../Helper/AccountMasterHelp";

import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import ActionButtonGroup from "../../../Common/CommonButtons/ActionButtonGroup";
import NavigationButtons from "../../../Common/CommonButtons/NavigationButtons";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { useRecordLocking } from '../../../hooks/useRecordLocking';
import "./carporateBill.css"
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
import { OutwordPostDateRecordLock } from "../../../Common/PostDateLock/PostDateRangeCheck"
import { validateDocumentDate } from "../../../Common/ValidateDateRange/ValidateDateRange"
import formatTruckNumber from "../../../Common/FormatFunctions/FormatTruckNumber"

import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";

//Global Variables
var newcarpid = "";
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

var billToName = "";
var billToCode = "";


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

const CarporateBill = () => {

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
    const today = new Date().toISOString().slice(0, 10);

    const [formDataDetail, setFormDataDetail] = useState({
        schedule_date: today,
        schedule_qntl: 0,
        transit_days: 0,
        remind_date: today,
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


    const [billToManuallySet, setBillToManuallySet] = useState(false);
    const [shipToManuallySet, setShipToManuallySet] = useState(false);
    const [bill_to_Name, setBillToName] = useState('')
    const [ship_To_Name, setShipToName] = useState('')
    const [RemindDate, setRemindDate] = useState('')


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
        doc_date: new Date().toISOString().split("T")[0],
        ac_code: "",
        unit_code: "",
        broker: "",
        pono: "",
        quantal: 0.0,
        sell_rate: 0.0,
        remark: "",
        company_code: companyCode,
        created_by: "",
        modified_by: "",
        DeliveryType: "N",
        CommissionRate: 0.0,
        selling_type: "C",
        ac: 0,
        uc: 0,
        br: 0,
        bill_to: 0,
        bt: 0,
    };

    //ALL Help Section State managements
    const [formData, setFormData] = useState(initialFormData);
    const [billFrom, setBillFrom] = useState("");
    const [partyCommision, setPartyCommision] = useState("");


    const [billTo, setBillTo] = useState("");
    const [mill, setMill] = useState("");

    const [shipTo, setShipTo] = useState("");

    const [broker, setbroker] = useState("");
    const [GstRate, setGstRate] = useState(0.0);

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

    useEffect(() => {
        if (isHandleChange) {
            handleCancel();
            setIsHandleChange(false);
        }
    }, []);

    //fetchLast Records to get the next doc no
    const fetchLastRecord = () => {
        fetch(
            `${API_URL}/get-next-doc-no-carp?Company_Code=${companyCode}&Year_Code=${Year_Code}`
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

        billToName = "";
        billToCode = "";

        setLastTenderDetails([]);
        setTimeout(() => {
            inputRef.current?.focus();
        }, 0);
    };

    //handle Edit record functionality.
    const handleEdit = async () => {


        axios.get(`${API_URL}/getcorporateSaleByid?carpid=${formData.carpid}&Company_Code=${companyCode}&Year_Code=${Year_Code}`)
            .then((response) => {
                const data = response.data;
                const isLockedNew = data.last_head_data.LockedRecord;
                const isLockedByUserNew = data.last_head_data.LockedUser;


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
        const accountingYearData = sessionStorage.getItem('Accounting_Year');
        const formattedEntryDate = formData.doc_date;
        const isValid = validateDocumentDate(formattedEntryDate, accountingYearData);
        let missingFields = [];

        if (!formData.ac_code) missingFields.push("Bill From");
        if (!formData.bill_to) missingFields.push("Bill To");
        if (!formData.unit_code) missingFields.push("Ship To");


        if (missingFields.length > 0) {
            Swal.fire({
                text: `Please Select the following fields: ${missingFields.join(", ")}`,
                icon: "warning",
                confirmButtonText: "OK"
            });
            return;
        }

        setIsEditing(true);
        setIsLoading(true);

        let headData = {
            ...formData,

            ...(isEditMode
                ? {
                    modified_by: username,
                    //  User_Id: User_Id
                }
                : {
                    created_by: username
                }
            )
        };
        delete headData[""];

        if (isEditMode) {
            delete headData.carpid;

        } else {
            // headData.Created_By = username;
        }
        const detailData = users.map((user) => ({
            rowaction: user.rowaction,
            carpdetailid: user.carpdetailid,
            scheduale_qntl: user.scheduale_qntl,
            schedule_date: user.schedule_date
                ? new Date(user.schedule_date).toISOString().split('T')[0]
                : '',
            transit_days: user.transit_days,
            detail_Id: user.detail_Id,



        }));

        const requestData = {
            headData,
            detailData,
        };

        try {
            if (isEditMode) {
                const updateApiUrl = `${API_URL}/update-corporate?carpid=${newcarpid}`;
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
                navigate(`/CarporateSale?navigatedRecord=${formData.doc_no}`);
            } else {
                const response = await axios.post(
                    `${API_URL}/insert-corporate`,
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
                navigate(`/CarporateSale?navigatedRecord=${formData.doc_no}`);
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
        if (await OutwordPostDateRecordLock(formData.doc_date, Post_Date, Outword_Date)) {
            return;
        }

        try {
            const response = await axios.get(
                `${API_URL}/getcorporateSaleByid?carpid=${newcarpid}&Company_Code=${companyCode}&Year_Code=${Year_Code}`
            );

            const data = response.data;
            // const isLockedNew = data.last_head_data.LockedRecord;
            // const isLockedByUserNew = data.last_head_data.LockedUser;



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

                const deleteApiUrl = `${API_URL}/delete_data_by_carpid?carpid=${newcarpid}&Company_Code=${companyCode}&doc_no=${formData.doc_no}&Year_Code=${Year_Code}`;
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
        newcarpid = headData.carpid;
        partyName = details.partyname;
        partyCode = headData.ac_code;
        unitName = details.unitname;
        unitCode = headData.unit_code;
        billToName = details.billtoname;
        billToCode = headData.bill_to;


        brokerCode = headData.broker;
        brokerName = details.brokername;

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
                `${API_URL}/get-lastcorporatedata?Company_Code=${companyCode}&Year_Code=${Year_Code}`
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
        navigate("/CarporateSale-utility");
    };

    // Navigation Funtionality 
    const handleFirstButtonClick = async () => {
        try {
            const response = await axios.get(
                `${API_URL}/get-firstcorporate-navigation?Company_Code=${companyCode}&Year_Code=${Year_Code}`
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
                `${API_URL}/get-lastcorporatedata?Company_Code=${companyCode}&Year_Code=${Year_Code}`
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
                `${API_URL}/get-nextcorporate-navigation?Company_Code=${companyCode}&Year_Code=${Year_Code}&currentDocNo=${formData.doc_no}`
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
                `${API_URL}/get-previouscorporate-navigation?Company_Code=${companyCode}&Year_Code=${Year_Code}&currentDocNo=${formData.doc_no}`
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
                `${API_URL}/getcorporateSaleByid?carpid=${selectedRecord.carpid}&Company_Code=${companyCode}&Year_Code=${Year_Code}`
            );
            if (response.status === 200) {
                const data = response.data;

                newcarpid = data.last_head_data.carpid;
                partyName = data.last_details_data[0].partyname;
                partyCode = data.last_head_data.ac_code;
                unitName = data.last_details_data[0].unitname;
                unitCode = data.last_head_data.unit_code;
                billToName = data.last_details_data[0].billtoname;
                billToCode = data.last_head_data.bill_to;

                brokerCode = data.last_head_data.broker;
                brokerName = data.last_details_data[0].brokername;

                setFormData((prevData) => ({
                    ...prevData,
                    ...data.last_head_data,
                }));
                setLastTenderData(data.last_head_data || {});
                setLastTenderDetails(data.last_details_data || []);
                console.log(lastTenderDetails);
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
                `${API_URL}/CarporateBillByDocNo?doc_no=${navigatedRecord}&Company_Code=${companyCode}&Year_Code=${Year_Code}`
            );
            if (response.status === 200) {
                const data = response.data;

                newcarpid = data.last_head_data.carpid;
                partyName = data.last_details_data[0].partyname;
                partyCode = data.last_head_data.ac_code;
                unitName = data.last_details_data[0].unitname;
                unitCode = data.last_head_data.unit_code;
                billToName = data.last_details_data[0].billtoname;
                billToCode = data.last_head_data.bill_to;


                brokerCode = data.last_head_data.broker;
                brokerName = data.last_details_data[0].brokername;

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
                    `${API_URL}/CarporateBillByDocNo?doc_no=${changeNoValue}&Company_Code=${companyCode}&Year_Code=${Year_Code}`
                );
                const data = response.data;
                newcarpid = data.last_head_data.carpid;
                partyName = data.last_details_data[0].partyname;
                partyCode = data.last_head_data.ac_code;
                unitName = data.last_details_data[0].unitname;
                unitCode = data.last_details_data[0].unit_code;
                billToName = data.last_details_data[0].billtoname;
                billToCode = data.last_head_data.bill_to;

                brokerCode = data.last_head_data.broker;
                brokerName = data.last_details_data[0].brokername;

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
                        ac_code: ac_code,
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
    //-------------------------------------------- Detail Section Start ----------------------------------------------------
    useEffect(() => {
        if (selectedRecord) {
            setUsers(
                lastTenderDetails.map((detail) => ({

                    rowaction: "Normal",
                    id: detail.carpdetailid,
                    carpdetailid: detail.carpdetailid,

                    transit_days: detail.transit_days,
                    scheduale_qntl: detail.scheduale_qntl,
                    schedule_date: detail.schedule_date,
                    //  se: Remind_Date.Remind_Date,
                    // setRemindDate(detail.Remind_Date)  
                }))
            );
        }
    }, [selectedRecord, lastTenderDetails]);

    useEffect(() => {
        const updatedUsers = lastTenderDetails.map((detail) => ({

            rowaction: "Normal",
            id: detail.carpdetailid,
            carpdetailid: detail.carpdetailid,

            transit_days: detail.transit_days,
            scheduale_qntl: detail.scheduale_qntl,
            schedule_date: detail.schedule_date,
            //Remind_Date: Remind_Date.Remind_Date,
        }));
        setUsers(updatedUsers);
    }, [lastTenderDetails]);



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
                [name]: name === "transit_days"
                    ? parseInt(value) || 0
                    : name === "scheduale_qntl"
                        ? parseFloat(value) || 0
                        : value, // Keep date and other strings as-is
            };

            const { schedule_date, transit_days } = updatedDetail;
            const { remind_date } = calculateDetails1(schedule_date, transit_days);

            updatedDetail.remind_date = remind_date;

            return updatedDetail;
        });
    };

    const calculateDetails1 = (schedule_date, transit_days) => {
        if (!schedule_date || isNaN(transit_days)) {
            return { remind_date: '' };
        }

        const date = new Date(schedule_date);
        if (isNaN(date)) return { remind_date: '' };

        date.setDate(date.getDate() + parseInt(transit_days));
        const remind_date = date.toISOString().split('T')[0]; // returns YYYY-MM-DD

        return { remind_date };
    };



    const calculateDetails = (schedule_date, transit_days) => {
        if (!schedule_date || !transit_days) return '';
        const remindDate = new Date(schedule_date);
        remindDate.setDate(remindDate.getDate() + parseInt(transit_days));
        return remindDate.toLocaleDateString('en-GB'); // dd/mm/yyyy format
    };
    const addUser = async () => {

        const newUser = {
            id: users.length > 0 ? Math.max(...users.map((user) => user.id)) + 1 : 1,
            schedule_date: users.schedule_date ? new Date(users.schedule_date).toISOString().split('T')[0] : '',
            scheduale_qntl: users.scheduale_qntl,
            transit_days: users.transit_days,
            remind_date: users.remind_date ? new Date(users.remind_date).toISOString().split('T')[0] : '',

            ...formDataDetail,
            rowaction: "add",
        };

        const updatedUsers = [...users, newUser];
        setUsers(updatedUsers);

        //setFormData(updatedUsers);
        closePopup();
    };

    const updateUser = async () => {
        const updatedUsers = users.map((user) => {
            if (user.id === selectedUser.id) {
                const updatedRowaction =
                    user.rowaction === "Normal" ? "update" : user.rowaction;
                return {
                    ...user,
                    schedule_date: formDataDetail.schedule_date,
                    scheduale_qntl: formDataDetail.scheduale_qntl,
                    transit_days: formDataDetail.transit_days,
                    rowaction: updatedRowaction,
                    remind_date: formDataDetail.remind_date

                };
            } else {
                return user;
            }
        });

        setUsers(updatedUsers);
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
            schedule_date: "",
            scheduale_qntl: 0,
            transit_days: 0,
            remind_date: "",
        });

    };

    const editUser = (user) => {
        const formatDate = (dateStr) => {
            const date = new Date(dateStr);
            if (isNaN(date)) return "";
            return date.toISOString().split("T")[0]; // Converts to 'YYYY-MM-DD'
        };

        setSelectedUser(user);

        setFormDataDetail({
            schedule_date: user.schedule_date ? formatDate(user.schedule_date) : "",
            scheduale_qntl: user.scheduale_qntl || 0,
            transit_days: user.transit_days || 0.0,
            remind_date: calculateDetails(user.schedule_date, user.transit_days) || "",
        });
        openPopup("edit");
    };

    //Head Section help Functions to manage the ac_code and accoid
    const handleBillFrom = async (code, accoid, Name, Mobile_No, Gst_No, TDSApplicable, GSTStateCode, cityname, state_name, Commission) => {
        setBillFrom(code);
        setPartyCommision(Commission)
        setFormData({
            ...formData,
            ac_code: code,
            ac: accoid,
            CommissionRate: Commission
        });

    };

    const handleBillTo = (code, accoid) => {

        setBillTo(code);
        setFormData({
            ...formData,
            bill_to: code,
            bt: accoid,
        });
    };



    const handleShipTo = (code, accoid, name, Mobile_No) => {
        setShipToManuallySet(true)
        setShipTo(code);

        setFormData({
            ...formData,
            unit_code: code,
            uc: accoid,
        });
    };


    const handlebroker = (code, accoid) => {
        setbroker(code);
        setFormData({
            ...formData,
            broker: code,
            br: accoid,
        });
    };


    return (
        <>
            <UserAuditInfo
                createdBy={formData.created_by}
                modifiedBy={formData.modified_by}
                title={"Carporate Sale Bill"}
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
                {/* Top Row Fields */}
                <Grid container alignItems="center" spacing={1} mt={0.5}>
                    <Grid item xs={12} sm={1}>
                        <TextField
                            label="Change No"
                            name="changeNo"
                            variant="outlined"
                            autoComplete="off"
                            onKeyDown={handleKeyDown}
                            disabled={!addOneButtonEnabled}
                            fullWidth
                            size="small"
                        />
                    </Grid>

                    <Grid item xs={6} sm={1}>
                        <TextField
                            label="Bill No"
                            name="doc_no"
                            value={formData.doc_no}
                            onChange={handleChange}
                            disabled
                            variant="outlined"
                            fullWidth
                            size="small"
                        />
                    </Grid>

                    <Grid item xs={6} sm={1}>
                        <TextField
                            inputRef={inputRef}
                            type="date"
                            label="Date"
                            name="doc_date"
                            value={formData.doc_date}
                            onChange={handleChange}
                            disabled={!isEditing && addOneButtonEnabled}
                            fullWidth
                            size="small"
                            InputLabelProps={{ shrink: true, style: { fontSize: '14px' } }}
                            InputProps={{ style: { fontSize: '12px', height: '40px' } }}
                        />
                    </Grid>
                </Grid>

                {/* Dropdown Fields */}
                <Grid container spacing={1} mt={1.5}>
                    <Grid item xs={6} sm={2}>
                        <FormControl fullWidth size="small">
                            <InputLabel id="DeliveryType">Delivery Type</InputLabel>
                            <Select
                                labelId="DeliveryType"
                                name="DeliveryType"
                                value={formData.DeliveryType}
                                onChange={handleChange}
                                disabled={!isEditing && addOneButtonEnabled}
                            >
                                <MenuItem value="C">Commission</MenuItem>
                                <MenuItem value="N">With GST Naka Delivery</MenuItem>
                                <MenuItem value="A">Naka Delivery without GST Rate</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={6} sm={2}>
                        <FormControl fullWidth size="small">
                            <InputLabel id="selling_type">Selling Type</InputLabel>
                            <Select
                                labelId="selling_type"
                                name="selling_type"
                                value={formData.selling_type}
                                onChange={handleChange}
                                disabled={!isEditing && addOneButtonEnabled}
                            >
                                <MenuItem value="C">Corporate Sell</MenuItem>
                                <MenuItem value="P">PDS Sell</MenuItem>
                                <MenuItem value="PS">Party Sell</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>

                {/* Account Selection */}
                <div className="SugarSaleBill-row">
                    <label className="SugarSaleBillLabel">Party:</label>
                    <AccountMasterHelp
                        onAcCodeClick={handleBillFrom}
                        CategoryName={partyName}
                        CategoryCode={partyCode}
                        name="ac_code"
                        Ac_type={[]}
                        disabledFeild={!isEditing && addOneButtonEnabled}
                    />
                </div>

                <div className="SugarSaleBill-row">
                    <label className="SugarSaleBillLabel">Bill To:</label>
                    <AccountMasterHelp
                        onAcCodeClick={handleBillTo}
                        name="bill_to"
                        CategoryName={billToName}
                        CategoryCode={billToCode}

                        Ac_type={[]}
                        disabledFeild={!isEditing && addOneButtonEnabled}
                    />
                </div>

                <div className="SugarSaleBill-row">
                    <label className="SugarSaleBillLabel">Ship To:</label>
                    <AccountMasterHelp
                        onAcCodeClick={handleShipTo}
                        CategoryName={unitName || ship_To_Name}
                        CategoryCode={unitCode}
                        name="unit_code"
                        Ac_type={[]}
                        disabledFeild={!isEditing && addOneButtonEnabled}
                    />
                </div>

                <div className="SugarSaleBill-row">
                    <label className="SugarSaleBillLabel">Broker:</label>
                    <AccountMasterHelp
                        onAcCodeClick={handlebroker}
                        CategoryName={brokerName}
                        CategoryCode={brokerCode}
                        name="broker"
                        Ac_type=""
                        disabledFeild={!isEditing && addOneButtonEnabled}
                    />
                </div>


                <Grid container spacing={1} mt={1.5}>
                    <Grid item xs={6} sm={2}>
                        <TextField
                            label="quantal"
                            name="quantal"
                            autoComplete="off"
                            value={formData.quantal}
                            onChange={handleChange}
                            disabled={!isEditing && addOneButtonEnabled}
                            fullWidth
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={6} sm={2}>
                        <TextField
                            label="sell_rate"
                            name="sell_rate"
                            autoComplete="off"
                            value={formData.sell_rate}
                            onChange={handleChange}
                            disabled={!isEditing && addOneButtonEnabled}
                            fullWidth
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={6} sm={2}>
                        <TextField
                            label="CommissionRate"
                            name="CommissionRate"
                            autoComplete="off"
                            value={formData.CommissionRate}
                            onChange={handleChange}
                            disabled={!isEditing && addOneButtonEnabled}
                            fullWidth
                            size="small"
                        />
                    </Grid>

                </Grid>


                {/* PO Field */}
                <Grid container spacing={1} mt={1.5}>
                    <Grid item xs={6} sm={2}>
                        <TextField
                            label="PO Details"
                            name="pono"
                            autoComplete="off"
                            value={formData.pono}
                            onChange={handleChange}
                            disabled={!isEditing && addOneButtonEnabled}
                            fullWidth
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={6} sm={2}>
                        <TextField
                            label="Remark"
                            name="remark"
                            autoComplete="off"
                            value={formData.remark}
                            onChange={handleChange}
                            disabled={!isEditing && addOneButtonEnabled}
                            fullWidth
                            size="small"
                        />
                    </Grid>
                </Grid>

                {/* Loading Spinner */}
                {isLoading && (
                    <div className="loading-overlay">
                        <div className="spinner-container">
                            <SaveUpdateSpinner />
                        </div>
                    </div>
                )}

                {/* Add Button */}
                {false && (
                    <div style={{ marginTop: "10px" }}>
                        <AddButton
                            openPopup={openPopup}
                            isEditing={isEditing}
                            ref={addButtonRef}
                            setFocusToFirstField={setFocusToFirstField}
                        />
                    </div>
                )}

                {/* Detail Popup */}
                {showPopup && (
                    <div className="sugar-salebill-modal" role="dialog" style={{ display: "none" }}>
                        <div className="sugar-salebill-modal-dialog">
                            <div className="modal-content">
                                <div className="sugar-salebill-modal-header">
                                    <h5>{selectedUser.id ? "Update carporate Bill" : "Add Carporate Bill Details"}</h5>
                                    <button type="button" onClick={closePopup}>&times;</button>
                                </div>

                                <div className="sugar-salebill-body">
                                    <form>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12} sm={6}>
                                                <TextField
                                                    inputRef={inputRef}
                                                    type="date"
                                                    label="Date"
                                                    name="schedule_date"
                                                    value={formDataDetail.schedule_date}
                                                    onChange={handleChangeDetail}
                                                    disabled={!isEditing && addOneButtonEnabled}
                                                    fullWidth
                                                    size="small"
                                                    InputLabelProps={{ shrink: true, style: { fontSize: '14px' } }}
                                                    InputProps={{ style: { fontSize: '12px', height: '40px' } }}
                                                />
                                            </Grid>

                                            <Grid item xs={12} sm={6}>
                                                <TextField
                                                    label="Schedule Qntl"
                                                    name="scheduale_qntl"
                                                    value={formDataDetail.scheduale_qntl}
                                                    onChange={handleChangeDetail}
                                                    fullWidth
                                                    size="small"
                                                />
                                            </Grid>

                                            <Grid item xs={12} sm={6}>
                                                <TextField
                                                    label="Transit Days"
                                                    name="transit_days"
                                                    value={formDataDetail.transit_days}
                                                    onChange={handleChangeDetail}
                                                    fullWidth
                                                    size="small"
                                                />
                                            </Grid>

                                            <Grid item xs={12} sm={6}>
                                                <TextField
                                                    inputRef={inputRef}
                                                    type="date"
                                                    label="Date"
                                                    name="Remind Date"
                                                    value={formDataDetail.remind_date}
                                                    onChange={handleChangeDetail}
                                                    disabled={!isEditing && addOneButtonEnabled}
                                                    fullWidth
                                                    size="small"
                                                    InputLabelProps={{ shrink: true, style: { fontSize: '14px' } }}
                                                    InputProps={{ style: { fontSize: '12px', height: '40px' } }}
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

                {/* Detail Table */}
                {false && (
                    <TableContainer component={Paper} sx={{ width: "70%", mt: 2, visibility: false }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Actions</TableCell>
                                    <TableCell>ID</TableCell>
                                    <TableCell>Schedule Date</TableCell>
                                    <TableCell>Schedule Qntl</TableCell>
                                    <TableCell>Transit Days</TableCell>
                                    <TableCell>Remind Date</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>
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
                                        <TableCell>{user.schedule_date ? new Date(user.schedule_date).toLocaleDateString('en-GB') : ''}</TableCell>
                                        <TableCell>{user.scheduale_qntl}</TableCell>
                                        <TableCell>{user.transit_days}</TableCell>
                                        <TableCell>{calculateDetails(user.schedule_date, user.transit_days)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </form>
        </>
    );
};
export default CarporateBill;