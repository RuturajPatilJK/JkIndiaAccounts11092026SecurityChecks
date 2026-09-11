import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import '../../Reports/Ledger/GledgerReport.css';
import * as XLSX from 'xlsx';
import { RingLoader } from "react-spinners";
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";
import jsPDF from "jspdf";
import "jspdf-autotable";
import PdfPreview from "../../../Common/PDFPreview";

const GetAllGledgerReport = () => {
  const companyCode = sessionStorage.getItem("Company_Code");
  const Year_Code = sessionStorage.getItem("Year_Code");
  const Start_Date = sessionStorage.getItem("Start_Date");
  const API_URL = process.env.REACT_APP_API;
  const [ledgerData, setLedgerData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [groupedData, setGroupedData] = useState([])
  const [startDate, setStartDate] = useState("");
  const AccountYear = sessionStorage.getItem('Accounting_Year');
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const fromDate = searchParams.get('fromDate');
  const toDate = searchParams.get('toDate');
  const acCode = searchParams.get('acCode')
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
const [apiData, setApiData] = useState({}); // include contact info and names
const [showPreview, setShowPreview] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (AccountYear) {
      const dates = AccountYear.split(' - ');
      if (dates.length === 2) {
        setStartDate(dates[0]);
      }
    }
  }, [AccountYear]);

  const calculateTotals = (data) => {
    const totals = data.reduce(
      (acc, item) => {
        acc.debit += parseFloat(item.Debit_Amount || 0);
        acc.credit += parseFloat(item.Credit_Amount || 0);
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
        setError(null);
        const response = await axios.get(
          `${process.env.REACT_APP_API}/MultipleLedger`,
          {
            params: {
              from_date: fromDate,
              to_date: toDate,
              Company_Code: companyCode,
              Year_Code: Year_Code,
              Start_Date: startDate,
              ac_codes: acCode,
            },
          }
        );
        const data = response.data.LedgerData || [];
        setLedgerData(data);
        const grouped = data.reduce((acc, item) => {
          const key = `${item.AC_CODE}-${item.Ac_Name_E}`;
          if (!acc[key]) {
            acc[key] = {
              AC_CODE: item.AC_CODE,
              Ac_Name_E: item.Ac_Name_E,
              transactions: []
            };
          }
          acc[key].transactions.push(item);
          return acc;
        }, {});
        setGroupedData(grouped);
        const totals = calculateTotals(data);
        setTotals(totals);
      } catch (err) {
        setError("Error fetching report data.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchGLedgerReport();
  }, [acCode, fromDate, toDate]);

  const handleExportToExcel = () => {
    const workbook = XLSX.utils.book_new();
    const wsName = "Consolidated Ledger";
    const dataForSheet = [];

    Object.entries(groupedData).forEach(([key, value]) => {
      dataForSheet.push([
        "Account Code:", value.AC_CODE, "Account Name:", value.Ac_Name_E
      ]);
      dataForSheet.push([
        "Tran Type", "Date", "Doc No", "Narration", "Detail Amount","Detail DR/CR","Debit", "Credit", "Balance", "DRCR"
      ]);

      let totalDebit = 0;
      let totalCredit = 0;
      let lastBalance = 0;

      value.transactions.sort((a, b) => new Date(a.DOC_DATE) - new Date(b.DOC_DATE));

      const openingTransaction = value.transactions.find(t => t.TRAN_TYPE === 'OP');
      if (openingTransaction) {
        dataForSheet.push([
          openingTransaction.TRAN_TYPE,
          openingTransaction.DOC_DATE,
          openingTransaction.DOC_NO,
          openingTransaction.NARRATION,
          "",
          "",
          { t: 'n', v: parseFloat(openingTransaction.Debit_Amount || 0).toFixed(2) },
          { t: 'n', v: parseFloat(openingTransaction.Credit_Amount || 0).toFixed(2) },
          { t: 'n', v: parseFloat(openingTransaction.Balance || 0).toFixed(2) },
          openingTransaction.DRCR
        ]);
        lastBalance = Math.abs(parseFloat(openingTransaction.Balance || 0));
      }

      value.transactions.forEach(transaction => {
        if (transaction.TRAN_TYPE !== 'OP') {
          dataForSheet.push([
            transaction.TRAN_TYPE,
            transaction.DOC_DATE,
            transaction.DOC_NO,
            transaction.NARRATION,
            "",
            "",
            { t: 'n', v: parseFloat(transaction.Debit_Amount || 0).toFixed(2) },
            { t: 'n', v: parseFloat(transaction.Credit_Amount || 0).toFixed(2) },
            { t: 'n', v: Math.abs(lastBalance += parseFloat(transaction.Credit_Amount || 0) - parseFloat(transaction.Debit_Amount || 0)).toFixed(2) }, 
          transaction.DRCR === 'D' ? 'Dr.': 'Cr.'
          ]);
          totalDebit += parseFloat(transaction.Debit_Amount || 0);
          totalCredit += parseFloat(transaction.Credit_Amount || 0);

          if (transaction.detailData && transaction.detailData.length > 0) {
            transaction.detailData.forEach(detail => {
              dataForSheet.push([
                "", "", "", `${detail.Ac_Name_E}`,
                { t: 'n', v: parseFloat(detail.AMOUNT || 0).toFixed(2) },`${detail.DRCR === "D" ? 'Dr.':'Cr.'}`, "", "", "", "", ""
              ]);
            });
          }
        }
      });

      dataForSheet.push([
        "Total", "", "", "", "",
        { t: 'n', v: Math.abs(totalDebit.toFixed(2)) },
        { t: 'n', v: Math.abs(totalCredit.toFixed(2)) },
        { t: 'n', v: Math.abs(lastBalance.toFixed(2)) }, ""
      ]);

      dataForSheet.push(["", "", "", "", "", "", ""]);
    });

    const ws = XLSX.utils.aoa_to_sheet(dataForSheet);
    XLSX.utils.book_append_sheet(workbook, ws, wsName);
    const filename = `Ledger_${acCode}_${fromDate}_${toDate}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

const generatePdf = () => {
  const doc = new jsPDF("p", "mm", "a4");
  let pageCount = 1;

  const totalPagesPlaceholder = "{totalPages}";
  doc.setProperties({ title: "Ledger Report" });

  Object.entries(groupedData).forEach(([key, value], groupIndex) => {
    if (groupIndex > 0) {
      doc.addPage();
      pageCount++;
    }

    let y = 15;
    let totalDebit = 0;
    let totalCredit = 0;
    let balance = 0;

    const narrationX = 45;
    const narrationWrapWidth = 65;
    const narrationLineHeight = 4.2;

    const printHeader = () => {
      doc.setFontSize(12);
      doc.text("Ledger Report", 105, y, { align: "center" });
      y += 6;

      doc.setFontSize(10);
      doc.text(`Account Code: ${value.AC_CODE}`, 10, y);
      y += 5;
      doc.text(`Account Name: ${value.Ac_Name_E}`, 10, y);
      y += 8;

      doc.setFontSize(9);
      doc.setFont(undefined, "bold");
      doc.text("Type", 10, y);
      doc.text("Doc No", 23, y);
      doc.text("Date", 36, y);
      doc.text("Narration", narrationX, y);
      doc.text("Debit", 122, y, { align: "right" });
      doc.text("Credit", 144, y, { align: "right" });
      doc.text("Balance", 166, y, { align: "right" });
      doc.text("DRCR", 188, y, { align: "right" });
      doc.setFont(undefined, "normal");
      y += 4;
      doc.line(10, y, 200, y);
      y += 2;
    };

    const printTxn = (txn) => {
      const debit = parseFloat(txn.Debit_Amount || 0);
      const credit = parseFloat(txn.Credit_Amount || 0);
      totalDebit += debit;
      totalCredit += credit;
      balance += credit - debit;

      const narrationLines = txn.NARRATION
        ? doc.splitTextToSize(txn.NARRATION, narrationWrapWidth)
        : [];

      const detailLines = [...(txn.detailData || [])];
      detailLines.sort((a, b) => parseFloat(b.AMOUNT || 0) - parseFloat(a.AMOUNT || 0));

      const narrationHeight = narrationLines.length * narrationLineHeight + 2;

      const blockHeightEstimate = 5 + narrationHeight + 5;

      if (y + blockHeightEstimate > 275) {
        doc.addPage();
        pageCount++;
        y = 15;
        printHeader(); // Only print column headings
      }

      // === Main Row
      doc.setFontSize(9);
      doc.text(txn.TRAN_TYPE || "", 10, y);
      doc.text(String(txn.DOC_NO || ""), 23, y);
      doc.text(txn.DOC_DATE || "", 36, y);

      if (!txn.NARRATION) {
        doc.text("-", narrationX, y);
      }

      doc.text(debit > 0 ? formatReadableAmount(debit.toFixed(2)) : "-", 122, y, { align: "right" });
      doc.text(credit > 0 ? formatReadableAmount(credit.toFixed(2)) : "-", 144, y, { align: "right" });
      doc.text(formatReadableAmount(Math.abs(balance).toFixed(2)), 166, y, { align: "right" });
      doc.text(balance >= 0 ? "Dr." : "Cr.", 188, y, { align: "right" });

      y += 5;

      // === Narration
      if (narrationLines.length) {
        doc.setFont(undefined, "italic");
        doc.setFontSize(8);
        narrationLines.forEach((line) => {
          if (y + narrationLineHeight > 275) {
            doc.addPage();
            pageCount++;
            y = 15;
            printHeader();
          }
          doc.text(line, narrationX, y);
          y += narrationLineHeight;
        });
        doc.setFont(undefined, "normal");
        y += 1;
      }

      // === Detail Rows
      let detailIndex = 1;
      detailLines.forEach((d, i) => {
        const acText = `• ${detailIndex++}. ${d.AC_CODE}: ${d.Ac_Name_E}`;
        const amount = parseFloat(d.AMOUNT || 0).toFixed(2);
        const isDebit = d.DRCR === "D";
        const acLines = doc.splitTextToSize(acText, narrationWrapWidth);
        const lineHeightTotal = acLines.length * narrationLineHeight + 1.5 + 1.5;

        if (y + lineHeightTotal > 275) {
          doc.addPage();
          pageCount++;
          y = 15;
          printHeader();
        }

        const amountOffsetY = y + 1.5;

        if (i % 2 === 0) {
          doc.setFillColor(245, 245, 245);
          doc.rect(10, y - 1, 190, lineHeightTotal - 1.5, 'F');
        }

        doc.setFontSize(8);
        acLines.forEach((line, idx) => {
          doc.text(line, narrationX + 2, y);
          if (idx === 0) {
            doc.setFontSize(9);
            doc.text(isDebit ? formatReadableAmount(amount) : "-", 122, amountOffsetY, { align: "right" });
            doc.text(!isDebit ? formatReadableAmount(amount) : "-", 144, amountOffsetY, { align: "right" });
            doc.text("-", 166, amountOffsetY, { align: "right" });
            doc.text(isDebit ? "Dr." : "Cr.", 188, amountOffsetY, { align: "right" });
          }
          y += narrationLineHeight;
        });

        y += 1.5;
      });

      doc.setDrawColor(180);
      doc.line(10, y, 200, y);
      y += 3;
    };

    printHeader();

    const opening = value.transactions.find((t) => t.TRAN_TYPE === "OP");
    if (opening) {
      balance = parseFloat(opening.Balance || 0);
      printTxn(opening);
    }

    value.transactions.forEach((txn) => {
      if (txn.TRAN_TYPE !== "OP") printTxn(txn);
    });

    y += 2;
    doc.line(10, y, 200, y);
    y += 5;
    doc.setFont(undefined, "bold");
    doc.text("Total", 80, y);
    doc.text(formatReadableAmount(totalDebit.toFixed(2)), 122, y, { align: "right" });
    doc.text(formatReadableAmount(totalCredit.toFixed(2)), 144, y, { align: "right" });
    doc.text(formatReadableAmount(Math.abs(balance).toFixed(2)), 166, y, { align: "right" });
    doc.text(balance >= 0 ? "Dr." : "Cr.", 188, y, { align: "right" });
  });

  // === Footer Page Numbers
  const pageTotal = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageTotal; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`Page ${i} of ${pageTotal}`, 105, 290, { align: "center" });
  }

  const blobUrl = doc.output("bloburl");
  setPdfBlobUrl(blobUrl);
  setShowPreview(true);

  setApiData({
    doc_no: `Ledger-${fromDate} to ${toDate}`,
    billtoemail: "",
    BillToWpNo: "",
  });
};


  const handleBack = () => {
    navigate('/ledger');
  };

  const renderLedgerRows = () => {
    const groupedData = ledgerData.reduce((acc, item) => {
      if (!acc[item.AC_CODE]) {
        acc[item.AC_CODE] = { Ac_Name_E: item.Ac_Name_E, transactions: [] };
      }
      acc[item.AC_CODE].transactions.push(item);
      return acc;
    }, {});

    return Object.entries(groupedData).map(([AC_CODE, { Ac_Name_E, transactions }]) => {
      const accountTotals = transactions.reduce(
        (totals, item, index, array) => {
          const debit = parseFloat(item.Debit_Amount || 0);
          const credit = parseFloat(item.Credit_Amount || 0);
          const balance = parseFloat(item.Balance || 0);

          totals.debit += debit;
          totals.credit += credit;

          if (index === array.length - 1) {
            totals.balance = balance;
          }

          return totals;
        },
        { debit: 0, credit: 0, balance: 0 }
      );

      return (
        <div key={AC_CODE}>
          <h3 style={{ fontWeight: 'bold', fontSize: '20px', color: '#333', marginTop: '20px' }}>
            Account Code: <span style={{ color: '#0056b3' }}>{AC_CODE}</span> - {Ac_Name_E}
          </h3>

          <table style={{ marginBottom: "60px" }} id="reportTable">
            <thead>
              <tr style={{ fontWeight: 'bold', textAlign: 'center' }}>
                <th style={{ textAlign: 'center' }}>Trans_Type</th>
                <th style={{ textAlign: 'center' }}>Doc_No</th>
                <th style={{ textAlign: 'center' }}>Doc Date</th>
                <th style={{ textAlign: 'center' }}>Narration</th>
                <th style={{ textAlign: 'center' }}></th>
                <th style={{ textAlign: 'center' }}></th>
                <th style={{ textAlign: 'center' }}></th>
                <th style={{ textAlign: 'center' }}></th>
                <th style={{ textAlign: 'center' }}></th>
                <th style={{ textAlign: 'center' }}></th>
                <th style={{ textAlign: 'center' }}></th>
                <th style={{ textAlign: 'center' }}></th>
                <th style={{ textAlign: 'center' }}></th>
                <th style={{ textAlign: 'center' }}>Debit</th>
                <th style={{ textAlign: 'center' }}>Credit</th>
                <th style={{ textAlign: 'center' }}>Balance</th>
                <th style={{ textAlign: 'center' }}>DRCR</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((item, idx) => (
                <React.Fragment key={idx}>
                  <tr style={{
                    fontWeight: item.TRAN_TYPE === 'OP' ? 'normal' : 'bold',
                    color: item.TRAN_TYPE === 'OP' ? 'green' : 'blue',
                    backgroundColor: item.TRAN_TYPE === 'OP' ? '#ffebee' : '#e0f7fa',
                  }}>
                    <td>{item.TRAN_TYPE}</td>
                    <td>{item.DOC_NO}</td>
                    <td>{item.DOC_DATE}</td>
                    <td>{item.NARRATION}</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td style={{ textAlign: 'right' }}>{formatReadableAmount(parseFloat(item.Debit_Amount || 0).toFixed(2))}</td>
                    <td style={{ textAlign: 'right' }}>{formatReadableAmount(parseFloat(item.Credit_Amount || 0).toFixed(2))}</td>
                    <td style={{ textAlign: 'right' }}>{formatReadableAmount(item.Balance)}</td>
                   <td>{item.DRCR === "D" ? "Dr.":"Cr."}</td>
                  </tr>

                  {item.detailData && item.detailData.length > 0 && item.detailData.map((detail, idx) => (
                    <tr key={idx} style={{ color: 'grey' }}>
                      <td colSpan="4" style={{
                        paddingLeft: "100px",
                        wordWrap: "break-word"
                      }}>{`${detail.AC_CODE} : ${detail.Ac_Name_E}`}</td>
                      <td colSpan="1" >{formatReadableAmount(parseFloat(detail.AMOUNT || 0).toFixed(2))}</td>
                      <td align="right">{detail.Balance}</td>
                      <td style={{ textAlign: 'left' }}>{detail.DRCR === "D" ? "Dr.":"Cr."}</td>
                    </tr>
                  ))}

                </React.Fragment>
              ))}
              <tr style={{ fontWeight: 'bold', backgroundColor: 'yellow' }}>
                <td colSpan="4" style={{ textAlign: 'right' }}>Total:</td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td style={{ textAlign: 'right' }}>{formatReadableAmount(accountTotals.debit.toFixed(2))}</td>
                <td style={{ textAlign: 'right' }}>{formatReadableAmount(accountTotals.credit.toFixed(2))}</td>
                <td style={{ textAlign: 'right' }}>{formatReadableAmount(accountTotals.balance.toFixed(2))}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    });
  };

  return (
    <div className="ledger-report-container">
      <div className="col-auto">
        <button className="btn btn-secondary me-2" onClick={generatePdf}>PDF</button>
        {showPreview && (
  <PdfPreview
    pdfData={pdfBlobUrl}
    apiData={apiData}
    label="GLedger" // must match your `data.json` key
  />
)}
        <button className="btn btn-success" onClick={handleExportToExcel}>Export to Excel</button>
        <button className="btn btn-warning ms-2" onClick={handleBack}>Back</button>
        
      </div>

      <div>
        <p><strong>From Date: {fromDate} To Date: {toDate}</strong></p>
      </div>

      {loading && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
          <RingLoader />
        </div>
      )}
      {error && <p className="error-message">{error}</p>}

      {renderLedgerRows()}
    </div>
  );
};

export default GetAllGledgerReport;