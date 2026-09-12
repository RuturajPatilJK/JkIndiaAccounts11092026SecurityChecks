# app.py
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from dotenv import load_dotenv
import os
from datetime import timedelta
from flask_jwt_extended import JWTManager, verify_jwt_in_request, get_jwt_identity
from flask_socketio import SocketIO

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)

FRONTEND_ORIGINS = [o.strip() for o in os.getenv('FRONTEND_ORIGINS', 'http://localhost:3000').split(',') if o.strip()]
CORS(app, supports_credentials=True, origins=FRONTEND_ORIGINS)

# Set the database URI using environment variables
app.config['SQLALCHEMY_DATABASE_URI'] = f"mssql+pymssql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}/{os.getenv('DB_NAME')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Configure email settings
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME') 
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD') 
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER') 
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

db = SQLAlchemy(app)

# Initialize JWTManager with your app
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')
app.config['JWT_TOKEN_LOCATION'] = ['headers', 'cookies']
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(minutes=30)
app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=7)
app.config['JWT_COOKIE_SECURE'] = os.getenv('COOKIE_SECURE', 'False') == 'True'
app.config['JWT_COOKIE_SAMESITE'] = 'Lax'
app.config['JWT_COOKIE_CSRF_PROTECT'] = True
app.config['JWT_REFRESH_COOKIE_PATH'] = os.getenv('API_URL', '/api/sugarian') + '/refresh'
jwt = JWTManager(app)


def _auth_error_response(*_args):
    return jsonify({"code": 401, "message": "Not authenticated. Please login."}), 401

jwt.unauthorized_loader(_auth_error_response)   # no/missing token, missing CSRF header
jwt.invalid_token_loader(_auth_error_response)  # malformed/invalid token
jwt.expired_token_loader(_auth_error_response)  # expired token

PUBLIC_ENDPOINTS = {'login', 'refresh', 'logout', 'register_user', 'static'}


@app.before_request
def _enforce_jwt_globally():
    if request.method == 'OPTIONS':
        return  # let CORS preflight through untouched

    if not request.endpoint or request.endpoint in PUBLIC_ENDPOINTS:
        return

    verify_jwt_in_request()
    request.current_user = get_jwt_identity()

# Initialize SocketIO
socketio = SocketIO(app, cors_allowed_origins="*")

# socketio = SocketIO(app, async_mode='eventlet', cors_allowed_origins="*", message_queue="redis://localhost:6379/0")


app.config['UPLOAD_FOLDER'] = os.getenv('UPLOAD_FOLDER')

# Ensure the upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Import controllers and helpers
from app.Controllers.Company.CompanyCreation.CompanyCreation import *
from app.Controllers.LoginAndCompanyList.Login.LoginController import *
from app.Controllers.LoginAndCompanyList.CompanyList.CompanyList import *
from app.Controllers.Company.AccountingYear.AccountingYear import *
from app.Controllers.LoginAndCompanyList.UserLogin.UserLoginController import *
from app.Controllers.Masters.AccountInformation.FinicialMaster.FinicialMastersController import *
from app.Controllers.Masters.OtherMasters.GstStateMasterController import *
from app.Controllers.Masters.AccountInformation.CityMaster.CityMasterController import *
from app.Controllers.Masters.OtherMasters.BrandMasterController import *
from app.Controllers.Masters.OtherMasters.GstRateMasterController import *
from app.Controllers.Transactions.OtherPurchase.OtherPurchaseController import *
from app.Controllers.BusinessRelated.DeliveryOrder.DeliveryOrderController import *
from app.Controllers.Masters.OtherMasters.SysytemMasterController import *
from app.Controllers.BusinessRelated.TenderPurchase.TenderPurchaseController import *

#Sauda Shifting (drag-and-drop move of a sauda entry between tenders)
from app.Controllers.BusinessRelated.SaudaShifting.SaudaShiftingController import *
from app.Controllers.Transactions.DebitCreditNote.DebitCreditNoteController import *
from app.Reports.GLedger.GLedgerController import *
from app.Controllers.Inword.PurchaseBill.PurchaseBillController import *
from app.Controllers.Outword.SaleBill.SaleBillController import *
from app.Controllers.Outword.CommissionBill.CommissionBillController import *
from app.Controllers.Inword.OtherGSTInput.OtherGSTInputController import *
from app.Controllers.Masters.CompanyParameters.CompanyParameterController import *
from app.Controllers.Masters.WhatsAppURL.WhatsAppURLController import *
from app.Controllers.Transactions.PaymentNote.PaymentNoteController import *
from app.Controllers.BusinessRelated.Letter.LetterController import *
from app.Controllers.Outword.UnregisterBill.UnregisterBillController import *
from app.Controllers.Utilities.PostDate.PostDateController import *
from app.Controllers.Masters.AccountInformation.PartyUnitMaster.PartyUnitMasterController import *
from app.Controllers.Utilities.CompanyPrintingInfo.CompanyPrintingInfoController import *
from app.Controllers.Inword.SugarSaleReturnPurchase.SugarSaleReturnPurchaseController import *
from app.Controllers.Outword.SugarSaleReturnSale.SugarSaleReturnSaleController import *
from app.Controllers.Outword.ServiceBill.ServiceBillController import *
from app.Controllers.Transactions.ReceiptPayment.ReceiptPaymentController import *
from app.Controllers.Transactions.UTR.UTREntryController import *
from app.Controllers.BusinessRelated.DeliveryOrder.DeliveryOrderController import *
from app.Controllers.BusinessRelated.PendingDO.PendingDOController import *
from app.Controllers.Utilities.UserCreationWithPermission.UserCreationwithPermissionController import *

