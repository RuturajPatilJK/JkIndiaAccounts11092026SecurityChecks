from flask import Flask, request, jsonify
from app import app, db
from sqlalchemy.sql import text
import os
import traceback

API_URL = os.getenv('API_URL')

@app.route(API_URL + '/report-stock-book', methods=['GET'])
def get_stock_book():
    try:
        fromDate = request.args.get('fromDate')
        ToDate = request.args.get('ToDate')
        year_code = request.args.get('Year_Code')
        company_code = request.args.get('company_code')
        Item_Code = request.args.get('Item_Code')

        query = ""
        result = []
        if not Item_Code or int(Item_Code) == "0":
            query = text("""
                SELECT * 
                FROM qrystockbookfinal 
                WHERE doc_date >= :fromDate and  doc_date <= :Todate
                AND Company_Code = :company_code
                AND Year_Code = :Year_Code
                ORDER BY item_code, doc_date
            """)
            result = db.session.execute(query, {'fromDate': fromDate, 'company_code': company_code,
                                                'Todate' : ToDate,'Year_Code': year_code}).fetchall()
        
        else:
            query = text("""
                SELECT * 
                FROM qrystockbookfinal 
                WHERE  doc_date >= :fromDate and  doc_date <= :Todate
                AND Company_Code = :company_code
                 AND Year_Code = :Year_Code
                AND item_code = :Item_Code
                ORDER BY item_code, doc_date
            """)

            result = db.session.execute(query, {'fromDate': fromDate, 'company_code': company_code,
                                                'Todate' : ToDate,'Item_Code' :Item_Code,'Year_Code': year_code}).fetchall()
        
        raw_data = [dict(row._mapping) for row in result]

        cumulative_data = {}  
        processed_data = []

        for row in raw_data:
            item_code = row.get('item_code')
            item_name = row.get('Item_Name')
            doc_date = row.get('doc_date')

            if item_code not in cumulative_data:
                cumulative_data[item_code] = {
                    'op_qty': 0,
                    'op_value': 0,
                    'purc_qty': 0,
                    'purc_value': 0,
                    'sale_qty': 0,
                    'sale_val': 0,
                    'close_qty': 0,
                    'close_val': 0
                }

            inward = row.get('inward', 0) or 0
            inward_value = row.get('inwardvalue', 0) or 0
            outward = row.get('outward', 0) or 0
            outward_value = row.get('outwardvalue', 0) or 0

            op_qty = cumulative_data[item_code]['close_qty']
            op_value = cumulative_data[item_code]['close_val']
            purc_qty = inward
            purc_value = inward_value
            sale_qty = outward
            sale_val = outward_value
            close_qty = op_qty + purc_qty - sale_qty
            close_val = op_value + purc_value - sale_val

            cumulative_data[item_code]['op_qty'] = op_qty
            cumulative_data[item_code]['op_value'] = op_value
            cumulative_data[item_code]['purc_qty'] += purc_qty
            cumulative_data[item_code]['purc_value'] += purc_value
            cumulative_data[item_code]['sale_qty'] += sale_qty
            cumulative_data[item_code]['sale_val'] += sale_val
            cumulative_data[item_code]['close_qty'] = close_qty
            cumulative_data[item_code]['close_val'] = close_val

            processed_row = {
                'doc_date': doc_date,
                'item_name': item_name,
                'op_qty': op_qty,
                'op_value': op_value,
                'purc_qty': purc_qty,
                'purc_value': purc_value,
                'sale_qty': sale_qty,
                'sale_val':sale_val,
                'close_qty': cumulative_data[item_code]['close_qty'],
                'close_val': cumulative_data[item_code]['close_val'],
            }

            processed_data.append(processed_row)

        return jsonify({'data': processed_data, 'count': len(processed_data)})

    except Exception as e:
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


