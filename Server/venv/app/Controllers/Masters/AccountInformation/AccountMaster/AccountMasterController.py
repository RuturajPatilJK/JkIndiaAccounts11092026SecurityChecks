import traceback
from flask import Flask, jsonify, request, send_from_directory
from app import app, db, socketio
import requests
from sqlalchemy import text, func
from sqlalchemy.exc import SQLAlchemyError
from datetime import timedelta
from datetime import datetime
import os
from sqlalchemy import or_
import json
# Import schemas from the schemas module
from app.models.Masters.AccountInformation.AccountMaster.AccountMasterModel import AccountMaster, AccountContact, AcGroups
from app.models.Masters.AccountInformation.AccountMaster.AccountMasterSchema import AccountMasterSchema, AccountContactSchema, AcGroupsSchema
from app.models.eBuySugarian.Users.EBuy_UserModel import EBuyUsers
from app.utils.CommonGLedgerFunctions import get_accoid
from app.models.Company.AccountingYearModels.AccountingYearModels import AccountingYear
from app.models.Reports.GLedeger.GLedgerModels import Gledger
from app.models.BusinessReleted.TenderPurchase.TenderPurchaseModels import TenderHead, TenderDetails 
from app.models.Masters.AccountInformation.CityMasterModels import CityMaster
from app.utils.CommonGLedgerFunctions import fetch_company_parameters,get_accoid
from app.utils.CommonCompanyLogs.CompanyLogsUtils import create_company_log_entry
import requests as http_requests 

# Get the base URL from environment variables
API_URL = os.getenv('API_URL')
API_URL_SERVER = os.getenv('API_URL_SERVER')
INTERNAL_API_KEY = os.getenv('INTERNAL_API_KEY')


# Define schemas
account_master_schema = AccountMasterSchema()
account_master_schemas = AccountMasterSchema(many=True)

account_contact_schema = AccountContactSchema()
account_contact_schemas = AccountContactSchema(many=True)


def format_dates(task):
    return {
        "Created_Date": task.Created_Date.strftime('%Y-%m-%d') if task.Created_Date else None,
        "Modified_Date": task.Modified_Date.strftime('%Y-%m-%d') if task.Modified_Date else None,
    }

# Global SQL Query
ACCOUNT_CONTACT_DETAILS_QUERY = '''
   SELECT        city.city_name_e AS cityname, dbo.nt_1_bsgroupmaster.group_Name_E AS groupcodename, State.State_Name
FROM            dbo.nt_1_accountmaster LEFT OUTER JOIN
                         dbo.nt_1_bsgroupmaster ON dbo.nt_1_accountmaster.bsid = dbo.nt_1_bsgroupmaster.bsid LEFT OUTER JOIN
                         dbo.nt_1_accontacts ON dbo.nt_1_accountmaster.accoid = dbo.nt_1_accontacts.accoid LEFT OUTER JOIN
                         dbo.gststatemaster AS State ON dbo.nt_1_accountmaster.GSTStateCode = State.State_Code LEFT OUTER JOIN
                         dbo.nt_1_citymaster AS city ON dbo.nt_1_accountmaster.cityid = city.cityid
    WHERE dbo.nt_1_accountmaster.accoid = :accoid
'''

def delete_acgroups_by_accoid(accoid):
    try:
        db.session.execute(
            text("DELETE FROM nt_1_acgroups WHERE accoid = :accoid"),
            {'accoid': accoid}
        )
        db.session.commit()
        return True
    except:
        db.session.rollback()
        return False

def get_accounting_year_start(company_code):
    accounting_year = AccountingYear.query.filter_by(Company_Code=company_code).order_by(AccountingYear.Start_Date.desc()).first()
    if accounting_year:
        return accounting_year.Start_Date
    else:
        raise ValueError(f"No accounting year found for Company Code: {company_code}")

#GET all Records From Account Master
@app.route(API_URL+"/getdata-accountmaster", methods=["GET"])
def getdata_accountmaster():
    try:
        company_code = request.args.get('Company_Code')
        if not company_code:
            return jsonify({"error": "Missing 'Company_Code' parameter"}), 400

        query = ('''SELECT dbo.nt_1_accountmaster.Ac_Code, dbo.nt_1_accountmaster.Ac_type, dbo.nt_1_accountmaster.Ac_Name_E, dbo.nt_1_accountmaster.Short_Name, dbo.nt_1_accountmaster.Commission, dbo.nt_1_accountmaster.Address_E, 
                  dbo.nt_1_citymaster.city_name_e, dbo.nt_1_accountmaster.Gst_No, dbo.nt_1_accountmaster.AC_Pan, dbo.nt_1_accountmaster.FSSAI, dbo.nt_1_accountmaster.adhar_no, dbo.nt_1_accountmaster.Mobile_No, 
                  dbo.nt_1_accountmaster.accoid
FROM     dbo.nt_1_accountmaster LEFT OUTER JOIN
                  dbo.nt_1_citymaster ON dbo.nt_1_accountmaster.cityid = dbo.nt_1_citymaster.cityid
                 where dbo.nt_1_accountmaster.Company_Code = :company_code AND (dbo.nt_1_accountmaster.Vendor_Approved <> 'N')
                 order by  dbo.nt_1_accountmaster.Ac_Code desc
                                 '''
            )
        additional_data = db.session.execute(text(query), {"company_code": company_code})

        additional_data_rows = additional_data.fetchall()
        
        all_data = [dict(row._mapping) for row in additional_data_rows]

        response = {
            "all_data": all_data
        }

        socketio.emit("getAll_accounts")
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


# Account Master Analytics report - accounts created within a date range
@app.route(API_URL + "/getAccountMasterByDateRange", methods=["GET"])
def get_accountmaster_by_date_range():
    try:
        company_code = request.args.get('company_code')
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')

        if not all([company_code, from_date, to_date]):
            return jsonify({"error": "Missing 'company_code', 'from_date' or 'to_date' parameter"}), 400

        query = ('''SELECT am.Ac_Code, am.Ac_type, am.Ac_Name_E, am.Group_Code, gm.group_Name_E,
                  am.CompanyPan, am.Gst_No, cm.city_name_e AS cityname, gst.State_Name,
                  am.GSTStateCode, am.Created_Date
FROM     dbo.nt_1_accountmaster am LEFT OUTER JOIN
                  dbo.nt_1_citymaster cm ON am.cityid = cm.cityid LEFT OUTER JOIN
                  dbo.nt_1_bsgroupmaster gm ON am.Group_Code = gm.group_Code AND am.Company_Code = gm.Company_Code LEFT OUTER JOIN
                  dbo.gststatemaster gst ON am.GSTStateCode = gst.State_Code
                 WHERE am.Company_Code = :company_code
                   AND am.Created_Date >= :from_date AND am.Created_Date <= :to_date
                 ORDER BY am.Ac_Code DESC
                                 '''
            )
        result = db.session.execute(text(query), {
            "company_code": company_code,
            "from_date": from_date,
            "to_date": to_date,
        })

        data = [dict(row._mapping) for row in result.fetchall()]

        return jsonify({"data": data}), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


