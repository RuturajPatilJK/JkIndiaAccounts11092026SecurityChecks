// routesConfig.js
import CompanyUtility from '../Components/Company/CreateCompany/CompanyUtility';
import CreateCompany from "../Components/Company/CreateCompany/CreateCompany";
import SelectCompany from './Company/CreateCompany/SelectCompany';
import CreateAccountYearData from './Company/AccountingYear/CreateAccountingYear';
import SelectAccoungYear from './Company/AccountingYear/SelectAccountingYear';
import FinicialGroupsUtility from "./Master/AccountInformation/FinicialMasters/FinicialMasterUtility"
import FinicialMaster from "./Master/AccountInformation/FinicialMasters/FinicialMaster"
import GstStateMasterUtility from "./Master//OtherMasters/GSTStateMaster/GstStateMasterUtility"
import GstStateMaster from "./Master/OtherMasters/GSTStateMaster/GstStateMaster"
import CityMasterUtility from "./Master/AccountInformation/CityMaster/CityMasterUtility";
import CityMaster from "./Master/AccountInformation/CityMaster/CityMaster"
import BrandMasterUtility from "./Master/OtherMasters/BrandMaster/BrandMasterUtility";
import BrandMaster from "./Master/OtherMasters/BrandMaster/BrandMaster"
import GSTRateMasterUtility from "./Master/OtherMasters/GSTRateMaster/GSTRateMasterUtility"
import GSTRateMaster from './Master/OtherMasters/GSTRateMaster/GSTRateMaster';
import OtherPurchase from './Transactions/OtherPurchase/OtherPurchase';
import DeliveryOrderUtility from './BusinessRelated/DeliveryOrder/DeliveryOrderUtility';
import DeliveryOrder from './BusinessRelated/DeliveryOrder/DeliveryOrder';
import SystemMasterUtility from './Master/OtherMasters/SystemMaster/SystemMasterUtility';
import SystemMaster from './Master/OtherMasters/SystemMaster/SystemMaster';
import OtherPurchaseUtility from './Transactions/OtherPurchase/OtherPurchaseUtility';
import TenderPurchaseUtility from './BusinessRelated/TenderPurchase/TenderPurchaseUtility';
import DebitCreditNoteUtility from './Transactions/DebitCreditNote/DebitCreditNoteUtility';
import DebitCreditNote from './Transactions/DebitCreditNote/DebitCreditNote';
import PurchaseBillUtility from './Inword/SugarPurchase/SugarPurchaseBillUtility';
import SugarPurchase from './Inword/SugarPurchase/SugarPurchase';
import SaleBillUtility from './Outward/SaleBill/SaleBillUtility';
import SaleBill from './Outward/SaleBill/SaleBill';
import CommissionBill from './Outward/CommissionBill/CommissionBill';
import CommissionBillUtility from './Outward/CommissionBill/CommissionBillUtility';
import OtherGSTInput from './Inword/OtherGSTInput/OtherGSTInput';
import OtherGSTInputUtility from './Inword/OtherGSTInput/OtherGSTInputUtility'
import PartyUnitMaster from './Master/AccountInformation/PartyUnitMaster/PartyUnitMaster'
import PartyUnitMasterUtility from './Master/AccountInformation/PartyUnitMaster/PartyUnitMasterUtility';
import PaymentNote from './Transactions/PaymentNote/PaymentNote';
import PaymentNoteUtility from './Transactions/PaymentNote/PaymentNoteUtility';
import WhatsAppURLManager from './Master/WhatsAppAPIIntegration/WhatsAppURLManager';
import CompanyPrintingInfo from './Utilities/CompanyPrintingInformation/CompanyPrintingInfo';
import PostDateManager from './Utilities/PostDate/PostDate';
import CompanyParameters from './Master/CompanyParamter/CompanyParameters';
import AccountMaster from './Master/AccountInformation/AccountMaster/AccountMaster';
import AccountMasterUtility from './Master/AccountInformation/AccountMaster/AccountMasterUtility';
import EBuySugarianUserUtility from './EBuySugarian/EBuySugarinUser/EBuySugarianUserUtility';
import EBuySugarAccountMasterUtility from './EBuySugarian/EBuySugarinUser/EBuySugarAccountMasterUtility';
import DeliveryOredrUtility from './BusinessRelated/DeliveryOrder/DeliveryOrderUtility';
import SugarSaleReturnPurchase from './Inword/SugarSaleReturnPurchase/SugarSaleReturnPurchase';
import SugarSaleReturnPurchaseUtility from './Inword/SugarSaleReturnPurchase/SugarSaleReturnPurchaseUtility';
import TenderPurchase from './BusinessRelated/TenderPurchase/TenderPurchase';
import SugarSaleReturnSale from './Outward/SugarSaleReturnSale/SugarSaleReturnSale';
import PendingDO from './BusinessRelated/DeliveryOrder/PendingDOUtility'
import ServiceBill from './Outward/ServiceBill/ServiceBill'
import ServiceBillUtility from './Outward/ServiceBill/ServiceBillUtility'
import UserCreationWithPermission from './Utilities/UserCreationWithPermission/UserCreationWithPermission.jsx';
import Letter from './BusinessRelated/Letter/Letter.jsx';
import LetterUtility from './BusinessRelated/Letter/LetterUtility.jsx';
import UTREntryUtility from './Transactions/UTR/UTREntryUtility.jsx'
import UTREntry from './Transactions/UTR/UTREntry.jsx';
import RecieptPayment from './Transactions/RecieptPayment/RecieptPayment.jsx'
import JournalVoucher from './Transactions/JournalVoucher/JournalVoucher.jsx'
import SugarSaleReturnSaleUtility from './Outward/SugarSaleReturnSale/SugarSaleReturnSaleUtility.jsx';
import RecieptPaymentUtility from './Transactions/RecieptPayment/RecieptPaymentUtility';
import JournalVoucher_Utility from './Transactions/JournalVoucher/JournalVoucher_Utility';
import Ledger from './Reports/Ledger/Ledger.jsx';
import GledgerReport from './Reports/Ledger/GledgerReport.jsx'
import AllGledgerReport from "./Reports/Ledger/GetAllGledgerReport.jsx"
import TrialBalanceGeneralReport from './Reports/TrialBalance/TrialBalanceGeneralReport.jsx';
import GledgerWithoutOpeningBalance from './Reports/Ledger/GledgerWithoutOpeningBalance.jsx'

