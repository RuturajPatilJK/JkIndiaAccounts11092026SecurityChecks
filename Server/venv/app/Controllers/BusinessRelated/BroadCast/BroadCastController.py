from flask import jsonify, request
from app import app, db
from sqlalchemy import text
import os

API_URL = os.getenv('API_URL')
import json

@app.route(API_URL + "/getcitybystatecode", methods=["GET"])
def getcitybystatecode():
    try:
        state_code_str = request.args.get("State_Code", "")
        state_code_list = [s.strip() for s in state_code_str.split(",") if s.strip()]

        if not state_code_list:
            return jsonify({"error": "Missing State_Code list"}), 400

        query = '''
            SELECT c.city_name_e, c.city_code, c.cityid, c.pincode
            FROM dbo.gststatemaster AS s
            INNER JOIN dbo.nt_1_citymaster AS c ON c.GstStateCode = s.State_Code
            WHERE s.State_Code IN :state_codes
        '''
        result = db.session.execute(text(query), {"state_codes": tuple(state_code_list)})
        data = [dict(row._mapping) for row in result.fetchall()]
        return jsonify({"CityByState_data": data}), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


@app.route(API_URL + "/getcityandstatecode", methods=["POST"])
def getcityandstatecode():
    try:
        data = request.get_json() or {}
        State_Names = data.get('State_Name', [])
        City_Names = data.get('City_Name', [])

        if not State_Names or not City_Names:
            return jsonify({"error": "Missing required parameters"}), 400

        # Construct dynamic filter conditions
        state_conditions = " OR ".join([
            f"LOWER(state_name) LIKE LOWER(:state{i})"
            for i in range(len(State_Names)) if State_Names[i]
        ])
        city_conditions = " OR ".join([
            f"LOWER(City) LIKE LOWER(:city{i})"
            for i in range(len(City_Names)) if City_Names[i]
        ])

        if not state_conditions or not city_conditions:
            return jsonify({"error": "Empty state or city values provided"}), 400

        query = f'''
            SELECT max(acname) AS Ac_Name_E, no AS whatsup_no
            FROM dbo.whatsappac
            WHERE ({state_conditions})
              AND ({city_conditions})
            GROUP BY no
        '''

        params = {
            f"state{i}": f"{str(name).lower()}%"
            for i, name in enumerate(State_Names)
            if name
        }
        params.update({
            f"city{i}": f"{str(name).lower()}%"
            for i, name in enumerate(City_Names)
            if name
        })

        result = db.session.execute(text(query), params)
        data = [dict(row._mapping) for row in result.fetchall()]
        return jsonify({"both_data": data}), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

@app.route(API_URL + "/getbyStateCode", methods=["POST"])
def getbyStateCode():
    try:
        data = request.get_json()
        State_Names = data.get("State_Name", [])
        if not State_Names:
            return jsonify({"error": "Missing required parameter"}), 400

        state_conditions = " OR ".join([f"LOWER(state_name) LIKE LOWER(:state{i})" for i in range(len(State_Names))])
        query = f'''
            SELECT max(acname) AS Ac_Name_E, no AS whatsup_no
            FROM dbo.whatsappac
            WHERE {state_conditions}
            GROUP BY no
        '''
        params = {f"state{i}": f"{name.lower()}%" for i, name in enumerate(State_Names)}

        result = db.session.execute(text(query), params)
        data = [dict(row._mapping) for row in result.fetchall()]
        return jsonify({"all_data": data}), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


@app.route(API_URL + "/getbyCityCode", methods=["POST"])
def getbyCityCode():
    try:
        data = request.get_json()
        city_names = data.get("City_Name", [])
        if not city_names:
            return jsonify({"error": "Missing required City_Name parameter(s)"}), 400

        city_conditions = " OR ".join([f"LOWER(City) LIKE LOWER(:city{i})" for i in range(len(city_names))])
        query = f'''
            SELECT max(acname) AS Ac_Name_E, no AS whatsup_no
            FROM dbo.whatsappac
            WHERE {city_conditions}
            GROUP BY no
            ORDER BY max(City)
        '''
        params = {f"city{i}": f"{name.lower()}%" for i, name in enumerate(city_names)}

        result = db.session.execute(text(query), params)
        data = [dict(row._mapping) for row in result.fetchall()]
        return jsonify({"all_citydata": data}), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


