import React, { useState, useEffect } from 'react';
import { Button, Modal } from 'react-bootstrap';
import DataTableSearch from '../Common/HelpCommon/DataTableSearch';
import DataTablePagination from '../Common/HelpCommon/DataTablePagination';
import axios from 'axios';
import '../App.css';

const API_URL = process.env.REACT_APP_API;
var lActiveInputFeild = ''

const GroupMasterHelp = ({ onAcCodeClick, name, GroupName, GroupCode, GroupBsid, disabledFeild, tabIndexHelp }) => {
    const CompanyCode = sessionStorage.getItem('Company_Code');
    const [showModal, setShowModal] = useState(false);
    const [popupContent, setPopupContent] = useState([]);
    const [enteredAcCode, setEnteredAcCode] = useState(GroupCode || "");
    const [enteredAcName, setEnteredAcName] = useState(GroupName || "");
    const [enteredBsid, setEnteredBsid] = useState(GroupBsid || "");
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedRowIndex, setSelectedRowIndex] = useState(-1);
    const itemsPerPage = 10;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`${API_URL}/group_master?Company_Code=${CompanyCode}`);
                setPopupContent(response.data);
                updateInitialState(GroupCode, response.data);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };
        fetchData();
    }, [CompanyCode, GroupCode]);

    const updateInitialState = (code, data) => {
        const foundItem = data.find(item => item.group_Code.toString() === code);
        if (foundItem) {
            setEnteredAcCode(foundItem.group_Code);
            setEnteredAcName(foundItem.group_Name_E);
            setEnteredBsid(foundItem.bsid);
        }
    };

    useEffect(() => {
        if (GroupCode === "" && GroupName === "") {
            setEnteredAcCode("");
            setEnteredAcName("");
            setEnteredBsid(GroupBsid || "");
        } else if (GroupCode && GroupName) {
            setEnteredAcCode(GroupCode);
            setEnteredAcName(GroupName);
        }
    }, [GroupCode, GroupName, GroupBsid]);

    const handleSearch = searchValue => {
        setSearchTerm(searchValue);
        setCurrentPage(1);
    };

    const handleMillCodeButtonClick = () => setShowModal(true);

    const handleCloseModal = () => setShowModal(false);

    const handleAcCodeChange = event => {
        const value = event.target.value;
        setEnteredAcCode(value);
        const foundItem = popupContent.find(item => item.group_Code.toString() === value);
        if (foundItem) {
            setEnteredAcName(foundItem.group_Name_E);
            setEnteredBsid(foundItem.bsid);
            onAcCodeClick?.(foundItem.group_Code, foundItem.group_Name_E, foundItem.bsid);
        } else {
            setEnteredAcName("");
            setEnteredBsid("");
            onAcCodeClick?.("", "", "", "", "");
        }
    };

    const handleRecordDoubleClick = item => {
        setEnteredAcCode(item.group_Code);
        setEnteredAcName(item.group_Name_E);
        setEnteredBsid(item.bsid);
        setShowModal(false);
        onAcCodeClick?.(item.group_Code, item.group_Name_E, item.bsid);
    };

    const handlePageChange = newPage => setCurrentPage(newPage);

    const filteredData = popupContent.filter(item => item.group_Name_E.toLowerCase().includes(searchTerm.toLowerCase()) || String(item.group_Code).toLowerCase().includes(searchTerm.toLowerCase()));

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const itemsToDisplay = filteredData.slice(startIndex, endIndex);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === "F1") {
                if (event.target.id === name) {
                    lActiveInputFeild = name;
                    setSearchTerm(event.target.value);
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
                    setSelectedRowIndex(prev => Math.max(prev - 1, 0));
                } else if (event.key === "ArrowDown") {
                    event.preventDefault();
                    setSelectedRowIndex(prev => Math.min(prev + 1, itemsToDisplay.length - 1));
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
    }, [showModal, selectedRowIndex, itemsToDisplay]);


    return (
        <div className="d-flex flex-row">
            <div className="d-flex">
                <input
                    type="text"
                    className="form-control ms-2"
                    id={name}
                    autoComplete="off"
                    value={enteredAcCode || ""}
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
            >
                <Modal.Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Modal.Title>Group Master</Modal.Title>
                    <Button
                        style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'blue' }}
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
                                    <th>Group Code</th>
                                    <th>Group Name</th>
                                    <th>Bsid</th>
                                </tr>
                            </thead>
                            <tbody>
                                {itemsToDisplay.map((item, index) => (
                                    <tr
                                        key={index}
                                        className={selectedRowIndex === index ? "selected-row" : ""}
                                        onDoubleClick={() => handleRecordDoubleClick(item)}
                                        style={{
                                            cursor: "pointer",
                                            backgroundColor: selectedRowIndex === index ? "#d6e9f9" : "white",
                                        }}
                                    >
                                        <td>{item.group_Code}</td>
                                        <td>{item.group_Name_E}</td>
                                        <td>{item.bsid}</td>
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
                    <Button variant="secondary" onClick={handleCloseModal}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default GroupMasterHelp;
