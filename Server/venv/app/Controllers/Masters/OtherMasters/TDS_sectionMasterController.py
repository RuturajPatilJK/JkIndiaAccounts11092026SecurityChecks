
# from flask import jsonify, request
# from app import app, db
# from app.models.Masters.OtherMasters.TDS_sectionMasterModel import TDS_Sections
# import os

# # Get API URL
# API_URL = os.getenv('API_URL')


# # GET ALL
# @app.route(API_URL + "/getall-TDSSections", methods=["GET"])
# def getall_TDSSections():
#     try:
#         records = TDS_Sections.query.order_by(TDS_Sections.id.desc()).all()

#         record_data = []

#         for record in records:
#             selected_Record_data = {
#                 column.key: getattr(record, column.key)
#                 for column in record.__table__.columns
#             }
#             record_data.append(selected_Record_data)

#         return jsonify(record_data)

#     except Exception as e:
#         print(e)
#         return jsonify({'error': 'internal server error'}), 500


# # GET BY ID
# @app.route(API_URL + "/get-TDSSection-byid", methods=["GET"])
# def get_TDSSection_byid():
#     try:
#         id = request.args.get('id')

#         if id is None:
#             return jsonify({'error': 'Missing id parameter'}), 400

#         try:
#             id = int(id)
#         except ValueError:
#             return jsonify({'error': 'Invalid id parameter'}), 400

#         record = TDS_Sections.query.filter_by(id=id).first()

#         if record is None:
#             return jsonify({'error': 'Record not found'}), 404

#         record_data = {
#             column.key: getattr(record, column.key)
#             for column in record.__table__.columns
#         }

#         return jsonify(record_data)

#     except Exception as e:
#         print(e)
#         return jsonify({'error': 'internal server error'}), 500


# # POST
# @app.route(API_URL + "/create-TDSSection", methods=["POST"])
# def create_TDSSection():
#     try:
#         data = request.get_json()

#         new_record = TDS_Sections(
#             Nature_of_Payment=data.get('Nature_of_Payment'),
#             Section=data.get('Section'),
#             Section_Code=data.get('Section_Code')
#         )

#         db.session.add(new_record)
#         db.session.commit()

#         return jsonify({
#             'success': True,
#             'message': 'Record created successfully',
#             'id': new_record.id
#         })

#     except Exception as e:
#         db.session.rollback()
#         print(e)
#         return jsonify({'error': 'internal server error'}), 500


# # UPDATE
# @app.route(API_URL + "/update-TDSSection", methods=["PUT"])
# def update_TDSSection():
#     try:
#         data = request.get_json()

#         id = data.get('id')

#         if not id:
#             return jsonify({'error': 'Missing id'}), 400

#         record = TDS_Sections.query.filter_by(id=id).first()

#         if record is None:
#             return jsonify({'error': 'Record not found'}), 404

#         record.Nature_of_Payment = data.get(
#             'Nature_of_Payment',
#             record.Nature_of_Payment
#         )

#         record.Section = data.get(
#             'Section',
#             record.Section
#         )

#         record.Section_Code = data.get(
#             'Section_Code',
#             record.Section_Code
#         )

#         db.session.commit()

#         return jsonify({
#             'success': True,
#             'message': 'Record updated successfully'
#         })

#     except Exception as e:
#         db.session.rollback()
#         print(e)
#         return jsonify({'error': 'internal server error'}), 500


# # DELETE
# @app.route(API_URL + "/delete-TDSSection", methods=["DELETE"])
# def delete_TDSSection():
#     try:
#         id = request.args.get('id')

#         if id is None:
#             return jsonify({'error': 'Missing id parameter'}), 400

#         try:
#             id = int(id)
#         except ValueError:
#             return jsonify({'error': 'Invalid id parameter'}), 400

#         record = TDS_Sections.query.filter_by(id=id).first()

#         if record is None:
#             return jsonify({'error': 'Record not found'}), 404

#         db.session.delete(record)
#         db.session.commit()

#         return jsonify({
#             'success': True,
#             'message': 'Record deleted successfully'
#         })

#     except Exception as e:
#         db.session.rollback()
#         print(e)
#         return jsonify({'error': 'internal server error'}), 500
    



    

# # FIRST RECORD
# @app.route(API_URL + "/get-first-TDSSection", methods=["GET"])
# def get_first_TDSSection():
#     try:

#         first_record = TDS_Sections.query.order_by(
#             TDS_Sections.id.asc()
#         ).first()

#         if first_record:

#             first_record_data = {
#                 column.key: getattr(first_record, column.key)
#                 for column in first_record.__table__.columns
#             }

#             response = {
#                 "first_TDSSection_data": first_record_data
#             }

#             return jsonify(response), 200

#         else:
#             return jsonify({
#                 'error': 'No records found'
#             }), 404

#     except Exception as e:
#         print(e)
#         return jsonify({
#             'error': 'Internal server error'
#         }), 500

# # LAST RECORD
# @app.route(API_URL + "/get-last-TDSSection", methods=["GET"])
# def get_last_TDSSection():
#     try:

