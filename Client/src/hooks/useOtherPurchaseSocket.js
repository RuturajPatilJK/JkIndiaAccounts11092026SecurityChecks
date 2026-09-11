import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import io from 'socket.io-client';
import { fetchOtherPurchase } from '../store/otherPurchaseSlice';

const socketURL = process.env.REACT_APP_API_URL;

// The add/update events only carry the raw saved record, not the server-joined
// display fields the grid shows (e.g. SupplierName) — so instead of merging the
// partial payload in, we just re-fetch the list to get fully correct, joined data.
export default function useOtherPurchaseSocket(companyCode, yearCode) {
  const dispatch = useDispatch();

  useEffect(() => {
    const socket = io(socketURL, { transports: ['websocket'] });

    const matchesScope = (data) =>
      String(data?.Company_Code) === String(companyCode) &&
      String(data?.Year_Code) === String(yearCode);

    const handleChange = (data) => {
      if (matchesScope(data)) dispatch(fetchOtherPurchase({ companyCode, yearCode }));
    };

    socket.on('other_purchase_added', handleChange);
    socket.on('other_purchase_updated', handleChange);
    socket.on('other_purchase_deleted', handleChange);

    return () => {
      socket.off('other_purchase_added', handleChange);
      socket.off('other_purchase_updated', handleChange);
      socket.off('other_purchase_deleted', handleChange);
      socket.disconnect();
    };
  }, [dispatch, companyCode, yearCode]);
}
