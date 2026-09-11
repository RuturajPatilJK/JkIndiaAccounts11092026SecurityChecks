import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableFooter,
  Snackbar,
  Alert,
  Chip,
  Divider,
} from "@mui/material";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import NorthEastIcon from "@mui/icons-material/NorthEast";
import SouthWestIcon from "@mui/icons-material/SouthWest";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import FactoryIcon from "@mui/icons-material/Factory";
import PaymentsIcon from "@mui/icons-material/Payments";
import EventIcon from "@mui/icons-material/Event";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import BackButton from "../../../Common/Buttons/BackButton";
import CircularSpinner from "../../../Common/Spinners/CircularSpinner";

const API_URL = process.env.REACT_APP_API;
const EBUY_SUGAR_AC_CODE = process.env.REACT_APP_EBUY_SUGAR_AC_CODE;

const emptyPanel = {
  tenderNoInput: "",
  loading: false,
  data: null, // { head, details, TotalBalance }
};

const SaudaShifting = () => {
  const companyCode = sessionStorage.getItem("Company_Code");
  const username = sessionStorage.getItem("username");
  const navigate = useNavigate();

  const [left, setLeft] = useState(emptyPanel);
  const [right, setRight] = useState(emptyPanel);
  const [dragOverSide, setDragOverSide] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [justMoved, setJustMoved] = useState(null); // { side, tenderdetailid }

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const showMessage = (message, severity = "success") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const setPanel = (side, updater) => {
    const setter = side === "left" ? setLeft : setRight;
    setter((prev) => ({ ...prev, ...updater }));
  };

  const fetchTender = async (side, tenderNoOverride) => {
    const panel = side === "left" ? left : right;
    const tenderNo = tenderNoOverride ?? panel.tenderNoInput;

    if (!tenderNo) return;

    setPanel(side, { loading: true });
    try {
      const response = await axios.get(`${API_URL}/get-tender-for-shifting`, {
        params: { Tender_No: tenderNo, Company_Code: companyCode },
      });
      setPanel(side, { data: response.data, loading: false });
    } catch (error) {
      setPanel(side, { data: null, loading: false });
      showMessage(
        error.response?.data?.error || "Failed to fetch tender.",
        "error"
      );
    }
  };

  const handleTenderNoChange = (side, value) => {
    setPanel(side, { tenderNoInput: value });
  };

  const handleTenderNoKeyDown = (side, e) => {
    if (e.key === "Enter") {
      fetchTender(side);
    }
  };

  const handleDragStart = (e, side, row) => {
    setDraggingId(row.tenderdetailid);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({ sourceSide: side, tenderdetailid: row.tenderdetailid })
    );
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverSide(null);
  };

  const handleDragOver = (e, side) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverSide(side);
  };

  const handleDragLeave = () => {
    setDragOverSide(null);
  };

  const handleDrop = async (e, targetSide) => {
    e.preventDefault();
    setDragOverSide(null);
    setDraggingId(null);

    let payload;
    try {
      payload = JSON.parse(e.dataTransfer.getData("application/json"));
    } catch {
      return;
    }

    const { sourceSide, tenderdetailid } = payload;
    if (!sourceSide || sourceSide === targetSide) return;

    const targetPanel = targetSide === "left" ? left : right;
    if (!targetPanel.data) {
      showMessage("Load a tender on this side before dropping an entry on it.", "error");
      return;
    }

    const targetTenderId = targetPanel.data.head.tenderid;

    try {
      const response = await axios.post(`${API_URL}/shift-sauda-entry`, {
        tenderdetailid,
        target_tenderid: targetTenderId,
        shifted_by: username,
      });

      showMessage(response.data.message || "Sauda entry shifted successfully.");


      await Promise.all([fetchTender("left"), fetchTender("right")]);

      setJustMoved({ side: targetSide, tenderdetailid });
      setTimeout(() => setJustMoved(null), 2000);
    } catch (error) {
      showMessage(
        error.response?.data?.error || "Failed to shift sauda entry.",
        "error"
      );
    }
  };

  const handleBack = () => {
    navigate("/DashBoard");
  };

  const renderHeadCard = (head, selfBalance) => (
    <Box
      mb={2}
      sx={{
        p: 2,
        borderRadius: 2,
        backgroundColor: "rgba(25, 118, 210, 0.05)",
        border: "1px solid rgba(25, 118, 210, 0.15)",
        transition: "box-shadow 0.2s ease-in-out",
        "&:hover": { boxShadow: 3 },
      }}
    >
      <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1} mb={1}>
        <Typography variant="h6" fontWeight="bold" color="primary">
          Tender No: {head.Tender_No}
        </Typography>
        <Chip
          size="small"
          color={selfBalance > 0 ? "info" : "default"}
          label={`Self Balance: ${selfBalance.toFixed(2)}`}
          sx={{ fontWeight: "bold" }}
        />
      </Box>

      <Divider sx={{ mb: 1.5 }} />

      <Box display="flex" flexDirection="column" gap={1}>
        <Box display="flex" alignItems="center" gap={1}>
          <EventIcon fontSize="small" color="action" />
          <Typography variant="body2">
            <b>Tender Date:</b> {head.Tender_Date || "-"}
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <FactoryIcon fontSize="small" color="action" />
          <Typography variant="body2">
            <b>Mill Name:</b> {head.MillName || "-"}
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <CurrencyRupeeIcon fontSize="small" color="action" />
          <Typography variant="body2">
            <b>Mill Rate:</b> {head.Mill_Rate ?? "-"}
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <PaymentsIcon fontSize="small" color="action" />
          <Typography variant="body2">
            <b>Payment To:</b> {head.PaymentToName || "-"}
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Inventory2Icon fontSize="small" color="action" />
          <Typography variant="body2">
            <b>Quintal:</b> {head.Quantal}
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  const renderPanel = (side, panel) => {
    const isDragOver = dragOverSide === side;

    return (
      <Box
        sx={{
          width: "50%",
          p: 1.5,
          boxSizing: "border-box",
        }}
      >
        <Paper
          onDragOver={(e) => handleDragOver(e, side)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, side)}
          elevation={isDragOver ? 6 : 1}
          sx={{
            position: "relative",
            p: 2,
            minHeight: "70vh",
            border: isDragOver ? "2px dashed #1976d2" : "2px dashed transparent",
            backgroundColor: isDragOver ? "rgba(25, 118, 210, 0.06)" : undefined,
            transition: "all 0.15s ease-in-out",
          }}
        >
          {isDragOver && panel.data && (
            <Box
              sx={{
                position: "absolute",
                top: 8,
                left: 0,
                right: 0,
                display: "flex",
                justifyContent: "center",
                pointerEvents: "none",
                zIndex: 1,
              }}
            >
              <Chip
                color="primary"
                icon={<SwapHorizIcon />}
                label={`Drop to move into Tender ${panel.data.head.Tender_No}`}
              />
            </Box>
          )}

          <Box display="flex" gap={1} mb={2} alignItems="center">
            <TextField
              size="small"
              label="Tender No"
              value={panel.tenderNoInput}
              onChange={(e) => handleTenderNoChange(side, e.target.value)}
              onKeyDown={(e) => handleTenderNoKeyDown(side, e)}
            />
            <Button
              variant="contained"
              size="small"
              onClick={() => fetchTender(side)}
              disabled={!panel.tenderNoInput}
            >
              Get
            </Button>
          </Box>

          {panel.loading ? (
            <Box display="flex" justifyContent="center" mt={4}>
              <CircularSpinner />
            </Box>
          ) : panel.data ? (
            <>
              {renderHeadCard(panel.data.head, panel.data.SelfBalance)}

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell width={28} />
                      <TableCell><b>ID</b></TableCell>
                      <TableCell><b>Buyer Name</b></TableCell>
                      <TableCell><b>Grade Name</b></TableCell>
                      <TableCell><b>Sauda Date</b></TableCell>
         
                      <TableCell align="right"><b>Sale Rate</b></TableCell>
                                   <TableCell align="right"><b>Buyer Quintal</b></TableCell>
                      {/* <TableCell><b>Despatched</b></TableCell>
                      <TableCell><b>Balance</b></TableCell> */}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {panel.data.details.map((row) => {
                      const isEbuyRow =
                        row.IsEbuySugarEntry ||
                        (row.Buyer != null && String(row.Buyer) === String(EBUY_SUGAR_AC_CODE));
                      const isBeingDragged = draggingId === row.tenderdetailid;
                      const isJustMoved =
                        justMoved &&
                        justMoved.side === side &&
                        justMoved.tenderdetailid === row.tenderdetailid;

                      return (
                        <TableRow
                          key={row.tenderdetailid}
                          hover
                          draggable={!isEbuyRow}
                          onDragStart={(e) => !isEbuyRow && handleDragStart(e, side, row)}
                          onDragEnd={handleDragEnd}
                          title={isEbuyRow ? "eBuy Sugar entries cannot be shifted" : "Drag to move to the other tender"}
                          sx={{
                            cursor: isEbuyRow ? "not-allowed" : "grab",
                            opacity: isEbuyRow ? 0.55 : isBeingDragged ? 0.3 : 1,
                            backgroundColor: isJustMoved ? "rgba(46, 125, 50, 0.15)" : undefined,
                            transition: "background-color 0.6s ease-in-out, opacity 0.15s ease-in-out",
                          }}
                        >
                          <TableCell sx={{ color: isEbuyRow ? "text.disabled" : "text.secondary" }}>
                            {!isEbuyRow && <DragIndicatorIcon fontSize="small" />}
                          </TableCell>
                          <TableCell>{row.ID}</TableCell>
                          <TableCell>{row.BuyerName}</TableCell>
                          <TableCell>{row.GradeName || "-"}</TableCell>
                          <TableCell>{row.Sauda_Date}</TableCell>
                         
                          <TableCell align="right">{row.Sale_Rate}</TableCell>
                           <TableCell align="right">{row.Buyer_Quantal}</TableCell>
                          {/* <TableCell>{row.Despatched}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              variant="outlined"
                              color={row.Balance > 0 ? "success" : "default"}
                              label={row.Balance}
                            />
                          </TableCell> */}
                        </TableRow>
                      );
                    })}
                    {panel.data.details.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          No sauda entries in this tender.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                  {panel.data.details.length > 0 && (
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={6} />
                        <TableCell
                          align="right"
                          sx={{
                            borderTop: "2px dashed",
                            borderTopColor: "divider",
                            fontWeight: "bold",
                          }}
                        >
                          {panel.data.details
                            .reduce((sum, r) => sum + Number(r.Buyer_Quantal || 0), 0)
                            .toFixed(2)}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  )}
                </Table>
              </TableContainer>

              {/* {(panel.data.ShiftedOut?.length > 0 || panel.data.ReceivedIn?.length > 0) && (
                <Box mt={2}>
                  <Typography variant="subtitle2" fontWeight="bold" color="text.secondary" mb={1}>
                    Remarks
                  </Typography>
                  {panel.data.ShiftedOut?.map((log) => (
                    <Box key={`out-${log.id}`} display="flex" alignItems="flex-start" gap={0.75} mb={0.5}>
                      <NorthEastIcon fontSize="small" color="warning" sx={{ mt: 0.25 }} />
                      <Typography variant="body2">{log.remark}</Typography>
                    </Box>
                  ))}
                  {panel.data.ReceivedIn?.map((log) => (
                    <Box key={`in-${log.id}`} display="flex" alignItems="flex-start" gap={0.75} mb={0.5}>
                      <SouthWestIcon fontSize="small" color="success" sx={{ mt: 0.25 }} />
                      <Typography variant="body2">{log.reference_remark}</Typography>
                    </Box>
                  ))}
                </Box>
              )} */}
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Enter a Tender No and click Load.
            </Typography>
          )}
        </Paper>
      </Box>
    );
  };

  return (
    <Box p={3}>
      <Box display="flex" alignItems="center" mb={2}>
        <Box mr={2}>
          <BackButton onClick={handleBack} />
        </Box>
        <Typography variant="h6" fontWeight="bold" sx={{ flex: 1, textAlign: "center" }}>
          Sauda Shifting
        </Typography>
      </Box>

      <Box display="flex" position="relative">
        {renderPanel("left", left)}

        <Box
          sx={{
            position: "absolute",
            left: "50%",
            top: 24,
            transform: "translateX(-50%)",
            zIndex: 2,
            backgroundColor: "background.paper",
            borderRadius: "50%",
            boxShadow: 2,
            p: 0.75,
            display: "flex",
          }}
        >
          <SwapHorizIcon color="primary" />
        </Box>

        {renderPanel("right", right)}
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SaudaShifting;
