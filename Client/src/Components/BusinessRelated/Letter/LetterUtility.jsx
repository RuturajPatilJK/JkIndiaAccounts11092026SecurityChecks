import React from "react";
import TableUtility from "../../../Common/UtilityCommon/TableUtility";

const LetterUtility = ({ includeYearCode = true }) => {
    const apiUrl = `${process.env.REACT_APP_API}/getAll_Letter`;
    const columns = [
        { label: "Doc No", key: "DOC_NO" },
        { label: "Doc Date", key: "DOC_DATE" },
        { label: "AC CODE", key: "AC_CODE" },
        { label: "AC NAME", key: "AC_NAME" },
        { label: "CITY", key: "CITY" },
        { label: "SUBJECT", key: "SUBJECT" }
    ];

    return (
        <TableUtility
            title="Letter"
            apiUrl={apiUrl}
            columns={columns}
            rowKey="DOC_NO"
            addUrl="/letter-data"
            detailUrl="/letter-data"
            permissionUrl="/letter"
            includeYearCode={includeYearCode}
        />
    );
};

export default LetterUtility;