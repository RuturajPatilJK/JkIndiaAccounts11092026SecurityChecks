import { useState, useEffect, useRef, useCallback } from "react";
import * as XLSX from "xlsx";
const API_BASE = process.env.REACT_APP_API;

const COMPANY_CODE = Number(sessionStorage.getItem("Company_Code"));
const YEAR_CODE = Number(sessionStorage.getItem("Year_Code"));
const PAGE_SIZE = 100;

function getExt(path) {
  return (path || "").split(".").pop().toLowerCase().split("?")[0];
}

/* ── Screen Loader ────────────────────────────────────────────────────── */
function ScreenLoader({ message = "Loading..." }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "rgba(255,255,255,0.75)",
        backdropFilter: "blur(3px)",
        WebkitBackdropFilter: "blur(3px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
          background: "#fff",
          borderRadius: 16,
          padding: "28px 36px",
          boxShadow: "0 8px 40px rgba(0,0,0,0.12)",
          border: "0.5px solid #E5E7EB",
          minWidth: 180,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: "3px solid #E5E7EB",
            borderTopColor: "#185FA5",
            animation: "tds-spin 0.7s linear infinite",
          }}
        />
        <p
          style={{
            margin: 0,
            fontSize: 13,
            fontWeight: 500,
            color: "#374151",
            letterSpacing: "-0.01em",
          }}
        >
          {message}
        </p>
        <style>{`
          @keyframes tds-spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}

/* ── Toast ────────────────────────────────────────────────────────────── */
function Toast({ msg, type, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  });
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 9999,
      padding: "10px 18px", borderRadius: 10, fontSize: 13, fontWeight: 500,
      background: type === "error" ? "#FCEBEB" : "#EAF3DE",
      color: type === "error" ? "#791F1F" : "#27500A",
      border: `0.5px solid ${type === "error" ? "#F09595" : "#97C459"}`,
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    }}>
      {msg}
    </div>
  );
}

/* ── Preview Modal ────────────────────────────────────────────────────── */
function PreviewModal({ url, filename, onClose }) {
  const ext = getExt(filename);
  const isImage = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(ext);
  const isPdf = ext === "pdf";
  const isDoc = ["doc", "docx"].includes(ext);

  useEffect(() => {
    const h = e => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)",
        zIndex: 10000, display: "flex", alignItems: "center",
        justifyContent: "center", padding: 16,
      }}
    >
      <div style={{
        background: "#fff", borderRadius: 14,
        boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
        width: "100%", maxWidth: 900,
        display: "flex", flexDirection: "column", height: "90vh",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 18px", borderBottom: "0.5px solid #E5E7EB", flexShrink: 0,
          background: "#F8FAFC", borderRadius: "14px 14px 0 0",
        }}>
          <span style={{
            fontSize: 13, fontWeight: 500, color: "#111", maxWidth: 500,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {filename}
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <a
              href={url} download={filename}
              style={{
                padding: "5px 12px", borderRadius: 7, fontSize: 12, fontWeight: 500,
                background: "#EFF6FF", color: "#1D4ED8", border: "0.5px solid #BFDBFE",
                textDecoration: "none", display: "flex", alignItems: "center", gap: 4,
              }}
            >
              <i className="ti ti-download" style={{ fontSize: 12 }} /> Download
            </a>
            <button
              onClick={onClose}
              style={{
                width: 28, height: 28, borderRadius: "50%", border: "0.5px solid #FECACA",
                background: "#FEF2F2", cursor: "pointer", color: "#DC2626",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              ✕
            </button>
          </div>
        </div>
        <div style={{ flex: 1, overflow: "hidden", borderRadius: "0 0 14px 14px" }}>
          {isPdf && (
            <iframe src={url} title={filename} style={{ width: "100%", height: "100%", border: "none" }} />
          )}
          {isImage && (
            <div style={{
              width: "100%", height: "100%", display: "flex",
              alignItems: "center", justifyContent: "center",
              background: "#F3F4F6", overflow: "auto",
            }}>
              <img src={url} alt={filename} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 8 }} />
            </div>
          )}
          {(isDoc || (!isPdf && !isImage)) && (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", height: "100%", gap: 14, color: "#6B7280",
            }}>
              <i className="ti ti-file" style={{ fontSize: 52, color: "#9CA3AF" }} />
              <p style={{ margin: 0, fontSize: 13 }}>
                {isDoc ? "Word files cannot be previewed. Please download." : "Preview not available."}
              </p>
              <a href={url} download={filename} style={{
                padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 500,
                background: "#185FA5", color: "#fff", textDecoration: "none",
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <i className="ti ti-download" style={{ fontSize: 14 }} /> Download
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Uploaded TDS Modal ───────────────────────────────────────────────── */
function UploadedModal({ parties, tdsMap, onClose }) {
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    const h = e => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  const uploadedParties = parties.filter(
    p => tdsMap[String(p.Ac_Code)]?.is_tds_uploaded
  );

  const panCount = {};
  uploadedParties.forEach(p => {
    const pan = (p.CompanyPan || "").trim().toUpperCase();
    if (!pan) return;
    panCount[pan] = (panCount[pan] || 0) + 1;
  });

  const deduped = (() => {
    const seenGst = new Set();
    return uploadedParties.filter(p => {
      const gst = (p.Gst_No || "").trim().toUpperCase();
      if (!gst) return true;
      if (seenGst.has(gst)) return false;
      seenGst.add(gst);
      return true;
    });
  })();

  const filtered = deduped.filter(p =>
    (p.Ac_Name_E || "").toLowerCase().includes(search.toLowerCase()) ||
    String(p.Ac_Code || "").includes(search) ||
    (p.cityname || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.Gst_No || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.CompanyPan || "").toLowerCase().includes(search.toLowerCase())
  );

  const thStyle = {
    padding: "10px 14px", textAlign: "left", fontSize: 10, fontWeight: 600,
    color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em",
    whiteSpace: "nowrap", background: "#F8FAFC", borderBottom: "0.5px solid #E5E7EB",
  };

  return (
    <>
      <div
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
          zIndex: 11000, display: "flex", alignItems: "center",
          justifyContent: "center", padding: 16,
        }}
      >
        <div style={{
          background: "#fff", borderRadius: 16,
          boxShadow: "0 24px 60px rgba(0,0,0,0.3)",
          width: "100%", maxWidth: 960,
          display: "flex", flexDirection: "column", maxHeight: "88vh",
        }}>
          {/* Header */}
          <div style={{
            padding: "16px 20px", borderBottom: "0.5px solid #E5E7EB",
            background: "#F0FDF4", borderRadius: "16px 16px 0 0",
            display: "flex", alignItems: "center",
            justifyContent: "space-between", gap: 12, flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10, background: "#DCFCE7",
                display: "flex", alignItems: "center", justifyContent: "center",
                border: "0.5px solid #86EFAC",
              }}>
                <i className="ti ti-file-check" style={{ fontSize: 18, color: "#16A34A" }} />
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: "#14532D" }}>
                  Uploaded TDS Declarations
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#16A34A" }}>
                  {deduped.length} unique record{deduped.length !== 1 ? "s" : ""}
                  {deduped.length !== uploadedParties.length && (
                    <span style={{ color: "#6B7280", fontWeight: 400 }}>
                      {" "}({uploadedParties.length - deduped.length} duplicate GST
                      {uploadedParties.length - deduped.length !== 1 ? "s" : ""} hidden)
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="text"
                placeholder="Search accounts..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  padding: "6px 10px", fontSize: 12, borderRadius: 8, outline: "none",
                  border: "0.5px solid #D1D5DB", background: "#fff",
                  color: "#111", width: 200, boxSizing: "border-box",
                }}
              />
              <button
                onClick={onClose}
                style={{
                  width: 30, height: 30, borderRadius: "50%",
                  border: "0.5px solid #FECACA", background: "#FEF2F2",
                  cursor: "pointer", color: "#DC2626",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Table */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 48, textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>
                {uploadedParties.length === 0
                  ? "No TDS declarations uploaded yet."
                  : "No accounts match your search."}
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                  <tr>
                    <th style={{ ...thStyle, width: 50 }}>#</th>
                    <th style={{ ...thStyle, width: 90 }}>A/c Code</th>
                    <th style={{ ...thStyle, width: 120 }}>Group</th>
                    <th style={thStyle}>Name / City</th>
                    <th style={{ ...thStyle, width: 140 }}>GST No</th>
                    <th style={{ ...thStyle, width: 115 }}>PAN</th>
                    <th style={{ ...thStyle, width: 95, textAlign: "center" }}>Duplicates</th>
                    <th style={{ ...thStyle, width: 100 }}>Below Limit</th>
                    <th style={{ ...thStyle, width: 100, textAlign: "center" }}>Certificate</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, idx) => {
                    const rec = tdsMap[String(p.Ac_Code)];
                    const fileName = rec?.TDS_file_path?.split("/").pop() || null;
                    const hasFile = !!rec?.TDS_file_path;
                    const pan = (p.CompanyPan || "").trim().toUpperCase();
                    const dupCount = pan ? (panCount[pan] || 1) : 1;

                    return (
                      <tr
                        key={p.Ac_Code}
                        style={{
                          borderBottom: "0.5px solid #F3F4F6",
                          background: idx % 2 === 0 ? "#fff" : "#FAFAFA",
                        }}
                      >
                        <td style={{ padding: "9px 14px", fontSize: 12, color: "#9CA3AF" }}>
                          {idx + 1}
                        </td>
                        <td style={{ padding: "9px 14px", fontSize: 12, color: "#6B7280", fontFamily: "monospace", whiteSpace: "nowrap" }}>
                          {p.Ac_Code}
                        </td>
                        <td style={{ padding: "9px 14px", fontSize: 11, color: "#374151", whiteSpace: "nowrap" }}>
                          {p.group_Name_E || "—"}
                        </td>
                        <td style={{ padding: "9px 14px", textAlign: "left" }}>
                          <div style={{ fontSize: 12, fontWeight: 500, color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }} title={p.Ac_Name_E}>
                            {p.Ac_Name_E}
                          </div>
                          {p.cityname && (
                            <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 1 }}>{p.cityname}</div>
                          )}
                        </td>
                        <td style={{ padding: "9px 14px", fontSize: 11, color: "#6B7280", whiteSpace: "nowrap" }}>
                          {p.Gst_No || "—"}
                        </td>
                        <td style={{ padding: "9px 14px", fontSize: 11, color: "#6B7280", whiteSpace: "nowrap" }}>
                          {p.CompanyPan || "—"}
                        </td>
                 
                        {/* Duplicates */}
                        <td style={{ padding: "9px 14px", textAlign: "center" }}>
                          {dupCount > 1 ? (
                            <span style={{
                              display: "inline-flex", alignItems: "center",
                              padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                              background: "#FFF7ED", color: "#C2410C", border: "0.5px solid #FED7AA",
                            }}>
                              {dupCount} accounts
                            </span>
                          ) : (
                            <span style={{ fontSize: 11, color: "#9CA3AF" }}>—</span>
                          )}
                        </td>
                        {/* Below Limit */}
                        <td style={{ padding: "9px 14px" }}>
                          <span style={{
                            display: "inline-flex", alignItems: "center",
                            padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 500,
                            background: rec?.belowLimit === "Y" ? "#F0FDF4" : "#FEF2F2",
                            color: rec?.belowLimit === "Y" ? "#16A34A" : "#DC2626",
                            border: `0.5px solid ${rec?.belowLimit === "Y" ? "#86EFAC" : "#FECACA"}`,
                          }}>
                            {rec?.belowLimit === "Y" ? "Yes" : "No"}
                          </span>
                        </td>
                        {/* Certificate */}
                        <td style={{ padding: "9px 14px", textAlign: "center" }}>
                          {hasFile ? (
                            <button
                              type="button"
                              onClick={() => setPreview({
                                url: `${API_BASE}/preview-tds-document/${rec.TDS_declaration_id}`,
                                filename: fileName || "document",
                              })}
                              style={{
                                padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 500,
                                cursor: "pointer", border: "0.5px solid #BFDBFE",
                                background: "#EFF6FF", color: "#1D4ED8",
                                display: "inline-flex", alignItems: "center", gap: 4,
                              }}
                            >
                              <i className="ti ti-eye" style={{ fontSize: 11 }} /> View
                            </button>
                          ) : (
                            <span style={{ fontSize: 11, color: "#9CA3AF" }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: "12px 20px", borderTop: "0.5px solid #E5E7EB",
            background: "#F8FAFC", borderRadius: "0 0 16px 16px",
            display: "flex", alignItems: "center",
            justifyContent: "space-between", flexShrink: 0,
          }}>
            <span style={{ fontSize: 12, color: "#6B7280" }}>
              Showing {filtered.length} of {deduped.length} unique records
              {deduped.length !== uploadedParties.length && (
                <span style={{ marginLeft: 4, color: "#9CA3AF" }}>
                  · {uploadedParties.length - deduped.length} duplicate GST
                  {uploadedParties.length - deduped.length !== 1 ? "s" : ""} merged
                </span>
              )}
            </span>
            <button
              onClick={onClose}
              style={{
                padding: "6px 18px", borderRadius: 8, fontSize: 12, fontWeight: 500,
                border: "0.5px solid #D1D5DB", background: "#fff", color: "#374151", cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </div>

        {preview && (
          <PreviewModal
            url={preview.url}
            filename={preview.filename}
            onClose={() => setPreview(null)}
          />
        )}
      </div>
    </>
  );
}

/* ── Toggle ───────────────────────────────────────────────────────────── */
function Toggle({ value, onChange, disabled = false }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!value)}
      disabled={disabled}
      style={{
        width: 36, height: 20, borderRadius: 10, border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        position: "relative", flexShrink: 0,
        background: value ? "#1D9E75" : "#D1D5DB",
        transition: "background 0.2s",
        opacity: disabled ? 0.8 : 1,
      }}
    >
      <span style={{
        position: "absolute", top: 2, width: 16, height: 16,
        borderRadius: "50%", background: "#fff",
        left: value ? 18 : 2, transition: "left 0.2s",
      }} />
    </button>
  );
}

const inp = {
  padding: "5px 8px", fontSize: 12, borderRadius: 7, outline: "none", width: "100%",
  border: "0.5px solid var(--color-border-secondary,#D1D5DB)",
  background: "var(--color-background-secondary,#F9FAFB)",
  color: "var(--color-text-primary,#111)", boxSizing: "border-box",
};

/* ── GST Duplicate Modal ──────────────────────────────────────────────── */
function GstDuplicateModal({ gstNo, duplicates, onConfirm, onSkip, onClose }) {
  const [selected, setSelected] = useState(
    () => new Set(duplicates.map(d => d.accoid))
  );

  const toggle = (accoid) =>
    setSelected(prev => {
      const next = new Set(prev);
      next.has(accoid) ? next.delete(accoid) : next.add(accoid);
      return next;
    });

  const toggleAll = () =>
    setSelected(prev =>
      prev.size === duplicates.length
        ? new Set()
        : new Set(duplicates.map(d => d.accoid))
    );

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
      zIndex: 11000, display: "flex", alignItems: "center",
      justifyContent: "center", padding: 16,
    }}>
      <div style={{
        background: "#fff", borderRadius: 14,
        boxShadow: "0 24px 60px rgba(0,0,0,0.3)",
        width: "100%", maxWidth: 560,
        display: "flex", flexDirection: "column", maxHeight: "85vh",
      }}>
        <div style={{
          padding: "16px 20px", borderBottom: "0.5px solid #E5E7EB",
          background: "#FFF7ED", borderRadius: "14px 14px 0 0",
          display: "flex", alignItems: "flex-start",
          justifyContent: "space-between", gap: 12,
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <i className="ti ti-alert-triangle" style={{ fontSize: 20, color: "#D97706", marginTop: 1 }} />
            <div style={{ textAlign: "left" }}>
              <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: "#92400E" }}>
                Same PAN Found
              </p>
              <p style={{ margin: "3px 0 0", fontSize: 12, color: "#B45309", lineHeight: 1.5 }}>
                PAN: <strong>{gstNo}</strong> — {duplicates.length} other{" "}
                account{duplicates.length > 1 ? "s" : ""} share this PAN.
                Select which accounts should also receive this certificate.
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} style={{
            width: 28, height: 28, borderRadius: "50%", border: "0.5px solid #FECACA",
            background: "#FEF2F2", cursor: "pointer", color: "#DC2626",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            ✕
          </button>
        </div>

        <div style={{ overflowY: "auto", flex: 1 }}>
          <div onClick={toggleAll} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 20px", borderBottom: "0.5px solid #E5E7EB",
            background: "#F8FAFC", cursor: "pointer",
          }}>
            <input type="checkbox" readOnly checked={selected.size === duplicates.length}
              style={{ cursor: "pointer", width: 14, height: 14 }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Select All ({duplicates.length})
            </span>
          </div>

          {duplicates.map(d => (
            <div key={d.accoid} onClick={() => toggle(d.accoid)} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 20px", borderBottom: "0.5px solid #F3F4F6",
              cursor: "pointer",
              background: selected.has(d.accoid) ? "#EFF6FF" : "#fff",
              transition: "background 0.15s",
            }}>
              <input type="checkbox" readOnly checked={selected.has(d.accoid)}
                style={{ cursor: "pointer", width: 14, height: 14, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "left" }}>
                  {d.Ac_Name_E}
                </div>
                <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 1, textAlign: "left" }}>
                  {d.Ac_Code} {d.cityname ? `· ${d.cityname}` : ""}
                </div>
              </div>
              {d.has_file ? (
                <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 20, background: "#FEF3C7", color: "#B45309", border: "0.5px solid #FCD34D", whiteSpace: "nowrap", flexShrink: 0 }}>
                  Has file
                </span>
              ) : (
                <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 20, background: "#F3F4F6", color: "#9CA3AF", border: "0.5px solid #E5E7EB", whiteSpace: "nowrap", flexShrink: 0 }}>
                  No file
                </span>
              )}
            </div>
          ))}
        </div>

        <div style={{
          padding: "14px 20px", borderTop: "0.5px solid #E5E7EB",
          display: "flex", justifyContent: "flex-end", gap: 8,
          background: "#F8FAFC", borderRadius: "0 0 14px 14px",
        }}>
          <button type="button" onClick={onSkip} style={{
            padding: "7px 16px", borderRadius: 8, fontSize: 12, fontWeight: 500,
            border: "0.5px solid #D1D5DB", background: "#fff", color: "#374151", cursor: "pointer",
          }}>
            This Account Only
          </button>
          <button
            type="button"
            disabled={selected.size === 0}
            onClick={() => onConfirm(duplicates.filter(d => selected.has(d.accoid)))}
            style={{
              padding: "7px 16px", borderRadius: 8, fontSize: 12, fontWeight: 500, border: "none",
              background: selected.size === 0 ? "#E5E7EB" : "#185FA5",
              color: selected.size === 0 ? "#9CA3AF" : "#fff",
              cursor: selected.size === 0 ? "not-allowed" : "pointer",
            }}
          >
            Apply to {selected.size} Account{selected.size !== 1 ? "s" : ""}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Row ──────────────────────────────────────────────────────────────── */
function Row({ party, rec, onSaved }) {
  const fileInputRef = useRef();
  const selectedFile = useRef(null);
  const [checkingGst, setCheckingGst] = useState(false);

  const [form, setForm] = useState({
    belowLimit: rec?.belowLimit || "Y",
    is_tds_uploaded: rec?.is_tds_uploaded || false,
  });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [preview, setPreview] = useState(null);
  const [removeFile, setRemoveFile] = useState(false);
  const [gstDuplicates, setGstDuplicates] = useState([]);
  const [showGstModal, setShowGstModal] = useState(false);
  const [selectedDuplicates, setSelectedDuplicates] = useState([]);

  const recId = rec?.TDS_declaration_id;

  useEffect(() => {
    setForm({
      belowLimit: rec?.belowLimit || "Y",
      is_tds_uploaded: rec?.is_tds_uploaded || false,
    });
    setDirty(false);
    setFile(null);
    selectedFile.current = null;
    setRemoveFile(false);
    setSelectedDuplicates([]);
  }, [recId]);

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setDirty(true);
  };

  const save = async (duplicatesOverride) => {
    setSaving(true);
    const fd = new FormData();
    fd.append("Ac_code", party.Ac_Code);
    fd.append("accoid", party.accoid);
    fd.append("Company_code", COMPANY_CODE);
    fd.append("Year_code", YEAR_CODE);
    fd.append("PANNO", party.CompanyPan);
    fd.append("belowLimit", form.belowLimit);
    fd.append("is_tds_uploaded", form.is_tds_uploaded);
    fd.append("Ac_Name_E", party.Ac_Name_E || "");
    fd.append("Gst_No", party.Gst_No || "");
    fd.append("remove_file", removeFile);

    const dupes = duplicatesOverride ?? selectedDuplicates;
    const additionalPayload = dupes.map(d => ({ accoid: d.accoid, Ac_Code: d.Ac_Code }));
    fd.append("additional_accoids", JSON.stringify(additionalPayload));

    if (selectedFile.current) fd.append("file", selectedFile.current);

    try {
      const url = rec
        ? `${API_BASE}/update-tds-declaration/${rec.TDS_declaration_id}`
        : `${API_BASE}/create-tds-declaration`;
      const method = rec ? "PUT" : "POST";
      const r = await fetch(url, { method, body: fd });
      const d = await r.json();

      if (d.success) {
        setDirty(false);
        setFile(null);
        selectedFile.current = null;
        setRemoveFile(false);
        setSelectedDuplicates([]);

        if (d.deleted) {
          onSaved("GST linked records deleted successfully", "success", null, false, d.deleted_ids || []);
        } else {
          onSaved("Saved successfully", "success", d.data, !!rec, null, d.additional_data || []);
        }
      } else {
        onSaved(d.error || "Save failed", "error", null, !!rec);
      }
    } catch {
      onSaved("Network error", "error", null, !!rec);
    }
    setSaving(false);
  };

  const openPreview = () => {
    if (selectedFile.current) {
      setPreview({ url: URL.createObjectURL(selectedFile.current), filename: selectedFile.current.name });
    } else if (rec?.TDS_declaration_id) {
      setPreview({
        url: `${API_BASE}/preview-tds-document/${rec.TDS_declaration_id}`,
        filename: rec.TDS_file_path?.split("/").pop() || "document",
      });
    }
  };

  const hasDbFile = !!rec?.TDS_file_path && !removeFile;
  const hasFile = !!file || hasDbFile;
  const fileName = file
    ? file.name
    : hasDbFile
      ? rec.TDS_file_path.split("/").pop()
      : null;

  const checkPanDuplicates = async () => {
    if (!party.CompanyPan) return false;
    try {
      setCheckingGst(true);
      const url = `${API_BASE}/check-pan-duplicates?company_code=${COMPANY_CODE}&year_code=${YEAR_CODE}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.success && Array.isArray(data.duplicates)) {
        const matchedGroup = data.duplicates.find(
          g =>
            String(g.pan_no || "").trim().toUpperCase() ===
            String(party.CompanyPan || "").trim().toUpperCase()
        );
        if (matchedGroup) {
          const others = matchedGroup.parties.filter(
            p => Number(p.accoid) !== Number(party.accoid)
          );
          if (others.length > 0) {
            setGstDuplicates(others);
            setTimeout(() => {
              setShowGstModal(true);
              setCheckingGst(false);
            }, 500);
            return true;
          }
        }
      }
      setGstDuplicates([]);
      setSelectedDuplicates([]);
      return false;
    } catch (err) {
      console.error("[PAN CHECK ERROR]", err);
      return false;
    } finally {
      setTimeout(() => { setCheckingGst(false); }, 300);
    }
  };

  const loaderMessage = checkingGst ? "Checking PAN duplicates…" : saving ? "Saving…" : null;

  return (
    <>
      {loaderMessage && <ScreenLoader message={loaderMessage} />}

      <tr style={{ borderBottom: "0.5px solid var(--color-border-tertiary,#E5E7EB)" }}>

        {/* A/c Code */}
        <td style={{ padding: "8px 10px", fontSize: 12, color: "#6B7280", fontFamily: "monospace", whiteSpace: "nowrap" }}>
          {party.Ac_Code}
        </td>

        {/* Group */}
        <td style={{ padding: "8px 10px", fontSize: 11, color: "#374151", whiteSpace: "nowrap", textAlign: "left" }}>
          {party.group_Name_E || "—"}
        </td>

        {/* Name / City */}
        <td style={{ textAlign: "left", padding: "8px 10px", fontSize: 12, fontWeight: 500, color: "var(--color-text-primary,#111)", maxWidth: 220 }}>
          <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={party.Ac_Name_E}>
            {party.Ac_Name_E}
          </div>
          {party.cityname && (
            <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 1 }}>{party.cityname}</div>
          )}
        </td>

        {/* GST No */}
        <td style={{ padding: "8px 10px", fontSize: 11, color: "#6B7280", whiteSpace: "nowrap" }}>
          {party.Gst_No || "—"}
        </td>

        {/* PAN */}
        <td style={{ padding: "8px 10px", fontSize: 11, color: "#6B7280", whiteSpace: "nowrap" }}>
          {party.CompanyPan || "—"}
        </td>

        {/* Taxable Amt — from SP via partyData */}
        <td style={{ padding: "8px 10px", fontSize: 11, color: "#374151", whiteSpace: "nowrap", textAlign: "right" }}>
          {party.Taxable != null
            ? Number(party.Taxable).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : "—"}
        </td>

        {/* TDS Amt — from SP via partyData */}
        <td style={{ padding: "8px 10px", fontSize: 11, color: "#374151", whiteSpace: "nowrap", textAlign: "right" }}>
          {party.TDSAmt != null
            ? Number(party.TDSAmt).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : "—"}
        </td>

        {/* Below Limit */}
        <td style={{ padding: "6px 10px", minWidth: 100 }}>
          <select
            value={form.belowLimit}
            onChange={e => set("belowLimit", e.target.value)}
            style={{ ...inp, cursor: "pointer" }}
          >
            <option value="Y">Yes</option>
            <option value="N">No</option>
          </select>
        </td>

        {/* TDS Uploaded toggle */}
        <td style={{ padding: "8px 10px", textAlign: "center" }}>
          <Toggle value={form.is_tds_uploaded} onChange={v => set("is_tds_uploaded", v)} disabled={true} />
        </td>

        {/* Certificate / file upload */}
        <td style={{ padding: "6px 10px", minWidth: 220 }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            style={{ display: "none" }}
            onChange={async e => {
              const picked = e.target.files[0];
              if (!picked) return;
              selectedFile.current = picked;
              setFile(picked);
              setRemoveFile(false);
              setForm(f => ({ ...f, is_tds_uploaded: true }));
              setDirty(true);
              await checkPanDuplicates();
            }}
          />

          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "nowrap" }}>
            {/* Upload */}
            <button
              type="button"
              disabled={checkingGst || saving}
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: "4px 8px", borderRadius: 6, fontSize: 11,
                cursor: (checkingGst || saving) ? "not-allowed" : "pointer",
                border: "0.5px solid #D1D5DB", background: "#F9FAFB", color: "#374151",
                display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap",
              }}
            >
              <i className="ti ti-upload" style={{ fontSize: 11 }} />
              Upload
            </button>

            {/* File name */}
            {fileName && (
              <span
                title={fileName}
                style={{
                  fontSize: 10, color: "#6B7280", maxWidth: 70,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}
              >
                {fileName}
              </span>
            )}

            {/* View */}
            {hasFile && (
              <button
                type="button"
                onClick={openPreview}
                style={{
                  padding: "4px 8px", borderRadius: 6, fontSize: 11, cursor: "pointer",
                  border: "0.5px solid #BFDBFE", background: "#EFF6FF", color: "#1D4ED8",
                  display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap",
                }}
              >
                <i className="ti ti-eye" style={{ fontSize: 11 }} />
                View
              </button>
            )}

            {/* Remove */}
            {(hasDbFile || file) && (
              <button
                type="button"
                onClick={() => {
                  if (file) { setFile(null); selectedFile.current = null; }
                  if (hasDbFile) setRemoveFile(true);
                  setForm(f => ({ ...f, is_tds_uploaded: false }));
                  setDirty(true);
                }}
                style={{
                  padding: "4px 8px", borderRadius: 6, fontSize: 11, cursor: "pointer",
                  border: "0.5px solid #FECACA", background: "#FEF2F2", color: "#DC2626",
                  display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap",
                }}
              >
                <i className="ti ti-trash" style={{ fontSize: 11 }} />
                Remove
              </button>
            )}
          </div>
        </td>

        {/* Save / Update */}
        <td style={{ padding: "6px 10px", textAlign: "center" }}>
          <button
            type="button"
            onClick={() => save()}
            disabled={saving || !dirty || checkingGst}
            style={{
              padding: "5px 12px", borderRadius: 7, fontSize: 12, fontWeight: 500,
              cursor: saving || !dirty || checkingGst ? "not-allowed" : "pointer",
              border: "none",
              background: saving || !dirty || checkingGst ? "#E5E7EB" : "#185FA5",
              color: saving || !dirty || checkingGst ? "#9CA3AF" : "#fff",
              whiteSpace: "nowrap", display: "flex", alignItems: "center",
              justifyContent: "center", gap: 5, minWidth: 90,
            }}
          >
            {rec ? "Update" : "Save"}
          </button>
        </td>
      </tr>

      {preview && (
        <PreviewModal
          url={preview.url}
          filename={preview.filename}
          onClose={() => setPreview(null)}
        />
      )}

      {showGstModal && (
        <GstDuplicateModal
          gstNo={party.CompanyPan}
          duplicates={gstDuplicates}
          onConfirm={(chosen) => {
            setSelectedDuplicates(chosen);
            setShowGstModal(false);
            save(chosen);
          }}
          onSkip={() => {
            setSelectedDuplicates([]);
            setShowGstModal(false);
            save([]);
          }}
          onClose={() => {
            setSelectedDuplicates([]);
            setGstDuplicates([]);
            setShowGstModal(false);
            setFile(null);
            selectedFile.current = null;
            setForm(f => ({ ...f, is_tds_uploaded: false }));
            setDirty(false);
          }}
        />
      )}
    </>
  );
}

