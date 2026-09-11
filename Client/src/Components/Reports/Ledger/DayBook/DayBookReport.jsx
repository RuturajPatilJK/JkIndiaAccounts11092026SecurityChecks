import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import { Card, CardContent, Typography, TableContainer, Paper, Table, TableHead, TableRow, TableCell, TableBody, CircularProgress, Button } from "@mui/material";
import { formatReadableAmount } from "../../../../Common/FormatFunctions/FormatAmount";
import { formatDate } from "../../../../Common/FormatFunctions/FormatDate";
import "jspdf-autotable";
import { FormaDateBalanceSheet } from "../../../../Common/FormatFunctions/FormatDate";

const DayBookReport = () => {
  const [groupedLedgerData, setGroupedLedgerData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totals, setTotals] = useState({ debit: 0, credit: 0 });
  const location = useLocation();
  const [difference, setDifference] = useState(0);
  const searchParams = new URLSearchParams(location.search);

  // Get query parameters
  const fromDate = searchParams.get("fromDate");
  const toDate = searchParams.get("toDate");
  const filterType = searchParams.get("filterType") || "All";
  const companyCode = sessionStorage.getItem("Company_Code");
  const yearCode = sessionStorage.getItem("Year_Code");
  const Company_Name = sessionStorage.getItem("Company_Name");
  const Company_GSTNO = sessionStorage.getItem('Company_GSTNO');

  useEffect(() => {
    const fetchDayBookReport = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${process.env.REACT_APP_API}/get_DayBook`, {
          params: { from_date: fromDate, to_date: toDate, company_code: companyCode, year_code: yearCode },
        });

        const data = response.data.Day_Book || [];

        const filteredData = filterType !== "All" ? data.filter(item => item.TRAN_TYPE === filterType) : data;

        const groupedData = filteredData.reduce((acc, item) => {
          const date = item.DOC_DATE;
          if (!acc[date]) {
            acc[date] = [];
          }
          acc[date].push(item);
          return acc;
        }, {});

        setGroupedLedgerData(groupedData);

        const overallTotals = filteredData.reduce(
          (acc, item) => {
            acc.debit += parseFloat(item.debit || 0);
            acc.credit += parseFloat(item.credit || 0);
            return acc;
          },
          { debit: 0, credit: 0 }
        );
        setTotals(overallTotals);

        const difference = overallTotals.debit - overallTotals.credit;
        setDifference(difference);

      } catch (err) {
        console.error("Error fetching report data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDayBookReport();
  }, [fromDate, toDate, companyCode, yearCode, filterType]);

  const printReport = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Day Book Report</title>
          <style>
            body { font-family: Arial, sans-serif; }
            table { width: 100%; border-collapse: collapse; }
            th, td { text-align: left; border: 1px solid #ddd; }
            th { background-color: #f2f2f2; }
            .total { background-color: #ffff99; }
            .overall-total { background-color: #e0e0e0; }
          </style>
        </head>
        <body>
          <h2 style="text-align:center;margin-bottom:-10px;">${Company_Name} </h2>
          <h4 style="text-align:center;gap:5px">Day Book Report</h4>
          <p style="text-align:center;gap:5px;"><strong>From:</strong> ${formatDate(fromDate)} <strong>To:</strong> ${formatDate(toDate)}</p>
          <table>
            <thead>
              <tr>
                <th style="font-size:10px; text-align:center;">Tran Type</th>
                <th style="font-size:10px; text-align:center;">Doc No</th>
                <th style="font-size:10px; text-align:center;">Date</th>
                <th style="font-size:10px; text-align:center;">Ac Code</th>
                <th style="font-size:10px; text-align:center;">Account Name / Narration</th>
                <th style="font-size:10px; text-align:center;">Debit</th>
                <th style="font-size:10px; text-align:center;">Credit</th>
                <th style="font-size:10px; text-align:center;">DO No</th>
              </tr>
            </thead>
            <tbody>
              ${Object.keys(groupedLedgerData).map(date => `
                <tr><td colspan="7" style="text-align:center; background-color: #e0e0e0; ">${formatDate(date)}</td></tr>
                ${groupedLedgerData[date].map(item => `
                  <tr>
                    <td style="font-size:10px;">${item.TRAN_TYPE}</td>
                    <td style="font-size:10px;">${item.DOC_NO}</td>
                    <td style="font-size:10px;">${formatDate(item.DOC_DATE)}</td>
                    <td style="font-size:10px;">${item.AC_CODE}</td>
                    <td style="font-size:10px;">${item.Ac_Name_E} ${item.NARRATION}</td>
                    <td style="font-size:10px;text-align:right;">${formatReadableAmount(item.debit)}</td>
                    <td style="font-size:10px;text-align:right;">${formatReadableAmount(item.credit)}</td>
                     <td style="font-size:10px;">${item.do_no || 0}</td>
                  </tr>
                `).join('')}
                <tr class="total">
                  <td colspan="5" style="font-size:12px;text-align:right;fontWeight:bold;">Total</td>
                  <td style="font-size:10px;text-align:right;">${formatReadableAmount(groupedLedgerData[date].reduce((sum, item) => sum + parseFloat(item.debit || 0), 0))}</td>
                  <td style="font-size:10px;text-align:right;">${formatReadableAmount(groupedLedgerData[date].reduce((sum, item) => sum + parseFloat(item.credit || 0), 0))}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Card style={{ marginTop: '-80px' }}>
      <CardContent>
        <Typography variant="h6" style={{ textAlign: 'center', fontSize: "24px", fontWeight: "bold" }}>{Company_Name}</Typography>
        <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px", textDecoration: 'underline', fontWeight: "550" }}>GSTN : {Company_GSTNO}</Typography>
        <Typography variant="h6" style={{ textAlign: 'center', fontSize: "20px", fontWeight: "bold" }}>Day Book Report</Typography>
        <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px" }}>{FormaDateBalanceSheet(fromDate)} to {FormaDateBalanceSheet(toDate)}</Typography>
        <Button variant="contained" color="secondary" onClick={printReport} style={{ float: "right", marginBottom: "10px" }}>Print Report</Button>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
            <CircularProgress />
          </div>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Tran Type</TableCell>
                  <TableCell>Doc No</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Ac Code</TableCell>
                  <TableCell>Account Name / Narration</TableCell>
                  <TableCell align="right">Debit</TableCell>
                  <TableCell align="right">Credit</TableCell>
                  <TableCell align="right">Do No</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.keys(groupedLedgerData).map((date, index) => (
                  <React.Fragment key={index}>
                    <TableRow sx={{ backgroundColor: "#e0e0e0", fontWeight: "bold" }}>
                      <TableCell colSpan={8} sx={{ padding: "4px", textAlign: "center", fontSize: "18px", marginTop: "30px", fontWeight: "bold" }}>{formatDate(date)}</TableCell>
                    </TableRow>
                    {groupedLedgerData[date].map((item, itemIndex) => (
                      <TableRow key={itemIndex}>
                        <TableCell sx={{ padding: '4px' }}>{item.TRAN_TYPE}</TableCell>
                        <TableCell sx={{ padding: '4px' }}>{item.DOC_NO}</TableCell>
                        <TableCell sx={{ padding: '4px' }}>{formatDate(item.DOC_DATE)}</TableCell>
                        <TableCell sx={{ padding: '4px' }}>{item.AC_CODE}</TableCell>
                        <TableCell sx={{ padding: '4px' }}>
                          <div>{item.Ac_Name_E}</div>
                          <div style={{ marginTop: '4px' }}>{item.CA_NARRATION}</div>
                        </TableCell>
                        <TableCell align="right" sx={{ padding: '4px' }}>
                          {formatReadableAmount(item.debit)}
                        </TableCell>
                        <TableCell align="right" sx={{ padding: '4px' }}>
                          {formatReadableAmount(item.credit)}
                        </TableCell>
                        <TableCell align="right" sx={{ padding: '4px' }}>{item.do_no || 0}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ backgroundColor: "yellow", fontWeight: "bold" }}>
                      <TableCell colSpan={5} align="right">Total</TableCell>
                      <TableCell align="right" sx={{ padding: '4px' }}>
                        {formatReadableAmount(groupedLedgerData[date].reduce((sum, item) => sum + parseFloat(item.debit || 0), 0))}
                      </TableCell>
                      <TableCell align="right" sx={{ padding: '4px' }}>
                        {formatReadableAmount(groupedLedgerData[date].reduce((sum, item) => sum + parseFloat(item.credit || 0), 0))}
                      </TableCell>
                      <TableCell align="right"></TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}

                <TableRow sx={{ backgroundColor: "#ffcccb", fontWeight: "bold" }}>
                  <TableCell colSpan={5} align="right">Difference</TableCell>
                  <TableCell align="right" sx={{ padding: '4px' }}>{formatReadableAmount(difference)}</TableCell>
                  <TableCell align="right"></TableCell>
                  <TableCell align="right"></TableCell>
                </TableRow>


                <TableRow sx={{ backgroundColor: "#d0d0d0", fontWeight: "bold" }}>
                  <TableCell colSpan={5} align="right">Overall Total</TableCell>
                  <TableCell align="right" sx={{ padding: '4px' }}>{formatReadableAmount(totals.debit)}</TableCell>
                  <TableCell align="right" sx={{ padding: '4px' }}>{formatReadableAmount(totals.credit)}</TableCell>
                  <TableCell align="right"></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default DayBookReport;
