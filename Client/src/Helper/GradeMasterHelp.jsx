import React, { useState, useEffect, useCallback } from "react";
import { Button, Modal, Table } from "react-bootstrap";
import axios from "axios";
import DataTableSearch from "../Common/HelpCommon/DataTableSearch";
import DataTablePagination from "../Common/HelpCommon/DataTablePagination";
import "../App.css";

const CompanyCode = sessionStorage.getItem("Company_Code");
var lActiveInputFeild = "";
const API_URL = process.env.REACT_APP_API;

const GradeMasterHelp = ({
  name,
  onAcCodeClick,
  onCategoryChange, // New callback prop
  CategoryName,
  tabIndexHelp,
  disabledField,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [popupContent, setPopupContent] = useState([]);
  const [enteredName, setEnteredName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedRowIndex, setSelectedRowIndex] = useState(-1);
  const [apiDataFetched, setApiDataFetched] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const response = await axios.get(
        `${API_URL}/system_master_help?CompanyCode=${CompanyCode}&SystemType=S`
      );
      const data = response.data;
      setPopupContent(data);
      setApiDataFetched(true);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, []);

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
    const value = event?.target?.value || ""; // Safely access value or default to an empty string
    setEnteredName(value);

    if (!apiDataFetched) {
      await fetchData();
    }

    const matchingItem = popupContent.find((item) => item.Category_Name === value);

    if (matchingItem) {
      setEnteredName(matchingItem.Category_Name);

      if (onAcCodeClick) {
        onAcCodeClick(matchingItem.Category_Name);
      }
    } else {
      if (onCategoryChange) {
        onCategoryChange(value);
      }
    }
  };


  const handleRecordDoubleClick = (item) => {
    setEnteredName(item.Category_Name);

    if (onAcCodeClick) {
      onAcCodeClick(item.Category_Name);
    }

    if (onCategoryChange) {
      onCategoryChange(item.Category_Name);
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
    item.Category_Name && item.Category_Name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const itemsToDisplay = filteredData.slice(startIndex, endIndex);

  useEffect(() => {
    if (CategoryName !== enteredName) {
      setEnteredName(CategoryName || "");
    }
  }, [CategoryName]);

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
  }, [showModal, selectedRowIndex, itemsToDisplay]);

  return (
    <div className="d-flex flex-row">
      <div className="d-flex">
        <div className="d-flex">
          <input
            type="text"
            className="form-control ms-2"
            id={name}
            autoComplete="off"
            value={enteredName !== "" ? enteredName : CategoryName}
            onChange={(e) => handleCodeChange(e)}
            style={{ width: "150px", height: "35px" }}
            tabIndex={tabIndexHelp}
            disabled={disabledField}
          />
          <Button
            variant="primary"
            onClick={handleButtonClicked}
            className="ms-1"
            style={{ width: "30px", height: "35px" }}
            // disabled={disabledField}
          >
            ...
          </Button>
        </div>
      </div>

      <Modal show={showModal} onHide={handleCloseModal} dialogClassName="modal-dialog">

        <Modal.Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Modal.Title>Grade Master</Modal.Title>
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
                    <th>Grade Name</th>
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
                      className={selectedRowIndex === index ? "selected-row" : ""}
                      onDoubleClick={() => handleRecordDoubleClick(item)}
                    >
                      <td>{item.Category_Name}</td>
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

export default GradeMasterHelp;
