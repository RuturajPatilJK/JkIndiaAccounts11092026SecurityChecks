import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ActionButtonGroup from "../../../Common/CommonButtons/ActionButtonGroup";
import NavigationButtons from "../../../Common/CommonButtons/NavigationButtons";
import UserAuditInfo from "../../../Common/UserAuditInfo/UserAuditInfo";
import Swal from "sweetalert2";
import {
  Box,
  Grid,
  TextField,
  Typography,
  Button,
  Paper,
  Tooltip
} from '@mui/material';


const CupBoardmasterComponent = () => {
  const apiURL = process.env.REACT_APP_API_URL_FILE_SYSTEM;

  const resaleMillDropdownRef = useRef(null);
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

  const editButtonRef = useRef(null);
  const setfocusFilenameref = useRef(null);

  const location = useLocation();
  const editRecordData = location.state && location.state.editRecordData;

  const User_Name = sessionStorage.getItem('username')

  const [employeeDetails, setEmployeeDetails] = useState({
    Cupboard_Code: "",
    Cupboard_Name: "",
    Created_by: "",
    Modified_by: ""

  });

  const navigate = useNavigate();

  const handleAddOne = () => {
    setAddOneButtonEnabled(false);
    setSaveButtonEnabled(true);
    setCancelButtonEnabled(true);
    setEditButtonEnabled(false);
    setDeleteButtonEnabled(false);
    setIsEditMode(false);
    setIsEditing(true);

    if (resaleMillDropdownRef.current) {
      resaleMillDropdownRef.current.focus();
    }

    axios
      .get(`${apiURL}/lastCupBoardCode`)
      .then((response) => {
        const lastEmployeeCode = response.data.lastCupBoardMaster;
        setEmployeeDetails((prevState) => ({
          ...prevState,
          Cupboard_Code: lastEmployeeCode + 1,
          Cupboard_Name: "",

        }));
      })
      .catch((error) => {
        console.error("Error fetching last employee code:", error);
      });
  };

  const handleEdit = () => {
    setIsEditing(true);
    setIsEditMode(true);
    setAddOneButtonEnabled(false);
    setSaveButtonEnabled(true);
    setCancelButtonEnabled(true);
    setEditButtonEnabled(false);
    setDeleteButtonEnabled(false);
    setBackButtonEnabled(true);
  };


  const handleSaveOrUpdate = () => {
    if (isEditMode) {
      const employeeToUpdate = {
        ...employeeDetails,
      };
      axios
        .put(
          `${apiURL}/updatecupboardmaster/${employeeDetails.Cupboard_Code}`,
          { ...employeeToUpdate, Modified_by: User_Name }
        )
        .then((response) => {
          Swal.fire({
            title: "Success!",
            text: "Record Updated Successfully!",
            icon: "success",
            confirmButtonText: "OK",
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
          console.error("Error updating employee:", error);
        });
    } else {
      const employeeToSave = {
        ...employeeDetails,
        Created_by: User_Name
      };
      if (!employeeDetails.Cupboard_Name) {
        toast.error('Cupboard Name are required!');
        return;
      }
      axios
        .post(`${apiURL}/insertFilemaster`, employeeToSave)
        .then((response) => {
          Swal.fire({
            title: "Success!",
            text: "Record Created Successfully!",
            icon: "success",
            confirmButtonText: "OK",
          });
          setEmployeeDetails({
            Cupboard_Code: "",
            Employee_Name: "",

          });
          handleAddOne();
        })
        .catch((error) => {
          console.error("Error saving employee:", error);
        });
    }
  };

  const handleBack = () => {
    navigate("/filesystemdashboard");
  };


  const handleDelete = async () => {
    try {
      const result = await Swal.fire({
        title: "Are you sure?",
        text: "Do you want to delete this CupBoard?",
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
        const checkResponse = await axios.get(`${apiURL}/checkCupboardCode/${employeeDetails.Cupboard_Code}`);

        if (checkResponse.data.exists) {
          Swal.fire({
            title: "Error",
            text: "Cupboard code already exists!",
            icon: "error",
          });
          return;
        }

        const deleteResponse = await axios.delete(`${apiURL}/deletcupboardmaster/${employeeDetails.Cupboard_Code}`);

        if (deleteResponse.status === 200) {
          Swal.fire({
            title: "Deleted!",
            text: "Cupboard has been deleted successfully.",
            icon: "success",
          });
          handleCancel();
        } else {
          Swal.fire({
            title: "Error",
            text: "Failed to delete cupboard.",
            icon: "error",
          });
        }
      } else {
        Swal.fire({
          title: "Cancelled",
          text: "Your cupboard record is safe 🙂",
          icon: "info",
        });
      }
    } catch (error) {
      console.error("Error during deletion:", error);
      Swal.fire({
        title: "Error",
        text: `There was an error: ${error.message}`,
        icon: "error",
      });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setIsEditMode(false);
    setAddOneButtonEnabled(true);
    setEditButtonEnabled(true);
    setDeleteButtonEnabled(true);
    setBackButtonEnabled(true);
    setSaveButtonEnabled(false);
    setCancelButtonEnabled(false);
    setCancelButtonClicked(true);
    axios
      .get(`${apiURL}/getlastrecordcupboardmaster`)
      .then((response) => {
        const lastRecord = response.data.lastCupBoardMaster;

        if (!lastRecord) {
          // No cupboards left (e.g. the only one was just deleted) - reset
          // to a blank "new record" state instead of leaving the previous
          // (now-deleted) record on screen.
          setEmployeeDetails({
            Cupboard_Code: 1,
            Cupboard_Name: "",
            Created_by: "",
            Modified_by: "",
          });
          return;
        }

        setEmployeeDetails({
          Cupboard_Code: lastRecord.Cupboard_Code,
          Cupboard_Name: lastRecord.Cupboard_Name,
          Created_by: lastRecord.Created_by,
          Modified_by: lastRecord.Modified_by,

        });
        editButtonRef.current.focus();

      })
      .catch((error) => {
        console.error("Error fetching last record:", error);
      });
  };


  const handleInputChange = (e) => {
    const { name, value } = e.target;

    const isValidFloat = (input) => /^\d+(\.\d*)?$/.test(input);
    switch (name) {
      case "Basic_Salary":
        if (!/^\d+$/.test(value)) {
          console.error(
            "Invalid Basic Salary value. Please enter a valid integer."
          );
          setEmployeeDetails({
            ...employeeDetails,
            [name]: "",
          });
          return;
        }
        break;

      case "Rate_Per_Hour":
        if (!isValidFloat(value)) {
          console.error(
            "Invalid Rate Per Hour value. Please enter a valid float."
          );

          setEmployeeDetails({
            ...employeeDetails,
            [name]: "",
          });
          return;
        }
        break;

      default:
        break;
    }

    setEmployeeDetails({
      ...employeeDetails,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
  };

  useEffect(() => {
    if (editRecordData) {
      setEmployeeDetails({
        ...editRecordData,
      });
      setAddOneButtonEnabled(true);
      setEditButtonEnabled(true);
      setDeleteButtonEnabled(true);
      setBackButtonEnabled(true);
      setSaveButtonEnabled(false);
      setCancelButtonEnabled(false);
      setCancelButtonClicked(true);
    } else {
      handleAddOne();
    }
  }, [editRecordData]);

  const [currentRecordIndex, setCurrentRecordIndex] = useState(0);
  const [records, setRecords] = useState([]);

  const fetchFirstRecord = () => {
    axios
      .get(`${apiURL}/getfirstnavigationcupboard`)
      .then((response) => {
        const firstRecord = response.data.firstUserCreation;
        setEmployeeDetails(firstRecord);
        setRecords([firstRecord]);
        setCurrentRecordIndex(0);

      });
  };

  const fetchLastRecord = () => {
    axios
      .get(`${apiURL}/getlastnavigationcupboard`)
      .then((response) => {
        const lastRecord = response.data.lastUserCreation;
        setEmployeeDetails(lastRecord);
        setRecords([lastRecord]);
        setCurrentRecordIndex(0);

      });
  };

  const fetchPreviousRecord = async () => {
    const response = await axios.get(
      `${apiURL}/getpreviousnavigationcupboard/${employeeDetails.Cupboard_Code}`
    );

    if (response.data.previousUserCreation) {
      const previousRecord = response.data.previousUserCreation;
      setEmployeeDetails(previousRecord);
      setCurrentRecordIndex(currentRecordIndex - 1);
    } else {
      console.log("No previous record available.");
    }
  };

  const fetchNextRecord = async () => {
    const response = await axios.get(
      `${apiURL}/getnextnavigationcupboard/${employeeDetails.Cupboard_Code}`
    );

    if (response.data.nextUserCreation) {
      const nextRecord = response.data.nextUserCreation;
      setEmployeeDetails(nextRecord);
      setCurrentRecordIndex(currentRecordIndex + 1);

    } else {
      console.log("No next record available.");
    }
  };

  const handleFirst = () => {
    fetchFirstRecord();
  };

  const handleLast = () => {
    fetchLastRecord();
  };

  const handlePrevious = () => {
    fetchPreviousRecord();
  };

  const handleNext = () => {
    fetchNextRecord();
  };

  return (
    <>
      <UserAuditInfo
        createdBy={employeeDetails.Created_by}
        modifiedBy={employeeDetails.Modified_by}
        title={"CupBoard Master"}
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
        />
        <div>
          <NavigationButtons
            handleFirstButtonClick={handleFirst}
            handlePreviousButtonClick={handlePrevious}
            handleNextButtonClick={handleNext}
            handleLastButtonClick={handleLast}
            highlightedButton={highlightedButton}
            isEditing={isEditing}
          />
        </div>
      </div>

      <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-6">
            <div>
              <label className="block text-left text-sm font-bold text-gray-800 mb-1.5">
                Cupboard Code
                <span className="ml-1 text-xs text-gray-500">(Auto-generated)</span>
              </label>
              <div className="relative group">
                <input
                  type="text"
                  name="Cupboard_Code"
                  value={employeeDetails.Cupboard_Code}
                  onChange={handleInputChange}
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

            <div>
              <label htmlFor="Cupboard_Name" className="block text-left text-sm font-bold text-gray-800 mb-1.5">
                Cupboard Name
              </label>
              <input
                ref={setfocusFilenameref}
                type="text"
                name="Cupboard_Name"
                id="Cupboard_Name"
                value={employeeDetails.Cupboard_Name}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Enter cupboard name"
                className={`w-full px-3 py-2 text-left border ${!isEditing ? 'border-gray-200 bg-gray-50' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500`}
              />
            </div>
          </div>
        </form>
      </div>

    </>
  );
};

export default CupBoardmasterComponent;