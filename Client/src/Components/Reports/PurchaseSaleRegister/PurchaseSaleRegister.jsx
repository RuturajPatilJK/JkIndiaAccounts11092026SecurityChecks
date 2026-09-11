import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./PurchaseSaleRegister.css";
import { Typography } from "@mui/material";
import AccountMasterHelp from "../../../Helper/AccountMasterHelp";
import ReportButton from "../../../Common/Buttons/ReportButton"
import Swal from 'sweetalert2';
import { FaDownload } from 'react-icons/fa';

const PurchaseSaleRegisterReport = () => {
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const AccountYear = sessionStorage.getItem("Accounting_Year");
    const Year_Code = sessionStorage.getItem("Year_Code");
    const Company_Code = sessionStorage.getItem("Company_Code");

    const [acCode, setAcCode] = useState("");
    const [accoid, setAccoid] = useState("");
    const [acname, setAcname] = useState("");

    const [activeButton, setActiveButton] = useState(null);


    useEffect(() => {
        const currentDate = new Date().toISOString().split("T")[0];
        setFromDate(currentDate);
        setToDate(currentDate);
    }, []);

    const handleAc_Code = (code, id, name) => {
        setAcCode(code);
        setAccoid(id);
        setAcname(name);
    };

    const generateReportUrl = (base) => {
        return `${base}?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&companyCode=${encodeURIComponent(Company_Code)}&yearCode=${encodeURIComponent(Year_Code)}&acCode=${encodeURIComponent(acCode)}`;
    };

    const handleReportClick = async (label, baseUrl) => {
        setActiveButton(label);

        const reportMap = {
            "Sale TDS": "/SaleTDSPartyWise-registers",
            "Sale TCS": "/SaleTCSPartyWise-registers",
            "Purchase TDS": "/PurchaseTDSpartywise-registers",
            "Purchase TCS": "/PurchaseTCSpartywise-registers"
        };

        let finalUrl = baseUrl;

        if (reportMap[label]) {
            const result = await Swal.fire({
                title: 'Select Report Type',
                text: 'Choose how you want to view the report',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Summary',
                cancelButtonText: 'PartyWise',
                reverseButtons: true
            });

            finalUrl = result.isConfirmed ? baseUrl : reportMap[label];
        }

        finalUrl = generateReportUrl(finalUrl.split("?")[0]);

        setTimeout(() => {
            window.open(finalUrl, "_blank", "toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=800,height=600");
            setActiveButton(null);
        }, 500);
    };



    return (
        <div className="container" style={{ Width: "100%", padding: "10px" }}>
            <Typography variant="h6"
                component="h1"
                gutterBottom
                sx={{
                    textAlign: 'center',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    color: '#2c3e50',
                    marginBottom: '30px',
                    padding: '12px 0',
                    position: 'relative',
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: '0',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '80px',
                        height: '4px',
                        background: 'linear-gradient(90deg, #3498db, #2ecc71)',
                        borderRadius: '2px',
                        animation: 'underlineGrow 0.5s ease-out forwards'
                    },
                    '@keyframes underlineGrow': {
                        '0%': { width: '0' },
                        '100%': { width: '80px' }
                    }
                }}>
                Purchase Sale Register
            </Typography>

            <div className="PurchaseSaleregister-row">
                <label htmlFor="AC_CODE" className="PurchaseSaleregisterlabel" style={{ whiteSpace: "nowrap", fontWeight: "bold" }}>Account Code :</label>
                <AccountMasterHelp onAcCodeClick={handleAc_Code} name="AC_CODE" CategoryName={acname} CategoryCode={acCode} Ac_type="" />
            </div>

            <div className="PurchaseSaleregister-row">
                <label htmlFor="fromDate" className="PurchaseSaleregisterlabel" style={{ whiteSpace: "nowrap", fontWeight: "bold" }}>From Date :</label>
                <input type="date" id="fromDate" className="form-control" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />

                <label htmlFor="toDate" className="PurchaseSaleregisterlabel" style={{ whiteSpace: "nowrap", fontWeight: "bold" }}>To Date :</label>
                <input type="date" id="toDate" className="form-control" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>

            <hr style={{
                border: "none",
                borderTop: "3px dotted #222",
                margin: "20px 0",
                opacity: "0.6"
            }} />

            <div className="grid-container">
                {[
                     { label: "Sale Month Wise", url: "/SaleMonthWise-registers" },
                    { label: "Sale Register", url: "/Sale-registers" },
                    { label: "Sale TDS", url: "/SaleTDS-registers" },
                    // { label: "Sale TCS", url: "/SaleTCS-registers" },
                    { label: "Sale Return Sale", url: "/SaleReturnSale-registers" },
                      { label: "Purchase Month Wise", url: "/PurchaseMonthWise-registers" },
                    { label: "Purchase Register", url: "/Purchase-registers" },
                    { label: "Purchase TDS", url: "/PurchaseTDS-registers" },
                    // { label: "Purchase TCS", url: "/PurchaseTCS-registers" },
                    { label: "Purchase Return", url: "/PurchaseReturn-registers" },
                    { label: "Mill Sale Report", url: "/MillSaleReport-registers" },
                   
                  
                    { label: "RCM", url: "/RCM-registers" },
                    { label: "Purchase Analytics", url: "/Detailed_PurchaseRegister" },
                    { label: "Sale Analytics", url: "/Detailed_SaleRegister" }
                ].map((item, index) => (
                    <ReportButton
                        key={index}
                        label={item.label}
                        icon={FaDownload}
                        loading={activeButton === item.label}
                        disabled={activeButton !== null}
                        onClick={() => handleReportClick(item.label, item.url)}
                    />
                ))}
            </div>
            {error && <div className="alert alert-danger">{error}</div>}
        </div>
    );
};

export default PurchaseSaleRegisterReport;
