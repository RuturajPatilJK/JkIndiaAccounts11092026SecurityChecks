# from datetime import date
# from flask import jsonify, request
# from app import app, db
# from sqlalchemy import func
# import os
# import requests
# from app.models.BusinessReleted.TenderPurchase.TenderPurchaseModels import (
#     TenderHead, TenderDetails, TenderGradeDetails
# )
# from app.models.BusinessReleted.TenderPurchase.TenserPurchaseSchema import (
#     TenderHeadSchema, TenderDetailsSchema
# )

# API_URL        = os.getenv("API_URL")
# API_URL_SERVER = os.getenv("API_URL_SERVER")

# tender_head_schema    = TenderHeadSchema()
# tender_detail_schema  = TenderDetailsSchema()
# tender_detail_schemas = TenderDetailsSchema(many=True)


# def _dump_grade(gr):
#     return {
#         "id":           gr.id,
#         "tenderid":     gr.tenderid,
#         "gradeCode":    gr.gradeCode,
#         "gradeid":      gr.gradeid,
#         "gradeRate":    float(gr.gradeRate)      if gr.gradeRate      is not None else None,
#         "Purchase_Rate": float(gr.Purchase_Rate)  if gr.Purchase_Rate  is not None else None,
#     }


# _QUERY_ONLY_FIELDS = {
#     "MillName", "PaymentToAcName", "TenderFromAcName", "TenderDoAcName",
#     "VoucherByAcName", "BrokerAcName", "GST_Name", "GSTRate",
#     "Sauda_DateConverted", "payment_date", "payment_dateConverted",
#     "buyergstno", "buyergststatecode",
#     "buyerpartyname", "buyerpartygstno", "buyerpartygststatecode",
#     "buyeridcityname", "buyeridcitypincode", "buyeridcitystate", "buyeridcitygststatecode",
#     "buyerpartycityname", "buyerpartycitypincode", "buyerpartycitystate",
#     "buyerpartycitygststatecode",
#     "subbrokername", "subbrokercityname",
#     "ShipToname", "buyershortname", "buyerpartymobno", "buyername",
#     "despatched", "balance", "dispatched",
#     "gradeRate", "detailGradeName", "detailPurchase_Rate",
#     "rowaction", "tenderdetailid",
# }


# def _pf(val):
#     try:    return float(val)
#     except: return 0.0


# @app.route(API_URL + "/tender_settlement", methods=["POST"])
# def tender_settlement():

#     try:
#         data = request.get_json()

#         headData         = data.get("last_tender_head_data", {})
#         detailData       = data.get("last_tender_details_data", [])
#         gradeDetailsData = data.get("last_tender_grade_details_data", [])

#         packing   = _pf(headData.get("Packing")  or 50)
#         mill_rate = _pf(headData.get("Mill_Rate") or 0.0)
#         purc_rate = _pf(headData.get("Purc_Rate") or 0.0)
#         type_     = headData.get("type") or "M"
#         tds_rate  = _pf(headData.get("TDS_Rate")  or 0.0)

      
#         buyer_rows = [item for item in detailData if item.get("ID") != 1]

#         total_dispatched = sum(_pf(r.get("dispatched")) for r in buyer_rows)
#         total_balance    = sum(_pf(r.get("balance"))    for r in buyer_rows)

#         maxTender_No = (
#             db.session.query(func.max(TenderHead.Tender_No))
#                       .filter_by(Company_Code=headData["Company_Code"],
#                                  Year_Code=headData["Year_Code"])
#                       .scalar()
#         ) or 0
#         newTenderNo           = maxTender_No + 1
#         headData["Tender_No"] = newTenderNo


#         original_tenderid = headData.pop("tenderid", None)
#         if original_tenderid:
#             db.session.query(TenderHead).filter_by(tenderid=original_tenderid).update({
#                 "Quantal": total_dispatched,
#                 "Bags":    round((total_dispatched / packing) * 100, 2) if packing else 0,
#             })
#             db.session.query(TenderDetails).filter_by(
#                 tenderid=original_tenderid, ID=1
#             ).update({"Buyer_Quantal": 0.0})

   

#         updated_details_objs = []
#         deleted_detail_ids   = []
#         settlement_details   = []   

#         for item in buyer_rows:
#             raw_balance    = _pf(item.get("balance"))
#             raw_dispatched = _pf(item.get("dispatched"))
#             raw_quantal    = _pf(item.get("Buyer_Quantal"))
#             orig_id        = item.get("tenderdetailid")

