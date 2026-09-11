// import React, { useState, useEffect } from 'react';
// import 'bootstrap/dist/css/bootstrap.min.css';
// import { useNavigate } from 'react-router-dom';
// import { FormControl, InputLabel, Select, MenuItem, TextField, Grid, Typography } from '@mui/material';
// import AccountMasterHelp from "../../../Helper/AccountMasterHelp";
// import ReportButton from "../../../Common/Buttons/ReportButton"
// import { FaDownload } from 'react-icons/fa';

// const PendingReports = () => {
//     const navigate = useNavigate();

//     const AccountYear = sessionStorage.getItem('Accounting_Year');

//     const [selectType, setSelectType] = useState('Mill Wise');
//     const [receiptPaymentType, setReceiptPaymentType] = useState('Against Sauda');
//     const [fromDate, setFromDate] = useState('');
//     const [toDate, setToDate] = useState('');
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState('');
//     const [accoid, setAccoid] = useState("");
//     const [acname, setacname] = useState("");
//     const [acCode, setAcCode] = useState("");

//     useEffect(() => {
//         if (AccountYear) {
//             const dates = AccountYear.split(' - ');
//             if (dates.length === 2) {
//                 setFromDate(dates[0]);
//                 setToDate(dates[1]);
//             }
//         }
//     }, [AccountYear]);

//     const handleAc_Code = async (code, accoid, name) => {
//         setAcCode(code);
//         setAccoid(accoid);
//         setacname(name);
//     };

//     const handleGenerateReport = () => {
//         if (!fromDate || !toDate) {
//             setError('Please select both From Date and To Date.');
//             return;
//         }
//         setError('');
//         setLoading(true);
//         setTimeout(() => {
//             const url = `/tenderwise-reports?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&selectType=${encodeURIComponent(selectType)}&receiptPaymentType=${encodeURIComponent(receiptPaymentType)}`;
//             window.open(url, '_blank', 'toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=800,height=600');
//             setLoading(false);
//         }, 500);
//     };


//     const handleGenerateUTRDetailReport = () => {
//         if (!fromDate || !toDate) {
//             setError('Please select both From Date and To Date.');
//             return;
//         }
//         setError('');
//         setLoading(true);
//         setTimeout(() => {
//             const url = `/utr_detail-report?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&selectType=${encodeURIComponent(selectType)}&receiptPaymentType=${encodeURIComponent(receiptPaymentType)}`;
//             window.open(url, '_blank', 'toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=800,height=600');
//             setLoading(false);
//         }, 500);
//     };

//     const handleSaudaSummary = () => {
//         if (!fromDate || !toDate) {
//             setError('Please select both From Date and To Date.');
//             return;
//         }
//         setError('');
//         setLoading(true);
//         setTimeout(() => {
//             const url = `/SaudaSummary-reports?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&selectType=${encodeURIComponent(selectType)}&receiptPaymentType=${encodeURIComponent(receiptPaymentType)}`;
//             window.open(url, '_blank', 'toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=800,height=600');
//             setLoading(false);
//         }, 500);
//     };

//     const handleUTRReportSummary = () => {
//         if (!fromDate || !toDate) {
//             setError('Please select both From Date and To Date.');
//             return;
//         }
//         setError('');
//         setLoading(true);
//         setTimeout(() => {
//             const url = `/UTRReportSummary-reports?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&selectType=${encodeURIComponent(selectType)}&receiptPaymentType=${encodeURIComponent(receiptPaymentType)}`;
//             window.open(url, '_blank', 'toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=800,height=600');
//             setLoading(false);
//         }, 500);
//     };

//     const handleMillPaymentSummary = () => {
//         if (!fromDate || !toDate) {
//             setError('Please select both From Date and To Date.');
//             return;
//         }
//         setError('');
//         setLoading(true);
//         setTimeout(() => {
//             const url = `/MillPaymentSummary-reports?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&selectType=${encodeURIComponent(selectType)}&receiptPaymentType=${encodeURIComponent(receiptPaymentType)}`;
//             window.open(url, '_blank', 'toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=800,height=600');
//             setLoading(false);
//         }, 500);
//     };

//     const handleMillPaymentDetail = () => {
//         if (!fromDate || !toDate) {
//             setError('Please select both From Date and To Date.');
//             return;
//         }
//         setError('');
//         setLoading(true);
//         setTimeout(() => {
//             const url = `/MillPaymentDetail-reports?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&selectType=${encodeURIComponent(selectType)}&receiptPaymentType=${encodeURIComponent(receiptPaymentType)}`;
//             window.open(url, '_blank', 'toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=800,height=600');
//             setLoading(false);
//         }, 500);
//     };

