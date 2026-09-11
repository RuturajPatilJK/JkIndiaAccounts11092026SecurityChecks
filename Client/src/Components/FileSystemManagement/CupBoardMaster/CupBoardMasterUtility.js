import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "../../../Common/Buttons/BackButton";
import CreateNewButton from "../../../Common/Buttons/CreateNewButton";
import PerPageSelect from "../../../Common/UtilityCommon/PerPageSelect";
import SearchBar from "../../../Common/UtilityCommon/SearchBar";
import Pagination from "../../../Common/UtilityCommon/Pagination";

import {
    Grid,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from "@mui/material";

function CupBoardMasterUtility() {
    const apiURL = process.env.REACT_APP_API_URL_FILE_SYSTEM;
    const [fetchedData, setFetchedData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [perPage, setPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [filterValue, setFilterValue] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const apiUrl = `${apiURL}/getallCupBoard`;
                const response = await fetch(apiUrl);
                const data = await response.json();
                setFetchedData(data.alldata);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        const filtered = fetchedData.filter((post) => {
            const searchTermLower = searchTerm.toLowerCase();
            const name = (post.Cupboard_Name || "").toLowerCase();
            const code = (String(post.Cupboard_Code) || "").toLowerCase();

            return (
                (filterValue === "" || post.group_Type === filterValue) &&
                (name.includes(searchTermLower) || code.includes(searchTermLower))
            );
        });

        setFilteredData(filtered);
        setCurrentPage(1);
    }, [searchTerm, filterValue, fetchedData]);

    const handleSearchTermChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleClick = () => {
        navigate("/filesystemcupboardmaster");
    };

    const handleRowClick = (Cupboard_Code) => {
        const selected = fetchedData.find(
            (item) => item.Cupboard_Code === Cupboard_Code
        );
        navigate("/filesystemcupboardmaster", {
            state: { editRecordData: selected },
        });
    };

    const handleBackButton = () => {
        navigate("/filesystemdashboard");
    };

    const paginatedPosts = filteredData.slice(
        (currentPage - 1) * perPage,
        currentPage * perPage
    );

    const pageCount = Math.ceil(filteredData.length / perPage);

    return (
        <div >
            <Grid
                container
                spacing={1}
                alignItems="center"
                justifyContent="space-between"
            >
                <Grid item sx={{ display: "flex", gap: 1 }}>
                    <CreateNewButton onClick={handleClick} />
                    <BackButton onClick={handleBackButton} />
                    <PerPageSelect
                        value={perPage}
                        onChange={(e) => setPerPage(Number(e.target.value))}
                    />
                </Grid>

                <Typography variant="h6"
                    component="h1"
                    gutterBottom
                    marginLeft="250px"
                    sx={{
                        textAlign: 'center',
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        color: '#2c3e50',
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
                    CupBoard Master
                </Typography>

                <Grid item xs={12} sm={6} md={4}>
                    <SearchBar
                        value={searchTerm}
                        onChange={handleSearchTermChange}
                        placeholder="Search Cupboard..."
                        fullWidth
                    />
                </Grid>
            </Grid>

            <Paper elevation={10} sx={{ maxWidth: "1000px", margin: "auto" }}>
                <TableContainer>
                    <Table size="small">
                        <TableHead sx={{ backgroundColor: "#fcfcfcff" }}>
                            <TableRow>
                                <TableCell><strong>Cupboard Code</strong></TableCell>
                                <TableCell><strong>Cupboard Name</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginatedPosts.map((row) => (
                                <TableRow
                                    key={row.Cupboard_Code}
                                    onDoubleClick={() => handleRowClick(row.Cupboard_Code)}
                                    sx={{
                                        cursor: "pointer",
                                        transition: "background-color 0.3s ease",
                                        '&:hover': {
                                            backgroundColor: '#f3f388',
                                        },
                                    }}
                                >
                                    <TableCell>{row.Cupboard_Code}</TableCell>
                                    <TableCell>{row.Cupboard_Name}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <Grid item xs={12} mt={3} mb={5}>
                <Pagination
                    pageCount={pageCount}
                    currentPage={currentPage}
                    onPageChange={handlePageChange}
                />
            </Grid>
        </div>
    );
}

export default CupBoardMasterUtility;
