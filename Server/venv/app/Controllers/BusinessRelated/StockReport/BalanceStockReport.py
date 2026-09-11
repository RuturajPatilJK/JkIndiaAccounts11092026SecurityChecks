from app import app, db
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import text
from flask import jsonify, request
from flask_mail import Mail, Message
from collections import defaultdict
import os
import requests

API_URL = os.getenv('API_URL')
API_URL_SERVER = os.getenv('API_URL_SERVER')

def format_dates(task):
    return {
        "Tender_Date": task['Tender_Date'].strftime('%Y-%m-%d') if task['Tender_Date'] else None
    }



@app.route(API_URL+'/partywise-stockReport', methods=['GET'])
def partywise_stockReport():
    try:
        company_code = request.args.get('Company_Code')
        year_code    = request.args.get('Year_Code')
        if company_code is None:
            return jsonify({"error": "Missing 'company_code' parameter"}), 400

        query = db.session.execute(text('''
             SELECT TOP (100) PERCENT q.Tender_No, q.tenderid, q.millshortname, CASE WHEN ISNULL(q.Delivery_Type, '') <> 'A' THEN (q.Sale_Rate + q.Commission_Rate) + ((q.Sale_Rate + q.Commission_Rate) * ISNULL(q.gstrate, 0) / 100.0)
                         ELSE (q.Sale_Rate + q.Commission_Rate) END AS Sale_Rate, q.Lifting_DateConverted AS Tender_Date, q.Buyer_Quantal, q.DESPATCH, q.BALANCE, q.tenderdoshortname, q.Buyer, q.tenderdetailid, q.buyername,
                         CONVERT(varchar, q.Sauda_Date, 103) AS Sauda_Date, ISNULL(sm.System_Name_E, q.Grade) AS Grade, q.Delivery_Type, q.gstrate, ISNULL(q.MillRate, q.Mill_Rate) AS Mill_Rate
FROM            dbo.qrytenderdobalanceview AS q LEFT OUTER JOIN
                         dbo.nt_1_tenderGradeDetails AS tgd ON q.gradeid = tgd.gradeid AND q.tenderid = tgd.tenderid LEFT OUTER JOIN
                         dbo.nt_1_systemmaster AS sm ON tgd.gradeid = sm.systemid
WHERE        (q.Company_Code = :company_code) AND (q.Buyer_Quantal <> 0) AND (q.Buyer <> 2)
GROUP BY q.Tender_No, q.tenderid, q.millshortname, q.Mill_Rate, q.Sale_Rate, q.Tender_Date, q.Buyer_Quantal, q.DESPATCH, q.BALANCE, q.tenderdoname, q.Lifting_DateConverted, q.tenderdoshortname, q.Buyer, q.Commission_Rate,
                         q.tenderdetailid, q.buyername, q.Sauda_Date, ISNULL(sm.System_Name_E, q.Grade), q.Delivery_Type, q.gstrate, q.MillRate, sm.System_Name_E
ORDER BY q.buyername
        '''), {'company_code': company_code})

        rows_dicts = [row._asdict() for row in query.fetchall()]

        # Batch balance lookup — one query for all unique Buyer codes
        buyer_codes = list({r.get('Buyer') for r in rows_dicts if r.get('Buyer')})
        balance_cache = {}

        if buyer_codes:
            placeholders = ', '.join(f':b{i}' for i in range(len(buyer_codes)))
            bp = {f'b{i}': code for i, code in enumerate(buyer_codes)}
            bp['company_code'] = int(company_code)

            if year_code:
                bp['year_code'] = int(year_code)
                year_filter = "AND (dbo.nt_1_bsgroupmaster.group_Type = 'B' OR dbo.nt_1_gledger.YEAR_CODE = :year_code)"
            else:
                year_filter = ""

            bal_rows = db.session.execute(text(f"""
                SELECT dbo.nt_1_gledger.AC_CODE,
                       SUM(CASE dbo.nt_1_gledger.DRCR
                               WHEN 'D' THEN dbo.nt_1_gledger.AMOUNT
                               WHEN 'C' THEN -dbo.nt_1_gledger.AMOUNT END) AS Balance,
                       dbo.nt_1_accountmaster.Gst_No
                FROM dbo.nt_1_gledger
                INNER JOIN dbo.nt_1_accountmaster
                    ON dbo.nt_1_gledger.AC_CODE = dbo.nt_1_accountmaster.Ac_Code
                   AND dbo.nt_1_gledger.COMPANY_CODE = dbo.nt_1_accountmaster.company_code
                INNER JOIN dbo.nt_1_bsgroupmaster
                    ON dbo.nt_1_accountmaster.Group_Code = dbo.nt_1_bsgroupmaster.group_Code
                   AND dbo.nt_1_accountmaster.company_code = dbo.nt_1_bsgroupmaster.Company_Code
                WHERE dbo.nt_1_gledger.AC_CODE IN ({placeholders})
                  AND dbo.nt_1_gledger.COMPANY_CODE = :company_code
                  {year_filter}
                GROUP BY dbo.nt_1_gledger.AC_CODE, dbo.nt_1_accountmaster.Gst_No
            """), bp).fetchall()

            for row in bal_rows:
                balance_cache[row.AC_CODE] = {
                    'balance': float(row.Balance or 0),
                    'gstNo': row.Gst_No or ''
                }

        for row_dict in rows_dicts:
            entry = balance_cache.get(row_dict.get('Buyer'), {'balance': 0.0, 'gstNo': ''})
            row_dict['partyBalance'] = entry['balance']
            row_dict['partyGstNo']   = entry['gstNo']

        return jsonify(rows_dicts)

    except SQLAlchemyError as error:
        print("Error fetching data:", error)
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500

