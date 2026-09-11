import React, { useEffect, useState, useRef } from "react";
import {
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    CircularProgress,
    TextField,
    Button,
} from "@mui/material";
import axios from "axios";
import Swal from "sweetalert2";
import PrintButton from "../../../Common/Buttons/PrintPDF";

const API_URL = process.env.REACT_APP_API;

const PendingSBList = () => {
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [changeDate, setChangeDate] = useState("");
    const [totalQuantal, setTotalQuantal] = useState(0);
    const printRef = useRef();

    const companyCode = sessionStorage.getItem("Company_Code");
    const yearCode = sessionStorage.getItem("Year_Code");

    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/pending_SBList`, {
                params: {
                    Company_Code: companyCode,
                    Year_Code: yearCode,
                },
            });
            const list = response.data.all_data || [];
            setData(list);
            setFilteredData(list);
        } catch (error) {
            console.error("Error fetching pending SB list:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const term = searchTerm.toLowerCase();
        const filtered = data.filter((item) =>
            Object.values(item).some((val) =>
                String(val).toLowerCase().includes(term)
            )
        );
        setFilteredData(filtered);
    }, [searchTerm, data]);

    useEffect(() => {
        const total = filteredData.reduce((sum, row) => {
            const val = parseFloat(row.quantal);
            return sum + (isNaN(val) ? 0 : val);
        }, 0);
        setTotalQuantal(total);
    }, [filteredData]);

    const handleUpdateDates = async () => {
        if (!changeDate) return;

        const confirm = await Swal.fire({
            icon: "warning",
            title: "Update Document Dates?",
            text: `This will update doc_date across DO, Sale, Purchase & Ledger.`,
            showCancelButton: true,
            confirmButtonText: "Yes, Update",
            cancelButtonText: "Cancel",
        });

        if (!confirm.isConfirmed) return;

        try {
            const payload = {
                changedate: changeDate,
                Company_Code: companyCode,
                Year_Code: yearCode,
            };

            const res = await axios.post(`${API_URL}/update_pending_docdates`, payload);
            Swal.fire("Success", res.data.message || "Dates updated", "success");
            fetchData(); // Refresh table
        } catch (err) {
            Swal.fire("Error", "Failed to update dates", "error");
            console.error(err);
        }
    };

    const handleRowClick = (doc_no) => {
        const url = `${window.location.origin}/delivery-order`;
        const params = new URLSearchParams({ navigatedRecord: doc_no });
        window.open(`${url}?${params.toString()}`, "_blank");
    };

    const handlePrint = () => {
        const printWindow = window.open("", "_blank", "width=1000,height=800");
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Pending Sale Bills</title>
                        <style>
                            body { font-family: Arial; padding: 20px; }
                            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
                            th { background-color: #f5f5f5; }
                        </style>
                    </head>
                    <body>
                        <h2>Pending Sale Bills</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th>DO No</th>
                                    <th>Doc Date</th>
                                    <th>DO Date</th>
                                    <th>Quintal</th>
                                    <th>Sale Bill Name</th>
                                     <th>Grade</th>
                                    <th>Mill Name</th>
                                    <th>Truck No</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${filteredData.map(row => `
                                    <tr>
                                        <td>${row.DO_NO}</td>
                                        <td>${row.doc_Date}</td>
                                        <td>${row.Do_Date}</td>
                                        <td>${row.quantal}</td>
                                        <td>${row.salebillname}</td>
                                            <td>${row.Grade}</td>
                                        <td>${row.millshortname}</td>
                                        <td>${row.truck_no}</td>
                                    </tr>
                                `).join("")}
                            </tbody>
                        </table>
                        <h4>Total Quintal: ${totalQuantal.toFixed(2)}</h4>
                        <script>
                            window.onload = function () {
                                window.print();
                                window.onafterprint = function () {
                                    window.close();
                                };
                            };
                        </script>
                    </body>
                </html>
            `);
            printWindow.document.close();
        }
    };

    const columns = [
        { key: "DO_NO", label: "DO No" },
        { key: "doc_Date", label: "Doc Date" },
        { key: "Do_Date", label: "DO Date" },
        { key: "quantal", label: "Quintal" },
        { key: "salebillname", label: "Sale Bill Name" },
        { key: "Grade", label: "Grade" },
        { key: "millshortname", label: "Mill Name" },
        { key: "truck_no", label: "Truck No" },
    ];

    return (
        <Box mt={-10}>
            <Typography variant="h6"
                component="h1"
                gutterBottom
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
                Pending Sale Bills
            </Typography>

            <Box display="flex" gap={2} alignItems="center" mb={2}>
                <TextField
                    label="Change Date"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    value={changeDate}
                    inputProps={{ min: today }}
                    onChange={(e) => setChangeDate(e.target.value)}
                    size="small"
                />

                <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleUpdateDates}
                    disabled={!changeDate}
                >
                    Update
                </Button>

                <Box display="flex" justifyContent="flex-end" width="100%">
                    <PrintButton disabledFeild={""} fetchData={handlePrint} />
                </Box>

            </Box>

            <Box mb={2}>
                <TextField
                    label="Search"
                    variant="outlined"
                    size="small"
                    sx={{ width: "50%" }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </Box>

            {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" height="300px">
                    <CircularProgress />
                </Box>
            ) : (
                <>
                    <TableContainer component={Paper} sx={{ maxHeight: "70vh", overflowY: "auto" }}>
                        <Table stickyHeader>
                            <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                                <TableRow>
                                    {columns.map((col) => (
                                        <TableCell key={col.key} sx={{ fontWeight: "bold" }}>
                                            {col.label}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredData.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={columns.length} align="center">
                                            No records found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredData.map((row, idx) => (
                                        <TableRow
                                            key={idx}
                                            sx={{
                                                cursor: "pointer",
                                                "&:hover": { backgroundColor: "#f0f8ff" },
                                            }}
                                        >
                                            {columns.map((col) => (
                                                <TableCell
                                                    key={col.key}
                                                    onClick={col.key === "DO_NO" ? () => handleRowClick(row.DO_NO) : undefined}
                                                    sx={{
                                                        color: col.key === "DO_NO" ? "#1976d2" : "inherit",
                                                        textDecoration: col.key === "DO_NO" ? "underline" : "none",
                                                        fontWeight: col.key === "DO_NO" ? "bold" : "normal",
                                                    }}
                                                >
                                                    {row[col.key]}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <Box mt={2} textAlign="right" fontWeight="bold">
                        Total Quintal: {totalQuantal.toFixed(2)}
                    </Box>
                </>
            )}
        </Box>
    );
};

export default PendingSBList;

