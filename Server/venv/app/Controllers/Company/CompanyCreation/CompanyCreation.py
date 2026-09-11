# project_folder/app/routes/tender_routes.py
from base64 import b64encode
from flask import jsonify, request
import werkzeug
from app import app, db
from app.models.Company.CompanyCreation.CompanyCreationModels import CompanyCreation
from app.models.Company.CompanyCreation.CompanyCreationSchemas import CompanyCreationSchema
from app.models.Masters.AccountInformation.FinicialMasterModels import GroupMaster
from app.models.Masters.OtherMasters.GSTRateMasterModels import GSTRateMaster
from app.models.Masters.OtherMasters.GstStateMaster import GSTStateMaster
from app.models.Masters.AccountInformation.AccountMaster.AccountMasterModel import AccountMaster
from app.models.Masters.AccountInformation.CityMasterModels import CityMaster
from app.models.Masters.CompanyParameters.CompanyParameterModels import CompanyParameters
from app.models.Utilities.UserCreationWithPermission.UserCreationWithPermissionModel import TblUser, TblUserDetail
from app.models.Masters.OtherMasters.SystemMasterModels import SystemMaster
from sqlalchemy.exc import SQLAlchemyError 
from sqlalchemy import text
from sqlalchemy import func
from sqlalchemy.orm.exc import StaleDataError
from werkzeug.utils import secure_filename
from datetime import datetime
from werkzeug.security import generate_password_hash


import os
API_URL= os.getenv('API_URL')

# Initialize schema
company_schema = CompanyCreationSchema()


def serialize_company(company):
    """ Helper function to serialize company data including binary fields. """
    result = {key: getattr(company, key) for key in company.__table__.columns.keys() if not key.startswith('_')}
    if company.Logo:
        result['Logo'] = b64encode(company.Logo).decode('utf-8')
    else:
        result['Logo'] = None
    if company.Signature:
        result['Signature'] = b64encode(company.Signature).decode('utf-8')
    else:
        result['Signature'] = None
    return result

default_permissions = [
    {'Program_Name': '/user-permission-utility'},
    {'Program_Name': '/create-utility'},
    {'Program_Name': '/AccountMaster-utility'},
    {'Program_Name': '/financial-groups-utility'},
    {'Program_Name': '/city-master-utility'},
    {'Program_Name': '/syetem-masterutility'},
    {'Program_Name': '/brand-master-utility'},
    {'Program_Name': '/gst-rate-masterutility'},
    {'Program_Name': '/gst-state-master-utility'},
    {'Program_Name': '/eway-bill-setting'},
    {'Program_Name': '/company-parameter'},
    {'Program_Name': '/whatsapp-api'},
    {'Program_Name': '/OtherGSTInput-utility'},
    {'Program_Name': '/sugar-sale-return-purchase-utility'},
    {'Program_Name': '/sugarpurchasebill-utility'},
    {'Program_Name': '/JournalVoucher_Utility'},
    {'Program_Name': '/utrentry-Utility'},
    {'Program_Name': '/debitcreditnote-utility'},
    {'Program_Name': '/other-purchaseutility'},
    {'Program_Name': '/PaymentNote-utility'},
    {'Program_Name': '/tender-purchaseutility'},
    {'Program_Name': '/delivery-order-utility'},
    {'Program_Name': '/sauda-book-utility'},
    {'Program_Name': '/letter'},
    {'Program_Name': '/CommissionBill-utility'},
    {'Program_Name': '/sugar-sale-return-sale-utility'},
    {'Program_Name': '/ServiceBill-utility'},
    {'Program_Name': '/ledger'},
    {'Program_Name': '/SaleBill-utility'},
    {'Program_Name':'/OtherGSTInput-utility'},
    {'Program_Name':'/city-master-utility'},
   
]


DEFAULT_GROUPS = [
    {'group_Code': 1, 'group_Name_E': 'Bank A/C', 'group_Type': 'B', 'group_Order': 1},
    {'group_Code': 2, 'group_Name_E': 'Bank OCC A/C', 'group_Type': 'B', 'group_Order': 1},
    {'group_Code': 3, 'group_Name_E': 'Bank OD A/C', 'group_Type': 'B', 'group_Order': 2},
    {'group_Code': 4, 'group_Name_E': 'Capital Account', 'group_Type': 'B', 'group_Order': 1},
    {'group_Code': 5, 'group_Name_E': 'Cash-In-Hand', 'group_Type': 'B', 'group_Order': 2},
    {'group_Code': 6, 'group_Name_E': 'Current Assets', 'group_Type': 'B', 'group_Order': 1},
    {'group_Code': 7, 'group_Name_E': 'Current Liabilities', 'group_Type': 'B', 'group_Order': 1},
    {'group_Code': 8, 'group_Name_E': 'Deposits (Asset)', 'group_Type': 'B', 'group_Order': 4},
    {'group_Code': 9, 'group_Name_E': 'Direct Expenses', 'group_Type': 'T', 'group_Order': 2},
    {'group_Code': 10, 'group_Name_E': 'Direct Incomes', 'group_Type': 'T', 'group_Order': 2},
    {'group_Code': 11, 'group_Name_E': 'Duties & Taxes', 'group_Type': 'B', 'group_Order': 4},
    {'group_Code': 12, 'group_Name_E': 'Expenses (Direct)', 'group_Type': 'T', 'group_Order': 3},
    {'group_Code': 13, 'group_Name_E': 'Expenses (Indirect)', 'group_Type': 'P', 'group_Order': 2},
    {'group_Code': 14, 'group_Name_E': 'Fixed Assets', 'group_Type': 'B', 'group_Order': 1},
    {'group_Code': 15, 'group_Name_E': 'Income (Direct)', 'group_Type': 'T', 'group_Order': 3},
    {'group_Code': 16, 'group_Name_E': 'Income (Indirect)', 'group_Type': 'P', 'group_Order': 3},
    {'group_Code': 17, 'group_Name_E': 'Indirect Expenses', 'group_Type': 'P', 'group_Order': 2},
    {'group_Code': 18, 'group_Name_E': 'Indirect Incomes', 'group_Type': 'P', 'group_Order': 3},
    {'group_Code': 19, 'group_Name_E': 'Investments', 'group_Type': 'B', 'group_Order': 4},
    {'group_Code': 20, 'group_Name_E': 'Loans & Advances (Assets)', 'group_Type': 'B', 'group_Order': 5},
    {'group_Code': 21, 'group_Name_E': 'Loans (Liability)', 'group_Type': 'B', 'group_Order': 3},
    {'group_Code': 22, 'group_Name_E': 'Misc. Expenses (Assets)', 'group_Type': 'P', 'group_Order': 4},
    {'group_Code': 23, 'group_Name_E': 'Provisions', 'group_Type': 'B', 'group_Order': 6},
    {'group_Code': 24, 'group_Name_E': 'Purchase Accounts', 'group_Type': 'T', 'group_Order': 1},
    {'group_Code': 25, 'group_Name_E': 'Reserves & Surplus', 'group_Type': 'B', 'group_Order': 1},
    {'group_Code': 26, 'group_Name_E': 'Retained Earnings', 'group_Type': 'P', 'group_Order': 4},
    {'group_Code': 27, 'group_Name_E': 'Sales Accounts', 'group_Type': 'T', 'group_Order': 1},
    {'group_Code': 28, 'group_Name_E': 'Secured Loans', 'group_Type': 'B', 'group_Order': 2},
    {'group_Code': 29, 'group_Name_E': 'Stock-In-Hand', 'group_Type': 'B', 'group_Order': 8},
    {'group_Code': 30, 'group_Name_E': 'Sundry Creditors', 'group_Type': 'B', 'group_Order': 4},
    {'group_Code': 31, 'group_Name_E': 'Sundry Debtors', 'group_Type': 'B', 'group_Order': 5},
    {'group_Code': 32, 'group_Name_E': 'Suspense A/C', 'group_Type': 'B', 'group_Order': 9},
    {'group_Code': 33, 'group_Name_E': 'Unsecured Loans', 'group_Type': 'B', 'group_Order': 4},
]