from app.Controllers.Inword.ShetkariPurchase.ShetkariPurchaseController import *
from app.Controllers.Outword.ShetkariSaleBill.ShetkariSaleBillController import *

from app.Helpers.AccountMasterHelp import *
from app.Helpers.CityMasterHelp import *
from app.Helpers.GroupMasterHelp import *
from app.Helpers.GstRateMasterHelp import *
from app.Helpers.SystemMasterHelp import *
# from app.Helpers.GstStateMasterHelp import *
from app.Helpers.BrandMasterHelp import *
# from app.Helpers.TenderUtilityHelp import *
from app.Helpers.CarporateHelp import *
from app.Helpers.purcnohelp import *
from app.Helpers.PurcNoFromReturnPurchaseHelp import *
from app.Helpers.PurcNoFromReturnSale import *
from app.Helpers.UTRLotnoHelp import *
from app.Helpers.ProfitLossLotNoHelp import *
from app.Helpers.DebitCreditNoteHelp import *
from app.Helpers.SaudaBookUtilityHelp import *
from app.Helpers.TenderUtilityHelp import *
from app.Helpers.FundAdjustmentHelp import *
from app.Helpers.BrandGrainBalanceHelp import *

#Voucher No Help
from app.Helpers.RecieptVoucherNoHelp import *

#common API Routes
from app.Common.CommonSugarPurchaseStatusCheck import *

# other routes
from app.Controllers.BusinessRelated.CorporateSale.CorporateSaleController import *
from app.Controllers.Masters.AccountInformation.AccountMaster.AccountMasterController import *

#EBuySugar Routes
from app.Controllers.EBuySugarian.EBuySugarUser.EBuySugarUserControllers import *

#Pending Reports Routes
from app.Reports.PendingReports.TenderWiseSauda import *
from app.Reports.PendingReports.UTRDetailReport import *
from app.Reports.TrialBalance.TrialBalanceReport import *
from app.Reports.TrialBalanceScreen.TrailBalanceScreen import *
from app.Reports.PendingReports.UTRReportSummary import *
from app.Reports.PendingReports.MillPaymentSummary import *
from app.Reports.PendingReports.SaudaSummary import *
from app.Reports.PendingReports.NormalSauda import *

#GSTUtilities Reports
from app.Controllers.GSTUtilities.GSTUtilitiesController import *

#Record Locked-Unlock APIS
from app.Common.LockUnlockAPI.LockUnlockAPI import *

#ewayBillGenerationData
from app.Common.EWayBillNEInvoiceGen.EWayBillNEInvoiceGen import *

#EwayBillGeneration
from app.Common.EWayBillNEInvoiceGen.EwaybillGen import *

#Whitebooks/Mastergst GSP proxy (server-side, avoids browser CORS + credential leak)
from app.Common.EWayBillNEInvoiceGen.WhitebooksProxyController import *

#WhatsApp
from app.Common.WhatsApp.WhatsAppController import *

#UserRegistration
from app.Controllers.UserRegistration.UserRegistrationController import *

#GST Rate from CompanyParameters
from app.Common.DefaultGSTRate.DefaultGSTRate import *

#Cash A/C
from app.Common.DefaultCashAc.DefaultCashAc import *

#Stock Balance Report
from app.Controllers.BusinessRelated.StockReport.BalanceStockReport import *

#Profit Loss Report
from app.Controllers.BusinessRelated.StockReport.ProfitNLossReport import *
from app.Reports.TrialBalance.TrialBalanceReport import *

#ProfitLoss Balancesheet
from app.Reports.ProfitLossBalncesheet.ProfitLossReport import *

#Register
from app.Controllers.BusinessRelated.StockReport.Register import *

#Bank Book
from app.Reports.GLedger.BankBook.BankBook import *

