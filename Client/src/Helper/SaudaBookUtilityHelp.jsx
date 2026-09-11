import React, { useState, useEffect, useCallback } from "react";
import { Button, Modal } from "react-bootstrap";
import axios from "axios";
import DataTableSearch from "../Common/HelpCommon/DataTableSearch";
import DataTablePagination from "../Common/HelpCommon/DataTablePagination";
import { Box } from "@mui/material";
import "../App.css";

const API_URL = process.env.REACT_APP_API;
let lActiveInputFeild = "";

const SaudaBookUtilityHelp = ({
  onRecordDoubleClick,
  name,
  Tenderno,
  Tenderid,
  tabIndexHelp,
  disabledFeild,
  Millcode,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [popupContent, setPopupContent] = useState([]);
  const [enteredTenderno, setenteredTenderno] = useState("");
  const [enteredTenderid, setEnteredTenderid] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedRowIndex, setSelectedRowIndex] = useState(-1);
  const [apiDataFetched, setApiDataFetched] = useState(false);
  const CompanyCode = sessionStorage.getItem("Company_Code");

  useEffect(() => {
    setenteredTenderno("");
    setEnteredTenderid("");
    setPopupContent([]);
    setApiDataFetched(false);
  }, [Millcode]);

  const fetchData = useCallback(async () => {
    try {
      const response = await axios.get(
        `${API_URL}/SaudaBookUtilityHelp?CompanyCode=${CompanyCode}&MillCode=${Millcode}`
      );
      setPopupContent(response.data);
      setApiDataFetched(true);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, [CompanyCode, Millcode]);

  const fetchAndOpenPopup = async () => {
    if (!apiDataFetched) {
      await fetchData();
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleButtonClicked = () => {
    fetchAndOpenPopup();
  };

  const handleCodeChange = async (event) => {
    const { value } = event.target;
    setenteredTenderno(value);
    setEnteredTenderid(value);

    if (!apiDataFetched) {
      await fetchData();
    }

    const matchingItem = popupContent.find(
      (item) => item.Tender_No === parseInt(value, 10)
    );

    if (matchingItem) {
      setenteredTenderno(matchingItem.Tender_No);
      setEnteredTenderid(matchingItem.ID);

      if (onRecordDoubleClick) {
        onRecordDoubleClick(matchingItem); 
      }
    } else {
      setenteredTenderno("");
      setEnteredTenderid("");
    }
  };

  const handleRecordDoubleClick = (item) => {
    setenteredTenderno(item.Tender_No);
    setEnteredTenderid(item.ID);

    if (onRecordDoubleClick) {
      onRecordDoubleClick(item); 
    }

    setShowModal(false);
  };

  const handleSearch = (searchValue) => {
    setSearchTerm(searchValue);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const filteredData = popupContent.filter((item) =>
    item.Grade?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const itemsToDisplay = filteredData.slice(startIndex, endIndex);

  useEffect(() => {
    if (Tenderno === "" || Tenderid === "") {
      setenteredTenderno("");
      setEnteredTenderid("");
    } else {
      setenteredTenderno(Tenderno);
      setEnteredTenderid(Tenderid);
    }
  }, [Tenderno, Tenderid]);

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
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [name, fetchAndOpenPopup]);

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
          className="form-control"
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
          style={{ width: "30px", height: "35px" }}
          disabled={disabledFeild}
        >
          ...
        </Button>
        {/* <input
          type="text"
          className="form-control ms-2"
          id={`${name}_id`}
          autoComplete="off"
          value={enteredTenderid}
          style={{ width: "30px", height: "35px" }}
          disabled
        /> */}
      </div>

      {/* Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg" centered>
        <Modal.Header style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Modal.Title>Sauda Book Utility</Modal.Title>
          <Button
            style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'blue', position: 'absolute', right: '10px' }}
            onClick={handleCloseModal}
          >
            X
          </Button>
        </Modal.Header>

        <DataTableSearch data={popupContent} onSearch={handleSearch} />

        <Modal.Body style={{ padding: "0" }}>
          <div className="table-responsive">
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              marginBottom: "1rem",
              backgroundColor: "#fff",
            }}>
              <thead>
                <tr style={{ backgroundColor: "#f8f9fa" }}>
                  <th>Tender No</th>
                  <th>Lifting Date</th>
                  <th>Do Name</th>
                  <th>Grade</th>
                  <th>Mill Rate</th>
                  <th>Balance</th>
                  <th>Quantal</th>
                  <th>Season</th>
                  <th>Purc Rate</th>
                </tr>
              </thead>
              <tbody>
                {itemsToDisplay.map((item, index) => (
                  <tr
                    key={index}
                    className={selectedRowIndex === index ? "selected-row" : ""}
                    onDoubleClick={() => handleRecordDoubleClick(item)}
                  >
                    <td>{item.Tender_No}</td>
                    <td>{item.Lifting_Date}</td>
                    <td>{item.tenderdoname}</td>
                    <td>{item.Grade}</td>
                    <td>{item.Mill_Rate}</td>
                    <td>{item.balance}</td>
                    <td>{item.Quantal}</td>
                    <td>{item.season}</td>
                    <td>{item.Purc_Rate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Modal.Body>

        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <DataTablePagination
            totalItems={filteredData.length}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
          />
        </Box>

        {/* <Modal.Footer className="d-flex justify-content-between">
          <DataTablePagination
            totalItems={filteredData.length}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
          />
       
        </Modal.Footer> */}
      </Modal>
    </div>
  );
};

export default SaudaBookUtilityHelp;
