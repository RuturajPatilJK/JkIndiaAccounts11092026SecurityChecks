from app import app, db
from flask import request, jsonify
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import text
from datetime import datetime
import os
from app.utils.CommonGLedgerFunctions import fetch_company_parameters

API_URL = os.getenv('API_URL')


def format_date(val):
    return val.strftime('%Y-%m-%d') if val else None


@app.route(API_URL + '/tender-balance-report', methods=['GET'])
def tender_balance_report():

    try:
        
        company_code = request.args.get('company_code')
        year_code    = request.args.get('year_code')
        tender_no    = request.args.get('tender_no')

        try:
            company_code = int(company_code) if company_code else None
            year_code    = int(year_code)    if year_code    else None
        except ValueError:
            return jsonify({'error': 'company_code and year_code must be integers'}), 400

        tender_sql = '''
            SELECT        dbo.qrytenderhead.Tender_No, dbo.qrytenderhead.Company_Code, dbo.qrytenderhead.Tender_Date, dbo.qrytenderhead.Tender_DateConverted, dbo.qrytenderhead.Lifting_Date, dbo.qrytenderhead.Lifting_DateConverted, 
                         dbo.qrytenderhead.Mill_Code, dbo.qrytenderhead.Grade, dbo.qrytenderhead.Quantal, dbo.qrytenderhead.Packing, dbo.qrytenderhead.Bags, dbo.qrytenderhead.Payment_To, dbo.qrytenderhead.Tender_From, 
                         dbo.qrytenderhead.Tender_DO, dbo.qrytenderhead.Voucher_By, dbo.qrytenderhead.Broker, dbo.qrytenderhead.Excise_Rate, dbo.qrytenderhead.Narration, dbo.qrytenderhead.Mill_Rate, dbo.qrytenderhead.Created_By, 
                         dbo.qrytenderhead.Modified_By, dbo.qrytenderhead.Year_Code, dbo.qrytenderhead.Purc_Rate, dbo.qrytenderhead.type, dbo.qrytenderhead.Branch_Id, dbo.qrytenderhead.Voucher_No, dbo.qrytenderhead.Sell_Note_No, 
                         dbo.qrytenderhead.Brokrage, dbo.qrytenderhead.tenderid, dbo.qrytenderhead.mc, dbo.qrytenderhead.itemcode, dbo.qrytenderhead.season, dbo.qrytenderhead.pt, dbo.qrytenderhead.tf, dbo.qrytenderhead.td, 
                         dbo.qrytenderhead.vb, dbo.qrytenderhead.bk, dbo.qrytenderhead.ic, dbo.qrytenderhead.itemname, dbo.qrytenderhead.brokername, dbo.qrytenderhead.voucherbyname, dbo.qrytenderhead.tenderdoname, 
                         dbo.qrytenderhead.tenderfromname, dbo.qrytenderhead.paymenttoname, dbo.qrytenderhead.millname, dbo.qrytenderhead.millgstno, dbo.qrytenderhead.millstatecode, dbo.qrytenderhead.paymenttogstno, 
                         dbo.qrytenderhead.paymenttogststatecode, dbo.qrytenderhead.paymenttocityname, dbo.qrytenderhead.paymenttocitypincode, dbo.qrytenderhead.paymenttocitystate, dbo.qrytenderhead.paymenttocitygststatecode, 
                         dbo.qrytenderhead.voucherbycityname, dbo.qrytenderhead.voucherbycitypincode, dbo.qrytenderhead.voucherbycitystate, dbo.qrytenderhead.voucherbycitygststatecode, dbo.qrytenderhead.brokercityname, 
                         dbo.qrytenderhead.brokercitypincode, dbo.qrytenderhead.brokercitystate, dbo.qrytenderhead.brokercitygststatecode, dbo.qrytenderhead.millcodecityname, dbo.qrytenderhead.millcodecitypincode, 
                         dbo.qrytenderhead.millcodecitystate, dbo.qrytenderhead.millcodecitygststatecode, dbo.qrytenderhead.tendorfromcityname, dbo.qrytenderhead.tendorfromcitypincode, dbo.qrytenderhead.tendorfromcitystate, 
                         dbo.qrytenderhead.tendorfromcitygststatecode, dbo.qrytenderhead.tendorduocityname, dbo.qrytenderhead.tendorduocitypincode, dbo.qrytenderhead.tendorduocitystate, dbo.qrytenderhead.tendorduocitygststatecode, 
                         dbo.qrytenderhead.millshortname, dbo.qrytenderhead.gstratecode, dbo.qrytenderhead.gstratename, dbo.qrytenderhead.gstrate, dbo.qrytenderhead.igstrate, dbo.qrytenderhead.sgstrate, dbo.qrytenderhead.cgstrate, 
                         dbo.qrytenderhead.tenderdoshortname, dbo.qrytenderhead.CashDiff, dbo.qrytenderhead.TCS_Rate, dbo.qrytenderhead.TCS_Amt, dbo.qrytenderhead.commissionid, dbo.qrytenderhead.Voucher_Type, 
                         dbo.qrytenderhead.Party_Bill_Rate, dbo.qrytenderhead.TDS_Rate, dbo.qrytenderhead.TDS_Amt, dbo.qrytenderhead.Temptender, dbo.qrytenderhead.HSN, dbo.qrytenderhead.brokermobno, dbo.qrytenderhead.AutoPurchaseBill, 
                         dbo.qrytenderhead.brokershortname, dbo.qrytenderhead.Unit, dbo.qrytenderhead.millStatename, dbo.qrytenderhead.gstid, dbo.qrytenderhead.Adjusted, ISNULL(dbo.qryTenderSoldqty.solqntl, 0) AS soldqty, 
                         dbo.qrytenderhead.Quantal - ISNULL(dbo.qryTenderSoldqty.solqntl, 0) AS selfbalance,dbo.qrytenderhead.PaymentToShortName
FROM            dbo.qrytenderhead LEFT OUTER JOIN
                         dbo.qryTenderSoldqty ON dbo.qrytenderhead.tenderid = dbo.qryTenderSoldqty.tenderid
WHERE        (dbo.qrytenderhead.Quantal - ISNULL(dbo.qryTenderSoldqty.solqntl, 0) <> 0)
        '''

        params = {}

        if company_code is not None:
            tender_sql += ' AND dbo.qrytenderhead.Company_Code = :company_code'
            params['company_code'] = company_code

        if year_code is not None:
            tender_sql += ' AND dbo.qrytenderhead.Year_Code = :year_code'
            params['year_code'] = year_code

        if tender_no:
            tender_sql += ' AND dbo.qrytenderhead.Tender_No = :tender_no'
            params['tender_no'] = tender_no

        tender_sql += (
            ' ORDER BY dbo.qrytenderhead.Tender_Date,'
            ' dbo.qrytenderhead.Tender_No'
        )

        with db.session.begin():
            tender_rows = db.session.execute(
                text(tender_sql), params
            ).fetchall()

            if not tender_rows:
                return jsonify([])


            unique_accounts = {}
            for row in tender_rows:
                if not row.Payment_To:
                    continue
                key = (row.Payment_To, row.Company_Code, row.Year_Code)
                if key not in unique_accounts:
                    unique_accounts[key] = {
                        'ac_code':      row.Payment_To,
                        'company_code': row.Company_Code,
                        'year_code':    row.Year_Code,
                    }

            # ── Step 3: fetch ledger balance for every unique account ─────
            balance_map = {}  

            for key, acc in unique_accounts.items():
                ac_code   = acc['ac_code']
                comp_code = acc['company_code']
                yr_code   = acc['year_code']

                # 3a. resolve group_type (determines year-filter logic)
                gt_row = db.session.execute(text('''
                    SELECT TOP 1
                        dbo.nt_1_bsgroupmaster.group_Type
                    FROM dbo.nt_1_gledger
                    INNER JOIN dbo.nt_1_accountmaster
                        ON  dbo.nt_1_gledger.AC_CODE      = dbo.nt_1_accountmaster.Ac_Code
                        AND dbo.nt_1_gledger.COMPANY_CODE = dbo.nt_1_accountmaster.company_code
                    INNER JOIN dbo.nt_1_bsgroupmaster
                        ON  dbo.nt_1_accountmaster.Group_Code   = dbo.nt_1_bsgroupmaster.group_Code
                        AND dbo.nt_1_accountmaster.company_code = dbo.nt_1_bsgroupmaster.Company_Code
                    WHERE dbo.nt_1_gledger.AC_CODE      = :ac_code
                      AND dbo.nt_1_gledger.COMPANY_CODE = :company_code
                '''), {'ac_code': ac_code, 'company_code': comp_code}).fetchone()

                if not gt_row:
                    balance_map[key] = {'Balance': 0.0, 'BalanceLabel': ''}
                    continue

                group_type = (gt_row[0] or '').strip().upper()

                # 3b. build balance query
                bal_sql = '''
                    SELECT SUM(
                        CASE dbo.nt_1_gledger.DRCR
                            WHEN 'D' THEN  dbo.nt_1_gledger.AMOUNT
                            WHEN 'C' THEN -dbo.nt_1_gledger.AMOUNT
                        END
                    ) AS Balance
                    FROM dbo.nt_1_gledger
                    INNER JOIN dbo.nt_1_accountmaster
                        ON  dbo.nt_1_gledger.AC_CODE      = dbo.nt_1_accountmaster.Ac_Code
                        AND dbo.nt_1_gledger.COMPANY_CODE = dbo.nt_1_accountmaster.company_code
                    INNER JOIN dbo.nt_1_bsgroupmaster
                        ON  dbo.nt_1_accountmaster.Group_Code   = dbo.nt_1_bsgroupmaster.group_Code
                        AND dbo.nt_1_accountmaster.company_code = dbo.nt_1_bsgroupmaster.Company_Code
                    WHERE dbo.nt_1_gledger.AC_CODE      = :ac_code
                      AND dbo.nt_1_gledger.COMPANY_CODE = :company_code
                '''
                bal_params = {'ac_code': ac_code, 'company_code': comp_code}

    
                if group_type != 'B' and yr_code:
                    bal_sql += ' AND dbo.nt_1_gledger.YEAR_CODE = :year_code'
                    bal_params['year_code'] = yr_code

                bal_row = db.session.execute(
                    text(bal_sql), bal_params
                ).fetchone()

                raw = float(bal_row.Balance) if (bal_row and bal_row.Balance is not None) else 0.0

                balance_map[key] = {
                    'Balance':      raw,
                    'BalanceLabel': 'Dr' if raw > 0 else ('Cr' if raw < 0 else ''),
                }

        # ── Step 4: assemble final JSON ───────────────────────────────────
        response = []
        for row in tender_rows:
            d = row._asdict()

            # Format date fields
            d['Tender_Date']  = format_date(d.get('Tender_Date'))
            d['Lifting_Date'] = format_date(d.get('Lifting_Date'))

            # Attach balance for this row's Payment_To
            key      = (d.get('Payment_To'), d.get('Company_Code'), d.get('Year_Code'))
            bal_info = balance_map.get(key, {'Balance': 0.0, 'BalanceLabel': ''})
            d['AccountBalance']      = bal_info['Balance']
            d['AccountBalanceLabel'] = bal_info['BalanceLabel']   # "Dr" | "Cr" | ""

            response.append(d)

        return jsonify(response)

    except SQLAlchemyError as error:
        print("Error in tender_balance_report:", error)
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500




