import React, { useState, useEffect, useRef } from "react";
import ActionButtonGroup from "../../../Common/CommonButtons/ActionButtonGroup";
import NavigationButtons from "../../../Common/CommonButtons/NavigationButtons";
import { useNavigate, useLocation } from "react-router-dom";
// import './RackLinkrailwaystation.css';
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import RackMillStationLinkInfoHelp from "../../../Helper/OnlineRailwayRackBuy/RackMillStationLinkInfoHelp";
import UserAuditInfo from "../../../Common/UserAuditInfo/UserAuditInfo";
import { Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Paper,Typography,Box } from '@mui/material';
import Swal from "sweetalert2";


const API_URL = process.env.REACT_APP_API;

var newMillid = "";
var newRailwaystationid = "";
var newMillname = "";
var newStationname = "";
var newId = "";
var toStationCode = ""

const RackMillStationLinkRateInfo = () => {

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
  const [tableData,setTableData]=useState([])

  const inputRef = useRef(null)

  const navigate = useNavigate();

  //In utility page record doubleClicked that recod show for edit functionality
  const location = useLocation();
  const selectedRecord = location.state?.selectedRecord;
  const permissions = location.state?.permissionsData;


  const initialFormData = {
    Id: null,
    Rail_Id: 0,
    From_id: 0,
    Local_Expenses:0.0,
    To_id:0,
    Min_rate:0.0,
    Full_rate:0.0,
    Distance:0,
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
      const updatedFormData = { ...prevState, [name]: value };
      return updatedFormData;
    });
  };

  const handleNextId = () => {
    fetch(`${API_URL}/get_next_id_RateInfo`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch last link station");
        }
        return response.json();
      })
      .then((data) => {
        const nextId = parseInt(data.next_id, 10);
        
        setFormData((prevState) => ({
          ...prevState,
          Id: nextId
        }));
      })
      .catch((error) => {
        console.error("Error fetching last link station:", error);
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
    setTableData([])
    newMillid = "";
    newRailwaystationid = "";
    newMillname = "";
    newStationname = "";
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleSaveOrUpdate = async() => {
    // delete formData.Id
    // if (isEditMode) {
    //   const responseData = {
    //     ...formData,
    //     Modified_By: username
    //   }
    //   axios
    //     .put(
    //       `${API_URL}/updatelinkstationInfo?Id=${formData.Id}`,
    //       responseData
    //     )
    //     .then((response) => {
    //       toast.success("Link station update successfully!");
    //       setIsEditMode(false);
    //       setAddOneButtonEnabled(true);
    //       setEditButtonEnabled(true);
    //       setDeleteButtonEnabled(true);
    //       setBackButtonEnabled(true);
    //       setSaveButtonEnabled(false);
    //       setCancelButtonEnabled(false);
    //       setUpdateButtonClicked(true);
    //       setIsEditing(false);
    //      window.location.reload()
    //     })
    //     .catch((error) => {
    //       handleCancel();
    //       console.error("Error updating data:", error);
    //     });
    // } else {
    //   const responseData = {
    //     ...formData,
    //     Created_By: username
    //   }
    //   axios
    //     .post(
    //       `${API_URL}/insertlinkstationrecord`,
    //       responseData
    //     )
    //     .then((response) => {
    //       toast.success("Link station Created successfully!");
    //       setIsEditMode(false);
    //       setAddOneButtonEnabled(true);
    //       setEditButtonEnabled(true);
    //       setDeleteButtonEnabled(true);
    //       setBackButtonEnabled(true);
    //       setSaveButtonEnabled(false);
    //       setCancelButtonEnabled(false);
    //       setUpdateButtonClicked(true);
    //       setIsEditing(false);
    //       window.location.reload()
    //     })
    //     .catch((error) => {
    //       console.error("Error saving data:", error);
    //     });
    // }
    try {
        let payload = [];

        const mills = tableData.filter((item) => item.type === 'mill');
    const stations = tableData.filter((item) => item.type === 'station');

    mills.forEach((mill) => {
      stations.forEach((station) => {
        payload.push({
          To_id: station.To_id,
          From_id: mill.Mill_id,
          Rail_Id: formData.Railway_station_id,
          Local_Expenses: parseFloat(mill.Local_Expenses) || 0,
          Min_rate: parseFloat(station.Min_rate) || 0,
          Full_rate: parseFloat(station.Full_rate) || 0,
          Distance: parseFloat(station.Distance) || 0,
          Created_By: username,
          Remark: "Testing"
        });
      });
    });
    
        // POST to backend
        const response = await axios.post(`${API_URL}/insertstationRate`, payload);
    
        if (response.status === 201) {
          toast.success("Rates inserted successfully!");
          setIsEditing(false);
          setAddOneButtonEnabled(true);
          setSaveButtonEnabled(false);
          setCancelButtonEnabled(false);
        }
      } catch (error) {
        toast.error("Failed to insert station rate!");
        console.error("Insert error:", error);
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
      .get(`${API_URL}/getLastStationRate`)
      .then((response) => {
        const rawData = response.data.data; 
        const lastRecord = rawData[0]; 
        newMillid = lastRecord.Mill_id;
        newMillname = lastRecord.Mill_name;
        newRailwaystationid = lastRecord.Rail_Id;
        newStationname = lastRecord.RailStationName;
        newId = lastRecord.Id;
        toStationCode = lastRecord.ToStationCode; 
        setFormData({
          ...formData,
          ...lastRecord,
        });
        const normalized = rawData.map((item) => ({
          ...item,
        }));
        setTableData(normalized);
      })
      .catch((error) => {
        console.error("Error fetching latest data for cancel:", error);
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
    // const result = await Swal.fire({
    //   title: "Are you sure?",
    //   text: `You won't be able to revert this Code : ${formData.Id}`,
    //   icon: "warning",
    //   showCancelButton: true,
    //   confirmButtonColor: "#d33",
    //   cancelButtonColor: "#3085d6",
    //   cancelButtonText: "Cancel",
    //   confirmButtonText: "Delete",
    //   reverseButtons: true,
    //   focusCancel: true,
    // });

    // if (result.isConfirmed) {
    //   setIsEditMode(false);
    //   setAddOneButtonEnabled(true);
    //   setEditButtonEnabled(true);
    //   setDeleteButtonEnabled(true);
    //   setBackButtonEnabled(true);
    //   setSaveButtonEnabled(false);
    //   setCancelButtonEnabled(false);

    //   try {
    //     const deleteApiUrl = `${API_URL}/delete_linkstation_info?Id=${formData.Id}`;
    //     const response = await axios.delete(deleteApiUrl);
    //     toast.success("Record deleted successfully!");
    //     handleCancel();
    //   } catch (error) {
    //     toast.error("Deletion cancelled");
    //     console.error("Error during API call:", error);
    //   }
    // } else {
    //   Swal.fire({
    //     title: "Cancelled",
    //     text: "Your record is safe 🙂",
    //     icon: "info",
    //   });
    // }
  };

  const handleBack = () => {
    navigate("/rack-from-to-railway-station-rate-utility");
  };

  const handleFirstButtonClick = async () => {
    // try {
    //   const response = await fetch(
    //     `${API_URL}/getFirstlinkstation?Id=${newId}`
    //   );
    //   if (response.ok) {
    //     const data = await response.json();

    //     newMillid = data.label_names[0].Mill_id;
    //     newMillname = data.label_names[0].Mill_name;
    //     newRailwaystationid = data.label_names[0].Railway_station_id;
    //     newStationname = data.label_names[0].Station_name;
    //     newId = data.first_link_station_data.Id
    //     setFormData({
    //       ...formData,
    //       ...data.first_link_station_data,
    //     });
    //   } else {
    //     console.error(
    //       "Failed to fetch first link station data:",
    //       response.status,
    //       response.statusText
    //     );
    //   }
    // } catch (error) {
    //   console.error("Error during API call:", error);
    // }
  };

  const handlePreviousButtonClick = async () => {
    // try {
    //   const response = await fetch(
    //     `${API_URL}/getPreviouslinkstation?Id=${newId}`
    //   );

    //   if (response.ok) {
    //     const data = await response.json();
    //     newMillid = data.label_names[0].Id;
    //     newMillname = data.label_names[0].Mill_name;
    //     newRailwaystationid = data.label_names[0].Railway_station_id;
    //     newStationname = data.label_names[0].Station_name;
    //     newId = data.previous_link_station_data.Id
    //     setFormData({
    //       ...formData,
    //       ...data.previous_link_station_data,
    //     });
    //   } else {
    //     console.error(
    //       "Failed to fetch previous link station data:",
    //       response.status,
    //       response.statusText
    //     );
    //   }
    // } catch (error) {
    //   console.error("Error during API call:", error);
    // }
  };

  const handleNextButtonClick = async () => {
    // try {
    //   const response = await fetch(
    //     `${API_URL}/getNextlinkstation?Id=${newId}`
    //   );

    //   if (response.ok) {
    //     const data = await response.json();
    //     newMillid = data.label_names[0].Id;
    //     newMillname = data.label_names[0].Mill_name;
    //     newRailwaystationid = data.label_names[0].Railway_station_id;
    //     newStationname = data.label_names[0].Station_name;
    //     newId = data.Next_Link_Station_data.Id
    //     setFormData({
    //       ...formData,
    //       ...data.Next_Link_Station_data,
    //     });
    //   } else {
    //     console.error(
    //       "Failed to fetch next link station data:",
    //       response.status,
    //       response.statusText
    //     );
    //   }
    // } catch (error) {
    //   console.error("Error during API call:", error);
    // }
  };

  const handleLastButtonClick = async () => {
    // try {
    //   const response = await fetch(`${API_URL}/getLastlinkstation`);
    //   if (response.ok) {
    //     const data = await response.json();
    //     newMillid = data.label_names[0].Mill_id;
    //     newMillname = data.label_names[0].Mill_name;
    //     newRailwaystationid = data.label_names[0].Railway_station_id;
    //     newStationname = data.label_names[0].Station_name;
    //     newId = data.last_link_station_data.Id
    //     setFormData({
    //       ...formData,
    //       ...data.last_link_station_data,
    //     });
    //   } else {
    //     console.error(
    //       "Failed to fetch last link station data:",
    //       response.status,
    //       response.statusText
    //     );
    //   }
    // } catch (error) {
    //   console.error("Error during API call:", error);
    // }
  };

  //Handle Record DoubleCliked in Utility Page Show that record for Edit
  const handlerecordDoubleClicked = async () => {
    // try {
    //   const response = await axios.get(
    //     `${API_URL}/getlinkstationbyId?&Id=${selectedRecord.Id}`
    //   );
    //   const data = response.data;

    //     newMillid = data.label_names[0].Mill_id;
    //     newMillname = data.label_names[0].Mill_name;
    //     newRailwaystationid = data.label_names[0].Railway_station_id;
    //     newStationname = data.label_names[0].Station_name;
    //   setFormData({
    //     ...formData,
    //     ...data.Link_Station_data
    //   });
    //   setIsEditing(false);
    // } catch (error) {
    //   console.error("Error fetching data:", error);
    // }

    // setIsEditMode(false);
    // setAddOneButtonEnabled(true);
    // setEditButtonEnabled(true);
    // setDeleteButtonEnabled(true);
    // setBackButtonEnabled(true);
    // setSaveButtonEnabled(false);
    // setCancelButtonEnabled(false);
    // setUpdateButtonClicked(true);
    // setIsEditing(false);
  };

  useEffect(() => {
    if (selectedRecord) {
      handlerecordDoubleClicked();
    } else {
      handleAddOne();
    }
  }, [selectedRecord]);

  useEffect(() => {
    // axios.get(`${API_URL}/getAllmillinfo`)
    //     .then(response => setMills(response.data))
    //     .catch(error => console.error("Error fetching mills:", error));

    // axios.get(`${API_URL}/getAllstation`)
    //     .then(response => setStations(response.data))
    //     .catch(error => console.error("Error fetching stations:", error));
    // document.getElementById('Mill_id').focus();
        
  }, []);

  //change No functionality to get that particular record
//   const handleKeyDown = async (event) => {
//     if (event.key === "Tab") {
//       const changeNoValue = event.target.value;
//       try {
//         const response = await axios.get(
//           `${API_URL}/get-BrandMasterSelectedRecord?Company_Code=${companyCode}&Code=${changeNoValue}`
//         );
//         const data = response.data;

//         ItemCodeNew = data.label_names[0].Mal_Code;
//         ItemName = data.label_names[0].System_Name_E;
//         setFormData({
//           ...formData,
//           ...data.selected_Record_data,
//         });
//         setIsEditing(false);
//       } catch (error) {
//         console.error("Error fetching data:", error);
//       }
//     }
//   };

//   //Functionality to help section to set the record.
//   const handleMillid = (id, name) => {
//     setMillId(id);
//     setMillName(name)
//     setFormData({
//       ...formData,
//       Mill_id: id,

//     });
//   };

  const handleStationid = (id, name) => {
    setMillId(id);
    setMillName(name)
    setFormData({
      ...formData,
      Railway_station_id: id,

    });
  };

  const fetchTableData = async (responseData) => {
    const { all_data = [], stationData = [] } = responseData;
  
    const mills = all_data.map((mill) => ({
      type: "mill",
      Mill_id: mill.Mill_id,
      Mill_name: mill.Mill_name,
      Local_Expenses: parseFloat(mill.Local_Expenses) || 0,
      Railway_station_id: mill.Railway_station_id,
    }));
  
    const millStationIds = new Set(all_data.map((mill) => mill.Railway_station_id));
  
    // Fetch rates from new API
    let ratesByToId = {};
    const railId = all_data[0]?.Railway_station_id || 0;
  
    if (railId) {
      try {
        const rateResponse = await axios.get(`${API_URL}/getStationRatesByRailId`, {
          params: { Rail_Id: railId },
        });
  
        if (rateResponse.data?.rates) {
          ratesByToId = rateResponse.data.rates;
        }
      } catch (err) {
        console.error("Error fetching station rates:", err);
      }
    }
  
    const stations = stationData
      .filter((station) => !millStationIds.has(station.To_id))
      .map((station) => {
        const rateInfo = ratesByToId[station.To_id] || {};
        return {
          type: "station",
          To_id: station.To_id,
          ToStationCode: station.toStationCode,
          ToStationName: station.toStationName,
          Station_type: station.Station_type,
          Min_rate: rateInfo.Min_rate || 0,
          Full_rate: rateInfo.Full_rate || 0,
          Distance: rateInfo.Distance || 0,
        };
      });
  
    setTableData([...mills, ...stations]);
  
    setFormData((prev) => ({
      ...prev,
      Rail_Id: railId,
    }));
  
    newMillid = all_data[0]?.Mill_id || "";
    newMillname = all_data[0]?.Mill_name || "";
    toStationCode = stationData[0]?.toStationCode || "";
  };
  
//   const onChangeInput = (e, Id) => {
//     const { name, value } = e.target

//     const editData = tableData.map((item) =>
//       item.Id === Id && name ? { ...item, [name]: value } : item
//     )
//     setTableData(editData)
//   }

const onChangeInputById = (type, idField, idValue, field, value) => {
  const updatedData = tableData.map(item => {
    if (item.type === type && item[idField] === idValue) {
      return { ...item, [field]: value };
    }
    return item;
  });
  setTableData(updatedData);
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
        <Typography variant="h5" gutterBottom>
    Link Railway Station
  </Typography>
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
      <br></br>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2, mb: 4 }}>

  <Box component="form" noValidate autoComplete="off">
  <Grid container spacing={2}>

    {/* Change No */}
    <Grid item xs={12} md={2.5}>
      <Grid container alignItems="center" spacing={1}>
        <Grid item xs={4}>
          <label htmlFor="changeNo" className="form-label">Change No:</label>
        </Grid>
        <Grid item xs={8}>
          <input
            type="text"
            id="changeNo"
            name="changeNo"
            autoComplete="off"
            disabled
            className="form-input"
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </Grid>
      </Grid>
    </Grid>

    {/* Id */}
    <Grid item xs={12} md={2.5}>
      <Grid container alignItems="center" spacing={1}>
        <Grid item xs={4}>
          <label htmlFor="Id" className="form-label">Id:</label>
        </Grid>
        <Grid item xs={8}>
          <input
            type="text"
            id="Id"
            name="Id"
            autoComplete="off"
            value={formData.Id}
            onChange={handleChange}
            disabled
            className="form-input"
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </Grid>
      </Grid>
    </Grid>

    {/* Station Id */}
    <Grid item xs={12} md={2.5}>
      <Grid container alignItems="center" spacing={1}>
        <Grid item xs={4}>
          <label htmlFor="Station_Id" className="form-label">Station Id:</label>
        </Grid>
        <Grid item xs={8}>
          <RackMillStationLinkInfoHelp
            onAcCodeClick={handleStationid}
            name="Rail_Id"
            stationName={newStationname}
            id={newRailwaystationid}
            tableData={fetchTableData}
            type={""}
            tabIndexHelp={3}
            className="account-master-help"
            disabledFeild={!isEditing && addOneButtonEnabled}
          />
        </Grid>
      </Grid>
    </Grid>

  </Grid>
</Box>

</Paper>

{/* Enhanced Tables */}
<Grid container spacing={3}>
  {/* Mill Table */}
  <Grid item xs={12} md={6}>
    <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
            <TableCell sx={{ fontWeight: 'bold' }}>Mill Id</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Mill Name</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Local Expenses</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
        {tableData
  .filter((item) => item.type === 'mill')
  .map((item, index) => (
    <TableRow key={`mill-${index}`}>
      <TableCell>{item.Mill_id}</TableCell>
      <TableCell>{item.Mill_name}</TableCell>
      <TableCell>
        <TextField
          type="number"
          variant="outlined"
          size="small"
          value={item.Local_Expenses}
          onChange={(e) =>
            onChangeInputById('mill', 'Mill_id', item.Mill_id, 'Local_Expenses', e.target.value)
          }
          fullWidth
        />
      </TableCell>
    </TableRow>
))}
        </TableBody>
      </Table>
    </TableContainer>
  </Grid>

  {/* Station Rate Table */}
  <Grid item xs={12} md={6}>
    <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
            <TableCell sx={{ fontWeight: 'bold' }}>Station Code</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Station Name</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Min Rate</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Full Rate</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Distance</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
        {tableData
  .filter((item) => item.type === 'station')
  .map((item, index) => (
    <TableRow key={`station-${index}`}>
      <TableCell>{item.ToStationCode}</TableCell>
      <TableCell>{item.ToStationName}</TableCell>
      <TableCell>
        <TextField
          type="number"
          variant="outlined"
          size="small"
          value={item.Min_rate}
          onChange={(e) =>
            onChangeInputById('station', 'To_id', item.To_id, 'Min_rate', e.target.value)
          }
          fullWidth
        />
      </TableCell>
      <TableCell>
        <TextField
          type="number"
          variant="outlined"
          size="small"
          value={item.Full_rate}
          onChange={(e) =>
            onChangeInputById('station', 'To_id', item.To_id, 'Full_rate', e.target.value)
          }
          fullWidth
        />
      </TableCell>
      <TableCell>
        <TextField
          type="number"
          variant="outlined"
          size="small"
          value={item.Distance}
          onChange={(e) =>
            onChangeInputById('station', 'To_id', item.To_id, 'Distance', e.target.value)
          }
          fullWidth
        />
      </TableCell>
    </TableRow>
))}

        </TableBody>
      </Table>
    </TableContainer>
  </Grid>
</Grid>
      </div>
    </>
  );
};

export default RackMillStationLinkRateInfo;