import PendingReports from './Reports/PendingReports/PendingReports.jsx';
import TrialBalance from './Reports/TrialBalance/TrialBalance.jsx'
import TenderReports from "./Reports/PendingReports/TenderReports.jsx";
//SaudaBookUtility
import SaudaBookUtility from './BusinessRelated/SaudaBookUtility/SaudaBookUtility.jsx';
import SaudaShifting from './BusinessRelated/SaudaShifting/SaudaShifting.jsx';
import UTRDetailReport from "./Reports/PendingReports/UTRDetailReport.jsx";
import SaudaBookUtilityPage from './BusinessRelated/SaudaBookUtility/SaudaBookUtilityPage.jsx';
import NormalSaudaSummary from "./../Components/Reports/PendingReports/NormalSaudaSummary.jsx"
import UserCreationWithPermissionUtility from './Utilities/UserCreationWithPermission/UserCreationWithPermissionUtility.jsx';

import GSTUtilitiesForm from './GSTUtilities/GstUtilities';
import UserRegistrationForm from './UserRegistration/UserRegistrationForm.jsx';
import BalanceStockReport from './BusinessRelated/StockReport/BalanceStockReport/BalanceStockReport.jsx';
import MillWiseLiftingWise from './BusinessRelated/StockReport/BalanceStockReport/MillWiseLiftingWise.jsx';
import SelfStockReport from './BusinessRelated/StockReport/BalanceStockReport/SelfStockReport.jsx';
import ProfitNLoss from './BusinessRelated/StockReport/ProfitNLossReport/ProfitNLoss.jsx';
import ProfitNLossReport from './BusinessRelated/StockReport/ProfitNLossReport/ProfitNLossReport.jsx';

import TrialBalanceReport from './Reports/TrialBalance/TrialBalanceReport.jsx';
import TrialBalanceScreen from './Reports/TrialBalanceScreen/TrialBalanceScreen.jsx';
import TrialBalanceDetailReport from './Reports/TrialBalance/TrialBalanceDetialReport.jsx';
import DaywiseTrialBalanceReport from './Reports/TrialBalance/DaywiseTrialBalance.jsx';
import DaywiseTrialBalanceWithoutOpenning from './Reports/TrialBalance/DaywiseTrialBalanceWithoutOpenning.jsx'
import JVReport from './Reports/TrialBalance/JVReport.jsx';
import OpeningBalanceDetails from './Reports/TrialBalance/OpeningBalanceReport.jsx'
import AgingAnalysisReport from './Reports/TrialBalance/AgingAnalysis.jsx'
import AgingAnalysisReportCreditors from './Reports/TrialBalance/AgingAnalysisCreditors.jsx';
import BankBook from './Reports/Ledger/BankBook/BankBook.jsx';
import BankBookReport from './Reports/Ledger/BankBook/BankBookReport.jsx';
import AccountMasterPrint from './Reports/Ledger/AccountMasterPrint/AccountMasterPrint.jsx';
import AccountMasterPrintReport from './Reports/Ledger/AccountMasterPrint/AccountMasterPrintReport.jsx';
import LedgerMonthWise from './Reports/Ledger/LedgerMonthWise/LedgerMonthWise.jsx';
import LedgerMonthWiseReport from './Reports/Ledger/LedgerMonthWise/LedgerMonthWiseReport.jsx';
import InterestStatement from './Reports/Ledger/InterestStatement/InterestStatement.jsx';
import InterestStatementReport from './Reports/Ledger/InterestStatement/InterestStatementReport.jsx';
import StockBookDetail from './Reports/StockBookDetail/StockBookDetail.jsx';
import StockBookReport from './Reports/StockBookDetail/StockBookReport.jsx';
import StockBookReportMillwise from './Reports/StockBookDetail/StockBookReportMillwise.jsx';
import StockReportDetail from './Reports/StockBookDetail/StockBookDetailReport.jsx';
import RetailDetailReport from './Reports/StockBookDetail/RetailDetailReport.jsx';
import Register from './BusinessRelated/StockReport/Register/Register.jsx';
import DispatchDetailsReport from './BusinessRelated/StockReport/Register/DisptachDetailReport.jsx';
import ProfitLoss from './Reports/ProfitLossBalanceSheet/ProfitLoss.jsx'
import ProfitLossreport from './Reports/ProfitLossBalanceSheet/ProfitLossReport.jsx'
import UTRReportSummary from './Reports/PendingReports/UTRReportSummary.jsx';
import MillPaymentSummary from './Reports/PendingReports/MillPaymentSummary.jsx';
import MillPaymentDetail from './Reports/PendingReports/MillPaymentDetails.jsx';
import DuePaymentSummary from './Reports/PendingReports/DuePaymentSummary.jsx';
import SaudaSummary from './Reports/PendingReports/SaudaSummary.jsx'
import BalancesheetReport from './Reports/ProfitLossBalanceSheet/BalancesheetReport.jsx'
import MultipleLedger from './Reports/MultipleLedger/MultipleLedger.jsx'
import DayBookReport from './Reports/Ledger/DayBook/DayBookReport.jsx'
import DayBook from './Reports/Ledger/DayBook/DayBook.jsx'
import StatisticData from "./Reports/Ledger/StatisticData.jsx"

