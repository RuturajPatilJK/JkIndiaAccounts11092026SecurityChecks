# from sqlalchemy import text,func
# from app import app, db
# import asyncio
# import aiohttp
# import os
# from flask import Flask, jsonify, request
# from app.models.BusinessReleted.DeliveryOrder.DeliveryOrderModels import DeliveryOrderHead,DeliveryOrderDetail
# from app.models.BusinessReleted.TenderPurchase.TenderPurchaseModels import TenderHead,TenderDetails
# from app.utils.CommonGLedgerFunctions import get_accoid,fetch_company_parameters,get_ac_Name
# from sqlalchemy.exc import SQLAlchemyError 

# API_URL_SERVER = os.getenv('API_URL_SERVER')

# #Asynchronous API Posting 
# async def async_post(url, params=None, json=None):
#     async with aiohttp.ClientSession() as session:
#         async with session.post(url, params=params, json=json) as response:
#             return await response.json(), response.status

# async def async_put(url, params=None, json=None):
#     async with aiohttp.ClientSession() as session:
#         async with session.put(url, params=params, json=json) as response:
#             return await response.json(), response.status
        
# async def async_delete(url, params=None, json=None):
#     async with aiohttp.ClientSession() as session:
#         async with session.delete(url, params=params, json=json) as response:
#             return await response.json(), response.status

# #GET Max Doc No       
# def get_max_doc_no(company_code,year_code):
#         return db.session.query(func.max(DeliveryOrderHead.doc_no)).filter(DeliveryOrderHead.company_code==company_code,DeliveryOrderHead.Year_Code==year_code).scalar() or 0

# #Remove the feilds from the Delivey Order Function
# def remove_columns_from_data(data, columns_to_remove=None):
#     if columns_to_remove is None:
#         columns_to_remove = [
#             'TaxableAmountForSB', 'cgstrate', 'sgstrate', 'igstrate', 'cgstamt',
#             'sgstamt', 'igstamt', 'SaleDetail_Rate', 'SB_freight', 'SB_SubTotal', 'SB_Less_Frt_Rate',
#             'TotalGstSaleBillAmount', 'Roundoff', 'SBTCSAmt', 'Net_Payble', 'SBTDSAmt', 'save', 'sale',
#             'item_Amount', 'SB_Ac_Code', 'SB_Unit_Code', 'PS_CGSTAmount', 'PS_SGSTAmount', 'PS_IGSTAmount', 'PS_CGSTRATE',
#             'PS_SGSTRATE', 'PS_IGSTRATE', 'TOTALPurchase_Amount', 'PSTCS_Amt', 'PSTDS_Amt', 'PSNetPayble', 'PS_SelfBal', 'PS_amount', 'lblgetpasscodename',
#             'lblvoucherByname', 'Gst_Rate', 'AutopurchaseBill', 'LV_CGSTAmount', 'LV_SGSTAmount', 'LV_IGSTAmount', 'LV_TotalAmount',
#             'LV_TCSRate', 'LV_NETPayble', 'LV_TCSAmt', 'LV_TDSRate', 'LV_TDSAmt', 'LV_Igstrate', 'LV_Cgstrate', 'LV_taxableamount',
#             'LV_Sgstrate', 'LV_Commision_Amt', 'LV_tender_Commision_Amt', 'gstratename', 'Gstrate', 'lblitemname',
#             'newbroker', 'lblbrokername'
#         ]
    
#     for key in columns_to_remove:
#         if key in data:
#             del data[key]
#     return data

# #Genrate the Gldger Entries 
# async def genrate_gledger_entries(headData, company_parameters, getpasscode, selfac, new_doc_no,add_gledger_entry,new_sale_data):
#     gledger_entries = []
#     ordercode = 0
    
#     vasuli_amount1=float(headData['vasuli_amount1'])
#     vasuli_amount=float(headData['vasuli_amount'])
#     TDSAc = headData['TDSAc']
#     TDSAmt = float(headData['TDSAmt'])
#     TDSCut = headData['TDSCut']
#     transport = headData['transport']
#     Memo_Advance = float(headData['Memo_Advance'])
#     MemoGstRate =float(headData['MemoGSTRate'])
#     Freight_Amount = float(headData['Freight_Amount'])

#     truck_no = headData['truck_no']
#     mill_code = headData['mill_code']
#     transporterName = get_ac_Name(transport, headData['company_code'])
#     millName = get_ac_Name(mill_code,headData['company_code'])
    

#     NarrationForFreight = (
#         f"Truck No.{truck_no}"+ "#" 
#         f"{millName}"+ "-"
#         f"{transporterName}"
#     )

#     if TDSCut =='N' :
#         transporttdsac=transport
#     else:
#         transporttdsac=company_parameters.TransportTDS_AcCut
        
#     gledger_entries = []
#     if getpasscode != selfac :
#         if vasuli_amount1 != 0:
#             ordercode = ordercode+1
#             GETPASSCODE = headData['GETPASSCODE']
#             accoid = get_accoid(GETPASSCODE,headData['company_code'])
#             add_gledger_entry(gledger_entries, headData, vasuli_amount1, 'D', GETPASSCODE, accoid,0,ordercode,'Vasuli Amount',0,0,"Vasuli Amount")

