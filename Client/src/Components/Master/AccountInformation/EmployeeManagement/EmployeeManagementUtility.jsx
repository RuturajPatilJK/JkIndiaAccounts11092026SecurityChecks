// EmployeeManagementUtility.js
import React, { useState } from "react";
import TableUtility from "../../../../Common/UtilityCommon/TableUtility";

const STATUS_OPTIONS = [
    { label: "Active", value: "Y" },
    { label: "Inactive", value: "N" },
];

const EmployeeManagementUtility = () => {
    const [statusFilter, setStatusFilter] = useState("Y");
    const apiUrl = `${process.env.REACT_APP_API}/getall-employees`;
    const columns = [
        { label: "Doc No", key: "doc_no" },
        { label: "Employee Code", key: "employee_code" },
        { label: "Name", key: "name" },
        { label: "Mobile No", key: "mobile_No" },
        { label: "Date Of Joining", key: "Date_of_joining" },
        { label: "Status", key: "status" },
        ...(statusFilter !== "Y" ? [{ label: "Resignation Date", key: "Resign_date" }] : []),
    ];

    return (
        <TableUtility
            title="Employee Management"
            apiUrl={apiUrl}
            columns={columns}
            rowKey="Employee_id"
            addUrl="/employee-management"
            detailUrl="/employee-management"
            permissionUrl="/employee-management-utility"
            queryParams={{
                company_code: sessionStorage.getItem('Company_Code'),
                year_code: sessionStorage.getItem('Year_Code'),
            }}
            dropdownOptions={STATUS_OPTIONS}
            dropdownValue={statusFilter}
            onDropdownChange={(e) => setStatusFilter(e.target.value)}
            dropdownFilterKey="status"
            enableExcelExport
            exportFileName="EmployeeManagement"
        />
    );
};

export default EmployeeManagementUtility;
