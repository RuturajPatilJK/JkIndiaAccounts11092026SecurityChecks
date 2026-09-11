from pydoc import text
from flask import Flask, jsonify, request
from sqlalchemy import func, text
from app import app,db
from app.models.Utilities.fundmanegment.fundmanagmentModel import FundManagement
from datetime import timedelta

from datetime import datetime, timedelta
from sqlalchemy import text
import traceback
import os

API_URL = os.getenv('API_URL')

from datetime import timedelta
from sqlalchemy import text
from flask import jsonify
from app import app, db
from app.models.Utilities.fundmanegment.fundmanagmentModel import FundManagement

TASK_DETAILS_QUERY = '''
SELECT dbo.FundManagements.Funding_from, dbo.FundManagements.ff, FundingFrom.Ac_Name_E AS FundingFromName, dbo.FundManagements.Bill_to, dbo.FundManagements.bt, bill_to.Ac_Name_E AS bill_to_name, 
                  dbo.FundManagements.PurcBillTo, purches_bill_to.accoid, dbo.FundManagements.pt, purches_bill_to.Ac_Name_E AS purches_bill_to_name, dbo.FundManagements.GST_rate_code, dbo.nt_1_gstratemaster.GST_Name, 
                  dbo.FundManagements.gstid, DATEDIFF(DAY, DATEADD(DAY, dbo.FundManagements.Due_days, dbo.FundManagements.Riceipt_date), dbo.FundManagements.Actual_payment_date) AS PaymentDelayDays, 
                  RefNo.fundId AS fundIdCode
FROM     dbo.nt_1_accountmaster AS purches_bill_to INNER JOIN
                  dbo.FundManagements ON purches_bill_to.accoid = dbo.FundManagements.pt LEFT OUTER JOIN
                  dbo.nt_1_gstratemaster ON dbo.FundManagements.gstid = dbo.nt_1_gstratemaster.gstid LEFT OUTER JOIN
                  dbo.nt_1_accountmaster AS bill_to ON dbo.FundManagements.bt = bill_to.accoid LEFT OUTER JOIN
                  dbo.nt_1_accountmaster AS FundingFrom ON dbo.FundManagements.ff = FundingFrom.accoid FULL OUTER JOIN
                  dbo.FundManagements AS RefNo ON dbo.FundManagements.Company_code = RefNo.Company_code AND dbo.FundManagements.Ref_no = RefNo.Doc_no
WHERE  (dbo.FundManagements.fundId = :fundId)
'''





from datetime import datetime, timedelta

from datetime import timedelta
from flask import jsonify
from sqlalchemy import text

