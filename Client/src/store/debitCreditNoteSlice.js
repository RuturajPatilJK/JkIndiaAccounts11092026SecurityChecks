import createLiveEntitySlice from './createLiveEntitySlice';

const debitCreditNoteSlice = createLiveEntitySlice({
  name: 'debitCreditNote',
  idField: 'doc_no',
  fetchUrl: 'getdata-debitcreditNote',
});

export const { reducer, actions, fetchAll, selectors, selectStatus } = debitCreditNoteSlice;
export default debitCreditNoteSlice;
