import React, { useState, useEffect } from 'react';
import ActionButtonGroup from '../../../Common/CommonButtons/ActionButtonGroup';
import NavigationButtons from "../../../Common/CommonButtons/NavigationButtons";
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { TextField, Typography, Box, Grid, Container } from '@mui/material';
import Swal from "sweetalert2";

const API_URL = process.env.REACT_APP_API;

const CreateAccountYear = () => {
    const initialFormData = {
        yearCode: '',
        Start_Date: new Date().toISOString().slice(0, 10),
        End_Date: new Date().toISOString().slice(0, 10),
        year: ""
    };
    const [formData, setFormData] = useState(initialFormData);
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
    const [isLoading, setIsLoading] = useState(false);

    const companyCode = sessionStorage.getItem('Company_Code')
    const navigate = useNavigate();

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData(prevState => {
            let updatedFormData = { ...prevState, [name]: value };

            if (name === "Start_Date") {
                const startDate = new Date(value);

                if (!isNaN(startDate.getTime())) {
                    let endDate;

                    if (startDate.getMonth() > 2 || (startDate.getMonth() === 2 && startDate.getDate() > 31)) {
                        endDate = new Date(startDate.getFullYear() + 1, 2, 31, 15);
                    } else {
                        endDate = new Date(startDate.getFullYear(), 2, 31, 15);
                    }

                    updatedFormData['End_Date'] = endDate.toISOString().split('T')[0];

                    const startYear = startDate.getFullYear();
                    const endYear = endDate.getFullYear().toString().slice(-2);
                    updatedFormData.year = `${startYear}-${endYear}`;
                } else {
                    updatedFormData['End_Date'] = '';
                    updatedFormData.year = '';
                }
            }
            return updatedFormData;
        });
    };

    const fetchAccountingYear = () => {
        fetch(`${API_URL}/get_latest_accounting_year?Company_Code=${companyCode}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch last company code');
                }
                return response.json();
            })
            .then(data => {
                if (data && data.yearCode) {
                    setFormData(prevState => ({
                        ...prevState,
                        yearCode: data.yearCode + 1
                    }));
                } else {
                    setFormData(prevState => ({
                        ...prevState,
                        yearCode: 1
                    }));
                }
            })
            .catch(error => {
                console.error('Error fetching last company code:', error);
                setFormData(prevState => ({
                    ...prevState,
                    yearCode: 1
                }));
            });
    };

    useEffect(() => {
        fetchAccountingYear();
    }, []);

    const handleAddOne = () => {
        setAddOneButtonEnabled(false);
        setSaveButtonEnabled(true);
        setCancelButtonEnabled(true);
        setEditButtonEnabled(false);
        setDeleteButtonEnabled(false);
        setIsEditing(true);
        fetchAccountingYear()
        setFormData(initialFormData)

    }

    const handleSaveOrUpdate = () => {
        if (formData.End_Date < formData.Start_Date) {
            alert("The End Date should not be before the Start Date.");
            return;
        }
        if (isEditMode) {
            axios
                .put(
                    `${API_URL}/update_accounting_year?yearCode=${formData.yearCode}&Company_Code=${companyCode}`, formData
                )
                .then((response) => {
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
                    setBackButtonEnabled(true);
                    setSaveButtonEnabled(false);
                    setCancelButtonEnabled(false);
                    setUpdateButtonClicked(true);
                    setIsEditing(false);
                })
                .catch((error) => {
                    handleCancel();
                    console.error("Error updating data:", error);
                });
        } else {
            axios
                .post(`${API_URL}/create_accounting_year?Company_Code=${companyCode}`, formData)
                .then((response) => {
                    Swal.fire({
                        title: "Success!",
                        text: "Record Created successfully!",
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
                    setUpdateButtonClicked(true);
                    setIsEditing(false);
                    navigate("/company-list")
                })
                .catch((error) => {
                    console.error("Error saving data:", error);
                });
        }
    };

    const handleEdit = () => {
        setIsEditMode(true);
        setAddOneButtonEnabled(false);
        setSaveButtonEnabled(true);
        setCancelButtonEnabled(true);
        setEditButtonEnabled(false);
        setDeleteButtonEnabled(false);
        setBackButtonEnabled(true);
        setIsEditing(true);

    };

    const handleCancel = () => {
        axios.get(`${API_URL}/get_latest_accounting_year?Company_Code=${companyCode}`)
            .then((response) => {
                const data = response.data;
                setFormData({
                    ...formData, ...data
                });
            })
            .catch((error) => {
                console.error("Error fetching latest data for edit:", error);
            });
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
        const isConfirmed = window.confirm(`Are you sure you want to delete this Accounting ${formData.yearCode}?`);

        if (isConfirmed) {
            setIsEditMode(false);
            setAddOneButtonEnabled(true);
            setEditButtonEnabled(true);
            setDeleteButtonEnabled(true);
            setBackButtonEnabled(true);
            setSaveButtonEnabled(false);
            setCancelButtonEnabled(false);

            try {
                const deleteApiUrl = `${API_URL}/delete_accounting_year?yearCode=${formData.yearCode}&Company_Code=${companyCode}`;
                const response = await axios.delete(deleteApiUrl);
                toast.success("Record deleted successfully!");
                handleCancel();

            } catch (error) {
                toast.error("Deletion cancelled");
                console.error("Error during API call:", error);
            }
        } else {
            console.log("Deletion cancelled");
        }
    };


    const handleBack = () => {
        navigate("/DashBoard")
    }

    const handleFirstButtonClick = async () => {

    };

    const handlePreviousButtonClick = async () => {

    };

    const handleNextButtonClick = async () => {

    };

    const handleLastButtonClick = async () => {
    }

    return (
        <>
            <div>
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
            <Container maxWidth="sm">
                <Box
                    component="form"
                    noValidate
                    autoComplete="off"
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 2,
                        maxWidth: 600,
                        margin: 'auto',
                        padding: 3,
                        boxShadow: 3,
                        borderRadius: 2,
                        backgroundColor: 'background.paper'
                    }}
                >
                    <Typography variant="h5" gutterBottom align="center">
                        Create Accounting Year
                    </Typography>
                    <TextField
                        label="Year Code"
                        id="yearCode"
                        name="yearCode"
                        value={formData.yearCode}
                        variant="outlined"
                        fullWidth
                        disabled
                    />
                    <TextField
                        label="Start Date"
                        type="date"
                        id="Start_Date"
                        name="Start_Date"
                        value={formData.Start_Date}
                        onChange={handleChange}
                        variant="outlined"
                        fullWidth
                        InputLabelProps={{
                            shrink: true,
                        }}
                        disabled={!isEditing && addOneButtonEnabled}
                    />
                    <TextField
                        label="End Date"
                        type="date"
                        id="End_Date"
                        name="End_Date"
                        value={formData.End_Date}
                        onChange={handleChange}
                        variant="outlined"
                        fullWidth
                        InputLabelProps={{
                            shrink: true,
                        }}
                        disabled={!isEditing && addOneButtonEnabled}
                    />
                    <TextField
                        label="Year"
                        id="year"
                        name="year"
                        value={formData.year}
                        variant="outlined"
                        fullWidth
                        disabled={!isEditing && addOneButtonEnabled}
                    />
                </Box>
            </Container>
        </>
    );
};

export default CreateAccountYear;
