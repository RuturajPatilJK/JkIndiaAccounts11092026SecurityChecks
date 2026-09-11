
  export const OutwordDateCheck = (docDate, postDate, outwardDate) => {
    const docDateObj = new Date(docDate);
    const postDateObj = new Date(postDate);
    const outwardDateObj = new Date(outwardDate);
    
    if (docDateObj <= postDateObj) {
      return { error: true, type: "PostDate" };
    } else if (docDateObj <= outwardDateObj) {
      return { error: true, type: "OutwordDate" };
    }
  
    return { error: false };
  };
    
//   const parseDate = (s) => {
//   if (!s) return new Date(NaN);

//   const str = String(s).trim();

//   // YYYY-MM-DD
//   if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
//     const [yyyy, mm, dd] = str.split("-").map(Number);
//     return new Date(yyyy, mm - 1, dd);
//   }

//   // dd/MM/yyyy
//   if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
//     const [dd, mm, yyyy] = str.split("/").map(Number);
//     return new Date(yyyy, mm - 1, dd);
//   }

//   // fallback (if you ever pass Date object etc.)
//   return new Date(str);
// };

// // LOCK only if docDate is BEFORE the cutoff date
// export const OutwordDateCheck = (docDate, postDate, outwardDate) => {
//   const doc = parseDate(docDate);
//   const post = parseDate(postDate);
//   const outward = parseDate(outwardDate);

//   console.log("doc", doc, "post", post, "outward", outward);

//   if (isNaN(doc) || isNaN(post) || isNaN(outward)) {
//     return { error: true, type: "InvalidDate" };
//   }

//   if (doc < post) return { error: true, type: "PostDate" };
//   if (doc < outward) return { error: true, type: "OutwordDate" };

//   return { error: false };
// };
