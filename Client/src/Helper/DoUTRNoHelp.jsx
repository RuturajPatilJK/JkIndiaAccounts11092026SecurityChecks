// DoUtrNoHelp.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Button, Modal } from "react-bootstrap";
import DataTableSearch from "../Common/HelpCommon/DataTableSearch";
import DataTablePagination from "../Common/HelpCommon/DataTablePagination";

let lActiveInputField = "";

const API_URL = process.env.REACT_APP_API;

const DoUtrNoHelp = ({
  name,                  // id of the input (for F1 targeting)
  tabIndexHelp,          // tab index for the input
  disabledField,         // disable input and button
  firstInputRef,         // optional ref for focusing
  companyCode,           // required: Company_Code query param
  bankCode,              // required: Bank_Code query param
  defaultUtrNo = "",     // optional prefill UTR no
  onUtrSelect,           // callback(selectedRow)
}) => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRowIndex, setSelectedRowIndex] = useState(-1);
  const itemsPerPage = 10;

  // controlled input + display summary
  const [enteredUtrNo, setEnteredUtrNo] = useState(defaultUtrNo || "");
  const [summaryText, setSummaryText] = useState("");

  // data state
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // open modal + fetch fresh
  const open = async () => {
    if (!companyCode || !bankCode) {
      setErr("Missing Company_Code or Bank_Code");
      setShowModal(true);
      return;
    }
    setErr("");
    setLoading(true);
    try {
      const resp = await fetch(
        `${API_URL}/DoUTRNoHelp?Company_Code=${encodeURIComponent(
          companyCode
        )}&Bank_Code=${encodeURIComponent(bankCode)}`
      );
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }
      const data = await resp.json();
      setRows(Array.isArray(data) ? data : []);
      // seed search with whatever user typed in the input
      setSearchTerm(enteredUtrNo || "");
      setCurrentPage(1);
      setSelectedRowIndex(data?.length ? 0 : -1);
      setShowModal(true);
    } catch (e) {
      setErr(`Failed to fetch UTRs: ${e.message}`);
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  const close = () => setShowModal(false);

  // F1 global handler
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "F1" && e.target.id === name) {
        lActiveInputField = name;
        setSearchTerm(e.target.value || "");
        open();
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [name, companyCode, bankCode, enteredUtrNo]);

  // Modal arrow up/down + enter
  useEffect(() => {
    const onNavigate = (e) => {
      if (!showModal) return;
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedRowIndex((p) => Math.max(p - 1, 0));
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedRowIndex((p) => Math.min(p + 1, itemsToDisplay.length - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (selectedRowIndex >= 0) {
          handlePick(itemsToDisplay[selectedRowIndex]);
        }
      }
    };
    window.addEventListener("keydown", onNavigate);
    return () => window.removeEventListener("keydown", onNavigate);
  }, [showModal, selectedRowIndex]); // eslint-disable-line

  // Filter + paginate
  const filtered = useMemo(() => {
    const q = (searchTerm.toString() || "").toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const checks = [
        r.utr_no,
        r.doc_no,
        r.bankname,
        r.lot_no,
        r.balance,
        r.amountDetail,
        r.narration_header,
      ].map((v) => (v == null ? "" : String(v).toLowerCase()));
      return checks.some((s) => s.includes(q));
    });
  }, [rows, searchTerm]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const itemsToDisplay = filtered.slice(startIndex, endIndex);

  // handle input change
  const onUtrInputChange = (e) => {
    setEnteredUtrNo(e.target.value);
    if (!e.target.value) {
      setSummaryText("");
      if (onUtrSelect) onUtrSelect(null); // cleared
    }
  };

  // Tab selection when exact UTR found
  const onUtrInputKeyDown = (e) => {
    if (e.key === "Tab" && e.target.id === name) {
      const match = rows.find(
        (r) => String(r.utr_no || "").trim() === String(enteredUtrNo).trim()
      );
      if (match) handlePick(match);
    }
  };

  // when a row is picked (double click / enter / click & Confirm)
  const handlePick = (row) => {
    // update input + summary
    setEnteredUtrNo(row.doc_no || "");
    setSummaryText(
      `Doc ${row.doc_no ?? ""} • Bank: ${row.bankname ?? ""} • Bal: ${row.balance ?? 0}` 
    );
    // pass full row to parent
    if (onUtrSelect) onUtrSelect(row);
    setShowModal(false);
  };

  return (
    <div className="d-flex flex-row">
      <div className="d-flex">
        <div className="d-flex">
          <input
            type="text"
            className="form-control ms-2"
            id={name}
            autoComplete="off"
            value={enteredUtrNo}
            onChange={onUtrInputChange}
            onKeyDown={onUtrInputKeyDown}
            style={{ width: "140px", height: "35px" }}
            tabIndex={tabIndexHelp}
            disabled={disabledField}
            ref={firstInputRef}
            placeholder="UTR No"
          />
          <Button
            variant="primary"
            onClick={open}
            className="interactive-button ms-1"
            style={{ width: "30px", height: "35px" }}
            disabled={disabledField}
            title="Open UTR Help (F1)"
          >
            ...
          </Button>

          <label
            className="form-labels ms-2"
            style={{
              whiteSpace: "nowrap",
              fontSize: "14px",
              fontWeight: "bold",
              marginTop: "5px",
            }}
          >
            {summaryText}
          </label>
        </div>
      </div>

      <Modal show={showModal} onHide={close} dialogClassName="modal-dialog">
        <Modal.Header
          style={{ display: "flex", justifyContent: "center", alignItems: "center" }}
        >
          <Modal.Title>UTR Selection</Modal.Title>
          <Button
            style={{
              background: "none",
              border: "none",
              fontSize: "1.5rem",
              cursor: "pointer",
              color: "blue",
              position: "absolute",
              right: "10px",
            }}
            onClick={close}
          >
            X
          </Button>
        </Modal.Header>

        {loading && (
          <div className="px-3 py-2" style={{ fontSize: 13 }}>
            Loading UTRs…
          </div>
        )}
        {err && (
          <div className="px-3 py-2 text-danger" style={{ fontSize: 13 }}>
            {err}
          </div>
        )}

        <DataTableSearch data={rows} onSearch={setSearchTerm} />

        <Modal.Body>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginBottom: "1rem",
                backgroundColor: "#fff",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "#f8f9fa" }}>
                  <th style={{ border: "1px solid #dee2e6", padding: "8px", whiteSpace: "nowrap" }}>
                    Doc No
                  </th>
                  <th style={{ border: "1px solid #dee2e6", padding: "8px", whiteSpace: "nowrap" }}>
                    UTR No
                  </th>
                  <th style={{ border: "1px solid #dee2e6", padding: "8px", whiteSpace: "nowrap" }}>
                    UTR Date
                  </th>
                  <th style={{ border: "1px solid #dee2e6", padding: "8px", whiteSpace: "nowrap" }}>
                    Bank
                  </th>
                  <th style={{ border: "1px solid #dee2e6", padding: "8px", whiteSpace: "nowrap" }}>
                    Lot No
                  </th>
                  <th style={{ border: "1px solid #dee2e6", padding: "8px", whiteSpace: "nowrap" }}>
                    Amount
                  </th>
                  <th style={{ border: "1px solid #dee2e6", padding: "8px", whiteSpace: "nowrap" }}>
                    Used
                  </th>
                  <th style={{ border: "1px solid #dee2e6", padding: "8px", whiteSpace: "nowrap" }}>
                    Balance
                  </th>
                  <th style={{ border: "1px solid #dee2e6", padding: "8px", whiteSpace: "nowrap" }}>
                    Narration
                  </th>
                </tr>
              </thead>
              <tbody>
                {itemsToDisplay.map((r, idx) => (
                  <tr
                    key={`${r.utrdetailid}-${r.doc_no}`}
                    style={{
                      cursor: "pointer",
                      backgroundColor: selectedRowIndex === idx ? "#d6e9f9" : "white",
                    }}
                    onClick={() => setSelectedRowIndex(idx)}
                    onDoubleClick={() => handlePick(r)}
                  >
                    <td style={{ border: "1px solid #dee2e6", padding: "8px" }}>{r.doc_no}</td>
                    <td style={{ border: "1px solid #dee2e6", padding: "8px" }}>{r.utr_no}</td>
                    <td style={{ border: "1px solid #dee2e6", padding: "8px" }}>{r.doc_date}</td>
                    <td style={{ border: "1px solid #dee2e6", padding: "8px" }}>{r.bankname}</td>
                    <td style={{ border: "1px solid #dee2e6", padding: "8px" }}>{r.lot_no}</td>
                    <td style={{ border: "1px solid #dee2e6", padding: "8px" }}>{r.amountDetail}</td>
                    <td style={{ border: "1px solid #dee2e6", padding: "8px" }}>{r.UsedAmt}</td>
                    <td style={{ border: "1px solid #dee2e6", padding: "8px" }}>{r.balance}</td>
                    <td style={{ border: "1px solid #dee2e6", padding: "8px" }}>
                      {r.narration_header}
                    </td>
                  </tr>
                ))}
                {!itemsToDisplay.length && (
                  <tr>
                    <td
                      colSpan={9}
                      style={{
                        border: "1px solid #dee2e6",
                        padding: "12px",
                        textAlign: "center",
                        fontStyle: "italic",
                      }}
                    >
                      {loading ? "Loading…" : "No records found"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <DataTablePagination
            totalItems={filtered.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default DoUtrNoHelp;