@app.route(API_URL + '/millwise-stock-report', methods=['GET'])
def tender_reports():
    company_code = request.args.get('Company_Code')

    if not company_code:
        return jsonify({"error": "Missing 'Company_Code' parameter"}), 400

    try:
        # Query for tender details
        tender_details_query = text('''
            SELECT DISTINCT Tender_No, Tender_DateConverted AS Tender_Date, millshortname AS millname,
                            Grade, Quantal, Mill_Rate, Purc_Rate, Lifting_DateConverted AS Lifting_Date,
                            tenderdoshortname AS doname, Lifting_DateConverted AS ld,
                            Convert(varchar, Sauda_Date, 103) AS Sauda_Date
            FROM qrytenderdobalanceview
            WHERE BALANCE != 0 AND Company_Code = :company_code
            ORDER BY Tender_No ASC;
        ''')
        tender_details_result = db.session.execute(tender_details_query, {'company_code': company_code}).fetchall()

        if not tender_details_result:
            return jsonify({"error": "No tender details found for the given Company_Code"}), 404

        # Query for sales details
        sales_details_query = text('''
           SELECT dbo.qrytenderdobalanceview.ID, dbo.qrytenderdobalanceview.buyername AS buyerbrokerfullname, dbo.qrytenderdobalanceview.Sale_Rate + dbo.qrytenderdobalanceview.Commission_Rate AS Sale_Rate, 
                  dbo.qrytenderdobalanceview.Buyer_Quantal, dbo.qrytenderdobalanceview.DESPATCH AS despatchqty, dbo.qrytenderdobalanceview.BALANCE, dbo.qrytenderdobalanceview.Tender_No, CONVERT(varchar, 
                  dbo.qrytenderdobalanceview.Sauda_Date, 103) AS Sauda_Date, dbo.nt_1_systemmaster.System_Name_E AS Grade,ISNULL(dbo.qrytenderdobalanceview.MillRate,dbo.qrytenderdobalanceview.Mill_Rate) as MillRate
FROM     dbo.qrytenderdobalanceview LEFT OUTER JOIN
                  dbo.nt_1_tenderGradeDetails ON dbo.qrytenderdobalanceview.gradeid = dbo.nt_1_tenderGradeDetails.gradeid AND dbo.qrytenderdobalanceview.tenderid = dbo.nt_1_tenderGradeDetails.tenderid LEFT OUTER JOIN
                  dbo.nt_1_systemmaster ON dbo.nt_1_tenderGradeDetails.gradeid = dbo.nt_1_systemmaster.systemid
            WHERE dbo.qrytenderdobalanceview.Company_Code = :company_code;
        ''')
        sales_details_result = db.session.execute(sales_details_query, {'company_code': company_code}).fetchall()

        if not sales_details_result:
            return jsonify({"error": "No sales details found for the given Company_Code"}), 404

        # Group tender details by Tender_No
        tender_grouped = defaultdict(list)
        for row in tender_details_result:
            row_dict = dict(row._mapping)
            tender_grouped[row_dict['Tender_No']].append(row_dict)

        # Group sales details by Tender_No
        sales_grouped = defaultdict(list)
        for row in sales_details_result:
            row_dict = dict(row._mapping)
            sales_grouped[row_dict['Tender_No']].append(row_dict)

        # Sort each Tender_No's sales list with ID=1 first
        for tender_no in sales_grouped:
            sales_grouped[tender_no].sort(key=lambda x: (0 if x['ID'] == 1 else 1))

        # Construct response
        response = {
            "tender_details": [{"Tender_No": tender_no, "details": details} for tender_no, details in tender_grouped.items()],
            "sales_details": [{"Tender_No": tender_no, "details": details} for tender_no, details in sales_grouped.items()]
        }

        return jsonify(response)

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to fetch data due to an error.', 'exception': str(e)}), 500



def get_balance_internal(ac_code, company_code, year_code, session):
    """
    EXACT logic of /get_balance
    Returns: (balance, gst_no)
    """

    group_type_query = text("""
        SELECT b.group_Type
        FROM dbo.nt_1_gledger g
        INNER JOIN dbo.nt_1_accountmaster a
            ON g.AC_CODE = a.Ac_Code
           AND g.COMPANY_CODE = a.company_code
        INNER JOIN dbo.nt_1_bsgroupmaster b
            ON a.Group_Code = b.group_Code
           AND a.company_code = b.Company_Code
        WHERE g.AC_CODE = :ac_code
          AND g.COMPANY_CODE = :company_code
        ORDER BY g.AC_CODE
        OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY
    """)

    group_type_result = session.execute(
        group_type_query,
        {'ac_code': ac_code, 'company_code': company_code}
    ).fetchone()

    if not group_type_result:
        return 0.0, ""

    group_type = (group_type_result[0] or "").strip().upper()

    balance_query = """
        SELECT
            SUM(CASE g.DRCR
                WHEN 'D' THEN g.AMOUNT
                WHEN 'C' THEN -g.AMOUNT
            END) AS Balance,
            a.Gst_No
        FROM dbo.nt_1_gledger g
        INNER JOIN dbo.nt_1_accountmaster a
            ON g.AC_CODE = a.Ac_Code
           AND g.COMPANY_CODE = a.company_code
        INNER JOIN dbo.nt_1_bsgroupmaster b
            ON a.Group_Code = b.group_Code
           AND a.company_code = b.Company_Code
        WHERE g.AC_CODE = :ac_code
          AND g.COMPANY_CODE = :company_code
    """

    params = {'ac_code': ac_code, 'company_code': company_code}

    if group_type != 'B' and year_code:
        balance_query += " AND g.YEAR_CODE = :year_code"
        params['year_code'] = year_code

    balance_query += " GROUP BY a.Gst_No"

    result = session.execute(text(balance_query), params).fetchone()

    if not result:
        return 0.0, ""

    return float(result.Balance or 0), result.Gst_No or ""


@app.route(API_URL + '/self-stock-report', methods=['GET'])
def get_self_report():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')

        if not company_code or not year_code:
            return jsonify({"error": "Missing required query parameters"}), 400

        sql_query = text("""
            SELECT Tender_No, tenderid, millshortname, Grade, Mill_Rate,
                   Sale_Rate + Commission_Rate AS Sale_Rate,
                   Lifting_DateConverted AS Tender_Date,
                   Buyer_Quantal, DESPATCH, BALANCE,
                   tenderdoshortname, Buyer, tenderdetailid,
                   buyername, Mill_Code
            FROM dbo.qrytenderdobalanceview
            WHERE Company_Code = :company_code
              AND Year_Code = :year_code
              AND Buyer_Quantal <> 0
              AND Buyer = 2
            GROUP BY Tender_No, tenderid, millshortname, Grade, Mill_Rate,
                     Sale_Rate, Tender_Date, Buyer_Quantal, DESPATCH,
                     BALANCE, tenderdoname, Lifting_DateConverted,
                     tenderdoshortname, Buyer, Commission_Rate,
                     tenderdetailid, buyername, Mill_Code
            ORDER BY millshortname
        """)

        with db.engine.connect() as connection:
            result = connection.execute(sql_query, {
                'company_code': company_code,
                'year_code': year_code
            })

            self_stock_report_detail = []

            # 🔥 balance cache so API / DB is NOT hit multiple times
            balance_cache = {}

            for row in result:
                row_dict = dict(row._mapping)
                mill_code = row_dict["Mill_Code"]

                # fetch balance ONCE per mill
                if mill_code not in balance_cache:
                    bal, _gst = get_balance_internal(
                        mill_code, int(company_code), int(year_code), db.session
                    )
                    balance_cache[mill_code] = bal

                # ✅ just add one key, NOTHING else changes
                row_dict["mill_balance"] = balance_cache[mill_code]

                self_stock_report_detail.append(row_dict)

        return jsonify(self_stock_report_detail)

    except SQLAlchemyError as e:
        return jsonify({"error": "Failed to fetch data", "details": str(e)}), 500



