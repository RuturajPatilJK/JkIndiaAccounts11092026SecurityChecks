import { configureStore } from '@reduxjs/toolkit';
import serviceBillSlice from './serviceBillSlice';

const serviceBillStore = configureStore({
  reducer: {
    serviceBill: serviceBillSlice.reducer,
  },
});

export default serviceBillStore;
