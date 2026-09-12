import React, { useState, useEffect } from 'react';
import { 
  FaFileInvoiceDollar, 
  FaReceipt, 
  FaUniversity, 
  FaGavel, 
  FaTruckLoading, 
  FaTruckMoving, 
  FaBook, 
  FaBalanceScale, 
  FaClipboardList, 
  FaWarehouse, 
  FaChartPie, 
  FaBookOpen, 
  FaLayerGroup, 
  FaHistory, 
  FaCartPlus, 
  FaBullhorn, 
  FaChartLine, 
  FaFileArchive, 
  FaFolderOpen 
} from 'react-icons/fa';
import DashboardButton from '../../Common/Buttons/DashboardButton';
import { useMediaQuery, useTheme } from "@mui/material";
import "./DashBoard.css";
import axios from 'axios';
import Swal from 'sweetalert2';
import SaveUpdateSpinner from "../../Common/Spinners/SaveUpdateSpinner"
import { ScaleLoader } from 'react-spinners';

const API_URL = process.env.REACT_APP_API;

const DashBoard = () => {

  const [isLoading, setIsLoading] = useState(false);
  const companyCode = sessionStorage.getItem("Company_Code");
  const uid = sessionStorage.getItem("uid");

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const hideFooterOnMobile = () => {
      if (isMobile) {
        const styleId = 'mobile-footer-hide-style';
        let styleElement = document.getElementById(styleId);

        if (!styleElement) {
          styleElement = document.createElement('style');
          styleElement.id = styleId;
          styleElement.innerHTML = `
                      footer, 
                      .footer, 
                      [class*="Footer"], 
                      [class*="footer"],
                      .MuiDrawer-paper ~ footer,
                      .MuiAppBar-root ~ footer,
                      .main-footer,
                      .app-footer,
                      .page-footer {
                        display: none !important;
                        visibility: hidden !important;
                        opacity: 0 !important;
                        height: 0 !important;
                        overflow: hidden !important;
                        pointer-events: none !important;
                      }
                    `;
          document.head.appendChild(styleElement);
        }
      } else {
        const styleElement = document.getElementById('mobile-footer-hide-style');
        if (styleElement) {
          styleElement.remove();
        }
      }
    };

    hideFooterOnMobile();

    return () => {
      const styleElement = document.getElementById('mobile-footer-hide-style');
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, [isMobile]);

  // Handler for Company Logs with permission check
  const handleCompanyLogsClick = async () => {
    setIsLoading(true);
    try {
      const userCheckUrl = `${API_URL}/get_user_permissions?Company_Code=${companyCode}&Program_Name=/companylogs&uid=${uid}`;
      const response = await axios.get(userCheckUrl);
      const userDetails = response.data?.UserDetails;

      if (userDetails?.canView === "Y") {
        window.open("/companylogs", "_blank");
      } else {
        Swal.fire({
          title: 'Access Denied!',
          text: 'You do not have Permission to view Company Logs.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    } catch (error) {
      console.error("Error fetching user permissions:", error);
      Swal.fire({
        title: 'Access Denied!',
        text: 'You do not have Permission to view Company Logs.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLiveETenders = () => {
    const url = '/live-alltenders-for-daily';
    window.open(url, '_blank');
  }

  const handleallLiveTenders = () => {
    const url = '/live-alltenders';
    window.open(url, '_blank');
  }

  const handleGradeWiseSummary = () => {
    const url = '/Grade-wise-Summary-report';
    window.open(url, '_blank');
  }

  const handleSelfStock = () => {
    const url = '/self-stock';
    window.open(url, '_blank');
  }

  const handleEbuySelfStock = () => {
    const url = '/ebuysugar-self-stock';
    window.open(url, '_blank');
  }

  const handleClosingReport = () => {
    const url = '/ClosingStock-report';
    window.open(url, '_blank');
  }

  return (
    <>
      {/* Financial and Logistics Section */}
      <div className="CommonbuttonContainer" style={{ marginTop: "100px" }}>
        <DashboardButton label="Ledger" icon={FaFileInvoiceDollar} path="/ledger" />
        <DashboardButton label="Receipt Payment" icon={FaReceipt} path="/RecieptPaymentUtility" />
        <DashboardButton label="UTR Entry" icon={FaUniversity} path="/utrentry-Utility" />
        <DashboardButton label="Tender Purchase" icon={FaGavel} path="/tender-purchaseutility" />
        <DashboardButton label="Delivery Order" icon={FaTruckLoading} path="/delivery-order-utility" />
      </div>

      {/* Accounting and Main Reports Section */}
      <div className="CommonbuttonContainer">
        <DashboardButton label="Sauda Wise Dispatch" icon={FaTruckMoving} path="/PartywiseSaleReport" />
        <DashboardButton label="Day Book" icon={FaBook} path="/daybook" />
        <DashboardButton label="Trial Balance" icon={FaBalanceScale} path="/trial-balance" />
        <DashboardButton label="Register" icon={FaClipboardList} path="/register" />
        <DashboardButton label="Self Stock" icon={FaWarehouse} path="/self-stock" onClick={handleSelfStock} />
      </div>

      {/* Inventory and System Logs Section */}
      <div className="CommonbuttonContainer">
        <DashboardButton label="Dispatch Summary" icon={FaChartPie} path="/register" />
        <DashboardButton label="Stock Book" icon={FaBookOpen} path="/balance-stock" />
        <DashboardButton label="Stock Summary" icon={FaLayerGroup} path="/stock-book" />
        <DashboardButton label="Company Logs" icon={FaHistory} path="/companylogs" onClick={handleCompanyLogsClick} />
        <DashboardButton label="Grade Wise Sauda Summary" icon={FaLayerGroup} path="/Grade-wise-Summary-report" onClick={handleGradeWiseSummary} />
      </div>

      {/* Analytics and Tenders Section */}
      <div className="CommonbuttonContainer">
        <DashboardButton label="Daily Purchase" icon={FaCartPlus} path="/live-alltenders" onClick={handleallLiveTenders} />
        <DashboardButton label="Daily Sauda" icon={FaBullhorn} path="/live-alltenders-for-daily" onClick={handleLiveETenders} />
        <DashboardButton label="Analytics" icon={FaChartLine} path="/Analytics" />
        <DashboardButton label="Closing Report" icon={FaFileArchive} path="/ClosingStock-report" onClick={handleClosingReport} />
        <DashboardButton label="File Management" icon={FaFolderOpen} path="/filesystemdashboard" />
      </div>

      {isLoading && (
        <div className="loading">
          <ScaleLoader color="#052fa0" height={10} width={4} />
        </div>
      )}
    </>
  );
}

export default DashBoard;
