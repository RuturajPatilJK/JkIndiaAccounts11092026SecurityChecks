import React, { useState } from 'react';
import { FirstPage, NavigateBefore, NavigateNext, LastPage } from '@mui/icons-material';

const NavigationButtons = ({
  handleFirstButtonClick,
  handlePreviousButtonClick,
  handleNextButtonClick,
  handleLastButtonClick,
  isEditing,
}) => {
  const [highlightedButton, setHighlightedButton] = useState(null);

  const handleKeyDown = (event, handler) => {
    if (event.key === 'Enter') {
      handler();
    }
  };

  const iconButtons = [
    {
      key: 'first',
      icon: <FirstPage fontSize="small" />,
      onClick: handleFirstButtonClick,
      label: 'First',
    },
    {
      key: 'previous',
      icon: <NavigateBefore fontSize="small" />,
      onClick: handlePreviousButtonClick,
      label: 'Previous',
    },
    {
      key: 'next',
      icon: <NavigateNext fontSize="small" />,
      onClick: handleNextButtonClick,
      label: 'Next',
    },
    {
      key: 'last',
      icon: <LastPage fontSize="small" />,
      onClick: handleLastButtonClick,
      label: 'Last',
    },
  ];

  const wrapperStyle = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '-45px',
    marginRight: '200px',
    fontFamily: "'Poppins', sans-serif",
  };

  const iconStyle = (isHovered, isDisabled) => ({
    position: 'relative',
    background: isDisabled
      ? '#c2c2c2'
      : isHovered
        ? '#222'
        : '#e6f0ea', // ✅ Soft greenish background
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: isHovered || isDisabled ? 'white' : 'green',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    border: '2px solid #a0c1a9', // ✅ Visible border
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    transform: isHovered ? 'scale(1.1)' : 'scale(1)',
    transition: 'all 0.3s ease',
    fontSize: '20px',
  });

  const tooltipStyle = {
    position: 'absolute',
    top: '-35px',
    background: '#fff',
    color: '#333',
    padding: '5px 8px',
    borderRadius: '5px',
    fontSize: '12px',
    whiteSpace: 'nowrap',
    opacity: 0,
    pointerEvents: 'none',
    transition: '0.3s ease',
    zIndex: 1,
  };

  const tooltipVisibleStyle = {
    ...tooltipStyle,
    opacity: 1,
  };

  const tooltipArrowStyle = {
    content: '""',
    position: 'absolute',
    bottom: '-4px',
    left: '50%',
    transform: 'translateX(-50%) rotate(45deg)',
    width: '8px',
    height: '8px',
    background: '#fff',
  };

  return (
    <div style={wrapperStyle}>
      {iconButtons.map(({ key, icon, onClick, label }) => {
        const isHovered = highlightedButton === key;
        const isDisabled = isEditing;

        return (
          <div
            key={key}
            style={iconStyle(isHovered, isDisabled)}
            onClick={!isDisabled ? onClick : undefined}
            onMouseEnter={() => setHighlightedButton(key)}
            onMouseLeave={() => setHighlightedButton(null)}
            onKeyDown={(e) => handleKeyDown(e, onClick)}
            tabIndex={0}
            role="button"
            aria-label={label}
          >
            <span style={isHovered ? tooltipVisibleStyle : tooltipStyle}>
              {label}
              <span style={tooltipArrowStyle}></span>
            </span>
            {icon}
          </div>
        );
      })}
    </div>
  );
};

export default NavigationButtons;
