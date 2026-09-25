import React, { useState, useEffect, useCallback, useMemo, useref } from "react";
import { Button, Modal, Table } from "react-bootstrap";
import axios from "axios";
import DataTableSearch from "../Common/HelpCommon/DataTableSearch";
import DataTablePagination from "../Common/HelpCommon/DataTablePagination";
import "../App.css";

var lActiveInputFeild = "";
const API_URL = process.env.REACT_APP_API;

const MillMasterHelp = ({ onAcCodeClick, name, CategoryName, CategoryCode, tabIndexHelp, disabledField, SystemType, firstInputRef }) => {
    const CompanyCode = sessionStorage.getItem("Company_Code");
    const [showModal, setShowModal] = useState(false);
    const [popupContent, setPopupContent] = useState([]);
    const [enteredCode, setEnteredCode] = useState("");
    const [enteredName, setEnteredName] = useState("");
    const [enteredAccoid, setEnteredAccoid] = useState("");
    const [enteredHSN, setEnteredHSN] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [selectedRowIndex, setSelectedRowIndex] = useState(-1);
    const [apiDataFetched, setApiDataFetched] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const response = await axios.get(`${API_URL}/getdata-formillmasterhelp`);
            const data = response.data?.all_data_millmaster;
            setPopupContent(Array.isArray(data) ? data : []);
            setApiDataFetched(true);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    }, []);

    const fetchAndOpenPopup = async () => {
        if (!apiDataFetched) {
            await fetchData();
        }
        setShowModal(true);
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                await fetchAndOpenPopup();
                setShowModal(false);
                setApiDataFetched(true);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        if (!apiDataFetched) {
            fetchData();
        }

    }, [apiDataFetched]);


    const handleButtonClicked = () => {
        fetchAndOpenPopup();
    };

    const handleCloseModal = () => {
        setShowModal(false);
    };

    const handleCodeChange = async (event) => {
        let value = event.target ? event.target.value : event;
        setEnteredCode(value);

        if (!value) {
            setEnteredName("");
            setEnteredAccoid("");
            setEnteredHSN("");
            return;
        }

        try {
            const response = await axios.get(`${API_URL}/getdata-formillmasterhelp`);
            const data = response.data?.all_data_millmaster;
            const items = Array.isArray(data) ? data : [];
            setPopupContent(items);

            const matchingItem = items.find((item) => item.MillCode.toString() === value.toString());
            if (matchingItem) {
                setEnteredName(matchingItem.MillName);
                setEnteredAccoid(matchingItem.MillId);
                // setEnteredHSN(matchingItem.HSN);

                if (onAcCodeClick) {
                    onAcCodeClick(matchingItem.MillCode, matchingItem.MillId, matchingItem.HSN,
                        matchingItem.MillName, matchingItem.MillShortName, matchingItem.MillState, matchingItem.MillZone);
                }
            } else {
                setEnteredName("");
                setEnteredAccoid("");
                setEnteredHSN("");
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    const handleKeyDown = async (event) => {
        if (event.key === "Tab" && event.target.id === name) {

            if (!apiDataFetched) {
                await fetchData();
            }

            const matchingItem = popupContent.find((item) => item.MillCode.toString() === enteredCode);

            if (matchingItem) {
                setEnteredCode(matchingItem.MillCode);
                setEnteredName(matchingItem.MillName);
                setEnteredAccoid(matchingItem.MillId);
                // setEnteredHSN(matchingItem.HSN)

                if (onAcCodeClick) {
                    onAcCodeClick(matchingItem.MillCode, matchingItem.MillId, matchingItem.HSN,
                        matchingItem.MillName, matchingItem.MillShortName, matchingItem.MillState, matchingItem.MillZone);
                }
            } else {
            }
        }
    };

    const handleRecordDoubleClick = (item) => {
        setEnteredCode(item.MillCode);
        setEnteredName(item.MillName);
        setEnteredAccoid(item.MillId);
        // setEnteredHSN(item.HSN)
        if (onAcCodeClick) {
            onAcCodeClick(item.MillCode,item.MillId,item.HSN,item.MillName,item.MillShortName,item.MillState,item.MillZone);
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
        item.MillName && item.MillName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.MillName && String(item.MillCode).toLowerCase().includes(searchTerm.toLowerCase())
    );

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const itemsToDisplay = filteredData.slice(startIndex, endIndex);

    const updateCategory = (newCategoryCode, newCategoryName) => {
        if (newCategoryCode && enteredCode !== newCategoryCode) {
            setEnteredCode(newCategoryCode);
            setEnteredName(newCategoryName);
            handleCodeChange(newCategoryCode);
        }
        else {
            setEnteredCode('');
            setEnteredName('');
            handleCodeChange('');
        }
    };

    useMemo(() => {
        updateCategory(CategoryCode, CategoryName);
    }, [CategoryCode, CategoryName]);

    useEffect(() => {
        setEnteredCode(CategoryCode);
        setEnteredName(CategoryName);
    }, [CategoryCode, CategoryName]);


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
                        value={enteredCode}
                        onChange={handleCodeChange}
                        onKeyDown={handleKeyDown}
                        style={{ width: "100px", height: "35px" }}
                        tabIndex={tabIndexHelp}
                        disabled={disabledField}
                        ref={firstInputRef}
                    />
                    <Button
                        variant="primary"
                        onClick={handleButtonClicked}
                        className="ms-1"
                        style={{ width: "30px", height: "35px" }}
                        disabled={disabledField}
                    >
                        ...
                    </Button>
                    <label id="nameLabel" className="form-labels ms-2" style={{ whiteSpace: 'nowrap', fontSize: "14px", fontWeight: "bold", marginTop: "5px" }}>
                        {enteredName}
                    </label>
                </div>
            </div>

            <Modal
                show={showModal}
                onHide={handleCloseModal}
                dialogClassName="modal-dialog"
            >
                <Modal.Header style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Modal.Title>Mill Master </Modal.Title>
                    <Button
                        style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'blue', position: 'absolute', right: '10px' }}
                        onClick={handleCloseModal}
                    >
                        X
                    </Button>
                </Modal.Header>

                <DataTableSearch data={popupContent} onSearch={handleSearch} />
                <Modal.Body style={{ paddingBottom: "70px" }}>
                    {Array.isArray(popupContent) ? (
                        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                            <table
                                style={{
                                    width: "100%",
                                    borderCollapse: "collapse",
                                    marginBottom: "1rem",
                                    backgroundColor: "#fff",
                                }}
                            >
                                <thead>
                                    <tr style={{ backgroundColor: "#f8f9fa" }}>
                                        <th style={{ border: "1px solid #dee2e6", padding: "8px", whiteSpace: "nowrap" }}>Mill Code</th>
                                        <th style={{ border: "1px solid #dee2e6", padding: "8px", whiteSpace: "nowrap" }}>Mill Name</th>
                                        <th style={{ border: "1px solid #dee2e6", padding: "8px", whiteSpace: "nowrap" }}>Mill Short Name</th>
                                        <th style={{ border: "1px solid #dee2e6", padding: "8px", whiteSpace: "nowrap" }}>Mill Id</th>
                                        <th style={{ border: "1px solid #dee2e6", padding: "8px", whiteSpace: "nowrap" }}>Mill State</th>
                                        <th style={{ border: "1px solid #dee2e6", padding: "8px", whiteSpace: "nowrap" }}>Mill Zone</th>
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
                                            <td style={{ border: "1px solid #dee2e6", padding: "8px" }}>{item.MillCode}</td>
                                            <td style={{ border: "1px solid #dee2e6", padding: "8px" }}>{item.MillName}</td>
                                            <td style={{ border: "1px solid #dee2e6", padding: "8px" }}>{item.MillShortName}</td>
                                            <td style={{ border: "1px solid #dee2e6", padding: "8px" }}>{item.MillId}</td>
                                            <td style={{ border: "1px solid #dee2e6", padding: "8px" }}>{item.MillState}</td>
                                            <td style={{ border: "1px solid #dee2e6", padding: "8px" }}>{item.MillZone}</td>
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
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default MillMasterHelp;
