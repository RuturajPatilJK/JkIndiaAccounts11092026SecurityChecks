import React from "react";
import TableUtility from "../../../Common/UtilityCommon/TableUtility"; 

const RailwayRackUtility = ({includeYearCode =true}) => {
    const apiUrl = `${process.env.REACT_APP_API}/getdata-RailwayRack`;
    const columns = [
        { label: "Doc No", key: "Doc_No" },
        { label: "Station Name", key: "RailwayStation_Name" },
        { label: "Account Name", key: "Ac_Name_E" },
        { label: "City", key: "City" },
        { label: "Pin Code", key: "Pincode" },
    ];


    return (
        <TableUtility
            title="Railway Rack"
            apiUrl={apiUrl}
            columns={columns}
            rowKey="RailId"
            addUrl="/rack-rail"
            detailUrl="/rack-rail"
            permissionUrl="/RailwayRack-utility"
            includeYearCode = {includeYearCode}
        />
    );
};

export default RailwayRackUtility;
