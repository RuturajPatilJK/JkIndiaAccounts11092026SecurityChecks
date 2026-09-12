import React, { useEffect, useState } from "react";
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Grid, Paper, Typography, FormControl, Select, MenuItem,
    InputLabel, Box, Stack, useMediaQuery, useTheme, Button
} from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import * as XLSX from "xlsx";
import Pagination from "../../Common/UtilityCommon/Pagination";
import SearchBar from "../../Common/UtilityCommon/SearchBar";
import PerPageSelect from "../../Common/UtilityCommon/PerPageSelect";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import PageNotFound from "./../PageNotFound/PageNotFound";
import BackButton from "../Buttons/BackButton";
import CreateNewButton from "../Buttons/CreateNewButton";
import CircularSpinner from "../Spinners/CircularSpinner";
import { formatReadableAmount } from "../FormatFunctions/FormatAmount";

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

function TableUtility({
    title,
    apiUrl,
    columns,
    rowKey,
    addUrl,
    detailUrl,
    permissionUrl,
    dropdownOptions = null,
    dropdownValue,
    onDropdownChange,
    dropdownFilterKey = 'tran_type',
    queryParams = {},
    includeYearCode,
    getRowStyle,
    enableExcelExport = false,
    exportFileName
}) {
    const companyCode = sessionStorage.getItem('Company_Code');
    const Year_Code = sessionStorage.getItem('Year_Code');
    const uid = sessionStorage.getItem('uid');

    const [fetchedData, setFetchedData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [perPage, setPerPage] = useState(15);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [canView, setCanView] = useState(null);
    const [permissionsData, setPermissionData] = useState({});
    const [localDropdownValue, setLocalDropdownValue] = useState(dropdownValue);
    const [loading, setLoading] = useState(true);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const navigate = useNavigate();

    useEffect(() => {
        const checkPermissions = async () => {
            try {
                const response = await axios.get(
                    `${process.env.REACT_APP_API}/get_user_permissions?Company_Code=${companyCode}&Program_Name=${permissionUrl}&uid=${uid}`
                );
                setPermissionData(response.data?.UserDetails);
                if (response.data?.UserDetails?.canView === 'Y') {
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
            setLoading(true);
            try {
                const params = new URLSearchParams({
                    Company_Code: companyCode,
                    ...queryParams
                });
                if (includeYearCode) params.append('Year_Code', Year_Code);
                const response = await axios.get(`${apiUrl}?${params.toString()}`);
                if (response.data) {
                    const dataKey = Object.keys(response.data)[0];
                    setFetchedData(response.data[dataKey]);
                    setFilteredData(response.data[dataKey]);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        checkPermissions();
    }, [apiUrl, JSON.stringify(queryParams)]);

    useEffect(() => {
        const delay = setTimeout(() => {
            const filtered = fetchedData.filter(post => {
                const searchTermLower = searchTerm.toLowerCase();
                const matchesSearch = Object.keys(post).some(key =>
                    String(post[key]).toLowerCase().includes(searchTermLower)
                );
                const matchesDropdown = localDropdownValue
                    ? post[dropdownFilterKey] === localDropdownValue
                    : true;
                return matchesSearch && matchesDropdown;
            });
            setFilteredData(filtered);
            setCurrentPage(1);
        }, 400);

        return () => clearTimeout(delay);
    }, [searchTerm, fetchedData, localDropdownValue, dropdownFilterKey]);

    // ✅ Hide footer on mobile
    useEffect(() => {
        if (isMobile) {
            const styleId = 'mobile-footer-hide-style';
            if (!document.getElementById(styleId)) {
                const el = document.createElement('style');
                el.id = styleId;
                el.innerHTML = `footer, .footer, [class*="Footer"], [class*="footer"],
                    .main-footer, .app-footer, .page-footer { display: none !important; }`;
                document.head.appendChild(el);
            }
        } else {
            document.getElementById('mobile-footer-hide-style')?.remove();
        }
        return () => document.getElementById('mobile-footer-hide-style')?.remove();
    }, [isMobile]);

    if (canView === false) return <PageNotFound />;

    const handlePerPageChange = (event) => {
        setPerPage(event.target.value);
        setCurrentPage(1);
    };

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleRowClick = (rowId) => {
        const selectedRecord = filteredData.find(record => record[rowKey] === rowId);
        navigate(detailUrl, { state: { selectedRecord, permissionsData } });
    };

    const handleAddClick = () => {
        const stateData = { permissionsData };
        if (localDropdownValue) stateData.selectedfilter = localDropdownValue;
        navigate(addUrl, { state: stateData });
    };

    const handleExportToExcel = () => {
        const wsData = [
            columns.map((column) => column.label),
            ...filteredData.map((row) => columns.map((column) => row[column.key] ?? "")),
        ];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, (title || "Data").slice(0, 31));
        XLSX.writeFile(wb, `${exportFileName || title || "export"}.xlsx`);
    };

    const pageCount = Math.ceil(filteredData.length / perPage);
    const paginatedPosts = filteredData.slice((currentPage - 1) * perPage, currentPage * perPage);

    const titleSx = {
        fontWeight: 'bold',
        color: '#2c3e50',
        textAlign: 'center',
        position: 'relative',
        pb: 1,
        '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '80px',
            height: '4px',
            background: 'linear-gradient(90deg, #3498db, #2ecc71)',
            borderRadius: '2px',
        }
    };

    return (
        <Box sx={{ px: { xs: 1, sm: 2, md: 3 }, py: { xs: 1, sm: 2 } }}>

            {/* ─── MOBILE HEADER ─────────────────────────────────────────── */}
            {isMobile ? (
                <Box>
                    {/* Row 1: Buttons */}
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <BackButton onClick={() => navigate("/dashboard")} />
                        <CreateNewButton
                            onClick={handleAddClick}
                            disabled={permissionsData.canSave === "N"}
                            permissionsData={permissionsData}
                        />

                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mb: 1 }}>
                            <PerPageSelect value={perPage} onChange={handlePerPageChange} />
                            {dropdownOptions && (
                                <FormControl size="small" sx={{ minWidth: 130, flex: 1 }}>
                                    <InputLabel>Filter by Type</InputLabel>
                                    <Select
                                        value={localDropdownValue}
                                        label="Filter by Type"
                                        onChange={(e) => {
                                            setLocalDropdownValue(e.target.value);
                                            onDropdownChange(e);
                                        }}
                                    >
                                        <MenuItem value=""><em>All</em></MenuItem>
                                        {dropdownOptions.map((option, index) => (
                                            <MenuItem key={index} value={option.value}>{option.label}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}
                            {enableExcelExport && (
                                <Button
                                    size="small"
                                    variant="outlined"
                                    color="success"
                                    startIcon={<FileDownloadIcon />}
                                    onClick={handleExportToExcel}
                                >
                                    Export
                                </Button>
                            )}
                        </Stack>
                    </Stack>

                    {/* Row 2: Title */}
                    <Typography variant="subtitle1" sx={{ ...titleSx, mb: 1.5 }}>
                        {title}
                    </Typography>

                    <Box sx={{ mb: 1 }}>
                        <SearchBar
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            fullWidth
                            size="small"
                        />
                    </Box>
                </Box>

            ) : (
                /* ─── DESKTOP HEADER ───────────────────────────────────────────── */
                <Grid container spacing={2} alignItems="center" justifyContent="space-between">
                    {/* Left: Buttons + PerPage */}
                    <Grid item xs="auto">
                        <Stack direction="row" spacing={1} alignItems="center">
                            <CreateNewButton
                                onClick={handleAddClick}
                                disabled={permissionsData.canSave === "N"}
                                permissionsData={permissionsData}
                            />
                            <BackButton onClick={() => navigate("/dashboard")} />
                            <PerPageSelect value={perPage} onChange={handlePerPageChange} />
                        </Stack>
                    </Grid>

                    {/* Center: Title */}
                    <Grid item xs={12} sm={4} display="flex" justifyContent="center" style={{ marginLeft: "300px" }}>
                        <Typography variant="h6" sx={titleSx}>
                            {title}
                        </Typography>
                    </Grid>

                    {/* Right: Dropdown + Search */}
                    <Grid item xs={12} sm={4}>
                        <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end">
                            {dropdownOptions && (
                                <FormControl size="small" sx={{ minWidth: 140 }}>
                                    <InputLabel>Filter by Type</InputLabel>
                                    <Select
                                        value={localDropdownValue}
                                        label="Filter by Type"
                                        onChange={(e) => {
                                            setLocalDropdownValue(e.target.value);
                                            onDropdownChange(e);
                                        }}
                                    >
                                        <MenuItem value=""><em>All</em></MenuItem>
                                        {dropdownOptions.map((option, index) => (
                                            <MenuItem key={index} value={option.value}>{option.label}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}
                            {enableExcelExport && (
                                <Button
                                    size="small"
                                    variant="outlined"
                                    color="success"
                                    startIcon={<FileDownloadIcon />}
                                    onClick={handleExportToExcel}
                                >
                                    Export
                                </Button>
                            )}
                            <SearchBar
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </Stack>
                    </Grid>
                </Grid>
            )}

            {/* ─── TABLE ─────────────────────────────────────────────────────── */}
            <Grid item xs={12} mt={2}>
                <Paper elevation={20} sx={{ borderRadius: 3, overflow: 'hidden' }}>
                    <TableContainer
                        sx={{
                            maxHeight: { xs: '55vh', sm: '60vh', md: '70vh' },
                            overflowX: 'auto',
                            overflowY: 'auto',
                            '&::-webkit-scrollbar': { height: '8px', width: '8px' },
                            '&::-webkit-scrollbar-thumb': { backgroundColor: '#ccc', borderRadius: '4px' }
                        }}
                    >
                        <Table stickyHeader sx={{ minWidth: { xs: 500, sm: 650, md: 800 } }}>
                            <TableHead>
                                <TableRow>
                                    {columns.map((column, index) => (
                                        <TableCell
                                            key={index}
                                            sx={{
                                                ...styles.tableHeaderCell,
                                                fontSize: { xs: '12px', sm: '14px', md: '16px' },
                                                textAlign: column.format ? 'right' : 'left',
                                            }}
                                        >
                                            {column.label}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={columns.length} align="center">
                                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                                                <CircularSpinner />
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ) : paginatedPosts.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={columns.length}
                                            align="center"
                                            sx={{ fontSize: { xs: '13px', sm: '16px' }, fontWeight: 'bold' }}
                                        >
                                            No data found...
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedPosts.map((post) => (
                                        <TableRow
                                            key={post[rowKey]}
                                            // ✅ FIX: single tap on mobile, double click on desktop
                                            onClick={isMobile ? () => handleRowClick(post[rowKey]) : undefined}
                                            onDoubleClick={!isMobile ? () => handleRowClick(post[rowKey]) : undefined}
                                            sx={{
                                                cursor: 'pointer',
                                                transition: 'background-color 0.3s ease',
                                                '&:hover': { backgroundColor: '#f3f388' },
                                                ...(getRowStyle ? getRowStyle(post) : {})
                                            }}
                                        >
                                            {columns.map((column, index) => (
                                                <TableCell
                                                    key={index}
                                                    sx={{
                                                        whiteSpace: { xs: 'normal', sm: 'nowrap' },
                                                        wordBreak: 'break-word',
                                                        textAlign: column.format ? 'right' : 'left',
                                                        fontSize: { xs: '12px', sm: '14px' },
                                                        py: { xs: 1, sm: 1.5 }
                                                    }}
                                                >
                                                    {column.format
                                                        ? formatReadableAmount(post[column.key])
                                                        : post[column.key]}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            </Grid>

            {/* ─── PAGINATION ────────────────────────────────────────────────── */}
            <Grid item xs={12} mt={3} mb={6}>
                <Pagination
                    pageCount={pageCount}
                    currentPage={currentPage}
                    onPageChange={handlePageChange}
                    sx={{
                        '& .MuiPagination-ul': {
                            justifyContent: { xs: 'center', sm: 'flex-start' },
                            flexWrap: 'wrap',
                        },
                        '& .MuiPaginationItem-root': {
                            fontSize: { xs: '12px', sm: '14px' },
                            minWidth: { xs: '30px', sm: '40px' },
                            height: { xs: '30px', sm: '40px' }
                        }
                    }}
                />
            </Grid>
        </Box>
    );
}

export default TableUtility;




// import React, { useEffect, useState } from "react";
// import {
//     Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
//     Grid, Paper, Typography, FormControl, Select, MenuItem,
//     InputLabel, Box, Stack, useMediaQuery, useTheme
// } from "@mui/material";
// import Pagination from "../../Common/UtilityCommon/Pagination";
// import SearchBar from "../../Common/UtilityCommon/SearchBar";
// import PerPageSelect from "../../Common/UtilityCommon/PerPageSelect";
// import { useNavigate } from "react-router-dom";
// import axios from "axios";
// import PageNotFound from "./../PageNotFound/PageNotFound";
// import BackButton from "../Buttons/BackButton";
// import CreateNewButton from "../Buttons/CreateNewButton";
// import CircularSpinner from "../Spinners/CircularSpinner";
// import { formatReadableAmount } from "../FormatFunctions/FormatAmount";


// const styles = {
//     tableHeaderCell: {
//         fontSize: '16px',
//         fontWeight: 'bold',
//         backgroundColor: '#f4f4f4',
//         whiteSpace: 'nowrap',
//         position: 'sticky',
//         top: 0,
//         zIndex: 1
//     }
// };

// function TableUtility({
//     title,
//     apiUrl,
//     columns,
//     rowKey,
//     addUrl,
//     detailUrl,
//     permissionUrl,
//     dropdownOptions = null,
//     dropdownValue,
//     onDropdownChange,
//     queryParams = {},
//     includeYearCode,
//     getRowStyle
// }) {
//     const companyCode = sessionStorage.getItem('Company_Code');
//     const Year_Code = sessionStorage.getItem('Year_Code');
//     const uid = sessionStorage.getItem('uid');

//     const [fetchedData, setFetchedData] = useState([]);
//     const [filteredData, setFilteredData] = useState([]);
//     const [perPage, setPerPage] = useState(15);
//     const [searchTerm, setSearchTerm] = useState("");
//     const [currentPage, setCurrentPage] = useState(1);
//     const [canView, setCanView] = useState(null);
//     const [permissionsData, setPermissionData] = useState({});
//     const [localDropdownValue, setLocalDropdownValue] = useState(dropdownValue);
//     const [loading, setLoading] = useState(true);

//     const theme = useTheme();
//     const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
//     const navigate = useNavigate();

//     // ✅ Fetch permissions and data
//     useEffect(() => {
//         const checkPermissions = async () => {
//             try {
//                 const response = await axios.get(
//                     `${process.env.REACT_APP_API}/get_user_permissions?Company_Code=${companyCode}&Program_Name=${permissionUrl}&uid=${uid}`
//                 );
//                 setPermissionData(response.data?.UserDetails);
//                 if (response.data?.UserDetails?.canView === 'Y') {
//                     setCanView(true);
//                     fetchData();
//                 } else {
//                     setCanView(false);
//                 }
//             } catch (error) {
//                 console.error("Error fetching user permissions:", error);
//                 setCanView(false);
//             }
//         };

//         const fetchData = async () => {
//             setLoading(true);
//             try {
//                 const params = new URLSearchParams({
//                     Company_Code: companyCode,
//                     ...queryParams
//                 });
//                 if (includeYearCode) params.append('Year_Code', Year_Code);
//                 const response = await axios.get(`${apiUrl}?${params.toString()}`);
//                 if (response.data) {
//                     const dataKey = Object.keys(response.data)[0];
//                     setFetchedData(response.data[dataKey]);
//                     setFilteredData(response.data[dataKey]);
//                 }
//             } catch (error) {
//                 console.error("Error fetching data:", error);
//             } finally {
//                 setLoading(false);
//             }
//         };

//         checkPermissions();
//     }, [apiUrl, JSON.stringify(queryParams)]);

//     // ✅ Single debounced search — no focus loss
//     useEffect(() => {
//         const delay = setTimeout(() => {
//             const filtered = fetchedData.filter(post => {
//                 const searchTermLower = searchTerm.toLowerCase();
//                 const matchesSearch = Object.keys(post).some(key =>
//                     String(post[key]).toLowerCase().includes(searchTermLower)
//                 );
//                 const matchesDropdown = localDropdownValue
//                     ? post.tran_type === localDropdownValue
//                     : true;
//                 return matchesSearch && matchesDropdown;
//             });
//             setFilteredData(filtered);
//             setCurrentPage(1);
//         }, 400);

//         return () => clearTimeout(delay);
//     }, [searchTerm, fetchedData, localDropdownValue]);

//     // ✅ Hide footer on mobile
//     useEffect(() => {
//         if (isMobile) {
//             const styleId = 'mobile-footer-hide-style';
//             if (!document.getElementById(styleId)) {
//                 const el = document.createElement('style');
//                 el.id = styleId;
//                 el.innerHTML = `footer, .footer, [class*="Footer"], [class*="footer"],
//                     .main-footer, .app-footer, .page-footer { display: none !important; }`;
//                 document.head.appendChild(el);
//             }
//         } else {
//             document.getElementById('mobile-footer-hide-style')?.remove();
//         }
//         return () => document.getElementById('mobile-footer-hide-style')?.remove();
//     }, [isMobile]);

//     if (canView === false) return <PageNotFound />;

//     const handlePerPageChange = (event) => {
//         setPerPage(event.target.value);
//         setCurrentPage(1);
//     };

//     const handlePageChange = (pageNumber) => {
//         setCurrentPage(pageNumber);
//     };

//     const handleRowClick = (rowId) => {
//         const selectedRecord = filteredData.find(record => record[rowKey] === rowId);
//         navigate(detailUrl, { state: { selectedRecord, permissionsData } });
//     };

//     const handleAddClick = () => {
//         const stateData = { permissionsData };
//         if (localDropdownValue) stateData.selectedfilter = localDropdownValue;
//         navigate(addUrl, { state: stateData });
//     };

//     const pageCount = Math.ceil(filteredData.length / perPage);
//     const paginatedPosts = filteredData.slice((currentPage - 1) * perPage, currentPage * perPage);

//     const titleSx = {
//         fontWeight: 'bold',
//         color: '#2c3e50',
//         textAlign: 'center',
//         position: 'relative',
//         pb: 1,
//         '&::after': {
//             content: '""',
//             position: 'absolute',
//             bottom: 0,
//             left: '50%',
//             transform: 'translateX(-50%)',
//             width: '80px',
//             height: '4px',
//             background: 'linear-gradient(90deg, #3498db, #2ecc71)',
//             borderRadius: '2px',
//         }
//     };

//     return (
//         <Box sx={{ px: { xs: 1, sm: 2, md: 3 }, py: { xs: 1, sm: 2 } }}>

//             {/* ─── MOBILE HEADER ─────────────────────────────────────────── */}
//             {isMobile ? (
//                 <Box>
//                     {/* Row 1: Buttons */}
//                     <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
//                         <BackButton onClick={() => navigate("/dashboard")} />
//                         <CreateNewButton
//                             onClick={handleAddClick}
//                             disabled={permissionsData.canSave === "N"}
//                             permissionsData={permissionsData}
//                         />

//                         <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mb: 1 }}>
//                             <PerPageSelect value={perPage} onChange={handlePerPageChange} />
//                             {dropdownOptions && (
//                                 <FormControl size="small" sx={{ minWidth: 130, flex: 1 }}>
//                                     <InputLabel>Filter by Type</InputLabel>
//                                     <Select
//                                         value={localDropdownValue}
//                                         label="Filter by Type"
//                                         onChange={(e) => {
//                                             setLocalDropdownValue(e.target.value);
//                                             onDropdownChange(e);
//                                         }}
//                                     >
//                                         <MenuItem value=""><em>All</em></MenuItem>
//                                         {dropdownOptions.map((option, index) => (
//                                             <MenuItem key={index} value={option.value}>{option.label}</MenuItem>
//                                         ))}
//                                     </Select>
//                                 </FormControl>
//                             )}
//                         </Stack>
//                     </Stack>

//                     {/* Row 2: Title */}
//                     <Typography variant="subtitle1" sx={{ ...titleSx, mb: 1.5 }}>
//                         {title}
//                     </Typography>

//                     <Box sx={{ mb: 1 }}>
//                         <SearchBar
//                             value={searchTerm}
//                             onChange={(e) => setSearchTerm(e.target.value)}
//                             fullWidth
//                             size="small"
//                         />
//                     </Box>
//                 </Box>

//             ) : (
//                 /* ─── DESKTOP HEADER ───────────────────────────────────────────── */
//                 <Grid container spacing={2} alignItems="center" justifyContent="space-between">
//                     {/* Left: Buttons + PerPage */}
//                     <Grid item xs="auto">
//                         <Stack direction="row" spacing={1} alignItems="center">
//                             <CreateNewButton
//                                 onClick={handleAddClick}
//                                 disabled={permissionsData.canSave === "N"}
//                                 permissionsData={permissionsData}
//                             />
//                             <BackButton onClick={() => navigate("/dashboard")} />
//                             <PerPageSelect value={perPage} onChange={handlePerPageChange} />
//                         </Stack>
//                     </Grid>

//                     {/* Center: Title */}
//                     <Grid item xs={12} sm={4} display="flex" justifyContent="center" style={{ marginLeft: "300px" }}>
//                         <Typography variant="h6" sx={titleSx}>
//                             {title}
//                         </Typography>
//                     </Grid>

//                     {/* Right: Dropdown + Search */}
//                     <Grid item xs={12} sm={4}>
//                         <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end">
//                             {dropdownOptions && (
//                                 <FormControl size="small" sx={{ minWidth: 140 }}>
//                                     <InputLabel>Filter by Type</InputLabel>
//                                     <Select
//                                         value={localDropdownValue}
//                                         label="Filter by Type"
//                                         onChange={(e) => {
//                                             setLocalDropdownValue(e.target.value);
//                                             onDropdownChange(e);
//                                         }}
//                                     >
//                                         <MenuItem value=""><em>All</em></MenuItem>
//                                         {dropdownOptions.map((option, index) => (
//                                             <MenuItem key={index} value={option.value}>{option.label}</MenuItem>
//                                         ))}
//                                     </Select>
//                                 </FormControl>
//                             )}
//                             <SearchBar
//                                 value={searchTerm}
//                                 onChange={(e) => setSearchTerm(e.target.value)}
//                             />
//                         </Stack>
//                     </Grid>
//                 </Grid>
//             )}

//             {/* ─── TABLE ─────────────────────────────────────────────────────── */}
//             <Grid item xs={12} mt={2}>
//                 <Paper elevation={20} sx={{ borderRadius: 3, overflow: 'hidden' }}>
//                     <TableContainer
//                         sx={{
//                             maxHeight: { xs: '55vh', sm: '60vh', md: '70vh' },
//                             overflowX: 'auto',
//                             overflowY: 'auto',
//                             '&::-webkit-scrollbar': { height: '8px', width: '8px' },
//                             '&::-webkit-scrollbar-thumb': { backgroundColor: '#ccc', borderRadius: '4px' }
//                         }}
//                     >
//                         <Table stickyHeader sx={{ minWidth: { xs: 500, sm: 650, md: 800 } }}>
//                             <TableHead>
//                                 <TableRow>
//                                     {columns.map((column, index) => (
//                                         <TableCell
//                                             key={index}
//                                             sx={{
//                                                 ...styles.tableHeaderCell,
//                                                 fontSize: { xs: '12px', sm: '14px', md: '16px' },
//                                                 textAlign: column.format ? 'right' : 'left',
//                                             }}
//                                         >
//                                             {column.label}
//                                         </TableCell>
//                                     ))}
//                                 </TableRow>
//                             </TableHead>

//                             <TableBody>
//                                 {loading ? (
//                                     <TableRow>
//                                         <TableCell colSpan={columns.length} align="center">
//                                             <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
//                                                 <CircularSpinner />
//                                             </Box>
//                                         </TableCell>
//                                     </TableRow>
//                                 ) : paginatedPosts.length === 0 ? (
//                                     <TableRow>
//                                         <TableCell
//                                             colSpan={columns.length}
//                                             align="center"
//                                             sx={{ fontSize: { xs: '13px', sm: '16px' }, fontWeight: 'bold' }}
//                                         >
//                                             No data found...
//                                         </TableCell>
//                                     </TableRow>
//                                 ) : (
//                                     paginatedPosts.map((post) => (
//                                         <TableRow
//                                             key={post[rowKey]}
//                                             // ✅ FIX: single tap on mobile, double click on desktop
//                                             onClick={isMobile ? () => handleRowClick(post[rowKey]) : undefined}
//                                             onDoubleClick={!isMobile ? () => handleRowClick(post[rowKey]) : undefined}
//                                             sx={{
//                                                 cursor: 'pointer',
//                                                 transition: 'background-color 0.3s ease',
//                                                 '&:hover': { backgroundColor: '#f3f388' },
//                                                 ...(getRowStyle ? getRowStyle(post) : {})
//                                             }}
//                                         >
//                                             {columns.map((column, index) => (
//                                                 <TableCell
//                                                     key={index}
//                                                     sx={{
//                                                         whiteSpace: { xs: 'normal', sm: 'nowrap' },
//                                                         wordBreak: 'break-word',
//                                                         textAlign: column.format ? 'right' : 'left',
//                                                         fontSize: { xs: '12px', sm: '14px' },
//                                                         py: { xs: 1, sm: 1.5 }
//                                                     }}
//                                                 >
//                                                     {column.format
//                                                         ? formatReadableAmount(post[column.key])
//                                                         : post[column.key]}
//                                                 </TableCell>
//                                             ))}
//                                         </TableRow>
//                                     ))
//                                 )}
//                             </TableBody>
//                         </Table>
//                     </TableContainer>
//                 </Paper>
//             </Grid>

//             {/* ─── PAGINATION ────────────────────────────────────────────────── */}
//             <Grid item xs={12} mt={3} mb={6}>
//                 <Pagination
//                     pageCount={pageCount}
//                     currentPage={currentPage}
//                     onPageChange={handlePageChange}
//                     sx={{
//                         '& .MuiPagination-ul': {
//                             justifyContent: { xs: 'center', sm: 'flex-start' },
//                             flexWrap: 'wrap',
//                         },
//                         '& .MuiPaginationItem-root': {
//                             fontSize: { xs: '12px', sm: '14px' },
//                             minWidth: { xs: '30px', sm: '40px' },
//                             height: { xs: '30px', sm: '40px' }
//                         }
//                     }}
//                 />
//             </Grid>
//         </Box>
//     );
// }

// export default TableUtility;

