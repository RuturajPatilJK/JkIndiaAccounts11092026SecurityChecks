import React, { useState, useEffect, useCallback } from "react";
import { Button, Modal } from "react-bootstrap";
import axios from "axios";
import DataTableSearch from "../Common/HelpCommon/DataTableSearch";
import DataTablePagination from "../Common/HelpCommon/DataTablePagination";

const ProfitNLossLotNoHelp = ({ onLotNoClick, name, MillCode, tabIndexHelp, disabledFeild }) => {
  const CompanyCode = sessionStorage.getItem("Company_Code");
  const YearCode = sessionStorage.getItem("Year_Code");
  const API_URL = process.env.REACT_APP_API;

  const [showModal, setShowModal] = useState(false);
  const [popupContent, setPopupContent] = useState([]);
  const [enteredLotNo, setEnteredLotNo] = useState("");
  const [enteredDate, setEnteredDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRowIndex, setSelectedRowIndex] = useState(-1);
  const [apiDataFetched, setApiDataFetched] = useState(false);

  const itemsPerPage = 10;

  const fetchData = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/profit-loss-lot-no`, {
        params: {
          Company_Code: CompanyCode,
          Year_Code: YearCode,
          Mill_Code: MillCode,
        },
      });
      setPopupContent(response.data);
      setApiDataFetched(true);
    } catch (error) {
      console.error("Error fetching lot numbers:", error);
    }
  }, [API_URL, CompanyCode, YearCode, MillCode]);

  useEffect(() => {
    if (MillCode) fetchData();
  }, [MillCode, fetchData]);

  const fetchAndOpenPopup = async () => {
    if (!apiDataFetched) await fetchData();
    setShowModal(true);
  };

  const handleLotNoChange = (e) => {
    setEnteredLotNo(e.target.value);
    if (e.target.value === "") setEnteredDate("");
  };

  const handleKeyDown = async (e) => {
    if (e.key === "Tab" && e.target.id === name) {
      if (!apiDataFetched) await fetchData();
      const match = popupContent.find(
        (item) => item.Tender_No.toString() === enteredLotNo
      );
      if (match) {
        setEnteredDate(match.Tender_Date);
        if (onLotNoClick) onLotNoClick(match.Tender_No, match.Tender_Date);
      } else {
        setEnteredDate("");
      }
    }
  };

  const handleRecordDoubleClick = (item) => {
    setEnteredLotNo(item.Tender_No);
    setEnteredDate(item.Tender_Date);
    if (onLotNoClick) onLotNoClick(item.Tender_No, item.Tender_Date);
    setShowModal(false);
  };

  const handleSearch = (value) => setSearchTerm(value);
  const handlePageChange = (page) => setCurrentPage(page);

  const filteredData = popupContent.filter((item) =>
    item.Tender_No.toString().includes(searchTerm)
  );
  const startIndex = (currentPage - 1) * itemsPerPage;
  const itemsToDisplay = filteredData.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="d-flex align-items-center">
      <input
        type="text"
        id={name}
        value={enteredLotNo}
        onChange={handleLotNoChange}
        onKeyDown={handleKeyDown}
        className="form-control"
        placeholder="Enter Lot No"
        style={{ width: "150px", height: "35px", marginRight: "6px" }}
        tabIndex={tabIndexHelp}
        disabled={disabledFeild}
      />
      <Button
        variant="primary"
        onClick={fetchAndOpenPopup}
        style={{ width: "30px", height: "35px", padding: 0 }}
        disabled={disabledFeild}
      >
        ...
      </Button>
      <span style={{ marginLeft: "10px", fontSize: "14px", fontWeight: 500 }}>
        {enteredDate && `Date: ${enteredDate}`}
      </span>

      <Modal show={showModal} onHide={() => setShowModal(false)} dialogClassName="modal-dialog modal-xl">
        <Modal.Header closeButton>
          <Modal.Title>Select Lot No</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <DataTableSearch data={popupContent} onSearch={handleSearch} />
          <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
            <table className="table table-hover table-bordered">
              <thead className="table-light">
                <tr>
                  <th>Lot No</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {itemsToDisplay.map((item, index) => (
                  <tr
                    key={item.Tender_No}
                    style={{ cursor: "pointer", backgroundColor: selectedRowIndex === index ? "#eef" : "" }}
                    onClick={() => setSelectedRowIndex(index)}
                    onDoubleClick={() => handleRecordDoubleClick(item)}
                  >
                    <td>{item.Tender_No}</td>
                    <td>{item.Tender_Date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-between align-items-center">
          <DataTablePagination
            totalItems={filteredData.length}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
          />
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ProfitNLossLotNoHelp;