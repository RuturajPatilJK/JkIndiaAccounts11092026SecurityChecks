import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import '../../Reports/Ledger/GledgerReport.css';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import PdfPreview from "../../../Common/PDFPreview";
import { Typography } from '@mui/material';
import { ScaleLoader } from 'react-spinners';
import { formatDate } from '../../../Common/FormatFunctions/FormatDate';
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";
import { validateDocumentDate } from "../../../Common/ValidateDateRange/ValidateDateRange";
import "../../../Common/Fonts/Signika-Bold-normal";
import "../../../Common/Fonts/Signika-Regular-normal";
import "../../../Common/Fonts/Signika-Medium-normal";
import logo from "../../../Assets/jklogo.png";
import FooterJK from "../../../Assets/FooterJK.png";
import HeaderJK from "../../../Assets/HeaderJK.png";
import FooterJK1 from "../../../Assets/FooterJK1.png";
import Swal from "sweetalert2";

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_TRANS_TYPES = [
  "BP", "BR", "CP", "CS", "CN", "CR", "DN", "DS",
  "DO", "JV", "CV", "LV", "XP", "PS", "PR", "RB", "SB", "UI"
];

const TRANS_GROUPS = [
  {
    label: "Bank & Cash",
    types: [
      { code: "BP", label: "Bank Payment" },
      { code: "BR", label: "Bank Receipt" },
      { code: "CP", label: "Cash Payment" },
      { code: "CR", label: "Cash Receipt" },
    ]
  },
  {
    label: "Sales & Purchase",
    types: [
      { code: "SB", label: "Sale Bill" },
      { code: "PS", label: "Purchase Bill" },
      { code: "PR", label: "Purchase Return" },
      { code: "RB", label: "Service Bill" },
      { code: "XP", label: "Other Purchase" },
      { code: "DO", label: "Delivery Order" },
    ]
  },
  {
    label: "Credit & Debit Notes",
    types: [
      { code: "CN", label: "Credit Note — Customer" },
      { code: "CS", label: "Credit Note — Supplier" },
      { code: "DN", label: "Debit Note — Customer" },
      { code: "DS", label: "Debit Note — Supplier" },
    ]
  },
  {
    label: "Journals & Others",
    types: [
      { code: "JV", label: "Journal Voucher" },
      { code: "CV", label: "CV" },
      { code: "LV", label: "LV" },
      { code: "UI", label: "UTR Entry" },
    ]
  }
];

const ALL_TYPE_MAP = Object.fromEntries(
  TRANS_GROUPS.flatMap(g => g.types.map(t => [t.code, t.label]))
);

// ─── Inline styles for the dropdown ──────────────────────────────────────────

const ddStyles = {
  wrap: { position: "relative", display: "inline-block" },
  trigger: (open) => ({
    display: "flex", alignItems: "center", gap: 8, padding: "7px 12px",
    background: "#fff", border: `1px solid ${open ? "#378ADD" : "#d0d7de"}`,
    borderRadius: 8, cursor: "pointer", fontSize: 13, color: "#1a1a1a",
    minWidth: 260, justifyContent: "space-between", fontFamily: "inherit",
    boxShadow: open ? "0 0 0 3px rgba(55,138,221,0.12)" : "none",
    transition: "border-color 0.15s, box-shadow 0.15s",
  }),
  badge: (size, total) => ({
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    borderRadius: 20, fontSize: 11, fontWeight: 600, padding: "2px 9px", minWidth: 22,
    background: size === total ? "#EAF3DE" : size === 0 ? "#FCEBEB" : "#E6F1FB",
    color: size === total ? "#3B6D11" : size === 0 ? "#A32D2D" : "#0C447C",
  }),
  dropdown: {
    position: "absolute", zIndex: 1000, top: "calc(100% + 4px)", left: 0,
    background: "#fff", border: "1px solid #d0d7de", borderRadius: 12,
    width: 500, boxShadow: "0 8px 24px rgba(0,0,0,0.10)", overflow: "hidden",
  },
  header: {
    padding: "10px 12px", borderBottom: "1px solid #eaecef",
    display: "flex", alignItems: "center", gap: 8, background: "#f6f8fa",
  },
  searchInput: {
    flex: 1, padding: "5px 10px", fontSize: 13, border: "1px solid #d0d7de",
    borderRadius: 6, background: "#fff", color: "#1a1a1a", outline: "none",
    fontFamily: "inherit",
  },
  hBtn: (danger) => ({
    fontSize: 12, padding: "5px 10px", cursor: "pointer",
    border: "1px solid #d0d7de", borderRadius: 6, background: "#fff",
    color: danger ? "#A32D2D" : "#555", whiteSpace: "nowrap",
    fontFamily: "inherit",
  }),
  groups: { padding: 8, maxHeight: 300, overflowY: "auto" },
  groupLabel: {
    fontSize: 11, color: "#888", padding: "6px 6px 4px",
    textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600,
  },
  chipRow: { display: "flex", flexWrap: "wrap", gap: 5, padding: "0 2px 8px" },
  chip: (sel) => ({
    display: "inline-flex", alignItems: "center", gap: 5,
    padding: "4px 10px", borderRadius: 20, cursor: "pointer", fontSize: 12,
    border: `1px solid ${sel ? "#85B7EB" : "#e0e0e0"}`,
    background: sel ? "#E6F1FB" : "#f6f8fa",
    color: sel ? "#185FA5" : "#555",
    transition: "all 0.12s", userSelect: "none", fontFamily: "inherit",
  }),
  dot: (sel) => ({
    width: 6, height: 6, borderRadius: "50%", background: "#85B7EB",
    flexShrink: 0, display: sel ? "block" : "none",
  }),
  footer: {
    padding: "9px 12px", borderTop: "1px solid #eaecef",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    background: "#f6f8fa", gap: 10,
  },
  applyBtn: {
    padding: "7px 18px", fontSize: 13, fontWeight: 600,
    background: "#378ADD", color: "#fff", border: "none",
    borderRadius: 8, cursor: "pointer", fontFamily: "inherit", flexShrink: 0,
  },
  selPill: {
    display: "inline-flex", alignItems: "center", gap: 4,
    fontSize: 11, fontWeight: 600, background: "#E6F1FB", color: "#185FA5",
    borderRadius: 20, padding: "2px 8px",
  },
};

// ─── TransTypeDropdown ────────────────────────────────────────────────────────

