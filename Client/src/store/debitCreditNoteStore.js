import { configureStore } from '@reduxjs/toolkit';
import debitCreditNoteSlice from './debitCreditNoteSlice';

const debitCreditNoteStore = configureStore({
  reducer: {
    debitCreditNote: debitCreditNoteSlice.reducer,
  },
});

export default debitCreditNoteStore;
