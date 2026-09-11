from flask import jsonify
from app import app, db
from sqlalchemy.exc import SQLAlchemyError 
from sqlalchemy import text
from flask import jsonify, request
import os

API_URL = os.getenv('API_URL')

@app.route(API_URL + '/BrandNO', methods=['GET'])
def BrandNO():
    try:
        CompanyCode = request.args.get('CompanyCode')
        ItemNo = request.args.get('ItemNo')

        if CompanyCode is None or ItemNo is None:
            return jsonify({'error': 'Missing CompanyCode or ItemNo parameter'}), 400

        # Start a database transaction
        with db.session.begin_nested():
            query = db.session.execute(text('''
                SELECT Item_Code,
                    Brand_Code,
                    brandName AS Brand_Name,
                    Wt_per,
                    qty,
                    sold,
                    balance,
                    Year_Code,
                    BrandRate AS Rate
                FROM qrygrainstockbalance
                WHERE balance != 0 
                  AND Company_Code = :CompanyCode 
                  AND Item_Code = :ItemNo
                ORDER BY Item_Code DESC
            '''), {'CompanyCode': CompanyCode, 'ItemNo': ItemNo})

            result = query.fetchall()

        response = []
        for row in result:
            response.append({
                'Item_Code' : row.Item_Code,
                'Brand_Code': row.Brand_Code,
                'Brand_Name': row.Brand_Name,
                'Wt_per': row.Wt_per,
                'qty': row.qty,
                'sold': row.sold,
                'balance': row.balance,
                'Year_Code': row.Year_Code,
                'Rate': row.Rate
            })

        return jsonify(response)

    except SQLAlchemyError as error:
        print("Error fetching data:", error)
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500


@app.route(API_URL + '/getItemNo_Data', methods=['GET'])
def getItemNo_Data():
    try:
        CompanyCode = request.args.get('CompanyCode')
        ItemNo = request.args.get('ItemNo')
        BrandNo = request.args.get('BrandNo')


        if CompanyCode is None  or BrandNo is None:
            return jsonify({'error': 'Missing CompanyCode or ItemNo parameter'}), 400

        # Start a database transaction
        with db.session.begin_nested():
            query = db.session.execute(text('''
                SELECT Item_Code,
                    Brand_Code,
                    brandName AS Brand_Name,
                    Wt_per,
                    qty,
                    sold,
                    balance,
                    Year_Code,
                    BrandRate AS Rate
                FROM qrygrainstockbalance
                WHERE balance != 0 
                  AND Company_Code = :CompanyCode 
                   and Brand_Code = :BrandNo                         
                    and Item_Code =:ItemNo                         
                 
                ORDER BY Item_Code DESC
            '''), {'CompanyCode': CompanyCode, 'BrandNo' : BrandNo,'ItemNo' : ItemNo})

            result = query.fetchall()
        last_details_data = []
        response = []
        for row in result:
            last_details_data.append({
                'Item_Code' : row.Item_Code,
                'Brand_Code': row.Brand_Code,
                'Brand_Name': row.Brand_Name,
                'Wt_per': row.Wt_per,
                'qty': row.qty,
                'sold': row.sold,
                'balance': row.balance,
                'Year_Code': row.Year_Code,
                'Rate': row.Rate
            })

        response = {
            "last_details_data": last_details_data
        }

        return jsonify(response)

    except SQLAlchemyError as error:
        print("Error fetching data:", error)
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500