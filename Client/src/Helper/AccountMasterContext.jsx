import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import io from "socket.io-client";

const socketURL = process.env.REACT_APP_API_URL;

const AccountMasterContext = createContext();

export const AccountMasterProvider = ({ children,hideNavbarPaths }) => {
    const [accountData, setAccountData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [acTypeFilter, setAcTypeFilter] = useState([]);

    const fetchData = async () => {
        
        const CompanyCode = sessionStorage.getItem("Company_Code");
        const API_URL = process.env.REACT_APP_API;

        try {
            const response = await axios.get(`${API_URL}/account_master_all?Company_Code=${CompanyCode}`);
            setAccountData(response.data);
        } catch (error) {
            setError(error);
        } finally {
            setLoading(false);
        }
    };


      useEffect(() => {
            // const socket = io("wss://accounts-backend.ebuysugar.com", { transports: ["websocket"] });
            const socket = io(`${socketURL}`, { transports: ["websocket"] });
            socket.on("connect", () => console.log("Socket connected:", socket.id));
            socket.on("get_accounts", (data) => console.log("Connected to server:"));
            socket.on("account_added", fetchData);
            socket.on("account_updated", fetchData);
            fetchData();
            return () => socket.disconnect();
        }, []);
    

    const filteredAccountData = acTypeFilter.length > 0
        ? accountData.filter(item => acTypeFilter.includes(item.Ac_type))
        : accountData;

    return (
        <AccountMasterContext.Provider value={{ accountData : filteredAccountData , loading, error,hideNavbarPaths,setAcTypeFilter, refreshData: fetchData}}>
            {children}
        </AccountMasterContext.Provider>
    );
};

export const useAccountMaster = () => useContext(AccountMasterContext);