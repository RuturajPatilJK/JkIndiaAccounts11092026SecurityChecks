import React from "react";
import { Provider } from "react-redux";
import otherPurchaseStore from "../../../store/otherPurchaseStore";
import OtherPurchaseLiveTable from "./OtherPurchaseLiveTable";

const OtherPurchaseUtility = ({includeYearCode=true}) => {
    const columns = [
        { label: "Doc No", key: "Doc_No" },
        { label: "Doc Date", key: "Doc_Date" },
        { label: "Supplier Name", key: "SupplierName" },
        { label: "Bill Amount", key: "Bill_Amount" ,format: true },
        { label: "Narration", key: "Narration" },
        { label: "opid", key: "opid" }
    ];

    return (
        <Provider store={otherPurchaseStore}>
            <OtherPurchaseLiveTable
                title="Other Purchase"
                columns={columns}
                rowKey="Doc_No"
                addUrl="/other-purchase"
                detailUrl="/other-purchase"
                permissionUrl="/other-purchaseutility"
                includeYearCode={includeYearCode}
            />
        </Provider>
    );
};

export default OtherPurchaseUtility;