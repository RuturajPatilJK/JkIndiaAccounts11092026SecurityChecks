import React, { useState, useEffect, useMemo } from "react";
import { Button, Modal } from "react-bootstrap";
import DataTableSearch from "./../../Common/HelpCommon/DataTableSearch";
import DataTablePagination from "./../../Common/HelpCommon/DataTablePagination";
import axios from "axios";
import "./../../App.css";

const API_URL = process.env.REACT_APP_API;
var lActiveInputFeild = '';

const RackRailwaystationMasterHelp = ({ onAcCodeClick, name, StationName, StationId, disabledFeild, tabIndexHelp }) => {
    const [showModal, setShowModal] = useState(false);
    const [popupContent, setPopupContent] = useState([]);
    const [enteredAcCode, setEnteredAcCode] = useState(StationId || "");
    const [enteredAcName, setEnteredAcName] = useState(StationName || "");
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedRowIndex, setSelectedRowIndex] = useState(-1);

    const itemsPerPage = 10;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`${API_URL}/getall_stationmaster`);
                setPopupContent(response.data.alldata || []);
                if (StationId) {
                    const foundItem = response.data.alldata.find(item => item.Id.toString() === StationId.toString());
                    if (foundItem) {
                        setEnteredAcCode(foundItem.Id);
                        setEnteredAcName(foundItem.Station_name);
                    }
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };
        fetchData();
    }, [StationId]);

    useEffect(() => {
        setEnteredAcCode(StationId || "");
        setEnteredAcName(StationName || "");
    }, [StationId, StationName]);

    const filterData = (searchValue) => {
        setSearchTerm(searchValue);
        const results = popupContent.filter((item) =>
            item.Station_name?.toLowerCase().includes(searchValue.toLowerCase()) ||
            String(item.Id)?.toLowerCase().includes(searchValue.toLowerCase())
        );
        setCurrentPage(1);
        return results;
    };

    const filteredData = useMemo(() => filterData(searchTerm), [popupContent, searchTerm]);

    const itemsToDisplay = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredData.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredData, currentPage, itemsPerPage]);

    const handleSearch = (searchValue) => {
        setSearchTerm(searchValue);
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
        filterData(value);
        const matchingItem = popupContent.find((item) => item.Id.toString() === value);
        if (matchingItem) {
            setEnteredAcName(matchingItem.Station_name);
            onAcCodeClick?.(matchingItem.Id, matchingItem.Station_name);
        } else {
            setEnteredAcName("");
        }
    };

    const handleRecordDoubleClick = (item) => {
        setEnteredAcCode(item.Id);
        setEnteredAcName(item.Station_name);
        setShowModal(false);
        onAcCodeClick?.(item.Id, item.Station_name);
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === "F1" && document.activeElement.id === name) {
                event.preventDefault();
                filterData(enteredAcCode);
                setShowModal(true);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [enteredAcCode]);

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
                    <Modal.Title>Station Master</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <DataTableSearch data={popupContent} onSearch={handleSearch} />
                    <div className="table-responsive">
                        <table className="custom-table">
                            <thead>
                                <tr>
                                    <th>Station Id</th>
                                    <th>Station Name</th>
                                </tr>
                            </thead>
                            <tbody>
                                {itemsToDisplay.map((item, index) => (
                                    <tr key={index} className={selectedRowIndex === index ? "selected-row" : ""}
                                        onDoubleClick={() => handleRecordDoubleClick(item)}>
                                        <td>{item.Id}</td>
                                        <td>{item.Station_name}</td>
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

export default RackRailwaystationMasterHelp;
