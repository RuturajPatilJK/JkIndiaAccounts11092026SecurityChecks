from app import app, db
from sqlalchemy.exc import SQLAlchemyError 
from sqlalchemy import text
from flask import jsonify, request
from flask import Flask, jsonify, request
from flask_mail import Mail, Message
import os
import traceback
import requests
from app.utils.CommonGLedgerFunctions import fetch_company_parameters, get_ac_Name, get_accoid
from datetime import datetime, timedelta, timezone

API_URL = os.getenv('API_URL')
API_SERVER = os.getenv('API_URL_SERVER')

def format_dates(task):
    return {
        # "PaymentDate": task['PaymentDate'].strftime('%Y-%m-%d') if task['PaymentDate'] else None,
        # "Sauda_Date": task['Sauda_Date'].strftime('%Y-%m-%d') if task['Sauda_Date'] else None,
    }

mail = Mail(app)

@app.route(API_URL + '/ProfitLoss_Report', methods=['GET'])
def ProfitLoss_Report():
    try:
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        company_code = request.args.get('Company_Code')
        # gcid = request.args.get('gcid') 
       
        if not from_date or not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400

        with db.session.begin_nested():
            query = db.session.execute(text('''
                select AC_CODE, Ac_Name_E,SUM(case drcr when 'D' then AMOUNT when 'C' then -amount end) as Balance ,
					 Group_Code,group_Summary,BSGroupName,group_Type,group_Order
					 from qryGledgernew 
					 where Company_Code= :company_code and DOC_DATE between :from_date and :to_date
					   group by AC_CODE,Ac_Name_E,Group_Code ,group_Summary,BSGroupName,group_Type,group_Order
					 having SUM(case drcr when 'D' then AMOUNT when 'C' then -amount end) !=0
                '''), {'from_date': from_date, 'to_date': to_date, 'company_code': company_code})

            result = query.fetchall()

            if not result:
                return jsonify({'message': 'No data found for the provided parameters'}), 404

            response = [
                {
                    **row._asdict(),
                }
                for row in result
            ]

        return jsonify(response)

    except SQLAlchemyError as error:
        print("Error fetching data:", error) 
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500
    except ValueError as e:
        return jsonify({'error': 'Invalid input type for groupType'}), 400
    

#According to the Group code we get the profit and loss by gcid

# @app.route(API_URL + '/ProfitLoss_Report', methods=['GET'])
# def ProfitLoss_Report():
#     try:
#         from_date = request.args.get('from_date')
#         to_date = request.args.get('to_date')
#         company_code = request.args.get('Company_Code')
#         gcid = request.args.get('gcid') 
       
#         if not from_date or not to_date:
#             return jsonify({'error': 'from_date and to_date are required'}), 400

#         with db.session.begin_nested():
#             query = db.session.execute(text('''
#                  select AC_CODE, Ac_Name_E,SUM(case drcr when 'D' then AMOUNT when 'C' then -amount end) as Balance ,
# 					 Group_Code,group_Summary,BSGroupName,group_Type,group_Order
# 					 from qryGledgernew 
# 					 where Company_Code= :company_code and DOC_DATE between :from_date and :to_date and gcid = :gcid
# 					   group by AC_CODE,Ac_Name_E,Group_Code ,group_Summary,BSGroupName,group_Type,group_Order
# 					 having SUM(case drcr when 'D' then AMOUNT when 'C' then -amount end) !=0
#                 '''), {'from_date': from_date, 'to_date': to_date, 'company_code': company_code, 'gcid': gcid})

#             result = query.fetchall()

#             if not result:
#                 return jsonify({'message': 'No data found for the provided parameters'}), 404

#             response = [
#                 {
#                     **row._asdict(),
#                 }
#                 for row in result
#             ]

#         return jsonify(response)

#     except SQLAlchemyError as error:
#         print("Error fetching data:", error) 
#         db.session.rollback()
#         return jsonify({'error': 'Internal server error'}), 500
#     except ValueError as e:
#         return jsonify({'error': 'Invalid input type for groupType'}), 400

