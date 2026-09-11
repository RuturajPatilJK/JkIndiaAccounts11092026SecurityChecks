import React from "react";
import TableUtility from "../../../../Common/UtilityCommon/TableUtility";

const BrandMasterUtility = () => {
    const apiUrl = `${process.env.REACT_APP_API}/getall-BrandMaster`;
    const columns = [
        { label: "Brand Code", key: "Code" },
        { label: "Marka Name", key: "Marka" },
        { label: "Type", key: "Type" },
        { label: "Item", key: "Mal_Code" },
        { label: "Item Name", key: "System_Name_E" }
    ];

    return (
        <TableUtility
            title="Brand Master"
            apiUrl={apiUrl}
            columns={columns}
            rowKey="Code"
            addUrl="/brand-master"
            detailUrl="/brand-master"
            permissionUrl="/brand-master-utility"
            queryParams={{ Company_Code: sessionStorage.getItem("Company_Code") }}
        />
    );
};

export default BrandMasterUtility;
