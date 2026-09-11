import React from "react";
import { Provider } from "react-redux";
import LiveTableUtility from "../../../Common/UtilityCommon/LiveTableUtility";
import saleBillStore from "../../../store/saleBillStore";
import { actions, fetchAll, selectors, selectStatus } from "../../../store/saleBillSlice";

const socketEvents = { added: "sale_bill_added", updated: "sale_bill_updated", deleted: "sale_bill_deleted" };

const SaleBillUtility = ({includeYearCode =true}) => {
    const columns = [
        { label: "Doc No", key: "doc_no" },
        { label: "Doc Date", key: "doc_date" },
        { label: "Bill From Name", key: "billFromName" },
        { label: "Bill From GST", key: "BillFromGSTNo" },
        { label: "ShipTo Name", key: "ShipToName" },
        { label: "NET Quintal", key: "NETQNTL",format: true },
        { label: "Bill Amount", key: "Bill_Amount",format: true },
        { label: "Mill Name", key: "MillName" },
        { label: "EWay Bill No", key: "EWay_Bill_No" },
        { label: "ACK No", key: "ackno" },
        { label: "SaleId", key: "saleid" },
        { label: "IsDeleted", key: "IsDeleted" },
        { label: "DO No", key: "DO_No" }
    ];



     const getRowStyle = (row) => {
        if (row.IsDeleted === 0) {
            return { backgroundColor: '#ffcccc' };
        }
        return {}; 
    };
    
    return (
        <Provider store={saleBillStore}>
            <LiveTableUtility
                title="Sugar Bill For GST"
                columns={columns}
                rowKey="saleid"
                addUrl="/sale-bill"
                detailUrl="/sale-bill"
                permissionUrl="/SaleBill-utility"
                includeYearCode = {includeYearCode}
                getRowStyle={getRowStyle}
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

export default SaleBillUtility;
