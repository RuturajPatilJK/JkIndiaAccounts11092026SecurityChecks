import React from 'react';
import { Box, TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const CommonSearchBar = ({ value, onChange, placeholder = "Search records..." }) => {
  return (
    <Box sx={{ width: { xs: '100%', sm: '300px' }, mb: 2 }}>
      <TextField
        variant="outlined"
        size="small"
        fullWidth
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: '#1a237e' }} />
            </InputAdornment>
          ),
          style: {
            backgroundColor: '#fff',
            borderRadius: '8px',
          }
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            '& fieldset': { borderColor: '#1a237e' },
            '&:hover fieldset': { borderColor: '#5557df' },
            '&.Mui-focused fieldset': { borderColor: '#1a237e' },
          },
        }}
      />
    </Box>
  );
};

export default CommonSearchBar;