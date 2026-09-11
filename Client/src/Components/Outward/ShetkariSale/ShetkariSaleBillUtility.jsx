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
    Box
} from "@mui/material";
import Pagination from "../../../Common/UtilityCommon/Pagination";
import SearchBar from "../../../Common/UtilityCommon/SearchBar";
import PerPageSelect from "../../../Common/UtilityCommon/PerPageSelect";
import axios from "axios";
import PageNotFound from "../../../Common/PageNotFound/PageNotFound";
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";
import BackButton from "../../../Common/Buttons/BackButton";
import CreateNewButton from "../../../Common/Buttons/CreateNewButton";
import CircularSpinner from "../../../Common/Spinners/CircularSpinner";

const API_URL = process.env.REACT_APP_API;

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


function ShetkariSaleBillUtility() {
    const Year_Code = sessionStorage.getItem("Year_Code");
    const companyCode = sessionStorage.getItem("Company_Code");
    const uid = sessionStorage.getItem("uid");

    const [fetchedData, setFetchedData] = useState([]);
    const [perPage, setPerPage] = useState(15);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [tranType, setTranType] = useState("CS");
    const [isLoading, setIsLoading] = useState(false);
    const [canView, setCanView] = useState(null);
    const [permissionsData, setPermissionData] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        const checkPermissions = async () => {
            try {
                const userCheckUrl = `${API_URL}/get_user_permissions?Company_Code=${companyCode}&Program_Name=/ShetkariPurchaseBillUtility&uid=${uid}`;
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

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const apiUrl = `${API_URL}/getdata-ShetkariSaleBillHead?Company_Code=${companyCode}&Year_Code=${Year_Code}&tran_type=${tranType}`;
                const response = await axios.get(apiUrl);
                const data = response.data?.ShetkariSaleBillHead_Head || [];
                setFetchedData(data);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        checkPermissions();
    }, [tranType, companyCode, Year_Code]);

    const paginatedData = useMemo(() => {
        const filtered = fetchedData.filter((post) => {
            const searchTermLower = searchTerm.toLowerCase();
            return (
                String(post.Doc_No || "").toLowerCase().includes(searchTermLower) ||
                String(post.FromName || "").toLowerCase().includes(searchTermLower) ||
                String(post.Doc_Date || "").toLowerCase().includes(searchTermLower) ||
                String(post.Amount || "").toLowerCase().includes(searchTermLower) 
               
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
        navigate("/ShetkariSaleBill", { state: { tranType, permissionsData } });
    };

    const handleRowClick = (Sale_Id) => {
        ;
        const selectedRecord = fetchedData.find((record) => record.Sale_Id === Sale_Id);
        navigate("/ShetkariSaleBill", { state: { selectedRecord, permissionsData } });
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
                <Grid item>
                    <FormControl>
                        <Select value={tranType} onChange={handleTranTypeChange} size="small">
                            <MenuItem value="CS">Cash</MenuItem>
                            <MenuItem value="CR">Cash Credit</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
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
                        Shetkari SaleBill
                    </Typography>
                </Grid>
                <Grid item xs={4} sx={{ justifyContent: "flex-end" }}>
                    <SearchBar value={searchTerm} onChange={handleSearchTermChange} />
                </Grid>
            </Grid>

            <Grid item xs={12}>
                {isLoading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" height="600px">
                        <CircularSpinner />
                    </Box>
                ) : (
                    <Paper elevation={3}>
                        <TableContainer sx={{ maxHeight: 600 }}>
                            <Table stickyHeader>
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: "#f4f4f4" }} >
                                        <TableCell style={styles.tableHeaderCell}>Doc No</TableCell>
                                        <TableCell style={styles.tableHeaderCell}>Tran Type</TableCell>
                                        <TableCell style={styles.tableHeaderCell}>Doc Date</TableCell>
                                        <TableCell style={styles.tableHeaderCell}>Bill From Name</TableCell>
                                        <TableCell style={styles.tableHeaderCell}>Bill From GSTNo</TableCell>
                                        <TableCell style={styles.tableHeaderCell}>Bill Amount</TableCell>

                                        <TableCell style={styles.tableHeaderCell}>EwayBill No</TableCell>
                                        <TableCell style={styles.tableHeaderCell}>Ack No</TableCell>
                                        <TableCell style={styles.tableHeaderCell}>Saleid</TableCell>
                                        
                                       
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {paginatedData.paginatedPosts.map((post) => (
                                        <TableRow
                                            key={post.Sale_Id}
                                            onDoubleClick={() => handleRowClick(post.Sale_Id)}
                                            sx={{
                                                cursor: "pointer",
                                                transition: "background-color 0.3s ease, box-shadow 0.2s ease",
                                                '&:hover': {
                                                    backgroundColor: '#f3f388',
                                                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                                                },
                                            }}
                                        >
                                            <TableCell>{post.Doc_No || ""}</TableCell>
                                            <TableCell>{post.Cash_Credit || ""}</TableCell>
                                            <TableCell style={{ whiteSpace: "nowrap" }}>{post.Doc_Date || ""}</TableCell>
                                            <TableCell style={{ whiteSpace: "nowrap" }}>{post.FromName || ""}</TableCell>
                                            <TableCell>{post.Gst_No || ""}</TableCell>
                                            <TableCell>{formatReadableAmount(post.Amount) || ""}</TableCell>
                                            <TableCell >{post.EWay_Bill_No || ""}</TableCell>
                                            <TableCell>{post.Ack_No || ""}</TableCell>
                                            <TableCell>{post.Sale_Id || ""}</TableCell>
                                            
                                            
                                           
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                )}
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

export default ShetkariSaleBillUtility;

