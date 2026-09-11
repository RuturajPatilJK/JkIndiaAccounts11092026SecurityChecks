import React, { useState, useEffect, useCallback } from "react";
import { Button } from "react-bootstrap";
import { Modal, Table, Box, Typography } from "@mui/material";
import axios from "axios";
import DataTableSearch from "../Common/HelpCommon/DataTableSearch";
import DataTablePagination from "../Common/HelpCommon/DataTablePagination";
import "../App.css";

const API_URL = process.env.REACT_APP_API;
const EBUY_SUGAR_AC_CODE = process.env.REACT_APP_EBUY_SUGAR_AC_CODE;

var lActiveInputFeild = "";

const isPurcnoRowDisabled = (item) =>
    item.ID === 1 || item.ID === "1" ||
    (EBUY_SUGAR_AC_CODE && String(item.Buyer) === String(EBUY_SUGAR_AC_CODE));

const PurcnoHelp = ({ onAcCodeClick, name, Tenderid, Tenderno, tabIndexHelp, disabledFeild, Millcode, onTenderDetailsFetched, disabledFeild1 }) => {
    const [showModal, setShowModal] = useState(false);
    const [popupContent, setPopupContent] = useState([]);
    const [enteredTenderno, setenteredTenderno] = useState("");
    const [enteredTenderid, setEnteredTenderid] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [selectedRowIndex, setSelectedRowIndex] = useState(-1);
    const [apiDataFetched, setApiDataFetched] = useState(false);
    const CompanyCode = sessionStorage.getItem("Company_Code");
    const YearCode = sessionStorage.getItem("Year_Code");

    useEffect(() => {
        setenteredTenderno("");
        setEnteredTenderid("");
        setPopupContent([]);
        setApiDataFetched(false);
        setSearchTerm("");
        setCurrentPage(1);
        setSelectedRowIndex(-1);
    }, [Millcode]);

    const fetchData = useCallback(async () => {
        try {
            const response = await axios.get(`${API_URL}/purchno?CompanyCode=${CompanyCode}&MillCode=${Millcode}`);
            const data = response.data;

            setPopupContent(data);
            setApiDataFetched(true);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    }, [CompanyCode, Millcode]);

    const fetchTenderDetails = async (tenderNo, tenderId) => {
        try {
            const url = `${API_URL}/getTenderNo_Data?CompanyCode=${CompanyCode}&Tender_No=${tenderNo}&ID=${tenderId}&Year_Code=${YearCode}`;
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

    const handleButtonClicked = async () => {
        try {
            await axios.get(`${API_URL}/purchno?CompanyCode=${CompanyCode}&MillCode=${Millcode}`);
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
        setenteredTenderno(value);
        setEnteredTenderid(value);

        if (!apiDataFetched) {
            await fetchData();
        }

        const matchingItem = popupContent.find((item) => item.Tender_No === parseInt(value, 10));

        if (matchingItem) {
            setenteredTenderno(matchingItem.Tender_No);
            setEnteredTenderid(matchingItem.ID);
            fetchTenderDetails(matchingItem.Tender_No, matchingItem.ID)
            if (onAcCodeClick) {
                onAcCodeClick(matchingItem.Tender_No, matchingItem.ID);
            }
        } else {
            setenteredTenderno("");
            setEnteredTenderid("");
        }
    };

    const handleRecordDoubleClick = (item) => {
        // Prevent action if ID is 1, or this is the eBuy Sugar account's own entry
        if (isPurcnoRowDisabled(item)) return;

        setenteredTenderno(item.Tender_No);
        setEnteredTenderid(item.ID);
        fetchTenderDetails(item.Tender_No, item.ID)

        if (onAcCodeClick) {
            onAcCodeClick(item.Tender_No, item.ID);
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
        if (Tenderno === "" || Tenderid === "") {
            setenteredTenderno("");
            setEnteredTenderid("");
        } else {
            setenteredTenderno(Tenderno);
            setEnteredTenderid(Tenderid)
        }
    }, [Tenderno, Tenderid]);

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
                        const selectedItem = itemsToDisplay[selectedRowIndex];
                        if (!isPurcnoRowDisabled(selectedItem)) {
                            handleRecordDoubleClick(selectedItem);
                        }
                    }
                }
            }
        };

        window.addEventListener("keydown", handleKeyNavigation);
        return () => {
            window.removeEventListener("keydown", handleKeyNavigation);
        };
    }, [showModal, selectedRowIndex, itemsToDisplay]);

    return (
        <div className="d-flex flex-row" style={{ gap: "5px" }}>
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
                        disabled={disabledFeild1}
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
                <Box
                    sx={{
                        bgcolor: "background.paper",
                        boxShadow: 24,
                        p: 2,
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden",

                        width: {
                            xs: "100vw",
                            sm: "95vw",
                            md: "90vw"
                        },

                        height: {
                            xs: "100vh",
                            sm: "90vh"
                        },

                        borderRadius: {
                            xs: 0,
                            sm: 2
                        }
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            mb: 2,
                            position: "relative",
                            justifyContent: {
                                xs: "center",
                                md: "center"
                            }
                        }}
                    >
                        <Typography
                            variant="h6"
                            component="h2"
                            sx={{
                                textAlign: "center",
                                width: "100%"
                            }}
                        >
                            Tender Detail
                        </Typography>

                        <Button
                            onClick={handleCloseModal}
                            sx={{
                                position: "absolute",
                                right: 0
                            }}
                        >
                            X
                        </Button>
                    </Box>


                    <DataTableSearch data={popupContent} onSearch={handleSearch} />

                    <Box

                        sx={{
                            overflowX: "auto",
                            overflowY: "auto",
                            mt: 2,
                            flexGrow: 1,
                            width: "100%"
                        }}
                    >

                        {Array.isArray(popupContent) ? (
                            <Table
                                className="custom-table"
                                sx={{
                                    minWidth: "1200px",
                                    width: "max-content",
                                    tableLayout: "auto",
                                    fontSize: { xs: "10px", sm: "12px", md: "14px" }
                                }}
                            >
                                <thead>
                                    <tr>
                                        <th style={{ whiteSpace: 'nowrap' }}>Tender No</th>
                                        <th style={{ whiteSpace: 'nowrap' }}>Tender Date</th>
                                        <th style={{ whiteSpace: 'nowrap' }}>Party2</th>
                                        <th style={{ whiteSpace: 'nowrap' }}>Party</th>
                                        <th style={{ whiteSpace: 'nowrap' }}>Mill Rate</th>
                                        <th style={{ whiteSpace: 'nowrap' }}>Grade</th>
                                        <th style={{ whiteSpace: 'nowrap' }}>Sale Rate</th>
                                        <th style={{ whiteSpace: 'nowrap' }}>Buyer Quintal</th>
                                        <th style={{ whiteSpace: 'nowrap' }}>DESPATCH</th>
                                        <th style={{ whiteSpace: 'nowrap' }}>BALANCE</th>
                                        <th style={{ whiteSpace: 'nowrap' }}>DO Name</th>
                                        <th style={{ whiteSpace: 'nowrap' }}>Lifting Date</th>
                                        <th style={{ whiteSpace: 'nowrap' }}>ID</th>
                                        <th style={{ whiteSpace: 'nowrap' }}>Tender Detail ID</th>
                                        <th style={{ whiteSpace: 'nowrap' }}>Tender ID</th>
                                        <th style={{ whiteSpace: 'nowrap' }}>Delivery Type</th>
                                        <th style={{ whiteSpace: 'nowrap' }}>Ship To Name</th>
                                        <th style={{ whiteSpace: 'nowrap' }}>Tender Do ShortName</th>
                                        <th style={{ whiteSpace: 'nowrap' }}>Season</th>
                                        <th style={{ whiteSpace: 'nowrap' }}>Party Bill Rate</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {itemsToDisplay.map((item, index) => {
                                        const isDisabled = isPurcnoRowDisabled(item);
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
                                                // onClick={() => !isDisabled && handleRecordDoubleClick(item)}

                                                onMouseEnter={() => !isDisabled && setSelectedRowIndex(index)}
                                            >
                                                <td style={{ whiteSpace: 'nowrap' }}>{item.Tender_No}</td>
                                                <td style={{ whiteSpace: 'nowrap' }}>{item.Tender_DateConverted}</td>
                                                <td style={{ whiteSpace: 'nowrap' }}>{item.buyername}</td>
                                                <td style={{ whiteSpace: 'nowrap' }}>{item.buyerpartyname}</td>
                                                <td style={{ whiteSpace: 'nowrap' }}>{item.Mill_Rate}</td>
                                                <td style={{ whiteSpace: 'nowrap' }}>{item.Grade}</td>
                                                <td style={{ whiteSpace: 'nowrap' }}>{item.Sale_Rate}</td>
                                                <td style={{ whiteSpace: 'nowrap' }}>{item.Buyer_Quantal}</td>
                                                <td style={{ whiteSpace: 'nowrap' }}>{item.DESPATCH}</td>
                                                <td style={{ whiteSpace: 'nowrap' }}>{item.BALANCE}</td>
                                                <td style={{ whiteSpace: 'nowrap' }}>{item.tenderdoname}</td>
                                                <td style={{ whiteSpace: 'nowrap' }}>{item.Lifting_DateConverted}</td>
                                                <td style={{ whiteSpace: 'nowrap' }}>{item.ID}</td>
                                                <td style={{ whiteSpace: 'nowrap' }}>{item.tenderdetailid}</td>
                                                <td style={{ whiteSpace: 'nowrap' }}>{item.tenderid}</td>
                                                <td style={{ whiteSpace: 'nowrap' }}>{item.Delivery_Type}</td>
                                                <td style={{ whiteSpace: 'nowrap' }}>{item.shiptoname}</td>
                                                <td style={{ whiteSpace: 'nowrap' }}>{item.tenderdoshortname}</td>
                                                <td style={{ whiteSpace: 'nowrap' }}>{item.season}</td>
                                                <td style={{ whiteSpace: 'nowrap' }}>{item.Party_Bill_Rate}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </Table>
                        ) : (
                            'Loading...'
                        )}
                    </Box>

                    <Box
                        sx={{
                            bottom: 0,
                            mt: 1,
                            pt: 1,
                            pb: 1,
                            borderTop: "1px solid #ddd",
                            display: "flex",
                            justifyContent: "center",
                            flexWrap: "wrap",
                            gap: 1
                        }}
                    >

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

export default PurcnoHelp;

