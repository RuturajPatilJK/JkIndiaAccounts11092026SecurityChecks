import React, { useState, useEffect, useCallback } from "react";
import { Button } from "react-bootstrap";
import axios from "axios";
import DataTableSearch from "../Common/HelpCommon/DataTableSearch";
import DataTablePagination from "../Common/HelpCommon/DataTablePagination";
import "../App.css";
import { Modal, Table, Box, Typography } from "@mui/material";

const CompanyCode = sessionStorage.getItem("Company_Code");
const YearCode = sessionStorage.getItem("Year_Code");
var lActiveInputFeild = "";
const API_URL = process.env.REACT_APP_API;

const CarporateHelp = ({ onAcCodeClick, name, Carporate_no, tabIndexHelp, disabledFeild, onTenderDetailsFetched}) => {
    const [showModal, setShowModal] = useState(false);
    const [popupContent, setPopupContent] = useState([]);
    const [enteredTenderno, setenteredTenderno] = useState("");
    const [enteredTenderid, setEnteredTenderid] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [selectedRowIndex, setSelectedRowIndex] = useState(-1);
    const [apiDataFetched, setApiDataFetched] = useState(false);

    const fetchData = useCallback(async () => {
        
        try {
            const response = await axios.get(`${API_URL}/carporateno?CompanyCode=${CompanyCode}`);
            const data = response.data;
            
            setPopupContent(data);
            setApiDataFetched(true);
           
           

        } catch (error) {
            console.error("Error fetching data:", error);
        }
    });

    const fetchCarporateDetails = async (carporateNo) => {
        try {
            
            const url = `${API_URL}/getCarporateData?CompanyCode=${CompanyCode}&Carporate_no=${carporateNo}&Year_Code=${YearCode}`;
            const response = await axios.get(url);
            const details = response.data;
            onTenderDetailsFetched(details)
    
            // Optionally update state or perform additional actions with these details
        } catch (error) {
            console.error("Error fetching Carporate details:", error);
        }
    };
    

    const fetchAndOpenPopup = async () => {
        
        if (!apiDataFetched) {
            await fetchData();

        }
        setShowModal(true);
    };

    const handleButtonClicked = () => {
        fetchAndOpenPopup();
        if(onAcCodeClick)
            {
                onAcCodeClick(enteredTenderno)
            }
    };

    const handleCloseModal = () => {
        setShowModal(false);
    };

    const handleCodeChange = async (event) => {
        const { value } = event.target;
        setenteredTenderno(value);
    


        if (!apiDataFetched) {
            await fetchData();
        }

        const matchingItem = popupContent.find((item) => item.Doc_No === parseInt(value, 10));

        if (matchingItem) {
            setenteredTenderno(matchingItem.Doc_No);
            
            fetchCarporateDetails(matchingItem.Doc_No)
            if (onAcCodeClick) {
                onAcCodeClick(matchingItem.Doc_No);
               
            }
        } else {
            setenteredTenderno("");
        }
    };

    const handleRecordDoubleClick = (item) => {
        
        setenteredTenderno(item.Doc_No);
        
         fetchCarporateDetails(item.Doc_No)
       
        if (onAcCodeClick) {
            onAcCodeClick(item.Doc_No);
        }
        setShowModal(false);
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    const handleSearch = (searchValue) => {
        setSearchTerm(searchValue);
    };

    const filteredData = popupContent.filter((item) =>
        item.carporatepartyaccountname && item.carporatepartyaccountname.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const itemsToDisplay = filteredData.slice(startIndex, endIndex);

     useEffect(() => {
                if (Carporate_no === "") {
                    setenteredTenderno("");
                    setEnteredTenderid("");
                } else {
                    setenteredTenderno(Carporate_no);
                }
            }, [Carporate_no]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === "F1") {
                if (event.target.id === name) {
                    lActiveInputFeild = name;
                    setSearchTerm(event.target.value);
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
                        type="text"
                        className="form-control ms-2"
                        id={name}
                        autoComplete="off"
                        value={enteredTenderno}
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
                        disabled={disabledFeild}
                    >
                        ...
                    </Button>
                    <input
                        type="text"
                        className="form-control ms-2"
                        id={name}
                        autoComplete="off"
                        value={enteredTenderid}
                        onChange={handleCodeChange}
                        style={{ width: "92px", height: "35px" }}
                        tabIndex={tabIndexHelp}
                        disabled={disabledFeild}
                    />
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
                            Tender Detail
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
                                        <th style={{ whiteSpace: 'nowrap' }}>Doc_No</th>
                                        <th style={{ whiteSpace: 'nowrap' }}>Doc_Date</th>
                                        <th style={{ whiteSpace: 'nowrap' }}>partyName</th>
                                        <th style={{ whiteSpace: 'nowrap' }}>UnitName</th>
                                        <th style={{ whiteSpace: 'nowrap' }}>sell_rate</th>
                                        <th style={{ whiteSpace: 'nowrap' }}>Po_Details</th>
                                        <th style={{ whiteSpace: 'nowrap' }}>Buyer quantal</th>
                                        
                                        <th style={{ whiteSpace: 'nowrap' }}>DESPATCH</th>
                                        <th style={{ whiteSpace: 'nowrap' }}>BALANCE</th>
                                        <th style={{ whiteSpace: 'nowrap' }}>selling_type</th>
                                       
                                    </tr>
                                </thead>
                                <tbody>
                                    {itemsToDisplay.map((item, index) => {
                                        const isDisabled = item.ID === 1 || item.ID === "1";
                                        return (
                                            <tr
                                                key={index}
                                                className={selectedRowIndex === index && !isDisabled ? 'selected-row' : ''}
                                                style={{
                                                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                                                    backgroundColor: isDisabled 
                                                        ? '#f0f0f0' 
                                                        : (selectedRowIndex === index ? '#f3f388' : 'white'),
                                                    opacity: isDisabled ? 0.7 : 1
                                                }}
                                                onDoubleClick={() => !isDisabled && handleRecordDoubleClick(item)}
                                                onMouseEnter={() => !isDisabled && setSelectedRowIndex(index)}
                                            >
                                                <td style={{ whiteSpace: 'nowrap' }}>{item.Doc_No}</td>
                                                <td style={{ whiteSpace: 'nowrap' }}>{item.doc_dateConverted}</td>
                                                <td style={{ whiteSpace: 'nowrap' }}>{item.carporatepartyaccountname}</td>
                                                <td style={{ whiteSpace: 'nowrap' }}>{item.carporatepartyunitname}</td>
                                                <td style={{ whiteSpace: 'nowrap' }}>{item.sell_rate}</td>
                                                <td style={{ whiteSpace: 'nowrap' }}>{item.pono}</td>
                                                <td style={{ whiteSpace: 'nowrap' }}>{item.quantal}</td>
                                                <td style={{ whiteSpace: 'nowrap' }}>{item.dispatched}</td>
                                                <td style={{ whiteSpace: 'nowrap' }}>{item.balance}</td>
                                                <td style={{ whiteSpace: 'nowrap' }}>{item.selling_type}</td>
                                            </tr>
                                        );
                                    })}
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

export default CarporateHelp;

