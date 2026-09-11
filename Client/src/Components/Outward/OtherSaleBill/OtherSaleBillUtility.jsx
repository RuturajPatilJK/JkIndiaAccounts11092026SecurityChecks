import React from "react";
import TableUtility from "../../../Common/UtilityCommon/TableUtility"; 

const OtherSaleBillUtility = ({includeYearCode =true}) => {
    const apiUrl = `${process.env.REACT_APP_API}/getdata-otherSaleBill`;
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
        <TableUtility
            title="Other Sugar Bill For GST"
            apiUrl={apiUrl}
            columns={columns}
            rowKey="saleid"
            addUrl="/othersale-bill"
            detailUrl="/othersale-bill"
            permissionUrl="/OtherSaleBill-utility"
            includeYearCode = {includeYearCode}
            getRowStyle={getRowStyle}
        />
    );
};

export default OtherSaleBillUtility;