@app.route(API_URL + '/report-stock-book-millwise', methods=['GET'])
def get_stock_book_millwise():
    try:
        fromDate = request.args.get('fromDate')
        ToDate = request.args.get('ToDate')
        year_code = request.args.get('Year_Code')
        company_code = request.args.get('company_code')
        Item_Code = request.args.get('Item_Code')

        def pick(row, *keys):
            for k in keys:
                if k in row:
                    return row[k]
            return None

        if not Item_Code or int(Item_Code) == 0:
            query = text("""
                SELECT *
                FROM qrystockbookfinal
                WHERE doc_date >= :fromDate AND doc_date <= :Todate
                  AND Company_Code = :company_code
                ORDER BY ISNULL(Mill_Code, 0), ISNULL(item_code, 0), doc_date
            """)
            params = {
                'fromDate': fromDate,
                'company_code': company_code,
                'Todate': ToDate,
            }
        else:
            query = text("""
                SELECT *
                FROM qrystockbookfinal
                WHERE doc_date >= :fromDate AND doc_date <= :Todate
                  AND Company_Code = :company_code
                  AND item_code = :Item_Code
                ORDER BY ISNULL(Mill_Code, 0), ISNULL(item_code, 0), doc_date
            """)
            params = {
                'fromDate': fromDate,
                'company_code': company_code,
                'Todate': ToDate,
                'Item_Code': Item_Code
            }

        result = db.session.execute(query, params).fetchall()
        raw_data = [dict(row._mapping) for row in result]

        # Ledger now resets by (item_code, mill_code)
        cumulative_data = {}
        processed_data = []

        for row in raw_data:
            item_code = pick(row, 'item_code', 'Item_Code')
            item_name = pick(row, 'item_name', 'Item_Name', 'itemname')
            mill_code = pick(row, 'Mill_Code', 'mill_code')
            mill_name = pick(row, 'Mill_Name', 'mill_name', 'millname', 'MillShortName')
            doc_date = pick(row, 'doc_date', 'Doc_Date')

            # group key for running totals: item + mill
            ledger_key = f"{item_code}|{mill_code or ''}"
            if ledger_key not in cumulative_data:
                cumulative_data[ledger_key] = {
                    'close_qty': 0.0,
                    'close_val': 0.0,
                    'purc_qty_total': 0.0,
                    'purc_val_total': 0.0,
                    'sale_qty_total': 0.0,
                    'sale_val_total': 0.0,
                }

            inward = float(row.get('inward', 0) or 0)
            inward_value = float(row.get('inwardvalue', 0) or 0)
            outward = float(row.get('outward', 0) or 0)
            outward_value = float(row.get('outwardvalue', 0) or 0)

            op_qty = cumulative_data[ledger_key]['close_qty']
            op_value = cumulative_data[ledger_key]['close_val']
            purc_qty = inward
            purc_value = inward_value
            sale_qty = outward
            sale_val = outward_value
            close_qty = op_qty + purc_qty - sale_qty
            close_val = op_value + purc_value - sale_val

            # update running
            cd = cumulative_data[ledger_key]
            cd['close_qty'] = close_qty
            cd['close_val'] = close_val
            cd['purc_qty_total'] += purc_qty
            cd['purc_val_total'] += purc_value
            cd['sale_qty_total'] += sale_qty
            cd['sale_val_total'] += sale_val

            processed_row = {
                'doc_date': doc_date,
                'item_code': item_code,
                'item_name': item_name,
                'mill_code': mill_code,
                'mill_name': mill_name,

                'op_qty': op_qty,
                'op_value': op_value,
                'purc_qty': purc_qty,
                'purc_value': purc_value,
                'sale_qty': sale_qty,
                'sale_val': sale_val,
                'close_qty': close_qty,
                'close_val': close_val,
            }

            processed_data.append(processed_row)

        return jsonify({'data': processed_data, 'count': len(processed_data)})
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


@app.route(API_URL + '/stock-book-detail', methods=['GET'])
def get_stock_book_detail():
    try:
        Item_Code = request.args.get('Item_Code')
        doc_date = request.args.get('doc_date')
        from_date = request.args.get('from_date')
        company_code = request.args.get('company_code')
        year_code = request.args.get('Year_Code')

        if not doc_date or not company_code:
            return jsonify({'error': 'Missing required parameters'}), 400

        if not Item_Code:
            query = text("""
                SELECT * 
                FROM qrystockbookDetail 
                WHERE doc_date >= :from_date
                  AND doc_date <= :doc_date 
                  AND Company_Code = :company_code
                  AND Year_Code = :Year_Code
                ORDER BY doc_date ASC, doc_no ASC, DoNO ASC
            """)
            params = {'from_date': from_date, 'doc_date': doc_date, 'company_code': company_code,'Year_Code':year_code}
        else:
            query = text("""
                SELECT * 
                FROM qrystockbookDetail 
                WHERE doc_date >= :from_date
                  AND doc_date <= :doc_date 
                  AND item_code = :Item_Code 
                  AND Company_Code = :company_code
                    AND Year_Code = :Year_Code
                ORDER BY doc_date ASC, Tran_Type ASC, doc_no ASC
            """)
            params = {'from_date': from_date, 'doc_date': doc_date, 'Item_Code': Item_Code, 'company_code': company_code,'Year_Code':year_code}

        result = db.session.execute(query, params).fetchall()
        data = [dict(row._mapping) for row in result]

        total_balqntl = 0
        for item in data:
            item['inwqntl'] = item['Quantal'] if item.get('drcr') == "D" else 0
            item['outqntl'] = item['Quantal'] if item.get('drcr') == "C" else 0
            item['opqntl'] = total_balqntl
            item['bal'] = item['opqntl'] + item['inwqntl'] - item['outqntl']
            total_balqntl = item['bal']

        return jsonify({'data': data, 'count': len(data)})

    except Exception as e:                        
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route(API_URL+'/retail-stock-book-detail', methods=['GET'])
def get_retail_stock_book_detail():
    try:
        Item_Code = request.args.get('Item_Code')
        doc_date = request.args.get('doc_date')  
        company_code = request.args.get('company_code')  

        if Item_Code == "":
            query = text("""
                SELECT * 
                FROM qrystockbookDetailsefl 
                WHERE doc_date <= :doc_date 
                  AND Company_Code = :company_code
            """)
            params = {'doc_date': doc_date, 'company_code': company_code}
        else:
            query = text("""
                SELECT * 
                FROM qrystockbookDetailsefl 
                WHERE doc_date <= :doc_date 
                  AND item_code = :Item_Code 
                  AND Company_Code = :company_code
            """)
            params = {'doc_date': doc_date, 'Item_Code': Item_Code, 'company_code': company_code}

        result = db.session.execute(query, params).fetchall()

        data = [dict(row._mapping) for row in result]

        total_balqntl = 0
        for item in data:
            item['inwqntl'] = item['Quantal'] if item.get('drcr') == "D" else 0
            item['outqntl'] = item['Quantal'] if item.get('drcr') == "C" else 0
            item['bal'] = item['inwqntl'] - item['outqntl']
            item['opqntl'] = total_balqntl + item['outqntl'] - item['inwqntl']
            total_balqntl = item['opqntl']

        return jsonify({'data': data, 'count': len(data)})

    except Exception as e:
        return jsonify({'error': str(e)}), 500
        