#             if raw_balance <= 0.0:
#                 if orig_id and raw_dispatched > 0.0:
#                     db.session.query(TenderDetails).filter_by(
#                         tenderdetailid=orig_id
#                     ).update({"Buyer_Quantal": raw_dispatched})
#                     updated_row = db.session.query(TenderDetails).filter_by(
#                         tenderdetailid=orig_id
#                     ).one()
#                     updated_details_objs.append(updated_row)
    
#                 continue


#             if orig_id:
#                 if raw_dispatched > 0.0:
             
#                     db.session.query(TenderDetails).filter_by(
#                         tenderdetailid=orig_id
#                     ).update({"Buyer_Quantal": raw_dispatched})
#                     updated_row = db.session.query(TenderDetails).filter_by(
#                         tenderdetailid=orig_id
#                     ).one()
#                     updated_details_objs.append(updated_row)
#                 else:
                
#                     deleted_detail_ids.append(orig_id)

#             new_row                  = item.copy()
#             new_row["Buyer_Quantal"] = raw_balance
#             new_row["dispatched"]    = 0.0
#             new_row["balance"]       = raw_balance
#             settlement_details.append(new_row)

#         if deleted_detail_ids:
#             db.session.query(TenderDetails).filter(
#                 TenderDetails.tenderdetailid.in_(deleted_detail_ids)
#             ).delete(synchronize_session=False)


#         new_head_quantal = total_balance
#         new_self_quantal = total_balance

#         headData["Quantal"] = new_head_quantal
#         headData["Bags"]    = round((new_head_quantal / packing) * 100, 2) if packing else 0

#         new_head = TenderHead(**headData)
#         db.session.add(new_head)
#         db.session.flush()  

#         self_resp   = requests.get(
#             f"{API_URL_SERVER}/get_SelfAc",
#             params={"Company_Code": headData["Company_Code"]},
#         )
#         self_data   = self_resp.json()
#         self_code   = self_data.get("SELF_AC")
#         self_accoid = self_data.get("Self_acid")


#         max_tdetailid = db.session.query(func.max(TenderDetails.tenderdetailid)).scalar() or 0

#         self_detail = TenderDetails(
#             ID              = 1,
#             tenderdetailid  = max_tdetailid + 1,
#             Tender_No       = newTenderNo,
#             tenderid        = new_head.tenderid,
#             Company_Code    = new_head.Company_Code,
#             Buyer           = self_code,
#             Buyer_Quantal   = new_self_quantal,   
#             Sale_Rate       = 0.0,
#             Commission_Rate = 0.0,
#             Sauda_Date      = date.today().isoformat(),
#             Lifting_Date    = date.today().isoformat(),
#             Narration       = "Self Entry",
#             Buyer_Party     = self_code,
#             AutoID          = 0,
#             IsActive        = 1,
#             year_code       = new_head.Year_Code,
#             Branch_Id       = new_head.Branch_Id,
#             Delivery_Type   = "C",
#             buyerid         = self_accoid,
#             buyerpartyid    = self_accoid,
#             sub_broker      = self_code,
#             sbr             = self_accoid,
#             tcs_rate        = float(new_head.TCS_Rate or 0.0),
#             gst_rate        = float(new_head.gstid    or 0.0),
#             tcs_amt         = 0.0,
#             gst_amt         = 0.0,
#             ShipTo          = self_code,
#             CashDiff        = 0.0,
#             shiptoid        = self_accoid,
#         )
#         new_head.details.append(self_detail)
#         createdDetails = [self_detail]


#         for i, item in enumerate(settlement_details, start=2):
#             new_item = item.copy()

#             quantal  = _pf(new_item.get("Buyer_Quantal"))
#             tcs_rate = _pf(new_item.get("tcs_rate"))
#             gst_rate = _pf(new_item.get("gst_rate"))

#             excise_rate = (mill_rate * gst_rate) / 100
#             gst_amt     = excise_rate + mill_rate
#             tcs_amt     = (quantal * gst_amt * tcs_rate) / 100

#             new_item["Sale_Rate"]       = _pf(new_item.get("Sale_Rate"))
#             new_item["Commission_Rate"] = _pf(new_item.get("Commission_Rate"))
#             new_item["gst_amt"]         = round(gst_amt * quantal / 100, 2)
#             new_item["tcs_amt"]         = round(tcs_amt, 2)
#             new_item["CashDiff"]        = 0.0
#             new_item["ID"]              = i
#             new_item["tenderdetailid"]  = max_tdetailid + i
#             new_item["Tender_No"]       = newTenderNo
#             new_item["tenderid"]        = new_head.tenderid
#             new_item["Company_Code"]    = new_head.Company_Code
#             new_item["year_code"]       = new_head.Year_Code
#             new_item["Branch_Id"]       = new_head.Branch_Id

       
#             if "detailPurchase_Rate" in new_item:
#                 new_item["Purchase_Rate"] = new_item["detailPurchase_Rate"]


