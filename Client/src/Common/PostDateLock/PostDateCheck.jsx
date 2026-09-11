export const PostDateCheck = (docDate, postDate) => {
    return new Date(docDate) <= new Date(postDate);
  };
