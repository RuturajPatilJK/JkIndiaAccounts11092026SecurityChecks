import { configureStore } from '@reduxjs/toolkit';
import utrEntrySlice from './utrEntrySlice';

const utrEntryStore = configureStore({
  reducer: {
    utrEntry: utrEntrySlice.reducer,
  },
});

export default utrEntryStore;
