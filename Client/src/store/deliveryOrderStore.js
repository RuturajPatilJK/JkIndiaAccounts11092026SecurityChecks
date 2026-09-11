import { configureStore } from '@reduxjs/toolkit';
import deliveryOrderSlice from './deliveryOrderSlice';

const deliveryOrderStore = configureStore({
  reducer: {
    deliveryOrder: deliveryOrderSlice.reducer,
  },
});

export default deliveryOrderStore;
