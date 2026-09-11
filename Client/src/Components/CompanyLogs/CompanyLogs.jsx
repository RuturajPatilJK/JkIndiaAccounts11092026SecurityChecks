import React, { useState } from 'react';
import {
    TextField, Button, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, Grid,
    FormControl, InputLabel, Select, MenuItem, Typography,
    CircularProgress, Box, TablePagination, InputAdornment
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { formatReadableAmount } from '../../Common/FormatFunctions/FormatAmount';
import { styled, keyframes } from '@mui/system';
import Tooltip, { tooltipClasses } from '@mui/material/Tooltip';

const API_URL = process.env.REACT_APP_API;

const pulse = keyframes`
    0% { box-shadow: 0 0 0 0 rgba(63, 81, 181, 0.7); }
    70% { box-shadow: 0 0 0 10px rgba(63, 81, 181, 0); }
    100% { box-shadow: 0 0 0 0 rgba(63, 81, 181, 0); }
`;

const CustomWidthTooltip = styled(({ className, ...props }) => (
    <Tooltip {...props} classes={{ popper: className }} />
))({
    [`& .${tooltipClasses.tooltip}`]: {
        backgroundColor: '#f5f5f5',
        color: 'rgba(0, 0, 0, 0.87)',
        boxShadow: '0px 2px 8px rgba(0,0,0,0.2)',
        fontSize: 12,
        maxWidth: 220,
        padding: '8px 12px',
        border: '1px solid #ddd',
    },
});

const StyledHeaderCell = styled(TableCell)(({ theme }) => ({
    fontWeight: "bold",
    backgroundColor: "#3f51b5",
    color: "white",
    padding: "10px 8px",
    position: 'sticky',
    top: 0,
    zIndex: 2,
    borderBottom: '2px solid #303f9f',
    whiteSpace: 'nowrap',
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
    '&:hover': {
        backgroundColor: '#e0f7fa',
        cursor: "pointer",
    },
    '&.selected-row': {
        backgroundColor: '#e3f2fd',
        borderLeft: '5px solid #3f51b5',
    },
}));

const DiffHighlightedTableCell = styled(TableCell)(({ isDifference, diffColor }) => ({
    backgroundColor: isDifference ? diffColor : 'inherit',
    fontWeight: isDifference ? 'bold' : 'normal',
    position: 'relative',
    whiteSpace: 'nowrap',
    '&:hover': {
        backgroundColor: isDifference ? (diffColor === '#fff9c4' ? '#ffecb3' : '#a7d9b9') : 'inherit',
    }
}));

const LogDetailsHeader = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: theme.spacing(2),
    backgroundColor: '#f5f5f5',
    borderRadius: theme.shape.borderRadius,
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    marginBottom: theme.spacing(3),
    justifyContent: 'center',
}));

const FixedTableTitle = styled(Typography)(({ theme }) => ({
    padding: '5px',
    backgroundColor: '#64b5f6',
    color: 'white',
    borderTopLeftRadius: '8px',
    borderTopRightRadius: '8px',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
    position: 'sticky',
    top: 0,
    zIndex: 3,
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
}));

