import React from "react";
import TableUtility from "../../../Common/UtilityCommon/TableUtility";

const TDSsectionUtility = () => {
    const apiUrl = `${process.env.REACT_APP_API}/getall-TDSSections`;
    const columns = [
        { label: "ID", key: "id" },
        { label: "Nature_of_Payment", key: "Nature_of_Payment" },
        { label: "TDS_Section_Code", key: "TDS_Section_Code" },
    ];

    return (
        <TableUtility
            title=" TDS Section "
            apiUrl={apiUrl}
            columns={columns}
            rowKey="id"
            addUrl="/TDS_section"
            detailUrl="/TDS_section"
            permissionUrl="/TDS_section-utility"
        />
    );
};

export default TDSsectionUtility;