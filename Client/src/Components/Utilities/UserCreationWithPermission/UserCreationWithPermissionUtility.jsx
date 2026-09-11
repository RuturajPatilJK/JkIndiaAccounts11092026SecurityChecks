import React from "react";
import TableUtility from "../../../Common/UtilityCommon/TableUtility"; 

const UserCreationWithPermissionUtility = () => {
    const apiUrl = `${process.env.REACT_APP_API}/get-users`;
    const columns = [
        { label: "User Id", key: "User_Id" },
        { label: "User FullName", key: "userfullname" },
        { label: "User Type", key: "User_Type" },
        { label: "Mobile", key: "Mobile" },
        { label: "Email Id", key: "EmailId" },
        { label: "UID", key: "uid" }
    ];

    return (
        <TableUtility
            title="User Management"
            apiUrl={apiUrl}
            columns={columns}
            rowKey="User_Id"
            addUrl="/user-creation"
            detailUrl="/user-creation"
            permissionUrl="/user-permission-utility"
        />
    );
};

export default UserCreationWithPermissionUtility;
