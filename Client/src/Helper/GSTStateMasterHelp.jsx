import React, { useState, useEffect, useMemo } from "react";
import { Button, Modal } from "react-bootstrap";
import DataTableSearch from "../Common/HelpCommon/DataTableSearch";
import DataTablePagination from "../Common/HelpCommon/DataTablePagination";
import axios from "axios";
import "../App.css";

const API_URL = process.env.REACT_APP_API;
var lActiveInputFeild = ''

const GSTStateMasterHelp = ({ onAcCodeClick, name, GstStateName, GstStateCode, disabledFeild, tabIndexHelp }) => {
    const [showModal, setShowModal] = useState(false);
    const [popupContent, setPopupContent] = useState([]);
    const [enteredAcCode, setEnteredAcCode] = useState(GstStateCode || "");
    const [enteredAcName, setEnteredAcName] = useState(GstStateName || "");
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedRowIndex, setSelectedRowIndex] = useState(-1);

    const itemsPerPage = 10;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`${API_URL}/getall-gststatemaster`);
                setPopupContent(response.data.alldata || []);
                if (GstStateCode) {
                    const foundItem = response.data.alldata.find(item => item.State_Code.toString() === GstStateCode.toString());
                    if (foundItem) {
                        setEnteredAcCode(foundItem.State_Code);
                        setEnteredAcName(foundItem.State_Name);
                    }
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };
        fetchData();
    }, [GstStateCode]);


    useEffect(() => {
        setEnteredAcCode(GstStateCode || "");
        setEnteredAcName(GstStateName || "");
    }, [GstStateCode, GstStateName]);


    const filteredData = useMemo(() => {
        return popupContent.filter((item) =>
            item.State_Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(item.State_Code)?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [popupContent, searchTerm]);


    const itemsToDisplay = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredData.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredData, currentPage, itemsPerPage]);


    const handleSearch = (searchValue) => {
        setSearchTerm(searchValue);
        setCurrentPage(1);
    };

    const handleMillCodeButtonClick = () => {
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
    };

    const handleAcCodeChange = (event) => {
        const value = event.target.value;
        setEnteredAcCode(value);
        setEnteredAcName("");

          if (value === "") {
            setEnteredAcCode("");
            setEnteredAcName("");
            onAcCodeClick?.("", "");
        }

        const matchingItem = popupContent.find((item) => item.State_Code.toString() === value);
        if (matchingItem) {
            setEnteredAcName(matchingItem.State_Name);
            onAcCodeClick?.(matchingItem.State_Code, matchingItem.State_Name);
        }
    };

    const handleRecordDoubleClick = (item) => {
        setEnteredAcCode(item.State_Code);
        setEnteredAcName(item.State_Name);
        setShowModal(false);
        onAcCodeClick?.(item.State_Code, item.State_Name);
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === "F1") {
                if (event.target.id === name) {
                    lActiveInputFeild = name;
                    event.preventDefault();
                    setShowModal(true);
                }
            } else if (event.key === "Tab" && showModal) {
                event.preventDefault();
                if (selectedRowIndex >= itemsToDisplay.length - 1) {
                    setSelectedRowIndex(0);
                } else {
                    setSelectedRowIndex((prev) => prev + 1);
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [showModal, selectedRowIndex, itemsToDisplay]);

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
                <input
                    type="text"
                    className="form-control ms-2"
                    id={name}
                    autoComplete="off"
                    value={enteredAcCode}
                    onChange={handleAcCodeChange}
                    style={{ width: "100px", height: "35px" }}
                    disabled={disabledFeild}
                    tabIndex={tabIndexHelp}
                />
                <Button
                    variant="primary"
                    onClick={handleMillCodeButtonClick}
                    className="ms-1"
                    style={{ width: "30px", height: "35px" }}
                    disabled={disabledFeild}
                    tabIndex={tabIndexHelp}
                >
                    ...
                </Button>
                <label id="acNameLabel" className="form-labels ms-2" style={{ whiteSpace: 'nowrap', fontSize: "14px", fontWeight: "bold", marginTop: "5px" }}>
                    {enteredAcName}
                </label>
            </div>
            <Modal
                show={showModal}
                onHide={handleCloseModal}
                dialogClassName="custom-small"
               style={{ zIndex: 9999 }}
            >
                <Modal.Header style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Modal.Title>State Master </Modal.Title>
                    <Button
                        style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'blue', position: 'absolute', right: '10px' }}
                        onClick={handleCloseModal}
                    >
                        X
                    </Button>
                </Modal.Header>
                 <DataTableSearch data={popupContent} onSearch={handleSearch} />
                <Modal.Body>
                    <div className="table-responsive">
                        <table className="custom-table">
                            <thead>
                                <tr>
                                    <th>State Code</th>
                                    <th>State Name</th>
                                </tr>
                            </thead>
                            <tbody>
                                {itemsToDisplay.map((item, index) => (
                                    <tr
                                        key={index}
                                        className={selectedRowIndex === index ? "selected-row" : ""}
                                        onDoubleClick={() => handleRecordDoubleClick(item)}
                                    >
                                        <td>{item.State_Code}</td>
                                        <td>{item.State_Name}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <DataTablePagination
                        totalItems={filteredData.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={handlePageChange}
                    />
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default GSTStateMasterHelp;
