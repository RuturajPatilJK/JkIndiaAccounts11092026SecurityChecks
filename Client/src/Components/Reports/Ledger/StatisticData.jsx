import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { useLocation } from 'react-router-dom';
import PdfPreview from '../../../Common/PDFPreview';
import PrintButton from '../../../Common/Buttons/PrintPDF';
import { FormaDateBalanceSheet } from "../../../Common/FormatFunctions/FormatDate";
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";

import {
    Container,
    Box,
    Typography,
    Button,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Alert,
    Grid,
} from '@mui/material';
import { styled } from '@mui/system';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import PrintIcon from '@mui/icons-material/Print';
import { RingLoader } from 'react-spinners';

const apikey = process.env.REACT_APP_API;

const headerCellStyle = {
    fontWeight: "bold",
    padding: "6px",
    "&:hover": {
        cursor: "pointer",
    },
};

const StatisticData = () => {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const fromDate = searchParams.get('fromDT');
    const toDate = searchParams.get('toDT');

    const companyCode = sessionStorage.getItem('Company_Code');
    const Year_Code = sessionStorage.getItem('Year_Code');
    const Company_Name = sessionStorage.getItem("Company_Name");
    const Company_GSTNO = sessionStorage.getItem('Company_GSTNO');

    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [pdfPreview, setPdfPreview] = useState(null);

    const API_URL = `${apikey}/StatisticData`;

    useEffect(() => {
        const fetchReportData = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await axios.get(API_URL, {
                    params: {
                        fromDT: fromDate,
                        toDT: toDate,
                        Company_Code: companyCode,
                    },
                });
                setReportData(response.data);
            } catch (error) {
                console.error('Error fetching report:', error);
                setError('Error fetching report');
            } finally {
                setLoading(false);
            }
        };

        if (fromDate && toDate && companyCode) {
            fetchReportData();
        }
    }, [fromDate, toDate, companyCode]);

    const handlePrint = () => {
        const printContent = document.getElementById('reportTable').outerHTML;
        const win = window.open('', '', 'height=700,width=900');
        win.document.write(`
            <html>
                <head>
                    <title>StatisticData Report</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            margin: 20px;
                        }
                        .company-name {
                            text-align: center;
                            font-size: 24px;
                            font-weight: bold;
                            margin-bottom: 20px;
                            color: #333;
                        }
                        .label {
                            text-align: center;
                            font-size: 18px;
                            font-weight: bold;
                            margin-bottom: 20px;
                            color: #333;
                        }
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-bottom: 20px;
                        }
                        th, td {
                            border: 1px solid #ddd;
                            padding: 8px;
                            text-align: left;
                        }
                        th {
                            background-color: #f2f2f2;
                            font-weight: bold;
                        }
                        tr:nth-child(even) {
                            background-color: #f9f9f9;
                        }
                        .total-row {
                            background-color: #e0f7fa;
                            font-weight: bold;
                        }
                    </style>
                </head>
                <body>
                    <div class="company-name">${Company_Name}</div>
                    <div class="label">Statistic Report</div>
                    <div class="label">Period: ${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}</div>
                    ${printContent}
                </body>
            </html>
        `);
        win.document.close();
        win.print();
    };

    const generatePdf = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        doc.setFontSize(18);
        doc.text(Company_Name || '', pageWidth / 2, 15, { align: 'center' });

        doc.setFontSize(14);
        doc.text('Statistic Data Report', pageWidth / 2, 25, { align: 'center' });

        doc.setFontSize(10);
        doc.text(`Period: ${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}`, pageWidth / 2, 35, { align: 'center' });

        doc.autoTable({
            html: '#reportTable',
            startY: 45,
            headStyles: {
                fillColor: [224, 224, 224],
                textColor: [0, 0, 0],
                fontStyle: 'bold',
                halign: 'center',
            },
            bodyStyles: {
                textColor: [0, 0, 0],
            },
            styles: {
                fontSize: 8,
                cellPadding: 2,
            },
            columnStyles: {
                0: { halign: 'left', cellWidth: 'auto' },
                1: { halign: 'center', cellWidth: 'auto' },
                2: { halign: 'center', cellWidth: 'auto' },
            },
            didParseCell: function (data) {
                if (data.section === 'body' && data.column.index === 0) {
                    data.cell.styles.halign = 'left';
                } else if (data.section === 'body' && (data.column.index === 1 || data.column.index === 2)) {
                    data.cell.styles.halign = 'center';
                }
            },
        });

        const pdfBlob = doc.output('blob');
        const url = URL.createObjectURL(pdfBlob);
        setPdfPreview(url);
    };

    const handleExportToExcel = () => {
        const wb = XLSX.utils.book_new();
        const wsData = [];

        // Header rows
        wsData.push([Company_Name]);
        wsData.push(['StatisticData Report']);
        wsData.push([`Period: ${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}`]);
        wsData.push([]);

        wsData.push(['Record Name', 'Total Records', 'Non Active Records']);

        reportData.forEach(item => {
            wsData.push([
                item.RecordName || '',
                item.TotalRecords || 0,
                item.ActiveRecords || 0,
            ]);
        });

        const ws = XLSX.utils.aoa_to_sheet(wsData);

        const wscols = [
            { wch: 25 },
            { wch: 15 },
            { wch: 20 },
        ];
        ws['!cols'] = wscols;

        XLSX.utils.book_append_sheet(wb, ws, 'StatisticData');
        XLSX.writeFile(wb, `StatisticData_${fromDate}_to_${toDate}.xlsx`);
    };

    const handleRowClick = (doc_no, tran_type, DOC_DATE) => {
        if (tran_type === 'DO') {
            const url = `${window.location.origin}/delivery-order`;
            const params = new URLSearchParams({
                navigatedRecord: doc_no
            });
            window.open(`${url}?${params.toString()}`, '_blank');
        }
    };

    const groupReportData = (data) => {
        const grouped = {};
        data.forEach(item => {
            const key = `${item.transport}-${item.transportname}`;
            if (!grouped[key]) {
                grouped[key] = { items: [] };
            }
            grouped[key].items.push(item);
        });
        return grouped;
    };

    const groupedReportDataArray = Object.entries(groupReportData(reportData)).map(([key, { items }]) => {
        const totalQty = items.reduce((sum, item) => sum + parseFloat(item.quantal || 0), 0);
        const amount = items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);

        return {
            key,
            items,
            totalQty,
            amount,
        };
    });

    return (
        <Container maxWidth="md" sx={{ mt: -5 }}>
            <Box sx={{ textAlign: 'center' }}>

                <Typography
                    variant="h6"
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
                    }}
                >
                    Statistic Report
                </Typography>
            </Box>

            <Grid container spacing={2} justifyContent="flex-end" sx={{ mb: 3 }}>
                <Grid item>
                    <PrintButton disabledFeild={""} fetchData={handlePrint} />
                </Grid>
                <Grid item>
                    <Button
                        variant="contained"
                        color="success"
                        onClick={handleExportToExcel}
                        startIcon={<CloudDownloadIcon />}
                    >
                        Export to Excel
                    </Button>
                </Grid>
            </Grid>

            {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" sx={{ height: '50vh' }}>
                    <RingLoader color="#1976d2" loading={loading} size={60} />
                </Box>
            ) : error ? (
                <Alert severity="error">{error}</Alert>
            ) : (
                <Paper elevation={3} sx={{ overflow: 'hidden', mb: 4 }}>
                    <TableContainer sx={{ maxHeight: 500 }} style={{ marginBottom: "60px" }}>
                        <Table stickyHeader id="reportTable">

                            <TableRow>
                                <TableCell style={headerCellStyle} align='left'>Record Name</TableCell>
                                <TableCell style={headerCellStyle} align='right'>Total Records</TableCell>
                                <TableCell style={headerCellStyle} align='right'>Cancelled Records</TableCell>
                            </TableRow>

                            <TableBody>
                                {reportData.length > 0 ? (
                                    reportData.map((item, index) => (
                                        <TableRow key={index} hover>
                                            <TableCell style={headerCellStyle} align="left" sx={{ fontWeight: 'bold', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {item.RecordName}
                                            </TableCell>
                                            <TableCell style={headerCellStyle} align="right">{formatReadableAmount(item.TotalRecords)}</TableCell>
                                            <TableCell style={headerCellStyle} align="right">{formatReadableAmount(item.ActiveRecords)}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} sx={{ textAlign: 'center', py: 3 }}>
                                            No data available for the selected period.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}

            {pdfPreview && (
                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                    <PdfPreview pdfData={pdfPreview} apiData={reportData} />
                </Box>
            )}
        </Container>
    );
};

export default StatisticData;
