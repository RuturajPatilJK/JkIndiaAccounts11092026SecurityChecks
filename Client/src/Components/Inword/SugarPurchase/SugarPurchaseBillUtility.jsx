import React from "react";
import { Provider } from "react-redux";
import LiveTableUtility from "../../../Common/UtilityCommon/LiveTableUtility";
import purchaseBillStore from "../../../store/purchaseBillStore";
import { actions, fetchAll, selectors, selectStatus } from "../../../store/purchaseBillSlice";

const socketEvents = { added: "purchase_bill_added", updated: "purchase_bill_updated", deleted: "purchase_bill_deleted" };

const PurchaseBillUtility = ({ includeYearCode = true }) => {
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
        <Provider store={purchaseBillStore}>
            <LiveTableUtility
                title="Sugar Purchase Bill"
                columns={columns}
                rowKey="doc_no"
                addUrl="/sugarpurchasebill"
                detailUrl="/sugarpurchasebill"
                permissionUrl="/sugarpurchasebill-utility"
                includeYearCode={includeYearCode}
                selectors={selectors}
                fetchAll={fetchAll}
                selectStatus={selectStatus}
                actions={actions}
                socketEvents={socketEvents}
                socketMode="refetch"
            />
        </Provider>
    );
};

export default PurchaseBillUtility;
