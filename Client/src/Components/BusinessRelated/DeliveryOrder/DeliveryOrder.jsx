import React from "react";
import { useEffect, useState, useRef } from "react";
import ActionButtonGroup from "../../../Common/CommonButtons/ActionButtonGroup";
import NavigationButtons from "../../../Common/CommonButtons/NavigationButtons";
import SystemHelpMaster from "../../../Helper/SystemmasterHelp";
import GSTStateMasterHelp from "../../../Helper/GSTStateMasterHelp";
import PurcnoHelp from "../../../Helper/PurcnoHelp";
import CarporateHelp from "../../../Helper/CarporateHelp";
import "./DeliveryOrder.css";
import "./DeliveryOrderMobile.css";
import "../../../App.css"
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AccountMasterHelp from "../../../Helper/AccountMasterHelp";
import GSTRateMasterHelp from "../../../Helper/GSTRateMasterHelp";
import { useNavigate, useLocation } from "react-router-dom";
import DeliveryOrderOurDoReport from "./DeliveryOrderOurDOReport";
import DeliveryOrderOurDOForReport from "./DeliveryOrderOurDOForReport";
import PartyBillDoReport from './PartyBillDO'
import SaleBillReport from '../../Outward/SaleBill/CustomizeSBReport'
import PartyDOReport from "./PartyDOReport";
import PendingDOSelectModal from "./PendingDOSelectModal";
import { initialFormData, checkMatchStatus, Acname } from './InitialFormDataDO'
import io from "socket.io-client";
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
import ProformaInvoice from "./ProformaInvoice";
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";
import { fetchAccountBalance } from "../../../Common/GetAccountBalance/GetAccountBalance";
import CustomTextFeild from "../../../Common/Buttons/CustomTextFeild"
import DoUtrNoHelp from "../../../Helper/DoUTRNoHelp";
import CarporateSaleBillPrint from "../../Outward/SaleBill/CarporateSaleBillPrint"
import LockOpenIcon from "@mui/icons-material/LockOpen";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import eBuySugarLogo from "../../../Assets/eBuySugarlogo.jpg";

import SaveUpdateSpinner from "../../../Common/Spinners/SaveUpdateSpinner";


const API_URL = process.env.REACT_APP_API;
const WEBSOCKET_URL = process.env.REACT_APP_API_URL;

// Common style for all table headers
const headerCellStyle = {
  fontWeight: "bold",
  backgroundColor: "#3f51b5",
  color: "white",
  padding: "2px",
  textAlign: "center",
  "&:hover": {
    backgroundColor: "#303f9f",
    cursor: "pointer",
  },
};

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


