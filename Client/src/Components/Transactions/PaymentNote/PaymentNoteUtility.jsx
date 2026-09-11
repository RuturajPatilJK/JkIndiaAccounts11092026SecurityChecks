import React from "react";
import TableUtility from "../../../Common/UtilityCommon/TableUtility"; 

const PaymentNoteUtility = ({includeYearCode =true}) => {
    const apiUrl = `${process.env.REACT_APP_API}/getData_PaymentNote`;
    const columns = [
        { label: "Doc No", key: "doc_no" },
        { label: "Doc Date", key: "doc_date" },
        { label: "Bank Ac", key: "bank_ac" },
        { label: "payment_to", key: "payment_to" },
        { label: "Bill Amount", key: "Bill_Amount" },
        { label: "amount", key: "amount" },
        { label: "narration", key: "narration" },
        { label: "pid", key: "pid" }
    ];

    return (
        <TableUtility
            title="Payment Note"
            apiUrl={apiUrl}
            columns={columns}
            rowKey="doc_no"
            addUrl="/payment-note"
            detailUrl="/payment-note"
            permissionUrl="/PaymentNote-utility"
            includeYearCode={includeYearCode}
        />
    );
};

export default PaymentNoteUtility;