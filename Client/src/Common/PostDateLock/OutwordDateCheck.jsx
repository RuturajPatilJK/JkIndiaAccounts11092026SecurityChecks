
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