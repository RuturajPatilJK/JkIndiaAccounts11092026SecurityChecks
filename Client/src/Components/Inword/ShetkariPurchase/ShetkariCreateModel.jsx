import {
    Box,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Modal,
} from "@mui/material";
import React, { useState, useRef, useEffect } from "react";

function ShetkariCretateModal() {
  const [showModal, setShowModal] = useState(true); // modal opens immediately
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  

  const handleClose = () => setShowModal(false);

  const handleSave = () => {
    console.log("Saved data:", { name, category });
    handleClose();
  };
  const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%',
  maxWidth: 400,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
};

  return (
    <Modal
      open={showModal}
      onClose={handleClose}
      aria-labelledby="example-modal"
    >
      <Box sx={style}>
        <h2 id="example-modal">Enter Details</h2>

        <TextField
          fullWidth
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          margin="normal"
        />

        <Select
          fullWidth
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          displayEmpty
          margin="normal"
        >
          <MenuItem value="" disabled>Select category</MenuItem>
          <MenuItem value="A">Category A</MenuItem>
          <MenuItem value="B">Category B</MenuItem>
          <MenuItem value="C">Category C</MenuItem>
        </Select>

        <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
          <Button variant="contained" color="primary" onClick={handleSave}>
            Save
          </Button>
          <Button variant="outlined" color="error" onClick={handleClose} sx={{ ml: 2 }}>
            Cancel
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}

export default ShetkariCretateModal;
