
import React, { useState, useEffect } from "react";
import axios from "axios";
import "../../Reports/TrialBalance/TrialBalance.css";
import * as XLSX from "xlsx";
import "jspdf-autotable";
import { useNavigate, useLocation } from "react-router-dom";
import PdfPreview from "../../../Common/PDFPreview";
import { jsPDF } from "jspdf";
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";
import { ScaleLoader } from 'react-spinners';
import { Typography, } from '@mui/material';
import { KeyboardArrowRight, KeyboardArrowDown } from '@mui/icons-material';
import { FormaDateBalanceSheet } from "../../../Common/FormatFunctions/FormatDate"
import PrintButton from '../../../Common/Buttons/PrintPDF';

const apikey = process.env.REACT_APP_API;

const ProfitLossReport = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const fromDate = searchParams.get("fromDate");
  const toDate = searchParams.get("toDate");
  const gcid = searchParams.get("gcid");
  const groupCode = searchParams.get("groupCode");
  const groupName = searchParams.get("groupName");
  const companyCode = sessionStorage.getItem("Company_Code");
  const Year_Code = sessionStorage.getItem("Year_Code");
  const Company_Name = sessionStorage.getItem("Company_Name")
  const Company_GSTNO = sessionStorage.getItem('Company_GSTNO')
  const CompanyNameUpdatedDate = sessionStorage.getItem("CompanyNameUpdatedDate")
  const newCompanyName = sessionStorage.getItem("newCompanyName")

  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pdfPreview, setPdfPreview] = useState([]);

  // ── ACCORDION STATE ──────────────────────────────────────────────────────────
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [allExpanded, setAllExpanded] = useState(true);

  const API_URL = `${apikey}/ProfitLoss_Report`;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear());
    return `${day}/${month}/${year}`;
  };

  const docDate = new Date(fromDate);
  const cnameUpdatedDate = new Date(CompanyNameUpdatedDate);

  const displayCompanyName =
    docDate < cnameUpdatedDate
      ? newCompanyName
      : Company_Name;

  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await axios.get(API_URL, {
          params: {
            from_date: fromDate,
            to_date: toDate,
            Company_Code: companyCode,
            gcid: gcid
          },
        });
        setReportData(response.data);
      } catch (error) {
        console.error("Error fetching report:", error);
        setError("Error fetching report");
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [API_URL]);

  // ── When data loads, expand all groups by default ────────────────────────────
  useEffect(() => {
    if (reportData.length === 0) return;
    const allKeys = collectAllGroupKeys(reportData);
    setExpandedGroups(new Set(allKeys));
    setAllExpanded(true);
  }, [reportData]);

  // ── ACCORDION HELPERS ────────────────────────────────────────────────────────
  const collectAllGroupKeys = (data) => {
    const keys = new Set();
    const g1 = groupReportData(data);
    const g2 = groupReportDataTradingrigthside(data);
    const g3 = groupReportDataProfitleftside(data);
    const g4 = groupReportDataProfitrigthside(data);
    Object.keys(g1).forEach(k => keys.add(k));
    Object.keys(g2).forEach(k => keys.add(k));
    Object.keys(g3).forEach(k => keys.add(k));
    Object.keys(g4).forEach(k => keys.add(k));
    return [...keys];
  };

  const toggleGroup = (key) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      const allKeys = collectAllGroupKeys(reportData);
      setAllExpanded(allKeys.every(k => next.has(k)));
      return next;
    });
  };

  const handleToggleAll = (checked) => {
    setAllExpanded(checked);
    if (checked) {
      const allKeys = collectAllGroupKeys(reportData);
      setExpandedGroups(new Set(allKeys));
    } else {
      setExpandedGroups(new Set());
    }
  };

  const isExpanded = (key) => expandedGroups.has(key);

  // ── GROUPING FUNCTIONS (unchanged) ──────────────────────────────────────────

  const groupReportData = (data) => {
    const groupedData = {};
    const groupTotals = {};
    data.filter(item => item.group_Type === "T").forEach(item => {
      const key = `${item.group_Type} -${item.BSGroupName}`;
      if (!groupTotals[key]) groupTotals[key] = 0;
      groupTotals[key] += parseFloat(item.Balance) || 0;
    });
    data.filter(item => item.group_Type === "T").forEach(item => {
      const key = `${item.group_Type} -${item.BSGroupName}`;
      if ((groupTotals[key] || 0) <= 0) return;
      if (!groupedData[key]) {
        groupedData[key] = { items: [], totalQty: 0, groupnetvalue: groupTotals[key] };
      }
      groupedData[key].items.push(item);
    });
    return groupedData;
  };

  const groupReportDataTradingrigthside = (data) => {
    const groupedData = {};
    const groupTotals = {};
    data.filter(item => item.group_Type === "T").forEach(item => {
      const key = `${item.group_Type} -${item.BSGroupName}`;
      if (!groupTotals[key]) groupTotals[key] = 0;
      groupTotals[key] += parseFloat(item.Balance) || 0;
    });
    data.filter(item => item.group_Type === "T").forEach(item => {
      const key = `${item.group_Type} -${item.BSGroupName}`;
      if ((groupTotals[key] || 0) >= 0) return;
      if (!groupedData[key]) {
        groupedData[key] = { items: [], totalQty: 0, netgroupvalue: groupTotals[key] };
      }
      groupedData[key].items.push(item);
    });
    return groupedData;
  };

  const groupReportDataProfitleftside = (data) => {
    const groupedData = {};
    const groupTotals = {};
    data.filter(item => item.group_Type === "P").forEach(item => {
      const key = `${item.group_Type} -${item.BSGroupName}`;
      if (!groupTotals[key]) groupTotals[key] = 0;
      groupTotals[key] += parseFloat(item.Balance) || 0;
    });
    data.filter(item => item.group_Type === "P").forEach(item => {
      const key = `${item.group_Type} -${item.BSGroupName}`;
      if ((groupTotals[key] || 0) <= 0) return;
      if (!groupedData[key]) {
        groupedData[key] = { items: [], totalQty: 0, groupnetvalue: groupTotals[key] };
      }
      groupedData[key].items.push(item);
    });

    Object.keys(groupedData).forEach((key) => {
    groupedData[key].items.sort((a, b) =>
      a.Ac_Name_E.localeCompare(b.Ac_Name_E)
    );
  });
    return groupedData;
  };

  const groupReportDataProfitrigthside = (data) => {
    const groupedData = {};
    const groupTotals = {};
    data.filter(item => item.group_Type === "P").forEach(item => {
      const key = `${item.group_Type} -${item.BSGroupName}`;
      if (!groupTotals[key]) groupTotals[key] = 0;
      groupTotals[key] += parseFloat(item.Balance) || 0;
    });
    data.filter(item => item.group_Type === "P").forEach(item => {
      const key = `${item.group_Type} -${item.BSGroupName}`;
      if ((groupTotals[key] || 0) >= 0) return;
      if (!groupedData[key]) {
        groupedData[key] = { items: [], totalQty: 0, netgroupvalue: groupTotals[key] };
      }
      groupedData[key].items.push(item);
    });
    Object.keys(groupedData).forEach((key) => {
    groupedData[key].items.sort((a, b) =>
      a.Ac_Name_E.localeCompare(b.Ac_Name_E)
    );
  });
    return groupedData;
  };

  const groupedReportData = groupReportData(reportData);
  const groupedReportDataRightside = groupReportDataTradingrigthside(reportData);
  const groupReportDataProfitleftsideDebit = groupReportDataProfitleftside(reportData);
  const groupReportDataProfitrigthsidetsideCredit = groupReportDataProfitrigthside(reportData);

  const handleBack = () => {
    navigate("/profit-loss-balance-sheet");
  };


  const handleExportToExcel = () => {
    try {
      const wb = XLSX.utils.book_new();
      const ws_data = [];

      ws_data.push([`${displayCompanyName} - Profit & Loss A/c`]);
      ws_data.push([`Report Period: ${formatDate(fromDate)} to ${formatDate(toDate)}`]);
      ws_data.push([]);
      ws_data.push([
        "Purchase", "", "", "Amount",
        "",
        "Sale", "", "", "Amount"
      ]);

      const leftEntries = Object.entries(groupedReportData);
      const rightEntries = Object.entries(groupedReportDataRightside);
      const maxLen = Math.max(leftEntries.length, rightEntries.length);

      for (let i = 0; i < maxLen; i++) {
        const leftGroup = leftEntries[i]?.[1];
        const rightGroup = rightEntries[i]?.[1];

        ws_data.push([
          leftGroup?.items[0]?.BSGroupName || "",
          "", "", Number(leftGroup?.groupnetvalue?.toFixed(2)) || "",
          "",
          rightGroup?.items[0]?.BSGroupName || "",
          "", "", Number(rightGroup?.netgroupvalue?.toFixed(2)) || ""
        ]);

        const leftExpanded = leftEntries[i] ? isExpanded(leftEntries[i][0]) : false;
        const rightExpanded = rightEntries[i] ? isExpanded(rightEntries[i][0]) : false;
        const maxItems = Math.max(
          leftExpanded ? (leftGroup?.items?.length || 0) : 0,
          rightExpanded ? (rightGroup?.items?.length || 0) : 0
        );

        for (let j = 0; j < maxItems; j++) {
          const leftItem = leftExpanded ? leftGroup?.items[j] : undefined;
          const rightItem = rightExpanded ? rightGroup?.items[j] : undefined;

          ws_data.push([
            "",
            leftItem ? `   ${leftItem.Ac_Name_E}` : "",
            leftItem ? Number(Math.abs(leftItem.Balance).toFixed(2)) : "",
            "",
            "",
            "",
            rightItem ? `   ${rightItem.Ac_Name_E}` : "",
            rightItem ? Number(Math.abs(rightItem.Balance).toFixed(2)) : "",
            ""
          ]);
        }
      }

      const totalPurchase = Object.values(groupedReportData).reduce((a, b) => a + Math.abs(b.groupnetvalue), 0);
      const totalSale = Object.values(groupedReportDataRightside).reduce((a, b) => a + Math.abs(b.netgroupvalue), 0);
      const grossProfit = totalSale - totalPurchase;
      const grossLoss = totalPurchase - totalSale;

      ws_data.push(["Net Purchase", "", "", Number(totalPurchase.toFixed(2)), "", "Net Sale", "", "", Number(totalSale.toFixed(2))]);
      ws_data.push([
        "Gross Profit", "", "", grossProfit > 0 ? Number(grossProfit.toFixed(2)) : "",
        "", "Gross Loss", "", "", grossLoss > 0 ? Number(grossLoss.toFixed(2)) : ""
      ]);
      ws_data.push([
        "Total", "", "", Number((totalPurchase + (grossProfit > 0 ? grossProfit : 0)).toFixed(2)),
        "", "Total", "", "", Number((totalSale + (grossLoss > 0 ? grossLoss : 0)).toFixed(2))
      ]);

      const leftProfitEntries = Object.entries(groupReportDataProfitleftsideDebit);
      const rightProfitEntries = Object.entries(groupReportDataProfitrigthsidetsideCredit);
      const maxProfitLen = Math.max(leftProfitEntries.length, rightProfitEntries.length);

      for (let i = 0; i < maxProfitLen; i++) {
        const leftGroup = leftProfitEntries[i]?.[1];
        const rightGroup = rightProfitEntries[i]?.[1];

        ws_data.push([
          leftGroup?.items[0]?.BSGroupName || "",
          "", "", Number(leftGroup?.groupnetvalue?.toFixed(2)) || "",
          "",
          rightGroup?.items[0]?.BSGroupName || "",
          "", "", Number(rightGroup?.netgroupvalue?.toFixed(2)) || ""
        ]);

        const leftExpanded = leftProfitEntries[i] ? isExpanded(leftProfitEntries[i][0]) : false;
        const rightExpanded = rightProfitEntries[i] ? isExpanded(rightProfitEntries[i][0]) : false;
        const maxItems = Math.max(
          leftExpanded ? (leftGroup?.items?.length || 0) : 0,
          rightExpanded ? (rightGroup?.items?.length || 0) : 0
        );

        for (let j = 0; j < maxItems; j++) {
          const leftItem = leftExpanded ? leftGroup?.items[j] : undefined;
          const rightItem = rightExpanded ? rightGroup?.items[j] : undefined;

          ws_data.push([
            "",
            leftItem ? `   ${leftItem.Ac_Name_E}` : "",
            leftItem ? Number(Math.abs(leftItem.Balance).toFixed(2)) : "",
            "",
            "",
            "",
            rightItem ? `   ${rightItem.Ac_Name_E}` : "",
            rightItem ? Number(Math.abs(rightItem.Balance).toFixed(2)) : "",
            ""
          ]);
        }
      }

      const totalExpense = Object.values(groupReportDataProfitleftsideDebit).reduce((a, b) => a + Math.abs(b.groupnetvalue), 0);
      const totalIncome = Object.values(groupReportDataProfitrigthsidetsideCredit).reduce((a, b) => a + Math.abs(b.netgroupvalue), 0);
      const netProfit = (totalSale + totalIncome) - (totalPurchase + totalExpense);

      ws_data.push(["Total", "", "", Number(totalExpense.toFixed(2)), "", "Total", "", "", Number(totalIncome.toFixed(2))]);
      ws_data.push([
        "Net Profit", "", "", netProfit > 0 ? Number(netProfit.toFixed(2)) : "",
        "", "Net Loss", "", "", netProfit < 0 ? Number((-netProfit).toFixed(2)) : ""
      ]);

      const totalDebit = totalPurchase + totalExpense + (netProfit > 0 ? netProfit : 0);
      const totalCredit = totalSale + totalIncome + (netProfit < 0 ? -netProfit : 0);

      ws_data.push([
        "Total Debit", "", "", Number(totalDebit.toFixed(2)),
        "", "Total Credit", "", "", Number(totalCredit.toFixed(2))
      ]);

      const ws = XLSX.utils.aoa_to_sheet(ws_data);
      ws["!cols"] = [
        { wch: 22 }, { wch: 30 }, { wch: 18 }, { wch: 18 }, { wch: 5 },
        { wch: 22 }, { wch: 30 }, { wch: 18 }, { wch: 18 },
      ];

      const range = XLSX.utils.decode_range(ws['!ref']);
      for (let R = range.s.r; R <= range.e.r; R++) {
        if (R < 4) {
          for (let C = range.s.c; C <= range.e.c; C++) {
            const cell_ref = XLSX.utils.encode_cell({ r: R, c: C });
            if (ws[cell_ref]) {
              ws[cell_ref].s = { font: { bold: true }, alignment: { horizontal: "center" } };
            }
          }
        }
        const cellA = XLSX.utils.encode_cell({ r: R, c: 0 });
        if (ws[cellA] && (
          ws[cellA].v === "Net Purchase" || ws[cellA].v === "Gross Profit" ||
          ws[cellA].v === "Gross Loss" || ws[cellA].v === "Total" ||
          ws[cellA].v === "Net Profit" || ws[cellA].v === "Net Loss" ||
          ws[cellA].v === "Total Debit" || ws[cellA].v === "Total Credit"
        )) {
          for (let C = range.s.c; C <= range.e.c; C++) {
            const cell_ref = XLSX.utils.encode_cell({ r: R, c: C });
            if (ws[cell_ref]) { ws[cell_ref].s = { font: { bold: true } }; }
          }
        }
      }

      XLSX.utils.book_append_sheet(wb, ws, "Profit & Loss");
      XLSX.writeFile(wb, "ProfitLossReport.xlsx");
    } catch (err) {
      console.error("Excel Export Failed:", err);
    }
  };


  const handleRowClick = (acCode, acname) => {
    setLoading(true);
    setTimeout(() => {
      const url = `/ledger-report?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&acCode=${encodeURIComponent(acCode)}&acname=${encodeURIComponent(acname)}`;
      window.open(url, "_blank", "toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=800,height=600");
      setLoading(false);
    }, 500);
  };


  const renderPdf = (outputType = "blob") => {
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });

    const PW = doc.internal.pageSize.width;
    const PH = doc.internal.pageSize.height;
    const M = 25;
    const MID = PW / 2;
    const LH = 13;
    const BOTTOM_LIMIT = PH - 50;

    const L = {
      groupX: M,
      nameX: M + 10,
      amtX: MID - 12,
      nameMaxW: MID - M - 90,
      groupMaxW: MID - M - 70,
    };
    const R = {
      groupX: MID + 10,
      nameX: MID + 20,
      amtX: PW - M,
      nameMaxW: PW - MID - M - 90,
      groupMaxW: PW - MID - M - 70,
    };

    let curY = 0;
    let pageStartY = 0;

    const hLine = (y, lw = 0.5) => {
      doc.setLineWidth(lw);
      doc.line(M, y, PW - M, y);
    };

    const centerLine = (y1, y2) => {
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.3);
      doc.line(MID, y1, MID, y2);
      doc.setDrawColor(0, 0, 0);
    };

    const wrap = (text, maxW, fs) => {
      if (!text) return [""];
      doc.setFontSize(fs);
      const words = String(text).split(" ");
      const lines = [];
      let cur = "";
      for (const w of words) {
        const test = cur ? `${cur} ${w}` : w;
        if (doc.getTextWidth(test) > maxW) {
          if (cur) { lines.push(cur); cur = w; }
          else {
            let part = "";
            for (const ch of w) {
              if (doc.getTextWidth(part + ch) > maxW) { lines.push(part); part = ch; }
              else part += ch;
            }
            if (part) lines.push(part);
          }
        } else cur = test;
      }
      if (cur) lines.push(cur);
      return lines.length ? lines : [""];
    };

    const drawPageHeader = () => {
      let y = 28;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text((displayCompanyName || "").trim(), MID, y, { align: "center" });

// --- ADDED PRINT DATE AT TOP RIGHT ---
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      const printDate = `Print Date: ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
      doc.text(printDate, PW - M, y - 10, { align: "right" });

      y += 13;
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      const gstn = `GSTN : ${Company_GSTNO}`;
      doc.text(gstn, MID, y, { align: "center" });
      const gw = doc.getTextWidth(gstn);
      doc.setLineWidth(0.3);
      doc.line(MID - gw / 2, y + 2, MID + gw / 2, y + 2);
      y += 13;
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Profit & Loss A/c", MID, y, { align: "center" });
      y += 11;
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.text(`${groupCode} - ${groupName}`, MID, y, { align: "center" });
      y += 11;
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      const fmt = (d) => (d || "").split("-").reverse().join("-");
      doc.text(`${fmt(fromDate)} to ${fmt(toDate)}`, MID, y, { align: "center" });
      y += 11;
      hLine(y, 0.7);
      y += 9;
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("Purchase", L.groupX, y);
      doc.text("Amount", L.amtX, y, { align: "right" });
      doc.text("Sale", R.groupX, y);
      doc.text("Amount", R.amtX, y, { align: "right" });
      y += 4;
      hLine(y, 0.5);
      curY = y + 9;
      pageStartY = curY;
    };

    const checkBreak = (need = LH) => {
      if (curY + need > BOTTOM_LIMIT) {
        centerLine(pageStartY, curY + 2);
        doc.addPage();
        drawPageHeader();
      }
    };

    // ── buildRows now respects expanded/collapsed state ──
    const buildRows = (grouped, totalKey) => {
      const rows = [];
      for (const [key, grp] of Object.entries(grouped)) {
        const label = grp.items[0]?.BSGroupName || "";
        rows.push({ type: "group", label, total: grp[totalKey] });
        if (isExpanded(key)) {
          grp.items.forEach((item, idx) => {
            rows.push({ type: "item", item, isLast: idx === grp.items.length - 1 });
          });
        }
      }
      return rows;
    };

    const renderRow = (lRow, rRow) => {
      let lLines = [], rLines = [], lH = LH, rH = LH;

      if (lRow) {
        lLines = lRow.type === "group"
          ? wrap(lRow.label.toUpperCase(), L.groupMaxW, 8.5)
          : wrap(lRow.item.Ac_Name_E.trim().toUpperCase(), L.nameMaxW, 7.5);
        lH = Math.max(LH, lLines.length * LH);
      }
      if (rRow) {
        rLines = rRow.type === "group"
          ? wrap(rRow.label.toUpperCase(), R.groupMaxW, 8.5)
          : wrap(rRow.item.Ac_Name_E.trim().toUpperCase(), R.nameMaxW, 7.5);
        rH = Math.max(LH, rLines.length * LH);
      }

      const rowH = Math.max(lH, rH);
      checkBreak(rowH);

      if (lRow) {
        if (lRow.type === "group") {
          doc.setFontSize(8.5); doc.setFont("helvetica", "bold");
          let ty = curY;
          lLines.forEach(ln => { doc.text(ln, L.groupX, ty); ty += LH; });
          doc.text(formatReadableAmount(Math.abs(lRow.total)), L.amtX, curY + (lLines.length * LH) / 2 - 3, { align: "right" });
        } else {
          doc.setFontSize(7.5); doc.setFont("helvetica", "italic");
          const { item, isLast } = lRow;
          let ty = curY;
          lLines.forEach(ln => { doc.text(ln, L.nameX, ty + 4); ty += LH; });
          const isWrongSide = parseFloat(item.Balance) < 0;
          const amtStr = isWrongSide
            ? `-${formatReadableAmount(Math.abs(item.Balance))}`
            : formatReadableAmount(Math.abs(item.Balance));
          doc.text(amtStr, L.amtX, curY + 4, { align: "right" });
          if (isLast) {
            const aw = doc.getTextWidth(amtStr);
            doc.setLineWidth(0.3);
            doc.line(L.amtX - aw - 6, curY + 6, L.amtX, curY + 6);
          }
        }
      }

      if (rRow) {
        if (rRow.type === "group") {
          doc.setFontSize(8.5); doc.setFont("helvetica", "bold");
          let ty = curY;
          rLines.forEach(ln => { doc.text(ln, R.groupX, ty); ty += LH; });
          doc.text(formatReadableAmount(Math.abs(rRow.total)), R.amtX, curY + (rLines.length * LH) / 2 - 3, { align: "right" });
        } else {
          doc.setFontSize(7.5); doc.setFont("helvetica", "italic");
          const { item, isLast } = rRow;
          let ty = curY;
          rLines.forEach(ln => { doc.text(ln, R.nameX, ty + 4); ty += LH; });
          const isWrongSide = parseFloat(item.Balance) > 0;
          const amtStr = isWrongSide
            ? `-${formatReadableAmount(Math.abs(item.Balance))}`
            : formatReadableAmount(Math.abs(item.Balance));
          doc.text(amtStr, R.amtX, curY + 4, { align: "right" });
          if (isLast) {
            const aw = doc.getTextWidth(amtStr);
            doc.setLineWidth(0.3);
            doc.line(R.amtX - aw - 6, curY + 6, R.amtX, curY + 6);
          }
        }
      }

      curY += rowH + 2;
    };

    const summaryRow = (lLabel, lVal, rLabel, rVal) => {
      checkBreak(LH + 5);
      doc.setFontSize(8.5); doc.setFont("helvetica", "bold");
      if (lLabel) doc.text(lLabel, L.groupX, curY);
      if (lVal !== null && lVal !== undefined)
        doc.text(formatReadableAmount(lVal), L.amtX, curY, { align: "right" });
      if (rLabel) doc.text(rLabel, R.groupX, curY);
      if (rVal !== null && rVal !== undefined)
        doc.text(formatReadableAmount(rVal), R.amtX, curY, { align: "right" });
      curY += LH + 3;
    };

    const totalPurchase = Object.values(groupedReportData).reduce((a, b) => a + Math.abs(b.groupnetvalue), 0);
    const totalSale = Object.values(groupedReportDataRightside).reduce((a, b) => a + Math.abs(b.netgroupvalue), 0);
    const grossProfit = Math.max(totalSale - totalPurchase, 0);
    const grossLoss = Math.max(totalPurchase - totalSale, 0);
    const tradingTotalLeft = totalPurchase + grossProfit;
    const tradingTotalRight = totalSale + grossLoss;
    const profitRightTotal = Object.values(groupReportDataProfitrigthsidetsideCredit).reduce((a, b) => a + Math.abs(b.netgroupvalue), 0);
    const profitLeftTotal = Object.values(groupReportDataProfitleftsideDebit).reduce((a, b) => a + Math.abs(b.groupnetvalue), 0);
    const diffRightMinusLeft = totalSale - totalPurchase;
    const resultRight = profitRightTotal + (diffRightMinusLeft > 0 ? diffRightMinusLeft : 0);
    const diffLeftMinusRight = totalPurchase - totalSale;
    const resultLeft = profitLeftTotal + (diffLeftMinusRight > 0 ? diffLeftMinusRight : 0);
    const netResultRaw = resultRight - resultLeft;
    const netResultVal = parseFloat(netResultRaw.toFixed(2));
    const isNetProfit = netResultVal > 0;
    const netProfitDisplay = isNetProfit ? netResultVal : 0;
    const netLossDisplay = !isNetProfit ? Math.abs(netResultVal) : 0;
    const totalCreditVal = parseFloat(resultRight.toFixed(2)) + (netResultVal < 0 ? Math.abs(netResultVal) : 0);
    const totalDebitVal = parseFloat(resultLeft.toFixed(2)) + (isNetProfit ? netResultVal : 0);

    drawPageHeader();

    const tLRows = buildRows(groupedReportData, "groupnetvalue");
    const tRRows = buildRows(groupedReportDataRightside, "netgroupvalue");
    const tMax = Math.max(tLRows.length, tRRows.length);
    for (let i = 0; i < tMax; i++) renderRow(tLRows[i] || null, tRRows[i] || null);

    curY += 3; hLine(curY, 0.6); curY += 8;
    summaryRow("Net Purchase", totalPurchase, "Net Sale", totalSale);
    hLine(curY - 9, 0.3);
    summaryRow("Gross Profit", grossProfit, "Gross Loss", grossLoss);
    hLine(curY - 9, 0.3);
    summaryRow("Total", tradingTotalLeft, "Total", tradingTotalRight);
    hLine(curY - 9, 0.3);
    curY += 4;
    summaryRow("Gross Loss", grossLoss, "Gross Profit", grossProfit);
    hLine(curY - 9, 0.3);
    curY += 4;

    const pLRows = buildRows(groupReportDataProfitleftsideDebit, "groupnetvalue");
    const pRRows = buildRows(groupReportDataProfitrigthsidetsideCredit, "netgroupvalue");
    const pMax = Math.max(pLRows.length, pRRows.length);
    for (let i = 0; i < pMax; i++) renderRow(pLRows[i] || null, pRRows[i] || null);

    curY += 3; hLine(curY, 0.6); curY += 8;
    summaryRow("Total", resultLeft, "Total", resultRight);
    hLine(curY - 9, 0.3);
    summaryRow("Net Profit", netProfitDisplay, "Net Loss", netLossDisplay);
    hLine(curY - 9, 0.3);
    summaryRow("Total Credit", totalCreditVal, "Total Debit", totalDebitVal);
    hLine(curY - 9, 0.3);
    centerLine(pageStartY, curY);

    if (outputType === "blob") {
      setPdfPreview(URL.createObjectURL(doc.output("blob")));
    } else if (outputType === "print") {
      const pdfBlob = doc.output("blob");
      const blobUrl = URL.createObjectURL(pdfBlob);
      const printWindow = window.open(blobUrl, "_blank");
      if (printWindow) {
        printWindow.addEventListener("load", () => { printWindow.focus(); printWindow.print(); });
      } else {
        const a = document.createElement("a");
        a.href = blobUrl; a.target = "_blank"; a.click();
      }
    }
  };

  const generatePdf = () => renderPdf("blob");
  const handlePrint = () => renderPdf("print");

  function calculateNetResult(
    profitRightSideCreditData,
    profitLeftSideDebitData,
    groupedReportData,
    groupedReportDataRightside,
    threshold = 0
  ) {
    const profitRightSideCreditTotal = Object.values(profitRightSideCreditData).reduce((acc, { netgroupvalue }) => acc + Math.abs(netgroupvalue), 0);
    const leftTotal = Object.values(groupedReportData).reduce((acc, { groupnetvalue }) => acc + Math.abs(groupnetvalue), 0);
    const rightTotal = Object.values(groupedReportDataRightside).reduce((acc, { netgroupvalue }) => acc + Math.abs(netgroupvalue), 0);
    const diffRightMinusLeft = rightTotal - leftTotal;
    const resultRight = profitRightSideCreditTotal + (diffRightMinusLeft > 0 ? diffRightMinusLeft : 0);
    const profitLeftSideDebitTotal = Object.values(profitLeftSideDebitData).reduce((acc, { groupnetvalue }) => acc + Math.abs(groupnetvalue), 0);
    const diffLeftMinusRight = leftTotal - rightTotal;
    const resultLeft = profitLeftSideDebitTotal + (diffLeftMinusRight > 0 ? diffLeftMinusRight : 0);
    const netResult = resultRight - resultLeft;
    return { netResult: netResult.toFixed(2), isGreaterThanThreshold: netResult > threshold };
  }

  return (
    <div style={{ marginTop: "-80px" }}>
      <Typography variant="h6" style={{ textAlign: 'center', fontSize: "24px", fontWeight: "bold" }}>{displayCompanyName}</Typography>
      <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px", textDecoration: 'underline', fontWeight: "550" }}>GSTN : {Company_GSTNO}</Typography>
      <Typography variant="h6" style={{ textAlign: 'center', fontSize: "20px", fontWeight: "bold" }}>Profit & Loss A/c</Typography>
      <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px" }}>{FormaDateBalanceSheet(fromDate)} to {FormaDateBalanceSheet(toDate)}</Typography>

      <div className="d-flex justify-content-end align-items-center" style={{ marginTop: "-60px", gap: "8px" }}>

        {/* ── Expand/Collapse All toggle switch ── */}
        <div
          onClick={() => handleToggleAll(!allExpanded)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            cursor: "pointer",
            userSelect: "none",
            border: "1px solid #ccc",
            borderRadius: "6px",
            padding: "5px 12px",
            height: "32px",
            backgroundColor: "#fff",
          }}
        >
          <div style={{
            width: "34px",
            height: "18px",
            borderRadius: "9px",
            backgroundColor: allExpanded ? "#378ADD" : "#ccc",
            position: "relative",
            transition: "background 0.2s",
            flexShrink: 0,
          }}>
            <div style={{
              width: "13px",
              height: "13px",
              borderRadius: "50%",
              backgroundColor: "#fff",
              position: "absolute",
              top: "2.5px",
              left: allExpanded ? "18.5px" : "2.5px",
              transition: "left 0.2s",
            }} />
          </div>
          <span style={{ fontSize: "13px", fontWeight: "500", color: "#333", minWidth: "74px" }}>
            {allExpanded ? "Collapse all" : "Expand all"}
          </span>
        </div>

        <PrintButton disabledFeild={""} fetchData={handlePrint} />
        <button className="btn btn-success" onClick={handleExportToExcel}>
          Export to Excel
        </button>
        <button onClick={generatePdf} className="btn btn-secondary">
          PDF
        </button>
      </div>

      <div className="table-responsive">
        <table
          className="table table-striped table-bordered mt-4"
          id="reportTable"
          style={{
            width: "100%",
            tableLayout: "fixed",
            marginLeft: "auto",
            marginRight: "auto",
            borderCollapse: "collapse",
          }}
        >
          <thead className="table-light">
            <tr>
              <th colSpan={2} style={{ textAlign: "left", backgroundColor: "#D0E9C6" }}>
                Purchase
              </th>
              <th colSpan={2} style={{ textAlign: "right", backgroundColor: "#D0E9C6" }}>
                Amount
              </th>

              <th colSpan={2} style={{ textAlign: "left", backgroundColor: "#D0E9C6" }}>
                Sale
              </th>
              <th colSpan={2} style={{ textAlign: "right", backgroundColor: "#D0E9C6" }}>
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td align="left" colSpan={4} style={{ verticalAlign: "top", width: "50%", backgroundColor: "#D0E9C6" }}>
                <table style={{ width: "100%", backgroundColor: "#D0E9C6" }}>
                  <tbody>
                    {Object.entries(groupedReportData).map(
                      ([key, { items, groupnetvalue }]) => {
                        const [millname, BSGroupName] = key.split("-");
                        const totalGroupBalance = items
                          .reduce((sum, item) => sum + parseFloat(item.Balance), 0)
                          .toFixed(2);
                        const expanded = isExpanded(key);
                        return (
                          <React.Fragment key={key}>
                            {/* ── Group header — click to toggle ── */}
                            <tr
                              className="table-primary"
                              // style={{ cursor: "pointer", userSelect: "none" }}
                              // onClick={() => toggleGroup(key)}
                              style={{ userSelect: "none" }}
                            >
                              <td style={{ textAlign: "left", color: "black", fontWeight: "bold", whiteSpace: "nowrap" }}>
                                {/* <span style={{
                                  display: "inline-block",
                                  marginRight: "6px",
                                  fontSize: "10px",
                                  color: "#555",
                                  transition: "transform 0.2s",
                                  transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
                                }}>▶</span> */}


                                <span
                                  onClick={() => toggleGroup(key)}
                                  style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", marginRight: "6px" }}
                                >
                                  {expanded
                                    ? <KeyboardArrowDown style={{ fontSize: "18px", color: "#000000" }} />
                                    : <KeyboardArrowRight style={{ fontSize: "18px", color: "#000000" }} />
                                  }
                                </span>
                                {millname} - {BSGroupName}
                              </td>
                              <td style={{ textAlign: "right", color: "black", fontWeight: "bold", whiteSpace: "nowrap", cursor: "text" }}>
                                {formatReadableAmount(Math.abs(totalGroupBalance))}
                              </td>
                            </tr>

                            {/* ── Item rows — only when expanded ── */}
                            {expanded && items.map((item, index) => {
                              const isLast = index === items.length - 1;
                              const isWrongSide = parseFloat(item.Balance) < 0;
                              const displayAmt = isWrongSide
                                ? `-${formatReadableAmount(Math.abs(item.Balance))}`
                                : formatReadableAmount(Math.abs(item.Balance));
                              return (
                                <tr key={index}>
                                  <td
                                    onClick={() => handleRowClick(item.AC_CODE, item.Ac_Name_E)}
                                    style={{ textAlign: "left", whiteSpace: "nowrap", color: "black", fontStyle: "italic", cursor: "pointer" }}
                                  >
                                    {item.Ac_Name_E}
                                  </td>
                                  <td style={{ textAlign: "right", color: "black", paddingRight: "160px" }}>
                                    <span style={{
                                      display: "inline-block",
                                      fontStyle: "normal",
                                      fontWeight: "normal",
                                      borderBottom: isLast ? "2px solid black" : "none",
                                      paddingBottom: "2px",
                                      fontStyle: "italic",
                                      cursor: "text"
                                    }}>
                                      {displayAmt}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </td>

              <td align="left" colSpan={4} style={{ verticalAlign: "top", width: "50%", backgroundColor: "#D0E9C6" }}>
                <table style={{ width: "100%", backgroundColor: "#D0E9C6" }}>
                  <tbody>
                    {Object.entries(groupedReportDataRightside).map(
                      ([key, { items, netgroupvalue }]) => {
                        const [millname, BSGroupName] = key.split("-");
                        const totalGroupBalance = items
                          .reduce((sum, item) => sum + parseFloat(item.Balance), 0)
                          .toFixed(2);
                        const expanded = isExpanded(key);
                        return (
                          <React.Fragment key={key}>
                            {/* ── Group header — click to toggle ── */}
                            <tr
                              className="table-primary"
                              // style={{ cursor: "pointer", userSelect: "none" }}
                              // onClick={() => toggleGroup(key)}
                              style={{ userSelect: "none" }}
                            >
                              <td style={{ textAlign: "left", color: "black", fontWeight: "bold", whiteSpace: "nowrap" }}>
                                {/* <span style={{
                                  display: "inline-block",
                                  marginRight: "6px",
                                  fontSize: "10px",
                                  color: "#555",
                                  transition: "transform 0.2s",
                                  transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
                                }}>▶</span> */}
                                <span
                                  onClick={() => toggleGroup(key)}
                                  style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", marginRight: "6px" }}
                                >
                                  {expanded
                                    ? <KeyboardArrowDown style={{ fontSize: "18px", color: "#000000" }} />
                                    : <KeyboardArrowRight style={{ fontSize: "18px", color: "#000000" }} />
                                  }
                                </span>
                                {millname} - {BSGroupName}
                              </td>
                              <td style={{ textAlign: "right", color: "black", fontWeight: "bold", whiteSpace: "nowrap", cursor: "text" }}>
                                {formatReadableAmount(Math.abs(totalGroupBalance))}
                              </td>
                            </tr>

                            {/* ── Item rows — only when expanded ── */}
                            {expanded && items.map((item, index) => {
                              const isLast = index === items.length - 1;
                              const isWrongSide = parseFloat(item.Balance) > 0;
                              const displayAmt = isWrongSide
                                ? `-${formatReadableAmount(Math.abs(item.Balance))}`
                                : formatReadableAmount(Math.abs(item.Balance));
                              return (
                                <tr key={index}>
                                  <td
                                    onClick={() => handleRowClick(item.AC_CODE, item.Ac_Name_E)}
                                    style={{ textAlign: "left", paddingLeft: "10px", whiteSpace: "nowrap", color: "black", fontStyle: "italic", cursor: "pointer" }}
                                  >
                                    {item.Ac_Name_E}
                                  </td>
                                  <td style={{ textAlign: "right", color: "black", paddingRight: "160px" }}>
                                    <span style={{
                                      display: "inline-block",
                                      borderBottom: isLast ? "2px solid black" : "none",
                                      paddingBottom: isLast ? "2px" : "0",
                                      fontStyle: "italic"
                                    }}>
                                      {displayAmt}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </td>
            </tr>

            <tr>
              <td align="left" colSpan={4} style={{ verticalAlign: "top", width: "50%", backgroundColor: "#D0E9C6" }}>
                <table style={{ width: "100%" }}>
                  <tr>
                    <td className="fw-bold" style={{ color: "black", width: "70%" }} align="left">Net Purchase</td>
                    <td className="fw-bold" style={{ color: "black", width: "70%" }} align="right">
                      {formatReadableAmount(Object.values(groupedReportData).reduce((acc, { groupnetvalue }) => acc + Math.abs(groupnetvalue), 0))}
                    </td>
                  </tr>
                </table>
              </td>
              <td align="left" colSpan={4} style={{ width: "100%", backgroundColor: "#D0E9C6" }}>
                <table style={{ width: "100%", backgroundColor: "#D0E9C6" }}>
                  <tr>
                    <td className="fw-bold" style={{ width: "100%", backgroundColor: "#D0E9C6" }}>Net Sale</td>
                    <td className="fw-bold" style={{ color: "black", width: "100%", backgroundColor: "#D0E9C6" }} align="right">
                      {formatReadableAmount(Object.values(groupedReportDataRightside).reduce((acc, { netgroupvalue }) => acc + Math.abs(netgroupvalue), 0))}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="left" colSpan={4} style={{ verticalAlign: "top", width: "50%", backgroundColor: "#D0E9C6" }}>
                <table style={{ width: "100%" }}>
                  <tr>
                    <td className="fw-bold" style={{ color: "black", width: "70%" }} align="left">Gross Profit</td>
                    <td className="fw-bold" style={{ color: "black", width: "70%" }} align="right">
                      {(() => {
                        const totalRightSide = Object.values(groupedReportDataRightside).reduce((acc, { netgroupvalue }) => acc + Math.abs(netgroupvalue), 0);
                        const totalLeftSide = Object.values(groupedReportData).reduce((acc, { groupnetvalue }) => acc + Math.abs(groupnetvalue), 0);
                        const difference = totalRightSide - totalLeftSide;
                        return formatReadableAmount(difference > 0 ? difference.toFixed(2) : "0.00");
                      })()}
                    </td>
                  </tr>
                </table>
              </td>
              <td align="left" colSpan={4} style={{ verticalAlign: "top", width: "50%", backgroundColor: "#D0E9C6" }}>
                <table style={{ width: "100%" }}>
                  <tr>
                    <td className="fw-bold" style={{ color: "black", width: "70%" }} align="left">Gross Loss</td>
                    <td className="fw-bold" style={{ color: "black", width: "70%" }} align="right">
                      {(() => {
                        const totalLeftSide = Object.values(groupedReportData).reduce((acc, { groupnetvalue }) => acc + Math.abs(groupnetvalue), 0);
                        const totalRightSide = Object.values(groupedReportDataRightside).reduce((acc, { netgroupvalue }) => acc + Math.abs(netgroupvalue), 0);
                        const difference = totalLeftSide - totalRightSide;
                        return formatReadableAmount(difference > 0 ? difference.toFixed(2) : "0.00");
                      })()}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td align="left" colSpan={4} style={{ verticalAlign: "top", width: "50%", backgroundColor: "#D0E9C6" }}>
                <table style={{ width: "100%" }}>
                  <tr>
                    <td className="fw-bold" style={{ color: "black", width: "70%" }} align="left">Total</td>
                    <td className="fw-bold" style={{ color: "black", width: "70%" }} align="right">
                      {(() => {
                        const leftTotal = Object.values(groupedReportData).reduce((acc, { groupnetvalue }) => acc + Math.abs(groupnetvalue), 0);
                        const rightTotal = Object.values(groupedReportDataRightside).reduce((acc, { netgroupvalue }) => acc + Math.abs(netgroupvalue), 0);
                        const diff = rightTotal - leftTotal;
                        const result = leftTotal + (diff > 0 ? diff : 0);
                        return formatReadableAmount(result);
                      })()}
                    </td>
                  </tr>
                </table>
              </td>
              <td align="left" colSpan={4} style={{ verticalAlign: "top", width: "50%", backgroundColor: "#D0E9C6" }}>
                <table style={{ width: "100%" }}>
                  <tr>
                    <td className="fw-bold" style={{ color: "black", width: "70%" }} align="left">Total</td>
                    <td className="fw-bold" style={{ color: "black", width: "70%" }} align="right">
                      {(() => {
                        const rightTotal = Object.values(groupedReportDataRightside).reduce((acc, { netgroupvalue }) => acc + Math.abs(netgroupvalue), 0);
                        const leftTotal = Object.values(groupedReportData).reduce((acc, { groupnetvalue }) => acc + Math.abs(groupnetvalue), 0);
                        const diff = leftTotal - rightTotal;
                        const result = diff > 0 ? diff : 0;
                        return (formatReadableAmount(rightTotal + result));
                      })()}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="left" colSpan={4} style={{ verticalAlign: "top", width: "50%", backgroundColor: "#D0E9C6" }}>
                <table style={{ width: "100%" }}>
                  <tr>
                    <td className="fw-bold" style={{ width: "70%" }} align="left">Gross Loss</td>
                    <td className="fw-bold" style={{ width: "70%" }} align="right">
                      {(() => {
                        const totalLeftSide = Object.values(groupedReportData).reduce((acc, { groupnetvalue }) => acc + Math.abs(groupnetvalue), 0);
                        const totalRightSide = Object.values(groupedReportDataRightside).reduce((acc, { netgroupvalue }) => acc + Math.abs(netgroupvalue), 0);
                        const difference = totalLeftSide - totalRightSide;
                        return formatReadableAmount(difference > 0 ? difference.toFixed(2) : "0.00");
                      })()}
                    </td>
                  </tr>
                </table>
              </td>
              <td align="left" colSpan={4} style={{ verticalAlign: "top", width: "50%", backgroundColor: "#D0E9C6" }}>
                <table style={{ width: "100%" }}>
                  <tr>
                    <td className="fw-bold" style={{ width: "70%" }} align="left">Gross Profit</td>
                    <td className="fw-bold" style={{ width: "70%" }} align="right">
                      {(() => {
                        const totalRightSide = Object.values(groupedReportDataRightside).reduce((acc, { netgroupvalue }) => acc + Math.abs(netgroupvalue), 0);
                        const totalLeftSide = Object.values(groupedReportData).reduce((acc, { groupnetvalue }) => acc + Math.abs(groupnetvalue), 0);
                        const difference = totalRightSide - totalLeftSide;
                        return formatReadableAmount(difference > 0 ? difference.toFixed(2) : "0.00");
                      })()}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td align="left" colSpan={4} style={{ verticalAlign: "top", width: "50%", backgroundColor: "#D0E9C6" }}>
                <table style={{ width: "100%" }}>
                  <tr>
                    <td>
                      {Object.entries(groupReportDataProfitleftsideDebit).map(
                        ([key, { items, groupnetvalue }]) => {
                          const [millname, BSGroupName] = key.split("-");
                          const totalGroupBalance = items
                            .reduce((sum, item) => sum + parseFloat(item.Balance), 0)
                            .toFixed(2);
                          const expanded = isExpanded(key);
                          return (
                            <React.Fragment key={key}>
                              {/* ── Group header — click to toggle ── */}
                              <tr
                                className="table-primary header-row"
                                // style={{ cursor: "pointer", userSelect: "none" }}
                                // onClick={() => toggleGroup(key)}
                                style={{ userSelect: "none" }}
                              >
                                <td style={{ width: "30%", align: "left", color: "black", fontWeight: "bold" }}>
                                  {/* <span style={{
                                    display: "inline-block",
                                    marginRight: "6px",
                                    fontSize: "10px",
                                    color: "#555",
                                    transition: "transform 0.2s",
                                    transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
                                  }}>▶</span> */}

                                  <span
                                    onClick={() => toggleGroup(key)}
                                    style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", marginRight: "6px" }}
                                  >
                                    {expanded
                                      ? <KeyboardArrowDown style={{ fontSize: "18px", color: "#000000" }} />
                                      : <KeyboardArrowRight style={{ fontSize: "18px", color: "#000000" }} />
                                    }
                                  </span>
                                  {millname} - {BSGroupName}
                                </td>
                                <td align="right" style={{ color: "black", fontWeight: "bold", textAlign: "right", paddingLeft: "482px", cursor: "text" }}>
                                  {formatReadableAmount(Math.abs(totalGroupBalance))}
                                </td>
                              </tr>

                              {/* ── Item rows — only when expanded ── */}
                              {expanded && items.map((item, index) => {
                                const isLast = index === items.length - 1;
                                const isWrongSide = parseFloat(item.Balance) < 0;
                                const displayAmt = isWrongSide
                                  ? `-${formatReadableAmount(Math.abs(item.Balance))}`
                                  : formatReadableAmount(Math.abs(item.Balance));
                                return (
                                  <tr key={index}>
                                    <td onClick={() => handleRowClick(item.AC_CODE, item.Ac_Name_E)} style={{ fontStyle: "italic", cursor: "pointer" }}>
                                      {item.Ac_Name_E}
                                    </td>
                                    <td align="right" style={{ paddingRight: "160px", textAlign: "right", color: "black", fontWeight: "normal", fontStyle: "italic" }}>
                                      <span style={{ display: "inline-block", borderBottom: isLast ? "2px solid black" : "none", paddingBottom: isLast ? "2px" : "0", fontStyle: "italic" }}>
                                        {displayAmt}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </React.Fragment>
                          );
                        }
                      )}
                    </td>
                  </tr>
                </table>
              </td>
              <td align="center" colSpan={4} style={{ verticalAlign: "top", width: "50%", backgroundColor: "#D0E9C6" }}>
                <table style={{ width: "100%" }}>
                  <tr>
                    <td>
                      {Object.entries(groupReportDataProfitrigthsidetsideCredit).map(([key, { items, netgroupvalue }]) => {
                        const [millname, BSGroupName] = key.split("-");
                        const totalGroupBalance = items
                          .reduce((sum, item) => sum + parseFloat(item.Balance), 0)
                          .toFixed(2);
                        const expanded = isExpanded(key);
                        return (
                          <React.Fragment key={key}>
                            {/* ── Group header — click to toggle ── */}
                            <tr
                              // style={{ cursor: "pointer", userSelect: "none" }}
                              // onClick={() => toggleGroup(key)}
                              style={{ userSelect: "none" }}
                            >
                              <td align="left" style={{ color: "black", fontWeight: "bold", textAlign: "left" }}>
                                {/* <span style={{
                                  display: "inline-block",
                                  marginRight: "6px",
                                  fontSize: "10px",
                                  color: "#555",
                                  transition: "transform 0.2s",
                                  transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
                                }}>▶</span> */}

                                <span
                                  onClick={() => toggleGroup(key)}
                                  style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", marginRight: "6px" }}
                                >
                                  {expanded
                                    ? <KeyboardArrowDown style={{ fontSize: "18px", color: "#000000" }} />
                                    : <KeyboardArrowRight style={{ fontSize: "18px", color: "#000000" }} />
                                  }
                                </span>
                                {millname} - {BSGroupName}
                              </td>
                              <td align="right" style={{ color: "black", fontWeight: "bold", textAlign: "right", paddingLeft: "482px", cursor: "text" }}>
                                {formatReadableAmount(Math.abs(totalGroupBalance))}
                              </td>
                            </tr>

                            {/* ── Item rows — only when expanded ── */}
                            {expanded && items.map((item, index) => {
                              const isLast = index === items.length - 1;
                              const isWrongSide = parseFloat(item.Balance) > 0;
                              const displayAmt = isWrongSide
                                ? `-${formatReadableAmount(Math.abs(item.Balance))}`
                                : formatReadableAmount(Math.abs(item.Balance));
                              return (
                                <tr key={index}>
                                  <td onClick={() => handleRowClick(item.AC_CODE, item.Ac_Name_E)} style={{ fontStyle: "italic", cursor: "pointer" }}>
                                    {item.Ac_Name_E}
                                  </td>
                                  <td align="right" style={{ paddingRight: "160px", textAlign: "right", color: "black", fontWeight: "normal", fontStyle: "italic" }}>
                                    <span style={{ display: "inline-block", borderBottom: isLast ? "2px solid black" : "none", paddingBottom: isLast ? "2px" : "0" }}>
                                      {displayAmt}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        );
                      })}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td align="left" colSpan={4} style={{ width: "100%", backgroundColor: "#D0E9C6" }}>
                <table style={{ width: "100%" }}>
                  <tr>
                    <td className="fw-bold" style={{ color: "black", width: "70%" }} align="left">Total</td>
                    <td className="fw-bold" style={{ color: "black", width: "70%" }} align="right">
                      {(() => {
                        const profitLeftSideDebitTotal = Object.values(groupReportDataProfitleftsideDebit).reduce((acc, { groupnetvalue }) => acc + Math.abs(groupnetvalue), 0);
                        const leftTotal = Object.values(groupedReportData).reduce((acc, { groupnetvalue }) => acc + Math.abs(groupnetvalue), 0);
                        const rightTotal = Object.values(groupedReportDataRightside).reduce((acc, { netgroupvalue }) => acc + Math.abs(netgroupvalue), 0);
                        const diff = leftTotal - rightTotal;
                        const result = profitLeftSideDebitTotal + (diff > 0 ? diff : 0);
                        return formatReadableAmount(result);
                      })()}
                    </td>
                  </tr>
                </table>
              </td>
              <td align="left" colSpan={4} style={{ width: "100%", backgroundColor: "#D0E9C6" }}>
                <table style={{ width: "100%" }}>
                  <tr>
                    <td className="fw-bold" style={{ color: "black", width: "70%" }} align="left">Total</td>
                    <td className="fw-bold" style={{ color: "black", width: "70%" }} align="right">
                      {(() => {
                        const profitRightSideCreditTotal = Object.values(groupReportDataProfitrigthsidetsideCredit).reduce((acc, { netgroupvalue }) => acc + Math.abs(netgroupvalue), 0);
                        const leftTotal = Object.values(groupedReportData).reduce((acc, { groupnetvalue }) => acc + Math.abs(groupnetvalue), 0);
                        const rightTotal = Object.values(groupedReportDataRightside).reduce((acc, { netgroupvalue }) => acc + Math.abs(netgroupvalue), 0);
                        const diff = rightTotal - leftTotal;
                        const result = profitRightSideCreditTotal + (diff > 0 ? diff : 0);
                        return formatReadableAmount(result);
                      })()}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="left" colSpan={4} style={{ width: "100%", backgroundColor: "#D0E9C6" }}>
                <table style={{ width: "100%" }}>
                  <tr>
                    <td className="fw-bold" style={{ color: "black", width: "70%" }} align="left">Net Profit</td>
                    <td className="fw-bold" style={{ color: "black", width: "70%" }} align="right">
                      {(() => {
                        const { netResult, isGreaterThanThreshold } = calculateNetResult(groupReportDataProfitrigthsidetsideCredit, groupReportDataProfitleftsideDebit, groupedReportData, groupedReportDataRightside, 0);
                        return isGreaterThanThreshold ? ` ${formatReadableAmount(netResult)}` : "";
                      })()}
                    </td>
                  </tr>
                </table>
              </td>
              <td align="left" colSpan={4} style={{ width: "100%", backgroundColor: "#D0E9C6" }}>
                <table style={{ width: "100%" }}>
                  <tr>
                    <td className="fw-bold" style={{ color: "black", width: "70%" }} align="left">Net Loss</td>
                    <td className="fw-bold" style={{ color: "black", width: "70%" }} align="right">
                      {(() => {
                        const { netResult, isGreaterThanThreshold } = calculateNetResult(groupReportDataProfitrigthsidetsideCredit, groupReportDataProfitleftsideDebit, groupedReportData, groupedReportDataRightside, 0);
                        return !isGreaterThanThreshold ? ` ${formatReadableAmount(Math.abs(netResult))}` : "";
                      })()}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td align="left" colSpan={4} style={{ width: "100%", backgroundColor: "#D0E9C6" }}>
                <table style={{ width: "100%" }}>
                  <tr>
                    <td className="fw-bold" style={{ color: "black", width: "70%" }} align="left">Total Credit</td>
                    <td className="fw-bold" style={{ color: "black", width: "70%" }} align="right">
                      {(() => {
                        const profitRightSideCreditTotal = Object.values(groupReportDataProfitrigthsidetsideCredit).reduce((acc, { netgroupvalue }) => acc + Math.abs(netgroupvalue), 0);
                        const leftTotal = Object.values(groupedReportData).reduce((acc, { groupnetvalue }) => acc + Math.abs(groupnetvalue), 0);
                        const rightTotal = Object.values(groupedReportDataRightside).reduce((acc, { netgroupvalue }) => acc + Math.abs(netgroupvalue), 0);
                        const diff = rightTotal - leftTotal;
                        const result = profitRightSideCreditTotal + (diff > 0 ? diff : 0);
                        const { netResult, isGreaterThanThreshold } = calculateNetResult(groupReportDataProfitrigthsidetsideCredit, groupReportDataProfitleftsideDebit, groupedReportData, groupedReportDataRightside, 0);
                        const finalResult = parseFloat(result.toFixed(2)) + (isGreaterThanThreshold < 0 ? parseFloat(netResult) : 0);
                        return formatReadableAmount(finalResult);
                      })()}
                    </td>
                  </tr>
                </table>
              </td>
              <td align="left" colSpan={4} style={{ width: "100%", backgroundColor: "#D0E9C6" }}>
                <table style={{ width: "100%" }}>
                  <tr>
                    <td className="fw-bold" style={{ color: "black", width: "70%" }} align="left">Total Debit</td>
                    <td className="fw-bold" style={{ color: "black", width: "70%" }} align="right">
                      {(() => {
                        const { netResult, isGreaterThanThreshold } = calculateNetResult(groupReportDataProfitrigthsidetsideCredit, groupReportDataProfitleftsideDebit, groupedReportData, groupedReportDataRightside, 0);
                        const profitLeftSideDebitTotal = Object.values(groupReportDataProfitleftsideDebit).reduce((acc, { groupnetvalue }) => acc + Math.abs(groupnetvalue), 0);
                        const leftTotal = Object.values(groupedReportData).reduce((acc, { groupnetvalue }) => acc + Math.abs(groupnetvalue), 0);
                        const rightTotal = Object.values(groupedReportDataRightside).reduce((acc, { netgroupvalue }) => acc + Math.abs(netgroupvalue), 0);
                        const diff = leftTotal - rightTotal;
                        const resultLeft = profitLeftSideDebitTotal + (diff > 0 ? diff : 0);
                        const finalResult = parseFloat(resultLeft.toFixed(2)) + (isGreaterThanThreshold ? parseFloat(netResult) : 0);
                        return formatReadableAmount(finalResult);
                      })()}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
        <div className="centered-container">
          {pdfPreview && pdfPreview.length > 0 && (
            <PdfPreview pdfData={pdfPreview} apiData={reportData} label={"ProfitNLoss"} />
          )}
        </div>
      </div>
      {loading && (
        <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 9999 }}>
           <ScaleLoader color="#1005ad" height={35} width={4} radius={2} margin={2} />
        </div>
      )}
    </div>
  );
};

export default ProfitLossReport;
















// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import "../../Reports/TrialBalance/TrialBalance.css";
// import * as XLSX from "xlsx";
// import "jspdf-autotable";
// import { useNavigate, useLocation } from "react-router-dom";
// import PdfPreview from "../../../Common/PDFPreview";
// import { jsPDF } from "jspdf";
// import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";
// import { ScaleLoader } from 'react-spinners';
// import { Typography, } from '@mui/material';
// import { KeyboardArrowRight, KeyboardArrowDown } from '@mui/icons-material';
// import { FormaDateBalanceSheet } from "../../../Common/FormatFunctions/FormatDate"
// import PrintButton from '../../../Common/Buttons/PrintPDF';

// const apikey = process.env.REACT_APP_API;

// const ProfitLossReport = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const searchParams = new URLSearchParams(location.search);
//   const fromDate = searchParams.get("fromDate");
//   const toDate = searchParams.get("toDate");
//   const gcid = searchParams.get("gcid");
//   const groupCode = searchParams.get("groupCode");
//   const groupName = searchParams.get("groupName");
//   const companyCode = sessionStorage.getItem("Company_Code");
//   const Year_Code = sessionStorage.getItem("Year_Code");
//   const Company_Name = sessionStorage.getItem("Company_Name")
//   const Company_GSTNO = sessionStorage.getItem('Company_GSTNO')
//   const CompanyNameUpdatedDate = sessionStorage.getItem("CompanyNameUpdatedDate")
//   const newCompanyName = sessionStorage.getItem("newCompanyName")

//   const [reportData, setReportData] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [pdfPreview, setPdfPreview] = useState([]);

//   // ── ACCORDION STATE ──────────────────────────────────────────────────────────
//   const [expandedGroups, setExpandedGroups] = useState(new Set());
//   const [allExpanded, setAllExpanded] = useState(true);

//   const API_URL = `${apikey}/ProfitLoss_Report`;

//   const formatDate = (dateString) => {
//     const date = new Date(dateString);
//     const day = String(date.getDate()).padStart(2, "0");
//     const month = String(date.getMonth() + 1).padStart(2, "0");
//     const year = String(date.getFullYear());
//     return `${day}/${month}/${year}`;
//   };

//   const docDate = new Date(fromDate);
//   const cnameUpdatedDate = new Date(CompanyNameUpdatedDate);

//   const displayCompanyName =
//     docDate < cnameUpdatedDate
//       ? newCompanyName
//       : Company_Name;

//   useEffect(() => {
//     const fetchReportData = async () => {
//       setLoading(true);
//       setError("");
//       try {
//         const response = await axios.get(API_URL, {
//           params: {
//             from_date: fromDate,
//             to_date: toDate,
//             Company_Code: companyCode,
//             gcid: gcid
//           },
//         });
//         setReportData(response.data);
//       } catch (error) {
//         console.error("Error fetching report:", error);
//         setError("Error fetching report");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchReportData();
//   }, [API_URL]);

//   // ── When data loads, expand all groups by default ────────────────────────────
//   useEffect(() => {
//     if (reportData.length === 0) return;
//     const allKeys = collectAllGroupKeys(reportData);
//     setExpandedGroups(new Set(allKeys));
//     setAllExpanded(true);
//   }, [reportData]);

//   // ── ACCORDION HELPERS ────────────────────────────────────────────────────────
//   const collectAllGroupKeys = (data) => {
//     const keys = new Set();
//     const g1 = groupReportData(data);
//     const g2 = groupReportDataTradingrigthside(data);
//     const g3 = groupReportDataProfitleftside(data);
//     const g4 = groupReportDataProfitrigthside(data);
//     Object.keys(g1).forEach(k => keys.add(k));
//     Object.keys(g2).forEach(k => keys.add(k));
//     Object.keys(g3).forEach(k => keys.add(k));
//     Object.keys(g4).forEach(k => keys.add(k));
//     return [...keys];
//   };

//   const toggleGroup = (key) => {
//     setExpandedGroups(prev => {
//       const next = new Set(prev);
//       if (next.has(key)) {
//         next.delete(key);
//       } else {
//         next.add(key);
//       }
//       const allKeys = collectAllGroupKeys(reportData);
//       setAllExpanded(allKeys.every(k => next.has(k)));
//       return next;
//     });
//   };

//   const handleToggleAll = (checked) => {
//     setAllExpanded(checked);
//     if (checked) {
//       const allKeys = collectAllGroupKeys(reportData);
//       setExpandedGroups(new Set(allKeys));
//     } else {
//       setExpandedGroups(new Set());
//     }
//   };

//   const isExpanded = (key) => expandedGroups.has(key);

//   // ── GROUPING FUNCTIONS (unchanged) ──────────────────────────────────────────

//   const groupReportData = (data) => {
//     const groupedData = {};
//     const groupTotals = {};
//     data.filter(item => item.group_Type === "T").forEach(item => {
//       const key = `${item.group_Type} -${item.BSGroupName}`;
//       if (!groupTotals[key]) groupTotals[key] = 0;
//       groupTotals[key] += parseFloat(item.Balance) || 0;
//     });
//     data.filter(item => item.group_Type === "T").forEach(item => {
//       const key = `${item.group_Type} -${item.BSGroupName}`;
//       if ((groupTotals[key] || 0) <= 0) return;
//       if (!groupedData[key]) {
//         groupedData[key] = { items: [], totalQty: 0, groupnetvalue: groupTotals[key] };
//       }
//       groupedData[key].items.push(item);
//     });
//     return groupedData;
//   };

//   const groupReportDataTradingrigthside = (data) => {
//     const groupedData = {};
//     const groupTotals = {};
//     data.filter(item => item.group_Type === "T").forEach(item => {
//       const key = `${item.group_Type} -${item.BSGroupName}`;
//       if (!groupTotals[key]) groupTotals[key] = 0;
//       groupTotals[key] += parseFloat(item.Balance) || 0;
//     });
//     data.filter(item => item.group_Type === "T").forEach(item => {
//       const key = `${item.group_Type} -${item.BSGroupName}`;
//       if ((groupTotals[key] || 0) >= 0) return;
//       if (!groupedData[key]) {
//         groupedData[key] = { items: [], totalQty: 0, netgroupvalue: groupTotals[key] };
//       }
//       groupedData[key].items.push(item);
//     });
//     return groupedData;
//   };

//   const groupReportDataProfitleftside = (data) => {
//     const groupedData = {};
//     const groupTotals = {};
//     data.filter(item => item.group_Type === "P").forEach(item => {
//       const key = `${item.group_Type} -${item.BSGroupName}`;
//       if (!groupTotals[key]) groupTotals[key] = 0;
//       groupTotals[key] += parseFloat(item.Balance) || 0;
//     });
//     data.filter(item => item.group_Type === "P").forEach(item => {
//       const key = `${item.group_Type} -${item.BSGroupName}`;
//       if ((groupTotals[key] || 0) <= 0) return;
//       if (!groupedData[key]) {
//         groupedData[key] = { items: [], totalQty: 0, groupnetvalue: groupTotals[key] };
//       }
//       groupedData[key].items.push(item);
//     });
//     return groupedData;
//   };

//   const groupReportDataProfitrigthside = (data) => {
//     const groupedData = {};
//     const groupTotals = {};
//     data.filter(item => item.group_Type === "P").forEach(item => {
//       const key = `${item.group_Type} -${item.BSGroupName}`;
//       if (!groupTotals[key]) groupTotals[key] = 0;
//       groupTotals[key] += parseFloat(item.Balance) || 0;
//     });
//     data.filter(item => item.group_Type === "P").forEach(item => {
//       const key = `${item.group_Type} -${item.BSGroupName}`;
//       if ((groupTotals[key] || 0) >= 0) return;
//       if (!groupedData[key]) {
//         groupedData[key] = { items: [], totalQty: 0, netgroupvalue: groupTotals[key] };
//       }
//       groupedData[key].items.push(item);
//     });
//     return groupedData;
//   };

//   const groupedReportData = groupReportData(reportData);
//   const groupedReportDataRightside = groupReportDataTradingrigthside(reportData);
//   const groupReportDataProfitleftsideDebit = groupReportDataProfitleftside(reportData);
//   const groupReportDataProfitrigthsidetsideCredit = groupReportDataProfitrigthside(reportData);

//   const handleBack = () => {
//     navigate("/profit-loss-balance-sheet");
//   };


//   const handleExportToExcel = () => {
//     try {
//       const wb = XLSX.utils.book_new();
//       const ws_data = [];

//       ws_data.push([`${displayCompanyName} - Profit & Loss A/c`]);
//       ws_data.push([`Report Period: ${formatDate(fromDate)} to ${formatDate(toDate)}`]);
//       ws_data.push([]);
//       ws_data.push([
//         "Purchase", "", "", "Amount",
//         "",
//         "Sale", "", "", "Amount"
//       ]);

//       const leftEntries = Object.entries(groupedReportData);
//       const rightEntries = Object.entries(groupedReportDataRightside);
//       const maxLen = Math.max(leftEntries.length, rightEntries.length);

//       for (let i = 0; i < maxLen; i++) {
//         const leftGroup = leftEntries[i]?.[1];
//         const rightGroup = rightEntries[i]?.[1];

//         ws_data.push([
//           leftGroup?.items[0]?.BSGroupName || "",
//           "", "", Number(leftGroup?.groupnetvalue?.toFixed(2)) || "",
//           "",
//           rightGroup?.items[0]?.BSGroupName || "",
//           "", "", Number(rightGroup?.netgroupvalue?.toFixed(2)) || ""
//         ]);

//         const leftExpanded = leftEntries[i] ? isExpanded(leftEntries[i][0]) : false;
//         const rightExpanded = rightEntries[i] ? isExpanded(rightEntries[i][0]) : false;
//         const maxItems = Math.max(
//           leftExpanded ? (leftGroup?.items?.length || 0) : 0,
//           rightExpanded ? (rightGroup?.items?.length || 0) : 0
//         );

//         for (let j = 0; j < maxItems; j++) {
//           const leftItem = leftExpanded ? leftGroup?.items[j] : undefined;
//           const rightItem = rightExpanded ? rightGroup?.items[j] : undefined;

//           ws_data.push([
//             "",
//             leftItem ? `   ${leftItem.Ac_Name_E}` : "",
//             leftItem ? Number(Math.abs(leftItem.Balance).toFixed(2)) : "",
//             "",
//             "",
//             "",
//             rightItem ? `   ${rightItem.Ac_Name_E}` : "",
//             rightItem ? Number(Math.abs(rightItem.Balance).toFixed(2)) : "",
//             ""
//           ]);
//         }
//       }

//       const totalPurchase = Object.values(groupedReportData).reduce((a, b) => a + Math.abs(b.groupnetvalue), 0);
//       const totalSale = Object.values(groupedReportDataRightside).reduce((a, b) => a + Math.abs(b.netgroupvalue), 0);
//       const grossProfit = totalSale - totalPurchase;
//       const grossLoss = totalPurchase - totalSale;

//       ws_data.push(["Net Purchase", "", "", Number(totalPurchase.toFixed(2)), "", "Net Sale", "", "", Number(totalSale.toFixed(2))]);
//       ws_data.push([
//         "Gross Profit", "", "", grossProfit > 0 ? Number(grossProfit.toFixed(2)) : "",
//         "", "Gross Loss", "", "", grossLoss > 0 ? Number(grossLoss.toFixed(2)) : ""
//       ]);
//       ws_data.push([
//         "Total", "", "", Number((totalPurchase + (grossProfit > 0 ? grossProfit : 0)).toFixed(2)),
//         "", "Total", "", "", Number((totalSale + (grossLoss > 0 ? grossLoss : 0)).toFixed(2))
//       ]);

//       const leftProfitEntries = Object.entries(groupReportDataProfitleftsideDebit);
//       const rightProfitEntries = Object.entries(groupReportDataProfitrigthsidetsideCredit);
//       const maxProfitLen = Math.max(leftProfitEntries.length, rightProfitEntries.length);

//       for (let i = 0; i < maxProfitLen; i++) {
//         const leftGroup = leftProfitEntries[i]?.[1];
//         const rightGroup = rightProfitEntries[i]?.[1];

//         ws_data.push([
//           leftGroup?.items[0]?.BSGroupName || "",
//           "", "", Number(leftGroup?.groupnetvalue?.toFixed(2)) || "",
//           "",
//           rightGroup?.items[0]?.BSGroupName || "",
//           "", "", Number(rightGroup?.netgroupvalue?.toFixed(2)) || ""
//         ]);

//         const leftExpanded = leftProfitEntries[i] ? isExpanded(leftProfitEntries[i][0]) : false;
//         const rightExpanded = rightProfitEntries[i] ? isExpanded(rightProfitEntries[i][0]) : false;
//         const maxItems = Math.max(
//           leftExpanded ? (leftGroup?.items?.length || 0) : 0,
//           rightExpanded ? (rightGroup?.items?.length || 0) : 0
//         );

//         for (let j = 0; j < maxItems; j++) {
//           const leftItem = leftExpanded ? leftGroup?.items[j] : undefined;
//           const rightItem = rightExpanded ? rightGroup?.items[j] : undefined;

//           ws_data.push([
//             "",
//             leftItem ? `   ${leftItem.Ac_Name_E}` : "",
//             leftItem ? Number(Math.abs(leftItem.Balance).toFixed(2)) : "",
//             "",
//             "",
//             "",
//             rightItem ? `   ${rightItem.Ac_Name_E}` : "",
//             rightItem ? Number(Math.abs(rightItem.Balance).toFixed(2)) : "",
//             ""
//           ]);
//         }
//       }

//       const totalExpense = Object.values(groupReportDataProfitleftsideDebit).reduce((a, b) => a + Math.abs(b.groupnetvalue), 0);
//       const totalIncome = Object.values(groupReportDataProfitrigthsidetsideCredit).reduce((a, b) => a + Math.abs(b.netgroupvalue), 0);
//       const netProfit = (totalSale + totalIncome) - (totalPurchase + totalExpense);

//       ws_data.push(["Total", "", "", Number(totalExpense.toFixed(2)), "", "Total", "", "", Number(totalIncome.toFixed(2))]);
//       ws_data.push([
//         "Net Profit", "", "", netProfit > 0 ? Number(netProfit.toFixed(2)) : "",
//         "", "Net Loss", "", "", netProfit < 0 ? Number((-netProfit).toFixed(2)) : ""
//       ]);

//       const totalDebit = totalPurchase + totalExpense + (netProfit > 0 ? netProfit : 0);
//       const totalCredit = totalSale + totalIncome + (netProfit < 0 ? -netProfit : 0);

//       ws_data.push([
//         "Total Debit", "", "", Number(totalDebit.toFixed(2)),
//         "", "Total Credit", "", "", Number(totalCredit.toFixed(2))
//       ]);

//       const ws = XLSX.utils.aoa_to_sheet(ws_data);
//       ws["!cols"] = [
//         { wch: 22 }, { wch: 30 }, { wch: 18 }, { wch: 18 }, { wch: 5 },
//         { wch: 22 }, { wch: 30 }, { wch: 18 }, { wch: 18 },
//       ];

//       const range = XLSX.utils.decode_range(ws['!ref']);
//       for (let R = range.s.r; R <= range.e.r; R++) {
//         if (R < 4) {
//           for (let C = range.s.c; C <= range.e.c; C++) {
//             const cell_ref = XLSX.utils.encode_cell({ r: R, c: C });
//             if (ws[cell_ref]) {
//               ws[cell_ref].s = { font: { bold: true }, alignment: { horizontal: "center" } };
//             }
//           }
//         }
//         const cellA = XLSX.utils.encode_cell({ r: R, c: 0 });
//         if (ws[cellA] && (
//           ws[cellA].v === "Net Purchase" || ws[cellA].v === "Gross Profit" ||
//           ws[cellA].v === "Gross Loss" || ws[cellA].v === "Total" ||
//           ws[cellA].v === "Net Profit" || ws[cellA].v === "Net Loss" ||
//           ws[cellA].v === "Total Debit" || ws[cellA].v === "Total Credit"
//         )) {
//           for (let C = range.s.c; C <= range.e.c; C++) {
//             const cell_ref = XLSX.utils.encode_cell({ r: R, c: C });
//             if (ws[cell_ref]) { ws[cell_ref].s = { font: { bold: true } }; }
//           }
//         }
//       }

//       XLSX.utils.book_append_sheet(wb, ws, "Profit & Loss");
//       XLSX.writeFile(wb, "ProfitLossReport.xlsx");
//     } catch (err) {
//       console.error("Excel Export Failed:", err);
//     }
//   };


//   const handleRowClick = (acCode, acname) => {
//     setLoading(true);
//     setTimeout(() => {
//       const url = `/ledger-report?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&acCode=${encodeURIComponent(acCode)}&acname=${encodeURIComponent(acname)}`;
//       window.open(url, "_blank", "toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=800,height=600");
//       setLoading(false);
//     }, 500);
//   };


//   const renderPdf = (outputType = "blob") => {
//     const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });

//     const PW = doc.internal.pageSize.width;
//     const PH = doc.internal.pageSize.height;
//     const M = 25;
//     const MID = PW / 2;
//     const LH = 13;
//     const BOTTOM_LIMIT = PH - 50;

//     const L = {
//       groupX: M,
//       nameX: M + 10,
//       amtX: MID - 12,
//       nameMaxW: MID - M - 90,
//       groupMaxW: MID - M - 70,
//     };
//     const R = {
//       groupX: MID + 10,
//       nameX: MID + 20,
//       amtX: PW - M,
//       nameMaxW: PW - MID - M - 90,
//       groupMaxW: PW - MID - M - 70,
//     };

//     let curY = 0;
//     let pageStartY = 0;

//     const hLine = (y, lw = 0.5) => {
//       doc.setLineWidth(lw);
//       doc.line(M, y, PW - M, y);
//     };

//     const centerLine = (y1, y2) => {
//       doc.setDrawColor(180, 180, 180);
//       doc.setLineWidth(0.3);
//       doc.line(MID, y1, MID, y2);
//       doc.setDrawColor(0, 0, 0);
//     };

//     const wrap = (text, maxW, fs) => {
//       if (!text) return [""];
//       doc.setFontSize(fs);
//       const words = String(text).split(" ");
//       const lines = [];
//       let cur = "";
//       for (const w of words) {
//         const test = cur ? `${cur} ${w}` : w;
//         if (doc.getTextWidth(test) > maxW) {
//           if (cur) { lines.push(cur); cur = w; }
//           else {
//             let part = "";
//             for (const ch of w) {
//               if (doc.getTextWidth(part + ch) > maxW) { lines.push(part); part = ch; }
//               else part += ch;
//             }
//             if (part) lines.push(part);
//           }
//         } else cur = test;
//       }
//       if (cur) lines.push(cur);
//       return lines.length ? lines : [""];
//     };

//     const drawPageHeader = () => {
//       let y = 28;
//       doc.setFontSize(12);
//       doc.setFont("helvetica", "bold");
//       doc.text((displayCompanyName || "").trim(), MID, y, { align: "center" });

// // --- ADDED PRINT DATE AT TOP RIGHT ---
//       doc.setFontSize(7);
//       doc.setFont("helvetica", "normal");
//       const printDate = `Print Date: ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
//       doc.text(printDate, PW - M, y - 10, { align: "right" });

//       y += 13;
//       doc.setFontSize(8);
//       doc.setFont("helvetica", "normal");
//       const gstn = `GSTN : ${Company_GSTNO}`;
//       doc.text(gstn, MID, y, { align: "center" });
//       const gw = doc.getTextWidth(gstn);
//       doc.setLineWidth(0.3);
//       doc.line(MID - gw / 2, y + 2, MID + gw / 2, y + 2);
//       y += 13;
//       doc.setFontSize(10);
//       doc.setFont("helvetica", "bold");
//       doc.text("Profit & Loss A/c", MID, y, { align: "center" });
//       y += 11;
//       doc.setFontSize(8.5);
//       doc.setFont("helvetica", "bold");
//       doc.text(`${groupCode} - ${groupName}`, MID, y, { align: "center" });
//       y += 11;
//       doc.setFontSize(8);
//       doc.setFont("helvetica", "normal");
//       const fmt = (d) => (d || "").split("-").reverse().join("-");
//       doc.text(`${fmt(fromDate)} to ${fmt(toDate)}`, MID, y, { align: "center" });
//       y += 11;
//       hLine(y, 0.7);
//       y += 9;
//       doc.setFontSize(9);
//       doc.setFont("helvetica", "bold");
//       doc.text("Purchase", L.groupX, y);
//       doc.text("Amount", L.amtX, y, { align: "right" });
//       doc.text("Sale", R.groupX, y);
//       doc.text("Amount", R.amtX, y, { align: "right" });
//       y += 4;
//       hLine(y, 0.5);
//       curY = y + 9;
//       pageStartY = curY;
//     };

//     const checkBreak = (need = LH) => {
//       if (curY + need > BOTTOM_LIMIT) {
//         centerLine(pageStartY, curY + 2);
//         doc.addPage();
//         drawPageHeader();
//       }
//     };

//     // ── buildRows now respects expanded/collapsed state ──
//     const buildRows = (grouped, totalKey) => {
//       const rows = [];
//       for (const [key, grp] of Object.entries(grouped)) {
//         const label = grp.items[0]?.BSGroupName || "";
//         rows.push({ type: "group", label, total: grp[totalKey] });
//         if (isExpanded(key)) {
//           grp.items.forEach((item, idx) => {
//             rows.push({ type: "item", item, isLast: idx === grp.items.length - 1 });
//           });
//         }
//       }
//       return rows;
//     };

//     const renderRow = (lRow, rRow) => {
//       let lLines = [], rLines = [], lH = LH, rH = LH;

//       if (lRow) {
//         lLines = lRow.type === "group"
//           ? wrap(lRow.label.toUpperCase(), L.groupMaxW, 8.5)
//           : wrap(lRow.item.Ac_Name_E.trim().toUpperCase(), L.nameMaxW, 7.5);
//         lH = Math.max(LH, lLines.length * LH);
//       }
//       if (rRow) {
//         rLines = rRow.type === "group"
//           ? wrap(rRow.label.toUpperCase(), R.groupMaxW, 8.5)
//           : wrap(rRow.item.Ac_Name_E.trim().toUpperCase(), R.nameMaxW, 7.5);
//         rH = Math.max(LH, rLines.length * LH);
//       }

//       const rowH = Math.max(lH, rH);
//       checkBreak(rowH);

//       if (lRow) {
//         if (lRow.type === "group") {
//           doc.setFontSize(8.5); doc.setFont("helvetica", "bold");
//           let ty = curY;
//           lLines.forEach(ln => { doc.text(ln, L.groupX, ty); ty += LH; });
//           doc.text(formatReadableAmount(Math.abs(lRow.total)), L.amtX, curY + (lLines.length * LH) / 2 - 3, { align: "right" });
//         } else {
//           doc.setFontSize(7.5); doc.setFont("helvetica", "italic");
//           const { item, isLast } = lRow;
//           let ty = curY;
//           lLines.forEach(ln => { doc.text(ln, L.nameX, ty + 4); ty += LH; });
//           const isWrongSide = parseFloat(item.Balance) < 0;
//           const amtStr = isWrongSide
//             ? `-${formatReadableAmount(Math.abs(item.Balance))}`
//             : formatReadableAmount(Math.abs(item.Balance));
//           doc.text(amtStr, L.amtX, curY + 4, { align: "right" });
//           if (isLast) {
//             const aw = doc.getTextWidth(amtStr);
//             doc.setLineWidth(0.3);
//             doc.line(L.amtX - aw - 6, curY + 6, L.amtX, curY + 6);
//           }
//         }
//       }

//       if (rRow) {
//         if (rRow.type === "group") {
//           doc.setFontSize(8.5); doc.setFont("helvetica", "bold");
//           let ty = curY;
//           rLines.forEach(ln => { doc.text(ln, R.groupX, ty); ty += LH; });
//           doc.text(formatReadableAmount(Math.abs(rRow.total)), R.amtX, curY + (rLines.length * LH) / 2 - 3, { align: "right" });
//         } else {
//           doc.setFontSize(7.5); doc.setFont("helvetica", "italic");
//           const { item, isLast } = rRow;
//           let ty = curY;
//           rLines.forEach(ln => { doc.text(ln, R.nameX, ty + 4); ty += LH; });
//           const isWrongSide = parseFloat(item.Balance) > 0;
//           const amtStr = isWrongSide
//             ? `-${formatReadableAmount(Math.abs(item.Balance))}`
//             : formatReadableAmount(Math.abs(item.Balance));
//           doc.text(amtStr, R.amtX, curY + 4, { align: "right" });
//           if (isLast) {
//             const aw = doc.getTextWidth(amtStr);
//             doc.setLineWidth(0.3);
//             doc.line(R.amtX - aw - 6, curY + 6, R.amtX, curY + 6);
//           }
//         }
//       }

//       curY += rowH + 2;
//     };

//     const summaryRow = (lLabel, lVal, rLabel, rVal) => {
//       checkBreak(LH + 5);
//       doc.setFontSize(8.5); doc.setFont("helvetica", "bold");
//       if (lLabel) doc.text(lLabel, L.groupX, curY);
//       if (lVal !== null && lVal !== undefined)
//         doc.text(formatReadableAmount(lVal), L.amtX, curY, { align: "right" });
//       if (rLabel) doc.text(rLabel, R.groupX, curY);
//       if (rVal !== null && rVal !== undefined)
//         doc.text(formatReadableAmount(rVal), R.amtX, curY, { align: "right" });
//       curY += LH + 3;
//     };

//     const totalPurchase = Object.values(groupedReportData).reduce((a, b) => a + Math.abs(b.groupnetvalue), 0);
//     const totalSale = Object.values(groupedReportDataRightside).reduce((a, b) => a + Math.abs(b.netgroupvalue), 0);
//     const grossProfit = Math.max(totalSale - totalPurchase, 0);
//     const grossLoss = Math.max(totalPurchase - totalSale, 0);
//     const tradingTotalLeft = totalPurchase + grossProfit;
//     const tradingTotalRight = totalSale + grossLoss;
//     const profitRightTotal = Object.values(groupReportDataProfitrigthsidetsideCredit).reduce((a, b) => a + Math.abs(b.netgroupvalue), 0);
//     const profitLeftTotal = Object.values(groupReportDataProfitleftsideDebit).reduce((a, b) => a + Math.abs(b.groupnetvalue), 0);
//     const diffRightMinusLeft = totalSale - totalPurchase;
//     const resultRight = profitRightTotal + (diffRightMinusLeft > 0 ? diffRightMinusLeft : 0);
//     const diffLeftMinusRight = totalPurchase - totalSale;
//     const resultLeft = profitLeftTotal + (diffLeftMinusRight > 0 ? diffLeftMinusRight : 0);
//     const netResultRaw = resultRight - resultLeft;
//     const netResultVal = parseFloat(netResultRaw.toFixed(2));
//     const isNetProfit = netResultVal > 0;
//     const netProfitDisplay = isNetProfit ? netResultVal : 0;
//     const netLossDisplay = !isNetProfit ? Math.abs(netResultVal) : 0;
//     const totalCreditVal = parseFloat(resultRight.toFixed(2)) + (netResultVal < 0 ? Math.abs(netResultVal) : 0);
//     const totalDebitVal = parseFloat(resultLeft.toFixed(2)) + (isNetProfit ? netResultVal : 0);

//     drawPageHeader();

//     const tLRows = buildRows(groupedReportData, "groupnetvalue");
//     const tRRows = buildRows(groupedReportDataRightside, "netgroupvalue");
//     const tMax = Math.max(tLRows.length, tRRows.length);
//     for (let i = 0; i < tMax; i++) renderRow(tLRows[i] || null, tRRows[i] || null);

//     curY += 3; hLine(curY, 0.6); curY += 8;
//     summaryRow("Net Purchase", totalPurchase, "Net Sale", totalSale);
//     hLine(curY - 9, 0.3);
//     summaryRow("Gross Profit", grossProfit, "Gross Loss", grossLoss);
//     hLine(curY - 9, 0.3);
//     summaryRow("Total", tradingTotalLeft, "Total", tradingTotalRight);
//     hLine(curY - 9, 0.3);
//     curY += 4;
//     summaryRow("Gross Loss", grossLoss, "Gross Profit", grossProfit);
//     hLine(curY - 9, 0.3);
//     curY += 4;

//     const pLRows = buildRows(groupReportDataProfitleftsideDebit, "groupnetvalue");
//     const pRRows = buildRows(groupReportDataProfitrigthsidetsideCredit, "netgroupvalue");
//     const pMax = Math.max(pLRows.length, pRRows.length);
//     for (let i = 0; i < pMax; i++) renderRow(pLRows[i] || null, pRRows[i] || null);

//     curY += 3; hLine(curY, 0.6); curY += 8;
//     summaryRow("Total", resultLeft, "Total", resultRight);
//     hLine(curY - 9, 0.3);
//     summaryRow("Net Profit", netProfitDisplay, "Net Loss", netLossDisplay);
//     hLine(curY - 9, 0.3);
//     summaryRow("Total Credit", totalCreditVal, "Total Debit", totalDebitVal);
//     hLine(curY - 9, 0.3);
//     centerLine(pageStartY, curY);

//     if (outputType === "blob") {
//       setPdfPreview(URL.createObjectURL(doc.output("blob")));
//     } else if (outputType === "print") {
//       const pdfBlob = doc.output("blob");
//       const blobUrl = URL.createObjectURL(pdfBlob);
//       const printWindow = window.open(blobUrl, "_blank");
//       if (printWindow) {
//         printWindow.addEventListener("load", () => { printWindow.focus(); printWindow.print(); });
//       } else {
//         const a = document.createElement("a");
//         a.href = blobUrl; a.target = "_blank"; a.click();
//       }
//     }
//   };

//   const generatePdf = () => renderPdf("blob");
//   const handlePrint = () => renderPdf("print");

//   function calculateNetResult(
//     profitRightSideCreditData,
//     profitLeftSideDebitData,
//     groupedReportData,
//     groupedReportDataRightside,
//     threshold = 0
//   ) {
//     const profitRightSideCreditTotal = Object.values(profitRightSideCreditData).reduce((acc, { netgroupvalue }) => acc + Math.abs(netgroupvalue), 0);
//     const leftTotal = Object.values(groupedReportData).reduce((acc, { groupnetvalue }) => acc + Math.abs(groupnetvalue), 0);
//     const rightTotal = Object.values(groupedReportDataRightside).reduce((acc, { netgroupvalue }) => acc + Math.abs(netgroupvalue), 0);
//     const diffRightMinusLeft = rightTotal - leftTotal;
//     const resultRight = profitRightSideCreditTotal + (diffRightMinusLeft > 0 ? diffRightMinusLeft : 0);
//     const profitLeftSideDebitTotal = Object.values(profitLeftSideDebitData).reduce((acc, { groupnetvalue }) => acc + Math.abs(groupnetvalue), 0);
//     const diffLeftMinusRight = leftTotal - rightTotal;
//     const resultLeft = profitLeftSideDebitTotal + (diffLeftMinusRight > 0 ? diffLeftMinusRight : 0);
//     const netResult = resultRight - resultLeft;
//     return { netResult: netResult.toFixed(2), isGreaterThanThreshold: netResult > threshold };
//   }

//   return (
//     <div style={{ marginTop: "-80px" }}>
//       <Typography variant="h6" style={{ textAlign: 'center', fontSize: "24px", fontWeight: "bold" }}>{displayCompanyName}</Typography>
//       <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px", textDecoration: 'underline', fontWeight: "550" }}>GSTN : {Company_GSTNO}</Typography>
//       <Typography variant="h6" style={{ textAlign: 'center', fontSize: "20px", fontWeight: "bold" }}>Profit & Loss A/c</Typography>
//       <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px" }}>{FormaDateBalanceSheet(fromDate)} to {FormaDateBalanceSheet(toDate)}</Typography>

//       <div className="d-flex justify-content-end align-items-center" style={{ marginTop: "-60px", gap: "8px" }}>

//         {/* ── Expand/Collapse All toggle switch ── */}
//         <div
//           onClick={() => handleToggleAll(!allExpanded)}
//           style={{
//             display: "inline-flex",
//             alignItems: "center",
//             gap: "10px",
//             cursor: "pointer",
//             userSelect: "none",
//             border: "1px solid #ccc",
//             borderRadius: "6px",
//             padding: "5px 12px",
//             height: "32px",
//             backgroundColor: "#fff",
//           }}
//         >
//           <div style={{
//             width: "34px",
//             height: "18px",
//             borderRadius: "9px",
//             backgroundColor: allExpanded ? "#378ADD" : "#ccc",
//             position: "relative",
//             transition: "background 0.2s",
//             flexShrink: 0,
//           }}>
//             <div style={{
//               width: "13px",
//               height: "13px",
//               borderRadius: "50%",
//               backgroundColor: "#fff",
//               position: "absolute",
//               top: "2.5px",
//               left: allExpanded ? "18.5px" : "2.5px",
//               transition: "left 0.2s",
//             }} />
//           </div>
//           <span style={{ fontSize: "13px", fontWeight: "500", color: "#333", minWidth: "74px" }}>
//             {allExpanded ? "Collapse all" : "Expand all"}
//           </span>
//         </div>

//         <PrintButton disabledFeild={""} fetchData={handlePrint} />
//         <button className="btn btn-success" onClick={handleExportToExcel}>
//           Export to Excel
//         </button>
//         <button onClick={generatePdf} className="btn btn-secondary">
//           PDF
//         </button>
//       </div>

//       <div className="table-responsive">
//         <table
//           className="table table-striped table-bordered mt-4"
//           id="reportTable"
//           style={{
//             width: "100%",
//             tableLayout: "fixed",
//             marginLeft: "auto",
//             marginRight: "auto",
//             borderCollapse: "collapse",
//           }}
//         >
//           <thead className="table-light">
//             <tr>
//               <th colSpan={2} style={{ textAlign: "left", backgroundColor: "#D0E9C6" }}>
//                 Purchase
//               </th>
//               <th colSpan={2} style={{ textAlign: "right", backgroundColor: "#D0E9C6" }}>
//                 Amount
//               </th>

//               <th colSpan={2} style={{ textAlign: "left", backgroundColor: "#D0E9C6" }}>
//                 Sale
//               </th>
//               <th colSpan={2} style={{ textAlign: "right", backgroundColor: "#D0E9C6" }}>
//                 Amount
//               </th>
//             </tr>
//           </thead>
//           <tbody>
//             <tr>
//               <td align="left" colSpan={4} style={{ verticalAlign: "top", width: "50%", backgroundColor: "#D0E9C6" }}>
//                 <table style={{ width: "100%", backgroundColor: "#D0E9C6" }}>
//                   <tbody>
//                     {Object.entries(groupedReportData).map(
//                       ([key, { items, groupnetvalue }]) => {
//                         const [millname, BSGroupName] = key.split("-");
//                         const totalGroupBalance = items
//                           .reduce((sum, item) => sum + parseFloat(item.Balance), 0)
//                           .toFixed(2);
//                         const expanded = isExpanded(key);
//                         return (
//                           <React.Fragment key={key}>
//                             {/* ── Group header — click to toggle ── */}
//                             <tr
//                               className="table-primary"
//                               // style={{ cursor: "pointer", userSelect: "none" }}
//                               // onClick={() => toggleGroup(key)}
//                               style={{ userSelect: "none" }}
//                             >
//                               <td style={{ textAlign: "left", color: "black", fontWeight: "bold", whiteSpace: "nowrap" }}>
//                                 {/* <span style={{
//                                   display: "inline-block",
//                                   marginRight: "6px",
//                                   fontSize: "10px",
//                                   color: "#555",
//                                   transition: "transform 0.2s",
//                                   transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
//                                 }}>▶</span> */}


//                                 <span
//                                   onClick={() => toggleGroup(key)}
//                                   style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", marginRight: "6px" }}
//                                 >
//                                   {expanded
//                                     ? <KeyboardArrowDown style={{ fontSize: "18px", color: "#000000" }} />
//                                     : <KeyboardArrowRight style={{ fontSize: "18px", color: "#000000" }} />
//                                   }
//                                 </span>
//                                 {millname} - {BSGroupName}
//                               </td>
//                               <td style={{ textAlign: "right", color: "black", fontWeight: "bold", whiteSpace: "nowrap", cursor: "text" }}>
//                                 {formatReadableAmount(Math.abs(totalGroupBalance))}
//                               </td>
//                             </tr>

//                             {/* ── Item rows — only when expanded ── */}
//                             {expanded && items.map((item, index) => {
//                               const isLast = index === items.length - 1;
//                               const isWrongSide = parseFloat(item.Balance) < 0;
//                               const displayAmt = isWrongSide
//                                 ? `-${formatReadableAmount(Math.abs(item.Balance))}`
//                                 : formatReadableAmount(Math.abs(item.Balance));
//                               return (
//                                 <tr key={index}>
//                                   <td
//                                     onClick={() => handleRowClick(item.AC_CODE, item.Ac_Name_E)}
//                                     style={{ textAlign: "left", whiteSpace: "nowrap", color: "black", fontStyle: "italic", cursor: "pointer" }}
//                                   >
//                                     {item.Ac_Name_E}
//                                   </td>
//                                   <td style={{ textAlign: "right", color: "black", paddingRight: "160px" }}>
//                                     <span style={{
//                                       display: "inline-block",
//                                       fontStyle: "normal",
//                                       fontWeight: "normal",
//                                       borderBottom: isLast ? "2px solid black" : "none",
//                                       paddingBottom: "2px",
//                                       fontStyle: "italic",
//                                       cursor: "text"
//                                     }}>
//                                       {displayAmt}
//                                     </span>
//                                   </td>
//                                 </tr>
//                               );
//                             })}
//                           </React.Fragment>
//                         );
//                       }
//                     )}
//                   </tbody>
//                 </table>
//               </td>

//               <td align="left" colSpan={4} style={{ verticalAlign: "top", width: "50%", backgroundColor: "#D0E9C6" }}>
//                 <table style={{ width: "100%", backgroundColor: "#D0E9C6" }}>
//                   <tbody>
//                     {Object.entries(groupedReportDataRightside).map(
//                       ([key, { items, netgroupvalue }]) => {
//                         const [millname, BSGroupName] = key.split("-");
//                         const totalGroupBalance = items
//                           .reduce((sum, item) => sum + parseFloat(item.Balance), 0)
//                           .toFixed(2);
//                         const expanded = isExpanded(key);
//                         return (
//                           <React.Fragment key={key}>
//                             {/* ── Group header — click to toggle ── */}
//                             <tr
//                               className="table-primary"
//                               // style={{ cursor: "pointer", userSelect: "none" }}
//                               // onClick={() => toggleGroup(key)}
//                               style={{ userSelect: "none" }}
//                             >
//                               <td style={{ textAlign: "left", color: "black", fontWeight: "bold", whiteSpace: "nowrap" }}>
//                                 {/* <span style={{
//                                   display: "inline-block",
//                                   marginRight: "6px",
//                                   fontSize: "10px",
//                                   color: "#555",
//                                   transition: "transform 0.2s",
//                                   transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
//                                 }}>▶</span> */}
//                                 <span
//                                   onClick={() => toggleGroup(key)}
//                                   style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", marginRight: "6px" }}
//                                 >
//                                   {expanded
//                                     ? <KeyboardArrowDown style={{ fontSize: "18px", color: "#000000" }} />
//                                     : <KeyboardArrowRight style={{ fontSize: "18px", color: "#000000" }} />
//                                   }
//                                 </span>
//                                 {millname} - {BSGroupName}
//                               </td>
//                               <td style={{ textAlign: "right", color: "black", fontWeight: "bold", whiteSpace: "nowrap", cursor: "text" }}>
//                                 {formatReadableAmount(Math.abs(totalGroupBalance))}
//                               </td>
//                             </tr>

//                             {/* ── Item rows — only when expanded ── */}
//                             {expanded && items.map((item, index) => {
//                               const isLast = index === items.length - 1;
//                               const isWrongSide = parseFloat(item.Balance) > 0;
//                               const displayAmt = isWrongSide
//                                 ? `-${formatReadableAmount(Math.abs(item.Balance))}`
//                                 : formatReadableAmount(Math.abs(item.Balance));
//                               return (
//                                 <tr key={index}>
//                                   <td
//                                     onClick={() => handleRowClick(item.AC_CODE, item.Ac_Name_E)}
//                                     style={{ textAlign: "left", paddingLeft: "10px", whiteSpace: "nowrap", color: "black", fontStyle: "italic", cursor: "pointer" }}
//                                   >
//                                     {item.Ac_Name_E}
//                                   </td>
//                                   <td style={{ textAlign: "right", color: "black", paddingRight: "160px" }}>
//                                     <span style={{
//                                       display: "inline-block",
//                                       borderBottom: isLast ? "2px solid black" : "none",
//                                       paddingBottom: isLast ? "2px" : "0",
//                                       fontStyle: "italic"
//                                     }}>
//                                       {displayAmt}
//                                     </span>
//                                   </td>
//                                 </tr>
//                               );
//                             })}
//                           </React.Fragment>
//                         );
//                       }
//                     )}
//                   </tbody>
//                 </table>
//               </td>
//             </tr>

//             <tr>
//               <td align="left" colSpan={4} style={{ verticalAlign: "top", width: "50%", backgroundColor: "#D0E9C6" }}>
//                 <table style={{ width: "100%" }}>
//                   <tr>
//                     <td className="fw-bold" style={{ color: "black", width: "70%" }} align="left">Net Purchase</td>
//                     <td className="fw-bold" style={{ color: "black", width: "70%" }} align="right">
//                       {formatReadableAmount(Object.values(groupedReportData).reduce((acc, { groupnetvalue }) => acc + Math.abs(groupnetvalue), 0))}
//                     </td>
//                   </tr>
//                 </table>
//               </td>
//               <td align="left" colSpan={4} style={{ width: "100%", backgroundColor: "#D0E9C6" }}>
//                 <table style={{ width: "100%", backgroundColor: "#D0E9C6" }}>
//                   <tr>
//                     <td className="fw-bold" style={{ width: "100%", backgroundColor: "#D0E9C6" }}>Net Sale</td>
//                     <td className="fw-bold" style={{ color: "black", width: "100%", backgroundColor: "#D0E9C6" }} align="right">
//                       {formatReadableAmount(Object.values(groupedReportDataRightside).reduce((acc, { netgroupvalue }) => acc + Math.abs(netgroupvalue), 0))}
//                     </td>
//                   </tr>
//                 </table>
//               </td>
//             </tr>
//             <tr>
//               <td align="left" colSpan={4} style={{ verticalAlign: "top", width: "50%", backgroundColor: "#D0E9C6" }}>
//                 <table style={{ width: "100%" }}>
//                   <tr>
//                     <td className="fw-bold" style={{ color: "black", width: "70%" }} align="left">Gross Profit</td>
//                     <td className="fw-bold" style={{ color: "black", width: "70%" }} align="right">
//                       {(() => {
//                         const totalRightSide = Object.values(groupedReportDataRightside).reduce((acc, { netgroupvalue }) => acc + Math.abs(netgroupvalue), 0);
//                         const totalLeftSide = Object.values(groupedReportData).reduce((acc, { groupnetvalue }) => acc + Math.abs(groupnetvalue), 0);
//                         const difference = totalRightSide - totalLeftSide;
//                         return formatReadableAmount(difference > 0 ? difference.toFixed(2) : "0.00");
//                       })()}
//                     </td>
//                   </tr>
//                 </table>
//               </td>
//               <td align="left" colSpan={4} style={{ verticalAlign: "top", width: "50%", backgroundColor: "#D0E9C6" }}>
//                 <table style={{ width: "100%" }}>
//                   <tr>
//                     <td className="fw-bold" style={{ color: "black", width: "70%" }} align="left">Gross Loss</td>
//                     <td className="fw-bold" style={{ color: "black", width: "70%" }} align="right">
//                       {(() => {
//                         const totalLeftSide = Object.values(groupedReportData).reduce((acc, { groupnetvalue }) => acc + Math.abs(groupnetvalue), 0);
//                         const totalRightSide = Object.values(groupedReportDataRightside).reduce((acc, { netgroupvalue }) => acc + Math.abs(netgroupvalue), 0);
//                         const difference = totalLeftSide - totalRightSide;
//                         return formatReadableAmount(difference > 0 ? difference.toFixed(2) : "0.00");
//                       })()}
//                     </td>
//                   </tr>
//                 </table>
//               </td>
//             </tr>

//             <tr>
//               <td align="left" colSpan={4} style={{ verticalAlign: "top", width: "50%", backgroundColor: "#D0E9C6" }}>
//                 <table style={{ width: "100%" }}>
//                   <tr>
//                     <td className="fw-bold" style={{ color: "black", width: "70%" }} align="left">Total</td>
//                     <td className="fw-bold" style={{ color: "black", width: "70%" }} align="right">
//                       {(() => {
//                         const leftTotal = Object.values(groupedReportData).reduce((acc, { groupnetvalue }) => acc + Math.abs(groupnetvalue), 0);
//                         const rightTotal = Object.values(groupedReportDataRightside).reduce((acc, { netgroupvalue }) => acc + Math.abs(netgroupvalue), 0);
//                         const diff = rightTotal - leftTotal;
//                         const result = leftTotal + (diff > 0 ? diff : 0);
//                         return formatReadableAmount(result);
//                       })()}
//                     </td>
//                   </tr>
//                 </table>
//               </td>
//               <td align="left" colSpan={4} style={{ verticalAlign: "top", width: "50%", backgroundColor: "#D0E9C6" }}>
//                 <table style={{ width: "100%" }}>
//                   <tr>
//                     <td className="fw-bold" style={{ color: "black", width: "70%" }} align="left">Total</td>
//                     <td className="fw-bold" style={{ color: "black", width: "70%" }} align="right">
//                       {(() => {
//                         const rightTotal = Object.values(groupedReportDataRightside).reduce((acc, { netgroupvalue }) => acc + Math.abs(netgroupvalue), 0);
//                         const leftTotal = Object.values(groupedReportData).reduce((acc, { groupnetvalue }) => acc + Math.abs(groupnetvalue), 0);
//                         const diff = leftTotal - rightTotal;
//                         const result = diff > 0 ? diff : 0;
//                         return (formatReadableAmount(rightTotal + result));
//                       })()}
//                     </td>
//                   </tr>
//                 </table>
//               </td>
//             </tr>
//             <tr>
//               <td align="left" colSpan={4} style={{ verticalAlign: "top", width: "50%", backgroundColor: "#D0E9C6" }}>
//                 <table style={{ width: "100%" }}>
//                   <tr>
//                     <td className="fw-bold" style={{ width: "70%" }} align="left">Gross Loss</td>
//                     <td className="fw-bold" style={{ width: "70%" }} align="right">
//                       {(() => {
//                         const totalLeftSide = Object.values(groupedReportData).reduce((acc, { groupnetvalue }) => acc + Math.abs(groupnetvalue), 0);
//                         const totalRightSide = Object.values(groupedReportDataRightside).reduce((acc, { netgroupvalue }) => acc + Math.abs(netgroupvalue), 0);
//                         const difference = totalLeftSide - totalRightSide;
//                         return formatReadableAmount(difference > 0 ? difference.toFixed(2) : "0.00");
//                       })()}
//                     </td>
//                   </tr>
//                 </table>
//               </td>
//               <td align="left" colSpan={4} style={{ verticalAlign: "top", width: "50%", backgroundColor: "#D0E9C6" }}>
//                 <table style={{ width: "100%" }}>
//                   <tr>
//                     <td className="fw-bold" style={{ width: "70%" }} align="left">Gross Profit</td>
//                     <td className="fw-bold" style={{ width: "70%" }} align="right">
//                       {(() => {
//                         const totalRightSide = Object.values(groupedReportDataRightside).reduce((acc, { netgroupvalue }) => acc + Math.abs(netgroupvalue), 0);
//                         const totalLeftSide = Object.values(groupedReportData).reduce((acc, { groupnetvalue }) => acc + Math.abs(groupnetvalue), 0);
//                         const difference = totalRightSide - totalLeftSide;
//                         return formatReadableAmount(difference > 0 ? difference.toFixed(2) : "0.00");
//                       })()}
//                     </td>
//                   </tr>
//                 </table>
//               </td>
//             </tr>

//             <tr>
//               <td align="left" colSpan={4} style={{ verticalAlign: "top", width: "50%", backgroundColor: "#D0E9C6" }}>
//                 <table style={{ width: "100%" }}>
//                   <tr>
//                     <td>
//                       {Object.entries(groupReportDataProfitleftsideDebit).map(
//                         ([key, { items, groupnetvalue }]) => {
//                           const [millname, BSGroupName] = key.split("-");
//                           const totalGroupBalance = items
//                             .reduce((sum, item) => sum + parseFloat(item.Balance), 0)
//                             .toFixed(2);
//                           const expanded = isExpanded(key);
//                           return (
//                             <React.Fragment key={key}>
//                               {/* ── Group header — click to toggle ── */}
//                               <tr
//                                 className="table-primary header-row"
//                                 // style={{ cursor: "pointer", userSelect: "none" }}
//                                 // onClick={() => toggleGroup(key)}
//                                 style={{ userSelect: "none" }}
//                               >
//                                 <td style={{ width: "30%", align: "left", color: "black", fontWeight: "bold" }}>
//                                   {/* <span style={{
//                                     display: "inline-block",
//                                     marginRight: "6px",
//                                     fontSize: "10px",
//                                     color: "#555",
//                                     transition: "transform 0.2s",
//                                     transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
//                                   }}>▶</span> */}

//                                   <span
//                                     onClick={() => toggleGroup(key)}
//                                     style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", marginRight: "6px" }}
//                                   >
//                                     {expanded
//                                       ? <KeyboardArrowDown style={{ fontSize: "18px", color: "#000000" }} />
//                                       : <KeyboardArrowRight style={{ fontSize: "18px", color: "#000000" }} />
//                                     }
//                                   </span>
//                                   {millname} - {BSGroupName}
//                                 </td>
//                                 <td align="right" style={{ color: "black", fontWeight: "bold", textAlign: "right", paddingLeft: "482px", cursor: "text" }}>
//                                   {formatReadableAmount(Math.abs(totalGroupBalance))}
//                                 </td>
//                               </tr>

//                               {/* ── Item rows — only when expanded ── */}
//                               {expanded && items.map((item, index) => {
//                                 const isLast = index === items.length - 1;
//                                 const isWrongSide = parseFloat(item.Balance) < 0;
//                                 const displayAmt = isWrongSide
//                                   ? `-${formatReadableAmount(Math.abs(item.Balance))}`
//                                   : formatReadableAmount(Math.abs(item.Balance));
//                                 return (
//                                   <tr key={index}>
//                                     <td onClick={() => handleRowClick(item.AC_CODE, item.Ac_Name_E)} style={{ fontStyle: "italic", cursor: "pointer" }}>
//                                       {item.Ac_Name_E}
//                                     </td>
//                                     <td align="right" style={{ paddingRight: "160px", textAlign: "right", color: "black", fontWeight: "normal", fontStyle: "italic" }}>
//                                       <span style={{ display: "inline-block", borderBottom: isLast ? "2px solid black" : "none", paddingBottom: isLast ? "2px" : "0", fontStyle: "italic" }}>
//                                         {displayAmt}
//                                       </span>
//                                     </td>
//                                   </tr>
//                                 );
//                               })}
//                             </React.Fragment>
//                           );
//                         }
//                       )}
//                     </td>
//                   </tr>
//                 </table>
//               </td>
//               <td align="center" colSpan={4} style={{ verticalAlign: "top", width: "50%", backgroundColor: "#D0E9C6" }}>
//                 <table style={{ width: "100%" }}>
//                   <tr>
//                     <td>
//                       {Object.entries(groupReportDataProfitrigthsidetsideCredit).map(([key, { items, netgroupvalue }]) => {
//                         const [millname, BSGroupName] = key.split("-");
//                         const totalGroupBalance = items
//                           .reduce((sum, item) => sum + parseFloat(item.Balance), 0)
//                           .toFixed(2);
//                         const expanded = isExpanded(key);
//                         return (
//                           <React.Fragment key={key}>
//                             {/* ── Group header — click to toggle ── */}
//                             <tr
//                               // style={{ cursor: "pointer", userSelect: "none" }}
//                               // onClick={() => toggleGroup(key)}
//                               style={{ userSelect: "none" }}
//                             >
//                               <td align="left" style={{ color: "black", fontWeight: "bold", textAlign: "left" }}>
//                                 {/* <span style={{
//                                   display: "inline-block",
//                                   marginRight: "6px",
//                                   fontSize: "10px",
//                                   color: "#555",
//                                   transition: "transform 0.2s",
//                                   transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
//                                 }}>▶</span> */}

//                                 <span
//                                   onClick={() => toggleGroup(key)}
//                                   style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", marginRight: "6px" }}
//                                 >
//                                   {expanded
//                                     ? <KeyboardArrowDown style={{ fontSize: "18px", color: "#000000" }} />
//                                     : <KeyboardArrowRight style={{ fontSize: "18px", color: "#000000" }} />
//                                   }
//                                 </span>
//                                 {millname} - {BSGroupName}
//                               </td>
//                               <td align="right" style={{ color: "black", fontWeight: "bold", textAlign: "right", paddingLeft: "482px", cursor: "text" }}>
//                                 {formatReadableAmount(Math.abs(totalGroupBalance))}
//                               </td>
//                             </tr>

//                             {/* ── Item rows — only when expanded ── */}
//                             {expanded && items.map((item, index) => {
//                               const isLast = index === items.length - 1;
//                               const isWrongSide = parseFloat(item.Balance) > 0;
//                               const displayAmt = isWrongSide
//                                 ? `-${formatReadableAmount(Math.abs(item.Balance))}`
//                                 : formatReadableAmount(Math.abs(item.Balance));
//                               return (
//                                 <tr key={index}>
//                                   <td onClick={() => handleRowClick(item.AC_CODE, item.Ac_Name_E)} style={{ fontStyle: "italic", cursor: "pointer" }}>
//                                     {item.Ac_Name_E}
//                                   </td>
//                                   <td align="right" style={{ paddingRight: "160px", textAlign: "right", color: "black", fontWeight: "normal", fontStyle: "italic" }}>
//                                     <span style={{ display: "inline-block", borderBottom: isLast ? "2px solid black" : "none", paddingBottom: isLast ? "2px" : "0" }}>
//                                       {displayAmt}
//                                     </span>
//                                   </td>
//                                 </tr>
//                               );
//                             })}
//                           </React.Fragment>
//                         );
//                       })}
//                     </td>
//                   </tr>
//                 </table>
//               </td>
//             </tr>

//             <tr>
//               <td align="left" colSpan={4} style={{ width: "100%", backgroundColor: "#D0E9C6" }}>
//                 <table style={{ width: "100%" }}>
//                   <tr>
//                     <td className="fw-bold" style={{ color: "black", width: "70%" }} align="left">Total</td>
//                     <td className="fw-bold" style={{ color: "black", width: "70%" }} align="right">
//                       {(() => {
//                         const profitLeftSideDebitTotal = Object.values(groupReportDataProfitleftsideDebit).reduce((acc, { groupnetvalue }) => acc + Math.abs(groupnetvalue), 0);
//                         const leftTotal = Object.values(groupedReportData).reduce((acc, { groupnetvalue }) => acc + Math.abs(groupnetvalue), 0);
//                         const rightTotal = Object.values(groupedReportDataRightside).reduce((acc, { netgroupvalue }) => acc + Math.abs(netgroupvalue), 0);
//                         const diff = leftTotal - rightTotal;
//                         const result = profitLeftSideDebitTotal + (diff > 0 ? diff : 0);
//                         return formatReadableAmount(result);
//                       })()}
//                     </td>
//                   </tr>
//                 </table>
//               </td>
//               <td align="left" colSpan={4} style={{ width: "100%", backgroundColor: "#D0E9C6" }}>
//                 <table style={{ width: "100%" }}>
//                   <tr>
//                     <td className="fw-bold" style={{ color: "black", width: "70%" }} align="left">Total</td>
//                     <td className="fw-bold" style={{ color: "black", width: "70%" }} align="right">
//                       {(() => {
//                         const profitRightSideCreditTotal = Object.values(groupReportDataProfitrigthsidetsideCredit).reduce((acc, { netgroupvalue }) => acc + Math.abs(netgroupvalue), 0);
//                         const leftTotal = Object.values(groupedReportData).reduce((acc, { groupnetvalue }) => acc + Math.abs(groupnetvalue), 0);
//                         const rightTotal = Object.values(groupedReportDataRightside).reduce((acc, { netgroupvalue }) => acc + Math.abs(netgroupvalue), 0);
//                         const diff = rightTotal - leftTotal;
//                         const result = profitRightSideCreditTotal + (diff > 0 ? diff : 0);
//                         return formatReadableAmount(result);
//                       })()}
//                     </td>
//                   </tr>
//                 </table>
//               </td>
//             </tr>
//             <tr>
//               <td align="left" colSpan={4} style={{ width: "100%", backgroundColor: "#D0E9C6" }}>
//                 <table style={{ width: "100%" }}>
//                   <tr>
//                     <td className="fw-bold" style={{ color: "black", width: "70%" }} align="left">Net Profit</td>
//                     <td className="fw-bold" style={{ color: "black", width: "70%" }} align="right">
//                       {(() => {
//                         const { netResult, isGreaterThanThreshold } = calculateNetResult(groupReportDataProfitrigthsidetsideCredit, groupReportDataProfitleftsideDebit, groupedReportData, groupedReportDataRightside, 0);
//                         return isGreaterThanThreshold ? ` ${formatReadableAmount(netResult)}` : "";
//                       })()}
//                     </td>
//                   </tr>
//                 </table>
//               </td>
//               <td align="left" colSpan={4} style={{ width: "100%", backgroundColor: "#D0E9C6" }}>
//                 <table style={{ width: "100%" }}>
//                   <tr>
//                     <td className="fw-bold" style={{ color: "black", width: "70%" }} align="left">Net Loss</td>
//                     <td className="fw-bold" style={{ color: "black", width: "70%" }} align="right">
//                       {(() => {
//                         const { netResult, isGreaterThanThreshold } = calculateNetResult(groupReportDataProfitrigthsidetsideCredit, groupReportDataProfitleftsideDebit, groupedReportData, groupedReportDataRightside, 0);
//                         return !isGreaterThanThreshold ? ` ${formatReadableAmount(Math.abs(netResult))}` : "";
//                       })()}
//                     </td>
//                   </tr>
//                 </table>
//               </td>
//             </tr>

//             <tr>
//               <td align="left" colSpan={4} style={{ width: "100%", backgroundColor: "#D0E9C6" }}>
//                 <table style={{ width: "100%" }}>
//                   <tr>
//                     <td className="fw-bold" style={{ color: "black", width: "70%" }} align="left">Total Credit</td>
//                     <td className="fw-bold" style={{ color: "black", width: "70%" }} align="right">
//                       {(() => {
//                         const profitRightSideCreditTotal = Object.values(groupReportDataProfitrigthsidetsideCredit).reduce((acc, { netgroupvalue }) => acc + Math.abs(netgroupvalue), 0);
//                         const leftTotal = Object.values(groupedReportData).reduce((acc, { groupnetvalue }) => acc + Math.abs(groupnetvalue), 0);
//                         const rightTotal = Object.values(groupedReportDataRightside).reduce((acc, { netgroupvalue }) => acc + Math.abs(netgroupvalue), 0);
//                         const diff = rightTotal - leftTotal;
//                         const result = profitRightSideCreditTotal + (diff > 0 ? diff : 0);
//                         const { netResult, isGreaterThanThreshold } = calculateNetResult(groupReportDataProfitrigthsidetsideCredit, groupReportDataProfitleftsideDebit, groupedReportData, groupedReportDataRightside, 0);
//                         const finalResult = parseFloat(result.toFixed(2)) + (isGreaterThanThreshold < 0 ? parseFloat(netResult) : 0);
//                         return formatReadableAmount(finalResult);
//                       })()}
//                     </td>
//                   </tr>
//                 </table>
//               </td>
//               <td align="left" colSpan={4} style={{ width: "100%", backgroundColor: "#D0E9C6" }}>
//                 <table style={{ width: "100%" }}>
//                   <tr>
//                     <td className="fw-bold" style={{ color: "black", width: "70%" }} align="left">Total Debit</td>
//                     <td className="fw-bold" style={{ color: "black", width: "70%" }} align="right">
//                       {(() => {
//                         const { netResult, isGreaterThanThreshold } = calculateNetResult(groupReportDataProfitrigthsidetsideCredit, groupReportDataProfitleftsideDebit, groupedReportData, groupedReportDataRightside, 0);
//                         const profitLeftSideDebitTotal = Object.values(groupReportDataProfitleftsideDebit).reduce((acc, { groupnetvalue }) => acc + Math.abs(groupnetvalue), 0);
//                         const leftTotal = Object.values(groupedReportData).reduce((acc, { groupnetvalue }) => acc + Math.abs(groupnetvalue), 0);
//                         const rightTotal = Object.values(groupedReportDataRightside).reduce((acc, { netgroupvalue }) => acc + Math.abs(netgroupvalue), 0);
//                         const diff = leftTotal - rightTotal;
//                         const resultLeft = profitLeftSideDebitTotal + (diff > 0 ? diff : 0);
//                         const finalResult = parseFloat(resultLeft.toFixed(2)) + (isGreaterThanThreshold ? parseFloat(netResult) : 0);
//                         return formatReadableAmount(finalResult);
//                       })()}
//                     </td>
//                   </tr>
//                 </table>
//               </td>
//             </tr>
//           </tbody>
//         </table>
//         <div className="centered-container">
//           {pdfPreview && pdfPreview.length > 0 && (
//             <PdfPreview pdfData={pdfPreview} apiData={reportData} label={"ProfitNLoss"} />
//           )}
//         </div>
//       </div>
//       {loading && (
//         <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 9999 }}>
//            <ScaleLoader color="#1005ad" height={35} width={4} radius={2} margin={2} />
//         </div>
//       )}
//     </div>
//   );
// };

// export default ProfitLossReport;