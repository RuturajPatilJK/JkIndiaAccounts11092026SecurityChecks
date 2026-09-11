import React from "react";
import { Provider } from "react-redux";
import LiveTableUtility from "../../../Common/UtilityCommon/LiveTableUtility";
import serviceBillStore from "../../../store/serviceBillStore";
import { actions, fetchAll, selectors, selectStatus } from "../../../store/serviceBillSlice";

const socketEvents = { added: "service_bill_added", updated: "service_bill_updated", deleted: "service_bill_deleted" };

function ServiceBillUtility({ includeYearCode = true }) {
    const columns = [
        { key: "Doc_No", label: "Doc No" },
        { key: "Date", label: "Doc Date" },
        { key: "Customer_Code", label: "Customer Code" },
        { key: "partyname", label: "Account Name" },
        { key: "GstRateCode", label: "GST Rate Code" },
        { key: "Item_Code", label: "Item Code" },
        { key: "Total", label: "Amount" },
        { key: "Final_Amount", label: "Final Amount" },
        { key: "TDS_Per", label: "TDS%" },
        { key: "ackno", label: "ACK No" },
        { key: "rbid", label: "RbId" },
    ];

    return (
        <Provider store={serviceBillStore}>
            <LiveTableUtility
                title="Service Bill"
                columns={columns}
                rowKey="Doc_No"
                addUrl="/service-bill"
                detailUrl="/service-bill"
                permissionUrl="/ServiceBill-utility"
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
}

export default ServiceBillUtility;
