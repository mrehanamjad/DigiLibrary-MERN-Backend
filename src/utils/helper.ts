export const getPaginationOptions = (page:number,limit:number,totalDocsName:string,DocsName:string) => {
  const opts = {
    page,
    limit,
    customLabels: {
      totalDocs: totalDocsName,
      docs: DocsName,
      limit: "limit",
      page: "currentPage",
      nextPage: "nextPage",
      prevPage: "prevPage",
      totalPages: "totalPages",
      pagingCounter: "pagingCounter",
      meta: "pagination",
    },
  };

  return opts;
};
