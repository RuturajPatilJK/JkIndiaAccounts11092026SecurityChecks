import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';

const IDLE_TIMEOUT = 28800000;
const REFRESH_INTERVAL = 900000;

const useSessionExpiration = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === '/') return;
    let idleTimer;
    let refreshInterval;

    const resetIdleTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        sessionStorage.clear();
        Swal.fire({
          icon: 'warning',
          title: 'Session Expired',
          text: 'You were logged out due to inactivity.',
        }).then(() => {
          navigate('/');
        });
      }, IDLE_TIMEOUT);
    };

    const refreshToken = async () => {
      const loggedIn = sessionStorage.getItem('username');
      if (!loggedIn) return;

      try {
        await axios.post(`${process.env.REACT_APP_API}/refresh`);
      } catch (err) {
        if (err.response && err.response.status === 401) {
          sessionStorage.clear();
          Swal.fire({
            icon: 'warning',
            title: 'Session Expired',
            text: 'Your session has expired. Please log in again.',
          }).then(() => {
            navigate('/');
          });
        }
      }
    };

    const events = ['mousemove', 'keydown', 'mousedown', 'scroll', 'touchstart'];
    events.forEach((event) => window.addEventListener(event, resetIdleTimer));

    refreshInterval = setInterval(refreshToken, REFRESH_INTERVAL);

    resetIdleTimer();

    return () => {
      clearTimeout(idleTimer);
      clearInterval(refreshInterval);
      events.forEach((event) => window.removeEventListener(event, resetIdleTimer));
    };
  }, [navigate]);
};

export default useSessionExpiration;
