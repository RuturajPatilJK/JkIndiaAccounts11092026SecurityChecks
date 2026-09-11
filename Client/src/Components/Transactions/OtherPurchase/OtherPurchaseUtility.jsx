import React from "react";
import TableUtility from "../../../Common/UtilityCommon/TableUtility"; 

const OtherPurchaseUtility = ({includeYearCode=true}) => {
    const apiUrl = `${process.env.REACT_APP_API}/getall-OtherPurchase`;
    const columns = [
        { label: "Doc No", key: "Doc_No" },
        { label: "Doc Date", key: "Doc_Date" },
        { label: "Supplier Name", key: "SupplierName" },
        { label: "Bill Amount", key: "Bill_Amount" ,format: true },
        { label: "Narration", key: "Narration" },
        { label: "opid", key: "opid" }
    ];

    return (
        <TableUtility
            title="Other Purchase"
            apiUrl={apiUrl}
            columns={columns}
            rowKey="Doc_No"
            addUrl="/other-purchase"
            detailUrl="/other-purchase"
            permissionUrl="/other-purchaseutility"
            includeYearCode={includeYearCode}
        />
    );
};

export default OtherPurchaseUtility;