DEFAULT_STATES = [
    {'State_Name': "Jammu and Kashmir"},
    {'State_Name': "Himachal Pradesh"},
    {'State_Name': "Punjab"},
    {'State_Name': "Chandigarh"},
    {'State_Name': "Uttarakhand"},
    { 'State_Name': "Haryana"},
    { 'State_Name': "Delhi"},
    {'State_Name': "Rajasthan"},
    {'State_Name': "Uttar Pradesh"},
    {'State_Name': "Bihar"},
    {'State_Name': "Sikkim"},
    {'State_Name': "Arunachal Pradesh"},
    {'State_Name': "Nagaland"},
    {'State_Name': "Manipur"},
    {'State_Name': "Mizoram"},
    {'State_Name': "Tripura"},
    { 'State_Name': "Meghalaya"},
    {'State_Name': "Assam"},
    { 'State_Name': "West Bengal"},
    {'State_Name': "Jharkhand"},
    { 'State_Name': "Odisha"},
    {'State_Name': "Chhattisgarh"},
    { 'State_Name': "Madhya Pradesh"},
    { 'State_Name': "Gujarat"},
    {'State_Name': "Daman and Diu"},
    {'State_Name': "Dadra and Nagar Haveli"},
    { 'State_Name': "Maharashtra"},
    {'State_Name': "Karnataka"},
    {'State_Name': "Goa"},
    {'State_Name': "Lakshadweep"},
    {'State_Name': "Kerala"},
    {'State_Name': "Tamil Nadu"},
    {'State_Name': "Puducherry"},
    {'State_Name': "Andaman and Nicobar Islands"},
    {'State_Name': "Telangana"},
    {'State_Name': "Andhra Pradesh"}
]


DEFAULT_GST_RATES = [
    {'Doc_no': 1,'GST_Name': 'GST 5%', 'Rate': 5.00, 'IGST': 5.00, 'SGST': 2.50, 'CGST': 2.50},
    {'Doc_no': 2,'GST_Name': 'GST 18%', 'Rate': 18.00, 'IGST': 18.00, 'SGST': 9.00, 'CGST': 9.00},
    {'Doc_no': 3,'GST_Name': 'GST 12%', 'Rate': 12.00, 'IGST': 12.00, 'SGST': 6.00, 'CGST': 6.00},
    {'Doc_no': 4,'GST_Name': 'Zero GST', 'Rate': 0.00, 'IGST': 0.00, 'SGST': 0.00, 'CGST': 0.00},
    {'Doc_no': 5,'GST_Name': 'GST 28%', 'Rate': 28.00, 'IGST': 28.00, 'SGST': 14.00, 'CGST': 14.00},
    {'Doc_no': 6,'GST_Name': 'OGL Exports', 'Rate': 0.10, 'IGST': 0.10, 'SGST': 0.05, 'CGST': 0.05}
]


DEFAULT_ACCOUNTS = [
    {'Ac_Code': 1, 'Ac_Name': 'Cash', 'Ac_Type': 'C', 'Group_Code': 5},  
    {'Ac_Code': 2, 'Ac_Name': 'Self', 'Ac_Type': 'E', 'Group_Code': 5}, 
    {'Ac_Code': 3, 'Ac_Name': 'CompanyNameA/C', 'Ac_Type': 'P', 'Address_E': '','Group_Code': 31},  
    {'Ac_Code': 4, 'Ac_Name': 'Commission A/C', 'Ac_Type': 'E', 'Group_Code': 18},  
    {'Ac_Code': 5, 'Ac_Name': 'Interest A/C', 'Ac_Type': 'EX', 'Group_Code': 18},  
    {'Ac_Code': 6, 'Ac_Name': 'Transportation Charge A/C', 'Ac_Type': 'E', 'Group_Code': 12}, 
    {'Ac_Code': 7, 'Ac_Name': 'Postage A/C', 'Ac_Type': 'E', 'Group_Code': 12}, 
    {'Ac_Code': 8, 'Ac_Name': 'Sale CGST A/C', 'Ac_Type': 'OP', 'Group_Code': 23},  
    {'Ac_Code': 9, 'Ac_Name': 'Sale SGST A/C', 'Ac_Type': 'OP', 'Group_Code': 23},  
    {'Ac_Code': 10, 'Ac_Name': 'Sale IGST A/C', 'Ac_Type': 'OP', 'Group_Code': 23},  
    {'Ac_Code': 11, 'Ac_Name': 'Purchase CGST A/C', 'Ac_Type': 'OP', 'Group_Code': 23},  
    {'Ac_Code': 12, 'Ac_Name': 'Purchase SGST A/C', 'Ac_Type': 'OP', 'Group_Code': 23}, 
    {'Ac_Code': 13, 'Ac_Name': 'Purchase IGST A/C', 'Ac_Type': 'OP', 'Group_Code': 23},  
    {'Ac_Code': 14, 'Ac_Name': 'CGST RCM A/C', 'Ac_Type': 'OP', 'Group_Code': 23},  
    {'Ac_Code': 15, 'Ac_Name': 'SGST RCM A/C', 'Ac_Type': 'OP', 'Group_Code': 23},  
    {'Ac_Code': 16, 'Ac_Name': 'IGST RCM A/C', 'Ac_Type': 'OP', 'Group_Code': 23},  
    {'Ac_Code': 17, 'Ac_Name': 'Round Off', 'Ac_Type': 'E', 'Group_Code': 12},  
    {'Ac_Code': 18, 'Ac_Name': 'Freight A/C', 'Ac_Type': 'E', 'Group_Code': 12},  
    {'Ac_Code': 19, 'Ac_Name': 'Purchase TCS A/C', 'Ac_Type': 'OP', 'Group_Code': 23}, 
    {'Ac_Code': 20, 'Ac_Name': 'Sale TCS A/C', 'Ac_Type': 'OP', 'Group_Code': 23},  
    {'Ac_Code': 21, 'Ac_Name': 'Other A/C', 'Ac_Type': 'E', 'Group_Code': 12},  
    {'Ac_Code': 22, 'Ac_Name': 'Super Cost A/C', 'Ac_Type': 'OP', 'Group_Code': 23},  
    {'Ac_Code': 23, 'Ac_Name': 'Packing A/C', 'Ac_Type': 'E', 'Group_Code': 12},  
    {'Ac_Code': 24, 'Ac_Name': 'Hamali A/C', 'Ac_Type': 'OP', 'Group_Code': 23},  
    {'Ac_Code': 25, 'Ac_Name': 'Transport TDS A/C', 'Ac_Type': 'OP', 'Group_Code': 23},  
    {'Ac_Code': 26, 'Ac_Name': 'Transport TDS Cut By Us', 'Ac_Type': 'OP', 'Group_Code': 23},  
    {'Ac_Code': 27, 'Ac_Name': 'Purchase TDS A/C', 'Ac_Type': 'OP', 'Group_Code': 23},  
    {'Ac_Code': 28, 'Ac_Name': 'Sale TDS A/C', 'Ac_Type': 'OP', 'Group_Code': 23},  
    {'Ac_Code': 29, 'Ac_Name': 'Rate Diff A/C', 'Ac_Type': 'EX', 'Group_Code': 18},  
    {'Ac_Code': 30, 'Ac_Name': 'Depreciation A/C', 'Ac_Type': 'E', 'Group_Code': 12}, 
    {'Ac_Code': 31, 'Ac_Name': 'Interest TDS A/C', 'Ac_Type': 'OP', 'Group_Code': 23},  
    {'Ac_Code': 32, 'Ac_Name': 'Sugar Sale A/C', 'Ac_Type': 'E', 'Group_Code': 27}, 
    {'Ac_Code': 33, 'Ac_Name': 'Sugar Purchase A/C', 'Ac_Type': 'E', 'Group_Code': 24}, 
]


