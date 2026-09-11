import React, { useState, useEffect, useMemo } from "react";
import { Button, Modal } from "react-bootstrap";
import DataTableSearch from "../Common/HelpCommon/DataTableSearch";
import DataTablePagination from "../Common/HelpCommon/DataTablePagination";
import axios from "axios";
import "../App.css";

const API_URL = process.env.REACT_APP_API;
var lActiveInputFeild = "";

const CityBroadCastHelp = ({
    onAcCodeClick,
    name,
    State_Code,
    CityName,
    CityCode,
    disabledFeild,
    tabIndexHelp,
}) => {
    const CompanyCode = sessionStorage.getItem("Company_Code");
    const [showModal, setShowModal] = useState(false);
    const [popupContent, setPopupContent] = useState([]);
    const [enteredAcCode, setEnteredAcCode] = useState(CityCode || "");
    const [enteredAcName, setEnteredAcName] = useState(CityName || "");
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedRowIndex, setSelectedRowIndex] = useState(-1);
    const [selectedCityRows, setSelectedCityRows] = useState([]);
    const [selectAllChecked, setSelectAllChecked] = useState(false);

    const itemsPerPage = 19;

    useEffect(() => {
        const fetchData = async () => {
            try {
                let res;

                // Prepare state code list as comma-separated string
                const codeList = Array.isArray(State_Code)
                    ? State_Code.map((s) => (typeof s === "object" ? s.State_Code : s)).join(",")
                    : State_Code;

                if (codeList && codeList.length > 0) {
                    res = await axios.get(`${API_URL}/getcitybystatecode`, {
                        params: { State_Code: codeList },
                    });

                    const cityData = res.data?.CityByState_data || [];
                    setPopupContent(cityData);

                    if (cityData.length > 0) {
                        setSelectedCityRows(cityData);
                        setSelectAllChecked(true);
                        // Optionally: onAcCodeClick?.(cityData);
                    } else {
                        setSelectedCityRows([]);
                        setSelectAllChecked(false);
                    }
                } else {
                    // Fallback to all cities
                    res = await axios.get(`${API_URL}/group_city_master`, {
                        params: { Company_Code: CompanyCode },
                    });

                    const allCities = res.data || [];
                    setPopupContent(allCities);
                    setSelectedCityRows([]);
                    setSelectAllChecked(false);
                }
            } catch (error) {
                console.error("Error fetching cities:", error);
                setPopupContent([]);
                setSelectedCityRows([]);
                setSelectAllChecked(false);
            }
        };

        fetchData();
    }, [State_Code, CompanyCode]);


    useEffect(() => {
        setEnteredAcCode(CityCode || "");
        setEnteredAcName(CityName || "");

        if (!CityCode && !CityName) {
            setSelectedCityRows([]);      // ✅ clear checkbox selections
            setSelectAllChecked(false);   // ✅ reset "select all"
        }
    }, [CityCode, CityName]);


    const filteredData = useMemo(() => {
        return popupContent.filter((item) =>
            item.city_name_e?.toLowerCase().includes(searchTerm.toLowerCase())
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
            setSelectAllChecked(false);
            setSelectedCityRows([]); // ✅ fully clear selection
            setPopupContent([]);     // ✅ optional: clear city list visually
            setShowModal(false);     // ✅ close modal if open
            onAcCodeClick?.([], "", "", "", "", "", "", "", "");
            return;
        }

        const matchingItem = popupContent.find(
            (item) => item.city_code.toString() === value
        );
        if (matchingItem) {
            setEnteredAcName(matchingItem.city_name_e);
            onAcCodeClick?.([matchingItem]);
        }
    };

    // const handleRecordDoubleClick = (item) => {
    //     setEnteredAcCode(item.city_code);
    //     setEnteredAcName(item.city_name_e);
    //     setShowModal(false);
    //      onAcCodeClick?.([item]); 
    // };

    const handleRecordDoubleClick = (item) => {
        let updatedList = [...selectedCityRows];

        const exists = updatedList.some(c => c.city_code === item.city_code);
        if (!exists) updatedList.push(item);

        setSelectedCityRows(updatedList);
        setEnteredAcCode(item.city_code);
        setEnteredAcName(item.city_name_e);
        setShowModal(false);
        onAcCodeClick?.(updatedList);
    };


    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    const handleCityCheckboxChange = (item) => {
        const exists = selectedCityRows.some(row => row.city_code === item.city_code);
        if (exists) {
            setSelectedCityRows(prev => prev.filter(row => row.city_code !== item.city_code));
        } else {
            setSelectedCityRows(prev => [...prev, item]);
        }
    };

    // const handleConfirmSelection = () => {
    //     setShowModal(false);
    //     if (selectedCityRows.length > 0) {
    //         const names = selectedCityRows.map(row => row.city_name_e).join(", ");
    //         setEnteredAcName(names); // <- update label value
    //         onAcCodeClick?.(selectedCityRows);
    //     }
    // };

    const handleConfirmSelection = () => {
        setShowModal(false);

        if (selectedCityRows.length > 0) {
            const limit = 5; // Show only first 5 names in the label
            const nameList = selectedCityRows.map(row => row.city_name_e);

            const displayName =
                nameList.length > limit
                    ? `${nameList.slice(0, limit).join(", ")}, ...`
                    : nameList.join(", ");

            setEnteredAcName(displayName); // ✅ label truncated
            onAcCodeClick?.(selectedCityRows); // ✅ full data passed
        }
    };


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
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [showModal, selectedRowIndex, itemsToDisplay]);

    useEffect(() => {
        const handleKeyNavigation = (event) => {
            if (showModal) {
                if (event.key === "ArrowUp") {
                    event.preventDefault();
                    setSelectedRowIndex((prev) => Math.max(prev - 1, 0));
                } else if (event.key === "ArrowDown") {
                    event.preventDefault();
                    setSelectedRowIndex((prev) =>
                        Math.min(prev + 1, itemsToDisplay.length - 1)
                    );
                } else if (event.key === "Enter") {
                    event.preventDefault();
                    if (selectedRowIndex >= 0) {
                        handleRecordDoubleClick(itemsToDisplay[selectedRowIndex]);
                    }
                }
            }
        };

        window.addEventListener("keydown", handleKeyNavigation);
        return () => window.removeEventListener("keydown", handleKeyNavigation);
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
                <label
                    className="form-labels ms-2"
                    title={CityName} // Shows full city list on hover
                    style={{
                        whiteSpace: 'nowrap',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        marginTop: '5px',
                    }}
                >
                    {(() => {
                        const names = CityName.split(",");
                        const limit = 3;
                        return names.length > limit
                            ? `${names.slice(0, limit).join(", ")}, ...`
                            : CityName;
                    })()}
                </label>

            </div>

            <Modal show={showModal} onHide={handleCloseModal} dialogClassName="custom-small">
                <Modal.Header
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <Modal.Title>City Master</Modal.Title>
                    <Button
                        style={{
                            background: "none",
                            border: "none",
                            fontSize: "1.5rem",
                            cursor: "pointer",
                            color: "blue",
                            position: "absolute",
                            right: "10px",
                        }}
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
                                    <th>
                                        <input
                                            type="checkbox"
                                            checked={selectAllChecked}
                                            onChange={(e) => {
                                                const checked = e.target.checked;
                                                setSelectAllChecked(checked);
                                                if (checked) {
                                                    setSelectedCityRows(filteredData);
                                                } else {
                                                    setSelectedCityRows([]);
                                                }
                                            }}
                                        />
                                    </th>
                                    <th>City Code</th>
                                    <th>City Name</th>
                                    <th>City Id</th>
                                    <th>Pin Code</th>
                                </tr>
                            </thead>
                            <tbody>
                                {itemsToDisplay.map((item, index) => (
                                    <tr
                                        key={index}
                                        className={selectedRowIndex === index ? "selected-row" : ""}
                                        onDoubleClick={() => handleRecordDoubleClick(item)}
                                    >
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={selectedCityRows.some(row => row.city_code === item.city_code)}
                                                onChange={() => handleCityCheckboxChange(item)}
                                            />
                                        </td>
                                        <td>{item.city_code}</td>
                                        <td>{item.city_name_e}</td>
                                        <td>{item.cityid}</td>
                                        <td>{item.pincode}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="success" onClick={handleConfirmSelection}>
                        Confirm
                    </Button>

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

export default CityBroadCastHelp;
