import { useState, useEffect } from "react";
export const useLocalStorage = (key, initialValue) => {
    
    let startValue;

    if (typeof window !== "undefined") {
        const item = window.localStorage.getItem(key);
        startValue = item ? JSON.parse(item) : initialValue;
    }else{
        startValue = initialValue;
    }

    const [storedValue, setStoredValue] = useState(startValue);

    useEffect(()=>{
        if (typeof window !== "undefined") {
            window.localStorage.setItem(key, JSON.stringify(storedValue));
        }
    },[storedValue]);

    return [storedValue, setStoredValue];
}