DEFAULT_SYSTEMS = [
    {"System_Type": "G", "System_Code": 1, "System_Name_E": "RAJASTHAN TRANSPORT", "System_Name_R": None, "System_Rate": 0.00,
     "Purchase_AC": 0, "Sale_AC": 0, "Vat_AC": 0, "Opening_Bal": 0.00, "KgPerKatta": 50.00, "minRate": None, "maxRate": None,
    "Year_Code": 1, "Branch_Code": 11, "Created_By": "amit", "Modified_By": "amit", "HSN": None,
     "systemid": 1, "Opening_Value": 0.00, "Gst_Code": 1, "MarkaSet": "N", "Supercost": "N", "Packing": "N", "LodingGst": "N",
     "MarkaPerc": 0.00, "SuperPerc": 0.00, "RatePer": None, "IsService": "N", "Width": None, "LENGTH": None, "levi": None,
     "Oldcompname": None, "Insurance": None, "weight": None, "gstratecode": None, "category": None},
    {"System_Type": "G", "System_Code": 2, "System_Name_E": "ALL MILL", "System_Name_R": None, "System_Rate": 0.00,
     "Purchase_AC": 0, "Sale_AC": 0, "Vat_AC": 0, "Opening_Bal": 0.00, "KgPerKatta": 50.00, "minRate": None, "maxRate": None,
     "Year_Code": 1, "Branch_Code": 11, "Created_By": "amit", "Modified_By": None, "HSN": None,
     "systemid": 2, "Opening_Value": 0.00, "Gst_Code": 1, "MarkaSet": "N", "Supercost": "N", "Packing": "N", "LodingGst": "N",
     "MarkaPerc": 0.00, "SuperPerc": 0.00, "RatePer": None, "IsService": "N", "Width": None, "LENGTH": None, "levi": None,
     "Oldcompname": None, "Insurance": None, "weight": None, "gstratecode": None, "category": None},
    {"System_Type": "G", "System_Code": 3, "System_Name_E": "ALL CUSTOMER", "System_Name_R": None, "System_Rate": 0.00,
     "Purchase_AC": 0, "Sale_AC": 0, "Vat_AC": 0, "Opening_Bal": 0.00, "KgPerKatta": 50.00, "minRate": None, "maxRate": None,
     "Year_Code": 1, "Branch_Code": 11, "Created_By": "amit", "Modified_By": None, "HSN": None,
     "systemid": 3, "Opening_Value": 0.00, "Gst_Code": 1, "MarkaSet": "N", "Supercost": "N", "Packing": "N", "LodingGst": "N",
     "MarkaPerc": 0.00, "SuperPerc": 0.00, "RatePer": None, "IsService": "N", "Width": None, "LENGTH": None, "levi": None,
     "Oldcompname": None, "Insurance": None, "weight": None, "gstratecode": None, "category": None},
    {"System_Type": "I", "System_Code": 1, "System_Name_E": "SUGAR 50 KG", "System_Name_R": None, "System_Rate": 0.00,
     "Purchase_AC": 20104, "Sale_AC": 20105, "Vat_AC": 0, "Opening_Bal": 0.00, "KgPerKatta": 50.00, "minRate": 3100.00,
     "maxRate": 4500.00, "Year_Code": 1, "Branch_Code": 10, "Created_By": "ankush", "Modified_By": "amitjain",
     "HSN": "17011490", "systemid": 8, "Opening_Value": 0.00, "Gst_Code": 1, "MarkaSet": "N", "Supercost": "N",
     "Packing": "N", "LodingGst": "Y", "MarkaPerc": 0.00, "SuperPerc": 0.00, "RatePer": "K", "IsService": "Y",
     "Width": 0.00, "LENGTH": 0.00, "levi": 0, "Oldcompname": None, "Insurance": None, "weight": None, "gstratecode": None,
     "category": None},
    {"System_Type": "I", "System_Code": 2, "System_Name_E": "SUGAR 25KG", "System_Name_R": None, "System_Rate": 0.00,
     "Purchase_AC": 20104, "Sale_AC": 20105, "Vat_AC": 0, "Opening_Bal": 0.00, "KgPerKatta": 25.00, "minRate": 1000.00,
     "maxRate": 4000.00, "Year_Code": 1, "Branch_Code": 11, "Created_By": "ankush", "Modified_By": "amitjain",
     "HSN": "17011490", "systemid": 9, "Opening_Value": 0.00, "Gst_Code": 1, "MarkaSet": "N", "Supercost": "N",
     "Packing": "N", "LodingGst": "Y", "MarkaPerc": 0.00, "SuperPerc": 0.00, "RatePer": "K", "IsService": "Y",
     "Width": 0.00, "LENGTH": 0.00, "levi": 0, "Oldcompname": None, "Insurance": None, "weight": None, "gstratecode": None,
     "category": None},
    {"System_Type": "I", "System_Code": 3, "System_Name_E": "RENT", "System_Name_R": None, "System_Rate": 0.00,
     "Purchase_AC": 84448, "Sale_AC": 84448, "Vat_AC": 0, "Opening_Bal": 0.00, "KgPerKatta": 50.00, "minRate": 1.00,
     "maxRate": 1000000.00, "Year_Code": 1, "Branch_Code": 11, "Created_By": "sagar", "Modified_By": "demo",
     "HSN": "997212", "systemid": 10, "Opening_Value": 0.00, "Gst_Code": 3, "MarkaSet": "N", "Supercost": "N",
     "Packing": "N", "LodingGst": "N", "MarkaPerc": 0.00, "SuperPerc": 0.00, "RatePer": "Q", "IsService": "Y",
     "Width": 0.00, "LENGTH": 0.00, "levi": 0, "Oldcompname": None, "Insurance": None, "weight": None, "gstratecode": None,
     "category": None},
    {"System_Type": "I", "System_Code": 4, "System_Name_E": "INTEREST", "System_Name_R": None, "System_Rate": 0.00,
     "Purchase_AC": 30110, "Sale_AC": 84151, "Vat_AC": 84151, "Opening_Bal": 0.00, "KgPerKatta": 50.00, "minRate": None,
     "maxRate": None, "Year_Code": 1, "Branch_Code": 11, "Created_By": "amit89", "Modified_By": None,
     "HSN": None, "systemid": 11, "Opening_Value": 0.00, "Gst_Code": 1, "MarkaSet": "N", "Supercost": "N",
     "Packing": "N", "LodingGst": "N", "MarkaPerc": 0.00, "SuperPerc": 0.00, "RatePer": None, "IsService": "N",
     "Width": 0.00, "LENGTH": 0.00, "levi": 0, "Oldcompname": None, "Insurance": None, "weight": None, "gstratecode": None,
     "category": None},
    {"System_Type": "N", "System_Code": 1, "System_Name_E": "CHEQE NO.", "System_Name_R": None, "System_Rate": 0.00,
      "Vat_AC": 0, "Opening_Bal": 0.00, "KgPerKatta": 50.00, "minRate": None, "maxRate": None,
    "Year_Code": 1, "Branch_Code": 11, "Created_By": "amit", "Modified_By": None, "HSN": None,
     "systemid": 18, "Opening_Value": 0.00, "Gst_Code": 1, "MarkaSet": "N", "Supercost": "N", "Packing": "N", "LodingGst": "N",
     "MarkaPerc": 0.00, "SuperPerc": 0.00, "RatePer": None, "IsService": "N", "Width": 0.00, "LENGTH": 0.00, "levi": None,
     "Oldcompname": None, "Insurance": None, "weight": None, "gstratecode": None, "category": None},
    {"System_Type": "S", "System_Code": 1, "System_Name_E": "ORD S/30 (S2)", "System_Name_R": None, "System_Rate": 0.00,
     "Vat_AC": 0, "Opening_Bal": 0.00, "KgPerKatta": 50.00, "minRate": None, "maxRate": None,
     "Year_Code": 1, "Branch_Code": 11, "Created_By": "amit", "Modified_By": "amit89", "HSN": None,
     "systemid": 23, "Opening_Value": 0.00, "Gst_Code": 1, "MarkaSet": "N", "Supercost": "N", "Packing": "N", "LodingGst": "N",
     "MarkaPerc": 0.00, "SuperPerc": 0.00, "RatePer": None, "IsService": "N", "Width": 0.00, "LENGTH": 0.00, "levi": None,
     "Oldcompname": None, "Insurance": None, "weight": None, "gstratecode": None, "category": None},
    {"System_Type": "I", "System_Code": 5, "System_Name_E": "SUGAR RATE DIFF A/C", "System_Name_R": None, "System_Rate": 0.00,
     "Purchase_AC": 30106, "Sale_AC": 30106, "Vat_AC": 0, "Opening_Bal": 0.00, "KgPerKatta": 50.00, "minRate": 1.00,
     "maxRate": 10000000.00, "Year_Code": 1, "Branch_Code": 11, "Created_By": "amit89", "Modified_By": "amitjain",
     "HSN": "17011490", "systemid": 12, "Opening_Value": 0.00, "Gst_Code": 1, "MarkaSet": "N", "Supercost": "N", "Packing": "N",
     "LodingGst": "N", "MarkaPerc": 0.00, "SuperPerc": 0.00, "RatePer": "Q", "IsService": "N", "Width": None, "LENGTH": None,
     "levi": None, "Oldcompname": None, "Insurance": None, "weight": None, "gstratecode": None, "category": None},
    {"System_Type": "I", "System_Code": 6, "System_Name_E": "OH SUGAR 20 KG", "System_Name_R": None, "System_Rate": 0.00,
     "Purchase_AC": 20104, "Sale_AC": 20105, "Vat_AC": 0, "Opening_Bal": 0.00, "KgPerKatta": 20.00, "minRate": 6300.00,
     "maxRate": 8500.00, "Year_Code": 1, "Branch_Code": 11, "Created_By": "amit89", "Modified_By": "amitjain",
     "HSN": "17011490", "systemid": 13, "Opening_Value": 0.00, "Gst_Code": 1, "MarkaSet": "N", "Supercost": "N", "Packing": "N",
     "LodingGst": "Y", "MarkaPerc": 0.00, "SuperPerc": 0.00, "RatePer": "K", "IsService": "Y", "Width": None, "LENGTH": None,
     "levi": None, "Oldcompname": None, "Insurance": None, "weight": None, "gstratecode": None, "category": None},
    {"System_Type": "I", "System_Code": 7, "System_Name_E": "MISHRI SUGAR 10 KG", "System_Name_R": None, "System_Rate": 0.00,
     "Purchase_AC": 20104, "Sale_AC": 20105, "Vat_AC": 0, "Opening_Bal": 0.00, "KgPerKatta": 10.00, "minRate": 5000.00,
     "maxRate": 7000.00,"Year_Code": 1, "Branch_Code": 11, "Created_By": "amit89", "Modified_By": "amitjain",
     "HSN": "17011490", "systemid": 14, "Opening_Value": 0.00, "Gst_Code": 1, "MarkaSet": "N", "Supercost": "N", "Packing": "N",
     "LodingGst": "Y", "MarkaPerc": 0.00, "SuperPerc": 0.00, "RatePer": "K", "IsService": "Y", "Width": None, "LENGTH": None,
     "levi": None, "Oldcompname": None, "Insurance": None, "weight": None, "gstratecode": None, "category": None},
     {"System_Type": "N", "System_Code": 1, "System_Name_E": "CHEQUE NO.","Year_Code": 1, "Created_By": "system"},
    {"System_Type": "N", "System_Code": 2, "System_Name_E": "UTR NO",  "Year_Code": 1, "Created_By": "system"},
    {"System_Type": "N", "System_Code": 3, "System_Name_E": "BY TRANSFER", "Year_Code": 1, "Created_By": "system"},
    {"System_Type": "N", "System_Code": 4, "System_Name_E": "PLEASE DEBIT THE SAME AMOUNT IN PARTY A/C", "Year_Code": 1, "Created_By": "system"},
    {"System_Type": "N", "System_Code": 5, "System_Name_E": "PAYMENT DEBIT FROM PARTY ACCOUNT", "Year_Code": 1, "Created_By": "system"},

    # Stock Systems (S)
    {"System_Type": "S", "System_Code": 1, "System_Name_E": "ORD S/30 (S2)","Year_Code": 1, "Created_By": "system"},
    {"System_Type": "S", "System_Code": 2, "System_Name_E": "SUPER S/30 (S1)","Year_Code": 1, "Created_By": "system"},
    {"System_Type": "S", "System_Code": 3, "System_Name_E": "M/30", "Year_Code": 1, "Created_By": "system", "HSN": "1701490"},
    {"System_Type": "S", "System_Code": 4, "System_Name_E": "L/30","Year_Code": 1, "Created_By": "system"},

     {
        "System_Type": "Z", "System_Code": 1, "System_Name_E": "2023-24", "System_Name_R": None, "System_Rate": None,
        "Purchase_AC": None, "Sale_AC": None, "Vat_AC": None, "Opening_Bal": None, "KgPerKatta": None,
        "minRate": None, "maxRate": None,  "Year_Code": 1, "Branch_Code": None,
        "Created_By": None, "Modified_By": None, "HSN": None, "systemid": 35, "Opening_Value": None,
        "Gst_Code": 0, "MarkaSet": None, "Supercost": None, "Packing": None, "LodingGst": None,
        "MarkaPerc": None, "SuperPerc": None, "RatePer": None, "IsService": None, "Width": None,
        "LENGTH": None, "levi": None, "Oldcompname": None, "Insurance": None, "weight": None,
        "gstratecode": None, "category": None
    },
    {
        "System_Type": "Z", "System_Code": 2, "System_Name_E": "2024-25", "System_Name_R": None, "System_Rate": None,
        "Purchase_AC": None, "Sale_AC": None, "Vat_AC": None, "Opening_Bal": None, "KgPerKatta": None,
        "minRate": None, "maxRate": None, "Year_Code": 1, "Branch_Code": None,
        "Created_By": None, "Modified_By": None, "HSN": None, "systemid": 36, "Opening_Value": None,
        "Gst_Code": 0, "MarkaSet": None, "Supercost": None, "Packing": None, "LodingGst": None,
        "MarkaPerc": None, "SuperPerc": None, "RatePer": None, "IsService": None, "Width": None,
        "LENGTH": None, "levi": None, "Oldcompname": None, "Insurance": None, "weight": None,
        "gstratecode": None, "category": None
    },
     {"System_Type": "U", "System_Code": 1, "System_Name_E": "Bag", "Company_Code": 1, "Year_Code": 3, "systemid": 37},
    {"System_Type": "U", "System_Code": 2, "System_Name_E": "Bundles", "Company_Code": 1, "Year_Code": 3, "systemid": 38},
    {"System_Type": "U", "System_Code": 3, "System_Name_E": "Bale", "Company_Code": 1, "Year_Code": 3, "systemid": 39},
    {"System_Type": "U", "System_Code": 4, "System_Name_E": "Buckles", "Company_Code": 1, "Year_Code": 3, "systemid": 40},
    {"System_Type": "U", "System_Code": 5, "System_Name_E": "Billions Of Units", "Company_Code": 1, "Year_Code": 3, "systemid": 41},
    {"System_Type": "U", "System_Code": 6, "System_Name_E": "Box", "Company_Code": 1, "Year_Code": 3, "systemid": 42},
    {"System_Type": "U", "System_Code": 7, "System_Name_E": "Bottles", "Company_Code": 1, "Year_Code": 3, "systemid": 43},
    {"System_Type": "U", "System_Code": 8, "System_Name_E": "Bunches", "Company_Code": 1, "Year_Code": 3, "systemid": 44},
    {"System_Type": "U", "System_Code": 9, "System_Name_E": "Cans", "Company_Code": 1, "Year_Code": 3, "systemid": 45},
    {"System_Type": "U", "System_Code": 10, "System_Name_E": "Cartons", "Company_Code": 1, "Year_Code": 3, "systemid": 46},
    {"System_Type": "U", "System_Code": 11, "System_Name_E": "Dozen", "Company_Code": 1, "Year_Code": 3, "systemid": 47},
    {"System_Type": "U", "System_Code": 12, "System_Name_E": "Drum", "Company_Code": 1, "Year_Code": 3, "systemid": 48},
    {"System_Type": "U", "System_Code": 13, "System_Name_E": "Great Gross", "Company_Code": 1, "Year_Code": 3, "systemid": 49},
    {"System_Type": "U", "System_Code": 14, "System_Name_E": "Gross", "Company_Code": 1, "Year_Code": 3, "systemid": 50},
    {"System_Type": "U", "System_Code": 15, "System_Name_E": "Numbers", "Company_Code": 1, "Year_Code": 3, "systemid": 51},
    {"System_Type": "U", "System_Code": 16, "System_Name_E": "Packs", "Company_Code": 1, "Year_Code": 3, "systemid": 52},
    {"System_Type": "U", "System_Code": 17, "System_Name_E": "Pieces", "Company_Code": 1, "Year_Code": 3, "systemid": 53},
    {"System_Type": "U", "System_Code": 18, "System_Name_E": "Pairs", "Company_Code": 1, "Year_Code": 3, "systemid": 54},
    {"System_Type": "U", "System_Code": 19, "System_Name_E": "Rolls", "Company_Code": 1, "Year_Code": 3, "systemid": 55},
    {"System_Type": "U", "System_Code": 20, "System_Name_E": "Sets", "Company_Code": 1, "Year_Code": 3, "systemid": 56},
    {"System_Type": "U", "System_Code": 21, "System_Name_E": "Tablets", "Company_Code": 1, "Year_Code": 3, "systemid": 57},
    {"System_Type": "U", "System_Code": 22, "System_Name_E": "Ten Gross", "Company_Code": 1, "Year_Code": 3, "systemid": 58},
    {"System_Type": "U", "System_Code": 23, "System_Name_E": "Thousands", "Company_Code": 1, "Year_Code": 3, "systemid": 59},
    {"System_Type": "U", "System_Code": 24, "System_Name_E": "Tubes", "Company_Code": 1, "Year_Code": 3, "systemid": 60},
    {"System_Type": "U", "System_Code": 25, "System_Name_E": "Units", "Company_Code": 1, "Year_Code": 3, "systemid": 61},
    {"System_Type": "U", "System_Code": 26, "System_Name_E": "Cubic Meter", "Company_Code": 1, "Year_Code": 3, "systemid": 62},
    {"System_Type": "U", "System_Code": 27, "System_Name_E": "Cubic Centimeter", "Company_Code": 1, "Year_Code": 3, "systemid": 63},
    {"System_Type": "U", "System_Code": 28, "System_Name_E": "Kilo Liter", "Company_Code": 1, "Year_Code": 3, "systemid": 64},
    {"System_Type": "U", "System_Code": 29, "System_Name_E": "Milliliter", "Company_Code": 1, "Year_Code": 3, "systemid": 65},
    {"System_Type": "U", "System_Code": 30, "System_Name_E": "US Gallons", "Company_Code": 1, "Year_Code": 3, "systemid": 66},
    {"System_Type": "U", "System_Code": 31, "System_Name_E": "Square Feet", "Company_Code": 1, "Year_Code": 3, "systemid": 67},
    {"System_Type": "U", "System_Code": 32, "System_Name_E": "Square Meters", "Company_Code": 1, "Year_Code": 3, "systemid": 68},
    {"System_Type": "U", "System_Code": 33, "System_Name_E": "Square Yards", "Company_Code": 1, "Year_Code": 3, "systemid": 69},
    {"System_Type": "U", "System_Code": 34, "System_Name_E": "Gross Yards", "Company_Code": 1, "Year_Code": 3, "systemid": 70},
    {"System_Type": "U", "System_Code": 35, "System_Name_E": "Kilo Meter", "Company_Code": 1, "Year_Code": 3, "systemid": 71},
    {"System_Type": "U", "System_Code": 36, "System_Name_E": "Meters", "Company_Code": 1, "Year_Code": 3, "systemid": 72},
    {"System_Type": "U", "System_Code": 37, "System_Name_E": "Yards", "Company_Code": 1, "Year_Code": 3, "systemid": 73},
    {"System_Type": "U", "System_Code": 38, "System_Name_E": "Centimeter", "Company_Code": 1, "Year_Code": 3, "systemid": 74},
    {"System_Type": "U", "System_Code": 39, "System_Name_E": "Tonnes", "Company_Code": 1, "Year_Code": 3, "systemid": 75},
    {"System_Type": "U", "System_Code": 40, "System_Name_E": "Quintal", "Company_Code": 1, "Year_Code": 3, "systemid": 76},
    {"System_Type": "U", "System_Code": 41, "System_Name_E": "Grams", "Company_Code": 1, "Year_Code": 3, "systemid": 77},
    {"System_Type": "U", "System_Code": 42, "System_Name_E": "Kilo Grams", "Company_Code": 1, "Year_Code": 3, "systemid": 78},
    {"System_Type": "U", "System_Code": 43, "System_Name_E": "Others", "Company_Code": 1, "Year_Code": 3, "systemid": 79}
]