#         last_record = TDS_Sections.query.order_by(
#             TDS_Sections.id.desc()
#         ).first()

#         if last_record:

#             last_record_data = {
#                 column.key: getattr(last_record, column.key)
#                 for column in last_record.__table__.columns
#             }

#             response = {
#                 "last_TDSSection_data": last_record_data
#             }

#             return jsonify(response), 200

#         else:
#             return jsonify({
#                 'error': 'No records found'
#             }), 404

#     except Exception as e:
#         print(e)
#         return jsonify({
#             'error': 'Internal server error'
#         }), 500


# # PREVIOUS RECORD
# @app.route(API_URL + "/get-previous-TDSSection", methods=["GET"])
# def get_previous_TDSSection():
#     try:

#         Selected_Record = request.args.get('id')

#         if Selected_Record is None:
#             return jsonify({
#                 'error': 'Missing id parameter'
#             }), 400

#         try:
#             Selected_Record = int(Selected_Record)

#         except ValueError:
#             return jsonify({
#                 'error': 'Invalid id parameter'
#             }), 400

#         previous_selected_record = TDS_Sections.query.filter(
#             TDS_Sections.id < Selected_Record
#         ).order_by(
#             TDS_Sections.id.desc()
#         ).first()

#         if previous_selected_record:

#             previous_selected_record_data = {
#                 column.key: getattr(previous_selected_record, column.key)
#                 for column in previous_selected_record.__table__.columns
#             }

#             response = {
#                 "previous_TDSSection_data": previous_selected_record_data
#             }

#             return jsonify(response), 200

#         else:
#             return jsonify({
#                 'error': 'No previous record found'
#             }), 404

#     except Exception as e:
#         print(e)
#         return jsonify({
#             'error': 'Internal server error'
#         }), 500


# # NEXT RECORD
# @app.route(API_URL + "/get-next-TDSSection", methods=["GET"])
# def get_next_TDSSection():
#     try:

#         Selected_Record = request.args.get('id')

#         if Selected_Record is None:
#             return jsonify({
#                 'error': 'Missing id parameter'
#             }), 400

#         try:
#             Selected_Record = int(Selected_Record)

#         except ValueError:
#             return jsonify({
#                 'error': 'Invalid id parameter'
#             }), 400

#         next_selected_record = TDS_Sections.query.filter(
#             TDS_Sections.id > Selected_Record
#         ).order_by(
#             TDS_Sections.id.asc()
#         ).first()

#         if next_selected_record:

#             next_selected_record_data = {
#                 column.key: getattr(next_selected_record, column.key)
#                 for column in next_selected_record.__table__.columns
#             }

#             response = {
#                 "next_TDSSection_data": next_selected_record_data
#             }

#             return jsonify(response), 200

#         else:
#             return jsonify({
#                 'error': 'No next record found'
#             }), 404

#     except Exception as e:
#         print(e)
#         return jsonify({
#             'error': 'Internal server error'
#         }), 500



from flask import jsonify, request
from app import app, db
from app.models.Masters.OtherMasters.TDS_sectionMasterModel import TDS_Sections
import os

# Get API URL
API_URL = os.getenv('API_URL')

@app.route(API_URL + "/getall-TDSSections", methods=["GET"])
def getall_TDSSections():
    try:
        records = TDS_Sections.query.order_by(TDS_Sections.id.desc()).all()

        record_data = []
        for record in records:
            selected_Record_data = {
                column.key: getattr(record, column.key)
                for column in record.__table__.columns
            }
            record_data.append(selected_Record_data)

        return jsonify({"data": record_data})  # ← wrap in object

    except Exception as e:
        print(e)
        return jsonify({'error': 'internal server error'}), 500

# GET BY ID
@app.route(API_URL + "/get-TDSSection-byid", methods=["GET"])
def get_TDSSection_byid():
    try:
        id = request.args.get('id')

        if id is None:
            return jsonify({'error': 'Missing id parameter'}), 400

        try:
            id = int(id)
        except ValueError:
            return jsonify({'error': 'Invalid id parameter'}), 400

        record = TDS_Sections.query.filter_by(id=id).first()

        if record is None:
            return jsonify({'error': 'Record not found'}), 404

        record_data = {
            column.key: getattr(record, column.key)
            for column in record.__table__.columns
        }

        return jsonify(record_data)

    except Exception as e:
        print(e)
        return jsonify({'error': 'internal server error'}), 500


# POST
@app.route(API_URL + "/create-TDSSection", methods=["POST"])
def create_TDSSection():
    try:
        data = request.get_json()

        new_record = TDS_Sections(
            Nature_of_Payment=data.get('Nature_of_Payment'),
            Section=data.get('Section'),
            TDS_Section_Code=data.get('TDS_Section_Code')
        )

        db.session.add(new_record)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Record created successfully',
            'id': new_record.id
        })

    except Exception as e:
        db.session.rollback()
        print(e)
        return jsonify({'error': 'internal server error'}), 500


