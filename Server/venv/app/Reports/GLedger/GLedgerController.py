# app/routes/group_routes.py
from flask import jsonify, request
from app import app, db
from app.models.Reports.GLedeger.GLedgerModels import Gledger
import os
from sqlalchemy import text
import traceback
from datetime import datetime, time, timedelta
import logging
from decimal import Decimal 

# Get the base URL from environment variables
API_URL = os.getenv('API_URL')

def format_dates(task):
    return {
        "DOC_DATE": task.DOC_DATE.strftime('%Y-%m-%d') if task.DOC_DATE else None
    }
# Get all groups API
@app.route(API_URL+"/getall-Gledger", methods=["GET"])
def get_GledgerallData():
    try:
        # Extract Company_Code from query parameters
        Company_Code = request.args.get('Company_Code')
        yearCode = request.args.get('Year_Code')
        AC_CODE = request.args.get('AC_CODE')
        if Company_Code is None:
            return jsonify({'error': 'Missing Company_Code parameter'}), 400

        try:
            Company_Code = int(Company_Code)
            yearCode = int(yearCode)
            AC_CODE = int(AC_CODE)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code and Year Code and AC CODE parameter'}), 400

        # Fetch records by Company_Code
        records = Gledger.query.filter_by(COMPANY_CODE = Company_Code, YEAR_CODE = yearCode, AC_CODE = AC_CODE).order_by(Gledger.DOC_DATE,Gledger.TRAN_TYPE,Gledger.DOC_NO).all()

        # Convert groups to a list of dictionaries
        record_data = []
        for record in records:
            selected_Record_data = {column.key: getattr(record, column.key) for column in record.__table__.columns}
            # Format dates and append to selected_Record_data
            formatted_dates = format_dates(record)
            selected_Record_data.update(formatted_dates)
            record_data.append(selected_Record_data)

        return jsonify(record_data)
    except Exception as e:
        print(e)
        return jsonify({'error': 'internal server error'}), 500

  
# # Create a new group API
# @app.route(API_URL+"/create-Record-gLedger", methods=["POST"])
# def create_Record_Gledger():
#     try:
#         # Extract parameters from the request
#         company_code = request.args.get('Company_Code')
#         doc_no = request.args.get('DOC_NO')
#         year_code = request.args.get('Year_Code')
#         tran_type = request.args.get('TRAN_TYPE')
        
#         # Check if required parameters are missing
#         if None in [company_code, doc_no, year_code, tran_type]:
#             return jsonify({'error': 'Missing parameters in the request'}), 400
        
#         # Convert parameters to appropriate types
#         company_code = int(company_code)
#         doc_no = int(doc_no)
#         year_code = int(year_code)
#         tran_type = str(tran_type)

#         # Check if the record exists
#         sql = text("""
#             DELETE FROM nt_1_gledger 
#             WHERE COMPANY_CODE = :company_code 
#               AND DOC_NO = :doc_no
#               AND YEAR_CODE = :year_code
#               AND TRAN_TYPE = :tran_type
#         """)

#         # Execute raw SQL query
#         db.session.execute(sql, {
#             'company_code': company_code,
#             'doc_no': doc_no,
#             'year_code': year_code,
#             'tran_type': tran_type
#         })
        
#         db.session.commit()

#         # Create new records
#         new_records_data = request.json

#         # Check if the request body is a list
#         if not isinstance(new_records_data, list):
#             return jsonify({'error': 'Request body must be a list of records'}), 400

#         new_records = []
#         for record_data in new_records_data:
#             record_data['COMPANY_CODE'] = company_code
#             record_data['DOC_NO'] = doc_no
#             record_data['YEAR_CODE'] = year_code
#             record_data['TRAN_TYPE'] = tran_type
#             new_record = Gledger(**record_data)
#             new_records.append(new_record)

#         # Add new records to the session
#         db.session.add_all(new_records)
#         db.session.commit()

#         return jsonify({
#             'message': 'Records created successfully',
#             'records': [record_data for record_data in new_records_data]
#         }), 201

#     except Exception as e:
#         print("Traceback",traceback.format_exc())
#         db.session.rollback()
#         return jsonify({'error': str(e)}), 500

# @app.route(API_URL + "/delete-Record-gLedger", methods=["DELETE"])
# def delete_Record_Gledger():
#     try:
#         # Extract parameters from the request
#         company_code = request.args.get('Company_Code')
#         doc_no = request.args.get('DOC_NO')
#         year_code = request.args.get('Year_Code')
#         tran_type = request.args.get('TRAN_TYPE')
        
#         # Check if required parameters are missing
#         if None in [company_code, doc_no, year_code, tran_type]:
#             return jsonify({'error': 'Missing parameters in the request'}), 400
        
#         # Convert parameters to appropriate types
#         try:
#             company_code = int(company_code)
#             doc_no = int(doc_no)
#             year_code = int(year_code)
#             tran_type = str(tran_type)
#         except ValueError:
#             return jsonify({'error': 'Invalid parameter type'}), 400

#         # Start a transaction
#         with db.session.begin():
#             # Fetch and delete all existing records
#             existing_records = Gledger.query.filter_by(
#                 COMPANY_CODE=company_code,
#                 DOC_NO=doc_no,
#                 YEAR_CODE=year_code,
#                 TRAN_TYPE=tran_type
#             ).delete(synchronize_session='fetch')
        
#         db.session.commit()

#         return jsonify({
#             'message': 'Records deleted successfully',
#             'deleted_records_count': existing_records
#         }), 200

#     except Exception as e:
#         db.session.rollback()
#         return jsonify({'error': 'Internal server error', 'message': str(e)}), 500


@app.route(API_URL+"/create-Record-gLedger", methods=["POST"])
def create_Record_Gledger():
    try:
        # Extract parameters from the request
        company_code = request.args.get('Company_Code')
        doc_no = request.args.get('DOC_NO')
        year_code = request.args.get('Year_Code')
        tran_type = request.args.get('TRAN_TYPE')
        saleid = request.args.get('saleid')

        # Check if required parameters are missing
        if None in [company_code, doc_no, year_code, tran_type]:
            return jsonify({'error': 'Missing parameters in the request'}), 400
        
        # Convert parameters to appropriate types
        company_code = int(company_code)
        doc_no = int(doc_no)
        year_code = int(year_code)
        tran_type = str(tran_type)
        if tran_type == 'SB' :
            saleid = int(saleid) or 0

        # Check if the record exists
        if tran_type =='SB' and doc_no==0 :
            sql = text("""
            DELETE FROM nt_1_gledger 
            WHERE COMPANY_CODE = :company_code 
              AND DOC_NO = :doc_no
              AND YEAR_CODE = :year_code
              AND TRAN_TYPE = :tran_type
              and saleid= :saleid         
        """)
        else :
             sql = text("""
            DELETE FROM nt_1_gledger 
            WHERE COMPANY_CODE = :company_code 
              AND DOC_NO = :doc_no
              AND YEAR_CODE = :year_code
              AND TRAN_TYPE = :tran_type
        """)
                

        # Execute raw SQL query
        db.session.execute(sql, {
            'company_code': company_code,
            'doc_no': doc_no,
            'year_code': year_code,
            'tran_type': tran_type,
            'saleid' : saleid
        })
        
        db.session.commit()

        # Create new records
        new_records_data = request.json

        # Check if the request body is a list
        if not isinstance(new_records_data, list):
            return jsonify({'error': 'Request body must be a list of records'}), 400

        new_records = []
        for record_data in new_records_data:
            record_data['COMPANY_CODE'] = company_code
            record_data['DOC_NO'] = doc_no
            record_data['YEAR_CODE'] = year_code
            record_data['TRAN_TYPE'] = tran_type
            new_record = Gledger(**record_data)
            new_records.append(new_record)

        # Add new records to the session
        db.session.add_all(new_records)
        db.session.commit()

        return jsonify({
            'message': 'Records created successfully',
            'records': [record_data for record_data in new_records_data]
        }), 201

    except Exception as e:
        print("Traceback",traceback.format_exc())
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
    

