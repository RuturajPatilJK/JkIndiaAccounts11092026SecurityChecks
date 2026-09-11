import React, { useState, useEffect, useRef } from "react";
import ActionButtonGroup from "../../../../Common/CommonButtons/ActionButtonGroup";
import NavigationButtons from '../../../../Common/CommonButtons/NavigationButtons';
import AccountMasterHelp from "../../../../Helper/AccountMasterHelp";
import { useNavigate, useLocation } from 'react-router-dom';
import axios, { isCancel } from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Box, Container, TextField,Grid, Typography } from '@mui/material';

const API_URL = process.env.REACT_APP_API;

var partyCode = ""
var partyName = ""
var unitCode = ""
var unitName = ""

const PartyUnitMaster = () => {
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
    const [party, setParty] = useState("");
    const [unit, setUnit] = useState("");
    const companyCode = sessionStorage.getItem('Company_Code')
    const yearCode = sessionStorage.getItem('Year_Code')
    const navigate = useNavigate();

    const acCodeRef = useRef(null)
    const changeNoRef = useRef(null);
    const inputRef = useRef(null)

    const location = useLocation();
    const selectedRecord = location.state?.selectedRecord;
    const permissions = location.state?.permissionsData;

    const initialFormData = {
        unit_code: '',
        Ac_Code: '',
        Unit_name: '',
        Remarks: '',
        Company_Code: companyCode,
        Year_Code: yearCode,
        Created_By: '',
        Modified_By: '',
        ac: '',
        uc: '',

    }
    const [formData, setFormData] = useState(initialFormData);

    useEffect(() => {
        if (isEditing) {
            if (acCodeRef.current) {
                acCodeRef.current.focus();
            }
        }
        else if (isCancel) {
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

    const handleParty = (code, accoid) => {
        setParty(code);
        setFormData({
            ...formData,
            Ac_Code: code,
            ac: accoid,
        });
    };

    const handleUnit = (code, accoid) => {
        setUnit(code);
        setFormData({
            ...formData,
            Unit_name: code,
            uc: accoid,
        });
    };

    //Fetch Last record Unit code.
    const fetchLastRecord = () => {
        fetch(`${API_URL}/getNextUnitCode_PartyUnitMaster?Company_Code=${companyCode}&Year_Code=${yearCode}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch last record');
                }
                return response.json();
            })
            .then(data => {
                setFormData(prevState => ({
                    ...prevState,
                    unit_code: data.next_unit_code
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
        partyCode = "";
        partyName = "";
        unitCode = "";
        unitName = "";
        setTimeout(() => {
            inputRef.current?.focus();
          }, 0);
    }

    //Handle Save or update the record.
    const handleSaveOrUpdate = () => {
        if (isEditMode) {
            axios
                .put(
                    `${API_URL}/update-PartyUnitMaster`, formData
                )
                .then((response) => {
                    toast.success("Record update successfully!");
                    window.location.reload()
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
                .post(`${API_URL}/insert-PartyUnitMaster`, formData)
                .then((response) => {
                    toast.success("Record Create successfully!");
                    window.location.reload()
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

    //handle Edit Functionality
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

    //Fetch last record from the database.
    const handleCancel = () => {
        axios.get(`${API_URL}/getLast_PartyUnitMaster?Company_Code=${companyCode}&Year_Code=${yearCode}`)
            .then((response) => {
                const data = response.data;
                partyName = data.additionalLabels.length > 0 ? data.additionalLabels[0].partyName : '';
                unitName = data.additionalLabels.length > 0 ? data.additionalLabels[0].UnitName : '';
                partyCode = data.lastRecordData.Ac_Code
                unitCode = data.lastRecordData.Unit_name
                setFormData({
                    ...formData,
                    ...data.lastRecordData,
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
        const isConfirmed = window.confirm(`Are you sure you want to delete this Entry ${formData.unit_code}?`);

        if (isConfirmed) {
            setIsEditMode(false);
            setAddOneButtonEnabled(true);
            setEditButtonEnabled(true);
            setDeleteButtonEnabled(true);
            setBackButtonEnabled(true);
            setSaveButtonEnabled(false);
            setCancelButtonEnabled(false);
            try {
                const deleteApiUrl = `${API_URL}/delete-PartyUnitMaster?unit_code=${formData.unit_code}&Company_Code=${companyCode}&Year_Code=${yearCode}`;
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
        navigate("/PartyUnitMaster-utility")
    }

    //Handle Record DoubleCliked Functionality.
    const handlerecordDoubleClicked = async () => {
        try {
            const response = await axios.get(`${API_URL}/getByunit_code_PartyUnitMaster?Company_Code=${companyCode}&unit_code=${selectedRecord.unit_code}&Year_Code=${yearCode}`);
            const data = response.data;
            partyName = data.additionalLabels.length > 0 ? data.additionalLabels[0].partyName : '';
            unitName = data.additionalLabels.length > 0 ? data.additionalLabels[0].UnitName : '';
            partyCode = data.recordData.Ac_Code
            unitCode = data.recordData.Unit_name
            setFormData({
                ...formData,
                ...data.recordData,
            });
            setIsEditing(false);
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
          
            let changeNoValue = event.target.value;
            try {
                const response = await axios.get(`${API_URL}/getByunit_code_PartyUnitMaster?Company_Code=${companyCode}&unit_code=${changeNoValue}&Year_Code=${yearCode}`);
                const data = response.data;
                partyName = data.additionalLabels.length > 0 ? data.additionalLabels[0].partyName : '';
                unitName = data.additionalLabels.length > 0 ? data.additionalLabels[0].UnitName : '';
                partyCode = data.recordData.Ac_Code
                unitCode = data.recordData.Unit_name
                setFormData({
                    ...formData,
                    ...data.recordData,
                });
                setIsEditing(false);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        }
    };

    //Navigation Buttons
    const handleFirstButtonClick = async () => {
        try {
            const response = await axios.get(`${API_URL}/getFirst_PartyUnitMaster?Company_Code=${companyCode}&Year_Code=${yearCode}`);
            const data = response.data;
            partyName = data.additionalLabels.length > 0 ? data.additionalLabels[0].partyName : '';
            unitName = data.additionalLabels.length > 0 ? data.additionalLabels[0].UnitName : '';
            partyCode = data.firstRecordData.Ac_Code
            unitCode = data.firstRecordData.Unit_name
            setFormData({
                ...formData,
                ...data.firstRecordData,
            });
        }
        catch (error) {
            console.error("Error during API call:", error);
        }
    };

    const handlePreviousButtonClick = async () => {
        try {
            const response = await axios.get(`${API_URL}/getPrevious_PartyUnitMaster?Company_Code=${companyCode}&Year_Code=${yearCode}&unit_code=${formData.unit_code}`);
            const data = response.data;
            partyName = data.additionalLabels.length > 0 ? data.additionalLabels[0].partyName : '';
            unitName = data.additionalLabels.length > 0 ? data.additionalLabels[0].UnitName : '';
            partyCode = data.previousRecordData.Ac_Code
            unitCode = data.previousRecordData.Unit_name
            setFormData({
                ...formData,
                ...data.previousRecordData,
            });
        }
        catch (error) {
            console.error("Error during API call:", error);
        }
    };

    const handleNextButtonClick = async () => {
        try {
            const response = await axios.get(`${API_URL}/getNext_PartyUnitMaster?Company_Code=${companyCode}&Year_Code=${yearCode}&unit_code=${formData.unit_code}`);
            const data = response.data;
            partyName = data.additionalLabels.length > 0 ? data.additionalLabels[0].partyName : '';
            unitName = data.additionalLabels.length > 0 ? data.additionalLabels[0].UnitName : '';
            partyCode = data.nextRecordData.Ac_Code
            unitCode = data.nextRecordData.Unit_name
            setFormData({
                ...formData,
                ...data.nextRecordData,
            });
        }
        catch (error) {
            console.error("Error during API call:", error);
        }
    };

    return (
        <>
            <ToastContainer autoClose={500}/>
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

            <Box mt={2}>
                <NavigationButtons
                    handleFirstButtonClick={handleFirstButtonClick}
                    handlePreviousButtonClick={handlePreviousButtonClick}
                    handleNextButtonClick={handleNextButtonClick}
                    handleLastButtonClick={handleCancel}
                    highlightedButton={highlightedButton}
                    isEditing={isEditing}
                    isFirstRecord={formData.Company_Code === 1}
                />
            </Box>

            <Container >
                <Typography variant="h5" gutterBottom style={{ marginBottom: "20px" }}>
                    Party Unit Master
                </Typography>
                <form>
                    <Grid container spacing={3}>

                        <Grid item xs={6}>
                            <TextField
                                label="Change No:"
                                type="text"
                                id="changeNo"
                                name="changeNo"
                                tabIndex={1}
                                onKeyDown={handleKeyDown}
                                fullWidth
                                disabled={!addOneButtonEnabled}
                                inputRef={changeNoRef}
                                size="small"
                            />
                        </Grid>

                        <Grid item xs={6}>
                            <TextField
                                label="Entry No:"
                                type="text"
                                id="unit_code"
                                name="unit_code"
                                value={formData.unit_code}
                                tabIndex={2}
                                onChange={handleChange}
                                fullWidth
                                disabled
                                size="small"
                            />
                        </Grid>

                        <Grid item xs={2}>
                            <label htmlFor="Ac_Code">Party Code:</label>
                        </Grid>
                        <Grid item xs={9}>
                            <AccountMasterHelp
                                onAcCodeClick={handleParty}
                                CategoryName={partyName}
                                CategoryCode={partyCode}
                                name="Ac_Code"
                                Ac_type=""
                                tabIndexHelp={3}
                                disabledFeild={!isEditing && addOneButtonEnabled}
                            />
                        </Grid>

                        <Grid item xs={2}>
                            <label htmlFor="Unit_name">Unit Code:</label>
                        </Grid>
                        <Grid item xs={6}>
                            <AccountMasterHelp
                                onAcCodeClick={handleUnit}
                                CategoryName={unitName}
                                CategoryCode={unitCode}
                                name="Unit_name"
                                Ac_type=""
                                tabIndexHelp={4}
                                disabledFeild={!isEditing && addOneButtonEnabled}
                            />
                        </Grid>

                        <Grid item xs={6}>
                            <TextField
                                label="Remarks:"
                                type="text"
                                id="Remarks"
                                name="Remarks"
                                value={formData.Remarks}
                                tabIndex={5}
                                onChange={handleChange}
                                fullWidth
                                disabled={!isEditing && addOneButtonEnabled}
                                size="small"
                            />
                        </Grid>
                    </Grid>
                </form>
            </Container>
        </>);
};

export default PartyUnitMaster
