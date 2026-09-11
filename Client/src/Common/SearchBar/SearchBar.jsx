import React from 'react';
import { TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const SearchBar = ({ searchQuery, setSearchQuery }) => {
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  return (
    <TextField
      variant="outlined"
      value={searchQuery}
      onChange={handleSearchChange}
      sx={{
        width: '60%',
        maxWidth: '500px',
        margin: '0 auto',
        borderRadius: '25px',
        '& .MuiOutlinedInput-root': {
          borderRadius: '25px',
          transition: 'all 0.3s ease',
          padding: '8px 14px', 
          '& input': { 
            padding: 0,
            height: '1.5em', 
          },
          '&:hover': {
            backgroundColor: '#e1e1e1',
          },
          '&.Mui-focused': {
            boxShadow: '0px 0px 5px rgba(0, 0, 0, 0.2)',
          },
        },
        '& .MuiInputLabel-root': {
          fontSize: '1.1rem',
          color: '#333',
          transform: 'translate(14px, 10px) scale(1)',
          '&.Mui-focused': {
            transform: 'translate(14px, -9px) scale(0.75)',
          },
          '&.MuiFormLabel-filled': { 
            transform: 'translate(14px, -9px) scale(0.75)',
          }
        },
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: '#ccc',
        },
        '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: '#3b82f6',
        },
      }}
      autoComplete="off"
      InputProps={{
        startAdornment: (
          <InputAdornment position="start" sx={{ mt: 0 }}>
            <SearchIcon
              sx={{
                color: '#7f7f7f',
                transition: 'all 0.3s ease',
                '&:hover': {
                  color: '#3b82f6',
                  transform: 'scale(1.2)',
                },
              }}
            />
          </InputAdornment>
        ),
      }}
    />
  );
};

export default SearchBar;