@app.route(API_URL + "/delete-Record-gLedger", methods=["DELETE"])
def delete_Record_Gledger():
    try:
        company_code = request.args.get('Company_Code')
        doc_no = request.args.get('DOC_NO')
        year_code = request.args.get('Year_Code')
        tran_type = request.args.get('TRAN_TYPE')
        saleid = request.args.get('saleid')
        
        if None in [company_code, doc_no, year_code, tran_type]:
            return jsonify({'error': 'Missing parameters in the request'}), 400
        
        try:
            company_code = int(company_code)
            doc_no = int(doc_no)
            year_code = int(year_code)
            tran_type = str(tran_type)
            if tran_type == 'SB' and doc_no == 0 :
                saleid = int(saleid)
        except ValueError:
            return jsonify({'error': 'Invalid parameter type'}), 400

        with db.session.begin():
            if tran_type == 'SB' and doc_no == 0 :
              existing_records = Gledger.query.filter_by(
                COMPANY_CODE=company_code,
                DOC_NO=doc_no,
                YEAR_CODE=year_code,
                TRAN_TYPE=tran_type,
                saleid = saleid
            ).delete(synchronize_session='fetch')
            else :
                 existing_records = Gledger.query.filter_by(
                COMPANY_CODE=company_code,
                DOC_NO=doc_no,
                YEAR_CODE=year_code,
                TRAN_TYPE=tran_type
            ).delete(synchronize_session='fetch')
                  
        db.session.commit()

        return jsonify({
            'message': 'Records deleted successfully',
            'deleted_records_count': existing_records
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Internal server error', 'message': str(e)}), 500

@app.route(API_URL + "/get_gLedgerReport_AcWise", methods=["GET"])
def get_gLedgerReport_AcWise():
    def format_date(date):
        if date:
            return date.strftime('%d/%m/%Y')
        return None
    try:
        # Get query parameters
        company_code = request.args.get('Company_Code')
        # year_code = request.args.get('Year_Code')
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        accode = int(request.args.get('Accode')) if request.args.get('Accode') else None

        # Ensure required parameters are present
        if not company_code :
            return jsonify({"error": "Missing 'Company_Code' Parameter"}), 400

        # Base SQL query
        query = '''
            SELECT dbo.nt_1_gledger.TRAN_TYPE, dbo.nt_1_gledger.DOC_NO, dbo.nt_1_gledger.DOC_DATE, dbo.nt_1_gledger.AC_CODE, dbo.nt_1_accountmaster.Ac_Name_E, 
                   dbo.nt_1_gledger.NARRATION, 
                   CASE WHEN dbo.nt_1_gledger.drcr = 'D' THEN dbo.nt_1_gledger.AMOUNT ELSE 0 END AS debit, 
                   CASE WHEN dbo.nt_1_gledger.drcr = 'C' THEN dbo.nt_1_gledger.AMOUNT ELSE 0 END AS credit,0 as Balance, dbo.nt_1_gledger.drcr,dbo.nt_1_gledger.AMOUNT,dbo.nt_1_gledger.do_no
            FROM dbo.nt_1_gledger 
            LEFT OUTER JOIN dbo.nt_1_accountmaster 
            ON dbo.nt_1_gledger.ac = dbo.nt_1_accountmaster.accoid
            WHERE dbo.nt_1_gledger.COMPANY_CODE = :company_code 
            and dbo.nt_1_gledger.AC_CODE = :Accode
            
        '''
        if from_date and to_date :
            query += " AND dbo.nt_1_gledger.DOC_DATE BETWEEN :from_date AND :to_date order by DOC_DATE asc,tran_type,cashcredit,doc_no,SORT_TYPE,SORT_NO,ORDER_CODE "

        # Execute the query with parameters
        additional_data = db.session.execute(
            text(query), 
            {"company_code": company_code,"from_date": from_date, 
             "to_date": to_date,'Accode' : accode}
        )

        # Fetch results
        additional_data_rows = additional_data.fetchall()

        # Convert rows to dictionaries
        all_data = [dict(row._mapping) for row in additional_data_rows]

        # Format date fields
        for data in all_data:
            if 'DOC_DATE' in data:
                data['DOC_DATE'] = format_date(data['DOC_DATE'])

        with db.session.begin_nested():
            # Execute query2 first
            query2 = db.session.execute(
                text('''
                     SELECT top(1) group_Type from qrymstaccountmaster
            WHERE Company_Code = :company_code 
            
            and Ac_code = :Accode
                '''),
               {"company_code": company_code, "from_date": from_date, 
             "to_date": to_date,'Accode' : accode}
            )
            GroupData = [dict(row._mapping) for row in query2.fetchall()]
            GroupType=GroupData[0].get('group_Type', None)  

            if GroupType=='B' :
                    query3 = db.session.execute(
                    text('''
                        select AC_CODE,SUM(case drcr when 'D' then AMOUNT when 'C' then -amount end) as  OpBal from nt_1_gledger
                WHERE dbo.nt_1_gledger.COMPANY_CODE = :company_code 
                and dbo.nt_1_gledger.AC_CODE = :Accode
                and dbo.nt_1_gledger.DOC_DATE < :from_date  
                         group by AC_CODE          
                    '''),
                {"company_code": company_code,"from_date": from_date, 
                "to_date": to_date,'Accode' : accode}
                )
                    OpeingBalanceData = [dict(row._mapping) for row in query3.fetchall()]
                    
            else :
                    query3 = db.session.execute(
                    text('''
                        select AC_CODE,SUM(case drcr when 'D' then AMOUNT when 'C' then -amount end) as  OpBal from nt_1_gledger 
                WHERE dbo.nt_1_gledger.COMPANY_CODE = :company_code 
                
                and dbo.nt_1_gledger.AC_CODE = :Accode
                and dbo.nt_1_gledger.DOC_DATE >= :from_date  
                and dbo.nt_1_gledger.DOC_DATE < :from_date  
                         
                         group by nt_1_gledger.AC_CODE     
                    '''),
                {"company_code": company_code,"from_date": from_date, 
                "to_date": to_date,'Accode' : accode}
                )
                    OpeingBalanceData = [dict(row._mapping) for row in query3.fetchall()]
                    
        # Prepare response
        response = {
            "all_data": all_data,
            "Opening_Balance" :OpeingBalanceData,
        }

        # Return response
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

@app.route(API_URL + "/getAll-groupCodes", methods=["GET"])
def getAll_groupCodes():
    try:

        query = ('''SELECT         dbo.nt_1_bsgroupmaster.group_Name_E,dbo.nt_1_bsgroupmaster.group_Code
FROM            dbo.nt_1_accountmaster INNER JOIN
                         dbo.nt_1_gledger ON dbo.nt_1_accountmaster.Ac_Code = dbo.nt_1_gledger.AC_CODE AND dbo.nt_1_accountmaster.company_code = dbo.nt_1_gledger.COMPANY_CODE INNER JOIN
                         dbo.nt_1_bsgroupmaster ON dbo.nt_1_accountmaster.Group_Code = dbo.nt_1_bsgroupmaster.group_Code AND dbo.nt_1_accountmaster.company_code = dbo.nt_1_bsgroupmaster.Company_Code
GROUP BY  dbo.nt_1_bsgroupmaster.group_Name_E
,dbo.nt_1_bsgroupmaster.group_Code order by dbo.nt_1_bsgroupmaster.group_Code
                                 '''
            )
        additional_data = db.session.execute(text(query))

        additional_data_rows = additional_data.fetchall()
        
        all_data = [dict(row._mapping) for row in additional_data_rows]
 
        response = {
            "all_Groups": all_data
        }

        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

@app.route(API_URL + "/getAll-AccountsWithCounts", methods=["GET"])
def getAll_AccountsWithCounts():
    try:

        groupCode = request.args.get('groupCode')

        if not groupCode:
            return jsonify({"Missing GroupCode"}, 404)

        query = ('''SELECT        dbo.nt_1_accountmaster.Ac_Name_E, dbo.nt_1_gledger.AC_CODE, dbo.nt_1_bsgroupmaster.group_Name_E,dbo.nt_1_bsgroupmaster.group_Code, COUNT(*) AS counts
FROM            dbo.nt_1_accountmaster INNER JOIN
                         dbo.nt_1_gledger ON dbo.nt_1_accountmaster.Ac_Code = dbo.nt_1_gledger.AC_CODE AND dbo.nt_1_accountmaster.company_code = dbo.nt_1_gledger.COMPANY_CODE INNER JOIN
                         dbo.nt_1_bsgroupmaster ON dbo.nt_1_accountmaster.Group_Code = dbo.nt_1_bsgroupmaster.group_Code AND dbo.nt_1_accountmaster.company_code = dbo.nt_1_bsgroupmaster.Company_Code
                         where dbo.nt_1_bsgroupmaster.group_Code = :groupCode
GROUP BY dbo.nt_1_accountmaster.Ac_Name_E, dbo.nt_1_gledger.AC_CODE, dbo.nt_1_bsgroupmaster.group_Name_E,dbo.nt_1_bsgroupmaster.group_Code
order by  COUNT(*) desc
                                 '''
            )
        additional_data = db.session.execute(text(query),{'groupCode':groupCode})

        additional_data_rows = additional_data.fetchall()
        
        all_data = [dict(row._mapping) for row in additional_data_rows]
 
        response = {
            "all_Accounts": all_data
        }

        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


# @app.route(API_URL + '/MultipleLedger', methods=['GET'])
# def MultipleLedger():
#     try:
#         From_Date = request.args.get('from_date')
#         To_Date = request.args.get('to_date')
#         Company_Code = request.args.get('Company_Code')
#         Year_Code = request.args.get('Year_Code')
#         ac_codes = request.args.get('ac_codes')

#         if ac_codes:
#             ac_codes = list(map(int, ac_codes.split(',')))

#         if not From_Date or not To_Date or not Company_Code or not Year_Code:
#             return jsonify({'error': 'Missing required parameter'}), 400
        
#         From_Date = datetime.strptime(From_Date, '%Y-%m-%d').date()
#         To_Date = datetime.strptime(To_Date, '%Y-%m-%d').date()

#         query_opbal = db.session.execute(
#             text('''
#                SELECT        dbo.nt_1_gledger.AC_CODE, SUM(CASE dbo.nt_1_gledger.DRCR WHEN 'D' THEN dbo.nt_1_gledger.AMOUNT WHEN 'C' THEN - dbo.nt_1_gledger.AMOUNT END) AS OpBal
#                FROM            dbo.nt_1_gledger INNER JOIN
#                          dbo.nt_1_accountmaster ON dbo.nt_1_gledger.AC_CODE = dbo.nt_1_accountmaster.Ac_Code AND dbo.nt_1_gledger.COMPANY_CODE = dbo.nt_1_accountmaster.company_code
#                                  WHERE  dbo.nt_1_gledger.COMPANY_CODE = :company_code and dbo.nt_1_gledger.DOC_DATE < '2024-04-01' AND dbo.nt_1_gledger.AC_CODE IN :ac_codes
#                 GROUP BY dbo.nt_1_gledger.AC_CODE
#             '''), 
#             {"company_code": Company_Code, 'ac_codes': tuple(ac_codes)}
#         )

#         OpBalData = {row[0]: row[1] for row in query_opbal.fetchall()}

#         query3 = db.session.execute(
#             text('''
#                SELECT        dbo.nt_1_gledger.TRAN_TYPE, dbo.nt_1_gledger.CASHCREDIT, dbo.nt_1_gledger.DOC_NO, CONVERT(varchar,dbo.nt_1_gledger.DOC_DATE,103) AS DOC_DATE, dbo.nt_1_gledger.AC_CODE, dbo.nt_1_accountmaster.Ac_Name_E, 
#                          dbo.nt_1_bsgroupmaster.group_Type, dbo.nt_1_gledger.NARRATION, dbo.nt_1_gledger.AMOUNT, dbo.nt_1_gledger.COMPANY_CODE, dbo.nt_1_gledger.YEAR_CODE, dbo.nt_1_gledger.DRCR, dbo.nt_1_gledger.DRCR_HEAD,dbo.nt_1_gledger.ORDER_CODE, 
#                          nt_1_accountmaster_1.Ac_Name_E AS drcrname
# FROM            dbo.nt_1_gledger INNER JOIN
#                          dbo.nt_1_accountmaster ON dbo.nt_1_gledger.AC_CODE = dbo.nt_1_accountmaster.Ac_Code AND dbo.nt_1_gledger.COMPANY_CODE = dbo.nt_1_accountmaster.company_code INNER JOIN
#                          dbo.nt_1_bsgroupmaster ON dbo.nt_1_accountmaster.Group_Code = dbo.nt_1_bsgroupmaster.group_Code AND dbo.nt_1_accountmaster.company_code = dbo.nt_1_bsgroupmaster.Company_Code LEFT OUTER JOIN
#                          dbo.nt_1_accountmaster AS nt_1_accountmaster_1 ON dbo.nt_1_gledger.DRCR_HEAD = nt_1_accountmaster_1.Ac_Code AND dbo.nt_1_gledger.COMPANY_CODE = nt_1_accountmaster_1.company_code
# WHERE        dbo.nt_1_gledger.COMPANY_CODE = :company_code 
#                 AND dbo.nt_1_gledger.YEAR_CODE = :year_code 
#                 AND dbo.nt_1_gledger.DOC_DATE >= :from_date
#                 AND dbo.nt_1_gledger.DOC_DATE <= :to_date
#                 AND dbo.nt_1_gledger.AC_CODE IN :ac_codes
#                 ORDER BY Ac_Code, doc_date, doc_no, DRCR
#             '''),
#             {"company_code": Company_Code, "year_code": Year_Code, "to_date": To_Date,"from_date": From_Date, 'ac_codes': tuple(ac_codes) }
#         )

#         LedgerData = [dict(row._mapping) for row in query3.fetchall()]

#         query_details = db.session.execute(
#             text('''
#                 SELECT dbo.nt_1_gledger.AC_CODE, dbo.nt_1_accountmaster.Ac_Name_E AS Ac_Name_E, dbo.nt_1_gledger.DRCR, dbo.nt_1_gledger.TRAN_TYPE, dbo.nt_1_gledger.DOC_NO, CONVERT(varchar,dbo.nt_1_gledger.DOC_DATE,103) AS DOC_DATE, 
#                          dbo.nt_1_gledger.COMPANY_CODE, dbo.nt_1_gledger.YEAR_CODE, dbo.nt_1_gledger.AMOUNT, dbo.nt_1_gledger.NARRATION
#                         FROM  dbo.nt_1_gledger INNER JOIN
#                          dbo.nt_1_accountmaster ON dbo.nt_1_gledger.AC_CODE = dbo.nt_1_accountmaster.Ac_Code
#                 WHERE (dbo.nt_1_gledger.TRAN_TYPE NOT IN ('BR', 'CR', 'BP', 'CP', 'JV')) AND (dbo.nt_1_gledger.COMPANY_CODE = :company_code) AND (dbo.nt_1_gledger.YEAR_CODE = :year_code) AND (dbo.nt_1_gledger.DOC_DATE BETWEEN :from_date AND 
#                          :to_date) AND dbo.nt_1_gledger.AC_CODE IN :ac_codes
#             '''),
#             {"company_code": Company_Code, "year_code": Year_Code, "from_date": From_Date, "to_date": To_Date, 'ac_codes': tuple(ac_codes)}
#         )

#         detailData = [dict(row._mapping) for row in query_details.fetchall()]

#         Balance = Decimal(0)  
#         Debit_Amount = Decimal(0)  
#         Credit_Amount = Decimal(0) 
#         Account_Code = None
#         final_response_data = []

#         for row in LedgerData:
#             if Account_Code != row['AC_CODE']:
#                 Account_Code = row['AC_CODE']
#                 OpBal = OpBalData.get(Account_Code, 0)

#                 if OpBal == 0:
#                     Balance = Decimal(0)  
#                 else:
#                     Balance = Decimal(OpBal) 

#                 opening_entry = {
#                     "AC_CODE": Account_Code, 
#                     "Ac_Name_E": row['Ac_Name_E'],
#                     "Balance": abs(float(OpBal)),
#                     "DOC_DATE": From_Date.strftime('%d/%m/%Y') if From_Date else None,  
#                     "NARRATION": "Opening balance",
#                     "TRAN_TYPE": "OP",
#                     "BALANCEDRCR": 'Dr' if Balance > 0 else 'Cr',
#                     "COMPANY_CODE": Company_Code,
#                     "YEAR_CODE": Year_Code,
#                     "DEBIT_AMOUNT": Balance if Balance > 0 else 0,
#                     "CREDIT_AMOUNT":Balance if Balance < 0 else 0,
#                     "DRCR" : 'D' if Balance > 0 else 'Cr',
#                     "DRCR_NAME":row['drcrname'],
#                     "ORDER_CODE":row['ORDER_CODE'],
#                     "group_Type":row['group_Type']
#                 }
#                 final_response_data.append(opening_entry)  
#                 Debit_Amount = Decimal(0)
#                 Credit_Amount = Decimal(0)

#             amount = Decimal(row['AMOUNT'])

#             if row['DRCR'] == 'D': 
#                 Debit_Amount = amount
#                 Credit_Amount = 0
#                 Balance += amount
#             elif row['DRCR'] == 'C': 
#                 Credit_Amount = amount
#                 Debit_Amount  = 0
#                 Balance -= amount

#             row['Debit_Amount'] = float(Debit_Amount)
#             row['Credit_Amount'] = float(Credit_Amount)
#             row['Balance'] = abs(Balance)
#             detail_entry_1 = [
#                 d for d in detailData
#                 if d['AC_CODE'] == row['AC_CODE'] 
#                 and d['TRAN_TYPE'] == row['TRAN_TYPE'] 
#                 and d['DOC_NO'] == row['DOC_NO'] 
#                 and d['DOC_DATE'] == row['DOC_DATE'] 
#                 and d['COMPANY_CODE'] == row['COMPANY_CODE'] 
#                 and d['YEAR_CODE'] == row['YEAR_CODE']
#             ]

#             detail_entry_2 = []
#             for d in LedgerData:
#                 if d['TRAN_TYPE'] in ["CP", "BP", "CR", "BR"] and d['AC_CODE'] == row['AC_CODE'] and d['DOC_NO'] == row['DOC_NO']:
#                     detail_entry_2.append({
#                         'TRAN_TYPE': d['TRAN_TYPE'],
#                         'DOC_NO': d['DOC_NO'],
#                         'DOC_DATE': d['DOC_DATE'],
#                         'COMPANY_CODE': d['COMPANY_CODE'],
#                         'YEAR_CODE': d['YEAR_CODE'],
#                         'AC_CODE': d['DRCR_HEAD'],
#                         'DRCR': 'Cr' if d['DRCR'] == 'D' else 'Dr', 
#                         'AMOUNT': d['AMOUNT'],
#                         'Ac_Name_E': d['drcrname'],
#                         'NARRATION': d['NARRATION']
#                     })
#                     break  

#             if row['TRAN_TYPE'] == 'JV':
#                 if row['DRCR_HEAD'] == 'D':
#                     for detail in LedgerData:
#                         if detail['DRCR'] == 'C':  
#                             detail_entry = {
#                                 'TRAN_TYPE': detail['TRAN_TYPE'],
#                                 'DOC_NO': detail['DOC_NO'],
#                                 'DOC_DATE': detail['DOC_DATE'],
#                                 'COMPANY_CODE': detail['COMPANY_CODE'],
#                                 'YEAR_CODE': detail['YEAR_CODE'],
#                                 'AC_CODE': detail['AC_CODE'],
#                                 'DRCR': detail['DRCR'],
#                                 'AMOUNT': detail['AMOUNT'],
#                                 'Ac_Name_E': detail.get('Ac_Name_E', 'No Name'),
#                                 'NARRATION': row['NARRATION']
#                 }
#                             detail_entry_1.append(detail_entry)
#                             break  

#                 elif row['DRCR_HEAD'] == 'C':
#                     for detail in LedgerData:
#                         if detail['DRCR'] == 'D': 
#                             detail_entry = {
#                     'TRAN_TYPE': detail['TRAN_TYPE'],
#                     'DOC_NO': detail['DOC_NO'],
#                     'DOC_DATE': detail['DOC_DATE'],
#                     'COMPANY_CODE': detail['COMPANY_CODE'],
#                     'YEAR_CODE': detail['YEAR_CODE'],
#                     'AC_CODE': detail['AC_CODE'],
#                     'DRCR': detail['DRCR'],
#                     'AMOUNT': detail['AMOUNT'],
#                     'Ac_Name_E': detail.get('Ac_Name_E', 'No Name'),
#                     'NARRATION': row['NARRATION']
#                 }
#                         detail_entry_1.append(detail_entry)
#                         break  

#             row['detailData'] = detail_entry_1 + detail_entry_2

#             final_response_data.append(row)

#         response_data = {
#             'LedgerData': final_response_data
#         }

#         return jsonify(response_data)

#     except Exception as e:
#         print("Error:", str(e)) 
#         return jsonify({"error": "Internal server error", "message": str(e)}), 500


# @app.route(API_URL + '/MultipleLedger', methods=['GET'])
# def MultipleLedger():
#     try:
#         From_Date = request.args.get('from_date')
#         To_Date = request.args.get('to_date')
#         Company_Code = request.args.get('Company_Code')
#         Year_Code = request.args.get('Year_Code')
#         ac_codes = request.args.get('ac_codes')

#         if ac_codes:
#             ac_codes = list(map(int, ac_codes.split(',')))

#         if not From_Date or not To_Date or not Company_Code or not Year_Code:
#             return jsonify({'error': 'Missing required parameter'}), 400
        
#         From_Date = datetime.strptime(From_Date, '%Y-%m-%d').date()
#         To_Date = datetime.strptime(To_Date, '%Y-%m-%d').date()

#         query_opbal = db.session.execute(
#             text('''
#                SELECT        dbo.nt_1_gledger.AC_CODE, SUM(CASE dbo.nt_1_gledger.DRCR WHEN 'D' THEN dbo.nt_1_gledger.AMOUNT WHEN 'C' THEN - dbo.nt_1_gledger.AMOUNT END) AS OpBal
#                FROM            dbo.nt_1_gledger INNER JOIN
#                          dbo.nt_1_accountmaster ON dbo.nt_1_gledger.AC_CODE = dbo.nt_1_accountmaster.Ac_Code AND dbo.nt_1_gledger.COMPANY_CODE = dbo.nt_1_accountmaster.company_code
#                                  WHERE  dbo.nt_1_gledger.COMPANY_CODE = :company_code and dbo.nt_1_gledger.DOC_DATE < '2024-04-01' AND dbo.nt_1_gledger.AC_CODE IN :ac_codes
#                 GROUP BY dbo.nt_1_gledger.AC_CODE
#             '''), 
#             {"company_code": Company_Code, 'ac_codes': tuple(ac_codes)}
#         )

#         OpBalData = {row[0]: row[1] for row in query_opbal.fetchall()}

#         query3 = db.session.execute(
#             text('''
#                SELECT        dbo.nt_1_gledger.TRAN_TYPE, dbo.nt_1_gledger.CASHCREDIT, dbo.nt_1_gledger.DOC_NO, CONVERT(varchar,dbo.nt_1_gledger.DOC_DATE,103) AS DOC_DATE, dbo.nt_1_gledger.AC_CODE, dbo.nt_1_accountmaster.Ac_Name_E, 
#                          dbo.nt_1_bsgroupmaster.group_Type, dbo.nt_1_gledger.NARRATION, dbo.nt_1_gledger.AMOUNT, dbo.nt_1_gledger.COMPANY_CODE, dbo.nt_1_gledger.YEAR_CODE, dbo.nt_1_gledger.DRCR, dbo.nt_1_gledger.DRCR_HEAD,dbo.nt_1_gledger.ORDER_CODE, 
#                          nt_1_accountmaster_1.Ac_Name_E AS drcrname
# FROM            dbo.nt_1_gledger INNER JOIN
#                          dbo.nt_1_accountmaster ON dbo.nt_1_gledger.AC_CODE = dbo.nt_1_accountmaster.Ac_Code AND dbo.nt_1_gledger.COMPANY_CODE = dbo.nt_1_accountmaster.company_code INNER JOIN
#                          dbo.nt_1_bsgroupmaster ON dbo.nt_1_accountmaster.Group_Code = dbo.nt_1_bsgroupmaster.group_Code AND dbo.nt_1_accountmaster.company_code = dbo.nt_1_bsgroupmaster.Company_Code LEFT OUTER JOIN
#                          dbo.nt_1_accountmaster AS nt_1_accountmaster_1 ON dbo.nt_1_gledger.DRCR_HEAD = nt_1_accountmaster_1.Ac_Code AND dbo.nt_1_gledger.COMPANY_CODE = nt_1_accountmaster_1.company_code
# WHERE        dbo.nt_1_gledger.COMPANY_CODE = :company_code 
#                 AND dbo.nt_1_gledger.YEAR_CODE = :year_code 
#                 AND dbo.nt_1_gledger.DOC_DATE >= :from_date
#                 AND dbo.nt_1_gledger.DOC_DATE <= :to_date
#                 AND dbo.nt_1_gledger.AC_CODE IN :ac_codes
#                 ORDER BY Ac_Code, dbo.nt_1_gledger.DOC_DATE, doc_no, DRCR
#             '''),
#             {"company_code": Company_Code, "year_code": Year_Code, "to_date": To_Date,"from_date": From_Date, 'ac_codes': tuple(ac_codes) }
#         )

#         LedgerData = [dict(row._mapping) for row in query3.fetchall()]

#         query_details = db.session.execute(
#             text('''
#               SELECT        dbo.nt_1_gledger.AC_CODE, dbo.nt_1_accountmaster.Ac_Name_E, dbo.nt_1_gledger.DRCR, dbo.nt_1_gledger.TRAN_TYPE, dbo.nt_1_gledger.DOC_NO, CONVERT(varchar, dbo.nt_1_gledger.DOC_DATE, 103) AS DOC_DATE, 
#                          dbo.nt_1_gledger.COMPANY_CODE, dbo.nt_1_gledger.YEAR_CODE, dbo.nt_1_gledger.AMOUNT, dbo.nt_1_gledger.NARRATION
# FROM            dbo.nt_1_gledger INNER JOIN
#                          dbo.nt_1_accountmaster ON dbo.nt_1_gledger.AC_CODE = dbo.nt_1_accountmaster.Ac_Code AND dbo.nt_1_gledger.COMPANY_CODE = dbo.nt_1_accountmaster.company_code
#                  where dbo.nt_1_gledger.Tran_Type NOT IN('BP','BR','CP','CR')
#             '''),
#             {"company_code": Company_Code, "year_code": Year_Code, "from_date": From_Date, "to_date": To_Date, 'ac_codes': tuple(ac_codes)}
#         )

#         detailData = [dict(row._mapping) for row in query_details.fetchall()]

#         Balance = Decimal(0)  
#         Debit_Amount = Decimal(0)  
#         Credit_Amount = Decimal(0) 
#         Account_Code = None
#         final_response_data = []

#         for row in LedgerData:
#             if Account_Code != row['AC_CODE']:
#                 Account_Code = row['AC_CODE']
#                 OpBal = OpBalData.get(Account_Code, 0)

#                 if OpBal == 0:
#                     Balance = Decimal(0)  
#                 else:
#                     Balance = Decimal(OpBal) 

#                 opening_entry = {
#                     "AC_CODE": Account_Code, 
#                     "Ac_Name_E": row['Ac_Name_E'],
#                     "Balance": abs(float(OpBal)),
#                     "DOC_DATE": From_Date.strftime('%d/%m/%Y') if From_Date else None,  
#                     "NARRATION": "Opening balance",
#                     "TRAN_TYPE": "OP",
#                     "BALANCEDRCR": 'Dr' if Balance > 0 else 'Cr',
#                     "COMPANY_CODE": Company_Code,
#                     "YEAR_CODE": Year_Code,
#                     "DEBIT_AMOUNT": Balance if Balance > 0 else 0,
#                     "CREDIT_AMOUNT":Balance if Balance < 0 else 0,
#                     "DRCR" : 'D' if Balance > 0 else 'Cr',
#                     "DRCR_NAME":row['drcrname'],
#                     "ORDER_CODE":row['ORDER_CODE'],
#                     "group_Type":row['group_Type']
#                 }
#                 final_response_data.append(opening_entry)  
#                 Debit_Amount = Decimal(0)
#                 Credit_Amount = Decimal(0)

#             amount = Decimal(row['AMOUNT'])

#             if row['DRCR'] == 'D': 
#                 Debit_Amount = amount
#                 Credit_Amount = 0
#                 Balance += amount
#             elif row['DRCR'] == 'C': 
#                 Credit_Amount = amount
#                 Debit_Amount  = 0
#                 Balance -= amount

#             row['Debit_Amount'] = float(Debit_Amount)
#             row['Credit_Amount'] = float(Credit_Amount)
#             row['Balance'] = abs(Balance)
#             detail_entry_1 = [
#                 d for d in detailData
#                 if d['TRAN_TYPE'] == row['TRAN_TYPE'] 
#                 and d['DOC_NO'] == row['DOC_NO'] 
#                 and d['COMPANY_CODE'] == row['COMPANY_CODE'] 
#                 and d['YEAR_CODE'] == row['YEAR_CODE']
#             ]


#             row['detailData'] = detail_entry_1 

#             final_response_data.append(row)

#         response_data = {
#             'LedgerData': final_response_data
#         }

#         return jsonify(response_data)

#     except Exception as e:
#         print("Error:", str(e)) 
#         return jsonify({"error": "Internal server error", "message": str(e)}), 500



# @app.route(API_URL + '/MultipleLedger', methods=['GET'])
# def MultipleLedger():
#     try:
#         From_Date = request.args.get('from_date')
#         To_Date = request.args.get('to_date')
#         Company_Code = request.args.get('Company_Code')
#         Year_Code = request.args.get('Year_Code')
#         ac_codes = request.args.get('ac_codes')

#         if ac_codes:
#             ac_codes = list(map(int, ac_codes.split(',')))

#         if not From_Date or not To_Date or not Company_Code or not Year_Code:
#             return jsonify({'error': 'Missing required parameter'}), 400
        
#         From_Date = datetime.strptime(From_Date, '%Y-%m-%d').date()
#         To_Date = datetime.strptime(To_Date, '%Y-%m-%d').date()

#         query_opbal = db.session.execute(
#             text('''
#                SELECT        dbo.nt_1_gledger.AC_CODE, SUM(CASE dbo.nt_1_gledger.DRCR WHEN 'D' THEN dbo.nt_1_gledger.AMOUNT WHEN 'C' THEN - dbo.nt_1_gledger.AMOUNT END) AS OpBal
#                FROM            dbo.nt_1_gledger INNER JOIN
#                          dbo.nt_1_accountmaster ON dbo.nt_1_gledger.AC_CODE = dbo.nt_1_accountmaster.Ac_Code AND dbo.nt_1_gledger.COMPANY_CODE = dbo.nt_1_accountmaster.company_code
#                                  WHERE  dbo.nt_1_gledger.COMPANY_CODE = :company_code and dbo.nt_1_gledger.DOC_DATE < '2024-04-01' AND dbo.nt_1_gledger.AC_CODE IN :ac_codes
#                 GROUP BY dbo.nt_1_gledger.AC_CODE
#             '''), 
#             {"company_code": Company_Code, 'ac_codes': tuple(ac_codes)}
#         )

#         OpBalData = {row[0]: row[1] for row in query_opbal.fetchall()}

#         query3 = db.session.execute(
#             text('''
#                SELECT        dbo.nt_1_gledger.TRAN_TYPE, dbo.nt_1_gledger.CASHCREDIT, dbo.nt_1_gledger.DOC_NO, CONVERT(varchar,dbo.nt_1_gledger.DOC_DATE,103) AS DOC_DATE, dbo.nt_1_gledger.AC_CODE, dbo.nt_1_accountmaster.Ac_Name_E, 
#                          dbo.nt_1_bsgroupmaster.group_Type, dbo.nt_1_gledger.NARRATION, dbo.nt_1_gledger.AMOUNT, dbo.nt_1_gledger.COMPANY_CODE, dbo.nt_1_gledger.YEAR_CODE, dbo.nt_1_gledger.DRCR, dbo.nt_1_gledger.DRCR_HEAD,dbo.nt_1_gledger.ORDER_CODE, 
#                          nt_1_accountmaster_1.Ac_Name_E AS drcrname
# FROM            dbo.nt_1_gledger INNER JOIN
#                          dbo.nt_1_accountmaster ON dbo.nt_1_gledger.AC_CODE = dbo.nt_1_accountmaster.Ac_Code AND dbo.nt_1_gledger.COMPANY_CODE = dbo.nt_1_accountmaster.company_code INNER JOIN
#                          dbo.nt_1_bsgroupmaster ON dbo.nt_1_accountmaster.Group_Code = dbo.nt_1_bsgroupmaster.group_Code AND dbo.nt_1_accountmaster.company_code = dbo.nt_1_bsgroupmaster.Company_Code LEFT OUTER JOIN
#                          dbo.nt_1_accountmaster AS nt_1_accountmaster_1 ON dbo.nt_1_gledger.DRCR_HEAD = nt_1_accountmaster_1.Ac_Code AND dbo.nt_1_gledger.COMPANY_CODE = nt_1_accountmaster_1.company_code
# WHERE        dbo.nt_1_gledger.COMPANY_CODE = :company_code 
#                 AND dbo.nt_1_gledger.YEAR_CODE = :year_code 
#                 AND dbo.nt_1_gledger.DOC_DATE >= :from_date
#                 AND dbo.nt_1_gledger.DOC_DATE <= :to_date
#                 AND dbo.nt_1_gledger.AC_CODE IN :ac_codes
#                 ORDER BY Ac_Code, dbo.nt_1_gledger.DOC_DATE, doc_no, DRCR
#             '''),
#             {"company_code": Company_Code, "year_code": Year_Code, "to_date": To_Date,"from_date": From_Date, 'ac_codes': tuple(ac_codes) }
#         )

#         LedgerData = [dict(row._mapping) for row in query3.fetchall()]

#         query_details = db.session.execute(
#             text('''
#               SELECT        dbo.nt_1_gledger.AC_CODE, dbo.nt_1_accountmaster.Ac_Name_E, dbo.nt_1_gledger.DRCR, dbo.nt_1_gledger.TRAN_TYPE, dbo.nt_1_gledger.DOC_NO, CONVERT(varchar, dbo.nt_1_gledger.DOC_DATE, 103) AS DOC_DATE, 
#                          dbo.nt_1_gledger.COMPANY_CODE, dbo.nt_1_gledger.YEAR_CODE, dbo.nt_1_gledger.AMOUNT, dbo.nt_1_gledger.NARRATION
# FROM            dbo.nt_1_gledger INNER JOIN
#                          dbo.nt_1_accountmaster ON dbo.nt_1_gledger.AC_CODE = dbo.nt_1_accountmaster.Ac_Code AND dbo.nt_1_gledger.COMPANY_CODE = dbo.nt_1_accountmaster.company_code
#                  where dbo.nt_1_gledger.Tran_Type NOT IN('BP','BR','CP','CR')
#             '''),
#             {"company_code": Company_Code, "year_code": Year_Code, "from_date": From_Date, "to_date": To_Date, 'ac_codes': tuple(ac_codes)}
#         )

#         detailData = [dict(row._mapping) for row in query_details.fetchall()]

#         Balance = Decimal(0)  
#         Debit_Amount = Decimal(0)  
#         Credit_Amount = Decimal(0) 
#         Account_Code = None
#         final_response_data = []

#         for row in LedgerData:
#             if Account_Code != row['AC_CODE']:
#                 Account_Code = row['AC_CODE']
#                 OpBal = OpBalData.get(Account_Code, 0)

#                 if OpBal == 0:
#                     Balance = Decimal(0)  
#                 else:
#                     Balance = Decimal(OpBal) 

#                 opening_entry = {
#                     "AC_CODE": Account_Code, 
#                     "Ac_Name_E": row['Ac_Name_E'],
#                     "Balance": abs(float(OpBal)),
#                     "DOC_DATE": From_Date.strftime('%d/%m/%Y') if From_Date else None,  
#                     "NARRATION": "Opening balance",
#                     "TRAN_TYPE": "OP",
#                     "BALANCEDRCR": 'Dr' if Balance > 0 else 'Cr',
#                     "COMPANY_CODE": Company_Code,
#                     "YEAR_CODE": Year_Code,
#                     "DEBIT_AMOUNT": Balance if Balance > 0 else 0,
#                     "CREDIT_AMOUNT":Balance if Balance < 0 else 0,
#                     "DRCR" : 'D' if Balance > 0 else 'Cr',
#                     "DRCR_NAME":row['drcrname'],
#                     "ORDER_CODE":row['ORDER_CODE'],
#                     "group_Type":row['group_Type']
#                 }
#                 final_response_data.append(opening_entry)  
#                 Debit_Amount = Decimal(0)
#                 Credit_Amount = Decimal(0)

#             amount = Decimal(row['AMOUNT'])

#             if row['DRCR'] == 'D': 
#                 Debit_Amount = amount
#                 Credit_Amount = 0
#                 Balance += amount
#             elif row['DRCR'] == 'C': 
#                 Credit_Amount = amount
#                 Debit_Amount  = 0
#                 Balance -= amount

#             row['Debit_Amount'] = float(Debit_Amount)
#             row['Credit_Amount'] = float(Credit_Amount)
#             row['Balance'] = abs(Balance)

#             exclude_tran_types = ['BP', 'BR', 'CP', 'CR']

#             if row['TRAN_TYPE'] not in exclude_tran_types:
#                 detail_entry_1 = [
#                     d for d in detailData
#                     if d['TRAN_TYPE'] == row['TRAN_TYPE'] 
#                     and d['DOC_NO'] == row['DOC_NO'] 
#                     and d['COMPANY_CODE'] == row['COMPANY_CODE'] 
#                     and d['YEAR_CODE'] == row['YEAR_CODE']
#                 ]


#                 row['detailData'] = detail_entry_1 
#             else:
#                 row['detailData'] = []

#             final_response_data.append(row)

#         response_data = {
#             'LedgerData': final_response_data
#         }

#         return jsonify(response_data)

#     except Exception as e:
#         print("Error:", str(e)) 
#         return jsonify({"error": "Internal server error", "message": str(e)}), 500
    
@app.route(API_URL + '/MultipleLedger', methods=['GET'])
def MultipleLedger():
    try:
        From_Date = request.args.get('from_date')
        To_Date = request.args.get('to_date')
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')
        ac_codes = request.args.get('ac_codes')

        if not From_Date or not To_Date or not Company_Code or not Year_Code:
            return jsonify({'error': 'Missing required parameter'}), 400

        From_Date = datetime.strptime(From_Date, '%Y-%m-%d').date()
        To_Date = datetime.strptime(To_Date, '%Y-%m-%d').date()

        if ac_codes:
            ac_codes = list(map(int, ac_codes.split(',')))

        # === Opening Balance ===
        query_opbal = db.session.execute(
            text('''
                SELECT g.AC_CODE,
                       SUM(CASE g.DRCR WHEN 'D' THEN g.AMOUNT WHEN 'C' THEN -g.AMOUNT END) AS OpBal
                FROM dbo.nt_1_gledger g
                INNER JOIN dbo.nt_1_accountmaster a
                    ON g.AC_CODE = a.Ac_Code AND g.COMPANY_CODE = a.company_code
                WHERE g.COMPANY_CODE = :company_code
                  AND g.DOC_DATE < :from_date
                  AND g.AC_CODE IN :ac_codes
                GROUP BY g.AC_CODE
            '''),
            {"company_code": Company_Code, "from_date": From_Date, "ac_codes": tuple(ac_codes)}
        )
        OpBalData = {row[0]: row[1] for row in query_opbal.fetchall()}

        # === Ledger Entries ===
        query3 = db.session.execute(
            text('''
                SELECT g.TRAN_TYPE, g.CASHCREDIT, g.DOC_NO, 
                       CONVERT(varchar, g.DOC_DATE, 103) AS DOC_DATE, 
                       g.AC_CODE, a.Ac_Name_E, bg.group_Type, g.NARRATION, 
                       g.AMOUNT, g.COMPANY_CODE, g.YEAR_CODE, g.DRCR, g.DRCR_HEAD, g.ORDER_CODE,
                       a2.Ac_Name_E AS drcrname
                FROM dbo.nt_1_gledger g
                INNER JOIN dbo.nt_1_accountmaster a 
                    ON g.AC_CODE = a.Ac_Code AND g.COMPANY_CODE = a.company_code
                INNER JOIN dbo.nt_1_bsgroupmaster bg 
                    ON a.Group_Code = bg.group_Code AND a.company_code = bg.Company_Code
                LEFT OUTER JOIN dbo.nt_1_accountmaster a2 
                    ON g.DRCR_HEAD = a2.Ac_Code AND g.COMPANY_CODE = a2.company_code
                WHERE g.COMPANY_CODE = :company_code
                  AND g.YEAR_CODE = :year_code
                  AND g.DOC_DATE BETWEEN :from_date AND :to_date
                  AND g.AC_CODE IN :ac_codes
                ORDER BY g.AC_CODE, g.DOC_DATE, g.DOC_NO, g.DRCR
            '''),
            {
                "company_code": Company_Code,
                "year_code": Year_Code,
                "from_date": From_Date,
                "to_date": To_Date,
                "ac_codes": tuple(ac_codes)
            }
        )
        LedgerData = [dict(row._mapping) for row in query3.fetchall()]

        # === Detail Data (only for specific TRAN_TYPEs) ===
        query_details = db.session.execute(
            text('''
                SELECT g.AC_CODE, a.Ac_Name_E, g.DRCR, g.TRAN_TYPE, g.DOC_NO, 
                       CONVERT(varchar, g.DOC_DATE, 103) AS DOC_DATE,
                       g.COMPANY_CODE, g.YEAR_CODE, g.AMOUNT, g.NARRATION
                FROM dbo.nt_1_gledger g
                INNER JOIN dbo.nt_1_accountmaster a 
                    ON g.AC_CODE = a.Ac_Code AND g.COMPANY_CODE = a.company_code
                WHERE g.Tran_Type NOT IN ('BP', 'BR', 'CP', 'CR')
            ''')
        )
        detailData = [dict(row._mapping) for row in query_details.fetchall()]

        # === Final Aggregation ===
        final_response_data = []
        Balance = Decimal(0)
        Account_Code = None

        for row in LedgerData:
            if Account_Code != row['AC_CODE']:
                Account_Code = row['AC_CODE']
                Balance = Decimal(OpBalData.get(Account_Code, 0))

                # Add opening balance
                opening_entry = {
                    "AC_CODE": Account_Code,
                    "Ac_Name_E": row['Ac_Name_E'],
                    "Balance": float(abs(Balance)),
                    "DOC_DATE": From_Date.strftime('%d/%m/%Y'),
                    "NARRATION": "Opening balance",
                    "TRAN_TYPE": "OP",
                    "BALANCEDRCR": "Dr" if Balance > 0 else "Cr",
                    "COMPANY_CODE": Company_Code,
                    "YEAR_CODE": Year_Code,
                    "DEBIT_AMOUNT": float(abs(Balance)) if Balance > 0 else 0,
                    "CREDIT_AMOUNT": float(abs(Balance)) if Balance < 0 else 0,
                    "DRCR": "D" if Balance > 0 else "C",
                    "DRCR_NAME": row['drcrname'],
                    "ORDER_CODE": row['ORDER_CODE'],
                    "group_Type": row['group_Type']
                }
                final_response_data.append(opening_entry)

            # Reset per row
            Debit_Amount = Decimal(0)
            Credit_Amount = Decimal(0)
            amount = Decimal(row['AMOUNT'] or 0)

            if row['DRCR'] == 'D':
                Debit_Amount = amount
                Balance += amount
            elif row['DRCR'] == 'C':
                Credit_Amount = amount
                Balance -= amount

            row['Debit_Amount'] = float(Debit_Amount)
            row['Credit_Amount'] = float(Credit_Amount)
            row['Balance'] = float(abs(Balance))
            row['BALANCEDRCR'] = "Dr" if Balance > 0 else "Cr"

            # Attach detail data if needed
            if row['TRAN_TYPE'] not in ['BP', 'BR', 'CP', 'CR']:
                row['detailData'] = [
                    d for d in detailData
                    if d['TRAN_TYPE'] == row['TRAN_TYPE']
                    and d['DOC_NO'] == row['DOC_NO']
                    and d['COMPANY_CODE'] == row['COMPANY_CODE']
                    and d['YEAR_CODE'] == row['YEAR_CODE']
                ]
            else:
                row['detailData'] = []

            final_response_data.append(row)

        return jsonify({"LedgerData": final_response_data})

    except Exception as e:
        print("Error:", str(e))
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    
#GET Day wise Ledger Statements
@app.route(API_URL+'/get_DayBook', methods=['GET'])
def get_DayBook():
    company_code = request.args.get('company_code')
    year_code = request.args.get('year_code')
    from_date = request.args.get('from_date')
    to_date = request.args.get('to_date')
    
    query = '''
        SELECT dbo.nt_1_gledger.TRAN_TYPE, dbo.nt_1_gledger.DOC_NO, dbo.nt_1_gledger.DOC_DATE, 
               dbo.nt_1_gledger.AC_CODE, dbo.nt_1_accountmaster.Ac_Name_E, 
               dbo.nt_1_gledger.NARRATION,dbo.nt_1_gledger.CA_NARRATION, 
               CASE WHEN dbo.nt_1_gledger.drcr = 'D' THEN dbo.nt_1_gledger.AMOUNT ELSE 0 END AS debit, 
               CASE WHEN dbo.nt_1_gledger.drcr = 'C' THEN dbo.nt_1_gledger.AMOUNT ELSE 0 END AS credit, 
               0 as Balance, dbo.nt_1_gledger.drcr, dbo.nt_1_gledger.AMOUNT,dbo.nt_1_gledger.do_no
        FROM dbo.nt_1_gledger 
        LEFT OUTER JOIN dbo.nt_1_accountmaster 
        ON dbo.nt_1_gledger.ac = dbo.nt_1_accountmaster.accoid
        WHERE dbo.nt_1_gledger.COMPANY_CODE = :company_code 
        AND dbo.nt_1_gledger.YEAR_CODE = :year_code 
    '''
    
    params = {"company_code": company_code, "year_code": year_code}

    if from_date and to_date:
        query += " AND dbo.nt_1_gledger.DOC_DATE BETWEEN :from_date AND :to_date"
        params["from_date"] = from_date
        params["to_date"] = to_date
    
    query += " ORDER BY DOC_DATE ASC, tran_type, cashcredit, doc_no, SORT_TYPE, SORT_NO, ORDER_CODE"
    
    result = db.session.execute(text(query), params)
    all_data = [dict(row._mapping) for row in result]

    for data in all_data:
        if 'DOC_DATE' in data:
            data['DOC_DATE'] = data['DOC_DATE'].strftime('%Y-%m-%d') if data['DOC_DATE'] else None
 
    response = {"Day_Book": all_data}
    return jsonify(response), 200


@app.route(API_URL+'/StatisticData', methods=["GET"])
def StatisticData():
    try:
        Company_Code = request.args.get('Company_Code')
        FromDate = request.args.get('fromDT')
        ToDate = request.args.get('toDT')

        if not all([Company_Code, FromDate, ToDate]):
            return jsonify({"error": "Missing required parameters."}), 400

        result = db.session.execute(
            text("""
                EXEC CountTableRecordsReact
                    @Company_Code = :CompanyCode,
                    @FromDate = :FromDate,
                    @ToDate = :ToDate
            """),
            {
                'CompanyCode': Company_Code,
                'FromDate': FromDate,
                'ToDate': ToDate
            }
        ).fetchall()

        data = [dict(row._mapping) for row in result]
        return jsonify(data)

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    

@app.route(API_URL+"/generating_MultiplesaleBill_report", methods=["GET"])
def generating_MultiplesaleBill_report():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        Ac_code = request.args.get('Ac_code')
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')

        if not company_code or not year_code:
            return jsonify({"error": "Missing 'Company_Code' or 'Year_Code' parameter"}), 400

        if not Ac_code and not (from_date and to_date):
            return jsonify({"error": "Provide either Ac_code or both from_date and to_date"}), 400

        base_query = '''SELECT        dbo.qrysalehead.doc_no, dbo.qrysalehead.PURCNO, dbo.qrysalehead.doc_date, dbo.qrysalehead.Ac_Code, dbo.qrysalehead.Unit_Code, dbo.qrysalehead.mill_code, dbo.qrysalehead.FROM_STATION,
                         dbo.qrysalehead.TO_STATION, dbo.qrysalehead.LORRYNO, dbo.qrysalehead.BROKER, dbo.qrysalehead.wearhouse, dbo.qrysalehead.subTotal, dbo.qrysalehead.LESS_FRT_RATE, dbo.qrysalehead.freight,
                         dbo.qrysalehead.cash_advance, dbo.qrysalehead.bank_commission, ISNULL(dbo.qrysalehead.OTHER_AMT, 0) AS OTHER_AMT, dbo.qrysalehead.Bill_Amount, dbo.qrysalehead.Due_Days, dbo.qrysalehead.NETQNTL,
                         dbo.qrysalehead.Company_Code, dbo.qrysalehead.Year_Code, dbo.qrysalehead.Branch_Code, dbo.qrysalehead.Created_By, dbo.qrysalehead.Modified_By, dbo.qrysalehead.Tran_Type, dbo.qrysalehead.DO_No,
                         dbo.qrysalehead.Transport_Code, ISNULL(dbo.qrysalehead.RateDiff, 0) AS RateDiff, dbo.qrysalehead.ASN_No, dbo.qrysalehead.GstRateCode, dbo.qrysalehead.CGSTRate, dbo.qrysalehead.CGSTAmount,
                         dbo.qrysalehead.SGSTRate, dbo.qrysalehead.SGSTAmount, dbo.qrysalehead.IGSTRate, dbo.qrysalehead.IGSTAmount, dbo.qrysalehead.TaxableAmount, dbo.qrysalehead.EWay_Bill_No, dbo.qrysalehead.EWayBill_Chk,
                         dbo.qrysalehead.MillInvoiceNo, ISNULL(dbo.qrysalehead.RoundOff, 0) AS RoundOff, dbo.qrysalehead.saleid, dbo.qrysalehead.ac, dbo.qrysalehead.uc, dbo.qrysalehead.mc, dbo.qrysalehead.bk, dbo.qrysalehead.billtoname,
                         dbo.qrysalehead.billtoaddress, dbo.qrysalehead.billtogstno, dbo.qrysalehead.billtopanno, dbo.qrysalehead.billtopin, dbo.qrysalehead.billtopincode, dbo.qrysalehead.billtocitystate, dbo.qrysalehead.billtogststatecode,
                         dbo.qrysalehead.shiptoname, dbo.qrysalehead.shiptoaddress, dbo.qrysalehead.shiptogstno, dbo.qrysalehead.shiptopanno, dbo.qrysalehead.shiptocityname, dbo.qrysalehead.shiptocitypincode,
                         dbo.qrysalehead.shiptocitystate, dbo.qrysalehead.shiptogststatecode, dbo.qrysalehead.billtoemail, dbo.qrysalehead.shiptoemail, dbo.qrysalehead.millname, dbo.qrysalehead.brokername, dbo.qrysalehead.GST_Name,
                         dbo.qrysalehead.gstrate, dbo.qrysaledetail.detail_id AS itemcode, dbo.qrysaledetail.item_code, dbo.qrysaledetail.narration, dbo.qrysaledetail.Quantal, dbo.qrysaledetail.packing, dbo.qrysaledetail.bags,
                         dbo.qrysaledetail.rate AS salerate, dbo.qrysaledetail.item_Amount, dbo.qrysaledetail.ic, dbo.qrysaledetail.saledetailid, dbo.qrysaledetail.itemname, dbo.qrysaledetail.HSN, dbo.qrysalehead.doc_dateConverted,
                         dbo.qrysalehead.tc, dbo.qrysalehead.transportname, dbo.qrysalehead.transportmobile, dbo.qrysalehead.billtomobileto, dbo.qrysalehead.GSTStateCode AS partygststatecode, dbo.qrysalehead.shiptostatecode,
                         dbo.qrysalehead.DoNarrtion, dbo.qrysalehead.TCS_Rate, dbo.qrysalehead.TCS_Amt, dbo.qrysalehead.TCS_Net_Payable, dbo.qrysalehead.newsbno, dbo.qrysalehead.newsbdate, dbo.qrysalehead.einvoiceno,
                         dbo.qrysalehead.ackno, dbo.qrysalehead.Delivery_type, dbo.qrysalehead.millshortname, dbo.qrysalehead.billtostatename, dbo.qrysalehead.shiptoshortname, dbo.qrysalehead.shiptomobileno, dbo.qrysalehead.shiptotinno,
                         dbo.qrysalehead.shiptolocallicno, dbo.qrysaledetail.Brand_Code, CONVERT(varchar, dbo.qrysalehead.EwayBillValidDate, 103) AS EwayBillValidDate, dbo.qrysalehead.FSSAI_BillTo, dbo.qrysalehead.FSSAI_ShipTo,
                         dbo.qrysalehead.BillToTanNo, dbo.qrysalehead.ShipToTanNo, dbo.qrysalehead.TDS_Rate, dbo.qrysalehead.TDS_Amt, dbo.qrysalehead.IsDeleted, dbo.qrysalehead.SBNarration, dbo.qrysalehead.QRCode,
                         dbo.qrysalehead.MillFSSAI_No, dbo.qrysaledetail.Brand_Name, '' AS FreightPerQtl, dbo.company.State_E AS companyStateName, dbo.nt_1_companyparameters.GSTStateCode AS companyGSTStateCode,
                         dbo.qrysalehead.grade, dbo.tblvoucherheadaddress.bankdetail, dbo.company.GST AS companyGSTNo, dbo.company.City_E AS companyCity, dbo.company.FSSAI_No AS companyFSSAI, dbo.company.Pan_No AS companyPan,
                         dbo.company.TIN AS companyTIN, dbo.tblvoucherheadaddress.AL1, dbo.tblvoucherheadaddress.AL2, dbo.tblvoucherheadaddress.AL3, dbo.tblvoucherheadaddress.AL4, dbo.tblvoucherheadaddress.Other,
                         dbo.tblvoucherheadaddress.BillFooter, dbo.company.Company_Name_E, dbo.qrysalehead.season, dbo.qrysalehead.driver_no, dbo.company.PHONE, dbo.carporatehead.created_by AS Expr1, dbo.carporatehead.pono,
                         dbo.accountingyear.year, dbo.qrysalehead.Carporate_Sale_No AS carporateSaleDoc, dbo.qrysalehead.CarporateBillToGst_No, dbo.qrysalehead.CarporateBillToEmailID, dbo.qrysalehead.Carporate_Tanno,
                         dbo.qrysalehead.CarporateState_Code, dbo.qrysalehead.Carporate_Pan, dbo.qrysalehead.Carporate_Address, dbo.qrysalehead.CarporateBillTo_Name, dbo.qrysalehead.Mobile_No AS carporateBillToMobileNo,
                         dbo.qrysalehead.cityname AS carporateBillToCityName, dbo.qrysalehead.Pincode AS carporateBillToPincode, dbo.qrysalehead.State_Name AS carporateBillToStateName, dbo.qrysalehead.FSSAI AS carporateBillToFSSAI,
                         dbo.qrysalehead.sale_rate AS DOSalerate, dbo.qrysalehead.Tender_Commission, dbo.carporatehead.selling_type, dbo.qrysalehead.BillToWpNo, dbo.qrysalehead.TransportWpNo, dbo.qrysalehead.ShipToWpNo,
                         dbo.qrysalehead.CarporateBillToWpNo, dbo.qrysalehead.RefWpNo, dbo.qrysalehead.RefMail, dbo.qrysalehead.TransportEmail, dbo.qrysalehead.millstatename, dbo.qrysalehead.millstatecode,
                         dbo.qrysalehead.brokermobno
FROM            dbo.nt_1_companyparameters INNER JOIN
                         dbo.tblvoucherheadaddress ON dbo.nt_1_companyparameters.Company_Code = dbo.tblvoucherheadaddress.Company_Code INNER JOIN
                         dbo.accountingyear ON dbo.nt_1_companyparameters.Company_Code = dbo.accountingyear.Company_Code AND dbo.nt_1_companyparameters.Year_Code = dbo.accountingyear.yearCode RIGHT OUTER JOIN
                         dbo.carporatehead RIGHT OUTER JOIN
                         dbo.qrysalehead ON dbo.carporatehead.doc_no = dbo.qrysalehead.Carporate_Sale_No AND dbo.carporatehead.company_code = dbo.qrysalehead.Company_Code ON
                         dbo.nt_1_companyparameters.Year_Code = dbo.qrysalehead.Year_Code AND dbo.nt_1_companyparameters.Company_Code = dbo.qrysalehead.Company_Code LEFT OUTER JOIN
                         dbo.qrysaledetail ON dbo.qrysalehead.saleid = dbo.qrysaledetail.saleid FULL OUTER JOIN
                         dbo.company ON dbo.qrysalehead.Company_Code = dbo.company.Company_Code
                 WHERE dbo.qrysalehead.Company_Code = :company_code AND dbo.qrysalehead.Year_Code <= :year_code'''

        params = {"company_code": company_code, "year_code": int(year_code)}

        if Ac_code:
            base_query += " AND dbo.qrysalehead.Ac_code = :Ac_code"
            params["Ac_code"] = Ac_code

        if from_date and to_date:
            base_query += " AND dbo.qrysalehead.doc_date >= :from_date AND dbo.qrysalehead.doc_date <= :to_date"
            params["from_date"] = from_date
            params["to_date"] = to_date

        base_query += " ORDER BY dbo.qrysalehead.doc_no DESC"

        additional_data = db.session.execute(text(base_query), params)

        additional_data_rows = additional_data.fetchall()
        
        all_data = [dict(row._mapping) for row in additional_data_rows]

        for data in all_data:
            if 'doc_date' in data:
                data['doc_date'] = data['doc_date'].strftime('%Y-%m-%d') if data['doc_date'] else None
        response = {
            "all_data": all_data
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    

@app.route(API_URL + "/get_gLedgerReport_AcWise_CA", methods=["GET"])
def get_gLedgerReport_AcWise_CA():
    def format_date(date):
        if date:
            return date.strftime('%d/%m/%Y')
        return None
    try:
        # Get query parameters
        company_code = request.args.get('Company_Code')
        # year_code = request.args.get('Year_Code')
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        accode = int(request.args.get('Accode')) if request.args.get('Accode') else None

        # Ensure required parameters are present
        if not company_code :
            return jsonify({"error": "Missing 'Company_Code' Parameter"}), 400

        # Base SQL query
        query = '''
            SELECT dbo.nt_1_gledger.TRAN_TYPE, dbo.nt_1_gledger.DOC_NO, dbo.nt_1_gledger.DOC_DATE, dbo.nt_1_gledger.AC_CODE, dbo.nt_1_accountmaster.Ac_Name_E, 
                   dbo.nt_1_gledger.CA_NARRATION, 
                   CASE WHEN dbo.nt_1_gledger.drcr = 'D' THEN dbo.nt_1_gledger.AMOUNT ELSE 0 END AS debit, 
                   CASE WHEN dbo.nt_1_gledger.drcr = 'C' THEN dbo.nt_1_gledger.AMOUNT ELSE 0 END AS credit,0 as Balance, dbo.nt_1_gledger.drcr,dbo.nt_1_gledger.AMOUNT,dbo.nt_1_gledger.do_no
            FROM dbo.nt_1_gledger 
            LEFT OUTER JOIN dbo.nt_1_accountmaster 
            ON dbo.nt_1_gledger.ac = dbo.nt_1_accountmaster.accoid
            WHERE dbo.nt_1_gledger.COMPANY_CODE = :company_code 
            and dbo.nt_1_gledger.AC_CODE = :Accode
            
        '''
        if from_date and to_date :
            query += " AND dbo.nt_1_gledger.DOC_DATE BETWEEN :from_date AND :to_date order by DOC_DATE asc,tran_type,cashcredit,doc_no,SORT_TYPE,SORT_NO,ORDER_CODE "

        # Execute the query with parameters
        additional_data = db.session.execute(
            text(query), 
            {"company_code": company_code,"from_date": from_date, 
             "to_date": to_date,'Accode' : accode}
        )

        # Fetch results
        additional_data_rows = additional_data.fetchall()

        # Convert rows to dictionaries
        all_data = [dict(row._mapping) for row in additional_data_rows]

        # Format date fields
        for data in all_data:
            if 'DOC_DATE' in data:
                data['DOC_DATE'] = format_date(data['DOC_DATE'])

        with db.session.begin_nested():
            # Execute query2 first
            query2 = db.session.execute(
                text('''
                     SELECT top(1) group_Type from qrymstaccountmaster
            WHERE Company_Code = :company_code 
            
            and Ac_code = :Accode
                '''),
               {"company_code": company_code, "from_date": from_date, 
             "to_date": to_date,'Accode' : accode}
            )
            GroupData = [dict(row._mapping) for row in query2.fetchall()]
            GroupType=GroupData[0].get('group_Type', None)  

            if GroupType=='B' :
                    query3 = db.session.execute(
                    text('''
                        select AC_CODE,SUM(case drcr when 'D' then AMOUNT when 'C' then -amount end) as  OpBal from nt_1_gledger
                WHERE dbo.nt_1_gledger.COMPANY_CODE = :company_code 
                and dbo.nt_1_gledger.AC_CODE = :Accode
                and dbo.nt_1_gledger.DOC_DATE < :from_date  
                         group by AC_CODE          
                    '''),
                {"company_code": company_code,"from_date": from_date, 
                "to_date": to_date,'Accode' : accode}
                )
                    OpeingBalanceData = [dict(row._mapping) for row in query3.fetchall()]
                    
            else :
                    query3 = db.session.execute(
                    text('''
                        select AC_CODE,SUM(case drcr when 'D' then AMOUNT when 'C' then -amount end) as  OpBal from nt_1_gledger 
                WHERE dbo.nt_1_gledger.COMPANY_CODE = :company_code 
                
                and dbo.nt_1_gledger.AC_CODE = :Accode
                and dbo.nt_1_gledger.DOC_DATE >= :from_date  
                and dbo.nt_1_gledger.DOC_DATE < :from_date  
                         
                         group by nt_1_gledger.AC_CODE     
                    '''),
                {"company_code": company_code,"from_date": from_date, 
                "to_date": to_date,'Accode' : accode}
                )
                    OpeingBalanceData = [dict(row._mapping) for row in query3.fetchall()]
                    
        # Prepare response
        response = {
            "all_data": all_data,
            "Opening_Balance" :OpeingBalanceData,
        }

        # Return response
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    

# @app.route(API_URL + "/get_gLedgerReport_AcWise_CA", methods=["GET"])
# def get_gLedgerReport_AcWise_CA():
#     def format_date(date):
#         if date:
#             return date.strftime('%d/%m/%Y')
#         return None

#     try:
#         # Get query parameters
#         company_code = request.args.get('Company_Code')
#         from_date = request.args.get('from_date')
#         to_date = request.args.get('to_date')
#         accode = int(request.args.get('Accode')) if request.args.get('Accode') else None

#         # Ensure required parameters are present
#         if not company_code:
#             return jsonify({"error": "Missing 'Company_Code' Parameter"}), 400

#         # Base SQL query – SAME as old, but with extra CA_NARRATION field
#         query = '''
#             SELECT 
#                 g.TRAN_TYPE, 
#                 g.DOC_NO, 
#                 g.DOC_DATE, 
#                 g.AC_CODE, 
#                 am.Ac_Name_E, 
#                 g.NARRATION,

#                 CA_NARRATION =
#                     CASE 
#                         -- If narration present: prefix + narration
#                         WHEN ISNULL(LTRIM(RTRIM(g.NARRATION)), '') <> '' THEN
#                             CASE 
#                                 WHEN g.TRAN_TYPE = 'BR' THEN
#                                     'Being bank receipt: ' + g.NARRATION

#                                 WHEN g.TRAN_TYPE = 'DO' THEN
#                                     'Being delivery order: ' + g.NARRATION

#                                 WHEN g.TRAN_TYPE = 'SB' THEN
#                                     'Being sale bill: ' + g.NARRATION

#                                 WHEN g.TRAN_TYPE = 'LV' THEN
#                                     'Being commission/local voucher: ' + g.NARRATION

#                                 WHEN g.TRAN_TYPE = 'PS' THEN
#                                     'Being purchase bill: ' + g.NARRATION

#                                 WHEN g.TRAN_TYPE = 'UI' THEN
#                                     'Being UTR entry: ' + g.NARRATION

#                                 WHEN g.TRAN_TYPE = 'CR' THEN
#                                     'Being cash receipt: ' + g.NARRATION

#                                 WHEN g.TRAN_TYPE = 'DN' THEN
#                                     'Being debit note: ' + g.NARRATION

#                                 WHEN g.TRAN_TYPE = 'BP' THEN
#                                     'Being bank payment: ' + g.NARRATION

#                                 WHEN g.TRAN_TYPE = 'RB' THEN
#                                     'Being service bill: ' + g.NARRATION

#                                 WHEN g.TRAN_TYPE = 'DS' THEN
#                                     'Being debit note to supplier: ' + g.NARRATION

#                                 WHEN g.TRAN_TYPE = 'PR' THEN
#                                     'Being purchase return: ' + g.NARRATION

#                                 WHEN g.TRAN_TYPE = 'CS' THEN
#                                     'Being credit note to supplier: ' + g.NARRATION

#                                 WHEN g.TRAN_TYPE = 'CP' THEN
#                                     'Being cash payment: ' + g.NARRATION

#                                 WHEN g.TRAN_TYPE = 'XP' THEN
#                                     'Being other purchase: ' + g.NARRATION

#                                 WHEN g.TRAN_TYPE = 'CN' THEN
#                                     'Being credit note to customer: ' + g.NARRATION

#                                 WHEN g.TRAN_TYPE = 'JV' THEN
#                                     'Being journal voucher: ' + g.NARRATION

#                                 WHEN g.TRAN_TYPE = 'RS' THEN
#                                     'Being return sale: ' + g.NARRATION

#                                 ELSE
#                                     'Being voucher: ' + g.NARRATION
#                             END

#                         -- If narration blank: generic fallback for each type
#                         ELSE
#                             CASE 
#                                 WHEN g.TRAN_TYPE = 'BR' THEN
#                                     'Being bank receipt for Rs. ' 
#                                     + CAST(g.AMOUNT AS varchar(20))
#                                     + ' as per voucher no. ' 
#                                     + CAST(g.DOC_NO AS varchar(10))

#                                 WHEN g.TRAN_TYPE = 'DO' THEN
#                                     'Being delivery order no. ' 
#                                     + CAST(g.do_no AS varchar(10))
#                                     + ' (voucher no. '
#                                     + CAST(g.DOC_NO AS varchar(10)) + ')'
#                                     + ' for Rs. ' + CAST(g.AMOUNT AS varchar(20))

#                                 WHEN g.TRAN_TYPE = 'SB' THEN
#                                     'Being sale bill no. ' 
#                                     + CAST(g.DOC_NO AS varchar(10))
#                                     + ' for Rs. ' + CAST(g.AMOUNT AS varchar(20))

#                                 WHEN g.TRAN_TYPE = 'LV' THEN
#                                     'Being commission/local voucher no. ' 
#                                     + CAST(g.DOC_NO AS varchar(10))
#                                     + ' for Rs. ' + CAST(g.AMOUNT AS varchar(20))

#                                 WHEN g.TRAN_TYPE = 'PS' THEN
#                                     'Being purchase bill no. ' 
#                                     + CAST(g.DOC_NO AS varchar(10))
#                                     + ' for Rs. ' + CAST(g.AMOUNT AS varchar(20))

#                                 WHEN g.TRAN_TYPE = 'UI' THEN
#                                     'Being UTR entry for Rs. ' 
#                                     + CAST(g.AMOUNT AS varchar(20))
#                                     + ' (voucher no. ' 
#                                     + CAST(g.DOC_NO AS varchar(10)) + ')'

#                                 WHEN g.TRAN_TYPE = 'CR' THEN
#                                     'Being cash receipt for Rs. ' 
#                                     + CAST(g.AMOUNT AS varchar(20))
#                                     + ' as per voucher no. ' 
#                                     + CAST(g.DOC_NO AS varchar(10))

#                                 WHEN g.TRAN_TYPE = 'DN' THEN
#                                     'Being debit note no. ' 
#                                     + CAST(g.DOC_NO AS varchar(10))
#                                     + ' for Rs. ' + CAST(g.AMOUNT AS varchar(20))

#                                 WHEN g.TRAN_TYPE = 'BP' THEN
#                                     'Being bank payment for Rs. ' 
#                                     + CAST(g.AMOUNT AS varchar(20))
#                                     + ' as per voucher no. ' 
#                                     + CAST(g.DOC_NO AS varchar(10))

#                                 WHEN g.TRAN_TYPE = 'RB' THEN
#                                     'Being service bill no. ' 
#                                     + CAST(g.DOC_NO AS varchar(10))
#                                     + ' for Rs. ' + CAST(g.AMOUNT AS varchar(20))

#                                 WHEN g.TRAN_TYPE = 'DS' THEN
#                                     'Being debit note to supplier no. ' 
#                                     + CAST(g.DOC_NO AS varchar(10))
#                                     + ' for Rs. ' + CAST(g.AMOUNT AS varchar(20))

#                                 WHEN g.TRAN_TYPE = 'PR' THEN
#                                     'Being purchase return for Rs. ' 
#                                     + CAST(g.AMOUNT AS varchar(20))
#                                     + ' (voucher no. ' 
#                                     + CAST(g.DOC_NO AS varchar(10)) + ')'

#                                 WHEN g.TRAN_TYPE = 'CS' THEN
#                                     'Being credit note to supplier no. ' 
#                                     + CAST(g.DOC_NO AS varchar(10))
#                                     + ' for Rs. ' + CAST(g.AMOUNT AS varchar(20))

#                                 WHEN g.TRAN_TYPE = 'CP' THEN
#                                     'Being cash payment for Rs. ' 
#                                     + CAST(g.AMOUNT AS varchar(20))
#                                     + ' as per voucher no. ' 
#                                     + CAST(g.DOC_NO AS varchar(10))

#                                 WHEN g.TRAN_TYPE = 'XP' THEN
#                                     'Being other purchase voucher no. ' 
#                                     + CAST(g.DOC_NO AS varchar(10))
#                                     + ' for Rs. ' + CAST(g.AMOUNT AS varchar(20))

#                                 WHEN g.TRAN_TYPE = 'CN' THEN
#                                     'Being credit note to customer no. ' 
#                                     + CAST(g.DOC_NO AS varchar(10))
#                                     + ' for Rs. ' + CAST(g.AMOUNT AS varchar(20))

#                                 WHEN g.TRAN_TYPE = 'JV' THEN
#                                     'Being journal voucher no. ' 
#                                     + CAST(g.DOC_NO AS varchar(10))
#                                     + ' for Rs. ' + CAST(g.AMOUNT AS varchar(20))

#                                 WHEN g.TRAN_TYPE = 'RS' THEN
#                                     'Being return sale for Rs. ' 
#                                     + CAST(g.AMOUNT AS varchar(20))
#                                     + ' (voucher no. ' 
#                                     + CAST(g.DOC_NO AS varchar(10)) + ')'

#                                 ELSE
#                                     'Being voucher no. ' 
#                                     + CAST(g.DOC_NO AS varchar(10))
#                                     + ' for Rs. ' + CAST(g.AMOUNT AS varchar(20))
#                             END
#                     END,

#                 CASE WHEN g.drcr = 'D' THEN g.AMOUNT ELSE 0 END AS debit,
#                 CASE WHEN g.drcr = 'C' THEN g.AMOUNT ELSE 0 END AS credit,
#                 0 AS Balance,
#                 g.drcr,
#                 g.AMOUNT,
#                 g.do_no
#             FROM dbo.nt_1_gledger g
#             LEFT OUTER JOIN dbo.nt_1_accountmaster am
#                 ON g.ac = am.accoid
#             WHERE g.COMPANY_CODE = :company_code 
#               AND g.AC_CODE = :Accode
#         '''

#         if from_date and to_date:
#             query += " AND g.DOC_DATE BETWEEN :from_date AND :to_date ORDER BY g.DOC_DATE ASC, g.tran_type, g.cashcredit, g.doc_no, g.SORT_TYPE, g.SORT_NO, g.ORDER_CODE "

#         # Execute the query with parameters
#         additional_data = db.session.execute(
#             text(query),
#             {"company_code": company_code,
#              "from_date": from_date,
#              "to_date": to_date,
#              "Accode": accode}
#         )

#         # Fetch results
#         additional_data_rows = additional_data.fetchall()

#         # Convert rows to dictionaries
#         all_data = [dict(row._mapping) for row in additional_data_rows]

#         # Format date fields
#         for data in all_data:
#             if 'DOC_DATE' in data:
#                 data['DOC_DATE'] = format_date(data['DOC_DATE'])

#         # Opening balance logic – SAME as your original
#         with db.session.begin_nested():
#             query2 = db.session.execute(
#                 text('''
#                     SELECT TOP(1) group_Type 
#                     FROM qrymstaccountmaster
#                     WHERE Company_Code = :company_code 
#                       AND Ac_code = :Accode
#                 '''),
#                 {"company_code": company_code,
#                  "from_date": from_date,
#                  "to_date": to_date,
#                  "Accode": accode}
#             )
#             GroupData = [dict(row._mapping) for row in query2.fetchall()]
#             GroupType = GroupData[0].get('group_Type', None) if GroupData else None

#             if GroupType == 'B':
#                 query3 = db.session.execute(
#                     text('''
#                         SELECT AC_CODE,
#                                SUM(CASE drcr WHEN 'D' THEN AMOUNT WHEN 'C' THEN -amount END) AS OpBal 
#                         FROM nt_1_gledger
#                         WHERE COMPANY_CODE = :company_code 
#                           AND AC_CODE = :Accode
#                           AND DOC_DATE < :from_date  
#                         GROUP BY AC_CODE          
#                     '''),
#                     {"company_code": company_code,
#                      "from_date": from_date,
#                      "to_date": to_date,
#                      "Accode": accode}
#                 )
#             else:
#                 query3 = db.session.execute(
#                     text('''
#                         SELECT AC_CODE,
#                                SUM(CASE drcr WHEN 'D' THEN AMOUNT WHEN 'C' THEN -amount END) AS OpBal 
#                         FROM nt_1_gledger 
#                         WHERE COMPANY_CODE = :company_code 
#                           AND AC_CODE = :Accode
#                           AND DOC_DATE >= :from_date  
#                           AND DOC_DATE < :from_date  
#                         GROUP BY AC_CODE     
#                     '''),
#                     {"company_code": company_code,
#                      "from_date": from_date,
#                      "to_date": to_date,
#                      "Accode": accode}
#                 )

#             OpeingBalanceData = [dict(row._mapping) for row in query3.fetchall()]

#         response = {
#             "all_data": all_data,
#             "Opening_Balance": OpeingBalanceData,
#         }

#         return jsonify(response), 200

#     except Exception as e:
#         print(e)
#         return jsonify({"error": "Internal server error", "message": str(e)}), 500




@app.route(API_URL + "/ledger-monthwise", methods=["GET"])
def get_ledger_monthwise():
    try:
        company_code = request.args.get('Company_Code')
        ac_code = request.args.get('Ac_code')
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')

        if not company_code or not ac_code or not from_date or not to_date:
            return jsonify({"error": "Missing required parameters: Company_Code, Ac_code, from_date, to_date"}), 400

        ac_code = int(ac_code)
        company_code = int(company_code)

        # Monthly aggregation
        month_query = text('''
            SELECT
                YEAR(DOC_DATE) AS yr,
                MONTH(DOC_DATE) AS mo,
                DATENAME(MONTH, DOC_DATE) + ' ' + CAST(YEAR(DOC_DATE) AS varchar) AS month_label,
                SUM(CASE WHEN DRCR = 'D' THEN AMOUNT ELSE 0 END) AS total_debit,
                SUM(CASE WHEN DRCR = 'C' THEN AMOUNT ELSE 0 END) AS total_credit
            FROM dbo.nt_1_gledger
            WHERE COMPANY_CODE = :company_code
                AND AC_CODE = :ac_code
                AND DOC_DATE BETWEEN :from_date AND :to_date
            GROUP BY YEAR(DOC_DATE), MONTH(DOC_DATE), DATENAME(MONTH, DOC_DATE)
            ORDER BY yr, mo
        ''')

        month_rows = db.session.execute(month_query, {
            "company_code": company_code,
            "ac_code": ac_code,
            "from_date": from_date,
            "to_date": to_date
        }).fetchall()

        months = []
        for row in month_rows:
            months.append({
                "yr": row.yr,
                "mo": row.mo,
                "month_label": row.month_label,
                "total_debit": float(row.total_debit or 0),
                "total_credit": float(row.total_credit or 0),
            })

        # Opening balance: sum of all transactions before from_date
        op_query = text('''
            SELECT SUM(CASE WHEN DRCR = 'D' THEN AMOUNT ELSE -AMOUNT END) AS OpBal
            FROM dbo.nt_1_gledger
            WHERE COMPANY_CODE = :company_code
                AND AC_CODE = :ac_code
                AND DOC_DATE < :from_date
        ''')

        op_row = db.session.execute(op_query, {
            "company_code": company_code,
            "ac_code": ac_code,
            "from_date": from_date
        }).fetchone()

        opening_balance = float(op_row.OpBal or 0) if op_row and op_row.OpBal is not None else 0.0

        # Account name
        ac_query = text('''
            SELECT TOP 1 Ac_Name_E FROM dbo.nt_1_accountmaster
            WHERE Ac_Code = :ac_code AND company_code = :company_code
        ''')
        ac_row = db.session.execute(ac_query, {"ac_code": ac_code, "company_code": company_code}).fetchone()
        ac_name = ac_row.Ac_Name_E if ac_row else ""

        return jsonify({
            "success": True,
            "ac_name": ac_name,
            "opening_balance": opening_balance,
            "months": months
        }), 200

    except Exception as e:
        print(traceback.format_exc())
        return jsonify({"error": "Internal server error", "message": str(e)}), 500








