import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import GroupMasterHelp from "../../../../Helper/GroupMasterHelp";
import MultipleStateSelectionHelp from "../../../../Helper/MultipleStateSelectionHelp";
import CityBroadCastHelp from "../../../../Helper/GetCityByStateHelp";

const companyCode = sessionStorage.getItem("Company_Code");

const AC_TYPES = [
  { value: "ALL", label: "All" },
  { value: "P",   label: "Party" },
  { value: "OP",  label: "Other Than Party" },
  { value: "S",   label: "Supplier" },
  { value: "B",   label: "Bank" },
  { value: "C",   label: "Cash" },
  { value: "R",   label: "Relative" },
  { value: "F",   label: "Fixed Assets" },
  { value: "I",   label: "Interest Party" },
  { value: "EX",  label: "Income" },
  { value: "E",   label: "Expenses" },
  { value: "O",   label: "Trading" },
  { value: "M",   label: "Mill" },
  { value: "T",   label: "Transport" },
  { value: "BR",  label: "Broker" },
  { value: "RP",  label: "Retail Party" },
  { value: "CR",  label: "Cash Retail Party" },
  { value: "CP",  label: "Capital" },
  { value: "SP",  label: "Farmer" },
];

const AccountMasterPrint = () => {
  const [acType, setAcType]                 = useState("ALL");
  const [groupCode, setGroupCode]           = useState("");
  const [accoid, setAccoid]                 = useState("");
  const [groupName, setGroupName]           = useState("");
  const [stateCode, setStateCode]           = useState("");
  const [stateName, setStateName]           = useState("");
  const [selectedStates, setSelectedStates] = useState([]);
  const [StateCodes, setStateCodes]         = useState([]);
  const [StateNames, setStateNames]         = useState([]);
  const [StateDisplayName, setStateDisplayName] = useState("");
  const [UniqueCityName, setUniqueCityName] = useState([]);
  const [CityCode, setCityCode]             = useState("");
  const [CityName, setCityName]             = useState("");

  const navigate = useNavigate();

  const handleGroupCode = (code, bsId, name) => {
    setGroupCode(code);
    setAccoid(bsId);
    if (name !== undefined) setGroupName(name);
  };

  const handleCity_Code = (cityArray) => {
    if (Array.isArray(cityArray)) {
      const uniqueCitiesMap = new Map();
      cityArray.forEach(city => uniqueCitiesMap.set(city.city_code, city));
      const uniqueCities = Array.from(uniqueCitiesMap.values());
      setCityCode(uniqueCities.map(c => c.city_code).join(","));
      setCityName(uniqueCities.map(c => c.city_name_e).join(","));
      setUniqueCityName(uniqueCities.map(c => c.city_name_e));
    }
  };

  const handleGetReportClick = (type) => {
    const params = new URLSearchParams({ Company_Code: companyCode });
    switch (type) {
      case "acType":
        if (acType && acType !== "ALL") params.set("acType", acType);
        break;
      case "groupCode":
        if (!groupCode) return alert("Please select a Group Code");
        params.set("groupCode", groupCode);
        break;
      case "stateWise":
        params.set("stateWise", "true");
        break;
      default:
        return;
    }
    window.open(`/accountmaster-print-report?${params.toString()}`, "_blank");
  };

  const sectionCard = {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: "18px 20px",
    marginBottom: 16,
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  };

  const sectionTitle = {
    fontSize: 13,
    fontWeight: 700,
    color: "#374151",
    marginBottom: 14,
    display: "flex",
    alignItems: "center",
    gap: 8,
  };

  const badge = (color) => ({
    display: "inline-block",
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: color,
    flexShrink: 0,
  });

  const labelStyle = {
    fontSize: 12,
    fontWeight: 600,
    color: "#6b7280",
    marginBottom: 6,
    display: "block",
  };

  const selectStyle = {
    width: "100%",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    padding: "8px 12px",
    fontSize: 13,
    color: "#111827",
    background: "#fff",
    outline: "none",
    cursor: "pointer",
    appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
    paddingRight: 36,
  };

  const btnPrimary = {
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "9px 20px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
    flexShrink: 0,
  };

  const rowStyle = {
    display: "flex",
    alignItems: "flex-end",
    gap: 12,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", display: "flex", justifyContent: "center", padding: "32px 16px" }}>
      <div style={{ width: "100%", maxWidth: 580 }}>

        {/* Page Header */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111827", margin: 0 }}>Account List</h1>
        </div>

        {/* ── Section 1: Account Type Wise ── */}
        <div style={sectionCard}>
          <div style={sectionTitle}>
            <span style={badge("#2563eb")} />
            Account Type Wise
          </div>
          <div style={rowStyle}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Account Type</label>
              <select
                value={acType}
                onChange={e => setAcType(e.target.value)}
                style={selectStyle}
              >
                {AC_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <button
              style={btnPrimary}
              onClick={() => handleGetReportClick("acType")}
            >
              Get Report
            </button>
          </div>
        </div>

        {/* ── Section 2: Group Code Wise ── */}
        <div style={sectionCard}>
          <div style={sectionTitle}>
            <span style={badge("#7c3aed")} />
            Group Code Wise
          </div>
          <div style={rowStyle}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Group Code</label>
              <GroupMasterHelp
                onAcCodeClick={handleGroupCode}
                name="Group_Code"
                GroupName={groupName}
                GroupCode={groupCode}
              />
              {groupName && (
                <span style={{ fontSize: 11, color: "#6b7280", marginTop: 4, display: "block" }}>
                  {groupCode} — {groupName}
                </span>
              )}
            </div>
            <button
              style={btnPrimary}
              onClick={() => handleGetReportClick("groupCode")}
            >
              Get Report
            </button>
          </div>
        </div>

        {/* ── Section 3: State Wise ── */}
        <div style={sectionCard}>
          <div style={sectionTitle}>
            <span style={badge("#059669")} />
            State Wise
          </div>

          {/* State + City side by side */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div style={{ textAlign: "left" }}>
              <label style={{ ...labelStyle, textAlign: "left", display: "block" }}>State</label>
              <MultipleStateSelectionHelp
                name="GstStateCode"
                GstStateName={stateName}
                GstStateCode={stateCode}
                onAcCodeClick={(selectedArray) => {
                  if (Array.isArray(selectedArray)) {
                    setSelectedStates(selectedArray);
                    const codes = selectedArray.map(s => s.State_Code);
                    const names = selectedArray.map(s => s.State_Name);
                    setStateCodes(codes);
                    setStateNames(names);
                    const lbl = names.length > 5
                      ? `${names.slice(0, 5).join(", ")}, ...`
                      : names.join(", ");
                    setStateDisplayName(lbl);
                    setStateCode(codes.join(","));
                    setStateName(lbl);
                  } else {
                    setSelectedStates([]); setStateCodes([]); setStateNames([]);
                    setStateDisplayName(""); setStateCode(""); setStateName("");
                  }
                }}
              />
              {stateName && (
                <span style={{ fontSize: 11, color: "#6b7280", marginTop: 4, display: "block", textAlign: "left" }}>
                  {stateName}
                </span>
              )}
            </div>

            <div style={{ textAlign: "left" }}>
              <label style={{ ...labelStyle, textAlign: "left", display: "block" }}>
                City{" "}
                <span style={{ fontWeight: 400, color: "#9ca3af" }}>(optional)</span>
              </label>
              <CityBroadCastHelp
                name="City_Code"
                onAcCodeClick={handleCity_Code}
                State_Code={selectedStates}
                CityName={CityName}
                CityCode={CityCode}
                tabIndexHelp={8}
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              style={btnPrimary}
              onClick={() => handleGetReportClick("stateWise")}
            >
              Get Report
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AccountMasterPrint;