# Account Master Print
from app.Reports.GLedger.AccountMasterPrint.AccountMasterPrint import * 

# Interest Statement
from app.Reports.GLedger.InterestStatement.InterestStatement import *

#Report -> StockBook
from app.Reports.StockBook.StockBookReport import *

#EmailController
from app.Common.Email.EmailIntegrationController import *

#GET Particular Acoount Code Gledger Balance
from app.Common.GetAccountBalance.GetAccountbalance import *

#purchase sale register report
from app.Reports.PurchaseSaleRegister.PurchaseSaleRegister import *

#TDS/TCS Balance Check Inward
from app.Common.TDSBalanceCheck.TDSBalanceCheckController import *

#OnlineRailwayRackBuy Module
from app.Controllers.OnlineRailwayRackBuy.RackFromToRailwayStationRate.RackFromToRailwayStationRateController import *
from app.Controllers.OnlineRailwayRackBuy.RackLinkrailwaystation.RackLinkrailwaystationController import *
from app.Controllers.OnlineRailwayRackBuy.RackMillInfo.RackMillInfoController import *
from app.Controllers.OnlineRailwayRackBuy.RackRailwaystationMaster.RackRailwaystationMasterController import *
from app.Controllers.OnlineRailwayRackBuy.Report.RackRailwayMillRateReport.RackRailwayMillRateReport import *

#Helper
from app.Helpers.OnlineRailwayRackBuy.StationMasterHelp import *

#Analytics
from app.Charts.PeriodicallySaleAnalytics.PeriodicSaleAnalytics import *

#Database Backup
from app.Common.DataBaseBackup.DatabaseBackupController import *

from app.Controllers.Utilities.TenderSettlement.TenderSettlement import *

#Company Logs Routes
from app.Controllers.CompanyLogs.CompanyLogs import *


#All Routes
from app.Controllers.EwayBillonlinePortal.eWayBill.EWayBillController import *

#Email Routes
from app.Controllers.EwayBillonlinePortal.EmailIntegration.EmailInterationController import *

#WhatsApp Routes
from app.Controllers.EwayBillonlinePortal.WhatsApp.WhatsAppController import *

#Unlocked Record (Delivery Order,Tender Purchase)
from app.Controllers.Utilities.UnlockedRecord.UnlockedController import *

from app.Helpers.SalePurchaseTDSSectionhelper import *
from app.Helpers.DoUTRNoHelp import *

from app.Controllers.Transactions.SalePurchaseTDS.SalePurchaseTDSController import *

#Broadcast Messages
from app.Controllers.BusinessRelated.BroadCast.BroadCastController import *

#Genrate Salary
from app.Controllers.Outword.GenrateSalary.genrateSalaryController import *
from app.Controllers.Outword.ProformaServiceBill.ProformaServiceBillController import *
from app.Helpers.ProformaServiceBillHelp import *

#Fund Management
from app.Controllers.Utilities.Fundmanegment.fundmanegmentController import *


#Bank API Integration
from app.Controllers.AxisBankApiIntegration.AxisBankApiIntegration import *
from app.Controllers.AxisBankApiIntegration.AxisBankTransferApiIntegration import *

from app.utils.PostDateScript import *


#Exceptional Reports
from app.Controllers.ExceptionalReports.purchasetopSellers import *
from app.Controllers.ExceptionalReports.SaletopBuyer import *
from app.Helpers.selectTenderNo import *



#Railway Rack
from app.Controllers.RailwayRackBuy.RailwayRackMaster.RailwayRackMasterController import *


#EbuySugarAdditionalLimit
from app.Controllers.Masters.EbuySugarAdditionalLimit.EbuySugarAdditionalLimit_controller import *

#Closing Stock Reports
from app.Controllers.ClosingStock.ClosingStockController import *

from app.Helpers.CarporateHelp import *

from app.Controllers.Masters.AccountInformation.TdsDeclaration_controller import *

from app.Controllers.Masters.OtherMasters.TDS_sectionMasterController import *

# Google Analytics GA4 Integration
from app.Controllers.GoogleAnalytics.GoogleAnalyticsController import *

#Other Sale Bill
from app.Controllers.Outword.OtherSaleBill.OtherSaleBillController import *

#DSC Digital Signature - Customized Sale Bill Print
from app.Common.DSCSign.DSCSignController import *

#JK Group File Management System - Cupboard Master + File Information
from app.Controllers.CupboardMaster.CupboardMasterController import *
from app.Controllers.FileInformation.FileInformationController import *

from app.Controllers.Masters.AccountInformation.EmployeeManagement import * 


upload_folder = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')

# Ensure the upload folder exists
if not os.path.exists(upload_folder):
    os.makedirs(upload_folder)


if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=8080, debug=True)
