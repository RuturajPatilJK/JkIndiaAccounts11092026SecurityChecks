import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import { formatReadableAmount } from '../../Common/FormatFunctions/FormatAmount';
import {
    Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, Paper, Typography, TableFooter, TableSortLabel,
} from '@mui/material';
import { ScaleLoader } from 'react-spinners';
import BackButton from '../../Common/Buttons/BackButton';

const apikey = process.env.REACT_APP_API;

const SCREEN_COLUMNS = [
    { label: 'Ac Code', key: 'Ac_Code', width: '10%' },
    { label: 'Account Name', key: 'Ac_Name_E', width: '32%' },
    // { label: 'Accoid', key: 'accoid', width: '10%' },
    { label: 'Yearly Turnover', key: 'yearly_turnover', width: '18%', numeric: true },
    { label: 'Turnover %', key: 'turnover_percentage', width: '15%', numeric: true },
    // { label: 'Company Code', key: 'Company_Code', width: '10%' },
    // { label: 'Year Code', key: 'Year_Code', width: '10%' },
];

const TopBuyerPercentageReport = () => {
    const navigate = useNavigate();
    const Company_Name = sessionStorage.getItem('Company_Name');
    const companyCode = sessionStorage.getItem('Company_Code');
    const yearCode = sessionStorage.getItem('Year_Code');

    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchText, setSearchText] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'turnover_percentage', direction: 'desc' });

    const API_URL = `${apikey}/top-buyer-percentage-report`;

    useEffect(() => {
        const fetchReportData = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await axios.get(API_URL, {
                    params: { Company_Code: companyCode, Year_Code: yearCode },
                });
                setReportData(Array.isArray(response.data) ? response.data : []);
            } catch (err) {
                console.error(err);
                setError('Error fetching report');
            } finally {
                setLoading(false);
            }
        };
        fetchReportData();
    }, [API_URL, companyCode, yearCode]);

    const filteredData = useMemo(() => {
        const term = searchText.trim().toLowerCase();
        if (!term) return reportData;
        return reportData.filter((item) =>
            Object.values(item).some((v) => String(v ?? '').toLowerCase().includes(term))
        );
    }, [reportData, searchText]);

    const sortedData = useMemo(() => {
        const items = [...filteredData];
        if (sortConfig.key) {
            items.sort((a, b) => {
                const va = a[sortConfig.key];
                const vb = b[sortConfig.key];
                const na = parseFloat(va);
                const nb = parseFloat(vb);
                let cmp;
                if (!isNaN(na) && !isNaN(nb)) {
                    cmp = na - nb;
                } else {
                    cmp = String(va ?? '').localeCompare(String(vb ?? ''));
                }
                return sortConfig.direction === 'asc' ? cmp : -cmp;
            });
        }
        return items;
    }, [filteredData, sortConfig]);

    const requestSort = (key) =>
        setSortConfig((prev) => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
        }));

    const grandTotals = useMemo(
        () =>
            sortedData.reduce(
                (acc, item) => {
                    acc.yearly_turnover += parseFloat(item.yearly_turnover) || 0;
                    acc.turnover_percentage += parseFloat(item.turnover_percentage) || 0;
                    return acc;
                },
                { yearly_turnover: 0, turnover_percentage: 0 }
            ),
        [sortedData]
    );

    const handleExportToExcel = () => {
        const headers = SCREEN_COLUMNS.map((c) => c.label);
        const tableData = sortedData.map((item) =>
            SCREEN_COLUMNS.map((col) => (col.numeric ? Number(item[col.key]) || 0 : item[col.key]))
        );
        const totalRow = [
            'GRAND TOTAL', '', '',
            grandTotals.yearly_turnover,
            grandTotals.turnover_percentage,
            '', '',
        ];

        const worksheetData = [
            [Company_Name ? Company_Name.toUpperCase() : ''],
            ['Top Buyer Percentage Wise Report'],
            [],
            headers,
            ...tableData,
            totalRow,
        ];

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(worksheetData);
        ws['!cols'] = SCREEN_COLUMNS.map((col) => ({ wch: col.width ? parseInt(col.width) * 1.5 : 20 }));
        XLSX.utils.book_append_sheet(wb, ws, 'TopBuyerPercentage');
        XLSX.writeFile(wb, `Top_Buyer_Percentage_Report_${companyCode}_${yearCode}.xlsx`);
    };

    return (
        <div style={{ marginTop: '-60px', padding: '20px' }}>
            <div style={{ marginTop: '20px', padding: '20px' }}>
                <BackButton onClick={() => navigate('/Analytics')} />
            </div>

            <Typography variant="h6" align="center">Top Buyer Percentage Wise Report</Typography>

            <div className="my-3 no-print d-flex justify-content-between align-items-center">
                <input
                    type="text"
                    placeholder="Search..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="form-control"
                    style={{ maxWidth: 280 }}
                />
                <button className="btn btn-success" onClick={handleExportToExcel}>Export Excel</button>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            <TableContainer component={Paper} style={{ maxHeight: '700px', position: 'relative' }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            {SCREEN_COLUMNS.map((col) => (
                                <TableCell
                                    key={col.key}
                                    align={col.numeric ? 'right' : 'left'}
                                    style={{ fontWeight: 'bold', backgroundColor: '#5557df', color: '#fff', whiteSpace: 'nowrap' }}
                                >
                                    <TableSortLabel
                                        active={sortConfig.key === col.key}
                                        direction={sortConfig.direction}
                                        onClick={() => requestSort(col.key)}
                                        sx={{
                                            '&.MuiTableSortLabel-root, &.Mui-active, & .MuiTableSortLabel-icon': { color: '#fff !important' },
                                        }}
                                    >
                                        {col.label}
                                    </TableSortLabel>
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {sortedData.map((item, index) => (
                            <TableRow key={item.accoid ?? index} hover style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f5f8ff' }}>
                                <TableCell style={{ fontSize: '0.78rem' }}>{item.Ac_Code}</TableCell>
                                <TableCell style={{ fontSize: '0.78rem' }}>{item.Ac_Name_E}</TableCell>
                                {/* <TableCell style={{ fontSize: '0.78rem' }}>{item.accoid}</TableCell> */}
                                <TableCell align="right" style={{ fontSize: '0.78rem' }}>{formatReadableAmount(Number(item.yearly_turnover || 0).toFixed(2))}</TableCell>
                                <TableCell align="right" style={{ fontSize: '0.78rem' }}>{Number(item.turnover_percentage || 0).toFixed(2)}%</TableCell>
                                {/* <TableCell style={{ fontSize: '0.78rem' }}>{item.Company_Code}</TableCell>
                                <TableCell style={{ fontSize: '0.78rem' }}>{item.Year_Code}</TableCell> */}
                            </TableRow>
                        ))}
                        {sortedData.length === 0 && !loading && (
                            <TableRow>
                                <TableCell colSpan={SCREEN_COLUMNS.length} align="center" style={{ padding: '40px', color: '#94a3b8' }}>
                                    No records found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>

                    <TableFooter style={{ position: 'sticky', bottom: 0, zIndex: 2 }}>
                        <TableRow style={{ backgroundColor: '#ffffcc' }}>
                            <TableCell colSpan={2} style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>GRAND TOTAL</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>{formatReadableAmount(grandTotals.yearly_turnover.toFixed(2))}</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>{grandTotals.turnover_percentage.toFixed(2)}%</TableCell>
                            <TableCell colSpan={2}></TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </TableContainer>

            {loading && (
                <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 9999 }}>
                    <ScaleLoader color="#36d7b7" height={35} />
                </div>
            )}
        </div>
    );
};

export default TopBuyerPercentageReport;