//     const handleDuePaymentSummary = () => {
//         if (!fromDate || !toDate) {
//             setError('Please select both From Date and To Date.');
//             return;
//         }
//         setError('');
//         setLoading(true);
//         setTimeout(() => {
//             const url = `/DuepaymentSummary-reports?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&selectType=${encodeURIComponent(selectType)}&receiptPaymentType=${encodeURIComponent(receiptPaymentType)}`;
//             window.open(url, '_blank', 'toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=800,height=600');
//             setLoading(false);
//         }, 500);
//     };

//     const handleNormalSaudaSummary = () => {
//         if (!fromDate || !toDate) {
//             setError('Please select both From Date and To Date.');
//             return;
//         }
//         setError('');
//         setLoading(true);
//         setTimeout(() => {
//             const url = `/normal-sauda-summary?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&selectType=${encodeURIComponent(selectType)}&receiptPaymentType=${encodeURIComponent(receiptPaymentType)}&acCode=${encodeURIComponent(acCode)}&acname=${encodeURIComponent(acname)}`;
//             window.open(url, '_blank', 'toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=800,height=600');
//             setLoading(false);
//         }, 500);
//     };

//     return (
//         <div className='container' style={{ marginTop: "50px" }}>
//             <Typography component="h1"
//                 gutterBottom
//                 sx={{
//                     textAlign: 'center',
//                     fontSize: '1.2rem',
//                     fontWeight: 'bold',
//                     color: '#2c3e50',
//                     marginBottom: '30px',
//                     padding: '12px 0',
//                     position: 'relative',
//                     '&::after': {
//                         content: '""',
//                         position: 'absolute',
//                         bottom: '0',
//                         left: '50%',
//                         transform: 'translateX(-50%)',
//                         width: '80px',
//                         height: '4px',
//                         background: 'linear-gradient(90deg, #3498db, #2ecc71)',
//                         borderRadius: '2px',
//                         animation: 'underlineGrow 0.5s ease-out forwards'
//                     },
//                     '@keyframes underlineGrow': {
//                         '0%': { width: '0' },
//                         '100%': { width: '80px' }
//                     }
//                 }}>Pending Reports</Typography>
//             <div >
//                 <Grid container spacing={1} alignItems="center" mt={5}>
//                     <Grid mt={2}>
//                         <div className="debitCreditNote-row">
//                             <label htmlFor="Bill_From" className="label" >
//                                 Account Code :
//                             </label>
//                             <div >
//                                 <div >
//                                     <AccountMasterHelp
//                                         onAcCodeClick={handleAc_Code}
//                                         name="ac_code"
//                                         CategoryName={acname}
//                                         CategoryCode={acCode}
//                                         Ac_type={[]}
//                                     />
//                                 </div>
//                             </div>
//                         </div>
//                     </Grid>
//                 </Grid>

//                 <Grid container spacing={1} alignItems="center" mt={1} ml={17}>
//                     <Grid item xs={12} sm={2}>
//                         <FormControl fullWidth>
//                             <InputLabel id="selectType-label">Select Type</InputLabel>
//                             <Select
//                                 labelId="selectType-label"
//                                 id="selectType"
//                                 value={selectType}
//                                 label="Select Type"
//                                 size='small'
//                                 onChange={(e) => setSelectType(e.target.value)}
//                             >
//                                 <MenuItem value="Mill Wise">Mill Wise</MenuItem>
//                                 <MenuItem value="Bank Wise">Bank Wise</MenuItem>
//                             </Select>
//                         </FormControl>
//                     </Grid>

//                     <Grid item xs={12} sm={2} >
//                         <FormControl fullWidth>
//                             <InputLabel id="receiptPaymentType-label">Receipt Payment Type</InputLabel>
//                             <Select
//                                 labelId="receiptPaymentType-label"
//                                 id="receiptPaymentType"
//                                 value={receiptPaymentType}
//                                 label="Receipt Payment Type"
//                                 size='small'
//                                 onChange={(e) => setReceiptPaymentType(e.target.value)}
//                             >
//                                 <MenuItem value="Against Sauda">Against Sauda</MenuItem>
//                                 <MenuItem value="Do Sauda">Do Sauda</MenuItem>
//                             </Select>
//                         </FormControl>
//                     </Grid>
//                 </Grid>

//                 <Grid container spacing={1} alignItems="center" mt={2} ml={17}>
//                     <Grid item xs={12} sm={2}>
//                         <TextField
//                             fullWidth
//                             id="fromDate"
//                             label="From Date"
//                             type="date"
//                             size='small'
//                             value={fromDate}
//                             onChange={(e) => setFromDate(e.target.value)}
//                             InputLabelProps={{
//                                 style: { fontSize: '12px' },
//                             }}
//                             InputProps={{
//                                 style: { fontSize: '12px', height: '35px' },
//                             }}
//                         />
//                     </Grid>

