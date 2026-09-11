import React from "react";
import TableUtility from "../../../Common/UtilityCommon/TableUtility"; 

const RackLinkrailwaystationUtility = () => {
    const apiUrl = `${process.env.REACT_APP_API}/getAlllinkstation`;
    const columns = [
        { label: "Id", key: "Id" },
        { label: "Mill Id", key: "Mill_id" },
        { label: "Railway Station Id", key: "Railway_station_id" },
        { label: "Local Enpenses", key: "Local_enpenses" },
        { label: "Remark", key: "Remark" },
        // { label: "Bill Amount", key: "Bill_Amount" },
        // { label: "amount", key: "amount" },
        // { label: "narration", key: "narration" },
        // { label: "pid", key: "pid" }
    ];

    return (
        <TableUtility
            title="Link railway station"
            apiUrl={apiUrl}
            columns={columns}
            rowKey="Id"
            addUrl="/rack-link-railway-station"
            detailUrl="/rack-link-railway-station"
            permissionUrl="/rack-link-railway-station-utility"
        />
    );
};

export default RackLinkrailwaystationUtility;