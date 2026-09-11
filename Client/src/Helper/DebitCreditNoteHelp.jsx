import React, { useState, useEffect } from "react";
import { Button, Modal } from "react-bootstrap";
import DataTableSearch from "../Common/HelpCommon/DataTableSearch";
import DataTablePagination from "../Common/HelpCommon/DataTablePagination";
import axios from "axios";
import "../App.css";

var lActiveInputFeild = "";

const API_URL = process.env.REACT_APP_API;

const DebitCreditNoteHelp = ({ onAcCodeClick, name, ac_code, billNo, billId, OnFetchedData, disabledFeild, tabIndexHelp, tran_type }) => {
    const CompanyCode = sessionStorage.getItem("Company_Code")
    const [showModal, setShowModal] = useState(false);
    const [popupContent, setPopupContent] = useState([]);
    const [enteredAcCode, setEnteredAcCode] = useState(billNo || "");
    const [enteredBillId, setEnteredBillId] = useState(billId || "");
    const [type, setType] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [selectedRowIndex, setSelectedRowIndex] = useState(-1);
    const [apiDataFetched, setApiDataFetched] = useState(false);

    const fetchAndOpenPopup = async () => {

        try {
            const response = await axios.get(`${API_URL}/debit_credit_help?company_code=${CompanyCode}&ac_code=${ac_code}&tran_type=${tran_type}`);
            const data = response.data;

            const filteredData = data.filter(item =>
                (item.BillToName ? item.BillToName.toLowerCase().includes(searchTerm.toLowerCase()) : false) ||
                (item.MillName ? item.MillName.toLowerCase().includes(searchTerm.toLowerCase()) : false) ||
                (item.Party_Name ? item.Party_Name.toLowerCase().includes(searchTerm.toLowerCase()) : false) ||
                (item.ShipToName ? item.ShipToName.toLowerCase().includes(searchTerm.toLowerCase()) : false)
            );
            setPopupContent(filteredData);
            setShowModal(true);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!ac_code) {
                console.error("No account code provided.");
                return;
            }

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

    }, [apiDataFetched, ac_code]);

    const handleMillCodeButtonClick = () => {
        lActiveInputFeild = name
        fetchAndOpenPopup();
        if (onAcCodeClick) {
            onAcCodeClick();
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
    };

    const handleAcCodeChange = async (event) => {
        const { value } = event.target;
        setEnteredAcCode(value);
        try {
            const response = await axios.get(`${API_URL}/debit_credit_help?company_code=${CompanyCode}&ac_code=${ac_code}&tran_type=${tran_type}`);
            const data = response.data;
            setPopupContent(data);
            setApiDataFetched(true);

            const matchingItem = data.find((item) => item.doc_no === parseInt(value, 10));

            if (matchingItem) {

                setEnteredAcCode(matchingItem.doc_no);

                if (['CN', 'DN'].includes(tran_type)) {
                    setEnteredBillId(matchingItem.Billid);
                    if (onAcCodeClick) {
                        onAcCodeClick(matchingItem.doc_no, matchingItem.Billid, matchingItem.docdate);
                    }
                } else {
                    setEnteredBillId(matchingItem.purchaseid);
                    if (onAcCodeClick) {
                        onAcCodeClick(matchingItem.doc_no, matchingItem.purchaseid, matchingItem.docdate);
                    }
                }
                OnFetchedData(matchingItem)
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    const handleRecordDoubleClick = (item) => {
        if (lActiveInputFeild === name) {
            setEnteredAcCode(item.doc_no);
            if (['CN', 'DN'].includes(tran_type)) {
                setEnteredBillId(item.Billid);
                if (onAcCodeClick) {
                    onAcCodeClick(item.doc_no, item.Billid, item.docdate);
                }
            } else {
                setEnteredBillId(item.purchaseid);
                if (onAcCodeClick) {
                    onAcCodeClick(item.doc_no, item.purchaseid, item.docdate);
                }
            }
            OnFetchedData(item);
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
        item.Party_Name && item.Party_Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.MillName && item.MillName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.ShipToName && item.ShipToName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.BillToName && item.BillToName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.doc_no && item.doc_no.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const itemsToDisplay = filteredData.slice(startIndex, endIndex);

    useEffect(() => {
        if (billNo === "" || billId === "") {
            setEnteredAcCode("");
            setEnteredBillId("");
        } else {
            setEnteredAcCode(billNo);
            setEnteredBillId(billId)
        }
    }, [billNo, billId]);

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
                    <label id="name" className="form-labels ms-2" style={{ whiteSpace: 'nowrap', fontSize: "14px", fontWeight: "bold", marginTop: "5px" }}>
                        Bill Id - {enteredBillId}
                    </label>
                </div>
            </div>
            <Modal
                show={showModal}
                onHide={handleCloseModal}
                dialogClassName="modal-dialog"
            >

                <Modal.Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Modal.Title>Transaction Details</Modal.Title>
                    <Button
                        style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'blue' }}
                        onClick={handleCloseModal}
                    >
                        X
                    </Button>
                </Modal.Header>

                <DataTableSearch data={popupContent} onSearch={handleSearch} />
                <Modal.Body>
                    {Array.isArray(popupContent) && popupContent.length > 0 ? (
                        <div className="table-responsive">
                            <table className="custom-table">
                                <thead>
                                    {['CN', 'DN'].includes(tran_type) ? (
                                        <tr>
                                            <th>Bill Id</th>
                                            <th>Doc No</th>
                                            <th>Doc Date</th>
                                            <th>Ac_Code</th>
                                            <th>Party Name</th>
                                            <th>Amount</th>
                                            <th>Tran Type</th>
                                            <th>Ship To</th>
                                            <th>Ship To Name</th>
                                            <th>Mill Code</th>
                                            <th>Mill Name</th>
                                            <th>Bill To</th>
                                            <th>Bill To Name</th>
                                            <th>Uc</th>
                                            <th>Mc</th>
                                            <th>Bt</th>
                                            <th>Qty</th>
                                            <th>Bill YC</th>
                                        </tr>
                                    ) : (
                                        <tr>
                                            <th>Purchase Id</th>
                                            <th>Doc No</th>
                                            <th>Doc Date</th>
                                            <th>Ac_Code</th>
                                            <th>Party Name</th>
                                            <th>Net Payable</th>
                                            <th>Tran Type</th>
                                            <th>Ship To</th>
                                            <th>Ship To Name</th>
                                            <th>Mill Code</th>
                                            <th>Mill Name</th>
                                            <th>Uc</th>
                                            <th>Mc</th>
                                            <th>Qty</th>
                                            <th>Bill YC</th>
                                        </tr>
                                    )}
                                </thead>
                                <tbody>
                                    {itemsToDisplay.map((item, index) => (
                                        <tr
                                            key={index}
                                            className={selectedRowIndex === index ? "selected-row" : ""}
                                            onDoubleClick={() => handleRecordDoubleClick(item)}
                                        >
                                            {['CN', 'DN'].includes(tran_type) ? (
                                                <>
                                                    <td>{item.Billid}</td>
                                                    <td>{item.doc_no}</td>
                                                    <td>{item.docdate}</td>
                                                    <td>{item.Ac_Code}</td>
                                                    <td>{item.Party_Name}</td>
                                                    <td>{item.Amount}</td>
                                                    <td>{item.Tran_Type}</td>
                                                    <td>{item.ShipTo}</td>
                                                    <td>{item.ShipToName}</td>
                                                    <td>{item.MillCode}</td>
                                                    <td>{item.MillName}</td>
                                                    <td>{item.Bill_To}</td>
                                                    <td>{item.BillToName}</td>
                                                    <td>{item.uc}</td>
                                                    <td>{item.mc}</td>
                                                    <td>{item.bt}</td>
                                                    <td>{item.Qty}</td>
                                                    <td>{item.BillYC}</td>
                                                </>
                                            ) : (
                                                <>
                                                    <td>{item.purchaseid}</td>
                                                    <td>{item.doc_no}</td>
                                                    <td>{item.docdate}</td>
                                                    <td>{item.Ac_Code}</td>
                                                    <td>{item.Party_Name}</td>
                                                    <td>{item.Amount}</td>
                                                    <td>{item.Tran_Type}</td>
                                                    <td>{item.ShipTo}</td>
                                                    <td>{item.ShipToName}</td>
                                                    <td>{item.MillCode}</td>
                                                    <td>{item.MillName}</td>
                                                    <td>{item.uc}</td>
                                                    <td>{item.mc}</td>
                                                    <td>{item.Qty}</td>
                                                    <td>{item.BillYC}</td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div>Loading...</div>
                    )}
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

export default DebitCreditNoteHelp;