import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button, Modal, Table } from "react-bootstrap";
import axios from "axios";
import DataTableSearch from "../Common/HelpCommon/DataTableSearch";
import DataTablePagination from "../Common/HelpCommon/DataTablePagination";
import "../App.css";

var lActiveInputFeild = "";
const API_URL = process.env.REACT_APP_API;
const UTRLotnoHelp = ({ onAcCodeClick, name, Tenderno, tabIndexHelp, disabledFeild, Millcode, onTenderDetailsFetched, firstInputRef }) => {

    const API_URL = process.env.REACT_APP_API;
    const CompanyCode = sessionStorage.getItem("Company_Code");
    const YearCode = sessionStorage.getItem("Year_Code");

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
            const response = await axios.get(`${API_URL}/UtrLotno?CompanyCode=${CompanyCode}&MillCode=${Millcode}`);
            const data = response.data;

            setPopupContent(data);
            setApiDataFetched(true);



        } catch (error) {
            console.error("Error fetching data:", error);
        }
    });

    const fetchTenderDetails = async (tenderNo, tenderId) => {
        try {

            const url = `${API_URL}/getUTrLotno_Data?CompanyCode=${CompanyCode}&Tender_No=${tenderNo}`;
            const response = await axios.get(url);
            const details = response.data;
            onTenderDetailsFetched(details)

        } catch (error) {
            console.error("Error fetching tender details:", error);
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

            fetchTenderDetails(matchingItem.Tender_No)

            if (onAcCodeClick) {
                onAcCodeClick(matchingItem.Tender_No);
            }

        } else {
            setenteredTenderno("");
            setEnteredTenderid("");
        }
    };

    const handleRecordDoubleClick = (item) => {
        setenteredTenderno(item.Tender_No);

        fetchTenderDetails(item.Tender_No)

        if (onAcCodeClick) {
            onAcCodeClick(item.Tender_No);
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
        item.millshortname?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const itemsToDisplay = filteredData.slice(startIndex, endIndex);

    useEffect(() => {
        if (Tenderno === "") {
            setenteredTenderno("");
        } else {
            setenteredTenderno(Tenderno);
        }
    }, [Tenderno]);

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
                        style={{ width: "150px", height: "35px" }}
                        tabIndex={tabIndexHelp}
                        disabled={disabledFeild}
                        ref={firstInputRef}
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
                    {/* <input
                        type="text"
                        className="form-control ms-2"
                        id={name}
                        autoComplete="off"
                        value={enteredTenderid !== '' ? enteredTenderid : Tenderid}
                        onChange={handleCodeChange}
                        style={{ width: "150px", height: "35px" }}
                        tabIndex={tabIndexHelp}
                        disabled={disabledFeild}
                    /> */}
                </div>
            </div>

            <Modal
                show={showModal}
                onHide={handleCloseModal}
                dialogClassName="modal-dialog"

            >
                <Modal.Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Modal.Title>MillWise LOT Numbers</Modal.Title>
                    <Button
                        style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'blue' }}
                        onClick={handleCloseModal}
                    >
                        X
                    </Button>
                </Modal.Header>

                <DataTableSearch data={popupContent} onSearch={handleSearch} />
                <Modal.Body>
                    {Array.isArray(popupContent) ? (
                        <div className="table-responsive">
                            <table className="custom-table">
                                <thead>
                                    <tr>
                                        <th>Tenderno</th>
                                        <th>Tender_Date</th>
                                        <th>Quantal</th>
                                        <th>Mill_Rate</th>
                                        <th>millamount</th>
                                        <th>paidamount</th>
                                        <th>payableamount</th>
                                        <th> Year_Code</th>
                                        <th>Grade</th>
                                        <th>millshortname</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {itemsToDisplay.map((item, index) => (
                                        <tr
                                            key={index}
                                            style={{
                                                cursor: "pointer",
                                                backgroundColor: selectedRowIndex === index ? "#d6e9f9" : "white",
                                            }}
                                            className={
                                                selectedRowIndex === index ? "selected-row" : ""
                                            }
                                            onDoubleClick={() => handleRecordDoubleClick(item)}
                                        >
                                            <td>{item.Tender_No}</td>
                                            <td>{item.Tender_Date}</td>
                                            <td>{item.Quantal}</td>
                                            <td>{item.Party_Bill_Rate}</td>
                                            <td>{item.millamount}</td>
                                            <td>{item.paidamount}</td>
                                            <td>{item.payableamount}</td>
                                            <td>{item.Year_Code}</td>
                                            <td>{item.Grade}</td>
                                            <td>{item.millshortname}</td>


                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        "Loading..."
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <DataTablePagination
                        totalItems={filteredData.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={handlePageChange}
                    />
                    <Button variant="secondary" onClick={handleCloseModal}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default UTRLotnoHelp;