# Get data from the Company table
@app.route(API_URL+"/get_company_data_All", methods=["GET"])
def get_company_data():
    try:
        companies = CompanyCreation.query.all()
        result = [serialize_company(company) for company in companies]
        response = {"Company_Data":result}
        return jsonify(response), 200
    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


# Get the maximum Company_Code
@app.route(API_URL+"/get_last_company_code", methods=["GET"])
def get_last_company_code():
    try:
        max_company_code = db.session.query(func.max(CompanyCreation.Company_Code)).scalar()
        return jsonify({"last_company_code": max_company_code}), 200
    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    
# GET endpoint to retrieve data for the last company code along with all its associated data
@app.route(API_URL+"/get_last_company_data", methods=["GET"])
def get_last_company_data():
    try:
        max_company_code = db.session.query(func.max(CompanyCreation.Company_Code)).scalar()
        if not max_company_code:
            return jsonify({"error": "Not Found", "message": "No companies found"}), 404

        last_company = CompanyCreation.query.filter_by(Company_Code=max_company_code).first()
        if not last_company:
            return jsonify({"error": "Not Found", "message": "Company not found"}), 404

        data = serialize_company(last_company)
        return jsonify(data), 200
    except Exception as e:
        return jsonify({"error": "Internal Server Error", "message": str(e)}), 500


    
