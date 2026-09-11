from flask import jsonify
from app import app, db
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import text
import os

API_URL = os.getenv('API_URL')

@app.route(API_URL + '/tds-sections', methods=['GET'])
def tds_sections():
    try:
        with db.session.begin_nested():
            query = db.session.execute(text('SELECT * FROM TDS_Sections ORDER BY id desc'))
            result = query.fetchall()

        response = []
        for row in result:
            response.append(dict(row._mapping)) 

        return jsonify(response)

    except SQLAlchemyError as error:
        print("Error fetching data:", error)
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500
