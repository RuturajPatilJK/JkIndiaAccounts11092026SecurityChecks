import React, { useEffect, useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { RingLoader } from 'react-spinners';
import { Typography } from '@mui/material';
import Swal from 'sweetalert2';

import PdfPreview from '../../../../Common/PDFPreview';
import PrintButton from '../../../../Common/Buttons/PrintPDF';
import { FormaDateBalanceSheet, formatDate } from "../../../../Common/FormatFunctions/FormatDate";
import { formatReadableAmount } from "../../../../Common/FormatFunctions/FormatAmount";
import HeaderJK from '../../../../Assets/HeaderJK.png';
import FooterJK from '../../../../Assets/FooterJK.png';
import './Register.css';
import { blue } from '@mui/material/colors';

const API_URL = process.env.REACT_APP_API;

const TH_STYLE = { background: '#0a3f8f', color: 'white', cursor: 'pointer', userSelect: 'none' };
const TH_STYLE_RIGHT = { ...TH_STYLE, textAlign: 'right' };

const DaliySudaDispatch = () => {
    const searchParams = new URLSearchParams(window.location.search);
    const fromDate = searchParams.get("fromDT");
    const toDate = searchParams.get("toDT");
    const companyCode = searchParams.get("Company_Code");
    const yearCode = searchParams.get("Year_Code");
    const Company_Name = sessionStorage.getItem("Company_Name");

    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [pdfPreview, setPdfPreview] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'Sauda_Date', direction: 'desc' });

    useEffect(() => {
        if (fromDate && toDate) fetchReport();
    }, []);

    // =========================
    // FETCH REPORT
    // =========================
    const fetchReport = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/daliy_sudaDispach`, {
                params: { Company_Code: companyCode, Year_Code: yearCode, fromDT: fromDate, toDT: toDate }
            });
            const result = response.data;
            if (!Array.isArray(result)) {
                Swal.fire({ icon: 'warning', title: 'Data Not Found' });
                return setReportData([]);
            }
            if (result.length === 0) {
                Swal.fire({ icon: 'info', title: 'No Records Found' });
                return setReportData([]);
            }
            setReportData(result);
        } catch (err) {
            console.log(err);
            setError("Failed to fetch report");
            setReportData([]);
        } finally {
            setLoading(false);
        }
    };

    // =========================
    // FORMAT SAUDA DATE
    // =========================
    const formatSaudaDate = (dateValue) => {
        if (!dateValue) return '';
        const date = new Date(dateValue);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${day}/${month}/${date.getFullYear()}`;
    };

    // =========================
    // SORT HANDLER
    // =========================
    const handleSort = (key) => {
        setSortConfig(prev =>
            prev.key === key
                ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
                : { key, direction: 'desc' }
        );
    };

    const sortIcon = (key) => {
        if (sortConfig.key !== key) return ' ⇅';
        return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
    };

    // =========================
    // SORT DATA
    // =========================
    const sortedData = [...reportData].sort((a, b) => {
        const { key, direction } = sortConfig;
        const mult = direction === 'asc' ? 1 : -1;
        const numericKeys = ['saudaqntl', 'desp', 'balance'];
        if (key === 'Sauda_Date') return mult * (new Date(a.Sauda_Date) - new Date(b.Sauda_Date));
        if (numericKeys.includes(key)) return mult * (parseFloat(a[key] || 0) - parseFloat(b[key] || 0));
        return mult * String(a[key] || '').localeCompare(String(b[key] || ''));
    });

    // =========================
    // DATEWISE GROUPING
    // =========================
    const groupedData = {};
    sortedData.forEach((item) => {
        const dateKey = formatSaudaDate(item.Sauda_Date);
        if (!groupedData[dateKey]) {
            groupedData[dateKey] = { rows: [], totalSauda: 0, totalDesp: 0, totalBalance: 0, tenderMap: {} };
        }
        const group = groupedData[dateKey];
        const tenderId = `${item.tenderdetailid}_${item.Tender_No}`;
        const sauda = parseFloat(item.saudaqntl || 0);
        const desp = parseFloat(item.desp || 0);

        // =========================
        // SAME TENDER GROUP
        // =========================
        if (!group.tenderMap[tenderId]) {
            group.tenderMap[tenderId] = { ...item, saudaqntl: sauda, desp: 0, allRows: [] };
        }

        // CHECK DUPLICATE ROW
        const alreadyExists = group.tenderMap[tenderId].allRows.some(x => parseFloat(x.desp || 0) === desp);

        // ADD ONLY UNIQUE ROW
        if (!alreadyExists) {
            group.tenderMap[tenderId].allRows.push({ ...item, desp });
            group.tenderMap[tenderId].desp += desp;
        }
    });

    // =========================
    // FINALIZE GROUP DATA
    // =========================
    Object.keys(groupedData).forEach((date) => {
        const group = groupedData[date];
        group.rows = Object.values(group.tenderMap);
        group.rows.forEach((row) => {
            const sauda = parseFloat(row.saudaqntl || 0);
            const desp = parseFloat(row.desp || 0);
            row.balance = sauda - desp;
            group.totalSauda += sauda;
            group.totalDesp += desp;
            group.totalBalance += row.balance;
        });
    });

    // =========================
    // SORT DATE DESC
    // =========================
    const sortedDates = Object.keys(groupedData).sort((a, b) => {
        const [da, ma, ya] = a.split('/');
        const [db, mb, yb] = b.split('/');
        return new Date(`${yb}-${mb}-${db}`) - new Date(`${ya}-${ma}-${da}`);
    });

    // =========================
    // GRAND TOTAL
    // =========================
    let grandSauda = 0, grandDesp = 0, grandBalance = 0;
    sortedDates.forEach((date) => {
        grandSauda += groupedData[date].totalSauda;
        grandDesp += groupedData[date].totalDesp;
        grandBalance += groupedData[date].totalBalance;
    });

    // =========================
    // EXCEL EXPORT
    // =========================
    const handleExportToExcel = () => {
        const wb = XLSX.utils.book_new();
        const wsData = [
            [Company_Name],
            ['Daliy Suda Dispatch'],
            [`${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}`],
            [],
            ['Sauda Date', 'Tender No', 'Mill Name', 'Grade', 'Buyer Name', 'Sauda Qntl', 'Desp', 'Balance'],
        ];
        sortedDates.forEach((date) => {
            const group = groupedData[date];
            wsData.push([`DATE : ${date}`]);
            group.rows.forEach((item) => {
                item.allRows.forEach((row, rowIndex) => {
                    const f = rowIndex === 0;
                    wsData.push([
                        f ? formatSaudaDate(row.Sauda_Date) : '',
                        f ? row.Tender_No : '',
                        f ? row.Short_Name : '',
                        f ? row.grade : '',
                        f ? row.Ac_Name_E : '',
                        f ? item.saudaqntl : '',
                        row.desp,
                        f ? item.balance : '',
                    ]);
                });
            });
            wsData.push([' TOTAL', '', '', '', '', group.totalSauda, group.totalDesp, group.totalBalance]);
            wsData.push([]);
        });
        wsData.push(['GRAND TOTAL', '', '', '', '', grandSauda, grandDesp, grandBalance]);
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, 'DaliySudaDispatch');
        XLSX.writeFile(wb, 'DaliySudaDispatch.xlsx');
    };

    // =========================
    // PRINT
    // =========================
    const handlePrint = () => {
        const printContent = document.getElementById('reportTable').outerHTML;
        const win = window.open('', '', 'width=1200,height=800');
        win.document.write(`
            <html><head><title>Daliy Suda Dispatch</title>
            <style>
                body { font-family: Arial; padding: 20px; margin: 0; }
                h3 { text-align: center; margin: 6px 0; }
                .date-range { text-align: center; margin-bottom: 12px; font-size: 13px; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #ccc; padding: 8px; font-size: 13px; }
                th { background: #f5f5f5; }
                .print-header img, .print-footer img { width: 100%; display: block; }
                .print-footer { margin-top: 20px; }
            </style></head>
            <body>
                <div class="print-header"><img src="${HeaderJK}" alt="Header" /></div>
                <h3>Daliy Suda Dispatch</h3>
                <div class="date-range">
                    ${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}
                </div>
                ${printContent}
                <div class="print-footer"><img src="${FooterJK}" alt="Footer" /></div>
            </body></html>
        `);
        win.document.close();
        win.print();
    };

    return (
        <div style={{ marginTop: '-60px' }}>

            {/* HEADER */}
            <div className="d-flex justify-content-between align-items-center">
                <div style={{ flex: 1, textAlign: 'center' }}>
                    <Typography variant="h6" style={{ fontWeight: 'bold' }}>Daliy Suda Dispatch</Typography>
                    <Typography variant="body1">
                        {FormaDateBalanceSheet(fromDate)} {' '}to{' '} {FormaDateBalanceSheet(toDate)}
                    </Typography>
                </div>
                <div className="d-flex gap-2">
                    <PrintButton fetchData={handlePrint} />
                    <button className="btn btn-success" onClick={handleExportToExcel}>Export Excel</button>
                </div>
            </div>

            {/* LOADING / ERROR / TABLE */}
            {loading ? (
                <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
                    <RingLoader />
                </div>
            ) : error ? (
                <div className="alert alert-danger">{error}</div>
            ) : (
                <div style={{ maxHeight: '800px', overflowY: 'auto' }}>
                    <table className="table table-bordered mt-4" id="reportTable">

                        <thead style={{ position: 'sticky', top: 0, zIndex: 1, background: '#0a3f8f', color: 'white' }}>
                            <tr>
                                <th style={TH_STYLE} onClick={() => handleSort('Sauda_Date')}>Sauda Date{sortIcon('Sauda_Date')}</th>
                                <th style={TH_STYLE} onClick={() => handleSort('Tender_No')}>Tender No{sortIcon('Tender_No')}</th>
                                <th style={TH_STYLE} onClick={() => handleSort('Short_Name')}>Mill Name{sortIcon('Short_Name')}</th>
                                <th style={TH_STYLE} onClick={() => handleSort('grade')}>Grade{sortIcon('grade')}</th>
                                <th style={TH_STYLE} onClick={() => handleSort('Ac_Name_E')}>Buyer Name{sortIcon('Ac_Name_E')}</th>
                                <th style={TH_STYLE_RIGHT} onClick={() => handleSort('saudaqntl')}>Sauda Qntl{sortIcon('saudaqntl')}</th>
                                <th style={TH_STYLE_RIGHT} onClick={() => handleSort('desp')}>Desp{sortIcon('desp')}</th>
                                <th style={TH_STYLE_RIGHT} onClick={() => handleSort('balance')}>Balance{sortIcon('balance')}</th>
                            </tr>
                        </thead>

                        <tbody>
                            {sortedDates.map((date, dateIndex) => {
                                const group = groupedData[date];
                                return (
                                    <React.Fragment key={dateIndex}>

                                        {/* DATE HEADER */}
                                        <tr style={{ background: '#1f97d3', fontWeight: 'bold', textAlign: 'left' }}>
                                            <td colSpan={8} style={{ background: '#c2c2c236', color: 'black' }}>
                                                DATE : {date}
                                            </td>
                                        </tr>

                                        {/* ROWS */}
                                        {group.rows.map((item, index) => (
                                            <React.Fragment key={index}>
                                                {item.allRows.map((row, rowIndex) => {
                                                    const isFirstRow = rowIndex === 0;
                                                    return (
                                                        <tr key={rowIndex} style={{ background: item.allRows.length > 1 ? '#f7f7f7' : 'white' }}>
                                                            <td>{isFirstRow ? formatSaudaDate(row.Sauda_Date) : ''}</td>
                                                            <td>{isFirstRow ? row.Tender_No : ''}</td>
                                                            <td style={{ textAlign: 'left' }}>{isFirstRow ? row.Short_Name : ''}</td>
                                                            <td>{isFirstRow ? row.grade : ''}</td>
                                                            <td style={{ textAlign: 'left' }}>{isFirstRow ? row.Ac_Name_E : ''}</td>
                                                            <td style={{ textAlign: 'right' }}>{isFirstRow ? formatReadableAmount(item.saudaqntl) : ''}</td>
                                                            <td style={{ textAlign: 'right' }}>{formatReadableAmount(row.desp)}</td>
                                                            <td style={{ textAlign: 'right' }}>{isFirstRow ? formatReadableAmount(item.balance) : ''}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </React.Fragment>
                                        ))}

                                        {/* DATE TOTAL */}
                                        <tr style={{ background: '#fff2cc', fontWeight: 'bold' }}>
                                            <td colSpan={5}>TOTAL</td>
                                            <td style={{ textAlign: 'right' }}>{formatReadableAmount(group.totalSauda)}</td>
                                            <td style={{ textAlign: 'right' }}>{formatReadableAmount(group.totalDesp)}</td>
                                            <td style={{ textAlign: 'right' }}>{formatReadableAmount(group.totalBalance)}</td>
                                        </tr>

                                    </React.Fragment>
                                );
                            })}
                        </tbody>

                        {/* GRAND TOTAL */}
                        <tfoot>
                            <tr style={{ background: '#f4cccc', fontWeight: 'bold' }}>
                                <td colSpan={5}>GRAND TOTAL</td>
                                <td style={{ textAlign: 'right' }}>{formatReadableAmount(grandSauda)}</td>
                                <td style={{ textAlign: 'right' }}>{formatReadableAmount(grandDesp)}</td>
                                <td style={{ textAlign: 'right' }}>{formatReadableAmount(grandBalance)}</td>
                            </tr>
                        </tfoot>

                    </table>
                </div>
            )}

            {/* PDF */}
            {pdfPreview && <PdfPreview pdfData={pdfPreview} label={"DaliySudaDispatch"} />}

        </div>
    );
};

export default DaliySudaDispatch;