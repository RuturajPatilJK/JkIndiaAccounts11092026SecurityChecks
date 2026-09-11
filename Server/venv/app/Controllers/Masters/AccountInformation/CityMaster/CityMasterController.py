# app/routes/group_routes.py
from flask import jsonify, request
from app import app, db
from app.models.Masters.AccountInformation.CityMasterModels import CityMaster
import os
from sqlalchemy import and_, func, text
import re
# Get the base URL from environment variables
API_URL = os.getenv('API_URL')

# Get all City API
@app.route(API_URL+"/getall-cities", methods=["GET"])
def getAll_Cities():
    try:
        company_code = request.args.get('company_code')
        if company_code is None:
            return jsonify({'error': 'Missing Company_Code parameter'}), 400

        try:
            company_code = int(company_code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code parameter'}), 400
        
        groups = CityMaster.query.filter_by(company_code=company_code).order_by(CityMaster.city_code.desc()).all()
        groups_data = []
        for group in groups:
            group_data = {column.key: getattr(group, column.key) for column in group.__table__.columns}
            groups_data.append(group_data)

        return jsonify({"cityData":groups_data})
    except Exception as e:
        print(e)
        return jsonify({'error': 'Internal server error'}), 500
    
# # Get last City by Company_Code API
@app.route(API_URL + "/getlast-city", methods=["GET"])
def getLast_City():
    try:
        company_code = request.args.get('company_code')
        if company_code is None:
            return jsonify({'error': 'Missing Company_Code parameter'}), 400

        try:
            company_code = int(company_code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code parameter'}), 400

        last_group = CityMaster.query.filter_by(company_code=company_code).order_by(CityMaster.city_code.desc()).first()

        if last_group is None:
            return jsonify({'error': 'No group found for the provided Company_Code'}), 404

        last_group_data = {column.key: getattr(last_group, column.key) for column in last_group.__table__.columns}

        return jsonify(last_group_data)
    except Exception as e:
        print(e)
        return jsonify({'error': 'Internal server error'}), 500
    
#GET City by city_Code
@app.route(API_URL + "/get-citybycitycode", methods=["GET"])
def get_CityByCityCode():
    try:
        city_code = request.args.get('city_code')
        company_code = request.args.get('company_code')

        if city_code is None or company_code is None:
            return jsonify({'error': 'Missing city_code or Company_Code parameter'}), 400

        try:
            city_code = int(city_code)
            company_code = int(company_code)
        except ValueError:
            return jsonify({'error': 'Invalid city_code or Company_Code parameter'}), 400

        group = CityMaster.query.filter_by(city_code=city_code, company_code=company_code).first()

        if group is None:
            return jsonify({'error': 'city_code not found'}), 404

        group_data = {column.key: getattr(group, column.key) for column in group.__table__.columns}

        return jsonify(group_data)
    except Exception as e:
        print(e)
        return jsonify({'error': 'Internal server error'}), 500

@app.route(API_URL + "/get-citybyName", methods=["GET"])
def CitybyPinCode():
    try:
        city_name_e = request.args.get('city_name_e')

        if city_name_e is None:
            return jsonify({'error': 'Missing pincode or city_name_e parameter'}), 400

        if city_name_e:

            try:
                City = CityMaster.query.filter_by(city_name_e=city_name_e).first()
            except ValueError:
                return jsonify({'error': 'Invalid pincode parameter'}), 400
            
        if City is None:
            return jsonify({'error': 'City not found'}), 404

        city_data = {'city_code': City.city_code, 'city_name_e': City.city_name_e, 'cityid': City.cityid}

        return jsonify(city_data)
    except Exception as e:
        print(e)
        return jsonify({'error': 'Internal server error'}), 500

# Create a new City
@app.route(API_URL + "/create-city", methods=["POST"])
def create_city():
    try:
        company_code = request.args.get('company_code')
        if company_code is None:
            return jsonify({'error': 'Missing Company_Code parameter'}), 400

        try:
            company_code = int(company_code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code parameter'}), 400

        max_group_code = db.session.query(db.func.max(CityMaster.city_code)).filter_by(company_code=company_code).scalar() or 0

        new_group_data = request.json
        new_group_data['city_code'] = max_group_code + 1
        new_group_data['company_code'] = company_code

        new_group = CityMaster(**new_group_data)

        db.session.add(new_group)
        db.session.commit()

        return jsonify({
            'message': 'City created successfully',
            'city': {
        **new_group_data,  
        'cityid': new_group.cityid
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
    

# # Update a group API
@app.route(API_URL+"/update-city", methods=["PUT"])
def update_City():
    try:
        company_code = request.args.get('company_code')
        city_code = request.args.get('city_code')
        if company_code is None or city_code is None:
            return jsonify({'error': 'Missing Company_Code or city_code parameter'}), 400

        try:
            company_code = int(company_code)
            city_code = int(city_code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code or city_code parameter'}), 400

        group = CityMaster.query.filter_by(company_code=company_code, city_code=city_code).first()
        if group is None:
            return jsonify({'error': 'City not found'}), 404

        update_data = request.json
        for key, value in update_data.items():
            setattr(group, key, value)

        db.session.commit()

        return jsonify({
            'message': 'City updated successfully',
            'city': update_data
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
    
# # Delete a City API
@app.route(API_URL+"/delete-city", methods=["DELETE"])
def delete_city():
    try:
        company_code = request.args.get('company_code')
        city_code = request.args.get('city_code')
        if company_code is None or city_code is None:
            return jsonify({'error': 'Missing Company_Code or city_code parameter'}), 400

        try:
            company_code = int(company_code)
            city_code = int(city_code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code or city_code parameter'}), 400

        group = CityMaster.query.filter_by(company_code=company_code, city_code=city_code).first()
        if group is None:
            return jsonify({'error': 'City not found'}), 404

        db.session.delete(group)
        db.session.commit()

        return jsonify({'message': 'City deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
    
#Navigation API
@app.route(API_URL+"/get_First_Record", methods=["GET"])
def get_First_Record():
    try:
        first_user_creation = CityMaster.query.order_by(CityMaster.city_code.asc()).first()
        if first_user_creation:
            serialized_user_creation = {key: value for key, value in first_user_creation.__dict__.items() if not key.startswith('_')}
            return jsonify([serialized_user_creation])
        else:
            return jsonify({'error': 'No records found'}), 404
    except Exception as e:
        print (e)
        return jsonify({'error': 'internal server error'}), 500

@app.route(API_URL+"/get_last_record", methods=["GET"])
def get_last_record():
    try:
        last_user_creation = CityMaster.query.order_by(CityMaster.city_code.desc()).first()
        if last_user_creation:
            serialized_last_user_creation = {}
            for key, value in last_user_creation.__dict__.items():
                if not key.startswith('_'):
                    serialized_last_user_creation [key] = value
            return jsonify([serialized_last_user_creation])
        else:
            return jsonify({'error': 'No records found'}), 404
    except Exception as e:
        print (e)
        return jsonify({'error': 'internal server error'}), 500

@app.route(API_URL+"/get_previous_record", methods=["GET"])
def get_previous_record():
    try:
        Selected_Record = request.args.get('city_code')
        if Selected_Record is None:
            return jsonify({'error': 'Selected_Record parameter is required'}), 400

        previous_selected_record = CityMaster.query.filter(CityMaster.city_code < Selected_Record)\
            .order_by(CityMaster.city_code.desc()).first()
        if previous_selected_record:
            serialized_previous_selected_record = {key: value for key, value in previous_selected_record.__dict__.items() if not key.startswith('_')}
            return jsonify(serialized_previous_selected_record)
        else:
            return jsonify({'error': 'No previous record found'}), 404
    except Exception as e:
        print (e)
        return jsonify({'error': 'internal server error'}), 500

@app.route(API_URL+"/get_next_record", methods=["GET"])
def get_next_record():
    try:
        Selected_Record = request.args.get('city_code')
        if Selected_Record is None:
            return jsonify({'error': 'Selected_Record parameter is required'}), 400

        next_Selected_Record = CityMaster.query.filter(CityMaster.city_code > Selected_Record)\
            .order_by(CityMaster.city_code.asc()).first()
        if next_Selected_Record:
            serialized_next_Selected_Record = {key: value for key, value in next_Selected_Record.__dict__.items() if not key.startswith('_')}
            return jsonify({'nextSelectedRecord': serialized_next_Selected_Record})
        else:
            return jsonify({'error': 'No next record found'}), 404
    except Exception as e:
        print (e)
        return jsonify({'error': 'internal server error'}), 500


@app.route(API_URL + "/auto-sync-cities", methods=["POST"])
def auto_sync_cities():
    try:
        company_code = request.args.get('company_code')
        if company_code is None:
            return jsonify({'error': 'Missing Company_Code parameter'}), 400

        try:
            company_code = int(company_code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code parameter'}), 400

        result = db.session.execute(text("""
            SELECT DISTINCT
                City, State, Pincode, gstin
            FROM  dbo.InwardGSTData
            WHERE City IS NOT NULL AND Pincode IS NOT NULL AND gstin IS NOT NULL
        """)).fetchall()

        inserted = []
        skipped = []

        for row in result:
            city_name_e = row.City.strip()
            state = row.State.strip()
            pincode = int(row.Pincode)
            gstin = row.gstin.strip()
            gst_state_code = re.sub(r'^0+', '', gstin[:2])  

            exists = db.session.query(CityMaster).filter(
                and_(
                    CityMaster.city_name_e == city_name_e,
                    CityMaster.pincode == pincode,
                )
            ).first()

            if exists:
                skipped.append(city_name_e)
                continue

           
            max_code = db.session.query(func.max(CityMaster.city_code)).filter_by(company_code=company_code).scalar() or 0
            new_city = CityMaster(
                city_code=max_code + 1,
                city_name_e=city_name_e,
                pincode=pincode,
                state=state,
                GstStateCode=gst_state_code,
                Sub_Area="",
                city_name_r="",
                company_code=company_code,
                Created_By="Rutuja",
                Modified_By="",
                Distance=0
            )
            db.session.add(new_city)
            inserted.append(city_name_e)

        db.session.commit()

        return jsonify({
            "message": "City sync complete",
            "inserted": inserted,
            "skipped": skipped,
            "count": {
                "inserted": len(inserted),
                "skipped": len(skipped)
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


