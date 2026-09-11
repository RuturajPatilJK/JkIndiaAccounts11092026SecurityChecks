import React, { useState, useEffect } from "react";
import { Typography, FormControl, InputLabel, Select, MenuItem, CircularProgress } from "@mui/material";
import "./DayBook.css";

const DayBook = () => {
    const [acCode, setAcCode] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [filterType, setFilterType] = useState("All");

    const [loading, setLoading] = useState(false);
    const [balance, setBalance] = useState(0);
    const [error, setError] = useState(null);

    useEffect(() => {
        const currentDate = new Date().toISOString().split('T')[0];
        setFromDate(currentDate);
        setToDate(currentDate);
    }, []);

    const isValidDateRange = () => {
        const from = new Date(fromDate);
        const to = new Date(toDate);
        const timeDifference = to - from;
        const daysDifference = timeDifference / (1000 * 3600 * 24);

        if (from.getMonth() !== to.getMonth() || from.getFullYear() !== to.getFullYear()) {
            return "The date range cannot exceed 30 days!";
        }

        if (daysDifference > 30) {
            return "The date range cannot exceed 30 days!";
        }
        return null;
    };

    // Handle dropdown filter change
    const handleFilterChange = (e) => {
        setFilterType(e.target.value);
    };

    // Day Report onClick
    const handleGetDayBook = (e) => {
        e.preventDefault();
        const errorMessage = isValidDateRange();
        if (errorMessage) {
            alert(errorMessage);
            return;
        }

        setLoading(true);
        setTimeout(() => {
            const url = `/daybook-report?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&filterType=${encodeURIComponent(filterType)}`;
            window.open(url, '_blank', 'toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=800,height=600');
            setLoading(false);
        }, 500);
    };

    return (
        <div className="bankBook-container">
            <div className="bankBook-card">
                <Typography variant="h6"
                    component="h1"
                    gutterBottom
                    sx={{
                        textAlign: 'center',
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        color: '#2c3e50',
                        marginBottom: '30px',
                        padding: '12px 0',
                        position: 'relative',
                        '&::after': {
                            content: '""',
                            position: 'absolute',
                            bottom: '0',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '80px',
                            height: '4px',
                            background: 'linear-gradient(90deg, #3498db, #2ecc71)',
                            borderRadius: '2px',
                            animation: 'underlineGrow 0.5s ease-out forwards'
                        },
                        '@keyframes underlineGrow': {
                            '0%': { width: '0' },
                            '100%': { width: '80px' }
                        }
                    }}>
                    Day Book Report
                </Typography>
                <form>
                    <div>
                        <FormControl fullWidth variant="outlined" sx={{ width: "140px", marginLeft: "5px" }}>
                            <InputLabel>Transaction Type</InputLabel>
                            <Select
                                value={filterType}
                                onChange={handleFilterChange}
                                label="Transaction Type"
                                size="small"
                            >
                                <MenuItem value="All">All</MenuItem>
                                <MenuItem value="BP">BP</MenuItem>
                                <MenuItem value="BR">BR</MenuItem>
                                <MenuItem value="UI">UI</MenuItem>
                                <MenuItem value="CP">CP</MenuItem>
                                <MenuItem value="JV">JV</MenuItem>
                                <MenuItem value="PS">PS</MenuItem>
                                <MenuItem value="SB">SB</MenuItem>
                                <MenuItem value="DO">DO</MenuItem>
                                <MenuItem value="LV">LV</MenuItem>
                                <MenuItem value="CV">CV</MenuItem>
                                <MenuItem value="DF">DF</MenuItem>
                                <MenuItem value="DN">DN</MenuItem>
                                <MenuItem value="CN">CN</MenuItem>
                                <MenuItem value="CR">CR</MenuItem>
                                <MenuItem value="RB">RB</MenuItem>
                                <MenuItem value="DS">DS</MenuItem>
                                <MenuItem value="PR">PR</MenuItem>
                                <MenuItem value="CS">CS</MenuItem>
                                <MenuItem value="XP">XP</MenuItem>
                                <MenuItem value="OP">OP</MenuItem>
                            </Select>
                        </FormControl>
                    </div>
                    <div className="dayBookDiv">
                        <div className="bankBookform-group">
                            <label htmlFor="fromDate" className="bankBookform-label">
                                From Date:
                            </label>
                            <input
                                type="date"
                                id="fromDate"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                            />
                        </div>
                        <div className="bankBookform-group">
                            <label htmlFor="toDate" className="bankBookform-label">
                                To Date:
                            </label>
                            <input
                                type="date"
                                id="toDate"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <button className="submit-button" onClick={handleGetDayBook} disabled={loading}>
                        {loading ? <CircularProgress size={24} /> : "DAY BOOK"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default DayBook;
