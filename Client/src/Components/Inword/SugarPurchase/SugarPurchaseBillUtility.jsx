import React from "react";
import TableUtility from "../../../Common/UtilityCommon/TableUtility";

const PurchaseBillUtility = ({ includeYearCode = true }) => {
    const apiUrl = `${process.env.REACT_APP_API}/getdata-sugarpurchase`;
    const columns = [
        { label: "Doc No", key: "doc_no" },
        { label: "Doc Date", key: "doc_date" },
        { label: "Supplier Name", key: "FromName" },
        { label: "NET Quintal", key: "NETQNTL",format: true },
        { label: "Bill Amount", key: "Bill_Amount",format: true },
        { label: "EWay Bill No", key: "EWay_Bill_No" },
        { label: "Invoice No", key: "Bill_No" },
        { label: "PurchID", key: "purchaseid" }
    ];

    return (
        <TableUtility
            title="Sugar Purchase Bill"
            apiUrl={apiUrl}
            columns={columns}
            rowKey="doc_no"
            addUrl="/sugarpurchasebill"
            detailUrl="/sugarpurchasebill"
            permissionUrl="/sugarpurchasebill-utility"
            includeYearCode={includeYearCode}
        />
    );
};

export default PurchaseBillUtility;