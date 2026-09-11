import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import CupBoardMasterHelp from "./CupBoardmasterHelp"
import axios from "axios";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import UserAuditInfo from "../../../Common/UserAuditInfo/UserAuditInfo";
import ActionButtonGroup from "../../../Common/CommonButtons/ActionButtonGroup";
import NavigationButtons from "../../../Common/CommonButtons/NavigationButtons";
import Swal from "sweetalert2";

var employeeCodeNew = "";
var maxFileNoNew = ""
var SlectedUserIdNew = ""
var SelectUserName = ""

const UserCreationCompoenent = () => {
    const apiURL = process.env.REACT_APP_API_URL_FILE_SYSTEM;

    const resaleMillDropdownRef = useRef(null);
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
    const [editedrecord, setEditedrecord] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedUserId, setSelectedUserId] = useState("");
    const [selectedEmployeeName, setSelectedEmployeeName] = useState("");
    const [cupboardCode, setCupboardCode] = useState("");
    const [maxFileNo, setMaxFileNo] = useState(0);
    const [Disabledfeilds, setDisabledFeilds] = useState(false);
    const [currentRecordIndex, setCurrentRecordIndex] = useState(0);
    const [records, setRecords] = useState([]);

    const editButtonRef = useRef(null);
    const updateButtonRef = useRef(null);
    const setfocusFilenameref = useRef(null);
    const addNewButtonRef = useRef(null);
    const HelpfocusRef = useRef(null)

    const User_Name = localStorage.getItem("userName");
    const location = useLocation();
    const editRecordData = location.state && location.state.editRecordData;

    const getCurrentDate = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const [employeeDetails, setEmployeeDetails] = useState({
        Doc_No: "",
        Doc_Date: getCurrentDate(),
        File_Name: "",
        File_Discription: "",
        Cupboard_Code: "",
        File_No: "",
        Created_by: "",
        Modified_by: ""

    });
    const navigate = useNavigate();

    useEffect(() => {
        setEmployeeDetails((prevState) => ({
            ...prevState,
            Doc_Date: getCurrentDate(),
        }));

    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === "Mobile_No" && !/^\d*$/.test(value)) {
            return;
        }
        setEmployeeDetails({
            ...employeeDetails,
            [name]: value,
            Doc_Date: getCurrentDate(),
        });
    };

    const handleAddOne = () => {
        setAddOneButtonEnabled(false);
        setSaveButtonEnabled(true);
        setCancelButtonEnabled(true);
        setEditButtonEnabled(false);
        setDeleteButtonEnabled(false);
        setIsEditMode(false);
        setIsEditing(true);
        setDisabledFeilds(false);
        axios
            .get(`${apiURL}/lastFileCode`)
            .then((response) => {
                const lastEmployeeCode = response.data.lastUserCreation;
                maxFileNoNew = ""
                SlectedUserIdNew = ""
                SelectUserName = ""
                setEmployeeDetails({
                    Doc_No: lastEmployeeCode + 1,
                    Doc_Date: "",
                    File_Name: "",
                    File_Discription: "",
                    Cupboard_Code: "",
                    File_No: "",
                });
                setSelectedUserId("");
                setCupboardCode("");
                setCurrentIndex(response.data.length - 1);

            })
            .catch((error) => {
                console.error("Error fetching last employee code:", error);
            });
    };

    const handleEdit = () => {

        setIsEditing(true);
        setIsEditMode(true);
        setAddOneButtonEnabled(false);
        setSaveButtonEnabled(true);
        setCancelButtonEnabled(true);
        setEditButtonEnabled(false);
        setDeleteButtonEnabled(false);
        setBackButtonEnabled(true);
        employeeCodeNew = employeeDetails.Doc_No;

    };

    const fetchMaxFileNo = () => {
        axios
            .get(`${apiURL}/getLastCupboardCode/${selectedUserId}`)
            .then((response) => {

                const maxFileNo = response.data.maxFileNo;
                maxFileNoNew = maxFileNo + 1
                setMaxFileNo(maxFileNo);
            })
            .catch((error) => {
                console.error("Error fetching max File_No:", error);
            });
    };

    useEffect(() => {
        if (selectedUserId) {
            fetchMaxFileNo();
        }
    }, [selectedUserId]);

    const handleSaveOrUpdate = (e) => {
        if (isEditMode) {

            axios
                .put(
                    `${apiURL}/updatefile/${employeeDetails.Doc_No}`,
                    { ...employeeDetails, Modified_by: User_Name }
                )
                .then((response) => {
                    Swal.fire({
                        title: "Success!",
                        text: "Record Updated Successfully!",
                        icon: "success",
                        confirmButtonText: "OK",
                    });
                    setIsEditMode(false);
                    setAddOneButtonEnabled(true);
                    setEditButtonEnabled(true);
                    setDeleteButtonEnabled(true);
                    setBackButtonEnabled(true);
                    setSaveButtonEnabled(false);
                    setCancelButtonEnabled(false);
                    setUpdateButtonClicked(true);
                    setIsEditing(false);
                    addNewButtonRef.current.focus();
                })

                .catch((error) => {
                    console.error("Error updating data:", error);
                });
        }

        else {
            if (!selectedUserId || !employeeDetails.File_Name) {
                toast.error('Cupboard and File Name are required!');
                return;
            }
            const updatedEmployeeDetails = { ...employeeDetails, Cupboard_Code: selectedUserId, CupBoardCode_Name: selectedEmployeeName, Created_by: User_Name };
            axios
                .post(`${apiURL}/insertfile`, updatedEmployeeDetails)
                .then((response) => {
                    Swal.fire({
                        title: "Success!",
                        text: "Record Created Successfully!",
                        icon: "success",
                        confirmButtonText: "OK",
                    });

                    // Show the record the server actually saved, instead of
                    // reloading the page - a reload restores whatever
                    // editRecordData was last pushed into browser history for
                    // this URL (e.g. an old record from a previous
                    // double-click), which is why an old Doc_No used to
                    // reappear here after saving a brand new one.
                    const savedRecord = response.data.userCreation;
                    employeeCodeNew = savedRecord.Doc_No;
                    maxFileNoNew = savedRecord.File_No;
                    SlectedUserIdNew = savedRecord.Cupboard_Code;
                    SelectUserName = savedRecord.CupBoardCode_Name;
                    setSelectedUserId(savedRecord.Cupboard_Code);
                    setCupboardCode(savedRecord.Cupboard_Code);
                    setEmployeeDetails({
                        Doc_No: savedRecord.Doc_No,
                        Doc_Date: savedRecord.Doc_Date,
                        File_Name: savedRecord.File_Name,
                        File_Discription: savedRecord.File_Discription,
                        Cupboard_Code: savedRecord.Cupboard_Code,
                        File_No: savedRecord.File_No,
                        Created_by: savedRecord.Created_by,
                        Modified_by: savedRecord.Modified_by,
                    });

                    setIsEditMode(false);
                    setAddOneButtonEnabled(true);
                    setEditButtonEnabled(true);
                    setDeleteButtonEnabled(true);
                    setBackButtonEnabled(true);
                    setSaveButtonEnabled(false);
                    setCancelButtonEnabled(false);
                    setCancelButtonClicked(true);
                    setIsEditing(false);
                    setDisabledFeilds(true);
                })
                .catch((error) => {
                    console.error("Error saving data:", error);
                });
        }
    };

    const handleBack = () => {
        navigate("/filemanagementutility");
    };


    const handleDelete = () => {
        Swal.fire({
            title: 'Are you sure?',
            text: 'You won’t be able to revert this!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel',
            reverseButtons: true,
        }).then((result) => {
            if (result.isConfirmed) {
                setIsEditMode(false);
                setAddOneButtonEnabled(true);
                setEditButtonEnabled(true);
                setDeleteButtonEnabled(true);
                setBackButtonEnabled(true);
                setSaveButtonEnabled(false);
                setCancelButtonEnabled(false);

                axios
                    .delete(`${apiURL}/deletefile/${employeeDetails.Doc_No}`)
                    .then((response) => {
                        Swal.fire({
                            icon: 'success',
                            title: 'Deleted!',
                            text: 'Data deleted successfully!!',
                            timer: 2000,
                        });
                        handleCancel();
                    })
                    .catch((error) => {
                        console.error('Error during API call:', error);
                        Swal.fire({
                            icon: 'error',
                            title: 'Oops...',
                            text: 'Failed to delete data.',
                        });

                    });
            }
        });
    };

    const handleCancel = () => {
        setIsEditMode(false);
        setAddOneButtonEnabled(true);
        setEditButtonEnabled(true);
        setDeleteButtonEnabled(true);
        setBackButtonEnabled(true);
        setSaveButtonEnabled(false);
        setCancelButtonEnabled(false);
        setCancelButtonClicked(true);
        setIsEditing(false);
        setDisabledFeilds(true);

        axios
            .get(`${apiURL}/getlastfilebyid`)
            .then((response) => {
                const lastRecord = response.data.lastUserCreation;

                if (!lastRecord) {
                    // No records left (e.g. the only record was just deleted) -
                    // reset to a blank "new record" state instead of leaving
                    // the previous (now-deleted) record on screen.
                    employeeCodeNew = "";
                    maxFileNoNew = "";
                    SlectedUserIdNew = "";
                    SelectUserName = "";
                    setSelectedUserId("");
                    setCupboardCode("");
                    setEmployeeDetails({
                        Doc_No: 1,
                        Doc_Date: "",
                        File_Name: "",
                        File_Discription: "",
                        Cupboard_Code: "",
                        File_No: "",
                        Created_by: "",
                        Modified_by: "",
                    });
                    return;
                }

                employeeCodeNew = lastRecord.Doc_No;
                maxFileNoNew = lastRecord.File_No;
                SlectedUserIdNew = lastRecord.Cupboard_Code
                SelectUserName = lastRecord.CupBoardCode_Name
                setSelectedUserId(lastRecord.Cupboard_Code);
                setCupboardCode(lastRecord.Cupboard_Code);
                setEmployeeDetails({
                    Doc_No: lastRecord.Doc_No,
                    Doc_Date: lastRecord.Doc_Date,
                    File_Name: lastRecord.File_Name,
                    File_Discription: lastRecord.File_Discription,
                    Cupboard_Code: lastRecord.Cupboard_Code,
                    File_No: lastRecord.File_No,
                    Created_by: lastRecord.Created_by,
                    Modified_by: lastRecord.Modified_by,

                });
                editButtonRef.current.focus();
            })
            .catch((error) => {
                console.error("Error fetching last record:", error);
            });
    };

    const handleSubmit = (event) => {
        event.preventDefault();
    };

    useEffect(() => {
        if (editRecordData) {
            handlerecordDoubleCliked();

            setAddOneButtonEnabled(true);
            setEditButtonEnabled(true);
            setDeleteButtonEnabled(true);
            setBackButtonEnabled(true);
            setSaveButtonEnabled(false);
            setCancelButtonEnabled(false);
            setCancelButtonClicked(true);
            setDisabledFeilds(true);
        } else {
            handleAddOne();
        }
    }, [editRecordData]);

    const handlerecordDoubleCliked = () => {
        setIsEditMode(false);
        setAddOneButtonEnabled(true);
        setEditButtonEnabled(true);
        setDeleteButtonEnabled(true);
        setBackButtonEnabled(true);
        setSaveButtonEnabled(false);
        setCancelButtonEnabled(false);
        setCancelButtonClicked(true);
        setIsEditing(false);
        setDisabledFeilds(true);
        axios
            .get(`${apiURL}/getdatabyDocNo/${editRecordData.Doc_No}`)
            .then((response) => {
                const recordData = response.data.getdataByDocNo;

                setCupboardCode(recordData.Cupboard_Code);
                SlectedUserIdNew = recordData.Cupboard_Code;
                SelectUserName = recordData.CupBoardCode_Name;
                maxFileNoNew = recordData.File_No;

                setEmployeeDetails({
                    Doc_No: recordData.Doc_No,
                    Doc_Date: recordData.Doc_Date,
                    File_Name: recordData.File_Name,
                    File_Discription: recordData.File_Discription,
                    Cupboard_Code: recordData.Cupboard_Code,
                    File_No: recordData.File_No,
                    Created_by: recordData.Created_by,
                    Modified_by: recordData.Modified_by,


                });
            })
            .catch((error) => {
                console.error("Error fetching record:", error);
            });
    };

    const fetchFirstRecord = () => {
        axios.get(`${apiURL}/getfirstnavigationfile`).then((response) => {
            const firstRecord = response.data.firstUserCreation;
            maxFileNoNew = response.data.firstUserCreation.File_No
            SlectedUserIdNew = response.data.firstUserCreation.Cupboard_Code;
            SelectUserName = response.data.firstUserCreation.CupBoardCode_Name;
            setEmployeeDetails(firstRecord);
            setRecords([firstRecord]);
            setCurrentRecordIndex(0);
        });
    };

    const fetchLastRecord = () => {
        axios.get(`${apiURL}/getlastnavigationfile`).then((response) => {
            const lastRecord = response.data.lastUserCreation;
            maxFileNoNew = response.data.lastUserCreation.File_No;
            SlectedUserIdNew = response.data.lastUserCreation.Cupboard_Code;
            SelectUserName = response.data.lastUserCreation.CupBoardCode_Name;
            setEmployeeDetails(lastRecord);
            setRecords([lastRecord]);
            setCurrentRecordIndex(0);
        });
    };

    const fetchPreviousRecord = async () => {
        const response = await axios.get(
            `${apiURL}/getpreviousnavigationfile/${employeeDetails.Doc_No}`
        );

        if (response.data.previousUserCreation) {
            const previousRecord = response.data.previousUserCreation;
            maxFileNoNew = response.data.previousUserCreation.File_No;
            SlectedUserIdNew = response.data.previousUserCreation.Cupboard_Code;
            SelectUserName = response.data.previousUserCreation.CupBoardCode_Name;
            setEmployeeDetails(previousRecord);
            setCurrentRecordIndex(currentRecordIndex - 1);
        } else {
            console.log("No previous record available.");
        }
    };

    const fetchNextRecord = async () => {
        const response = await axios.get(
            `${apiURL}/getnextnavigationfile/${employeeDetails.Doc_No}`
        );

        if (response.data.nextUserCreation) {
            const nextRecord = response.data.nextUserCreation;
            maxFileNoNew = response.data.nextUserCreation.File_No;
            SlectedUserIdNew = response.data.nextUserCreation.Cupboard_Code;
            SelectUserName = response.data.nextUserCreation.CupBoardCode_Name;
            setEmployeeDetails(nextRecord);
            setCurrentRecordIndex(currentRecordIndex + 1);
        } else {
            console.log("No next record available.");
        }
    };

    const handleFirst = () => {
        fetchFirstRecord();
    };

    const handleLast = () => {
        fetchLastRecord();
    };

    const handlePrevious = () => {
        fetchPreviousRecord();
    };

    const handleNext = () => {
        fetchNextRecord();
    };

    const handleEmployeeCode = (code, name) => {
        setSelectedUserId(code);
        setSelectedEmployeeName(name);
    };

    const handleKeyDownDescription = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            const { name, value } = e.target;
            setEmployeeDetails((prevDetails) => ({
                ...prevDetails,
                [name]: value + "\n",
            }));
        }
    };

    return (
        <>
            <UserAuditInfo
                createdBy={employeeDetails.Created_by}
                modifiedBy={employeeDetails.Modified_by}
                title={"File Information"}
            />

            <div style={{ marginTop: "40px" }}>
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
                />
                <div>
                    <NavigationButtons
                        handleFirstButtonClick={handleFirst}
                        handlePreviousButtonClick={handlePrevious}
                        handleNextButtonClick={handleNext}
                        handleLastButtonClick={handleLast}
                        highlightedButton={highlightedButton}
                    />
                </div>
            </div>
            <div className="flex justify-center items-center min-h-[40vh]">
                <div className="w-full max-w-4xl p-6">
                    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="relative">
                                <label className="block text-left text-sm font-bold text-gray-800 mb-1.5">
                                    Doc No
                                    <span className="ml-1 text-xs text-gray-500">(Auto-generated)</span>
                                </label>
                                <div className="flex items-center">
                                    <input
                                        type="text"
                                        name="Doc_No"
                                        value={employeeDetails.Doc_No || "AUTO-GENERATED"}
                                        readOnly
                                        disabled
                                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-md bg-gray-100 text-gray-700 cursor-not-allowed pr-10"
                                    />
                                    <svg
                                        className="absolute right-3 h-5 w-5 text-gray-400"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>

                            <div>
                                <label className="block text-left text-sm font-bold text-gray-800 mb-1.5">
                                    Doc Date
                                </label>
                                <input
                                    type="date"
                                    name="Doc_Date"
                                    value={getCurrentDate()}
                                    readOnly
                                    disabled
                                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-md bg-gray-100 text-gray-700 cursor-not-allowed"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                    <label htmlFor="Bill_From" className="text-sm font-bold text-gray-800 whitespace-nowrap min-w-[120px]">
                                        Cupboard Code:
                                    </label>
                                    <div className="flex-grow">
                                        <CupBoardMasterHelp
                                            ref={HelpfocusRef}
                                            name="Cupboard_Code"
                                            onAcCodeClick={handleEmployeeCode}
                                            newCupBoardCode={SlectedUserIdNew}
                                            newUserName={SelectUserName}
                                            disabledFeild={Disabledfeilds}
                                            tabIndexHelp={1}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-left text-sm font-bold text-gray-800 mb-1.5">
                                    File Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    ref={setfocusFilenameref}
                                    type="text"
                                    name="File_Name"
                                    value={employeeDetails.File_Name}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    required
                                    tabIndex={2}
                                    className={`w-full px-3.5 py-2.5 border ${!isEditing ? 'border-gray-200 bg-gray-50' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500`}
                                />
                            </div>

                            <div className="relative">
                                <label className="block text-left text-sm font-bold text-gray-800 mb-1.5">
                                    File No
                                    <span className="ml-1 text-xs text-gray-500">(Auto-generated)</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="File_No"
                                        value={employeeDetails.File_No}
                                        onChange={handleInputChange}
                                        readOnly
                                        disabled
                                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-md bg-gray-100 text-gray-700 cursor-not-allowed pr-10"
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <svg
                                            className="h-5 w-5 text-gray-400"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-left text-sm font-bold text-gray-800 mb-1.5">
                                    File Description
                                </label>
                                <textarea
                                    name="File_Discription"
                                    value={employeeDetails.File_Discription}
                                    onChange={handleInputChange}
                                    onKeyDown={handleKeyDownDescription}
                                    disabled={!isEditing}
                                    rows={5}
                                    tabIndex={3}
                                    className={`w-full px-3.5 py-2.5 border ${!isEditing ? 'border-gray-200 bg-gray-50' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500`}
                                />
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};
export default UserCreationCompoenent;