#             for key in list(new_item.keys()):
#                 if key in _QUERY_ONLY_FIELDS:
#                     new_item.pop(key, None)

#             new_detail = TenderDetails(**new_item)
#             new_head.details.append(new_detail)
#             createdDetails.append(new_detail)


#         created_grade_details = []
#         max_grade_id = db.session.query(func.max(TenderGradeDetails.id)).scalar() or 0

#         for j, grade_item in enumerate(gradeDetailsData, start=1):
#             grade_record = TenderGradeDetails(
#                 id            = max_grade_id + j,
#                 gradeCode     = grade_item.get("gradeCode"),
#                 gradeid       = grade_item.get("gradeid"),
#                 gradeRate     = _pf(grade_item.get("gradeRate")),
#                 Purchase_Rate = _pf(grade_item.get("Purchase_Rate")),
#                 tenderid      = new_head.tenderid,
#             )
#             db.session.add(grade_record)
#             created_grade_details.append(grade_record)

#         db.session.commit()

#         return jsonify({
#             "message":                "Data Inserted successfully",
#             "head":                   tender_head_schema.dump(new_head),
#             "addedDetails":           [tender_detail_schema.dump(d) for d in createdDetails],
#             "updatedDetails":         [tender_detail_schema.dump(d) for d in updated_details_objs],
#             "deletedDetailIds":       deleted_detail_ids,
#             "last_tender_grade_data": [_dump_grade(g) for g in created_grade_details],
#         }), 201

#     except Exception as e:
#         db.session.rollback()
#         return jsonify({"error": "Internal server error", "message": str(e)}), 500

















from datetime import date
from flask import jsonify, request
from app import app, db
from sqlalchemy import func
import os
import requests
from app.models.BusinessReleted.TenderPurchase.TenderPurchaseModels import (
    TenderHead, TenderDetails, TenderGradeDetails
)
from app.models.BusinessReleted.TenderPurchase.TenserPurchaseSchema import (
    TenderHeadSchema, TenderDetailsSchema
)

API_URL        = os.getenv("API_URL")
API_URL_SERVER = os.getenv("API_URL_SERVER")

tender_head_schema    = TenderHeadSchema()
tender_detail_schema  = TenderDetailsSchema()
tender_detail_schemas = TenderDetailsSchema(many=True)


def _dump_grade(gr):
    return {
        "id":           gr.id,
        "tenderid":     gr.tenderid,
        "gradeCode":    gr.gradeCode,
        "gradeid":      gr.gradeid,
        "gradeRate":    float(gr.gradeRate)      if gr.gradeRate      is not None else None,
        "Purchase_Rate": float(gr.Purchase_Rate)  if gr.Purchase_Rate  is not None else None,
    }


_QUERY_ONLY_FIELDS = {
    "MillName", "PaymentToAcName", "TenderFromAcName", "TenderDoAcName",
    "VoucherByAcName", "BrokerAcName", "GST_Name", "GSTRate",
    "Sauda_DateConverted", "payment_date", "payment_dateConverted",
    "buyergstno", "buyergststatecode",
    "buyerpartyname", "buyerpartygstno", "buyerpartygststatecode",
    "buyeridcityname", "buyeridcitypincode", "buyeridcitystate", "buyeridcitygststatecode",
    "buyerpartycityname", "buyerpartycitypincode", "buyerpartycitystate",
    "buyerpartycitygststatecode",
    "subbrokername", "subbrokercityname",
    "ShipToname", "buyershortname", "buyerpartymobno", "buyername",
    "despatched", "balance", "dispatched",
    "gradeRate", "detailGradeName", "detailPurchase_Rate",
    "rowaction", "tenderdetailid",
}


def _pf(val):
    try:    return float(val)
    except: return 0.0


