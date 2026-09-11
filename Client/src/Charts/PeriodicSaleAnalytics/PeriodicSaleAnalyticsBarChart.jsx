import axios from "axios";
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LabelList,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { Grid, TextField, Button, Box, Typography, CircularProgress } from "@mui/material";
import BackButton from "../../Common/Buttons/BackButton";
import RefreshIcon from "@mui/icons-material/Refresh";
import { formatReadableAmount } from "../../Common/FormatFunctions/FormatAmount";

const API_URL = process.env.REACT_APP_API;

const PeriodicSaleAnalyticsBarChart = () => {
  const [data, setData] = useState([]);
  const [totalSale, setTotalSale] = useState(0);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredBarIndex, setHoveredBarIndex] = useState(null);

  const navigate = useNavigate();
  const colors = [
    "#5a6268", "#007bff", "#28a745", "#ffc107", "#17a2b8", "#6f42c1",
    "#dc3545", "#20c997", "#fd7e14", "#6610f2", "#e83e8c", "#343a40",
  ];

  const getEndOfMonth = (dateStr) => {
    const d = new Date(dateStr);
    d.setMonth(d.getMonth() + 1);
    d.setDate(0);
    return d.toISOString().split("T")[0];
  };

  const loadChartData = useCallback(async (start, end) => {
    setIsLoading(true);
    try {
      const resData = await axios.get(`${API_URL}/get-periodic-sale-data`, {
        params: { start_date_str: start, end_date_str: end },
      });

      const json = resData.data;

      if (!Array.isArray(json) || json.length === 0) {
        alert("No data returned for the selected period!");
        setData([]);
        setTotalSale(0);
        return;
      }

      const monthMap = new Map();
      json.forEach((row) => {
        const monthKey = String(row.Doc_date).slice(0, 7);
        monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + (+row.monthlysale));
      });

      const sortedFormattedData = Array.from(monthMap.entries())
        .map(([key, value]) => ({
          date: key,
          monthlysale: value,
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .map((item, index) => ({
          ...item,
          fill: colors[index % colors.length],
        }));

      setData(sortedFormattedData);

      const total = sortedFormattedData.reduce(
        (sum, item) => sum + item.monthlysale,
        0
      );
      setTotalSale(total);
    } catch (error) {
      console.error("Error fetching chart data:", error);
      alert("Failed to fetch chart data. Please try again.");
      setData([]);
      setTotalSale(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const currentDate = new Date().toISOString().split("T")[0];
    setFromDate(currentDate);
    setToDate(currentDate);
    const start = currentDate;
    const end = getEndOfMonth(currentDate);
    loadChartData(start, end);
  }, [loadChartData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const start = fromDate;
    const end = getEndOfMonth(toDate);
    loadChartData(start, end);
  };

  const handlePrint = () => {
    const printContent = document.getElementById("charData").outerHTML;
    const totalSaleInfo = `<div style='margin-top: 20px; font-size: 16px;'><strong>Total Monthly Sale:</strong> ${formatReadableAmount(totalSale)} Quintal</div>`;
    const title = `<h2 style='text-align:center;'>Periodic Sale Analytics</h2>`;

    const win = window.open("", "", "height=700,width=900");
    win.document.write(`
            <html>
                <head>
                    <title>Print Chart</title>
                    <style>
                        body { font-family: 'Segoe UI', sans-serif; }
                        #charData svg { width: 100%; height: auto; }
                    </style>
                </head>
                <body>
                    ${title}
                    ${printContent}
                    ${totalSaleInfo}
                </body>
            </html>
        `);
    win.document.close();
    win.print();
  };

  const handleBack = () => {
    navigate("/DashBoard");
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: '#fff',
          border: '1px solid #ccc',
          padding: '10px',
          borderRadius: '5px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <p style={{ margin: 0, fontWeight: 'bold' }}>{`Month: ${label}`}</p>
          <p style={{ margin: 0 }}>{`Sale: ${formatReadableAmount(payload[0].value)} Quintal`}</p>
        </div>
      );
    }
    return null;
  };

  const handleBarClick = (data, index) => {
    console.log(`Bar clicked: ${data.date}, Sale: ${data.monthlysale}`);
  };

  return (
    <div
      style={{
        fontFamily: "Segoe UI",
        padding: "1 rem",
        backgroundColor: "#f8f9fa",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        minHeight: '100vh',
        boxSizing: 'border-box',
        marginTop:"-80px"
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{ width: "100%", maxWidth: "1800px" }}
      >
        <Box
          sx={{
            borderRadius: 2,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            backgroundColor: '#ffffff',
          }}
        >
          <Grid
            container
            spacing={1}
            alignItems="center"
            justifyContent="flex-start"
          >
            <Grid item xs={12} sm={6} md="auto">
              <TextField
                label="From Date"
                type="date"
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                InputProps={{
                  style: { fontSize: "12px", height: "30px", fontWeight: "700" },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md="auto">
              <TextField
                label="To Date"
                type="date"
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                InputProps={{
                  style: { fontSize: "12px", height: "30px", fontWeight: "700" },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={3} md="auto">
              <Button
                variant="contained"
                fullWidth
                type="submit"
                disabled={isLoading}
                sx={{
                  backgroundColor: "#b72a0d",
                  "&:hover": { backgroundColor: "#8c200c" },
                  fontWeight: "bold",
                  height: '30px',
                  fontSize: '12px',
                  minWidth: '30px',
                  padding: '0 8px'
                }}
              >
                {isLoading ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <RefreshIcon sx={{ fontSize: 18 }} />
                )}
              </Button>
            </Grid>
            <Grid item xs={12} sm={9} md sx={{ flexGrow: 1, textAlign: 'center' }}>
              <Typography variant="h6" component="h1"
                style={{
                  color: '#343a40',
                  fontWeight: 'bold',
                  lineHeight: '30px',
                  margin: 0,
                  marginLeft: "-150px"
                }}
              >
                Periodic Sale Analytics
              </Typography>
            </Grid>

            <Grid item xs={12} sm={12} md="auto" display="flex" justifyContent="flex-end">
              <BackButton onClick={handleBack} />
            </Grid>
          </Grid>
        </Box>
      </form>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', width: '100%' }}>
          <Typography variant="h6" color="textSecondary">Loading chart data...</Typography>
        </Box>
      ) : (
        <div
          id="charData"
          style={{
            backgroundColor: "#fff",
            padding: "1rem",
            borderRadius: "10px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
            marginBottom: "1.5rem",
            width: "100%",
            maxWidth: "100%",
            height: '60vh',
            minHeight: '400px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: '#666' }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 12, fill: '#666' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                <Bar
                  dataKey="monthlysale"
                  name="Monthly Sale"
                  onClick={handleBarClick}
                  onMouseEnter={(_, index) => setHoveredBarIndex(index)}
                  onMouseLeave={() => setHoveredBarIndex(null)}
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      cursor="pointer"
                      fill={index === hoveredBarIndex ? '#f9a825' : entry.fill}
                    />
                  ))}
                  <LabelList
                    dataKey="monthlysale"
                    position="top"
                    formatter={(value) => formatReadableAmount(value)}
                    style={{ fill: '#333', fontSize: 11 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Typography variant="h6" color="textSecondary">
              No chart data available for the selected period.
            </Typography>
          )}
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.8rem 1.5rem",
          backgroundColor: "#e9ecef",
          borderRadius: "8px",
          fontSize: "1rem",
          fontWeight: "600",
          width: "100%",
          maxWidth: "900px",
          marginBottom: "20px",
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}
      >
        <div>Total Monthly Sale : {formatReadableAmount(totalSale)} Quintal</div>
        <Button
          onClick={handlePrint}
          variant="contained"
          sx={{
            backgroundColor: "#6c757d",
            "&:hover": { backgroundColor: "#5a6268" },
            color: "#fff",
            fontWeight: "bold",
            textTransform: 'none'
          }}
        >
          Print Chart
        </Button>
      </div>
    </div>
  );
};

export default PeriodicSaleAnalyticsBarChart;