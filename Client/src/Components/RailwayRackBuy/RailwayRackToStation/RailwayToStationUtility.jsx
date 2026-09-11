import React from "react";
import TableUtility from "../../../Common/UtilityCommon/TableUtility"; 

const RailwayRackToStationsUtility = ({includeYearCode =true}) => {
    const apiUrl = `${process.env.REACT_APP_API}/getall-ToStation`;
    const columns = [
        { label: "Id", key: "Id" },
        { label: "Station Name", key: "Station_Name" },
         { label: "Station Code", key: "Station_Code" },
        { label: "State Name", key: "State_Name" },
       
    ];


    return (
        <TableUtility
            title="To Station"
            apiUrl={apiUrl}
            columns={columns}
            rowKey="Id"
            addUrl="/ToStation"
            detailUrl="/ToStation"
            permissionUrl="/To-Station-utility"
            includeYearCode = {includeYearCode}
        />
    );
};

export default RailwayRackToStationsUtility;
