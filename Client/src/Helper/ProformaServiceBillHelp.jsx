import React, { useState, useEffect } from "react";
import { Button, Modal } from "react-bootstrap";
import DataTableSearch from "../Common/HelpCommon/DataTableSearch";
import DataTablePagination from "../Common/HelpCommon/DataTablePagination";
import axios from "axios";
import "../App.css";

var lActiveInputFeild = "";
const API_URL = process.env.REACT_APP_API;


const ProformaServiceBillhelp = ({ onAcCodeClick, name, ProformaServicebillno, Proformaid, Customer_Code, onFetchedData, disabledFeild, tabIndexHelp, Type }) => {

    const CompanyCode = sessionStorage.getItem("Company_Code")
    const Year_Code = sessionStorage.getItem("Year_Code");

    const [showModal, setShowModal] = useState(false);
    const [popupContent, setPopupContent] = useState([]);
    const [enteredAcCode, setEnteredAcCode] = useState("");
    const [enteredProformaid, setEnteredProformaid] = useState(Proformaid || "");
    const [type, setType] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [selectedRowIndex, setSelectedRowIndex] = useState(-1);
    const [apiDataFetched, setApiDataFetched] = useState(false);

    const fetchAndOpenPopup = async () => {
        try {
            const response = await axios.get(`${API_URL}/ProformaServiceBill?Company_Code=${CompanyCode}&Customer_Code=${Customer_Code}`);
            const data = response.data;
            const filteredData = data.filter(item =>
                (item.Ac_Name_E ? item.Ac_Name_E.toLowerCase().includes(searchTerm.toLowerCase()) : false)
                // (item.MillName ? item.MillName.toLowerCase().includes(searchTerm.toLowerCase()) : false)
            );
            setPopupContent(filteredData);
            setShowModal(true);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    // useEffect(() => {
    //     setEnteredAcCode(Customer_Code);
    //     setType(Type);
    // }, [Customer_Code, Type]);

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
        lActiveInputFeild = name
        fetchAndOpenPopup();
        if (onAcCodeClick) {
            onAcCodeClick({ enteredAcCode });
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
    };

    const handleAcCodeChange = async (event) => {
        const { value } = event.target;
        setEnteredAcCode(value);
        try {
            const response = await axios.get(`${API_URL}/ProformaServiceBill?Company_Code=${CompanyCode}&Customer_Code=${Customer_Code}`);
            const data = response.data;
            setPopupContent(data);
            setApiDataFetched(true);
            const matchingItem = data.find((item) => item.Doc_No === parseInt(value, 10));
            if (matchingItem) {

                setEnteredAcCode(matchingItem.Doc_No);
                setType(matchingItem.Tran_Type)
                setEnteredProformaid(matchingItem.rbid)
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    const fetchSaleBillData = async (Doc_No) => {
        try {
            const response = await axios.get(`${API_URL}/getproformaservicebillByid?Company_Code=${CompanyCode}&Year_Code=${Year_Code}&Doc_No=${Doc_No}`);
            const fetchedData = response.data;
            const saleBillHead = response.data.service_bill_head;
            const saleBillDetail = response.data.service_bill_details[0];
            const serviceLabels = response.data.service_labels || [];
            // OnSaleBillHead(saleBillHead)
            // OnSaleBillDetail(saleBillDetail)

            // if (OnSaleLabels) {
            //     OnSaleLabels(serviceLabels);  
            // }
            onFetchedData(fetchedData)
        } catch (error) {
            console.error("Error fetching SaleBill data:", error);
        }
    };

    const handleRecordDoubleClick = (item) => {
        if (lActiveInputFeild === name) {
            setEnteredAcCode(item.Doc_No);
            // setType(item.Tran_Type)
            fetchSaleBillData(item.Doc_No);
            setEnteredProformaid(item.rbid);
            if (onAcCodeClick) {
                onAcCodeClick(item.Doc_No,item.rbid);
            } 
            // onFetchedData(item);
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
            item.Ac_Name_E && item.Ac_Name_E.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const itemsToDisplay = filteredData.slice(startIndex, endIndex);

        useEffect(() => {
            if (ProformaServicebillno === "" || Proformaid === "") {
                setEnteredAcCode("");
                setEnteredProformaid("");
            } else {
                setEnteredAcCode(ProformaServicebillno);
                setEnteredProformaid(Proformaid);
            }
        }, [ProformaServicebillno, Proformaid]);

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
                            Proforma Id - {enteredProformaid}
                        </label>
                    </div>
                </div>
                <Modal
                    show={showModal}
                    onHide={handleCloseModal}
                    dialogClassName="modal-dialog"
                >
                    <Modal.Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Modal.Title>Proforma Service Bill</Modal.Title>
                        <Button
                            style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'blue' }}
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
                                            <th>Id</th>
                                            <th>Doc_no</th>
                                            <th>Date</th>
                                            <th>Customer Code</th>
                                            <th>Account Name</th>
                                            <th>cc</th>
                                            <th>Amount</th>
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
                                                <td>{item.rbid}</td>
                                                <td>{item.Doc_No}</td>
                                                <td>{item.Date}</td>
                                                <td>{item.Customer_Code}</td>
                                                <td>{item.Ac_Name_E}</td>
                                                <td>{item.cc}</td>
                                                <td>{item.Amount}</td>
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
                        {/* <Button variant="secondary" onClick={handleCloseModal}>
                        Close
                    </Button> */}
                    </Modal.Footer>
                </Modal>
            </div>
        );
    };

    export default ProformaServiceBillhelp;