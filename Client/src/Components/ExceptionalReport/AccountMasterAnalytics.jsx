import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import GroupMasterHelp from "../../Helper/GroupMasterHelp"; 
import GSTStateMasterHelp from "../../Helper/GSTStateMasterHelp";

const API_URL = process.env.REACT_APP_API;

const AccountMasterByDate = () => {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [companyCode, setCompanyCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [searchText, setSearchText] = useState('');
  // Debounced so filtering (over potentially thousands of rows) only re-runs
  // once typing pauses, instead of on every keystroke.
  const [debouncedSearchText, setDebouncedSearchText] = useState('');

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearchText(searchText), 250);
    return () => clearTimeout(handle);
  }, [searchText]);


  const [acType, setAcType] = useState('A'); 
  const [groupCode, setGroupCode] = useState(""); 
  const [groupName, setGroupName] = useState("");
  const [accoid, setAccoid] = useState("");
  const [AcStateCode, setAcStateCode] = useState("");
  const [gstStateName, setGstStateName] = useState("");

  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    setFromDate(firstDay.toISOString().split('T')[0]);
    setToDate(today.toISOString().split('T')[0]);
    setCompanyCode(sessionStorage.getItem('Company_Code'));
  }, []);

  const handleGroupCode = (code, accoid) => {
    setGroupCode(code);
    setAccoid(accoid); 
  };

  const handleGSTStateCode = (code, name) => {
    setAcStateCode(code);
    setGstStateName(name);
  };

  const fetchAccountData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/getAccountMasterByDateRange`, {
        params: { company_code: companyCode, from_date: fromDate, to_date: toDate }
      });
      setData(response.data.data || []);
    } catch (err) {
      console.error("Fetch error", err);
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '---';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const filteredData = useMemo(() => {
    const term = debouncedSearchText.trim().toLowerCase();
    return data.filter(item => {
      const matchesSearch = !term ||
                            item.Ac_Name_E?.toLowerCase().includes(term) ||
                            item.cityname?.toLowerCase().includes(term) ||
                            item.Gst_No?.toLowerCase().includes(term) ||
                            item.CompanyPan?.toLowerCase().includes(term) ||
                            item.Ac_Code?.toString().includes(term);
      const matchesType = (acType === 'A' || !acType) ? true : item.Ac_type === acType;
      const matchesGroup = groupCode ? String(item.Group_Code).trim() === String(groupCode).trim() : true;
      const itemStateCode = item.GstStateCode || item.Gst_State_Code || item.GSTStateCode;
      const matchesState = AcStateCode ? String(itemStateCode).trim() === String(AcStateCode).trim() : true;
      return matchesSearch && matchesType && matchesGroup && matchesState;
    });
  }, [data, debouncedSearchText, acType, groupCode, AcStateCode]);


  const handleExportExcel = () => {
    const companyName = sessionStorage.getItem('Company_Name') || 'Company Name Not Found';
    
    const headerRow1 = [[companyName]];
    const headerRow2 = [[`Account Master Report From: ${formatDate(fromDate)} To: ${formatDate(toDate)}`]];
    const spacer = [[]]; 

    // Table Data
    const worksheetData = filteredData.map(item => ({
        "Code": item.Ac_Code,
        "Ac Type": item.Ac_type,
        "Account Name": item.Ac_Name_E,
        "Group Code": item.Group_Code,
        "Group Name": item.group_Name_E,
        "PAN": item.CompanyPan,
        "GSTN": item.Gst_No,
        "City": item.cityname,
        "State": item.State_Name,
        "Created Date": formatDate(item.Created_Date)
    }));

    const ws = XLSX.utils.json_to_sheet(worksheetData, { origin: "A4" });

    XLSX.utils.sheet_add_aoa(ws, headerRow1, { origin: "A1" });
    XLSX.utils.sheet_add_aoa(ws, headerRow2, { origin: "A2" });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Filtered_List");

    XLSX.writeFile(wb, `Account_Report_${fromDate}_to_${toDate}.xlsx`);
  };

  const stateStats = useMemo(() => {
    if (!filteredData.length) return [];
    const totalCount = filteredData.length;
    const counts = {};
    filteredData.forEach(item => {
      const state = item.State_Name?.trim() || 'Other';
      counts[state] = (counts[state] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count, percentage: ((count / totalCount) * 100).toFixed(1) }))
      .sort((a, b) => b.count - a.count).slice(0, 10);
  }, [filteredData]);

  return (
    <div className="min-h-screen bg-[#F4F7FE] p-4 font-sans text-slate-800 relative">
      {loading && (
        <div className="fixed inset-0 z-[100] bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <p className="text-xs font-black text-indigo-900 uppercase tracking-widest animate-pulse">Processing Records...</p>
        </div>
      )}

      <div className="max-w-[1650px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 mb-4">
          <div className="lg:col-span-5 bg-white p-4 rounded-[1.5rem] shadow-sm border border-slate-200">
            <h1 className="text-xl font-black tracking-tight text-indigo-900 mb-3">Account Master Analytics</h1>
            <div className="space-y-3">
              <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                <input type="date" value={fromDate} onChange={(e)=>setFromDate(e.target.value)} className="bg-transparent border-none text-[12px] font-bold focus:ring-0 w-full"/>
                <input type="date" value={toDate} onChange={(e)=>setToDate(e.target.value)} className="bg-transparent border-none text-[12px] font-bold focus:ring-0 w-full"/>
                <button onClick={fetchAccountData} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all font-bold text-[10px] uppercase">Fetch Data</button>
              </div>

              <div className="flex flex-row items-end gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1 text-left">Account Type</label>
                  <FormControl size="small" sx={{ width: "200px" }}>
                    <Select value={acType} onChange={(e) => setAcType(e.target.value)} sx={{ borderRadius: '10px', fontSize: '12px', fontWeight: 'bold', bgcolor: '#fff', height: '38px' }}>
                       <MenuItem value="A">ALL</MenuItem>
                      <MenuItem value="P">Party</MenuItem>
                      <MenuItem value="OP">Other Than Party</MenuItem>
                      <MenuItem value="S">Supplier</MenuItem>
                      <MenuItem value="B">Bank</MenuItem>
                      <MenuItem value="C">Cash</MenuItem>
                      <MenuItem value="R">Relative</MenuItem>
                      <MenuItem value="F">Fixed Assets</MenuItem>
                      <MenuItem value="I">Interest Party</MenuItem>
                      <MenuItem value="EX">Income</MenuItem>
                      <MenuItem value="E">Expenses</MenuItem>
                      <MenuItem value="O">Trading</MenuItem>
                      <MenuItem value="M">Mill</MenuItem>
                      <MenuItem value="T">Transport</MenuItem>
                      <MenuItem value="BR">Broker</MenuItem>
                      <MenuItem value="RP">Retail Party</MenuItem>
                      <MenuItem value="CR">Cash Retail Party</MenuItem>
                      <MenuItem value="CP">Capital</MenuItem>
                    </Select>
                  </FormControl>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1 text-left">Group Code</label>
                  <div className="flex items-center gap-2">
                    <GroupMasterHelp onAcCodeClick={handleGroupCode} name="Group_Code" GroupName={groupName} GroupCode={groupCode} />
                    {groupCode && <button onClick={() => {setGroupCode(""); setGroupName("");}} className="bg-red-50 text-red-500 px-2 py-2 rounded-lg text-[10px] font-bold hover:bg-red-100 h-[38px]">RESET</button>}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block ml-1 text-left">State (GST Code)</label>
                <div className="flex items-center gap-2">
                  <GSTStateMasterHelp name="GSTStateCode" onAcCodeClick={handleGSTStateCode} GstStateName={gstStateName} GstStateCode={AcStateCode} tabIndex={44} />
                  {AcStateCode && <button onClick={() => {setAcStateCode(""); setGstStateName("");}} className="bg-red-50 text-red-500 px-2 py-2 rounded-lg text-[10px] font-bold hover:bg-red-100">RESET</button>}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white p-4 rounded-[1.5rem] shadow-sm border border-slate-200 self-start">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-900 mb-3">Regional Distribution</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
              {stateStats.length > 0 ? stateStats.map((st, i) => (
                <div key={i}>
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-[10px] font-bold text-slate-600 uppercase">{st.name}</span>
                    <span className="text-[11px] font-black text-indigo-600">{st.count}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full transition-all duration-700" style={{ width: `${st.percentage}%` }}></div>
                  </div>
                </div>
              )) : (
                <p className="text-[10px] text-slate-400 italic">No data for selected filters</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden mb-20">
          <div className="px-6 py-3 border-b border-slate-100 flex justify-between items-center bg-white">
            <input type="text" placeholder="Search..." value={searchText} onChange={(e)=>setSearchText(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-1.5 text-xs w-72 outline-none focus:ring-2 focus:ring-indigo-100" />
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Showing: <span className="text-indigo-600 font-black">{filteredData.length}</span> Records
              </span>
              <button onClick={handleExportExcel} className="bg-slate-900 text-white px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase hover:bg-indigo-600 transition-colors">Export Excel</button>
            </div>
          </div>

          <div className="max-h-[75vh] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-separate border-spacing-0">
              <thead className="sticky top-0 bg-white z-10 shadow-sm">
                <tr className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">
                  <th className="px-4 py-2.5 border-b border-slate-100">Code</th>
                  <th className="px-4 py-2.5 border-b border-slate-100">Ac Type</th>
                  <th className="px-4 py-2.5 border-b border-slate-100">Account Name</th>
                  <th className="px-4 py-2.5 border-b border-slate-100">Group Info</th>
                  <th className="px-4 py-2.5 border-b border-slate-100">Tax Details (PAN/GST)</th>
                  <th className="px-4 py-2.5 border-b border-slate-100">Location (State Code)</th>
                  <th className="px-4 py-2.5 border-b border-slate-100 text-nowrap">Created Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredData.map((item, idx) => (
                  <tr key={idx} className="hover:bg-indigo-50/40 transition-colors group">
                    <td className="px-4 py-1.5 font-bold text-[11px] text-slate-400">{item.Ac_Code}</td>
                    <td className="px-4 py-1.5 font-black text-indigo-900 text-[12px] uppercase">{item.Ac_type}</td>
                    <td className="px-4 py-1.5 font-black text-indigo-900 text-[12px] uppercase">{item.Ac_Name_E}</td>
                    <td className="px-4 py-1.5 leading-tight">
                      <div className="text-[12px] font-bold text-emerald-700">{item.Group_Code}</div>
                      <div className="text-[11px] text-slate-500 uppercase">{item.group_Name_E}</div>
                    </td>
                    <td className="px-4 py-1.5 leading-tight">
                      <div className="text-[12px] font-mono font-bold text-slate-700">{item.CompanyPan || 'NO PAN'}</div>
                      <div className="text-[11px] font-mono text-blue-600">{item.Gst_No || 'NO GST'}</div>
                    </td>
                    <td className="px-4 py-1.5 leading-tight">
                      <div className="text-[12px] font-bold text-slate-700 uppercase">{item.cityname}</div>
                      <div className="text-[11px] text-slate-500 uppercase">{item.State_Name}</div>
                    </td>
                    <td className="px-4 py-1.5 text-[10px] font-bold text-slate-400 uppercase">{formatDate(item.Created_Date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountMasterByDate;


