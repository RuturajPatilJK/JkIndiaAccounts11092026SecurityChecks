import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TableUtility from "../../../Common/UtilityCommon/TableUtility"; 

const API_URL = process.env.REACT_APP_API;

const columns = [
  { label: "Company Code", key: "Company_Code" },
  { label: "Company Name", key: "Company_Name_E" },
  { label: "Company Name Regional", key: "Company_Name_R" },
  { label: "Address", key: "Address_E" },
];

function CompanyUtility() {
  const [apiUrl] = useState(`${API_URL}/get_company_data_All`);
 
  return (
    <TableUtility
      title="Company Creation"
      apiUrl={apiUrl}
      columns={columns}
      rowKey="Company_Code"
      addUrl="/create-company"
      detailUrl="/create-company" 
      utilityUrl="/company-list"
      permissionUrl='/create-utility'
    />
  );
}

export default CompanyUtility;