#             ordercode = ordercode+1
#             Vasuli_Ac = headData['Vasuli_Ac']
#             accoid = get_accoid(Vasuli_Ac,headData['company_code'])
#             add_gledger_entry(gledger_entries, headData, vasuli_amount1, 'D', Vasuli_Ac, accoid,9999971,ordercode,'Vasuli Amount',0,0,"Vasuli Amount")
            
#         if TDSAc != 0 :      
#             if TDSAmt != 0 :
#                 ordercode = ordercode+1
#                 accoid = get_accoid(TDSAc,headData['company_code'])
#                 add_gledger_entry(gledger_entries, headData, TDSAmt, 'C', TDSAc, accoid,9999971,ordercode,'TDS Amount',0,0,'TDS Amount')

#                 ordercode = ordercode+1
#                 accoid = get_accoid(transporttdsac,headData['company_code'])
#                 add_gledger_entry(gledger_entries, headData, TDSAmt, 'D', transporttdsac, accoid,transporttdsac,ordercode,'TDS Amount',0,0,'TDS Amount')

#         if Freight_Amount != 0:
#             ordercode = ordercode+1
#             accoid = get_accoid(transport,headData['company_code'])
#             add_gledger_entry(gledger_entries, headData, Freight_Amount, "C", transport, accoid,transport,ordercode,NarrationForFreight,0,0,NarrationForFreight)

#             ordercode = ordercode+1
#             ac_code = company_parameters.Freight_Ac
#             accoid = get_accoid(ac_code,headData['company_code'])
#             add_gledger_entry(gledger_entries, headData, Freight_Amount, "D", ac_code, accoid,transport,ordercode,NarrationForFreight,0,0,NarrationForFreight)
                
                
#         if Memo_Advance != 0 :
#             # ordercode = ordercode+1
#             # accoid = get_accoid(transport,headData['company_code'])
#             # add_gledger_entry(gledger_entries, headData, Memo_Advance, "C", transport, accoid,transport,ordercode,'Memo_Advance',0,0,"Being Delivery Order:" + str(headData['doc_no']))
            
                
#             # ordercode=ordercode+1
#             # Freight_Ac=company_parameters.Freight_Ac
#             # accoid = get_accoid(Freight_Ac,headData['company_code'])
#             # add_gledger_entry(gledger_entries, headData, Memo_Advance, "D", Freight_Ac, accoid,Freight_Ac,ordercode,'Memo_Advance',0,0,"Being Delivery Order:" + str(headData['doc_no']))
            
#             if MemoGstRate != 0:
#                 RCMCGST=float(new_sale_data.get('RCMCGSTAmt', 0) or 0)
#                 RCMSGST=float(new_sale_data.get('RCMSGSTAmt', 0) or 0)
#                 RCMIGST=float(new_sale_data.get('RCMIGSTAmt', 0) or 0)
               
#                 if RCMCGST > 0:
#                     ordercode=ordercode+1
#                     CGST_RCM_Ac=company_parameters.CGST_RCM_Ac
#                     accoid = get_accoid(CGST_RCM_Ac,headData['company_code'])
#                     add_gledger_entry(gledger_entries, headData, RCMCGST, "D", CGST_RCM_Ac, accoid,headData['transport'],ordercode,'RCM CGST',0,0,"RCM CGST")
                    
#                     ordercode=ordercode+1
#                     CCGSTAc=company_parameters.CGSTAc
#                     accoid = get_accoid(CCGSTAc,headData['company_code'])
#                     add_gledger_entry(gledger_entries, headData, RCMCGST, "C", CCGSTAc, accoid, headData['transport'],ordercode,'RCM CGST',0,0,"RCM CGST")
                    
#                 if RCMSGST > 0:
#                     ordercode=ordercode+1
#                     SGST_RCM_Ac=company_parameters.SGST_RCM_Ac
#                     accoid = get_accoid(SGST_RCM_Ac,headData['company_code'])
#                     add_gledger_entry(gledger_entries, headData, RCMSGST, "D", SGST_RCM_Ac, accoid,headData['transport'],ordercode,'RCM SGST',0,0,'RCM SGST')
                    
#                     ordercode=ordercode+1
#                     SGSTAc=company_parameters.SGSTAc
#                     accoid = get_accoid(SGSTAc,headData['company_code'])
#                     add_gledger_entry(gledger_entries, headData, RCMSGST, "C",SGSTAc, accoid, headData['transport'],ordercode,'RCM SGST',0,0,'RCM SGST')
                
#                 if RCMIGST > 0:
#                     ordercode=ordercode+1
#                     IGST_RCM_Ac=company_parameters.IGST_RCM_Ac
#                     accoid = get_accoid(IGST_RCM_Ac,headData['company_code'])
#                     add_gledger_entry(gledger_entries, headData, RCMIGST, "D", IGST_RCM_Ac, accoid,headData['transport'],ordercode,'RCM IGST',0,0,'RCM IGST')
                    
