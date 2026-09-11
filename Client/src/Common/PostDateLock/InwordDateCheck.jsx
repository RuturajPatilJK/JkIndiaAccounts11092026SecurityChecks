export const InwordDateCheck = (docDate, postDate, inwardDate) => {
  const docDateObj = new Date(docDate);
  const postDateObj = new Date(postDate);
  const inwardDateObj = new Date(inwardDate);

  if (docDateObj <= postDateObj) {
    return { error: true, type: "PostDate" };
  } else if (docDateObj <= inwardDateObj) {
    return { error: true, type: "InwardDate" };
  }

  return { error: false };
};
  