import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Grid,
    Paper,
    MenuItem,
    Select,
    FormControl,
    Typography,
    Snackbar,
    Alert
} from "@mui/material";
import Pagination from "../../../Common/UtilityCommon/Pagination";
import SearchBar from "../../../Common/UtilityCommon/SearchBar";
import PerPageSelect from "../../../Common/UtilityCommon/PerPageSelect";
import axios from "axios";
import PageNotFound from "../../../Common/PageNotFound/PageNotFound";
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";
import BackButton from "../../../Common/Buttons/BackButton";
import CreateNewButton from "../../../Common/Buttons/CreateNewButton";
import io from 'socket.io-client';

const API_URL = process.env.REACT_APP_API;
const socketURL = process.env.REACT_APP_API_URL;

const styles = {
    tableHeaderCell: {
        fontSize: '16px',
        fontWeight: 'bold',
        backgroundColor: '#f4f4f4',
        whiteSpace: 'nowrap',
        position: 'sticky',
        top: 0,
        zIndex: 1
    }
};

function RecieptPaymentUtility() {
    const Year_Code = sessionStorage.getItem("Year_Code");
    const companyCode = sessionStorage.getItem("Company_Code");
    const uid = sessionStorage.getItem("uid");

    const [fetchedData, setFetchedData] = useState([]);
    const [perPage, setPerPage] = useState(15);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [tranType, setTranType] = useState("BR");
    const [canView, setCanView] = useState(null);
    const [permissionsData, setPermissionData] = useState({});
    const [socket, setSocket] = useState(null);
    const [notification, setNotification] = useState(null);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const navigate = useNavigate();


    useEffect(() => {
  const socket = io(`${socketURL}`, {
        transports: ["websocket"],
      });

  socket.on("connect", () => {
    console.log("✅ Socket connected:", socket.id);
  });

  socket.on("receipt_payment_added", (data) => {
    console.log("🟢 New receipt/payment added:", data);
    setNotification({ type: "added", ...data });
    setSnackbarOpen(true);
    fetchData();
  });

  socket.on("receipt_payment_updated", (data) => {
    console.log("🟡 Receipt/payment updated:", data);
    setNotification({ type: "updated", ...data });
    setSnackbarOpen(true);

    if (data.br_created) {
      fetchData();
    }
  });

  socket.on("receipt_payment_deleted", (data) => {
    console.log("🔴 Receipt/payment deleted:", data);
    setNotification({ type: "deleted", ...data });
    setSnackbarOpen(true);
    fetchData();
  });

  socket.on("disconnect", () => {
    console.log("⚠️ Socket disconnected.");
  });

  
  return () => {
    socket.off("receipt_payment_added");
    socket.off("receipt_payment_updated");
    socket.off("receipt_payment_deleted");
    socket.disconnect();
  };
}, []);


   
    useEffect(() => {
        const checkPermissions = async () => {
            try {
                const userCheckUrl = `${API_URL}/get_user_permissions?Company_Code=${companyCode}&Program_Name=/RecieptPaymentUtility&uid=${uid}`;
                const response = await axios.get(userCheckUrl);
                setPermissionData(response.data?.UserDetails);
                if (response.data?.UserDetails?.canView === "Y") {
                    setCanView(true);
                    fetchData();
                } else {
                    setCanView(false);
                }
            } catch (error) {
                console.error("Error fetching user permissions:", error);
                setCanView(false);
            }
        };

      

        checkPermissions();
    }, [tranType, companyCode, Year_Code]);


      const fetchData = async () => {
            try {
                const apiUrl = `${API_URL}/getdata-receiptpayment?Company_Code=${companyCode}&Year_Code=${Year_Code}&tran_type=${tranType}`;
                const response = await axios.get(apiUrl);
                const data = response.data?.all_data_receiptpayment || [];
                setFetchedData(data);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };



    const paginatedData = useMemo(() => {
        const filtered = fetchedData.filter((post) => {
            const searchTermLower = searchTerm.toLowerCase();
            return (
                String(post.doc_no || "").toLowerCase().includes(searchTermLower) ||
                String(post.tran_type || "").toLowerCase().includes(searchTermLower) ||
                String(post.doc_date || "").toLowerCase().includes(searchTermLower) ||
                String(post.bank_name || "").toLowerCase().includes(searchTermLower) ||
                String(post.amount || "").toLowerCase().includes(searchTermLower) ||
                String(post.credit_ac || "").toLowerCase().includes(searchTermLower) ||
                String(post.creditacname || "").toLowerCase().includes(searchTermLower) ||
                String(post.narration || "").toLowerCase().includes(searchTermLower)
            );
        });

        const pageCount = Math.ceil(filtered.length / perPage);
        const paginatedPosts = filtered.slice(
            (currentPage - 1) * perPage,
            currentPage * perPage
        );

        return { paginatedPosts, pageCount };
    }, [fetchedData, searchTerm, perPage, currentPage]);

    const handleTranTypeChange = (event) => {
        setTranType(event.target.value);
        setCurrentPage(1);
    };

    const handlePerPageChange = (event) => {
        setPerPage(Number(event.target.value));
        setCurrentPage(1);
    };

    const handleSearchTermChange = (event) => {
        setSearchTerm(event.target.value);
        setCurrentPage(1);
    };

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleClick = () => {
        navigate("/receipt-payment", { state: { tranType, permissionsData } });
    };

    const handleRowClick = (tranid) => {
        const selectedRecord = fetchedData.find((record) => record.tranid === tranid);
        navigate("/receipt-payment", { state: { selectedRecord, permissionsData } });
    };

    const handleBack = () => {
        navigate("/DashBoard");
    };

    if (canView === false) {
        return <PageNotFound />;
    }

    return (
        <div>
            <Grid container spacing={2} alignItems="center">
                <Grid item>
                    <CreateNewButton
                        onClick={handleClick}
                        disabled={!tranType || permissionsData.canSave === "N"}
                        permissionsData={permissionsData}
                    />
                </Grid>
                <Grid item>
                    <BackButton onClick={handleBack} />
                </Grid>
                <Grid item>
                    <PerPageSelect value={perPage} onChange={handlePerPageChange} />
                </Grid>
                {/* <Grid item>
                    <FormControl>
                        <Select value={tranType} onChange={handleTranTypeChange} size="small">
                            <MenuItem value="BR">Bank Receipt</MenuItem>
                            <MenuItem value="BP">Bank Payment</MenuItem>
                            <MenuItem value="CR">Cash Receipt</MenuItem>
                            <MenuItem value="CP">Cash Payment</MenuItem>
                        </Select>
                    </FormControl>
                </Grid> */}

                <div className="w-full sm:w-auto mt-3 ml-1">
                    <select
                        id="tranType"
                        value={tranType}
                        onChange={handleTranTypeChange}
                        className="w-40 h-10 px-3 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="BR">Bank Receipt</option>
                        <option value="BP">Bank Payment</option>
                        <option value="CR">Cash Receipt</option>
                        <option value="CP">Cash Payment</option>
                    </select>
                </div>

                <Grid item xs={2} ml={40}>
                    <Typography variant="h6"
                        component="h1"
                        gutterBottom
                        sx={{
                            textAlign: 'center',
                            fontSize: '1.2rem',
                            fontWeight: 'bold',
                            color: '#2c3e50',
                            marginBottom: '30px',
                            padding: '12px 0',
                            position: 'relative',
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
                        }}>
                        Receipt Payment
                    </Typography>
                </Grid>
                <Grid item xs={4} sx={{ justifyContent: "flex-end" }}>
                    <SearchBar value={searchTerm} onChange={handleSearchTermChange} />
                </Grid>
            </Grid>

            <Grid item xs={12}>
                <Paper elevation={3}>
                    <TableContainer sx={{ maxHeight: 600 }}>
                        <Table stickyHeader>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: "#f4f4f4" }} >
                                    <TableCell style={styles.tableHeaderCell}>Doc No</TableCell>
                                    <TableCell style={styles.tableHeaderCell}>Tran Type</TableCell>
                                    <TableCell style={styles.tableHeaderCell}>Doc Date</TableCell>
                                    <TableCell style={styles.tableHeaderCell}>Bank Name</TableCell>
                                    <TableCell style={styles.tableHeaderCell}>Amount</TableCell>
                                    <TableCell style={styles.tableHeaderCell}>Credit A/C</TableCell>
                                    <TableCell style={styles.tableHeaderCell}>Credit Name</TableCell>
                                    <TableCell style={styles.tableHeaderCell}>Narration</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {paginatedData.paginatedPosts.map((post) => (
                                    <TableRow
                                        key={post.trandetailid}
                                        onDoubleClick={() => handleRowClick(post.tranid)}
                                        sx={{
                                            cursor: "pointer",
                                            transition: "background-color 0.3s ease, box-shadow 0.2s ease",
                                            '&:hover': {
                                                backgroundColor: '#f3f388',
                                                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                                            },
                                        }}
                                    >
                                        <TableCell>{post.doc_no || ""}</TableCell>
                                        <TableCell>{post.tran_type || ""}</TableCell>
                                        <TableCell style={{ whiteSpace: "nowrap" }}>{post.doc_date || ""}</TableCell>
                                        <TableCell style={{ whiteSpace: "nowrap" }}>{post.bank_name || ""}</TableCell>
                                        <TableCell align="right" >{formatReadableAmount(post.amount) || ""}</TableCell>
                                        <TableCell>{post.credit_ac || ""}</TableCell>
                                        <TableCell style={{ whiteSpace: "nowrap" }}>{post.creditacname || ""}</TableCell>
                                        <TableCell style={{ whiteSpace: "nowrap" }}>{post.narration || ""}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            </Grid>

            <Grid item xs={12} mb={15}>
                <Pagination
                    pageCount={paginatedData.pageCount}
                    currentPage={currentPage}
                    onPageChange={handlePageChange}
                />
            </Grid>
        </div>
    );
}

export default RecieptPaymentUtility;

// import React, { useState, useEffect, useMemo } from "react";
// import { useNavigate } from "react-router-dom";
// import {
//     Table,
//     TableBody,
//     TableCell,
//     TableContainer,
//     TableHead,
//     TableRow,
//     Grid,
//     Paper,
//     MenuItem,
//     Select,
//     FormControl,
//     Typography,
//     Box
// } from "@mui/material";
// import Pagination from "../../../Common/UtilityCommon/Pagination";
// import SearchBar from "../../../Common/UtilityCommon/SearchBar";
// import PerPageSelect from "../../../Common/UtilityCommon/PerPageSelect";
// import axios from "axios";
// import PageNotFound from "../../../Common/PageNotFound/PageNotFound";
// import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";
// import BackButton from "../../../Common/Buttons/BackButton";
// import CreateNewButton from "../../../Common/Buttons/CreateNewButton";
// import CircularSpinner from "../../../Common/Spinners/CircularSpinner";

// const API_URL = process.env.REACT_APP_API;

// const styles = {
//     tableHeaderCell: {
//         fontSize: '16px',
//         fontWeight: 'bold',
//         backgroundColor: '#f4f4f4',
//         whiteSpace: 'nowrap',
//         position: 'sticky',
//         top: 0,
//         zIndex: 1
//     }
// };


// function RecieptPaymentUtility() {
//     const Year_Code = sessionStorage.getItem("Year_Code");
//     const companyCode = sessionStorage.getItem("Company_Code");
//     const uid = sessionStorage.getItem("uid");

//     const [fetchedData, setFetchedData] = useState([]);
//     const [perPage, setPerPage] = useState(15);
//     const [searchTerm, setSearchTerm] = useState("");
//     const [currentPage, setCurrentPage] = useState(1);
//     const [tranType, setTranType] = useState("BR");
//     const [isLoading, setIsLoading] = useState(false);
//     const [canView, setCanView] = useState(null);
//     const [permissionsData, setPermissionData] = useState({});
//     const navigate = useNavigate();

//     useEffect(() => {
//         const checkPermissions = async () => {
//             try {
//                 const userCheckUrl = `${API_URL}/get_user_permissions?Company_Code=${companyCode}&Program_Name=/RecieptPaymentUtility&uid=${uid}`;
//                 const response = await axios.get(userCheckUrl);
//                 setPermissionData(response.data?.UserDetails);
//                 if (response.data?.UserDetails?.canView === "Y") {
//                     setCanView(true);
//                     fetchData();
//                 } else {
//                     setCanView(false);
//                 }
//             } catch (error) {
//                 console.error("Error fetching user permissions:", error);
//                 setCanView(false);
//             }
//         };

//         const fetchData = async () => {
//             setIsLoading(true);
//             try {
//                 const apiUrl = `${API_URL}/getdata-receiptpayment?Company_Code=${companyCode}&Year_Code=${Year_Code}&tran_type=${tranType}`;
//                 const response = await axios.get(apiUrl);
//                 const data = response.data?.all_data_receiptpayment || [];
//                 setFetchedData(data);
//             } catch (error) {
//                 console.error("Error fetching data:", error);
//             } finally {
//                 setIsLoading(false);
//             }
//         };

//         checkPermissions();
//     }, [tranType, companyCode, Year_Code]);

//     const paginatedData = useMemo(() => {
//         const filtered = fetchedData.filter((post) => {
//             const searchTermLower = searchTerm.toLowerCase();
//             return (
//                 String(post.doc_no || "").toLowerCase().includes(searchTermLower) ||
//                 String(post.tran_type || "").toLowerCase().includes(searchTermLower) ||
//                 String(post.doc_date || "").toLowerCase().includes(searchTermLower) ||
//                 String(post.bank_name || "").toLowerCase().includes(searchTermLower) ||
//                 String(post.amount || "").toLowerCase().includes(searchTermLower) ||
//                 String(post.credit_ac || "").toLowerCase().includes(searchTermLower) ||
//                 String(post.creditacname || "").toLowerCase().includes(searchTermLower) ||
//                 String(post.narration || "").toLowerCase().includes(searchTermLower)
//             );
//         });

//         const pageCount = Math.ceil(filtered.length / perPage);
//         const paginatedPosts = filtered.slice(
//             (currentPage - 1) * perPage,
//             currentPage * perPage
//         );

//         return { paginatedPosts, pageCount };
//     }, [fetchedData, searchTerm, perPage, currentPage]);

//     const handleTranTypeChange = (event) => {
//         setTranType(event.target.value);
//         setCurrentPage(1);
//     };

//     const handlePerPageChange = (event) => {
//         setPerPage(Number(event.target.value));
//         setCurrentPage(1);
//     };

//     const handleSearchTermChange = (event) => {
//         setSearchTerm(event.target.value);
//         setCurrentPage(1);
//     };

//     const handlePageChange = (pageNumber) => {
//         setCurrentPage(pageNumber);
//     };

//     const handleClick = () => {
//         navigate("/receipt-payment", { state: { tranType, permissionsData } });
//     };

//     const handleRowClick = (tranid) => {
//         const selectedRecord = fetchedData.find((record) => record.tranid === tranid);
//         navigate("/receipt-payment", { state: { selectedRecord, permissionsData } });
//     };

//     const handleBack = () => {
//         navigate("/DashBoard");
//     };

//     if (canView === false) {
//         return <PageNotFound />;
//     }

//     return (
//         <div>
//             <Grid container spacing={2} alignItems="center">
//                 <Grid item>
//                     <CreateNewButton
//                         onClick={handleClick}
//                         disabled={!tranType || permissionsData.canSave === "N"}
//                         permissionsData={permissionsData}
//                     />
//                 </Grid>
//                 <Grid item>
//                     <BackButton onClick={handleBack} />
//                 </Grid>
//                 <Grid item>
//                     <PerPageSelect value={perPage} onChange={handlePerPageChange} />
//                 </Grid>
//                 {/* <Grid item>
//                     <FormControl>
//                         <Select value={tranType} onChange={handleTranTypeChange} size="small">
//                             <MenuItem value="BR">Bank Receipt</MenuItem>
//                             <MenuItem value="BP">Bank Payment</MenuItem>
//                             <MenuItem value="CR">Cash Receipt</MenuItem>
//                             <MenuItem value="CP">Cash Payment</MenuItem>
//                         </Select>
//                     </FormControl>
//                 </Grid> */}

//                 <div className="w-full sm:w-auto mt-3 ml-1">
//                     <select
//                         id="tranType"
//                         value={tranType}
//                         onChange={handleTranTypeChange}
//                         className="w-40 h-10 px-3 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     >
//                         <option value="BR">Bank Receipt</option>
//                         <option value="BP">Bank Payment</option>
//                         <option value="CR">Cash Receipt</option>
//                         <option value="CP">Cash Payment</option>
//                     </select>
//                 </div>

//                 <Grid item xs={2} ml={40}>
//                     <Typography variant="h6"
//                         component="h1"
//                         gutterBottom
//                         sx={{
//                             textAlign: 'center',
//                             fontSize: '1.2rem',
//                             fontWeight: 'bold',
//                             color: '#2c3e50',
//                             marginBottom: '30px',
//                             padding: '12px 0',
//                             position: 'relative',
//                             '&::after': {
//                                 content: '""',
//                                 position: 'absolute',
//                                 bottom: '0',
//                                 left: '50%',
//                                 transform: 'translateX(-50%)',
//                                 width: '80px',
//                                 height: '4px',
//                                 background: 'linear-gradient(90deg, #3498db, #2ecc71)',
//                                 borderRadius: '2px',
//                                 animation: 'underlineGrow 0.5s ease-out forwards'
//                             },
//                             '@keyframes underlineGrow': {
//                                 '0%': { width: '0' },
//                                 '100%': { width: '80px' }
//                             }
//                         }}>
//                         Receipt Payment
//                     </Typography>
//                 </Grid>
//                 <Grid item xs={4} sx={{ justifyContent: "flex-end" }}>
//                     <SearchBar value={searchTerm} onChange={handleSearchTermChange} />
//                 </Grid>
//             </Grid>

//             <Grid item xs={12}>
//                 {isLoading ? (
//                     <Box display="flex" justifyContent="center" alignItems="center" height="600px">
//                         <CircularSpinner />
//                     </Box>
//                 ) : (
//                     <Paper elevation={3}>
//                         <TableContainer sx={{ maxHeight: 600 }}>
//                             <Table stickyHeader>
//                                 <TableHead>
//                                     <TableRow sx={{ backgroundColor: "#f4f4f4" }} >
//                                         <TableCell style={styles.tableHeaderCell}>Doc No</TableCell>
//                                         <TableCell style={styles.tableHeaderCell}>Tran Type</TableCell>
//                                         <TableCell style={styles.tableHeaderCell}>Doc Date</TableCell>
//                                         <TableCell style={styles.tableHeaderCell}>Bank Name</TableCell>
//                                         <TableCell style={styles.tableHeaderCell}>Amount</TableCell>
//                                         <TableCell style={styles.tableHeaderCell}>Credit A/C</TableCell>
//                                         <TableCell style={styles.tableHeaderCell}>Credit Name</TableCell>
//                                         <TableCell style={styles.tableHeaderCell}>Narration</TableCell>
//                                     </TableRow>
//                                 </TableHead>
//                                 <TableBody>
//                                     {paginatedData.paginatedPosts.map((post) => (
//                                         <TableRow
//                                             key={post.trandetailid}
//                                             onDoubleClick={() => handleRowClick(post.tranid)}
//                                             sx={{
//                                                 cursor: "pointer",
//                                                 transition: "background-color 0.3s ease, box-shadow 0.2s ease",
//                                                 '&:hover': {
//                                                     backgroundColor: '#f3f388',
//                                                     boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
//                                                 },
//                                             }}
//                                         >
//                                             <TableCell>{post.doc_no || ""}</TableCell>
//                                             <TableCell>{post.tran_type || ""}</TableCell>
//                                             <TableCell style={{ whiteSpace: "nowrap" }}>{post.doc_date || ""}</TableCell>
//                                             <TableCell style={{ whiteSpace: "nowrap" }}>{post.bank_name || ""}</TableCell>
//                                             <TableCell align="right" >{formatReadableAmount(post.amount) || ""}</TableCell>
//                                             <TableCell>{post.credit_ac || ""}</TableCell>
//                                             <TableCell style={{ whiteSpace: "nowrap" }}>{post.creditacname || ""}</TableCell>
//                                             <TableCell style={{ whiteSpace: "nowrap" }}>{post.narration || ""}</TableCell>
//                                         </TableRow>
//                                     ))}
//                                 </TableBody>
//                             </Table>
//                         </TableContainer>
//                     </Paper>
//                 )}
//             </Grid>

//             <Grid item xs={12} mb={15}>
//                 <Pagination
//                     pageCount={paginatedData.pageCount}
//                     currentPage={currentPage}
//                     onPageChange={handlePageChange}
//                 />
//             </Grid>
//         </div>
//     );
// }

// export default RecieptPaymentUtility;




