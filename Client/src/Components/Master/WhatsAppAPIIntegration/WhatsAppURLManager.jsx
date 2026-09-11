import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './WhatsAppURLManager.css'
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Swal from "sweetalert2";

const API_URL = process.env.REACT_APP_API;
const WhatsAppURLManager = () => {
    const companyCode = sessionStorage.getItem('Company_Code');
    const [formData, setFormData] = useState({
        Instance_Id: '',
        Access_token: '',
        Company_Code: '',
        Mobile_NoWa: '',
        OtpEmail: '',
        OtpPassword: '',
        gitAuthToken: '',
        gitRepo: '',
        gitauthKey: '',
        WaTitle: '',
        Mobile_No: ''
    });

    useEffect(() => {
        fetchWhatsAppURLData();
    }, []);

    const fetchWhatsAppURLData = async () => {
        try {
            const response = await axios.get(`${API_URL}/get-WhatsAppURL-Record?Company_Code=${companyCode}`);
            if (response.data.WhatsAppURL_data) {
                setFormData(response.data.WhatsAppURL_data);
            }
        } catch (error) {
            toast.error('Failed to fetch data');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${API_URL}/create-or-update-WhatsAppURL`, formData);
            Swal.fire({
                title: "Success!",
                text: "Record Updated Successfully!",
                icon: "success",
                confirmButtonText: "OK"
            });
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
        <div className="WhatsApp-form-container">
            <ToastContainer autoClose={500} />
            <h5>WhatsApp URL Configuration</h5>
            <form onSubmit={handleSubmit}>
                <div className="WhatsApp-form-group">
                    <label>
                        Instance ID:
                        <input type="text" name="Instance_Id" value={formData.Instance_Id} onChange={handleChange} />
                    </label>
                </div>
                <div className="WhatsApp-form-group">
                    <label>
                        Access Token:
                        <input type="text" name="Access_token" value={formData.Access_token} onChange={handleChange} />
                    </label>
                </div>
                <div className="WhatsApp-form-group">
                    <label>
                        Mobile No WhatsApp:
                        <input type="text" name="Mobile_NoWa" value={formData.Mobile_NoWa} onChange={handleChange} />
                    </label>
                </div>
                <div className="WhatsApp-form-group">
                    <label>
                        OTP Email:
                        <input type="email" name="OtpEmail" value={formData.OtpEmail} onChange={handleChange} />
                    </label>
                </div>
                <div className="WhatsApp-form-group">
                    <label>
                        OTP Password:
                        <input type="text" name="OtpPassword" value={formData.OtpPassword} onChange={handleChange} />
                    </label>
                </div>
                <div className="WhatsApp-form-group">
                    <label>
                        GitHub Auth Token:
                        <input type="text" name="gitAuthToken" value={formData.gitAuthToken} onChange={handleChange} />
                    </label>
                </div>
                <div className="WhatsApp-form-group">
                    <label>
                        GitHub Repository:
                        <input type="text" name="gitRepo" value={formData.gitRepo} onChange={handleChange} />
                    </label>
                </div>
                <div className="WhatsApp-form-group">
                    <label>
                        GitHub Auth Key:
                        <input type="text" name="gitauthKey" value={formData.gitauthKey} onChange={handleChange} />
                    </label>
                </div>
                <div className="WhatsApp-form-group">
                    <label>
                        WhatsApp Title:
                        <input type="text" name="WaTitle" value={formData.WaTitle} onChange={handleChange} />
                    </label>
                </div>
                <div className="WhatsApp-form-group">
                    <label>
                        Mobile No:
                        <input type="text" name="Mobile_No" value={formData.Mobile_No} onChange={handleChange} />
                    </label>
                </div>
                <div className="button-container">
                    <button type="submit">Save Settings</button>
                </div>
            </form>
        </div>
    );
};

export default WhatsAppURLManager;
