import React from "react";
import { useEffect, useState, useRef } from "react";
import ActionButtonGroup from "../../../Common/CommonButtons/ActionButtonGroup";
import NavigationButtons from "../../../Common/CommonButtons/NavigationButtons";
import SystemHelpMaster from "../../../Helper/SystemmasterHelp";
import GSTStateMasterHelp from "../../../Helper/GSTStateMasterHelp";
import PurcnoHelp from "../../../Helper/PurcnoHelp";
import CarporateHelp from "../../../Helper/CarporateHelp";
import "../../BusinessRelated/DeliveryOrder/DeliveryOrder.css";
import "../../../App.css"
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AccountMasterHelp from "../../../Helper/AccountMasterHelp";
import GSTRateMasterHelp from "../../../Helper/GSTRateMasterHelp";
import { useNavigate, useLocation } from "react-router-dom";
import DeliveryOrderOurDoReport from "../DeliveryOrder/DeliveryOrderOurDOReport";
import DeliveryOrderOurDOForReport from "../DeliveryOrder/DeliveryOrderOurDOForReport";
import PartyBillDoReport from '../DeliveryOrder/PartyBillDO';
import SaleBillReport from '../../Outward/SaleBill/CustomizeSBReport'
import PartyDOReport from "../DeliveryOrder/PartyDOReport";
import { initialFormData, checkMatchStatus, Acname } from '../DeliveryOrder/InitialFormDataDO'
import {
  TextField, Typography, Select, MenuItem, Grid, InputLabel, FormControl, OutlinedInput, Box, Table, TableHead, TableRow, TableCell, TableBody, Card, CardContent, Dialog, DialogTitle, DialogContent, IconButton, Button, useMediaQuery,
  useTheme
} from "@mui/material";
import Swal from "sweetalert2";
import AddButton from "../../../Common/Buttons/AddButton";
import EditButton from "../../../Common/Buttons/EditButton";
import DeleteButton from "../../../Common/Buttons/DeleteButton";
import OpenButton from "../../../Common/Buttons/OpenButton";
import UserAuditInfo from "../../../Common/UserAuditInfo/UserAuditInfo";
import DetailCloseButton from "../../../Common/Buttons/DetailCloseButton";
import DetailUpdateButton from "../../../Common/Buttons/DetailUpdateButton";
import DetailAddButtomCommon from "../../../Common/Buttons/DetailAddButton";
import CloseIcon from '@mui/icons-material/Close';
import EwayBillGeneration from "../../../Common/EwaybillNEInvoice/Ewaybill/EwayBillGeneration";
import EInvoiceGeneration from "../../../Common/EwaybillNEInvoice/EInvoiceGenerationProcess/EInvoiceGeneration";
import EInvoiceEwayBillGeneration from "../../../Common/EwaybillNEInvoice/EInvoiceEwaybillGeneration/EInvoiceEwayBillGeneration";
import TruckLoader from "../../../Common/Spinners/TruckLoader";
import { validateDocumentDate } from "../../../Common/ValidateDateRange/ValidateDateRange"
import { useRecordLocking } from "../../../hooks/useRecordLocking";
import GradeMasterHelp from "../../../Helper/GradeMasterHelp";
import formatTruckNumber from "../../../Common/FormatFunctions/FormatTruckNumber"
import ProformaInvoice from "../DeliveryOrder/ProformaInvoice";
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";
import { fetchAccountBalance } from "../../../Common/GetAccountBalance/GetAccountBalance";
import CustomTextFeild from "../../../Common/Buttons/CustomTextFeild"
import DoUtrNoHelp from "../../../Helper/DoUTRNoHelp";
import CarporateSaleBillPrint from "../../Outward/SaleBill/CarporateSaleBillPrint"

const API_URL = process.env.REACT_APP_API;

// ── ALL original global vars preserved ──
var lblmillname;
var newmill_code;
var lblDoname;
var newDO;
var lblvoucherByname;
var newvoucher_by;
var lblbrokername;
var newbroker;
var lbltransportname;
var newtransport;
var lblvasuliacname;
var newvasuli;
var lblgetpasscodename;
var newGETPASSCODE;
var lblsalebilltoname;
var newSaleBillTo;
var lblvasuliacname;
var newVasuli_Ac;
var lblgstratename;
var newGstRateCode;
var lblgetpassstatename;
var GetpassByCode;
var VoucherByName;
var VoucherByCode;
var SaleBillByName;
var SaleBillByCode;
var MillByName;
var MillByCode;
var GetPassByName;
var lblBilltostatename;
var lblmillstatename;
var MillByCode;
var lbltransportstatename;
var newTransportGSTStateCode;
var lblitemname;
var newitemcode;
var lblcarporateacname;
var newcarporate_ac;
var lblbrandname;
var newbrandcode;
var lblcashdiffacname;
var newCashDiffAc;
var lbltdsacname;
var newTDSAc;
var newMemoGSTRate;
var lblMemoGSTRatename;
var ItemName = "";
var ItemCodeNew = "";
var lblbankname = "";
var bankcodenew = "";
var newDcid = "";
var newPurcno;
var lblTenderid;
var newpurcoder;
var TenderDetailsData = "";
var newcarporateno;
var voucherTitle = "";
var salebillTitle = "";
var getpassTitle = "";
var brokerTitle = "";
var voucherstatename = "";
var salebilltostatename = "";
var getpassstatename = "";
var newTenderDetailId = "";
var truckNo = "";
var OrderId = "";
var gradeName;
var newGrade;
var isPurchasePartyLock = 'N'
var isSalePartyLock = 'N'
var season = ""
var isPurchasePartyNULL = 'N'
var isSaleTDSPartyNULL = 'N'
var newGodownCode = ''
var lblGodownName = ''
var carporatenameTitle = ''
var lblcarporateacname;
var newcarporate_ac;
var CarporatestatecodeGSTStateCode;

