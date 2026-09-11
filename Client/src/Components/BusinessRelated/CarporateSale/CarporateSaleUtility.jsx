import React from "react";
import TableUtility from "../../../Common/UtilityCommon/TableUtility"; 

const CarporateSaleUtility = ({includeYearCode =true}) => {
    const apiUrl = `${process.env.REACT_APP_API}/getdata-corporate`;
    const columns = [
        { label: "Doc No", key: "doc_no" },
        { label: "Doc Date", key: "doc_date" },
        { label: "Carporate Party Name", key: "carporatepartyaccountname" },
        { label: "Carporate Unit Name", key: "carporatepartyunitname" },
        { label: "Carporate Broker Name", key: "carporatepartybrokername" },
        { label: "PO Number", key: "pono" },
        { label: "Quantal", key: "quantal",format: true },
        { label: "Sale Rate", key: "sell_rate" },
        { label: "Narration", key: "remark" },
        { label: "Carpid", key: "carpid" },
        { label: "Selling Type", key: "selling_type" },
        { label: "Delivery Type", key: "DeliveryType" },
        
    ];



     const getRowStyle = (row) => {
        if (row.IsDeleted === 0) {
            return { backgroundColor: '#ffcccc' };
        }
        return {}; 
    };
    
    return (
        <TableUtility
            title="Carporate Sale"
            apiUrl={apiUrl}
            columns={columns}
            rowKey="carpid"
            addUrl="/CarporateSale"
            detailUrl="/CarporateSale"
            permissionUrl="/CarporateSale-utility"
            includeYearCode = {includeYearCode}
            getRowStyle={getRowStyle}
        />
    );
};

export default CarporateSaleUtility;
