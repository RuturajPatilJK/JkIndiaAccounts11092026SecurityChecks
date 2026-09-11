import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import PdfPreview from "../../../Common/PDFPreview"

const API_URL = process.env.REACT_APP_API;


const RetailDetailReport = () => {
  const location = useLocation();
  const { fromDate, toDate, itemCode } = location.state;

  const companyCode = sessionStorage.getItem("Company_Code");
  const companyName = sessionStorage.getItem('Company_Name')


  const [groupedData, setGroupedData] = useState({});
  const [loading, setLoading] = useState(true);
   const [pdfPreview,setPdfPreview] = useState([])
   const navigate = useNavigate () ;

  const groupBy = (array, key) => {
    return array.reduce((result, currentItem) => {
      const groupKey = currentItem[key];
      if (!result[groupKey]) {
        result[groupKey] = [];
      }
      result[groupKey].push(currentItem);
      return result;
    }, {});
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return `${String(date.getDate()).padStart(2, "0")}/${String(
      date.getMonth() + 1
    ).padStart(2, "0")}/${date.getFullYear()}`;
  };

  useEffect(() => {
    const fetchStockBookDetailReport = async () => {
      try {
        const response = await fetch(
          `${API_URL}/retail-stock-book-detail?doc_date=${toDate}&company_code=${companyCode}&Item_Code=${itemCode}`
        );
        const result = await response.json();
        const grouped = groupBy(result.data || [], "System_Name_E"); // Group by `system_name_e`
        setGroupedData(grouped);
      } catch (error) {
        console.error("Error fetching stock book detail report:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStockBookDetailReport();
  }, [toDate, itemCode]);

  const handleBack = () =>{
      navigate('/stock-book')
    }
  
    const generatePDF = () => {
      const doc = new jsPDF("landscape", "mm", "a4");
      const pageHeight = doc.internal.pageSize.height; 
      const margin = 10; // Top/bottom margin
    
      const title = "Stock Book Detail Report";
    
      // Title and Date Range
      doc.setFontSize(14);
      doc.text(title, 10, 10);
      doc.setFontSize(10);
      doc.text(
        `From Date: ${formatDate(fromDate)} | To Date: ${formatDate(toDate)}`,
        10,
        20
      );
    
      let currentY = 30; // Track the current vertical position
    
      Object.keys(groupedData).forEach((group, groupIndex) => {
        // Check if there is enough space for a new group
        if (currentY + 20 > pageHeight - margin) {
          doc.addPage();
          currentY = margin; // Reset Y position
        }
    
        // Add group header (Item Name)
        doc.setFontSize(12);
        doc.setTextColor(40);
        doc.text(`Item Name: ${group.toUpperCase()}`, 10, currentY);
        currentY += 10;
    
        // Prepare table data
        const tableData = groupedData[group].map((row) => [
          formatDate(row.doc_date),
          (parseFloat(row.opqntl) || 0).toFixed(2),
          (parseFloat(row.inwqntl) || 0).toFixed(2),
          (parseFloat(row.outqntl) || 0).toFixed(2),
          (parseFloat(row.bal) || 0).toFixed(2),
          (row.Marka) ,
          (row.Tran_Type) ,
          (row.DoNO) ,
          (row.doc_no) ,
          (row.partyShortname),
          (row.MillShortName)
        ]);
    
        // Add the table for the group
        doc.autoTable({
          startY: currentY,
          head: [
            [
              "Date",
              "Opening Qty",
              "Inward Qty",
              "Outward Qty",
              "Balance",
              "Marka",
              "Tran Type",
              "DO No",
              "Doc No",
              "Party Name",
              "Mill Short Name",

            ],
          ],
          body: [...tableData], // Include total row
          styles: { fontSize: 8, cellPadding: 3, halign: "right" },
          headStyles: { fillColor: [240, 240, 240], textColor: 0 },
          columnStyles: { 0: { halign: "center" } }, // Center-align date column
          didDrawPage: (data) => {
            currentY = data.cursor.y; // Update the current Y position after the table
          },
        });
    
        // Adjust `currentY` for the next group
        currentY = doc.lastAutoTable.finalY + 10;
      });
    
      // Convert PDF to Blob and set to pdfPreview
      const pdfBlob = doc.output("blob");
      const pdfUrl = URL.createObjectURL(pdfBlob);
      setPdfPreview(pdfUrl);
    };
    

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <div className="d-flex mb-3 mt-0.5">
      {pdfPreview && <PdfPreview pdfData={pdfPreview} apiData={groupedData} label={"Stock Book Detail Report"} />}
      <button onClick={generatePDF} className="print-button">PDF Preview</button>
        <button className="btn btn-secondary" onClick={handleBack}>
          Back
        </button>
      </div>
      <h2 style={{ textAlign: "center", marginBottom: "20px", color: "#333", marginTop:"-60px" }}>
        {companyName}
      </h2>
      <p style={{ textAlign: "center", fontSize: "14px", marginBottom: "20px" }}>
        <strong>Stock Book Detail Report From Date:</strong> {formatDate(fromDate)} |{" "}
        <strong>To Date:</strong> {formatDate(toDate)}
      </p>
      {Object.keys(groupedData).map((group, index) => (
        <div key={index} style={{ marginBottom: "30px" }}>
          <h3
            style={{
              backgroundColor: "#f4f4f4",
              padding: "10px",
              textAlign: "left",
            }}
          >
            {group.toUpperCase()}
          </h3>
          <table
            border="1"
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "14px",
            }}
          >
            <thead>
              <tr>
                <th style={{ textAlign: "center", padding: "10px" }}>Date</th>
                <th style={{ textAlign: "right", padding: "10px" }}>
                  Opening Qty
                </th>
                <th style={{ textAlign: "right", padding: "10px" }}>
                  Inward Qty
                </th>
                <th style={{ textAlign: "right", padding: "10px" }}>
                  Outward Qty
                </th>
                <th style={{ textAlign: "right", padding: "10px" }}>Balance</th>
                <th style={{ textAlign: "center", padding: "10px" }}>
                  Marka
                </th>
                <th style={{ textAlign: "center", padding: "10px" }}>
                  Trans Type
                </th>
                <th style={{ textAlign: "center", padding: "10px" }}>
                  DO
                </th>
                <th style={{ textAlign: "center", padding: "10px" }}>
                  Doc No
                </th>
                <th style={{ textAlign: "left", padding: "10px" }}>
                  Party Name
                </th>
                <th style={{ textAlign: "left", padding: "10px" }}>
                  Mill Name
                </th>
                
              </tr>
            </thead>
            <tbody>
              {groupedData[group].map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  style={{
                    backgroundColor:
                      rowIndex % 2 === 0 ? "#f9f9f9" : "white",
                  }}
                >
                  <td style={{ textAlign: "center" }}>
                    {formatDate(row.doc_date)}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {(parseFloat(row.opqntl) || 0).toFixed(2)}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {(parseFloat(row.inwqntl) || 0).toFixed(2)}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {(parseFloat(row.outqntl) || 0).toFixed(2)}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {(parseFloat(row.bal) || 0).toFixed(2)}
                  </td>
                  <td style={{ textAlign: "center" }}>{row.Marka}</td>
                  <td style={{ textAlign: "center" }}>{row.Tran_Type}</td>
                  <td style={{ textAlign: "center" }}>{row.DoNO}</td>
                  <td style={{ textAlign: "center" }}>{row.doc_no}</td>
                  <td style={{ textAlign: "left" }}>{row.partyShortname}</td>
                  <td style={{ textAlign: "left" }}>{row.MillShortName}</td>
                 
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};

export default RetailDetailReport;
