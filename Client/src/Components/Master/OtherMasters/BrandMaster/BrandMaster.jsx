import React, { useState, useEffect, useRef } from "react";
import ActionButtonGroup from "../../../../Common/CommonButtons/ActionButtonGroup";
import NavigationButtons from "../../../../Common/CommonButtons/NavigationButtons";
import { useNavigate, useLocation } from "react-router-dom";
import "./BrandMaster.css";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SystemHelpMaster from "../../../../Helper/SystemmasterHelp";
import UserAuditInfo from "../../../../Common/UserAuditInfo/UserAuditInfo";
import Swal from "sweetalert2";
import { Box, Grid, TextField, Typography, MenuItem, FormControl, InputLabel, Select } from '@mui/material';

const API_URL = process.env.REACT_APP_API;

var ItemName = "";
var ItemCodeNew = "";

const BrandMaster = () => {

  //GET values from session Storage
  const companyCode = sessionStorage.getItem("Company_Code");
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
  const [itemSelect, setItemSelect] = useState("");
  const [itemSelectAccoid, setItemSelectAccoid] = useState("");

  const inputRef = useRef(null)
  const navigate = useNavigate();

  //In utility page record doubleClicked that recod show for edit functionality
  const location = useLocation();
  const selectedRecord = location.state?.selectedRecord;
  const permissions = location.state?.permissionsData;

  const initialFormData = {
    Code: "",
    Marka: "",
    English_Name: "",
    Mal_Code: itemSelect,
    Aarambhi_Nag: 0.0,
    Nagache_Vajan: 0.0,
    Type: "G",
    Wt_Per: 0,
    Company_Code: companyCode,
    Created_By: "",
    Modified_By: "",
  };

  const [formData, setFormData] = useState(initialFormData);

  // Handle change for all inputs
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevState) => {
      const updatedFormData = { ...prevState, [name]: value };
      return updatedFormData;
    });
  };

  const fetchLastBrandCode = () => {
    fetch(`${API_URL}/get-BrandMaster-lastRecord?Company_Code=${companyCode}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch last company code");
        }
        return response.json();
      })
      .then((data) => {
        const lastCode = parseInt(data.last_BrandMaster_data.Code, 10);
        setFormData((prevState) => ({
          ...prevState,
          Code: lastCode + 1,
        }));
      })
      .catch((error) => {
        console.error("Error fetching last company code:", error);
      });
  };

  const handleAddOne = () => {
    setAddOneButtonEnabled(false);
    setSaveButtonEnabled(true);
    setCancelButtonEnabled(true);
    setEditButtonEnabled(false);
    setDeleteButtonEnabled(false);
    setIsEditing(true);
    fetchLastBrandCode();
    setFormData(initialFormData);
    setItemSelect("")
    ItemName = "";
    ItemCodeNew = "";
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleSaveOrUpdate = () => {
    if (isEditMode) {
      const responseData = {
        ...formData,
        Modified_By: username
      }
      axios
        .put(
          `${API_URL}/update-BrandMaster?Code=${formData.Code}&Company_Code=${companyCode}`,
          responseData
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
      const responseData = {
        ...formData,
        Created_By: username
      }
      axios
        .post(
          `${API_URL}/create-RecordBrandMaster?Company_Code=${companyCode}`,
          responseData
        )
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
    axios
      .get(`${API_URL}/get-BrandMaster-lastRecord?Company_Code=${companyCode}`)
      .then((response) => {
        const data = response.data;
        ItemName = data.label_names[0].System_Name_E;
        ItemCodeNew = data.label_names[0].Mal_Code;
        setFormData({
          ...formData,
          ...data.last_BrandMaster_data,
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
      text: `You won't be able to revert this Code : ${formData.Code}`,
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
        const deleteApiUrl = `${API_URL}/delete-BrandMaster?Code=${formData.Code}&Company_Code=${companyCode}`;
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
    navigate("/brand-master-utility");
  };

  const handleFirstButtonClick = async () => {
    try {
      const response = await fetch(
        `${API_URL}/get-first-BrandMaster?Company_Code=${companyCode}`
      );
      if (response.ok) {
        const data = await response.json();

        ItemName = data.label_names[0].System_Name_E;
        ItemCodeNew = data.label_names[0].Mal_Code;
        setFormData({
          ...formData,
          ...data.first_BrandMaster_data,
        });
      } else {
        console.error(
          "Failed to fetch first brand data:",
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
      const response = await fetch(
        `${API_URL}/get_previous_BrandMaster?Code=${formData.Code}&Company_Code=${companyCode}`
      );

      if (response.ok) {
        const data = await response.json();
        ItemName = data.label_names[0].System_Name_E;
        ItemCodeNew = data.label_names[0].Mal_Code;
        setFormData({
          ...formData,
          ...data.previous_BrandMaster_data,
        });
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

  const handleNextButtonClick = async () => {
    try {
      const response = await fetch(
        `${API_URL}/get_next_BrandMaster?Code=${formData.Code}&Company_Code=${companyCode}`
      );

      if (response.ok) {
        const data = await response.json();
        ItemName = data.label_names[0].System_Name_E;
        ItemCodeNew = data.label_names[0].Mal_Code;
        setFormData({
          ...formData,
          ...data.next_BrandMaster_data,
        });
      } else {
        console.error(
          "Failed to fetch next company creation data:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error during API call:", error);
    }
  };

  const handleLastButtonClick = async () => {
    try {
      const response = await fetch(`${API_URL}/get_last_BrandMaster?Company_Code=${companyCode}`);
      if (response.ok) {
        const data = await response.json();
        ItemName = data.label_names[0].System_Name_E;
        ItemCodeNew = data.label_names[0].Mal_Code;
        setFormData({
          ...formData,
          ...data.last_BrandMaster_data,
        });
      } else {
        console.error(
          "Failed to fetch last BrandMaster data:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error during API call:", error);
    }
  };

  //Handle Record DoubleCliked in Utility Page Show that record for Edit
  const handlerecordDoubleClicked = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/get-BrandMasterSelectedRecord?Company_Code=${companyCode}&Code=${selectedRecord.Code}`
      );
      const data = response.data;

      ItemCodeNew = data.label_names[0].Mal_Code;
      ItemName = data.label_names[0].System_Name_E;
      setFormData({
        ...formData,
        ...data.selected_Record_data,
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

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  //change No functionality to get that particular record
  const handleKeyDown = async (event) => {
    if (event.key === "Tab") {
      const changeNoValue = event.target.value;
      try {
        const response = await axios.get(
          `${API_URL}/get-BrandMasterSelectedRecord?Company_Code=${companyCode}&Code=${changeNoValue}`
        );
        const data = response.data;

        ItemCodeNew = data.label_names[0].Mal_Code;
        ItemName = data.label_names[0].System_Name_E;
        setFormData({
          ...formData,
          ...data.selected_Record_data,
        });
        setIsEditing(false);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }
  };

  //Functionality to help section to set the record.
  const handleItemSelect = (code, accoid) => {
    setItemSelect(code);
    setFormData({
      ...formData,
      Mal_Code: code,

    });
    setItemSelectAccoid(accoid);
    // setHSNNo(HSN)
  };



  return (
    <>
      <UserAuditInfo
        createdBy={formData.Created_By}
        modifiedBy={formData.Modified_By}
        title={"Brand Master"}
      />
      <div className="brandMasterMain" >
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
          nextTabIndex={9}
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
      {/* <div >
        <form className="brand-master-form">
          <h2 className="form-titlebrandmaster">Brand Master</h2>
          <br />
          <div className="form-groupbrandmaster">
            <label htmlFor="changeNo" className="form-labelbrandmaster">Change No:</label>
            <input
              type="text"
              id="changeNo"
              name="changeNo"
              autoComplete="off"
              onKeyDown={handleKeyDown}
              disabled={!addOneButtonEnabled}
              className="form-input"
            />
          </div>

          <div className="form-groupbrandmaster">
            <label htmlFor="Code" className="form-labelbrandmaster">Code:</label>
            <input
              type="text"
              id="Code"
              name="Code"
              autoComplete="off"
              value={formData.Code}
              onChange={handleChange}
              disabled
              className="form-input"
            />
          </div>

          <div className="form-groupbrandmaster">
            <label htmlFor="Marka" className="form-labelbrandmaster">Marka Name:</label>
            <input
              tabIndex={1}
              type="text"
              id="Marka"
              name="Marka"
              autoComplete="off"
              ref={inputRef}
              value={formData.Marka}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              className="form-input"
            />
          </div>

          <div className="form-groupbrandmaster">
            <label htmlFor="English_Name" className="form-labelbrandmaster">English Name:</label>
            <input
              tabIndex={2}
              type="text"
              id="English_Name"
              name="English_Name"
              autoComplete="off"
              value={formData.English_Name}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              className="form-input"
            />
          </div>

          <div className="form-groupbrandmaster">
            <label htmlFor="Item_Select" className="form-labelbrandmaster">Mal Code:</label>
            <SystemHelpMaster
              onAcCodeClick={handleItemSelect}
              CategoryName={ItemName}
              CategoryCode={ItemCodeNew}
              name="Item_Select"
              tabIndexHelp={3}
              SystemType="I"
              className="account-master-help"
              disabledField={!isEditing && addOneButtonEnabled}
            />
          </div>

          <div className="form-groupbrandmaster">
            <label htmlFor="Aarambhi_Nag" className="form-labelbrandmaster">Aarambhi Nag:</label>
            <input
              tabIndex={5}
              type="text"
              id="Aarambhi_Nag"
              name="Aarambhi_Nag"
              autoComplete="off"
              value={formData.Aarambhi_Nag}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              className="form-input"
            />
          </div>

          <div className="form-groupbrandmaster">
            <label htmlFor="Nagache_Vajan" className="form-labelbrandmaster">Nagache Vajan:</label>
            <input
              tabIndex={6}
              type="text"
              id="Nagache_Vajan"
              name="Nagache_Vajan"
              autoComplete="off"
              value={formData.Nagache_Vajan}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              className="form-input"
            />
          </div>

          <div className="form-groupbrandmaster" style={{marginLeft:'-40px'}}>
            <label htmlFor="Type" className="form-labelbrandmaster"> Select Type:</label>
            <select
              tabIndex={7}
              id="Type"
              name="Type"
              className="form-select"
              autoComplete="off"
              value={formData.Type}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
            >
              <option value="G">Grain</option>
              <option value="P">Pulses</option>
            </select>
          </div>

          <div className="form-groupbrandmaster" style={{marginLeft:'-20px'}}>
            <label htmlFor="Wt_Per" className="form-labelbrandmaster">Wt Per:</label>
            <input
              tabIndex={8}
              type="text"
              id="Wt_Per"
              name="Wt_Per"
              autoComplete="off"
              value={formData.Wt_Per}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              className="form-input"
            />
          </div>
        </form>
      </div> */}

      {/* <Box
        component="form"
        noValidate
        autoComplete="off"
        sx={{ maxWidth: 700, mx: 'auto', p: 4, backgroundColor: '#f5f7fa', borderRadius: 2, boxShadow: 3 }}
      >
        <Typography variant="h5" align="center" gutterBottom sx={{ fontWeight: 600 }}>
          Brand Master
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Change No"
              name="changeNo"
              onKeyDown={handleKeyDown}
              disabled={!addOneButtonEnabled}
              autoComplete="off"
              size="small"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Code"
              name="Code"
              value={formData.Code}
              onChange={handleChange}
              disabled
              autoComplete="off"
              size="small"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Marka Name"
              name="Marka"
              inputRef={inputRef}
              value={formData.Marka}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              autoComplete="off"
              size="small"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="English Name"
              name="English_Name"
              value={formData.English_Name}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              autoComplete="off"
              size="small"
            />
          </Grid>

          <Grid item xs={12} ml={-15}>
            <div className="form-groupbrandmaster">
              <label htmlFor="Item_Select" className="form-labelbrandmaster">Mal Code:</label>
              <SystemHelpMaster
                onAcCodeClick={handleItemSelect}
                CategoryName={ItemName}
                CategoryCode={ItemCodeNew}
                name="Item_Select"
                SystemType="I"
                className="account-master-help"
                disabledField={!isEditing && addOneButtonEnabled}
              />
            </div>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Aarambhi Nag"
              name="Aarambhi_Nag"
              value={formData.Aarambhi_Nag}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              autoComplete="off"
              size="small"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Nagache Vajan"
              name="Nagache_Vajan"
              value={formData.Nagache_Vajan}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              autoComplete="off"
              size="small"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth disabled={!isEditing && addOneButtonEnabled}>
              <InputLabel id="type-label">Select Type</InputLabel>
              <Select
                labelId="type-label"
                id="Type"
                name="Type"
                value={formData.Type}
                label="Select Type"
                onChange={handleChange}
                size="small"
              >
                <MenuItem value="G">Grain</MenuItem>
                <MenuItem value="P">Pulses</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Wt Per"
              name="Wt_Per"
              value={formData.Wt_Per}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              autoComplete="off"
              size="small"
            />
          </Grid>
        </Grid>
      </Box> */}


      <div className="flex justify-center items-center min-h-[40vh]">
        <div className="w-full max-w-4xl p-6">
          <form className="bg-white rounded-lg shadow-md p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-left text-sm font-bold text-gray-800">
                  Change No
                </label>
                <input
                  type="text"
                  name="changeNo"
                  onKeyDown={handleKeyDown}
                  disabled={!addOneButtonEnabled}
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>

              <div>
                <label className="block text-left text-sm font-bold text-gray-800">
                  Brand Code
                  <span className="ml-1 text-xs text-gray-500">(Auto-generated)</span>
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    name="Code"
                    value={formData.Code}
                    onChange={handleChange}
                    readOnly
                    disabled
                    className="w-full px-3 py-2 text-left border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-700 cursor-not-allowed focus:outline-none"
                  />
                  <div className="absolute right-3 top-2.5 text-gray-400">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="absolute left-0 -top-6 hidden group-hover:block bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    Auto-generated and read-only
                  </div>
                </div>
              </div>

              {/* Marka Name */}
              <div>
                <label className="block text-left text-sm font-bold text-gray-800 text-base">
                  Marka Name
                </label>
                <input
                  type="text"
                  name="Marka"
                  ref={inputRef}
                  value={formData.Marka}
                  onChange={handleChange}
                  disabled={!isEditing && addOneButtonEnabled}
                  className={`block w-full rounded-md px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-indigo-600 sm:text-sm
              ${(!isEditing && addOneButtonEnabled) ? "bg-gray-100 cursor-not-allowed" : "bg-white"}`}
                />
              </div>

              {/* English Name */}
              <div>
                <label className="block text-left text-sm font-bold text-gray-800 text-base">
                  English Name
                </label>
                <input
                  type="text"
                  name="English_Name"
                  value={formData.English_Name}
                  onChange={handleChange}
                  disabled={!isEditing && addOneButtonEnabled}
                  className={`block w-full rounded-md px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-indigo-600 sm:text-sm
              ${(!isEditing && addOneButtonEnabled) ? "bg-gray-100 cursor-not-allowed" : "bg-white"}`}
                />
              </div>

              {/* Mal Code (Custom Component) */}
              <div className="md:col-span-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <label
                    htmlFor="Item_Select"
                    className="block text-left text-sm font-bold text-gray-800 text-base"
                  >
                    Mal Code:
                  </label>
                  <div className="flex-grow">
                    <SystemHelpMaster
                      onAcCodeClick={handleItemSelect}
                      CategoryName={ItemName}
                      CategoryCode={ItemCodeNew}
                      name="Item_Select"
                      SystemType="I"
                      className="w-full"
                      disabledField={!isEditing && addOneButtonEnabled}
                    />
                  </div>
                </div>
              </div>


              {/* Aarambhi Nag */}
              <div>
                <label className="block text-left text-sm font-bold text-gray-800 text-base">
                  Aarambhi Nag
                </label>
                <input
                  type="text"
                  name="Aarambhi_Nag"
                  value={formData.Aarambhi_Nag}
                  onChange={handleChange}
                  disabled={!isEditing && addOneButtonEnabled}
                  className={`block w-full rounded-md px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-indigo-600 sm:text-sm
              ${(!isEditing && addOneButtonEnabled) ? "bg-gray-100 cursor-not-allowed" : "bg-white"}`}
                />
              </div>

              {/* Nagache Vajan */}
              <div>
                <label className="block text-left text-sm font-bold text-gray-800 text-base">
                  Nagache Vajan
                </label>
                <input
                  type="text"
                  name="Nagache_Vajan"
                  value={formData.Nagache_Vajan}
                  onChange={handleChange}
                  disabled={!isEditing && addOneButtonEnabled}
                  className={`block w-full rounded-md px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-indigo-600 sm:text-sm
              ${(!isEditing && addOneButtonEnabled) ? "bg-gray-100 cursor-not-allowed" : "bg-white"}`}
                />
              </div>

              {/* Select Type (Dropdown) */}
              <div>
                <label className="block text-left text-sm font-bold text-gray-800 text-base mb-1">
                  Select Type
                </label>
                <select
                  name="Type"
                  value={formData.Type}
                  onChange={handleChange}
                  disabled={!isEditing && addOneButtonEnabled}
                  className={`block w-full rounded-md px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-indigo-600 sm:text-sm
              ${(!isEditing && addOneButtonEnabled) ? "bg-gray-100 cursor-not-allowed" : "bg-white"}`}
                >
                  <option value="G">Grain</option>
                  <option value="P">Pulses</option>
                </select>
              </div>


              {/* Wt Per */}
              <div>
                <label className="block text-left text-sm font-bold text-gray-800 text-base">
                  Wt Per
                </label>
                <input
                  type="text"
                  name="Wt_Per"
                  value={formData.Wt_Per}
                  onChange={handleChange}
                  disabled={!isEditing && addOneButtonEnabled}
                  className={`block w-full rounded-md px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-indigo-600 sm:text-sm
              ${(!isEditing && addOneButtonEnabled) ? "bg-gray-100 cursor-not-allowed" : "bg-white"}`}
                />
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default BrandMaster;
