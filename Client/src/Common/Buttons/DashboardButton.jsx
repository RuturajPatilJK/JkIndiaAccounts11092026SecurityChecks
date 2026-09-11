import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const DashboardButton = ({ label, icon: Icon, path, onClick }) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const buttonStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: '16px 20px',
    width: '100%',
    maxWidth: '320px',
    height: '120px',
    background: isHovered ? 'linear-gradient(135deg, #FDFCFB 0%, #E2D1C3 100%)' : '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    boxShadow: isHovered
      ? '0 10px 25px rgba(0, 0, 0, 0.15)'
      : '0 6px 16px rgba(0, 0, 0, 0.1)',
    cursor: 'pointer',
    transform: isPressed ? 'scale(0.97)' : isHovered ? 'scale(1.04)' : 'scale(1)',
    transition: 'all 0.25s ease-in-out',
  };

  const iconContainerStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '64px',
    height: '64px',
    borderRadius: '16px',
    background: isHovered
      ? 'linear-gradient(135deg, #FFD54F 0%, #4CAF50 100%)'
      : 'linear-gradient(135deg, #FFE082 0%, #A5D6A7 100%)',
    transition: 'transform 0.3s ease, background 0.3s ease',
    transform: isHovered ? 'rotate(3deg) scale(1.1)' : 'rotate(0deg) scale(1)',
  };

  const iconStyle = {
    fontSize: '32px',
    fill: isHovered ? '#1F2937' : '#4B5563',
    transition: 'fill 0.3s ease',
  };

  const dividerStyle = {
    width: '1px',
    height: '48px',
    backgroundColor: '#d1d5db',
    margin: '0 16px',
  };

  const labelStyle = {
    textAlign: 'left',
    fontSize: '20px',
    fontWeight: 600,
    color: isHovered ? '#111827' : '#374151',
    textTransform: 'capitalize',
    transition: 'color 0.3s ease',
    flex: 1,
  };

  const handleButtonClick = () => {
    if (onClick) {
      onClick();
    } else if (path) {
      navigate(path);
    }
  };

  return (
    <button
      onClick={handleButtonClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      style={buttonStyle}
    >
      <section style={iconContainerStyle}>
        <Icon style={iconStyle} />
      </section>

      <div style={dividerStyle} />

      <span style={labelStyle}>{label}</span>
    </button>
  );
};

export default DashboardButton;