import DeliveryOrderSummaryUtility from './BusinessRelated/DeliverySummary/DeliverySummaryUtility';
import DeliveryOrderSummary from './BusinessRelated/DeliverySummary/DeliveryOrderSummary';

//Reports -> Purchase Register Report
import PurchaseSaleRegister from './Reports/PurchaseSaleRegister/PurchaseSaleRegister.jsx';
import SaleTDSRegister from './Reports/PurchaseSaleRegister/SaleTDSRegister.jsx';
import SaleTDSPartWiseRegister from './Reports/PurchaseSaleRegister/SaleTDSpartywiseRegister.jsx';
import SaleTCSRegister from './Reports/PurchaseSaleRegister/SaleTCSRegister.jsx';
import SaleTCSPartWiseRegister from './Reports/PurchaseSaleRegister/SaleTCSpartywiseRegister.jsx';
import PurchaseTCSPartWiseRegister from './Reports/PurchaseSaleRegister/PurchaseTCSPartywiseRegister.jsx';
import PurchaseTCSRegister from './Reports/PurchaseSaleRegister/PurchaseTCSRegister.jsx';
import PurchaseTDSRegister from './Reports/PurchaseSaleRegister/PurchaseTDSRegister.jsx';
import PurchaseTDSPartywiseRegister from './Reports/PurchaseSaleRegister/PurchaseTDSPartyWiseRegiter.jsx';
import PurchaseRegister from './Reports/PurchaseSaleRegister/PurchaseRegister.jsx';
import SaleRegister from './Reports/PurchaseSaleRegister/SaleRegister.jsx';
import PurchaseReturnRegister from './Reports/PurchaseSaleRegister/SugarPurchaseReturnRegister.jsx';
import SaleReturnSaleRegister from './Reports/PurchaseSaleRegister/SugarSaleReturnSale.jsx';
import MillSaleReport from './Reports/PurchaseSaleRegister/MillSaleReport.jsx';
import SaleMonthWise from './Reports/PurchaseSaleRegister/SaleMonthWise.jsx';
import PurchaseMonthWise from './Reports/PurchaseSaleRegister/PurchaseMonthWise.jsx';
import RCMRegister from './Reports/PurchaseSaleRegister/RCMRegister.jsx';
import MillWisePurchase from './BusinessRelated/StockReport/Register/MillWisePurchaseforDispatch.jsx';
import MillPaymentForGST from './BusinessRelated/StockReport/Register/MillPaymentForGST.jsx';
import BalanceStockSummary from './BusinessRelated/StockReport/Register/BalanceStockSummary.jsx';

//Online Rack Railway
import RackMillInfoUtility from './OnlineRailwayRackBuy/RackMillInfo/RackMillInfoUtility.jsx';
import RackMillInfo from './OnlineRailwayRackBuy/RackMillInfo/RackMillInfo.jsx';
import RackRailwaystationMasterUtility from './OnlineRailwayRackBuy/RackRailwaystationMaster/RackRailwaystationMasterUtility.jsx';
import RackRailwaystationMaster from './OnlineRailwayRackBuy/RackRailwaystationMaster/RackRailwaystationMaster.jsx';
import RackLinkrailwaystationUtility from './OnlineRailwayRackBuy/RackLinkrailwaystation/RackLinkrailwaystationUtility.jsx';
import RackLinkrailwaystation from './OnlineRailwayRackBuy/RackLinkrailwaystation/RackLinkrailwaystation.jsx';
import RackFromToRailwayStationRateUtility from './OnlineRailwayRackBuy/RackFromToRailwayStationRate/RackFromToRailwayStationRateUtility.jsx';
import RackFromToRailwayStationRate from './OnlineRailwayRackBuy/RackFromToRailwayStationRate/RackFromToRailwayStationRate.jsx';
import RackRailwayMillRateReport from './OnlineRailwayRackBuy/Reports/RackRailwayMillRate/RackRailwayMillRateReport.jsx';
import MillRateReportTable from './OnlineRailwayRackBuy/Reports/RackRailwayMillRate/MillRateInfoReport.jsx';

//Analytics
import PeriodicSaleAnalyticsLineChart from '../Charts/PeriodicSaleAnalytics/PeriodicSaleAnalyticsLineChart.jsx';
import PeriodicSaleAnalyticsBarChart from '../Charts/PeriodicSaleAnalytics/PeriodicSaleAnalyticsBarChart.jsx';

//Register Report
import NewDispatchRegister from './BusinessRelated/StockReport/Register/NewDispatchRegister.jsx'
import DespatchDetails from './BusinessRelated/StockReport/Register/DispatchDetails.jsx';
import DespatchDetailsNew from './BusinessRelated/StockReport/Register/DispatchDetailsNew.jsx';
import DespatchDetailsForMill from './BusinessRelated/StockReport/Register/DispatchDetailForMill.jsx';
import DispatchSummary from './BusinessRelated/StockReport/Register/DispatchSummary.jsx';
import DispatchDiiffTOoRecieve from './BusinessRelated/StockReport/Register/DispatchDiffTorecieve.jsx';
import DispatchDiiffTOoPay from './BusinessRelated/StockReport/Register/DispatchDiffToPay.jsx';
import DispatchMillWise from './BusinessRelated/StockReport/Register/DispatchMillWise.jsx';
import DispatchGradeWise from './BusinessRelated/StockReport/Register/DispatchGradeWise.jsx';
import PartyWiseDO from './BusinessRelated/StockReport/Register/PartyWiseDO.jsx';
import PartyWiseDOWithMill from './BusinessRelated/StockReport/Register/PartyWiseDOwithMill.jsx';
import TransportAcregister from './BusinessRelated/StockReport/Register/TransportAcRegister.jsx';
import MillwiseDispatch from './BusinessRelated/StockReport/Register/MillWiseDispatch.jsx';
import TransportWiseDispatch from './BusinessRelated/StockReport/Register/TransportWiseDispatch.jsx';
import DOWiseDispatch from './BusinessRelated/StockReport/Register/DOWiseDispatch.jsx';

