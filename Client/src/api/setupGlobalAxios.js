// Side-effect only module: configures the default `axios` singleton so that every
// raw `axios.get/post(...)` call across the app (not just axiosInstance.jsx) sends
// the httpOnly auth cookie and gets 401-refresh-and-retry, without touching each
// call site individually. Also patches window.fetch for the same reason (many files
// call fetch() directly). Import this once, as early as possible (see index.js).
import axios from 'axios';
import { attachAuthInterceptors, patchGlobalFetch } from './authInterceptors';

axios.defaults.withCredentials = true;
attachAuthInterceptors(axios, `${process.env.REACT_APP_API}/refresh`);
patchGlobalFetch();
