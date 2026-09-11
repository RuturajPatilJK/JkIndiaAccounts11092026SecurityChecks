import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MillMasterHelp from "../../../../Helper/OnlineRailwayRackBuy/RackMillInfoHelp";
import "./RackRailwayMillRate.css";
import { Typography } from '@mui/material';

const RackRailwayMillRateReport = () => {
  const [millCode, setMillCode] = useState("");
  const [millName, setMillName] = useState("");
  const [loading, setLoading] = useState(false);

  
  const handleAc_Code = async (id,name) => {
    setMillCode(id);
    setMillName(name);
  };

  const handleGetReportClick = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
        const url = `/mill-rate-info-report?millName=${encodeURIComponent(millName)}&millCode=${encodeURIComponent(millCode)}`;
        window.open(url, '_blank', 'toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=800,height=600');
        setLoading(false);
    }, 500);
};



  return (
    <div className="RackRailwayMillRate-container">
      <div className="RackRailwayMillRate-card">
         <Typography variant="h6" style={{ textAlign: 'center', fontSize: "24px", fontWeight: "bold",marginBottom:"40px"}}>Mill Rate Report</Typography>
        <form onSubmit={handleGetReportClick} >
          <div className="RackRailwayMillRate-form">
          <div className="form-group">
            <label htmlFor="Mill_Id" className="form-label">
              Mill Id:
            </label>
            <div className="account-help-container">
              <MillMasterHelp
                onAcCodeClick={handleAc_Code}
                name="Mill_Id"
                MillName={millName}
                MillId={millCode}
              />
            </div>
          </div>
          </div>
          <button type="submit" className="submit-button">
            Get Report
          </button>
        </form>
      </div>
    </div>
  );
};

export default RackRailwayMillRateReport;