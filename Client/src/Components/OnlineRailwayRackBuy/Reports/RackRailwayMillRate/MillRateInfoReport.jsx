import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  CircularProgress,
  TextField,
} from "@mui/material";

const API_URL = process.env.REACT_APP_API;

const MillRateReportTable = () => {
  const [searchParams] = useSearchParams();
  const millCode = searchParams.get("millCode");
  const millName = searchParams.get("millName");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (millCode) {
      axios
        .get(`${API_URL}/get_RackRailwayMillRateReport?Mill_Id=${millCode}`)
        .then((res) => {
          const filteredData = (res.data.all_data || []).filter(
            (row) => row.RailStation !== row.toStation
          );

          const responseData = filteredData.map((row) => ({
            ...row,
            Mill_rate: 0,
            GST_percent: 5,
          }));

          setData(responseData);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Failed to fetch report:", err);
          setLoading(false);
        });
    }
  }, [millCode]);

  const handleRateChange = (index, value) => {
    const updatedData = [...data];
    updatedData[index].Mill_rate = parseFloat(value) || 0;
    setData(updatedData);
  };

  const handleGSTChange = (index, value) => {
    const updatedData = [...data];
    updatedData[index].GST_percent = parseFloat(value) || 0;
    setData(updatedData);
  };

  return (
    <div style={{ padding: "20px" }}>
      <Typography variant="h5" gutterBottom>
        Mill Rate Report for: <strong>{millName}</strong>
      </Typography>

      {loading ? (
        <CircularProgress />
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f0f0f0" }}>
                <TableCell>Mill Name</TableCell>
                <TableCell>Mill Rate (Input)</TableCell>
                <TableCell>Rail Station</TableCell>
                <TableCell>Local Expenses</TableCell>
                <TableCell>To Station</TableCell>
                <TableCell>Min Rate</TableCell>
                <TableCell>Min + Local + Mill</TableCell>
                <TableCell>GST %</TableCell>
                <TableCell>GST Amt</TableCell>
                <TableCell>Min Final</TableCell>
                <TableCell>Full Rate</TableCell>
                <TableCell>Full + Local + Mill</TableCell>
                <TableCell>GST Amt</TableCell>
                <TableCell>Full Final</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row, index) => {
                const millRate = parseFloat(row.Mill_rate) || 0;
                const gstPercent = parseFloat(row.GST_percent) || 0;
                const local = parseFloat(row.Local_Expenses) || 0;
                const minRate = parseFloat(row.Min_rate) || 0;
                const fullRate = parseFloat(row.Full_rate) || 0;

                const minBase = minRate + local + millRate;
                const minGST = (minBase * gstPercent) / 100;
                const minFinal = minBase + minGST;

                const fullBase = fullRate + local + millRate;
                const fullGST = (fullBase * gstPercent) / 100;
                const fullFinal = fullBase + fullGST;

                return (
                  <TableRow key={index}>
                    <TableCell>{row.Mill_name}</TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        value={row.Mill_rate}
                        onChange={(e) =>
                          handleRateChange(index, e.target.value)
                        }
                      />
                    </TableCell>
                    <TableCell>{row.RailStation}</TableCell>
                    <TableCell>{local.toFixed(2)}</TableCell>
                    <TableCell>{row.toStation}</TableCell>
                    <TableCell>{minRate.toFixed(2)}</TableCell>
                    <TableCell>{minBase.toFixed(2)}</TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        value={gstPercent}
                        onChange={(e) => handleGSTChange(index, e.target.value)}
                      />
                    </TableCell>
                    <TableCell>{minGST.toFixed(2)}</TableCell>
                    <TableCell>{minFinal.toFixed(2)}</TableCell>
                    <TableCell>{fullRate.toFixed(2)}</TableCell>
                    <TableCell>{fullBase.toFixed(2)}</TableCell>
                    <TableCell>{fullGST.toFixed(2)}</TableCell>
                    <TableCell>{fullFinal.toFixed(2)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </div>
  );
};

export default MillRateReportTable;
