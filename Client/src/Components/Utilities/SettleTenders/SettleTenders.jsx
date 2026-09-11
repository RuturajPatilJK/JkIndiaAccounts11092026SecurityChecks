import React, { useState, useEffect, useCallback } from "react";
import AccountMasterHelp from "../../../Helper/AccountMasterHelp";
import TenderSettlementHelp from "../../../Helper/TenderSettlementHelp";
import {
  Grid, Box, Typography, Button, Paper, Stack,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Chip, Tooltip,
  IconButton, Collapse,
} from "@mui/material";
import axios from "axios";
import Swal from "sweetalert2";
import SaveUpdateSpinner from "../../../Common/Spinners/SaveUpdateSpinner";
import PageNotFound from "../../../Common/PageNotFound/PageNotFound";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

const API_URL = process.env.REACT_APP_API;

// ── helpers ───────────────────────────────────────────────────────────────────
const pf = (v) => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };
const fmt = (v, dec = 2) =>
  v == null ? "—" : Number(v).toLocaleString("en-IN", { minimumFractionDigits: dec, maximumFractionDigits: dec });

// ── colour palette ────────────────────────────────────────────────────────────
const C = {
  primary:      "#1565c0",
  primaryLight: "#e3f0ff",
  accent:       "#0288d1",
  success:      "#2e7d32",
  warning:      "#e65100",
  neutral:      "#f5f7fa",
  border:       "#dde3ec",
  headerBg:     "#1565c0",
  headerText:   "#fff",
  rowEven:      "#f9fbff",
  rowOdd:       "#fff",
  gradeHeader:  "#004d40",
  gradeRow:     "#f0fdf9",
};

// ── detail table columns ──────────────────────────────────────────────────────
const DETAIL_COLS = [
  { key: "ID",              label: "#",            width: 40,  align: "center" },
  { key: "buyername",       label: "Buyer",        width: 160 },
  { key: "Buyer_Quantal",   label: "Quantal",      width: 90,  align: "right", fmt: true },
  { key: "Sale_Rate",       label: "Sale Rate",    width: 90,  align: "right", fmt: true },
  { key: "Commission_Rate", label: "Comm. Rate",   width: 90,  align: "right", fmt: true },
  { key: "Delivery_Type",   label: "Delivery",     width: 80,  align: "center" },
  { key: "Sauda_Date",      label: "Sauda Date",   width: 100 },
  { key: "Lifting_Date",    label: "Lifting Date", width: 100 },
  { key: "tcs_rate",        label: "TCS %",        width: 70,  align: "right", fmt: true },
  { key: "gst_rate",        label: "GST %",        width: 70,  align: "right", fmt: true },
  { key: "tcs_amt",         label: "TCS Amt",      width: 90,  align: "right", fmt: true },
  { key: "gst_amt",         label: "GST Amt",      width: 90,  align: "right", fmt: true },
  { key: "detailGradeName", label: "Grade",        width: 100 },
  { key: "dispatched",      label: "Dispatched",   width: 90,  align: "right", fmt: true, editable: true },
  { key: "balance",         label: "Balance",      width: 90,  align: "right", fmt: true, computed: true },
  { key: "Narration",       label: "Narration",    width: 160 },
];

// ── grade table columns ───────────────────────────────────────────────────────
const GRADE_COLS = [
  { key: "gradeCode",     label: "Grade Code",    width: 110, align: "center" },
  { key: "gradeName",     label: "Grade Name",    width: 160 },
  { key: "gradeRate",     label: "Grade Rate",    width: 110, align: "right", editable: true },
  { key: "Purchase_Rate", label: "Purchase Rate", width: 120, align: "right", editable: true },
];

// ── SummaryCard ───────────────────────────────────────────────────────────────
const SummaryCard = ({ label, value, color = C.primary, sub }) => (
  <Paper elevation={0} sx={{
    border: `1.5px solid ${C.border}`, borderRadius: 2,
    px: 2.5, py: 1.5, minWidth: 120, background: C.neutral,
  }}>
    <Typography variant="caption" sx={{ color: "#78909c", fontWeight: 600, letterSpacing: 0.5 }}>
      {label}
    </Typography>
    <Typography variant="h6" sx={{ color, fontWeight: 700, lineHeight: 1.3 }}>{value ?? "—"}</Typography>
    {sub && <Typography variant="caption" sx={{ color: "#90a4ae" }}>{sub}</Typography>}
  </Paper>
);

