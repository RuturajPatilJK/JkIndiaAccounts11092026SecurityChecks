import React, { useState, useEffect, useRef } from "react";
import { Button, Modal } from "react-bootstrap";
import axios from "axios";
import DataTableSearch from "../Common/HelpCommon/DataTableSearch";
import DataTablePagination from "../Common/HelpCommon/DataTablePagination";

const API_URL = process.env.REACT_APP_API;
let lActiveInputFeild = "";

const SalePurchaseTDSHelper = ({ onAcCodeClick, name, GstRateName, GstRateCode, disabledFeild, tabIndexHelp }) => {
    const [showModal, setShowModal] = useState(false);
    const [popupContent, setPopupContent] = useState([]);
    const [enteredAcCode, setEnteredAcCode] = useState("");
    const [enteredAcName, setEnteredAcName] = useState("");
    const [gstId, setGstId] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedRowIndex, setSelectedRowIndex] = useState(-1);

    const itemsPerPage = 10;

    const fetchPopupData = async () => {
        try {
            const response = await axios.get(`${API_URL}/tds-sections`);
            setPopupContent(response.data);
        } catch (error) {
            console.error("Error fetching TDS Sections:", error);
        }
    };

    const handleButtonClicked = async () => {
        await fetchPopupData();
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
    };

    const handleAcCodeChange = async (e) => {
        const value = e.target.value;
        setEnteredAcCode(value);
        setEnteredAcName("");
        setGstId("");

        if (value === "") {
            onAcCodeClick?.("", "", "");
            return;
        }

        await fetchPopupData();
         if (!Array.isArray(popupContent)) return;

  const matched = popupContent.find(item => {
    if (item.Section == null) return false;
    return item.Section.toString() === value;
  });
        if (matched) {
            setEnteredAcName(matched.Nature_of_Payment);
            setGstId(matched.id);
            onAcCodeClick?.(matched.Section, matched.id, matched.Nature_of_Payment,matched.TDS_Section_Code);
        }
    };

    const handleKeyDown = async (event) => {
        if (event.key === "Tab" && event.target.id === name) {
      const matched = popupContent.find(item => {
        if (item.Section == null) return false;
        return item.Section.toString() === enteredAcCode;
      });
            if (matched) {
                setEnteredAcName(matched.Nature_of_Payment);
                setGstId(matched.id);
                onAcCodeClick?.(matched.Section, matched.id, matched.Nature_of_Payment,matched.TDS_Section_Code);
            }
        }
    };

    const handleRecordDoubleClick = (item) => {
        setEnteredAcCode(item.Section);
        setEnteredAcName(item.Nature_of_Payment);
        setGstId(item.id);
        onAcCodeClick?.(item.Section, item.id, item.Nature_of_Payment, item.TDS_Section_Code);
        setShowModal(false);
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    const handleSearch = (value) => {
        setSearchTerm(value);
    };

    const filteredData = popupContent.filter(item => {
    const sectionStr = item.Section != null
      ? item.Section.toString()
      : "";
    const nameStr = item.Nature_of_Payment || "";
    return (
      nameStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sectionStr.includes(searchTerm)
    );
  });

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const itemsToDisplay = filteredData.slice(startIndex, endIndex);

    useEffect(() => {
        if (GstRateCode && GstRateName) {
            setEnteredAcCode(GstRateCode);
            setEnteredAcName(GstRateName);
        } else {
            setEnteredAcCode("");
            setEnteredAcName("");
        }
    }, [GstRateCode, GstRateName]);

    useEffect(() => {
        const handleGlobalF1 = (event) => {
            if (event.key === "F1" && event.target.id === name) {
                lActiveInputFeild = name;
                setSearchTerm(event.target.value);
                handleButtonClicked();
                event.preventDefault();
            }
        };

        window.addEventListener("keydown", handleGlobalF1);
        return () => window.removeEventListener("keydown", handleGlobalF1);
    }, [name]);

    useEffect(() => {
        const handleKeyNavigation = (event) => {
            if (showModal) {
                if (event.key === "ArrowUp") {
                    event.preventDefault();
                    setSelectedRowIndex((prev) => Math.max(prev - 1, 0));
                } else if (event.key === "ArrowDown") {
                    event.preventDefault();
                    setSelectedRowIndex((prev) => Math.min(prev + 1, itemsToDisplay.length - 1));
                } else if (event.key === "Enter" && selectedRowIndex >= 0) {
                    event.preventDefault();
                    handleRecordDoubleClick(itemsToDisplay[selectedRowIndex]);
                }
            }
        };

        window.addEventListener("keydown", handleKeyNavigation);
        return () => window.removeEventListener("keydown", handleKeyNavigation);
    }, [showModal, selectedRowIndex, itemsToDisplay]);

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
                    onKeyDown={handleKeyDown}
                    style={{ width: "100px", height: "35px" }}
                    tabIndex={tabIndexHelp}
                    disabled
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
                <label className="form-labels ms-2" style={{ whiteSpace: "nowrap", fontSize: "14px", fontWeight: "bold", marginTop: "5px" }}>
                    {enteredAcName}
                </label>
            </div>

            <Modal show={showModal} onHide={handleCloseModal} dialogClassName="modal-dialog">
                <Modal.Header style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Modal.Title>TDS Sections</Modal.Title>
                    <Button
                        style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'blue', position: 'absolute', right: '10px' }}
                        onClick={handleCloseModal}
                    >
                        X
                    </Button>
                </Modal.Header>
                <DataTableSearch data={popupContent} onSearch={handleSearch} />
                <Modal.Body>
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "#fff" }}>
                            <thead>
                                <tr style={{ backgroundColor: "#f8f9fa" }}>
                                    <th style={{ border: "1px solid #dee2e6", padding: "8px", whiteSpace: "nowrap" }}>Section</th>
                                    <th style={{ border: "1px solid #dee2e6", padding: "8px", whiteSpace: "nowrap" }}>Nature of Payment</th>
                                    <th style={{ border: "1px solid #dee2e6", padding: "8px", whiteSpace: "nowrap" }}>ID</th>
                                                <th style={{ border: "1px solid #dee2e6", padding: "8px", whiteSpace: "nowrap" }}>TDS Section Code</th>
                                </tr>
                            </thead>
                            <tbody>
                                {itemsToDisplay.map((item, index) => (
                                    <tr
                                        key={item.id}
                                        style={{
                                            cursor: "pointer",
                                            backgroundColor: selectedRowIndex === index ? "#d6e9f9" : "white",
                                        }}
                                        onClick={() => setSelectedRowIndex(index)}
                                        onDoubleClick={() => handleRecordDoubleClick(item)}
                                    >
                                        <td style={{ border: "1px solid #dee2e6", padding: "8px" }}>{item.Section}</td>
                                        <td style={{ border: "1px solid #dee2e6", padding: "8px" }}>{item.Nature_of_Payment}</td>
                                        <td style={{ border: "1px solid #dee2e6", padding: "8px" }}>{item.id}</td>
                                           <td style={{ border: "1px solid #dee2e6", padding: "8px" }}>{item.TDS_Section_Code}</td>
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

export default SalePurchaseTDSHelper;
