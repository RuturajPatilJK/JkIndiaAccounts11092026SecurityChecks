from flask import jsonify, request
from app import app, db
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import text
import os

# Get the base URL from environment variables
API_URL = os.getenv('API_URL')

@app.route(API_URL+'/getStationMaster', methods=['GET'])
def getStationMaster():
    try:
        station_type = request.args.get('Station_type')

        # Start a database transaction
        with db.session.begin_nested():
            if station_type:
                query = db.session.execute(text(''' 
                    SELECT        Id, Station_name, Station_code, Station_type
FROM            dbo.Rack_Railway_station_Master
                    WHERE  Station_type = :station_type
                    ORDER BY Id DESC
                '''), {'station_type':  station_type})
            else:
                query = db.session.execute(text(''' 
                    SELECT        Id, Station_name, Station_code, Station_type
FROM            dbo.Rack_Railway_station_Master
                    ORDER BY Id DESC
                '''))

            result = query.fetchall()

        # Format the results into a response list
        response = []
        for row in result:
            response.append({
                'Id': row.Id,
                'Station_name': row.Station_name,
                'Station_code': row.Station_code,
                'Station_type': row.Station_type
            })

        return jsonify(response)

    except SQLAlchemyError as error:
        # Handle database errors
        print("Error fetching data:", error)
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500