#                     ordercode=ordercode+1
#                     IGSTAc=company_parameters.IGSTAc
#                     accoid = get_accoid(IGSTAc,headData['company_code'])
#                     add_gledger_entry(gledger_entries, headData, RCMIGST, "C", IGSTAc, accoid, headData['transport'],ordercode,'RCM IGST',0,0,'RCM IGST')
        
#         if vasuli_amount != 0:
#             ordercode=ordercode+1
#             accoid = get_accoid(transport,headData['company_code'])
#             add_gledger_entry(gledger_entries, headData, vasuli_amount, 'D', transport, accoid,transport,ordercode,'Vasuli Amount',0,0,'Vasuli Amount')

#             ordercode=ordercode+1
#             accoid = get_accoid(1,headData['company_code'])
#             add_gledger_entry(gledger_entries, headData, vasuli_amount, 'C', transport, accoid,transport,ordercode,'Vasuli Amount',0,0,'Vasuli Amount')


        
#     else:
#         if TDSAc != 0 :      
#             if TDSAmt != 0 :
#                 ordercode=ordercode+1
#                 accoid = get_accoid(TDSAc,headData['company_code'])
#                 add_gledger_entry(gledger_entries, headData, TDSAmt, 'C', TDSAc, accoid,9999971,ordercode,"",0,0,"Delivery Order" + str(headData['doc_no']))

#                 ordercode=ordercode+1
#                 accoid = get_accoid(transporttdsac,headData['company_code'])
#                 add_gledger_entry(gledger_entries, headData, TDSAmt, 'D', transporttdsac, accoid,transporttdsac,ordercode,"",0,0,"Delivery Order" + str(headData['doc_no']))
            
#         if vasuli_amount != 0:
#             ordercode=ordercode+1
#             accoid = get_accoid(transport,headData['company_code'])
#             add_gledger_entry(gledger_entries, headData, vasuli_amount, 'D', transport, accoid,transport,ordercode,"",0,0,"Delivery Order" + str(headData['doc_no']))

#             ordercode=ordercode+1
#             accoid = get_accoid(1,headData['company_code'])
#             add_gledger_entry(gledger_entries, headData, vasuli_amount, 'C', 1, accoid,transport,ordercode,"",0,0,"Delivery Order:" + str(headData['doc_no']))

#         if Freight_Amount != 0:
#             ordercode = ordercode+1
#             accoid = get_accoid(transport,headData['company_code'])
#             add_gledger_entry(gledger_entries, headData, Freight_Amount, "C", transport, accoid,transport,ordercode,NarrationForFreight,0,0,NarrationForFreight)


#             ordercode = ordercode+1
#             ac_code = company_parameters.Freight_Ac
#             accoid = get_accoid(ac_code,headData['company_code'])
#             add_gledger_entry(gledger_entries, headData, Freight_Amount, "D", ac_code, accoid,transport,ordercode,NarrationForFreight,0,0,NarrationForFreight)
                
                
            
#         if Memo_Advance != 0 :
#                 # ordercode=ordercode+1
#                 # accoid = get_accoid(transport,headData['company_code'])
#                 # add_gledger_entry(gledger_entries, headData, Memo_Advance, "C", transport, accoid,transport,ordercode,"",0,0,"Being Delivery Order: " + str(headData['doc_no']))
                
                
#                 # ordercode=ordercode+1
#                 # Freight_Ac=company_parameters.Freight_Ac
#                 # accoid = get_accoid(Freight_Ac,headData['company_code'])
#                 # add_gledger_entry(gledger_entries, headData, Memo_Advance, "D", Freight_Ac, accoid,Freight_Ac,ordercode,"",0,0,"Being Delivery Order: " + str(headData['doc_no']))
                
#                 if MemoGstRate != 0:
#                     RCMCGST=float(new_sale_data.get('RCMCGSTAmt', 0) or 0)
#                     RCMSGST=float(new_sale_data.get('RCMSGSTAmt', 0) or 0)
#                     RCMIGST=float(new_sale_data.get('RCMIGSTAmt', 0) or 0)
                  

#                     if RCMCGST > 0:
#                         ordercode=ordercode+1
#                         CGST_RCM_Ac=company_parameters.CGST_RCM_Ac
#                         accoid = get_accoid(CGST_RCM_Ac,headData['company_code'])
#                         add_gledger_entry(gledger_entries, headData, RCMCGST, "D", CGST_RCM_Ac, accoid,headData['transport'],ordercode,"",0,0,"RCM CGST")
                        
#                         ordercode=ordercode+1
#                         CCGSTAc=company_parameters.CGSTAc
#                         accoid = get_accoid(CCGSTAc,headData['company_code'])
#                         add_gledger_entry(gledger_entries, headData, RCMCGST, "C", CCGSTAc, accoid,headData['transport'],ordercode,"",0,0,"RCM CGST")
                        
