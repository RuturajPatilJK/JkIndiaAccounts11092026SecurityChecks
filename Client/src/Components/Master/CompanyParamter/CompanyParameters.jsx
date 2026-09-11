import React from "react";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "./CompanyParameters.css";
import "react-toastify/dist/ReactToastify.css";
import {
  Box,
  Grid,
  Typography,
} from "@mui/material";
import AccountMasterHelp from "../../../Helper/AccountMasterHelp";
import GSTStateMasterHelp from "../../../Helper/GSTStateMasterHelp";
import GSTRateMasterHelp from "../../../Helper/GSTRateMasterHelp";
import GroupMasterHelp from "../../../Helper/GroupMasterHelp";

const API_URL = process.env.REACT_APP_API;

var CommissionAcName;
var newCOMMISSION_AC;
var InterestAcName;
var newINTEREST_AC;
var TransportAcName;
var newTRANSPORT_AC;
var PostageAcName;
var newPOSTAGE_AC;
var SelfAc;
var newSELF_AC;
var GSTStateCodeName;
var newGSTStateCode;
var SaleCGSTAcName;
var newCGSTAc;
var SaleSGSTAcName;
var newSGSTAc;
var SaleIGSTAcName;
var newIGSTAc;
var PurchaseCGSTAcName;
var newPurchaseCGSTAc;
var PurchaseSGSTAcName;
var newPurchaseSGSTAc;
var PurchaseIGSTAcName;
var newPurchaseIGSTAc;
var RoundOffAcName;
var newRoundOff;
var TransportRCMGSTAcName;
var newTransport_RCM_GSTRate;
var CGST_RCMAcName;
var newCGST_RCM_Ac;
var SGST_RCMAcName;
var newSGST_RCM_Ac;
var IGST_RCMAcName;
var newIGST_RCM_Ac;
var FreightAcName;
var newFreight_Ac;
var PurchaseTCS_AcName;
var newPurchaseTCSAc;
var SaleTCS_AcName;
var newSaleTCSAc;
var OtherAcName;
var newOTHER_AMOUNT_AC;
var MarketSaseAcName;
var newMarketSase;
var SupercostAcName;
var newSuperCost;
var PackingAcName;
var newPacking;
var HamaliAcName;
var newHamali;
var TransportTDS_AcName;
var newTransportTDS_Ac;
var TransportTDS_CutAcName;
var newTransportTDS_AcCut;
var ReturnSaleCGST_AcName;
var newReturnSaleCGST;
var ReturnSaleSGSTAc_Name;
var newReturnSaleSGST;
var ReturnSaleIGSTName;
var newReturnSaleIGST;
var ReturnPurchaseCGSTName;
var newReturnPurchaseCGST;
var ReturnPurchaseSGST;
var newReturnPurchaseSGST;
var ReturnPurchaseIGSTName;
var newReturnPurchaseIGST;
var SaleTDSAcName;
var newSaleTDSAc;
var PurchaseTDSAcName;
var newPurchaseTDSAc;
var RateDiffAcName;
var newRateDiffAc;
var DepreciationAcName;
var newDepreciationAC;
var InterestTDS_AcName;
var newInterestTDSAc;
var BankPaymentAcName;
var newBankPaymentAc;
var defaultGSTRateCode;
var defaultGSTRateName;
var defaultSundryCreditorsAcCode;
var defaultSundryCreditorsAcName;
var defalultSundryDebitorsAcCode;
var defalultSundryDebitorsAcName;
var Freight_Receivable_AcCode;
var Freight_Receivable_AcName;
var closing_stock_trading_acCode;
var closing_stock_trading_acName;
var closing_stock_bL_acCode;
var closing_stock_bL_acName;
const CompanyParameters = () => {
  //GET Company Code and year code from the session
  const companyCode = sessionStorage.getItem("Company_Code");
  const Year_Code = sessionStorage.getItem("Year_Code");

  const [accountCode, setAccountCode] = useState("");
  const initialFormData = {
    COMMISSION_AC: "",
    INTEREST_AC: "",
    TRANSPORT_AC: "",
    POSTAGE_AC: "",
    SELF_AC: "",
    Company_Code: "",
    Year_Code: "",
    Created_By: "",
    Modified_By: "",
    AutoVoucher: "",
    tblPrefix: "",
    GSTStateCode: "",
    CGSTAc: "",
    SGSTAc: "",
    IGSTAc: "",
    PurchaseCGSTAc: "",
    PurchaseSGSTAc: "",
    PurchaseIGSTAc: "",
    RoundOff: "",
    Transport_RCM_GSTRate: "",
    CGST_RCM_Ac: "",
    SGST_RCM_Ac: "",
    IGST_RCM_Ac: "",
    Freight_Ac: "",
    TCS: "",
    PurchaseTCSAc: "",
    SaleTCSAc: "",
    filename: "",
    OTHER_AMOUNT_AC: "",
    MarketSase: "",
    SuperCost: "",
    Packing: "",
    Hamali: "",
    TransportTDS_Ac: "",
    TransportTDS_AcCut: "",
    Mill_Payment_date: "",
    dispatchType: "",
    ReturnSaleCGST: "",
    ReturnSaleSGST: "",
    ReturnSaleIGST: "",
    ReturnPurchaseCGST: "",
    ReturnPurchaseSGST: "",
    ReturnPurchaseIGST: "",
    SaleTDSAc: "",
    PurchaseTDSAc: "",
    PurchaseTDSRate: "",
    SaleTDSRate: "",
    BalanceLimit: "",
    RateDiffAc: "",
    // customisesb: "",
    // customisedo: "",
    // DODate: "",
    // DOPages: "",
    // TCSPurchaseBalanceLimit: "",
    // TDSPurchaseBalanceLimit: "",
    // PurchaseSaleTcs: "",
    // TCSTDSSaleBalanceLimit: "",
    DepreciationAC: "",
    // InterestRate: "",
    // InterestTDSAc: "",
    // BankPaymentAc: "",
    // bpid: "",
    // Edit_Sale_Rate: "",
    def_gst_rate_code: "",
    defaultSundryCreditors: "",
    defalultSundryDebitors: "",
    Freight_Receivable_Ac: "",
    closing_stock_trading_ac: "",
    closing_stock_bL_ac: "",

  };

  //Common Function to set the record Data
  const handleAccountCodeChange = (key, code) => {
    setAccountCode(code);
    setFormData((prevFormData) => ({
      ...prevFormData,
      [key]: code,
    }));
  };

  //Handle individual function to manage the account master
  const handleCOMMISSION_AC = (code) =>
    handleAccountCodeChange("COMMISSION_AC", code);
  const handleINTEREST_AC = (code) =>
    handleAccountCodeChange("INTEREST_AC", code);
  const handleTRANSPORT_AC = (code) =>
    handleAccountCodeChange("TRANSPORT_AC", code);
  const handlePOSTAGE_AC = (code) =>
    handleAccountCodeChange("POSTAGE_AC", code);
  const handleSELF_AC = (code) => handleAccountCodeChange("SELF_AC", code);
  const handleGSTStateCode = (code) =>
    handleAccountCodeChange("GSTStateCode", code);
  const handleCGSTAc = (code) => handleAccountCodeChange("CGSTAc", code);
  const handleSGSTAc = (code) => handleAccountCodeChange("SGSTAc", code);
  const handleIGSTAc = (code) => handleAccountCodeChange("IGSTAc", code);
  const handlePurchaseCGSTAc = (code) =>
    handleAccountCodeChange("PurchaseCGSTAc", code);
  const handlePurchaseSGSTAc = (code) =>
    handleAccountCodeChange("PurchaseSGSTAc", code);
  const handlePurchaseIGSTAc = (code) =>
    handleAccountCodeChange("PurchaseIGSTAc", code);
  const handleRoundOff = (code) => handleAccountCodeChange("RoundOff", code);
  const handleTransport_RCM_GSTRate = (code) =>
    handleAccountCodeChange("Transport_RCM_GSTRate", code);
  const handleCGST_RCM_Ac = (code) =>
    handleAccountCodeChange("CGST_RCM_Ac", code);
  const handleSGST_RCM_Ac = (code) =>
    handleAccountCodeChange("SGST_RCM_Ac", code);
  const handleIGST_RCM_Ac = (code) =>
    handleAccountCodeChange("IGST_RCM_Ac", code);
  const handleFreight_Ac = (code) =>
    handleAccountCodeChange("Freight_Ac", code);
  const handlePurchaseTCSAc = (code) =>
    handleAccountCodeChange("PurchaseTCSAc", code);
  const handleSaleTCSAc = (code) => handleAccountCodeChange("SaleTCSAc", code);
  const handleOTHER_AMOUNT_AC = (code) =>
    handleAccountCodeChange("OTHER_AMOUNT_AC", code);
  const handleMarketSase = (code) =>
    handleAccountCodeChange("MarketSase", code);
  const handleSuperCost = (code) => handleAccountCodeChange("SuperCost", code);
  const handlePacking = (code) => handleAccountCodeChange("Packing", code);
  const handleHamali = (code) => handleAccountCodeChange("Hamali", code);
  const handleTransportTDS_Ac = (code) =>
    handleAccountCodeChange("TransportTDS_Ac", code);
  const handleTransportTDS_AcCut = (code) =>
    handleAccountCodeChange("TransportTDS_AcCut", code);
  const handleReturnSaleCGST = (code) =>
    handleAccountCodeChange("ReturnSaleCGST", code);
  const handleReturnSaleSGST = (code) =>
    handleAccountCodeChange("ReturnSaleSGST", code);
  const handleReturnSaleIGST = (code) =>
    handleAccountCodeChange("ReturnSaleIGST", code);
  const handleReturnPurchaseCGST = (code) =>
    handleAccountCodeChange("ReturnPurchaseCGST", code);
  const handleReturnPurchaseSGST = (code) =>
    handleAccountCodeChange("ReturnPurchaseSGST", code);
  const handleReturnPurchaseIGST = (code) =>
    handleAccountCodeChange("ReturnPurchaseIGST", code);
  const handleSaleTDSAc = (code) => handleAccountCodeChange("SaleTDSAc", code);
  const handlePurchaseTDSAc = (code) =>
    handleAccountCodeChange("PurchaseTDSAc", code);
  const handleRateDiffAc = (code) =>
    handleAccountCodeChange("RateDiffAc", code);
  const handleDepreciationAC = (code) =>
    handleAccountCodeChange("DepreciationAC", code);
  const handleInterestTDSAc = (code) =>
    handleAccountCodeChange("InterestTDSAc", code);
  const handleBankPaymentAc = (code) =>
    handleAccountCodeChange("BankPaymentAc", code);
  const handleDefaultGSTRate = (code) =>
    handleAccountCodeChange("def_gst_rate_code", code);
  const handleDefaultSundryCreditors = (code) =>
    handleAccountCodeChange("defaultSundryCreditors", code);
  const handleDefaultSundryDebitors = (code) =>
    handleAccountCodeChange("defalultSundryDebitors", code);
  const handleFreightReceivableAc = (code) =>
    handleAccountCodeChange("Freight_Receivable_Ac", code);
  const handleClosingStockTradingAc = (code) =>
    handleAccountCodeChange("closing_stock_trading_ac", code);
  const handleClosingStockBlAc = (code) =>
    handleAccountCodeChange("closing_stock_bL_ac", code);


  const [formData, setFormData] = useState(initialFormData);

  // Handle change for all inputs
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevState) => {
      const updatedFormData = { ...prevState, [name]: value };
      return updatedFormData;
    });
  };

  const handleSaveOrUpdate = async () => {
    try {
      const response = await axios.post(
        `${API_URL}/create-or-update-CompanyParameters`,
        {
          ...formData,
          Company_Code: companyCode,
          Year_Code: Year_Code,
        }
      );
      toast.success(response.data.message);
    } catch (error) {
      console.error(
        "Error updating data:",
        error.response?.data || error.message
      );
      toast.error("Failed to update data");
    }
  };

  useEffect(() => {
    handleCancel();
  }, []);

  const handleCancel = () => {
    axios
      .get(
        `${API_URL}/get-CompanyParameters-Record?Company_Code=${companyCode}&Year_Code=${Year_Code}`
      )
      .then((response) => {
        const data = response.data.CompanyParameters_data;
        const additionalData = response.data.additional_data[0];
        CommissionAcName = additionalData.commissionAcName;
        newCOMMISSION_AC = data.COMMISSION_AC;
        InterestAcName = additionalData.interestAcName;
        newINTEREST_AC = data.INTEREST_AC;
        TransportAcName = additionalData.transportAcName;
        newTRANSPORT_AC = data.TRANSPORT_AC;
        PostageAcName = additionalData.postageAcName;
        newPOSTAGE_AC = data.POSTAGE_AC;
        SelfAc = additionalData.selfAcName;
        newSELF_AC = data.SELF_AC;
        GSTStateCodeName = additionalData.State_Name;
        newGSTStateCode = data.GSTStateCode;
        SaleCGSTAcName = additionalData.CGSTAcName;
        newCGSTAc = data.CGSTAc;
        SaleSGSTAcName = additionalData.SGSTAcName;
        newSGSTAc = data.SGSTAc;
        SaleIGSTAcName = additionalData.IGSTAcName;
        newIGSTAc = data.IGSTAc;
        PurchaseCGSTAcName = additionalData.PurchaseCGSTAcName;
        newPurchaseCGSTAc = data.PurchaseCGSTAc;
        PurchaseSGSTAcName = additionalData.PurchaseSGSTAcName;
        newPurchaseSGSTAc = data.PurchaseSGSTAc;
        PurchaseIGSTAcName = additionalData.PurchaseIGSTAcName;
        newPurchaseIGSTAc = data.PurchaseIGSTAc;
        RoundOffAcName = additionalData.RoundOffAc;
        newRoundOff = data.RoundOff;
        TransportRCMGSTAcName = additionalData.TransportRCMGSTRateAcName;
        newTransport_RCM_GSTRate = data.Transport_RCM_GSTRate;
        CGST_RCMAcName = additionalData.CGSTRCMAcName;
        newCGST_RCM_Ac = data.CGST_RCM_Ac;
        SGST_RCMAcName = additionalData.SGSTRCMAcName;
        newSGST_RCM_Ac = data.SGST_RCM_Ac;
        IGST_RCMAcName = additionalData.IGSTRCMAcName;
        newIGST_RCM_Ac = data.IGST_RCM_Ac;
        FreightAcName = additionalData.FreightAcName;
        newFreight_Ac = data.Freight_Ac;
        PurchaseTCS_AcName = additionalData.PurchaseTCSAcName;
        newPurchaseTCSAc = data.PurchaseTCSAc;
        SaleTCS_AcName = additionalData.SaleTCSAcName;
        newSaleTCSAc = data.SaleTCSAc;
        OtherAcName = additionalData.OtherAmountAcName;
        newOTHER_AMOUNT_AC = data.OTHER_AMOUNT_AC;
        MarketSaseAcName = additionalData.MarketSaseAcName;
        newMarketSase = data.MarketSase;
        SupercostAcName = additionalData.SuperCostAcName;
        newSuperCost = data.SuperCost;
        PackingAcName = additionalData.PackingAcName;
        newPacking = data.Packing;
        HamaliAcName = additionalData.HamaliAcName;
        newHamali = data.Hamali;
        TransportTDS_AcName = additionalData.TransportTDSAcName;
        newTransportTDS_Ac = data.TransportTDS_Ac;
        TransportTDS_CutAcName = additionalData.TransportTDSAcCutAcName;
        newTransportTDS_AcCut = data.TransportTDS_AcCut;
        ReturnSaleCGST_AcName = additionalData.ReturnSaleCGSTAcAcName;
        newReturnSaleCGST = data.ReturnSaleCGST;
        ReturnSaleSGSTAc_Name = additionalData.ReturnSaleSGSTAcName;
        newReturnSaleSGST = data.ReturnSaleSGST;
        ReturnSaleIGSTName = additionalData.ReturnSaleIGSTAcName;
        newReturnSaleIGST = data.ReturnSaleIGST;
        ReturnPurchaseCGSTName = additionalData.ReturnPurchaseCGSTAcName;
        newReturnPurchaseCGST = data.ReturnPurchaseCGST;
        ReturnPurchaseSGST = additionalData.ReturnPurchaseSGSTAcName;
        newReturnPurchaseSGST = data.ReturnPurchaseSGST;
        ReturnPurchaseIGSTName = additionalData.ReturnPurchaseIGSTAcName;
        newReturnPurchaseIGST = data.ReturnPurchaseIGST;
        SaleTDSAcName = additionalData.SaleTDSAcName;
        newSaleTDSAc = data.SaleTDSAc;
        PurchaseTDSAcName = additionalData.PurchaseTDSAcName;
        newPurchaseTDSAc = data.PurchaseTDSAc;
        RateDiffAcName = additionalData.RateDiffAcName;
        newRateDiffAc = data.RateDiffAc;
        DepreciationAcName = additionalData.DepreciationAcName;
        newDepreciationAC = data.DepreciationAC;
        InterestTDS_AcName = additionalData.InterestTDSAcName;
        newInterestTDSAc = data.InterestTDSAc;
        BankPaymentAcName = additionalData.BankPaymentAcName;
        newBankPaymentAc = data.BankPaymentAc;
        defaultGSTRateCode = data.def_gst_rate_code;
        defaultGSTRateName = additionalData.GST_Name;
        defaultSundryCreditorsAcCode = data.defaultSundryCreditors
        defaultSundryCreditorsAcName = additionalData.defaultSundaryCreditors
        defalultSundryDebitorsAcCode = data.defalultSundryDebitors
        defalultSundryDebitorsAcName = additionalData.defaultSundaryDebitorsName
        Freight_Receivable_AcCode = data.Freight_Receivable_Ac
        Freight_Receivable_AcName = additionalData.Freight_Receivable_AcName
        closing_stock_bL_acCode = data.closing_stock_bL_ac
        closing_stock_bL_acName = additionalData.ClosingStockBalanceAcName
        closing_stock_trading_acCode = data.closing_stock_trading_ac
        closing_stock_trading_acName = additionalData.ClosingStockTradingAcName

        setFormData({
          ...formData,
          ...data,
        });
      })
      .catch((error) => {
        console.error("Error fetching latest data for edit:", error);
      });
  };


