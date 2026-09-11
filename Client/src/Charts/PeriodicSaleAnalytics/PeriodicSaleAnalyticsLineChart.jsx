import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  TextField,
  Button,
  Stack,
  CircularProgress,
  Typography,
  Box,
} from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import BackButton from "../../Common/Buttons/BackButton";
import RefreshIcon from "@mui/icons-material/Refresh";
import CircularSpinner from "../../Common/Spinners/CircularSpinner"

const API_URL = process.env.REACT_APP_API;

const PeriodicSaleAnalyticsLineChart = () => {
  const today = new Date();
  const formattedToday = today.toISOString().split("T")[0];

  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(formattedToday);
  const [endDate, setEndDate] = useState(formattedToday);
  const [loading, setLoading] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  const navigate = useNavigate();

  const handleFetchData = async () => {
    setIsClicked(true);
    if (!startDate || !endDate) {
      setError("Please select both start and end dates.");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError("Start date cannot be later than the end date.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const datesResponse = await axios.get(
        `${API_URL}/get-periodic-sale-dates`,
        {
          params: { start_date_str: startDate, end_date_str: endDate },
        }
      );

      if (datesResponse.status === 200) {
        const dataResponse = await axios.get(
          `${API_URL}/get-periodic-sale-data`,
          {
            params: { start_date_str: startDate, end_date_str: endDate },
          }
        );

        if (dataResponse.data && dataResponse.data.length > 0) {
          setData(dataResponse.data);
          setError(null);
        } else {
          console.log("No data available for the selected date range.");
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDataForChart = () => {
    if (data && data.length > 0) {
      const formattedData = data
        .map((item) => ({
          date: new Date(item.Doc_date),
          dayqntl: parseFloat(item.dayqntl),
          average: parseFloat(item.average),
          target: parseFloat(item.target),
        }))
        .filter(
          (item) => item.dayqntl > 0 && item.average > 0 && item.target > 0
        );

      return formattedData;
    }
    return [];
  };

  const formattedChartData = formatDataForChart();

  useEffect(() => {
    if (formattedChartData.length === 0) {
      console.log("No valid data available for the chart.");
    }
  }, [formattedChartData]);

  const handleBack = () => {
    navigate("/DashBoard");
  };

  return (
    <div style={{ maxWidth: "100%", overflowX: "hidden", marginTop:"-80px"}}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
          flexWrap: "wrap",
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            sx={{ width: 150 }}
            InputLabelProps={{
              style: { fontSize: "14px" },
              shrink: true,
            }}
            InputProps={{
              style: {
                fontSize: "12px",
                height: "30px",
                fontWeight: "700",
              },
            }}
          />

          <TextField
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            sx={{ width: 150 }}
            InputLabelProps={{
              style: { fontSize: "14px" },
              shrink: true,
            }}
            InputProps={{
              style: {
                fontSize: "12px",
                height: "30px",
                fontWeight: "700",
              },
            }}
          />

          <Button
            variant="contained"
            color="secondary"
            onClick={handleFetchData}
            disabled={loading}
            style={{ height: "30px" }}
            sx={{
              backgroundColor: "#b72a0d",
              "&:hover": {
                backgroundColor: "#b72a0d",
              },
              fontWeight: "bold",
              minWidth: "40px",
            }}
          >
            <RefreshIcon fontSize="small" />
          </Button>
        </Stack>

        <Typography
          variant="h5"
          sx={{
            color: "rgb(12, 14, 177)",
            textAlign: "center",
            flex: 1,
            fontSize: "18px",
            fontWeight: "bold",
            marginLeft: "-150px"
          }}
        >
          Analysis Of Sales
        </Typography>

        <Box>
          <BackButton onClick={handleBack} />
        </Box>
      </Box>

      <Box sx={{ minHeight: 620, overflowY: "hidden" }}>
        {loading && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
              marginTop: '200px'
            }}
          >
            <CircularSpinner />
          </Box>
        )}

        {error && <div style={{ color: "red" }}>{error}</div>}

        {!loading && formattedChartData.length > 0 && (
          <ResponsiveContainer width="100%" height={600}>
            <LineChart data={formattedChartData}>
              <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
              <XAxis
                dataKey="date"
                tickFormatter={(tick) => tick.toLocaleDateString()}
                tick={{ fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                interval="auto"
                height={60}
              />
              <YAxis
                domain={[0, "dataMax"]}
                tick={{ fontSize: 12 }}
                tickCount={8}
              />
              <Tooltip
                labelFormatter={(label) =>
                  new Date(label).toLocaleDateString()
                }
                formatter={(value) => value.toFixed(2)}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="dayqntl"
                name="Day Quintal"
                stroke="#8884d8"
                activeDot={{ r: 6 }}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="average"
                name="Average"
                stroke="#82ca9d"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="target"
                name="Target"
                stroke="#ff7300"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Box>
    </div>
  );
};

export default PeriodicSaleAnalyticsLineChart;