@app.route(API_URL + '/mill_lot_due_summary', methods=['GET'])
def get_mill_lot_due_summary():
    company_code = request.args.get('Company_Code')

    try:
        query = text("""
            WITH do_sum AS (SELECT        UTR_NO, UtrCompanyCode, UtrYearCode, SUM(ISNULL(Amount, 0)) AS doAmount
                                        FROM            dbo.nt_1_dodetails
                                        GROUP BY UTR_NO, UtrCompanyCode, UtrYearCode), distinct_lots AS
    (SELECT DISTINCT utrid, lot_no, Adjusted_Amt
      FROM            dbo.nt_1_utrdetail)
    SELECT      u.mill_code, a.Ac_Name_E AS millname, ud.lot_no, SUM(ISNULL(u.amount, 0)) AS utrAmount, SUM(ISNULL(ds.doAmount, 0)) AS doAmount, SUM(ISNULL(ud.Adjusted_Amt, 0)) AS Adjusted_Amt, 
                              SUM(ISNULL(u.amount, 0)) - SUM(ISNULL(ud.Adjusted_Amt, 0)) - SUM(ISNULL(ds.doAmount, 0)) AS duePayment
     FROM            dbo.nt_1_utr AS u INNER JOIN
                              distinct_lots AS ud ON ud.utrid = u.utrid INNER JOIN
                              dbo.nt_1_accountmaster AS a ON u.mc = a.accoid AND u.Company_Code = a.company_code LEFT OUTER JOIN
                              do_sum AS ds ON u.doc_no = ds.UTR_NO AND u.Company_Code = ds.UtrCompanyCode AND u.Year_Code = ds.UtrYearCode
     WHERE        (u.Company_Code = :company_code)
     GROUP BY u.mill_code, a.Ac_Name_E, ud.lot_no
     HAVING         (SUM(ISNULL(u.amount, 0)) - SUM(ISNULL(ud.Adjusted_Amt, 0)) - SUM(ISNULL(ds.doAmount, 0)) <> 0)
     ORDER BY u.mill_code, ud.lot_no
        """)

        result = db.session.execute(query, {"company_code": company_code}).fetchall()

        data = [
            {
                "mill_code": row.mill_code,
                "mill_name": row.millname,
                "lot_no": row.lot_no,
                "utrAmount": float(row.utrAmount or 0),
                "doAmount": float(row.doAmount or 0),
                "Adjusted_Amt": float(row.Adjusted_Amt or 0),
                "duePayment": float(row.duePayment or 0),
            }
            for row in result
        ]

        return jsonify({"status": "success", "data": data}), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    
@app.route(API_URL+'/pendingreport-MillPendingPayment-Summary', methods=['GET'])
def Pendingreport_MillPendingPayment_Summary():
    try:
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')

        if not from_date or not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400

        sql = text("""
           WITH x AS (
    SELECT
        *,
        MAX(ISNULL(millamount, 0)) OVER (
            PARTITION BY Company_Code, Year_Code, Tender_No
        ) AS MillTotal,
        SUM(ISNULL(paidamount, 0)) OVER (
            PARTITION BY Company_Code, Year_Code, Tender_No
        ) AS UsedTotal
    FROM qrymillpendingpaymentBalanceWithdispatch
    WHERE Tender_Date BETWEEN :from_date AND :to_date
)
SELECT
    x.*,
    (x.MillTotal - x.UsedTotal) AS PendingAmount
FROM x
WHERE (x.MillTotal - x.UsedTotal) <> 0
ORDER BY Tender_Date, Tender_No;

        """)

        with db.session.begin_nested():
            rows = db.session.execute(sql, {'from_date': from_date, 'to_date': to_date}).fetchall()

        response = []
        for row in rows:
            row_dict = row._asdict()
            row_dict.update(format_dates(row_dict))  # your existing formatter
            response.append(row_dict)

        return jsonify(response)

    except SQLAlchemyError as error:
        print("Error fetching data:", error)
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500
    
@app.route(API_URL + '/TrialBalance-SundrySummary', methods=['GET'])
def trialbalance_sundry_summary():
    try:
        from_date     = request.args.get('from_date')
        to_date       = request.args.get('to_date')
        company_code  = request.args.get('Company_Code')
        year_code     = request.args.get('Year_Code')
        group_code    = request.args.get('Group_Code')  # optional

        if not from_date or not to_date or not company_code:
            return jsonify({'error': 'Missing from_date, to_date, or Company_Code'}), 400

        where_sql = """
            WHERE g.COMPANY_CODE = :company_code
              AND g.ac_type IN ('M','P','S')
              AND (
                    (g.group_Type = 'B' AND g.DOC_DATE <= :to_date)
                    OR (g.group_Type <> 'B' AND g.DOC_DATE BETWEEN :from_date AND :to_date AND g.Year_Code = :year_code)
                  )
        """
        params = {
            'from_date': from_date,
            'to_date': to_date,
            'company_code': company_code,
            'year_code': year_code
        }
        if group_code:
            where_sql += " AND g.Group_Code = :group_code"
            params['group_code'] = group_code

        # Reusable base CTE (per-account balances for the filtered set)
        base_gl = f"""
            WITH gl AS (
                SELECT
                    g.Group_Code,
                    g.group_Name_E,
                    g.AC_CODE,
                    g.Ac_Name_E,
                    g.CityName,
                    SUM(CASE g.drcr WHEN 'D' THEN g.Amount WHEN 'C' THEN -g.Amount END) AS Balance
                FROM qrygledger g
                {where_sql}
                GROUP BY g.Group_Code, g.group_Name_E, g.AC_CODE, g.Ac_Name_E, g.CityName
            )
        """

        # 1) Summary by group (first execute)
        query_groups = base_gl + """
            , summary_by_group AS (
                SELECT
                    Group_Code,
                    MAX(group_Name_E) AS group_Name_E,
                    SUM(CASE WHEN Balance > 0 THEN Balance ELSE 0 END) AS Debtors,
                    SUM(CASE WHEN Balance < 0 THEN -Balance ELSE 0 END) AS Creditors
                FROM gl
                GROUP BY Group_Code
            )
            SELECT
                sg.Group_Code,
                sg.group_Name_E,
                sg.Debtors,
                sg.Creditors,
                (sg.Debtors - sg.Creditors) AS Net
            FROM summary_by_group sg
            ORDER BY sg.Group_Code;
        """

        group_rows = db.session.execute(text(query_groups), params).fetchall()

        # 2) Totals (second execute) — define CTE again
        query_totals = base_gl + """
            SELECT
                SUM(CASE WHEN Balance > 0 THEN Balance ELSE 0 END) AS TotalDebtors,
                SUM(CASE WHEN Balance < 0 THEN -Balance ELSE 0 END) AS TotalCreditors
            FROM gl;
        """

        totals_row = db.session.execute(text(query_totals), params).fetchone()

        summary = [{
            'Group_Code': r.Group_Code,
            'group_Name_E': r.group_Name_E,
            'Debtors': float(r.Debtors or 0),
            'Creditors': float(r.Creditors or 0),
            'Net': float(r.Net or 0),
        } for r in group_rows]

        totals_debtors = float((totals_row.TotalDebtors if totals_row else 0) or 0)
        totals_creditors = float((totals_row.TotalCreditors if totals_row else 0) or 0)
        totals = {
            'Debtors': totals_debtors,
            'Creditors': totals_creditors,
            'Net': totals_debtors - totals_creditors
        }

        return jsonify({'summary_by_group': summary, 'totals': totals})

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': 'Database error', 'details': str(e)}), 500
    except Exception as e:
        return jsonify({'error': 'Unexpected error', 'details': str(e)}), 500
    


