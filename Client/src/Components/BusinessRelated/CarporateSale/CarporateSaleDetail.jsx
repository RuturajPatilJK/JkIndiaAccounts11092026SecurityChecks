import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { useNavigate, useLocation } from 'react-router-dom';
import PdfPreview from '../../../Common/PDFPreview';
import { RingLoader } from 'react-spinners';
import { Typography } from '@mui/material';
import { FormaDateBalanceSheet } from "../../../Common/FormatFunctions/FormatDate"
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";
import PrintButton from '../../../Common/Buttons/PrintPDF';

const apikey = process.env.REACT_APP_API;

const CarporateSaleDetail = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const searchParams = new URLSearchParams(location.search);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const acCode = searchParams.get('acCode');
    const lotNo = searchParams.get('lotNo');
    const accountType = searchParams.get('accountType');

    const companyCode = sessionStorage.getItem('Company_Code');
    const Year_Code = sessionStorage.getItem('Year_Code');
    const Company_Name = sessionStorage.getItem('Company_Name');
    const Company_GSTNO = sessionStorage.getItem('Company_GSTNO')

    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [pdfPreview, setPdfPreview] = useState(null);

    const API_URL = `${apikey}/CarporateSaleDetail-Register`;

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
                        Year_Code: Year_Code,
                        lotNo : lotNo,
                        accountType : accountType,
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

        if (fromDate && toDate) {
            fetchReportData();
        }
    }, [fromDate, toDate, companyCode, Year_Code]);

    const handlePrint = () => {
        const printContent = document.getElementById('reportTable').outerHTML;
        const win = window.open('', '', 'height=700,width=900');
        win.document.write(`
            <html>
                <head>
                    <title>Print Report</title>
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
        const textWidth = doc.getTextWidth(Company_Name);
        const xPosition = (pageWidth - textWidth) / 2;

        doc.text(Company_Name, xPosition, 10);
        doc.autoTable({ html: '#reportTable' });

        const pdfBlob = doc.output('blob');
        const url = URL.createObjectURL(pdfBlob);
        setPdfPreview(url);
    };

    const handleExportToExcel = () => {
    const wb = XLSX.utils.book_new();
    const wsData = [];

    // Company Name + Date Range
    wsData.push([Company_Name]);
    wsData.push([`From: ${FormaDateBalanceSheet(fromDate)} To: ${FormaDateBalanceSheet(toDate)}`]);
    wsData.push([]);

    // Main Table Header (first row)
    wsData.push([
        'No', 'Date', 'Unit Name', '', '', 'Sale Rate', 'Quintal', 'Dispatch', 'Balance', 'PO Details', '', ''
    ]);

    // Merge-friendly note: In Excel, we'll adjust spans later if needed.

    // Loop groups
    Object.entries(groupedReportData).forEach(([key, { items }]) => {
        const totalQty = items.reduce((sum, item) => sum + parseFloat(item.DODesp || 0), 0);
        const docDate = items.length > 0 ? items[0].doc_date : "";
        const Unitname = items.length > 0 ? items[0].CSUnitName : "";
        const SaleRate = items.length > 0 ? items[0].CSSaleRate : 0;
        const Quantal = items.length > 0 ? items[0].CSQntl : 0;
        const Balance = Quantal - totalQty;
        const PoDetails = items.length > 0 ? items[0].CSPodetails : "";

        // Group Header Row (blue row in UI)
        wsData.push([
            key, docDate, Unitname, '', '', SaleRate, Quantal, totalQty, Balance, PoDetails, '', ''
        ]);

        // Sub-header Row (DO columns row)
        wsData.push([
            'DO No.', 'Date', 'Desp', 'Mill', 'Ship To',
            'Vehical No', 'Frt+Vasuli', 'Transport',
            'Getpass', 'PS', 'SB', 'ASN No'
        ]);

        // DO Item Rows
        items.forEach(item => {
            wsData.push([
                item.dispatchno,
                item.DODate,
                item.DODesp,
                item.DOMil,
                item.shiptoshortname,
                item.DOLorryNo,
                item.Addition,
                item.DOTransport,
                item.DOGetpass,
                item.VN,
                item.SB,
                item.ASN_No
            ]);
        });

        // Sub-total Row
        wsData.push([
            '', '', 'Total Dispatch:', totalQty.toFixed(2),
            '', '', '', '', '', '', '', ''
        ]);

        wsData.push([]); // spacing
    });

    // Create sheet
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Column width formatting (optional for readability)
    ws['!cols'] = [
        { wch: 10 }, { wch: 12 }, { wch: 20 }, { wch: 15 }, { wch: 15 },
        { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 20 },
        { wch: 10 }, { wch: 12 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'CarporateSaleDetail');
    XLSX.writeFile(wb, 'CarporateSaleDetail.xlsx');
};

    const groupReportData = (data) => {
        const grouped = {};
        data.forEach(item => {
            const key = `${item.CSNo}`;
            if (!grouped[key]) {
                grouped[key] = { items: [] };
            }
            grouped[key].items.push(item);
        });
        return grouped;
    };

    const groupedReportData = groupReportData(reportData);

    const handleVoucherClick = (doc_no) => {
        const url = `${window.location.origin}/sugarpurchasebill`;
        const params = new URLSearchParams({ navigatedRecord: doc_no });
        window.open(`${url}?${params.toString()}`, '_blank');
    };
     const handleDOClick = (doc_no) => {
        const url = `${window.location.origin}/delivery-order`;
        const params = new URLSearchParams({ navigatedRecord: doc_no });
        window.open(`${url}?${params.toString()}`, '_blank');
    };

    const handleSBNoClick = (doc_no) => {
        const url = `${window.location.origin}/sale-bill`;
        const params = new URLSearchParams({ navigatedRecord: doc_no });
        window.open(`${url}?${params.toString()}`, '_blank');
    };

    return (
        <div style={{ marginTop: '-10px' }}>
            {/* <Typography variant="h6" style={{ textAlign: 'center', fontSize: "24px", fontWeight: "bold" }}>{Company_Name}</Typography>
            <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px", textDecoration: 'underline', fontWeight: "550" }}>GSTN : {Company_GSTNO}</Typography> */}

            <div className="d-flex justify-content-between align-items-center">
                <div style={{ flex: 1, textAlign: 'center', marginLeft: "280px" }}>
                    <Typography variant="h6" style={{ textAlign: 'center', fontSize: "20px", fontWeight: "bold" }}>Carporate Sale Detail</Typography>
                    <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px" }}>{FormaDateBalanceSheet(fromDate)} to {FormaDateBalanceSheet(toDate)}</Typography>

                </div>

                <div className="d-flex justify-content-end">
                    <PrintButton disabledFeild={""} fetchData={handlePrint} />
                    <button className="btn btn-success me-2" onClick={handleExportToExcel}>Export to Excel</button>
                    <button className="btn btn-secondary" onClick={generatePdf}>PDF</button>
                </div>
            </div>

            {loading ? (
                <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
                    <RingLoader />
                </div>
            ) : error ? (
                <div className="alert alert-danger">{error}</div>
            ) : (
             <div style={{ maxHeight: "800px", overflowY: "auto" }}>
  <table
    className="table table-striped table-bordered mt-4"
    id="reportTable"
    style={{ marginBottom: "60px", width: "100%" }}
  >
    <thead
      className="table-light"
      style={{
        position: "sticky",
        top: 0,
        backgroundColor: "#fff",
        zIndex: 1,
        whiteSpace: "nowrap",
      }}
    >
      <tr>
        <th>No</th>
        <th>Date</th>
        <th colSpan={3}>Unit Name</th>
        <th>Sale Rate</th>
        <th>Quintal</th>
        <th>Dispatch</th>
        <th>Balance</th>
        <th colSpan={3}>PO Details</th>
      </tr>
    </thead>
    <tbody>
      {Object.entries(groupedReportData).map(([key, { items }]) => {
        const totalQty = items.reduce(
          (sum, item) => sum + parseFloat(item.DODesp || 0),
          0
        );
        const docDate = items.length > 0 ? items[0].doc_date : "";
        const Unitname = items.length > 0 ? items[0].CSUnitName : "";
        const SaleRate = items.length > 0 ? items[0].CSSaleRate : 0;
        const Quantal = items.length > 0 ? items[0].CSQntl : 0;
        const Balance = Quantal - totalQty;
        const PoDetails = items.length > 0 ? items[0].CSPodetails : "";

        return (
          <React.Fragment key={key}>
            {/* Group Header Row */}
            <tr className="table-primary" style={{ fontWeight: "bold", color: "blue" }}>
              <td>{key}</td>
              <td>{docDate}</td>
              <td colSpan={3}>{Unitname}</td>
              <td>{SaleRate}</td>
              <td>{Quantal}</td>
              <td>{totalQty}</td>
              <td>{Balance}</td>
              <td colSpan={3}>{PoDetails}</td>
            </tr>

            {/* Sub-header Row for DO details */}
            <tr style={{ backgroundColor: "#f8f9fa", fontWeight: "bold" }}>
              <td>DO No.</td>
              <td>Date</td>
              <td>Desp</td>
              <td>Mill</td>
              <td>Ship To</td>
              <td>Vehical No</td>
              <td>Frt+Vasuli</td>
              <td>Transport</td>
              <td>Getpass</td>
              <td>PS</td>
              <td>SB</td>
              <td>ASN No</td>
            </tr>

            {/* DO Item Rows */}
            {items.map((item, index) => (
              <tr key={index}>
                <td
                  style={{
                    cursor: "pointer",
                    color: "blue",
                    textDecoration: "underline",
                  }}
                  onClick={() => handleDOClick(item.dispatchno)}
                >{item.dispatchno}</td>
                <td>{item.DODate}</td>
                <td align="right">{item.DODesp}</td>
                <td align="right">{item.DOMil}</td>
                <td>{item.shiptoshortname}</td>
                <td style={{ fontWeight: "bold" }}>{item.DOLorryNo}</td>
                <td>{item.Addition}</td>
                <td>{item.DOTransport}</td>
                <td>{item.DOGetpass}</td>
                <td
                  style={{
                    cursor: "pointer",
                    color: "blue",
                    textDecoration: "underline",
                  }}
                  onClick={() => handleVoucherClick(item.VN)}
                >
                  {item.VN}
                </td>
                <td
                  style={{
                    cursor: "pointer",
                    color: "blue",
                    textDecoration: "underline",
                  }}
                  onClick={() => handleSBNoClick(item.SB)}
                >
                  {item.SB}
                </td>
                <td>{item.ASN_No}</td>
              </tr>
            ))}

            {/* Sub-total Row */}
            <tr style={{ fontWeight: "bold", backgroundColor: "#f0f8ff" }}>
              <td colSpan={2} align="right">Total Dispatch:</td>
              <td colSpan={2} align="right">{formatReadableAmount(totalQty.toFixed(2))}</td>
              <td colSpan={8}></td>
            </tr>
          </React.Fragment>
        );
      })}
    </tbody>
  </table>
</div>

            )}

            {pdfPreview && (
                <div className="centered-container">
                    <PdfPreview pdfData={pdfPreview} apiData={reportData} label={'CarporateSaleDetail'} />
                </div>
            )}
        </div>
    );
};

export default CarporateSaleDetail;