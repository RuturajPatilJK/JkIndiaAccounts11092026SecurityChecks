import React, { useState, useEffect, useRef } from "react";
import ActionButtonGroup from "../../../Common/CommonButtons/ActionButtonGroup";
import NavigationButtons from '../../../Common/CommonButtons/NavigationButtons';
import AccountMasterHelp from "../../../Helper/AccountMasterHelp";
import { useNavigate, useLocation } from 'react-router-dom';
import axios, { isCancel } from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import { TextField, Grid, InputAdornment, Box } from '@mui/material';
import UserAuditInfo from "../../../Common/UserAuditInfo/UserAuditInfo";
import SaveUpdateSpinner from "../../../Common/Spinners/SaveUpdateSpinner";
import Swal from "sweetalert2";

const API_URL = process.env.REACT_APP_API;

var bankCode = ""
var bankName = ""
var paymentToCode = ""
var paymentToName = ""

const PaymentNote = () => {
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
    const inputRef = useRef(null)
    const [loading, setLoading] = useState(false);
    //GET values from session storage 
    const companyCode = sessionStorage.getItem('Company_Code')
    const yearCode = sessionStorage.getItem('Year_Code')
    const username = sessionStorage.getItem("username");

    const navigate = useNavigate();
    const location = useLocation();

    const changeNoRef = useRef(null);
    const selectedRecord = location.state?.selectedRecord;
    const permissions = location.state?.permissionsData;

    const initialFormData = {
        doc_no: '',
        doc_date: new Date().toISOString().split("T")[0],
        bank_ac: '',
        payment_to: '',
        amount: '',
        narration: '',
        Company_Code: companyCode,
        Year_Code: yearCode,
        Created_By: '',
        Modified_By: '',
        ba: '',
        pt: '',
    }
    const [formData, setFormData] = useState(initialFormData);
    const [bankAc, setBank] = useState('')
    const [paymentTo, setPaymentTo] = useState('')

    useEffect(() => {
        if (isCancel) {
            if (changeNoRef.current) {
                changeNoRef.current.focus();
            }
        }
    }, [isEditing, isCancel]);

    // Handle change for all inputs
    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData(prevState => {
            const updatedFormData = { ...prevState, [name]: value };
            return updatedFormData;
        });
    };

    const handleDateChange = (event, fieldName) => {
        setFormData((prevFormData) => ({
            ...prevFormData,
            [fieldName]: event.target.value,
        }));
    };

    const handleBankAc = (code, accoid) => {
        setBank(code);
        setFormData({
            ...formData,
            bank_ac: code,
            ba: accoid,
        });
    };

    const handlePaymentTo = (code, accoid) => {
        setPaymentTo(code);
        setFormData({
            ...formData,
            payment_to: code,
            pt: accoid,
        });
    };

    const fetchLastRecord = () => {
        fetch(`${API_URL}/getNextDocNo_PaymentNote?Company_Code=${companyCode}&Year_Code=${yearCode}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch last record');
                }
                return response.json();
            })
            .then(data => {
                setFormData(prevState => ({
                    ...prevState,
                    doc_no: data.next_doc_no
                }));
            })
            .catch(error => {
                console.error('Error fetching last record:', error);
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
        setFormData(initialFormData)
        paymentToCode = ""
        paymentToName = ""
        bankCode = ""
        bankName = ""
        setTimeout(() => {
            inputRef.current?.focus();
        }, 0);
    }

    const handleSaveOrUpdate = () => {
        setLoading(true);
        if (isEditMode) {
            axios
                .put(
                    `${API_URL}/update-PaymentNote`, { ...formData, Modified_By: username }
                )
                .then((response) => {
                    Swal.fire({
                        title: "Success!",
                        text: "Record Updated Successfully!",
                        icon: "success",
                        confirmButtonText: "OK"
                    });
                    setTimeout(() => {
                        window.location.reload()
                    }, 1000)

                    setIsEditMode(false);
                    setAddOneButtonEnabled(true);
                    setEditButtonEnabled(true);
                    setDeleteButtonEnabled(true);
                    setBackButtonEnabled(true);
                    setSaveButtonEnabled(false);
                    setCancelButtonEnabled(false);
                    setUpdateButtonClicked(true);
                    setIsEditing(false);
                    setLoading(false);
                })
                .catch((error) => {
                    handleCancel();
                    console.error("Error updating data:", error);
                    setLoading(false);
                });
        } else {
            axios
                .post(`${API_URL}/insert-PaymentNote`, { ...formData, Created_By: username })
                .then((response) => {
                    Swal.fire({
                        title: "Success!",
                        text: "Record Created Successfully!",
                        icon: "success",
                        confirmButtonText: "OK"
                    });
                    setTimeout(() => {
                        window.location.reload()
                    }, 1000)

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
        axios.get(`${API_URL}/getLast_PaymentNote?Company_Code=${companyCode}&Year_Code=${yearCode}`)
            .then((response) => {
                const data = response.data;
                if (response.data && !response.data.error) {
                    paymentToName = data.paymentNoteLabels.length > 0 ? data.paymentNoteLabels[0].PaymentToName
                        : '';
                    bankName = data.paymentNoteLabels.length > 0 ? data.paymentNoteLabels[0].BankCashName : '';
                    paymentToCode = data.lastPaymentNoteData.payment_to
                    bankCode = data.lastPaymentNoteData.bank_ac

                    setFormData({
                        ...formData,
                        ...data.lastPaymentNoteData,
                    });
                }
                else if (response.data.error) {
                    toast.error(response.data.error);
                }
            })
            .catch((error) => {
                console.error("Error fetching latest data for edit:", error);
                Swal.fire({
                    title: "Error",
                    text: "No Record Found!",
                    icon: "error",
                    confirmButtonText: "OK"
                });
                return;
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
        try {
            const result = await Swal.fire({
                title: "Are you sure?",
                text: `Do you really want to delete Doc No: ${formData.doc_no}?`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#d33",
                cancelButtonColor: "#3085d6",
                confirmButtonText: "Yes, delete it!",
                cancelButtonText: "Cancel",
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

                const deleteApiUrl = `${API_URL}/delete-PaymentNote?doc_no=${formData.doc_no}&Company_Code=${companyCode}&Year_Code=${yearCode}`;
                const response = await axios.delete(deleteApiUrl);

                if (response.status === 200 && response.data) {
                    Swal.fire({
                        title: "Deleted!",
                        text: "Record deleted successfully!",
                        icon: "success",
                        confirmButtonText: "OK",
                    });
                    handleCancel();
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
                text: "An unexpected error occurred.",
                icon: "error",
                confirmButtonText: "OK",
            });
        }
    };


    const handleBack = () => {
        navigate("/PaymentNote-utility")
    }

    //Handle Record DoubleCliked in Utility Page Show that record for Edit
    const handlerecordDoubleClicked = async () => {
        try {
            const response = await axios.get(`${API_URL}/PaymentNoteById?Company_Code=${companyCode}&Year_Code=${yearCode}&doc_no=${selectedRecord.doc_no}`);
            if (response.data && !response.data.error) {
                const data = response.data;
                paymentToName = data.paymentNoteLabels.length > 0 ? data.paymentNoteLabels[0].PaymentToName : '';
                bankName = data.paymentNoteLabels.length > 0 ? data.paymentNoteLabels[0].BankCashName : '';
                paymentToCode = data.payment_Note_Data_By_Id.payment_to;
                bankCode = data.payment_Note_Data_By_Id.bank_ac;

                setFormData({
                    ...formData,
                    ...data.payment_Note_Data_By_Id,
                });
                setIsEditing(false);
            } else if (response.data.error) {
                toast.error(response.data.error);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
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
    }

    useEffect(() => {
        if (selectedRecord) {
            handlerecordDoubleClicked();
        } else {
            handleAddOne()
        }
    }, [selectedRecord]);

    //change No functionality to get that particular record
    const handleKeyDown = async (event) => {
        if (event.key === 'Tab') {
            const changeNoValue = event.target.value;
            try {
                const response = await axios.get(`${API_URL}/PaymentNoteById?Company_Code=${companyCode}&Year_Code=${yearCode}&doc_no=${changeNoValue}`);
                if (response.data && !response.data.error) {
                    const data = response.data;
                    paymentToName = data.paymentNoteLabels.length > 0 ? data.paymentNoteLabels[0].PaymentToName : '';
                    bankName = data.paymentNoteLabels.length > 0 ? data.paymentNoteLabels[0].BankCashName : '';
                    paymentToCode = data.payment_Note_Data_By_Id.payment_to;
                    bankCode = data.payment_Note_Data_By_Id.bank_ac;

                    setFormData({
                        ...formData,
                        ...data.payment_Note_Data_By_Id,
                    });
                    setIsEditing(false);
                } else if (response.data.error) {
                    toast.error(response.data.error);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                toast.error(error.response?.data?.error || "An unexpected error occurred while fetching the data.");
            }
        }
    };

    //Navigation Buttons
    const handleFirstButtonClick = async () => {
        try {
            const response = await axios.get(`${API_URL}/getFirst_PaymentNote?Company_Code=${companyCode}&Year_Code=${yearCode}`);
            if (response.data && !response.data.error) {
                const data = response.data;
                paymentToName = data.paymentNoteLabels.length > 0 ? data.paymentNoteLabels[0].PaymentToName : '';
                bankName = data.paymentNoteLabels.length > 0 ? data.paymentNoteLabels[0].BankCashName : '';
                paymentToCode = data.firstPaymentNoteData.payment_to;
                bankCode = data.firstPaymentNoteData.bank_ac;

                setFormData({
                    ...formData,
                    ...data.firstPaymentNoteData,
                });
                setIsEditing(false);
            } else if (response.data.error) {
                toast.error(response.data.error);
            }
        } catch (error) {
            console.error("Error during API call:", error);
        }
    };

    const handlePreviousButtonClick = async () => {
        try {
            const response = await axios.get(`${API_URL}/getPrevious_PaymentNote?Company_Code=${companyCode}&Year_Code=${yearCode}&doc_no=${formData.doc_no}`);
            if (response.data && !response.data.error) {
                const data = response.data;
                paymentToName = data.paymentNoteLabels.length > 0 ? data.paymentNoteLabels[0].PaymentToName : '';
                bankName = data.paymentNoteLabels.length > 0 ? data.paymentNoteLabels[0].BankCashName : '';
                paymentToCode = data.previousPaymentNoteData.payment_to;
                bankCode = data.previousPaymentNoteData.bank_ac;

                setFormData({
                    ...formData,
                    ...data.previousPaymentNoteData,
                });
                setIsEditing(false);
            } else if (response.data.error) {
                toast.error(response.data.error);
            }
        } catch (error) {
            console.error("Error during API call:", error);
        }
    };

    const handleNextButtonClick = async () => {
        try {
            const response = await axios.get(`${API_URL}/getNext_PaymentNote?Company_Code=${companyCode}&Year_Code=${yearCode}&doc_no=${formData.doc_no}`);
            if (response.data && !response.data.error) {
                const data = response.data;
                paymentToName = data.paymentNoteLabels.length > 0 ? data.paymentNoteLabels[0].PaymentToName : '';
                bankName = data.paymentNoteLabels.length > 0 ? data.paymentNoteLabels[0].BankCashName : '';
                paymentToCode = data.nextPaymentNoteData.payment_to;
                bankCode = data.nextPaymentNoteData.bank_ac;

                setFormData({
                    ...formData,
                    ...data.nextPaymentNoteData,
                });
                setIsEditing(false);
            } else if (response.data.error) {
                toast.error(response.data.error);
            }
        } catch (error) {
            console.error("Error during API call:", error);
        }
    };

    //Input feild validation function.
    const validateNumericInput = (e) => {
        e.target.value = e.target.value.replace(/[^0-9.]/g, '');
    };

    return (
        <>
            <UserAuditInfo
                createdBy={formData.Created_By}
                modifiedBy={formData.Modified_By}
                title={"Payment Note"}
            />
            <div style={{ marginTop: "40px" }}>
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
                />
                <div>
                    <NavigationButtons
                        handleFirstButtonClick={handleFirstButtonClick}
                        handlePreviousButtonClick={handlePreviousButtonClick}
                        handleNextButtonClick={handleNextButtonClick}
                        handleLastButtonClick={handleCancel}
                        highlightedButton={highlightedButton}
                        isEditing={isEditing}
                        isFirstRecord={formData.Company_Code === 1}
                    />
                </div>
            </div>

            {/* <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexDirection: 'column',
                    padding: 2,
                }}
            >
                <form>
                    <Grid container spacing={2} direction="column" alignItems="center">
                        <Grid item xs={12}>
                            <TextField
                                label="Change No"
                                variant="outlined"
                                autoComplete="off"
                                fullWidth
                                value={formData.changeNo}
                                onChange={handleChange}
                                onKeyDown={handleKeyDown}
                                name="changeNo"
                                inputRef={changeNoRef}
                                disabled={!addOneButtonEnabled}
                                sx={{ width: 300 }}
                                size="small"
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                label="Entry No"
                                autoComplete="off"
                                variant="outlined"
                                fullWidth
                                value={formData.doc_no}
                                disabled
                                sx={{ width: 300 }}
                                size="small"
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                label="Date"
                                variant="outlined"
                                type="date"
                                autoComplete="off"
                                fullWidth
                                value={formData.doc_date}
                                onChange={(e) => handleDateChange(e, 'doc_date')}
                                disabled={!isEditing && addOneButtonEnabled}
                                inputRef={inputRef}
                                sx={{ width: 300 }}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                size="small"
                            />
                        </Grid>

                        <Grid container spacing={1} justifyContent="center" alignItems="center">
                            <div className="otherpurchase-row" style={{ marginTop: "20px", marginLeft: "100px" }}>
                                <label htmlFor="bank_ac">Cash/Bank :</label>
                                <div className="otherpurchase-formgroup-item">
                                    <AccountMasterHelp
                                        onAcCodeClick={handleBankAc}
                                        CategoryName={bankName}
                                        CategoryCode={bankCode}
                                        name="bank_ac"
                                        Ac_type={[]}
                                        disabledFeild={!isEditing && addOneButtonEnabled}
                                    />
                                </div>
                            </div>
                        </Grid>

                        <Grid container spacing={1} justifyContent="center" alignItems="center">
                            <div className="otherpurchase-row" style={{ marginTop: "20px", marginLeft: "100px" }}>
                                <label htmlFor="payment_to">Payment To :</label>
                                <div className="otherpurchase-formgroup-item">
                                    <AccountMasterHelp
                                        onAcCodeClick={handlePaymentTo}
                                        CategoryName={paymentToName}
                                        CategoryCode={paymentToCode}
                                        name="payment_to"
                                        Ac_type={[]}
                                        disabledFeild={!isEditing && addOneButtonEnabled}
                                    />
                                </div>
                            </div>
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                label="Amount"
                                variant="outlined"
                                autoComplete="off"
                                fullWidth
                                value={formData.amount}
                                onChange={handleChange}
                                name="amount"
                                disabled={!isEditing && addOneButtonEnabled}
                                sx={{ width: 300 }}
                                inputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">$</InputAdornment>
                                    ),
                                    inputMode: 'decimal',
                                    pattern: '[0-9]*[.,]?[0-9]+',
                                    onInput: validateNumericInput,
                                }}
                                size="small"
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                label="Narration"
                                variant="outlined"
                                autoComplete="off"
                                fullWidth
                                value={formData.narration}
                                onChange={handleChange}
                                name="narration"
                                disabled={!isEditing && addOneButtonEnabled}
                                sx={{ width: 300 }}
                            />
                        </Grid>
                    </Grid>
                </form>
                {loading && (
                    <div className="loading-overlay">
                        <div className="spinner-container">
                            <SaveUpdateSpinner />
                        </div>
                    </div>
                )}
            </Box> */}


            <div className="flex flex-col items-center justify-center p-4">
                <form className="w-full max-w-sm space-y-4">

                    {[
                        {
                            label: "Change No",
                            id: "changeNo",
                            type: "text",
                            value: formData.changeNo,
                            onChange: handleChange,
                            disabled: !addOneButtonEnabled,
                            ref: changeNoRef,
                            onKeyDown: handleKeyDown,
                        },
                        {
                            label: "Entry No",
                            id: "doc_no",
                            type: "text",
                            value: formData.doc_no,
                            disabled: true,
                        },
                        {
                            label: "Date",
                            id: "doc_date",
                            type: "date",
                            value: formData.doc_date,
                            onChange: (e) => handleDateChange(e, 'doc_date'),
                            disabled: !isEditing && addOneButtonEnabled,
                            ref: inputRef,
                        }
                    ].map(({ label, id, type, value, onChange, disabled, ref, onKeyDown }) => (
                        <div key={id} className="flex items-center gap-4">
                            <label htmlFor={id} className="w-28 text-sm font-bold text-gray-900 text-left">
                                {label}
                            </label>
                            <input
                                type={type}
                                id={id}
                                name={id}
                                value={value}
                                onChange={onChange}
                                disabled={disabled}
                                ref={ref}
                                onKeyDown={onKeyDown}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring focus:ring-blue-500 disabled:bg-gray-100"
                                autoComplete="off"
                            />
                        </div>
                    ))}

                    {/* Cash/Bank */}
                    <Grid container justifyContent="center" alignItems="center">
                        <div className="otherpurchase-row" style={{ marginLeft: "20px" }} >
                            <label htmlFor="amount" className="w-28 text-sm font-medium text-gray-900">
                                Cash/Bank
                            </label>
                            <div className="otherpurchase-formgroup-item">
                                <AccountMasterHelp
                                    onAcCodeClick={handleBankAc}
                                    CategoryName={bankName}
                                    CategoryCode={bankCode}
                                    name="bank_ac"
                                    Ac_type={[]}
                                    disabledFeild={!isEditing && addOneButtonEnabled}
                                />
                            </div>
                        </div>
                    </Grid>

                    <Grid container justifyContent="center" alignItems="center">
                        <div className="otherpurchase-row" style={{ marginLeft: "20px" }} >
                            <label htmlFor="amount" className="w-28 text-sm font-medium text-gray-900">
                                Payment To
                            </label>
                            <div className="otherpurchase-formgroup-item" >
                                <AccountMasterHelp
                                    onAcCodeClick={handlePaymentTo}
                                    CategoryName={paymentToName}
                                    CategoryCode={paymentToCode}
                                    name="payment_to"
                                    Ac_type={[]}
                                    disabledFeild={!isEditing && addOneButtonEnabled}
                                />
                            </div>
                        </div>
                    </Grid>
                    <div className="flex items-center gap-4">
                        <label htmlFor="amount" className="w-28 text-sm font-bold text-gray-900 pt-2 text-left">
                            Amount
                        </label>
                        <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span>
                            <input
                                type="text"
                                name="amount"
                                id="amount"
                                value={formData.amount}
                                onChange={handleChange}
                                disabled={!isEditing && addOneButtonEnabled}
                                inputMode="decimal"
                                pattern="[0-9]*[.,]?[0-9]+"
                                onInput={validateNumericInput}
                                className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring focus:ring-blue-500 disabled:bg-gray-100"
                                autoComplete="off"
                            />
                        </div>
                    </div>

                    {/* Narration - as a textarea and last field */}
                    <div className="flex items-start gap-4">
                        <label
                            htmlFor="narration"
                            className="w-28 text-sm font-bold text-gray-900 pt-2 text-left"
                        >
                            Narration
                        </label>
                        <textarea
                            id="narration"
                            name="narration"
                            value={formData.narration}
                            onChange={handleChange}
                            disabled={!isEditing && addOneButtonEnabled}
                            rows={3}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm resize-none focus:outline-none focus:ring focus:ring-blue-500 disabled:bg-gray-100"
                            autoComplete="off"
                        />
                    </div>
                </form>

                {loading && (
                    <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
                        <SaveUpdateSpinner />
                    </div>
                )}
            </div>
        </>);
};

export default PaymentNote