@app.route(API_URL + "/getAllfundata", methods=["GET"])
def getAllfundata():
    try:
        company_code = request.args.get('Company_Code')
        if company_code is None:
            return jsonify({"error": "Missing Required Field", "message": str(e)}), 400
        query = '''
            SELECT dbo.FundManagements.Doc_no, dbo.FundManagements.Doc_date, dbo.FundManagements.Due_days, dbo.FundManagements.Riceipt_date, dbo.FundManagements.Actual_payment_amount, 
                  dbo.FundManagements.Bill_rate, dbo.FundManagements.Quintal, dbo.FundManagements.Riceipt_amount, FundingFrom.Ac_Name_E AS FundingFromName, BillTo.Ac_Name_E AS billToName, dbo.FundManagements.Purchase_rate, 
                  dbo.FundManagements.Interest_rate, dbo.FundManagements.Interest_amount, dbo.nt_1_accountmaster.Ac_Name_E AS purchaseBillTo, dbo.FundManagements.Actual_payment_date, dbo.FundManagements.TDS_amount, 
                  dbo.FundManagements.GST_amount, dbo.FundManagements.GST_rate, dbo.FundManagements.Total_amount, dbo.FundManagements.GST_rate_code, dbo.FundManagements.TDS_rate
FROM     dbo.FundManagements LEFT OUTER JOIN
                  dbo.nt_1_accountmaster ON dbo.FundManagements.pt = dbo.nt_1_accountmaster.accoid LEFT OUTER JOIN
                  dbo.nt_1_accountmaster AS BillTo ON dbo.FundManagements.bt = BillTo.accoid LEFT OUTER JOIN
                  dbo.nt_1_accountmaster AS FundingFrom ON dbo.FundManagements.ff = FundingFrom.accoid
                  where dbo.FundManagements.Company_code =:company_code
ORDER BY dbo.FundManagements.Doc_no DESC
        '''

        result = db.session.execute(text(query),{'company_code':company_code})
        all_data = [dict(row._mapping) for row in result.fetchall()]

        for data in all_data:
            doc_date = data.get('Doc_date')
            riceipt_date = data.get('Riceipt_date')
            actual_payment_date = data.get('Actual_payment_date')
            due_days = data.get('Due_days') or 0

            # ✅ Format dates
            data['Doc_date'] = doc_date.strftime('%d/%m/%Y') if doc_date else None
            data['Riceipt_date'] = riceipt_date.strftime('%d/%m/%Y') if riceipt_date else None
            data['Actual_payment_date'] = actual_payment_date.strftime('%d/%m/%Y') if actual_payment_date else None

            # ✅ Calculate and format Due_date
            if riceipt_date:
                try:
                    # Re-fetch unformatted Riceipt_date to calculate due_date
                    due_date = riceipt_date + timedelta(days=int(due_days))
                    data['Due_days'] = due_date.strftime('%d/%m/%Y')
                except Exception:
                    data['Due_days'] = None
            else:
                data['Due_days'] = None

        return jsonify({"record_data": all_data})

    except Exception as e:
        print("Error:", e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


@app.route(API_URL + "/createnewfunds", methods=["POST"])
def createnewfunds():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Missing request data'}), 400

        # Get current max doc_no
        max_doc_no = db.session.query(func.max(FundManagement.Doc_no)).filter_by(Company_code=data['Company_code']).scalar() or 0
        new_doc_no = max_doc_no + 1
        data['Doc_no'] = new_doc_no
        data.pop("previousRefNo", None)

        # ✅ Convert date fields if they exist
       
        # for date_field in ['Doc_date', 'Riceipt_date']:
        #     if date_field in data and isinstance(data[date_field], str):
        #         try:
        #             data[date_field] = datetime.strptime(data[date_field], "%d/%m/%Y").date()
        #         except ValueError:
        #             return jsonify({'error': f'Invalid format for {date_field}. Use DD/MM/YYYY'}), 400

        # Create and save new fund
        new_fund = FundManagement(**data)
        db.session.add(new_fund)
        payment_adjustment_no = data.get("Payment_adjustment_no")
        company_code = data.get("Company_code")

        if payment_adjustment_no and company_code:
            adjustment_record = FundManagement.query.filter_by(
                Doc_no=payment_adjustment_no,
                Company_code=company_code
            ).first()

            if adjustment_record:
                adjustment_record.Ref_no = new_doc_no 
        db.session.commit()

        return jsonify({
            'message': 'New Fund record created successfully',
            'Doc_no': data['Doc_no']
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

    



@app.route(API_URL + "/update_fund_record", methods=["PUT"])
def update_fund_record():
    try:
        Doc_no = request.args.get('fundId')
        if not Doc_no:
            return jsonify({'error': 'Missing doc_no parameter'}), 400

        data = request.json
        if not data:
            return jsonify({'error': 'Missing request data'}), 400

        record = FundManagement.query.filter_by(fundId=Doc_no).first()
        if not record:
            return jsonify({'error': 'Record not found'}), 404

        # from datetime import datetime

        # # Handle date fields
        # for date_field in ['Doc_date', 'Riceipt_date',"Actual_payment_date"]:
        #     if date_field in data and isinstance(data[date_field], str):
        #         try:
        #             # Convert string to date object
        #             data[date_field] = datetime.strptime(data[date_field], "%d/%m/%Y").date()
        #         except ValueError:
        #             return jsonify({'error': f'Invalid format for {date_field}. Use DD/MM/YYYY'}), 400

        # Update fields
        previous_ref = data.get("previousRefNo")

        data.pop("previousRefNo", None)

        print("+++",previous_ref)
        for key, value in data.items():
            setattr(record, key, value)

        payment_adjustment_no = data.get("Payment_adjustment_no")
        if payment_adjustment_no:
            adjustment_record = FundManagement.query.filter_by(Doc_no=payment_adjustment_no,Company_code=data['Company_code']).first()
            if adjustment_record:
                adjustment_record.Ref_no = data['Doc_no']

        if previous_ref and previous_ref != payment_adjustment_no:
            old_adjustment = FundManagement.query.filter_by(
                Doc_no=previous_ref,
                Company_code=data['Company_code']
            ).first()
            if old_adjustment:
                old_adjustment.Ref_no = 0

        db.session.commit()
        return jsonify({'message': 'Fund record updated successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500



@app.route(API_URL+"/delete_fund_records", methods=["DELETE"])
def delete_fund_records():
    try:
        doc_no = request.args.get('Doc_no')
        if not doc_no:
            return jsonify({'error': 'Missing Doc_no parameter'}), 400
        
        record = FundManagement.query.filter_by(Doc_no=doc_no).first()
        if not record:
            return jsonify({'error': 'Record not found'}), 404
        
        db.session.delete(record)
        db.session.commit()

        return jsonify({'message': ' fund record deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500





@app.route(API_URL+"/getLastFundNO", methods=["GET"])
def getLastFundNO():
    try:
        company_code= request.args.get("company_code")
        if company_code is None:
            return jsonify({'error': 'Missing Required Fileds'}), 400
        last_Record = FundManagement.query.order_by(FundManagement.Doc_no.desc()).filter_by(Company_code=company_code).first()

        if last_Record is None:
            return jsonify({'error': 'No record found'}), 404
        
        # Serialize the record
        last_Record_data = {
            column.key: getattr(last_Record, column.key)
            for column in last_Record.__table__.columns
        }

        # Format the date
        if 'Doc_date' in last_Record_data and last_Record_data['Doc_date']:
            last_Record_data['Doc_date'] = last_Record_data['Doc_date'].strftime('%d/%m/%Y')

        return jsonify(last_Record_data), 200

    except Exception as e:
        print(e)
        import traceback
        print(traceback.format_exc())
        return jsonify({'error': 'Internal server error'}), 500



@app.route(API_URL + "/getLastFundData", methods=["GET"])
def getLastFundData():
    try:
        Company_code=request.args.get("company_code")
        if Company_code is None:
           return jsonify({'error': 'Missing Required Fileds'}), 400
        
        last_Record = FundManagement.query.order_by(FundManagement.Doc_no.desc()).filter_by(Company_code=Company_code).first()

        if last_Record is None:
            return jsonify({'error': 'No group found for the provided Company_Code'}), 404
        
        newFundId = last_Record.fundId
        print(newFundId)
        
    
        # Fetch detail rows
        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"fundId": newFundId})
        additional_data_rows = additional_data.fetchall()
        last_details_data = [dict(row._mapping) for row in additional_data_rows]

        # Serialize the main record
        last_Record_data = {
            column.key: getattr(last_Record, column.key)
            for column in last_Record.__table__.columns
        }

        # ✅ Format date fields
        for date_field in ['Doc_date', 'Riceipt_date','Actual_payment_date']:
            if last_Record_data.get(date_field):
                last_Record_data[date_field] = last_Record_data[date_field].strftime('%Y-%m-%d')

        # Final response
        response = {
            "data": last_Record_data,
            "label": last_details_data
        }

        return jsonify(response)

    except Exception as e:
        print(e)
        print(traceback.format_exc())
        return jsonify({'error': 'internal server error'}), 500


# this is ffor frist button

@app.route(API_URL + "/get_first_fund", methods=["GET"])
def get_first_fund():
    try:
        company_code= request.args.get("company_code")
        if company_code is None:
          return jsonify({'error': 'Missing Required Fileds'}), 400
        first_user_creation = FundManagement.query.order_by(FundManagement.Doc_no.asc()).filter_by(Company_code=company_code).first()

        if not first_user_creation:
            return jsonify({'error': 'No records found'}), 404

        # Extract fundId
        newFundId = first_user_creation.fundId
        print("fundId:", newFundId)

        # Get additional detail data
        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"fundId": newFundId})
        additional_data_rows = additional_data.fetchall()
        last_details_data = [dict(row._mapping) for row in additional_data_rows]

        # Serialize main record
        last_record_data = {
            column.key: getattr(first_user_creation, column.key)
            for column in first_user_creation.__table__.columns
        }

        # ✅ Format date fields (doc_date, payment_date)
        for date_field in ['Doc_date', 'Riceipt_date','Actual_payment_date']:
            if last_record_data.get(date_field):
                last_record_data[date_field] = last_record_data[date_field].strftime('%Y-%m-%d')

        # Construct response
        response = {
            "data": last_record_data,
            "lable": last_details_data
        }

        return jsonify(response)

    except Exception as e:
        print("Error in get_first_fund:", e)
        return jsonify({'error': 'Internal server error'}), 500


# this is for privious button



@app.route(API_URL+"/get_previous_funds", methods=["GET"])
def get_previous_funds():
    try:
        company_code= request.args.get("company_code")
        if company_code is None:
            return jsonify({'error': 'Missing Required Fileds'}), 400
        selected_doc_no = request.args.get('Doc_no', type=int)

        if selected_doc_no is None:
            return jsonify({'error': 'doc_no parameter is required'}), 400

        # Get the record just before the given doc_no
        previous_record = FundManagement.query \
            .filter(FundManagement.Doc_no < selected_doc_no) \
            .order_by(FundManagement.Doc_no.desc()) \
            .filter_by(Company_code=company_code)\
            .first()

        if not previous_record:
            return jsonify({'error': 'No previous record found'}), 404

        # Get fundId from the record
        fund_id = previous_record.fundId
        print(fund_id)

        # Get additional details using the fundId
        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"fundId": fund_id})
        additional_data_rows = additional_data.fetchall()
        last_details_data = [dict(row._mapping) for row in additional_data_rows]

        # Serialize the main record
        last_record_data = {
            column.key: getattr(previous_record, column.key)
            for column in previous_record.__table__.columns
        }

        # Format doc_date if it exists
        for date_field in ['Doc_date', 'Riceipt_date','Actual_payment_date']:
            if last_record_data.get(date_field):
                last_record_data[date_field] = last_record_data[date_field].strftime('%Y-%m-%d')

        response = {
            "data": last_record_data,
            "lable": last_details_data
        }

        return jsonify(response)

    except Exception as e:
        print(e)
        return jsonify({'error': 'Internal server error'}), 500





@app.route(API_URL + "/get_next_fund", methods=["GET"])
def get_next_fund():
    try:
        company_code= request.args.get("company_code")
        if company_code is None:
            return jsonify({'error': 'Missing Required Fileds'}), 400
        selected_doc_no = request.args.get('Doc_no', type=int)

        if selected_doc_no is None:
            return jsonify({'error': 'doc_no parameter is required'}), 400
        

        # Get the next record (with doc_no greater than selected)
        next_record = FundManagement.query \
            .filter(FundManagement.Doc_no > selected_doc_no) \
            .order_by(FundManagement.Doc_no.asc()) \
            .filter_by(Company_code=company_code) \
            .first()

        if not next_record:
            return jsonify({'error': 'No next record found'}), 404

        # Extract fundId
        fund_id = next_record.fundId
        print("Doc_no:", fund_id)

        # Get additional data from related query
        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"fundId": fund_id})
        additional_data_rows = additional_data.fetchall()
        last_details_data = [dict(row._mapping) for row in additional_data_rows]

        # Serialize main record
        last_record_data = {
            column.key: getattr(next_record, column.key)
            for column in next_record.__table__.columns
        }

        # ✅ Format date fields safely
        for date_field in ['Doc_date', 'Riceipt_date','Actual_payment_date']:
            if last_record_data.get(date_field):
                last_record_data[date_field] = last_record_data[date_field].strftime('%Y-%m-%d')

        # Construct final response
        response = {
            "data": last_record_data,
            "lable": last_details_data
        }

        return jsonify(response)

    except Exception as e:
        print("Error in get_next_fund:", e)
        return jsonify({'error': 'Internal server error'}), 500






