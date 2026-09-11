import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './CompanyPrintingInfo.css';

const API_URL = process.env.REACT_APP_API; 

const CompanyPrintingInfo = () => {
    const [formData, setFormData] = useState({
        AL1: '',
        AL2: '',
        AL3: '',
        AL4: '',
        Other: '',
        Company_Code: '',
        BillFooter: '',
        bankdetail: '',
        Googlepayac: '',
        Phonepayac: '',
        Mobile_No: '',
        dbbackup: ''
    });

    const companyCode = sessionStorage.getItem('Company_Code')

    useEffect(() => {
        fetchCompanyPrintingInfo();
    }, []);

    const fetchCompanyPrintingInfo = async () => {
        try {
            const response = await axios.get(`${API_URL}/get-company-printing-info?Company_Code=${companyCode}`);
            if (response.data.CompanyPrintingInfo_data) {
                setFormData(response.data.CompanyPrintingInfo_data);
            }
        } catch (error) {
            toast.error('Failed to fetch data');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${API_URL}/create-or-update-company-printing-info`, formData);
            toast.success(response.data.message);
        } catch (error) {
            toast.error('Failed to update data');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <div className="CompanyInfo-form-container">
            <ToastContainer autoClose={500}/>
            <h1>Company Printing Information</h1>
            <form onSubmit={handleSubmit}>
                <div className="CompanyInfo-form-group">
                    <label>Address Line 1:<input type="text" name="AL1" value={formData.AL1} onChange={handleChange} /></label>
                </div>
                <div className="CompanyInfo-form-group">
                    <label>Address Line 2:<input type="text" name="AL2" value={formData.AL2} onChange={handleChange} /></label>
                </div>
                <div className="CompanyInfo-form-group">
                    <label>Address Line 3:<input type="text" name="AL3" value={formData.AL3} onChange={handleChange} /></label>
                </div>
                <div className="CompanyInfo-form-group">
                    <label>Address Line 4:<input type="text" name="AL4" value={formData.AL4} onChange={handleChange} /></label>
                </div>
                <div className="CompanyInfo-form-group">
                    <label>Other Information:<input type="text" name="Other" value={formData.Other} onChange={handleChange} /></label>
                </div>
                <div className="CompanyInfo-form-group">
                    <label>Bill Footer:<textarea name="BillFooter" value={formData.BillFooter} rows={3} onChange={handleChange} /></label>
                </div>
                <div className="CompanyInfo-form-group">
                    <label>Bank Detail:<textarea name="bankdetail" value={formData.bankdetail} rows={3} onChange={handleChange}  /></label>
                </div>
                <div className="CompanyInfo-form-group">
                    <label>DB Backup Drive:<input type="text" name="dbbackup" value={formData.dbbackup}  onChange={handleChange} /></label>
                </div>
                <div className="button-container">
                    <button type="submit">Save Settings</button>
                </div>
            </form>
        </div>
    );
};

export default CompanyPrintingInfo;
