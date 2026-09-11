import React, { useState, useRef } from "react";
import UserAuditInfo from "../../../Common/UserAuditInfo/UserAuditInfo";
import GSTStateMasterHelp from "../../../Helper/GSTStateMasterHelp";
import MultipleStateSelectionHelp from "../../../Helper/MultipleStateSelectionHelp";
import CityBroadCastHelp from "../../../Helper/GetCityByStateHelp";
import AccountMasterHelp from "../../../Helper/AccountMasterHelp";
import SaveUpdateSpinner from "../../../Common/Spinners/SaveUpdateSpinner";
import Swal from "sweetalert2";
import {
    Box,
    TextField,
    InputLabel,
    FormControl,
    Checkbox,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Grid,
    TablePagination,
    Typography,
} from "@mui/material";
import "./Broadcast.css";
import BackButton from "../../../Common/Buttons/BackButton";
import { useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API;
const WHATSAPPID = process.env.REACT_APP_WHATSAPPID;
const WHATSAPPTOKEN = process.env.REACT_APP_WHATSAPPTOKEN;

var cityName;
var newCity_Code;
var newGSTStateCode;
var gstStateName;
var newMill_Code;

const headerCellStyle = {
    fontWeight: "bold",
    backgroundColor: "#3f51b5",
    color: "white",
    padding: "4px",
    textAlign: "center",
};

const BroadCast = () => {
    const companyCode = sessionStorage.getItem("Company_Code");

    const [PurchaseAccount, setPurchaseAccount] = useState("");
    const [CityCode, setCityCode] = useState("");
    const [MillCode, setMillCode] = useState("");
    const [pincode, setPinCode] = useState("");
    const [CityName, setCityName] = useState("");
    const [StateCodes, setStateCodes] = useState([]);
    const [selectedStates, setSelectedStates] = useState([]);
    const [StateName, setStateName] = useState("");
    const [StateCode, setStateCode] = useState("");
    const [StateNames, setStateNames] = useState([]);
    const [StateDisplayName, setStateDisplayName] = useState("");
    const [showCityPopup, setShowCityPopup] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [addOneButtonEnabled, setAddOneButtonEnabled] = useState(false);
    const [tableData, setTableData] = useState([]);
    const [selectedRows, setSelectedRows] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [UniqueCityName, setUniqueCityName] = useState([]);
    const rowsPerPage = 100;

    const sendButtonRef = useRef(null);
    const getButtonRef = useRef(null);

    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        Mill: "",
        Grade: "",
        Season: "",
        Rate: "",
        Message: "",
    });


    const handleCity_Code = (cityArray) => {
        if (Array.isArray(cityArray)) {
            const uniqueCitiesMap = new Map();
            cityArray.forEach(city => uniqueCitiesMap.set(city.city_code, city));
            const uniqueCities = Array.from(uniqueCitiesMap.values());

            const cityCodes = uniqueCities.map(c => c.city_code).join(",");
            const cityNames = uniqueCities.map(c => c.city_name_e).join(",");

            setCityCode(cityCodes);
            setCityName(cityNames);
            setPinCode(uniqueCities[0]?.pincode);

            const uniqueCityNames = uniqueCities.map(c => c.city_name_e);
            setUniqueCityName(uniqueCityNames); // ✅ Save for param use
        }
    };


    const handleGSTStateCode = (selectedStatesArray) => {
        if (Array.isArray(selectedStatesArray)) {
            setSelectedStates(selectedStatesArray);

            const codes = selectedStatesArray.map(s => s.state_code);
            const names = selectedStatesArray.map(s => s.state_name);

            setStateCodes(codes);
            setStateNames(names);

            const display = names.length <= 4
                ? names.join(", ")
                : names.slice(0, 4).join(", ") + "...";

            setStateDisplayName(display);
        }
    };


    const handlePurchaseAccount = (code) => {
        setPurchaseAccount(code);
        setMillCode(code);
    };

    const handleSendButtonClick = async () => {
        const { Message } = formData;

        if (!Message?.trim()) {
            Swal.fire("Missing Message", "Please enter a message before sending.", "warning");
            return;
        }

        if (selectedRows.length === 0) {
            Swal.fire("No Contacts Selected", "Please select at least one recipient.", "warning");
            return;
        }

        setIsLoading(true);
        try {
            const requests = selectedRows.map((selected) => {
                const mobile = selected.whatsup_no?.startsWith("91")
                    ? selected.whatsup_no
                    : `91${selected.whatsup_no}`;

                const params = new URLSearchParams({
                    number: mobile,
                    type: "text",
                    message: formData.Message,
                    instance_id: "68679A6D6947C",
                    access_token: "686799f95e57f",
                });

                return fetch(`https://cloud.wawatext.com/api/send?${params.toString()}`, {
                    mode: "no-cors",
                }).then(() => {
                    return { number: mobile, status: "sent (assumed - no-cors)" };
                }).catch((error) => {
                    return { number: mobile, status: "failed", error };
                });
            });

            const results = await Promise.all(requests);
            const failed = results.filter((res) => res.status === "failed");

            if (failed.length === 0) {
                Swal.fire("Success!", "All messages sent successfully!", "success");
            } else {
                Swal.fire("Partial Failure", `${failed.length} message(s) failed to send.`, "error");
            }
        } catch (err) {
            console.error("Unexpected error:", err);
            Swal.fire("Error", "Unexpected error occurred while sending messages.", "error");
        } finally {
            setIsLoading(false);
            setSelectedRows([]);
        }
    };


    // const handlGetButtonClick = () => {
    //     const stateCodesArray = selectedStates.map(s => s.State_Code).filter(Boolean);
    //     const stateNamesArray = selectedStates.map(s => s.State_Name).filter(Boolean);

    //     const cityNamesArray = UniqueCityName || [];
    //     const cityCodesArray = CityCode ? CityCode.split(",").map(code => code.trim()).filter(Boolean) : [];
    //     const millcode = newMill_Code || MillCode;

    //     let fetchUrl = "";
    //     let dataKey = "";
    //     let url;

    //     setIsLoading(true);

    //     const skipCity = cityCodesArray.length > 100;


    //     if (millcode && stateCodesArray.length) {
    //         url = new URL(`${API_URL}/getMillmaster`);
    //         url.searchParams.append("mill_code", millcode);
    //         stateCodesArray.forEach(code => url.searchParams.append("State_Code", code));

    //         if (!skipCity && cityCodesArray.length) {
    //             cityCodesArray.forEach(code => url.searchParams.append("city_code", code));
    //         }

    //         fetchUrl = url.toString();
    //         dataKey = "all_Milldata";


    //     } else if (stateNamesArray.length && cityNamesArray.length) {
    //         url = new URL(`${API_URL}/getcityandstatecode`);
    //         stateNamesArray.forEach(name => url.searchParams.append("State_Name", name));
    //         cityNamesArray.forEach(name => url.searchParams.append("City_Name", name));
    //         fetchUrl = url.toString();
    //         dataKey = "both_data";

    //     }
    // //     else if (skipCity && stateCodesArray.length && cityCodesArray.length) {
    // //     // ✅ GET /getbyCityCodeandStateCode (for many cities + state filters)
    // //     url = new URL(`${API_URL}/getbyCityCodeandStateCode`);
    // //     cityCodesArray.forEach(code => url.searchParams.append("city_code", code));
    // //     stateCodesArray.forEach(code => url.searchParams.append("state_code", code));

    // //     fetchUrl = url.toString();
    // //     dataKey = "filtered_data";

    // // } 

    //     else if (stateNamesArray.length) {
    //         url = new URL(`${API_URL}/getbyStateCode`);
    //         stateNamesArray.forEach(name => url.searchParams.append("State_Name", name));
    //         fetchUrl = url.toString();
    //         dataKey = "all_data";


    //     }


    //     else if (!skipCity && cityNamesArray.length) {
    //         url = new URL(`${API_URL}/getbyCityCode`);
    //         cityNamesArray.forEach(name => url.searchParams.append("City_Name", name));
    //         fetchUrl = url.toString();
    //         fetch(fetchUrl)
    //         console.log("GET URL Length:", fetchUrl.length)
    //         dataKey = "all_citydata";

    //     } else if (millcode) {
    //         url = new URL(`${API_URL}/getMillmaster`);
    //         url.searchParams.append("mill_code", millcode);
    //         fetchUrl = url.toString();
    //         dataKey = "all_Milldata";

    //     } else {
    //         Swal.fire("Missing Filters", "Please select at least one filter before fetching.", "warning");
    //         setIsLoading(false);
    //         return;
    //     }

    //     // Fetch data
    //     fetch(fetchUrl)
    //         .then((response) => {
    //             if (!response.ok) throw new Error("Failed to fetch data");
    //             return response.json();
    //         })
    //         .then((data) => {
    //             if (data[dataKey]) {
    //                 setTableData(data[dataKey]);
    //             } else {
    //                 Swal.fire("Error", "Unexpected response structure.", "error");
    //             }
    //         })
    //         .catch((error) => {
    //             console.error("Error fetching data:", error);
    //             Swal.fire("Error", "Failed to fetch data.", "error");
    //         })
    //         .finally(() => setIsLoading(false));
    // };

    // const handlGetButtonClick = () => {
    //     const stateCodesArray = selectedStates.map(s => s.State_Code).filter(Boolean);
    //     const stateNamesArray = selectedStates.map(s => s.State_Name).filter(Boolean);

    //     const cityNamesArray = UniqueCityName || [];
    //     const cityCodesArray = CityCode ? CityCode.split(",").map(code => code.trim()).filter(Boolean) : [];
    //     const millcode = newMill_Code || MillCode;

    //     let fetchUrl = "";
    //     let dataKey = "";
    //     let url;

    //     setIsLoading(true);

    //     const skipCity = cityNamesArray.length > 3000;
    //     const skipcityCode = cityCodesArray.length > 3000
    //     console.log(cityNamesArray.length)


    //     if (skipCity) {
    //         Swal.fire("City Limit Exceeded", "You have selected more than 3000 cities. Showing data for selected states only.", "info");
    //     }

    //     if (millcode && stateCodesArray.length) {
    //         url = new URL(`${API_URL}/getMillmaster`);
    //         url.searchParams.append("mill_code", millcode);
    //         stateCodesArray.forEach(code => url.searchParams.append("State_Code", code));

    //         if (!skipCity && cityCodesArray.length) {
    //             cityCodesArray.forEach(code => url.searchParams.append("city_code", code));
    //         }

    //         fetchUrl = url.toString();
    //         dataKey = "all_Milldata";

    //     } 
    // //     else if (stateCodesArray.length && cityCodesArray.length && skipcityCode) {
    // //     Swal.fire("Using Code Fallback", "Too many cities selected. Fetching data using city/state codes.", "info");

    // //     url = new URL(`${API_URL}/bystatecodeandcitycode`);
    // //     cityCodesArray.forEach(code => url.searchParams.append("city_code", code));
    // //     stateCodesArray.forEach(code => url.searchParams.append("state_code", code));
    // //     fetchUrl = url.toString();
    // //     dataKey = "data_by_state_and_citycode";

    // // }
    // // else if (cityCodesArray.length && skipCity) {
    // //     Swal.fire("Using City Code Fallback", "Too many cities selected. Fetching data using city codes.", "info");

    // //     url = new URL(`${API_URL}/bycitycodeonly`);
    // //     cityCodesArray.forEach(code => url.searchParams.append("city_code", code));
    // //     fetchUrl = url.toString();
    // //     dataKey = "data_by_citycode";

    // // }
    //     else if (millcode && cityCodesArray.length) {
    //         if (cityNamesArray.length > 3000) {
    //         Swal.fire(
    //             "Too Many Cities Selected",
    //             "You have selected more than 3000 cities. Please reduce your selection.",
    //             "warning"
    //         );
    //         setIsLoading(false);
    //         return;
    //     }
    //         url = new URL(`${API_URL}/getMillmaster`);
    //         url.searchParams.append("mill_code", millcode);
    //         cityCodesArray.forEach(code => url.searchParams.append("city_code", code));
    //         fetchUrl = url.toString();
    //         dataKey = "all_Milldata";
    //     }
    //     else if (stateNamesArray.length && cityNamesArray.length && !skipCity) {
    //         url = new URL(`${API_URL}/getcityandstatecode`);
    //         stateNamesArray.forEach(name => url.searchParams.append("State_Name", name));
    //         cityNamesArray.forEach(name => url.searchParams.append("City_Name", name));
    //         fetchUrl = url.toString();
    //         dataKey = "both_data";

    //     } else if (stateNamesArray.length) {
    //         url = new URL(`${API_URL}/getbyStateCode`);
    //         stateNamesArray.forEach(name => url.searchParams.append("State_Name", name));
    //         fetchUrl = url.toString();
    //         dataKey = "all_data";

    //     }else if (cityNamesArray.length) {
    //     if (cityNamesArray.length > 3000) {
    //         Swal.fire(
    //             "Too Many Cities Selected",
    //             "You have selected more than 3000 cities. Please reduce your selection.",
    //             "warning"
    //         );
    //         setIsLoading(false);
    //         return;
    //     }

    //     url = new URL(`${API_URL}/getbyCityCode`);
    //     cityNamesArray.forEach(name => url.searchParams.append("City_Name", name));
    //     fetchUrl = url.toString();
    //     dataKey = "all_citydata";
    // }
    //  else if (millcode) {
    //         url = new URL(`${API_URL}/getMillmaster`);
    //         url.searchParams.append("mill_code", millcode);
    //         fetchUrl = url.toString();
    //         dataKey = "all_Milldata";

    //     } else {
    //         Swal.fire("Missing Filters", "Please select at least one filter before fetching.", "warning");
    //         setIsLoading(false);
    //         return;
    //     }

    //     // ✅ Fetch data
    //     fetch(fetchUrl)
    //         .then((response) => {
    //             if (!response.ok) throw new Error("Failed to fetch data");
    //             return response.json();
    //         })
    //         .then((data) => {
    //     if (data[dataKey]) {
    //         const result = data[dataKey];
    //         if (Array.isArray(result) && result.length === 0) {
    //             Swal.fire("No Records", "No matching records were found.", "info");
    //         }
    //         setTableData(result);
    //     } else {
    //         Swal.fire("Error", "Unexpected response structure.", "error");
    //     }
    // })

    //         .catch((error) => {
    //             console.error("Error fetching data:", error);
    //             Swal.fire("Error", "Failed to fetch data.", "error");
    //         })
    //         .finally(() => setIsLoading(false));
    // };


    const handlGetButtonClick = async () => {
    const stateCodesArray = selectedStates.map(s => s.State_Code).filter(Boolean);
    const stateNamesArray = selectedStates.map(s => s.State_Name).filter(Boolean);
    const cityNamesArray = UniqueCityName || [];
    const cityCodesArray = CityCode ? CityCode.split(",").map(code => code.trim()).filter(Boolean) : [];
    const millcode = newMill_Code || MillCode;

    setIsLoading(true);

    const postData = async (endpoint, body, dataKey) => {
        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const data = await response.json();
            const result = data?.[dataKey];

            if (!Array.isArray(result) || result.length === 0) {
                Swal.fire("No Records", "No matching records were found.", "info");
                setTableData([]);
            } else {
                setTableData(result);
            }
        } catch (error) {
            console.error("POST Fetch Error:", error);
            Swal.fire("Error", "Failed to fetch data.", "error");
            setTableData([]);
        } finally {
            setIsLoading(false);
        }
    };

    // 🔹 Mill + State + City
    if (millcode && stateCodesArray.length > 0 && cityCodesArray.length > 0) {
        await postData("/getMillmaster", {
            mill_code: millcode,
            State_Code: stateCodesArray,
            city_code: cityCodesArray,
        }, "all_Milldata");
        return;
    }

    // 🔹 Mill + City Code
    if (millcode && cityCodesArray.length > 0) {
        await postData("/getMillmaster", {
            mill_code: millcode,
            city_code: cityCodesArray,
        }, "all_Milldata");
        return;
    }

    // 🔹 Mill + State Code
    if (millcode && stateCodesArray.length > 0) {
        await postData("/getMillmaster", {
            mill_code: millcode,
            State_Code: stateCodesArray,
        }, "all_Milldata");
        return;
    }

    // 🔹 Only Mill Code
    if (millcode) {
        await postData("/getMillmaster", {
            mill_code: millcode,
        }, "all_Milldata");
        return;
    }

    // 🔹 State + City Name
    if (stateNamesArray.length > 0 && cityNamesArray.length > 0) {
        await postData("/getcityandstatecode", {
            State_Name: stateNamesArray,
            City_Name: cityNamesArray,
        }, "both_data");
        return;
    }

    // 🔹 Only City Name
    if (cityNamesArray.length > 0) {
        await postData("/getbyCityCode", {
            City_Name: cityNamesArray,
        }, "all_citydata");
        return;
    }

    // 🔹 Only State Name
    if (stateNamesArray.length > 0) {
        await postData("/getbyStateCode", {
            State_Name: stateNamesArray,
        }, "all_data");
        return;
    }

    // 🔹 No filters
    Swal.fire("Missing Filters", "Please select at least one filter before fetching.", "warning");
    setIsLoading(false);
};


    const handleCheckboxChange = (index) => {
        const globalIndex = page * rowsPerPage + index;
        const selectedItem = filteredData[globalIndex];

        if (!selectedItem?.whatsup_no) {
            Swal.fire("Missing WhatsApp", "This contact does not have a valid WhatsApp number.", "warning");
            return;
        }

        setSelectedRows((prev) => {
            const alreadySelected = prev.includes(selectedItem);
            return alreadySelected
                ? prev.filter(row => row !== selectedItem)
                : [...prev, selectedItem];
        });
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const filteredData = tableData.filter((item) => {
        const search = searchQuery.toLowerCase();
        return (
            item.Ac_Code?.toString().toLowerCase().includes(search) ||
            item.Ac_Name_E?.toLowerCase().includes(search) ||
            item.whatsup_no?.toString().toLowerCase().includes(search)
        );
    });

    const handleBackClick = () => {
        navigate("/dashboard");
    };

    return (
        <>
            <div style={{ marginTop: '-80px' }}>
                <BackButton onClick={handleBackClick} />
                <div >

                    <Typography component="h1"
                        gutterBottom
                        sx={{
                            textAlign: 'center',
                            fontSize: '1.2rem',
                            fontWeight: 'bold',
                            color: '#2c3e50',
                            padding: '12px 0',
                            position: 'relative',
                            marginTop: "-20px",
                            '&::after': {
                                content: '""',
                                position: 'absolute',
                                bottom: '0',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: '80px',
                                height: '4px',
                                background: 'linear-gradient(90deg, #3498db, #2ecc71)',
                                borderRadius: '2px',
                                animation: 'underlineGrow 0.5s ease-out forwards'
                            },
                            '@keyframes underlineGrow': {
                                '0%': { width: '0' },
                                '100%': { width: '80px' }
                            }
                        }}>BroadCast Messages</Typography>
                    <Box className="broadcast-container">
                        <Grid container spacing={2}>
                            <div className="TenderPurchaseHelp-row" style={{ marginTop: "10px" }}>
                                <div className="SugarTenderPurchase-col">
                                    <label className="SugarTenderPurchase-form-label">Select State:</label>
                                    <MultipleStateSelectionHelp
                                        name="StateCode"
                                        GstStateName={StateName}
                                        GstStateCode={StateCode}
                                        onAcCodeClick={(selectedArray) => {
                                            if (Array.isArray(selectedArray)) {
                                                setSelectedStates(selectedArray);

                                                const stateCodes = selectedArray.map(s => s.State_Code);
                                                const stateNames = selectedArray.map(s => s.State_Name);

                                                setStateCodes(stateCodes);
                                                setStateNames(stateNames);


                                                const labelLimit = 5;
                                                const label = stateNames.length > labelLimit
                                                    ? `${stateNames.slice(0, labelLimit).join(", ")}, ...`
                                                    : stateNames.join(", ");
                                                setStateDisplayName(label);

                                                setStateCode(stateCodes.join(","));
                                                setStateName(label);
                                            } else {
                                                setSelectedStates([]);
                                                setStateCodes([]);
                                                setStateNames([]);
                                                setStateDisplayName("");
                                                setStateCode("");
                                                setStateName("");
                                            }
                                        }}
                                    />

                                </div>


                                <div className="SugarTenderPurchase-col">
                                    <label className="SugarTenderPurchase-form-label">Select City:</label>
                                    <CityBroadCastHelp
                                        name="City_Code"
                                        onAcCodeClick={handleCity_Code}
                                        State_Code={selectedStates}
                                        CityName={CityName}
                                        CityCode={CityCode}
                                        tabIndexHelp={8}
                                        disabledFeild={!isEditing && addOneButtonEnabled}
                                    />

                                </div>

                                <div className="SugarTenderPurchase-col">
                                    <label className="SugarTenderPurchase-form-label" style={{ whiteSpace: 'nowrap' }}>Select Mill:</label>
                                    <AccountMasterHelp
                                        onAcCodeClick={handlePurchaseAccount}
                                        name="Mill Master"
                                        Ac_type={['M']}
                                        disabledFeild={!isEditing && addOneButtonEnabled}
                                    />
                                </div>

                                <Grid item xs={12} sm={6}>
                                    <div className="button-group">
                                        <button
                                            ref={getButtonRef}
                                            onClick={handlGetButtonClick}
                                            disabled={
                                                isLoading ||
                                                (
                                                    StateCodes.length === 0 &&
                                                    (!CityCode || CityCode.trim() === "") &&
                                                    (!MillCode || MillCode.trim() === "")
                                                )
                                            }
                                        >
                                            GET
                                        </button>
                                        <button
                                            ref={sendButtonRef}
                                            onClick={handleSendButtonClick}
                                            disabled={selectedRows.length === 0}
                                        >
                                            Send
                                        </button>
                                    </div>
                                </Grid>

                                <Grid item xs={12}>
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            marginTop: '20px',
                                            fontWeight: 'bold',
                                            fontSize: '1.25rem',
                                            color: '#333',
                                            background: 'linear-gradient(45deg, #6a11cb 0%, #2575fc 100%)',
                                            WebkitBackgroundClip: 'text',
                                            display: 'inline',
                                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                                            padding: '8px 16px',
                                            borderRadius: '5px',
                                            backgroundColor: 'white',
                                            textAlign: 'center',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        Total Count: {selectedRows.length}
                                    </Typography>
                                </Grid>

                            </div>
                        </Grid>

                        <Grid item xs={12} sm={6} mt={2} className="message-box">
                            <TextField
                                label="Message"
                                name="Message"
                                variant="outlined"
                                autoComplete="off"
                                fullWidth
                                multiline
                                rows={4}
                                value={formData.Message}
                                onChange={(e) => setFormData({ ...formData, Message: e.target.value })}
                                disabled={!isEditing && addOneButtonEnabled}
                                size="small"
                            />
                        </Grid>

                        <Grid item xs={12} mt={1}>
                            <Box display="flex" justifyContent="flex-end">
                                <TextField
                                    label="Search..."
                                    variant="outlined"
                                    size="small"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search..."
                                    sx={{ width: 300 }}
                                />
                            </Box>
                        </Grid>

                        {isLoading && (
                            <div className="loading-overlay">
                                <div className="spinner-container">
                                    <SaveUpdateSpinner />
                                </div>
                            </div>
                        )}

                        <Grid container spacing={3} mt={1}>
                            <Grid item xs={12}>
                                <TableContainer component={Paper} className="table-container" style={{ width: '80%', marginTop: '-65px' }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell padding="checkbox" sx={headerCellStyle}>
                                                    <Checkbox
                                                        checked={
                                                            filteredData.every(row => selectedRows.includes(row)) &&
                                                            filteredData.length > 0
                                                        }
                                                        indeterminate={
                                                            selectedRows.length > 0 &&
                                                            filteredData.some(row => selectedRows.includes(row)) &&
                                                            !filteredData.every(row => selectedRows.includes(row))
                                                        }
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedRows(filteredData);
                                                            } else {
                                                                setSelectedRows([]);
                                                            }
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell sx={headerCellStyle}>Account Name</TableCell>
                                                <TableCell sx={headerCellStyle}>Mobile Number</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {filteredData
                                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                                .map((item, index) => (
                                                    <TableRow key={`row-${page * rowsPerPage + index}`}>
                                                        <TableCell padding="checkbox">
                                                            <Checkbox
                                                                checked={selectedRows.includes(filteredData[page * rowsPerPage + index])}
                                                                onChange={() => handleCheckboxChange(index)}
                                                            />
                                                        </TableCell>
                                                        <TableCell>{item.Ac_Name_E}</TableCell>
                                                        <TableCell>{item.whatsup_no || "N/A"}</TableCell>
                                                    </TableRow>
                                                ))}
                                        </TableBody>
                                    </Table>
                                    <TablePagination
                                        rowsPerPageOptions={[100]}
                                        component="div"
                                        count={filteredData.length}
                                        rowsPerPage={rowsPerPage}
                                        page={page}
                                        onPageChange={handleChangePage}
                                    />
                                </TableContainer>
                            </Grid>
                        </Grid>
                    </Box>
                </div>
            </div>
        </>
    );
};

export default BroadCast;