import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BackButton from "../../../Common/Buttons/BackButton";
import { useNavigate } from "react-router-dom";
import Swal from 'sweetalert2';

const apikey = process.env.REACT_APP_API;

const TrialBalance = () => {
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [acType, setAcType] = useState('');
    const [data, setData] = useState([]);
    const [selectedRows, setSelectedRows] = useState({});
    const [selectAll, setSelectAll] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitResult, setSubmitResult] = useState(null);
    const [searchText, setSearchText] = useState('');
    const [amountFilter, setAmountFilter] = useState('all');
    const [minAmount, setMinAmount] = useState('');
    const [maxAmount, setMaxAmount] = useState('');
    const Company_Code = sessionStorage.getItem('Company_Code');
    const Year_Code = sessionStorage.getItem('Year_Code');
    const username = sessionStorage.getItem('username');
    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState('0');
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [dataType, setDataType] = useState('trial');

    const navigate = useNavigate();

    useEffect(() => {
        const currentDate = new Date().toISOString().split('T')[0];
        setFromDate(currentDate);
        setToDate(currentDate);
    }, []);


    useEffect(() => {
        const fetchGroups = async () => {
            try {
                const response = await axios.get(`${apikey}/get-groups`, {
                    params: {
                        company_code: Company_Code
                    }
                });
                setGroups(response.data.data);
            } catch (error) {
                console.error('Error fetching groups:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to fetch groups',
                    confirmButtonColor: '#3085d6',
                    confirmButtonText: 'OK'
                });
            }
        };

        fetchGroups();
    }, [Company_Code]);

    const handleGetData = async () => {
        setIsLoadingData(true);
        setDataType('trial');
        try {
            const params = {
                from_date: fromDate,
                to_date: toDate,
                company_code: Company_Code,
                year_code: Year_Code,
                group_code: selectedGroup
            };
            if (acType) params.Ac_type = acType;

            const response = await axios.get(`${apikey}/trial-balance-getData`, {
                params,
            });

            setData(response.data.data);
            setSelectedRows({});
            setSelectAll(false);
            setSubmitResult(null);
        } catch (error) {
            console.error('Error fetching data:', error);
            alert('Failed to fetch data.');
        } finally {
            setIsLoadingData(false);
        }
    };

    const handleDepreciationClick = async () => {
    setIsLoadingData(true);
    setDataType('depreciation');

  


    const payload = {
        as_on_date: toDate,
        start_date:fromDate,
        end_date: toDate,
        company_code: Company_Code
    };

    try {
        const response = await axios.post(`${apikey}/calculate-depreciation`, payload);
        setData(response.data.data);
    } catch (error) {
        console.error("Error fetching depreciation data:", error);
        Swal.fire("Error", "Failed to fetch depreciation data", "error");
    } finally {
        setIsLoadingData(false);
    }
};

console.log(data)

