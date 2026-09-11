import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import CupBoardMasterHelp from "../File Info/CupBoardmasterHelp"
import axios from "axios";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import UserAuditInfo from "../../../Common/UserAuditInfo/UserAuditInfo";
import Swal from "sweetalert2";
import { ArrowPathIcon, ArrowUpTrayIcon } from '@heroicons/react/24/solid';
import { Typography } from "@mui/material";
import BackButton from "../../../Common/Buttons/BackButton";

var employeeCodeNew = "";
var maxFileNoNew = ""
var SlectedUserIdNew = ""
var SelectUserName = ""
var newShiftingCupboardCode = ""
var newShiftingCupboardName = ""

const UserCreationCompoenent = () => {
    const apiURL = process.env.REACT_APP_API_URL_FILE_SYSTEM;

    const [isEditing, setIsEditing] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedUserId, setSelectedUserId] = useState("");
    const [selectedEmployeeName, setSelectedEmployeeName] = useState("");
    const [newshiftingCupboardCode, setNewshiftingCupboardCode] = useState("");
    const [newshiftingCupboardName, setNewshiftingCupboardName] = useState("");


    const [isOldFileLoaded, setIsOldFileLoaded] = useState(false);
    const [isNewCupboardSelected, setIsNewCupboardSelected] = useState(false);


    const [cupboardCode, setCupboardCode] = useState("");
    const [maxFileNo, setMaxFileNo] = useState(0);

    const setfocusFilenameref = useRef(null);
    const HelpfocusRef = useRef(null)

    const User_Name = localStorage.getItem("userName");
    const location = useLocation();

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
        Modified_by: "",
        oldFile_No: "",
        Remark: ""
    });
    const navigate = useNavigate();

    useEffect(() => {
        setEmployeeDetails((prevState) => ({
            ...prevState,
            Doc_Date: getCurrentDate(),
        }));

        employeeCodeNew = "";
        maxFileNoNew = "";
        SlectedUserIdNew = "";
        SelectUserName = "";
        newShiftingCupboardCode = "";
        newShiftingCupboardName = "";
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

    const fetchMaxFileNo = (cupboardCode) => {
        axios
            .get(`${apiURL}/getLastCupboardCode/${cupboardCode}`)
            .then((response) => {
                const maxFileNo = response.data.maxFileNo || 0;
                const newFileNo = maxFileNo + 1;
                maxFileNoNew = newFileNo;
                setMaxFileNo(newFileNo);
                setEmployeeDetails(prev => ({
                    ...prev,
                    File_No: newFileNo
                }));
            })
            .catch((error) => {
                console.error("Error fetching max File_No:", error);
            });
    };

    const handleSaveOrUpdate = async () => {
        try {
            const payload = {
                ...employeeDetails,
                Cupboard_Code: newShiftingCupboardCode,
                File_No: maxFileNoNew,
                Modified_by: User_Name
            };

            const response = await axios.put(
                `${apiURL}/updatenewcupboardfile/${employeeDetails.Doc_No}`,
                payload
            );

            if (response.data.fileInformation.File_No !== maxFileNoNew) {
                throw new Error("File number not updated on server");
            }
            Swal.fire({
                title: "Success!",
                text: `File shifted to cupboard ${newShiftingCupboardCode} with new number ${maxFileNoNew}`,
                icon: "success"
            });

            setTimeout(() => {
                window.location.reload();
            }, 2000);


        } catch (error) {
            console.error("Update failed:", error);
            Swal.fire({
                title: "Error!",
                text: error.response?.data?.error || "Failed to update file",
                icon: "error"
            });
        }
    };


    const handleBack = () => {
        navigate("/filesystemdashboard");
    };


    const handleSubmit = (event) => {
        event.preventDefault();
    };


    const handleEmployeeCode = (code, name) => {
        setSelectedUserId(code);
        setSelectedEmployeeName(name);
    };

    const handleNewCupBoardCode = (code, name) => {
        setNewshiftingCupboardCode(code);
        setNewshiftingCupboardName(name);
        newShiftingCupboardCode = code;
        newShiftingCupboardName = name;

    
        setIsNewCupboardSelected(true);
        fetchMaxFileNo(code);
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

    const handleRemarkChange = (e) => {
        const { name, value } = e.target;
        setEmployeeDetails({
            ...employeeDetails,
            [name]: value,
        });
    };

    const handleOldFileGet = async () => {
        try {
            const cupboardCode = selectedUserId;
            const fileNo = employeeDetails.oldFile_No;

            if (!cupboardCode || !fileNo) {
                toast.error("Please provide both Cupboard Code and File No to fetch the old file.");
                return;
            }

            const response = await axios.get(
                `${apiURL}/getfilebycupboardcode?Cupboard_Code=${cupboardCode}&File_No=${fileNo}`
            );

            const fileData = response.data.fileData;
            console.log("Filedata:", fileData);

            const autoRemark = `Old Cupboard Code : ${fileData.Cupboard_Code},Old Cupboard Name :${fileData.CupBoardCode_Name},File No: ${fileNo}`;

            if (fileData) {
                setEmployeeDetails({
                    Doc_No: fileData.Doc_No,
                    Doc_Date: fileData.Doc_Date,
                    File_Name: fileData.File_Name,
                    File_Discription: fileData.File_Discription,
                    Cupboard_Code: fileData.Cupboard_Code,
                    oldFile_No: fileData.File_No,
                    Created_by: fileData.Created_by,
                    Modified_by: fileData.Modified_by,
                    Remark: autoRemark
                });

                setSelectedUserId(fileData.Cupboard_Code);
                setSelectedEmployeeName(fileData.CupBoardCode_Name);

                setIsOldFileLoaded(true);
                setIsNewCupboardSelected(false);

                toast.success("Old file loaded successfully!");
            } else {
                toast.warn("No file data found for the provided cupboard code and file number.");
            }
        } catch (error) {
            console.error("Error fetching old file data:", error);
            toast.error("Failed to fetch old file data.");
        }
    };


    return (
        <>
            <Typography variant="h6"
                component="h1"
                gutterBottom
                sx={{
                    textAlign: 'center',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    color: '#2c3e50',
                    padding: '1px 0',
                    position: 'relative',
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: '0',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '80px',
                        height: '4px',
                        background: 'linear-gradient(90deg, #3498db, #2ecc71)',
                        borderRadius: '2px',
                        animation: 'underlineGrow 0.5s ease-out forwards'
                    },
                    '@keyframes underlineGrow': {
                        '0%': { width: '0' },
                        '100%': { width: '80px' }
                    }
                }}>
                File Shifting
            </Typography>
            <div className="">
                <div className="flex justify-end">
                    <BackButton onClick={handleBack} />
                </div>
            </div>
            <div >
            </div>
            <div className="flex justify-center items-center">
                <div className="w-full max-w-6xl p-4 -mt-10">
                    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
                        <div >
                            <div className="flex flex-col sm:flex-row sm:items-end gap-4">

                                <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
                                    <label
                                        htmlFor="Bill_From"
                                        className="text-sm font-bold text-gray-800 whitespace-nowrap min-w-[120px]"
                                    >
                                        Old Cupboard Code:
                                    </label>
                                    <div className="flex-grow">
                                        <CupBoardMasterHelp
                                            ref={HelpfocusRef}
                                            name="oldCupboardCode"
                                            onAcCodeClick={handleEmployeeCode}
                                            newCupBoardCode={SlectedUserIdNew}
                                            newUserName={SelectUserName}
                                        />
                                    </div>
                                </div>

                                <div className="flex-1">
                                    <label className="block text-left text-sm font-bold text-gray-800 mb-1.5">
                                        Old File No
                                    </label>
                                    <input
                                        type="text"
                                        name="oldFile_No"
                                        value={employeeDetails.oldFile_No}
                                        onChange={handleInputChange}
                                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-md pr-10"
                                    />
                                </div>

                                <div className="flex-shrink-0">
                                    <button
                                        onClick={handleOldFileGet}
                                        disabled={isOldFileLoaded}
                                        className={`px-3 py-2 text-sm text-white rounded mt-[26px] ${isOldFileLoaded ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
                                            } transition-colors`}
                                    >
                                        <ArrowPathIcon className="h-5 w-5" />
                                    </button>

                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
                                    <label
                                        htmlFor="Bill_From"
                                        className="text-sm font-bold text-gray-800 whitespace-nowrap min-w-[140px]"
                                    >
                                        New Cupboard Code:
                                    </label>
                                    <div className="flex-grow">
                                        <CupBoardMasterHelp
                                            ref={HelpfocusRef}
                                            name="newCupboardCode"
                                            onAcCodeClick={handleNewCupBoardCode}
                                            newCupBoardCode={newshiftingCupboardCode}
                                            newUserName={newshiftingCupboardName}
                                        // disabledFeild={Disabledfeilds}
                                        />
                                    </div>
                                </div>

                                <div className="flex-1">
                                    <label className="block text-left text-sm font-bold text-gray-800 mb-1.5">
                                        New File No <span className="ml-1 text-xs text-gray-500">(Auto-generated)</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={maxFileNoNew}
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
                                                <path
                                                    fillRule="evenodd"
                                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                </div>


                                <button
                                    onClick={handleSaveOrUpdate}
                                    disabled={!isOldFileLoaded || !isNewCupboardSelected}
                                    className={`px-3 py-1.5 h-fit text-sm text-white rounded transition-colors ${(!isOldFileLoaded || !isNewCupboardSelected)
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : 'bg-blue-500 hover:bg-blue-600'
                                        }`}
                                >
                                    <ArrowUpTrayIcon className="h-5 w-5" />
                                </button>

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
                                    className="w-full rounded-md px-3 py-2 text-base text-gray-700 bg-gray-100 cursor-not-allowed outline-1 -outline-offset-1 outline-gray-300 sm:text-sm"
                                />
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

                                    className="w-full rounded-md px-3 py-2 text-base text-gray-700 bg-gray-100 cursor-not-allowed outline-1 -outline-offset-1 outline-gray-300 sm:text-sm"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-left text-sm font-bold text-gray-800 mb-1.5">
                                    Remark
                                </label>
                                <textarea
                                    name="Remark"
                                    value={employeeDetails.Remark}
                                    onChange={handleRemarkChange}
                                    // onKeyDown={handleKeyDownDescription}
                                    // disabled={!isEditing}
                                    rows={5}
                                // className={`w-full px-3.5 py-2.5 border ${!isEditing ? 'border-gray-200 bg-gray-50' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500`}
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