//ETenders
import LiveTenders from './BusinessRelated/TenderPurchase/LiveeTenders/LiveTenders.jsx';
import LiveAllTenders from './BusinessRelated/TenderPurchase/LiveeTenders/LiveAllTenders.jsx';
import LiveAllTendersForDailyBasis from './BusinessRelated/TenderPurchase/LiveeTenders/LiveAllTendersForDailyBasis.jsx';
import PendingSBList from './BusinessRelated/DeliveryOrder/PendingSBList.jsx';
import SettleTenders from './Utilities/SettleTenders/SettleTenders.jsx';

//Company Logs
import CompanyLogs from './CompanyLogs/CompanyLogs.jsx';

//Eway Bill Portal
import EWayBillPortal from './EwayBillPortal/EWayBillPortal/EWayBillPortalTabs.jsx';

//Record Locked and UnLocked Provision
import UnlockedRecord from './Utilities/UnLockRecord/UnlockedRecord.jsx';

//WhatsApp Management Routes
import BroadCast from './BusinessRelated/BroadCast/Broadcast.jsx';

//Salary Posting Route
import genrateSalary from './Outward/GenrateSalary/genrateSalary.jsx';

//File System Management Routes
import FileSystemHomeCompoent from "./FileSystemManagement/Pages/Home/Home.jsx"
import FileCupboardMaster from "./FileSystemManagement/CupBoardMaster/CupBoardMasterUtility.js"
import FileCupboardMasterMain from "./FileSystemManagement/CupBoardMaster/CupBoardmasterComponent.js"
import FileManagementUtility from "./FileSystemManagement/File Info/FileInformationUtility.js"
import FileManagemant from "./FileSystemManagement/File Info/FileInformationComponent.js"
import SearchFile from "./FileSystemManagement/SearchFile/SearchFileUtility.js"
import FileShifting from "./FileSystemManagement/FileShifting/FileShifting.js"
//End File System Management Routes

import foundManegment from './Utilities/FundManegment/FundManegment.jsx'
import FundManagementUtility from './Utilities/FundManegment/fundManegment_utility.jsx';

import ShetkariSaleBillUtility from './Outward/ShetkariSale/ShetkariSaleBillUtility.jsx';
import ShetkariPurchaseBillUtility from './Inword/ShetkariPurchase/ShetakriPurchaseUtility.jsx';
import ShetkariPurchase from './Inword/ShetkariPurchase/ShetkariPurchase.jsx'
import ShetkariSaleBill from './Outward/ShetkariSale/ShetkariSaleBill.jsx'


import MultipleSBReport from './Reports/Ledger/MultipleSBReport.jsx';

import GledgerReportForCA from './Reports/Ledger/GledgerReportForCA.jsx';

import ProformaServiceBill from './Outward/ProformaServiceBill/ProformaServiceBill.jsx';
import ProformaServiceBillUtility from './Outward/ProformaServiceBill/ProformaServiceBillUtitlity.jsx';

import PurchaseRegisterTally from './Reports/PurchaseSaleRegister/PurchaseRegisterTally.jsx';
import SaleRegisterTally from './Reports/PurchaseSaleRegister/SaleRegisterTally.jsx';


import SundryDetailsReport from './BusinessRelated/StockReport/BalanceStockReport/SundryDetailReport.jsx';

//Excertional Report
import Analytics from './ExceptionalReport/analytics.jsx';
import PurchaseTopSellersNew from './ExceptionalReport/purchasereport';
import SaleTopBuyersNew from './ExceptionalReport/salebuyerreport.jsx';
import AccountMasterAnalytics from './ExceptionalReport/AccountMasterAnalytics.jsx';
import TopBuyerPercentageReport from './ExceptionalReport/TopBuyerPercentageReport.jsx';
import PartywiseSaleReport from '../Components/BusinessRelated/StockReport/Register/PartywiseSaleReport.jsx';



//RailwayRack
import RailwayRack from '../Components/RailwayRackBuy/RailwayRackMaster/RailwayRackMaster.jsx';
import RailwayRackUtility from './RailwayRackBuy/RailwayRackMaster/RailwayRackUtility.jsx';


//eBuySugar
import CustomerLimit from './Master/AccountInformation/CustomerLimit/CustomerLimit.jsx';
import RiskManagement from './Master/AccountInformation/RiskManagement/RiskManagement.jsx';
import EBuySugarHub from './EBuySugarian/EBuySugarHub.jsx';
import EbuySugarSelfStock from './EBuySugarian/EbuySugarSelfStock/EbuySugarSelfStock.jsx';

import AgingAnalysisBlanceReport from './Reports/TrialBalance/AgingAnalysisAccodeBalance.jsx';

import GradeWiseSaudaSummary from './BusinessRelated/StockReport/Register/GradeWiseSaudaSummary.jsx'


//Closing Stock
import ClosingStock from './ClosingStock/ClosingStock.jsx';

//Carporate Sale
import CarporateSaleUtility from './BusinessRelated/CarporateSale/CarporateSaleUtility.jsx';
import CarporateSale from './BusinessRelated/CarporateSale/CarporateSale.jsx';
import CarporateSaleRegister from './BusinessRelated/CarporateSale/CarporateRegister.jsx';
import CarporateBalanceReport from './BusinessRelated/CarporateSale/CarporateSaleBalance.jsx';
import CarporateSaleDetail from './BusinessRelated/CarporateSale/CarporateSaleDetail.jsx';
import AgingAnalysisGSTwise from './Reports/TrialBalance/AgingAnalysisGSTwise.jsx';

