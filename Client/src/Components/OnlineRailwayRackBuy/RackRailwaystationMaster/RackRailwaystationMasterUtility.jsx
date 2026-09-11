import React from "react";
import TableUtility from "../../../Common/UtilityCommon/TableUtility"; 

const RackRailwaystationMasterUtility = () => {
    const apiUrl = `${process.env.REACT_APP_API}/getAllstation`;
    const columns = [
        { label: "Id", key: "Id" },
        { label: "Station Code", key: "Station_code" },
        { label: "Station Name", key: "Station_name" },
        { label: "State Code", key: "State_code" },
        { label: "City Name", key: "City_name" },
        { label: "Station Type", key: "Station_type" },
        // { label: "Bill Amount", key: "Bill_Amount" },
        // { label: "amount", key: "amount" },
        // { label: "narration", key: "narration" },
        // { label: "pid", key: "pid" }
    ];

    return (
        <TableUtility
            title="Railway station Master"
            apiUrl={apiUrl}
            columns={columns}
            rowKey="Id"
            addUrl="/rack-railway-station-master"
            detailUrl="/rack-railway-station-master"
            permissionUrl="/rack-railway-station-master-utility"
        />
    );
};

export default RackRailwaystationMasterUtility;