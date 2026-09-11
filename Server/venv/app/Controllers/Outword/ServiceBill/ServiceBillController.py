import traceback
from flask import Flask, jsonify, request, copy_current_request_context
from app import app, db
from app.models.Outword.ServiceBill.ServiceBillModel import ServiceBillHead, ServiceBillDetail
from sqlalchemy import text, func
from sqlalchemy.exc import SQLAlchemyError
import os
from app.models.Outword.ServiceBill.ServiceBillSchema import ServiceBillHeadSchema, ServiceBillDetailSchema
from app.utils.CommonGLedgerFunctions import fetch_company_parameters, get_accoid, getSaleAc, get_acShort_Name,create_gledger_entry,send_gledger_entries, get_ac_Name
import requests
from datetime import datetime
from app.utils.CommonCompanyLogs.CompanyLogsUtils import create_company_log_entry
import threading

service_bill_head_schema = ServiceBillHeadSchema()
service_bill_head_schemas = ServiceBillHeadSchema(many=True)

service_bill_detail_schema = ServiceBillDetailSchema()
service_bill_detail_schemas = ServiceBillDetailSchema(many=True)

# Get the base URL from environment variables
API_URL = os.getenv('API_URL')
API_URL_SERVER = os.getenv('API_URL_SERVER')

SERVICE_BILL_DETAILS_QUERY = '''
SELECT        customer.Ac_Name_E AS partyname, tdsac.Ac_Name_E AS millname, item.System_Name_E AS itemname, dbo.nt_1_gstratemaster.GST_Name, item.System_Code AS Item_Code, dbo.nt_1_systemmaster.System_Name_E, 
                         dbo.nt_1_rentbilldetails.Group_Code, customer.GSTStateCode, dbo.nt_1_rentbillhead.ProformaServicebillno, dbo.nt_1_rentbillhead.Proformaid
FROM            dbo.nt_1_accountmaster AS customer RIGHT OUTER JOIN
                         dbo.nt_1_rentbillhead LEFT OUTER JOIN
                         dbo.nt_1_proformaservicebillhead ON dbo.nt_1_rentbillhead.rbid = dbo.nt_1_proformaservicebillhead.rbid LEFT OUTER JOIN
                         dbo.nt_1_gstratemaster ON dbo.nt_1_rentbillhead.gstid = dbo.nt_1_gstratemaster.gstid LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS tdsac ON dbo.nt_1_rentbillhead.ta = tdsac.accoid ON customer.accoid = dbo.nt_1_rentbillhead.cc LEFT OUTER JOIN
                         dbo.nt_1_systemmaster AS item RIGHT OUTER JOIN
                         dbo.nt_1_rentbilldetails LEFT OUTER JOIN
                         dbo.nt_1_systemmaster ON dbo.nt_1_rentbilldetails.gcid = dbo.nt_1_systemmaster.systemid ON item.systemid = dbo.nt_1_rentbilldetails.ic ON dbo.nt_1_rentbillhead.rbid = dbo.nt_1_rentbilldetails.rbid
WHERE (item.System_Type = 'I') and dbo.nt_1_rentbillhead.rbid = :rbid
'''
#format Dates
def format_dates(task):
    return {
        "Date": task.Date.strftime('%Y-%m-%d') if task.Date else None,
    }

#Create a GLedger Entries
ac_code=0
ordercode=0
doc_no=0
narration=''
trans_type='RB'

def add_gledger_entry(entries, data, amount, drcr, ac_code, accoid, ordercode, narration,gcid=0,ca_narration=None):
    entry = create_gledger_entry(data, amount, drcr, ac_code, accoid, ordercode, trans_type, doc_no, narration)
    entry['gcid'] = gcid
    entry['CA_NARRATION'] = ca_narration
    if amount > 0:
        entries.append(entry)

