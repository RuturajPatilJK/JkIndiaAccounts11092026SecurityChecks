import { createSlice, createAsyncThunk, createEntityAdapter } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API;

export default function createLiveEntitySlice({ name, idField, fetchUrl }) {
  const adapter = createEntityAdapter({
    selectId: (record) => record[idField],
  });

  const fetchAll = createAsyncThunk(
    `${name}/fetchAll`,
    async ({ companyCode, yearCode, extraParams = {} } = {}) => {
      const params = new URLSearchParams({
        Company_Code: companyCode,
        ...(yearCode !== undefined && yearCode !== null ? { Year_Code: yearCode } : {}),
        ...extraParams,
      });
      const response = await axios.get(`${API_URL}/${fetchUrl}?${params.toString()}`);
      const dataKey = Object.keys(response.data)[0];
      return response.data[dataKey] || [];
    }
  );

  const slice = createSlice({
    name,
    initialState: adapter.getInitialState({
      status: 'idle',
      error: null,
    }),
    reducers: {
      recordAdded: adapter.upsertOne,
      recordUpdated: adapter.upsertOne,
      recordDeleted: (state, action) => {
        adapter.removeOne(state, action.payload[idField]);
      },
    },
    extraReducers: (builder) => {
      builder
        .addCase(fetchAll.pending, (state) => {
          state.status = 'loading';
        })
        .addCase(fetchAll.fulfilled, (state, action) => {
          state.status = 'succeeded';
          adapter.setAll(state, action.payload);
        })
        .addCase(fetchAll.rejected, (state, action) => {
          state.status = 'failed';
          state.error = action.error.message;
        });
    },
  });

  return {
    reducer: slice.reducer,
    actions: slice.actions,
    fetchAll,
    selectors: adapter.getSelectors((state) => state[name]),
    selectStatus: (state) => state[name].status,
  };
}
