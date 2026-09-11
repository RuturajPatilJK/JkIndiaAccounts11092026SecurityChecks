
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

@app.route(API_URL+'/UtrLotno', methods=['GET'])
def UtrLotno():
    try:
        CompanyCode = request.args.get('CompanyCode')
        MillCode = request.args.get('MillCode')

        if CompanyCode is None or MillCode is None:
            return jsonify({'error': 'Missing MillCode or CompanyCode parameter'}), 400

        # Start a database transaction
        with db.session.begin_nested():
            query = db.session.execute(text('''
                SELECT Tender_No, Tender_DateConverted AS Tender_Date, Quantal, Party_Bill_Rate AS Mill_Rate, 
                       millamt1 AS millamount, paidamount, payableamount, Year_Code, Grade, millshortname
                FROM qrymillpaymentbalance
                WHERE payableamount != 0 AND Company_Code = :CompanyCode AND Payment_To = :MillCode
                order by Tender_No desc
            '''), {'CompanyCode': CompanyCode, 'MillCode': MillCode})

            result = query.fetchall()

        # Construct the response
        response = [{
            'Tender_No': row.Tender_No,
            'Tender_Date': row.Tender_Date,
            'Quantal': row.Quantal,
            'Party_Bill_Rate': row.Mill_Rate,
            'millamount': row.millamount,
            'paidamount': row.paidamount,
            'payableamount': row.payableamount,
            'Year_Code': row.Year_Code,
            'Grade': row.Grade,
            'millshortname': row.millshortname
        } for row in result]

        return jsonify(response)

    except SQLAlchemyError as error:
        # Handle database errors
        logger.error("Traceback: %s", traceback.format_exc())
        logger.error("Error fetching data: %s", error)
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500
    
@app.route(API_URL + "/getUTrLotno_Data", methods=["GET"])
def getUTrLotno_Data():
    try:
        Company_Code = request.args.get('CompanyCode')
        Tenderno = request.args.get('Tender_No')

        if not all([Company_Code, Tenderno]):
            return jsonify({"error": "Missing required parameters"}), 400

        with db.session.begin_nested():
            # Execute query
            query = db.session.execute(
                text('''
                    SELECT Tender_No, Tender_DateConverted AS Tender_Date, Quantal, Party_Bill_Rate AS Mill_Rate,
                           millamt1 AS millamount, paidamount, payableamount, Year_Code, Grade, millshortname,Company_Code,tenderid
                    FROM qrymillpaymentbalance
                    WHERE payableamount != 0 AND Company_Code = :Company_Code AND Tender_No = :Tenderno
                '''),
                {'Company_Code': Company_Code, 'Tenderno': Tenderno}
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