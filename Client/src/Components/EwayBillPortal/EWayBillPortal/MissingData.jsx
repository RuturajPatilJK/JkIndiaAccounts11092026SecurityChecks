import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Box,
  Button,
  Snackbar,
  Alert,
} from "@mui/material";
import axios from "axios";
import NoDataAlert from "../Alert/Alert.jsx";
import SearchBar from "../../../Common/SearchBar/SearchBar.jsx";
import { RingLoader } from "react-spinners";
import EwayBillTokenGenerator from "../EWayBillPortal/GenrateEWayBill/genrateToken.jsx";
import SyncIcon from '@mui/icons-material/Sync';
import io from "socket.io-client";
import CircularSpinner from "../../../Common/Spinners/CircularSpinner"
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";

// Table Style
const tableCellStyleHeader = {
  fontSize: '16px',
  fontWeight: 'bold',
  backgroundColor: '#f4f4f4',
  whiteSpace: 'nowrap',
  position: 'sticky',
  top: 0,
  zIndex: 1,
};


const tableCellStyle = {
  fontSize: '16px',
  fontWeight: 'bold',
  whiteSpace: 'nowrap',
};

const apikey = process.env.REACT_APP_API;
const socketURL = process.env.REACT_APP_API_URL;
// mastergst.com is now called server-side (see WhitebooksProxyController.py) -
// GSP domains reject cross-origin browser calls (CORS preflight fails in
// production), and calling it directly also leaked client_secret to anyone
// opening DevTools.
const DETAILS_API_URL = `${apikey}/mastergst-get-ewaybill`;

const API_URL = `${apikey}/mastergst-get-ewaybills-by-date`;

