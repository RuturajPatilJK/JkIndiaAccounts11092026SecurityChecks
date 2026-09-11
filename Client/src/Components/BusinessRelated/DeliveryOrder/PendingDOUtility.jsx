import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Paper
} from "@mui/material";
import Pagination from "../../../Common/UtilityCommon/Pagination";
import SearchBar from "../../../Common/UtilityCommon/SearchBar";
import PerPageSelect from "../../../Common/UtilityCommon/PerPageSelect";
import axios from "axios";

const API_URL = process.env.REACT_APP_API;

const Year_Code = sessionStorage.getItem("Year_Code")
const companyCode = sessionStorage.getItem("Company_Code");

function DeliveryOredrUtility() {
    const [fetchedData, setFetchedData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [perPage, setPerPage] = useState(15);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [filterValue, setFilterValue] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {

            try {
                const apiUrl = `${API_URL}/getdata-Pending_DO`;
                const response = await axios.get(apiUrl);
                setFetchedData(response.data.all_data);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        const filtered = fetchedData.filter(post => {
            const searchTermLower = searchTerm.toLowerCase();

            const billtoshortnameLower = (post.billtoshortname || '').toLowerCase();
            const docNoLower = String(post.doc_no || '').toLowerCase();
            const purcNoLower = String(post.purc_no || '').toLowerCase();
            const saleBillCityNameLower = (post.salebillcityname || '').toLowerCase();
            const shiptocitynameLower = (post.shiptocityname || '').toLowerCase();
            const despTypeLower = (post.desp_type || '').toLowerCase();
            const truckNoLower = String(post.truck_no || '').toLowerCase();
            const sbNoLower = String(post.SB_No || '').toLowerCase();
            const eWayBillNoLower = String(post.EWay_Bill_No || '').toLowerCase();
            const deliveryTypeLower = (post.Delivery_Type || '').toLowerCase();
            const shiptoshortnameLower = (post.shiptoshortname || '').toLowerCase();
            const transportshortnameLower = (post.transportshortname || '').toLowerCase();
            const millRateLower = String(post.mill_rate || '').toLowerCase();
            const mmRateLower = String(post.MM_Rate || '').toLowerCase();
            const vasuliRate1Lower = String(post.vasuli_rate1 || '').toLowerCase();
            const doidLower = String(post.doid || '').toLowerCase();
            const docDateLower = (post.doc_date || '').toLowerCase();
            const saleRateLower = String(post.sale_rate || '').toLowerCase();
            const tenderCommissionLower = String(post.Tender_Commission || '').toLowerCase();

            return (
                (filterValue === "" || post.group_Type === filterValue) &&
                (
                    billtoshortnameLower.includes(searchTermLower) ||
                    docNoLower.includes(searchTermLower) ||
                    purcNoLower.includes(searchTermLower) ||
                    saleBillCityNameLower.includes(searchTermLower) ||
                    shiptocitynameLower.includes(searchTermLower) ||
                    despTypeLower.includes(searchTermLower) ||
                    truckNoLower.includes(searchTermLower) ||
                    sbNoLower.includes(searchTermLower) ||
                    eWayBillNoLower.includes(searchTermLower) ||
                    deliveryTypeLower.includes(searchTermLower) ||
                    shiptoshortnameLower.includes(searchTermLower) ||
                    transportshortnameLower.includes(searchTermLower) ||
                    millRateLower.includes(searchTermLower) ||
                    mmRateLower.includes(searchTermLower) ||
                    vasuliRate1Lower.includes(searchTermLower) ||
                    doidLower.includes(searchTermLower) ||
                    docDateLower.includes(searchTermLower) ||
                    saleRateLower.includes(searchTermLower) ||
                    tenderCommissionLower.includes(searchTermLower)
                )
            );
        });

        setFilteredData(filtered);
        setCurrentPage(1);
    }, [searchTerm, filterValue, fetchedData]);

    const handlePerPageChange = (event) => {
        setPerPage(event.target.value);
        setCurrentPage(1);
    };

    const handleSearchTermChange = (event) => {
        const term = event.target.value;
        setSearchTerm(term);
    };

    const pageCount = Math.ceil(filteredData.length / perPage);

    const paginatedPosts = filteredData.slice((currentPage - 1) * perPage, currentPage * perPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleClick = () => {
        navigate("/delivery-order");
    };

    const handleRowClick = (tenderdetailid) => {
        const selectedRecordPendingDo = filteredData.find(record => record.tenderdetailid === tenderdetailid);
        navigate("/delivery-order", { state: { selectedRecordPendingDo } });
    };

    const handleSearchClick = () => {
        setFilterValue("");
    };

    const handleBack = () => {
        navigate("/DashBoard")
    }

    return (
        <div className="App container">
            <Grid container spacing={3}>
                <Grid item xs={0}>
                    <Button variant="contained" style={{ marginTop: "20px" }} onClick={handleClick}>
                        Add
                    </Button>
                </Grid>
                <Grid item xs={0}>
                    <Button variant="contained" style={{ marginTop: "20px" }} onClick={handleBack}>
                        Back
                    </Button>
                </Grid>

                <Grid item xs={12} sm={12}>
                    <SearchBar
                        value={searchTerm}
                        onChange={handleSearchTermChange}
                        onSearchClick={handleSearchClick}
                    />
                </Grid>
                <Grid item xs={12} sm={12} style={{ marginTop: "-80px", marginLeft: "-150px" }}>
                    <PerPageSelect value={perPage} onChange={handlePerPageChange} />
                </Grid>

                <Grid item xs={12}>
                    <Paper elevation={6}>

                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>DO Id</TableCell>
                                    <TableCell>TenderdetailId</TableCell>
                                    <TableCell>BillTo A/C</TableCell>
                                    <TableCell>BillTo Name</TableCell>
                                    <TableCell>BillTo GST No</TableCell>
                                    <TableCell>ShipTo A/C</TableCell>
                                    <TableCell>ShipTo Name</TableCell>
                                    <TableCell>ShipTo GST No</TableCell>
                                    <TableCell>DO Quintal</TableCell>
                                    <TableCell>Sale Rate</TableCell>
                                    <TableCell>Truck No</TableCell>
                                    <TableCell>Payment Detail</TableCell>
                                    <TableCell>Order Id</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {paginatedPosts.map((post) => (
                                    <TableRow
                                        key={post.tenderdetailid}
                                        className="row-item"
                                        style={{ cursor: "pointer" }}
                                        onDoubleClick={() => handleRowClick(post.tenderdetailid)}
                                    >
                                        <TableCell>{post.doid}</TableCell>
                                        <TableCell>{post.tenderdetailid}</TableCell>
                                        <TableCell>{post.bill_to_ac_code}</TableCell>
                                        <TableCell>{post.billToName}</TableCell>
                                        <TableCell>{post.bill_to_gst_no}</TableCell>
                                        <TableCell>{post.ship_to_ac_code}</TableCell>
                                        <TableCell>{post.shipToName}</TableCell>
                                        <TableCell>{post.ship_to_gst_no}</TableCell>
                                        <TableCell>{post.do_qntl}</TableCell>
                                        <TableCell>{post.saleRate}</TableCell>
                                        <TableCell>{post.truck_no}</TableCell>
                                        <TableCell>{post.payment_detail}</TableCell>
                                        <TableCell>{post.orderid}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Paper>
                </Grid>
                <Grid item xs={12}>
                    <Pagination
                        pageCount={pageCount}
                        currentPage={currentPage}
                        onPageChange={handlePageChange}
                    />
                </Grid>
            </Grid>
        </div>
    );
}

export default DeliveryOredrUtility;
