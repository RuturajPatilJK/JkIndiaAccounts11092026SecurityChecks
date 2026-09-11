import React from "react";
import TableUtility from "../../../Common/UtilityCommon/TableUtility";

const API_URL = process.env.REACT_APP_API;
function ProformaServiceBillUtility({ includeYearCode = true }) {
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
        {key: "ProformaServicebillno", label : "Proforma Service Bill No"}
    ];


     const getRowStyle = (row) => {
        if (row.ProformaServicebillno != null) {
            return { backgroundColor: '#c3ddbc' };
        }
        return {}; 
    };
    

    return (
        <TableUtility
            title="Proforma Service Bill"
            apiUrl={`${API_URL}/getdata-proformaservicebill`}
            columns={columns}
            rowKey="Doc_No"
            addUrl="/Proforma-ServiceBill"
            detailUrl="/Proforma-ServiceBill"
            permissionUrl="/Proforma-utility"
            includeYearCode={includeYearCode}
             getRowStyle={getRowStyle}
        />
    );
}

export default ProformaServiceBillUtility;