import DaliySudaDispatch from './BusinessRelated/StockReport/Register/Daliydispach.jsx';
import TDSDeclaration from './Master/AccountInformation/AccountMaster/TdsDeclaration.jsx'
import TDSSectionMaster from "./Master/OtherMasters/TDS_Sectin.jsx"
import TDSsectionUtility from './Master/OtherMasters/TDS_sectionutility.jsx';
import GoogleAnalytics from '../Components/GoogleAnalytics/GoogleAnalytics.jsx';

import OtherSaleBill from './Outward/OtherSaleBill/OtherSaleBill.jsx';
import OtherSaleBillUtility from './Outward/OtherSaleBill/OtherSaleBillUtility.jsx';

import TrialBalanceDetailReportGSTwise from './Reports/TrialBalance/TrialBalanceDetailReportGSTwise.jsx';
import TrialBalanceDetailReportPANwise from './Reports/TrialBalance/TrialBalanceDetailREportPANwise.jsx';
import AgingAnalysisPANwise from './Reports/TrialBalance/AgingAnalysisPANWise.jsx';

import EmployeeManagement from './Master/AccountInformation/EmployeeManagement/EmployeeManagement';
import EmployeeManagementUtility from './Master/AccountInformation/EmployeeManagement/EmployeeManagementUtility';

import AgingAnalysisReport_Debtors_GST from './Reports/TrialBalance/AgingAnalysisDebtors_GST.jsx';
import AgingAnalysisReportCreditors_GST from './Reports/TrialBalance/AgingAnalysisGSTwiseGroup.jsx';


