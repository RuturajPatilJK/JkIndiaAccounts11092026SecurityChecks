import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  IconButton,
  Typography,
  Divider,
  CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import Slide from '@mui/material/Slide';
import axios from 'axios';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

const API_URL = process.env.REACT_APP_API;

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const StyledTextField = styled(TextField)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  '& .MuiOutlinedInput-root': {
    borderRadius: '8px',
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main,
      boxShadow: '0 0 0 2px rgba(76, 175, 80, 0.2)'
    },
  },
}));

const EditProfileDialog = ({ open, onClose, userData }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    mobile: '',
    fullName: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (userData) {
      setFormData({
        username: userData.username || '',
        email: userData.email || '',
        mobile: userData.mobile || '',
        fullName: userData.fullName || ''
      });
    }
  }, [userData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (formData.mobile && !/^[0-9]{10,15}$/.test(formData.mobile)) {
      newErrors.mobile = 'Please enter a valid mobile number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const uid = sessionStorage.getItem('uid');
      const response = await axios.put(
        `${API_URL}/update_user_profile?uid=${uid}`,
        {
          User_Name: formData.username,
          userfullname: formData.fullName,
          EmailId: formData.email,
          Mobile: formData.mobile
        }
      );

      if (response.status === 200) {
        Object.keys(formData).forEach(key => {
          if (formData[key]) {
            sessionStorage.setItem(key, formData[key]);
          }
        });

        Swal.fire({
          icon: 'success',
          title: 'Profile Updated',
          text: 'Your profile has been updated successfully!',
          confirmButtonColor: '#4CAF50'
        }).then(() => {
          onClose();
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: error.response?.data?.error || 'Failed to update profile',
        confirmButtonColor: '#f44336'
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <Dialog
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
      fullWidth
      maxWidth="sm"
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: '16px',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #2196F3, #4CAF50)',
          },
        },
      }}
    >
      <DialogTitle sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 24px',
        backgroundColor: '#f5f5f5'
      }}>
        <Typography variant="h6" fontWeight="bold">
          Edit Profile
        </Typography>
        <IconButton
          onClick={onClose}
          sx={{
            transition: 'transform 0.2s ease',
            '&:hover': {
              transform: 'rotate(90deg)',
              backgroundColor: 'rgba(0, 0, 0, 0.04)'
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ padding: '24px' }}>
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <StyledTextField
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            error={!!errors.username}
            helperText={errors.username}
            fullWidth
            margin="normal"
            variant="outlined"
            disabled={isLoading}
            size ="small"
          />

          <StyledTextField
            label="Full Name"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            error={!!errors.fullName}
            helperText={errors.fullName}
            fullWidth
            margin="normal"
            variant="outlined"
            disabled={isLoading}
            size ="small"
          />

          <StyledTextField
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={!!errors.email}
            helperText={errors.email}
            fullWidth
            margin="normal"
            variant="outlined"
            disabled={isLoading}
            size ="small"
          />

          <StyledTextField
            label="Mobile Number"
            name="mobile"
            value={formData.mobile}
            onChange={handleChange}
            error={!!errors.mobile}
            helperText={errors.mobile}
            fullWidth
            margin="normal"
            variant="outlined"
            disabled={isLoading}
            inputProps={{
              maxLength: 15
            }}
            size ="small"
          />
        </Box>
      </DialogContent>

      <Divider />

      <DialogActions sx={{
        padding: '16px 24px',
        justifyContent: 'space-between',
        backgroundColor: '#f5f5f5'
      }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            minWidth: '100px',
            '&:hover': {
              borderWidth: '2px',
            }
          }}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          sx={{
            minWidth: '100px',
            background: 'linear-gradient(45deg, #2196F3 30%, #4CAF50 90%)',
            boxShadow: '0 2px 10px rgba(33, 150, 243, 0.3)',
            '&:hover': {
              boxShadow: '0 4px 14px rgba(33, 150, 243, 0.4)',
            },
            '&:disabled': {
              background: '#e0e0e0',
            }
          }}
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : 'Update Profile'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditProfileDialog;