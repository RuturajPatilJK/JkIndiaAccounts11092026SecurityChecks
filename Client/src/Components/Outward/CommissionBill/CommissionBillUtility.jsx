import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Grid, Paper, Select, MenuItem, FormControl, InputLabel, Typography, Box
} from "@mui/material";
import PageNotFound from "../../../Common/PageNotFound/PageNotFound";
import Pagination from "../../../Common/UtilityCommon/Pagination";
import SearchBar from "../../../Common/UtilityCommon/SearchBar";
import PerPageSelect from "../../../Common/UtilityCommon/PerPageSelect";
import axios from "axios";
import BackButton from "../../../Common/Buttons/BackButton";
import CreateNewButton from "../../../Common/Buttons/CreateNewButton";
import CircularSpinner from "../../../Common/Spinners/CircularSpinner";

const styles = {
  tableHeaderCell: {
    fontSize: '16px',
    fontWeight: 'bold',
    backgroundColor: '#f4f4f4',
    whiteSpace: 'nowrap',
    position: 'sticky',
    top: 0,
    zIndex: 1
  }
};


function CommissionBillUtility() {
  const companyCode = sessionStorage.getItem("Company_Code");
  const yearCode = sessionStorage.getItem("Year_Code");
  const uid = sessionStorage.getItem("uid");
  const apiURL = process.env.REACT_APP_API;

  const [fetchedData, setFetchedData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [perPage, setPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filterValue, setFilterValue] = useState("");
  const [canView, setCanView] = useState(null);
  const [permissionsData, setPermissionData] = useState({});
  const [tranType, setTranType] = useState(sessionStorage.getItem("Tran_Type") || "LV");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const userCheckUrl = `${apiURL}/get_user_permissions?Company_Code=${companyCode}&Year_Code=${yearCode}&Program_Name=/CommissionBill-utility&uid=${uid}`;
        const response = await axios.get(userCheckUrl);
        setPermissionData(response.data?.UserDetails);
        if (response.data?.UserDetails?.canView === "Y") {
          setCanView(true);
          fetchData();
        } else {
          setCanView(false);
        }
      } catch (error) {
        console.error("Error fetching user permissions:", error);
        setCanView(false);
      }
    };

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const apiUrl = `${apiURL}/getall-CommissionBill?Year_Code=${yearCode}&Company_Code=${companyCode}&Tran_Type=${tranType}`;
        const response = await axios.get(apiUrl);
        setFetchedData(response.data || []);
        setFilteredData(response.data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkPermissions();
  }, [tranType]);

  useEffect(() => {
    const searchTermLower = searchTerm.toLowerCase();

    const filtered = fetchedData.filter((post) => {
      const purpose = (post.PartyName || post.millname || "").toLowerCase();
      const docNoMatch = post.doc_no.toString().includes(searchTermLower);
      return (
        (filterValue === "" || post.doc_no.toString() === filterValue) &&
        (docNoMatch || purpose.includes(searchTermLower))
      );
    });

    setFilteredData(filtered);
    setCurrentPage(1);
  }, [searchTerm, filterValue, fetchedData]);

  if (canView === false) {
    return <PageNotFound />;
  }

  const handleSearchTermChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handlePerPageChange = (event) => {
    setPerPage(event.target.value);
    setCurrentPage(1);
  };

  const handleClick = () => {
    navigate("/commission-bill", { state: { tranType, permissionsData } });
  };

  const handleRowClick = (doc_no) => {
    const selectedRecord = fetchedData.find(
      (commission_bill) => commission_bill.doc_no === doc_no
    );

    if (selectedRecord) {
      navigate("/commission-bill", {
        state: {
          selectedRecord,
          tranType,
          permissionsData
        },
      });
    }
  };

  const handleBackButton = () => {
    navigate("/DashBoard");
  };

  const handleTranTypeChange = (event) => {
    setTranType(event.target.value);
  };

  const pageCount = Math.ceil(filteredData.length / perPage);
  const paginatedPosts = filteredData.slice((currentPage - 1) * perPage, currentPage * perPage);

  return (
    <div style={{ padding: '5px', overflow: 'hidden' }}>
      <Grid container spacing={1} alignItems="center">
        <Grid item>
          <CreateNewButton
            onClick={handleClick}
            disabled={permissionsData.canSave === "N"}
            permissionsData={permissionsData}
          />
        </Grid>
        <Grid item>
          <BackButton onClick={handleBackButton} />
        </Grid>
        <Grid item>
          <PerPageSelect value={perPage} onChange={handlePerPageChange} />
        </Grid>
        <Grid item xs={12} sm={2} mt={1}>
          <FormControl fullWidth>
            <InputLabel id="tran-type-label">Tran Type</InputLabel>
            <Select
              labelId="tran-type-label"
              id="tran-type"
              value={tranType}
              onChange={handleTranTypeChange}
              size="small"
            >
              <MenuItem value="LV">LV</MenuItem>
              <MenuItem value="CV">CV</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={2} ml={15}>
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
            Commission Bill
          </Typography>
        </Grid>
        <Grid item xs={12} sm={5}>
          <SearchBar
            value={searchTerm}
            onChange={handleSearchTermChange}
          />
        </Grid>

        <Grid item xs={12}>
          {isLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="600px">
              <CircularSpinner />
            </Box>
          ) : (
            <Paper elevation={20}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell style={styles.tableHeaderCell}>Doc No</TableCell>
                      <TableCell style={styles.tableHeaderCell}>Doc Date</TableCell>
                      <TableCell style={styles.tableHeaderCell}>Account Name</TableCell>
                      <TableCell style={styles.tableHeaderCell}>Item</TableCell>
                      <TableCell style={styles.tableHeaderCell}>Mill Name</TableCell>
                      <TableCell style={styles.tableHeaderCell}>Quintal</TableCell>
                      <TableCell style={styles.tableHeaderCell}>GST Code</TableCell>
                      <TableCell style={styles.tableHeaderCell}>Diff Amount</TableCell>
                      <TableCell style={styles.tableHeaderCell}>Taxable Amount</TableCell>
                      <TableCell style={styles.tableHeaderCell}>Bill Amount</TableCell>
                      <TableCell style={styles.tableHeaderCell}>TDS %</TableCell>
                      <TableCell style={styles.tableHeaderCell}>ACK No</TableCell>
                      <TableCell style={styles.tableHeaderCell}>Commission ID</TableCell>
                      <TableCell style={styles.tableHeaderCell}>Trans Type</TableCell>
                      <TableCell style={styles.tableHeaderCell}>DO No</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedPosts.map((post) => (
                      <TableRow
                        key={post.doc_no}
                        className="row-item"
                        style={{ cursor: "pointer" }}
                        onDoubleClick={() => handleRowClick(post.doc_no)}
                        sx={{
                          '&:hover': {
                            backgroundColor: '#f3f388',
                          },
                        }}
                      >
                        <TableCell>{post.doc_no}</TableCell>
                        <TableCell>{formatDate(post.doc_date)}</TableCell>
                        <TableCell>{post.PartyName}</TableCell>
                        <TableCell>{post.Itemcode}</TableCell>
                        <TableCell>{post.millname}</TableCell>
                        <TableCell>{post.qntl}</TableCell>
                        <TableCell>{post.gst_code}</TableCell>
                        <TableCell>{post.subtotal}</TableCell>
                        <TableCell>{post.texable_amount}</TableCell>
                        <TableCell>{post.bill_amount}</TableCell>
                        <TableCell>{post.TDS_Per}</TableCell>
                        <TableCell>{post.ackno}</TableCell>
                        <TableCell>{post.commissionid}</TableCell>
                        <TableCell>{post.Tran_Type}</TableCell>
                        <TableCell>{post.link_no}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </Grid>

        <Grid item xs={12} mt={3} mb={10}>
          {!isLoading && (
            <Pagination
              pageCount={pageCount}
              currentPage={currentPage}
              onPageChange={handlePageChange}
            />
          )}
        </Grid>
      </Grid>
    </div>
  );
}

export default CommissionBillUtility;

