// import React, { useEffect, useState, useRef } from 'react';
// import axios from 'axios';
// import { useNavigate } from 'react-router-dom';
// import './SelectAccountingYear.css';

// const API_URL = process.env.REACT_APP_API;

// const SelectAccoungYear = () => {
//     const [accountingYears, setAccountingYears] = useState([]);
//     const firstYearRef = useRef(null);
//     const navigate = useNavigate();

// function formattedDate(dateInput, storageKey) {
//     const date = new Date(dateInput);
//     if (isNaN(date)) {
//         console.error('Invalid date input');
//         return;
//     }

//     const formattedDate = date.toISOString().split('T')[0];
//     sessionStorage.setItem(storageKey, formattedDate);
// }

//     useEffect(() => {
//         const fetchAccountingYears = async () => {
//             const companyCode = sessionStorage.getItem('Company_Code');
//             try {
//                 const response = await axios.get(`${API_URL}/get_accounting_years?Company_Code=${companyCode}`);
//                 setAccountingYears(response.data);
//                 if (firstYearRef.current) {
//                     firstYearRef.current.focus();
//                 }
//             } catch (error) {
//                 console.error('Failed to fetch accounting years', error);
//             }
//         };

//         fetchAccountingYears();
//     }, []);

//     const handleAccountYear = (accountingyear) => {
//         sessionStorage.setItem('Year_Code', accountingyear.yearCode);
//         sessionStorage.setItem('TCSApplicable', accountingyear.TCSApplicable);
//         sessionStorage.setItem('newCompanyName', accountingyear.newCompanyName);
//         sessionStorage.setItem('oldFormerlyName', accountingyear.oldFormerlyName);
//          formattedDate(accountingyear.CNameUpdatedDate, 'CompanyNameUpdatedDate')
//         sessionStorage.setItem('Accounting_Year', `${accountingyear.Start_Date} - ${accountingyear.End_Date}`);
//         navigate('/dashboard'); 
//     };

//     const handleKeyDown = (event, accountingyear) => {
//         if (event.key === 'Enter') {
//             handleAccountYear(accountingyear);
//         }
//     };

//     return (
//         <div className="companyListContainer">
//             <div className="companyList">
//                 {accountingYears.map((accountingyear, index) => (
//                     <div
//                         key={accountingyear.yearCode}
//                         className="companyItem"
//                         onClick={() => handleAccountYear(accountingyear)}
//                         onKeyDown={(event) => handleKeyDown(event, accountingyear)}
//                         tabIndex={0}
//                         ref={index === 0 ? firstYearRef : null}
//                     >
//                         <span>{accountingyear.yearCode}</span>
//                         <span>{accountingyear.year}</span>
//                     </div>
//                 ))}
//             </div>
//         </div>
//     );
// };

// export default SelectAccoungYear;














import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './SelectAccountingYear.css';

const API_URL = process.env.REACT_APP_API;

const SelectAccoungYear = () => {
    const [accountingYears, setAccountingYears] = useState([]);
    const firstYearRef = useRef(null);
    const navigate = useNavigate();

    function formattedDate(dateInput, storageKey) {
        const date = new Date(dateInput);
        if (isNaN(date)) {
            console.error('Invalid date input');
            return;
        }

        const formattedDate = date.toISOString().split('T')[0];
        sessionStorage.setItem(storageKey, formattedDate);
    }

    const fetchPostDateRecord = async (yearCode) => {
        const companyCode = sessionStorage.getItem('Company_Code');
        try {
            const response = await axios.get(`${API_URL}/get-PostDate-Record`, {
                params: {
                    Company_Code: companyCode,
                    Year_Code: yearCode
                },
            });

            if (response.data.PostDate_data) {
                const record = response.data.PostDate_data;
                sessionStorage.setItem("Post_Date", record.Post_Date || "");
                sessionStorage.setItem("Inword_Date", record.Inword_Date || "");
                sessionStorage.setItem("Outword_Date", record.Outword_Date || "");
            } else {
                sessionStorage.setItem("Post_Date", "");
                sessionStorage.setItem("Inword_Date", "");
                sessionStorage.setItem("Outword_Date", "");
            }
        } catch (error) {
            console.error('Failed to fetch post date record', error);
            sessionStorage.setItem("Post_Date", "");
            sessionStorage.setItem("Inword_Date", "");
            sessionStorage.setItem("Outword_Date", "");
        }
    };

    useEffect(() => {
        const fetchAccountingYears = async () => {
            const companyCode = sessionStorage.getItem('Company_Code');
            try {
                const response = await axios.get(`${API_URL}/get_accounting_years?Company_Code=${companyCode}`);
                setAccountingYears(response.data);
                if (firstYearRef.current) {
                    firstYearRef.current.focus();
                }

            } catch (error) {
                console.error('Failed to fetch accounting years', error);
            }
        };

        fetchAccountingYears();
    }, []);

    const handleAccountYear = async (accountingyear) => {
        sessionStorage.setItem('Year_Code', accountingyear.yearCode);
        sessionStorage.setItem('TCSApplicable', accountingyear.TCSApplicable);
        sessionStorage.setItem('newCompanyName', accountingyear.newCompanyName);
        sessionStorage.setItem('oldFormerlyName', accountingyear.oldFormerlyName);
        formattedDate(accountingyear.CNameUpdatedDate, 'CompanyNameUpdatedDate');
        sessionStorage.setItem('Accounting_Year', `${accountingyear.Start_Date} - ${accountingyear.End_Date}`);

        await fetchPostDateRecord(accountingyear.yearCode);

        navigate('/dashboard');
    };

    const handleKeyDown = (event, accountingyear) => {
        if (event.key === 'Enter') {
            handleAccountYear(accountingyear);
        }
    };

    return (
        <div className="companyListContainer">
            <div className="companyList">
                {accountingYears.map((accountingyear, index) => (
                    <div
                        key={accountingyear.yearCode}
                        className="companyItem"
                        onClick={() => handleAccountYear(accountingyear)}
                        onKeyDown={(event) => handleKeyDown(event, accountingyear)}
                        tabIndex={0}
                        ref={index === 0 ? firstYearRef : null}
                    >
                        <span>{accountingyear.yearCode}</span>
                        <span>{accountingyear.year}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SelectAccoungYear;