@app.route(API_URL + "/dailypurchase-report", methods=["GET"])
def dailypurchase_report():
    company_code  = request.args.get('Company_Code')
    selected_date = request.args.get('Selected_Date')
 
    if not all([company_code, selected_date]):
        return jsonify({"error": "Missing parameters"}), 400
 
    try:
        parsed_date = datetime.strptime(selected_date, '%Y-%m-%d').date()
 
        query = text('''
SELECT        mill.Short_Name, pt.Short_Name AS PaymenttoShortname, do.Short_Name AS do, dbo.nt_1_tender.Lifting_Date, dbo.nt_1_tender.Mill_Rate, dbo.nt_1_tender.Purc_Rate, dbo.nt_1_tender.Grade, dbo.nt_1_tender.season, 
                         dbo.nt_1_tender.Mill_Code, dbo.nt_1_tender.Quantal AS PurcQntl, dbo.nt_1_tender.Party_Bill_Rate, dbo.nt_1_tender.Tender_No
FROM            dbo.nt_1_tender INNER JOIN
                         dbo.nt_1_accountmaster AS mill ON dbo.nt_1_tender.mc = mill.accoid INNER JOIN
                         dbo.nt_1_accountmaster AS pt ON dbo.nt_1_tender.pt = pt.accoid INNER JOIN
                         dbo.nt_1_accountmaster AS do ON dbo.nt_1_tender.td = do.accoid
  WHERE dbo.nt_1_tender.Tender_Date  = :selected_date
              AND dbo.nt_1_tender.Company_Code = :company_code


        ''')
 
        params = {
            'company_code': company_code,
            'selected_date': parsed_date,
        }
 
        result  = db.session.execute(query, params)
        all_data = [dict(row._mapping) for row in result.fetchall()]
 
        return jsonify({"get_allTenders": all_data}), 200
 
    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
 
 
