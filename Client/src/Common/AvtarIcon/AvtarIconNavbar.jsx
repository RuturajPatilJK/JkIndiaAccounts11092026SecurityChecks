import React, { useState, useRef, useEffect } from 'react';
import { styled, keyframes } from '@mui/material/styles';
import Badge from '@mui/material/Badge';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CloseIcon from '@mui/icons-material/Close';
import LockIcon from '@mui/icons-material/Lock';
import { useNavigate } from "react-router-dom";
import Slide from '@mui/material/Slide';
import { Box, IconButton } from '@mui/material';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import Swal from 'sweetalert2';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import EditIcon from '@mui/icons-material/Edit';
import EditProfileDialog from './EditProfileDialog';

const API_URL = process.env.REACT_APP_API;

// Enhanced ripple animation
const rippleAnimation = keyframes`
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.7;
  }
  100% {
    transform: scale(2.4);
    opacity: 0;
  }
`;

const pulseAnimation = keyframes`
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(68, 183, 0, 0.7);
  }
  70% {
    transform: scale(1.05);
    box-shadow: 0 0 0 10px rgba(68, 183, 0, 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(68, 183, 0, 0);
  }
`;

const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: '#44b700',
    color: '#44b700',
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    '&::after': {
      position: 'absolute',
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      animation: `${rippleAnimation} 1.5s infinite ease-in-out`,
      border: '1px solid currentColor',
      content: '""',
    },
    animation: `${pulseAnimation} 2s infinite`,
  },
}));

const avatarHover = keyframes`
  0% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-3px) scale(1.05);
  }
  100% {
    transform: translateY(0) scale(1);
  }
`;

const StyledAvatar = styled(Avatar)({
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  '&:hover': {
    animation: `${avatarHover} 0.5s ease`,
    boxShadow: '0 5px 15px rgba(0, 0, 0, 0.2)',
  },
});

