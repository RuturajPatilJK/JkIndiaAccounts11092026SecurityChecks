import React, { useState, useEffect } from "react";
import { Button, Modal } from "react-bootstrap";
import DataTableSearch from "../../Common/HelpCommon/DataTableSearch";
import DataTablePagination from "../../Common/HelpCommon/DataTablePagination";
import axios from "axios";
import "../../App.css";

var lActiveInputFeild = "";
const API_URL = process.env.REACT_APP_API;

const RackMillStationLinkInfoHelp = ({ onAcCodeClick, name, id,stationName,tableData,disabledFeild,tabIndexHelp,type}) => {

    const [showModal, setShowModal] = useState(false);
    const [popupContent, setPopupContent] = useState([]);
    const [enteredAcCode, setEnteredAcCode] = useState("");
    const [enteredName, setEnteredname] = useState();
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [selectedRowIndex, setSelectedRowIndex] = useState(-1);
    const [apiDataFetched, setApiDataFetched] = useState(false);

    // Fetch data based on acType
    const fetchAndOpenPopup = async () => {
        
        try {
            const response = await axios.get(`${API_URL}/getStationMaster?Station_type=${type}`);
            const data = response.data;
            const filteredData = data.filter(item => 
                (item.Station_name ? item.Station_name.toLowerCase().includes(searchTerm.toLowerCase()) : false) 
            );
            
            setPopupContent(filteredData);
            setShowModal(true);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    useEffect(() => {
        setEnteredAcCode(id);
    }, [id]);

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

     useEffect(() => {
            if (id === "" || stationName === "") {
                setEnteredAcCode("");
                setEnteredname("");
            } else {
                setEnteredAcCode(id);
                setEnteredname(stationName);
            }
        }, [id, stationName]);



    // Handle Mill Code button click
    const handleStationIdButton = () => {
        lActiveInputFeild=name
        fetchAndOpenPopup();
        if (onAcCodeClick) {
            onAcCodeClick({ enteredAcCode, enteredName });
        }
    };

    //popup functionality show and hide
    const handleCloseModal = () => {
        setShowModal(false);
    };

    //handle onChange event for Mill Code,Broker Code and Bp Account
    const handleStationIdChange = async (event) => {
        const { value } = event.target;
        setEnteredAcCode(value);


        try {
            // Assuming `apiURL` is defined somewhere in your code
            const response = await axios.get(`${API_URL}/getStationMaster?Station_type=${type}`);
            const data = response.data;
            setPopupContent(data);
            setApiDataFetched(true);

            const matchingItem = data.find((item) => item.Id === parseInt(value, 10));

            if (matchingItem) {
              
                setEnteredAcCode(matchingItem.Id);
                setEnteredname(matchingItem.Station_name)
                
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    const fetchStationMillLinkInfo = async (id) => {
        try {
            
            const response = await axios.get(`${API_URL}/get_MillStationInfoById?Id=${id}`);
            const onTableData = response.data;
            tableData(onTableData)
        } catch (error) {
            console.error("Error fetching SaleBill data:", error);
        }
    };
    

    //After open popup onDoubleClick event that record display on the feilds
    const handleRecordDoubleClick = (item) => {
        if (lActiveInputFeild === name) {
            setEnteredAcCode(item.Id);
            setEnteredname(item.Station_name)

            fetchStationMillLinkInfo(item.Id);
           

            if (onAcCodeClick) {
                onAcCodeClick(item.Id,item.Station_name);
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
        item.Station_name && item.Station_name.toLowerCase().includes(searchTerm.toLowerCase())

    );

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const itemsToDisplay = filteredData.slice(startIndex, endIndex);

     useEffect(() => {
            if (id === "") {
                setEnteredAcCode("");
            } else {
                setEnteredAcCode(id);
            }
        }, [id]);

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
                        onChange={handleStationIdChange}
                        style={{ width: "150px", height: "35px" }}
                        disabled={disabledFeild}
                        tabIndex={tabIndexHelp}

                    />
                    <Button
                      
                        variant="primary"
                        onClick={handleStationIdButton}
                        className="ms-1"
                        style={{ width: "30px", height: "35px" }}
                        disabled={disabledFeild}
                        tabIndex={tabIndexHelp}
                    >
                        ...
                    </Button>
                    <label id="name" className="form-labels ms-2"  style={{ whiteSpace: 'nowrap',fontSize:"14px",fontWeight:"bold",marginTop:"5px"}}>
                    {enteredName}
                    </label>
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
                            <table className="custom-table">
                                <thead>
                                    <tr>
                                        <th>Id</th>
                                        <th>Station Code</th>
                                        <th>Station Name</th>
                                        <th>Station Type</th>

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
                                            <td>{item.Id}</td>
                                            <td>{item.Station_code}</td>
                                            <td>{item.Station_name}</td>
                                            <td>{item.Station_type}</td>

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

export default RackMillStationLinkInfoHelp;