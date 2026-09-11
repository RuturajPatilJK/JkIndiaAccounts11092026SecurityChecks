import React from "react";
import TableUtility from "../../../Common/UtilityCommon/TableUtility";

function UTREntryUtility() {
    const apiUrl = `${process.env.REACT_APP_API}/getdata-utr`;
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
        <TableUtility
            title="UTR Entry"
            apiUrl={apiUrl}
            queryParams={{
                Company_Code: sessionStorage.getItem("Company_Code")
            }}
            columns={columns}
            rowKey="doc_no"
            addUrl="/utr-entry"
            detailUrl="/utr-entry"
            permissionUrl="/utrentry-Utility"
        />
    );
}

export default UTREntryUtility;
