from app import app, db
from sqlalchemy.exc import SQLAlchemyError 
from sqlalchemy import text, bindparam, Integer, Date
from flask import jsonify, request
from flask import Flask, jsonify, request
from flask_mail import Mail, Message
import os
from datetime import datetime
import logging



API_URL = os.getenv('API_URL')

def format_dates(task):
    return {
        # "PaymentDate": task['PaymentDate'].strftime('%Y-%m-%d') if task['PaymentDate'] else None,
        # "Sauda_Date": task['Sauda_Date'].strftime('%Y-%m-%d') if task['Sauda_Date'] else None,
    }

mail = Mail(app)


# @app.route(API_URL + '/TrialBalance-Report', methods=['GET'])
# def TrialBalance_Report():
#     try:
#         # Extract query parameters
#         from_date = request.args.get('from_date')
#         to_date = request.args.get('to_date')
#         company_code = request.args.get('Company_Code')
#         groupType = request.args.get('groupType')

#         if not from_date or not to_date:
#             return jsonify({'error': 'from_date and to_date are required'}), 400

#         print(f"GroupType: {groupType}")

#         with db.session.begin_nested():
#             if groupType == 0:
#                 query = db.session.execute(text('''
#                     SELECT 
#                         AC_CODE, 
#                         Ac_Name_E, 
#                         CityName, 
#                         SUM(CASE drcr WHEN 'D' THEN AMOUNT WHEN 'C' THEN -AMOUNT END) AS Balance, 
#                         group_Type, 
#                         Group_Code, 
#                         group_Name_E
#                     FROM qrygledger 
#                     WHERE COMPANY_CODE = :company_code 
#                       AND ((group_Type = 'B' AND DOC_DATE <= :to_date) 
#                            OR (group_Type != 'B' AND DOC_DATE BETWEEN :from_date AND :to_date))
#                     GROUP BY AC_CODE, Ac_Name_E, CityName, group_Type, Group_Code, group_Name_E 
#                     HAVING SUM(CASE drcr WHEN 'D' THEN AMOUNT WHEN 'C' THEN -AMOUNT END) != 0 
#                     ORDER BY Ac_Name_E, CityName;
#                 '''), {'from_date': from_date, 'to_date': to_date, 'company_code': company_code})

#             elif groupType != "AllTrailBalance":
#                 query = db.session.execute(text('''
#                     SELECT 
#                         AC_CODE, 
#                         Ac_Name_E, 
#                         CityName, 
#                         SUM(CASE drcr WHEN 'D' THEN AMOUNT WHEN 'C' THEN -AMOUNT END) AS Balance, 
#                         group_Type, 
#                         Group_Code, 
#                         group_Name_E
#                     FROM qrygledger 
#                     WHERE Group_Code = :groupType 
#                       AND COMPANY_CODE = :company_code 
#                       AND ((group_Type = 'B' AND DOC_DATE <= :to_date) 
#                            OR (group_Type != 'B' AND DOC_DATE BETWEEN :from_date AND :to_date))
#                     GROUP BY AC_CODE, Ac_Name_E, CityName, group_Type, Group_Code, group_Name_E 
#                     HAVING SUM(CASE drcr WHEN 'D' THEN AMOUNT WHEN 'C' THEN -AMOUNT END) != 0 
#                     ORDER BY Ac_Name_E, CityName;
#                 '''), {'from_date': from_date, 'to_date': to_date, 'company_code': company_code, 'groupType': groupType})

#             else:
#                 query = db.session.execute(text('''
#                     SELECT 
#                         AC_CODE, 
#                         Ac_Name_E, 
#                         CityName, 
#                         SUM(CASE drcr WHEN 'D' THEN AMOUNT WHEN 'C' THEN -AMOUNT END) AS Balance, 
#                         group_Type, 
#                         Group_Code, 
#                         group_Name_E
#                     FROM qrygledger 
#                     WHERE 
#                        COMPANY_CODE = :company_code 
#                       AND ((group_Type = 'B' AND DOC_DATE <= :to_date) 
#                            OR (group_Type != 'B' AND DOC_DATE BETWEEN :from_date AND :to_date))
#                     GROUP BY AC_CODE, Ac_Name_E, CityName, group_Type, Group_Code, group_Name_E 
#                     HAVING SUM(CASE drcr WHEN 'D' THEN AMOUNT WHEN 'C' THEN -AMOUNT END) != 0 
#                     ORDER BY Ac_Name_E, CityName;
#                 '''), {'from_date': from_date, 'to_date': to_date, 'company_code': company_code})

#             # Fetch results
#             result = query.fetchall()

#             # Check if result is empty
#             if not result:
#                 return jsonify({'message': 'No data found for the provided parameters'}), 404

#             # Format response
#             response = [
#                 {
#                     **row._asdict(),
#                     # Add any additional processing if required, e.g., formatting dates
#                 }
#                 for row in result
#             ]

#         return jsonify(response)

#     except SQLAlchemyError as error:
#         print("Error fetching data:", error)  # Log error stack
#         db.session.rollback()
#         return jsonify({'error': 'Internal server error'}), 500
#     except ValueError as e:
#         return jsonify({'error': 'Invalid input type for groupType'}), 400

@app.route(API_URL + '/TrialBalance-Report', methods=['GET'])
def TrialBalance_Report():
    try:
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        company_code = request.args.get('Company_Code')
        group_type_filter = request.args.get('groupType')
        year_code = request.args.get('Year_Code')

        if not from_date or not to_date or not company_code:
            return jsonify({'error': 'Missing from_date, to_date, or Company_Code'}), 400

        if group_type_filter and group_type_filter != "AllTrailBalance":
            where_clause = """
                WHERE g.Group_Code = :group_type_filter
                  AND g.COMPANY_CODE = :company_code
                  AND (
                        (g.group_Type = 'B' AND g.DOC_DATE <= :to_date)
                        OR (g.group_Type != 'B' AND g.DOC_DATE BETWEEN :from_date AND :to_date AND g.Year_Code = :year_code)
                  )
            """
            params = {
                'from_date': from_date,
                'to_date': to_date,
                'company_code': company_code,
                'group_type_filter': group_type_filter,
                'year_code': year_code
            }
        else:
            where_clause = """
                WHERE g.COMPANY_CODE = :company_code
                  AND (
                        (g.group_Type = 'B' AND g.DOC_DATE <= :to_date)
                        OR (g.group_Type != 'B' AND g.DOC_DATE BETWEEN :from_date AND :to_date AND g.Year_Code = :year_code)
                  ) 
            """
            params = {
                'from_date': from_date,
                'to_date': to_date,
                'company_code': company_code,
                'year_code': year_code
            }

        query = f"""
            SELECT 
                g.AC_CODE,
                g.Ac_Name_E,
                g.CityName,
                g.Group_Code,
                g.group_Name_E,
                g.group_Type,
                SUM(CASE g.drcr WHEN 'D' THEN g.Amount WHEN 'C' THEN -g.Amount END) AS Balance
            FROM qrygledger g
            {where_clause}
            GROUP BY g.AC_CODE, g.Ac_Name_E, g.CityName, g.Group_Code, g.group_Name_E, g.group_Type
            HAVING SUM(CASE g.drcr WHEN 'D' THEN g.Amount WHEN 'C' THEN -g.Amount END) != 0
            ORDER BY g.Group_Code, g.Ac_Name_E, g.CityName
        """

        result = db.session.execute(text(query), params).fetchall()

        if not result:
            return jsonify({'message': 'No data found'}), 404

        response = []
        for row in result:
            balance = float(row.Balance or 0)
            response.append({
                'AC_CODE': row.AC_CODE,
                'Ac_Name_E': row.Ac_Name_E,
                'CityName': row.CityName,
                'Group_Code': row.Group_Code,
                'group_Name_E': row.group_Name_E,
                'group_Type': row.group_Type,
                'Balance': balance,
                'Debit': balance if balance > 0 else 0.00,
                'Credit': abs(balance) if balance < 0 else 0.00
            })

        return jsonify(response)

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': 'Database error', 'details': str(e)}), 500

    except Exception as e:
        return jsonify({'error': 'Unexpected error', 'details': str(e)}), 500


