from flask import Flask, jsonify, request
from app import app, db
from app.models.Transactions.UTR.UTREntryModels import UTRHead, UTRDetail
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import func
from app.utils.CommonGLedgerFunctions import fetch_company_parameters, get_accoid, create_gledger_entry,send_gledger_entries,get_ac_Name
import os
import requests
import traceback
from app.utils.CommonCompanyLogs.CompanyLogsUtils import create_company_log_entry

API_URL_SERVER = os.getenv('API_URL_SERVER')

# Get the base URL from environment variables
API_URL = os.getenv('API_URL')

# Import schemas from the schemas module
from app.models.Transactions.UTR.UTREntrySchema import UTRHeadSchema, UTRDetailSchema

# Global SQL Query
UTR_DETAILS_QUERY = '''
    SELECT Bank.Ac_Name_E AS bankAcName, Mill.Ac_Name_E AS millName,dbo.nt_1_utr.doc_no, dbo.nt_1_utr.utrid
    FROM dbo.nt_1_utr
    LEFT OUTER JOIN dbo.nt_1_accountmaster AS Mill ON dbo.nt_1_utr.mill_code = Mill.Ac_Code AND dbo.nt_1_utr.mc = Mill.accoid AND dbo.nt_1_utr.Company_Code = Mill.company_code
    LEFT OUTER JOIN dbo.nt_1_accountmaster AS Bank ON dbo.nt_1_utr.bank_ac = Bank.Ac_Code AND dbo.nt_1_utr.ba = Bank.accoid AND dbo.nt_1_utr.Company_Code = Bank.company_code
    LEFT OUTER JOIN dbo.nt_1_utrdetail ON dbo.nt_1_utr.utrid = dbo.nt_1_utrdetail.utrid
    WHERE dbo.nt_1_utr.utrid = :utrid
'''

# Define schemas
utr_head_schema = UTRHeadSchema()
utr_head_schemas = UTRHeadSchema(many=True)

utr_detail_schema = UTRDetailSchema()
utr_detail_schemas = UTRDetailSchema(many=True)

def format_dates(task):
    return {
        "doc_date": task.doc_date.strftime('%Y-%m-%d') if task.doc_date else None,
    }

#Add GLedger Enteries
trans_typeNew  = "UI"
ac_code=0
ordercode=0
new_doc_no=0
narration=''

def add_gledger_entry(entries,data, amount, drcr, ac_code, accoid, ac_code2, ordercode, narration, drcr_head=0,ca_narration=None):
    entry = create_gledger_entry(data, amount, drcr, ac_code, accoid, ordercode, trans_typeNew, new_doc_no, narration)
    entry['DRCR_HEAD'] = drcr_head
    entry['CA_NARRATION'] = ca_narration
    entries.append(entry)

#Create GLedger Enteries
def create_gledger_entries(headData, detailData, doc_no):
    gledger_entries = []
    ordercode = 0
    narration = str(headData.get('doc_no', '')) + ' ' + str(headData.get('narration_header', '')) + ' ' + str(headData.get('utr_no', ''))

    amount = float(headData.get('amount', 0) or 0)
           
    bankAcCode = headData.get('bank_ac')
    millCode = headData.get('mill_code')
    bankAcName = get_ac_Name(bankAcCode, headData['Company_Code'])
    millName = get_ac_Name(millCode, headData['Company_Code'])
    narrationForBank = f"To {millName}"
    narrationForParty = f"{bankAcName}"

    if amount>0:
        ordercode += 1
        accoid = get_accoid(bankAcCode,headData['Company_Code'])
        add_gledger_entry(gledger_entries,headData, amount, "C", bankAcCode, accoid , millCode, ordercode, str(millName) + ' # ' + str(narration),0,narrationForBank)

        ordercode += 1
        accoid = get_accoid(millCode,headData['Company_Code'])
        add_gledger_entry(gledger_entries,headData, amount, "D", millCode, accoid , bankAcCode, ordercode, str(bankAcName) + ' # ' + str(narration), bankAcCode,narrationForParty)

    return gledger_entries