@app.route(API_URL + '/Balancesheet_Report', methods=['GET'])
def Balancesheet_Report():
    try:
        # Extract query parameters
        
        to_date = request.args.get('to_date')
        company_code = request.args.get('Company_Code')
        Year_Code=request.args.get('Year_Code')

        # Validate required parameters
        if not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400

        with db.session.begin_nested():
            # Choose query based on groupType
            query = db.session.execute(text('''
                 
                    select Group_Code,BSGroupName as groupname,group_Summary as summary,group_Order,AC_CODE, Ac_Name_E,
                    SUM(case drcr when 'D' then AMOUNT when 'C' then -amount end) as Balance,'' as acamount,CASE
  WHEN SUM(CASE WHEN drcr='D' THEN amount WHEN drcr='C' THEN -amount END) >= 0 THEN 'D'
  ELSE 'C'
END AS BalanceDrCr   from 
                    qryGledgernew where Company_Code =:company_code and YEAR_CODE <=:Year_Code
                    and group_Type='B' and DOC_DATE <= :to_date
                    group by Group_Code,BSGroupName,group_Summary,group_Order,AC_CODE,Ac_Name_E
                    having SUM(case drcr when 'D' then AMOUNT when 'C' then -amount end) <> 0 
                    order by group_Order,Group_Code 
  
                '''), {'Year_Code': Year_Code, 'to_date': to_date, 'company_code': company_code})

            result = query.fetchall()

            if not result:
                return jsonify({'message': 'No data found for the provided parameters'}), 404

            response = [
                {
                    **row._asdict(),
                }
                for row in result
            ]

        return jsonify(response)

    except SQLAlchemyError as error:
        print("Error fetching data:", error) 
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500
    except ValueError as e:
        return jsonify({'error': 'Invalid input type for groupType'}), 400
    

@app.route(API_URL + '/closing-stock-report', methods=['GET'])
def closing_stock_report():
    try:
        fromDate = request.args.get('fromDate')
        ToDate = request.args.get('ToDate')
        year_code = request.args.get('Year_Code')
        company_code = request.args.get('company_code')
        Item_Code = request.args.get('Item_Code')  # optional

        if not fromDate or not ToDate or not year_code or not company_code:
            return jsonify({'error': 'Missing required parameters'}), 400

        # ---------- 1) ClosingQty (from stockbook between fromDate..ToDate) ----------
        if not Item_Code or int(Item_Code) == 0:
            qty_sql = text("""
                SELECT ClosingQty = CAST(SUM(ISNULL(inward,0) - ISNULL(outward,0)) AS decimal(18,3))
                FROM qrystockbookfinal
                WHERE doc_date <= :ToDt
                  AND Company_Code = :CompanyCode
                  AND Year_Code = :YearCode
            """)
            qty_row = db.session.execute(qty_sql, {
                "FromDt": fromDate,
                "ToDt": ToDate,
                "CompanyCode": int(company_code),
                "YearCode": int(year_code)
            }).fetchone()
        else:
            qty_sql = text("""
                SELECT ClosingQty = CAST(SUM(ISNULL(inward,0) - ISNULL(outward,0)) AS decimal(18,3))
                FROM qrystockbookfinal
                WHERE  doc_date <= :ToDt
                  AND Company_Code = :CompanyCode
                  AND Year_Code = :YearCode
                  AND item_code = :ItemCode
            """)
            qty_row = db.session.execute(qty_sql, {
                "ToDt": ToDate,
                "CompanyCode": int(company_code),
                "YearCode": int(year_code),
                "ItemCode": int(Item_Code)
            }).fetchone()

        closing_qty = float(qty_row[0]) if qty_row and qty_row[0] is not None else 0.0

        if closing_qty <= 0:
            return jsonify({
                "ToDate": ToDate,
                "ClosingQty": round(closing_qty, 3),
                "ClosingValue": 0.0,
                "AvgRate": 0.0
            })

        # ---------- 2) ClosingValue (handles BOTH cases automatically) ----------
        # Case A: ClosingQty <= latest purchase qty -> rate * ClosingQty
        # Case B: ClosingQty > latest purchase qty  -> sum latest purchases with partial last row
        close_val_sql = text("""
        DECLARE @ToDt date = :ToDt;
        DECLARE @CompanyCode int = :CompanyCode;
        DECLARE @ClosingQty decimal(38,6) = :ClosingQty;

        ;WITH P AS (
            SELECT
                p.doc_no,
                p.doc_date,
                netqntl  = CAST(p.netqntl  AS decimal(38,6)),
                subTotal = CAST(p.subTotal AS decimal(38,6)),
                rate     = CAST(p.subTotal AS decimal(38,12)) / NULLIF(CAST(p.netqntl AS decimal(38,12)), 0)
            FROM dbo.nt_1_sugarpurchase p
            WHERE p.Company_Code = @CompanyCode
              AND p.PURCNO = 0
              AND p.doc_date <= @ToDt
              AND ISNULL(p.netqntl, 0) > 0
        ),
        FirstRow AS (
            SELECT TOP (1) *
            FROM P
            ORDER BY doc_date DESC
        ),
        SingleVal AS (
            SELECT ClosingValue = CAST(@ClosingQty * f.rate AS decimal(18,2)),
                   AvgRate      = CAST(f.rate AS decimal(18,6))
            FROM FirstRow f
            WHERE @ClosingQty <= f.netqntl
        ),
        R AS (
            SELECT
                p.*,
                run_qty      = SUM(p.netqntl) OVER (ORDER BY p.doc_date DESC, p.doc_no ASC),
                prev_run_qty = SUM(p.netqntl) OVER (ORDER BY p.doc_date DESC, p.doc_no ASC) - p.netqntl
            FROM P p
        ),
        Adj AS (
            SELECT
                r.*,
                AdjustedQty = CAST(
                    CASE
                        WHEN r.prev_run_qty >= @ClosingQty THEN 0
                        WHEN r.run_qty     <= @ClosingQty THEN r.netqntl
                        ELSE r.netqntl - (r.run_qty - @ClosingQty)
                    END
                AS decimal(38,6))
            FROM R r
        ),
        Val AS (
            SELECT AdjustedValue = CAST(AdjustedQty * rate AS decimal(18,2))
            FROM Adj
            WHERE AdjustedQty > 0
        ),
        MultiVal AS (
            SELECT ClosingValue = CAST(SUM(AdjustedValue) AS decimal(18,2)),
                   AvgRate      = CAST(SUM(AdjustedValue) / NULLIF(@ClosingQty,0) AS decimal(18,6))
            FROM Val
        )
        SELECT ClosingValue, AvgRate FROM SingleVal
        UNION ALL
        SELECT ClosingValue, AvgRate FROM MultiVal
        WHERE NOT EXISTS (SELECT 1 FROM SingleVal);
        """)

        val_row = db.session.execute(close_val_sql, {
            "ToDt": ToDate,
            "CompanyCode": int(company_code),
            "ClosingQty": float(closing_qty)
        }).fetchone()

        closing_value = float(val_row[0]) if val_row and val_row[0] is not None else 0.0
        avg_rate = float(val_row[1]) if val_row and val_row[1] is not None else 0.0

        return jsonify({
            "FromDate": fromDate,
            "ToDate": ToDate,
            "ClosingQty": round(closing_qty, 3),
            "ClosingValue": round(closing_value, 2),
            "AvgRate": round(avg_rate, 6)
        })

    except Exception as e:
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500
    

