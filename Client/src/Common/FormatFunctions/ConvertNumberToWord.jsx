export function ConvertNumberToWord(num) {
    const belowTwenty = [
        "Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
        "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
    ];

    const tens = [
        "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
    ];

    const scales = [
        "", "Thousand", "Lakh", "Crore"
    ];

    const words = (num) => {
        if (num === 0) return "";
        if (num < 20) return belowTwenty[num];
        if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? " " + belowTwenty[num % 10] : "");
        if (num < 1000) return belowTwenty[Math.floor(num / 100)] + " Hundred" + (num % 100 !== 0 ? "  " + words(num % 100) : "");

        if (num < 100000) {
            return words(Math.floor(num / 1000)) + " Thousand" + (num % 1000 !== 0 ? " " + words(num % 1000) : "");
        } else if (num < 10000000) {
            return words(Math.floor(num / 100000)) + " Lakh" + (num % 100000 !== 0 ? " " + words(num % 100000) : "");
        } else {
            return words(Math.floor(num / 10000000)) + " Crore" + (num % 10000000 !== 0 ? " " + words(num % 10000000) : "");
        }
    };

    const convertFraction = (fraction) => {
        if (fraction === 0) return "Zero Paise";
        return words(fraction);
    };
    const integerPart = Math.floor(num);
    const fractionPart = Math.round((num - integerPart) * 100);

    let result = words(integerPart);

    if (fractionPart > 0) {
        result += " and " + convertFraction(fractionPart) + " Paise "  + " Only";
    } 
    else {
        result += " Only";
    }

    return result;
};