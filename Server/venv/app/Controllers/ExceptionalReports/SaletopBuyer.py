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


@app.route(API_URL + '/top-buyer-percentage-report', methods=['GET'])
def top_buyer_percentage_report():
    try:
        company_code = request.args.get('Company_Code') or request.args.get('company_code')
        year_code = request.args.get('Year_Code') or request.args.get('year_code')

        if not company_code or not year_code:
            return jsonify({'error': 'Company_Code and Year_Code are required'}), 400

        params = {'company_code': company_code, 'year_code': year_code}

        query_str = '''
            SELECT
                a.Ac_Code,
                a.Ac_Name_E,
                a.accoid,
                s.yearly_turnover,
                s.yearly_turnover * 100.0 / t.total_turnover AS turnover_percentage,
                s.Company_Code,
                s.Year_Code
            FROM (
                SELECT
                    ac,
                    Company_Code,
                    Year_Code,
                    SUM(TaxableAmount) AS yearly_turnover
                FROM dbo.nt_1_sugarsale
                WHERE Company_Code = :company_code AND Year_Code = :year_code
                GROUP BY ac, Company_Code, Year_Code
            ) s
            INNER JOIN dbo.nt_1_accountmaster a
                ON s.ac = a.accoid
            CROSS JOIN (
                SELECT SUM(TaxableAmount) AS total_turnover
                FROM dbo.nt_1_sugarsale
                WHERE Company_Code = :company_code AND Year_Code = :year_code
            ) t
            ORDER BY turnover_percentage DESC
        '''

        with db.session.begin():
            query = db.session.execute(text(query_str), params)
            results = query.mappings().all()
            data = [dict(row) for row in results]

            for row in data:
                row['yearly_turnover'] = decimal_to_float(row['yearly_turnover'])
                row['turnover_percentage'] = decimal_to_float(row['turnover_percentage'])

        return jsonify(data)

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': f'Database error: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500


@app.route(API_URL + '/sale-top-buyers', methods=['GET'])
def sale_top_buyers():
    try:
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        company_code = request.args.get('company_code')

        if not from_date or not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400
        if not company_code:
            return jsonify({'error': 'company_code is required'}), 400

        params = {
            'from_date': from_date,
            'to_date': to_date,
            'company_code': company_code
        }

        query_str = '''
        SELECT 
            Carporate_Pan,
            MIN(billtoname) AS Customer_Name,
            MIN(billtogstno) AS Customer_GSTN,
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
        FROM dbo.qrysalehead
        WHERE IsDeleted = 1 
            AND Company_Code = :company_code 
            AND doc_date >= :from_date 
            AND doc_date < :to_date
        GROUP BY Carporate_Pan
        ORDER BY TotalNetQntl DESC;
        '''

        with db.session.begin():
            query = db.session.execute(text(query_str), params)
            results = query.mappings().all()
            
            buyers_list = [dict(row) for row in results]

            # Convert Decimal values to float for JSON serialization
            for buyer in buyers_list:
                buyer['TotalNetQntl'] = decimal_to_float(buyer['TotalNetQntl'])
                buyer['TotalTaxable'] = decimal_to_float(buyer['TotalTaxable'])
                buyer['TotalCGST'] = decimal_to_float(buyer['TotalCGST'])
                buyer['TotalSGST'] = decimal_to_float(buyer['TotalSGST'])
                buyer['TotalIGST'] = decimal_to_float(buyer['TotalIGST'])
                buyer['TotalBillAmount'] = decimal_to_float(buyer['TotalBillAmount'])

        response = {
            'summary': {
                'from_date': from_date,
                'to_date': to_date,
                'company_code': company_code,
                'total_buyers_found': len(buyers_list),
            },
            'buyers': buyers_list
        }

        return jsonify(response)

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': f'Database error: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500




@app.route(API_URL + '/sale-buyer-monthwise-quintal', methods=['GET'])
def sale_buyer_monthwise_quintal():
    try:
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        company_code = request.args.get('company_code')
        carporate_pan = request.args.get('carporate_pan')

        if not from_date or not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400
        if not company_code:
            return jsonify({'error': 'company_code is required'}), 400
        if not carporate_pan:
            return jsonify({'error': 'carporate_pan is required'}), 400

        params = {
            'from_date': from_date,
            'to_date': to_date,
            'company_code': company_code,
            'carporate_pan': carporate_pan
        }

        query_str = '''
            SELECT 
                DATENAME(MONTH, doc_date) AS MonthName,
                YEAR(doc_date) AS Year,
                MONTH(doc_date) AS MonthNumber,
                SUM(ISNULL(NETQNTL, 0)) AS TotalQuintal,
                COUNT(*) AS BillCount
            FROM dbo.qrysalehead
            WHERE IsDeleted = 1 
                AND Company_Code = :company_code 
                AND doc_date >= :from_date 
                AND doc_date < :to_date
                AND Carporate_Pan = :carporate_pan
            GROUP BY YEAR(doc_date), MONTH(doc_date), DATENAME(MONTH, doc_date)
            ORDER BY YEAR(doc_date), MONTH(doc_date)
        '''

        with db.session.begin():
            query = db.session.execute(text(query_str), params)
            results = query.mappings().all()
            
            if not results:
                response = {
                    'error': 'No data found for the specified buyer and date range',
                    'filters': {
                        'from_date': from_date,
                        'to_date': to_date,
                        'company_code': company_code,
                        'carporate_pan': carporate_pan
                    }
                }
                return jsonify(response), 404
            
            monthwise_quintal = []
            total_overall_quintal = 0.0
            total_bills = 0
            
            buyer_query_str = '''
                SELECT TOP 1 
                    Carporate_Pan,
                    billtoname AS Customer_Name,
                    billtogstno AS Customer_GSTN
                FROM dbo.qrysalehead
                WHERE IsDeleted = 1 
                    AND Company_Code = :company_code 
                    AND doc_date >= :from_date 
                    AND doc_date < :to_date
                    AND Carporate_Pan = :carporate_pan
            '''
            
            buyer_query = db.session.execute(text(buyer_query_str), params)
            buyer_result = buyer_query.mappings().first()
            
            buyer_info = {}
            if buyer_result:
                buyer_info = dict(buyer_result)
            
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
            'buyer_info': buyer_info,
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