# @app.route(API_URL + "/post-closing-stock", methods=["GET"])
# def post_stock_report():
#     try:
#         company_code = request.args.get("Company_Code")
#         year_code = request.args.get("Year_Code")
#         closing_value_raw = request.args.get("ClosingValue")
#         doc_date_raw = request.args.get("doc_date")
#         Created_By = request.args.get("Created_By", "")

#         if not company_code or not year_code:
#             return jsonify({"ok": False, "message": "Company_Code and Year_Code required"}), 400

#         try:
#             closing_value = float(closing_value_raw or 0)
#         except:
#             return jsonify({"ok": False, "message": "ClosingValue must be a number"}), 400

#         # if closing_value <= 0:
#         #     return jsonify({"ok": False, "message": "ClosingValue must be > 0"}), 400

#         IST = timezone(timedelta(hours=5, minutes=30))
#         if doc_date_raw:
#             try:
#                 doc_date = datetime.strptime(doc_date_raw, "%Y-%m-%d").date().isoformat()
#             except:
#                 return jsonify({"ok": False, "message": "doc_date must be YYYY-MM-DD"}), 400
#         else:
#             doc_date = datetime.now(IST).date().isoformat()

#         # fetch company parameters
#         try:
#             company_parameter = fetch_company_parameters(company_code, year_code)
#         except Exception as e:
#             return jsonify({"ok": False, "message": f"CompanyParameter fetch failed: {str(e)}"}), 500
        

#         closing_stock_trading_ac = company_parameter.closing_stock_trading_ac
#         closing_stock_bl_ac = company_parameter.closing_stock_bL_ac

#         # account names
#         trading_name = get_ac_Name(int(closing_stock_trading_ac), company_code) or ""
#         bl_name = get_ac_Name(int(closing_stock_bl_ac), company_code) or ""

#         # SYSTEM-BUILT narration ONLY (no request input)
#         posted_date = datetime.now(IST).strftime("%Y-%m-%d")
#         base_narr = (
#             f"Closing Stock Posting JV Dt:{posted_date} "
#             f"Amt:{closing_value:.2f} "
#             f"CR:{trading_name}({int(closing_stock_trading_ac)}) "
#             f"DR:{bl_name}({int(closing_stock_bl_ac)}) "
#         )

