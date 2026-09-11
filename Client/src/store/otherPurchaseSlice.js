import { createSlice, createAsyncThunk, createEntityAdapter } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API;

const otherPurchaseAdapter = createEntityAdapter({
  selectId: (record) => record.Doc_No,
});

export const fetchOtherPurchase = createAsyncThunk(
  'otherPurchase/fetchAll',
  async ({ companyCode, yearCode }) => {
    const params = new URLSearchParams({ Company_Code: companyCode, Year_Code: yearCode });
    const response = await axios.get(`${API_URL}/getall-OtherPurchase?${params.toString()}`);
    const dataKey = Object.keys(response.data)[0];
    return response.data[dataKey] || [];
  }
);

const otherPurchaseSlice = createSlice({
  name: 'otherPurchase',
  initialState: otherPurchaseAdapter.getInitialState({
    status: 'idle',
    error: null,
  }),
  reducers: {
    recordAdded: otherPurchaseAdapter.upsertOne,
    recordUpdated: otherPurchaseAdapter.upsertOne,
    recordDeleted: (state, action) => {
      otherPurchaseAdapter.removeOne(state, action.payload.Doc_No);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOtherPurchase.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchOtherPurchase.fulfilled, (state, action) => {
        state.status = 'succeeded';
        otherPurchaseAdapter.setAll(state, action.payload);
      })
      .addCase(fetchOtherPurchase.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export const { recordAdded, recordUpdated, recordDeleted } = otherPurchaseSlice.actions;

export const otherPurchaseSelectors = otherPurchaseAdapter.getSelectors(
  (state) => state.otherPurchase
);

export default otherPurchaseSlice.reducer;