@app.route(API_URL + "/get_funds_Selected_Record", methods=["GET"])
def get_funds_Selected_Record():
    try:
        company_code= request.args.get('company_code')
        if company_code is None:
            return jsonify({'error': 'Missing Required Fileds'}), 400
        selected_code = request.args.get('Doc_no')

        if selected_code is None:
            return jsonify({'error': 'Missing doc_no'}), 400

        try:
            selected_doc_no = int(selected_code)
        except ValueError:
            return jsonify({'error': 'Invalid doc_no'}), 400

        # Fetch the selected record
        record = FundManagement.query.filter_by(Doc_no=selected_doc_no).filter_by(Company_code=company_code).first()

        if record is None:
            return jsonify({'error': 'Selected record not found'}), 404

        # Serialize the head data
        head_data = {
            column.key: getattr(record, column.key)
            for column in record.__table__.columns
        }

        # ✅ Format doc_date and payment_date (if they exist)
        for date_field in ['Doc_date', 'Riceipt_date','Actual_payment_date']:
            if head_data.get(date_field):
                head_data[date_field] = head_data[date_field].strftime('%Y-%m-%d')

        # Fetch fundId and related detail data
        fund_id = record.fundId
        print(f"Fund ID: {fund_id}")

        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"fundId": fund_id})
        additional_data_rows = additional_data.fetchall()
        detail_data = [dict(row._mapping) for row in additional_data_rows]

        # Final response structure
        response = {
            "data": head_data,
            "lable": detail_data
        }

        return jsonify(response)

    except Exception as e:
        print(e)
        return jsonify({'error': 'Internal server error'}), 500



@app.route(API_URL + '/check_fund_usage', methods=['GET'])
def check_fund_usage():
    try:
        Doc_no = request.args.get('Doc_no')
        company_code = request.args.get('Company_Code')
        

        fund = FundManagement.query.filter_by(
            Ref_no=Doc_no,
            Company_code=company_code,
           
        ).first()

        if fund:
            return jsonify({'isUsed': True, 'FundNo': fund.Doc_no})

        
        else:
            return jsonify({'isUsed': False})

       
        
        
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({
            "error": "Internal server error",
            "message": str(e)
        }), 500





