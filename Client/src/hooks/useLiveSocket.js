import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import io from 'socket.io-client';

const socketURL = process.env.REACT_APP_API_URL;

export default function useLiveSocket({
  events,
  actions,
  scopeKeys = { company: 'Company_Code', year: 'Year_Code' },
  mode = 'upsert',
  fetchAll,
  fetchParams,
  companyCode,
  yearCode,
}) {
  const dispatch = useDispatch();

  useEffect(() => {
    const socket = io(socketURL, { transports: ['websocket'] });

    const matchesScope = (data) =>
      String(data?.[scopeKeys.company]) === String(companyCode) &&
      String(data?.[scopeKeys.year]) === String(yearCode);

    const handle = (eventName, action) => (data) => {
  
      if (!matchesScope(data)) return;
      if (mode === 'refetch') {
        dispatch(fetchAll(fetchParams));
      } else {
        dispatch(action(data));
      }
    };

    const handleAdded = handle(events.added, actions.recordAdded);
    const handleUpdated = handle(events.updated, actions.recordUpdated);
    const handleDeleted = handle(events.deleted, actions.recordDeleted);

    console.log('[useLiveSocket] connecting, will listen for:', events, 'mode:', mode);
    socket.on('connect', () => console.log('[useLiveSocket] connected, id:', socket.id));
    socket.on('connect_error', (err) => console.log('[useLiveSocket] connect_error:', err.message));

    if (events.added) socket.on(events.added, handleAdded);
    if (events.updated) socket.on(events.updated, handleUpdated);
    if (events.deleted) socket.on(events.deleted, handleDeleted);

    return () => {
      if (events.added) socket.off(events.added, handleAdded);
      if (events.updated) socket.off(events.updated, handleUpdated);
      if (events.deleted) socket.off(events.deleted, handleDeleted);
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, companyCode, yearCode, events.added, events.updated, events.deleted, mode]);
}
