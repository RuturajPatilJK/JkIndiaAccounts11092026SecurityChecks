import React, { useState } from "react";
import axios from "axios";
import { TextField, Button, Typography, Box, Grid, Alert } from "@mui/material";

const API_URL = process.env.REACT_APP_API;

const UserRegistrationForm = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    companyName: "",
    address: "",
    city: "",
    pinCode: "",
    state: "",
    country: "",
    mobileNo: "",
    email: "",
    password: "",
    GST_No: "",
    PAN_No: "",
    FSSAI_No: "",
    tablePrefixName: "",
    isApproved: "N",
    approvedBy: "",
    Remark: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setValidationErrors({ ...validationErrors, [name]: "" }); 
  };

  const handleValidation = () => {
    const requiredFields = [
      "firstName",
      "lastName",
      "companyName",
      "city",
      "pinCode",
      "state",
      "country",
      "mobileNo",
      "email",
    ];

    const errors = {};

    requiredFields.forEach((field) => {
      if (!formData[field].trim()) {
        errors[field] = `${field.replace(/([A-Z])/g, " $1")} is required`;
      }
    });

    if (formData.email && !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.email)) {
      errors.email = "Enter a valid email address";
    }

    if (formData.mobileNo && !/^\d{10}$/.test(formData.mobileNo)) {
      errors.mobileNo = "Enter a valid 10-digit mobile number";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!handleValidation()) return;

    try {
      const response = await axios.post(`${API_URL}/register-user`, formData);
      setMessage(response.data.message);
      setFormData({
        firstName: "",
        lastName: "",
        companyName: "",
        address: "",
        city: "",
        pinCode: "",
        state: "",
        country: "",
        mobileNo: "",
        email: "",
        password: "",
        GST_No: "",
        PAN_No: "",
        FSSAI_No: "",
        tablePrefixName: "",
        isApproved: "N",
        approvedBy: "",
        Remark: "",
      });
      setMessage("");
    } catch (err) {
      setError(err.response?.data?.error || "An error occurred.");
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", mt: 4, p: 3, border: "1px solid #ccc", borderRadius: 2 }}>
      <Typography variant="h4" gutterBottom align="center">
        User Registration
      </Typography>
      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              size="small"
              fullWidth
              required
              error={!!validationErrors.firstName}
              helperText={validationErrors.firstName}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              size="small"
              onChange={handleChange}
              fullWidth
              required
              error={!!validationErrors.lastName}
              helperText={validationErrors.lastName}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Company Name"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              size="small"
              fullWidth
              required
              error={!!validationErrors.companyName}
              helperText={validationErrors.companyName}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Address"
              name="address"
              value={formData.address}
              size="small"
              onChange={handleChange}
              fullWidth
              multiline
              required
              rows={2}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="City"
              name="city"
              value={formData.city}
              size="small"
              onChange={handleChange}
              fullWidth
              required
              error={!!validationErrors.city}
              helperText={validationErrors.city}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Pin Code"
              name="pinCode"
              type="number"
              value={formData.pinCode}
              onChange={handleChange}
              size="small"
              fullWidth
              required
              error={!!validationErrors.pinCode}
              helperText={validationErrors.pinCode}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="State"
              name="state"
              value={formData.state}
              onChange={handleChange}
              size="small"
              fullWidth
              required
              error={!!validationErrors.state}
              helperText={validationErrors.state}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Country"
              name="country"
              value={formData.country}
              onChange={handleChange}
              size="small"
              fullWidth
              required
              error={!!validationErrors.country}
              helperText={validationErrors.country}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Mobile No"
              name="mobileNo"
              size="small"
              value={formData.mobileNo}
              onChange={handleChange}
              fullWidth
              required
              error={!!validationErrors.mobileNo}
              helperText={validationErrors.mobileNo}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Email"
              name="email"
              type="email"
              size="small"
              value={formData.email}
              onChange={handleChange}
              fullWidth
              required
              error={!!validationErrors.email}
              helperText={validationErrors.email}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Password"
              name="password"
              type="password"
               size="small"
              value={formData.password}
              onChange={handleChange}
              fullWidth
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="GST No"
              name="GST_No"
              size="small"
              value={formData.GST_No}
              onChange={handleChange}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="PAN No"
              name="PAN_No"
              value={formData.PAN_No}
              size="small"
              onChange={handleChange}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="FSSAI No"
              name="FSSAI_No"
              value={formData.FSSAI_No}
              onChange={handleChange}
              size="small"
              fullWidth
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Remark"
              name="Remark"
              size="small"
              value={formData.Remark}
              onChange={handleChange}
              fullWidth
            />
          </Grid>
          
          <Grid item xs={12}>
            <Button type="submit" variant="contained" color="primary" fullWidth>
              Register
            </Button>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default UserRegistrationForm;
