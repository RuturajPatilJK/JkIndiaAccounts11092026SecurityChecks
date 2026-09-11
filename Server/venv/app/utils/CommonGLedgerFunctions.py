from sqlalchemy import text
from app import app, db
from flask import request
import os
import requests

API_URL_SERVER = os.getenv('API_URL_SERVER')


def _internal_auth_kwargs():
    # This calls the same Flask app's own API (gLedger create/delete) over HTTP.
    # Since the global JWT auth gate (app/__init__.py) requires a token on every
    # route, forward the caller's own session cookie and CSRF token so the
    # internal call is accepted the same way the original browser request was.
    cookies = dict(request.cookies) if request else {}
    headers = {'X-CSRF-TOKEN': cookies.get('csrf_access_token', '')}
    return {'cookies': cookies, 'headers': headers}

def fetch_company_parameters(company_code, year_code):
        query = """
SELECT        dbo.nt_1_companyparameters.IGSTAc,dbo.nt_1_companyparameters.GSTStateCode, dbo.nt_1_companyparameters.SGSTAc, dbo.nt_1_companyparameters.CGSTAc, dbo.nt_1_companyparameters.PurchaseCGSTAc, dbo.nt_1_companyparameters.PurchaseSGSTAc, 
                         dbo.nt_1_companyparameters.PurchaseIGSTAc, dbo.nt_1_companyparameters.SaleTCSAc, dbo.nt_1_companyparameters.SaleTDSAc, saleigst.accoid AS saleigstaccoid, salesgst.accoid AS salesgstaccoid, 
                         salecgst.accoid AS salecgstaccoid, purchasecgst.accoid AS Purchasecgstaccoid, purchasesgst.accoid AS Purchasesgstaccoid, purchaseigst.accoid AS Purchaseigstaccoid, saletcs.accoid AS saletcsaccoid, 
                         saletds.accoid AS saletdsaccoid, dbo.nt_1_companyparameters.RoundOff, dbo.nt_1_companyparameters.TransportTDS_AcCut, transporttdsaccut.Ac_Code AS transporttdscutaccode, 
                         transporttdsaccut.accoid AS transporttdscutacid, dbo.nt_1_companyparameters.Freight_Ac, frieghtac.Ac_Code, transporttdsaccut.Ac_Name_E AS TransportTDSAcCutAcName, frieghtac.Ac_Name_E AS Frieghtacname, 
                         frieghtac.accoid AS freightAcid, dbo.nt_1_companyparameters.SELF_AC, self.Ac_Code AS selfacacode, self.Ac_Name_E AS ReturnSaleSGSTAcName, self.accoid AS selfacid, dbo.nt_1_companyparameters.AutoVoucher, 
                         dbo.nt_1_companyparameters.COMMISSION_AC, commisionac.Ac_Code AS commisionaccode, commisionac.Ac_Name_E AS commisionacname, commisionac.accoid AS commisionacid, 
                         dbo.nt_1_companyparameters.RateDiffAc, ratediffac.Ac_Code AS ratediffaccode, ratediffac.Ac_Name_E AS ratediffacname, ratediffac.accoid AS ratediffacid, dbo.nt_1_companyparameters.CGST_RCM_Ac, 
                         dbo.nt_1_companyparameters.SGST_RCM_Ac, dbo.nt_1_companyparameters.IGST_RCM_Ac, RCMCGST.accoid AS RCMCGSTAcID, RCMSGST.accoid AS RCMSGSTacID, RCMIGST.accoid AS RCMIGSTAcID, 
                         RCMCGST.Ac_Name_E AS RCMCGSTname, RCMSGST.Ac_Name_E AS RCMSGSTName, RCMIGST.Ac_Name_E AS RCMIGSTName, dbo.nt_1_companyparameters.BalanceLimit, dbo.nt_1_companyparameters.SaleTDSRate, 
                         dbo.nt_1_companyparameters.PurchaseTDSRate, dbo.nt_1_companyparameters.TCS AS TCSRate, Other_Amount_AC.accoid AS OtherAmtAcid, Other_Amount_AC.Ac_Name_E AS OtherAmtAcName, 
                         dbo.nt_1_companyparameters.OTHER_AMOUNT_AC, dbo.nt_1_companyparameters.PurchaseTDSAc, PurchaseTDSAc.accoid AS PurchaseTDSAccoid, PurchaseTDSAc.Ac_Name_E AS PurchaseTDSAcName, 
                         dbo.nt_1_companyparameters.PurchaseTCSAc, PurchaseTCSAc.accoid AS PurchaseTCSAccoid, PurchaseTCSAc.Ac_Name_E AS PurchaseTCSAcName, rountof.accoid AS RoundOffAccoid, 
                         DepreciationAc.Ac_Name_E AS DepreciationAcName, dbo.nt_1_companyparameters.DepreciationAC, DepreciationAc.accoid AS DepreciationAccoid, dbo.nt_1_companyparameters.defaultSundryCreditors, 
                         dbo.nt_1_companyparameters.defalultSundryDebitors, DefaultCreditors.Ac_Name_E AS DefaultCreditorsName, DefaultCreditors.accoid AS DefaultCreditorsAccoid, DefaultDebtors.Ac_Name_E AS DefaultdebitorsName, 
                         DefaultDebtors.accoid AS DefaultDebitorsAccoid, dbo.nt_1_companyparameters.Freight_Receivable_Ac, FreightReceivable.Ac_Name_E AS FreightAcName, FreightReceivable.accoid AS FreightReceivableAccoid, 
                         dbo.nt_1_companyparameters.closing_stock_trading_ac, dbo.nt_1_companyparameters.closing_stock_bL_ac
FROM            dbo.nt_1_companyparameters INNER JOIN
                         dbo.nt_1_accountmaster AS saleigst ON dbo.nt_1_companyparameters.IGSTAc = saleigst.Ac_Code AND dbo.nt_1_companyparameters.Company_Code = saleigst.company_code INNER JOIN
                         dbo.nt_1_accountmaster AS salesgst ON dbo.nt_1_companyparameters.SGSTAc = salesgst.Ac_Code AND dbo.nt_1_companyparameters.Company_Code = salesgst.company_code INNER JOIN
                         dbo.nt_1_accountmaster AS salecgst ON dbo.nt_1_companyparameters.CGSTAc = salecgst.Ac_Code AND dbo.nt_1_companyparameters.Company_Code = salecgst.company_code INNER JOIN
                         dbo.nt_1_accountmaster AS purchasecgst ON dbo.nt_1_companyparameters.PurchaseCGSTAc = purchasecgst.Ac_Code AND dbo.nt_1_companyparameters.Company_Code = purchasecgst.company_code INNER JOIN
                         dbo.nt_1_accountmaster AS purchasesgst ON dbo.nt_1_companyparameters.PurchaseSGSTAc = purchasesgst.Ac_Code AND dbo.nt_1_companyparameters.Company_Code = purchasesgst.company_code INNER JOIN
                         dbo.nt_1_accountmaster AS purchaseigst ON dbo.nt_1_companyparameters.PurchaseIGSTAc = purchaseigst.Ac_Code AND dbo.nt_1_companyparameters.Company_Code = purchaseigst.company_code INNER JOIN
                         dbo.nt_1_accountmaster AS saletcs ON dbo.nt_1_companyparameters.SaleTCSAc = saletcs.Ac_Code AND dbo.nt_1_companyparameters.Company_Code = saletcs.company_code INNER JOIN
                         dbo.nt_1_accountmaster AS rountof ON dbo.nt_1_companyparameters.RoundOff = rountof.Ac_Code AND dbo.nt_1_companyparameters.Company_Code = rountof.company_code INNER JOIN
                         dbo.nt_1_accountmaster AS self ON dbo.nt_1_companyparameters.SELF_AC = self.Ac_Code INNER JOIN
                         dbo.nt_1_accountmaster AS PurchaseTCSAc ON dbo.nt_1_companyparameters.PurchaseTCSAc = PurchaseTCSAc.Ac_Code LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS FreightReceivable ON dbo.nt_1_companyparameters.Company_Code = FreightReceivable.company_code AND 
                         dbo.nt_1_companyparameters.Freight_Receivable_Ac = FreightReceivable.Ac_Code LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS DefaultDebtors ON dbo.nt_1_companyparameters.Company_Code = DefaultDebtors.company_code AND 
                         dbo.nt_1_companyparameters.defalultSundryDebitors = DefaultDebtors.Ac_Code LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS DefaultCreditors ON dbo.nt_1_companyparameters.Company_Code = DefaultCreditors.company_code AND 
                         dbo.nt_1_companyparameters.defaultSundryCreditors = DefaultCreditors.Ac_Code LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS DepreciationAc ON dbo.nt_1_companyparameters.DepreciationAC = DepreciationAc.Ac_Code AND dbo.nt_1_companyparameters.Company_Code = DepreciationAc.company_code LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS saletds ON dbo.nt_1_companyparameters.SaleTDSAc = saletds.Ac_Code AND dbo.nt_1_companyparameters.Company_Code = saletds.company_code LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS PurchaseTDSAc ON dbo.nt_1_companyparameters.PurchaseTDSAc = PurchaseTDSAc.Ac_Code AND 
                         dbo.nt_1_companyparameters.Company_Code = PurchaseTDSAc.company_code LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS Other_Amount_AC ON dbo.nt_1_companyparameters.OTHER_AMOUNT_AC = Other_Amount_AC.Ac_Code AND saleigst.accoid = Other_Amount_AC.accoid AND 
                         dbo.nt_1_companyparameters.Company_Code = Other_Amount_AC.company_code LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS RCMIGST ON dbo.nt_1_companyparameters.Company_Code = RCMIGST.company_code AND dbo.nt_1_companyparameters.IGST_RCM_Ac = RCMIGST.Ac_Code LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS RCMSGST ON dbo.nt_1_companyparameters.Company_Code = RCMSGST.company_code AND dbo.nt_1_companyparameters.SGST_RCM_Ac = RCMSGST.Ac_Code LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS RCMCGST ON dbo.nt_1_companyparameters.Company_Code = RCMCGST.company_code AND dbo.nt_1_companyparameters.CGST_RCM_Ac = RCMCGST.Ac_Code LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS ratediffac ON dbo.nt_1_companyparameters.Company_Code = ratediffac.company_code AND dbo.nt_1_companyparameters.RateDiffAc = ratediffac.Ac_Code LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS commisionac ON dbo.nt_1_companyparameters.Company_Code = commisionac.company_code AND dbo.nt_1_companyparameters.COMMISSION_AC = commisionac.Ac_Code LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS frieghtac ON dbo.nt_1_companyparameters.Company_Code = frieghtac.company_code AND dbo.nt_1_companyparameters.Freight_Ac = frieghtac.Ac_Code LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS transporttdsaccut ON dbo.nt_1_companyparameters.TransportTDS_Ac = transporttdsaccut.Ac_Code AND dbo.nt_1_companyparameters.Company_Code = transporttdsaccut.company_code
          WHERE dbo.nt_1_companyparameters.Company_Code = :company_code AND dbo.nt_1_companyparameters.Year_Code = :year_code
        """
        result = db.session.execute(text(query), {'company_code': company_code, 'year_code': year_code}).fetchone()
        return result