# UPDATE
@app.route(API_URL + "/update-TDSSection", methods=["PUT"])
def update_TDSSection():
    try:
        data = request.get_json()

        id = data.get('id')

        if not id:
            return jsonify({'error': 'Missing id'}), 400

        record = TDS_Sections.query.filter_by(id=id).first()

        if record is None:
            return jsonify({'error': 'Record not found'}), 404

        record.Nature_of_Payment = data.get(
            'Nature_of_Payment',
            record.Nature_of_Payment
        )

        record.Section = data.get(
            'Section',
            record.Section
        )

        record.TDS_Section_Code = data.get(
            'TDS_Section_Code',
            record.TDS_Section_Code
        )

        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Record updated successfully'
        })

    except Exception as e:
        db.session.rollback()
        print(e)
        return jsonify({'error': 'internal server error'}), 500


# DELETE
@app.route(API_URL + "/delete-TDSSection", methods=["DELETE"])
def delete_TDSSection():
    try:
        id = request.args.get('id')

        if id is None:
            return jsonify({'error': 'Missing id parameter'}), 400

        try:
            id = int(id)
        except ValueError:
            return jsonify({'error': 'Invalid id parameter'}), 400

        record = TDS_Sections.query.filter_by(id=id).first()

        if record is None:
            return jsonify({'error': 'Record not found'}), 404

        db.session.delete(record)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Record deleted successfully'
        })

    except Exception as e:
        db.session.rollback()
        print(e)
        return jsonify({'error': 'internal server error'}), 500
    



    

# FIRST RECORD
@app.route(API_URL + "/get-first-TDSSection", methods=["GET"])
def get_first_TDSSection():
    try:

        first_record = TDS_Sections.query.order_by(
            TDS_Sections.id.asc()
        ).first()

        if first_record:

            first_record_data = {
                column.key: getattr(first_record, column.key)
                for column in first_record.__table__.columns
            }

            response = {
                "first_TDSSection_data": first_record_data
            }

            return jsonify(response), 200

        else:
            return jsonify({
                'error': 'No records found'
            }), 404

    except Exception as e:
        print(e)
        return jsonify({
            'error': 'Internal server error'
        }), 500

# LAST RECORD
@app.route(API_URL + "/get-last-TDSSection", methods=["GET"])
def get_last_TDSSection():
    try:

        last_record = TDS_Sections.query.order_by(
            TDS_Sections.id.desc()
        ).first()

        if last_record:

            last_record_data = {
                column.key: getattr(last_record, column.key)
                for column in last_record.__table__.columns
            }

            response = {
                "last_TDSSection_data": last_record_data
            }

            return jsonify(response), 200

        else:
            return jsonify({
                'error': 'No records found'
            }), 404

    except Exception as e:
        print(e)
        return jsonify({
            'error': 'Internal server error'
        }), 500


# PREVIOUS RECORD
@app.route(API_URL + "/get-previous-TDSSection", methods=["GET"])
def get_previous_TDSSection():
    try:

        Selected_Record = request.args.get('id')

        if Selected_Record is None:
            return jsonify({
                'error': 'Missing id parameter'
            }), 400

        try:
            Selected_Record = int(Selected_Record)

        except ValueError:
            return jsonify({
                'error': 'Invalid id parameter'
            }), 400

        previous_selected_record = TDS_Sections.query.filter(
            TDS_Sections.id < Selected_Record
        ).order_by(
            TDS_Sections.id.desc()
        ).first()

        if previous_selected_record:

            previous_selected_record_data = {
                column.key: getattr(previous_selected_record, column.key)
                for column in previous_selected_record.__table__.columns
            }

            response = {
                "previous_TDSSection_data": previous_selected_record_data
            }

            return jsonify(response), 200

        else:
            return jsonify({
                'error': 'No previous record found'
            }), 404

    except Exception as e:
        print(e)
        return jsonify({
            'error': 'Internal server error'
        }), 500


# NEXT RECORD
@app.route(API_URL + "/get-next-TDSSection", methods=["GET"])
def get_next_TDSSection():
    try:

        Selected_Record = request.args.get('id')

        if Selected_Record is None:
            return jsonify({
                'error': 'Missing id parameter'
            }), 400

        try:
            Selected_Record = int(Selected_Record)

        except ValueError:
            return jsonify({
                'error': 'Invalid id parameter'
            }), 400

        next_selected_record = TDS_Sections.query.filter(
            TDS_Sections.id > Selected_Record
        ).order_by(
            TDS_Sections.id.asc()
        ).first()

        if next_selected_record:

            next_selected_record_data = {
                column.key: getattr(next_selected_record, column.key)
                for column in next_selected_record.__table__.columns
            }

            response = {
                "next_TDSSection_data": next_selected_record_data
            }

            return jsonify(response), 200

        else:
            return jsonify({
                'error': 'No next record found'
            }), 404

    except Exception as e:
        print(e)
        return jsonify({
            'error': 'Internal server error'
        }), 500             