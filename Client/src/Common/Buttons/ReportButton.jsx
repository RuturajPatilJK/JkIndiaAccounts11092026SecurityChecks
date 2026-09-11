// import React, { useState } from 'react';

// const ReportButton = ({ label, icon: Icon, onClick, loading = false, disabled = false }) => {
//     const [isHovered, setIsHovered] = useState(false);
//     const [isLoading, setIsLoading] = useState(false);

//     const handleClick = async () => {
//         if (disabled || isLoading) return;

//         setIsLoading(true);
//         try {
//             await new Promise(resolve => setTimeout(resolve, 1000));
//             if (onClick) onClick();
//         } catch (err) {
//             console.error("Download failed", err);
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     const buttonStyle = {
//         display: 'flex',
//         alignItems: 'center',
//         justifyContent: isLoading ? 'center' : 'flex-start',
//         padding: '10px',
//         width: '400px',
//         height: '112px',
//         backgroundColor: isHovered ? '#d3efe2' : 'white',
//         borderRadius: '8px',
//         boxShadow: isHovered ? '0 6px 16px rgba(0, 0, 0, 0.15)' : '0 4px 12px rgba(0, 0, 0, 0.1)',
//         cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
//         transition: 'all 0.3s ease',
//         transform: isHovered ? 'scale(1.05)' : 'scale(1)',
//         position: 'relative',
//         overflow: 'hidden',
//     };

//     const iconContainerStyle = {
//         display: isLoading ? 'none' : 'flex',
//         justifyContent: 'center',
//         alignItems: 'center',
//         width: '56px',
//         height: '56px',
//         borderRadius: '50%',
//         background: isHovered
//             ? 'linear-gradient(to right,rgb(66, 194, 156),rgb(79, 214, 86))'
//             : 'linear-gradient(to right,rgb(107, 174, 230), #A2E9C1)',
//         boxShadow: isHovered ? '0 6px 12px rgba(0, 0, 0, 0.2)' : '0 4px 8px rgba(0, 0, 0, 0.2)',
//         transition: 'background 0.3s ease, transform 0.3s ease',
//         transform: isHovered ? 'scale(1.1)' : 'scale(1)',
//     };

//     const iconStyle = {
//         fontSize: '28px',
//         fill: '#4B5563',
//         transition: 'fill 0.3s ease',
//         ...(isHovered && { fill: '#1F2937' }),
//     };

//     // const labelStyle = {
//     //     marginLeft: '16px',
//     //     fontSize: '18px',
//     //     fontWeight: 'bold',
//     //     color: isHovered ? '#1F2937' : '#4B5563',
//     //     textTransform: 'capitalize',
//     //     transition: 'color 0.3s ease',
//     //     whiteSpace: 'nowrap',
//     //     display: isLoading ? 'none' : 'inline',
//     // };

//     const labelStyle = {
//     marginLeft: '16px',
//     fontSize: '18px',
//     fontWeight: 'bold',
//     color: isHovered ? '#1F2937' : '#4B5563',
//     textTransform: 'capitalize',
//     transition: 'color 0.3s ease',
//     display: '-webkit-box',
//     WebkitLineClamp: 2,
//     WebkitBoxOrient: 'vertical',
//     overflow: 'hidden',
//     textOverflow: 'ellipsis',
//     wordBreak: 'break-word',
//     maxWidth: '300px', // Adjust based on your needs
//     lineHeight: '1.4', // Controls the line height
//     maxHeight: 'calc(1.4em * 2)', // lineHeight * number of lines
// };

//     const spinnerStyle = {
//         border: '4px solid #f3f3f3',
//         borderTop: '4px solid #4B5563',
//         borderRadius: '50%',
//         width: '32px',
//         height: '32px',
//         animation: 'spin 1s linear infinite',
//         position: 'absolute',
//     };

//     return (
//         <>
//             <style>{`
//                 @keyframes spin {
//                     0% { transform: rotate(0deg); }
//                     100% { transform: rotate(360deg); }
//                 }
//             `}</style>
//             <button
//                 style={buttonStyle}
//                 onClick={handleClick}
//                 onMouseEnter={() => setIsHovered(true)}
//                 onMouseLeave={() => setIsHovered(false)}
//                 disabled={disabled || isLoading}
//             >
//                 {isLoading ? (
//                     <div style={spinnerStyle}></div>
//                 ) : (
//                     <>
//                         <section style={iconContainerStyle}>
//                             <Icon style={iconStyle} />
//                         </section>
//                         <span style={labelStyle}>{label}</span>
//                     </>
//                 )}
//             </button>
//         </>
//     );
// };

// export default ReportButton;











// import React, { useState } from 'react';
// import { ArrowUpRightIcon } from '@heroicons/react/24/outline';



// const ReportButton = ({ label, icon: Icon, onClick, loading = false, disabled = false }) => {

//     const [isHovered, setIsHovered] = useState(false);

//     const [isActive, setIsActive] = useState(false); // New state for click feedback

//     const [isLoading, setIsLoading] = useState(false);



//     const handleClick = async () => {

//         if (disabled || isLoading) return;



//         setIsLoading(true);

//         try {

//             // Keep your existing logic

//             await new Promise(resolve => setTimeout(resolve, 1000));

//             if (onClick) onClick();

//         } catch (err) {

//             console.error("Download failed", err);

//         } finally {

//             setIsLoading(false);

//         }

//     };



//     const buttonStyle = {

//         display: 'flex',

//         alignItems: 'center',

//         justifyContent: 'flex-start',

//         padding: '0 24px',

//         width: '400px',

//         height: '112px',

//         backgroundColor: isHovered ? '#f0faf5' : '#ffffff',

//         borderRadius: '16px', // Softer corners

//         border: 'none',

//         outline: 'none',

//         boxShadow: isHovered

//             ? '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'

//             : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',

//         cursor: disabled || isLoading ? 'not-allowed' : 'pointer',

//         transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',

//         transform: isActive ? 'scale(0.97)' : isHovered ? 'scale(1.02)' : 'scale(1)',

//         position: 'relative',

//         overflow: 'hidden',

//     };



//     const iconContainerStyle = {

//         display: 'flex',

//         justifyContent: 'center',

//         alignItems: 'center',

//         minWidth: '64px',

//         height: '64px',

//         borderRadius: '12px', // Squircle shape

//         background: isHovered

//             ? 'linear-gradient(135deg, #34d399 0%, #10b981 100%)'

//             : 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',

//         boxShadow: isHovered ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none',

//         transition: 'all 0.3s ease',

//         opacity: isLoading ? 0 : 1,

//     };



//     const iconStyle = {

//         fontSize: '28px',

//         color: isHovered ? '#ffffff' : '#4b5563',

//         transition: 'color 0.3s ease',

//     };



//     const labelStyle = {

//         marginLeft: '20px',

//         fontSize: '18px',

//         fontWeight: '600', // Semi-bold for a cleaner look

//         color: isHovered ? '#065f46' : '#374151',

//         textAlign: 'left',

//         transition: 'color 0.3s ease',

//         display: '-webkit-box',

//         WebkitLineClamp: 2,

//         WebkitBoxOrient: 'vertical',

//         overflow: 'hidden',

//         opacity: isLoading ? 0 : 1,

//     };



//     const loaderContainerStyle = {

//         position: 'absolute',

//         top: 0,

//         left: 0,

//         right: 0,

//         bottom: 0,

//         display: 'flex',

//         alignItems: 'center',

//         justifyContent: 'center',

//         background: 'rgba(255, 255, 255, 0.8)',

//     };



//     return (

//         <>

//             <style>{`

//                 @keyframes spin {

//                     0% { transform: rotate(0deg); }

//                     100% { transform: rotate(360deg); }

//                 }

//                 .spinner-inner {

//                     width: 32px;

//                     height: 32px;

//                     border: 3px solid #e5e7eb;

//                     border-top: 3px solid #10b981;

//                     border-radius: 50%;

//                     animation: spin 0.8s cubic-bezier(0.6, 0.4, 0.4, 0.6) infinite;

//                 }

//             `}</style>

//             <button

//                 style={buttonStyle}

//                 onClick={handleClick}

//                 onMouseDown={() => setIsActive(true)}

//                 onMouseUp={() => setIsActive(false)}

//                 onMouseEnter={() => setIsHovered(true)}

//                 onMouseLeave={() => {

//                     setIsHovered(false);

//                     setIsActive(false);

//                 }}

//                 disabled={disabled || isLoading}

//             >

//                 {isLoading && (

//                     <div style={loaderContainerStyle}>

//                         <div className="spinner-inner"></div>

//                     </div>

//                 )}

               

//                 <section style={iconContainerStyle}>

//                     <Icon style={iconStyle} size={28} />

//                 </section>

               

//                 <span style={labelStyle}>{label}</span>

               

//                 {/* Visual indicator for "interactive" feel */}

//                 <div style={{

//                     position: 'absolute',

//                     bottom: 0,

//                     left: 0,

//                     height: '4px',

//                     width: isHovered ? '100%' : '0%',

//                     backgroundColor: '#10b981',

//                     transition: 'width 0.3s ease'

//                 }} />

//             </button>

//         </>

//     );

// };



// export default ReportButton;














import React, { useState } from 'react';
import { ArrowUpRightIcon } from '@heroicons/react/24/outline';

const ReportButton = ({ label, icon: Icon, onClick, loading = false, disabled = false }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const showLoading = loading || isLoading;

    const handleClick = async () => {
        if (disabled || showLoading) return;
        if (onClick) {
            setIsLoading(true);
            try {
                await onClick();
            } catch (err) {
                console.error("Action failed", err);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const buttonStyle = {
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        // This math ensures 4 tabs per row with gaps
        flex: '1 1 calc(25% - 16px)', 
        minWidth: '180px',
        height: '70px', // Reduced height for "tab" feel
        background: isHovered 
            ? 'linear-gradient(135deg, #ffffff 0%, #fefce8 100%)' 
            : 'linear-gradient(135deg, #ffffff 0%, #faf9f5 100%)',
        borderRadius: '16px',
        border: '1px solid',
        borderColor: isHovered ? '#d1fae5' : '#e9ecef',
        outline: 'none',
        boxShadow: isHovered ? '0 8px 15px -3px rgba(0, 0, 0, 0.08)' : '0 2px 4px rgba(0,0,0,0.02)',
        cursor: disabled || showLoading ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        transform: isActive ? 'scale(0.97)' : 'scale(1)',
        position: 'relative',
        overflow: 'hidden',
    };

    const iconContainerStyle = {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '40px',
        height: '40px',
        minWidth: '40px',
        borderRadius: '10px',
        background: isHovered ? '#10b981' : '#f1f5f9',
        transition: 'all 0.3s ease',
    };

    return (
        <>
            <style>{`
                @keyframes spin-mini { 100% { transform: rotate(360deg); } }
                .spinner-mini {
                    width: 20px; height: 20px;
                    border: 2px solid #e2e8f0; border-top: 2px solid #10b981;
                    border-radius: 50%; animation: spin-mini 0.6s linear infinite;
                }
            `}</style>
            <button
                style={buttonStyle}
                onClick={handleClick}
                onMouseDown={() => setIsActive(true)}
                onMouseUp={() => setIsActive(false)}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                disabled={disabled || showLoading}
            >
                {showLoading ? (
                    <div style={{ margin: '0 auto' }} className="spinner-mini"></div>
                ) : (
                    <>
                        <div style={iconContainerStyle}>
                            {Icon && <Icon style={{ width: '20px', height: '20px', color: isHovered ? '#fff' : '#64748b' }} />}
                        </div>
                        <span style={{
                            marginLeft: '10px',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            color: isHovered ? '#065f46' : '#374151',
                            textAlign: 'left',
                            flex: 1,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}>{label}</span>
                        <ArrowUpRightIcon style={{ 
                            width: '14px', 
                            color: isHovered ? '#10b981' : '#cbd5e1',
                            marginLeft: '4px'
                        }} />
                    </>
                )}
            </button>
        </>
    );
};

export default ReportButton;