@app.route(API_URL + "/getallsauda", methods=["GET"])
def getallsauda():
    company_code  = request.args.get('Company_Code')
    selected_date = request.args.get('Selected_Date')
 
    if not all([company_code, selected_date]):
        return jsonify({"error": "Missing parameters"}), 400
 
    try:
        # Convert to date object to avoid "Conversion failed" errors
        parsed_date = datetime.strptime(selected_date, '%Y-%m-%d').date()
 
        query = text('''
        
SELECT        mill.Short_Name, pt.Short_Name AS PaymenttoShortname, do.Short_Name AS do, dbo.nt_1_systemmaster.System_Name_E, dbo.nt_1_tender.Lifting_Date, dbo.nt_1_tender.Mill_Rate, dbo.nt_1_tender.Purc_Rate, 
                         dbo.nt_1_tender.Grade, dbo.nt_1_tender.season, dbo.nt_1_tender.Quantal AS LotSize, dbo.nt_1_tender.Mill_Code, SUM(dbo.nt_1_tenderdetails.Buyer_Quantal) AS Sold, dbo.nt_1_tender.Tender_No, 
                         dbo.nt_1_tenderdetails.Sale_Rate, dbo.nt_1_tender.Party_Bill_Rate
FROM            dbo.nt_1_tender INNER JOIN
                         dbo.nt_1_tenderdetails ON dbo.nt_1_tender.tenderid = dbo.nt_1_tenderdetails.tenderid INNER JOIN
                         dbo.nt_1_accountmaster AS mill ON dbo.nt_1_tender.mc = mill.accoid INNER JOIN
                         dbo.nt_1_accountmaster AS pt ON dbo.nt_1_tender.pt = pt.accoid INNER JOIN
                         dbo.nt_1_accountmaster AS do ON dbo.nt_1_tender.td = do.accoid INNER JOIN
                         dbo.nt_1_systemmaster ON dbo.nt_1_tenderdetails.gradeid = dbo.nt_1_systemmaster.systemid
      WHERE dbo.nt_1_tenderdetails.Sauda_Date  = :selected_date
              AND dbo.nt_1_tender.Company_Code        = :company_code
GROUP BY mill.Short_Name, pt.Short_Name, do.Short_Name, dbo.nt_1_systemmaster.System_Name_E, dbo.nt_1_tender.Lifting_Date, dbo.nt_1_tender.Mill_Rate, dbo.nt_1_tender.Purc_Rate, dbo.nt_1_tender.Grade, 
                         dbo.nt_1_tender.season, dbo.nt_1_tender.Quantal, dbo.nt_1_tender.Mill_Code, dbo.nt_1_tender.Tender_No, dbo.nt_1_tenderdetails.Sale_Rate, dbo.nt_1_tender.Party_Bill_Rate



        ''')
 
        params = {
            'company_code': company_code,
            'selected_date': parsed_date,
        }
 
        result   = db.session.execute(query, params)
        all_data = [dict(row._mapping) for row in result.fetchall()]
 
        return jsonify({"get_live_tenders": all_data}), 200
 
    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500





