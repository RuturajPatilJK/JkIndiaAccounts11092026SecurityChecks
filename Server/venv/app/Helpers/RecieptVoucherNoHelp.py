
from flask import jsonify
from app import app, db
from sqlalchemy.exc import SQLAlchemyError 
from sqlalchemy import text
from flask import jsonify, request
import os
import traceback
import logging


API_URL = os.getenv('API_URL')
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.route(API_URL+'/RecieptVoucherNo', methods=['GET'])
def RecieptVoucherNo():
    try:
        CompanyCode = request.args.get('CompanyCode')
        Tran_Type = request.args.get('Tran_Type')
        Year_Code = request.args.get('Year_Code')
        FilterType = request.args.get('FilterType')
        Accode = request.args.get('Accode')

        # Check if any required parameters are missing
        if not all([CompanyCode, Tran_Type, Year_Code, FilterType, Accode]):
            return jsonify({'error': 'Missing one or more required parameters: CompanyCode, Tran_Type, Year_Code, FilterType, Accode'}), 400

        # Start a database transaction
        with db.session.begin_nested():
            if Tran_Type == "BR" and FilterType == "S":
                query = db.session.execute(text('''
                    SELECT Tender_No AS doc_no, payment_dateConverted AS Doc_date, '' AS Tran_Type, buyername AS PartyName,
                    Buyer_Quantal AS NETQNTL, (Sale_Rate + Commission_Rate) AS Sale_Rate, ROUND(AMT, 2) AS Bill_Amount,
                    received, adjusted AS Adj_Amt, ROUND(BALANCE, 2) AS BALANCE, tenderdetailid AS Autoid,
                    Year_Code AS EntryYearCode, Short_Name AS Shortname, '0' AS adjAmt
                    FROM qrysaudabalancemain
                    WHERE Delivery_Type='C' AND Buyer = :Accode AND Company_Code = :CompanyCode AND Year_Code = :Year_Code
                    ORDER BY buyername, payment_dateConverted DESC
                '''), {'CompanyCode': CompanyCode, 'Year_Code': Year_Code, 'Accode': Accode})
            
            elif (Tran_Type == "BR" and FilterType == "B") or (Tran_Type == "CR" and FilterType == "Y"):
                query = db.session.execute(text('''
                    SELECT billno AS doc_no, doc_dateConverted AS Doc_date, bill_tran_type AS Tran_Type,
                    billtoname AS PartyName, NETQNTL, Bill_Amount, received, '0' AS Adj_Amt, balance AS BALANCE,
                    saleid AS Autoid, Year_Code AS EntryYearCode, millshortname AS Shortname, adjAmt
                    FROM qrysalebillbalance
                    WHERE Company_Code = :CompanyCode AND Year_Code = :Year_Code AND Ac_Code = :Accode
                '''), {'CompanyCode': CompanyCode, 'Year_Code': Year_Code, 'Accode': Accode})

            elif (Tran_Type == "BR" and FilterType == "R") or (Tran_Type == "CR" and FilterType == "X"):
                query = db.session.execute(text('''
                    SELECT Doc_No AS doc_no, Doc_Date AS Doc_date, Tran_Type, partyname AS PartyName,
                    NetWeight AS NETQNTL, Amount AS Bill_Amount, received, '0' AS Adj_Amt, Balance AS BALANCE,
                    Retailid AS Autoid, Year_Code AS EntryYearCode, cityname AS Shortname, '0' AS adjAmt
                    FROM qryRetailsalebillbalance
                    WHERE Balance != 0 AND Company_Code = :CompanyCode AND Year_Code = :Year_Code AND Party_Code = :Accode
                '''), {'CompanyCode': CompanyCode, 'Year_Code': Year_Code, 'Accode': Accode})

            elif (Tran_Type == "BP" and FilterType == "N") or (Tran_Type == "CP" and FilterType == "N"):
                query = db.session.execute(text('''
                    SELECT doc_no AS doc_no, CONVERT(VARCHAR(10), doc_date, 103) AS Doc_date, Tran_Type, suppliername AS PartyName,
                    NETQNTL, Bill_Amount, paid AS received, '0' AS Adj_Amt, Billbalance AS BALANCE, purchaseid AS Autoid,
                    Year_Code AS EntryYearCode, millshortname AS Shortname, adjacamt AS adjAmt
                    FROM qryManuallyPurchaseBalance
                    WHERE Billbalance != 0 AND Company_Code = :CompanyCode AND Year_Code = :Year_Code AND Ac_Code = :Accode
                '''), {'CompanyCode': CompanyCode, 'Year_Code': Year_Code, 'Accode': Accode})

            elif (Tran_Type == "BP" and FilterType == "T") or (Tran_Type == "CP" and FilterType == "T"):
                query = db.session.execute(text('''
                    SELECT doc_no AS doc_no, CONVERT(VARCHAR(10), doc_date, 103) AS Doc_date, tran_type AS Tran_Type,
                    transportname AS PartyName, quantal AS NETQNTL, Memo_Advance AS Bill_Amount, paid AS received,
                    '0' AS Adj_Amt, Balance AS BALANCE, doid AS Autoid, Year_Code AS EntryYearCode, millshortname AS Shortname,
                    '0' AS adjAmt
                    FROM qrydofreightbalance
                    WHERE Balance != 0 AND Company_Code = :CompanyCode AND Year_Code = :Year_Code AND transport = :Accode
                '''), {'CompanyCode': CompanyCode, 'Year_Code': Year_Code, 'Accode': Accode})

            elif (Tran_Type == "BR" and FilterType == "F"):
                query = db.session.execute(text('''
                    SELECT        billno AS doc_no, doc_dateConverted AS Doc_date, bill_tran_type AS Tran_Type, billtoname AS PartyName,'0' as NETQNTL, Bill_Amount, received,'0' AS Adj_Amt, balance AS BALANCE, rbid AS Autoid, Year_Code as EntryYearCode,''AS Shortname, '0'AS adjAmt
FROM            dbo.qryProformaServiceBillBalance
                    WHERE balance != 0 AND Company_Code = :CompanyCode AND Year_Code = :Year_Code AND Ac_Code = :Accode
                '''), {'CompanyCode': CompanyCode, 'Year_Code': Year_Code, 'Accode': Accode})

            else:
                return jsonify({'error': 'Invalid Tran_Type or FilterType'}), 400

            result = query.fetchall()
            columns = query.keys()
            last_details_data = [dict(zip(columns, row)) for row in result]
            
            response = {
                "last_details_data": last_details_data,
                "total_records": len(last_details_data),
                "success": True
            }

            return jsonify(response), 200

    except SQLAlchemyError as error:
        # Handle database errors
        logger.error("Traceback: %s", traceback.format_exc())
        logger.error("Error fetching data: %s", error)
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500