#                     if RCMSGST > 0:
#                         ordercode=ordercode+1
#                         SGST_RCM_Ac=company_parameters.SGST_RCM_Ac
#                         accoid = get_accoid(SGST_RCM_Ac,headData['company_code'])
#                         add_gledger_entry(gledger_entries, headData, RCMSGST, "D", SGST_RCM_Ac, accoid,headData['transport'],ordercode,"",0,0,"RCM SGST")
                    
#                         ordercode=ordercode+1
#                         SGSTAc=company_parameters.SGSTAc
#                         accoid = get_accoid(SGSTAc,headData['company_code'])
#                         add_gledger_entry(gledger_entries, headData, RCMSGST, "C", SGSTAc, accoid, headData['transport'],ordercode,"",0,0,"RCM SGST")
                        
#                     if RCMIGST > 0:
#                         ordercode=ordercode+1
#                         IGST_RCM_Ac=company_parameters.IGST_RCM_Ac
#                         accoid = get_accoid(IGST_RCM_Ac,headData['company_code'])
#                         add_gledger_entry(gledger_entries, headData, RCMIGST, "D", IGST_RCM_Ac, accoid,headData['transport'],ordercode,"",0,0,"RCM IGST")
                        
#                         ordercode=ordercode+1
#                         IGSTAc=company_parameters.IGSTAc
#                         accoid = get_accoid(IGSTAc,headData['company_code'])
#                         add_gledger_entry(gledger_entries, headData, RCMIGST, "C", IGSTAc, accoid,headData['transport'],ordercode,"",0,0,"RCM IGST")
        
#     return gledger_entries


# #GET Gledger Balance from the particular accounts
# def get_balances_for_multiple_accounts(ac_codes, company_code, year_code=None):
#     try:
#         ac_codes = [int(ac_code) for ac_code in ac_codes]

#         if not ac_codes or not company_code:
#             raise ValueError("Missing required parameters")

#         balances = {
#             "millBalance": []
#         }

#         group_type_query = text('''
#             SELECT dbo.nt_1_bsgroupmaster.group_Type 
#             FROM dbo.nt_1_gledger 
#             INNER JOIN dbo.nt_1_accountmaster 
#                 ON dbo.nt_1_gledger.AC_CODE = dbo.nt_1_accountmaster.Ac_Code 
#                 AND dbo.nt_1_gledger.COMPANY_CODE = dbo.nt_1_accountmaster.company_code 
#             INNER JOIN dbo.nt_1_bsgroupmaster 
#                 ON dbo.nt_1_accountmaster.Group_Code = dbo.nt_1_bsgroupmaster.group_Code 
#                 AND dbo.nt_1_accountmaster.company_code = dbo.nt_1_bsgroupmaster.Company_Code
#             WHERE dbo.nt_1_gledger.AC_CODE=:ac_code 
#               AND dbo.nt_1_gledger.COMPANY_CODE=:company_code
#             ORDER BY dbo.nt_1_gledger.AC_CODE
#         ''')

#         for ac_code in ac_codes:
#             group_type_result = db.session.execute(group_type_query, {'ac_code': ac_code, 'company_code': company_code}).fetchone()

#             if not group_type_result:
#                 balances['millBalance'].append({'ac_code': ac_code, 'error': 'Data Not Found'})
#                 continue

#             group_type = group_type_result[0].strip() if group_type_result[0] else ''

#             query_str = '''
#                 SELECT SUM(CASE dbo.nt_1_gledger.DRCR 
#                            WHEN 'D' THEN dbo.nt_1_gledger.AMOUNT 
#                            WHEN 'C' THEN -dbo.nt_1_gledger.AMOUNT END) AS Balance,
#                        dbo.nt_1_bsgroupmaster.group_Type,dbo.nt_1_accountmaster.Gst_No
#                 FROM dbo.nt_1_gledger
#                 INNER JOIN dbo.nt_1_accountmaster 
#                     ON dbo.nt_1_gledger.AC_CODE = dbo.nt_1_accountmaster.Ac_Code 
#                     AND dbo.nt_1_gledger.COMPANY_CODE = dbo.nt_1_accountmaster.company_code 
#                 INNER JOIN dbo.nt_1_bsgroupmaster 
#                     ON dbo.nt_1_accountmaster.Group_Code = dbo.nt_1_bsgroupmaster.group_Code 
#                     AND dbo.nt_1_accountmaster.company_code = dbo.nt_1_bsgroupmaster.Company_Code
#                 WHERE dbo.nt_1_gledger.AC_CODE = :ac_code 
#                   AND dbo.nt_1_gledger.COMPANY_CODE = :company_code
#             '''

#             query_params = {'ac_code': ac_code, 'company_code': company_code}

#             if group_type.upper() != 'B' and year_code:
#                 query_str += ' AND dbo.nt_1_gledger.YEAR_CODE = :year_code'
#                 query_params['year_code'] = year_code

#             query_str += ' GROUP BY dbo.nt_1_bsgroupmaster.group_Type,dbo.nt_1_accountmaster.Gst_No'

#             query = text(query_str)
#             result = db.session.execute(query, query_params).fetchone()

#             if not result:
#                 balances['millBalance'].append({'ac_code': ac_code, 'error': 'No balance data found'})
#             else:

