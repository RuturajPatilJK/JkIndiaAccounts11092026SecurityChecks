import React, { useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import 'bootstrap/dist/css/bootstrap.min.css';
import { formatReadableAmount } from "../../Common/FormatFunctions/FormatAmount";
import { CircularProgress } from '@mui/material';
import Swal from 'sweetalert2';

const API_URL = process.env.REACT_APP_API;

const PartyWiseYearlySummary = ({ fromDate, toDate }) => {
    const [loading, setLoading] = useState(false);

    const fetchYearlySummary = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/PartyWiseYearly-Summary`, {
                params: { from_date: fromDate, to_date: toDate },
            });

            if (response.data && response.data.length > 0) {
                renderReport(response.data);
            } else {
                Swal.fire('No Data', 'No records found for this period.', 'info');
            }
        } catch (err) {
            console.error(err);
            Swal.fire('Error', 'Failed to fetch yearly summary', 'error');
        } finally {
            setLoading(false);
        }
    };

    const renderReport = (data) => {
        const newWindow = window.open('', '_blank');
        if (!newWindow) return;

        // Calculate Grand Totals for Footer
        const totalTaxable = data.reduce((acc, curr) => acc + parseFloat(curr.Taxable || 0), 0);
        const totalQuintal = data.reduce((acc, curr) => acc + parseFloat(curr.Quintal || 0), 0);
        const totalBillAmount = data.reduce((acc, curr) => acc + parseFloat(curr.Bill_Amount || 0), 0);

        newWindow.document.write(`
            <html>
                <head>
                    <title>Yearly Party Sale Summary</title>
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 20px; background-color: #f4f7f6; }
                        h2 { text-align: center; color: #2c3e50; margin-bottom: 5px; }
                        p.period { text-align: center; color: #7f8c8d; margin-bottom: 20px; }
                        
                        .controls { 
                            display: flex; justify-content: center; align-items: center; 
                            gap: 15px; margin-bottom: 15px; position: sticky; 
                            top: 0; background: #f4f7f6; padding: 10px; z-index: 100;
                        }

                        .search-box { padding: 10px; width: 350px; border-radius: 4px; border: 1px solid #bdc3c7; outline: none; }
                        
                        .table-container { 
                            max-height: 75vh; overflow-y: auto; 
                            border: 1px solid #dcdde1; background: white;
                        }

                        table { width: 100%; border-collapse: separate; border-spacing: 0; }
                        
                        th { 
                            background-color: #dee2e6; color: black; position: sticky; 
                            top: 0; z-index: 10; padding: 12px; text-align: left;
                            border-bottom: 2px solid #adadad; cursor: pointer; user-select: none;
                        }
                        
                        th:hover { background-color: #ced4da; }
                        .sort-icon::after { content: ' ↕'; font-size: 0.8em; color: #999; margin-left: 5px; }

                        td { padding: 10px 12px; border-bottom: 1px solid #eee; border-right: 1px solid #eee; }

                        .amount { 
                            text-align: right; font-family: 'Consolas', monospace; 
                            font-weight: 600; color: #2c3e50; font-size: 14px;
                        }

                        .total-row { 
                            background-color: #feca57 !important; position: sticky; 
                            bottom: 0; z-index: 10;
                        }
                        
                        .total-row td { 
                            font-weight: bold; border-top: 2px solid #222; color: #222;
                        }

                        .export-btn { 
                            background: #27ae60; color: white; padding: 10px 20px; 
                            border: none; cursor: pointer; border-radius: 4px; font-weight: 600;
                        }
                    </style>
                </head>
                <body>
                    <h2>Party-wise Yearly Summary</h2>
                    <p class="period">Period: <b>${fromDate}</b> to <b>${toDate}</b></p>
                    
                    <div class="controls">
                        <input type="text" id="srch" class="search-box" placeholder="Search Party or GST..." onkeyup="filter()">
                        <button class="export-btn" onclick="exportToExcel()">Download Excel</button>
                    </div>

                    <div class="table-container">
                        <table id="summaryTable">
                            <thead>
                                <tr>
                                    <th class="sort-icon" onclick="sortTable(0)">Account Name</th>
                                    <th class="sort-icon" onclick="sortTable(1)">GST No</th>
                                    <th class="sort-icon" style="text-align: right;" onclick="sortTable(2)">Total Taxable Amount</th>
                                    <th class="sort-icon" style="text-align: right;" onclick="sortTable(3)">Total Bill Amount</th>
                                    <th class="sort-icon" style="text-align: right;" onclick="sortTable(4)">Total Quintal</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.map(row => {
            const taxable = parseFloat(row.Taxable || 0);
            const billAmount = parseFloat(row.Bill_Amount || 0);
            const quintal = parseFloat(row.Quintal || 0);
            return `
                                        <tr>
                                            <td>${row.Account_Name || 'URP'}</td>
                                            <td>${row.gstno || 'URP'}</td>
                                            <td class="amount" data-val="${taxable}">${formatReadableAmount(taxable.toFixed(2))}</td>
                                            <td class="amount" data-val="${billAmount}">${formatReadableAmount(billAmount.toFixed(2))}</td>
                                            <td class="amount" data-val="${quintal}">${formatReadableAmount(quintal.toFixed(2))}</td>
                                        </tr>
                                    `;
        }).join('')}
                            </tbody>
                            <tfoot>
                                <tr class="total-row">
                                    <td colspan="2" style="text-align: center;">Grand Total</td>
                                    <td class="amount" id="footerTaxable">${formatReadableAmount(totalTaxable.toFixed(2))}</td>
                                    <td class="amount" id="footerBillAmount">${formatReadableAmount(totalBillAmount.toFixed(2))}</td>
                                    <td class="amount" id="footerQuintal">${formatReadableAmount(totalQuintal.toFixed(2))}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
                    <script>
                        let sortOrders = {};

                        function sortTable(n) {
                            const table = document.getElementById("summaryTable");
                            const tbody = table.tBodies[0];
                            const rows = Array.from(tbody.rows);
                            
                            sortOrders[n] = !sortOrders[n];
                            const isAsc = sortOrders[n];

                            rows.sort((a, b) => {
                                let cellA = a.cells[n];
                                let cellB = b.cells[n];

                                // Use data-val for numeric sorting, otherwise innerText
                                let valA = cellA.getAttribute('data-val') ? parseFloat(cellA.getAttribute('data-val')) : cellA.innerText.trim().toLowerCase();
                                let valB = cellB.getAttribute('data-val') ? parseFloat(cellB.getAttribute('data-val')) : cellB.innerText.trim().toLowerCase();

                                if (valA < valB) return isAsc ? -1 : 1;
                                if (valA > valB) return isAsc ? 1 : -1;
                                return 0;
                            });

                            rows.forEach(row => tbody.appendChild(row));
                        }

                        function filter() {
                            const input = document.getElementById('srch').value.toUpperCase();
                            const rows = document.getElementById('summaryTable').tBodies[0].rows;
                            
                            for (let i = 0; i < rows.length; i++) {
                                const text = rows[i].innerText.toUpperCase();
                                rows[i].style.display = text.includes(input) ? "" : "none";
                            }
                        }

                        function exportToExcel() {
                            const table = document.getElementById("summaryTable");
                            const headers = Array.from(table.querySelectorAll("thead th")).map(th => th.innerText.replace(' ↕', '').trim());
                            const exportData = [];

                            // Process only visible rows
                            Array.from(table.tBodies[0].rows).forEach(row => {
                                if (row.style.display !== "none") {
                                    const rowData = {};
                                    Array.from(row.cells).forEach((cell, i) => {
                                        const val = cell.getAttribute('data-val');
                                        rowData[headers[i]] = val ? parseFloat(val) : cell.innerText.trim();
                                    });
                                    exportData.push(rowData);
                                }
                            });

                            // Process Footer
                            const footerTaxable = document.getElementById('footerTaxable').innerText.replace(/,/g, '');
                            const footerQuintal = document.getElementById('footerQuintal').innerText.replace(/,/g, '');
                            
                            const footerRow = {};
                            footerRow[headers[0]] = "Grand Total";
                            footerRow[headers[1]] = "";
                            footerRow[headers[2]] = parseFloat(footerTaxable);
                            footerRow[headers[3]] = parseFloat(footerQuintal);
                            exportData.push(footerRow);

                            const ws = XLSX.utils.json_to_sheet(exportData);
                            const wb = XLSX.utils.book_new();
                            XLSX.utils.book_append_sheet(wb, ws, "Yearly Summary");
                            XLSX.writeFile(wb, "PartyWise_Yearly_Summary.xlsx");
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
                onClick={fetchYearlySummary}
                disabled={loading}
                style={{ width: '100%', maxWidth: '300px', height: '60px', fontWeight: 'bold', fontSize: '16px' }}
            >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Partywise Yearly Summary'}
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
                onClick={fetchYearlySummary}
                disabled={loading}
            >
                {loading ? <CircularProgress size={24} color="inherit" /> : "Partywise Yearly Summary"}
            </button>

        </div>
    );
};

export default PartyWiseYearlySummary;