def get_accoid(ac_code,company_code):
        result = db.session.execute(
            text("SELECT accoid FROM nt_1_accountmaster WHERE Ac_Code = :ac_code and company_code= :company_code ORDER BY accoid"),
            {'ac_code': ac_code , 'company_code': company_code}
        ).fetchone()
        return result.accoid if result else None


def getPurchaseAc(ic):
    result = db.session.execute(
        text("select Purchase_AC from nt_1_systemmaster where systemid =:ic"),
        {'ic': ic}
    ).fetchone()
    return result.Purchase_AC if result else None

def getSaleAc(ic):
    result = db.session.execute(
        text("select Sale_AC from nt_1_systemmaster where systemid =:ic"),
        {'ic': ic}
    ).fetchone()
    return result.Sale_AC if result else None

def get_acShort_Name(ac_code,company_code):
        result = db.session.execute(
            text("SELECT Short_Name FROM nt_1_accountmaster WHERE Ac_Code = :ac_code and company_code= :company_code ORDER BY accoid"),
            {'ac_code': ac_code , 'company_code': company_code}
        ).fetchone()
        return result.Short_Name if result else None

def get_ac_Name(ac_code,company_code):
        result = db.session.execute(
            text("SELECT Ac_Name_E FROM nt_1_accountmaster WHERE Ac_Code = :ac_code and company_code= :company_code ORDER BY accoid"),
            {'ac_code': ac_code , 'company_code': company_code}
        ).fetchone()
        return result.Ac_Name_E if result else None