#                 balances['millBalance'].append({'ac_code': ac_code, 'balance': result.Balance,'Gst_No': result.Gst_No or ""})

#         return balances

#     except SQLAlchemyError as error:
#         print("Error fetching balance:", error)
#         db.session.rollback()  
#         return {'error': 'Internal server error'}

#     except ValueError as ve:
#         return {'error': str(ve)}
























from sqlalchemy import text, func
from app import app, db
import asyncio
import aiohttp
import os
from flask import Flask, jsonify, request
from app.models.BusinessReleted.DeliveryOrder.DeliveryOrderModels import DeliveryOrderHead, DeliveryOrderDetail
from app.models.BusinessReleted.TenderPurchase.TenderPurchaseModels import TenderHead, TenderDetails
from app.utils.CommonGLedgerFunctions import get_accoid, fetch_company_parameters, get_ac_Name
from sqlalchemy.exc import SQLAlchemyError

API_URL_SERVER = os.getenv('API_URL_SERVER')


# ─────────────────────────────────────────────────────────────────────────────
# In-memory cache for accoid / ac_name so they are never fetched twice per
# request.  Keys: (ac_code, company_code)
# ─────────────────────────────────────────────────────────────────────────────

_accoid_cache: dict = {}
_acname_cache: dict = {}


def get_accoid_cached(ac_code, company_code) -> int:
    """Return accoid, hitting DB only once per (ac_code, company_code) pair."""
    key = (ac_code, company_code)
    if key not in _accoid_cache:
        _accoid_cache[key] = get_accoid(ac_code, company_code)
    return _accoid_cache[key]


def get_ac_name_cached(ac_code, company_code) -> str:
    """Return account name, hitting DB only once per (ac_code, company_code) pair."""
    key = (ac_code, company_code)
    if key not in _acname_cache:
        _acname_cache[key] = get_ac_Name(ac_code, company_code)
    return _acname_cache[key]


def clear_lookup_caches():
    """Call this at the start of each request handler to avoid stale data."""
    _accoid_cache.clear()
    _acname_cache.clear()


# ─────────────────────────────────────────────────────────────────────────────
# Async HTTP helpers
# ─────────────────────────────────────────────────────────────────────────────

def _internal_auth_kwargs():
    # These helpers call this same Flask app's own API (gLedger/purchase/sale
    # records) over HTTP. Since the global JWT auth gate (app/__init__.py) now
    # requires a token on every route, forward the caller's own session cookie
    # and CSRF token so the internal call is accepted the same way the original
    # browser request was.
    cookies = dict(request.cookies) if request else {}
    headers = {'X-CSRF-TOKEN': cookies.get('csrf_access_token', '')}
    return {'cookies': cookies, 'headers': headers}


async def async_post(url, params=None, json=None):
    async with aiohttp.ClientSession() as session:
        async with session.post(url, params=params, json=json, **_internal_auth_kwargs()) as response:
            return await response.json(), response.status


async def async_put(url, params=None, json=None):
    async with aiohttp.ClientSession() as session:
        async with session.put(url, params=params, json=json, **_internal_auth_kwargs()) as response:
            return await response.json(), response.status


async def async_delete(url, params=None, json=None):
    async with aiohttp.ClientSession() as session:
        async with session.delete(url, params=params, json=json, **_internal_auth_kwargs()) as response:
            return await response.json(), response.status


# ─────────────────────────────────────────────────────────────────────────────
# Rollback helpers for already-created external records
# Call these when a later step fails and you need to undo earlier API calls.
# ─────────────────────────────────────────────────────────────────────────────

async def rollback_gledger(company_code, doc_no, year_code, tran_type):
    try:
        await async_delete(
            API_URL_SERVER + "/delete-Record-gLedger",
            params={
                'Company_Code': company_code,
                'DOC_NO': doc_no,
                'Year_Code': year_code,
                'TRAN_TYPE': tran_type,
            }
        )
    except Exception as e:
        print(f"[rollback_gledger] warning: {e}")


async def rollback_purchase_bill(company_code, year_code, purchase_doc_no, purchaseid):
    try:
        await async_delete(
            API_URL_SERVER + "/delete_data_SugarPurchase",
            params={
                'Company_Code': company_code,
                'doc_no': purchase_doc_no,
                'Year_Code': year_code,
                'purchaseid': purchaseid,
                'tran_type': 'PS',
            }
        )
    except Exception as e:
        print(f"[rollback_purchase_bill] warning: {e}")


async def rollback_sale_bill(company_code, year_code, sale_doc_no, saleid):
    try:
        await async_delete(
            API_URL_SERVER + "/delete_data_by_saleid",
            params={
                'Company_Code': company_code,
                'doc_no': sale_doc_no,
                'Year_Code': year_code,
                'saleid': saleid,
            }
        )
    except Exception as e:
        print(f"[rollback_sale_bill] warning: {e}")


