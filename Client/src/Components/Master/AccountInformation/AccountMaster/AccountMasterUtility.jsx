import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import TableUtility from "../../../../Common/UtilityCommon/TableUtility";

const API_URL = process.env.REACT_APP_API;
function AccountMasterUtility({ includeYearCode = false }) {

    const columns = [
        { label: "A/c Code", key: "Ac_Code" },
        { label: "A/c Type", key: "Ac_type" },
        { label: "A/c Name", key: "Ac_Name_E" },
        { label: "Short Name", key: "Short_Name" },
        { label: "Commission", key: "Commission" },
        { label: "Address", key: "Address_E" },
        { label: "City Name", key: "city_name_e" },
        { label: "GST No", key: "Gst_No" },
        { label: "PAN", key: "AC_Pan" },
        { label: "FSSAI", key: "FSSAI" },
        { label: "Adhar No", key: "adhar_no" },
        { label: "Mobile No", key: "Mobile_No" },
        { label: "A/c Id", key: "accoid" },
    ];

    const apiUrl = `${API_URL}/getdata-accountmaster`;
    const addUrl = "/account-master";
    const detailUrl = "/account-master";
    const permissionUrl = "/AccountMaster-utility";

    return (

        <TableUtility
            title="Account Master"
            apiUrl={apiUrl}
            columns={columns}
            rowKey="Ac_Code"
            addUrl={addUrl}
            detailUrl={detailUrl}
            permissionUrl={permissionUrl}
            includeYearCode={includeYearCode}
        />
    );
}

export default AccountMasterUtility;
