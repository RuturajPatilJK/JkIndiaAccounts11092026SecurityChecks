import React, { useState } from "react";
import axios from "axios";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Checkbox, Button, TextField,
} from "@mui/material";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ScaleLoader } from "react-spinners";

const API_URL = process.env.REACT_APP_API;

const OurPartySelection = () => {
  const [panInput, setPanInput] = useState("");
  const [accounts, setAccounts] = useState([]);
  // Keyed by accoid -> { Our_Party: 'Y'|'N', Show_Ledger: 'Y'|'N' }
  const [flags, setFlags] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    const pan = panInput.trim();
    if (!pan) {
      toast.info("Enter a PAN number to search.");
      return;
    }
    const companyCode = sessionStorage.getItem("Company_Code");
    if (!companyCode) {
      toast.error("Company not selected.");
      return;
    }

    setLoading(true);
    setHasSearched(true);
    try {
      const response = await axios.get(`${API_URL}/get-accountmaster-party-selection-list`, {
        params: { Company_Code: companyCode, pan },
      });
      const rows = response.data?.all_data || [];
      setAccounts(rows);
      const newFlags = {};
      rows.forEach((row) => {
        newFlags[row.accoid] = {
          Our_Party: row.Our_Party === "Y" ? "Y" : "N",
          Show_Ledger: row.Show_Ledger === "Y" ? "Y" : "N",
        };
      });
      setFlags(newFlags);
      if (rows.length === 0) {
        toast.info("No accounts found for that PAN.");
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
      toast.error("Failed to load accounts.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  const toggleFlag = (accoid, field) => {
    setFlags((prev) => ({
      ...prev,
      [accoid]: {
        ...prev[accoid],
        [field]: prev[accoid]?.[field] === "Y" ? "N" : "Y",
      },
    }));
  };

  const isAllChecked = (field) =>
    accounts.length > 0 &&
    accounts.every((row) => flags[row.accoid]?.[field] === "Y");

  const handleSelectAll = (field) => {
    const shouldCheck = !isAllChecked(field);
    setFlags((prev) => {
      const updated = { ...prev };
      accounts.forEach((row) => {
        updated[row.accoid] = {
          ...updated[row.accoid],
          [field]: shouldCheck ? "Y" : "N",
        };
      });
      return updated;
    });
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      const updates = accounts.map((row) => ({
        accoid: row.accoid,
        Our_Party: flags[row.accoid]?.Our_Party === "Y" ? "Y" : "N",
        Show_Ledger: flags[row.accoid]?.Show_Ledger === "Y" ? "Y" : "N",
      }));

      await axios.put(`${API_URL}/bulk-update-our-party-show-ledger`, { updates });
      toast.success("Updated successfully.");
      handleSearch();
    } catch (error) {
      console.error("Error updating accounts:", error);
      toast.error("Failed to update accounts.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <ToastContainer autoClose={2000} />

      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: "16px", flexWrap: "wrap", gap: "10px",
      }}>
        <div style={{ display: "flex", gap: "8px" }}>
          <TextField
            size="small"
            label="PAN Number"
            placeholder="Enter PAN number..."
            value={panInput}
            onChange={(e) => setPanInput(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            style={{ minWidth: 280 }}
          />
          <Button variant="contained" onClick={handleSearch} disabled={loading}>
            Search
          </Button>
        </div>
        <Button
          variant="contained"
          color="primary"
          onClick={handleUpdate}
          disabled={saving || loading || accounts.length === 0}
        >
          {saving ? "Updating..." : "Update"}
        </Button>
      </div>

      <TableContainer component={Paper} style={{ maxHeight: "75vh" }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell style={{ fontWeight: "bold", backgroundColor: "#5557df", color: "#fff" }}>Ac Code</TableCell>
              <TableCell style={{ fontWeight: "bold", backgroundColor: "#5557df", color: "#fff" }}>Account Name</TableCell>
              <TableCell style={{ fontWeight: "bold", backgroundColor: "#5557df", color: "#fff" }}>PAN No.</TableCell>
              <TableCell align="center" style={{ fontWeight: "bold", backgroundColor: "#5557df", color: "#fff" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <span>Our Party</span>
                  <Checkbox
                    size="small"
                    checked={isAllChecked("Our_Party")}
                    onChange={() => handleSelectAll("Our_Party")}
                    sx={{ color: "#fff", padding: 0, "&.Mui-checked": { color: "#fff" } }}
                    title="Select All"
                  />
                </div>
              </TableCell>
              {/* <TableCell align="center" style={{ fontWeight: "bold", backgroundColor: "#5557df", color: "#fff" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <span>Show Ledger</span>
                  <Checkbox
                    size="small"
                    checked={isAllChecked("Show_Ledger")}
                    onChange={() => handleSelectAll("Show_Ledger")}
                    sx={{ color: "#fff", padding: 0, "&.Mui-checked": { color: "#fff" } }}
                    title="Select All"
                  />
                </div>
              </TableCell> */}
            </TableRow>
          </TableHead>
          <TableBody>
            {accounts.map((row, index) => (
              <TableRow key={row.accoid} hover style={{ backgroundColor: index % 2 === 0 ? "#fff" : "#f5f8ff" }}>
                <TableCell>{row.Ac_Code}</TableCell>
                <TableCell>{row.Ac_Name_E}</TableCell>
                <TableCell>{row.CompanyPan || "-"}</TableCell>
                <TableCell align="center">
                  <Checkbox
                    checked={flags[row.accoid]?.Our_Party === "Y"}
                    onChange={() => toggleFlag(row.accoid, "Our_Party")}
                  />
                </TableCell>
                {/* <TableCell align="center">
                  <Checkbox
                    checked={flags[row.accoid]?.Show_Ledger === "Y"}
                    onChange={() => toggleFlag(row.accoid, "Show_Ledger")}
                  />
                </TableCell> */}
              </TableRow>
            ))}
            {accounts.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={5} align="center" style={{ padding: "40px", color: "#94a3b8" }}>
                  {hasSearched ? "No records found" : "Enter a PAN number and click Search"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {loading && (
        <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 9999 }}>
          <ScaleLoader color="#36d7b7" height={35} />
        </div>
      )}
    </div>
  );
};

export default OurPartySelection;