#GLedger Effects 
def generate_gledger_entries(head_data, company_parameters, detail_data):
    gledger_entries = []
    
    igst_amount = float(head_data.get('IGSTAmount', 0) or 0)
    final_amount = float(head_data.get('Final_Amount', 0) or 0)
    sgst_amount = float(head_data.get('SGSTAmount', 0) or 0)
    cgst_amount = float(head_data.get('CGSTAmount', 0) or 0)
    TCS_Amt = float(head_data.get('TCS_Amt', 0) or 0)
    TDS_Amt = float(head_data.get('TDS', 0) or 0)

    customerCode = head_data['Customer_Code']
    customerName = get_ac_Name(customerCode, head_data['Company_Code'])
    narration = f"As Per Service Bill No. {head_data['Doc_No']} {str(customerName)}"

    

    GeneralNarrationForCA = (
        f"{customerName}"+ " " 
        f"Service Bill No {head_data['Doc_No']}"
    )

    TDSNarrationPartyForCA = (
        f"{customerName} "+ " " 
        f"Service Bill No {head_data['Doc_No']}"
    )

    TDSNarrationTDSAcForCA = (
        f"TDS Service Bill No {head_data['Doc_No']}"
    )

    GeneralNarrationForParty_CA = (
        f"Service Bill No {head_data['Doc_No']}"
    )
    
    ordercode = 0
    def add_tax_entry(amount, drcr, ac_code, accoid,narration,gcid,ordercode,ca_narration=None):
        add_gledger_entry(gledger_entries, head_data, amount, drcr, ac_code, accoid,ordercode,narration,gcid,ca_narration)
    
    if igst_amount > 0:
        ordercode += 1
        ac_code = company_parameters.IGSTAc
        accoid = get_accoid(ac_code, head_data['Company_Code'])
        add_tax_entry(igst_amount, "C", ac_code, accoid, narration,0,ordercode,GeneralNarrationForCA)
    
    if cgst_amount > 0:
        ordercode += 1
        ac_code = company_parameters.CGSTAc
        accoid = get_accoid(ac_code, head_data['Company_Code'])
        add_tax_entry(cgst_amount, "C", ac_code, accoid, narration,0,ordercode,GeneralNarrationForCA)
    
    if sgst_amount > 0:
        ordercode += 1
        ac_code = company_parameters.SGSTAc
        accoid = get_accoid(ac_code, head_data['Company_Code'])
        add_tax_entry(sgst_amount, "C", ac_code, accoid, narration,0,ordercode,GeneralNarrationForCA)

    if TCS_Amt > 0:
        ordercode += 1
        narration = f"TCS {str(customerName)} {head_data['Doc_No']}"
        ac_code = head_data['Customer_Code']
        accoid = get_accoid(ac_code, head_data['Company_Code'])
        add_tax_entry(TCS_Amt, 'D', ac_code, accoid, narration,0,ordercode,narration)
        ordercode += 1
        ac_code = company_parameters.SaleTCSAc
        accoid = get_accoid(ac_code, head_data['Company_Code'])
        add_tax_entry(TCS_Amt, 'C', ac_code, accoid, narration,0,ordercode,narration)

    if TDS_Amt > 0:
        ordercode += 1
        narration = f"TDS {str(customerName)} {head_data['Doc_No']} "
        ac_code = head_data['Customer_Code']
        accoid = get_accoid(ac_code, head_data['Company_Code'])
        add_tax_entry(TDS_Amt, 'C', ac_code, accoid,narration,0,ordercode,TDSNarrationTDSAcForCA)
        ordercode += 1
        ac_code = head_data['TDS_Ac']
        accoid = get_accoid(ac_code, head_data['Company_Code'])
        add_tax_entry(TDS_Amt, 'D', ac_code, accoid,narration,0,ordercode,TDSNarrationPartyForCA)

    narration = f"As Per Service Bill No. {head_data['Doc_No']} {str(customerName)}"
    ordercode += 1
    add_tax_entry(final_amount, "D", head_data['Customer_Code'], get_accoid(head_data['Customer_Code'], head_data['Company_Code']),narration,0,ordercode,GeneralNarrationForParty_CA)
    
    for item in detail_data:
        ordercode += 1
        item_amount = float(item.get('Amount', 0) or 0)
        gcid = item.get('gcid', 0)
        if item_amount > 0:
            ac_code = getSaleAc(item.get('ic'))
            accoid = get_accoid(ac_code, head_data['Company_Code'])
            add_tax_entry(item_amount, 'C', ac_code, accoid,narration,gcid,ordercode,GeneralNarrationForCA)

    return gledger_entries

# Get data from both tables ServiceBillHead and ServiceBillDetail
@app.route(API_URL + "/getdata-servicebill", methods=["GET"])
def getdata_servicebill():
    try:
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')
        if not all([Company_Code, Year_Code]):
            return jsonify({"error": "Missing required parameters"}), 400

        query = ('''SELECT        customer.Ac_Name_E AS partyname, tdsac.Ac_Name_E AS millname, item.System_Name_E AS itemname, dbo.nt_1_gstratemaster.GST_Name, item.System_Code AS Item_Code, dbo.nt_1_rentbillhead.Doc_No, 
                         dbo.nt_1_rentbillhead.Date, dbo.nt_1_rentbillhead.Customer_Code, dbo.nt_1_rentbillhead.GstRateCode, dbo.nt_1_rentbillhead.Total, dbo.nt_1_rentbilldetails.Item_Code AS Expr1, dbo.nt_1_rentbillhead.Final_Amount, 
                         dbo.nt_1_rentbillhead.TDS_Per, dbo.nt_1_rentbillhead.ackno, dbo.nt_1_rentbillhead.rbid
                         FROM dbo.nt_1_rentbillhead LEFT OUTER JOIN
                         dbo.nt_1_gstratemaster ON dbo.nt_1_rentbillhead.gstid = dbo.nt_1_gstratemaster.gstid LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS tdsac ON dbo.nt_1_rentbillhead.ta = tdsac.accoid LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS customer ON dbo.nt_1_rentbillhead.cc = customer.accoid LEFT OUTER JOIN
                         dbo.nt_1_rentbilldetails LEFT OUTER JOIN
                         dbo.nt_1_systemmaster AS item ON dbo.nt_1_rentbilldetails.ic = item.systemid ON dbo.nt_1_rentbillhead.rbid = dbo.nt_1_rentbilldetails.rbid

                 where  (item.System_Type = 'I') and dbo.nt_1_rentbillhead.Company_Code = :company_code and dbo.nt_1_rentbillhead.Year_Code = :year_code order by dbo.nt_1_rentbillhead.Doc_No desc
                                 '''
            )
        
        additional_data = db.session.execute(text(query), {"company_code": Company_Code, "year_code": Year_Code})

        additional_data_rows = additional_data.fetchall()
        
        all_data = [dict(row._mapping) for row in additional_data_rows]

        for data in all_data:
            if 'Date' in data:
                data['Date'] = data['Date'].strftime('%Y-%m-%d') if data['Date'] else None
 
        response = {
            "all_data": all_data
        }

        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# Get data by the particular doc_no
