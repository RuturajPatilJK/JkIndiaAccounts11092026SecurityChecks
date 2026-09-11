from flask import jsonify, request, Flask
from app import app, db
from app.models.OnlineRailwayRackBuy.RackFromToRailwayStationRate.RackFromToRailwayStationRateModel import RackFromToRailwayStationRate
from app.models.OnlineRailwayRackBuy.RackFromToRailwayStationRate.RackFromToRailwayStationRateSchema import Rack_From_To_Railway_Station_Rate_Schema
import os
from sqlalchemy import text,func
import traceback

API_URL = os.getenv('API_URL')


@app.route(API_URL + "/get_RackRailwayMillRateReport", methods=["GET"])
def get_RackRailwayMillRateReport():
    try:
        mill_id = request.args.get('Mill_Id')

        if not mill_id:
            return jsonify({
                "error": "Missing required parameters"
            }), 400

        query = '''
               SELECT        dbo.Rack_Railway_station_Master.Station_name AS RailStation, dbo.Rack_Mill_Info.Mill_name, dbo.Rack_From_To_Railway_Station_Rate.Local_Expenses, ToStation.Station_name AS toStation, 
                         dbo.Rack_From_To_Railway_Station_Rate.Min_rate, dbo.Rack_From_To_Railway_Station_Rate.Distance, dbo.Rack_From_To_Railway_Station_Rate.Full_rate
FROM            dbo.Rack_From_To_Railway_Station_Rate INNER JOIN
                         dbo.Rack_Railway_station_Master ON dbo.Rack_From_To_Railway_Station_Rate.Rail_Id = dbo.Rack_Railway_station_Master.Id INNER JOIN
                         dbo.Rack_Mill_Info ON dbo.Rack_From_To_Railway_Station_Rate.From_id = dbo.Rack_Mill_Info.Id INNER JOIN
                         dbo.Rack_Railway_station_Master AS ToStation ON dbo.Rack_From_To_Railway_Station_Rate.To_id = ToStation.Id
                 WHERE dbo.Rack_From_To_Railway_Station_Rate.From_id = :mill_id
            '''

        result_data = db.session.execute(
            text(query),
            {
                "mill_id": mill_id,
            } 
        )

        rows = result_data.fetchall()
        all_data = [dict(row._mapping) for row in rows]

        response = {
            "all_data": all_data,
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        print(traceback.format_exc())
        return jsonify({
            "error": "Internal server error",
            "message": str(e)
        }), 500