def get_gst_rate(gstid,company_code):
        result = db.session.execute(
            text("SELECT Rate FROM nt_1_gstratemaster WHERE gstid = :gstid and company_code= :company_code"),
            {'gstid': gstid , 'company_code': company_code}
        ).fetchone()
        return result.Rate if result else None


# def fetch_auto_voucher_value(company_code, year_code):
#         query = """
#         SELECT        AutoVoucher
# FROM  dbo.nt_1_companyparameters 
#           WHERE Company_Code = :company_code AND Year_Code = :year_code
#         """
#         result = db.session.execute(text(query), {'company_code': company_code, 'year_code': year_code}).fetchone()
#         return result

def fetch_auto_voucher_value(company_code, year_code):
    query = """
    SELECT AutoVoucher
    FROM dbo.nt_1_companyparameters 
    WHERE Company_Code = :company_code AND Year_Code = :year_code
    """
    result = db.session.execute(text(query), {'company_code': company_code, 'year_code': year_code}).fetchone()
    
    # Return the first element of the tuple (which is 'YES' in this case)
    if result:
        return result[0]  # This will return 'YES'
    return None  # Return None if no result is found


#Create GLegder Effects
def create_gledger_entry(data, amount, drcr, ac_code, accoid,ordercode,trans_type,doc_no,narration):
    doc_date = data.get('doc_date') or data.get('Date') or data.get('Doc_Date')
    company_code = data.get('Company_Code') or data.get('company_code') or None
    year_code = data.get('Year_Code') or data.get('year_code') or None
    return {
            "TRAN_TYPE": trans_type,
            "DOC_NO": doc_no,
            "DOC_DATE": doc_date,
            "AC_CODE": ac_code,
            "AMOUNT": amount,
            "COMPANY_CODE": company_code,
            "YEAR_CODE":year_code,
            "ORDER_CODE": ordercode,
            "DRCR": drcr,
            "UNIT_Code": 0,
            "NARRATION": narration or data.get('Narration') or data.get('narration_header'),
            "TENDER_ID": 0,
            "TENDER_ID_DETAIL": 0,
            "VOUCHER_ID": 0,
            "DRCR_HEAD": 0,
            "ADJUSTED_AMOUNT": 0,
            "Branch_Code": 1,
            "SORT_TYPE": trans_type,
            "SORT_NO": doc_no,
            "vc": 0,
            "progid": 0,
            "tranid": 0,
            "saleid": 0,
            "ac": accoid,
            "gcid": 0,
            "do_no": 0,
            "CASHCREDIT" : "",
            "CA_NARRATION": ""
        }