/* ── GroupTable ───────────────────────────────────────────────────────── */
function GroupTable({ label, parties, tdsMap, onSaved }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showUploaded, setShowUploaded] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleSearch = e => { setSearch(e.target.value); setPage(1); };

  const handleExport = async () => {
    setExporting(true);
    try {
      const seenGst = new Set();
      const rows = parties
        .filter(p => tdsMap[String(p.Ac_Code)]?.is_tds_uploaded)
        .filter(p => {
          const gst = (p.Gst_No || "").trim().toUpperCase();
          if (!gst) return true;
          if (seenGst.has(gst)) return false;
          seenGst.add(gst);
          return true;
        });

      const wsData = [
        ["#", "A/c Code", "Group Name", "Account Name", "City", "GST No", "PAN", "Taxable Amt", "TDS Amt", "Below Limit", "TDS Uploaded"],
        ...rows.map((p, i) => {
          const rec = tdsMap[String(p.Ac_Code)];
          return [
            i + 1,
            p.Ac_Code,
            p.group_Name_E || "",
            p.Ac_Name_E || "",
            p.cityname || "",
            p.Gst_No || "",
            p.CompanyPan || "",
            p.Taxable != null ? Number(p.Taxable) : "",
            p.TDSAmt != null ? Number(p.TDSAmt) : "",
            rec?.belowLimit === "Y" ? "Yes" : rec?.belowLimit === "N" ? "No" : "",
            rec?.is_tds_uploaded ? "Yes" : "No",
          ];
        }),
      ];

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      ws["!cols"] = [
        { wch: 5 }, { wch: 10 }, { wch: 20 }, { wch: 30 },
        { wch: 16 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 14 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "TDS Declarations");
      XLSX.writeFile(wb, "TDS_Declarations.xlsx");
    } catch (err) {
      console.error("[EXPORT ERROR]", err);
    } finally {
      setExporting(false);
    }
  };

const filtered = parties.filter(
    p =>
      (p.Ac_Name_E || "").toLowerCase().includes(search.toLowerCase()) ||
      String(p.Ac_Code || "").includes(search) ||
      (p.cityname || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.CompanyPan || "").toLowerCase().includes(search.toLowerCase())  // ← add this
  );

  const visible = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = visible.length < filtered.length;

  const uploadedCount = parties.filter(
    p => tdsMap[String(p.Ac_Code)]?.is_tds_uploaded
  ).length;

  const thStyle = {
    padding: "10px 12px", textAlign: "left", fontSize: 10, fontWeight: 600,
    color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em",
    whiteSpace: "nowrap", verticalAlign: "middle",
  };

  return (
    <>
      {exporting && <ScreenLoader message="Exporting to Excel…" />}

      <div style={{ marginBottom: 28 }}>
        {/* Toolbar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 12, gap: 12, flexWrap: "wrap",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {label && (
              <span style={{
                padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                background: "#E6F1FB", color: "#0C447C",
              }}>
                {label}
              </span>
            )}
            <span style={{ fontSize: 12, color: "#6B7280" }}>{parties.length} accounts</span>

            <button
              type="button"
              onClick={() => uploadedCount > 0 && setShowUploaded(true)}
              title={uploadedCount > 0 ? "Click to view uploaded declarations" : "No uploads yet"}
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 500,
                border: uploadedCount > 0 ? "0.5px solid #86EFAC" : "0.5px solid #E5E7EB",
                background: uploadedCount > 0 ? "#F0FDF4" : "#F9FAFB",
                color: uploadedCount > 0 ? "#16A34A" : "#9CA3AF",
                cursor: uploadedCount > 0 ? "pointer" : "default",
                transition: "all 0.15s",
              }}
            >
              <i className="ti ti-file-check" style={{ fontSize: 12 }} />
              {uploadedCount} uploaded
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="text"
              placeholder="Filter accounts..."
              value={search}
              onChange={handleSearch}
              style={{ ...inp, width: 200, fontSize: 12, height: 34 }}
            />
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting || parties.length === 0}
              title="Export to Excel (unique GST only)"
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "0 12px", height: 34, borderRadius: 8, fontSize: 12, fontWeight: 500,
                border: "0.5px solid #86EFAC",
                background: exporting || parties.length === 0 ? "#F3F4F6" : "#DCFCE7",
                color: exporting || parties.length === 0 ? "#9CA3AF" : "#15803D",
                cursor: exporting || parties.length === 0 ? "not-allowed" : "pointer",
                whiteSpace: "nowrap", transition: "all 0.15s", flexShrink: 0,
              }}
            >
              <i className="ti ti-file-spreadsheet" style={{ fontSize: 13 }} /> Export Excel
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ border: "0.5px solid #E5E7EB", borderRadius: 12, overflow: "hidden", background: "#fff" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "0.5px solid #E5E7EB" }}>
                  <th style={{ ...thStyle, width: 80 }}>A/c Code</th>
                  <th style={{ ...thStyle, width: 120 }}>Group Name</th>
                  <th style={{ ...thStyle, width: 200 }}>Account Name</th>
                  <th style={{ ...thStyle, width: 120 }}>GST No</th>
                  <th style={{ ...thStyle, width: 120 }}>PAN</th>
                  <th style={{ ...thStyle, width: 110, textAlign: "right" }}>Taxable Amt</th>
                  <th style={{ ...thStyle, width: 110, textAlign: "right" }}>TDS Amt</th>
                  <th style={{ ...thStyle, width: 100 }}>Below Limit</th>
                  <th style={{ ...thStyle, width: 90, textAlign: "center" }}>TDS Uploaded</th>
                  <th style={{ ...thStyle, width: 200 }}>Certificate</th>
                  <th style={{ ...thStyle, width: 100 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={11} style={{ padding: 28, textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>
                      {parties.length === 0 ? "No accounts in this group." : "No accounts match your search."}
                    </td>
                  </tr>
                ) : (
                  visible.map(p => (
                    <Row
                      key={p.accoid}
                      party={p}
                      rec={tdsMap[String(p.Ac_Code)] || null}
                      onSaved={onSaved}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {hasMore && (
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
            <button
              type="button"
              onClick={() => setPage(p => p + 1)}
              style={{
                padding: "8px 22px", borderRadius: 8, fontSize: 12, fontWeight: 500,
                cursor: "pointer", border: "0.5px solid #D1D5DB", background: "#fff", color: "#374151",
              }}
            >
              Load More ({filtered.length - visible.length} remaining)
            </button>
          </div>
        )}
      </div>

      {showUploaded && (
        <UploadedModal
          parties={parties}
          tdsMap={tdsMap}
          onClose={() => setShowUploaded(false)}
        />
      )}
    </>
  );
}

/* ── Main Page ────────────────────────────────────────────────────────── */
export default function TDSDeclaration() {
  const [partyData, setPartyData] = useState([]);
  const [tdsData, setTdsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const notify = (msg, type = "success") => setToast({ msg, type });

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const url = `${API_BASE}/getall-tds-declarations?company_code=${COMPANY_CODE}&year_code=${YEAR_CODE}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.success) {
          setPartyData(data.partyData || []);
          setTdsData(data.tdsDeclarationData || []);
        } else {
          notify("Failed to load", "error");
        }
      } catch (e) {
        console.error("[TDS]", e);
        notify("Network error", "error");
      }
      setLoading(false);
    })();
  }, []);

  const onSaved = useCallback((msg, type, savedRecord, isUpdate, deletedId, additionalData = []) => {
    notify(msg, type);

    if (Array.isArray(deletedId) && deletedId.length > 0) {
      setTdsData(prev => prev.filter(r => !deletedId.includes(r.TDS_declaration_id)));
      return;
    }
    if (!savedRecord) return;

    setTdsData(prev => {
      let next = isUpdate
        ? prev.map(r => r.TDS_declaration_id === savedRecord.TDS_declaration_id ? savedRecord : r)
        : [...prev, savedRecord];

      for (const addRec of additionalData) {
        const exists = next.some(r => r.TDS_declaration_id === addRec.TDS_declaration_id);
        next = exists
          ? next.map(r => r.TDS_declaration_id === addRec.TDS_declaration_id ? addRec : r)
          : [...next, addRec];
      }

      return next;
    });
  }, []);

  // Build tdsMap keyed by Ac_code (lowercase c) — matches backend serialization
  const tdsMap = {};
  tdsData.forEach(r => {
    tdsMap[String(r.Ac_code)] = r;
  });

  return (
    <div style={{
      padding: "24px 20px", boxSizing: "border-box",
      fontFamily: "var(--font-sans,system-ui)", width: "100%",
    }}>
      {loading && <ScreenLoader message="Loading TDS Declarations…" />}

      <div style={{
        marginBottom: 20,
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr",
        alignItems: "center",
        gap: 12,
      }}>
        <div />
        <h1 style={{
          margin: 0, textAlign: "center", fontSize: 22, fontWeight: 500,
          color: "var(--color-text-primary,#111)", letterSpacing: "-0.01em",
        }}>
          TDS Declarations
        </h1>
        <div />
      </div>

      {!loading && (
        <GroupTable
          label="All Accounts"
          parties={partyData}
          tdsMap={tdsMap}
          onSaved={onSaved}
        />
      )}

      {toast && (
        <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />
      )}
    </div>
  );
}