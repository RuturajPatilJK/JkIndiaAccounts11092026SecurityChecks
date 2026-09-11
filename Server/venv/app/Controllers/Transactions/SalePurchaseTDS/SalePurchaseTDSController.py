from flask import request, jsonify
from app import app, db
from app.models.Transactions.SalePurchaseTDS.SalePurchaseTDSModels import SaleTDS
from sqlalchemy.inspection import inspect
import os

API_URL = os.getenv('API_URL')

@app.route(API_URL + "/getNextsalepurchasetdsid", methods=["GET"])
def get_next_salepurchasetds_id():
    try:
        last_sale = SaleTDS.query.order_by(SaleTDS.id.desc()).first()
        next_id = 1 if not last_sale else last_sale.id + 1

        return jsonify({"data": {"next_id": next_id}}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route(API_URL + "/getAllsalepurchasetds", methods=["GET"])
def getAllsalepurchasetds():
    try:
        sales = SaleTDS.query.all()
        result = []

        for sale in sales:
            row = {
                column.name: getattr(sale, column.name)
                for column in SaleTDS.__table__.columns
            }
            for k, v in row.items():
                if isinstance(v, db.Numeric):
                    row[k] = float(v)
            result.append(row)

        return jsonify({"data": result}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route(API_URL+"/getsalepurchasetdsbyid", methods=["GET"])
def getsalepurchasetdsbyid():
    sale_tds_id = request.args.get("id")
    
    if not sale_tds_id:
        return jsonify({'error': 'Missing required parameters'}), 400

    try:
        sale_tds_id = int(sale_tds_id)
    except ValueError:
        return jsonify({'error': 'Invalid id format'}), 400

    sale = SaleTDS.query.get(sale_tds_id)
    if not sale:
        return jsonify({'error': 'Sale_TDS record not found'}), 404

    result = {column.name: getattr(sale, column.name) for column in SaleTDS.__table__.columns}

    for k, v in result.items():
        if isinstance(v, (float, int)):
            continue
        try:
            result[k] = float(v)
        except (TypeError, ValueError):
            pass

    return jsonify(result), 200


@app.route(API_URL+"/insert-salepurchasetds", methods=["POST"])
def insert_salepurchasetds():
    data = request.get_json()

    if not data:
        return jsonify({"error": "Missing JSON body"}), 400

    mapper = inspect(SaleTDS)
    model_columns = [
        col.key for col in mapper.column_attrs
        if not getattr(col.columns[0], 'autoincrement', False) and not col.columns[0].nullable and col.key != 'id'
    ]

    missing_or_null = [field for field in model_columns if field not in data or data[field] is None]
    if missing_or_null:
        return jsonify({"error": f"Missing or null fields: {', '.join(missing_or_null)}"}), 400

    try:
        sale_data = {key: data[key] for key in data if key in [c.key for c in mapper.column_attrs]}
        sales = SaleTDS(**sale_data)

        db.session.add(sales)
        db.session.commit()

        return jsonify({
            "message": "Sale_TDS record created successfully",
            "id": sales.id
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@app.route(API_URL+"/update-salepurchasetds", methods=["PUT"])
def update_salepurchasetds():
    id = request.args.get("id")
    if not id:
        return jsonify({"error": "Missing required parameters"}), 400

    try:
        id = int(id)
    except ValueError:
        return jsonify({"error": "Invalid id format"}), 400

    sale_tds = SaleTDS.query.get(id)
    if not sale_tds:
        return jsonify({"error": "Sale_TDS record not found"}), 404

    data = request.get_json()
    if not data:
        return jsonify({"error": "Missing JSON body"}), 400

    model_columns = [col.key for col in inspect(SaleTDS).column_attrs if col.key != 'id']

    try:
        for field in model_columns:
            if field in data:
                setattr(sale_tds, field, data[field])

        db.session.commit()

        updated_data = {col: getattr(sale_tds, col) for col in model_columns}
        updated_data['id'] = sale_tds.id 

        return jsonify({
            "message": "Sale_TDS record updated successfully",
            "updated_data": updated_data
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@app.route(API_URL+"/deletesalepurchasetdsbyid", methods=["DELETE"])
def deletesalepurchasetdsbyid():
    sale_id = request.args.get("id")
    if not sale_id:
        return jsonify({"error": "Missing required parameters"}), 400

    try:
        sale_id = int(sale_id)
    except ValueError:
        return jsonify({"error": "Invalid id format"}), 400

    sale_record = SaleTDS.query.get(sale_id)
    if not sale_record:
        return jsonify({"error": "Sale_TDS record not found"}), 404

    try:
        db.session.delete(sale_record)
        db.session.commit()
        return jsonify({"message": f"Sale_TDS record with ID {sale_id} deleted successfully"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500



@app.route(API_URL + "/getLastsalepurchasetds", methods=["GET"])
def get_last_salepurchasetds():
    try:
        # Get the last record by ID in descending order
        last_record = SaleTDS.query.order_by(SaleTDS.id.desc()).first()

        if not last_record:
            return jsonify({"message": "No record found"}), 404

        result = {
            column.name: getattr(last_record, column.name)
            for column in SaleTDS.__table__.columns
        }

        # Convert Decimal fields to float
        for k, v in result.items():
            try:
                result[k] = float(v)
            except (TypeError, ValueError):
                pass

        return jsonify({"data": result}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