// ─────────────────────────────────────────────
//  DESIGN SYSTEM — Professional ERP Aestheti
//  Color: Deep navy + crisp white + gold accent
// ─────────────────────────────────────────────

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
 
  *, *::before, *::after {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
 
  .do-root {
    font-family: 'DM Sans', sans-serif;
    background: #f0f2f5;
    min-height: 100vh;
    width: 100%;
  }
 
  /* ── Top Bar ── */
  .do-topbar {
    background: linear-gradient(135deg, #0f1f3d 0%, #1a3560 60%, #1e4080 100%);
    box-shadow: 0 2px 12px rgba(0,0,0,0.25);
    position: sticky;
    top: 0;
    z-index: 100;
    width: 100%;
    overflow: hidden;
  }
 
  /* Title row — scrolls horizontally if too narrow */
  .do-topbar-inner {
    width: 100%;
    padding: 5px 10px;
    display: flex;
   
    align-items: center;
    gap: 6px;
    overflow-x: auto;
    min-height: 32px;
  }
  .do-topbar-inner::-webkit-scrollbar { height: 0; }
 
  .do-title {
    font-size: 13px;
    font-weight: 700;
    color: #e2c97e;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    flex-shrink: 0;
  }
 
  /* ── Action + Nav single row — scrolls horizontally ── */
.do-action-nav-row {
    background: #0d1b33;
    border-top: 1px solid rgba(255,255,255,0.08);
    padding: 5px 10px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 5px;
    width: 100%;
    overflow-x: auto;
    overflow-y: hidden;
    min-height: 36px;
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,0.15) transparent;
  }
  .do-action-nav-row::-webkit-scrollbar { height: 3px; }
  .do-action-nav-row::-webkit-scrollbar-track { background: transparent; }
  .do-action-nav-row::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 3px; }
 
  /* Spacer that pushes nav to the right — but collapses if no room */
  .do-nav-push { flex: 1 1 0; min-width: 6px; max-width: 9999px; }
 
  /* ── Main layout grid ── */
  .do-main-grid {
    width: 100%;
    padding: 6px 8px 16px;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 6px;
    align-items: start;
  }
  .do-col {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }
 
  /* ── Card ── */
  .do-card {
    background: #fff;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    overflow: hidden;
    width: 100%;
    min-width: 0;
  }
  .do-card-header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 5px 10px;
    background: linear-gradient(90deg, #0f1f3d 0%, #1a3560 100%);
    border-bottom: 2px solid #e2c97e;
    cursor: pointer;
    user-select: none;
  }
  .do-card-icon { font-size: 12px; opacity: 0.85; }
  .do-card-title {
    font-size: 10px;
    font-weight: 700;
    color: #e2c97e;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .do-card-badge {
    margin-left: auto;
    font-size: 10px;
    font-weight: 700;
    background: #e2c97e;
    color: #0f1f3d;
    border-radius: 20px;
    padding: 1px 7px;
  }
  .do-card-body {
    padding: 8px 10px;
    overflow-x: auto;
    min-width: 0;
  }
 
  /* ── Field ── */
  .do-field {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .do-label {
    font-size: 9px;
    font-weight: 700;
    font-style: normal;
    color: #000000;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    white-space: nowrap;
    text-align: left;
    display: block;
  }
 
  /* ── Inputs ── */
  .do-input {
    height: 28px;
    padding: 0 7px;
    font-size: 11px;
    font-weight: 500;
    font-family: 'DM Sans', sans-serif;
    border: 1px solid #cbd5e1;
    border-radius: 5px;
    background: #fff;
    color: #1e293b;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
  }
  .do-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.15); }
  .do-input:disabled { background: #f8fafc; color: #64748b; cursor: default; border-color: #e2e8f0; }
  .do-input-right { text-align: right; }
  .do-input-mono { font-family: 'DM Mono', monospace; }
 
  .do-date {
    height: 28px;
    padding: 0 7px;
    font-size: 11px;
    font-weight: 500;
    border: 1px solid #cbd5e1;
    border-radius: 5px;
    background: #fff;
    color: #1e293b;
    outline: none;
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .do-date:focus { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.15); }
  .do-date:disabled { background: #f8fafc; color: #64748b; border-color: #e2e8f0; }
 
  .do-select {
    height: 28px;
    padding: 0 7px;
    font-size: 11px;
    font-weight: 500;
    border: 1px solid #cbd5e1;
    border-radius: 5px;
    background: #fff;
    color: #1e293b;
    outline: none;
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
    cursor: pointer;
  }
  .do-select:disabled { background: #f8fafc; color: #64748b; border-color: #e2e8f0; cursor: default; }
 
  /* ── Grid helpers ── */
  .do-g2 { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 5px; width: 100%; }
  .do-g3 { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 5px; width: 100%; }
  .do-g4 { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 5px; width: 100%; }
  .do-g5 { display: grid; grid-template-columns: repeat(5, minmax(0,1fr)); gap: 5px; width: 100%; }
  .do-g6 { display: grid; grid-template-columns: repeat(6, minmax(0,1fr)); gap: 5px; width: 100%; }
 
  /* ── Divider ── */
  .do-divider {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 6px 0 5px;
  }
  .do-divider-label {
    font-size: 9px;
    font-weight: 700;
    color: #94a3b8;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    white-space: nowrap;
  }
  .do-divider-line {
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, #e2e8f0, transparent);
  }
 
  /* ── Chips & Tags ── */
  .do-chip-doc {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 8px;
    border-radius: 6px;
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    font-size: 11px;
    flex-shrink: 0;
  }
  .do-chip-doc-label { font-size: 10px; font-weight: 600; color: #64748b; white-space: nowrap; }
  .do-chip-doc-value { font-weight: 700; color: #1e40af; cursor: pointer; white-space: nowrap; }
  .do-chip-doc-value:hover { text-decoration: underline; }
  .do-chip-doc-value.disabled { color: #94a3b8; cursor: default; }
  .do-chip-doc-value.disabled:hover { text-decoration: none; }
 
  .do-tag {
    display: inline-flex;
    align-items: center;
    font-size: 10px;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 20px;
    white-space: nowrap;
  }
  .do-tag-deleted { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }
  .do-tag-type    { background: #dbeafe; color: #1d4ed8; border: 1px solid #93c5fd; }
  .do-tag-season  { background: #fef3c7; color: #92400e; border: 1px solid #fcd34d; }
  .do-tag-credit  { background: #d1fae5; color: #065f46; border: 1px solid #6ee7b7; }
  .do-tag-debit   { background: #fee2e2; color: #7f1d1d; border: 1px solid #fca5a5; }
 
  /* ── Amount boxes ── */
  .do-amtbox {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 5px 10px;
    border-radius: 7px;
    border: 1px solid;
    min-width: 0;
    flex: 1;
  }
  .do-amtbox-blue   { background: #eff6ff; border-color: #bfdbfe; }
  .do-amtbox-amber  { background: #fffbeb; border-color: #fde68a; }
  .do-amtbox-green  { background: #f0fdf4; border-color: #bbf7d0; }
  .do-amtbox-label  { font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; }
  .do-amtbox-val-blue  { font-size: 12px; font-weight: 700; color: #1d4ed8; font-family: 'DM Mono', monospace; }
  .do-amtbox-val-amber { font-size: 12px; font-weight: 700; color: #b45309; font-family: 'DM Mono', monospace; }
  .do-amtbox-val-green { font-size: 12px; font-weight: 700; color: #15803d; font-family: 'DM Mono', monospace; }
 
  /* ── Buttons ── */
  .do-btn {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 4px 10px;
    font-size: 10px;
    font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    border-radius: 5px;
    border: none;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.15s;
    flex-shrink: 0;
  }
  .do-btn:disabled { opacity: 0.45; cursor: not-allowed; }
  .do-btn-primary  { background: #1d4ed8; color: #fff; }
  .do-btn-primary:not(:disabled):hover  { background: #1e40af; }
  .do-btn-success  { background: #059669; color: #fff; }
  .do-btn-success:not(:disabled):hover  { background: #047857; }
  .do-btn-warning  { background: #d97706; color: #fff; }
  .do-btn-warning:not(:disabled):hover  { background: #b45309; }
  .do-btn-ghost    { background: transparent; color: #1d4ed8; border: 1px solid #93c5fd; }
  .do-btn-ghost:not(:disabled):hover    { background: #eff6ff; }
  .do-btn-unlock   { background: #0f766e; color: #fff; }
  .do-btn-unlock:not(:disabled):hover   { background: #0d6b64; }
  .do-btn-gold     { background: linear-gradient(135deg, #d97706, #b45309); color: #fff; }
  .do-btn-gold:not(:disabled):hover     { background: linear-gradient(135deg, #b45309, #92400e); }
 
  /* ── Table ── */
  .do-table { width: 100%; border-collapse: collapse; font-size: 10px; table-layout: fixed; }
  .do-table thead th {
    background: linear-gradient(135deg, #0f1f3d, #1a3560);
    color: #e2c97e;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    padding: 5px 6px;
    text-align: center;
    border-bottom: 2px solid #e2c97e;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .do-table tbody tr { border-bottom: 1px solid #f1f5f9; transition: background 0.1s; }
  .do-table tbody tr:hover { background: #f8fafc; }
  .do-table tbody tr:nth-child(even) { background: #fafbfc; }
  .do-table tbody tr:nth-child(even):hover { background: #f1f5f9; }
  .do-table td { padding: 4px 6px; color: #374151; text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .do-table-num { text-align: right !important; font-family: 'DM Mono', monospace; font-weight: 600; color: #1d4ed8 !important; }
  .do-table-left { text-align: left !important; }
  .do-table-empty { text-align: center; padding: 16px; color: #94a3b8; font-size: 11px; }
 
  /* ── Checkbox ── */
  .do-checkbox-row { display: flex; align-items: center; gap: 5px; }
  .do-checkbox-label { font-size: 10px; font-weight: 600; color: #475569; white-space: nowrap; }
 
  /* ── Popup ── */
  .do-popup-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.55); backdrop-filter: blur(3px);
    display: flex; align-items: center; justify-content: center; z-index: 999; padding: 16px;
  }
  .do-popup {
    background: #fff; border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    width: 100%; max-width: 420px; overflow: hidden;
  }
  .do-popup-header {
    background: linear-gradient(135deg, #0f1f3d, #1a3560); border-bottom: 2px solid #e2c97e;
    padding: 10px 14px; display: flex; align-items: center; justify-content: space-between;
  }
  .do-popup-title { font-size: 12px; font-weight: 700; color: #e2c97e; }
  .do-popup-close {
    width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;
    background: rgba(255,255,255,0.15); border: none; border-radius: 5px;
    cursor: pointer; color: #fff; font-size: 15px; transition: background 0.15s;
  }
  .do-popup-close:hover { background: rgba(255,255,255,0.25); }
  .do-popup-body { padding: 14px; display: flex; flex-direction: column; gap: 9px; }
  .do-popup-footer { padding: 9px 14px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 7px; }
 
  /* ── Audit ── */
  .do-audit {
    display: flex; align-items: center; gap: 12px;
    font-size: 10px; color: rgba(255,255,255,0.55);
  }
  .do-audit strong { color: rgba(255,255,255,0.85); }
 
  /* ── Voucher row ── */
  .do-voucher-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    padding: 5px 8px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 7px;
    width: 100%;
  }
 
  /* ── Reports row ── */
  .do-reports-row {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    align-items: center;
    width: 100%;
  }
 
  /* ── Balance / GST ── */
  .do-inline-row { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; width: 100%; }
  .do-balance-chip {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 10px; font-weight: 700; padding: 2px 7px;
    border-radius: 20px; white-space: nowrap; flex-shrink: 0;
  }
  .do-balance-cr { background: #d1fae5; color: #065f46; border: 1px solid #6ee7b7; }
  .do-balance-dr { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
  .do-gst-chip {
    display: inline-flex; align-items: center;
    font-size: 10px; font-weight: 600; padding: 2px 7px;
    border-radius: 20px; background: #eff6ff; color: #1d4ed8;
    border: 1px solid #bfdbfe; font-family: 'DM Mono', monospace;
    white-space: nowrap; flex-shrink: 0;
  }
 
  /* ── Amount row ── */
  .do-amt-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 5px; width: 100%; }
 
  /* ── Loading ── */
  .do-loading-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center; z-index: 9999;
  }
  .do-loading-box { background: #fff; border-radius: 14px; padding: 28px; box-shadow: 0 24px 64px rgba(0,0,0,0.3); }
 
  /* ── Misc ── */
  .do-bank-pill {
    display: inline-flex; align-items: center; gap: 4px;
    background: #fefce8; border: 1px solid #fde68a; border-radius: 5px;
    padding: 2px 8px; font-size: 10px; font-weight: 600; color: #78350f;
  }
  .do-docno {
    display: inline-flex; align-items: center; gap: 5px;
    background: linear-gradient(135deg, #eff6ff, #dbeafe);
    border: 1px solid #93c5fd; border-radius: 5px;
    padding: 2px 10px; font-size: 13px; font-weight: 700;
    color: #1d4ed8; font-family: 'DM Mono', monospace;
  }
 
  /* ════════════════════════════
     MOBILE SINGLE CARD
     ════════════════════════════ */
 
  /* Hide desktop layout on mobile */
  @media (max-width: 640px) {
    .do-desktop-only { display: none !important; }
    .do-mobile-only  { display: flex !important; }
 
    .do-main-grid {
      display: none !important;
    }
 
    .do-mobile-card-wrap {
      padding: 5px 5px 80px;
    }
 
    /* Mobile single unified card */
    .do-mobile-card {
      background: #fff;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      overflow: hidden;
      width: 100%;
    }
    .do-mobile-section {
      padding: 8px 10px;
      border-bottom: 1px solid #f1f5f9;
    }
    .do-mobile-section:last-child { border-bottom: none; }
    .do-mobile-section-title {
      font-size: 9px;
      font-weight: 800;
      color: #1e40af;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .do-mobile-section-title::after {
      content: '';
      flex: 1;
      height: 1px;
      background: linear-gradient(90deg, #bfdbfe, transparent);
    }
 
    /* Mobile action bar scrolls horizontally */
    .do-action-nav-row {
      flex-wrap: nowrap;
      overflow-x: auto;
      padding: 5px 8px;
      gap: 4px;
    }
    .do-action-nav-row::-webkit-scrollbar { height: 2px; }
 
    .do-topbar-inner { padding: 4px 8px; gap: 5px; }
    .do-title { font-size: 11px; }
    .do-docno { font-size: 11px; padding: 2px 7px; }
 
    /* Voucher chip row wraps on mobile */
    .do-voucher-row { flex-direction: column; align-items: stretch; }
    .do-voucher-row .do-chip-doc { justify-content: space-between; }
 
    /* Reports row: 2 per row */
    .do-reports-row { gap: 4px; }
    .do-reports-row .do-btn { flex: 1 1 calc(50% - 4px); justify-content: center; }
 
    .do-amt-row { gap: 5px; }
    .do-amtbox { min-width: calc(50% - 4px); }
 
    /* mobile grids */
    .do-mobile-g2 { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 5px; width: 100%; }
    .do-mobile-g3 { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 5px; width: 100%; }
  }
 
  /* Show mobile card only on mobile */
  .do-mobile-only { display: none; }
 
  /* ── Tablet ── */
  @media (max-width: 1024px) and (min-width: 641px) {
    .do-main-grid {
      grid-template-columns: 1fr;
      padding: 5px 6px 12px;
    }
    .do-g5, .do-g6 { grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); }
    .do-g4 { grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); }
    .do-g3 { grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); }
  }

@media (max-width: 640px) {
    .do-desktop-only { display: none !important; }
    .do-mobile-only  { display: flex !important; }

    .do-main-grid {
      display: none !important;
    }

    .do-mobile-card-wrap {
      padding: 5px 5px 80px;
    }
  
 
  /* Very small phones */
  @media (max-width: 380px) {
    .do-mobile-g2,
    .do-mobile-g3 { grid-template-columns: 1fr; }
    .do-reports-row .do-btn { flex: 1 1 100%; }
  }
`;

const CollapsibleCard = ({ icon, title, children, defaultOpen = true, badge = null }) => {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className="do-card">
      <div className="do-card-header" onClick={() => setOpen(o => !o)}
        style={{ cursor: "pointer", userSelect: "none" }}>
        <span className="do-card-icon">{icon}</span>
        <span className="do-card-title">{title}</span>
        {badge !== null && badge > 0 && <span className="do-card-badge">{badge}</span>}
        <span style={{ marginLeft: "auto", color: "#e2c97e", fontSize: 11, fontWeight: 700 }}>
          {open ? "▲" : "▼"}
        </span>
      </div>
      {open && <div className="do-card-body">{children}</div>}
    </div>
  );
};


const FL = ({ children, required }) => (
  <span className="do-label" style={required ? {} : {}}>
    {children}{required && <span style={{ color: "#e53e3e", marginLeft: 2 }}>*</span>}
  </span>
);

const Field = ({ label, children, className = "", required = false, style = {} }) => (
  <div className={`do-field ${className}`} style={style}>
    <FL required={required}>{label}</FL>
    {children}
  </div>
);

const DInput = ({ id, name, value, onChange, onKeyDown, disabled, placeholder, type = "text", inputProps = {}, style = {}, className = "" }) => (
  <input
    id={id} name={name} value={value} onChange={onChange}
    onKeyDown={onKeyDown} disabled={disabled} placeholder={placeholder}
    type={type} style={style} {...inputProps}
    className={`do-input ${className}`}
  />
);

const DDate = ({ id, name, value, onChange, disabled }) => (
  <input type="date" id={id} name={name} value={value} onChange={onChange} disabled={disabled}
    className="do-date" />
);

const DSelect = ({ id, name, value, onChange, disabled, children }) => (
  <select id={id} name={name} value={value} onChange={onChange} disabled={disabled}
    className="do-select">
    {children}
  </select>
);

const Divider = ({ label }) => (
  <div className="do-divider">
    {label && <span className="do-divider-label">{label}</span>}
    <div className="do-divider-line" />
  </div>
);

const Btn = ({ onClick, disabled, children, variant = "primary", style = {} }) => (
  <button type="button" onClick={!disabled ? onClick : undefined} disabled={disabled}
    className={`do-btn do-btn-${variant}`} style={style}>
    {children}
  </button>
);

const BalanceChip = ({ balance, formatFn }) => {
  const val = parseFloat(balance);
  if (!balance || isNaN(val) || val === 0) return null;
  const isCredit = val < 0;
  return (
    <span className={`do-balance-chip ${isCredit ? "do-balance-cr" : "do-balance-dr"}`}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: isCredit ? "#059669" : "#dc2626", display: "inline-block" }} />
      {formatFn(Math.abs(val))} {isCredit ? "Cr" : "Dr"}
    </span>
  );
};

const GSTChip = ({ gst }) => !gst ? null : (
  <span className="do-gst-chip">{gst}</span>
);

const AmtBox = ({ label, value, color = "blue" }) => (
  <div className={`do-amtbox do-amtbox-${color}`}>
    <span className="do-amtbox-label">{label}</span>
    <span className={`do-amtbox-val-${color}`}>{value}</span>
  </div>
);

// ─────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────

const DeliveryOrder = () => {

  const companyCode = sessionStorage.getItem("Company_Code");
  const Year_Code = sessionStorage.getItem("Year_Code");
  const CompanyparametrselfAc = sessionStorage.getItem("SELF_AC");
  const CompanyparametrselfAcid = sessionStorage.getItem("Self_acid");
  const username = sessionStorage.getItem("username");
  const TCSApplication = sessionStorage.getItem("TCSApplicable");
  const User_Id = sessionStorage.getItem("User_ID");
  const Company_Name = sessionStorage.getItem("Company_Name")
  const [partylock, setpartylock] = useState(false);
  const [partylockpurchase, setpartylockPurchase] = useState(false);
  const [updateButtonClicked, setUpdateButtonClicked] = useState(false);
  const [saveButtonClicked, setSaveButtonClicked] = useState(false);
  const [addOneButtonEnabled, setAddOneButtonEnabled] = useState(false);
  const [saveButtonEnabled, setSaveButtonEnabled] = useState(true);
  const [cancelButtonEnabled, setCancelButtonEnabled] = useState(true);
  const [editButtonEnabled, setEditButtonEnabled] = useState(false);
  const [deleteButtonEnabled, setDeleteButtonEnabled] = useState(false);
  const [backButtonEnabled, setBackButtonEnabled] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [highlightedButton, setHighlightedButton] = useState(null);
  const [cancelButtonClicked, setCancelButtonClicked] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [lastTenderDetails, setLastTenderDetails] = useState([]);
  const [lastTenderData, setLastTenderData] = useState({});
  const [accountCode, setAccountCode] = useState("");
  const [gstCode, setGstCode] = useState("");
  const [gstRate, setGstRate] = useState("");
  const [getpassstatecode, setgetpassstatecode] = useState("");
  const [getpassstatecodename, setgetpassstatecodename] = useState("");
  const [voucherbystatename, setvoucherbystatename] = useState("");
  const [voucherbystatecode, setvoucherbystatecode] = useState("");
  const [millstatecode, setmillstatecode] = useState("");
  const [millstatename, setmillstatename] = useState("");
  const [salebilltostatecode, setsalebilltostatecode] = useState("");
  const [salebilltostatename, setsalebilltostatename] = useState("");
  const [transportstatecode, setTransportStateCode] = useState("");
  const [transportstatename, settransportstatename] = useState("");
  const [itemSelect, setItemSelect] = useState("");
  const [itemSelectAccoid, setItemSelectAccoid] = useState("");
  const [itemSelectname, setItemSelectname] = useState("");
  const [brandCode, setBrandCode] = useState("");
  const [brandCodeAccoid, setBrandCodeAccoid] = useState("");
  const [millcode, setmillcode] = useState("");
  const [millcodeacid, setmillcodeacid] = useState("");
  const [millcodename, setmillcodename] = useState("");
  const [getpasscode, setgetpasscode] = useState("");
  const [getpasscodeacid, setgetpasscodeacid] = useState("");
  const [getpasscodename, setgetpasscodename] = useState("");
  const [voucherbycode, setvoucherbycode] = useState("");
  const [voucherbycodeacid, setvoucherbycodeeacid] = useState("");
  const [voucherbycodename, setvoucherbycodename] = useState("");
  const [salebilltocode, setsalebilltocode] = useState("");
  const [salebilltocodeacid, setsalebilltocodeacid] = useState("");
  const [salebilltocodename, setsalebilltocodename] = useState("");
  const [transportcode, settransportcode] = useState("");
  const [transportcodeacid, settransportcodeacid] = useState("");
  const [transportcodename, settransportcodename] = useState("");
  const [brokercode, setbrokercode] = useState("");
  const [brokercodeacid, setbrokercodeacid] = useState("");
  const [brokercodename, setbrokercodename] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [bankcode, setbankcode] = useState("");
  const [bankcodeacoid, setbankcodeacid] = useState("");
  const [bankcodeacname, setbankcodeacname] = useState("");
  const [DOcode, setDOcode] = useState("");
  const [DOcodeacoid, setDOcodeacid] = useState("");
  const [DOcodeacname, setDOcodeacname] = useState("");
  const [TDSACcode, setTDSACcode] = useState("");
  const [TDSACcodeacoid, setTDSACcodeacid] = useState("");
  const [TDSACcodeacname, setTDSACcodeacname] = useState("");
  const [vasuliaccode, setvasuliaccode] = useState("");
  const [Tvasuliaccodeacoid, setvasuliaccodeacid] = useState("");
  const [vasuliaccodeacname, setvasuliaccodeacname] = useState("");
  const [BPaccode, setBPaccode] = useState("");
  const [BPaccodeacoid, setBPaccodeacid] = useState("");
  const [BPaccodeacname, setBPaccodeacname] = useState("");
  const [Tenderno, setTenderno] = useState("");
  const [Tenderid, setTenderid] = useState("");
  const [Carporateno, setCarporateno] = useState("");
  const [selectedUser, setSelectedUser] = useState({});
  const [deleteMode, setDeleteMode] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [users, setUsers] = useState([]);
  const [tenderDetails, setTenderDetails] = useState({});
  const [detailRecords, setDetailRecords] = useState([]);
  const [Gst_Rate, setGstRatecode] = useState(0.00);
  const [matchStatus, setMatchStatus] = useState(null);
  const [GSTMemoGstcode, setGSTMemoGstcode] = useState("");
  const [GSTMemoGstrate, setGSTMemoGstrate] = useState("");
  const [pdspartystatecode, setpdspartystatecode] = useState("");
  const [pdsBilltostatecode, setpdsBilltostatecode] = useState("");
  const [PDSType, setPDSType] = useState("");
  const [PDSParty, setPDSParty] = useState("");
  const [PDSUnit, setPDSUnit] = useState("");
  const [CarporateState, setCarporateState] = useState({});
  const [ChangeData, setChangeData] = useState(false);
  const [pendingDOData, setPendingDOData] = useState("");
  const [grade, setGrade] = useState("");
  const [carporatebilltocode, setcarporatebilltocode] = useState("");
  const [carporatebilltocodeacid, setcarporatebilltocodeacid] = useState("");
  const [carporatebilltocodename, setcarporatebilltocodename] = useState("");
  const [Autopurchase, setAutopurchase] = useState("");
  const [isInputDisabled, setIsInputDisabled] = useState(false);
  const [popupMode, setPopupMode] = useState("add");
  const [isOpenEInvoice, setIsOpenEInvoice] = useState(false);
  const [isOpenEwayBill, setIsOpenEwayBill] = useState(false);
  const [isOpenEInvoiceEwaybill, setIsOpenEInvoiceEwaybill] = useState(false);
  const [godown_Code, setGoDownCode] = useState('')
  const [godownId, setGodownId] = useState('')
  const [godownName, setGodownName] = useState('')
  const [billToManuallySet, setBillToManuallySet] = useState(false);
  let [millBalance, setMillBalance] = useState(0)
  let [billToBalance, setBillToBalance] = useState(0)
  let [shipToBalance, setShipToBalance] = useState(0)
  let [billToGSTNo, setBillToGSTNo] = useState('')
  let [shipToGSTNo, setShipToGSTNo] = useState('')
  const [utrNo, setUTRNo] = useState('')
  const [utrCompanyCode, setUTRCompanyCode] = useState('')
  const [utrYearCode, setUTRYearCode] = useState('')
  const [detailRows, setDetailRows] = useState([]);
  const [formData, setFormData] = useState(initialFormData);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const quantalRef = useRef(null);
  const shipToRef = useRef(null);
  const addButtonRef = useRef(null);
  const firstInputRef = useRef(null);
  const setFocusToFirstField = () => { if (firstInputRef.current) firstInputRef.current.focus(); };

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // ── All original useEffect and handlers preserved exactly ──

  useEffect(() => {
    const hideFooterOnMobile = () => {
      if (isMobile) {
        const styleId = "mobile-footer-hide-style";
        let styleElement = document.getElementById(styleId);
        if (!styleElement) {
          styleElement = document.createElement("style");
          styleElement.id = styleId;
          styleElement.innerHTML = `footer,.footer,[class*="Footer"],[class*="footer"],.MuiDrawer-paper~footer,.MuiAppBar-root~footer,.main-footer,.app-footer,.page-footer{display:none!important;visibility:cen!important;opacity:0!important;height:0!important;overflow:hidden!important;pointer-events:none!important;}`;
          document.head.appendChild(styleElement);
        }
      } else {
        const styleElement = document.getElementById("mobile-footer-hide-style");
        if (styleElement) styleElement.remove();
      }
    };
    hideFooterOnMobile();
    return () => { const s = document.getElementById("mobile-footer-hide-style"); if (s) s.remove(); };
  }, [isMobile]);

  const handleChange = async (event) => {
    const { name, value } = event.target;
    const updatedValue = name === "truck_no" ? formatTruckNumber(value) : value;
    let finalValue = updatedValue;
    const numericFields = ['PurchaseTDSRate', 'SaleTDSRate'];
    if (numericFields.includes(name) && updatedValue === '') finalValue = '0';
    let updatedFormData = { ...formData, [name]: finalValue };
    if (name === 'doc_date') {
      updatedFormData = { ...updatedFormData, doc_date: value, Do_DATE: value, Purchase_Date: value, newsbdate: value };
    }
    updatedFormData = await calculateDependentValues(name, finalValue, updatedFormData, matchStatus, Gst_Rate);
    setFormData(() => ({ ...updatedFormData, [name]: finalValue }));
    setFormDataDetail((prevState) => ({ ...prevState, Amount: updatedFormData.Mill_AmtWO_TCS }));
    setUsers((prevUsers) => prevUsers.map((user) => ({ ...user, Amount: updatedFormData.Mill_AmtWO_TCS })));
  };

  const { isRecordLockedByUser, lockRecord, unlockRecord } = useRecordLocking(
    formData.doc_no, undefined, companyCode, Year_Code, "do"
  );

  const [formDataDetail, setFormDataDetail] = useState({
    ddType: "T", Narration: "Transfer Letter", Amount: 0.00,
    UTR_NO: "", UtrYearCode: "", UtrCompanyCode: "", utrdetailid: "", detail_Id: 1, LTNo: 0
  });

  const location = useLocation();
  const selectedRecord = location.state?.selectedRecord;
  const selectedRecordPendingDo = location.state?.selectedRecordPendingDo;
  const permissions = location.state?.permissionsData;
  const searchParams = new URLSearchParams(location.search);
  const navigatedRecord = searchParams.get('navigatedRecord');

  const handlemill_code = async (code, accoid, name, mobileno, GSTNO, TDsApplicable, gststatecode, cityname, gstname) => {
    setmillcode(code); setmillcodeacid(accoid); setmillcodename(name);
    setmillstatecode(gststatecode); setmillstatename(gstname);
    setFormData({ ...formData, mill_code: code, mc: accoid, MillGSTStateCode: gststatecode });
    if (code) { const { balance, gstNo } = await fetchAccountBalance(code); if (balance !== null) setMillBalance(balance); }
    else setMillBalance(0);
  };

  const handleUTRNo = (row) => {
    if (!row || typeof row !== "object") {
      setUTRNo(""); setUTRCompanyCode(null); setUTRYearCode(null);
      setFormDataDetail(prev => ({ ...prev, UTR_NO: "", UtrYearCode: "", utrdetailid: 0, UtrCompanyCode: "", LTNo: 0, detail_Id: prev?.detail_Id ?? 1 }));
      return;
    }
    setUTRNo(String(row?.doc_no ?? "")); setUTRCompanyCode(row?.Company_Code ?? ""); setUTRYearCode(row?.Year_Code ?? "");
    setFormDataDetail(prev => ({ ...prev, ddType: "T", Narration: row?.utr_no || "", UTR_NO: String(row?.doc_no ?? ""), UtrYearCode: row?.Year_Code ?? "", utrdetailid: row?.utrdetailid ?? 0, UtrCompanyCode: row?.Company_Code ?? "", LTNo: row?.lot_no ?? 0, detail_Id: prev?.detail_Id ?? 1 }));
  };

  const handlePurcno = (Tenderno, Tenderid) => {
    setTenderno(Tenderno); setTenderid(Tenderid);
    const Dispatch_type = tenderDetails.DT === "D" ? formData.desp_type === "DO" : "DI";
    setFormData({ ...formData, desp_type: Dispatch_type, purc_no: Tenderno, purc_order: Tenderid });
    setTimeout(() => { formData.voucher_by === 2 ? shipToRef.current?.focus() : quantalRef.current?.focus(); }, 0);
  };

  const handleCarporate = (Carporateno) => { setCarporateno(Carporateno); setFormData({ ...formData, Carporate_Sale_No: Carporateno }); };
  const handleDO = (code, accoid, name) => { setDOcode(code); setDOcodeacid(accoid); setDOcodeacname(name); setFormData({ ...formData, DO: code, docd: accoid }); };
  const handleMemoGSTRate = (code, rate) => { setGSTMemoGstcode(code); setGSTMemoGstrate(rate); setFormData({ ...formData, MemoGSTRate: code, newMemoGSTRate: code, lblMemoGSTRatename: rate }); };

  const handlevoucher_by = async (code, accoid, name, mobileno, GSTNO, TDsApplicable, gststatecode, cityname, gstname) => {
    tenderDetails.shiptostatename = ''; tenderDetails.shiptostatecode = ''; tenderDetails.buyeridcitystate = ''; tenderDetails.buyergststatecode = '';
    if (!code) {
      setvoucherbycode(''); setvoucherbycodeeacid(''); setvoucherbycodename(''); setvoucherbystatecode(''); setvoucherbystatename(''); setShipToGSTNo(''); setShipToBalance(0); setBillToBalance(0);
      tenderDetails.shiptostatename = ''; tenderDetails.shiptostatecode = '';
      if (!billToManuallySet) {
        setsalebilltocode(''); setBillToGSTNo(''); lblsalebilltoname = ''; newSaleBillTo = ''; salebillTitle = ''; carporatenameTitle = '';
        tenderDetails.Buyer = ''; tenderDetails.buyername = ''; tenderDetails.buyeridcitystate = ''; tenderDetails.buyergststatecode = '';
      }
      setFormData({ ...formData, voucher_by: '', vb: '', VoucherbyGstStateCode: '', st: '', SaleBillTo: '', sb: '', SalebilltoGstStateCode: '' });
      return;
    }
    setvoucherbycode(code); setvoucherbycodeeacid(accoid); setvoucherbycodename(name); setvoucherbystatecode(gststatecode); setvoucherbystatename(gstname); setShipToGSTNo(GSTNO);
    let updatedFormData = { ...formData, voucher_by: code, vb: accoid, VoucherbyGstStateCode: gststatecode, st: accoid };
    if (!billToManuallySet) {
      setsalebilltocode(code); setBillToGSTNo(GSTNO); lblsalebilltoname = name; newSaleBillTo = code; salebillTitle = name;
      tenderDetails.Buyer = code; tenderDetails.buyername = name; updatedFormData.SaleBillTo = code; updatedFormData.sb = accoid; updatedFormData.SalebilltoGstStateCode = gststatecode;
    }
    setFormData(updatedFormData);
    if (code) { const { balance, gstNo } = await fetchAccountBalance(code); if (balance !== null) { setShipToBalance(balance); if (String(formData.GETPASSCODE) !== String(formData.SaleBillTo)) setBillToBalance(balance); } }
    else { setShipToBalance(0); setBillToBalance(0); }
  };

  const handlebroker = (code, accoid, name) => { setbrokercode(code); setbrokercodeacid(accoid); setbrokercodename(name); setFormData({ ...formData, broker: code, bk: accoid }); };

  const handletransport = (code, accoid, name, mobileno, GSTNO, TDsApplicable, gststatecode, cityname, gstname) => {
    if (!code) {
      settransportcode(''); settransportcodename(''); settransportcodeacid(''); setTransportStateCode(''); settransportstatename('');
      setFormData((prevFormData) => ({ ...prevFormData, transport: '', tc: '', TransportGSTStateCode: '' }));
      return;
    }
    settransportcode(code); settransportcodename(name); settransportcodeacid(accoid); setTransportStateCode(gststatecode); settransportstatename(gstname);
    setFormData((prevFormData) => ({ ...prevFormData, transport: code, tc: accoid, TransportGSTStateCode: gststatecode }));
  };

  const handleGrade = (name) => { setGrade(name); setFormData({ ...formData, grade: name }); };
  const handleGradeUpdate = (grade) => { setFormData((prevFormData) => ({ ...prevFormData, grade: grade })); };

  const handleGETPASSCODE = (code, accoid, name, mobileno, GSTNO, TDsApplicable, gststatecode, cityname, State_Name) => {
    if (!code) {
      setgetpasscode(''); setgetpasscodeacid(''); setgetpasscodename(''); setgetpassstatecode(''); setgetpassstatecodename('');
      tenderDetails.Getpassnonamestatename = ''; tenderDetails.Getpassnonamestatecode = '';
      setFormData({ ...formData, GETPASSCODE: '', gp: '', GetpassGstStateCode: '' });
      return;
    }
    setgetpasscode(code); setgetpasscodeacid(accoid); setgetpasscodename(name); setgetpassstatecode(gststatecode); setgetpassstatecodename(State_Name);
    setFormData({ ...formData, GETPASSCODE: code, gp: accoid, GetpassGstStateCode: gststatecode });
  };

  const handleSBGenerate = async (e) => {
    e.preventDefault();
    const result = await Swal.fire({ title: 'Are you sure?', text: 'Do you want to generate the sale bill?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Yes, generate it!', cancelButtonText: 'No, cancel', reverseButtons: true });
    if (result.isConfirmed) {
      try {
        setIsLoading(true);
        const saleid = lastTenderData.saleid; const Dono = lastTenderData.doc_no; const Companycode = lastTenderData.company_code; const Yearcode = lastTenderData.Year_Code;
        const updateApiUrl = `${API_URL}/Generate_SaleBill?DoNo=${Dono}&CompanyCode=${Companycode}&Year_Code=${Yearcode}&saleid=${saleid}`;
        await axios.put(updateApiUrl);
        Swal.fire({ title: "Success!", text: "Sale Bill Genrate Sucessfully!", icon: "success", confirmButtonText: "OK" });
        const fetchApiUrl = `${API_URL}/DOByid?company_code=${Companycode}&doc_no=${Dono}&Year_Code=${Yearcode}`;
        const response2 = await axios.get(fetchApiUrl);
        CommonFeilds(response2.data);
        setIsEditing(false); setIsLoading(false);
      } catch (error) {
        console.error("Error updating data:", error);
        if (error.response && error.response.status === 400) { Swal.fire({ title: "Error", text: error.response.data.error || "An error occurred.", icon: "error", confirmButtonText: "OK" }); }
        else toast.error("Failed to update data.");
        setIsLoading(false);
      } finally { setIsLoading(false); }
    }
  };

  const handleSaleBillTo = async (code, accoid, name, mobileno, GSTNO, TDsApplicable, gststatecode, cityname, State_Name) => {
    setBillToManuallySet(true); tenderDetails.buyeridcitystate = ''; tenderDetails.buyergststatecode = '';
    if (!code) {
      setsalebilltocode(''); setsalebilltocodeacid(''); setsalebilltocodename(''); setsalebilltostatecode(''); setsalebilltostatename(''); setBillToGSTNo(''); setBillToBalance(0);
      SaleBillByCode = 0; SaleBillByName = ''; tenderDetails.buyeridcitystate = ''; tenderDetails.buyergststatecode = '';
      setFormData({ ...formData, SaleBillTo: '', sb: '', SalebilltoGstStateCode: 0 }); return;
    }
    setsalebilltocode(code); setsalebilltocodeacid(accoid); setsalebilltocodename(name); setsalebilltostatecode(gststatecode); setsalebilltostatename(State_Name); setBillToGSTNo(GSTNO);
    setFormData({ ...formData, SaleBillTo: code, sb: accoid, SalebilltoGstStateCode: gststatecode, sale_rate: code === formData.GETPASSCODE ? formData.PurchaseRate : formData.sale_rate });
    if (code) { const { balance, gstNo } = await fetchAccountBalance(code); if (balance !== null) setBillToBalance(balance); }
    else setBillToBalance(0);
  };

  const handlecarporate_ac = (code, accoid, name, mobileno, GSTNO, TDsApplicable, gststatecode, cityname, State_Name) => {
    setcarporatebilltocode(code); setcarporatebilltocodeacid(accoid); setcarporatebilltocodename(name);
    CarporatestatecodeGSTStateCode = gststatecode;
    setFormData({ ...formData, carporate_ac: code, ca: accoid });
  };

  const handleVasuli_Ac = (code, accoid, name) => { setvasuliaccode(code); setvasuliaccodeacid(accoid); setvasuliaccodeacname(name); setFormData({ ...formData, Vasuli_Ac: code, va: accoid }); };
  const handleGstRateCode = (code, rate, name, gstid) => { setGstCode(code); setGstRatecode(rate); setFormData({ ...formData, GstRateCode: code, gstid: gstid }); };
  const handleGetpassGstStateCode = (code, name, gst) => { setgetpassstatecode(code); setgetpassstatecodename(name); setFormData({ ...formData, GetpassGstStateCode: code }); };
  const handleVoucherbyGstStateCode = (code, name) => { setvoucherbystatecode(code); setvoucherbystatename(name); setFormData({ ...formData, VoucherbyGstStateCode: code }); };
  const handleSalebilltoGstStateCode = (code, name) => { setsalebilltostatecode(code); setsalebilltostatename(name); setFormData({ ...formData, SalebilltoGstStateCode: code }); };
  const handleMillGSTStateCode = (code, name) => { setmillstatecode(code); setmillstatename(name); setFormData({ ...formData, MillGSTStateCode: code }); };
  const handleTransportGSTStateCode = (code, name) => { setTransportStateCode(code); settransportstatename(name); setFormData({ ...formData, TransportGSTStateCode: code }); };
  const handlebrandcode = (code, accoid) => { setBrandCode(code); setBrandCodeAccoid(accoid); setFormData({ ...formData, brandcode: code }); };
  const handleCashDiffAc = (code, accoid, name) => { setBPaccode(code); setBPaccodeacid(accoid); setBPaccodeacname(name); setFormData({ ...formData, CashDiffAc: code, CashDiffAcId: accoid }); };
  const handleTDSAc = (code, accoid, name) => { setTDSACcode(code); setTDSACcodeacid(accoid); setTDSACcodeacname(name); setFormData({ ...formData, TDSAc: code, TDSAcId: accoid }); };
  const handleItemSelect = (code, accoid, name) => { setItemSelect(code); setItemSelectAccoid(accoid); setItemSelectname(name); setFormData({ ...formData, itemcode: code, ic: accoid }); };
  const handleGoDown = (code, accoid, name) => { setGoDownCode(code); setGodownId(accoid); setGodownName(name); setFormData({ ...formData, godownCode: code, godownId: accoid }); };
  const handleBankCode = (code, accoid, name) => { setbankcode(code); setbankcodeacid(accoid); setbankcodeacname(name); };

  const handleCarporateDetailsFetched = (details) => {
    setCarporateno(details.last_Carporate_data[0]);
    let SellingType = details.last_Carporate_data[0].SellingType;
    newGETPASSCODE = details.last_Carporate_data[0].getpassselfac;
    voucherTitle = details.last_Carporate_data[0].Unitname;
    salebillTitle = details.last_Carporate_data[0].partyName;
    brokerTitle = details.last_Carporate_data[0].BrokerName;
    getpassTitle = details.last_Carporate_data[0].getpassselfname;
    const newData = {
      quantal: details.last_Carporate_data[0].balance, PDSType: details.last_Carporate_data[0].SellingType,
      PDSParty: details.last_Carporate_data[0].Ac_Code, PDSUnit: details.last_Carporate_data[0].Unitcode,
      SaleBillTo: details.last_Carporate_data[0].Ac_Code, sb: details.last_Carporate_data[0].ac,
      narration4: details.last_Carporate_data[0].partyName, voucher_by: details.last_Carporate_data[0].Unitcode,
      lblvoucherByname: details.last_Carporate_data[0].getpassselfname, lblsalebilltoname: details.last_Carporate_data[0].partyName,
      lblbrokername: details.last_Carporate_data[0].BrokerName, gp: details.last_Carporate_data[0].getpassselfacid,
      vb: details.last_Carporate_data[0].Unitid, broker: details.last_Carporate_data[0].BrokerCode,
      bk: details.last_Carporate_data[0].br, sale_rate: details.last_Carporate_data[0].Sale_Rate,
      Delivery_Type: details.last_Carporate_data[0].DeliveryType, newGETPASSCODE: details.last_Carporate_data[0].getpassselfac,
      Tender_Commission: details.last_Carporate_data[0].CommissionRate, VoucherbyGstStateCode: details.last_Carporate_data[0].UnitSatecode,
      VoucherByName: details.last_Carporate_data[0].unitstatename, SalebilltoGstStateCode: details.last_Carporate_data[0].acstatecode,
      lblBilltostatename: details.last_Carporate_data[0].acstatename,
    };
    setCarporateState(newData); setChangeData(true);
    setFormData((prevState) => ({ ...prevState, ...newData }));
    return newData;
  };

  useEffect(() => {
    if (selectedRecord) handlerecordDoubleClicked();
    else if (navigatedRecord && !isNaN(navigatedRecord) && parseInt(navigatedRecord) > 0) handleNavigateRecord();
    else handleAddOne();
  }, [selectedRecord, navigatedRecord]);

  useEffect(() => { if (selectedRecordPendingDo) handlerecordDoubleClickedPendingDO(); }, [selectedRecordPendingDo]);

  useEffect(() => {
    if (isEditing || addOneButtonEnabled) {
      formData.voucher_by === 2 ? shipToRef.current?.focus() : quantalRef.current?.focus();
    }
  }, [formData.quantal]);

  const handleTenderWithoutCarpoDetailsFetched = async (details, event) => {
    let Carporate_Sale_No = formData.Carporate_Sale_No;
    let assingqntl = 0;
    let Dispatch_type = details.last_details_data[0].DT === "D" ? formData.desp_type === "DO" : "DI";
    if (Carporate_Sale_No === 0) assingqntl = Math.abs(details.last_details_data[0].BALANCE);
    else assingqntl = CarporateState.quantal;
    const purcRate = parseFloat(details.last_details_data[0].Party_Bill_Rate) || 0;
    const millRate = parseFloat(details.last_details_data[0].Mill_Rate) || 0;
    let rateWithGST = parseFloat((millRate * details.last_details_data[0].gstrate) / 100);
    const exciseRate = rateWithGST;
    const qtl = parseFloat(assingqntl) || 0;
    const rate = qtl !== 0 ? millRate + exciseRate : 0;
    const millamount = qtl * rate;
    season = details.last_details_data[0].season;
    if (Dispatch_type === "DI") {
      setFormDataDetail((prevData) => {
        const newDetailData = { ...prevData, ddType: "T", Narration: "Transfer Letter", Amount: millamount, detail_Id: 1, id: users.length > 0 ? Math.max(...users.map((user) => user.id)) + 1 : 1, Bank_Code: details.last_details_data[0].Payment_To, bc: details.last_details_data[0].pt, rowaction: "add" };
        const updatedUsers = users.map((user) => { if (user.rowaction === "add") return null; if (user.rowaction === "Normal") return { ...user, rowaction: "delete" }; return user; }).filter(Boolean);
        updatedUsers.push(newDetailData); setUsers(updatedUsers);
        return newDetailData;
      });
    }
    setAutopurchase(details.last_details_data[0].AutoPurchaseBill);
    if (Carporate_Sale_No === 0) {
      let rateWithGST2 = parseFloat(((details.last_details_data[0].MillRate * details.last_details_data[0].gstrate) / 100));
      const newData = {
        tenderid: details.last_details_data[0].tenderid, quantal: Math.abs(details.last_details_data[0].BALANCE),
        packing: details.last_details_data[0].Packing, bags: details.last_details_data[0].Bags,
        grade: details.last_details_data[0].Grade, gradeName: details.last_details_data[0].Grade,
        excise_rate: rateWithGST2, mill_rate: details.last_details_data[0].Mill_Rate,
        Tender_Commission: details.last_details_data[0].CR, sale_rate: details.last_details_data[0].Sale_Rate,
        narration4: details.last_details_data[0].buyername, tenderdetailid: details.last_details_data[0].tenderdetailid,
        PurchaseRate: details.last_details_data[0].Party_Bill_Rate, Delivery_Type: details.last_details_data[0].DT || "C",
        sb: details.last_details_data[0].buyerid, gp: details.last_details_data[0].Getpassnoid,
        ic: details.last_details_data[0].ic, bk: details.last_details_data[0].buyerpartyid,
        vb: details.last_details_data[0].buyerid, CashDiffAcId: details.last_details_data[0].buyerid,
        st: details.last_details_data[0].buyerid, docd: details.last_details_data[0].td,
        SaleBillTo: details.last_details_data[0].Buyer, GETPASSCODE: details.last_details_data[0].Getpassno,
        lblgetpasscodename: details.last_details_data[0].Getpassnoname, voucher_by: details.last_details_data[0].Buyer,
        lblvoucherByname: details.last_details_data[0].buyername, DO: details.last_details_data[0].Tender_DO,
        CashDiffAc: details.last_details_data[0].Buyer, itemcode: details.last_details_data[0].itemcode,
        GstRateCode: details.last_details_data[0].gstratecode, broker: details.last_details_data[0].Buyer_Party,
        SalebilltoGstStateCode: details.last_details_data[0].buyergststatecode, SaleBillByName: details.last_details_data[0].buyeridcitystate,
        VoucherbyGstStateCode: details.last_details_data[0].shiptostatecode, VoucherByName: details.last_details_data[0].shiptostatename,
        MillGSTStateCode: details.last_details_data[0].millstatecode, MillByName: details.last_details_data[0].millStatename,
        GetPassByName: details.last_details_data[0].Getpassnonamestatename, GetpassGstStateCode: details.last_details_data[0].Getpassnonamestatecode,
        Gst_Rate: details.last_details_data[0].gstrate, AutopurchaseBill: details.last_details_data[0].AutoPurchaseBill,
        desp_type: Dispatch_type, gstid: details.last_details_data[0].gstid,
        mill_rate: details.last_details_data[0].MillRate || details.last_details_data[0].Mill_Rate,
        gradeCode: details.last_details_data[0].gradeCode, gradeid: details.last_details_data[0].gradeid,
      };
      let updatedFormData = await calculateDependentValues('quantal', qtl, { ...formData, ...newData });
      setFormData((prevState) => ({ ...prevState, ...updatedFormData, amount: millamount }));
      setGstRatecode(details.last_details_data[0].gstrate);
      setTenderDetails(details.last_details_data[0]); setbankcode();
      if (details.last_details_data[0].Buyer) { const { balance, gstNo } = await fetchAccountBalance(details.last_details_data[0].Buyer); if (balance !== null) { setBillToBalance(balance); setBillToGSTNo(gstNo); } } else { setBillToBalance(0); setBillToGSTNo(''); }
      if (details.last_details_data[0].Buyer) { const { balance, gstNo } = await fetchAccountBalance(details.last_details_data[0].Buyer); if (balance !== null) { setShipToBalance(balance); setShipToGSTNo(gstNo); } } else { setShipToBalance(0); setShipToGSTNo(''); }
      return updatedFormData;
    }
  };

  const handleTenderDetailsFetched = async (details) => {
    setTenderDetails(details.last_details_data[0]);
    let Carporate_Sale_No = formData.Carporate_Sale_No;
    let assingqntl = 0;
    if (Carporate_Sale_No === 0) assingqntl = Math.abs(details.last_details_data[0].BALANCE);
    else assingqntl = CarporateState.quantal;
    const purcRate = parseFloat(details.last_details_data[0].Party_Bill_Rate) || 0;
    const exciseRate = parseFloat(details.last_details_data[0].Excise_Rate) || 0;
    const qtl = (assingqntl) || 0;
    const rate = qtl !== 0 ? purcRate + exciseRate : 0;
    const millamount = qtl * rate;
    setFormDataDetail((prevData) => {
      const newDetailData = { ...prevData, ddType: "T", Narration: "Transfer Letter", Amount: millamount, detail_Id: 1, id: users.length > 0 ? Math.max(...users.map((user) => user.id)) + 1 : 1, Bank_Code: details.last_details_data[0].Payment_To, bc: details.last_details_data[0].pt, rowaction: "add" };
      setUsers([newDetailData]);
    });
    if (Carporate_Sale_No != 0) {
      voucherTitle = CarporateState.lblvoucherByname; salebillTitle = CarporateState.lblsalebilltoname;
      brokerTitle = CarporateState.brokername; getpassTitle = CarporateState.getpassselfname;
      season = details.last_details_data[0].season;
      const newData = {
        packing: details.last_details_data[0].Packing, bags: details.last_details_data[0].Bags,
        grade: details.last_details_data[0].Grade, gradeName: details.last_details_data[0].Grade,
        excise_rate: details.last_details_data[0].Excise_Rate, narration4: details.last_details_data[0].buyername,
        tenderdetailid: details.last_details_data[0].tenderdetailid, PurchaseRate: details.last_details_data[0].Party_Bill_Rate,
        ic: details.last_details_data[0].ic, CashDiffAcId: details.last_details_data[0].buyerid,
        docd: details.last_details_data[0].td, itemcode: details.last_details_data[0].itemcode,
        GstRateCode: details.last_details_data[0].gstratecode, Gst_Rate: details.last_details_data[0].gstrate,
        newPurcno: details.last_details_data[0].Tender_No, SalebilltoGstStateCode: details.last_details_data[0].acstatecode,
        SaleBillByName: details.last_details_data[0].acstatename, VoucherbyGstStateCode: details.last_details_data[0].unitstatecode,
        VoucherByName: details.last_details_data[0].unitstatename, tenderid: details.last_details_data[0].tenderid,
        mill_rate: details.last_details_data[0].MillRate || details.last_details_data[0].Mill_Rate,
        gradeCode: details.last_details_data[0].gradeCode, gradeid: details.last_details_data[0].gradeid,
      };
      let updatedFormData = await calculateDependentValues('quantal', qtl, { ...formData, ...newData });
      setCarporateState(newData); setCarporateState((prevState) => ({ ...prevState, ...updatedFormData }));
      setFormData((prevState) => ({ ...prevState, ...updatedFormData }));
      setChangeData(true);
    }
    if (Carporate_Sale_No === "") {
      const newData = {
        quantal: Math.abs(details.last_details_data[0].BALANCE), packing: details.last_details_data[0].Packing,
        bags: details.last_details_data[0].Bags, grade: details.last_details_data[0].Grade,
        gradeName: details.last_details_data[0].Grade, excise_rate: details.last_details_data[0].Excise_Rate,
        Tender_Commission: details.last_details_data[0].Commission_Rate, sale_rate: details.last_details_data[0].Sale_Rate,
        narration4: details.last_details_data[0].buyername, tenderdetailid: details.last_details_data[0].tenderdetailid,
        PurchaseRate: details.last_details_data[0].Party_Bill_Rate, Delivery_Type: details.last_details_data[0].DT || "C",
        sb: details.last_details_data[0].buyerid, gp: details.last_details_data[0].buyerid,
        ic: details.last_details_data[0].ic, bk: details.last_details_data[0].buyerpartyid,
        vb: details.last_details_data[0].buyerid, st: details.last_details_data[0].buyerid,
        CashDiffAcId: details.last_details_data[0].buyerid, docd: details.last_details_data[0].td,
        SaleBillTo: details.last_details_data[0].Buyer, GETPASSCODE: details.last_details_data[0].Buyer,
        voucher_by: details.last_details_data[0].Buyer, lblvoucherByname: details.last_details_data[0].buyername,
        DO: details.last_details_data[0].Tender_DO, CashDiffAc: details.last_details_data[0].Buyer,
        itemcode: details.last_details_data[0].itemcode, GstRateCode: details.last_details_data[0].gstratecode,
        broker: details.last_details_data[0].Buyer_Party, SalebilltoGstStateCode: details.last_details_data[0].Buyer,
        VoucherbyGstStateCode: details.last_details_data[0].Buyer, GetpassGstStateCode: details.last_details_data[0].Buyer,
        Gst_Rate: details.last_details_data[0].gstrate,
        mill_rate: details.last_details_data[0].MillRate || details.last_details_data[0].Mill_Rate,
        gradeCode: details.last_details_data[0].gradeCode, gradeid: details.last_details_data[0].gradeid,
      };
      let updatedFormData = await calculateDependentValues('quantal', formData.quantal, { ...formData, ...newData });
      setFormData((prevState) => ({ ...prevState, ...updatedFormData }));
      assingqntl = "";
      return updatedFormData;
    }
  };

  const AmountCalculation = async (name, input, formData) => {
    let updatedFormData = { ...formData, [name]: input };
    updatedFormData.TCS_Rate = 0.00; updatedFormData.Sale_TCS_Rate = 0.00; updatedFormData.SaleTDSRate = 0.00; updatedFormData.PurchaseTDSRate = 0.00;
    let Amount = 0.00; let Amountf = 0.00; let SaleBillTo = updatedFormData.SaleBillTo; let Amt = 0.00; let SBBalAmt = 0.00;
    let gstRateExise = parseFloat(updatedFormData.excise_Rate) || 0.00;
    let saleRate = 0.00; let actualSaleRate = parseFloat(updatedFormData.sale_rate) || 0.00;
    let commision = parseFloat(updatedFormData.Tender_Commission) || 0.00; let insurance = parseFloat(updatedFormData.Insurance) || 0.00;
    let qt = parseFloat(updatedFormData.quantal) || 0.00; let SaleTDS = 0.00; let PurchaseTDS = 0.00;
    let PSAmt = 0.00; let PSBalAmt = 0.00; let PSRate = parseFloat(updatedFormData.PurchaseRate) || 0.00;
    let PSAmountf = 0.00; let PSAmount = 0.00;
    let purcno = updatedFormData.purc_no || Tenderno || newPurcno;
    let TCS_Rate = 0.00; let Sale_TCS_Rate = 0.00; let SaleTDSRateForSB = 0.00; let PurchaseTDSRateForPS = 0.00;
    const updateApiUrl = `${API_URL}/getAmountcalculationData?CompanyCode=${companyCode}&SalebilltoAc=${SaleBillTo}&Year_Code=${Year_Code}&purcno=${purcno}`;
    const response = await axios.get(updateApiUrl);
    const details = response.data;
    PSBalAmt = PSRate * qt; PSAmountf = parseFloat(details['PSAmt']); Amountf = details['SBAmt'];
    let balancelimit = parseFloat(details['Balancelimt']); PurchaseTDS = details['PurchaseTDSApplicable'];
    SaleTDS = details['SaleTDSApplicable']; PurchaseTDSRateForPS = isEditMode ? updatedFormData.PurchaseTDSRate : details['PurchaseTDSRate'];
    let TCSRate = details['TCSRate']; SaleTDSRateForSB = isEditMode ? updatedFormData.SaleTDSRate : details['SaleTDSRate'];
    let PurchaseSubTotalAmount = details['PurchaseSubTotalAmount']; let PurchaseTDSAmount = details["PurchaseTDSAmount"]; let SaleTDSAmount = details['SaleTDSAmount'];
    if (PSAmountf == 0) PSAmountf = 0.00;
    PSAmount = PSAmountf + PSBalAmt;
    if (!PurchaseTDS || PurchaseTDS == null) isPurchasePartyNULL = 'Y';
    if (PSAmount >= balancelimit) {
      if (PurchaseTDS == "P") { updatedFormData.PurchaseTDSRate = PurchaseTDSRateForPS; updatedFormData.TCS_Rate = 0.00; }
      if (PurchaseTDS == "N" || PurchaseTDS == "B") updatedFormData.PurchaseTDSRate = "0.00";
      if (PurchaseTDS == "Y" || PurchaseTDS == "T") { updatedFormData.PurchaseTDSRate = PurchaseTDSRateForPS; updatedFormData.TCS_Rate = 0.00; }
      if (PurchaseTDS == "U") Swal.fire({ title: "Warning", text: `Unregistered Person,Limit Exceeded over sale Limit !`, icon: "warning", confirmButtonText: "OK" });
      if (PurchaseTDS == "L") isPurchasePartyLock = 'Y';
    } else {
      if (PurchaseTDS == "U") Swal.fire({ title: "Warning", text: `Unregistered Person,Limit Exceeded over sale Limit !`, icon: "warning", confirmButtonText: "OK" });
      if (PurchaseTDS == "P") { updatedFormData.PurchaseTDSRate = PurchaseTDSRateForPS; updatedFormData.TCS_Rate = 0.00; }
      if (PurchaseTDS == "L") isPurchasePartyLock = 'N';
      if (PurchaseTDS == "Y" || PurchaseTDS == "T") { updatedFormData.PurchaseTDSRate = 0.00; PurchaseTDSRateForPS = 0.00; }
    }
    if (PurchaseTDS == "X") { updatedFormData.PurchaseTDSRate = 0.00; PurchaseTDSRateForPS = 0.00; }
    saleRate = parseFloat(updatedFormData.sale_rate) + parseFloat(updatedFormData.Tender_Commission) + parseFloat(updatedFormData.Insurance);
    SBBalAmt = (saleRate * gstRate) / 100 + saleRate * qt;
    if (Amountf == 0) Amountf = 0.00;
    Amountf = Amountf || 0.00; Amountf = parseFloat(Amountf);
    Amount = Amountf + SBBalAmt;
    if (!SaleTDS || SaleTDS == null) isSaleTDSPartyNULL = 'Y';
    if (Amount >= balancelimit) {
      if (SaleTDS == "Y" || SaleTDS == "B" || SaleTDS == "S") { updatedFormData.SaleTDSRate = SaleTDSRateForSB; updatedFormData.Sale_TCS_Rate = 0.00; }
      if (SaleTDS == "U") Swal.fire({ title: "Warning", text: `Unregistered Person,Limit Exceeded over sale Limit !`, icon: "warning", confirmButtonText: "OK" });
      if (SaleTDS == "T" || SaleTDS == "N") { updatedFormData.SaleTDSRate = 0.00; updatedFormData.Sale_TCS_Rate = 0.00; SaleTDSRateForSB = 0.0; }
      if (SaleTDS == "L") { updatedFormData.SaleTDSRate = SaleTDSRateForSB; updatedFormData.Sale_TCS_Rate = 0.00; isSalePartyLock = 'Y'; }
      if (SaleTDS == "X") { updatedFormData.SaleTDSRate = 0.00; updatedFormData.Sale_TCS_Rate = 0.00; SaleTDSRateForSB = 0.00; }
    } else {
      if (SaleTDS == "U") { updatedFormData.SaleTDSRate = 0.00; updatedFormData.Sale_TCS_Rate = 0.00; SaleTDSRateForSB = 0.0; }
      if (SaleTDS == "L") { updatedFormData.SaleTDSRate = 0.00; updatedFormData.Sale_TCS_Rate = 0.00; SaleTDSRateForSB = 0.00; isSalePartyLock = 'N'; }
      if (SaleTDS == "S") { updatedFormData.SaleTDSRate = SaleTDSRateForSB; updatedFormData.Sale_TCS_Rate = 0.00; }
      if (SaleTDS == "T" || SaleTDS == "N") { updatedFormData.SaleTDSRate = 0.00; updatedFormData.Sale_TCS_Rate = TCSRate; SaleTDSRateForSB = 0.00; }
      if (SaleTDS == "Y" || SaleTDS == "B") { updatedFormData.SaleTDSRate = 0.00; updatedFormData.Sale_TCS_Rate = 0.00; SaleTDSRateForSB = 0.00; }
      if (SaleTDS == "X") { updatedFormData.SaleTDSRate = 0.00; updatedFormData.Sale_TCS_Rate = 0.00; SaleTDSRateForSB = 0.00; }
    }
    if (TCSApplication == "N") { updatedFormData.Sale_TCS_Rate = 0.00; updatedFormData.TCS_Rate = 0.00; }
    return { updatedFormData, PSAmount, Amountf, balancelimit, PurchaseTDS, SaleTDS, TCSRate, PurchaseSubTotalAmount, PurchaseTDSAmount, SaleTDSAmount, SaleTDSRateForSB, PurchaseTDSRateForPS };
  };

  const calculatememogstrateamount = async (name, input, formData, GSTMemoGstrate, matchStatus) => {
    let updatedFormData = { ...formData, [name]: input };
    let rate = parseFloat(GSTMemoGstrate) || 0.0;
    let cgstrate = 0.0; let sgstrate = 0.0; let igstrate = 0.0;
    if (matchStatus === "TRUE") {
      cgstrate = (rate / 2).toFixed(2); sgstrate = (rate / 2).toFixed(2); igstrate = 0.0;
      updatedFormData.RCMCGSTAmt = ((updatedFormData.Memo_Advance * cgstrate) / 100).toFixed(2);
      updatedFormData.RCMSGSTAmt = ((updatedFormData.Memo_Advance * sgstrate) / 100).toFixed(2);
      updatedFormData.RCMIGSTAmt = 0.0;
    } else {
      cgstrate = 0.0; sgstrate = 0.0; igstrate = rate.toFixed(2);
      updatedFormData.RCMIGSTAmt = ((updatedFormData.Memo_Advance * igstrate) / 100).toFixed(2);
      updatedFormData.RCMCGSTAmt = 0.0; updatedFormData.RCMSGSTAmt = 0.0;
    }
    return updatedFormData;
  };

  const CommisionBillCalculation = async (name, input, formData, gstRate) => {
    formData = { ...formData, LV_CGSTAmount: 0.00, LV_SGSTAmount: 0.00, LV_IGSTAmount: 0.00, LV_TotalAmount: 0.00, LV_TCSRate: 0.00, LV_NETPayble: 0.00, LV_TCSAmt: 0.00, LV_TDSRate: 0.00, LV_TDSAmt: 0.00, LV_Igstrate: 0.00, LV_Cgstrate: 0.00, LV_taxableamount: 0.00, LV_Sgstrate: 0.00, LV_Commision_Amt: 0.00, LV_tender_Commision_Amt: 0.00 };
    let updatedFormData = { ...formData, [name]: input };
    let LV_tender_Commision_Amt = 0.00; let GSTRate = gstRate; let igstrate = 0.00; let sgstrate = 0.00; let cgstrate = 0.00;
    let DIFF_AMOUNT = parseFloat(updatedFormData.diff_amount) || 0.00; let MEMO_ADVANCE = parseFloat(updatedFormData.Memo_Advance) || 0.00;
    let taxableamount = parseFloat(DIFF_AMOUNT + MEMO_ADVANCE) || 0.00; let DiffMemo = parseFloat(DIFF_AMOUNT + MEMO_ADVANCE) || 0.00;
    let salebillto = updatedFormData.SaleBillTo;
    const matchStatus = await checkMatchStatus(salebillto, companyCode, Year_Code);
    let LV_CGSTAmount = 0.00; let LV_SGSTAmount = 0.00; let LV_IGSTAmount = 0.00; let LV_TotalAmount = 0.00; let LV_TCSRate = 0.00; let LV_NETPayble = 0.00; let LV_TCSAmt = 0.00; let LV_TDSRate = 0.00; let LV_TDSAmt = 0.00;
    if (DiffMemo != 0) {
      if (matchStatus == "TRUE") {
        sgstrate = (GSTRate / 2).toFixed(2); cgstrate = (GSTRate / 2).toFixed(2);
        LV_CGSTAmount = Math.round(parseFloat(((DIFF_AMOUNT + MEMO_ADVANCE) * cgstrate) / 100));
        LV_SGSTAmount = Math.round(parseFloat(((DIFF_AMOUNT + MEMO_ADVANCE) * sgstrate) / 100));
        igstrate = 0.00; LV_IGSTAmount = 0;
      } else {
        igstrate = GSTRate;
        LV_IGSTAmount = Math.round(parseFloat(((DIFF_AMOUNT + MEMO_ADVANCE) * igstrate) / 100));
        cgstrate = 0; sgstrate = 0; LV_SGSTAmount = 0.00; LV_CGSTAmount = 0.00;
      }
    }
    LV_TotalAmount = Math.round(parseFloat((DIFF_AMOUNT + MEMO_ADVANCE) + LV_CGSTAmount + LV_SGSTAmount + LV_IGSTAmount));
    LV_TCSRate = parseFloat(updatedFormData.Sale_TCS_Rate) || 0;
    LV_TCSAmt = Math.round(parseFloat((LV_TotalAmount * LV_TCSRate) / 100));
    LV_NETPayble = Math.round(parseFloat((LV_TotalAmount + LV_TCSAmt)));
    LV_TDSRate = parseFloat(updatedFormData.SaleTDSRate) || 0.00;
    LV_TDSAmt = parseFloat((LV_TotalAmount * LV_TDSRate) / 100);
    let LV_diff_rate = parseFloat(updatedFormData.diff_rate) || 0.00;
    let LV_Tender_Commission = parseFloat(updatedFormData.Tender_Commission) || 0.00;
    let LV_Commision_Amt = parseFloat(LV_diff_rate - LV_Tender_Commission);
    LV_tender_Commision_Amt = parseFloat(LV_tender_Commision_Amt * parseFloat(updatedFormData.quantal)) || 0.00;
    updatedFormData.LV_CGSTAmount = LV_CGSTAmount; updatedFormData.LV_SGSTAmount = LV_SGSTAmount; updatedFormData.LV_IGSTAmount = LV_IGSTAmount;
    updatedFormData.LV_TotalAmount = LV_TotalAmount; updatedFormData.LV_TCSRate = LV_TCSRate; updatedFormData.LV_NETPayble = LV_NETPayble;
    updatedFormData.LV_TCSAmt = LV_TCSAmt; updatedFormData.LV_TDSRate = LV_TDSRate; updatedFormData.LV_TDSAmt = LV_TDSAmt;
    updatedFormData.LV_Igstrate = igstrate; updatedFormData.LV_Cgstrate = cgstrate; updatedFormData.LV_Sgstrate = sgstrate;
    updatedFormData.LV_taxableamount = taxableamount; updatedFormData.LV_Commision_Amt = LV_Commision_Amt; updatedFormData.LV_tender_Commision_Amt = LV_tender_Commision_Amt;
    if (LV_NETPayble !== 0) updatedFormData.voucher_type = LV_NETPayble > 0 ? "LV" : "CV";
    return updatedFormData;
  };

  const PurchaseBillCalculation = async (name, input, formData, gstRate, TDSTCSData) => {
    let updatedFormData = { ...formData, [name]: input };
    formData = { ...formData, PS_CGSTAmount: 0.0, PS_SGSTAmount: 0.0, PS_IGSTAmount: 0.0, PS_CGSTRATE: 0.0, PS_SGSTRATE: 0.0, PS_IGSTRATE: 0.0, TOTALPurchase_Amount: 0.0, PSTCS_Amt: 0.0, PSTDS_Amt: 0.0, PSNetPayble: 0.0, PS_SelfBal: 0.0, PS_amount: 0.0 };
    let rate = gstRate; let DESP_TYPE = updatedFormData.desp_type; let Getpasscode = updatedFormData.GETPASSCODE;
    let SELFAC = CompanyparametrselfAc; let autopurchasebill = Autopurchase; let PaymentGst = tenderDetails.Payment_To || bankcodenew;
    let Purchase_Rate = parseFloat(updatedFormData.PurchaseRate); let qntl = parseFloat(updatedFormData.quantal);
    let PS_amount = 0; let PS_CGSTAmount = 0.0; let PS_SGSTAmount = 0.0; let PS_IGSTAmount = 0.0; let cgstrate = 0.0; let sgstrate = 0.0; let igstrate = 0.0;
    let TOTALPurchase_Amount = 0.0; let TCS_Amt = 0.0; let TDS_Amt = 0.0; let NetPayble = 0.0; let PS_SelfBal = 0.0;
    let PSgepasscode = updatedFormData.GETPASSCODE; let PSsalebillto = updatedFormData.SaleBillTo;
    let PSTCS_Amt = 0.0; let PSTDS_Amt = 0.0; let PSNetPayble = 0.0;
    let PurchaseTDSrate = updatedFormData.PurchaseTDSRate; let PSTCS_Rate = updatedFormData.TCS_Rate || 0.00;
    if (DESP_TYPE == "DI" && (Getpasscode == SELFAC || PDSType == "P")) {
      if (autopurchasebill == "Y") {
        updatedFormData.voucher_type = "PS"; PS_amount = Math.round(parseFloat(Purchase_Rate * qntl));
        if (PaymentGst == "" || PaymentGst == "0") PaymentGst = updatedFormData.mill_code;
        const matchStatus = await checkMatchStatus(PaymentGst, companyCode, Year_Code);
        if (matchStatus == "TRUE") { cgstrate = (rate / 2).toFixed(2); sgstrate = (rate / 2).toFixed(2); igstrate = 0.0; PS_CGSTAmount = Math.round(parseFloat((PS_amount * cgstrate) / 100)); PS_SGSTAmount = Math.round(parseFloat((PS_amount * sgstrate) / 100)); PS_IGSTAmount = 0; }
        else { cgstrate = 0; sgstrate = 0; igstrate = parseFloat(rate).toFixed(2); PS_CGSTAmount = 0; PS_SGSTAmount = 0; PS_IGSTAmount = Math.round(parseFloat((PS_amount * igstrate) / 100)); }
        TOTALPurchase_Amount = Math.round(parseFloat(PS_amount + PS_CGSTAmount + PS_SGSTAmount + PS_IGSTAmount));
        PSTCS_Amt = Math.round((parseFloat(TOTALPurchase_Amount) * PSTCS_Rate) / 100);
        PSTDS_Amt = Math.round((parseFloat(PS_amount) * PurchaseTDSrate) / 100);
        const details = TDSTCSData;
        let Amountf = details.PurchaseSubTotalAmount; let balancelimit = details.balancelimit; let SaleTDSAmount = details.PurchaseTDSAmount;
        PurchaseTDSrate = updatedFormData.PurchaseTDSRate !== 0 ? updatedFormData.PurchaseTDSRate : details.PurchaseTDSRateForPS;
        let PurchaseTDSApplicable = details.PurchaseTDS;
        if (PurchaseTDSApplicable === "P") updatedFormData.PurchaseTDSRate = PurchaseTDSrate;
        if (PurchaseTDSApplicable == "Y") {
          let balancelimtvalue = parseFloat(Amountf) + parseFloat(PS_amount);
          if (balancelimtvalue >= balancelimit) {
            var balance = parseFloat(balancelimtvalue) - parseFloat(balancelimit);
            if (SaleTDSAmount == 0) { PSTDS_Amt = parseFloat((parseFloat(balance) * PurchaseTDSrate / 100)); if (Amountf > 0) updatedFormData.PurchaseTDSRate = parseFloat((PSTDS_Amt * 100) / Amountf); else updatedFormData.PurchaseTDSRate = parseFloat((PSTDS_Amt * 100) / PS_amount); }
            else { PSTDS_Amt = parseFloat((parseFloat(PS_amount) * PurchaseTDSrate / 100)); updatedFormData.PurchaseTDSRate = PurchaseTDSrate; }
          } else { PSTDS_Amt = 0; updatedFormData.PurchaseTDSRate = 0; }
        }
        if (PurchaseTDSApplicable == "T") {
          let balancelimtvalue = Amountf + TOTALPurchase_Amount;
          if (balancelimtvalue >= balancelimit) {
            var balance = balancelimtvalue - balancelimit;
            if (SaleTDSAmount == 0) { PSTDS_Amt = parseFloat((parseFloat(balance) * PurchaseTDSrate / 100)); updatedFormData.PurchaseTDSRate = parseFloat(PSTDS_Amt * 100 / Amountf); }
            else { PSTDS_Amt = parseFloat((parseFloat(TOTALPurchase_Amount) * PurchaseTDSrate / 100)); updatedFormData.PurchaseTDSRate = PurchaseTDSrate; }
          }
        }
        PSNetPayble = parseFloat(TOTALPurchase_Amount) + parseFloat(PSTCS_Amt) - parseFloat(PSTDS_Amt);
        PS_SelfBal = (PSgepasscode == SELFAC && PSsalebillto == SELFAC) ? "Y" : "N";
      }
    }
    updatedFormData.PS_CGSTAmount = PS_CGSTAmount; updatedFormData.PS_SGSTAmount = PS_SGSTAmount; updatedFormData.PS_IGSTAmount = PS_IGSTAmount;
    updatedFormData.PS_CGSTRATE = cgstrate; updatedFormData.PS_SGSTRATE = sgstrate; updatedFormData.PS_IGSTRATE = igstrate;
    updatedFormData.TOTALPurchase_Amount = TOTALPurchase_Amount; updatedFormData.PSTCS_Amt = PSTCS_Amt; updatedFormData.PSTDS_Amt = Math.round(PSTDS_Amt);
    updatedFormData.PSNetPayble = PSNetPayble; updatedFormData.PS_SelfBal = PS_SelfBal; updatedFormData.PS_amount = PS_amount;
    return updatedFormData;
  };

  const saleBillCalculation = async (name, input, formData, gstRate, TDSTCSData) => {
    formData = { ...formData, cgstrate: 0, sgstrate: 0, igstrate: 0, cgstamt: 0, sgstamt: 0, igstamt: 0, SaleDetail_Rate: 0, SB_freight: 0, SB_SubTotal: 0, SB_Less_Frt_Rate: 0, TotalGstSaleBillAmount: 0, TaxableAmountForSB: 0, Roundoff: 0, SBTCSAmt: 0, Net_Payble: 0, SBTDSAmt: 0, item_Amount: 0, SB_Ac_Code: 0, SB_Unit_Code: 0 };
    let updatedFormData = { ...formData, [name]: input };
    let rate = parseFloat(gstRate) || 0.0;
    let cgstrate = (rate / 2).toFixed(2); let sgstrate = (rate / 2).toFixed(2); let igstrate = 0.0;
    cgstrate = (rate / 2).toFixed(2); sgstrate = (rate / 2).toFixed(2); igstrate = (rate).toFixed(2);
    let RATES = 0.0; let SALE_RATE = parseFloat(updatedFormData.sale_rate) || 0.0; let FRIEGHT_RATE = parseFloat(updatedFormData.FreightPerQtl) || 0.0;
    let TenderCommision = parseFloat(updatedFormData.Tender_Commission) || 0.0; let VASULI_RATE_1 = parseFloat(updatedFormData.vasuli_rate1) || 0.0;
    let VASULI_AMOUNT_1 = parseFloat(updatedFormData.vasuli_amount1) || 0.0; let MEMO_ADVANCE = parseFloat(updatedFormData.Memo_Advance) || 0.0;
    let MM_Rate = parseFloat(updatedFormData.MM_Rate) || 0.0; let insurance = parseFloat(updatedFormData.Insurance) || 0.0;
    let lessfrtwithgst = SALE_RATE - FRIEGHT_RATE + TenderCommision + insurance - VASULI_RATE_1;
    RATES = SALE_RATE + TenderCommision + insurance;
    let SaleForNaka = RATES - FRIEGHT_RATE + MM_Rate; let expbamt = 0.0; let BillRoundOff = 0.0; let TaxableAmountForSB = 0.0;
    let Delivery_Type = updatedFormData.Delivery_Type; let qntl = updatedFormData.quantal; let SB_SaleRate = 0.0; let Carporate_Sale_No = updatedFormData.Carporate_Sale_No;
    if (Delivery_Type == "C") {
      TaxableAmountForSB = Math.round(parseFloat(RATES * qntl + MEMO_ADVANCE + VASULI_AMOUNT_1));
    } else {
      if (Carporate_Sale_No == "0" || Carporate_Sale_No == "") {
        if (Delivery_Type == "N") { SB_SaleRate = parseFloat((SaleForNaka / (SaleForNaka + (SaleForNaka * rate) / 100)) * SaleForNaka); SB_SaleRate = Math.round((SB_SaleRate + Number.EPSILON) * 100) / 100; expbamt = parseFloat(SaleForNaka * qntl); }
        else if (Delivery_Type == "A") { SB_SaleRate = SaleForNaka; var frieght = VASULI_RATE_1 * qntl; TaxableAmountForSB = SaleForNaka * qntl + frieght; }
        else SB_SaleRate = lessfrtwithgst;
        if (Delivery_Type == "N") TaxableAmountForSB = Math.round(parseFloat((SB_SaleRate + VASULI_RATE_1) * qntl));
        else if (Delivery_Type == "A") { }
        else TaxableAmountForSB = Math.round(parseFloat(SB_SaleRate * qntl));
      } else {
        if (Delivery_Type == "N") { SB_SaleRate = parseFloat((SaleForNaka / (SaleForNaka + (SaleForNaka * rate) / 100)) * SaleForNaka); SB_SaleRate = Math.round((SB_SaleRate + Number.EPSILON) * 100) / 100; expbamt = parseFloat(SaleForNaka * qntl); }
        else if (Delivery_Type == "A") { SB_SaleRate = SaleForNaka; SB_SaleRate = Math.round((SB_SaleRate + Number.EPSILON) * 100) / 100; expbamt = parseFloat(SaleForNaka * qntl); }
        else SB_SaleRate = lessfrtwithgst;
        if (Delivery_Type == "A") TaxableAmountForSB = Math.round(parseFloat((SB_SaleRate - (VASULI_RATE_1 + FRIEGHT_RATE) + MM_Rate) * qntl));
        else TaxableAmountForSB = Math.round(parseFloat(SB_SaleRate * qntl));
      }
    }
    let Sb_CheckState = 0;
    if (pdspartystatecode != "0" && pdspartystatecode != "") Sb_CheckState = pdspartystatecode;
    else if (pdsBilltostatecode != "0" && pdsBilltostatecode != "") Sb_CheckState = pdsBilltostatecode;
    else Sb_CheckState = updatedFormData.SaleBillTo;
    const matchStatus = await checkMatchStatus(Sb_CheckState, companyCode, Year_Code);
    let SB_CGSTAmount = 0.0; let SB_SGSTAmount = 0.0; let SB_IGSTAmount = 0.0;
    if (matchStatus == "TRUE") {
      SB_CGSTAmount = Math.round((parseFloat((TaxableAmountForSB * cgstrate) / 100) + Number.EPSILON) * 100) / 100;
      SB_SGSTAmount = Math.round((parseFloat((TaxableAmountForSB * sgstrate) / 100) + Number.EPSILON) * 100) / 100;
      SB_IGSTAmount = 0.0; igstrate = 0;
    } else {
      SB_CGSTAmount = 0.0; cgstrate = 0; SB_SGSTAmount = 0.0; sgstrate = 0;
      SB_IGSTAmount = Math.round((parseFloat((TaxableAmountForSB * igstrate) / 100) + Number.EPSILON) * 100) / 100;
    }
    let TotalGstSaleBillAmount = 0; let SB_Other_Amount = parseFloat(updatedFormData.SB_Other_Amount) || 0.0;
    TotalGstSaleBillAmount = parseFloat(TaxableAmountForSB + SB_CGSTAmount + SB_SGSTAmount + SB_IGSTAmount + SB_Other_Amount);
    let Roundoff = 0.0; let SB_SubTotal = 0.0; let SB_Ac_Code = 0; let SB_Unit_Code = 0;
    if (PDSType == "P") {
      SB_Ac_Code = PDSParty; SB_Unit_Code = PDSUnit;
      if (Delivery_Type == "C") { Roundoff = Math.round(parseFloat(TotalGstSaleBillAmount - (TaxableAmountForSB + SB_CGSTAmount + SB_SGSTAmount + SB_IGSTAmount + SB_Other_Amount))); SB_SubTotal = Math.round(parseFloat(qntl * RATES)); }
      else { Roundoff = Math.round(parseFloat(TotalGstSaleBillAmount - (TaxableAmountForSB + SB_CGSTAmount + SB_SGSTAmount + SB_IGSTAmount + SB_Other_Amount))); SB_SubTotal = Math.round(parseFloat(qntl * SB_SaleRate)); }
    } else {
      SB_Ac_Code = updatedFormData.SaleBillTo; SB_Unit_Code = updatedFormData.voucher_by;
      if (Delivery_Type == "C") { Roundoff = Math.round(parseFloat(TotalGstSaleBillAmount - (TaxableAmountForSB + SB_CGSTAmount + SB_SGSTAmount + SB_IGSTAmount))); SB_SubTotal = Math.round(parseFloat(qntl * RATES)); }
      else { Roundoff = Math.round(parseFloat(TotalGstSaleBillAmount - (TaxableAmountForSB + SB_CGSTAmount + SB_SGSTAmount + SB_IGSTAmount))); SB_SubTotal = Math.round(parseFloat(qntl * SB_SaleRate) - (MEMO_ADVANCE + VASULI_AMOUNT_1)); }
    }
    let SB_Less_Frt_Rate = 0.0; let SB_freight = 0.0; let item_Amount = 0.0; let SaleDetail_Rate = 0.0;
    if (Delivery_Type == "C") { SB_Less_Frt_Rate = Math.round(parseFloat(MM_Rate + VASULI_RATE_1)); SB_freight = Math.round(parseFloat(MEMO_ADVANCE + VASULI_AMOUNT_1)); item_Amount = Math.round(parseFloat(RATES * qntl + 0)); SaleDetail_Rate = RATES; }
    else { SB_Less_Frt_Rate = Math.round(parseFloat(MM_Rate + VASULI_RATE_1)); SB_freight = Math.round(parseFloat(MEMO_ADVANCE + VASULI_AMOUNT_1)); item_Amount = Math.round(parseFloat(SB_SaleRate * qntl - MEMO_ADVANCE - VASULI_AMOUNT_1 + 0)); SB_SaleRate = SB_SubTotal / qntl; SaleDetail_Rate = SB_SaleRate; }
    let TCSRate_sale = updatedFormData.Sale_TCS_Rate; let TCSAmt = Math.round((parseFloat(TotalGstSaleBillAmount) * TCSRate_sale) / 100);
    let cashdiffvalue = updatedFormData.Cash_diff; let cashdiff = SALE_RATE - cashdiffvalue;
    let SaleTDS = updatedFormData.SaleTDSRate; let TDSAmt = parseFloat(cashdiff * SaleTDS);
    const details = TDSTCSData;
    let Amountf = details.Amountf; let balancelimit = details.balancelimit; let SaleTDSAmount = details.SaleTDSAmount;
    let SaleTDSApplicable = details.SaleTDS;
    SaleTDS = updatedFormData.SaleTDSRate !== 0 ? updatedFormData.SaleTDSRate : details.SaleTDSRateForSB;
    updatedFormData.SaleTDSRate = SaleTDS;
    TDSAmt = parseFloat((TaxableAmountForSB * SaleTDS) / 100);
    if (SaleTDSApplicable == "Y") {
      let balancelimtvalue = parseFloat(Amountf) + parseFloat(TaxableAmountForSB);
      if (balancelimtvalue >= balancelimit) {
        var balance = parseFloat(balancelimtvalue) - parseFloat(balancelimit);
        if (SaleTDSAmount == 0) { TDSAmt = parseFloat((parseFloat(balance) * SaleTDS / 100)); if (Amountf > 0) updatedFormData.SaleTDSRate = parseFloat((TDSAmt * 100) / Amountf); else updatedFormData.SaleTDSRate = parseFloat((TDSAmt * 100) / TaxableAmountForSB); }
        else { TDSAmt = parseFloat((parseFloat(TaxableAmountForSB) * SaleTDS / 100)); updatedFormData.SaleTDSRate = SaleTDS; }
      } else { TDSAmt = 0; updatedFormData.SaleTDSRate = 0; }
    }
    if (SaleTDSApplicable == "B") {
      let balancelimtvalue = Amountf + TotalGstSaleBillAmount;
      if (balancelimtvalue >= balancelimit) {
        var balance = balancelimtvalue - balancelimit;
        if (SaleTDSAmount == 0) { TDSAmt = parseFloat((parseFloat(balance) * SaleTDS / 100)); updatedFormData.SaleTDSRate = parseFloat(TDSAmt * 100 / Amountf); }
        else { TDSAmt = parseFloat((parseFloat(TotalGstSaleBillAmount) * SaleTDS / 100)); updatedFormData.SaleTDSRate = SaleTDS; }
      }
    }
    let Net_Payble = Math.round(parseFloat(TotalGstSaleBillAmount) + TCSAmt);
    Roundoff = Math.round(TotalGstSaleBillAmount) - TotalGstSaleBillAmount;
    TotalGstSaleBillAmount = TotalGstSaleBillAmount + Roundoff;
    updatedFormData.cgstrate = cgstrate; updatedFormData.sgstrate = sgstrate; updatedFormData.igstrate = igstrate;
    updatedFormData.cgstamt = SB_CGSTAmount; updatedFormData.sgstamt = SB_SGSTAmount; updatedFormData.igstamt = SB_IGSTAmount;
    updatedFormData.SaleDetail_Rate = SaleDetail_Rate; updatedFormData.SB_freight = SB_freight; updatedFormData.SB_SubTotal = SB_SubTotal;
    updatedFormData.SB_Less_Frt_Rate = SB_Less_Frt_Rate; updatedFormData.TotalGstSaleBillAmount = TotalGstSaleBillAmount;
    updatedFormData.TaxableAmountForSB = TaxableAmountForSB; updatedFormData.Roundoff = Roundoff; updatedFormData.SBTCSAmt = TCSAmt;
    updatedFormData.Net_Payble = Net_Payble; updatedFormData.SBTDSAmt = Math.round(TDSAmt); updatedFormData.item_Amount = item_Amount;
    updatedFormData.SB_Ac_Code = SB_Ac_Code; updatedFormData.SB_Unit_Code = SB_Unit_Code;
    return updatedFormData;
  };

  const handleKeyDownCalculations = async (event) => {
    if (event.key === "Tab") {
      const { name, value } = event.target;
      const updatedFormData = await calculateDependentValues(name, value, formData, matchStatus, Gst_Rate);
      setFormData(updatedFormData);
      setFormDataDetail((prevState) => ({ ...prevState, Amount: updatedFormData.Mill_AmtWO_TCS }));
      setUsers((prevUsers) => prevUsers.map((user) => ({ ...user, Amount: updatedFormData.Mill_AmtWO_TCS })));
    }
  };

  const calculateDependentValues = async (name, input, formData) => {
    let updatedFormData = { ...formData, [name]: input };
    let MMRate = parseFloat(updatedFormData.MM_Rate) || 0.0;
    let millamount = parseFloat(updatedFormData.amount) || 0.0;
    const PurcTcsRate = parseFloat(updatedFormData.TCS_Rate) || 0.0;
    const PurcTdsRate = parseFloat(updatedFormData.PurchaseTDSRate) || parseFloat(updatedFormData.PurchaseTDSRateForPS) || 0.0;
    const qntl = parseFloat(updatedFormData.quantal) || 0.0;
    const purc_Rate = parseFloat(updatedFormData.PurchaseRate) || 0;
    const excise_Rate = parseFloat(updatedFormData.excise_rate) || 0;
    const commision = parseFloat(updatedFormData.Tender_Commission) || 0;
    const salerate = parseFloat(updatedFormData.sale_rate) + commision || 0;
    const mill_rate = parseFloat(updatedFormData.mill_rate);
    const rate = qntl !== 0 ? mill_rate + excise_Rate : 0;
    millamount = qntl * rate;
    let millamounttcs = millamount * PurcTcsRate / 100;
    let millamounttds = ((purc_Rate * qntl) * PurcTdsRate) / 100;
    updatedFormData.amount = millamount; updatedFormData.final_amout = millamount;
    updatedFormData.Mill_AmtWO_TCS = parseFloat((millamount + millamounttcs) - millamounttds) || 0;
    if (users.length > 0) users[0] = { ...users[0], Amount: updatedFormData.Mill_AmtWO_TCS };
    updatedFormData.bags = Math.round((qntl / updatedFormData.packing) * 100);
    if (GSTMemoGstrate > 0) {
      const matchStatus = await checkMatchStatus(updatedFormData.transport, companyCode, Year_Code);
      if (GSTMemoGstrate != 0) updatedFormData = await calculatememogstrateamount(name, input, updatedFormData, GSTMemoGstrate, matchStatus);
    }
    let MemoAdvance = parseFloat(updatedFormData.Memo_Advance) || 0.0;
    updatedFormData.MM_Rate = parseFloat(MemoAdvance / qntl);
    let diffrate = parseFloat(salerate - purc_Rate); let diffamount = parseFloat(diffrate * qntl);
    updatedFormData.diff_rate = diffrate; updatedFormData.diff_amount = diffamount;
    let Frieghtrate = parseFloat(updatedFormData.FreightPerQtl) || 0.0; let Frieghtamt = parseFloat(updatedFormData.Freight_Amount) || 0.0;
    let vasulirate = parseFloat(updatedFormData.vasuli_rate) || 0.0; let vasuliamt = 0.0;
    if (qntl != 0 && Frieghtrate != 0) Frieghtamt = parseFloat(qntl * Frieghtrate); else Frieghtamt = 0.0;
    updatedFormData.Freight_Amount = Frieghtamt;
    if (qntl != 0 && vasulirate != 0) vasuliamt = parseFloat(qntl * vasulirate); else vasuliamt = 0.0;
    updatedFormData.vasuli_amount = vasuliamt;
    let vasuliamt1 = 0.0; let vasulirate1 = parseFloat(updatedFormData.vasuli_rate1) || 0.0;
    if (qntl != 0 && vasulirate1 != 0) vasuliamt1 = parseFloat(qntl * vasulirate1); else vasuliamt1 = 0.0;
    updatedFormData.vasuli_amount1 = vasuliamt1;
    let tdsac = updatedFormData.TDSAc;
    if (tdsac != 0) { let tdsrate = parseFloat(updatedFormData.TDSRate) || 0.0; updatedFormData.TDSAmt = (tdsrate * MemoAdvance) / 100; }
    return updatedFormData;
  };

  const fetchLastRecord = () => {
    fetch(`${API_URL}/getNextDocNo_DeliveryOrder?Company_Code=${companyCode}&Year_Code=${Year_Code}`)
      .then((response) => { if (!response.ok) throw new Error("Failed to fetch last record"); return response.json(); })
      .then((data) => { setFormData((prevState) => ({ ...prevState, doc_no: data.next_doc_no })); })
      .catch((error) => { console.error("Error fetching last record:", error); });
  };

  const handleAddOne = () => {
    setAddOneButtonEnabled(false); setSaveButtonEnabled(true); setCancelButtonEnabled(true);
    setEditButtonEnabled(false); setDeleteButtonEnabled(false); setIsEditing(true);
    setLastTenderDetails([]); setLastTenderData([]);
    MillByName = ""; lblgetpassstatename = ""; GetPassByName = ""; lblgstratename = ""; lblmillname = ""; lblbrandname = "";
    lblbrokername = ""; lblcashdiffacname = ""; lblgetpasscodename = ""; lblgetpassstatename = ""; lblitemname = "";
    lblMemoGSTRatename = ""; lblmillstatename = ""; lblsalebilltoname = ""; lbltdsacname = ""; lbltransportname = ""; lbltransportstatename = "";
    VoucherByName = ""; lblvasuliacname = ""; lblvoucherByname = ""; lblDoname = ""; lblBilltostatename = ""; lblbrokername = "";
    newvoucher_by = ""; newSaleBillTo = ""; newGETPASSCODE = ""; newCashDiffAc = ""; newVasuli_Ac = ""; GetpassByCode = ""; VoucherByCode = "";
    SaleBillByName = ""; MillByCode = ""; newitemcode = ""; newbrandcode = ""; newGstRateCode = ""; newMemoGSTRate = ""; newCashDiffAc = "";
    newDO = ""; newTDSAc = ""; newbroker = ""; newtransport = ""; newTransportGSTStateCode = ""; newmill_code = ""; newPurcno = "";
    lblTenderid = ""; gradeName = ""; newGrade = ""; newGodownCode = ''; lblGodownName = '';
    setFormData(initialFormData); setTenderDetails([]); setChangeData(false); setTenderno(''); setTenderid('');
    fetchLastRecord();
    setTimeout(() => { inputRef.current?.focus(); }, 0);
    setMillBalance(0); setShipToBalance(0); setBillToBalance(0); setShipToGSTNo(''); setBillToGSTNo('');
    settransportcode(''); settransportcodename(''); setmillcode(''); setmillcodeacid(''); setmillcodename('');
    setmillstatecode(''); setmillstatename(''); setgetpasscode(''); setgetpasscodeacid(''); setgetpasscodename('');
    setgetpassstatecode(''); setgetpassstatecodename(''); setvoucherbystatecode(''); setvoucherbystatename('');
    setsalebilltostatecode(''); setsalebilltostatename('');
  };

  const handleSaveOrUpdate = async () => {
    isSalePartyLock = 'N'; isPurchasePartyLock = 'N';
    const accountingYearData = sessionStorage.getItem('Accounting_Year');
    const formattedEntryDate = formData.doc_date;
    const isValid = validateDocumentDate(formattedEntryDate, accountingYearData);
    if (!isValid) return;
    let desp_type = formData.desp_type;
    const { grade, quantal, packing, bags, mill_rate, sale_rate } = formData;
    let missingFields = []; let invalidFields = [];
    if (!formData.transport) missingFields.push("Transport Code");
    if (!formData.GETPASSCODE) missingFields.push("GET Pass Code");
    if (!formData.voucher_by) missingFields.push("Shipped TO");
    if (!formData.SaleBillTo) missingFields.push("Sale Bill To");
    if (!formData.mill_code) missingFields.push("Mill Code");
    if (String(formData.GETPASSCODE) === String(formData.SaleBillTo)) { if (!formData.godownCode) missingFields.push("Godown Code"); }
    if (!grade || quantal <= 0 || packing <= 0 || bags <= 0 || mill_rate <= 0 || sale_rate <= 0) {
      if (!grade) invalidFields.push("Grade");
      if (quantal <= 0) invalidFields.push("Quintal");
      if (packing <= 0) invalidFields.push("Packing");
      if (bags <= 0) invalidFields.push("Bags");
      if (mill_rate <= 0) invalidFields.push("Mill Rate");
      if (sale_rate <= 0) invalidFields.push("Sale Rate");
    }
    if (missingFields.length > 0) { Swal.fire({ title: "Warning", text: `Please select the following fields. : ${missingFields.join(", ")}`, icon: "warning", confirmButtonText: "OK" }); return; }
    if (invalidFields.length > 0) { Swal.fire({ title: "Warning", text: `Please select the following fields. : ${invalidFields.join(", ")}`, icon: "warning", confirmButtonText: "OK" }); return; }
    if (formData.vasuli_rate1 != 0) { if (formData.Vasuli_Ac === 0) { Swal.fire({ title: "Error", text: "Please Enter Vasuli Account Code.!", icon: "error", confirmButtonText: "OK" }); return; } }
    setIsEditing(true); setIsLoading(true);
    let TDSTCSData = {};
    if (formData.SaleBillTo !== 0) TDSTCSData = await AmountCalculation("name", formData.quantal, formData);
    let updatedFormData = await calculateDependentValues('quantal', formData.quantal, { ...formData, ...TDSTCSData });
    const millamounttCS = Number(updatedFormData.Mill_AmtWO_TCS) || 0;
    const bankamt = users.reduce((sum, u) => { const rowAction = String(u?.rowaction ?? "").trim().toUpperCase(); if (rowAction === "DELETE" || rowAction === "DNU") return sum; return sum + (Number(u?.Amount) || 0); }, 0);
    if (isPurchasePartyLock === 'Y') { Swal.fire({ title: "Error", text: "Purchase Party is Lock!", icon: "error", confirmButtonText: "OK" }); setIsLoading(false); return; }
    if (isSalePartyLock === 'Y') { Swal.fire({ title: "Error", text: "Sale Party is Lock!", icon: "error", confirmButtonText: "OK" }); setIsLoading(false); return; }
    if (isPurchasePartyNULL === 'Y') { Swal.fire({ title: "Error", text: "Please Select Purchase TDS Applicable For Purchase Party In Account Master!", icon: "error", confirmButtonText: "OK" }); setIsLoading(false); return; }
    if (isSaleTDSPartyNULL === 'Y') { Swal.fire({ title: "Error", text: "Please Select Sale TDS Applicable For Sale Party In Account Master!", icon: "error", confirmButtonText: "OK" }); setIsLoading(false); return; }
    if (desp_type === "DI") { const isEqual = Math.abs(millamounttCS - bankamt) < 0.01; if (!isEqual) { Swal.fire({ title: "Error", text: "Mill Amount (TCS) does not match the total of detail amounts!", icon: "error", confirmButtonText: "OK" }); setIsLoading(false); return; } }
    let headData = { ...updatedFormData, purc_no: Tenderno || newPurcno || formData.purc_no, purc_order: Tenderid || newpurcoder || formData.purc_order, narration1: desp_type === "DI" ? formData.narration1 : "Please Debit The Same Amount in our A/c" };
    if (desp_type === "DI") {
      headData = await PurchaseBillCalculation("save", "ps", headData, Gst_Rate, TDSTCSData);
      headData = { ...headData, PurchaseCSGTamt: headData.PS_CGSTAmount, PurchaseSGSTamt: headData.PS_SGSTAmount, PurchaseIGSTamt: headData.PS_IGSTAmount, PurchaseTCSamt: headData.PSTCS_Amt, PurchaseTDSamt: headData.PSTDS_Amt };
      headData = await saleBillCalculation("save", "sale", headData, Gst_Rate, TDSTCSData);
    } else {
      headData = await CommisionBillCalculation("save", "commi", headData, Gst_Rate);
    }
    if (isEditMode) headData = { ...headData, Modified_By: username, User_Id: User_Id };
    else headData = { ...headData, Created_By: username };
    delete headData.PSAmount; delete headData.Amountf; delete headData.balancelimit; delete headData.PurchaseTDS;
    delete headData.SaleTDS; delete headData.TCSRate; delete headData.PurchaseSubTotalAmount; delete headData.PurchaseTDSAmount;
    delete headData.SaleTDSAmount; delete headData.updatedFormData; delete headData.SaleTDSRateForSB; delete headData.PurchaseTDSRateForPS;
    if (isEditMode) { delete headData.doid; delete headData.doidnew; delete headData.millname; delete headData.brandname; delete headData.brokername; delete headData.cashdiffacname; delete headData.getpassname; delete headData.getpassstatename; delete headData.itemname; delete headData.memorategst; delete headData.millstatename; delete headData.salebillname; delete headData.salebilltostatename; delete headData.tdsacname; delete headData.transportname; delete headData.transportstatename; delete headData.vaoucherbystatename; delete headData.vasuliacname; delete headData.voucherbyname; delete headData.DOName; delete headData.gradeName; }
    else { delete headData.doid; delete headData[""]; delete headData.gradeName; delete headData.name; }
    const detailData = users.map((user) => ({ rowaction: user.rowaction, dodetailid: user.dodetailid, Bank_Code: user.Bank_Code || tenderDetails.Payment_To, ddType: user.ddType, Narration: user.Narration, Amount: user.Amount, detail_Id: user.id, Company_Code: companyCode, Year_Code: Year_Code, LTNo: user.LTNo, bc: user.bc || tenderDetails.pt, UTR_NO: user.UTR_NO || "", UtrYearCode: user.UtrYearCode || 0, UtrCompanyCode: user.UtrCompanyCode || 0, utrdetailid: user.utrdetailid || 0, DO_No: formData.doc_no }));
    const requestData = { headData, detailData };
    try {
      if (isEditMode) {
        const updateApiUrl = `${API_URL}/update-DeliveryOrder?doid=${newDcid}`;
        await axios.put(updateApiUrl, requestData);
        Swal.fire({ title: "Success!", text: "Record Updated Successfully!", icon: "success", confirmButtonText: "OK" });
        await unlockRecord();
        setTimeout(() => { window.location.reload(); }, 1000);
        navigate(`/delivery-order-summary?navigatedRecord=${formData.doc_no}`);
      } else {
        await axios.post(`${API_URL}/insert-DeliveryOrder`, requestData);
        Swal.fire({ title: "Success!", text: "Record Created Successfully!", icon: "success", confirmButtonText: "OK" });
        handleEdit(); setIsEditMode(false); setAddOneButtonEnabled(true); setEditButtonEnabled(true); setDeleteButtonEnabled(true); setBackButtonEnabled(true); setSaveButtonEnabled(false); setCancelButtonEnabled(false); setIsEditing(true);
        await unlockRecord();
        setTimeout(() => { window.location.reload(); }, 1000);
        navigate(`/delivery-order-summary?navigatedRecord=${formData.doc_no}`);
      }
    } catch (error) {
      Swal.fire({ title: "Error!", text: "Error occurred while saving data", icon: "error", confirmButtonText: "OK" });
    } finally { await unlockRecord(); setIsEditing(false); setIsLoading(false); }
  };

  const handleEdit = () => {
    if (String(formData.GETPASSCODE) === String(formData.SaleBillTo)) setBillToManuallySet(true);
    if (formData.ackno || formData.einvoiceno) Swal.fire({ icon: "warning", text: "E-Invoice has already been generated for this record.", confirmButtonColor: "#d33" });
    if (formData.EWay_Bill_No) Swal.fire({ icon: "warning", text: "E-Waybill has already been generated for this record.", confirmButtonColor: "#d33" });
    axios.get(`${API_URL}/DOByid`, { params: { company_code: companyCode, doc_no: formData.doc_no, Year_Code: Year_Code } })
      .then((response) => {
        const data = response.data;
        const isLockedNew = data.last_head_data?.LockedRecord; const isLockedByUserNew = data.last_head_data?.LockedUser;
        if (isLockedNew) { Swal.fire({ icon: "warning", title: "Record Locked", text: `This record is locked by ${isLockedByUserNew}`, confirmButtonColor: "#d33" }); return; }
        else lockRecord();
        CommonFeilds(data); setIsEditMode(true); setAddOneButtonEnabled(false); setSaveButtonEnabled(true);
        setCancelButtonEnabled(true); setEditButtonEnabled(false); setDeleteButtonEnabled(false); setBackButtonEnabled(true); setIsEditing(true);
      })
      .catch((error) => { console.error("Edit fetch error:", error); window.alert("This record is already deleted! Showing the previous record."); });
  };

  const CommonFeilds = (data) => {
    newDcid = data.last_head_data.doid; bankcodenew = data.last_details_data[0].bankaccode; lblbankname = data.last_details_data[0].bankname;
    newmill_code = data.last_details_data[0].millacode; lblmillname = data.last_details_data[0].millname;
    MillByCode = data.last_details_data[0].millstatecode; MillByName = data.last_details_data[0].millstatename;
    newGETPASSCODE = data.last_head_data.GETPASSCODE; lblgetpasscodename = data.last_details_data[0].getpassname;
    GetPassByName = data.last_details_data[0].getpassstatename; GetpassByCode = data.last_details_data[0].getpassstatecode;
    newvoucher_by = data.last_details_data[0].voucherbyaccode; lblvoucherByname = data.last_details_data[0].voucherbyname;
    VoucherByName = data.last_details_data[0].vaoucherbystatename; VoucherByCode = data.last_head_data.voucherbystatecode;
    lblgstratename = data.last_details_data[0].gstratename; newGstRateCode = data.last_details_data[0].gstdocno;
    newSaleBillTo = data.last_details_data[0].salebillaccode; lblsalebilltoname = data.last_details_data[0].salebillname;
    lblBilltostatename = data.last_details_data[0].salebilltostatename; SaleBillByName = data.last_details_data[0].salebilltostatename;
    lblcarporateacname = data.last_details_data[0].carporateacname; newtransport = data.last_details_data[0].transportaccode;
    lbltransportname = data.last_details_data[0].transportname; lbltransportstatename = data.last_details_data[0].transportstatename;
    newTransportGSTStateCode = data.last_details_data[0].transportstatecode; lblitemname = data.last_details_data[0].itemname;
    newitemcode = data.last_details_data[0].itemcode; lblbrandname = data.last_details_data[0].brandname; newbrandcode = data.last_details_data[0].brandcode;
    lblMemoGSTRatename = data.last_details_data[0].memorategst; newMemoGSTRate = data.last_details_data[0].MemoGSTRate;
    newVasuli_Ac = data.last_details_data[0].Vasuli_Ac; lblvasuliacname = data.last_details_data[0].vasuliacname;
    lblDoname = data.last_details_data[0].DOName; newDO = data.last_details_data[0].DOacCode;
    lbltdsacname = data.last_details_data[0].tdsacname; newTDSAc = data.last_details_data[0].TDSAc;
    lblbrokername = data.last_details_data[0].brokername; newbroker = data.last_details_data[0].broker;
    lblcashdiffacname = data.last_details_data[0].cashdiffacname; newCashDiffAc = data.last_details_data[0].CashDiffAc;
    lblTenderid = data.last_head_data.purc_order; lblGodownName = data.last_details_data[0].godownName; newGodownCode = data.last_details_data[0].godownCode;
    newcarporate_ac = data.last_details_data[0].carporate_ac; CarporatestatecodeGSTStateCode = data.last_details_data[0].carporatestatecode;
    carporatenameTitle = data.last_details_data[0].carporateacname;
    setGstRatecode(data.last_details_data[0].Gstrate); setAutopurchase(data.last_details_data[0].AutoPurchaseBill);
    setFormData((prevData) => ({ ...prevData, ...data.last_head_data }));
    const desp_type = data.last_head_data.desp_type;
    setLastTenderData(data.last_head_data || {});
    const millBalance = data.balance_data.millBalance;
    millBalance.forEach((item) => {
      if (item.ac_code === newmill_code) setMillBalance(item.balance || 0);
      if (item.ac_code === newvoucher_by) { setShipToBalance(item.balance || 0); setShipToGSTNo(item.Gst_No || ""); }
      if (item.ac_code === newSaleBillTo) { setBillToBalance(item.balance || 0); setBillToGSTNo(item.Gst_No || ""); }
    });
    if (desp_type === "DI") setLastTenderDetails(data.last_details_data || []);
    else setLastTenderDetails([]);
  };

  const handleCancel = async () => {
    setIsEditing(false); setIsEditMode(false); setAddOneButtonEnabled(true); setEditButtonEnabled(true);
    setDeleteButtonEnabled(true); setBackButtonEnabled(true); setSaveButtonEnabled(false); setCancelButtonEnabled(false); setCancelButtonClicked(true);
    try {
      const response = await axios.get(`${API_URL}/get-lastDO-navigation?company_code=${companyCode}&Year_Code=${Year_Code}`);
      if (response.status === 200) { CommonFeilds(response.data); }
      else toast.error("Failed to fetch last data:", response.status, response.statusText);
      unlockRecord(); setTenderDetails([]);
    } catch (error) { console.log(error); toast.error("Error during API call:", error); }
  };

  const handleDelete = async () => {
    if (formData.ackno || formData.einvoiceno) { Swal.fire({ icon: "warning", title: "Cannot Delete", text: "E-Invoice has already been generated for this record. Deletion is not allowed.", confirmButtonColor: "#d33" }); return; }
    if (formData.EWay_Bill_No) { Swal.fire({ icon: "warning", title: "Cannot Delete", text: "E-Waybill has already been generated for this record. Deletion is not allowed.", confirmButtonColor: "#d33" }); return; }
    try {
      const response = await axios.get(`${API_URL}/DOByid`, { params: { company_code: companyCode, doc_no: formData.doc_no, Year_Code: Year_Code } });
      const data = response.data;
      const isLockedNew = data.last_head_data?.LockedRecord; const isLockedByUserNew = data.last_head_data?.LockedUser;
      if (isLockedNew) { await Swal.fire({ icon: "warning", title: "Record Locked", text: `This record is locked by ${isLockedByUserNew}`, confirmButtonColor: "#d33" }); return; }
      lockRecord(); CommonFeilds(data);
      const result = await Swal.fire({ title: "Are you sure?", text: `You won't be able to revert this Doc No : ${formData.doc_no}`, icon: "warning", showCancelButton: true, confirmButtonColor: "#d33", cancelButtonColor: "#3085d6", cancelButtonText: "Cancel", confirmButtonText: "Delete", reverseButtons: true, focusCancel: true });
      if (!result.isConfirmed) { await Swal.fire({ title: "Cancelled", text: "Your record is safe 🙂", icon: "info" }); return; }
      setIsEditMode(false); setAddOneButtonEnabled(true); setEditButtonEnabled(true); setDeleteButtonEnabled(true); setBackButtonEnabled(true); setSaveButtonEnabled(false); setCancelButtonEnabled(false); setIsLoading(true);
      const headData = { ...formData }; const requestData = { headData };
      const deleteResponse = await axios.delete(`${API_URL}/delete_data_by_doid?doid=${formData.doid}&company_code=${companyCode}&Year_Code=${formData.Year_Code}&doc_no=${formData.doc_no}&User_Id=${User_Id}`, { data: requestData });
      if (deleteResponse.status === 200) { await Swal.fire({ title: "Deleted!", text: "The record has been deleted successfully.", icon: "success" }); handleCancel(); }
      else throw new Error("Failed to delete the record.");
    } catch (error) { console.error("Error during API call:", error); Swal.fire({ title: "Error", text: `There was an error during the deletion: ${error.message}`, icon: "error" }); }
    finally { setIsLoading(false); }
  };

  const handleBack = () => { navigate("/delivery-order-utility"); };

  const handlerecordDoubleClicked = async () => {
    try {
      const response = await axios.get(`${API_URL}/DOByid?company_code=${companyCode}&doc_no=${selectedRecord.doc_no}&Year_Code=${Year_Code}`);
      CommonFeilds(response.data); setIsEditing(false);
    } catch (error) { console.error("Error fetching data:", error); }
    setIsEditMode(false); setAddOneButtonEnabled(true); setEditButtonEnabled(true); setDeleteButtonEnabled(true); setBackButtonEnabled(true); setSaveButtonEnabled(false); setCancelButtonEnabled(false); setUpdateButtonClicked(true); setIsEditing(false);
  };

  const handleNavigateRecord = async () => {
    setIsEditing(false); setIsEditMode(false); setAddOneButtonEnabled(true); setEditButtonEnabled(true); setDeleteButtonEnabled(true); setBackButtonEnabled(true); setSaveButtonEnabled(false); setCancelButtonEnabled(false); setCancelButtonClicked(true);
    try {
      const response = await axios.get(`${API_URL}/DOByid?company_code=${companyCode}&doc_no=${navigatedRecord}&Year_Code=${Year_Code}`);
      if (response.status === 200) { CommonFeilds(response.data); setIsEditing(false); }
      else console.error("Failed to fetch last tender data:", response.status, response.statusText);
    } catch (error) { console.error("Error during API call:", error); }
  };

  const handleKeyDown = async (event) => {
    if (event.key === "Tab") {
      const changeNoValue = event.target.value;
      try {
        const response = await axios.get(`${API_URL}/DOByid?company_code=${companyCode}&doc_no=${changeNoValue}&Year_Code=${Year_Code}`);
        CommonFeilds(response.data); setIsEditing(false);
      } catch (error) { Swal.fire({ title: "Error", text: "Record Not Found.", icon: "error" }); }
    }
  };

  const handleFirstButtonClick = async () => {
    try { const response = await fetch(`${API_URL}/get-firstDO-navigation?company_code=${companyCode}&Year_Code=${Year_Code}`); if (response.ok) { CommonFeilds(await response.json()); setIsEditing(false); } } catch (error) { console.error("Error during API call:", error); }
  };
  const handlePreviousButtonClick = async () => {
    try { const response = await fetch(`${API_URL}/get-previousDO-navigation?currentDocNo=${formData.doc_no}&company_code=${companyCode}&Year_Code=${Year_Code}`); if (response.ok) { CommonFeilds(await response.json()); setIsEditing(false); } } catch (error) { console.error("Error during API call:", error); }
  };
  const handleNextButtonClick = async () => {
    try { const response = await fetch(`${API_URL}/get-nextDO-navigation?currentDocNo=${formData.doc_no}&company_code=${companyCode}&Year_Code=${Year_Code}`); if (response.ok) { CommonFeilds(await response.json()); setIsEditing(false); } } catch (error) { console.error("Error during API call:", error); }
  };
  const handleLastButtonClick = async () => {
    try { const response = await fetch(`${API_URL}/get-lastDO-navigation?company_code=${companyCode}&Year_Code=${Year_Code}`); if (response.ok) { CommonFeilds(await response.json()); setIsEditing(false); } } catch (error) { console.error("Error during API call:", error); }
  };
  const handlePendingDO = () => { navigate("/pending-do"); };

  const handlerecordDoubleClickedPendingDO = async () => {
    fetchLastRecord();
    try {
      const response = await axios.get(`${API_URL}/getByPendingDOId?tenderdetailid=${selectedRecordPendingDo.tenderdetailid}`);
      const data = response.data; OrderId = data.last_head_data.orderid; setPendingDOData(data.last_head_data);
      const dummyEvent = { target: { value: selectedRecordPendingDo.tenderdetailid } };
      await handleKeyDownPendingDO(dummyEvent);
    } catch (error) { console.error("Error fetching data:", error); }
    setAddOneButtonEnabled(false); setSaveButtonEnabled(true); setCancelButtonEnabled(true); setEditButtonEnabled(false); setDeleteButtonEnabled(false); setIsEditing(true); setIsInputDisabled(true);
  };

  const handleKeyDownPendingDO = async (event) => {
    const changeNoValue = event.target.value;
    try {
      const response = await axios.get(`${API_URL}/getTenderNo_DataByTenderdetailId?tenderdetailid=${changeNoValue}`);
      const data = response.data;
      let assingqntl = 0; let Carporate_Sale_No = formData.Carporate_Sale_No;
      let Dispatch_type = data.last_details_data[0].DT === "D" ? formData.desp_type === "DO" : "DI";
      if (Carporate_Sale_No === 0) assingqntl = Math.abs(data.last_details_data[0].BALANCE); else assingqntl = CarporateState.quantal;
      const purcRate = parseFloat(data.last_details_data[0].Purc_Rate) || 0;
      const exciseRate = parseFloat(data.last_details_data[0].Excise_Rate) || 0;
      const qtl = parseFloat(assingqntl) || 0; const rate = qtl !== 0 ? purcRate + exciseRate : 0; const millamount = qtl * rate;
      bankcodenew = data.last_details_data[0].Payment_To; lblbankname = data.last_details_data[0].paymenttoname;
      if (Dispatch_type === "DI") { const newDetailData = { ddType: "T", Narration: "Transfer Letter", Amount: millamount, detail_Id: 1, Bank_Code: bankcodenew, bc: data.last_details_data[0].pt, rowaction: "add", bankcodeacname: lblbankname }; setUsers([newDetailData]); }
      newmill_code = data.last_details_data[0].Mill_Code; lblmillname = data.last_details_data[0].millname;
      newGETPASSCODE = data.last_details_data[0].Getpassno; lblgetpasscodename = data.last_details_data[0].Getpassnoname;
      newvoucher_by = data.last_details_data[0].ship_to_ac_code; lblvoucherByname = data.last_details_data[0].Ship_To_name;
      VoucherByName = data.last_details_data[0].shiptostatename; VoucherByCode = data.last_details_data[0].shiptostatecode;
      lblgstratename = data.last_details_data[0].gstratename; newGstRateCode = data.last_details_data[0].gstratecode;
      newSaleBillTo = data.last_details_data[0].bill_to_ac_code; lblsalebilltoname = data.last_details_data[0].Bill_TO_Name;
      lblBilltostatename = data.last_details_data[0].salebilltostatename; newtransport = data.last_details_data[0].transport;
      lblitemname = data.last_details_data[0].itemname; newitemcode = data.last_details_data[0].itemcode;
      lblDoname = data.last_details_data[0].tenderdoname; newDO = data.last_details_data[0].Tender_DO;
      lblbrokername = data.last_details_data[0].brokername; newbroker = data.last_details_data[0].Broker;
      SaleBillByName = data.last_details_data[0].buyerpartygststatecode; lblBilltostatename = data.last_details_data[0].buyerpartystatename;
      const newData = {
        sb: data.last_details_data[0].bill_to_accoid, gp: data.last_details_data[0].Getpassnoid, ic: data.last_details_data[0].ic,
        mc: data.last_details_data[0].mc, bk: data.last_details_data[0].buyerid, vb: data.last_details_data[0].ship_to_accoid,
        desp_type: Dispatch_type, SaleBillTo: data.last_details_data[0].Buyer_Party, GETPASSCODE: data.last_details_data[0].Getpassno,
        voucher_by: data.last_details_data[0].Buyer_Party, DO: data.last_details_data[0].Tender_DO, CashDiffAc: data.last_details_data[0].Buyer,
        itemcode: data.last_details_data[0].itemcode, lblitemname: data.last_details_data[0].itemname,
        GstRateCode: data.last_details_data[0].gstratecode, newbroker: data.last_details_data[0].Broker, lblbrokername: data.last_details_data[0].Broker,
        Gst_Rate: data.last_details_data[0].gstrate, mill_rate: data.last_details_data[0].Mill_Rate, sale_rate: data.last_details_data[0].Sale_Rate,
        grade: data.last_details_data[0].Grade, gradeName: data.last_details_data[0].Grade, PurchaseRate: data.last_details_data[0].Purc_Rate,
        purc_no: data.last_details_data[0].Tender_No, purc_order: data.last_details_data[0].ID, packing: data.last_details_data[0].Packing,
        bags: data.last_details_data[0].Bags, excise_rate: data.last_details_data[0].Excise_Rate, Tender_Commission: data.last_details_data[0].CR,
        truck_no: data.last_details_data[0].truck_no, tenderdetailid: data.last_details_data[0].tenderdetailid,
        quantal: Math.abs(data.last_details_data[0].BALANCE), AutopurchaseBill: data.last_details_data[0].AutoPurchaseBill, orderid: OrderId
      };
      setFormData((prevState) => ({ ...prevState, ...newData })); setIsEditing(false);
    } catch (error) { console.error("Error fetching data:", error); }
  };

  const handleChangeDetail = (event) => { const { name, value } = event.target; setFormDataDetail({ ...formDataDetail, [name]: value }); };

  const deleteModeHandler = async (userToDelete) => {
    let updatedUsers;
    if (isEditMode && userToDelete.rowaction === "add") updatedUsers = users.map((u) => u.id === userToDelete.id ? { ...u, rowaction: "DNU" } : u);
    else if (isEditMode) updatedUsers = users.map((u) => u.id === userToDelete.id ? { ...u, rowaction: "delete" } : u);
    else updatedUsers = users.map((u) => u.id === userToDelete.id ? { ...u, rowaction: "DNU" } : u);
    setFormDataDetail({ ...formDataDetail, ...updatedUsers.find((u) => u.id === u.id) });
    setUsers(updatedUsers); setDeleteMode(true); setSelectedUser(userToDelete);
  };

  const getActiveUsersTotal = (users = []) => users.reduce((sum, u) => { const action = String(u?.rowaction ?? "").toUpperCase(); if (action === "DELETE" || action === "DNU") return sum; return sum + (Number(u?.Amount) || 0); }, 0);

  const openPopup = (mode) => {
    setShowPopup(true);
    if (mode === "add") {
      clearForm();
      const millAmt = Number(formData?.Mill_AmtWO_TCS) || 0;
      const currentTotal = getActiveUsersTotal(users);
      const remaining = Math.max(0, Number((millAmt - currentTotal).toFixed(2)));
      setFormDataDetail(prev => ({ ...prev, ddType: prev?.ddType || "T", Amount: remaining, Narration: "", UTR_NO: "", LTNo: 0 }));
    }
  };

  const openDelete = async (user) => {
    setDeleteMode(true); setSelectedUser(user);
    let updatedUsers;
    if (isEditMode && user.rowaction === "delete") updatedUsers = users.map((u) => u.id === user.id ? { ...u, rowaction: "Normal" } : u);
    else updatedUsers = users.map((u) => u.id === user.id ? { ...u, rowaction: "add" } : u);
    setUsers(updatedUsers); setSelectedUser({});
  };

  const closePopup = () => { setShowPopup(false); setSelectedUser({}); clearForm(); };

  useEffect(() => {
    if (selectedRecord) { setUsers(lastTenderDetails.map((detail) => ({ ddType: detail.ddType, Bank_Code: detail.bankcode || bankcodenew, bankcodeacname: detail.bankcodeacname, Narration: detail.Narration, Amount: detail.Amount, UTR_NO: detail.UTR_NO, LTNo: detail.LTNo, bc: detail.bc, dodetailid: detail.dodetailid, detail_Id: detail.detail_Id, id: detail.detail_Id, rowaction: "Normal" }))); }
  }, [selectedRecord, lastTenderDetails]);

  useEffect(() => {
    const updatedUsers = lastTenderDetails.map((detail) => ({ ddType: detail.ddType, Bank_Code: detail.Bank_Code || bankcodenew, bankcodeacname: detail.bankname, Narration: detail.Narration, Amount: detail.Amount, UTR_NO: detail.UTR_NO, LTNo: detail.LTNo, bc: detail.bc, dodetailid: detail.dodetailid, detail_Id: detail.detail_Id, id: detail.detail_Id, rowaction: "Normal" }));
    setUsers(updatedUsers);
  }, [lastTenderDetails]);

  const clearForm = () => { setFormDataDetail({ Narration: "Transfer Letter", Amount: 0.0, UTR_NO: 0 }); setbankcode(""); setbankcodeacname(""); setbankcodeacid(""); };

  const updateUser = async () => {
    const millAmt = Number(formData?.Mill_AmtWO_TCS) || 0;
    const updatedUsers = users.map((user) => {
      if (user.id === selectedUser.id) { const updatedRowaction = user.rowaction === "Normal" ? "update" : user.rowaction; return { ...user, Bank_Code: bankcode, bc: bankcodeacoid, bankcodeacname: bankcodeacname, UTR_NO: users.UTR_NO, LTNo: users.LTNo, ...formDataDetail, amount: formData.mill_amountTCS1, rowaction: updatedRowaction }; }
      return user;
    });
    const totalAmt = updatedUsers.reduce((sum, u) => sum + (Number(u?.Amount) || 0), 0);
    if (totalAmt > millAmt) { Swal.fire({ title: "Error", text: `Sum of detail amounts (${totalAmt.toFixed(2)}) must equal Mill Amount With TCS (${millAmt.toFixed(2)})!`, icon: "error", confirmButtonText: "OK" }); return; }
    setFormDataDetail({ ...updatedUsers }); setUsers(updatedUsers); closePopup();
  };

  const addUser = async () => {
    const millAmt = Number(formData?.Mill_AmtWO_TCS) || 0;
    const newUser = { id: users.length > 0 ? Math.max(...users.map((user) => user.id)) + 1 : 1, Bank_Code: bankcode, bankcodeacname: bankcodeacname, bc: bankcodeacoid, ddType: formDataDetail.ddType || "T", ...formDataDetail, rowaction: "add" };
    const totalAmt = [...users, newUser].reduce((sum, u) => sum + (Number(u?.Amount) || 0), 0);
    if (totalAmt > millAmt) { Swal.fire({ title: "Error", text: `Sum of detail amounts (${totalAmt.toFixed(2)}) must equal Mill Amount With TCS (${millAmt.toFixed(2)})!`, icon: "error", confirmButtonText: "OK" }); return; }
    setFormDataDetail({ ...newUser }); setUsers([...users, newUser]); closePopup();
  };

  const editUser = (user) => {
    setSelectedUser(user); setbankcode(user.Bank_Code); setbankcodeacname(user.bankcodeacname); setbankcodeacid(user.bc);
    setUTRNo(user.UTR_NO); setUTRCompanyCode(user.utrCompanyCode); setUTRYearCode(user.utrYearCode);
    setFormDataDetail({ ddType: user.ddType || "", Narration: user.Narration || "", Amount: user.Amount || "", UTR_NO: user.UTR_NO || "", UtrYearCode: user.UtrYearCode || 0, UtrCompanyCode: user.UtrCompanyCode || 0, utrdetailid: user.utrdetailid || 0, DO_No: user.DO_No || formData.doc_no, LTNo: user.LTNo || 0 });
    openPopup("edit");
  };

  function handleSubmit(event) { event.preventDefault(); }
  const validateNumericInput = (e) => { e.target.value = e.target.value.replace(/[^0-9.-]/g, ''); };
  const handleGenerateEInvoice = () => { setIsOpenEInvoice(true); };
  const handleCloseEInvoice = () => { setIsOpenEInvoice(false); };
  const handleGenerateEwayBill = () => { setIsOpenEwayBill(true); };
  const handleCloseEwayBill = () => { setIsOpenEwayBill(false); };
  const handleGenerateEInvoiceEwaybill = () => { setIsOpenEInvoiceEwaybill(true); };
  const handleCloseEInvoiceEwaybill = () => { setIsOpenEInvoiceEwaybill(false); };

  const handleRowClick = (doc_no, tran_type) => {
    if (tran_type === "SB") window.open(`${window.location.origin}/sale-bill?navigatedRecord=${doc_no}`, "_blank");
    if (tran_type === "PS") window.open(`${window.location.origin}/sugarpurchasebill?navigatedRecord=${doc_no}`, "_blank");
    if (tran_type === "LV" || tran_type === "CV") window.open(`${window.location.origin}/commission-bill?selectedVoucherNo=${doc_no}&selectedVoucherType=${tran_type}`, "_blank");
  };

  const handleRecordUnlocked = async () => {
    try {
      const response = await fetch(`${API_URL}/unlock-delivery-order?doc_no=${formData.doc_no}&year_code=${formData.Year_Code}&company_code=${formData.company_code}`, { method: 'PUT' });
      const data = await response.json();
      if (response.ok) alert('Record unlocked successfully'); else alert(data.error || 'Error unlocking record');
    } catch (error) { alert('Error unlocking record'); console.error(error); }
  };

  const isSBGenerated = formData.SB_No !== "" && formData.SB_No !== 0;
  const isEwayGenerated = formData.EWay_Bill_No !== "";
  const isEInvoiceGenerated = formData.einvoiceno !== "";
  const isEditingOrNoSB = isEditing || !isSBGenerated;
  const isBothNotGenerated = isSBGenerated && !isEwayGenerated && !isEInvoiceGenerated;

  const dis = !isEditing && addOneButtonEnabled;

  // ─────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────


  // return (
  //   <div className="do-root" style={{ marginBottom: "80px" }}>
  //     <style>{styles}</style>
  //     <ToastContainer autoClose={500} />

  //     {/* TOP BAR */}
  //     <div className="do-topbar">
  //       <div className="do-topbar-inner">
  //         <span className="do-title">🚛 Delivery Order</span>
  //         <div className="do-docno"># {formData.doc_no}</div>
  //         {formData.tenderdetailid === null && <span className="do-tag do-tag-deleted">DELETED</span>}
  //         {season && <span className="do-tag do-tag-season">{season}</span>}
  //         <div style={{ flex: 1 }} />
  //         <div className="do-audit" style={{ flexShrink: 0 }}>
  //           {formData.Created_By && <span>Created by <strong>{formData.Created_By}</strong></span>}
  //           {formData.Modified_By && <span>· Modified by <strong>{formData.Modified_By}</strong></span>}
  //         </div>
  //         {/* PRINT / EWAY / EINVOICE ACTIONS TOP RIGHT */}
  //         <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0, flexWrap: "wrap" }}>

  //           <Btn onClick={handleRecordUnlocked} variant="unlock">🔓</Btn>
  //         </div>


  //       </div>

  //       {/* ACTION + NAV ROW */}
  //       <div style={{ background: "#0d1b33", borderTop: "1px solid rgba(255,255,255,0.08)", padding: "10px 14px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, marginTop: "30px" }}>
  //         <ActionButtonGroup
  //           handleAddOne={handleAddOne} addOneButtonEnabled={addOneButtonEnabled}
  //           handleSaveOrUpdate={handleSaveOrUpdate} saveButtonEnabled={saveButtonEnabled}
  //           isEditMode={isEditMode} handleEdit={handleEdit} editButtonEnabled={editButtonEnabled}
  //           handleDelete={handleDelete} deleteButtonEnabled={deleteButtonEnabled}
  //           handleCancel={handleCancel} cancelButtonEnabled={cancelButtonEnabled}
  //           handleBack={handleBack} backButtonEnabled={backButtonEnabled}
  //           permissions={permissions} isDeleted={formData.tenderdetailid === null}
  //         />
  //         <div style={{ width: 1, height: 20, background: "rgba(255,255,255,.15)", margin: "0 2px" }} />
  //         <NavigationButtons
  //           handleFirstButtonClick={handleFirstButtonClick} handlePreviousButtonClick={handlePreviousButtonClick}
  //           handleNextButtonClick={handleNextButtonClick} handleLastButtonClick={handleLastButtonClick}
  //           highlightedButton={highlightedButton} isEditing={isEditing}
  //         />
  //         <div style={{ width: 1, height: 20, background: "rgba(255,255,255,.15)", margin: "0 2px" }} />
  //         <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
  //           <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255, 255, 255, 0.45)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Chnage No : </span>
  //           <input onKeyDown={handleKeyDown} disabled={!addOneButtonEnabled}
  //             style={{ height: 26, padding: "0 7px", fontSize: 12, fontWeight: 600, borderRadius: 5, border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.08)", color: "#fff", outline: "none", width: 64, fontFamily: "var(--font-mono, monospace)" }}
  //             placeholder="Doc..." />
  //         </div>
  //       </div>
  //     </div>

  //     <form onSubmit={handleSubmit}>
  //       <div style={{ padding: "8px 10px", display: "flex", flexDirection: "column", gap: 6 }}>

  //         {/* ─── ROW 1: DOCUMENT HEADER (collapsible) ─── */}
  //         <CollapsibleCard icon="📋" title="Document Information" defaultOpen={true}>

  //           <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "flex-end" }}>
  //             <Field label="Date" required><DDate id="doc_date" name="doc_date" value={formData.doc_date} onChange={handleChange} disabled={dis} /></Field>
  //             <Field label="DO Date"><DDate id="Do_DATE" name="Do_DATE" value={formData.Do_DATE} onChange={handleChange} disabled={dis} /></Field>
  //             <Field label="Purc Date"><DDate id="Purchase_Date" name="Purchase_Date" value={formData.Purchase_Date} onChange={handleChange} disabled={dis} /></Field>
  //             <Field label="Carpo. Sale No">
  //               <CarporateHelp Name="Carporate_Sale_No" onAcCodeClick={handleCarporate}
  //                 Carporate_no={Carporateno || formData.Carporate_Sale_No} disabledFeild={dis}
  //                 onTenderDetailsFetched={handleCarporateDetailsFetched} />
  //             </Field>
  //             <Field label="DO Type">
  //               <DSelect id="desp_type" name="desp_type" value={formData.desp_type} onChange={handleChange} disabled={isEditMode || addOneButtonEnabled}>
  //                 <option value="DO">D.O</option>
  //                 <option value="DI">Dispatch</option>
  //               </DSelect>
  //             </Field>
  //             <Field label="Delivery Type">
  //               <DSelect id="Delivery_Type" name="Delivery_Type" value={formData.Delivery_Type} onChange={handleChange}
  //                 disabled={isEditMode || addOneButtonEnabled || (formData.SaleBillTo !== "" && formData.SaleBillTo !== 0 && formData.SaleBillTo !== 2)}>
  //                 <option value="C">Commission</option>
  //                 <option value="N">With GST Naka</option>
  //                 <option value="A">Naka w/o GST</option>
  //                 <option value="D">DO</option>
  //               </DSelect>
  //             </Field>
  //           </div>

  //           <Divider label="E-Invoice / EWay / Sale Bill" />
  //           <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "flex-end" }}>
  //             <Field label="E-Invoice No" style={{ minWidth: 150 }}><DInput id="einvoiceno" name="einvoiceno" value={formData.einvoiceno} onChange={handleChange} disabled={dis} /></Field>
  //             <Field label="Ack No" style={{ minWidth: 130 }}><DInput id="ackno" name="ackno" value={formData.ackno} onChange={handleChange} disabled={dis} /></Field>
  //             <Field label="EWay Bill No" style={{ minWidth: 140 }}><DInput id="EWay_Bill_No" name="EWay_Bill_No" value={formData.EWay_Bill_No} onChange={handleChange} disabled={dis} /></Field>
  //             <Field label="Mill Eway Bill" style={{ minWidth: 130 }}><DInput id="MillEwayBill" name="MillEwayBill" value={formData.MillEwayBill} onChange={handleChange} disabled={dis} /></Field>
  //             <Field label="Mill Invoice No" style={{ minWidth: 130 }}><DInput id="MillInvoiceNo" name="MillInvoiceNo" value={formData.MillInvoiceNo} onChange={handleChange} disabled={dis} /></Field>
  //             <Field label="Mill Inv Date" style={{ minWidth: 120 }}><DDate id="mill_inv_date" name="mill_inv_date" value={formData.mill_inv_date} onChange={handleChange} disabled={dis} /></Field>
  //             <Field label="Eway Valid Date" style={{ minWidth: 120 }}><DDate id="EwayBillValidDate" name="EwayBillValidDate" value={formData.EwayBillValidDate} onChange={handleChange} disabled={dis} /></Field>
  //             <div className="do-checkbox-row" style={{ marginBottom: 2, alignSelf: "flex-end" }}>
  //               <input type="checkbox" id="EWayBillChk" name="EWayBillChk" value={formData.EWayBillChk} onChange={handleChange} disabled={dis} style={{ width: 13, height: 13, accentColor: "#1d4ed8" }} />
  //               <label htmlFor="EWayBillChk" className="do-checkbox-label">EWay Checked</label>
  //             </div>
  //           </div>


  //           <Divider label="Voucher & Sale Bill" />

  //           {/* Voucher / SB row */}
  //           <div className="do-voucher-row">
  //             {/* Voucher No */}
  //             <div className="do-chip-doc">
  //               <span className="do-chip-doc-label">Voucher No:</span>
  //               <span className="do-chip-doc-value"
  //                 onClick={() => handleRowClick(formData.voucher_no, formData.voucher_type)}>
  //                 {formData.voucher_no || "—"}
  //               </span>
  //               {formData.voucher_type && <span className="do-tag do-tag-type">{formData.voucher_type}</span>}
  //             </div>

  //             {/* Sale Bill No */}
  //             <div className="do-chip-doc">
  //               <span className="do-chip-doc-label">Sale Bill No:</span>
  //               <span className={`do-chip-doc-value ${(!formData.SB_No || isEditing) ? "disabled" : ""}`}
  //                 onClick={() => { if (!isEditing && formData.SB_No) handleRowClick(formData.SB_No, "SB"); }}>
  //                 {formData.SB_No || "—"}
  //               </span>
  //             </div>

  //             {/* Tender Detail ID */}
  //             <div className="do-chip-doc">
  //               <span className="do-chip-doc-label">Tender Detail ID:</span>
  //               <span className="do-chip-doc-value" style={{ cursor: "default" }}>{formData.tenderdetailid || "—"}</span>
  //             </div>

  //             <div style={{ flex: 1 }} />

  //             {/* SB Generate */}
  //             <Btn onClick={handleSBGenerate}
  //               disabled={formData.SB_No !== 0 || isEditing || formData.tenderdetailid === null}
  //               variant="gold">
  //               {isLoading ? "⏳" : "⚡"} SB Generate
  //             </Btn>
  //             <SaleBillReport doc_no={formData.SB_No} disabledFeild={formData.SB_No === 0 || formData.SB_No === ""} />
  //             <CarporateSaleBillPrint doc_no={formData.SB_No}
  //               disabledFeild={!addOneButtonEnabled || !(formData.SB_No != 0 && formData.SB_No !== "") || !(formData.Freight_Amount != 0 && formData.Freight_Amount !== "")} />
  //           </div>

  //           <Divider label="Reports & Actions" />

  //           <div className="do-reports-row">
  //             <DeliveryOrderOurDoReport doc_no={formData.doc_no} disabledFeild={isEditing || !addOneButtonEnabled} />
  //             <PartyBillDoReport doc_no={formData.doc_no} disabledFeild={isEditing || !addOneButtonEnabled} />
  //             <PartyDOReport doc_no={formData.doc_no}
  //               disabledFeild={!(Company_Name?.substring(0, 2).toUpperCase() === "JK" && addOneButtonEnabled)} />
  //             <Btn onClick={handleGenerateEwayBill}
  //               disabled={isEditingOrNoSB || isEwayGenerated || isBothNotGenerated || formData.tenderdetailid === null}
  //               variant="success">🛣️ EwayBill</Btn>
  //             <Btn onClick={handleGenerateEInvoice}
  //               disabled={isEditingOrNoSB || isEInvoiceGenerated || isBothNotGenerated || formData.tenderdetailid === null}
  //               variant="success">📄 eInvoice</Btn>
  //             <Btn onClick={handleGenerateEInvoiceEwaybill}
  //               disabled={isEditingOrNoSB || isEInvoiceGenerated || isEwayGenerated || formData.tenderdetailid === null}
  //               variant="success">📦 eInvoice & EWay</Btn>
  //             <Btn onClick={() => window.open("/pending-sb-list", "_blank")} variant="ghost">📋 Pending Sale Bills</Btn>
  //             {!isMobile && (
  //               <ProformaInvoice doc_no={formData.doc_no}
  //                 disabledFeild={!addOneButtonEnabled || !(formData.SB_No === 0 || formData.SB_No === "")} />
  //             )}
  //           </div>



  //         </CollapsibleCard>

  //         {/* ─── ROW 2: LEFT (Mill+Party combined) | RIGHT (Qty+Rates+Transport) ─── */}
  //         <div className="do-main-grid">

  //           {/* LEFT COLUMN: Mill + Party stacked */}
  //           <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>

  //             {/* Mill & Purchase */}
  //             <CollapsibleCard icon="🏭" title="Mill & Purchase" defaultOpen={true}>
  //               <div className="do-field" style={{ marginBottom: 6 }}>
  //                 <FL required>Mill Code</FL>
  //                 <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
  //                   <AccountMasterHelp name="mill_code" onAcCodeClick={handlemill_code}
  //                     CategoryName={lblmillname} CategoryCode={newmill_code} Ac_type={[]}
  //                     disabledFeild={isEditMode || addOneButtonEnabled} disabledInput={isMobile} />
  //                   <BalanceChip balance={millBalance} formatFn={formatReadableAmount} />
  //                   <Field label="Mill State">
  //                     <GSTStateMasterHelp onAcCodeClick={handleMillGSTStateCode} name="MillGSTStateCode"
  //                       GstStateName={MillByName || millstatename}
  //                       GstStateCode={MillByCode || formData.MillGSTStateCode}
  //                       disabledFeild={true} />
  //                   </Field>
  //                 </div>

  //               </div>
  //               <div className="do-g4">
  //                 <Field label="Purchase No.">
  //                   <PurcnoHelp onAcCodeClick={handlePurcno} name="purc_no"
  //                     Tenderid={lblTenderid || Tenderid} Tenderno={newPurcno || formData.purc_no || Tenderno}
  //                     disabledFeild={isEditing || (addOneButtonEnabled && !isEditing)}
  //                     disabledFeild1={!isEditing && addOneButtonEnabled}
  //                     Millcode={formData.mill_code || millcode}
  //                     onTenderDetailsFetched={ChangeData ? handleTenderDetailsFetched : handleTenderWithoutCarpoDetailsFetched} />
  //                 </Field>
  //                 <Field label="GST Code">
  //                   <GSTRateMasterHelp name="GstRateCode" onAcCodeClick={handleGstRateCode}
  //                     GstRateName={tenderDetails.gstratename || lblgstratename}
  //                     GstRateCode={tenderDetails.gstratecode || newGstRateCode}
  //                     disabledFeild={isEditing || (addOneButtonEnabled && !isEditing)} />
  //                 </Field>

  //                 <Field label="Brand Code">
  //                   <SystemHelpMaster name="brandcode" onAcCodeClick={handlebrandcode}
  //                     CategoryName={lblbrandname} CategoryCode={newbrandcode}
  //                     SystemType="I" disabledField={dis} />
  //                 </Field>

  //                 <Field label="Item Code">
  //                   <SystemHelpMaster onAcCodeClick={handleItemSelect}
  //                     CategoryName={tenderDetails.itemname || lblitemname}
  //                     CategoryCode={tenderDetails.itemcode || newitemcode}
  //                     name="Item_Select" SystemType="I" disabledField={dis} />
  //                 </Field>


  //               </div>
  //               <div className="do-g3" style={{ marginTop: 4 }}>
  //                 <Field label="Get Pass" required>
  //                   <AccountMasterHelp name="GETPASSCODE" Ac_type="" onAcCodeClick={handleGETPASSCODE}
  //                     CategoryName={ChangeData ? getpassTitle : tenderDetails?.Getpassnoname || lblgetpasscodename || getpasscodename}
  //                     CategoryCode={ChangeData ? CarporateState?.newGETPASSCODE : tenderDetails?.Getpassno || formData?.GETPASSCODE || getpasscode}
  //                     disabledFeild={isEditing || (addOneButtonEnabled && !isEditing)} />
  //                 </Field>
  //                 <Field label="Get Pass State">
  //                   <GSTStateMasterHelp onAcCodeClick={handleGetpassGstStateCode} name="GetpassGstStateCode"
  //                     GstStateName={tenderDetails.Getpassnonamestatename || GetPassByName || getpassstatecodename}
  //                     GstStateCode={tenderDetails.Getpassnonamestatecode || GetpassByCode || formData.GetpassGstStateCode}
  //                     disabledFeild={true} />
  //                 </Field>


  //                 <Field label="Grade">
  //                   <GradeMasterHelp name="Grade" onAcCodeClick={handleGrade}
  //                     CategoryName={formData.grade || newGrade} disabledField={true} onCategoryChange={handleGradeUpdate} />
  //                 </Field>

  //               </div>

  //             </CollapsibleCard>

  //             {/* Party Details */}
  //             <CollapsibleCard icon="🏢" title="Party Details" defaultOpen={true}>
  //               {/* Shipped To */}
  //               <div className="do-field" style={{ marginBottom: 6 }}>
  //                 <FL required>Shipped To</FL>
  //                 <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, marginBottom: 3 }}>
  //                   <AccountMasterHelp name="voucher_by" Ac_type="" onAcCodeClick={handlevoucher_by}
  //                     CategoryName={ChangeData ? voucherTitle : tenderDetails.buyername || voucherTitle || lblvoucherByname}
  //                     CategoryCode={ChangeData ? CarporateState.voucher_by : tenderDetails.Buyer || newvoucher_by}
  //                     disabledFeild={dis} disabledInput={isMobile} firstInputRef={shipToRef} />
  //                   <BalanceChip balance={shipToBalance} formatFn={formatReadableAmount} />
  //                   <GSTChip gst={shipToGSTNo} />
  //                   <GSTStateMasterHelp onAcCodeClick={handleVoucherbyGstStateCode} name="VoucherbyGstStateCode"
  //                     GstStateName={tenderDetails.shiptostatename || VoucherByName || voucherbystatename}
  //                     GstStateCode={tenderDetails.shiptostatecode || VoucherByCode || formData.VoucherbyGstStateCode}
  //                     disabledFeild={true} />
  //                 </div>

  //               </div>

  //               {/* Sale Bill To */}
  //               <div className="do-field" style={{ marginBottom: 6 }}>
  //                 <FL required>Sale Bill To</FL>
  //                 <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, marginBottom: 3 }}>
  //                   <AccountMasterHelp name="SaleBillTo" Ac_type="" onAcCodeClick={handleSaleBillTo}
  //                     CategoryName={ChangeData ? salebillTitle : tenderDetails.buyername || salebillTitle || lblsalebilltoname}
  //                     CategoryCode={ChangeData ? CarporateState.SaleBillTo : tenderDetails.Buyer || newSaleBillTo}
  //                     disabledFeild={(isEditMode && String(formData.GETPASSCODE) === String(formData.SaleBillTo)) || dis}
  //                     disabledInput={isMobile} />
  //                   <BalanceChip balance={billToBalance} formatFn={formatReadableAmount} />
  //                   <GSTChip gst={billToGSTNo} />
  //                   <GSTStateMasterHelp onAcCodeClick={handleSalebilltoGstStateCode} name="SalebilltoGstStateCode"
  //                     GstStateName={SaleBillByName || tenderDetails.buyeridcitystate || salebilltostatename}
  //                     GstStateCode={SaleBillByCode || tenderDetails.buyergststatecode || formData.SalebilltoGstStateCode}
  //                     disabledFeild={true} />
  //                 </div>
  //                 <div className="do-g2">

  //                   <Field label="Godown Code">
  //                     <SystemHelpMaster onAcCodeClick={handleGoDown} CategoryName={lblGodownName} CategoryCode={newGodownCode}
  //                       name="godownCode" SystemType="W"
  //                       disabledField={String(formData.GETPASSCODE) !== String(formData.SaleBillTo) || dis} />
  //                   </Field>
  //                   <Field label="Broker">
  //                     <AccountMasterHelp name="broker" Ac_type="" onAcCodeClick={handlebroker}
  //                       CategoryName={ChangeData ? brokerTitle : tenderDetails.buyerpartyname || brokerTitle || lblbrokername}
  //                       CategoryCode={ChangeData ? CarporateState.broker : tenderDetails.Buyer_Party || newbroker}
  //                       disabledFeild={dis} />
  //                   </Field>

  //                 </div>
  //               </div>
  //             </CollapsibleCard>

  //             <CollapsibleCard icon="📝" title="Narrations" defaultOpen={false}>
  //               <div className="do-g3">
  //                 {[
  //                   { label: "UTR Narration", id: "narration1" },
  //                   { label: "B.P Narration", id: "narration2" },
  //                   { label: "DO Narration", id: "narration3" },
  //                   { label: "Narration 4", id: "narration4" },
  //                   { label: "Freight Narration", id: "narration5" },
  //                   { label: "SB Narration", id: "SBNarration" },
  //                 ].map(({ label, id }) => (
  //                   <Field key={id} label={label}>
  //                     <DInput id={id} name={id} value={formData[id]} onChange={handleChange} disabled={dis} />
  //                   </Field>
  //                 ))}
  //               </div>
  //             </CollapsibleCard>

  //             <CollapsibleCard icon="🏦" title="Payment Detail Records" defaultOpen={true}
  //               badge={users.filter(u => u.rowaction !== "DNU" && u.rowaction !== "delete").length || null}>
  //               <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6 }}>
  //                 <AddButton openPopup={openPopup} isEditing={isEditing} ref={addButtonRef} setFocusToFirstField={setFocusToFirstField} />
  //               </div>
  //               <div style={{ overflowX: "auto", borderRadius: 6, border: "1px solid #e2e8f0" }}>
  //                 <table className="do-table">
  //                   <thead>
  //                     <tr>
  //                       {["Actions", "ID", "Type", "Bank Code", "Bank Name", "Narration", "Amount", "UTR No", "Lot No"].map(h => (
  //                         <th key={h}>{h}</th>
  //                       ))}
  //                     </tr>
  //                   </thead>
  //                   <tbody>
  //                     {users.map((user, idx) => (
  //                       <tr key={user.id}>
  //                         <td>
  //                           {user.rowaction === "add" || user.rowaction === "update" || user.rowaction === "Normal" ? (
  //                             <span style={{ display: "flex", gap: 4, justifyContent: "center" }}>
  //                               <EditButton editUser={editUser} user={user} isEditing={isEditing} />
  //                               <DeleteButton deleteModeHandler={deleteModeHandler} user={user} isEditing={isEditing} disabled={!isEditing || idx === 0} />
  //                             </span>
  //                           ) : (user.rowaction === "DNU" || user.rowaction === "delete") ? (
  //                             <OpenButton openDelete={openDelete} user={user} />
  //                           ) : null}
  //                         </td>
  //                         <td style={{ fontWeight: 600 }}>{user.id}</td>
  //                         <td>
  //                           <span style={{ display: "inline-block", padding: "2px 7px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: user.ddType === "T" ? "#dbeafe" : "#ede9fe", color: user.ddType === "T" ? "#1d4ed8" : "#6d28d9" }}>
  //                             {user.ddType}
  //                           </span>
  //                         </td>
  //                         <td style={{ fontFamily: "monospace", fontSize: 11 }}>{user.Bank_Code || tenderDetails.Payment_To}</td>
  //                         <td className="do-table-left">{user.bankcodeacname || tenderDetails.paymenttoname}</td>
  //                         <td className="do-table-left">{user.Narration}</td>
  //                         <td className="do-table-num">{formatReadableAmount(user.Amount)}</td>
  //                         <td style={{ fontFamily: "monospace", fontSize: 10 }}>{user.UTR_NO}</td>
  //                         <td>{user.LTNo}</td>
  //                       </tr>
  //                     ))}
  //                     {users.length === 0 && (
  //                       <tr><td colSpan={9} className="do-table-empty">No payment detail records</td></tr>
  //                     )}
  //                   </tbody>
  //                 </table>
  //               </div>
  //             </CollapsibleCard>


  //           </div>

  //           {/* RIGHT COLUMN: Qty+Rates + Transport stacked */}
  //           <div className="do-col">

  //             {/* Quantities & Rates */}
  //             <CollapsibleCard icon="⚖️" title="Quantities & Rates" defaultOpen={true}>
  //               <div className="do-g6" style={{ marginBottom: 6 }}>
  //                 <Field label="Quintal" required>
  //                   <DInput id="quantal" name="quantal" value={formData.quantal} onChange={handleChange}
  //                     onKeyDown={handleKeyDownCalculations} disabled={dis}
  //                     inputProps={{ onInput: validateNumericInput }} className="do-input-right" ref={quantalRef} />
  //                 </Field>
  //                 <Field label="Packing">
  //                   <DInput id="packing" name="packing" value={formData.packing} onChange={handleChange}
  //                     onKeyDown={handleKeyDownCalculations} disabled={dis}
  //                     inputProps={{ onInput: validateNumericInput }} className="do-input-right" />
  //                 </Field>
  //                 <Field label="Bags">
  //                   <DInput id="bags" name="bags" value={formData.bags} onChange={handleChange} disabled className="do-input-right" />
  //                 </Field>
  //                 <Field label="Mill Rate">
  //                   <DInput id="mill_rate" name="mill_rate" value={tenderDetails.mill_rate || formData.mill_rate} disabled className="do-input-right" />
  //                 </Field>

  //                 <Field label="Sale Rate" required>
  //                   <DInput id="sale_rate" name="sale_rate" value={formData.sale_rate} onChange={handleChange}
  //                     onKeyDown={handleKeyDownCalculations} disabled={dis || formData.SB_No !== 0}
  //                     inputProps={{ onInput: validateNumericInput }} className="do-input-right" />
  //                 </Field>
  //                 <Field label="Purchase Rate">
  //                   <DInput id="PurchaseRate" name="PurchaseRate" value={formData.PurchaseRate} onChange={handleChange}
  //                     onKeyDown={handleKeyDownCalculations} disabled={dis}
  //                     inputProps={{ onInput: validateNumericInput }} className="do-input-right" />
  //                 </Field>
  //               </div>
  //               <div className="do-g6" style={{ marginBottom: 6 }}>

  //                 <Field label="GST/Excise Rate">
  //                   <DInput id="excise_rate" name="excise_rate" value={formData.excise_rate} onChange={handleChange}
  //                     onKeyDown={handleKeyDownCalculations} disabled={dis}
  //                     inputProps={{ onInput: validateNumericInput }} className="do-input-right" />
  //                 </Field>
  //                 <Field label="Commission">
  //                   <DInput id="Tender_Commission" name="Tender_Commission"
  //                     value={ChangeData ? CarporateState.Tender_Commission : tenderDetails.CR || formData.Tender_Commission}
  //                     onChange={handleChange} onKeyDown={handleKeyDownCalculations} disabled={dis}
  //                     inputProps={{ onInput: validateNumericInput }} className="do-input-right" />
  //                 </Field>
  //                 <Field label="Diff Rate">
  //                   <DInput id="diff_rate" name="diff_rate" value={formData.diff_rate} onChange={handleChange}
  //                     onKeyDown={handleKeyDownCalculations} disabled={dis}
  //                     inputProps={{ onInput: validateNumericInput }} className="do-input-right" />
  //                 </Field>
  //                 <Field label="Diff Amount">
  //                   <DInput id="diff_amount" name="diff_amount" value={formData.diff_amount} onChange={handleChange}
  //                     onKeyDown={handleKeyDownCalculations} disabled={dis}
  //                     inputProps={{ onInput: validateNumericInput }} className="do-input-right" />
  //                 </Field>
  //                 <Field label="SB Other Amt">
  //                   <DInput id="SB_Other_Amount" name="SB_Other_Amount" value={formData.SB_Other_Amount} onChange={handleChange}
  //                     onKeyDown={handleKeyDownCalculations} disabled={dis}
  //                     inputProps={{ onInput: validateNumericInput }} className="do-input-right" />
  //                 </Field>
  //                 <Field label="Insurance">
  //                   <DInput id="Insurance" name="Insurance" value={formData.Insurance} onChange={handleChange}
  //                     onKeyDown={handleKeyDownCalculations} disabled={dis}
  //                     inputProps={{ onInput: validateNumericInput }} className="do-input-right" />
  //                 </Field>
  //               </div>



  //               <Divider label="TCS / TDS" />
  //               <div className="do-g6" style={{ marginBottom: 6 }}>
  //                 <Field label="Purc TCS">
  //                   <DInput id="TCS_Rate" name="TCS_Rate" value={formData.TCS_Rate} onChange={handleChange}
  //                     onKeyDown={handleKeyDownCalculations} disabled={TCSApplication !== "Y" || dis}
  //                     inputProps={{ onInput: validateNumericInput }} className="do-input-right" />
  //                 </Field>
  //                 <Field label="Sale TCS">
  //                   <DInput id="Sale_TCS_Rate" name="Sale_TCS_Rate" value={formData.Sale_TCS_Rate} onChange={handleChange}
  //                     onKeyDown={handleKeyDownCalculations} disabled={TCSApplication !== "Y" || dis}
  //                     inputProps={{ onInput: validateNumericInput }} className="do-input-right" />
  //                 </Field>
  //                 <Field label="Sale TDS">
  //                   <DInput id="SaleTDSRate" name="SaleTDSRate" value={formData.SaleTDSRate} onChange={handleChange}
  //                     onKeyDown={handleKeyDownCalculations} disabled={isEditMode ? !isEditing : !addOneButtonEnabled}
  //                     inputProps={{ onInput: validateNumericInput }} className="do-input-right" />
  //                 </Field>
  //                 <Field label="Purc TDS">
  //                   <DInput id="PurchaseTDSRate" name="PurchaseTDSRate" value={formData.PurchaseTDSRate} onChange={handleChange}
  //                     onKeyDown={handleKeyDownCalculations} disabled={isEditMode ? !isEditing : !addOneButtonEnabled}
  //                     inputProps={{ onInput: validateNumericInput }} className="do-input-right" />
  //                 </Field>
  //               </div>
  //               <div className="do-amt-row">
  //                 <AmtBox label="Mill Amount" value={formatReadableAmount(formData.amount)} color="blue" />
  //                 <AmtBox label="Mill Amt (TCS)" value={formatReadableAmount(formData.Mill_AmtWO_TCS)} color="amber" />
  //                 {formData.final_amout && <AmtBox label="Final Amount" value={formatReadableAmount(formData.final_amout)} color="green" />}
  //               </div>
  //               <Divider label="Purchase GST" />
  //               <div className="do-g5">
  //                 {[{ label: "CGST", id: "PurchaseCSGTamt" }, { label: "SGST", id: "PurchaseSGSTamt" }, { label: "IGST", id: "PurchaseIGSTamt" }, { label: "TCS Amt", id: "PurchaseTCSamt" }, { label: "TDS Amt", id: "PurchaseTDSamt" }].map(({ label, id }) => (
  //                   <Field key={id} label={label}>
  //                     <DInput id={id} name={id} value={formData[id]} onChange={handleChange} disabled={dis} className="do-input-right" />
  //                   </Field>
  //                 ))}
  //               </div>
  //             </CollapsibleCard>

  //             {/* Transport & Logistics */}
  //             <CollapsibleCard icon="🚛" title="Transport & Logistics" defaultOpen={true}>
  //               <div className="do-g4" style={{ marginBottom: 6 }}>
  //                 <Field label="Truck No" required>
  //                   <DInput id="truck_no" name="truck_no" value={formData.truck_no} onChange={handleChange} disabled={dis} />
  //                 </Field>
  //                 <Field label="Driver Mobile">
  //                   <DInput id="driver_no" name="driver_no" value={formData.driver_no} onChange={handleChange}
  //                     disabled={dis} inputProps={{ maxLength: 10, inputMode: "numeric" }} />
  //                 </Field>
  //                 <Field label="Distance (km)">
  //                   <DInput id="Distance" name="Distance" value={formData.Distance} onChange={handleChange}
  //                     disabled={dis} inputProps={{ onInput: validateNumericInput }} className="do-input-right" />
  //                 </Field>
  //                 <Field label="PAN No">
  //                   <DInput id="Pan_No" name="Pan_No" value={formData.Pan_No} onChange={handleChange}
  //                     disabled={dis} inputProps={{ style: { textTransform: "uppercase" }, maxLength: 10 }} />
  //                 </Field>
  //               </div>
  //               <div className="do-field" style={{ marginBottom: 6 }}>
  //                 <FL required>Transport</FL>
  //                 <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, marginBottom: 3 }}>
  //                   <AccountMasterHelp onAcCodeClick={handletransport} name="transport"
  //                     CategoryName={lbltransportname || transportcodename}
  //                     CategoryCode={newtransport || formData.transport || transportcode}
  //                     disabledFeild={dis} Ac_type="" />
  //                 </div>
  //                 <GSTStateMasterHelp onAcCodeClick={handleTransportGSTStateCode} name="TransportGSTStateCode"
  //                   GstStateName={lbltransportstatename || transportstatename}
  //                   GstStateCode={newTransportGSTStateCode || formData.TransportGSTStateCode}
  //                   disabledFeild={true} />
  //               </div>
  //               <div className="do-g5" style={{ marginBottom: 6 }}>
  //                 <Field label="Freight/Qtl">
  //                   <DInput id="FreightPerQtl" name="FreightPerQtl" value={formData.FreightPerQtl} onChange={handleChange}
  //                     onKeyDown={handleKeyDownCalculations} disabled={dis}
  //                     inputProps={{ onInput: validateNumericInput }} className="do-input-right" />
  //                 </Field>
  //                 <Field label="Freight Amt">
  //                   <DInput id="Freight_Amount" name="Freight_Amount" value={formData.Freight_Amount} onChange={handleChange}
  //                     onKeyDown={handleKeyDownCalculations} disabled={dis}
  //                     inputProps={{ onInput: validateNumericInput }} className="do-input-right" />
  //                 </Field>
  //                 <Field label="Memo Rate">
  //                   <DInput id="MM_Rate" name="MM_Rate" value={formData.MM_Rate} onChange={handleChange}
  //                     onKeyDown={handleKeyDownCalculations} disabled={dis}
  //                     inputProps={{ onInput: validateNumericInput }} className="do-input-right" />
  //                 </Field>
  //                 <Field label="Memo Advance">
  //                   <DInput id="Memo_Advance" name="Memo_Advance" value={formData.Memo_Advance} onChange={handleChange}
  //                     onKeyDown={handleKeyDownCalculations} disabled={dis}
  //                     inputProps={{ onInput: validateNumericInput }} className="do-input-right" />
  //                 </Field>
  //                 <Field label="Memo Type">
  //                   <DSelect id="MM_CC" name="MM_CC" value={formData.MM_CC} onChange={handleChange} disabled={dis}>
  //                     <option value="Credit">Credit</option>
  //                     <option value="Cash">Cash</option>
  //                   </DSelect>
  //                 </Field>
  //                 <Field label="Memo GST">
  //                   <GSTRateMasterHelp name="MemoGSTRate" onAcCodeClick={handleMemoGSTRate}
  //                     GstRateName={lblMemoGSTRatename || GSTMemoGstrate} GstRateCode={newMemoGSTRate || GSTMemoGstcode}
  //                     disabledFeild={dis} />
  //                 </Field>
  //                 <Field label="RCM Number">
  //                   <DInput id="RCMNumber" name="RCMNumber" value={formData.RCMNumber} onChange={handleChange}
  //                     onKeyDown={handleKeyDownCalculations} disabled={dis} className="do-input-right" />
  //                 </Field>
  //                 <div className="do-checkbox-row" style={{ alignSelf: "flex-end", marginBottom: 3 }}>
  //                   <input type="checkbox" id="mill_rcv" name="mill_rcv" value={formData.mill_rcv}
  //                     onChange={handleChange} disabled={dis} style={{ width: 13, height: 13, accentColor: "#1d4ed8" }} />
  //                   <label htmlFor="mill_rcv" className="do-checkbox-label">Invoice Checked</label>
  //                 </div>
  //               </div>

  //               <Divider label="TDS / BP / Vasuli / DO" />
  //               <div className="do-g4">
  //                 <Field label="TDS A/c">
  //                   <AccountMasterHelp name="TDSAc" Ac_type="" onAcCodeClick={handleTDSAc}
  //                     CategoryName={lbltdsacname} CategoryCode={newTDSAc || formData.TDSAc} disabledFeild={dis} />
  //                 </Field>
  //                 <Field label="TDS Rate">
  //                   <DInput id="TDSRate" name="TDSRate" value={formData.TDSRate} onChange={handleChange}
  //                     onKeyDown={handleKeyDownCalculations} disabled={dis} className="do-input-right" />
  //                 </Field>
  //                 <Field label="TDS Amount">
  //                   <DInput id="TDSAmt" name="TDSAmt" value={formData.TDSAmt} onChange={handleChange}
  //                     onKeyDown={handleKeyDownCalculations} disabled={dis} className="do-input-right" />
  //                 </Field>
  //                 <div className="do-checkbox-row" style={{ alignSelf: "flex-end", marginBottom: 3 }}>
  //                   <input type="checkbox" id="TDSCut" name="TDSCut" value={formData.TDSCut}
  //                     onChange={handleChange} disabled={dis} style={{ width: 13, height: 13, accentColor: "#dc2626" }} />
  //                   <label htmlFor="TDSCut" className="do-checkbox-label">TDS cut by us</label>
  //                 </div>
  //                 <Field label="B.P Amount">
  //                   <DInput id="Cash_diff" name="Cash_diff" value={formData.Cash_diff} onChange={handleChange}
  //                     onKeyDown={handleKeyDownCalculations} disabled={dis} className="do-input-right" />
  //                 </Field>

  //                 <Field label="Vasuli Rate">
  //                   <DInput id="vasuli_rate" name="vasuli_rate" value={formData.vasuli_rate} onChange={handleChange}
  //                     onKeyDown={handleKeyDownCalculations} disabled={dis} className="do-input-right" />
  //                 </Field>
  //                 <Field label="Vasuli Amt">
  //                   <DInput id="vasuli_amount" name="vasuli_amount" value={formData.vasuli_amount}
  //                     onChange={handleChange} disabled={dis} className="do-input-right" />
  //                 </Field>
  //                 <Field label="Vasuli A/c">
  //                   <AccountMasterHelp name="Vasuli_Ac" Ac_type="" onAcCodeClick={handleVasuli_Ac}
  //                     CategoryName={lblvasuliacname} CategoryCode={newVasuli_Ac} disabledFeild={dis} />
  //                 </Field>
  //                 <Field label="DO A/c">
  //                   <AccountMasterHelp name="DO" Ac_type="" onAcCodeClick={handleDO}
  //                     CategoryName={tenderDetails.tenderdoname || lblDoname}
  //                     CategoryCode={tenderDetails.Tender_DO || newDO} disabledFeild={dis} />
  //                 </Field>
  //               </div>


  //               <Divider label="BP A/c " />
  //               <div className="do-g4">
  //                 <Field label="B.P A/c">
  //                   <AccountMasterHelp name="CashDiffAc" Ac_type="" onAcCodeClick={handleCashDiffAc}
  //                     CategoryName={tenderDetails.buyername || lblcashdiffacname}
  //                     CategoryCode={tenderDetails.Buyer || newCashDiffAc} disabledFeild={dis} />
  //                 </Field>


  //               </div>
  //             </CollapsibleCard>

  //           </div>
  //         </div>



  //       </div>
  //     </form>

  //     {/* Loading */}
  //     {isLoading && (
  //       <div className="do-loading-overlay">
  //         <div className="do-loading-box"><TruckLoader /></div>
  //       </div>
  //     )}

  //     {/* Detail Popup */}
  //     {showPopup && (
  //       <div className="do-popup-overlay">
  //         <div className="do-popup">
  //           <div className="do-popup-header">
  //             <span className="do-popup-title">{selectedUser.id ? "✏️ Update Detail Record" : "➕ Add Detail Record"}</span>
  //             <button onClick={closePopup} className="do-popup-close">×</button>
  //           </div>
  //           <div className="do-popup-body">
  //             <Field label="DD Type">
  //               <DSelect id="ddType" name="ddType" value={formDataDetail.ddType} onChange={handleChangeDetail} disabled={dis}>
  //                 <option value="T">Transfer Letter</option>
  //                 <option value="D">Demand Draft</option>
  //               </DSelect>
  //             </Field>
  //             <Field label="Bank Code">
  //               <AccountMasterHelp onAcCodeClick={handleBankCode}
  //                 CategoryName={tenderDetails.paymenttoname || bankcodeacname}
  //                 CategoryCode={tenderDetails.Payment_To || bankcode || formDataDetail.Bank_Code}
  //                 name="Bank_Code" Ac_type="" disabledFeild={dis} />
  //             </Field>
  //             <Field label="Narration">
  //               <DInput id="Narration" name="Narration" value={formDataDetail.Narration} onChange={handleChangeDetail} disabled={dis} />
  //             </Field>
  //             <Field label="Amount">
  //               <DInput id="Amount" name="Amount" value={formDataDetail.Amount} onChange={handleChangeDetail} disabled={dis} className="do-input-right" />
  //             </Field>
  //             <Field label="UTR No">
  //               <DoUtrNoHelp name="UTR_NO" companyCode={companyCode}
  //                 bankCode={tenderDetails.Payment_To || bankcode || formDataDetail.Bank_Code}
  //                 defaultUtrNo={formDataDetail.UTR_NO} onUtrSelect={handleUTRNo} />
  //             </Field>
  //             <Field label="LT No">
  //               <DInput id="LTNo" name="LTNo" value={formDataDetail.LTNo} onChange={handleChangeDetail} disabled={dis} />
  //             </Field>
  //           </div>
  //           <div className="do-popup-footer">
  //             {selectedUser.id ? <DetailUpdateButton updateUser={updateUser} /> : <DetailAddButtomCommon addUser={addUser} />}
  //             <DetailCloseButton closePopup={closePopup} />
  //           </div>
  //         </div>
  //       </div>
  //     )}

  //     {/* EWay Dialog */}
  //     <Dialog open={isOpenEwayBill} onClose={handleCloseEwayBill} maxWidth="lg" fullWidth>
  //       <DialogTitle sx={{ textAlign: "center", fontWeight: 700, background: "#0f1f3d", color: "#e2c97e", borderBottom: "2px solid #e2c97e" }}>EwayBill Generation</DialogTitle>
  //       <IconButton onClick={handleCloseEwayBill} sx={{ position: "absolute", right: 16, top: 8, bgcolor: "#374151", color: "#fff", borderRadius: "8px" }}><CloseIcon /></IconButton>
  //       <DialogContent>
  //         <EwayBillGeneration doc_no={formData.SB_No} do_no={formData.doc_no} tran_type="SB"
  //           handleClose={handleCloseEwayBill} Company_Code={companyCode} Year_Code={Year_Code} />
  //       </DialogContent>
  //     </Dialog>

  //     {/* E-Invoice Dialog */}
  //     <Dialog open={isOpenEInvoice} onClose={handleCloseEInvoice} maxWidth="lg" fullWidth>
  //       <DialogTitle sx={{ textAlign: "center", fontWeight: 700, background: "#0f1f3d", color: "#e2c97e", borderBottom: "2px solid #e2c97e" }}>E-Invoice Generation</DialogTitle>
  //       <IconButton onClick={handleCloseEInvoice} sx={{ position: "absolute", right: 16, top: 8, bgcolor: "#374151", color: "#fff", borderRadius: "8px" }}><CloseIcon /></IconButton>
  //       <DialogContent>
  //         <EInvoiceGeneration doc_no={formData.SB_No} do_no={formData.doc_no} tran_type="SB"
  //           handleClose={handleCloseEInvoice} Company_Code={companyCode} Year_Code={Year_Code} />
  //       </DialogContent>
  //     </Dialog>

  //     {/* E-Invoice + EWaybill Dialog */}
  //     <Dialog open={isOpenEInvoiceEwaybill} onClose={handleCloseEInvoiceEwaybill} maxWidth="lg" fullWidth>
  //       <DialogTitle sx={{ textAlign: "center", fontWeight: 700, background: "#0f1f3d", color: "#e2c97e", borderBottom: "2px solid #e2c97e" }}>E-Invoice + E-Waybill Generation</DialogTitle>
  //       <IconButton onClick={handleCloseEInvoiceEwaybill} sx={{ position: "absolute", right: 16, top: 8, bgcolor: "#374151", color: "#fff", borderRadius: "8px" }}><CloseIcon /></IconButton>
  //       <DialogContent>
  //         <EInvoiceEwayBillGeneration doc_no={formData.SB_No} do_no={formData.doc_no} tran_type="SB"
  //           handleClose={handleCloseEInvoiceEwaybill} Company_Code={companyCode} Year_Code={Year_Code} />
  //       </DialogContent>
  //     </Dialog>
  //   </div>
  // );



  return (
    <div className="do-root" style={{ marginBottom: "80px" }}>
      <style>{styles}</style>
      <ToastContainer autoClose={500} />

      {/* ════════════════ TOP BAR ════════════════ */}
      <div className="do-topbar">

        {/* Title / Doc No / Tags / Audit / Unlock */}
        <div className="do-topbar-inner">
          <span className="do-title">Delivery Order</span>
          <div className="do-docno"># {formData.doc_no}</div>
          {formData.tenderdetailid === null && <span className="do-tag do-tag-deleted">DELETED</span>}
          {season && <span className="do-tag do-tag-season">{season}</span>}
          <div style={{ flex: 1 }} />
          <div className="do-audit" style={{ flexShrink: 0 }}>
            {formData.Created_By && <span>Created by <strong>{formData.Created_By}</strong></span>}
            {formData.Modified_By && <span>· Modified by <strong>{formData.Modified_By}</strong></span>}
          </div>
          <Btn onClick={handleRecordUnlocked} variant="unlock">🔓</Btn>
        </div>

        {/* ── ACTION LEFT  |  push  |  NAVIGATION RIGHT — single scrollable row ── */}
        <div style={{ marginTop: '20px' }}>
          {/* Actions — left side */}
          <ActionButtonGroup
            handleAddOne={handleAddOne} addOneButtonEnabled={addOneButtonEnabled}
            handleSaveOrUpdate={handleSaveOrUpdate} saveButtonEnabled={saveButtonEnabled}
            isEditMode={isEditMode} handleEdit={handleEdit} editButtonEnabled={editButtonEnabled}
            handleDelete={handleDelete} deleteButtonEnabled={deleteButtonEnabled}
            handleCancel={handleCancel} cancelButtonEnabled={cancelButtonEnabled}
            handleBack={handleBack} backButtonEnabled={backButtonEnabled}
            permissions={permissions} isDeleted={formData.tenderdetailid === null}
          />

          {/* Separator */}
          <div style={{ width: 1, height: 20, background: "rgba(255,255,255,.15)", flexShrink: 0 }} />


          {/* Navigation — right side */}

          {/*     
  <NavigationButtons
    handleFirstButtonClick={handleFirstButtonClick}
    handlePreviousButtonClick={handlePreviousButtonClick}
    handleNextButtonClick={handleNextButtonClick}
    handleLastButtonClick={handleLastButtonClick}
    highlightedButton={highlightedButton}
    isEditing={isEditing}
  /> */}

        </div>
      </div>

      {/* ════════════════ FORM ════════════════ */}
      <form onSubmit={handleSubmit}>

        {/* ──────────────────────────────────────
          DESKTOP LAYOUT  (hidden on mobile)
          ────────────────────────────────────── */}
        <div className="do-desktop-only" style={{ padding: "8px 10px", display: "flex", flexDirection: "column", gap: 6 }}>

          {/* ─── DOCUMENT INFORMATION CARD ─── */}
          <CollapsibleCard icon="📋" title="Document Information" defaultOpen={true}>

            {/* Change No — first field in this card */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "flex-end", marginBottom: 6 }}>
              <Field label="Change No" style={{ minWidth: 80, maxWidth: 100 }}>
                <input
                  onKeyDown={handleKeyDown}
                  disabled={!addOneButtonEnabled}
                  style={{
                    height: 28, padding: "0 7px", fontSize: 12, fontWeight: 600,
                    borderRadius: 5, border: "1px solid #cbd5e1", background: "#fff",
                    color: "#1e293b", outline: "none", width: "100%",
                    fontFamily: "'DM Mono', monospace", boxSizing: "border-box"
                  }}
                  placeholder="Doc #"
                />
              </Field>

              <Field label="Date" required>
                <DDate id="doc_date" name="doc_date" value={formData.doc_date} onChange={handleChange} disabled={dis} />
              </Field>
              <Field label="DO Date">
                <DDate id="Do_DATE" name="Do_DATE" value={formData.Do_DATE} onChange={handleChange} disabled={dis} />
              </Field>
              <Field label="Purc Date">
                <DDate id="Purchase_Date" name="Purchase_Date" value={formData.Purchase_Date} onChange={handleChange} disabled={dis} />
              </Field>
              <Field label="Carpo. Sale No">
                <CarporateHelp Name="Carporate_Sale_No" onAcCodeClick={handleCarporate}
                  Carporate_no={Carporateno || formData.Carporate_Sale_No} disabledFeild={dis}
                  onTenderDetailsFetched={handleCarporateDetailsFetched} />
              </Field>
              <Field label="DO Type">
                <DSelect id="desp_type" name="desp_type" value={formData.desp_type} onChange={handleChange}
                  disabled={isEditMode || addOneButtonEnabled}>
                  <option value="DO">D.O</option>
                  <option value="DI">Dispatch</option>
                </DSelect>
              </Field>
              <Field label="Delivery Type">
                <DSelect id="Delivery_Type" name="Delivery_Type" value={formData.Delivery_Type} onChange={handleChange}
                  disabled={isEditMode || addOneButtonEnabled || (formData.SaleBillTo !== "" && formData.SaleBillTo !== 0 && formData.SaleBillTo !== 2)}>
                  <option value="C">Commission</option>
                  <option value="N">With GST Naka</option>
                  <option value="A">Naka w/o GST</option>
                  <option value="D">DO</option>
                </DSelect>
              </Field>
            </div>

            <Divider label="E-Invoice / EWay / Sale Bill" />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "flex-end" }}>
              <Field label="E-Invoice No" style={{ minWidth: 150 }}>
                <DInput id="einvoiceno" name="einvoiceno" value={formData.einvoiceno} onChange={handleChange} disabled={dis} />
              </Field>
              <Field label="Ack No" style={{ minWidth: 130 }}>
                <DInput id="ackno" name="ackno" value={formData.ackno} onChange={handleChange} disabled={dis} />
              </Field>
              <Field label="EWay Bill No" style={{ minWidth: 140 }}>
                <DInput id="EWay_Bill_No" name="EWay_Bill_No" value={formData.EWay_Bill_No} onChange={handleChange} disabled={dis} />
              </Field>
              <Field label="Mill Eway Bill" style={{ minWidth: 130 }}>
                <DInput id="MillEwayBill" name="MillEwayBill" value={formData.MillEwayBill} onChange={handleChange} disabled={dis} />
              </Field>
              <Field label="Mill Invoice No" style={{ minWidth: 130 }}>
                <DInput id="MillInvoiceNo" name="MillInvoiceNo" value={formData.MillInvoiceNo} onChange={handleChange} disabled={dis} />
              </Field>
              <Field label="Mill Inv Date" style={{ minWidth: 120 }}>
                <DDate id="mill_inv_date" name="mill_inv_date" value={formData.mill_inv_date} onChange={handleChange} disabled={dis} />
              </Field>
              <Field label="Eway Valid Date" style={{ minWidth: 120 }}>
                <DDate id="EwayBillValidDate" name="EwayBillValidDate" value={formData.EwayBillValidDate} onChange={handleChange} disabled={dis} />
              </Field>
              <div className="do-checkbox-row" style={{ marginBottom: 2, alignSelf: "flex-end" }}>
                <input type="checkbox" id="EWayBillChk" name="EWayBillChk" value={formData.EWayBillChk}
                  onChange={handleChange} disabled={dis} style={{ width: 13, height: 13, accentColor: "#1d4ed8" }} />
                <label htmlFor="EWayBillChk" className="do-checkbox-label">EWay Checked</label>
              </div>
            </div>

            <Divider label="Voucher & Sale Bill" />
            <div className="do-voucher-row">
              <div className="do-chip-doc">
                <span className="do-chip-doc-label">Voucher No:</span>
                <span className="do-chip-doc-value" onClick={() => handleRowClick(formData.voucher_no, formData.voucher_type)}>
                  {formData.voucher_no || "—"}
                </span>
                {formData.voucher_type && <span className="do-tag do-tag-type">{formData.voucher_type}</span>}
              </div>
              <div className="do-chip-doc">
                <span className="do-chip-doc-label">Sale Bill No:</span>
                <span className={`do-chip-doc-value ${(!formData.SB_No || isEditing) ? "disabled" : ""}`}
                  onClick={() => { if (!isEditing && formData.SB_No) handleRowClick(formData.SB_No, "SB"); }}>
                  {formData.SB_No || "—"}
                </span>
              </div>
              <div className="do-chip-doc">
                <span className="do-chip-doc-label">Tender Detail ID:</span>
                <span className="do-chip-doc-value" style={{ cursor: "default" }}>{formData.tenderdetailid || "—"}</span>
              </div>
              <div style={{ flex: 1 }} />
              <Btn onClick={handleSBGenerate}
                disabled={formData.SB_No !== 0 || isEditing || formData.tenderdetailid === null}
                variant="gold">
                {isLoading ? "⏳" : "⚡"} SB Generate
              </Btn>
              <SaleBillReport doc_no={formData.SB_No} disabledFeild={formData.SB_No === 0 || formData.SB_No === ""} />
              <CarporateSaleBillPrint doc_no={formData.SB_No}
                disabledFeild={!addOneButtonEnabled || !(formData.SB_No != 0 && formData.SB_No !== "") || !(formData.Freight_Amount != 0 && formData.Freight_Amount !== "")} />
            </div>

            <Divider label="Reports & Actions" />
            <div className="do-reports-row">
              <DeliveryOrderOurDoReport doc_no={formData.doc_no} disabledFeild={isEditing || !addOneButtonEnabled} />
              <PartyBillDoReport doc_no={formData.doc_no} disabledFeild={isEditing || !addOneButtonEnabled} />
              <PartyDOReport doc_no={formData.doc_no}
                disabledFeild={!(Company_Name?.substring(0, 2).toUpperCase() === "JK" && addOneButtonEnabled)} />
              <Btn onClick={handleGenerateEwayBill}
                disabled={isEditingOrNoSB || isEwayGenerated || isBothNotGenerated || formData.tenderdetailid === null}
                variant="success">🛣️ EwayBill</Btn>
              <Btn onClick={handleGenerateEInvoice}
                disabled={isEditingOrNoSB || isEInvoiceGenerated || isBothNotGenerated || formData.tenderdetailid === null}
                variant="success">📄 eInvoice</Btn>
              <Btn onClick={handleGenerateEInvoiceEwaybill}
                disabled={isEditingOrNoSB || isEInvoiceGenerated || isEwayGenerated || formData.tenderdetailid === null}
                variant="success">📦 eInvoice & EWay</Btn>
              <Btn onClick={() => window.open("/pending-sb-list", "_blank")} variant="ghost">📋 Pending Sale Bills</Btn>
              <ProformaInvoice doc_no={formData.doc_no}
                disabledFeild={!addOneButtonEnabled || !(formData.SB_No === 0 || formData.SB_No === "")} />
            </div>
          </CollapsibleCard>

          {/* ─── DESKTOP TWO-COLUMN MAIN GRID ─── */}
          <div className="do-main-grid">

            {/* LEFT COLUMN */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>

              {/* Mill & Purchase */}
              <CollapsibleCard icon="🏭" title="Mill & Purchase" defaultOpen={true}>
                <div className="do-field" style={{ marginBottom: 6 }}>
                  <FL required>Mill Code</FL>
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
                    <AccountMasterHelp name="mill_code" onAcCodeClick={handlemill_code}
                      CategoryName={lblmillname} CategoryCode={newmill_code} Ac_type={[]}
                      disabledFeild={isEditMode || addOneButtonEnabled} disabledInput={isMobile} />
                    <BalanceChip balance={millBalance} formatFn={formatReadableAmount} />
                    <Field label="Mill State">
                      <GSTStateMasterHelp onAcCodeClick={handleMillGSTStateCode} name="MillGSTStateCode"
                        GstStateName={MillByName || millstatename}
                        GstStateCode={MillByCode || formData.MillGSTStateCode}
                        disabledFeild={true} />
                    </Field>
                  </div>
                </div>
                <div className="do-g4">
                  <Field label="Purchase No.">
                    <PurcnoHelp onAcCodeClick={handlePurcno} name="purc_no"
                      Tenderid={lblTenderid || Tenderid} Tenderno={newPurcno || formData.purc_no || Tenderno}
                      disabledFeild={isEditing || (addOneButtonEnabled && !isEditing)}
                      disabledFeild1={!isEditing && addOneButtonEnabled}
                      Millcode={formData.mill_code || millcode}
                      onTenderDetailsFetched={ChangeData ? handleTenderDetailsFetched : handleTenderWithoutCarpoDetailsFetched} />
                  </Field>
                  <Field label="GST Code">
                    <GSTRateMasterHelp name="GstRateCode" onAcCodeClick={handleGstRateCode}
                      GstRateName={tenderDetails.gstratename || lblgstratename}
                      GstRateCode={tenderDetails.gstratecode || newGstRateCode}
                      disabledFeild={isEditing || (addOneButtonEnabled && !isEditing)} />
                  </Field>
                  <Field label="Brand Code">
                    <SystemHelpMaster name="brandcode" onAcCodeClick={handlebrandcode}
                      CategoryName={lblbrandname} CategoryCode={newbrandcode}
                      SystemType="I" disabledField={dis} />
                  </Field>
                  <Field label="Item Code">
                    <SystemHelpMaster onAcCodeClick={handleItemSelect}
                      CategoryName={tenderDetails.itemname || lblitemname}
                      CategoryCode={tenderDetails.itemcode || newitemcode}
                      name="Item_Select" SystemType="I" disabledField={dis} />
                  </Field>
                </div>
                <div className="do-g3" style={{ marginTop: 4 }}>
                  <Field label="Get Pass" required>
                    <AccountMasterHelp name="GETPASSCODE" Ac_type="" onAcCodeClick={handleGETPASSCODE}
                      CategoryName={ChangeData ? getpassTitle : tenderDetails?.Getpassnoname || lblgetpasscodename || getpasscodename}
                      CategoryCode={ChangeData ? CarporateState?.newGETPASSCODE : tenderDetails?.Getpassno || formData?.GETPASSCODE || getpasscode}
                      disabledFeild={isEditing || (addOneButtonEnabled && !isEditing)} />
                  </Field>
                  <Field label="Get Pass State">
                    <GSTStateMasterHelp onAcCodeClick={handleGetpassGstStateCode} name="GetpassGstStateCode"
                      GstStateName={tenderDetails.Getpassnonamestatename || GetPassByName || getpassstatecodename}
                      GstStateCode={tenderDetails.Getpassnonamestatecode || GetpassByCode || formData.GetpassGstStateCode}
                      disabledFeild={true} />
                  </Field>
                  <Field label="Grade">
                    <GradeMasterHelp name="Grade" onAcCodeClick={handleGrade}
                      CategoryName={formData.grade || newGrade} disabledField={true} onCategoryChange={handleGradeUpdate} />
                  </Field>
                </div>
              </CollapsibleCard>

              {/* Party Details */}
              <CollapsibleCard icon="🏢" title="Party Details" defaultOpen={true}>
                <div className="do-field" style={{ marginBottom: 6 }}>
                  <FL required>Shipped To</FL>
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    <AccountMasterHelp name="voucher_by" Ac_type="" onAcCodeClick={handlevoucher_by}
                      CategoryName={ChangeData ? voucherTitle : tenderDetails.buyername || voucherTitle || lblvoucherByname}
                      CategoryCode={ChangeData ? CarporateState.voucher_by : tenderDetails.Buyer || newvoucher_by}
                      disabledFeild={dis} disabledInput={isMobile} firstInputRef={shipToRef} />
                    <BalanceChip balance={shipToBalance} formatFn={formatReadableAmount} />
                    <GSTChip gst={shipToGSTNo} />
                    <GSTStateMasterHelp onAcCodeClick={handleVoucherbyGstStateCode} name="VoucherbyGstStateCode"
                      GstStateName={tenderDetails.shiptostatename || VoucherByName || voucherbystatename}
                      GstStateCode={tenderDetails.shiptostatecode || VoucherByCode || formData.VoucherbyGstStateCode}
                      disabledFeild={true} />
                  </div>
                </div>
                <div className="do-field" style={{ marginBottom: 6 }}>
                  <FL required>Sale Bill To</FL>
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    <AccountMasterHelp name="SaleBillTo" Ac_type="" onAcCodeClick={handleSaleBillTo}
                      CategoryName={ChangeData ? salebillTitle : tenderDetails.buyername || salebillTitle || lblsalebilltoname}
                      CategoryCode={ChangeData ? CarporateState.SaleBillTo : tenderDetails.Buyer || newSaleBillTo}
                      disabledFeild={(isEditMode && String(formData.GETPASSCODE) === String(formData.SaleBillTo)) || dis}
                      disabledInput={isMobile} />
                    <BalanceChip balance={billToBalance} formatFn={formatReadableAmount} />
                    <GSTChip gst={billToGSTNo} />
                    <GSTStateMasterHelp onAcCodeClick={handleSalebilltoGstStateCode} name="SalebilltoGstStateCode"
                      GstStateName={SaleBillByName || tenderDetails.buyeridcitystate || salebilltostatename}
                      GstStateCode={SaleBillByCode || tenderDetails.buyergststatecode || formData.SalebilltoGstStateCode}
                      disabledFeild={true} />
                  </div>
                  <div className="do-g2">
                    <Field label="Godown Code">
                      <SystemHelpMaster onAcCodeClick={handleGoDown} CategoryName={lblGodownName} CategoryCode={newGodownCode}
                        name="godownCode" SystemType="W"
                        disabledField={String(formData.GETPASSCODE) !== String(formData.SaleBillTo) || dis} />
                    </Field>
                    <Field label="Broker">
                      <AccountMasterHelp name="broker" Ac_type="" onAcCodeClick={handlebroker}
                        CategoryName={ChangeData ? brokerTitle : tenderDetails.buyerpartyname || brokerTitle || lblbrokername}
                        CategoryCode={ChangeData ? CarporateState.broker : tenderDetails.Buyer_Party || newbroker}
                        disabledFeild={dis} />
                    </Field>
                  </div>
                </div>
              </CollapsibleCard>

              <CollapsibleCard icon="📝" title="Narrations" defaultOpen={false}>
                <div className="do-g3">
                  {[
                    { label: "UTR Narration", id: "narration1" },
                    { label: "B.P Narration", id: "narration2" },
                    { label: "DO Narration", id: "narration3" },
                    { label: "Narration 4", id: "narration4" },
                    { label: "Freight Narration", id: "narration5" },
                    { label: "SB Narration", id: "SBNarration" },
                  ].map(({ label, id }) => (
                    <Field key={id} label={label}>
                      <DInput id={id} name={id} value={formData[id]} onChange={handleChange} disabled={dis} />
                    </Field>
                  ))}
                </div>
              </CollapsibleCard>

              <CollapsibleCard icon="🏦" title="Payment Detail Records" defaultOpen={true}
                badge={users.filter(u => u.rowaction !== "DNU" && u.rowaction !== "delete").length || null}>
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6 }}>
                  <AddButton openPopup={openPopup} isEditing={isEditing} ref={addButtonRef} setFocusToFirstField={setFocusToFirstField} />
                </div>
                <div style={{ overflowX: "auto", borderRadius: 6, border: "1px solid #e2e8f0" }}>
                  <table className="do-table">
                    <thead>
                      <tr>
                        {["Actions", "ID", "Type", "Bank Code", "Bank Name", "Narration", "Amount", "UTR No", "Lot No"].map(h => (
                          <th key={h}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user, idx) => (
                        <tr key={user.id}>
                          <td>
                            {user.rowaction === "add" || user.rowaction === "update" || user.rowaction === "Normal" ? (
                              <span style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                                <EditButton editUser={editUser} user={user} isEditing={isEditing} />
                                <DeleteButton deleteModeHandler={deleteModeHandler} user={user} isEditing={isEditing} disabled={!isEditing || idx === 0} />
                              </span>
                            ) : (user.rowaction === "DNU" || user.rowaction === "delete") ? (
                              <OpenButton openDelete={openDelete} user={user} />
                            ) : null}
                          </td>
                          <td style={{ fontWeight: 600 }}>{user.id}</td>
                          <td>
                            <span style={{ display: "inline-block", padding: "2px 7px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: user.ddType === "T" ? "#dbeafe" : "#ede9fe", color: user.ddType === "T" ? "#1d4ed8" : "#6d28d9" }}>
                              {user.ddType}
                            </span>
                          </td>
                          <td style={{ fontFamily: "monospace", fontSize: 11 }}>{user.Bank_Code || tenderDetails.Payment_To}</td>
                          <td className="do-table-left">{user.bankcodeacname || tenderDetails.paymenttoname}</td>
                          <td className="do-table-left">{user.Narration}</td>
                          <td className="do-table-num">{formatReadableAmount(user.Amount)}</td>
                          <td style={{ fontFamily: "monospace", fontSize: 10 }}>{user.UTR_NO}</td>
                          <td>{user.LTNo}</td>
                        </tr>
                      ))}
                      {users.length === 0 && (
                        <tr><td colSpan={9} className="do-table-empty">No payment detail records</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CollapsibleCard>
            </div>

            {/* RIGHT COLUMN */}
            <div className="do-col">

              {/* Quantities & Rates */}
              <CollapsibleCard icon="⚖️" title="Quantities & Rates" defaultOpen={true}>
                <div className="do-g6" style={{ marginBottom: 6 }}>
                  <Field label="Quintal" required>
                    <DInput id="quantal" name="quantal" value={formData.quantal} onChange={handleChange}
                      onKeyDown={handleKeyDownCalculations} disabled={dis}
                      inputProps={{ onInput: validateNumericInput }} className="do-input-right" ref={quantalRef} />
                  </Field>
                  <Field label="Packing">
                    <DInput id="packing" name="packing" value={formData.packing} onChange={handleChange}
                      onKeyDown={handleKeyDownCalculations} disabled={dis}
                      inputProps={{ onInput: validateNumericInput }} className="do-input-right" />
                  </Field>
                  <Field label="Bags">
                    <DInput id="bags" name="bags" value={formData.bags} onChange={handleChange} disabled className="do-input-right" />
                  </Field>
                  <Field label="Mill Rate">
                    <DInput id="mill_rate" name="mill_rate" value={tenderDetails.mill_rate || formData.mill_rate} disabled className="do-input-right" />
                  </Field>
                  <Field label="Sale Rate" required>
                    <DInput id="sale_rate" name="sale_rate" value={formData.sale_rate} onChange={handleChange}
                      onKeyDown={handleKeyDownCalculations} disabled={dis || formData.SB_No !== 0}
                      inputProps={{ onInput: validateNumericInput }} className="do-input-right" />
                  </Field>
                  <Field label="Purchase Rate">
                    <DInput id="PurchaseRate" name="PurchaseRate" value={formData.PurchaseRate} onChange={handleChange}
                      onKeyDown={handleKeyDownCalculations} disabled={dis}
                      inputProps={{ onInput: validateNumericInput }} className="do-input-right" />
                  </Field>
                </div>
                <div className="do-g6" style={{ marginBottom: 6 }}>
                  <Field label="GST/Excise Rate">
                    <DInput id="excise_rate" name="excise_rate" value={formData.excise_rate} onChange={handleChange}
                      onKeyDown={handleKeyDownCalculations} disabled={dis}
                      inputProps={{ onInput: validateNumericInput }} className="do-input-right" />
                  </Field>
                  <Field label="Commission">
                    <DInput id="Tender_Commission" name="Tender_Commission"
                      value={ChangeData ? CarporateState.Tender_Commission : tenderDetails.CR || formData.Tender_Commission}
                      onChange={handleChange} onKeyDown={handleKeyDownCalculations} disabled={dis}
                      inputProps={{ onInput: validateNumericInput }} className="do-input-right" />
                  </Field>
                  <Field label="Diff Rate">
                    <DInput id="diff_rate" name="diff_rate" value={formData.diff_rate} onChange={handleChange}
                      onKeyDown={handleKeyDownCalculations} disabled={dis}
                      inputProps={{ onInput: validateNumericInput }} className="do-input-right" />
                  </Field>
                  <Field label="Diff Amount">
                    <DInput id="diff_amount" name="diff_amount" value={formData.diff_amount} onChange={handleChange}
                      onKeyDown={handleKeyDownCalculations} disabled={dis}
                      inputProps={{ onInput: validateNumericInput }} className="do-input-right" />
                  </Field>
                  <Field label="SB Other Amt">
                    <DInput id="SB_Other_Amount" name="SB_Other_Amount" value={formData.SB_Other_Amount} onChange={handleChange}
                      onKeyDown={handleKeyDownCalculations} disabled={dis}
                      inputProps={{ onInput: validateNumericInput }} className="do-input-right" />
                  </Field>
                  <Field label="Insurance">
                    <DInput id="Insurance" name="Insurance" value={formData.Insurance} onChange={handleChange}
                      onKeyDown={handleKeyDownCalculations} disabled={dis}
                      inputProps={{ onInput: validateNumericInput }} className="do-input-right" />
                  </Field>
                </div>

                <Divider label="TCS / TDS" />
                <div className="do-g6" style={{ marginBottom: 6 }}>
                  <Field label="Purc TCS">
                    <DInput id="TCS_Rate" name="TCS_Rate" value={formData.TCS_Rate} onChange={handleChange}
                      onKeyDown={handleKeyDownCalculations} disabled={TCSApplication !== "Y" || dis}
                      inputProps={{ onInput: validateNumericInput }} className="do-input-right" />
                  </Field>
                  <Field label="Sale TCS">
                    <DInput id="Sale_TCS_Rate" name="Sale_TCS_Rate" value={formData.Sale_TCS_Rate} onChange={handleChange}
                      onKeyDown={handleKeyDownCalculations} disabled={TCSApplication !== "Y" || dis}
                      inputProps={{ onInput: validateNumericInput }} className="do-input-right" />
                  </Field>
                  <Field label="Sale TDS">
                    <DInput id="SaleTDSRate" name="SaleTDSRate" value={formData.SaleTDSRate} onChange={handleChange}
                      onKeyDown={handleKeyDownCalculations} disabled={isEditMode ? !isEditing : !addOneButtonEnabled}
                      inputProps={{ onInput: validateNumericInput }} className="do-input-right" />
                  </Field>
                  <Field label="Purc TDS">
                    <DInput id="PurchaseTDSRate" name="PurchaseTDSRate" value={formData.PurchaseTDSRate} onChange={handleChange}
                      onKeyDown={handleKeyDownCalculations} disabled={isEditMode ? !isEditing : !addOneButtonEnabled}
                      inputProps={{ onInput: validateNumericInput }} className="do-input-right" />
                  </Field>
                </div>
                <div className="do-amt-row">
                  <AmtBox label="Mill Amount" value={formatReadableAmount(formData.amount)} color="blue" />
                  <AmtBox label="Mill Amt (TCS)" value={formatReadableAmount(formData.Mill_AmtWO_TCS)} color="amber" />
                  {formData.final_amout && <AmtBox label="Final Amount" value={formatReadableAmount(formData.final_amout)} color="green" />}
                </div>
                <Divider label="Purchase GST" />
                <div className="do-g5">
                  {[{ label: "CGST", id: "PurchaseCSGTamt" }, { label: "SGST", id: "PurchaseSGSTamt" }, { label: "IGST", id: "PurchaseIGSTamt" }, { label: "TCS Amt", id: "PurchaseTCSamt" }, { label: "TDS Amt", id: "PurchaseTDSamt" }].map(({ label, id }) => (
                    <Field key={id} label={label}>
                      <DInput id={id} name={id} value={formData[id]} onChange={handleChange} disabled={dis} className="do-input-right" />
                    </Field>
                  ))}
                </div>
              </CollapsibleCard>

              {/* Transport & Logistics */}
              <CollapsibleCard icon="🚛" title="Transport & Logistics" defaultOpen={true}>
                <div className="do-g4" style={{ marginBottom: 6 }}>
                  <Field label="Truck No" required>
                    <DInput id="truck_no" name="truck_no" value={formData.truck_no} onChange={handleChange} disabled={dis} />
                  </Field>
                  <Field label="Driver Mobile">
                    <DInput id="driver_no" name="driver_no" value={formData.driver_no} onChange={handleChange}
                      disabled={dis} inputProps={{ maxLength: 10, inputMode: "numeric" }} />
                  </Field>
                  <Field label="Distance (km)">
                    <DInput id="Distance" name="Distance" value={formData.Distance} onChange={handleChange}
                      disabled={dis} inputProps={{ onInput: validateNumericInput }} className="do-input-right" />
                  </Field>
                  <Field label="PAN No">
                    <DInput id="Pan_No" name="Pan_No" value={formData.Pan_No} onChange={handleChange}
                      disabled={dis} inputProps={{ style: { textTransform: "uppercase" }, maxLength: 10 }} />
                  </Field>
                </div>
                <div className="do-field" style={{ marginBottom: 6 }}>
                  <FL required>Transport</FL>
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    <AccountMasterHelp onAcCodeClick={handletransport} name="transport"
                      CategoryName={lbltransportname || transportcodename}
                      CategoryCode={newtransport || formData.transport || transportcode}
                      disabledFeild={dis} Ac_type="" />
                  </div>
                  <GSTStateMasterHelp onAcCodeClick={handleTransportGSTStateCode} name="TransportGSTStateCode"
                    GstStateName={lbltransportstatename || transportstatename}
                    GstStateCode={newTransportGSTStateCode || formData.TransportGSTStateCode}
                    disabledFeild={true} />
                </div>
                <div className="do-g5" style={{ marginBottom: 6 }}>
                  <Field label="Freight/Qtl">
                    <DInput id="FreightPerQtl" name="FreightPerQtl" value={formData.FreightPerQtl} onChange={handleChange}
                      onKeyDown={handleKeyDownCalculations} disabled={dis}
                      inputProps={{ onInput: validateNumericInput }} className="do-input-right" />
                  </Field>
                  <Field label="Freight Amt">
                    <DInput id="Freight_Amount" name="Freight_Amount" value={formData.Freight_Amount} onChange={handleChange}
                      onKeyDown={handleKeyDownCalculations} disabled={dis}
                      inputProps={{ onInput: validateNumericInput }} className="do-input-right" />
                  </Field>
                  <Field label="Memo Rate">
                    <DInput id="MM_Rate" name="MM_Rate" value={formData.MM_Rate} onChange={handleChange}
                      onKeyDown={handleKeyDownCalculations} disabled={dis}
                      inputProps={{ onInput: validateNumericInput }} className="do-input-right" />
                  </Field>
                  <Field label="Memo Advance">
                    <DInput id="Memo_Advance" name="Memo_Advance" value={formData.Memo_Advance} onChange={handleChange}
                      onKeyDown={handleKeyDownCalculations} disabled={dis}
                      inputProps={{ onInput: validateNumericInput }} className="do-input-right" />
                  </Field>
                  <Field label="Memo Type">
                    <DSelect id="MM_CC" name="MM_CC" value={formData.MM_CC} onChange={handleChange} disabled={dis}>
                      <option value="Credit">Credit</option>
                      <option value="Cash">Cash</option>
                    </DSelect>
                  </Field>
                  <Field label="Memo GST">
                    <GSTRateMasterHelp name="MemoGSTRate" onAcCodeClick={handleMemoGSTRate}
                      GstRateName={lblMemoGSTRatename || GSTMemoGstrate} GstRateCode={newMemoGSTRate || GSTMemoGstcode}
                      disabledFeild={dis} />
                  </Field>
                  <Field label="RCM Number">
                    <DInput id="RCMNumber" name="RCMNumber" value={formData.RCMNumber} onChange={handleChange}
                      onKeyDown={handleKeyDownCalculations} disabled={dis} className="do-input-right" />
                  </Field>
                  <div className="do-checkbox-row" style={{ alignSelf: "flex-end", marginBottom: 3 }}>
                    <input type="checkbox" id="mill_rcv" name="mill_rcv" value={formData.mill_rcv}
                      onChange={handleChange} disabled={dis} style={{ width: 13, height: 13, accentColor: "#1d4ed8" }} />
                    <label htmlFor="mill_rcv" className="do-checkbox-label">Invoice Checked</label>
                  </div>
                </div>

                <Divider label="TDS / BP / Vasuli / DO" />
                <div className="do-g4">
                  <Field label="TDS A/c">
                    <AccountMasterHelp name="TDSAc" Ac_type="" onAcCodeClick={handleTDSAc}
                      CategoryName={lbltdsacname} CategoryCode={newTDSAc || formData.TDSAc} disabledFeild={dis} />
                  </Field>
                  <Field label="TDS Rate">
                    <DInput id="TDSRate" name="TDSRate" value={formData.TDSRate} onChange={handleChange}
                      onKeyDown={handleKeyDownCalculations} disabled={dis} className="do-input-right" />
                  </Field>
                  <Field label="TDS Amount">
                    <DInput id="TDSAmt" name="TDSAmt" value={formData.TDSAmt} onChange={handleChange}
                      onKeyDown={handleKeyDownCalculations} disabled={dis} className="do-input-right" />
                  </Field>
                  <div className="do-checkbox-row" style={{ alignSelf: "flex-end", marginBottom: 3 }}>
                    <input type="checkbox" id="TDSCut" name="TDSCut" value={formData.TDSCut}
                      onChange={handleChange} disabled={dis} style={{ width: 13, height: 13, accentColor: "#dc2626" }} />
                    <label htmlFor="TDSCut" className="do-checkbox-label">TDS cut by us</label>
                  </div>
                  <Field label="B.P Amount">
                    <DInput id="Cash_diff" name="Cash_diff" value={formData.Cash_diff} onChange={handleChange}
                      onKeyDown={handleKeyDownCalculations} disabled={dis} className="do-input-right" />
                  </Field>
                  <Field label="Vasuli Rate">
                    <DInput id="vasuli_rate" name="vasuli_rate" value={formData.vasuli_rate} onChange={handleChange}
                      onKeyDown={handleKeyDownCalculations} disabled={dis} className="do-input-right" />
                  </Field>
                  <Field label="Vasuli Amt">
                    <DInput id="vasuli_amount" name="vasuli_amount" value={formData.vasuli_amount}
                      onChange={handleChange} disabled={dis} className="do-input-right" />
                  </Field>
                  <Field label="Vasuli A/c">
                    <AccountMasterHelp name="Vasuli_Ac" Ac_type="" onAcCodeClick={handleVasuli_Ac}
                      CategoryName={lblvasuliacname} CategoryCode={newVasuli_Ac} disabledFeild={dis} />
                  </Field>
                  <Field label="DO A/c">
                    <AccountMasterHelp name="DO" Ac_type="" onAcCodeClick={handleDO}
                      CategoryName={tenderDetails.tenderdoname || lblDoname}
                      CategoryCode={tenderDetails.Tender_DO || newDO} disabledFeild={dis} />
                  </Field>
                </div>

                <Divider label="BP A/c" />
                <div className="do-g4">
                  <Field label="B.P A/c">
                    <AccountMasterHelp name="CashDiffAc" Ac_type="" onAcCodeClick={handleCashDiffAc}
                      CategoryName={tenderDetails.buyername || lblcashdiffacname}
                      CategoryCode={tenderDetails.Buyer || newCashDiffAc} disabledFeild={dis} />
                  </Field>
                </div>
              </CollapsibleCard>

            </div>{/* end right col */}
          </div>{/* end do-main-grid */}
        </div>{/* end do-desktop-only */}


        {/* ──────────────────────────────────────
          MOBILE LAYOUT  (hidden on desktop)
          Single unified card with all key fields
          ────────────────────────────────────── */}
        <div className="do-mobile-only" style={{ flexDirection: "column" }}>
          <div className="do-mobile-card-wrap">
            <div className="do-mobile-card">

              {/* ── 1. Date & Document ── */}
              <div className="do-mobile-section">
                <div className="do-mobile-section-title">📋 Document</div>
                <div className="do-mobile-g2" style={{ marginBottom: 5 }}>
                  <Field label="Date" required>
                    <DDate id="m_doc_date" name="doc_date" value={formData.doc_date} onChange={handleChange} disabled={dis} />
                  </Field>
                  <Field label="DO Date">
                    <DDate id="m_Do_DATE" name="Do_DATE" value={formData.Do_DATE} onChange={handleChange} disabled={dis} />
                  </Field>
                </div>

                {/* Voucher & Sale Bill chips */}
                <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 5 }}>
                  <div className="do-chip-doc" style={{ justifyContent: "space-between" }}>
                    <span className="do-chip-doc-label">Voucher No:</span>
                    <span className="do-chip-doc-value" onClick={() => handleRowClick(formData.voucher_no, formData.voucher_type)}>
                      {formData.voucher_no || "—"}
                    </span>
                    {formData.voucher_type && <span className="do-tag do-tag-type">{formData.voucher_type}</span>}
                  </div>
                  <div className="do-chip-doc" style={{ justifyContent: "space-between" }}>
                    <span className="do-chip-doc-label">Sale Bill No:</span>
                    <span className={`do-chip-doc-value ${(!formData.SB_No || isEditing) ? "disabled" : ""}`}
                      onClick={() => { if (!isEditing && formData.SB_No) handleRowClick(formData.SB_No, "SB"); }}>
                      {formData.SB_No || "—"}
                    </span>
                  </div>
                </div>

                {/* SB Generate */}
                <Btn onClick={handleSBGenerate}
                  disabled={formData.SB_No !== 0 || isEditing || formData.tenderdetailid === null}
                  variant="gold" style={{ width: "100%", justifyContent: "center", marginBottom: 4 }}>
                  {isLoading ? "⏳" : "⚡"} SB Generate
                </Btn>
              </div>

              {/* ── 2. Reports & Actions ── */}
              <div className="do-mobile-section">
                <div className="do-mobile-section-title">📊 Reports & Actions</div>
                <div className="do-reports-row">
                  <DeliveryOrderOurDoReport doc_no={formData.doc_no} disabledFeild={isEditing || !addOneButtonEnabled} />
                  <PartyBillDoReport doc_no={formData.doc_no} disabledFeild={isEditing || !addOneButtonEnabled} />
                  <PartyDOReport doc_no={formData.doc_no}
                    disabledFeild={!(Company_Name?.substring(0, 2).toUpperCase() === "JK" && addOneButtonEnabled)} />
                  <SaleBillReport doc_no={formData.SB_No} disabledFeild={formData.SB_No === 0 || formData.SB_No === ""} />
                  <Btn onClick={handleGenerateEwayBill}
                    disabled={isEditingOrNoSB || isEwayGenerated || isBothNotGenerated || formData.tenderdetailid === null}
                    variant="success">🛣️ EwayBill</Btn>
                  <Btn onClick={handleGenerateEInvoice}
                    disabled={isEditingOrNoSB || isEInvoiceGenerated || isBothNotGenerated || formData.tenderdetailid === null}
                    variant="success">📄 eInvoice</Btn>
                  <Btn onClick={handleGenerateEInvoiceEwaybill}
                    disabled={isEditingOrNoSB || isEInvoiceGenerated || isEwayGenerated || formData.tenderdetailid === null}
                    variant="success">📦 eInvoice + EWay</Btn>
                  <Btn onClick={() => window.open("/pending-sb-list", "_blank")} variant="ghost">📋 Pending SBs</Btn>
                </div>
              </div>

              {/* ── 3. Mill ── */}
              <div className="do-mobile-section">
                <div className="do-mobile-section-title">🏭 Mill</div>
                <Field label="Mill Code" required style={{ marginBottom: 5 }}>
                  <AccountMasterHelp name="mill_code" onAcCodeClick={handlemill_code}
                    CategoryName={lblmillname} CategoryCode={newmill_code} Ac_type={[]}
                    disabledFeild={isEditMode || addOneButtonEnabled} />
                </Field>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center", marginBottom: 5 }}>
                  <BalanceChip balance={millBalance} formatFn={formatReadableAmount} />
                  <Field label="Mill State" style={{ flex: 1, minWidth: 120 }}>
                    <GSTStateMasterHelp onAcCodeClick={handleMillGSTStateCode} name="MillGSTStateCode"
                      GstStateName={MillByName || millstatename}
                      GstStateCode={MillByCode || formData.MillGSTStateCode}
                      disabledFeild={true} />
                  </Field>
                </div>
                <div className="do-mobile-g2">
                  <Field label="Purchase No.">
                    <PurcnoHelp onAcCodeClick={handlePurcno} name="purc_no"
                      Tenderid={lblTenderid || Tenderid} Tenderno={newPurcno || formData.purc_no || Tenderno}
                      disabledFeild={isEditing || (addOneButtonEnabled && !isEditing)}
                      disabledFeild1={!isEditing && addOneButtonEnabled}
                      Millcode={formData.mill_code || millcode}
                      onTenderDetailsFetched={ChangeData ? handleTenderDetailsFetched : handleTenderWithoutCarpoDetailsFetched} />
                  </Field>
                  <Field label="GST Code">
                    <GSTRateMasterHelp name="GstRateCode" onAcCodeClick={handleGstRateCode}
                      GstRateName={tenderDetails.gstratename || lblgstratename}
                      GstRateCode={tenderDetails.gstratecode || newGstRateCode}
                      disabledFeild={isEditing || (addOneButtonEnabled && !isEditing)} />
                  </Field>
                  <Field label="Item Code">
                    <SystemHelpMaster onAcCodeClick={handleItemSelect}
                      CategoryName={tenderDetails.itemname || lblitemname}
                      CategoryCode={tenderDetails.itemcode || newitemcode}
                      name="Item_Select" SystemType="I" disabledField={dis} />
                  </Field>
                  <Field label="Grade">
                    <GradeMasterHelp name="Grade" onAcCodeClick={handleGrade}
                      CategoryName={formData.grade || newGrade} disabledField={true} onCategoryChange={handleGradeUpdate} />
                  </Field>
                </div>

                <div style={{ marginTop: 5 }}>
                  <Field label="Get Pass" required style={{ marginBottom: 4 }}>
                    <AccountMasterHelp name="GETPASSCODE" Ac_type="" onAcCodeClick={handleGETPASSCODE}
                      CategoryName={ChangeData ? getpassTitle : tenderDetails?.Getpassnoname || lblgetpasscodename || getpasscodename}
                      CategoryCode={ChangeData ? CarporateState?.newGETPASSCODE : tenderDetails?.Getpassno || formData?.GETPASSCODE || getpasscode}
                      disabledFeild={isEditing || (addOneButtonEnabled && !isEditing)} />
                  </Field>
                  <Field label="Get Pass State">
                    <GSTStateMasterHelp onAcCodeClick={handleGetpassGstStateCode} name="GetpassGstStateCode"
                      GstStateName={tenderDetails.Getpassnonamestatename || GetPassByName || getpassstatecodename}
                      GstStateCode={tenderDetails.Getpassnonamestatecode || GetpassByCode || formData.GetpassGstStateCode}
                      disabledFeild={true} />
                  </Field>
                </div>
              </div>

              {/* ── 4. Shipped To & Sale Bill To ── */}
              <div className="do-mobile-section">
                <div className="do-mobile-section-title">🏢 Party</div>

                {/* Shipped To */}
                <Field label="Shipped To" required style={{ marginBottom: 5 }}>
                  <AccountMasterHelp name="voucher_by" Ac_type="" onAcCodeClick={handlevoucher_by}
                    CategoryName={ChangeData ? voucherTitle : tenderDetails.buyername || voucherTitle || lblvoucherByname}
                    CategoryCode={ChangeData ? CarporateState.voucher_by : tenderDetails.Buyer || newvoucher_by}
                    disabledFeild={dis} firstInputRef={shipToRef} />
                </Field>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center", marginBottom: 5 }}>
                  <BalanceChip balance={shipToBalance} formatFn={formatReadableAmount} />
                  <GSTChip gst={shipToGSTNo} />
                  <Field label="Ship State" style={{ flex: 1, minWidth: 110 }}>
                    <GSTStateMasterHelp onAcCodeClick={handleVoucherbyGstStateCode} name="VoucherbyGstStateCode"
                      GstStateName={tenderDetails.shiptostatename || VoucherByName || voucherbystatename}
                      GstStateCode={tenderDetails.shiptostatecode || VoucherByCode || formData.VoucherbyGstStateCode}
                      disabledFeild={true} />
                  </Field>
                </div>

                {/* Sale Bill To */}
                <Field label="Sale Bill To" required style={{ marginBottom: 5 }}>
                  <AccountMasterHelp name="SaleBillTo" Ac_type="" onAcCodeClick={handleSaleBillTo}
                    CategoryName={ChangeData ? salebillTitle : tenderDetails.buyername || salebillTitle || lblsalebilltoname}
                    CategoryCode={ChangeData ? CarporateState.SaleBillTo : tenderDetails.Buyer || newSaleBillTo}
                    disabledFeild={(isEditMode && String(formData.GETPASSCODE) === String(formData.SaleBillTo)) || dis} />
                </Field>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center" }}>
                  <BalanceChip balance={billToBalance} formatFn={formatReadableAmount} />
                  <GSTChip gst={billToGSTNo} />
                  <Field label="Bill State" style={{ flex: 1, minWidth: 110 }}>
                    <GSTStateMasterHelp onAcCodeClick={handleSalebilltoGstStateCode} name="SalebilltoGstStateCode"
                      GstStateName={SaleBillByName || tenderDetails.buyeridcitystate || salebilltostatename}
                      GstStateCode={SaleBillByCode || tenderDetails.buyergststatecode || formData.SalebilltoGstStateCode}
                      disabledFeild={true} />
                  </Field>
                </div>
              </div>

              {/* ── 5. Quantities & Rates ── */}
              <div className="do-mobile-section">
                <div className="do-mobile-section-title">⚖️ Quantities & Rates</div>
                <div className="do-mobile-g3" style={{ marginBottom: 5 }}>
                  <Field label="Quintal" required>
                    <DInput id="m_quantal" name="quantal" value={formData.quantal} onChange={handleChange}
                      onKeyDown={handleKeyDownCalculations} disabled={dis}
                      inputProps={{ onInput: validateNumericInput }} className="do-input-right" />
                  </Field>
                  <Field label="Mill Rate">
                    <DInput id="m_mill_rate" name="mill_rate" value={tenderDetails.mill_rate || formData.mill_rate} disabled className="do-input-right" />
                  </Field>
                  <Field label="Purchase Rate">
                    <DInput id="m_PurchaseRate" name="PurchaseRate" value={formData.PurchaseRate} onChange={handleChange}
                      onKeyDown={handleKeyDownCalculations} disabled={dis}
                      inputProps={{ onInput: validateNumericInput }} className="do-input-right" />
                  </Field>
                  <Field label="Sale Rate" required>
                    <DInput id="m_sale_rate" name="sale_rate" value={formData.sale_rate} onChange={handleChange}
                      onKeyDown={handleKeyDownCalculations} disabled={dis || formData.SB_No !== 0}
                      inputProps={{ onInput: validateNumericInput }} className="do-input-right" />
                  </Field>
                  <Field label="Sale TDS">
                    <DInput id="m_SaleTDSRate" name="SaleTDSRate" value={formData.SaleTDSRate} onChange={handleChange}
                      onKeyDown={handleKeyDownCalculations} disabled={isEditMode ? !isEditing : !addOneButtonEnabled}
                      inputProps={{ onInput: validateNumericInput }} className="do-input-right" />
                  </Field>
                  <Field label="Purc TDS">
                    <DInput id="m_PurchaseTDSRate" name="PurchaseTDSRate" value={formData.PurchaseTDSRate} onChange={handleChange}
                      onKeyDown={handleKeyDownCalculations} disabled={isEditMode ? !isEditing : !addOneButtonEnabled}
                      inputProps={{ onInput: validateNumericInput }} className="do-input-right" />
                  </Field>
                </div>

                {/* Amount boxes */}
                <div className="do-amt-row">
                  <AmtBox label="Mill Amt" value={formatReadableAmount(formData.amount)} color="blue" />
                  <AmtBox label="Mill + TCS" value={formatReadableAmount(formData.Mill_AmtWO_TCS)} color="amber" />
                  {formData.final_amout && <AmtBox label="Final" value={formatReadableAmount(formData.final_amout)} color="green" />}
                </div>
              </div>

              {/* ── 6. Transport ── */}
              <div className="do-mobile-section">
                <div className="do-mobile-section-title">🚛 Transport</div>
                <Field label="Truck No" required style={{ marginBottom: 5 }}>
                  <DInput id="m_truck_no" name="truck_no" value={formData.truck_no} onChange={handleChange} disabled={dis} />
                </Field>
                <Field label="Transport" required style={{ marginBottom: 5 }}>
                  <AccountMasterHelp onAcCodeClick={handletransport} name="transport"
                    CategoryName={lbltransportname || transportcodename}
                    CategoryCode={newtransport || formData.transport || transportcode}
                    disabledFeild={dis} Ac_type="" />
                </Field>
                <Field label="Transport State">
                  <GSTStateMasterHelp onAcCodeClick={handleTransportGSTStateCode} name="TransportGSTStateCode"
                    GstStateName={lbltransportstatename || transportstatename}
                    GstStateCode={newTransportGSTStateCode || formData.TransportGSTStateCode}
                    disabledFeild={true} />
                </Field>
              </div>

            </div>{/* end do-mobile-card */}
          </div>{/* end do-mobile-card-wrap */}
        </div>{/* end do-mobile-only */}

      </form>

      {/* ════════════════ LOADING OVERLAY ════════════════ */}
      {isLoading && (
        <div className="do-loading-overlay">
          <div className="do-loading-box"><TruckLoader /></div>
        </div>
      )}

      {/* ════════════════ DETAIL POPUP ════════════════ */}
      {showPopup && (
        <div className="do-popup-overlay">
          <div className="do-popup">
            <div className="do-popup-header">
              <span className="do-popup-title">{selectedUser.id ? "✏️ Update Detail Record" : "➕ Add Detail Record"}</span>
              <button onClick={closePopup} className="do-popup-close">×</button>
            </div>
            <div className="do-popup-body">
              <Field label="DD Type">
                <DSelect id="ddType" name="ddType" value={formDataDetail.ddType} onChange={handleChangeDetail} disabled={dis}>
                  <option value="T">Transfer Letter</option>
                  <option value="D">Demand Draft</option>
                </DSelect>
              </Field>
              <Field label="Bank Code">
                <AccountMasterHelp onAcCodeClick={handleBankCode}
                  CategoryName={tenderDetails.paymenttoname || bankcodeacname}
                  CategoryCode={tenderDetails.Payment_To || bankcode || formDataDetail.Bank_Code}
                  name="Bank_Code" Ac_type="" disabledFeild={dis} />
              </Field>
              <Field label="Narration">
                <DInput id="Narration" name="Narration" value={formDataDetail.Narration} onChange={handleChangeDetail} disabled={dis} />
              </Field>
              <Field label="Amount">
                <DInput id="Amount" name="Amount" value={formDataDetail.Amount} onChange={handleChangeDetail} disabled={dis} className="do-input-right" />
              </Field>
              <Field label="UTR No">
                <DoUtrNoHelp name="UTR_NO" companyCode={companyCode}
                  bankCode={tenderDetails.Payment_To || bankcode || formDataDetail.Bank_Code}
                  defaultUtrNo={formDataDetail.UTR_NO} onUtrSelect={handleUTRNo} />
              </Field>
              <Field label="LT No">
                <DInput id="LTNo" name="LTNo" value={formDataDetail.LTNo} onChange={handleChangeDetail} disabled={dis} />
              </Field>
            </div>
            <div className="do-popup-footer">
              {selectedUser.id ? <DetailUpdateButton updateUser={updateUser} /> : <DetailAddButtomCommon addUser={addUser} />}
              <DetailCloseButton closePopup={closePopup} />
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ DIALOGS ════════════════ */}
      <Dialog open={isOpenEwayBill} onClose={handleCloseEwayBill} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ textAlign: "center", fontWeight: 700, background: "#0f1f3d", color: "#e2c97e", borderBottom: "2px solid #e2c97e" }}>EwayBill Generation</DialogTitle>
        <IconButton onClick={handleCloseEwayBill} sx={{ position: "absolute", right: 16, top: 8, bgcolor: "#374151", color: "#fff", borderRadius: "8px" }}><CloseIcon /></IconButton>
        <DialogContent>
          <EwayBillGeneration doc_no={formData.SB_No} do_no={formData.doc_no} tran_type="SB"
            handleClose={handleCloseEwayBill} Company_Code={companyCode} Year_Code={Year_Code} />
        </DialogContent>
      </Dialog>

      <Dialog open={isOpenEInvoice} onClose={handleCloseEInvoice} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ textAlign: "center", fontWeight: 700, background: "#0f1f3d", color: "#e2c97e", borderBottom: "2px solid #e2c97e" }}>E-Invoice Generation</DialogTitle>
        <IconButton onClick={handleCloseEInvoice} sx={{ position: "absolute", right: 16, top: 8, bgcolor: "#374151", color: "#fff", borderRadius: "8px" }}><CloseIcon /></IconButton>
        <DialogContent>
          <EInvoiceGeneration doc_no={formData.SB_No} do_no={formData.doc_no} tran_type="SB"
            handleClose={handleCloseEInvoice} Company_Code={companyCode} Year_Code={Year_Code} />
        </DialogContent>
      </Dialog>

      <Dialog open={isOpenEInvoiceEwaybill} onClose={handleCloseEInvoiceEwaybill} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ textAlign: "center", fontWeight: 700, background: "#0f1f3d", color: "#e2c97e", borderBottom: "2px solid #e2c97e" }}>E-Invoice + E-Waybill Generation</DialogTitle>
        <IconButton onClick={handleCloseEInvoiceEwaybill} sx={{ position: "absolute", right: 16, top: 8, bgcolor: "#374151", color: "#fff", borderRadius: "8px" }}><CloseIcon /></IconButton>
        <DialogContent>
          <EInvoiceEwayBillGeneration doc_no={formData.SB_No} do_no={formData.doc_no} tran_type="SB"
            handleClose={handleCloseEInvoiceEwaybill} Company_Code={companyCode} Year_Code={Year_Code} />
        </DialogContent>
      </Dialog>
    </div>
  );

};

export default DeliveryOrder;