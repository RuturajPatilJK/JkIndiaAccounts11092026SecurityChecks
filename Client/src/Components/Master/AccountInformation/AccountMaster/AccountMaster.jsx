import React from "react";
import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ActionButtonGroup from "../../../../Common/CommonButtons/ActionButtonGroup";
import NavigationButtons from "../../../../Common/CommonButtons/NavigationButtons";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import GroupMasterHelp from "../../../../Helper/GroupMasterHelp";
import GSTStateMasterHelp from "../../../../Helper/GSTStateMasterHelp";
import CityMasterHelp from "../../../../Helper/CityMasterHelp";
import CityMaster from "../CityMaster/CityMaster";
import FinicialMaster from "../FinicialMasters/FinicialMaster";
import {
  Box,
  TextField,
  Select,
  MenuItem,
  Button,
  Modal,
  InputLabel,
  FormControl,
  TextareaAutosize,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper, Grid, Card, CardContent, Chip
} from "@mui/material";
import UserAuditInfo from "../../../../Common/UserAuditInfo/UserAuditInfo";
import RefreshIcon from "@mui/icons-material/Refresh";
import SaveUpdateSpinner from "../../../../Common/Spinners/SaveUpdateSpinner";
import Swal from "sweetalert2";
import io from "socket.io-client";
import { Prev } from "react-bootstrap/esm/PageItem";

var cityName;
var newCity_Code;
var grpName;
var newGroup_Code;
var gstStateName;
var newGSTStateCode;
var newAccoid;

const gstapiUrl =
  "https://www.ewaybills.com/MVEWBAuthenticate/MVAppSCommonSearchTP";
const gstKey = "bk59oPDpaGTtJa4";
const gstSecret = "EajrxDcIWLhGfRHLej7zjw==";
const gstIn = "27AAECJ8332R1ZV";