@app.route(API_URL + "/tender_settlement", methods=["POST"])
def tender_settlement():

    try:
        data = request.get_json()

        headData         = data.get("last_tender_head_data", {})
        detailData       = data.get("last_tender_details_data", [])
        gradeDetailsData = data.get("last_tender_grade_details_data", [])

        packing   = _pf(headData.get("Packing")  or 50)
        mill_rate = _pf(headData.get("Mill_Rate") or 0.0)
        purc_rate = _pf(headData.get("Purc_Rate") or 0.0)
        type_     = headData.get("type") or "M"
        tds_rate  = _pf(headData.get("TDS_Rate")  or 0.0)

        # Capture original quantal and old self quantal before any mutation
        original_quantal = _pf(headData.get("Quantal") or 0.0)
        self_row_payload = next((item for item in detailData if item.get("ID") == 1), None)
        old_self_quantal = _pf(self_row_payload.get("Buyer_Quantal")) if self_row_payload else 0.0

        buyer_rows = [item for item in detailData if item.get("ID") != 1]

        total_dispatched = sum(_pf(r.get("dispatched")) for r in buyer_rows)
        total_balance    = sum(_pf(r.get("balance"))    for r in buyer_rows)

        maxTender_No = (
            db.session.query(func.max(TenderHead.Tender_No))
                      .filter_by(Company_Code=headData["Company_Code"],
                                 Year_Code=headData["Year_Code"])
                      .scalar()
        ) or 0
        newTenderNo           = maxTender_No + 1
        headData["Tender_No"] = newTenderNo


        original_tenderid = headData.pop("tenderid", None)
        if original_tenderid:
            # IDs of settled buyer rows sent from frontend
            payload_detail_ids = {
                item["tenderdetailid"]
                for item in detailData
                if item.get("ID") != 1 and item.get("tenderdetailid")
            }
            # Query buyer rows of old tender that were NOT settled (not in payload)
            not_settled_q = db.session.query(TenderDetails).filter(
                TenderDetails.tenderid == original_tenderid,
                TenderDetails.ID != 1,
            )
            if payload_detail_ids:
                not_settled_q = not_settled_q.filter(
                    TenderDetails.tenderdetailid.notin_(payload_detail_ids)
                )
            not_settled_balance = sum(
                float(r.Buyer_Quantal or 0) for r in not_settled_q.all()
            )

            # old head = dispatched(settled grades) + balance(not-settled grades)
            old_updated_quantal = total_dispatched + not_settled_balance
            db.session.query(TenderHead).filter_by(tenderid=original_tenderid).update({
                "Quantal": old_updated_quantal,
                "Bags":    round((old_updated_quantal / packing) * 100, 2) if packing else 0,
            })
            db.session.query(TenderDetails).filter_by(
                tenderid=original_tenderid, ID=1
            ).update({"Buyer_Quantal": 0.0})

   

        updated_details_objs = []
        deleted_detail_ids   = []
        settlement_details   = []   

        for item in buyer_rows:
            raw_balance    = _pf(item.get("balance"))
            raw_dispatched = _pf(item.get("dispatched"))
            raw_quantal    = _pf(item.get("Buyer_Quantal"))
            orig_id        = item.get("tenderdetailid")

            if raw_balance <= 0.0:
                if orig_id and raw_dispatched > 0.0:
                    db.session.query(TenderDetails).filter_by(
                        tenderdetailid=orig_id
                    ).update({"Buyer_Quantal": raw_dispatched})
                    updated_row = db.session.query(TenderDetails).filter_by(
                        tenderdetailid=orig_id
                    ).one()
                    updated_details_objs.append(updated_row)
    
                continue


            if orig_id:
                if raw_dispatched > 0.0:
             
                    db.session.query(TenderDetails).filter_by(
                        tenderdetailid=orig_id
                    ).update({"Buyer_Quantal": raw_dispatched})
                    updated_row = db.session.query(TenderDetails).filter_by(
                        tenderdetailid=orig_id
                    ).one()
                    updated_details_objs.append(updated_row)
                else:
                
                    deleted_detail_ids.append(orig_id)

            new_row                  = item.copy()
            new_row["Buyer_Quantal"] = raw_balance
            new_row["dispatched"]    = 0.0
            new_row["balance"]       = raw_balance
            settlement_details.append(new_row)

        if deleted_detail_ids:
            db.session.query(TenderDetails).filter(
                TenderDetails.tenderdetailid.in_(deleted_detail_ids)
            ).delete(synchronize_session=False)


        new_self_quantal = old_self_quantal
        new_head_quantal = old_self_quantal + total_balance

        headData["Quantal"] = new_head_quantal
        headData["Bags"]    = round((new_head_quantal / packing) * 100, 2) if packing else 0

        new_head = TenderHead(**headData)
        db.session.add(new_head)
        db.session.flush()  

        self_resp   = requests.get(
            f"{API_URL_SERVER}/get_SelfAc",
            params={"Company_Code": headData["Company_Code"]},
        )
        self_data   = self_resp.json()
        self_code   = self_data.get("SELF_AC")
        self_accoid = self_data.get("Self_acid")


        max_tdetailid = db.session.query(func.max(TenderDetails.tenderdetailid)).scalar() or 0

        self_detail = TenderDetails(
            ID              = 1,
            tenderdetailid  = max_tdetailid + 1,
            Tender_No       = newTenderNo,
            tenderid        = new_head.tenderid,
            Company_Code    = new_head.Company_Code,
            Buyer           = self_code,
            Buyer_Quantal   = new_self_quantal,   
            Sale_Rate       = 0.0,
            Commission_Rate = 0.0,
            Sauda_Date      = date.today().isoformat(),
            Lifting_Date    = date.today().isoformat(),
            Narration       = "Self Entry",
            Buyer_Party     = self_code,
            AutoID          = 0,
            IsActive        = 1,
            year_code       = new_head.Year_Code,
            Branch_Id       = new_head.Branch_Id,
            Delivery_Type   = "C",
            buyerid         = self_accoid,
            buyerpartyid    = self_accoid,
            sub_broker      = self_code,
            sbr             = self_accoid,
            tcs_rate        = float(new_head.TCS_Rate or 0.0),
            gst_rate        = float(new_head.gstid    or 0.0),
            tcs_amt         = 0.0,
            gst_amt         = 0.0,
            ShipTo          = self_code,
            CashDiff        = 0.0,
            shiptoid        = self_accoid,
        )
        new_head.details.append(self_detail)
        createdDetails = [self_detail]


        for i, item in enumerate(settlement_details, start=2):
            new_item = item.copy()

            quantal  = _pf(new_item.get("Buyer_Quantal"))
            tcs_rate = _pf(new_item.get("tcs_rate"))
            gst_rate = _pf(new_item.get("gst_rate"))

            excise_rate = (mill_rate * gst_rate) / 100
            gst_amt     = excise_rate + mill_rate
            tcs_amt     = (quantal * gst_amt * tcs_rate) / 100

            new_item["Sale_Rate"]       = _pf(new_item.get("Sale_Rate"))
            new_item["Commission_Rate"] = _pf(new_item.get("Commission_Rate"))
            new_item["gst_amt"]         = round(gst_amt * quantal / 100, 2)
            new_item["tcs_amt"]         = round(tcs_amt, 2)
            new_item["CashDiff"]        = 0.0
            new_item["ID"]              = i
            new_item["tenderdetailid"]  = max_tdetailid + i
            new_item["Tender_No"]       = newTenderNo
            new_item["tenderid"]        = new_head.tenderid
            new_item["Company_Code"]    = new_head.Company_Code
            new_item["year_code"]       = new_head.Year_Code
            new_item["Branch_Id"]       = new_head.Branch_Id

       
            if "detailPurchase_Rate" in new_item:
                new_item["Purchase_Rate"] = new_item["detailPurchase_Rate"]


            for key in list(new_item.keys()):
                if key in _QUERY_ONLY_FIELDS:
                    new_item.pop(key, None)

            new_detail = TenderDetails(**new_item)
            new_head.details.append(new_detail)
            createdDetails.append(new_detail)


        created_grade_details = []
        max_grade_id = db.session.query(func.max(TenderGradeDetails.id)).scalar() or 0

        for j, grade_item in enumerate(gradeDetailsData, start=1):
            grade_record = TenderGradeDetails(
                id            = max_grade_id + j,
                gradeCode     = grade_item.get("gradeCode"),
                gradeid       = grade_item.get("gradeid"),
                gradeRate     = _pf(grade_item.get("gradeRate")),
                Purchase_Rate = _pf(grade_item.get("Purchase_Rate")),
                tenderid      = new_head.tenderid,
            )
            db.session.add(grade_record)
            created_grade_details.append(grade_record)

        db.session.commit()

        return jsonify({
            "message":                "Data Inserted successfully",
            "head":                   tender_head_schema.dump(new_head),
            "addedDetails":           [tender_detail_schema.dump(d) for d in createdDetails],
            "updatedDetails":         [tender_detail_schema.dump(d) for d in updated_details_objs],
            "deletedDetailIds":       deleted_detail_ids,
            "last_tender_grade_data": [_dump_grade(g) for g in created_grade_details],
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Internal server error", "message": str(e)}), 500