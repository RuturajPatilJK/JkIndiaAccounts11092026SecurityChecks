import Swal from "sweetalert2";

export function validateDocumentDate(formattedEntryDate, accountingYearData) {
    const [startDateStr, endDateStr] = accountingYearData.split(" - ");
    const startDate = new Date(startDateStr + 'T00:00:00Z');
    const endDate = new Date(endDateStr + 'T23:59:59Z');

    if (!formattedEntryDate) {
        Swal.fire({
            title: "Error",
            text: "Invalid document date format.",
            icon: "error",
            confirmButtonText: "OK"
        });
        return false;
    }

    const entryDate = new Date(formattedEntryDate + 'T00:00:00Z');

    if (entryDate.getTime() < startDate.getTime() || entryDate.getTime() > endDate.getTime()) {
        Swal.fire({
            icon: "warning",
            title: "Out Of Range Date",
            text: `The document date is outside the Accounting Year range.`,
            confirmButtonColor: "#d33",
        });
        return false;
    }

    return true;
}