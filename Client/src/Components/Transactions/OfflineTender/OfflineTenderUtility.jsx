import React from "react";
import TableUtility from "../../../Common/UtilityCommon/TableUtility";

function OfflineTenderUtility() {
    const apiUrl = `${process.env.REACT_APP_API}/getdata-offlinetender`;
    const columns = [
        { key: "Id", label: "Id" },
        { key: "Doc_Date", label: "Doc Date" },
        { key: "MillCode", label: "Mill Code"},
        { key: "MillName", label: "Mill Name" },
        { key: "TenderId", label: "Tender Detail ID" },
    ];

    return (
        <TableUtility
            title="Offline Tender"
            apiUrl={apiUrl}
            // queryParams={{
            //     // Company_Code: sessionStorage.getItem("Company_Code"),
            //     // Year_Code: sessionStorage.getItem("Year_Code"),
            //     // tran_type: "JV", 
            // }}
            columns={columns}
            rowKey="Id"
            addUrl="/offline-tender"  
            detailUrl="/offline-tender"  
            permissionUrl="/OfflineTender_Utility"  
        />
    );
}

export default OfflineTenderUtility;