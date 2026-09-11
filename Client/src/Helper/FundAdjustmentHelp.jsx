import React, { useState, useEffect } from "react";
import { Button, Modal } from "react-bootstrap";
import axios from "axios";
import DataTableSearch from "../Common/HelpCommon/DataTableSearch";
import DataTablePagination from "../Common/HelpCommon/DataTablePagination";

const API_URL = process.env.REACT_APP_API;
let activeField = "";

const FundAdjustmentHelp = ({ onFundSelect, name, fundIdCode, fundDocNo, tabIndexHelp, disabledField, firstInputRef }) => {
  const [showModal, setShowModal] = useState(false);
  const [fundData, setFundData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedRowIndex, setSelectedRowIndex] = useState(-1);
  const [enteredFundId, setEnteredFundId] = useState("");
  const [enteredDocNo, setEnteredDocNo] = useState("");

  useEffect(() => {
    if (fundIdCode === "" || fundDocNo === "") {
      setEnteredFundId("");
      setEnteredDocNo("");
    } else {
      setEnteredFundId(fundIdCode);
      setEnteredDocNo(fundDocNo);
    }
  }, [fundIdCode, fundDocNo]);

  const fetchFundData = async () => {
    try {
      const Company_Code = sessionStorage.getItem("Company_Code");
      const res = await axios.get(`${API_URL}/get-fundadjustment-data`, {
        params: { Company_Code },
      });
      setFundData(res.data || []);
    } catch (err) {
      console.error("Error fetching fund adjustment data", err);
    }
  };

  const handleF1Key = (e) => {
    if (e.key === "F1" && e.target.id === name) {
      activeField = name;
      setSearchTerm(e.target.value);
      fetchFundData();
      setShowModal(true);
      e.preventDefault();
    }
  };
  

  useEffect(() => {
    window.addEventListener("keydown", handleF1Key);
    return () => {
      window.removeEventListener("keydown", handleF1Key);
    };
  }, [name]);

  const handleButtonClick = () => {
    fetchFundData();
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleFundIdChange = (e) => {
    const { value } = e.target;
    setEnteredDocNo(value);

    if (value === "") {
      setEnteredFundId("");
      setEnteredDocNo("")
      if (onFundSelect) {
         onFundSelect({
        fundId: "",
        Doc_no: "",
      });
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Tab" && e.target.id === name) {
      const match = fundData.find((item) => item.fundId?.toString() === enteredFundId);
      if (match && onFundSelect) {
        setEnteredDocNo(match.Doc_no);
        onFundSelect(match);
      }
    }
  };

  const handleRecordDoubleClick = (item) => {
    setEnteredFundId(item.fundId);
    setEnteredDocNo(item.Doc_no);
    if (onFundSelect) onFundSelect(item);
    setShowModal(false);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleSearch = (searchVal) => {
    setSearchTerm(searchVal);
  };

  const filteredData = fundData.filter((item) =>
    (item.fundId?.toString() || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.Doc_no?.toString() || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.FundingFromName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.bill_to_name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const itemsToDisplay = filteredData.slice(startIndex, endIndex);

  useEffect(() => {
    const handleArrowKeyNavigation = (e) => {
      if (showModal) {
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedRowIndex((prev) => Math.max(prev - 1, 0));
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedRowIndex((prev) => Math.min(prev + 1, itemsToDisplay.length - 1));
        } else if (e.key === "Enter") {
          e.preventDefault();
          if (selectedRowIndex >= 0) {
            handleRecordDoubleClick(itemsToDisplay[selectedRowIndex]);
          }
        }
      }
    };

    window.addEventListener("keydown", handleArrowKeyNavigation);
    return () => {
      window.removeEventListener("keydown", handleArrowKeyNavigation);
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
            value={enteredDocNo}
            onChange={handleFundIdChange}
            onKeyDown={handleKeyDown}
            style={{ width: "100px", height: "35px" }}
            tabIndex={tabIndexHelp}
            disabled={disabledField}
            ref={firstInputRef}
          />
          <Button
            variant="primary"
            onClick={handleButtonClick}
            className="interactive-button ms-1"
            style={{ width: "30px", height: "35px" }}
            disabled={disabledField}
          >
            ...
          </Button>

          <label className="form-labels ms-2" style={{ whiteSpace: 'nowrap', fontSize: "14px", fontWeight: "bold", marginTop: "5px" }}>
            {enteredFundId}
          </label>
        </div>
      </div>

      <Modal show={showModal} onHide={handleCloseModal} dialogClassName="modal-dialog modal-xl">
        <Modal.Header style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Modal.Title>Fund Adjustment Help</Modal.Title>
          <Button
            style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'blue', position: 'absolute', right: '10px' }}
            onClick={handleCloseModal}
          >
            X
          </Button>
        </Modal.Header>
        <DataTableSearch data={fundData} onSearch={handleSearch} />
        <Modal.Body>
          <div style={{ overflowX: "auto" }}>
            <table className="table table-bordered">
              <thead>
                <tr className="table-light">
                  <th>Fund ID</th>
                  <th>Doc No</th>
                  <th>Doc Date</th>
                  <th>Funding From</th>
                  <th>Bill To</th>
                  <th>Funding Amount</th>
                  <th>Interest Adj. Rate</th>
                </tr>
              </thead>
              <tbody>
                {itemsToDisplay.map((item, index) => (
                  <tr
                    key={item.fundId}
                    style={{
                      cursor: "pointer",
                      backgroundColor: selectedRowIndex === index ? "#d6e9f9" : "white",
                    }}
                    onClick={() => setSelectedRowIndex(index)}
                    onDoubleClick={() => handleRecordDoubleClick(item)}
                  >
                    <td>{item.fundId}</td>
                    <td>{item.Doc_no}</td>
                    <td>{item.Doc_date}</td>
                    <td>{item.FundingFromName}</td>
                    <td>{item.bill_to_name}</td>
                    <td>{item.Funding_Adjust}</td>
                    
                    <td>{item.Advance_amount}</td>
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

export default FundAdjustmentHelp;
