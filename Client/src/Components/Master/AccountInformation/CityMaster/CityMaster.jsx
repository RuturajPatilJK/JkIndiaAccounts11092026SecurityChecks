import React, {
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useRef
} from "react";
import ActionButtonGroup from "../../../../Common/CommonButtons/ActionButtonGroup";
import NavigationButtons from "../../../../Common/CommonButtons/NavigationButtons";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import GSTStateMasterHelp from "../../../../Helper/GSTStateMasterHelp";
import {
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  FormGroup,
  Grid,
  Typography,
} from "@mui/material";
import "./CityMaster.css"
import UserAuditInfo from "../../../../Common/UserAuditInfo/UserAuditInfo";
import Swal from "sweetalert2";

const API_URL = process.env.REACT_APP_API;
var gstStateName;

const CityMaster = ({ isPopup = false }, ref) => {
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
  const companyCode = sessionStorage.getItem("Company_Code");
  const navigate = useNavigate();
  const location = useLocation();
  const selectedRecord = location.state?.selectedRecord;
  const permissions = location.state?.permissionsData;
  const inputRef = useRef(null)

  const initialFormData = {
    city_code: "",
    city_name_e: "",
    pincode: "",
    Sub_Area: "",
    city_name_r: "",
    company_code: "",
    state: "",
    Distance: 0,
    GstStateCode: "",
  };

  const [formData, setFormData] = useState(initialFormData);
  const [GstStateCode, setGstStateCode] = useState("");
  const [states, setStates] = useState([]);

  useImperativeHandle(ref, () => ({
    getFormData: () => formData,
  }));

  useEffect(() => {
    axios
      .get(`${API_URL}/getall-gststatemaster`)
      .then((response) => {
        const sortedStates = response.data.alldata.sort((a, b) =>
          a.State_Name.localeCompare(b.State_Name)
        );
        setStates(sortedStates);
        setFormData((prevData) => ({
          ...prevData,
          state: sortedStates[0]?.State_Code || "",
        }));
      })
      .catch((error) => {
        console.error("Error fetching states:", error);
      });
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const fetchLastCityCode = () => {
    fetch(`${API_URL}/getlast-city?company_code=${companyCode}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch last company code");
        }
        return response.json();
      })
      .then((data) => {
        setFormData((prevState) => ({
          ...prevState,
          city_code: data.city_code + 1,
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
    fetchLastCityCode();
    setFormData(initialFormData);
    gstStateName = ""
    setTimeout(() => {
      inputRef.current.focus();
    })
  };

  const handleSaveOrUpdate = () => {
    const username = sessionStorage.getItem("username");
    if (isEditMode) {
      const updatedFormData = {
        ...formData,
        Modified_By: username,
      };
      axios
        .put(
          `${API_URL}/update-city?company_code=${companyCode}&city_code=${formData.city_code}`,
          updatedFormData
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
      const newFormData = {
        ...formData,
        Created_By: username,
      };

      axios
        .post(`${API_URL}/create-city?company_code=${companyCode}`, newFormData)
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
      .get(`${API_URL}/getlast-city?company_code=${companyCode}`)
      .then((response) => {
        const data = response.data;
        gstStateName = data.state;
        setFormData((prevFormData) => ({
          ...prevFormData,
          ...data,
          state: data.state,
        }));
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
      text: `You won't be able to revert this City Code : ${formData.city_code}`,
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
        const deleteApiUrl = `${API_URL}/delete-city?company_code=${companyCode}&city_code=${formData.city_code}`;
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
    navigate("/city-master-utility");
  };

  const handleFirstButtonClick = async () => {
    try {
      const response = await fetch(`${API_URL}/get_First_Record`);
      if (response.ok) {
        const data = await response.json();
        const firstUserCreation = data[0];
        gstStateName = firstUserCreation.state;

        setFormData((prevFormData) => ({
          ...prevFormData,
          ...firstUserCreation,
          state: firstUserCreation.state,
        }));
      } else {
        console.error(
          "Failed to fetch first tender data:",
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
        `${API_URL}/get_previous_record?city_code=${formData.city_code}`
      );

      if (response.ok) {
        const data = await response.json();
        gstStateName = data.state;
        setFormData((prevFormData) => ({
          ...prevFormData,
          ...data,
          state: data.state,
        }));
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
        `${API_URL}/get_next_record?city_code=${formData.city_code}`
      );

      if (response.ok) {
        const data = await response.json();
        gstStateName = data.nextSelectedRecord.state;
        setFormData((prevFormData) => ({
          ...prevFormData,
          ...data.nextSelectedRecord,
          state: data.nextSelectedRecord.state,
        }));
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
      const response = await fetch(`${API_URL}/get_last_record`);
      if (response.ok) {
        const data = await response.json();
        const last_Navigation = data[0];
        gstStateName = last_Navigation.state;

        setFormData((prevFormData) => ({
          ...prevFormData,
          ...last_Navigation,
          state: last_Navigation.state,
        }));
      } else {
        console.error(
          "Failed to fetch first tender data:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error during API call:", error);
    }
  };

  const handlerecordDoubleClicked = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/get-citybycitycode?company_code=${companyCode}&city_code=${selectedRecord.city_code}`
      );
      const data = response.data;
      gstStateName = data.state;
      setFormData((prevFormData) => ({
        ...prevFormData,
        ...data,
        state: data.state,
      }));
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
    if (selectedRecord && !isPopup) {
      handlerecordDoubleClicked();
    }
    else {
      handleAddOne();
    }
  }, [selectedRecord]);

  const handleKeyDown = async (event) => {
    if (event.key === "Tab") {
      const changeNoValue = event.target.value;
      try {
        const response = await axios.get(
          `${API_URL}/get-citybycitycode?company_code=${companyCode}&city_code=${changeNoValue}`
        );
        const data = response.data;
        gstStateName = data.state;
        setFormData((prevFormData) => ({
          ...prevFormData,
          ...data,
          state: data.state,
        }));
        setIsEditing(false);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }
  };

  const handleGstStateCode = (code) => {
    setGstStateCode(code);
    setFormData({
      ...formData,
      GstStateCode: code,
    });
  };
  return (
    <>

      {!isPopup && (
        <div>
          <UserAuditInfo
            createdBy={formData.Created_By}
            modifiedBy={formData.Modified_By}
          />
          <br></br>
          <br></br>
          <br></br>
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
              isFirstRecord={formData.Company_Code === 1}
            />
          </div>
        </div>
      )}
      <div className="CityMaster">
        <form>
          <Typography variant="h5" gutterBottom>
            City Master
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <FormGroup>
                <TextField
                  label="Change No"
                  variant="outlined"
                  name="changeNo"
                  autoComplete="off"
                  value={formData.changeNo}
                  onKeyDown={handleKeyDown}
                  disabled={!addOneButtonEnabled}
                  fullWidth
                  margin="normal"
                  size="small"
                />
              </FormGroup>
            </Grid>

            <Grid item xs={6}>
              <FormGroup>
                <TextField
                  label="City Code"
                  variant="outlined"
                  name="city_code"
                  autoComplete="off"
                  value={formData.city_code}
                  onChange={handleChange}
                  disabled
                  fullWidth
                  margin="normal"
                  size="small"
                />
              </FormGroup>
            </Grid>
          </Grid>


          <FormGroup>
            <TextField
              tabIndex={1}
              label="City Name"
              variant="outlined"
              name="city_name_e"
              autoComplete="off"
              value={formData.city_name_e}
              onChange={handleChange}
              inputRef={inputRef}
              disabled={!isEditing && addOneButtonEnabled}
              fullWidth
              margin="normal"
              size="small"
            />
          </FormGroup>

          <FormGroup>
            <TextField
              tabIndex={2}
              label="City Name Regional"
              variant="outlined"
              name="city_name_r"
              autoComplete="off"
              value={formData.city_name_r}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              fullWidth
              margin="normal"
              size="small"
            />
          </FormGroup>

          <FormGroup>
            <TextField
              tabIndex={3}
              label="PinCode"
              variant="outlined"
              name="pincode"
              autoComplete="off"
              value={formData.pincode}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              fullWidth
              margin="normal"
              size="small"
            />
          </FormGroup>

          <FormGroup>
            <TextField
              tabIndex={4}
              label="SubArea"
              variant="outlined"
              name="Sub_Area"
              autoComplete="off"
              value={formData.Sub_Area}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              fullWidth
              margin="normal"
              size="small"
            />
          </FormGroup>

          <FormGroup>
            <FormControl fullWidth margin="normal">
              <InputLabel>State</InputLabel>
              <Select
                tabIndex={5}
                label="State"
                name="state"
                size="small"
                value={formData.state}
                onChange={handleChange}
                disabled={!isEditing && addOneButtonEnabled}
              >
                {states.map((state) => (
                  <MenuItem key={state.State_Code} value={state.State_Name}>
                    {state.State_Name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </FormGroup>

          <FormGroup>
            <TextField
              tabIndex={6}
              label="Distance"
              variant="outlined"
              name="Distance"
              size="small"
              autoComplete="off"
              value={formData.Distance}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              fullWidth
              margin="normal"
            />
          </FormGroup>

          <div className="citymaster-row">
            <label htmlFor="Distance" className="citymasterlabel">GST State Code:</label>
            <GSTStateMasterHelp
              onAcCodeClick={handleGstStateCode}
              GstStateName={gstStateName}
              GstStateCode={formData.GstStateCode}
              disabledFeild={!isEditing && addOneButtonEnabled}
              tabIndexHelp={7}
            />
          </div>
        </form>
      </div>
    </>
  );
};

export default forwardRef(CityMaster);
