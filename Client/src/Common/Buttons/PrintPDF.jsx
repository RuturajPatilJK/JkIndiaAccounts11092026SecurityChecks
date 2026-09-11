import React, { useState } from 'react';
import PrintIcon from '@mui/icons-material/Print';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import CheckIcon from '@mui/icons-material/Check';

const PrintButton = ({ disabledFeild, fetchData, label }) => {

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleClick = async () => {
    if (disabledFeild || isLoading) return;

    setIsLoading(true);
    try {
      await fetchData();
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 2000);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const buttonStyle = {
    height: '38px',
    padding: '8px 16px',
    backgroundColor: disabledFeild ? '#cccccc' : isLoading ? '#D81B60' : isSuccess ? '#880E4F' : '#D81B60',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    cursor: disabledFeild || isLoading ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.3s ease, box-shadow 0.3s ease, transform 0.2s ease',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    transform: 'scale(1)',
    ':hover': {
      backgroundColor: disabledFeild || isLoading ? '#cccccc' : isSuccess ? '#880E4F' : '#C2185B',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
      transform: 'scale(1.05)',
    },
    ':active': {
      transform: 'scale(0.95)',
    },
  };

  return (
    <Tooltip title={disabledFeild ? "Printing is disabled" : "Click to print"}>
      <button
        onClick={handleClick}
        style={buttonStyle}
        disabled={disabledFeild || isLoading}
        className="print-button"
      >
        {isLoading ? (
          <CircularProgress size={20} style={{ color: '#ffffff' }} />
        ) : isSuccess ? (
          <CheckIcon style={{ fontSize: '20px' }} />
        ) : (
          <PrintIcon style={{ fontSize: '20px' }} />
        )}
        {isLoading
          ? 'Printing...'
          : isSuccess
            ? 'Printed!'
            : (label || 'Print')}

      </button>
    </Tooltip>
  );
};

export default PrintButton;