@app.route(API_URL+"/get_company_by_code", methods=["GET"])
def get_company_by_code():
    company_code = request.args.get("company_code")
    if not company_code:
        return jsonify({"error": "Bad Request", "message": "Company_Code is required"}), 400

    company = CompanyCreation.query.filter_by(Company_Code=company_code).first()
    if not company:
        return jsonify({"error": "Not Found", "message": "Company not found"}), 404

    data = serialize_company(company)
    return jsonify(data), 200

# GET endpoint to retrieve previous data for a specific company by Company_Code(this API use for that last some record are deleted that time show previous record avilable on datatabse)
@app.route(API_URL+"/get_previous_company_data", methods=["GET"])
def get_previous_company_data():
    try:
        company_code = request.args.get("company_code")

        if not company_code:
            return jsonify({"error": "Bad Request", "message": "Company_Code is required"}), 400

        previous_company = CompanyCreation.query.filter(CompanyCreation.Company_Code < company_code)\
            .order_by(CompanyCreation.Company_Code.desc()).first()

        if not previous_company:
            return jsonify({"error": "Not Found", "message": "Previous company data not found"}), 404

        data = serialize_company(previous_company)
        return jsonify(data), 200
    except Exception as e:
        return jsonify({"error": "Internal Server Error", "message": str(e)}), 500

    
