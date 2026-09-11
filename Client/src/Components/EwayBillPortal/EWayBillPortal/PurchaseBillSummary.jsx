import React, { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TablePagination,
    Box,
    TableSortLabel,
    TableFooter
} from '@mui/material';
import axios from 'axios';
import NoDataAlert from '../Alert/Alert';
import SearchBar from '../../../Common/SearchBar/SearchBar';
import CircularSpinner from "../../../Common/Spinners/CircularSpinner"
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";

const apikey = process.env.REACT_APP_API;

const tableHeaderCellStyles = {
    fontSize: '16px',
    fontWeight: 'bold',
    backgroundColor: '#f4f4f4',
    whiteSpace: 'nowrap',
    position: 'sticky',
    top: 0,
    zIndex: 1,
};


const tableCellStyle = {
    fontSize: '16px',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
};

const PurchaseBillSummary = ({ fromDate }) => {

    const Company_Code = sessionStorage.getItem('Company_Code');
    const Year_Code = sessionStorage.getItem('Year_Code');

    // const Company_Code = 1
    // const Year_Code = 4

    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [rowsPerPage, setRowsPerPage] = useState(500);
    const [page, setPage] = useState(0);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [loading, setLoading] = useState(false);

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        if (isNaN(date)) return '';

        const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
        return new Intl.DateTimeFormat('en-GB', options).format(date);
    };


    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await axios.get(
                    `${apikey}/purchasebill-reportdata`,
                    {
                        params: {
                            doc_date: fromDate,
                            Company_Code: Company_Code,
                            Year_Code: Year_Code,
                        },
                    }
                );
                setData(response.data);
                setFilteredData(response.data);
            } catch (error) {
                console.error('Error fetching data:', error);
                setData([]);
                setFilteredData([]);
            }
            finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [fromDate]);


    useEffect(() => {
        const lowerCaseQuery = searchQuery.toLowerCase();
        const filtered = data.filter((row) =>
            Object.values(row).some((value) =>
                String(value).toLowerCase().includes(lowerCaseQuery)
            )
        );
        setFilteredData(filtered);
    }, [searchQuery, data]);

    const totals = filteredData.reduce((acc, row) => {
        acc.TaxableAmount += parseFloat(row.TaxableAmount || 0);
        acc.CGST += parseFloat(row.CGST || 0);
        acc.SGST += parseFloat(row.SGST || 0);
        acc.IGST += parseFloat(row.IGST || 0);
        acc.Payable_Amount += parseFloat(row.Payable_Amount || 0);
        return acc;
    }, { TaxableAmount: 0, CGST: 0, SGST: 0, IGST: 0, Payable_Amount: 0 });

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });

        const sortedData = [...filteredData].sort((a, b) => {
            if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
            if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
            return 0;
        });
        setFilteredData(sortedData);
    };

    return (
        <div>
            <Box sx={{ marginBottom: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
            </Box>

            {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" height="600px">
                    <CircularSpinner />
                </Box>
            ) : filteredData.length === 0 ? (
                <NoDataAlert />
            ) : (
                <>
                    <TableContainer component={Paper} style={{
                        maxWidth: '99%',
                        margin: '0 auto',
                        height: "75vh"
                    }}>
                        <Table stickyHeader>
                            <TableHead>
                                <TableRow>

                                    <TableCell style={tableHeaderCellStyles}>
                                        <TableSortLabel
                                            active={sortConfig.key === 'SR_No'}
                                            direction={sortConfig.key === 'SR_No' ? sortConfig.direction : 'asc'}
                                            onClick={() => handleSort('SR_No')}
                                        >
                                            SR No
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell style={tableHeaderCellStyles}>DO No</TableCell>
                                    <TableCell style={tableHeaderCellStyles}>
                                        <TableSortLabel
                                            active={sortConfig.key === 'OurNo'}
                                            direction={sortConfig.key === 'OurNo' ? sortConfig.direction : 'asc'}
                                            onClick={() => handleSort('OurNo')}
                                        >
                                            Pur No
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell style={tableHeaderCellStyles}>Pur Date</TableCell>
                                    <TableCell style={tableHeaderCellStyles}>Mill Invoice No.</TableCell>
                                    <TableCell style={tableHeaderCellStyles}>
                                        <TableSortLabel
                                            active={sortConfig.key === 'MillEwayBill_NO'}
                                            direction={sortConfig.key === 'MillEwayBill_NO' ? sortConfig.direction : 'asc'}
                                            onClick={() => handleSort('MillEwayBill_NO')}
                                        >
                                            Mill EwayBill NO.
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell style={tableHeaderCellStyles}>From GST No.</TableCell>
                                    <TableCell style={tableHeaderCellStyles}>Party Code</TableCell>
                                    <TableCell style={tableHeaderCellStyles}>Bill From</TableCell>
                                    <TableCell style={tableHeaderCellStyles}>Mill Name</TableCell>
                                    <TableCell style={tableHeaderCellStyles}>From State Code</TableCell>
                                    <TableCell style={tableHeaderCellStyles}>Vehicle No.</TableCell>
                                    <TableCell style={tableHeaderCellStyles}>Quintal</TableCell>
                                    <TableCell style={tableHeaderCellStyles}>Rate</TableCell>
                                    <TableCell style={tableHeaderCellStyles}>Taxable Amount</TableCell>
                                    <TableCell style={tableHeaderCellStyles}>CGST</TableCell>
                                    <TableCell style={tableHeaderCellStyles}>SGST</TableCell>
                                    <TableCell style={tableHeaderCellStyles}>IGST</TableCell>
                                    <TableCell style={tableHeaderCellStyles}>Payable Amount</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredData
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map((row, index) => (
                                        <TableRow
                                            key={index}
                                            sx={{
                                                cursor: "pointer",
                                                transition: "background-color 0.3s ease, box-shadow 0.2s ease",
                                                '&:hover': {
                                                    backgroundColor: '#f3f388',
                                                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                                                },
                                            }}
                                        >
                                            <TableCell style={tableCellStyle}>{row.SR_No}</TableCell>
                                            <TableCell style={tableCellStyle}>{row.DO}</TableCell>
                                            <TableCell style={tableCellStyle}>{row.OurNo}</TableCell>
                                            <TableCell style={tableCellStyle}>{formatDate(row.Date)}</TableCell>
                                            <TableCell style={tableCellStyle}>{row.MillInvoiceNo}</TableCell>
                                            <TableCell style={tableCellStyle}>{row.MillEwayBill_NO}</TableCell>
                                            <TableCell style={tableCellStyle}>{row.FromGSTNo}</TableCell>
                                            <TableCell style={tableCellStyle}>{row.Party_Code}</TableCell>
                                            <TableCell style={tableCellStyle}>{row.Party_Name}</TableCell>
                                            <TableCell style={tableCellStyle}>{row.millshortname}</TableCell>
                                            <TableCell style={tableCellStyle}>{row.FromStateCode}</TableCell>
                                            <TableCell style={tableCellStyle}>{row.Vehicle_No}</TableCell>
                                            <TableCell style={tableCellStyle}>{formatReadableAmount(row.Quintal)}</TableCell>
                                            <TableCell style={tableCellStyle}>{formatReadableAmount(parseFloat(row.Rate).toFixed(2))}</TableCell>
                                            <TableCell style={tableCellStyle}>{formatReadableAmount(parseFloat(row.TaxableAmount || 0).toFixed(2))}</TableCell>
                                            <TableCell style={tableCellStyle}>{formatReadableAmount(parseFloat(row.CGST || 0).toFixed(2))}</TableCell>
                                            <TableCell style={tableCellStyle}>{formatReadableAmount(parseFloat(row.SGST || 0).toFixed(2))}</TableCell>
                                            <TableCell style={tableCellStyle}>{formatReadableAmount(parseFloat(row.IGST || 0).toFixed(2))}</TableCell>
                                            <TableCell style={tableCellStyle}>{formatReadableAmount(parseFloat(row.Payable_Amount || 0).toFixed(2))}</TableCell>
                                        </TableRow>
                                    ))}
                            </TableBody>
                            <TableFooter>
                                <TableRow>
                                    <TableCell colSpan={14} style={{ textAlign: 'right', fontWeight: 'bold' }}>Total</TableCell>
                                    <TableCell style={tableCellStyle}>{formatReadableAmount(totals.TaxableAmount.toFixed(2))}</TableCell>
                                    <TableCell style={tableCellStyle}>{formatReadableAmount(totals.CGST.toFixed(2))}</TableCell>
                                    <TableCell style={tableCellStyle}>{formatReadableAmount(totals.SGST.toFixed(2))}</TableCell>
                                    <TableCell style={tableCellStyle}>{formatReadableAmount(totals.IGST.toFixed(2))}</TableCell>
                                    <TableCell style={tableCellStyle}>{formatReadableAmount(totals.Payable_Amount.toFixed(2))}</TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </TableContainer>

                    <TablePagination
                        rowsPerPageOptions={[15, 50, 100]}
                        component="div"
                        count={filteredData.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                </>
            )}
        </div>
    );
};

export default PurchaseBillSummary;