@app.route(API_URL + '/TrialBalance-SundryDetails', methods=['GET'])
def trialbalance_sundry_details():
    try:
        from_date     = request.args.get('from_date')
        to_date       = request.args.get('to_date')
        company_code  = request.args.get('Company_Code')
        year_code     = request.args.get('Year_Code')
        group_code    = request.args.get('Group_Code')     # 10=Debtors, 4=Creditors
        ac_type       = request.args.get('ac_type')        # OPTIONAL: 'M' | 'P' | 'S'

        if not from_date or not to_date or not company_code:
            return jsonify({'error': 'Missing from_date, to_date, or Company_Code'}), 400

        where_sql = """
            WHERE g.COMPANY_CODE = :company_code
              AND g.ac_type IN ('M','P','S')
              AND (
                    (g.group_Type = 'B' AND g.DOC_DATE <= :to_date)
                    OR (g.group_Type <> 'B' AND g.DOC_DATE BETWEEN :from_date AND :to_date AND g.Year_Code = :year_code)
                  )
        """

        order_by_sql = "ORDER BY ABS(Balance) DESC"

        params = {
            'from_date': from_date,
            'to_date': to_date,
            'company_code': company_code,
            'year_code': year_code
        }
        if group_code:
            where_sql += " AND g.Group_Code = :group_code"
            params['group_code'] = group_code
        if ac_type in ('M', 'P', 'S'):
            where_sql += " AND g.ac_type = :ac_type"
            params['ac_type'] = ac_type

        query = f"""
            WITH gl AS (
                SELECT
                    g.ac_type,
                    g.AC_CODE,
                    MAX(g.Ac_Name_E)   AS Ac_Name_E,
                    MAX(g.CityName)    AS CityName,
                    SUM(CASE g.drcr WHEN 'D' THEN g.Amount WHEN 'C' THEN -g.Amount END) AS Balance
                FROM qrygledger g
                {where_sql}
                GROUP BY g.ac_type, g.AC_CODE
            )
            SELECT
                ac_type,
                AC_CODE,
                Ac_Name_E,
                CityName,
                CASE WHEN Balance > 0 THEN Balance ELSE 0 END AS Debit,
                CASE WHEN Balance < 0 THEN -Balance ELSE 0 END AS Credit,
                Balance
            FROM gl
            WHERE Balance <> 0
            { "AND Balance > 0" if group_code == "10" else "" }
            { "AND Balance < 0" if group_code == "4"  else "" }
            {order_by_sql};
        """

        rows = db.session.execute(text(query), params).fetchall()
        data = [{
            'ac_type':  r.ac_type,
            'AC_CODE':  r.AC_CODE,
            'Ac_Name_E': r.Ac_Name_E,
            'CityName':  r.CityName,
            'Debit':     float(r.Debit or 0),
            'Credit':    float(r.Credit or 0),
            'Balance':   float(r.Balance or 0)
        } for r in rows]

        total_debit  = sum(d['Debit'] for d in data)
        total_credit = sum(d['Credit'] for d in data)

        return jsonify({
            'rows': data,
            'totals': {
                'Debtors': total_debit,
                'Creditors': total_credit,
                'Net': total_debit - total_credit
            }
        })

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': 'Database error', 'details': str(e)}), 500
    except Exception as e:
        return jsonify({'error': 'Unexpected error', 'details': str(e)}), 500
    

































# from app import app, db
# from sqlalchemy.exc import SQLAlchemyError 
# from sqlalchemy import text
# from flask import jsonify, request
# from flask import Flask, jsonify, request
# from flask_mail import Mail, Message
# from collections import defaultdict
# import os

# API_URL = os.getenv('API_URL')

# def format_dates(task):
#     return {
#         "Tender_Date": task['Tender_Date'].strftime('%Y-%m-%d') if task['Tender_Date'] else None
#     }

    
# # @app.route(API_URL+'/partywise-stockReport', methods=['GET'])
# # def partywise_stockReport():
# #     try:
# #         company_code = request.args.get('Company_Code')
# #         if company_code is None:
# #             return jsonify({"error": "Missing 'company_code' parameter"}), 400

# #         with db.session.begin_nested():
# #             query = db.session.execute(text('''
# #                select  Tender_No,tenderid,millshortname,Grade,Mill_Rate,
# # (Sale_Rate+Commission_Rate) as Sale_Rate,
# # Lifting_DateConverted as Tender_Date,
# # Buyer_Quantal,DESPATCH,BALANCE,tenderdoshortname,
# # Buyer,tenderdetailid, buyername,Convert(varchar,Sauda_Date,103) As Sauda_Date
# #  from qrytenderdobalanceview 
# # where  Company_Code = :company_code and   Buyer_Quantal!=0  
# # GROUP BY Tender_No,tenderid,millshortname,Grade,Mill_Rate,Sale_Rate,Tender_Date,Buyer_Quantal,
# # DESPATCH,BALANCE,tenderdoname,Lifting_DateConverted,tenderdoshortname,Buyer,Commission_Rate,
# # tenderdetailid, buyername , Sauda_Date order by buyername 
# #             '''),{'company_code':company_code})

# #             result = query.fetchall()

# #         response = []
# #         for row in result:
# #             row_dict = row._asdict()
# #             response.append(row_dict)

# #         return jsonify(response)

# #     except SQLAlchemyError as error:
# #         print("Error fetching data:", error)
# #         db.session.rollback()
# #         return jsonify({'error': 'Internal server error'}), 500


# # # @app.route(API_URL + '/millwise-stock-report', methods=['GET'])
# # # def tender_reports():
# # #     company_code = request.args.get('Company_Code')

# # #     if not company_code:
# # #         return jsonify({"error": "Missing 'Company_Code' parameter"}), 400

# # #     try:
# # #         tender_details_query = text('''
# # #             SELECT DISTINCT Tender_No, Tender_DateConverted AS Tender_Date, millshortname AS millname,
# # #                             Grade, Quantal, Mill_Rate, Purc_Rate, Lifting_DateConverted AS Lifting_Date,
# # #                             tenderdoshortname AS doname, Lifting_DateConverted AS ld,Convert(varchar,Sauda_Date,103) As Sauda_Date
# # #             FROM qrytenderdobalanceview
# # #             WHERE BALANCE != 0 AND Company_Code = :company_code
# # #             ORDER BY Tender_No ASC;
# # #         ''')
# # #         tender_details_result = db.session.execute(tender_details_query, {'company_code': company_code}).fetchall()

# # #         if not tender_details_result:
# # #             return jsonify({"error": "No tender details found for the given Company_Code"}), 404

# # #         sales_details_query = text('''
# # #             SELECT ID, buyername AS buyerbrokerfullname, (Sale_Rate + Commission_Rate) AS Sale_Rate,
# # #                    Buyer_Quantal, DESPATCH AS despatchqty, BALANCE, Tender_No,Convert(varchar,Sauda_Date,103) As Sauda_Date
# # #             FROM qrytenderdobalanceview
# # #             WHERE Company_Code = :company_code;
# # #         ''')
# # #         sales_details_result = db.session.execute(sales_details_query, {'company_code': company_code}).fetchall()

# # #         if not sales_details_result:
# # #             return jsonify({"error": "No sales details found for the given Company_Code"}), 404

# # #         # Group tender details by Tender_No
# # #         tender_grouped = defaultdict(list)
# # #         for row in tender_details_result:
# # #             row_dict = dict(row._mapping)
# # #             tender_grouped[row_dict['Tender_No']].append(row_dict)