async def rollback_commission_bill(company_code, year_code, tran_type, doc_no):
    try:
        await async_delete(
            API_URL_SERVER + "/delete-CommissionBill",
            params={
                'Company_Code': company_code,
                'Year_Code': year_code,
                'Tran_Type': tran_type,
                'doc_no': doc_no,
            }
        )
    except Exception as e:
        print(f"[rollback_commission_bill] warning: {e}")


async def rollback_tender_stock(tenderid, tender_no, tenderdetailid, original_qty):
    try:
        revert_entry = {
            "detailData": [
                {
                    "rowaction": "delete",
                    "tenderid": tenderid,
                    "tenderdetailid": tenderdetailid,
                },
                {
                    "rowaction": "restore_qty",   # handled server-side if supported
                    "tenderid": tenderid,
                    "Buyer_Quantal": original_qty,
                    "ID": 1,
                }
            ]
        }
        await async_put(
            API_URL_SERVER + "/Stock_Entry_tender_purchase",
            params={'tenderid': tenderid, 'Tender_No': tender_no},
            json=revert_entry,
        )
    except Exception as e:
        print(f"[rollback_tender_stock] warning: {e}")


# ─────────────────────────────────────────────────────────────────────────────
# Max doc_no helper
# ─────────────────────────────────────────────────────────────────────────────

def get_max_doc_no(company_code, year_code):
    return (
        db.session.query(func.max(DeliveryOrderHead.doc_no))
        .filter(DeliveryOrderHead.company_code == company_code,
                DeliveryOrderHead.Year_Code == year_code)
        .scalar() or 0
    )


# ─────────────────────────────────────────────────────────────────────────────
# Strip UI-only fields before saving to the model
# ─────────────────────────────────────────────────────────────────────────────

_REMOVE_COLUMNS = [
    'TaxableAmountForSB', 'cgstrate', 'sgstrate', 'igstrate', 'cgstamt',
    'sgstamt', 'igstamt', 'SaleDetail_Rate', 'SB_freight', 'SB_SubTotal',
    'SB_Less_Frt_Rate', 'TotalGstSaleBillAmount', 'Roundoff', 'SBTCSAmt',
    'Net_Payble', 'SBTDSAmt', 'save', 'sale', 'item_Amount', 'SB_Ac_Code',
    'SB_Unit_Code', 'PS_CGSTAmount', 'PS_SGSTAmount', 'PS_IGSTAmount',
    'PS_CGSTRATE', 'PS_SGSTRATE', 'PS_IGSTRATE', 'TOTALPurchase_Amount',
    'PSTCS_Amt', 'PSTDS_Amt', 'PSNetPayble', 'PS_SelfBal', 'PS_amount',
    'lblgetpasscodename', 'lblvoucherByname', 'Gst_Rate', 'AutopurchaseBill',
    'LV_CGSTAmount', 'LV_SGSTAmount', 'LV_IGSTAmount', 'LV_TotalAmount',
    'LV_TCSRate', 'LV_NETPayble', 'LV_TCSAmt', 'LV_TDSRate', 'LV_TDSAmt',
    'LV_Igstrate', 'LV_Cgstrate', 'LV_taxableamount', 'LV_Sgstrate',
    'LV_Commision_Amt', 'LV_tender_Commision_Amt', 'gstratename', 'Gstrate',
    'lblitemname', 'newbroker', 'lblbrokername',
]


def remove_columns_from_data(data, columns_to_remove=None):
    cols = columns_to_remove if columns_to_remove is not None else _REMOVE_COLUMNS
    for key in cols:
        data.pop(key, None)
    return data


# ─────────────────────────────────────────────────────────────────────────────
# gLedger entry builder
# ─────────────────────────────────────────────────────────────────────────────

