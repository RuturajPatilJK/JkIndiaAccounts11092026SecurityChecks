import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
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
import axios from "axios";
import { io } from "socket.io-client";
import BackButton from "../../../../Common/Buttons/BackButton";
import CreateNewButton from "../../../../Common/Buttons/CreateNewButton";
import CircularSpinner from "../../../../Common/Spinners/CircularSpinner";
import PageNotFound from '../../../../Common/PageNotFound/PageNotFound';

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

function FinicialGroups() {
    const [fetchedData, setFetchedData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [perPage, setPerPage] = useState(15);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [filterValue, setFilterValue] = useState("B");
    const [loading, setLoading] = useState(true);
    const [canView, setCanView] = useState(null);
    const [permissionsData, setPermissionData] = useState({});
    const navigate = useNavigate();

    const companyCode = sessionStorage.getItem('Company_Code');
    const Year_Code = sessionStorage.getItem('Year_Code');
    const uid = sessionStorage.getItem('uid');

    // useEffect(() => {
    //     const fetchData = async () => {
    //         try {
    //             setLoading(true);
    //             const apiUrl = `${API_URL}/getall-finicial-groups?Company_Code=${companyCode}&Year_Code=${Year_Code}`;
    //             const response = await axios.get(apiUrl);
    //             setFetchedData(response.data);
    //         } catch (error) {
    //             console.error("Error fetching data:", error);
    //         }
    //         finally {
    //             setLoading(false);
    //         }
    //     };
    //     fetchData();
    // }, []);

    useEffect(() => {
        const checkPermissions = async () => {
            try {
                const userCheckUrl = `${API_URL}/get_user_permissions?Company_Code=${companyCode}&Program_Name=/debitcreditnote-utility&uid=${uid}`;
                const response = await axios.get(userCheckUrl);
                const userDetails = response.data?.UserDetails;
                setPermissionData(userDetails);

                if (userDetails?.canView === 'Y') {
                    setCanView(true);

                    try {
                        setLoading(true);
                        const apiUrl = `${API_URL}/getall-finicial-groups?Company_Code=${companyCode}&Year_Code=${Year_Code}`;
                        const dataResponse = await axios.get(apiUrl);
                        setFetchedData(dataResponse.data);
                    } catch (error) {
                        console.error("Error fetching data:", error);
                    } finally {
                        setLoading(false);
                    }

                } else {
                    setCanView(false);
                }
            } catch (error) {
                console.error("Error fetching user permissions:", error);
                setCanView(false);
            }
        };

        checkPermissions();
    }, []);


    useEffect(() => {
        const filtered = fetchedData.filter(post => {
            const searchTermLower = searchTerm.toLowerCase();
            const groupCodeLower = String(post.group_Code).toLowerCase();
            const groupNameLower = (post.group_Name_E || '').toLowerCase();
            const groupOrderLower = String(post.group_Order).toLowerCase();
            const groupSummaryLower = (post.group_Summary || '').toLowerCase();
            const groupTypeLower = (post.group_Type || '').toLowerCase();

            return (
                (filterValue === "" || post.group_Type === filterValue) &&
                (
                    groupCodeLower.includes(searchTermLower) ||
                    groupNameLower.includes(searchTermLower) ||
                    groupOrderLower.includes(searchTermLower) ||
                    groupSummaryLower.includes(searchTermLower) ||
                    groupTypeLower.includes(searchTermLower)
                )
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
        const type = filterValue;
        navigate("/financial-groups", { state: { type } });
    };

    const handleRowClick = (group_Code) => {
        const selectedRecord = filteredData.find(record => record.group_Code === group_Code);
        navigate("/financial-groups", { state: { selectedRecord } });
    };

    const handleSearchClick = () => {
        //setFilterValue("");
    };

    const handleBack = () => {
        navigate("/DashBoard");
    };

    return (
        <div>
            <Grid container alignItems="center" spacing={1} mt={-2}>
                <Grid item>
                    <CreateNewButton onClick={handleClick}
                        disabled={permissionsData.canSave === "N"}
                        permissionsData={permissionsData} />
                </Grid>
                <Grid item>
                    <BackButton onClick={handleBack} />
                </Grid>
                <Grid item>
                    <PerPageSelect value={perPage} onChange={handlePerPageChange} />
                </Grid>
                {/* <Grid item>
                    <FormControl size="small" sx={{ minWidth: 180 }}>
                        <InputLabel id="filterSelect-label">Filter by Type</InputLabel>
                        <Select
                            labelId="filterSelect-label"
                            id="filterSelect"
                            value={filterValue}
                            label="Filter by Type"
                            onChange={(e) => setFilterValue(e.target.value)}
                        >
                            <MenuItem value="B">Balance Sheet</MenuItem>
                            <MenuItem value="T">Trading</MenuItem>
                            <MenuItem value="P">Profit & Loss</MenuItem>
                        </Select>
                    </FormControl>
                </Grid> */}

                <div className="w-40 ml-1 mt-1">
                    <select
                        id="filterSelect"
                        value={filterValue}
                        onChange={(e) => setFilterValue(e.target.value)}
                        className="block w-40 h-10 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                        <option value="B">Balance Sheet</option>
                        <option value="T">Trading</option>
                        <option value="P">Profit & Loss</option>
                    </select>
                </div>

                <Grid item xs ml={30} >
                    <Typography variant="h6" align="center" fontWeight="bold">
                        Group Master
                    </Typography>
                </Grid>
                <Grid item sx={{ flexGrow: 1 }}>
                    <SearchBar
                        value={searchTerm}
                        onChange={handleSearchTermChange}
                        onSearchClick={handleSearchClick}
                    />
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                <Grid item xs={12}>
                    {loading ? (
                        <Box display="flex" justifyContent="center" alignItems="center" height="600px">
                            <CircularSpinner />
                        </Box>
                    ) : (
                        <Paper elevation={3}>
                            <TableContainer sx={{ maxHeight: 600 }}>
                                <Table stickyHeader>
                                    <TableHead>
                                        <TableRow sx={{ backgroundColor: "#f4f4f4" }}>
                                            <TableCell style={styles.tableHeaderCell}>Group Code</TableCell>
                                            <TableCell style={styles.tableHeaderCell}>Group Name</TableCell>
                                            <TableCell style={styles.tableHeaderCell}>Tally Group</TableCell>
                                            <TableCell style={styles.tableHeaderCell}>Group Order</TableCell>
                                            <TableCell style={styles.tableHeaderCell}>Group Summary</TableCell>
                                            <TableCell style={styles.tableHeaderCell}>Group Type</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {paginatedPosts.map((post) => (
                                            <TableRow
                                                key={post.group_Code}
                                                onDoubleClick={() => handleRowClick(post.group_Code)}
                                                sx={{
                                                    cursor: "pointer",
                                                    transition: "background-color 0.3s ease, box-shadow 0.2s ease",
                                                    '&:hover': {
                                                        backgroundColor: '#f3f388',
                                                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                                                    },
                                                }}
                                            >
                                                <TableCell >{post.group_Code}</TableCell>
                                                <TableCell>{post.group_Name_E}</TableCell>
                                                <TableCell>{post.TallyGroup}</TableCell>
                                                <TableCell>{post.group_Order}</TableCell>
                                                <TableCell>{post.group_Summary}</TableCell>
                                                <TableCell>{post.group_Type}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    )}
                </Grid>
            </Grid>
            <Grid container spacing={3} mt={1} mb={10}>
                <Grid item xs={12}>
                    <Pagination
                        pageCount={pageCount}
                        currentPage={currentPage}
                        onPageChange={handlePageChange}
                    />
                </Grid>
            </Grid>
        </div>
    );
}

export default FinicialGroups;