import React, { useState, useEffect, useRef } from "react";
import ActionButtonGroup from "../../../Common/CommonButtons/ActionButtonGroup";
import NavigationButtons from "../../../Common/CommonButtons/NavigationButtons";
import AccountMasterHelp from "../../../Helper/AccountMasterHelp";
import { useNavigate, useLocation } from "react-router-dom";
import axios, { isCancel } from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import UserAuditInfo from "../../../Common/UserAuditInfo/UserAuditInfo"
import {
  TextField,
  Grid,
  Box,
  TextareaAutosize,
} from '@mui/material';
import SaveUpdateSpinner from "../../../Common/Spinners/SaveUpdateSpinner";
import Swal from "sweetalert2";

const API_URL = process.env.REACT_APP_API;

var partyCode = "";
var partyName = "";
var unitCode = "";
var unitName = "";

const Letter = () => {
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
  const companyCode = sessionStorage.getItem("Company_Code");
  const yearCode = sessionStorage.getItem("Year_Code");
  const navigate = useNavigate();
  const [party_Name, setPartyName] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const isDisabled = !isEditing && addOneButtonEnabled;

  const acCodeRef = useRef(null);
  const changeNoRef = useRef(null);
  //In utility page record doubleClicked that recod show for edit functionality
  const location = useLocation();
  const selectedRecord = location.state?.selectedRecord;
  const initialFormData = {
    DOC_NO: "",
    DOC_DATE: new Date().toISOString().split("T")[0],
    AC_CODE: 0.0,
    AC_NAME: "",
    ADDRESS: "",
    CITY: "",
    PINCODE: "",
    KIND_ATT: "",
    SUBJECT: "",
    REF_NO: "",
    REF_DT: new Date().toISOString().split("T")[0],
    MATTER: "",
    AUTHORISED_PERSON: "",
    DESIGNATION: "",
    Company_Code: parseInt(companyCode),
    Year_Code: parseInt(yearCode),
    Branch_Code: 0.0,
    Created_By: "",
    Modified_By: "",
  };
  const [formData, setFormData] = useState(initialFormData);

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
    setFormData((prevState) => {
      const updatedFormData = { ...prevState, [name]: value };
      return updatedFormData;
    });
  };

  const handleParty = (code, accoid, name) => {
    setParty(code);
    setPartyName(name);
    setFormData({
      ...formData,
      AC_CODE: code,
      AC_NAME: name,
    });
  };

  const fetchLastRecord = () => {
    fetch(
      `${API_URL}/get-next-letter-no?Company_Code=${companyCode}&Year_Code=${yearCode}`
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch last record");
        }
        return response.json();
      })
      .then((data) => {
        setFormData((prevState) => ({
          ...prevState,
          DOC_NO: parseInt(data.next_doc_no),
        }));
      })
      .catch((error) => {
        console.error("Error fetching last record:", error);
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
    setFormData(initialFormData);
    partyCode = "";
    partyName = "";
    setTimeout(() => {
      acCodeRef.current?.focus();
    }, 0);
  };

  const handleSaveOrUpdate = () => {
    setIsLoading(true);
    delete formData.id;

    if (isEditMode) {
      axios
        .put(`${API_URL}/update-Letter`, formData)
        .then((response) => {
          Swal.fire({
            title: "Success!",
            text: "Record Updated Successfully!",
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
          setIsLoading(false);
        })
        .catch((error) => {
          handleCancel();
          console.error("Error updating data:", error);
        });
    } else {
      axios
        .post(`${API_URL}/insert-Letter`, formData)
        .then((response) => {
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
          setUpdateButtonClicked(true);
          setIsEditing(false);
          setIsLoading(false);
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
    axios
      .get(
        `${API_URL}/getLast_Letter?Company_Code=${companyCode}&Year_Code=${yearCode}`
      )
      .then((response) => {
        const data = response.data;
        partyCode = data.lastLetterData.AC_CODE;

        setFormData({
          ...formData,
          ...data.lastLetterData,
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
    try {
      const result = await Swal.fire({
        title: "Are you sure?",
        text: `Do you really want to delete Doc No: ${formData.DOC_NO}?`,
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

        const deleteApiUrl = `${API_URL}/delete-Letter?DOC_NO=${formData.DOC_NO}&Company_Code=${companyCode}&Year_Code=${yearCode}`;
        const deleteResponse = await axios.delete(deleteApiUrl);

        if (deleteResponse.status === 200) {
          if (deleteResponse.data) {
            Swal.fire({
              title: "Deleted!",
              text: "Record deleted successfully!",
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
        console.log("Deletion cancelled");
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

  const handleBack = () => {
    navigate("/letter");
  };

  //Handle Record DoubleCliked in Utility Page Show that record for Edit
  const handlerecordDoubleClicked = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/getByDocNo_Letter?Company_Code=${companyCode}&DOC_NO=${selectedRecord.DOC_NO}&Year_Code=${yearCode}`
      );
      const data = response.data;
      partyCode = data.letterData.AC_CODE;

      setFormData({
        ...formData,
        ...data.letterData,
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error fetching data:", error);
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
  };

  useEffect(() => {
    if (selectedRecord) {
      handlerecordDoubleClicked();
    } else {
      handleAddOne();
    }
  }, [selectedRecord]);

  //change No functionality to get that particular record
  const handleKeyDown = async (event) => {
    if (event.key === "Tab") {
      const inputName = event.target.name;
      const inputValue = event.target.value;

      let apiUrl = `${API_URL}/getByDocNo_Letter?Company_Code=${companyCode}&DOC_NO=${inputValue}&Year_Code=${yearCode}`;

      try {
        const response = await axios.get(apiUrl);
        const data = response.data;
        partyCode = data.letterData.AC_CODE;

        if (inputName === "changeNo") {
          setFormData({
            ...formData,
            ...data.letterData,
          });
        } else if (inputName === "copyLetterNo") {
          setFormData({
            ...formData,
            ...data.letterData,
            DOC_NO: formData.DOC_NO,
          });
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }
  };

  //Navigation Buttons
  const handleFirstButtonClick = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/getFirst_Letter?Company_Code=${companyCode}&Year_Code=${yearCode}`
      );
      const data = response.data;
      partyCode = data.firstLetterData.AC_CODE;

      setFormData({
        ...formData,
        ...data.firstLetterData,
      });
    } catch (error) {
      console.error("Error during API call:", error);
    }
  };

  const handlePreviousButtonClick = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/getPrevious_Letter?Company_Code=${companyCode}&Year_Code=${yearCode}&DOC_NO=${formData.DOC_NO}`
      );
      const data = response.data;
      partyCode = data.previousLetterData.AC_CODE;

      setFormData({
        ...formData,
        ...data.previousLetterData,
      });
    } catch (error) {
      console.error("Error during API call:", error);
    }
  };

  const handleNextButtonClick = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/getNext_Letter?Company_Code=${companyCode}&Year_Code=${yearCode}&DOC_NO=${formData.DOC_NO}`
      );
      const data = response.data;
      partyCode = data.nextLetterData.AC_CODE;

      setFormData({
        ...formData,
        ...data.nextLetterData,
      });
    } catch (error) {
      console.error("Error during API call:", error);
    }
  };

  return (
    <>
      <UserAuditInfo
        createdBy={formData.Created_By}
        modifiedBy={formData.Modified_By}
        title={"Letter"}
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

      <div >
        <form>
          <Box sx={{ p: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={1}>
                <TextField
                  label="Change No"
                  id="changeNo"
                  name="changeNo"
                  autoComplete="off"
                  inputRef={changeNoRef}
                  onKeyDown={handleKeyDown}
                  disabled={!addOneButtonEnabled}
                  fullWidth
                  size="small"
                />
              </Grid>

              <Grid item xs={12} sm={1}>
                <TextField
                  label="Letter No"
                  id="DOC_NO"
                  name="DOC_NO"
                  autoComplete="off"
                  value={formData.DOC_NO}
                  onChange={handleChange}
                  disabled
                  fullWidth
                  size="small"
                />
              </Grid>

              <Grid item xs={12} sm={1}>
                <TextField
                  label="From Letter No"
                  id="copyLetterNo"
                  name="copyLetterNo"
                  autoComplete="off"
                  inputRef={acCodeRef}
                  onKeyDown={handleKeyDown}
                  disabled={!saveButtonEnabled}
                  fullWidth
                  size="small"
                />
              </Grid>

              <Grid item xs={12} sm={1}>
                <TextField
                  label="Date"
                  id="DOC_DATE"
                  name="DOC_DATE"
                  type="date"
                  autoComplete="off"
                  value={formData.DOC_DATE}
                  onChange={handleChange}
                  disabled
                  fullWidth
                  size="small"
                  InputLabelProps={{
                    style: { fontSize: '12px' },
                  }}
                  InputProps={{
                    style: { fontSize: '12px', height: '40px' },
                  }}
                />
              </Grid>
            </Grid>

            <div className="SugarPurchaseBill-row">
              <label htmlFor="AC_CODE" className="SugarPurchaseBilllabel" >
                Party :
              </label>
              <div >
                <div >
                  <AccountMasterHelp
                    key={Date.now()}
                    onAcCodeClick={handleParty}
                    CategoryName={null}
                    CategoryCode={party || partyCode}
                    name="AC_CODE"
                    disabledFeild={!isEditing && addOneButtonEnabled}
                  />
                </div>
              </div>

              <TextField
                label="Party Name"
                id="AC_NAME"
                name="AC_NAME"
                value={party_Name || formData.AC_NAME}
                onChange={(e) => setPartyName(e.target.value)}
                fullWidth
                disabled={!isEditing && addOneButtonEnabled}
                variant="outlined"
                size="small"
                sx={{ width: '62%' }}
              />
            </div>
          </Box>

          <Box sx={{ p: 2 }}>
            <Grid container spacing={1}>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Address"
                  name="ADDRESS"
                  id="ADDRESS"
                  autoComplete="off"
                  value={formData.ADDRESS}
                  onChange={handleChange}
                  disabled={isDisabled}
                  fullWidth
                  size="small"
                />
              </Grid>

              <Grid item xs={12} sm={2}>
                <TextField
                  label="City"
                  name="CITY"
                  id="CITY"
                  autoComplete="off"
                  value={formData.CITY}
                  onChange={handleChange}
                  disabled={isDisabled}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <TextField
                  label="Pincode"
                  name="PINCODE"
                  id="PINCODE"
                  autoComplete="off"
                  value={formData.PINCODE}
                  onChange={handleChange}
                  disabled={isDisabled}
                  fullWidth
                  size="small"
                />
              </Grid>

              <Grid item xs={6}>
                <TextField
                  label="Kind Attention"
                  name="KIND_ATT"
                  id="KIND_ATT"
                  autoComplete="off"
                  value={formData.KIND_ATT}
                  onChange={handleChange}
                  disabled={isDisabled}
                  fullWidth
                  size="small"
                />
              </Grid>

              <Grid item xs={12} sm={2}>
                <TextField
                  label="Reference No"
                  name="REF_NO"
                  id="REF_NO"
                  autoComplete="off"
                  value={formData.REF_NO}
                  onChange={handleChange}
                  disabled={isDisabled}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={1}>
                <TextField
                  label="Dated"
                  name="REF_DT"
                  id="REF_DT"
                  type="date"
                  autoComplete="off"
                  value={formData.REF_DT}
                  onChange={handleChange}
                  disabled={isDisabled}
                  fullWidth
                  InputLabelProps={{
                    style: { fontSize: '12px' },
                  }}
                  InputProps={{
                    style: { fontSize: '12px', height: '40px' },
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={9}>
                <TextField
                  label="Subject"
                  name="SUBJECT"
                  id="SUBJECT"
                  autoComplete="off"
                  value={formData.SUBJECT}
                  onChange={handleChange}
                  disabled={isDisabled}
                  fullWidth
                  size="small"
                />
              </Grid>

              <Grid item xs={12}>
                <TextareaAutosize
                  label="Matter"
                  id="MATTER"
                  name="MATTER"
                  autoComplete="off"
                  value={formData.MATTER}
                  onChange={handleChange}
                  disabled={isDisabled}
                  minRows={6}
                  style={{ width: '100%', padding: '10px', fontSize: '16px', borderColor: '#ccc', borderRadius: 4 }}
                />
              </Grid>
              <Grid item xs={12} sm={4} mb={20}>
                <TextField
                  label="Authorized Person"
                  name="AUTHORISED_PERSON"
                  id="AUTHORISED_PERSON"
                  autoComplete="off"
                  value={formData.AUTHORISED_PERSON}
                  onChange={handleChange}
                  disabled={isDisabled}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={4} mb={20}>
                <TextField
                  label="Designation"
                  name="DESIGNATION"
                  id="DESIGNATION"
                  autoComplete="off"
                  value={formData.DESIGNATION}
                  onChange={handleChange}
                  disabled={isDisabled}
                  fullWidth
                  size="small"
                />
              </Grid>
            </Grid>
          </Box>
        </form>
      </div>
      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner-container">
            <SaveUpdateSpinner />
          </div>
        </div>
      )}
    </>
  );
};

export default Letter;
