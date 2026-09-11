import { configureStore } from '@reduxjs/toolkit';
import otherPurchaseReducer from './otherPurchaseSlice';

const otherPurchaseStore = configureStore({
  reducer: {
    otherPurchase: otherPurchaseReducer,
  },
});

export default otherPurchaseStore;
