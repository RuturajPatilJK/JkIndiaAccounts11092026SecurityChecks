
export const ewaybillData = (EwabyBillData, tran_type) => {
  const formData = EwabyBillData;

  //Format the address.
  const formatAddress = (inputString) => {
    let cleanedString = inputString.replace(/[^a-zA-Z0-9]/g, " ");
    cleanedString = cleanedString.replace(/\s+/g, " ").trim();
    if (cleanedString.length < 3) {
      return "Error: String is too short. Minimum length is 3.";
    }
    if (cleanedString.length > 100) {
      cleanedString = cleanedString.substring(0, 100).trim();
    }

    return cleanedString;
  };

  // Format the date
  const formatDate = (date) => {
    const d = new Date(date);
    const day = ("0" + d.getDate()).slice(-2);
    const month = ("0" + (d.getMonth() + 1)).slice(-2);
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatName = (inputString = "") => {
    return inputString.replace(/[^a-zA-Z0-9 ]/g, " ").trim();
  };

   function formatVehicleNumber(vehicleNumber) {
    return vehicleNumber.replace(/[^a-zA-Z0-9]/g, "");
  }


  const eWayBillData = {
    token: "",
    eWayBillData: {
      "supplyType": "O",
      "subSupplyType": "1",
      "subSupplyDesc": "others",
      "docType": "INV",
      "docNo": formData.doc_no,
      "docDate": formatDate(formData.doc_date),
      "fromGstin": formData.fromGstin,
      "fromTrdName":formatName(formData.Company_Name_E),
      "fromAddr1": formatAddress(formData.millname),
      "fromAddr2": formatAddress(formData.milladdress),
      "fromPlace": formData.millcityname,
      "fromPincode": formData.millpincode,
      // "fromPincode": "248001",
      "actFromStateCode": formData.actFromStateCode,
      // "actFromStateCode": "05",
      "fromStateCode": formData.fromStateCode,
      // "fromStateCode": "05",
      "toGstin": formData.BillToGst,
      "toTrdName": formatName(formData.BillToName),
      "toAddr1": formatAddress(formData.ShippTo),
      "toAddr2": formatAddress(formData.Address_E),
      "toPlace": formData.city_name_e,
      "toPincode": formData.pincode,
      "actToStateCode": formData.actToStateCode,
      // "actToStateCode": "06",
      "toStateCode": formData.toStateCode,
      // "toStateCode": "06",
      "totalValue": parseFloat(formData.TaxableAmount),
      "cgstValue": parseFloat(formData.CGSTAmount),
      "sgstValue":  parseFloat(formData.SGSTAmount),
      "igstValue":  parseFloat(formData.IGSTAmount),
      "cessValue": 0,
      "totInvValue":  parseFloat(
        (parseFloat(formData.TaxableAmount) || 0) +
          (parseFloat(formData.CGSTAmount) || 0) +
          (parseFloat(formData.SGSTAmount) || 0) +
          (parseFloat(formData.IGSTAmount) || 0) +
          (parseFloat(formData.cessValue) || 0) +
          (parseFloat(formData.otherAmount) || 0)
      ),
      "transporterId": "",
      "transporterName": "",
      "transDocNo": "",
      "transMode": "1",
      "transDistance": formData.Distance || 0,
      "transDocDate": "",
      "vehicleNo": formatVehicleNumber(formData.LORRYNO),
      "vehicleType": "R",
      "transactionType":formData.tranType,
      "itemList": [
        {
          "productName": formData.System_Name_E,
          "productDesc": formData.System_Name_E,
          "hsnCode": formData.HSN,
          "quantity": parseFloat(formData.NETQNTL),
          "qtyUnit": "QTL",
          "cgstRate": parseFloat(formData.CGSTRate),
          "sgstRate": parseFloat(formData.SGSTRate),
          "igstRate": parseFloat(formData.IGSTRate),
          "cessRate": 0,
          "cessAdvol": 0,
          "taxableAmount": parseFloat(formData.TaxableAmount)
        }
      ]
    },
  };

  return eWayBillData;
};
