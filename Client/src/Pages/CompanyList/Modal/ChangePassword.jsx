// import React, { useState } from 'react';
// import { TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography } from '@mui/material';
// import { ToastContainer, toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import axios from 'axios';

// const API_URL = process.env.REACT_APP_API;

// const ChangePassword = ({ open, handleClose, userId }) => {
//   const [oldPassword, setOldPassword] = useState('');
//   const [newPassword, setNewPassword] = useState('');
//   const [error, setError] = useState('');

//   const handlePasswordChange = async () => {
//     if (!oldPassword || !newPassword) {
//       toast.error('Please fill in both fields');
//       return;
//     }

//     const accessToken = sessionStorage.getItem('access_token'); 
//     const userId = sessionStorage.getItem('userId');

//     if (!accessToken) {
//       toast.error('No access token found. Please login again.');
//       return;
//     }

//     try {
//       const response = await axios.put(
//         `${API_URL}/change_password`,
//         {
//           User_Id: userId,
//           Old_Password: oldPassword,
//           New_Password: newPassword,
//         },
//         {
//           headers: {
//             Authorization: `Bearer ${accessToken}`,
//           },
//         }
//       );
//       if (response.status === 200) {
//         toast.success('Password updated successfully');
//         handleClose();
//       }
//     } catch (err) {
//       setError('Failed to change password. Please try again.');
//       toast.error(error || 'Failed to change password');
//     }
//   };

//   return (
//     <Dialog open={open} onClose={handleClose}>
//       <DialogTitle>Reset Password</DialogTitle>
//       <DialogContent>
//         {error && <Typography color="error" variant="body2">{error}</Typography>}
//         <TextField
//           label="Old Password"
//           variant="outlined"
//           type="password"
//           fullWidth
//           value={oldPassword}
//           onChange={(e) => setOldPassword(e.target.value)}
//           margin="normal"
//         />
//         <TextField
//           label="New Password"
//           variant="outlined"
//           type="password"
//           fullWidth
//           value={newPassword}
//           onChange={(e) => setNewPassword(e.target.value)}
//           margin="normal"
//         />
//       </DialogContent>
//       <DialogActions>
//         <Button onClick={handleClose} color="secondary">
//           Cancel
//         </Button>
//         <Button onClick={handlePasswordChange} color="primary" variant="contained">
//           Change Password
//         </Button>
//       </DialogActions>
//     </Dialog>
//   );
// };

// export default ChangePassword;
