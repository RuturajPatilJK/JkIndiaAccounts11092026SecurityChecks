import React, { useEffect, useState, useRef } from 'react';
// import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, IconButton, Typography, InputAdornment, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { AiFillEye, AiFillEyeInvisible } from 'react-icons/ai';
import Swal from 'sweetalert2';
import './CompanyList.css';
import logo from "../../Assets/jkIndia.png"
//import logo from "../../Assets/jklogo.png"
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import LoginIcon from '@mui/icons-material/Login';
// import axios from '../../api/axiosInstance';
import axios from 'axios';


const CompanyList = () => {
  const [companies, setCompanies] = useState([]);
  const [accountingYears, setAccountingYears] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [selectedAccountingYear, setSelectedAccountingYear] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const companyRefs = useRef([]);
  const firstCompanyRef = useRef(null);
  const usernameRef = useRef(null);

  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_API;

  function formattedDate(dateInput, storageKey) {
    const date = new Date(dateInput);
    if (isNaN(date)) {
      console.error('Invalid date input');
      return;
    }

    const formattedDate = date.toISOString().split('T')[0];
    sessionStorage.setItem(storageKey, formattedDate);
  }


  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await axios.get(`${API_URL}/get_company_data_All`);
        setCompanies(response.data.Company_Data);
        if (response.data.Company_Data && response.data.Company_Data.length > 0) {
          setCompanies(response.data.Company_Data);
          if (firstCompanyRef.current) {
            firstCompanyRef.current.focus();
          }
        } else {
          navigate('/create-company');
        }
      } catch (error) {
        console.error('Failed to fetch companies', error);
      }
    };

    fetchCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      fetchAccountingYears(selectedCompany.Company_Code);
    }
  }, [selectedCompany]);

  const fetchAccountingYears = async (companyCode) => {
    try {
      const response = await axios.get(`${API_URL}/get_accounting_years?Company_Code=${companyCode}`);
      const years = response.data;

      years.sort((a, b) => b.yearCode - a.yearCode);
      setAccountingYears(years);
      if (years.length > 0) {
        setSelectedAccountingYear(years[0]);
        sessionStorage.setItem('TCSApplicable', years[0].TCSApplicable);
        sessionStorage.setItem('newCompanyName', years[0].newCompanyName);
        sessionStorage.setItem('oldFormerlyName', years[0].oldFormerlyName);
        formattedDate(years[0].CNameUpdatedDate, 'CompanyNameUpdatedDate')
      } else {
        navigate('/create-accounting-year');
      }
    } catch (error) {
      console.error('Failed to fetch accounting years', error);
      setAccountingYears([]);
      setSelectedAccountingYear(null);
    }
  };

  const handleCompanyClick = (company) => {
    sessionStorage.setItem('Company_Code', company.Company_Code);
    setSelectedCompany(company);
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setSelectedCompany(null);
    setUsername('');
    setPassword('');
  };

  let formattedAccountingYear = null;

  const handleLogin = async () => {

    const loggedIn = sessionStorage.getItem('user_type');
    if (!loggedIn) {
      Swal.fire({
        icon: 'warning',
        title: 'Session Expired',
        text: 'Your session has expired. Please login again.',
        confirmButtonText: 'OK',
        allowOutsideClick: false,
      }).then(() => {
        axios.post(`${API_URL}/logout`).catch(() => {});
        sessionStorage.clear();
        navigate('/');
      });
      return;
    }

    if (!username || !password) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Both User Name and Password are required.!',
        confirmButtonText: 'Try Again',
        allowOutsideClick: false,
      });
      return;
    }
    try {
      const response = await axios.post(`${API_URL}/userlogin`, {
        User_Name: username,
        User_Password: password,
        Company_Code: selectedCompany.Company_Code,
      });
      if (selectedAccountingYear) {
        sessionStorage.setItem('Year_Code', selectedAccountingYear.yearCode);
        sessionStorage.setItem('username', username);
        formattedAccountingYear = `${selectedAccountingYear.Start_Date} - ${selectedAccountingYear.End_Date}`;
        sessionStorage.setItem('Accounting_Year', formattedAccountingYear);
        sessionStorage.setItem('Company_Name', selectedCompany.Company_Name_E);
        sessionStorage.setItem('Company_Address', selectedCompany.Address_E);
        sessionStorage.setItem('Company_GSTNO', selectedCompany.GST);
        sessionStorage.setItem('Company_PanNo', selectedCompany.Pan_No);
        sessionStorage.setItem('uid', response.data.user_id);
        sessionStorage.setItem('User_ID', response.data.User_ID);
      }

      const postDateResponse = await axios.get(`${API_URL}/get-PostDate-Record?Company_Code=${selectedCompany.Company_Code}&Year_Code=${selectedAccountingYear.yearCode}`);

      if (postDateResponse.data && postDateResponse.data.PostDate_data) {
        const postDateData = postDateResponse.data.PostDate_data;
        sessionStorage.setItem('Post_Date', postDateData.Post_Date);
        sessionStorage.setItem('Inword_Date', postDateData.Inword_Date);
        sessionStorage.setItem('Outword_Date', postDateData.Outword_Date)
      } else {
        console.error('No PostDate or OutwardDate found for the selected company and year');
      }

      const companyParameterResponse = await axios.get(`${API_URL}/get-CompanyParameters-Record?Company_Code=${selectedCompany.Company_Code}&Year_Code=${selectedAccountingYear.yearCode}`)
      if (companyParameterResponse.data && companyParameterResponse.data.CompanyParameters_data) {
        const companyParameterData = companyParameterResponse.data.CompanyParameters_data
        sessionStorage.setItem('SaleTDSRate', companyParameterData.SaleTDSRate);
        sessionStorage.setItem('SaleTCSRate', companyParameterData.TCS);
      }
      else {
        console.error('No Data found for the selected company and year');
      }

      const selfAcResponse = await axios.get(`${API_URL}/get_self_ac?Company_Code=${selectedCompany.Company_Code}`);
      sessionStorage.setItem('SELF_AC', selfAcResponse.data.SELF_AC);
      sessionStorage.setItem('Self_acid', selfAcResponse.data.Self_acid);

      sessionStorage.setItem('Year_Code', selectedAccountingYear.yearCode);
      sessionStorage.setItem('username', username);
      formattedAccountingYear = `${selectedAccountingYear.Start_Date} - ${selectedAccountingYear.End_Date}`;
      sessionStorage.setItem('Accounting_Year', formattedAccountingYear);
      sessionStorage.setItem('Company_Name', selectedCompany.Company_Name_E);

      setIsLoggedIn(true);

      // Check Google Analytics permission
      let hasGA = false;
      try {
        const uid = response.data.user_id;
        const compCode = selectedCompany.Company_Code;
        const gaPermRes = await axios.get(
          `${API_URL}/get_user_permissions?Company_Code=${compCode}&Program_Name=/google-analytics&uid=${uid}`
        );
        hasGA = gaPermRes.data?.UserDetails?.canView === 'Y';
      } catch {
        hasGA = false;
      }
      sessionStorage.setItem('has_ga_permission', hasGA ? 'Y' : 'N');

      Swal.fire({
        icon: 'success',
        title: 'Login Successful',
        text: 'You have logged in successfully!',
        showConfirmButton: false,
        timer: 1000,
        allowOutsideClick: false,
      });

      setTimeout(() => {
        if (hasGA) {
          navigate('/landing');
        } else {
          navigate('/dashboard');
          window.location.reload();
        }
      }, 1500);

    } catch (error) {
      if (error.response) {
        Swal.fire({
          icon: 'error',
          title: 'Login Failed',
          text: error.response.data.error || 'Invalid Login Credentials',
          confirmButtonText: 'Try Again',
          allowOutsideClick: false,
        });
      } else if (error.request) {
        Swal.fire({
          icon: 'error',
          title: 'Network Error',
          text: 'No response from server. Please check your network connection.',
          confirmButtonText: 'Try Again',
          allowOutsideClick: false,
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'An unexpected error occurred: ' + error.message,
          confirmButtonText: 'Try Again',
          allowOutsideClick: false,
        });
      }
    }
  };

  useEffect(() => {
    if (companyRefs.current[selectedIndex]) {
      companyRefs.current[selectedIndex].focus();
    }
  }, [selectedIndex]);

  companyRefs.current = companies.map((_, i) => companyRefs.current[i]);

  const handleKeyDown = (event, company, index) => {
    switch (event.keyCode) {
      case 13:
        handleCompanyClick(company);
        break;
      case 38:
        if (selectedIndex > 0) {
          setSelectedIndex(selectedIndex - 1);
        }
        break;
      case 40:
        if (selectedIndex < companies.length - 1) {
          setSelectedIndex(selectedIndex + 1);
        }
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    if (showModal) {
      setTimeout(() => {
        if (usernameRef.current) {
          usernameRef.current.focus();
        }
      }, 100);
    }
  }, [showModal]);

  const handleKeyDownModal = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleLogin();
    }
  };

  return (
    <>
      <div className="companyListContainer">
        <ToastContainer autoClose={500} />
        <div className="companyList">
          {companies.map((company, index) => (
            <div
              key={company.Company_Code}
              className={`companyItem ${index === selectedIndex ? 'selected' : ''}`}
              onClick={() => handleCompanyClick(company)}
              onKeyDown={(event) => handleKeyDown(event, company, index)}
              tabIndex={0}
              ref={index === 0 ? firstCompanyRef : null}
            >
              <span>{company.Company_Code}</span>
              <span>{company.Company_Name_E}</span>
            </div>
          ))}
        </div>




        <Dialog
          open={showModal}
          onClose={handleClose}
          sx={{
            marginTop: "-150px",
            borderRadius: "10px",
            '&:hover': {
              transform: 'scale(1.02)',
              transition: 'transform 0.3s ease',
            },
          }}
        >
          <DialogTitle sx={{ position: 'relative' }}>
            {/* <Typography variant="h5" sx={{ textAlign: 'center', color: '#333' }}>
              Company Login
            </Typography> */}

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
                height: '80px',
                textAlign: 'center',
              }}
            >
              <img
                src={logo}
                alt="Company Logo"
                style={{
                  maxHeight: '80px',
                  objectFit: 'contain',
                }}
              />
            </Box>

            <IconButton
              aria-label="close"
              onClick={handleClose}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                color: 'gray',
                '&:hover': {
                  backgroundColor: 'transparent',
                  transform: 'scale(1.2)',
                  transition: 'transform 0.2s ease',
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            {loginError && (
              <Typography
                variant="body2"
                color="error"
                sx={{ textAlign: 'center', marginBottom: '16px', animation: 'shake 0.5s' }}
              >
                {loginError}
              </Typography>
            )}

            <form onSubmit={(e) => e.preventDefault()} noValidate>
              <TextField
                label="User Name"
                variant="outlined"
                fullWidth
                required
                value={username}
                autoComplete="off"
                onChange={(e) => setUsername(e.target.value)}
                inputRef={usernameRef}
                margin="normal"
                onKeyDown={handleKeyDownModal}
                placeholder="Enter your username..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                  },
                  '& .MuiInputLabel-root': {
                    color: '#333',
                  },
                  '& .MuiFormHelperText-root': {
                    color: 'red',
                  },
                  '& .MuiOutlinedInput-input': {
                    padding: '12px',
                  },
                  '& .MuiInputLabel-asterisk': {
                    color: 'red',
                  },
                  transition: 'all 0.3s ease',
                  '&:hover .MuiOutlinedInput-root': {
                    borderColor: '#3f51b5',
                  },
                  '&:focus-within .MuiOutlinedInput-root': {
                    borderColor: '#2196f3',
                    boxShadow: '0 0 5px rgba(33, 150, 243, 0.5)',
                  },
                }}
                InputLabelProps={{
                  style: {
                    color: 'black',
                  },
                }}
              />

              <TextField
                label="User Password"
                variant="outlined"
                type={passwordVisible ? "text" : "password"}
                autoComplete="off"
                fullWidth
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                onKeyDown={handleKeyDownModal}
                placeholder="Enter your password..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                  },
                  '& .MuiInputLabel-root': {
                    color: '#333',
                  },
                  '& .MuiFormHelperText-root': {
                    color: 'red',
                  },
                  '& .MuiOutlinedInput-input': {
                    padding: '12px',
                  },
                  '& .MuiInputLabel-asterisk': {
                    color: 'red',
                  },
                  transition: 'all 0.3s ease',
                  '&:hover .MuiOutlinedInput-root': {
                    borderColor: '#3f51b5',
                  },
                  '&:focus-within .MuiOutlinedInput-root': {
                    borderColor: '#2196f3',
                    boxShadow: '0 0 5px rgba(33, 150, 243, 0.5)',
                  },
                }}
                InputLabelProps={{
                  style: {
                    color: 'black',
                  },
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setPasswordVisible(!passwordVisible)} edge="end">
                        {passwordVisible ? <AiFillEye /> : <AiFillEyeInvisible />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                select
                label="Account Year"
                fullWidth
                required
                autoComplete="off"
                value={selectedAccountingYear ? selectedAccountingYear.yearCode : ''}
                onChange={(e) => {
                  const newSelectedYear = accountingYears.find(
                    (year) => year.yearCode.toString() === e.target.value
                  );
                  setSelectedAccountingYear(newSelectedYear);
                  sessionStorage.setItem('Year_Code', newSelectedYear.yearCode);
                }}
                margin="normal"
                SelectProps={{
                  native: true,
                }}
                InputLabelProps={{
                  style: {
                    color: 'black',
                  },
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                  },
                  '& .MuiOutlinedInput-input': {
                    padding: '12px',
                  },
                  transition: 'all 0.3s ease',
                  '&:hover .MuiOutlinedInput-root': {
                    borderColor: '#3f51b5',
                  },
                  '& .MuiInputLabel-asterisk': {
                    color: 'red',
                  },
                  '&:focus-within .MuiOutlinedInput-root': {
                    borderColor: '#2196f3',
                    boxShadow: '0 0 5px rgba(33, 150, 243, 0.5)',
                  },
                }}
              >
                {accountingYears.map((year) => (
                  <option key={year.yearCode} value={year.yearCode}>
                    {year.year}
                  </option>
                ))}
              </TextField>
            </form>
          </DialogContent>
          <DialogActions sx={{ display: 'flex', justifyContent: 'center', paddingBottom: '24px' }}>

            <Button
              startIcon={<CancelOutlinedIcon />}
              onClick={handleClose}
              color="secondary"
              variant="outlined"
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                padding: '12px 24px',
                fontSize: '16px',
                width: '30%',
                minWidth: '120px',
                gap: '8px',
                transition: 'all 0.3s ease',
                borderWidth: '2px',
                '&:hover': {
                  backgroundColor: 'rgba(241, 241, 241, 0.8)',
                  transform: 'scale(1.05)',
                  boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
                  borderColor: '#3f51b5',
                  borderWidth: '2px',
                },
                '&:active': {
                  transform: 'scale(0.98)',
                  boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.2)',
                },
                '&:focus': {
                  outline: '2px solid rgba(63, 81, 181, 0.3)',
                },
              }}
            >
              Cancel
            </Button>

            <Button
              startIcon={<LoginIcon />}
              variant="contained"
              color="primary"
              onClick={handleLogin}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                padding: '12px 24px',
                fontSize: '16px',
                width: '30%',
                minWidth: '120px',
                gap: '8px',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: '#303f9f',
                  transform: 'scale(1.05)',
                  boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.2)',
                },
                '&:active': {
                  transform: 'scale(0.98)',
                  backgroundColor: '#1a237e',
                  boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.25)',
                },
                '&:focus': {
                  outline: '2px solid rgba(255, 255, 255, 0.5)',
                },
                '& .MuiButton-startIcon': {
                  transition: 'transform 0.3s ease',
                },
                '&:hover .MuiButton-startIcon': {
                  transform: 'translateX(2px)',
                }
              }}
            >
              Login
            </Button>
            {/* <Button
              onClick={handleClose}
              color="secondary"
              variant="outlined"
              sx={{
                borderRadius: '4px',
                textTransform: 'none',
                padding: '12px 24px',
                fontSize: '16px',
                width: '30%',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: '#f1f1f1',
                  transform: 'scale(1.08)',
                  boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
                  borderColor: '#3f51b5',
                },
                '&:active': {
                  transform: 'scale(1.05)',
                  boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.25)',
                },
              }}
            >
              Cancel
            </Button>

            <Button
              variant="contained"
              color="primary"
              onClick={handleLogin}
              sx={{
                borderRadius: '4px',
                textTransform: 'none',
                padding: '12px 24px',
                fontSize: '16px',
                width: '30%',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: '#3f51b5',
                  transform: 'scale(1.08)',
                  boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
                  borderColor: '#fff',
                },
                '&:active': {
                  transform: 'scale(1.05)',
                  boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.25)',
                },
              }}
            >
              Login
            </Button> */}
          </DialogActions>
        </Dialog>
      </div>
    </>
  );
};

export default CompanyList;