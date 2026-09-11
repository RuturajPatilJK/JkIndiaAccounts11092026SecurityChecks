import React, { useState, useEffect, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import ActionButtonGroup from "../../../Common/CommonButtons/ActionButtonGroup";
import NavigationButtons from "../../../Common/CommonButtons/NavigationButtons";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { TextField, Button, Box, Grid, Typography } from "@mui/material";
import { Upload as UploadIcon } from "@mui/icons-material";
import Swal from 'sweetalert2';


const API_URL = process.env.REACT_APP_API;

function CompanyCreation() {
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
  const [signature, setSignature] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [logoURL, setLogoURL] = useState(null);

  const [signatureFile, setSignatureFile] = useState(null);
  const [signatureURL, setSignatureURL] = useState(null);
  const [logoFileName, setLogoFileName] = useState("");
  const [signatureFileName, setSignatureFileName] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const inputRef = useRef(null)

  const navigate = useNavigate();
  const initialFormData = {
    Company_Name_E: "",
    Address_E: "",
    Address_R: "",
    City_E: "",
    Company_Code: "",
    Company_Name_R: "",
    City_R: "",
    State_E: "",
    State_R: "",
    PIN: "",
    Mobile_No: "",
    Created_By: "",
    Modified_By: "",
    Pan_No: "",
    Group_Code: "",
    CST: "",
    TIN: "",
    PHONE: "",
    FSSAI_No: "",
    GST: "",
    Logo: null,
    Signature: null,
    LogoFileName: "",
    SignatureFileName: "",
    bankdetail: "",
    dbbackup: ""
  };
  // Define state variable to hold form data
  const [formData, setFormData] = useState(initialFormData);
  const lastFocusableElementRef = useRef(null);
  const addButtonRef = useRef(null);

  //Records Double CLiked
  const location = useLocation();
  const selectedRecord = location.state?.selectedRecord;
  const permissions = location.state?.permissionsData;

  useEffect(() => {
    fetchLastCompany_Code();
  }, []);

  const fetchLastCompany_Code = () => {
    fetch(`${API_URL}/get_last_company_code`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch last company code");
        }
        return response.json();
      })
      .then((data) => {
        setFormData((prevState) => ({
          ...prevState,
          Company_Code: data.last_company_code + 1,
        }));
      })
      .catch((error) => {
        console.error("Error fetching last company code:", error);
      });
  };

  const handleValidation = () => {
    const requiredFields = [
      "Company_Name_E",
      "Company_Name_R",
      "Address_E",
      "City_E",
      "State_E",
      "PIN",
      "Mobile_No",
      "Pan_No",
      "GST",
    ];

    const newErrors = {};

    requiredFields.forEach((field) => {
      if (!formData[field]?.trim()) {
        const formattedFieldName = field
          .replace(/_/g, " ")
          .replace(/(?:^\w|[A-Z]|\b\w)/g, (char) => char.toUpperCase())
          .replace(/\s+/g, " ");
        newErrors[field] = `${formattedFieldName} is required.`;
      }
    });

    setValidationErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!handleValidation()) return;

    if (!isEditing) {
      addButtonRef.current.focus();
    }
  };

  // Function to handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    if (name === "Address_E" && e.key === "Enter" && value.trim() !== "") {
      const saveButton = document.getElementById("save");
      if (saveButton) {
        saveButton.focus();
      }
    }

    if (validationErrors[name]) {
      setValidationErrors({ ...validationErrors, [name]: "" });
    }
  };

  const handleKeyDown = (e) => {
    // Handle Tab key press
    if (
      e.key === "Tab" &&
      lastFocusableElementRef.current &&
      document.activeElement === lastFocusableElementRef.current
    ) {
      e.preventDefault();
      document.getElementById("Company_Name_E").focus();
    }
  };

  const handleLogoChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoURL(reader.result);
      };
      reader.onerror = () => {
        setLogoURL(null);
        setLogoFileName("");
      };
      reader.readAsDataURL(file);
    } else {
      setLogoFile(null);
      setLogoURL(null);
      setLogoFileName("");
    }
  };

  const handleSignatureChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSignatureFile(file);
      setSignatureFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignatureURL(reader.result);
      };
      reader.onerror = () => {
        setSignatureURL(null);
        setSignatureFileName("");
      };
      reader.readAsDataURL(file);
    } else {
      setSignatureFile(null);
      setSignatureURL(null);
      setSignatureFileName("");
    }
  };
  const handleAddOne = () => {
    // Reset UI controls
    setAddOneButtonEnabled(false);
    setSaveButtonEnabled(true);
    setCancelButtonEnabled(true);
    setEditButtonEnabled(false);
    setDeleteButtonEnabled(false);
    setIsEditing(true);
    fetchLastCompany_Code();

    setLogoURL(null);
    setSignatureURL(null);
    setLogoFileName(null);
    setSignatureFileName(null);
    setFormData({
      ...initialFormData,
      Logo: null,
      Signature: null,
    });
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleSaveOrUpdate = () => {
    if (!handleValidation()) return;

    const formData1 = new FormData();

    Object.keys(formData).forEach((key) => {
      if (
        key !== "Logo" &&
        key !== "Signature" &&
        key !== "LogoFileName" &&
        key !== "SignatureFileName"
      ) {
        formData1.append(key, formData[key]);
      }
    });

    if (logoFile) {
      formData1.append("logo", logoFile);
      formData1.append("LogoFileName", logoFile.name);
    } else if (logoURL) {
      formData1.append("logo", "existing");
      formData1.append("LogoFileName", formData.LogoFileName || logoFileName || "existing");
    } else {
      alert("Please upload a logo file. This is required.");
      return;
    }

    if (signatureFile) {
      formData1.append("signature", signatureFile);
      formData1.append("SignatureFileName", signatureFile.name);
    } else if (signatureURL) {
      formData1.append("signature", "existing");
      formData1.append("SignatureFileName", formData.SignatureFileName || signatureFileName || "existing");
    } else {
      alert("Please upload a signature file. This is required.");
      return;
    }

    const apiUrl = isEditMode
      ? `${API_URL}/update_company?company_code=${formData1.get("Company_Code")}`
      : `${API_URL}/create_company`;
    const method = isEditMode ? "put" : "post";

    axios({
      method: method,
      url: apiUrl,
      data: formData1,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
      .then((response) => {
        const successMessage = isEditMode
          ? "Record updated successfully!"
          : "Record created successfully!";

        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: successMessage,
        });
        setIsEditMode(false);
        setAddOneButtonEnabled(true);
        setEditButtonEnabled(true);
        setDeleteButtonEnabled(true);
        setBackButtonEnabled(true);
        setSaveButtonEnabled(false);
        setCancelButtonEnabled(false);
        setIsEditing(false);
        navigate('/company-list');
      })
      .catch((error) => {
        console.error("Error saving/updating data:", error);
        window.alert(`Error: ${error.response?.data?.message || "Could not save/update data"}`);
      });
  };

  const handleEdit = () => {
    axios
      .get(
        `${API_URL}/get_company_by_code?company_code=${formData.Company_Code}`
      )
      .then((response) => {
        const data = response.data;
        const isLockedNew = data.isLocked;
        const isLockedByUserNew = data.LockedbyUser;

        if (isLockedNew) {
          window.alert(`This record is locked by ${isLockedByUserNew}`);
          return;
        } else {
          axios.put(
            `${API_URL}/lock_unlock_record?company_code=${formData.Company_Code}`,
            {
              isLocked: true,
              LockedbyUser: "Pankaj",
            }
          );
        }
        setFormData({
          ...formData,
          ...data,
        });
        setIsEditMode(true);
        setAddOneButtonEnabled(false);
        setSaveButtonEnabled(true);
        setCancelButtonEnabled(true);
        setEditButtonEnabled(false);
        setDeleteButtonEnabled(false);
        setBackButtonEnabled(true);
        setIsEditing(true);
      })
      .catch((error) => {
        window.alert(
          "This record is already deleted! Showing the previous record."
        );

        const prevCompanyCode = parseInt(formData.Company_Code) - 1;
        axios
          .get(`${API_URL}/get_company_by_code?company_code=${prevCompanyCode}`)
          .then((response) => {
            const data = response.data;
            setFormData({
              ...formData,
              ...data,
            });
            if (data.Logo) {
              setLogoURL(`data:image/jpeg;base64,${data.Logo}`);
            } else {
              setLogoURL(null);
            }

            if (data.Signature) {
              setSignatureURL(`data:image/jpeg;base64,${data.Signature}`);
            } else {
              setSignatureURL(null);
            }
            setIsEditMode(true);
            setAddOneButtonEnabled(false);
            setSaveButtonEnabled(true);
            setCancelButtonEnabled(true);
            setEditButtonEnabled(false);
            setDeleteButtonEnabled(false);
            setBackButtonEnabled(true);
            setIsEditing(true);
          })
          .catch((error) => {
            console.error(
              "Error fetching previous record data after deletion:",
              error
            );
          });
      });
  };

  const handleCancel = () => {
    axios
      .get(`${API_URL}/get_last_company_data`)
      .then((response) => {
        const data = response.data;
        setFormData((prevFormData) => ({
          ...prevFormData,
          ...data,
          Logo: data.Logo ? `data:image/jpeg;base64,${data.Logo}` : null,
          Signature: data.Signature
            ? `data:image/jpeg;base64,${data.Signature}`
            : null,
          isLocked: false,
          LockedbyUser: "",
        }));

        if (data.Logo) {
          setLogoURL(`data:image/jpeg;base64,${data.Logo}`);
          setLogoFileName(data.name);
        } else {
          setLogoURL(null);
        }

        if (data.Signature) {
          setSignatureURL(`data:image/jpeg;base64,${data.Signature}`);
          setSignatureFileName(data.name);
        } else {
          setSignatureURL(null);
        }
        setIsEditing(false);
        setIsEditMode(false);
        setAddOneButtonEnabled(true);
        setEditButtonEnabled(true);
        setDeleteButtonEnabled(true);
        setBackButtonEnabled(true);
        setSaveButtonEnabled(false);
        setCancelButtonEnabled(false);
        setCancelButtonClicked(true);
      })
      .catch((error) => {
        console.error("Error fetching last company data:", error);
        window.alert("Failed to fetch the latest company data.");
      });
  };


  const handleDelete = async () => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `You won't be able to revert this Company Code: ${formData.Company_Code}`,
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
        const deleteApiUrl = `${API_URL}/delete_company?company_code=${formData.Company_Code}`;
        const response = await axios.delete(deleteApiUrl);

        if (response.status === 200) {
          await Swal.fire("Deleted!", "Record deleted successfully.", "success");

          setLogoURL(null);
          setSignatureURL(null);

          const prevRecordResponse = await axios.get(
            `${API_URL}/get_previous_company_data?company_code=${formData.Company_Code}`
          );

          if (prevRecordResponse.status === 200) {
            const prevRecordData = prevRecordResponse.data;
            setFormData(prevRecordData);

            if (prevRecordData.Logo) {
              setLogoURL(`data:image/jpeg;base64,${prevRecordData.Logo}`);
            }
            if (prevRecordData.Signature) {
              setSignatureURL(`data:image/jpeg;base64,${prevRecordData.Signature}`);
            }
          } else {
            console.error("Failed to fetch previous record data after deletion!");
          }

        } else if (response.status === 404) {
          await Swal.fire("Warning", "Record is already deleted!", "warning");
        } else {
          console.error("Company Not Found!", response.status, response.statusText);
        }

      } catch (error) {
        await Swal.fire("Error", "An error occurred while deleting the record.", "error");
        console.error("Error during API call:", error);
      }

    } else {
      await Swal.fire({
        title: "Cancelled",
        text: "Your record is safe 🙂",
        icon: "info",
      });
    }
  };



  const handleBack = () => {
    navigate("/create-utility");
  };

  const handleFirstButtonClick = async () => {
    try {
      const response = await fetch(`${API_URL}/get_first_navigation`);
      if (response.ok) {
        const data = await response.json();
        const firstCompanyData = data;
        setFormData({
          ...formData,
          ...data,
        });
        setLogoURL(
          firstCompanyData.Logo
            ? `data:image/jpeg;base64,${firstCompanyData.Logo}`
            : null
        );
        setSignatureURL(
          firstCompanyData.Signature
            ? `data:image/jpeg;base64,${firstCompanyData.Signature}`
            : null
        );
      } else {
        console.error(
          "Failed to fetch first company data:",
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
        `${API_URL}/get_previous_navigation?current_company_code=${formData.Company_Code}`
      );

      if (response.ok) {
        const data = await response.json();
        const previousCompanyData = data;
        setFormData({
          ...formData,
          ...data,
        });
        setLogoURL(
          previousCompanyData.Logo
            ? `data:image/jpeg;base64,${previousCompanyData.Logo}`
            : null
        );
        setSignatureURL(
          previousCompanyData.Signature
            ? `data:image/jpeg;base64,${previousCompanyData.Signature}`
            : null
        );
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
        `${API_URL}/get_next_navigation?current_company_code=${formData.Company_Code}`
      );

      if (response.ok) {
        const data = await response.json();
        const nextCompanyData = data;
        setFormData({
          ...formData,
          ...data,
        });
        setLogoURL(
          nextCompanyData.Logo
            ? `data:image/jpeg;base64,${nextCompanyData.Logo}`
            : null
        );
        setSignatureURL(
          nextCompanyData.Signature
            ? `data:image/jpeg;base64,${nextCompanyData.Signature}`
            : null
        );
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
      const response = await fetch(`${API_URL}/get_last_navigation`);
      if (response.ok) {
        const data = await response.json();
        const last_Navigation = data;
        setFormData({
          ...formData,
          ...data,
        });
        setLogoURL(
          last_Navigation.Logo
            ? `data:image/jpeg;base64,${last_Navigation.Logo}`
            : null
        );
        setSignatureURL(
          last_Navigation.Signature
            ? `data:image/jpeg;base64,${last_Navigation.Signature}`
            : null
        );
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

  const handlerecordDoubleClicked = () => {
    fetch(
      `${API_URL}/get_company_by_code?company_code=${selectedRecord.Company_Code}`
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch last company data");
        }
        return response.json();
      })
      .then((data) => {
        setFormData({
          ...formData,
          ...data,
        });
        setLogoURL(data.Logo ? `data:image/jpeg;base64,${data.Logo}` : null);
        setSignatureURL(
          data.Signature ? `data:image/jpeg;base64,${data.Signature}` : null
        );
      })
      .catch((error) => {
        console.error("Error fetching last company data:", error);
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
  };

  useEffect(() => {
    if (selectedRecord) {
      handlerecordDoubleClicked();
    } else {
      handleAddOne();
    }
  }, [selectedRecord]);

  //Validation Checks
  const validateNumericInput = (e) => {
    e.target.value = e.target.value.replace(/[^0-9.]/g, "");
  };

  return (
    <div>
      <Typography
        sx={{
          fontSize: "24px",
          fontWeight: "bold",
          color: "black",
          marginBottom: 1,
        }}
      >
        Company Creation
      </Typography>

      <div>
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
          addButtonRef={addButtonRef}
          permissions={permissions}
        />
        <NavigationButtons
          handleFirstButtonClick={handleFirstButtonClick}
          handlePreviousButtonClick={handlePreviousButtonClick}
          handleNextButtonClick={handleNextButtonClick}
          handleLastButtonClick={handleLastButtonClick}
          highlightedButton={highlightedButton}
          isEditing={isEditing}
          isFirstRecord={formData.Company_Code === 4}
        />
      </div>
      <br />
      <div className="container" onKeyDown={handleKeyDown}>
        <div>
          <form onSubmit={handleSubmit}>
            <Box display="flex" flexDirection="column" gap={2} alignItems="center" sx={{ width: '80%', marginTop: 2, margin: '2rem auto' }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={2}>
                  <TextField
                    label="Company Code"
                    variant="outlined"
                    name="Company_Code"
                    size="small"
                    value={formData.Company_Code}
                    onChange={handleInputChange}
                    fullWidth
                    disabled
                  />
                </Grid>

                <Grid item xs={12} sm={10}>
                  <TextField
                    label="Company Name"
                    variant="outlined"
                    name="Company_Name_E"
                    value={formData.Company_Name_E}
                    onChange={handleInputChange}
                    inputRef={inputRef}
                    size="small"
                    fullWidth
                    required
                    error={!!validationErrors.Company_Name_E}
                    helperText={validationErrors.Company_Name_E || ""}
                    sx={{
                      '& .MuiInputBase-root': {
                        fontSize: '18px',
                      },
                    }}
                    disabled={!isEditing && addOneButtonEnabled}
                  />
                </Grid>
              </Grid>
              <TextField
                label="Regional Name"
                variant="outlined"
                name="Company_Name_R"
                value={formData.Company_Name_R}
                error={!!validationErrors.Company_Name_R}
                helperText={validationErrors.Company_Name_R || ""}
                onChange={handleInputChange}
                size="small"
                fullWidth
                required
                sx={{
                  '& .MuiInputBase-root': {
                    fontSize: '18px',
                  },
                }}
                disabled={!isEditing && addOneButtonEnabled}
              />
              <TextField
                label="Company Address"
                variant="outlined"
                name="Address_E"
                value={formData.Address_E}
                onChange={handleInputChange}
                fullWidth
                size="small"
                required
                error={!!validationErrors.Address_E}
                helperText={validationErrors.Address_E || ""}
                multiline
                sx={{
                  '& .MuiInputBase-root': {
                    fontSize: '18px',
                  },
                }}
                rows={2}
                disabled={!isEditing && addOneButtonEnabled}
              />
              <TextField
                label="Regional Address"
                variant="outlined"
                name="Address_R"
                value={formData.Address_R}
                onChange={handleInputChange}
                fullWidth
                size="small"
                multiline
                rows={2}
                sx={{
                  '& .MuiInputBase-root': {
                    fontSize: '18px',
                  },
                }}
                disabled={!isEditing && addOneButtonEnabled}
              />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="City"
                    variant="outlined"
                    name="City_E"
                    value={formData.City_E}
                    error={!!validationErrors.City_E}
                    helperText={validationErrors.City_E || ""}
                    onChange={handleInputChange}
                    fullWidth
                    size="small"
                    required
                    sx={{
                      '& .MuiInputBase-root': {
                        fontSize: '18px',
                      },
                    }}
                    disabled={!isEditing && addOneButtonEnabled}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="State"
                    variant="outlined"
                    name="State_E"
                    value={formData.State_E}
                    error={!!validationErrors.State_E}
                    helperText={validationErrors.State_E || ""}
                    onChange={handleInputChange}
                    fullWidth
                    size="small"
                    required
                    sx={{
                      '& .MuiInputBase-root': {
                        fontSize: '18px',
                      },
                    }}
                    disabled={!isEditing && addOneButtonEnabled}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Pin"
                    variant="outlined"
                    name="PIN"
                    value={formData.PIN}
                    error={!!validationErrors.PIN}
                    helperText={validationErrors.PIN || ""}
                    onChange={handleInputChange}
                    fullWidth
                    size="small"
                    required
                    sx={{
                      '& .MuiInputBase-root': {
                        fontSize: '18px',
                      },
                    }}
                    disabled={!isEditing && addOneButtonEnabled}
                  />
                </Grid>
              </Grid>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="City (R)"
                    variant="outlined"
                    name="City_R"
                    value={formData.City_R}
                    size="small"
                    onChange={handleInputChange}
                    fullWidth
                    sx={{
                      '& .MuiInputBase-root': {
                        fontSize: '18px',
                      },
                    }}
                    disabled={!isEditing && addOneButtonEnabled}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="State (R)"
                    variant="outlined"
                    name="State_R"
                    size="small"
                    value={formData.State_R}
                    onChange={handleInputChange}
                    fullWidth
                    sx={{
                      '& .MuiInputBase-root': {
                        fontSize: '18px',
                      },
                    }}
                    disabled={!isEditing && addOneButtonEnabled}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="GST"
                    variant="outlined"
                    name="GST"
                    size="small"
                    value={formData.GST}
                    onChange={handleInputChange}
                    error={!!validationErrors.GST}
                    helperText={validationErrors.GST || ""}
                    fullWidth
                    required
                    sx={{
                      '& .MuiInputBase-root': {
                        fontSize: '18px',
                      },
                    }}
                    disabled={!isEditing && addOneButtonEnabled}
                  />
                </Grid>
              </Grid>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Mobile"
                    variant="outlined"
                    name="Mobile_No"
                    value={formData.Mobile_No}
                    size="small"
                    onChange={handleInputChange}
                    fullWidth
                    required
                    error={!!validationErrors.Mobile_No}
                    helperText={validationErrors.Mobile_No || ""}
                    sx={{
                      '& .MuiInputBase-root': {
                        fontSize: '18px',
                      },
                    }}
                    disabled={!isEditing && addOneButtonEnabled}
                    inputProps={{
                      inputMode: "decimal",
                      pattern: "[0-9]*[.,]?[0-9]+",
                      maxLength: 10,
                      onInput: validateNumericInput,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="TIN"
                    variant="outlined"
                    name="TIN"
                    value={formData.TIN}
                    size="small"
                    onChange={handleInputChange}
                    fullWidth
                    sx={{
                      '& .MuiInputBase-root': {
                        fontSize: '18px',
                      },
                    }}
                    disabled={!isEditing && addOneButtonEnabled}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Phone"
                    variant="outlined"
                    name="PHONE"
                    value={formData.PHONE}
                    size="small"
                    onChange={handleInputChange}
                    fullWidth
                    sx={{
                      '& .MuiInputBase-root': {
                        fontSize: '18px',
                      },
                    }}
                    disabled={!isEditing && addOneButtonEnabled}
                    inputProps={{
                      inputMode: "decimal",
                      pattern: "[0-9]*[.,]?[0-9]+",
                      maxLength: 10,
                      onInput: validateNumericInput,
                    }}
                  />
                </Grid>
              </Grid>
              <Grid container spacing={2}>

                <Grid item xs={12} sm={4}>
                  <TextField
                    label="PAN No"
                    variant="outlined"
                    name="Pan_No"
                    value={formData.Pan_No}
                    size="small"
                    onChange={handleInputChange}
                    error={!!validationErrors.Pan_No}
                    helperText={validationErrors.Pan_No || ""}
                    sx={{
                      '& .MuiInputBase-root': {
                        fontSize: '18px',
                      },
                    }}
                    fullWidth
                    required
                    disabled={!isEditing && addOneButtonEnabled}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="FSSAI No"
                    variant="outlined"
                    name="FSSAI_No"
                    size="small"
                    sx={{
                      '& .MuiInputBase-root': {
                        fontSize: '18px',
                      },
                    }}
                    value={formData.FSSAI_No}
                    onChange={handleInputChange}
                    fullWidth
                    disabled={!isEditing && addOneButtonEnabled}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="BackUp Folder"
                    variant="outlined"
                    name="dbbackup"
                    value={formData.dbbackup}
                    onChange={handleInputChange}
                    size="small"
                    sx={{
                      '& .MuiInputBase-root': {
                        fontSize: '18px',
                      },
                    }}
                    fullWidth
                    disabled={!isEditing && addOneButtonEnabled}
                  />
                </Grid>
              </Grid>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={12}>
                  <TextField
                    label="Bank Details"
                    variant="outlined"
                    name="bankdetail"
                    value={formData.bankdetail}
                    size="small"
                    sx={{
                      '& .MuiInputBase-root': {
                        fontSize: '18px',
                      },
                    }}
                    onChange={handleInputChange}
                    fullWidth
                    disabled={!isEditing && addOneButtonEnabled}
                  />
                </Grid>

              </Grid>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Button
                    variant="outlined"
                    component="label"
                    fullWidth
                    disabled={!isEditing && addOneButtonEnabled}
                    startIcon={<UploadIcon />}
                  >
                    Upload Logo
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleLogoChange}
                      disabled={!isEditing && addOneButtonEnabled}
                    />
                  </Button>
                </Grid>

                <Grid item xs={12} sm={6}>
                  {logoURL && (
                    <img src={logoURL} alt="Logo Preview" width="100" />
                  )}

                  <Typography
                    sx={{
                      fontSize: "15px",
                      fontWeight: "bold",
                      color: "#1976d2",
                      marginBottom: 2,
                    }}
                  >
                    {formData.LogoFileName || logoFileName}
                  </Typography>
                </Grid>
              </Grid>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Button
                    variant="outlined"
                    component="label"
                    fullWidth
                    disabled={!isEditing && addOneButtonEnabled}
                    startIcon={<UploadIcon />}
                  >
                    Upload Signature
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleSignatureChange}
                      disabled={!isEditing && addOneButtonEnabled}
                    />
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  {signatureURL && (
                    <img
                      src={signatureURL}
                      alt="Signature Preview"
                      width="100"
                    />
                  )}
                  <Typography
                    sx={{
                      fontSize: "15px",
                      fontWeight: "bold",
                      color: "#1976d2",
                      marginBottom: 2,
                    }}
                  >
                    {formData.SignatureFileName || signatureFileName}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CompanyCreation;