# @app.route(API_URL+'/TrialBalanceDetail-Report', methods=['GET'])
# def TrialBalanceDetail_Report():
#     try:
#         from_date = request.args.get('from_date')
#         to_date = request.args.get('to_date')
#         company_code = request.args.get('Company_Code')
#         # year_code = request.args.get('Year_Code')

#         if not from_date or not to_date:
#             return jsonify({'error': 'from_date and to_date are required'}), 400

#         with db.session.begin_nested():
#             query = db.session.execute(text('''
#                 select ac_code,SUM(case when DOC_DATE < :from_date then case when DRCR='D' then AMOUNT  else -amount end else 0 end ) as opbal ,
# SUM(case when DOC_DATE between :from_date and :to_date then case when DRCR='D' then AMOUNT else 0 end else 0 end ) as debit, 
# SUM(case when DOC_DATE between :from_date and :to_date then case when DRCR='C' then AMOUNT else 0 end else 0 end ) as credit,Ac_Name_E,group_Type, 
#  0 as Op_Debit,0 as Op_Credit,0 as Tran_Debit, 0 as Tran_Credit,0 as Closing_Debit,0 as Closing_Credit 
# from qryGledgernew 
#         where DOC_DATE <= :to_date and Company_Code=1 group by ac_code,Ac_Name_E,group_Type  
# having SUM(case when DOC_DATE < :from_date then case when DRCR='D' then AMOUNT  else -amount end else 0 end ) <> 0 and
# SUM(case when DOC_DATE between :from_date and :to_date then case when DRCR='D' then AMOUNT else 0 end else 0 end ) <>0  and  SUM(case when DOC_DATE
# between :from_date and :to_date then case when DRCR='C' then AMOUNT else 0 end else 0 end ) <> 0 
#             '''), {'from_date': from_date, 'to_date': to_date,'company_code' :company_code})
           
#             result = query.fetchall()

#         response = []
#         for row in result:
#             row_dict = row._asdict()
#             formatted_dates = format_dates(row_dict)
#             row_dict.update(formatted_dates)
#             response.append(row_dict)

#         return jsonify(response)

#     except SQLAlchemyError as error:
#         print("Error fetching data:", error)
#         db.session.rollback()
#         return jsonify({'error': 'Internal server error'}), 500


# @app.route(API_URL+'/TrialBalanceDetail-Report', methods=['GET'])
# def TrialBalanceDetail_Report():
#     try:
#         from_date = request.args.get('from_date')
#         to_date = request.args.get('to_date')
#         company_code = request.args.get('Company_Code')
#         group_type_filter = request.args.get('groupType')
#         # year_code = request.args.get('Year_Code')

#         if not from_date or not to_date:
#             return jsonify({'error': 'from_date and to_date are required'}), 400

#         with db.session.begin_nested():
#             query = db.session.execute(text('''
#                 select ac_code,SUM(case when DOC_DATE < :from_date then case when DRCR='D' then AMOUNT  else -amount end else 0 end ) as opbal ,
# SUM(case when DOC_DATE between :from_date and :to_date then case when DRCR='D' then AMOUNT else 0 end else 0 end ) as debit, 
# SUM(case when DOC_DATE between :from_date and :to_date then case when DRCR='C' then AMOUNT else 0 end else 0 end ) as credit,Ac_Name_E,group_Type, 
#  0 as Op_Debit,0 as Op_Credit,0 as Tran_Debit, 0 as Tran_Credit,0 as Closing_Debit,0 as Closing_Credit,BSGroupName as group_Name_E
# from qryGledgernew 
#         where DOC_DATE <= :to_date and Company_Code=:company_code and Group_Code = :group_type_filter group by ac_code,Ac_Name_E,group_Type ,BSGroupName
# having SUM(case when DOC_DATE < :from_date then case when DRCR='D' then AMOUNT  else -amount end else 0 end ) <> 0 OR
# SUM(case when DOC_DATE between :from_date and :to_date then case when DRCR='D' then AMOUNT else 0 end else 0 end ) <>0  OR  SUM(case when DOC_DATE
# between :from_date and :to_date then case when DRCR='C' then AMOUNT else 0 end else 0 end ) <> 0
#             '''), {'from_date': from_date, 'to_date': to_date,'company_code' : company_code, 'group_type_filter':group_type_filter})
           
#             result = query.fetchall()

#         if group_type_filter and group_type_filter != 'AllTrailBalance':
#             base_sql = base_sql.format(group_filter=' AND Group_Code = :group_type_filter')
#             # cast to int if Group_Code is numeric
#             params['group_type_filter'] = int(group_type_filter)
#         else:
#             base_sql = base_sql.format(group_filter='')

#         result = db.session.execute(text(base_sql), params).mappings().all()

#         response = []
#         for row in result:
#             row_dict = row._asdict()
#             formatted_dates = format_dates(row_dict)
#             row_dict.update(formatted_dates)
#             response.append(row_dict)

#         return jsonify(response)

#     except SQLAlchemyError as error:
#         print("Error fetching data:", error)
#         db.session.rollback()
#         return jsonify({'error': 'Internal server error'}), 500
    

