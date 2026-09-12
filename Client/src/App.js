import React, { useEffect } from 'react';
import './App.css';
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';
import routes from './Pages/RouterConfig';
import Navbar from './Pages/Navbar/Navbar';
import ComponentUtility from "./Components/CompoentsConfig";
import LoginForm from './Pages/Login/Login';
import Footer from './Pages/Footer/Footer';
import { AccountMasterProvider } from './Helper/AccountMasterContext';
import useSessionExpiration from './hooks/useSessionExpiration';
import TitleUpdater from "./Common/TitleUpdater/TitleUpdater"
import LandingPage from './Pages/LandingPage/LandingPage';

import io from "socket.io-client";
const socketURL = process.env.REACT_APP_API_URL;

function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}

function App() {
  // useSessionExpiration();
  const location = useLocation();
  const { pathname } = location;

  const hideNavbarPaths = ['/', '/company-list', '/landing', '/create-accounting-year', '/create-company', '/ProfitLoss-Report', '/Balancesheet-Report', '/ledger-report', '/bank-book-report', '/JVReport-reports', '/daybook-report', '/Sale-registers', '/SaleTDS-registers', '/mill-rate-info-report', '/SaleTCS-registers', '/SaleTDSPartyWise-registers', '/SaleMonthWise-registers', '/MillSaleReport-registers', '/PurchaseReturn-registers', '/RCM-registers', '/SaleTCSPartyWise-registers', '/Purchase-registers', '/PurchaseTDS-registers', '/PurchaseTDSpartywise-registers', '/PurchaseTCS-registers', '/PurchaseTCSpartywise-registers', '/SaleReturnSale-registers', '/millwise-stock', '/tenderwise-reports', '/UTRReportSummary-reports', '/MillPaymentSummary-reports', '/utr_detail-report', '/DuepaymentSummary-reports', '/stock-book-report', '/stock-book-detail-report', '/retail-stock-book-detail-report', '/stock-book-detail-report', '/TrialBalance-reports', '/TrialBalanceDetails-reports', '/DaywiseTrialBalance-reports', '/OpeningBalanceDetails-reports', '/SaudaSummary-reports', '/normal-sauda-summary', '/interest-statement-report', '/self-stock', '/dispatch-mill-wise', '/DispatchDetailsRegister', '/DispatchDetailsNewRegister', '/dispatch-grade-wise', '/DispatchDetailsForMill', '/DispatchSummary', '/DispatchDiffRecieve', '/DispatchDiffPay', '/live-tenders', '/NewDispatchRegister-Register', '/Party-wise-DO', '/Party-wise-DO_with-Mill', '/TransportAc-Register', '/pending-sb-list', '/PurchaseMonthWise-registers', '/MillWisePurchase-Register', '/MillPaymentForGST-Register', '/BalanceStockSummary-Register', '/MillwiseDispatch', '/TransportWiseDispatch', '/DOWiseDispatch', '/balance-stock', '/companylogs', '/profit-loss-report', '/getAllledger-report', '/ewaybill', '/periodic-sale-report', '/periodic-sale-report-bar-chart', '/ledger-withoutopeningbalance', '/StatisticData-report', '/genratesalary', '/send-message', '/TrialBalanceGeneral-reports', '/live-alltenders', '/TrialBalancescreen', '/AgingAnalysis-Report', '/stock-book-report-millwise', '/multipleSBPrint', '/AgingAnalysis-Report-Creditors', '/CA-ledger-report', '/Detailed_PurchaseRegister', '/accountmaster-print-report', '/ledger-monthwise-report', '/SundryDetailsReport', '/DaywiseTrialBalanceWithoutOpenning-reports', '/CustomerLimit', '/AgingAnalysisBalance-Report', '/ClosingStock-report', '/live-alltenders-for-daily', '/Detailed_SaleRegister', '/AgingAnalysisGSTwise', '/DaliySudaDispatch', '/ebuysugar', '/google-analytics', '/AgingAnalysisPANwise-reports', '/TrialBalanceDetailsGSTwise-reports', '/TrialBalanceDetailsPANwise-reports', '/AgingAnalysisDebtors_GST-Report', '/AgingAnalysis-Report-Creditors-GST'];
  const isAuthenticated = sessionStorage.getItem('username') !== null;


  useEffect(() => {
    const socket = io(socketURL, { transports: ["websocket"] });

    const handlePostDateUpdated = async (data) => {
      sessionStorage.setItem("Post_Date", data.record.Post_Date);

      // if backend sends { record } or { id } — refetch in both cases
    };

    socket.on("PostDate_Updated", handlePostDateUpdated);

    return () => {
      socket.off("PostDate_Updated", handlePostDateUpdated);
      socket.disconnect();
    };
  }, [socketURL]);


  return (
    <>
      <AccountMasterProvider hideNavbarPaths={hideNavbarPaths} >
        <div >
          {!hideNavbarPaths.includes(pathname) && <Navbar />}
        </div>
        <div className="App">
          <TitleUpdater />
          <Routes>
            <Route path="/" element={<LoginForm />} />
            <Route path="/landing" element={<LandingPage />} />
            {routes.map((route, index) => (
              <Route key={index} path={route.path} element={<route.element />} />
            ))}

            {ComponentUtility.map((route, index) => (
              <Route
                key={index}
                path={route.path}
                element={isAuthenticated ? <route.element /> : <Navigate to="/" />}
              />
            ))}
          </Routes>

        </div>
        {!hideNavbarPaths.includes(pathname) && <Footer />}
      </AccountMasterProvider>
    </>
  );
}

export default AppWrapper;
