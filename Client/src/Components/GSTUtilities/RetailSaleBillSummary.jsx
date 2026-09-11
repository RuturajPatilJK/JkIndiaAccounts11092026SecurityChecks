import React, { useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import 'bootstrap/dist/css/bootstrap.min.css';
import Swal from 'sweetalert2';
import { CircularProgress } from '@mui/material';

const API_URL = process.env.REACT_APP_API;

const RetailSaleBillSummary = ({ fromDate, toDate, companyCode, yearCode, accode }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isDataFetched, setIsDataFetched] = useState(false);

    const fetchPurchaseBillSummary = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await axios.get(`${API_URL}/retailsalebill-summary`, {
                params: {
                    from_date: fromDate,
                    to_date: toDate,
                    Company_Code: companyCode,
                    Year_Code: yearCode,
                    accode: accode
                },
            });
            if (response.data.length === 0) {
                Swal.fire({
                    icon: 'error',
                    title: 'Data Not Found.!',
                    text: 'No Retail Sale Bill Summary data found for the selected date range.',
                });
                return;
            }
            setData(response.data);
            setIsDataFetched(true);
        } catch (err) {
            setError('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const exportToXlsx = () => {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'RetailsaleBillSummary');
        XLSX.writeFile(wb, 'RetailsaleBillSummary.xlsx');
    };

    // Define the column order explicitly
    const columns = [
        'Tran_Type',
        'Invoice_No',
        'PartyGSTNo',
        'Party_Code',
        'PartyName',
        'PartyStateCode',
        'Invoice_Date',
        'Vahical_No',
        'TaxableAmount',
        'CGST',
        'SGST',
        'IGST',
        'Final_Amount'


    ];

    // Calculate totals for Quintal, TaxableAmount, CGST, SGST, IGST, and Payable_Amount
    const calculateTotals = () => {
        let totals = {

            TaxableAmount: 0,
            CGST: 0,
            SGST: 0,
            IGST: 0,
            Final_Amount: 0
        };

        data.forEach(row => {
            //totals.Quintal += parseFloat(row.Quintal || 0);
            totals.TaxableAmount += parseFloat(row.TaxableAmount || 0);
            totals.CGST += parseFloat(row.CGST || 0);
            totals.SGST += parseFloat(row.SGST || 0);
            totals.IGST += parseFloat(row.IGST || 0);
            totals.Final_Amount += parseFloat(row.Final_Amount || 0);
        });

        return totals;
    };

    const totals = calculateTotals();

    return (
        <div className="d-flex flex-column align-items-center" style={{ marginTop: '5px' }}>
            {/* <button
                className="btn btn-primary mb-3"
                onClick={fetchPurchaseBillSummary}
                disabled={loading}
                style={{
                    width: '20%',
                    height: '60px',
                }}
            >
                {loading ? 'Loading...' : 'Retail Sale Bill Summary'}
            </button>
 */}



            <button style={{
                marginTop: '10px',
                background: '#007bff',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 10px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(26,35,126,0.2)',
                width: '20%',
                height: '60px'
            }} onClick={fetchPurchaseBillSummary} disabled={loading}>
                {loading ? <CircularProgress size={24} color="inherit" /> : "Retail Sale Bill Summary"}
            </button>

            {isDataFetched && (
                <button className="btn btn-success mt-3" style={{ float: 'left' }} onClick={exportToXlsx}>
                    Export to Excel
                </button>
            )}

            {error && <div className="alert alert-danger">{error}</div>}

            {data.length > 0 && (
                <>
                    <table className="table table-bordered mt-3" style={{ width: '80%' }}>
                        <thead>
                            <tr>
                                {columns.map((column) => (
                                    <th key={column}>{column}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, index) => (
                                <tr key={index}>
                                    {columns.map((column, idx) => (
                                        <td key={idx}>{row[column] || ''}</td>
                                    ))}
                                </tr>
                            ))}

                            <tr >
                                <td style={{ fontWeight: 'bold', backgroundColor: 'yellow' }} colSpan="7"></td>

                                <td style={{ fontWeight: 'bold', backgroundColor: 'yellow' }}></td>
                                <td style={{ fontWeight: 'bold', backgroundColor: 'yellow' }}>{totals.TaxableAmount.toFixed(2)}</td>
                                <td style={{ fontWeight: 'bold', backgroundColor: 'yellow' }}>{totals.CGST.toFixed(2)}</td>
                                <td style={{ fontWeight: 'bold', backgroundColor: 'yellow' }}>{totals.SGST.toFixed(2)}</td>
                                <td style={{ fontWeight: 'bold', backgroundColor: 'yellow' }}>{totals.IGST.toFixed(2)}</td>
                                <td style={{ fontWeight: 'bold', backgroundColor: 'yellow' }}>{totals.Final_Amount.toFixed(2)}</td>
                                <td style={{ fontWeight: 'bold', backgroundColor: 'yellow' }}></td>
                            </tr>
                        </tbody>
                    </table>
                </>
            )}
        </div>
    );
};

export default RetailSaleBillSummary;

