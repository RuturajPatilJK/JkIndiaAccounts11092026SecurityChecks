import createLiveEntitySlice from './createLiveEntitySlice';

const purchaseBillSlice = createLiveEntitySlice({
  name: 'purchaseBill',
  idField: 'doc_no',
  fetchUrl: 'getdata-sugarpurchase',
});

export const { reducer, actions, fetchAll, selectors, selectStatus } = purchaseBillSlice;
export default purchaseBillSlice;
