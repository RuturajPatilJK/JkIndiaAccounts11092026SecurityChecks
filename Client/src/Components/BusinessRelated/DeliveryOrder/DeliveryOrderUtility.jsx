import React from "react";
import { Provider } from "react-redux";
import LiveTableUtility from "../../../Common/UtilityCommon/LiveTableUtility";
import deliveryOrderStore from "../../../store/deliveryOrderStore";
import { actions, fetchAll, selectors, selectStatus } from "../../../store/deliveryOrderSlice";

const socketEvents = { added: "delivery_order_added", updated: "delivery_order_updated", deleted: "delivery_order_deleted" };
// Delivery Order's existing backend emits (already shipped, not modified here) only carry
// doid/doc_no/company_code/year_code, not full row data, and use lowercase company_code/year_code
// keys — so this list refetches on any of the 3 events instead of upserting in place.
const scopeKeys = { company: "company_code", year: "year_code" };

function DeliveryOredrUtility() {
    const columns = [
        { key: "doc_no", label: "Doc No" },
        { key: "doc_date", label: "Doc Date"},
        { key: "quantal", label: "Quintal",format: true},
        { key: "mill_rate", label: "Mill Rate",format: true },
        { key: "millName", label: "Mill Name" },
        { key: "saleBillName", label: "Sale Bill Name" },
        { key: "sbCityName", label: "SB City Name" },
        { key: "shipToName", label: "Ship To Name" },
        { key: "shipToCityName", label: "Ship To CityName" },
        { key: "sale_rate", label: "Sale Rate",format: true },
        { key: "truck_no", label: "Truck No" },
        { key: "SB_No", label: "SB No" },
        { key: "EWay_Bill_No", label: "EWay Bill No" },
        { key: "purc_no", label: "Purc No" },
        { key: "tenderdetailid", label: "Tenderdetail Id" },
        { key: "Tender_Commission", label: "Tender Commission" },
        { key: "desp_type", label: "Dispatch Type" },
        { key: "Delivery_Type", label: "Delivery Type" },
        { key: "transportName", label: "Transport Name" },
        { key: "MM_Rate", label: "MM Rate" },
        { key: "doid", label: "Doid" },
    ];

    const getRowStyle = (row) => {
        if (row.tenderdetailid === null) {
            return { backgroundColor: '#ffcccc' };
        }
        return {};
    };


    return (
        <Provider store={deliveryOrderStore}>
            <LiveTableUtility
                title="Delivery Order"
                columns={columns}
                rowKey="doc_no"
                addUrl="/delivery-order"
                detailUrl="/delivery-order"
                permissionUrl="/delivery-order-utility"
                getRowStyle={getRowStyle}
                includeYearCode
                selectors={selectors}
                fetchAll={fetchAll}
                selectStatus={selectStatus}
                actions={actions}
                socketEvents={socketEvents}
                scopeKeys={scopeKeys}
                socketMode="refetch"
            />
        </Provider>
    );
}

export default DeliveryOredrUtility;