@app.route(API_URL + "/getservicebillByid", methods=["GET"])
def getservicebillByid():
    try:
        Company_Code = request.args.get('Company_Code')
        doc_no = request.args.get('doc_no')
        Year_Code = request.args.get('Year_Code')
        if not all([Company_Code, doc_no, Year_Code]):
            return jsonify({"error": "Missing required parameters"}), 400

        service_bill_head = ServiceBillHead.query.filter_by(Doc_No=doc_no, Company_Code=Company_Code, Year_Code=Year_Code).first()
        if not service_bill_head:
            return jsonify({"error": "No records found"}), 404

        rbid = service_bill_head.rbid
        additional_data = db.session.execute(text(SERVICE_BILL_DETAILS_QUERY), {"rbid": rbid})
        additional_data_rows = additional_data.fetchall()

        service_labels = [dict(row._mapping) for row in additional_data_rows]

        response = {
            "service_bill_head": {
                **{column.name: getattr(service_bill_head, column.name) for column in service_bill_head.__table__.columns},
                **format_dates(service_bill_head)
            },
            "service_labels": service_labels,
            "service_bill_details": [{column.name: getattr(detail, column.name) for column in detail.__table__.columns} for detail in ServiceBillDetail.query.filter_by(rbid=rbid).all()]
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# Insert record for ServiceBillHead and ServiceBillDetail
@app.route(API_URL + "/insert-servicebill", methods=["POST"])
def insert_servicebill():
    try:
        data = request.get_json()
        head_data = data['head_data']
        detail_data = data['detail_data']

        max_doc_no = db.session.query(func.max(ServiceBillHead.Doc_No)).filter_by(Company_Code=head_data['Company_Code'], Year_Code=head_data['Year_Code']).scalar() or 0

        new_doc_no = max_doc_no + 1
        head_data['Doc_No'] = new_doc_no

        new_head = ServiceBillHead(**head_data)
        db.session.add(new_head)

        createdDetails = []
        updatedDetails = []
        deletedDetailIds = []

        for item in detail_data:
            item['Doc_No'] = new_doc_no
            item['rbid'] = new_head.rbid
            if 'rowaction' in item and item['rowaction'] == "add":
                del item['rowaction']
                new_detail = ServiceBillDetail(**item)
                new_head.details.append(new_detail)
                createdDetails.append(new_detail)

            elif item['rowaction'] == "update":
                rbdid = item['rbdid']
                update_values = {k: v for k, v in item.items() if k not in ('rbdid', 'rowaction', 'rbid')}
                db.session.query(ServiceBillDetail).filter(ServiceBillDetail.rbdid == rbdid).update(update_values)
                updatedDetails.append(rbdid)

            elif item['rowaction'] == "delete":
                rbdid = item['rbdid']
                detail_to_delete = db.session.query(ServiceBillDetail).filter(ServiceBillDetail.rbdid == rbdid).one_or_none()
                if detail_to_delete:
                    db.session.delete(detail_to_delete)
                    deletedDetailIds.append(rbdid)

        db.session.commit()

        # Fetch company parameters and generate ledger entries
        company_parameters = fetch_company_parameters(head_data['Company_Code'], head_data['Year_Code'])
        gledger_entries = generate_gledger_entries(head_data, company_parameters, detail_data)

        @copy_current_request_context
        def async_send_gledger():
            try:
                send_gledger_entries(head_data, gledger_entries, trans_type)
            except Exception as e:
                print(f"[Async Gledger Error] {e}")

        threading.Thread(target=async_send_gledger).start()

     
        # if gledger_entries:
        #     response = send_gledger_entries(head_data, gledger_entries, trans_type)
        #     if response.status_code != 200:
        #         db.session.rollback()
        #         return jsonify({"error": "Failed to create GLedger record", "details": response.text}), response.status_code

        return jsonify({
            "message": "Data Inserted successfully",
            "head": service_bill_head_schema.dump(new_head),
            "addedDetails": service_bill_detail_schemas.dump(createdDetails),
             "updatedDetails": updatedDetails,
            "deletedDetailIds": deletedDetailIds
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# Update record for ServiceBillHead and ServiceBillDetail
@app.route(API_URL + "/update-servicebill", methods=["PUT"])
def update_servicebill():
    try:
        rbid = request.args.get('rbid')
        if not all([rbid]):
            return jsonify({"error": "Missing required parameters"}), 400

        data = request.get_json()
        head_data = data['head_data']
        detail_data = data['detail_data']

        company_code = head_data.get('Company_Code')
        year_code = head_data.get('Year_Code')
        user_id = head_data.get('User_Id',0)
        tran_type = "RB" 

        if not head_data:
            return jsonify({"error": "Missing head_data"}), 400
        
        if 'User_Id' in head_data:
            del head_data['User_Id']

        existing_head = ServiceBillHead.query.filter_by(rbid=rbid).first()

        if not existing_head:
            return jsonify({"error": "ServiceBillHead with the given rbid not found"}), 404

        Customer_Code_changed = existing_head.Customer_Code != head_data.get('Customer_Code', existing_head.Customer_Code)
        TCS_Net_Payable_changed = existing_head.TCS_Net_Payable != head_data.get('TCS_Net_Payable', existing_head.TCS_Net_Payable)

        updated_head_counts=db.session.query(ServiceBillHead).filter(ServiceBillHead.rbid == rbid).update(head_data)
        updated_head = ServiceBillHead.query.filter_by(rbid=rbid).first()

        created_details = []
        updated_details = []
        deleted_detail_ids = []

        for item in detail_data:
            item['rbid'] = updated_head.rbid

            if 'rowaction' in item:
                if item['rowaction'] == "add":
                    del item['rowaction']
                    item['Doc_No'] = updated_head.Doc_No
                    new_detail = ServiceBillDetail(**item)
                    db.session.add(new_detail)
                    created_details.append(new_detail)

                elif item['rowaction'] == "update":
                    rbdid = item['rbdid']
                    update_values = {k: v for k, v in item.items() if k not in ('rbdid', 'rowaction', 'rbid')}
                    db.session.query(ServiceBillDetail).filter(ServiceBillDetail.rbdid == rbdid).update(update_values)
                    updated_details.append(rbdid)

                elif item['rowaction'] == "delete":
                    rbdid = item['rbdid']
                    detail_to_delete = db.session.query(ServiceBillDetail).filter(ServiceBillDetail.rbdid == rbdid).one_or_none()
                    if detail_to_delete:
                        db.session.delete(detail_to_delete)
                        deleted_detail_ids.append(rbdid)


        if existing_head and updated_head_counts > 0 and (Customer_Code_changed or TCS_Net_Payable_changed):
            create_company_log_entry(
                db=db,
                ac_code=existing_head.Customer_Code,
                value=existing_head.TCS_Net_Payable,
                doc_no=existing_head.Doc_No,
                doc_date=existing_head.Date,
                # updated_doc_date=head_data.get("doc_date"),
                company_code=company_code,
                year_code=year_code,
                record_type='O',
                record_no=rbid,
                user_id=user_id,
                tran_type=tran_type,
                bank_ac=0,
                created_by=head_data.get('Created_By'),
                modified_by=head_data.get('Modified_By'),
                narration=""
            )

            create_company_log_entry(
                db=db,
                ac_code=head_data.get("Customer_Code"),
                value=head_data.get("TCS_Net_Payable"),
                doc_no=head_data.get("Doc_No"),
                doc_date=head_data.get("Date"),
                # updated_doc_date=head_data.get("doc_date"),
                company_code=company_code,
                year_code=year_code,
                record_type='N',
                record_no=rbid,
                user_id=user_id,
                tran_type=tran_type,
                bank_ac=0,
                created_by=head_data.get('Created_By'),
                modified_by=head_data.get('Modified_By'),
                narration=""
            )

        db.session.commit()

        # Fetch company parameters and generate ledger entries
        company_parameters = fetch_company_parameters(head_data['Company_Code'], head_data['Year_Code'])
        gledger_entries = generate_gledger_entries(head_data, company_parameters, detail_data)

        @copy_current_request_context
        def async_send_gledger():
            try:
                send_gledger_entries(head_data, gledger_entries, trans_type)
            except Exception as e:
                print(f"[Async Gledger Error] {e}")

        threading.Thread(target=async_send_gledger).start()
        
        # if gledger_entries:
        #     response = send_gledger_entries(head_data, gledger_entries, trans_type)
        #     if response.status_code != 200:
        #         db.session.rollback()
        #         return jsonify({"error": "Failed to create GLedger record", "details": response.text}), response.status_code

        return jsonify({
            "message": "Data updated successfully",
            "head": updated_head_counts,
            "created_details": service_bill_detail_schemas.dump(created_details),
            "updated_details": updated_details,
            "deleted_detail_ids": deleted_detail_ids
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


@app.route(API_URL + "/delete_data_by_rbid", methods=["DELETE"])
def delete_data_by_rbid():
    try:
        rbid = request.args.get('rbid')
        Company_Code = request.args.get('Company_Code')
        doc_no = request.args.get('doc_no')
        Year_Code = request.args.get('Year_Code')
        User_Id = request.args.get('User_Id', 0)

        if not all([rbid, Company_Code, doc_no, Year_Code, User_Id]):
            return jsonify({"error": "Missing required parameters"}), 400

        deleted_head = ServiceBillHead.query.filter_by(rbid=rbid).first()

        if deleted_head:
            deleted_detail_rows = ServiceBillDetail.query.filter_by(rbid=rbid).delete()

            deleted_head_rows = ServiceBillHead.query.filter_by(rbid=rbid).delete()

            create_company_log_entry(
                    db=db,
                    ac_code=deleted_head.Customer_Code,
                    value=deleted_head.TCS_Net_Payable,
                    doc_no=deleted_head.Doc_No,
                    doc_date=deleted_head.Date,
                    company_code=Company_Code,
                    year_code=Year_Code,
                    record_type='D', 
                    record_no=rbid,
                    user_id=User_Id, 
                    tran_type=trans_type, 
                    bank_ac=0,
                    created_by=deleted_head.Created_By,
                    modified_by=deleted_head.Modified_By
                )

            if deleted_detail_rows > 0 and deleted_head_rows > 0:
                query_params = {
                    'Company_Code': Company_Code,
                    'DOC_NO': doc_no,
                    'Year_Code': Year_Code,
                    'TRAN_TYPE': trans_type,
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
    
    
# Fetch the last record from the database by rbid
@app.route(API_URL + "/get-lastservicebilldata", methods=["GET"])
def get_lastservicebilldata():
    try:
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')
        if not all([Company_Code, Year_Code]):
            return jsonify({"error": "Missing required parameters"}), 400

        last_service_bill_head = ServiceBillHead.query.filter_by(Company_Code=Company_Code, Year_Code=Year_Code).order_by(ServiceBillHead.Doc_No.desc()).first()
        if not last_service_bill_head:
            return jsonify({"error": "No records found in ServiceBillHead table"}), 404

        rbid = last_service_bill_head.rbid
        additional_data = db.session.execute(text(SERVICE_BILL_DETAILS_QUERY), {"rbid": rbid})
        additional_data_rows = additional_data.fetchall()

        service_labels = [dict(row._mapping) for row in additional_data_rows]

        last_head_data = {
            **{column.name: getattr(last_service_bill_head, column.name) for column in last_service_bill_head.__table__.columns},
            **format_dates(last_service_bill_head)
        }

        last_details_data = [{column.name: getattr(detail, column.name) for column in detail.__table__.columns} for detail in ServiceBillDetail.query.filter_by(rbid=rbid).all()]

        response = {
            "last_head_data": last_head_data,
            "service_labels": service_labels,
            "last_details_data": last_details_data
        }

        return jsonify(response), 200
    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# Get first record from the database
@app.route(API_URL + "/get-firstservicebill-navigation", methods=["GET"])
def get_firstservicebill_navigation():
    try:
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')
        if not all([Company_Code, Year_Code]):
            return jsonify({"error": "Missing required parameters"}), 400

        first_service_bill_head = ServiceBillHead.query.filter_by(Company_Code=Company_Code, Year_Code=Year_Code).order_by(ServiceBillHead.Doc_No.asc()).first()
        if not first_service_bill_head:
            return jsonify({"error": "No records found in ServiceBillHead table"}), 404

        rbid = first_service_bill_head.rbid
        additional_data = db.session.execute(text(SERVICE_BILL_DETAILS_QUERY), {"rbid": rbid})
        additional_data_rows = additional_data.fetchall()

        service_labels = [dict(row._mapping) for row in additional_data_rows]

        first_head_data = {
            **{column.name: getattr(first_service_bill_head, column.name) for column in first_service_bill_head.__table__.columns},
            **format_dates(first_service_bill_head)
        }

        first_details_data = [{column.name: getattr(detail, column.name) for column in detail.__table__.columns} for detail in ServiceBillDetail.query.filter_by(rbid=rbid).all()]

        response = {
            "first_head_data": first_head_data,
            "service_labels": service_labels,
            "first_details_data": first_details_data
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# Get last record from the database
@app.route(API_URL + "/get-lastservicebill-navigation", methods=["GET"])
def get_lastservicebill_navigation():
    try:
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')
        if not all([Company_Code, Year_Code]):
            return jsonify({"error": "Missing required parameters"}), 400

        last_service_bill_head = ServiceBillHead.query.filter_by(Company_Code=Company_Code, Year_Code=Year_Code).order_by(ServiceBillHead.Doc_No.desc()).first()
        if not last_service_bill_head:
            return jsonify({"error": "No records found in ServiceBillHead table"}), 404

        rbid = last_service_bill_head.rbid
        additional_data = db.session.execute(text(SERVICE_BILL_DETAILS_QUERY), {"rbid": rbid})
        additional_data_rows = additional_data.fetchall()

        service_labels = [dict(row._mapping) for row in additional_data_rows]

        last_head_data = {
            **{column.name: getattr(last_service_bill_head, column.name) for column in last_service_bill_head.__table__.columns},
            **format_dates(last_service_bill_head)
        }

        last_details_data = [{column.name: getattr(detail, column.name) for column in detail.__table__.columns} for detail in ServiceBillDetail.query.filter_by(rbid=rbid).all()]

        response = {
            "last_head_data": last_head_data,
            "service_labels": service_labels,
            "last_details_data": last_details_data
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# Get previous record from the database
@app.route(API_URL + "/get-previousservicebill-navigation", methods=["GET"])
def get_previousservicebill_navigation():
    try:
        current_doc_no = request.args.get('currentDocNo')
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')
        if not all([Company_Code, Year_Code, current_doc_no]):
            return jsonify({"error": "Missing required parameters"}), 400

        previous_service_bill_head = ServiceBillHead.query.filter(ServiceBillHead.Doc_No < current_doc_no).order_by(ServiceBillHead.Doc_No.desc()).first()
        if not previous_service_bill_head:
            return jsonify({"error": "No previous records found"}), 404

        rbid = previous_service_bill_head.rbid
        additional_data = db.session.execute(text(SERVICE_BILL_DETAILS_QUERY), {"rbid": rbid})
        additional_data_rows = additional_data.fetchall()

        service_labels = [dict(row._mapping) for row in additional_data_rows]

        previous_head_data = {
            **{column.name: getattr(previous_service_bill_head, column.name) for column in previous_service_bill_head.__table__.columns},
            **format_dates(previous_service_bill_head)
        }

        previous_details_data = [{column.name: getattr(detail, column.name) for column in detail.__table__.columns} for detail in ServiceBillDetail.query.filter_by(rbid=rbid).all()]

        response = {
            "previous_head_data": previous_head_data,
            "service_labels": service_labels,
            "previous_details_data": previous_details_data
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# Get next record from the database
@app.route(API_URL + "/get-nextservicebill-navigation", methods=["GET"])
def get_nextservicebill_navigation():
    try:
        current_doc_no = request.args.get('currentDocNo')
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')
        if not all([Company_Code, Year_Code, current_doc_no]):
            return jsonify({"error": "Missing required parameters"}), 400

        next_service_bill_head = ServiceBillHead.query.filter(ServiceBillHead.Doc_No > current_doc_no).filter_by(Company_Code=Company_Code, Year_Code=Year_Code).order_by(ServiceBillHead.Doc_No.asc()).first()
        if not next_service_bill_head:
            return jsonify({"error": "No next records found"}), 404

        rbid = next_service_bill_head.rbid
        additional_data = db.session.execute(text(SERVICE_BILL_DETAILS_QUERY), {"rbid": rbid})
        additional_data_rows = additional_data.fetchall()

        service_labels = [dict(row._mapping) for row in additional_data_rows]

        next_head_data = {
            **{column.name: getattr(next_service_bill_head, column.name) for column in next_service_bill_head.__table__.columns},
            **format_dates(next_service_bill_head)
        }

        next_details_data = [{column.name: getattr(detail, column.name) for column in detail.__table__.columns} for detail in ServiceBillDetail.query.filter_by(rbid=rbid).all()]

        response = {
            "next_head_data": next_head_data,
            "service_labels": service_labels,
            "next_details_data": next_details_data
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    

@app.route(API_URL + "/get-next-bill-no", methods=["GET"])
def get_next_bill_no():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')

        if not company_code or not year_code:
            return jsonify({"error": "Missing 'Company_Code' or 'Year_Code' parameter"}), 400

        max_doc_no = db.session.query(func.max(ServiceBillHead.Doc_No)).filter_by(Company_Code=company_code, Year_Code=year_code).scalar()
        next_doc_no = max_doc_no + 1 if max_doc_no else 1
        response = {
            "next_doc_no": next_doc_no
        }

        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    
#GET Service Bill Report
#GET Service Bill Report
@app.route(API_URL+"/generating_ServiceBill_report", methods=["GET"])
def generating_ServiceBill_report():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        doc_no = request.args.get('doc_no')
        if not company_code or not year_code or not doc_no:
            return jsonify({"error": "Missing 'Company_Code' or 'Year_Code' parameter"}), 400

        query = ('''
                      
              SELECT        dbo.qryrentbillheaddetail.Doc_No, dbo.qryrentbillheaddetail.Date, dbo.qryrentbillheaddetail.DateConverted, dbo.qryrentbillheaddetail.Customer_Code, dbo.qryrentbillheaddetail.GstRateCode, dbo.qryrentbillheaddetail.Subtotal, 
                         dbo.qryrentbillheaddetail.CGSTRate, dbo.qryrentbillheaddetail.CGSTAmount, dbo.qryrentbillheaddetail.SGSTRate, dbo.qryrentbillheaddetail.SGSTAmount, dbo.qryrentbillheaddetail.IGSTRate, 
                         dbo.qryrentbillheaddetail.IGSTAmount, dbo.qryrentbillheaddetail.Total, dbo.qryrentbillheaddetail.Round_Off, dbo.qryrentbillheaddetail.Final_Amount, dbo.qryrentbillheaddetail.IsTDS, dbo.qryrentbillheaddetail.TDS_Ac, 
                         dbo.qryrentbillheaddetail.TDS_Per, dbo.qryrentbillheaddetail.TDSAmount, dbo.qryrentbillheaddetail.TDS, dbo.qryrentbillheaddetail.Company_Code, dbo.qryrentbillheaddetail.Year_Code, dbo.qryrentbillheaddetail.Branch_Code, 
                         dbo.qryrentbillheaddetail.Created_By, dbo.qryrentbillheaddetail.Modified_By, dbo.qryrentbillheaddetail.billno, dbo.qryrentbillheaddetail.cc, dbo.qryrentbillheaddetail.ta, dbo.qryrentbillheaddetail.rbid, 
                         dbo.qryrentbillheaddetail.Ac_Name_E, dbo.qryrentbillheaddetail.Address_E, dbo.qryrentbillheaddetail.Pincode, dbo.qryrentbillheaddetail.Gst_No, dbo.qryrentbillheaddetail.Email_Id, dbo.qryrentbillheaddetail.AC_Pan, 
                         dbo.qryrentbillheaddetail.Mobile_No, dbo.qryrentbillheaddetail.GSTStateCode, dbo.qryrentbillheaddetail.cityname, dbo.qryrentbillheaddetail.tdsname, dbo.qryrentbillheaddetail.GST_Name, dbo.qryrentbillheaddetail.gstrate, 
                         dbo.qryrentbillheaddetail.Detail_Id, dbo.qryrentbillheaddetail.Item_Code, dbo.qryrentbillheaddetail.itemdesc, dbo.qryrentbillheaddetail.Amount, dbo.qryrentbillheaddetail.ic, dbo.qryrentbillheaddetail.rbdid, 
                         dbo.qryrentbillheaddetail.itemname, dbo.qryrentbillheaddetail.TCS_Rate, dbo.qryrentbillheaddetail.TCS_Amt, dbo.qryrentbillheaddetail.TCS_Net_Payable, dbo.qryrentbillheaddetail.HSN, dbo.qryrentbillheaddetail.einvoiceno, 
                         dbo.qryrentbillheaddetail.ackno, dbo.qryrentbillheaddetail.CompanyPan, dbo.qryrentbillheaddetail.UnregisterGST, dbo.qryrentbillheaddetail.FSSAI, dbo.qryrentbillheaddetail.Tan_no, dbo.qryrentbillheaddetail.QRCode, 
                         dbo.qryrentbillheaddetail.billtostatename, dbo.company.Company_Name_E, dbo.company.City_E, dbo.company.State_E, dbo.company.PIN, dbo.company.Pan_No, 
                         dbo.tblvoucherheadaddress.AL1, dbo.tblvoucherheadaddress.AL2, dbo.tblvoucherheadaddress.AL3, dbo.tblvoucherheadaddress.AL4,dbo.company.GST,dbo.tblvoucherheadaddress.Other,dbo.company.FSSAI_No, 
                         dbo.company.TIN
FROM            dbo.qryrentbillheaddetail INNER JOIN
                         dbo.company ON dbo.qryrentbillheaddetail.Company_Code = dbo.company.Company_Code LEFT OUTER JOIN
                         dbo.tblvoucherheadaddress ON dbo.company.Company_Code = dbo.tblvoucherheadaddress.Company_Code
                WHERE   (qryrentbillheaddetail.Doc_No = :doc_no) AND 
                 (qryrentbillheaddetail.Company_Code = :company_code) AND (qryrentbillheaddetail.Year_Code = :year_code)
                                 '''
            )
        additional_data = db.session.execute(text(query), {"company_code": company_code,
                      "year_code": year_code, "doc_no": doc_no})

        additional_data_rows = additional_data.fetchall()
        
        all_data = [dict(row._mapping) for row in additional_data_rows]

                
        response = {
            "all_data": all_data
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

#GET data for the EInvoice genrattion
@app.route(API_URL + "/get_eWayBill_generationData_for_ServiceBill", methods=["GET"])
def get_eWayBill_generationData_for_ServiceBill():
    try:
        doc_no = request.args.get('doc_no')
        companyCode = request.args.get('Company_Code')
        yearCode = request.args.get('Year_Code')

        if not doc_no or not companyCode or not yearCode:
            return jsonify({
                "error": "Missing 'doc_no', 'Company_Code', 'Year_Code' parameter"
            }), 400

        query = '''
                 SELECT        dbo.NT_1qryEInvoiceServiceBill.Doc_No, CONVERT(varchar, dbo.NT_1qryEInvoiceServiceBill.doc_date, 103) AS doc_date, UPPER(dbo.NT_1qryEInvoiceServiceBill.BuyerGst_No) AS BuyerGst_No, 
                         UPPER(dbo.NT_1qryEInvoiceServiceBill.Buyer_Name) AS Buyer_Name, UPPER(dbo.NT_1qryEInvoiceServiceBill.Buyer_Address) AS Buyer_Address, UPPER(dbo.NT_1qryEInvoiceServiceBill.Buyer_City) AS Buyer_City, 
                         (CASE Buyer_Pincode WHEN 0 THEN 999999 ELSE Buyer_Pincode END) AS Buyer_Pincode, UPPER(dbo.NT_1qryEInvoiceServiceBill.Buyer_State_name) AS Buyer_State_name, 
                         dbo.NT_1qryEInvoiceServiceBill.Buyer_State_Code, dbo.NT_1qryEInvoiceServiceBill.Buyer_Phno, dbo.NT_1qryEInvoiceServiceBill.Buyer_Email_Id, 0 AS NETQNTL, 0 AS rate, dbo.NT_1qryEInvoiceServiceBill.CGSTAmount, 
                         dbo.NT_1qryEInvoiceServiceBill.SGSTAmount, dbo.NT_1qryEInvoiceServiceBill.IGSTAmount, dbo.NT_1qryEInvoiceServiceBill.TaxableAmount, ISNULL(dbo.NT_1qryEInvoiceServiceBill.CGSTRate, 0) AS CGSTRate, 
                         ISNULL(dbo.NT_1qryEInvoiceServiceBill.SGSTRate, 0) AS SGSTRate, ISNULL(dbo.NT_1qryEInvoiceServiceBill.IGSTRate, 0) AS IGSTRate, 0 AS Distance, '' AS LORRYNO, dbo.NT_1qryEInvoiceServiceBill.System_Name_E, 
                         dbo.NT_1qryEInvoiceServiceBill.HSN, dbo.NT_1qryEInvoiceServiceBill.GSTRate, dbo.NT_1qryEInvoiceServiceBill.IsService, dbo.company.Company_Name_E, dbo.company.Address_E, dbo.company.City_E, 
                         dbo.company.State_E, dbo.company.PIN, dbo.company.Mobile_No, dbo.company.Pan_No, dbo.company.GST, dbo.company.FSSAI_No, dbo.company.bankdetail, dbo.eway_bill.Account_Details, dbo.eway_bill.Mode_of_Payment, 
                         dbo.nt_1_companyparameters.GSTStateCode, dbo.accountingyear.year, dbo.NT_1qryEInvoiceServiceBill.Final_Amount AS billAmount, dbo.eway_bill.Branch
FROM            dbo.NT_1qryEInvoiceServiceBill LEFT OUTER JOIN
                         dbo.nt_1_companyparameters ON dbo.NT_1qryEInvoiceServiceBill.Company_Code = dbo.nt_1_companyparameters.Company_Code AND 
                         dbo.NT_1qryEInvoiceServiceBill.Year_Code = dbo.nt_1_companyparameters.Year_Code LEFT OUTER JOIN
                         dbo.eway_bill ON dbo.NT_1qryEInvoiceServiceBill.Company_Code = dbo.eway_bill.Company_Code LEFT OUTER JOIN
                         dbo.accountingyear ON dbo.NT_1qryEInvoiceServiceBill.Company_Code = dbo.accountingyear.Company_Code AND dbo.NT_1qryEInvoiceServiceBill.Year_Code = dbo.accountingyear.yearCode LEFT OUTER JOIN
                         dbo.company ON dbo.NT_1qryEInvoiceServiceBill.Company_Code = dbo.company.Company_Code
                 WHERE dbo.NT_1qryEInvoiceServiceBill.Company_Code = :companyCode
                   AND dbo.NT_1qryEInvoiceServiceBill.Year_Code = :yearCode
                   AND dbo.NT_1qryEInvoiceServiceBill.Doc_No = :doc_no

            '''

        result_data = db.session.execute(
            text(query),
            {
                "companyCode": companyCode,
                "yearCode": yearCode,
                "doc_no": doc_no,
            } 
        )

        rows = result_data.fetchall()
        all_data = [dict(row._mapping) for row in rows]

        for data_row in all_data:
            if 'doc_date' in data_row and data_row['doc_date']:
                try:
                    date_obj = datetime.strptime(data_row['doc_date'], "%d/%m/%Y")
                    data_row['doc_date'] = date_obj.strftime("%Y-%m-%d")
                except ValueError:
                    data_row['doc_date'] = None
            else:
                data_row['doc_date'] = None

        response = {
            "all_data": all_data
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        print(traceback.format_exc())
        return jsonify({
            "error": "Internal server error",
            "message": str(e)
        }), 500