# # #         # Group sales details by Tender_No
# # #         sales_grouped = defaultdict(list)
# # #         for row in sales_details_result:
# # #             row_dict = dict(row._mapping)
# # #             sales_grouped[row_dict['Tender_No']].append(row_dict)

# # #         response = {
# # #             "tender_details": [{"Tender_No": tender_no, "details": details} for tender_no, details in tender_grouped.items()],
# # #             "sales_details": [{"Tender_No": tender_no, "details": details} for tender_no, details in sales_grouped.items()]
# # #         }
# # #         return jsonify(response)

# # #     except Exception as e:
# # #         db.session.rollback()
# # #         return jsonify({'error': 'Failed to fetch data due to an error.', 'exception': str(e)}), 500


# # from flask import jsonify, request
# # from collections import defaultdict
# # from sqlalchemy.sql import text

# # @app.route(API_URL + '/millwise-stock-report', methods=['GET'])
# # def tender_reports():
# #     company_code = request.args.get('Company_Code')

# #     if not company_code:
# #         return jsonify({"error": "Missing 'Company_Code' parameter"}), 400

# #     try:
# #         # Query for tender details
# #         tender_details_query = text('''
# #             SELECT DISTINCT Tender_No, Tender_DateConverted AS Tender_Date, millshortname AS millname,
# #                             Grade, Quantal, Mill_Rate, Purc_Rate, Lifting_DateConverted AS Lifting_Date,
# #                             tenderdoshortname AS doname, Lifting_DateConverted AS ld,
# #                             Convert(varchar, Sauda_Date, 103) AS Sauda_Date
# #             FROM qrytenderdobalanceview
# #             WHERE BALANCE != 0 AND Company_Code = :company_code
# #             ORDER BY Tender_No ASC;
# #         ''')
# #         tender_details_result = db.session.execute(tender_details_query, {'company_code': company_code}).fetchall()

# #         if not tender_details_result:
# #             return jsonify({"error": "No tender details found for the given Company_Code"}), 404

# #         # Query for sales details
# #         sales_details_query = text('''
# #             SELECT ID, buyername AS buyerbrokerfullname, (Sale_Rate + Commission_Rate) AS Sale_Rate,
# #                    Buyer_Quantal, DESPATCH AS despatchqty, BALANCE, Tender_No,
# #                    Convert(varchar, Sauda_Date, 103) AS Sauda_Date
# #             FROM qrytenderdobalanceview
# #             WHERE Company_Code = :company_code;
# #         ''')
# #         sales_details_result = db.session.execute(sales_details_query, {'company_code': company_code}).fetchall()

# #         if not sales_details_result:
# #             return jsonify({"error": "No sales details found for the given Company_Code"}), 404

# #         # Group tender details by Tender_No
# #         tender_grouped = defaultdict(list)
# #         for row in tender_details_result:
# #             row_dict = dict(row._mapping)
# #             tender_grouped[row_dict['Tender_No']].append(row_dict)

# #         # Group sales details by Tender_No
# #         sales_grouped = defaultdict(list)
# #         for row in sales_details_result:
# #             row_dict = dict(row._mapping)
# #             sales_grouped[row_dict['Tender_No']].append(row_dict)

# #         # Sort each Tender_No's sales list with ID=1 first
# #         for tender_no in sales_grouped:
# #             sales_grouped[tender_no].sort(key=lambda x: (0 if x['ID'] == 1 else 1))

# #         # Construct response
# #         response = {
# #             "tender_details": [{"Tender_No": tender_no, "details": details} for tender_no, details in tender_grouped.items()],
# #             "sales_details": [{"Tender_No": tender_no, "details": details} for tender_no, details in sales_grouped.items()]
# #         }

# #         return jsonify(response)

# #     except Exception as e:
# #         db.session.rollback()
# #         return jsonify({'error': 'Failed to fetch data due to an error.', 'exception': str(e)}), 500



# # @app.route(API_URL + '/self-stock-report', methods=['GET'])
# # def get_self_report():
# #     try:
# #         company_code = request.args.get('Company_Code')
# #         year_code = request.args.get('Year_Code')

# #         if not company_code or not year_code:
# #             return jsonify({"error": "Missing required query parameters: Company_Code, Year_Code"}), 400

# #         sql_query = text('''
# #             SELECT Tender_No, tenderid, millshortname, Grade, Mill_Rate, 
# #                    Sale_Rate + Commission_Rate AS Sale_Rate, 
# #                    Lifting_DateConverted AS Tender_Date, Buyer_Quantal, DESPATCH, BALANCE, 
# #                    tenderdoshortname, Buyer, tenderdetailid, buyername
# #             FROM dbo.qrytenderdobalanceview
# #             WHERE Company_Code = :company_code AND Year_Code = :year_code AND Buyer_Quantal <> 0 AND Buyer = 2
# #             GROUP BY Tender_No, tenderid, millshortname, Grade, Mill_Rate, Sale_Rate, Tender_Date, Buyer_Quantal, 
# #                      DESPATCH, BALANCE, tenderdoname, Lifting_DateConverted, tenderdoshortname, Buyer, Commission_Rate, 
# #                      tenderdetailid, buyername
# #             ORDER BY millshortname
# #         ''')

# #         with db.engine.connect() as connection:
# #             result = connection.execute(sql_query, {'company_code': company_code, 'year_code': year_code})

# #             self_stock_report_detail = [dict(row._mapping) for row in result]

# #         return jsonify(self_stock_report_detail)

# #     except SQLAlchemyError as e:
# #         return jsonify({"error": "Failed to fetch data", "details": str(e)}), 500



# @app.route(API_URL+'/partywise-stockReport', methods=['GET'])
# def partywise_stockReport():
#     try:
#         company_code = request.args.get('Company_Code')
#         if company_code is None:
#             return jsonify({"error": "Missing 'company_code' parameter"}), 400

#         with db.session.begin_nested():
#             query = db.session.execute(text('''
#              SELECT        TOP (100) PERCENT q.Tender_No, q.tenderid, q.millshortname, CASE WHEN ISNULL(q.Delivery_Type, '') <> 'A' THEN (q.Sale_Rate + q.Commission_Rate) + ((q.Sale_Rate + q.Commission_Rate) * ISNULL(q.gstrate, 0) / 100.0) 
#                          ELSE (q.Sale_Rate + q.Commission_Rate) END AS Sale_Rate, q.Lifting_DateConverted AS Tender_Date, q.Buyer_Quantal, q.DESPATCH, q.BALANCE, q.tenderdoshortname, q.Buyer, q.tenderdetailid, q.buyername, 
#                          CONVERT(varchar, q.Sauda_Date, 103) AS Sauda_Date, ISNULL(sm.System_Name_E, q.Grade) AS Grade, q.Delivery_Type, q.gstrate, ISNULL(q.MillRate, q.Mill_Rate) AS Mill_Rate
# FROM            dbo.qrytenderdobalanceview AS q LEFT OUTER JOIN
#                          dbo.nt_1_tenderGradeDetails AS tgd ON q.gradeid = tgd.gradeid AND q.tenderid = tgd.tenderid LEFT OUTER JOIN
#                          dbo.nt_1_systemmaster AS sm ON tgd.gradeid = sm.systemid
# WHERE        (q.Company_Code = :company_code) AND (q.Buyer_Quantal <> 0)
# GROUP BY q.Tender_No, q.tenderid, q.millshortname, q.Mill_Rate, q.Sale_Rate, q.Tender_Date, q.Buyer_Quantal, q.DESPATCH, q.BALANCE, q.tenderdoname, q.Lifting_DateConverted, q.tenderdoshortname, q.Buyer, q.Commission_Rate, 
#                          q.tenderdetailid, q.buyername, q.Sauda_Date, ISNULL(sm.System_Name_E, q.Grade), q.Delivery_Type, q.gstrate, q.MillRate, sm.System_Name_E
# ORDER BY q.buyername

