import React, { useState, useRef, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import AccountMasterHelp from "../../../Helper/AccountMasterHelp";
import GSTRateMasterHelp from "../../../Helper/GSTRateMasterHelp";
import ItemMasterHelp from "../../../Helper/SystemmasterHelp";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import ActionButtonGroup from "../../../Common/CommonButtons/ActionButtonGroup";
import NavigationButtons from "../../../Common/CommonButtons/NavigationButtons";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./ProformaServiceBill.css";
import { useRecordLocking } from "../../../hooks/useRecordLocking";
import { TextField, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Paper, Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material';
import UserAuditInfo from "../../../Common/UserAuditInfo/UserAuditInfo";
import AddButton from "../../../Common/Buttons/AddButton";
import EditButton from "../../../Common/Buttons/EditButton";
import DeleteButton from "../../../Common/Buttons/DeleteButton";
import OpenButton from "../../../Common/Buttons/OpenButton";
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";
import GroupMasterHelp from "../../../Helper/SystemmasterHelp";
import ProformaServiceBillReportPrint from '../ProformaServiceBill/ProformaServiceBillReportPrint'
import ProformaServiceBillReportSEIC from "./ProformaServiceBillReportSEIC";
import CloseIcon from '@mui/icons-material/Close';
import Swal from "sweetalert2";
import EInvoiceGeneration from "../../../Common/EwaybillNEInvoice/EInvoiceGenerationProcess/EInvoiceGeneration";
import DetailAddButtom from "../../../Common/Buttons/DetailAddButton";
import DetailCloseButton from "../../../Common/Buttons/DetailCloseButton";
import DetailUpdateButton from "../../../Common/Buttons/DetailUpdateButton";
import SaveUpdateSpinner from "../../../Common/Spinners/SaveUpdateSpinner";
import { validateDocumentDate } from "../../../Common/ValidateDateRange/ValidateDateRange"

//Global Variables
var newSaleid = "";
var partyName = "";
var partyCode = "";
var millName = "";
var millCode = "";
var unitName = "";
var unitCode = "";
var itemName = "";
var item_Code = "";
var gstrate = "";
var gstRateCode = "";
var gstName = "";
var billToName = "";
var billToCode = "";
var gstStateCode = "";
var GroupCode = ""
var GroupName = "";
var newEventCode = ""
var lblEventName = ''

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

const ProformaServiceBill = () => {
    const companyCode = sessionStorage.getItem("Company_Code");
    const Year_Code = sessionStorage.getItem("Year_Code");
    const username = sessionStorage.getItem("username");
    const TCSApplicable = sessionStorage.getItem("TCSApplicable");
    const User_Id = sessionStorage.getItem("User_ID");
    const Company_Name = sessionStorage.getItem("Company_Name")

    const [users, setUsers] = useState([]);
    const [showPopup, setShowPopup] = useState(false);
    const [popupMode, setPopupMode] = useState("add");
    const [selectedUser, setSelectedUser] = useState({});
    const [deleteMode, setDeleteMode] = useState(false);

    const [groupCode, setGroupCode] = useState('');
    const [gcId, setGCID] = useState('');
    const [groupName, setGroupName] = useState('');

      const [event_Code, setEventCode] = useState("");
      const [event_Id, setEventId] = useState("");


    const [itemCode, setItemCode] = useState("");
    const [item_Name, setItemName] = useState("");
    const [itemCodeAccoid, setItemCodeAccoid] = useState("");
    const [formDataDetail, setFormDataDetail] = useState({
        Description: "",
        Amount: 0.0,
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
    const [isChecked, setIsChecked] = useState(false);
    const [gstNo, setGstNo] = useState("");

    const location = useLocation();
    const selectedRecord = location.state?.selectedRecord;
    const permissions = location.state?.permissionsData;
    const navigate = useNavigate();
    const [isHandleChange, setIsHandleChange] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef(null)
    const [isOpen, setIsOpen] = useState(false);

    const initialFormData = {
        Doc_No: '',
        Date: new Date().toISOString().split("T")[0],
        Customer_Code: '',
        GstRateCode: '',
        Subtotal: 0.00,
        CGSTRate: 0.00,
        CGSTAmount: 0.00,
        SGSTRate: 0.00,
        SGSTAmount: 0.00,
        IGSTRate: 0.00,
        IGSTAmount: 0.00,
        Total: 0.00,
        Round_Off: 0.00,
        Final_Amount: 0.00,
        IsTDS: 'N',
        TDS_Ac: '',
        TDS_Per: 0.00,
        TDSAmount: 0.00,
        TDS: 0.00,
        Company_Code: companyCode,
        Year_Code: Year_Code,
        Branch_Code: '',
        Created_By: '',
        Modified_By: '',
        billno: '',
        cc: '',
        ta: '',
        TCS_Rate: 0.000,
        TCS_Amt: 0.00,
        TCS_Net_Payable: 0.00,
        einvoiceno: '',
        ackno: '',
        QRCode: '',
        //IsDeleted: 0,
        gstid: '',
        eventCode: '',
        eventId: '',
        Discount_Rate: 0.00,
        Discount_Amount: 0.00,
        Taxable_Amount: 0.00,
    };

    const [formData, setFormData] = useState(initialFormData);
    const [billFrom, setBillFrom] = useState("");
    const [partyMobNo, setPartyMobNo] = useState("");
    const [tdsAc, setTDSAc] = useState("");
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


    const searchParams = new URLSearchParams(location.search);
    const navigatedRecord = searchParams.get('navigatedRecord');

    //Using the useRecordLocking to manage the multiple user cannot edit the same record at a time.
    const { isRecordLockedByUser, lockRecord, unlockRecord } = useRecordLocking(
        formData.Doc_No,
        undefined,
        companyCode,
        Year_Code,
        "service_bill"
    );

    const addButtonRef = useRef(null);
    const firstInputRef = useRef(null);
    const setFocusToFirstField = () => {
        if (firstInputRef.current) {
            firstInputRef.current.focus();
        }
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };



    const handleKeyDownCalculations = async (event) => {
        if (event.key === "Tab") {
            const { name, value } = event.target;
            let gstRate = GstRate;
            if (!gstRate || gstRate === 0) {
                const cgstRate = parseFloat(formData.CGSTRate) || 0;
                const sgstRate = parseFloat(formData.SGSTRate) || 0;
                const igstRate = parseFloat(formData.IGSTRate) || 0;
                gstRate = igstRate > 0 ? igstRate : cgstRate + sgstRate;
            }

            const matchStatus = await checkMatchStatus(
                formData.Customer_Code || partyCode,
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

    useEffect(() => {
        if (isHandleChange) {
            handleCancel();
            setIsHandleChange(false);
        }
    }, []);


    const checkProformaUsage = async (Proformaservicebillno) => {
        try {
            const res = await axios.get(`${API_URL}/check-Proforma-usage`, {
                params: {
                    Doc_No: Proformaservicebillno,
                    Company_Code: companyCode,
                    Proformaid: newSaleid,
                    // Year_Code: Year_Code, // Uncomment if needed
                },
            });

            return res.data?.isUsed ?? false; // Always return a boolean
        } catch (err) {
            console.error("Error checking Proforma usage:", err);
            return false; // Fail-safe
        }
    };


    const fetchLastRecord = () => {
        fetch(
            `${API_URL}/get-next-proformabill-no?Company_Code=${companyCode}&Year_Code=${Year_Code}`
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
        setGstCode('')
        partyName = "";
        partyCode = "";
        millName = "";
        millCode = "";
        unitName = "";
        unitCode = "";
        itemName = "";
        item_Code = "";
        gstrate = "";
        gstRateCode = "";
        gstName = '';
        billToName = "";
        billToCode = "";
        GroupName = "";
        GroupCode = "";
        gstStateCode = '';
        setLastTenderDetails([]);
        setTimeout(() => {
            inputRef.current?.focus();
        }, 0);
    };

    const handleEdit = async () => {
      
        const isUsed = await checkProformaUsage(formData.Doc_No);

        if (isUsed) {
            Swal.fire({
                icon: "error",
                title: "Cannot Edit",
                text: "This Proforma is already used in Service Bill. You cannot edit it.",
                confirmButtonColor: "#d33",
            });
            return;
        }
        // axios
        //     .get(
        //         `${API_URL}/getproformaservicebillByid?Doc_No=${formData.Doc_No}&Company_Code=${companyCode}&Year_Code=${Year_Code}`
        //     )
        //     .then((response) => {
        //         const data = response.data;
        //         const isLockedNew = data.service_bill_head.LockedRecord;
        //         const isLockedByUserNew = data.service_bill_head.LockedUser;

        //         if (isLockedNew) {
        //             Swal.fire({
        //                 icon: "warning",
        //                 title: "Record Locked",
        //                 text: `This record is locked by ${isLockedByUserNew}`,
        //                 confirmButtonColor: "#d33",
        //             });
        //             return;
        //         } else {
        //             lockRecord();
        //         }
        //         setFormData({
        //             ...formData,
        //             ...data.service_bill_head,
        //         });
        await checkProformaUsage(formData.Doc_No);
        setIsEditMode(true);
        setAddOneButtonEnabled(false);
        setSaveButtonEnabled(true);
        setCancelButtonEnabled(true);
        setEditButtonEnabled(false);
        setDeleteButtonEnabled(false);
        setBackButtonEnabled(true);
        setIsEditing(true);
        // })
        // .catch((error) => {
        //     window.alert(
        //         "This record is already deleted! Showing the previous record.",
        //         error
        //     );
        // });
    };

    const handleSaveOrUpdate = async () => {
       
        const accountingYearData = sessionStorage.getItem('Accounting_Year');
        const formattedEntryDate = formData.Date;
        const isValid = validateDocumentDate(formattedEntryDate, accountingYearData);

        if (!isValid) {
            return
        }

        setIsEditing(true);
        setIsLoading(true);
        let head_data = {
            ...formData,
            GstRateCode: gstCode || gstRateCode,
        };

        if (isEditMode) {
            delete head_data.rbid;
            head_data = {
                ...head_data,
                Modified_By: username,
                User_Id: User_Id
            };
        }
        else {
            head_data = {
                ...head_data,
                Created_By: username,
            };
        }
        const detail_data = users.map((user) => ({
            rowaction: user.rowaction,
            rbdid: user.rbdid,
            Item_Code: user.Item_Code,
            Description: user.Description,
            ic: user.ic || itemCodeAccoid,
            Detail_Id: 1,
            Company_Code: companyCode,
            Year_Code: Year_Code,
            Amount: user.Amount,
            Group_Code: user.Group_Code,
            gcid: user.gcid || gcId

        }));

        const requestData = {
            head_data,
            detail_data,
        };

        try {
            if (isEditMode) {
                const updateApiUrl = `${API_URL}/update-proformaservicebill?rbid=${newSaleid}`;
                const response = await axios.put(updateApiUrl, requestData);

                Swal.fire({
                    title: "Success!",
                    text: "Record Updated Successfully!",
                    icon: "success",
                    confirmButtonText: "OK"
                });

                unlockRecord();
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
                navigate(`/Proforma-ServiceBill?navigatedRecord=${formData.Doc_No}`);
            } else {
                const response = await axios.post(
                    `${API_URL}/insert-proformaservicebill`,
                    requestData
                );
                Swal.fire({
                    title: "Success!",
                    text: "Record Created Successfully!",
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
                navigate(`/Proforma-ServiceBill?navigatedRecord=${formData.Doc_No}`);
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
  
        try {

            const isUsed = await checkProformaUsage(formData.Doc_No);

            if (isUsed) {
                Swal.fire({
                    icon: "error",
                    title: "Cannot Delete",
                    text: "This Proforma is already used in Service Bill. You cannot delete it.",
                    confirmButtonColor: "#d33",
                });
                return;
            }
            const response = await axios.get(
                `${API_URL}/getproformaservicebillByid?Doc_No=${formData.Doc_No}&Company_Code=${companyCode}&Year_Code=${Year_Code}`
            );

            const data = response.data;
            const isLockedNew = data.service_bill_head.LockedRecord;
            const isLockedByUserNew = data.service_bill_head.LockedUser;

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
                text: `You won't be able to revert this Doc No : ${formData.Doc_No}`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#d33",
                cancelButtonColor: "#3085d6",
                cancelButtonText: "Cancel",
                confirmButtonText: "Delete",
                reverseButtons: true,
                focusCancel: true,
            });

            await checkProformaUsage(formData.Doc_No);

            if (result.isConfirmed) {
                setIsEditMode(false);
                setAddOneButtonEnabled(true);
                setEditButtonEnabled(true);
                setDeleteButtonEnabled(true);
                setBackButtonEnabled(true);
                setSaveButtonEnabled(false);
                setCancelButtonEnabled(false);
                setIsLoading(true);
                const deleteApiUrl = `${API_URL}/delete_data_by_proformarbid?rbid=${newSaleid}&Company_Code=${companyCode}&Doc_No=${formData.Doc_No}&Year_Code=${Year_Code}&User_Id=${User_Id}`;
                const response = await axios.delete(deleteApiUrl);

                if (response.status === 200) {
                    Swal.fire({
                        title: "Deleted!",
                        text: "Data deleted successfully!",
                        icon: "success",
                        confirmButtonText: "OK",
                    });
                    const docNoNum = parseInt(formData.Doc_No);
                    if (!docNoNum || docNoNum <= 1) {
                        handleAddOne(); 
                    } else {
                        
                        handleCancel();
                    }
            } else {
                console.error(
                    "Failed to delete tender:",
                    response.status,
                    response.statusText
                );
            }
        } else {
            Swal.fire({
                title: "Cancelled",
                text: "Your record is safe 🙂",
                icon: "info",
            });
        }
    }
        catch (error) {
        console.error("Error during API call:", error);
    } finally {
        setIsLoading(false);
    }
};

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
        const response = await axios.get(`${API_URL}/get-lastproformaservicebilldata?Company_Code=${companyCode}&Year_Code=${Year_Code}`);
        if (response.status === 200) {
            const { last_head_data, last_details_data, service_labels } = response.data;
            const detailsArray = Array.isArray(last_details_data) ? last_details_data : [];
            newSaleid = last_head_data.rbid;
            partyName = service_labels[0].partyname;
            partyCode = last_head_data.Customer_Code;
            billToName = service_labels[0].millname;
            billToCode = last_head_data.TDS_Ac;
            gstRateCode = last_head_data.GstRateCode;
            gstName = service_labels[0].GST_Name;
            itemName = service_labels[0].itemname;
            item_Code = last_details_data[0].Item_Code;
            GroupName = service_labels[0].System_Name_E;
            GroupCode = last_details_data[0].Group_Code;
            gstStateCode = service_labels[0].GSTStateCode;
            newEventCode = last_head_data.eventCode;
            lblEventName = service_labels[0].lblEventName;
            const itemNameMap = service_labels.reduce((map, label) => {
                if (label.Item_Code !== undefined && label.itemname) {
                    map[label.Item_Code] = label.itemname;
                }
                return map;
            }, {});

            const groupNameMap = service_labels.reduce((map, label) => {
                if (label.Group_Code !== undefined && label.System_Name_E) {
                    map[label.Group_Code] = label.System_Name_E;
                }
                return map;
            }, {});

            const enrichedDetails = detailsArray.map((detail) => ({
                ...detail,
                itemname: itemNameMap[detail.Item_Code] || "Unknown Item",
                System_Name_E: groupNameMap[detail.Group_Code] || "",
            }));
            setFormData((prevData) => ({
                ...prevData,
                ...last_head_data,
            }));
            setLastTenderData(last_head_data || {});
            setLastTenderDetails(enrichedDetails);
            unlockRecord();
        } else {
            console.error("Failed to fetch last data:", response.status, response.statusText);
        }
    } catch (error) {
        console.error("Error during API call:", error);
    }
};

//Gledger oncliked set records 
const handleNavigateRecord = async () => {
    try {
        const response = await axios.get(
            `${API_URL}/getproformaservicebillByid?Doc_No=${navigatedRecord}&Company_Code=${companyCode}&Year_Code=${Year_Code}`
        );
        const { service_bill_head, service_bill_details, service_labels } = response.data;
        const detailsArray = Array.isArray(service_bill_details) ? service_bill_details : [];
        newSaleid = service_bill_head.rbid;
        partyName = service_labels[0].partyname;
        partyCode = service_bill_head.Customer_Code;
        billToName = service_labels[0].millname;
        billToCode = service_bill_head.TDS_Ac;
        gstRateCode = service_bill_head.GstRateCode;
        gstName = service_labels[0].GST_Name;
        itemName = service_labels[0].itemname;
        item_Code = service_bill_details[0].Item_Code;
        GroupName = service_labels[0].System_Name_E;
        GroupCode = service_bill_details[0].Group_Code;
        gstStateCode = service_labels[0].GSTStateCode;
        newEventCode = service_bill_head.eventCode;
            lblEventName = service_labels[0].lblEventName;
        const itemNameMap = service_labels.reduce((map, label) => {
            if (label.Item_Code !== undefined && label.itemname) {
                map[label.Item_Code] = label.itemname;
            }
            return map;
        }, {});

        const groupNameMap = service_labels.reduce((map, label) => {
            if (label.Group_Code !== undefined && label.System_Name_E) {
                map[label.Group_Code] = label.System_Name_E;
            }
            return map;
        }, {});


        const enrichedDetails = detailsArray.map((detail) => ({
            ...detail,
            itemname: itemNameMap[detail.Item_Code] || "Unknown Item",
            System_Name_E: groupNameMap[detail.Group_Code] || "",
        }));
        setFormData((prevData) => ({
            ...prevData,
            ...service_bill_head,
        }));
        setLastTenderData(service_bill_head || {});
        setLastTenderDetails(enrichedDetails);
        setIsEditing(false);
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


const handleBack = () => {
    navigate("/Proforma-utility");
};

const handleFirstButtonClick = async () => {
    try {
        const response = await axios.get(
            `${API_URL}/get-firstproformaservicebill-navigation?Company_Code=${companyCode}&Year_Code=${Year_Code}`
        );
        if (response.status === 200) {
            const { first_head_data, first_details_data, service_labels } = response.data;

            const detailsArray = Array.isArray(first_details_data) ? first_details_data : [];
            newSaleid = first_head_data.rbid;
            partyName = service_labels[0].partyname;
            partyCode = first_head_data.Customer_Code;
            billToName = service_labels[0].millname;
            billToCode = first_head_data.TDS_Ac;
            gstRateCode = first_head_data.GstRateCode;
            gstName = service_labels[0].GST_Name;
            itemName = service_labels[0].itemname;
            item_Code = first_details_data[0].Item_Code;
            GroupName = service_labels[0].System_Name_E;
            GroupCode = first_details_data[0].Group_Code;
            gstStateCode = service_labels[0].GSTStateCode;
            newEventCode = first_head_data.eventCode;
            lblEventName = service_labels[0].lblEventName;
            
            const itemNameMap = service_labels.reduce((map, label) => {
                if (label.Item_Code !== undefined && label.itemname) {
                    map[label.Item_Code] = label.itemname;
                }
                return map;
            }, {});

            const groupNameMap = service_labels.reduce((map, label) => {
                if (label.Group_Code !== undefined && label.System_Name_E) {
                    map[label.Group_Code] = label.System_Name_E;
                }
                return map;
            }, {});

            const enrichedDetails = detailsArray.map((detail) => ({
                ...detail,
                itemname: itemNameMap[detail.Item_Code] || "Unknown Item",
                System_Name_E: groupNameMap[detail.Group_Code] || "",
            }));

            setFormData((prevData) => ({
                ...prevData,
                ...first_head_data,
            }));
            setLastTenderData(first_head_data || {});
            setLastTenderDetails(enrichedDetails);

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

const handleNextButtonClick = async () => {
    try {
        const response = await axios.get(
            `${API_URL}/get-nextproformaservicebill-navigation?Company_Code=${companyCode}&Year_Code=${Year_Code}&currentDocNo=${formData.Doc_No}`
        );
        if (response.status === 200) {
            const { next_head_data, next_details_data, service_labels } = response.data;
            const detailsArray = Array.isArray(next_details_data) ? next_details_data : [];
            newSaleid = next_head_data.rbid;
            partyName = service_labels[0].partyname;
            partyCode = next_head_data.Customer_Code;
            billToName = service_labels[0].millname;
            billToCode = next_head_data.TDS_Ac;
            gstRateCode = next_head_data.GstRateCode;
            gstName = service_labels[0].GST_Name;
            itemName = service_labels[0].itemname;
            item_Code = next_details_data[0].Item_Code;
            GroupCode = next_details_data?.Group_Code || "";
            GroupName = service_labels[0]?.System_Name_E;
            gstStateCode = service_labels[0].GSTStateCode;
             newEventCode = next_head_data.eventCode;
            lblEventName = service_labels[0].lblEventName;
            const itemNameMap = service_labels.reduce((map, label) => {
                if (label.Item_Code !== undefined && label.itemname) {
                    map[label.Item_Code] = label.itemname;
                }
                return map;
            }, {});

            const groupNameMap = service_labels.reduce((map, label) => {
                if (label.Group_Code !== undefined && label.System_Name_E) {
                    map[label.Group_Code] = label.System_Name_E;
                }
                return map;
            }, {});


            const enrichedDetails = detailsArray.map((detail) => ({
                ...detail,
                itemname: itemNameMap[detail.Item_Code] || "Unknown Item",
                System_Name_E: groupNameMap[detail.Group_Code] || "",
            }));

            setFormData((prevData) => ({
                ...prevData,
                ...next_head_data,
            }));
            setLastTenderData(next_head_data || {});
            setLastTenderDetails(enrichedDetails);

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
            `${API_URL}/get-proformapreviousservicebill-navigation?Company_Code=${companyCode}&Year_Code=${Year_Code}&currentDocNo=${formData.Doc_No}`
        );

        if (response.status === 200) {
            const { previous_head_data, previous_details_data, service_labels } = response.data;

            const detailsArray = Array.isArray(previous_details_data) ? previous_details_data : [];
            newSaleid = previous_head_data.rbid;
            partyName = service_labels[0].partyname;
            partyCode = previous_head_data.Customer_Code;
            billToName = service_labels[0].millname;
            billToCode = previous_head_data.TDS_Ac;
            gstRateCode = previous_head_data.GstRateCode;
            gstName = service_labels[0].GST_Name;
            itemName = service_labels[0].itemname;
            item_Code = previous_details_data[0].Item_Code;
            GroupName = service_labels[0].System_Name_E;
            GroupCode = previous_details_data[0].Group_Code;
            gstStateCode = service_labels[0].GSTStateCode;
             newEventCode = previous_head_data.eventCode;
            lblEventName = service_labels[0].lblEventName;
            const itemNameMap = service_labels.reduce((map, label) => {
                if (label.Item_Code !== undefined && label.itemname) {
                    map[label.Item_Code] = label.itemname;
                }
                return map;
            }, {});

            const groupNameMap = service_labels.reduce((map, label) => {
                if (label.Group_Code !== undefined && label.System_Name_E) {
                    map[label.Group_Code] = label.System_Name_E;
                }
                return map;
            }, {});


            const enrichedDetails = detailsArray.map((detail) => ({
                ...detail,
                itemname: itemNameMap[detail.Item_Code] || "Unknown Item",
                System_Name_E: groupNameMap[detail.Group_Code] || "",
            }));
            setFormData((prevData) => ({
                ...prevData,
                ...previous_head_data,
            }));
            setLastTenderData(previous_head_data || {});
            setLastTenderDetails(enrichedDetails);

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
    } else if (navigatedRecord) {
        handleNavigateRecord();
    } else {
        handleAddOne();
    }
    const customerCodeElement = document.getElementById("Customer_Code");
    if (customerCodeElement) {
        customerCodeElement.focus();
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
            `${API_URL}/getproformaservicebillByid?Doc_No=${selectedRecord.Doc_No}&Company_Code=${companyCode}&Year_Code=${Year_Code}`
        );
        if (response.status === 200) {
            const { service_bill_head, service_bill_details, service_labels } = response.data;
            const detailsArray = Array.isArray(service_bill_details) ? service_bill_details : [];
            newSaleid = service_bill_head.rbid;
            partyName = service_labels[0].partyname;
            partyCode = service_bill_head.Customer_Code;
            billToName = service_labels[0].millname;
            billToCode = service_bill_head.TDS_Ac;
            gstRateCode = service_bill_head.GstRateCode;
            gstName = service_labels[0].GST_Name;
            itemName = service_labels[0].itemname;
            item_Code = service_bill_details[0].Item_Code;
            GroupName = service_labels[0].System_Name_E;
            GroupCode = service_bill_details[0].Group_Code;
            gstStateCode = service_labels[0].GSTStateCode;
              newEventCode = service_bill_head.eventCode;
            lblEventName = service_labels[0].lblEventName;
            const itemNameMap = service_labels.reduce((map, label) => {
                if (label.Item_Code !== undefined && label.itemname) {
                    map[label.Item_Code] = label.itemname;
                }
                return map;
            }, {});

            const groupNameMap = service_labels.reduce((map, label) => {
                if (label.Group_Code !== undefined && label.System_Name_E) {
                    map[label.Group_Code] = label.System_Name_E;
                }
                return map;
            }, {});


            const enrichedDetails = detailsArray.map((detail) => ({
                ...detail,
                itemname: itemNameMap[detail.Item_Code] || "Unknown Item",
                System_Name_E: groupNameMap[detail.Group_Code] || "",
            }));
            setFormData((prevData) => ({
                ...prevData,
                ...service_bill_head,
            }));
            setLastTenderData(service_bill_head || {});
            setLastTenderDetails(enrichedDetails);

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
                `${API_URL}/getproformaservicebillByid?Doc_No=${changeNoValue}&Company_Code=${companyCode}&Year_Code=${Year_Code}`
            );
            const { service_bill_head, service_bill_details, service_labels } = response.data;
            const detailsArray = Array.isArray(service_bill_details) ? service_bill_details : [];
            newSaleid = service_bill_head.rbid;
            partyName = service_labels[0].partyname;
            partyCode = service_bill_head.Customer_Code;
            billToName = service_labels[0].millname;
            billToCode = service_bill_head.TDS_Ac;
            gstRateCode = service_bill_head.GstRateCode;
            gstName = service_labels[0].GST_Name;
            itemName = service_labels[0].itemname;
            item_Code = service_bill_details[0].Item_Code;
            GroupName = service_labels[0].System_Name_E;
            GroupCode = service_bill_details[0].Group_Code;
            gstStateCode = service_labels[0].GSTStateCode;
             newEventCode = service_bill_head.eventCode;
            lblEventName = service_labels[0].lblEventName;
            const itemNameMap = service_labels.reduce((map, label) => {
                if (label.Item_Code !== undefined && label.itemname) {
                    map[label.Item_Code] = label.itemname;
                }
                return map;
            }, {});

            const groupNameMap = service_labels.reduce((map, label) => {
                if (label.Group_Code !== undefined && label.System_Name_E) {
                    map[label.Group_Code] = label.System_Name_E;
                }
                return map;
            }, {});


            const enrichedDetails = detailsArray.map((detail) => ({
                ...detail,
                itemname: itemNameMap[detail.Item_Code] || "Unknown Item",
                System_Name_E: groupNameMap[detail.Group_Code] || "",
            }));
            setFormData((prevData) => ({
                ...prevData,
                ...service_bill_head,
            }));
            setLastTenderData(service_bill_head || {});
            setLastTenderDetails(enrichedDetails);
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
        toast.error("Error while fetching company GST No.");
        console.error("Error:", error);
        setGstNo("");
    }
};

const calculateTotalItemAmount = (users) => {
    return users
        .filter((user) => user.rowaction !== "delete" && user.rowaction !== "DNU")
        .reduce((sum, user) => sum + parseFloat(user.Amount || 0), 0);
};



const calculateDependentValues = async (
    name,
    input,
    formData,
    matchStatus,
    gstRate
) => {
    const updatedFormData = { ...formData, [name]: input };
    const subtotal = parseFloat(updatedFormData.Subtotal) || 0.0;
    const rate = gstRate;

    // ── Discount calculation ──
    const discountRate   = parseFloat(updatedFormData.Discount_Rate)   || 0.0;
    const discountAmount = parseFloat(updatedFormData.Discount_Amount) || 0.0;

    if (name === "Discount_Rate") {
        // Rate changed → recalculate amount
        updatedFormData.Discount_Amount = ((subtotal * parseFloat(input)) / 100).toFixed(2);
    } else if (name === "Discount_Amount") {
        // Amount changed → recalculate rate
        updatedFormData.Discount_Rate = subtotal > 0
            ? ((parseFloat(input) / subtotal) * 100).toFixed(2)
            : "0.00";
    } else {
        // Subtotal changed → recalculate amount from existing rate
        updatedFormData.Discount_Amount = ((subtotal * discountRate) / 100).toFixed(2);
    }

    // Taxable amount = Subtotal minus Discount
    const taxableAmount = subtotal - parseFloat(updatedFormData.Discount_Amount || 0);
    updatedFormData.Taxable_Amount = taxableAmount.toFixed(2);

    if (matchStatus === "TRUE") {
        updatedFormData.CGSTRate = (rate / 2).toFixed(2);
        updatedFormData.SGSTRate = (rate / 2).toFixed(2);
        updatedFormData.IGSTRate = 0.0;

        updatedFormData.CGSTAmount = ((taxableAmount * updatedFormData.CGSTRate) / 100).toFixed(2);
        updatedFormData.SGSTAmount = ((taxableAmount * updatedFormData.SGSTRate) / 100).toFixed(2);
        updatedFormData.IGSTAmount = 0.0;
    } else {
        updatedFormData.IGSTRate = rate.toFixed(2);
        updatedFormData.CGSTRate = 0.0;
        updatedFormData.SGSTRate = 0.0;

        updatedFormData.IGSTAmount = ((taxableAmount * updatedFormData.IGSTRate) / 100).toFixed(2);
        updatedFormData.CGSTAmount = 0.0;
        updatedFormData.SGSTAmount = 0.0;
    }

    const RoundOff = parseFloat(updatedFormData.Round_Off) || 0.0;
    updatedFormData.Total = (
        taxableAmount +
        parseFloat(updatedFormData.CGSTAmount) +
        parseFloat(updatedFormData.SGSTAmount) +
        parseFloat(updatedFormData.IGSTAmount)
    ).toFixed(2);

    updatedFormData.Final_Amount = (parseFloat(updatedFormData.Total) + RoundOff).toFixed(2);

    const tcsRate = parseFloat(updatedFormData.TCS_Rate) || 0.0;
    updatedFormData.TCS_Amt = ((updatedFormData.Final_Amount * tcsRate) / 100).toFixed(2);
    updatedFormData.TCS_Net_Payable = (
        parseFloat(updatedFormData.Final_Amount) +
        parseFloat(updatedFormData.TCS_Amt)
    ).toFixed(2);

    const tdsRate = parseFloat(updatedFormData.TDS_Per) || 0.0;
    updatedFormData.TDS = ((updatedFormData.TDSAmount * tdsRate) / 100).toFixed(2);

    return updatedFormData;
};

// const calculateDependentValues = async (
//     name,
//     input,
//     formData,
//     matchStatus,
//     gstRate
// ) => {
//     const updatedFormData = { ...formData, [name]: input };
//     const subtotal = parseFloat(updatedFormData.Subtotal) || 0.0;
//     const rate = gstRate;
//     if (matchStatus === "TRUE") {
//         updatedFormData.CGSTRate = (rate / 2).toFixed(2);
//         updatedFormData.SGSTRate = (rate / 2).toFixed(2);
//         updatedFormData.IGSTRate = 0.0;

//         updatedFormData.CGSTAmount = (
//             (updatedFormData.Subtotal * updatedFormData.CGSTRate) /
//             100
//         ).toFixed(2);
//         updatedFormData.SGSTAmount = (
//             (updatedFormData.Subtotal * updatedFormData.SGSTRate) /
//             100
//         ).toFixed(2);
//         updatedFormData.IGSTAmount = 0.0;
//     } else {
//         updatedFormData.IGSTRate = rate.toFixed(2);
//         updatedFormData.CGSTRate = 0.0;
//         updatedFormData.SGSTRate = 0.0;

//         updatedFormData.IGSTAmount = (
//             (updatedFormData.Subtotal * updatedFormData.IGSTRate) /
//             100
//         ).toFixed(2);
//         updatedFormData.CGSTAmount = 0.0;
//         updatedFormData.SGSTAmount = 0.0;
//     }

//     const RoundOff = parseFloat(updatedFormData.Round_Off) || 0.0;
//     updatedFormData.Total = (
//         parseFloat(updatedFormData.Subtotal) +
//         parseFloat(updatedFormData.CGSTAmount) +
//         parseFloat(updatedFormData.SGSTAmount) +
//         parseFloat(updatedFormData.IGSTAmount)
//     ).toFixed(2);

//     updatedFormData.Final_Amount = (parseFloat(updatedFormData.Total) + RoundOff).toFixed(2)

//     const tcsRate = parseFloat(updatedFormData.TCS_Rate) || 0.0;
//     updatedFormData.TCS_Amt = (
//         (updatedFormData.Final_Amount * tcsRate) /
//         100
//     ).toFixed(2);
//     updatedFormData.TCS_Net_Payable = (
//         parseFloat(updatedFormData.Final_Amount) +
//         parseFloat(updatedFormData.TCS_Amt)
//     ).toFixed(2);

//     const tdsRate = parseFloat(updatedFormData.TDS_Per) || 0.0;
//     updatedFormData.TDS = (
//         (updatedFormData.TDSAmount * tdsRate) /
//         100
//     ).toFixed(2);

//     return updatedFormData;
// };

useEffect(() => {
    if (selectedRecord) {
        setUsers(
            lastTenderDetails.map((detail) => ({
                Item_Code: detail.Item_Code,
                item_Name: detail.item_Name,
                rowaction: "Normal",
                ic: detail.ic,
                id: detail.rbdid,
                rbdid: detail.rbdid,
                Description: detail.Description,
                Amount: detail.Amount,
                Detail_Id: detail.Detail_Id,
                Group_Code: detail.Group_Code,
                groupName: detail.groupName,
                gcid: detail.gcid
            }))
        );
    }
}, [selectedRecord, lastTenderDetails]);

useEffect(() => {
    const updatedUsers = lastTenderDetails.map((detail) => ({
        Item_Code: detail.Item_Code,
        item_Name: detail.itemname,
        rowaction: "Normal",
        ic: detail.ic,
        id: detail.rbdid,
        rbdid: detail.rbdid,
        Description: detail.Description,
        Amount: detail.Amount,
        Detail_Id: detail.Detail_Id,
        Group_Code: detail.Group_Code,
        groupName: detail.System_Name_E,
        gcid: detail.gcid
    }));
    setUsers(updatedUsers);
}, [lastTenderDetails]);

const handleChangeDetail = (event) => {
    const { name, value } = event.target;
    setFormDataDetail((prevDetail) => {
        const updatedDetail = {
            ...prevDetail,
            [name]:
                value
        };
        return updatedDetail;
    });
};

const addUser = async () => {
    setTimeout(() => {
        addButtonRef.current.focus();
    }, 500)
    const newUser = {
        id: users.length > 0 ? Math.max(...users.map((user) => user.id)) + 1 : 1,
        Item_Code: itemCode,
        item_Name: item_Name,
        ic: itemCodeAccoid,
        Group_Code: groupCode,
        gcid: gcId,
        groupName: groupName,
        ...formDataDetail,
        rowaction: "add",
    };

    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    const subtotal = calculateTotalItemAmount(updatedUsers);
    let updatedFormData = {
        ...formData,
        Subtotal: subtotal,
        TDSAmount: subtotal
    };

    const matchStatus = await checkMatchStatus(
        updatedFormData.Customer_Code,
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
    setTimeout(() => {
        addButtonRef.current.focus();
    }, 500)
    const updatedUsers = users.map((user) => {
        if (user.id === selectedUser.id) {
            const updatedRowaction =
                user.rowaction === "Normal" ? "update" : user.rowaction;
            return {
                ...user,
                Item_Code: itemCode,
                item_Name: item_Name,
                ic: itemCodeAccoid,
                Group_Code: groupCode,
                gcid: gcId,
                groupName: groupName,
                Description: formDataDetail.Description,
                Amount: formDataDetail.Amount,
                rowaction: updatedRowaction,
            };
        } else {
            return user;
        }
    });

    setUsers(updatedUsers);
    const subtotal = calculateTotalItemAmount(updatedUsers);

    let updatedFormData = {
        ...formData,

        Subtotal: subtotal,
        TDSAmount: subtotal
    };
    const matchStatus = await checkMatchStatus(
        updatedFormData.Customer_Code,
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
    const subtotal = calculateTotalItemAmount(updatedUsers);
    let updatedFormData = {
        ...formData,
        Subtotal: subtotal,
        TDSAmount: subtotal
    };

    const matchStatus = await checkMatchStatus(
        updatedFormData.Customer_Code,
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

    const subtotal = calculateTotalItemAmount(updatedUsers);
    let updatedFormData = {
        ...formData,

        Subtotal: subtotal,
        TDSAmount: subtotal
    };
    const matchStatus = await checkMatchStatus(
        updatedFormData.Customer_Code,
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
        Description: "",
        Amount: 0.0
    });
    setItemCode("");
    setItemName("");
    setGroupCode("");
    setGroupName('');
};

const editUser = (user) => {
    setSelectedUser(user);
    setItemCode(user.Item_Code);
    setItemName(user.item_Name);
    setGroupCode(user.Group_Code);
    setGroupName(user.groupName);
    setFormDataDetail({
        Description: user.Description,
        Amount: user.Amount
    });
    openPopup("edit");
};

const handleItemCode = (code, accoid, hsn, name) => {
    setItemCode(code);
    setItemName(name);
    setItemCodeAccoid(accoid);
};

const handleGroupCode = (code, accoid, HSN, name) => {
    setGroupCode(code);
    setGCID(accoid);
    setGroupName(name)
};

const handleBillFrom = async (code, accoid, name, mobileNo, gstNo, TDSApplicable, GstStateCode) => {
    gstStateCode = GstStateCode;
    setBillFrom(code);
    setPartyMobNo(mobileNo);
    let updatedFormData = {
        ...formData,
        Customer_Code: code,
        cc: accoid,
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
        setFormData(updatedFormData);
    } catch (error) {
        console.error("Error in handleBillFrom:", error);
    }
};



const handleTDSAc = (code, accoid) => {
  
    console.log("handleTDSAc",code ,accoid)
    setTDSAc(code);
    setFormData({
        ...formData,
        TDS_Ac: code,
        ta: accoid,
    });
};

const handleGstCode = async (code, Rate, name, accoid) => {
    setGstCode(code);
    let rate = parseFloat(Rate);
    setFormData({
        ...formData,
        GstRateCode: code,
        gstid: accoid
    });
    setGstRate(rate);
    const updatedFormData = {
        ...formData,
        GstRateCode: code,
        gstid: accoid
    };
    try {
        const matchStatusResult = await checkMatchStatus(
            updatedFormData.Customer_Code,
            companyCode,
            Year_Code
        );
        setMatchStatus(matchStatusResult);
        const newFormData = await calculateDependentValues(
            "GstRateCode",
            rate,
            updatedFormData,
            matchStatusResult,
            rate
        );
        setFormData(newFormData);
    } catch (error) { }
};

const handleEventCode = (code, accoid, name) => {
    setEventCode(code);
    setEventId(accoid);
    setFormData({
      ...formData,
      eventCode: code,
      eventId: accoid,
    });
  };

//Validation Checks
const validateNumericInput = (e) => {
    e.target.value = e.target.value.replace(/[^0-9.]/g, '');
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
            title={"Proforma Service Bill"}
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
            permissions={permissions}
            component={<div style={{ display: 'flex' }} >

                <ProformaServiceBillReportPrint docNo={formData.Doc_No} companyCode={companyCode} yearCode={Year_Code}
                    disabledFeild={!addOneButtonEnabled} />
                <ProformaServiceBillReportSEIC docNo={formData.Doc_No} companyCode={companyCode} yearCode={Year_Code}
              disabledFeild={!(Company_Name?.substring(0, 2).toUpperCase() === "JK" && addOneButtonEnabled)}/> 

                {/* <div style={{ marginRight: '100%' }}>
              <Button
                variant="contained"
                color="success"
                onClick={() => handleGenerate()}
                disabled={isEditing || formData.einvoiceno !== ""}
                style={{ whiteSpace: 'nowrap' }}
              >
                Generate eInvoice
              </Button>
            </div> */}
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
                            doc_no={formData.Doc_No}
                            do_no={0}
                            tran_type="RB"
                            handleClose={handleClose}
                            Company_Code={companyCode}
                            Year_Code={Year_Code}
                        />
                    </DialogContent>
                </Dialog>
            </div>
            }
        />
        <NavigationButtons
            handleFirstButtonClick={handleFirstButtonClick}
            handlePreviousButtonClick={handlePreviousButtonClick}
            handleNextButtonClick={handleNextButtonClick}
            handleLastButtonClick={handleCancel}
            highlightedButton={highlightedButton}
            isEditing={isEditing}
        />


        <form onSubmit={handleSubmit}>
            <Grid container spacing={2} mt={1} className="ServiceBill-row">
                <Grid item xs={12} sm={1}>
                    <TextField
                        label="Change No"
                        name="changeNo"
                        variant="outlined"
                        fullWidth
                        onKeyDown={handleKeyDown}
                        disabled={!addOneButtonEnabled}
                        autoComplete="off"
                        size="small"
                    />
                </Grid>
                <Grid item xs={12} sm={1}>
                    <TextField
                        label="Bill No"
                        name="Doc_No"
                        variant="outlined"
                        fullWidth
                        value={formData.Doc_No}
                        onChange={handleChange}
                        disabled
                        size="small"
                    />
                </Grid>
                <Grid item xs={12} sm={1}>
                    <TextField
                        label="Bill Date"
                        type="date"
                        name="Date"
                        variant="outlined"
                        fullWidth
                        InputLabelProps={{
                            style: { fontSize: '12px' },
                        }}
                        InputProps={{
                            style: { fontSize: '12px', height: '40px' },
                        }}
                        inputRef={inputRef}
                        value={formData.Date}
                        onChange={handleChange}
                        disabled={!isEditing && addOneButtonEnabled}
                        size="small"
                    />
                </Grid>
            </Grid>
            <br></br>
            <div className="ServiceBill-row">
                <label htmlFor="Customer_Code" className="ServiceBill-form-otherlabels">
                    Customer:
                </label>
                <div className="ServiceBill-col">
                    <div className="ServiceBill-form-group">
                        <AccountMasterHelp
                            onAcCodeClick={handleBillFrom}
                            CategoryName={partyName}
                            CategoryCode={partyCode}
                            name="Customer_Code"
                            Ac_type={[]}
                            disabledFeild={!isEditing && addOneButtonEnabled}
                        />
                    </div>
                </div>
                <Grid item xs={1} ml={1}>
                    <TextField
                        label="State Code"
                        name="state"
                        autoComplete="off"
                        variant="outlined"
                        fullWidth
                        value={gstStateCode}
                        disabled={!isEditing && addOneButtonEnabled}
                        size="small"
                    />
                </Grid>
            </div>
            <div className="ServiceBill-row">
                <Grid container spacing={2} className="ServiceBill-row">

                    <label htmlFor="GstRateCode" className="ServiceBill-form-otherlabels " style={{ marginTop: "20px", marginLeft: "25px" }} >
                        GST Rate :
                    </label>
                    <div className="ServiceBill-col" style={{ marginTop: "25px" }}>
                        <div className="ServiceBill-form-group">
                            <GSTRateMasterHelp
                                onAcCodeClick={handleGstCode}
                                GstRateName={gstName}
                                GstRateCode={gstRateCode}
                                name="GstRateCode"
                                disabledFeild={!isEditing && addOneButtonEnabled}
                            />
                        </div>
                    </div>

                    <Grid item xs={12} sm={1} mt={1} ml={-1}>
                        <TextField
                            label="Bill No"
                            name="billno"
                            variant="outlined"
                            fullWidth
                            value={formData.billno}
                            onChange={handleChange}
                            disabled={!isEditing && addOneButtonEnabled}
                            autoComplete="off"
                            size="small"
                        />
                    </Grid>
                     <label htmlFor="GstRateCode" className="ServiceBill-form-otherlabels " style={{ marginTop: "20px", marginLeft: "25px" }} >
                        Event Code:
                    </label>
                    <div className="ServiceBill-col" style={{ marginTop: "25px" }}>
                        <div className="ServiceBill-form-group">
                             <ItemMasterHelp
                        onAcCodeClick={handleEventCode}
                        CategoryName={lblEventName}
                        CategoryCode={newEventCode}
                        name="eventCode"
                        SystemType="E"
                        className="account-master-help"
                        disabledField={!isEditing && addOneButtonEnabled}
                      />
                        </div>
                    </div>
                </Grid>
            </div>

            {isLoading && (
                <div className="loading-overlay">
                    <div className="spinner-container">
                        <SaveUpdateSpinner />
                    </div>
                </div>
            )}

            <div className="">
                {showPopup && (
                    <div className="ServiceBillModel">
                        <div className="ServiceBillModel-dialog" role="document">
                            <div className="ServiceBillModel-body">
                                <div className="ServiceBillModel-header">
                                    <h5 className="ServiceBillModel-title" style={{ marginBottom: "-20px" }}>
                                        {selectedUser.id ? "Update Service Bill" : "Add Service Bill"}
                                    </h5>
                                    <button
                                        type="button"
                                        onClick={closePopup}
                                        aria-label="Close"
                                        style={{
                                            marginLeft: "90%",
                                            width: "40px",
                                            height: "40px",
                                            borderRadius: "4%",
                                            marginTop: "-80px",
                                        }}
                                    >
                                        <span aria-hidden="true">&times;</span>
                                    </button>
                                </div>
                                <div >
                                    <form>
                                        <div className="ServiceBill-form-group" style={{ marginLeft: "15px" }}>
                                            <label className="ServiceBill-form-otherlabels">Item Code:</label>
                                            <ItemMasterHelp
                                                onAcCodeClick={handleItemCode}
                                                CategoryName={item_Name}
                                                CategoryCode={itemCode}
                                                SystemType="I"
                                                name="Item_Code"
                                                firstInputRef={firstInputRef}
                                            />
                                        </div>

                                        <div className="ServiceBill-form-group">
                                            <label className="ServiceBill-form-otherlabels">Group Code:</label>
                                            <GroupMasterHelp
                                                onAcCodeClick={handleGroupCode}
                                                CategoryName={groupName}
                                                CategoryCode={groupCode}
                                                SystemType="C"
                                                name="Group_Code"
                                                //tabIndexHelp={6}
                                                disabledField={!isEditing && addOneButtonEnabled}
                                            />
                                        </div>

                                        <div className="ServiceBill-form-group" style={{ marginLeft: "12px" }}>
                                            <label className="ServiceBill-form-otherlabels">Description:</label>
                                            <input
                                                type="text"
                                                className="ServiceBill-form-control"
                                                name="Description"
                                                autoComplete="off"
                                                value={formDataDetail.Description}
                                                onChange={handleChangeDetail}
                                            />
                                        </div>

                                        <div className="ServiceBill-form-group" style={{ marginLeft: "37px" }}>
                                            <label className="ServiceBill-form-otherlabels">Amount:</label>
                                            <input
                                                type="text"
                                                className="ServiceBill-form-control"
                                                name="Amount"
                                                autoComplete="off"
                                                value={formDataDetail.Amount}
                                                onChange={(e) => {
                                                    validateNumericInput(e);
                                                    handleChangeDetail(e);
                                                }}
                                            />
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

                <div style={{ marginTop: "10px" }}>
                    <AddButton openPopup={openPopup} isEditing={isEditing} ref={addButtonRef} setFocusToFirstField={setFocusToFirstField} />
                </div>
                <div style={{ display: "flex" }}>
                    <div style={{ width: "80%", paddingRight: "10px" }}>
                        <TableContainer component={Paper} style={{ marginTop: '16px', width: '90%', marginBottom: "20px" }}>
                            <Table sx={{ minWidth: 650 }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={headerCellStyle}>Actions</TableCell>
                                        <TableCell sx={headerCellStyle}>Item</TableCell>
                                        <TableCell sx={headerCellStyle}>Item Name</TableCell>
                                        <TableCell sx={headerCellStyle} style={{ whiteSpace: "nowrap" }}>Group Code</TableCell>
                                        <TableCell sx={headerCellStyle}>Group Name</TableCell>
                                        <TableCell sx={headerCellStyle}>Description</TableCell>
                                        <TableCell sx={headerCellStyle}>Amount</TableCell>
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
                                            <TableCell sx={{ padding: '4px 8px', display: "flex" }}>
                                                {user.rowaction === 'add' || user.rowaction === 'update' || user.rowaction === 'Normal' ? (
                                                    <>
                                                        <EditButton editUser={editUser} user={user} isEditing={isEditing} />
                                                        <DeleteButton deleteModeHandler={deleteModeHandler} user={user} isEditing={isEditing} />
                                                    </>
                                                ) : user.rowaction === 'DNU' || user.rowaction === 'delete' ? (
                                                    <OpenButton openDelete={openDelete} user={user} />
                                                ) : null}
                                            </TableCell>
                                            <TableCell>{user.Item_Code}</TableCell>
                                            <TableCell>{user.item_Name || user.itemname}</TableCell>
                                            <TableCell>{user.Group_Code}</TableCell>
                                            <TableCell>{user.groupName || user.System_Name_E}</TableCell>
                                            <TableCell>{user.Description}</TableCell>
                                            <TableCell>{formatReadableAmount(user.Amount)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <div className="ServiceBill-row">
                            <div className="ServiceBill-row">
                                <label htmlFor="IsTDS" className="ServiceBill-form-otherlabels ">Is TDS Applicable</label>
                                <div className="ServiceBill-form-group-type">
                                    <select
                                        id="IsTDS"
                                        name="IsTDS"
                                        className="ServiceBill-custom-select"
                                        value={formData.IsTDS}
                                        onChange={handleChange}
                                    >
                                        <option value="Y">Yes</option>
                                        <option value="N">No</option>
                                    </select>
                                </div>
                                <label htmlFor="TDS_Ac" className="ServiceBill-form-otherlabels">TDS A/C:</label>
                                <div className="ServiceBill-form-group">
                                    <AccountMasterHelp
                                        onAcCodeClick={handleTDSAc}
                                        CategoryName={billToName}
                                        CategoryCode={billToCode}
                                        name="TDS_Ac"
                                        Ac_type={[]}
                                        disabledFeild={!isEditing && addOneButtonEnabled}
                                    />
                                </div>
                            </div>
                        </div>
                        <br></br>
                        <div className="ServiceBill-row">
                            <Grid container spacing={1} alignItems="center" style={{ marginTop: '5px', marginBottom: "10px" }} >
                                <Grid item xs={12} sm={2}>
                                    <TextField
                                        variant="outlined"
                                        name="TDS_Per"
                                        label="TDS %"
                                        autoComplete="off"
                                        value={formData.TDS_Per}
                                        onChange={handleChange}
                                        onKeyDown={handleKeyDownCalculations}
                                        disabled={!isEditing && addOneButtonEnabled}
                                        fullWidth
                                        InputLabelProps={{ shrink: true }}
                                        error={!!formErrors.TDS_Per}
                                        helperText={formErrors.TDS_Per}
                                        size="small"
                                        inputProps={{
                                            sx: { textAlign: 'right' },
                                            inputMode: 'decimal',
                                            pattern: '[0-9]*[.,]?[0-9]+',
                                            onInput: validateNumericInput,
                                        }}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={2}>
                                    <TextField
                                        variant="outlined"
                                        name="TDS"
                                        label="TDS Amount"
                                        autoComplete="off"
                                        value={formData.TDS}
                                        onChange={handleChange}
                                        onKeyDown={handleKeyDownCalculations}
                                        disabled={!isEditing && addOneButtonEnabled}
                                        fullWidth
                                        InputLabelProps={{ shrink: true }}
                                        error={!!formErrors.TDS}
                                        helperText={formErrors.TDS}
                                        size="small"
                                        inputProps={{
                                            sx: { textAlign: 'right' },
                                            inputMode: 'decimal',
                                            pattern: '[0-9]*[.,]?[0-9]+',
                                            onInput: validateNumericInput,
                                        }}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={2}>
                                    <TextField
                                        variant="outlined"
                                        name="TDSAmount"
                                        label="TDS Applicable Amount"
                                        autoComplete="off"
                                        value={formData.TDSAmount}
                                        onChange={handleChange}
                                        onKeyDown={handleKeyDownCalculations}
                                        disabled={!isEditing && addOneButtonEnabled}
                                        fullWidth
                                        InputLabelProps={{ shrink: true }}
                                        error={!!formErrors.TDSAmount}
                                        helperText={formErrors.TDSAmount}
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

                            <Grid container spacing={2} alignItems="center">
                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        label="EInvoice"
                                        variant="outlined"
                                        name="einvoiceno"
                                        autoComplete="off"
                                        value={formData.einvoiceno}
                                        onChange={handleChange}
                                        disabled={!isEditing && addOneButtonEnabled}
                                        fullWidth
                                        InputLabelProps={{
                                            shrink: true,
                                        }}
                                        error={!!formErrors.einvoiceno}
                                        helperText={formErrors.einvoiceno}
                                        size="small"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={2}>
                                    <TextField
                                        label="ACK No"
                                        variant="outlined"
                                        name="ackno"
                                        autoComplete="off"
                                        value={formData.ackno}
                                        onChange={handleChange}
                                        disabled={!isEditing && addOneButtonEnabled}
                                        fullWidth
                                        InputLabelProps={{
                                            shrink: true,
                                        }}
                                        error={!!formErrors.ackno}
                                        helperText={formErrors.ackno}
                                        size="small"
                                    />
                                </Grid>
                            </Grid>

                        </div>
                    </div>
                    <div style={{ width: "20%" }}>
                        <div>
                            <Grid container spacing={0.5} alignItems="center" sx={{ textAlign: 'left' }}>
                                {/* Subtotal Row */}
                                <Grid item xs={12} sm={4}>
                                    <label className="ServiceBill-form-label">Subtotal :</label>
                                </Grid>
                                <Grid item xs={12} sm={8}>
                                    <TextField
                                        variant="outlined"
                                        name="Subtotal"
                                        autoComplete="off"
                                        value={formData.Subtotal}
                                        disabled={!isEditing && addOneButtonEnabled}
                                        fullWidth
                                        InputLabelProps={{ shrink: true }}
                                        error={!!formErrors.Subtotal}
                                        helperText={formErrors.Subtotal}
                                        size="small"
                                        inputProps={{
                                            sx: { textAlign: 'right' },
                                            inputMode: 'decimal',
                                            pattern: '[0-9]*[.,]?[0-9]+',
                                            onInput: validateNumericInput,
                                        }}
                                    />
                                </Grid>


                                 {/* <Grid item xs={12} sm={4}>
                                    <label className="ServiceBill-form-label">Discount % :</label>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        variant="outlined"
                                        name="Discount_Rate"
                                        autoComplete="off"
                                        value={formData.Discount_Rate}
                                        onChange={handleChange}
                                        onKeyDown={handleKeyDownCalculations}
                                        disabled={!isEditing && addOneButtonEnabled}
                                        fullWidth
                                        InputLabelProps={{ shrink: true }}
                                        error={!!formErrors.Discount_Rate}
                                        helperText={formErrors.Discount_Rate}
                                        size="small"
                                        inputProps={{
                                            sx: { textAlign: 'right' },
                                            inputMode: 'decimal',
                                            pattern: '[0-9]*[.,]?[0-9]+',
                                            onInput: validateNumericInput,
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        variant="outlined"
                                        name="Discount_Amount"
                                        autoComplete="off"
                                        value={formData.Discount_Amount}
                                        onChange={handleChange}
                                        onKeyDown={handleKeyDownCalculations}
                                        disabled={!isEditing && addOneButtonEnabled}
                                        fullWidth
                                        InputLabelProps={{ shrink: true }}
                                        error={!!formErrors.Discount_Amount}
                                        helperText={formErrors.Discount_Amount}
                                        size="small"
                                        inputProps={{
                                            sx: { textAlign: 'right' },
                                            inputMode: 'decimal',
                                            pattern: '[0-9]*[.,]?[0-9]+',
                                            onInput: validateNumericInput,
                                        }}
                                    />
                                </Grid> */}



                                {/* Discount Row */}
<Grid item xs={12} sm={4}>
    <label className="ServiceBill-form-label">Discount % :</label>
</Grid>
<Grid item xs={12} sm={4}>
    <TextField
        variant="outlined"
        name="Discount_Rate"
        autoComplete="off"
        value={formData.Discount_Rate}
        onChange={handleChange}
        onKeyDown={handleKeyDownCalculations}
        disabled={!isEditing && addOneButtonEnabled}
        fullWidth
        InputLabelProps={{ shrink: true }}
        size="small"
        inputProps={{
            sx: { textAlign: 'right' },
            inputMode: 'decimal',
            pattern: '[0-9]*[.,]?[0-9]+',
            onInput: validateNumericInput,
        }}
    />
</Grid>
<Grid item xs={12} sm={4}>
    <TextField
        variant="outlined"
        name="Discount_Amount"
        autoComplete="off"
        value={formData.Discount_Amount}
        onChange={handleChange}
        onKeyDown={handleKeyDownCalculations}
        disabled={!isEditing && addOneButtonEnabled}
        fullWidth
        InputLabelProps={{ shrink: true }}
        size="small"
        inputProps={{
            sx: { textAlign: 'right' },
            inputMode: 'decimal',
            pattern: '[0-9]*[.,]?[0-9]+',
            onInput: validateNumericInput,
        }}
    />
</Grid>

{/* Taxable Amount (Subtotal - Discount) */}
<Grid item xs={12} sm={4}>
    <label className="ServiceBill-form-label">Taxable Amt :</label>
</Grid>
<Grid item xs={12} sm={8}>
    <TextField
        variant="outlined"
        name="Taxable_Amount"
        autoComplete="off"
        value={formData.Taxable_Amount ?? (parseFloat(formData.Subtotal || 0) - parseFloat(formData.Discount_Amount || 0)).toFixed(2)}
        disabled
        fullWidth
        InputLabelProps={{ shrink: true }}
        size="small"
        inputProps={{ sx: { textAlign: 'right' } }}
    />
</Grid>

                                {/* CGST Row */}
                                <Grid item xs={12} sm={4}>
                                    <label className="ServiceBill-form-label">CGST :</label>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        variant="outlined"
                                        name="CGSTRate"
                                        autoComplete="off"
                                        value={formData.CGSTRate}
                                        onChange={handleChange}
                                        onKeyDown={handleKeyDownCalculations}
                                        disabled={!isEditing && addOneButtonEnabled}
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
                                    />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        variant="outlined"
                                        name="CGSTAmount"
                                        autoComplete="off"
                                        value={formData.CGSTAmount}
                                        onChange={handleChange}
                                        onKeyDown={handleKeyDownCalculations}
                                        disabled={!isEditing && addOneButtonEnabled}
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
                                    />
                                </Grid>

                                {/* SGST Row */}
                                <Grid item xs={12} sm={4}>
                                    <label className="ServiceBill-form-label">SGST :</label>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        variant="outlined"
                                        name="SGSTRate"
                                        autoComplete="off"
                                        value={formData.SGSTRate}
                                        onChange={handleChange}
                                        onKeyDown={handleKeyDownCalculations}
                                        disabled={!isEditing && addOneButtonEnabled}
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
                                    />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        variant="outlined"
                                        name="SGSTAmount"
                                        autoComplete="off"
                                        value={formData.SGSTAmount}
                                        onChange={handleChange}
                                        onKeyDown={handleKeyDownCalculations}
                                        disabled={!isEditing && addOneButtonEnabled}
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
                                    />
                                </Grid>

                                {/* IGST Row */}
                                <Grid item xs={12} sm={4}>
                                    <label className="ServiceBill-form-label">IGST :</label>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        variant="outlined"
                                        name="IGSTRate"
                                        autoComplete="off"
                                        value={formData.IGSTRate}
                                        onChange={handleChange}
                                        disabled={!isEditing && addOneButtonEnabled}
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
                                    />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        variant="outlined"
                                        name="IGSTAmount"
                                        autoComplete="off"
                                        value={formData.IGSTAmount}
                                        onChange={handleChange}
                                        disabled={!isEditing && addOneButtonEnabled}
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
                                    />
                                </Grid>

                                {/* Total Row */}
                                <Grid item xs={12} sm={4}>
                                    <label className="ServiceBill-form-label">Total :</label>
                                </Grid>
                                <Grid item xs={12} sm={8}>
                                    <TextField
                                        variant="outlined"
                                        name="Total"
                                        autoComplete="off"
                                        value={formData.Total}
                                        onChange={handleChange}
                                        disabled={!isEditing && addOneButtonEnabled}
                                        fullWidth
                                        InputLabelProps={{ shrink: true }}
                                        error={!!formErrors.Total}
                                        helperText={formErrors.Total}
                                        size="small"
                                        inputProps={{
                                            sx: { textAlign: 'right' },
                                            inputMode: 'decimal',
                                            pattern: '[0-9]*[.,]?[0-9]+',
                                            onInput: validateNumericInput,
                                        }}
                                    />
                                </Grid>

                                {/* Round Off Row */}
                                <Grid item xs={12} sm={4}>
                                    <label className="ServiceBill-form-label">Round Off :</label>
                                </Grid>
                                <Grid item xs={12} sm={8}>
                                    <TextField
                                        variant="outlined"
                                        name="Round_Off"
                                        autoComplete="off"
                                        value={formData.Round_Off}
                                        onChange={handleChange}
                                        onKeyDown={handleKeyDownCalculations}
                                        disabled={!isEditing && addOneButtonEnabled}
                                        fullWidth
                                        InputLabelProps={{ shrink: true }}
                                        error={!!formErrors.Round_Off}
                                        helperText={formErrors.Round_Off}
                                        size="small"
                                        inputProps={{
                                            sx: { textAlign: 'right' },
                                        }}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={4}>
                                    <label className="ServiceBill-form-label">Final Amount :</label>
                                </Grid>
                                <Grid item xs={12} sm={8}>
                                    <TextField
                                        variant="outlined"
                                        name="Final_Amount"
                                        autoComplete="off"
                                        value={formData.Final_Amount}
                                        onChange={handleChange}
                                        onKeyDown={handleKeyDownCalculations}
                                        disabled={!isEditing && addOneButtonEnabled}
                                        fullWidth
                                        InputLabelProps={{ shrink: true }}
                                        error={!!formErrors.Final_Amount}
                                        helperText={formErrors.Final_Amount}
                                        size="small"
                                        inputProps={{
                                            sx: { textAlign: 'right' },
                                            inputMode: 'decimal',
                                            pattern: '[0-9]*[.,]?[0-9]+',
                                            onInput: validateNumericInput,
                                        }}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={4}>
                                    <label className="ServiceBill-form-label">TCS % :</label>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        variant="outlined"
                                        name="TCS_Rate"
                                        autoComplete="off"
                                        value={formData.TCS_Rate}
                                        onChange={handleChange}
                                        onKeyDown={handleKeyDownCalculations}
                                        disabled={TCSApplicable !== 'Y' || (!isEditing && addOneButtonEnabled)}
                                        fullWidth
                                        InputLabelProps={{ shrink: true }}
                                        error={!!formErrors.TCS_Rate}
                                        helperText={formErrors.TCS_Rate}
                                        size="small"
                                        inputProps={{
                                            sx: { textAlign: 'right' },
                                            inputMode: 'decimal',
                                            pattern: '[0-9]*[.,]?[0-9]+',
                                            onInput: validateNumericInput,
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        variant="outlined"
                                        name="TCS_Amt"
                                        autoComplete="off"
                                        value={formData.TCS_Amt}
                                        onChange={handleChange}
                                        onKeyDown={handleKeyDownCalculations}
                                        disabled={TCSApplicable !== 'Y' || (!isEditing && addOneButtonEnabled)}
                                        fullWidth
                                        InputLabelProps={{ shrink: true }}
                                        error={!!formErrors.TCS_Amt}
                                        helperText={formErrors.TCS_Amt}
                                        size="small"
                                        inputProps={{
                                            sx: { textAlign: 'right' },
                                            inputMode: 'decimal',
                                            pattern: '[0-9]*[.,]?[0-9]+',
                                            onInput: validateNumericInput,
                                        }}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={4}>
                                    <label className="ServiceBill-form-label">Net Payable :</label>
                                </Grid>
                                <Grid item xs={12} sm={8}>
                                    <TextField
                                        variant="outlined"
                                        name="TCS_Net_Payable"
                                        autoComplete="off"
                                        value={formData.TCS_Net_Payable}
                                        onChange={handleChange}
                                        onKeyDown={handleKeyDownCalculations}
                                        disabled={!isEditing && addOneButtonEnabled}
                                        fullWidth
                                        InputLabelProps={{ shrink: true }}
                                        error={!!formErrors.TCS_Net_Payable}
                                        helperText={formErrors.TCS_Net_Payable}
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
                        </div>
                    </div>
                </div>
            </div>
        </form>
    </>
);
};
export default ProformaServiceBill;