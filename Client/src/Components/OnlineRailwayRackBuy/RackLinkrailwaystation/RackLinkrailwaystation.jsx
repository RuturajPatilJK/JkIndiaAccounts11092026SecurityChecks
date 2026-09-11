import React, { useState, useEffect, useRef } from "react";
import ActionButtonGroup from "../../../Common/CommonButtons/ActionButtonGroup";
import NavigationButtons from "../../../Common/CommonButtons/NavigationButtons";
import { useNavigate, useLocation } from "react-router-dom";
import "./RackLinkrailwaystation.css";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import RackMillInfoHelp from "../../../Helper/OnlineRailwayRackBuy/RackMillInfoHelp";
import RackRailwaystationMasterHelp from "../../../Helper/OnlineRailwayRackBuy/RackRailwaystationMasterHelp";
import UserAuditInfo from "../../../Common/UserAuditInfo/UserAuditInfo";
import Swal from "sweetalert2";

const API_URL = process.env.REACT_APP_API;

var newMillid = "";
var newRailwaystationid = "";
var newMillname = "";
var newStationname = "";
var newId = "";

const RackLinkrailwaystation = () => {
  //GET values from session Storage
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
  const [millId, setMillId] = useState("");
  const [millName, setMillName] = useState("");
  const [stationId, setstationId] = useState("");
  const [stationName, setstationName] = useState("");

  const inputRef = useRef(null);

  const navigate = useNavigate();

  //In utility page record doubleClicked that recod show for edit functionality
  const location = useLocation();
  const selectedRecord = location.state?.selectedRecord;
  const permissions = location.state?.permissionsData;

  const initialFormData = {
    Id: null,
    Mill_id: 0,
    Railway_station_id: 0,
    Local_enpenses: 0.0,
    Remark: "",
    Created_By: "",
    Modified_By: "",
  };

  const [formData, setFormData] = useState(initialFormData);

  // Handle change for all inputs
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevState) => {
      const updatedFormData = { ...prevState, [name]: value.toUpperCase() };
      return updatedFormData;
    });
  };

  const handleNextId = () => {
    fetch(`${API_URL}/get-next-linkRail-id`)
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
    newMillid = "";
    newRailwaystationid = "";
    newMillname = "";
    newStationname = "";
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleSaveOrUpdate = () => {
    if (isEditMode) {
      delete formData.Id;
      const responseData = {
        ...formData,
        Modified_By: username,
      };
      axios
        .put(`${API_URL}/updatelinkstationInfo?Id=${newId}`, responseData)
        .then((response) => {
          toast.success("Link station update successfully!");
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
        });
    } else {
      const responseData = {
        ...formData,
        Created_By: username,
      };
      axios
        .post(`${API_URL}/insertlinkstationrecord`, responseData)
        .then((response) => {
          toast.success("Link station Created successfully!");
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
      .get(`${API_URL}/getLastlinkstation`)
      .then((response) => {
        const data = response.data;
        newMillid = data.label_names[0].Mill_id;
        newMillname = data.label_names[0].Mill_name;
        newRailwaystationid = data.label_names[0].Railway_station_id;
        newStationname = data.label_names[0].Station_name;
        newId = data.last_link_station_data.Id;
        setFormData({
          ...formData,
          ...data.last_link_station_data,
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
        const deleteApiUrl = `${API_URL}/delete_linkstation_info?Id=${formData.Id}`;
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
    navigate("/rack-link-railway-station-utility");
  };

  const handleFirstButtonClick = async () => {
    try {
      const response = await fetch(
        `${API_URL}/getFirstlinkstation?Id=${newId}`
      );
      if (response.ok) {
        const data = await response.json();

        newMillid = data.label_names[0].Mill_id;
        newMillname = data.label_names[0].Mill_name;
        newRailwaystationid = data.label_names[0].Railway_station_id;
        newStationname = data.label_names[0].Station_name;
        newId = data.first_link_station_data.Id;
        setFormData({
          ...formData,
          ...data.first_link_station_data,
        });
      } else {
        console.error(
          "Failed to fetch first link station data:",
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
        `${API_URL}/getPreviouslinkstation?Id=${newId}`
      );

      if (response.ok) {
        const data = await response.json();
        newMillid = data.label_names[0].Id;
        newMillname = data.label_names[0].Mill_name;
        newRailwaystationid = data.label_names[0].Railway_station_id;
        newStationname = data.label_names[0].Station_name;
        newId = data.previous_link_station_data.Id;
        setFormData({
          ...formData,
          ...data.previous_link_station_data,
        });
      } else {
        console.error(
          "Failed to fetch previous link station data:",
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
      const response = await fetch(`${API_URL}/getNextlinkstation?Id=${newId}`);

      if (response.ok) {
        const data = await response.json();
        newMillid = data.label_names[0].Id;
        newMillname = data.label_names[0].Mill_name;
        newRailwaystationid = data.label_names[0].Railway_station_id;
        newStationname = data.label_names[0].Station_name;
        newId = data.Next_Link_Station_data.Id;
        setFormData({
          ...formData,
          ...data.Next_Link_Station_data,
        });
      } else {
        console.error(
          "Failed to fetch next link station data:",
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
      const response = await fetch(`${API_URL}/getLastlinkstation`);
      if (response.ok) {
        const data = await response.json();
        newMillid = data.label_names[0].Mill_id;
        newMillname = data.label_names[0].Mill_name;
        newRailwaystationid = data.label_names[0].Railway_station_id;
        newStationname = data.label_names[0].Station_name;
        newId = data.last_link_station_data.Id;
        setFormData({
          ...formData,
          ...data.last_link_station_data,
        });
      } else {
        console.error(
          "Failed to fetch last link station data:",
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
        `${API_URL}/getlinkstationbyId?&Id=${selectedRecord.Id}`
      );
      const data = response.data;

      newMillid = data.label_names[0].Mill_id;
      newMillname = data.label_names[0].Mill_name;
      newRailwaystationid = data.label_names[0].Railway_station_id;
      newStationname = data.label_names[0].Station_name;
      setFormData({
        ...formData,
        ...data.Link_Station_data,
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
      const changeNoValue = event.target.value;
      try {
        const response = await axios.get(
          `${API_URL}/getlinkstationbyId?&Id=${changeNoValue}`
        );
        const data = response.data;

        newMillid = data.label_names[0].Mill_id;
        newMillname = data.label_names[0].Mill_name;
        newRailwaystationid = data.label_names[0].Railway_station_id;
        newStationname = data.label_names[0].Station_name;
        setFormData({
          ...formData,
          ...data.Link_Station_data,
        });
        setIsEditing(false);
        setIsEditing(false);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }
  };

  //Functionality to help section to set the record.
  const handleMillid = (id, name) => {
    setMillId(id);
    setMillName(name);
    setFormData({
      ...formData,
      Mill_id: id,
    });
  };

  const handleStationid = (id, name) => {
    setMillId(id);
    setMillName(name);
    setFormData({
      ...formData,
      Railway_station_id: id,
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
      <div>
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
      <div>
        <form className="rack-link-station-info-form">
          <h2 className="form-title">Link Railway Station</h2>
          <br />
          <div className="form-group">
            <label htmlFor="changeNo" className="form-label">
              Change No:
            </label>
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
          <br></br>
          <div className="form-group">
            <label htmlFor="Id" className="form-label">
              Id:
            </label>
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
          <br></br>
          <div className="form-group">
            <label htmlFor="Mill_Id" className="form-label">
              Mill Id:
            </label>
            <RackMillInfoHelp
              onAcCodeClick={handleMillid}
              name="Mill_Id" // 🔹 Use a unique name
              MillName={newMillname}
              MillId={newMillid}
              tabIndexHelp={3}
              className="account-master-help"
              disabledFeild={!isEditing && addOneButtonEnabled}
            />
          </div>
          <br></br>
          <div className="form-group">
            <label htmlFor="Station_Id" className="form-label">
              Station Id:
            </label>
            <RackRailwaystationMasterHelp
              onAcCodeClick={handleStationid}
              name="Station_Id" // 🔹 Use a unique name
              StationName={newStationname}
              StationId={newRailwaystationid}
              tabIndexHelp={3}
              className="account-master-help"
              disabledFeild={!isEditing && addOneButtonEnabled}
            />
          </div>
          <br></br>
          <div className="form-group">
            <label htmlFor="Local_enpenses" className="form-label">
              Local Enpenses:
            </label>
            <input
              tabIndex={5}
              type="text"
              id="Local_enpenses"
              name="Local_enpenses"
              autoComplete="off"
              value={formData.Local_enpenses}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              className="form-input"
            />
          </div>
          <br></br>
          <div className="form-group">
            <label htmlFor="Remark" className="form-label">
              Remark:
            </label>
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

export default RackLinkrailwaystation;
