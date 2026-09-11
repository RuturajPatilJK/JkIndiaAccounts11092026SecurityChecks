from datetime import datetime, timedelta, timezone
from sqlalchemy import func
from app.models.CompanyLogs.CompanyLogsModels import CompanyLogs

def create_company_log_entry(
    db,
    doc_no,
    doc_date,
    company_code,
    user_id,
    tran_type,
    created_by,
    modified_by,
    record_type,
    record_no,
    year_code=0,
    bank_ac=0,
    ac_code=0,
    item_code=0,
    value=0,
    narration='',
    quintal = 0.0,
    sale_rate = 0.0,
    purchase_rate = 0.0,
    sale_tds = 0.0,
    purchase_tds = 0.0,
    do_no = 0,
    rate = 0.0,
    updated_doc_date= None,
    SaleTDSApplicable = '',
    PurchaseTDSApplicable ='',
):
    IST = timezone(timedelta(hours=5, minutes=30))
    now_ist = datetime.now(IST)
    current_time_str = now_ist.strftime("%I:%M %p")

    log_entry = CompanyLogs(
        Doc_No=doc_no,
        Doc_Date=doc_date,
        Ac_Code=ac_code,
        Item_Code=item_code,
        Value=value,
        Company_Code=company_code,
        Year_Code=year_code,
        Record_Type=record_type,
        Record_Date=func.current_date(),
        Record_No=record_no,
        User_Id=user_id,
        Tran_Type=tran_type,
        Bank_Ac=bank_ac,
        Updated_Time=current_time_str,
        Created_by=created_by,
        Modified_by=modified_by,
        Narration=narration,
        Quintal=quintal,
        Updated_Doc_Date = updated_doc_date,
        Sale_Rate = sale_rate,
        Purchase_Rate = purchase_rate,
        Sale_TDS = sale_tds,
        Purchase_TDS = purchase_tds,
        Rate = rate,
        DO_No = do_no,
        SaleTDSApplicable = SaleTDSApplicable,
    PurchaseTDSApplicable =PurchaseTDSApplicable,
    )
    db.session.add(log_entry)