const routes = [
  {
    path: '/create-utility',
    element: CompanyUtility
  },
  {
    path: '/create-company',
    element: CreateCompany
  },
  {
    path: '/select-company',
    element: SelectCompany
  },
  {
    path: '/create-accounting-year',
    element: CreateAccountYearData
  },
  {
    path: '/select-accounting-year',
    element: SelectAccoungYear
  },
  {
    path: '/financial-groups-utility',
    element: FinicialGroupsUtility
  },
  {
    path: '/financial-groups',
    element: FinicialMaster
  },
  //GST StateMaster Routes
  {
    path: '/gst-state-master-utility',
    element: GstStateMasterUtility
  },
  {
    path: '/gst-state-master',
    element: GstStateMaster
  },
  {
    path: '/city-master-utility',
    element: CityMasterUtility
  },
  {
    path: '/city-master',
    element: CityMaster
  },
  {
    path: '/brand-master-utility',
    element: BrandMasterUtility
  },
  {
    path: '/brand-master',
    element: BrandMaster
  },
  {
    path: '/gst-rate-masterutility',
    element: GSTRateMasterUtility
  },
  {
    path: '/gst-ratemaster',
    element: GSTRateMaster
  },
  {

    path: '/other-purchaseutility',
    element: OtherPurchaseUtility
  },
  {

    path: '/other-purchase',
    element: OtherPurchase
  },
  {
    path: '/delivery-order-utility',
    element: DeliveryOrderUtility
  },
  {
    path: '/delivery-order',
    element: DeliveryOrder
  },
  {
    path: '/delivery-order-summary',
    element: DeliveryOrderSummary
  },
  {
    path: '/delivery-order-summary-utility',
    element: DeliveryOrderSummaryUtility
  },

  {
    path: '/syetem-masterutility',
    element: SystemMasterUtility
  },
  {
    path: '/syetem-master',
    element: SystemMaster
  },
  //Tender Routes
  {
    path: '/tender-purchaseutility',
    element: TenderPurchaseUtility
  },
  {
    path: '/tender_head',
    element: TenderPurchase

  },
  //Debit Credit Note Routes
  {
    path: '/debitcreditnote-utility',
    element: DebitCreditNoteUtility
  },
  {
    path: '/debitcreditnote',
    element: DebitCreditNote
  },
  //purchase bill
  {
    path: '/sugarpurchasebill-utility',
    element: PurchaseBillUtility
  },
  {
    path: '/sugarpurchasebill',
    element: SugarPurchase
  },

  //SaleBill
  {
    path: '/sale-bill',
    element: SaleBill
  },
  {
    path: '/SaleBill-utility',
    element: SaleBillUtility
  },

  //CommissionBill
  {
    path: '/commission-bill',
    element: CommissionBill
  },

  {
    path: '/CommissionBill-utility',
    element: CommissionBillUtility
  },

  //ServiceBill
  {
    path: '/service-bill',
    element: ServiceBill
  },

  //OtherGSTInput
  {
    path: '/other-gst-input',
    element: OtherGSTInput
  },
  {
    path: '/OtherGSTInput-utility',
    element: OtherGSTInputUtility
  },
  //Party Unit Master
  {
    path: '/corporate-customer-limit',
    element: PartyUnitMaster
  },
  {
    path: '/PartyUnitMaster-utility',
    element: PartyUnitMasterUtility
  },
  //PaymentNote
  {
    path: '/payment-note',
    element: PaymentNote
  },
  {
    path: '/PaymentNote-utility',
    element: PaymentNoteUtility
  },
  //WhatsApp API Integration
  {
    path: '/whatsapp-api',
    element: WhatsAppURLManager
  },
  //Our Office Address
  {
    path: '/our-office-address',
    element: CompanyPrintingInfo
  },
  //Post Date
  {
    path: '/post-date',
    element: PostDateManager
  },

  //Company Parameters
  {
    path: '/company-parameter',
    element: CompanyParameters
  },
  //Account Master
  {
    path: '/account-master',
    element: AccountMaster
  },
  {
    path: '/AccountMaster-utility',
    element: AccountMasterUtility
  },
  //Delivery Order
  {
    path: '/delivery-order',
    element: DeliveryOrder
  },
  {
    path: '/delivery-order-utility',
    element: DeliveryOredrUtility
  },

  //Pending DO
  {
    path: '/pending-do',
    element: PendingDO
  },
  {
    path: '/sugar-sale-return-purchase',
    element: SugarSaleReturnPurchase
  },
  {
    path: '/sugar-sale-return-purchase-utility',
    element: SugarSaleReturnPurchaseUtility
  },

  //SugarSaleReturnSale

  {
    path: '/sugar-sale-return-sale-utility',
    element: SugarSaleReturnSaleUtility
  },
  {
    path: '/sugar-sale-return-sale',
    element: SugarSaleReturnSale
  },

  //ServiceBill Utility
  {
    path: '/ServiceBill-utility',
    element: ServiceBillUtility
  },

  //ServiceBill
  {
    path: '/service-bill',
    element: ServiceBill
  },

  // User Creations
  {
    path: '/user-creation',
    element: UserCreationWithPermission
  }
  ,
  {
    path: '/user-permission-utility',
    element: UserCreationWithPermissionUtility
  }
  ,
  //Letter
  {
    path: '/letter',
    element: LetterUtility
  }, {
    path: '/letter-data',
    element: Letter
  },
  //UTR 
  {
    path: '/utrentry-Utility',
    element: UTREntryUtility
  },
  {
    path: '/utr-entry',
    element: UTREntry
  }
  ,

  //ReceiptPaymeny
  {
    path: '/receipt-payment',
    element: RecieptPayment
  },
  {
    path: '/RecieptPaymentUtility',
    element: RecieptPaymentUtility
  },

  //Journal Voucher
  {
    path: '/Journal-voucher',
    element: JournalVoucher
  },

  {
    path: '/JournalVoucher_Utility',
    element: JournalVoucher_Utility
  },

  //Reports
  {
    path: '/ledger',
    element: Ledger
  },
  {
    path: '/ledger-withoutopeningbalance',
    element: GledgerWithoutOpeningBalance
  },

  {
    path: '/getAllledger-report',
    element: AllGledgerReport
  },
  {
    path: '/ledger-report',
    element: GledgerReport
  },

  {
    path: '/multiple-ledger',
    element: MultipleLedger
  },
  {
    path: '/daybook',
    element: DayBook
  },
  {
    path: '/daybook-report',
    element: DayBookReport
  },
  //Bank Book
  {
    path: '/bank-book',
    element: BankBook
  },
  {
    path: '/bank-book-report',
    element: BankBookReport
  },

  //Pending Reports routes
  {
    path: '/pending-reports',
    element: PendingReports
  },
  {
    path: '/tenderwise-reports',
    element: TenderReports
  },
  {
    path: '/sauda-book-utility',
    element: SaudaBookUtility
  },
  {
    path: '/sauda-book-utility-page',
    element: SaudaBookUtilityPage
  },
  {
    path: '/sauda-shifting-utility',
    element: SaudaShifting
  },
  {
    path: '/utr_detail-report',
    element: UTRDetailReport
  },

  {
    path: '/UTRReportSummary-reports',
    element: UTRReportSummary
  },
  {
    path: '/MillPaymentSummary-reports',
    element: MillPaymentSummary
  },
  {
    path: '/MillPaymentDetail-reports',
    element: MillPaymentDetail
  },
  {
    path: '/DuepaymentSummary-reports',
    element: DuePaymentSummary
  },
  {
    path: '/SaudaSummary-reports',
    element: SaudaSummary
  },
  {
    path: '/normal-sauda-summary',
    element: NormalSaudaSummary
  },

  //GST Utilities
  {
    path: '/gstutilities',
    element: GSTUtilitiesForm
  },

  //TrialBalance
  {
    path: '/trial-balance',
    element: TrialBalance
  },

  {
    path: '/AgingAnalysis-Report',
    element: AgingAnalysisReport
  },
  {
    path: '/AgingAnalysis-Report-Creditors',
    element: AgingAnalysisReportCreditors
  },

  {
    path: '/TrialBalance-reports',
    element: TrialBalanceReport
  },
  {
    path: '/TrialBalancescreen',
    element: TrialBalanceScreen
  },
  {
    path: '/TrialBalanceDetails-reports',
    element: TrialBalanceDetailReport
  },

  {
    path: '/DaywiseTrialBalance-reports',
    element: DaywiseTrialBalanceReport
  },
  {
    path: '/DaywiseTrialBalanceWithoutOpenning-reports',
    element: DaywiseTrialBalanceWithoutOpenning
  },
  {
    path: '/JVReport-reports',
    element: JVReport
  },

  {
    path: '/OpeningBalanceDetails-reports',
    element: OpeningBalanceDetails
  },


  {
    path: '/profit-loss-balance-sheet',
    element: ProfitLoss
  },

  {
    path: '/ProfitLoss-Report',
    element: ProfitLossreport
  },


  //eBuySugar
  {
    path: '/eBuySugarian-user-utility',
    element: EBuySugarianUserUtility
  },
  {
    path: '/eBuySugarian-AcMaster-utility',
    element: EBuySugarAccountMasterUtility
  },

  //Balance Stock Report
  {
    path: '/balance-stock',
    element: BalanceStockReport
  },

  {
    path: '/millwise-stock',
    element: MillWiseLiftingWise
  },

  {
    path: '/self-stock',
    element: SelfStockReport
  },

  //Profit Loss Report
  {
    path: '/profit-loss',
    element: ProfitNLoss
  },
  {
    path: '/profit-loss-report',
    element: ProfitNLossReport
  },

  {
    path: '/Balancesheet-Report',
    element: BalancesheetReport
  },

  //Account Master Print
  {
    path: '/account-master-print',
    element: AccountMasterPrint
  },

  {
    path: '/accountmaster-print-report',
    element: AccountMasterPrintReport
  },

  // Month Wise Ledger Report
  {
    path: '/ledger-monthwise',
    element: LedgerMonthWise
  },
  {
    path: '/ledger-monthwise-report',
    element: LedgerMonthWiseReport
  },

  //Interest Statement
  {
    path: '/interest-statement',
    element: InterestStatement

  },
  {
    path: '/interest-statement-report',
    element: InterestStatementReport
  },
  //Report -> Stock Book
  {
    path: '/stock-book',
    element: StockBookDetail
  },

  //Report -> Stock Book Report
  {
    path: '/stock-book-report',
    element: StockBookReport
  },

  {
    path: '/stock-book-report-millwise',
    element: StockBookReportMillwise
  },

  {
    path: '/stock-book-detail-report',
    element: StockReportDetail
  },

  {
    path: '/retail-stock-book-detail-report',
    element: RetailDetailReport

  },

  //Register
  {
    path: '/register',
    element: Register

  },
  {
    path: '/dispatch-details',
    element: DispatchDetailsReport
  },

  //Common User Registration Form
  {
    path: '/user-register-form',
    element: UserRegistrationForm
  },

  //Purchase Sale Register Report
  {
    path: '/purchase-sale-registers',
    element: PurchaseSaleRegister
  },
  {
    path: '/SaleTDS-registers',
    element: SaleTDSRegister
  },
  {
    path: '/SaleTDSPartyWise-registers',
    element: SaleTDSPartWiseRegister
  },
  {
    path: '/SaleTCS-registers',
    element: SaleTCSRegister
  },
  {
    path: '/SaleTCSPartyWise-registers',
    element: SaleTCSPartWiseRegister
  },
  {
    path: '/PurchaseTCS-registers',
    element: PurchaseTCSRegister
  },
  {
    path: '/PurchaseTCSpartywise-registers',
    element: PurchaseTCSPartWiseRegister
  },
  {
    path: '/PurchaseTDS-registers',
    element: PurchaseTDSRegister
  },
  {
    path: '/PurchaseTDSpartywise-registers',
    element: PurchaseTDSPartywiseRegister
  },
  {
    path: '/Purchase-registers',
    element: PurchaseRegister
  },
  {
    path: '/Sale-registers',
    element: SaleRegister
  },
  {
    path: '/PurchaseReturn-registers',
    element: PurchaseReturnRegister
  },
  {
    path: '/SaleReturnSale-registers',
    element: SaleReturnSaleRegister
  },
  {
    path: '/MillSaleReport-registers',
    element: MillSaleReport
  },
  {
    path: '/SaleMonthWise-registers',
    element: SaleMonthWise
  },
  {
    path: '/PurchaseMonthWise-registers',
    element: PurchaseMonthWise
  },
  {
    path: '/RCM-registers',
    element: RCMRegister
  },

  //OnlineRailwayRackBuy
  {
    path: '/rack-mill-info-utility',
    element: RackMillInfoUtility
  },
  {
    path: '/rack-mill-info',
    element: RackMillInfo
  },
  {
    path: '/rack-railway-station-master-utility',
    element: RackRailwaystationMasterUtility
  },
  {
    path: 'rack-railway-station-master',
    element: RackRailwaystationMaster
  },
  {
    path: '/rack-link-railway-station-utility',
    element: RackLinkrailwaystationUtility
  },
  {
    path: 'rack-link-railway-station',
    element: RackLinkrailwaystation
  },
  {
    path: '/rack-from-to-railway-station-rate-utility',
    element: RackFromToRailwayStationRateUtility
  },
  {
    path: '/rack-from-to-railway-station-rate',
    element: RackFromToRailwayStationRate
  },

  //Online RailWay Rack Report
  {
    path: '/railway-rack-buy-report',
    element: RackRailwayMillRateReport
  },
  {
    path: '/mill-rate-info-report',
    element: MillRateReportTable
  },

  {
    path: '/periodic-sale-report',
    element: PeriodicSaleAnalyticsLineChart
  },
  {
    path: '/periodic-sale-report-bar-chart',
    element: PeriodicSaleAnalyticsBarChart
  },
  //Register Report

  {
    path: '/NewDispatchRegister-Register',
    element: NewDispatchRegister
  },
  {
    path: '/DispatchDetailsRegister',
    element: DespatchDetails
  },
  {
    path: '/DispatchDetailsNewRegister',
    element: DespatchDetailsNew
  },
  {
    path: '/DispatchDetailsForMill',
    element: DespatchDetailsForMill
  },
  {
    path: '/DispatchSummary',
    element: DispatchSummary
  },
  {
    path: '/DispatchDiffRecieve',
    element: DispatchDiiffTOoRecieve
  },
  {
    path: '/DispatchDiffPay',
    element: DispatchDiiffTOoPay
  },
  {
    path: '/dispatch-mill-wise',
    element: DispatchMillWise
  },
  {
    path: '/dispatch-grade-wise',
    element: DispatchGradeWise
  },
  {
    path: '/Party-wise-DO',
    element: PartyWiseDO
  },
  {
    path: '/Party-wise-DO_with-Mill',
    element: PartyWiseDOWithMill
  },
  {
    path: '/TransportAc-Register',
    element: TransportAcregister
  }
  , {
    path: '/live-tenders',
    element: LiveTenders
  },
  , {
    path: '/live-alltenders',
    element: LiveAllTenders
  },
  {
    path: '/live-alltenders-for-daily',
    element: LiveAllTendersForDailyBasis
  },
  {
    path: '/pending-sb-list',
    element: PendingSBList
  },
  {
    path: '/Settletenders',
    element: SettleTenders
  },
  {
    path: '/MillWisePurchase-Register',
    element: MillWisePurchase
  },
  {
    path: '/MillPaymentForGST-Register',
    element: MillPaymentForGST
  },
  {
    path: '/BalanceStockSummary-Register',
    element: BalanceStockSummary
  },
  {
    path: '/MillwiseDispatch',
    element: MillwiseDispatch
  },
  {
    path: '/TransportWiseDispatch',
    element: TransportWiseDispatch
  },
  {
    path: '/DOWiseDispatch',
    element: DOWiseDispatch
  },
  {
    path: '/companylogs',
    element: CompanyLogs
  },
  {
    path: '/ewaybill',
    element: EWayBillPortal
  },
  {
    path: '/StatisticData-report',
    element: StatisticData
  },
  {
    path: '/TrialBalanceGeneral-reports',
    element: TrialBalanceGeneralReport
  },
  {
    path: '/unlocked-record',
    element: UnlockedRecord
  },
  {
    path: '/send-message',
    element: BroadCast
  },
  {
    path: '/genratesalary',
    element: genrateSalary
  },


  //File System Management Routes
  {
    path: '/filesystemdashboard',
    element: FileSystemHomeCompoent
  },

  {
    path: '/filesystemcupboardUtility',
    element: FileCupboardMaster
  },

  {
    path: '/filesystemcupboardmaster',
    element: FileCupboardMasterMain
  },

  {
    path: '/filemanagementutility',
    element: FileManagementUtility
  },
  {
    path: '/filemanagement',
    element: FileManagemant
  },

  {
    path: '/searchfile',
    element: SearchFile
  },

  {
    path: '/fileshifting',
    element: FileShifting
  },

  //Shetakari Purchase
  {
    path: '/ShetkariSaleBillUtility',
    element: ShetkariSaleBillUtility
  },
  {
    path: '/ShetkariSaleBill',
    element: ShetkariSaleBill
  }
  ,
  {
    path: '/ShetkariPurchaseBillUtility',
    element: ShetkariPurchaseBillUtility
  },

  {
    path: '/shetkaripurchase',
    element: ShetkariPurchase
  }
  ,
  {
    path: '/multipleSBPrint',
    element: MultipleSBReport
  },
  {
    path: '/CA-ledger-report',
    element: GledgerReportForCA
  },
  {
    path: '/Detailed_PurchaseRegister',
    element: PurchaseRegisterTally
  },

  {
    path: '/Detailed_SaleRegister',
    element: SaleRegisterTally
  },

  {
    path: '/top-sellers-purchase-report',
    element: PurchaseTopSellersNew
  },
  {
    path: '/top-sale-buyer-report',
    element: SaleTopBuyersNew
  },
  {
    path: '/Analytics',
    element: Analytics
  },

  {
    path: '/SundryDetailsReport',
    element: SundryDetailsReport
  },
  //End File System Management Routes
  {
    path: '/Proforma-ServiceBill',
    element: ProformaServiceBill
  },
  {
    path: '/Proforma-utility',
    element: ProformaServiceBillUtility
  },

  {
    path: '/funds',
    element: foundManegment
  },
  {
    path: '/fundmanagement',
    element: FundManagementUtility
  },
  {
    path: '/AccountMasterAnalytics',
    element: AccountMasterAnalytics
  },
  {
    path: '/top-buyer-percentage-report',
    element: TopBuyerPercentageReport
  },
  {
    path: '/PartywiseSaleReport',
    element: PartywiseSaleReport
  },
  {
    path: '/rack-rail',
    element: RailwayRack
  },
  {
    path: '/RailwayRack-utility',
    element: RailwayRackUtility
  },

  {
    path: '/CustomerLimit',
    element: CustomerLimit
  },
  {
    path: '/RiskManagement',
    element: RiskManagement
  },
  {
    path: '/ebuysugar',
    element: EBuySugarHub
  },
  {
    path: '/ebuysugar-self-stock',
    element: EbuySugarSelfStock
  },
  {
    path: '/AgingAnalysisBalance-Report',
    element: AgingAnalysisBlanceReport
  },
  {
    path: '/Grade-wise-Summary-report',
    element: GradeWiseSaudaSummary
  },
  {
    path: '/ClosingStock-report',
    element: ClosingStock
  },

  {
    path: '/CarporateSale-utility',
    element: CarporateSaleUtility
  },
  {
    path: '/CarporateSale',
    element: CarporateSale
  },
  {
    path: '/CarporateSaleRegister',
    element: CarporateSaleRegister
  },
  {
    path: '/CarporateSaleBalanceRegister',
    element: CarporateBalanceReport
  },
  {
    path: '/CarporateSaleDetailRegister',
    element: CarporateSaleDetail
  },
  {
    path: '/AgingAnalysisGSTwise',
    element: AgingAnalysisGSTwise
  },
  {
    path: '/DaliySudaDispatch',
    element: DaliySudaDispatch
  },
  {
    path: '/ac-master-declaration',
    element: TDSDeclaration
  },
  {
    path: '/TDS_section',
    element: TDSSectionMaster
  },
  {
    path: '/TDS_section-utility',
    element: TDSsectionUtility
  },

  {
    path: '/google-analytics',
    element: GoogleAnalytics
  },
  {
    path: '/othersale-bill',
    element: OtherSaleBill
  },
  {
    path: '/OtherSaleBill-utility',
    element: OtherSaleBillUtility
  },
  {
    path: '/TrialBalanceDetailsGSTwise-reports',
    element: TrialBalanceDetailReportGSTwise
  },
  {
    path: '/TrialBalanceDetailsPANwise-reports',
    element: TrialBalanceDetailReportPANwise
  },
  {
    path: '/TrialBalanceDetailsPANwise-reports',
    element: TrialBalanceDetailReportPANwise
  },
  {
    path: '/AgingAnalysisPANwise-reports',
    element: AgingAnalysisPANwise
  },
    {
    path: '/employee-management-utility',
    element: EmployeeManagementUtility
  },
  {
    path: '/employee-management',
    element: EmployeeManagement
  },

    {
    path: '/AgingAnalysis-Report-Creditors-GST',
    element: AgingAnalysisReportCreditors_GST
  },
  {
    path: '/AgingAnalysisDebtors_GST-Report',
    element: AgingAnalysisReport_Debtors_GST
  },
  

];

export default routes;
