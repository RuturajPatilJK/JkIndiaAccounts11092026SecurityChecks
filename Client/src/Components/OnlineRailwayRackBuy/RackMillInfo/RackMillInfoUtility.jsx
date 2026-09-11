import React from "react";
import TableUtility from "../../../Common/UtilityCommon/TableUtility"; 

const RackMillInfoUtility = () => {
    const apiUrl = `${process.env.REACT_APP_API}/getAllmillinfo`;
    const columns = [
        { label: "Id", key: "Id" },
        { label: "Mill Name", key: "Mill_name" },
        { label: "Mill Code", key: "Mill_code" },
        { label: "State Code", key: "State_Code" },
        { label: "City Name", key: "City_name" },
        // { label: "Bill Amount", key: "Bill_Amount" },
        // { label: "amount", key: "amount" },
        // { label: "narration", key: "narration" },
        // { label: "pid", key: "pid" }
    ];

    return (
        <TableUtility
            title="Mill Master"
            apiUrl={apiUrl}
            columns={columns}
            rowKey="Id"
            addUrl="/rack-mill-info"
            detailUrl="/rack-mill-info"
            permissionUrl="/rack-mill-info-utility"
        />
    );
};

export default RackMillInfoUtility;