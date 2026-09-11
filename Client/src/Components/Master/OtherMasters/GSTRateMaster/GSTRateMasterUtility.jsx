import React, { useState } from "react";
import TableUtility from "../../../../Common/UtilityCommon/TableUtility";
import { useNavigate } from "react-router-dom";

const GSTRateMasterUtility = () => {
    const apiUrl = `${process.env.REACT_APP_API}/getall-GSTRateMaster`;
    const columns = [
        { label: "Doc No", key: "Doc_no" },
        { label: "GST Name", key: "GST_Name" },
        { label: "Rate", key: "Rate" }
    ];

    return (
        <TableUtility
            title="GST Rate Master "
            apiUrl={apiUrl}
            columns={columns}
            rowKey="Doc_no"
            addUrl="/gst-ratemaster"
            detailUrl="/gst-ratemaster"
            permissionUrl="/gst-rate-masterutility"
            queryParams={{ Company_Code: sessionStorage.getItem("Company_Code") }}
        />
    );
};

export default GSTRateMasterUtility;
