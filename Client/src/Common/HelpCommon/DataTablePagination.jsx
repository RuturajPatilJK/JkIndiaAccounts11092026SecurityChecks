import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

function DataTablePagination({ totalItems, itemsPerPage, onPageChange }) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      onPageChange(newPage);
    }
  };

  const renderPageNumbers = () => {
    const pageNumbers = [];
    const visiblePageCount = 5;
    const halfVisible = Math.floor(visiblePageCount / 2);

    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, currentPage + halfVisible);

    // Adjust start and end page if near the edges
    if (totalPages <= visiblePageCount) {
      startPage = 1;
      endPage = totalPages;
    } else {
      if (currentPage <= halfVisible + 1) {
        endPage = visiblePageCount;
      } else if (currentPage >= totalPages - halfVisible) {
        startPage = totalPages - visiblePageCount + 1;
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <li key={i} className={`page-item ${currentPage === i ? "active" : ""}`}>
          <button className="page-link" onClick={() => handlePageChange(i)}>
            {i}
          </button>
        </li>
      );
    }

    return pageNumbers;
  };

  return (
    <div className="d-flex justify-content-center my-4">
      <nav>
        <ul className="pagination">
          <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
            <button
              className="page-link"
              onClick={() => handlePageChange(currentPage - 1)}
              aria-label="Previous"
            >
              <span aria-hidden="true">&laquo;</span>
            </button>
          </li>
          {renderPageNumbers()}
          <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
            <button
              className="page-link"
              onClick={() => handlePageChange(currentPage + 1)}
              aria-label="Next"
            >
              <span aria-hidden="true">&raquo;</span>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}

export default DataTablePagination;
