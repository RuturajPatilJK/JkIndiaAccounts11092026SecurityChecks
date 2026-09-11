import createLiveEntitySlice from './createLiveEntitySlice';

const utrEntrySlice = createLiveEntitySlice({
  name: 'utrEntry',
  idField: 'doc_no',
  fetchUrl: 'getdata-utr',
});

export const { reducer, actions, fetchAll, selectors, selectStatus } = utrEntrySlice;
export default utrEntrySlice;