// ── main component ────────────────────────────────────────────────────────────
function SettleTenders() {
  const [tenderNo,      setTenderNo]      = useState("");
  const [tenderData,    setTenderData]    = useState(null);   // raw API response
  const [detailRows,    setDetailRows]    = useState([]);     // mutable grid rows
  const [gradeRows,     setGradeRows]     = useState([]);     // grade detail rows
  const [showDetails,   setShowDetails]   = useState(true);
  const [showGrades,    setShowGrades]    = useState(true);
  const [paymentTo,     setPaymentTo]     = useState("");
  const [accoid,        setAccoid]        = useState("");
  const [paymentToName, setPaymenToName]  = useState("");
  const [isLoading,     setIsLoading]     = useState(false);
  const [selectedGradeIds, setSelectedGradeIds] = useState(new Set());
  const [canView,       setCanView]       = useState(null);

  const uid         = sessionStorage.getItem("uid");
  const companyCode = sessionStorage.getItem("Company_Code");

  // ── permissions ─────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(
          `${API_URL}/get_user_permissions?Company_Code=${companyCode}&Program_Name=/Settletenders&uid=${uid}`
        );
        setCanView(data?.UserDetails?.canView === "Y");
      } catch { setCanView(false); }
    })();
  }, []);

  // ── build grid when tender selected ─────────────────────────────────────
  useEffect(() => {
    if (!tenderData) { setDetailRows([]); setGradeRows([]); setSelectedGradeIds(new Set()); return; }

    // Detail rows – API returns "despatched" (note spelling from TASK_DETAILS_QUERY)
    const rawDetails = tenderData.last_tender_details_data ?? [];
    const rows = rawDetails.map((item) => {
      const qty        = pf(item.Buyer_Quantal);
      const dispatched = pf(item.despatched ?? item.dispatched ?? 0);
      return { ...item, dispatched, balance: Math.max(qty - dispatched, 0) };
    });
    setDetailRows(rows);

    // Grade rows – key is "last_tender_grade_data" (from getTenderByTenderNo)
    // Each object: { gradeCode, gradeid, gradeRate, Purchase_Rate }
    // We also try to get the grade name from detail rows (detailGradeName)
    const rawGrades = tenderData.last_tender_grade_data ?? [];
    const gradeNameMap = {};
    rawDetails.forEach((d) => {
      if (d.gradeid && d.detailGradeName) gradeNameMap[d.gradeid] = d.detailGradeName;
    });
    const grades = rawGrades.map((g) => ({
      ...g,
      gradeName: gradeNameMap[g.gradeid] ?? g.gradeName ?? "—",
    }));
    setGradeRows(grades);
    setSelectedGradeIds(new Set(rawGrades.map((g) => g.gradeid)));
  }, [tenderData]);

  // ── handlers ─────────────────────────────────────────────────────────────
  const handleMill_Code  = (v)  => setTenderNo(v);
  const handleTenderData = (obj) => setTenderData(obj);

  const handlePayment_To = (acctCode, acid, name) => {
    setPaymentTo(acctCode);
    setAccoid(acid);
    setPaymenToName(name);
  };

  const handleDispatchedChange = useCallback((idx, val) => {
    setDetailRows((prev) =>
      prev.map((row, i) => {
        if (i !== idx) return row;
        const dispatched = pf(val);
        const balance    = Math.max(pf(row.Buyer_Quantal) - dispatched, 0);
        return { ...row, dispatched, balance };
      })
    );
  }, []);

  const handleGradeChange = useCallback((idx, field, val) => {
    setGradeRows((prev) =>
      prev.map((row, i) => (i !== idx ? row : { ...row, [field]: val }))
    );
  }, []);

  const toggleGrade = useCallback((gradeid) => {
    setSelectedGradeIds((prev) => {
      const next = new Set(prev);
      if (next.has(gradeid)) next.delete(gradeid);
      else next.add(gradeid);
      return next;
    });
  }, []);

  // ── computed totals ───────────────────────────────────────────────────────
  const nonSelfRows     = detailRows.filter((r) => r.ID !== 1);
  const totalQuantal    = nonSelfRows.reduce((s, r) => s + pf(r.Buyer_Quantal), 0);
  const totalDispatched = nonSelfRows.reduce((s, r) => s + pf(r.dispatched),    0);
  const totalBalance    = nonSelfRows.reduce((s, r) => s + pf(r.balance),       0);
  const headData        = tenderData?.last_tender_head_data;

  // ── submit ────────────────────────────────────────────────────────────────
  const handleSettleTender = async () => {
    if (!tenderData) {
      return Swal.fire({ title: "Error!", text: "No tender selected.", icon: "warning" });
    }
    if (!paymentTo) {
      return Swal.fire({ title: "Error!", text: "Please select a Payment To account.", icon: "warning" });
    }

    setIsLoading(true);
    try {
      // Build sanitised detail payload — exclude buyer rows whose grade was unchecked
      const sanitizedDetails = detailRows
        .filter((item) => item.ID === 1 || !item.gradeid || selectedGradeIds.has(item.gradeid))
        .map((item) => ({
        Tender_No:       item.Tender_No,
        Company_Code:    item.Company_Code,
        Buyer:           item.Buyer,
        Buyer_Quantal:   item.ID === 1 ? item.Buyer_Quantal : item.balance,
        Sale_Rate:       item.Sale_Rate,
        Commission_Rate: item.Commission_Rate,
        Sauda_Date:      item.Sauda_Date,
        Lifting_Date:    item.Lifting_Date,
        Narration:       item.Narration,
        ID:              item.ID,
        Buyer_Party:     item.Buyer_Party,
        AutoID:          item.AutoID,
        IsActive:        item.IsActive,
        year_code:       item.year_code,
        Branch_Id:       item.Branch_Id,
        Delivery_Type:   item.Delivery_Type,
        tenderid:        item.tenderid,
        tenderdetailid:  item.tenderdetailid,
        buyerid:         item.buyerid,
        buyerpartyid:    item.buyerpartyid,
        sub_broker:      item.sub_broker,
        sbr:             item.sbr,
        tcs_rate:        item.tcs_rate,
        gst_rate:        item.gst_rate,
        tcs_amt:         item.tcs_amt,
        gst_amt:         item.gst_amt,
        ShipTo:          item.ShipTo,
        CashDiff:        item.CashDiff,
        shiptoid:        item.shiptoid,
        gradeid:         item.gradeid,
        gradeCode:       item.gradeCode,
        Mill_Rate:       item.Mill_Rate,
        Purchase_Rate:   item.detailPurchase_Rate ?? item.Purchase_Rate,
        dispatched:      item.dispatched,   // "despatched" from API, renamed here
        balance:         item.balance,
      }));

      // Grade details payload — only include grades checked for settlement
      const sanitizedGrades = gradeRows
        .filter((g) => selectedGradeIds.has(g.gradeid))
        .map((g) => ({
        gradeCode:     g.gradeCode,
        gradeid:       g.gradeid,
        gradeRate:     pf(g.gradeRate),
        Purchase_Rate: pf(g.Purchase_Rate),
      }));

      const payload = {
        last_tender_head_data: {
          ...headData,
          Payment_To: paymentTo,
          pt:         accoid,
        },
        last_tender_details_data:       sanitizedDetails,
        last_tender_grade_details_data: sanitizedGrades,  // key expected by tender_settlement route
      };

      await axios.post(`${API_URL}/tender_settlement`, payload);

      Swal.fire({ title: "Success!", text: "Tender settled and new record created.", icon: "success" });

      // reset
      setTenderNo(""); setTenderData(null);
      setDetailRows([]); setGradeRows([]); setSelectedGradeIds(new Set());
      setPaymentTo(""); setAccoid(""); setPaymenToName("");
    } catch (err) {
      console.error(err);
      Swal.fire({ title: "Error!", text: "Failed to settle tender.", icon: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  if (canView === false) return <PageNotFound />;

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ p: { xs: 1.5, md: 3 }, maxWidth: 1400, mx: "auto" }}>

      {/* ── Page title ── */}
      <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box sx={{
          width: 6, height: 36, borderRadius: 3,
          background: `linear-gradient(180deg, ${C.primary}, ${C.accent})`,
        }} />
        <Typography variant="h5" sx={{ fontWeight: 700, color: C.primary, letterSpacing: -0.5 }}>
          Settle Tenders
        </Typography>
        {headData && (
          <Chip
            label={`Tender # ${headData.Tender_No}`}
            size="small"
            sx={{ ml: 1, fontWeight: 700, background: C.primaryLight, color: C.primary }}
          />
        )}
      </Box>

      {/* ── Selection panel ── */}
      <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 3, border: `1px solid ${C.border}` }}>
        <Grid container spacing={3} alignItems="flex-end">

          {/* Tender No */}
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: "#78909c", mb: 0.5, display: "block" }}>
              TENDER NO
            </Typography>
            <TenderSettlementHelp
              name="Tender_No"
              onAcCodeClick={handleMill_Code}
              tenderNo={tenderNo}
              paymentTo_Name={tenderData?.last_tender_details_data?.[0]?.PaymentToAcName}
              onTenderSelect={handleTenderData}
            />
          </Grid>

          {/* Payment To */}
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: "#78909c", mb: 0.5, display: "block" }}>
              PAYMENT TO
            </Typography>
            <AccountMasterHelp
              name="Payment_To"
              onAcCodeClick={handlePayment_To}
              CategoryName={paymentToName}
              CategoryCode={paymentTo}
              Ac_type={[]}
            />
          </Grid>

          {/* Summary chips */}
          {headData && (
            <Grid item xs={12} md={4}>
              {/* <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
                <SummaryCard label="Mill Rate"  value={fmt(headData.Mill_Rate)}  color={C.primary} />
                <SummaryCard label="Total Qty"  value={fmt(totalQuantal, 0)}     color={C.success} sub="qtls" />
                <SummaryCard
                  label="Balance"
                  value={fmt(totalBalance, 0)}
                  color={totalBalance > 0 ? C.warning : C.success}
                  sub="qtls"
                />
              </Stack> */}
            </Grid>
          )}
        </Grid>

        {/* Head info strip */}
        {headData && (
          <Box sx={{ mt: 2.5, pt: 2, borderTop: `1px dashed ${C.border}` }}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {[
                ["Grade",       headData.Grade],
                ["Packing",     headData.Packing ? `${headData.Packing} kg` : "—"],
                ["Bags",        headData.Bags],
                ["Type",        headData.type === "M" ? "Mill" : "Purchase"],
                ["TCS Rate",    `${fmt(headData.TCS_Rate)} %`],
                ["TDS Rate",    `${fmt(headData.TDS_Rate)} %`],
                ["Season",      headData.season],
                ["Tender Date", headData.Tender_Date],
                ["Mill Name",   headData.MillName ?? "—"],
                ["Payment To",  tenderData?.last_tender_details_data?.[0]?.PaymentToAcName ?? "—"],
              ].map(([l, v]) => (
                <Box key={l} sx={{
                  background: C.neutral, border: `1px solid ${C.border}`,
                  borderRadius: 1.5, px: 1.5, py: 0.8,
                }}>
                  <Typography variant="caption" sx={{ color: "#90a4ae", display: "block", fontWeight: 600 }}>{l}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: "#37474f" }}>{v ?? "—"}</Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        )}
      </Paper>

      {/* ── Tender Detail Grid ── */}
      {detailRows.length > 0 && (
        <Paper elevation={2} sx={{ borderRadius: 3, mb: 3, border: `1px solid ${C.border}`, overflow: "hidden" }}>
          <Box
            sx={{ display: "flex", alignItems: "center", justifyContent: "space-between",
              px: 2.5, py: 1.5, background: C.headerBg, cursor: "pointer" }}
            onClick={() => setShowDetails((v) => !v)}
          >
            <Typography sx={{ color: C.headerText, fontWeight: 700, fontSize: 14 }}>
              Tender Details — {nonSelfRows.length} buyer{nonSelfRows.length !== 1 ? "s" : ""}
            </Typography>
            <IconButton size="small" sx={{ color: C.headerText }}>
              {showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
          <Collapse in={showDetails}>
            <TableContainer sx={{ maxHeight: 380, overflowX: "auto" }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {DETAIL_COLS.map((col) => (
                      <TableCell key={col.key} align={col.align ?? "left"} sx={{
                        minWidth: col.width, background: C.headerBg,
                        color: C.headerText, fontWeight: 700, fontSize: 12,
                        borderBottom: "none", whiteSpace: "nowrap",
                      }}>
                        {col.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {detailRows.map((row, idx) => {
                    const excluded = row.ID !== 1 && row.gradeid && !selectedGradeIds.has(row.gradeid);
                    return (
                      <TableRow key={idx} sx={{
                        background: excluded ? "#fff3f3" : idx % 2 === 0 ? C.rowEven : C.rowOdd,
                        opacity: excluded ? 0.45 : 1,
                        transition: "opacity 0.2s, background 0.2s",
                      }}>
                        {DETAIL_COLS.map((col) => {
                          if (col.editable && row.ID !== 1) {
                            return (
                              <TableCell key={col.key} align={col.align ?? "left"} sx={{ py: 0.5 }}>
                                {/* <TextField
                                  variant="outlined" size="small"
                                  value={row[col.key] ?? ""}
                                  disabled={excluded}
                                  onChange={(e) => col.key === "dispatched" && handleDispatchedChange(idx, e.target.value)}
                                  sx={{ width: col.width - 10, "& input": { py: 0.5, px: 1, fontSize: 12 } }}
                                  disabled
                                /> */}
                              </TableCell>
                            );
                          }
                          return (
                            <TableCell key={col.key} align={col.align ?? "left"} sx={{
                              fontSize: 12, whiteSpace: "nowrap",
                              textDecoration: excluded ? "line-through" : "none",
                              color: excluded ? "#b0bec5" : "inherit",
                            }}>
                              {col.fmt || col.computed ? fmt(row[col.key]) : (row[col.key] ?? "—")}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ px: 2.5, py: 1, borderTop: `1px solid ${C.border}`, display: "flex", gap: 3 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: C.primary }}>
                Total Quantal: {fmt(totalQuantal, 0)}
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 700, color: C.success }}>
                Dispatched: {fmt(totalDispatched, 0)}
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 700, color: totalBalance > 0 ? C.warning : C.success }}>
                Balance: {fmt(totalBalance, 0)}
              </Typography>
            </Box>
          </Collapse>
        </Paper>
      )}

      {/* ── Grade Details Grid ── */}
      {gradeRows.length > 0 && (
        <Paper elevation={2} sx={{ borderRadius: 3, mb: 3, border: `1px solid ${C.border}`, overflow: "hidden" }}>
          <Box
            sx={{ display: "flex", alignItems: "center", justifyContent: "space-between",
              px: 2.5, py: 1.5, background: C.gradeHeader, cursor: "pointer" }}
            onClick={() => setShowGrades((v) => !v)}
          >
            <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>
              Grade Details — {selectedGradeIds.size} / {gradeRows.length} grades selected for settlement
            </Typography>
            <IconButton size="small" sx={{ color: "#fff" }}>
              {showGrades ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
          <Collapse in={showGrades}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell align="center" sx={{
                      width: 70, background: C.gradeHeader,
                      color: "#fff", fontWeight: 700, fontSize: 12, borderBottom: "none",
                    }}>
                      Shift
                    </TableCell>
                    {GRADE_COLS.map((col) => (
                      <TableCell key={col.key} align={col.align ?? "left"} sx={{
                        minWidth: col.width, background: C.gradeHeader,
                        color: "#fff", fontWeight: 700, fontSize: 12, borderBottom: "none",
                      }}>
                        {col.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {gradeRows.map((row, idx) => {
                    const selected = selectedGradeIds.has(row.gradeid);
                    return (
                      <TableRow key={idx} sx={{
                        background: selected ? C.gradeRow : "#fff8f8",
                        opacity: selected ? 1 : 0.5,
                        transition: "background 0.2s, opacity 0.2s",
                      }}>
                        <TableCell align="center">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleGrade(row.gradeid)}
                            style={{ width: 16, height: 16, cursor: "pointer", accentColor: C.gradeHeader }}
                          />
                        </TableCell>
                        {GRADE_COLS.map((col) => {
                          if (col.editable) {
                            return (
                              <TableCell key={col.key} align={col.align ?? "left"} sx={{ py: 0.5 }}>
                                <TextField
                                  variant="outlined" size="small"
                                  value={row[col.key] ?? ""}
                                  disabled={!selected}
                                  onChange={(e) => handleGradeChange(idx, col.key, e.target.value)}
                                  sx={{ width: col.width - 10, "& input": { py: 0.5, px: 1, fontSize: 12 } }}
                                />
                              </TableCell>
                            );
                          }
                          return (
                            <TableCell key={col.key} align={col.align ?? "left"} sx={{
                              fontSize: 12,
                              textDecoration: selected ? "none" : "line-through",
                              color: selected ? "inherit" : "#b0bec5",
                            }}>
                              {row[col.key] ?? "—"}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Collapse>
        </Paper>
      )}

      {/* ── Action buttons ── */}
      {tenderData && (
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 1,mb:60}}>
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => {
              setTenderNo(""); setTenderData(null);
              setDetailRows([]); setGradeRows([]); setSelectedGradeIds(new Set());
              setPaymentTo(""); setAccoid(""); setPaymenToName("");
            }}
            sx={{ borderRadius: 2, px: 3 }}
          >
            Clear
          </Button>

          <Button
            variant="contained"
            onClick={handleSettleTender}
            disabled={!tenderData || !paymentTo || isLoading}
            sx={{
              borderRadius: 2, px: 4, py: 1.2,
              fontWeight: 700, fontSize: "1rem",
              background: `linear-gradient(135deg, ${C.primary} 0%, ${C.accent} 100%)`,
              boxShadow: "0 4px 16px rgba(21,101,192,0.35)",
              "&:hover": { boxShadow: "0 6px 20px rgba(21,101,192,0.5)", transform: "translateY(-1px)" },
              "&:disabled": { opacity: 0.6 },
              transition: "all 0.2s",
            }}
          >
            {isLoading ? "Settling…" : "✅ Settle Tender"}
          </Button>
        </Box>
      )}

      {/* ── Loading overlay ── */}
      {isLoading && (
        <Box sx={{
          position: "fixed", inset: 0,
          background: "rgba(255,255,255,0.65)",
          display: "flex", justifyContent: "center", alignItems: "center",
          zIndex: 1400, backdropFilter: "blur(2px)",
        }}>
          <SaveUpdateSpinner />
        </Box>
      )}
    </Box>
  );
}

export default SettleTenders;



// import React, { useState, useEffect, useCallback } from "react";
// import AccountMasterHelp from "../../../Helper/AccountMasterHelp";
// import TenderSettlementHelp from "../../../Helper/TenderSettlementHelp";
// import {
//   Grid, Box, Typography, Button, Paper, Stack,
//   Table, TableBody, TableCell, TableContainer,
//   TableHead, TableRow, TextField, Chip, Tooltip,
//   IconButton, Collapse,
// } from "@mui/material";
// import axios from "axios";
// import Swal from "sweetalert2";
// import SaveUpdateSpinner from "../../../Common/Spinners/SaveUpdateSpinner";
// import PageNotFound from "../../../Common/PageNotFound/PageNotFound";
// import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
// import ExpandLessIcon from "@mui/icons-material/ExpandLess";
// import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

// const API_URL = process.env.REACT_APP_API;

// // ── helpers ───────────────────────────────────────────────────────────────────
// const pf = (v) => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };
// const fmt = (v, dec = 2) =>
//   v == null ? "—" : Number(v).toLocaleString("en-IN", { minimumFractionDigits: dec, maximumFractionDigits: dec });

// // ── colour palette ────────────────────────────────────────────────────────────
// const C = {
//   primary:      "#1565c0",
//   primaryLight: "#e3f0ff",
//   accent:       "#0288d1",
//   success:      "#2e7d32",
//   warning:      "#e65100",
//   neutral:      "#f5f7fa",
//   border:       "#dde3ec",
//   headerBg:     "#1565c0",
//   headerText:   "#fff",
//   rowEven:      "#f9fbff",
//   rowOdd:       "#fff",
//   gradeHeader:  "#004d40",
//   gradeRow:     "#f0fdf9",
// };

// // ── detail table columns ──────────────────────────────────────────────────────
// const DETAIL_COLS = [
//   { key: "ID",              label: "#",            width: 40,  align: "center" },
//   { key: "buyername",       label: "Buyer",        width: 160 },
//   { key: "Buyer_Quantal",   label: "Quantal",      width: 90,  align: "right", fmt: true },
//   { key: "Sale_Rate",       label: "Sale Rate",    width: 90,  align: "right", fmt: true },
//   { key: "Commission_Rate", label: "Comm. Rate",   width: 90,  align: "right", fmt: true },
//   { key: "Delivery_Type",   label: "Delivery",     width: 80,  align: "center" },
//   { key: "Sauda_Date",      label: "Sauda Date",   width: 100 },
//   { key: "Lifting_Date",    label: "Lifting Date", width: 100 },
//   { key: "tcs_rate",        label: "TCS %",        width: 70,  align: "right", fmt: true },
//   { key: "gst_rate",        label: "GST %",        width: 70,  align: "right", fmt: true },
//   { key: "tcs_amt",         label: "TCS Amt",      width: 90,  align: "right", fmt: true },
//   { key: "gst_amt",         label: "GST Amt",      width: 90,  align: "right", fmt: true },
//   { key: "detailGradeName", label: "Grade",        width: 100 },
//   { key: "dispatched",      label: "Dispatched",   width: 90,  align: "right", fmt: true, editable: true },
//   { key: "balance",         label: "Balance",      width: 90,  align: "right", fmt: true, computed: true },
//   { key: "Narration",       label: "Narration",    width: 160 },
// ];

// // ── grade table columns ───────────────────────────────────────────────────────
// const GRADE_COLS = [
//   { key: "gradeCode",     label: "Grade Code",    width: 110, align: "center" },
//   { key: "gradeName",     label: "Grade Name",    width: 160 },
//   { key: "gradeRate",     label: "Grade Rate",    width: 110, align: "right", editable: true },
//   { key: "Purchase_Rate", label: "Purchase Rate", width: 120, align: "right", editable: true },
// ];

// // ── SummaryCard ───────────────────────────────────────────────────────────────
// const SummaryCard = ({ label, value, color = C.primary, sub }) => (
//   <Paper elevation={0} sx={{
//     border: `1.5px solid ${C.border}`, borderRadius: 2,
//     px: 2.5, py: 1.5, minWidth: 120, background: C.neutral,
//   }}>
//     <Typography variant="caption" sx={{ color: "#78909c", fontWeight: 600, letterSpacing: 0.5 }}>
//       {label}
//     </Typography>
//     <Typography variant="h6" sx={{ color, fontWeight: 700, lineHeight: 1.3 }}>{value ?? "—"}</Typography>
//     {sub && <Typography variant="caption" sx={{ color: "#90a4ae" }}>{sub}</Typography>}
//   </Paper>
// );

// // ── main component ────────────────────────────────────────────────────────────
// function SettleTenders() {
//   const [tenderNo,      setTenderNo]      = useState("");
//   const [tenderData,    setTenderData]    = useState(null);   // raw API response
//   const [detailRows,    setDetailRows]    = useState([]);     // mutable grid rows
//   const [gradeRows,     setGradeRows]     = useState([]);     // grade detail rows
//   const [showDetails,   setShowDetails]   = useState(true);
//   const [showGrades,    setShowGrades]    = useState(true);
//   const [paymentTo,     setPaymentTo]     = useState("");
//   const [accoid,        setAccoid]        = useState("");
//   const [paymentToName, setPaymenToName]  = useState("");
//   const [isLoading,     setIsLoading]     = useState(false);
//   const [canView,       setCanView]       = useState(null);

//   const uid         = sessionStorage.getItem("uid");
//   const companyCode = sessionStorage.getItem("Company_Code");

//   // ── permissions ─────────────────────────────────────────────────────────
//   useEffect(() => {
//     (async () => {
//       try {
//         const { data } = await axios.get(
//           `${API_URL}/get_user_permissions?Company_Code=${companyCode}&Program_Name=/Settletenders&uid=${uid}`
//         );
//         setCanView(data?.UserDetails?.canView === "Y");
//       } catch { setCanView(false); }
//     })();
//   }, []);

//   // ── build grid when tender selected ─────────────────────────────────────
//   useEffect(() => {
//     if (!tenderData) { setDetailRows([]); setGradeRows([]); return; }

//     // Detail rows – API returns "despatched" (note spelling from TASK_DETAILS_QUERY)
//     const rawDetails = tenderData.last_tender_details_data ?? [];
//     const rows = rawDetails.map((item) => {
//       const qty        = pf(item.Buyer_Quantal);
//       const dispatched = pf(item.despatched ?? item.dispatched ?? 0);
//       return { ...item, dispatched, balance: Math.max(qty - dispatched, 0) };
//     });
//     setDetailRows(rows);

//     // Grade rows – key is "last_tender_grade_data" (from getTenderByTenderNo)
//     // Each object: { gradeCode, gradeid, gradeRate, Purchase_Rate }
//     // We also try to get the grade name from detail rows (detailGradeName)
//     const rawGrades = tenderData.last_tender_grade_data ?? [];
//     const gradeNameMap = {};
//     rawDetails.forEach((d) => {
//       if (d.gradeid && d.detailGradeName) gradeNameMap[d.gradeid] = d.detailGradeName;
//     });
//     const grades = rawGrades.map((g) => ({
//       ...g,
//       gradeName: gradeNameMap[g.gradeid] ?? g.gradeName ?? "—",
//     }));
//     setGradeRows(grades);
//   }, [tenderData]);

//   // ── handlers ─────────────────────────────────────────────────────────────
//   const handleMill_Code  = (v)  => setTenderNo(v);
//   const handleTenderData = (obj) => setTenderData(obj);

//   const handlePayment_To = (acctCode, acid, name) => {
//     setPaymentTo(acctCode);
//     setAccoid(acid);
//     setPaymenToName(name);
//   };

//   const handleDispatchedChange = useCallback((idx, val) => {
//     setDetailRows((prev) =>
//       prev.map((row, i) => {
//         if (i !== idx) return row;
//         const dispatched = pf(val);
//         const balance    = Math.max(pf(row.Buyer_Quantal) - dispatched, 0);
//         return { ...row, dispatched, balance };
//       })
//     );
//   }, []);

//   const handleGradeChange = useCallback((idx, field, val) => {
//     setGradeRows((prev) =>
//       prev.map((row, i) => (i !== idx ? row : { ...row, [field]: val }))
//     );
//   }, []);

//   // ── computed totals ───────────────────────────────────────────────────────
//   const nonSelfRows     = detailRows.filter((r) => r.ID !== 1);
//   const totalQuantal    = nonSelfRows.reduce((s, r) => s + pf(r.Buyer_Quantal), 0);
//   const totalDispatched = nonSelfRows.reduce((s, r) => s + pf(r.dispatched),    0);
//   const totalBalance    = nonSelfRows.reduce((s, r) => s + pf(r.balance),       0);
//   const headData        = tenderData?.last_tender_head_data;

//   // ── submit ────────────────────────────────────────────────────────────────
//   const handleSettleTender = async () => {
//     if (!tenderData) {
//       return Swal.fire({ title: "Error!", text: "No tender selected.", icon: "warning" });
//     }
//     if (!paymentTo) {
//       return Swal.fire({ title: "Error!", text: "Please select a Payment To account.", icon: "warning" });
//     }

//     setIsLoading(true);
//     try {
//       // Build sanitised detail payload (mirrors original field list + dispatched/balance)
//       const sanitizedDetails = detailRows.map((item) => ({
//         Tender_No:       item.Tender_No,
//         Company_Code:    item.Company_Code,
//         Buyer:           item.Buyer,
//         Buyer_Quantal:   item.Buyer_Quantal,
//         Sale_Rate:       item.Sale_Rate,
//         Commission_Rate: item.Commission_Rate,
//         Sauda_Date:      item.Sauda_Date,
//         Lifting_Date:    item.Lifting_Date,
//         Narration:       item.Narration,
//         ID:              item.ID,
//         Buyer_Party:     item.Buyer_Party,
//         AutoID:          item.AutoID,
//         IsActive:        item.IsActive,
//         year_code:       item.year_code,
//         Branch_Id:       item.Branch_Id,
//         Delivery_Type:   item.Delivery_Type,
//         tenderid:        item.tenderid,
//         tenderdetailid:  item.tenderdetailid,
//         buyerid:         item.buyerid,
//         buyerpartyid:    item.buyerpartyid,
//         sub_broker:      item.sub_broker,
//         sbr:             item.sbr,
//         tcs_rate:        item.tcs_rate,
//         gst_rate:        item.gst_rate,
//         tcs_amt:         item.tcs_amt,
//         gst_amt:         item.gst_amt,
//         ShipTo:          item.ShipTo,
//         CashDiff:        item.CashDiff,
//         shiptoid:        item.shiptoid,
//         gradeid:         item.gradeid,
//         gradeCode:       item.gradeCode,
//         Mill_Rate:       item.Mill_Rate,
//         Purchase_Rate:   item.detailPurchase_Rate ?? item.Purchase_Rate,
//         dispatched:      item.dispatched,   // "despatched" from API, renamed here
//         balance:         item.balance,
//       }));

//       // Grade details payload – use current (possibly edited) gradeRows state
//       const sanitizedGrades = gradeRows.map((g) => ({
//         gradeCode:     g.gradeCode,
//         gradeid:       g.gradeid,
//         gradeRate:     pf(g.gradeRate),
//         Purchase_Rate: pf(g.Purchase_Rate),
//       }));

//       const payload = {
//         last_tender_head_data: {
//           ...headData,
//           Payment_To: paymentTo,
//           pt:         accoid,
//         },
//         last_tender_details_data:       sanitizedDetails,
//         last_tender_grade_details_data: sanitizedGrades,  // key expected by tender_settlement route
//       };

//       await axios.post(`${API_URL}/tender_settlement`, payload);

//       Swal.fire({ title: "Success!", text: "Tender settled and new record created.", icon: "success" });

//       // reset
//       setTenderNo(""); setTenderData(null);
//       setDetailRows([]); setGradeRows([]);
//       setPaymentTo(""); setAccoid(""); setPaymenToName("");
//     } catch (err) {
//       console.error(err);
//       Swal.fire({ title: "Error!", text: "Failed to settle tender.", icon: "error" });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   if (canView === false) return <PageNotFound />;

//   // ── render ────────────────────────────────────────────────────────────────
//   return (
//     <Box sx={{ p: { xs: 1.5, md: 3 }, maxWidth: 1400, mx: "auto" }}>

//       {/* ── Page title ── */}
//       <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1.5 }}>
//         <Box sx={{
//           width: 6, height: 36, borderRadius: 3,
//           background: `linear-gradient(180deg, ${C.primary}, ${C.accent})`,
//         }} />
//         <Typography variant="h5" sx={{ fontWeight: 700, color: C.primary, letterSpacing: -0.5 }}>
//           Settle Tenders
//         </Typography>
//         {headData && (
//           <Chip
//             label={`Tender # ${headData.Tender_No}`}
//             size="small"
//             sx={{ ml: 1, fontWeight: 700, background: C.primaryLight, color: C.primary }}
//           />
//         )}
//       </Box>

//       {/* ── Selection panel ── */}
//       <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 3, border: `1px solid ${C.border}` }}>
//         <Grid container spacing={3} alignItems="flex-end">

//           {/* Tender No */}
//           <Grid item xs={12} sm={6} md={4}>
//             <Typography variant="caption" sx={{ fontWeight: 600, color: "#78909c", mb: 0.5, display: "block" }}>
//               TENDER NO
//             </Typography>
//             <TenderSettlementHelp
//               name="Tender_No"
//               onAcCodeClick={handleMill_Code}
//               tenderNo={tenderNo}
//               paymentTo_Name={tenderData?.last_tender_details_data?.[0]?.PaymentToAcName}
//               onTenderSelect={handleTenderData}
//             />
//           </Grid>

//           {/* Payment To */}
//           <Grid item xs={12} sm={6} md={4}>
//             <Typography variant="caption" sx={{ fontWeight: 600, color: "#78909c", mb: 0.5, display: "block" }}>
//               PAYMENT TO
//             </Typography>
//             <AccountMasterHelp
//               name="Payment_To"
//               onAcCodeClick={handlePayment_To}
//               CategoryName={paymentToName}
//               CategoryCode={paymentTo}
//               Ac_type={[]}
//             />
//           </Grid>

//           {/* Summary chips */}
//           {headData && (
//             <Grid item xs={12} md={4}>
//               {/* <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
//                 <SummaryCard label="Mill Rate"  value={fmt(headData.Mill_Rate)}  color={C.primary} />
//                 <SummaryCard label="Total Qty"  value={fmt(totalQuantal, 0)}     color={C.success} sub="qtls" />
//                 <SummaryCard
//                   label="Balance"
//                   value={fmt(totalBalance, 0)}
//                   color={totalBalance > 0 ? C.warning : C.success}
//                   sub="qtls"
//                 />
//               </Stack> */}
//             </Grid>
//           )}
//         </Grid>

//         {/* Head info strip */}
//         {headData && (
//           <Box sx={{ mt: 2.5, pt: 2, borderTop: `1px dashed ${C.border}` }}>
//             <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
//               {[
//                 ["Grade",       headData.Grade],
//                 ["Packing",     headData.Packing ? `${headData.Packing} kg` : "—"],
//                 ["Bags",        headData.Bags],
//                 ["Type",        headData.type === "M" ? "Mill" : "Purchase"],
//                 ["TCS Rate",    `${fmt(headData.TCS_Rate)} %`],
//                 ["TDS Rate",    `${fmt(headData.TDS_Rate)} %`],
//                 ["Season",      headData.season],
//                 ["Tender Date", headData.Tender_Date],
//                 ["Mill Name",   headData.MillName ?? "—"],
//                 ["Payment To",  tenderData?.last_tender_details_data?.[0]?.PaymentToAcName ?? "—"],
//               ].map(([l, v]) => (
//                 <Box key={l} sx={{
//                   background: C.neutral, border: `1px solid ${C.border}`,
//                   borderRadius: 1.5, px: 1.5, py: 0.8,
//                 }}>
//                   <Typography variant="caption" sx={{ color: "#90a4ae", display: "block", fontWeight: 600 }}>{l}</Typography>
//                   <Typography variant="body2" sx={{ fontWeight: 700, color: "#37474f" }}>{v ?? "—"}</Typography>
//                 </Box>
//               ))}
//             </Stack>
//           </Box>
//         )}
//       </Paper>

//       {/* ── Tender Detail Grid ── */}

//       {/* ── Action buttons ── */}
//       {tenderData && (
//         <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 1 }}>
//           <Button
//             variant="outlined"
//             color="inherit"
//             onClick={() => {
//               setTenderNo(""); setTenderData(null);
//               setDetailRows([]); setGradeRows([]);
//               setPaymentTo(""); setAccoid(""); setPaymenToName("");
//             }}
//             sx={{ borderRadius: 2, px: 3 }}
//           >
//             Clear
//           </Button>

//           <Button
//             variant="contained"
//             onClick={handleSettleTender}
//             disabled={!tenderData || !paymentTo || isLoading}
//             sx={{
//               borderRadius: 2, px: 4, py: 1.2,
//               fontWeight: 700, fontSize: "1rem",
//               background: `linear-gradient(135deg, ${C.primary} 0%, ${C.accent} 100%)`,
//               boxShadow: "0 4px 16px rgba(21,101,192,0.35)",
//               "&:hover": { boxShadow: "0 6px 20px rgba(21,101,192,0.5)", transform: "translateY(-1px)" },
//               "&:disabled": { opacity: 0.6 },
//               transition: "all 0.2s",
//             }}
//           >
//             {isLoading ? "Settling…" : "✅ Settle Tender"}
//           </Button>
//         </Box>
//       )}

//       {/* ── Loading overlay ── */}
//       {isLoading && (
//         <Box sx={{
//           position: "fixed", inset: 0,
//           background: "rgba(255,255,255,0.65)",
//           display: "flex", justifyContent: "center", alignItems: "center",
//           zIndex: 1400, backdropFilter: "blur(2px)",
//         }}>
//           <SaveUpdateSpinner />
//         </Box>
//       )}
//     </Box>
//   );
// }

// export default SettleTenders;
