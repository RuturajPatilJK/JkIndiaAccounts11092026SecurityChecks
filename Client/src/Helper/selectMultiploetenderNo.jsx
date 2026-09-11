
import React, { useEffect, useState } from "react";
import { Button, Modal, Spinner } from "react-bootstrap";
import axios from "axios";
import DataTableSearch from "../Common/HelpCommon/DataTableSearch";
import DataTablePagination from "../Common/HelpCommon/DataTablePagination";

const API_URL = process.env.REACT_APP_API;

const SelectMultipleTenderNo = ({
    name,
    companyCode,
    millCode,
    onTenderSelect,
    tabIndex,
    disabled
}) => {
    const [showModal, setShowModal] = useState(false);
    const [tenderData, setTenderData] = useState([]);
    const [selectedTenders, setSelectedTenders] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);

    const itemsPerPage = 10;


    useEffect(() => {
        if (!millCode) {
            clearAll();
            return;
        }

        fetchTenders();
    }, [millCode, companyCode]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const clearAll = () => {
        setTenderData([]);
        setSelectedTenders([]);
        setSearchTerm("");
        setCurrentPage(1);
        onTenderSelect([]);
    };

    const fetchTenders = async () => {
        try {
            setLoading(true);
            const res = await axios.get(
                `${API_URL}/select-multiple-tender-details`,
                {
                    params: {
                        Company_Code: companyCode,
                        Mill_Code: millCode
                    }
                }
            );
            setTenderData(res.data || []);
            setSelectedTenders([]);
        } catch (err) {
            console.error("Error fetching tenders:", err);
            setTenderData([]);
        } finally {
            setLoading(false);
        }
    };

    const getUniqueId = (item) => item.tenderid ?? item.Tender_No;

    const isSelected = (item) =>
        selectedTenders.some(
            t => getUniqueId(t) === getUniqueId(item)
        );


    const handleCheckbox = (item) => {
        setSelectedTenders(prev => {
            const exists = prev.some(
                t => getUniqueId(t) === getUniqueId(item)
            );

            const updated = exists
                ? prev.filter(
                    t => getUniqueId(t) !== getUniqueId(item)
                )
                : [...prev, item];

            onTenderSelect(updated);
            return updated;
        });
    };

    /* ================= FILTER (ALL FIELDS) ================= */

    const filteredData = tenderData.filter(item => {
        const term = searchTerm.toLowerCase();

        return Object.values(item).some(val =>
            String(val ?? "")
                .toLowerCase()
                .includes(term)
        );
    });

    /* ================= PAGINATION ================= */

    const startIndex = (currentPage - 1) * itemsPerPage;
    const itemsToDisplay = filteredData.slice(
        startIndex,
        startIndex + itemsPerPage
    );

    /* ================= JSX ================= */

    return (
        <div className="d-flex align-items-center">
            <input
                type="text"
                id={name}
                readOnly
                className="form-control"
                style={{ width: "100px" }}
                value={selectedTenders.map(t => t.Tender_No).join(", ")}
                tabIndex={tabIndex}
                disabled={disabled}
            />

            <Button
                className="ms-1"
                style={{ width: "30px", height: "35px" }}
                onClick={() => setShowModal(true)}
                disabled={!millCode || disabled}
            >
                ...
            </Button>

            <Modal
                show={showModal}
                onHide={() => setShowModal(false)}
                size="xl"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Select Tender Numbers</Modal.Title>
                </Modal.Header>

                {loading && (
                    <div className="text-center my-3">
                        <Spinner animation="border" />
                    </div>
                )}

                {!loading && tenderData.length > 0 && (
                    <>
                        <DataTableSearch
                            data={tenderData}
                            onSearch={setSearchTerm}
                        />

                        <Modal.Body>
                            <table className="table table-bordered">
                                <thead>
                                    <tr>
                                        <th>Select</th>
                                        <th>Tender No</th>
                                        <th>Tender Date</th>
                                        <th>Quantal</th>
                                        <th>Mill Rate</th>
                                        <th>Lifting Date</th>
                                        <th>Grade</th>
                                        <th>Payment To</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {itemsToDisplay.map(item => (
                                        <tr
                                            key={getUniqueId(item)}
                                            style={{
                                                backgroundColor: isSelected(item)
                                                    ? "#d6e9f9"
                                                    : ""
                                            }}
                                        >
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected(item)}
                                                    onChange={() =>
                                                        handleCheckbox(item)
                                                    }
                                                />
                                            </td>

                                            <td
                                                style={{
                                                    color: isSelected(item)
                                                        ? "#0d6efd"
                                                        : "",
                                                    fontWeight: isSelected(item)
                                                        ? "bold"
                                                        : ""
                                                }}
                                            >
                                                {item.Tender_No}
                                            </td>
                                            <td>{item.Tender_Date}</td>
                                            <td>{item.Quantal}</td>
                                            <td>{item.Mill_Rate}</td>
                                            <td>{item.Lifting_Date}</td>
                                            <td>{item.Grade}</td>
                                            <td>{item.Paymet_To}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </Modal.Body>

                        <Modal.Footer className="d-flex justify-content-between">
                            <span>
                                Selected: {selectedTenders.length}
                            </span>
                            <Button
                                variant="success"
                                disabled={selectedTenders.length === 0}
                                onClick={() => setShowModal(false)}
                            >
                                Select
                            </Button>

                            <DataTablePagination
                                totalItems={filteredData.length}
                                itemsPerPage={itemsPerPage}
                                onPageChange={setCurrentPage}
                            />
                        </Modal.Footer>
                    </>
                )}

                {!loading && tenderData.length === 0 && (
                    <div className="text-center p-3">
                        No tenders found for this mill.
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default SelectMultipleTenderNo;
