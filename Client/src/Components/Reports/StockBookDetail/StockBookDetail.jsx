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