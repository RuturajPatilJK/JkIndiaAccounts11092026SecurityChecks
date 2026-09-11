from flask import request, jsonify
from datetime import datetime, timedelta
from sqlalchemy import text
from collections import defaultdict
from app import app, db
from app.models.AnalyticsModel.PeriodicSaleModel import MonthTable
import os

API_URL = os.getenv('API_URL')

# Insert missing dates, update dayqntl, average, and monthlysale 
@app.route(API_URL+'/get-periodic-sale-dates', methods=['GET'])
def get_periodic_sale_dates():
    start_date_str = request.args.get('start_date_str')
    end_date_str = request.args.get('end_date_str')

    try:
        start_date = datetime.strptime(start_date_str, "%Y-%m-%d")
        end_date = datetime.strptime(end_date_str, "%Y-%m-%d")

        if start_date > end_date:
            return jsonify({'error': 'Start date cannot be after end date'}), 400

        # Insert missing dates
        for i in range((end_date - start_date).days + 1):
            current_date = start_date + timedelta(days=i)
            existing = MonthTable.query.filter_by(Doc_date=current_date.date()).first()
            if not existing:
                new_entry = MonthTable(
                    Doc_date=current_date.date(),
                    Month=current_date.month,
                    Year=current_date.year,
                    dayqntl=0,
                    target=10
                )
                db.session.add(new_entry)
        db.session.commit()

        query = text('''
            SELECT 
                CAST(doc_date AS DATE) AS doc_date,
                CAST(SUM(NETQNTL) AS FLOAT) / 10 AS total_qntl
            FROM nt_1_sugarsale
            WHERE CAST(doc_date AS DATE) BETWEEN :start AND :end and IsDeleted = 1
            GROUP BY CAST(doc_date AS DATE)
        ''')

        result = db.session.execute(query, {
            "start": start_date,
            "end": end_date
        }).fetchall()

        for row in result:
            doc_date = row.doc_date
            total_qntl = float(row.total_qntl or 0)
            record = MonthTable.query.filter_by(Doc_date=doc_date).first()
            if record:
                record.dayqntl = total_qntl 
        db.session.commit()

        records = MonthTable.query.filter(
            MonthTable.Doc_date >= start_date.date(),
            MonthTable.Doc_date <= end_date.date()
        ).order_by(MonthTable.Doc_date).all()

        running_sum = 0
        day_count = 0
        last_month = None
        last_year = None

        for record in records:
            doc_date = record.Doc_date
            current_month = doc_date.month
            current_year = doc_date.year
            day_qntl = float(record.dayqntl or 0)

            if current_month != last_month or current_year != last_year:
                running_sum = day_qntl
                day_count = 1
            else:
                running_sum += day_qntl
                day_count += 1

            record.average = round(running_sum / day_count, 2)
            last_month = current_month
            last_year = current_year

        db.session.commit()

        month_groups = defaultdict(list)
        for record in records:
            key = (record.Doc_date.month, record.Doc_date.year)
            month_groups[key].append(record)

        for (month, year), rows in month_groups.items():
            total_monthly_qntl = round(sum(r.dayqntl or 0 for r in rows), 2)
            for r in rows:
                r.monthlysale = total_monthly_qntl

        db.session.commit()

        return jsonify({
            'status': 'Success',
            'months_updated': [f"{m}/{y}" for (m, y) in month_groups.keys()]
        }), 200

    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

#get-periodic-sale-analytics
@app.route(API_URL+'/get-periodic-sale-data', methods=['GET'])
def get_periodic_sale_data():
    try:
        start_date_str = request.args.get('start_date_str')
        end_date_str = request.args.get('end_date_str')

        if start_date_str and end_date_str:
            start = datetime.strptime(start_date_str, "%Y-%m-%d").date()
            end = datetime.strptime(end_date_str, "%Y-%m-%d").date()

            records = MonthTable.query.filter(
                MonthTable.Doc_date >= start,
                MonthTable.Doc_date <= end
            ).order_by(MonthTable.Doc_date).all()
        else:
            month = int(request.args.get('month'))
            year = int(request.args.get('year'))
            records = MonthTable.query.filter_by(Month=month, Year=year)\
                .order_by(MonthTable.Doc_date).all()

        result = [{
            'Doc_date': r.Doc_date.strftime("%Y-%m-%d"),
            'dayqntl': r.dayqntl,
            'average': r.average,
            'monthlysale': r.monthlysale,
            'target':r.target
        } for r in records]

        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