#GLedger 
# def send_gledger_entries(headData, gledger_entries,trans_type):
#     company_code = headData.get('Company_Code') or headData.get('company_code') or None
#     year_code = headData.get('Year_Code') or headData.get('year_code') or None
#     doc_no = headData.get('doc_no') or headData.get('Doc_No') or 0
#     query_params = {
#         'Company_Code': company_code,
#         'DOC_NO': doc_no,
#         'Year_Code': year_code,
#         'TRAN_TYPE': trans_type,
#     }

#     response = requests.post(API_URL_SERVER + "/create-Record-gLedger", params=query_params, json=gledger_entries)
#     if response.status_code != 201:
#         db.session.rollback()
#         raise Exception(f"Failed to send Gledger entries: {response.status_code}, {response.text}")
#     return response

def send_gledger_entries(headData, gledger_entries,trans_type,saleid=None):
    company_code = headData.get('Company_Code') or headData.get('company_code') or None
    year_code = headData.get('Year_Code') or headData.get('year_code') or None
    doc_no = headData.get('doc_no') or headData.get('Doc_No') or 0
    saleid = saleid
     
    query_params = {
        'Company_Code': company_code,
        'DOC_NO': doc_no,
        'Year_Code': year_code,
        'TRAN_TYPE': trans_type,
    }

    if saleid:
        query_params['saleid'] = saleid

    response = requests.post(API_URL_SERVER + "/create-Record-gLedger", params=query_params, json=gledger_entries, **_internal_auth_kwargs())
    if response.status_code != 201:
        db.session.rollback()
        raise Exception(f"Failed to send Gledger entries: {response.status_code}, {response.text}")
    return response
     
      


      
