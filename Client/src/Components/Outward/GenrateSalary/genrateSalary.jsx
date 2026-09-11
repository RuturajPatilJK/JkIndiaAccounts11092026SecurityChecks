import React, { useState } from "react";
import * as XLSX from "xlsx";
import {
    Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, Typography, Button, Box
} from "@mui/material";
import "./genrateSalary.css";
import AccountMasterHelp from "../../../Helper/AccountMasterHelp";
import CircularSpinner from "../../../Common/Spinners/CircularSpinner";
import Swal from 'sweetalert2';
import UpdateIcon from '@mui/icons-material/Update';
import SendIcon from '@mui/icons-material/Send';
import BackButton from "../../../Common/Buttons/BackButton";
import { useNavigate } from "react-router-dom";

const api_key = process.env.REACT_APP_API;

const wantedCols = ["A", "B", "C", "AL", "AM", "AN", "AO", "AP", "AS", "AU"];

const excelColToIndex = (col) => {
    let index = 0;
    for (let i = 0; i < col.length; i++) {
        index *= 26;
        index += col.charCodeAt(i) - 64;
    }
    return index - 1;
};

const wantedIndices = wantedCols.map(excelColToIndex);

const ExcelUploadTable = () => {
    const [columns, setColumns] = useState([]);
    const [rows, setRows] = useState([]);
    const [totalRow, setTotalRow] = useState([]);
    const [loading, setLoading] = useState(false);
    const [tenderFromManuallySet, setTenderFromManuallySet] = useState(false);
    const [tenderFrom, setTenderFrom] = useState("");
    const [tenderFrName, setTenderFrName] = useState("");
    const [formData, setFormData] = useState({});
    const [narration, setNarration] = useState("");
    const navigate = useNavigate();

    const Company_Code = sessionStorage.getItem("Company_Code");
    const Year_Code = sessionStorage.getItem("Year_Code");
    const username = sessionStorage.getItem("username");

    const fetchAccountDetails = async (acName) => {
        try {
            setLoading(true);
            const response = await fetch(`${api_key}/search-accounts?acName=${encodeURIComponent(acName)}`);
            const json = await response.json();
            return json.results?.[0] || {};
        } catch (err) {
            console.error("API fetch error for name:", acName, err);
            return {};
        } finally {
            setLoading(false);
        }
    };

    const handleTender_From = (code, accoid, name, rowIndex) => {
        setTenderFromManuallySet(true);
        setTenderFrName(name);
        setTenderFrom(code);
        setFormData((prevFormData) => ({
            ...prevFormData,
            Tender_From: code,
            tf: accoid,
        }));

        const updatedRows = [...rows];
        updatedRows[rowIndex] = [
            ...updatedRows[rowIndex].slice(0, columns.length - 3),
            name,
            code,
            accoid,
        ];
        setRows(updatedRows);
    };

    const handleFileUpload = async (e) => {
        setLoading(true);
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            const data = new Uint8Array(evt.target.result);
            const workbook = XLSX.read(data, { type: "array" });

            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const rawData = XLSX.utils.sheet_to_json(sheet, {
                header: 1,
                defval: "",
            });

            if (rawData.length > 3) {

                const narrationRow = rawData[1];
                const narrationText = narrationRow[0] || "";
                setNarration(narrationText);

                const headerRow = rawData[2];
                const dataRows = rawData.slice(3);

                const totalIndex = dataRows.findIndex((row) =>
                    row[0].toString().toLowerCase().includes("total no of employees")
                );

                const filteredDataRows =
                    totalIndex !== -1 ? dataRows.slice(0, totalIndex + 1) : dataRows;

                const filteredHeaders = wantedIndices.map((i) => headerRow[i] || "");
                const filteredRows = filteredDataRows.map((row) =>
                    wantedIndices.map((i) => (row && row[i] !== undefined ? row[i] : ""))
                );

                const lastRow = filteredRows[filteredRows.length - 1];
                const contentRows = filteredRows.slice(0, -1);

                const rowsWithAccount = await Promise.all(
                    contentRows
                        .filter(row => row.some(cell => cell !== ""))
                        .map(async (row) => {
                            const nameToSearch = row[2];
                            const account = await fetchAccountDetails(nameToSearch);
                            return [
                                ...row,
                                account.Ac_Name_E || "",
                                account.ac_code || "",
                                account.ac || "",
                            ];
                        })
                );

                setColumns([...filteredHeaders, "A/C Name", "A/C Code", "ac"]);
                setRows(rowsWithAccount);
                setTotalRow([...lastRow, "", "", ""]);
                setLoading(false);
            }
        };

        reader.readAsArrayBuffer(file);
    };

    const handleUpdateSalaryAccounts = async () => {
        const payload = rows
            .filter(row => row[columns.length - 3] && row[columns.length - 2] && row[columns.length - 1])
            .map(row => ({
                ac_name: row[columns.length - 11],
                ac_code: parseInt(row[columns.length - 2], 10),
                ac: parseInt(row[columns.length - 1], 10)
            }));

        if (payload.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'No Data',
                text: 'No valid data to update.',
            });

            return;
        }

        try {
            setLoading(true);
            const res = await fetch(`${api_key}/replace-salary-accounts`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const json = await res.json();

            if (res.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'Salary accounts updated successfully.',
                });

            } else {
                console.error(json);
                alert(`Error updating accounts: ${json.error || "Unknown error"}`);
            }
        } catch (err) {
            console.error("Update failed:", err);
            alert("Failed to update salary accounts.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitSalaryPurchase = async () => {
        try {
            setLoading(true);

            const payload = {
                company_code: Company_Code,
                year_code: Year_Code,
                doc_date: new Date().toISOString().split("T")[0],
                narration: narration,
                username: username,
                rows: rows.map(row => ({
                    employee_name: row[2],
                    ac_name: row[columns.length - 3],
                    ac_code: row[columns.length - 2],
                    ac: row[columns.length - 1],
                    bill_amount: row[3],
                    tds_amount: row[8],
                    net_pay: row[9],
                    PF: row[5],
                    ESIC: row[6],
                    Professional_Tax: row[7]
                }))
            };

            const response = await fetch(`${api_key}/submit-other-purchase-from-salary`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (response.ok) {
                // alert(`Salary purchase processed successfully. ${result.message}`);
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: `Salary Posting successfully.!`,
                });

            } else {
                console.error(result);
                alert(`Error processing salary purchase: ${result.error || "Unknown error"}`);
            }
        } catch (err) {
            console.error("Error submitting salary purchases:", err);
            alert("Failed to submit salary purchases. Check console for details.");
        } finally {
            setLoading(false);
        }
    };

    const handleBackClick = () => {
        navigate("/dashboard");
    }

    return (
        <div style={{ marginTop: "-95px" }}>
            <Typography component="h1"
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
                        animation: 'underlineGrow 0.5s ease-out forwards',
                    },
                    '@keyframes underlineGrow': {
                        '0%': { width: '0' },
                        '100%': { width: '80px' },
                    }
                }}>
               Salary Posting
            </Typography>

            <div className="SugarTenderPurchase-row">
                <BackButton onClick={handleBackClick} />
                <button className="container-btn-file">
                    <svg
                        fill="#fff"
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 50 50"
                    >
                        <path d="M28.8125 .03125L.8125 5.34375C.339844 
                            5.433594 0 5.863281 0 6.34375L0 43.65625C0 
                            44.136719 .339844 44.566406 .8125 44.65625L28.8125 
                            49.96875C28.875 49.980469 28.9375 50 29 50C29.230469 
                            50 29.445313 49.929688 29.625 49.78125C29.855469 49.589844 
                            30 49.296875 30 49L30 1C30 .703125 29.855469 .410156 29.625 
                            .21875C29.394531 .0273438 29.105469 -.0234375 28.8125 .03125ZM32 
                            6L32 13L34 13L34 15L32 15L32 20L34 20L34 22L32 22L32 27L34 27L34 
                            29L32 29L32 35L34 35L34 37L32 37L32 44L47 44C48.101563 44 49 
                            43.101563 49 42L49 8C49 6.898438 48.101563 6 47 6ZM36 13L44 
                            13L44 15L36 15ZM6.6875 15.6875L11.8125 15.6875L14.5 21.28125C14.710938 
                            21.722656 14.898438 22.265625 15.0625 22.875L15.09375 22.875C15.199219 
                            22.511719 15.402344 21.941406 15.6875 21.21875L18.65625 15.6875L23.34375 
                            15.6875L17.75 24.9375L23.5 34.375L18.53125 34.375L15.28125 
                            28.28125C15.160156 28.054688 15.035156 27.636719 14.90625 
                            27.03125L14.875 27.03125C14.8125 27.316406 14.664063 27.761719 
                            14.4375 28.34375L11.1875 34.375L6.1875 34.375L12.15625 25.03125ZM36 
                            20L44 20L44 22L36 22ZM36 27L44 27L44 29L36 29ZM36 35L44 35L44 37L36 37Z"
                        />
                    </svg>
                    Upload File
                    <input type="file" accept=".xlsx" onChange={handleFileUpload} />
                </button>

                <Box sx={{ textAlign: 'center', display: 'flex', justifyContent: 'center', gap: 1 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleUpdateSalaryAccounts}
                        disabled={loading}
                        startIcon={<UpdateIcon />}
                        sx={{
                            px: 3,
                            py: 1,
                            fontWeight: 'bold',
                            textTransform: 'none',
                            '&:hover': {
                                backgroundColor: '#2e7d32',
                            }
                        }}
                    >
                        Update Accounts
                    </Button>

                    <Button
                        variant="contained"
                        color="secondary"
                        onClick={handleSubmitSalaryPurchase}
                        disabled={loading}
                        startIcon={<SendIcon />}
                        sx={{
                            px: 3,
                            py: 1,
                            fontWeight: 'bold',
                            textTransform: 'none',
                            '&:hover': {
                                backgroundColor: '#ad1457',
                            }
                        }}
                    >
                        Post Salary
                    </Button>
                </Box>
            </div>

            {loading ? (
                <div style={{ textAlign: "center", marginTop: 50 }}>
                    <CircularSpinner />
                </div>
            ) : (
                columns.length > 0 && (
                    <>
                        <TableContainer component={Paper} sx={{ marginTop: 4 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        {columns.map((col, idx) => (
                                            <TableCell
                                                key={idx}
                                                sx={{
                                                    fontWeight: "bold",
                                                    background: "#3f51b5",
                                                    color: "#fff",
                                                    textAlign: col.toLowerCase().includes("name") ? "left" : "right",
                                                }}
                                            >
                                                {col}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {rows.map((row, rowIndex) => (
                                        <TableRow key={rowIndex}>
                                            {row.map((cell, cellIndex) => (
                                                <TableCell
                                                    key={cellIndex}
                                                    sx={{
                                                        textAlign: columns[cellIndex]?.toLowerCase().includes("name") ? "left" : "right",
                                                        fontWeight: columns[cellIndex]?.toLowerCase().includes("name") ? 500 : "normal",
                                                    }}
                                                >
                                                    {cell}
                                                </TableCell>
                                            ))}
                                            {row[columns.length - 3] === "" &&
                                                row[columns.length - 2] === "" &&
                                                row[columns.length - 1] === "" && (
                                                    <TableCell colSpan={columns.length} sx={{ textAlign: "center" }}>
                                                        <AccountMasterHelp
                                                            name="Mill_Code"
                                                            onAcCodeClick={(code, accoid, name) =>
                                                                handleTender_From(code, accoid, name, rowIndex)
                                                            }
                                                            CategoryName={""}
                                                            CategoryCode={""}
                                                            Ac_type={["P"]}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                )}
                                        </TableRow>
                                    ))}

                                    <TableRow sx={{ backgroundColor: "#f0f0f0", fontWeight: "bold" }}>
                                        {totalRow.map((cell, idx) => (
                                            <TableCell
                                                key={idx}
                                                sx={{
                                                    textAlign: columns[idx]?.toLowerCase().includes("name") ? "left" : "right",
                                                    fontWeight: "bold",
                                                }}
                                            >
                                                {cell}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </>
                )
            )}
        </div>
    );
};

export default ExcelUploadTable;