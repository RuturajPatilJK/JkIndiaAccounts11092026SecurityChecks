import React, { useState, useEffect, useRef } from "react";
import NavigationButtons from "../../../../Common/CommonButtons/NavigationButtons";
import ActionButtonGroup from "../../../../Common/CommonButtons/ActionButtonGroup";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./SystemMaster.css";
import AccountMasterHelp from "../../../../Helper/AccountMasterHelp";
import GSTRateMasterHelp from "../../../../Helper/GSTRateMasterHelp";
import UserAuditInfo from "../../../../Common/UserAuditInfo/UserAuditInfo";
import { TextField, Grid, Box, Card, CardContent } from '@mui/material';
import Swal from "sweetalert2";

const API_URL = process.env.REACT_APP_API;

//Labels Global variables
var PurchName = "";
var PurchCode = "";
var SaleName = "";
var SaleCode = "";
var GStrateCode = "";
var GStrateName = "";
var selectedfilter = "";

const SystemMaster = () => {
  const location = useLocation();
  selectedfilter = location.state?.selectedfilter;
  const inputRef = useRef(null);

  const Year_Code = sessionStorage.getItem("Year_Code");
  const company_code = sessionStorage.getItem("Company_Code");

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
  const [SystemType, setSystemType] = useState(selectedfilter);
  const [purchaseAccount, setPurchaseAccount] = useState("");
  const [saleaccount, setSaleAccount] = useState("");
  const [gstRateCode, setgstRateCode] = useState("");
  const [isHandleChange, setIsHandleChange] = useState(false);
  const companyCode = sessionStorage.getItem("Company_Code");
  const username = sessionStorage.getItem("username");

  const navigate = useNavigate();

  const selectedRecord = location.state?.selectedRecord;
  const permissions = location.state?.permissionsData;

  const initialFormData = {
    //SystemType:"",
    System_Code: "",
    System_Name_E: "",
    System_Name_R: "",
    System_Rate: 0.0,
    Purchase_AC: "",
    Sale_AC: "",
    Vat_AC: "",
    Opening_Bal: 0.0,
    KgPerKatta: 0.0,
    minRate: 0.0,
    maxRate: 0.0,
    Company_Code: companyCode,
    Year_Code: Year_Code,
    Branch_Code: "",
    HSN: "",
    Opening_Value: 0.0,
    Gst_Code: 0.0,
    MarkaSet: "",
    Supercost: "",
    Packing: "",
    LodingGst: "",
    MarkaPerc: 0.0,
    SuperPerc: 0.0,
    RatePer: "",
    IsService: "",
    pac:0,
    sac:0
    // Width: 0.0,
    // LENGTH: 0.0,
    // levi: 0.0,
    // Oldcompname: "",
    // Insurance: 0.0,
    // weight: 0.0,
    //gstratecode: 0,
    //category: 0.0,
    //unit_code: 0,
  };

  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    if (isHandleChange) {
      handleCancel();
      setIsHandleChange(false);
    }
    document.getElementById("System_Name_E").focus();
  }, [SystemType]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name === "System_Type") {
      setSystemType(value);
      setIsHandleChange(true);
    } else {
      setFormData((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    }
  };

  // const fetchLastRecordSystemCode = () => {
  //   fetch(
  //     `${API_URL}/get-SystemMaster-lastRecord?Company_Code=${companyCode}&System_Type=${SystemType}`
  //   )
  //     .then((response) => {
  //       if (!response.ok) {
  //         throw new Error("Failed to fetch last record");
  //       }
  //       return response.json();
  //     })
  //     .then((data) => {
  //       setFormData((prevState) => ({
  //         ...prevState,
  //         System_Code: data.last_SystemMaster_data.System_Code + 1,
  //       }));
  //     })
  //     .catch((error) => {
  //       console.error("Error fetching last record:", error);
  //     });
  // };

  const fetchLastRecordSystemCode = () => {
  fetch(
    `${API_URL}/get-SystemMaster-lastRecord?Company_Code=${companyCode}&System_Type=${SystemType}`
  )
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch last record");
      }
      return response.json();
    })
    .then((data) => {
      const last = data?.last_SystemMaster_data;

      // If we have a valid System_Code, increment it, otherwise start from 1
      const nextCode =
        last && last.System_Code != null && !isNaN(Number(last.System_Code))
          ? Number(last.System_Code) + 1
          : 1;

      setFormData((prevState) => ({
        ...prevState,
        System_Code: nextCode,
      }));
    })
    .catch((error) => {
      console.error("Error fetching last record:", error);
      // On error you can also choose to default to 1 if you want:
      setFormData((prevState) => ({
        ...prevState,
        System_Code: 1,
      }));
    });
};


  const handleAddOne = () => {
    setAddOneButtonEnabled(false);
    setSaveButtonEnabled(true);
    setCancelButtonEnabled(true);
    setEditButtonEnabled(false);
    setDeleteButtonEnabled(false);
    setIsEditing(true);
    fetchLastRecordSystemCode();
    setFormData(initialFormData);
    PurchName = "";
    PurchCode = "";
    SaleName = "";
    SaleCode = "";
    GStrateCode = "";
    GStrateName = "";
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  useEffect(() => {
    if (selectedRecord) {
      handlerecordDoubleClicked();
    } else {
      handleAddOne();
    }
  }, [selectedRecord]);

  const handleSaveOrUpdate = () => {

    let updatedFormData = {
      ...formData,
    };

    if (isEditMode) {
      updatedFormData = {
        ...updatedFormData,
        Modified_By: username
      }
      if (SystemType === 'I') {
        if (formData.Purchase_AC === 0) {
          alert('Purchase and Sale A/C is Required For Item')
        }
      }

      axios
        .put(
          `${API_URL}/update-SystemMaster?System_Code=${formData.System_Code}&Company_Code=${companyCode}&System_Type=${SystemType}`,
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
      updatedFormData = {
        ...updatedFormData,
        Created_By: username
      }
      if (SystemType === 'I') {
        if (formData.Purchase_AC && formData.Sale_AC) {
          alert('Purchase and Sale A/C is Required For Item')
        }
      }
      axios
        .post(
          `${API_URL}/create-Record-SystemMaster?Company_Code=${companyCode}&System_Type=${SystemType}`,
          updatedFormData
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
          setTimeout(() => {
            window.location.reload();
          }, 1000);
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
        `${API_URL}/get-SystemMaster-lastRecord?Company_Code=${companyCode}&System_Type=${SystemType}`
      )
      .then((response) => {
        const data = response.data;
        if (data && data.last_SystemMaster_data) {
          PurchName = data.label_names[0].purcAcname;
          PurchCode = data.last_SystemMaster_data.Purchase_AC;
          SaleName = data.label_names[0].saleAcname;
          SaleCode = data.last_SystemMaster_data.Sale_AC;
          GStrateName = data.label_names[0].GST_Name;
          GStrateCode = data.last_SystemMaster_data.Gst_Code;
          setFormData({
            ...formData,
            ...data.last_SystemMaster_data,
          });
        } else {
          console.error("No data found for the specified SystemType");
        }
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
      text: `You want to delete System Code: ${formData.System_Code}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      cancelButtonText: "Cancel",
      confirmButtonText: "Yes, Delete",
      reverseButtons: true,
      focusCancel: true,
    });

    if (result.isConfirmed) {
      // Update UI state
      setIsEditMode(false);
      setAddOneButtonEnabled(true);
      setEditButtonEnabled(true);
      setDeleteButtonEnabled(true);
      setBackButtonEnabled(true);
      setSaveButtonEnabled(false);
      setCancelButtonEnabled(false);

      try {
        const deleteApiUrl = `${API_URL}/delete-SystemMaster?System_Code=${formData.System_Code}&Company_Code=${companyCode}&System_Type=${formData.System_Type}`;
        const response = await axios.delete(deleteApiUrl);

        Swal.fire({
          title: "Deleted!",
          text: "Record deleted successfully!",
          icon: "success",
          confirmButtonText: "OK",
        });

        handleCancel();
      } catch (error) {
        toast.error("Something went wrong!");
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
    navigate("/syetem-masterutility");
  };
  const fetchSystemMasterData = async (url, dataKey) => {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const systemData = data[dataKey];

        PurchName = data.label_names[0].purcAcname;
        PurchCode = systemData.Purchase_AC;
        SaleName = data.label_names[0].saleAcname;
        SaleCode = systemData.Sale_AC;
        GStrateName = data.label_names[0].GST_Name;
        GStrateCode = systemData.Gst_Code;

        setFormData({
          ...formData,
          ...systemData,
        });
      } else {
        console.error(
          "Failed to fetch data:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error during API call:", error);
    }
  };

  const handleFirstButtonClick = async () => {
    const url = `${API_URL}/get-first-systemmaster?Company_Code=${companyCode}&System_Type=${SystemType}`;
    await fetchSystemMasterData(url, "first_SystemMaster_data");
  };

  const handlePreviousButtonClick = async () => {
    const url = `${API_URL}/get-previous-Systemmaster?Company_Code=${companyCode}&System_Type=${SystemType}&System_Code=${formData.System_Code}`;
    await fetchSystemMasterData(url, "previous_Systemmaster_data");
  };

  const handleNextButtonClick = async () => {
    const url = `${API_URL}/get-next-SystemMaster?Company_Code=${companyCode}&System_Type=${SystemType}&System_Code=${formData.System_Code}`;
    await fetchSystemMasterData(url, "next_SystemMaster_data");
  };

  const handleLastButtonClick = async () => {
    const url = `${API_URL}/get-systemmaster-lastRecordNavigation?Company_Code=${companyCode}&System_Type=${SystemType}`;
    await fetchSystemMasterData(url, "last_systemmaster_data");
  };

  const handlerecordDoubleClicked = async () => {
    const url = `${API_URL}/get-SystemMaster-SelectedRecord?Company_Code=${companyCode}&system_code=${selectedRecord.System_Code}&System_Type=${selectedRecord.System_Type}`;
    await fetchSystemMasterData(url, "Selected_SystemMaster_data");
    setSystemType(selectedRecord.System_Type);
    setIsEditing(false);
    setIsEditMode(false);
    setAddOneButtonEnabled(true);
    setEditButtonEnabled(true);
    setDeleteButtonEnabled(true);
    setBackButtonEnabled(true);
    setSaveButtonEnabled(false);
    setCancelButtonEnabled(false);
    setUpdateButtonClicked(true);
  };

  const handleKeyDown = async (event) => {
    if (event.key === "Tab") {
      const changeNoValue = event.target.value;
      const url = `${API_URL}/get-SystemMaster-SelectedRecord?Company_Code=${companyCode}&system_code=${changeNoValue}&System_Type=${SystemType}`;
      await fetchSystemMasterData(url, "Selected_SystemMaster_data");
      setIsEditing(false);
    }
  };

  const handlePurchaseAccount = (code, accoid) => {
    setPurchaseAccount(code);
    setFormData({
      ...formData,
      Purchase_AC: code,
      pac:accoid
    });
  };

  const handleSaleAccount = (code, accoid) => {
    setSaleAccount(code);
    setFormData({
      ...formData,
      Sale_AC: code,
      sac:accoid
    });
  };

  const handleGstRateCode = (code) => {
    setgstRateCode(code);
    setFormData({
      ...formData,
      Gst_Code: code,
    });
  };

  return (
    <>
      <UserAuditInfo
        createdBy={formData.Created_By}
        modifiedBy={formData.Modified_By}
        title={"System Master"}
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

      <div>
        <form>
          <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
            <div className="flex flex-col space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="col-span-1">
                  <label htmlFor="changeNo" className="block text-left text-sm font-bold text-gray-800  flex items-center">Change No</label>
                  <input
                    type="text"
                    id="changeNo"
                    name="changeNo"
                    autoComplete="off"
                    onKeyDown={handleKeyDown}
                    disabled={!addOneButtonEnabled}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div className="col-span-1">
                  <label htmlFor="System_Type" className="block text-left text-sm font-bold text-gray-800  flex items-center">System Type</label>
                  <select
                    id="System_Type"
                    name="System_Type"
                    value={SystemType}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="G">Mobile Group</option>
                    <option value="N">Narration</option>
                    <option value="V">Vat</option>
                    <option value="I">Item</option>
                    <option value="S">Grade</option>
                    <option value="Z">Season</option>
                    <option value="U">Unit</option>
                    <option value="C">Groups</option>
                    <option value="W">Godown</option>
                    <option value="E">Events</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label htmlFor="group_Code" className="block text-left text-sm font-bold text-gray-800 flex items-center">
                    System Code
                    <span className="ml-1 text-xs text-gray-500">(Auto-generated)</span>
                  </label>
                  <div className="relative group">
                    <input
                      type="text"
                      id="System_Code"
                      name="System_Code"
                      value={formData.System_Code}
                      onChange={handleChange}
                      disabled
                      className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm sm:text-sm"
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
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="col-span-8">
                  <label htmlFor="System_Name_E" className="block text-left text-sm font-bold text-gray-800  flex items-center">System Name</label>
                  <input
                    type="text"
                    id="System_Name_E"
                    name="System_Name_E"
                    value={formData.System_Name_E}
                    onChange={handleChange}
                    ref={inputRef}
                    disabled={!isEditing && addOneButtonEnabled}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${(!isEditing && addOneButtonEnabled) ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <label
                    htmlFor="Item_Select"
                    className="block text-left text-sm font-bold text-gray-800 text-base"
                  >
                    Purchase A/c:
                  </label>
                  <div className="flex-grow">
                    <AccountMasterHelp
                      onAcCodeClick={handlePurchaseAccount}
                      CategoryName={PurchName}
                      CategoryCode={PurchCode}
                      name="Purchase_Account"
                      Ac_type={[]}
                      disabledFeild={!isEditing && addOneButtonEnabled}
                    />
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <label
                    htmlFor="Item_Select"
                    className="block text-left text-sm font-bold text-gray-800 text-base"
                  >
                    Sale Account:
                  </label>
                  <div className="flex-grow">
                    <AccountMasterHelp
                      onAcCodeClick={handleSaleAccount}
                      CategoryName={SaleName}
                      CategoryCode={SaleCode}
                      name="Sale_Account"
                      Ac_type={[]}
                      disabledFeild={!isEditing && addOneButtonEnabled}
                    />
                  </div>
                </div>
              </div>


              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="Opening_Bal" className="block text-left text-sm font-bold text-gray-800  flex items-center">Opening Balance</label>
                  <input
                    type="number"
                    id="Opening_Bal"
                    name="Opening_Bal"
                    value={formData.Opening_Bal !== null ? formData.Opening_Bal : ""}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${(!isEditing && addOneButtonEnabled) ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  />
                </div>

                <div>
                  <label htmlFor="KgPerKatta" className="block text-left text-sm font-bold text-gray-800  flex items-center">Katta/Kg</label>
                  <input
                    type="number"
                    id="KgPerKatta"
                    name="KgPerKatta"
                    value={formData.KgPerKatta !== null ? formData.KgPerKatta : ""}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${(!isEditing && addOneButtonEnabled) ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  />
                </div>

                <div>
                  <label htmlFor="minRate" className="block text-left text-sm font-bold text-gray-800  flex items-center">Minimum Rate</label>
                  <input
                    type="number"
                    id="minRate"
                    name="minRate"
                    value={formData.minRate !== null ? formData.minRate : ""}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${(!isEditing && addOneButtonEnabled) ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  />
                </div>
                <div>
                  <label htmlFor="maxRate" className="block text-left text-sm font-bold text-gray-800  flex items-center">Maximum Rate</label>
                  <input
                    type="number"
                    id="maxRate"
                    name="maxRate"
                    value={formData.maxRate !== null ? formData.maxRate : ""}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${(!isEditing && addOneButtonEnabled) ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="HSN" className="block text-left text-sm font-bold text-gray-800  flex items-center">HSN No</label>
                  <input
                    type="text"
                    id="HSN"
                    name="HSN"
                    value={formData.HSN}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${(!isEditing && addOneButtonEnabled) ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  />
                </div>

                <div>
                  <label htmlFor="Opening_Value" className="block text-left text-sm font-bold text-gray-800  flex items-center">Opening Value</label>
                  <input
                    type="number"
                    id="Opening_Value"
                    name="Opening_Value"
                    value={formData.Opening_Value !== null ? formData.Opening_Value : ""}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${(!isEditing && addOneButtonEnabled) ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  />
                </div>


                <div>
                  <label htmlFor="Opening_Value" className="block text-left text-sm font-bold text-gray-800  flex items-center">GST Code</label>
                  <div className="-ml-2">
                    <GSTRateMasterHelp
                      onAcCodeClick={handleGstRateCode}
                      GstRateName={GStrateName}
                      GstRateCode={GStrateCode}
                      name="Gst_Rate"
                      disabledFeild={!isEditing && addOneButtonEnabled}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="MarkaSet"
                    className="block text-left text-sm font-bold text-gray-800 mb-1"
                  >
                    Market Sale
                  </label>
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <select
                      id="MarkaSet"
                      name="MarkaSet"
                      value={formData.MarkaSet}
                      onChange={handleChange}
                      disabled={!isEditing && addOneButtonEnabled}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${!isEditing && addOneButtonEnabled ? "bg-gray-100 cursor-not-allowed" : ""
                        }`}
                    >
                      <option value="Y">Yes</option>
                      <option value="N">No</option>
                    </select>
                    <input
                      type="text"
                      id="MarkaPerc"
                      name="MarkaPerc"
                      value={formData.MarkaPerc !== null ? formData.MarkaPerc : ""}
                      onChange={handleChange}
                      disabled={!isEditing && addOneButtonEnabled}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${!isEditing && addOneButtonEnabled ? "bg-gray-100 cursor-not-allowed" : ""
                        }`}
                    />
                    <span className="text-sm text-gray-700 text-left">%</span>
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="Supercost"
                    className="block text-left text-sm font-bold text-gray-800 mb-1"
                  >
                    SuperCost
                  </label>
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <select
                      id="Supercost"
                      name="Supercost"
                      value={formData.Supercost}
                      onChange={handleChange}
                      disabled={!isEditing && addOneButtonEnabled}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${!isEditing && addOneButtonEnabled ? "bg-gray-100 cursor-not-allowed" : ""
                        }`}
                    >
                      <option value="Y">Yes</option>
                      <option value="N">No</option>
                    </select>
                    <input
                      type="text"
                      id="SuperPerc"
                      name="SuperPerc"
                      value={formData.SuperPerc !== null ? formData.SuperPerc : ""}
                      onChange={handleChange}
                      disabled={!isEditing && addOneButtonEnabled}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${!isEditing && addOneButtonEnabled ? "bg-gray-100 cursor-not-allowed" : ""
                        }`}
                    />
                    <span className="text-sm text-gray-700 text-left">%</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label
                    htmlFor="Packing"
                    className="block text-left text-sm font-bold text-gray-800 mb-1"
                  >
                    Packing
                  </label>
                  <select
                    id="Packing"
                    name="Packing"
                    value={formData.Packing}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${!isEditing && addOneButtonEnabled ? "bg-gray-100 cursor-not-allowed" : ""
                      }`}
                  >
                    <option value="Y">Yes</option>
                    <option value="N">No</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="LodingGst"
                    className="block text-left text-sm font-bold text-gray-800 mb-1"
                  >
                    Including GST
                  </label>
                  <select
                    id="LodingGst"
                    name="LodingGst"
                    value={formData.LodingGst}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${!isEditing && addOneButtonEnabled ? "bg-gray-100 cursor-not-allowed" : ""
                      }`}
                  >
                    <option value="Y">Yes</option>
                    <option value="N">No</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="RatePer"
                    className="block text-left text-sm font-bold text-gray-800 mb-1"
                  >
                    Rate Per
                  </label>
                  <select
                    id="RatePer"
                    name="RatePer"
                    value={formData.RatePer}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${!isEditing && addOneButtonEnabled ? "bg-gray-100 cursor-not-allowed" : ""
                      }`}
                  >
                    <option value="Q">Quantity</option>
                    <option value="K">Quintal</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="IsService"
                    className="block text-left text-sm font-bold text-gray-800 mb-1"
                  >
                    Is Service
                  </label>
                  <select
                    id="IsService"
                    name="IsService"
                    value={formData.IsService}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${!isEditing && addOneButtonEnabled ? "bg-gray-100 cursor-not-allowed" : ""
                      }`}
                  >
                    <option value="Y">Yes</option>
                    <option value="N">No</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};
export default SystemMaster;