const CompanyLogs = () => {
    const getTodayDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };

    const companyCode = sessionStorage.getItem("Company_Code");
    const YearCode = sessionStorage.getItem("Year_Code");

    const [fromDate, setFromDate] = useState(getTodayDate());
    const [toDate, setToDate] = useState(getTodayDate());
    const [filterType, setFilterType] = useState('All');
    const [acNameE, setAcNameE] = useState('');
    const [companyLogs, setCompanyLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedLogIndex, setSelectedLogIndex] = useState(null);
    const [selectedLogData, setSelectedLogData] = useState(null);
    const [oldRecords, setOldRecords] = useState([]);
    const [newRecords, setNewRecords] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const handleFilterChange = (e) => {
        setFilterType(e.target.value);
    };

    const formatTo12HourTime = (timeStr) => {
        if (!timeStr) return '';
        const [hours, minutes] = timeStr.split(':');
        const date = new Date();
        date.setHours(+hours);
        date.setMinutes(+minutes);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    };

    const fetchCompanyLogs = async () => {
        setLoading(true);
        setSelectedLogIndex(null);
        setSelectedLogData(null);
        setOldRecords([]);
        setNewRecords([]);
        setPage(0);
        setSearchTerm('');
        try {
            const response = await fetch(
                `${API_URL}/get-company-logs?fromDate=${fromDate}&toDate=${toDate}&tranType=${filterType === 'All' ? '' : filterType}&companyCode=${companyCode}&acNameE=${encodeURIComponent(acNameE)}`
            );
            const data = await response.json();
            setCompanyLogs(data.companyLogs || []);
        } catch (error) {
            console.error('Error fetching company logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchLogDetails = async (docNo, tranType, updatedTime) => {
        setOldRecords([]);
        setNewRecords([]);
        try {
            const response = await fetch(
                `${API_URL}/get-company-log-details?tranType=${tranType}&companyCode=${companyCode}&docNo=${docNo}&updatedTime=${encodeURIComponent(updatedTime)}`
            );
            const data = await response.json();

            if (data.success && data.logDetails) {
                const records = data.logDetails;

                const old = records
                    .filter(rec => rec.Record_Type === 'O' || rec.Record_Type === 'D')
                    .sort((a, b) => {
                        if (a.Record_Type === 'O' && b.Record_Type === 'D') return -1;
                        if (a.Record_Type === 'D' && b.Record_Type === 'O') return 1;
                        return 0;
                    });

                const newRecs = records.filter(rec => rec.Record_Type === 'N');

                setOldRecords(old);
                setNewRecords(newRecs);
            }
        } catch (error) {
            console.error('Error fetching log details:', error);
        }
    };

    const getRecordDifferences = (rec1, rec2) => {
        const differences = {};
        if (!rec1 || !rec2) return differences;

        const allFieldsToCompare = [
            'Doc_No', 'Ac_Name_E', 'Ac_Code', 'Value', 'Bank_Ac', 'Narration',
            'Item_Code', 'Quintal', 'Sale_Rate', 'Purchase_Rate',
            'Sale_TDS', 'Purchase_TDS', 'DO_No', 'Rate', 'SaleTDSApplicable','PurchaseTDSApplicable'
        ];

        allFieldsToCompare.forEach(key => {
            if (String(rec1[key] || '') !== String(rec2[key] || '')) {
                differences[key] = true;
            }
        });
        return differences;
    };

    const filterMainLogs = (logs) => {
        if (!searchTerm) return logs;

        const lowercasedSearch = searchTerm.toLowerCase();
        return logs.filter(log =>
            Object.values(log).some(value =>
                String(value).toLowerCase().includes(lowercasedSearch)
            ));
    };


    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const renderCompanyLogs = () => {
        if (loading) {
            return (
                <TableRow>
                    <TableCell colSpan={7} align="center">
                        <CircularProgress size={24} sx={{ my: 2, animation: `${pulse} 1.5s infinite` }} />
                        <Typography variant="body2" color="textSecondary">Loading logs...</Typography>
                    </TableCell>
                </TableRow>
            );
        }

        if (companyLogs.length === 0) {
            return (
                <TableRow>
                    <TableCell colSpan={7} align="center">
                        <Typography variant="body2" color="textSecondary" sx={{ my: 2 }}>
                            No logs found for the selected criteria. Try adjusting your filters.
                        </Typography>
                    </TableCell>
                </TableRow>
            );
        }

        const sortedLogs = [...companyLogs].sort((a, b) => {
            const dateTimeA = new Date(`${a.Record_Date}T${a.Updated_Time}`);
            const dateTimeB = new Date(`${b.Record_Date}T${b.Updated_Time}`);
            return dateTimeB - dateTimeA;
        });

        const filteredLogs = filterMainLogs(sortedLogs);
        const paginatedLogs = filteredLogs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

        return paginatedLogs.map((log, index) => (
            <StyledTableRow
                key={index}
                onClick={() => {
                    setSelectedLogIndex(index);
                    setSelectedLogData({ docNo: log.Doc_No, tranType: log.Tran_Type, updatedTime: log.Updated_Time });
                    fetchLogDetails(log.Doc_No, log.Tran_Type, log.Updated_Time);
                }}
                className={selectedLogIndex === index ? 'selected-row' : ''}
            >
                <TableCell sx={{ padding: '4px 8px' }}>{log.Doc_No}</TableCell>
                <TableCell sx={{ padding: '4px 8px' }}>{log.Tran_Type}</TableCell>
                <TableCell sx={{ padding: '4px 8px' }}>{log.User_Name}</TableCell>
                <TableCell sx={{ padding: '4px 8px' }}>{log.Doc_Date}</TableCell>
                <TableCell sx={{ padding: '4px 8px' }}>{log.Record_Date}</TableCell>
                <TableCell sx={{ padding: '4px 8px' }}>{formatTo12HourTime(log.Updated_Time)}</TableCell>
                <TableCell sx={{ padding: '4px 8px' }}>{log.count}</TableCell>
            </StyledTableRow>
        ));
    };

    const renderRecordsTable = (records, title, isOldTable = false) => {
        const getCorrespondingRecord = (currentRec, targetRecords) => {
            return targetRecords.find(otherRec =>
                otherRec.Doc_No === currentRec.Doc_No &&
                otherRec.Tran_Type === currentRec.Tran_Type &&
                otherRec.Ac_Code === currentRec.Ac_Code
            );
        };

        const diffColor = isOldTable ? '#ffcccc' : '#c8e6c9';

        return (
            <TableContainer component={Paper} sx={{ flex: 1, margin: '10px', maxHeight: '500px', overflowY: 'auto', overflowX: 'auto', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <FixedTableTitle>{title}</FixedTableTitle>
                <Table size="small" stickyHeader>
                    <TableHead>
                        <TableRow>
                            <StyledHeaderCell sx={{ padding: '4px 8px' }}>Doc No</StyledHeaderCell>
                            <StyledHeaderCell sx={{ padding: '4px 8px' }}>Account</StyledHeaderCell>
                            <StyledHeaderCell align="right" sx={{ padding: '4px 8px' }}>Amount</StyledHeaderCell>
                            <StyledHeaderCell sx={{ padding: '4px 8px' }}>Bank Account</StyledHeaderCell>
                            <StyledHeaderCell align="center" sx={{ padding: '4px 8px' }}>User Name</StyledHeaderCell>
                            <StyledHeaderCell sx={{ padding: '4px 8px' }}>Updated Time</StyledHeaderCell>
                            <StyledHeaderCell align="center" sx={{ padding: '4px 8px' }}>Type</StyledHeaderCell>
                            <StyledHeaderCell align="center" sx={{ padding: '4px 8px' }}>Narration</StyledHeaderCell>
                            <StyledHeaderCell align="center" sx={{ padding: '4px 8px' }}>Item Code</StyledHeaderCell>
                            <StyledHeaderCell align="center" sx={{ padding: '4px 8px' }}>Quintal</StyledHeaderCell>
                            <StyledHeaderCell align="center" sx={{ padding: '4px 8px' }}>Rate</StyledHeaderCell>
                            <StyledHeaderCell align="center" sx={{ padding: '4px 8px' }}>Sale Rate</StyledHeaderCell>
                            <StyledHeaderCell align="center" sx={{ padding: '4px 8px' }}>Purchase Rate</StyledHeaderCell>
                            <StyledHeaderCell align="center" sx={{ padding: '4px 8px' }}>Sale TDS</StyledHeaderCell>
                            <StyledHeaderCell align="center" sx={{ padding: '4px 8px' }}>Purchase TDS</StyledHeaderCell>
                            <StyledHeaderCell align="center" sx={{ padding: '4px 8px' }}>Do No.</StyledHeaderCell>
                            <StyledHeaderCell align="center" sx={{ padding: '4px 8px' }}>SaleTDS Applicable</StyledHeaderCell>
                            <StyledHeaderCell align="center" sx={{ padding: '4px 8px' }}>PurchaseTDS Applicable</StyledHeaderCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {records.length > 0 ? records.map((record, idx) => {
                            let differences = {};
                            if (isOldTable) {
                                const correspondingNewRecord = getCorrespondingRecord(record, newRecords);
                                differences = getRecordDifferences(record, correspondingNewRecord);
                            } else {
                                const correspondingOldRecord = getCorrespondingRecord(record, oldRecords);
                                differences = getRecordDifferences(correspondingOldRecord, record);
                            }

                            return (
                                <TableRow
                                    key={idx}
                                    sx={{
                                        backgroundColor: record.Record_Type === 'D' ? '#ffebee' : 'inherit',
                                        '&:hover': {
                                            backgroundColor: record.Record_Type === 'D' ? '#ffcdd2' : '#f0f4c3',
                                            cursor: "default"
                                        },
                                    }}
                                >
                                    <DiffHighlightedTableCell isDifference={differences.Doc_No} diffColor={diffColor}>
                                        <CustomWidthTooltip title={differences.Doc_No ? "Document Number changed" : ""}>
                                            {record.Doc_No}
                                        </CustomWidthTooltip>
                                    </DiffHighlightedTableCell>
                                    <DiffHighlightedTableCell isDifference={differences.Ac_Name_E || differences.Ac_Code} diffColor={diffColor}>
                                        <CustomWidthTooltip title={(differences.Ac_Name_E || differences.Ac_Code) ? "Account Name or Code changed" : ""}>
                                            {record.Ac_Name_E} ({record.Ac_Code})
                                        </CustomWidthTooltip>
                                    </DiffHighlightedTableCell>
                                    <DiffHighlightedTableCell align="right" isDifference={differences.Value} diffColor={diffColor}>
                                        <CustomWidthTooltip title={differences.Value ? "Amount changed" : ""}>
                                            {formatReadableAmount(record.Value)}
                                        </CustomWidthTooltip>
                                    </DiffHighlightedTableCell>
                                    <DiffHighlightedTableCell isDifference={differences.Bank_Ac} diffColor={diffColor}>
                                        <CustomWidthTooltip title={differences.Bank_Ac ? "Bank Account changed" : ""}>
                                            {record.Bank_Ac}
                                        </CustomWidthTooltip>
                                    </DiffHighlightedTableCell>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }} align="center">{record.User_Name}</TableCell>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatTo12HourTime(record.Updated_Time)}</TableCell>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }} align="center">
                                        <CustomWidthTooltip title={record.Record_Type === 'O' ? "Old Record" : record.Record_Type === 'N' ? "New Record" : "Deleted Record"}>
                                            <span style={{
                                                fontWeight: 'bold',
                                                color: record.Record_Type === 'O' ? '#ff9800' : record.Record_Type === 'N' ? '#4caf50' : '#f44336'
                                            }}>
                                                {record.Record_Type}
                                            </span>
                                        </CustomWidthTooltip>
                                    </TableCell>
                                    <DiffHighlightedTableCell align="center" isDifference={differences.Narration} diffColor={diffColor}>
                                        <CustomWidthTooltip title={differences.Narration ? "Narration changed" : ""}>
                                            {record.Narration}
                                        </CustomWidthTooltip>
                                    </DiffHighlightedTableCell>
                                    <DiffHighlightedTableCell align="center" isDifference={differences.Item_Code} diffColor={diffColor}>
                                        <CustomWidthTooltip title={differences.Item_Code ? "Item Code changed" : ""}>
                                            {record.Item_Code}
                                        </CustomWidthTooltip>
                                    </DiffHighlightedTableCell>
                                    <DiffHighlightedTableCell align="center" isDifference={differences.Quintal} diffColor={diffColor}>
                                        <CustomWidthTooltip title={differences.Quintal ? "Quintal changed" : ""}>
                                            {record.Quintal}
                                        </CustomWidthTooltip>
                                    </DiffHighlightedTableCell>
                                    <DiffHighlightedTableCell align="center" isDifference={differences.Rate} diffColor={diffColor}>
                                        <CustomWidthTooltip title={differences.Rate ? "Rate changed" : ""}>
                                            {record.Rate}
                                        </CustomWidthTooltip>
                                    </DiffHighlightedTableCell>
                                    <DiffHighlightedTableCell align="center" isDifference={differences.Sale_Rate} diffColor={diffColor}>
                                        <CustomWidthTooltip title={differences.Sale_Rate ? "Sale Rate changed" : ""}>
                                            {record.Sale_Rate}
                                        </CustomWidthTooltip>
                                    </DiffHighlightedTableCell>
                                    <DiffHighlightedTableCell align="center" isDifference={differences.Purchase_Rate} diffColor={diffColor}>
                                        <CustomWidthTooltip title={differences.Purchase_Rate ? "Purchase Rate changed" : ""}>
                                            {record.Purchase_Rate}
                                        </CustomWidthTooltip>
                                    </DiffHighlightedTableCell>
                                    <DiffHighlightedTableCell align="center" isDifference={differences.Sale_TDS} diffColor={diffColor}>
                                        <CustomWidthTooltip title={differences.Sale_TDS ? "Sale TDS Rate changed" : ""}>
                                            {record.Sale_TDS}
                                        </CustomWidthTooltip>
                                    </DiffHighlightedTableCell>
                                    <DiffHighlightedTableCell align="center" isDifference={differences.Purchase_TDS} diffColor={diffColor}>
                                        <CustomWidthTooltip title={differences.Purchase_TDS ? "Purchase TDS Rate changed" : ""}>
                                            {record.Purchase_TDS}
                                        </CustomWidthTooltip>
                                    </DiffHighlightedTableCell>
                                    <DiffHighlightedTableCell align="center" isDifference={differences.DO_No} diffColor={diffColor}>
                                        <CustomWidthTooltip title={differences.DO_No ? "DO_No changed" : ""}>
                                            {record.DO_No}
                                        </CustomWidthTooltip>
                                    </DiffHighlightedTableCell>
                                    <DiffHighlightedTableCell align="center" isDifference={differences.SaleTDSApplicable} diffColor={diffColor}>
                                        <CustomWidthTooltip title={differences.SaleTDSApplicable ? "SaleTDSApplicable changed" : ""}>
                                            {record.SaleTDSApplicable}
                                        </CustomWidthTooltip>
                                    </DiffHighlightedTableCell>
                                    <DiffHighlightedTableCell align="center" isDifference={differences.PurchaseTDSApplicable} diffColor={diffColor}>
                                        <CustomWidthTooltip title={differences.PurchaseTDSApplicable ? "PurchaseTDSApplicable changed" : ""}>
                                            {record.PurchaseTDSApplicable}
                                        </CustomWidthTooltip>
                                    </DiffHighlightedTableCell>
                                </TableRow>
                            );
                        }) : (
                            <TableRow>
                                <TableCell colSpan={10} align="center">
                                    <Typography variant="body2" color="textSecondary" sx={{ py: 2 }}>
                                        No records available
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        );
    };

    return (
        <div style={{ padding: '20px', marginTop: '-80px', fontFamily: 'Roboto, sans-serif' }}>
            <Grid container spacing={2} sx={{ marginBottom: '30px' }}>
                <Grid item xs={12} md={6}>
                    <Box sx={{
                        padding: '15px',
                        backgroundColor: '#e8eaf6',
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        height: '40%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: 1
                    }}>
                        <Grid container spacing={1} alignItems="flex-end">
                            <Grid item xs={12} sm={1.8}>
                                <TextField
                                    label="From Date"
                                    type="date"
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    inputProps={{ style: { fontSize: '12px', padding: '8.5px 14px' } }}
                                    size="small"
                                    variant="outlined"
                                />
                            </Grid>
                            <Grid item xs={12} sm={1.8}>
                                <TextField
                                    label="To Date"
                                    type="date"
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    inputProps={{ style: { fontSize: '12px', padding: '8.5px 14px' } }}
                                    size="small"
                                    variant="outlined"
                                />
                            </Grid>
                            <Grid item xs={12} sm={1.8}>
                                <FormControl fullWidth size="small" variant="outlined">
                                    <InputLabel sx={{ fontSize: '12px' }}>Tran Type</InputLabel>
                                    <Select
                                        value={filterType}
                                        onChange={handleFilterChange}
                                        label="Tran Type"
                                        inputProps={{ style: { fontSize: '12px', padding: '8.5px 14px' } }}
                                        sx={{ '.MuiSelect-select': { minHeight: 'auto' } }}
                                    >
                                        <MenuItem value="All" sx={{ fontSize: '12px' }}>All</MenuItem>
                                        <MenuItem value="BP" sx={{ fontSize: '12px' }}>Bank Payment</MenuItem>
                                        <MenuItem value="BR" sx={{ fontSize: '12px' }}>Bank Receipt</MenuItem>
                                        <MenuItem value="CR" sx={{ fontSize: '12px' }}>Cash Receipt</MenuItem>
                                        <MenuItem value="CP" sx={{ fontSize: '12px' }}>Cash Payment</MenuItem>
                                        <MenuItem value="JV" sx={{ fontSize: '12px' }}>Journal Voucher</MenuItem>
                                        <MenuItem value="UI" sx={{ fontSize: '12px' }}>UTR Entry</MenuItem>
                                        <MenuItem value="XP" sx={{ fontSize: '12px' }}>Other Purchase</MenuItem>
                                        <MenuItem value="DN" sx={{ fontSize: '12px' }}>Debit Note To Customer</MenuItem>
                                        <MenuItem value="CN" sx={{ fontSize: '12px' }}>Credit Note To Customer</MenuItem>
                                        <MenuItem value="DS" sx={{ fontSize: '12px' }}>Debit Note To Supplier</MenuItem>
                                        <MenuItem value="CS" sx={{ fontSize: '12px' }}>Credit Note To Supplier</MenuItem>
                                        <MenuItem value="PS" sx={{ fontSize: '12px' }}>Purchase Bill</MenuItem>
                                        <MenuItem value="SB" sx={{ fontSize: '12px' }}>Sale Bill</MenuItem>
                                        <MenuItem value="RB" sx={{ fontSize: '12px' }}>Service Bill</MenuItem>
                                        <MenuItem value="TN" sx={{ fontSize: '12px' }}>Tender Purchase</MenuItem>
                                        <MenuItem value="DO" sx={{ fontSize: '12px' }}>Delivery Order</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    label="Search Account"
                                    value={acNameE}
                                    onChange={(e) => setAcNameE(e.target.value)}
                                    fullWidth
                                    InputLabelProps={{ shrink: true, style: { fontSize: '12px' } }}
                                    inputProps={{ style: { fontSize: '12px', padding: '8.5px 14px' } }}
                                    size="small"
                                    variant="outlined"
                                    placeholder="Search by Account Name..."
                                />
                            </Grid>
                            <Grid item xs={12} sm={2} sx={{ mt: { xs: 1, sm: 0 } }}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    fullWidth
                                    onClick={fetchCompanyLogs}
                                    sx={{ height: '35px', fontSize: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.2)', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 8px rgba(0,0,0,0.3)' } }}
                                >
                                    Fetch Logs
                                </Button>
                            </Grid>
                        </Grid>
                    </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                        <TextField
                            size="small"
                            placeholder="Search in logs..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setPage(0);
                            }}
                            sx={{
                                width: '250px',
                                '& .MuiInputBase-root': {
                                    height: '36px'
                                }
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Box>
                    <TableContainer component={Paper} sx={{
                        height: 'calc(85% - 40px)',
                        borderRadius: '12px',
                        boxShadow: '0 6px 15px rgba(0,0,0,0.15)',
                        overflow: 'auto',
                    }}>
                        <Table size="medium" stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <StyledHeaderCell sx={{ padding: '4px 8px' }}>Doc No</StyledHeaderCell>
                                    <StyledHeaderCell sx={{ padding: '4px 8px' }}>Tran Type</StyledHeaderCell>
                                    <StyledHeaderCell sx={{ padding: '4px 8px' }}>User Name</StyledHeaderCell>
                                    <StyledHeaderCell sx={{ padding: '4px 8px' }}>Doc Date</StyledHeaderCell>
                                    <StyledHeaderCell sx={{ padding: '4px 8px' }}>Update Date</StyledHeaderCell>
                                    <StyledHeaderCell sx={{ padding: '4px 8px' }}>Updated Time</StyledHeaderCell>
                                    <StyledHeaderCell sx={{ padding: '4px 8px' }}>Changes Count</StyledHeaderCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {renderCompanyLogs()}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25]}
                        component="div"
                        count={filterMainLogs(companyLogs).length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        sx={{
                            borderTop: '1px solid #e0e0e0',
                            borderRadius: '0 0 12px 12px',
                            backgroundColor: '#f5f5f5',
                            '.MuiTablePagination-toolbar': {
                                flexWrap: 'wrap',
                                justifyContent: 'center',
                            },
                            '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                                fontSize: '0.75rem',
                            },
                            '.MuiSelect-select': {
                                fontSize: '0.75rem',
                            },
                        }}
                    />
                </Grid>
            </Grid>

            {selectedLogData && (
                <div style={{ marginTop: '5px' }}>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '5px',
                        width: '100%',
                        alignItems: 'center'
                    }}>
                        {renderRecordsTable(oldRecords, "Previous Version (Old/Deleted)", true)}
                        {renderRecordsTable(newRecords, "Current Version (New Entry)", false)}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompanyLogs;