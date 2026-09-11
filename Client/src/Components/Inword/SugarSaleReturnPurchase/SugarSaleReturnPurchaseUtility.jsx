import React from "react";
import TableUtility from "../../../Common/UtilityCommon/TableUtility";

const SugarSaleReturnPurchaseUtility = (includeYearCode=true) => {
    const apiUrl = `${process.env.REACT_APP_API}/getdata-sugarpurchasereturn`;

    const columns = [
        { label: "Doc No", key: "doc_no" },
        { label: "Doc Date", key: "doc_date" },
        { label: "Account Name", key: "partyname" },
        { label: "NET Quintal", key: "NETQNTL",format: true },
        { label: "Bill Amount", key: "Bill_Amount",format: true },
        { label: "Prid", key: "prid" },
        { label: "AckNo", key: "ackno" }
    ];

    return (
        <TableUtility
            title="Sugar Sale Return Purchase"
            apiUrl={apiUrl}
            columns={columns}
            rowKey="doc_no"
            addUrl="/sugar-sale-return-purchase"
            detailUrl="/sugar-sale-return-purchase"
            permissionUrl="/sugar-sale-return-purchase-utility"
            includeYearCode={includeYearCode}
        />
    );
};

export default SugarSaleReturnPurchaseUtility;
