import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import PdfPreview from "../../../../Common/PDFPreview";
import { Typography } from '@mui/material';
import { RingLoader } from 'react-spinners';
import { formatReadableAmount } from '../../../../Common/FormatFunctions/FormatAmount'
import { formatDate } from '../../../../Common/FormatFunctions/FormatDate'

const BankBookReport = () => {
    const [groupedData, setGroupedData] = useState([]);
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [pdfPreview, setPdfPreview] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();
    const searchParams = new URLSearchParams(location.search);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const acCode = searchParams.get('acCode');
    const acname = searchParams.get('acname');

    //GET values from session Storage
    const companyCode = sessionStorage.getItem("Company_Code");
    const companyName = sessionStorage.getItem("Company_Name");

    useEffect(() => {
        const fetchBankBook = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await axios.get(`${process.env.REACT_APP_API}/get-bank-book`, {
                    params: { Ac_Code: acCode, fromDate, toDate, Company_Code: companyCode }
                });
                groupTransactions(response.data);
            } catch (err) {
                console.error('Error fetching bank book data:', err);
                setError('Failed to fetch data');
            } finally {
                setLoading(false);
            }
        };

        fetchBankBook();
    }, [acCode, fromDate, toDate, companyCode]);

    const groupTransactions = (response) => {
        const { transactions, opBal } = response;
        let openingBalance = parseFloat(opBal[0]?.OpBal || 0);
        let lastBalance = openingBalance;

        const formatDate = (date) => {
            let d = new Date(date),
                month = '' + (d.getMonth() + 1),
                day = '' + d.getDate(),
                year = d.getFullYear();

            if (month.length < 2)
                month = '0' + month;
            if (day.length < 2)
                day = '0' + day;

            return [day, month, year].join('/');
        };

        const grouped = {
            "Opening Balance": {
                items: [{
                    TRAN_TYPE: "Opening Balance",
                    DOC_NO: "0",
                    NARRATION: "Opening Balance",
                    AMOUNT: openingBalance,
                    debit: openingBalance >= 0 ? openingBalance : 0,
                    credit: openingBalance < 0 ? Math.abs(openingBalance) : 0,
                    balanceAfterTransaction: openingBalance,
                    balanceType: openingBalance >= 0 ? 'Dr' : 'Cr',
                    formattedNarration: "<b>Opening Balance</b>"
                }],
                totalDebit: openingBalance >= 0 ? openingBalance : 0,
                totalCredit: openingBalance < 0 ? Math.abs(openingBalance) : 0,
                balance: openingBalance,
                balanceType: openingBalance >= 0 ? 'Dr' : 'Cr'
            }
        };

        transactions.forEach(transaction => {
            const date = formatDate(transaction.DOC_DATE);
            const amount = parseFloat(transaction.AMOUNT);
            const isDebit = transaction.DRCR === 'D';
            const newBalance = isDebit ? lastBalance - amount : lastBalance + amount;

            if (!grouped[date]) {
                grouped[date] = {
                    items: [],
                    totalDebit: 0,
                    totalCredit: 0,
                    balance: Math.abs(lastBalance),
                    balanceType: lastBalance >= 0 ? 'Dr' : 'Cr'
                };
            }

            grouped[date].items.push({
                ...transaction,
                debit: !isDebit ? amount : 0,
                credit: isDebit ? amount : 0,
                balanceAfterTransaction: Math.abs(newBalance),
                balanceType: newBalance >= 0 ? 'Dr' : 'Cr',
                formattedNarration: `<b>${transaction.Ac_Name_E}</b><br/>${transaction.NARRATION} (${transaction.SORT_TYPE} ${transaction.SORT_NO})`
            });

            if (isDebit) {
                grouped[date].totalCredit += amount;
            } else {
                grouped[date].totalDebit += amount;
            }

            grouped[date].balance = Math.abs(newBalance)
            lastBalance = newBalance;
        });
        setGroupedData(Object.entries(grouped).map(([date, data]) => ({ date, ...data })));
    };

    const handlePrint = () => {
        const printArea = document.getElementById('printArea').innerHTML;
        const printWindow = window.open('', '', 'height=660,width=1350');
        printWindow.document.write(`<html><head><title>Print</title></head><body>${printArea}</body></html>`);
        printWindow.document.close();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    };

    const netDebit = groupedData.reduce((acc, group) => acc + group.totalDebit, 0);
    const netCredit = groupedData.reduce((acc, group) => acc + group.totalCredit, 0);
    const netBalance = netDebit - netCredit;
    const balanceType = netBalance >= 0 ? 'Dr' : 'Cr';

    const generatePDF = () => {
        const doc = new jsPDF('landscape');
        doc.setFontSize(16);
        doc.text('Bank Book Report', 150, 20, 'center');
        doc.setFontSize(12);
        doc.text(`${companyName}`, 150, 30, 'center');
        doc.text(`From: ${fromDate} To: ${toDate}`, 150, 40, 'center');
        doc.text(`Bank Name: Bank #${acname}`, 150, 50, 'center');

        let startY = 60;

        groupedData.forEach((group, index) => {
            doc.setFontSize(12);
            doc.text(`Date: ${group.date}`, 14, startY);

            const headers = ["Tran Type", "No", "Narration", "Debit", "Credit", "Balance", ""];

            const data = group.items.map(item => [
                item.TRAN_TYPE,
                item.DOC_NO,
                item.formattedNarration.replace(/<[^>]*>?/gm, ''),
                parseFloat(item.debit).toFixed(2),
                parseFloat(item.credit).toFixed(2),
                parseFloat(item.balanceAfterTransaction).toFixed(2),
                item.balanceType,
            ]);

            doc.autoTable({
                head: [headers],
                body: data,
                startY: startY + 10,
                theme: 'grid',
                styles: { overflow: 'linebreak', fontSize: 10 },
                headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold' },
                columnStyles: {
                    0: { cellWidth: 25 },
                    1: { cellWidth: 20 },
                    2: { cellWidth: 'auto' },
                    3: { cellWidth: 20 },
                    4: { cellWidth: 20 },
                    5: { cellWidth: 25 }
                },
            });

            startY = doc.lastAutoTable.finalY + 10;

            if (startY + 30 > doc.internal.pageSize.height) {
                doc.addPage();
                startY = 20;
            }
        });

        doc.setFontSize(12);
        let finalY = doc.lastAutoTable.finalY || 70;
        doc.text(
            `Total Debit: ${groupedData.reduce((acc, group) => acc + parseFloat(group.totalDebit), 0).toFixed(2)}`,
            14,
            finalY + 10
        );
        doc.text(
            `Total Credit: ${groupedData.reduce((acc, group) => acc + parseFloat(group.totalCredit), 0).toFixed(2)}`,
            14,
            finalY + 20
        );
        const pdfBlob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        setPdfPreview(pdfUrl);
    };

    const handleExportToExcel = () => {
        const wb = XLSX.utils.book_new();
        let ws_data = [];


        ws_data.push([`${companyName}`]);
        ws_data.push(["From Date: " + formatDate(fromDate) + " To Date: " + formatDate(toDate)]);
        ws_data.push(["Bank Name: " + acname]);
        ws_data.push([]);

        const headers = ["Tran Type", "No", "Narration", "Debit", "Credit", "Balance", "D/C"];

        groupedData.forEach((group, index) => {
            ws_data.push([group.date]);
            ws_data.push(headers);


            group.items.forEach(item => {
                ws_data.push([
                    item.TRAN_TYPE,
                    item.DOC_NO,
                    item.NARRATION.replace(/<[^>]*>?/gm, ''),
                    item.debit,
                    item.credit,
                    item.balanceAfterTransaction,
                    item.balanceType
                ]);
            });

            ws_data.push([
                "Total",
                "",
                "",
                group.totalDebit,
                group.totalCredit,
                group.balance,
                group.balanceType
            ]);

            ws_data.push([]);
        });

        const ws = XLSX.utils.aoa_to_sheet(ws_data);
        ws['!cols'] = [
            { wch: 10 },
            { wch: 10 },
            { wch: 30 },
            { wch: 15 },
            { wch: 15 },
            { wch: 15 },
            { wch: 5 },
        ];

        const range = XLSX.utils.decode_range(ws['!ref']);
        for (let R = range.s.r + 1; R <= range.e.r; ++R) {
            for (let C = 3; C <= 5; ++C) {
                const cell_address = { c: C, r: R };
                const cell_ref = XLSX.utils.encode_cell(cell_address);
                if (!ws[cell_ref]) continue;
                if (!ws[cell_ref].s) ws[cell_ref].s = {};
                ws[cell_ref].s.alignment = { horizontal: "right" };
            }
        }
        XLSX.utils.book_append_sheet(wb, ws, "BankBookReport");

        XLSX.writeFile(wb, "BankBookReport.xlsx");
    };

    const handleBack = () => {
        navigate('/bank-book')
    }

    if (loading) return <div
        style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
        }}
    >
        <RingLoader />
    </div>;

    if (error) return <p>{error}</p>;

    return (
        <div>
            <div className="d-flex mb-3 mt-1">
                {pdfPreview && <PdfPreview pdfData={pdfPreview} apiData={groupedData} label={"Bank Book Report"} />}
                <button onClick={generatePDF} className="print-button">PDF Preview</button>
                <button onClick={handlePrint}>Print</button>
                <button className="btn btn-secondary" onClick={handleExportToExcel}>
                    Export to Excel
                </button>
                <button className="btn btn-secondary" onClick={handleBack}>
                    Back
                </button>
            </div>

            <div id="printArea" style={{ fontFamily: 'Arial' }}>
                <Typography variant="h6" style={{
                    textAlign: 'center',
                    fontSize: "24px",
                    fontWeight: "bold",
                    margin: "5px 0"
                }}>
                    {companyName}
                </Typography>
                <h6 style={{
                    textAlign: 'center',
                    fontSize: "16px",
                    margin: "5px 0 10px"
                }}>
                    Bank Book Report from {formatDate(fromDate)} to {formatDate(toDate)}
                </h6>
                <p style={{
                    textAlign: 'center',
                    margin: "0 0 15px",
                    fontWeight: "bold"
                }}>
                    <strong>Bank Name:</strong> {`Bank #${acname}`}
                </p>

                {groupedData.map((group, groupIndex) => (
                    <div key={group.date} style={{
                        marginBottom: groupIndex === groupedData.length - 1 ? '5px' : '15px',
                        pageBreakInside: 'avoid'
                    }}>
                        <div style={{
                            backgroundColor: '#f2f2f2',
                            marginBottom: '5px',
                            fontWeight: 'bold',
                            fontSize: '18px'
                        }}>
                            {group.date}
                        </div>

                        <table style={{
                            width: '100%',
                            tableLayout: 'fixed',
                            borderCollapse: 'collapse',
                            marginBottom: "3px"
                        }}>
                            <colgroup>
                                <col style={{ width: '8%' }} />
                                <col style={{ width: '4%' }} />
                                <col style={{ width: '42%' }} />
                                <col style={{ width: '10%' }} />
                                <col style={{ width: '10%' }} />
                                <col style={{ width: '10%' }} />
                                <col style={{ width: '10%' }} />
                            </colgroup>
                            <thead>
                                <tr style={{ backgroundColor: '#dcdcdc', fontSize: '18px' }}>
                                    <th style={{ padding: '4px', textAlign: 'left' }}>Tran Type</th>
                                    <th style={{ padding: '4px', textAlign: 'left' }}>No</th>
                                    <th style={{ padding: '4px', textAlign: 'left' }}>Narration</th>
                                    <th style={{ padding: '4px', textAlign: 'right' }}>Debit</th>
                                    <th style={{ padding: '4px', textAlign: 'right' }}>Credit</th>
                                    <th style={{ padding: '4px', textAlign: 'right' }}>Balance</th>
                                    <th style={{ padding: '4px', textAlign: 'center' }}>Dr/Cr</th>
                                </tr>
                            </thead>
                        </table>

                        <table style={{
                            width: '100%',
                            tableLayout: 'fixed',
                            borderCollapse: 'collapse',
                            marginBottom: '5px'
                        }}>
                            <colgroup>
                                <col style={{ width: '8%' }} />
                                <col style={{ width: '4%' }} />
                                <col style={{ width: '42%' }} />
                                <col style={{ width: '10%' }} />
                                <col style={{ width: '10%' }} />
                                <col style={{ width: '10%' }} />
                                <col style={{ width: '10%' }} />
                            </colgroup>
                            <tbody>
                                {group.items.map((tran, idx) => (
                                    <tr key={idx} style={{
                                        borderBottom: '1px dashed #ccc',
                                        fontSize: '16px'
                                    }}>
                                        <td style={{ padding: '4px', textAlign: 'left' }}>{tran.TRAN_TYPE}</td>
                                        <td style={{ padding: '4px', textAlign: 'left' }}>{tran.DOC_NO}</td>
                                        <td dangerouslySetInnerHTML={{ __html: tran.formattedNarration }}
                                            style={{
                                                textAlign: "left",
                                                padding: '4px',
                                                wordBreak: 'break-word'
                                            }}></td>
                                        <td style={{ padding: '4px', textAlign: "right" }}>{formatReadableAmount(tran.debit)}</td>
                                        <td style={{ padding: '4px', textAlign: "right" }}>{formatReadableAmount(tran.credit)}</td>
                                        <td style={{ padding: '4px', textAlign: "right" }}>{formatReadableAmount(tran.balanceAfterTransaction)}</td>
                                        <td style={{ padding: '4px', textAlign: "center" }}>{group.balanceType}</td>
                                    </tr>
                                ))}
                            </tbody>

                            <tfoot>
                                <tr style={{ backgroundColor: '#e8e8e8', fontSize: '16px', fontWeight: 'bold' }}>
                                    <td colSpan="3" style={{
                                        padding: '4px',
                                        textAlign: 'right',
                                        fontWeight: 'bold'
                                    }}>
                                        Total:
                                    </td>
                                    <td style={{
                                        padding: '4px',
                                        textAlign: "right",
                                        fontWeight: 'bold'
                                    }}>{formatReadableAmount(group.totalDebit)}</td>
                                    <td style={{
                                        padding: '4px',
                                        textAlign: "right",
                                        fontWeight: 'bold'
                                    }}>{formatReadableAmount(group.totalCredit)}</td>
                                    <td style={{
                                        padding: '4px',
                                        textAlign: "right",
                                        fontWeight: 'bold'
                                    }}>{formatReadableAmount(group.balance)}</td>
                                    <td style={{
                                        padding: '4px',
                                        textAlign: "center",
                                        fontWeight: 'bold'
                                    }}>{group.balance >= 0 ? "Dr" : "Cr"}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                ))}

                <table style={{
                    width: '100%',
                    tableLayout: 'fixed',
                    borderCollapse: 'collapse',
                    marginTop: '10px'
                }}>
                    <colgroup>
                        <col style={{ width: '58%' }} />
                        <col style={{ width: '10%' }} />
                        <col style={{ width: '10%' }} />
                        <col style={{ width: '10%' }} />
                        <col style={{ width: '10%' }} />
                    </colgroup>
                    <tfoot>
                        <tr style={{
                            backgroundColor: '#dcdcdc',
                            fontSize: '16px',
                            fontWeight: 'bold'
                        }}>
                            <td style={{
                                padding: '8px',
                                textAlign: 'right'
                            }}>
                                GRAND TOTAL:
                            </td>
                            <td style={{
                                padding: '5px',
                                textAlign: "right"
                            }}>{formatReadableAmount(netDebit)}</td>
                            <td style={{
                                padding: '5px',
                                textAlign: "right"
                            }}>{formatReadableAmount(netCredit)}</td>
                            <td style={{
                                padding: '5px',
                                textAlign: "right"
                            }}>{formatReadableAmount(Math.abs(netBalance))}</td>
                            <td style={{
                                padding: '5px',
                                textAlign: "center"
                            }}>{balanceType}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

export default BankBookReport;