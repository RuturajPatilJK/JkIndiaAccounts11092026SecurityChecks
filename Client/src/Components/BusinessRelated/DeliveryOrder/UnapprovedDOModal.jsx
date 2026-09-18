import React, { useState, useEffect, useRef } from "react";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";

function UnapprovedDOModal({ open, onClose, onConfirm, submitting }) {
  const [text, setText] = useState("");
  const textareaRef = useRef(null);

  useEffect(() => {
    if (open) {
      setText("");
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  const handleUnapprove = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onConfirm(trimmed);
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.5)", padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: "relative", background: "white", borderRadius: 16,
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)", display: "flex",
          flexDirection: "column", width: "100%", maxWidth: 480,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 18px", background: "#fef2f2",
          borderBottom: "1px solid #fecaca", borderRadius: "16px 16px 0 0",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9,
              background: "#fee2e2", display: "flex",
              alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <ReportProblemIcon style={{ fontSize: 18, color: "#dc2626" }} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#991b1b" }}>
              Unapproved Delivery Order
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none", fontSize: 20, lineHeight: 1,
              color: "#991b1b", cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: 18 }}>
          {/* <label style={{ fontSize: 13, fontWeight: 500, color: "#334155", marginBottom: 6, display: "block" }}>
            Reason for marking this DO unapproved
          </label> */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder=""
            style={{
              width: "100%", border: "1px solid #cbd5e1", borderRadius: 8,
              padding: "8px 10px", fontSize: 13, resize: "vertical",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{
          display: "flex", justifyContent: "flex-end", gap: 10,
          padding: "12px 18px", borderTop: "1px solid #e2e8f0",
        }}>
          <button
            onClick={onClose}
            style={{
              padding: "7px 16px", borderRadius: 8, border: "1px solid #cbd5e1",
              background: "white", color: "#334155", fontSize: 13, fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleUnapprove}
            disabled={!text.trim() || submitting}
            style={{
              padding: "7px 16px", borderRadius: 8, border: "none",
              background: !text.trim() || submitting ? "#fca5a5" : "#dc2626",
              color: "white", fontSize: 13, fontWeight: 600,
              cursor: !text.trim() || submitting ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? "Saving..." : "Unapproved"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default UnapprovedDOModal;
