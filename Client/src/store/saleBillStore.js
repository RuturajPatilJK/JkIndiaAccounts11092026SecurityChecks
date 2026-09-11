import { configureStore } from '@reduxjs/toolkit';
import saleBillSlice from './saleBillSlice';

const saleBillStore = configureStore({
  reducer: {
    saleBill: saleBillSlice.reducer,
  },
});

export default saleBillStore;
