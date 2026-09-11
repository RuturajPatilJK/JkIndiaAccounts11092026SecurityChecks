// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import ItemMasterHelp from "../../../Helper/SystemmasterHelp";
// import '../Ledger/Ledger.css';
// import { TextField, Grid, Typography } from '@mui/material';
// import ReportButton from "../../../Common/Buttons/ReportButton"
// import { CgArrowTopRightR } from "react-icons/cg";

// const StockBookDetail = () => {
//   const today = new Date().toISOString().split("T")[0];

// const [fromDate, setFromDate] = useState(today);
// const [toDate, setToDate] = useState(today);
//   const [itemCode, setItemCode] = useState("");
//   const [item_Name, setItemName] = useState("");
//   const [accoid, setAccoid] = useState("");
//   const navigate = useNavigate();
//   const [loading, setLoading] = useState(false)

//   const AccountYear = sessionStorage.getItem('Accounting_Year');

//   // useEffect(() => {
//   //   const currentDate = new Date().toISOString().split("T")[0];
//   //   setFromDate(currentDate);
//   //   setToDate(currentDate);
//   // }, [toDate]);

//   const handleItemCode = (code, accoid, hsn, name) => {
//     setItemCode(code);
//     setItemName(name);
//     setAccoid(accoid);
//   };

//   const handleStockBookReport = (e) => {
//     setLoading(true);
//     setTimeout(() => {
//       const url = `/stock-book-report?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&itemCode=${encodeURIComponent(itemCode)}`;
//       window.open(url, '_blank', 'toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=800,height=600');
//       setLoading(false);
//     }, 500);
//   };

//   const handleStockBookMillwiseReport = (e) => {
//     setLoading(true);
//     setTimeout(() => {
//       const url = `/stock-book-report-millwise?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&itemCode=${encodeURIComponent(itemCode)}`;
//       window.open(url, '_blank', 'toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=800,height=600');
//       setLoading(false);
//     }, 500);
//   };


//    const handleStockBookDetailReport = (e) => {
//     setLoading(true);
//     setTimeout(() => {
//       const url = `/stock-book-detail-report?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&itemCode=${encodeURIComponent(itemCode)}`;
//       window.open(url, '_blank', 'toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=800,height=600');
//       setLoading(false);
//     }, 500);
//   };

//   // const handleRetailDetailReport = (e) => {
//   //   navigate(`/retail-stock-book-detail-report`, {
//   //     state: { itemCode, fromDate, toDate, item_Name },
//   //   });
//   // };

//   return (
//     <>
//       <Typography variant="h6" style={{ textAlign: 'center', fontWeight: 'bold', marginTop: "100px" }}>
//         FNO Purchase And Sale Details Report
//       </Typography>
//       <div style={{
//         display: "flex",
//         justifyContent: "center",
//         alignItems: "center",
//         height: "30vh",
//       }}>
//         <div >

//           <form onSubmit={handleStockBookReport}>
//             <Grid container spacing={1} mt={2}>
//               <div className="debitCreditNote-row" style={{ marginTop: "5px" }}>
//                 <label htmlFor="item_code" className="label">
//                   Item Code :
//                 </label>
//                 <div className="debitCreditNote-col">
//                   <div className="debitCreditNote-form-group">
//                     <ItemMasterHelp
//                       onAcCodeClick={handleItemCode}
//                       CategoryName={item_Name}
//                       CategoryCode={itemCode}
//                       SystemType="I"
//                       name="item_code"
//                       className="account-master-help"
//                     />
//                   </div>
//                 </div>
//               </div>

//               <Grid item xs={12} sm={3}>
//                 <TextField
//                   label="From Date"
//                   type="date"
//                    name = "fromDate"
//                   value={fromDate}
//                   onChange={(e) => setFromDate(e.target.value)}
//                   fullWidth
//                   InputLabelProps={{
//                     shrink: true,
//                   }}
//                   size="small"
//                 />
//               </Grid>
//               <Grid item xs={12} sm={3}>
//                 <TextField
//                   label="To Date"
//                   type="date"
//                   name = "toDate"
//                   value={toDate}
//                   onChange={(e) => setToDate(e.target.value)}
//                   fullWidth
//                   InputLabelProps={{
//                     shrink: true,
//                   }}
//                   size="small"
//                 />
//               </Grid>
//             </Grid>

//             <div className="CommonbuttonContainer" style={{ marginTop: "20px" }} >
//               <ReportButton label=" Stock Book Report"
//                  icon={CgArrowTopRightR}
//                  onClick={handleStockBookReport}
//                  loading={loading}
//                 disabled={""}
//               />