const MissingData = ({ fromDate }) => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(500);
  const [page, setPage] = useState(0);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEmpty, setIsEmpty] = useState(false);
  const [ewaybill, setEwaybill] = useState([]);

  // Snackbar state for success/failure messages
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    if (isNaN(date)) return "";

    const options = { day: "2-digit", month: "2-digit", year: "numeric" };
    return new Intl.DateTimeFormat("en-GB", options).format(date);
  };

  //Formated Date at the time of insert the data into the table.
  const formatteddatesForInsert = (date) => {
    const datePart = date.split(" ")[0];
    const [day, month, year] = datePart.split("/");
    return `${year}-${month}-${day}`;
  };

  const formatDateQueryParam = (date) => {
    const d = new Date(date);
    const day = ("0" + d.getDate()).slice(-2);
    const month = ("0" + (d.getMonth() + 1)).slice(-2);
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${apikey}/getMatchingPurchaseewaybillsMissing`,
        { params: { doc_date: fromDate } }
      );
      const fetchedData = response.data;
      setData(fetchedData);
      setFilteredData(fetchedData);
    } catch (error) {
      console.error("Error fetching data:", error);
      setData([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle search functionality
  useEffect(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    const filtered = data.filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(lowerCaseQuery)
      )
    );
    setFilteredData(filtered);
  }, [searchQuery, data]);

  //Socket IO implementation
  useEffect(() => {
    // const socket = io(socketURL);
    // const isSecure = socketURL.startsWith("https");
    const socket = io(`${socketURL}`, {
      transports: ["websocket", "polling"],
      withCredentials: true,
      // secure: isSecure,
    });

    socket.on("connect", () => { });

    socket.on("deletedEwbNo", () => {
      handleDeleteAndImport();
    });

    socket.on("disconnect", () => { });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Pagination handlerswss
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Function to fetch individual E-Way Bill details
  const fetchEwayBillDetails = async (ewbNo, token) => {
    try {
      const response = await axios.get(DETAILS_API_URL, {
        params: { ewbNo, token },
      });
      return response.data.data || {};
    } catch (error) {
      console.error(`Error fetching details for EWB No: ${ewbNo}`, error);
      return null;
    }
  };

  const createEwayBillInDatabase = async (ewayBillDetail, token) => {

    try {
      let totalQuantity = 0;
      let totalTaxableAmount = 0;

      const firstItem = ewayBillDetail.itemList[0];

      ewayBillDetail.itemList.forEach((item) => {
        let quantity = item.quantity;

        if (item.qtyUnit === "MTS") {
          quantity *= 10;
        } else if (item.qtyUnit === "NOS") {
          quantity /= 2;
        } else if (item.qtyUnit === "KGS") {
          quantity /= 100;
        } else if (item.qtyUnit === "BAG") {
          quantity /= 2;
        }

        totalQuantity += quantity;
        totalTaxableAmount += item.taxableAmount;
      });

      const dataToSend = [
        {
          supplyType: ewayBillDetail.supplyType,
          ewbNo: ewayBillDetail.ewbNo,
          ewayBillDate: formatteddatesForInsert(ewayBillDetail.ewayBillDate),
          docNo: ewayBillDetail.docNo,
          docDate: formatteddatesForInsert(ewayBillDetail.docDate),
          fromPlace: ewayBillDetail.fromPlace,
          fromStateCode: ewayBillDetail.fromStateCode,
          fromAddr1: ewayBillDetail.fromAddr1,
          fromAddr2: ewayBillDetail.fromAddr2,
          fromGstin: ewayBillDetail.fromGstin,
          toAddr1: ewayBillDetail.toAddr1,
          toAddr2: ewayBillDetail.toAddr2,
          toPlace: ewayBillDetail.toPlace,
          toStateCode: ewayBillDetail.toStateCode,
          toGstin: ewayBillDetail.toGstin,
          vehicleNo: ewayBillDetail.VehiclListDetails[0]?.vehicleNo,
          cgstValue: ewayBillDetail.cgstValue,
          sgstValue: ewayBillDetail.sgstValue,
          igstValue: ewayBillDetail.igstValue,
          hsnCode: firstItem?.hsnCode,
          productId: firstItem?.productId,
          productName: firstItem?.productName,
          transporterId: ewayBillDetail.transporterId,
          actualDist: ewayBillDetail.actualDist,
          totInvValue: ewayBillDetail.totInvValue,
          quantity: totalQuantity,
          taxableAmount: totalTaxableAmount,
          validUpto: formatteddatesForInsert(ewayBillDetail.validUpto),
          toPincode: ewayBillDetail.toPincode,
        },
      ];

      const response = await axios.post(
        `${apikey}/create-eway-bill`,
        dataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response;
    } catch (error) {
      console.error("Error creating E-Way Bill in database:", error);
      setError("Failed to create E-Way Bill in the database.");
      return null;
    }
  };

  // Close the Snackbar
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  //GET all Eway bill numbers from the Eway bill API to get the detail information of the individual eway bill data
  const handleDeleteAndImport = async (row) => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const { generateToken } = EwayBillTokenGenerator();
      const tokenResponse = await generateToken();

      if (tokenResponse) {
        const formattedDate = formatDateQueryParam(fromDate);

        const response = await axios.delete(
          `${apikey}/deleteewaybillandimport?ewbNo=${row.ewbNo}`
        );

        if (response.status === 200) {
          const allDetails = await fetchEwayBillDetails(
            row.ewbNo,
            tokenResponse.token
          );

          const createEwayBillResponse = await createEwayBillInDatabase(
            allDetails
          );

          if (createEwayBillResponse.status === 201) {
            setSnackbarMessage(
              `${row.ewbNo} Deleted and Imported Successfully!`
            );
            setSnackbarSeverity("success");
          } else {
            setSnackbarMessage("Failed to store E-Way Bills.");
            setSnackbarSeverity("error");
          }
        } else {
          setSnackbarMessage("Failed to process E-Way Bills.");
          setSnackbarSeverity("error");
        }
      } else {
        setSnackbarMessage("Failed to fetch E-Way Bills.");
        setSnackbarSeverity("error");
      }
    } catch (err) {
      setSnackbarMessage(
        "Error occurred while generating the token or fetching data."
      );
      setSnackbarSeverity("error");
    }

    setIsLoading(false);
    setSnackbarOpen(true);
  };

  // Fetch data from API
  useEffect(() => {
    fetchData();
  }, [fromDate]);

  return (
    <div>
      <Box
        sx={{ marginBottom: 2, display: "flex", justifyContent: "flex-end" }}
      >
        <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
        sx={{
          width: "100%",
          textAlign: "right",
        }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity="success"
          variant="filled"
          sx={{ width: "30%", height: "5vh" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {loading ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          height="600px"
        >
          <CircularSpinner />
        </Box>
      ) : filteredData.length === 0 ? (
        <NoDataAlert />
      ) : (
        <>
          <TableContainer
            component={Paper}
            style={{
              maxWidth: "98%",
              margin: "0 auto",
              height: "75vh",
            }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell style={tableCellStyleHeader}>Action</TableCell>
                  <TableCell style={tableCellStyleHeader}>
                    Portal EWay BillNo
                  </TableCell>
                  <TableCell style={tableCellStyleHeader}>
                    EwayBill GstNO
                  </TableCell>
                  <TableCell style={tableCellStyleHeader}>
                    EWayBill NETQNTL
                  </TableCell>
                  <TableCell style={tableCellStyleHeader}>Vehicle No</TableCell>
                  <TableCell style={tableCellStyleHeader}>
                    Taxable Amount
                  </TableCell>
                  <TableCell style={tableCellStyleHeader}>
                    Total Inv Value
                  </TableCell>
                  <TableCell style={tableCellStyleHeader}>
                    Actual Distance
                  </TableCell>
                  <TableCell style={tableCellStyleHeader}>CGST Value</TableCell>
                  <TableCell style={tableCellStyleHeader}>Doc No</TableCell>
                  <TableCell style={tableCellStyleHeader}>
                    Eway Bill Date
                  </TableCell>
                  <TableCell style={tableCellStyleHeader}>
                    From Address
                  </TableCell>
                  <TableCell style={tableCellStyleHeader}>From GSTIN</TableCell>
                  <TableCell style={tableCellStyleHeader}>From Place</TableCell>
                  <TableCell style={tableCellStyleHeader}>HSN Code</TableCell>
                  <TableCell style={tableCellStyleHeader}>IGST Value</TableCell>
                  <TableCell style={tableCellStyleHeader}>
                    Product Name
                  </TableCell>
                  <TableCell style={tableCellStyleHeader}>SGST Value</TableCell>
                  <TableCell style={tableCellStyleHeader}>
                    Supply Type
                  </TableCell>
                  <TableCell style={tableCellStyleHeader}>To Address</TableCell>
                  <TableCell style={tableCellStyleHeader}>To Place</TableCell>
                  <TableCell style={tableCellStyleHeader}>
                    To State Code
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.isArray(filteredData) &&
                  filteredData.length > 0 &&
                  filteredData
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row) => {
                      return (
                        <TableRow key={row.id}>
                          <Button
                            variant="contained"
                            color="primary"
                            startIcon={<SyncIcon />}
                            style={{ marginTop: '10px' }}
                            onClick={() => handleDeleteAndImport(row)}
                          >
                            GO
                          </Button>
                          <TableCell style={tableCellStyle}>
                            {row.ewbNo}
                          </TableCell>
                          <TableCell style={tableCellStyle}>
                            {row.toGstin}
                          </TableCell>
                          <TableCell style={tableCellStyle}>
                            {row.quantity}
                          </TableCell>
                          <TableCell style={tableCellStyle}>
                            {row.vehicleNo}
                          </TableCell>
                          <TableCell style={tableCellStyle}>
                            {formatReadableAmount(row.taxableAmount)}
                          </TableCell>
                          <TableCell style={tableCellStyle}>
                            {row.totInvValue}
                          </TableCell>
                          <TableCell style={tableCellStyle}>
                            {row.actualDist}
                          </TableCell>
                          <TableCell style={tableCellStyle}>
                            {formatReadableAmount(row.cgstValue)}
                          </TableCell>
                          <TableCell style={tableCellStyle}>
                            {row.docNo}
                          </TableCell>
                          <TableCell style={tableCellStyle}>
                            {formatDate(row.ewayBillDate)}
                          </TableCell>
                          <TableCell
                            style={tableCellStyle}
                          >{`${row.fromAddr1} ${row.fromAddr2}`}</TableCell>
                          <TableCell style={tableCellStyle}>
                            {row.fromGstin}
                          </TableCell>
                          <TableCell style={tableCellStyle}>
                            {row.fromPlace}
                          </TableCell>
                          <TableCell style={tableCellStyle}>
                            {row.hsnCode}
                          </TableCell>
                          <TableCell style={tableCellStyle}>
                            {row.igstValue}
                          </TableCell>
                          <TableCell style={tableCellStyle}>
                            {row.productName}
                          </TableCell>
                          <TableCell style={tableCellStyle}>
                            {formatReadableAmount(row.sgstValue)}
                          </TableCell>
                          <TableCell style={tableCellStyle}>
                            {row.supplyType}
                          </TableCell>
                          <TableCell
                            style={tableCellStyle}
                          >{`${row.toAddr1} ${row.toAddr2}`}</TableCell>
                          <TableCell style={tableCellStyle}>
                            {row.toPlace}
                          </TableCell>
                          <TableCell style={tableCellStyle}>
                            {row.toStateCode}
                          </TableCell>
                        </TableRow>
                      );
                    })}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[100, 200, 300, 500]}
            component="div"
            count={filteredData.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </>
      )}
    </div>
  );
};

export default MissingData;