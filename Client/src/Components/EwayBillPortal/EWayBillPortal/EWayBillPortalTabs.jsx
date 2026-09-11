import React, { useState } from 'react';
import { Tabs, Tab, Box, TextField, Button, Stack } from '@mui/material';
import EWayBills from '../EWayBillPortal/GenrateEWayBill/EWayBills';
import PurchaseBillSummary from './PurchaseBillSummary';
import GenrateEwayBill from './GenrateEwayBill';
import { useNavigate } from 'react-router-dom';
import SubmitButton from '../../../Common/Buttons/Submit';
import MissingData from './MissingData';

const EWayBillPortal = () => {
  const getCurrentDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [value, setValue] = useState(0);
  const [fromDate, setFromDate] = useState(getCurrentDate());
  const [submittedFromDate, setSubmittedFromDate] = useState(getCurrentDate());

  const navigate = useNavigate();

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleFromDateChange = (event) => {
    setFromDate(event.target.value);
  };

  const handleSubmit = () => {
    setSubmittedFromDate(fromDate);
  };

  const isDateControlsDisabled = value === 1 || value === 2;

  return (
    <div style={{marginTop:'-70px'}}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2, 
          flexWrap: 'wrap', 
        }}
      >

        <Box sx={{ display: 'flex', alignItems: 'center', ml: 2, mb: { xs: 2, md: 0 } }}>
          <TextField
            label="Select Date"
            type="date"
            value={fromDate}
            onChange={handleFromDateChange}
            disabled={isDateControlsDisabled}
            sx={{ marginRight: 2 }}
            InputProps={{
              style: {
                fontSize: "12px",
                height: "35px",
                fontWeight: "700",
              },
            }}
          />
          <SubmitButton
            onClick={handleSubmit}
            disabled={isDateControlsDisabled}
            label="Submit"
          />
        </Box>

        <Box sx={{ flexGrow: 1, mr: 2}}>
          <Tabs value={value} onChange={handleChange} aria-label="EWay Bill Tabs" centered>
            <Tab label="1. Purchase Bill" sx={{ fontSize: '1.1rem', fontWeight: 'bold' }} />
            <Tab label="2. EWayBill" sx={{ fontSize: '1.1rem', fontWeight: 'bold' }} />
            <Tab label="3. Generate EWayBill" sx={{ fontSize: '1.1rem', fontWeight: 'bold' }} />
            <Tab label="4. Missing Data" sx={{ fontSize: '1.1rem', fontWeight: 'bold' }} />
          </Tabs>
        </Box>
      </Box>

      <Box sx={{ mt: 2 }}>
        {value === 0 && <PurchaseBillSummary fromDate={submittedFromDate} />}
        {value === 1 && <EWayBills fromDate={submittedFromDate} />}
        {value === 2 && <GenrateEwayBill fromDate={submittedFromDate} />}
        {value === 3 && <MissingData fromDate={submittedFromDate} />}
      </Box>
    </div>
  );
};

export default EWayBillPortal;
