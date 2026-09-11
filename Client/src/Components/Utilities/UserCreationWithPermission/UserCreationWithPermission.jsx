import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import { useNavigate, useLocation } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import {
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
} from "@mui/material";
import ActionButtonGroup from "../../../Common/CommonButtons/ActionButtonGroup";
import NavigationButtons from "../../../Common/CommonButtons/NavigationButtons";
import { Button } from "react-bootstrap";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Checkbox, FormControlLabel } from '@mui/material';
import Swal from "sweetalert2";

var uid;

// Common style for all table headers
const headerCellStyle = {
  fontWeight: 'bold',
  backgroundColor: '#3f51b5',
  padding: "6px",
  color: 'white',
  '&:hover': {
    backgroundColor: '#303f9f',
    cursor: 'pointer',
  },
};

const UserCreationWithPermission = () => {
  const API_URL = process.env.REACT_APP_API;
  const companyCode = sessionStorage.getItem("Company_Code");
  const yearCode = sessionStorage.getItem("Year_Code");
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
  const navigate = useNavigate();
  const location = useLocation();
  const selectedRecord = location.state?.selectedRecord;
  const permissionsData = location.state?.permissionsData;
  const initialFormData = {
    User_Id: "",
    User_Name: "",
    User_Type: "",
    Password: "",
    EmailId: "",
    EmailPassword: "",
    smtpServerPort: "",
    AuthoGroupID: null,
    Ac_Code: null,
    Company_Code: companyCode,
    Mobile: "",
    LastActivityDate: "",
    RetryAttempts: null,
    IsLocked: true,
    LockedDateTime: "",
    Branch_Code: 1,
    uid: null,
    userfullname: "",
    User_Security: "",
    Bank_Security: "",
    PaymentsPassword: "",
    User_Password: "",
  };
  const [userData, setUserData] = useState(initialFormData);
  const [permissions, setPermissions] = useState([]);
  const [programNames, setProgramNames] = useState([]);
  const [menuNames, setMenuNames] = useState([]);

  //default showing list of forms with permission
  const fetchProgramNames = () => {
    axios
      .get(`${API_URL}/getProgramNames`)
      .then((response) => {
        const programNames = [...new Set(response.data.programNames)];
        const menuNames = [...new Set(response.data.menuNames)];

        const maxLength = Math.max(programNames.length, menuNames.length);
        const permissionsList = Array.from(
          { length: maxLength },
          (_, index) => ({
            Detail_Id: index + 1,
            Program_Name: programNames[index] || null,
            menuNames: menuNames[index] || null,
            canView: "Y",
            canSave: "Y",
            canEdit: "Y",
            canDelete: "Y",
            DND: "N",
          })
        );

        setPermissions(permissionsList);
        setProgramNames(programNames);
        setMenuNames(menuNames);
      })
      .catch((error) =>
        console.error("Error fetching program and menu names:", error)
      );
  };

  useEffect(() => {
    fetchProgramNames();
  }, []);

  useEffect(() => {
    if (selectedRecord) {
      handlerecordDoubleClicked();
    } else {
      handleAddOne();
    }
  }, [selectedRecord]);

  //for input field state changing
  const handleUserChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  // Toggle permission checkboxes with "Y" or "N" values
  const handlePermissionChange = (Detail_Id, field) => {
    setPermissions((prevPermissions) =>
      prevPermissions.map((perm) => {
        if (perm.Detail_Id === Detail_Id) {
          if (field === "DND" && perm[field] === "N") {
            return {
              ...perm,
              DND: "Y",
              canView: "N",
              canSave: "N",
              canEdit: "N",
              canDelete: "N",
            };
          } else if (field === "DND" && perm[field] === "Y") {
            return {
              ...perm,
              DND: "N",
              canView: "Y",
              canSave: "Y",
              canEdit: "Y",
              canDelete: "Y",
            };
          } else {
            return { ...perm, [field]: perm[field] === "Y" ? "N" : "Y" };
          }
        }
        return perm;
      })
    );
  };

  //fetching next doc_no
  const fetchNextDocNo = () => {
    fetch(`${API_URL}/get-next-user-Id?Company_Code=${companyCode}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch last record");
        }
        return response.json();
      })
      .then((data) => {
        setUserData((prevState) => ({
          ...prevState,
          User_Id: data.next_doc_no,
        }));
      })
      .catch((error) => {
        console.error("Error fetching last record:", error);
      });
  };

  const handleAddOne = async () => {
    setAddOneButtonEnabled(false);
    setSaveButtonEnabled(true);
    setCancelButtonEnabled(true);
    setEditButtonEnabled(false);
    setDeleteButtonEnabled(false);
    setIsEditMode(false);
    setIsEditing(true);
    fetchNextDocNo();
    setUserData(initialFormData);
    fetchProgramNames();
  };

  const handleSaveOrUpdate = () => {
    setIsEditing(true);

    const updatedPermissions = permissions.map((perm) => {
      const { udid, ...rest } = perm;
      return {
        ...rest,
        Year_Code: yearCode,
        Company_Code: companyCode,
      };
    });
    const requestData = {
      user_data: userData,
      permission_data: updatedPermissions,
    };

    const apiUrl = isEditMode
      ? `${API_URL}/update-user?uid=${userData.uid}`
      : `${API_URL}/insert-user`;

    const apiMethod = isEditMode ? axios.put : axios.post;

    apiMethod(apiUrl, requestData)
      .then(() => {
        const successMessage = isEditMode
          ? "Record updated successfully!"
          : "Record created successfully!";

        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: successMessage,
        });
        setUserData(initialFormData);
        setPermissions((prevPermissions) =>
          prevPermissions.map((perm) => ({
            ...perm,
            canView: "N",
            canSave: "N",
            canEdit: "N",
            canDelete: "N",
            DND: "N",
          }))
        );

        if (isEditMode) {
          setIsEditMode(false);
          setAddOneButtonEnabled(true);
          setEditButtonEnabled(true);
          setDeleteButtonEnabled(true);
          setBackButtonEnabled(true);
          setSaveButtonEnabled(false);
          setCancelButtonEnabled(false);
          setIsEditing(true);

          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      })
      .catch((error) => {
        console.error(
          `Error ${isEditMode ? "updating" : "saving"} data:`,
          error
        );
        toast.error(
          `Error occurred while ${isEditMode ? "updating" : "saving"} data`
        );
      });
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

  const handleDelete = async () => {
    const isConfirmed = window.confirm(
      `Are you sure you want to delete this record ${userData.User_Id}?`
    );
    if (isConfirmed) {
      setIsEditMode(false);
      setAddOneButtonEnabled(true);
      setEditButtonEnabled(true);
      setDeleteButtonEnabled(true);
      setBackButtonEnabled(true);
      setSaveButtonEnabled(false);
      setCancelButtonEnabled(false);
      //setIsLoading(true);
      try {
        const deleteApiUrl = `${API_URL}/delete_user?uid=${uid}&Company_Code=${companyCode}`;
        const response = await axios.delete(deleteApiUrl);

        if (response.status === 200) {
          if (response.data) {
            toast.success("Data delete successfully!");
            handleCancel();
          } else if (response.status === 404) {
          }
        } else {
          console.error(
            "Failed to delete tender:",
            response.status,
            response.statusText
          );
        }
      } catch (error) {
        console.error("Error during API call:", error);
      } finally {
        // setIsLoading(false)
      }
    } else {
      console.log("Deletion cancelled");
    }
  };

  const handleBack = () => {
    navigate("/user-permission-utility");
  };

  //Reusable function for navigations
  const fetchAndSetUserData = async (endpoint, params = {}) => {
    try {
      const queryString = new URLSearchParams({
        Company_Code: companyCode,
        ...params,
      }).toString();
      const response = await axios.get(`${API_URL}/${endpoint}?${queryString}`);

      if (response.status === 200) {
        const data = response.data;

        setUserData((prevData) => ({
          ...prevData,
          ...data.lastUserData,
        }));

        const distinctProgramNames = [...new Set(programNames)];
        const permissions = data.lastUserPermissionData || [];

        const distinctMenuNames = [...new Set(menuNames)];
        const defaultMenuNames = distinctMenuNames.length
          ? distinctMenuNames
          : distinctProgramNames.map(() => "No Menu");

        const combinedPermissions = distinctProgramNames.map(
          (program, index) => {
            const userPermission = permissions.find(
              (perm) => perm.Program_Name === program
            );

            return {
              Detail_Id: index + 1,
              Program_Name: program,
              menuNames: defaultMenuNames[index],
              canView: userPermission?.canView || "N",
              canSave: userPermission?.canSave || "N",
              canEdit: userPermission?.canEdit || "N",
              canDelete: userPermission?.canDelete || "N",
              DND: userPermission?.DND || "N",
            };
          }
        );

        setPermissions(combinedPermissions);
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
    resetUIState();
    await fetchAndSetUserData("getFirstUserWithPermissions");
  };

  const handleNextButtonClick = async () => {
    resetUIState();
    await fetchAndSetUserData("getNextUserWithPermissions", {
      User_Id: userData.User_Id,
    });
  };

  const handlePreviousButtonClick = async () => {
    resetUIState();
    await fetchAndSetUserData("getPreviousUserWithPermissions", {
      User_Id: userData.User_Id,
    });
  };

  const handlerecordDoubleClicked = async () => {
    setIsEditing(false);
    setIsEditMode(false);
    setAddOneButtonEnabled(true);
    setEditButtonEnabled(true);
    setDeleteButtonEnabled(true);
    setBackButtonEnabled(true);
    setSaveButtonEnabled(false);
    setCancelButtonEnabled(false);
    setCancelButtonClicked(true);

    try {
      const programMenuResponse = await axios.get(`${API_URL}/getProgramNames`);
      const programNames = [...new Set(programMenuResponse.data.programNames)];
      const menuNames = [...new Set(programMenuResponse.data.menuNames)];
      const defaultMenuNames = menuNames.length
        ? menuNames
        : programNames.map(() => "No Menu");
      const maxLength = Math.max(programNames.length, defaultMenuNames.length);
      const permissionsList = Array.from({ length: maxLength }, (_, index) => ({
        Detail_Id: index + 1,
        Program_Name: programNames[index] || null,
        menuNames: defaultMenuNames[index] || null,
        canView: "N",
        canSave: "N",
        canEdit: "N",
        canDelete: "N",
        DND: "Y",
      }));

      setPermissions(permissionsList);
      setProgramNames(programNames);
      setMenuNames(defaultMenuNames);
      const userPermissionResponse = await axios.get(
        `${API_URL}/getUserWithPermissionById?Company_Code=${companyCode}&User_Id=${selectedRecord.User_Id}`
      );

      if (userPermissionResponse.status === 200) {
        const data = userPermissionResponse.data;
        const permissions = data.lastUserPermissionData || [];

        const combinedPermissions = programNames.map((program, index) => {
          const userPermission = permissions.find(
            (perm) => perm.Program_Name === program
          );

          return {
            Detail_Id: index + 1,
            Program_Name: program,
            menuNames: defaultMenuNames[index] || "No Menu",
            canView: userPermission?.canView || "N",
            canSave: userPermission?.canSave || "N",
            canEdit: userPermission?.canEdit || "N",
            canDelete: userPermission?.canDelete || "N",
            DND: userPermission?.DND || "N",
          };
        });

        setPermissions(combinedPermissions);
        setUserData((prevData) => ({
          ...prevData,
          ...data.lastUserData,
        }));
      } else {
        console.error(
          "Failed to fetch user data:",
          userPermissionResponse.status,
          userPermissionResponse.statusText
        );
      }
    } catch (error) {
      console.error("Error during API calls:", error);
    }
  };

  const handleCancel = async () => {
    resetUIState();
    await fetchAndSetUserData("getLastUserWithPermissions");
  };

  const resetUIState = () => {
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

  return (
    <div>
      <ToastContainer autoClose={500} />
      <Typography
        variant="h4"
        align="center"
        style={{
          marginTop: "20px",
          fontWeight: "bold",
          fontSize: "18px",
          color: "#000000ff",
        }}
      >
        User Management
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
        permissions={permissionsData}
      />
      <div>
        <NavigationButtons
          handleFirstButtonClick={handleFirstButtonClick}
          handlePreviousButtonClick={handlePreviousButtonClick}
          handleNextButtonClick={handleNextButtonClick}
          handleLastButtonClick={handleCancel}
          highlightedButton={highlightedButton}
          isEditing={isEditing}
        />
      </div>

      {/* <Grid
        container
        spacing={1}
        direction="column"
        alignItems="center"
        justifyContent="center"
        mt={2}
      >
        {[
          { label: "User Id", name: "User_Id", disabled: true },
          { label: "Full Name", name: "userfullname" },
          { label: "User Name", name: "User_Name" },
          { label: "User Password", name: "User_Password", type: "password" },
          { label: "Email Id", name: "EmailId", type: "email" },
          { label: "Email Password", name: "EmailPassword", type: "password" },
          { label: "Mobile No", name: "Mobile" },
          { label: "Payments Password", name: "PaymentsPassword" },
        ].map((field, index) => (
          <Grid
            Grid
            item
            xs={12}
            sm={6}
            key={index}
            style={{ maxWidth: "400px", width: "60%", maxHeight: "60px" }}
          >
            <TextField
              label={field.label}
              name={field.name}
              variant="outlined"
              value={userData[field.name]}
              onChange={handleUserChange}
              fullWidth
              type={field.type || "text"}
              disabled={field.name === "User_Id" ? true : !isEditing}
              size="small"
            />
          </Grid>
        ))}
        <Grid
          item
          xs={12}
          sm={6}
          style={{ maxWidth: "400px", width: "100%", maxHeight: "60px" }}
        >
          <FormControl variant="outlined" fullWidth>
            <InputLabel>User Type</InputLabel>
            <Select
              name="User_Type"
              value={userData.User_Type}
              onChange={handleUserChange}
              label="User Type"
              disabled={!isEditing && addOneButtonEnabled}
              size="small"
            >
              <MenuItem value="A">Admin</MenuItem>
              <MenuItem value="U">User</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid
          item
          xs={12}
          sm={6}
          style={{ maxWidth: "400px", width: "100%", maxHeight: "60px" }}
        >
          <FormControl variant="outlined" fullWidth>
            <InputLabel>User Security</InputLabel>
            <Select
              name="User_Security"
              value={userData.User_Security}
              onChange={handleUserChange}
              label="User Security"
              disabled={!isEditing && addOneButtonEnabled}
              size="small"
            >
              <MenuItem value="Y">Yes</MenuItem>
              <MenuItem value="N">No</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} style={{ textAlign: "center" }}>
        
        </Grid>
      </Grid>
      <TableContainer component={Paper} className="mt-4" style={{ marginBottom: "60px" }}>
        <Table sx={{ minWidth: 650 }} aria-label="permissions table">
          <TableHead>
            <TableRow>
              <TableCell sx={headerCellStyle}>ID</TableCell>
              <TableCell sx={headerCellStyle}>Permission Pages</TableCell>
              <TableCell sx={headerCellStyle}>Program Name</TableCell>
              <TableCell sx={headerCellStyle}>View</TableCell>
              <TableCell sx={headerCellStyle}>Save</TableCell>
              <TableCell sx={headerCellStyle}>Edit</TableCell>
              <TableCell sx={headerCellStyle}>Delete</TableCell>
              <TableCell sx={headerCellStyle}>DND</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {permissions.map((permission) => (
              <TableRow key={permission.Detail_Id} style={{
                cursor: "pointer"
              }}

                sx={{
                  '&:hover': {
                    backgroundColor: '#f3f388',
                  },

                }}>
                <TableCell sx={{ padding: '4px 8px' }}>{permission.Detail_Id}</TableCell>
                <TableCell sx={{ padding: '4px 8px' }}>{permission.menuNames}</TableCell>
                <TableCell sx={{ padding: '4px 8px' }}>{permission.Program_Name}</TableCell>
                <TableCell sx={{ padding: '4px 8px' }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={permission.canView === "Y"}
                        onChange={() => handlePermissionChange(permission.Detail_Id, "canView")}
                        disabled={!isEditing && addOneButtonEnabled}
                      />
                    }
                    label=""
                  />
                </TableCell>
                <TableCell sx={{ padding: '4px 8px' }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={permission.canSave === "Y"}
                        onChange={() => handlePermissionChange(permission.Detail_Id, "canSave")}
                        disabled={!isEditing && addOneButtonEnabled}
                      />
                    }
                    label=""
                  />
                </TableCell>
                <TableCell sx={{ padding: '4px 8px' }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={permission.canEdit === "Y"}
                        onChange={() => handlePermissionChange(permission.Detail_Id, "canEdit")}
                        disabled={!isEditing && addOneButtonEnabled}
                      />
                    }
                    label=""
                  />
                </TableCell>
                <TableCell sx={{ padding: '4px 8px' }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={permission.canDelete === "Y"}
                        onChange={() => handlePermissionChange(permission.Detail_Id, "canDelete")}
                        disabled={!isEditing && addOneButtonEnabled}
                      />
                    }
                    label=""
                  />
                </TableCell>
                <TableCell sx={{ padding: '4px 8px' }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={permission.DND === "Y"}
                        onChange={() => handlePermissionChange(permission.Detail_Id, "DND")}
                        disabled={!isEditing && addOneButtonEnabled}
                      />
                    }
                    label=""
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer> */}


      <Grid container spacing={2} direction="row" alignItems="flex-start" justifyContent="space-between">
        <Grid item xs={12} sm={6} style={{ maxWidth: "100%", padding: "10px" }}>
          <Grid container spacing={1} direction="column" alignItems="center" justifyContent="center" mt={2}>
            {[
              { label: "User Id", name: "User_Id", disabled: true },
              { label: "Full Name", name: "userfullname" },
              { label: "User Name", name: "User_Name" },
              { label: "User Password", name: "User_Password", type: "password" },
              { label: "Email Id", name: "EmailId", type: "email" },
              { label: "Email Password", name: "EmailPassword", type: "password" },
              { label: "Mobile No", name: "Mobile" },
              { label: "Payments Password", name: "PaymentsPassword" },
            ].map((field, index) => (
              <Grid item xs={12} sm={6} key={index} style={{ maxWidth: "400px", width: "60%", maxHeight: "60px" }}>
                <TextField
                  label={field.label}
                  name={field.name}
                  variant="outlined"
                  value={userData[field.name]}
                  onChange={handleUserChange}
                  fullWidth
                  type={field.type || "text"}
                  disabled={field.name === "User_Id" ? true : !isEditing}
                  size="small"
                />
              </Grid>
            ))}
            <Grid item xs={12} sm={6} style={{ maxWidth: "400px", width: "100%", maxHeight: "60px" }}>
              <FormControl variant="outlined" fullWidth>
                <InputLabel>User Type</InputLabel>
                <Select
                  name="User_Type"
                  value={userData.User_Type}
                  onChange={handleUserChange}
                  label="User Type"
                  disabled={!isEditing && addOneButtonEnabled}
                  size="small"
                >
                  <MenuItem value="A">Admin</MenuItem>
                  <MenuItem value="U">User</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} style={{ maxWidth: "400px", width: "100%", maxHeight: "60px" }}>
              <FormControl variant="outlined" fullWidth>
                <InputLabel>User Security</InputLabel>
                <Select
                  name="User_Security"
                  value={userData.User_Security}
                  onChange={handleUserChange}
                  label="User Security"
                  disabled={!isEditing && addOneButtonEnabled}
                  size="small"
                >
                  <MenuItem value="Y">Yes</MenuItem>
                  <MenuItem value="N">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Grid>

        {/* Table Section */}
        <Grid item xs={12} sm={6} style={{ padding: "10px" }}>
          <TableContainer component={Paper} className="mt-4" style={{ marginBottom: "60px" }}>
            <Table sx={{ minWidth: 650 }} aria-label="permissions table">
              <TableHead>
                <TableRow>
                  <TableCell sx={headerCellStyle}>ID</TableCell>
                  <TableCell sx={headerCellStyle}>Permission Pages</TableCell>
                  <TableCell sx={headerCellStyle}>Program Name</TableCell>
                  <TableCell sx={headerCellStyle}>View</TableCell>
                  <TableCell sx={headerCellStyle}>Save</TableCell>
                  <TableCell sx={headerCellStyle}>Edit</TableCell>
                  <TableCell sx={headerCellStyle}>Delete</TableCell>
                  <TableCell sx={headerCellStyle}>DND</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {permissions.map((permission) => (
                  <TableRow
                    key={permission.Detail_Id}
                    style={{
                      cursor: "pointer",
                    }}
                    sx={{
                      '&:hover': {
                        backgroundColor: '#f3f388',
                      },
                    }}
                  >
                    <TableCell sx={{ padding: '4px 8px' }}>{permission.Detail_Id}</TableCell>
                    <TableCell sx={{ padding: '4px 8px' }}>{permission.menuNames}</TableCell>
                    <TableCell sx={{ padding: '4px 8px' }}>{permission.Program_Name}</TableCell>
                    <TableCell sx={{ padding: '4px 8px' }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={permission.canView === "Y"}
                            onChange={() => handlePermissionChange(permission.Detail_Id, "canView")}
                            disabled={!isEditing && addOneButtonEnabled}
                          />
                        }
                        label=""
                      />
                    </TableCell>
                    <TableCell sx={{ padding: '4px 8px' }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={permission.canSave === "Y"}
                            onChange={() => handlePermissionChange(permission.Detail_Id, "canSave")}
                            disabled={!isEditing && addOneButtonEnabled}
                          />
                        }
                        label=""
                      />
                    </TableCell>
                    <TableCell sx={{ padding: '4px 8px' }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={permission.canEdit === "Y"}
                            onChange={() => handlePermissionChange(permission.Detail_Id, "canEdit")}
                            disabled={!isEditing && addOneButtonEnabled}
                          />
                        }
                        label=""
                      />
                    </TableCell>
                    <TableCell sx={{ padding: '4px 8px' }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={permission.canDelete === "Y"}
                            onChange={() => handlePermissionChange(permission.Detail_Id, "canDelete")}
                            disabled={!isEditing && addOneButtonEnabled}
                          />
                        }
                        label=""
                      />
                    </TableCell>
                    <TableCell sx={{ padding: '4px 8px' }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={permission.DND === "Y"}
                            onChange={() => handlePermissionChange(permission.Detail_Id, "DND")}
                            disabled={!isEditing && addOneButtonEnabled}
                          />
                        }
                        label=""
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
  );
};

export default UserCreationWithPermission;