@app.route(API_URL + '/TrialBalanceDetail-Report', methods=['GET'])
def TrialBalanceDetail_Report():
    try:
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        company_code = request.args.get('Company_Code')
        group_type_filter = request.args.get('groupType')

        if not from_date or not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400

        # Build SQL with optional group filter
        base_sql = '''
            SELECT ac_code,
                   SUM(CASE WHEN DOC_DATE < :from_date
                            THEN CASE WHEN DRCR = 'D' THEN AMOUNT ELSE -AMOUNT END
                            ELSE 0 END) AS opbal,
                   SUM(CASE WHEN DOC_DATE BETWEEN :from_date AND :to_date
                            THEN CASE WHEN DRCR = 'D' THEN AMOUNT ELSE 0 END
                            ELSE 0 END) AS debit,
                   SUM(CASE WHEN DOC_DATE BETWEEN :from_date AND :to_date
                            THEN CASE WHEN DRCR = 'C' THEN AMOUNT ELSE 0 END
                            ELSE 0 END) AS credit,
                   Ac_Name_E,
                   group_Type,
                   0 AS Op_Debit,
                   0 AS Op_Credit,
                   0 AS Tran_Debit,
                   0 AS Tran_Credit,
                   0 AS Closing_Debit,
                   0 AS Closing_Credit,
                   BSGroupName AS group_Name_E,Gst_No
            FROM qryGledgernew
            WHERE DOC_DATE <= :to_date
              AND Company_Code = :company_code
              {group_filter}
            GROUP BY ac_code, Ac_Name_E, group_Type, BSGroupName,Gst_No
            HAVING
                SUM(CASE WHEN DOC_DATE < :from_date
                         THEN CASE WHEN DRCR = 'D' THEN AMOUNT ELSE -AMOUNT END
                         ELSE 0 END) <> 0
             OR SUM(CASE WHEN DOC_DATE BETWEEN :from_date AND :to_date
                         THEN CASE WHEN DRCR = 'D' THEN AMOUNT ELSE 0 END
                         ELSE 0 END) <> 0
             OR SUM(CASE WHEN DOC_DATE BETWEEN :from_date AND :to_date
                         THEN CASE WHEN DRCR = 'C' THEN AMOUNT ELSE 0 END
                         ELSE 0 END) <> 0
        '''

        params = {
            'from_date': from_date,
            'to_date': to_date,
            'company_code': company_code,
        }

        # Handle groupType = "AllTrailBalance" (no additional filter)
        if group_type_filter and group_type_filter != 'AllTrailBalance':
            base_sql = base_sql.format(group_filter=' AND Group_Code = :group_type_filter')
            # cast to int if Group_Code is numeric
            params['group_type_filter'] = int(group_type_filter)
        else:
            base_sql = base_sql.format(group_filter='')

        result = db.session.execute(text(base_sql), params).mappings().all()

        response = []
        for row in result:
            row_dict = dict(row)
            # if format_dates() is generic, keep it; otherwise you can drop it
            formatted_dates = format_dates(row_dict)
            row_dict.update(formatted_dates)
            response.append(row_dict)

        return jsonify(response)

    except SQLAlchemyError as error:
        # log full original error, not just rollback
        print("Error fetching data:", error)
        return jsonify({'error': 'Internal server error'}), 500




@app.route(API_URL + '/DaywiseTrialBalanceDetail-Report', methods=['GET'])
def DaywiseTrialBalanceDetail_Report():
    try:
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        company_code = request.args.get('Company_Code')

        if not from_date or not to_date or not company_code:
            return jsonify({'error': 'from_date, to_date, and Company_Code are required'}), 400

        with db.session.begin_nested():
            query = db.session.execute(text('''
                SELECT 
                    SUM(CASE WHEN DOC_DATE < :from_date THEN 
                        CASE WHEN g.DRCR = 'D' THEN AMOUNT ELSE -AMOUNT END ELSE 0 END) AS opening,
                    
                    SUM(CASE WHEN DOC_DATE BETWEEN :from_date AND :to_date THEN 
                        CASE WHEN g.DRCR = 'D' THEN AMOUNT ELSE 0 END ELSE 0 END) AS debit,
                    
                    SUM(CASE WHEN DOC_DATE BETWEEN :from_date AND :to_date THEN 
                        CASE WHEN g.DRCR = 'C' THEN AMOUNT ELSE 0 END ELSE 0 END) AS credit,
                    
                    SUM(CASE WHEN DOC_DATE < :from_date THEN 
                        CASE WHEN g.DRCR = 'D' THEN AMOUNT ELSE -AMOUNT END ELSE 0 END) +
                    SUM(CASE WHEN DOC_DATE BETWEEN :from_date AND :to_date THEN 
                        CASE WHEN g.DRCR = 'D' THEN AMOUNT ELSE 0 END ELSE 0 END) -
                    SUM(CASE WHEN DOC_DATE BETWEEN :from_date AND :to_date THEN 
                        CASE WHEN g.DRCR = 'C' THEN AMOUNT ELSE 0 END ELSE 0 END) AS balance,

                    g.AC_CODE, a.Ac_Name_E, c.city_name_e

                FROM dbo.nt_1_gledger g
                INNER JOIN dbo.nt_1_accountmaster a ON g.ac = a.accoid
                INNER JOIN dbo.nt_1_citymaster c ON a.cityid = c.cityid

                WHERE a.Company_Code = :company_code

                GROUP BY g.AC_CODE, a.Ac_Name_E, a.Group_Code, c.city_name_e

                HAVING 
                    a.Group_Code IN (4, 10) AND
                    (
                        SUM(CASE WHEN DOC_DATE < :from_date THEN 
                            CASE WHEN g.DRCR = 'D' THEN AMOUNT ELSE -AMOUNT END ELSE 0 END) +
                        SUM(CASE WHEN DOC_DATE BETWEEN :from_date AND :to_date THEN 
                            CASE WHEN g.DRCR = 'D' THEN AMOUNT ELSE 0 END ELSE 0 END) -
                        SUM(CASE WHEN DOC_DATE BETWEEN :from_date AND :to_date THEN 
                            CASE WHEN g.DRCR = 'C' THEN AMOUNT ELSE 0 END ELSE 0 END)
                    ) <> 0
            '''), {
                'from_date': from_date,
                'to_date': to_date,
                'company_code': company_code
            })

            result = query.fetchall()

        response = []
        for row in result:
            row_dict = row._asdict()
            formatted_dates = format_dates(row_dict) if 'format_dates' in globals() else {}
            row_dict.update(formatted_dates)
            response.append(row_dict)

        return jsonify(response)

    except SQLAlchemyError as error:
        print("Error fetching data:", error)
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500

@app.route(API_URL + '/JV-Report', methods=['GET'])
def JV_Report():
    try:
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        doc_no = request.args.get('doc_no', None)  

        if not from_date or not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400

        sql_query = '''
            SELECT TRAN_TYPE, DOC_NO, CONVERT(varchar(10), DOC_DATE, 103) AS DOC_DATE,
                   Ac_Name_E, NARRATION,
                   (CASE WHEN DRCR = 'D' THEN amount ELSE 0 END) AS Debit,
                   (CASE WHEN DRCR = 'C' THEN amount ELSE 0 END) AS Credit
            FROM NT_1_qryJVAll 
            WHERE Company_Code = :company_code AND Year_Code = :year_code
                  AND DOC_DATE BETWEEN :from_date AND :to_date
        '''

        params = {
            'from_date': from_date,
            'to_date': to_date,
            'company_code': company_code,
            'year_code': year_code
        }

        if doc_no:
            sql_query += " AND DOC_NO = :doc_no"
            params['doc_no'] = doc_no

        with db.session.begin_nested():
            query = db.session.execute(text(sql_query), params)
            result = query.fetchall()

        response = [row._asdict() for row in result]
        return jsonify(response)

    except SQLAlchemyError as error:
        print("Error fetching data:", error)
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500


@app.route(API_URL+'/GettingGroupType', methods=['GET'])
def GettingGroupType():
    try:
       
        company_code = request.args.get('Company_Code')
       

        if not company_code :
            return jsonify({'error': 'from_date and to_date are required'}), 400

        with db.session.begin_nested():
            query = db.session.execute(text('''
                       select group_Code,group_Name_E from nt_1_bsgroupmaster
                        where Company_Code=:company_code 
                        order by group_Name_E ASC
                  '''), {'company_code' :company_code})
           
            result = query.fetchall()

        response = []
        for row in result:
            row_dict = row._asdict()
            formatted_dates = format_dates(row_dict)
            row_dict.update(formatted_dates)
            response.append(row_dict)

        return jsonify(response)

    except SQLAlchemyError as error:
        print("Error fetching data:", error)
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500
    

# @app.route(API_URL + '/AgingAnalysis-Report-Debtors', methods=['GET'])
# def AgingAnalysis_Report_Debtors():
#     try:
#         to_dt_str = request.args.get("toDT")          # e.g. "2025-03-31" or "2025/03/31"
#         company_code = request.args.get("Company_Code")

