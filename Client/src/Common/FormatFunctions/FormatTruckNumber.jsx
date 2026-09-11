// const formatTruckNumber = (value) => {
//     const cleanedValue = value.replace(/[^A-Za-z0-9 ]/g, "").toUpperCase();
//     const alphanumericValue = cleanedValue.replace(/\s+/g, "");
//     const truncatedValue = alphanumericValue.length <= 50
//       ? alphanumericValue
//       : alphanumericValue.substring(0, 50);
//     let result = "";
//     let alphanumericIndex = 0;
//     for (let i = 0; i < cleanedValue.length; i++) {
//       if (cleanedValue[i] === " ") {
//         result += " ";
//       } else if (alphanumericIndex < truncatedValue.length) {
//         result += truncatedValue[alphanumericIndex++];
//       }
//     }
//     return result;
//   };
//   export default formatTruckNumber;



const formatTruckNumber = (value) => {

    const cleanedValue = value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();

    const truncatedValue = cleanedValue.length <= 50
      ? cleanedValue
      : cleanedValue.substring(0, 50);
    
    return truncatedValue;
};

export default formatTruckNumber;