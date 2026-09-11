import React, { useState } from 'react';

const DetailAddButtom = ({ addUser }) => {
  const [hover, setHover] = useState(false);

  const buttonStyle = {
    position: 'relative',
    display: 'inline-block',
    margin: '15px',
    padding: '10px 30px',
    textAlign: 'center',
    fontSize: '18px',
    letterSpacing: '1px',
    textDecoration: 'none',
    color: hover ? 'white' : '#725AC1',
    background: 'transparent',
    cursor: 'pointer',
    transition: 'ease-out 0.5s',
    border: '2px solid #725AC1',
    borderRadius: '4px',
    boxShadow: hover ? 'inset 0 -100px 0 0 #725AC1' : 'inset 0 0 0 0 #725AC1',
  };

  const handleMouseEnter = () => setHover(true);
  const handleMouseLeave = () => setHover(false);

  return (
    <button
      style={buttonStyle}
      onClick={addUser}
      onKeyDown={(event) => {
        if (event.key === 13) {
          addUser();
        }
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={() => setHover(true)} 
      onBlur={() => setHover(false)} 
    >
      Add
    </button>
  );
};

export default DetailAddButtom;
