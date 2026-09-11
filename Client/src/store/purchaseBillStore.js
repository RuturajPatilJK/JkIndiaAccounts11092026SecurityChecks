import { configureStore } from '@reduxjs/toolkit';
import purchaseBillSlice from './purchaseBillSlice';

const purchaseBillStore = configureStore({
  reducer: {
    purchaseBill: purchaseBillSlice.reducer,
  },
});

export default purchaseBillStore;