#         if not (company_code and to_dt_str):
#             return jsonify({"error": "Company_Code, Year_Code, toDT are required"}), 400

#         # Normalize & parse date
#         to_dt_str = to_dt_str.replace("/", "-")
#         to_dt = datetime.strptime(to_dt_str, "%Y-%m-%d").date()  # use .datetime() if proc expects DATETIME

#         # Name the parameters in EXEC (avoids order issues) + bind types
#         sql = text("""
#             EXEC AgingAnalysis
#                 @Company_Code = :Company_Code,
#                 @toDT         = :toDT
#         """).bindparams(
#             bindparam("Company_Code", type_=Integer),
#             bindparam("toDT", type_=Date),  # use DateTime if proc param is DATETIME
#         )

#         params = {
#             "Company_Code": int(company_code),
#             "toDT": to_dt,
#         }

#         rows = db.session.execute(sql, params).mappings().all()
#         return jsonify([dict(r) for r in rows])
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500







@app.route(API_URL + '/AgingAnalysis-Report-Debtors', methods=['GET'])
def AgingAnalysis_Report_Debtors():
    try:
        to_dt_str = request.args.get("toDT")
        company_code = request.args.get("Company_Code")
        group_code = request.args.get("Group_code")

        if not (company_code and to_dt_str and group_code):
            return jsonify({"error": "Company_Code, Group_Code, toDT are required"}), 400

        to_dt = datetime.strptime(to_dt_str.replace("/", "-"), "%Y-%m-%d").date()

        with db.session.begin():

            db.session.execute(
        text("""
            UPDATE nt_1_accountmaster
            SET TempGstNo='' 
            WHERE company_code = :company_code
        """),
        {"company_code": company_code}
         ),
            db.session.execute(
        text("""
            UPDATE nt_1_accountmaster
            SET TempGstNo=Gst_No
            WHERE company_code = :company_code and Group_Code= :group_code
        """),
        {"company_code": company_code, "group_code": group_code,}
        ),

            db.session.execute(
        text("""
            UPDATE nt_1_gledger
            SET accode = Ac_Code,
                acid     = ac
            WHERE company_code = :company_code
        """),
        {"company_code": company_code}
        )
            db.session.execute(
                text("""
                    UPDATE gl
                    SET gl.accode = amFix.Ac_Code,
                        gl.acid     = amFix.accoid
                    FROM nt_1_gledger gl
                    JOIN nt_1_accountmaster am
                        ON gl.accode = am.Ac_Code
                    JOIN (
                        SELECT
                            TempGstNo,
                            MIN(Ac_Code) AS Ac_Code
                        FROM nt_1_accountmaster
                        WHERE Group_Code = :group_code
                          AND TempGstNo <> ''
                          AND company_code = :company_code
                        GROUP BY TempGstNo
                        HAVING COUNT(*) > 0
                    ) g
                        ON am.TempGstNo = g.TempGstNo
                    JOIN nt_1_accountmaster amFix
                        ON amFix.TempGstNo = g.TempGstNo
                       AND amFix.Ac_Code = g.Ac_Code
                    WHERE gl.company_code = :company_code
                    and amFix.Group_Code = :group_code
                """),
                {
                    "group_code": group_code,
                    "company_code": company_code
                }
            )

        rows = db.session.execute(
            text("""
                EXEC AgingAnalysis
                    @Company_Code = :Company_Code,
                    @toDT         = :toDT,
                    @groupcode    = :groupcode
                 
            """),
            {
                "Company_Code": int(company_code),
                "toDT": to_dt,
                "groupcode": int(group_code)
            }
        ).mappings().all()

        return jsonify([dict(r) for r in rows])

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    

    


@app.route(API_URL + '/AgingAnalysis-Report-Creditors', methods=['GET'])
def AgingAnalysis_Report_Creditors():
    try:
        to_dt_str = request.args.get("toDT")
        company_code = request.args.get("Company_Code")
        group_code = request.args.get("Group_code")

        if not (company_code and to_dt_str and group_code):
            return jsonify({"error": "Company_Code, Group_Code, toDT are required"}), 400

        to_dt = datetime.strptime(to_dt_str.replace("/", "-"), "%Y-%m-%d").date()

        with db.session.begin():

            db.session.execute(
        text("""
            UPDATE nt_1_accountmaster
            SET TempGstNo='' 
            WHERE company_code = :company_code
        """),
        {"company_code": company_code}
         ),
            db.session.execute(
        text("""
            UPDATE nt_1_accountmaster
            SET TempGstNo=Gst_No
            WHERE company_code = :company_code and Group_Code= :group_code
        """),
        {"company_code": company_code, "group_code": group_code,}
        ),

            db.session.execute(
        text("""
            UPDATE nt_1_gledger
            SET accode = Ac_Code,
                acid     = ac
            WHERE company_code = :company_code
        """),
        {"company_code": company_code}
        )
            db.session.execute(
                text("""
                    UPDATE gl
                    SET gl.accode = amFix.Ac_Code,
                        gl.acid     = amFix.accoid
                    FROM nt_1_gledger gl
                    JOIN nt_1_accountmaster am
                        ON gl.accode = am.Ac_Code
                    JOIN (
                        SELECT
                            TempGstNo,
                            MIN(Ac_Code) AS Ac_Code
                        FROM nt_1_accountmaster
                        WHERE Group_Code = :group_code
                          AND TempGstNo <> ''
                          AND company_code = :company_code
                        GROUP BY TempGstNo
                        HAVING COUNT(*) > 0
                    ) g
                        ON am.TempGstNo = g.TempGstNo
                    JOIN nt_1_accountmaster amFix
                        ON amFix.TempGstNo = g.TempGstNo
                       AND amFix.Ac_Code = g.Ac_Code
                    WHERE gl.company_code = :company_code
                    and amFix.Group_Code = :group_code
                """),
                {
                    "group_code": group_code,
                    "company_code": company_code
                }
            )

        rows = db.session.execute(
            text("""
                EXEC AgingAnalysisCreditors
                    @Company_Code = :Company_Code,
                    @toDT         = :toDT,
                    @groupcode    = :groupcode
                 
            """),
            {
                "Company_Code": int(company_code),
                "toDT": to_dt,
                "groupcode": int(group_code)
            }
        ).mappings().all()

        return jsonify([dict(r) for r in rows])

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    

