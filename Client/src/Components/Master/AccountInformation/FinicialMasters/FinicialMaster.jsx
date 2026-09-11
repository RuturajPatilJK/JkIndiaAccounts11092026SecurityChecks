import React, {
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useRef,
} from "react";
import ActionButtonGroup from "../../../../Common/CommonButtons/ActionButtonGroup";
import NavigationButtons from "../../../../Common/CommonButtons/NavigationButtons";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  TextField,
  Typography,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Container,
} from "@mui/material";
import UserAuditInfo from "../../../../Common/UserAuditInfo/UserAuditInfo";
import Swal from "sweetalert2";

const API_URL = process.env.REACT_APP_API;

const FinicialMaster = ({ isPopup = false }, ref) => {
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
  const type = location.state?.type;
  const tallytype = location.state?.tallytype;
  const username = sessionStorage.getItem("username");

  const inputRef = useRef(null);

  const initialFormData = {
    group_Code: "",
    group_Name_E: "",
    group_Summary: "Y",
    group_Type: type || selectedRecord?.group_Type || "B",
    group_Order: "",
    Created_By: "",
    Modified_By: "",
    TallyGroup: tallytype || selectedRecord?.TallyGroup || "Current Assets",
  };

  const [formData, setFormData] = useState(initialFormData);
  useImperativeHandle(ref, () => ({
    getFormData: () => formData,
  }));

  // Handle change for all inputs
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevState) => {
      const updatedFormData = { ...prevState, [name]: value };
      return updatedFormData;
    });
  };

  const fetchLastGrouCode = () => {
    fetch(
      `${API_URL}/get_last_group_by_company_code?Company_Code=${companyCode}`
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch last company code");
        }
        return response.json();
      })
      .then((data) => {
        setFormData((prevState) => ({
          ...prevState,
          group_Code: data.group_Code + 1,
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
    fetchLastGrouCode();
    setFormData(initialFormData);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleSaveOrUpdate = () => {

    const { group_Code, group_Name_E, group_Summary, group_Type, group_Order, TallyGroup } = formData;

     if (!TallyGroup || TallyGroup.trim() === "") {
      Swal.fire({
        title: "Validation Error",
        text: "Tally Group Type is mandatory. Please select a value before saving.",
        icon: "warning",
        confirmButtonText: "OK",
      });
      return;
    }

    if (isEditMode) {
      const form_data = {
        group_Code,
        group_Name_E,
        group_Summary,
        group_Type,
        group_Order,
        TallyGroup,
        Modified_By: username,
      };

      axios
        .put(
          `${API_URL}/update-finicial-group?group_Code=${formData.group_Code}&Company_Code=${companyCode}`,
          form_data
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
      const form_data = {
        group_Code,
        group_Name_E,
        group_Summary,
        group_Type,
        group_Order,
        TallyGroup,
        Created_By: username,
      };
      axios
        .post(
          `${API_URL}/create-finicial-group?Company_Code=${companyCode}`,
          form_data
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
      .get(
        `${API_URL}/get_last_group_by_company_code?Company_Code=${companyCode}`
      )
      .then((response) => {
        const data = response.data;
        setFormData({
          ...formData,
          ...data,
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
      text: `You won't be able to revert this Group Code : ${formData.group_Code}`,
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
        const deleteApiUrl = `${API_URL}/delete-finicial-group?group_Code=${formData.group_Code}&Company_Code=${companyCode}`;
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
    navigate("/financial-groups-utility");
  };

  const handleFirstButtonClick = async () => {
    try {
      const response = await fetch(`${API_URL}/get_First_GroupMaster`);
      if (response.ok) {
        const data = await response.json();
        const firstUserCreation = data[0];

        setFormData({
          ...formData,
          ...firstUserCreation,
        });
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
        `${API_URL}/get_previous_GroupMaster?group_Code=${formData.group_Code}`
      );

      if (response.ok) {
        const data = await response.json();

        setFormData({
          ...formData,
          ...data,
        });
      } else {
        console.error(
          "Failed to fetch previous Group data:",
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
        `${API_URL}/get_next_GroupMaster?group_Code=${formData.group_Code}`
      );

      if (response.ok) {
        const data = await response.json();
        setFormData({
          ...formData,
          ...data.nextSelectedRecord,
        });
      } else {
        console.error(
          "Failed to fetch next company group data:",
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
      const response = await fetch(`${API_URL}/get_last_GroupMaster`);
      if (response.ok) {
        const data = await response.json();
        const last_Navigation = data[0];

        setFormData({
          ...formData,
          ...last_Navigation,
        });
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
        `${API_URL}/get-group-by-codes?Company_Code=${companyCode}&group_Code=${selectedRecord.group_Code}`
      );
      const data = response.data;
      setFormData(data);
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
    } else {
      handleAddOne();
    }
  }, [selectedRecord]);

  const handleKeyDown = async (event) => {
    if (event.key === "Tab") {
      const changeNoValue = event.target.value;
      try {
        const response = await axios.get(
          `${API_URL}/get-group-by-codes?Company_Code=${companyCode}&group_Code=${changeNoValue}`
        );
        const data = response.data;
        setFormData(data);
        setIsEditing(false);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }
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
      )}


      {/* <Container maxWidth="sm">
        <Box
          component="form"
          noValidate
          autoComplete="off"
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            maxWidth: 600,
            margin: "auto",
            padding: 3,
            boxShadow: 3,
            borderRadius: 2,
            backgroundColor: "background.paper",
          }}
        >
          <Typography
            sx={{
              fontSize: "24px",
              fontWeight: "bold",
              color: "black",
              marginBottom: 2,
            }}
          >
            Group Master
          </Typography>

          <TextField
            label="Change No"
            id="changeNo"
            name="changeNo"
            onKeyDown={handleKeyDown}
            variant="outlined"
            fullWidth
            disabled={!addOneButtonEnabled}
          />

          <TextField
            label="Group Code"
            id="group_Code"
            name="group_Code"
            value={formData.group_Code}
            onChange={handleChange}
            variant="outlined"
            fullWidth
            disabled
          />
          <TextField
            label="Group Name"
            id="group_Name_E"
            name="group_Name_E"
            value={formData.group_Name_E}
            onChange={handleChange}
            inputRef={inputRef}
            variant="outlined"
            fullWidth
            disabled={!isEditing && addOneButtonEnabled}
          />
          <FormControl fullWidth variant="outlined">
            <InputLabel>Group Summary</InputLabel>
            <Select
              label="Group Summary"
              id="group_Summary"
              name="group_Summary"
              value={formData.group_Summary}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
            >
              <MenuItem value="Y">Yes</MenuItem>
              <MenuItem value="N">No</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth variant="outlined">
            <InputLabel>Group Type</InputLabel>
            <Select
              label="Group Type"
              id="group_Type"
              name="group_Type"
              value={formData.group_Type ? formData.group_Type : type}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
            >
              <MenuItem value="B">Balance Sheet</MenuItem>
              <MenuItem value="T">Trading</MenuItem>
              <MenuItem value="P">Profit & Loss</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Group Order"
            id="group_Order"
            name="group_Order"
            value={formData.group_Order}
            onChange={handleChange}
            variant="outlined"
            fullWidth
            disabled={!isEditing && addOneButtonEnabled}
          />
        </Box>
      </Container> */}


      <div className="flex justify-center items-center p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6 space-y-4">

          <div className="flex flex-col space-y-4">
            <div className="flex space-x-4">
              <div className="flex-1">
                <label htmlFor="changeNo" className="block text-left text-sm font-bold text-gray-800  flex items-center">
                  Change No
                </label>
                <input
                  type="text"
                  id="changeNo"
                  name="changeNo"
                  onKeyDown={handleKeyDown}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${!addOneButtonEnabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  disabled={!addOneButtonEnabled}
                />
              </div>

              <div className="flex-1 relative group">
                <label htmlFor="group_Code" className="block text-left text-sm font-bold text-gray-800  flex items-center">
                  Group Code
                  <span className="ml-1 text-xs text-gray-500">(Auto-generated)</span>
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    id="group_Code"
                    name="group_Code"
                    value={formData.group_Code}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed focus:outline-none"
                    disabled
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
            </div>

            <div>
              <label htmlFor="group_Name_E" className="block text-left text-sm font-bold text-gray-800  flex items-center">
                Group Name
              </label>
              <input
                type="text"
                id="group_Name_E"
                name="group_Name_E"
                value={formData.group_Name_E}
                onChange={handleChange}
                ref={inputRef}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${(!isEditing && addOneButtonEnabled) ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                disabled={!isEditing && addOneButtonEnabled}
              />
            </div>

            <div className="flex space-x-4">
              <div className="flex-1">
                <label htmlFor="group_Summary" className="block text-left text-sm font-bold text-gray-800  flex items-center">
                  Group Summary
                </label>
                <select
                  id="group_Summary"
                  name="group_Summary"
                  value={formData.group_Summary}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${(!isEditing && addOneButtonEnabled) ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  disabled={!isEditing && addOneButtonEnabled}
                >
                  <option value="Y">Yes</option>
                  <option value="N">No</option>
                </select>
              </div>

              <div className="flex-1">
                <label htmlFor="group_Type" className="block text-left text-sm font-bold text-gray-800  flex items-center">
                  Group Type
                </label>
                <select
                  id="group_Type"
                  name="group_Type"
                  value={formData.group_Type ? formData.group_Type : type}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${(!isEditing && addOneButtonEnabled) ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  disabled={!isEditing && addOneButtonEnabled}
                >
                  <option value="B">Balance Sheet</option>
                  <option value="T">Trading</option>
                  <option value="P">Profit & Loss</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="group_Order" className="block text-left text-sm font-bold text-gray-800  flex items-center">
                Group Order
              </label>
              <input
                type="text"
                id="group_Order"
                name="group_Order"
                value={formData.group_Order}
                onChange={handleChange}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${(!isEditing && addOneButtonEnabled) ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                disabled={!isEditing && addOneButtonEnabled}
              />
            </div>

<div className="flex-1">
              <label htmlFor="TallyGroup" className="block text-left text-sm font-bold text-gray-800  flex items-center">
                Tally Group Type
              </label>
              <select
                id="TallyGroup"
                name="TallyGroup"
                value={formData.TallyGroup ? formData.TallyGroup : tallytype}
                onChange={handleChange}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${(!isEditing && addOneButtonEnabled) ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                disabled={!isEditing && addOneButtonEnabled}
              >
                <option value="Current Assets">Current Assets</option>
                <option value="Bank Accounts">Bank Accounts</option>
                <option value="Cash-in-Hand">Cash-in-Hand</option>
                <option value="Deposits (Asset)">Deposits (Asset)</option>
                <option value="Loans & Advances (Asset)">Loans & Advances (Asset)</option>
                <option value="Stock-in-Hand">Stock-in-Hand</option>
                <option value="Sundry Debtors">Sundry Debtors</option>
                <option value="Fixed Assets">Fixed Assets</option>
                <option value="Investments">Investments</option>
                <option value="Misc. Expenses (ASSET)">Misc. Expenses (ASSET)</option>
                <option value="Branch / Divisions">Branch / Divisions</option>
                <option value="Capital Account">Capital Account</option>
                <option value="Reserves & Surplus">Reserves & Surplus</option>
                <option value="Current Liabilities">Current Liabilities</option>
                <option value="Duties & Taxes">Duties & Taxes</option>
                <option value="Provisions">Provisions</option>
                <option value="Sundry Creditors">Sundry Creditors</option>
                <option value="Loans (Liability)">Loans (Liability)</option>
                <option value="Bank OD A/c">Bank OD A/c</option>
                <option value="Secured Loans">Secured Loans</option>
                <option value="UnSecured Loans">UnSecured Loans</option>
                <option value="Suspense A/c">Suspense A/c</option>
                <option value="Profit & Loss A/c">Profit & Loss A/c</option>
                <option value="Direct Expenses">Direct Expenses</option>
                <option value="Indirect Expenses">Indirect Expenses</option>
                <option value="Purchase Accounts">Purchase Accounts</option>
                <option value="Direct Incomes">Direct Incomes</option>
                <option value="Indirect Incomes">Indirect Incomes</option>
                <option value="Sales Accounts">Sales Accounts</option>
              </select>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default forwardRef(FinicialMaster);
