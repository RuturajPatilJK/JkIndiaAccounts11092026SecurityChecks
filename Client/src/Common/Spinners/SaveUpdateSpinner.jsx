// import React from 'react';

// const SaveUpdateSpinner = () => {
//   return (
//     <div style={styles.wrapper}>
//       <style>
//         {`
//           .loader {
//             animation: rotate 1s infinite;
//             height: 50px;
//             width: 50px;
//             display: inline-block;
//           }

//           .loader:before,
//           .loader:after {
//             border-radius: 50%;
//             content: '';
//             display: block;
//             height: 20px;
//             width: 20px;
//           }

//           .loader:before {
//             animation: ball1 1s infinite;
//             background-color: #cb2025;
//             box-shadow: 30px 0 0 #f8b334;
//             margin-bottom: 10px;
//           }

//           .loader:after {
//             animation: ball2 1s infinite;
//             background-color: #00a096;
//             box-shadow: 30px 0 0 #97bf0d;
//           }

//           @keyframes rotate {
//             0% {
//               -webkit-transform: rotate(0deg) scale(0.8);
//               -moz-transform: rotate(0deg) scale(0.8);
//             }

//             50% {
//               -webkit-transform: rotate(360deg) scale(1.2);
//               -moz-transform: rotate(360deg) scale(1.2);
//             }

//             100% {
//               -webkit-transform: rotate(720deg) scale(0.8);
//               -moz-transform: rotate(720deg) scale(0.8);
//             }
//           }

//           @keyframes ball1 {
//             0% {
//               box-shadow: 30px 0 0 #f8b334;
//             }

//             50% {
//               box-shadow: 0 0 0 #f8b334;
//               margin-bottom: 0;
//               -webkit-transform: translate(15px,15px);
//               -moz-transform: translate(15px, 15px);
//             }

//             100% {
//               box-shadow: 30px 0 0 #f8b334;
//               margin-bottom: 10px;
//             }
//           }

//           @keyframes ball2 {
//             0% {
//               box-shadow: 30px 0 0 #97bf0d;
//             }

//             50% {
//               box-shadow: 0 0 0 #97bf0d;
//               margin-top: -20px;
//               -webkit-transform: translate(15px,15px);
//               -moz-transform: translate(15px, 15px);
//             }

//             100% {
//               box-shadow: 30px 0 0 #97bf0d;
//               margin-top: 0;
//             }
//           }
//         `}
//       </style>

//       <div className="loader"></div>
//     </div>
//   );
// };

// const styles = {
//   wrapper: {
//     position: 'fixed',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//     display: 'flex',
//     justifyContent: 'center',
//     alignItems: 'center',
//     zIndex: 9999,
//   }
// };

// export default SaveUpdateSpinner;















import React from 'react';

const SaveUpdateSpinner = () => {
  return (
    <div style={styles.wrapper}>
      <style>
        {`
          .loader-svg {
            width: 50px;
            height: 50px;
            animation: spin 2s linear infinite;
          }

          .loader-svg line {
            /* Banking-style Light Pink / Magenta */
            stroke: #FF69B4; 
            stroke-width: 5;
            stroke-linecap: round;
            opacity: 0.9;
            stroke-dasharray: 12;
            stroke-dashoffset: 12;
            animation: dash 2s ease-in-out infinite;
          }

          @keyframes dash {
            0% {
              stroke-dashoffset: 12;
              opacity: 1;
            }
            50% {
              stroke-dashoffset: 0;
              opacity: 0.5;
            }
            100% {
              stroke-dashoffset: 12;
              opacity: 1;
            }
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>

      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="loader-svg">
        <g fillRule="evenodd" fill="none" strokeWidth="1" stroke="none">
          <line x1="24" y1="2" x2="24" y2="6"></line>
          <line x1="34" y1="4.679" x2="34" y2="8.679" transform="translate(34, 6.679) rotate(30) translate(-34, -6.679)"></line>
          <line x1="41.321" y1="12" x2="41.321" y2="16" transform="translate(41.321, 14) rotate(60) translate(-41.321, -14)"></line>
          <line x1="44" y1="22" x2="44" y2="26" transform="translate(44, 24) rotate(90) translate(-44, -24)"></line>
          <line x1="41.321" y1="32" x2="41.321" y2="36" transform="translate(41.321, 34) rotate(120) translate(-41.321, -34)"></line>
          <line x1="34" y1="39.321" x2="34" y2="43.321" transform="translate(34, 41.321) rotate(150) translate(-34, -41.321)"></line>
          <line x1="24" y1="42" x2="24" y2="46" transform="translate(24, 44) rotate(180) translate(-24, -44)"></line>
          <line x1="14" y1="39.321" x2="14" y2="43.321" transform="translate(14, 41.321) rotate(210) translate(-14, -41.321)"></line>
          <line x1="6.679" y1="32" x2="6.679" y2="36" transform="translate(6.679, 34) rotate(240) translate(-6.679, -34)"></line>
          <line x1="4" y1="22" x2="4" y2="26" transform="translate(4, 24) rotate(270) translate(-4, -24)"></line>
          <line x1="6.679" y1="12" x2="6.679" y2="16" transform="translate(6.679, 14) rotate(300) translate(-6.679, -14)"></line>
          <line x1="14" y1="4.679" x2="14" y2="8.679" transform="translate(14, 6.679) rotate(330) translate(-14, -6.679)"></line>
        </g>
      </svg>
    </div>
  );
};

const styles = {
  wrapper: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    /* Soft dark overlay to make pink pop */
    backgroundColor: 'rgba(15, 15, 15, 0.7)', 
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  }
};

export default SaveUpdateSpinner;

