export function formatReadableAmount(amount) {
    let num = typeof amount === "string" ? parseFloat(amount) : amount;
    if (num === null || isNaN(num)) return "Invalid number";
    return num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
