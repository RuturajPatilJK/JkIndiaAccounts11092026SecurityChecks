// routesConfig.js
import Login from './Login/Login';
import CompanyList from './CompanyList/CompanyList';
import DashBoard from './DashBoard/DashBoard';
import CreateAccountYearData from '../../src/Components/Company/AccountingYear/CreateAccountingYear';
import CreateCompany from '../Components/Company/CreateCompany/CreateCompany'

const routes = [
  {
    path: '/',
    element: Login,
    exact: true
  },
  {
    path: '/company-list',
    element: CompanyList
  },
  {
    path: '/dashboard',
    element: DashBoard
  },
  {
    path: '/create-accounting-year',
    element: CreateAccountYearData
  },
  {
    path:'/create-company',
    element: CreateCompany
  }

];

export default routes;