# Get data by the particular Ac_Code
@app.route(API_URL + "/getaccountmasterByid", methods=["GET"])
def getaccountmasterByid():
    try:
        ac_code = request.args.get('Ac_Code')
        company_code = request.args.get('Company_Code')
        if not all([company_code, ac_code]):
            return jsonify({"error": "Missing required parameters"}), 400

        account_master = AccountMaster.query.filter_by(Ac_Code=ac_code, company_code=company_code).first()
        if not account_master:
            return jsonify({"error": "No records found"}), 404

        accoid = account_master.accoid
        ac_code = account_master.Ac_Code
        additional_data = db.session.execute(text(ACCOUNT_CONTACT_DETAILS_QUERY), {"accoid": accoid})
        additional_data_row = additional_data.fetchone()  # Fetch only the first row

        group_codes_data = AcGroups.query.filter_by(Ac_Code=ac_code, Company_Code=company_code).all()
        group_codes = [group.Group_Code for group in group_codes_data] if group_codes_data else []


        account_master_data = {column.name: getattr(account_master, column.name) for column in account_master.__table__.columns}

        account_labels = dict(additional_data_row._mapping) if additional_data_row else {}

        detail_records = AccountContact.query.filter_by(accoid=accoid).all()
        detail_data = [{column.name: getattr(detail_record, column.name) for column in detail_record.__table__.columns} for detail_record in detail_records]
        account_master_data.update(format_dates(account_master))

        response = {
            "account_master_data": account_master_data,
            "account_detail_data": detail_data,
            "account_labels": account_labels,
             "group_codes": group_codes
        }
        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


# Risk Management 

