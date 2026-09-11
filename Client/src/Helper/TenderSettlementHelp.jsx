import React, { useState, useEffect, useCallback } from "react";
import { Button } from "react-bootstrap";
import { Modal, Table, Box, Typography } from "@mui/material";
import axios from "axios";
import DataTableSearch from "../Common/HelpCommon/DataTableSearch";
import DataTablePagination from "../Common/HelpCommon/DataTablePagination";
import "../App.css";

const API_URL = process.env.REACT_APP_API;

const TenderSettlementHelp = ({ onTenderSelect, onAcCodeClick,tenderNo,paymentTo_Name, name, tabIndexHelp, disabledFeild }) => {

  const Company_Code = sessionStorage.getItem('Company_Code')
  const Year_Code = sessionStorage.getItem('Year_Code')
  const [showModal, setShowModal] = useState(false);
  const [tenders, setTenders] = useState([]);
  const [paymentToName, setPaymentToName] = useState('')
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedRowIndex, setSelectedRowIndex] = useState(-1);

  const fetchTenders = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/tenderutility?Company_Code=${Company_Code}&Year_Code=${Year_Code}`);
      setTenders(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, [Company_Code, Year_Code]);

  const handleOpenModal = async () => {
    if (tenders.length === 0) {
      await fetchTenders();
    }
    setShowModal(true);
  };

  const handleRowDoubleClick = async (tender) => {
    try {
      const response = await axios.get(`${API_URL}/getTenderByTenderNo`, {
        params: { Tender_No: tender.Tender_No, Company_Code: Company_Code },
      });
      onTenderSelect(response.data);
      if (onAcCodeClick) {
        onAcCodeClick(tender.Tender_No);
        setPaymentToName(tender.paymenttoname)
      }
    } catch (error) {
      console.error("Error fetching tender details:", error);
    }
    setShowModal(false);
  };

  const handleTabFetch = async (e) => {
  if (e.key === "Tab" && !disabledFeild && tenderNo.trim()) {
    e.preventDefault();

    try {
      const response = await axios.get(`${API_URL}/getTenderByTenderNo`, {
        params: {
          Tender_No: tenderNo.trim(),
          Company_Code,
        },
      });

      if (response.data) {
        onTenderSelect(response.data);
        onAcCodeClick?.(tenderNo.trim());
        setPaymentToName(response.data.paymenttoname);
      }
    } catch (error) {
      console.error("Tender not found or fetch error:", error);
    } finally {
      // Restore default tab behavior after async
      setTimeout(() => {
        const focusable = document.querySelectorAll("input, button, select, textarea, a[href]");
        const currentIndex = Array.from(focusable).findIndex(el => el.id === name);
        if (currentIndex >= 0 && focusable[currentIndex + 1]) {
          focusable[currentIndex + 1].focus();
        }
      }, 10);
    }
  }
};

 useEffect(() => {
        if (paymentTo_Name === "" || tenderNo === "") {
            setPaymentToName("");
        } else {
            setPaymentToName(paymentTo_Name);
        }
    }, [paymentTo_Name, tenderNo]);


  const filteredTenders = tenders.filter((item) =>
    item.Tender_No.toString().includes(searchTerm)
  );

  const paginatedTenders = filteredTenders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "F1" && event.target.id === name) {
        event.preventDefault();
        handleOpenModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [name, handleOpenModal]);

  return (
    <div className="d-flex flex-row">
      <input
        type="text"
        className="form-control"
        id={name}
        value={tenderNo}
        tabIndex={tabIndexHelp}
        disabled={disabledFeild}
        
         onChange={(e) => {
    if (!disabledFeild) {
      const val = e.target.value;
      onAcCodeClick?.(val);
    }
  }}
  onKeyDown={(e) => handleTabFetch(e)}
        style={{ width: "100px", height: "35px" }}
      />
      <Button variant="primary" onClick={handleOpenModal} className="ms-1" style={{ width: "30px", height: "35px" }}>
        ...
      </Button>
      {paymentToName && (
  <label
    id="acNameLabel"
    className="form-labels ms-2"
    style={{
      whiteSpace: 'nowrap',
      fontSize: "14px",
      fontWeight: "bold",
      marginTop: "5px"
    }}
  >
    Payment To: {paymentToName}
  </label>
)}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Box sx={{ width: "90vw", bgcolor: 'background.paper', p: 3, overflowY: 'auto' }}>
          <Box className="d-flex justify-content-between align-items-center mb-2">
            <Typography variant="h6">Tender Utility Help</Typography>
            <Button onClick={() => setShowModal(false)}>X</Button>
          </Box>

          <DataTableSearch data={tenders} onSearch={setSearchTerm} />

          <Box sx={{ overflowX: "auto", maxHeight: "60vh", mt: 2 }}>
            <Table className="custom-table">
              <thead>
                <tr>
                  <th style={{whiteSpace:"nowrap"}}>Tender No.</th>
                  <th style={{whiteSpace:"nowrap"}}>Tender Date</th>
                  <th>Mill Name</th>
                  <th>Quintal</th>
                  <th>Grade</th>
                  <th style={{whiteSpace:"nowrap"}}>Mill Rate</th>
                  <th style={{whiteSpace:"nowrap"}}>Payment To</th>
                  <th style={{whiteSpace:"nowrap"}}>Tender Id</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTenders.map((tender, index) => (
                  <tr
                    key={index}
                    className={selectedRowIndex === index ? 'selected-row' : ''}
                    onDoubleClick={() => handleRowDoubleClick(tender)}
                    onClick={() => setSelectedRowIndex(index)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>{tender.Tender_No}</td>
                    <td>{tender.Tender_Date}</td>
                    <td>{tender.millshortname}</td>
                    <td>{tender.Quantal}</td>
                    <td style={{whiteSpace:"nowrap"}}>{tender.Grade}</td>
                    <td>{tender.Mill_Rate}</td>
                    <td style={{whiteSpace:"nowrap"}}>{tender.paymenttoname}</td>
                    <td>{tender.tenderid}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Box>

          <Box className="mt-2 d-flex justify-content-end">
            <DataTablePagination
              totalItems={filteredTenders.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </Box>
        </Box>
      </Modal>
    </div>
  );
};

export default TenderSettlementHelp;
