from flask import Flask, jsonify, request
from app import app, db
from app.models.Inword.PurchaseBill.PurchaseBillModels import SugarPurchase, SugarPurchaseDetail 
from app.models.Reports.GLedeger.GLedgerModels import Gledger
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError 
from sqlalchemy import func
import os
from app.utils.CommonGLedgerFunctions import fetch_company_parameters,get_accoid,getPurchaseAc,create_gledger_entry,send_gledger_entries,get_acShort_Name,get_ac_Name

API_URL= os.getenv('API_URL')
API_URL_SERVER = os.getenv('API_URL_SERVER')

@app.route(API_URL + "/getAmountcalculationDataForInword", methods=["GET"])
def getAmountcalculationDataForInword():
    try:
        Company_Code = request.args.get('CompanyCode')
        Ac_Code = request.args.get('Ac_Code')
        Year_Code = request.args.get('Year_Code')
        
        if not all([Company_Code, Ac_Code, Year_Code,]):
            return jsonify({"error": "Missing required parameters"}), 400

        PSAmt = 0.00
        SBAmt=0.00

        with db.session.begin_nested():
            PurchaseLegder = db.session.execute(
                    text('''
                        SELECT SUM(AMOUNT) AS AMOUNT
                        FROM NT_1_GLEDGER
                        WHERE COMPANY_CODE = :Company_Code
                        AND DRCR = 'C'
                        AND TRAN_TYPE IN ('PS','PR','RP')
                        AND Ac_Code = :Ac_Code
                        AND YEAR_CODE = :YEAR_CODE
                    '''),
                    {'Company_Code': Company_Code, 'Ac_Code': Ac_Code, 'YEAR_CODE': Year_Code}
                )
            PurchaseLegder_Data = PurchaseLegder.fetchone()
                
            if PurchaseLegder_Data and PurchaseLegder_Data[0] is not None:
            
                PSAmt += float(PurchaseLegder_Data[0] if PurchaseLegder_Data else 0)

        company_parameters = fetch_company_parameters(Company_Code, Year_Code)
        Balancelimt = company_parameters.BalanceLimit
        PurchaseTDSRate=company_parameters.PurchaseTDSRate
        TCSRate=company_parameters.TCSRate
          
        response = {
            "Balancelimt": Balancelimt,
             "PSAmt": PSAmt,
             "PurchaseTDSRate":PurchaseTDSRate,
             "TCSRate":TCSRate,
             
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500  
    

@app.route(API_URL + "/getAmountcalculationDataForOutword", methods=["GET"])
def getAmountcalculationDataForOutword():
    try:
        Company_Code = request.args.get('CompanyCode')
        SalebilltoAc = request.args.get('Ac_Code')
        Year_Code = request.args.get('Year_Code')
        
        if not all([Company_Code, SalebilltoAc, Year_Code]):
            return jsonify({"error": "Missing required parameters"}), 400

        PSAmt = 0.00
        SBAmt=0.00

        with db.session.begin_nested():
            SaleTDSApplicable = db.session.execute(
                text('''
                    SELECT TDSApplicable
                    FROM nt_1_accountmaster
                    WHERE Company_Code = :Company_Code AND Ac_Code = :SalebilltoAc
                '''),
                {'Company_Code': Company_Code, 'SalebilltoAc': SalebilltoAc}
            )
            SaleTDSApplicable_Data = SaleTDSApplicable.fetchone()
           
            if not SaleTDSApplicable_Data:
                return jsonify({"error": "Sale TDS applicability not found"}), 404

            SaleLegderamt = db.session.execute(
                    text('''
                        SELECT SUM(AMOUNT) AS AMOUNT
                        FROM qrygledger
                        WHERE COMPANY_CODE = :Company_Code
                        AND DRCR = 'D'
                        AND TRAN_TYPE IN ('SB','LV','CV','RR','RS','RB','CB''GI')
                        AND Ac_Code = :SalebilltoAc
                        AND YEAR_CODE = :YEAR_CODE
                    '''),
                    {'Company_Code': Company_Code, 'SalebilltoAc': SalebilltoAc, 'YEAR_CODE': Year_Code}
                )
            SaleLegder_Data = SaleLegderamt.fetchone()
          
            SBAmt = SaleLegder_Data[0] if SaleLegder_Data and SaleLegder_Data[0] is not None else 0

        company_parameters = fetch_company_parameters(Company_Code, Year_Code)
        Balancelimt = company_parameters.BalanceLimit
        PurchaseTDSRate=company_parameters.PurchaseTDSRate
        TCSRate=company_parameters.TCSRate
        SaleTDSRate=company_parameters.SaleTDSRate

        response = {
            "Balancelimt": Balancelimt,
             "SaleTDSApplicable_Data":SaleTDSApplicable_Data.TDSApplicable,
             "SBAmt":SBAmt,
             "PurchaseTDSRate":PurchaseTDSRate,
             "TCSRate":TCSRate,
             "SaleTDSRate":SaleTDSRate,
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500  

