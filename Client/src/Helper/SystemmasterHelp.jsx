import React, { useState, useEffect, useCallback, useMemo, useref } from "react";
import { Button, Modal, Table } from "react-bootstrap";
import axios from "axios";
import DataTableSearch from "../Common/HelpCommon/DataTableSearch";
import DataTablePagination from "../Common/HelpCommon/DataTablePagination";
import "../App.css";

var lActiveInputFeild = "";
const API_URL = process.env.REACT_APP_API;

const SystemHelpMaster = ({ onAcCodeClick, name, CategoryName, CategoryCode, tabIndexHelp, disabledField, SystemType, firstInputRef }) => {
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
            const response = await axios.get(`${API_URL}/system_master_help?CompanyCode=${CompanyCode}&SystemType=${SystemType}`);
            const data = response.data;
            setPopupContent(data);
            setApiDataFetched(true);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    }, [SystemType]);

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
            const response = await axios.get(`${API_URL}/system_master_help?CompanyCode=${CompanyCode}&SystemType=${SystemType}`);
            const data = response.data;
            setPopupContent(data);

            const matchingItem = data.find((item) => item.Category_Code.toString() === value.toString());
            if (matchingItem) {
                setEnteredName(matchingItem.Category_Name);
                setEnteredAccoid(matchingItem.accoid);
                setEnteredHSN(matchingItem.HSN);

                if (onAcCodeClick) {
                     onAcCodeClick(matchingItem.Category_Code, matchingItem.accoid, matchingItem.HSN,
                         matchingItem.Category_Name, matchingItem.Gst_Code,matchingItem.Purchase_AC,matchingItem.Sale_AC,matchingItem.RatePer,matchingItem.pac,matchingItem.sac);
              
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

            const matchingItem = popupContent.find((item) => item.Category_Code.toString() === enteredCode);

            if (matchingItem) {
                setEnteredCode(matchingItem.Category_Code);
                setEnteredName(matchingItem.Category_Name);
                setEnteredAccoid(matchingItem.accoid);
                setEnteredHSN(matchingItem.HSN)

                if (onAcCodeClick) {
                    onAcCodeClick(matchingItem.Category_Code, matchingItem.accoid, matchingItem.HSN, matchingItem.Category_Name, matchingItem.Gst_Code,matchingItem.Purchase_AC,
                        matchingItem.Sale_AC,matchingItem.RatePer,matchingItem.pac,matchingItem.sac);
                }
            } else {
            }
        }
    };

    const handleRecordDoubleClick = (item) => {
        setEnteredCode(item.Category_Code);
        setEnteredName(item.Category_Name);
        setEnteredAccoid(item.accoid);
        setEnteredHSN(item.HSN)
        if (onAcCodeClick) {
            onAcCodeClick(item.Category_Code, item.accoid, item.HSN, item.Category_Name, item.Gst_Code,item.Purchase_AC,item.Sale_AC,item.RatePer,item.pac,item.sac);
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
        item.Category_Name && item.Category_Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.Category_Name && String(item.Category_Code).toLowerCase().includes(searchTerm.toLowerCase())
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
        else{
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
                dialogClassName="custom-small"
            >
                <Modal.Header style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Modal.Title>System Master </Modal.Title>
                    <Button
                        style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'blue', position: 'absolute', right: '10px' }}
                        onClick={handleCloseModal}
                    >
                        X
                    </Button>
                </Modal.Header>

                <DataTableSearch data={popupContent} onSearch={handleSearch} />
                <Modal.Body>
                    {Array.isArray(popupContent) ? (
                        <div className="table-responsive">
                            <table className="custom-small-table">
                                <thead>
                                    <tr>
                                        <th>Item Code</th>
                                        <th>Item Name</th>
                                        <th>Accoid</th>
                                        <th>HSN</th>
                                        <th>Gst Code</th>
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
                                            <td>{item.Category_Code}</td>
                                            <td>{item.Category_Name}</td>
                                            <td>{item.accoid}</td>
                                            <td>{item.HSN}</td>
                                            <td>{item.Gst_Code}</td>
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

export default SystemHelpMaster;