@app.route(API_URL + "/update-account-risk-limit", methods=["PUT"])
def update_account_risk_limit():
    try:
        data = request.get_json() or {}
        accoid = data.get('accoid')
        limit_by = data.get('Limit_By')
        bal_limit = data.get('Bal_Limit')

        if not accoid:
            return jsonify({"error": "Missing 'accoid' parameter"}), 400

        account = AccountMaster.query.filter_by(accoid=accoid).first()
        if not account:
            return jsonify({"error": "Account not found"}), 404

        account.Limit_By = limit_by
        account.Bal_Limit = bal_limit
        db.session.commit()

        return jsonify({
            "message": "Risk limit updated successfully",
            "accoid": accoid,
            "Limit_By": account.Limit_By,
            "Bal_Limit": float(account.Bal_Limit) if account.Bal_Limit is not None else None,
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


# Our Party Selection (eBuySugar Hub) - looks up accounts by PAN so the user
# can bulk-toggle Our_Party / Show_Ledger for just those parties. Requires a
# PAN (full or partial) rather than dumping the whole account master (~20k
# rows for this company) on first load.
@app.route(API_URL + "/get-accountmaster-party-selection-list", methods=["GET"])
def get_accountmaster_party_selection_list():
    try:
        company_code = request.args.get('Company_Code') or request.args.get('company_code')
        if not company_code:
            return jsonify({"error": "Missing 'Company_Code' parameter"}), 400

        pan = (request.args.get('pan') or request.args.get('Pan') or '').strip()
        if not pan:
            return jsonify({"all_data": []}), 200

        query = '''
            SELECT accoid, Ac_Code, Ac_Name_E, CompanyPan,
                   ISNULL(Our_Party, 'N') AS Our_Party,
                   ISNULL(Show_Ledger, 'N') AS Show_Ledger
            FROM dbo.nt_1_accountmaster
            WHERE Company_Code = :company_code AND CompanyPan LIKE :pan_pattern
            ORDER BY Ac_Code
        '''
        rows = db.session.execute(
            text(query),
            {"company_code": company_code, "pan_pattern": f"%{pan}%"}
        ).fetchall()
        all_data = [dict(row._mapping) for row in rows]

        return jsonify({"all_data": all_data}), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


# Our Party Selection (eBuySugar Hub) - persist the toggled Our_Party / Show_Ledger
# flags for however many accounts were changed on that screen in one request.
@app.route(API_URL + "/bulk-update-our-party-show-ledger", methods=["PUT"])
def bulk_update_our_party_show_ledger():
    try:
        data = request.get_json() or {}
        updates = data.get('updates') or []

        if not updates:
            return jsonify({"error": "Missing 'updates' list"}), 400

        updated_count = 0
        for item in updates:
            accoid = item.get('accoid')
            if not accoid:
                continue
            db.session.query(AccountMaster).filter_by(accoid=accoid).update({
                'Our_Party': item.get('Our_Party') or 'N',
                'Show_Ledger': item.get('Show_Ledger') or 'N',
            })
            updated_count += 1

        db.session.commit()
        return jsonify({"message": "Updated successfully", "updated_count": updated_count}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


@app.route(API_URL + "/getNextAcCode_AccountMaster", methods=["GET"])
def getNextAcCode_AccountMaster():
    try:
        Company_Code = request.args.get('Company_Code')

        if not all([Company_Code]):
            return jsonify({"error": "Missing required parameters"}), 400

        # Fetch the maximum unit_code for the given Company_Code
        max_ac_code = db.session.query(func.max(AccountMaster.Ac_Code)).filter_by(company_code=Company_Code).scalar()

        # if max_ac_code is None:
        #     next_ac_code = 101  
        # elif max_ac_code < 100:
        #     next_ac_code = 101 
        # else:
        #     next_ac_code = max_ac_code + 1  

        next_ac_code = max_ac_code + 1 if max_ac_code else 1

        response = {
            "next_ac_code": next_ac_code
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


# Fetch the last record from the database by accoid
@app.route(API_URL + "/get-lastaccountdata", methods=["GET"])
def get_lastaccountMasterdata():
    try:
        company_code = request.args.get('Company_Code')

        if not all([company_code]):
            return jsonify({"error": "Missing required parameters"}), 400

        last_account_master = AccountMaster.query.filter_by(company_code=company_code).order_by(AccountMaster.Ac_Code.desc()).first()

        if not last_account_master:
            return jsonify({"error": "No records found"}), 404

        accoid = last_account_master.accoid
        ac_code = last_account_master.Ac_Code
        additional_data = db.session.execute(text(ACCOUNT_CONTACT_DETAILS_QUERY), {"accoid": accoid})
        additional_data_row = additional_data.fetchone()  # Fetch only the first row


        account_master_data = {column.name: getattr(last_account_master, column.name) for column in last_account_master.__table__.columns}

        account_labels = dict(additional_data_row._mapping) if additional_data_row else {}

        detail_records = AccountContact.query.filter_by(accoid=accoid).all()

        detail_data = [{column.name: getattr(detail_record, column.name) for column in detail_record.__table__.columns} for detail_record in detail_records]

        account_master_data.update(format_dates(last_account_master))

        group_codes_data = AcGroups.query.filter_by(Ac_Code=ac_code, Company_Code=company_code).all()
        group_codes = [group.Group_Code for group in group_codes_data] if group_codes_data else []
        response = {
            "account_master_data": account_master_data,
            "account_detail_data": detail_data,
            "account_labels": account_labels,
            "group_codes": group_codes
        }
        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# Get first record from the database
@app.route(API_URL + "/get-firstaccount-navigation", methods=["GET"])
def get_firstaccountMaster_navigation():
    try:
        company_code = request.args.get('Company_Code')
    
        if not all([company_code]):
            return jsonify({"error": "Missing required parameters"}), 400

        first_account_master = AccountMaster.query.filter_by(company_code=company_code).order_by(AccountMaster.Ac_Code.asc()).first()

        if not first_account_master:
            return jsonify({"error": "No records found"}), 404

        accoid = first_account_master.accoid
        ac_code = first_account_master.Ac_Code
        additional_data = db.session.execute(text(ACCOUNT_CONTACT_DETAILS_QUERY), {"accoid": accoid})
        additional_data_row = additional_data.fetchone()  # Fetch only the first row

        account_master_data = {column.name: getattr(first_account_master, column.name) for column in first_account_master.__table__.columns}

        account_labels = dict(additional_data_row._mapping) if additional_data_row else {}

        detail_records = AccountContact.query.filter_by(accoid=accoid).all()

        group_codes_data = AcGroups.query.filter_by(Ac_Code=ac_code, Company_Code=company_code).all()
        group_codes = [group.Group_Code for group in group_codes_data] if group_codes_data else []

        detail_data = [{column.name: getattr(detail_record, column.name) for column in detail_record.__table__.columns} for detail_record in detail_records]
        account_master_data.update(format_dates(first_account_master))

        response = {
            "account_master_data": account_master_data,
            "account_detail_data": detail_data,
            "account_labels": account_labels,
             "group_codes": group_codes
        }
        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# Get previous record from the database
@app.route(API_URL + "/get-previousaccount-navigation", methods=["GET"])
def get_previousaccountMaster_navigation():
    try:
        current_ac_code = request.args.get('current_ac_code')
        company_code = request.args.get('Company_Code')
        

        if not all([current_ac_code, company_code]):
            return jsonify({"error": "Missing required parameters"}), 400

        previous_account_master = AccountMaster.query.filter(AccountMaster.Ac_Code < current_ac_code).filter_by(company_code=company_code).order_by(AccountMaster.Ac_Code.desc()).first()

        if not previous_account_master:
            return jsonify({"error": "No previous records found"}), 404

        accoid = previous_account_master.accoid
        ac_code = previous_account_master.Ac_Code
        additional_data = db.session.execute(text(ACCOUNT_CONTACT_DETAILS_QUERY), {"accoid": accoid})
        additional_data_row = additional_data.fetchone()  # Fetch only the first row

        account_master_data = {column.name: getattr(previous_account_master, column.name) for column in previous_account_master.__table__.columns}

        account_labels = dict(additional_data_row._mapping) if additional_data_row else {}

        detail_records = AccountContact.query.filter_by(accoid=accoid).all()

        group_codes_data = AcGroups.query.filter_by(Ac_Code=ac_code, Company_Code=company_code).all()
        group_codes = [group.Group_Code for group in group_codes_data] if group_codes_data else []

        detail_data = [{column.name: getattr(detail_record, column.name) for column in detail_record.__table__.columns} for detail_record in detail_records]
        account_master_data.update(format_dates(previous_account_master))

        response = {
            "account_master_data": account_master_data,
            "account_detail_data": detail_data,
            "account_labels": account_labels,
             "group_codes": group_codes
        }
        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# Get next record from the database
@app.route(API_URL + "/get-nextaccount-navigation", methods=["GET"])
def get_nextaccountMaster_navigation():
    try:
        current_ac_code = request.args.get('current_ac_code')
        company_code = request.args.get('Company_Code')
        

        if not all([current_ac_code, company_code]):
            return jsonify({"error": "Missing required parameters"}), 400

        next_account_master = AccountMaster.query.filter(AccountMaster.Ac_Code > current_ac_code).filter_by(company_code=company_code).order_by(AccountMaster.Ac_Code.asc()).first()

        if not next_account_master:
            return jsonify({"error": "No next records found"}), 404

        accoid = next_account_master.accoid
        ac_code = next_account_master.Ac_Code
        additional_data = db.session.execute(text(ACCOUNT_CONTACT_DETAILS_QUERY), {"accoid": accoid})
        additional_data_row = additional_data.fetchone()  # Fetch only the first row

        account_master_data = {column.name: getattr(next_account_master, column.name) for column in next_account_master.__table__.columns}

        account_labels = dict(additional_data_row._mapping) if additional_data_row else {}

        detail_records = AccountContact.query.filter_by(accoid=accoid).all()

        group_codes_data = AcGroups.query.filter_by(Ac_Code=ac_code, Company_Code=company_code).all()
        group_codes = [group.Group_Code for group in group_codes_data] if group_codes_data else []

        detail_data = [{column.name: getattr(detail_record, column.name) for column in detail_record.__table__.columns} for detail_record in detail_records]
        account_master_data.update(format_dates(next_account_master))

        response = {
            "account_master_data": account_master_data,
            "account_detail_data": detail_data,
            "account_labels": account_labels,
             "group_codes": group_codes
        }
        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

@app.route(API_URL + "/insert-accountmaster", methods=["POST"])
def insert_accountmaster():
    tranType = "OP"
    yearCode = 1

    def create_gledger_entry(data, amount, drcr, ac_code, accoid):
        try:
            start_date = get_accounting_year_start(data['company_code'])
            doc_date = (start_date - timedelta(days=1)).strftime('%Y-%m-%d')
        except ValueError as e:
            raise Exception(f"Failed to retrieve accounting year: {str(e)}")
        return {
            "TRAN_TYPE": tranType,
            "DOC_NO": new_master.Ac_Code,
            "DOC_DATE": doc_date,
            "AC_CODE": ac_code,
            "AMOUNT": amount,
            "COMPANY_CODE": data['company_code'],
            "YEAR_CODE": yearCode,
            "ORDER_CODE": 12,
            "DRCR": drcr,
            "UNIT_Code": '',
            "NARRATION": "Opening Balance",
            "TENDER_ID": 0,
            "TENDER_ID_DETAIL": 0,
            "VOUCHER_ID": 0,
            "DRCR_HEAD": 0,
            "ADJUSTED_AMOUNT": 0,
            "Branch_Code": 0,
            "SORT_TYPE": tranType,
            "SORT_NO": new_master.Ac_Code,
            "vc": 0,
            "progid": 0,
            "tranid": 0,
            "saleid": 0,
            "ac": accoid
        }

    def add_gledger_entry(entries, data, amount, drcr, ac_code, accoid):
        if amount > 0:
            entries.append(create_gledger_entry(data, amount, drcr, ac_code, accoid))

    try:
        data = request.get_json()
        master_data = data['master_data']
        contact_data = data['contact_data']
        gst_no = master_data.get('Gst_No')
        company_code = request.args.get('company_code')

        try:
            company_code = int(master_data['company_code'])
        except (KeyError, TypeError, ValueError):
            return jsonify({"error": "company_code is required and must be an integer"}), 400
        #  Step 1: Check if AccountMaster already exists with same Ac_Code
        try:
            with db.session.begin():
                if gst_no:
                    existing_master = AccountMaster.query.filter_by(Gst_No=gst_no).first()
                    if existing_master:
                        input_ac_code = master_data.get('Ac_Code')
                        if existing_master.Ac_Code == input_ac_code:
                            accoid = existing_master.accoid
                            try:
                                user = EBuyUsers.query.filter_by(gst_no=gst_no).first()
                                if user:
                                    user.accoid = accoid
                                    user.ac_code = existing_master.Ac_Code
                                    existing_master.user_id = user.user_id
                            except Exception as e:
                                print(str(e))
                            return jsonify({
                                "message": "User updated successfully with existing AccountMaster",
                                "accoid": accoid
                            }), 200
        except Exception as e:
            print("Error checking existing AccountMaster:", str(e))

        #  Step 2: Insert new AccountMaster + Contact
        with db.session.begin():
            max_ac_code = db.session.query(func.max(AccountMaster.Ac_Code)).filter(AccountMaster.company_code == company_code).scalar() or 0
            master_data['Ac_Code'] = max_ac_code + 1

            new_master = AccountMaster(**master_data)
            db.session.add(new_master)
            db.session.flush()

            createdDetails = []
            updatedDetails = []
            deletedDetailIds = []

            max_person_id = db.session.query(func.max(AccountContact.PersonId)).scalar() or 0
            for item in contact_data:
                item['Ac_Code'] = new_master.Ac_Code
                item['accoid'] = new_master.accoid

                if 'rowaction' in item:
                    if item['rowaction'] == "add":
                        del item['rowaction']
                        item['PersonId'] = max_person_id + 1
                        db.session.add(AccountContact(**item))
                        createdDetails.append(item)
                        max_person_id += 1

                    elif item['rowaction'] == "update":
                        id = item['id']
                        update_values = {k: v for k, v in item.items() if k not in ('id', 'rowaction', 'accoid')}
                        db.session.query(AccountContact).filter_by(id=id).update(update_values)
                        updatedDetails.append(id)

                    elif item['rowaction'] == "delete":
                        id = item['id']
                        contact_to_delete = db.session.query(AccountContact).filter_by(id=id).one_or_none()
                        if contact_to_delete:
                            db.session.delete(contact_to_delete)
                            deletedDetailIds.append(id)

        #  Step 3: Optional EBuyUsers Update (if exists)
        try:
            user = EBuyUsers.query.filter_by(gst_no=gst_no).first()
            if user:
                with db.session.begin():
                    user.accoid = new_master.accoid
                    user.ac_code = new_master.Ac_Code
                    new_master.user_id = user.user_id
        except Exception as e:
            print(" Skipping EBuyUsers update. Reason:", str(e))

        try:
            Amount = float(master_data.get('Opening_Balance', 0) or 0)
            gledger_entries = []
            if Amount > 0:
                add_gledger_entry(gledger_entries, master_data, Amount,new_master.Drcr, new_master.Ac_Code, new_master.accoid)

                query_params = {
                    'Company_Code': master_data['company_code'],
                    'DOC_NO': new_master.Ac_Code,
                    'Year_Code': yearCode,
                    'TRAN_TYPE': tranType,
                }

                response = requests.post(API_URL_SERVER + "/create-Record-gLedger", params=query_params, json=gledger_entries, cookies=request.cookies, headers={'X-CSRF-TOKEN': request.cookies.get('csrf_access_token', '')})
                if response.status_code != 201:
                    print("gLedger creation failed:", response.text)

        except Exception as e:
            print("gLedger API call failed:", str(e))
            

        # Socket Emit
        socketio.emit('account_added', json.loads(json.dumps({
                'head': account_master_schema.dump(new_master),
                'addedDetails': account_contact_schemas.dump(contact_data),
                'updatedDetails': updatedDetails,
                'deletedDetailIds': deletedDetailIds
            }, default=str)))

        return jsonify({
            "message": "Data inserted successfully",
            "AccountMaster": account_master_schema.dump(new_master),
            "AccountContacts": account_contact_schemas.dump(contact_data),
            "updatedDetails": updatedDetails,
            "deletedDetailIds": deletedDetailIds
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

@app.route(API_URL + "/update-accountmaster", methods=["PUT"])
def update_accountmaster():
    tranType = "OP"
    yearCode = 1

    def create_gledger_entry(data, amount, drcr, ac_code, accoid):
        return {
            "TRAN_TYPE": tranType,
            "DOC_NO": updatedAcCode,
            "DOC_DATE": "03/31/2020",
            "AC_CODE": ac_code,
            "AMOUNT": amount,
            "COMPANY_CODE": data['company_code'],
            "YEAR_CODE": yearCode,
            "ORDER_CODE": 12,
            "DRCR": drcr,
            "UNIT_Code": '',
            "NARRATION": "Opening Balance",
            "TENDER_ID": 0,
            "TENDER_ID_DETAIL": 0,
            "VOUCHER_ID": 0,
            "DRCR_HEAD": 0,
            "ADJUSTED_AMOUNT": 0,
            "Branch_Code": 0,
            "SORT_TYPE": tranType,
            "SORT_NO": updatedAcCode,
            "vc": 0,
            "progid": 0,
            "tranid": 0,
            "saleid": 0,
            "ac": accoid,
            "CA_NARRATION": "Opening Balance"
        }

    def add_gledger_entry(entries, data, amount, drcr, ac_code, accoid):
        if amount > 0:
            entries.append(create_gledger_entry(data, amount, drcr, ac_code, accoid))

    try:
        accoid = request.args.get('accoid')
        if not accoid:
            return jsonify({"error": "Missing 'accoid' parameter"}), 400

        data = request.get_json()
        master_data = data['master_data']
        contact_data = data['contact_data']

        created_contacts = []
        updated_contacts = []
        deleted_contact_ids = []

        company_code = master_data.get('company_code')
        user_id = master_data.get('User_Id')
        tran_type = "AM"

        if 'User_Id' in master_data:
            del master_data['User_Id']

        existing_head = AccountMaster.query.filter_by(accoid=accoid).first()
        if not existing_head:
            return jsonify({"error": "Accountmaster with the given accoid not found"}), 404

        groupCode_changed = existing_head.Group_Code != int(master_data.get('Group_Code', existing_head.Group_Code) or 0)
        saleTDSChanged = str(existing_head.TDSApplicable) != str(master_data.get('TDSApplicable', existing_head.TDSApplicable) or '')
        purchaseTDSChanged = str(existing_head.PurchaseTDSApplicable) != str(master_data.get('PurchaseTDSApplicable', existing_head.PurchaseTDSApplicable) or '')

        # 🔹 Perform DB updates inside single transaction
        updatedHeadCount = db.session.query(AccountMaster).filter_by(accoid=accoid).update(master_data)
        updated_account_master = db.session.query(AccountMaster).filter_by(accoid=accoid).one()
        updatedAcCode = updated_account_master.Ac_Code

        max_person_id = db.session.query(func.max(AccountContact.PersonId)).scalar() or 0

        for item in contact_data:
            if 'rowaction' in item:
                if item['rowaction'] == "add":
                    del item['rowaction']
                    item['Ac_Code'] = updatedAcCode
                    item['PersonId'] = max_person_id + 1
                    item['accoid'] = accoid
                    db.session.add(AccountContact(**item))
                    created_contacts.append(item)
                    max_person_id += 1

                elif item['rowaction'] == "update":
                    contact_id = item['id']
                    update_data = {k: v for k, v in item.items() if k not in ('id', 'rowaction', 'accoid')}
                    db.session.query(AccountContact).filter_by(id=contact_id).update(update_data)
                    updated_contacts.append(contact_id)

                elif item['rowaction'] == "delete":
                    contact_id = item['id']
                    contact_to_delete = db.session.query(AccountContact).filter_by(id=contact_id).one_or_none()
                    if contact_to_delete:
                        db.session.delete(contact_to_delete)
                        deleted_contact_ids.append(contact_id)


        current_date = datetime.now().strftime("%Y-%m-%d")

        # 🔹 Log only if relevant fields changed
        if existing_head and updatedHeadCount > 0 and (groupCode_changed or saleTDSChanged or purchaseTDSChanged):
            create_company_log_entry(
                db=db,
                ac_code=existing_head.Ac_Code,
                value=0.0,
                doc_no=existing_head.Ac_Code,
                doc_date=current_date,
                company_code=company_code,
                year_code=0,
                record_type='O',
                record_no=accoid,
                user_id=user_id,
                tran_type=tran_type,
                bank_ac=0,
                created_by=getattr(existing_head, 'Created_By', None),
                modified_by=getattr(existing_head, 'Modified_By', None),
                narration="",
                do_no=0,
                quintal=0,
                rate=0.0,
                sale_tds=0.0,
                SaleTDSApplicable=existing_head.TDSApplicable,
                PurchaseTDSApplicable=existing_head.PurchaseTDSApplicable,
            )

            create_company_log_entry(
                db=db,
                ac_code=master_data.get("Ac_Code"),
                value=0.0,
                doc_no=updatedAcCode,
                doc_date=current_date,
                company_code=company_code,
                year_code=0,
                record_type='N',
                record_no=accoid,
                user_id=user_id,
                tran_type=tran_type,
                bank_ac=0,
                created_by=master_data.get('Created_By'),
                modified_by=master_data.get('Modified_By'),
                narration="",
                do_no=0,
                quintal=0,
                rate=0.0,
                sale_tds=0.0,
                SaleTDSApplicable=master_data.get('TDSApplicable'),
                PurchaseTDSApplicable=master_data.get('PurchaseTDSApplicable'),
            )

        db.session.commit() 

        # 🔹 Handle gLedger separately
        try:
            amount_raw = str(master_data.get("Opening_Balance", "0")).strip()
            Amount = float(amount_raw) if amount_raw else 0.0

            gledger_entries = []

            
            ac_code = master_data['Ac_Code']
            accoid = get_accoid(ac_code, master_data['company_code'])
            query_params = {
            'Company_Code': master_data['company_code'],
            'DOC_NO': updatedAcCode,
            'Year_Code': yearCode,
            'TRAN_TYPE': tranType,
        }

            # Make the external request
            delete_res = requests.delete(API_URL_SERVER + "/delete-Record-gLedger", params=query_params, cookies=request.cookies, headers={'X-CSRF-TOKEN': request.cookies.get('csrf_access_token', '')})

            if delete_res.status_code not in (200, 204):
                print("gLedger DELETE failed:", delete_res.text)

            if Amount > 0:
                ac_code = master_data['Ac_Code']
                accoid = get_accoid(ac_code, master_data['company_code'])
                add_gledger_entry(gledger_entries, master_data, Amount, master_data['Drcr'], ac_code, accoid)

                query_params = {
                    'Company_Code': master_data['company_code'],
                    'DOC_NO': updatedAcCode,
                    'Year_Code': yearCode,
                    'TRAN_TYPE': tranType,
                }

                response = requests.post(API_URL_SERVER + "/create-Record-gLedger", params=query_params, json=gledger_entries, cookies=request.cookies, headers={'X-CSRF-TOKEN': request.cookies.get('csrf_access_token', '')})

                if response.status_code != 201:
                    print("gLedger creation failed:", response.text)
                    return jsonify({"error": "Failed to create gLedger record", "details": response.json()}), response.status_code

        except Exception as e:
            print("⚠️ gLedger API error:", str(e))
            return jsonify({"error": "gLedger API failed", "message": str(e)}), 500

        socketio.emit("account_updated", {"accoid": accoid})

        return jsonify({
            "message": "Data updated successfully",
            "created_contacts": account_contact_schemas.dump(created_contacts),
            "updated_contacts": updated_contacts,
            "deleted_contact_ids": deleted_contact_ids
        }), 200

    except Exception as e:
        print("Traceback:\n", traceback.format_exc())
        db.session.rollback()
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


# Delete record from database based on Ac_Code
@app.route(API_URL + "/delete_accountmaster", methods=["DELETE"])
def delete_accountmaster():
    yearCode = 1
    tranType="OP"
    try:
        accoid = request.args.get('accoid')
        Company_Code = request.args.get('company_code')
        doc_no = request.args.get('Ac_Code')
        if not all ([accoid,Company_Code,doc_no]):
            return jsonify({"error": "Missing required parameter"}), 400

        with db.session.begin():
            db.session.execute(
                text("DELETE FROM ebuySugar_Userdocuments WHERE accoid = :accoid"),
                {'accoid': accoid}
            )
            deleted_contact_rows = AccountContact.query.filter_by(accoid=accoid).delete()
            deleted_master_rows = AccountMaster.query.filter_by(accoid=accoid).delete()

        if deleted_contact_rows > 0 and deleted_master_rows > 0:
            # Delete logo file from disk if exists
            try:
                upload_base = os.getenv('UPLOAD_FOLDER', 'Uploads')
                logo_dir = os.path.join(upload_base, 'accountmasterlogo')
                if os.path.isdir(logo_dir):
                    for logo_file in os.listdir(logo_dir):
                        if logo_file.rsplit('.', 1)[0] == str(doc_no):
                            os.remove(os.path.join(logo_dir, logo_file))
                            break
            except Exception:
                pass

            _trading_url = os.getenv('TRADING_API_URL', '').rstrip('/')
            if _trading_url:
                try:
                    requests.delete(
                        f"{_trading_url}/internal/mill-logo/{doc_no}",
                        headers={'X-Internal-Api-Key': INTERNAL_API_KEY},
                        timeout=5,
                    )
                except Exception:
                    pass

            query_params = {
                'Company_Code': Company_Code,
                'DOC_NO': doc_no,
                'Year_Code': yearCode,
                'TRAN_TYPE': tranType,
            }

            # Make the external request
            response = requests.delete(API_URL_SERVER+"/delete-Record-gLedger", params=query_params, cookies=request.cookies, headers={'X-CSRF-TOKEN': request.cookies.get('csrf_access_token', '')})

            if response.status_code != 200:
                raise Exception("Failed to create record in gLedger")

            return jsonify({
            "message": f"Deleted successfully"
        }), 200

        db.session.commit()

        return jsonify({
            "message": f"Deleted {deleted_master_rows} master row(s) and {deleted_contact_rows} contact row(s) successfully"
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    
@app.route(API_URL + "/getBy_GstNo", methods=["GET"])
def getBy_GstNo():
    try:
        gst_no = request.args.get('gst_no')

        if not gst_no:
            return jsonify({"error": "Missing required parameter: gst_no"}), 400

        # Fetch records from EBuyUsers matching the provided gst_no
        e_buy_user_records = EBuyUsers.query.filter_by(gst_no=gst_no).all()
        account_master_records = AccountMaster.query.filter_by(Gst_No=gst_no).all()

        if not e_buy_user_records and not account_master_records:
            return jsonify({"error": "No records found for the provided gst_no"}), 404

        account_master_data = [
            {column.name: getattr(record, column.name) for column in record.__table__.columns}
            for record in account_master_records
        ]
        e_buy_user_data = [
            {column.name: getattr(record, column.name) for column in record.__table__.columns}
            for record in e_buy_user_records
        ]

        response = {
            "accountMasterData": account_master_data,
            "eBuyUserData": e_buy_user_data
        }

        return jsonify(response), 200

    except Exception as e:
        print("Traceback:", traceback.format_exc())
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    
@app.route(API_URL + '/create-multiple-acgroups', methods=['POST'])
def create_multiple_acgroups():
    try:
        data = request.get_json()
        acGroups_data = data.get('acGroups')
        accoid = data.get("accoid")
        if accoid:
            delete_acgroups_by_accoid(accoid)
        # Check if there is anything to process
        if not acGroups_data:
            return jsonify({'message': 'No group data provided'}), 204  

        responses = []

        # Delete existing groups if any (assuming `accoid` is provided and correct)
        

        # Process each group entry
        for group_data in acGroups_data:
            ac_code = group_data.get('Ac_Code')
            group_code = group_data.get('Group_Code')
            company_code = group_data.get('Company_Code')

            # Validate required parameters
            if not all([ac_code, group_code, company_code]):
                responses.append({'error': 'Missing required fields for one or more entries'})
                continue

            # Find the corresponding AccountMaster entry
            account_master = AccountMaster.query.filter_by(Ac_Code=ac_code, company_code=company_code).first()
            if not account_master:
                responses.append({'error': f'No AccountMaster record found with Ac_Code {ac_code} and Company_Code {company_code}'})
                continue

            # Create and add the new AcGroups record
            new_acgroup = AcGroups(Group_Code=group_code, Company_Code=company_code, accoid=account_master.accoid, Ac_Code = ac_code)
            db.session.add(new_acgroup)
            responses.append({
                'message': 'AcGroup created successfully',
                'AcGroup': {
                    'Group_Code': group_code,
                    'Company_Code': company_code,
                    'accoid': account_master.accoid
                }
            })

        # Commit changes to the database
        db.session.commit()
        return jsonify(responses), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Internal server error', 'message': str(e)}), 500

#Check API This Account Code is Already use in the GLedger and Tender
@app.route(API_URL + '/check-AcCode-usage', methods=['GET'])
def check_AcCode_usage():
    try:
        ac_code = request.args.get('Ac_Code')
        company_code = request.args.get('Company_Code')
        accoid = request.args.get('accoid')

        if not all([ac_code, company_code, accoid]):
            return jsonify({"error": "Missing required parameters"}), 400

      
        gledger_entry = Gledger.query.filter_by(
            AC_CODE=ac_code,
            COMPANY_CODE=company_code,
            ac=accoid
        ).first()
        if gledger_entry:
            return jsonify({'isUsed': True, 'message': 'Cannot Delete this is use in Ledger.'}), 200

    
        tender_head_entry = TenderHead.query.filter(
            TenderHead.Company_Code == company_code,
            or_(
                TenderHead.Mill_Code == ac_code,
                TenderHead.Payment_To == ac_code,
                TenderHead.Tender_From == ac_code,
                TenderHead.Tender_DO == ac_code,
                TenderHead.Voucher_By == ac_code,
                TenderHead.mc == accoid,
                TenderHead.pt == accoid,
                TenderHead.tf == accoid,
                TenderHead.td == accoid,
                TenderHead.vb == accoid,
                TenderHead.bk == accoid
            )
        ).first()
        if tender_head_entry:
            return jsonify({'isUsed': True, 'message': 'Cannot Delete this is use in Tender.'}), 200

        
        tender_detail_entry = TenderDetails.query.filter(
            TenderDetails.Company_Code == company_code,
            or_(
                TenderDetails.Buyer == ac_code,
                TenderDetails.ShipTo == ac_code,
                TenderDetails.Buyer_Party == ac_code,
                TenderDetails.buyerid == accoid,
                TenderDetails.buyerpartyid == accoid,
                TenderDetails.sub_broker == accoid,
                TenderDetails.shiptoid == accoid,
                TenderDetails.sbr == accoid
            )
        ).first()
        if tender_detail_entry:
            return jsonify({'isUsed': True, 'message': 'annot Delete this is use in Tender Detail.'}), 200

      
        return jsonify({'isUsed': False, 'message': 'Account is not used in any transaction'}), 200

    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({
            "error": "Internal server error",
            "message": str(e)
        }), 500
    

@app.route(API_URL + '/accountmaster-address', methods=['GET'])
def get_accountmaster_address():
    try:
        ac_code = request.args.get('ac_code', type=int)
        company_code = request.args.get('Company_Code')
        if ac_code is None or company_code is None:
            return jsonify({"error": "Missing 'ac_code' parameter"}), 400

        query = text("""
            SELECT 
                qrymstaccountmaster.Ac_Name_E, 
                qrymstaccountmaster.Address_E, 
                qrymstaccountmaster.cityname, 
                qrymstaccountmaster.State_Name, 
                qrymstaccountmaster.GSTStateCode, 
                qrymstaccountmaster.Gst_No, 
                qrymstaccountmaster.CompanyPan, 
                qrymstaccountmaster.Tan_no, 
                tblvoucherheadaddress.AL1, 
                tblvoucherheadaddress.AL2, 
                tblvoucherheadaddress.AL3, 
                tblvoucherheadaddress.AL4, 
                tblvoucherheadaddress.Other, 
                tblvoucherheadaddress.BillFooter
            FROM 
                qrymstaccountmaster 
            INNER JOIN 
                tblvoucherheadaddress 
            ON 
                qrymstaccountmaster.Company_Code = tblvoucherheadaddress.Company_Code
            WHERE 
                qrymstaccountmaster.Ac_Code = :ac_code and qrymstaccountmaster.Company_Code = :company_code
        """)

        result = db.session.execute(query, {"ac_code": ac_code, 'company_code':company_code}).mappings().all()
        data = [dict(row) for row in result]

        return jsonify(data), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

@app.route(API_URL + "/auto-sync-accountmaster", methods=["POST"])
def auto_sync_accountmaster():
    try:
        from sqlalchemy import text, func
        import re

        company_code = request.args.get("company_code")
        if not company_code:
            return jsonify({"error": "Missing company_code"}), 400
        company_code = int(company_code)

        # Fetch GST records
        records = db.session.execute(text("""
            SELECT 
                business_name, legal_name, contact_details_principal_address,
                City, State, Pincode, gstin, contact_details_principal_email,
                pan_number, contact_details_principal_mobile
            FROM dbo.InwardGSTData
            WHERE gstin IS NOT NULL AND business_name IS NOT NULL
        """)).fetchall()

        inserted = []
        skipped = []

        # Get latest Ac_Code and accoid
        max_ac_code = db.session.query(func.max(AccountMaster.Ac_Code)).filter_by(company_code=company_code).scalar() or 0
        max_accoid = db.session.query(func.max(AccountMaster.accoid)).scalar() or 0

        for row in records:
            gst_no = row.gstin.strip()

            if db.session.query(AccountMaster).filter_by(Gst_No=gst_no).first():
                skipped.append(gst_no)
                continue

            business_name = row.business_name.strip()
            short_name = business_name[:15]
            pan_number = row.pan_number.strip() if row.pan_number else ""
            mobile_no = str(row.contact_details_principal_mobile) if row.contact_details_principal_mobile else ""
            email = row.contact_details_principal_email or ""
            address = row.contact_details_principal_address or ""
            legal_name = row.legal_name or ""

            city = row.City.strip()
            pincode = int(row.Pincode)

            city_rec = db.session.query(CityMaster).filter_by(city_name_e=city, pincode=pincode).first()
            if not city_rec:
                skipped.append(f"{gst_no} (city not found)")
                continue

            max_ac_code += 1
            max_accoid += 1

            # All required + default values
            new_account = AccountMaster(
                Ac_Code=max_ac_code,
                accoid=max_accoid,
                Ac_Name_E=business_name,
                Ac_Name_R="",
                Ac_type="P",
                Ac_rate=0,
                Address_E=address,
                Address_R="",
                City_Code=city_rec.city_code,
                Pincode=pincode,
                Local_Lic_No="",
                Tin_No="",
                Cst_no="",
                Gst_No=gst_no,
                Email_Id=email,
                Email_Id_cc="",
                Other_Narration="",
                ECC_No="",
                Bank_Name="",
                Bank_Ac_No="",
                Bank_Opening=0.00,
                bank_Op_Drcr="D",
                Opening_Balance=0.00,
                Drcr="D",
                Group_Code=10,
                Created_By="Rutuja",
                Modified_By="",
                Short_Name=short_name,
                Commission=0.00,
                carporate_party="",
                referBy=legal_name,
                OffPhone="",
                Fax="",
                CompanyPan=pan_number,
                AC_Pan="",
                Mobile_No=mobile_no,
                Is_Login="",
                IFSC="",
                FSSAI="",
                Branch1OB=0.00,
                Branch2OB=0.00,
                Branch1Drcr="D",
                Branch2Drcr="D",
                Locked=0,
                GSTStateCode=city_rec.GstStateCode,
                UnregisterGST=0,
                Distance=0.00,
                Bal_Limit=0.00,
                bsid=10,
                cityid=city_rec.cityid,
                whatsup_no=mobile_no,
                company_code=company_code,
                adhar_no="",
                Limit_By="N",
                Tan_no="",
                TDSApplicable="Y",
                PurchaseTDSApplicable="Y",
                PanLink=""
            )

            db.session.add(new_account)
            inserted.append(gst_no)

        db.session.commit()

        return jsonify({
            "message": "Account sync complete",
            "inserted": inserted,
            "skipped": skipped,
            "count": {
                "inserted": len(inserted),
                "skipped": len(skipped)
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    
@app.route(API_URL + "/insertShetkari-accountmaster", methods=["POST"])
def insertShetkari_accountmaster():
    try:
        data = request.get_json()
        headData = data['cityData']
        
        company_parameters = fetch_company_parameters(headData.get('company_code'),   headData.get('Year_Code')) 
        defaultDebitorscode = company_parameters.defaultSundryCreditors 
        accoid = get_accoid(defaultDebitorscode, headData.get('company_code')) 
        headData.pop('Year_Code', None)
        headData["Group_Code"] = defaultDebitorscode 
        headData['bsid'] = accoid
        max_doc_no = db.session.query(func.max(AccountMaster.Ac_Code)).filter(AccountMaster.company_code == headData['company_code']).scalar() or 0
        new_doc_no = max_doc_no + 1
        headData['Ac_Code'] = new_doc_no

        new_head = AccountMaster(**headData)
        db.session.add(new_head)

        db.session.flush() 
        auto_id = new_head.accoid
        createdDetails = []
        updatedDetails = []
        deletedDetailIds = []

        db.session.commit()
        
        return jsonify({
            "message": "Data inserted successfully",
            "auto_id" : auto_id,
            "Ac_code" : new_doc_no
        }), 201 

    except Exception as e:
        db.session.rollback()
        print("Traceback", traceback.format_exc())
        return jsonify({"error": str(e)}), 500
    

@app.route(API_URL+"/check-account-gst", methods=["GET"])
def check_account_by_gst():
    gst_no = request.args.get("gst_no")
    if not gst_no:
        return jsonify({"error": "Missing GST number"}), 400

    existing = AccountMaster.query.filter_by(Gst_No=gst_no).first()
    if existing:
        return jsonify({"exists": True, "Ac_Code": existing.Ac_Code, "ac_name": existing.Ac_Name_E})
    else:
        return jsonify({"exists": False})



@app.route(API_URL + "/search-taxpayer", methods=["POST"])
def search_taxpayer():
    data = request.get_json()
    gst_no = data.get("gstNo") if data else None

    if not gst_no or gst_no.strip() == "":
        return jsonify({"error": "GST Number is required."}), 400

    try:
        response = http_requests.post(
            "https://www.ewaybills.com/MVEWBAuthenticate/MVAppSCommonSearchTP",
            headers={
                "Content-Type": "application/json",
                "MVApiKey": os.environ.get("GST_API_KEY"),
                "MVSecretKey": os.environ.get("GST_API_SECRET"),
                "GSTIN": os.environ.get("GST_IN"),
            },
            json={"AppSCommonSearchTPItem": [{"GSTIN": gst_no}]},
            timeout=15,
        )

        if not response.ok:
            return jsonify({"error": f"Upstream error: {response.status_code}"}), response.status_code

        return jsonify(response.json())

    except http_requests.exceptions.RequestException as e:
        print(f"GST taxpayer lookup failed: {e}")
        return jsonify({"error": "Failed to reach GST API."}), 502


_ALLOWED_LOGO_EXTS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def _logo_dir():
    base = os.getenv('UPLOAD_FOLDER', 'Uploads')
    path = os.path.join(base, 'accountmasterlogo')
    os.makedirs(path, exist_ok=True)
    return path


@app.route(API_URL + '/upload-accountmaster-logo', methods=['POST'])
def upload_accountmaster_logo():
    ac_code = request.args.get('ac_code')
    if not ac_code:
        return jsonify({'error': 'Missing ac_code'}), 400

    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    if not file or file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else ''
    if ext not in _ALLOWED_LOGO_EXTS:
        return jsonify({'error': 'Invalid file type. Allowed: png, jpg, jpeg, gif, webp'}), 400

    file.seek(0, 2)
    size = file.tell()
    file.seek(0)
    if size > 2 * 1024 * 1024:
        return jsonify({'error': 'File too large. Maximum 2MB allowed.'}), 400

    logo_folder = _logo_dir()

    # Remove any existing logo for this ac_code
    for existing in os.listdir(logo_folder):
        if existing.rsplit('.', 1)[0] == str(ac_code):
            try:
                os.remove(os.path.join(logo_folder, existing))
            except Exception:
                pass

    filename = f"{ac_code}.{ext}"
    file.save(os.path.join(logo_folder, filename))
    logo_path = f"accountmasterlogo/{filename}"

    try:
        db.session.query(AccountMaster).filter_by(Ac_Code=int(ac_code)).update({'logo_path': logo_path})
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'File saved but DB update failed: {str(e)}'}), 500

    _trading_url = os.getenv('TRADING_API_URL', '').rstrip('/')
    if _trading_url:
        try:
            with open(os.path.join(logo_folder, filename), 'rb') as _f:
                requests.post(
                    f"{_trading_url}/internal/mill-logo/{ac_code}",
                    data=_f.read(),
                    headers={
                        'Content-Type': f'image/{ext}',
                        'X-File-Ext': ext,
                        'X-Internal-Api-Key': INTERNAL_API_KEY,
                    },
                    timeout=5,
                )
        except Exception:
            pass

    return jsonify({'message': 'Logo uploaded successfully', 'logo_path': logo_path}), 200


@app.route(API_URL + '/accountmaster-logo/<int:ac_code>', methods=['GET'])
def serve_accountmaster_logo(ac_code):
    logo_folder = _logo_dir()
    for f in os.listdir(logo_folder):
        if f.rsplit('.', 1)[0] == str(ac_code):
            return send_from_directory(os.path.abspath(logo_folder), f)
    return jsonify({'error': 'Logo not found'}), 404