const menuItemAnimation = keyframes`
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const StyledMenuItem = styled(MenuItem)(({ theme, index }) => ({
  transition: 'all 0.2s ease',
  animation: `${menuItemAnimation} 0.3s ease forwards`,
  animationDelay: `${index * 0.05}s`,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    transform: 'translateX(5px)',
  },
}));

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

function AvatarIcon() {
  const storedUsername = sessionStorage.getItem('username');
  const [anchorEl, setAnchorEl] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openChangePasswordDialog, setOpenChangePasswordDialog] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const oldPasswordRef = useRef(null);


  const [openEditProfileDialog, setOpenEditProfileDialog] = useState(false);

  const handleEditProfileClick = () => {
    setOpenEditProfileDialog(true);
    handleClose();
  };

  const navigate = useNavigate();

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSignOutClick = () => {
    setOpenDialog(true);
  };

  const handleChangePasswordClick = () => {
    setOpenChangePasswordDialog(true);
    handleClose();
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => {
      oldPasswordRef.current?.focus();
    }, 100);
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast("All fields are required!");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast('New password and confirm password must match!');
      return;
    }

    const uid = sessionStorage.getItem('uid');
    try {
      const response = await axios.put(`${API_URL}/change_password`, {
        uid: uid,
        Old_Password: oldPassword,
        New_Password: newPassword,
      });

      if (response.status === 200) {
        Swal.fire({
          title: 'Success',
          text: 'Password updated successfully',
          icon: 'success',
          showConfirmButton: false,
          timer: 1500,
          timerProgressBar: true,
          willClose: () => {
            setOpenChangePasswordDialog(false);
          }
        });
      }

      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      const errorMsg = err?.response?.data?.error || 'Failed to change password. Please try again.';
      toast.error(errorMsg, {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
  };

  const handleSignOut = () => {
    // Add a smooth transition before signing out
    document.body.style.opacity = '0.8';
    document.body.style.transition = 'opacity 0.5s ease';

    axios.post(`${API_URL}/logout`).catch(() => {});

    setTimeout(() => {
      sessionStorage.clear();
      navigate('/');
    }, 500);
  };

  const handleChangePasswordDialogClose = () => {
    setOpenChangePasswordDialog(false);
  };

  // Clean up the transition effect
  useEffect(() => {
    return () => {
      document.body.style.opacity = '1';
    };
  }, []);

  return (
    <>
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        height: '100%',
        minWidth: '60px',
        position: 'relative'
      }}>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          height: '100%',
          position: 'relative',
          '&:hover': {
            '&::before': {
              content: '""',
              position: 'absolute',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              backgroundColor: 'rgba(68, 183, 0, 0.1)',
              animation: `${rippleAnimation} 1.5s infinite`,
            }
          }
        }}>
          <Tooltip
            title={storedUsername}
            placement="bottom"
            TransitionProps={{ timeout: 600 }}
            PopperProps={{
              modifiers: [
                {
                  name: 'offset',
                  options: {
                    offset: [0, -10],
                  },
                },
              ],
            }}
          >
            <StyledBadge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              variant="dot"
            >
              <StyledAvatar
                alt="User Avatar"
                src=""
                onClick={handleClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                sx={{
                  transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                  transition: 'transform 0.3s ease',
                }}
              />
            </StyledBadge>
          </Tooltip>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          TransitionProps={{
            timeout: { enter: 300, exit: 200 },
          }}
          sx={{
            '& .MuiPaper-root': {
              borderRadius: '12px',
              boxShadow: '0 5px 15px rgba(0, 0, 0, 0.1)',
              padding: '8px 0',
              transformOrigin: 'top right',
              animation: `${keyframes`
                from {
                  opacity: 0;
                  transform: scale(0.9) translateY(-10px);
                }
                to {
                  opacity: 1;
                  transform: scale(1) translateY(0);
                }
              `} 0.2s ease-out forwards`,
            },
          }}
        >
          <StyledMenuItem index={0} onClick={handleEditProfileClick}>
            <EditIcon style={{ marginRight: 8, transition: 'transform 0.2s ease' }} />
            Edit Profile
          </StyledMenuItem>
          <StyledMenuItem index={1} onClick={handleChangePasswordClick}>
            <LockIcon style={{ marginRight: 8, transition: 'transform 0.2s ease' }} />
            Change Password
          </StyledMenuItem>
          <StyledMenuItem index={2} onClick={handleSignOutClick}>
            <ExitToAppIcon style={{ marginRight: 8, transition: 'transform 0.2s ease' }} />
            Sign Out
          </StyledMenuItem>
        </Menu>

        {/* Smooth Sign Out Dialog */}
        <Dialog
          open={openDialog}
          onClose={handleDialogClose}
          TransitionComponent={Transition}
          TransitionProps={{ timeout: 400 }}
          fullWidth
          maxWidth="xs"
          sx={{
            '& .MuiDialog-paper': {
              padding: '20px',
              borderRadius: '16px',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, #ff8a00, #e52e71)',
              },
              transform: 'translateY(0)',
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'translateY(-5px)',
              },
            },
          }}
        >
          <IconButton
            onClick={handleDialogClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'gray',
              transition: 'transform 0.2s ease',
              '&:hover': {
                transform: 'rotate(90deg)',
              }
            }}
          >
            <CloseIcon />
          </IconButton>
          <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            mb: 1,
            animation: `${keyframes`
              from {
                transform: scale(0.8);
                opacity: 0;
              }
              to {
                transform: scale(1);
                opacity: 1;
              }
            `} 0.5s ease`
          }}>
            <WarningAmberIcon sx={{
              fontSize: 80,
              color: 'orange',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
            }} />
          </Box>
          <DialogTitle>
            <Typography variant="h6" fontWeight="bold">
              Confirm Sign Out
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Typography>Are you sure you want to sign out?</Typography>
          </DialogContent>
          <DialogActions sx={{
            justifyContent: 'center',
            gap: 2,
            pb: 2,
            '& .MuiButton-root': {
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              }
            }
          }}>
            <Button
              onClick={handleDialogClose}
              variant="outlined"
              sx={{
                '&:hover': {
                  borderWidth: '2px',
                }
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSignOut}
              variant="contained"
              color="error"
              sx={{
                boxShadow: '0 2px 10px rgba(244, 67, 54, 0.3)',
                '&:hover': {
                  boxShadow: '0 4px 14px rgba(244, 67, 54, 0.4)',
                }
              }}
            >
              Sign Out
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={openChangePasswordDialog}
          onClose={handleChangePasswordDialogClose}
          TransitionComponent={Transition}
          TransitionProps={{ timeout: 400 }}
          fullWidth
          maxWidth="xs"
          sx={{
            '& .MuiDialog-paper': {
              padding: '20px',
              borderRadius: '16px',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, #4CAF50, #8BC34A)',
              },
            },
          }}
        >
          <IconButton
            onClick={handleChangePasswordDialogClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'gray',
              transition: 'transform 0.2s ease',
              '&:hover': {
                transform: 'rotate(90deg)',
              }
            }}
          >
            <CloseIcon />
          </IconButton>
          <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            mb: 2,
            animation: `${keyframes`
              0% {
                transform: rotate(0deg) scale(0.8);
                opacity: 0;
              }
              60% {
                transform: rotate(0deg) scale(1.1);
              }
              100% {
                transform: rotate(0deg) scale(1);
                opacity: 1;
              }
            `} 0.6s ease`
          }}>
            <LockIcon sx={{
              fontSize: 50,
              color: 'green',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
            }} />
          </Box>
          <DialogTitle>
            <Typography variant="h6" fontWeight="bold" textAlign="center">
              Change Password
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mb: 2 }}>
              <input
                type="password"
                placeholder="Old Password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                ref={oldPasswordRef}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #ccc',
                  transition: 'all 0.3s ease',
                  outline: 'none',
                  '&:focus': {
                    borderColor: '#4CAF50',
                    boxShadow: '0 0 0 2px rgba(76, 175, 80, 0.2)',
                  }
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#4CAF50';
                  e.target.style.boxShadow = '0 0 0 2px rgba(76, 175, 80, 0.2)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#ccc';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </Box>
            <Box sx={{ mb: 2 }}>
              <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #ccc',
                  transition: 'all 0.3s ease',
                  outline: 'none',
                  '&:focus': {
                    borderColor: '#4CAF50',
                    boxShadow: '0 0 0 2px rgba(76, 175, 80, 0.2)',
                  }
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#4CAF50';
                  e.target.style.boxShadow = '0 0 0 2px rgba(76, 175, 80, 0.2)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#ccc';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </Box>
            <Box sx={{ mb: 2 }}>
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #ccc',
                  transition: 'all 0.3s ease',
                  outline: 'none',
                  '&:focus': {
                    borderColor: '#4CAF50',
                    boxShadow: '0 0 0 2px rgba(76, 175, 80, 0.2)',
                  }
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#4CAF50';
                  e.target.style.boxShadow = '0 0 0 2px rgba(76, 175, 80, 0.2)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#ccc';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{
            justifyContent: 'center',
            gap: 2,
            '& .MuiButton-root': {
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              }
            }
          }}>
            <Button
              onClick={handleChangePasswordDialogClose}
              variant="outlined"
              sx={{
                '&:hover': {
                  borderWidth: '2px',
                }
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleChangePassword}
              variant="contained"
              sx={{
                background: 'linear-gradient(45deg, #4CAF50 30%, #8BC34A 90%)',
                boxShadow: '0 2px 10px rgba(76, 175, 80, 0.3)',
                '&:hover': {
                  boxShadow: '0 4px 14px rgba(76, 175, 80, 0.4)',
                }
              }}
            >
              Change Password
            </Button>
          </DialogActions>
          <ToastContainer
            position="top-center"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover

          />
        </Dialog>

        <EditProfileDialog
          open={openEditProfileDialog}
          onClose={() => setOpenEditProfileDialog(false)}
          userData={{
            username: sessionStorage.getItem('username'),
            email: sessionStorage.getItem('email'),
            mobile: sessionStorage.getItem('mobile'),
            fullName: sessionStorage.getItem('fullName')
          }}
        />
      </Box>
    </>
  );
}

export default AvatarIcon;