import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { validateDocumentDate } from "../../../Common/ValidateDateRange/ValidateDateRange";
import {
    Box,
    Container,
    Typography,
    TextField,
    Button,
    Paper,
    Grid,
} from "@mui/material";
import Swal from "sweetalert2";
import PageNotFound from "../../../Common/PageNotFound/PageNotFound";
import io from "socket.io-client";

const API_URL = process.env.REACT_APP_API;
const permissionUrl = '/post-date'
const socketURL = process.env.REACT_APP_API_URL;

const PostDateManager = () => {
    const companyCode = sessionStorage.getItem("Company_Code");
    const yearCode = sessionStorage.getItem("Year_Code");
    const accounting_year = sessionStorage.getItem("Accounting_Year");
    const uid = sessionStorage.getItem('uid');
     const [canView, setCanView] = useState(null);

    const [formData, setFormData] = useState({
        Company_Code: companyCode,
        Year_Code: yearCode,
        Post_Date: new Date().toISOString().split("T")[0],
        Inword_Date: new Date().toISOString().split("T")[0],
        Outword_Date: new Date().toISOString().split("T")[0],
        Created_By: "",
        Created_Date: new Date().toISOString().split("T")[0],
    });

    const fetchPostDateRecord = async () => {
        try {
            const response = await axios.get(`${API_URL}/get-PostDate-Record`, {
                params: { Company_Code: companyCode, Year_Code: yearCode },
            });
            if (response.data.PostDate_data) {
                setFormData(response.data.PostDate_data);
            }
        } catch (error) {
            toast.error("Failed to fetch post date data");
        }
        
    };

         useEffect(() => {
                
          checkPermissions();
    }, [permissionUrl]);


   useEffect(() => {
  const socket = io(socketURL, { transports: ["websocket"] });

  console.log("Socket Connected for PostDate");

  const handlePostDateUpdated = async (data) => {
    console.log("PostDate_Updated", data);
     sessionStorage.setItem("Post_Date", data.record.Post_Date);


    // if backend sends { record } or { id } — refetch in both cases
  };

  socket.on("PostDate_Updated", handlePostDateUpdated);

  return () => {
    socket.off("PostDate_Updated", handlePostDateUpdated);
    socket.disconnect();
  };
}, [socketURL]);


    const checkPermissions = async () => {
                    try {
                        const response = await axios.get(
                            `${process.env.REACT_APP_API}/get_user_permissions?Company_Code=${companyCode}&Program_Name=${permissionUrl}&uid=${uid}`
                        );
                        // setPermissionData(response.data?.UserDetails);
                        if (response.data?.UserDetails?.canView === 'Y') {
                            setCanView(true);
                             fetchPostDateRecord()
                        } else {
                            setCanView(false);
                        }
                    } catch (error) {
                        console.error("Error fetching user permissions:", error);
                        setCanView(false);
                    }
                };
        

    

    const handleDateChange = (event, fieldName) => {
        setFormData((prevFormData) => ({
            ...prevFormData,
            [fieldName]: event.target.value,
        }));
    };

    const convertDateToISO = (dateStr) => {
        const date = new Date(dateStr);
        if (!isNaN(date)) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            return `${year}-${month}-${day}`;
        }
        return null;
    };

    if (canView === false) return <PageNotFound />;

    const handleSubmit = async (e) => {
        e.preventDefault();

        // const postDate = new Date(formData.Post_Date);
        // const inwordDate = new Date(formData.Inword_Date);
        // const outwordDate = new Date(formData.Outword_Date);

        // const isValidPostDate = validateDocumentDate(
        //     convertDateToISO(postDate),
        //     accounting_year
        // );
        // const isValidInwordDate = validateDocumentDate(
        //     convertDateToISO(inwordDate),
        //     accounting_year
        // );
        // const isValidOutwardDate = validateDocumentDate(
        //     convertDateToISO(outwordDate),
        //     accounting_year
        // );

        // if (!isValidPostDate) {
        //     return;
        // }
        // if (!isValidInwordDate) {
        //     return;
        // }
        // if (!isValidOutwardDate) {
        //     return;
        // }

        try {
            const response = await axios.post(
                `${API_URL}/create-or-update-PostDate`,
                formData
            );
            Swal.fire({
                icon: 'success',
                title: 'Success',
                text: response.data.message,
            });
            sessionStorage.setItem("Post_Date", response.data.record.Post_Date);
            sessionStorage.setItem("Inword_Date", response.data.record.Inword_Date);
            sessionStorage.setItem("Outword_Date", response.data.record.Outword_Date);
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to save post date data.',
            });
        }
    };

    return (
        <Container maxWidth="sm">
            <ToastContainer autoClose={500} />
            <Paper elevation={3} sx={{ padding: 6, mt: 10 }}>
                <Typography variant="h4" gutterBottom align="center">
                    Post Date
                </Typography>
                <Box component="form" onSubmit={handleSubmit} noValidate mt={5}>
                    <Grid container spacing={3} justifyContent="center">
                        <Grid item xs={12} sx={{ display: "flex", justifyContent: "center" }}>
                            <TextField
                                sx={{ width: "50%" }}
                                label="Post Date"
                                type="date"
                                InputLabelProps={{ shrink: true }}
                                value={formData.Post_Date}
                                onChange={(e) => handleDateChange(e, "Post_Date")}
                            />
                        </Grid>
                        <Grid item xs={12} sx={{ display: "flex", justifyContent: "center" }}>
                            <TextField
                                sx={{ width: "50%" }}
                                label="Inword Date"
                                type="date"
                                InputLabelProps={{ shrink: true }}
                                value={formData.Inword_Date}
                                onChange={(e) => handleDateChange(e, "Inword_Date")}
                            />
                        </Grid>
                        <Grid item xs={12} sx={{ display: "flex", justifyContent: "center" }}>
                            <TextField
                                sx={{ width: "50%" }}
                                label="Outword Date"
                                type="date"
                                InputLabelProps={{ shrink: true }}
                                value={formData.Outword_Date}
                                onChange={(e) => handleDateChange(e, "Outword_Date")}
                            />
                        </Grid>
                        <Grid item xs={12} textAlign="center">
                            <Button
                                variant="contained"
                                color="primary"
                                type="submit"
                                sx={{ width: "200px" }}
                            >
                                Update
                            </Button>
                        </Grid>
                    </Grid>
                </Box>
            </Paper>
        </Container>
    );
};

export default PostDateManager;
