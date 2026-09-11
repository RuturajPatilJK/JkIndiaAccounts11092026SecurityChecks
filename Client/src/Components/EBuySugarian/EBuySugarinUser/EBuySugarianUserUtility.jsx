import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    Grid,
    Paper,
    Typography
} from "@mui/material";
import Pagination from "../../../Common/UtilityCommon/Pagination";
import SearchBar from "../../../Common/UtilityCommon/SearchBar";
import PerPageSelect from "../../../Common/UtilityCommon/PerPageSelect";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";

const API_URL = process.env.REACT_APP_API;
const companyCode = sessionStorage.getItem('Company_Code');
const Year_Code = sessionStorage.getItem('Year_Code');

function EBuySugarianUserUtility() {
    const [fetchedData, setFetchedData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [perPage, setPerPage] = useState(15);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const apiUrl = `${API_URL}/getAll_UserAccoidNullWise`;
                const response = await axios.get(apiUrl);
                if (response.data && Array.isArray(response.data.records)) {
                    setFetchedData(response.data.records);
                    setFilteredData(response.data.records);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        const filtered = fetchedData.filter(post => {
            const searchTermLower = searchTerm.toLowerCase();
            return Object.keys(post).some(key =>
                String(post[key]).toLowerCase().includes(searchTermLower)
            );
        });
        setFilteredData(filtered);
        setCurrentPage(1);
    }, [searchTerm, fetchedData]);

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

    const handleRowClick = (gst_no) => {
        if (gst_no === "" || !gst_no) {
            toast.info("No GST Number Provided for this record");
        } else {
            navigate("/eBuySugarian-AcMaster-utility", { state: { gst_no } });
        }
    };
    

    const handleSearchClick = () => {
        // Handle search button click if needed
    };

    const handleBack = () => {
        navigate("/DashBoard");
    };

    return (
        <div style={{ padding: '20px', overflow: 'hidden' }}>
            <ToastContainer autoClose={500}/>
            <Typography variant="h4" gutterBottom style={{ textAlign: 'center', marginBottom: '20px' }}>
                Users List
            </Typography>
            <Grid container spacing={2} alignItems="center">
                <Grid item>
                    <Button variant="contained" color="secondary" onClick={handleBack}>
                        Back
                    </Button>
                </Grid>
                <Grid item>
                    <PerPageSelect value={perPage} onChange={handlePerPageChange} />
                </Grid>
                <Grid item xs={12} sm={4} sx={{ marginLeft: 2 }}>
                    <SearchBar
                        value={searchTerm}
                        onChange={handleSearchTermChange}
                        onSearchClick={handleSearchClick}
                    />
                </Grid>
                <Grid item xs={12}>
                    <Paper elevation={3}>
                        <TableContainer style={{ maxHeight: '400px' }}>
                            <Table stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>User Id</TableCell>
                                        <TableCell>Company Name</TableCell>
                                        <TableCell>GST No</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {paginatedPosts.map((post) => (
                                        <TableRow
                                            key={post.user_id}
                                            className="row-item"
                                            style={{ cursor: "pointer" }}
                                            onDoubleClick={() => handleRowClick(post.gst_no)}
                                        >
                                            <TableCell>{post.user_id}</TableCell>
                                            <TableCell>{post.company_name}</TableCell>
                                            <TableCell>{post.gst_no}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>
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

export default EBuySugarianUserUtility;
