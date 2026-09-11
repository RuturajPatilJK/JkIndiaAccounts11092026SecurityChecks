import React from "react";
import { Button, Stack } from "@mui/material";
import ArrowLeftIcon from '@mui/icons-material/ArrowLeft';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';

function Pagination({ pageCount, currentPage, onPageChange }) {
  const visiblePages = 5;
  const halfVisible = Math.floor(visiblePages / 2);

  let startPage = Math.max(currentPage - halfVisible, 1);
  let endPage = Math.min(startPage + visiblePages - 1, pageCount);

  if (endPage - startPage + 1 < visiblePages) {
    startPage = Math.max(endPage - visiblePages + 1, 1);
  }

  const pageButtons = Array.from(
    { length: endPage - startPage + 1 },
    (_, index) => (
      <Button
        key={startPage + index}
        onClick={() => onPageChange(startPage + index)}
        variant={currentPage === startPage + index ? "contained" : "outlined"}
        size="small"
        sx={{ minWidth: '36px', padding: '0.2rem 0.5rem' }}
      >
        {startPage + index}
      </Button>
    )
  );

  return (
    <Stack
      direction="row"
      spacing={1}
      justifyContent="center"
      alignItems="center"
      sx={{ marginTop: "1rem", marginBottom: "40px" }}
    >
      {currentPage > 1 && (
        <Button onClick={() => onPageChange(currentPage - 1)} startIcon={<ArrowLeftIcon />}>
          Prev
        </Button>
      )}
      {pageButtons}
      {currentPage < pageCount && (
        <Button onClick={() => onPageChange(currentPage + 1)} endIcon={<ArrowRightIcon />}>
          Next
        </Button>
      )}
    </Stack>
  );
}

export default Pagination;