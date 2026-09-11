import React from "react";
import { Provider } from "react-redux";
import LiveTableUtility from "../../../Common/UtilityCommon/LiveTableUtility";
import utrEntryStore from "../../../store/utrEntryStore";
import { actions, fetchAll, selectors, selectStatus } from "../../../store/utrEntrySlice";

const socketEvents = { added: "utr_entry_added", updated: "utr_entry_updated", deleted: "utr_entry_deleted" };

function UTREntryUtility() {
    const columns = [
        { key: "doc_no", label: "Doc No" },
        { key: "doc_date", label: "Doc Date" },
        { key: "bankAcName", label: "Bank A/c Name", isLabel: true },
        { key: "millName", label: "Mill Name", isLabel: true },
        { key: "amount", label: "Amount",format: true },
        { key: "utr_no", label: "UTR No" },
        { key: "narration_header", label: "Narration Header" },
        { key: "narration_footer", label: "Narration Footer" },
        { key: "utrid", label: "UTR ID" },
        { key: "IsDeleted", label: "Is Deleted" },
    ];

    return (
        <Provider store={utrEntryStore}>
            <LiveTableUtility
                title="UTR Entry"
                columns={columns}
                rowKey="doc_no"
                addUrl="/utr-entry"
                detailUrl="/utr-entry"
                permissionUrl="/utrentry-Utility"
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

export default UTREntryUtility;