# Get data from both tables UTRHead and UTRDetail
@app.route(API_URL + "/getdata-utr", methods=["GET"])
def getdata_utr():
    try:
        Company_Code = request.args.get('Company_Code')
        # Year_Code = request.args.get('Year_Code')
        if not all([Company_Code]):
            return jsonify({"error": "Missing required parameters"}), 400

        records = UTRHead.query.filter_by(Company_Code=Company_Code).all()

        if not records:
            return jsonify({"error": "No records found"}), 404

        query = ('''SELECT        bankAc.Ac_Name_E AS millName, mill.Ac_Name_E AS bankAcName, dbo.nt_1_utr.doc_no, dbo.nt_1_utr.doc_date, dbo.nt_1_utr.amount, dbo.nt_1_utr.utr_no, dbo.nt_1_utr.narration_header, dbo.nt_1_utr.narration_footer, 
                         dbo.nt_1_utr.utrid
FROM            dbo.nt_1_utr LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS mill ON dbo.nt_1_utr.mc = mill.accoid LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS bankAc ON dbo.nt_1_utr.ba = bankAc.accoid
WHERE 
            dbo.nt_1_utr.Company_Code = :company_code 
order by dbo.nt_1_utr.doc_no desc
                                 '''
            )
        additional_data = db.session.execute(text(query), {"company_code": Company_Code})

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

