from flask import jsonify, request
from app import app, db
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
import os
from datetime import datetime

API_URL = os.getenv("API_URL", "")

@app.route(API_URL + '/select-multiple-tender-details', methods=["GET"])
def tender_details():
    try:
        mill_code = request.args.get("Mill_Code")
        company_code = request.args.get("Company_Code")

        if not mill_code or not company_code:
            return jsonify({"error": "Mill_Code and Company_Code are required"}), 400

        sql = text("""
            SELECT TOP (100) PERCENT
                q.Tender_No,
                q.Tender_Date,
                q.Company_Code,
                q.Lifting_Date,
                q.Grade,
                q.Quantal,
                q.Mill_Rate,
                q.paymenttoname,
                q.Mill_Code,
                q.Tender_DateConverted,
                a.Ac_Name_E AS Paymet_To
            FROM dbo.qrytenderhead q
            INNER JOIN dbo.nt_1_accountmaster a
                ON q.pt = a.accoid
            WHERE q.Mill_Code = :mill_code
              AND q.Company_Code = :company_code
            ORDER BY q.Tender_Date DESC
        """)

        result = db.session.execute(sql, {
            "mill_code": mill_code,
            "company_code": company_code
        }).fetchall()

        response = [
            {
                "Tender_No": row.Tender_No,
                "Tender_Date": row.Tender_Date.strftime("%d/%m/%Y") if row.Tender_Date else None,
                "Company_Code": row.Company_Code,
                "Lifting_Date": row.Lifting_Date.strftime("%d/%m/%Y") if row.Lifting_Date else None,
                "Grade": row.Grade,
                "Quantal": row.Quantal,
                "Mill_Rate": row.Mill_Rate,
                "paymenttoname": row.paymenttoname,
                "Mill_Code": row.Mill_Code,
                "Tender_DateConverted": row.Tender_DateConverted,
                "Paymet_To": row.Paymet_To
            }
            for row in result
        ]

        return jsonify(response), 200

    except SQLAlchemyError as error:
        db.session.rollback()
        print("Database Error:", error)
        return jsonify({"error": "Database error occurred"}), 500

    except Exception as error:
        print("Unexpected Error:", error)
        return jsonify({"error": "Internal server error"}), 500


@app.route(API_URL + "/select-tender-dispatch-details", methods=["GET"])
def select_tender_dispatch_details():
    try:
        # ---------- GET QUERY PARAMS ----------
        sale_bill_to = request.args.get("SaleBillTo")   # OPTIONAL
        mill_code = request.args.get("Mill_Code")       # OPTIONAL
        tender_no = request.args.get("Tender_No")       # OPTIONAL
        from_date = request.args.get("From_Date")       # REQUIRED
        to_date = request.args.get("To_Date")           # REQUIRED

        # ---------- REQUIRED VALIDATION (DATES ONLY) ----------
        if not from_date or not to_date:
            return jsonify({
                "error": "From_Date and To_Date are required"
            }), 400

        # ---------- PARSE DATES ----------
        try:
            from_date_obj = datetime.strptime(from_date, "%d/%m/%Y")
            to_date_obj = datetime.strptime(to_date, "%d/%m/%Y")
        except ValueError:
            return jsonify({
                "error": "Invalid date format. Use DD/MM/YYYY"
            }), 400

        if from_date_obj > to_date_obj:
            return jsonify({
                "error": "From_Date cannot be greater than To_Date"
            }), 400

        # ---------- PARSE OPTIONAL LIST PARAMS ----------
        sale_bill_to_list = None
        if sale_bill_to:
            sale_bill_to_list = tuple(int(x) for x in sale_bill_to.split(","))

        tender_no_list = None
        if tender_no:
            tender_no_list = tuple(int(x) for x in tender_no.split(","))

        # ---------- BASE QUERY ----------
        query = """
            SELECT
                mill.Short_Name AS millname,
                broker.Ac_Name_E AS saudaname,
                billname.Ac_Name_E AS billto,
                t.Tender_No,
                t.Tender_Date,
                t.Mill_Code,
                td.Buyer,
                g.System_Name_E AS Grade,
                td.Mill_Rate,
                td.Buyer_Quantal,
                doo.quantal AS doqntl,
                doo.truck_no,
                doo.sale_rate,
                doo.doc_date
            FROM dbo.nt_1_deliveryorder AS doo
            INNER JOIN dbo.nt_1_accountmaster AS billname
                ON billname.accoid = doo.sb
            INNER JOIN dbo.nt_1_tenderdetails AS td
                ON doo.tenderdetailid = td.tenderdetailid
            INNER JOIN dbo.nt_1_tender AS t
                ON t.tenderid = td.tenderid
            INNER JOIN dbo.nt_1_accountmaster AS mill
                ON t.mc = mill.accoid
            LEFT OUTER JOIN dbo.qrymstgrade AS g
                ON g.systemid = td.gradeid
            LEFT OUTER JOIN dbo.nt_1_accountmaster AS broker
                ON td.buyerid = broker.accoid
            WHERE 1 = 1
        """

        params = {
            "from_date": from_date_obj,
            "to_date": to_date_obj
        }

        # ---------- OPTIONAL FILTERS ----------
        if sale_bill_to_list:
            query += " AND td.Buyer IN :sale_bill_to"
            params["sale_bill_to"] = sale_bill_to_list

        if mill_code:
            query += " AND doo.mill_code = :mill_code"
            params["mill_code"] = mill_code

        if tender_no_list:
            query += " AND t.Tender_No IN :tender_no"
            params["tender_no"] = tender_no_list

        # ---------- DATE FILTER (MANDATORY) ----------
        query += """
            AND doo.doc_date BETWEEN :from_date AND :to_date
            ORDER BY doo.doc_date, t.Tender_No
        """

        # ---------- EXECUTION ----------
        result = db.session.execute(text(query), params).fetchall()

        # ---------- RESPONSE ----------
        response = [
            {
                "millname": r.millname,
                "saudaname": r.saudaname,
                "billto": r.billto,
                "Tender_No": r.Tender_No,
                "Tender_Date": r.Tender_Date.strftime("%d/%m/%Y") if r.Tender_Date else None,
                "Mill_Code": r.Mill_Code,
                "Buyer": r.Buyer,
                "Grade": r.Grade,
                "Mill_Rate": r.Mill_Rate,
                "Buyer_Quantal": r.Buyer_Quantal,
                "DO_Quantal": r.doqntl,
                "Truck_No": r.truck_no,
                "Sale_Rate": r.sale_rate,
                "doc_date": r.doc_date.strftime("%d/%m/%Y") if r.doc_date else None
            }
            for r in result
        ]

        return jsonify(response), 200

    except SQLAlchemyError as e:
        db.session.rollback()
        print("Database Error:", e)
        return jsonify({"error": "Database error occurred"}), 500

    except Exception as e:
        print("Unexpected Error:", e)
        return jsonify({"error": "Unexpected server error"}), 500