def format_date(val):
    if val is None:
        return None
    if hasattr(val, 'strftime'):
        return val.strftime('%Y-%m-%d')
    if isinstance(val, str):
        # In case it's a string like "2023-10-27 00:00:00", just take the date part
        return val.split(' ')[0]
    return str(val)

@app.route(API_URL + '/pendingpayment', methods=['GET'])
def pendingpayment():
    try:
        # 1. Get and Validate Parameters
        company_code = request.args.get('company_code')
        year_code = request.args.get('year_code') # Added year_code for balance accuracy
        
        if not company_code:
            return jsonify({'error': 'company_code is required'}), 400

        # 2. Main Query
        do_balance_sql = text('''
            SELECT 
                dbo.qrytenderdobalanceview.Tender_No, 
                dbo.qrytenderdobalanceview.Tender_DateConverted AS Tender_Date, 
                dbo.qrytenderdobalanceview.buyername AS Party2, 
                dbo.qrytenderdobalanceview.buyerpartyname AS Party, 
                dbo.qrytenderdobalanceview.Mill_Rate, 
                ISNULL(CONVERT(NVARCHAR(200), dbo.qrytenderdobalanceview.Grade), N'') + 
                CASE 
                    WHEN NULLIF(CONVERT(NVARCHAR(200), dbo.nt_1_systemmaster.System_Name_E), N'') IS NULL THEN N'' 
                    ELSE N' - ' + CONVERT(NVARCHAR(200), dbo.nt_1_systemmaster.System_Name_E) 
                END AS Grade, 
                dbo.qrytenderdobalanceview.Sale_Rate, 
                dbo.qrytenderdobalanceview.Buyer_Quantal, 
                dbo.qrytenderdobalanceview.DESPATCH, 
                dbo.qrytenderdobalanceview.BALANCE, 
                dbo.qrytenderdobalanceview.tenderdoname AS doname, 
                dbo.qrytenderdobalanceview.Lifting_DateConverted AS Lifting_Date, 
                dbo.qrytenderdobalanceview.ID, 
                dbo.qrytenderdobalanceview.tenderdetailid, 
                dbo.qrytenderdobalanceview.tenderid, 
                dbo.qrytenderdobalanceview.Delivery_Type, 
                dbo.qrytenderdobalanceview.shiptoname, 
                dbo.qrytenderdobalanceview.tenderdoshortname, 
                dbo.qrytenderdobalanceview.season, 
                ISNULL(dbo.qrytenderdobalanceview.Purchase_Rate, dbo.qrytenderdobalanceview.Party_Bill_Rate) AS Party_Bill_Rate, 
                dbo.qrytenderdobalanceview.gradeid, 
                dbo.qrytenderdobalanceview.gradeCode, 
                CASE 
                    WHEN dbo.qrytenderdobalanceview.MillRate = 0 THEN dbo.qrytenderdobalanceview.Mill_Rate 
                    ELSE dbo.qrytenderdobalanceview.MillRate 
                END AS FinalMillRate, 
                dbo.qrytenderdobalanceview.partypaymentdate, 
                dbo.qrytenderdobalanceview.millshortname, 
                dbo.qrytenderdobalanceview.Buyer, 
                dbo.qrytenderdobalanceview.Buyer_Party,
                dbo.qrytenderdobalanceview.Company_Code,
                dbo.qrytenderdobalanceview.Year_Code
            FROM dbo.qrytenderdobalanceview 
            LEFT OUTER JOIN dbo.nt_1_systemmaster 
                ON dbo.qrytenderdobalanceview.gradeid = dbo.nt_1_systemmaster.systemid
            WHERE (dbo.qrytenderdobalanceview.BALANCE <> 0) 
              AND (dbo.qrytenderdobalanceview.Company_Code = :company_code) 
              AND (dbo.qrytenderdobalanceview.Buyer <> 2)
            ORDER BY dbo.qrytenderdobalanceview.Tender_No DESC
        ''')

        result = db.session.execute(do_balance_sql, {'company_code': company_code})
        rows = result.fetchall()

        if not rows:
            return jsonify([])

        # 3. Identify Unique Buyers for Balance Lookup
        unique_buyers = {}
        for row in rows:
            # We use the 'Buyer' field as the account code
            if not row.Buyer:
                continue
            key = (row.Buyer, row.Company_Code, row.Year_Code)
            if key not in unique_buyers:
                unique_buyers[key] = {
                    'ac_code': row.Buyer,
                    'company_code': row.Company_Code,
                    'year_code': row.Year_Code
                }

        # 4. Fetch Balances for Unique Buyers
        balance_map = {}
        for key, info in unique_buyers.items():
            # Get group type to determine if we filter by year
            gt_row = db.session.execute(text('''
                SELECT TOP 1 g.group_Type
                FROM dbo.nt_1_accountmaster a
                INNER JOIN dbo.nt_1_bsgroupmaster g ON a.Group_Code = g.group_Code AND a.company_code = g.Company_Code
                WHERE a.Ac_Code = :ac_code AND a.company_code = :company_code
            '''), {'ac_code': info['ac_code'], 'company_code': info['company_code']}).fetchone()

            group_type = (gt_row[0] or '').strip().upper() if gt_row else ''

            bal_sql = '''
                SELECT SUM(CASE DRCR WHEN 'D' THEN AMOUNT WHEN 'C' THEN -AMOUNT END) AS Balance
                FROM dbo.nt_1_gledger
                WHERE AC_CODE = :ac_code AND COMPANY_CODE = :company_code
            '''
            bal_params = {'ac_code': info['ac_code'], 'company_code': info['company_code']}

            # If not Balance Sheet group, filter by specific year
            if group_type != 'B' and info['year_code']:
                bal_sql += ' AND YEAR_CODE = :year_code'
                bal_params['year_code'] = info['year_code']

            bal_res = db.session.execute(text(bal_sql), bal_params).fetchone()
            raw_bal = float(bal_res.Balance) if (bal_res and bal_res.Balance is not None) else 0.0

            balance_map[key] = {
                'Balance': raw_bal,
                'Label': 'Dr' if raw_bal > 0 else ('Cr' if raw_bal < 0 else '')
            }

        # 5. Assemble Final Response
        response = []
        for row in rows:
            d = dict(row._mapping)
            
            # Format Dates
            d['Tender_Date'] = format_date(d.get('Tender_Date'))
            d['Lifting_Date'] = format_date(d.get('Lifting_Date'))
            d['partypaymentdate'] = format_date(d.get('partypaymentdate'))

            # Attach Buyer Balance
            key = (d.get('Buyer'), d.get('Company_Code'), d.get('Year_Code'))
            bal_info = balance_map.get(key, {'Balance': 0.0, 'Label': ''})
            
            d['BuyerBalance'] = bal_info['Balance']
            d['BuyerBalanceLabel'] = bal_info['Label']

            response.append(d)

        return jsonify(response), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Internal server error', 'message': str(e)}), 500



