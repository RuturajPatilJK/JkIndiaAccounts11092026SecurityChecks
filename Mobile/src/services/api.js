import axios from 'axios';
import { API_BASE, AGRI_API_BASE, SEIC_EVENTS_API, SEIC_SPONSORS_API } from '../config';

const client = axios.create({ baseURL: API_BASE, timeout: 20000 });

export const getCompanies = () =>
  client.get('/get_company_data_All');

export const userLogin = (username, password, companyCode) =>
  client.post('/userlogin', {
    User_Name: username,
    User_Password: password,
    Company_Code: companyCode,
  });

export const getGAPermission = (companyCode, uid) =>
  client.get(`/get_user_permissions?Company_Code=${companyCode}&Program_Name=/google-analytics&uid=${uid}`);

export const getGA4 = (site, range, start, end) => {
  let url = `/ga4-analytics?site=${site}&range=${range}`;
  if (range === 'custom' && start && end) url += `&start=${start}&end=${end}`;
  return client.get(url);
};

export const getAgriInsights = (range, start, end) => {
  let url = `${AGRI_API_BASE}?range=${range}`;
  if (range === 'custom' && start && end) url += `&start=${start}&end=${end}`;
  return axios.get(url, { timeout: 15000 });
};

export const getSEICEvents = () =>
  axios.get(SEIC_EVENTS_API, { timeout: 15000 });

export const getSEICSponsors = (eventCode) =>
  axios.get(`${SEIC_SPONSORS_API}?event_code=${eventCode}`, { timeout: 15000 });

export const getEBuySugar = (filter, start, end) => {
  let url = `/ebuysugar-dashboard?filter=${filter}`;
  if (filter === 'custom' && start && end) url += `&start=${start}&end=${end}`;
  return client.get(url);
};
