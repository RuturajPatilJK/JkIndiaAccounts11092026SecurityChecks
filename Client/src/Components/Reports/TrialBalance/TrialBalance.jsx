import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';
import './TrialBalance.css';
import {
    Box,
    TextField,
    FormControl,
    FormLabel,
    RadioGroup,
    FormControlLabel,
    Radio,
    MenuItem,
    Select,
    InputLabel, Typography, Grid
} from '@mui/material';
import ReportButton from "../../../Common/Buttons/ReportButton"
import { FaDownload } from 'react-icons/fa';
import Swal from 'sweetalert2';


const TrialBalance = () => {
    // GET values from session Storage
    const companyCode = sessionStorage.getItem("Company_Code");
    const AccountYear = sessionStorage.getItem('Accounting_Year');

    const [selectType, setSelectType] = useState('Mill Wise');
    const [receiptPaymentType, setReceiptPaymentType] = useState('Against Sauda');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [accountType, setAccountType] = useState('Q');
    const [groupTypes, setGroupTypes] = useState([]);
    const [groupType, setGroupType] = useState(groupTypes.length > 0 ? groupTypes[0].group_Code : 'AllTrailBalance');
    const [groupname, setgroupname] = useState("");

    const API_URL = process.env.REACT_APP_API;
    const [radioValue, setRadioValue] = useState('B');
    const [isDropdownDisabled, setIsDropdownDisabled] = useState(false);

    useEffect(() => {
        if (AccountYear) {
            const dates = AccountYear.split(' - ');
            if (dates.length === 2) {
                setFromDate(dates[0]);
                setToDate(dates[1]);
            }
        }
    }, [AccountYear]);

    useEffect(() => {
        const fetchGroupTypes = async () => {
            try {
                const response = await axios.get(
                    `${API_URL}/GettingGroupType?Company_Code=${companyCode}`
                );
                const data = await response.data;
                setGroupTypes(data);
            } catch (error) {
                console.error('Error fetching group types:', error);
            }
        };
        fetchGroupTypes();
    }, []);

    const alertDate = () => Swal.fire({ icon: 'warning', title: 'Date Required', text: 'Please select both From Date and To Date.', confirmButtonColor: '#3085d6' });
    const alertGroup = (reportName) => Swal.fire({ icon: 'warning', title: 'Group Required', text: `Please select a specific Group Type for ${reportName}. "All" is not allowed.`, confirmButtonColor: '#3085d6' });

    const handleGenerateReport = () => {
        if (!fromDate || !toDate) { alertDate(); return; }
        setLoading(true);
        setTimeout(() => {
            const url = `/TrialBalance-reports?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&groupType=${encodeURIComponent(groupType)}`;
            window.open(url, '_blank', 'toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=800,height=600');
            setLoading(false);
        }, 500);
    };

    const handleChange = (event) => {
        setAccountType(event.target.value);
    };

    const handleChangeGroupType = (event) => {
        const value = Number(event.target.value);

        const selectedOption = groupTypes.find(
            (opt) => opt.group_Code === value
        );

        setGroupType(value);
        setgroupname(selectedOption?.group_Name_E || "");
    };

    const handleRadioChange = (event) => {
        const value = event.target.value;
        setRadioValue(value);
    };

    const handleDaywisetrialBalanceReport = () => {
        if (!fromDate || !toDate) { alertDate(); return; }
        setLoading(true);
        setTimeout(() => {
            const url = `/DaywiseTrialBalance-reports?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&selectType=${encodeURIComponent(selectType)}&receiptPaymentType=${encodeURIComponent(receiptPaymentType)}`;
            window.open(url, '_blank', 'toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=800,height=600');
            setLoading(false);
        }, 500);
    };

    const handleGenerateTrialBalanceDetailReport = () => {
        if (!fromDate || !toDate) { alertDate(); return; }
        setLoading(true);
        setTimeout(() => {
            const url = `/TrialBalanceDetails-reports?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&groupType=${encodeURIComponent(groupType)}`;
            window.open(url, '_blank', 'toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=800,height=600');
            setLoading(false);
        }, 500);
    };

    const handleOpeningBalance = () => {
        if (!fromDate || !toDate) { alertDate(); return; }
        setLoading(true);
        setTimeout(() => {
            const url = `/OpeningBalanceDetails-reports?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&selectType=${encodeURIComponent(selectType)}&receiptPaymentType=${encodeURIComponent(receiptPaymentType)}`;
            window.open(url, '_blank', 'toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=800,height=600');
            setLoading(false);
        }, 500);
    };

    const handleJVreport = () => {
        if (!fromDate || !toDate) { alertDate(); return; }
        setLoading(true);
        setTimeout(() => {
            const url = `/JVReport-reports?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}`;
            window.open(url, '_blank', 'toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=800,height=600');
            setLoading(false);
        }, 500);
    };

    const handleAgingAnalysisDebtors = () => {
        if (!fromDate || !toDate) { alertDate(); return; }
        if (!groupType || groupType === 'AllTrailBalance') { alertGroup('Aging Analysis - Debtors'); return; }
        setLoading(true);
        setTimeout(() => {
            const url = `/AgingAnalysis-Report?fromDate=${encodeURIComponent(fromDate)}&toDT=${encodeURIComponent(toDate)}&Company_Code=${companyCode}&Group_code=${groupType}&Groupname=${groupname}`;
            window.open(url, '_blank', 'toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=800,height=600');
            setLoading(false);
        }, 500);
    };

    const handleAgingAnalysisDebtorsGSTWise = () => {
        if (!fromDate || !toDate) { alertDate(); return; }
        if (!groupType || groupType === 'AllTrailBalance') { alertGroup('Trial Balance GST Wise'); return; }
        setLoading(true);
        setTimeout(() => {
            const url = `/AgingAnalysisGSTwise?fromDate=${encodeURIComponent(fromDate)}&toDT=${encodeURIComponent(toDate)}&Company_Code=${companyCode}&Group_code=${groupType}&Groupname=${groupname}`;
            window.open(url, '_blank', 'toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=800,height=600');
            setLoading(false);
        }, 500);
    };

    const handleAgingAnalysisCreditors = () => {
        if (!fromDate || !toDate) { alertDate(); return; }
        if (!groupType || groupType === 'AllTrailBalance') { alertGroup('Aging Analysis - Creditors'); return; }
        setLoading(true);
        setTimeout(() => {
            const url = `/AgingAnalysis-Report-Creditors?fromDate=${encodeURIComponent(fromDate)}&toDT=${encodeURIComponent(toDate)}&Company_Code=${companyCode}&Group_code=${groupType}&Groupname=${groupname}`;
            window.open(url, '_blank', 'toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=800,height=600');
            setLoading(false);
        }, 500);
    };

    const handleDaywiseTrialBalanceWithourOpenning = () => {
        if (!fromDate || !toDate) { alertDate(); return; }
        setLoading(true);
        setTimeout(() => {
            const url = `/DaywiseTrialBalanceWithoutOpenning-reports?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&selectType=${encodeURIComponent(selectType)}&receiptPaymentType=${encodeURIComponent(receiptPaymentType)}`;
            window.open(url, '_blank', 'toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=800,height=600');
            setLoading(false);
        }, 500);
    };

    const handleGenerateTrailBalance = () => {
        if (!fromDate || !toDate) { alertDate(); return; }
        setLoading(true);
        setTimeout(() => {
            const url = `/TrialBalanceGeneral-reports?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&groupType=${encodeURIComponent(groupType)}`;
            window.open(url, '_blank', 'toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=800,height=600');
            setLoading(false);
        }, 500);
    };


 const handleTrialBalanceReportPANWise = () => {
        if (!fromDate || !toDate) { alertDate(); return; }
        setLoading(true);
        setTimeout(() => {
            const url = `/TrialBalanceDetailsPANwise-reports?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&groupType=${encodeURIComponent(groupType)}`;
            window.open(url, '_blank', 'toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=800,height=600');
            setLoading(false);
        }, 500);
    };



    const handleTrialBalanceReportGSTWise = () => {
        if (!fromDate || !toDate) { alertDate(); return; }
        setLoading(true);
        setTimeout(() => {
            const url = `/TrialBalanceDetailsGSTwise-reports?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&groupType=${encodeURIComponent(groupType)}`;
            window.open(url, '_blank', 'toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=800,height=600');
            setLoading(false);
        }, 500);
    };


     const handleAgingAnalysisDebtorsPANWise = () => {
        if (!fromDate || !toDate) { alertDate(); return; }
        if (!groupType || groupType === 'AllTrailBalance') { alertGroup('Trial Balance PAN Wise'); return; }
        setLoading(true);
        setTimeout(() => {
            const url = `/AgingAnalysisPANwise-reports?fromDate=${encodeURIComponent(fromDate)}&toDT=${encodeURIComponent(toDate)}&Company_Code=${companyCode}&Group_code=${groupType}&Groupname=${groupname}`;
            window.open(url, '_blank', 'toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=800,height=600');
            setLoading(false);
        }, 500);
    };


     const handleAgingAnalysisDebtors_GST = () => {
        if (!fromDate || !toDate) { alertDate(); return; }
        if (!groupType || groupType === 'AllTrailBalance') { alertGroup('Aging Analysis - Debtors'); return; }
        setLoading(true);
        setTimeout(() => {
            const url = `/AgingAnalysisDebtors_GST-Report?fromDate=${encodeURIComponent(fromDate)}&toDT=${encodeURIComponent(toDate)}&Company_Code=${companyCode}&Group_code=${groupType}&Groupname=${groupname}`;
            window.open(url, '_blank', 'toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=800,height=600');
            setLoading(false);
        }, 500);
    };

    const handleAgingAnalysisCreditorsGST = () => {
        if (!fromDate || !toDate) { alertDate(); return; }
        if (!groupType || groupType === 'AllTrailBalance') { alertGroup('Aging Analysis - Creditors'); return; }
        setLoading(true);
        setTimeout(() => {
            const url = `/AgingAnalysis-Report-Creditors-GST?fromDate=${encodeURIComponent(fromDate)}&toDT=${encodeURIComponent(toDate)}&Company_Code=${companyCode}&Group_code=${groupType}&Groupname=${groupname}`;
            window.open(url, '_blank', 'toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=800,height=600');
            setLoading(false);
        }, 500);
    };


    return (
        <div className="trial-balance-container">
            <div className="trial-balance-card">

                <Typography
                    variant="h6"
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
                    }}
                >
                    Trial Balance
                </Typography>

                <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 400 }}>

                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <TextField
                                label="From Date"
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}

                                fullWidth
                                InputLabelProps={{ shrink: true, style: { fontSize: '12px' } }}
                                InputProps={{
                                    style: { fontSize: '12px', height: '35px' },
                                }}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                label="To Date"
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}

                                fullWidth
                                InputLabelProps={{ shrink: true, style: { fontSize: '12px' } }}
                                InputProps={{
                                    style: { fontSize: '12px', height: '35px' },
                                }}
                            />
                        </Grid>
                    </Grid>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 10 }} >
                        <FormLabel sx={{ whiteSpace: "nowrap", fontWeight: "bold", fontSize: "16px" }}>Selection Type</FormLabel>
                        <FormControl>
                            <RadioGroup
                                row
                                value={radioValue}
                                onChange={handleRadioChange}
                            >
                                <FormControlLabel value="B" control={<Radio />} label="Balancesheet Group" />
                                <FormControlLabel value="A" control={<Radio />} label="Account Type" />
                            </RadioGroup>
                        </FormControl>
                    </Box>
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <FormControl fullWidth disabled={radioValue === 'B'}>
                                <InputLabel id="account-type-label">Account Type</InputLabel>
                                <Select
                                    labelId="account-type-label"
                                    id="Ac_type"
                                    value={accountType}
                                    label="Account Type"
                                    onChange={handleChange}
                                    sx={{ height: '40px' }}
                                >
                                    <MenuItem value="Q">All</MenuItem>
                                    <MenuItem value="P">Party</MenuItem>
                                    <MenuItem value="L">Local</MenuItem>
                                    <MenuItem value="PM">Party & Mill</MenuItem>
                                    <MenuItem value="S">Supplier</MenuItem>
                                    <MenuItem value="B">Bank</MenuItem>
                                    <MenuItem value="C">Cash</MenuItem>
                                    <MenuItem value="R">Relative</MenuItem>
                                    <MenuItem value="F">Fixed Assets</MenuItem>
                                    <MenuItem value="I">Interest Party</MenuItem>
                                    <MenuItem value="E">Income/Expenses</MenuItem>
                                    <MenuItem value="O">Trading</MenuItem>
                                    <MenuItem value="M">Mill</MenuItem>
                                    <MenuItem value="T">Transport</MenuItem>
                                    <MenuItem value="BR">Broker</MenuItem>
                                    <MenuItem value="RP">Retail Party</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth disabled={radioValue === 'A'}>
                                <InputLabel id="group-type-label">Group Type</InputLabel>
                                <Select
                                    labelId="group-type-label"
                                    id="Group_type"
                                    value={groupType}
                                    label="Group Type"
                                    onChange={handleChangeGroupType}
                                    sx={{ height: '40px', width: '350px' }}
                                >
                                    <MenuItem value="AllTrailBalance" >All</MenuItem>
                                    {groupTypes.map((type) => (
                                        <MenuItem key={type.group_Code} value={type.group_Code}>
                                            {type.group_Name_E}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                        </Grid>
                    </Grid>
                </Box>

                <div className="form-buttons">
                    <ReportButton label=" Trial Balance"
                        icon={FaDownload}
                        onClick={handleGenerateTrailBalance}
                        loading={""}
                        disabled={""}
                    />

                    <ReportButton label=" Trail Balance (CA)"
                        icon={FaDownload}
                        onClick={handleGenerateReport}
                        loading={""}
                        disabled={""}
                    />

                    <ReportButton label="Detail Report"
                        icon={FaDownload}
                        onClick={handleGenerateTrialBalanceDetailReport}
                        loading={""}
                        disabled={""}
                    />

                    <ReportButton label="Day Wise Trial Balance"
                        icon={FaDownload}
                        onClick={handleDaywisetrialBalanceReport}
                        loading={""}
                        disabled={""}
                    />

                </div>

                <div className="form-buttons">

                    <ReportButton label="Opening Balance"
                        icon={FaDownload}
                        onClick={handleOpeningBalance}
                        loading={""}
                        disabled={""}
                    />

                    <ReportButton label="JV Report"
                        icon={FaDownload}
                        onClick={handleJVreport}
                        loading={""}
                        disabled={""}
                    />

                    <ReportButton label="Aging Analyasis - Debtors"
                        icon={FaDownload}
                        onClick={handleAgingAnalysisDebtors}
                        loading={""}
                        disabled={""}
                    />

                    <ReportButton label="Aging Analyasis - Creditors"
                        icon={FaDownload}
                        onClick={handleAgingAnalysisCreditors}
                        loading={""}
                        disabled={""}
                    />

                </div>

                <div className="form-buttons">


                    <ReportButton label="Trial Balance GST Wise"
                        icon={FaDownload}
                        onClick={handleAgingAnalysisDebtorsGSTWise}
                        loading={""}
                        disabled={""}
                    />

                    <ReportButton label="Day Wise Trial Balnce Without Openning"
                        icon={FaDownload}
                        onClick={handleDaywiseTrialBalanceWithourOpenning}
                        loading={""}
                        disabled={""}
                    />


                    <ReportButton label="Trial Balance PAN Wise"
                        icon={FaDownload}
                        onClick={handleAgingAnalysisDebtorsPANWise}
                        loading={""}
                        disabled={""}
                    />
                    <ReportButton label="Detail Trial Balance GST Wise"
                        icon={FaDownload}
                        onClick={handleTrialBalanceReportGSTWise}
                        loading={""}
                        disabled={""}
                    />
                    <ReportButton label="Detail Trial Balance PAN Wise"
                        icon={FaDownload}
                        onClick={handleTrialBalanceReportPANWise}
                        loading={""}
                        disabled={""}
                    />


                </div>

                 <div className="form-buttons">
                     <ReportButton label="Aging Analyasis - Creditors Panwise"
                        icon={FaDownload}
                        onClick={handleAgingAnalysisCreditorsGST}
                        loading={""}
                        disabled={""}
                    />
                    <ReportButton label="Aging Analyasis - Debtors Panwise"
                        icon={FaDownload}
                        onClick={handleAgingAnalysisDebtors_GST}
                        loading={""}
                        disabled={""}
                    />
                </div>



            </div>
        </div>
    );
};

export default TrialBalance;