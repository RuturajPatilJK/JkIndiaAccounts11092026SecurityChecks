import React, { useState, useEffect, useRef } from "react";
import ActionButtonGroup from "../../../Common/CommonButtons/ActionButtonGroup";
import NavigationButtons from "../../../Common/CommonButtons/NavigationButtons";
import { useNavigate, useLocation } from "react-router-dom";
import "./RackMillInfo.css";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import GSTStateMaster from "../../../Helper/GSTStateMasterHelp";
import UserAuditInfo from "../../../Common/UserAuditInfo/UserAuditInfo";
import Swal from "sweetalert2";

const API_URL = process.env.REACT_APP_API;

var newStateCode = "";
var newStateName = "";
var newId = ""

const RackMillInfo = () => {

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
  const [stateCode, setStateCode] = useState("");
  const [stateName, setStateName] = useState("")

  const inputRef = useRef(null)

  const navigate = useNavigate();

  //In utility page record doubleClicked that recod show for edit functionality
  const location = useLocation();
  const selectedRecord = location.state?.selectedRecord;
  const permissions = location.state?.permissionsData;

  const initialFormData = {
    Id: null,
    Mill_name: "",
    Mill_code: "",
    State_Code: stateCode,
    City_name:"",
    Remark: "",
    Created_By: "",
    Modified_By: "",
    // Created_Date:new Date().toISOString().split("T")[0],
    // Modified_Date: new Date().toISOString().split("T")[0],
  };

  const [formData, setFormData] = useState(initialFormData);

  // Handle change for all inputs
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevState) => {
      const updatedFormData = { ...prevState, [name]: value.toUpperCase(), };
      return updatedFormData;
    });
  };

  const handleNextId = () => {
    fetch(
      `${API_URL}/get-next-mill-id`
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch last record");
        }
        return response.json();
      })
      .then((data) => {
        const new_Id = data.next_id;
        setFormData((prevState) => ({
          ...prevState,
          Id: new_Id,
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
    handleNextId();
    setFormData(initialFormData);
    setStateCode("")
    newStateName = "";
    newStateCode = "";
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
          `${API_URL}/updateMillInfo?Id=${formData.Id}`,
          responseData
        )
        .then((response) => {
          toast.success("Mill update successfully!");
          setIsEditMode(false);
          setAddOneButtonEnabled(true);
          setEditButtonEnabled(true);
          setDeleteButtonEnabled(true);
          setBackButtonEnabled(true);
          setSaveButtonEnabled(false);
          setCancelButtonEnabled(false);
          setUpdateButtonClicked(true);
          setIsEditing(false);
          setTimeout(()=>{
            window.location.reload();
          },1000)
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
          `${API_URL}/insertmillrecord`,
          responseData
        )
        .then((response) => {
          toast.success("Mill Create successfully!");
          setIsEditMode(false);
          setAddOneButtonEnabled(true);
          setEditButtonEnabled(true);
          setDeleteButtonEnabled(true);
          setBackButtonEnabled(true);
          setSaveButtonEnabled(false);
          setCancelButtonEnabled(false);
          setUpdateButtonClicked(true);
          setIsEditing(false);
          setTimeout(()=>{
            window.location.reload();
          },1000)
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
      .get(`${API_URL}/get-last-mill`)
      .then((response) => {
        const data = response.data;
        newStateName = data.label_names[0].State_Name;
        newStateCode = data.label_names[0].State_Code;
        newId = data.last_Mill_data.Id
        setFormData({
          ...formData,
          ...data.last_Mill_data,
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
      text: `You won't be able to revert this Code : ${formData.Id}`,
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
        const deleteApiUrl = `${API_URL}/delete_mill_info?Id=${formData.Id}`;
        const response = await axios.delete(deleteApiUrl);
        toast.success("Record deleted successfully!");
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
    navigate("/rack-mill-info-utility");
  };

  const handleFirstButtonClick = async () => {
    try {
      const response = await fetch(
        `${API_URL}/get-first-mill?Id=${newId}`
      );
      if (response.ok) {
        const data = await response.json();

        newStateName = data.label_names[0].State_Name;
        newStateCode = data.label_names[0].State_Code;
        newId = data.first_Mill_data.Id
        setFormData({
          ...formData,
          ...data.first_Mill_data,
        });
      } else {
        console.error(
          "Failed to fetch first mill data:",
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
        `${API_URL}/get-previous-mill?Id=${newId}`
      );

      if (response.ok) {
        const data = await response.json();
        newStateName = data.label_names[0].State_Name;
        newStateCode = data.label_names[0].State_Code;
        newId = data.previous_Mill_data.Id
        setFormData({
          ...formData,
          ...data.previous_Mill_data,
        });
      } else {
        console.error(
          "Failed to fetch previous mill data:",
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
        `${API_URL}/get-next-mill?Id=${newId}`
      );

      if (response.ok) {
        const data = await response.json();
        newStateName = data.label_names[0].State_Name;
        newStateCode = data.label_names[0].State_Code;
        newId = data.Next_Mill_data.Id
        setFormData({
          ...formData,
          ...data.Next_Mill_data,
        });
      } else {
        console.error(
          "Failed to fetch next mill data:",
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
      const response = await fetch(`${API_URL}/get-last-mill`);
      if (response.ok) {
        const data = await response.json();
        newStateName = data.label_names[0].State_Name;
        newStateCode = data.label_names[0].State_Code;
        newId = data.last_Mill_data.Id
        setFormData({
          ...formData,
          ...data.last_Mill_data,
        });
      } else {
        console.error(
          "Failed to fetch last mill data:",
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
        `${API_URL}/getmillbyId?&Id=${selectedRecord.Id}`
      );
      const data = response.data;

      newStateCode = data.label_names[0].State_Code;
      newStateName = data.label_names[0].State_Name;
      setFormData({
        ...formData,
        ...data.Mill_data,
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
    document.getElementById('Mill_name').focus();
  }, []);

  //change No functionality to get that particular record
  const handleKeyDown = async (event) => {
    if (event.key === "Tab") {
      const changeNoValue = event.target.value;
      try {
        const response = await axios.get(
          `${API_URL}/getmillbyId?Id=${changeNoValue}`
        );
        const data = response.data;

      newStateCode = data.label_names[0].State_Code;
      newStateName = data.label_names[0].State_Name;
      setFormData({
        ...formData,
        ...data.Mill_data,
      });
      setIsEditing(false);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }
  };

  //Functionality to help section to set the record.
  const handleGSTStateCode = (code, name) => {
    setStateCode(code);
    setStateName(name)
    setFormData({
      ...formData,
      State_Code: code,
    });
  };

  return (
    <>
      <UserAuditInfo
        createdBy={formData.Created_By}
        modifiedBy={formData.Modified_By}
      />
      <br></br>
      <br></br>
      <div >
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
      <div >
        <form className="rack-mill-info-form">
          <h2 className="form-title">Mill Master</h2>
          <br />
          <div className="form-group">
            <label htmlFor="changeNo" className="form-label">Change No:</label>
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
          <br />
          <div className="form-group">
            <label htmlFor="Id" className="form-label">Id:</label>
            <input
              type="text"
              id="Id"
              name="Id"
              autoComplete="off"
              value={formData.Id}
              onChange={handleChange}
              disabled
              className="form-input"
            />
          </div>
          <br />
          <div className="form-group">
            <label htmlFor="Mill_name" className="form-label">Mill Name:</label>
            <input
              tabIndex={1}
              type="text"
              id="Mill_name"
              name="Mill_name"
              autoComplete="off"
              ref={inputRef}
              value={formData.Mill_name}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              className="form-input"
            />
          </div>
          <br />
          <div className="form-group">
            <label htmlFor="Mill_code" className="form-label">Mill Code:</label>
            <input
              tabIndex={2}
              type="text"
              id="Mill_code"
              name="Mill_code"
              autoComplete="off"
              value={formData.Mill_code}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              className="form-input"
            />
          </div>
          <br />
          <div className="form-group">
            <label htmlFor="State_Code" className="form-label">State Code:</label>
            <GSTStateMaster
              onAcCodeClick={handleGSTStateCode}
              name="State_Code"
              GstStateName={newStateName}
              GstStateCode={newStateCode}
              tabIndexHelp={3}
              className="account-master-help"
              disabledFeild={!isEditing && addOneButtonEnabled}
            />
          </div>
          <br />
          <div className="form-group">
            <label htmlFor="City_name" className="form-label">City Name:</label>
            <input
              tabIndex={5}
              type="text"
              id="City_name"
              name="City_name"
              autoComplete="off"
              value={formData.City_name}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              className="form-input"
            />
          </div>
          <br />
          <div className="form-group">
            <label htmlFor="Remark" className="form-label">Remark:</label>
            <input
              tabIndex={6}
              type="text"
              id="Remark"
              name="Remark"
              autoComplete="off"
              value={formData.Remark}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              className="form-input"
            />
          </div>
        </form>
      </div>
    </>
  );
};

export default RackMillInfo;
