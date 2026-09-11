import React, { useState, useEffect, useCallback } from "react";
import { Button, Modal, Table } from "react-bootstrap";
import axios from "axios";
import DataTableSearch from "../Common/HelpCommon/DataTableSearch";
import DataTablePagination from "../Common/HelpCommon/DataTablePagination";
import "../App.css";

const CompanyCode = sessionStorage.getItem("Company_Code");
const YearCode = sessionStorage.getItem("Year_Code");
const API_URL = process.env.REACT_APP_API;

var lActiveInputFeild = "";

const RecieptVoucherNoHelp = ({ onAcCodeClick, name, VoucherNo, tabIndexHelp, disabledFeild, Accode, onTenderDetailsFetched, FilterType, Tran_Type }) => {
    const [showModal, setShowModal] = useState(false);
    const [popupContent, setPopupContent] = useState([]);
    const [enteredTenderno, setenteredTenderno] = useState("");
    const [enteredTranType, setenteredTranType] = useState("");
    const [enteredFilterType, setenteredFilterType] = useState("");
    const [enteredAccode, setenteredAccode] = useState("");

    const [enteredTenderid, setEnteredTenderid] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [selectedRowIndex, setSelectedRowIndex] = useState(-1);
    const [apiDataFetched, setApiDataFetched] = useState(false);

    const fetchData = useCallback(async () => {
        
        try {
            const response = await axios.get(`${API_URL}/RecieptVoucherNo?CompanyCode=${CompanyCode}&Tran_Type=${Tran_Type}&FilterType=${FilterType}&Accode=${Accode}&Year_Code=${YearCode}`);
            const data = response.data.last_details_data;

            setPopupContent(data);
            setApiDataFetched(true);



        } catch (error) {
            console.error("Error fetching data:", error);
        }
    });

    const fetchTenderDetails = async (Tran_Type, VoucherNo, Autoid) => {
        try {
            
            const url = `${API_URL}/getRecieptVoucherNo_Data?CompanyCode=${CompanyCode}&Tran_Type=${Tran_Type}&FilterType=${FilterType}&Autoid=${Autoid}&Year_Code=${YearCode}&VoucherNo=${VoucherNo}`;
            const response = await axios.get(url);
            const details = response.data;
            onTenderDetailsFetched(details)
        } catch (error) {
            console.error("Error fetching tender details:", error);
        }
    };


    const fetchAndOpenPopup = async () => {
        if (!apiDataFetched) {
            await fetchData();
        }
        setShowModal(true);
    };

    const handleButtonClicked = () => {
        fetchAndOpenPopup();
    };

    const handleCloseModal = () => {
        setShowModal(false);
    };

    const handleCodeChange = async (event) => {
        const { value } = event.target;
        setenteredTenderno(value);

        setEnteredTenderid(value);

        if (!apiDataFetched) {
            await fetchData();
        }

        const matchingItem = popupContent.find((item) => item.Accode === parseInt(value, 10));

        if (matchingItem) {
            setenteredTenderno(matchingItem.doc_no);
            setEnteredTenderid(matchingItem.Autoid);
            setenteredFilterType(matchingItem.FilterType);
            setenteredTranType(matchingItem.Tran_Type);


            fetchTenderDetails(matchingItem.Tran_Type, matchingItem.doc_no, matchingItem.Autoid)


            if (onAcCodeClick) {
                onAcCodeClick(matchingItem.Accode);

            }



        } else {
            setenteredTenderno("");
            setEnteredTenderid("");

        }
    };

    const handleRecordDoubleClick = (item) => {
        
        setenteredTenderno(item.doc_no);
        setEnteredTenderid(item.Autoid);
        setenteredFilterType(item.FilterType);
        setenteredTranType(item.Tran_Type);


        fetchTenderDetails(item.Tran_Type, item.doc_no, item.Autoid)


        if (onAcCodeClick) {
            onAcCodeClick(item.Accode);
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
        (item.PartyName ? item.PartyName.toLowerCase().includes(searchTerm.toLowerCase()) : false) ||
        (item.Shortname ? item.Shortname.toLowerCase().includes(searchTerm.toLowerCase()) : false)
    );

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const itemsToDisplay = filteredData.slice(startIndex, endIndex);

    useEffect(() => {
        if (VoucherNo === "") {
            setenteredTenderno("");
        } else {
            setenteredTenderno(VoucherNo);
        }
    }, [VoucherNo]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === "F1") {
                if (event.target.id === name) {
                    lActiveInputFeild = name;
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
                        value={enteredTenderno}
                        onChange={handleCodeChange}
                        style={{ width: "100px", height: "35px" }}
                        tabIndex={tabIndexHelp}
                        disabled={disabledFeild}
                    />
                    <Button
                        variant="primary"
                        onClick={handleButtonClicked}
                        className="ms-1"
                        style={{ width: "30px", height: "35px"}}
                        disabled={disabledFeild}
                    >
                        ...
                    </Button>
                    {/* <input
                        type="text"
                        className="form-control ms-2"
                        id={name}
                        autoComplete="off"
                        value={enteredTenderid !== '' ? enteredTenderid : Tenderid}
                        onChange={handleCodeChange}
                        style={{ width: "150px", height: "35px" }}
                        tabIndex={tabIndexHelp}
                        disabled={disabledFeild}
                    /> */}
                </div>
            </div>

            <Modal
                show={showModal}
                onHide={handleCloseModal}
                dialogClassName="modal-dialog"

            >
                <Modal.Header closeButton>
                    <Modal.Title>Popup</Modal.Title>
                </Modal.Header>
                <DataTableSearch data={popupContent} onSearch={handleSearch} />
                <Modal.Body>
                    {Array.isArray(popupContent) ? (
                        <div className="table-responsive">
                            <table className="custom-table" style={{ maxWidth: "550px", height: "500px" }}>
                                <thead>
                                    <tr>
                                        <th>   doc_no</th>
                                        <th>Doc_date</th>
                                        <th>    Bill_Amount</th>
                                        <th>  BALANCE</th>
                                        <th>  received</th>
                                        <th>  NETQNTL</th>
                                        <th>  PartyName</th>
                                        <th>   Shortname</th>
                                        <th>   Tran_Type</th>
                                        <th>  EntryYearCode</th>
                                        <th>   adjAmt</th>
                                        <th>Adj_Amt</th>
                                        <th>  Autoid</th>
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
                                            <td>{item.doc_no}</td>
                                            <td>{item.Doc_date}</td>
                                            <td>{item.Bill_Amount}</td>
                                            <td>{item.BALANCE}</td>
                                            <td>{item.received}</td>
                                            <td>{item.NETQNTL}</td>
                                            <td>{item.PartyName}</td>
                                            <td>{item.Shortname}</td>
                                            <td>{item.Tran_Type}</td>

                                            <td>{item.EntryYearCode}</td>
                                            <td>{item.adjAmt}</td>
                                            <td>{item.Adj_Amt}</td>
                                            <td>{item.Autoid}</td>


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
                    <Button variant="secondary" onClick={handleCloseModal}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default RecieptVoucherNoHelp;
