



import React, { useState, useEffect, useRef } from "react";
import ActionButtonGroup from "../../../Common/CommonButtons/ActionButtonGroup";
import NavigationButtons from "../../../Common/CommonButtons/NavigationButtons";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from "sweetalert2";
import UserAuditInfo from "../../../Common/UserAuditInfo/UserAuditInfo";

const API_URL = process.env.REACT_APP_API;

const TDSSectionMaster = () => {

    const [addOneButtonEnabled, setAddOneButtonEnabled] = useState(false);
    const [saveButtonEnabled, setSaveButtonEnabled] = useState(true);
    const [cancelButtonEnabled, setCancelButtonEnabled] = useState(true);
    const [editButtonEnabled, setEditButtonEnabled] = useState(false);
    const [deleteButtonEnabled, setDeleteButtonEnabled] = useState(false);
    const [backButtonEnabled, setBackButtonEnabled] = useState(true);
    const [isEditMode, setIsEditMode] = useState(false);
    const [highlightedButton, setHighlightedButton] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    const navigate = useNavigate();

    const location = useLocation();
    const selectedRecord = location.state?.selectedRecord;
    const permissions = location.state?.permissionsData;

    const inputRef = useRef(null);

    const initialFormData = {
        id: "",
        Nature_of_Payment: "",
        Section: "",
        TDS_Section_Code: ""
    };

    const [formData, setFormData] = useState(initialFormData);

    // HANDLE CHANGE
    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((prevState) => ({
            ...prevState,
            [name]: value
        }));
    };

    // FETCH LAST ID
    const fetchLastRecord = async () => {
        try {

            const response = await axios.get(
                `${API_URL}/get-last-TDSSection`
            );

            const lastId =
                response.data.last_TDSSection_data.id;

            setFormData((prevState) => ({
                ...prevState,
                id: lastId + 1
            }));

        } catch (error) {
            console.error(error);
        }
    };

    // ADD NEW
    const handleAddOne = async () => {

        setAddOneButtonEnabled(false);
        setSaveButtonEnabled(true);
        setCancelButtonEnabled(true);
        setEditButtonEnabled(false);
        setDeleteButtonEnabled(false);
        setIsEditing(true);

        setFormData(initialFormData);

        await fetchLastRecord();

        setTimeout(() => {
            inputRef.current?.focus();
        }, 0);
    };

    // SAVE OR UPDATE
    const handleSaveOrUpdate = async () => {

        if (isEditMode) {

            try {

                await axios.put(
                    `${API_URL}/update-TDSSection`,
                    formData
                );

                Swal.fire({
                    title: "Success!",
                    text: "Record updated successfully!",
                    icon: "success",
                    confirmButtonText: "OK"
                });

                setIsEditMode(false);
                setAddOneButtonEnabled(true);
                setEditButtonEnabled(true);
                setDeleteButtonEnabled(true);
                setSaveButtonEnabled(false);
                setCancelButtonEnabled(false);
                setIsEditing(false);

            } catch (error) {
                console.error(error);
            }

        } else {

            try {

                await axios.post(
                    `${API_URL}/create-TDSSection`,
                    formData
                );

                Swal.fire({
                    title: "Success!",
                    text: "Record created successfully!",
                    icon: "success",
                    confirmButtonText: "OK"
                });

                setIsEditMode(false);
                setAddOneButtonEnabled(true);
                setEditButtonEnabled(true);
                setDeleteButtonEnabled(true);
                setSaveButtonEnabled(false);
                setCancelButtonEnabled(false);
                setIsEditing(false);

            } catch (error) {
                console.error(error);
            }
        }
    };

    // EDIT
    const handleEdit = () => {

        setIsEditMode(true);
        setAddOneButtonEnabled(false);
        setSaveButtonEnabled(true);
        setCancelButtonEnabled(true);
        setEditButtonEnabled(false);
        setDeleteButtonEnabled(false);
        setIsEditing(true);
    };

    // CANCEL
    const handleCancel = async () => {

        try {

            const response = await axios.get(
                `${API_URL}/get-last-TDSSection`
            );

            const data =
                response.data.last_TDSSection_data;

            setFormData(data);

        } catch (error) {
            console.error(error);
        }

        setIsEditing(false);
        setIsEditMode(false);
        setAddOneButtonEnabled(true);
        setEditButtonEnabled(true);
        setDeleteButtonEnabled(true);
        setSaveButtonEnabled(false);
        setCancelButtonEnabled(false);
    };

    // DELETE
    const handleDelete = async () => {

        const result = await Swal.fire({
            title: "Are you sure?",
            text: `Delete Record ID : ${formData.id}`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Delete"
        });

        if (result.isConfirmed) {

            try {

                await axios.delete(
                    `${API_URL}/delete-TDSSection?id=${formData.id}`
                );

                Swal.fire({
                    title: "Deleted!",
                    text: "Record deleted successfully!",
                    icon: "success",
                    confirmButtonText: "OK"
                });

                handleCancel();

            } catch (error) {

                toast.error("Deletion failed");
                console.error(error);
            }
        }
    };

    // BACK
    const handleBack = () => {
        navigate("/TDS_section-utility");
    };

    // FIRST
    const handleFirstButtonClick = async () => {

        try {

            const response = await axios.get(
                `${API_URL}/get-first-TDSSection`
            );

            setFormData(
                response.data.first_TDSSection_data
            );

        } catch (error) {
            console.error(error);
        }
    };

    // PREVIOUS
    const handlePreviousButtonClick = async () => {

        try {

            const response = await axios.get(
                `${API_URL}/get-previous-TDSSection?id=${formData.id}`
            );

            setFormData(
                response.data.previous_TDSSection_data
            );

        } catch (error) {
            console.error(error);
        }
    };

    // NEXT
    const handleNextButtonClick = async () => {

        try {

            const response = await axios.get(
                `${API_URL}/get-next-TDSSection?id=${formData.id}`
            );

            setFormData(
                response.data.next_TDSSection_data
            );

        } catch (error) {
            console.error(error);
        }
    };

    // LAST
    const handleLastButtonClick = async () => {

        try {

            const response = await axios.get(
                `${API_URL}/get-last-TDSSection`
            );

            setFormData(
                response.data.last_TDSSection_data
            );

        } catch (error) {
            console.error(error);
        }
    };

    // GET RECORD BY ID
    const handleKeyDown = async (event) => {

        if (event.key === "Tab") {

            try {

                const response = await axios.get(
                    `${API_URL}/get-TDSSection-byid?id=${event.target.value}`
                );

                setFormData(response.data);

            } catch (error) {
                console.error(error);
            }
        }
    };

    // DOUBLE CLICK EDIT
    const handlerecordDoubleClicked = async () => {

        try {

            const response = await axios.get(
                `${API_URL}/get-TDSSection-byid?id=${selectedRecord.id}`
            );

            setFormData(response.data);

        } catch (error) {
            console.error(error);
        }

        setAddOneButtonEnabled(true);
        setEditButtonEnabled(true);
        setDeleteButtonEnabled(true);
        setSaveButtonEnabled(false);
        setCancelButtonEnabled(false);
        setIsEditing(false);
    };

    useEffect(() => {

        if (selectedRecord) {
            handlerecordDoubleClicked();
        } else {
            handleAddOne();
        }

    }, [selectedRecord]);

    return (
        <>
            <UserAuditInfo
                createdBy={""}
                modifiedBy={""}
                title={"TDS Section Master"}
            />

            <div style={{ marginTop: "30px" }}>

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
                    nextTabIndex={6}
                />

                <NavigationButtons
                    handleFirstButtonClick={handleFirstButtonClick}
                    handlePreviousButtonClick={handlePreviousButtonClick}
                    handleNextButtonClick={handleNextButtonClick}
                    handleLastButtonClick={handleLastButtonClick}
                    highlightedButton={highlightedButton}
                    isEditing={isEditing}
                />
            </div>

            <div className="flex justify-center items-center min-h-[40vh] bg-gray-50 py-8">

                <div className="w-full max-w-2xl p-6 bg-white rounded-lg shadow-md">

                    <form>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

                            {/* CHANGE NO */}
                            <div>
                                <label className="block text-left text-sm font-bold text-gray-800 mb-1">
                                    Change No
                                </label>

                                <input
                                    type="text"
                                    onKeyDown={handleKeyDown}
                                    disabled={!addOneButtonEnabled}
                                    tabIndex={1}
                                    className={`block w-full rounded-md px-3 py-2 text-base text-gray-900
                                    outline-1 outline-gray-300
                                    ${!addOneButtonEnabled
                                            ? "bg-gray-100 cursor-not-allowed"
                                            : "bg-white"
                                        }`}
                                />
                            </div>

                            {/* ID */}
                            <div>
                                <label className="block text-left text-sm font-bold text-gray-800 mb-1">
                                    ID
                                </label>

                                <input
                                    type="text"
                                    name="id"
                                    value={formData.id}
                                    disabled
                                    tabIndex={2}
                                    className="w-full rounded-md px-3 py-2 bg-gray-100"
                                />
                            </div>

                            {/* NATURE OF PAYMENT */}
                            <div className="md:col-span-2">
                                <label className="block text-left text-sm font-bold text-gray-800 mb-1">
                                    Nature Of Payment
                                </label>

                                <input
                                    type="text"
                                    name="Nature_of_Payment"
                                    value={formData.Nature_of_Payment}
                                    onChange={handleChange}
                                    ref={inputRef}
                                    disabled={!isEditing && addOneButtonEnabled}
                                    tabIndex={3}
                                    className={`block w-full rounded-md px-3 py-2 text-base text-gray-900
                                    outline-1 outline-gray-300
                                    ${(!isEditing && addOneButtonEnabled)
                                            ? "bg-gray-100 cursor-not-allowed"
                                            : "bg-white"
                                        }`}
                                />
                            </div>

                            {/* SECTION */}
                            <div>
                                <label className="block text-left text-sm font-bold text-gray-800 mb-1">
                                    Section
                                </label>

                                <input
                                    type="text"
                                    name="Section"
                                    value={formData.Section}
                                    onChange={handleChange}
                                    disabled={!isEditing && addOneButtonEnabled}
                                    tabIndex={4}
                                    className={`block w-full rounded-md px-3 py-2 text-base text-gray-900
                                    outline-1 outline-gray-300
                                    ${(!isEditing && addOneButtonEnabled)
                                            ? "bg-gray-100 cursor-not-allowed"
                                            : "bg-white"
                                        }`}
                                />
                            </div>

                            {/* SECTION CODE */}
                            <div>
                                <label className="block text-left text-sm font-bold text-gray-800 mb-1">
                                    Section Code
                                </label>

                                <input
                                    type="text"
                                    name="TDS_Section_Code"
                                    value={formData.TDS_Section_Code}
                                    onChange={handleChange}
                                    disabled={!isEditing && addOneButtonEnabled}
                                    tabIndex={5}
                                    className={`block w-full rounded-md px-3 py-2 text-base text-gray-900
                                    outline-1 outline-gray-300
                                    ${(!isEditing && addOneButtonEnabled)
                                            ? "bg-gray-100 cursor-not-allowed"
                                            : "bg-white"
                                        }`}
                                />
                            </div>

                        </div>

                    </form>

                </div>

            </div>
        </>
    );
};

export default TDSSectionMaster;