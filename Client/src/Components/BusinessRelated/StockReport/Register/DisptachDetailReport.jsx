import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";

const DispatchDetailsReport = () => {

  const companyCode = sessionStorage.getItem("Company_Code");
  const yearCode = sessionStorage.getItem("Year_Code");

  const [doResults, setDoResults] = useState([]);
  const [tenderResults, setTenderResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const location = useLocation();
  // const { acCode, fromDate, toDate, lotNo, srNo } = location.state;
  const searchParams = new URLSearchParams(location.search);
  //const { acCode, fromDate, toDate, lotNo, srNo } = location.state;
  const fromDate = searchParams.get('fromDate');
  const acCode = searchParams.get('acCode');
  const toDate = searchParams.get('toDate');
  const lotNo = searchParams.get('lotNo');
  const srNo = searchParams.get('srNo');
  const API_URL = process.env.REACT_APP_API;

  useEffect(() => {
    // Fetch dispatch details data
    const fetchReportData = async () => {
      try {
        const response = await axios.get(`${API_URL}/dispatch-details`, {
          params: {
            Mill_Code: acCode,
            fromDT: fromDate,
            toDT: toDate,
            Lot_No: lotNo,
            Sr_No: srNo,
            Company_Code: companyCode,
            Year_Code: yearCode,
          },
        });
        setDoResults(response.data.do_results || []);
        setTenderResults(response.data.tender_results || []);
      } catch (err) {
        setError("Failed to fetch data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, []);

  if (loading) {
    return <p style={{ textAlign: "center", color: "#007bff" }}>Loading report...</p>;
  }

  if (error) {
    return <p style={{ textAlign: "center", color: "red" }}>{error}</p>;
  }

  return (
    <div
      style={{
        backgroundColor: "#f4f7fc",
        padding: "20px",
        borderRadius: "8px",
        maxWidth: "1200px",
        margin: "40px auto",
        boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h2 style={{ textAlign: "center", color: "#0056b3", marginBottom: "20px" }}>
        Dispatch Details Report
      </h2>

      {doResults.length > 0 && (
        <>
          <h3 style={{ color: "#333", marginBottom: "10px" }}>DO Head Details</h3>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "14px",
              marginBottom: "30px",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#007bff", color: "#fff" }}>
                <th style={{ padding: "10px", border: "1px solid #ccc" }}>Detail ID</th>
                <th style={{ padding: "10px", border: "1px solid #ccc" }}>DI Date</th>
                <th style={{ padding: "10px", border: "1px solid #ccc" }}>Getpass</th>
                <th style={{ padding: "10px", border: "1px solid #ccc" }}>Shipped To</th>
                <th style={{ padding: "10px", border: "1px solid #ccc" }}>Truck No</th>
                <th style={{ padding: "10px", border: "1px solid #ccc" }}>DI Qty</th>
                <th style={{ padding: "10px", border: "1px solid #ccc" }}>DI DO</th>
                <th style={{ padding: "10px", border: "1px solid #ccc" }}>Purc No</th>
              </tr>
            </thead>
            <tbody>
              {doResults.map((item, index) => (
                <tr
                  key={index}
                  style={{
                    backgroundColor: index % 2 === 0 ? "#f9f9f9" : "#fff",
                  }}
                >
                  <td style={{ padding: "10px", border: "1px solid #ccc" }}>{item.detail_id}</td>
                  <td style={{ padding: "10px", border: "1px solid #ccc" }}>{item.DI_Date}</td>
                  <td style={{ padding: "10px", border: "1px solid #ccc" }}>{item.Getpass}</td>
                  <td style={{ padding: "10px", border: "1px solid #ccc" }}>{item.ShippedTo}</td>
                  <td style={{ padding: "10px", border: "1px solid #ccc" }}>{item.truck_no}</td>
                  <td style={{ padding: "10px", border: "1px solid #ccc" }}>{item.DI_Qty}</td>
                  <td style={{ padding: "10px", border: "1px solid #ccc" }}>{item.DI_DO}</td>
                  <td style={{ padding: "10px", border: "1px solid #ccc" }}>{item.purc_no}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {tenderResults.length > 0 && (
        <>
          <h3 style={{ color: "#333", marginBottom: "10px" }}>Tender Details</h3>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "14px",
              marginBottom: "30px",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#007bff", color: "#fff" }}>
                <th style={{ padding: "10px", border: "1px solid #ccc" }}>No.</th>
                <th style={{ padding: "10px", border: "1px solid #ccc" }}>Tender No</th>
                <th style={{ padding: "10px", border: "1px solid #ccc" }}>Tender Date</th>
                <th style={{ padding: "10px", border: "1px solid #ccc" }}>Mill</th>
                <th style={{ padding: "10px", border: "1px solid #ccc" }}>Grade</th>
                <th style={{ padding: "10px", border: "1px solid #ccc" }}>Quantal</th>
                <th style={{ padding: "10px", border: "1px solid #ccc" }}>Mill Rate</th>
                <th style={{ padding: "10px", border: "1px solid #ccc" }}>Lifting Date</th>
                <th style={{ padding: "10px", border: "1px solid #ccc" }}>Tender DO</th>
                <th style={{ padding: "10px", border: "1px solid #ccc" }}>Dispatched</th>
              </tr>
            </thead>
            <tbody>
              {tenderResults.map((item, index) => (
                <tr
                  key={index}
                  style={{
                    backgroundColor: index % 2 === 0 ? "#f9f9f9" : "#fff",
                  }}
                >
                  <td style={{ padding: "10px", border: "1px solid #ccc" }}>{index + 1}</td>
                  <td style={{ padding: "10px", border: "1px solid #ccc" }}>{item.Tender_No}</td>
                  <td style={{ padding: "10px", border: "1px solid #ccc" }}>{item.Tender_Date}</td>
                  <td style={{ padding: "10px", border: "1px solid #ccc" }}>{item.Mill}</td>
                  <td style={{ padding: "10px", border: "1px solid #ccc" }}>{item.Grade}</td>
                  <td style={{ padding: "10px", border: "1px solid #ccc" }}>{item.Quantal}</td>
                  <td style={{ padding: "10px", border: "1px solid #ccc" }}>{item.Mill_Rate}</td>
                  <td style={{ padding: "10px", border: "1px solid #ccc" }}>{item.Lifting_Date}</td>
                  <td style={{ padding: "10px", border: "1px solid #ccc" }}>{item.Tender_DO}</td>
                  <td style={{ padding: "10px", border: "1px solid #ccc" }}>{item.Dispatched}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default DispatchDetailsReport;