#             '''),{'company_code':company_code})

            

#             result = query.fetchall()

#         response = []
#         for row in result:
#             row_dict = row._asdict()
#             response.append(row_dict)

#         return jsonify(response)

#     except SQLAlchemyError as error:
#         print("Error fetching data:", error)
#         db.session.rollback()
#         return jsonify({'error': 'Internal server error'}), 500


# from flask import jsonify, request
# from collections import defaultdict
# from sqlalchemy.sql import text

# @app.route(API_URL + '/millwise-stock-report', methods=['GET'])
# def tender_reports():
#     company_code = request.args.get('Company_Code')

#     if not company_code:
#         return jsonify({"error": "Missing 'Company_Code' parameter"}), 400

#     try:
#         # Query for tender details
#         tender_details_query = text('''
#             SELECT DISTINCT Tender_No, Tender_DateConverted AS Tender_Date, millshortname AS millname,
#                             Grade, Quantal, Mill_Rate, Purc_Rate, Lifting_DateConverted AS Lifting_Date,
#                             tenderdoshortname AS doname, Lifting_DateConverted AS ld,
#                             Convert(varchar, Sauda_Date, 103) AS Sauda_Date
#             FROM qrytenderdobalanceview
#             WHERE BALANCE != 0 AND Company_Code = :company_code
#             ORDER BY Tender_No ASC;
#         ''')
#         tender_details_result = db.session.execute(tender_details_query, {'company_code': company_code}).fetchall()

#         if not tender_details_result:
#             return jsonify({"error": "No tender details found for the given Company_Code"}), 404

#         # Query for sales details
#         sales_details_query = text('''
#            SELECT dbo.qrytenderdobalanceview.ID, dbo.qrytenderdobalanceview.buyername AS buyerbrokerfullname, dbo.qrytenderdobalanceview.Sale_Rate + dbo.qrytenderdobalanceview.Commission_Rate AS Sale_Rate, 
#                   dbo.qrytenderdobalanceview.Buyer_Quantal, dbo.qrytenderdobalanceview.DESPATCH AS despatchqty, dbo.qrytenderdobalanceview.BALANCE, dbo.qrytenderdobalanceview.Tender_No, CONVERT(varchar, 
#                   dbo.qrytenderdobalanceview.Sauda_Date, 103) AS Sauda_Date, dbo.nt_1_systemmaster.System_Name_E AS Grade,ISNULL(dbo.qrytenderdobalanceview.MillRate,dbo.qrytenderdobalanceview.Mill_Rate) as MillRate
# FROM     dbo.qrytenderdobalanceview LEFT OUTER JOIN
#                   dbo.nt_1_tenderGradeDetails ON dbo.qrytenderdobalanceview.gradeid = dbo.nt_1_tenderGradeDetails.gradeid AND dbo.qrytenderdobalanceview.tenderid = dbo.nt_1_tenderGradeDetails.tenderid LEFT OUTER JOIN
#                   dbo.nt_1_systemmaster ON dbo.nt_1_tenderGradeDetails.gradeid = dbo.nt_1_systemmaster.systemid
#             WHERE dbo.qrytenderdobalanceview.Company_Code = :company_code;
#         ''')
#         sales_details_result = db.session.execute(sales_details_query, {'company_code': company_code}).fetchall()

#         if not sales_details_result:
#             return jsonify({"error": "No sales details found for the given Company_Code"}), 404

#         # Group tender details by Tender_No
#         tender_grouped = defaultdict(list)
#         for row in tender_details_result:
#             row_dict = dict(row._mapping)
#             tender_grouped[row_dict['Tender_No']].append(row_dict)

#         # Group sales details by Tender_No
#         sales_grouped = defaultdict(list)
#         for row in sales_details_result:
#             row_dict = dict(row._mapping)
#             sales_grouped[row_dict['Tender_No']].append(row_dict)

#         # Sort each Tender_No's sales list with ID=1 first
#         for tender_no in sales_grouped:
#             sales_grouped[tender_no].sort(key=lambda x: (0 if x['ID'] == 1 else 1))

#         # Construct response
#         response = {
#             "tender_details": [{"Tender_No": tender_no, "details": details} for tender_no, details in tender_grouped.items()],
#             "sales_details": [{"Tender_No": tender_no, "details": details} for tender_no, details in sales_grouped.items()]
#         }

#         return jsonify(response)

#     except Exception as e:
#         db.session.rollback()
#         return jsonify({'error': 'Failed to fetch data due to an error.', 'exception': str(e)}), 500



# @app.route(API_URL + '/self-stock-report', methods=['GET'])
# def get_self_report():
#     try:
#         company_code = request.args.get('Company_Code')
#         year_code = request.args.get('Year_Code')

#         if not company_code or not year_code:
#             return jsonify({"error": "Missing required query parameters: Company_Code, Year_Code"}), 400

#         sql_query = text('''
#             SELECT Tender_No, tenderid, millshortname, Grade, Mill_Rate, 
#                    Sale_Rate + Commission_Rate AS Sale_Rate, 
#                    Lifting_DateConverted AS Tender_Date, Buyer_Quantal, DESPATCH, BALANCE, 
#                    tenderdoshortname, Buyer, tenderdetailid, buyername
#             FROM dbo.qrytenderdobalanceview
#             WHERE Company_Code = :company_code AND Year_Code = :year_code AND Buyer_Quantal <> 0 AND Buyer = 2
#             GROUP BY Tender_No, tenderid, millshortname, Grade, Mill_Rate, Sale_Rate, Tender_Date, Buyer_Quantal, 
#                      DESPATCH, BALANCE, tenderdoname, Lifting_DateConverted, tenderdoshortname, Buyer, Commission_Rate, 
#                      tenderdetailid, buyername
#             ORDER BY millshortname
#         ''')

#         with db.engine.connect() as connection:
#             result = connection.execute(sql_query, {'company_code': company_code, 'year_code': year_code})

#             self_stock_report_detail = [dict(row._mapping) for row in result]

#         return jsonify(self_stock_report_detail)

#     except SQLAlchemyError as e:
#         return jsonify({"error": "Failed to fetch data", "details": str(e)}), 500
    

# # @app.route(API_URL + '/mill_lot_due_summary', methods=['GET'])
# # def get_mill_lot_due_summary():
# #     company_code = request.args.get('Company_Code')

