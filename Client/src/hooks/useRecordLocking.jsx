import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API;

export const useRecordLocking = (recordId, tran_type, company_code, year_code, model_type) => {

    const storageKey = `lock_${recordId}`;
    const storedLockStatus = sessionStorage.getItem(storageKey);

    const initialLockStatus = storedLockStatus ? JSON.parse(storedLockStatus) : false;
    const [isRecordLockedByUser, setIsRecordLockedByUser] = useState(initialLockStatus);

    if (!company_code || !year_code) {
        throw new Error("Both company_code and year_code are required.");
    }
    // Function to lock the record
    const buildApiUrl = () => {
        const baseUrl = `${API_URL}/record-lock`;
        const params = new URLSearchParams();
        params.append("id", recordId);
        if (tran_type) {
            params.append("tran_type", tran_type);
        }
        params.append("company_code", company_code);
        params.append("year_code", year_code);
        params.append("model_type", model_type);
        return `${baseUrl}?${params.toString()}`;
    };

    // Function to lock the record
    const lockRecord = () => {
        axios.put(buildApiUrl(), {
            LockedRecord: true,
            LockedUser: sessionStorage.getItem("username"),
            company_code: company_code,
            year_code: year_code
        })
            .then(() => {
                setIsRecordLockedByUser(true);
                sessionStorage.setItem(storageKey, JSON.stringify(true));
            })
            .catch((error) => {
                console.error("Error locking record:", error);
            });
    };

    // Function to unlock the record
    const unlockRecord = () => {
        if (isRecordLockedByUser) {
            axios.put(buildApiUrl(), {
                LockedRecord: false,
                LockedUser: "",
                company_code: company_code,
                year_code: year_code
            })
                .then(() => {
                    setIsRecordLockedByUser(false);
                    sessionStorage.removeItem(storageKey);
                })
                .catch((error) => {
                    console.error("Error unlocking record:", error);
                });
        }
    };

    useEffect(() => {
        const handleBeforeUnload = () => {
            if (isRecordLockedByUser) {
                unlockRecord();
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            if (isRecordLockedByUser) {
                unlockRecord();
            }
        };
    }, [isRecordLockedByUser, recordId]);


    return { isRecordLockedByUser, lockRecord, unlockRecord };
};

