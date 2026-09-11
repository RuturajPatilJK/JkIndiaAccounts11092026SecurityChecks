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

const CarporateSaleBalance = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const searchParams = new URLSearchParams(location.search);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const acCode = searchParams.get('acCode');
    const companyCode = sessionStorage.getItem('Company_Code');
    const Year_Code = sessionStorage.getItem('Year_Code');
    const Company_Name = sessionStorage.getItem('Company_Name');
    const Company_GSTNO = sessionStorage.getItem('Company_GSTNO')

    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [pdfPreview, setPdfPreview] = useState(null);

    const API_URL = `${apikey}/CarporateSaleBalance-Register`;

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
                        acCode: acCode
                    },
                });

                // Ensure response data is an array
                const data = Array.isArray(response.data) ? response.data : [];
                setReportData(data);

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
    }, [fromDate, toDate, companyCode, Year_Code, acCode]);

    const handlePrint = () => {
        const printContent = document.getElementById('reportTable').outerHTML;
        const win = window.open('', '', 'height=700,width=900');
        win.document.write(`
            <html>
                <head>
                    <title>Print Report</title>
                    <style>
                        body { font-family: Arial; margin: 20px; }
                        .company-name { text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 20px; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; font-weight: bold; }
                        tr:nth-child(even) { background-color: #f9f9f9; }
                        .total-row { background-color: #e0f7fa; font-weight: bold; }
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

  // Report header
  wsData.push([Company_Name || ""]);
  wsData.push([]);
  wsData.push(["Carporate Sale Balance Report"]);
  wsData.push([`${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}`]);
  wsData.push([]);

  // Table headers
  wsData.push(["No", "Date", "Unit Name", "Sale Rate", "Quintal", "Dispatch", "Balance", "PO Details"]);

  // Loop over grouped data
  Object.entries(groupedReportData).forEach(([groupName, { items }]) => {
    wsData.push([groupName]); // Group header

    let totalQty = 0;

    items.forEach((item) => {
      const qntl = parseFloat(item.Qntl) || 0;
      const desp = parseFloat(item.desp) || 0;
      const balance = qntl - desp;

      totalQty += qntl;

      wsData.push([
        item.doc_no,
        item.Doc_Date,
        item.Unit,
        item.Sale_Rate,
        qntl,
        desp,
        balance.toFixed(2),
        item.podetail,
      ]);
    });

    // Group total row
    wsData.push(["", "", "", "Total", totalQty.toFixed(2), "", "", ""]);
    wsData.push([]);
  });

  // Convert to sheet & export
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, "CarporateBalanceReport");
  XLSX.writeFile(wb, "CarporateBalanceReport.xlsx");
};

    
    const groupReportData = (data) => {
        const grouped = {};

        if (!Array.isArray(data)) {
            console.error("Expected array in groupReportData, received:", data);
            return grouped;
        }

        data.forEach(item => {
            const key = `${item.Party_Code}-${item.Party}`;
            if (!grouped[key]) {
                grouped[key] = { items: [] };
            }
            grouped[key].items.push(item);
        });

        return grouped;
    };

    const groupedReportData = groupReportData(reportData);

    return (
  <div style={{ marginTop: "-10px" }}>
    <div className="d-flex justify-content-between align-items-center">
      <div style={{ flex: 1, textAlign: "center", marginLeft: "280px" }}>
        <Typography
          variant="h6"
          style={{ fontSize: "20px", fontWeight: "bold" }}
        >
          Carporate Balance Report
        </Typography>
        <Typography variant="h6" style={{ fontSize: "16px" }}>
          {FormaDateBalanceSheet(fromDate)} to {FormaDateBalanceSheet(toDate)}
        </Typography>
      </div>

      <div className="d-flex justify-content-end gap-2">
        <PrintButton disabledFeild={""} fetchData={handlePrint} />
        <button
          className="btn btn-success me-2"
          onClick={handleExportToExcel}
        >
          Export to Excel
        </button>
        <button className="btn btn-secondary" onClick={generatePdf}>
          PDF
        </button>
      </div>
    </div>

    {loading ? (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "50vh" }}
      >
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
              <th>Unit Name</th>
              <th>Sale Rate</th>
              <th>Quintal</th>
              <th>Dispatch</th>
              <th>Balance</th>
              <th>PO Details</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(groupedReportData).map(([key, { items }]) => {
              const totalQty = items.reduce(
                (sum, item) => sum + parseFloat(item.Qntl || 0),
                0
              );

              return (
                <React.Fragment key={key}>
                  <tr>
                    <td
                      colSpan={8}
                      align="left"
                      className="table-primary"
                      style={{ color: "blue", fontWeight: "bold" }}
                    >
                      {key}
                    </td>
                  </tr>
                  {items.map((item, index) => (
                    <tr key={`${key}-${index}`}>
                      <td align="center">{item.doc_no}</td>
                      <td align="center" style={{ fontWeight: "bold" }}>
                        {item.Doc_Date}
                      </td>
                      <td align="left">{item.Unit}</td>
                      <td align="left">{item.Sale_Rate}</td>
                      <td align="right">{item.Qntl}</td>
                      <td align="right" style={{ fontWeight: "bold" }}>
                        {item.desp}
                      </td>
                      <td align="right">
                        {(parseFloat(item.Qntl || 0) -
                          parseFloat(item.desp || 0)).toFixed(2)}
                      </td>
                      <td align="center">{item.podetail}</td>
                    </tr>
                  ))}
                  <tr
                    style={{
                      fontWeight: "bold",
                      backgroundColor: "#f0f8ff",
                    }}
                  >
                    <td colSpan={4} align="right">
                      Total
                    </td>
                    <td>{totalQty.toFixed(2)}</td>
                    <td colSpan={3}></td>
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
        <PdfPreview
          pdfData={pdfPreview}
          apiData={reportData}
          label={"CarporateSaleBalanceRegister"}
        />
      </div>
    )}
  </div>
);

};

export default CarporateSaleBalance;
