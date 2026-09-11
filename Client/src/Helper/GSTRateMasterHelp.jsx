import React, { useState, useEffect, useMemo } from "react";
import { Button, Modal } from "react-bootstrap";
import DataTableSearch from "../Common/HelpCommon/DataTableSearch";
import DataTablePagination from "../Common/HelpCommon/DataTablePagination";
import axios from "axios";
import "../App.css";

var lActiveInputFeild = "";
const API_URL = process.env.REACT_APP_API;


const GSTRateMasterHelp = ({ onAcCodeClick, name, GstRateName, GstRateCode, disabledFeild, tabIndexHelp, onKeyDown }) => {

    const CompanyCode = sessionStorage.getItem("Company_Code")

    const [showModal, setShowModal] = useState(false);
    const [popupContent, setPopupContent] = useState([]);
    const [enteredAcCode, setEnteredAcCode] = useState("");
    const [enteredAcName, setEnteredAcName] = useState("");
    const [gstRate, setGstRate] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [gstId, setGstId] = useState("")
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [selectedRowIndex, setSelectedRowIndex] = useState(-1);
    const [apiDataFetched, setApiDataFetched] = useState(false);

    // Fetch data based on acType
    const fetchAndOpenPopup = async () => {
        try {
            const response = await axios.get(`${API_URL}/gst_rate_master?Company_Code=${CompanyCode}`);
            const data = response.data;
            const filteredData = data.filter(item =>
                item.GST_Name.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setPopupContent(filteredData);
            setShowModal(true);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
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

    // Handle Mill Code button click
    const handleMillCodeButtonClick = () => {
        lActiveInputFeild = name;
        fetchAndOpenPopup();
        // Do not call onAcCodeClick here — selection happens via typing + Tab or double-clicking a row in the popup
    };

    const handleCloseModal = () => {
        setShowModal(false);
    };

    const handleAcCodeChange = async (event) => {
        let value = event.target ? event.target.value : event;
        value = value ? String(value).trim() : value;
        setEnteredAcCode(value);
        setEnteredAcName("");

        try {
            const response = await axios.get(`${API_URL}/gst_rate_master?Company_Code=${CompanyCode}`);
            const data = response.data;
            setPopupContent(data);

            // Allow matching by Doc_no OR by GST_Name (exact match), case-insensitive
            const matchingItem = data.find(item => item.Doc_no.toString() === value.toString() || (item.GST_Name && item.GST_Name.toLowerCase() === value.toLowerCase()));
            if (matchingItem) {
                setEnteredAcName(matchingItem.GST_Name);
                setGstId(matchingItem.gstid);

                if (onAcCodeClick) {
                    onAcCodeClick(matchingItem.Doc_no, matchingItem.Rate, matchingItem.GST_Name, matchingItem.gstid);
                }
            } else {
                // keep the typed code in the input so user can continue typing; only clear the name and gstid
                setEnteredAcName("");
                setGstId("");
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    // const handleKeyDown = async (event) => {
    //     if (event.key === "Tab" && event.target.id === name) {

    //         if (!apiDataFetched) {
    //             await fetchAndOpenPopup();
    //         }

    //         // match by Doc_no or GST_Name (case-insensitive)
    //         const matchingItem = popupContent.find(item => item.Doc_no.toString() === enteredAcCode || (item.GST_Name && item.GST_Name.toLowerCase() === (enteredAcCode || '').toLowerCase()));
    //         if (matchingItem) {
    //             setEnteredAcName(matchingItem.GST_Name);

    //             if (onAcCodeClick) {
    //                 onAcCodeClick(matchingItem.Doc_no, matchingItem.Rate, matchingItem.GST_Name, matchingItem.gstid);
    //             }
    //         }
    //     }
    // };


    const handleKeyDown = async (event) => {
        if (event.key === "Tab" && event.target.id === name) {
            if (!apiDataFetched) {
                await fetchAndOpenPopup();
            }

            const searchStr = String(enteredAcCode || '').toLowerCase();

            const matchingItem = popupContent.find(item =>
                item.Doc_no.toString() === searchStr ||
                (item.GST_Name && item.GST_Name.toLowerCase() === searchStr)
            );

            if (matchingItem) {
                setEnteredAcName(matchingItem.GST_Name);
                if (onAcCodeClick) {
                    onAcCodeClick(matchingItem.Doc_no, matchingItem.Rate, matchingItem.GST_Name, matchingItem.gstid);
                }
            }
        }
    };

    //After open popup onDoubleClick event that record display on the feilds
    const handleRecordDoubleClick = (item) => {
        if (lActiveInputFeild === name) {
            setEnteredAcCode(item.Doc_no);
            setGstRate(item.Rate);
            setEnteredAcName(item.GST_Name);
            setGstId(item.gstid)

            if (onAcCodeClick) {
                // pass the correct name from the selected item
                onAcCodeClick(item.Doc_no, item.Rate, item.GST_Name, item.gstid);
            }
        }

        setShowModal(false);
    };

    //handle pagination number
    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    //handle search functionality
    const handleSearch = (searchValue) => {
        setSearchTerm(searchValue);
    };

    const filteredData = popupContent.filter((item) =>
        (item.GST_Name && item.GST_Name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (String(item.Doc_no) && String(item.Doc_no).toLowerCase().includes(searchTerm.toLowerCase()))


    );

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const itemsToDisplay = filteredData.slice(startIndex, endIndex);

    useEffect(() => {
        if (GstRateCode === "" && GstRateName === "") {
            setEnteredAcCode("");
            setEnteredAcName("");
        } else if (GstRateCode && GstRateName) {
            setEnteredAcCode(GstRateCode);
            setEnteredAcName(GstRateName);
        }
    }, [GstRateCode, GstRateName]);

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
        <div className="d-flex flex-row ">
            <div className="d-flex ">
                <div className="d-flex">
                    <input
                        type="text"
                        className="form-control ms-2"
                        id={name}
                        autoComplete="off"
                        value={enteredAcCode}
                        onChange={handleAcCodeChange}
                        onKeyDown={handleKeyDown}
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
                    >
                        ...
                    </Button>
                    <label id="acNameLabel" className=" form-labels ms-2" style={{ whiteSpace: 'nowrap', fontSize: "14px", fontWeight: "bold", marginTop: "5px" }}>
                        {enteredAcName}
                    </label>
                </div>
            </div>
            <Modal
                show={showModal}
                onHide={handleCloseModal}
                dialogClassName="custom-small-modal"
            >
                <Modal.Header style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Modal.Title>GST Rate Master</Modal.Title>
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
                            <table className="custom-table">
                                <thead>
                                    <tr>
                                        <th>Doc_no</th>
                                        <th>GST_Name</th>
                                        <th>Rate</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {itemsToDisplay.map((item, index) => (
                                        <tr
                                            key={index}
                                            className={
                                                selectedRowIndex === index ? "selected-row" : ""
                                            }
                                            onDoubleClick={() => handleRecordDoubleClick(item)}
                                        >
                                            <td>{item.Doc_no}</td>
                                            <td>{item.GST_Name}</td>
                                            <td>{item.Rate}</td>

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

export default GSTRateMasterHelp;