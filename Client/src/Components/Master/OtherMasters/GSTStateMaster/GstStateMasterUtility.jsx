import React from "react";
import TableUtility from "../../../../Common/UtilityCommon/TableUtility";

const GstStateMasterUtility = () => {
    const apiUrl = `${process.env.REACT_APP_API}/getall-gststatemaster`;
    const columns = [
        { label: "State Code", key: "State_Code" },
        { label: "State Name", key: "State_Name" },
    ];

    return (
        <TableUtility
            title="State Master"
            apiUrl={apiUrl}
            columns={columns}
            rowKey="State_Code"
            addUrl="/gst-state-master"
            detailUrl="/gst-state-master"
            permissionUrl="/gst-state-master-utility"
        />
    );
};

export default GstStateMasterUtility;