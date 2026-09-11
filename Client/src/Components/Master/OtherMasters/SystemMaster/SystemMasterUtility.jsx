import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageNotFound from "../../../../Common/PageNotFound/PageNotFound";
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Paper,
    Typography, Box
} from "@mui/material";
import Pagination from "../../../../Common/UtilityCommon/Pagination";
import SearchBar from "../../../../Common/UtilityCommon/SearchBar";
import PerPageSelect from "../../../../Common/UtilityCommon/PerPageSelect";
import BackButton from "../../../../Common/Buttons/BackButton";
import CreateNewButton from "../../../../Common/Buttons/CreateNewButton";
import CircularSpinner from "../../../../Common/Spinners/CircularSpinner";
import axios from "axios";

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

function SystemMasterUtility() {
    const companyCode = sessionStorage.getItem('Company_Code');
    const Year_Code = sessionStorage.getItem('Year_Code');

    const uid = sessionStorage.getItem('uid');
    const [fetchedData, setFetchedData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [perPage, setPerPage] = useState(15);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [filterValue, setFilterValue] = useState("G");
    const [canView, setCanView] = useState(null);
    const [permissionsData, setPermissionData] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const checkPermissions = async () => {
            try {
                const userCheckUrl = `${API_URL}/get_user_permissions?Company_Code=${companyCode}&Program_Name=/syetem-masterutility&uid=${uid}`;
                const response = await axios.get(userCheckUrl);
                setPermissionData(response.data?.UserDetails);
                if (response.data?.UserDetails?.canView === 'Y') {
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
            const companyCode = sessionStorage.getItem('Company_Code');
            try {
                const apiUrl = `${API_URL}/getall-SystemMaster?Company_Code=${companyCode}`;
                const response = await axios.get(apiUrl);
                setFetchedData(response.data);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        checkPermissions();
    }, []);


    useEffect(() => {
        const filtered = fetchedData.filter(post => {
            const searchTermLower = searchTerm.toLowerCase();
            return (
                (filterValue === "" || post.System_Type === filterValue) &&
                (String(post.System_Code).includes(searchTermLower) ||
                    post.System_Name_E.toLowerCase().includes(searchTermLower))
            );
        });

        setFilteredData(filtered);
        setCurrentPage(1);
    }, [searchTerm, filterValue, fetchedData]);

    if (canView === false) {
        return <PageNotFound />;
    }

    const handlePerPageChange = (event) => {
        setPerPage(event.target.value);
        setCurrentPage(1);
    };

    const handleSearchTermChange = (event) => {
        const term = event.target.value;
        setSearchTerm(term);
    };

    const pageCount = Math.ceil(filteredData.length / perPage);

    const paginatedPosts = filteredData.slice((currentPage - 1) * perPage, currentPage * perPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleClick = () => {
        const selectedfilter = filterValue
        navigate("/syetem-master", { state: { selectedfilter } });

    };

    const handleRowClick = (System_Code) => {
        const selectedRecord = filteredData.find(record => record.System_Code === System_Code);
        navigate("/syetem-master", { state: { selectedRecord } });
    };

    const handleSearchClick = () => {
        setFilterValue("");
    };

    const handleBack = () => {
        navigate("/DashBoard")
    }

    return (
        <div style={{ padding: '10px', overflow: 'hidden' }} >
            <Grid container alignItems="center" spacing={1}>
                <Grid item>
                    <CreateNewButton
                        onClick={handleClick}
                        disabled={permissionsData.canSave === "N"}
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
                    <FormControl sx={{ minWidth: 200 }} size="small">
                        <InputLabel>Filter by Type</InputLabel>
                        <Select
                            labelId="filterSelect-label"
                            id="filterSelect"
                            value={filterValue}
                            onChange={(e) => setFilterValue(e.target.value)}
                            label="Filter by Type"
                        >
                            <MenuItem value="G">Mobile Group</MenuItem>
                            <MenuItem value="N">Narration</MenuItem>
                            <MenuItem value="V">Vat</MenuItem>
                            <MenuItem value="I">Items</MenuItem>
                            <MenuItem value="S">Grades</MenuItem>
                            <MenuItem value="Z">Season</MenuItem>
                            <MenuItem value="U">Units</MenuItem>
                            <MenuItem value="C">Groups</MenuItem>
                            <MenuItem value="W">Godowns</MenuItem>
                            <MenuItem value="E">Events</MenuItem>

                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs ml={-20}>
                    <Typography variant="h6" align="center" fontWeight="bold">
                        System Master
                    </Typography>
                </Grid>
                <Grid item >
                    <SearchBar
                        value={searchTerm}
                        onChange={handleSearchTermChange}
                        onSearchClick={handleSearchClick}
                    />
                </Grid>
            </Grid>

            <Grid item xs={12}>
                {isLoading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" height="600px">
                        <CircularSpinner />
                    </Box>
                ) : (
                    <Paper elevation={20}>
                        <TableContainer sx={{ maxHeight: 600 }}>
                            <Table stickyHeader>
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: "#f4f4f4" }}>
                                        <TableCell style={styles.tableHeaderCell}>System Code</TableCell>
                                        <TableCell style={styles.tableHeaderCell}>System Type</TableCell>
                                        <TableCell style={styles.tableHeaderCell}>System Name</TableCell>
                                        <TableCell style={styles.tableHeaderCell}>System Rate</TableCell>
                                        <TableCell style={styles.tableHeaderCell}>HSN</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {paginatedPosts.map((post) => (
                                        <TableRow
                                            key={post.System_Code}
                                            onDoubleClick={() => handleRowClick(post.System_Code)}
                                            sx={{
                                                cursor: "pointer",
                                                transition: "background-color 0.3s ease, box-shadow 0.2s ease",
                                                '&:hover': {
                                                    backgroundColor: '#f3f388',
                                                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                                                },
                                            }}
                                        >
                                            <TableCell>{post.System_Code}</TableCell>
                                            <TableCell>{post.System_Type}</TableCell>
                                            <TableCell>{post.System_Name_E}</TableCell>
                                            <TableCell>{post.System_Rate}</TableCell>
                                            <TableCell>{post.HSN}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                )}
            </Grid>
            <Grid item xs={12} mb={10}>
                <Pagination
                    pageCount={pageCount}
                    currentPage={currentPage}
                    onPageChange={handlePageChange}
                />
            </Grid>
        </div>
    );
}

export default SystemMasterUtility;
