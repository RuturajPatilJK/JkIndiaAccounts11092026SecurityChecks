import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";

const FMT_DATE = (d) => {
  if (!d || d === "-") return "-";
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(d)) {
    const [dd, mm, yyyy] = d.split("/");
    return `${dd}-${mm}-${yyyy}`;
  }
  try {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return d;
    const dd = String(dt.getDate()).padStart(2, "0");
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const yyyy = dt.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  } catch { return d; }
};

const FMT_NUM = (v, dec = 2) => {
  if (v == null || v === "") return "-";
  const n = Number(v);
  return isNaN(n) ? v : n.toFixed(dec);
};

const COLS = [
  { key: "Tender_No", label: "Tender No", align: "left" },
  { key: "Party", label: "Party Name", align: "left" },
  { key: "doname", label: "DO Name", align: "left" },
  { key: "Grade", label: "Grade", align: "left" },
  { key: "season", label: "Season", align: "left" },
  { key: "TruckNo", label: "Truck No", align: "left" },
  { key: "MillRate", label: "Mill Rate", align: "right" },
  { key: "Sale_Rate", label: "Sale Rate", align: "right" },
  { key: "Buyer_Quantal", label: "Buyer Quintal", align: "right" },
  { key: "Lifting_Quintal", label: "Lifting Quintal", align: "right" },
  { key: "DESPATCH", label: "Dispatched", align: "right" },
  { key: "BALANCE", label: "Balance", align: "right" },
  { key: "Lifting_Date", label: "Lifting Date", align: "left" },
  { key: "Party_Bill_Rate", label: "Party Bill Rate", align: "right" },
  { key: "Note", label: "Billing / Shipping Details", align: "left" },
  { key: "Approved", label: "Status", align: "left" },
];