# POST endpoint to create a new company with logo and signature uploads
@app.route(API_URL+'/create_company', methods=['POST'])
def create_company():
    if 'logo' not in request.files or 'signature' not in request.files:
        return jsonify({"error": "Missing logo or signature file"}), 400

    logo = request.files['logo']
    signature = request.files['signature']

    if not logo or logo.filename == '':
        return jsonify({"error": "No logo file selected"}), 400
    if not signature or signature.filename == '':
        return jsonify({"error": "No signature file selected"}), 400

    # Save the files to the uploads directory
    logo_filename = secure_filename(logo.filename)
    signature_filename = secure_filename(signature.filename)
    logo_path = os.path.join(app.config['UPLOAD_FOLDER'], logo_filename)
    signature_path = os.path.join(app.config['UPLOAD_FOLDER'], signature_filename)

    # Read the binary data first and then save the files to disk
    logo_data = logo.read()
    signature_data = signature.read()

    # Rewind the streams if you need to use them again
    logo.seek(0)
    signature.seek(0)

    # Now save the files to disk
    with open(logo_path, 'wb') as f:
        f.write(logo_data)
    with open(signature_path, 'wb') as f:
        f.write(signature_data)

    try:
        # Assuming textual data is sent as part of the form
        data = {key: value for key, value in request.form.items() if key not in ['logo', 'signature']}
        company_name = data.get('Company_Name_E') 
        address = data.get('Address_E') 
        gst_number = data.get('GST')
        gst_state_code = gst_number[:2] if gst_number else '0'
        print(gst_state_code)
        company_name_email = data.get('Company_Name_E', '').replace(" ", "").lower()
        email_id = f"admin@{company_name}.com" 

        # Create a new company instance with both binary and non-binary data
        new_company = CompanyCreation(
            Logo=logo_data,
            Signature=signature_data,
            **data
        )

        # Add the new company to the session and commit to the database
        db.session.add(new_company)
        db.session.flush()

        existing_user = db.session.query(TblUser).filter_by(User_Name='Admin', Company_Code=new_company.Company_Code).first()
        if not existing_user:
            default_user = TblUser(
                User_Id=1,
                User_Name='Admin',
                User_Type='A',
                User_Password='Admin@1234',
                Company_Code=new_company.Company_Code,
                Mobile='9999999999',
                EmailId=email_id,
                IsLocked=False,
                LastActivityDate=datetime.now(),
            userfullname='Default Admin'
            )
            db.session.add(default_user)
            db.session.flush()

            for perm in default_permissions:
                user_detail = TblUserDetail(
                    uid=default_user.uid,  # Reference the correct UID from TblUser
                    User_Id=default_user.User_Id,
                    Program_Name=perm['Program_Name'],
                    Tran_Type=None,
                    Permission='Y',
                    Company_Code=new_company.Company_Code,
                    Created_By="System",
                    Modified_By="System",
                    Created_Date=datetime.now(),
                    Modified_Date=datetime.now(),
                    Year_Code=1,
                    canView='Y',
                    canEdit='Y',
                    canSave='Y',
                    canDelete='Y',
                    DND='N',
                    menuNames=perm['Program_Name'].split('/')[-1]
            )
                db.session.add(user_detail)

        
        group_ids = {}
        for group in DEFAULT_GROUPS:
            new_group = GroupMaster(
                group_Code=group['group_Code'],
                group_Name_E=group['group_Name_E'],
                group_Type=group['group_Type'],
                group_Order=group['group_Order'],
                Company_Code=new_company.Company_Code, 
                Created_By='admin',  
                Modified_By='admin' 
            )
            db.session.add(new_group)
        db.session.flush()

        groups = GroupMaster.query.filter_by(Company_Code=new_company.Company_Code).all()
        for group in groups:
            group_ids[group.group_Name_E] = group.bsid

        existing_state_count = GSTStateMaster.query.count()
        if existing_state_count == 0: 
            for states in DEFAULT_STATES:
                new_States = GSTStateMaster(
                State_Name = states['State_Name'] 
                )
                db.session.add(new_States)
            db.session.flush()

        new_city = CityMaster(
            city_code=1,
            city_name_e='Kolhapur',
            pincode='416001',
            GstStateCode=27,
            company_code=new_company.Company_Code,  
            Created_By='System',  
            Modified_By='System'
        )
        db.session.add(new_city)

        existing_gst_count = GSTRateMaster.query.count()
        if existing_gst_count == 0:  
            for gst in DEFAULT_GST_RATES:
                new_gst_rate = GSTRateMaster(
                    Doc_no =  gst['Doc_no'],
                    GST_Name=gst['GST_Name'],
                    Rate=gst['Rate'],
                    IGST=gst['IGST'],
                    SGST=gst['SGST'],
                    CGST=gst['CGST'],
                    Company_Code=new_company.Company_Code,  
                    Created_By='Admin', 
                    Modified_By='Admin' 
                )
                db.session.add(new_gst_rate)
            db.session.flush()

        gst_ids = {}
        gstids = db.session.query(GSTRateMaster).all()
        for gstId in gstids:
            gst_ids[gstId.Doc_no] = gstId.gstid

        group_ids = {}
        groups = db.session.query(GroupMaster).filter_by(Company_Code=new_company.Company_Code).all()
        for group in groups:
            group_ids[group.group_Code] = group.bsid

        account_ids = {}
        for account in DEFAULT_ACCOUNTS:
            ac_name = account['Ac_Name']
            address_line = ""
            gstStateCode = ""
            cityCode = ""
            cityId = ""
            if ac_name == 'CompanyNameA/C':
                ac_name = f'{company_name}'
                address_line = address
                gstStateCode = gst_state_code
                cityCode = new_city.city_code
                cityId = new_city.cityid

            group_bsid = group_ids.get(account['Group_Code'], None)

            if group_bsid is None:
                raise ValueError(f"Group_Code {account['Group_Code']} not found in group_ids for Company_Code {new_company.Company_Code}")

            new_account = AccountMaster(
                Ac_Code=account['Ac_Code'],
                Ac_Name_E=ac_name,
                Address_E=address_line,
                Ac_type=account['Ac_Type'],
                Group_Code=account['Group_Code'],
                bsid=group_bsid,
                GSTStateCode = gstStateCode,
                City_Code = cityCode,
                cityid = cityId,
                company_code=new_company.Company_Code,
            )
            db.session.add(new_account)
            db.session.flush()
            account_ids[account['Ac_Name']] = new_account.Ac_Code

        existing_company_parameter = db.session.query(CompanyParameters).filter_by(Company_Code=new_company.Company_Code, Year_Code=1).first()
        if not existing_company_parameter:
            new_company_params = CompanyParameters(
                COMMISSION_AC = account_ids['Commission A/C'],
                INTEREST_AC = account_ids['Interest A/C'],
                TRANSPORT_AC=account_ids['Transportation Charge A/C'],
                POSTAGE_AC=account_ids['Postage A/C'],
                SELF_AC=account_ids['Self'],
                Company_Code=new_company.Company_Code,
                Year_Code = 1,
                Created_By = "Admin",
                Modified_By = "Admin",
                AutoVoucher = "YES",
                tblPrefix = "",
                GSTStateCode=gst_state_code,
                CGSTAc=account_ids['Sale CGST A/C'],
                SGSTAc=account_ids['Sale SGST A/C'],
                IGSTAc=account_ids['Sale IGST A/C'],
                PurchaseCGSTAc=account_ids['Purchase CGST A/C'],
                PurchaseSGSTAc=account_ids['Purchase SGST A/C'],
                PurchaseIGSTAc=account_ids['Purchase IGST A/C'],
                RoundOff=account_ids['Round Off'],
                Transport_RCM_GSTRate = 1,
                CGST_RCM_Ac=account_ids['CGST RCM A/C'],
                SGST_RCM_Ac=account_ids['SGST RCM A/C'],
                IGST_RCM_Ac=account_ids['IGST RCM A/C'],
                Freight_Ac=account_ids['Freight A/C'],
                TCS =0.01,
                PurchaseTCSAc=account_ids['Purchase TCS A/C'],
                SaleTCSAc=account_ids['Sale TCS A/C'],
                filename = '',
                OTHER_AMOUNT_AC =  account_ids['Other A/C'],
                SuperCost =  account_ids['Super Cost A/C'],
                Packing =  account_ids['Packing A/C'],
                Hamali =  account_ids['Hamali A/C'],
                TransportTDS_Ac =  account_ids['Transport TDS A/C'],
                TransportTDS_AcCut = account_ids['Transport TDS Cut By Us'],
                Mill_Payment_date = 3,
                dispatchType = 'C',
                ReturnSaleCGST = account_ids['Sale CGST A/C'],
                ReturnSaleSGST = account_ids['Sale SGST A/C'],
                ReturnSaleIGST = account_ids['Sale IGST A/C'],
                ReturnPurchaseCGST = account_ids['Purchase CGST A/C'],
                ReturnPurchaseSGST = account_ids['Purchase SGST A/C'],
                ReturnPurchaseIGST = account_ids['Purchase IGST A/C'],
                SaleTDSAc =  account_ids['Sale TDS A/C'],
                PurchaseTDSAc =  account_ids['Purchase TDS A/C'],
                PurchaseTDSRate = 0.01,
                SaleTDSRate = 0.01,
                BalanceLimit = 5000000,
                RateDiffAc =  account_ids['Rate Diff A/C'],
                # customisesb = '',
                # customisedo = '',
                # DODate=datetime(2024, 4, 1),
                # DOPages = 1,
                # TCSPurchaseBalanceLimit = 5000000,
                # TDSPurchaseBalanceLimit = 5000000,
                # PurchaseSaleTcs = 0.01,
                # TCSTDSSaleBalanceLimit = 5000000,
                # DepreciationAC = account_ids['Depreciation A/C'],
                # InterestRate = 0.00,
                # InterestTDSAc = account_ids['Interest TDS A/C'],
                # BankPaymentAc = 0,
                # bpid = 0,
                # Edit_Sale_Rate = 'Y',
                def_gst_rate_code = 2 or ''

            )

            db.session.add(new_company_params)

        new_systems = []
        gst_id=0
        for system in DEFAULT_SYSTEMS:
            purchase_ac = None  # Reset for each system
            sale_ac = None      # Reset for each system

    # Assign special accounts if the system type is 'I'
            if system["System_Type"] == 'I':
                purchase_ac = account_ids.get('Sugar Purchase A/C', None)  # Using .get() to avoid KeyError
                sale_ac = account_ids.get('Sugar Sale A/C', None)

                gst_id = gst_ids.get(system['Gst_Code'], 0)

                if gst_id is None:
                    raise ValueError(f"Gst_Code {system['Gst_Code']} not found in gst_ids for Gst_Code {new_gst_rate.Doc_no}")

    # Create and populate the SystemMaster instance
            system_master = SystemMaster(
                System_Type=system["System_Type"],
                System_Code=system["System_Code"],
                System_Name_E=system["System_Name_E"],
                System_Name_R=system.get("System_Name_R", None),
                System_Rate=system.get("System_Rate", None),
                Purchase_AC=purchase_ac,
                Sale_AC=sale_ac,
                Vat_AC=system.get("Vat_AC", None),
                Opening_Bal=system.get("Opening_Bal", None),
                KgPerKatta=system.get("KgPerKatta", None),
                minRate=system.get("minRate", None),
                maxRate=system.get("maxRate", None),
                Company_Code=new_company.Company_Code,
                Year_Code=system["Year_Code"],
                Branch_Code=system.get("Branch_Code", None),
                Created_By=system.get("Created_By", None),
                Modified_By=system.get("Modified_By", None),
                HSN=system.get("HSN", None),
                Opening_Value=system.get("Opening_Value", None),
                Gst_Code=system.get("Gst_Code", None),
                MarkaSet=system.get("MarkaSet", None),
                Supercost=system.get("Supercost", None),
                Packing=system.get("Packing", None),
                LodingGst=system.get("LodingGst", None),
                MarkaPerc=system.get("MarkaPerc", None),
                SuperPerc=system.get("SuperPerc", None),
                RatePer=system.get("RatePer", None),
                IsService=system.get("IsService", None),
                # Width=system.get("Width", None),
                # LENGTH=system.get("LENGTH", None),
                # levi=system.get("levi", None),
                # Oldcompname=system.get("Oldcompname", None),
                # Insurance=system.get("Insurance", None),
                # weight=system.get("weight", None),
                # gstratecode=system.get("gstratecode", None),
                # category=system.get("category", None),
                # gstid=gst_id
            )
            new_systems.append(system_master)  # Append to the list

