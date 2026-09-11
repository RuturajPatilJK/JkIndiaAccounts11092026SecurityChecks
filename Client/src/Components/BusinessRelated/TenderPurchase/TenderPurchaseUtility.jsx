import React, { useEffect, useState } from "react";
import TableUtility from "../../../Common/UtilityCommon/TableUtility";
import { Box } from "@mui/material";

const API_URL = process.env.REACT_APP_API;
const WEBSOCKET_URL = process.env.REACT_APP_API_WEBSOCKET;

const TenderPurchaseUtility = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [wsStatus, setWsStatus] = useState("Connecting...");

  const apiUrl = `${API_URL}/all_tender_data`;

  useEffect(() => {
    let socket;

    const connect = () => {
      socket = new WebSocket(WEBSOCKET_URL);

      socket.onopen = () => {
        setWsStatus("Connected");
      };

      socket.onmessage = (event) => {
        const dataStr = String(event.data).toLowerCase();

        if (dataStr.includes("refresh_tenders")) {
          setSnackbarOpen(true);
          setRefreshKey((prev) => prev + 1);
        }
      };

      socket.onclose = () => {
        setWsStatus("Disconnected");
        setTimeout(connect, 3000);
      };

      socket.onerror = (err) => {
        setWsStatus("Error");
        console.error("Socket Error:", err);
      };
    };

    connect();

    return () => {
      if (socket) socket.close();
    };
  }, []);

  const columns = [
    { label: "Tender No", key: "Tender_No" },
    { label: "Tender Date", key: "Tender_Date" },
    { label: "Mill Short Name", key: "millshortname" },
    { label: "Quintal", key: "Quantal", format: true },
    { label: "Grade", key: "Grade" },
    { label: "Mill Rate", key: "Mill_Rate", format: true },
    { label: "Payment To Name", key: "paymenttoname" },
    { label: "Tender Do Name", key: "tenderdoname" },
    { label: "Lifting Date", key: "Lifting_Date" },
    { label: "Tender ID", key: "tenderid" },
  ];

  return (
    <Box sx={{ position: 'relative' }}>
      <TableUtility
        key={refreshKey}
        title="Tender Purchase"
        apiUrl={apiUrl}
        columns={columns}
        rowKey="Tender_No"
        addUrl="/tender_head"
        detailUrl="/tender_head"
        permissionUrl="/tender-purchaseutility"
      />

    </Box>
  );
};

export default TenderPurchaseUtility;