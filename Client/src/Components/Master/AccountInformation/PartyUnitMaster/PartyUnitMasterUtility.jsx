// PartyUnitMasterUtility.js
import React, { useState } from "react";
import TableUtility from "../../../../Common/UtilityCommon/TableUtility";

const PartyUnitMasterUtility = () => {
    const apiUrl = `${process.env.REACT_APP_API}/getAll_PartyUnitMaster`;
    
    const columns = [
        { label: "Unit Code", key: "unit_code" },
        { label: "Party Code", key: "Ac_Code" },
        { label: "Party Name", key: "partyName" },
        { label: "Unit Name", key: "UnitName" },
        { label: "Remarks", key: "Remarks" }
    ];

    const [searchTerm, setSearchTerm] = useState("");

    const handleSearchTermChange = (event) => {
        setSearchTerm(event.target.value);
    };

    return (
        <TableUtility
            title="Party Unit Master"
            apiUrl={apiUrl}
            columns={columns}
            rowKey="unit_code"
            addUrl="/corporate-customer-limit"
            detailUrl="/corporate-customer-limit"
            permissionUrl="/PartyUnitMaster-utility"
            queryParams={{
                Company_Code: sessionStorage.getItem('Company_Code'),
                Year_Code: sessionStorage.getItem('Year_Code')
            }}
            searchTerm={searchTerm}
            onSearchTermChange={handleSearchTermChange}
        />
    );
};

export default PartyUnitMasterUtility;