function TransTypeDropdown({ selectedTypes, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState(new Set(selectedTypes));
  const wrapRef = useRef(null);
  const total = ALL_TRANS_TYPES.length;

  useEffect(() => { setDraft(new Set(selectedTypes)); }, [selectedTypes]);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false); setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleChip = (code) => {
    const next = new Set(draft);
    next.has(code) ? next.delete(code) : next.add(code);
    setDraft(next);
  };

  const applyFilter = () => { onChange(new Set(draft)); setOpen(false); setSearch(""); };

  const triggerLabel = () => {
    if (draft.size === total) return "All transaction types";
    if (draft.size === 0) return "No types selected";
    if (draft.size <= 3) return [...draft].join(", ");
    return `${draft.size} types selected`;
  };

  const filteredGroups = TRANS_GROUPS.map(g => ({
    ...g,
    types: g.types.filter(t =>
      t.code.toLowerCase().includes(search.toLowerCase()) ||
      t.label.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(g => g.types.length > 0);

  const selList = [...draft].slice(0, 6);
  const extraCount = draft.size > 6 ? draft.size - 6 : 0;

  return (
    <div style={ddStyles.wrap} ref={wrapRef}>
      {/* Trigger button */}
      <button type="button" style={ddStyles.trigger(open)} onClick={() => setOpen(v => !v)}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
            <rect x="1" y="1" width="12" height="3" rx="1.5" stroke="#888" strokeWidth="1.2" />
            <rect x="3" y="6" width="8" height="3" rx="1.5" stroke="#888" strokeWidth="1.2" />
            <rect x="5" y="11" width="4" height="1.5" rx="0.75" stroke="#888" strokeWidth="1.2" />
          </svg>
          <span>{triggerLabel()}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={ddStyles.badge(draft.size, total)}>{draft.size} / {total}</span>
          <svg
            width="14" height="14" viewBox="0 0 14 14" fill="none"
            style={{ flexShrink: 0, transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "none" }}
          >
            <path d="M3 5l4 4 4-4" stroke="#888" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={ddStyles.dropdown}>
          {/* Search + actions */}
          <div style={ddStyles.header}>
            <input
              style={ddStyles.searchInput}
              placeholder="Search types..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
            <button type="button" style={ddStyles.hBtn(false)}
              onClick={() => setDraft(new Set(ALL_TRANS_TYPES))}>
              Select all
            </button>
            <button type="button" style={ddStyles.hBtn(true)}
              onClick={() => setDraft(new Set())}>
              Clear
            </button>
          </div>

          {/* Grouped chips */}
          <div style={ddStyles.groups}>
            {filteredGroups.length === 0 && (
              <div style={{ textAlign: "center", padding: "20px 0", color: "#aaa", fontSize: 13 }}>
                No types match "{search}"
              </div>
            )}
            {filteredGroups.map(g => (
              <div key={g.label}>
                <div style={ddStyles.groupLabel}>{g.label}</div>
                <div style={ddStyles.chipRow}>
                  {g.types.map(t => {
                    const sel = draft.has(t.code);
                    return (
                      <div key={t.code} style={ddStyles.chip(sel)} onClick={() => toggleChip(t.code)}>
                        <div style={ddStyles.dot(sel)} />
                        <span style={{ fontWeight: 700, fontSize: 12, color: sel ? "#0C447C" : "#444" }}>
                          {t.code}
                        </span>
                        <span style={{ fontSize: 12, color: sel ? "#185FA5" : "#666" }}>
                          {t.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Footer: count pills + apply */}
          <div style={ddStyles.footer}>
            <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#1a1a1a" }}>
                {draft.size === 0
                  ? "Nothing selected"
                  : draft.size === total
                  ? `All ${total} selected`
                  : `${draft.size} of ${total} selected`}
              </span>
              {draft.size > 0 && draft.size < total && (
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {selList.map(c => (
                    <span key={c} style={ddStyles.selPill}>
                      {c}
                      <span
                        style={{ cursor: "pointer", marginLeft: 2, fontSize: 10, opacity: 0.7 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          const next = new Set(draft); next.delete(c); setDraft(next);
                        }}
                      >✕</span>
                    </span>
                  ))}
                  {extraCount > 0 && (
                    <span style={{ fontSize: 11, color: "#aaa" }}>+{extraCount} more</span>
                  )}
                </div>
              )}
            </div>
            <button type="button" style={ddStyles.applyBtn} onClick={applyFilter}>
              Apply filter
            </button>
          </div>
        </div>
      )}

      {/* Active filter chips shown below trigger when partial */}
      {/* {selectedTypes.size > 0 && selectedTypes.size < total && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 5 }}>Active filter:</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {[...selectedTypes].map(c => (
              <div key={c} style={{ ...ddStyles.chip(true), pointerEvents: "none" }}>
                <div style={ddStyles.dot(true)} />
                <span style={{ fontWeight: 700, fontSize: 12, color: "#0C447C" }}>{c}</span>
                <span style={{ fontSize: 12, color: "#185FA5" }}>{ALL_TYPE_MAP[c] || ""}</span>
              </div>
            ))}
          </div>
        </div>
      )} */}
    </div>
  );
}

// ─── Main GledgerReport component ────────────────────────────────────────────

const GledgerReport = () => {
  const companyCode = sessionStorage.getItem("Company_Code");
  const Year_Code = sessionStorage.getItem("Year_Code");
  const Company_Name = sessionStorage.getItem("Company_Name");
  const CompanyNameUpdatedDate = sessionStorage.getItem("CompanyNameUpdatedDate");
  const newCompanyName = sessionStorage.getItem("newCompanyName");
  const oldFormerlyName = sessionStorage.getItem("oldFormerlyName");

  const [ledgerData, setLedgerData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pdfPreview, setPdfPreview] = useState([]);
  const [totals, setTotals] = useState({ debit: 0, credit: 0 });
  const [filteredData, setFilteredData] = useState([]);
  const [pdfApiData, setPdfApiData] = useState({});
  const [selectedTypes, setSelectedTypes] = useState(new Set(ALL_TRANS_TYPES));

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const fromDate = searchParams.get('fromDate');
  const toDate = searchParams.get('toDate');
  const acCode = searchParams.get('acCode');
  const acname = searchParams.get('acname');
  const transTypeParam = searchParams.get('Trans_Type');

  const docDate = new Date(toDate);
  const cnameUpdatedDate = new Date(CompanyNameUpdatedDate);
  const displayCompanyName = docDate < cnameUpdatedDate ? newCompanyName : Company_Name;

  // Init selectedTypes from URL param — supports "All", "None", "BP,CR,JV"
  useEffect(() => {
    if (!transTypeParam || transTypeParam === "All") {
      setSelectedTypes(new Set(ALL_TRANS_TYPES));
    } else if (transTypeParam === "None") {
      setSelectedTypes(new Set());
    } else {
      const types = transTypeParam.split(",").map(t => t.trim().toUpperCase()).filter(Boolean);
      setSelectedTypes(new Set(types));
    }
  }, [transTypeParam]);

  // const calculateTotals = (data) => data.reduce(
  //   (acc, item) => {
  //     if (item.TRAN_TYPE === "OP") return acc;
  //     acc.debit += parseFloat(item.debit || 0);
  //     acc.credit += parseFloat(item.credit || 0);
  //     return acc;
  //   },
  //   { debit: 0, credit: 0 }
  // );


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

  // Re-filter on data or type selection change
  useEffect(() => {
    if (!ledgerData.length) return;
    const filtered = ledgerData.filter(item =>
      item.TRAN_TYPE === "OP" || selectedTypes.has(item.TRAN_TYPE?.toUpperCase())
    );
    setFilteredData(filtered);
    setTotals(calculateTotals(filtered));
  }, [ledgerData, selectedTypes]);

  const mergeOpeningBalanceToAllData = (openingBalance, allData) => {
    let opData = [];
    if (openingBalance.length === 0) {
      opData.push({ AC_CODE: 0, Ac_Name_E: "Opening Balance", Balance: 0, DOC_DATE: "", DOC_NO: "", NARRATION: "Opening balance", TRAN_TYPE: "OP", credit: 0, debit: 0, DRCR: "" });
    } else {
      opData = openingBalance.map(b => ({
        AC_CODE: b.AC_CODE, Ac_Name_E: "Opening Balance",
        Balance: b.OpBal ? Math.abs(parseFloat(b.OpBal)) : 0,
        DOC_DATE: "", DOC_NO: "", NARRATION: "Opening balance", TRAN_TYPE: "OP",
        credit: b.OpBal < 0 ? Math.abs(parseFloat(b.OpBal)) : 0,
        debit: b.OpBal > 0 ? Math.abs(parseFloat(b.OpBal)) : 0,
        DRCR: b.OpBal > 0 ? "D" : "C",
      }));
    }
    return [...opData, ...allData];
  };

  const handleCalculateBalance = async (details) => {
    const LedgerData = details.data.all_data;
    const OpBalData = details.data.Opening_Balance || [];
    let opBal = OpBalData.length > 0 ? OpBalData[0].OpBal : 0;
    const mergedData = mergeOpeningBalanceToAllData(OpBalData, LedgerData);
    mergedData.forEach(entry => {
      if (entry.drcr === "D") {
        opBal += Math.abs(parseFloat(entry.AMOUNT || 0));
      } else {
        opBal -= Math.abs(parseFloat(entry.AMOUNT || 0));
      }
      entry.Balance = opBal ? Math.abs(opBal).toFixed(2) : 0;
      entry.drcr = opBal > 0 ? "Dr" : "Cr";
    });
    return mergedData;
  };

  useEffect(() => {
    const fetchGLedgerReport = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${process.env.REACT_APP_API}/get_gLedgerReport_AcWise`,
          { params: { from_date: fromDate, to_date: toDate, Company_Code: companyCode, Accode: acCode } }
        );
        setLedgerData(await handleCalculateBalance(response));
      } catch (err) {
        setError("Error fetching report data.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchGLedgerReport();
  }, [acCode, fromDate, toDate]);

  // ─── PDF builder (shared by Print + PDF Preview) ──────────────────────────

  const buildPdfDoc = async () => {
    const doc = new jsPDF('portrait');
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let currentY = 9;
    const shouldUseImage = docDate >= cnameUpdatedDate;

    const response = await axios.get(`${process.env.REACT_APP_API}/accountmaster-address`, {
      params: { ac_code: acCode, Company_Code: companyCode }
    });
    const headerData = response.data?.[0] || {};
    const foormerlyName = fromDate < CompanyNameUpdatedDate ? oldFormerlyName : headerData.AL1;

    const logoImg = new Image(); logoImg.src = logo;
    const headerImg = new Image(); headerImg.src = HeaderJK;
    const footerImg1 = new Image(); footerImg1.src = FooterJK1;

    await new Promise(resolve => {
      logoImg.onload = () => {
        if (shouldUseImage) {
          doc.addImage(headerImg, "PNG", 0, 6, 180, 34);
        } else {
          doc.addImage(logoImg, "PNG", 10, currentY, 30, 30);
          doc.setFont("Signika-Bold"); doc.setFontSize(14);
          doc.text(displayCompanyName, 45, currentY + 5);
          doc.setFont("Signika-Regular"); doc.setFontSize(9);
          doc.text(`${foormerlyName}`, 45, currentY + 9);
          doc.text(headerData.AL2 || "", 45, currentY + 13);
          doc.text(headerData.AL3 || "", 45, currentY + 17);
          doc.text(headerData.AL4 || "", 45, currentY + 21);
          doc.text(headerData.Other || "", 45, currentY + 25);
          if (headerData.BillFooter) doc.text(headerData.BillFooter, 45, currentY + 29);
        }
        resolve();
      };
    });

    doc.setDrawColor(80, 80, 80);
    doc.line(10, 44, 200, 44);
    currentY += 40;

    doc.setFont("Signika-Bold"); doc.setFontSize(10);
    doc.setTextColor(0, 128, 0);
    doc.text("LEDGER ACCOUNT", pageWidth / 2, 49, { align: "center" });
    doc.setTextColor(0, 0, 0);
    doc.line(10, 52, 200, 52);
    currentY += 2;

    let leftY = currentY;
    doc.setFont("Signika-Regular"); doc.setFontSize(8);
    doc.text("To,", 12, leftY + 5);
    doc.setFont("Signika-Bold"); doc.setTextColor(0, 128, 0);
    doc.text(`${headerData.Ac_Name_E} (${acCode})`, 12, leftY + 10);
    doc.setFont("Signika-Regular"); doc.setTextColor(0, 0, 0);
    const addressLines = doc.splitTextToSize(headerData.Address_E || "", 100);
    addressLines.forEach((line, i) => doc.text(line, 12, leftY + 15 + i * 5));
    let nextY = leftY + 15 + addressLines.length * 5;
    doc.text(`City: ${headerData.cityname} (${headerData.State_Name} - ${headerData.GSTStateCode})`, 12, nextY); nextY += 5;
    doc.text(`GST: ${headerData.Gst_No}`, 12, nextY); nextY += 5;
    if (headerData.Email) doc.text(`Email: ${headerData.Email}`, 12, nextY);

    const summaryX = 135; let rightY = currentY;
    const openingBalance = ledgerData[0]?.TRAN_TYPE === "OP" ? parseFloat(ledgerData[0]?.Balance) : 0;
    const net = parseFloat(totals.debit - totals.credit);

    doc.setFont("Signika-Regular");
    doc.text(`Ledger from ${formatDate(fromDate)} to ${formatDate(toDate)}`, summaryX, rightY + 5); rightY += 5;
    doc.setFont("Signika-Bold"); doc.text("SUMMARY", summaryX, rightY + 5); rightY += 5;
    doc.setFont("Signika-Regular");
    doc.text("Opening Balance", summaryX, rightY + 5);
    doc.text(`${formatReadableAmount(openingBalance || 0)} Cr.`, summaryX + 60, rightY + 5, { align: "right" }); rightY += 5;
    doc.text("Credited Amount", summaryX, rightY + 5);
    doc.text(`${formatReadableAmount(totals.credit)} Cr.`, summaryX + 60, rightY + 5, { align: "right" }); rightY += 5;
    doc.text("Debited Amount", summaryX, rightY + 5);
    doc.text(`${formatReadableAmount(totals.debit)} Dr.`, summaryX + 60, rightY + 5, { align: "right" }); rightY += 5;
    doc.text("Closing Balance", summaryX, rightY + 5);
    doc.line(summaryX, rightY + 2, 195, rightY + 2);
    doc.setFont("Signika-Bold");
    doc.text(`${formatReadableAmount(Math.abs(net))} ${net > 0 ? "Dr." : "Cr."}`, summaryX + 60, rightY + 5, { align: "right" });
    doc.line(summaryX, rightY + 7, 195, rightY + 7);
    currentY = Math.max(leftY + 40, rightY + 8);

    const drawTableHeader = () => {
      doc.setFont("Signika-Bold");
      doc.line(10, currentY - 4, 200, currentY - 4);
      doc.text("Date", 12, currentY);
      doc.text("Particulars", 35, currentY);
      doc.text("Vch Type", 95, currentY, { align: "center" });
      doc.text("Vch No.", 113, currentY, { align: "center" });
      doc.text("Debit", 140, currentY, { align: "right" });
      doc.text("Credit", 165, currentY, { align: "right" });
      doc.text("Balance", 190, currentY, { align: "right" });
      doc.line(10, currentY + 2, 200, currentY + 2);
      currentY += 5;
    };

    const drawFooter = (pageNum, totalPages, showFullFooter = false) => {
      const fImgH = 40, fImgY = pageHeight - fImgH - 12, pNumY = pageHeight - 5;
      if (showFullFooter) {
        doc.setDrawColor(160); doc.setLineWidth(0.5);
        if (shouldUseImage) {
          doc.addImage(FooterJK, "PNG", 0, fImgY, 260, fImgH);
        } else {
          doc.addImage(footerImg1, "PNG", 0, fImgY, 210, fImgH);
        }
      }
      doc.setFont("Signika-Regular"); doc.setFontSize(8);
      doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth / 2, pNumY, { align: "center" });
    };

    doc.setFont("Signika-Regular");
    drawTableHeader();
    const usablePageHeight = pageHeight - 35;

    for (let i = 0; i < filteredData.length; i++) {
      const item = filteredData[i];
      const nLines = doc.splitTextToSize(item.NARRATION || "", 55);
      const reqH = nLines.length * 5;
      if (currentY + 10 > usablePageHeight) { doc.addPage(); currentY = 10; drawTableHeader(); }
      doc.setFont("Signika-Regular");
      doc.text(item.DOC_DATE || "", 12, currentY + 1);
      doc.text(item.TRAN_TYPE || "", 95, currentY + 1, { align: "center" });
      doc.text(String(item.DOC_NO), 113, currentY + 1, { align: "center" });
      doc.text(formatReadableAmount(item.debit || 0), 140, currentY + 1, { align: "right" });
      doc.text(formatReadableAmount(item.credit || 0), 165, currentY + 1, { align: "right" });
      doc.text(formatReadableAmount(Math.abs(item.Balance || 0)), 190, currentY + 1, { align: "right" });
      doc.text(item.drcr, 191, currentY + 1, { align: "left" });
      nLines.forEach((line, idx) => doc.text(line, 35, currentY + 1 + idx * 5));
      currentY += reqH;
    }

    if (currentY + 10 > usablePageHeight) { doc.addPage(); currentY = 10; drawTableHeader(); }
    const net2 = parseFloat(totals.debit - totals.credit);
    doc.setFont("Signika-Bold");
    doc.line(10, currentY - 2, 200, currentY - 2);
    doc.text(formatReadableAmount(totals.debit.toFixed(2)), 140, currentY + 2, { align: "right" });
    doc.text(formatReadableAmount(totals.credit.toFixed(2)), 165, currentY + 2, { align: "right" });
    doc.text(formatReadableAmount(Math.abs(net2).toFixed(2)), 190, currentY + 2, { align: "right" });
    doc.text(net2 > 0 ? "Dr." : "Cr.", 191, currentY + 2, { align: "left" });
    doc.line(10, currentY + 4, 200, currentY + 4);
    doc.setFont("Signika-Regular");
    doc.text("***END OF LEDGER*** ", 90, currentY + 8);

    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      drawFooter(i, totalPages, i === totalPages || totalPages === 1);
    }


    const closingBalanceValue = Math.abs(net);
    const closingBalanceType = net > 0 ? "Dr." : "Cr.";

    const closingBalanceFormatted =
      net !== 0
        ? `${formatReadableAmount(closingBalanceValue)} ${closingBalanceType}`
        : "0.00";

    console.log(closingBalanceFormatted,"closingBalanceFormatted")

    setPdfApiData({
      acCode: acCode,                        
      acname: acname,                        
      fromDate: formatDate(fromDate),         
      toDate: formatDate(toDate),     
      Balance: `₹ ${closingBalanceFormatted}`,
      Company_Name_E: displayCompanyName,    
     });

    return doc;
  };

  const handlePrint = async () => {
    const doc = await buildPdfDoc();
    doc.autoPrint();
    const w = window.open(doc.output("bloburl"), "_blank");
    w.print();
  };

  const generatePdf = async () => {
    const doc = await buildPdfDoc();
    setPdfPreview(URL.createObjectURL(doc.output('blob')));
  };

  const handleExportToExcel = () => {
    const wb = XLSX.utils.book_new();
    const headers = [
      [displayCompanyName],
      [`Account Statement of: (${acCode || ""}) ${acname || ""}`],
      [`From Date: ${formatDate(fromDate) || ""} To Date: ${formatDate(toDate) || ""}`],
      [],
      ["Trans Type", "Doc No", "Date", "Narration", "Debit", "Credit", "Balance", "DR/CR", "Do No"]
    ];
    const dataRows = filteredData.map(item => {
      let fd = "";
      if (item.DOC_DATE) {
        const p = item.DOC_DATE.split(/[-/]/);
        fd = p.length === 3 ? `${p[0].padStart(2, '0')}/${p[1].padStart(2, '0')}/${p[2]}` : item.DOC_DATE;
      }
      return [item.TRAN_TYPE, item.DOC_NO, fd, item.NARRATION,
        parseFloat(item.debit || 0), parseFloat(item.credit || 0),
        parseFloat(item.Balance || 0), item.drcr, item.do_no];
    });
    const td = filteredData.reduce((s, i) => s + parseFloat(i.debit || 0), 0);
    const tc = filteredData.reduce((s, i) => s + parseFloat(i.credit || 0), 0);
    const totalsRow = ["", "", "", "Totals", td, tc, Math.abs(td - tc), td > tc ? 'Dr' : 'Cr', ""];
    const ws = XLSX.utils.aoa_to_sheet([...headers, ...dataRows, totalsRow]);
    ws["!cols"] = [{ wch: 10 }, { wch: 8 }, { wch: 10 }, { wch: 30 },
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 8 }, { wch: 8 }];
    XLSX.utils.book_append_sheet(wb, ws, "Ledger Report");
    XLSX.writeFile(wb, `Account Statement of ${acname || "Ledger"}.xlsx`);
  };

  const convertDateToISO = (dateStr) => {
    const p = (dateStr || "").split('/');
    return p.length === 3 ? `${p[2]}-${p[1]}-${p[0]}` : null;
  };

  const handleRowClick = (doc_no, tran_type, DOC_DATE) => {
    if (doc_no === 0) {
      Swal.fire({ title: "Invalid Document Number", text: "The document number is invalid", icon: "error", confirmButtonText: "OK" });
      return;
    }
    if (!validateDocumentDate(convertDateToISO(DOC_DATE), sessionStorage.getItem('Accounting_Year'))) return;
    const routeMap = {
      CV: `/commission-bill?selectedVoucherNo=${doc_no}&selectedVoucherType=${tran_type}`,
      LV: `/commission-bill?selectedVoucherNo=${doc_no}&selectedVoucherType=${tran_type}`,
      CR: `/receipt-payment?navigatedRecord=${doc_no}&navigatedTranType=${tran_type}`,
      BR: `/receipt-payment?navigatedRecord=${doc_no}&navigatedTranType=${tran_type}`,
      BP: `/receipt-payment?navigatedRecord=${doc_no}&navigatedTranType=${tran_type}`,
      CP: `/receipt-payment?navigatedRecord=${doc_no}&navigatedTranType=${tran_type}`,
      UI: `/utr-entry?navigatedRecord=${doc_no}`,
      JV: `/journal-voucher?navigatedRecord=${doc_no}&navigatedTranType=${tran_type}`,
      DN: `/debitcreditnote?navigatedRecord=${doc_no}&navigatedTranType=${tran_type}`,
      DS: `/debitcreditnote?navigatedRecord=${doc_no}&navigatedTranType=${tran_type}`,
      CN: `/debitcreditnote?navigatedRecord=${doc_no}&navigatedTranType=${tran_type}`,
      CS: `/debitcreditnote?navigatedRecord=${doc_no}&navigatedTranType=${tran_type}`,
      XP: `/other-purchase?navigatedRecord=${doc_no}&navigatedTranType=${tran_type}`,
      RB: `/service-bill?navigatedRecord=${doc_no}`,
      SB: `/sale-bill?navigatedRecord=${doc_no}`,
      PS: `/sugarpurchasebill?navigatedRecord=${doc_no}`,
      PR: `/sugar-sale-return-purchase?navigatedRecord=${doc_no}`,
      RS: `/sugar-sale-return-sale?navigatedRecord=${doc_no}`,
      DO: `/delivery-order?navigatedRecord=${doc_no}`,
    };
    const path = routeMap[tran_type];
    if (path) window.open(`${window.location.origin}${path}`, '_blank');
  };

  // ─── Derived summary values ───────────────────────────────────────────────
  const openingBalanceRow = ledgerData[0]?.TRAN_TYPE === "OP" ? ledgerData[0] : null;
  const openingBalance = openingBalanceRow ? parseFloat(openingBalanceRow.Balance || 0) : 0;
  const openingDRCR = openingBalanceRow?.drcr || "";
  const net = totals.debit - totals.credit;

  const summaryCards = [
    { label: "Opening", value: `₹${formatReadableAmount(openingBalance)}`, sub: openingDRCR, color: "#185FA5", bg: "#E6F1FB", border: "#378ADD" },
    { label: "Total debit", value: `₹${formatReadableAmount(totals.debit.toFixed(2))}`, sub: "Dr", color: "#A32D2D", bg: "#FCEBEB", border: "#E24B4A" },
    { label: "Total credit", value: `₹${formatReadableAmount(totals.credit.toFixed(2))}`, sub: "Cr", color: "#3B6D11", bg: "#EAF3DE", border: "#639922" },
    { label: "Closing balance", value: `₹${formatReadableAmount(Math.abs(net).toFixed(2))}`, sub: net > 0 ? "Dr" : "Cr", color: "#533AB7", bg: "#EEEDFE", border: "#7F77DD" },
  ];

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="ledger-report-container">

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap", alignItems: "center" }}>
        <button className="btn btn-secondary" onClick={handlePrint}>Print Report</button>
        <button className="btn btn-success" onClick={handleExportToExcel}>Export to Excel</button>
        <button className="btn btn-secondary" onClick={generatePdf}>PDF Preview</button>
        {pdfPreview && pdfPreview.length > 0 && (
          <PdfPreview pdfData={pdfPreview} apiData={pdfApiData} label={"ledger_print"} />
        )}
      </div>

      {/* Company heading */}
      <Typography variant="h6" style={{ textAlign: 'center', fontSize: 22, fontWeight: 600, marginTop: 10 }}>
        {displayCompanyName}
      </Typography>
      <p style={{ marginTop: 4, marginBottom: 12 }}>
        <strong>
          ({acCode || ""}) {acname || ""}{" "}
          From: {fromDate ? formatDate(fromDate) : "N/A"}{" "}
          To: {toDate ? formatDate(toDate) : "N/A"}
        </strong>
      </p>

      {/* ── Filter row: dropdown + summary cards ── */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap", marginBottom: 16 }}>

        {/* Dropdown */}
        <TransTypeDropdown selectedTypes={selectedTypes} onChange={setSelectedTypes} />

        {/* Summary cards */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "stretch" }}>
          {summaryCards.map(c => (
            <div key={c.label} style={{
              background: c.bg, borderRadius: 8, padding: "7px 14px",
              minWidth: 115, borderLeft: `3px solid ${c.border}`,
            }}>
              <div style={{ fontSize: 11, color: c.color, fontWeight: 600, marginBottom: 2 }}>{c.label}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: c.color }}>
                {c.value} <span style={{ fontSize: 11, fontWeight: 500 }}>{c.sub}</span>
              </div>
            </div>
          ))}
          {/* <div style={{
            background: "#f6f8fa", borderRadius: 8, padding: "7px 14px",
            minWidth: 90, borderLeft: "3px solid #b0b0b0",
          }}>
            <div style={{ fontSize: 11, color: "#888", fontWeight: 600, marginBottom: 2 }}>Rows shown</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a" }}>
              {filteredData.filter(r => r.TRAN_TYPE !== "OP").length}
              <span style={{ fontSize: 11, color: "#aaa", fontWeight: 400 }}>
                {" "}/ {ledgerData.filter(r => r.TRAN_TYPE !== "OP").length}
              </span>
            </div>
          </div> */}
        </div>
      </div>

      {/* Loading / Error */}
      {loading && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 120 }}>
          {/* <RingLoader /> */}
                   <ScaleLoader color="#1005ad" height={35} width={4} radius={2} margin={2} />
        </div>
      )}
      {error && <p className="error-message">{error}</p>}

      {/* Table */}
      {filteredData.length > 0 && (
        <div style={{ maxHeight: 800, overflowY: "auto" }}>
          <table id="reportTable" style={{ marginBottom: 60, width: "100%" }}>
            <thead style={{ position: "sticky", top: 0, backgroundColor: "#fff", zIndex: 1, whiteSpace: "nowrap" }}>
              <tr>
                <th>Trans Type</th>
                <th>Doc No</th>
                <th>Date</th>
                <th>Narration</th>
                <th style={{ textAlign: "right" }}>Debit</th>
                <th style={{ textAlign: "right" }}>Credit</th>
                <th style={{ textAlign: "right" }}>Balance</th>
                <th>DR/CR</th>
                <th>Do No</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, index) => (
                <tr key={index}>
                  <td>{item.TRAN_TYPE}</td>
                  <td
                    onClick={() => handleRowClick(item.DOC_NO, item.TRAN_TYPE, item.DOC_DATE)}
                    style={{ cursor: "pointer", fontWeight: "bold", color: "darkslategray" }}
                    onMouseOver={e => { e.target.style.color = 'black'; e.target.style.textDecoration = 'underline'; }}
                    onMouseOut={e => { e.target.style.color = 'darkslategray'; e.target.style.textDecoration = 'none'; }}
                  >{item.DOC_NO}</td>
                  <td>{item.DOC_DATE}</td>
                  <td>{item.NARRATION}</td>
                  <td style={{ textAlign: "right" }}>{formatReadableAmount(parseFloat(item.debit || 0).toFixed(2))}</td>
                  <td style={{ textAlign: "right" }}>{formatReadableAmount(parseFloat(item.credit || 0).toFixed(2))}</td>
                  <td style={{ textAlign: "right" }}>{formatReadableAmount(parseFloat(item.Balance || 0).toFixed(2))}</td>
                  <td>{item.drcr}</td>
                  <td
                    onClick={() => handleRowClick(item.do_no, "DO", item.DOC_DATE)}
                    style={{ cursor: "pointer", fontWeight: "bold", color: "darkslategray" }}
                    onMouseOver={e => { e.target.style.color = 'black'; e.target.style.textDecoration = 'underline'; }}
                    onMouseOut={e => { e.target.style.color = 'darkslategray'; e.target.style.textDecoration = 'none'; }}
                  >{item.do_no}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: "yellow" }}>
                <td colSpan="4" align="right"><strong>Totals</strong></td>
                <td style={{ textAlign: "right" }}><strong>{formatReadableAmount(totals.debit.toFixed(2))}</strong></td>
                <td style={{ textAlign: "right" }}><strong>{formatReadableAmount(totals.credit.toFixed(2))}</strong></td>
                <td style={{ textAlign: "right" }}><strong>{formatReadableAmount(Math.abs(totals.debit - totals.credit).toFixed(2))}</strong></td>
                <td><strong>{(totals.debit - totals.credit) > 0 ? 'Dr' : 'Cr'}</strong></td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};

export default GledgerReport;




// import React, { useState, useEffect } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import axios from "axios";
// import '../../Reports/Ledger/GledgerReport.css'
// import * as XLSX from 'xlsx';
// import { jsPDF } from 'jspdf';
// import 'jspdf-autotable';
// import PdfPreview from "../../../Common/PDFPreview"
// import { Typography } from '@mui/material';
// import { RingLoader } from 'react-spinners';
// import { formatDate } from '../../../Common/FormatFunctions/FormatDate'
// import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount"
// import { validateDocumentDate } from "../../../Common/ValidateDateRange/ValidateDateRange"
// import "../../../Common/Fonts/Signika-Bold-normal";
// import "../../../Common/Fonts/Signika-Regular-normal";
// import "../../../Common/Fonts/Signika-Medium-normal";
// import logo from "../../../Assets/jklogo.png";
// import FooterJK from "../../../Assets/FooterJK.png";
// import HeaderJK from "../../../Assets/HeaderJK.png";
// import FooterJK1 from "../../../Assets/FooterJK1.png";
// import Swal from "sweetalert2";

// const GledgerReport = () => {
//   const companyCode = sessionStorage.getItem("Company_Code");
//   const Year_Code = sessionStorage.getItem("Year_Code");
//   const Company_Name = sessionStorage.getItem("Company_Name");
//   const Company_Address = sessionStorage.getItem("Company_Address");
//   const Company_GSTNo = sessionStorage.getItem("Company_GSTNO")
//   const Company_PanNo = sessionStorage.getItem("Company_PanNo")
//   //const [displayCompanyName, setDisplayCompanyName] = useState(Company_Name);

//   const CompanyNameUpdatedDate = sessionStorage.getItem("CompanyNameUpdatedDate")
//   const newCompanyName = sessionStorage.getItem("newCompanyName")
//    const oldFormerlyName = sessionStorage.getItem("oldFormerlyName")


//   const API_URL = process.env.REACT_APP_API;
//   const [ledgerData, setLedgerData] = useState([]);
//   const [ledgerDataExcel, setLedgerDataExcel] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [pdfPreview, setPdfPreview] = useState([])

//   const location = useLocation();
//   const searchParams = new URLSearchParams(location.search);
//   const fromDate = searchParams.get('fromDate');
//   const toDate = searchParams.get('toDate');
//   const acCode = searchParams.get('acCode');
//   const acname = searchParams.get('acname');
//   const transType = searchParams.get('Trans_Type');
//   const [totals, setTotals] = useState({ debit: 0, credit: 0 });
//   const [filteredData, setFilteredData] = useState([]);
  

//   const calculateTotals = (data) => {
//     const totals = data.reduce(
//       (acc, item) => {
//         acc.debit += parseFloat(item.debit || 0);
//         acc.credit += parseFloat(item.credit || 0);
//         return acc;
//       },
//       { debit: 0, credit: 0 }
//     );
//     return totals;
//   };

//   useEffect(() => {
//     const fetchGLedgerReport = async () => {
//       try {
//         setLoading(true);
//         const response = await axios.get(
//           `${process.env.REACT_APP_API}/get_gLedgerReport_AcWise`,
//           {
//             params: {
//               from_date: fromDate,
//               to_date: toDate,
//               Company_Code: companyCode,
//               Accode: acCode
//             },
//           }
//         );

//         const data = response.data.all_data || [];
//         const BalanceData = await handleCalculateBalance(response);

//         let filteredData = BalanceData;
//         if (transType && transType !== "All") {
//           filteredData = BalanceData.filter(item =>
//             item.TRAN_TYPE?.toUpperCase() === transType.toUpperCase()
//           );
//         }

//         setLedgerData(BalanceData);
//         setFilteredData(filteredData);
//         setTotals(calculateTotals(filteredData));

//       } catch (err) {
//         setError("Error fetching report data.");
//         console.error(err);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchGLedgerReport();
//   }, [acCode, fromDate, toDate, transType]);


//    const docDate = new Date(toDate);
//       const cnameUpdatedDate = new Date(CompanyNameUpdatedDate);
  
//       const displayCompanyName =
//         docDate < cnameUpdatedDate
//           ? newCompanyName
//           : Company_Name
  
  
//   const mergeOpeningBalanceToAllData = (openingBalance, allData) => {
//     let openingBalanceData = []
//     if (openingBalance.length === 0) {
//       openingBalanceData.push({
//         AC_CODE: 0,
//         Ac_Name_E: "Opening Balance",
//         Balance: 0,
//         DOC_DATE: "",
//         DOC_NO: "",
//         NARRATION: "Opening balance",
//         TRAN_TYPE: "OP",
//         credit: 0,
//         debit: 0,
//         DRCR: ""
//       })
//     }
//     else {
//       openingBalanceData = openingBalance.map((balance) => ({
//         AC_CODE: balance.AC_CODE,
//         Ac_Name_E: "Opening Balance",
//         Balance: balance.OpBal ? Math.abs(parseFloat(balance.OpBal)) : 0,
//         DOC_DATE: "",
//         DOC_NO: "",
//         NARRATION: "Opening balance",
//         TRAN_TYPE: "OP",
//         credit: balance.OpBal < 0 ? Math.abs(parseFloat(balance.OpBal)) : 0,
//         debit: balance.OpBal > 0 ? Math.abs(parseFloat(balance.OpBal)) : 0,
//         DRCR: balance.OpBal > 0 ? "D" : "C",
//       }))
//     };
//     return [...openingBalanceData, ...allData];
//   };

//   const handleCalculateBalance = async (details) => {
//     const LedgerData = details.data.all_data;
//     const OpBalData = details.data.Opening_Balance ? details.data.Opening_Balance : "";
//     let opBal = OpBalData.length > 0 ? OpBalData[0].OpBal : 0;
//     let netdebit = 0;
//     let netcredit = 0;
//     if (opBal > 0) {
//       netdebit = opBal;
//     }
//     else {
//       netcredit = -opBal;
//     }
//     const mergedData = mergeOpeningBalanceToAllData(OpBalData, LedgerData);
//     mergedData.forEach((entry) => {
//       if (entry.drcr === "D") {
//         opBal = opBal + Math.abs(parseFloat(entry.AMOUNT || 0).toFixed(2));
//         netdebit += parseFloat(entry.AMOUNT || 0);
//       } else {
//         opBal = opBal - Math.abs(parseFloat(entry.AMOUNT || 0).toFixed(2));
//         netcredit += parseFloat(entry.AMOUNT || 0).toFixed(2);
//       }
//       entry.Balance = opBal ? Math.abs(opBal).toFixed(2) : 0;
//       entry.drcr = opBal > 0 ? "Dr" : "Cr";
//     });
//     return mergedData;
//   }

 
//   const handlePrint = async () => {
//     const doc = new jsPDF('portrait');
//     const pageWidth = doc.internal.pageSize.width;
//     const pageHeight = doc.internal.pageSize.height;
//     let currentY = 9;

//     const response = await axios.get(`${process.env.REACT_APP_API}/accountmaster-address`, {
//      params: { ac_code: acCode, Company_Code: companyCode }
//     });
//     const headerData = response.data?.[0] || {};

//     const foormerlyName = fromDate < CompanyNameUpdatedDate ? oldFormerlyName : headerData.AL1

//     // Logo
//     const logoImg = new Image();
//     logoImg.src = logo;
//     const headerImg = new Image();
//     const footerImg1 = new Image();
//     headerImg.src = HeaderJK;
//         footerImg1.src = FooterJK1
//         const shouldUseImage =
//   docDate >= cnameUpdatedDate
//     await new Promise(resolve => {
//   logoImg.onload = () => {
//     if (shouldUseImage) {
//       // Use header image across top (new template)
//       doc.addImage(headerImg, "PNG", 0, 6, 180, 34); // full width
//     } else {
//       // Use logo + address details
//       doc.addImage(logoImg, "PNG", 10, currentY, 30, 30);

//       // Header text
//       doc.setFont("Signika-Bold");
//       doc.setFontSize(14);
//       doc.text(displayCompanyName, 45, currentY + 5);

//       doc.setFont("Signika-Regular");
//       doc.setFontSize(9);
//       doc.text(`${foormerlyName}`, 45, currentY + 9);
//       doc.text(headerData.AL2 || "", 45, currentY + 13);
//       doc.text(headerData.AL3 || "", 45, currentY + 17);
//       doc.text(headerData.AL4 || "", 45, currentY + 21);
//       doc.text(headerData.Other || "", 45, currentY + 25);
//       if (headerData.BillFooter) {
//         doc.text(headerData.BillFooter, 45, currentY + 29);
//       }
//     }

//     resolve();
//   };
// });
//     doc.setDrawColor(80, 80, 80);
//     doc.line(10, 44, 200, 44);
//     currentY += 40;

//     // Section title
//     doc.setFont("Signika-Bold");
//     doc.setFontSize(10);
//     doc.setTextColor(0, 128, 0);
//     doc.text("LEDGER ACCOUNT", pageWidth / 2, 49, { align: "center" });
//     doc.setTextColor(0, 0, 0);
//     doc.line(10, 52, 200, 52);
//     currentY += 2;

//     let leftY = currentY;
// doc.setFont("Signika-Regular");
// doc.setFontSize(8);
// doc.text("To,", 12, leftY + 5);

// doc.setFont("Signika-Bold");
// doc.setTextColor(0, 128, 0);
// doc.text(`${headerData.Ac_Name_E} (${acCode})`, 12, leftY + 10);

// doc.setFont("Signika-Regular");
// doc.setTextColor(0, 0, 0);

// let addressLines = doc.splitTextToSize(headerData.Address_E || "", 100); 
// for (let i = 0; i < addressLines.length; i++) {
//   doc.text(addressLines[i], 12, leftY + 15 + i * 5); 
// }

// let addressBlockHeight = addressLines.length * 5;
// let nextY = leftY + 15 + addressBlockHeight;

// doc.text(`City: ${headerData.cityname} (${headerData.State_Name} - ${headerData.GSTStateCode})`, 12, nextY);
// nextY += 5;

// doc.text(`GST: ${headerData.Gst_No}`, 12, nextY);
// nextY += 5;

// if (headerData.Email) {
//   doc.text(`Email: ${headerData.Email}`, 12, nextY);
// }

//     // Summary
//     const summaryX = 135;
//     let rightY = currentY;
//     const openingBalance = ledgerData[0]?.TRAN_TYPE === "OP" ? parseFloat(ledgerData[0]?.Balance) : 0;
//     const net = parseFloat(totals.debit - totals.credit);

//     doc.setFont("Signika-Regular");
//     doc.text(`Ledger from ${formatDate(fromDate)} to ${formatDate(toDate)}`, summaryX, rightY + 5);
//     rightY += 5;

//     doc.setFont("Signika-Bold");
//     doc.text("SUMMARY", summaryX, rightY + 5);
//     rightY += 5;

//     doc.setFont("Signika-Regular");
//     doc.text("Opening Balance", summaryX, rightY + 5);
//     doc.text(`${formatReadableAmount(openingBalance || 0)} Cr.`, summaryX + 60, rightY + 5, { align: "right" });

//     rightY += 5;
//     doc.text("Credited Amount", summaryX, rightY + 5);
//     doc.text(`${formatReadableAmount(totals.credit)} Cr.`, summaryX + 60, rightY + 5, { align: "right" });

//     rightY += 5;
//     doc.text("Debited Amount", summaryX, rightY + 5);
//     doc.text(`${formatReadableAmount(totals.debit)} Dr.`, summaryX + 60, rightY + 5, { align: "right" });

//     rightY += 5;
//     doc.text("Closing Balance", summaryX, rightY + 5);
//     doc.line(summaryX, rightY + 2, 195, rightY +2);
//     doc.setFont("Signika-Bold"); // Balance in bold
//     doc.text(`${formatReadableAmount(Math.abs(net))} ${net > 0 ? "Dr." : "Cr."}`, summaryX + 60, rightY + 5, { align: "right" });
//     doc.line(summaryX, rightY + 7, 195, rightY + 7);

//     currentY = Math.max(leftY + 40, rightY + 8);

//     // Table Header
//     const drawTableHeader = () => {
//       doc.setFont("Signika-Bold");
//       doc.line(10, currentY - 4, 200, currentY - 4);
//       doc.text("Date", 12, currentY);
//       doc.text("Particulars", 35, currentY);
//       doc.text("Vch Type", 95, currentY, { align: "center" });
//       doc.text("Vch No.", 113, currentY, { align: "center" });
//       doc.text("Debit", 140, currentY, { align: "right" });
//       doc.text("Credit", 165, currentY, { align: "right" });
//       doc.text("Balance", 190, currentY, { align: "right" });
//       //doc.text("Dr/Cr", 195, currentY, { align: "left" });
//       doc.line(10, currentY + 2, 200, currentY + 2);
//       currentY += 5;
//     };

//     // Footer
//     const drawFooter = (pageNum, totalPages, showFullFooter = false) => {
//       const footerImageHeight = 28;
//       const footerImageY = pageHeight - footerImageHeight - 12;
//       const pageNumberY = pageHeight - 5;

//       if (showFullFooter) {
//         doc.setDrawColor(160);
//         doc.setLineWidth(0.5);
//         if(shouldUseImage)
//         {
//         doc.addImage(FooterJK, "PNG", 0, footerImageY, 260, footerImageHeight);
//         }else{
//             doc.addImage(footerImg1, "PNG", 0, footerImageY, 210, footerImageHeight);
//         }
//       }

//       doc.setFont("Signika-Regular");
//       doc.setFontSize(8);
//       doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth / 2, pageNumberY, { align: "center" });
//     };


//     // Body Rendering
//     doc.setFont("Signika-Regular");
//     drawTableHeader();

//     const footerHeight = 35; // full footer height (image + spacing)
//     const marginBottom = 10;
//     const usablePageHeight = pageHeight - footerHeight;

//     for (let i = 0; i < filteredData.length; i++) {
//       const item = filteredData[i];
//       const narrationX = 35;
//       const narrationMaxWidth = 55;
//       const lineHeight = 5;
//       const narrationLines = doc.splitTextToSize(item.NARRATION || "", narrationMaxWidth);
//       const requiredHeight = narrationLines.length * lineHeight;

//     if (currentY + 10 > usablePageHeight) {
//   doc.addPage();
//   currentY = 10;
//   drawTableHeader();
// }

//       doc.setFont("Signika-Regular");
//       const drcrText = item.drcr;

//       doc.text(item.DOC_DATE || "", 12, currentY + 1);
//       doc.text(item.TRAN_TYPE || "", 95, currentY + 1, { align: "center" });
//       doc.text(String(item.DOC_NO), 113, currentY + 1, { align: "center" });
//       doc.text(formatReadableAmount(item.debit || 0), 140, currentY + 1, { align: "right" });
//       doc.text(formatReadableAmount(item.credit || 0), 165, currentY + 1, { align: "right" });
//       doc.text(formatReadableAmount(Math.abs(item.Balance || 0)), 190, currentY + 1, { align: "right" });
//       doc.text(drcrText, 191, currentY + 1, { align: "left" });

//       narrationLines.forEach((line, index) => {
//         doc.text(line, narrationX, currentY + 1 + index * lineHeight);
//       });

//       currentY += requiredHeight;
//     }


//     // Totals Row
//     if (currentY + 10 > usablePageHeight) {
//       doc.addPage();
//       currentY = 10;
//       drawTableHeader();
//     }

//     doc.setFont("Signika-Bold");
//     doc.line(10, currentY - 2, 200, currentY - 2);
//     doc.text(formatReadableAmount(totals.debit.toFixed(2)), 140, currentY + 2, { align: "right" });
//     doc.text(formatReadableAmount(totals.credit.toFixed(2)), 165, currentY + 2, { align: "right" });
//     doc.text(formatReadableAmount(Math.abs(net).toFixed(2)), 190, currentY + 2, { align: "right" });
//     doc.text(net > 0 ? "Dr." : "Cr.", 191, currentY + 2, { align: "left" });
//     doc.line(10, currentY + 4, 200, currentY + 4);
//     doc.setFont("Signika-Regular");
//     doc.text("***END OF LEDGER*** ", 90, currentY + 8)

//     const totalPages = doc.getNumberOfPages();

//     for (let i = 1; i <= totalPages; i++) {
//       doc.setPage(i);
//       const isLastPage = i === totalPages;
//       const isSinglePage = totalPages === 1;

//       // Show page number always, full footer only on last page or if single page
//       drawFooter(i, totalPages, isLastPage || isSinglePage);
//     }

//     doc.autoPrint();
//     const printWindow = window.open(doc.output("bloburl"), "_blank");
//     printWindow.print();
//   };

//   const handleExportToExcel = () => {
//   const wb = XLSX.utils.book_new();

//   const headers = [
//     [displayCompanyName],
//     [`Account Statement of: (${acCode || ""}) ${acname || ""}`],
//     [`From Date: ${formatDate(fromDate) || ""} To Date: ${formatDate(toDate) || ""}`],
//     [],
//     ["Trans Type", "Doc No", "Date", "Narration", "Debit", "Credit", "Balance", "DR/CR", "Do No"]
//   ];

//   const dataRows = filteredData.map(item => {
//     let formattedDate = "";
//     if (item.DOC_DATE) {
//       const dateParts = item.DOC_DATE.split(/[-/]/);
//       if (dateParts.length === 3) {
//         formattedDate = `${dateParts[0].padStart(2, '0')}/${dateParts[1].padStart(2, '0')}/${dateParts[2]}`;
//       } else {
//         formattedDate = item.DOC_DATE;
//       }
//     }

//     return [
//       item.TRAN_TYPE,
//       item.DOC_NO,
//       formattedDate,
//       item.NARRATION,
//       parseFloat(item.debit || 0),
//       parseFloat(item.credit || 0),
//       parseFloat(item.Balance || 0),
//       item.drcr,
//       item.do_no
//     ];
//   });


//   const totalDebit = filteredData.reduce((sum, item) => sum + parseFloat(item.debit || 0), 0);
//   const totalCredit = filteredData.reduce((sum, item) => sum + parseFloat(item.credit || 0), 0);
//   const totalBalance = Math.abs(totalDebit - totalCredit);
//   const drCr = totalDebit > totalCredit ? 'Dr' : 'Cr';


//   const totalsRow = [
//     "",
//     "",
//     "",
//     "Totals",
//     totalDebit,
//     totalCredit,
//     totalBalance,
//     drCr,
//     ""
//   ];

//   const wsData = [...headers, ...dataRows, totalsRow];
//   const ws = XLSX.utils.aoa_to_sheet(wsData);
  
//   ws["!cols"] = [
//     { wch: 10 },
//     { wch: 8 },
//     { wch: 10 },
//     { wch: 30 },
//     { wch: 15 },
//     { wch: 15 },
//     { wch: 15 },
//     { wch: 8 },
//     { wch: 8 },
//   ];

//   const range = XLSX.utils.decode_range(ws["!ref"]);

//   for (let R = 0; R <= range.e.r; R++) {
//     for (let C = 0; C <= range.e.c; C++) {
//       const cellRef = XLSX.utils.encode_cell({ r: R, c: C });

//       if (!ws[cellRef]) continue;


//       if (R < 4) {
//         ws[cellRef].s = {
//           font: { bold: true },
//           alignment: { horizontal: 'center' }
//         };
//         continue;
//       }


//       if (R === 4) {
//         ws[cellRef].s = {
//           font: { bold: true },
//           fill: { fgColor: { rgb: "D3D3D3" } }
//         };
//         continue;
//       }


//       if (R === range.e.r) {
//         ws[cellRef].s = {
//           font: { bold: true },
//           fill: { fgColor: { rgb: "FFFF00" } }, 
//           alignment: { horizontal: C >= 4 && C <= 6 ? 'right' : 'left' }
//         };
//         continue;
//       }

//       if ([4, 5, 6].includes(C)) {
//         ws[cellRef].t = 'n';
//         ws[cellRef].z = '#,##0.00';
//         ws[cellRef].s = { alignment: { horizontal: 'right' } };
//       }

//       if (C === 2 && R > 4) {
//         ws[cellRef].t = 's';
//         ws[cellRef].s = { alignment: { horizontal: 'left' } };
//       }
//     }
//   }

//   XLSX.utils.book_append_sheet(wb, ws, "Ledger Report");
//   XLSX.writeFile(wb, `Account Statement of ${acname || "Ledger"}.xlsx`);
// };


//   const convertDateToISO = (dateStr) => {
//     const parts = dateStr.split('/');
//     if (parts.length === 3) {
//       const day = parts[0];
//       const month = parts[1];
//       const year = parts[2];
//       return `${year}-${month}-${day}`;
//     }
//     return null;
//   };

//   const handleRowClick = (doc_no, tran_type, DOC_DATE) => {

//     if (doc_no === 0) {
//       Swal.fire({
//         title: "Invalid Document Number",
//         text: "The document number is invalid",
//         icon: "error",
//         confirmButtonText: "OK"
//       });
//       return;
//     }
//     const accountingYearData = sessionStorage.getItem('Accounting_Year');
//     const formattedEntryDate = convertDateToISO(DOC_DATE);

//     const isValid = validateDocumentDate(formattedEntryDate, accountingYearData);

//     if (!isValid) {
//       return
//     }

//     if (tran_type === 'CV' || tran_type === 'LV') {
//       const url = `${window.location.origin}/commission-bill`
//       const params = new URLSearchParams({
//         selectedVoucherNo: doc_no,
//         selectedVoucherType: tran_type
//       });
//       window.open(`${url}?${params.toString()}`, '_blank');
//     }
//     if (tran_type === 'CR' || tran_type === 'BR' || tran_type === 'BP' || tran_type === 'CP') {
//       const url = `${window.location.origin}/receipt-payment`;
//       const params = new URLSearchParams({
//         navigatedRecord: doc_no,
//         navigatedTranType: tran_type
//       });
//       window.open(`${url}?${params.toString()}`, '_blank');
//     }

//     if (tran_type === 'UI') {
//       const url = `${window.location.origin}/utr-entry`;
//       const params = new URLSearchParams({
//         navigatedRecord: doc_no,
//       });
//       window.open(`${url}?${params.toString()}`, '_blank');
//     }

//     if (tran_type === 'JV') {
//       const url = `${window.location.origin}/journal-voucher`;
//       const params = new URLSearchParams({
//         navigatedRecord: doc_no,
//         navigatedTranType: tran_type
//       });
//       window.open(`${url}?${params.toString()}`, '_blank');
//     }

//     if (
//       tran_type === "DN" ||
//       tran_type === "DS" ||
//       tran_type === "CN" ||
//       tran_type === "CS"
//     ) {
//       const url = `${window.location.origin}/debitcreditnote`;
//       const params = new URLSearchParams({
//         navigatedRecord: doc_no,
//         navigatedTranType: tran_type,
//       });
//       window.open(`${url}?${params.toString()}`, "_blank");
//     }

//     if (tran_type === "XP") {
//       const url = `${window.location.origin}/other-purchase`;
//       const params = new URLSearchParams({
//         navigatedRecord: doc_no,
//         navigatedTranType: tran_type,
//       });
//       window.open(`${url}?${params.toString()}`, "_blank");
//     }

//     if (tran_type === "RB") {
//       const url = `${window.location.origin}/service-bill`;
//       const params = new URLSearchParams({
//         navigatedRecord: doc_no,
//       });
//       window.open(`${url}?${params.toString()}`, "_blank");
//     }
//     if (tran_type === "SB") {
//       const url = `${window.location.origin}/sale-bill`;
//       const params = new URLSearchParams({
//         navigatedRecord: doc_no,
//       });
//       window.open(`${url}?${params.toString()}`, "_blank");
//     }
//     if (tran_type === "PS") {
//       const url = `${window.location.origin}/sugarpurchasebill`;
//       const params = new URLSearchParams({
//         navigatedRecord: doc_no,
//       });
//       window.open(`${url}?${params.toString()}`, "_blank");
//     }

//     if (tran_type === "PR") {
//       const url = `${window.location.origin}/sugar-sale-return-purchase`;
//       const params = new URLSearchParams({
//         navigatedRecord: doc_no,
//       });
//       window.open(`${url}?${params.toString()}`, "_blank");
//     }
//     if (tran_type === "RS") {
//       const url = `${window.location.origin}/sugar-sale-return-sale`;
//       const params = new URLSearchParams({
//         navigatedRecord: doc_no,
//       });
//       window.open(`${url}?${params.toString()}`, "_blank");
//     }

//     if (
//       tran_type === "LV" ||
//       tran_type === "CV"
//     ) {
//       const url = `${window.location.origin}/commission-bill`;
//       const params = new URLSearchParams({
//         selectedVoucherNo: doc_no,
//         selectedVoucherType: tran_type,
//       });
//       window.open(`${url}?${params.toString()}`, "_blank");
//     }

//     if (tran_type === 'DO') {
//       const url = `${window.location.origin}/delivery-order`;
//       const params = new URLSearchParams({
//         navigatedRecord: doc_no
//       });
//       window.open(`${url}?${params.toString()}`, '_blank');
//     }
//   };


//   const generatePdf = async () => {
//        const doc = new jsPDF('portrait');
//     const pageWidth = doc.internal.pageSize.width;
//     const pageHeight = doc.internal.pageSize.height;
//     let currentY = 9;

//      const response = await axios.get(`${process.env.REACT_APP_API}/accountmaster-address`, {
//      params: { ac_code: acCode, Company_Code: companyCode }
//     });
//     const headerData = response.data?.[0] || {};

//      const foormerlyName = fromDate < CompanyNameUpdatedDate ? oldFormerlyName : headerData.AL1

//    const logoImg = new Image();
//     logoImg.src = logo;
//     const headerImg = new Image();
//     const footerImg1 = new Image();
//     headerImg.src = HeaderJK;
//         footerImg1.src = FooterJK1
//         const shouldUseImage =
//   docDate >= cnameUpdatedDate
//     await new Promise(resolve => {
//   logoImg.onload = () => {
//     if (shouldUseImage) {
//       // Use header image across top (new template)
//       doc.addImage(headerImg, "PNG", 0, 6, 190, 33); // full width
//     } else {
//       // Use logo + address details
//       doc.addImage(logoImg, "PNG", 10, currentY, 30, 30);

//       // Header text
//       doc.setFont("Signika-Bold");
//       doc.setFontSize(14);
//       doc.text(displayCompanyName, 45, currentY + 5);

//       doc.setFont("Signika-Regular");
//       doc.setFontSize(9);
//       doc.text(`${foormerlyName}`, 45, currentY + 9);
//       doc.text(headerData.AL2 || "", 45, currentY + 13);
//       doc.text(headerData.AL3 || "", 45, currentY + 17);
//       doc.text(headerData.AL4 || "", 45, currentY + 21);
//       doc.text(headerData.Other || "", 45, currentY + 25);
//       if (headerData.BillFooter) {
//         doc.text(headerData.BillFooter, 45, currentY + 29);
//       }
//     }

//     resolve();
//   };
// });
//     doc.setDrawColor(80, 80, 80);
//     doc.line(10, 44, 200, 44);
//     currentY += 40;


//     // Section title
//     doc.setFont("Signika-Bold");
//     doc.setFontSize(10);
//     doc.setTextColor(0, 128, 0);
//     doc.text("LEDGER ACCOUNT", pageWidth / 2, 49, { align: "center" });
//     doc.setTextColor(0, 0, 0);
//     doc.line(10, 52, 200, 52);
//     currentY += 2;

//     // "To" Block
// let leftY = currentY;
// doc.setFont("Signika-Regular");
// doc.setFontSize(8);
// doc.text("To,", 12, leftY + 5);

// doc.setFont("Signika-Bold");
// doc.setTextColor(0, 128, 0);
// doc.text(`${headerData.Ac_Name_E} (${acCode})`, 12, leftY + 10);

// doc.setFont("Signika-Regular");
// doc.setTextColor(0, 0, 0);

// // Split the address into multiple lines (e.g. 100 chars per line or fit to page width)
// let addressLines = doc.splitTextToSize(headerData.Address_E || "", 100); // Adjust 180 to fit your page width
// for (let i = 0; i < addressLines.length; i++) {
//   doc.text(addressLines[i], 12, leftY + 15 + i * 5); // Add lines with spacing
// }

// // After address, update vertical position accordingly
// let addressBlockHeight = addressLines.length * 5;
// let nextY = leftY + 15 + addressBlockHeight;

// doc.text(`City: ${headerData.cityname} (${headerData.State_Name} - ${headerData.GSTStateCode})`, 12, nextY);
// nextY += 5;

// doc.text(`GST: ${headerData.Gst_No}`, 12, nextY);
// nextY += 5;

// if (headerData.Email) {
//   doc.text(`Email: ${headerData.Email}`, 12, nextY);
// }


//     // Summary
//     const summaryX = 135;
//     let rightY = currentY;
//     const openingBalance = ledgerData[0]?.TRAN_TYPE === "OP" ? parseFloat(ledgerData[0]?.Balance) : 0;
//     const net = parseFloat(totals.debit - totals.credit);

//     doc.setFont("Signika-Regular");
//     doc.text(`Ledger from ${formatDate(fromDate)} to ${formatDate(toDate)}`, summaryX, rightY + 5);
//     rightY += 5;

//     doc.setFont("Signika-Bold");
//     doc.text("SUMMARY", summaryX, rightY + 5);
//     rightY += 5;

//     doc.setFont("Signika-Regular");
//     doc.text("Opening Balance", summaryX, rightY + 5);
//     doc.text(`${formatReadableAmount(openingBalance || 0)} Cr.`, summaryX + 60, rightY + 5, { align: "right" });

//     rightY += 5;
//     doc.text("Credited Amount", summaryX, rightY + 5);
//     doc.text(`${formatReadableAmount(totals.credit)} Cr.`, summaryX + 60, rightY + 5, { align: "right" });

//     rightY += 5;
//     doc.text("Debited Amount", summaryX, rightY + 5);
//     doc.text(`${formatReadableAmount(totals.debit)} Dr.`, summaryX + 60, rightY + 5, { align: "right" });

//     rightY += 5;
//     doc.text("Closing Balance", summaryX, rightY + 5);
//     doc.line(summaryX, rightY + 2, 195, rightY +2);
//     doc.setFont("Signika-Bold"); // Balance in bold
//     doc.text(`${formatReadableAmount(Math.abs(net))} ${net > 0 ? "Dr." : "Cr."}`, summaryX + 60, rightY + 5, { align: "right" });
//     doc.line(summaryX, rightY + 7, 195, rightY + 7);

//     currentY = Math.max(leftY + 40, rightY + 8);

//     // Table Header
//     const drawTableHeader = () => {
//       doc.setFont("Signika-Bold");
//       doc.line(10, currentY - 4, 200, currentY - 4);
//       doc.text("Date", 12, currentY);
//       doc.text("Particulars", 35, currentY);
//       doc.text("Vch Type", 95, currentY, { align: "center" });
//       doc.text("Vch No.", 113, currentY, { align: "center" });
//       doc.text("Debit", 140, currentY, { align: "right" });
//       doc.text("Credit", 165, currentY, { align: "right" });
//       doc.text("Balance", 190, currentY, { align: "right" });
//       //doc.text("Dr/Cr", 195, currentY, { align: "left" });
//       doc.line(10, currentY + 2, 200, currentY + 2);
//       currentY += 5;
//     };

//     // Footer
//     const drawFooter = (pageNum, totalPages, showFullFooter = false) => {
//       const footerImageHeight = 28;
//       const footerImageY = pageHeight - footerImageHeight - 12;
//       const pageNumberY = pageHeight - 5;

//       if (showFullFooter) {
//         doc.setDrawColor(160);
//         doc.setLineWidth(0.5);
//         if(shouldUseImage){
//         doc.addImage(FooterJK, "PNG", 0, footerImageY, 260, footerImageHeight);
//         }else{
//           doc.addImage(footerImg1, "PNG", 0, footerImageY, 210, footerImageHeight);
//         }
//       }

//       doc.setFont("Signika-Regular");
//       doc.setFontSize(8);
//       doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth / 2, pageNumberY, { align: "center" });
//     };


//     // Body Rendering
//     doc.setFont("Signika-Regular");
//     drawTableHeader();

//     const footerHeight = 35; // full footer height (image + spacing)
//     const marginBottom = 10;
//     const usablePageHeight = pageHeight - footerHeight;

//     for (let i = 0; i < filteredData.length; i++) {
//       const item = filteredData[i];
//       const narrationX = 35;
//       const narrationMaxWidth = 55;
//       const lineHeight = 5;
//       const narrationLines = doc.splitTextToSize(item.NARRATION || "", narrationMaxWidth);
//       const requiredHeight = narrationLines.length * lineHeight;

//       if (currentY + 10 > usablePageHeight) {
//   doc.addPage();
//   currentY = 10;
//   drawTableHeader();
// }

//       doc.setFont("Signika-Regular");
//       const drcrText = item.drcr;

//       doc.text(item.DOC_DATE || "", 12, currentY + 1);
//       doc.text(item.TRAN_TYPE || "", 95, currentY + 1, { align: "center" });
//       doc.text(String(item.DOC_NO), 113, currentY + 1, { align: "center" });
//       doc.text(formatReadableAmount(item.debit || 0), 140, currentY + 1, { align: "right" });
//       doc.text(formatReadableAmount(item.credit || 0), 165, currentY + 1, { align: "right" });
//       doc.text(formatReadableAmount(Math.abs(item.Balance || 0)), 190, currentY + 1, { align: "right" });
//       doc.text(drcrText, 191, currentY + 1, { align: "left" });

//       narrationLines.forEach((line, index) => {
//         doc.text(line, narrationX, currentY + 1 + index * lineHeight);
//       });

//       currentY += requiredHeight;
//     }


//     // Totals Row
//     if (currentY + 10 > usablePageHeight) {
//       doc.addPage();
//       currentY = 10;
//       drawTableHeader();
//     }

//     doc.setFont("Signika-Bold");
//     doc.line(10, currentY - 2, 200, currentY - 2);
//     doc.text(formatReadableAmount(totals.debit.toFixed(2)), 140, currentY + 2, { align: "right" });
//     doc.text(formatReadableAmount(totals.credit.toFixed(2)), 165, currentY + 2, { align: "right" });
//     doc.text(formatReadableAmount(Math.abs(net).toFixed(2)), 190, currentY + 2, { align: "right" });
//     doc.text(net > 0 ? "Dr." : "Cr.", 191, currentY + 2, { align: "left" });
//     doc.line(10, currentY + 4, 200, currentY + 4);
//     doc.setFont("Signika-Regular");
//     doc.text("***END OF LEDGER*** ", 90, currentY + 8)

//     const totalPages = doc.getNumberOfPages();

//     for (let i = 1; i <= totalPages; i++) {
//       doc.setPage(i);
//       const isLastPage = i === totalPages;
//       const isSinglePage = totalPages === 1;

//       // Show page number always, full footer only on last page or if single page
//       drawFooter(i, totalPages, isLastPage || isSinglePage);
//     }
//     const pdfBlob = doc.output('blob');
//     const url = URL.createObjectURL(pdfBlob);
//     setPdfPreview(url);

//   };

//   return (
//     <div className="ledger-report-container">
//       <div className="col-auto">
//         <button className="btn btn-secondary me-2" onClick={handlePrint}>
//           Print Report
//         </button>
//         <button className="btn btn-success" onClick={handleExportToExcel}>
//           Export to Excel
//         </button>
//         {pdfPreview && pdfPreview.length > 0 && (
//           <PdfPreview pdfData={pdfPreview} apiData={ledgerData[0]} label={"GLedger"} />
//         )}
//         <button onClick={generatePdf} className="btn btn-secondary">PDF</button>
//       </div>
//       <Typography variant="h6" style={{ textAlign: 'center', fontSize: "24px", fontWeight: "bold", marginTop: "10px" }}>{displayCompanyName}</Typography>
//       <div>
//         <p><strong> {" "}
//           ({acCode || ""}) {" "}
//           {acname || ""} {" "}
//           From Date: {fromDate ? formatDate(fromDate) : "N/A"} {" "}
//           To Date: {toDate ? formatDate(toDate) : "N/A"} </strong>
//           {transType && ` | Transaction Type: ${transType}`}
//         </p>
//       </div>

//       {loading && (
//         <div
//           style={{
//             display: "flex",
//             justifyContent: "center",
//             alignItems: "center",
//             height: "100%",
//           }}
//         >
//           <RingLoader />
//         </div>
//       )}
//       {error && <p className="error-message">{error}</p>}

//       {filteredData.length > 0 && (
//         <>
//           <div style={{ maxHeight: "800px", overflowY: "auto" }}>
//             <table id="reportTable" style={{ marginBottom: "60px", width: "100%" }}>
//               <thead style={{ position: "sticky", top: 0, backgroundColor: "#fff", zIndex: 1, whiteSpace: "nowrap" }}>
//                 <tr>
//                   <th>Trans Type</th>
//                   <th>Doc No</th>
//                   <th>Date</th>
//                   <th>Narration</th>
//                   <th style={{ textAlign: "right" }}>Debit</th>
//                   <th style={{ textAlign: "right" }}>Credit</th>
//                   <th style={{ textAlign: "right" }}>Balance</th>
//                   <th>DR/CR</th>
//                   <th>Do No</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {filteredData.map((item, index) => (
//                   <tr key={index}>
//                     <td>{item.TRAN_TYPE}</td>
//                     <td onClick={() => handleRowClick(item.DOC_NO, item.TRAN_TYPE, item.DOC_DATE)} style={{
//                       cursor: "pointer",
//                       fontWeight: "bold",
//                       color: "darkslategray",
//                       textDecoration: "none"
//                     }}
//                       onMouseOver={(e) => {
//                         e.target.style.color = 'black';
//                         e.target.style.textDecoration = 'underline';
//                       }}
//                       onMouseOut={(e) => {
//                         e.target.style.color = 'darkslategray';
//                         e.target.style.textDecoration = 'none';
//                       }}>{item.DOC_NO}</td>
//                     <td>{item.DOC_DATE}</td>
//                     <td>{item.NARRATION}</td>
//                     <td style={{ textAlign: "right" }}>{formatReadableAmount(parseFloat(item.debit).toFixed(2) || 0.00)}</td>
//                     <td style={{ textAlign: "right" }}>{formatReadableAmount(parseFloat(item.credit).toFixed(2) || 0.00)}</td>
//                     <td style={{ textAlign: "right" }}>{formatReadableAmount(parseFloat(item.Balance).toFixed(2) || 0.00)}</td>
//                     <td>{item.drcr}</td>
//                     <td onClick={() => handleRowClick(item.do_no, "DO", item.DOC_DATE)} style={{
//                       cursor: "pointer",
//                       fontWeight: "bold",
//                       color: "darkslategray",
//                       textDecoration: "none"
//                     }}
//                       onMouseOver={(e) => {
//                         e.target.style.color = 'black';
//                         e.target.style.textDecoration = 'underline';
//                       }}
//                       onMouseOut={(e) => {
//                         e.target.style.color = 'darkslategray';
//                         e.target.style.textDecoration = 'none';
//                       }}>{item.do_no}</td>
//                   </tr>
//                 ))}
//               </tbody>
//               <tfoot>
//                 <tr style={{ backgroundColor: "yellow" }}>
//                   <td colSpan="4" align="right"><strong>Totals</strong></td>
//                   <td style={{ textAlign: "right" }}><strong>{formatReadableAmount(totals.debit.toFixed(2))}</strong></td>
//                   <td style={{ textAlign: "right" }}><strong>{formatReadableAmount(totals.credit.toFixed(2))}</strong></td>
//                   <td style={{ textAlign: "right" }}><strong>{formatReadableAmount(Math.abs(parseFloat(totals.debit - totals.credit)).toFixed(2))}</strong></td>
//                   <td ><strong>{(totals.debit.toFixed(2) - totals.credit.toFixed(2)) > 0 ? 'Dr' : 'Cr'}</strong></td>
//                   <td ></td>
//                 </tr>
//               </tfoot>
//             </table>
//           </div>
//           <div className="centered-container">
//           </div>
//         </>
//       )}
//     </div>
//   );

// };

// export default GledgerReport;











// import React, { useState, useEffect } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import axios from "axios";
// import '../../Reports/Ledger/GledgerReport.css'
// import * as XLSX from 'xlsx';
// import { jsPDF } from 'jspdf';
// import 'jspdf-autotable';
// import PdfPreview from "../../../Common/PDFPreview"
// import { Typography } from '@mui/material';
// import { RingLoader } from 'react-spinners';
// import { formatDate } from '../../../Common/FormatFunctions/FormatDate'
// import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount"
// import { validateDocumentDate } from "../../../Common/ValidateDateRange/ValidateDateRange"
// import "../../../Common/Fonts/Signika-Bold-normal";
// import "../../../Common/Fonts/Signika-Regular-normal";
// import "../../../Common/Fonts/Signika-Medium-normal";
// import logo from "../../../Assets/jklogo.png";
// import FooterJK from "../../../Assets/FooterJK.png";
// import Swal from "sweetalert2";

// const GledgerReport = () => {
//   const companyCode = sessionStorage.getItem("Company_Code");
//   const Year_Code = sessionStorage.getItem("Year_Code");
//   const Company_Name = sessionStorage.getItem("Company_Name");
//   const Company_Address = sessionStorage.getItem("Company_Address");
//   const Company_GSTNo = sessionStorage.getItem("Company_GSTNO")
//   const Company_PanNo = sessionStorage.getItem("Company_PanNo")
//   // const [displayCompanyName, setDisplayCompanyName] = useState(Company_Name);

//   const CompanyNameUpdatedDate = sessionStorage.getItem("CompanyNameUpdatedDate")
//   const newCompanyName = sessionStorage.getItem("newCompanyName")
//   const oldFormerlyName = sessionStorage.getItem("oldFormerlyName")

//   const API_URL = process.env.REACT_APP_API;
//   const [ledgerData, setLedgerData] = useState([]);
//   const [ledgerDataExcel, setLedgerDataExcel] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [pdfPreview, setPdfPreview] = useState([])

//   const location = useLocation();
//   const searchParams = new URLSearchParams(location.search);
//   const fromDate = searchParams.get('fromDate');
//   const toDate = searchParams.get('toDate');
//   const acCode = searchParams.get('acCode');
//   const acname = searchParams.get('acname');
//   const transType = searchParams.get('Trans_Type');
//   const [totals, setTotals] = useState({ debit: 0, credit: 0 });
//   const [filteredData, setFilteredData] = useState([]);

//   const navigate = useNavigate();

//   const calculateTotals = (data) => {
//     const totals = data.reduce(
//       (acc, item) => {
//         acc.debit += parseFloat(item.debit || 0);
//         acc.credit += parseFloat(item.credit || 0);
//         return acc;
//       },
//       { debit: 0, credit: 0 }
//     );
//     return totals;
//   };

//   useEffect(() => {
//     const fetchGLedgerReport = async () => {
//       try {
//         setLoading(true);
//         const response = await axios.get(
//           `${process.env.REACT_APP_API}/get_gLedgerReport_AcWise`,
//           {
//             params: {
//               from_date: fromDate,
//               to_date: toDate,
//               Company_Code: companyCode,
//               Accode: acCode
//             },
//           }
//         );

//         const data = response.data.all_data || [];
//         const BalanceData = await handleCalculateBalance(response);

//         let filteredData = BalanceData;
//         if (transType && transType !== "All") {
//           filteredData = BalanceData.filter(item =>
//             item.TRAN_TYPE?.toUpperCase() === transType.toUpperCase()
//           );
//         }

//         setLedgerData(BalanceData);
//         setFilteredData(filteredData);
//         setTotals(calculateTotals(filteredData));

//       } catch (err) {
//         setError("Error fetching report data.");
//         console.error(err);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchGLedgerReport();
//   }, [acCode, fromDate, toDate, transType]);


//     const docDate = new Date(fromDate);
//       const cnameUpdatedDate = new Date(CompanyNameUpdatedDate);
  
//       const displayCompanyName =
//         docDate < cnameUpdatedDate
//           ? newCompanyName
//           : Company_Name
  


//   const mergeOpeningBalanceToAllData = (openingBalance, allData) => {
//     let openingBalanceData = []
//     if (openingBalance.length === 0) {
//       openingBalanceData.push({
//         AC_CODE: 0,
//         Ac_Name_E: "Opening Balance",
//         Balance: 0,
//         DOC_DATE: "",
//         DOC_NO: "",
//         NARRATION: "Opening balance",
//         TRAN_TYPE: "OP",
//         credit: 0,
//         debit: 0,
//         DRCR: ""
//       })
//     }
//     else {
//       openingBalanceData = openingBalance.map((balance) => ({
//         AC_CODE: balance.AC_CODE,
//         Ac_Name_E: "Opening Balance",
//         Balance: balance.OpBal ? Math.abs(parseFloat(balance.OpBal)) : 0,
//         DOC_DATE: "",
//         DOC_NO: "",
//         NARRATION: "Opening balance",
//         TRAN_TYPE: "OP",
//         credit: balance.OpBal < 0 ? Math.abs(parseFloat(balance.OpBal)) : 0,
//         debit: balance.OpBal > 0 ? Math.abs(parseFloat(balance.OpBal)) : 0,
//         DRCR: balance.OpBal > 0 ? "D" : "C",
//       }))
//     };
//     return [...openingBalanceData, ...allData];
//   };

//   const handleCalculateBalance = async (details) => {
//     const LedgerData = details.data.all_data;
//     const OpBalData = details.data.Opening_Balance ? details.data.Opening_Balance : "";
//     let opBal = OpBalData.length > 0 ? OpBalData[0].OpBal : 0;
//     let netdebit = 0;
//     let netcredit = 0;
//     if (opBal > 0) {
//       netdebit = opBal;
//     }
//     else {
//       netcredit = -opBal;
//     }
//     const mergedData = mergeOpeningBalanceToAllData(OpBalData, LedgerData);
//     mergedData.forEach((entry) => {
//       if (entry.drcr === "D") {
//         opBal = opBal + Math.abs(parseFloat(entry.AMOUNT || 0).toFixed(2));
//         netdebit += parseFloat(entry.AMOUNT || 0);
//       } else {
//         opBal = opBal - Math.abs(parseFloat(entry.AMOUNT || 0).toFixed(2));
//         netcredit += parseFloat(entry.AMOUNT || 0).toFixed(2);
//       }
//       entry.Balance = opBal ? Math.abs(opBal).toFixed(2) : 0;
//       entry.drcr = opBal > 0 ? "Dr" : "Cr";
//     });
//     return mergedData;
//   }


//   const handlePrint = async () => {
//     const doc = new jsPDF('portrait');
//     const pageWidth = doc.internal.pageSize.width;
//     const pageHeight = doc.internal.pageSize.height;
//     let currentY = 9;

//     const response = await axios.get(`${process.env.REACT_APP_API}/accountmaster-address`, {
//       params: { ac_code: acCode }
//     });
//     const headerData = response.data?.[0] || {};

//     const foormerlyName = fromDate < CompanyNameUpdatedDate ? oldFormerlyName : headerData.AL1

//     // Logo
//     const logoImg = new Image();
//     logoImg.src = logo;
//     await new Promise(resolve => {
//       logoImg.onload = () => {
//         doc.addImage(logoImg, "PNG", 10, currentY, 30, 30);
//         resolve();
//       };
//     });

//     // Header
//     doc.setFont("Signika-Bold");
//     doc.setFontSize(14);
//     doc.text(displayCompanyName, 45, currentY + 5);
//     doc.setFont("Signika-Regular");
//     doc.setFontSize(9);
//     doc.text(`${foormerlyName}`, 45, currentY + 9);
//     doc.text(headerData.AL2 || "", 45, currentY + 13);
//     doc.text(headerData.AL3 || "", 45, currentY + 17);
//     doc.text(headerData.AL4 || "", 45, currentY + 21);
//     doc.text(headerData.Other || "", 45, currentY + 25);
//     if (headerData.BillFooter) doc.text(headerData.BillFooter, 45, currentY + 29);
//     doc.setDrawColor(80, 80, 80);
//     doc.line(10, 44, 200, 44);
//     currentY += 40;

//     // Section title
//     doc.setFont("Signika-Bold");
//     doc.setFontSize(10);
//     doc.setTextColor(0, 128, 0);
//     doc.text("LEDGER ACCOUNT", pageWidth / 2, 49, { align: "center" });
//     doc.setTextColor(0, 0, 0);
//     doc.line(10, 52, 200, 52);
//     currentY += 2;

//     // "To" Block
//     let leftY = currentY;
//     doc.setFont("Signika-Regular");
//     doc.setFontSize(8);
//     doc.text("To,", 12, leftY + 5);
//     doc.setFont("Signika-Bold");
//     doc.setTextColor(0, 128, 0);
//     doc.text(`(${acCode}) ${headerData.Ac_Name_E}`, 12, leftY + 10);
//     doc.setFont("Signika-Regular");
//     doc.setTextColor(0, 0, 0);
//     doc.text(headerData.Address_E || "", 12, leftY + 15);
//     doc.text(`City: ${headerData.cityname} (${headerData.State_Name} - ${headerData.GSTStateCode})`, 12, leftY + 20);
//     doc.text(`GST: ${headerData.Gst_No}`, 12, leftY + 25);
//     if (headerData.Email) {
//       doc.text(`Email: ${headerData.Email}`, 12, leftY + 30);
//     }

//     // Summary
//     const summaryX = 135;
//     let rightY = currentY;
//     const openingBalance = ledgerData[0]?.TRAN_TYPE === "OP" ? parseFloat(ledgerData[0]?.Balance) : 0;
//     const net = parseFloat(totals.debit - totals.credit);

//     doc.setFont("Signika-Regular");
//     doc.text(`Ledger from ${formatDate(fromDate)} to ${formatDate(toDate)}`, summaryX, rightY + 5);
//     rightY += 5;

//     doc.setFont("Signika-Bold");
//     doc.text("SUMMARY", summaryX, rightY + 5);
//     rightY += 5;

//     doc.setFont("Signika-Regular");
//     doc.text("Opening Balance", summaryX, rightY + 5);
//     doc.text(`${formatReadableAmount(openingBalance || 0)} Cr.`, summaryX + 60, rightY + 5, { align: "right" });

//     rightY += 5;
//     doc.text("Credited Amount", summaryX, rightY + 5);
//     doc.text(`${formatReadableAmount(totals.credit)} Cr.`, summaryX + 60, rightY + 5, { align: "right" });

//     rightY += 5;
//     doc.text("Debited Amount", summaryX, rightY + 5);
//     doc.text(`${formatReadableAmount(totals.debit)} Dr.`, summaryX + 60, rightY + 5, { align: "right" });

//     rightY += 5;
//     doc.text("Closing Balance", summaryX, rightY + 5);
//     doc.line(summaryX, rightY + 2, 195, rightY +2);
//     doc.setFont("Signika-Bold"); // Balance in bold
//     doc.text(`${formatReadableAmount(Math.abs(net))} ${net > 0 ? "Dr." : "Cr."}`, summaryX + 60, rightY + 5, { align: "right" });
//     doc.line(summaryX, rightY + 7, 195, rightY + 7);

//     currentY = Math.max(leftY + 40, rightY + 8);

//     // Table Header
//     const drawTableHeader = () => {
//       doc.setFont("Signika-Bold");
//       doc.line(10, currentY - 4, 200, currentY - 4);
//       doc.text("Date", 12, currentY);
//       doc.text("Particulars", 35, currentY);
//       doc.text("Vch Type", 95, currentY, { align: "center" });
//       doc.text("Vch No.", 113, currentY, { align: "center" });
//       doc.text("Debit", 140, currentY, { align: "right" });
//       doc.text("Credit", 165, currentY, { align: "right" });
//       doc.text("Balance", 190, currentY, { align: "right" });
//       //doc.text("Dr/Cr", 195, currentY, { align: "left" });
//       doc.line(10, currentY + 2, 200, currentY + 2);
//       currentY += 5;
//     };

//     // Footer
//     const drawFooter = (pageNum, totalPages, showFullFooter = false) => {
//       const footerImageHeight = 28;
//       const footerImageY = pageHeight - footerImageHeight - 12;
//       const pageNumberY = pageHeight - 5;

//       if (showFullFooter) {
//         doc.setDrawColor(160);
//         doc.setLineWidth(0.5);
//         doc.addImage(FooterJK, "PNG", 10, footerImageY, 190, footerImageHeight);
//       }

//       doc.setFont("Signika-Regular");
//       doc.setFontSize(8);
//       doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth / 2, pageNumberY, { align: "center" });
//     };


//     // Body Rendering
//     doc.setFont("Signika-Regular");
//     drawTableHeader();

//     const footerHeight = 35; // full footer height (image + spacing)
//     const marginBottom = 10;
//     const usablePageHeight = pageHeight - footerHeight;

//     for (let i = 0; i < filteredData.length; i++) {
//       const item = filteredData[i];
//       const narrationX = 35;
//       const narrationMaxWidth = 55;
//       const lineHeight = 5;
//       const narrationLines = doc.splitTextToSize(item.NARRATION || "", narrationMaxWidth);
//       const requiredHeight = narrationLines.length * lineHeight;

//     if (currentY + 10 > usablePageHeight) {
//   doc.addPage();
//   currentY = 10;
//   drawTableHeader();
// }

//       doc.setFont("Signika-Regular");
//       const drcrText = item.drcr;

//       doc.text(item.DOC_DATE || "", 12, currentY + 1);
//       doc.text(item.TRAN_TYPE || "", 95, currentY + 1, { align: "center" });
//       doc.text(String(item.DOC_NO), 113, currentY + 1, { align: "center" });
//       doc.text(formatReadableAmount(item.debit || 0), 140, currentY + 1, { align: "right" });
//       doc.text(formatReadableAmount(item.credit || 0), 165, currentY + 1, { align: "right" });
//       doc.text(formatReadableAmount(Math.abs(item.Balance || 0)), 190, currentY + 1, { align: "right" });
//       doc.text(drcrText, 191, currentY + 1, { align: "left" });

//       narrationLines.forEach((line, index) => {
//         doc.text(line, narrationX, currentY + 1 + index * lineHeight);
//       });

//       currentY += requiredHeight;
//     }


//     // Totals Row
//     if (currentY + 10 > usablePageHeight) {
//       doc.addPage();
//       currentY = 10;
//       drawTableHeader();
//     }

//     doc.setFont("Signika-Bold");
//     doc.line(10, currentY - 2, 200, currentY - 2);
//     doc.text(formatReadableAmount(totals.debit.toFixed(2)), 140, currentY + 2, { align: "right" });
//     doc.text(formatReadableAmount(totals.credit.toFixed(2)), 165, currentY + 2, { align: "right" });
//     doc.text(formatReadableAmount(Math.abs(net).toFixed(2)), 190, currentY + 2, { align: "right" });
//     doc.text(net > 0 ? "Dr." : "Cr.", 191, currentY + 2, { align: "left" });
//     doc.line(10, currentY + 4, 200, currentY + 4);
//     doc.setFont("Signika-Regular");
//     doc.text("***END OF LEDGER*** ", 90, currentY + 8)

//     const totalPages = doc.getNumberOfPages();

//     for (let i = 1; i <= totalPages; i++) {
//       doc.setPage(i);
//       const isLastPage = i === totalPages;
//       const isSinglePage = totalPages === 1;

//       // Show page number always, full footer only on last page or if single page
//       drawFooter(i, totalPages, isLastPage || isSinglePage);
//     }

//     doc.autoPrint();
//     const printWindow = window.open(doc.output("bloburl"), "_blank");
//     printWindow.print();
//   };




//   const handleExportToExcel = () => {
//     const wb = XLSX.utils.book_new();

//     const headers = [
//       [displayCompanyName],
//       [`Account Statement of: (${acCode || ""}) ${acname || ""}`],
//       [`From Date: ${formatDate(fromDate) || ""} To Date: ${formatDate(toDate) || ""}`],
//       [],
//       ["Trans Type", "Doc No", "Date", "Narration", "Debit", "Credit", "Balance", "DR/CR", "Do No"]
//     ];

//     const dataRows = filteredData.map(item => {
//       let formattedDate = "";
//       if (item.DOC_DATE) {
//         const dateParts = item.DOC_DATE.split(/[-/]/);
//         if (dateParts.length === 3) {
//           formattedDate = `${dateParts[0].padStart(2, '0')}/${dateParts[1].padStart(2, '0')}/${dateParts[2]}`;
//         } else {
//           formattedDate = item.DOC_DATE;
//         }
//       }

//       return [
//         item.TRAN_TYPE,
//         item.DOC_NO,
//         formattedDate,
//         item.NARRATION,
//         parseFloat(item.debit || 0),
//         parseFloat(item.credit || 0),
//         parseFloat(item.Balance || 0),
//         item.drcr,
//         item.do_no
//       ];
//     });
//     const wsData = [...headers, ...dataRows];
//     const ws = XLSX.utils.aoa_to_sheet(wsData);
//     ws["!cols"] = [
//       { wch: 10 },
//       { wch: 8 },
//       { wch: 10 },
//       { wch: 30 },
//       { wch: 15 },
//       { wch: 15 },
//       { wch: 15 },
//       { wch: 8 },
//       { wch: 8 },
//     ];

//     const range = XLSX.utils.decode_range(ws["!ref"]);

//     for (let R = 0; R <= range.e.r; R++) {
//       for (let C = 0; C <= range.e.c; C++) {
//         const cellRef = XLSX.utils.encode_cell({ r: R, c: C });

//         if (!ws[cellRef]) continue;

//         if (R < 4) {
//           ws[cellRef].s = {
//             font: { bold: true },
//             alignment: { horizontal: 'center' }
//           };
//           continue;
//         }

//         if (R === 4) {
//           ws[cellRef].s = {
//             font: { bold: true },
//             fill: { fgColor: { rgb: "D3D3D3" } }
//           };
//           continue;
//         }

//         if ([4, 5, 6].includes(C)) {
//           ws[cellRef].t = 'n';
//           ws[cellRef].z = '#,##0.00';
//           ws[cellRef].s = { alignment: { horizontal: 'right' } };
//         }

//         if (C === 2 && R > 4) {
//           ws[cellRef].t = 's';
//           ws[cellRef].s = { alignment: { horizontal: 'left' } };
//         }
//       }
//     }

//     XLSX.utils.book_append_sheet(wb, ws, "Ledger Report");
//     XLSX.writeFile(wb, `Account Statement of ${acname || "Ledger"}.xlsx`);
//   };


//   const convertDateToISO = (dateStr) => {
//     const parts = dateStr.split('/');
//     if (parts.length === 3) {
//       const day = parts[0];
//       const month = parts[1];
//       const year = parts[2];
//       return `${year}-${month}-${day}`;
//     }
//     return null;
//   };

//   const handleRowClick = (doc_no, tran_type, DOC_DATE) => {

//     if (doc_no === 0) {
//       Swal.fire({
//         title: "Invalid Document Number",
//         text: "The document number is invalid",
//         icon: "error",
//         confirmButtonText: "OK"
//       });
//       return;
//     }
//     const accountingYearData = sessionStorage.getItem('Accounting_Year');
//     const formattedEntryDate = convertDateToISO(DOC_DATE);

//     const isValid = validateDocumentDate(formattedEntryDate, accountingYearData);

//     if (!isValid) {
//       return
//     }

//     if (tran_type === 'CV' || tran_type === 'LV') {
//       const url = `${window.location.origin}/commission-bill`
//       const params = new URLSearchParams({
//         selectedVoucherNo: doc_no,
//         selectedVoucherType: tran_type
//       });
//       window.open(`${url}?${params.toString()}`, '_blank');
//     }
//     if (tran_type === 'CR' || tran_type === 'BR' || tran_type === 'BP' || tran_type === 'CP') {
//       const url = `${window.location.origin}/receipt-payment`;
//       const params = new URLSearchParams({
//         navigatedRecord: doc_no,
//         navigatedTranType: tran_type
//       });
//       window.open(`${url}?${params.toString()}`, '_blank');
//     }

//     if (tran_type === 'UI') {
//       const url = `${window.location.origin}/utr-entry`;
//       const params = new URLSearchParams({
//         navigatedRecord: doc_no,
//       });
//       window.open(`${url}?${params.toString()}`, '_blank');
//     }

//     if (tran_type === 'JV') {
//       const url = `${window.location.origin}/journal-voucher`;
//       const params = new URLSearchParams({
//         navigatedRecord: doc_no,
//         navigatedTranType: tran_type
//       });
//       window.open(`${url}?${params.toString()}`, '_blank');
//     }

//     if (
//       tran_type === "DN" ||
//       tran_type === "DS" ||
//       tran_type === "CN" ||
//       tran_type === "CS"
//     ) {
//       const url = `${window.location.origin}/debitcreditnote`;
//       const params = new URLSearchParams({
//         navigatedRecord: doc_no,
//         navigatedTranType: tran_type,
//       });
//       window.open(`${url}?${params.toString()}`, "_blank");
//     }

//     if (tran_type === "XP") {
//       const url = `${window.location.origin}/other-purchase`;
//       const params = new URLSearchParams({
//         navigatedRecord: doc_no,
//         navigatedTranType: tran_type,
//       });
//       window.open(`${url}?${params.toString()}`, "_blank");
//     }

//     if (tran_type === "RB") {
//       const url = `${window.location.origin}/service-bill`;
//       const params = new URLSearchParams({
//         navigatedRecord: doc_no,
//       });
//       window.open(`${url}?${params.toString()}`, "_blank");
//     }
//     if (tran_type === "SB") {
//       const url = `${window.location.origin}/sale-bill`;
//       const params = new URLSearchParams({
//         navigatedRecord: doc_no,
//       });
//       window.open(`${url}?${params.toString()}`, "_blank");
//     }
//     if (tran_type === "PS") {
//       const url = `${window.location.origin}/sugarpurchasebill`;
//       const params = new URLSearchParams({
//         navigatedRecord: doc_no,
//       });
//       window.open(`${url}?${params.toString()}`, "_blank");
//     }

//     if (tran_type === "PR") {
//       const url = `${window.location.origin}/sugar-sale-return-purchase`;
//       const params = new URLSearchParams({
//         navigatedRecord: doc_no,
//       });
//       window.open(`${url}?${params.toString()}`, "_blank");
//     }
//     if (tran_type === "RS") {
//       const url = `${window.location.origin}/sugar-sale-return-sale`;
//       const params = new URLSearchParams({
//         navigatedRecord: doc_no,
//       });
//       window.open(`${url}?${params.toString()}`, "_blank");
//     }

//     if (
//       tran_type === "LV" ||
//       tran_type === "CV"
//     ) {
//       const url = `${window.location.origin}/commission-bill`;
//       const params = new URLSearchParams({
//         selectedVoucherNo: doc_no,
//         selectedVoucherType: tran_type,
//       });
//       window.open(`${url}?${params.toString()}`, "_blank");
//     }

//     if (tran_type === 'DO') {
//       const url = `${window.location.origin}/delivery-order`;
//       const params = new URLSearchParams({
//         navigatedRecord: doc_no
//       });
//       window.open(`${url}?${params.toString()}`, '_blank');
//     }
//   };


// const generatePdf = async () => {
//        const doc = new jsPDF('portrait');
//     const pageWidth = doc.internal.pageSize.width;
//     const pageHeight = doc.internal.pageSize.height;
//     let currentY = 9;

//     const response = await axios.get(`${process.env.REACT_APP_API}/accountmaster-address`, {
//       params: { ac_code: acCode }
//     });
//     const headerData = response.data?.[0] || {};

//      const foormerlyName = fromDate < CompanyNameUpdatedDate ? oldFormerlyName : headerData.AL1

//    // Logo
//     const logoImg = new Image();
//     logoImg.src = logo;
//     await new Promise(resolve => {
//       logoImg.onload = () => {
//         doc.addImage(logoImg, "PNG", 10, currentY, 30, 30);
//         resolve();
//       };
//     });

//     // Header
//     doc.setFont("Signika-Bold");
//     doc.setFontSize(14);
//     doc.text(displayCompanyName, 45, currentY + 5);
//     doc.setFont("Signika-Regular");
//     doc.setFontSize(9);
//     doc.text(`${foormerlyName}`, 45, currentY + 9);
//     doc.text(headerData.AL2 || "", 45, currentY + 13);
//     doc.text(headerData.AL3 || "", 45, currentY + 17);
//     doc.text(headerData.AL4 || "", 45, currentY + 21);
//     doc.text(headerData.Other || "", 45, currentY + 25);
//     if (headerData.BillFooter) doc.text(headerData.BillFooter, 45, currentY + 29);
//     doc.setDrawColor(80, 80, 80);
//     doc.line(10, 44, 200, 44);
//     currentY += 40;


//     // Section title
//     doc.setFont("Signika-Bold");
//     doc.setFontSize(10);
//     doc.setTextColor(0, 128, 0);
//     doc.text("LEDGER ACCOUNT", pageWidth / 2, 49, { align: "center" });
//     doc.setTextColor(0, 0, 0);
//     doc.line(10, 52, 200, 52);
//     currentY += 2;

//     // "To" Block
//     let leftY = currentY;
//     doc.setFont("Signika-Regular");
//     doc.setFontSize(8);
//     doc.text("To,", 12, leftY + 5);
//     doc.setFont("Signika-Bold");
//     doc.setTextColor(0, 128, 0);
//     doc.text(`(${acCode}) ${headerData.Ac_Name_E}`, 12, leftY + 10);
//     doc.setFont("Signika-Regular");
//     doc.setTextColor(0, 0, 0);
//     doc.text(headerData.Address_E || "", 12, leftY + 15);
//     doc.text(`City: ${headerData.cityname} (${headerData.State_Name} - ${headerData.GSTStateCode})`, 12, leftY + 20);
//     doc.text(`GST: ${headerData.Gst_No}`, 12, leftY + 25);
//     if (headerData.Email) {
//       doc.text(`Email: ${headerData.Email}`, 12, leftY + 30);
//     }

//     // Summary
//     const summaryX = 135;
//     let rightY = currentY;
//     const openingBalance = ledgerData[0]?.TRAN_TYPE === "OP" ? parseFloat(ledgerData[0]?.Balance) : 0;
//     const net = parseFloat(totals.debit - totals.credit);

//     doc.setFont("Signika-Regular");
//     doc.text(`Ledger from ${formatDate(fromDate)} to ${formatDate(toDate)}`, summaryX, rightY + 5);
//     rightY += 5;

//     doc.setFont("Signika-Bold");
//     doc.text("SUMMARY", summaryX, rightY + 5);
//     rightY += 5;

//     doc.setFont("Signika-Regular");
//     doc.text("Opening Balance", summaryX, rightY + 5);
//     doc.text(`${formatReadableAmount(openingBalance || 0)} Cr.`, summaryX + 60, rightY + 5, { align: "right" });

//     rightY += 5;
//     doc.text("Credited Amount", summaryX, rightY + 5);
//     doc.text(`${formatReadableAmount(totals.credit)} Cr.`, summaryX + 60, rightY + 5, { align: "right" });

//     rightY += 5;
//     doc.text("Debited Amount", summaryX, rightY + 5);
//     doc.text(`${formatReadableAmount(totals.debit)} Dr.`, summaryX + 60, rightY + 5, { align: "right" });

//     rightY += 5;
//     doc.text("Closing Balance", summaryX, rightY + 5);
//     doc.line(summaryX, rightY + 2, 195, rightY +2);
//     doc.setFont("Signika-Bold"); // Balance in bold
//     doc.text(`${formatReadableAmount(Math.abs(net))} ${net > 0 ? "Dr." : "Cr."}`, summaryX + 60, rightY + 5, { align: "right" });
//     doc.line(summaryX, rightY + 7, 195, rightY + 7);

//     currentY = Math.max(leftY + 40, rightY + 8);

//     // Table Header
//     const drawTableHeader = () => {
//       doc.setFont("Signika-Bold");
//       doc.line(10, currentY - 4, 200, currentY - 4);
//       doc.text("Date", 12, currentY);
//       doc.text("Particulars", 35, currentY);
//       doc.text("Vch Type", 95, currentY, { align: "center" });
//       doc.text("Vch No.", 113, currentY, { align: "center" });
//       doc.text("Debit", 140, currentY, { align: "right" });
//       doc.text("Credit", 165, currentY, { align: "right" });
//       doc.text("Balance", 190, currentY, { align: "right" });
//       //doc.text("Dr/Cr", 195, currentY, { align: "left" });
//       doc.line(10, currentY + 2, 200, currentY + 2);
//       currentY += 5;
//     };

//     // Footer
//     const drawFooter = (pageNum, totalPages, showFullFooter = false) => {
//       const footerImageHeight = 28;
//       const footerImageY = pageHeight - footerImageHeight - 12;
//       const pageNumberY = pageHeight - 5;

//       if (showFullFooter) {
//         doc.setDrawColor(160);
//         doc.setLineWidth(0.5);
//         doc.addImage(FooterJK, "PNG", 10, footerImageY, 190, footerImageHeight);
//       }

//       doc.setFont("Signika-Regular");
//       doc.setFontSize(8);
//       doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth / 2, pageNumberY, { align: "center" });
//     };


//     // Body Rendering
//     doc.setFont("Signika-Regular");
//     drawTableHeader();

//     const footerHeight = 35; // full footer height (image + spacing)
//     const marginBottom = 10;
//     const usablePageHeight = pageHeight - footerHeight;

//     for (let i = 0; i < filteredData.length; i++) {
//       const item = filteredData[i];
//       const narrationX = 35;
//       const narrationMaxWidth = 55;
//       const lineHeight = 5;
//       const narrationLines = doc.splitTextToSize(item.NARRATION || "", narrationMaxWidth);
//       const requiredHeight = narrationLines.length * lineHeight;

//       if (currentY + 10 > usablePageHeight) {
//   doc.addPage();
//   currentY = 10;
//   drawTableHeader();
// }

//       doc.setFont("Signika-Regular");
//       const drcrText = item.drcr;

//       doc.text(item.DOC_DATE || "", 12, currentY + 1);
//       doc.text(item.TRAN_TYPE || "", 95, currentY + 1, { align: "center" });
//       doc.text(String(item.DOC_NO), 113, currentY + 1, { align: "center" });
//       doc.text(formatReadableAmount(item.debit || 0), 140, currentY + 1, { align: "right" });
//       doc.text(formatReadableAmount(item.credit || 0), 165, currentY + 1, { align: "right" });
//       doc.text(formatReadableAmount(Math.abs(item.Balance || 0)), 190, currentY + 1, { align: "right" });
//       doc.text(drcrText, 191, currentY + 1, { align: "left" });

//       narrationLines.forEach((line, index) => {
//         doc.text(line, narrationX, currentY + 1 + index * lineHeight);
//       });

//       currentY += requiredHeight;
//     }


//     // Totals Row
//     if (currentY + 10 > usablePageHeight) {
//       doc.addPage();
//       currentY = 10;
//       drawTableHeader();
//     }

//     doc.setFont("Signika-Bold");
//     doc.line(10, currentY - 2, 200, currentY - 2);
//     doc.text(formatReadableAmount(totals.debit.toFixed(2)), 140, currentY + 2, { align: "right" });
//     doc.text(formatReadableAmount(totals.credit.toFixed(2)), 165, currentY + 2, { align: "right" });
//     doc.text(formatReadableAmount(Math.abs(net).toFixed(2)), 190, currentY + 2, { align: "right" });
//     doc.text(net > 0 ? "Dr." : "Cr.", 191, currentY + 2, { align: "left" });
//     doc.line(10, currentY + 4, 200, currentY + 4);
//     doc.setFont("Signika-Regular");
//     doc.text("***END OF LEDGER*** ", 90, currentY + 8)

//     const totalPages = doc.getNumberOfPages();

//     for (let i = 1; i <= totalPages; i++) {
//       doc.setPage(i);
//       const isLastPage = i === totalPages;
//       const isSinglePage = totalPages === 1;

//       // Show page number always, full footer only on last page or if single page
//       drawFooter(i, totalPages, isLastPage || isSinglePage);
//     }
//     const pdfBlob = doc.output('blob');
//     const url = URL.createObjectURL(pdfBlob);
//     setPdfPreview(url);

//   };

//   return (
//     <div className="ledger-report-container">
//       <div className="col-auto">
//         <button className="btn btn-secondary me-2" onClick={handlePrint}>
//           Print Report
//         </button>
//         <button className="btn btn-success" onClick={handleExportToExcel}>
//           Export to Excel
//         </button>
//         {pdfPreview && pdfPreview.length > 0 && (
//           <PdfPreview pdfData={pdfPreview} apiData={ledgerData[0]} label={"GLedger"} />
//         )}
//         <button onClick={generatePdf} className="btn btn-secondary">PDF</button>
//       </div>
//       <Typography variant="h6" style={{ textAlign: 'center', fontSize: "24px", fontWeight: "bold", marginTop: "10px" }}>{displayCompanyName}</Typography>
//       <div>
//         <p><strong> {" "}
//           ({acCode || ""}) {" "}
//           {acname || ""} {" "}
//           From Date: {fromDate ? formatDate(fromDate) : "N/A"} {" "}
//           To Date: {toDate ? formatDate(toDate) : "N/A"} </strong>
//           {transType && ` | Transaction Type: ${transType}`}
//         </p>
//       </div>

//       {loading && (
//         <div
//           style={{
//             display: "flex",
//             justifyContent: "center",
//             alignItems: "center",
//             height: "100%",
//           }}
//         >
//           <RingLoader />
//         </div>
//       )}
//       {error && <p className="error-message">{error}</p>}

//       {filteredData.length > 0 && (
//         <>
//           <div style={{ maxHeight: "800px", overflowY: "auto" }}>
//             <table id="reportTable" style={{ marginBottom: "60px", width: "100%" }}>
//               <thead style={{ position: "sticky", top: 0, backgroundColor: "#fff", zIndex: 1, whiteSpace: "nowrap" }}>
//                 <tr>
//                   <th>Trans Type</th>
//                   <th>Doc No</th>
//                   <th>Date</th>
//                   <th>Narration</th>
//                   <th style={{ textAlign: "right" }}>Debit</th>
//                   <th style={{ textAlign: "right" }}>Credit</th>
//                   <th style={{ textAlign: "right" }}>Balance</th>
//                   <th>DR/CR</th>
//                   <th>Do No</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {filteredData.map((item, index) => (
//                   <tr key={index}>
//                     <td>{item.TRAN_TYPE}</td>
//                     <td onClick={() => handleRowClick(item.DOC_NO, item.TRAN_TYPE, item.DOC_DATE)} style={{
//                       cursor: "pointer",
//                       fontWeight: "bold",
//                       color: "darkslategray",
//                       textDecoration: "none"
//                     }}
//                       onMouseOver={(e) => {
//                         e.target.style.color = 'black';
//                         e.target.style.textDecoration = 'underline';
//                       }}
//                       onMouseOut={(e) => {
//                         e.target.style.color = 'darkslategray';
//                         e.target.style.textDecoration = 'none';
//                       }}>{item.DOC_NO}</td>
//                     <td>{item.DOC_DATE}</td>
//                     <td>{item.NARRATION}</td>
//                     <td style={{ textAlign: "right" }}>{formatReadableAmount(parseFloat(item.debit).toFixed(2) || 0.00)}</td>
//                     <td style={{ textAlign: "right" }}>{formatReadableAmount(parseFloat(item.credit).toFixed(2) || 0.00)}</td>
//                     <td style={{ textAlign: "right" }}>{formatReadableAmount(parseFloat(item.Balance).toFixed(2) || 0.00)}</td>
//                     <td>{item.drcr}</td>
//                     <td onClick={() => handleRowClick(item.do_no, "DO", item.DOC_DATE)} style={{
//                       cursor: "pointer",
//                       fontWeight: "bold",
//                       color: "darkslategray",
//                       textDecoration: "none"
//                     }}
//                       onMouseOver={(e) => {
//                         e.target.style.color = 'black';
//                         e.target.style.textDecoration = 'underline';
//                       }}
//                       onMouseOut={(e) => {
//                         e.target.style.color = 'darkslategray';
//                         e.target.style.textDecoration = 'none';
//                       }}>{item.do_no}</td>
//                   </tr>
//                 ))}
//               </tbody>
//               <tfoot>
//                 <tr style={{ backgroundColor: "yellow" }}>
//                   <td colSpan="4" align="right"><strong>Total</strong></td>
//                   <td style={{ textAlign: "right" }}><strong>{formatReadableAmount(totals.debit.toFixed(2))}</strong></td>
//                   <td style={{ textAlign: "right" }}><strong>{formatReadableAmount(totals.credit.toFixed(2))}</strong></td>
//                   <td style={{ textAlign: "right" }}><strong>{formatReadableAmount(Math.abs(parseFloat(totals.debit - totals.credit)).toFixed(2))}</strong></td>
//                   <td ><strong>{(totals.debit.toFixed(2) - totals.credit.toFixed(2)) > 0 ? 'Dr' : 'Cr'}</strong></td>
//                   <td ></td>
//                 </tr>
//               </tfoot>
//             </table>
//           </div>
//           <div className="centered-container">
//           </div>
//         </>
//       )}
//     </div>
//   );

// };

// export default GledgerReport;