

import React, { useState, useEffect } from "react";
import { Button, Modal } from "react-bootstrap";
import { useAccountMaster } from "./AccountMasterContext";
import DataTableSearch from "../Common/HelpCommon/DataTableSearch";
import DataTablePagination from "../Common/HelpCommon/DataTablePagination";

let lActiveInputFeild = "";

const MultipleAccountMasterHelp = ({
    onAcCodeClick,
    name,
    CategoryName,
    CategoryCode,
    tabIndexHelp,
    disabledFeild,
    Ac_type,
    firstInputRef
}) => {
    const { accountData, setAcTypeFilter, refreshData } = useAccountMaster();

    const [showModal, setShowModal] = useState(false);
    const [enteredAcCode, setEnteredAcCode] = useState("");
    const [enteredAcName, setEnteredAcName] = useState("");
    const [enteredAccoid, setEnteredAccoid] = useState("");
    const [enteredMobNo, setEnteredMobNo] = useState("");
    const [city, setCity] = useState("");

    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedRowIndex, setSelectedRowIndex] = useState(-1);

    const itemsPerPage = 10;
    const [selectedAccounts, setSelectedAccounts] = useState([]);

    useEffect(() => {
        if (accountData.length && Ac_type) {
            setAcTypeFilter(Array.isArray(Ac_type) ? Ac_type : [Ac_type]);
        }
    }, [accountData, Ac_type, setAcTypeFilter]);

    /* 🔥 SYNC FROM PARENT */
    useEffect(() => {
        if (!CategoryCode) {
            clearAll();
        } else {
            setEnteredAcCode(CategoryCode);
            setEnteredAcName(CategoryName || "");
        }
    }, [CategoryCode, CategoryName]);



    const clearAll = () => {
        setEnteredAcCode("");
        setEnteredAcName("");
        setEnteredAccoid("");
        setEnteredMobNo("");
        setCity("");
        setSelectedAccounts([]);
        onAcCodeClick([]);
    };

    const isSelected = (item) =>
        selectedAccounts.some(a => a.accoid === item.accoid);



    const handleButtonClicked = () => {
        refreshData();
        setShowModal(true);
    };

    const handleAcCodeChange = (e) => {
        const value = e.target.value;
        setEnteredAcCode(value);

        if (!value) {
            clearAll();
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Tab" && e.target.id === name) {
            const item = accountData.find(
                i => String(i.Ac_Code) === enteredAcCode
            );

            if (item) {
                applySingleSelection(item);
            }
        }
    };

    const applySingleSelection = (item) => {
        setEnteredAcCode(item.Ac_Code);
        setEnteredAcName(item.Ac_Name_E);
        setEnteredAccoid(item.accoid);
        setEnteredMobNo(item.Mobile_No);
        setCity(item.cityname);

        setSelectedAccounts([item]);
        onAcCodeClick([item]);
    };


    const handleCheckboxChange = (item) => {
        setSelectedAccounts(prev => {
            const exists = prev.some(a => a.accoid === item.accoid);
            return exists
                ? prev.filter(a => a.accoid !== item.accoid)
                : [...prev, item];
        });
    };


    const handleSelectClick = () => {
        if (selectedAccounts.length === 0) return;

        const last = selectedAccounts[selectedAccounts.length - 1];

        setEnteredAcCode(last.Ac_Code);
        setEnteredAcName(last.Ac_Name_E);
        setCity(last.cityname);

        onAcCodeClick([...selectedAccounts]);
        setShowModal(false);
    };


    const handleRecordDoubleClick = (item) => {
        applySingleSelection(item);
        setShowModal(false);
    };



    const filteredData = accountData.filter(item =>
        Object.values(item).some(val =>
            String(val ?? "")
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
        )
    );

    const startIndex = (currentPage - 1) * itemsPerPage;
    const itemsToDisplay = filteredData.slice(
        startIndex,
        startIndex + itemsPerPage
    );

    useEffect(() => {
        setSelectedRowIndex(-1);
    }, [searchTerm, currentPage]);



    useEffect(() => {
        const handler = (e) => {
            if (e.key === "F1" && e.target.id === name) {
                lActiveInputFeild = name;
                setSearchTerm(e.target.value);
                handleButtonClicked();
                e.preventDefault();
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [name]);

    /* ================= JSX ================= */


        const handleCloseModal = () => {
        setShowModal(false);
    };


    return (
        <div className="d-flex">
            <input
                ref={firstInputRef}
                id={name}
                className="form-control ms-2"
                style={{ width: "100px", height: "35px" }}
                value={enteredAcCode}
                onChange={handleAcCodeChange}
                onKeyDown={handleKeyDown}
                tabIndex={tabIndexHelp}
                disabled={disabledFeild}
            />

            <Button
                className="ms-1"
                style={{ width: "30px", height: "35px" }}
                onClick={handleButtonClicked}
                disabled={disabledFeild}
            >
                ...
            </Button>

            <label className="ms-2 fw-bold mt-1">
                {enteredAcName} {city}
            </label>

            <Modal show={showModal} onHide={() => setShowModal(false)} size="xl">
               <Modal.Header style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                  <Modal.Title>Account Master</Modal.Title>
                                  <Button
                                      style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'blue', position: 'absolute', right: '10px' }}
                                      onClick={handleCloseModal}
                                  >
                                      X
                                  </Button>
                              </Modal.Header>
                <DataTableSearch data={accountData} onSearch={setSearchTerm} />

                <Modal.Body>
                    <table className="table table-bordered">
                        <thead>
                            <tr>
                                <th>Select</th>
                                <th>Code</th>
                                <th>Name</th>
                                <th>City</th>
                                <th>Mobile</th>
                                <th>GST</th>
                                <th>Type</th>
                            </tr>
                        </thead>
                        <tbody>
                            {itemsToDisplay.map(item => (
                                <tr
                                    key={item.accoid}
                                    style={{
                                        backgroundColor: isSelected(item)
                                            ? "#d6e9f9"
                                            : ""
                                    }}
                                >
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={isSelected(item)}
                                            onChange={() => handleCheckboxChange(item)}
                                        />
                                    </td>
                                    <td>{item.Ac_Code}</td>
                                    <td>{item.Ac_Name_E}</td>
                                    <td>{item.cityname}</td>
                                    <td>{item.Mobile_No}</td>
                                    <td>{item.Gst_No}</td>
                                    <td>{item.Ac_type}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Modal.Body>

                <Modal.Footer className=" justify-content-between">
                    <span>Selected: {selectedAccounts.length}</span>
                    <Button
                        variant="success"
                        disabled={selectedAccounts.length === 0}
                        onClick={handleSelectClick}
                    >
                        Select
                    </Button>

                    <DataTablePagination
                        totalItems={filteredData.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                    />
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default MultipleAccountMasterHelp;