async def genrate_gledger_entries(
    headData, company_parameters, getpasscode, selfac,
    new_doc_no, add_gledger_entry, new_sale_data
):
    gledger_entries = []
    ordercode = 0

    vasuli_amount1 = float(headData['vasuli_amount1'])
    vasuli_amount = float(headData['vasuli_amount'])
    TDSAc = headData['TDSAc']
    TDSAmt = float(headData['TDSAmt'])
    TDSCut = headData['TDSCut']
    transport = headData['transport']
    Memo_Advance = float(headData['Memo_Advance'])
    MemoGstRate = float(headData['MemoGSTRate'])
    Freight_Amount = float(headData['Freight_Amount'])
    truck_no = headData['truck_no']
    mill_code = headData['mill_code']
    company_code = headData['company_code']

    # Use cached lookups — avoids repeated DB hits
    transporterName = get_ac_name_cached(transport, company_code)
    millName = get_ac_name_cached(mill_code, company_code)

    NarrationForFreight = (
        f"Truck No.{truck_no}#"
        f"{millName}-"
        f"{transporterName}"
    )

    transporttdsac = transport if TDSCut == 'N' else company_parameters.TransportTDS_AcCut

    def _accoid(ac):
        return get_accoid_cached(ac, company_code)

    # ── helper to build RCM entries ──────────────────────────────────────────
    def add_rcm_entries(entries, hd, sale_data, narration_prefix):
        nonlocal ordercode
        RCMCGST = float(sale_data.get('RCMCGSTAmt', 0) or 0)
        RCMSGST = float(sale_data.get('RCMSGSTAmt', 0) or 0)
        RCMIGST = float(sale_data.get('RCMIGSTAmt', 0) or 0)
        trp = hd['transport']

        if RCMCGST > 0:
            ordercode += 1
            ac = company_parameters.CGST_RCM_Ac
            add_gledger_entry(entries, hd, RCMCGST, "D", ac, _accoid(ac), trp, ordercode, f"RCM CGST", 0, 0, "RCM CGST")
            ordercode += 1
            ac = company_parameters.CGSTAc
            add_gledger_entry(entries, hd, RCMCGST, "C", ac, _accoid(ac), trp, ordercode, f"RCM CGST", 0, 0, "RCM CGST")

        if RCMSGST > 0:
            ordercode += 1
            ac = company_parameters.SGST_RCM_Ac
            add_gledger_entry(entries, hd, RCMSGST, "D", ac, _accoid(ac), trp, ordercode, "RCM SGST", 0, 0, "RCM SGST")
            ordercode += 1
            ac = company_parameters.SGSTAc
            add_gledger_entry(entries, hd, RCMSGST, "C", ac, _accoid(ac), trp, ordercode, "RCM SGST", 0, 0, "RCM SGST")

        if RCMIGST > 0:
            ordercode += 1
            ac = company_parameters.IGST_RCM_Ac
            add_gledger_entry(entries, hd, RCMIGST, "D", ac, _accoid(ac), trp, ordercode, "RCM IGST", 0, 0, "RCM IGST")
            ordercode += 1
            ac = company_parameters.IGSTAc
            add_gledger_entry(entries, hd, RCMIGST, "C", ac, _accoid(ac), trp, ordercode, "RCM IGST", 0, 0, "RCM IGST")

    # ── branch: getpasscode != selfac ────────────────────────────────────────
    if getpasscode != selfac:
        if vasuli_amount1 != 0:
            ordercode += 1
            GETPASSCODE = headData['GETPASSCODE']
            add_gledger_entry(gledger_entries, headData, vasuli_amount1, 'D',
                              GETPASSCODE, _accoid(GETPASSCODE), 0, ordercode,
                              'Vasuli Amount', 0, 0, "Vasuli Amount")
            ordercode += 1
            Vasuli_Ac = headData['Vasuli_Ac']
            add_gledger_entry(gledger_entries, headData, vasuli_amount1, 'D',
                              Vasuli_Ac, _accoid(Vasuli_Ac), 9999971, ordercode,
                              'Vasuli Amount', 0, 0, "Vasuli Amount")

        if TDSAc != 0 and TDSAmt != 0:
            ordercode += 1
            add_gledger_entry(gledger_entries, headData, TDSAmt, 'C',
                              TDSAc, _accoid(TDSAc), 9999971, ordercode,
                              'TDS Amount', 0, 0, 'TDS Amount')
            ordercode += 1
            add_gledger_entry(gledger_entries, headData, TDSAmt, 'D',
                              transporttdsac, _accoid(transporttdsac), transporttdsac, ordercode,
                              'TDS Amount', 0, 0, 'TDS Amount')

        if Freight_Amount != 0:
            ordercode += 1
            add_gledger_entry(gledger_entries, headData, Freight_Amount, "C",
                              transport, _accoid(transport), transport, ordercode,
                              NarrationForFreight, 0, 0, NarrationForFreight)
            ordercode += 1
            ac_code = company_parameters.Freight_Ac
            add_gledger_entry(gledger_entries, headData, Freight_Amount, "D",
                              ac_code, _accoid(ac_code), transport, ordercode,
                              NarrationForFreight, 0, 0, NarrationForFreight)

        if Memo_Advance != 0 and MemoGstRate != 0:
            add_rcm_entries(gledger_entries, headData, new_sale_data, "RCM")

        if vasuli_amount != 0:
            ordercode += 1
            add_gledger_entry(gledger_entries, headData, vasuli_amount, 'D',
                              transport, _accoid(transport), transport, ordercode,
                              'Vasuli Amount', 0, 0, 'Vasuli Amount')
            ordercode += 1
            add_gledger_entry(gledger_entries, headData, vasuli_amount, 'C',
                              transport, _accoid(1), transport, ordercode,
                              'Vasuli Amount', 0, 0, 'Vasuli Amount')

    # ── branch: getpasscode == selfac ────────────────────────────────────────
    else:
        if TDSAc != 0 and TDSAmt != 0:
            do_narr = "Delivery Order" + str(headData['doc_no'])
            ordercode += 1
            add_gledger_entry(gledger_entries, headData, TDSAmt, 'C',
                              TDSAc, _accoid(TDSAc), 9999971, ordercode, "", 0, 0, do_narr)
            ordercode += 1
            add_gledger_entry(gledger_entries, headData, TDSAmt, 'D',
                              transporttdsac, _accoid(transporttdsac), transporttdsac, ordercode,
                              "", 0, 0, do_narr)

        if vasuli_amount != 0:
            do_narr = "Delivery Order" + str(headData['doc_no'])
            ordercode += 1
            add_gledger_entry(gledger_entries, headData, vasuli_amount, 'D',
                              transport, _accoid(transport), transport, ordercode,
                              "", 0, 0, do_narr)
            ordercode += 1
            add_gledger_entry(gledger_entries, headData, vasuli_amount, 'C',
                              1, _accoid(1), transport, ordercode, "", 0, 0,
                              "Delivery Order:" + str(headData['doc_no']))

        if Freight_Amount != 0:
            ordercode += 1
            add_gledger_entry(gledger_entries, headData, Freight_Amount, "C",
                              transport, _accoid(transport), transport, ordercode,
                              NarrationForFreight, 0, 0, NarrationForFreight)
            ordercode += 1
            ac_code = company_parameters.Freight_Ac
            add_gledger_entry(gledger_entries, headData, Freight_Amount, "D",
                              ac_code, _accoid(ac_code), transport, ordercode,
                              NarrationForFreight, 0, 0, NarrationForFreight)

        if Memo_Advance != 0 and MemoGstRate != 0:
            add_rcm_entries(gledger_entries, headData, new_sale_data, "RCM")

    return gledger_entries


