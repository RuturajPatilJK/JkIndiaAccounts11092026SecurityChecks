from flask import Flask, jsonify, request, json
from app import app, db, socketio
import requests
from app.models.Transactions.OfflineTender.OfflinetenderModel import OfflineTenderHead, OfflineTenderDetail
from app.models.Transactions.OfflineTender.OfflinetenderSchema import OfflineTenderHeadSchema, OfflineTenderDetailSchema
from app.utils.CommonGLedgerFunctions import fetch_company_parameters, get_accoid, getSaleAc, get_acShort_Name,get_ac_Name,create_gledger_entry,send_gledger_entries
from sqlalchemy import text, func
from sqlalchemy.exc import SQLAlchemyError
import os
import requests
import traceback
import logging
from app.models.CompanyLogs.CompanyLogsModels import CompanyLogs
from datetime import datetime
from datetime import datetime, timedelta
from app.utils.CommonCompanyLogs.CompanyLogsUtils import create_company_log_entry
import threading

# Get the base URL from environment variables
API_URL = os.getenv('API_URL')
API_URL_SERVER = os.getenv('API_URL_SERVER')
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


RECEIPT_PAYMENT_DETAILS_QUERY = '''
SELECT dbo.OfflineTenders.MillCode, dbo.OfflineTenders.MillName, dbo.OfflineTenders.TenderId, dbo.OfflineTenders.TenderDate, dbo.OfflineTenders.TenderNumber, dbo.OfflineTenders.MillShortName, dbo.OfflineTenders.StateZone, 
                  dbo.OfflineTenders.LastDateOfPayment, dbo.OfflineTenders.LiftingDate, dbo.OfflineTenders.Grade, dbo.OfflineTenders.Season, dbo.OfflineTenders.Rate, dbo.OfflineTenders.RateGST, dbo.OfflineTenders.RateWithGST, 
                  dbo.OfflineTenders.detail_id, dbo.OfflineTenderHead.Doc_Date, dbo.OfflineTenderHead.Id, dbo.nt_1_gstratemaster.GST_Name
FROM     dbo.OfflineTenders LEFT OUTER JOIN
                  dbo.nt_1_gstratemaster ON dbo.OfflineTenders.RateGST = dbo.nt_1_gstratemaster.gstid RIGHT OUTER JOIN
                  dbo.OfflineTenderHead ON dbo.OfflineTenders.tranid = dbo.OfflineTenderHead.Id
WHERE 
    dbo.OfflineTenderHead.Id = :Id
'''

offline_tender_head_schema = OfflineTenderHeadSchema()
offline_tender_head_schemas = OfflineTenderHeadSchema(many=True)

offline_tender_detail_schema = OfflineTenderDetailSchema()
offline_tender_detail_schemas = OfflineTenderDetailSchema(many=True)

def format_dates(task):
    doc_date = getattr(task, 'Doc_Date', None)
    lifting_date = getattr(task, 'LiftingDate', None)
    last_date_of_payment = getattr(task, 'LastDateOfPayment', None)
    tender_date = getattr(task, 'TenderDate', None)

    result = {}
    if doc_date is not None:
        result["Doc_Date"] = doc_date.strftime('%Y-%m-%d')
    if lifting_date is not None:
        result["LiftingDate"] = lifting_date.strftime('%Y-%m-%d')
    if last_date_of_payment is not None:
        result["LastDateOfPayment"] = last_date_of_payment.strftime('%Y-%m-%d')
    if tender_date is not None:
        result["TenderDate"] = tender_date.strftime('%Y-%m-%d')

    return result


# Get data from both tables ReceiptPaymentHead and ReceiptPaymentDetail
# @app.route(API_URL + "/getdata-receiptpayment", methods=["GET"])
# def getdata_receiptpayment():
#     try:
#         Company_Code = request.args.get('Company_Code')
#         Year_Code = request.args.get('Year_Code')
#         tran_type = request.args.get('tran_type')

#         # if not all([Company_Code, Year_Code, tran_type]):
#         #     return jsonify({"error": "Missing required parameters"}), 400


#         query = """
#         SELECT dbo.OfflineTenders.MillCode, dbo.OfflineTenders.MillName, dbo.OfflineTenders.TenderId, dbo.OfflineTenders.TenderDate, dbo.OfflineTenders.TenderNumber, dbo.OfflineTenders.MillShortName, dbo.OfflineTenders.StateZone, 
#                   dbo.OfflineTenders.LastDateOfPayment, dbo.OfflineTenders.LiftingDate, dbo.OfflineTenders.Grade, dbo.OfflineTenders.Season, dbo.OfflineTenders.Rate, dbo.OfflineTenders.RateGST, dbo.OfflineTenders.RateWithGST, 
#                   dbo.OfflineTenders.detail_id, dbo.OfflineTenderHead.Doc_Date, dbo.OfflineTenderHead.Id
# FROM     dbo.OfflineTenders RIGHT OUTER JOIN
#                   dbo.OfflineTenderHead ON dbo.OfflineTenders.tranid = dbo.OfflineTenderHead.Id
#         ORDER BY 
#             dbo.OfflineTenderHead.Id DESC
#         """

#         results = db.session.execute(
#             text(query),
#             {
#                 # "Company_Code": Company_Code,
#                 # "Year_Code": Year_Code,
#                 # "tran_type": tran_type
#             }
#         )
#         rows = results.fetchall()

#         all_records_data = []
#         for row in rows:
#             record = dict(row._mapping)
#             if record.get("doc_date"):
#                 record["doc_date"] = record["doc_date"].strftime('%Y-%m-%d')
#             all_records_data.append(record)

#         if not all_records_data:
#             return jsonify({"error": "No records found"}), 404

#         response = {
#             "all_data_receiptpayment": all_records_data
#         }
#         return jsonify(response), 200

#     except Exception as e:
#         return jsonify({"error": "Internal server error", "message": str(e)}), 500

@app.route(API_URL + "/getdata-offlinetender", methods=["GET"])
def getdata_offlinetender():
    try:

        query = """
       SELECT dbo.OfflineTenders.MillCode, dbo.OfflineTenders.MillName, dbo.OfflineTenders.TenderId, dbo.OfflineTenders.TenderDate, dbo.OfflineTenders.TenderNumber, dbo.OfflineTenders.MillShortName, 
                  dbo.OfflineTenders.StateZone, dbo.OfflineTenders.LastDateOfPayment, dbo.OfflineTenders.LiftingDate, dbo.OfflineTenders.Grade, dbo.OfflineTenders.Season, dbo.OfflineTenders.Rate, dbo.OfflineTenders.RateGST, 
                  dbo.OfflineTenders.RateWithGST, dbo.OfflineTenders.detail_id, dbo.OfflineTenderHead.Doc_Date, dbo.OfflineTenderHead.Id
FROM     dbo.OfflineTenders RIGHT OUTER JOIN
                  dbo.OfflineTenderHead ON dbo.OfflineTenders.tranid = dbo.OfflineTenderHead.Id
ORDER BY dbo.OfflineTenderHead.Id DESC
        """


        results = db.session.execute(text(query))

        rows = results.fetchall()


        all_records_data = []

        for row in rows:

            record = dict(row._mapping)

            if record.get("Doc_Date"):
                record["Doc_Date"] = record["Doc_Date"].strftime('%Y-%m-%d')

            if record.get("TenderDate"):
                record["TenderDate"] = record["TenderDate"].strftime('%Y-%m-%d')

            all_records_data.append(record)



        if not all_records_data:return jsonify({"error": "No records found"}), 404

        return jsonify({"all_data_offlinetender": all_records_data}), 200

    except Exception as e:

        return jsonify({"error": "Internal server error","message": str(e)}), 500