@app.route(API_URL + '/DaywiseTrialBalanceWithoutOpenning-Report', methods=['GET'])
def DaywiseTrialBalanceWithoutOpenning_Report():
    try:
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        company_code = request.args.get('Company_Code')

        if not from_date or not to_date or not company_code:
            return jsonify({'error': 'from_date, to_date, and Company_Code are required'}), 400

        with db.session.begin_nested():
            query = db.session.execute(text('''
                SELECT 
                    0 AS opening,
                    
                    SUM(CASE WHEN DOC_DATE BETWEEN :from_date AND :to_date THEN 
                        CASE WHEN g.DRCR = 'D' THEN AMOUNT ELSE 0 END ELSE 0 END) AS debit,
                    
                    SUM(CASE WHEN DOC_DATE BETWEEN :from_date AND :to_date THEN 
                        CASE WHEN g.DRCR = 'C' THEN AMOUNT ELSE 0 END ELSE 0 END) AS credit,
                    
                    SUM(CASE WHEN DOC_DATE < :from_date THEN 
                        CASE WHEN g.DRCR = 'D' THEN AMOUNT ELSE -AMOUNT END ELSE 0 END) +
                    SUM(CASE WHEN DOC_DATE BETWEEN :from_date AND :to_date THEN 
                        CASE WHEN g.DRCR = 'D' THEN AMOUNT ELSE 0 END ELSE 0 END) -
                    SUM(CASE WHEN DOC_DATE BETWEEN :from_date AND :to_date THEN 
                        CASE WHEN g.DRCR = 'C' THEN AMOUNT ELSE 0 END ELSE 0 END) AS balance,

                    g.AC_CODE, a.Ac_Name_E, c.city_name_e

                FROM dbo.nt_1_gledger g
                INNER JOIN dbo.nt_1_accountmaster a ON g.ac = a.accoid
                INNER JOIN dbo.nt_1_citymaster c ON a.cityid = c.cityid

                WHERE a.Company_Code = :company_code

                GROUP BY g.AC_CODE, a.Ac_Name_E, a.Group_Code, c.city_name_e

                HAVING 
                    a.Group_Code IN (4, 10) AND
                    (
                        SUM(CASE WHEN DOC_DATE < :from_date THEN 
                            CASE WHEN g.DRCR = 'D' THEN AMOUNT ELSE -AMOUNT END ELSE 0 END) +
                        SUM(CASE WHEN DOC_DATE BETWEEN :from_date AND :to_date THEN 
                            CASE WHEN g.DRCR = 'D' THEN AMOUNT ELSE 0 END ELSE 0 END) -
                        SUM(CASE WHEN DOC_DATE BETWEEN :from_date AND :to_date THEN 
                            CASE WHEN g.DRCR = 'C' THEN AMOUNT ELSE 0 END ELSE 0 END)
                    ) <> 0
            '''), {
                'from_date': from_date,
                'to_date': to_date,
                'company_code': company_code
            })

            result = query.fetchall()

        response = []
        for row in result:
            row_dict = row._asdict()
            formatted_dates = format_dates(row_dict) if 'format_dates' in globals() else {}
            row_dict.update(formatted_dates)
            response.append(row_dict)

        return jsonify(response)

    except SQLAlchemyError as error:
        print("Error fetching data:", error)
        db.session.rollback()
        



@app.route(API_URL + '/AgingAnalysisBalanceReport', methods=['GET'])
def AgingAnalysisBalanceReport():
    try:
        to_dt_str = request.args.get("to_date")
        from_dt_str = request.args.get("from_date")
        company_code = request.args.get("Company_Code")
        acCode = request.args.get("acCode")

        if not (company_code and to_dt_str and from_dt_str and acCode):
            return jsonify({"error": "Company_Code, from_date, to_date, acCode are required"}), 400
        
        
        with db.session.begin():
            query = text("""
                    SELECT 
                        gl.AC_CODE, 
                        dbo.nt_1_accountmaster.Ac_Name_E, 
                        ISNULL(SUM(CASE 
                            WHEN gl.DRCR = 'D' THEN gl.AMOUNT 
                            ELSE -gl.AMOUNT 
                        END), 0) AS Balance
                    FROM dbo.nt_1_gledger AS gl
                    LEFT JOIN dbo.nt_1_accountmaster 
                        ON gl.AC_CODE = dbo.nt_1_accountmaster.Ac_Code 
                        AND gl.COMPANY_CODE = dbo.nt_1_accountmaster.company_code
                    
                    WHERE gl.COMPANY_CODE = :company_code
                    AND gl.DOC_DATE < :Todate
                    AND gl.accode = :Accode

                    GROUP BY gl.AC_CODE, dbo.nt_1_accountmaster.Ac_Name_E
                """)

            params = {
                    "company_code": company_code,
                    "Todate": to_dt_str,
                    "Accode": acCode
                }

           
            rows = db.session.execute(query, params)

       # rows = db.session.execute(query, params)
            result = [dict(r._mapping) for r in rows]


        return jsonify(result)
    

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500



@app.route(API_URL + '/AgingAnalysisBalanceReportNew', methods=['GET'])
def AgingAnalysisBalanceReportNew():
    try:
        to_dt_str = request.args.get("toDT")
        company_code = request.args.get("Company_Code")

        if not (company_code and to_dt_str):
            return jsonify({"error": "Company_Code and toDT are required"}), 400
        
        # Robust Date Parsing
        to_dt = None
        for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y"):
            try:
                to_dt = datetime.strptime(to_dt_str, fmt).date()
                break
            except ValueError:
                continue
        
        if not to_dt:
            return jsonify({"error": "Invalid date format. Use YYYY-MM-DD, DD/MM/YYYY, or DD-MM-YYYY"}), 400

        params = {
            "company_code": company_code,
            "Todate": to_dt
        }

        # Initialize result containers
        negative_list = []
        positive_list = []

        # Use a single connection block to execute both
        with db.engine.connect() as connection:
            # 1. Query for Credit/Negative Balances (<= -50,000)
            query_neg = text("""
          
SELECT        dbo.nt_1_bsgroupmaster.group_Code, dbo.nt_1_bsgroupmaster.group_Name_E, dbo.nt_1_bsgroupmaster.Company_Code, dbo.nt_1_accountmaster.Ac_Name_E, dbo.nt_1_citymaster.city_name_e, 
                         dbo.nt_1_accountmaster.Gst_No, SUM(CASE WHEN dbo.nt_1_gledger.drcr = 'D' THEN dbo.nt_1_gledger.AMOUNT ELSE - dbo.nt_1_gledger.AMOUNT END) AS balance,dbo.nt_1_accountmaster.Ac_Code
FROM            dbo.nt_1_bsgroupmaster INNER JOIN
                         dbo.nt_1_accountmaster ON dbo.nt_1_bsgroupmaster.bsid = dbo.nt_1_accountmaster.bsid INNER JOIN
                         dbo.nt_1_gledger ON dbo.nt_1_accountmaster.accoid = dbo.nt_1_gledger.ac INNER JOIN
                         dbo.nt_1_citymaster ON dbo.nt_1_accountmaster.cityid = dbo.nt_1_citymaster.cityid
WHERE        (dbo.nt_1_bsgroupmaster.group_Code IN (10, 4, 63, 60)) AND (dbo.nt_1_bsgroupmaster.Company_Code = :company_code)  AND CAST(dbo.nt_1_gledger.DOC_DATE AS DATE) <= :Todate
GROUP BY dbo.nt_1_bsgroupmaster.group_Code, dbo.nt_1_bsgroupmaster.group_Name_E, dbo.nt_1_bsgroupmaster.Company_Code, dbo.nt_1_accountmaster.Ac_Name_E, dbo.nt_1_citymaster.city_name_e, 
                         dbo.nt_1_accountmaster.Gst_No,dbo.nt_1_accountmaster.Ac_Code
HAVING        (SUM(CASE WHEN dbo.nt_1_gledger.drcr = 'D' THEN dbo.nt_1_gledger.AMOUNT ELSE - dbo.nt_1_gledger.AMOUNT END) <= - 50000)


            """)
            
            res_neg = connection.execute(query_neg, params)
            negative_list = [dict(row._mapping) for row in res_neg]

            # 2. Query for Debit/Positive Balances (>= 50,000)
            query_pos = text("""
     
SELECT        dbo.nt_1_bsgroupmaster.group_Code, dbo.nt_1_bsgroupmaster.group_Name_E, dbo.nt_1_bsgroupmaster.Company_Code, dbo.nt_1_accountmaster.Ac_Name_E, dbo.nt_1_citymaster.city_name_e, 
                         dbo.nt_1_accountmaster.Gst_No, SUM(CASE WHEN dbo.nt_1_gledger.drcr = 'D' THEN dbo.nt_1_gledger.AMOUNT ELSE - dbo.nt_1_gledger.AMOUNT END) AS balance,dbo.nt_1_accountmaster.Ac_Code
FROM            dbo.nt_1_bsgroupmaster INNER JOIN
                         dbo.nt_1_accountmaster ON dbo.nt_1_bsgroupmaster.bsid = dbo.nt_1_accountmaster.bsid INNER JOIN
                         dbo.nt_1_gledger ON dbo.nt_1_accountmaster.accoid = dbo.nt_1_gledger.ac INNER JOIN
                         dbo.nt_1_citymaster ON dbo.nt_1_accountmaster.cityid = dbo.nt_1_citymaster.cityid
WHERE        (dbo.nt_1_bsgroupmaster.group_Code IN (10, 4, 63, 60)) AND (dbo.nt_1_bsgroupmaster.Company_Code = :company_code) AND CAST(dbo.nt_1_gledger.DOC_DATE AS DATE) <= :Todate
GROUP BY dbo.nt_1_bsgroupmaster.group_Code, dbo.nt_1_bsgroupmaster.group_Name_E, dbo.nt_1_bsgroupmaster.Company_Code, dbo.nt_1_accountmaster.Ac_Name_E, dbo.nt_1_citymaster.city_name_e, 
                         dbo.nt_1_accountmaster.Gst_No,dbo.nt_1_accountmaster.Ac_Code
HAVING        (SUM(CASE WHEN dbo.nt_1_gledger.drcr = 'D' THEN dbo.nt_1_gledger.AMOUNT ELSE - dbo.nt_1_gledger.AMOUNT END) >= 50000)


            """)
            
            res_pos = connection.execute(query_pos, params)
            positive_list = [dict(row._mapping) for row in res_pos]

        # Final Response Object
        return jsonify({
            "status": "success",
            "date_threshold": str(to_dt),
            "negative_balances": negative_list,  # <= -50000
            "positive_balances": positive_list   # >= 50000
        }), 200

    except Exception as e:
        logging.error(f"Error in AgingAnalysis: {str(e)}")
        return jsonify({"error": "Internal Server Error", "message": str(e)}), 500