//                     <Grid item xs={12} sm={2}>
//                         <TextField
//                             fullWidth
//                             id="toDate"
//                             label="To Date"
//                             type="date"
//                             size='small'
//                             value={toDate}
//                             onChange={(e) => setToDate(e.target.value)}
//                             InputLabelProps={{
//                                 style: { fontSize: '12px' },
//                             }}
//                             InputProps={{
//                                 style: { fontSize: '12px', height: '35px' },
//                             }}
//                         />
//                     </Grid>
//                 </Grid>
//             </div>

//             <div className="CommonbuttonContainer" style={{ marginTop: "50px" }}>
//                 <ReportButton label="Tender Wise Sauda"
//                     icon={FaDownload}
//                     onClick={handleGenerateReport}
//                     loading={loading}
//                     disabled={loading}
//                 />

//                 <ReportButton label="UTR Report Summary"
//                     icon={FaDownload}
//                     onClick={handleUTRReportSummary}
//                     loading={loading}
//                     disabled={loading}
//                 />

//                 <ReportButton label="Mill Payment Summary"
//                     icon={FaDownload}
//                     onClick={handleMillPaymentSummary}
//                     loading={loading}
//                     disabled={loading}
//                 />

//                  <ReportButton label="Mill Payment Detail"
//                     icon={FaDownload}
//                     onClick={handleMillPaymentDetail}
//                     loading={loading}
//                     disabled={loading}
//                 />

//                 <ReportButton label="Due Payment Summary"
//                     icon={FaDownload}
//                     onClick={handleDuePaymentSummary}
//                     loading={loading}
//                     disabled={loading}
//                 />

//                 <ReportButton label="Sauda Summary"
//                     icon={FaDownload}
//                     onClick={handleSaudaSummary}
//                     loading={loading}
//                     disabled={loading}
//                 />

//                 <ReportButton label="Normal Sauda"
//                     icon={FaDownload}
//                     onClick={handleNormalSaudaSummary}
//                     loading={loading}
//                     disabled={loading}
//                 />

//                 <ReportButton label="UTR Detail Report"
//                     icon={FaDownload}
//                     onClick={handleGenerateUTRDetailReport}
//                     loading={loading}
//                     disabled={loading}
//                 />

//             </div>
//             {error && <div className="alert alert-danger">{error}</div>}
//         </div>
//     );
// };

// export default PendingReports;



























import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';
import { FormControl, InputLabel, Select, MenuItem, TextField, Grid, Typography } from '@mui/material';
import AccountMasterHelp from "../../../Helper/AccountMasterHelp";
import ReportButton from "../../../Common/Buttons/ReportButton"
import { FaDownload } from 'react-icons/fa';

