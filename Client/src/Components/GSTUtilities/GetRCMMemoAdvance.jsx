import React, { useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import 'bootstrap/dist/css/bootstrap.min.css';
import Swal from 'sweetalert2';
import { CircularProgress } from '@mui/material';

const API_URL = process.env.REACT_APP_API;

const GetRCMMemoAdvance = ({ fromDate, toDate, companyCode, yearCode }) => {
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState([]);
    const [reportWindow, setReportWindow] = useState(null);

    const fetchRCMMemoAdvance = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/GetRCMData-summary`, {
                params: {
                    from_date: fromDate,
                    to_date: toDate,
                    Company_Code: companyCode,
                    Year_Code: yearCode
                },
            });

            if (!response.data || response.data.length === 0) {
                Swal.fire({ icon: 'error', title: 'Data Not Found!', text: 'No RCM Data found.' });
                setReportData([]);
                return;
            }

            setReportData(response.data);
            openReportInNewTab(response.data);
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to fetch RCM data.' });
        } finally {
            setLoading(false);
        }
    };

    const generateRCMNumber = async () => {
        try {
            const response = await axios.post(`${API_URL}/GenerateRCMNumber`, {
                from_date: fromDate,
                to_date: toDate,
                Company_Code: companyCode,
                Year_Code: yearCode
            });

            if (response.data.success) {
                const { records_updated, first_rcm_number, last_rcm_number, message } = response.data;

                if (records_updated === 0) {
                    Swal.fire({ icon: 'info', title: 'No Action Needed', text: message });
                } else {
                    Swal.fire({
                        icon: 'success',
                        title: 'Success!',
                        html: `
                            <div>
                                <p>${message}</p>
                                <p><strong>First RCM:</strong> ${first_rcm_number}</p>
                                <p><strong>Last RCM:</strong> ${last_rcm_number}</p>
                            </div>
                        `,
                    });
                }

                fetchRCMMemoAdvance(); // Refresh the list

                if (reportWindow && !reportWindow.closed) {
                    reportWindow.postMessage({ type: 'RCM_GENERATED' }, '*');
                }
            }
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: err.response?.data?.details || 'Generation failed.'
            });
        }
    };

    React.useEffect(() => {
        window.generateRCMNumberFromPopup = generateRCMNumber;
        return () => { delete window.generateRCMNumberFromPopup; };
    }, [reportData, reportWindow]);

    const openReportInNewTab = (data) => {
        const newWindow = window.open('', '_blank');
        if (!newWindow) return;
        setReportWindow(newWindow);

        const columns = ['Detail_ID', 'Doc_Date', 'Doc_No', 'NewNo', 'RCMNumber', 'Tran_Type'];

        newWindow.document.write(`
            <html>
                <head>
                    <title>RCM Report</title>
                    <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
                    <style>
                        body { font-family: Arial; padding: 20px; text-align: center; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ccc; padding: 8px; }
                        .btn { padding: 10px 20px; cursor: pointer; border-radius: 4px; border: none; color: white; margin: 5px; }
                        .export-btn { background: green; }
                        .gen-btn { background: #007bff; }
                    </style>
                </head>
                <body>
                    <h2>RCM Number Generate</h2>
                    <button class="btn export-btn" onclick="exportToXlsx()">Export Excel</button>
                    <button class="btn gen-btn" id="genBtn" onclick="generate()">Generate RCM Number</button>
                    <table>
                        <thead><tr>${columns.map(c => `<th>${c}</th>`).join('')}</tr></thead>
                        <tbody>
                            ${data.map(row => `<tr>${columns.map(c => `<td>${row[c] || ''}</td>`).join('')}</tr>`).join('')}
                        </tbody>
                    </table>
                    <script>
                        function generate() {
                            const btn = document.getElementById('genBtn');
                            btn.disabled = true;
                            btn.innerText = 'Generating...';
                            window.opener.generateRCMNumberFromPopup();
                        }
                        window.addEventListener('message', (e) => {
                            if (e.data.type === 'RCM_GENERATED') {
                                location.reload();
                            }
                        });
                        function exportToXlsx() {
                            const ws = XLSX.utils.json_to_sheet(${JSON.stringify(data)});
                            const wb = XLSX.utils.book_new();
                            XLSX.utils.book_append_sheet(wb, ws, 'Data');
                            XLSX.writeFile(wb, 'RCM_Report.xlsx');
                        }
                    </script>
                </body>
            </html>
        `);
        newWindow.document.close();
    };

    return (
        <div className="d-flex flex-column align-items-center" style={{ marginTop: '5px' }}>
            {/* <button
                className="btn btn-primary"
               onClick={fetchRCMMemoAdvance} disabled={loading}
                style={{
                    width: '20%',
                    height: '60px',
                }}
            >
                {loading ? 'Loading...' : 'Generate RCM Number'}
            </button> */}


            <button style={{
                marginTop: '10px',
                background: '#007bff',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 10px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(26,35,126,0.2)',
                width: '20%',
                height: '60px'
            }} onClick={fetchRCMMemoAdvance} disabled={loading}>
                {loading ? <CircularProgress size={24} color="inherit" /> : "Generate RCM Number"}
            </button>
        </div>
    );
};

export default GetRCMMemoAdvance;