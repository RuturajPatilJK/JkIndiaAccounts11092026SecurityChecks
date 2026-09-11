import createLiveEntitySlice from './createLiveEntitySlice';

const serviceBillSlice = createLiveEntitySlice({
  name: 'serviceBill',
  idField: 'Doc_No',
  fetchUrl: 'getdata-servicebill',
});

export const { reducer, actions, fetchAll, selectors, selectStatus } = serviceBillSlice;
export default serviceBillSlice;
