import React, { useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import 'bootstrap/dist/css/bootstrap.min.css';
import { formatReadableAmount } from "../../Common/FormatFunctions/FormatAmount";
import { CircularProgress } from '@mui/material';
import Swal from 'sweetalert2';

const API_URL = process.env.REACT_APP_API;

const YearlyGSTR1Summary = ({ fromDate, toDate }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const getTranTypeName = (type) => {
        const upperType = type?.toUpperCase();
        if (upperType === 'CN') return 'Credit Note';
        if (upperType === 'DN') return 'Debit Note';
        return type;
    };

    const fetchYearlyGSTR1Summary = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await axios.get(`${API_URL}/GetMonthlySummaryByTranType`, {
                params: {
                    from_date: fromDate,
                    to_date: toDate
                },
            });

            if (response.data && response.data.length > 0) {
                openInNewWindow(response.data);
            } else {
                Swal.fire({
                    icon: 'info',
                    title: 'No Data Found',
                    text: 'No summary records found for the selected criteria.',
                });
            }
        } catch (err) {
            setError('Failed to fetch data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const calculateTotals = (data) => {
        const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
        let totals = {};
        months.forEach(m => totals[m] = 0);

        data.forEach(row => {
            months.forEach(month => {
                totals[month] += parseFloat(row[month] || 0);
            });
        });
        return totals;
    };

    const openInNewWindow = (data) => {
        const newWindow = window.open('', '_blank');
        if (!newWindow) return;

        const columns = [
            'TRAN_TYPE', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
            'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'
        ];

        const totals = calculateTotals(data);

        newWindow.document.write(`
            <html>
                <head>
                    <title>Yearly GSTR1 Summary</title>
                    <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 20px; text-align: center; background-color: #f4f7f6; }
                        h2 { color: #2c3e50; }
                        .table-container { max-height: 500px; overflow-y: auto; margin: 20px auto; width: 95%; border: 1px solid #ddd; background: white; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { border: 1px solid #ddd; padding: 10px; font-size: 13px; }
                        th { 
                            background-color: #dee2e6; 
                            position: sticky; 
                            top: 0; 
                            z-index: 10; 
                            color: black; 
                            cursor: pointer;
                            user-select: none;
                        }
                        th:hover { background-color: #ced4da; }
                        th::after { content: ' ↕'; font-size: 0.8em; color: #999; }
                        
                        .export-btn { padding: 10px 20px; background-color: #27ae60; color: white; border: none; cursor: pointer; margin-bottom: 20px; border-radius: 4px; font-weight: bold; }
                        .total-row { background-color: #feca57 !important; font-weight: bold; position: sticky; bottom: 0; }
                        .type-cell { text-align: left; background-color: #f9f9f9; font-weight: bold; }
                        .amount-cell { text-align: right; font-family: monospace; }
                    </style>
                </head>
                <body>
                    <h2>Yearly GSTR1 Summary</h2>
                    <p>Period: <b>${fromDate}</b> to <b>${toDate}</b></p>
                    <button class="export-btn" onclick="exportToExcel()">Export to Excel</button>
                    <div class="table-container">
                        <table id="summaryTable">
                            <thead>
                                <tr>
                                    ${columns.map((col, i) => `<th onclick="sortTable(${i})">${col === 'TRAN_TYPE' ? 'Transaction Type' : col}</th>`).join('')}
                                </tr>
                            </thead>
                            <tbody>
                                ${data.map(row => `
                                    <tr>
                                        <td class="type-cell">${getTranTypeName(row.TRAN_TYPE)}</td>
                                        ${columns.slice(1).map(month => {
            const val = parseFloat(row[month] || 0);
            return `<td class="amount-cell" data-val="${val}">${formatReadableAmount(val.toFixed(2))}</td>`
        }).join('')}
                                    </tr>
                                `).join('')}
                            </tbody>
                            <tfoot>
                                <tr class="total-row">
                                    <td>TOTALS</td>
                                    ${columns.slice(1).map(month => `<td class="amount-cell">${formatReadableAmount(totals[month].toFixed(2))}</td>`).join('')}
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    <script>
                        let sortOrders = {};

                        function sortTable(n) {
                            const table = document.getElementById("summaryTable");
                            const tbody = table.tBodies[0];
                            const rows = Array.from(tbody.rows);
                            
                            sortOrders[n] = !sortOrders[n];
                            const isAsc = sortOrders[n];

                            rows.sort((a, b) => {
                                let valA = a.cells[n].getAttribute('data-val') !== null ? 
                                           parseFloat(a.cells[n].getAttribute('data-val')) : 
                                           a.cells[n].innerText.trim().toLowerCase();
                                
                                let valB = b.cells[n].getAttribute('data-val') !== null ? 
                                           parseFloat(b.cells[n].getAttribute('data-val')) : 
                                           b.cells[n].innerText.trim().toLowerCase();

                                if (valA < valB) return isAsc ? -1 : 1;
                                if (valA > valB) return isAsc ? 1 : -1;
                                return 0;
                            });

                            rows.forEach(row => tbody.appendChild(row));
                        }

                        function exportToExcel() {
                            const table = document.getElementById("summaryTable");
                            const rows = Array.from(table.rows);
                            
                            // Get headers
                            const headers = Array.from(rows[0].cells).map(cell => cell.textContent.replace(' ↕', '').trim());

                            // Map the data based on current table view (Sorted)
                            const exportData = [];
                            
                            // 1. Process Body
                            const bodyRows = Array.from(table.tBodies[0].rows);
                            bodyRows.forEach(row => {
                                const rowData = {};
                                Array.from(row.cells).forEach((cell, index) => {
                                    const val = cell.getAttribute('data-val');
                                    rowData[headers[index]] = val !== null ? parseFloat(val) : cell.textContent.trim();
                                });
                                exportData.push(rowData);
                            });

                            // 2. Process Footer (Totals)
                            const footerRow = table.tFoot.rows[0];
                            const footerData = {};
                            footerData[headers[0]] = "TOTALS";
                            for(let i = 1; i < headers.length; i++) {
                                // Clean the amount string and parse to float
                                const cleanVal = footerRow.cells[i].innerText.replace(/,/g, '');
                                footerData[headers[i]] = parseFloat(cleanVal);
                            }
                            exportData.push(footerData);

                            const ws = XLSX.utils.json_to_sheet(exportData);
                            const wb = XLSX.utils.book_new();
                            XLSX.utils.book_append_sheet(wb, ws, 'GSTR1 Summary');
                            XLSX.writeFile(wb, 'Yearly_GSTR1_Summary.xlsx');
                        }
                    </script>
                </body>
            </html>
        `);
        newWindow.document.close();
    };

    return (
        <div className="d-flex flex-column align-items-center" style={{ marginTop: '5px', width: '100%' }}>
            {/* <button
                className="btn btn-primary shadow-sm"
                onClick={fetchYearlyGSTR1Summary}
                disabled={loading}
                style={{ width: '100%', maxWidth: '300px', height: '60px', fontWeight: 'bold' }}
            >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Yearly GSTR1 Summary'}
            </button> */}


            <button
                style={{
                    background: '#007bff',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 40px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(26,35,126,0.2)'
                }}
                onClick={fetchYearlyGSTR1Summary}
                disabled={loading}
            >
                {loading ? <CircularProgress size={24} color="inherit" /> : "Yearly GSTR1 Summary"}
            </button>


            {error && <div className="alert alert-danger mt-2">{error}</div>}
        </div>
    );
};

export default YearlyGSTR1Summary;