function TdsFileBadge({ acCode }) {
  const API_BASE = process.env.REACT_APP_API;
  const companyCode = sessionStorage.getItem("Company_Code");
  const yearCode = sessionStorage.getItem("Year_Code");
  const [info, setInfo] = useState(null);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    if (!acCode) { setInfo(null); return; }
    fetch(`${API_BASE}/tds-declaration-status?ac_code=${acCode}&company_code=${companyCode}&year_code=${yearCode}`)
      .then(r => r.json())
      .then(d => setInfo(d.success ? d : null))
      .catch(() => setInfo(null));
  }, [acCode, companyCode, yearCode]); // ← add companyCode and yearCode here

  if (!info?.has_file) return null;

  const previewUrl = `${API_BASE}/preview-tds-document/${info.TDS_declaration_id}`;
  const fileName = info.file_name || "tds_certificate.pdf";

  return (
    <>
      {/* ── Badge button ── */}
      <button
        type="button"
        onClick={() => setPreview(true)}
        title="View TDS Declaration Certificate"
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
          background: "linear-gradient(135deg, #10B981, #059669)",
          color: "#fff", border: "none", cursor: "pointer",
          boxShadow: "0 2px 8px rgba(16,185,129,0.35)",
          whiteSpace: "nowrap",
        }}
      >
        📄 TDS Certificate
      </button>

      {/* ── Preview Modal ── */}
      {preview && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
          zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            background: "#fff", borderRadius: 14,
            width: "80vw", height: "90vh",
            display: "flex", flexDirection: "column",
            boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
          }}>
            {/* header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "12px 20px", borderBottom: "1px solid #E5E7EB",
              background: "#F8FAFC", borderRadius: "14px 14px 0 0",
            }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>
                📄 TDS Declaration Certificate
              </span>
              <div style={{ display: "flex", gap: 8 }}>
                <a
                  href={previewUrl}
                  download={fileName}
                  style={{
                    padding: "5px 12px", borderRadius: 7, fontSize: 12, fontWeight: 500,
                    background: "#EFF6FF", color: "#1D4ED8",
                    border: "1px solid #BFDBFE", textDecoration: "none",
                    display: "inline-flex", alignItems: "center", gap: 4,
                  }}
                >
                  ⬇ Download
                </a>
                <button
                  onClick={() => setPreview(false)}
                  style={{
                    padding: "5px 10px", borderRadius: 7, fontSize: 13,
                    border: "1px solid #E5E7EB", background: "none",
                    cursor: "pointer", color: "#6B7280",
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* content — iframe for PDF */}
            <div style={{ flex: 1, overflow: "hidden", borderRadius: "0 0 14px 14px" }}>
              <iframe
                src={previewUrl}
                title="TDS Certificate"
                style={{ width: "100%", height: "100%", border: "none" }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const AccountMaster = () => {
  const companyCode = sessionStorage.getItem("Company_Code");
  const API_URL = process.env.REACT_APP_API;
  const socketURL = process.env.REACT_APP_API_URL;
  const username = sessionStorage.getItem("username");
  const User_Id = sessionStorage.getItem("User_ID");

  const [updateButtonClicked, setUpdateButtonClicked] = useState(false);
  const [saveButtonClicked, setSaveButtonClicked] = useState(false);
  const [addOneButtonEnabled, setAddOneButtonEnabled] = useState(false);
  const [saveButtonEnabled, setSaveButtonEnabled] = useState(true);
  const [cancelButtonEnabled, setCancelButtonEnabled] = useState(true);
  const [editButtonEnabled, setEditButtonEnabled] = useState(false);
  const [deleteButtonEnabled, setDeleteButtonEnabled] = useState(false);
  const [backButtonEnabled, setBackButtonEnabled] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [highlightedButton, setHighlightedButton] = useState(null);
  const [cancelButtonClicked, setCancelButtonClicked] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [accountCode, setAccountCode] = useState("");
  const [accountData, setAccountData] = useState({});
  const [accountDetail, setAccountDetail] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMode, setPopupMode] = useState("add");
  const [selectedUser, setSelectedUser] = useState({});
  const [deleteMode, setDeleteMode] = useState(false);
  const [groupData, setGroupData] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [pincode, setPinCode] = useState("");
  const [showCityPopup, setShowCityPopup] = useState(false);
  const cityMasterRef = useRef(null);
  const [cityMasterData, setCityMasterData] = useState("");
  const [showGroupPopup, setShowGroupPopup] = useState(false);
  const groupMasterRef = useRef(null);
  const [groupMasterData, setGroupMasterData] = useState("");
  const [city_data, setCityData] = useState("");
  const [gstDisabled, setGstDisabled] = useState(false);
  const drpType = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const selectedRecord = location.state?.selectedRecord;
  const accountMasterData = location.state?.accountMasterData;
  const permissions = location.state?.permissionsData;

  const searchParams = new URLSearchParams(location.search);
  const navigatedRecord = searchParams.get('navigatedRecord');

  const ref = useRef(null);
  const inputRef = useRef(null);
  const logoInputRef = useRef(null);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState('');

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      entries.forEach((entry) => { });
    });

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // const socket = io("wss://accounts-backend.ebuysugar.com", {
    const socket = io(`${socketURL}`, {
      transports: ["websocket"],
    });
    socket.on("account_added", (data) => {
      console.log("New Account Added:", data);
    });
    socket.on("account_updated", (data) => {
      console.log("Account Updated:", data);
    });

    return () => {
      socket.off("account_added");
      socket.off("account_updated");
    };
  }, []);
  const initialFormData = {
    Ac_Code: "",
    Ac_Name_E: "",
    Ac_Name_R: "",
    Ac_type: "P",
    Ac_rate: 0.0,
    Address_E: "",
    Address_R: "",
    City_Code: "",
    Pincode: "",
    Local_Lic_No: "",
    Tin_No: "",
    Cst_no: "",
    Gst_No: "",
    Email_Id: "",
    Email_Id_cc: "",
    Other_Narration: "",
    ECC_No: "",
    Bank_Name: "",
    Bank_Ac_No: "",
    Bank_Opening: 0.0,
    bank_Op_Drcr: "D",
    Opening_Balance: 0.0,
    Drcr: "D",
    Group_Code: 0,
    Created_By: "",
    Modified_By: "",
    Short_Name: "",
    Commission: 0.0,
    carporate_party: "N",
    referBy: "",
    OffPhone: "",
    Fax: "",
    CompanyPan: "",
    AC_Pan: "",
    Mobile_No: "",
    Is_Login: "",
    IFSC: "",
    Benificiary_Name: "",
    Branch_Name: "",
    Benificiary_Name1: "",
    Bank_Name1: "",
    Bank_Ac_No1: "",
    IFSC1: "",
    Branch_Name1: "",
    Company_Type: "",
    Vendor_Approved: "",
    FSSAI: "",
    Branch1OB: 0.0,
    Branch2OB: 0.0,
    Branch1Drcr: "D",
    Branch2Drcr: "D",
    Locked: 0,
    GSTStateCode: "",
    UnregisterGST: 0,
    Distance: 0.0,
    Bal_Limit: 0.0,
    bsid: 0,
    cityid: "",
    whatsup_no: "",
    company_code: companyCode,
    adhar_no: "",
    Limit_By: "N",
    Tan_no: "",
    TDSApplicable: "Y",
    PurchaseTDSApplicable: "Y",
    PanLink: "",
    Created_Date: new Date().toISOString().split("T")[0],
    Modified_Date: null,
    Our_Party: "N",
    Show_Ledger: "Y",
    Customer_Select_Party: "N"

    // Insurance: 0.0,
    // MsOms: "",
    // loadingbyus: "N",
    // payBankAc: "",
    // payIfsc: "",
    // PayBankName: "",
    // FrieghtOrMill: "",
    // BeneficiaryName: "",
    // payBankAc2: "",
    // payIfsc2: "",
    // PayBankName2: "",
    // BeneficiaryName2: "",
    // payBankAc3: "",
    // payIfsc3: "",
    // PayBankName3: "",
    // BeneficiaryName3: "",
    // SelectedBank: "",
    // VerifyAcNo: "",
    // VerifyAcNo2: "",
    // VerifyAcNo3: "",
    // TransporterId: "",
    // PurchaseTDSApplicable: "Y",
  };

  const [formData, setFormData] = useState(initialFormData);
  const [formDataDetail, setFormDataDetail] = useState({
    Person_Name: "",
    Person_Mobile: "",
    Person_Email: "",
    Person_Pan: "",
    Other: "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === "Gst_No") {
      setFormData((prevState) => ({
        ...prevState,
        [name]: value,
        CompanyPan: value.substring(2, value.length - 3).trim(),
      }));
    } else if (name === "Ac_Name_E") {
      setFormData((prevState) => ({
        ...prevState,
        [name]: value,
        Short_Name: value.substring(0, 15),
      }));
    } else {
      setFormData((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    }
  };

  const handleDetailChange = (event) => {
    const { name, value } = event.target;
    setFormDataDetail((prevState) => {
      const updatedFormData = { ...prevState, [name]: value };
      return updatedFormData;
    });
  };

  const handleCity_Code = (code, cityId, cityName, pinCode) => {
    setAccountCode(code);
    setPinCode(pinCode);
    setFormData({
      ...formData,
      City_Code: code,
      cityid: cityId,
      Pincode: pinCode,
    });
  };
  const handleGroup_Code = (code, name, bsId) => {
    setAccountCode(code);
    setFormData({
      ...formData,
      Group_Code: code,
      bsid: bsId,
    });
  };
  const handleGSTStateCode = (code) => {
    setAccountCode(code);
    setFormData({
      ...formData,
      GSTStateCode: code,
    });
  };

  const handleCheckbox = (e, valueType = "string") => {
    const { name, checked } = e.target;
    const value =
      valueType === "numeric" ? (checked ? 1 : 0) : checked ? "Y" : "N";

    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleLogoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be under 2MB.');
      e.target.value = '';
      return;
    }
    setLogoFile(file);
    setLogoPreviewUrl(URL.createObjectURL(file));
  };

  const handleLogoRemove = () => {
    setLogoFile(null);
    setLogoPreviewUrl('');
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  const convertBooleanToValue = (value, valueType = "string") => {
    if (typeof value === "boolean") {
      if (valueType === "numeric") {
        return value ? 1 : 0;
      } else {
        return value ? "Y" : "N";
      }
    }
    return value;
  };


  const validateForm = () => {
    const showError = (message) => {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: message,
        confirmButtonColor: '#d33'
      });
      return false;
    };

    if (!formData.Ac_Name_E.trim())
      return showError("Account Name is required.");

    if (!["C", "F", "E", "T", "OP", "EX"].includes(formData.Ac_type)) {
      if (!formData.GSTStateCode || formData.GSTStateCode === 0) {
        return showError("GST State Code is required.");
      }
    }

    if (!formData.Group_Code)
      return showError("Group Code is required.");

    if (["P", "S", "M", "I", "T"].includes(formData.Ac_type)) {
      if (!formData.City_Code) return showError("City Code is required.");
      if (!formData.Address_E.trim()) return showError("Address is required.");
    }

    if (formData.Ac_type === "BR" && !formData.Short_Name.trim()) {
      return showError("Short Name is required for Brokers.");
    }

    if (["P", "S"].includes(formData.Ac_type)) {
      if (formData.Bank_Opening > 0) {
        return showError("Bank Opening must be zero for Party or Supplier.");
      }
      if (formData.UnregisterGST !== 1) {
        if (!formData.Gst_No) return showError("GST Number is required.");
        if (!formData.CompanyPan) return showError("Company Pan is required.");
      }
    }

    if (["F", "I"].includes(formData.Ac_type)) {
      if (!formData.Short_Name.trim()) {
        return showError(
          "Short Name is required for Fixed Assets, Interest Party, and Transport."
        );
      }
      if (formData.Ac_rate <= 0) {
        return showError(
          "Interest Rate must be greater than zero for Fixed Assets, Interest Party, and Transport."
        );
      }
      // if (!formData.Ac_Name_R.trim()) {
      //   return showError(
      //     "Regional Name is required for Fixed Assets, Interest Party, and Transport."
      //   );
      // }
    }

    return true;
  };


  const isFieldEnabled = (fieldType) => {
    const yearCode = sessionStorage.getItem("Year_Code");
    const isEnabledForE = formData.Ac_type === "E";
    const isEnabledForEX = formData.Ac_type === "EX";
    const isEnabledForB = formData.Ac_type === "B";
    const isEnabledForP = formData.Ac_type === "P";
    const isEnabledForF = formData.Ac_type === "F";
    const isEnabledForC = formData.Ac_type === "C";
    const isEnabledForR = formData.Ac_type === "R";
    const isEnabledForT = formData.Ac_type === "O";
    const isEnabledForI = formData.Ac_type === "I";
    const isEnabledForOP = formData.Ac_type === "OP";
    const isEnabledForS = formData.Ac_type === "S"

    switch (fieldType) {
      case "Ac_Name_E":
      case "Ac_Name_R":
      case "commissionRate":
      case "Group_Code":
        return (
          isEnabledForE || isEnabledForT || isEnabledForOP || isEnabledForEX
        );

      case "Bank_Opening":
      case "bank_Op_Drcr":
        return isEnabledForB && String(yearCode) === "1";

      case "Opening_Balance":
      case "Drcr":
        return (isEnabledForB || isEnabledForP || isEnabledForS || isEnabledForOP) && String(yearCode) === "1";

      case "Local_Lic_No":
      case "Tan_no":
      case "FSSAI":
      case "carporate_party":
        return !(
          isEnabledForB ||
          isEnabledForC ||
          isEnabledForF ||
          isEnabledForE ||
          isEnabledForT ||
          isEnabledForOP ||
          isEnabledForEX
        );

      case "Limit_By":
        return !(
          isEnabledForB ||
          isEnabledForC ||
          isEnabledForF ||
          isEnabledForE ||
          isEnabledForT ||
          isEnabledForI ||
          isEnabledForR ||
          isEnabledForOP ||
          isEnabledForEX
        );

      case "Tin_No":
      case "Cst_no":
      case "Gst_No":
      case "Email_Id":
      case "Email_Id_cc":
      case "Other_Narration":
      case "ECC_No":
      case "Bank_Name":
      case "Bank_Ac_No":
      case "IFSC":
      case "Benificiary_Name":
      case "Branch_Name":
      case "Benificiary_Name1":
      case "Bank_Name1":
      case "Bank_Ac_No1":
      case "IFSC1":
      case "Branch_Name1":
      case "Mobile_No":
      case "OffPhone":
      case "Fax":
      case "CompanyPan":
      case "AC_Pan":
      case "whatsup_no":
      case "adhar_no":
      case "PanLink":
      case "Insurance":
      case "MsOms":
      case "payBankAc":
      case "payIfsc":
      case "PayBankName":
      case "FrieghtOrMill":
      case "Locked":
      case "GSTStateCode":
      case "UnregisterGST":
      case "Distance":
      case "Bal_Limit":
      case "referBy":
      case "Pincode":
      case "TransporterId":
      case "Address_E":
      case "Address_R":
      case "City_Code":
        return !(
          isEnabledForC ||
          isEnabledForF ||
          isEnabledForE ||
          isEnabledForT ||
          isEnabledForOP ||
          isEnabledForEX
        );

      case "Commission":
        return !(
          isEnabledForC ||
          isEnabledForB ||
          isEnabledForF ||
          isEnabledForR ||
          isEnabledForT
        );

      case "Ac_rate":
        return !isEnabledForE || !isEnabledForOP || !isEnabledForEX;

      default:
        return true;
    }
  };

  const validateNumericInput = (e) => {
    e.target.value = e.target.value.replace(/[^0-9.]/g, "");
  };

  const handleCheckboxAcGroups = (e, group) => {
    const { checked } = e.target;

    setSelectedGroups((prevSelected) => {
      if (checked) {
        return [...prevSelected, group.Category_Code];
      } else {
        return prevSelected.filter(
          (groupCode) => groupCode !== group.Category_Code
        );
      }
    });
  };


  const handleSearchClick = async () => {
    const cityApiUrl = `${API_URL}/get-citybyName`;
    const createCityUrl = `${API_URL}/create-city`;
    const taxpayerApiUrl = `${API_URL}/search-taxpayer`;
    const gstNo = formData.Gst_No;

    if (!gstNo || gstNo.trim() === "") {
      Swal.fire({
        icon: 'warning',
        title: 'GST Number Required',
        text: 'Please enter a valid GST Number before searching.',
      });
      return;
    }

    try {
      const response = await fetch(taxpayerApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ gstNo }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      if (
        data.Status === "1" &&
        data.lstAppSCommonSearchTPResponse.length > 0
      ) {
        const taxpayerDetails = data.lstAppSCommonSearchTPResponse[0];
        if (!taxpayerDetails.gstin) {
          toast.error(taxpayerDetails.Message || "No records found for this GSTIN.");
          return;
        }
        if (!taxpayerDetails.pradr || !taxpayerDetails.pradr.addr) {
          toast.error("GST address details not available for this GSTIN.");
          return;
        }
        const address = taxpayerDetails.pradr.addr;
        const concatenatedAddress = `${address.bno} ${address.bnm} ${address.st} ${address.flno} ${address.loc} ${address.pncd} ${address.stcd}`;
        const ac_name = taxpayerDetails.tradeNam;
        const refBy = taxpayerDetails.lgnm
        newGSTStateCode = taxpayerDetails.RequestedGSTIN.substring(0, 2).trim();
        if (newGSTStateCode.charAt(0) === '0' && newGSTStateCode.length > 1) {
          newGSTStateCode = newGSTStateCode.charAt(1);
        }
        const pincode = address.pncd;
        const city_name = address.loc;

        try {
          const cityResponse = await fetch(
            `${cityApiUrl}?city_name_e=${city_name}`
          );

          if (!cityResponse.ok) {
            if (cityResponse.status === 404) {
              const newCityData = {
                city_name_e: city_name,
                pincode: pincode,
                GstStateCode: newGSTStateCode
              };

              try {
                const createResponse = await fetch(
                  `${createCityUrl}?company_code=${companyCode}`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify(newCityData),
                  }
                );

                if (!createResponse.ok) {
                  throw new Error(
                    `Failed to create city. Status: ${createResponse.status}`
                  );
                }

                const createdCity = await createResponse.json();

                const citySearchAfterCreation = await fetch(
                  `${cityApiUrl}?city_name_e=${createdCity.city.city_name_e}`
                );

                if (!citySearchAfterCreation.ok) {
                  throw new Error(
                    `Failed to fetch city after creation. Status: ${citySearchAfterCreation.status}`
                  );
                }

                const createdCityData = await citySearchAfterCreation.json();

                setFormData((prevState) => ({
                  ...prevState,
                  Address_E: concatenatedAddress,
                  Ac_Name_E: ac_name,
                  GSTStateCode: newGSTStateCode,
                  Pincode: pincode,
                  City_Code: createdCityData.city_code,
                  cityid: createdCityData.cityid,
                  Short_Name: ac_name.substring(0, 15).trim(),
                  referBy: refBy
                }));

                setCityMasterData(createdCity);

                toast.success("City created and details updated.");
                setGstDisabled(true);
              } catch (createError) {
                console.error("Error creating city:", createError);
                toast.error("Error creating city.");
              }
            } else {
              throw new Error(
                `Error fetching city data. Status: ${cityResponse.status}`
              );
            }
          } else {
            const cityData = await cityResponse.json();
            setCityData(cityData);
            setFormData((prevState) => ({
              ...prevState,
              Address_E: concatenatedAddress,
              Ac_Name_E: ac_name,
              GSTStateCode: newGSTStateCode,
              Pincode: pincode,
              City_Code: cityData.city_code,
              cityid: cityData.cityid,
              Short_Name: ac_name.substring(0, 15).trim(),
              referBy: refBy
            }));
            setGstDisabled(true);
          }
        } catch (fetchCityError) {
          console.error("Error fetching city data:", fetchCityError);
          toast.error("Error fetching city data.");
        }
      } else {
        toast.error("No taxpayer details found.");
      }
    } catch (taxpayerError) {
      console.error("Error fetching taxpayer details:", taxpayerError);
      toast.error(`Error fetching taxpayer details: ${taxpayerError.message}`);
    } finally {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  };

  // const handleSearchClick = async () => {
  //   const cityApiUrl = `${API_URL}/get-citybyName`;
  //   const createCityUrl = `${API_URL}/create-city`;
  //   const gstNo = formData.Gst_No;

  //   if (!gstNo || gstNo.trim() === "") {
  //     Swal.fire({
  //       icon: 'warning',
  //       title: 'GST Number Required',
  //       text: 'Please enter a valid GST Number before searching.',
  //     });
  //     return;
  //   }

  //   const requestBody = {
  //     AppSCommonSearchTPItem: [
  //       {
  //         GSTIN: gstNo,
  //       },
  //     ],
  //   };

  //   try {
  //     const response = await fetch(gstapiUrl, {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //         MVApiKey: gstKey,
  //         MVSecretKey: gstSecret,
  //         GSTIN: gstIn,
  //       },
  //       body: JSON.stringify(requestBody),
  //     });

  //     if (!response.ok) {
  //       throw new Error(`HTTP error! Status: ${response.status}`);
  //     }

  //     const data = await response.json();

  //     if (
  //       data.Status === "1" &&
  //       data.lstAppSCommonSearchTPResponse.length > 0
  //     ) {
  //       const taxpayerDetails = data.lstAppSCommonSearchTPResponse[0];
  //       const address = taxpayerDetails.pradr.addr;
  //       const concatenatedAddress = `${address.bno} ${address.bnm} ${address.st} ${address.flno} ${address.loc} ${address.pncd} ${address.stcd}`;
  //       const ac_name = taxpayerDetails.tradeNam;
  //       const refBy = taxpayerDetails.lgnm
  //       newGSTStateCode = taxpayerDetails.RequestedGSTIN.substring(0, 2).trim();
  //       if (newGSTStateCode.charAt(0) === '0' && newGSTStateCode.length > 1) {
  //         newGSTStateCode = newGSTStateCode.charAt(1);
  //       }
  //       const pincode = address.pncd;
  //       const city_name = address.loc;

  //       try {
  //         const cityResponse = await fetch(
  //           `${cityApiUrl}?city_name_e=${city_name}`
  //         );

  //         if (!cityResponse.ok) {
  //           if (cityResponse.status === 404) {
  //             const newCityData = {
  //               city_name_e: city_name,
  //               pincode: pincode,
  //               GstStateCode: newGSTStateCode
  //             };

  //             try {
  //               const createResponse = await fetch(
  //                 `${createCityUrl}?company_code=${companyCode}`,
  //                 {
  //                   method: "POST",
  //                   headers: {
  //                     "Content-Type": "application/json",
  //                   },
  //                   body: JSON.stringify(newCityData),
  //                 }
  //               );

  //               if (!createResponse.ok) {
  //                 throw new Error(
  //                   `Failed to create city. Status: ${createResponse.status}`
  //                 );
  //               }

  //               const createdCity = await createResponse.json();

  //               const citySearchAfterCreation = await fetch(
  //                 `${cityApiUrl}?city_name_e=${createdCity.city.city_name_e}`
  //               );

  //               if (!citySearchAfterCreation.ok) {
  //                 throw new Error(
  //                   `Failed to fetch city after creation. Status: ${citySearchAfterCreation.status}`
  //                 );
  //               }

  //               const createdCityData = await citySearchAfterCreation.json();

  //               setFormData((prevState) => ({
  //                 ...prevState,
  //                 Address_E: concatenatedAddress,
  //                 Ac_Name_E: ac_name,
  //                 GSTStateCode: newGSTStateCode,
  //                 Pincode: pincode,
  //                 City_Code: createdCityData.city_code,
  //                 cityid: createdCityData.cityid,
  //                 Short_Name: ac_name.substring(0, 15).trim(),
  //                 referBy: refBy
  //               }));

  //               setCityMasterData(createdCity);

  //               toast.success("City created and details updated.");
  //               setGstDisabled(true);
  //             } catch (createError) {
  //               console.error("Error creating city:", createError);
  //               toast.error("Error creating city.");
  //             }
  //           } else {
  //             throw new Error(
  //               `Error fetching city data. Status: ${cityResponse.status}`
  //             );
  //           }
  //         } else {
  //           const cityData = await cityResponse.json();
  //           setCityData(cityData);
  //           setFormData((prevState) => ({
  //             ...prevState,
  //             Address_E: concatenatedAddress,
  //             Ac_Name_E: ac_name,
  //             GSTStateCode: newGSTStateCode,
  //             Pincode: pincode,
  //             City_Code: cityData.city_code,
  //             cityid: cityData.cityid,
  //             Short_Name: ac_name.substring(0, 15).trim(),
  //             referBy: refBy
  //           }));
  //           setGstDisabled(true);
  //         }
  //       } catch (fetchCityError) {
  //         console.error("Error fetching city data:", fetchCityError);
  //         toast.error("Error fetching city data.");
  //       }
  //     } else {
  //       toast.error("No taxpayer details found.");
  //     }
  //   } catch (taxpayerError) {
  //     console.error("Error fetching taxpayer details:", taxpayerError);
  //     toast.error(`Error fetching taxpayer details: ${taxpayerError.message}`);
  //   } finally {
  //     setTimeout(() => {
  //       inputRef.current?.focus();
  //     }, 0);
  //   }
  // };

  const handleAddCity = (event) => {
    event.preventDefault();
    setShowCityPopup(true);
  };

  const handleClosePopup = () => {
    setShowCityPopup(false);
  };

  const handleAddGroup = (event) => {
    event.preventDefault();
    setShowGroupPopup(true);
  };

  const handleCloseGroupPopup = () => {
    setShowGroupPopup(false);
  };

  const handleCitySave = async (event) => {
    event.preventDefault();
    if (cityMasterRef.current) {
      const cityData = cityMasterRef.current.getFormData();
      try {
        const response = await axios.post(
          `${API_URL}/create-city?company_code=${companyCode}`,
          cityData
        );
        toast.success("City created successfully!");
        setCityMasterData(response.data);

        handleCity_Code(
          response.data.city.city_code,
          response.data.city.cityid,
          response.data.city.city_name_e,
          response.data.city.pincode
        );

        setFormData((prevState) => ({
          ...prevState,
          City_Code: response.data.city.city_code,
          cityid: response.data.city.cityid,
          Pincode: response.data.city.pincode,
        }));
        setShowCityPopup(false);
      } catch (error) {
        toast.error(
          "Error occurred while creating city: " +
          (error.response?.data?.error || error.message)
        );
        console.error("Error creating city:", error);
      }
    } else {
      console.error("CityMaster is not loaded yet");
    }
  };


  const handleGroupSave = async (event) => {
    event.preventDefault();
    if (groupMasterRef.current) {
      const groupData = groupMasterRef.current.getFormData();
      try {
        const response = await axios.post(
          `${API_URL}/create-finicial-group?Company_Code=${companyCode}`,
          groupData
        );
        setGroupMasterData(response.data);
        handleGroup_Code(
          response.data.group.group_Code,
          response.data.group.bsid
        );
        setShowGroupPopup(false);
      } catch (error) {
        toast.error(
          "Error occurred while creating group: " +
          (error.response?.data?.error || error.message)
        );
        console.error("Error creating group:", error);
      }
    } else {
      console.error("GroupMaster is not loaded yet");
    }
  };

  const fetchLastRecord = () => {
    fetch(`${API_URL}/getNextAcCode_AccountMaster?Company_Code=${companyCode}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch last record");
        }
        return response.json();
      })
      .then((data) => {
        setFormData((prevState) => ({
          ...initialFormData,
          Ac_Code: data.next_ac_code,
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
    setAccountDetail([]);
    setSelectedGroups([]);
    setCityMasterData("");
    setCityData("");
    setGroupMasterData("");
    newCity_Code = "";
    newGSTStateCode = "";
    newGroup_Code = "";
    cityName = "";
    gstStateName = "";
    grpName = "";
    setLogoFile(null);
    setLogoPreviewUrl('');
    setFormData(initialFormData);
    fetchLastRecord();
    setTimeout(() => {
      if (drpType.current) {
        drpType.current.focus();
      }
    }, 0);
    if (accountMasterData) {
      handleMapDataFromeBuy();
    }
  };

  const checkGstExists = async (gst_no) => {
    try {
      const res = await fetch(`${API_URL}/check-account-gst?gst_no=${gst_no}`);
      const data = await res.json();
      return data;
    } catch (error) {
      console.error("Error checking GST existence:", error);
      return { exists: false };
    }
  };


  const handleSaveOrUpdate = async () => {
    if (!validateForm()) {
      return;
    }


    const gst_no = (formData.Gst_No || '').toString().trim();
    if (!isEditMode) {
      if (gst_no) {
        const result = await checkGstExists(gst_no);
        if (result?.exists) {
          const res = await Swal.fire({
            icon: "warning",
            title: "GST Already Exists",
            text: `Account "${result.Ac_Code} - ${result.ac_name}" is already registered with this GST number.`,
            showCancelButton: true,
            confirmButtonText: "OK",
            cancelButtonText: "Cancel",
            reverseButtons: true,
            allowOutsideClick: false,
            allowEscapeKey: false,
          });

          if (!res.isConfirmed) return; // Cancel -> stop here
          // OK -> continue below and save
        }
      }
    }

    setIsEditing(true);
    setIsLoading(true);

    let master_data = { ...formData };
    // if (formData.Ac_type === 'P') {
    //   master_data = {
    //     ...master_data,
    //     Group_Code: 31,
    //     bsid: 31
    //   };
    // }

    if (isEditMode) {
      master_data = {
        ...master_data,
        Modified_By: username,
        User_Id: User_Id,
        Modified_Date: new Date().toISOString().split("T")[0],
      };
      delete master_data.accoid;
    } else {
      master_data = {
        ...master_data,
        Created_By: username,
        Created_Date: new Date().toISOString().split("T")[0],
      };
    }

    const contact_data = users.map((user) => ({
      rowaction: user.rowaction,
      Person_Name: user.Person_Name,
      Person_Mobile: user.Person_Mobile,
      Company_Code: companyCode,
      Person_Email: user.Person_Email,
      Person_Pan: user.Person_Pan,
      Other: user.Other,
      id: user.id,
    }));

    const acGroupsData = selectedGroups
      .map((groupCode) => ({
        Group_Code: groupCode,
        Company_Code: companyCode,
        Ac_Code: master_data.Ac_Code,
        accoid: master_data.accoid || newAccoid,
      }))
      .filter((group) => group.Group_Code);

    const requestData = {
      master_data,
      contact_data,
    };

    try {
      let response;

      if (isEditMode) {
        const updateApiUrl = `${API_URL}/update-accountmaster?accoid=${newAccoid}`;
        response = await axios.put(updateApiUrl, requestData);
        Swal.fire({
          title: "Success!",
          text: "Record updated successfully!",
          icon: "success",
          confirmButtonText: "OK"
        });
      } else {
        const companyCodeInt = parseInt(companyCode, 10);
        response = await axios.post(
          `${API_URL}/insert-accountmaster?company_code=${companyCodeInt}`,
          requestData
        );
        Swal.fire({
          title: "Success!",
          text: "Record Created successfully!",
          icon: "success",
          confirmButtonText: "OK"
        });
        navigate("/account-master", { state: { accountMasterData: null } });
      }

      if (response.status === 200 || response.status === 201) {
        // Upload logo if a file was selected
        if (logoFile) {
          try {
            const uploadedAcCode = isEditMode
              ? formData.Ac_Code
              : (response.data.AccountMaster?.Ac_Code || formData.Ac_Code);
            const logoFormData = new FormData();
            logoFormData.append('file', logoFile);
            await axios.post(
              `${API_URL}/upload-accountmaster-logo?ac_code=${uploadedAcCode}`,
              logoFormData,
              { headers: { 'Content-Type': 'multipart/form-data' } }
            );
            setLogoFile(null);
            setLogoPreviewUrl('');
          } catch (logoErr) {
            toast.error('Account saved but logo upload failed: ' + (logoErr.response?.data?.error || logoErr.message));
          }
        }

        const groupUpdateData = {
          acGroups: acGroupsData,
          Ac_Code: formData.Ac_Code,
          Company_Code: companyCode,
          accoid: newAccoid,
        };
        await axios.post(
          `${API_URL}/create-multiple-acgroups`,
          groupUpdateData
        );
      }
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      navigate(`/account-master?navigatedRecord=${formData.Ac_Code}`);

      setIsEditMode(false);
      setAddOneButtonEnabled(true);
      setEditButtonEnabled(true);
      setDeleteButtonEnabled(true);
      setBackButtonEnabled(true);
      setSaveButtonEnabled(false);
      setCancelButtonEnabled(false);
      setIsEditing(false);
      setIsLoading(false);
    } catch (error) {
      console.error("Error during API call:", error);
      toast.error(`Error occurred while saving data: ${error.message}`);
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditMode(true);
    setAddOneButtonEnabled(false);
    setSaveButtonEnabled(true);
    setCancelButtonEnabled(true);
    setEditButtonEnabled(false);
    setDeleteButtonEnabled(false);
    setBackButtonEnabled(true);
    setIsEditing(true);
  };
  const handleCancel = () => {
    axios
      .get(`${API_URL}/get-lastaccountdata?Company_Code=${companyCode}`)
      .then((response) => {
        const data = response.data.account_master_data;
        const labels = response.data.account_labels;
        const detailData = response.data.account_detail_data;
        const groupCodes = response.data.group_codes;

        const convertedData = Object.keys(data).reduce((acc, key) => {
          acc[key] = convertBooleanToValue(data[key], "numeric");
          return acc;
        }, {});

        newAccoid = convertedData.accoid;
        newCity_Code = convertedData.City_Code;
        cityName = labels.cityname;
        grpName = labels.groupcodename;
        newGroup_Code = convertedData.Group_Code;
        gstStateName = labels.State_Name;
        newGSTStateCode = convertedData.GSTStateCode;
        setFormData({
          ...formData,
          ...convertedData,
        });
        setAccountData(convertedData || {});
        setAccountDetail(detailData || []);

        setSelectedGroups(groupCodes || []);
        navigate("/account-master", { state: { accountMasterData: null } });
      })
      .catch((error) => {
        console.error("Error fetching latest data for edit:", error);
      });
    setLogoFile(null);
    setLogoPreviewUrl('');
    setIsEditing(false);
    setIsEditMode(false);
    setAddOneButtonEnabled(true);
    setEditButtonEnabled(true);
    setDeleteButtonEnabled(true);
    setBackButtonEnabled(true);
    setSaveButtonEnabled(false);
    setCancelButtonEnabled(false);
    setCancelButtonClicked(true);
  };

  const fetchGroupData = () => {
    axios
      .get(
        `${API_URL}/system_master_help?CompanyCode=${companyCode}&SystemType=G`
      )
      .then((response) => {
        const data = response.data;
        setGroupData(data);
      })
      .catch((error) => {
        console.error("Error fetching latest data for edit:", error);
      });
  };

  const handleDelete = async () => {
    try {
      const usageCheckUrl = `${API_URL}/check-AcCode-usage?Ac_Code=${formData.Ac_Code}&Company_Code=${companyCode}&accoid=${newAccoid}`;
      const usageCheckResponse = await axios.get(usageCheckUrl);

      if (usageCheckResponse.data.isUsed) {
        Swal.fire({
          title: "Cannot Delete",
          text: usageCheckResponse.data.message || "This record is in use and cannot be deleted.",
          icon: "warning",
          confirmButtonText: "OK",
        });
        return;
      }

      const result = await Swal.fire({
        title: "Are you sure?",
        text: `You are about to delete the record: ${formData.Ac_Code}.`,
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
        Swal.fire({
          title: "Cancelled",
          text: "Your record is safe 🙂",
          icon: "info",
        });
        return;
      }
      setIsLoading(true);

      setIsEditMode(false);
      setAddOneButtonEnabled(true);
      setEditButtonEnabled(true);
      setDeleteButtonEnabled(true);
      setBackButtonEnabled(true);
      setSaveButtonEnabled(false);
      setCancelButtonEnabled(false);

      const deleteApiUrl = `${API_URL}/delete_accountmaster?accoid=${newAccoid}&company_code=${companyCode}&Ac_Code=${formData.Ac_Code}`;
      await axios.delete(deleteApiUrl);

      Swal.fire({
        title: "Deleted!",
        text: "Record deleted successfully!",
        icon: "success",
        confirmButtonText: "OK",
      });

      handleCancel();

    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error?.response?.data?.message || "Failed to delete the record.",
        icon: "error",
        confirmButtonText: "OK",
      });
      console.error("Error during deletion:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupData();
  }, []);

  const handleBack = () => {
    navigate("/AccountMaster-utility");
  };

  const openPopup = (mode) => {
    setPopupMode(mode);
    setShowPopup(true);
    if (mode === "add") {
      clearForm();
    }
  };

  const closePopup = () => {
    setShowPopup(false);
    setSelectedUser({});
    clearForm();
  };

  const clearForm = () => {
    setFormDataDetail({
      Person_Name: "",
      Person_Mobile: "",
      Person_Email: "",
      Person_Pan: "",
      Other: "",
    });
  };

  useEffect(() => {
    if (selectedRecord) {
      setUsers(
        accountDetail.map((detail) => ({
          Id: detail.id,
          id: detail.id,
          Ac_Code: detail.Ac_Code,
          rowaction: "Normal",
          Person_Email: detail.Person_Email,
          Person_Mobile: detail.Person_Mobile,
          Person_Name: detail.Person_Name,
          Person_Pan: detail.Person_Pan,
          Other: detail.Other,
        }))
      );
    }
  }, [selectedRecord, accountDetail]);

  useEffect(() => {
    const updatedUsers = accountDetail.map((detail) => ({
      Id: detail.id,
      id: detail.id,
      Ac_Code: detail.Ac_Code,
      rowaction: "Normal",
      Person_Email: detail.Person_Email,
      Person_Mobile: detail.Person_Mobile,
      Person_Name: detail.Person_Name,
      Person_Pan: detail.Person_Pan,
      Other: detail.Other,
    }));
    setUsers(updatedUsers);
  }, [accountDetail]);

  const addUser = async () => {
    const newUser = {
      Id: users.length > 0 ? Math.max(...users.map((user) => user.Id)) + 1 : 1,
      ...formDataDetail,
      rowaction: "add",
    };

    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    closePopup();
  };

  const updateUser = async () => {
    const updatedUsers = users.map((user) => {
      if (user.Id === selectedUser.Id) {
        const updatedRowaction =
          user.rowaction === "Normal" ? "update" : user.rowaction;
        return {
          ...user,
          Person_Email: formDataDetail.Person_Email,
          Person_Mobile: formDataDetail.Person_Mobile,
          Person_Name: formDataDetail.Person_Name,
          Person_Pan: formDataDetail.Person_Pan,
          Other: formDataDetail.Other,
          rowaction: updatedRowaction,
        };
      } else {
        return user;
      }
    });

    setUsers(updatedUsers);
    closePopup();
  };

  const editUser = (user) => {
    setSelectedUser(user);
    setFormDataDetail({
      Person_Email: user.Person_Email || "",
      Person_Mobile: user.Person_Mobile || "",
      Person_Name: user.Person_Name || "",
      Person_Pan: user.Person_Pan || "",
      Other: user.Other || "",
    });
    openPopup("edit");
  };

  const deleteModeHandler = async (user) => {
    let updatedUsers;
    if (isEditMode && user.rowaction === "add") {
      setDeleteMode(true);
      setSelectedUser(user);
      updatedUsers = users.map((u) =>
        u.Id === user.Id ? { ...u, rowaction: "DNU" } : u
      );
    } else if (isEditMode) {
      setDeleteMode(true);
      setSelectedUser(user);
      updatedUsers = users.map((u) =>
        u.Id === user.Id ? { ...u, rowaction: "delete" } : u
      );
    } else {
      setDeleteMode(true);
      setSelectedUser(user);
      updatedUsers = users.map((u) =>
        u.Id === user.Id ? { ...u, rowaction: "DNU" } : u
      );
    }
    setUsers(updatedUsers);
    setSelectedUser({});
  };

  const openDelete = async (user) => {
    setDeleteMode(true);
    setSelectedUser(user);
    let updatedUsers;
    if (isEditMode && user.rowaction === "delete") {
      updatedUsers = users.map((u) =>
        u.Id === user.Id ? { ...u, rowaction: "Normal" } : u
      );
    } else {
      updatedUsers = users.map((u) =>
        u.Id === user.Id ? { ...u, rowaction: "add" } : u
      );
    }
    setUsers(updatedUsers);
    setSelectedUser({});
  };

  const handlerecordDoubleClicked = async () => {
    try {
      await fetchAccountData("getaccountmasterByid", {
        Company_Code: companyCode,
        Ac_Code: selectedRecord.Ac_Code,
      });
    } catch (error) {
      console.error("Error in record double-click:", error);
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

  useEffect(() => {
    if (selectedRecord) {
      handlerecordDoubleClicked();
    } else if (navigatedRecord && !isNaN(navigatedRecord) && parseInt(navigatedRecord) > 0) {
      handleNavigateRecord();
    }
    else {
      handleAddOne();
    }
  }, [selectedRecord, navigatedRecord]);

  const handleKeyDown = async (event) => {
    if (event.key === "Tab") {
      const changeNoValue = event.target.value;
      fetchAccountData("getaccountmasterByid", {
        Company_Code: companyCode,
        Ac_Code: changeNoValue,
      });
    }
  };

  const handleMapDataFromeBuy = () => {
    setFormData({
      ...formData,
      ...accountMasterData,
      company_code: companyCode,
    });
  };


  const fetchAccountData = async (endpoint, params) => {
    try {
      const response = await fetch(
        `${API_URL}/${endpoint}?${new URLSearchParams(params)}`
      );
      if (response.ok) {
        const data = await response.json();
        const acData = data.account_master_data;
        const labels = data.account_labels;
        const detailData = data.account_detail_data;
        const groupCodes = data.group_codes ?? [];

        const convertedData = Object.keys(acData).reduce((acc, key) => {
          acc[key] = convertBooleanToValue(acData[key], "numeric");
          return acc;
        }, {});

        newAccoid = convertedData.accoid;
        newCity_Code = convertedData.City_Code;
        cityName = labels.cityname;
        grpName = labels.groupcodename;
        newGroup_Code = convertedData.Group_Code;
        gstStateName = labels.State_Name;
        newGSTStateCode = convertedData.GSTStateCode;

        setFormData({
          ...formData,
          ...convertedData,
        });
        setAccountData(convertedData || {});
        setAccountDetail(detailData || []);
        setSelectedGroups(groupCodes || []);
      } else {
        console.error(
          `Failed to fetch account data: ${response.status} ${response.statusText}`
        );
      }
    } catch (error) {
      console.error("Error during API call:", error);
    }
  };

  const handleFirstButtonClick = () => {
    fetchAccountData("get-firstaccount-navigation", {
      Company_Code: companyCode,
    });
  };

  const handlePreviousButtonClick = () => {
    fetchAccountData("get-previousaccount-navigation", {
      current_ac_code: formData.Ac_Code,
      Company_Code: companyCode,
    });
  };

  const handleNextButtonClick = () => {
    fetchAccountData("get-nextaccount-navigation", {
      current_ac_code: formData.Ac_Code,
      Company_Code: companyCode,
    });
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
      fetchAccountData("getaccountmasterByid", {
        Company_Code: companyCode,
        Ac_Code: navigatedRecord,
      });
    } catch (error) {
      console.error("Error during API call:", error);
    }
  };


  const shouldDisableCityCode = () => {
    return !isFieldEnabled("City_Code") || (!isEditing && addOneButtonEnabled);
  };

  return (
    <>
      <UserAuditInfo
        createdBy={formData.Created_By}
        modifiedBy={formData.Modified_By}
        title={"Account Master"}
      />
      <br></br>
      <ToastContainer autoClose={500} />
      <div ref={ref} className="main-container">
        <div>
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
          />

          {/* Navigation Buttons */}
          <NavigationButtons
            handleFirstButtonClick={handleFirstButtonClick}
            handlePreviousButtonClick={handlePreviousButtonClick}
            handleNextButtonClick={handleNextButtonClick}
            handleLastButtonClick={handleCancel}
            highlightedButton={highlightedButton}
            isEditing={isEditing}
            isFirstRecord={formData.company_code === 1}
          />
        </div>
        <br />
        <Box
          sx={{
            margin: "auto",
          }}
        >
          <Card >
            <CardContent>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1, flexDirection: "row", alignItems: "center" }}>
                <TextField
                  label="Change No"
                  name="changeNo"
                  variant="outlined"
                  autoComplete="off"
                  onKeyDown={handleKeyDown}
                  disabled={!addOneButtonEnabled}
                  size="small"
                  sx={{ width: "5%" }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
                <TextField
                  label="Account Code"
                  name="Ac_Code"
                  variant="outlined"
                  size="small"
                  value={formData.Ac_Code}
                  onChange={handleChange}
                  disabled={true}
                  sx={{
                    "& .MuiInputBase-root": {
                      fontSize: "16px",
                    },
                    width: "5%",
                  }}
                />
                <TextField
                  label="Date"
                  name="Created_Date"
                  variant="outlined"
                  size="small"
                  value={formData.Created_Date || ""}
                  onChange={handleChange}
                  disabled
                  sx={{
                    "& .MuiInputBase-root": {
                      fontSize: "16px",
                    },
                    width: "8%",
                  }}
                  InputLabelProps={{ shrink: true }}
                />

                <FormControl size="small" sx={{ width: "auto" }}>
                  <InputLabel>Type</InputLabel>
                  <Select
                    id="Ac_type"
                    name="Ac_type"
                    value={formData.Ac_type}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    inputRef={drpType}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  >
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
                    <MenuItem value="SP">Farmer</MenuItem>
                    <MenuItem value="Z">Staff</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  label="GST No."
                  type="text"
                  id="Gst_No"
                  name="Gst_No"
                  size="small"
                  value={formData.Gst_No}
                  autoComplete="off"
                  inputProps={{ maxLength: 15 }}
                  onChange={handleChange}
                  disabled={(!isEditing && addOneButtonEnabled)}
                  sx={{ width: "auto" }}
                />

                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSearchClick}
                  disabled={!isEditing && addOneButtonEnabled}
                >
                  <RefreshIcon />
                </Button>

                <TextField
                  label="Company PAN No."
                  id="CompanyPan"
                  name="CompanyPan"
                  size="small"
                  value={formData?.CompanyPan}
                  autoComplete="off"
                  onChange={handleChange}
                  disabled={!isEditing && addOneButtonEnabled}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />

                <TdsFileBadge
                  acCode={formData.Ac_Code}
                  companyCode={companyCode}
                />

                <TextField
                  label={
                    formData.Ac_type === "F" ? "Depreciation Rate" : "Interest Rate"
                  }
                  name="Ac_rate"
                  variant="outlined"
                  size="small"
                  value={formData.Ac_rate}
                  autoComplete="off"
                  onChange={handleChange}
                  disabled={
                    !isFieldEnabled("Ac_rate") ||
                    (!isEditing && addOneButtonEnabled)
                  }
                  inputProps={{
                    sx: { textAlign: "right" },
                    inputMode: "decimal",
                    onInput: validateNumericInput,
                  }}
                />

                <TextField
                  label="Company Type"
                  id="Company_Type"
                  name="Company_Type"
                  value={formData.Company_Type}
                  size="small"
                  autoComplete="off"
                  disabled
                  sx={{ width: "15%" }}
                  InputLabelProps={{ shrink: true }}
                />

              </Box>

              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, marginTop: 1 }}>
                <TextField
                  label="Account Name"
                  variant="outlined"
                  size="small"
                  type="text"
                  id="Ac_Name_E"
                  name="Ac_Name_E"
                  value={formData.Ac_Name_E}
                  inputRef={inputRef}
                  autoComplete="off"
                  onChange={handleChange}
                  disabled={!isEditing && addOneButtonEnabled}
                  sx={{
                    width: "15%",
                  }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />


                <TextField
                  label="Legal Name"
                  id="referBy"
                  name="referBy"
                  value={formData.referBy}
                  onChange={handleChange}
                  size="small"
                  autoComplete="off"
                  sx={{
                    width: "35%",
                    // 1. Changes the label color (when focused and normal)
                    "& .MuiInputLabel-root": {
                      color: "blue",
                    },
                    "& .MuiInputLabel-root.Mui-focused": {
                      color: "blue",
                    },
                    // 2. Changes the actual typed text color
                    "& .MuiInputBase-input": {
                      color: "blue",
                    },
                    // 3. Changes the border color (optional, but usually desired with blue text)
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": {
                        borderColor: "blue",
                      },
                      "&:hover fieldset": {
                        borderColor: "blue",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "blue",
                      },
                    },
                  }}
                  disabled={
                    !isFieldEnabled("referBy") ||
                    (!isEditing && addOneButtonEnabled)
                  }
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
                {/* <Chip
                  label={formData.Vendor_Approved === "Y" ? "Vendor Approved" : "Not Verified Vendor"}
                  color={formData.Vendor_Approved === "Y" ? "success" : "default"}
                  size="small"
                  sx={{ fontWeight: "bold" }}
                />
 */}

              </Box>


              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                <TextField fullWidth label="Address" id="Address_E"
                  variant="outlined"
                  size="small"
                  name="Address_E"
                  value={formData.Address_E}
                  autoComplete="off"
                  onChange={handleChange}
                  disabled={
                    !isFieldEnabled("Address_E") ||
                    (!isEditing && addOneButtonEnabled)
                  }
                  style={{
                    width: "35%",
                    fontSize: "15px",
                    borderRadius: "2px",
                  }}

                  InputLabelProps={{
                    shrink: true,
                  }}
                />

                <FormControl size="small" fullWidth sx={{ width: "12vh" }}>
                  <InputLabel>Limit</InputLabel>
                  <Select
                    id="Limit_By"
                    name="Limit_By"
                    value={formData.Limit_By}
                    onChange={handleChange}
                    disabled={
                      !isFieldEnabled("Limit_By") ||
                      (!isEditing && addOneButtonEnabled)
                    }
                  >
                    <MenuItem value="Y">By Limit</MenuItem>
                    <MenuItem value="N">No Limit</MenuItem>
                  </Select>
                </FormControl>

                <label htmlFor="Our_Party" style={{ marginTop: "5px" }}>Our Party :</label>
                <Checkbox
                  sx={{
                    color: "primary.main",
                    "&.Mui-checked": {
                      color: "secondary.main",
                    },
                  }}
                  id="Our_Party"
                  name="Our_Party"
                  checked={formData.Our_Party === "Y"}
                  onChange={(e) => handleCheckbox(e, "string")}
                  disabled={
                    !isFieldEnabled("Our_Party") ||
                    (!isEditing && addOneButtonEnabled)
                  }
                />

                <label htmlFor="Show_Ledger" style={{ marginTop: "5px" }}>Show Ledger :</label>
                <Checkbox
                  sx={{
                    color: "primary.main",
                    "&.Mui-checked": {
                      color: "secondary.main",
                    },
                  }}
                  id="Show_Ledger"
                  name="Show_Ledger"
                  checked={formData.Show_Ledger === "Y"}
                  onChange={(e) => handleCheckbox(e, "string")}
                  disabled={
                    !isFieldEnabled("Show_Ledger") ||
                    (!isEditing && addOneButtonEnabled)
                  }
                />

                <label htmlFor="Customer_Select_Party" style={{ marginTop: "5px" }}>Customer Select Party :</label>
                <Checkbox
                  sx={{
                    color: "primary.main",
                    "&.Mui-checked": {
                      color: "secondary.main",
                    },
                  }}
                  id="Customer_Select_Party"
                  name="Customer_Select_Party"
                  checked={formData.Customer_Select_Party === "Y"}
                  onChange={(e) => handleCheckbox(e, "string")}
                  disabled={
                    !isFieldEnabled("Customer_Select_Party") ||
                    (!isEditing && addOneButtonEnabled)
                  }
                />

              </Box>





              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                <Grid item xs={12} sm={2}>
                  <FormControl fullWidth>
                    <InputLabel shrink style={{ fontWeight: 'bold' }}>City</InputLabel>
                    <CityMasterHelp
                      name="City_Code"
                      onAcCodeClick={handleCity_Code}
                      CityName={
                        cityMasterData
                          ? cityMasterData.city.city_name_e || ""
                          : city_data
                            ? city_data.city_name_e
                            : cityName || ""
                      }
                      CityCode={
                        cityMasterData
                          ? cityMasterData.city.city_code
                          : city_data
                            ? city_data.city_code
                            : newCity_Code || ""
                      }
                      tabIndex={8}
                      disabledFeild={
                        !isFieldEnabled("City_Code") ||
                        (!isEditing && addOneButtonEnabled)
                      }
                    />
                  </FormControl>
                </Grid>

                <Button
                  variant="contained"
                  size="small"
                  onClick={(e) => handleAddCity(e)}
                  disabled={shouldDisableCityCode()}
                >
                  Add City
                </Button>

                <Box
                  sx={{ display: "flex" }}
                >
                  <div
                    className={`modal fade ${showCityPopup ? 'show' : ''}`}
                    style={{ display: showCityPopup ? 'block' : 'none', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                    tabIndex="-1"
                    role="dialog"
                    aria-hidden={!showCityPopup}
                  >
                    <div className="modal-dialog" style={{ maxWidth: '50%' }}>
                      <div className="modal-content">
                        <div className="modal-header">
                          <Button
                            sx={{
                              fontSize: "16px",
                              border: "none",
                              cursor: "pointer",
                              marginLeft: "900px",
                            }}
                            onClick={handleClosePopup}
                          >
                            &times;
                          </Button>
                        </div>
                        <div >
                          <CityMaster isPopup={true} ref={cityMasterRef} />
                        </div>
                        <div className="modal-footer">
                          <Button variant="contained" color="primary" onClick={handleCitySave}>
                            Save
                          </Button>
                          <Button variant="contained" color="error" onClick={handleClosePopup}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  {showCityPopup && (
                    <Box
                      sx={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100% ",
                        transform: "translate(-50%, 50%)",
                        bgcolor: "rgba(0, 0, 0, 0)",
                        zIndex: 999,
                      }}
                      onClick={handleClosePopup}
                    ></Box>
                  )}
                </Box>

                <TextField
                  label="Pin Code"
                  type="text"
                  id="Pincode"
                  name="Pincode"
                  size="small"
                  autoComplete="off"
                  value={
                    cityMasterData?.city?.pincode || formData.Pincode || pincode
                  }
                  onChange={handleChange}
                  disabled={
                    !isFieldEnabled("Pincode") ||
                    (!isEditing && addOneButtonEnabled)
                  }
                  sx={{
                    width: "5%",
                  }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />

                <TextField
                  label="Sugar LIC No."
                  id="Local_Lic_No"
                  name="Local_Lic_No"
                  autoComplete="off"
                  size="small"
                  value={formData.Local_Lic_No}
                  onChange={handleChange}
                  disabled={
                    !isFieldEnabled("Local_Lic_No") ||
                    (!isEditing && addOneButtonEnabled)
                  }
                  sx={{
                    width: "10%",
                  }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
                <TextField
                  label="Email"
                  id="Email_Id"
                  name="Email_Id"
                  size="small"
                  autoComplete="off"
                  value={formData.Email_Id}
                  onChange={handleChange}
                  disabled={
                    !isFieldEnabled("Email_Id") ||
                    (!isEditing && addOneButtonEnabled)
                  }
                  sx={{
                    width: "10%",
                  }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
                <TextField
                  label="CC Email"
                  id="Email_Id_cc"
                  name="Email_Id_cc"
                  size="small"
                  autoComplete="off"
                  value={formData.Email_Id_cc}
                  onChange={handleChange}
                  disabled={
                    !isFieldEnabled("Email_Id_cc") ||
                    (!isEditing && addOneButtonEnabled)
                  }
                  sx={{
                    width: "10%",
                  }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
                <TextField label="Other Narration"
                  id="Other_Narration"
                  name="Other_Narration"
                  autoComplete="off"
                  value={formData.Other_Narration}
                  onChange={handleChange}
                  disabled={
                    !isFieldEnabled("Other_Narration") ||
                    (!isEditing && addOneButtonEnabled)
                  }
                  style={{
                    width: "20%",
                    fontSize: "16px"
                  }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />

              </Box>


              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, marginTop: 1 }}>


                <TextField
                  label="Bank Opening Bal"
                  id="Bank_Opening"
                  name="Bank_Opening"
                  value={formData.Bank_Opening}
                  size="small"
                  onChange={handleChange}
                  autoComplete="off"
                  disabled={
                    !isFieldEnabled("Bank_Opening") ||
                    (!isEditing && addOneButtonEnabled)
                  }
                  inputProps={{
                    sx: { textAlign: "right" },
                    inputMode: "decimal",
                    pattern: "[0-9]*[.,]?[0-9]+",
                    onInput: validateNumericInput,
                  }}
                  sx={{ width: "15vh" }}
                />
                <FormControl size="small" fullWidth sx={{ width: "10vh" }}>
                  <InputLabel>Bank Opening Dr/Cr</InputLabel>
                  <Select
                    id="bank_Op_Drcr"
                    name="bank_Op_Drcr"
                    value={formData.bank_Op_Drcr}
                    onChange={handleChange}
                    disabled={
                      !isFieldEnabled("bank_Op_Drcr") ||
                      (!isEditing && addOneButtonEnabled)
                    }
                  >
                    <MenuItem value="D">Debit</MenuItem>
                    <MenuItem value="C">Credit</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  label="Opening Balance"
                  id="Opening_Balance"
                  name="Opening_Balance"
                  value={parseFloat(formData.Opening_Balance)}
                  onChange={handleChange}
                  size="small"
                  disabled={
                    !isFieldEnabled("Opening_Balance") ||
                    (!isEditing && addOneButtonEnabled)
                  }
                  inputProps={{
                    sx: { textAlign: "right" },
                    inputMode: "decimal",
                    pattern: "[0-9]*[.,]?[0-9]+",
                    onInput: validateNumericInput,
                  }}
                  sx={{ width: "15vh" }}
                />
                <FormControl size="small" fullWidth sx={{ width: "10vh" }}>
                  <InputLabel>Dr/Cr</InputLabel>
                  <Select
                    id="Drcr"
                    name="Drcr"
                    value={formData.Drcr}
                    onChange={handleChange}
                    disabled={
                      !isFieldEnabled("Drcr") || (!isEditing && addOneButtonEnabled)
                    }
                  >
                    <MenuItem value="D">Debit</MenuItem>
                    <MenuItem value="C">Credit</MenuItem>
                  </Select>
                </FormControl>

              </Box>



              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, marginTop: 1 }}>
                <TextField
                  label="Beneficiary Name (Primary)"
                  id="Benificiary_Name"
                  name="Benificiary_Name"
                  value={formData.Benificiary_Name}
                  onChange={handleChange}
                  autoComplete="off"
                  size="small"
                  disabled={
                    !isFieldEnabled("Benificiary_Name") ||
                    (!isEditing && addOneButtonEnabled)
                  }
                  sx={{
                    width: "15%",
                  }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
                <TextField
                  label="Bank Name (Primary)"
                  id="Bank_Name"
                  name="Bank_Name"
                  value={formData.Bank_Name}
                  size="small"
                  autoComplete="off"
                  onChange={handleChange}
                  disabled={
                    !isFieldEnabled("Bank_Name") ||
                    (!isEditing && addOneButtonEnabled)
                  }
                  sx={{
                    width: "15%",
                  }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
                <TextField
                  label="Bank A/c No (Primary)"
                  id="Bank_Ac_No"
                  name="Bank_Ac_No"
                  value={formData.Bank_Ac_No}
                  onChange={handleChange}
                  autoComplete="off"
                  size="small"
                  disabled={
                    !isFieldEnabled("Bank_Ac_No") ||
                    (!isEditing && addOneButtonEnabled)
                  }
                  sx={{
                    width: "15%",
                  }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />

                <TextField
                  label="Bank IFSC Code (Primary)"
                  id="IFSC"
                  name="IFSC"
                  size="small"
                  value={formData.IFSC}
                  autoComplete="off"
                  onChange={handleChange}
                  disabled={
                    !isFieldEnabled("IFSC") || (!isEditing && addOneButtonEnabled)
                  }
                  InputLabelProps={{
                    shrink: true,
                  }}
                />

                <TextField
                  label="Branch Name (Primary)"
                  id="Branch_Name"
                  name="Branch_Name"
                  value={formData.Branch_Name}
                  onChange={handleChange}
                  autoComplete="off"
                  size="small"
                  disabled={
                    !isFieldEnabled("Branch_Name") ||
                    (!isEditing && addOneButtonEnabled)
                  }
                  sx={{
                    width: "15%",
                  }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />

              </Box>





              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, marginTop: 1, alignItems: "center" }}>
                <TextField
                  label="Beneficiary Name (Additional)"
                  id="Benificiary_Name1"
                  name="Benificiary_Name1"
                  value={formData.Benificiary_Name1}
                  size="small"
                  autoComplete="off"
                  onChange={handleChange}
                  disabled={
                    !isFieldEnabled("Benificiary_Name1") ||
                    (!isEditing && addOneButtonEnabled)
                  }
                  sx={{ width: "15%" }}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="Bank Name (Additional)"
                  id="Bank_Name1"
                  name="Bank_Name1"
                  value={formData.Bank_Name1}
                  size="small"
                  autoComplete="off"
                  onChange={handleChange}
                  disabled={
                    !isFieldEnabled("Bank_Name1") ||
                    (!isEditing && addOneButtonEnabled)
                  }
                  sx={{ width: "15%" }}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="Bank A/c No (Additional)"
                  id="Bank_Ac_No1"
                  name="Bank_Ac_No1"
                  value={formData.Bank_Ac_No1}
                  size="small"
                  autoComplete="off"
                  onChange={handleChange}
                  disabled={
                    !isFieldEnabled("Bank_Ac_No1") ||
                    (!isEditing && addOneButtonEnabled)
                  }
                  sx={{ width: "15%" }}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="Bank IFSC Code (Additional)"
                  id="IFSC1"
                  name="IFSC1"
                  value={formData.IFSC1}
                  size="small"
                  autoComplete="off"
                  onChange={handleChange}
                  disabled={
                    !isFieldEnabled("IFSC1") ||
                    (!isEditing && addOneButtonEnabled)
                  }
                  sx={{ width: "15%" }}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="Branch Name (Additional)"
                  id="Branch_Name1"
                  name="Branch_Name1"
                  value={formData.Branch_Name1}
                  size="small"
                  autoComplete="off"
                  onChange={handleChange}
                  disabled={
                    !isFieldEnabled("Branch_Name1") ||
                    (!isEditing && addOneButtonEnabled)
                  }
                  sx={{ width: "15%" }}
                  InputLabelProps={{ shrink: true }}
                />

              </Box>

              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, marginTop: 2 }}>

                <Grid item xs={12} sm={2}>
                  <FormControl fullWidth>
                    <InputLabel shrink style={{ fontWeight: 'bold' }}>Group Code</InputLabel>
                    <GroupMasterHelp
                      name="Group_Code"
                      onAcCodeClick={handleGroup_Code}
                      GroupName={
                        groupMasterData ? groupMasterData.group.group_Name_E : grpName
                      }
                      GroupCode={
                        groupMasterData
                          ? groupMasterData.group.group_Code
                          : newGroup_Code
                      }
                      tabIndex={24}
                      disabledFeild={!isEditing && addOneButtonEnabled}
                    />
                  </FormControl>
                </Grid>
                <Button
                  variant="contained"
                  size="small"
                  style={{ height: "35px" }}
                  onClick={(e) => handleAddGroup(e)}
                  disabled={!isEditing && addOneButtonEnabled}
                >
                  Add Group
                </Button>


                <Modal
                  open={showGroupPopup}
                  onClose={handleCloseGroupPopup}
                  aria-labelledby="group-master-modal-title"
                  aria-describedby="group-master-modal-description"
                >
                  <Box
                    sx={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      width: 700,
                      bgcolor: "background.paper",
                      boxShadow: 24,
                      p: 4,
                      borderRadius: 2,
                    }}
                  >
                    <Button
                      sx={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        background: "transparent",
                        fontSize: "16px",
                        border: "none",
                        cursor: "pointer",
                      }}
                      onClick={handleCloseGroupPopup}
                    >
                      &times;
                    </Button>

                    <FinicialMaster isPopup={true} ref={groupMasterRef} />

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mt: 2,
                      }}
                    >
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleGroupSave}
                      >
                        Save
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        onClick={handleCloseGroupPopup}
                      >
                        Cancel
                      </Button>
                    </Box>
                  </Box>
                </Modal>

                {showGroupPopup && (
                  <Box
                    sx={{
                      position: "fixed",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      bgcolor: "rgba(0, 0, 0, 0.5)",
                      zIndex: 999,
                    }}
                    onClick={handleCloseGroupPopup}
                  ></Box>
                )}
                <TextField
                  label="Short Name"
                  id="Short_Name"
                  name="Short_Name"
                  value={formData.Short_Name}
                  autoComplete="off"
                  size="small"
                  onChange={handleChange}
                  disabled={
                    !isFieldEnabled("Short_Name") ||
                    (!isEditing && addOneButtonEnabled)
                  }
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
                <TextField
                  label="Commission Rate"
                  id="Commission"
                  name="Commission"
                  size="small"
                  value={formData.Commission}
                  autoComplete="off"
                  onChange={handleChange}
                  disabled={
                    !isFieldEnabled("Commission") ||
                    (!isEditing && addOneButtonEnabled)
                  }
                  inputProps={{
                    sx: { textAlign: "right" },
                    inputMode: "decimal",
                    onInput: validateNumericInput,
                  }}
                  sx={{ width: "15vh" }}
                />
                <label htmlFor="carporate_party" style={{ marginTop: "5px" }}>Is Carporate Party :</label>
                <Checkbox
                  sx={{
                    color: "primary.main",
                    "&.Mui-checked": {
                      color: "secondary.main",
                    },
                  }}
                  id="carporate_party"
                  name="carporate_party"
                  checked={formData.carporate_party === "Y"}
                  onChange={(e) => handleCheckbox(e, "string")}
                  disabled={
                    !isFieldEnabled("carporate_party") ||
                    (!isEditing && addOneButtonEnabled)
                  }
                />
                <TextField
                  label="Legal Name / Ref. By"
                  id="referBy"
                  name="referBy"
                  value={formData.referBy}
                  onChange={handleChange}
                  autoComplete="off"
                  size="small"
                  disabled={
                    !isFieldEnabled("referBy") ||
                    (!isEditing && addOneButtonEnabled)
                  }
                  InputLabelProps={{
                    shrink: true,
                  }}
                />

                <TextField
                  label="Off. Phone"
                  id="OffPhone"
                  name="OffPhone"
                  size="small"
                  value={formData.OffPhone}
                  onChange={handleChange}
                  autoComplete="off"
                  disabled={
                    !isFieldEnabled("OffPhone") ||
                    (!isEditing && addOneButtonEnabled)
                  }
                  sx={{ width: "10vh" }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Box>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, marginTop: 1 }}>

                <TextField
                  label="TCS/TDS Link"
                  id="Fax"
                  name="Fax"
                  size="small"
                  value={formData.Fax}
                  autoComplete="off"
                  onChange={handleChange}
                  disabled={
                    !isFieldEnabled("Fax") || (!isEditing && addOneButtonEnabled)
                  }
                  InputLabelProps={{
                    shrink: true,
                  }}
                />

                <TextField
                  label="Mobile No"
                  id="Mobile_No"
                  name="Mobile_No"
                  size="small"
                  value={formData.Mobile_No}
                  autoComplete="off"
                  onChange={handleChange}
                  disabled={
                    !isFieldEnabled("Mobile_No") ||
                    (!isEditing && addOneButtonEnabled)
                  }
                  InputLabelProps={{
                    shrink: true,
                  }}
                />


                <TextField
                  label="FSSAI LIC No."
                  id="FSSAI"
                  name="FSSAI"
                  size="small"
                  value={formData.FSSAI}
                  autoComplete="off"
                  onChange={handleChange}
                  disabled={
                    !isFieldEnabled("FSSAI") || (!isEditing && addOneButtonEnabled)
                  }
                  InputLabelProps={{
                    shrink: true,
                  }}
                />

                <label htmlFor="Locked" style={{ marginTop: "5px" }}>Locked :</label>
                <Checkbox
                  sx={{
                    color: "primary.main",
                    "&.Mui-checked": {
                      color: "secondary.main",
                    },
                  }}
                  id="Locked"
                  name="Locked"
                  checked={formData.Locked === 1}
                  onChange={(e) => handleCheckbox(e, "numeric")}
                  disabled={
                    !isFieldEnabled("Locked") || (!isEditing && addOneButtonEnabled)
                  }
                />

                <Grid item xs={12} sm={2}>
                  <FormControl fullWidth>
                    <InputLabel shrink style={{ fontWeight: 'bold' }}>GST State Code</InputLabel>
                    <GSTStateMasterHelp
                      name="GSTStateCode"
                      onAcCodeClick={handleGSTStateCode}
                      GstStateName={gstStateName}
                      GstStateCode={newGSTStateCode || formData.GSTStateCode}
                      tabIndex={44}
                      disabledFeild={
                        !isFieldEnabled("GSTStateCode") ||
                        (!isEditing && addOneButtonEnabled)
                      }
                    />
                  </FormControl>
                </Grid>
              </Box>

              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, marginTop: 1 }}>
                <label htmlFor="UnregisterGST" style={{ marginTop: "5px" }}>Unregister For GST :</label>
                <Checkbox
                  sx={{
                    color: "primary.main",
                    "&.Mui-checked": {
                      color: "secondary.main",
                    },
                  }}
                  type="checkbox"
                  id="UnregisterGST"
                  name="UnregisterGST"
                  checked={formData.UnregisterGST === 1}
                  onChange={(e) => handleCheckbox(e, "numeric")}
                  disabled={
                    !isFieldEnabled("UnregisterGST") ||
                    (!isEditing && addOneButtonEnabled)
                  }
                />

                <TextField
                  label="Distance"
                  id="Distance"
                  name="Distance"
                  value={formData.Distance}
                  autoComplete="off"
                  size="small"
                  onChange={handleChange}
                  disabled={
                    !isFieldEnabled("Distance") ||
                    (!isEditing && addOneButtonEnabled)
                  }
                />
                <TextField
                  label="whatsApp No"
                  id="whatsup_no"
                  name="whatsup_no"
                  size="small"
                  value={formData.whatsup_no}
                  autoComplete="off"
                  onChange={handleChange}
                  disabled={
                    !isFieldEnabled("whatsup_no") ||
                    (!isEditing && addOneButtonEnabled)
                  }
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
                <TextField
                  label="Adhar No."
                  id="adhar_no"
                  name="adhar_no"
                  size="small"
                  value={formData.adhar_no}
                  autoComplete="off"
                  onChange={handleChange}
                  disabled={
                    !isFieldEnabled("adhar_no") ||
                    (!isEditing && addOneButtonEnabled)
                  }
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
                <TextField
                  label="TAN No."
                  id="Tan_no"
                  name="Tan_no"
                  value={formData.Tan_no}
                  autoComplete="off"
                  size="small"
                  onChange={handleChange}
                  disabled={
                    !isFieldEnabled("Tan_no") || (!isEditing && addOneButtonEnabled)
                  }
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
                <FormControl size="small" fullWidth sx={{ width: "25vh" }}>
                  <InputLabel>TDS Applicable</InputLabel>
                  <Select
                    id="TDSApplicable"
                    name="TDSApplicable"
                    value={formData.TDSApplicable}
                    autoComplete="off"
                    onChange={handleChange}
                    disabled={
                      !isFieldEnabled("TDSApplicable") ||
                      (!isEditing && addOneButtonEnabled)
                    }
                  >
                    <MenuItem value="L">Lock</MenuItem>
                    <MenuItem value="Y">Sale TDS By Limit</MenuItem>
                    <MenuItem value="N">Sale TCS By Limit</MenuItem>
                    <MenuItem value="T">TCS Bill 1 Sale</MenuItem>
                    <MenuItem value="S">TDS Bill 1 Sale</MenuItem>
                    <MenuItem value="U">URP</MenuItem>
                    <MenuItem value="B">Sale TDS On Total Bill</MenuItem>
                    <MenuItem value="X">No TDS on Sale</MenuItem>
                  </Select>
                </FormControl>

                <FormControl size="small" fullWidth sx={{ width: "25vh" }}>
                  <InputLabel>Purchase TDS Applicable</InputLabel>
                  <Select
                    id="PurchaseTDSApplicable"
                    name="PurchaseTDSApplicable"
                    value={formData.PurchaseTDSApplicable}
                    autoComplete="off"
                    onChange={handleChange}
                    disabled={
                      !isFieldEnabled("TDSApplicable") ||
                      (!isEditing && addOneButtonEnabled)
                    }
                  >
                    <MenuItem value="L">Lock</MenuItem>
                    <MenuItem value="Y">Purchase TDS By Limit</MenuItem>
                    <MenuItem value="P">Purchase TDS By 1st Bill</MenuItem>
                    <MenuItem value="N">Purchase TCS By Limit</MenuItem>
                    <MenuItem value="B">Purchase TCS By 1st Bill</MenuItem>
                    <MenuItem value="U">URP</MenuItem>
                    <MenuItem value="T">Purchase TDS On Total Bill</MenuItem>
                    <MenuItem value="X">No TDS on Purchase</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  label="PAN Link"
                  id="PanLink"
                  name="PanLink"
                  value={formData.PanLink}
                  size="small"
                  onChange={handleChange}
                  disabled={
                    !isFieldEnabled("PanLink") ||
                    (!isEditing && addOneButtonEnabled)
                  }
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Box>

              {/* Account Logo Upload */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, marginTop: 1.5, flexWrap: "wrap" }}>
                <input
                  type="file"
                  ref={logoInputRef}
                  accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                  style={{ display: 'none' }}
                  onChange={handleLogoSelect}
                />
                <span style={{ fontWeight: 600, fontSize: 13, minWidth: 90 }}>Account Logo:</span>
                {(logoPreviewUrl || formData.logo_path) && (
                  <img
                    src={logoPreviewUrl || `${API_URL}/accountmaster-logo/${formData.Ac_Code}`}
                    alt="Account Logo"
                    style={{
                      width: 56, height: 56, objectFit: 'contain',
                      border: '1px solid #ccc', borderRadius: 6, background: '#f9f9f9'
                    }}
                  />
                )}
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={!isEditing && addOneButtonEnabled}
                >
                  {formData.logo_path || logoFile ? 'Change Logo' : 'Upload Logo'}
                </Button>
                {logoFile && (
                  <>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={handleLogoRemove}
                    >
                      Remove
                    </Button>
                    <span style={{ fontSize: 12, color: '#666' }}>{logoFile.name}</span>
                  </>
                )}
              </Box>
            </CardContent>
          </Card>
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "flex-start",
              marginTop: -70,
            }}
          >
            <TableContainer
              component={Paper}
              sx={{
                width: "50%",
                maxWidth: 400,
                ml: -160,
              }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold" }}>Code</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      Group Name
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {groupData.map((group) => (
                    <TableRow key={group.Category_Code}>
                      <TableCell>{group.Category_Code}</TableCell>
                      <TableCell>{group.Category_Name}</TableCell>
                      <TableCell>
                        <Checkbox
                          checked={selectedGroups.includes(group.Category_Code)}
                          onChange={(e) => handleCheckboxAcGroups(e, group)}
                          disabled={!isEditing && addOneButtonEnabled}
                          color="primary"
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
          {isLoading && (
            <div className="loading-overlay">
              <div className="spinner-container">
                <SaveUpdateSpinner />
              </div>
            </div>
          )}
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, marginTop: 8 }}>
            <Dialog open={showPopup} onClose={closePopup} fullWidth>
              <DialogTitle>
                {selectedUser.Id ? "Edit User" : "Add User"}
              </DialogTitle>
              <DialogContent>
                <form>
                  <TextField
                    label="Person Name"
                    name="Person_Name"
                    value={formDataDetail.Person_Name}
                    autoComplete="off"
                    onChange={handleDetailChange}
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                  <TextField
                    label="Person Mobile"
                    name="Person_Mobile"
                    value={formDataDetail.Person_Mobile}
                    autoComplete="off"
                    onChange={handleDetailChange}
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                  <TextField
                    label="Person Email"
                    name="Person_Email"
                    value={formDataDetail.Person_Email}
                    autoComplete="off"
                    onChange={handleDetailChange}
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                  <TextField
                    label="Person Pan"
                    name="Person_Pan"
                    value={formDataDetail.Person_Pan}
                    autoComplete="off"
                    onChange={handleDetailChange}
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                  <TextareaAutosize
                    placeholder="Other"
                    name="Other"
                    value={formDataDetail.Other}
                    autoComplete="off"
                    onChange={handleDetailChange}
                    minRows={3}
                    style={{ width: "100%", marginTop: "16px", padding: "8px" }}
                    size="small"
                  />
                </form>
              </DialogContent>
              <DialogActions>
                {selectedUser.Id ? (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={updateUser}
                  >
                    Update User
                  </Button>
                ) : (
                  <Button variant="contained" color="primary" onClick={addUser}>
                    Add User
                  </Button>
                )}
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={closePopup}
                >
                  Cancel
                </Button>
              </DialogActions>
            </Dialog>
            <Box
              sx={{ display: "flex", flexWrap: "wrap", gap: 2, marginTop: 40 }}
            >
              <Button
                variant="contained"
                color="primary"
                onClick={() => openPopup("add")}
                disabled={!isEditing}
                style={{ marginRight: "10px", marginTop: "10px" }}
              >
                Add User
              </Button>
            </Box>

            <TableContainer component={Paper}  >
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Actions</TableCell>
                    <TableCell>A/C Code</TableCell>
                    <TableCell>Person Name</TableCell>
                    <TableCell>Person Mobile</TableCell>
                    <TableCell>Person Email</TableCell>
                    <TableCell>Person Pan</TableCell>
                    <TableCell>Other</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.Id}>
                      <TableCell>
                        {user.rowaction === "add" ||
                          user.rowaction === "update" ||
                          user.rowaction === "Normal" ? (
                          <>
                            <Button
                              variant="outlined"
                              color="warning"
                              onClick={() => editUser(user)}
                              disabled={!isEditing}
                              style={{ marginRight: "8px" }}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              onClick={() => deleteModeHandler(user)}
                              disabled={!isEditing}
                            >
                              Delete
                            </Button>
                          </>
                        ) : user.rowaction === "DNU" ||
                          user.rowaction === "delete" ? (
                          <Button
                            variant="outlined"
                            color="secondary"
                            onClick={() => openDelete(user)}
                          >
                            Open
                          </Button>
                        ) : null}
                      </TableCell>
                      <TableCell>{formData.Ac_Code}</TableCell>
                      <TableCell>{user.Person_Name}</TableCell>
                      <TableCell>{user.Person_Mobile}</TableCell>
                      <TableCell>{user.Person_Email}</TableCell>
                      <TableCell>{user.Person_Pan}</TableCell>
                      <TableCell>{user.Other}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Box>
      </div>
    </>
  );
};
export default AccountMaster;