# Add new systems to the database session
        for system in new_systems:
            db.session.add(system)

        db.session.commit()

        return jsonify({"message": "Company created successfully", "Company_Code": new_company.Company_Code}), 201

    except werkzeug.exceptions.BadRequest as e:
        db.session.rollback()
        return jsonify({"error": "Bad Request", "message": str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to create company", "message": str(e)}), 500


#Update Company By Company Code
@app.route(API_URL+"/update_company", methods=["PUT"])
def update_company():
    company_code = request.args.get('company_code')
    if not company_code:
        return jsonify({"error": "Company_Code is required"}), 400

    company = CompanyCreation.query.filter_by(Company_Code=company_code).first()
    if not company:
        return jsonify({"error": "Company not found"}), 404

    try:
        # Update text data, ensure not to include Company_Code in the updateable fields
        data = request.form.to_dict()
        for key in data:
            if hasattr(company, key) and key != 'Company_Code':  # Protect the Company_Code from being updated
                setattr(company, key, data[key])

        # Handle binary data updates
        logo = request.files.get('logo')
        if logo:
            company.Logo = logo.read()
        signature = request.files.get('signature')
        if signature:
            company.Signature = signature.read()

        db.session.commit()
        return jsonify({"message": "Company updated successfully"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to update company", "message": str(e)}), 500
    
# Lock Record update call
@app.route(API_URL+"/lock_unlock_record", methods=["PUT"])
def lock_unlock_record():
    try:
        company_code = request.args.get('company_code')
        

        if not company_code:
            return jsonify({"error": "Bad Request", "message": "Company_Code is required in query parameters"}), 400

        company = CompanyCreation.query.filter_by(Company_Code=company_code).first()
        if not company:
            return jsonify({"error": "Not Found", "message": "Company not found"}), 404

        data = request.json
        for key, value in data.items():
            setattr(company, key, value)

        db.session.commit()

        return jsonify({"message": "Company updated successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Internal Server Error", "message": str(e)}), 500

#Delete Company
@app.route(API_URL+"/delete_company", methods=["DELETE"])
def delete_company():
    try:
        company_code = request.args.get('company_code')
        if not company_code:
            return jsonify({"error": "Bad Request", "message": "Company_Code is required in query parameters"}), 400

        company = CompanyCreation.query.filter_by(Company_Code=company_code).first()
        if not company:
            return jsonify({"error": "Not Found", "message": "Company not found"}), 404

        # Verify if the version/timestamp matches the one in the database before deletion
        if request.args.get('version') and company.version != request.args.get('version'):
            return jsonify({"error": "Conflict", "message": "Record has been modified by another user"}), 409

        db.session.delete(company)
        db.session.commit()
        return jsonify({"message": "Company deleted successfully"}), 200
    except StaleDataError:
        db.session.rollback()
        return jsonify({"error": "Conflict", "message": "Record has been modified by another user"}), 409
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Internal Server Error", "message": str(e)}), 500
    

#Navigation APIS
@app.route(API_URL+"/get_first_navigation", methods=["GET"])
def get_first_navigation():
    try:
        # Retrieve the first company entry based on ascending order of Company_Code
        first_company = CompanyCreation.query.order_by(CompanyCreation.Company_Code.asc()).first()
        if not first_company:
            return jsonify({'error': 'No records found'}), 404
        
        # Serialize the company data including binary fields like Logo and Signature
        response_data = serialize_company(first_company)
        return jsonify(response_data), 200
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'message': str(e)}), 500
    

@app.route(API_URL+"/get_last_navigation", methods=["GET"])
def get_last_navigation():
    try:
        last_company = CompanyCreation.query.order_by(CompanyCreation.Company_Code.desc()).first()
        if not last_company:
            return jsonify({'error': 'No records found'}), 404
        
        data = serialize_company(last_company)
        return jsonify(data), 200
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'message': str(e)}), 500

@app.route(API_URL+"/get_previous_navigation", methods=["GET"])
def get_previous_navigation():
    current_company_code = request.args.get('current_company_code')
    if not current_company_code:
        return jsonify({'error': 'current_company_code parameter is required'}), 400
    
    previous_company = CompanyCreation.query.filter(CompanyCreation.Company_Code < current_company_code)\
        .order_by(CompanyCreation.Company_Code.desc()).first()
    if not previous_company:
        return jsonify({'error': 'No previous record found'}), 404

    data = serialize_company(previous_company)
    return jsonify(data), 200

@app.route(API_URL+"/get_next_navigation", methods=["GET"])
def get_next_navigation():
    current_company_code = request.args.get('current_company_code')
    if not current_company_code:
        return jsonify({'error': 'current_company_code parameter is required'}), 400

    next_company = CompanyCreation.query.filter(CompanyCreation.Company_Code > current_company_code)\
        .order_by(CompanyCreation.Company_Code.asc()).first()
    if not next_company:
        return jsonify({'error': 'No next record found'}), 404

    data = serialize_company(next_company)
    return jsonify(data), 200

