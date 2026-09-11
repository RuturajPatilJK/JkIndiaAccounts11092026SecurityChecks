import React from 'react';
import FlagIcon from '@mui/icons-material/Flag';
import { IconButton } from '@mui/material';

const FlagButton = ({ openDelete, user }) => {
  return (
    <IconButton
      className="btn btn-secondary"
      onClick={() => openDelete(user)} 
      aria-label="flag"
      color="success"
    >
      <FlagIcon />
    </IconButton>
  );
};

export default FlagButton;
