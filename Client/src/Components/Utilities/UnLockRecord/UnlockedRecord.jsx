import React, { useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { FaUnlock, FaSearch, FaInfoCircle, FaSpinner } from 'react-icons/fa';

const API_URL = process.env.REACT_APP_API;

function UnlockedRecord() {
    const [docNo, setDocNo] = useState('');
    const [searchType, setSearchType] = useState('delivery');
    const [isLoading, setIsLoading] = useState(false);
    const [recentUnlocks, setRecentUnlocks] = useState([]);

    const companyCode = sessionStorage.getItem('Company_Code');
    const yearCode = sessionStorage.getItem('Year_Code');

    const validateInputs = () => {
        if (!docNo || !companyCode || !yearCode) {
            Swal.fire({
                icon: 'warning',
                title: 'Missing Data',
                text: 'All values are required (Document/Tender Number, Company Code, Year Code).',
            });
            return false;
        }
        return true;
    };

    // const handleUnlock = async () => {
    //     if (!validateInputs()) return;

    //     setIsLoading(true);

    //     try {
    //         const endpoint = searchType === 'delivery'
    //             ? '/unlock-delivery-order'
    //             : '/unlock-tender-purchase';

    //         const params = {
    //             [searchType === 'delivery' ? 'doc_no' : 'Tender_No']: docNo,
    //             company_code: companyCode,
    //             year_code: yearCode,
    //         };

    //         const response = await axios.put(`${API_URL}${endpoint}`, null, { params });

    //         setRecentUnlocks(prev => [
    //             {
    //                 type: searchType === 'delivery' ? 'Delivery Order' : 'Tender',
    //                 number: docNo,
    //                 timestamp: new Date().toLocaleString(),
    //             },
    //             ...prev.slice(0, 4)
    //         ]);

    //         Swal.fire({
    //             icon: 'success',
    //             title: 'Success!',
    //             text: response.data.message || `${searchType === 'delivery' ? 'Delivery Order' : 'Tender'} unlocked successfully!`,
    //             timer: 2000,
    //             timerProgressBar: true,
    //         });

    //         setDocNo('');
    //     } catch (error) {
    //         console.error(`Error unlocking ${searchType}:`, error);
    //         Swal.fire({
    //             icon: 'error',
    //             title: 'Unlock Failed',
    //             text: error.response?.data?.error || `Failed to unlock ${searchType === 'delivery' ? 'delivery order' : 'tender'}`,
    //         });
    //     } finally {
    //         setIsLoading(false);
    //     }
    // };



    const handleUnlock = async () => {
    if (!validateInputs()) return;

    setIsLoading(true);

    try {
        const endpoint = searchType === 'delivery'
            ? '/unlock-delivery-order'
            : '/unlock-tender-purchase';

        // Convert comma-separated values to array of numbers
        const docNumbers = docNo
            .split(',')
            .map(num => parseInt(num.trim(), 10))
            .filter(num => !isNaN(num));

        if (docNumbers.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Invalid Input',
                text: 'Please enter at least one valid number.',
            });
            setIsLoading(false);
            return;
        }

        // Build query string manually
        const queryParams = new URLSearchParams();
        docNumbers.forEach(num => queryParams.append(
            searchType === 'delivery' ? 'doc_no' : 'Tender_No', num
        ));
        queryParams.append('company_code', companyCode);
        queryParams.append('year_code', yearCode);

        const response = await axios.put(
            `${API_URL}${endpoint}?${queryParams.toString()}`
        );

        // Add to recent unlocks list
        setRecentUnlocks(prev => [
            {
                type: searchType === 'delivery' ? 'Delivery Order' : 'Tender',
                number: docNo,
                timestamp: new Date().toLocaleString(),
            },
            ...prev.slice(0, 4)
        ]);

        Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: response.data.message || `${searchType === 'delivery' ? 'Delivery Order' : 'Tender'} unlocked successfully!`,
            timer: 2000,
            timerProgressBar: true,
        });

        setDocNo('');
    } catch (error) {
        console.error(`Error unlocking ${searchType}:`, error);
        Swal.fire({
            icon: 'error',
            title: 'Unlock Failed',
            text: error.response?.data?.error || `Failed to unlock ${searchType === 'delivery' ? 'delivery order' : 'tender'}`,
        });
    } finally {
        setIsLoading(false);
    }
};

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleUnlock();
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <div style={styles.header}>
                    <FaUnlock size={24} style={styles.icon} />
                    <h2 style={styles.title}>Unlock Records</h2>
                </div>

                <div style={styles.tabs}>
                    <button
                        onClick={() => setSearchType('delivery')}
                        style={{
                            ...styles.tabButton,
                            ...(searchType === 'delivery' ? styles.activeTab : {})
                        }}
                    >
                        Delivery Order
                    </button>
                    <button
                        onClick={() => setSearchType('tender')}
                        style={{
                            ...styles.tabButton,
                            ...(searchType === 'tender' ? styles.activeTab : {})
                        }}
                    >
                        Tender Purchase
                    </button>
                </div>

                <div style={styles.inputContainer}>
                    <div style={styles.inputGroup}>
                        <input
                          type="text" 
                            placeholder={`Enter ${searchType === 'delivery' ? 'Delivery Order ' : 'Tender'} Number`}
                            value={docNo}
                            onChange={(e) => setDocNo(e.target.value)}
                            onKeyPress={handleKeyPress}
                            style={styles.input}
                            disabled={isLoading}
                        />
                        <button
                            onClick={handleUnlock}
                            style={styles.searchButton}
                            disabled={isLoading || !docNo}
                        >
                            {isLoading ? <FaSpinner className="spin" /> : <FaSearch />}
                        </button>
                    </div>
                </div>

                <div style={styles.infoBox}>
                    <FaInfoCircle style={styles.infoIcon} />
                    <p style={styles.infoText}>
                        {searchType === 'delivery'
                            ? 'Enter the delivery Order to unlock it for editing.'
                            : 'Enter the Tender Purchase to unlock it for modifications.'}
                    </p>
                </div>

                {recentUnlocks.length > 0 && (
                    <div style={styles.recentUnlocks}>
                        <h4 style={styles.recentTitle}>Recently Unlocked</h4>
                        <ul style={styles.recentList}>
                            {recentUnlocks.map((item, index) => (
                                <li key={index} style={styles.recentItem}>
                                    <span style={styles.recentType}>{item.type}</span>
                                    <span style={styles.recentNumber}>#{item.number}</span>
                                    <span style={styles.recentTime}>{item.timestamp}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}

const styles = {
    container: {
        minHeight: '50vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f7fa',
        padding: '20px',
    },
    card: {
        backgroundColor: '#fff',
        padding: '30px',
        borderRadius: '12px',
        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '500px',
        textAlign: 'center',
        transition: 'all 0.3s ease',
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '25px',
    },
    icon: {
        marginRight: '10px',
        color: '#4a6bdf',
    },
    title: {
        margin: 0,
        color: '#333',
        fontSize: '24px',
        fontWeight: '600',
    },
    tabs: {
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '20px',
        gap: '10px',
    },
    tabButton: {
        padding: '8px 16px',
        fontSize: '14px',
        backgroundColor: '#f0f0f0',
        color: '#555',
        border: 'none',
        borderRadius: '20px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
    },
    activeTab: {
        backgroundColor: '#4a6bdf',
        color: '#fff',
        fontWeight: '500',
    },
    inputContainer: {
        marginBottom: '20px',
    },
    inputGroup: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    input: {
        padding: '12px 15px',
        fontSize: '16px',
        borderRadius: '6px 0 0 6px',
        border: '1px solid #ddd',
        width: '70%',
        outline: 'none',
        transition: 'border 0.3s',
    },
    searchButton: {
        padding: '12px 15px',
        fontSize: '16px',
        backgroundColor: '#4a6bdf',
        color: '#fff',
        border: 'none',
        borderRadius: '0 6px 6px 0',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background-color 0.3s',
    },
    infoBox: {
        display: 'flex',
        alignItems: 'center',
        backgroundColor: '#f8f9fe',
        padding: '12px',
        borderRadius: '6px',
        marginBottom: '20px',
    },
    infoIcon: {
        color: '#4a6bdf',
        marginRight: '10px',
        flexShrink: 0,
    },
    infoText: {
        margin: 0,
        color: '#555',
        fontSize: '14px',
        textAlign: 'left',
    },
    recentUnlocks: {
        marginTop: '25px',
        borderTop: '1px solid #eee',
        paddingTop: '15px',
    },
    recentTitle: {
        margin: '0 0 10px 0',
        color: '#555',
        fontSize: '16px',
    },
    recentList: {
        listStyle: 'none',
        padding: 0,
        margin: 0,
    },
    recentItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 0',
        borderBottom: '1px solid #f0f0f0',
    },
    recentType: {
        fontWeight: '500',
        color: '#333',
        fontSize: '14px',
    },
    recentNumber: {
        color: '#4a6bdf',
        fontWeight: '500',
    },
    recentTime: {
        color: '#888',
        fontSize: '12px',
    },
    '@keyframes spin': {
        from: { transform: 'rotate(0deg)' },
        to: { transform: 'rotate(360deg)' },
    },
    spin: {
        animation: '$spin 1s linear infinite',
    },
};

export default UnlockedRecord;
