import React, { useState, useEffect, useMemo } from "react";
import { Button, Modal } from "react-bootstrap";
import DataTableSearch from "./../../Common/HelpCommon/DataTableSearch";
import DataTablePagination from "./../../Common/HelpCommon/DataTablePagination";
import axios from "axios";
import "./../../App.css";

const API_URL = process.env.REACT_APP_API;

const RackMillInfoHelp = ({ onAcCodeClick, name, MillName, MillId, disabledFeild, tabIndexHelp }) => {
    const [showModal, setShowModal] = useState(false);
    const [popupContent, setPopupContent] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [enteredAcCode, setEnteredAcCode] = useState(MillId || "");
    const [enteredAcName, setEnteredAcName] = useState(MillName || "");
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedRowIndex, setSelectedRowIndex] = useState(-1);

    const itemsPerPage = 10;

    // Fetch data once on component mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`${API_URL}/getall_millmaster`);
                setPopupContent(response.data.alldata || []);
                setFilteredData(response.data.alldata || []);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };
        fetchData();
    }, []);

    // Update enteredAcCode and enteredAcName when props change
    useEffect(() => {
        setEnteredAcCode(MillId || "");
        setEnteredAcName(MillName || "");
    }, [MillId, MillName]);

    // Function to filter data based on search value
    const filterData = (searchValue) => {
        setSearchTerm(searchValue);
        const results = popupContent.filter((item) =>
            item.Mill_name?.toLowerCase().includes(searchValue.toLowerCase()) ||
            String(item.Id)?.toLowerCase().includes(searchValue.toLowerCase())
        );
        setFilteredData(results);
        setCurrentPage(1);
    };

    // Handle search field updates (search bar in modal)
    const handleSearch = (searchValue) => {
        filterData(searchValue);
    };

    // Handle input field changes (main input field)
    const handleAcCodeChange = (event) => {
        const value = event.target.value;
        setEnteredAcCode(value);
        filterData(value); // 🔹 Now updates filteredData while typing

        const matchingItem = popupContent.find((item) => item.Id.toString() === value);
        if (matchingItem) {
            setEnteredAcName(matchingItem.Mill_name);
            onAcCodeClick?.(matchingItem.Id, matchingItem.Mill_name);
        } else {
            setEnteredAcName("");
        }
    };

    // Handle modal opening (Fn + F1 should filter before opening)
    const handleMillCodeButtonClick = () => {
        setShowModal(true);
    };

    // Close modal
    const handleCloseModal = () => {
        setShowModal(false);
    };

    // Handle double-click on a record in the modal
    const handleRecordDoubleClick = (item) => {
        setEnteredAcCode(item.Id);
        setEnteredAcName(item.Mill_name);
        setShowModal(false);
        onAcCodeClick?.(item.Id, item.Mill_name);
    };

    // Handle pagination number change
    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    // Handle keyboard navigation (F1 opens filtered modal)
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === "F1") {
                event.preventDefault();
                
                if (document.activeElement.id === name) {
                    filterData(enteredAcCode); // 🔹 Apply search before opening
                    setShowModal(true);
                }
            } else if (event.key === "Tab" && showModal) {
                event.preventDefault();
                setSelectedRowIndex((prev) =>
                    prev >= filteredData.length - 1 ? 0 : prev + 1
                );
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [showModal, enteredAcCode, filteredData]);

    // Handle keyboard navigation for up/down and Enter keys
    useEffect(() => {
        const handleKeyNavigation = (event) => {
            if (showModal) {
                if (event.key === "ArrowUp") {
                    event.preventDefault();
                    setSelectedRowIndex((prev) => Math.max(prev - 1, 0));
                } else if (event.key === "ArrowDown") {
                    event.preventDefault();
                    setSelectedRowIndex((prev) => Math.min(prev + 1, filteredData.length - 1));
                } else if (event.key === "Enter") {
                    event.preventDefault();
                    if (selectedRowIndex >= 0) {
                        handleRecordDoubleClick(filteredData[selectedRowIndex]);
                    }
                }
            }
        };

        window.addEventListener("keydown", handleKeyNavigation);

        return () => {
            window.removeEventListener("keydown", handleKeyNavigation);
        };
    }, [showModal, selectedRowIndex, filteredData]);

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
                    style={{ width: "150px", height: "35px" }}
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
            <Modal show={showModal} onHide={handleCloseModal} dialogClassName="modal-dialog">
                <Modal.Header closeButton>
                    <Modal.Title>Mill Master</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <DataTableSearch data={popupContent} onSearch={handleSearch} />
                    <div className="table-responsive">
                        <table className="custom-table">
                            <thead>
                                <tr>
                                    <th>Mill Id</th>
                                    <th>Mill Name</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item, index) => (
                                    <tr key={index} className={selectedRowIndex === index ? "selected-row" : ""} onDoubleClick={() => handleRecordDoubleClick(item)}>
                                        <td>{item.Id}</td>
                                        <td>{item.Mill_name}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <DataTablePagination totalItems={filteredData.length} itemsPerPage={itemsPerPage} onPageChange={handlePageChange} />
                    <Button variant="secondary" onClick={handleCloseModal}>Close</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default RackMillInfoHelp;
