import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { AiOutlineUser, AiFillLock, AiFillEye, AiFillEyeInvisible } from 'react-icons/ai';
import { useNavigate } from 'react-router-dom';
import logo from "../../Assets/jkIndia.png";
import Swal from 'sweetalert2';

const API_URL = process.env.REACT_APP_API;

const Login = () => {
  const navigate = useNavigate();
  const UsernameRef = useRef(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginData, setLoginData] = useState({ Login_Name: '', Password: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLoginData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!loginData.Login_Name || !loginData.Password) {
      Swal.fire({ icon: 'error', title: 'Oops...', text: 'Please fill in both fields!' });
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${API_URL}/login`, loginData);
      const { user_data } = response.data;
      sessionStorage.setItem('user_type', user_data.UserType);

      const Toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 1500,
        timerProgressBar: true,
      });

      Toast.fire({ icon: "success", title: "Signed in successfully" });
      setTimeout(() => navigate("/company-list"), 1500);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Login Failed',
        text: error.response?.data?.error || "Invalid credentials",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    UsernameRef.current.focus();
  }, []);

  return (
    <div className="bg-gradient-to-br from-slate-50 to-emerald-50 flex flex-col justify-center items-center p-6">

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-emerald-100">

        <div className="pt-10 pb-6 flex flex-col items-center bg-white">
          <div className="w-20 h-20 mb-4 p-3 rounded-2xl bg-emerald-50 shadow-inner flex items-center justify-center">
            <img src={logo} alt="Company Logo" className="max-h-full" />
          </div>
          <h2 className="text-2xl font-black text-emerald-900 tracking-tight">
            JK India eAgritech Limited
          </h2>
          <p className="text-slate-400 text-sm mt-1">Please enter your credentials to continue</p>
        </div>

        <form className="px-10 pb-10 space-y-5" onSubmit={handleSubmit}>

          <div className="flex flex-col items-start space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">
              Username
            </label>
            <div className="relative w-full group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                <AiOutlineUser size={18} />
              </div>
              <input
                type="text"
                name="Login_Name"
                ref={UsernameRef}
                value={loginData.Login_Name}
                onChange={handleChange}
                placeholder=""
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white transition-all outline-none text-slate-700"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="flex flex-col items-start space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">
              Password
            </label>
            <div className="relative w-full group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                <AiFillLock size={18} />
              </div>
              <input
                type={passwordVisible ? "text" : "password"}
                name="Password"
                value={loginData.Password}
                onChange={handleChange}
                placeholder=""
                className="w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white transition-all outline-none text-slate-700"
              />
              <button
                type="button"
                onClick={() => setPasswordVisible(!passwordVisible)}
                className="absolute inset-y-0 right-2 my-auto h-8 w-8 flex items-center justify-center bg-white rounded-full shadow-sm text-slate-400 hover:text-emerald-600 transition-all border border-slate-100"
              >
                {passwordVisible ? <AiFillEye size={18} /> : <AiFillEyeInvisible size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 rounded-2xl font-extrabold text-white transition-all transform active:scale-[0.97] shadow-lg ${isLoading
              ? 'bg-slate-300 cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 hover:shadow-emerald-300'
              }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </span>
            ) : 'Sign In'}
          </button>
        </form>
      </div>

    </div>
  );
};

export default Login;