#Account Reports 
@app.route(API_URL + '/getAllCashbankbalance', methods=['GET'])
def getAllCashbankbalance():
    try:
        company_code = request.args.get('company_code')
        doc_date     = request.args.get('doc_date')

        if not company_code or not doc_date:
            return jsonify({'error': 'company_code and doc_date are required'}), 400

        try:
            company_code = int(company_code)
            parsed_date  = datetime.strptime(doc_date, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid company_code or doc_date format (use YYYY-MM-DD)'}), 400

        sql = text('''
      
SELECT SUM(CASE WHEN dbo.nt_1_gledger.drcr = 'D' THEN dbo.nt_1_gledger.amount ELSE - dbo.nt_1_gledger.amount END) AS balance, dbo.nt_1_gledger.AC_CODE, dbo.nt_1_accountmaster.Ac_Name_E, 
                         dbo.nt_1_accountmaster.Ac_rate,
						 case when dbo.nt_1_accountmaster.Ac_rate=0 then 0 else (dbo.nt_1_accountmaster.Ac_rate + SUM(CASE WHEN dbo.nt_1_gledger.drcr = 'D' THEN dbo.nt_1_gledger.amount ELSE - dbo.nt_1_gledger.amount END)) end AS Avialable 
FROM            dbo.nt_1_gledger INNER JOIN
                         dbo.nt_1_accountmaster ON dbo.nt_1_gledger.ac = dbo.nt_1_accountmaster.accoid
 WHERE dbo.nt_1_gledger.DOC_DATE    <= :doc_date
              AND dbo.nt_1_gledger.COMPANY_CODE  = :company_code
GROUP BY dbo.nt_1_gledger.AC_CODE, dbo.nt_1_accountmaster.Ac_Name_E, dbo.nt_1_accountmaster.Ac_type, dbo.nt_1_accountmaster.Ac_rate
HAVING        (dbo.nt_1_accountmaster.Ac_type IN ('B', 'C'))
ORDER BY dbo.nt_1_accountmaster.Ac_Name_E


        ''')

        result = db.session.execute(sql, {
            'company_code': company_code,
            'doc_date':     parsed_date,
        })
        rows = result.fetchall()

        data = [dict(row._mapping) for row in rows]
        return jsonify(data), 200

    except SQLAlchemyError as e:
        db.session.rollback()
        print("Error in satyen_pawar_balance:", e)
        return jsonify({'error': 'Internal server error', 'message': str(e)}), 500



@app.route(API_URL + '/getcashbankreportgroupwise', methods=['GET'])
def getcashbankreportgroupwise():
    try:
        # 1. Capture and Validate Request Arguments
        company_code = request.args.get('company_code')
        doc_date     = request.args.get('doc_date')
        year_code    = request.args.get('year_code')

        if not all([company_code, doc_date, year_code]):
            return jsonify({'error': 'company_code, doc_date, and year_code are required'}), 400

        try:
            company_code_int = int(company_code)
            year_code_int    = int(year_code)
            parsed_date      = datetime.strptime(doc_date, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid format for numeric IDs or doc_date (use YYYY-MM-DD)'}), 400


        params = fetch_company_parameters(company_code_int, year_code_int)
        def_creditor = params.defaultSundryCreditors if params and params.defaultSundryCreditors else 0
        def_debtor   = params.defalultSundryDebitors if params and params.defalultSundryDebitors else 0

        sql = text('''
            SELECT
                dbo.nt_1_gledger.AC_CODE,
                dbo.nt_1_accountmaster.Ac_Name_E AS bankname,
                dbo.nt_1_bsgroupmaster.group_Name_E,
                nt_1_accountmaster_1.Ac_Name_E AS contra_ac_name,
                dbo.nt_1_gledger.TRAN_TYPE,
                dbo.nt_1_gledger.DOC_NO,
                dbo.nt_1_gledger.NARRATION,
                dbo.nt_1_gledger.AMOUNT,
                nt_1_accountmaster_1.Group_Code,
                dbo.nt_1_gledger.DRCR
            FROM dbo.nt_1_gledger
            INNER JOIN dbo.nt_1_accountmaster 
                ON dbo.nt_1_gledger.ac = dbo.nt_1_accountmaster.accoid
            INNER JOIN dbo.nt_1_accountmaster AS nt_1_accountmaster_1 
                ON dbo.nt_1_gledger.DRCR_HEAD = nt_1_accountmaster_1.Ac_Code 
                AND dbo.nt_1_gledger.COMPANY_CODE = nt_1_accountmaster_1.company_code
            INNER JOIN dbo.nt_1_bsgroupmaster 
                ON nt_1_accountmaster_1.bsid = dbo.nt_1_bsgroupmaster.bsid
            WHERE dbo.nt_1_gledger.DOC_DATE = :doc_date
              AND dbo.nt_1_gledger.COMPANY_CODE = :company_code
              AND nt_1_accountmaster_1.Group_Code NOT IN (:def_creditor, :def_debtor)
              AND dbo.nt_1_accountmaster.Ac_type IN ('B', 'C')

            UNION ALL

            SELECT
                dbo.nt_1_gledger.AC_CODE,
                dbo.nt_1_accountmaster.Ac_Name_E AS bankname,
                dbo.nt_1_bsgroupmaster.group_Name_E,
                nt_1_accountmaster_1.Ac_Name_E AS contra_ac_name,
                dbo.nt_1_gledger.TRAN_TYPE,
                dbo.nt_1_gledger.DOC_NO,
                dbo.nt_1_gledger.NARRATION,
                dbo.nt_1_gledger.AMOUNT,
                nt_1_accountmaster_1.Group_Code,
                dbo.nt_1_gledger.DRCR
            FROM dbo.nt_1_gledger
            INNER JOIN dbo.nt_1_accountmaster 
                ON dbo.nt_1_gledger.ac = dbo.nt_1_accountmaster.accoid
            INNER JOIN dbo.nt_1_accountmaster AS nt_1_accountmaster_1 
                ON dbo.nt_1_gledger.DRCR_HEAD = nt_1_accountmaster_1.Ac_Code 
                AND dbo.nt_1_gledger.COMPANY_CODE = nt_1_accountmaster_1.company_code
            INNER JOIN dbo.nt_1_bsgroupmaster 
                ON nt_1_accountmaster_1.bsid = dbo.nt_1_bsgroupmaster.bsid
            WHERE dbo.nt_1_gledger.COMPANY_CODE = :company_code
              AND nt_1_accountmaster_1.Group_Code IN (:def_creditor, :def_debtor)
              AND dbo.nt_1_gledger.TRAN_TYPE = 'BP'
              AND dbo.nt_1_gledger.DOC_DATE = :doc_date
              AND nt_1_accountmaster_1.Ac_type = 'T'

            ORDER BY bankname
        ''')

        result = db.session.execute(sql, {
            'company_code': company_code_int,
            'doc_date':     parsed_date,
            'def_creditor': def_creditor,
            'def_debtor':   def_debtor
        })
        rows = result.fetchall()

        if not rows:
            return jsonify([]), 200

        # 4. Data Transformation
        bank_map = {}  

        for row in rows:
            ac_code  = row.AC_CODE
            if ac_code not in bank_map:
                bank_map[ac_code] = {
                    'AC_CODE':  ac_code,
                    'bankname': row.bankname,
                    'debit':  {'records': [], 'total_amount': 0.0},
                    'credit': {'records': [], 'total_amount': 0.0},
                }

            record = {
                'contra_ac_name': row.contra_ac_name,
                'group_Name_E':   row.group_Name_E,
                'TRAN_TYPE':      row.TRAN_TYPE,
                'DOC_NO':         row.DOC_NO,
                'NARRATION':      row.NARRATION,
                'AMOUNT':         float(row.AMOUNT) if row.AMOUNT is not None else 0.0,
                'Group_Code':     row.Group_Code,
                'DRCR':           row.DRCR,
            }

            drcr_val = (row.DRCR or '').strip().upper()
            if drcr_val == 'D':
                bank_map[ac_code]['debit']['records'].append(record)
                bank_map[ac_code]['debit']['total_amount'] += record['AMOUNT']
            else:
                bank_map[ac_code]['credit']['records'].append(record)
                bank_map[ac_code]['credit']['total_amount'] += record['AMOUNT']

        # 5. Sorting Response
        response = sorted(bank_map.values(), key=lambda x: x['bankname'])
        return jsonify(response), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Internal server error', 'message': str(e)}), 500