const PendingReports = () => {
    const navigate = useNavigate();

    const AccountYear = sessionStorage.getItem('Accounting_Year');

    const [selectType, setSelectType] = useState('Mill Wise');
    const [receiptPaymentType, setReceiptPaymentType] = useState('Against Sauda');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    // Changed loading from boolean to string to track specific buttons
    const [activeReport, setActiveReport] = useState(null);
    const [error, setError] = useState('');
    const [accoid, setAccoid] = useState("");
    const [acname, setacname] = useState("");
    const [acCode, setAcCode] = useState("");

    useEffect(() => {
        if (AccountYear) {
            const dates = AccountYear.split(' - ');
            if (dates.length === 2) {
                setFromDate(dates[0]);
                setToDate(dates[1]);
            }
        }
    }, [AccountYear]);

    const handleAc_Code = async (code, accoid, name) => {
        setAcCode(code);
        setAccoid(accoid);
        setacname(name);
    };

    // Centralized Report Handler
    const handleGenerateReport = (reportKey, endpoint, isNormalSauda = false) => {
        if (!fromDate || !toDate) {
            setError('Please select both From Date and To Date.');
            return;
        }
        setError('');
        setActiveReport(reportKey); // Set specific button to loading

        setTimeout(() => {
            let url = `${endpoint}?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&selectType=${encodeURIComponent(selectType)}&receiptPaymentType=${encodeURIComponent(receiptPaymentType)}`;

            // Add extra params for Normal Sauda
            if (isNormalSauda) {
                url += `&acCode=${encodeURIComponent(acCode)}&acname=${encodeURIComponent(acname)}`;
            }

            window.open(url, '_blank', 'toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=800,height=600');
            setActiveReport(null); // Reset loading
        }, 500);
    };

    return (
        <div className='container' style={{ marginTop: "50px" }}>
            <Typography component="h1"
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
                    }
                }}>Pending Reports</Typography>

            <div>
                <Grid container spacing={1} alignItems="center" mt={5}>
                    <Grid item mt={2}>
                        <div className="debitCreditNote-row">
                            <label htmlFor="Bill_From" className="label">Account Code :</label>
                            <AccountMasterHelp
                                onAcCodeClick={handleAc_Code}
                                name="ac_code"
                                CategoryName={acname}
                                CategoryCode={acCode}
                                Ac_type={[]}
                            />
                        </div>
                    </Grid>
                </Grid>

                <Grid container spacing={1} alignItems="center" mt={1} ml={17}>
                    <Grid item xs={12} sm={2}>
                        <FormControl fullWidth>
                            <InputLabel id="selectType-label">Select Type</InputLabel>
                            <Select
                                labelId="selectType-label"
                                id="selectType"
                                value={selectType}
                                label="Select Type"
                                size='small'
                                onChange={(e) => setSelectType(e.target.value)}
                            >
                                <MenuItem value="Mill Wise">Mill Wise</MenuItem>
                                <MenuItem value="Bank Wise">Bank Wise</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={2}>
                        <FormControl fullWidth>
                            <InputLabel id="receiptPaymentType-label">Receipt Payment Type</InputLabel>
                            <Select
                                labelId="receiptPaymentType-label"
                                id="receiptPaymentType"
                                value={receiptPaymentType}
                                label="Receipt Payment Type"
                                size='small'
                                onChange={(e) => setReceiptPaymentType(e.target.value)}
                            >
                                <MenuItem value="Against Sauda">Against Sauda</MenuItem>
                                <MenuItem value="Do Sauda">Do Sauda</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>

                <Grid container spacing={1} alignItems="center" mt={2} ml={17}>
                    <Grid item xs={12} sm={2}>
                        <TextField
                            fullWidth
                            id="fromDate"
                            label="From Date"
                            type="date"
                            size='small'
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            InputLabelProps={{ style: { fontSize: '12px' }, shrink: true }}
                            InputProps={{ style: { fontSize: '12px', height: '35px' } }}
                        />
                    </Grid>

                    <Grid item xs={12} sm={2}>
                        <TextField
                            fullWidth
                            id="toDate"
                            label="To Date"
                            type="date"
                            size='small'
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            InputLabelProps={{ style: { fontSize: '12px' }, shrink: true }}
                            InputProps={{ style: { fontSize: '12px', height: '35px' } }}
                        />
                    </Grid>
                </Grid>
            </div>

            <div className="CommonbuttonContainer" style={{ marginTop: "50px" }}>
                <ReportButton
                    label="Tender Wise Sauda"
                    icon={FaDownload}
                    onClick={() => handleGenerateReport("tender", "/tenderwise-reports")}
                    loading={activeReport === "tender"}
                    disabled={activeReport !== null}
                />

                <ReportButton
                    label="UTR Report Summary"
                    icon={FaDownload}
                    onClick={() => handleGenerateReport("utr_sum", "/UTRReportSummary-reports")}
                    loading={activeReport === "utr_sum"}
                    disabled={activeReport !== null}
                />

                <ReportButton
                    label="Mill Payment Summary"
                    icon={FaDownload}
                    onClick={() => handleGenerateReport("mill_sum", "/MillPaymentSummary-reports")}
                    loading={activeReport === "mill_sum"}
                    disabled={activeReport !== null}
                />

                <ReportButton
                    label="Mill Payment Detail"
                    icon={FaDownload}
                    onClick={() => handleGenerateReport("mill_det", "/MillPaymentDetail-reports")}
                    loading={activeReport === "mill_det"}
                    disabled={activeReport !== null}
                />

                <ReportButton
                    label="Due Payment Summary"
                    icon={FaDownload}
                    onClick={() => handleGenerateReport("due_sum", "/DuepaymentSummary-reports")}
                    loading={activeReport === "due_sum"}
                    disabled={activeReport !== null}
                />

                <ReportButton
                    label="Sauda Summary"
                    icon={FaDownload}
                    onClick={() => handleGenerateReport("sauda_sum", "/SaudaSummary-reports")}
                    loading={activeReport === "sauda_sum"}
                    disabled={activeReport !== null}
                />

                <ReportButton
                    label="Normal Sauda"
                    icon={FaDownload}
                    onClick={() => handleGenerateReport("normal", "/normal-sauda-summary", true)}
                    loading={activeReport === "normal"}
                    disabled={activeReport !== null}
                />

                <ReportButton
                    label="UTR Detail Report"
                    icon={FaDownload}
                    onClick={() => handleGenerateReport("utr_det", "/utr_detail-report")}
                    loading={activeReport === "utr_det"}
                    disabled={activeReport !== null}
                />
            </div>
            {error && <div className="alert alert-danger mt-3">{error}</div>}
        </div>
    );
};

export default PendingReports;