# #     try:
# #         query = text(f"""
# #             WITH do_sum AS (
# #                 SELECT UTR_NO, UtrCompanyCode, UtrYearCode,
# #                        SUM(ISNULL(Amount, 0)) AS doAmount
# #                 FROM dbo.nt_1_dodetails
# #                 GROUP BY UTR_NO, UtrCompanyCode, UtrYearCode
# #             ),
# #             distinct_lots AS (
# #                 SELECT DISTINCT utrid, lot_no, Adjusted_Amt
# #                 FROM dbo.nt_1_utrdetail
# #             )
# #             SELECT u.mill_code, a.Ac_Name_E AS millname, ud.lot_no,
# #                    SUM(ISNULL(u.amount, 0)) AS utrAmount,
# #                    SUM(ISNULL(ds.doAmount, 0)) AS doAmount,
# #                      SUM(ISNULL(ud.Adjusted_Amt,0)) AS Adjusted_Amt,
# #                    SUM(ISNULL(u.amount, 0) - Adjusted_Amt - ISNULL(ds.doAmount, 0)) AS duePayment
# #             FROM dbo.nt_1_utr u
# #             INNER JOIN distinct_lots ud ON ud.utrid = u.utrid
# #             INNER JOIN dbo.nt_1_accountmaster a
# #                 ON u.mc = a.accoid AND u.Company_Code = a.company_code
# #             LEFT JOIN do_sum ds
# #                 ON u.doc_no = ds.UTR_NO
# #                 AND u.Company_Code = ds.UtrCompanyCode
# #                 AND u.Year_Code = ds.UtrYearCode
# #             WHERE u.Company_Code = :company_code
# #             GROUP BY u.mill_code, a.Ac_Name_E, ud.lot_no
# #             HAVING SUM(ISNULL(u.amount, 0) - ISNULL(ds.doAmount, 0)) <> 0
# #             ORDER BY u.mill_code, ud.lot_no
# #         """)

# #         result = db.session.execute(query, {"company_code": company_code}).fetchall()

# #         data = [
# #             {
# #                 "mill_code": row.mill_code,
# #                 "mill_name": row.millname,
# #                 "lot_no": row.lot_no,
# #                 "utrAmount": float(row.utrAmount),
# #                 "doAmount": float(row.doAmount),
# #                 "duePayment": float(row.duePayment),
# #             }
# #             for row in result
# #         ]

# #         return jsonify({"status": "success", "data": data}), 200

# #     except Exception as e:
# #         return jsonify({"status": "error", "message": str(e)}), 500


# @app.route(API_URL + '/mill_lot_due_summary', methods=['GET'])
# def get_mill_lot_due_summary():
#     company_code = request.args.get('Company_Code')

#     try:
#         query = text("""
#             WITH do_sum AS (SELECT        UTR_NO, UtrCompanyCode, UtrYearCode, SUM(ISNULL(Amount, 0)) AS doAmount
#                                         FROM            dbo.nt_1_dodetails
#                                         GROUP BY UTR_NO, UtrCompanyCode, UtrYearCode), distinct_lots AS
#     (SELECT DISTINCT utrid, lot_no, Adjusted_Amt
#       FROM            dbo.nt_1_utrdetail)
#     SELECT      u.mill_code, a.Ac_Name_E AS millname, ud.lot_no, SUM(ISNULL(u.amount, 0)) AS utrAmount, SUM(ISNULL(ds.doAmount, 0)) AS doAmount, SUM(ISNULL(ud.Adjusted_Amt, 0)) AS Adjusted_Amt, 
#                               SUM(ISNULL(u.amount, 0)) - SUM(ISNULL(ud.Adjusted_Amt, 0)) - SUM(ISNULL(ds.doAmount, 0)) AS duePayment
#      FROM            dbo.nt_1_utr AS u INNER JOIN
#                               distinct_lots AS ud ON ud.utrid = u.utrid INNER JOIN
#                               dbo.nt_1_accountmaster AS a ON u.mc = a.accoid AND u.Company_Code = a.company_code LEFT OUTER JOIN
#                               do_sum AS ds ON u.doc_no = ds.UTR_NO AND u.Company_Code = ds.UtrCompanyCode AND u.Year_Code = ds.UtrYearCode
#      WHERE        (u.Company_Code = :company_code)
#      GROUP BY u.mill_code, a.Ac_Name_E, ud.lot_no
#      HAVING         (SUM(ISNULL(u.amount, 0)) - SUM(ISNULL(ud.Adjusted_Amt, 0)) - SUM(ISNULL(ds.doAmount, 0)) <> 0)
#      ORDER BY u.mill_code, ud.lot_no
#         """)

#         result = db.session.execute(query, {"company_code": company_code}).fetchall()

#         data = [
#             {
#                 "mill_code": row.mill_code,
#                 "mill_name": row.millname,
#                 "lot_no": row.lot_no,
#                 "utrAmount": float(row.utrAmount or 0),
#                 "doAmount": float(row.doAmount or 0),
#                 "Adjusted_Amt": float(row.Adjusted_Amt or 0),
#                 "duePayment": float(row.duePayment or 0),
#             }
#             for row in result
#         ]

#         return jsonify({"status": "success", "data": data}), 200

#     except Exception as e:
#         return jsonify({"status": "error", "message": str(e)}), 500
    
# @app.route(API_URL+'/pendingreport-MillPendingPayment-Summary', methods=['GET'])
# def Pendingreport_MillPendingPayment_Summary():
#     try:
#         from_date = request.args.get('from_date')
#         to_date = request.args.get('to_date')

#         if not from_date or not to_date:
#             return jsonify({'error': 'from_date and to_date are required'}), 400

#         sql = text("""
#            WITH x AS (
#     SELECT
#         *,
#         MAX(ISNULL(millamount, 0)) OVER (
#             PARTITION BY Company_Code, Year_Code, Tender_No
#         ) AS MillTotal,
#         SUM(ISNULL(paidamount, 0)) OVER (
#             PARTITION BY Company_Code, Year_Code, Tender_No
#         ) AS UsedTotal
#     FROM qrymillpendingpaymentBalanceWithdispatch
#     WHERE Tender_Date BETWEEN :from_date AND :to_date
# )
# SELECT
#     x.*,
#     (x.MillTotal - x.UsedTotal) AS PendingAmount
# FROM x
# WHERE (x.MillTotal - x.UsedTotal) <> 0
# ORDER BY Tender_Date, Tender_No;

#         """)

#         with db.session.begin_nested():
#             rows = db.session.execute(sql, {'from_date': from_date, 'to_date': to_date}).fetchall()

#         response = []
#         for row in rows:
#             row_dict = row._asdict()
#             row_dict.update(format_dates(row_dict))  # your existing formatter
#             response.append(row_dict)

#         return jsonify(response)

#     except SQLAlchemyError as error:
#         print("Error fetching data:", error)
#         db.session.rollback()
#         return jsonify({'error': 'Internal server error'}), 500
    
# @app.route(API_URL + '/TrialBalance-SundrySummary', methods=['GET'])
# def trialbalance_sundry_summary():
#     try:
#         from_date     = request.args.get('from_date')
#         to_date       = request.args.get('to_date')
#         company_code  = request.args.get('Company_Code')
#         year_code     = request.args.get('Year_Code')
#         group_code    = request.args.get('Group_Code')  # optional

#         if not from_date or not to_date or not company_code:
#             return jsonify({'error': 'Missing from_date, to_date, or Company_Code'}), 400

