import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../Reports/TrialBalance/TrialBalance.css';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { useNavigate, useLocation } from 'react-router-dom';
import { RingLoader } from 'react-spinners';
import { Typography, Grid } from '@mui/material';
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";
import { FormaDateBalanceSheet } from "../../../Common/FormatFunctions/FormatDate";
import BackButton from "../../../Common/Buttons/BackButton";
import PrintButton from '../../../Common/Buttons/PrintPDF';

const apikey = process.env.REACT_APP_API;

const TrialBalanceReport = () => {
    //GET values from session Storage
    const companyCode = sessionStorage.getItem("Company_Code");
    const Year_Code = sessionStorage.getItem("Year_Code");
    const Company_Name = sessionStorage.getItem("Company_Name");
    const Company_GSTNO = sessionStorage.getItem('Company_GSTNO');

    const navigate = useNavigate();
    const location = useLocation();
    
    const searchParams = new URLSearchParams(location.search);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const groupType = searchParams.get('groupType');

    const [reportData, setReportData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Filter and sort states
    const [filterType, setFilterType] = useState('all');
    const [sortConfig, setSortConfig] = useState({
        key: null,
        direction: 'none', 
    });

    const API_URL = `${apikey}/TrialBalance-Report`;

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = String(date.getFullYear());
        return `${day}/${month}/${year}`;
    };

    useEffect(() => {
        const fetchReportData = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await axios.get(API_URL, {
                    params: {
                        from_date: fromDate,
                        to_date: toDate,
                        Company_Code: companyCode,
                        groupType: groupType,
                        Year_Code: Year_Code
                    },
                });
                setReportData(response.data);
                setFilteredData(response.data);
            } catch (error) {
                console.error('Error fetching report:', error);
                setError('Error fetching report');
            } finally {
                setLoading(false);
            }
        };

        fetchReportData();
    }, [API_URL]);

    const applyFilter = (data, filter) => {
        if (filter === 'all') {
            return data;
        } else if (filter === 'debit') {
            return data.filter(item => item.Balance > 0);
        } else if (filter === 'credit') {
            return data.filter(item => item.Balance < 0);
        }
        return data;
    };

    const sortData = (data, sortKey, direction) => {
        if (!sortKey || direction === 'none') return data;

        return [...data].sort((a, b) => {
            let aValue, bValue;

            if (sortKey === 'debit') {
                aValue = a.Balance > 0 ? Math.abs(a.Balance) : 0;
                bValue = b.Balance > 0 ? Math.abs(b.Balance) : 0;
            } else if (sortKey === 'credit') {
                aValue = a.Balance < 0 ? Math.abs(a.Balance) : 0;
                bValue = b.Balance < 0 ? Math.abs(b.Balance) : 0;
            } else if (sortKey === 'accountName') {
                aValue = a.Ac_Name_E?.toLowerCase() || '';
                bValue = b.Ac_Name_E?.toLowerCase() || '';
            }

            if (aValue < bValue) {
                return direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    };

    const handleFilterChange = (type) => {
        setFilterType(type);
        const filtered = applyFilter(reportData, type);
        const sorted = sortData(filtered, sortConfig.key, sortConfig.direction);
        setFilteredData(sorted);
    };

    const handleSort = (key) => {
        let direction = 'asc';
        
        if (sortConfig.key === key) {
            if (sortConfig.direction === 'asc') {
                direction = 'desc';
            } else if (sortConfig.direction === 'desc') {
                direction = 'none';
            }
        }
        
        setSortConfig({ key, direction });
        
        const filtered = applyFilter(reportData, filterType);
        const sorted = sortData(filtered, direction === 'none' ? null : key, direction);
        setFilteredData(sorted);
    };

    // Get sort indicator
    const getSortIndicator = (key) => {
        if (sortConfig.key === key) {
            return sortConfig.direction === 'asc' ? ' ▲' : 
                   sortConfig.direction === 'desc' ? ' ▼' : '';
        }
        return '';
    };

    const handleExportToExcel = () => {
        const table = document.getElementById("reportTable");
        if (!table) {
            alert("Table not found!");
            return;
        }
        const wb = XLSX.utils.book_new();
        let headers = [
            [`${Company_Name}`],
            [
                `From Date: ${formatDate(fromDate) || ""} To Date: ${formatDate(toDate) || ""}`,
            ],
            [],
        ];
        const ws = XLSX.utils.table_to_sheet(table, { origin: 4 });
        XLSX.utils.sheet_add_aoa(ws, headers, { origin: 0 });
        ws["!cols"] = [
            { wch: 10 },
            { wch: 20 },
            { wch: 15 },
            { wch: 15 },
            { wch: 15 },
        ];
        const range = XLSX.utils.decode_range(ws["!ref"]);
        for (let R = range.s.r + 4; R <= range.e.r; R++) {
            for (let C = 3; C <= 4; C++) {
                const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
                if (ws[cellRef]) {
                    ws[cellRef].s = ws[cellRef].s || {};
                    ws[cellRef].s.alignment = { horizontal: "right" };
                }
            }
        }
        XLSX.utils.book_append_sheet(wb, ws, "Trial Balance");
        XLSX.writeFile(wb, `Trial Balance.xlsx`);
    };

    const handlePrint = () => {
        const headerContent = `
            <div style="text-align: center; font-size: 24px; font-weight: bold;">${Company_Name}</div>
            <div style="text-align: center; font-size: 16px; text-decoration: underline; font-weight: 550;">GSTN : ${Company_GSTNO}</div>
            <div style="text-align: center; font-size: 20px; font-weight: bold;">Trial Balance</div>
            <div style="text-align: center; font-size: 16px;">${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}</div>
            <br />
        `;
        const printContent = document.getElementById('reportTable').outerHTML;
        const win = window.open('', '', 'height=700,width=900');
        win.document.write('<html><head><title>Print Report</title>');
        win.document.write('</head><body>');
        win.document.write(headerContent);
        win.document.write(printContent);
        win.document.write('</body></html>');
        win.document.close();
        win.print();
    };

    const handleRowClick = (acCode) => {
        setLoading(true);
        setTimeout(() => {
            const url = `/getAllledger-report?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&acCode=${encodeURIComponent(acCode)}`;
            window.open(url, '_blank', 'toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=800,height=600');
            setLoading(false);
        }, 500);
    };

    const groupReportData = (data) => {
        const groupedData = {};
        data.forEach((item) => {
            const key = `${item.Group_Code}-${item.group_Type} - ${item.group_Name_E}`;
            if (!groupedData[key]) {
                groupedData[key] = {
                    items: [],
                    totalQty: 0,
                    groupdebitamt: 0,
                    groupcreditamt: 0,
                    netdiff: 0,
                };
            }
            groupedData[key].items.push(item);
            groupedData[key].groupdebitamt += parseFloat(item.Balance > 0 ? item.Balance : 0) || 0;
            groupedData[key].groupcreditamt += parseFloat(item.Balance < 0 ? item.Balance : 0) || 0;
        });
        return groupedData;
    };

    const groupedReportData = groupReportData(filteredData);

    const handleBack = () => {
        navigate('/trial-balance');
    };

    return (
        <div style={{ marginTop: "-80px" }}>
            <Typography variant="h6" style={{ textAlign: 'center', fontSize: "24px", fontWeight: "bold" }}>{Company_Name}</Typography>
            <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px", textDecoration: 'underline', fontWeight: "550" }}>GSTN : {Company_GSTNO}</Typography>
            <Typography variant="h6" style={{ textAlign: 'center', fontSize: "20px", fontWeight: "bold" }}>Trial Balance</Typography>
            <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px" }}>{FormaDateBalanceSheet(fromDate)} to {FormaDateBalanceSheet(toDate)}</Typography>


            <div className="d-flex justify-content-between align-items-center mb-3" style={{ gap: '10px' }}>
                <div className="d-flex justify-content-end align-items-center" style={{ gap: '10px' }}>
                    <PrintButton disabledFeild={""} fetchData={handlePrint} />
                    <button className="btn btn-success" onClick={handleExportToExcel}>
                        Export to Excel
                    </button>
                    <BackButton onClick={handleBack} />
                </div>
            </div>

            <div className="table-responsive">
                <table className="table table-striped table-bordered mt-4" id="reportTable" style={{ marginBottom: '60px' }}>
                    <thead className="table-light">
                        <tr>
                            <th style={{ color: 'black', fontWeight: "bold", backgroundColor: "#D0E9C6" }}>Account Code</th>
                            <th style={{ color: 'black', fontWeight: "bold", backgroundColor: "#D0E9C6" }}>Account Name</th>
                            <th style={{ color: 'black', fontWeight: "bold", backgroundColor: "#D0E9C6" }}>City</th>
                            <th style={{ textAlign: 'right', color: 'black', fontWeight: "bold", backgroundColor: "#D0E9C6", cursor: 'pointer' }}
                                onClick={() => handleSort('debit')}>
                                Debit{getSortIndicator('debit')}
                            </th>
                            <th style={{ textAlign: 'right', color: 'black', fontWeight: "bold", backgroundColor: "#D0E9C6", cursor: 'pointer' }}
                                onClick={() => handleSort('credit')}>
                                Credit{getSortIndicator('credit')}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(groupedReportData).map(([key, { items, groupdebitamt, groupcreditamt, netdiff }]) => {
                            const [mc, millName, name] = key.split('-');
                            return (
                                <React.Fragment key={key}>
                                    <tr>
                                        <td colSpan={12} align='left' style={{ color: 'blue', fontWeight: "bold", backgroundColor: "#D0E9C6" }}>
                                            {mc} - {millName} -{name}
                                        </td>
                                    </tr>
                                    {items.map((item, index) => (
                                        <tr key={index}>
                                            <td onClick={() => handleRowClick(item.AC_CODE)} style={{ cursor: "pointer", verticalAlign: "top", backgroundColor: "#D0E9C6", fontStyle: "italic" }}>{item.AC_CODE}</td>
                                            <td align='left' style={{ verticalAlign: "top", backgroundColor: "#D0E9C6", fontStyle: "italic" }}>{item.Ac_Name_E}</td>
                                            <td align='left' style={{ verticalAlign: "top", backgroundColor: "#D0E9C6", fontStyle: "italic" }}>{item.CityName}</td>
                                            <td align='right' style={{ verticalAlign: "top", backgroundColor: "#D0E9C6", fontStyle: "italic" }}>{item.Balance > 0 ? formatReadableAmount(item.Balance) : 0}</td>
                                            <td align='right' style={{ verticalAlign: "top", backgroundColor: "#D0E9C6", fontStyle: "italic" }}>{item.Balance < 0 ? formatReadableAmount(Math.abs(item.Balance)) : 0}</td>
                                        </tr>
                                    ))}
                                    <tr>
                                        <td className="text-end fw-bold" colSpan={3} align='left' style={{ verticalAlign: "top", backgroundColor: "#D0E9C6" }}>Difference : {formatReadableAmount(Math.abs(groupdebitamt) - Math.abs(groupcreditamt))}</td>
                                        <td className="fw-bold" align='right' style={{ verticalAlign: "top", backgroundColor: "#D0E9C6" }}>{formatReadableAmount(Math.abs(groupdebitamt))}</td>
                                        <td className="fw-bold" align='right' style={{ verticalAlign: "top", backgroundColor: "#D0E9C6" }}>{formatReadableAmount(Math.abs(groupcreditamt))}</td>
                                    </tr>
                                </React.Fragment>
                            );
                        })}
                        <tr style={{ backgroundColor: 'red', color: 'blue', textAlign: 'left', fontSize: '15px' }}>
                            <td className="text-end fw-bold" colSpan={3} style={{ verticalAlign: "top", backgroundColor: "#D0E9C6" }} align='left'>
                                Net Difference : {formatReadableAmount(
                                    Object.values(groupedReportData).reduce((acc, { groupdebitamt }) => acc + Math.abs(groupdebitamt), 0) -
                                    Object.values(groupedReportData).reduce((acc, { groupcreditamt }) => acc + Math.abs(groupcreditamt), 0)
                                )}
                            </td>
                            <td className="fw-bold" style={{ verticalAlign: "top", backgroundColor: "#D0E9C6" }} align='right'>
                                {formatReadableAmount(
                                    Object.values(groupedReportData).reduce((acc, { groupdebitamt }) => acc + Math.abs(groupdebitamt), 0)
                                )}
                            </td>
                            <td className="fw-bold" style={{ verticalAlign: "top", backgroundColor: "#D0E9C6" }} align='right'>
                                {formatReadableAmount(
                                    Object.values(groupedReportData).reduce((acc, { groupcreditamt }) => acc + Math.abs(groupcreditamt), 0)
                                )}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        
            {loading && <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100%",
                }}
            >
                <RingLoader />
            </div>}
            {error && <div className="alert alert-danger">{error}</div>}
        </div>
    );
};

export default TrialBalanceReport;