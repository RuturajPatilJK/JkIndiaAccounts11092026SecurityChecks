
export const formatDate = (dateString) => {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  export const FormaDateBalanceSheet = (dateStr) => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const [year, month, day] = dateStr.split("-");
    return `${parseInt(day)}-${months[parseInt(month) - 1]}-${year}`;
  };
  
  
