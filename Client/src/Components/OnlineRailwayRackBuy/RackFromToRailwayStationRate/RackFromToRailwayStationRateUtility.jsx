import React from "react";
import TableUtility from "../../../Common/UtilityCommon/TableUtility"; 

const RackFromToRailwayStationRateUtility = () => {
    const apiUrl = `${process.env.REACT_APP_API}/getAllstationRate`;
    const columns = [
        { label: "From Id", key: "From_id" },
        { label: "To Id", key: "To_id" },
        { label: "Min Rate", key: "Min_rate" },
        { label: "Full Rate", key: "Full_rate" },
        { label: "Distance", key: "Distance" }
        // { label: "amount", key: "amount" },
        // { label: "narration", key: "narration" },
        // { label: "pid", key: "pid" }
    ];

    return (
        <TableUtility
            title="Rack From To Railway Station Rate"
            apiUrl={apiUrl}
            columns={columns}
            rowKey="Id"
            addUrl="/rack-from-to-railway-station-rate"
            detailUrl="/rack-from-to-railway-station-rate"
            permissionUrl="/rack-from-to-railway-station-rate-utility"
        />
    );
};

export default RackFromToRailwayStationRateUtility;