from flask import jsonify, request
from app import app, db
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import text
import os

# Get the base URL from environment variables
API_URL = os.getenv('API_URL')

@app.route(API_URL + '/profit-loss-lot-no', methods=['GET'])
def profit_loss_lot_no():
    try:
        # Extract parameters from query
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')
        Mill_Code = request.args.get('Mill_Code')

        # Validate required parameters
        if not Company_Code or not Year_Code or not Mill_Code:
            return jsonify({'error': 'Missing required parameters: Company_Code, Year_Code, or Mill_Code'}), 400

        # Execute the query
        with db.session.begin_nested():
            query = db.session.execute(text('''
                SELECT Tender_No,
                       CONVERT(VARCHAR(10), Tender_Date, 103) AS Tender_Date
                FROM nt_1_tender
                WHERE Company_Code = :company_code
                  AND Year_Code = :year_code
                  AND Mill_Code = :mill_code
                ORDER BY Tender_No
            '''), {
                'company_code': Company_Code,
                'year_code': Year_Code,
                'mill_code': Mill_Code
            })

            result = query.fetchall()

        # Prepare the response
        response = []
        for row in result:
            response.append({
                'Tender_No': row.Tender_No,
                'Tender_Date': row.Tender_Date
            })

        return jsonify(response), 200

    except SQLAlchemyError as error:
        print("Error fetching data:", error)
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500
