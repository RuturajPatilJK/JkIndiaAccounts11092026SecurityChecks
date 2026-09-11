import React, { useEffect, useState } from "react";
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, CircularProgress
} from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Pagination from "../../../Common/UtilityCommon/Pagination";
import SearchBar from "../../../Common/UtilityCommon/SearchBar";
import BackButton from "../../../Common/Buttons/BackButton";
import CircularSpinner from "../../../Common/Spinners/CircularSpinner";
import Swal from "sweetalert2";

const API_URL = process.env.REACT_APP_API;
const ITEMS_PER_PAGE = 100;

const SaudaBookUtilityPage = () => {
  const companyCode = sessionStorage.getItem("Company_Code");
  const yearCode = sessionStorage.getItem("Year_Code");
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [tenderList, setTenderList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    const fetchTenderData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/get-sauda-book-utility`, {
          params: {
            Company_Code: companyCode,
            Year_Code: yearCode
          }
        });
        const result = response.data.SaudaBookUtility || [];
        setTenderList(result);
        setFilteredList(result);
      } catch (err) {
        console.error("Error fetching tender data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTenderData();
  }, []);

  const handleSearch = () => {
    const filtered = tenderList.filter(item =>
      String(item.Tender_No || "").toLowerCase().includes(searchValue.toLowerCase()) ||
      String(item.Grade || "").toLowerCase().includes(searchValue.toLowerCase()) ||
      String(item.millshortname || "").toLowerCase().includes(searchValue.toLowerCase())
    );

    setFilteredList(filtered);
    setCurrentPage(1);
  };

  const handleSearchInputChange = (e) => {
    const newValue = e.target.value;
    setSearchValue(newValue);

    const filtered = tenderList.filter(item =>
      String(item.Tender_No || "").toLowerCase().includes(newValue.toLowerCase()) ||
      String(item.Grade || "").toLowerCase().includes(newValue.toLowerCase()) ||
      String(item.millshortname || "").toLowerCase().includes(newValue.toLowerCase())
    );

    setFilteredList(filtered);
    setCurrentPage(1);
  };

  const totalBuyerQuantal = filteredList.reduce(
    (acc, row) => acc + (parseFloat(row.Buyer_Quantal) || 0),
    0
  );

  const handleRowDoubleClick = (row) => {
    navigate("/sauda-book-utility", {
      state: {
        tenderData: row
      }
    });
  };


  const handleRowClick = (doc_no) => {
    const num = Number(doc_no);
    if (!num) {
      Swal.fire({
        title: "Invalid Document Number",
        text: "The document number is invalid",
        icon: "error",
        confirmButtonText: "OK",
      });
      return;
    }
    const url = `${window.location.origin}/tender_head`;
    const params = new URLSearchParams({ navigatedRecord: String(num) });
    window.open(`${url}?${params.toString()}`, "_blank");
  };


  const handleBack = () => {
    navigate("/DashBoard");
  };

  const pageCount = Math.ceil(filteredList.length / ITEMS_PER_PAGE);
  const paginatedData = filteredList.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <Box p={3}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
        <Box mr={2} mt={1}>
          <BackButton onClick={handleBack} />
        </Box>
        {/* Left: Self Stock */}
        {/* <Typography
          variant="subtitle1"
          fontWeight="bold"
          color="green"
          sx={{ whiteSpace: 'nowrap', minWidth: '160px' }}
        >
          Self Stock: {totalBuyerQuantal.toFixed(2)}
        </Typography> */}

        {/* Center: Title */}
        <Box flex={1} display="flex" justifyContent="center">
          <Typography variant="h6" fontWeight="bold" textAlign="center">
            Sauda Book Utility
          </Typography>
        </Box>

        {/* Right: SearchBar */}
        <Box display="flex" justifyContent="flex-end" minWidth="350px">
          <SearchBar
            value={searchValue}
            onChange={handleSearchInputChange}
            onSearchClick={handleSearch}
          />
        </Box>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularSpinner />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper} sx={{ mt: 0 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><b>Tender No</b></TableCell>
                  <TableCell><b>Tender Date</b></TableCell>
                  <TableCell><b>Grade</b></TableCell>
                  <TableCell><b>Mill Name</b></TableCell>
                  <TableCell><b>Mill Rate</b></TableCell>
                  <TableCell><b>Quintal</b></TableCell>
                  <TableCell><b>Buyer Quintal</b></TableCell>
                  {/* <TableCell><b>Dispatched</b></TableCell>
                  <TableCell><b>Balance</b></TableCell> */}
                  <TableCell><b>Lifting Date</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.map((row, index) => (
                  <TableRow key={index} hover onDoubleClick={() => handleRowDoubleClick(row)} style={{ cursor: 'pointer' }}>
                    <TableCell
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRowClick(row.Tender_No);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleRowClick(row.Tender_No);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      sx={{ cursor: "pointer", textDecoration: "underline" }}
                    >
                      {row.Tender_No}
                    </TableCell>
                    <TableCell>{row.Tender_Date}</TableCell>
                    <TableCell>{row.Grade}</TableCell>
                    <TableCell>{row.millshortname}</TableCell>
                    <TableCell>{row.Mill_Rate}</TableCell>
                    <TableCell>{row.Quantal}</TableCell>
                    <TableCell>{row.selfqty}</TableCell>
                    {/* <TableCell>{row.DESPATCH}</TableCell>
                    <TableCell>{row.BALANCE}</TableCell> */}
                    <TableCell>{row.Tender_Date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Pagination
            pageCount={pageCount}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </Box>
  );
};

export default SaudaBookUtilityPage;