@app.route(API_URL + '/AgingAnalysis-Report-Debtorsgstwise', methods=['GET'])
def AgingAnalysis_Report_Debtorsgstwise():
    try:
        to_dt_str = request.args.get("toDT")
        company_code = request.args.get("Company_Code")
        group_code = request.args.get("Group_code")

        if not (company_code and to_dt_str and group_code):
            return jsonify({"error": "Company_Code, Group_Code, toDT are required"}), 400

        to_dt = datetime.strptime(to_dt_str.replace("/", "-"), "%Y-%m-%d").date()

        with db.session.begin():

            db.session.execute(
        text("""
            UPDATE nt_1_accountmaster
            SET TempGstNo='' 
            WHERE company_code = :company_code
        """),
        {"company_code": company_code}
         ),
            db.session.execute(
        text("""
            UPDATE nt_1_accountmaster
            SET TempGstNo=Gst_No
            WHERE company_code = :company_code and Group_Code= :group_code
        """),
        {"company_code": company_code, "group_code": group_code,}
        ),

            db.session.execute(
        text("""
            UPDATE nt_1_gledger
            SET accode = Ac_Code,
                acid     = ac
            WHERE company_code = :company_code
        """),
        {"company_code": company_code}
        )
            db.session.execute(
                text("""
                    UPDATE gl
                    SET gl.accode = amFix.Ac_Code,
                        gl.acid     = amFix.accoid
                    FROM nt_1_gledger gl
                    JOIN nt_1_accountmaster am
                        ON gl.accode = am.Ac_Code
                    JOIN (
                        SELECT
                            TempGstNo,
                            MIN(Ac_Code) AS Ac_Code
                        FROM nt_1_accountmaster
                        WHERE Group_Code = :group_code
                          AND TempGstNo <> ''
                          AND company_code = :company_code
                        GROUP BY TempGstNo
                        HAVING COUNT(*) > 0
                    ) g
                        ON am.TempGstNo = g.TempGstNo
                    JOIN nt_1_accountmaster amFix
                        ON amFix.TempGstNo = g.TempGstNo
                       AND amFix.Ac_Code = g.Ac_Code
                    WHERE gl.company_code = :company_code
                    and amFix.Group_Code = :group_code
                """),
                {
                    "group_code": group_code,
                    "company_code": company_code
                }
            )

        rows = db.session.execute(
            text("""
                EXEC AgingAnalysis
                    @Company_Code = :Company_Code,
                    @toDT         = :toDT,
                    @groupcode    = :groupcode
                 
            """),
            {
                "Company_Code": int(company_code),
                "toDT": to_dt,
                "groupcode": int(group_code)
            }
        ).mappings().all()

        return jsonify([dict(r) for r in rows])

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500



@app.route(API_URL + '/AgingAnalysis-GSTwise-Detail', methods=['GET'])
def AgingAnalysis_GSTwise_Detail():
    try:
        gst_no = request.args.get("Gst_No")
        group_code = request.args.get("Group_code")
        company_code = request.args.get("Company_Code")

        if not (gst_no and group_code and company_code):
            return jsonify({"error": "Gst_No, Group_code, Company_Code are required"}), 400

        rows = db.session.execute(
            text("""
                SELECT
                    ac_code,
                    Ac_Name_E,
                    cityname,
                    ISNULL(SUM(CASE WHEN DRCR='D' THEN amount ELSE -amount END), 0) AS balance
                FROM qrygledger
                WHERE Gst_No = :gst_no
                  AND Group_Code = :group_code
                  AND Company_Code = :company_code
                GROUP BY ac_code, Ac_Name_E, cityname
                HAVING ISNULL(SUM(CASE WHEN DRCR='D' THEN amount ELSE -amount END), 0) <> 0
            """),
            {
                "gst_no": gst_no,
                "group_code": int(group_code),
                "company_code": int(company_code)
            }
        ).mappings().all()

        return jsonify([dict(r) for r in rows])

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500







