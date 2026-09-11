from app import app, db
from sqlalchemy.exc import SQLAlchemyError 
from sqlalchemy import text
from flask import jsonify, request
import os
from decimal import Decimal

API_URL = os.getenv('API_URL')

def decimal_to_float(value):
    if value is None:
        return 0.0
    if isinstance(value, Decimal):
        return float(value)
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


@app.route(API_URL + '/purchase-top-sellers', methods=['GET'])
def purchase_top_sellers():
    try:
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        company_code = request.args.get('company_code')
        
        if not from_date or not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400
       
        params = {
            'from_date': from_date,
            'to_date': to_date,
            'company_code': company_code
        }

        query_str = '''
        SELECT 
                CompanyPan,
                MIN(suppliername) AS suppliername,
                MIN(suppliergstno) AS suppliergstno,
                COUNT(*) AS BillCount,
                SUM(ISNULL(NETQNTL, 0)) AS TotalNetQntl,
                SUM(ISNULL(subTotal, 0)) AS TotalTaxable,
                SUM(ISNULL(CGSTAmount, 0)) AS TotalCGST,
                SUM(ISNULL(SGSTAmount, 0)) AS TotalSGST,
                SUM(ISNULL(IGSTAmount, 0)) AS TotalIGST,
                SUM(
                    ISNULL(subTotal, 0) 
                + ISNULL(CGSTAmount, 0) 
                + ISNULL(SGSTAmount, 0) 
                + ISNULL(IGSTAmount, 0)
                ) AS TotalBillAmount
            FROM dbo.qrypurchasehead
                        WHERE 
                 Company_Code = :company_code 
                AND doc_date >= :from_date 
                AND doc_date < :to_date
           GROUP BY CompanyPan
        ORDER BY TotalNetQntl DESC;
        '''
        

        with db.session.begin():
            query = db.session.execute(text(query_str), params)
            results = query.mappings().all()
            
            sellers_list = [dict(row) for row in results]

        response = {
            'summary': {
                'from_date': from_date,
                'to_date': to_date,
                'company_code': company_code,
                'total_sellers_found': len(sellers_list),
            },
            'sellers': sellers_list
        }

        return jsonify(response)

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': f'Database error: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500
    

#get monthwise quintal purchase of a seller
@app.route(API_URL + '/purchase-seller-monthwise-quintal', methods=['GET'])
def purchase_seller_monthwise_quintal():
    try:
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        company_code = request.args.get('company_code')
        company_pan = request.args.get('company_pan')

        if not from_date or not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400
       
        if not company_pan:
            return jsonify({'error': 'company_pan is required'}), 400

        params = {
            'from_date': from_date,
            'to_date': to_date,
            'company_code': company_code,
            'company_pan': company_pan
        }

        query_str = '''
            SELECT 
                DATENAME(MONTH, doc_date) AS MonthName,
                YEAR(doc_date) AS Year,
                MONTH(doc_date) AS MonthNumber,
                SUM(ISNULL(NETQNTL, 0)) AS TotalQuintal,
                COUNT(*) AS BillCount
            FROM dbo.qrypurchasehead
            WHERE  Company_Code = :company_code 
                AND doc_date >= :from_date 
                AND CompanyPan = :company_pan
            GROUP BY YEAR(doc_date), MONTH(doc_date), DATENAME(MONTH, doc_date)
            ORDER BY YEAR(doc_date), MONTH(doc_date)
        '''

        with db.session.begin():
            query = db.session.execute(text(query_str), params)
            results = query.mappings().all()
            
            if not results:
                response = {
                    'error': 'No data found for the specified seller and date range',
                    'filters': {
                        'from_date': from_date,
                        'to_date': to_date,
                        'company_code': company_code,
                        'company_pan': company_pan
                    }
                }
                return jsonify(response), 404
            
            monthwise_quintal = []
            total_overall_quintal = 0.0
            total_bills = 0
            
            seller_query_str = '''
                SELECT TOP 1 
                    CompanyPan, 
                    suppliername, 
                    suppliergstno
                FROM dbo.qrypurchasehead
                WHERE 
                     Company_Code = :company_code 
                    AND doc_date > :from_date 
                    AND doc_date < :to_date
                    AND CompanyPan = :company_pan
            '''
            
            seller_query = db.session.execute(text(seller_query_str), params)
            seller_result = seller_query.mappings().first()
            
            seller_info = {}
            if seller_result:
                seller_info = dict(seller_result)
            
            for row in results:
                row_dict = dict(row)
                
                month_data = {
                    'month': f"{row_dict.get('MonthName', '')} {row_dict.get('Year', '')}",
                    'month_name': row_dict.get('MonthName', ''),
                    'year': row_dict.get('Year', ''),
                    'month_number': row_dict.get('MonthNumber', ''),
                    'total_quintal': decimal_to_float(row_dict.get('TotalQuintal')),
                    'bill_count': int(row_dict.get('BillCount', 0))
                }
                
                month_data['total_quintal'] = round(month_data['total_quintal'], 2)
                
                monthwise_quintal.append(month_data)
                
                total_overall_quintal += month_data['total_quintal']
                total_bills += month_data['bill_count']
            
            total_overall_quintal = round(total_overall_quintal, 2)

        response = {
            'seller_info': seller_info,
            'summary': {
                'total_quintal': total_overall_quintal,
                'total_bills': total_bills,
            },
            
            'monthwise_quintal': monthwise_quintal,
            'total_months': len(monthwise_quintal)
        }

        return jsonify(response)

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': f'Database error: {str(e)}'}), 500
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500