#         # JV HEAD
#         jv_head = {
#             "tran_type": "JV",
#             "doc_date": posted_date,
#             "company_code": company_code,
#             "year_code": year_code,
#             "total": f"{closing_value:.2f}",
#             "Created_By": Created_By,
#             "Modified_By": "",
#         }

#         # JV DETAILS (2 rows)
#         jv_details = [
#             # CR: closing_stock_trading_ac
#             {
#                 "rowaction": "add",
#                 "detail_id": 1,
#                 "Tran_Type": "JV",
#                 "doc_date": doc_date,

#                 "debit_ac": int(closing_stock_trading_ac),
#                 "da": get_accoid(closing_stock_trading_ac,company_code),
#                 "credit_ac": int(closing_stock_trading_ac),
#                 "ca":get_accoid(closing_stock_trading_ac,company_code),

#                 "amount": f"{closing_value:.2f}",
#                 "narration": base_narr,

#                 "Company_Code": company_code,
#                 "Year_Code": year_code,
#                 "Group_Code": 1,
#                 "drcr": "C",
#                 "Branch_Code": 1,

#                 "ac": "",
#                 "gcid": 71,
#                 "AcadjAccode": "",
#                 "AcadjAmt": 0,
#                 "Adjusted_Amount": 0,
#                 "GRN": "",
#                 "TReceipt": "",
#                 "Tender_No": 0,
#                 "Unit_Code": "",
#                 "Voucher_No": "",
#                 "Voucher_Type": "",
#                 "uc": "",
#                 "tenderdetailid": 0,
#                 "drpFilterValue": "O",
#             },
#             # DR: closing_stock_bl_ac
#             {
#                 "rowaction": "add",
#                 "detail_id": 2,
#                 "Tran_Type": "JV",
#                 "doc_date": posted_date,

#                 "debit_ac": int(closing_stock_bl_ac),
#                 "da": get_accoid(closing_stock_bl_ac,company_code),
#                 "credit_ac": int(closing_stock_bl_ac),
#                 "ca":get_accoid(closing_stock_bl_ac,company_code),

#                 "amount": f"{closing_value:.2f}",
#                 "narration": base_narr,

#                 "Company_Code": company_code,
#                 "Year_Code": year_code,
#                 "Group_Code": 1,
#                 "drcr": "D",
#                 "Branch_Code": 1,

#                 "ac": "",
#                 "gcid": 71,
#                 "AcadjAccode": "",
#                 "AcadjAmt": 0,
#                 "Adjusted_Amount": 0,
#                 "GRN": "",
#                 "TReceipt": "",
#                 "Tender_No": 0,
#                 "Unit_Code": "",
#                 "Voucher_No": "",
#                 "Voucher_Type": "",
#                 "uc": "",
#                 "tenderdetailid": 0,
#                 "drpFilterValue": "O",
#             },
#         ]

#         # CALL EXISTING INSERT API
#         try:
#             jv_url = f"{API_SERVER}/insert-receiptpayment"
#             jv_response = requests.post(
#                 jv_url,
#                 json={"head_data": jv_head, "detail_data": jv_details},
#                 timeout=60
#             )

#             if jv_response.status_code != 200:
#                 return jsonify({"ok": False, "message": f"JV API failed: {jv_response.text}"}), 500

#             return jsonify({
#                 "ok": True,
#                 "message": "Closing stock JV posted",
#                 "total": f"{closing_value:.2f}",
#                 "doc_date": doc_date,
#                 "dr_ac": int(closing_stock_bl_ac),
#                 "cr_ac": int(closing_stock_trading_ac),
#                 "narration": base_narr,
#                 "jv_api_response": (
#                     jv_response.json()
#                     if jv_response.headers.get("content-type", "").startswith("application/json")
#                     else jv_response.text
#                 )
#             }), 200

#         except Exception as e:
#             return jsonify({"ok": False, "message": f"JV post error: {str(e)}"}), 500

#     except Exception as e:
#         return jsonify({"ok": False, "message": str(e)}), 500