@app.route(API_URL + '/AgingAnalysis-Report-Debtorspanwise', methods=['GET'])
def AgingAnalysis_Report_Debtorspanwise():
    try:
        to_dt_str = request.args.get("toDT")
        company_code = request.args.get("Company_Code")
        group_code = request.args.get("Group_code")

        if not (company_code and to_dt_str and group_code):
            return jsonify({"error": "Company_Code, Group_Code, toDT are required"}), 400

        to_dt = datetime.strptime(to_dt_str.replace("/", "-"), "%Y-%m-%d").date()

        with db.session.begin():

            db.session.execute(
        text("""
            UPDATE nt_1_accountmaster
            SET TempGstNo='' 
            WHERE company_code = :company_code
        """),
        {"company_code": company_code}
         ),
            db.session.execute(
        text("""
            UPDATE nt_1_accountmaster
            SET TempGstNo=CompanyPan
            WHERE company_code = :company_code and Group_Code= :group_code
        """),
        {"company_code": company_code, "group_code": group_code,}
        ),

            db.session.execute(
        text("""
            UPDATE nt_1_gledger
            SET accode = Ac_Code,
                acid     = ac
            WHERE company_code = :company_code
        """),
        {"company_code": company_code}
        )
            db.session.execute(
                text("""
                    UPDATE gl
                    SET gl.accode = amFix.Ac_Code,
                        gl.acid     = amFix.accoid
                    FROM nt_1_gledger gl
                    JOIN nt_1_accountmaster am
                        ON gl.accode = am.Ac_Code
                    JOIN (
                        SELECT
                            TempGstNo,
                            MIN(Ac_Code) AS Ac_Code
                        FROM nt_1_accountmaster
                        WHERE Group_Code = :group_code
                          AND TempGstNo <> ''
                          AND company_code = :company_code
                        GROUP BY TempGstNo
                        HAVING COUNT(*) > 0
                    ) g
                        ON am.TempGstNo = g.TempGstNo
                    JOIN nt_1_accountmaster amFix
                        ON amFix.TempGstNo = g.TempGstNo
                       AND amFix.Ac_Code = g.Ac_Code
                    WHERE gl.company_code = :company_code
                    and amFix.Group_Code = :group_code
                """),
                {
                    "group_code": group_code,
                    "company_code": company_code
                }
            )

        rows = db.session.execute(
            text("""
                EXEC AgingAnalysis
                    @Company_Code = :Company_Code,
                    @toDT         = :toDT,
                    @groupcode    = :groupcode
                 
            """),
            {
                "Company_Code": int(company_code),
                "toDT": to_dt,
                "groupcode": int(group_code)
            }
        ).mappings().all()
        rows = [dict(r) for r in rows]

        for row in rows:
            gst = row.get("Gst_No")

            if gst:
                row["PAN"] = gst[2:-3].strip()

        return jsonify(rows)

       # return jsonify([dict(r) for r in rows])

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@app.route(API_URL + '/TrialBalanceDetailGSTwise-Report', methods=['GET'])
def TrialBalanceDetailGSTwise_Report():
    try:
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        company_code = request.args.get('Company_Code')
        group_type_filter = request.args.get('groupType')

        if not from_date or not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400

        # Build SQL with optional group filter
        base_sql = '''
            SELECT 
                   SUM(CASE WHEN DOC_DATE < :from_date
                            THEN CASE WHEN DRCR = 'D' THEN AMOUNT ELSE -AMOUNT END
                            ELSE 0 END) AS opbal,
                   SUM(CASE WHEN DOC_DATE BETWEEN :from_date AND :to_date
                            THEN CASE WHEN DRCR = 'D' THEN AMOUNT ELSE 0 END
                            ELSE 0 END) AS debit,
                   SUM(CASE WHEN DOC_DATE BETWEEN :from_date AND :to_date
                            THEN CASE WHEN DRCR = 'C' THEN AMOUNT ELSE 0 END
                            ELSE 0 END) AS credit,
                  
                   group_Type,
                   0 AS Op_Debit,
                   0 AS Op_Credit,
                   0 AS Tran_Debit,
                   0 AS Tran_Credit,
                   0 AS Closing_Debit,
                   0 AS Closing_Credit,
                   BSGroupName AS group_Name_E, CASE
        WHEN ISNULL(LTRIM(RTRIM(Gst_No)), '') = ''
            THEN CAST(Ac_Code AS VARCHAR(20))
        ELSE Gst_No
    END AS Gst_No

            FROM qryGledgernew
            WHERE DOC_DATE <= :to_date
              AND Company_Code = :company_code
              {group_filter}
            GROUP BY  group_Type, BSGroupName,CASE
        WHEN ISNULL(LTRIM(RTRIM(Gst_No)), '') = ''
            THEN CAST(Ac_Code AS VARCHAR(20))
        ELSE Gst_No
    END
            HAVING
                SUM(CASE WHEN DOC_DATE < :from_date
                         THEN CASE WHEN DRCR = 'D' THEN AMOUNT ELSE -AMOUNT END
                         ELSE 0 END) <> 0
             OR SUM(CASE WHEN DOC_DATE BETWEEN :from_date AND :to_date
                         THEN CASE WHEN DRCR = 'D' THEN AMOUNT ELSE 0 END
                         ELSE 0 END) <> 0
             OR SUM(CASE WHEN DOC_DATE BETWEEN :from_date AND :to_date
                         THEN CASE WHEN DRCR = 'C' THEN AMOUNT ELSE 0 END
                         ELSE 0 END) <> 0
        '''

        params = {
            'from_date': from_date,
            'to_date': to_date,
            'company_code': company_code,
        }

        # Handle groupType = "AllTrailBalance" (no additional filter)
        if group_type_filter and group_type_filter != 'AllTrailBalance':
            base_sql = base_sql.format(group_filter=' AND Group_Code = :group_type_filter')
            # cast to int if Group_Code is numeric
            params['group_type_filter'] = int(group_type_filter)
        else:
            base_sql = base_sql.format(group_filter='')

        result = db.session.execute(text(base_sql), params).mappings().all()

        response = []
        for row in result:
            row_dict = dict(row)
            # if format_dates() is generic, keep it; otherwise you can drop it
            formatted_dates = format_dates(row_dict)
            row_dict.update(formatted_dates)
            response.append(row_dict)

        return jsonify(response)

    except SQLAlchemyError as error:
        # log full original error, not just rollback
        print("Error fetching data:", error)
        return jsonify({'error': 'Internal server error'}), 500

@app.route(API_URL + '/TrialBalanceDetailPANwise-Report', methods=['GET'])
def TrialBalanceDetailPANwise_Report():
    try:
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        company_code = request.args.get('Company_Code')
        group_type_filter = request.args.get('groupType')

        if not from_date or not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400

        # Build SQL with optional group filter
        base_sql = '''
            SELECT 
                   SUM(CASE WHEN DOC_DATE < :from_date
                            THEN CASE WHEN DRCR = 'D' THEN AMOUNT ELSE -AMOUNT END
                            ELSE 0 END) AS opbal,
                   SUM(CASE WHEN DOC_DATE BETWEEN :from_date AND :to_date
                            THEN CASE WHEN DRCR = 'D' THEN AMOUNT ELSE 0 END
                            ELSE 0 END) AS debit,
                   SUM(CASE WHEN DOC_DATE BETWEEN :from_date AND :to_date
                            THEN CASE WHEN DRCR = 'C' THEN AMOUNT ELSE 0 END
                            ELSE 0 END) AS credit,
                  
                   group_Type,
                   0 AS Op_Debit,
                   0 AS Op_Credit,
                   0 AS Tran_Debit,
                   0 AS Tran_Credit,
                   0 AS Closing_Debit,
                   0 AS Closing_Credit,
                   BSGroupName AS group_Name_E, CASE
        WHEN ISNULL(LTRIM(RTRIM(CompanyPan)), '') = ''
            THEN CAST(Ac_Code AS VARCHAR(20))
        ELSE CompanyPan
    END AS Gst_No

            FROM qryGledgernew
            WHERE DOC_DATE <= :to_date
              AND Company_Code = :company_code
              {group_filter}
            GROUP BY  group_Type, BSGroupName,CASE
        WHEN ISNULL(LTRIM(RTRIM(CompanyPan)), '') = ''
            THEN CAST(Ac_Code AS VARCHAR(20))
        ELSE CompanyPan
    END
            HAVING
                SUM(CASE WHEN DOC_DATE < :from_date
                         THEN CASE WHEN DRCR = 'D' THEN AMOUNT ELSE -AMOUNT END
                         ELSE 0 END) <> 0
             OR SUM(CASE WHEN DOC_DATE BETWEEN :from_date AND :to_date
                         THEN CASE WHEN DRCR = 'D' THEN AMOUNT ELSE 0 END
                         ELSE 0 END) <> 0
             OR SUM(CASE WHEN DOC_DATE BETWEEN :from_date AND :to_date
                         THEN CASE WHEN DRCR = 'C' THEN AMOUNT ELSE 0 END
                         ELSE 0 END) <> 0
        '''

        params = {
            'from_date': from_date,
            'to_date': to_date,
            'company_code': company_code,
        }

        # Handle groupType = "AllTrailBalance" (no additional filter)
        if group_type_filter and group_type_filter != 'AllTrailBalance':
            base_sql = base_sql.format(group_filter=' AND Group_Code = :group_type_filter')
            # cast to int if Group_Code is numeric
            params['group_type_filter'] = int(group_type_filter)
        else:
            base_sql = base_sql.format(group_filter='')

        result = db.session.execute(text(base_sql), params).mappings().all()

        response = []
        for row in result:
            row_dict = dict(row)
            # if format_dates() is generic, keep it; otherwise you can drop it
            formatted_dates = format_dates(row_dict)
            row_dict.update(formatted_dates)
            response.append(row_dict)

        return jsonify(response)

    except SQLAlchemyError as error:
        # log full original error, not just rollback
        print("Error fetching data:", error)
        return jsonify({'error': 'Internal server error'}), 500










