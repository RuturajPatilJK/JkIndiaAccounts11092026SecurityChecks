

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    FormControl, Select, MenuItem, Grid, Paper, Typography, Box
} from "@mui/material";
import Pagination from "../../../Common/UtilityCommon/Pagination";
import SearchBar from "../../../Common/UtilityCommon/SearchBar";
import PerPageSelect from "../../../Common/UtilityCommon/PerPageSelect";
import PageNotFound from "../../../Common/PageNotFound/PageNotFound";
import axios from "axios";
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";
import { ConvertNumberToWord } from "../../../Common/FormatFunctions/ConvertNumberToWord";
import CreateNewButton from "../../../Common/Buttons/CreateNewButton";
import CircularSpinner from "../../../Common/Spinners/CircularSpinner";
import BackButton from "../../../Common/Buttons/BackButton";

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

const FundManagementUtility = () => {
    const uid = sessionStorage.getItem('uid');
    const companyCode = sessionStorage.getItem('Company_Code');
    const Year_Code = sessionStorage.getItem('Year_Code');

    const [fetchedData, setFetchedData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [perPage, setPerPage] = useState(15);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedRows, setSelectedRows] = useState([]);
    const [canView, setCanView] = useState(true);
    const [permissionsData, setPermissionData] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${API_URL}/getAllfundata?Company_Code=${companyCode}`, {
                params: { Doc_no: sessionStorage.getItem("doc_no") }
            });
            const data = response.data?.record_data  || [];
            setFetchedData(data);
            setFilteredData(data);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setIsLoading(false);
        }
    };

     const handleRowClick = (Doc_no) => {
        const selectedRecord = filteredData.find(record => record.Doc_no === Doc_no);
        navigate("/funds", { state: { selectedRecord, permissionsData } });
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        const searchLower = searchTerm.toLowerCase();
        const filtered = fetchedData.filter(row =>
            Object.values(row).some(value => String(value || '').toLowerCase().includes(searchLower))
        );
        setFilteredData(filtered);
        setCurrentPage(1);
        setSelectedRows([]);
    }, [searchTerm, fetchedData]);

    const paginatedPosts = filteredData.slice((currentPage - 1) * perPage, currentPage * perPage);
    const isAllSelected = paginatedPosts.length > 0 && selectedRows.length === paginatedPosts.length;

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const selected = paginatedPosts.map(row => row.Doc_no);
            setSelectedRows(selected);
        } else {
            setSelectedRows([]);
        }
    };

    const handleCheckboxChange = (Doc_no) => {
        setSelectedRows(prev =>
            prev.includes(Doc_no) ? prev.filter(x => x !== Doc_no) : [...prev, Doc_no]
        );
    };

    const selectedTotal = fetchedData
        .filter(row => selectedRows.includes(row.Doc_no))
        .reduce((acc, row) => acc + parseFloat(row.Actual_payment_amount || 0), 0);

    const amountInWords = ConvertNumberToWord(selectedTotal.toFixed(2));
    const pageCount = Math.ceil(filteredData.length / perPage);

    if (!canView) return <PageNotFound />;

    return (
        <div style={{ padding: '5px' }}>
            <Grid container spacing={1} alignItems="center">
                <Grid item>
                    <CreateNewButton onClick={() => navigate("/funds")} permissionsData={permissionsData} disabled={permissionsData.canSave === "N"} />
                </Grid>
                 <Grid item>
                                    <BackButton onClick={() => navigate("/DashBoard")} />
                                </Grid>
                <Grid item>
                    <PerPageSelect value={perPage} onChange={e => setPerPage(Number(e.target.value))} />
                </Grid>
               <Grid item xs={2} ml={50} >
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
                       Fund Management
                    </Typography>
                </Grid>
                <Grid item xs={4}>
                    <SearchBar value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </Grid>
            </Grid>

            {isLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" height="600px">
                    <CircularSpinner />
                </Box>
            ) : (
                <Paper elevation={3} sx={{ mt: 2 }}>
                    <TableContainer sx={{ maxHeight: 600 }}>
                        <Table stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell padding="checkbox">
                                        <input type="checkbox" checked={isAllSelected} onChange={handleSelectAll} />
                                    </TableCell>
                                    {[
                                        "Doc No", "Doc Date", "Due Date","Payment Date", "Actual_payment_amount","FundingFromName",
                                        "bill_to_name","purches_bill_to_name","Bill_rate","Quintal","Riceipt_amount",
                                        "Purchase_rate","Interest_rate","Interest_amount","TDS_rate","TDS_amount","GST_rate_code",
                                        "GST_amount","Total_amount"
        
                                    ].map(label => (
                                        <TableCell key={label} style={styles.tableHeaderCell}>{label}</TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {paginatedPosts.map((row) => (
                                    <TableRow key={row.doc_no} 
                                            onDoubleClick={() => handleRowClick(row.Doc_no)}
                                            sx={{
                                                cursor: "pointer",
                                                transition: "background-color 0.3s ease, box-shadow 0.2s ease",
                                                '&:hover': {
                                                    backgroundColor: '#f3f388',
                                                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                                                },
                                            }}>
                                        <TableCell padding="checkbox">
                                            <input
                                                type="checkbox"
                                                checked={selectedRows.includes(row.Doc_no)}
                                                onChange={() => handleCheckboxChange(row.Doc_no)}
                                            />
                                        </TableCell>
                                        <TableCell>{row.Doc_no}</TableCell>
                                        <TableCell>{row.Doc_date}</TableCell> 
                                        <TableCell>{row.Due_days}</TableCell> 
                                         <TableCell>{row.Riceipt_date}</TableCell>
                                       
                                           <TableCell>{formatReadableAmount(row. Actual_payment_amount)}</TableCell>
                                            <TableCell>{row.FundingFromName}</TableCell>
                                            <TableCell>{row.billToName}</TableCell>
                                            <TableCell>{row.purchaseBillTo}</TableCell>
                                              <TableCell>{row.Bill_rate}</TableCell>

                                              <TableCell>{row.Quintal}</TableCell>
                                                <TableCell>{formatReadableAmount(row.Riceipt_amount)}</TableCell>
                                        <TableCell>{row.Purchase_rate}</TableCell>
                                       
                                        <TableCell>{row.Interest_rate}</TableCell>
  
                                        <TableCell>{row.Interest_amount}</TableCell>
                                        <TableCell>{row.TDS_rate}</TableCell>
                                        <TableCell>{row.TDS_amount}</TableCell>
                                        <TableCell>{row.GST_rate_code}</TableCell>
                                        <TableCell>{row.GST_amount}</TableCell>
                                        <TableCell>{row.Total_amount}</TableCell>   
                                        
                                      
                                        <TableCell>{row.Remark}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    {selectedRows.length > 0 && (
                        <Box mt={2} p={2} bgcolor="#f0f0f0" borderTop="1px solid #ccc">
                            <Typography variant="subtitle1">
                                ✅ Total Pay Amount: ₹{formatReadableAmount(selectedTotal)} / {amountInWords}
                            </Typography>
                        </Box>
                    )}
                </Paper>
            )}

            <Grid item xs={12} mt={2} mb={4}>
                <Pagination
                    pageCount={pageCount}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                />
            </Grid>
        </div>
    );
};

export default FundManagementUtility;