# Get data by the particular doc_no
@app.route(API_URL + "/getutrByid", methods=["GET"])
def getutrByid():
    try:
        doc_no = request.args.get('doc_no')
        company_code = request.args.get('Company_Code')
        # Year_Code = request.args.get('Year_Code')
        if not all([doc_no, company_code]):
            return jsonify({"error": "Document number, Company Code, or Year Code not provided"}), 400

        utr_head = UTRHead.query.filter_by(doc_no=doc_no, Company_Code=company_code).first()
        if not utr_head:
            return jsonify({"error": "No records found"}), 404

        utr_id = utr_head.utrid
        additional_data = db.session.execute(text(UTR_DETAILS_QUERY), {"utrid": utr_id})
        additional_data_row = additional_data.fetchone()

        label = dict(additional_data_row._mapping) if additional_data_row else {}

        response = {
            "utr_head": {
                **{column.name: getattr(utr_head, column.name) for column in utr_head.__table__.columns},
                **format_dates(utr_head)
            },
            "labels": label,
            "utr_details": [{column.name: getattr(detail, column.name) for column in detail.__table__.columns} for detail in UTRDetail.query.filter_by(utrid=utr_id).all()]
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# Insert record for UTRHead and UTRDetail
@app.route(API_URL + "/insert-utr", methods=["POST"])
def insert_utr():
    try:
        data = request.get_json()
        head_data = data['head_data']
        detail_data = data['detail_data']
        max_doc_no = db.session.query(func.max(UTRHead.doc_no)).scalar() or 0

        new_doc_no = max_doc_no + 1
        head_data['doc_no'] = new_doc_no 
        
        new_head = UTRHead(**head_data)
        db.session.add(new_head)

        createdDetails = []
        updatedDetails = []
        deletedDetailIds = []

        for item in detail_data:
            item['doc_no'] = new_doc_no
            item['utrid'] = new_head.utrid

            if 'rowaction' in item:
                if item['rowaction'] == "add":
                    del item['rowaction']
                    
                    new_detail = UTRDetail(**item)
                    new_head.details.append(new_detail)
                    createdDetails.append(new_detail)
                    
                elif item['rowaction'] == "update":
                    utrdetailid = item['utrdetailid']
                    update_values = {k: v for k, v in item.items() if k not in ('utrdetailid', 'rowaction', 'utrid')}
                    db.session.query(UTRDetail).filter(UTRDetail.utrdetailid == utrdetailid).update(update_values)
                    updatedDetails.append(utrdetailid)

                elif item['rowaction'] == "delete":
                    utrdetailid = item['utrdetailid']
                    detail_to_delete = db.session.query(UTRDetail).filter(UTRDetail.utrdetailid == utrdetailid).one_or_none()
                    if detail_to_delete:
                        db.session.delete(detail_to_delete)
                        deletedDetailIds.append(utrdetailid)

            db.session.commit()

        gledger_entries = create_gledger_entries(head_data, detail_data, new_doc_no)

        response = send_gledger_entries(head_data, gledger_entries,trans_typeNew)

        if response.status_code == 201:
            db.session.commit()
        else:
            db.session.rollback()
            return jsonify({"error": "Failed to create gLedger record", "details": response.json()}), response.status_code

        utr_head_schema = UTRHeadSchema()
        utr_detail_schema = UTRDetailSchema(many=True)
            
        return jsonify({
            "message": "Data Inserted successfully",
            "head": utr_head_schema.dump(new_head),
            "addedDetails": utr_detail_schema.dump(createdDetails),
            "updatedDetails": updatedDetails,
            "deletedDetailIds": deletedDetailIds
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# Update record for UTRHead and UTRDetail
# @app.route(API_URL + "/update-utr", methods=["PUT"])
# def update_utr():
#     try:
#         utrid = request.args.get('utrid')
        
#         if not utrid:
#             return jsonify({"error": "Missing 'utrid' parameter"}), 400

#         data = request.get_json()
       
#         head_data = data['head_data']
#         detail_data = data['detail_data']

#         updatedHeadCount=db.session.query(UTRHead).filter(UTRHead.utrid == utrid).update(head_data)
#         updated_head = UTRHead.query.filter_by(utrid=utrid).first()
#         updated_head_doc_no = updated_head.doc_no
#         created_details = []
#         updated_details = []
#         deleted_detail_ids = []

#         for item in detail_data:
#             item['utrid'] = updated_head.utrid

#             if 'rowaction' in item:
#                 if item['rowaction'] == "add":
#                     del item['rowaction']
#                     item['doc_no'] = updated_head_doc_no
#                     new_detail = UTRDetail(**item)
#                     db.session.add(new_detail)
#                     created_details.append(new_detail)

#                 elif item['rowaction'] == "update":
#                     utrdetailid = item['utrdetailid']
#                     update_values = {k: v for k, v in item.items() if k not in ('utrdetailid', 'rowaction', 'utrid')}
#                     db.session.query(UTRDetail).filter(UTRDetail.utrdetailid == utrdetailid).update(update_values)
#                     updated_details.append(utrdetailid)

#                 elif item['rowaction'] == "delete":
#                     utrdetailid = item['utrdetailid']
#                     detail_to_delete = db.session.query(UTRDetail).filter(UTRDetail.utrdetailid == utrdetailid).one_or_none()
#                     if detail_to_delete:
#                         db.session.delete(detail_to_delete)
#                         deleted_detail_ids.append(utrdetailid)

#         db.session.commit()

#         gledger_entries = create_gledger_entries(head_data, detail_data, updated_head_doc_no)

#         response = send_gledger_entries(head_data, gledger_entries,trans_typeNew)

#         if response.status_code == 201:
#             db.session.commit()
#         else:
#             db.session.rollback()
#             return jsonify({"error": "Failed to create gLedger record", "details": response.json()}), response.status_code

#         return jsonify({
#             "message": "Data updated successfully",
#             "head": updatedHeadCount,
#             "created_details": utr_detail_schemas.dump(created_details),
#             "updated_details": updated_details,
#             "deleted_detail_ids": deleted_detail_ids
#         }), 200

#     except Exception as e:
#         db.session.rollback()
#         return jsonify({"error": "Internal server error", "message": str(e)}), 500


@app.route(API_URL + "/update-utr", methods=["PUT"])
def update_utr():
    try:
        utrid = request.args.get('utrid')
        if not utrid:
            return jsonify({"error": "Missing 'utrid' parameter"}), 400

        data = request.get_json()
        head_data = data.get('head_data')
        detail_data = data.get('detail_data', [])

        company_code = head_data.get('Company_Code')
        year_code = head_data.get('Year_Code')
        user_id = head_data.get('User_Id', 0)
        tran_type = "UI" 

        if not head_data:
            return jsonify({"error": "Missing head_data"}), 400
        
        if 'User_Id' in head_data:
            del head_data['User_Id']

        existing_head = UTRHead.query.filter_by(utrid=utrid).first()

        if not existing_head:
            return jsonify({"error": "UTRHead with the given utrid not found"}), 404
        
        #  doc_date_changed = str(existing_head.doc_date) != str(head_data.get('doc_date', existing_head.doc_date))     ------------- refer this for the doc_date chnaged

        doc_date = existing_head.doc_date
        mill_code_changed = existing_head.mill_code != head_data.get('mill_code', existing_head.mill_code)
        bank_ac_changed = existing_head.bank_ac != head_data.get('bank_ac', existing_head.bank_ac)
        narration_header = existing_head.narration_header != head_data.get('narration_header', existing_head.narration_header)
        # doc_date_changed = existing_head.doc_date != head_data.get('doc_date', existing_head.doc_date)

        updated_head_count = db.session.query(UTRHead).filter(UTRHead.utrid == utrid).update(head_data)
        updated_head = UTRHead.query.filter_by(utrid=utrid).first()
        updated_head_doc_no = updated_head.doc_no

        created_details = []
        updated_details = []
        deleted_detail_ids = []
        

        for item in detail_data:
            item['utrid'] = updated_head.utrid
            rowaction = item.get('rowaction')

            if rowaction == "add":
                item.pop('rowaction', None)
                item['doc_no'] = updated_head_doc_no
                new_detail = UTRDetail(**item)
                db.session.add(new_detail)
                created_details.append(new_detail)

            elif rowaction == "update":
                utrdetailid = item.get('utrdetailid')
                update_values = {k: v for k, v in item.items() if k not in ('utrdetailid', 'rowaction', 'utrid')}
                db.session.query(UTRDetail).filter(UTRDetail.utrdetailid == utrdetailid).update(update_values)
                updated_details.append(utrdetailid)

            elif rowaction == "delete":
                utrdetailid = item.get('utrdetailid')
                detail_to_delete = db.session.query(UTRDetail).filter_by(utrdetailid=utrdetailid).first()
                if detail_to_delete:
                    db.session.delete(detail_to_delete)
                    deleted_detail_ids.append(utrdetailid)

        # if existing_head and updated_head_count > 0 and (mill_code_changed or bank_ac_changed or doc_date_changed):
        if existing_head and updated_head_count > 0 and (mill_code_changed or bank_ac_changed or narration_header):
            create_company_log_entry(
                db=db,
                ac_code=existing_head.mill_code,
                value=existing_head.amount,
                doc_no=existing_head.doc_no,
                doc_date=doc_date,
                # updated_doc_date=head_data.get("doc_date"),
                company_code=company_code,
                year_code=year_code,
                record_type='O',
                record_no=utrid,
                user_id=user_id,
                tran_type=tran_type,
                bank_ac=existing_head.bank_ac,
                created_by=head_data.get('Created_By'),
                modified_by=head_data.get('Modified_By'),
                narration=existing_head.narration_header
            )

            create_company_log_entry(
                db=db,
                ac_code=head_data.get("mill_code"),
                value=head_data.get("amount"),
                doc_no=updated_head_doc_no,
                doc_date=doc_date,
                # updated_doc_date=head_data.get("doc_date"),
                company_code=company_code,
                year_code=year_code,
                record_type='N',
                record_no=utrid,
                user_id=user_id,
                tran_type=tran_type,
                bank_ac=head_data.get("bank_ac"),
                created_by=head_data.get('Created_By'),
                modified_by=head_data.get('Modified_By'),
                narration=head_data.get('narration_header')
            )

        db.session.commit()

        gledger_entries = create_gledger_entries(head_data, detail_data, updated_head_doc_no)
        response = send_gledger_entries(head_data, gledger_entries, tran_type)

        if response.status_code != 201:
            db.session.rollback()
            return jsonify({"error": "Failed to create gLedger record", "details": response.json()}), response.status_code

        return jsonify({
            "message": "Data updated successfully",
            "head": updated_head_count,
            "created_details": utr_detail_schemas.dump(created_details),
            "updated_details": updated_details,
            "deleted_detail_ids": deleted_detail_ids
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# Delete record from database based on utrid
# @app.route(API_URL + "/delete_data_by_utrid", methods=["DELETE"])
# def delete_data_by_utrid():
#     try:
#         utrid = request.args.get('utrid')
#         Company_Code = request.args.get('Company_Code')
#         doc_no = request.args.get('doc_no')
#         Year_Code = request.args.get('Year_Code')
#         if not all([utrid, Company_Code, doc_no]):
#             return jsonify({"error": "Missing required parameters"}), 400

#         with db.session.begin():
#             deleted_detail_rows = UTRDetail.query.filter_by(utrid=utrid,Company_Code=Company_Code,doc_no=doc_no).delete()

#             deleted_head_rows = UTRHead.query.filter_by(utrid=utrid,Company_Code=Company_Code,doc_no=doc_no).delete()

#             if deleted_detail_rows > 0 and deleted_head_rows > 0:
#                 query_params = {
#                     'Company_Code': Company_Code,
#                     'DOC_NO': doc_no,
#                     'Year_Code': Year_Code,
#                     'TRAN_TYPE': 'UI',  
#             }
#             response = requests.delete(API_URL_SERVER+"/delete-Record-gLedger", params=query_params)
            
#             if response.status_code != 200:
#                 raise Exception("Failed to create record in gLedger")

#         # Commit the transaction
#         db.session.commit()

#         return jsonify({
#             "message": f"Deleted {deleted_head_rows} head row(s) and {deleted_detail_rows} detail row(s) successfully"
#         }), 200

#     except Exception as e:
#         db.session.rollback()
#         return jsonify({"error": "Internal server error", "message": str(e)}), 500


#Delete record from database based on utrid After adding company logs
@app.route(API_URL + "/delete_data_by_utrid", methods=["DELETE"])
def delete_data_by_utrid():
    try:
        utrid = request.args.get('utrid')
        Company_Code = request.args.get('Company_Code')
        doc_no = request.args.get('doc_no')
        Year_Code = request.args.get('Year_Code')
        User_Id = request.args.get('User_Id',0)

        if not all([utrid, Company_Code, doc_no,User_Id]):
            return jsonify({"error": "Missing required parameters"}), 400

        deleted_head = UTRHead.query.filter_by(utrid=utrid, Company_Code=Company_Code, doc_no=doc_no).first()

        if deleted_head:
            deleted_detail_rows = UTRDetail.query.filter_by(utrid=utrid, Company_Code=Company_Code, doc_no=doc_no).delete()
            deleted_head_rows = UTRHead.query.filter_by(utrid=utrid, Company_Code=Company_Code, doc_no=doc_no).delete()

            create_company_log_entry(
                db=db,
                ac_code=deleted_head.mill_code,
                value=deleted_head.amount,
                doc_no=deleted_head.doc_no,
                doc_date=deleted_head.doc_date,
                company_code=Company_Code,
                year_code=Year_Code,
                record_type='D', 
                record_no=utrid,
                user_id=User_Id, 
                tran_type='UI', 
                bank_ac=deleted_head.bank_ac,
                created_by=deleted_head.Created_By,
                modified_by=deleted_head.Modified_By
            )

            if deleted_detail_rows > 0 and deleted_head_rows > 0:
                query_params = {
                    'Company_Code': Company_Code,
                    'DOC_NO': doc_no,
                    'Year_Code': Year_Code,
                    'TRAN_TYPE': 'UI',
                }
                response = requests.delete(API_URL_SERVER + "/delete-Record-gLedger", params=query_params, cookies=request.cookies, headers={'X-CSRF-TOKEN': request.cookies.get('csrf_access_token', '')})

                if response.status_code != 200:
                    raise Exception("Failed to delete record in gLedger")

        db.session.commit()

        return jsonify({
            "message": f"Deleted {deleted_head_rows} head row(s) and {deleted_detail_rows} detail row(s) successfully"
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


# Fetch the last record from the database by utrid
@app.route(API_URL + "/get-lastutrdata", methods=["GET"])
def get_lastutrdata():
    try:
        Company_Code = request.args.get('Company_Code')
        if not all([Company_Code]):
            return jsonify({"error": "Missing required parameters"}), 400

        last_utr_head = UTRHead.query.order_by(UTRHead.doc_no.desc()).filter_by(Company_Code=Company_Code).first()
        if not last_utr_head:
            return jsonify({"error": "No records found in UTRHead table"}), 404

        utrid = last_utr_head.utrid
        additional_data = db.session.execute(text(UTR_DETAILS_QUERY), {"utrid": utrid})
        additional_data_row = additional_data.fetchone()

        label = dict(additional_data_row._mapping) if additional_data_row else {}

        last_head_data = {
            **{column.name: getattr(last_utr_head, column.name) for column in last_utr_head.__table__.columns},
            **format_dates(last_utr_head)
        }

        last_details_data = [{column.name: getattr(detail, column.name) for column in detail.__table__.columns} for detail in UTRDetail.query.filter_by(utrid=utrid).all()]

        response = {
            "last_head_data": last_head_data,
            "labels": label,
            "last_details_data": last_details_data
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# Get first record from the database
@app.route(API_URL + "/get-firstutr-navigation", methods=["GET"])
def get_firstutr_navigation():
    try:
        Company_Code = request.args.get('Company_Code')
        if not all([Company_Code]):
            return jsonify({"error": "Missing required parameters"}), 400

        first_utr_head = UTRHead.query.order_by(UTRHead.doc_no.asc()).filter_by(Company_Code=Company_Code).first()
        if not first_utr_head:
            return jsonify({"error": "No records found in UTRHead table"}), 404

        utrid = first_utr_head.utrid
        additional_data = db.session.execute(text(UTR_DETAILS_QUERY), {"utrid": utrid})
        additional_data_row = additional_data.fetchone()

        label = dict(additional_data_row._mapping) if additional_data_row else {}

        first_head_data = {
            **{column.name: getattr(first_utr_head, column.name) for column in first_utr_head.__table__.columns},
            **format_dates(first_utr_head)
        }

        first_details_data = [{column.name: getattr(detail, column.name) for column in detail.__table__.columns} for detail in UTRDetail.query.filter_by(utrid=utrid).all()]

        response = {
            "first_head_data": first_head_data,
            "labels": label,
            "first_details_data": first_details_data
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# Get previous record from the database
@app.route(API_URL + "/get-previousutr-navigation", methods=["GET"])
def get_previousutr_navigation():
    try:
        current_doc_no = request.args.get('currentDocNo')
        Company_Code = request.args.get('Company_Code')
        if not all([Company_Code,current_doc_no]):
            return jsonify({"error": "Missing required parameters"}), 400

        previous_utr_head = UTRHead.query.filter(UTRHead.doc_no < current_doc_no).filter_by(Company_Code=Company_Code).order_by(UTRHead.doc_no.desc()).first()
        if not previous_utr_head:
            return jsonify({"error": "No previous records found"}), 404

        utrid = previous_utr_head.utrid
        additional_data = db.session.execute(text(UTR_DETAILS_QUERY), {"utrid": utrid})
        additional_data_row = additional_data.fetchone()

        label = dict(additional_data_row._mapping) if additional_data_row else {}

        previous_head_data = {
            **{column.name: getattr(previous_utr_head, column.name) for column in previous_utr_head.__table__.columns},
            **format_dates(previous_utr_head)
        }

        previous_details_data = [{column.name: getattr(detail, column.name) for column in detail.__table__.columns} for detail in UTRDetail.query.filter_by(utrid=utrid).all()]

        response = {
            "previous_head_data": previous_head_data,
            "labels": label,
            "previous_details_data": previous_details_data
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# Get next record from the database
@app.route(API_URL + "/get-nextutr-navigation", methods=["GET"])
def get_nextutr_navigation():
    try:
        current_doc_no = request.args.get('currentDocNo')
        Company_Code = request.args.get('Company_Code')
        if not all([Company_Code,current_doc_no]):
            return jsonify({"error": "Missing required parameters"}), 400

        next_utr_head = UTRHead.query.filter(UTRHead.doc_no > current_doc_no).filter_by(Company_Code=Company_Code).order_by(UTRHead.doc_no.asc()).first()
        if not next_utr_head:
            return jsonify({"error": "No next records found"}), 404

        utrid = next_utr_head.utrid
        additional_data = db.session.execute(text(UTR_DETAILS_QUERY), {"utrid": utrid})
        additional_data_row = additional_data.fetchone()

        label = dict(additional_data_row._mapping) if additional_data_row else {}

        next_head_data = {
            **{column.name: getattr(next_utr_head, column.name) for column in next_utr_head.__table__.columns},
            **format_dates(next_utr_head)
        }

        next_details_data = [{column.name: getattr(detail, column.name) for column in detail.__table__.columns} for detail in UTRDetail.query.filter_by(utrid=utrid).all()]

        response = {
            "next_head_data": next_head_data,
            "labels": label,
            "next_details_data": next_details_data
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

#UTR Report
# @app.route(API_URL+"/getUTRReport", methods=["GET"])
# def getUTRReport():
#     try:
#         company_code = request.args.get('Company_Code')
#         doc_no = request.args.get('doc_no')

#         if not company_code or not doc_no:
#             return jsonify({"error": "Missing 'Company_Code' or 'Year_Code' parameter"}), 400

#         query = ('''SELECT        dbo.nt_1_utr.doc_no, dbo.nt_1_utr.doc_date, mill.Ac_Name_E, mill.Address_E, mill.Pincode, dbo.nt_1_utr.mill_code, dbo.nt_1_citymaster.city_name_e, dbo.nt_1_citymaster.state, dbo.nt_1_utr.amount, dbo.nt_1_utr.utr_no,mill.Email_Id as millemailid, mill.whatsup_no as BillToWpNo
# FROM            dbo.nt_1_citymaster LEFT OUTER JOIN
#                          dbo.nt_1_accountmaster AS mill ON dbo.nt_1_citymaster.cityid = mill.cityid RIGHT OUTER JOIN
#                          dbo.nt_1_utr ON mill.accoid = dbo.nt_1_utr.mc
#                  where dbo.nt_1_utr.Company_Code = :company_code and dbo.nt_1_utr.doc_no = :doc_no
#                                  '''
#             )
#         additional_data = db.session.execute(text(query), {"company_code": company_code,"doc_no": doc_no})

#         additional_data_rows = additional_data.fetchall()
        
#         all_data = [dict(row._mapping) for row in additional_data_rows]

#         for data in all_data:
#             if 'doc_date' in data:
#                 data['doc_date'] = data['doc_date'].strftime('%Y-%m-%d') if data['doc_date'] else None

#         response = {
#             "all_data": all_data
#         }
#         return jsonify(response), 200

#     except Exception as e:
#         print(e)
#         return jsonify({"error": "Internal server error", "message": str(e)}), 500



@app.route(API_URL+"/getUTRReport", methods=["GET"])
def getUTRReport():
    try:
        company_code = request.args.get('Company_Code')
        doc_no = request.args.get('doc_no')

        if not company_code or not doc_no:
            return jsonify({"error": "Missing 'Company_Code' or 'Year_Code' parameter"}), 400

        query = ('''SELECT dbo.nt_1_utr.doc_no, CONVERT(varchar,dbo.nt_1_utr.doc_date,103) as convertedDate,dbo.nt_1_utr.doc_date as doc_date, mill.Ac_Name_E, mill.Address_E, mill.Pincode, dbo.nt_1_utr.mill_code, dbo.nt_1_citymaster.city_name_e, dbo.nt_1_citymaster.state, dbo.nt_1_utr.amount, dbo.nt_1_utr.utr_no, 
                  mill.Email_Id AS millemailid, mill.whatsup_no AS BillToWpNo, dbo.tblvoucherheadaddress.AL1, dbo.tblvoucherheadaddress.AL2, dbo.tblvoucherheadaddress.AL3, dbo.tblvoucherheadaddress.AL4, dbo.tblvoucherheadaddress.Other, 
                  dbo.tblvoucherheadaddress.BillFooter, dbo.company.Company_Name_E, mill.GSTStateCode
FROM     dbo.nt_1_citymaster LEFT OUTER JOIN
                  dbo.nt_1_accountmaster AS mill ON dbo.nt_1_citymaster.cityid = mill.cityid RIGHT OUTER JOIN
                  dbo.company INNER JOIN
                  dbo.tblvoucherheadaddress INNER JOIN
                  dbo.nt_1_utr ON dbo.tblvoucherheadaddress.Company_Code = dbo.nt_1_utr.Company_Code ON dbo.company.Company_Code = dbo.nt_1_utr.Company_Code ON mill.accoid = dbo.nt_1_utr.mc
                 where dbo.nt_1_utr.Company_Code = :company_code and dbo.nt_1_utr.doc_no = :doc_no
                                 '''
            )
        additional_data = db.session.execute(text(query), {"company_code": company_code,"doc_no": doc_no})

        additional_data_rows = additional_data.fetchall()
        
        all_data = [dict(row._mapping) for row in additional_data_rows]

        response = {
            "all_data": all_data
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
