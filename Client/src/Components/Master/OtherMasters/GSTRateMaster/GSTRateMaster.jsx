import React, { useState, useEffect, useRef } from 'react';
import ActionButtonGroup from '../../../../Common/CommonButtons/ActionButtonGroup';
import NavigationButtons from "../../../../Common/CommonButtons/NavigationButtons";
import { useNavigate, useLocation } from 'react-router-dom';
import './GSTRateMaster.css';
import axios from "axios";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import UserAuditInfo from "../../../../Common/UserAuditInfo/UserAuditInfo";
import Swal from "sweetalert2";
import { Box, Grid, TextField, Typography } from '@mui/material';

const API_URL = process.env.REACT_APP_API;

const GSTRateMaster = () => {
  //Fetch necessary values from the session.
  const companyCode = sessionStorage.getItem('Company_Code')
  const year_code = sessionStorage.getItem('Year_Code')
  const username = sessionStorage.getItem("username");

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
  const inputRef = useRef(null);
  const navigate = useNavigate();

  //In utility page record doubleClicked that recod show for edit functionality
  const location = useLocation();
  const selectedRecord = location.state?.selectedRecord;
  const permissions = location.state?.permissionsData;

  const initialFormData = {
    CGST: '',
    Company_Code: companyCode,
    Doc_no: '',
    GST_Name: '',
    IGST: '',
    Rate: '',
    Remark: '',
    SGST: '',
    Year_Code: year_code
  };
  const [formData, setFormData] = useState(initialFormData);

  // Handle change for all inputs
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(prevState => {
      const updatedFormData = { ...prevState, [name]: value };
      return updatedFormData;
    });
  };

  const fetchLastGSTRateDocNo = () => {
    fetch(`${API_URL}/get-GSTRateMaster-lastRecord?Company_Code=${companyCode}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch last company code');
        }
        return response.json();
      })
      .then(data => {
        setFormData(prevState => ({
          ...prevState,
          Doc_no: data.Doc_no + 1
        }));
      })
      .catch(error => {
        console.error('Error fetching last company code:', error);
      });
  };

  const handleAddOne = () => {
    setAddOneButtonEnabled(false);
    setSaveButtonEnabled(true);
    setCancelButtonEnabled(true);
    setEditButtonEnabled(false);
    setDeleteButtonEnabled(false);
    setIsEditing(true);
    fetchLastGSTRateDocNo()
    setFormData(initialFormData)
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }

  const handleSaveOrUpdate = () => {
    let updatedFormData = {
      ...formData
    }
    if (isEditMode) {
      updatedFormData = {
        ...updatedFormData,
        Modified_By: username
      }
      axios
        .put(
          `${API_URL}/update_GSTRateMaster?Company_Code=${companyCode}&Doc_no=${formData.Doc_no}`, updatedFormData
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
      updatedFormData = {
        ...updatedFormData,
        Created_By: username
      }
      axios
        .post(`${API_URL}/create_GSTRateMaster`, updatedFormData)
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
    axios.get(`${API_URL}/get-GSTRateMaster-lastRecord?Company_Code=${companyCode}`)
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
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `You won't be able to revert this Doc No : ${formData.Doc_no}`,
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

      try {
        const deleteApiUrl = `${API_URL}/delete_GSTRateMaster?Company_Code=${companyCode}&Doc_no=${formData.Doc_no}`;
        const response = await axios.delete(deleteApiUrl);
        Swal.fire({
          title: "Deleted!",
          text: "Record deleted successfully!",
          icon: "success",
          confirmButtonText: "OK",
        });
        handleCancel();

      } catch (error) {
        toast.error("Deletion cancelled");
        console.error("Error during API call:", error);
      }
    } else {
      Swal.fire({
        title: "Cancelled",
        text: "Your record is safe 🙂",
        icon: "info",
      });
    }
  };

  const handleBack = () => {
    navigate("/gst-rate-masterutility")
  }

  //Navigation Buttons 
  const handleFirstButtonClick = async () => {
    try {
      const response = await fetch(`${API_URL}/get-first-GSTRateMaster`);
      if (response.ok) {
        const data = await response.json();
        const firstUserCreation = data[0];

        setFormData({
          ...formData, ...firstUserCreation,

        });

      } else {
        console.error("Failed to fetch first tender data:", response.status, response.statusText);
      }
    } catch (error) {
      console.error("Error during API call:", error);
    }
  };

  const handlePreviousButtonClick = async () => {
    try {
      const response = await fetch(`${API_URL}/get-previous-GSTRateMaster?Doc_no=${formData.Doc_no}`);

      if (response.ok) {
        const data = await response.json();
        setFormData({
          ...formData, ...data,
        });

      } else {
        console.error("Failed to fetch previous tender data:", response.status, response.statusText);
      }
    } catch (error) {
      console.error("Error during API call:", error);
    }
  };

  const handleNextButtonClick = async () => {
    try {
      const response = await fetch(`${API_URL}/get-next-GSTRateMaster?Doc_no=${formData.Doc_no}`);

      if (response.ok) {
        const data = await response.json();
        setFormData({
          ...formData, ...data.nextSelectedRecord

        });
      } else {
        console.error("Failed to fetch next company creation data:", response.status, response.statusText);
      }
    } catch (error) {
      console.error("Error during API call:", error);
    }
  };

  const handleLastButtonClick = async () => {
    try {
      const response = await fetch(`${API_URL}/get-last-GSTRateMaster`);
      if (response.ok) {
        const data = await response.json();
        const last_Navigation = data[0];
        setFormData({
          ...formData, ...last_Navigation,
        });
      } else {
        console.error("Failed to fetch first tender data:", response.status, response.statusText);
      }
    } catch (error) {
      console.error("Error during API call:", error);
    }
  }

  //Handle Record DoubleCliked in Utility Page Show that record for Edit
  const handlerecordDoubleClicked = async () => {
    try {
      const response = await axios.get(`${API_URL}/get-GSTRateMasterSelectedRecord?Company_Code=${companyCode}&Doc_no=${selectedRecord.Doc_no}`);
      const data = response.data;
      setFormData({
        ...formData, ...data
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
      const changeNoValue = event.target.value;
      try {
        const response = await axios.get(`${API_URL}/get-GSTRateMasterSelectedRecord?Company_Code=${companyCode}&Doc_no=${changeNoValue}`);
        const data = response.data;
        setFormData(data);
        setIsEditing(false);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    }
  };

  return (
    <>
      <UserAuditInfo
        createdBy={formData.Created_By}
        modifiedBy={formData.Modified_By}
        title={"GST Rate Master"}
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
          nextTabIndex={8}
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
      <div >
        {/* <Box
          component="form"
          noValidate
          autoComplete="off"
          sx={{ maxWidth: 600, margin: '0 auto', padding: 4, backgroundColor: '#f9f9f9', borderRadius: 2, boxShadow: 3 }}
        >
          <Typography variant="h5" component="h2" gutterBottom sx={{ textAlign: 'center', fontWeight: 600 }}>
            GST Rate Master
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Change No"
                name="changeNo"
                onKeyDown={handleKeyDown}
                disabled={!addOneButtonEnabled}
                inputProps={{ tabIndex: 1 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Doc No"
                name="Doc_no"
                value={formData.Doc_no}
                onChange={handleChange}
                disabled
                inputProps={{ tabIndex: 2 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="GST Name"
                name="GST_Name"
                value={formData.GST_Name}
                onChange={handleChange}
                inputRef={inputRef}
                disabled={!isEditing && addOneButtonEnabled}
                inputProps={{ tabIndex: 3 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Rate"
                name="Rate"
                type="number"
                value={formData.Rate}
                onChange={handleChange}
                disabled={!isEditing && addOneButtonEnabled}
                inputProps={{ tabIndex: 4 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="IGST"
                name="IGST"
                type="number"
                value={formData.IGST}
                onChange={handleChange}
                disabled={!isEditing && addOneButtonEnabled}
                inputProps={{ tabIndex: 5 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="SGST"
                name="SGST"
                type="number"
                value={formData.SGST}
                onChange={handleChange}
                disabled={!isEditing && addOneButtonEnabled}
                inputProps={{ tabIndex: 6 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="CGST"
                name="CGST"
                type="number"
                value={formData.CGST}
                onChange={handleChange}
                disabled={!isEditing && addOneButtonEnabled}
                inputProps={{ tabIndex: 7 }}
              />
            </Grid>
          </Grid>
        </Box> */}


        <div className="flex justify-center items-center min-h-[40vh] bg-gray-50 py-8">
          <div className="w-full max-w-2xl p-6 bg-white rounded-lg ">
            <form>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-6">
                <div>
                  <label htmlFor="changeNo" className="block text-left text-sm font-bold text-gray-800 ">
                    Change No
                  </label>
                  <input
                    id="changeNo"
                    name="changeNo"
                    type="text"
                    onKeyDown={handleKeyDown}
                    disabled={!addOneButtonEnabled}
                    tabIndex={1}
                    className={`block w-full rounded-md px-3 py-2 text-base text-gray-900 
              outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400
              focus:outline-indigo-600 sm:text-sm
              ${!addOneButtonEnabled ? "bg-gray-100 cursor-not-allowed" : "bg-white"}`}
                  />
                </div>

                <div>
                  <label htmlFor="Doc_no" className="block text-left text-sm font-bold text-gray-800  flex items-center">
                    Doc No
                    <span className="ml-1 text-xs text-gray-500">(Auto-generated)</span>
                  </label>
                  <div className="relative group">
                    <input
                      id="Doc_no"
                      name="Doc_no"
                      type="text"
                      value={formData.Doc_no}
                      onChange={handleChange}
                      disabled
                      tabIndex={2}
                      className="w-full rounded-md px-3 py-2 text-base text-gray-700 bg-gray-100 cursor-not-allowed outline-1 -outline-offset-1 outline-gray-300 sm:text-sm"
                    />
                    <div className="absolute right-3 top-2.5 text-gray-400">
                      <svg
                        className="h-5 w-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="absolute left-0 -top-6 hidden group-hover:block bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      Auto-generated and read-only
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="GST_Name" className="block text-left text-sm font-bold text-gray-800 ">
                    GST Name
                  </label>
                  <input
                    id="GST_Name"
                    name="GST_Name"
                    type="text"
                    value={formData.GST_Name}
                    onChange={handleChange}
                    ref={inputRef}
                    disabled={!isEditing && addOneButtonEnabled}
                    tabIndex={3}
                    className={`block w-full rounded-md px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-indigo-600 sm:text-sm
              ${(!isEditing && addOneButtonEnabled) ? "bg-gray-100 cursor-not-allowed" : "bg-white"}`}
                  />
                </div>

                <div>
                  <label htmlFor="Rate" className="block text-left text-sm font-bold text-gray-800 ">
                    Rate
                  </label>
                  <input
                    id="Rate"
                    name="Rate"
                    type="number"
                    value={formData.Rate}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    tabIndex={4}
                    className={`block w-full rounded-md px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-indigo-600 sm:text-sm
              ${(!isEditing && addOneButtonEnabled) ? "bg-gray-100 cursor-not-allowed" : "bg-white"}`}
                  />
                </div>

                <div>
                  <label htmlFor="IGST" className="block text-left text-sm font-bold text-gray-800 ">
                    IGST
                  </label>
                  <input
                    id="IGST"
                    name="IGST"
                    type="number"
                    value={formData.IGST}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    tabIndex={5}
                    className={`block w-full rounded-md px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-indigo-600 sm:text-sm
              ${(!isEditing && addOneButtonEnabled) ? "bg-gray-100 cursor-not-allowed" : "bg-white"}`}
                  />
                </div>

                <div>
                  <label htmlFor="SGST" className="block text-left text-sm font-bold text-gray-800 ">
                    SGST
                  </label>
                  <input
                    id="SGST"
                    name="SGST"
                    type="number"
                    value={formData.SGST}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    tabIndex={6}
                    className={`block w-full rounded-md px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-indigo-600 sm:text-sm
              ${(!isEditing && addOneButtonEnabled) ? "bg-gray-100 cursor-not-allowed" : "bg-white"}`}
                  />
                </div>

                <div>
                  <label htmlFor="CGST" className="block text-left text-sm font-bold text-gray-800 ">
                    CGST
                  </label>
                  <input
                    id="CGST"
                    name="CGST"
                    type="number"
                    value={formData.CGST}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    tabIndex={7}
                    className={`block w-full rounded-md px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-indigo-600 sm:text-sm
              ${(!isEditing && addOneButtonEnabled) ? "bg-gray-100 cursor-not-allowed" : "bg-white"}`}
                  />
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default GSTRateMaster;
