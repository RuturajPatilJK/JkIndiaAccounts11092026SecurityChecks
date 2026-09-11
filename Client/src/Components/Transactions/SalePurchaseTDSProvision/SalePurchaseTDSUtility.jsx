import React from "react";
import TableUtility from "../../../Common/UtilityCommon/TableUtility";

function SalePurchaseTDSUtility() {
    const apiUrl = `${process.env.REACT_APP_API}/getAllsalepurchasetds`;
    const columns = [
        { key: "id", label: "ID" },
        { key: "amount", label: "Amount" },
        { key: "nameOfAccount", label: "Name Of Account", isLabel: true },
        { key: "narration", label: "Narration", isLabel: true },
        { key: "section", label: "Section", isLabel: true },
        { key: "type", label: "Type", isLabel: true },
    ];

    return (
        <TableUtility
            title="Sale purchase TDS Provision"
            apiUrl={apiUrl}
            queryParams={{
                Company_Code: sessionStorage.getItem("Company_Code")
            }}
            columns={columns}
            rowKey="doc_no"
            addUrl="/sale-purchase-tds-provision"
            detailUrl="/sale-purchase-tds-provision"
            permissionUrl="/sale-purchase-tds-utility"
        />
    );
}

export default SalePurchaseTDSUtility;
