import createLiveEntitySlice from './createLiveEntitySlice';

const saleBillSlice = createLiveEntitySlice({
  name: 'saleBill',
  idField: 'saleid',
  fetchUrl: 'getdata-SaleBill',
});

export const { reducer, actions, fetchAll, selectors, selectStatus } = saleBillSlice;
export default saleBillSlice;
