import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import '../../Reports/Ledger/GledgerReport.css'
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import PdfPreview from "../../../Common/PDFPreview";

const OpeningBalance = () => {
  const companyCode = sessionStorage.getItem("Company_Code");
  const Year_Code = sessionStorage.getItem("Year_Code");
  const API_URL = process.env.REACT_APP_API;
  const Company_Name = sessionStorage.getItem("Company_Name")
  const [ledgerData, setLedgerData] = useState([]); 
  const [ledgerDataExcel, setLedgerDataExcel] = useState([]); 
  const [loading, setLoading] = useState(false); 
  const [error, setError] = useState(null); 
  const [pdfPreview,setPdfPreview] = useState([])

  const location = useLocation(); 
  // const { acCode, fromDate, toDate ,acname } = location.state || {};
  const searchParams = new URLSearchParams(location.search);
  const fromDate = searchParams.get('fromDate');
  const toDate = searchParams.get('toDate');
  const selectType = searchParams.get('selectType');
  const receiptPaymentType = searchParams.get('receiptPaymentType');


  const navigate = useNavigate();

  const calculateTotals = (data) => {
    const totals = data.reduce(
      (acc, item) => {
        acc.debit += parseFloat(item.debit || 0);
        acc.credit += parseFloat(item.credit || 0);
        return acc;
      },
      { debit: 0, credit: 0 }
    );
    return totals;
  };

  const [totals, setTotals] = useState({ debit: 0, credit: 0 });

  useEffect(() => {
    
    const fetchGLedgerReport = async () => {
      try {
        setLoading(true);
        setError(null); // Clear any previous errors
        const response = await axios.get(
          `${process.env.REACT_APP_API}/DaywiseTrialBalanceDetail-Report`, 
          {
            params: {
              from_date: fromDate,
              to_date: toDate,
              Company_Code:companyCode,
              selectType : selectType,
              receiptPaymentType : receiptPaymentType
            },
          }
        );
        const data = response.data || [];
        setLedgerData(data);

      } catch (err) {
        setError("Error fetching report data."); 
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchGLedgerReport(); 
   
  }, [ fromDate, toDate,selectType,receiptPaymentType]);

  const handlePrint = () => {
    const printContent = document.getElementById('reportTable').outerHTML;
    const win = window.open('', '', 'height=700,width=900');
    win.document.write('<html><head><title>Print Report</title>');
    win.document.write('</head><body>');
    win.document.write(printContent);
    win.document.write('</body></html>');
    win.document.close();
    win.print();
  };

  const handleExportToExcel = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(ledgerData);
    XLSX.utils.book_append_sheet(wb, ws, 'OpeningBalance');
    XLSX.writeFile(wb, 'DayWiseTrialBalance'+'_'+ fromDate + '.xlsx');
};

  const handleBack = () => {
    navigate('/trial-balance');
  };


  const generatePdf = () => {
    const doc = new jsPDF();
    doc.text("Opening Balance Report", 90, 10);
    doc.autoTable({ html: '#reportTable' });
    const pdfBlob = doc.output('blob');  
    const url = URL.createObjectURL(pdfBlob);
    setPdfPreview(url); 
  };

  return (
    
    <div className="ledger-report-container">
      
       <div className="col-auto">
                <button className="btn btn-secondary me-2" onClick={handlePrint}>
                                Print Report
                    </button>
                    <button className="btn btn-success" onClick={handleExportToExcel}>
                        Export to Excel
                    </button>
                    <button className="btn btn-warning ms-2" onClick={handleBack}>
                        Back
                    </button>
                    <button onClick={generatePdf} className="btn btn-secondary">PDF</button>
                </div>
      <h2>{Company_Name}</h2>
      <div>
        <p><strong>Opening Balance : {" "}
         
       
           From Date: {fromDate || "N/A"} {" "}
       
          </strong>
        </p>
      </div>

      {loading && <p className="loading-message">Loading...</p>}
      {error && <p className="error-message">{error}</p>}

      {/* Display fetched data in a table */}
      {ledgerData.length > 0 && (
        <>
        <table id="reportTable">
          <thead>
            <tr>
             
              <th>ACcode</th>
              <th>Ac Name</th>
              <th align="right">Opening</th>
              <th align="right">Credit</th>
              <th align="right">Debit</th>
            </tr>
          </thead>
          <tbody>
            {ledgerData.map((item, index) => (
              
              <tr >
                <td>{item.AC_CODE}</td>
                <td>{item.Ac_Name_E}</td>
                <td align="right">{item.opening}</td>
                <td align="right">{item.credit}</td>
                <td align="right">{item.debit}</td>
                
                
              </tr>
            ))}
          </tbody>
          
        </table>
        <div className="centered-container">
        
        {pdfPreview && pdfPreview.length > 0 && (
        <PdfPreview pdfData={pdfPreview} apiData={ledgerData} label={"DayWiseTrialBalance"} />
    )}
    </div>
        </>
      ) }

      
  
      
     
    </div>
  );
};

export default OpeningBalance;
