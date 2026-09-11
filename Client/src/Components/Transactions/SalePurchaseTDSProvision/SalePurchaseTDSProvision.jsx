import React, { useEffect, useState } from 'react';
import AccountMasterHelp from "../../../Helper/AccountMasterHelp";
import SalePurchaseTDSHelper from "../../../Helper/SalePurchaseTDSHelper";
import ActionButtonGroup from "../../../Common/CommonButtons/ActionButtonGroup";
import NavigationButtons from "../../../Common/CommonButtons/NavigationButtons";
import {
    TextField,
    Select,
    MenuItem,
    InputLabel,
    FormControl,
    Grid,
    Typography,
    Box,
    Paper
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import UserAuditInfo from "../../../Common/UserAuditInfo/UserAuditInfo";
import axios from 'axios';
import Swal from "sweetalert2";

var NewNameOfAccount = '';
var NewNameOfAccountCode = '';
var NewTDSAccount = '';
var NewTDSAccountCode = '';
var NewSection = '';
var NewSectionCode = '';

const API_URL = process.env.REACT_APP_API;

function SalePurchaseTDSProvision() {
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
    const [accountCode, setAccountCode] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();


    const [formData, setFormData] = useState({
        id: '',
        nameOfAccount: '',
        tdsAccount: '',
        section: '',
        amount: '',
        narration: '',
        type: 'S',
        na: 0,
        ta: 0,
        Created_By: '',
        Modified_By: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleNameOfAccountClick = (code, accoid) => {
        setFormData({
            ...formData,
            nameOfAccount: code,
            na: accoid
        });
    }

    const handleTDSAccount = (code, accoid) => {
        setFormData({
            ...formData,
            tdsAccount: code,
            ta: accoid
        });
    }

    const handleSections = () => { }

    useEffect(() => {
        handleAddOne()
    },[])

const handleAddOne = async () => {
    try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/getNextsalepurchasetdsid`);
        
        if (response.data && response.data.data && response.data.data.next_id !== undefined) {
            const nextId = response.data.data.next_id;

            setFormData(prev => ({
                ...prev,
                id: nextId.toString()
            }));
        }

        setAddOneButtonEnabled(false);
        setSaveButtonEnabled(true);
        setCancelButtonEnabled(true);
        setEditButtonEnabled(false);
        setDeleteButtonEnabled(false);
        setIsEditing(true);
    } catch (error) {
        console.error("Error fetching next doc ID:", error);
    } finally {
        setLoading(false);
    }
};


  const handleSaveOrUpdate = () => {
    const username = sessionStorage.getItem("username");
    if (isEditMode) {
        // UPDATE mode (PUT)
        const updatedFormData = {
            ...formData,
            Modified_By: username
        };

        axios
            .put(`${API_URL}/update-salepurchasetds?id=${formData.id}`, updatedFormData)
            .then((response) => {
                Swal.fire({
                    title: "Success!",
                    text: "Record updated successfully!",
                    icon: "success",
                    confirmButtonText: "OK"
                });

                // Reset state after update
                setIsEditMode(false);
                setAddOneButtonEnabled(true);
                setEditButtonEnabled(true);
                setDeleteButtonEnabled(true);
                setBackButtonEnabled(true);
                setSaveButtonEnabled(false);
                setCancelButtonEnabled(false);
                setUpdateButtonClicked(true);
                setIsEditing(false);
                setTimeout(() => {
                    window.location.reload();  
                }, 1000);
               
            })
            .catch((error) => {
                handleCancel();
                console.error("Error updating data:", error);
                Swal.fire({
                    title: "Error!",
                    text: "Failed to update the record.",
                    icon: "error",
                    confirmButtonText: "OK"
                });
            });
    } else {
        delete formData.id; 
        const newFormData = {
            ...formData,
            Created_By: username
        };

        axios
            .post(`${API_URL}/insert-salepurchasetds`, newFormData)
            .then((response) => {
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
                setBackButtonEnabled(true);
                setSaveButtonEnabled(false);
                setCancelButtonEnabled(false);
                setUpdateButtonClicked(true);
                setIsEditing(false);
                   setTimeout(() => {
                    window.location.reload();  
                }, 1000);
            })
            .catch((error) => {
                console.error("Error saving data:", error);
                Swal.fire({
                    title: "Error!",
                    text: "Failed to create the record.",
                    icon: "error",
                    confirmButtonText: "OK"
                });
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
        setIsEditing(false);
        setIsEditMode(false);
        setSaveButtonEnabled(false);
        setCancelButtonEnabled(false);
        setAddOneButtonEnabled(true);
        setEditButtonEnabled(true);
        setDeleteButtonEnabled(true);
        setBackButtonEnabled(true);
    };

    const handleDelete = async () => {
        setIsEditMode(false);
        setAddOneButtonEnabled(true);
        setEditButtonEnabled(true);
        setDeleteButtonEnabled(true);
        setBackButtonEnabled(true);
        setSaveButtonEnabled(false);
        setCancelButtonEnabled(false);
    };

    const handleBack = () => {
        navigate("/sale-purchase-tds-utility");
    };


    const handlerecordDoubleClicked = async () => {

    };


    const handleFirstButtonClick = async () => {

    };

    const handlePreviousButtonClick = async () => {

    };

    const handleNextButtonClick = async () => {

    };

    const handleLastButtonClick = async () => {

    };


    return (
        <>
            <UserAuditInfo
                createdBy={formData.Created_By}
                modifiedBy={formData.Modified_By}
                title={"Sale Purchase TDS Provision"}
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
                //   permissions={permissions}
                />
                <div>
                    <NavigationButtons
                        handleFirstButtonClick={handleFirstButtonClick}
                        handlePreviousButtonClick={handlePreviousButtonClick}
                        handleNextButtonClick={handleNextButtonClick}
                        handleLastButtonClick={handleLastButtonClick}
                        highlightedButton={highlightedButton}
                        isEditing={isEditing}
                    />
                </div>
            </div>

            <Box display="flex" justifyContent="center" mt={5}>
                <Paper elevation={3} sx={{ padding: 4, maxWidth: 700, width: '100%' }}>
                    <Grid container spacing={2} alignItems="center" mt={1}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Doc No"
                                name="id"
                                variant="outlined"
                                size="small"
                                value={formData.id}
                                onChange={handleChange}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Type</InputLabel>
                                <Select
                                    name="type"
                                    label="Type"
                                    value={formData.type}
                                    onChange={handleChange}
                                >
                                    <MenuItem value="S">Sale</MenuItem>
                                    <MenuItem value="P">Purchase</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>

                    <Grid container spacing={2} alignItems="center" mt={1}>
                        <Grid item xs={4} sm={3} md={3}>
                            <Typography variant="body1" fontWeight="bold">
                                Name Of Account:
                            </Typography>
                        </Grid>

                        <Grid item xs={8} sm={9} md={9}>
                            <AccountMasterHelp
                                name="NameOfAccount"
                                onAcCodeClick={handleNameOfAccountClick}
                                CategoryName={NewNameOfAccount}
                                CategoryCode={NewNameOfAccountCode}
                                tabIndex={3}
                                Ac_type={[]}
                                sx={{ width: '100%' }}
                            />
                        </Grid>
                    </Grid>

                    <Grid container spacing={2} alignItems="center" mt={1}>
                        <Grid item xs={4} sm={3} md={3}>
                            <Typography variant="body1" fontWeight="bold">
                                TDS A/C:
                            </Typography>
                        </Grid>
                        <Grid item xs={8} sm={9} md={9}>
                            <AccountMasterHelp
                                name="TDS_ac"
                                onAcCodeClick={handleTDSAccount}
                                CategoryName={NewTDSAccount}
                                CategoryCode={NewTDSAccountCode}
                                tabIndex={3}
                                Ac_type={[]}
                                sx={{ width: '100%' }}
                            />
                        </Grid>
                    </Grid>

                    <Grid container spacing={2} alignItems="center" mt={1}>
                        <Grid item xs={4} sm={3} md={3}>
                            <Typography variant="body1" fontWeight="bold">
                                Section:
                            </Typography>
                        </Grid>
                        <Grid item xs={8} sm={9} md={9}>
                            <SalePurchaseTDSHelper
                                name="sections"
                                onAcCodeClick={handleSections}
                                CategoryName=""
                                CategoryCode=""
                                tabIndex={3}
                                Ac_type={[]}
                                sx={{ width: '100%' }}
                            />
                        </Grid>
                    </Grid>

                    <Grid container spacing={2} alignItems="center" mt={1}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Amount"
                                name="amount"
                                variant="outlined"
                                size="small"
                                type="number"
                                value={formData.amount}
                                onChange={handleChange}
                            />
                        </Grid>
                    </Grid>

                    <Grid container spacing={2} alignItems="center" mt={1}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Narration"
                                name="narration"
                                variant="outlined"
                                size="small"
                                multiline
                                rows={3}
                                value={formData.narration}
                                onChange={handleChange}
                            />
                        </Grid>
                    </Grid>
                </Paper>
            </Box>
        </>
    );
}

export default SalePurchaseTDSProvision;