
import React from 'react';
import { IoArrowBack } from 'react-icons/io5';

const BackButton = ({ onClick }) => {
  return (
    <div className="styled-wrapper">
      <button className="button" onClick={onClick}>
        <div className="button-box">
          <svg className="button-elem" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <IoArrowBack className="back-icon" />
          </svg>
        </div>
      </button>
    </div>
  );
};

const style = `
  .styled-wrapper .button {
    display: block;
    position: relative;
    width: 45px;
    height: 45px;
    margin: 0;
    overflow: hidden;
    outline: none;
    background-color: transparent;
    cursor: pointer;
    border: 0;
    -webkit-tap-highlight-color: transparent; /* Remove background color on mobile tap */
  }

  .styled-wrapper .button:before {
    content: "";
    position: absolute;
    border-radius: 50%;
    inset: 7px;
    border: 3px solid black;
    transition:
      opacity 0.4s cubic-bezier(0.77, 0, 0.175, 1) 80ms,
      transform 0.5s cubic-bezier(0.455, 0.03, 0.515, 0.955) 80ms;
  }

  .styled-wrapper .button:after {
    content: "";
    position: absolute;
    border-radius: 50%;
    inset: 7px;
    border: 4px solid #599a53;
    transform: scale(1.3);
    transition:
      opacity 0.4s cubic-bezier(0.165, 0.84, 0.44, 1),
      transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    opacity: 0;
  }

  .styled-wrapper .button:hover:before,
  .styled-wrapper .button:focus:before {
    opacity: 0;
    transform: scale(0.7);
    transition:
      opacity 0.4s cubic-bezier(0.165, 0.84, 0.44, 1),
      transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  .styled-wrapper .button:hover:after,
  .styled-wrapper .button:focus:after {
    opacity: 1;
    transform: scale(1);
    transition:
      opacity 0.4s cubic-bezier(0.77, 0, 0.175, 1) 80ms,
      transform 0.5s cubic-bezier(0.455, 0.03, 0.515, 0.955) 80ms;
  }

  .styled-wrapper .button-box {
    display: flex;
    position: absolute;
    top: 0;
    left: 0;
  }

  .styled-wrapper .button-elem {
    display: block;
    width: 20px;
    height: 20px;
    margin: 10px 15px 0 12px;
    transform: rotate(360deg);
    fill: #f0eeef;
  }

  .styled-wrapper .button:hover .button-box,
  .styled-wrapper .button:focus .button-box {
    transition: 0.4s;
    transform: translateX(-69px);
  }

  .back-icon {
    font-size: 24px;
    color: #333; 
  }

  .styled-wrapper .button:hover,
  .styled-wrapper .button:focus {
    background-color: transparent !important; 
    outline: none;
  }
`;

const styleElement = document.createElement('style');
styleElement.innerHTML = style;
document.head.appendChild(styleElement);

export default BackButton;