# ─────────────────────────────────────────────────────────────────────────────
# Balance fetch for multiple accounts
# ─────────────────────────────────────────────────────────────────────────────

def get_balances_for_multiple_accounts(ac_codes, company_code, year_code=None):
    try:
        ac_codes = [int(ac) for ac in ac_codes]
        if not ac_codes or not company_code:
            raise ValueError("Missing required parameters")

        balances = {"millBalance": []}

        group_type_query = text('''
            SELECT dbo.nt_1_bsgroupmaster.group_Type
            FROM dbo.nt_1_gledger
            INNER JOIN dbo.nt_1_accountmaster
                ON dbo.nt_1_gledger.AC_CODE = dbo.nt_1_accountmaster.Ac_Code
                AND dbo.nt_1_gledger.COMPANY_CODE = dbo.nt_1_accountmaster.company_code
            INNER JOIN dbo.nt_1_bsgroupmaster
                ON dbo.nt_1_accountmaster.Group_Code = dbo.nt_1_bsgroupmaster.group_Code
                AND dbo.nt_1_accountmaster.company_code = dbo.nt_1_bsgroupmaster.Company_Code
            WHERE dbo.nt_1_gledger.AC_CODE = :ac_code
              AND dbo.nt_1_gledger.COMPANY_CODE = :company_code
            ORDER BY dbo.nt_1_gledger.AC_CODE
        ''')

        for ac_code in ac_codes:
            gt_result = db.session.execute(
                group_type_query, {'ac_code': ac_code, 'company_code': company_code}
            ).fetchone()

            if not gt_result:
                balances['millBalance'].append({'ac_code': ac_code, 'error': 'Data Not Found'})
                continue

            group_type = (gt_result[0] or '').strip()

            query_str = '''
                SELECT SUM(CASE dbo.nt_1_gledger.DRCR
                           WHEN 'D' THEN dbo.nt_1_gledger.AMOUNT
                           WHEN 'C' THEN -dbo.nt_1_gledger.AMOUNT END) AS Balance,
                       dbo.nt_1_bsgroupmaster.group_Type,
                       dbo.nt_1_accountmaster.Gst_No
                FROM dbo.nt_1_gledger
                INNER JOIN dbo.nt_1_accountmaster
                    ON dbo.nt_1_gledger.AC_CODE = dbo.nt_1_accountmaster.Ac_Code
                    AND dbo.nt_1_gledger.COMPANY_CODE = dbo.nt_1_accountmaster.company_code
                INNER JOIN dbo.nt_1_bsgroupmaster
                    ON dbo.nt_1_accountmaster.Group_Code = dbo.nt_1_bsgroupmaster.group_Code
                    AND dbo.nt_1_accountmaster.company_code = dbo.nt_1_bsgroupmaster.Company_Code
                WHERE dbo.nt_1_gledger.AC_CODE = :ac_code
                  AND dbo.nt_1_gledger.COMPANY_CODE = :company_code
            '''
            params = {'ac_code': ac_code, 'company_code': company_code}

            if group_type.upper() != 'B' and year_code:
                query_str += ' AND dbo.nt_1_gledger.YEAR_CODE = :year_code'
                params['year_code'] = year_code

            query_str += ' GROUP BY dbo.nt_1_bsgroupmaster.group_Type, dbo.nt_1_accountmaster.Gst_No'

            result = db.session.execute(text(query_str), params).fetchone()
            if not result:
                balances['millBalance'].append({'ac_code': ac_code, 'error': 'No balance data found'})
            else:
                balances['millBalance'].append({
                    'ac_code': ac_code,
                    'balance': result.Balance,
                    'Gst_No': result.Gst_No or "",
                })

        return balances

    except SQLAlchemyError as error:
        print("Error fetching balance:", error)
        db.session.rollback()
        return {'error': 'Internal server error'}
    except ValueError as ve:
        return {'error': str(ve)}