# Get data by the particular doc_no
# @app.route(API_URL + "/getreceiptpaymentByid", methods=["GET"])
# def getreceiptpaymentByid():
#     try:
#         Company_Code = request.args.get('Company_Code')
#         doc_no = request.args.get('doc_no')
#         Year_Code = request.args.get('Year_Code')
#         tran_type = request.args.get('tran_type')
#         if not all([Company_Code, Year_Code, tran_type, doc_no]):
#             return jsonify({"error": "Missing required parameters"}), 400

#         receipt_payment_head = ReceiptPaymentHead.query.filter_by(doc_no=doc_no, company_code=Company_Code, year_code=Year_Code, tran_type=tran_type).first()
#         if not receipt_payment_head:
#             return jsonify({"error": "No records found"}), 404

#         tranid = receipt_payment_head.tranid
#         additional_data = db.session.execute(text(RECEIPT_PAYMENT_DETAILS_QUERY), {"tranid": tranid})
#         additional_data_rows = additional_data.fetchall()

#         labels = [dict(row._mapping) for row in additional_data_rows]

#         response = {
#             "receipt_payment_head": {
#                 **{column.name: getattr(receipt_payment_head, column.name) for column in receipt_payment_head.__table__.columns},
#                 **format_dates(receipt_payment_head)
#             },
#             "labels": labels,
#             "receipt_payment_details": [{
#                 **{column.name: getattr(detail, column.name) for column in detail.__table__.columns},
#                 **format_dates(detail)
#             } for detail in ReceiptPaymentDetail.query.filter_by(tranid=tranid).all()]
#         }

#         return jsonify(response), 200

#     except Exception as e:
#         return jsonify({"error": "Internal server error", "message": str(e)}), 500

# @app.route(API_URL + "/getofflinetenderByid", methods=["GET"])
# def getofflinetenderByid():

#     try:

#         tender_id = request.args.get('Id')


#         if not tender_id:return jsonify({"error": "Missing Id parameter"}), 400

#         offline_head = OfflineTenderHead.query.filter_by(Id=tender_id).first()

#         if not offline_head:

#             return jsonify({"error": "No records found"}), 404

#         response = {

#             "offline_tender_head": {

#                 **{
#                     column.name: getattr(offline_head, column.name)
#                     for column in offline_head.__table__.columns
#                 },

#                 **format_dates(offline_head)

#             },


#             "offline_tender_details": [

#                 {

#                     **{
#                         column.name: getattr(detail, column.name)
#                         for column in detail.__table__.columns
#                     },

#                     **format_dates(detail)

#                 }

#                 for detail in OfflineTenderDetail.query.filter_by(
#                     tranid=tender_id
#                 ).all()

#             ]

#         }

#         return jsonify(response), 200



#     except Exception as e:
#          return jsonify({"error": "Internal server error","message": str(e)}), 500