const DeliveryOrder = () => {

  //GET Values from session
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

  const [showPendingDOModal, setShowPendingDOModal] = useState(false);
  const [pendingDOList, setPendingDOList] = useState([]);
  const [pendingDOLoading, setPendingDOLoading] = useState(false);
  const [pendingDOCount, setPendingDOCount] = useState(0);
  const pendingDOModalOpenRef = useRef(false);


  const [carporatebilltocode, setcarporatebilltocode] = useState("");
  const [carporatebilltocodeacid, setcarporatebilltocodeacid] = useState("");
  const [carporatebilltocodename, setcarporatebilltocodename] = useState("");


  const [Autopurchase, setAutopurchase] = useState("");
  const [isInputDisabled, setIsInputDisabled] = useState(false);
  const [popupMode, setPopupMode] = useState("add");

  //EwayBillEinvoice Management 
  const [isOpenEInvoice, setIsOpenEInvoice] = useState(false);
  const [isOpenEwayBill, setIsOpenEwayBill] = useState(false);
  const [isOpenEInvoiceEwaybill, setIsOpenEInvoiceEwaybill] = useState(false);

  const [godown_Code, setGoDownCode] = useState('')
  const [godownId, setGodownId] = useState('')
  const [godownName, setGodownName] = useState('')

  //GET Balance of particular account
  const [billToManuallySet, setBillToManuallySet] = useState(false);
  const [shipToManuallySet, setShipToManuallySet] = useState(false);
  let [millBalance, setMillBalance] = useState(0)
  let [billToBalance, setBillToBalance] = useState(0)
  let [shipToBalance, setShipToBalance] = useState(0)
  let [billToGSTNo, setBillToGSTNo] = useState('')
  let [shipToGSTNo, setShipToGSTNo] = useState('')
  const [utrNo, setUTRNo] = useState('')
  const [utrCompanyCode, setUTRCompanyCode] = useState('')
  const [utrYearCode, setUTRYearCode] = useState('')
  const [detailRows, setDetailRows] = useState([]);
  //Head section state management
  const [formData, setFormData] = useState(initialFormData);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const quantalRef = useRef(null);
  const shipToRef = useRef(null);

  const addButtonRef = useRef(null);
  const firstInputRef = useRef(null);
  const setFocusToFirstField = () => {
    if (firstInputRef.current) {
      firstInputRef.current.focus();
    }
  };



  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    const hideFooterOnMobile = () => {
      if (isMobile) {
        // Create style element to hide all footers
        const styleId = "mobile-footer-hide-style";
        let styleElement = document.getElementById(styleId);

        if (!styleElement) {
          styleElement = document.createElement("style");
          styleElement.id = styleId;
          styleElement.innerHTML = `
                  footer, 
                  .footer, 
                  [class*="Footer"], 
                  [class*="footer"],
                  .MuiDrawer-paper ~ footer,
                  .MuiAppBar-root ~ footer,
                  .main-footer,
                  .app-footer,
                  .page-footer {
                    display: none !important;
                    visibility: cen !important;
                    opacity: 0 !important;
                    height: 0 !important;
                    overflow: hidden !important;
                    pointer-events: none !important;
                  }
                `;
          document.head.appendChild(styleElement);
        }
      } else {

        const styleElement = document.getElementById(
          "mobile-footer-hide-style",
        );
        if (styleElement) {
          styleElement.remove();
        }
      }
    };

    hideFooterOnMobile();


    return () => {
      const styleElement = document.getElementById("mobile-footer-hide-style");
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, [isMobile]);



  const handleChange = async (event) => {
    const { name, value } = event.target;
    const updatedValue = name === "truck_no" ? formatTruckNumber(value) : value;

    let finalValue = updatedValue;

    const numericFields = [
      'PurchaseTDSRate', 'SaleTDSRate',
    ];

    if (numericFields.includes(name) && updatedValue === '') {
      finalValue = '0';
    }

    let updatedFormData = {
      ...formData,
      [name]: finalValue,
    };

    if (name === 'doc_date') {
      updatedFormData = {
        ...updatedFormData,
        doc_date: value,
        Do_DATE: value,
        Purchase_Date: value,
        newsbdate: value
      };
    }

    updatedFormData = await calculateDependentValues(
      name,
      finalValue,
      updatedFormData,
      matchStatus,
      Gst_Rate
    );

    setFormData(() => ({
      ...updatedFormData,
      [name]: finalValue,
    }));

    setFormDataDetail((prevState) => ({
      ...prevState,
      Amount: updatedFormData.Mill_AmtWO_TCS,
    }));

    setUsers((prevUsers) =>
      prevUsers.map((user) => ({
        ...user,
        Amount: updatedFormData.Mill_AmtWO_TCS,
      }))
    );
  };


  //lock mechanism
  const { isRecordLockedByUser, lockRecord, unlockRecord } = useRecordLocking(
    formData.doc_no,
    undefined,
    companyCode,
    Year_Code,
    "do"
  );


  const [formDataDetail, setFormDataDetail] = useState({
    ddType: "T",
    Narration: "Transfer Letter",
    Amount: 0.00,
    UTR_NO: "",
    UtrYearCode: "",
    UtrCompanyCode: "",
    utrdetailid: "",
    detail_Id: 1,
    LTNo: 0
  });


  //In utility page record doubleClicked that recod show for edit functionality
  const location = useLocation();
  const selectedRecord = location.state?.selectedRecord;
  const selectedRecordPendingDo = location.state?.selectedRecordPendingDo;
  const permissions = location.state?.permissionsData;
  const searchParams = new URLSearchParams(location.search);
  const navigatedRecord = searchParams.get('navigatedRecord');

  //Help Functionality
  const handlemill_code = async (code, accoid, name, mobileno, GSTNO, TDsApplicable, gststatecode, cityname, gstname) => {
    setmillcode(code);
    setmillcodeacid(accoid);
    setmillcodename(name);
    setmillstatecode(gststatecode);
    setmillstatename(gstname);

    setFormData({
      ...formData,
      mill_code: code,
      mc: accoid,
      MillGSTStateCode: gststatecode
    });
    if (code) {
      const { balance, gstNo } = await fetchAccountBalance(code);
      if (balance !== null) {
        setMillBalance(balance);
      }
    }
    else {
      setMillBalance(0)
    }
  };


  // parent component
  const handleUTRNo = (row) => {
    // treat null/undefined/"" as cleared
    if (!row || typeof row !== "object") {
      setUTRNo("");
      setUTRCompanyCode(null);
      setUTRYearCode(null);

      setFormDataDetail(prev => ({
        ...prev,
        UTR_NO: "",
        UtrYearCode: "",
        utrdetailid: 0,
        UtrCompanyCode: "",
        LTNo: 0,
        detail_Id: prev?.detail_Id ?? 1,
      }));

      // also clear any summary label if you have one
      return; // ← IMPORTANT: exit before touching row.*
    }

    setUTRNo(String(row?.doc_no ?? ""));
    setUTRCompanyCode(row?.Company_Code ?? "");
    setUTRYearCode(row?.Year_Code ?? "");

    setFormDataDetail(prev => ({
      ...prev,
      ddType: "T",
      Narration: row?.utr_no || "",
      UTR_NO: String(row?.doc_no ?? ""),
      UtrYearCode: row?.Year_Code ?? "",
      utrdetailid: row?.utrdetailid ?? 0,
      UtrCompanyCode: row?.Company_Code ?? "",
      LTNo: row?.lot_no ?? 0,
      detail_Id: prev?.detail_Id ?? 1,
    }));
  };


  const handlePurcno = (Tenderno, Tenderid) => {
    setTenderno(Tenderno);
    setTenderid(Tenderid);

    const Dispatch_type =
      tenderDetails.DT === "D" ? formData.desp_type === "DO" : "DI";

    setFormData({
      ...formData,
      desp_type: Dispatch_type,
      purc_no: Tenderno,
      purc_order: Tenderid,
    });

    setTimeout(() => {
      formData.voucher_by === 2 ? shipToRef.current?.focus() : quantalRef.current?.focus();
    }, 0);
  };

  const handleCarporate = (Carporateno) => {
    setCarporateno(Carporateno);

    setFormData({
      ...formData,
      Carporate_Sale_No: Carporateno,
    });
  };

  const handleDO = (code, accoid, name) => {
    setDOcode(code);
    setDOcodeacid(accoid);
    setDOcodeacname(name);
    setFormData({
      ...formData,
      DO: code,
      docd: accoid,
    });
  };
  const handleMemoGSTRate = (code, rate) => {
    setGSTMemoGstcode(code);
    setGSTMemoGstrate(rate);

    setFormData({
      ...formData,
      MemoGSTRate: code,
      newMemoGSTRate: code,
      lblMemoGSTRatename: rate
    });
  };




  const handlevoucher_by = async (code, accoid, name, mobileno, GSTNO, TDsApplicable, gststatecode, cityname, gstname) => {
    tenderDetails.shiptostatename = '';
    tenderDetails.shiptostatecode = '';
    tenderDetails.buyeridcitystate = '';
    tenderDetails.buyergststatecode = '';
    if (!code) {
      setvoucherbycode('');
      setvoucherbycodeeacid('');
      setvoucherbycodename('');
      setvoucherbystatecode('');
      setvoucherbystatename('');
      setShipToGSTNo('');
      newvoucher_by = '';
      lblvoucherByname = '';
      setShipToBalance(0);
      setBillToBalance(0);
      tenderDetails.shiptostatename = '';
      tenderDetails.shiptostatecode = '';



      if (!billToManuallySet) {
        setsalebilltocode('');
        setBillToGSTNo('');
        lblsalebilltoname = '';
        newSaleBillTo = '';
        salebillTitle = '';
        carporatenameTitle = '';
        tenderDetails.Buyer = '';
        tenderDetails.buyername = '';
        tenderDetails.buyeridcitystate = '';
        tenderDetails.buyergststatecode = '';
      }

      setFormData({
        ...formData,
        voucher_by: '',
        vb: '',
        VoucherbyGstStateCode: '',
        st: '',
        SaleBillTo: '',
        sb: '',
        SalebilltoGstStateCode: ''
      });

      return;
    }
    setvoucherbycode(code);
    setvoucherbycodeeacid(accoid);
    setvoucherbycodename(name);
    setvoucherbystatecode(gststatecode);
    setvoucherbystatename(gstname);
    setShipToGSTNo(GSTNO);
    newvoucher_by = code;
    lblvoucherByname = name;
    let updatedFormData = {
      ...formData,
      voucher_by: code,
      vb: accoid,
      VoucherbyGstStateCode: gststatecode,
      st: accoid
    };
    if (!billToManuallySet) {
      setsalebilltocode(code);
      setBillToGSTNo(GSTNO);
      lblsalebilltoname = name;
      newSaleBillTo = code;
      salebillTitle = name;
      tenderDetails.Buyer = code;
      tenderDetails.buyername = name;
      updatedFormData.SaleBillTo = code;
      updatedFormData.sb = accoid;
      updatedFormData.SalebilltoGstStateCode = gststatecode
    }
    setFormData(updatedFormData)
    if (code) {
      const { balance, gstNo } = await fetchAccountBalance(code);
      if (balance !== null) {
        setShipToBalance(balance)
        if (String(formData.GETPASSCODE) !== String(formData.SaleBillTo)) {
          setBillToBalance(balance);
        }
      }
    }
    else {
      setShipToBalance(0)
      setBillToBalance(0)
    }
  };


  const handlebroker = (code, accoid, name) => {
    setbrokercode(code);
    setbrokercodeacid(accoid);
    setbrokercodename(name);
    setFormData({
      ...formData,
      broker: code,
      bk: accoid,
    });
  };

  const handletransport = (code, accoid, name, mobileno, GSTNO, TDsApplicable, gststatecode, cityname, gstname) => {
    if (!code) {
      settransportcode('');
      settransportcodename('');
      settransportcodeacid('');
      setTransportStateCode('');
      settransportstatename('');

      setFormData((prevFormData) => ({
        ...prevFormData,
        transport: '',
        tc: '',
        TransportGSTStateCode: ''
      }));

      return;
    }
    settransportcode(code);
    settransportcodename(name);
    settransportcodeacid(accoid);
    setTransportStateCode(gststatecode);
    settransportstatename(gstname);

    setFormData((prevFormData) => ({
      ...prevFormData,
      transport: code,
      tc: accoid,
      TransportGSTStateCode: gststatecode,
    }));
  };


  const setDefaultTransport = async () => {
    const companyCode = sessionStorage.getItem("Company_Code");
    try {
      const res = await axios.get(`${API_URL}/getaccountmasterByid`, {
        params: { Ac_Code: "5005", Company_Code: companyCode }
      });
      const t = res.data?.account_master_data;
      if (t) {
        lbltransportname = t.Ac_Name_E || "";
        newtransport = "5005";
        settransportcode("5005");
        settransportcodeacid(t.accoid || 4484);
        settransportcodename(t.Ac_Name_E || "");
        setFormData(prev => ({ ...prev, transport: "5005", tc: t.accoid || 4484 }));
      }
    } catch (e) {
      console.error("Transport fetch failed:", e);
    }
  };


  const handleGrade = (name) => {
    setGrade(name);
    setFormData({
      ...formData,
      grade: name,
    });
  };

  const handleGradeUpdate = (grade) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      grade: grade,
    }));
  };

  const handleGETPASSCODE = (code, accoid, name, mobileno, GSTNO, TDsApplicable, gststatecode, cityname, State_Name) => {
    if (!code) {
      setgetpasscode('');
      setgetpasscodeacid('');
      setgetpasscodename('');
      setgetpassstatecode('');
      setgetpassstatecodename('');
      tenderDetails.Getpassnonamestatename = '';
      tenderDetails.Getpassnonamestatecode = '';

      setFormData({
        ...formData,
        GETPASSCODE: '',
        gp: '',
        GetpassGstStateCode: ''
      });

      return;
    }
    setgetpasscode(code);
    setgetpasscodeacid(accoid);
    setgetpasscodename(name);
    setgetpassstatecode(gststatecode);
    setgetpassstatecodename(State_Name)
    setFormData({
      ...formData,
      GETPASSCODE: code,
      gp: accoid,
      GetpassGstStateCode: gststatecode,
    });
  };

  const handleSBGenerate = async (e) => {
    e.preventDefault();

    // Block if Purchase Eway Bill has not been generated yet
    if (!formData.MillEwayBill || String(formData.MillEwayBill).trim() === '') {
      Swal.fire({
        title: 'Purchase Eway Bill Not Generated',
        text: 'Purchase Eway Bill is not generated. Please generate the Purchase Eway Bill before creating the Sale Bill.',
        icon: 'warning',
        confirmButtonText: 'OK',
      });
      return;
    }

    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to generate the sale bill?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, generate it!',
      cancelButtonText: 'No, cancel',
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      try {
        setIsLoading(true);

        const saleid = lastTenderData.saleid;
        const Dono = lastTenderData.doc_no;
        const Companycode = lastTenderData.company_code;
        const Yearcode = lastTenderData.Year_Code;

        const updateApiUrl = `${API_URL}/Generate_SaleBill?DoNo=${Dono}&CompanyCode=${Companycode}&Year_Code=${Yearcode}&saleid=${saleid}`;

        const response = await axios.put(updateApiUrl);

        Swal.fire({
          title: "Success!",
          text: "Sale Bill Genrate Sucessfully!",
          icon: "success",
          confirmButtonText: "OK"
        });

        const fetchApiUrl = `${API_URL}/DOByid?company_code=${Companycode}&doc_no=${Dono}&Year_Code=${Yearcode}`;
        const response2 = await axios.get(fetchApiUrl);
        const data = response2.data;

        CommonFeilds(data);
        setIsEditing(false);
        setIsLoading(false);

      } catch (error) {
        console.error("Error updating data:", error);

        if (error.response && error.response.status === 400) {
          const errorMessage = error.response.data.error || "An error occurred.";
          Swal.fire({
            title: "Error",
            text: errorMessage,
            icon: "error",
            confirmButtonText: "OK"
          });
        } else {
          toast.error("Failed to update data.");
        }

        setIsLoading(false);
      } finally {
        setIsLoading(false);
      }
    } else {
      console.log('Sale bill generation canceled.');
    }
  };


  const handleSaleBillTo = async (code, accoid, name, mobileno, GSTNO, TDsApplicable, gststatecode, cityname, State_Name) => {
    setBillToManuallySet(true)
    tenderDetails.buyeridcitystate = '';
    tenderDetails.buyergststatecode = '';
    if (!code) {
      setsalebilltocode('');
      setsalebilltocodeacid('');
      setsalebilltocodename('');
      setsalebilltostatecode('');
      setsalebilltostatename('');
      setBillToGSTNo('');
      newSaleBillTo = '';
      lblsalebilltoname = '';
      setBillToBalance(0);
      SaleBillByCode = 0;
      SaleBillByName = '';
      tenderDetails.buyeridcitystate = '';
      tenderDetails.buyergststatecode = '';

      setFormData({
        ...formData,
        SaleBillTo: '',
        sb: '',
        SalebilltoGstStateCode: 0,
      });
      return;
    }
    setsalebilltocode(code);
    setsalebilltocodeacid(accoid);
    setsalebilltocodename(name);
    setsalebilltostatecode(gststatecode);
    setsalebilltostatename(State_Name);
    setBillToGSTNo(GSTNO);
    newSaleBillTo = code;
    lblsalebilltoname = name;
    setFormData({
      ...formData,
      SaleBillTo: code,
      sb: accoid,
      SalebilltoGstStateCode: gststatecode,
      sale_rate: code === formData.GETPASSCODE ? formData.PurchaseRate : formData.sale_rate
    });
    if (code) {
      const { balance, gstNo } = await fetchAccountBalance(code);
      if (balance !== null) {
        setBillToBalance(balance);
      }
    }
    else {
      setBillToBalance(0)
    }
  };

  const handlecarporate_ac = (code, accoid, name, mobileno, GSTNO, TDsApplicable, gststatecode, cityname, State_Name) => {
    setcarporatebilltocode(code);
    setcarporatebilltocodeacid(accoid);
    setcarporatebilltocodename(name);
    CarporatestatecodeGSTStateCode = gststatecode
    setFormData({
      ...formData,
      carporate_ac: code,
      ca: accoid,

    });
  };

  const handleVasuli_Ac = (code, accoid, name) => {
    setvasuliaccode(code);
    setvasuliaccodeacid(accoid);
    setvasuliaccodeacname(name);
    setFormData({
      ...formData,
      Vasuli_Ac: code,
      va: accoid,
    });
  };

  const handleGstRateCode = (code, rate, name, gstid) => {
    setGstCode(code);
    setGstRatecode(rate);
    setFormData({
      ...formData,
      GstRateCode: code,
      gstid: gstid
    });
  };

  const handleGetpassGstStateCode = (code, name, gst) => {
    setgetpassstatecode(code);
    setgetpassstatecodename(name);

    setFormData({
      ...formData,
      GetpassGstStateCode: code,
    });
  };

  const handleVoucherbyGstStateCode = (code, name) => {
    setvoucherbystatecode(code);
    setvoucherbystatename(name);
    setFormData({
      ...formData,
      VoucherbyGstStateCode: code,
    });
  };

  const handleSalebilltoGstStateCode = (code, name) => {
    setsalebilltostatecode(code);
    setsalebilltostatename(name);
    setFormData({
      ...formData,
      SalebilltoGstStateCode: code,
    });
  };

  const handleMillGSTStateCode = (code, name) => {
    setmillstatecode(code);
    setmillstatename(name);
    setFormData({
      ...formData,
      MillGSTStateCode: code,
    });
  };

  const handleTransportGSTStateCode = (code, name) => {
    setTransportStateCode(code);
    settransportstatename(name);
    setFormData({
      ...formData,
      TransportGSTStateCode: code,
    });
  };

  const handlebrandcode = (code, accoid) => {
    setBrandCode(code);
    setBrandCodeAccoid(accoid);
    setFormData({
      ...formData,
      brandcode: code,
    });
  };

  const handleCashDiffAc = (code, accoid, name) => {
    setBPaccode(code);
    setBPaccodeacid(accoid);
    setBPaccodeacname(name);
    setFormData({
      ...formData,
      CashDiffAc: code,
      CashDiffAcId: accoid,
    });
  };

  const handleTDSAc = (code, accoid, name) => {
    setTDSACcode(code);
    setTDSACcodeacid(accoid);
    setTDSACcodeacname(name);
    setFormData({
      ...formData,
      TDSAc: code,
      TDSAcId: accoid,
    });
  };

  const handleItemSelect = (code, accoid, name) => {
    setItemSelect(code);
    setItemSelectAccoid(accoid);
    setItemSelectname(name);
    setFormData({
      ...formData,
      itemcode: code,
      ic: accoid,
    });
  };

  const handleGoDown = (code, accoid, name) => {
    setGoDownCode(code);
    setGodownId(accoid);
    setGodownName(name);
    setFormData({
      ...formData,
      godownCode: code,
      godownId: accoid,
    });
  };

  const handleBankCode = (code, accoid, name) => {
    setbankcode(code);
    setbankcodeacid(accoid);
    setbankcodeacname(name);
  };

  const handleCarporateDetailsFetched = (details) => {
    setCarporateno(details.last_Carporate_data[0]);
    let SellingType = details.last_Carporate_data[0].SellingType;
    newGETPASSCODE = details.last_Carporate_data[0].getpassselfac;
    voucherTitle = details.last_Carporate_data[0].Unitname;
    salebillTitle = details.last_Carporate_data[0].partyName;
    brokerTitle = details.last_Carporate_data[0].BrokerName;
    getpassTitle = details.last_Carporate_data[0].getpassselfname;

    const newData = {
      quantal: details.last_Carporate_data[0].balance,
      PDSType: details.last_Carporate_data[0].SellingType,
      PDSParty: details.last_Carporate_data[0].Ac_Code,
      PDSUnit: details.last_Carporate_data[0].Unitcode,
      SaleBillTo: details.last_Carporate_data[0].Ac_Code,
      sb: details.last_Carporate_data[0].ac,
      narration4: details.last_Carporate_data[0].partyName,
      voucher_by: details.last_Carporate_data[0].Unitcode,
      lblvoucherByname: details.last_Carporate_data[0].getpassselfname,
      lblsalebilltoname: details.last_Carporate_data[0].partyName,
      lblbrokername: details.last_Carporate_data[0].BrokerName,
      gp: details.last_Carporate_data[0].getpassselfacid,
      vb: details.last_Carporate_data[0].Unitid,
      broker: details.last_Carporate_data[0].BrokerCode,
      bk: details.last_Carporate_data[0].br,
      sale_rate: details.last_Carporate_data[0].Sale_Rate,
      Delivery_Type: details.last_Carporate_data[0].DeliveryType,
      newGETPASSCODE: details.last_Carporate_data[0].getpassselfac,
      Tender_Commission: details.last_Carporate_data[0].CommissionRate,
      VoucherbyGstStateCode: details.last_Carporate_data[0].UnitSatecode,
      VoucherByName: details.last_Carporate_data[0].unitstatename,
      SalebilltoGstStateCode: details.last_Carporate_data[0].acstatecode,
      lblBilltostatename: details.last_Carporate_data[0].acstatename,
    };

    setCarporateState(newData);
    setChangeData(true);
    setFormData((prevState) => ({
      ...prevState,
      ...newData,
    }));

    return newData;
  };


  useEffect(() => {
    if (selectedRecord) {
      handlerecordDoubleClicked();
    }
    else if (navigatedRecord && !isNaN(navigatedRecord) && parseInt(navigatedRecord) > 0) {
      handleNavigateRecord();
    }
    else {
      handleAddOne();
    }
  }, [selectedRecord, navigatedRecord]);

  useEffect(() => {
    if (selectedRecordPendingDo) {
      handlerecordDoubleClickedPendingDO();
    } else {
      //handleAddOne();
    }
  }, [selectedRecordPendingDo]);

  useEffect(() => {
    if (isEditing || addOneButtonEnabled) {
      formData.voucher_by === 2 ? shipToRef.current?.focus() : quantalRef.current?.focus();
    }
  }, [formData.quantal]);



  useEffect(() => {
    const refreshPendingDOData = async () => {
      try {
        const companyCode = sessionStorage.getItem("Company_Code");
        const res = await axios.get(`${API_URL}/getdata-Pending_DO`, {
          params: { company_code: companyCode }
        });
        const all = res.data.all_data || [];
        setPendingDOCount(all.filter((r) => r.Approved !== "Y").length);
        // If the popup is open, push fresh rows into it immediately
        if (pendingDOModalOpenRef.current) {
          setPendingDOList(all);
        }
      } catch {
        // silent — badge/list stays at last known value
      }
    };

    refreshPendingDOData();

    let ws;
    let wsReconnectTimer;
    const connectWS = () => {
      ws = new WebSocket(process.env.REACT_APP_API_WEBSOCKET);
      ws.onmessage = (event) => {
        if (String(event.data).includes("refresh_delivery_orders")) {
          refreshPendingDOData();
        }
      };
      ws.onclose = () => {
        wsReconnectTimer = setTimeout(connectWS, 3000);
      };
    };
    connectWS();

    const socket = io(WEBSOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
    });

    socket.on("delivery_order_added", (data) => {
      console.log("Delivery Order Added:", data);
      refreshPendingDOData();
    });

    socket.on("delivery_order_updated", (data) => {
      console.log("Delivery Order Updated:", data);
      refreshPendingDOData();
      if (data?.doid && formData.doid && String(data.doid) === String(formData.doid)) {
        toast.info("This delivery order was updated by another user.");
      }
    });

    socket.on("delivery_order_deleted", (data) => {
      console.log("Delivery Order Deleted:", data);
      refreshPendingDOData();
      if (data?.doid && formData.doid && String(data.doid) === String(formData.doid)) {
        toast.warning("This delivery order was deleted by another user.");
      }
    });

    return () => {
      clearTimeout(wsReconnectTimer);
      if (ws) ws.close();
      socket.off("delivery_order_added");
      socket.off("delivery_order_updated");
      socket.off("delivery_order_deleted");
      socket.disconnect();
    };
  }, []);


  const handleTenderWithoutCarpoDetailsFetched = async (details, event) => {

    let Carporate_Sale_No = formData.Carporate_Sale_No;
    let assingqntl = 0;
    let Dispatch_type = "DI";
    if (details.last_details_data[0].DT === "D") {
      Dispatch_type = "DO";
    } else {
      Dispatch_type = "DI";
    }

    formData.desp_type = Dispatch_type

    if (Carporate_Sale_No === 0) {
      assingqntl = Math.abs(details.last_details_data[0].BALANCE);
    } else {
      assingqntl = CarporateState.quantal;
    }
    const purcRate =
      parseFloat(details.last_details_data[0].Party_Bill_Rate) || 0;
    const millRate = parseFloat(details.last_details_data[0].Mill_Rate) || 0;
    let rateWithGST = parseFloat((millRate * details.last_details_data[0].gstrate) / 100);
    const exciseRate = rateWithGST
    const qtl = parseFloat(assingqntl) || 0;
    // const rate = qtl !== 0 ? purcRate + exciseRate : 0;
    const rate = qtl !== 0 ? millRate + exciseRate : 0;
    const millamount = qtl * rate;
    season = details.last_details_data[0].season;

    // if (Dispatch_type === "DI") {
    //   setFormDataDetail((prevData) => {
    //     const newDetailData = {
    //       ...prevData,
    //       ddType: "T",
    //       Narration: "Transfer Letter",
    //       Amount: millamount,
    //       detail_Id: 1,
    //       Bank_Code: tenderDetails.Payment_To,
    //       bc: tenderDetails.pt,
    //       rowaction: "add",
    //     };
    //     setUsers([newDetailData]);
    //   });
    // }


    if (Dispatch_type === "DI") {
      setFormDataDetail((prevData) => {
        const newDetailData = {
          ...prevData,
          ddType: "T",
          Narration: "Transfer Letter",
          Amount: millamount,
          detail_Id: 1,
          id: users.length > 0 ? Math.max(...users.map((user) => user.id)) + 1 : 1,
          Bank_Code: details.last_details_data[0].Payment_To,
          bc: details.last_details_data[0].pt,
          rowaction: "add",
        };


        const updatedUsers = users.map((user) => {
          if (user.rowaction === "add") {
            return null
          }
          if (user.rowaction === "Normal") {
            return { ...user, rowaction: "delete" };
          }
          return user;
        }).filter(Boolean);
        updatedUsers.push(newDetailData);
        setUsers(updatedUsers);
        console.log('newDetailData', newDetailData)
        return newDetailData;
      });
    }
    setAutopurchase(details.last_details_data[0].AutoPurchaseBill);
    if (Carporate_Sale_No === 0) {
      let rateWithGST = parseFloat(((details.last_details_data[0].MillRate * details.last_details_data[0].gstrate) / 100))
      const newData = {
        // purc_no : details.last_details_data[0].Quantal,
        tenderid: details.last_details_data[0].tenderid,
        quantal: Math.abs(details.last_details_data[0].BALANCE),
        packing: details.last_details_data[0].Packing,
        bags: Math.round(parseFloat(details.last_details_data[0].Bags) || 0),
        grade: details.last_details_data[0].Grade,
        gradeName: details.last_details_data[0].Grade,
        excise_rate: rateWithGST,
        //excise_rate: (((details.last_details_data[0].MillRate  * Math.abs(details.last_details_data[0].BALANCE)) * Gst_Rate) / 100) *  Math.abs(details.last_details_data[0].BALANCE) ,
        mill_rate: details.last_details_data[0].Mill_Rate,
        Tender_Commission: details.last_details_data[0].CR,
        sale_rate: details.last_details_data[0].Sale_Rate,
        narration4: details.last_details_data[0].buyername,
        tenderdetailid: details.last_details_data[0].tenderdetailid,
        PurchaseRate: details.last_details_data[0].Party_Bill_Rate,
        Delivery_Type: details.last_details_data[0].DT || "C",
        sb: details.last_details_data[0].buyerid,
        gp: details.last_details_data[0].Getpassnoid,
        ic: details.last_details_data[0].ic,
        bk: details.last_details_data[0].buyerid,
        vb: details.last_details_data[0].buyerid,
        CashDiffAcId: details.last_details_data[0].buyerid,
        st: details.last_details_data[0].buyerid,
        docd: details.last_details_data[0].td,
        SaleBillTo: details.last_details_data[0].Buyer,
        GETPASSCODE: details.last_details_data[0].Getpassno,
        lblgetpasscodename: details.last_details_data[0].Getpassnoname,
        voucher_by: details.last_details_data[0].Buyer,
        lblvoucherByname: details.last_details_data[0].buyername,
        DO: details.last_details_data[0].Tender_DO,
        CashDiffAc: details.last_details_data[0].Buyer,
        DO: details.last_details_data[0].Tender_DO,
        itemcode: details.last_details_data[0].itemcode,
        GstRateCode: details.last_details_data[0].gstratecode,
        broker: details.last_details_data[0].Buyer,
        SalebilltoGstStateCode: details.last_details_data[0].buyergststatecode,
        SaleBillByName: details.last_details_data[0].buyeridcitystate,
        VoucherbyGstStateCode: details.last_details_data[0].shiptostatecode,
        VoucherByName: details.last_details_data[0].shiptostatename,
        MillGSTStateCode: details.last_details_data[0].millstatecode,
        MillByName: details.last_details_data[0].millStatename,
        GetPassByName: details.last_details_data[0].Getpassnonamestatename,
        GetpassGstStateCode: details.last_details_data[0].Getpassnonamestatecode,

        Gst_Rate: details.last_details_data[0].gstrate,
        AutopurchaseBill: details.last_details_data[0].AutoPurchaseBill,
        desp_type: Dispatch_type,
        gstid: details.last_details_data[0].gstid,
        mill_rate: details.last_details_data[0].MillRate || details.last_details_data[0].Mill_Rate,
        gradeCode: details.last_details_data[0].gradeCode,
        gradeid: details.last_details_data[0].gradeid,
      };

      let updatedFormData = await calculateDependentValues('quantal', qtl, { ...formData, ...newData });
      setFormData((prevState) => ({
        ...prevState,
        ...updatedFormData,
        amount: millamount,
        // sale_rate: updatedFormData.GETPASSCODE === updatedFormData.SaleBillTo ? details.last_details_data[0].Party_Bill_Rate : updatedFormData.sale_rate
      }));
      setGstRatecode(details.last_details_data[0].gstrate)
      setTenderDetails({
        ...details.last_details_data[0],
        Buyer_Party: details.last_details_data[0].Buyer,
        buyerpartyname: details.last_details_data[0].buyername,
      });
      setAutopurchase(details.last_details_data[0].AutoPurchaseBill);
      setbankcode()


      // Sync UI display state vars so all fields show correctly after PurcnoHelp selection
      // voucher_by = Buyer in regular flow
      setvoucherbycode(details.last_details_data[0].Buyer || "");
      setvoucherbycodeeacid(details.last_details_data[0].buyerid || "");
      setvoucherbycodename(details.last_details_data[0].buyername || "");
      setvoucherbystatecode(details.last_details_data[0].buyergststatecode || "");
      setvoucherbystatename(details.last_details_data[0].buyeridcitystate || "");
      // sale bill to = Buyer in regular flow
      setsalebilltocode(details.last_details_data[0].Buyer || "");
      setsalebilltocodeacid(details.last_details_data[0].buyerid || "");
      setsalebilltocodename(details.last_details_data[0].buyername || "");
      setsalebilltostatecode(details.last_details_data[0].buyergststatecode || "");
      setsalebilltostatename(details.last_details_data[0].buyeridcitystate || "");
      // getpass state
      setgetpassstatecode(details.last_details_data[0].Getpassnonamestatecode || "");
      setgetpassstatecodename(details.last_details_data[0].Getpassnonamestatename || "");

      if (details.last_details_data[0].Buyer) {
        const { balance, gstNo } = await fetchAccountBalance(details.last_details_data[0].Buyer);
        if (balance !== null) {
          setBillToBalance(balance);
          setBillToGSTNo(gstNo);
        }
      }
      else {
        setBillToBalance(0)
        setBillToGSTNo('')
      }
      if (details.last_details_data[0].Buyer) {
        const { balance, gstNo } = await fetchAccountBalance(details.last_details_data[0].Buyer);
        if (balance !== null) {
          setShipToBalance(balance);
          setShipToGSTNo(gstNo);
        }
      }
      else {
        setBillToBalance(0)
        setBillToGSTNo('')
        setShipToBalance(0)
        setShipToGSTNo('')
      }

      // setTenderno(details.last_details_data[0].Tender_No);
      return updatedFormData;

    }
  };


  const handleTenderDetailsFetched = async (details) => {
    setTenderDetails(details.last_details_data[0]);
    let Carporate_Sale_No = formData.Carporate_Sale_No;
    let assingqntl = 0;

    if (Carporate_Sale_No === 0) {
      assingqntl = Math.abs(details.last_details_data[0].BALANCE);
    } else {

      assingqntl = CarporateState.quantal;
    }
    const purcRate =
      parseFloat(details.last_details_data[0].Party_Bill_Rate) || 0;
    const exciseRate =
      parseFloat(details.last_details_data[0].Excise_Rate) || 0;
    const qtl = (assingqntl) || 0;
    const rate = qtl !== 0 ? purcRate + exciseRate : 0;
    const millamount = qtl * rate;
    setFormDataDetail((prevData) => {
      const newDetailData = {
        ...prevData,
        ddType: "T",
        Narration: "Transfer Letter",
        Amount: millamount,
        detail_Id: 1,
        id: users.length > 0 ? Math.max(...users.map((user) => user.id)) + 1 : 1,
        Bank_Code: details.last_details_data[0].Payment_To,
        bc: details.last_details_data[0].pt,
        rowaction: "add",
      };
      setUsers([newDetailData]);
      console.log('newDetailData', newDetailData)
    });

    if (Carporate_Sale_No != 0) {
      voucherTitle = CarporateState.lblvoucherByname;
      salebillTitle = CarporateState.lblsalebilltoname;
      brokerTitle = details.last_details_data[0].buyername;
      getpassTitle = CarporateState.getpassselfname;
      season = details.last_details_data[0].season

      const newData = {
        packing: details.last_details_data[0].Packing,
        bags: Math.round(parseFloat(details.last_details_data[0].Bags) || 0),
        grade: details.last_details_data[0].Grade,
        gradeName: details.last_details_data[0].Grade,
        excise_rate: details.last_details_data[0].Excise_Rate,
        // mill_rate: details.last_details_data[0].Mill_Rate,
        narration4: details.last_details_data[0].buyername,
        tenderdetailid: details.last_details_data[0].tenderdetailid,
        PurchaseRate: details.last_details_data[0].Party_Bill_Rate,
        ic: details.last_details_data[0].ic,
        CashDiffAcId: details.last_details_data[0].buyerid,
        docd: details.last_details_data[0].td,
        itemcode: details.last_details_data[0].itemcode,
        ic: details.last_details_data[0].ic,
        GstRateCode: details.last_details_data[0].gstratecode,
        Gst_Rate: details.last_details_data[0].gstrate,
        newPurcno: details.last_details_data[0].Tender_No,
        SalebilltoGstStateCode: details.last_details_data[0].acstatecode,
        SaleBillByName: details.last_details_data[0].acstatename,
        VoucherbyGstStateCode: details.last_details_data[0].unitstatecode,
        VoucherByName: details.last_details_data[0].unitstatename,
        tenderid: details.last_details_data[0].tenderid,
        mill_rate: details.last_details_data[0].MillRate || details.last_details_data[0].Mill_Rate,
        gradeCode: details.last_details_data[0].gradeCode,
        gradeid: details.last_details_data[0].gradeid,
        broker: details.last_details_data[0].Buyer,
        bk: details.last_details_data[0].buyerid,
      };


      let updatedFormData = await calculateDependentValues('quantal', qtl, { ...formData, ...newData });

      setCarporateState(newData);
      setCarporateState((prevState) => ({
        ...prevState,
        ...updatedFormData,
      }));
      setFormData((prevState) => ({
        ...prevState,
        ...updatedFormData,
        // sale_rate: updatedFormData.GETPASSCODE === updatedFormData.SaleBillTo ? details.last_details_data[0].Party_Bill_Rate : updatedFormData.sale_rate
      }));
      setChangeData(true);
    }
    if (Carporate_Sale_No === "") {
      const newData = {
        quantal: Math.abs(details.last_details_data[0].BALANCE),
        packing: details.last_details_data[0].Packing,
        bags: Math.round(parseFloat(details.last_details_data[0].Bags) || 0),
        grade: details.last_details_data[0].Grade,
        gradeName: details.last_details_data[0].Grade,
        excise_rate: details.last_details_data[0].Excise_Rate,
        // mill_rate: details.last_details_data[0].Mill_Rate,
        Tender_Commission: details.last_details_data[0].Commission_Rate,
        sale_rate: details.last_details_data[0].Sale_Rate,
        narration4: details.last_details_data[0].buyername,
        tenderdetailid: details.last_details_data[0].tenderdetailid,
        PurchaseRate: details.last_details_data[0].Party_Bill_Rate,
        Delivery_Type: details.last_details_data[0].DT || "C",
        sb: details.last_details_data[0].buyerid,
        gp: details.last_details_data[0].buyerid,
        ic: details.last_details_data[0].ic,
        bk: details.last_details_data[0].buyerid,
        vb: details.last_details_data[0].buyerid,
        st: details.last_details_data[0].buyerid,
        CashDiffAcId: details.last_details_data[0].buyerid,
        docd: details.last_details_data[0].td,
        SaleBillTo: details.last_details_data[0].Buyer,
        GETPASSCODE: details.last_details_data[0].Buyer,
        voucher_by: details.last_details_data[0].Buyer,
        lblvoucherByname: details.last_details_data[0].buyername,
        DO: details.last_details_data[0].Tender_DO,
        CashDiffAc: details.last_details_data[0].Buyer,
        DO: details.last_details_data[0].Tender_DO,
        itemcode: details.last_details_data[0].itemcode,
        GstRateCode: details.last_details_data[0].gstratecode,
        broker: details.last_details_data[0].Buyer,
        SalebilltoGstStateCode: details.last_details_data[0].Buyer,
        VoucherbyGstStateCode: details.last_details_data[0].Buyer,
        GetpassGstStateCode: details.last_details_data[0].Buyer,
        Gst_Rate: details.last_details_data[0].gstrate,
        mill_rate: details.last_details_data[0].MillRate || details.last_details_data[0].Mill_Rate,
        gradeCode: details.last_details_data[0].gradeCode,
        gradeid: details.last_details_data[0].gradeid,
      };
      let updatedFormData = await calculateDependentValues('quantal', formData.quantal, { ...formData, ...newData });
      setFormData((prevState) => ({
        ...prevState,
        ...updatedFormData,
      }));
      assingqntl = ""
      return updatedFormData;
    }
  };










  // const handleTenderDetailsFetched = async (details) => {
  //   debugger;
  //   setTenderDetails(details.last_details_data[0]);
  //   let Carporate_Sale_No = formData.Carporate_Sale_No;
  //   let assingqntl = 0;

  //   if (Carporate_Sale_No === 0) {
  //     assingqntl = Math.abs(details.last_details_data[0].BALANCE);
  //   } else {

  //     assingqntl = CarporateState.quantal;
  //   }
  //   const purcRate =
  //     parseFloat(details.last_details_data[0].Party_Bill_Rate) || 0;
  //   const exciseRate =
  //     parseFloat(details.last_details_data[0].Excise_Rate) || 0;
  //   const qtl = (assingqntl) || 0;
  //   const rate = qtl !== 0 ? purcRate + exciseRate : 0;
  //   const millamount = qtl * rate;
  //   setFormDataDetail((prevData) => {
  //     const newDetailData = {
  //       ...prevData,
  //       ddType: "T",
  //       Narration: "Transfer Letter",
  //       Amount: millamount,
  //       detail_Id: 1,
  //       id: users.length > 0 ? Math.max(...users.map((user) => user.id)) + 1 : 1,
  //       Bank_Code: details.last_details_data[0].Payment_To,
  //       bc: details.last_details_data[0].pt,
  //       rowaction: "add",
  //     };
  //     setUsers([newDetailData]);

  //   });

  //   if (Carporate_Sale_No != 0) {
  //     voucherTitle = CarporateState.voucherTitle;
  //     salebillTitle = CarporateState.lblsalebilltoname;
  //     brokerTitle = CarporateState.brokername;
  //     getpassTitle = CarporateState.lblvoucherByname;
  //     season = details.last_details_data[0].season;
  //     carporatenameTitle =  CarporateState.carporatenameTitle;
  //     CarporatestatecodeGSTStateCode = CarporateState.CarporatestatecodeGSTStateCode;
  //     setAutopurchase(details.last_details_data[0].AutoPurchaseBill);


  //     const newData = {
  //       AutopurchaseBill :details.last_details_data[0].AutoPurchaseBill,
  //       newcarporate_ac : CarporateState.newcarporate_ac,
  //       carporate_ac : CarporateState.newcarporate_ac,
  //       packing: details.last_details_data[0].Packing,
  //       bags: details.last_details_data[0].Bags,
  //       grade: details.last_details_data[0].Grade,
  //       gradeName: details.last_details_data[0].Grade,
  //       excise_rate: details.last_details_data[0].Excise_Rate,
  //       // mill_rate: details.last_details_data[0].Mill_Rate,
  //       narration4: details.last_details_data[0].buyername,
  //       tenderdetailid: details.last_details_data[0].tenderdetailid,
  //       PurchaseRate: details.last_details_data[0].Party_Bill_Rate,
  //       ic: details.last_details_data[0].ic,
  //       CashDiffAcId: details.last_details_data[0].buyerid,
  //       docd: details.last_details_data[0].td,
  //       itemcode: details.last_details_data[0].itemcode,
  //       ic: details.last_details_data[0].ic,
  //       GstRateCode: details.last_details_data[0].gstratecode,
  //       Gst_Rate: details.last_details_data[0].gstrate,
  //       gstid: details.last_details_data[0].gstid,
  //       Gst_Rate: details.last_details_data[0].gstrate,
  //       newPurcno: details.last_details_data[0].Tender_No,
  //       //SalebilltoGstStateCode: CarporateState.SalebilltoGstStateCode,
  //       SaleBillByCode :CarporateState.SalebilltoGstStateCode,
  //       SaleBillByName: CarporateState.lblBilltostatename ,

  //       //VoucherbyGstStateCode: CarporateState.VoucherbyGstStateCode,
  //       VoucherByCode :CarporateState.VoucherbyGstStateCode,
  //       //VoucherByName: CarporateState.VoucherByName,
  //       voucherbystatename :CarporateState.VoucherByName,
  //       tenderid: details.last_details_data[0].tenderid,
  //       mill_rate: details.last_details_data[0].MillRate || details.last_details_data[0].Mill_Rate,
  //       gradeCode: details.last_details_data[0].gradeCode,
  //       gradeid: details.last_details_data[0].gradeid,
  //       GetPassByName: details.last_details_data[0].Getpassnonamestatename,
  //       GetpassGstStateCode: details.last_details_data[0].Getpassnonamestatecode,

  //     };


  //     let updatedFormData = await calculateDependentValues('quantal', qtl, { ...formData, ...newData });

  //     setCarporateState(newData);
  //     setCarporateState((prevState) => ({
  //       ...prevState,
  //       ...updatedFormData,
  //     }));
  //     setFormData((prevState) => ({
  //       ...prevState,
  //       ...updatedFormData,
  //       // sale_rate: updatedFormData.GETPASSCODE === updatedFormData.SaleBillTo ? details.last_details_data[0].Party_Bill_Rate : updatedFormData.sale_rate
  //     }));
  //     setChangeData(true);


  //     updatedFormData = await calculateDependentValues('quantal', qtl, { ...formData, ...newData });
  //     setFormData((prevState) => ({
  //       ...prevState,
  //       ...updatedFormData,
  //       amount: millamount,
  //       // sale_rate: updatedFormData.GETPASSCODE === updatedFormData.SaleBillTo ? details.last_details_data[0].Party_Bill_Rate : updatedFormData.sale_rate
  //     }));
  //     setGstRatecode(details.last_details_data[0].gstrate)
  //    // setTenderDetails(details.last_details_data[0]);
  //     setbankcode()

  //     if (CarporateState.SaleBillTo) {
  //       const { balance, gstNo } = await fetchAccountBalance(CarporateState.SaleBillTo);
  //       if (balance !== null) {
  //         setBillToBalance(balance);
  //         setBillToGSTNo(gstNo);
  //       }
  //     }
  //     else {
  //       setBillToBalance(0)
  //       setBillToGSTNo('')
  //     }
  //     if (CarporateState.voucher_by) {
  //       const { balance, gstNo } = await fetchAccountBalance(CarporateState.voucher_by);
  //       if (balance !== null) {
  //         setShipToBalance(balance);
  //         setShipToGSTNo(gstNo);
  //       }
  //     }
  //     else {
  //       setShipToBalance(0)
  //       setShipToGSTNo('')
  //     }

  //     return updatedFormData;

  // }
  // };

  const AmountCalculation = async (name, input, formData) => {

    // formData = {
    //   ...formData,
    //   TCS_Rate: 0.00,
    //   Sale_TCS_Rate: 0.00,
    //   SaleTDSRate: 0.00,
    //   PurchaseTDSRate: 0.00,
    // }

    let updatedFormData = { ...formData, [name]: input };

    updatedFormData.TCS_Rate = 0.00;
    updatedFormData.Sale_TCS_Rate = 0.00;
    updatedFormData.SaleTDSRate = 0.00;
    updatedFormData.PurchaseTDSRate = 0.00;
    let Amount = 0.00;
    let Amountf = 0.00;
    let SaleBillTo = updatedFormData.SaleBillTo;
    let Amt = 0.00;
    let SBBalAmt = 0.00;
    let gstRateExise = parseFloat(updatedFormData.excise_Rate) || 0.00
    let saleRate = 0.00;
    let actualSaleRate = parseFloat(updatedFormData.sale_rate) || 0.00
    let commision = parseFloat(updatedFormData.Tender_Commission) || 0.00
    let insurance = parseFloat(updatedFormData.Insurance) || 0.00
    let qt = parseFloat(updatedFormData.quantal) || 0.00;
    let SaleTDS = 0.00
    let PurchaseTDS = 0.00;

    let PSAmt = 0.00;
    let PSBalAmt = 0.00;
    let PSRate = parseFloat(updatedFormData.PurchaseRate) || 0.00;
    let PSAmountf = 0.00;
    let PSAmount = 0.00;
    let purcno = updatedFormData.purc_no || Tenderno || newPurcno
    let TCS_Rate = 0.00
    let Sale_TCS_Rate = 0.00
    let SaleTDSRateForSB = 0.00
    let PurchaseTDSRateForPS = 0.00

    const updateApiUrl = `${API_URL}/getAmountcalculationData?CompanyCode=${companyCode}&SalebilltoAc=${SaleBillTo}&Year_Code=${Year_Code}&purcno=${purcno}`;

    const response = await axios.get(updateApiUrl);
    const details = response.data;

    PSBalAmt = PSRate * qt;
    PSAmountf = parseFloat(details['PSAmt'])
    Amountf = details['SBAmt']
    let balancelimit = parseFloat(details['Balancelimt'])
    PurchaseTDS = details['PurchaseTDSApplicable']
    SaleTDS = details['SaleTDSApplicable']
    PurchaseTDSRateForPS = isEditMode ? updatedFormData.PurchaseTDSRate : details['PurchaseTDSRate']
    let TCSRate = details['TCSRate']
    SaleTDSRateForSB = isEditMode ? updatedFormData.SaleTDSRate : details['SaleTDSRate']
    let PurchaseSubTotalAmount = details['PurchaseSubTotalAmount']

    let PurchaseTDSAmount = details["PurchaseTDSAmount"]
    let SaleTDSAmount = details['SaleTDSAmount']

    if (PSAmountf == 0) {
      PSAmountf = 0.00
    }
    PSAmount = PSAmountf + PSBalAmt;

    if (!PurchaseTDS || PurchaseTDS == null) {
      isPurchasePartyNULL = 'Y'
    }

    if (PSAmount >= balancelimit) {
      if (PurchaseTDS == "P") {
        updatedFormData.PurchaseTDSRate = PurchaseTDSRateForPS
        updatedFormData.TCS_Rate = 0.00;
      }
      if (PurchaseTDS == "N" || PurchaseTDS == "B") {
        updatedFormData.PurchaseTDSRate = "0.00";
        // txtTCSRate.Text = Session["TCSRate"].ToString();
      }
      if (PurchaseTDS == "Y" || PurchaseTDS == "T") {
        updatedFormData.PurchaseTDSRate = PurchaseTDSRateForPS
        updatedFormData.TCS_Rate = 0.00;
      }
      if (PurchaseTDS == "U") {
        Swal.fire({
          title: "Warning",
          text: `Unregistered Person,Limit Exceeded over sale Limit !`,
          icon: "warning",
          confirmButtonText: "OK"
        });
      }
      if (PurchaseTDS == "L") {
        isPurchasePartyLock = 'Y'
      }
    }
    else {
      if (PurchaseTDS == "U") {
        Swal.fire({
          title: "Warning",
          text: `Unregistered Person,Limit Exceeded over sale Limit !`,
          icon: "warning",
          confirmButtonText: "OK"
        });
        //btnSave.Enabled = false;
      }
      if (PurchaseTDS == "P") {
        updatedFormData.PurchaseTDSRate = PurchaseTDSRateForPS
        updatedFormData.TCS_Rate = 0.00;
      }
      if (PurchaseTDS == "L") {
        isPurchasePartyLock = 'N'
      }
      if (PurchaseTDS == "Y" || PurchaseTDS == "T") {
        updatedFormData.PurchaseTDSRate = 0.00
        PurchaseTDSRateForPS = 0.00
      }

    }

    if (PurchaseTDS == "X") {
      updatedFormData.PurchaseTDSRate = 0.00;
      PurchaseTDSRateForPS = 0.00
    }
    saleRate = parseFloat(updatedFormData.sale_rate) + parseFloat(updatedFormData.Tender_Commission) + parseFloat(updatedFormData.Insurance);
    SBBalAmt = (saleRate * gstRate) / 100 + saleRate * qt;
    if (Amountf == 0) {
      Amountf = 0.00
    }
    Amountf = Amountf || 0.00;
    Amountf = parseFloat(Amountf);
    Amount = Amountf + SBBalAmt;

    if (!SaleTDS || SaleTDS == null) {
      isSaleTDSPartyNULL = 'Y'
    }

    if (Amount >= balancelimit) {
      if (SaleTDS == "Y" || SaleTDS == "B" || SaleTDS == "S") {
        updatedFormData.SaleTDSRate = SaleTDSRateForSB
        updatedFormData.Sale_TCS_Rate = 0.00
      }

      if (SaleTDS == "U") {

        Swal.fire({
          title: "Warning",
          text: `Unregistered Person,Limit Exceeded over sale Limit !`,
          icon: "warning",
          confirmButtonText: "OK"
        });
      }

      if (SaleTDS == "T" || SaleTDS == "N") {
        updatedFormData.SaleTDSRate = 0.00
        updatedFormData.Sale_TCS_Rate = 0.00
        SaleTDSRateForSB = 0.0
      }
      if (SaleTDS == "L") {
        updatedFormData.SaleTDSRate = SaleTDSRateForSB
        updatedFormData.Sale_TCS_Rate = 0.00
        isSalePartyLock = 'Y'
      }
      if (SaleTDS == "X") {
        updatedFormData.SaleTDSRate = 0.00
        updatedFormData.Sale_TCS_Rate = 0.00
        SaleTDSRateForSB = 0.00
      }
    }
    else {

      if (SaleTDS == "U") {
        updatedFormData.SaleTDSRate = 0.00
        updatedFormData.Sale_TCS_Rate = 0.00
        SaleTDSRateForSB = 0.0
      }
      if (SaleTDS == "L") {
        updatedFormData.SaleTDSRate = 0.00
        updatedFormData.Sale_TCS_Rate = 0.00
        SaleTDSRateForSB = 0.00
        isSalePartyLock = 'N'
      }

      if (SaleTDS == "S") {
        updatedFormData.SaleTDSRate = SaleTDSRateForSB
        updatedFormData.Sale_TCS_Rate = 0.00
      }
      if (SaleTDS == "T" || SaleTDS == "N") {
        updatedFormData.SaleTDSRate = 0.00;
        updatedFormData.Sale_TCS_Rate = TCSRate
        SaleTDSRateForSB = 0.00
      }
      if (SaleTDS == "Y" || SaleTDS == "B") {
        updatedFormData.SaleTDSRate = 0.00
        updatedFormData.Sale_TCS_Rate = 0.00
        SaleTDSRateForSB = 0.00
      }
      if (SaleTDS == "X") {
        updatedFormData.SaleTDSRate = 0.00
        updatedFormData.Sale_TCS_Rate = 0.00
        SaleTDSRateForSB = 0.00
        SaleTDSRateForSB = 0.00
      }

    }
    if (TCSApplication == "N") {
      updatedFormData.Sale_TCS_Rate = 0.00
      updatedFormData.TCS_Rate = 0.00
    }
    return {
      updatedFormData,
      PSAmount,
      Amountf,
      balancelimit,
      PurchaseTDS,
      SaleTDS,
      TCSRate,
      PurchaseSubTotalAmount,
      PurchaseTDSAmount,
      SaleTDSAmount,
      SaleTDSRateForSB,
      PurchaseTDSRateForPS
    }
  }



  //calculating memo gstamount
  const calculatememogstrateamount = async (
    name,
    input,
    formData,
    GSTMemoGstrate,
    matchStatus
  ) => {

    let updatedFormData = { ...formData, [name]: input };
    const RCMCGSTAmt = parseFloat(updatedFormData.MM_Rate) || 0.0;
    const RCMSGSTAmt = parseFloat(updatedFormData.MM_Rate) || 0.0;
    const RCMIGSTAmt = parseFloat(updatedFormData.MM_Rate) || 0.0;
    let rate = parseFloat(GSTMemoGstrate) || 0.0;
    let cgstrate = 0.0;
    let sgstrate = 0.0;
    let igstrate = 0.0;

    if (matchStatus === "TRUE") {
      cgstrate = (rate / 2).toFixed(2);
      sgstrate = (rate / 2).toFixed(2);
      igstrate = 0.0;

      updatedFormData.RCMCGSTAmt = (
        (updatedFormData.Memo_Advance * cgstrate) /
        100
      ).toFixed(2);

      updatedFormData.RCMSGSTAmt = (
        (updatedFormData.Memo_Advance * sgstrate) /
        100
      ).toFixed(2);

      updatedFormData.RCMIGSTAmt = 0.0;
    } else {
      cgstrate = 0.0;
      sgstrate = 0.0;
      igstrate = rate.toFixed(2);

      updatedFormData.RCMIGSTAmt = (
        (updatedFormData.Memo_Advance * igstrate) /
        100
      ).toFixed(2);

      updatedFormData.RCMCGSTAmt = 0.0;
      updatedFormData.RCMSGSTAmt = 0.0;
    }

    return updatedFormData;
  };


  const CommisionBillCalculation = async (name, input, formData, gstRate) => {
    formData = {
      ...formData,
      LV_CGSTAmount: 0.00,
      LV_SGSTAmount: 0.00,
      LV_IGSTAmount: 0.00,
      LV_TotalAmount: 0.00,
      LV_TCSRate: 0.00,
      LV_NETPayble: 0.00,
      LV_TCSAmt: 0.00,
      LV_TDSRate: 0.00,
      LV_TDSAmt: 0.00,
      LV_Igstrate: 0.00,
      LV_Cgstrate: 0.00,
      LV_taxableamount: 0.00,
      LV_Sgstrate: 0.00,
      LV_Commision_Amt: 0.00,
      LV_tender_Commision_Amt: 0.00
    };
    let updatedFormData = { ...formData, [name]: input };
    let LV_tender_Commision_Amt = 0.00
    let GSTRate = gstRate
    let igstrate = 0.00;
    let sgstrate = 0.00;
    let cgstrate = 0.00;
    let DIFF_AMOUNT = parseFloat(updatedFormData.diff_amount) || 0.00;
    let MEMO_ADVANCE = parseFloat(updatedFormData.Memo_Advance) || 0.00;
    let taxableamount = parseFloat(DIFF_AMOUNT + MEMO_ADVANCE) || 0.00;
    let DiffMemo = parseFloat(DIFF_AMOUNT + MEMO_ADVANCE) || 0.00;
    let salebillto = updatedFormData.SaleBillTo;
    const matchStatus = await checkMatchStatus(salebillto, companyCode, Year_Code);
    let LV_CGSTAmount = 0.00;
    let LV_SGSTAmount = 0.00;
    let LV_IGSTAmount = 0.00;
    let LV_TotalAmount = 0.00;
    let LV_TCSRate = 0.00;
    let LV_NETPayble = 0.00;
    let LV_TCSAmt = 0.00;
    let LV_TDSRate = 0.00;
    let LV_TDSAmt = 0.00;
    if (DiffMemo != 0) {

      if (matchStatus == "TRUE") {
        sgstrate = (GSTRate / 2).toFixed(2);
        cgstrate = (GSTRate / 2).toFixed(2);
        LV_CGSTAmount = Math.round(parseFloat(((DIFF_AMOUNT + MEMO_ADVANCE) * cgstrate) / 100));
        LV_SGSTAmount = Math.round(parseFloat(((DIFF_AMOUNT + MEMO_ADVANCE) * sgstrate) / 100));
        igstrate = 0.00;
        LV_IGSTAmount = 0;
      }
      else {
        igstrate = GSTRate;
        LV_IGSTAmount = Math.round(parseFloat(((DIFF_AMOUNT + MEMO_ADVANCE) * igstrate) / 100));
        cgstrate = 0;
        sgstrate = 0;
        LV_SGSTAmount = 0.00;
        LV_CGSTAmount = 0.00;
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

    let LV_Commision_Amt = parseFloat(LV_diff_rate - LV_Tender_Commission)
    LV_tender_Commision_Amt = parseFloat(LV_tender_Commision_Amt * parseFloat(updatedFormData.quantal)) || 0.00
    LV_NETPayble = LV_NETPayble;

    updatedFormData.LV_CGSTAmount = LV_CGSTAmount
    updatedFormData.LV_SGSTAmount = LV_SGSTAmount
    updatedFormData.LV_IGSTAmount = LV_IGSTAmount
    updatedFormData.LV_TotalAmount = LV_TotalAmount
    updatedFormData.LV_TCSRate = LV_TCSRate
    updatedFormData.LV_NETPayble = LV_NETPayble
    updatedFormData.LV_TCSAmt = LV_TCSAmt
    updatedFormData.LV_TDSRate = LV_TDSRate
    updatedFormData.LV_TDSAmt = LV_TDSAmt
    updatedFormData.LV_Igstrate = igstrate
    updatedFormData.LV_Cgstrate = cgstrate
    updatedFormData.LV_Sgstrate = sgstrate
    updatedFormData.LV_taxableamount = taxableamount
    updatedFormData.LV_Commision_Amt = LV_Commision_Amt
    updatedFormData.LV_tender_Commision_Amt = LV_tender_Commision_Amt

    if (LV_NETPayble !== 0) {
      if (LV_NETPayble > 0) {
        updatedFormData.voucher_type = "LV";
      }
      else {
        updatedFormData.voucher_type = "CV";
      }
    }
    return updatedFormData;

  }

  const PurchaseBillCalculation = async (name, input, formData, gstRate, TDSTCSData) => {
    let updatedFormData = { ...formData, [name]: input };
    formData = {
      ...formData,
      PS_CGSTAmount: 0.0,
      PS_SGSTAmount: 0.0,
      PS_IGSTAmount: 0.0,
      PS_CGSTRATE: 0.0,
      PS_SGSTRATE: 0.0,
      PS_IGSTRATE: 0.0,
      TOTALPurchase_Amount: 0.0,
      PSTCS_Amt: 0.0,
      PSTDS_Amt: 0.0,
      PSNetPayble: 0.0,
      PS_SelfBal: 0.0,
      PS_amount: 0.0,
    };

    let rate = gstRate;
    let DESP_TYPE = updatedFormData.desp_type;
    let Getpasscode = updatedFormData.GETPASSCODE;
    let SELFAC = CompanyparametrselfAc;
    let autopurchasebill = Autopurchase;
    let PaymentGst = tenderDetails.Payment_To || bankcodenew;
    let Purchase_Rate = parseFloat(updatedFormData.PurchaseRate);
    let qntl = parseFloat(updatedFormData.quantal);
    let PS_amount = 0;
    let PS_CGSTAmount = 0.0;
    let PS_SGSTAmount = 0.0;
    let PS_IGSTAmount = 0.0;
    let cgstrate = 0.0;
    let sgstrate = 0.0;
    let igstrate = 0.0;
    let TOTALPurchase_Amount = 0.0;
    let TCS_Amt = 0.0;
    let TDS_Amt = 0.0;
    let NetPayble = 0.0;
    let PS_SelfBal = 0.0;
    let PSgepasscode = updatedFormData.GETPASSCODE;
    let PSsalebillto = updatedFormData.SaleBillTo;
    let PSTCS_Amt = 0.0;
    let PSTDS_Amt = 0.0;
    let PSNetPayble = 0.0;
    let PurchaseTDSrate = updatedFormData.PurchaseTDSRate;
    let PSTCS_Rate = updatedFormData.TCS_Rate || 0.00;

    if (DESP_TYPE == "DI" && (Getpasscode == SELFAC || PDSType == "P")) {
      if (autopurchasebill == "Y") {
        updatedFormData.voucher_type = "PS";

        PS_amount = Math.round(parseFloat(Purchase_Rate * qntl));

        if (PaymentGst == "" || PaymentGst == "0") {
          PaymentGst = updatedFormData.mill_code;
        }

        const matchStatus = await checkMatchStatus(
          PaymentGst,
          companyCode,
          Year_Code
        );

        if (matchStatus == "TRUE") {
          cgstrate = (rate / 2).toFixed(2);
          sgstrate = (rate / 2).toFixed(2);
          igstrate = 0.0;

          PS_CGSTAmount = Math.round(parseFloat((PS_amount * cgstrate) / 100));
          PS_SGSTAmount = Math.round(parseFloat((PS_amount * sgstrate) / 100));
          PS_IGSTAmount = 0;
        } else {
          cgstrate = 0;
          sgstrate = 0;
          igstrate = parseFloat(rate).toFixed(2);

          PS_CGSTAmount = 0;
          PS_SGSTAmount = 0;
          PS_IGSTAmount = Math.round(parseFloat((PS_amount * igstrate) / 100));
        }

        TOTALPurchase_Amount = Math.round(
          parseFloat(PS_amount + PS_CGSTAmount + PS_SGSTAmount + PS_IGSTAmount)
        );
        PSTCS_Amt = Math.round(
          (parseFloat(TOTALPurchase_Amount) * PSTCS_Rate) / 100
        );
        PSTDS_Amt = Math.round((parseFloat(PS_amount) * PurchaseTDSrate) / 100);

        // if (!isEditMode) {
        // const updateApiUrl = `${API_URL}/getAmountcalculationData?CompanyCode=${companyCode}&SalebilltoAc=${updatedFormData.SaleBillTo}&Year_Code=${Year_Code}&purcno=${updatedFormData.purc_no}`;

        // const response = await axios.get(updateApiUrl);
        const details = TDSTCSData
        let Amountf = details.PurchaseSubTotalAmount
        let balancelimit = details.balancelimit
        let SaleTDSAmount = details.PurchaseTDSAmount
        PurchaseTDSrate = updatedFormData.PurchaseTDSRate !== 0 ? updatedFormData.PurchaseTDSRate : details.PurchaseTDSRateForPS
        // PurchaseTDS = details['PurchaseTDSApplicable']
        // updatedFormData.PurchaseTDSRate = PurchaseTDSrate;
        // PSTDS_Amt = Math.round((parseFloat(PS_amount) * PurchaseTDSrate) / 100);
        let PurchaseTDSApplicable = details.PurchaseTDS
        if (PurchaseTDSApplicable === "P") {
          updatedFormData.PurchaseTDSRate = PurchaseTDSrate;
        }
        if (PurchaseTDSApplicable == "Y") {
          let balancelimtvalue = 0;
          balancelimtvalue = parseFloat(Amountf) + parseFloat(PS_amount);
          if (balancelimtvalue >= balancelimit) {
            var balance = parseFloat(balancelimtvalue) - parseFloat(balancelimit);
            if (SaleTDSAmount == 0) {
              PSTDS_Amt = parseFloat((parseFloat(balance) * PurchaseTDSrate / 100));
              if (Amountf > 0) {
                updatedFormData.PurchaseTDSRate = parseFloat((PSTDS_Amt * 100) / Amountf);
              } else {
                updatedFormData.PurchaseTDSRate = parseFloat((PSTDS_Amt * 100) / PS_amount);
              }
            }
            else {
              PSTDS_Amt = parseFloat((parseFloat(PS_amount) * PurchaseTDSrate / 100));
              updatedFormData.PurchaseTDSRate = PurchaseTDSrate;
            }
          }
          else {
            PSTDS_Amt = 0;
            updatedFormData.PurchaseTDSRate = 0;
          }
        }
        if (PurchaseTDSApplicable == "T") {
          let balancelimtvalue = 0;
          balancelimtvalue = Amountf + TOTALPurchase_Amount;
          if (balancelimtvalue >= balancelimit) {
            var balance = balancelimtvalue - balancelimit;
            if (SaleTDSAmount == 0) {
              PSTDS_Amt = parseFloat((parseFloat(balance) * PurchaseTDSrate / 100));
              updatedFormData.PurchaseTDSRate = parseFloat(PSTDS_Amt * 100 / Amountf);
            }
            else {
              PSTDS_Amt = parseFloat((parseFloat(TOTALPurchase_Amount) * PurchaseTDSrate / 100));
              updatedFormData.PurchaseTDSRate = PurchaseTDSrate;
            }
          }
        }
        // }


        PSNetPayble =
          parseFloat(TOTALPurchase_Amount) +
          parseFloat(PSTCS_Amt) -
          parseFloat(PSTDS_Amt);

        if (PSgepasscode == SELFAC && PSsalebillto == SELFAC) {
          PS_SelfBal = "Y";
        } else {
          PS_SelfBal = "N";
        }
      }
    }

    updatedFormData.PS_CGSTAmount = PS_CGSTAmount;
    updatedFormData.PS_SGSTAmount = PS_SGSTAmount;
    updatedFormData.PS_IGSTAmount = PS_IGSTAmount;
    updatedFormData.PS_CGSTRATE = cgstrate;
    updatedFormData.PS_SGSTRATE = sgstrate;
    updatedFormData.PS_IGSTRATE = igstrate;
    updatedFormData.TOTALPurchase_Amount = TOTALPurchase_Amount;
    updatedFormData.PSTCS_Amt = PSTCS_Amt;
    updatedFormData.PSTDS_Amt = Math.round(PSTDS_Amt);
    updatedFormData.PSNetPayble = PSNetPayble;
    updatedFormData.PS_SelfBal = PS_SelfBal;
    updatedFormData.PS_amount = PS_amount;
    return updatedFormData;
  };

  const saleBillCalculation = async (name, input, formData, gstRate, TDSTCSData) => {
    formData = {
      ...formData,
      cgstrate: 0,
      sgstrate: 0,
      igstrate: 0,
      cgstamt: 0,
      sgstamt: 0,
      igstamt: 0,
      SaleDetail_Rate: 0,
      SB_freight: 0,
      SB_SubTotal: 0,
      SB_Less_Frt_Rate: 0,
      TotalGstSaleBillAmount: 0,
      TaxableAmountForSB: 0,
      Roundoff: 0,
      SBTCSAmt: 0,
      Net_Payble: 0,
      SBTDSAmt: 0,
      item_Amount: 0,
      SB_Ac_Code: 0,
      SB_Unit_Code: 0,
    };

    let updatedFormData = { ...formData, [name]: input };


    let rate = parseFloat(gstRate) || 0.0;
    let cgstrate = (rate / 2).toFixed(2);
    let sgstrate = (rate / 2).toFixed(2);
    let igstrate = 0.0;

    cgstrate = (rate / 2).toFixed(2);
    sgstrate = (rate / 2).toFixed(2);
    igstrate = (rate).toFixed(2);

    let RATES = 0.0;
    let SALE_RATE = parseFloat(updatedFormData.sale_rate) || 0.0;
    let FRIEGHT_RATE = parseFloat(updatedFormData.FreightPerQtl) || 0.0;
    let TenderCommision = parseFloat(updatedFormData.Tender_Commission) || 0.0;
    let VASULI_RATE_1 = parseFloat(updatedFormData.vasuli_rate1) || 0.0;
    let VASULI_AMOUNT_1 = parseFloat(updatedFormData.vasuli_amount1) || 0.0;
    let MEMO_ADVANCE = parseFloat(updatedFormData.Memo_Advance) || 0.0;

    let MM_Rate = parseFloat(updatedFormData.MM_Rate) || 0.0;

    let insurance = parseFloat(updatedFormData.Insurance) || 0.0;
    let lessfrtwithgst =
      SALE_RATE - FRIEGHT_RATE + TenderCommision + insurance - VASULI_RATE_1;
    RATES = SALE_RATE + TenderCommision + insurance;
    let SaleForNaka = RATES - FRIEGHT_RATE + MM_Rate;
    let expbamt = 0.0;
    let BillRoundOff = 0.0;
    let TaxableAmountForSB = 0.0;
    let Delivery_Type = updatedFormData.Delivery_Type;
    let qntl = updatedFormData.quantal;
    let SB_SaleRate = 0.0;
    let Carporate_Sale_No = updatedFormData.Carporate_Sale_No;

    if (Delivery_Type == "C") {
      TaxableAmountForSB = Math.round(
        parseFloat(RATES * qntl + MEMO_ADVANCE + VASULI_AMOUNT_1)
      );
    } else {
      if (Carporate_Sale_No == "0" || Carporate_Sale_No == "") {
        if (Delivery_Type == "N") {
          SB_SaleRate = parseFloat(
            (SaleForNaka / (SaleForNaka + (SaleForNaka * rate) / 100)) *
            SaleForNaka
          );
          SB_SaleRate = Math.round((SB_SaleRate + Number.EPSILON) * 100) / 100;
          expbamt = parseFloat(SaleForNaka * qntl);
        } else if (Delivery_Type == "A") {
          SB_SaleRate = SaleForNaka;
          var frieght = VASULI_RATE_1 * qntl;
          TaxableAmountForSB = SaleForNaka * qntl + frieght;
        } else {
          SB_SaleRate = lessfrtwithgst;
        }

        if (Delivery_Type == "N") {
          TaxableAmountForSB = Math.round(
            parseFloat((SB_SaleRate + VASULI_RATE_1) * qntl)
          );
        } else if (Delivery_Type == "A") {
        } else {
          TaxableAmountForSB = Math.round(parseFloat(SB_SaleRate * qntl));
        }
      } else {
        if (Delivery_Type == "N") {
          SB_SaleRate = parseFloat(
            (SaleForNaka / (SaleForNaka + (SaleForNaka * rate) / 100)) *
            SaleForNaka
          );
          SB_SaleRate = Math.round((SB_SaleRate + Number.EPSILON) * 100) / 100;
          expbamt = parseFloat(SaleForNaka * qntl);
        } else if (Delivery_Type == "A") {
          SB_SaleRate = SaleForNaka;
          SB_SaleRate = Math.round((SB_SaleRate + Number.EPSILON) * 100) / 100;
          expbamt = parseFloat(SaleForNaka * qntl);
        } else {
          SB_SaleRate = lessfrtwithgst;
        }
        if (Delivery_Type == "A") {
          TaxableAmountForSB = Math.round(
            parseFloat(
              (SB_SaleRate - (VASULI_RATE_1 + FRIEGHT_RATE) + MM_Rate) * qntl
            )
          );
        } else {
          TaxableAmountForSB = Math.round(parseFloat(SB_SaleRate * qntl));
        }
      }
    }

    let Sb_CheckState = 0;
    if (pdspartystatecode != "0" && pdspartystatecode != "") {
      Sb_CheckState = pdspartystatecode;
    } else if (pdsBilltostatecode != "0" && pdsBilltostatecode != "") {
      Sb_CheckState = pdsBilltostatecode;
    } else {
      Sb_CheckState = updatedFormData.SaleBillTo;
    }

    const matchStatus = await checkMatchStatus(
      Sb_CheckState,
      companyCode,
      Year_Code
    );
    let SB_CGSTAmount = 0.0;
    let SB_SGSTAmount = 0.0;
    let SB_IGSTAmount = 0.0;

    if (matchStatus == "TRUE") {
      SB_CGSTAmount = parseFloat((TaxableAmountForSB * cgstrate) / 100);
      SB_CGSTAmount = Math.round((SB_CGSTAmount + Number.EPSILON) * 100) / 100;

      SB_SGSTAmount = parseFloat((TaxableAmountForSB * sgstrate) / 100);
      SB_SGSTAmount = Math.round((SB_SGSTAmount + Number.EPSILON) * 100) / 100;
      SB_IGSTAmount = 0.0;
      igstrate = 0;
    } else {
      SB_CGSTAmount = 0.0;
      cgstrate = 0;
      SB_SGSTAmount = 0.0;
      sgstrate = 0;
      SB_IGSTAmount = parseFloat((TaxableAmountForSB * igstrate) / 100);
      SB_IGSTAmount = Math.round((SB_IGSTAmount + Number.EPSILON) * 100) / 100;
    }
    let TotalGstSaleBillAmount = 0;
    let SB_Other_Amount = parseFloat(updatedFormData.SB_Other_Amount) || 0.0;
    TotalGstSaleBillAmount = parseFloat(
      TaxableAmountForSB +
      SB_CGSTAmount +
      SB_SGSTAmount +
      SB_IGSTAmount +
      SB_Other_Amount
    );

    let Roundoff = 0.0;
    let SB_SubTotal = 0.0;
    let SB_Ac_Code = 0;
    let SB_Unit_Code = 0;

    if (PDSType == "P") {
      SB_Ac_Code = PDSParty;
      SB_Unit_Code = PDSUnit;

      if (Delivery_Type == "C") {
        Roundoff = Math.round(
          parseFloat(
            TotalGstSaleBillAmount -
            (TaxableAmountForSB +
              SB_CGSTAmount +
              SB_SGSTAmount +
              SB_IGSTAmount +
              SB_Other_Amount)
          )
        );

        SB_SubTotal = Math.round(parseFloat(qntl * RATES));
      } else {
        Roundoff = Math.round(
          parseFloat(
            TotalGstSaleBillAmount -
            (TaxableAmountForSB +
              SB_CGSTAmount +
              SB_SGSTAmount +
              SB_IGSTAmount +
              SB_Other_Amount)
          )
        );

        SB_SubTotal = Math.round(parseFloat(qntl * SB_SaleRate));
      }
    } else {
      SB_Ac_Code = updatedFormData.SaleBillTo;
      SB_Unit_Code = updatedFormData.voucher_by;

      if (Delivery_Type == "C") {
        Roundoff = Math.round(
          parseFloat(
            TotalGstSaleBillAmount -
            (TaxableAmountForSB +
              SB_CGSTAmount +
              SB_SGSTAmount +
              SB_IGSTAmount)
          )
        );
        SB_SubTotal = Math.round(parseFloat(qntl * RATES));
      } else {
        Roundoff = Math.round(
          parseFloat(
            TotalGstSaleBillAmount -
            (TaxableAmountForSB +
              SB_CGSTAmount +
              SB_SGSTAmount +
              SB_IGSTAmount)
          )
        );
        SB_SubTotal = Math.round(
          parseFloat(qntl * SB_SaleRate) - (MEMO_ADVANCE + VASULI_AMOUNT_1)
        );
      }
    }
    let SB_Less_Frt_Rate = 0.0;
    let SB_freight = 0.0;
    let item_Amount = 0.0;
    let SaleDetail_Rate = 0.0;

    if (Delivery_Type == "C") {
      SB_Less_Frt_Rate = Math.round(parseFloat(MM_Rate + VASULI_RATE_1));
      SB_freight = Math.round(parseFloat(MEMO_ADVANCE + VASULI_AMOUNT_1));

      item_Amount = Math.round(parseFloat(RATES * qntl + 0));
      SaleDetail_Rate = RATES;
    } else {
      SB_Less_Frt_Rate = Math.round(parseFloat(MM_Rate + VASULI_RATE_1));
      SB_freight = Math.round(parseFloat(MEMO_ADVANCE + VASULI_AMOUNT_1));

      item_Amount = Math.round(
        parseFloat(SB_SaleRate * qntl - MEMO_ADVANCE - VASULI_AMOUNT_1 + 0)
      );
      SB_SaleRate = SB_SubTotal / qntl;

      SaleDetail_Rate = SB_SaleRate;
    }

    let TCSRate_sale = updatedFormData.Sale_TCS_Rate;
    let TCSAmt = Math.round(
      (parseFloat(TotalGstSaleBillAmount) * TCSRate_sale) / 100
    );
    let cashdiffvalue = updatedFormData.Cash_diff;
    let cashdiff = SALE_RATE - cashdiffvalue;
    let SaleTDS = updatedFormData.SaleTDSRate;
    let TDSAmt = parseFloat(cashdiff * SaleTDS);

    // if (!isEditMode) {
    // const updateApiUrl = `${API_URL}/getAmountcalculationData?CompanyCode=${companyCode}&SalebilltoAc=${updatedFormData.SaleBillTo}&Year_Code=${Year_Code}&purcno=${updatedFormData.purc_no}`;

    // const response = await axios.get(updateApiUrl);
    const details = TDSTCSData;
    let Amountf = details.Amountf
    let balancelimit = details.balancelimit
    let SaleTDSAmount = details.SaleTDSAmount
    // PurchaseTDS = details['PurchaseTDSApplicable']
    let SaleTDSApplicable = details.SaleTDS
    SaleTDS = updatedFormData.SaleTDSRate !== 0 ? updatedFormData.SaleTDSRate : details.SaleTDSRateForSB
    updatedFormData.SaleTDSRate = SaleTDS;
    TDSAmt = parseFloat((TaxableAmountForSB * SaleTDS) / 100);
    if (SaleTDSApplicable == "Y") {
      let balancelimtvalue = 0;
      balancelimtvalue = parseFloat(Amountf) + parseFloat(TaxableAmountForSB);
      if (balancelimtvalue >= balancelimit) {
        var balance = parseFloat(balancelimtvalue) - parseFloat(balancelimit);
        if (SaleTDSAmount == 0) {
          TDSAmt = parseFloat((parseFloat(balance) * SaleTDS / 100));
          if (Amountf > 0) {
            updatedFormData.SaleTDSRate = parseFloat((TDSAmt * 100) / Amountf);
          } else {
            updatedFormData.SaleTDSRate = parseFloat((TDSAmt * 100) / TaxableAmountForSB);
          }
          //updatedFormData.SaleTDSRate = parseFloat(TDSAmt * 100 / Amountf);
        }
        else {
          TDSAmt = parseFloat((parseFloat(TaxableAmountForSB) * SaleTDS / 100));
          updatedFormData.SaleTDSRate = SaleTDS
        }
      }
      else {
        TDSAmt = 0;
        updatedFormData.SaleTDSRate = 0;
      }
    }
    if (SaleTDSApplicable == "B") {
      let balancelimtvalue = 0;
      balancelimtvalue = Amountf + TotalGstSaleBillAmount;
      if (balancelimtvalue >= balancelimit) {
        var balance = balancelimtvalue - balancelimit;
        if (SaleTDSAmount == 0) {
          TDSAmt = parseFloat((parseFloat(balance) * SaleTDS / 100));
          updatedFormData.SaleTDSRate = parseFloat(TDSAmt * 100 / Amountf);
        }
        else {
          TDSAmt = parseFloat((parseFloat(TotalGstSaleBillAmount) * SaleTDS / 100));
          updatedFormData.SaleTDSRate = SaleTDS
        }
      }
    }

    let Net_Payble = Math.round(parseFloat(TotalGstSaleBillAmount) + TCSAmt);
    if (Delivery_Type == "N") {
      Roundoff = Math.round(TotalGstSaleBillAmount) - TotalGstSaleBillAmount;
    } else {
      Roundoff = Math.round(TotalGstSaleBillAmount) - TotalGstSaleBillAmount;
    }

    TotalGstSaleBillAmount = TotalGstSaleBillAmount + Roundoff;

    updatedFormData.cgstrate = cgstrate;
    updatedFormData.sgstrate = sgstrate;
    updatedFormData.igstrate = igstrate;
    updatedFormData.cgstamt = SB_CGSTAmount;
    updatedFormData.sgstamt = SB_SGSTAmount;
    updatedFormData.igstamt = SB_IGSTAmount;
    updatedFormData.SaleDetail_Rate = SaleDetail_Rate;
    updatedFormData.SB_freight = SB_freight;
    updatedFormData.SB_SubTotal = SB_SubTotal;
    updatedFormData.SB_Less_Frt_Rate = SB_Less_Frt_Rate;
    updatedFormData.TotalGstSaleBillAmount = TotalGstSaleBillAmount;
    updatedFormData.TaxableAmountForSB = TaxableAmountForSB;
    updatedFormData.Roundoff = Roundoff;
    updatedFormData.SBTCSAmt = TCSAmt;
    updatedFormData.Net_Payble = Net_Payble;
    updatedFormData.SBTDSAmt = Math.round(TDSAmt);
    updatedFormData.item_Amount = item_Amount;
    updatedFormData.SB_Ac_Code = SB_Ac_Code;
    updatedFormData.SB_Unit_Code = SB_Unit_Code;

    return updatedFormData;
  };

  const handleKeyDownCalculations = async (event) => {

    if (event.key === "Tab") {
      const { name, value } = event.target;
      const updatedFormData = await calculateDependentValues(
        name,
        value,
        formData,
        matchStatus,
        Gst_Rate
      );

      setFormData(updatedFormData);

      setFormDataDetail((prevState) => ({
        ...prevState,
        Amount: updatedFormData.Mill_AmtWO_TCS,
      }));
      setUsers((prevUsers) =>
        prevUsers.map((user) => ({
          ...user,
          Amount: updatedFormData.Mill_AmtWO_TCS,
        }))
      );
      // if (updatedFormData.SaleBillTo !== 0) {
      //   if (!isEditMode) {
      //     const TDSTCSData = await AmountCalculation(
      //       name,
      //       value,
      //       updatedFormData
      //     );
      //     setFormData(TDSTCSData);
      //   }
      // }

    }
  }

  const calculateDependentValues = async (name, input, formData) => {

    let updatedFormData = { ...formData, [name]: input };
    const updatedFormDataDetail = { ...formDataDetail, [name]: input };
    let MMRate = parseFloat(updatedFormData.MM_Rate) || 0.0;
    let millamount = parseFloat(updatedFormData.amount) || 0.0;
    const PurcTcsRate = parseFloat(updatedFormData.TCS_Rate) || 0.0;
    const PurcTdsRate = parseFloat(updatedFormData.PurchaseTDSRate) || parseFloat(updatedFormData.PurchaseTDSRateForPS) || 0.0;
    const qntl = parseFloat(updatedFormData.quantal) || 0.0;
    let millamounttcs = millamount * PurcTcsRate / 100;

    const purc_Rate = parseFloat(updatedFormData.PurchaseRate) || 0;
    let millamounttds = ((purc_Rate * qntl) * PurcTdsRate) / 100;
    const excise_Rate = parseFloat(updatedFormData.excise_rate) || 0;
    const commision = parseFloat(updatedFormData.Tender_Commission) || 0
    const salerate = parseFloat(updatedFormData.sale_rate) + commision || 0;
    const insurance = parseFloat(updatedFormData.insurance) || 0;
    const mill_rate = parseFloat(updatedFormData.mill_rate)

    const rate = qntl !== 0 ? mill_rate + excise_Rate : 0;
    millamount = qntl * rate;
    millamounttcs = millamount * PurcTcsRate / 100;
    millamounttds = ((purc_Rate * qntl) * PurcTdsRate) / 100;;
    updatedFormData.amount = millamount;
    updatedFormData.final_amout = millamount;
    // updatedFormData.Mill_AmtWO_TCS = parseFloat((millamount + millamounttcs) - millamounttds) || 0;

    // if (!isEditMode && Number(millamounttds) !== 0) {
    updatedFormData.Mill_AmtWO_TCS = parseFloat((millamount + millamounttcs) - millamounttds) || 0;

    // update first detail row's Amount only
    if (users.length > 0) {
      users[0] = {
        ...users[0],
        Amount: updatedFormData.Mill_AmtWO_TCS
      };
    }

    // } else {
    //   updatedFormData.Mill_AmtWO_TCS = parseFloat((millamount + millamounttcs) - millamounttds) || 0;
    // }


    updatedFormData.bags = Math.round((qntl / updatedFormData.packing) * 100);

    if (GSTMemoGstrate > 0) {
      const matchStatus = await checkMatchStatus(
        updatedFormData.transport,
        companyCode,
        Year_Code
      );

      if (GSTMemoGstrate != 0) {
        updatedFormData = await calculatememogstrateamount(
          name,
          input,
          updatedFormData,
          GSTMemoGstrate,
          matchStatus
        );
      }
    }
    let MemoAdvance = parseFloat(updatedFormData.Memo_Advance) || 0.0;
    updatedFormData.MM_Rate = parseFloat(MemoAdvance / qntl);

    let diffrate = 0.0;
    let diffamount = 0.0;
    diffrate = parseFloat(salerate - purc_Rate);
    diffamount = parseFloat(diffrate * qntl);
    updatedFormData.diff_rate = diffrate;
    updatedFormData.diff_amount = diffamount;

    let Frieghtrate = parseFloat(updatedFormData.FreightPerQtl) || 0.0;
    let Frieghtamt = parseFloat(updatedFormData.Freight_Amount) || 0.0;
    let vasulirate = parseFloat(updatedFormData.vasuli_rate) || 0.0;
    let vasuliamt = 0.0;
    if (qntl != 0 && Frieghtrate != 0) {
      Frieghtamt = parseFloat(qntl * Frieghtrate);
    } else {
      Frieghtamt = 0.0;
    }

    updatedFormData.Freight_Amount = Frieghtamt;

    if (qntl != 0 && vasulirate != 0) {
      vasuliamt = parseFloat(qntl * vasulirate);
    } else {
      vasuliamt = 0.0;
    }

    updatedFormData.vasuli_amount = vasuliamt;

    let vasuliamt1 = 0.0;
    let vasulirate1 = parseFloat(updatedFormData.vasuli_rate1) || 0.0;
    if (qntl != 0 && vasulirate1 != 0) {
      vasuliamt1 = parseFloat(qntl * vasulirate1);
    } else {
      vasuliamt1 = 0.0;
    }
    updatedFormData.vasuli_amount1 = vasuliamt1;

    let tdsac = updatedFormData.TDSAc
    if (tdsac != 0) {
      let tdsrate = parseFloat(updatedFormData.TDSRate) || 0.0;

      updatedFormData.TDSAmt = (tdsrate * MemoAdvance) / 100
    }

    return updatedFormData;
  };

  const fetchLastRecord = () => {
    fetch(
      `${API_URL}/getNextDocNo_DeliveryOrder?Company_Code=${companyCode}&Year_Code=${Year_Code}`
    )
      .then((response) => {

        if (!response.ok) {
          throw new Error("Failed to fetch last record");
        }
        return response.json();
      })
      .then((data) => {

        setFormData((prevState) => ({
          ...prevState,
          doc_no: data.next_doc_no,

        }));
      })
      .catch((error) => {
        console.error("Error fetching last record:", error);
      });
  };

  const handleAddOne = () => {

    setAddOneButtonEnabled(false);
    setSaveButtonEnabled(true);
    setCancelButtonEnabled(true);
    setEditButtonEnabled(false);
    setDeleteButtonEnabled(false);
    setIsEditing(true);

    setLastTenderDetails([]);
    setLastTenderData([]);
    MillByName = ""
    lblgetpassstatename = "";
    GetPassByName = "";
    lblgstratename = "";
    lblmillname = "";
    lblbrandname = "";
    lblbrokername = "Self";
    lblcashdiffacname = "";
    lblgetpasscodename = "";
    lblgetpassstatename = "";
    lblitemname = "";
    lblMemoGSTRatename = "";
    lblmillstatename = "";
    lblsalebilltoname = "";
    lbltdsacname = "";
    lbltransportname = "";
    lbltransportstatename = "";
    VoucherByName = "";
    lblvasuliacname = "";
    lblvoucherByname = "";
    lblDoname = "";
    lblBilltostatename = "";
    lblbrokername = "Self";
    newvoucher_by = "";
    newSaleBillTo = "";
    newGETPASSCODE = "";
    newCashDiffAc = "";
    newVasuli_Ac = "";
    GetpassByCode = "";
    VoucherByCode = "";
    SaleBillByName = "";
    MillByCode = "";
    newitemcode = "";
    newbrandcode = "";
    newGstRateCode = "";
    newMemoGSTRate = "";
    newCashDiffAc = "";
    newDO = "";
    newTDSAc = "";
    newbroker = "2";
    newtransport = "5005";
    newTransportGSTStateCode = "";
    newmill_code = "";
    newPurcno = "";
    lblTenderid = "";
    gradeName = "";
    newGrade = "";
    newGodownCode = '';
    lblGodownName = '';
    setFormData(initialFormData)
    setTenderDetails([])
    setChangeData(false)
    setTenderno('');
    setTenderid('');
    fetchLastRecord();
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
    setMillBalance(0)
    setShipToBalance(0)
    setBillToBalance(0)
    setShipToGSTNo('')
    setBillToGSTNo('')
    settransportcode('')
    settransportcodename('')
    setmillcode('')
    setmillcodeacid('')
    setmillcodename('')
    setmillstatecode('')
    setmillstatename('')
    setgetpasscode('');
    setgetpasscodeacid('');
    setgetpasscodename('');
    setgetpassstatecode('');
    setgetpassstatecodename('');
    setvoucherbystatecode('');
    setvoucherbystatename('');
    setvoucherbycode('');
    setvoucherbycodeeacid('');
    setvoucherbycodename('');

    setsalebilltostatecode('');
    setsalebilltostatename('');
    setsalebilltocode('');
    setsalebilltocodeacid('');
    setsalebilltocodename('');
    setbrokercode("2");
    setbrokercodeacid('');
    setbrokercodename("Self");
  };




  const handleSaveOrUpdate = async () => {


    isSalePartyLock = 'N'
    isPurchasePartyLock = 'N'
    const accountingYearData = sessionStorage.getItem('Accounting_Year');
    const formattedEntryDate = formData.doc_date;
    const isValid = validateDocumentDate(formattedEntryDate, accountingYearData);

    if (!isValid) {
      return
    }



    //     if (!isEditMode) {
    //   if (parseInt(users[0].Bank_Code) === parseInt(tenderDetails.Payment_To)) {
    //     Swal.fire("Error", "Purchase Party Differ", "error");
    //     return;
    //   }
    // } else {
    //   try {
    //     const res = await fetch(
    //       `${API_URL}/get_paymentToForTender?Company_Code=${companyCode}&Year_Code=${Year_Code}&Tender_No=${formData.purc_no}`
    //     );
    //     const data = await res.json();

    //     if (Number(users?.[0]?.Bank_Code) !== Number(data?.Payment_To)) {
    //       Swal.fire("Error", "Purchase Party Differ", "error");
    //       return;
    //     }
    //   } catch (err) {
    //     Swal.fire("Error", "Failed to validate Payment To", "error");
    //     return;
    //   }
    // }



    let desp_type = formData.desp_type;
    const { grade, quantal, packing, bags, mill_rate, sale_rate } = formData;

    let missingFields = [];
    let invalidFields = [];

    if (!formData.transport) missingFields.push("Transport Code");
    if (!formData.GETPASSCODE) missingFields.push("GET Pass Code");
    if (!formData.voucher_by) missingFields.push("Shipped TO");
    if (!formData.SaleBillTo) missingFields.push("Sale Bill To");
    if (!formData.mill_code) missingFields.push("Mill Code");
    if (String(formData.GETPASSCODE) === String(formData.SaleBillTo)) {
      if (!formData.godownCode) {
        missingFields.push("Godown Code");
      }
    }


    if (!grade || quantal <= 0 || packing <= 0 || bags <= 0 || mill_rate <= 0 || sale_rate <= 0) {
      if (!grade) invalidFields.push("Grade");
      if (quantal <= 0) invalidFields.push("Quintal");
      if (packing <= 0) invalidFields.push("Packing");
      if (bags <= 0) invalidFields.push("Bags");
      if (mill_rate <= 0) invalidFields.push("Mill Rate");
      if (sale_rate <= 0) invalidFields.push("Sale Rate");
    }

    if (missingFields.length > 0) {
      Swal.fire({
        title: "Warning",
        text: `Please select the following fields. : ${missingFields.join(", ")}`,
        icon: "warning",
        confirmButtonText: "OK"
      });
      return;
    }

    if (invalidFields.length > 0) {
      Swal.fire({
        title: "Warning",
        text: `Please select the following fields. : ${invalidFields.join(", ")}`,
        icon: "warning",
        confirmButtonText: "OK"
      });
      return;
    }


    if (formData.vasuli_rate1 != 0) {
      if (formData.Vasuli_Ac === 0) {
        Swal.fire({
          title: "Error",
          text: "Please Enter Vasuli Account Code.!",
          icon: "error",
          confirmButtonText: "OK"
        });
        return;
      }
    };



    setIsEditing(true);
    setIsLoading(true);

    let TDSTCSData = {};
    // if (!isEditMode) {
    if (formData.SaleBillTo !== 0) {
      TDSTCSData = await AmountCalculation("name", formData.quantal, formData);
    }
    // }

    let updatedFormData = await calculateDependentValues('quantal', formData.quantal, { ...formData, ...TDSTCSData });

    // const millamounttCS = parseFloat(updatedFormData.Mill_AmtWO_TCS) || 0;

    // let bankamt = 0.00;

    // bankamt = updatedFormData.Mill_AmtWO_TCS;\

    const millamounttCS = Number(updatedFormData.Mill_AmtWO_TCS) || 0;

    // Sum of Amount from users (detail rows)
    const bankamt = users.reduce((sum, u) => {
      const rowAction = String(u?.rowaction ?? "").trim().toUpperCase();
      if (rowAction === "DELETE" || rowAction === "DNU") return sum;  // skip, don't subtract
      return sum + (Number(u?.Amount) || 0);
    }, 0);




    if (isPurchasePartyLock === 'Y') {
      Swal.fire({
        title: "Error",
        text: "Purchase Party is Lock!",
        icon: "error",
        confirmButtonText: "OK"
      });
      setIsLoading(false)
      return;
    }

    if (isSalePartyLock === 'Y') {
      Swal.fire({
        title: "Error",
        text: "Sale Party is Lock!",
        icon: "error",
        confirmButtonText: "OK"
      });
      setIsLoading(false)
      return;
    }


    if (isPurchasePartyNULL === 'Y') {
      Swal.fire({
        title: "Error",
        text: "Please Select Purchase TDS Applicable For Purchase Party In Account Master!",
        icon: "error",
        confirmButtonText: "OK"
      });
      setIsLoading(false)
      return;
    }


    if (isSaleTDSPartyNULL === 'Y') {
      Swal.fire({
        title: "Error",
        text: "Please Select Sale TDS Applicable For Sale Party In Account Master!",
        icon: "error",
        confirmButtonText: "OK"
      });
      setIsLoading(false)
      return;
    }

    // if (millamounttCS.toFixed(2) !== bankamt.toFixed(2)) {
    //   if (desp_type === "DI") {
    //     Swal.fire({
    //       title: "Error",
    //       text: "Mill Amount Does Not match with detail amount!",
    //       icon: "error",
    //       confirmButtonText: "OK"
    //     });
    //     setIsLoading(false)
    //     return;
    //   }
    // }

    if (desp_type === "DI") {
      const isEqual = Math.abs(millamounttCS - bankamt) < 0.01; // ~₹0.01 tolerance
      if (!isEqual) {
        Swal.fire({
          title: "Error",
          text: "Mill Amount (TCS) does not match the total of detail amounts!",
          icon: "error",
          confirmButtonText: "OK"
        });
        setIsLoading(false);
        return;
      }
    }



    let headData = {
      ...updatedFormData,
      // updatedFormData,
      purc_no: Tenderno || newPurcno || formData.purc_no,
      purc_order: Tenderid || newpurcoder || formData.purc_order,
      narration1: desp_type === "DI" ? formData.narration1 : "Please Debit The Same Amount in our A/c",
    };


    if (desp_type === "DI") {
      headData = await PurchaseBillCalculation(
        "save",
        "ps",
        headData,
        Gst_Rate,
        TDSTCSData
      );
      headData = {
        ...headData,
        PurchaseCSGTamt: headData.PS_CGSTAmount,
        PurchaseSGSTamt: headData.PS_SGSTAmount,
        PurchaseIGSTamt: headData.PS_IGSTAmount,
        PurchaseTCSamt: headData.PSTCS_Amt,
        PurchaseTDSamt: headData.PSTDS_Amt
      }

      headData = await saleBillCalculation("save", "sale", headData, Gst_Rate, TDSTCSData);
    } else {
      headData = await CommisionBillCalculation(
        "save",
        "commi",
        headData,
        Gst_Rate
      );
    }

    if (isEditMode) {
      headData = {
        ...headData,
        Modified_By: username,
        User_Id: User_Id
      }
    }
    else {
      headData = {
        ...headData,
        Created_By: username
      }
    }

    delete headData.PSAmount
    delete headData.Amountf
    delete headData.balancelimit
    delete headData.PurchaseTDS
    delete headData.SaleTDS
    delete headData.TCSRate
    delete headData.PurchaseSubTotalAmount
    delete headData.PurchaseTDSAmount
    delete headData.SaleTDSAmount
    delete headData.updatedFormData
    delete headData.SaleTDSRateForSB
    delete headData.PurchaseTDSRateForPS
    // Remove dcid from headData if in edit mode
    if (isEditMode) {
      delete headData.doid;
      delete headData.doidnew;
      delete headData.millname;
      delete headData.brandname;
      delete headData.brokername;
      delete headData.cashdiffacname;
      delete headData.getpassname;
      delete headData.getpassstatename;
      delete headData.itemname;
      delete headData.memorategst;
      delete headData.millstatename;
      delete headData.salebillname;
      delete headData.salebilltostatename;
      delete headData.tdsacname;
      delete headData.transportname;
      delete headData.transportstatename;
      delete headData.vaoucherbystatename;
      delete headData.vasuliacname;
      delete headData.voucherbyname;
      delete headData.DOName;
      delete headData.gradeName;
    }
    else {
      delete headData.doid;
      delete headData[""]
      delete headData.gradeName;
      delete headData.name
    }
    const detailData = users.map((user) => ({
      rowaction: user.rowaction,
      dodetailid: user.dodetailid,
      Bank_Code: user.Bank_Code || tenderDetails.Payment_To,
      ddType: user.ddType,
      Narration: user.Narration,
      Amount: user.Amount,
      detail_Id: user.id,
      Company_Code: companyCode,
      Year_Code: Year_Code,
      LTNo: user.LTNo,
      bc: user.bc || tenderDetails.pt,
      UTR_NO: user.UTR_NO || "",
      UtrYearCode: user.UtrYearCode || 0,
      UtrCompanyCode: user.UtrCompanyCode || 0,
      utrdetailid: user.utrdetailid || 0,
      DO_No: formData.doc_no

    }));

    const requestData = {
      headData,
      detailData,
    };
    try {
      if (isEditMode) {
        const updateApiUrl = `${API_URL}/update-DeliveryOrder?doid=${newDcid}`;
        const response = await axios.put(updateApiUrl, requestData);
        Swal.fire({
          title: "Success!",
          text: "Record Updated Successfully!",
          icon: "success",
          confirmButtonText: "OK"
        });
        await unlockRecord();
        setTimeout(() => {
          window.location.reload();
        }, 200);
        navigate(`/delivery-order?navigatedRecord=${formData.doc_no}`);
      } else {
        const response = await axios.post(
          `${API_URL}/insert-DeliveryOrder`,
          requestData,
        );
        Swal.fire({
          title: "Success!",
          text: "Record Created Successfully!",
          icon: "success",
          confirmButtonText: "OK"
        });
        handleEdit();
        setIsEditMode(false);
        setAddOneButtonEnabled(true);
        setEditButtonEnabled(true);
        setDeleteButtonEnabled(true);
        setBackButtonEnabled(true);
        setSaveButtonEnabled(false);
        setCancelButtonEnabled(false);
        setIsEditing(true);
        await unlockRecord();
        setTimeout(() => {
          window.location.reload();
        }, 200);
        navigate(`/delivery-order?navigatedRecord=${formData.doc_no}`);
      }
      // } catch (error) {
      //   Swal.fire({
      //     title: "Error!",
      //     text: "Error occurred while saving data",
      //     icon: "error",
      //     confirmButtonText: "OK"
      //   });

      // } 


    } catch (error) {

      const backendMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Error occurred while saving data";

      const backendError =
        error?.response?.data?.error || "";

      const statusCode = error?.response?.status || "";


      if (error?.response?.status === 409) {
        const existingDocNo = error?.response?.data?.existing_doc_no || "";
        const existingPsDocNo = error?.response?.data?.existing_ps_doc_no || "";

        Swal.fire({
          title: "Duplicate Record!",
          html: `
        <p>${backendMessage}</p>
        ${existingDocNo ? `<p><b>Existing DO No:</b> ${existingDocNo}</p>` : ""}
        ${existingPsDocNo ? `<p><b>Existing PS No:</b> ${existingPsDocNo}</p>` : ""}
        <p>Please refresh the page and verify before saving again.</p>
      `,
          icon: "warning",
          confirmButtonText: "OK"
        });
        return;
      }


      if (error?.response?.status === 500) {
        Swal.fire({
          title: "Server Error!",
          html: `
        <p><b>Error:</b> ${backendError}</p>
        <p><b>Message:</b> ${backendMessage}</p>
      `,
          icon: "error",
          confirmButtonText: "OK"
        });
        return;
      }


      if (error?.response?.status === 504) {
        Swal.fire({
          title: "Gateway Timeout!",
          text: backendMessage,
          icon: "error",
          confirmButtonText: "OK"
        });
        return;
      }

      Swal.fire({
        title: `Error! ${statusCode ? `(${statusCode})` : ""}`,
        text: backendMessage,
        icon: "error",
        confirmButtonText: "OK"
      });
    }

    finally {
      await unlockRecord();
      setIsEditing(false);
      setIsLoading(false);
    }
  };

  //Handle SaveOrUpdate Records
  // const handleSaveOrUpdate = async () => {

  //   isSalePartyLock = 'N'
  //   isPurchasePartyLock = 'N'
  //   const accountingYearData = sessionStorage.getItem('Accounting_Year');
  //   const formattedEntryDate = formData.doc_date;
  //   const isValid = validateDocumentDate(formattedEntryDate, accountingYearData);

  //   if (!isValid) {
  //     return
  //   }



  //   //     if (!isEditMode) {
  //   //   if (parseInt(users[0].Bank_Code) === parseInt(tenderDetails.Payment_To)) {
  //   //     Swal.fire("Error", "Purchase Party Differ", "error");
  //   //     return;
  //   //   }
  //   // } else {
  //   //   try {
  //   //     const res = await fetch(
  //   //       `${API_URL}/get_paymentToForTender?Company_Code=${companyCode}&Year_Code=${Year_Code}&Tender_No=${formData.purc_no}`
  //   //     );
  //   //     const data = await res.json();

  //   //     if (Number(users?.[0]?.Bank_Code) !== Number(data?.Payment_To)) {
  //   //       Swal.fire("Error", "Purchase Party Differ", "error");
  //   //       return;
  //   //     }
  //   //   } catch (err) {
  //   //     Swal.fire("Error", "Failed to validate Payment To", "error");
  //   //     return;
  //   //   }
  //   // }



  //   let desp_type = formData.desp_type;
  //   const { grade, quantal, packing, bags, mill_rate, sale_rate } = formData;

  //   let missingFields = [];
  //   let invalidFields = [];

  //   if (!formData.transport) missingFields.push("Transport Code");
  //   if (!formData.GETPASSCODE) missingFields.push("GET Pass Code");
  //   if (!formData.voucher_by) missingFields.push("Shipped TO");
  //   if (!formData.SaleBillTo) missingFields.push("Sale Bill To");
  //   if (!formData.mill_code) missingFields.push("Mill Code");
  //   if (String(formData.GETPASSCODE) === String(formData.SaleBillTo)) {
  //     if (!formData.godownCode) {
  //       missingFields.push("Godown Code");
  //     }
  //   }


  //   if (!grade || quantal <= 0 || packing <= 0 || bags <= 0 || mill_rate <= 0 || sale_rate <= 0) {
  //     if (!grade) invalidFields.push("Grade");
  //     if (quantal <= 0) invalidFields.push("Quintal");
  //     if (packing <= 0) invalidFields.push("Packing");
  //     if (bags <= 0) invalidFields.push("Bags");
  //     if (mill_rate <= 0) invalidFields.push("Mill Rate");
  //     if (sale_rate <= 0) invalidFields.push("Sale Rate");
  //   }

  //   if (missingFields.length > 0) {
  //     Swal.fire({
  //       title: "Warning",
  //       text: `Please select the following fields. : ${missingFields.join(", ")}`,
  //       icon: "warning",
  //       confirmButtonText: "OK"
  //     });
  //     return;
  //   }

  //   if (invalidFields.length > 0) {
  //     Swal.fire({
  //       title: "Warning",
  //       text: `Please select the following fields. : ${invalidFields.join(", ")}`,
  //       icon: "warning",
  //       confirmButtonText: "OK"
  //     });
  //     return;
  //   }


  //   if (formData.vasuli_rate1 != 0) {
  //     if (formData.Vasuli_Ac === 0) {
  //       Swal.fire({
  //         title: "Error",
  //         text: "Please Enter Vasuli Account Code.!",
  //         icon: "error",
  //         confirmButtonText: "OK"
  //       });
  //       return;
  //     }
  //   };



  //   setIsEditing(true);
  //   setIsLoading(true);

  //   let TDSTCSData = {};
  //   // if (!isEditMode) {
  //   if (formData.SaleBillTo !== 0) {
  //     TDSTCSData = await AmountCalculation("name", formData.quantal, formData);
  //   }
  //   // }

  //   let updatedFormData = await calculateDependentValues('quantal', formData.quantal, { ...formData, ...TDSTCSData });

  //   // const millamounttCS = parseFloat(updatedFormData.Mill_AmtWO_TCS) || 0;

  //   // let bankamt = 0.00;

  //   // bankamt = updatedFormData.Mill_AmtWO_TCS;\

  //   const millamounttCS = Number(updatedFormData.Mill_AmtWO_TCS) || 0;

  //   // Sum of Amount from users (detail rows)
  //   const bankamt = users.reduce((sum, u) => {
  //     const rowAction = String(u?.rowaction ?? "").trim().toUpperCase();
  //     if (rowAction === "DELETE" || rowAction === "DNU") return sum;  // skip, don't subtract
  //     return sum + (Number(u?.Amount) || 0);
  //   }, 0);




  //   if (isPurchasePartyLock === 'Y') {
  //     Swal.fire({
  //       title: "Error",
  //       text: "Purchase Party is Lock!",
  //       icon: "error",
  //       confirmButtonText: "OK"
  //     });
  //     setIsLoading(false)
  //     return;
  //   }

  //   if (isSalePartyLock === 'Y') {
  //     Swal.fire({
  //       title: "Error",
  //       text: "Sale Party is Lock!",
  //       icon: "error",
  //       confirmButtonText: "OK"
  //     });
  //     setIsLoading(false)
  //     return;
  //   }


  //   if (isPurchasePartyNULL === 'Y') {
  //     Swal.fire({
  //       title: "Error",
  //       text: "Please Select Purchase TDS Applicable For Purchase Party In Account Master!",
  //       icon: "error",
  //       confirmButtonText: "OK"
  //     });
  //     setIsLoading(false)
  //     return;
  //   }


  //   if (isSaleTDSPartyNULL === 'Y') {
  //     Swal.fire({
  //       title: "Error",
  //       text: "Please Select Sale TDS Applicable For Sale Party In Account Master!",
  //       icon: "error",
  //       confirmButtonText: "OK"
  //     });
  //     setIsLoading(false)
  //     return;
  //   }

  //   // if (millamounttCS.toFixed(2) !== bankamt.toFixed(2)) {
  //   //   if (desp_type === "DI") {
  //   //     Swal.fire({
  //   //       title: "Error",
  //   //       text: "Mill Amount Does Not match with detail amount!",
  //   //       icon: "error",
  //   //       confirmButtonText: "OK"
  //   //     });
  //   //     setIsLoading(false)
  //   //     return;
  //   //   }
  //   // }

  //   if (desp_type === "DI") {
  //     const isEqual = Math.abs(millamounttCS - bankamt) < 0.01; // ~₹0.01 tolerance
  //     if (!isEqual) {
  //       Swal.fire({
  //         title: "Error",
  //         text: "Mill Amount (TCS) does not match the total of detail amounts!",
  //         icon: "error",
  //         confirmButtonText: "OK"
  //       });
  //       setIsLoading(false);
  //       return;
  //     }
  //   }



  //   let headData = {
  //     ...updatedFormData,
  //     // updatedFormData,
  //     purc_no: Tenderno || newPurcno || formData.purc_no,
  //     purc_order: Tenderid || newpurcoder || formData.purc_order,
  //     narration1: desp_type === "DI" ? formData.narration1 : "Please Debit The Same Amount in our A/c",
  //   };


  //   if (desp_type === "DI") {
  //     headData = await PurchaseBillCalculation(
  //       "save",
  //       "ps",
  //       headData,
  //       Gst_Rate,
  //       TDSTCSData
  //     );
  //     headData = {
  //       ...headData,
  //       PurchaseCSGTamt: headData.PS_CGSTAmount,
  //       PurchaseSGSTamt: headData.PS_SGSTAmount,
  //       PurchaseIGSTamt: headData.PS_IGSTAmount,
  //       PurchaseTCSamt: headData.PSTCS_Amt,
  //       PurchaseTDSamt: headData.PSTDS_Amt
  //     }

  //     headData = await saleBillCalculation("save", "sale", headData, Gst_Rate, TDSTCSData);
  //   } else {
  //     headData = await CommisionBillCalculation(
  //       "save",
  //       "commi",
  //       headData,
  //       Gst_Rate
  //     );
  //   }

  //   if (isEditMode) {
  //     headData = {
  //       ...headData,
  //       Modified_By: username,
  //       User_Id: User_Id
  //     }
  //   }
  //   else {
  //     headData = {
  //       ...headData,
  //       Created_By: username
  //     }
  //   }

  //   delete headData.PSAmount
  //   delete headData.Amountf
  //   delete headData.balancelimit
  //   delete headData.PurchaseTDS
  //   delete headData.SaleTDS
  //   delete headData.TCSRate
  //   delete headData.PurchaseSubTotalAmount
  //   delete headData.PurchaseTDSAmount
  //   delete headData.SaleTDSAmount
  //   delete headData.updatedFormData
  //   delete headData.SaleTDSRateForSB
  //   delete headData.PurchaseTDSRateForPS
  //   // Remove dcid from headData if in edit mode
  //   if (isEditMode) {
  //     delete headData.doid;
  //     delete headData.doidnew;
  //     delete headData.millname;
  //     delete headData.brandname;
  //     delete headData.brokername;
  //     delete headData.cashdiffacname;
  //     delete headData.getpassname;
  //     delete headData.getpassstatename;
  //     delete headData.itemname;
  //     delete headData.memorategst;
  //     delete headData.millstatename;
  //     delete headData.salebillname;
  //     delete headData.salebilltostatename;
  //     delete headData.tdsacname;
  //     delete headData.transportname;
  //     delete headData.transportstatename;
  //     delete headData.vaoucherbystatename;
  //     delete headData.vasuliacname;
  //     delete headData.voucherbyname;
  //     delete headData.DOName;
  //     delete headData.gradeName;
  //   }
  //   else {
  //     delete headData.doid;
  //     delete headData[""]
  //     delete headData.gradeName;
  //     delete headData.name
  //   }
  //   const detailData = users.map((user) => ({
  //     rowaction: user.rowaction,
  //     dodetailid: user.dodetailid,
  //     Bank_Code: user.Bank_Code || tenderDetails.Payment_To,
  //     ddType: user.ddType,
  //     Narration: user.Narration,
  //     Amount: user.Amount,
  //     detail_Id: user.id,
  //     Company_Code: companyCode,
  //     Year_Code: Year_Code,
  //     LTNo: user.LTNo,
  //     bc: user.bc || tenderDetails.pt,
  //     UTR_NO: user.UTR_NO || "",
  //     UtrYearCode: user.UtrYearCode || 0,
  //     UtrCompanyCode: user.UtrCompanyCode || 0,
  //     utrdetailid: user.utrdetailid || 0,
  //     DO_No: formData.doc_no

  //   }));

  //   const requestData = {
  //     headData,
  //     detailData,
  //   };
  //   try {
  //     if (isEditMode) {
  //       const updateApiUrl = `${API_URL}/update-DeliveryOrder?doid=${newDcid}`;
  //       const response = await axios.put(updateApiUrl, requestData);
  //       Swal.fire({
  //         title: "Success!",
  //         text: "Record Updated Successfully!",
  //         icon: "success",
  //         confirmButtonText: "OK"
  //       });
  //       await unlockRecord();
  //       setTimeout(() => {
  //         window.location.reload();
  //       }, 1000);
  //       navigate(`/delivery-order?navigatedRecord=${formData.doc_no}`);
  //     } else {
  //       const response = await axios.post(
  //         `${API_URL}/insert-DeliveryOrder`,
  //         requestData,
  //       );
  //       Swal.fire({
  //         title: "Success!",
  //         text: "Record Created Successfully!",
  //         icon: "success",
  //         confirmButtonText: "OK"
  //       });
  //       handleEdit();
  //       setIsEditMode(false);
  //       setAddOneButtonEnabled(true);
  //       setEditButtonEnabled(true);
  //       setDeleteButtonEnabled(true);
  //       setBackButtonEnabled(true);
  //       setSaveButtonEnabled(false);
  //       setCancelButtonEnabled(false);
  //       setIsEditing(true);
  //       await unlockRecord();
  //       setTimeout(() => {
  //         window.location.reload();
  //       }, 1000);
  //       navigate(`/delivery-order?navigatedRecord=${formData.doc_no}`);
  //     }
  //   } catch (error) {
  //     Swal.fire({
  //       title: "Error!",
  //       text: "Error occurred while saving data",
  //       icon: "error",
  //       confirmButtonText: "OK"
  //     });

  //   } finally {
  //     await unlockRecord();
  //     setIsEditing(false);
  //     setIsLoading(false);
  //   }
  // };

  //Record Edit Functionlity
  const handleEdit = () => {
    if (String(formData.GETPASSCODE) === String(formData.SaleBillTo)) {
      setBillToManuallySet(true)
    }
    if (formData.ackno || formData.einvoiceno) {
      Swal.fire({
        icon: "warning",
        text: "E-Invoice has already been generated for this record.",
        confirmButtonColor: "#d33",
      });
    }

    //   if (formData.RCMNumber != 0 && formData.RCMNumber != null && formData.RCMNumber !== "") {
    //   Swal.fire({
    //     icon: "error",
    //     title: "Edit Restricted",
    //     text: `This Record RCM Number (${formData.RCMNumber}) has already been generated. This record cannot be edited.`,
    //     confirmButtonColor: "#d33",
    //   });
    //   return; 
    // }

    if (formData.EWay_Bill_No) {
      Swal.fire({
        icon: "warning",
        text: "E-Waybill has already been generated for this record.",
        confirmButtonColor: "#d33",
      });

    }
    axios
      .get(`${API_URL}/DOByid`, {
        params: {
          company_code: companyCode,
          doc_no: formData.doc_no,
          Year_Code: Year_Code,
        },
      })
      .then((response) => {
        const data = response.data;
        const isLockedNew = data.last_head_data?.LockedRecord;
        const isLockedByUserNew = data.last_head_data?.LockedUser;

        if (isLockedNew) {
          Swal.fire({
            icon: "warning",
            title: "Record Locked",
            text: `This record is locked by ${isLockedByUserNew}`,
            confirmButtonColor: "#d33",
          });
          return
        }
        else {
          lockRecord();
        }

        CommonFeilds(data)
        setIsEditMode(true);
        setAddOneButtonEnabled(false);
        setSaveButtonEnabled(true);
        setCancelButtonEnabled(true);
        setEditButtonEnabled(false);
        setDeleteButtonEnabled(false);
        setBackButtonEnabled(true);
        setIsEditing(true);
      })
      .catch((error) => {
        console.error("Edit fetch error:", error);
        window.alert("This record is already deleted! Showing the previous record.");
      });
  };


  const CommonFeilds = (data) => {
    newDcid = data.last_head_data.doid;
    bankcodenew = data.last_details_data[0].bankaccode;
    lblbankname = data.last_details_data[0].bankname;
    newmill_code = data.last_details_data[0].millacode;
    lblmillname = data.last_details_data[0].millname;
    MillByCode = data.last_details_data[0].millstatecode;
    MillByName = data.last_details_data[0].millstatename;
    newGETPASSCODE = data.last_head_data.GETPASSCODE;
    lblgetpasscodename = data.last_details_data[0].getpassname;
    GetPassByName = data.last_details_data[0].getpassstatename;
    GetpassByCode = data.last_details_data[0].getpassstatecode;
    newvoucher_by = data.last_details_data[0].voucherbyaccode;
    lblvoucherByname = data.last_details_data[0].voucherbyname;
    VoucherByName = data.last_details_data[0].vaoucherbystatename;
    VoucherByCode = data.last_head_data.voucherbystatecode;
    lblgstratename = data.last_details_data[0].gstratename;
    newGstRateCode = data.last_details_data[0].gstdocno;
    newSaleBillTo = data.last_details_data[0].salebillaccode;
    lblsalebilltoname = data.last_details_data[0].salebillname;
    lblBilltostatename = data.last_details_data[0].salebilltostatename;
    SaleBillByName =
      data.last_details_data[0].salebilltostatename;
    lblcarporateacname = data.last_details_data[0].carporateacname;
    newtransport = data.last_details_data[0].transportaccode;
    lbltransportname = data.last_details_data[0].transportname;
    lbltransportstatename = data.last_details_data[0].transportstatename;
    newTransportGSTStateCode =
      data.last_details_data[0].transportstatecode;
    lblitemname = data.last_details_data[0].itemname;
    newitemcode = data.last_details_data[0].itemcode;
    lblbrandname = data.last_details_data[0].brandname;
    newbrandcode = data.last_details_data[0].brandcode;
    lblMemoGSTRatename = data.last_details_data[0].memorategst;
    newMemoGSTRate = data.last_details_data[0].MemoGSTRate;
    newVasuli_Ac = data.last_details_data[0].Vasuli_Ac;
    lblvasuliacname = data.last_details_data[0].vasuliacname;
    lblDoname = data.last_details_data[0].DOName;
    newDO = data.last_details_data[0].DOacCode;
    lbltdsacname = data.last_details_data[0].tdsacname;
    newTDSAc = data.last_details_data[0].TDSAc;
    lblbrokername = data.last_details_data[0].brokername;
    newbroker = data.last_details_data[0].broker;
    lblcashdiffacname = data.last_details_data[0].cashdiffacname;
    newCashDiffAc = data.last_details_data[0].CashDiffAc;
    lblTenderid = data.last_head_data.purc_order;
    lblGodownName = data.last_details_data[0].godownName;
    newGodownCode = data.last_details_data[0].godownCode;
    newcarporate_ac = data.last_details_data[0].carporate_ac;
    CarporatestatecodeGSTStateCode = data.last_details_data[0].carporatestatecode;
    carporatenameTitle = data.last_details_data[0].carporateacname;

    setGstRatecode(data.last_details_data[0].Gstrate);
    setAutopurchase(data.last_details_data[0].AutoPurchaseBill);
    // setPDSParty(data.last_details_data[0].voucherbyaccode);
    // setPDSUnit(data.last_details_data[0].salebillaccode)
    // setpdsBilltostatecode(data.last_details_data[0].carporatestatecode);
    // setPDSType(data.last_details_data[0].selling_type);

    setFormData((prevData) => ({
      ...prevData,
      ...data.last_head_data,
    }));
    const desp_type = data.last_head_data.desp_type;

    setLastTenderData(data.last_head_data || {});

    const millBalance = data.balance_data.millBalance;

    millBalance.forEach((item) => {
      if (item.ac_code === newmill_code) {
        setMillBalance(item.balance || 0);
      }

      if (item.ac_code === newvoucher_by) {
        setShipToBalance(item.balance || 0);
        setShipToGSTNo(item.Gst_No || "")
      }

      if (item.ac_code === newSaleBillTo) {
        setBillToBalance(item.balance || 0);
        setBillToGSTNo(item.Gst_No || "")
      }
    });


    if (desp_type === "DI") {
      setLastTenderDetails(data.last_details_data || []);
    }
    else {
      setLastTenderDetails([])

    }
  }

  //GET last record.
  const handleCancel = async () => {
    setIsEditing(false);
    setIsEditMode(false);
    setAddOneButtonEnabled(true);
    setEditButtonEnabled(true);
    setDeleteButtonEnabled(true);
    setBackButtonEnabled(true);
    setSaveButtonEnabled(false);
    setCancelButtonEnabled(false);
    setCancelButtonClicked(true);
    try {
      const response = await axios.get(
        `${API_URL}/get-lastDO-navigation?company_code=${companyCode}&Year_Code=${Year_Code}`
      );
      if (response.status === 200) {
        const data = response.data;
        CommonFeilds(data);
      } else {
        toast.error(
          "Failed to fetch last data:",
          response.status,
          response.statusText
        );
      }
      unlockRecord();
      setTenderDetails([])
    } catch (error) {
      console.log(error);
      toast.error("Error during API call:", error);
    }
  };

  //Record Delete Functionality
  const handleDelete = async () => {
    if (formData.ackno || formData.einvoiceno) {
      Swal.fire({
        icon: "warning",
        title: "Cannot Delete",
        text: "E-Invoice has already been generated for this record. Deletion is not allowed.",
        confirmButtonColor: "#d33",
      });
      return;
    }
    if (formData.EWay_Bill_No) {
      Swal.fire({
        icon: "warning",
        title: "Cannot Delete",
        text: "E-Waybill has already been generated for this record. Deletion is not allowed.",
        confirmButtonColor: "#d33",
      });
      return;
    }
    try {
      const response = await axios.get(`${API_URL}/DOByid`, {
        params: {
          company_code: companyCode,
          doc_no: formData.doc_no,
          Year_Code: Year_Code,
        },
      });

      const data = response.data;
      const isLockedNew = data.last_head_data?.LockedRecord;
      const isLockedByUserNew = data.last_head_data?.LockedUser;

      if (isLockedNew) {
        await Swal.fire({
          icon: "warning",
          title: "Record Locked",
          text: `This record is locked by ${isLockedByUserNew}`,
          confirmButtonColor: "#d33",
        });
        return;
      }


      lockRecord();
      CommonFeilds(data);

      const result = await Swal.fire({
        title: "Are you sure?",
        text: `You won't be able to revert this Doc No : ${formData.doc_no}`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        cancelButtonText: "Cancel",
        confirmButtonText: "Delete",
        reverseButtons: true,
        focusCancel: true,
      });

      if (!result.isConfirmed) {
        await Swal.fire({
          title: "Cancelled",
          text: "Your record is safe 🙂",
          icon: "info",
        });
        return;
      }

      setIsEditMode(false);
      setAddOneButtonEnabled(true);
      setEditButtonEnabled(true);
      setDeleteButtonEnabled(true);
      setBackButtonEnabled(true);
      setSaveButtonEnabled(false);
      setCancelButtonEnabled(false);
      setIsLoading(true);

      const headData = { ...formData };
      const requestData = { headData };

      const deleteResponse = await axios.delete(
        `${API_URL}/delete_data_by_doid?doid=${formData.doid}&company_code=${companyCode}&Year_Code=${formData.Year_Code}&doc_no=${formData.doc_no}&User_Id=${User_Id}`,
        { data: requestData }
      );

      if (deleteResponse.status === 200) {
        await Swal.fire({
          title: "Deleted!",
          text: "The record has been deleted successfully.",
          icon: "success",
        });
        handleCancel();
      } else {
        throw new Error("Failed to delete the record.");
      }

    } catch (error) {
      console.error("Error during API call:", error);
      Swal.fire({
        title: "Error",
        text: `There was an error during the deletion: ${error.message}`,
        icon: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/delivery-order-utility");
  };

  //Handle Record DoubleCliked in Utility Page Show that record for Edit
  const handlerecordDoubleClicked = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${API_URL}/DOByid?company_code=${companyCode}&doc_no=${selectedRecord.doc_no}&Year_Code=${Year_Code}`
      );
      const data = response.data;

      CommonFeilds(data);
      setIsEditing(false);

    } catch (error) {
      console.error("Error fetching data:", error);
    }
    finally {
      setIsLoading(false);
    }
    setIsEditMode(false);
    setAddOneButtonEnabled(true);
    setEditButtonEnabled(true);
    setDeleteButtonEnabled(true);
    setBackButtonEnabled(true);
    setSaveButtonEnabled(false);
    setCancelButtonEnabled(false);
    setUpdateButtonClicked(true);
    setIsEditing(false);
  };

  const handleNavigateRecord = async () => {
    setIsEditing(false);
    setIsEditMode(false);
    setAddOneButtonEnabled(true);
    setEditButtonEnabled(true);
    setDeleteButtonEnabled(true);
    setBackButtonEnabled(true);
    setSaveButtonEnabled(false);
    setCancelButtonEnabled(false);
    setCancelButtonClicked(true);
    try {
      const response = await axios.get(
        `${API_URL}/DOByid?company_code=${companyCode}&doc_no=${navigatedRecord}&Year_Code=${Year_Code}`
      );
      if (response.status === 200) {
        const data = response.data;

        CommonFeilds(data);
        setIsEditing(false);
      } else {
        console.error(
          "Failed to fetch last tender data:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error during API call:", error);
    }
  };

  //change No functionality to get that particular record
  const handleKeyDown = async (event) => {
    if (event.key === "Tab") {
      const changeNoValue = event.target.value;
      try {
        const response = await axios.get(
          `${API_URL}/DOByid?company_code=${companyCode}&doc_no=${changeNoValue}&Year_Code=${Year_Code}`
        );
        const data = response.data;

        CommonFeilds(data);
        setIsEditing(false);
      } catch (error) {
        Swal.fire({
          title: "Error",
          text: "Record Not Found.",
          icon: "error",
        });
      }
    }
  };

  //Navigation Buttons
  const handleFirstButtonClick = async () => {
    try {

      const response = await fetch(
        `${API_URL}/get-firstDO-navigation?company_code=${companyCode}&Year_Code=${Year_Code}`
      );
      if (response.ok) {
        const data = await response.json();

        CommonFeilds(data);

        setIsEditing(false);
      } else {
        console.error(
          "Failed to fetch first record:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error during API call:", error);
    }
  };

  const handlePreviousButtonClick = async () => {
    try {
      const response = await fetch(
        `${API_URL}/get-previousDO-navigation?currentDocNo=${formData.doc_no}&company_code=${companyCode}&Year_Code=${Year_Code}`
      );

      if (response.ok) {
        const data = await response.json();
        CommonFeilds(data);
        setIsEditing(false);
      } else {
        console.error(
          "Failed to fetch previous record:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error during API call:", error);
    }
  };

  const handleNextButtonClick = async () => {
    try {
      const response = await fetch(
        `${API_URL}/get-nextDO-navigation?currentDocNo=${formData.doc_no}&company_code=${companyCode}&Year_Code=${Year_Code}`
      );

      if (response.ok) {
        const data = await response.json();

        CommonFeilds(data);
        setIsEditing(false);
      } else {
        console.error(
          "Failed to fetch next record:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error during API call:", error);
    }
  };

  const handleLastButtonClick = async () => {
    try {
      const response = await fetch(
        `${API_URL}/get-lastDO-navigation?company_code=${companyCode}&Year_Code=${Year_Code}`
      );
      if (response.ok) {
        const data = await response.json();

        CommonFeilds(data);

        setIsEditing(false);
      } else {
        console.error(
          "Failed to fetch last record:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error during API call:", error);
    }
  };

  const handlePendingDO = () => {
    navigate("/pending-do")
  }

  const handleOpenPendingDOModal = async () => {
    pendingDOModalOpenRef.current = true;
    setShowPendingDOModal(true);
    setPendingDOLoading(true);
    try {
      const companyCode = sessionStorage.getItem("Company_Code");
      const res = await axios.get(`${API_URL}/getdata-Pending_DO`, {
        params: { company_code: companyCode }
      });
      const allDO = res.data.all_data || [];
      setPendingDOList(allDO);
    } catch (err) {
      console.error("Error fetching pending DOs:", err);
      toast.error("Failed to load pending delivery orders");
    } finally {
      setPendingDOLoading(false);
    }
  };

  const handleSelectPendingDORecord = async (record) => {
    pendingDOModalOpenRef.current = false;
    setShowPendingDOModal(false);
    fetchLastRecord();
    try {
      // Set OrderId from pending DO record so handleKeyDownPendingDO stores pendingDoid correctly
      OrderId = record.pendingDoid;
      // Fill tender fields (mill, grade, sale rate, GST, etc.) from qrytenderdobalanceview
      const dummyEvent = { target: { value: record.tenderdetailid } };
      await handleKeyDownPendingDO(dummyEvent);

      // Override bill to with pending DO's BillTo (PendingDeliveryOrder values take priority)
      if (record.BillTo_Ac_Code) {
        newSaleBillTo = record.BillTo_Ac_Code;
        lblsalebilltoname = record.BillTo_Name || "";
        setsalebilltocode(record.BillTo_Ac_Code);
        setsalebilltocodeacid(record.BillTo_Accoid || "");
        setsalebilltocodename(record.BillTo_Name || "");
        setBillToManuallySet(true);
      }
      // Override ship to with pending DO's ShipTo — when the pending record has no
      // ShipTo, leave it blank rather than falling back to tenderDetails.Buyer
      if (record.ShipTo_Ac_Code) {
        newvoucher_by = record.ShipTo_Ac_Code;
        lblvoucherByname = record.ShipTo_Name || "";
        setvoucherbycode(record.ShipTo_Ac_Code);
        setvoucherbycodeeacid(record.ShipTo_Accoid || "");
        setvoucherbycodename(record.ShipTo_Name || "");
      } else {
        newvoucher_by = "";
        lblvoucherByname = "";
        setvoucherbycode("");
        setvoucherbycodeeacid("");
        setvoucherbycodename("");
      }
      setShipToManuallySet(true);
      // Override tenderDetails — Sale Bill To, Shipped To, and Broker read from tenderDetails first.
      // When the pending DO record has no BillTo, fall back to the tender's own
      // Buyer as the broker instead of forcing "2"/"Self" or blanking it.
      newbroker = record.BillTo_Ac_Code || newbroker;
      lblbrokername = record.BillTo_Name || lblbrokername;
      brokerTitle = "";
      setbrokercode(prev => record.BillTo_Ac_Code || prev);
      setbrokercodeacid(prev => record.BillTo_Accoid || prev);
      setbrokercodename(prev => record.BillTo_Name || prev);
      setTenderDetails(prev => ({
        ...prev,
        Buyer: record.BillTo_Ac_Code,
        buyername: record.BillTo_Name,
        Buyer_Party: record.BillTo_Ac_Code ,
        buyerpartyname: record.BillTo_Name ,
      }));

      // Quantal from pending DO's Lifting_Quintal; recalculate bags; set bill to/ship to in formData
      setFormData((prev) => {
        const pendingQtl = parseFloat(record.Lifting_Quintal || 0);
        const finalQtl = pendingQtl > 0 ? pendingQtl : (prev.quantal > 0 ? prev.quantal : 0);
        const packing = parseFloat(prev.packing) || 50;
        const bags = packing > 0 ? Math.round((finalQtl / packing) * 100) : 0;
        return {
          ...prev,
          truck_no: record.TruckNo || prev.truck_no,
          driver_no: record.DriverMobileNo || prev.driver_no,
          quantal: finalQtl,
          bags: bags,
          SaleBillTo: record.BillTo_Ac_Code ,
          sb: record.BillTo_Accoid || prev.sb,
          voucher_by: record.ShipTo_Ac_Code || "",
          vb: record.ShipTo_Accoid || "",
          broker: record.BillTo_Ac_Code || prev.broker,
          bk: record.BillTo_Accoid || prev.bk,
          pendingDoid: record.pendingDoid,
          orderid: record.pendingDoid,
          ebuy_narration: record.Note || prev.ebuy_narration,
        };
      });

      // Transport: fetch from account master so name displays; user can still change it
      newtransport = "5005";
      settransportcode("5005");
      settransportcodeacid(4484);
      setFormData((prev) => ({ ...prev, transport: "5005", tc: 4484 }));
      setDefaultTransport();
    } catch (err) {
      console.error("Error loading pending DO record:", err);
      toast.error("Failed to load pending DO record");
    }
    setAddOneButtonEnabled(false);
    setSaveButtonEnabled(true);
    setCancelButtonEnabled(true);
    setEditButtonEnabled(false);
    setDeleteButtonEnabled(false);
    setIsEditing(true);
    setIsInputDisabled(true);
  };

  const handlerecordDoubleClickedPendingDO = async () => {
    fetchLastRecord();

    try {
      const response = await axios.get(
        `${API_URL}/getByPendingDOId?tenderdetailid=${selectedRecordPendingDo.tenderdetailid}`
      );
      const data = response.data;
      OrderId = data.last_head_data.orderid
      setPendingDOData(data.last_head_data)
      const dummyEvent = { target: { value: selectedRecordPendingDo.tenderdetailid } };
      await handleKeyDownPendingDO(dummyEvent);

      // After tender data loads: override with PendingDeliveryOrder values —
      // bill to, ship to, quantal (do_qntl = Lifting_Quintal), transport 5005/4484.
      const rec = selectedRecordPendingDo;

      // Bill to from pending DO
      if (rec.BillTo_Ac_Code) {
        newSaleBillTo = rec.BillTo_Ac_Code;
        lblsalebilltoname = rec.BillTo_Name || "";
        setsalebilltocode(rec.BillTo_Ac_Code);
        setsalebilltocodeacid(rec.BillTo_Accoid || "");
        setsalebilltocodename(rec.BillTo_Name || "");
        setBillToManuallySet(true);
      }
      // Ship to from pending DO
      if (rec.ShipTo_Ac_Code) {
        newvoucher_by = rec.ShipTo_Ac_Code;
        lblvoucherByname = rec.ShipTo_Name || "";
        setvoucherbycode(rec.ShipTo_Ac_Code);
        setvoucherbycodeeacid(rec.ShipTo_Accoid || "");
        setvoucherbycodename(rec.ShipTo_Name || "");
      }
      // Override tenderDetails — Sale Bill To, Shipped To, and Broker read from tenderDetails first
      newbroker = rec.BillTo_Ac_Code || "2";
      lblbrokername = rec.BillTo_Name || "Self";
      brokerTitle = "";
      setbrokercode(rec.BillTo_Ac_Code || "2");
      setbrokercodeacid(rec.BillTo_Accoid || "2");
      setbrokercodename(rec.BillTo_Name || "Self");
      setTenderDetails(prev => ({
        ...prev,
        Buyer: rec.BillTo_Ac_Code || prev.Buyer,
        buyername: rec.BillTo_Name || prev.buyername,
        Buyer_Party: rec.BillTo_Ac_Code || "2",
        buyerpartyname: rec.BillTo_Name || "Self",
      }));

      newtransport = "5005";
      settransportcode("5005");
      settransportcodeacid(4484);
      setDefaultTransport();
      setFormData((prev) => {
        const pendingQtl = parseFloat(rec.Lifting_Quintal || 0);
        const finalQtl = pendingQtl > 0 ? pendingQtl : (prev.quantal > 0 ? prev.quantal : 0);
        const packing = parseFloat(prev.packing) || 50;
        const bags = packing > 0 ? Math.round((finalQtl / packing) * 100) : 0;
        return {
          ...prev,
          transport: "5005",
          tc: 4484,
          quantal: finalQtl,
          bags: bags,
          SaleBillTo: rec.BillTo_Ac_Code || prev.SaleBillTo,
          sb: rec.BillTo_Accoid || prev.sb,
          voucher_by: rec.ShipTo_Ac_Code || prev.voucher_by,
          vb: rec.ShipTo_Accoid || prev.vb,
          broker: rec.BillTo_Ac_Code || prev.broker,
          bk: rec.BillTo_Accoid || prev.bk,
        };
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    }

    setAddOneButtonEnabled(false);
    setSaveButtonEnabled(true);
    setCancelButtonEnabled(true);
    setEditButtonEnabled(false);
    setDeleteButtonEnabled(false);
    setIsEditing(true);
    setIsInputDisabled(true);
  };

  const handleKeyDownPendingDO = async (event) => {
    const changeNoValue = event.target.value;
    try {
      const response = await axios.get(
        `${API_URL}/getTenderNo_DataByTenderdetailId?tenderdetailid=${changeNoValue}`
      );
      const data = response.data;

      let assingqntl = 0;
      let Carporate_Sale_No = formData.Carporate_Sale_No;
      let Dispatch_type = data.last_details_data[0].DT === "D" ? "DO" : "DI";

      if (Carporate_Sale_No === 0) {
        assingqntl = Math.abs(data.last_details_data[0].BALANCE);
      } else {
        assingqntl = CarporateState.quantal;
      }

      const millRate = parseFloat(data.last_details_data[0].MillRate || data.last_details_data[0].Mill_Rate) || 0;
      const rateWithGST = parseFloat((millRate * data.last_details_data[0].gstrate) / 100);
      const qtl = parseFloat(assingqntl) || 0;
      const rate = qtl !== 0 ? millRate + rateWithGST : 0;
      const millamount = qtl * rate;

      bankcodenew = data.last_details_data[0].Payment_To;
      lblbankname = data.last_details_data[0].paymenttoname;

      if (Dispatch_type === "DI") {
        const newDetailData = {
          ddType: "T",
          Narration: "Transfer Letter",
          Amount: millamount,
          detail_Id: 1,
          Bank_Code: bankcodenew,
          bc: data.last_details_data[0].pt,
          rowaction: "add",
          bankcodeacname: lblbankname
        };
        setUsers([newDetailData]);
      }

      newmill_code = data.last_details_data[0].Mill_Code;
      lblmillname = data.last_details_data[0].millname;
      newGETPASSCODE = data.last_details_data[0].Getpassno;
      lblgetpasscodename = data.last_details_data[0].Getpassnoname;

      newvoucher_by = data.last_details_data[0].ship_to_ac_code;
      lblvoucherByname = data.last_details_data[0].Ship_To_name;
      VoucherByName = data.last_details_data[0].shiptostatename;
      VoucherByCode = data.last_details_data[0].shiptostatecode;

      lblgstratename = data.last_details_data[0].gstratename;
      newGstRateCode = data.last_details_data[0].gstratecode;
      newSaleBillTo = data.last_details_data[0].bill_to_ac_code;
      lblsalebilltoname = data.last_details_data[0].Bill_TO_Name;
      lblBilltostatename = data.last_details_data[0].salebilltostatename;

      newtransport = data.last_details_data[0].transport;

      lblitemname = data.last_details_data[0].itemname;
      newitemcode = data.last_details_data[0].itemcode;
      lblDoname = data.last_details_data[0].tenderdoname;
      newDO = data.last_details_data[0].Tender_DO;

      lblbrokername = data.last_details_data[0].brokername;
      newbroker = data.last_details_data[0].Broker;
      SaleBillByName = data.last_details_data[0].buyerpartygststatecode;
      lblBilltostatename = data.last_details_data[0].buyerpartystatename;

      // Sync mill code UI state
      setmillcode(data.last_details_data[0].Mill_Code || "");
      setmillcodeacid(data.last_details_data[0].mc || "");
      setmillcodename(data.last_details_data[0].millname || "");
      setmillstatecode(data.last_details_data[0].millstatecode || "");
      setmillstatename(data.last_details_data[0].millStatename || "");
      // Sync getpass UI state
      setgetpassstatecode(data.last_details_data[0].Getpassnonamestatecode || "");
      setgetpassstatecodename(data.last_details_data[0].Getpassnonamestatename || "");
      // Sync ship_to UI state
      setvoucherbycode(data.last_details_data[0].ship_to_ac_code || "");
      setvoucherbycodeeacid(data.last_details_data[0].ship_to_accoid || "");
      setvoucherbycodename(data.last_details_data[0].Ship_To_name || "");
      setvoucherbystatecode(data.last_details_data[0].ship_to_gst_state_code || "");
      setvoucherbystatename(data.last_details_data[0].shiptostatename || "");
      setShipToGSTNo(data.last_details_data[0].ship_to_gst_no || "");
      // Sync sale bill to UI state
      setsalebilltocode(data.last_details_data[0].bill_to_ac_code || "");
      setsalebilltocodeacid(data.last_details_data[0].bill_to_accoid || "");
      setsalebilltocodename(data.last_details_data[0].Bill_TO_Name || "");
      setsalebilltostatecode(data.last_details_data[0].bill_to_gst_state_code || "");
      setsalebilltostatename(data.last_details_data[0].buyerpartystatename || "");
      setBillToGSTNo(data.last_details_data[0].bill_to_gst_no || "");
      setGstRatecode(data.last_details_data[0].gstrate);
      setTenderDetails({
        ...data.last_details_data[0],
        Buyer_Party: data.last_details_data[0].Broker || data.last_details_data[0].Buyer_Party,
        buyerpartyname: data.last_details_data[0].brokername || data.last_details_data[0].buyerpartyname,
      });
      setAutopurchase(data.last_details_data[0].AutoPurchaseBill);
      setbrokercode(data.last_details_data[0].Broker || "");
      setbrokercodeacid(data.last_details_data[0].brokerbk || data.last_details_data[0].buyerpartyid || "");
      setbrokercodename(data.last_details_data[0].brokername || "");
      setTenderno(data.last_details_data[0].Tender_No);
      setTenderid(data.last_details_data[0].ID);
      newPurcno = data.last_details_data[0].Tender_No;
      newpurcoder = data.last_details_data[0].ID;

      const newData = {
        sb: data.last_details_data[0].bill_to_accoid,
        gp: data.last_details_data[0].Getpassnoid,
        ic: data.last_details_data[0].ic,
        mc: data.last_details_data[0].mc,
        bk: data.last_details_data[0].brokerbk || data.last_details_data[0].buyerpartyid,
        vb: data.last_details_data[0].ship_to_accoid,
        st: data.last_details_data[0].buyerid,
        docd: data.last_details_data[0].td,
        CashDiffAcId: data.last_details_data[0].buyerid,
        desp_type: Dispatch_type,
        SaleBillTo: data.last_details_data[0].bill_to_ac_code,
        GETPASSCODE: data.last_details_data[0].Getpassno,
        GetpassGstStateCode: data.last_details_data[0].Getpassnonamestatecode || "",
        GetPassByName: data.last_details_data[0].Getpassnonamestatename || "",
        lblgetpasscodename: data.last_details_data[0].Getpassnoname || "",
        voucher_by: data.last_details_data[0].ship_to_ac_code,
        VoucherbyGstStateCode: data.last_details_data[0].ship_to_gst_state_code || "",
        VoucherByName: data.last_details_data[0].shiptostatename || "",
        SalebilltoGstStateCode: data.last_details_data[0].bill_to_gst_state_code || "",
        SaleBillByName: data.last_details_data[0].buyeridcitystate || "",
        DO: data.last_details_data[0].Tender_DO,
        CashDiffAc: data.last_details_data[0].Buyer,
        itemcode: data.last_details_data[0].itemcode,
        lblitemname: data.last_details_data[0].itemname,
        GstRateCode: data.last_details_data[0].gstratecode,
        gstid: data.last_details_data[0].gstid,
        Gst_Rate: data.last_details_data[0].gstrate,
        broker: data.last_details_data[0].Broker || data.last_details_data[0].Buyer_Party,
        newbroker: data.last_details_data[0].Broker,
        lblbrokername: data.last_details_data[0].brokername,
        mill_rate: data.last_details_data[0].MillRate || data.last_details_data[0].Mill_Rate,
        MillGSTStateCode: data.last_details_data[0].millstatecode || "",
        MillByName: data.last_details_data[0].millStatename || "",
        sale_rate: data.last_details_data[0].Sale_Rate,
        grade: data.last_details_data[0].Grade,
        gradeName: data.last_details_data[0].Grade,
        gradeCode: data.last_details_data[0].gradeCode,
        gradeid: data.last_details_data[0].gradeid,
        PurchaseRate: data.last_details_data[0].Party_Bill_Rate || data.last_details_data[0].MillRate,
        narration4: data.last_details_data[0].buyername,
        Delivery_Type: data.last_details_data[0].DT || "C",
        purc_no: data.last_details_data[0].Tender_No,
        purc_order: data.last_details_data[0].ID,
        packing: data.last_details_data[0].Packing,
        bags: Math.round(parseFloat(data.last_details_data[0].Bags) || 0),
        excise_rate: rateWithGST,
        Tender_Commission: data.last_details_data[0].CR,
        truck_no: data.last_details_data[0].truck_no,
        tenderdetailid: data.last_details_data[0].tenderdetailid,
        tenderid: data.last_details_data[0].tenderid,
        quantal: qtl,
        mill_code: data.last_details_data[0].Mill_Code,
        AutopurchaseBill: data.last_details_data[0].AutoPurchaseBill,
        orderid: OrderId,
        pendingDoid: OrderId
      };

      let updatedFormData = await calculateDependentValues('quantal', qtl, { ...formData, ...newData });
      setFormData((prevState) => ({
        ...prevState,
        ...updatedFormData,
        amount: millamount,
      }));
      setIsEditing(false);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };


  //--------------------------------------- Delivery Order Detail Section ------------
  const handleChangeDetail = (event) => {
    const { name, value } = event.target;
    let updatedFormDataDetail = { ...formDataDetail, [name]: value };
    setFormDataDetail(updatedFormDataDetail);
  };

  //Handle Delete Functionality
  const deleteModeHandler = async (userToDelete) => {
    let updatedUsers;
    if (isEditMode && userToDelete.rowaction === "add") {
      updatedUsers = users.map((u) =>
        u.id === userToDelete.id ? { ...u, rowaction: "DNU" } : u
      );
    } else if (isEditMode) {
      updatedUsers = users.map((u) =>
        u.id === userToDelete.id ? { ...u, rowaction: "delete" } : u
      );
    } else {
      updatedUsers = users.map((u) =>
        u.id === userToDelete.id ? { ...u, rowaction: "DNU" } : u
      );
    }
    setFormDataDetail({
      ...formDataDetail,
      ...updatedUsers.find((u) => u.id === u.id),
    });
    setUsers(updatedUsers);
    setDeleteMode(true);
    setSelectedUser(userToDelete);
  };

  // Use this for remaining/prefill/validation (ignore DNU/DELETE)
  const getActiveUsersTotal = (users = []) =>
    users.reduce((sum, u) => {
      const action = String(u?.rowaction ?? "").toUpperCase();
      if (action === "DELETE" || action === "DNU") return sum; // ignore
      return sum + (Number(u?.Amount) || 0);
    }, 0);


  // const openPopup = (mode) => {
  //   setShowPopup(true);
  //   if (mode === "add") {
  //     clearForm();
  //   }
  // };

  const openPopup = (mode) => {
    setShowPopup(true);

    if (mode === "add") {
      clearForm();

      const millAmt = Number(formData?.Mill_AmtWO_TCS) || 0;
      const currentTotal = getActiveUsersTotal(users); // <- changed
      const remaining = Math.max(0, Number((millAmt - currentTotal).toFixed(2)));

      setFormDataDetail(prev => ({
        ...prev,
        ddType: prev?.ddType || "T",
        Amount: remaining,
        Narration: "",
        UTR_NO: "",
        LTNo: 0,
      }));
    }
  };


  const openDelete = async (user) => {
    setDeleteMode(true);
    setSelectedUser(user);
    let updatedUsers;
    if (isEditMode && user.rowaction === "delete") {
      updatedUsers = users.map((u) =>
        u.id === user.id ? { ...u, rowaction: "Normal" } : u
      );
    } else {
      updatedUsers = users.map((u) =>
        u.id === user.id ? { ...u, rowaction: "add" } : u
      );
    }
    setUsers(updatedUsers);
    setSelectedUser({});
  };

  // const openDelete = async (user) => { };
  const closePopup = () => {
    setShowPopup(false);
    setSelectedUser({});
    clearForm();
  };

  useEffect(() => {
    if (selectedRecord) {
      setUsers(
        lastTenderDetails.map((detail) => ({
          ddType: detail.ddType,
          Bank_Code: detail.bankcode || bankcodenew,
          bankcodeacname: detail.bankcodeacname,
          Narration: detail.Narration,
          Amount: detail.Amount,
          UTR_NO: detail.UTR_NO,
          LTNo: detail.LTNo,
          bc: detail.bc,
          dodetailid: detail.dodetailid,
          detail_Id: detail.detail_Id,
          id: detail.detail_Id,
          rowaction: "Normal",
        }))
      );
    }
  }, [selectedRecord, lastTenderDetails]);

  useEffect(() => {
    const updatedUsers = lastTenderDetails.map((detail) => ({
      ddType: detail.ddType,
      Bank_Code: detail.Bank_Code || bankcodenew,
      bankcodeacname: detail.bankname,
      Narration: detail.Narration,
      Amount: detail.Amount,
      UTR_NO: detail.UTR_NO,
      LTNo: detail.LTNo,
      bc: detail.bc,
      dodetailid: detail.dodetailid,
      detail_Id: detail.detail_Id,
      id: detail.detail_Id,
      rowaction: "Normal",
    }));
    setUsers(updatedUsers);
  }, [lastTenderDetails]);


  const clearForm = () => {
    setFormDataDetail({
      Narration: "Transfer Letter",
      Amount: 0.0,
      UTR_NO: 0,
      UTR_NO: 0,
    });
    setbankcode("");
    setbankcodeacname("");
    setbankcodeacid("");
  };

  //Update Record on detail section
  const updateUser = async () => {
    const millAmt = Number(formData?.Mill_AmtWO_TCS) || 0;
    const updatedUsers = users.map((user) => {
      if (user.id === selectedUser.id) {
        const updatedRowaction =
          user.rowaction === "Normal" ? "update" : user.rowaction;
        return {
          ...user,
          Bank_Code: bankcode,
          bc: bankcodeacoid,
          bankcodeacname: bankcodeacname,
          UTR_NO: users.UTR_NO,
          LTNo: users.LTNo,
          ...formDataDetail,
          amount: formData.mill_amountTCS1,
          rowaction: updatedRowaction,
        };
      } else {
        return user;
      }
    });
    const totalAmt = updatedUsers.reduce(
      (sum, u) => sum + (Number(u?.Amount) || 0),
      0
    );

    if (totalAmt > millAmt) {
      Swal.fire({
        title: "Error",
        text: `Sum of detail amounts (${totalAmt.toFixed(2)}) must equal Mill Amount With TCS (${millAmt.toFixed(2)})!`,
        icon: "error",
        confirmButtonText: "OK",
      });
      return;
    }
    setFormDataDetail({
      ...updatedUsers,
    });
    setUsers(updatedUsers);
    closePopup();
  };

  //Record Add Functionality
  const addUser = async () => {
    const millAmt = Number(formData?.Mill_AmtWO_TCS) || 0;
    const newUser = {

      id: users.length > 0 ? Math.max(...users.map((user) => user.id)) + 1 : 1,
      Bank_Code: bankcode,
      bankcodeacname: bankcodeacname,
      bc: bankcodeacoid,
      ddType: formDataDetail.ddType || "T",
      ...formDataDetail,
      rowaction: "add",
    };

    const totalAmt = [...users, newUser].reduce(
      (sum, u) => sum + (Number(u?.Amount) || 0),
      0
    );

    if (totalAmt > millAmt) {
      Swal.fire({
        title: "Error",
        text: `Sum of detail amounts (${totalAmt.toFixed(2)}) must equal Mill Amount With TCS (${millAmt.toFixed(2)})!`,
        icon: "error",
        confirmButtonText: "OK",
      });
      return;
    }
    setFormDataDetail({
      ...newUser,
    });
    setUsers([...users, newUser]);
    closePopup();
  };

  //Record Edit Functionality
  const editUser = (user) => {
    setSelectedUser(user);
    setbankcode(user.Bank_Code);
    setbankcodeacname(user.bankcodeacname);
    setbankcodeacid(user.bc);
    setUTRNo(user.UTR_NO);
    setUTRCompanyCode(user.utrCompanyCode);
    setUTRYearCode(user.utrYearCode)

    setFormDataDetail({
      ddType: user.ddType || "",
      Narration: user.Narration || "",
      Amount: user.Amount || "",
      UTR_NO: user.UTR_NO || "",
      UtrYearCode: user.UtrYearCode || 0,
      UtrCompanyCode: user.UtrCompanyCode || 0,
      utrdetailid: user.utrdetailid || 0,
      DO_No: user.DO_No || formData.doc_no,
      LTNo: user.LTNo || 0
    });
    openPopup("edit");
  };

  function handleSubmit(event) {
    event.preventDefault();

  }

  const validateNumericInput = (e) => {
    e.target.value = e.target.value.replace(/[^0-9.-]/g, '');
  };


  //EwayBillEInvoice Genration
  const handleGenerateEInvoice = () => {
    setIsOpenEInvoice(true);
  };

  const handleCloseEInvoice = () => {
    setIsOpenEInvoice(false);
  };

  const handleGenerateEwayBill = () => {
    setIsOpenEwayBill(true);
  };

  const handleCloseEwayBill = () => {
    setIsOpenEwayBill(false);
  };

  const handleGenerateEInvoiceEwaybill = () => {
    setIsOpenEInvoiceEwaybill(true);
  };

  const handleCloseEInvoiceEwaybill = () => {
    setIsOpenEInvoiceEwaybill(false);
  };

  const handleRowClick = (doc_no, tran_type) => {

    if (tran_type === "SB") {
      const url = `${window.location.origin}/sale-bill`;
      const params = new URLSearchParams({
        navigatedRecord: doc_no,
      });
      window.open(`${url}?${params.toString()}`, "_blank");
    }
    if (tran_type === "PS") {
      const url = `${window.location.origin}/sugarpurchasebill`;
      const params = new URLSearchParams({
        navigatedRecord: doc_no,
      });
      window.open(`${url}?${params.toString()}`, "_blank");
    }

    if (
      tran_type === "LV" ||
      tran_type === "CV"
    ) {
      const url = `${window.location.origin}/commission-bill`;
      const params = new URLSearchParams({
        selectedVoucherNo: doc_no,
        selectedVoucherType: tran_type,
      });
      window.open(`${url}?${params.toString()}`, "_blank");
    }
  }

  const isSBGenerated = formData.SB_No !== "" && formData.SB_No !== 0;
  const isEwayGenerated = formData.EWay_Bill_No !== "";
  const isEInvoiceGenerated = formData.einvoiceno !== "";
  const isEditingOrNoSB = isEditing || !isSBGenerated;

  const isBothNotGenerated = isSBGenerated && !isEwayGenerated && !isEInvoiceGenerated;


  const handleRecordUnlocked = async () => {
    try {
      const response = await fetch(`${API_URL}/unlock-delivery-order?doc_no=${formData.doc_no}&year_code=${formData.Year_Code}&company_code=${formData.company_code}`, {
        method: 'PUT',
      });

      const data = await response.json();

      if (response.ok) {
        alert('Record unlocked successfully');
      } else {
        alert(data.error || 'Error unlocking record');
      }
    } catch (error) {
      alert('Error unlocking record');
      console.error(error);
    }
  };


  return (
    <>
      <div className="mobile-hidden">
        <UserAuditInfo
          createdBy={formData.Created_By}
          modifiedBy={formData.Modified_By}
          title={"Delivery Order"}
        />
      </div>

      <div className="do-action-group">
        <ToastContainer autoClose={500} />

        <ActionButtonGroup
          handleAddOne={handleAddOne}
          addOneButtonEnabled={addOneButtonEnabled}
          handleSaveOrUpdate={handleSaveOrUpdate}
          saveButtonEnabled={saveButtonEnabled}
          isEditMode={isEditMode}
          handleEdit={handleEdit}
          editButtonEnabled={editButtonEnabled}
          handleDelete={handleDelete}
          deleteButtonEnabled={deleteButtonEnabled}
          handleCancel={handleCancel}
          cancelButtonEnabled={cancelButtonEnabled}
          handleBack={handleBack}
          backButtonEnabled={backButtonEnabled}
          permissions={permissions}
          isDeleted={formData.tenderdetailid === null}
          component={


            <div className="flex flex-wrap items-center gap-2.5">
              {/* ── Unlock Record ── */}
              <button
                onClick={() => handleRecordUnlocked()}
                className="group inline-flex items-center gap-1.5 rounded-lg
               bg-gradient-to-br from-green-600 to-green-700
               px-3 py-1.5 md:px-4 md:py-2
               text-[10px] md:text-[13px] font-semibold tracking-wide text-white
               shadow-md shadow-green-600/30
               transition-all duration-200 ease-out
               hover:from-green-700 hover:to-green-800
               hover:shadow-lg hover:shadow-green-600/40 hover:-translate-y-0.5
               active:translate-y-0 active:shadow-sm
               focus:outline-none focus:ring-2 focus:ring-green-400/50"
              >
                <LockOpenIcon className="text-sm md:text-base transition-transform duration-200 group-hover:rotate-12" />
                <span className="whitespace-nowrap">Unlock Record</span>
              </button>

              {/* ── ebuy Pending DO ── */}
              <div className="relative inline-flex">
                <button
                  onClick={handleOpenPendingDOModal}
                  disabled={!saveButtonEnabled || isEditMode}
                  className="group inline-flex items-center gap-2 rounded-lg
                 bg-gradient-to-br from-amber-500 to-amber-600
                 px-3 py-1.5 md:px-4 md:py-2
                 text-[10px] md:text-[13px] font-semibold tracking-wide text-white
                 shadow-md shadow-amber-500/30
                 transition-all duration-200 ease-out
                 hover:from-amber-600 hover:to-amber-700
                 hover:shadow-lg hover:shadow-amber-500/40 hover:-translate-y-0.5
                 active:translate-y-0 active:shadow-sm
                 focus:outline-none focus:ring-2 focus:ring-amber-400/50
                 disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none
                 disabled:translate-y-0 disabled:shadow-md"
                >
                  <img
                    src={eBuySugarLogo}
                    alt="eBuySugar"
                    className="h-4 w-4 md:h-5 md:w-5 rounded-full bg-white object-contain p-px
                   ring-1 ring-white/60 shadow-sm
                   transition-transform duration-200 group-hover:scale-110"
                  />
                  <span className="whitespace-nowrap">ebuy Pending DO</span>
                </button>

                {pendingDOCount > 0 && (
                  <span
                    className="absolute -top-2 -right-2 flex h-[18px] min-w-[18px]
                   items-center justify-center rounded-full border-2 border-white
                   bg-red-500 px-1 text-[10px] font-bold leading-none text-white
                   shadow-sm
                   animate-[badgePulse_2s_ease-in-out_infinite]"
                  >
                    {pendingDOCount > 99 ? "99+" : pendingDOCount}
                  </span>
                )}
              </div>

              <style>{`
    @keyframes badgePulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.5); }
      50% { box-shadow: 0 0 0 4px rgba(239,68,68,0); }
    }
  `}</style>
            </div>


          }
        />
      </div>

      <div className="mobile-hidden">
        <NavigationButtons
          handleFirstButtonClick={handleFirstButtonClick}
          handlePreviousButtonClick={handlePreviousButtonClick}
          handleNextButtonClick={handleNextButtonClick}
          handleLastButtonClick={handleLastButtonClick}
          highlightedButton={highlightedButton}
          isEditing={isEditing}
        />
      </div>

      <div>
        <form onSubmit={handleSubmit}>
          <Card>
            <CardContent>
              <Grid container spacing={1}>
                <Grid item xs={0.8} className="mobile-hidden">
                  <TextField
                    fullWidth
                    label="Change No"
                    variant="outlined"
                    id="changeNo"
                    name="changeNo"
                    onKeyDown={handleKeyDown}
                    disabled={!addOneButtonEnabled}
                    size="small"
                    InputLabelProps={{
                      shrink: true,
                      style: { fontSize: "16px", fontWeight: "bold" },
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        height: "30px",
                        padding: "0px 10px",
                      },
                    }}
                  />
                </Grid>
                {/* <Grid item xs={1}>
                  <TextField
                    fullWidth
                    label="Tender Detail ID"
                    variant="outlined"
                    id="tenderdetailid"
                    name="tenderdetailid"
                    value={formData.tenderdetailid}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    size="small"
                    style={{ fontSize: '16px' }}
                    InputLabelProps={{
                      shrink: true,
                      style: { fontSize: '16px', fontWeight: 'bold' },
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        height: '30px',
                        padding: '0px 10px',
                      },
                    }}
                  />
                </Grid> */}
                <Grid item xs={1} className="mobile-hidden">
                  <TextField
                    fullWidth
                    label="Date"
                    type="date"
                    variant="outlined"
                    id="newsbdate"
                    name="newsbdate"
                    value={formData.newsbdate}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    size="small"
                    InputLabelProps={{
                      style: { fontSize: "12px", fontWeight: "bold" },
                      shrink: true,
                    }}
                    InputProps={{
                      style: { fontSize: "12px", height: "30px" },
                    }}
                  />
                </Grid>
                <Grid item xs={2} className="mobile-hidden">
                  <TextField
                    fullWidth
                    label="E-Invoice No"
                    variant="outlined"
                    id="einvoiceno"
                    name="einvoiceno"
                    autoComplete="off"
                    value={formData.einvoiceno}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    size="small"
                    style={{ fontSize: "16px" }}
                    InputLabelProps={{
                      shrink: true,
                      style: { fontSize: "16px", fontWeight: "bold" },
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        height: "30px",
                        padding: "0px 10px",
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={2} className="mobile-hidden">
                  <TextField
                    fullWidth
                    label="Ack No"
                    variant="outlined"
                    id="ackno"
                    name="ackno"
                    autoComplete="off"
                    value={formData.ackno}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    size="small"
                    style={{ fontSize: "16px" }}
                    InputLabelProps={{
                      shrink: true,
                      style: { fontSize: "16px", fontWeight: "bold" },
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        height: "30px",
                        padding: "0px 10px",
                      },
                    }}
                  />
                </Grid>
              </Grid>

              <Grid
                container
                spacing={1}
                mt={0.2}
                alignItems="center"
                direction="row"

              >
                <Grid item xs={1}>
                  <Box display="flex" alignItems="center">
                    <TextField
                      fullWidth
                      label="Entry No"
                      variant="outlined"
                      autoComplete="off"
                      id="doc_no"
                      name="doc_no"
                      size="small"
                      value={formData.doc_no}
                      // onChange={handleChange}
                      disabled
                      InputLabelProps={{
                        shrink: true,
                        style: { fontSize: "16px", fontWeight: "bold" },
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          height: "30px",
                          padding: "0px 10px",
                          fontSize: "16px",
                          fontWeight: "bold",
                          color: "black",
                          backgroundColor: "white",
                          opacity: 1,
                          "& .Mui-disabled": {
                            color: "black",
                            WebkitTextFillColor: "black",
                            opacity: 1,
                          },
                        },
                      }}
                    />

                    {formData.tenderdetailid === null && (
                      <Typography
                        variant="body2"
                        sx={{
                          color: "red",
                          fontWeight: "bold",
                          marginLeft: 1,
                          whiteSpace: "nowrap",
                        }}
                      >
                        Delete
                      </Typography>
                    )}
                  </Box>
                </Grid>

                <Grid item xs={1}>
                  <TextField
                    fullWidth
                    inputRef={inputRef}
                    label="Date"
                    type="date"
                    variant="outlined"
                    autoComplete="off"
                    id="doc_date"
                    name="doc_date"
                    size="small"
                    value={formData.doc_date}
                    onChange={handleChange}
                    style={{ fontSize: "16px" }}
                    InputLabelProps={{
                      style: { fontSize: "12px" },
                      shrink: true,
                    }}
                    InputProps={{
                      style: {
                        fontSize: "12px",
                        height: "30px",
                        fontWeight: "bold",
                      },
                    }}
                    disabled={!isEditing && addOneButtonEnabled}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        height: "30px",
                        padding: "0px 10px",
                        fontSize: "16px",
                        fontWeight: "bold",
                        color: "black",
                        backgroundColor: "white",
                        opacity: 1,
                        "& .Mui-disabled": {
                          color: "black",
                          WebkitTextFillColor: "black",
                          opacity: 1,
                        },
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={1} className="mobile-hidden">
                  <TextField
                    fullWidth
                    label="DO Date"
                    type="date"
                    variant="outlined"
                    id="Do_DATE"
                    name="Do_DATE"
                    autoComplete="off"
                    value={formData.Do_DATE}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    size="small"
                    style={{ fontSize: "16px" }}
                    InputLabelProps={{
                      style: { fontSize: "12px" },
                      shrink: true,
                    }}
                    InputProps={{
                      style: {
                        fontSize: "12px",
                        height: "30px",
                        fontWeight: "bold",
                      },
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        height: "30px",
                        padding: "0px 10px",
                        fontSize: "16px",
                        fontWeight: "bold",
                        color: "black",
                        backgroundColor: "white",
                        opacity: 1,
                        "& .Mui-disabled": {
                          color: "black",
                          WebkitTextFillColor: "black",
                          opacity: 1,
                        },
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={1} className="mobile-hidden">
                  <FormControl fullWidth>
                    <InputLabel shrink style={{ fontWeight: "bold" }}>
                      Carpo. Sale No
                    </InputLabel>
                    <CarporateHelp
                      Name="Carporate_Sale_No"
                      onAcCodeClick={handleCarporate}
                      Carporate_no={Carporateno || formData.Carporate_Sale_No}
                      disabledFeild={!isEditing && addOneButtonEnabled}
                      onTenderDetailsFetched={handleCarporateDetailsFetched}
                    />
                  </FormControl>
                </Grid>

                <Grid item xs={1} mt={1} className="mobile-hidden">
                  <FormControl
                    fullWidth
                    disabled={isEditMode || addOneButtonEnabled}
                    sx={{ height: "40px" }}
                  >
                    <InputLabel id="desp_type-label" sx={{ height: "auto" }}>
                      DO Type
                    </InputLabel>
                    <Select
                      labelId="desp_type-label"
                      id="desp_type"
                      name="desp_type"
                      value={formData.desp_type}
                      onChange={handleChange}
                      label="Desp Type"
                      size="small"
                      sx={{ height: "30px" }}
                    >
                      <MenuItem value="DO">D.O</MenuItem>
                      <MenuItem value="DI">Dispatch</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* 
                <Grid item xs={1}>
                  <TextField
                    fullWidth
                    label="Carp. Sale Year Code"
                    variant="outlined"
                    id="Carporate_Sale_Year_Code"
                    name="Carporate_Sale_Year_Code"
                    autoComplete="off"
                    value={formData.Carporate_Sale_Year_Code}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    size="small"
                    InputLabelProps={{
                      shrink: true,
                      style: { fontSize: '16px', fontWeight: 'bold' },
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        height: '30px',
                        padding: '0px 10px',
                      },
                    }}
                  />
                </Grid> */}
              </Grid>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "20px",
                  flexWrap: "nowrap",
                  flexDirection: isMobile ? "column" : "row",
                }}
              >
                <div
                  className="DeliveryOrderMainDiv"
                  style={{
                    alignItems: isMobile ? "flex-start" : undefined,
                    flexDirection: isMobile ? "column" : undefined,
                    width: isMobile ? "100%" : undefined,
                    marginTop: isMobile ? "5px" : undefined
                  }}
                >
                  {/* Mill Code Label */}
                  <label
                    htmlFor="mill_code"
                    className="DeliveryOrderLabel"
                    style={{
                      textAlign: isMobile ? "left" : undefined,
                      display: isMobile ? "block" : undefined,
                      fontSize: isMobile ? "11px" : undefined,
                    }}
                  >
                    Mill Code:
                  </label>

                  {/* Mill Code Field */}
                  <div style={{ width: isMobile ? "100%" : undefined }}>
                    <AccountMasterHelp
                      name="mill_code"
                      onAcCodeClick={handlemill_code}
                      CategoryName={lblmillname}
                      CategoryCode={newmill_code}
                      Ac_type={[]}
                      disabledFeild={isEditMode || addOneButtonEnabled}
                      disabledInput={isMobile}

                    />
                  </div>

                  {/* Balance */}
                  <div
                    className="mill-balance-container"
                    style={{
                      textAlign: isMobile ? "left" : undefined,
                      width: isMobile ? "50%" : undefined,
                    }}
                  >
                    <h6
                      className="balance-value"
                      style={{
                        fontSize: isMobile ? "10px" : undefined,
                        textAlign: isMobile ? "left" : undefined,
                        margin: isMobile ? "0px" : undefined,
                      }}
                    >
                      {formatReadableAmount(Math.abs(millBalance))}{" "}
                      {parseFloat(millBalance) === 0 || millBalance === ""
                        ? ""
                        : millBalance < 0
                          ? "Credit"
                          : "Debit"}
                    </h6>
                  </div>

                  {/* Tender DetailID - desktop only, unchanged */}
                  <Grid item xs={0.5} className="mobile-hidden">
                    <TextField
                      fullWidth
                      label="Tender DetailID"
                      id="tenderdetailid"
                      name="tenderdetailid"
                      value={formData.tenderdetailid}
                      disabled
                      size="small"
                      style={{ width: "80%" }}
                      InputLabelProps={{
                        shrink: true,
                        style: { fontSize: "16px", fontWeight: "bold" },
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          height: "30px",
                          padding: "0px 10px",
                        },
                      }}
                      readOnly
                    />
                  </Grid>

                  {/* Bank Code Table */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: isMobile ? "flex-start" : "flex-end",
                      width: isMobile ? "100%" : undefined,
                    }}
                  >
                    <Table
                      bordered
                      style={{
                        maxWidth: isMobile ? "100%" : "300px",
                        tableLayout: isMobile ? "fixed" : undefined,
                      }}
                    >
                      <TableBody>
                        {users.map((user, index) => (
                          <TableRow key={user.id}>
                            <TableCell
                              sx={{
                                padding: isMobile ? "2px 4px" : "6px 6px",
                                textAlign: isMobile ? "left" : "center",
                                borderRadius: "8px",
                                border: "1px solid #ffd700",
                                fontSize: isMobile ? "11px" : "14px",
                                fontWeight: "bold",
                                whiteSpace: "nowrap",
                                backgroundColor: "#fff8dc",
                                width: isMobile ? "55px" : undefined,
                              }}
                            >
                              {user.Bank_Code || tenderDetails.Payment_To} -
                            </TableCell>
                            <TableCell
                              sx={{
                                padding: isMobile ? "2px 4px" : "6px 6px",
                                textAlign: isMobile ? "left" : "center",
                                borderRadius: "8px",
                                fontSize: isMobile ? "11px" : "14px",
                                border: "1px solid #ffd700",
                                fontWeight: "bold",
                                whiteSpace: "nowrap",
                                backgroundColor: "#fff8dc",
                                overflow: isMobile ? "hidden" : undefined,
                                textOverflow: isMobile ? "ellipsis" : undefined,
                                maxWidth: isMobile ? "180px" : undefined,
                              }}
                            >
                              {user.bankcodeacname ||
                                tenderDetails.paymenttoname}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: "5px" }}>
                <div
                  className="DeliveryOrderMainDiv"
                  style={{
                    display: "flex",
                    flexDirection: isMobile ? "column" : "row",
                    alignItems: isMobile ? "flex-start" : "center",
                    gap: isMobile ? "4px" : "2px",
                    width: isMobile ? "100%" : "auto",
                    padding: isMobile ? "4px 8px" : "0px",
                  }}
                >
                  <label
                    htmlFor="mill_code"
                    className="DeliveryOrderLabel"
                    style={{
                      fontSize: isMobile ? "11px" : "14px",
                      fonttext: "bold",
                      color: "#080808",
                      marginBottom: isMobile ? "2px" : "0px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Purc No.:
                  </label>

                  <div style={{ width: isMobile ? "100%" : "auto" }}>
                    <PurcnoHelp
                      onAcCodeClick={handlePurcno}
                      name="purc_no"
                      Tenderid={lblTenderid || Tenderid}
                      Tenderno={newPurcno || formData.purc_no || Tenderno}
                      disabledFeild={
                        isEditing || (addOneButtonEnabled && !isEditing)
                      }
                      disabledFeild1={!isEditing && addOneButtonEnabled}
                      Millcode={formData.mill_code || millcode}
                      onTenderDetailsFetched={
                        ChangeData
                          ? handleTenderDetailsFetched
                          : handleTenderWithoutCarpoDetailsFetched
                      }
                    />
                  </div>
                </div>

                <div className="DeliveryOrderMainDiv mobile-hidden">
                  <FormControl
                    fullWidth
                    disabled={
                      isEditMode ||
                      addOneButtonEnabled ||
                      (formData.SaleBillTo !== "" &&
                        formData.SaleBillTo !== 0 &&
                        formData.SaleBillTo !== 2)
                    }
                  >
                    <InputLabel id="Delivery_Type" sx={{ height: "auto" }}>
                      Delivery Type
                    </InputLabel>
                    <Select
                      labelId="Delivery_Type"
                      id="Delivery_Type"
                      name="Delivery_Type"
                      value={formData.Delivery_Type}
                      onChange={handleChange}
                      size="small"
                      sx={{ width: "200px" }}
                    >
                      <MenuItem value="C">Commission</MenuItem>
                      <MenuItem value="N">With GST Naka Delivery</MenuItem>
                      <MenuItem value="A">
                        Naka Delivery without GST Rate
                      </MenuItem>
                      <MenuItem value="D">DO</MenuItem>
                    </Select>
                  </FormControl>
                </div>

                <div className="DeliveryOrderMainDiv  mobile-hidden">
                  <label htmlFor="mill_code" className="DeliveryOrderLabel">
                    GST Code:
                  </label>
                  <div>
                    <GSTRateMasterHelp
                      name="GstRateCode"
                      onAcCodeClick={handleGstRateCode}
                      GstRateName={tenderDetails.gstratename || lblgstratename}
                      GstRateCode={tenderDetails.gstratecode || newGstRateCode}
                      disabledFeild={
                        isEditing || (addOneButtonEnabled && !isEditing)
                      }
                    />
                  </div>
                </div>

                <span className="mobile-hidden" style={{ display: "contents" }}>
                  <label htmlFor="Purchase_Date" className="DeliveryOrderLabel">
                    Purchase Date:
                  </label>
                  <input
                    type="date"
                    id="Purchase_Date"
                    Name="Purchase_Date"
                    value={formData.Purchase_Date}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    style={{
                      width: "150px",
                      height: "30px",
                      marginTop: "-10px",
                      fontWeight: "bold",
                    }}
                  />
                </span>
              </div>

           

              <div className="form-group  mobile-hidden">
                <div className="DeliveryOrderMainDiv">
                  <label htmlFor="GetpassCode" className="DeliveryOrderLabel">
                    Get Pass:
                  </label>
                  <div>
                    <AccountMasterHelp
                      name="GETPASSCODE"
                      Ac_type=""
                      onAcCodeClick={handleGETPASSCODE}
                      CategoryName={
                        ChangeData
                          ? getpassTitle
                          : tenderDetails?.Getpassnoname ||
                          lblgetpasscodename ||
                          getpasscodename
                      }
                      CategoryCode={
                        ChangeData
                          ? CarporateState?.newGETPASSCODE
                          : tenderDetails?.Getpassno ||
                          formData?.GETPASSCODE ||
                          getpasscode
                      }
                      disabledFeild={
                        isEditing || (addOneButtonEnabled && !isEditing)
                      }
                    />
                  </div>
                </div>

                <div
                  className="DeliveryOrderMainDiv"
                  style={{ marginLeft: "18px" }}
                >
                  <label
                    htmlFor="GetpassGstStateCode"
                    className="DeliveryOrderLabel"
                  >
                    State Code:
                  </label>
                  <div className="debitCreditNote-col">
                    <GSTStateMasterHelp
                      onAcCodeClick={handleGetpassGstStateCode}
                      name="GetpassGstStateCode"
                      GstStateName={
                        tenderDetails.Getpassnonamestatename ||
                        GetPassByName ||
                        getpassstatecodename
                      }
                      GstStateCode={
                        tenderDetails.Getpassnonamestatecode ||
                        GetpassByCode ||
                        formData.GetpassGstStateCode
                      }
                      disabledFeild={true}
                    />
                  </div>
                </div>

                <div className="DeliveryOrderMainDiv">
                  <label htmlFor="Itemcode" className="DeliveryOrderLabel">
                    Item Code :
                  </label>
                  <div className="debitCreditNote-col">
                    <div className="debitCreditNote-form-group">
                      <SystemHelpMaster
                        onAcCodeClick={handleItemSelect}
                        CategoryName={tenderDetails.itemname || lblitemname}
                        CategoryCode={tenderDetails.itemcode || newitemcode}
                        name="Item_Select"
                        SystemType="I"
                        className="account-master-help"
                        disabledField={!isEditing && addOneButtonEnabled}
                      />
                    </div>
                  </div>
                </div>

                {/* <div className="DeliveryOrderMainDiv" >
                  <select
                    id="UnitType"
                    name="UnitType"
                    value={formData.UnitType}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      fontSize: "14px",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                      backgroundColor: "#fff",
                      boxSizing: "border-box",
                      marginLeft: "10px",
                      marginTop: "8px"
                    }}
                  >
                    <option value="QTL">QUINTAL</option>
                    <option value="LTR">LITRE</option>
                    <option value="MTS"> METRIC TON</option>
                  </select>
                </div> */}

                {/* <div className="DeliveryOrderMainDiv">
                  <FormControl
                    fullWidth
                    disabled={!isEditing && addOneButtonEnabled}
                    style={{ marginTop: '8px' }}
                  >
                    <InputLabel id="unit-type-label">Unit Type</InputLabel>
                    <Select
                      labelId="unit-type-label"
                      id="UnitType"
                      name="UnitType"
                      value={formData.UnitType}
                      onChange={handleChange}
                      label="Unit Type"
                      size="small"
                      sx={{ width: '200px' }}
                    >
                      <MenuItem value="QTL">QUINTAL</MenuItem>
                      <MenuItem value="LTR">LITRE</MenuItem>
                      <MenuItem value="MTS">METRIC TON</MenuItem>
                    </Select>
                  </FormControl>
                </div> */}

                <div className="DeliveryOrderMainDiv">
                  <label htmlFor="Brandcode" className="DeliveryOrderLabel">
                    Brand Code:
                  </label>
                  <div className="debitCreditNote-col">
                    <div className="debitCreditNote-form-group">
                      <SystemHelpMaster
                        name="brandcode"
                        onAcCodeClick={handlebrandcode}
                        CategoryName={lblbrandname}
                        CategoryCode={newbrandcode}
                        SystemType="I"
                        disabledField={!isEditing && addOneButtonEnabled}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-group ">
                <div className="DeliveryOrderMainDiv" style={{
                  alignItems: isMobile ? "flex-start" : undefined,
                  flexDirection: isMobile ? "column" : undefined,
                  width: isMobile ? "100%" : undefined,
                }}>
                  <label htmlFor="Voucher_by" className="DeliveryOrderLabel"
                    style={{
                      textAlign: isMobile ? "left" : undefined,
                      display: isMobile ? "block" : undefined,
                      fontSize: isMobile ? "11px" : undefined,
                    }}>
                    Shipped To:
                  </label>
                  <div className="debitCreditNote-col">
                    <div className="debitCreditNote-form-group">
                      <AccountMasterHelp
                        name="voucher_by"
                        Ac_type=""
                        onAcCodeClick={handlevoucher_by}
                        CategoryName={
                          ChangeData
                            ? voucherTitle
                            : lblvoucherByname ||
                            voucherTitle ||
                            (shipToManuallySet ? "" : tenderDetails.buyername)
                        }
                        CategoryCode={
                          ChangeData
                            ? CarporateState.voucher_by
                            : newvoucher_by || (shipToManuallySet ? "" : tenderDetails.Buyer) || ""
                        }
                        disabledFeild={!isEditing && addOneButtonEnabled}
                        disabledInput={isMobile}
                        firstInputRef={shipToRef}
                      />
                    </div>
                  </div>
                  <div style={{
                    display: "flex",
                    flexDirection: "row",        // ✅ always row
                    gap: isMobile ? "8px" : "0",
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}>
                    <div className="mill-balance-container">
                      <h6 className="balance-value">
                        {formatReadableAmount(Math.abs(shipToBalance))}{" "}
                        {parseFloat(shipToBalance) === 0 || shipToBalance === ""
                          ? ""
                          : shipToBalance < 0
                            ? "Credit"
                            : "Debit"}
                      </h6>
                    </div>

                    <div className="gst-container" title="Ship To GST Number">
                      <h6 className="gst-text">{shipToGSTNo}</h6>
                    </div>
                  </div></div>

                <div
                  className="DeliveryOrderMainDiv mobile-hidden"
                  style={{ marginLeft: "18px" }}
                >
                  <label
                    htmlFor="Voucher_State_Code"
                    className="DeliveryOrderLabel"
                  >
                    State Code:
                  </label>
                  <div className="debitCreditNote-col">
                    <div className="debitCreditNote-form-group">
                      <GSTStateMasterHelp
                        onAcCodeClick={handleVoucherbyGstStateCode}
                        name="VoucherbyGstStateCode"
                        GstStateName={
                          tenderDetails.shiptostatename ||
                          VoucherByName ||
                          voucherbystatename
                        }
                        GstStateCode={
                          tenderDetails.shiptostatecode ||
                          VoucherByCode ||
                          formData.VoucherbyGstStateCode
                        }
                        disabledFeild={true}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-group  ">
                <div className="DeliveryOrderMainDiv" style={{
                  alignItems: isMobile ? "flex-start" : undefined,
                  flexDirection: isMobile ? "column" : undefined,
                  width: isMobile ? "100%" : undefined,
                }}>
                  <label
                    htmlFor="Voucher_State_Code"
                    className="DeliveryOrderLabel"
                    style={{
                      textAlign: isMobile ? "left" : undefined,
                      display: isMobile ? "block" : undefined,
                      fontSize: isMobile ? "11px" : undefined,
                    }}
                  >
                    Sale Bill To:
                  </label>
                  <div className="debitCreditNote-col">
                    <div className="debitCreditNote-form-group">
                      <AccountMasterHelp
                        name="SaleBillTo"
                        Ac_type=""
                        onAcCodeClick={handleSaleBillTo}
                        CategoryName={
                          ChangeData
                            ? salebillTitle
                            : lblsalebilltoname ||
                            salebillTitle ||
                            tenderDetails.buyername
                        }
                        CategoryCode={
                          ChangeData
                            ? CarporateState.SaleBillTo
                            : newSaleBillTo || tenderDetails.Buyer || ""
                        }
                        disabledFeild={(isEditMode && String(formData.GETPASSCODE) === String(formData.SaleBillTo)) || !isEditing && addOneButtonEnabled}
                        disabledInput={isMobile}
                      />
                    </div>
                  </div>

                  <div style={{
                    display: "flex",
                    flexDirection: "row",        // ✅ always row
                    gap: isMobile ? "8px" : "0",
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}>

                    <div className="mill-balance-container">
                      <h6 className="balance-value">
                        {formatReadableAmount(Math.abs(billToBalance))}{" "}
                        {parseFloat(billToBalance) === 0 || billToBalance === ""
                          ? ""
                          : billToBalance < 0
                            ? "Credit"
                            : "Debit"}
                      </h6>
                    </div>

                    <div className="gst-container" title="Bill To GST Number">
                      <h6 className="gst-text">{billToGSTNo}</h6>
                    </div>
                  </div>
                </div>

                <div
                  className="DeliveryOrderMainDiv mobile-hidden"
                  style={{ marginLeft: "18px" }}
                >
                  <label
                    htmlFor="Voucher_State_Code"
                    className="DeliveryOrderLabel"
                  >
                    State Code:
                  </label>
                  <div className="debitCreditNote-col">
                    <div className="debitCreditNote-form-group">
                      <GSTStateMasterHelp
                        onAcCodeClick={handleSalebilltoGstStateCode}
                        name="SalebilltoGstStateCode"
                        GstStateName={
                          SaleBillByName ||
                          tenderDetails.buyeridcitystate ||
                          salebilltostatename
                        }
                        GstStateCode={
                          SaleBillByCode ||
                          tenderDetails.buyergststatecode ||
                          formData.SalebilltoGstStateCode
                        }
                        disabledFeild={true}
                      />
                    </div>
                  </div>
                </div>

                <div className="DeliveryOrderMainDiv mobile-hidden">
                  <label htmlFor="godownCode" className="DeliveryOrderLabel">
                    Godown Code :
                  </label>
                  <div className="debitCreditNote-col">
                    <div className="debitCreditNote-form-group">
                      <SystemHelpMaster
                        onAcCodeClick={handleGoDown}
                        CategoryName={lblGodownName}
                        CategoryCode={newGodownCode}
                        name="godownCode"
                        SystemType="W"
                        className="account-master-help"
                        disabledField={
                          String(formData.GETPASSCODE) !==
                          String(formData.SaleBillTo) ||
                          (!isEditing && addOneButtonEnabled)
                        }
                      />
                    </div>
                  </div>
                </div>



                {/* <div className="form-group" style={{marginTop:"20px"}}>
                <div className="DeliveryOrderMainDiv">
                  <label htmlFor="Voucher_State_Code" className="DeliveryOrderLabel">
                   Carporate Bill To:
                  </label>
                  <div className="debitCreditNote-col" >
                    <div className="debitCreditNote-form-group">
                      <AccountMasterHelp
                        name="SaleBillTo"
                        Ac_type=''
                        onAcCodeClick={handlecarporate_ac}
                        CategoryName={
                          ChangeData
                            ? carporatenameTitle
                            : tenderDetails.partyName ||
                            carporatenameTitle ||
                            lblcarporateacname
                        }
                        CategoryCode={
                          ChangeData
                            ? CarporateState.bill_to
                            : tenderDetails.Buyer || newcarporate_ac
                        }
                        disabledFeild={(isEditMode && String(formData.Carporate_Sale_No) !== 0) || !isEditing && addOneButtonEnabled}
                      />
                    </div>
                  </div>
                  </div>
                  </div> */}

              </div>


                 <div className="form-group mobile-hidden">
                <div style={{ display: "flex", flexDirection: "column", width: "60%" }}>
                  <label htmlFor="ebuy_narration" className="DeliveryOrderLabel" style={{ marginBottom: "4px" }}>
                    Shipping Details:
                  </label>
                  <textarea
                    id="ebuy_narration"
                    name="ebuy_narration"
                    value={formData.ebuy_narration}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    rows={2}
                    style={{
                      width: "100%",
                      fontSize: "14px",
                      fontFamily: "inherit",
                      padding: "6px 10px",
                      resize: "vertical",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          <br></br>
          <Card>
            <CardContent>
              <Box mt={-2}>
                <Grid container spacing={1} alignItems="center">
                  <Grid item xs={isMobile ? 12 : 1}>
                    <FormControl fullWidth variant="outlined">
                      <InputLabel
                        htmlFor="grade"
                        shrink
                        style={{
                          fontSize: isMobile ? "11px" : "16px",
                          fontWeight: "bold",
                        }}
                      >
                        Grade
                      </InputLabel>
                      <GradeMasterHelp
                        name="Grade"
                        onAcCodeClick={handleGrade}
                        CategoryName={formData.grade || newGrade}
                        disabledField={true}
                        onCategoryChange={handleGradeUpdate}
                      />
                    </FormControl>
                  </Grid>

                  <Grid
                    item
                    xs={isMobile ? 12 : 1}
                    sx={{
                      ml: isMobile ? 0 : 6,
                      mt: isMobile ? "4px" : 0,
                    }}
                  >
                    <FormControl fullWidth variant="outlined">
                      <InputLabel
                        htmlFor="Quintal"
                        shrink
                        style={{
                          fontSize: isMobile ? "11px" : "16px",
                          fontWeight: "bold",
                        }}
                      >
                        Quintal
                      </InputLabel>
                      <OutlinedInput
                        id="quantal"
                        name="quantal"
                        autoComplete="off"
                        value={formData.quantal}
                        onChange={handleChange}
                        onKeyDown={handleKeyDownCalculations}
                        disabled={!isEditing && addOneButtonEnabled}
                        label="Quantal"
                        size="small"
                        inputRef={quantalRef}
                        inputProps={{
                          onInput: validateNumericInput,
                          style: {
                            textAlign: isMobile ? "left" : "right",
                            fontWeight: "bold",
                            fontSize: isMobile ? "13px" : "16px",
                          },
                        }}
                        style={{
                          height: isMobile ? "36px" : "30px",
                          fontSize: isMobile ? "13px" : "16px",
                        }}
                        sx={{
                          height: isMobile ? "36px" : "30px",
                          fontSize: isMobile ? "13px" : "16px",
                          fontWeight: "bold",
                          color: "black",
                          backgroundColor: "white",
                          opacity: 1,
                          "& .Mui-disabled": {
                            color: "black",
                            WebkitTextFillColor: "black",
                            opacity: 1,
                          },
                        }}
                      />
                    </FormControl>
                  </Grid>

                  <Grid item xs={1} className="mobile-hidden">
                    <FormControl fullWidth variant="outlined">
                      <InputLabel
                        htmlFor="packing"
                        style={{ fontSize: "16px", fontWeight: "bold" }}
                      >
                        Packing
                      </InputLabel>
                      <OutlinedInput
                        id="packing"
                        name="packing"
                        autoComplete="off"
                        value={formData.packing}
                        onKeyDown={handleKeyDownCalculations}
                        onChange={handleChange}
                        disabled={!isEditing && addOneButtonEnabled}
                        label="Packing"
                        size="small"
                        InputLabelProps={{ shrink: true }}
                        inputProps={{
                          onInput: validateNumericInput,
                          style: { textAlign: "right", fontWeight: "bold" },
                        }}
                        style={{ height: "30px", fontSize: "16px" }}
                        sx={{
                          height: "30px",
                          fontSize: "16px",
                          fontWeight: "bold",
                          color: "black",
                          backgroundColor: "white",
                          opacity: 1,
                          "& .Mui-disabled": {
                            color: "black",
                            WebkitTextFillColor: "black",
                            opacity: 1,
                          },
                        }}
                      />
                    </FormControl>
                  </Grid>

                  <Grid item xs={1} className="mobile-hidden">
                    <FormControl fullWidth variant="outlined">
                      <InputLabel
                        htmlFor="bags"
                        shrink
                        style={{ fontSize: "16px", fontWeight: "bold" }}
                      >
                        Bags
                      </InputLabel>
                      <OutlinedInput
                        id="bags"
                        name="bags"
                        value={formData.bags}
                        onChange={handleChange}
                        disabled
                        label="Bags"
                        size="small"
                        InputLabelProps={{ shrink: true }}
                        style={{ height: "30px", fontSize: "16px" }}
                        inputProps={{
                          onInput: validateNumericInput,
                          style: { textAlign: "right", fontWeight: "bold" },
                        }}
                        sx={{
                          height: "30px",
                          fontSize: "16px",
                          fontWeight: "bold",
                          color: "black",
                          backgroundColor: "white",
                          opacity: 1,
                          "& .Mui-disabled": {
                            color: "black",
                            WebkitTextFillColor: "black",
                            opacity: 1,
                          },
                        }}
                      />
                    </FormControl>
                  </Grid>

                  <Grid item xs={1} className="mobile-hidden">
                    <FormControl fullWidth variant="outlined">
                      <InputLabel
                        htmlFor="excise_rate"
                        shrink
                        style={{ fontSize: "16px", fontWeight: "bold" }}
                      >
                        GST Rate
                      </InputLabel>
                      <OutlinedInput
                        id="excise_rate"
                        name="excise_rate"
                        autoComplete="off"
                        value={formData.excise_rate}
                        onChange={handleChange}
                        onKeyDown={handleKeyDownCalculations}
                        disabled={!isEditing && addOneButtonEnabled}
                        label="GST Rate"
                        size="small"
                        InputLabelProps={{ shrink: true }}
                        style={{ height: "30px", fontSize: "16px" }}
                        inputProps={{
                          onInput: validateNumericInput,
                          style: { textAlign: "right", fontWeight: "bold" },
                        }}
                        sx={{
                          height: "30px",
                          fontSize: "16px",
                          fontWeight: "bold",
                          color: "black",
                          backgroundColor: "white",
                          opacity: 1,
                          "& .Mui-disabled": {
                            color: "black",
                            WebkitTextFillColor: "black",
                            opacity: 1,
                          },
                        }}
                      />
                    </FormControl>
                  </Grid>

                  <Grid item xs={1} className="mobile-hidden">
                    <FormControl fullWidth variant="outlined">
                      <InputLabel
                        htmlFor="final_amout"
                        style={{ fontSize: "16px", fontWeight: "bold" }}
                      >
                        Mill Amount
                      </InputLabel>
                      <OutlinedInput
                        id="final_amout"
                        name="final_amout"
                        autoComplete="off"
                        value={formData.final_amout}
                        onChange={handleChange}
                        disabled={!isEditing && addOneButtonEnabled}
                        label="Mill Amount"
                        size="small"
                        onInput={validateNumericInput}
                        InputLabelProps={{ shrink: true }}
                        style={{ height: "30px", fontSize: "16px" }}
                        inputProps={{
                          onInput: validateNumericInput,
                          style: { textAlign: "right", fontWeight: "bold" },
                        }}
                        sx={{
                          height: "30px",
                          fontSize: "16px",
                          fontWeight: "bold",
                          color: "black",
                          backgroundColor: "white",
                          opacity: 1,
                          "& .Mui-disabled": {
                            color: "black",
                            WebkitTextFillColor: "black",
                            opacity: 1,
                          },
                        }}
                      />
                    </FormControl>
                  </Grid>

                  <Grid item xs={1} >
                    <CustomTextFeild
                      label="Mill Rate"
                      id="mill_rate"
                      name="mill_rate"
                      autoComplete="off"
                      value={tenderDetails.mill_rate || formData.mill_rate}
                      // onChange={handleChange}
                      // onKeyDown={handleKeyDownCalculations}
                      disabled
                      fullWidth
                      variant="outlined"
                      size="small"
                      inputProps={{
                        onInput: validateNumericInput,
                        style: { textAlign: "right", fontWeight: "bold" },
                      }}
                      InputLabelProps={{
                        shrink: true,
                        style: { fontSize: "16px", fontWeight: "bold" },
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          height: "30px",
                          padding: "0px 10px",
                          fontSize: "16px",
                          fontWeight: "bold",
                          color: "black",
                          backgroundColor: "white",
                          opacity: 1,
                          "& .Mui-disabled": {
                            color: "black",
                            WebkitTextFillColor: "black",
                            opacity: 1,
                          },
                        },
                      }}
                    />
                  </Grid>

                  <Grid item xs={1} >
                    <CustomTextFeild
                      label="Sale Rate"
                      id="sale_rate"
                      name="sale_rate"
                      autoComplete="off"
                      value={formData.sale_rate}
                      onChange={handleChange}
                      onKeyDown={handleKeyDownCalculations}
                      disabled={
                        (!isEditing && addOneButtonEnabled) ||
                        formData.SB_No !== 0
                      }
                      fullWidth
                      variant="outlined"
                      size="small"
                      InputLabelProps={{
                        shrink: true,
                        style: { fontSize: "16px", fontWeight: "bold" },
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          height: "30px",
                          padding: "0px 10px",
                          fontSize: "16px",
                          fontWeight: "bold",
                          color: "black",
                          backgroundColor: "white",
                          opacity: 1,
                          "& .Mui-disabled": {
                            color: "black",
                            WebkitTextFillColor: "black",
                            opacity: 1,
                          },
                        },
                      }}
                      inputProps={{
                        onInput: validateNumericInput,
                        style: { textAlign: "right", fontWeight: "bold" },
                      }}
                    />
                  </Grid>

                  <Grid item xs={1} >
                    <CustomTextFeild
                      label="Purchase Rate"
                      id="PurchaseRate"
                      name="PurchaseRate"
                      value={formData.PurchaseRate}
                      onChange={handleChange}
                      onKeyDown={handleKeyDownCalculations}
                      disabled={!isEditing && addOneButtonEnabled}
                      fullWidth
                      variant="outlined"
                      size="small"
                      style={{ fontSize: "16px" }}
                      InputLabelProps={{
                        shrink: true,
                        style: { fontSize: "16px", fontWeight: "bold" },
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          height: "30px",
                          padding: "0px 10px",
                          fontSize: "16px",
                          fontWeight: "bold",
                          color: "black",
                          backgroundColor: "white",
                          opacity: 1,
                          "& .Mui-disabled": {
                            color: "black",
                            WebkitTextFillColor: "black",
                            opacity: 1,
                          },
                        },
                      }}
                      inputProps={{
                        onInput: validateNumericInput,
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>

              <Grid container spacing={1} mt={0.5}>
                <Grid item xs={1} className="mobile-hidden">
                  <CustomTextFeild
                    label="Commision"
                    id="Tender_Commission"
                    name="Tender_Commission"
                    autoComplete="off"
                    value={
                      ChangeData
                        ? CarporateState.Tender_Commission
                        : tenderDetails.CR || formData.Tender_Commission
                    }
                    onChange={handleChange}
                    onKeyDown={handleKeyDownCalculations}
                    disabled={!isEditing && addOneButtonEnabled}
                    fullWidth
                    variant="outlined"
                    size="small"
                    inputProps={{
                      onInput: validateNumericInput,
                      style: { textAlign: "right" },
                    }}
                    InputLabelProps={{
                      shrink: true,
                      style: { fontSize: "16px", fontWeight: "bold" },
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        height: "30px",
                        padding: "0px 10px",
                        fontSize: "16px",
                        fontWeight: "bold",
                        color: "black",
                        backgroundColor: "white",
                        opacity: 1,
                        "& .Mui-disabled": {
                          color: "black",
                          WebkitTextFillColor: "black",
                          opacity: 1,
                        },
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={1} className="mobile-hidden">
                  <CustomTextFeild
                    label="Diff Rate"
                    id="diff_rate"
                    name="diff_rate"
                    autoComplete="off"
                    value={formData.diff_rate}
                    onChange={handleChange}
                    onKeyDown={handleKeyDownCalculations}
                    disabled={!isEditing && addOneButtonEnabled}
                    fullWidth
                    variant="outlined"
                    size="small"
                    onInput={validateNumericInput}
                    InputLabelProps={{
                      shrink: true,
                      style: { fontSize: "16px", fontWeight: "bold" },
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        height: "30px",
                        padding: "0px 10px",
                        fontSize: "16px",
                        fontWeight: "bold",
                        color: "black",
                        backgroundColor: "white",
                        opacity: 1,
                        "& .Mui-disabled": {
                          color: "black",
                          WebkitTextFillColor: "black",
                          opacity: 1,
                        },
                      },
                    }}
                    inputProps={{
                      onInput: validateNumericInput,
                      style: { textAlign: "right" },
                    }}
                  />
                </Grid>

                {/* <Grid item xs={1}>
                  <TextField
                    label="Insurance"
                    id="Insurance"
                    name="Insurance"
                    autoComplete="off"
                    value={formData.Insurance}
                    onChange={handleChange}
                    onKeyDown={handleKeyDownCalculations}
                    disabled={!isEditing && addOneButtonEnabled}
                    fullWidth
                    variant="outlined"
                    size="small"
                    onInput={validateNumericInput}
                    InputLabelProps={{
                      shrink: true,
                      style: { fontSize: '16px', fontWeight: 'bold' }
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        height: '30px',
                        padding: '0px 10px',
                      },
                    }}
                    inputProps={{
                      onInput: validateNumericInput,
                      style: { textAlign: 'right' },
                    }}
                  />
                </Grid> */}

                <Grid item xs={1} className="mobile-hidden">
                  <CustomTextFeild
                    label="Purchase TCS Rate"
                    id="TCS_Rate"
                    name="TCS_Rate"
                    autoComplete="off"
                    value={formData.TCS_Rate}
                    onChange={handleChange}
                    onKeyDown={handleKeyDownCalculations}
                    disabled={
                      TCSApplication !== "Y" ||
                      (!isEditing && addOneButtonEnabled)
                    }
                    fullWidth
                    variant="outlined"
                    size="small"
                    onInput={validateNumericInput}
                    InputLabelProps={{
                      shrink: true,
                      style: { fontSize: "16px", fontWeight: "bold" },
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        height: "30px",
                        padding: "0px 10px",
                        fontSize: "16px",
                        fontWeight: "bold",
                        color: "black",
                        backgroundColor: "white",
                        opacity: 1,
                        "& .Mui-disabled": {
                          color: "black",
                          WebkitTextFillColor: "black",
                          opacity: 1,
                        },
                      },
                    }}
                    inputProps={{
                      onInput: validateNumericInput,
                      style: { textAlign: "right" },
                    }}
                  />
                </Grid>

                <Grid item xs={1} className="mobile-hidden">
                  <CustomTextFeild
                    label="Sale TCS Rate"
                    id="Sale_TCS_Rate"
                    name="Sale_TCS_Rate"
                    autoComplete="off"
                    value={formData.Sale_TCS_Rate}
                    onChange={handleChange}
                    onKeyDown={handleKeyDownCalculations}
                    disabled={
                      TCSApplication !== "Y" ||
                      (!isEditing && addOneButtonEnabled)
                    }
                    fullWidth
                    variant="outlined"
                    size="small"
                    onInput={validateNumericInput}
                    InputLabelProps={{
                      shrink: true,
                      style: { fontSize: "16px", fontWeight: "bold" },
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        height: "30px",
                        padding: "0px 10px",
                        fontSize: "16px",
                        fontWeight: "bold",
                        color: "black",
                        backgroundColor: "white",
                        opacity: 1,
                        "& .Mui-disabled": {
                          color: "black",
                          WebkitTextFillColor: "black",
                          opacity: 1,
                        },
                      },
                    }}
                    inputProps={{
                      onInput: validateNumericInput,
                      style: { textAlign: "right" },
                    }}
                  />
                </Grid>

                <Grid item xs={1} className="mobile-hidden">
                  <CustomTextFeild
                    label="Sale TDS Rate"
                    id="SaleTDSRate"
                    name="SaleTDSRate"
                    autoComplete="off"
                    value={formData.SaleTDSRate}
                    onChange={handleChange}
                    // onKeyDown={handleKeyDownCalculations}
                    disabled={isEditMode ? !isEditing : !addOneButtonEnabled}
                    fullWidth
                    variant="outlined"
                    size="small"
                    InputLabelProps={{
                      shrink: true,
                      style: { fontSize: "16px", fontWeight: "bold" },
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        height: "30px",
                        padding: "0px 10px",
                        fontSize: "16px",
                        fontWeight: "bold",
                        color: "black",
                        backgroundColor: "white",
                        opacity: 1,
                        "& .Mui-disabled": {
                          color: "black",
                          WebkitTextFillColor: "black",
                          opacity: 1,
                        },
                      },
                    }}
                    inputProps={{
                      onInput: validateNumericInput,
                      style: { textAlign: "right" },
                    }}
                  />
                </Grid>

                <Grid item xs={1} className="mobile-hidden">
                  <CustomTextFeild
                    label="Purchase TDS Rate"
                    id="PurchaseTDSRate"
                    name="PurchaseTDSRate"
                    autoComplete="off"
                    value={formData.PurchaseTDSRate}
                    onChange={handleChange}
                    // onKeyDown={handleKeyDownCalculations}
                    // disabled={!isEditing && addOneButtonEnabled}
                    disabled={isEditMode ? !isEditing : !addOneButtonEnabled}
                    fullWidth
                    variant="outlined"
                    size="small"
                    onInput={validateNumericInput}
                    InputLabelProps={{
                      shrink: true,
                      style: { fontSize: "16px", fontWeight: "bold" },
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        height: "30px",
                        padding: "0px 10px",
                        fontSize: "16px",
                        fontWeight: "bold",
                        color: "black",
                        backgroundColor: "white",
                        opacity: 1,
                        "& .Mui-disabled": {
                          color: "black",
                          WebkitTextFillColor: "black",
                          opacity: 1,
                        },
                      },
                    }}
                    inputProps={{
                      onInput: validateNumericInput,
                      style: { textAlign: "right" },
                    }}
                  />
                </Grid>

                <Grid item xs={1.2}>
                  <CustomTextFeild
                    label="Amount"
                    id="amount"
                    name="amount"
                    autoComplete="off"
                    value={formatReadableAmount(formData.amount)}
                    // onChange={handleChange}
                    disabled
                    fullWidth
                    variant="outlined"
                    size="small"
                    onInput={validateNumericInput}
                    InputLabelProps={{
                      shrink: true,
                      style: { fontSize: "16px", fontWeight: "bold" },
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        height: "30px",
                        padding: "0px 10px",
                        fontSize: "16px",
                        fontWeight: "bold",
                        color: "black",
                        backgroundColor: "white",
                        opacity: 1,
                        "& .Mui-disabled": {
                          color: "black",
                          WebkitTextFillColor: "black",
                          opacity: 1,
                        },
                      },
                    }}
                    inputProps={{
                      onInput: validateNumericInput,
                      style: { textAlign: "right", fontWeight: "bold" },
                    }}
                  />
                </Grid>

                <Grid item xs={1.2}>
                  <CustomTextFeild
                    label="Mill Amount With TCS"
                    id="Mill_AmtWO_TCS"
                    name="Mill_AmtWO_TCS"
                    autoComplete="off"
                    value={formatReadableAmount(formData.Mill_AmtWO_TCS)}
                    // onChange={handleChange}
                    disabled
                    fullWidth
                    variant="outlined"
                    size="small"
                    onInput={validateNumericInput}
                    InputLabelProps={{
                      shrink: true,
                      style: { fontSize: "16px", fontWeight: "bold" },
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        height: "30px",
                        padding: "0px 10px",
                        fontSize: "16px",
                        fontWeight: "bold",
                        color: "black",
                        backgroundColor: "white",
                        opacity: 1,
                        "& .Mui-disabled": {
                          color: "black",
                          WebkitTextFillColor: "black",
                          opacity: 1,
                        },
                      },
                    }}
                    inputProps={{
                      onInput: validateNumericInput,
                      style: { textAlign: "right", fontWeight: "bold" },
                    }}
                  />
                </Grid>
              </Grid>

              <Grid container spacing={1} mt={1} alignItems="center">
                <Grid item xs={1.5}>
                  <TextField
                    label="Truck No"
                    id="truck_no"
                    name="truck_no"
                    autoComplete="off"
                    value={formData.truck_no}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    fullWidth
                    variant="outlined"
                    size="small"
                    InputLabelProps={{
                      shrink: true,
                      style: { fontSize: "16px", fontWeight: "bold" },
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        height: "30px",
                        padding: "0px 10px",
                        fontSize: "16px",
                        fontWeight: "bold",
                        color: "black",
                        backgroundColor: "white",
                        opacity: 1,
                        "& .Mui-disabled": {
                          color: "black",
                          WebkitTextFillColor: "black",
                          opacity: 1,
                        },
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={1} className="mobile-hidden">
                  <CustomTextFeild
                    label="Driver Mob No"
                    id="driver_no"
                    name="driver_no"
                    autoComplete="off"
                    value={formData.driver_no}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    fullWidth
                    variant="outlined"
                    size="small"
                    onInput={validateNumericInput}
                    InputLabelProps={{
                      shrink: true,
                      style: { fontSize: "16px", fontWeight: "bold" },
                    }}
                    inputProps={{
                      maxLength: 10,
                      inputMode: "numeric",
                      pattern: "[0-9]*",
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        height: "30px",
                        padding: "0px 10px",
                      },
                    }}
                  />
                </Grid>

                <div
                  className="DeliveryOrderMainDiv"
                  style={{
                    display: "flex",
                    flexDirection: isMobile ? "column" : "row",
                    alignItems: isMobile ? "flex-start" : "center",
                    gap: isMobile ? "4px" : "0px",
                    width: isMobile ? "100%" : "auto",
                    padding: isMobile ? "4px 8px" : "0px",
                  }}
                >
                  <label
                    htmlFor="Transport"
                    style={{
                      marginTop: isMobile ? "0px" : "5px",
                      fontWeight: "bold",
                      marginLeft: isMobile ? "0px" : "10px",
                      fontSize: isMobile ? "11px" : "14px",
                      color: "#555",
                      whiteSpace: "nowrap",
                      marginBottom: isMobile ? "2px" : "0px",
                    }}
                  >
                    Transport :
                  </label>

                  <div
                    className="debitCreditNote-col"
                    style={{
                      width: isMobile ? "100%" : "auto",
                    }}
                  >
                    <div
                      className="debitCreditNote-form-group"
                      style={{
                        marginTop: isMobile ? "0px" : "10px",
                        width: isMobile ? "100%" : "auto",
                      }}
                    >
                      <AccountMasterHelp
                        onAcCodeClick={handletransport}
                        name="transport"
                        CategoryName={lbltransportname || transportcodename}
                        CategoryCode={
                          newtransport || formData.transport || transportcode
                        }
                        disabledFeild={isMobile || !isEditing && addOneButtonEnabled}
                        Ac_type=""
                        onKeyDown={handleKeyDownCalculations}
                      />
                    </div>
                  </div>
                </div>

                <Grid item xs={1} className="mobile-hidden">
                  <CustomTextFeild
                    label="Pan No"
                    id="Pan_No"
                    name="Pan_No"
                    autoComplete="off"
                    value={formData.Pan_No}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    fullWidth
                    variant="outlined"
                    size="small"
                    InputLabelProps={{
                      shrink: true,
                      style: { fontSize: "16px", fontWeight: "bold" },
                    }}
                    inputProps={{
                      style: { textTransform: "uppercase" },
                      maxLength: 10,
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        height: "30px",
                        padding: "0px 10px",
                      },
                    }}
                  />
                </Grid>

                <div className="DeliveryOrderMainDiv  mobile-hidden">
                  <label
                    htmlFor="TransportGSTStateCode"
                    style={{
                      marginTop: "10px",
                      fontWeight: "bold",
                      marginLeft: "10px",
                    }}
                  >
                    State Code :
                  </label>
                  <div className="debitCreditNote-col">
                    <div
                      className="debitCreditNote-form-group"
                      style={{ marginTop: "10px" }}
                    >
                      <GSTStateMasterHelp
                        onAcCodeClick={handleTransportGSTStateCode}
                        name="TransportGSTStateCode"
                        GstStateName={
                          lbltransportstatename || transportstatename
                        }
                        GstStateCode={
                          newTransportGSTStateCode ||
                          formData.TransportGSTStateCode
                        }
                        disabledFeild={true}
                      />
                    </div>
                  </div>
                </div>
              </Grid>

              <br></br>

              <div>
                <Grid container spacing={1} mt={-2} className="mobile-hidden">
                  <Grid item xs={1}>
                    <CustomTextFeild
                      fullWidth
                      label="Diff Amount"
                      type="text"
                      id="diff_amount"
                      name="diff_amount"
                      autoComplete="off"
                      value={formData.diff_amount}
                      onChange={handleChange}
                      disabled={!isEditing && addOneButtonEnabled}
                      size="small"
                      onInput={validateNumericInput}
                      InputLabelProps={{
                        shrink: true,
                        style: { fontSize: "16px", fontWeight: "bold" },
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          height: "30px",
                          padding: "0px 10px",
                          fontSize: "16px",
                          fontWeight: "bold",
                          color: "black",
                          backgroundColor: "white",
                          opacity: 1,
                          "& .Mui-disabled": {
                            color: "black",
                            WebkitTextFillColor: "black",
                            opacity: 1,
                          },
                        },
                      }}
                      inputProps={{
                        onInput: validateNumericInput,
                        style: { textAlign: "right" },
                      }}
                    />
                  </Grid>

                  <Grid item xs={1}>
                    <CustomTextFeild
                      fullWidth
                      label="Freight"
                      type="text"
                      id="FreightPerQtl"
                      name="FreightPerQtl"
                      autoComplete="off"
                      value={formData.FreightPerQtl}
                      onChange={handleChange}
                      onKeyDown={handleKeyDownCalculations}
                      disabled={!isEditing && addOneButtonEnabled}
                      size="small"
                      onInput={validateNumericInput}
                      InputLabelProps={{
                        shrink: true,
                        style: { fontSize: "16px", fontWeight: "bold" },
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          height: "30px",
                          padding: "0px 10px",
                        },
                      }}
                      inputProps={{
                        onInput: validateNumericInput,
                        style: { textAlign: "right" },
                      }}
                    />
                  </Grid>

                  <Grid item xs={1}>
                    <CustomTextFeild
                      fullWidth
                      label="Freight Amount"
                      type="text"
                      id="Freight_Amount"
                      name="Freight_Amount"
                      autoComplete="off"
                      value={formData.Freight_Amount}
                      onChange={handleChange}
                      disabled={!isEditing && addOneButtonEnabled}
                      size="small"
                      onInput={validateNumericInput}
                      InputLabelProps={{
                        shrink: true,
                        style: { fontSize: "16px", fontWeight: "bold" },
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          height: "30px",
                          padding: "0px 10px",
                        },
                      }}
                      inputProps={{
                        onInput: validateNumericInput,
                        style: { textAlign: "right" },
                      }}
                    />
                  </Grid>

                  <Grid item xs={1}>
                    <FormControl
                      fullWidth
                      disabled={!isEditing && addOneButtonEnabled}
                      sx={{ height: "40px" }}
                    >
                      <InputLabel
                        id="MM_CC"
                        sx={{ height: "auto", paddingTop: 0, paddingBottom: 0 }}
                      >
                        Memo Advance
                      </InputLabel>

                      <Select
                        id="MM_CC"
                        name="MM_CC"
                        autoComplete="off"
                        value={formData.MM_CC}
                        onChange={handleChange}
                        onKeyDown={handleKeyDownCalculations}
                        disabled={!isEditing && addOneButtonEnabled}
                        size="small"
                        sx={{ height: "30px" }}
                      >
                        <MenuItem value="Credit">Credit</MenuItem>
                        <MenuItem value="Cash">Cash</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={1}>
                    <CustomTextFeild
                      label="Memo Rate"
                      type="text"
                      id="MM_Rate"
                      Name="MM_Rate"
                      autoComplete="off"
                      value={formData.MM_Rate}
                      onChange={handleChange}
                      onKeyDown={handleKeyDownCalculations}
                      disabled={!isEditing && addOneButtonEnabled}
                      size="small"
                      onInput={validateNumericInput}
                      InputLabelProps={{
                        shrink: true,
                        style: { fontSize: "16px", fontWeight: "bold" },
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          height: "30px",
                          padding: "0px 10px",
                        },
                      }}
                      inputProps={{
                        onInput: validateNumericInput,
                        style: { textAlign: "right" },
                      }}
                    />
                  </Grid>

                  <Grid item xs={1}>
                    <CustomTextFeild
                      fullWidth
                      label="Memo Advance Amount"
                      type="text"
                      id="Memo_Advance"
                      name="Memo_Advance"
                      autoComplete="off"
                      value={formData.Memo_Advance}
                      onChange={handleChange}
                      onKeyDown={handleKeyDownCalculations}
                      disabled={!isEditing && addOneButtonEnabled}
                      size="small"
                      onInput={validateNumericInput}
                      InputLabelProps={{
                        shrink: true,
                        style: { fontSize: "16px", fontWeight: "bold" },
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          height: "30px",
                          padding: "0px 10px",
                        },
                      }}
                      inputProps={{
                        onInput: validateNumericInput,
                        style: { textAlign: "right" },
                      }}
                    />
                  </Grid>

                  <div
                    className="DeliveryOrderMainDiv"
                    style={{ marginTop: "5px" }}
                  >
                    <label
                      htmlFor="MemoGSTRate"
                      style={{
                        marginTop: "5px",
                        fontWeight: "bold",
                        marginLeft: "10px",
                      }}
                    >
                      Memo GST Code :
                    </label>
                    <div className="debitCreditNote-col">
                      <div className="debitCreditNote-form-group">
                        <GSTRateMasterHelp
                          name="MemoGSTRate"
                          onAcCodeClick={handleMemoGSTRate}
                          onKeyDown={handleKeyDownCalculations}
                          GstRateName={lblMemoGSTRatename || GSTMemoGstrate}
                          GstRateCode={newMemoGSTRate || GSTMemoGstcode}
                          disabledFeild={!isEditing && addOneButtonEnabled}
                        />
                      </div>
                    </div>
                  </div>

                  <Grid item xs={1}>
                    <CustomTextFeild
                      fullWidth
                      label="RCM Number"
                      type="text"
                      id="RCMNumber"
                      name="RCMNumber"
                      autoComplete="off"
                      value={formData.RCMNumber}
                      onChange={handleChange}
                      disabled={!isEditing && addOneButtonEnabled}
                      size="small"
                      InputLabelProps={{
                        shrink: true,
                        style: { fontSize: "16px", fontWeight: "bold" },
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          height: "30px",
                          padding: "0px 10px",
                        },
                      }}
                      inputProps={{
                        onInput: validateNumericInput,
                        style: { textAlign: "right" },
                      }}
                    />
                  </Grid>
                </Grid>
              </div>

              <br></br>
              <div className="form-group  mobile-hidden">
                <div className="DeliveryOrderMainDiv">
                  <label
                    htmlFor="TDSAc"
                    style={{
                      marginTop: "5px",
                      fontWeight: "bold",
                      marginLeft: "10px", whiteSpace: "nowrap"
                    }}
                  >
                    TDS A/c :
                  </label>
                  <div className="debitCreditNote-col">
                    <div className="debitCreditNote-form-group">
                      <AccountMasterHelp
                        name="TDSAc"
                        Ac_type=""
                        onAcCodeClick={handleTDSAc}
                        CategoryName={lbltdsacname}
                        CategoryCode={newTDSAc || formData.TDSAc}
                        disabledFeild={!isEditing && addOneButtonEnabled}
                      />
                    </div>
                  </div>
                </div>

                <label htmlFor="TDSRate" style={{ fontWeight: "bold", whiteSpace: "nowrap", }}>
                  TDS Rate :
                </label>
                <input
                  type="text"
                  id="TDSRate"
                  Name="TDSRate"
                  autoComplete="off"
                  value={formData.TDSRate}
                  onChange={handleChange}
                  onKeyDown={handleKeyDownCalculations}
                  disabled={!isEditing && addOneButtonEnabled}
                  onInput={validateNumericInput}
                  style={{ width: "50px" }}
                />
                <input
                  type="text"
                  id="TDSAmt"
                  Name="TDSAmt"
                  autoComplete="off"
                  value={formData.TDSAmt}
                  onChange={handleChange}
                  onKeyDown={handleKeyDownCalculations}
                  disabled={!isEditing && addOneButtonEnabled}
                  onInput={validateNumericInput}
                  style={{ width: "80px" }}
                />

                <div style={{ display: "flex", alignItems: "center" }}>
                  <label
                    htmlFor="TDSCut"
                    className="DeliveryOrderLabel"
                    style={{ marginRight: "10px" }}
                  >
                    Tds cut by us:
                  </label>
                  <input
                    type="checkbox"
                    id="TDSCut"
                    name="TDSCut"
                    autoComplete="off"
                    value={formData.TDSCut}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                  />
                </div>

                <label
                  htmlFor="Cash_diff"
                  style={{ fontWeight: "bold", marginLeft: "10px", whiteSpace: "nowrap", }}
                >
                  BP :
                </label>
                <input
                  type="text"
                  id="Cash_diff"
                  Name="Cash_diff"
                  autoComplete="off"
                  value={formData.Cash_diff}
                  onChange={handleChange}
                  onKeyDown={handleKeyDownCalculations}
                  disabled={!isEditing && addOneButtonEnabled}
                  onInput={validateNumericInput}
                  style={{ width: "80px" }}
                />

                <label
                  htmlFor="CashDiffAc"
                  style={{ fontWeight: "bold", marginLeft: "10px", whiteSpace: "nowrap", }}
                >
                  B.P Ac :
                </label>
                <AccountMasterHelp
                  name="CashDiffAc"
                  Ac_type=""
                  onAcCodeClick={handleCashDiffAc}
                  CategoryName={tenderDetails.buyername || lblcashdiffacname}
                  CategoryCode={tenderDetails.Buyer || newCashDiffAc}
                  disabledFeild={!isEditing && addOneButtonEnabled}
                />
              </div>

              <div
                className="form-group mobile-hidden"
                style={{ marginTop: "2px" }}
              >
                <label
                  htmlFor="vasuli_rate"
                  style={{ fontWeight: "bold", marginLeft: "10px", whiteSpace: "nowrap" }}
                >
                  Vasuli :
                </label>
                <input
                  type="text"
                  id="vasuli_rate"
                  Name="vasuli_rate"
                  autoComplete="off"
                  value={formData.vasuli_rate}
                  onChange={handleChange}
                  onKeyDown={handleKeyDownCalculations}
                  disabled={!isEditing && addOneButtonEnabled}
                  style={{ width: "50px" }}
                />
                <input
                  type="text"
                  id="vasuli_amount"
                  Name="vasuli_amount"
                  autoComplete="off"
                  value={formData.vasuli_amount}
                  onChange={handleChange}
                  disabled={!isEditing && addOneButtonEnabled}
                  style={{ width: "80px" }}
                />
                {/* <label htmlFor="vasuli_rate1" className="DeliveryOrderLabel">Vasuli Rate1 :</label>
                <input
                  type="text"
                  id="vasuli_rate1"
                  Name="vasuli_rate1"
                  autoComplete="off"
                  value={formData.vasuli_rate1}
                  onChange={handleChange}
                  onKeyDown={handleKeyDownCalculations}
                  disabled={!isEditing && addOneButtonEnabled}
                  style={{ width: "50px", marginLeft: "5px", marginTop: "5px" }}
                />

                <input
                  type="text"
                  id="vasuli_amount1"
                  Name="vasuli_amount1"
                  autoComplete="off"
                  value={formData.vasuli_amount1}
                  onChange={handleChange}
                  disabled={!isEditing && addOneButtonEnabled}
                  style={{ width: "80px", marginTop: "5px" }}
                /> */}
                <label
                  htmlFor="Vasuli_Ac"
                  style={{ fontWeight: "bold", marginLeft: "10px", whiteSpace: "nowrap" }}
                >
                  Vasuli A/c :
                </label>
                <div style={{ width: isMobile ? "100%" : undefined }}>
                  <AccountMasterHelp
                    name="Vasuli_Ac"
                    Ac_type=""
                    onAcCodeClick={handleVasuli_Ac}
                    CategoryName={lblvasuliacname}
                    CategoryCode={newVasuli_Ac}
                    disabledFeild={!isEditing && addOneButtonEnabled}
                  />
                </div>
                <label
                  htmlFor="DO"
                  style={{ fontWeight: "bold", marginLeft: "10px", whiteSpace: "nowrap" }}
                >
                  DO :
                </label>
                <AccountMasterHelp
                  name="DO"
                  Ac_type=""
                  onAcCodeClick={handleDO}
                  CategoryName={tenderDetails.tenderdoname || lblDoname}
                  CategoryCode={tenderDetails.Tender_DO || newDO}
                  disabledFeild={!isEditing && addOneButtonEnabled}
                />
              </div>

              <div className=" mobile-hidden">
                <Grid container spacing={2}>
                  <Grid item xs={1}>
                    <CustomTextFeild
                      fullWidth
                      label="Mill Eway Bill No."
                      type="text"
                      id="MillEwayBill"
                      name="MillEwayBill"
                      autoComplete="off"
                      value={formData.MillEwayBill}
                      onChange={handleChange}
                      disabled={!isEditing && addOneButtonEnabled}
                      size="small"
                      InputLabelProps={{
                        shrink: true,
                        style: { fontSize: "16px", fontWeight: "bold" },
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          height: "30px",
                          padding: "0px 10px",
                        },
                      }}
                    />
                  </Grid>

                  <Grid item xs={2}>
                    <CustomTextFeild
                      fullWidth
                      label="Mill Invoice No"
                      type="text"
                      id="MillInvoiceNo"
                      name="MillInvoiceNo"
                      autoComplete="off"
                      value={formData.MillInvoiceNo}
                      onChange={handleChange}
                      disabled={!isEditing && addOneButtonEnabled}
                      size="small"
                      InputLabelProps={{
                        shrink: true,
                        style: { fontSize: "16px", fontWeight: "bold" },
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          height: "30px",
                          padding: "0px 10px",
                        },
                      }}
                    />
                  </Grid>

                  <Grid item xs={1}>
                    <TextField
                      fullWidth
                      label="Mill inv date"
                      type="date"
                      id="mill_inv_date"
                      name="mill_inv_date"
                      autoComplete="off"
                      value={formData.mill_inv_date}
                      onChange={handleChange}
                      disabled={!isEditing && addOneButtonEnabled}
                      size="small"
                      InputLabelProps={{
                        style: { fontSize: "12px" },
                      }}
                      InputProps={{
                        style: { fontSize: "12px", height: "35px" },
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          height: "30px",
                          padding: "0px 10px",
                        },
                      }}
                    />
                  </Grid>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginTop: "10px",
                    }}
                  >
                    <label
                      htmlFor="TDSCut"
                      className="DeliveryOrderLabel"
                      style={{ marginLeft: "10px" }}
                    >
                      EWay Bill Check :
                    </label>
                    <input
                      type="checkbox"
                      id="EWayBillChk"
                      Name="EWayBillChk"
                      label="EWayBillChk"
                      value={formData.EWayBillChk}
                      onChange={handleChange}
                      disabled={!isEditing && addOneButtonEnabled}
                      style={{ marginLeft: "10px" }}
                    />
                  </div>

                  <Grid item xs={2}>
                    <CustomTextFeild
                      fullWidth
                      label="EWay Bill No"
                      type="text"
                      id="EWay_Bill_No"
                      name="EWay_Bill_No"
                      autoComplete="off"
                      value={formData.EWay_Bill_No}
                      onChange={handleChange}
                      disabled={!isEditing && addOneButtonEnabled}
                      size="small"
                      InputLabelProps={{
                        shrink: true,
                        style: { fontSize: "16px", fontWeight: "bold" },
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          height: "30px",
                          padding: "0px 10px",
                        },
                      }}
                    />
                  </Grid>

                  <Grid item xs={1}>
                    <TextField
                      fullWidth
                      label="Eway Bill Valid Date"
                      type="date"
                      id="EwayBillValidDate"
                      name="EwayBillValidDate"
                      autoComplete="off"
                      value={formData.EwayBillValidDate}
                      onChange={handleChange}
                      disabled={!isEditing && addOneButtonEnabled}
                      size="small"
                      InputLabelProps={{
                        style: { fontSize: "16px", fontWeight: "bold" },
                      }}
                      InputProps={{
                        style: { fontSize: "16px", height: "35px" },
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          height: "30px",
                          padding: "0px 10px",
                        },
                      }}
                    />
                  </Grid>
                </Grid>
              </div>
              <div>
                <Grid container spacing={2} mt={1} className="mobile-hidden">
                  <div
                    className="DeliveryOrderMainDiv"
                    style={{ marginTop: "10px" }}
                  >
                    <label
                      htmlFor="Broker"
                      style={{ marginLeft: "20px", fontWeight: "bold" }}
                    >
                      Broker :
                    </label>
                    <div className="debitCreditNote-col">
                      <div className="debitCreditNote-form-group">
                        <AccountMasterHelp
                          name="broker"
                          Ac_type=""
                          onAcCodeClick={handlebroker}
                          CategoryName={
                            ChangeData
                              ? brokerTitle
                              : tenderDetails.buyerpartyname ||
                              brokerTitle ||
                              lblbrokername
                          }
                          CategoryCode={
                            ChangeData
                              ? CarporateState.broker
                              : tenderDetails.Buyer_Party || newbroker
                          }
                          disabledFeild={!isEditing && addOneButtonEnabled}
                        />
                      </div>
                    </div>
                  </div>

                  <Grid item xs={1}>
                    <CustomTextFeild
                      fullWidth
                      label="Distance"
                      type="text"
                      id="Distance"
                      name="Distance"
                      autoComplete="off"
                      value={formData.Distance}
                      onChange={handleChange}
                      disabled={!isEditing && addOneButtonEnabled}
                      size="small"
                      InputLabelProps={{
                        shrink: true,
                        style: { fontSize: "16px", fontWeight: "bold" },
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          height: "30px",
                          padding: "0px 10px",
                        },
                      }}
                      inputProps={{
                        onInput: validateNumericInput,
                        style: { textAlign: "right" },
                      }}
                    />
                  </Grid>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginTop: "10px",
                    }}
                  >
                    <label
                      htmlFor="TDSCut"
                      className="DeliveryOrderLabel"
                      style={{ marginLeft: "20px" }}
                    >
                      Invoice checked :
                    </label>
                    <input
                      type="checkbox"
                      id="mill_rcv"
                      Name="mill_rcv"
                      autoComplete="off"
                      value={formData.mill_rcv}
                      onChange={handleChange}
                      disabled={!isEditing && addOneButtonEnabled}
                      style={{ marginLeft: "15px" }}
                    />
                  </div>

                  <label>{season}</label>

                  <Grid item xs={1}>
                    <CustomTextFeild
                      fullWidth
                      label="SB Other Amount"
                      type="text"
                      id="SB_Other_Amount"
                      name="SB_Other_Amount"
                      autoComplete="off"
                      value={formData.SB_Other_Amount}
                      onChange={handleChange}
                      disabled={!isEditing && addOneButtonEnabled}
                      size="small"
                      InputLabelProps={{
                        shrink: true,
                        style: { fontSize: "16px", fontWeight: "bold" },
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          height: "30px",
                          padding: "0px 10px",
                        },
                      }}
                      inputProps={{
                        onInput: validateNumericInput,
                        style: { textAlign: "right" },
                      }}
                    />
                  </Grid>

                  <Grid item xs={2}>
                    <CustomTextFeild
                      fullWidth
                      label="UTR Narration"
                      type="text"
                      id="narration1"
                      name="narration1"
                      autoComplete="off"
                      value={formData.narration1}
                      onChange={handleChange}
                      disabled={!isEditing && addOneButtonEnabled}
                      size="small"
                      InputLabelProps={{
                        shrink: true,
                        style: { fontSize: "16px", fontWeight: "bold" },
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          height: "30px",
                          padding: "0px 10px",
                        },
                      }}
                    />
                  </Grid>

                  <Grid item xs={2}>
                    <CustomTextFeild
                      fullWidth
                      label="B.P Narration"
                      type="text"
                      id="narration2"
                      name="narration2"
                      autoComplete="off"
                      value={formData.narration2}
                      onChange={handleChange}
                      disabled={!isEditing && addOneButtonEnabled}
                      size="small"
                      InputLabelProps={{
                        shrink: true,
                        style: { fontSize: "16px", fontWeight: "bold" },
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          height: "30px",
                          padding: "0px 10px",
                        },
                      }}
                    />
                  </Grid>
                </Grid>
              </div>

              <br></br>
              <div>
                <Grid container spacing={1} mt={-2} className="mobile-hidden">
                  <Grid item xs={2}>
                    <CustomTextFeild
                      fullWidth
                      label="DO Narration"
                      type="text"
                      id="narration3"
                      name="narration3"
                      autoComplete="off"
                      value={formData.narration3}
                      onChange={handleChange}
                      disabled={!isEditing && addOneButtonEnabled}
                      size="small"
                      InputLabelProps={{
                        shrink: true,
                        style: { fontSize: "16px", fontWeight: "bold" },
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          height: "30px",
                          padding: "0px 10px",
                        },
                      }}
                    />
                  </Grid>

                  <Grid item xs={2}>
                    <CustomTextFeild
                      fullWidth
                      label="Narration 4"
                      type="text"
                      id="narration4"
                      name="narration4"
                      autoComplete="off"
                      value={formData.narration4}
                      onChange={handleChange}
                      disabled={!isEditing && addOneButtonEnabled}
                      size="small"
                      InputLabelProps={{
                        shrink: true,
                        style: { fontSize: "16px", fontWeight: "bold" },
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          height: "30px",
                          padding: "0px 10px",
                        },
                      }}
                    />
                  </Grid>

                  <Grid item xs={2}>
                    <CustomTextFeild
                      fullWidth
                      label="Freight Narration"
                      type="text"
                      id="narration5"
                      name="narration5"
                      autoComplete="off"
                      value={formData.narration5}
                      onChange={handleChange}
                      disabled={!isEditing && addOneButtonEnabled}
                      size="small"
                      InputLabelProps={{
                        shrink: true,
                        style: { fontSize: "16px", fontWeight: "bold" },
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          height: "30px",
                          padding: "0px 10px",
                        },
                      }}
                    />
                  </Grid>

                  <Grid item xs={2}>
                    <CustomTextFeild
                      fullWidth
                      label="SB Narration"
                      type="text"
                      id="SBNarration"
                      name="SBNarration"
                      autoComplete="off"
                      value={formData.SBNarration}
                      onChange={handleChange}
                      disabled={!isEditing && addOneButtonEnabled}
                      size="small"
                      InputLabelProps={{
                        shrink: true,
                        style: { fontSize: "16px", fontWeight: "bold" },
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          height: "30px",
                          padding: "0px 10px",
                        },
                      }}
                    />
                  </Grid>
                </Grid>
              </div>

              <div className="form-group">
                {/* <label htmlFor="MailSend">mail send:</label> */}
                <label id="lblMailsend"></label>
              </div>

              <br></br>

              <div className="form-group">
                <Grid
                  container
                  spacing={1}
                  alignItems="center"
                  wrap="nowrap"
                  mt={2}
                >
                  {/* Voucher No */}
                  {/* <Grid item sm={1}>
                    <TextField
                      label="Voucher No"
                      id="voucher_no"
                      name="voucher_no"
                      value={formData.voucher_no}
                      onClick={() => handleRowClick(formData.voucher_no, formData.voucher_type)}
                      fullWidth
                      InputProps={{
                        readOnly: true,
                        sx: {
                          cursor: 'pointer',
                          fontSize: '12px',
                          height: '36px',
                          padding: '0 10px',
                        }
                      }}
                      InputLabelProps={{
                        style: { fontSize: "14px" }
                      }}
                      variant="outlined"
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          height: '36px',
                        },
                      }}
                    />
                  </Grid> */}

                  <Grid item sm={1}>
                    <Box
                      display="flex"
                      alignItems="center"
                      height="36px"
                      sx={{ padding: "0 10px" }}

                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: "16px",
                          color: "blue",
                          fontWeight: 500,
                          marginRight: 1,
                          whiteSpace: "nowrap",
                        }}
                      >
                        Voucher No.:
                      </Typography>
                      <Box
                        sx={{
                          backgroundColor: "#fff8dc",
                          color: "#0d441d",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontSize: "16px",
                          cursor: "pointer",
                          fontWeight: "bold",
                          borderRadius: "8px",
                          border: "1px solid #ffd700",
                        }}
                        onClick={() =>
                          handleRowClick(
                            formData.voucher_no,
                            formData.voucher_type,
                          )
                        }
                      >
                        {formData.voucher_no}
                      </Box>
                      {isMobile && (
                        <Box
                          sx={{
                            color: "#0d441d",
                            fontWeight: "bold",
                            fontSize: "12px",
                            ml: "6px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formData.voucher_type}
                        </Box>
                      )}
                    </Box>
                  </Grid>

                  <Grid item sm={0.5} ml={2} className="mobile-hidden">
                    <Box
                      sx={{
                        // backgroundColor: 'yellow',
                        color: "#fff",
                        borderRadius: "4px",
                        fontSize: "16px",
                        cursor: "pointer",
                        color: "#0d441d",
                        fontWeight: "bold",
                        ml: isMobile ? "20px" : "1px",
                      }}
                    >
                      {formData.voucher_type}
                    </Box>
                  </Grid>

                  <Grid item sm={1}>
                    <Box
                      display="flex"
                      alignItems="center"
                      height="36px"
                      sx={{ padding: "0 10px" }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: "16px",
                          fontWeight: 500,
                          marginRight: 2,
                          whiteSpace: "nowrap",
                          color: "blue",
                        }}
                      >
                        Sale Bill No.:
                      </Typography>
                      <Box
                        mr={-10}
                        sx={{
                          backgroundColor: "#fff8dc",
                          color: "#fff",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontSize: "16px",
                          fontWeight: "bold",
                          color: "#0d441d",
                          marginRight: "20px",
                          borderRadius: "8px",
                          border: "1px solid #ffd700",
                          cursor:
                            !isEditing && addOneButtonEnabled
                              ? "pointer"
                              : "default",
                        }}
                        onClick={() => {
                          if (
                            !isEditing &&
                            addOneButtonEnabled &&
                            formData.SB_No
                          ) {
                            handleRowClick(formData.SB_No, "SB");
                          }
                        }}
                      >
                        {formData.SB_No}
                      </Box>
                    </Box>
                  </Grid>

                  <Grid
                    item
                    xs={isMobile ? 12 : "auto"}
                    sm="auto"
                    ml={isMobile ? 0 : 4}
                    mt={isMobile ? 1 : 0}
                  >
                    <button
                      className={`btn btn-primary sb-generate-button ${formData.SB_No !== 0 || isLoading ? "disabled" : ""}`}
                      onClick={handleSBGenerate}
                      disabled={
                        formData.SB_No !== 0 ||
                        isEditing ||
                        formData.tenderdetailid === null ||
                        formData.desp_type === "DO"

                      }
                      style={{
                        width: isMobile ? "100%" : "auto",
                        fontSize: isMobile ? "12px" : "14px",
                        padding: isMobile ? "6px 10px" : "6px 16px",
                        height: isMobile ? "34px" : "auto",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {isLoading ? (
                        <span
                          className="spinner-border spinner-border-sm"
                          role="status"
                          aria-hidden="true"
                        />
                      ) : (
                        "SB Generate"
                      )}
                    </button>
                  </Grid>

                  <Grid item sm="auto">
                    <SaleBillReport
                      doc_no={formData.SB_No}
                      disabledFeild={
                        formData.SB_No === 0 || formData.SB_No === ""
                      }
                    />
                  </Grid>

                  <Grid item sm="auto">
                    <CarporateSaleBillPrint
                      doc_no={formData.SB_No}
                      disabledFeild={
                        !addOneButtonEnabled ||
                        !(formData.SB_No != 0 && formData.SB_No !== "") ||
                        !(
                          formData.Freight_Amount != 0 &&
                          formData.Freight_Amount !== ""
                        )
                      }
                    />
                  </Grid>
                </Grid>
              </div>

              <div
                className="form-group"
                style={{
                  marginTop: "10px",
                  alignItems: isMobile ? "flex-start" : undefined,
                  flexDirection: isMobile ? "column" : undefined,
                  gap: isMobile ? "8px" : undefined,
                }}
              >
                <DeliveryOrderOurDoReport
                  doc_no={formData.doc_no}
                  disabledFeild={isEditing || !addOneButtonEnabled}
                />
                {/* <DeliveryOrderOurDOForReport doc_no={formData.doc_no} disabledFeild={isEditing || !addOneButtonEnabled} /> */}
                <PartyBillDoReport
                  doc_no={formData.doc_no}
                  disabledFeild={isEditing || !addOneButtonEnabled}
                />
                <PartyDOReport
                  doc_no={formData.doc_no}
                  disabledFeild={
                    !(
                      Company_Name?.substring(0, 2).toUpperCase() === "JK" &&
                      addOneButtonEnabled
                    )
                  }
                />
                {/* <CarporateSaleBillPrint doc_no={formData.SB_No} disabledFeild={
                  !addOneButtonEnabled ||
                  !(formData.SB_No != 0 && formData.SB_No !== "") ||
                  !(formData.Freight_Amount != 0 && formData.Freight_Amount !== "")
                } /> */}
                {/* Generate EwayBill Button */}
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => handleGenerateEwayBill()}
                  disabled={
                    isEditingOrNoSB ||
                    isEwayGenerated ||
                    isBothNotGenerated ||
                    formData.tenderdetailid === null
                  }
                  style={{ whiteSpace: "nowrap" }}
                >
                  Generate EwayBill
                </Button>

                {/* Generate EInvoice Button */}
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => handleGenerateEInvoice()}
                  disabled={
                    isEditingOrNoSB ||
                    isEInvoiceGenerated ||
                    isBothNotGenerated ||
                    formData.tenderdetailid === null
                  }
                  style={{ whiteSpace: "nowrap" }}
                >
                  Generate eInvoice
                </Button>

                {/* Generate EInvoice and Ewaybill Button */}
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => handleGenerateEInvoiceEwaybill()}
                  disabled={
                    isEditingOrNoSB ||
                    isEInvoiceGenerated ||
                    isEwayGenerated ||
                    formData.tenderdetailid === null
                  }
                  style={{ whiteSpace: "nowrap" }}
                >
                  Generate eInvoice and eWaybill
                </Button>

                {/* Dialogs for Ewaybill, EInvoice, and EInvoice+Ewaybill */}
                <Dialog
                  open={isOpenEwayBill}
                  onClose={handleCloseEwayBill}
                  maxWidth={650}
                >
                  <DialogTitle style={{ textAlign: "center" }}>
                    EwayBill Generation
                  </DialogTitle>
                  <IconButton
                    edge="end"
                    color="inherit"
                    onClick={handleCloseEwayBill}
                    aria-label="close"
                    style={{
                      position: "absolute",
                      right: 30,
                      top: 8,
                      backgroundColor: "#555",
                    }}
                  >
                    <CloseIcon />
                  </IconButton>
                  <DialogContent>
                    <EwayBillGeneration
                      doc_no={formData.SB_No}
                      do_no={formData.doc_no}
                      tran_type={"SB"}
                      handleClose={handleCloseEwayBill}
                      Company_Code={companyCode}
                      Year_Code={Year_Code}
                    />
                  </DialogContent>
                </Dialog>

                <Dialog
                  open={isOpenEInvoice}
                  onClose={handleCloseEInvoice}
                  maxWidth={650}
                >
                  <DialogTitle style={{ textAlign: "center" }}>
                    E-Invoice Generation
                  </DialogTitle>
                  <IconButton
                    edge="end"
                    color="inherit"
                    onClick={handleCloseEInvoice}
                    aria-label="close"
                    style={{
                      position: "absolute",
                      right: 30,
                      top: 8,
                      backgroundColor: "#555",
                    }}
                  >
                    <CloseIcon />
                  </IconButton>
                  <DialogContent>
                    <EInvoiceGeneration
                      doc_no={formData.SB_No}
                      do_no={formData.doc_no}
                      tran_type={"SB"}
                      handleClose={handleCloseEInvoice}
                      Company_Code={companyCode}
                      Year_Code={Year_Code}
                    />
                  </DialogContent>
                </Dialog>

                <Dialog
                  open={isOpenEInvoiceEwaybill}
                  onClose={handleCloseEInvoiceEwaybill}
                  maxWidth={650}
                >
                  <DialogTitle style={{ textAlign: "center" }}>
                    E-Invoice Generation
                  </DialogTitle>
                  <IconButton
                    edge="end"
                    color="inherit"
                    onClick={handleCloseEInvoiceEwaybill}
                    aria-label="close"
                    style={{
                      position: "absolute",
                      right: 30,
                      top: 8,
                      backgroundColor: "#555",
                    }}
                  >
                    <CloseIcon />
                  </IconButton>
                  <DialogContent>
                    <EInvoiceEwayBillGeneration
                      doc_no={formData.SB_No}
                      do_no={formData.doc_no}
                      tran_type={"SB"}
                      handleClose={handleCloseEInvoiceEwaybill}
                      Company_Code={companyCode}
                      Year_Code={Year_Code}
                    />
                  </DialogContent>
                </Dialog>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => window.open("/pending-sb-list", "_blank")}
                  style={{ marginBottom: "10px", marginTop: "10px" }}
                >
                  Show Pending Sale Bills
                </Button>
                {!isMobile && (
                  <ProformaInvoice
                    doc_no={formData.doc_no}
                    disabledFeild={
                      !addOneButtonEnabled ||
                      !(formData.SB_No === 0 || formData.SB_No === "")
                    }
                  />
                )}
              </div>

              <div
                className="form-group  mobile-hidden"
                style={{ marginTop: "10px" }}
              >
                <Grid item xs={2}>
                  <CustomTextFeild
                    fullWidth
                    label="Purchase CGT Amount"
                    type="text"
                    id="PurchaseCSGTamt"
                    name="PurchaseCSGTamt"
                    autoComplete="off"
                    value={formData.PurchaseCSGTamt}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    size="small"
                    InputLabelProps={{
                      shrink: true,
                      style: { fontSize: "16px", fontWeight: "bold" },
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        height: "30px",
                        padding: "0px 10px",
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={2}>
                  <CustomTextFeild
                    fullWidth
                    label="Purchase SGST Amount"
                    type="text"
                    id="PurchaseSGSTamt"
                    name="PurchaseSGSTamt"
                    autoComplete="off"
                    value={formData.PurchaseSGSTamt}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    size="small"
                    InputLabelProps={{
                      shrink: true,
                      style: { fontSize: "16px", fontWeight: "bold" },
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        height: "30px",
                        padding: "0px 10px",
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={2}>
                  <CustomTextFeild
                    fullWidth
                    label="Purchase IGST Amount"
                    type="text"
                    id="PurchaseIGSTamt"
                    name="PurchaseIGSTamt"
                    autoComplete="off"
                    value={formData.PurchaseIGSTamt}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    size="small"
                    InputLabelProps={{
                      shrink: true,
                      style: { fontSize: "16px", fontWeight: "bold" },
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        height: "30px",
                        padding: "0px 10px",
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={2}>
                  <CustomTextFeild
                    fullWidth
                    label="Purchase TCS Amount"
                    type="text"
                    id="PurchaseTCSamt"
                    name="PurchaseTCSamt"
                    autoComplete="off"
                    value={formData.PurchaseTCSamt}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    size="small"
                    InputLabelProps={{
                      shrink: true,
                      style: { fontSize: "16px", fontWeight: "bold" },
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        height: "30px",
                        padding: "0px 10px",
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={2}>
                  <CustomTextFeild
                    fullWidth
                    label="Purchase TDS Amount"
                    type="text"
                    id="PurchaseTDSamt"
                    name="PurchaseTDSamt"
                    autoComplete="off"
                    value={formData.PurchaseTDSamt}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    size="small"
                    InputLabelProps={{
                      shrink: true,
                      style: { fontSize: "16px", fontWeight: "bold" },
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        height: "30px",
                        padding: "0px 10px",
                      },
                    }}
                  />
                </Grid>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>

      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner-container">
            <SaveUpdateSpinner />
          </div>
        </div>
      )}

      <div style={{ marginTop: "10px" }} className="mobile-hidden">
        <AddButton
          openPopup={openPopup}
          isEditing={isEditing}
          ref={addButtonRef}
          setFocusToFirstField={setFocusToFirstField}
        />
      </div>

      <div className=" mt-4">
        {showPopup && (
          <div className="deliverorder-modal" role="dialog">
            <div className="deliverorder-modal-dialog" role="document">
              <div className="deliverorder-modal-content">
                <div className="deliverorder-modal-header">
                  <h5 className="deliverorder-modal-title">
                    {selectedUser.id
                      ? "Update Delivery Order"
                      : "Add Delivery Order"}
                  </h5>
                  <button
                    type="button"
                    onClick={closePopup}
                    aria-label="Close"
                    style={{
                      width: "40px",
                      height: "45px",
                      borderRadius: "4px",
                    }}
                  >
                    <span aria-hidden="true">&times;</span>
                  </button>
                </div>
                <div className="deliverorder-modal-body">
                  <form>
                    <div className="deliverorder-row">
                      <label className="deliverorder-form-label">
                        DD Type :
                      </label>
                      <div className="deliverorder-form-group">
                        <select
                          id="ddType"
                          name="ddType"
                          value={formDataDetail.ddType}
                          onChange={handleChangeDetail}
                          disabled={!isEditing && addOneButtonEnabled}
                          className="deliverorder-form-control"
                        >
                          <option value="T">Transfer Letter</option>
                          <option value="D">Demand Draft</option>
                        </select>
                      </div>
                    </div>

                    <div className="deliverorder-row">
                      <label className="deliverorder-form-label">
                        Bank Code :
                      </label>
                      <div
                        className="deliverorder-form-group"
                        style={{ marginLeft: "-10px" }}
                      >
                        <AccountMasterHelp
                          onAcCodeClick={handleBankCode}
                          CategoryName={
                            tenderDetails.paymenttoname || bankcodeacname
                          }
                          CategoryCode={
                            tenderDetails.Payment_To ||
                            bankcode ||
                            formDataDetail.Bank_Code
                          }
                          name="Bank_Code"
                          Ac_type=""
                          disabledFeild={!isEditing && addOneButtonEnabled}
                          className="deliverorder-form-control"
                        />
                      </div>
                    </div>

                    <div className="deliverorder-row">
                      <label className="deliverorder-form-label">
                        Narration :
                      </label>
                      <div className="deliverorder-form-group">
                        <input
                          type="text"
                          className="deliverorder-form-control"
                          id="Narration"
                          name="Narration"
                          value={formDataDetail.Narration}
                          onChange={handleChangeDetail}
                          disabled={!isEditing && addOneButtonEnabled}
                        />
                      </div>
                    </div>

                    <div className="deliverorder-row">
                      <label className="deliverorder-form-label">
                        Amount :
                      </label>
                      <div className="deliverorder-form-group">
                        <input
                          type="text"
                          className="deliverorder-form-control"
                          id="Amount"
                          name="Amount"
                          value={formDataDetail.Amount}
                          onChange={handleChangeDetail}
                          disabled={!isEditing && addOneButtonEnabled}
                        />
                      </div>
                    </div>

                    {/* <div className="deliverorder-row">
                      <label className="deliverorder-form-label">UTR_NO :</label>
                      <div className="deliverorder-form-group">
                        <input
                          type="text"
                          className="deliverorder-form-control"
                          id="UTR_NO"
                          name="UTR_NO"
                          value={formDataDetail.UTR_NO}
                          onChange={handleChangeDetail}
                          disabled={!isEditing && addOneButtonEnabled}
                        />
                      </div>
                    </div> */}

                    <div className="deliverorder-row">
                      <label className="deliverorder-form-label">
                        UTR No :
                      </label>
                      <div
                        className="deliverorder-form-group"
                        style={{ marginLeft: "-10px" }}
                      >
                        <DoUtrNoHelp
                          name="UTR_NO"
                          companyCode={companyCode}
                          bankCode={
                            tenderDetails.Payment_To ||
                            bankcode ||
                            formDataDetail.Bank_Code
                          }
                          defaultUtrNo={formDataDetail.UTR_NO}
                          onUtrSelect={handleUTRNo}
                        />
                      </div>
                    </div>

                    <div className="deliverorder-row">
                      <label className="deliverorder-form-label">LTNo :</label>
                      <div className="deliverorder-form-group">
                        <input
                          type="text"
                          className="deliverorder-form-control"
                          id="LTNo"
                          name="LTNo"
                          value={formDataDetail.LTNo}
                          onChange={handleChangeDetail}
                          disabled={!isEditing && addOneButtonEnabled}
                        />
                      </div>
                    </div>
                  </form>
                </div>
                <div className="deliverorder-modal-footer">
                  {selectedUser.id ? (
                    <DetailUpdateButton updateUser={updateUser} />
                  ) : (
                    <DetailAddButtomCommon addUser={addUser} />
                  )}
                  <DetailCloseButton closePopup={closePopup} />
                </div>
              </div>
            </div>
          </div>
        )}

        <Table
          className="mt-4 mobile-hidden"
          bordered
          style={{ marginBottom: "60px", maxWidth: "70%" }}
        >
          <TableHead>
            <TableRow>
              <TableCell sx={headerCellStyle}>Actions</TableCell>
              <TableCell sx={headerCellStyle}>ID</TableCell>
              <TableCell sx={headerCellStyle}>DD Type</TableCell>
              <TableCell sx={headerCellStyle}>Bank Code</TableCell>
              <TableCell sx={headerCellStyle}>Bank Name</TableCell>
              <TableCell sx={headerCellStyle}>Narration</TableCell>
              <TableCell sx={headerCellStyle}>Amount</TableCell>
              <TableCell sx={headerCellStyle}>Utr No</TableCell>
              <TableCell sx={headerCellStyle}>Lot No</TableCell>
              <TableCell sx={headerCellStyle}>bc</TableCell>
              <TableCell sx={headerCellStyle}>dodetailId</TableCell>
              {/* <TableCell sx={headerCellStyle}>Rowaction</TableCell> */}
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user, index) => (
              <TableRow key={user.id}>
                <TableCell
                  sx={{
                    padding: "2px 4px",
                    textAlign: "center",
                    fontSize: "12px",
                  }}
                >
                  {user.rowaction === "add" ||
                    user.rowaction === "update" ||
                    user.rowaction === "Normal" ? (
                    <>
                      <EditButton
                        editUser={editUser}
                        user={user}
                        isEditing={isEditing}
                      />
                      <DeleteButton
                        deleteModeHandler={deleteModeHandler}
                        user={user}
                        isEditing={isEditing}
                        disabled={!isEditing || index === 0}
                      />
                    </>
                  ) : user.rowaction === "DNU" ||
                    user.rowaction === "delete" ? (
                    <OpenButton openDelete={openDelete} user={user} />
                  ) : null}
                </TableCell>
                <TableCell
                  sx={{
                    padding: "2px 4px",
                    textAlign: "center",
                    fontSize: "12px",
                  }}
                >
                  {user.id}
                </TableCell>
                <TableCell
                  sx={{
                    padding: "2px 4px",
                    textAlign: "center",
                    fontSize: "12px",
                  }}
                >
                  {user.ddType}
                </TableCell>
                <TableCell
                  sx={{
                    padding: "2px 4px",
                    textAlign: "center",
                    fontSize: "12px",
                  }}
                >
                  {user.Bank_Code || tenderDetails.Payment_To}
                </TableCell>
                <TableCell
                  sx={{
                    padding: "2px 4px",
                    textAlign: "center",
                    fontSize: "12px",
                  }}
                >
                  {user.bankcodeacname || tenderDetails.paymenttoname}
                </TableCell>
                <TableCell
                  sx={{
                    padding: "2px 4px",
                    textAlign: "center",
                    fontSize: "12px",
                  }}
                >
                  {user.Narration}
                </TableCell>
                <TableCell
                  sx={{
                    padding: "2px 4px",
                    textAlign: "center",
                    fontSize: "12px",
                  }}
                >
                  {formatReadableAmount(user.Amount)}
                </TableCell>
                <TableCell
                  sx={{
                    padding: "2px 4px",
                    textAlign: "center",
                    fontSize: "12px",
                  }}
                >
                  {user.UTR_NO}
                </TableCell>
                <TableCell
                  sx={{
                    padding: "2px 4px",
                    textAlign: "center",
                    fontSize: "12px",
                  }}
                >
                  {user.LTNo}
                </TableCell>
                <TableCell
                  sx={{
                    padding: "2px 4px",
                    textAlign: "center",
                    fontSize: "12px",
                  }}
                >
                  {user.bc || tenderDetails.pt}
                </TableCell>
                <TableCell
                  sx={{
                    padding: "2px 4px",
                    textAlign: "center",
                    fontSize: "12px",
                  }}
                >
                  {user.dodetailid}
                </TableCell>
                {/* <TableCell sx={{ padding: '2px 4px', textAlign: 'center', fontSize: '12px' }}>{user.rowaction}</TableCell> */}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <br></br>

      {/* ── Pending Delivery Orders Modal ─────────────────────────────── */}
      <PendingDOSelectModal
        open={showPendingDOModal}
        onClose={() => { pendingDOModalOpenRef.current = false; setShowPendingDOModal(false); }}
        data={pendingDOList}
        onSelect={handleSelectPendingDORecord}
        loading={pendingDOLoading}
      />
    </>
  );

};
export default DeliveryOrder;