@app.route(API_URL + '/AgingAnalysis-Report-Creditors_GST', methods=['GET'])
def AgingAnalysis_Report_Creditors_GSt():
    try:
        to_dt_str = request.args.get("toDT")
        company_code = request.args.get("Company_Code")
        group_code = request.args.get("Group_code")

        if not (company_code and to_dt_str and group_code):
            return jsonify({"error": "Company_Code, Group_Code, toDT are required"}), 400

        to_dt = datetime.strptime(to_dt_str.replace("/", "-"), "%Y-%m-%d").date()

        with db.session.begin():

            db.session.execute(
        text("""
            UPDATE nt_1_accountmaster
            SET TempGstNo='' 
            WHERE company_code = :company_code
        """),
        {"company_code": company_code}
         ),
            db.session.execute(
        text("""
            UPDATE nt_1_accountmaster
            SET TempGstNo=CompanyPan
            WHERE company_code = :company_code and Group_Code= :group_code
        """),
        {"company_code": company_code, "group_code": group_code,}
        ),

            db.session.execute(
        text("""
            UPDATE nt_1_gledger
            SET accode = Ac_Code,
                acid     = ac
            WHERE company_code = :company_code
        """),
        {"company_code": company_code}
        )
            db.session.execute(
                text("""
                    UPDATE gl
                    SET gl.accode = amFix.Ac_Code,
                        gl.acid     = amFix.accoid
                    FROM nt_1_gledger gl
                    JOIN nt_1_accountmaster am
                        ON gl.accode = am.Ac_Code
                    JOIN (
                        SELECT
                            TempGstNo,
                            MIN(Ac_Code) AS Ac_Code
                        FROM nt_1_accountmaster
                        WHERE Group_Code = :group_code
                          AND TempGstNo <> ''
                          AND company_code = :company_code
                        GROUP BY TempGstNo
                        HAVING COUNT(*) > 0
                    ) g
                        ON am.TempGstNo = g.TempGstNo
                    JOIN nt_1_accountmaster amFix
                        ON amFix.TempGstNo = g.TempGstNo
                       AND amFix.Ac_Code = g.Ac_Code
                    WHERE gl.company_code = :company_code
                    and amFix.Group_Code = :group_code
                """),
                {
                    "group_code": group_code,
                    "company_code": company_code
                }
            )

        rows = db.session.execute(
            text("""
                EXEC AgingAnalysisCreditorsGSTWise
                    @Company_Code = :Company_Code,
                    @toDT         = :toDT,
                    @groupcode    = :groupcode
                 
            """),
            {
                "Company_Code": int(company_code),
                "toDT": to_dt,
                "groupcode": int(group_code)
            }
        ).mappings().all()
         
        rows = [dict(r) for r in rows]
        
        for row in rows:
            gst = row.get("Gst_No")

            if gst:
                row["PAN"] = gst

        return jsonify(rows)

        return jsonify([dict(r) for r in rows])

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route(API_URL + '/AgingAnalysis-Report-Debtors_GST', methods=['GET'])
def AgingAnalysis_Report_Debtors_GST():
    try:
        to_dt_str = request.args.get("toDT")
        company_code = request.args.get("Company_Code")
        group_code = request.args.get("Group_code")

        if not (company_code and to_dt_str and group_code):
            return jsonify({"error": "Company_Code, Group_Code, toDT are required"}), 400

        to_dt = datetime.strptime(to_dt_str.replace("/", "-"), "%Y-%m-%d").date()

        with db.session.begin():

            db.session.execute(
        text("""
            UPDATE nt_1_accountmaster
            SET TempGstNo='' 
            WHERE company_code = :company_code
        """),
        {"company_code": company_code}
         ),
            db.session.execute(
        text("""
            UPDATE nt_1_accountmaster
            SET TempGstNo=CompanyPan
            WHERE company_code = :company_code and Group_Code= :group_code
        """),
        {"company_code": company_code, "group_code": group_code,}
        ),

            db.session.execute(
        text("""
            UPDATE nt_1_gledger
            SET accode = Ac_Code,
                acid     = ac
            WHERE company_code = :company_code
        """),
        {"company_code": company_code}
        )
            db.session.execute(
                text("""
                    UPDATE gl
                    SET gl.accode = amFix.Ac_Code,
                        gl.acid     = amFix.accoid
                    FROM nt_1_gledger gl
                    JOIN nt_1_accountmaster am
                        ON gl.accode = am.Ac_Code
                    JOIN (
                        SELECT
                            TempGstNo,
                            MIN(Ac_Code) AS Ac_Code
                        FROM nt_1_accountmaster
                        WHERE Group_Code = :group_code
                          AND TempGstNo <> ''
                          AND company_code = :company_code
                        GROUP BY TempGstNo
                        HAVING COUNT(*) > 0
                    ) g
                        ON am.TempGstNo = g.TempGstNo
                    JOIN nt_1_accountmaster amFix
                        ON amFix.TempGstNo = g.TempGstNo
                       AND amFix.Ac_Code = g.Ac_Code
                    WHERE gl.company_code = :company_code
                    and amFix.Group_Code = :group_code
                """),
                {
                    "group_code": group_code,
                    "company_code": company_code
                }
            )

        rows = db.session.execute(
            text("""
                EXEC AgingAnalysisDetorsGST
                    @Company_Code = :Company_Code,
                    @toDT         = :toDT,
                    @groupcode    = :groupcode
                 
            """),
            {
                "Company_Code": int(company_code),
                "toDT": to_dt,
                "groupcode": int(group_code)
            }
         ).mappings().all()
        rows = [dict(r) for r in rows]

        for row in rows:
            gst = row.get("Gst_No")

            if gst:
                row["PAN"] = gst


        return jsonify(rows)    
        # ).mappings().all()

        # return jsonify([dict(r) for r in rows])

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    