@app.route(API_URL + "/getRecieptVoucherNo_Data", methods=["GET"])
def getRecieptVoucherNo_Data():
    try:
        CompanyCode = request.args.get('CompanyCode')
        VoucherNo = request.args.get('VoucherNo')
        Year_Code = request.args.get('Year_Code')
        FilterType = request.args.get('FilterType')
        VoucherType = request.args.get('Tran_Type')
        Autoid = request.args.get('Autoid')

        if not all([CompanyCode, VoucherNo,Year_Code,FilterType]):
            return jsonify({"error": "Missing required parameters"}), 400

        query = None

        with db.session.begin_nested():
            # Execute query
            if FilterType=="V" :
                query = db.session.execute(
                    text('''
                       select Doc_No as doc_no,Tran_Type,Suffix,Convert(varchar(10),Doc_Date,103) as Doc_Date,PartyName,Unit_Name,NETQNTL,BrokerName,Sale_Rate,Bill_Amount,mill_code,  +
                               (Select ISNULL(SUM(amount),0) as UA from  NT_1_Transact where Voucher_No= NT_1_qryVoucherSaleUnion.Doc_No and Voucher_Type= NT_1_qryVoucherSaleUnion.Tran_Type and Company_Code= NT_1_qryVoucherSaleUnion.Company_Code and Year_Code= NT_1_qryVoucherSaleUnion.Year_Code 
                               ) as Paid_Amount,(Bill_Amount - (Select ISNULL(SUM(amount),0) as UA from  NT_1_ Transact where  
                               Voucher_No= NT_1_qryVoucherSaleUnion.Doc_No and Voucher_Type= NT_1_qryVoucherSaleUnion.Tran_Type and Year_Code= NT_1_qryVoucherSaleUnion.Year_Code and Company_Code= NT_1_qryVoucherSaleUnion.Company_Code )) as Balance  
                               from  NT_1_qryVoucherSaleUnion where Company_Code= :Company_Code  and Year_Code= :Year_Code
                                and doc_no= :VoucherNo  and Tran_Type=:VoucherType

                    '''),
                    {'Company_Code': CompanyCode, 'Year_Code': Year_Code,"VoucherType": VoucherType,'VoucherNo':VoucherNo}
                )
            
            if FilterType=="D" :
                query = db.session.execute(
                    text('''
                select Doc_No as doc_no,MillName,Date,PartyName,Sale_Rate,Purchase_Rate,Quantal,Balance
                from NT_1_qryDebitNotesForBankReciept where Company_Code= :Company_Code and Year_Code= :Year_Code
                and Doc_No= :VoucherNo and Tran_Type='LV'
                         
                 '''),
                    {'Company_Code': CompanyCode, 'Year_Code': Year_Code,"VoucherType": VoucherType,'VoucherNo':VoucherNo}
                )        

            if FilterType=="S" :
                query = db.session.execute(
                    text('''
                  qry = "select [Tender_No]as doc_no as autoId,[ID],Convert(VarChar(10),[Tender_Date],103) as Tender_Date,
                         [millname],[salerate],[salepartyfullname],[Buyer_Quantal],[salevalue],[received],
                         [balance],[Commission_Rate],Sauda_Date from NT_1_qrySaudaBalance
                         where Company_Code=:Company_Code and Year_Code=:Year_Code and Tender_No=:VoucherNo and ID=:VoucherType

                 '''),
                    {'Company_Code': CompanyCode, 'Year_Code': Year_Code,"VoucherType": VoucherType,'VoucherNo':VoucherNo}
                )  

            if FilterType=="B" or FilterType=="Y" :     
                query = db.session.execute(
                        text('''
                            SELECT 
                                billno AS doc_no,
                                 bill_tran_type as Tran_Type,
                                balance,
                                saleid AS autoId,
                                Year_Code AS EntryYearCode,
                                ('SB-No:' + CONVERT(VARCHAR(10), billno) + '-Dated:' + CONVERT(VARCHAR(10), doc_dateConverted)) AS Narration
                            FROM 
                                qrysalebillbalance
                            WHERE 
                                Company_Code = :CompanyCode 
                                AND Year_Code = :Year_Code
                                AND saleid = :Autoid 
                                AND billno = :VoucherNo
                                and  bill_tran_type= :VoucherType
                        '''),
                        {'CompanyCode': CompanyCode, 'Year_Code': Year_Code, 'VoucherNo': VoucherNo, 'Autoid': Autoid,'VoucherType' : VoucherType}
                    )

            if FilterType=="N" :   
                query = db.session.execute(
                text(''' 
                    SELECT 
                        doc_no AS doc_no, 
                        CONVERT(varchar(10), doc_date, 103) AS Doc_date, 
                        Tran_Type, 
                        suppliername AS PartyName, 
                        NETQNTL, 
                        Bill_Amount, 
                        paid AS received, 
                        '0' AS adjusted, 
                        Billbalance AS balance, 
                        purchaseid as autoId, 
                        Year_Code AS EntryYearCode, 
                        millshortname, 
                        adjacamt 
                    FROM qryManuallyPurchaseBalance 
                    WHERE 
                        doc_no = :VoucherNo AND 
                        Billbalance != 0 AND 
                        Company_Code = :CompanyCode AND 
                        Year_Code = :Year_Code
                '''),
                {'CompanyCode': CompanyCode, 'Year_Code': Year_Code, 'VoucherNo': VoucherNo}
            )

            if FilterType=="P" :   
                query = db.session.execute(
                    text('''
                  qry = "select doc_no,Grand_Total,Party_Code,balance,amount from NT_1_qryAgainstCreditBill
                      " where balance<>0 and Voucher_Type= :VoucherType and doc_no= :VoucherNo
                         and Company_Code=:Company_Code and Year_Code=:Year_Code
                 '''),
                    {'Company_Code': CompanyCode, 'Year_Code': Year_Code,'VoucherNo':VoucherNo,'VoucherType' : VoucherType}
                )     

            if FilterType=="T" :   
                query = db.session.execute(
                    text('''
                  qry = "select doc_no as doc_no,convert(varchar(10),doc_date,103) as Doc_date,tran_type,transportname as PartyName,quantal,Memo_Advance,paid as received,'0' as adjusted,Balance as balance,doid as autoId , 
                        Year_Code as EntryYearCode,millshortname,'' as adjacamt,truck_no,shiptoname
                          from qrydofreightbalance where doc_no =: VoucherNo and 
                         Company_Code=:Company_Code and Year_Code=:Year_Code
                 '''),
                    {'Company_Code': CompanyCode, 'Year_Code': Year_Code,
                     'VoucherNo':VoucherNo,'VoucherType' : VoucherType}
                )   

            if FilterType == "F":
                sql = text("""
                    SELECT
                        billno AS doc_no,
                        doc_dateConverted AS Doc_date,
                        bill_tran_type AS Tran_Type,
                        billtoname AS PartyName,
                        0 AS quantal,
                        Bill_Amount,
                        received,
                        0 AS adjusted,
                        balance,
                        rbid AS autoId,
                        Year_Code AS EntryYearCode,
                        '' AS millshortname,
                        0 AS adjacamt
                    FROM dbo.qryProformaServiceBillBalance
                    WHERE billno = :VoucherNo
                    AND Company_Code = :Company_Code
                    AND Year_Code = :Year_Code
                """)

                query = db.session.execute(
                    sql,
                    {
                        "Company_Code": CompanyCode,
                        "Year_Code": Year_Code,
                        "VoucherNo": VoucherNo,
                        # "VoucherType": VoucherType,  # only if you use it in SQL
                    },
                )
            

            result = query.fetchall()
            columns = query.keys()  # Get column names
            last_details_data = [
                dict(zip(columns, row)) for row in result
            ]
            
            response = {
                "last_details_data": last_details_data,
            }

            return jsonify(response), 200

    except SQLAlchemyError as e:
        # Log and handle SQLAlchemy errors
        app.logger.error("SQLAlchemyError: %s", str(e))
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    except Exception as e:
        # Handle any other exceptions
        app.logger.error("Exception: %s", str(e))
        return jsonify({"error": "Internal server error", "message": str(e)}), 500