@app.route(API_URL + "/post-closing-stock-gledger-only", methods=["GET"])
def post_closing_stock_gledger_only():
    try:
        company_code = request.args.get("Company_Code")
        year_code = request.args.get("Year_Code")
        closing_value_raw = request.args.get("ClosingValue")
        doc_date_raw = request.args.get("doc_date")
        Created_By = request.args.get("Created_By", "")

        if not company_code or not year_code:
            return jsonify({"ok": False, "message": "Company_Code and Year_Code required"}), 400

        try:
            company_code = int(company_code)
            year_code = int(year_code)
        except:
            return jsonify({"ok": False, "message": "Company_Code and Year_Code must be numbers"}), 400

        try:
            closing_value = float(closing_value_raw or 0)
        except:
            return jsonify({"ok": False, "message": "ClosingValue must be a number"}), 400

        IST = timezone(timedelta(hours=5, minutes=30))

        # Use provided doc_date if sent, else today
        if doc_date_raw:
            try:
                doc_date = datetime.strptime(doc_date_raw, "%Y-%m-%d").date().isoformat()
            except:
                return jsonify({"ok": False, "message": "doc_date must be YYYY-MM-DD"}), 400
        else:
            doc_date = datetime.now(IST).date().isoformat()

       
        company_parameter = fetch_company_parameters(company_code, year_code)

        closing_stock_trading_ac = int(company_parameter.closing_stock_trading_ac)
        closing_stock_bl_ac = int(company_parameter.closing_stock_bL_ac)

        trading_name = get_ac_Name(closing_stock_trading_ac, company_code) or ""
        bl_name = get_ac_Name(closing_stock_bl_ac, company_code) or ""

        base_narr = (
            f"Closing Stock Posting Dt:{doc_date} By:{Created_By} "
            f"Amt:{closing_value:.2f} "
            f"CR:{trading_name}({closing_stock_trading_ac}) "
            f"DR:{bl_name}({closing_stock_bl_ac})"
        )

        gledger_tran_type = "OO"

        doc_no = 9999

        if closing_value <= 0:
            safe_delete_sql = text("""
                DELETE FROM nt_1_gledger
                WHERE COMPANY_CODE = :company_code
                AND YEAR_CODE    = :year_code
                AND TRAN_TYPE    = :tran_type
                AND DOC_NO       = :doc_no
            """)

            db.session.execute(safe_delete_sql, {
                "company_code": company_code,
                "year_code": year_code,
                "tran_type": gledger_tran_type,
                "doc_no": doc_no
            })
            db.session.commit()

            return jsonify({
                "ok": True,
                "message": "Closing value is 0 or negative, so GLedger entry deleted only (no posting done).",
                "Company_Code": company_code,
                "Year_Code": year_code,
                "DOC_NO": doc_no,
                "TRAN_TYPE": gledger_tran_type,
                "doc_date": doc_date,
                "amount": f"{closing_value:.2f}"
            }), 200
        
        gledger_rows = [
            # CR trading
            {
                "DRCR": "C",
                "AC_CODE": closing_stock_trading_ac,
                "ac": get_accoid(closing_stock_trading_ac, company_code),
                "AMOUNT": round(closing_value, 2),
                "NARRATION": base_narr,
                "DOC_DATE": doc_date,
                "ORDER_CODE": 1,
                "CA_NARRATION": base_narr,
                "SORT_TYPE": gledger_tran_type,
                "SORT_NO": doc_no,
                "COMPANY_CODE": company_code,
                "YEAR_CODE": year_code,

            },
            # DR balance sheet
            {
                "DRCR": "D",
                "AC_CODE": closing_stock_bl_ac,
                "ac": get_accoid(closing_stock_bl_ac, company_code),
                "AMOUNT": round(closing_value, 2),
                "NARRATION": base_narr,
                "DOC_DATE": doc_date,
                "ORDER_CODE": 2,
                "CA_NARRATION": base_narr,
                "SORT_TYPE": gledger_tran_type,
                "SORT_NO": doc_no,
                "COMPANY_CODE": company_code,
                "YEAR_CODE": year_code,
            },
        ]

        # Call your existing create gledger API (it will DELETE + INSERT)
        url = f"{API_SERVER}/create-Record-gLedger"
        resp = requests.post(
            url,
            params={
                "Company_Code": company_code,
                "DOC_NO": doc_no,
                "Year_Code": year_code,
                "TRAN_TYPE": gledger_tran_type,
                # "saleid": 0  # not needed for OO
            },
            json=gledger_rows,
            timeout=60
        )

        if resp.status_code not in (200, 201):
            return jsonify({"ok": False, "message": "GLedger insert failed", "details": resp.text}), 500

        return jsonify({
            "ok": True,
            "message": "Closing stock posted to GLedger only",
            "Company_Code": company_code,
            "Year_Code": year_code,
            "DOC_NO": doc_no,
            "TRAN_TYPE": gledger_tran_type,
            "doc_date": doc_date,
            "amount": f"{closing_value:.2f}",
            "dr_ac": closing_stock_bl_ac,
            "cr_ac": closing_stock_trading_ac,
            "narration": base_narr,
            "gledger_api_response": (resp.json() if resp.headers.get("content-type","").startswith("application/json") else resp.text)
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"ok": False, "message": str(e)}), 500