@app.route(API_URL + "/getMillmaster", methods=["POST"])
def getMillmaster():
    try:
        data = request.get_json()
        city_codes = data.get("city_code", [])
        state_codes = data.get("State_Code", [])
        mill_code = data.get("mill_code")

        if not mill_code:
            return jsonify({"error": "Missing required mill_code parameter"}), 400

        query = '''
            SELECT qrymstaccountmaster.Ac_Name_E, qrymstaccountmaster.whatsup_no,
                   nt_1_sugarsale.mill_code, qrymstaccountmaster.City_Code,
                   qrymstaccountmaster.GSTStateCode, qrymstaccountmaster.Ac_Code
            FROM dbo.nt_1_sugarsale
            INNER JOIN dbo.qrymstaccountmaster
                ON nt_1_sugarsale.ac = qrymstaccountmaster.accoid
               AND nt_1_sugarsale.Company_Code = qrymstaccountmaster.Company_Code
            WHERE nt_1_sugarsale.mill_code = :mill_code
              AND qrymstaccountmaster.whatsup_no NOT IN ('', '0')
        '''
        params = {"mill_code": mill_code}

        if city_codes:
            city_placeholders = ", ".join([f":city{i}" for i in range(len(city_codes))])
            query += f" AND qrymstaccountmaster.City_Code IN ({city_placeholders})"
            params.update({f"city{i}": code for i, code in enumerate(city_codes)})

        if state_codes:
            state_placeholders = ", ".join([f":state{i}" for i in range(len(state_codes))])
            query += f" AND qrymstaccountmaster.GSTStateCode IN ({state_placeholders})"
            params.update({f"state{i}": code for i, code in enumerate(state_codes)})

        query += '''
            GROUP BY qrymstaccountmaster.Ac_Name_E, qrymstaccountmaster.whatsup_no,
                     nt_1_sugarsale.mill_code, qrymstaccountmaster.City_Code,
                     qrymstaccountmaster.GSTStateCode, qrymstaccountmaster.Ac_Code
        '''

        result = db.session.execute(text(query), params)
        data = [dict(row._mapping) for row in result.fetchall()]
        return jsonify({"all_Milldata": data}), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


@app.route(API_URL + "/getbyCityCodeandStateCode", methods=["POST"])
def getbyCityCodeandStateCode():
    try:
        data = request.get_json()
        city_codes = data.get("city_code", [])
        state_codes = data.get("state_code", [])

        if not city_codes or not state_codes:
            return jsonify({"error": "Missing city_code or state_code parameter(s)"}), 400

        city_placeholders = ", ".join([f":city{i}" for i in range(len(city_codes))])
        state_placeholders = ", ".join([f":state{i}" for i in range(len(state_codes))])

        query = f'''
            SELECT max(acname) AS Ac_Name_E, no AS whatsup_no, City, state_name
            FROM dbo.whatsappac
            WHERE City_Code IN ({city_placeholders})
              AND GSTStateCode IN ({state_placeholders})
            GROUP BY no
        '''

        params = {f"city{i}": code for i, code in enumerate(city_codes)}
        params.update({f"state{i}": code for i, code in enumerate(state_codes)})

        result = db.session.execute(text(query), params)
        data = [dict(row._mapping) for row in result.fetchall()]
        return jsonify({"filtered_data": data}), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


@app.route(API_URL + "/bycitycodeonly", methods=["POST"])
def bycitycodeonly():
    try:
        data = request.get_json()
        city_codes = data.get("city_code", [])
        if not city_codes:
            return jsonify({"error": "Missing required city_code parameter(s)"}), 400

        city_placeholders = ", ".join([f":city{i}" for i in range(len(city_codes))])
        query = f'''
            SELECT max(acname) AS Ac_Name_E, no AS whatsup_no, City, state_name
            FROM dbo.whatsappac
            WHERE City_Code IN ({city_placeholders})
            GROUP BY no, City, state_name
        '''

        params = {f"city{i}": code for i, code in enumerate(city_codes)}

        result = db.session.execute(text(query), params)
        data = [dict(row._mapping) for row in result.fetchall()]
        return jsonify({"data_by_citycode": data}), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


@app.route(API_URL + "/bystatecodeandcitycode", methods=["POST"])
def bystatecodeandcitycode():
    try:
        data = request.get_json()
        city_codes = data.get("city_code", [])
        state_codes = data.get("state_code", [])

        if not city_codes or not state_codes:
            return jsonify({"error": "Missing city_code or state_code parameter(s)"}), 400

        city_placeholders = ", ".join([f":city{i}" for i in range(len(city_codes))])
        state_placeholders = ", ".join([f":state{i}" for i in range(len(state_codes))])

        query = f'''
            SELECT max(acname) AS Ac_Name_E, no AS whatsup_no, City, state_name
            FROM dbo.whatsappac
            WHERE City_Code IN ({city_placeholders})
              AND GSTStateCode IN ({state_placeholders})
            GROUP BY no, City, state_name
        '''

        params = {f"city{i}": code for i, code in enumerate(city_codes)}
        params.update({f"state{i}": code for i, code in enumerate(state_codes)})

        result = db.session.execute(text(query), params)
        data = [dict(row._mapping) for row in result.fetchall()]
        return jsonify({"data_by_state_and_citycode": data}), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500