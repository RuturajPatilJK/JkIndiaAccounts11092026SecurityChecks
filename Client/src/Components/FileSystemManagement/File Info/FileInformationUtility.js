import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import {
  Grid,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
} from "@mui/material";
import PerPageSelect from "../../../Common/UtilityCommon/PerPageSelect";
import Pagination from "../../../Common/UtilityCommon/Pagination";
import BackButton from "../../../Common/Buttons/BackButton";
import CreateNewButton from "../../../Common/Buttons/CreateNewButton";
import SearchBar from "../../../Common/UtilityCommon/SearchBar";

function UserCreationUtility() {
  const apiURL = process.env.REACT_APP_API_URL_FILE_SYSTEM;
  const API_URL = process.env.REACT_APP_API_URL_FILE_SYSTEM;

  const [fetchedData, setFetchedData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [perPage, setPerPage] = useState(15);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {

    const fetchData = async () => {
      try {
        const response = await fetch(`${apiURL}/file-info-with-cupboard`);
        const data = await response.json();
        setFetchedData(data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [apiURL]);

  useEffect(() => {
    const filtered = fetchedData.filter((post) => {
      const search = searchTerm.toLowerCase();
      return (
        post.File_Name?.toLowerCase().includes(search) ||
        post.File_Discription?.toLowerCase().includes(search) ||
        String(post.Doc_No).toLowerCase().includes(search) ||
        String(post.File_No).toLowerCase().includes(search) ||
        String(post.Doc_Date).toLowerCase().includes(search) ||
        post.CupBoardCode_Name?.toLowerCase().includes(search) ||
        String(post.Cupboard_Code).toLowerCase().includes(search)
      );
    });

    setFilteredData(filtered);
    setCurrentPage(1);
  }, [searchTerm, fetchedData]);

  const handleSearchTermChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleAdd = () => {
    navigate("/filemanagement");
  };

  const handleRowClick = (Doc_No) => {
    const selected = fetchedData.find((item) => item.Doc_No === Doc_No);
    navigate("/filemanagement", { state: { editRecordData: selected } });
  };

  const handleBack = () => {
    navigate("/filesystemdashboard");
  };

  const exportToExcel = () => {
    const sortedData = [...filteredData].sort((a, b) => Number(a.Doc_No) - Number(b.Doc_No));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sortedData);
    XLSX.utils.book_append_sheet(wb, ws, "Files");
    XLSX.writeFile(wb, "JKFileReport.xlsx");
  };

  const paginatedData = filteredData.slice((currentPage - 1) * perPage, currentPage * perPage);
  const pageCount = Math.ceil(filteredData.length / perPage);

  return (
    <div >

      <Grid container alignItems="center" justifyContent="space-between" >
        <Grid item sx={{ display: "flex", gap: 1 }}>
          <CreateNewButton onClick={handleAdd} />
          <BackButton onClick={handleBack} />
          <PerPageSelect value={perPage} onChange={(e) => setPerPage(Number(e.target.value))} />
          <Button variant="contained" color="success" style={{ height: "38px", marginTop: "11px" }} onClick={exportToExcel}>
            Export to Excel
          </Button>
        </Grid>

        <Typography variant="h6"
          component="h1"
          gutterBottom
          sx={{
            textAlign: 'center',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            color: '#2c3e50',
            marginBottom: '30px',
            padding: '12px 0',
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: '0',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '80px',
              height: '4px',
              background: 'linear-gradient(90deg, #3498db, #2ecc71)',
              borderRadius: '2px',
              animation: 'underlineGrow 0.5s ease-out forwards'
            },
            '@keyframes underlineGrow': {
              '0%': { width: '0' },
              '100%': { width: '80px' }
            }
          }}>
          File Information
        </Typography>

        <Grid item xs={12} sm={6} md={4}>
          <SearchBar
            value={searchTerm}
            onChange={handleSearchTermChange}
            placeholder="Search Cupboard..."
            fullWidth
          />
        </Grid>
      </Grid>

      <Paper elevation={3}>
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ backgroundColor: "#fcfcfcff" }}>
              <TableRow>
                <TableCell style={{ whiteSpace: "nowrap" }}><strong>Doc No</strong></TableCell>
                <TableCell><strong>Doc Date</strong></TableCell>
                <TableCell><strong>File Name</strong></TableCell>
                <TableCell><strong>File Description</strong></TableCell>
                <TableCell style={{ whiteSpace: "nowrap" }}><strong>Cupboard / Drawer Code </strong></TableCell>
                <TableCell style={{ whiteSpace: "nowrap" }}><strong>File No</strong></TableCell>
                <TableCell style={{ whiteSpace: "nowrap" }}><strong>Cupboard / Drawer Name</strong></TableCell>
                {/* <TableCell style={{ whiteSpace: "nowrap" }}><strong>Remark</strong></TableCell> */}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedData.map((row) => (
                <TableRow
                  key={row.Doc_No}
                  onDoubleClick={() => handleRowClick(row.Doc_No)}
                  sx={{
                    cursor: "pointer",
                    transition: "background-color 0.3s ease",
                    '&:hover': {
                      backgroundColor: '#f3f388',
                    },
                  }}
                >
                  <TableCell>{row.Doc_No}</TableCell>
                  <TableCell style={{ whiteSpace: "nowrap" }}>{row.Doc_Date}</TableCell>
                  <TableCell>{row.File_Name}</TableCell>
                  <TableCell>{row.File_Discription}</TableCell>
                  <TableCell align="center">{row.Cupboard_Code}</TableCell>
                  <TableCell align="center">{row.File_No}</TableCell>
                  <TableCell>{row.Cupboard_Name}</TableCell>
                  {/* <TableCell>{row.Remark}</TableCell> */}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Grid item xs={12} mt={3} mb={5}>
        <Pagination
          pageCount={pageCount}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      </Grid>
    </div>
  );
}

export default UserCreationUtility;

