import React from "react";
import TableUtility from "../../../Common/UtilityCommon/TableUtility";

const SugarSaleReturnSaleUtility = ({includeYearCode = true}) => {
    const apiUrl = `${process.env.REACT_APP_API}/getdata-SugarSaleReturnSale`;
    
    const columns = [
        { label: "Doc No", key: "doc_no" },
        { label: "Doc Date", key: "doc_date" },
        { label: "Account Name", key: "Ac_Name_E" },
        { label: "NET Quintal", key: "NETQNTL",format: true },
        { label: "Bill Amount", key: "Bill_Amount",format: true },
        { label: "Prid", key: "srid" },
        { label: "AckNo", key: "ackno" },
    ];

    return (
        <TableUtility
            title="Sugar Sale Return"
            apiUrl={apiUrl}
            columns={columns}
            rowKey="doc_no"
            addUrl="/sugar-sale-return-sale"
            detailUrl="/sugar-sale-return-sale"
            permissionUrl="/sugar-sale-return-sale-utility"
            includeYearCode = {includeYearCode}
        />
    );
};

export default SugarSaleReturnSaleUtility;
