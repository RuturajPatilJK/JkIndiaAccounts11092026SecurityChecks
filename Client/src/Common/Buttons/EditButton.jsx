import React from 'react';
import EditIcon from '@mui/icons-material/Edit';
import { IconButton } from '@mui/material';

const EditButton = ({ editUser, user, isEditing,disabled}) => {
  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      editUser(user);
    }
  };

  return (
    <IconButton
      className="btn btn-warning"  
      onClick={() => editUser(user)}
      disabled={!isEditing ||  disabled}
      onKeyDown={handleKeyDown}
      color="warning" 
      aria-label="edit"
    >
      <EditIcon />
    </IconButton>
  );
};

export default EditButton;
