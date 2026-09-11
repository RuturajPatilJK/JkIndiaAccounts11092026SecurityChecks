import React, { useState, useEffect, useCallback } from "react";
import { Button } from "react-bootstrap";
import { Modal, Table, Box, Typography } from "@mui/material";
import axios from "axios";
import DataTableSearch from "../Common/HelpCommon/DataTableSearch";
import DataTablePagination from "../Common/HelpCommon/DataTablePagination";
import "../App.css";

const API_URL = process.env.REACT_APP_API;

var lActiveInputFeild = "";

const BrandGrainBalanceHelp = ({ onAcCodeClick, name, BrandCode, ItemNo, tabIndexHelp, disabledFeild, onTenderDetailsFetched, disabledFeild1 }) => {
    const [showModal, setShowModal] = useState(false);
    const [popupContent, setPopupContent] = useState([]);
    const [enteredItemNo, setenteredItemNo] = useState("");
    const [enteredBrandname, setenteredBrandname] = useState("");

    const [enteredItemId, setEnteredItemId] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [selectedRowIndex, setSelectedRowIndex] = useState(-1);
    const [apiDataFetched, setApiDataFetched] = useState(false);
    const CompanyCode = sessionStorage.getItem("Company_Code");
    const YearCode = sessionStorage.getItem("Year_Code");

    useEffect(() => {
        setenteredItemNo("");
        setenteredBrandname("");
        setEnteredItemId("");
        setPopupContent([]);
        setApiDataFetched(false);
        setSearchTerm("");
        setCurrentPage(1);
        setSelectedRowIndex(-1);
    }, [ItemNo]);

    const fetchData = useCallback(async () => {
        try {
            const response = await axios.get(`${API_URL}/BrandNO?CompanyCode=${CompanyCode}&ItemNo=${ItemNo}`);
            const data = response.data;

            setPopupContent(data);
            setApiDataFetched(true);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    });


    const fetchTenderDetails = async (ItemNo, BrandCode) => {
        try {

            const url = `${API_URL}/getItemNo_Data?CompanyCode=${CompanyCode}&ItemNo=${ItemNo}&BrandNo=${BrandCode}&Year_Code=${YearCode}`;
            const response = await axios.get(url);
            const details = response.data;
            onTenderDetailsFetched(details)
        } catch (error) {
            console.error("Error fetching tender details:", error);
        }
    };


    const fetchAndOpenPopup = async () => {
        await fetchData();
        setShowModal(true);
    };

    // const handleButtonClicked = () => {
    //     fetchAndOpenPopup();
    // };

    const handleButtonClicked = async () => {
        try {
            const response = await axios.get(`${API_URL}/BrandNO?CompanyCode=${CompanyCode}&ItemNo=${ItemNo}`);
        } catch (err) {
            console.error("Custom API error:", err);
        }

        fetchAndOpenPopup();
    };

    const handleCloseModal = () => {
        setShowModal(false);
    };

    const handleCodeChange = async (event) => {
        const { value } = event.target;
        setenteredItemNo(value);

        setEnteredItemId(value);

        if (!apiDataFetched) {
            await fetchData();
        }

        const matchingItem = popupContent.find((item) => item.Item_Code === parseInt(value, 10));

        if (matchingItem) {
            setenteredItemNo(matchingItem.Item_Code);
            setenteredBrandname(matchingItem.Brand_Name)
            setEnteredItemId(matchingItem.Brand_Code);
            fetchTenderDetails(matchingItem.Item_Code, matchingItem.Brand_Code)
            if (onAcCodeClick) {
                onAcCodeClick(matchingItem.Item_Code, matchingItem.Brand_Code);

            }
        } else {
            setenteredItemNo("");
            setEnteredItemId("");
            setenteredBrandname("");
        }
    };

    const handleRecordDoubleClick = (item) => {
        setenteredItemNo(item.Item_Code);
        setEnteredItemId(item.Brand_Code);
        setenteredBrandname(item.Brand_Name)
        
        fetchTenderDetails(item.Item_Code, item.Brand_Code)

        if (onAcCodeClick) {
            onAcCodeClick(item.Item_Code, item.Brand_Code);
        }
        setShowModal(false);
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    const handleSearch = (searchValue) => {
        setSearchTerm(searchValue);
    };

    // const filteredData = popupContent.filter((item) =>
    //     item.buyername && item.buyername.toLowerCase().includes(searchTerm.toLowerCase())
    // );

    const filteredData = popupContent.filter((item) =>
        Object.values(item).some(
            (val) =>
                val &&
                val.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const itemsToDisplay = filteredData.slice(startIndex, endIndex);

    useEffect(() => {
        if (ItemNo === "" || BrandCode === "") {
            setenteredItemNo("");
            setEnteredItemId("");
            setenteredBrandname("");
        } else {
            setenteredItemNo(ItemNo);
            setEnteredItemId(BrandCode);
            
        }
    }, [ItemNo, BrandCode]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === "F1") {
                if (event.target.id === name) {
                    lActiveInputFeild = name;
                    fetchAndOpenPopup();
                    event.preventDefault();
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [name, fetchAndOpenPopup]);

    useEffect(() => {
        const handleKeyNavigation = (event) => {
            if (showModal) {
                if (event.key === "ArrowUp") {
                    event.preventDefault();
                    setSelectedRowIndex((prev) => Math.max(prev - 1, 0));
                } else if (event.key === "ArrowDown") {
                    event.preventDefault();
                    setSelectedRowIndex((prev) => Math.min(prev + 1, itemsToDisplay.length - 1));
                } else if (event.key === "Enter") {
                    event.preventDefault();
                    if (selectedRowIndex >= 0) {
                        handleRecordDoubleClick(itemsToDisplay[selectedRowIndex]);
                    }
                }
            }
        };

        window.addEventListener("keydown", handleKeyNavigation);

        return () => {
            window.removeEventListener("keydown", handleKeyNavigation);
        };
    }, [showModal, selectedRowIndex, itemsToDisplay, handleRecordDoubleClick]);

    return (
        <div className="d-flex flex-row">
            <div className="d-flex">
                <div className="d-flex">
                    <input
                        type="label"
                        className="form-control ms-2"
                        id={name}
                        autoComplete="off"
                        value={enteredItemId}
                        onChange={handleCodeChange}
                        style={{ width: "100px", height: "35px" }}
                        tabIndex={tabIndexHelp}
                        disabled={disabledFeild}
                    />
                    <Button
                        variant="primary"
                        onClick={handleButtonClicked}
                        className="ms-1"
                        style={{ width: "30px", height: "35px" }}
                        disabled={disabledFeild1}
                    >
                        ...
                    </Button>
                    <label
                        htmlFor={name}
                        className="form-control ms-2"
                        style={{
                        width: "200px",
                        height: "35px",
                        lineHeight: "35px",
                        backgroundColor: "#f5f5f5"
                        }}
                    >
                        {enteredBrandname || ""}
                    </label>
                </div>
            </div>

            <Modal
                open={showModal}
                onClose={handleCloseModal}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Box sx={{
                    bgcolor: 'background.paper',
                    boxShadow: 24,
                    p: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    width: '95vw',
                    maxWidth: 'none !important',
                    height: '90vh',
                    maxHeight: 'none !important',
                }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" component="h2">
                            Balance Detail
                        </Typography>
                        <Button onClick={handleCloseModal}>
                            X
                        </Button>
                    </Box>

                    <DataTableSearch data={popupContent} onSearch={handleSearch} />

                    <Box sx={{ overflowX: 'auto', mt: 2, flexGrow: 1 }}>
                        {Array.isArray(popupContent) ? (
                            <Table className="custom-table" sx={{ width: '100%', tableLayout: 'auto' }}>
                                <thead>
                                    <tr>
                                        <th style={{ whiteSpace: 'nowrap' }}>Item Code</th>
                                        <th style={{ whiteSpace: 'nowrap' }}>Brand Code</th>
                                        <th style={{ whiteSpace: 'nowrap' }}>Brand Name</th>
                                        <th style={{ whiteSpace: 'nowrap' }}>Wt_per</th>
                                        <th style={{ whiteSpace: 'nowrap' }}>qty</th>
                                        <th style={{ whiteSpace: 'nowrap' }}>sold</th>
                                        <th style={{ whiteSpace: 'nowrap' }}>BALANCE</th>
                                        <th style={{ whiteSpace: 'nowrap' }}>Year_Code</th>
                                        <th style={{ whiteSpace: 'nowrap' }}>Rate</th>
                                       
                                    </tr>
                                </thead>
                                <tbody>
                                    {itemsToDisplay.map((item, index) => (
                                        <tr
                                            key={index}
                                            className={selectedRowIndex === index ? 'selected-row' : ''}
                                            style={{
                                                cursor: 'pointer',
                                                backgroundColor: selectedRowIndex === index ? '#f3f388' : 'white',
                                            }}
                                            onDoubleClick={() => handleRecordDoubleClick(item)}
                                            onMouseEnter={() => setSelectedRowIndex(index)}
                                        >
                                            <td style={{ whiteSpace: 'nowrap' }}>{item.Item_Code}</td>
                                            <td style={{ whiteSpace: 'nowrap' }}>{item.Brand_Code}</td>
                                            <td style={{ whiteSpace: 'nowrap' }}>{item.Brand_Name}</td>
                                            <td style={{ whiteSpace: 'nowrap' }}>{item.Wt_per}</td>
                                            <td style={{ whiteSpace: 'nowrap' }}>{item.qty}</td>
                                            <td style={{ whiteSpace: 'nowrap' }}>{item.sold}</td>
                                            <td style={{ whiteSpace: 'nowrap' }}>{item.balance}</td>
                                            <td style={{ whiteSpace: 'nowrap' }}>{item.Year_Code}</td>
                                            <td style={{ whiteSpace: 'nowrap' }}>{item.Rate}</td>
                                            
                                            
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        ) : (
                            'Loading...'
                        )}
                    </Box>

                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <DataTablePagination
                            totalItems={filteredData.length}
                            itemsPerPage={itemsPerPage}
                            onPageChange={handlePageChange}
                        />
                    </Box>
                </Box>
            </Modal>
        </div>
    );
};

export default BrandGrainBalanceHelp