function PendingDOSelectModal({ open, onClose, data = [], onSelect, loading }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortCol, setSortCol] = useState("Tender_No");
  const [sortAsc, setSortAsc] = useState(false);
  // use index into filtered[] — guarantees uniqueness even for rows with identical field values
  const [selectedIdx, setSelectedIdx] = useState(null);

  const containerRef = useRef(null);
  const rowRefs = useRef([]);
  const searchRef = useRef(null);

  const counts = useMemo(() => ({
    total: data.length,
    approved: data.filter((r) => r.Approved === "Y").length,
    pending: data.filter((r) => r.Approved !== "Y").length,
  }), [data]);

  const filtered = useMemo(() => {
    let list = data;

    if (statusFilter !== "all")
      list = list.filter((r) =>
        statusFilter === "Y" ? r.Approved === "Y" : r.Approved !== "Y"
      );

    if (search.trim()) {
      const s = search.trim().toLowerCase();
      list = list.filter((r) =>
        [r.Tender_No, r.Party, r.doname, r.Grade, r.season,
        r.millshortname, r.TruckNo, r.DriverMobileNo]
          .some((v) => String(v || "").toLowerCase().includes(s))
      );
    }

    list = [...list].sort((a, b) => {
      const va = a[sortCol] ?? "";
      const vb = b[sortCol] ?? "";
      const na = Number(va), nb = Number(vb);
      const cmp = (!isNaN(na) && !isNaN(nb))
        ? na - nb
        : String(va).localeCompare(String(vb));
      return sortAsc ? cmp : -cmp;
    });

    return list;
  }, [data, search, statusFilter, sortCol, sortAsc]);

  // reset selection when the visible list changes
  useEffect(() => { setSelectedIdx(null); }, [search, statusFilter, sortCol, sortAsc]);

  // focus the container when modal opens; reset state when it closes
  useEffect(() => {
    if (open) {
      setTimeout(() => containerRef.current?.focus(), 50);
    } else {
      setSelectedIdx(null);
      setSearch("");
      setStatusFilter("all");
      setSortCol("Tender_No");
      setSortAsc(false);
    }
  }, [open]);

  // scroll highlighted row into view
  useEffect(() => {
    if (selectedIdx !== null && rowRefs.current[selectedIdx]) {
      rowRefs.current[selectedIdx].scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [selectedIdx]);

  const confirmSelect = useCallback((row) => {
    if (!row) return;
    onSelect(row);
    setSelectedIdx(null);
  }, [onSelect]);

  const handleKeyDown = useCallback((e) => {
    if (!filtered.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((prev) =>
        prev === null ? 0 : Math.min(prev + 1, filtered.length - 1)
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((prev) =>
        prev === null ? filtered.length - 1 : Math.max(prev - 1, 0)
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIdx !== null) {
        confirmSelect(filtered[selectedIdx]);
      } else if (filtered.length === 1) {
        confirmSelect(filtered[0]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  }, [filtered, selectedIdx, confirmSelect, onClose]);

  const toggleSort = (key) => {
    if (sortCol === key) setSortAsc((p) => !p);
    else { setSortCol(key); setSortAsc(true); }
  };

  const cellContent = (col, row) => {
    const bal = Number(row.BALANCE || 0);
    switch (col.key) {
      case "Tender_No":
        return (
          <span style={{ fontWeight: 600, color: "#1d4ed8" }}>
            #{row.Tender_No}
          </span>
        );
      case "Party":
        return (
          <span
            title={row.Party}
            style={{
              display: "block", overflow: "hidden",
              textOverflow: "ellipsis", whiteSpace: "nowrap",
              fontWeight: 500, color: "#1e293b", maxWidth: 150,
            }}
          >
            {row.Party || "-"}
          </span>
        );
      case "doname":
        return (
          <span
            title={row.doname}
            style={{
              display: "block", overflow: "hidden",
              textOverflow: "ellipsis", whiteSpace: "nowrap",
              color: "#475569", maxWidth: 160,
            }}
          >
            {row.doname || "-"}
          </span>
        );
      case "Grade":
        return <span style={{ color: "#374151" }}>{row.Grade || "-"}</span>;
      case "season":
        return <span style={{ color: "#64748b" }}>{row.season || "-"}</span>;
      case "TruckNo":
        return (
          <span style={{ color: "#1e40af", fontWeight: 500 }}>
            {row.TruckNo || "-"}
          </span>
        );
      case "MillRate":
        return (
          <span style={{ color: "#4338ca", fontWeight: 500 }}>
            {FMT_NUM(row.MillRate)}
          </span>
        );
      case "Sale_Rate":
        return (
          <span style={{ color: "#15803d", fontWeight: 600 }}>
            {FMT_NUM(row.Sale_Rate)}
          </span>
        );
      case "Buyer_Quantal":
        return (
          <span style={{ color: "#374151" }}>
            {FMT_NUM(row.Buyer_Quantal, 3)}
          </span>
        );
      case "Lifting_Quintal":
        return (
          <span style={{ color: "#0369a1", fontWeight: 500 }}>
            {FMT_NUM(row.Lifting_Quintal, 3)}
          </span>
        );
      case "DESPATCH":
        return (
          <span style={{ color: "#64748b" }}>
            {FMT_NUM(row.DESPATCH, 3)}
          </span>
        );
      case "BALANCE":
        return (
          <span style={{ fontWeight: 600, color: bal >= 0 ? "#15803d" : "#dc2626" }}>
            {FMT_NUM(row.BALANCE, 3)}
          </span>
        );
      case "Lifting_Date":
        return (
          <span style={{ color: "#374151" }}>
            {FMT_DATE(row.Lifting_Date)}
          </span>
        );
      case "Party_Bill_Rate":
        return (
          <span style={{ color: "#374151" }}>
            {FMT_NUM(row.Party_Bill_Rate)}
          </span>
        );
      case "Note":
        return (
          <span
            title={row.Note}
            style={{
              display: "block", overflow: "hidden",
              textOverflow: "ellipsis", whiteSpace: "nowrap",
              color: "#475569", maxWidth: 160,
            }}
          >
            {row.Note || "-"}
          </span>
        );
      case "Approved":
        return row.Approved === "Y" ? (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "2px 8px", borderRadius: 50, fontSize: 10,
            fontWeight: 600, background: "#f0fdf4", color: "#15803d",
          }}>
            <svg style={{ width: 10, height: 10 }} fill="none" stroke="#15803d" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            Approved
          </span>
        ) : (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "2px 8px", borderRadius: 50, fontSize: 10,
            fontWeight: 600, background: "#fff7ed", color: "#c2410c",
          }}>
            <svg style={{ width: 10, height: 10 }} fill="none" stroke="#c2410c" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Pending
          </span>
        );
      default:
        return "-";
    }
  };

  if (!open) return null;

  const selectedRow = selectedIdx !== null ? filtered[selectedIdx] : null;

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        background: "rgba(0,0,0,0.5)", padding: 16, overflowY: "auto",
        outline: "none",
      }}
    >
      <div style={{
        position: "relative", background: "white", borderRadius: 16,
        boxShadow: "0 20px 60px rgba(0,0,0,0.18)", display: "flex",
        flexDirection: "column", width: "100%", maxWidth: "98vw",
        maxHeight: "92vh", marginTop: 24,
      }}>

        {/* ── Header ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 18px", background: "#f8fafc",
          borderBottom: "1px solid #e2e8f0", borderRadius: "16px 16px 0 0",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: "#eff6ff", display: "flex",
              alignItems: "center", justifyContent: "center",
            }}>
              <svg style={{ width: 20, height: 20 }} fill="none" stroke="#1d4ed8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414A1 1 0 0121 11.414V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#1e293b" }}>
                Pending Delivery Orders
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                {loading
                  ? "Loading..."
                  : `${counts.total} record${counts.total !== 1 ? "s" : ""} · Click or ↑↓ to select · Enter to fill form · Esc to close`}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: 8,
              border: "1px solid #e2e8f0", background: "transparent",
              cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center",
            }}
          >
            <svg style={{ width: 16, height: 16 }} fill="none" stroke="#94a3b8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Toolbar ── */}
        <div style={{
          display: "flex", flexWrap: "wrap", alignItems: "center",
          gap: 8, padding: "10px 18px", background: "#f8fafc",
          borderBottom: "1px solid #e2e8f0", flexShrink: 0,
        }}>
          {[
            { label: "All", val: "all", count: counts.total, bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
            { label: "Pending", val: "N", count: counts.pending, bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
            { label: "Approved", val: "Y", count: counts.approved, bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
          ].map(({ label, val, count, bg, color, border }) => (
            <button
              key={val}
              onClick={() => setStatusFilter(val)}
              style={{
                padding: "4px 12px", borderRadius: 50, fontSize: 11,
                fontWeight: 500, cursor: "pointer",
                border: `1px solid ${statusFilter === val ? border : "#e2e8f0"}`,
                background: statusFilter === val ? bg : "transparent",
                color: statusFilter === val ? color : "#64748b",
                transition: "all 0.15s",
              }}
            >
              {label} ({count})
            </button>
          ))}

          <div style={{ flex: 1, position: "relative", minWidth: 220 }}>
            <svg style={{
              position: "absolute", left: 9, top: "50%",
              transform: "translateY(-50%)", width: 14, height: 14,
              pointerEvents: "none",
            }} fill="none" stroke="#94a3b8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tender, party, grade, mill, truck…"
              onKeyDown={(e) => {
                // let arrow keys and Enter pass through to the table nav handler
                // but stop the outer div from stealing focus-related events
                if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "Enter") {
                  e.stopPropagation();
                  // Enter from search: move focus back to container so arrow/Enter work
                  if (e.key === "Enter") {
                    e.preventDefault();
                    containerRef.current?.focus();
                  }
                }
              }}
              style={{
                width: "100%", padding: "6px 30px 6px 30px", fontSize: 12,
                border: "1px solid #e2e8f0", borderRadius: 8,
                background: "white", color: "#1e293b", outline: "none",
              }}
            />
            {search && (
              <button
                onClick={() => { setSearch(""); containerRef.current?.focus(); }}
                style={{
                  position: "absolute", right: 8, top: "50%",
                  transform: "translateY(-50%)", background: "none",
                  border: "none", cursor: "pointer",
                }}
              >
                <svg style={{ width: 14, height: 14 }} fill="none" stroke="#94a3b8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <span style={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap" }}>
            {filtered.length} / {data.length} rows
          </span>

          {/* keyboard hint */}
          <span style={{
            fontSize: 10, color: "#94a3b8", whiteSpace: "nowrap",
            background: "#f1f5f9", borderRadius: 6, padding: "3px 8px",
          }}>
            ↑↓ navigate &nbsp;·&nbsp; Enter select &nbsp;·&nbsp; Esc close
          </span>
        </div>

        {/* ── Table ── */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? (
            <div style={{
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              padding: "60px 0", gap: 12,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                border: "3px solid #dbeafe", borderTopColor: "#2563eb",
                animation: "spin 0.8s linear infinite",
              }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
              <span style={{ fontSize: 13, color: "#64748b" }}>Loading delivery orders…</span>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 1100 }}>
              <thead>
                <tr>
                  {COLS.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => toggleSort(col.key)}
                      style={{
                        position: "sticky", top: 0, zIndex: 5,
                        padding: "9px 10px", fontWeight: 600, fontSize: 11,
                        color: sortCol === col.key ? "#1d4ed8" : "#475569",
                        background: "#f1f5f9",
                        borderBottom: "1px solid #e2e8f0",
                        whiteSpace: "nowrap", cursor: "pointer",
                        userSelect: "none",
                        textAlign: col.align,
                      }}
                    >
                      {col.label}
                      <span style={{ marginLeft: 4, fontSize: 10, opacity: sortCol === col.key ? 1 : 0.3 }}>
                        {sortCol === col.key ? (sortAsc ? "↑" : "↓") : "↕"}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={COLS.length} style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
                      <svg style={{ width: 40, height: 40, margin: "0 auto 10px", display: "block" }}
                        fill="none" stroke="#cbd5e1" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div style={{ fontSize: 13 }}>No records found</div>
                      {search && <div style={{ fontSize: 11, marginTop: 4 }}>Try clearing the search filter</div>}
                    </td>
                  </tr>
                ) : filtered.map((row, idx) => {
                  const isSelected = idx === selectedIdx;
                  return (
                    <tr
                      key={`${row.tenderdetailid ?? ""}-${idx}`}
                      ref={(el) => { rowRefs.current[idx] = el; }}
                      onClick={() => setSelectedIdx(idx)}
                      onDoubleClick={() => confirmSelect(row)}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.background = "#f8fafc";
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.background = idx % 2 === 0 ? "white" : "#fafafa";
                      }}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        background: isSelected ? "#eff6ff" : idx % 2 === 0 ? "white" : "#fafafa",
                        cursor: "pointer", transition: "background 0.1s",
                        outline: isSelected ? "2px solid #3b82f6" : "none",
                        outlineOffset: -2,
                      }}
                    >
                      {COLS.map((col) => (
                        <td
                          key={col.key}
                          style={{
                            padding: "8px 10px",
                            whiteSpace: "nowrap",
                            textAlign: col.align,
                          }}
                        >
                          {cellContent(col, row)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 18px", background: "#f8fafc",
          borderTop: "1px solid #e2e8f0",
          borderRadius: "0 0 16px 16px", flexShrink: 0,
        }}>
          <span style={{ fontSize: 11, color: "#94a3b8" }}>
            <strong style={{ color: "#1d4ed8" }}>{filtered.length}</strong>{" "}
            record{filtered.length !== 1 ? "s" : ""} shown
            {selectedRow
              ? <span style={{ marginLeft: 8, color: "#1d4ed8", fontWeight: 600 }}>
                  · Selected: #{selectedRow.Tender_No} — {selectedRow.Party} &nbsp;|&nbsp;
                  Balance: {FMT_NUM(selectedRow.BALANCE, 3)} Qntl &nbsp;|&nbsp;
                  {FMT_DATE(selectedRow.Lifting_Date)}
                  <span style={{ marginLeft: 6, fontWeight: 400, color: "#60a5fa" }}>
                    — Press Enter or double-click to fill form
                  </span>
                </span>
              : <span style={{ marginLeft: 8 }}>· Click a row or use ↑↓ to select, Enter to fill</span>
            }
          </span>
          <button
            onClick={onClose}
            style={{
              padding: "5px 14px", fontSize: 12, fontWeight: 500,
              background: "transparent", color: "#475569",
              border: "1px solid #e2e8f0", borderRadius: 7, cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}

export default PendingDOSelectModal;
