import React, { useState, useEffect, useRef } from "react";
import { FaSearch, FaChevronLeft, FaChevronRight, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import BackButton from "../../../Common/Buttons/BackButton";

function UserCreationUtility() {
    const apiURL = process.env.REACT_APP_API_URL_FILE_SYSTEM;
    const [fetchedData, setFetchedData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [perPage, setPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [filterValue, setFilterValue] = useState("");
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [isSearchPerformed, setIsSearchPerformed] = useState(false);
    const [searchMessage, setSearchMessage] = useState("");
    const searchInputRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const apiUrl = `${apiURL}/getallFiles`;
                const response = await fetch(apiUrl);
                const data = await response.json();
                setFetchedData(data);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        if (isSearchPerformed) {
            const filtered = fetchedData.filter((post) => {
                const searchTermLower = searchTerm.toLowerCase();
                const userName = (post.File_Name || "").toLowerCase();
                const fileDescription = (post.File_Discription || "").toLowerCase();

                return (
                    (filterValue === "" || post.group_Type === filterValue) &&
                    (userName.includes(searchTermLower) ||
                        fileDescription.includes(searchTermLower))
                );
            });

            setFilteredData(filtered);
            setCurrentPage(1);
        }
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [searchTerm, filterValue, fetchedData, isSearchPerformed]);

    const handleSearchTermChange = (event) => {
        const term = event.target.value;
        setSearchTerm(term);

        if (term === "") {
            setIsSearchPerformed(false);
            setFilteredData([]);
        }
    };

    const handleSearchButtonClick = () => {
        if (searchTerm.trim() === "") {
            setSearchMessage("Please type something to search.");
            setIsSearchPerformed(false);
            searchInputRef.current.focus();
            return;
        }
        setSearchMessage("");
        setIsSearchPerformed(true);
    };

    const pageCount = Math.ceil(filteredData.length / perPage);

    const paginatedPosts = filteredData.slice(
        (currentPage - 1) * perPage,
        currentPage * perPage
    );

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleRowClick = (record) => {
        setSelectedRecord(record);
    };

    const handleClosePopup = () => {
        setSelectedRecord(null);
    };

    const handleBackButton = () => {
        navigate("/filesystemdashboard");
    };

    const getPageNumbers = () => {
        const startPage = Math.floor((currentPage - 1) / 5) * 5 + 1;
        const endPage = Math.min(startPage + 4, pageCount);
        const pageNumbers = [];

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        return pageNumbers;
    };

    const handlePrevGroup = () => {
        setCurrentPage(Math.max(currentPage - 5, 1));
    };

    const handleNextGroup = () => {
        setCurrentPage(Math.min(currentPage + 5, pageCount));
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">

            <div className="text-center relative">
                <h1 className="text-2xl font-bold text-gray-800">Search File</h1>
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-blue-500 to-green-400 rounded-full animate-underline"></div>
            </div>

            <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-8 relative">
                <div className="w-full md:w-1/2 flex justify-center">
                    <div className="relative w-full max-w-xl">
                        <div className="flex items-center">
                            <input
                                type="text"
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
                                placeholder="Search File..."
                                value={searchTerm}
                                onChange={handleSearchTermChange}
                                ref={searchInputRef}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearchButtonClick()}
                            />
                            <button
                                className="ml-3 p-3 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200 shadow-md"
                                onClick={handleSearchButtonClick}
                            >
                                <FaSearch className="text-lg" />
                            </button>
                        </div>
                    </div>
                </div>
                <div className="absolute right-0 md:relative md:right-auto">
                    <BackButton onClick={handleBackButton} />
                </div>
            </div>

            {searchMessage && (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded">
                    <p>{searchMessage}</p>
                </div>
            )}

            {isSearchPerformed && filteredData.length > 0 && (
                <div className="w-full overflow-x-auto rounded-lg shadow-lg mb-8 border border-gray-200">
                    <table className="w-full divide-y divide-gray-200">
                        <thead className="bg-gray-800 text-white">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap">Doc No</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap">Doc Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap">File Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap">File Description</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap">Cupboard Code</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap">File No</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap">Cupboard Name</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedPosts.map((post) => (
                                <tr
                                    key={post.User_Code}
                                    className="hover:bg-blue-50 cursor-pointer transition-colors duration-150"
                                    onClick={() => handleRowClick(post)}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-left">{post.Doc_No}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-left">{post.Doc_Date}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700 text-left">{post.File_Name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700 text-left">{post.File_Discription}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700 text-left">{post.Cupboard_Code}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700 text-left">{post.File_No}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700 text-left">{post.CupBoardCode_Name}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === pageCount}
                                className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${currentPage === pageCount ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                            >
                                Next
                            </button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Showing <span className="font-medium">{(currentPage - 1) * perPage + 1}</span> to{' '}
                                    <span className="font-medium">{Math.min(currentPage * perPage, filteredData.length)}</span> of{' '}
                                    <span className="font-medium">{filteredData.length}</span> results
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                    <button
                                        onClick={handlePrevGroup}
                                        disabled={currentPage === 1}
                                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`}
                                    >
                                        <span className="sr-only">Previous</span>
                                        <FaChevronLeft className="h-5 w-5" aria-hidden="true" />
                                    </button>
                                    {getPageNumbers().map((pageNumber) => (
                                        <button
                                            key={pageNumber}
                                            onClick={() => handlePageChange(pageNumber)}
                                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${pageNumber === currentPage ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}
                                        >
                                            {pageNumber}
                                        </button>
                                    ))}
                                    <button
                                        onClick={handleNextGroup}
                                        disabled={currentPage === pageCount}
                                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${currentPage === pageCount ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`}
                                    >
                                        <span className="sr-only">Next</span>
                                        <FaChevronRight className="h-5 w-5" aria-hidden="true" />
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* No Results Message */}
            {isSearchPerformed && filteredData.length === 0 && (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded mb-8">
                    <p>No records found matching the search criteria.</p>
                </div>
            )}

            {selectedRecord && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-teal-500 to-teal-600 px-6 py-4 rounded-t-lg flex justify-between items-center">
                            <h3 className="text-lg font-medium text-white">File Details</h3>
                            <button
                                onClick={handleClosePopup}
                                className="text-white hover:text-gray-200 focus:outline-none"
                            >
                                <FaTimes className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-4">
                            <div>
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-left">File No</h4>
                                <p className="mt-1 text-sm text-gray-900 text-left">{selectedRecord.File_No}</p>
                            </div>
                            <div>
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-left">File Name</h4>
                                <p className="mt-1 text-sm text-gray-900 text-left">{selectedRecord.File_Name}</p>
                            </div>
                            <div>
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-left">Cupboard Name</h4>
                                <p className="mt-1 text-sm text-gray-900 text-left">{selectedRecord.CupBoardCode_Name}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default UserCreationUtility;




// import React, { useState, useEffect, useRef } from "react";
// import { FaSearch } from "react-icons/fa";
// import { Card } from "react-bootstrap";
// import "./Search.css";
// import { useNavigate } from "react-router-dom";
// import BackButton from "../../../Common/Buttons/BackButton";

// import {
//     Typography
// } from "@mui/material";

// function UserCreationUtility() {
//     const apiURL = process.env.REACT_APP_API_URL_FILE_SYSTEM;
//     const [fetchedData, setFetchedData] = useState([]);
//     const [filteredData, setFilteredData] = useState([]);
//     const [perPage, setPerPage] = useState(10);
//     const [searchTerm, setSearchTerm] = useState("");
//     const [currentPage, setCurrentPage] = useState(1);
//     const [filterValue, setFilterValue] = useState("");
//     const [selectedRecord, setSelectedRecord] = useState(null);
//     const [isSearchPerformed, setIsSearchPerformed] = useState(false);
//     const [searchMessage, setSearchMessage] = useState("");
//     const searchInputRef = useRef(null);
//     const navigate = useNavigate();


//     useEffect(() => {
//         const fetchData = async () => {
//             try {
//                 const apiUrl = `${apiURL}/getallFiles`;
//                 const response = await fetch(apiUrl);
//                 const data = await response.json();
//                 setFetchedData(data);
//             } catch (error) {
//                 console.error("Error fetching data:", error);
//             }
//         };

//         fetchData();
//     }, []);

//     useEffect(() => {
//         if (isSearchPerformed) {
//             const filtered = fetchedData.filter((post) => {
//                 const searchTermLower = searchTerm.toLowerCase();
//                 const userName = (post.File_Name || "").toLowerCase();
//                 const fileDescription = (post.File_Discription || "").toLowerCase();

//                 return (
//                     (filterValue === "" || post.group_Type === filterValue) &&
//                     (userName.includes(searchTermLower) ||
//                         fileDescription.includes(searchTermLower))
//                 );
//             });

//             setFilteredData(filtered);
//             setCurrentPage(1);
//         }
//         if (searchInputRef.current) {
//             searchInputRef.current.focus();
//         }
//     }, [searchTerm, filterValue, fetchedData, isSearchPerformed]);

//     const handleSearchTermChange = (event) => {
//         const term = event.target.value;
//         setSearchTerm(term);

//         if (term === "") {
//             setIsSearchPerformed(false);
//             setFilteredData([]);
//         }
//     };

//     const handleSearchButtonClick = () => {
//         if (searchTerm.trim() === "") {
//             setSearchMessage("Please type something to search.");
//             setIsSearchPerformed(false);
//             searchInputRef.current.focus();
//             return;
//         }
//         setSearchMessage("");
//         setIsSearchPerformed(true);
//     };

//     const pageCount = Math.ceil(filteredData.length / perPage);

//     const paginatedPosts = filteredData.slice(
//         (currentPage - 1) * perPage,
//         currentPage * perPage
//     );

//     const handlePageChange = (pageNumber) => {
//         setCurrentPage(pageNumber);
//     };

//     const handleRowClick = (record) => {
//         setSelectedRecord(record);
//     };

//     const handleClosePopup = () => {
//         setSelectedRecord(null);
//     };

//     const handleBackButton = () => {
//         navigate("/filesystemdashboard");
//     };

//     // Pagination logic to handle 5 pages at a time
//     const getPageNumbers = () => {
//         const startPage = Math.floor((currentPage - 1) / 5) * 5 + 1;
//         const endPage = Math.min(startPage + 4, pageCount);
//         const pageNumbers = [];

//         for (let i = startPage; i <= endPage; i++) {
//             pageNumbers.push(i);
//         }

//         return pageNumbers;
//     };

//     const handlePrevGroup = () => {
//         setCurrentPage(Math.max(currentPage - 5, 1));
//     };

//     const handleNextGroup = () => {
//         setCurrentPage(Math.min(currentPage + 5, pageCount));
//     };

//     return (
//         <div className="container-fluid mt-4">
//             <Typography variant="h6"
//                 component="h1"
//                 gutterBottom
//                 sx={{
//                     textAlign: 'center',
//                     fontSize: '1.2rem',
//                     fontWeight: 'bold',
//                     color: '#2c3e50',
//                     marginBottom: '30px',
//                     padding: '12px 0',
//                     position: 'relative',
//                     '&::after': {
//                         content: '""',
//                         position: 'absolute',
//                         bottom: '0',
//                         left: '50%',
//                         transform: 'translateX(-50%)',
//                         width: '80px',
//                         height: '4px',
//                         background: 'linear-gradient(90deg, #3498db, #2ecc71)',
//                         borderRadius: '2px',
//                         animation: 'underlineGrow 0.5s ease-out forwards'
//                     },
//                     '@keyframes underlineGrow': {
//                         '0%': { width: '0' },
//                         '100%': { width: '80px' }
//                     }
//                 }}>
//                 Search File
//             </Typography>

//             <div className="row justify-content-center">
//                 <div className="col-md-4 d-flex justify-content-center ml-4">
//                     <div className="input-group ">
//                         <input
//                             type="text"
//                             className="form-control"
//                             placeholder="Search File..."
//                             value={searchTerm}
//                             onChange={handleSearchTermChange}
//                             ref={searchInputRef}
//                             style={{ height: "45px", borderRadius: "8px" }}
//                         />
//                         <div className="input-group-append">
//                             <button
//                                 className="btn btn-outline-secondary ml-2"
//                                 type="button"
//                                 onClick={handleSearchButtonClick}
//                                 style={{ marginLeft: "10px", borderRadius: "60px", marginTop: "2px", backgroundColor: "#b8b5d4" }}
//                             >
//                                 <FaSearch />
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//                 <div className="col-md-1 d-flex justify-content-end">
//                     <BackButton onClick={handleBackButton} />
//                 </div>
//             </div>
//             <br />

//             {searchMessage && (
//                 <div className="alert alert-warning text-center" role="alert">
//                     {searchMessage}
//                 </div>
//             )}

//             {isSearchPerformed && filteredData.length > 0 && (
//                 <>
//                     <table className="table table-bordered table-striped">
//                         <thead className="thead-dark">
//                             <tr>
//                                 <th style={{ whiteSpace: "nowrap" }}>Doc No</th>
//                                 <th style={{ whiteSpace: "nowrap" }}>Doc Date</th>
//                                 <th>File Name</th>
//                                 <th>File Description</th>
//                                 <th style={{ whiteSpace: "nowrap" }}>Cupboard Code</th>
//                                 <th style={{ whiteSpace: "nowrap" }}>File No</th>
//                                 <th>Cupboard Name</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {paginatedPosts.map((post) => (
//                                 <tr
//                                     key={post.User_Code}
//                                     className="row-item"
//                                     onClick={() => handleRowClick(post)}
//                                 >
//                                     <td>{post.Doc_No}</td>
//                                     <td style={{ whiteSpace: "nowrap" }}>{post.Doc_Date}</td>
//                                     <td align="left">{post.File_Name}</td>
//                                     <td align="left">{post.File_Discription}</td>
//                                     <td>{post.Cupboard_Code}</td>
//                                     <td>{post.File_No}</td>
//                                     <td align="left">{post.CupBoardCode_Name}</td>
//                                 </tr>
//                             ))}
//                         </tbody>
//                     </table>
//                     <nav>
//                         <ul className="pagination justify-content-center mc-6" style={{ marginBottom: "60px" }}>
//                             <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
//                                 <button
//                                     className="page-link"
//                                     onClick={handlePrevGroup}
//                                     disabled={currentPage === 1}
//                                 >
//                                     Previous
//                                 </button>
//                             </li>
//                             {getPageNumbers().map((pageNumber) => (
//                                 <li
//                                     key={pageNumber}
//                                     className={`page-item ${pageNumber === currentPage ? "active" : ""}`}
//                                 >
//                                     <button
//                                         className="page-link"
//                                         onClick={() => handlePageChange(pageNumber)}
//                                     >
//                                         {pageNumber}
//                                     </button>
//                                 </li>
//                             ))}
//                             <li className={`page-item ${currentPage === pageCount ? "disabled" : ""}`}>
//                                 <button
//                                     className="page-link"
//                                     onClick={handleNextGroup}
//                                     disabled={currentPage === pageCount}
//                                 >
//                                     Next
//                                 </button>
//                             </li>
//                         </ul>
//                     </nav>
//                 </>
//             )}

//             {selectedRecord && (
//                 <div
//                     className="popup-overlay"
//                     onClick={handleClosePopup}
//                     style={{
//                         position: "fixed",
//                         top: 0,
//                         left: 0,
//                         right: 0,
//                         bottom: 0,
//                         backgroundColor: "rgba(0,0,0,0.5)",
//                         display: "flex",
//                         justifyContent: "center",
//                         alignItems: "center",
//                         zIndex: 1000,
//                         animation: "fadeIn 0.3s ease-out",
//                     }}
//                 >
//                     <div
//                         className="popup-content"
//                         onClick={(e) => e.stopPropagation()}

//                     >
//                         <Card
//                             style={{
//                                 width: "400px",
//                                 borderRadius: "15px",
//                                 overflow: "hidden",
//                                 boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
//                                 border: "none",
//                             }}
//                         >
//                             <Card.Header
//                                 style={{
//                                     background: "linear-gradient(135deg, #2cb5a0 0%, #1e9c8a 100%)",
//                                     color: "white",
//                                     display: "flex",
//                                     justifyContent: "space-between",
//                                     alignItems: "center",
//                                     padding: "15px 20px",
//                                     borderBottom: "none",
//                                 }}
//                             >
//                                 <h5 style={{ margin: 0 }}>File Details</h5>
//                                 <button
//                                     className="close-btn"
//                                     onClick={handleClosePopup}
//                                     style={{
//                                         background: "none",
//                                         border: "none",
//                                         color: "white",
//                                         fontSize: "1.5rem",
//                                         cursor: "pointer",
//                                     }}
//                                 >
//                                     &times;
//                                 </button>
//                             </Card.Header>
//                             <Card.Body
//                                 style={{
//                                     padding: "25px",
//                                     background: "#f8f9fa",
//                                 }}
//                             >
//                                 <div className="detail-item" style={{ marginBottom: "20px" }}>
//                                     <Typography
//                                         variant="subtitle1"
//                                         style={{
//                                             color: "#6c757d",
//                                             fontWeight: "bold",
//                                             marginBottom: "5px",
//                                         }}
//                                     >
//                                         File No
//                                     </Typography>
//                                     <div className="detail-value">
//                                         <Typography variant="body1">
//                                             {selectedRecord.File_No}
//                                         </Typography>
//                                     </div>
//                                 </div>

//                                 <div className="detail-item" style={{ marginBottom: "20px" }}>
//                                     <Typography
//                                         variant="subtitle1"
//                                         style={{
//                                             color: "#6c757d",
//                                             fontWeight: "bold",
//                                             marginBottom: "5px",
//                                         }}
//                                     >
//                                         File Name
//                                     </Typography>
//                                     <div className="detail-value">
//                                         <Typography variant="body1">
//                                             {selectedRecord.File_Name}
//                                         </Typography>
//                                     </div>
//                                 </div>

//                                 <div className="detail-item">
//                                     <Typography
//                                         variant="subtitle1"
//                                         style={{
//                                             color: "#6c757d",
//                                             fontWeight: "bold",
//                                             marginBottom: "5px",
//                                         }}
//                                     >
//                                         Cupboard Name
//                                     </Typography>
//                                     <div className="detail-value">
//                                         <Typography variant="body1">
//                                             {selectedRecord.CupBoardCode_Name}
//                                         </Typography>
//                                     </div>
//                                 </div>
//                             </Card.Body>
//                         </Card>
//                     </div>
//                 </div>
//             )}

//             {isSearchPerformed && filteredData.length === 0 && (
//                 <div className="alert alert-warning" role="alert">
//                     No records found matching the search criteria.
//                 </div>
//             )}
//         </div>
//     );
// }

// export default UserCreationUtility;