@app.route(API_URL + "/getofflinetenderByid", methods=["GET"])
def getofflinetenderByid():
    try:
        tender_id = request.args.get('Id')

        if not tender_id:
            return jsonify({"error": "Missing Id parameter"}), 400

        offline_head = OfflineTenderHead.query.filter_by(Id=tender_id).first()

        if not offline_head:
            return jsonify({"error": "No records found"}), 404

        # Fetch additional GST name data via join
        additional_data = db.session.execute(
            text(RECEIPT_PAYMENT_DETAILS_QUERY), {"Id": tender_id}
        )
        additional_data_rows = additional_data.fetchall()
        gst_name_map = {row.TenderId: row.GST_Name for row in additional_data_rows}

        offline_tender_details = []
        for detail in OfflineTenderDetail.query.filter_by(tranid=tender_id).all():
            detail_data = {column.name: getattr(detail, column.name) for column in detail.__table__.columns}
            detail_data.update(format_dates(detail))
            detail_data["GST_Name"] = gst_name_map.get(detail.TenderId, "")
            offline_tender_details.append(detail_data)

        head_data = {column.name: getattr(offline_head, column.name) for column in offline_head.__table__.columns}
        head_data.update(format_dates(offline_head))

        response = {
            "offline_tender_head": head_data,
            "offline_tender_details": offline_tender_details
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    
# def get_next_detail_id(tran_type, company_code, year_code, doc_no):

#         with db.session.begin_nested():
#             db.session.execute(
#                 text("SELECT detail_id FROM nt_1_transactdetail WITH (TABLOCKX)")
#             )

#             max_id = (
#                 db.session.query(func.max(ReceiptPaymentDetail.detail_id))
#                 .filter(
#                     ReceiptPaymentDetail.Tran_Type == tran_type,
#                     ReceiptPaymentDetail.Company_Code == company_code,
#                     ReceiptPaymentDetail.Year_Code == year_code,
#                     ReceiptPaymentDetail.doc_no == doc_no
#                 )
#                 .scalar()
#             )

#             return (max_id or 0) + 1


def get_next_offlinetender_detail_id():

    with db.session.begin_nested():

        db.session.execute(
            text(
                "SELECT detail_id FROM OfflineTenders WITH (TABLOCKX)"
            )
        )


        max_id = db.session.query(
            func.max(OfflineTenderDetail.detail_id)
        ).scalar()


        return (max_id or 0) + 1

# Insert record for ReceiptPaymentHead and ReceiptPaymentDetail
# @app.route(API_URL + "/insert-offlinetender", methods=["POST"])
# def insert_offlinetender():
#     def get_max_doc_no(tran_type,company_code,year_code):
#         return db.session.query(func.max(ReceiptPaymentHead.doc_no)).filter(ReceiptPaymentHead.tran_type == tran_type, ReceiptPaymentHead.company_code == company_code, ReceiptPaymentHead.year_code == year_code).scalar() or 0
        
#     try:
#         data = request.get_json()
        
#         headData = data['head_data']
#         detailData = data['detail_data']

#         # company_code = headData["company_code"]
#         # year_code = headData["year_code"]

#         # if not company_code or not year_code:
#         #     return jsonify({"error": "Bad Request", "message": "Missing required paramters"}), 400
       
#         # tran_type = headData.get('tran_type')
#         # if not tran_type:
#         #     return jsonify({"error": "Bad Request", "message": "tran_type is required"}), 400

#         max_doc_no = get_max_doc_no(tran_type,company_code,year_code)
#         new_doc_no = max_doc_no + 1
#         headData['doc_no'] = new_doc_no
#         new_head = ReceiptPaymentHead(**headData)
#         db.session.add(new_head)

#         createdDetails = []
#         updatedDetails = []
#         deletedDetailIds = []
        
#         for item in detailData:
#             item['tranid'] = new_head.Id
#             # item['Doc_Date'] = new_head.Doc_Date
        
#             if 'rowaction' in item:
#                 if item['rowaction'] == "add":
#                     del item['rowaction']
#                     item['detail_id'] = get_next_detail_id(tran_type, company_code, year_code, new_doc_no)
#                     new_detail = ReceiptPaymentDetail(**item)
#                     new_head.details.append(new_detail)
#                     createdDetails.append(new_detail)

#                 elif item['rowaction'] == "update":
#                     trandetailid = item['trandetailid']
#                     update_values = {k: v for k, v in item.items() if k not in ('trandetailid', 'rowaction', 'tranid')}
#                     db.session.query(ReceiptPaymentDetail).filter(ReceiptPaymentDetail.trandetailid == trandetailid).update(update_values)
#                     updatedDetails.append(trandetailid)

#                 elif item['rowaction'] == "delete":
#                     trandetailid = item['trandetailid']
#                     detail_to_delete = db.session.query(ReceiptPaymentDetail).filter(ReceiptPaymentDetail.trandetailid == trandetailid).one_or_none()
#                     if detail_to_delete:
#                         db.session.delete(detail_to_delete)
#                         deletedDetailIds.append(trandetailid)

#         db.session.commit()

#         gledger_entries = []
#         order_code=0
#         gledger_entries = process_gledger_entries(detailData, headData, gledger_entries, order_code)

#         def async_send_gledger():
#             try:
#                 send_gledger_entries(headData, gledger_entries, tran_type)
#             except Exception as e:
#                 print(f"[Async Gledger Error] {e}")

#         threading.Thread(target=async_send_gledger).start()
        
#         # if gledger_entries:
#         #     response = send_gledger_entries(headData, gledger_entries, tran_type)
#         #     if response.status_code != 200:
#         #         db.session.rollback()
#         #         return jsonify({"error": "Failed to create GLedger record", "details": response.text}), response.status_code

#         socketio.emit('receipt_payment_added', json.loads(json.dumps({
#                 'head': receipt_payment_head_schema.dump(new_head),
#                 'addedDetails': receipt_payment_detail_schemas.dump(createdDetails),
#                 'updatedDetails': updatedDetails,
#                 'deletedDetailIds': deletedDetailIds
#             }, default=str)))
        
#         return jsonify({
#             "message": "Data Inserted successfully",
#             "head": receipt_payment_head_schema.dump(new_head),
#             "addedDetails": receipt_payment_detail_schemas.dump(createdDetails),
#             "updatedDetails": updatedDetails,
#             "deletedDetailIds": deletedDetailIds
#         }), 200

#     except Exception as e:
#         logger.error("Traceback: %s", traceback.format_exc())
#         logger.error("Error fetching data: %s", e)
#         db.session.rollback()
#         return jsonify({"error": "Internal server error", "message": str(e)}), 500


@app.route(API_URL + "/insert-offlinetender", methods=["POST"])
def insert_offlinetender():
    try:
        data = request.get_json()

        headData = data.get('head_data')
        detailData = data.get('detail_data')

        if not headData:return jsonify({ "error": "Bad Request", "message": "head_data is required" }), 400

        if detailData is None:
            detailData = []

        
        new_head = OfflineTenderHead(**headData)

        db.session.add(new_head)
        db.session.flush()   

        createdDetails = []
        updatedDetails = []
        deletedDetailIds = []


        # Insert Details
        for item in detailData:

            item['tranid'] = new_head.Id

            if 'rowaction' in item:

                if item['rowaction'] == "add":

                    del item['rowaction']

                    # Generate detail id if required
                    max_detail_id = db.session.query(
                        func.max(OfflineTenderDetail.detail_id)
                    ).scalar() or 0

                    item['detail_id'] = max_detail_id + 1

                    new_detail = OfflineTenderDetail(**item)

                    db.session.add(new_detail)
                    createdDetails.append(new_detail)


                elif item['rowaction'] == "update":

                    tender_id = item['TenderId']

                    update_values = {
                        k: v for k, v in item.items()
                        if k not in ('TenderId', 'rowaction', 'tranid')
                    }

                    db.session.query(
                        OfflineTenderDetail
                    ).filter(
                        OfflineTenderDetail.TenderId == tender_id
                    ).update(update_values)

                    updatedDetails.append(tender_id)


                elif item['rowaction'] == "delete":

                    tender_id = item['TenderId']

                    detail_to_delete = db.session.query(
                        OfflineTenderDetail
                    ).filter(
                        OfflineTenderDetail.TenderId == tender_id
                    ).one_or_none()

                    if detail_to_delete:
                        db.session.delete(detail_to_delete)
                        deletedDetailIds.append(tender_id)


            else:
                # If no rowaction is sent, treat it as new record
                max_detail_id = db.session.query(
                    func.max(OfflineTenderDetail.detail_id)
                ).scalar() or 0

                item['detail_id'] = max_detail_id + 1

                new_detail = OfflineTenderDetail(**item)

                db.session.add(new_detail)
                createdDetails.append(new_detail)


        db.session.commit()


        # Socket notification (optional)
        socketio.emit(
            'offline_tender_added',
            json.loads(
                json.dumps({
                    'head': offline_tender_head_schema.dump(new_head),
                    'addedDetails': offline_tender_detail_schemas.dump(createdDetails),
                    'updatedDetails': updatedDetails,
                    'deletedDetailIds': deletedDetailIds
                }, default=str)
            )
        )


        return jsonify({
            "message": "Offline Tender Inserted successfully",
            "head": offline_tender_head_schema.dump(new_head),
            "addedDetails": offline_tender_detail_schemas.dump(createdDetails),
            "updatedDetails": updatedDetails,
            "deletedDetailIds": deletedDetailIds
        }), 200


    except Exception as e:
        logger.error("Traceback: %s", traceback.format_exc())
        logger.error("Error inserting Offline Tender: %s", e)

        db.session.rollback()

        return jsonify({
            "error": "Internal server error",
            "message": str(e)
        }), 500

#For Axis Bank Collection API
# @app.route(API_URL + "/insert-receiptpaymentbank", methods=["POST"])
# def insert_receiptpaymentnew():
#     def get_max_doc_no(tran_type, company_code, year_code):
#         return db.session.query(func.max(ReceiptPaymentHead.doc_no)).filter(
#             ReceiptPaymentHead.tran_type == tran_type,
#             ReceiptPaymentHead.company_code == company_code,
#             ReceiptPaymentHead.year_code == year_code
#         ).scalar() or 0

#     try:
#         data = request.get_json()
#         headData = data.get('head_data')
#         detailData = data.get('detail_data')
#         head_exists = data.get('head_exists', False)

#         if not headData or not detailData:
#             return jsonify({"error": "Bad Request", "message": "Missing 'head_data' or 'detail_data'"}), 400

#         company_code = headData.get("company_code")
#         year_code = headData.get("year_code")
#         tran_type = headData.get('tran_type')
#         doc_date_str = headData.get('doc_date')

#         if not all([company_code, year_code, tran_type, doc_date_str]):
#             return jsonify({"error": "Bad Request", "message": "Missing required parameters in head_data"}), 400

#         try:
#             doc_date = datetime.strptime(doc_date_str, '%Y-%m-%d').date()
#         except ValueError:
#             return jsonify({"error": "Bad Request", "message": "Invalid date format. Use YYYY-MM-DD"}), 400
        
#         if head_exists:
#             doc_no = headData.get('doc_no')
#             if not doc_no:
#                 return jsonify({"error": "Bad Request", "message": "Missing 'doc_no' for existing head update"}), 400

#             existing_head = db.session.query(ReceiptPaymentHead).filter(
#                 ReceiptPaymentHead.doc_no == doc_no,
#                 ReceiptPaymentHead.tran_type == tran_type,
#                 ReceiptPaymentHead.company_code == company_code,
#                 ReceiptPaymentHead.year_code == year_code,
#             ).one_or_none()
            
#             if not existing_head:
#                 return jsonify({"error": "Not Found", "message": "The specified head document for update was not found."}), 404

#             existing_head.total = headData.get('total')
#             existing_head.Modified_By = headData.get('Modified_By')
#             db.session.add(existing_head)

#             new_head = existing_head  
#             doc_no = existing_head.doc_no

#         else:
#             max_doc_no = get_max_doc_no(tran_type, company_code, year_code)
#             new_doc_no = max_doc_no + 1
#             headData['doc_no'] = new_doc_no

#             new_head = ReceiptPaymentHead(**headData)
#             db.session.add(new_head)
#             db.session.flush()
#             doc_no = new_doc_no 

#         createdDetails = []
#         updatedDetails = []
#         deletedDetailIds = []


#         gl_detail_data = []
        
#         for item in detailData:
#             item['doc_no'] = doc_no
#             item['tranid'] = new_head.tranid 
#             item['Tran_Type'] = new_head.tran_type
#             item['doc_date'] = new_head.doc_date
            
#             action = item.get('rowaction', 'add') 

#             if action == "add":
#                 add_data = {k: v for k, v in item.items() if k != 'rowaction'}
#                 new_detail = ReceiptPaymentDetail(**add_data)
#                 db.session.add(new_detail)  
#                 createdDetails.append(new_detail)
                
         
#                 gl_detail_data.append(add_data)

#             elif action == "update":
#                 trandetailid = item.get('trandetailid')
#                 update_values = {k: v for k, v in item.items() if k not in ('trandetailid', 'rowaction', 'tranid')}
#                 db.session.query(ReceiptPaymentDetail).filter(ReceiptPaymentDetail.trandetailid == trandetailid).update(update_values)
#                 updatedDetails.append(trandetailid)
                
        
#                 updated_detail = db.session.query(ReceiptPaymentDetail).filter(
#                     ReceiptPaymentDetail.trandetailid == trandetailid
#                 ).first()
#                 if updated_detail:
#                     gl_detail_data.append(receipt_payment_detail_schema.dump(updated_detail))

#             elif action == "delete":
#                 trandetailid = item.get('trandetailid')
#                 detail_to_delete = db.session.query(ReceiptPaymentDetail).filter(ReceiptPaymentDetail.trandetailid == trandetailid).one_or_none()
#                 if detail_to_delete:
#                     db.session.delete(detail_to_delete)
#                     deletedDetailIds.append(trandetailid)
                  

#         db.session.commit()


#         gledger_entries = []
#         order_code = 0
        
#         gledger_entries = process_gledger_entries(gl_detail_data, headData, gledger_entries, order_code)

#         def async_send_gledger():
#             try:
#                 send_gledger_entries(headData, gledger_entries, tran_type)
#             except Exception as e:
#                 print(f"[Async Gledger Error] {e}")

#         threading.Thread(target=async_send_gledger).start()

#         #socketio.emit("receipt_payment_added")
#         socketio.emit('receipt_payment_added', json.loads(json.dumps({
#                 'head': receipt_payment_head_schema.dump(new_head),
#                 'addedDetails': receipt_payment_detail_schemas.dump(createdDetails),
#                 'updatedDetails': updatedDetails,
#                 'deletedDetailIds': deletedDetailIds
#             }, default=str)))

#         return jsonify({
#             "message": "Data processed successfully",
#             "doc_no": doc_no,
#             "head": receipt_payment_head_schema.dump(new_head),
#             "addedDetails": receipt_payment_detail_schemas.dump(createdDetails),
#             "updatedDetails": updatedDetails,
#             "deletedDetailIds": deletedDetailIds
#         }), 200

#     except Exception as e:
#         logger.error("Traceback: %s", traceback.format_exc())
#         db.session.rollback()
#         return jsonify({"error": "Internal server error", "message": str(e)}), 500

# @app.route(API_URL + "/update-receiptpayment", methods=["PUT"])
# def update_receiptpayment():
#     try:
#         tranid = request.args.get('tranid')
#         if not tranid:
#             return jsonify({"error": "Missing 'tranid' parameter"}), 400

#         data = request.get_json()
#         headData = data['head_data']
#         detailData = data['detail_data']

#         user_id = headData.get('User_Id', 0)
#         tran_type = headData.get('tran_type')

#         if not tran_type:
#             return jsonify({"error": "Bad Request", "message": "tran_type is required"}), 400

#         if 'User_Id' in headData:
#             del headData['User_Id']

#         existing_head = ReceiptPaymentHead.query.filter_by(tranid=tranid).first()

#         if not existing_head:
#             return jsonify({"error": "ReceiptPaymentHead with the given tranid not found"}), 404

#         cashbank_changed = existing_head.cashbank != headData.get('cashbank', existing_head.cashbank)
#         # doc_date_changed = existing_head.doc_date != headData.get('doc_date', existing_head.doc_date)

#         updated_head_count = db.session.query(ReceiptPaymentHead).filter(ReceiptPaymentHead.tranid == tranid).update(headData)
#         updated_head = ReceiptPaymentHead.query.filter_by(tranid=tranid).first()

#         doc_date = existing_head.doc_date
#         updated_doc_date = updated_head.doc_date

#         created_details = []
#         updated_details = []
#         deleted_detail_ids = []

#         company_code = headData.get('company_code')
#         year_code = headData.get('year_code')

#         current_date = datetime.now().date()
#         two_days_ago = current_date - timedelta(days=2)

#         for item in detailData:
#             item['tranid'] = updated_head.tranid
#             item['Tran_Type'] = updated_head.tran_type
#             item['doc_date'] = updated_doc_date

#             if 'rowaction' in item:
#                 if item['rowaction'] == "add":
#                     del item['rowaction']
#                     item['detail_id'] = get_next_detail_id(tran_type, company_code, year_code, updated_head.doc_no)
#                     item['doc_no'] = updated_head.doc_no
#                     new_detail = ReceiptPaymentDetail(**item)
#                     db.session.add(new_detail)
#                     created_details.append(new_detail)

#                     if doc_date < two_days_ago:
#                         create_company_log_entry(
#                             db=db,
#                             doc_no=updated_head.doc_no,
#                             doc_date=doc_date,
#                             # updated_doc_date=headData.get("doc_date"),
#                             ac_code=item.get('credit_ac'),
#                             value=item.get('amount'),
#                             company_code=company_code,
#                             year_code=year_code,
#                             record_type='N',
#                             record_no=new_detail.trandetailid,
#                             user_id=user_id,
#                             tran_type=tran_type,
#                             bank_ac=updated_head.cashbank,
#                             created_by=headData['Created_By'],
#                             modified_by=headData['Modified_By'],
#                             narration=item.get('narration', '')
#                         )

#                 elif item['rowaction'] == "update":
#                     trandetailid = item['trandetailid']
#                     existing_detail = ReceiptPaymentDetail.query.filter_by(trandetailid=trandetailid).first()

#                     if existing_detail:
#                         create_company_log_entry(
#                             db=db,
#                             doc_no=updated_head.doc_no,
#                             doc_date=doc_date,
#                             # updated_doc_date=headData.get("doc_date"),
#                             ac_code=existing_detail.credit_ac,
#                             value=existing_detail.amount,
#                             company_code=company_code,
#                             year_code=year_code,
#                             record_type='O',
#                             record_no=trandetailid,
#                             user_id=user_id,
#                             tran_type=tran_type,
#                             bank_ac=updated_head.cashbank,
#                             created_by=headData['Created_By'],
#                             modified_by=headData['Modified_By'],
#                             narration=existing_detail.narration
#                         )

#                         update_values = {k: v for k, v in item.items() if k not in ('trandetailid', 'rowaction', 'tranid')}
#                         db.session.query(ReceiptPaymentDetail).filter(ReceiptPaymentDetail.trandetailid == trandetailid).update(update_values)
#                         updated_details.append(trandetailid)

#                         updated_detail = ReceiptPaymentDetail.query.filter_by(trandetailid=trandetailid).first()

#                         if updated_detail:
#                             create_company_log_entry(
#                                 db=db,
#                                 doc_no=updated_head.doc_no,
#                                 doc_date=doc_date,
#                                 # updated_doc_date=headData.get("doc_date"),
#                                 ac_code=updated_detail.credit_ac,
#                                 value=updated_detail.amount,
#                                 company_code=company_code,
#                                 year_code=year_code,
#                                 record_type='N',
#                                 record_no=trandetailid,
#                                 user_id=user_id,
#                                 tran_type=tran_type,
#                                 bank_ac=updated_head.cashbank,
#                                 created_by=headData['Created_By'],
#                                 modified_by=headData['Modified_By'],
#                                 narration=updated_detail.narration
#                             )

#                 elif item['rowaction'] == "delete":
#                     trandetailid = item['trandetailid']
#                     detail_to_delete = db.session.query(ReceiptPaymentDetail).filter(ReceiptPaymentDetail.trandetailid == trandetailid).one_or_none()
#                     if detail_to_delete:
#                         create_company_log_entry(
#                             db=db,
#                             doc_no=updated_head.doc_no,
#                             doc_date=doc_date,
#                             # updated_doc_date=headData.get("doc_date"),
#                             ac_code=detail_to_delete.credit_ac,
#                             value=detail_to_delete.amount,
#                             company_code=company_code,
#                             year_code=year_code,
#                             record_type='D',
#                             record_no=trandetailid,
#                             user_id=user_id,
#                             tran_type=tran_type,
#                             bank_ac=updated_head.cashbank,
#                             created_by=headData['Created_By'],
#                             modified_by=headData['Modified_By'],
#                             narration=detail_to_delete.narration
#                         )

#                         db.session.delete(detail_to_delete)
#                         deleted_detail_ids.append(trandetailid)
#                     continue

#         if existing_head and updated_head_count > 0 and (cashbank_changed):
#                 create_company_log_entry(
#                     db=db,
#                     doc_no=existing_head.doc_no,
#                     doc_date=doc_date,
#                     # updated_doc_date=headData.get("doc_date"),
#                     company_code=company_code,
#                     year_code=year_code,
#                     record_type='O',
#                     record_no=tranid,
#                     user_id=user_id,
#                     tran_type=tran_type,
#                     bank_ac=existing_head.cashbank,
#                     created_by=headData['Created_By'],
#                     modified_by=headData['Modified_By']
#                 )

#                 create_company_log_entry(
#                     db=db,
#                     doc_no=updated_head.doc_no,
#                     doc_date=doc_date,
#                     #  updated_doc_date=headData.get("doc_date"),
#                     company_code=company_code,
#                     year_code=year_code,
#                     record_type='N',
#                     record_no=tranid,
#                     user_id=user_id,
#                     tran_type=tran_type,
#                     bank_ac=headData["cashbank"],
#                     created_by=headData['Created_By'],
#                     modified_by=headData['Modified_By']
#                 )

#         db.session.commit()
#         socketio.emit("receipt_payment_updated", { "tranid": tranid,
#     "doc_no": updated_head.doc_no,
#     "tran_type": updated_head.tran_type})

#         filtered_detail_data_for_gledger = [
#             item for item in detailData if item.get('rowaction') not in ['delete', 'DNU']
#         ]

#         gledger_entries = []
#         order_code = 0

        
#         # gledger_entries = process_gledger_entries(filtered_detail_data_for_gledger, headData, gledger_entries, order_code)

#         # if gledger_entries:
#         #     response = send_gledger_entries(headData, gledger_entries, tran_type)
#         #     if response.status_code != 200:
#         #         db.session.rollback()
#         #         return jsonify({"error": "Failed to create GLedger record", "details": response.text}), response.status_code



#         gledger_entries = process_gledger_entries(filtered_detail_data_for_gledger, headData, gledger_entries, order_code)

#         def async_send_gledger():
#             try:
#                 send_gledger_entries(headData, gledger_entries, tran_type)
#             except Exception as e:
#                 print(f"[Async Gledger Error] {e}")

#         threading.Thread(target=async_send_gledger).start()


#         return jsonify({
#             "message": "Data updated successfully",
#             "head": updated_head_count,
#             "created_details": receipt_payment_detail_schemas.dump(created_details),
#             "updated_details": updated_details,
#             "deleted_detail_ids": deleted_detail_ids
#         }), 200

#     except Exception as e:
#         logger.error("Traceback: %s", traceback.format_exc())
#         logger.error("Error fetching data: %s", e)
#         db.session.rollback()
#         return jsonify({"error": "Internal server error", "message": str(e)}), 500




@app.route(API_URL + "/update-offlinetender", methods=["PUT"])
def update_offlinetender():
    try:
        tender_head_id = request.args.get('Id')

        if not tender_head_id:
            return jsonify({
                "error": "Missing 'Id' parameter"
            }), 400

        data = request.get_json()

        headData = data.get('head_data')
        detailData = data.get('detail_data', [])

        if not headData:
            return jsonify({
                "error": "head_data is required"
            }), 400


        # Find existing head
        existing_head = OfflineTenderHead.query.filter_by(
            Id=tender_head_id
        ).first()


        if not existing_head:
            return jsonify({
                "error": "OfflineTenderHead not found"
            }), 404


        # Update Head
        updated_head_count = db.session.query(
            OfflineTenderHead
        ).filter(
            OfflineTenderHead.Id == tender_head_id
        ).update(headData)


        updated_head = OfflineTenderHead.query.filter_by(
            Id=tender_head_id
        ).first()


        created_details = []
        updated_details = []
        deleted_detail_ids = []


        # Process Details
        for item in detailData:

            item['tranid'] = updated_head.Id


            if 'rowaction' in item:

                # ADD DETAIL
                if item['rowaction'] == "add":

                    del item['rowaction']


                    max_detail_id = db.session.query(
                        func.max(OfflineTenderDetail.detail_id)
                    ).scalar() or 0


                    item['detail_id'] = max_detail_id + 1


                    new_detail = OfflineTenderDetail(**item)

                    db.session.add(new_detail)

                    created_details.append(new_detail)



                # UPDATE DETAIL
                elif item['rowaction'] == "update":

                    tender_id = item['TenderId']


                    update_values = {
                        k: v for k, v in item.items()
                        if k not in (
                            'TenderId',
                            'rowaction',
                            'tranid'
                        )
                    }


                    db.session.query(
                        OfflineTenderDetail
                    ).filter(
                        OfflineTenderDetail.TenderId == tender_id
                    ).update(update_values)


                    updated_details.append(tender_id)



                # DELETE DETAIL
                elif item['rowaction'] == "delete":

                    tender_id = item['TenderId']


                    detail_to_delete = db.session.query(
                        OfflineTenderDetail
                    ).filter(
                        OfflineTenderDetail.TenderId == tender_id
                    ).one_or_none()


                    if detail_to_delete:

                        db.session.delete(detail_to_delete)

                        deleted_detail_ids.append(tender_id)



            else:
                # No rowaction means new detail

                max_detail_id = db.session.query(
                    func.max(OfflineTenderDetail.detail_id)
                ).scalar() or 0


                item['detail_id'] = max_detail_id + 1


                new_detail = OfflineTenderDetail(**item)

                db.session.add(new_detail)

                created_details.append(new_detail)



        db.session.commit()


        socketio.emit(
            "offline_tender_updated",
            {
                "Id": updated_head.Id
            }
        )


        return jsonify({

            "message": "Offline Tender updated successfully",

            "head": updated_head.Id,

            "created_details":
                offline_tender_detail_schemas.dump(created_details),

            "updated_details": updated_details,

            "deleted_detail_ids": deleted_detail_ids

        }), 200



    except Exception as e:

        logger.error(
            "Traceback: %s",
            traceback.format_exc()
        )

        logger.error(
            "Error updating Offline Tender: %s",
            e
        )

        db.session.rollback()

        return jsonify({
            "error": "Internal server error",
            "message": str(e)
        }), 500


# Delete record from database based on tranid
# @app.route(API_URL + "/delete_data_by_tranid", methods=["DELETE"])
# def delete_data_by_tranid():
#     try:
#         tranid = request.args.get('tranid')
#         company_code = request.args.get('company_code')
#         year_code = request.args.get('year_code')
#         doc_no = request.args.get('doc_no')
#         tran_type = request.args.get('Tran_Type')

#         if not all([tranid, company_code,year_code,doc_no,tran_type]):
#             return jsonify({"error": "Missing required parameters"}), 400

#         with db.session.begin():
#             deleted_detail_rows = ReceiptPaymentDetail.query.filter_by(tranid=tranid).delete()
#             deleted_head_rows = ReceiptPaymentHead.query.filter_by(tranid=tranid).delete()

#         if deleted_detail_rows > 0 and deleted_head_rows > 0:
#             query_params = {
#                 'Company_Code': company_code,
#                 'DOC_NO': doc_no,
#                 'Year_Code': year_code,
#                 'TRAN_TYPE': tran_type,
#             }

#             response = requests.delete(API_URL_SERVER+"/delete-Record-gLedger", params=query_params)
            
#             if response.status_code != 200:
#                 raise Exception("Failed to create record in gLedger")    

#         db.session.commit()

#         return jsonify({
#             "message": f"Deleted {deleted_head_rows} head row(s) and {deleted_detail_rows} detail row(s) successfully"
#         }), 200

#     except Exception as e:
#         db.session.rollback()
#         return jsonify({"error": "Internal server error", "message": str(e)}), 500


# @app.route(API_URL + "/delete_data_by_tranid", methods=["DELETE"])
# def delete_data_by_tranid():
#     try:
#         tranid = request.args.get('tranid')
#         company_code = request.args.get('company_code')
#         year_code = request.args.get('year_code')
#         doc_no = request.args.get('doc_no')
#         tran_type = request.args.get('Tran_Type')
#         user_id = request.args.get('user_id',0)

#         if not all([tranid, company_code, year_code, doc_no, tran_type]):
#             return jsonify({"error": "Missing required parameters"}), 400

#         current_time_str = datetime.now().strftime("%I:%M %p")

#         db.session.begin()

#         details_to_delete = db.session.query(
#             ReceiptPaymentDetail.trandetailid,
#             ReceiptPaymentDetail.credit_ac,
#             ReceiptPaymentDetail.amount
#         ).filter_by(tranid=tranid).all()

#         head_info = db.session.query(
#             ReceiptPaymentHead.doc_no,
#             ReceiptPaymentHead.doc_date,
#             ReceiptPaymentHead.cashbank,
#             ReceiptPaymentHead.Created_By,
#             ReceiptPaymentHead.Modified_By
#         ).filter_by(tranid=tranid).first()

#         if not head_info:
#             db.session.rollback()
#             return jsonify({"error": "Record not found"}), 404

#         for detail in details_to_delete:
#             log_entry = CompanyLogs(
#                 Doc_No=head_info.doc_no,
#                 Doc_Date=head_info.doc_date,
#                 Ac_Code=detail.credit_ac,
#                 Item_Code=0,
#                 Value=detail.amount,
#                 Company_Code=company_code,
#                 Year_Code=year_code,
#                 Record_Type='D',
#                 Record_Date=func.current_date(),
#                 Record_No=detail.trandetailid,
#                 User_Id=user_id,
#                 Tran_Type=tran_type,
#                 Bank_Ac=head_info.cashbank,
#                 Updated_Time=current_time_str,
#                 Created_by=head_info.Created_By,
#                 Modified_by=head_info.Modified_By,
#             )
#             db.session.add(log_entry)

#         head_log_entry = CompanyLogs(
#             Doc_No=head_info.doc_no,
#             Doc_Date=head_info.doc_date,
#             Ac_Code=0,
#             Item_Code=0,
#             Value=0,
#             Company_Code=company_code,
#             Year_Code=year_code,
#             Record_Type='D',
#             Record_Date=func.current_date(),
#             Record_No=tranid,
#             User_Id=user_id,
#             Tran_Type=tran_type,
#             Bank_Ac=head_info.cashbank,
#             Updated_Time=current_time_str,
#             Created_by=head_info.Created_By,
#             Modified_by=head_info.Modified_By
#         )
#         db.session.add(head_log_entry)

#         deleted_detail_rows = ReceiptPaymentDetail.query.filter_by(tranid=tranid).delete()
#         deleted_head_rows = ReceiptPaymentHead.query.filter_by(tranid=tranid).delete()

#         db.session.commit()
#         socketio.emit("receipt_payment_deleted", {
#                 "tranid": tranid })

#         if deleted_head_rows > 0:
#             query_params = {
#                 'Company_Code': company_code,
#                 'DOC_NO': doc_no,
#                 'Year_Code': year_code,
#                 'TRAN_TYPE': tran_type,
#             }
#             response = requests.delete(API_URL_SERVER+"/delete-Record-gLedger", params=query_params)
#             if response.status_code != 200:
#                 raise Exception("Failed to delete record in gLedger")

#         return jsonify({
#             "message": f"Deleted {deleted_head_rows} head row(s) and {deleted_detail_rows} detail row(s) successfully",
#             "logged_deletions": {
#                 "head": tranid,
#                 "details": [detail.trandetailid for detail in details_to_delete]
#             }
#         }), 200

#     except Exception as e:
#         db.session.rollback()
#         logger.error(f"Error in delete_data_by_tranid: {str(e)}", exc_info=True)
#         return jsonify({"error": "Internal server error", "message": str(e)}), 500


@app.route(API_URL + "/delete-offlinetender", methods=["DELETE"])
def delete_offlinetender():
    try:

        tender_head_id = request.args.get('Id')

        if not tender_head_id:
            return jsonify({
                "error": "Missing 'Id' parameter"
            }), 400


        db.session.begin()


        # Get details before deleting for response
        details_to_delete = db.session.query(
            OfflineTenderDetail.TenderId
        ).filter_by(
            tranid=tender_head_id
        ).all()


        # Check head exists
        head_info = db.session.query(
            OfflineTenderHead.Id
        ).filter_by(
            Id=tender_head_id
        ).first()


        if not head_info:
            db.session.rollback()

            return jsonify({
                "error": "OfflineTenderHead record not found"
            }), 404



        # Delete Details
        deleted_detail_rows = OfflineTenderDetail.query.filter_by(
            tranid=tender_head_id
        ).delete()



        # Delete Head
        deleted_head_rows = OfflineTenderHead.query.filter_by(
            Id=tender_head_id
        ).delete()



        db.session.commit()



        socketio.emit(
            "offline_tender_deleted",
            {
                "Id": tender_head_id
            }
        )


        return jsonify({

            "message":
                f"Deleted {deleted_head_rows} head row(s) and {deleted_detail_rows} detail row(s) successfully",

            "deleted_data": {

                "head": tender_head_id,

                "details": [
                    detail.TenderId
                    for detail in details_to_delete
                ]

            }

        }), 200



    except Exception as e:

        db.session.rollback()

        logger.error(
            f"Error in delete_offlinetender: {str(e)}",
            exc_info=True
        )

        return jsonify({
            "error": "Internal server error",
            "message": str(e)
        }), 500
    


# @app.route(API_URL + "/get-firstreceiptpayment-navigation", methods=["GET"])
# def get_firstreceiptpayment_navigation():
#     try:
#         Company_Code = request.args.get('Company_Code')
#         Year_Code = request.args.get('Year_Code')
#         tran_type = request.args.get('tran_type')
#         if not all([Company_Code, Year_Code, tran_type]):
#             return jsonify({"error": "Missing required parameters"}), 400

#         first_receipt_payment_head = ReceiptPaymentHead.query.filter_by(company_code=Company_Code, year_code=Year_Code, tran_type=tran_type).order_by(ReceiptPaymentHead.doc_no.asc()).first()
#         if not first_receipt_payment_head:
#             return jsonify({"error": "No records found"}), 404

#         tranid = first_receipt_payment_head.tranid
#         additional_data = db.session.execute(text(RECEIPT_PAYMENT_DETAILS_QUERY), {"tranid": tranid})
#         additional_data_rows = additional_data.fetchall()

#         labels = [dict(row._mapping) for row in additional_data_rows]

#         first_head_data = {
#             **{column.name: getattr(first_receipt_payment_head, column.name) for column in first_receipt_payment_head.__table__.columns},
#             **format_dates(first_receipt_payment_head)
#         }

#         first_details_data = [
#             {
#                 **{column.name: getattr(detail, column.name) for column in detail.__table__.columns},
#                 **format_dates(detail)
#             } for detail in ReceiptPaymentDetail.query.filter_by(tranid=tranid).all()
#         ]

#         response = {
#             "first_head_data": first_head_data,
#             "labels": labels,
#             "first_details_data": first_details_data
#         }

#         return jsonify(response), 200

#     except Exception as e:
#         return jsonify({"error": "Internal server error", "message": str(e)}), 500

@app.route(API_URL + "/get-firstofflinetender-navigation", methods=["GET"])
def get_firstofflinetender_navigation():
    try:

        first_head = OfflineTenderHead.query.order_by(
            OfflineTenderHead.Id.asc()
        ).first()


        if not first_head:
            return jsonify({
                "error": "No records found"
            }), 404


        head_id = first_head.Id


        head_data = {
            **{
                column.name: getattr(first_head, column.name)
                for column in first_head.__table__.columns
            },
            **format_dates(first_head)
        }


        details_data = [
            {
                **{
                    column.name: getattr(detail, column.name)
                    for column in detail.__table__.columns
                },
                **format_dates(detail)
            }
            for detail in OfflineTenderDetail.query.filter_by(
                tranid=head_id
            ).all()
        ]


        return jsonify({
            "first_head_data": head_data,
            "first_details_data": details_data
        }), 200


    except Exception as e:
        return jsonify({
            "error": "Internal server error",
            "message": str(e)
        }), 500

# Get last record from the database
# @app.route(API_URL + "/get-lastreceiptpayment-navigation", methods=["GET"])
# def get_lastreceiptpayment_navigation():
#     try:
#         Company_Code = request.args.get('Company_Code')
#         Year_Code = request.args.get('Year_Code')
#         tran_type = request.args.get('tran_type')
#         if not all([Company_Code, Year_Code, tran_type]):
#             return jsonify({"error": "Missing required parameters"}), 400

#         last_receipt_payment_head = ReceiptPaymentHead.query.filter_by(company_code=Company_Code, year_code=Year_Code, tran_type=tran_type).order_by(ReceiptPaymentHead.doc_no.desc()).first()
#         if not last_receipt_payment_head:
#             return jsonify({"error": "No records found"}), 404

#         tranid = last_receipt_payment_head.tranid
#         additional_data = db.session.execute(text(RECEIPT_PAYMENT_DETAILS_QUERY), {"tranid": tranid})
#         additional_data_rows = additional_data.fetchall()

#         labels = [dict(row._mapping) for row in additional_data_rows]

#         last_head_data = {
#             **{column.name: getattr(last_receipt_payment_head, column.name) for column in last_receipt_payment_head.__table__.columns},
#             **format_dates(last_receipt_payment_head)
#         }

#         last_details_data = [
#             {
#                 **{column.name: getattr(detail, column.name) for column in detail.__table__.columns},
#                 **format_dates(detail)
#             } for detail in ReceiptPaymentDetail.query.filter_by(tranid=tranid).all()
#         ]

#         response = {
#             "last_head_data": last_head_data,
#             "labels": labels,
#             "last_details_data": last_details_data
#         }

#         return jsonify(response), 200

#     except Exception as e:
#         return jsonify({"error": "Internal server error", "message": str(e)}), 500

@app.route(API_URL + "/get-lastofflinetender-navigation", methods=["GET"])
def get_lastofflinetender_navigation():
    try:

        last_head = OfflineTenderHead.query.order_by(
            OfflineTenderHead.Id.desc()
        ).first()


        if not last_head:
            return jsonify({
                "error": "No records found"
            }), 404


        head_id = last_head.Id


        head_data = {
            **{
                column.name: getattr(last_head, column.name)
                for column in last_head.__table__.columns
            },
            **format_dates(last_head)
        }


        details_data = [
            {
                **{
                    column.name: getattr(detail, column.name)
                    for column in detail.__table__.columns
                },
                **format_dates(detail)
            }
            for detail in OfflineTenderDetail.query.filter_by(
                tranid=head_id
            ).all()
        ]


        return jsonify({
            "last_head_data": head_data,
            "last_details_data": details_data
        }), 200


    except Exception as e:
        return jsonify({
            "error": "Internal server error",
            "message": str(e)
        }), 500

# Get previous record from the database
# @app.route(API_URL + "/get-previousreceiptpayment-navigation", methods=["GET"])
# def get_previousreceiptpayment_navigation():
#     try:
#         current_doc_no = request.args.get('currentDocNo')
#         Company_Code = request.args.get('Company_Code')
#         Year_Code = request.args.get('Year_Code')
#         tran_type = request.args.get('tran_type')
#         if not all([Company_Code, Year_Code, current_doc_no, tran_type]):
#             return jsonify({"error": "Missing required parameters"}), 400

#         previous_receipt_payment_head = ReceiptPaymentHead.query.filter(ReceiptPaymentHead.doc_no < current_doc_no).filter_by(company_code=Company_Code, year_code=Year_Code, tran_type=tran_type).order_by(ReceiptPaymentHead.doc_no.desc()).first()
#         if not previous_receipt_payment_head:
#             return jsonify({"error": "No previous records found"}), 404

#         tranid = previous_receipt_payment_head.tranid
#         additional_data = db.session.execute(text(RECEIPT_PAYMENT_DETAILS_QUERY), {"tranid": tranid})
#         additional_data_rows = additional_data.fetchall()

#         labels = [dict(row._mapping) for row in additional_data_rows]

#         previous_head_data = {
#             **{column.name: getattr(previous_receipt_payment_head, column.name) for column in previous_receipt_payment_head.__table__.columns},
#             **format_dates(previous_receipt_payment_head)
#         }

#         previous_details_data = [
#             {
#                 **{column.name: getattr(detail, column.name) for column in detail.__table__.columns},
#                 **format_dates(detail)
#             } for detail in ReceiptPaymentDetail.query.filter_by(tranid=tranid).all()
#         ]

#         response = {
#             "previous_head_data": previous_head_data,
#             "labels": labels,
#             "previous_details_data": previous_details_data
#         }

#         return jsonify(response), 200

#     except Exception as e:
#         return jsonify({"error": "Internal server error", "message": str(e)}), 500

@app.route(API_URL + "/get-previousofflinetender-navigation", methods=["GET"])
def get_previousofflinetender_navigation():
    try:

        current_id = request.args.get('currentId')


        if not current_id:
            return jsonify({
                "error": "Missing currentId parameter"
            }), 400


        previous_head = OfflineTenderHead.query.filter(
            OfflineTenderHead.Id < current_id
        ).order_by(
            OfflineTenderHead.Id.desc()
        ).first()


        if not previous_head:
            return jsonify({
                "error": "No previous records found"
            }), 404


        head_id = previous_head.Id


        head_data = {
            **{
                column.name: getattr(previous_head, column.name)
                for column in previous_head.__table__.columns
            },
            **format_dates(previous_head)
        }


        details_data = [
            {
                **{
                    column.name: getattr(detail, column.name)
                    for column in detail.__table__.columns
                },
                **format_dates(detail)
            }
            for detail in OfflineTenderDetail.query.filter_by(
                tranid=head_id
            ).all()
        ]


        return jsonify({
            "previous_head_data": head_data,
            "previous_details_data": details_data
        }), 200


    except Exception as e:
        return jsonify({
            "error": "Internal server error",
            "message": str(e)
        }), 500

# Get next record from the database
# @app.route(API_URL + "/get-nextreceiptpayment-navigation", methods=["GET"])
# def get_nextreceiptpayment_navigation():
#     try:
#         current_doc_no = request.args.get('currentDocNo')
#         Company_Code = request.args.get('Company_Code')
#         Year_Code = request.args.get('Year_Code')
#         tran_type = request.args.get('tran_type')
#         if not all([Company_Code, Year_Code, current_doc_no, tran_type]):
#             return jsonify({"error": "Missing required parameters"}), 400

#         next_receipt_payment_head = ReceiptPaymentHead.query.filter(ReceiptPaymentHead.doc_no > current_doc_no).filter_by(company_code=Company_Code, year_code=Year_Code, tran_type=tran_type).order_by(ReceiptPaymentHead.doc_no.asc()).first()
#         if not next_receipt_payment_head:
#             return jsonify({"error": "No next records found"}), 404

#         tranid = next_receipt_payment_head.tranid
#         additional_data = db.session.execute(text(RECEIPT_PAYMENT_DETAILS_QUERY), {"tranid": tranid})
#         additional_data_rows = additional_data.fetchall()

#         labels = [dict(row._mapping) for row in additional_data_rows]

#         next_head_data = {
#             **{column.name: getattr(next_receipt_payment_head, column.name) for column in next_receipt_payment_head.__table__.columns},
#             **format_dates(next_receipt_payment_head)
#         }

#         next_details_data = [
#             {
#                 **{column.name: getattr(detail, column.name) for column in detail.__table__.columns},
#                 **format_dates(detail)
#             } for detail in ReceiptPaymentDetail.query.filter_by(tranid=tranid).all()
#         ]

#         response = {
#             "next_head_data": next_head_data,
#             "labels": labels,
#             "next_details_data": next_details_data
#         }

#         return jsonify(response), 200

#     except Exception as e:
#         return jsonify({"error": "Internal server error", "message": str(e)}), 500

@app.route(API_URL + "/get-nextofflinetender-navigation", methods=["GET"])
def get_nextofflinetender_navigation():
    try:

        current_id = request.args.get('currentId')


        if not current_id:
            return jsonify({
                "error": "Missing currentId parameter"
            }), 400


        next_head = OfflineTenderHead.query.filter(
            OfflineTenderHead.Id > current_id
        ).order_by(
            OfflineTenderHead.Id.asc()
        ).first()


        if not next_head:
            return jsonify({
                "error": "No next records found"
            }), 404


        head_id = next_head.Id


        head_data = {
            **{
                column.name: getattr(next_head, column.name)
                for column in next_head.__table__.columns
            },
            **format_dates(next_head)
        }


        details_data = [
            {
                **{
                    column.name: getattr(detail, column.name)
                    for column in detail.__table__.columns
                },
                **format_dates(detail)
            }
            for detail in OfflineTenderDetail.query.filter_by(
                tranid=head_id
            ).all()
        ]


        return jsonify({
            "next_head_data": head_data,
            "next_details_data": details_data
        }), 200


    except Exception as e:
        return jsonify({
            "error": "Internal server error",
            "message": str(e)
        }), 500

# @app.route(API_URL + "/get_next_paymentRecord_docNo", methods=["GET"])
# def get_next_paymentRecord_docNo():
#     try:
#         company_code = request.args.get('Company_Code')
#         year_code = request.args.get('Year_Code')
#         tranType = request.args.get('tran_type')

#         if not company_code or not year_code or not tranType:
#             return jsonify({"error": "Missing 'Company_Code' or 'Year_Code' or 'Tran_Type' parameter"}), 400

#         max_doc_no = db.session.query(func.max(ReceiptPaymentHead.doc_no)).filter_by(company_code=company_code, year_code=year_code, tran_type=tranType).scalar()

#         next_doc_no = max_doc_no + 1 if max_doc_no else 1
#         response = {
#             "next_doc_no": next_doc_no
#         }
#         return jsonify(response), 200
#     except Exception as e:
#         print(e)
#         return jsonify({"error": "Internal server error", "message": str(e)}), 500


@app.route(API_URL + "/get_next_offlinetender_id", methods=["GET"])
def get_next_offlinetender_id():
    try:

        max_id = db.session.query(
            func.max(OfflineTenderHead.Id)
        ).scalar()


        next_id = max_id + 1 if max_id else 1


        return jsonify({
            "next_id": next_id
        }), 200


    except Exception as e:

        print(e)

        return jsonify({
            "error": "Internal server error",
            "message": str(e)
        }), 500


        
# @app.route(API_URL+"/generating_RecieptPaymrnt_report", methods=["GET"])
# def generating_RecieptPaymrnt_report():
#     try:
#         company_code = request.args.get('Company_Code')
#         year_code = request.args.get('Year_Code')
#         doc_no = request.args.get('doc_no')
#         tran_type=request.args.get('TranType')
#         if not company_code or not year_code or not doc_no:
#             return jsonify({"error": "Missing 'Company_Code' or 'Year_Code' parameter"}), 400

#         query = ('''
                      
#                SELECT        dbo.qrytransheaddetail.*, dbo.tblvoucherheadaddress.AL1, dbo.tblvoucherheadaddress.AL2, dbo.tblvoucherheadaddress.AL3, dbo.tblvoucherheadaddress.AL4, dbo.tblvoucherheadaddress.Other, 
#                          dbo.company.Company_Name_E
# FROM            dbo.qrytransheaddetail LEFT OUTER JOIN
#                          dbo.company ON dbo.qrytransheaddetail.company_code = dbo.company.Company_Code LEFT OUTER JOIN
#                          dbo.tblvoucherheadaddress ON dbo.company.Company_Code = dbo.tblvoucherheadaddress.Company_Code
# WHERE        (dbo.qrytransheaddetail.doc_no = :doc_no) AND (dbo.qrytransheaddetail.tran_type = :TranType) AND 
#                  (dbo.qrytransheaddetail.company_code = :company_code) AND (dbo.qrytransheaddetail.year_code = :year_code)
#                                  '''
#             )
#         additional_data = db.session.execute(text(query), {"company_code": company_code,
#                       "year_code": year_code, "doc_no": doc_no,'TranType' :tran_type})

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


@app.route(API_URL + "/getdata-formillmasterhelp", methods=["GET"])
def getdata_formillmastehelp():
    try:

        query = """
       SELECT MillId, MillCode, MillName, MillShortName, MillState, MillZone
FROM     dbo.MillMaster
        """


        results = db.session.execute(text(query))

        rows = results.fetchall()


        all_records_data = []

        for row in rows:

            record = dict(row._mapping)

            # if record.get("Doc_Date"):
            #     record["Doc_Date"] = record["Doc_Date"].strftime('%Y-%m-%d')

            # if record.get("TenderDate"):
            #     record["TenderDate"] = record["TenderDate"].strftime('%Y-%m-%d')

            all_records_data.append(record)



        if not all_records_data:return jsonify({"error": "No records found"}), 404

        return jsonify({"all_data_millmaster": all_records_data}), 200

    except Exception as e:

        return jsonify({"error": "Internal server error","message": str(e)}), 500