// =============================================
// REPLACE ONLY THE return (...) BLOCK BELOW
// =============================================
// =============================================
// REPLACE ONLY THE return (...) BLOCK BELOW
// =============================================

return (
  <>
    <Box sx={{ marginLeft: 20, padding: { xs: 1, sm: 3 } }}>
      <ToastContainer autoClose={500} />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSaveOrUpdate();
        }}
      >
        {/* ── Title ── */}
        <Typography
          component="h1"
          gutterBottom
          sx={{
            textAlign: "center",
            fontSize: "1.2rem",
            fontWeight: "bold",
            color: "#2c3e50",
            mb: 3,
            position: "relative",
            "&::after": {
              content: '""',
              position: "absolute",
              bottom: 0,
              left: "50%",
              transform: "translateX(-50%)",
              width: "80px",
              height: "4px",
              background: "linear-gradient(90deg, #3498db, #2ecc71)",
              borderRadius: "2px",
            },
          }}
        >
          Company Parameters
        </Typography>

        <style>{`
          .cp-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px 40px;
            width: 100%;
          }
          .cp-field {
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: 10px;
          }
          .cp-label {
            font-size: 14px;
            font-weight: bold;
            color: #000000;
            white-space: nowrap;
            min-width: 180px;
            text-align: right;
          }
          .cp-input-wrap {
            flex: 1;
            display: flex;
            align-items: center;
          }
          .cp-text-input {
            width: 100%;
            max-width: 200px;
            padding: 6px 10px;
            font-size: 14px;
            border: 1px solid #d1d5db;
            border-radius: 4px;
            outline: none;
          }
          .cp-select {
            width: 100%;
            max-width: 200px;
            padding: 6px 10px;
            font-size: 14px;
            border: 1px solid #d1d5db;
            border-radius: 4px;
            background: #fff;
          }
          @media (max-width: 900px) {
            .cp-grid { grid-template-columns: 1fr; }
            .cp-label { min-width: 160px; }
          }
        `}</style>

        <div className="cp-grid">

          <div className="cp-field">
            <span className="cp-label">Commission A/c :</span>
            <div className="cp-input-wrap">
              <AccountMasterHelp name="COMMISSION_AC" Ac_type="" onAcCodeClick={handleCOMMISSION_AC} CategoryName={CommissionAcName} CategoryCode={newCOMMISSION_AC} tabIndex={1} />
            </div>
          </div>

          <div className="cp-field">
            <span className="cp-label">Interest A/c :</span>
            <div className="cp-input-wrap">
              <AccountMasterHelp name="INTEREST_AC" Ac_type="" onAcCodeClick={handleINTEREST_AC} CategoryName={InterestAcName} CategoryCode={newINTEREST_AC} tabIndex={2} />
            </div>
          </div>

          <div className="cp-field">
            <span className="cp-label">Transport A/c :</span>
            <div className="cp-input-wrap">
              <AccountMasterHelp name="TRANSPORT_AC" Ac_type="" onAcCodeClick={handleTRANSPORT_AC} CategoryName={TransportAcName} CategoryCode={newTRANSPORT_AC} tabIndex={3} />
            </div>
          </div>

          <div className="cp-field">
            <span className="cp-label">Postage A/c :</span>
            <div className="cp-input-wrap">
              <AccountMasterHelp name="POSTAGE_AC" Ac_type="" onAcCodeClick={handlePOSTAGE_AC} CategoryName={PostageAcName} CategoryCode={newPOSTAGE_AC} tabIndex={4} />
            </div>
          </div>

          <div className="cp-field">
            <span className="cp-label">Self A/c :</span>
            <div className="cp-input-wrap">
              <AccountMasterHelp name="SELF_AC" Ac_type="" onAcCodeClick={handleSELF_AC} CategoryName={SelfAc} CategoryCode={newSELF_AC} tabIndex={5} />
            </div>
          </div>

          <div className="cp-field">
            <span className="cp-label">Auto Generate Voucher :</span>
            <div className="cp-input-wrap">
              <select id="AutoVoucher" name="AutoVoucher" value={formData.AutoVoucher} onChange={handleChange} className="cp-select">
                <option value="YES">Yes</option>
                <option value="NO">No</option>
              </select>
            </div>
          </div>

          <div className="cp-field">
            <span className="cp-label">GST State :</span>
            <div className="cp-input-wrap">
              <GSTStateMasterHelp name="GSTStateCode" onAcCodeClick={handleGSTStateCode} GstStateName={GSTStateCodeName} GstStateCode={newGSTStateCode} tabIndex={12} />
            </div>
          </div>

          <div className="cp-field">
            <span className="cp-label">Sale CGST A/c :</span>
            <div className="cp-input-wrap">
              <AccountMasterHelp name="CGSTAc" Ac_type="" onAcCodeClick={handleCGSTAc} CategoryName={SaleCGSTAcName} CategoryCode={newCGSTAc} tabIndex={13} />
            </div>
          </div>

          <div className="cp-field">
            <span className="cp-label">Sale SGST A/c :</span>
            <div className="cp-input-wrap">
              <AccountMasterHelp name="SGSTAc" Ac_type="" onAcCodeClick={handleSGSTAc} CategoryName={SaleSGSTAcName} CategoryCode={newSGSTAc} tabIndex={14} />
            </div>
          </div>

          <div className="cp-field">
            <span className="cp-label">Sale IGST A/c :</span>
            <div className="cp-input-wrap">
              <AccountMasterHelp name="IGSTAc" Ac_type="" onAcCodeClick={handleIGSTAc} CategoryName={SaleIGSTAcName} CategoryCode={newIGSTAc} tabIndex={15} />
            </div>
          </div>

          <div className="cp-field">
            <span className="cp-label">Purchase CGST :</span>
            <div className="cp-input-wrap">
              <AccountMasterHelp name="PurchaseCGSTAc" Ac_type="" onAcCodeClick={handlePurchaseCGSTAc} CategoryName={PurchaseCGSTAcName} CategoryCode={newPurchaseCGSTAc} tabIndex={16} />
            </div>
          </div>

          <div className="cp-field">
            <span className="cp-label">Purchase SGST :</span>
            <div className="cp-input-wrap">
              <AccountMasterHelp name="PurchaseSGSTAc" Ac_type="" onAcCodeClick={handlePurchaseSGSTAc} CategoryName={PurchaseSGSTAcName} CategoryCode={newPurchaseSGSTAc} tabIndex={17} />
            </div>
          </div>

          <div className="cp-field">
            <span className="cp-label">Purchase IGST :</span>
            <div className="cp-input-wrap">
              <AccountMasterHelp name="PurchaseIGSTAc" Ac_type="" onAcCodeClick={handlePurchaseIGSTAc} CategoryName={PurchaseIGSTAcName} CategoryCode={newPurchaseIGSTAc} tabIndex={18} />
            </div>
          </div>

          <div className="cp-field">
            <span className="cp-label">Round Off :</span>
            <div className="cp-input-wrap">
              <AccountMasterHelp name="RoundOff" Ac_type="" onAcCodeClick={handleRoundOff} CategoryName={RoundOffAcName} CategoryCode={newRoundOff} tabIndex={19} />
            </div>
          </div>

          <div className="cp-field">
            <span className="cp-label">Transport RCM GSTRate :</span>
            <div className="cp-input-wrap">
              <GSTRateMasterHelp name="Transport_RCM_GSTRate" onAcCodeClick={handleTransport_RCM_GSTRate} GstRateName={TransportRCMGSTAcName} GstRateCode={newTransport_RCM_GSTRate} tabIndex={20} />
            </div>
          </div>

          <div className="cp-field">
            <span className="cp-label">CGST RCM A/c :</span>
            <div className="cp-input-wrap">
              <AccountMasterHelp name="CGST_RCM_Ac" Ac_type="" onAcCodeClick={handleCGST_RCM_Ac} CategoryName={CGST_RCMAcName} CategoryCode={newCGST_RCM_Ac} tabIndex={21} />
            </div>
          </div>

          <div className="cp-field">
            <span className="cp-label">SGST RCM A/c :</span>
            <div className="cp-input-wrap">
              <AccountMasterHelp name="SGST_RCM_Ac" Ac_type="" onAcCodeClick={handleSGST_RCM_Ac} CategoryName={SGST_RCMAcName} CategoryCode={newSGST_RCM_Ac} tabIndex={22} />
            </div>
          </div>

          <div className="cp-field">
            <span className="cp-label">IGST RCM A/c :</span>
            <div className="cp-input-wrap">
              <AccountMasterHelp name="IGST_RCM_Ac" Ac_type="" onAcCodeClick={handleIGST_RCM_Ac} CategoryName={IGST_RCMAcName} CategoryCode={newIGST_RCM_Ac} tabIndex={23} />
            </div>
          </div>

          <div className="cp-field">
            <span className="cp-label">Freight Payable A/C :</span>
            <div className="cp-input-wrap">
              <AccountMasterHelp name="Freight_Ac" Ac_type="" onAcCodeClick={handleFreight_Ac} CategoryName={FreightAcName} CategoryCode={newFreight_Ac} tabIndex={24} />
            </div>
          </div>

          <div className="cp-field">
            <span className="cp-label">Sale TCS % :</span>
            <div className="cp-input-wrap">
              <input type="text" id="TCS" name="TCS" value={formData.TCS} onChange={handleChange} className="cp-text-input" />
            </div>
          </div>

          <div className="cp-field">
            <span className="cp-label">Purchase TCS A/c :</span>
            <div className="cp-input-wrap">
              <AccountMasterHelp name="PurchaseTCSAc" Ac_type="" onAcCodeClick={handlePurchaseTCSAc} CategoryName={PurchaseTCS_AcName} CategoryCode={newPurchaseTCSAc} tabIndex={26} />
            </div>
          </div>

          <div className="cp-field">
            <span className="cp-label">Sale TCS A/c :</span>
            <div className="cp-input-wrap">
              <AccountMasterHelp name="SaleTCSAc" Ac_type="" onAcCodeClick={handleSaleTCSAc} CategoryName={SaleTCS_AcName} CategoryCode={newSaleTCSAc} tabIndex={27} />
            </div>
          </div>

          <div className="cp-field">
            <span className="cp-label">Other A/c :</span>
            <div className="cp-input-wrap">
              <AccountMasterHelp name="OTHER_AMOUNT_AC" Ac_type="" onAcCodeClick={handleOTHER_AMOUNT_AC} CategoryName={OtherAcName} CategoryCode={newOTHER_AMOUNT_AC} tabIndex={29} />
            </div>
          </div>

          <div className="cp-field">
            <span className="cp-label">Market Sase A/c :</span>
            <div className="cp-input-wrap">
              <AccountMasterHelp name="MarketSase" Ac_type="" onAcCodeClick={handleMarketSase} CategoryName={MarketSaseAcName} CategoryCode={newMarketSase} tabIndex={30} />
            </div>
          </div>

          <div className="cp-field">
            <span className="cp-label">Supercost A/c :</span>
            <div className="cp-input-wrap">
              <AccountMasterHelp name="SuperCost" Ac_type="" onAcCodeClick={handleSuperCost} CategoryName={SupercostAcName} CategoryCode={newSuperCost} tabIndex={31} />
            </div>
          </div>

          <div className="cp-field">
            <span className="cp-label">Packing A/c :</span>
            <div className="cp-input-wrap">
              <AccountMasterHelp name="Packing" Ac_type="" onAcCodeClick={handlePacking} CategoryName={PackingAcName} CategoryCode={newPacking} tabIndex={32} />
            </div>
          </div>

          <div className="cp-field">
            <span className="cp-label">Hamali A/c :</span>
            <div className="cp-input-wrap">
              <AccountMasterHelp name="Hamali" Ac_type="" onAcCodeClick={handleHamali} CategoryName={HamaliAcName} CategoryCode={newHamali} tabIndex={33} />
            </div>
          </div>

          <div className="cp-field">
            <span className="cp-label">Transport TDS :</span>
            <div className="cp-input-wrap">
              <AccountMasterHelp name="TransportTDS_Ac" Ac_type="" onAcCodeClick={handleTransportTDS_Ac} CategoryName={TransportTDS_AcName} CategoryCode={newTransportTDS_Ac} tabIndex={34} />
            </div>
          </div>

          <div className="cp-field">
            <span className="cp-label">Transport TDS Cut by Us :</span>
            <div className="cp-input-wrap">
              <AccountMasterHelp name="TransportTDS_AcCut" Ac_type="" onAcCodeClick={handleTransportTDS_AcCut} CategoryName={TransportTDS_CutAcName} CategoryCode={newTransportTDS_AcCut} tabIndex={35} />
            </div>
          </div>

          <div className="cp-field">
            <span className="cp-label">Mill Payment Date :</span>
            <div className="cp-input-wrap">
              <input type="text" id="Mill_Payment_date" name="Mill_Payment_date" value={formData.Mill_Payment_date} onChange={handleChange} className="cp-text-input" />
            </div>
          </div>

          <div className="cp-field">
            <span className="cp-label">Dispatch Type :</span>
            <div className="cp-input-wrap">
              <select id="dispatchType" name="dispatchType" value={formData.dispatchType} onChange={handleChange} className="cp-select">
                <option value="C">Commission</option>
                <option value="N">With GST Naka Delivery</option>
                <option value="A">Naka Delivery without GST Rate</option>
                <option value="D">DO</option>
              </select>
            </div>
          </div>

          <div className="cp-field">
            <span className="cp-label">Return Sale CGST :</span>
            <div className="cp-input-wrap">
              <AccountMasterHelp name="ReturnSaleCGST" Ac_type="" onAcCodeClick={handleReturnSaleCGST} CategoryName={ReturnSaleCGST_AcName} CategoryCode={newReturnSaleCGST} tabIndex={38} />
            </div>
          </div>

          <div className="cp-field">
            <span className="cp-label">Return Sale SGST :</span>
            <div className="cp-input-wrap">
              <AccountMasterHelp name="ReturnSaleSGST" Ac_type="" onAcCodeClick={handleReturnSaleSGST} CategoryName={ReturnSaleSGSTAc_Name} CategoryCode={newReturnSaleSGST} tabIndex={39} />
            </div>
          </div>

          <div className="cp-field">
            <span className="cp-label">Return Sale IGST :</span>
            <div className="cp-input-wrap">
              <AccountMasterHelp name="ReturnSaleIGST" Ac_type="" onAcCodeClick={handleReturnSaleIGST} CategoryName={ReturnSaleIGSTName} CategoryCode={newReturnSaleIGST} tabIndex={40} />
            </div>
          </div>

          <div className="cp-field">
            <span className="cp-label">Return Purchase CGST :</span>
            <div className="cp-input-wrap">
              <AccountMasterHelp name="ReturnPurchaseCGST" Ac_type="" onAcCodeClick={handleReturnPurchaseCGST} CategoryName={ReturnPurchaseCGSTName} CategoryCode={newReturnPurchaseCGST} tabIndex={41} />
            </div>
          </div>

          <div className="cp-field">
            <span className="cp-label">Return Purchase SGST :</span>
            <div className="cp-input-wrap">
              <AccountMasterHelp name="ReturnPurchaseSGST" Ac_type="" onAcCodeClick={handleReturnPurchaseSGST} CategoryName={ReturnPurchaseSGST} CategoryCode={newReturnPurchaseSGST} tabIndex={42} />
            </div>
          </div>

          <div className="cp-field">
            <span className="cp-label">Return Purchase IGST :</span>
            <div className="cp-input-wrap">
              <AccountMasterHelp name="ReturnPurchaseIGST" Ac_type="" onAcCodeClick={handleReturnPurchaseIGST} CategoryName={ReturnPurchaseIGSTName} CategoryCode={newReturnPurchaseIGST} tabIndex={43} />
            </div>
          </div>

          <div className="cp-field">
            <span className="cp-label">Sale TDS A/c :</span>
            <div className="cp-input-wrap">
              <AccountMasterHelp name="SaleTDSAc" Ac_type="" onAcCodeClick={handleSaleTDSAc} CategoryName={SaleTDSAcName} CategoryCode={newSaleTDSAc} tabIndex={44} />
            </div>
          </div>

          <div className="cp-field">
            <span className="cp-label">Purchase TDS A/c :</span>
            <div className="cp-input-wrap">
              <AccountMasterHelp name="PurchaseTDSAc" Ac_type="" onAcCodeClick={handlePurchaseTDSAc} CategoryName={PurchaseTDSAcName} CategoryCode={newPurchaseTDSAc} tabIndex={45} />
            </div>
          </div>

          <div className="cp-field">
            <span className="cp-label">Purchase TDS Rate :</span>
            <div className="cp-input-wrap">
              <input type="text" id="PurchaseTDSRate" name="PurchaseTDSRate" value={formData.PurchaseTDSRate} onChange={handleChange} className="cp-text-input" />
            </div>
          </div>

          <div className="cp-field">
            <span className="cp-label">Sale TDS Rate :</span>
            <div className="cp-input-wrap">
              <input type="text" id="SaleTDSRate" name="SaleTDSRate" value={formData.SaleTDSRate} onChange={handleChange} className="cp-text-input" />
            </div>
          </div>

          <div className="cp-field">
            <span className="cp-label">TCS Sale Balance Limit :</span>
            <div className="cp-input-wrap">
              <input type="text" id="BalanceLimit" name="BalanceLimit" value={formData.BalanceLimit} onChange={handleChange} className="cp-text-input" />
            </div>
          </div>

          <div className="cp-field">
            <span className="cp-label">Rate Diff A/c :</span>
            <div className="cp-input-wrap">
              <AccountMasterHelp name="RateDiffAc" Ac_type="" onAcCodeClick={handleRateDiffAc} CategoryName={RateDiffAcName} CategoryCode={newRateDiffAc} tabIndex={49} />
            </div>
          </div>

          <div className="cp-field">
            <span className="cp-label">GST Rate Code :</span>
            <div className="cp-input-wrap">
              <GSTRateMasterHelp name="def_gst_rate_code" onAcCodeClick={handleDefaultGSTRate} GstRateName={defaultGSTRateName} GstRateCode={defaultGSTRateCode} tabIndex={20} />
            </div>
          </div>

          <div className="cp-field">
            <span className="cp-label">Depreciation A/c :</span>
            <div className="cp-input-wrap">
              <AccountMasterHelp name="DepreciationAC" Ac_type="" onAcCodeClick={handleDepreciationAC} CategoryName={DepreciationAcName} CategoryCode={newDepreciationAC} tabIndex={50} />
            </div>
          </div>

          <div className="cp-field">
            <span className="cp-label">Default Sundry Creditors :</span>
            <div className="cp-input-wrap">
              <GroupMasterHelp name="defaultSundryCreditors" onAcCodeClick={handleDefaultSundryCreditors} GroupName={defaultSundryCreditorsAcName} GroupCode={defaultSundryCreditorsAcCode} tabIndex={50} />
            </div>
          </div>

          <div className="cp-field">
            <span className="cp-label">Default Sundry Debtors :</span>
            <div className="cp-input-wrap">
              <GroupMasterHelp name="defalultSundryDebitors" onAcCodeClick={handleDefaultSundryDebitors} GroupName={defalultSundryDebitorsAcName} GroupCode={defalultSundryDebitorsAcCode} tabIndex={51} />
            </div>
          </div>

          <div className="cp-field">
            <span className="cp-label">Freight Receivable :</span>
            <div className="cp-input-wrap">
              <AccountMasterHelp name="Freight_Receivable_Ac" Ac_type="" onAcCodeClick={handleFreightReceivableAc} CategoryName={Freight_Receivable_AcName} CategoryCode={Freight_Receivable_AcCode} tabIndex={51} />
            </div>
          </div>

          <div className="cp-field">
            <span className="cp-label">Closing Stock Trading A/c :</span>
            <div className="cp-input-wrap">
              <AccountMasterHelp name="closing_stock_trading_ac" Ac_type="" onAcCodeClick={handleClosingStockTradingAc} CategoryName={closing_stock_trading_acName} CategoryCode={closing_stock_trading_acCode} tabIndex={50} />
            </div>
          </div>

          <div className="cp-field">
            <span className="cp-label">Closing Stock Balance A/c :</span>
            <div className="cp-input-wrap">
              <AccountMasterHelp name="closing_stock_bL_ac" Ac_type="" onAcCodeClick={handleClosingStockBlAc} CategoryName={closing_stock_bL_acName} CategoryCode={closing_stock_bL_acCode} tabIndex={51} />
            </div>
          </div>

        </div>

        <div style={{ marginTop: 30, marginBottom: 60, display: "flex", justifyContent: "center" }}>
          <button type="submit">Update</button>
        </div>
      </form>
    </Box>
  </>
);

};

export default CompanyParameters;