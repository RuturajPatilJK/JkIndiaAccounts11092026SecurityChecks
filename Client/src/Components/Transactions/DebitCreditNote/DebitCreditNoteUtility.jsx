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
    Select,
    MenuItem,
    Grid,
    Paper,
    Typography,
    Box
} from "@mui/material";
import Pagination from "../../../Common/UtilityCommon/Pagination";
import SearchBar from "../../../Common/UtilityCommon/SearchBar";
import PerPageSelect from "../../../Common/UtilityCommon/PerPageSelect";
import PageNotFound from "../../../Common/PageNotFound/PageNotFound";
import axios from "axios";
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

function DebitCreditNoteUtility() {
    const uid = sessionStorage.getItem('uid');
    const companyCode = sessionStorage.getItem('Company_Code');
    const Year_Code = sessionStorage.getItem('Year_Code');

    const [fetchedData, setFetchedData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [perPage, setPerPage] = useState(15);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [filterValue, setFilterValue] = useState("DN");
    const [canView, setCanView] = useState(null);
    const [permissionsData, setPermissionData] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const checkPermissions = async () => {
            try {
                const url = `${API_URL}/get_user_permissions?Company_Code=${companyCode}&Program_Name=/debitcreditnote-utility&uid=${uid}`;
                const response = await axios.get(url);
                const canView = response.data?.UserDetails?.canView === "Y";
                setCanView(canView);
                setPermissionData(response.data?.UserDetails);
                if (canView) fetchData();
            } catch (error) {
                console.error("Error fetching user permissions:", error);
                setCanView(false);
            }
        };

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const url = `${API_URL}/getdata-debitcreditNote?Company_Code=${companyCode}&Year_Code=${Year_Code}`;
                const response = await axios.get(url);
                const data = response.data?.all_data || [];
                setFetchedData(data);
                filterData(data, filterValue);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        checkPermissions();
    }, []);

    useEffect(() => {
        filterData(fetchedData, filterValue);
    }, [searchTerm, filterValue, fetchedData]);

    const filterData = (data, filterValue) => {
        const searchLower = searchTerm.toLowerCase();
        const filtered = data.filter(post => {
            const matchType = (post.tran_type || '').toLowerCase() === filterValue.toLowerCase();
            return matchType && (
                String(post.doc_no).toLowerCase().includes(searchLower) ||
                (post.doc_date || '').toLowerCase().includes(searchLower) ||
                (post.AccountName || '').toLowerCase().includes(searchLower) ||
                String(post.bill_amount).toLowerCase().includes(searchLower) ||
                String(post.dcid).toLowerCase().includes(searchLower) ||
                (post.ShipTo || '').toLowerCase().includes(searchLower) ||
                String(post.bill_id || '').toLowerCase().includes(searchLower) ||
                (post.ackno || '').toLowerCase().includes(searchLower) ||
                String(post.IsDeleted).toLowerCase().includes(searchLower)
            );
        });

        setFilteredData(filtered);
        setCurrentPage(1);
    };

    if (canView === false) return <PageNotFound />;

    const handleRowClick = (doc_no) => {
        const selectedRecord = filteredData.find(record => record.doc_no === doc_no);
        navigate("/debitcreditnote", { state: { selectedRecord, permissionsData } });
    };

    const handleCreateClick = () => {
        navigate("/debitcreditnote", {
            state: { tran_type: filterValue, permissionsData }
        });
    };

    const pageCount = Math.ceil(filteredData.length / perPage);
    const paginatedPosts = filteredData.slice((currentPage - 1) * perPage, currentPage * perPage);

    return (
        <div style={{ padding: '5px' }}>
            <Grid container spacing={1} alignItems="center">
                <Grid item>
                    <CreateNewButton
                        onClick={handleCreateClick}
                        disabled={permissionsData.canSave === "N"}
                        permissionsData={permissionsData}
                    />
                </Grid>
                <Grid item>
                    <BackButton onClick={() => navigate("/DashBoard")} />
                </Grid>
                <Grid item>
                    <PerPageSelect value={perPage} onChange={(e) => setPerPage(Number(e.target.value))} />
                </Grid>
                {/* <Grid item>
                    <FormControl>
                        <Select
                            value={filterValue}
                            onChange={(e) => setFilterValue(e.target.value)}
                            size="small"
                        >
                            <MenuItem value="DN">Debit Note To Customer</MenuItem>
                            <MenuItem value="CN">Credit Note To Customer</MenuItem>
                            <MenuItem value="DS">Debit Note To Supplier</MenuItem>
                            <MenuItem value="CS">Credit Note To Supplier</MenuItem>
                        </Select>
                    </FormControl>
                </Grid> */}


                <div className="w-60 ml-1">
                    <select
                        id="noteType"
                        value={filterValue}
                        onChange={(e) => setFilterValue(e.target.value)}
                        className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                        <option value="DN">Debit Note To Customer</option>
                        <option value="CN">Credit Note To Customer</option>
                        <option value="DS">Debit Note To Supplier</option>
                        <option value="CS">Credit Note To Supplier</option>
                    </select>
                </div>

                <Grid item xs={2} ml={35}>
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
                        Debit Credit Note
                    </Typography>
                </Grid>
                <Grid item xs={4}>
                    <SearchBar value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </Grid>
            </Grid>

            <Grid item xs={12} mt={2}>
                {isLoading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" height="600px">
                        <CircularSpinner />
                    </Box>
                ) : (
                    <Paper elevation={3}>
                        <TableContainer sx={{ maxHeight: 600 }}>
                            <Table stickyHeader>
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: "#f4f4f4" }}>
                                        <TableCell style={styles.tableHeaderCell}>Doc No</TableCell>
                                        <TableCell style={styles.tableHeaderCell}>Tran Type</TableCell>
                                        <TableCell style={styles.tableHeaderCell}>Doc Date</TableCell>
                                        <TableCell style={styles.tableHeaderCell}>Account Name</TableCell>
                                        <TableCell align="right" style={styles.tableHeaderCell}>Bill Amount</TableCell>
                                        <TableCell style={styles.tableHeaderCell}>DcID</TableCell>
                                        <TableCell style={styles.tableHeaderCell}>Ship To Name</TableCell>
                                        <TableCell style={styles.tableHeaderCell}>Old Bill ID</TableCell>
                                        <TableCell style={styles.tableHeaderCell}>Ack No</TableCell>
                                        <TableCell style={styles.tableHeaderCell}>Is Deleted</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {paginatedPosts.map((post) => (
                                        <TableRow
                                            key={post.doc_no}
                                            onDoubleClick={() => handleRowClick(post.doc_no)}
                                            sx={{
                                                cursor: "pointer",
                                                transition: "background-color 0.3s ease, box-shadow 0.2s ease",
                                                '&:hover': {
                                                    backgroundColor: '#f3f388',
                                                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                                                },
                                            }}
                                        >
                                            <TableCell>{post.doc_no}</TableCell>
                                            <TableCell>{post.tran_type}</TableCell>
                                            <TableCell style={{ whiteSpace: "nowrap" }}>{post.doc_date}</TableCell>
                                            <TableCell>{post.AccountName}</TableCell>
                                            <TableCell align="right">{formatReadableAmount(post.bill_amount)}</TableCell>
                                            <TableCell>{post.dcid}</TableCell>
                                            <TableCell>{post.ShipTo}</TableCell>
                                            <TableCell>{post.bill_id}</TableCell>
                                            <TableCell>{post.ackno}</TableCell>
                                            <TableCell>{post.IsDeleted}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                )}
            </Grid>

            <Grid item xs={12} mt={2} mb={10}>
                <Pagination
                    pageCount={pageCount}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                />
            </Grid>
        </div>
    );
}

export default DebitCreditNoteUtility;
