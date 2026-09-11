import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';



const SelectCompany = () => {

    const API_URL = process.env.REACT_APP_API;
    const [companies, setCompanies] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const companyRefs = useRef([]);
    const navigate = useNavigate();
    const [selectedIndex, setSelectedIndex] = useState(0); 

    useEffect(() => {
       
        const fetchCompanies = async () => {
            try {
                const response = await axios.get(`${API_URL}/get_company_data_All`);
                setCompanies(response.data.Company_Data);
            } catch (error) {
                console.error('Failed to fetch companies', error);
            }
        };
        fetchCompanies();
        if (companies.length > 0 && companyRefs.current[0]) {
            companyRefs.current[0].focus();
        }
      
    }, []);

    // Handle showing and hiding the popup
    const handleCompanyClick = (company, index) => {
        setSelectedCompany(company);
        setSelectedIndex(index);
        setShowModal(true);
    };

    // Handle keyboard navigation and Enter key functionality
    const handleKeyDown = (event, index) => {
        if (event.key === 'ArrowDown') {
            const nextIndex = (index + 1) % companies.length;
            setSelectedIndex(nextIndex);
            companyRefs.current[nextIndex].focus();
        } else if (event.key === 'ArrowUp') {
            const prevIndex = (index - 1 + companies.length) % companies.length;
            setSelectedIndex(prevIndex);
            companyRefs.current[prevIndex].focus();
        } else if (event.key === 'Enter') {
            handleCompanyDoubleClick(companies[index]);
        }
    };

    const handleCompanyDoubleClick = (company) => {
        sessionStorage.setItem('Company_Code', company.Company_Code);
        navigate('/');
    };

    return (
        <div className="companyListContainer">
            <div className="companyList">
                {companies.map((company, index) => (
                    <div
                        key={company.Company_Code}
                        className={`companyItem ${index === selectedIndex ? 'selected' : ''}`}
                        onClick={() => handleCompanyClick(company, index)}
                        onDoubleClick={() => handleCompanyDoubleClick(company)}
                        onKeyDown={(event) => handleKeyDown(event, index)}
                        ref={(el) => (companyRefs.current[index] = el)}
                        tabIndex={0}
                    >
                        <span>{company.Company_Code}</span>
                        <span>{company.Company_Name_E}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default SelectCompany;