const handlePostDepreciation = async () => {
  const selectedAccounts = data.filter(row => parseFloat(row.Depamount || 0) > 0);

  console.log(selectedAccounts)

  if (selectedAccounts.length === 0) {
    Swal.fire({
      icon: 'warning',
      title: 'No Depreciation Found',
      text: 'No depreciation amount found to post.',
      confirmButtonColor: '#3085d6',
      confirmButtonText: 'OK'
    });
    return;
  }

  setIsSubmitting(true);
  setSubmitResult(null);

  try {
    const payload = {
      company_code: Company_Code,
      year_code: Year_Code,
      username: username,
      rows: selectedAccounts.map(row => ({
        accode: row.accode,
        ac: row.ac,
        acname: row.acname,
        Depamount: parseFloat(row.Depamount || 0)  
      }))
    };

    

    const response = await axios.post(`${apikey}/create_depreciationJV`, payload);

    setSubmitResult({
      success: true,
      message: response.data.message,
      docNo: response.data.doc_no,
      totalAmount: response.data.total_amount,
      entryCount: response.data.entry_count
    });

    Swal.fire({
      icon: 'success',
      title: 'Success',
      html: `Journal Voucher Created<br>Doc No: ${response.data.doc_no}`,
      confirmButtonText: 'OK'
    });

  } catch (error) {
    console.error('Error creating Depreciation JV:', error);
    setSubmitResult({
      success: false,
      message: error.response?.data?.error || 'Failed to create Depreciation JV'
    });

    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.response?.data?.error || 'Failed to create Depreciation JV',
      confirmButtonText: 'OK'
    });
  } finally {
    setIsSubmitting(false);
  }
};


    const handleSelectAll = () => {
        const newSelected = { ...selectedRows };
        if (!selectAll) {
            filteredData.forEach((row) => {
                newSelected[row.accode] = true;
            });
        } else {
            data.forEach((row) => {
                delete newSelected[row.accode];
            });
        }
        setSelectedRows(newSelected);
        setSelectAll(!selectAll);
    };


    const handleCheckboxChange = (accode) => {
        setSelectedRows((prev) => {
            const newSelected = { ...prev };
            if (newSelected[accode]) {
                delete newSelected[accode];
            } else {
                newSelected[accode] = true;
            }
            return newSelected;
        });
    };

    const handleCreateJV = async () => {
        const selectedAccounts = data.filter(row => selectedRows[row.accode]);
        if (selectedAccounts.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'No Account Selected',
                text: 'Please select at least one account to create a Journal Voucher.',
                confirmButtonColor: '#3085d6',
                confirmButtonText: 'OK'
            });
            return;
        }

        setIsSubmitting(true);
        setSubmitResult(null);

        try {
            const payload = {
                company_code: Company_Code,
                year_code: Year_Code,
                username: username,
                rows: selectedAccounts.map(row => ({
                    accode: row.accode,
                    ac: row.ac,
                    acname: row.acname,
                    debitAmt: parseFloat(row.debitAmt) || 0,
                    creditAmt: parseFloat(row.creditAmt) || 0
                }))
            };

            const response = await axios.post(`${apikey}/create_roundoffJV`, payload);
            setSubmitResult({
                success: true,
                message: 'Journal Voucher created successfully',
                docNo: response.data.doc_no,
                totalAmount: response.data.total_amount,
                entryCount: response.data.entry_count
            });
        } catch (error) {
            console.error('Error creating JV:', error);
            setSubmitResult({
                success: false,
                message: error.response?.data?.error || 'Failed to create Journal Voucher'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedCount = Object.keys(selectedRows).filter(key => selectedRows[key]).length;

    const filteredData = data.filter(row => {
        const textMatch =
            row.accode.toString().toLowerCase().includes(searchText.toLowerCase()) ||
            row.acname.toLowerCase().includes(searchText.toLowerCase()) ||
            (row.city || '').toLowerCase().includes(searchText.toLowerCase());

        let amountMatch = true;
        if (minAmount || maxAmount) {
            const min = parseFloat(minAmount) || 0;
            const max = parseFloat(maxAmount) || Infinity;

            if (amountFilter === 'debit') {
                const debit = parseFloat(row.debitAmt) || 0;
                amountMatch = debit >= min && debit <= max;
            } else if (amountFilter === 'credit') {
                const credit = parseFloat(row.creditAmt) || 0;
                amountMatch = credit >= min && credit <= max;
            } else {
                const debit = parseFloat(row.debitAmt) || 0;
                const credit = parseFloat(row.creditAmt) || 0;
                amountMatch = (debit >= min && debit <= max) || (credit >= min && credit <= max);
            }
        }

        return textMatch && amountMatch;
    });


    const allSelected = filteredData.length > 0 && filteredData.every(row => selectedRows[row.accode]);
    const someSelected = !allSelected && filteredData.some(row => selectedRows[row.accode]);

    const handleBackClick = () => {
        navigate("/dashboard");
    }

    const renderGroupsDropdown = () => (
        <div className="max-w-xs w-full">
            <label htmlFor="groupSelect" className="block text-sm font-bold mb-2 text-left">
                Group
            </label>
            <select
                id="groupSelect"
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
            >
                <option value="0">All Groups</option>
                {groups.map(group => (
                    <option key={group.group_code} value={group.group_code}>
                        {group.group_name}
                    </option>
                ))}
            </select>
        </div>
    );

    return (
        <>
            <div style={{ marginTop: "-90px" }}>
                <BackButton onClick={handleBackClick} />
                <div className="max-w-4xl mx-auto -mt-8">
                    <div className="bg-white shadow-md rounded p-6">
                        <h2 className="text-xl font-semibold mb-2">Trial Balance Screen</h2>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
                            <div className="max-w-xs w-full">
                                <label htmlFor="fromDate" className="block text-sm font-bold text-left">
                                    From Date
                                </label>
                                <input
                                    id="fromDate"
                                    type="date"
                                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                />
                            </div>

                            <div className="max-w-xs w-full">
                                <label htmlFor="toDate" className="block text-sm font-bold text-left">
                                    To Date
                                </label>
                                <input
                                    id="toDate"
                                    type="date"
                                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                />
                            </div>

                            <div className="max-w-xs w-full">
                                {renderGroupsDropdown()}
                            </div>

                            <div className="max-w-xs w-full">
                                <button
                                    onClick={handleGetData}
                                    disabled={isLoadingData}
                                    className={`w-full bg-blue-600 text-white font-semibold py-2 rounded shadow-md hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-400 transition flex justify-center items-center ${isLoadingData ? 'opacity-75 cursor-not-allowed' : ''
                                        }`}
                                    type="button"
                                >
                                    {isLoadingData ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Loading...
                                        </>
                                    ) : (
                                        'Get Data'
                                    )}
                                </button>
                            </div>

                            <div className="max-w-xs w-full">
    <button
        onClick={handleDepreciationClick}
        disabled={isLoadingData}
        className={`w-full bg-purple-600 text-white font-semibold py-2 rounded shadow-md hover:bg-purple-700 focus:outline-none focus:ring-4 focus:ring-purple-400 transition flex justify-center items-center ${isLoadingData ? 'opacity-75 cursor-not-allowed' : ''}`}
        type="button"
    >
        {isLoadingData ? (
            <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
            </>
        ) : (
            'Show Depreciation (AO)'
        )}
    </button>
</div>
{dataType === 'depreciation' && data.some(row => parseFloat(row.Depamount || 0) > 0) && (
  <div className="mt-4 flex justify-end">
    <button
      onClick={handlePostDepreciation}
      disabled={isSubmitting}
      className={`px-4 py-2 rounded text-white font-semibold ${
        isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
      }`}
    >
      {isSubmitting ? 'Posting...' : 'Post Depreciation'}
    </button>
  </div>
)}




                        </div>
                    </div>
                </div>


                {data.length === 0 ? (
                    <div className="max-w-4xl mx-auto mt-4 bg-yellow-100 text-yellow-800 p-4 rounded">
                        <p className="font-semibold">Data is not available.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto bg-white shadow-md rounded p-2 max-w-7xl mx-auto">
                         {dataType === 'trial' ? (
                             <>
                        <div className="mb-2 flex flex-wrap justify-between items-center gap-4">
                            <div className="flex-1 min-w-[300px]">
                                <input
                                    type="text"
                                    placeholder="Search by account name, code, or city"
                                    className="w-90 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                />
                            </div>

                            <div className="flex flex-wrap items-center gap-1">
                                <input
                                    type="number"
                                    placeholder="₹ Min"
                                    className="w-28 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                    value={minAmount}
                                    onChange={(e) => setMinAmount(e.target.value)}
                                />

                                <input
                                    type="number"
                                    placeholder="₹ Max"
                                    className="w-28 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                    value={maxAmount}
                                    onChange={(e) => setMaxAmount(e.target.value)}
                                />

                                <select
                                    className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                    value={amountFilter}
                                    onChange={(e) => setAmountFilter(e.target.value)}
                                >
                                    <option value="all">All</option>
                                    <option value="debit">Debit Amount</option>
                                    <option value="credit">Credit Amount</option>
                                </select>

                                <button
                                    onClick={handleCreateJV}
                                    disabled={isSubmitting || selectedCount === 0}
                                    className={`px-4 py-2 rounded text-white font-semibold ${isSubmitting || selectedCount === 0
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-green-600 hover:bg-green-700'
                                        }`}
                                >
                                    {isSubmitting ? 'Processing...' : `Transfer To JV (${selectedCount} selected)`}
                                </button>
                            </div>
                        </div>

                        {submitResult && (
                            <div className={`mb-4 p-4 rounded ${submitResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                {submitResult.success ? (
                                    <>
                                        <p className="font-semibold">Success: {submitResult.message}</p>
                                        <p>Total Amount: {submitResult.totalAmount}</p>
                                        <p>Entries Created: {submitResult.entryCount}</p>
                                    </>
                                ) : (
                                    <p className="font-semibold">Error: {submitResult.message}</p>
                                )}
                            </div>
                        )}

                        <div className="relative overflow-auto" style={{ maxHeight: '600px', marginBottom: '60px' }}>
                            <table className="min-w-full text-sm text-left border table-auto">
                                <thead className="bg-gray-100 sticky top-0 z-10">
                                    <tr>
                                        <th className="p-2 border bg-gray-100">
                                            <input
                                                type="checkbox"
                                                checked={allSelected}
                                                ref={input => {
                                                    if (input) {
                                                        input.indeterminate = someSelected;
                                                    }
                                                }}
                                                onChange={handleSelectAll}
                                            />
                                        </th>
                                        <th className="p-2 border bg-gray-100">Account Code</th>
                                        <th className="p-2 border bg-gray-100">Account Name</th>
                                        <th className="p-2 border bg-gray-100">City</th>
                                        <th className="p-2 border bg-gray-100 text-right">Debit Amount</th>
                                        <th className="p-2 border bg-gray-100 text-right">Credit Amount</th>
                                        <th className="p-2 border bg-gray-100">Mobile</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.map((row) => (
                                        <tr key={row.accode} className="hover:bg-gray-50">
                                            <td className="p-2 border text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedRows[row.accode] || false}
                                                    onChange={() => handleCheckboxChange(row.accode)}
                                                />
                                            </td>
                                            <td className="p-2 border">{row.accode}</td>
                                            <td className="p-2 border">{row.acname}</td>
                                            <td className="p-2 border">{row.city}</td>
                                            <td className="p-2 border text-right">{parseFloat(row.debitAmt).toLocaleString()}</td>
                                            <td className="p-2 border text-right">{parseFloat(row.creditAmt).toLocaleString()}</td>
                                            <td className="p-2 border">{row.mobile}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-2 text-sm text-gray-600 max-w-4xl mx-auto">
                            Showing {filteredData.length} of {data.length} records
                        </div>
                        </>
        ) : (
                   <div className="relative overflow-auto" style={{ maxHeight: '600px', marginBottom: '60px' }}>
                <table className="min-w-full text-sm text-left border table-auto">
                    <thead className="bg-gray-100 sticky top-0 z-10">
                        <tr>
                            <th className="p-2 border bg-gray-100">Account Code</th>
                            <th className="p-2 border bg-gray-100">Account Name</th>
                            <th className="p-2 border bg-gray-100 text-right">Opening Balance</th>
                            <th className="p-2 border bg-gray-100 text-right">Before</th>
                            <th className="p-2 border bg-gray-100 text-right">After</th>
                            <th className="p-2 border bg-gray-100 text-right">Deletion</th>
                            <th className="p-2 border bg-gray-100 text-right">Balance</th>
                            <th className="p-2 border bg-gray-100 text-right">Depreciation</th>
                            <th className="p-2 border bg-gray-100 text-right">Final</th>
                            <th className="p-2 border bg-gray-100 text-right">Rate %</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                                <td className="p-2 border">{row.accode}</td>
                                <td className="p-2 border">{row.acname}</td>
                                <td className="p-2 border text-right">{parseFloat(row.OpeningBalance || 0).toLocaleString()}</td>
                                <td className="p-2 border text-right">{parseFloat(row.Before || 0).toLocaleString()}</td>
                                <td className="p-2 border text-right">{parseFloat(row.After || 0).toLocaleString()}</td>
                                <td className="p-2 border text-right">{parseFloat(row.Deletion || 0).toLocaleString()}</td>
                                <td className="p-2 border text-right">{parseFloat(row.Balance || 0).toLocaleString()}</td>
                                <td className="p-2 border text-right">{parseFloat(row.Depamount || 0).toLocaleString()}</td>
                                <td className="p-2 border text-right">{parseFloat(row.Finalamount || 0).toLocaleString()}</td>
                                <td className="p-2 border text-right">{parseFloat(row.InterestRate || 0).toFixed(2)}%</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
    </div>
)}
            </div>
        </>
    );
};

export default TrialBalance;