#         where_sql = """
#             WHERE g.COMPANY_CODE = :company_code
#               AND g.ac_type IN ('M','P','S')
#               AND (
#                     (g.group_Type = 'B' AND g.DOC_DATE <= :to_date)
#                     OR (g.group_Type <> 'B' AND g.DOC_DATE BETWEEN :from_date AND :to_date AND g.Year_Code = :year_code)
#                   )
#         """
#         params = {
#             'from_date': from_date,
#             'to_date': to_date,
#             'company_code': company_code,
#             'year_code': year_code
#         }
#         if group_code:
#             where_sql += " AND g.Group_Code = :group_code"
#             params['group_code'] = group_code

#         # Reusable base CTE (per-account balances for the filtered set)
#         base_gl = f"""
#             WITH gl AS (
#                 SELECT
#                     g.Group_Code,
#                     g.group_Name_E,
#                     g.AC_CODE,
#                     g.Ac_Name_E,
#                     g.CityName,
#                     SUM(CASE g.drcr WHEN 'D' THEN g.Amount WHEN 'C' THEN -g.Amount END) AS Balance
#                 FROM qrygledger g
#                 {where_sql}
#                 GROUP BY g.Group_Code, g.group_Name_E, g.AC_CODE, g.Ac_Name_E, g.CityName
#             )
#         """

#         # 1) Summary by group (first execute)
#         query_groups = base_gl + """
#             , summary_by_group AS (
#                 SELECT
#                     Group_Code,
#                     MAX(group_Name_E) AS group_Name_E,
#                     SUM(CASE WHEN Balance > 0 THEN Balance ELSE 0 END) AS Debtors,
#                     SUM(CASE WHEN Balance < 0 THEN -Balance ELSE 0 END) AS Creditors
#                 FROM gl
#                 GROUP BY Group_Code
#             )
#             SELECT
#                 sg.Group_Code,
#                 sg.group_Name_E,
#                 sg.Debtors,
#                 sg.Creditors,
#                 (sg.Debtors - sg.Creditors) AS Net
#             FROM summary_by_group sg
#             ORDER BY sg.Group_Code;
#         """

#         group_rows = db.session.execute(text(query_groups), params).fetchall()

#         # 2) Totals (second execute) — define CTE again
#         query_totals = base_gl + """
#             SELECT
#                 SUM(CASE WHEN Balance > 0 THEN Balance ELSE 0 END) AS TotalDebtors,
#                 SUM(CASE WHEN Balance < 0 THEN -Balance ELSE 0 END) AS TotalCreditors
#             FROM gl;
#         """

#         totals_row = db.session.execute(text(query_totals), params).fetchone()

#         summary = [{
#             'Group_Code': r.Group_Code,
#             'group_Name_E': r.group_Name_E,
#             'Debtors': float(r.Debtors or 0),
#             'Creditors': float(r.Creditors or 0),
#             'Net': float(r.Net or 0),
#         } for r in group_rows]

#         totals_debtors = float((totals_row.TotalDebtors if totals_row else 0) or 0)
#         totals_creditors = float((totals_row.TotalCreditors if totals_row else 0) or 0)
#         totals = {
#             'Debtors': totals_debtors,
#             'Creditors': totals_creditors,
#             'Net': totals_debtors - totals_creditors
#         }

#         return jsonify({'summary_by_group': summary, 'totals': totals})

#     except SQLAlchemyError as e:
#         db.session.rollback()
#         return jsonify({'error': 'Database error', 'details': str(e)}), 500
#     except Exception as e:
#         return jsonify({'error': 'Unexpected error', 'details': str(e)}), 500
    


# @app.route(API_URL + '/TrialBalance-SundryDetails', methods=['GET'])
# def trialbalance_sundry_details():
#     try:
#         from_date     = request.args.get('from_date')
#         to_date       = request.args.get('to_date')
#         company_code  = request.args.get('Company_Code')
#         year_code     = request.args.get('Year_Code')
#         group_code    = request.args.get('Group_Code')     # 10=Debtors, 4=Creditors
#         ac_type       = request.args.get('ac_type')        # OPTIONAL: 'M' | 'P' | 'S'

#         if not from_date or not to_date or not company_code:
#             return jsonify({'error': 'Missing from_date, to_date, or Company_Code'}), 400

#         where_sql = """
#             WHERE g.COMPANY_CODE = :company_code
#               AND g.ac_type IN ('M','P','S')
#               AND (
#                     (g.group_Type = 'B' AND g.DOC_DATE <= :to_date)
#                     OR (g.group_Type <> 'B' AND g.DOC_DATE BETWEEN :from_date AND :to_date AND g.Year_Code = :year_code)
#                   )
#         """

#         order_by_sql = "ORDER BY ABS(Balance) DESC"

#         params = {
#             'from_date': from_date,
#             'to_date': to_date,
#             'company_code': company_code,
#             'year_code': year_code
#         }
#         if group_code:
#             where_sql += " AND g.Group_Code = :group_code"
#             params['group_code'] = group_code
#         if ac_type in ('M', 'P', 'S'):
#             where_sql += " AND g.ac_type = :ac_type"
#             params['ac_type'] = ac_type

#         query = f"""
#             WITH gl AS (
#                 SELECT
#                     g.ac_type,
#                     g.AC_CODE,
#                     MAX(g.Ac_Name_E)   AS Ac_Name_E,
#                     MAX(g.CityName)    AS CityName,
#                     SUM(CASE g.drcr WHEN 'D' THEN g.Amount WHEN 'C' THEN -g.Amount END) AS Balance
#                 FROM qrygledger g
#                 {where_sql}
#                 GROUP BY g.ac_type, g.AC_CODE
#             )
#             SELECT
#                 ac_type,
#                 AC_CODE,
#                 Ac_Name_E,
#                 CityName,
#                 CASE WHEN Balance > 0 THEN Balance ELSE 0 END AS Debit,
#                 CASE WHEN Balance < 0 THEN -Balance ELSE 0 END AS Credit,
#                 Balance
#             FROM gl
#             WHERE Balance <> 0
#             { "AND Balance > 0" if group_code == "10" else "" }
#             { "AND Balance < 0" if group_code == "4"  else "" }
#             {order_by_sql};
#         """

#         rows = db.session.execute(text(query), params).fetchall()
#         data = [{
#             'ac_type':  r.ac_type,
#             'AC_CODE':  r.AC_CODE,
#             'Ac_Name_E': r.Ac_Name_E,
#             'CityName':  r.CityName,
#             'Debit':     float(r.Debit or 0),
#             'Credit':    float(r.Credit or 0),
#             'Balance':   float(r.Balance or 0)
#         } for r in rows]

#         total_debit  = sum(d['Debit'] for d in data)
#         total_credit = sum(d['Credit'] for d in data)

#         return jsonify({
#             'rows': data,
#             'totals': {
#                 'Debtors': total_debit,
#                 'Creditors': total_credit,
#                 'Net': total_debit - total_credit
#             }
#         })

#     except SQLAlchemyError as e:
#         db.session.rollback()
#         return jsonify({'error': 'Database error', 'details': str(e)}), 500
#     except Exception as e:
#         return jsonify({'error': 'Unexpected error', 'details': str(e)}), 500