//                 <ReportButton label=" Millwise Stock Report"
//                  icon={CgArrowTopRightR}
//                  onClick={handleStockBookMillwiseReport}
//                  loading={loading}
//                 disabled={""}
//               />

//               <ReportButton label="Stock Book Detail"
//                 icon={CgArrowTopRightR}
//                 onClick={handleStockBookDetailReport}
//                 loading={loading}
//                 disabled={""}
//               />

//               {/* <ReportButton label="Retail Detail Report"
//                 icon={CgArrowTopRightR}
//                 onClick={handleRetailDetailReport}
//                 loading={""}
//                 disabled={""}
//               /> */}
//             </div>
//           </form>
//         </div>
//       </div>
//     </>
//   );
// };

// export default StockBookDetail;
















import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ItemMasterHelp from "../../../Helper/SystemmasterHelp";
import { TextField, Typography } from '@mui/material';
import ReportButton from "../../../Common/Buttons/ReportButton"
import { CgArrowTopRightR } from "react-icons/cg";

const StockBookDetail = () => {
    const today = new Date().toISOString().split("T")[0];

    const [fromDate, setFromDate] = useState(today);
    const [toDate, setToDate] = useState(today);
    const [itemCode, setItemCode] = useState("");
    const [item_Name, setItemName] = useState("");
    const [activeReport, setActiveReport] = useState(null);

    const handleItemCode = (code, accoid, hsn, name) => {
        setItemCode(code);
        setItemName(name);
    };

    const handleReport = (reportType, endpoint) => {
        setActiveReport(reportType);
        setTimeout(() => {
            const url = `${endpoint}?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&itemCode=${encodeURIComponent(itemCode)}`;
            window.open(url, '_blank', 'toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=800,height=600');
            setActiveReport(null);
        }, 500);
    };

    return (
        <div className="w-full flex flex-col items-center mt-10 px-4">
            <Typography variant="h6" className="font-bold text-black mb-20 uppercase tracking-wider">
              Stock Summary
            </Typography>

            <div className="w-full max-w-3xl space-y-3 mt-10">
                {/* Row 1: Item Master Help */}
                <div className="flex items-center space-x-4 bg-gray-50 p-2">
                    <label className="text-sm font-bold text-gray-700 whitespace-nowrap w-24">Item Code:</label>
                    <div className="flex-grow">
                        <ItemMasterHelp
                            onAcCodeClick={handleItemCode}
                            CategoryName={item_Name}
                            CategoryCode={itemCode}
                            SystemType="I"
                            name="item_code"
                        />
                    </div>
                </div>

                {/* Row 2: Smaller Date Inputs */}
                <div className="flex flex-col sm:flex-row items-center justify-start gap-6 p-2 rounded-md ">
                    <div className="flex items-center space-x-2">
                        <label className="text-sm font-bold text-gray-700 whitespace-nowrap w-24">From Date:</label>
                        <TextField
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            size="small"
                            variant="outlined"
                            className="bg-white"
                            // Reduced width specifically for the date input
                            sx={{ width: '160px' }}
                            InputLabelProps={{ shrink: true }}
                        />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                        <label className="text-sm font-bold text-gray-700 whitespace-nowrap">To Date:</label>
                        <TextField
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            size="small"
                            variant="outlined"
                            className="bg-white"
                            // Reduced width specifically for the date input
                            sx={{ width: '160px' }}
                            InputLabelProps={{ shrink: true }}
                        />
                    </div>
                </div>

                <hr className="border-t-2 border-dotted border-gray-400 my-4 opacity-40" />

                {/* Buttons Row */}
                <div className="flex flex-wrap justify-center gap-3">
                    <ReportButton 
                        label="Stock Book"
                        icon={CgArrowTopRightR}
                        onClick={() => handleReport("stock", "/stock-book-report")}
                        loading={activeReport === "stock"}
                        disabled={activeReport !== null && activeReport !== "stock"}
                    />
                    <ReportButton 
                        label="Millwise Stock"
                        icon={CgArrowTopRightR}
                        onClick={() => handleReport("millwise", "/stock-book-report-millwise")}
                        loading={activeReport === "millwise"}
                        disabled={activeReport !== null && activeReport !== "millwise"}
                    />
                    <ReportButton 
                        label="Book Detail"
                        icon={CgArrowTopRightR}
                        onClick={() => handleReport("detail", "/stock-book-detail-report")}
                        loading={activeReport === "detail"}
                        disabled={activeReport !== null && activeReport !== "detail"}
                    />
                </div>
            </div>
        </div>
    );
};

export default StockBookDetail;