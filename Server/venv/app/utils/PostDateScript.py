from datetime import datetime, timedelta
from flask import jsonify
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from app import app, db, socketio
import os

API_URL = os.getenv('API_URL')

@app.route(API_URL + "/update-post-date", methods=["POST"])
def update_post_date():
    try:
        updated_rows = 0
        today_minus_3 = (datetime.now() - timedelta(days=3)).strftime('%Y-%m-%d')

        # 🔹 Step 1: Get latest year_code per company (current year)
        current_years_query = text("""
            SELECT a.Company_Code, MAX(a.yearCode) AS CurrentYearCode
            FROM dbo.accountingyear a
            GROUP BY a.Company_Code
        """)
        current_years = {row.Company_Code: row.CurrentYearCode for row in db.session.execute(current_years_query).fetchall()}

        # 🔹 Step 2: Update all years — one by one to avoid deadlock
        all_years_query = text("""
            SELECT p.Company_Code, p.Year_Code, a.End_Date
            FROM dbo.post_date p
            INNER JOIN dbo.accountingyear a 
                ON p.Company_Code = a.Company_Code AND p.Year_Code = a.yearCode
        """)
        all_rows = db.session.execute(all_years_query).fetchall()

        for row in all_rows:
            is_current_year = row.Year_Code == current_years.get(row.Company_Code)
            new_post_date = today_minus_3 if is_current_year else row.End_Date.strftime('%Y-%m-%d')

            update_query = text("""
                UPDATE dbo.post_date
                SET Post_Date = :post_date
                WHERE Company_Code = :company_code AND Year_Code = :year_code
            """)
            result = db.session.execute(update_query, {
                "post_date": new_post_date,
                "company_code": row.Company_Code,
                "year_code": row.Year_Code
            })
            updated_rows += result.rowcount

        db.session.commit()
        socketio.emit("PostDate_Updated", {
            
               "updated_rows": updated_rows })


        return jsonify({
            "message": "Post_Date updated for all years per company",
            "updated_rows": updated_rows,
            "current_date_minus_3": today_minus_3
        }), 200

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
