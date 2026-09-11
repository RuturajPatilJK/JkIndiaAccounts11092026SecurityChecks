
import React, { useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import 'bootstrap/dist/css/bootstrap.min.css';
import { formatReadableAmount } from "../../Common/FormatFunctions/FormatAmount";
import { CircularProgress } from '@mui/material';
import Swal from 'sweetalert2';

const API_URL = process.env.REACT_APP_API;

const PartyWiseMonthWisebillAmountSale = ({ fromDate, toDate }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Logic to identify months present between fromDate and toDate
    const getVisibleMonths = (start, end) => {
        const allMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const startDate = new Date(start);
        const endDate = new Date(end);
        let visible = [];

        let current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
        while (current <= endDate) {
            visible.push(allMonths[current.getMonth()]);
            current.setMonth(current.getMonth() + 1);
            if (visible.length > 24) break; // Safety break
        }
        return visible;
    };

    const fetchPartyWiseSale = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await axios.get(`${API_URL}/PartyWiseMonthWisebillAmount-sale`, {
                params: { from_date: fromDate, to_date: toDate },
            });

            if (response.data && response.data.length > 0) {
                openInNewWindow(response.data);
            } else {
                Swal.fire({
                    icon: 'info',
                    title: 'No Data Found',
                    text: 'No sale records found for the selected criteria.',
                });
            }
        } catch (err) {
            setError('Failed to fetch data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const openInNewWindow = (data) => {
        const newWindow = window.open('', '_blank');
        if (!newWindow) return;

        const months = getVisibleMonths(fromDate, toDate);

        let monthlyTotals = {};
        months.forEach(m => { monthlyTotals[m] = { amt: 0, qty: 0 }; });

        data.forEach(row => {
            months.forEach(m => {
                monthlyTotals[m].amt += parseFloat(row[m] || 0);
                monthlyTotals[m].qty += parseFloat(row[`${m}_NETQNTL`] || 0);
            });
        });

        const grandAmt = months.reduce((acc, m) => acc + monthlyTotals[m].amt, 0);
        const grandQty = months.reduce((acc, m) => acc + monthlyTotals[m].qty, 0);

        newWindow.document.write(`
            <html>
                <head>
                    <title>Party-wise Monthly Sale</title>
                    <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
                    <style>
                        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; background-color: #f8f9fa; }
                        .header-container { text-align: center; margin-bottom: 20px; background: #fff; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                        h2 { margin: 0; color: #333; }
                        .period-label { font-size: 1.1em; color: #555; margin-top: 5px; }
                        .controls { text-align: center; margin-bottom: 20px; display: flex; justify-content: center; gap: 10px; }
                        .search-box { padding: 10px; width: 400px; border: 1px solid #ced4da; border-radius: 5px; }
                        .table-container { max-height: 75vh; overflow: auto; border: 1px solid #dee2e6; background: white; }
                        table { border-collapse: separate; border-spacing: 0; width: 100%; }
                        th { 
                            background-color: #dee2e6; position: sticky; top: 0; z-index: 10; 
                            font-weight: bold; border: 1px solid #aaa; padding: 10px; text-align: center;
                            cursor: pointer; user-select: none;
                        }
                        .sub-header { top: 41px; z-index: 9; background-color: #f1f1f1; font-size: 0.9em; }
                        .sort-icon::after { content: ' ↕'; font-size: 0.8em; color: #999; }
                        .sticky-col1 { position: sticky; left: 0; background-color: #fff; z-index: 11; min-width: 250px; }
                        .sticky-col2 { position: sticky; left: 250px; background-color: #fff; z-index: 11; border-right: 2px solid #bbb; }
                        th.sticky-col1, th.sticky-col2 { z-index: 15; background-color: #dee2e6; }
                        td { border: 1px solid #dee2e6; padding: 8px 12px; white-space: nowrap; }
                        .amount-cell { text-align: right; font-family: 'Consolas', monospace; }
                        .qty-cell { text-align: right; font-family: 'Consolas', monospace; color: #0056b3; background-color: #f9f9f9; }
                        .month-group-start { border-left: 2px solid #888 !important; }
                        .total-row { background-color: #fff9c4 !important; font-weight: bold; position: sticky; bottom: 0; z-index: 8; }
                        .export-btn { padding: 10px 20px; background-color: #28a745; color: white; border: none; cursor: pointer; border-radius: 4px; }
                    </style>
                </head>
                <body>
                    <div class="header-container">
                        <h2>Party-wise Month-wise Sale With Bill Amount</h2>
                        <div class="period-label">Period: <b>${fromDate}</b> to <b>${toDate}</b></div>
                    </div>

                    <div class="controls">
                        <input type="text" id="searchInput" class="search-box" placeholder="Search by Account Name or GST No..." onkeyup="filterTable()">
                        <button class="export-btn" onclick="exportToXlsx()">Export to Excel</button>
                    </div>
                    
                    <div class="table-container">
                        <table id="saleTable">
                            <thead>
                                <tr>
                                    <th rowspan="2" class="sticky-col1 sort-icon" onclick="sortTable(0)">Account Name</th>
                                    <th rowspan="2" class="sticky-col2 sort-icon" onclick="sortTable(1)">GST No</th>
                                    ${months.map(m => `<th colspan="2" class="month-group-start">${m}</th>`).join('')}
                                    <th colspan="2" style="background-color: #d1ecf1;" class="month-group-start">Total</th>
                                </tr>
                                <tr>
                                    ${months.map((m, i) => `
                                        <th class="sub-header month-group-start sort-icon" onclick="sortTable(${2 + (i * 2)})">Amount</th>
                                        <th class="sub-header sort-icon" onclick="sortTable(${3 + (i * 2)})">Quintal</th>
                                    `).join('')}
                                    <th class="sub-header month-group-start sort-icon" style="background-color: #d1ecf1;" onclick="sortTable(${2 + (months.length * 2)})">Total Amt</th>
                                    <th class="sub-header sort-icon" style="background-color: #d1ecf1;" onclick="sortTable(${3 + (months.length * 2)})">Total Qty</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.map(row => {
            let rowAmt = 0; let rowQty = 0;
            const mCells = months.map(m => {
                const amt = parseFloat(row[m] || 0);
                const qty = parseFloat(row[m + '_NETQNTL'] || 0);
                rowAmt += amt; rowQty += qty;
                // Using string concatenation to avoid Babel escape sequence errors
                return '<td class="amount-cell month-group-start" data-val="' + amt + '">' + amt.toLocaleString('en-IN', { minimumFractionDigits: 2 }) + '</td>' +
                    '<td class="qty-cell" data-val="' + qty + '">' + qty.toFixed(2) + '</td>';
            }).join('');

            return `
                                        <tr>
                                            <td class="sticky-col1">${row.Account_Name || 'URP'}</td>
                                            <td class="sticky-col2">${row.gstno || 'URP'}</td>
                                            ${mCells}
                                            <td class="amount-cell month-group-start" style="background:#f1f8ff; font-weight:bold;" data-val="${rowAmt}">${rowAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                            <td class="qty-cell" style="background:#f1f8ff; font-weight:bold;" data-val="${rowQty}">${rowQty.toFixed(2)}</td>
                                        </tr>
                                    `;
        }).join('')}
                            </tbody>
                            <tfoot>
                                <tr class="total-row">
                                    <td class="sticky-col1" style="text-align: center; background-color: #fff9c4;">Total</td>
                                    <td class="sticky-col2" style="background-color: #fff9c4;"></td> 
                                    ${months.map(m => `
                                        <td class="amount-cell month-group-start" style="background-color: #fff9c4;">${monthlyTotals[m].amt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                        <td class="qty-cell" style="background-color: #fff9c4;">${monthlyTotals[m].qty.toFixed(2)}</td>
                                    `).join('')}
                                    <td class="amount-cell month-group-start" style="background:#fff9c4;">${grandAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                    <td class="qty-cell" style="background:#fff9c4;">${grandQty.toFixed(2)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    <script>
                        let sortOrders = {};
                        function sortTable(n) {
                            const table = document.getElementById("saleTable");
                            const tbody = table.tBodies[0];
                            const rows = Array.from(tbody.rows);
                            sortOrders[n] = !sortOrders[n];
                            const asc = sortOrders[n];

                            rows.sort((a, b) => {
                                let xCell = a.cells[n];
                                let yCell = b.cells[n];
                                let x = xCell.getAttribute('data-val') ? parseFloat(xCell.getAttribute('data-val')) : xCell.innerText.trim().toLowerCase();
                                let y = yCell.getAttribute('data-val') ? parseFloat(yCell.getAttribute('data-val')) : yCell.innerText.trim().toLowerCase();
                                if (x < y) return asc ? -1 : 1;
                                if (x > y) return asc ? 1 : -1;
                                return 0;
                            });
                            rows.forEach(row => tbody.appendChild(row));
                        }

                        function filterTable() {
                            const filter = document.getElementById('searchInput').value.toUpperCase();
                            const rows = document.getElementById('saleTable').tBodies[0].rows;
                            for (let i = 0; i < rows.length; i++) {
                                const name = rows[i].cells[0].textContent || rows[i].cells[0].innerText;
                                const gst = rows[i].cells[1].textContent || rows[i].cells[1].innerText;
                                rows[i].style.display = (name.toUpperCase().indexOf(filter) > -1 || gst.toUpperCase().indexOf(filter) > -1) ? "" : "none";
                            }
                        }

                        function exportToXlsx() {
                            const table = document.getElementById("saleTable");
                            const wb = XLSX.utils.table_to_book(table, {sheet: "Monthly_Sale_Report"});
                            XLSX.writeFile(wb, "PartyWise_Monthly_Sale_Report_BillAmount.xlsx");
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
                className="btn btn-primary"
                onClick={fetchPartyWiseSale}
                disabled={loading}
                style={{ width: '100%', maxWidth: '300px', height: '60px', fontWeight: 'bold' }}
            >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Partywise Monthwise Sale with Bill Amount'}
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
                onClick={fetchPartyWiseSale}
                disabled={loading}
            >
                {loading ? <CircularProgress size={24} color="inherit" /> : "Partywise Monthwise Sale with Bill Amount"}
            </button>

            {error && <div className="alert alert-danger mt-2">{error}</div>}
        </div>
    );
};

export default PartyWiseMonthWisebillAmountSale;