from flask import request, jsonify
from app import db, app
from app.models.Inword.PurchaseBill.PurchaseBillModels import SugarPurchase
from app.models.Outword.SaleBill.SaleBillModels import SaleBillHead
from app.models.Transactions.UTR.UTREntryModels import UTRHead
from app.models.Transactions.ReceiptPayment.ReceiptPaymentModels import ReceiptPaymentHead
from app.models.BusinessReleted.TenderPurchase.TenderPurchaseModels import TenderHead
from app.models.Inword.SugarSaleReturnPurchase.SugarSaleReturnPurchaseModels import SugarPurchaseReturnHead
from app.models.Outword.ServiceBill.ServiceBillModel import ServiceBillHead
from app.models.Outword.SugarSaleReturnSale.SugarSaleReturnSaleModel import SugarSaleReturnSaleHead
from app.models.Transactions.DebitCreditNote.DebitCreditNoteModels import DebitCreditNoteHead
from app.models.Outword.CommissionBill.CommissionBillModel import CommissionBill
from app.models.Transactions.OtherPurchaseModels import OtherPurchase
from app.models.BusinessReleted.DeliveryOrder.DeliveryOrderModels import DeliveryOrderHead
from sqlalchemy import and_, func
import os

API_URL = os.getenv('API_URL')

# Define model information for record locking.
MODEL_INFO = {
    "sugar_purchase": {
        "model": SugarPurchase,
        "filter_field": "doc_no",
        "company_code_field": "Company_Code",
        "year_code_field": "Year_Code",
    },
    "sugar_sale": {
        "model": SaleBillHead,
        "filter_field": "doc_no",
        "company_code_field": "Company_Code",
        "year_code_field": "Year_Code",
    },
    "utr_entry": {
        "model": UTRHead,
        "filter_field": "doc_no",
        "company_code_field": "Company_Code",
        "year_code_field": "Year_Code",
    },
    "journal_voucher": {
        "model": ReceiptPaymentHead,
        "filter_field": ["doc_no", "tran_type"],
        "company_code_field": "company_code",
        "year_code_field": "year_code",
    },
    "tender_purchase": {
        "model": TenderHead,
        "filter_field": "Tender_No",
        "company_code_field": "Company_Code",
        "year_code_field": "Year_Code",
    },
     "sugar_sale_return_purchase": {
        "model": SugarPurchaseReturnHead,
        "filter_field": "doc_no",
        "company_code_field": "Company_Code",
        "year_code_field": "Year_Code",
    },
     "sugar_sale_return_sale": {
        "model": SugarSaleReturnSaleHead,
        "filter_field": "doc_no",
        "company_code_field": "Company_Code",
        "year_code_field": "Year_Code",
    },
      "DebitCredit_Note": {
        "model": DebitCreditNoteHead,
        "filter_field": ["doc_no", "tran_type"],
        "company_code_field": "Company_Code",
        "year_code_field": "Year_Code",
    },
     "service_bill": {
        "model": ServiceBillHead,
        "filter_field": "Doc_No",
        "company_code_field": "Company_Code",
        "year_code_field": "Year_Code",
    }
    ,
     "commission_bill": {
        "model": CommissionBill,
        "filter_field": ["doc_no", "Tran_Type"],
        "company_code_field": "Company_Code",
        "year_code_field": "Year_Code",
    },
    "receipt_payment": {
        "model": ReceiptPaymentHead,
        "filter_field": ["doc_no", "tran_type"],
        "company_code_field": "company_code",
        "year_code_field": "year_code",
    },
     "other_purchase": {
        "model": OtherPurchase,
        "filter_field": "Doc_No",
        "company_code_field": "Company_Code",
        "year_code_field": "Year_Code",
    },
    "do": {
        "model": DeliveryOrderHead,
        "filter_field": "doc_no",
        "company_code_field": "company_code",
        "year_code_field": "Year_Code",
    }
}

@app.route(API_URL + "/record-lock", methods=["PUT"])
def record_lock():
    try:
        # Extract parameters
        record_id = request.args.get('id')
        tran_type = request.args.get('tran_type')
        company_code = request.args.get('company_code')
        year_code = request.args.get('year_code')
        model_type = request.args.get('model_type')  # new parameter to specify model

        # Validate required parameters
        if not record_id or not company_code or not year_code or not model_type:
            return jsonify({
                "error": "Bad Request",
                "message": "Parameters 'id', 'company_code', 'year_code', and 'model_type' are required."
            }), 400

        # Ensure model_type exists in the MODEL_INFO dictionary
        if model_type not in MODEL_INFO:
            return jsonify({
                "error": "Bad Request",
                "message": f"Invalid model_type: {model_type}. Valid options are: {', '.join(MODEL_INFO.keys())}."
            }), 400

        # Determine the model from the provided model_type
        model_info = MODEL_INFO.get(model_type)

        # Check if record exists in the model
        model_class = model_info["model"]
        filter_field = model_info["filter_field"]
        company_code_field = model_info.get("company_code_field", "company_code")
        year_code_field = model_info.get("year_code_field", "year_code")

        query_conditions = []
        if isinstance(filter_field, str):
            query_conditions.append(getattr(model_class, filter_field) == record_id)
        elif isinstance(filter_field, list):
            for field in filter_field:
                if field.lower() == "tran_type":
                    if tran_type:  
                        query_conditions.append(getattr(model_class, field) == tran_type)
                    else:
                        return jsonify({
                    "error": "Bad Request",
                    "message": f"Missing 'tran_type' for model_type {model_type}."
                }), 400
                elif field.lower() == "doc_no":
                    query_conditions.append(getattr(model_class, field) == record_id)

        query_conditions.append(func.lower(getattr(model_class, company_code_field)) == company_code.lower())
        query_conditions.append(func.lower(getattr(model_class, year_code_field)) == year_code.lower())

    
        # Fetch the record
        record = model_class.query.filter(and_(*query_conditions)).first()
        if not record:
            return jsonify({
                "error": "Not Found",
                "message": f"Record with ID {record_id}, company_code {company_code}, and year_code {year_code} not found."
            }), 404

        # Parse JSON body for the update
        data = request.get_json(silent=True)
        if not data:
            return jsonify({
                "error": "Bad Request",
                "message": "Invalid or missing JSON data."
            }), 400

        # Update the record
        for key, value in data.items():
            if hasattr(record, key):
                setattr(record, key, value)

        db.session.commit()
        return jsonify({"message": "Record updated successfully"}), 200

    except Exception as e:
        db.session.rollback()
        app.logger.exception("Error in record-lock endpoint")
        return jsonify({
            "error": "Internal Server Error",
            "message": str(e)
        }), 500
