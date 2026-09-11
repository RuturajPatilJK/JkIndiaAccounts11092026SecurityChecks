import createLiveEntitySlice from './createLiveEntitySlice';

const deliveryOrderSlice = createLiveEntitySlice({
  name: 'deliveryOrder',
  idField: 'doc_no',
  fetchUrl: 'getdata-DO',
});

export const { reducer, actions, fetchAll, selectors, selectStatus } = deliveryOrderSlice;
export default deliveryOrderSlice;
