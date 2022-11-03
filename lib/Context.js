import { createContext } from 'react';
import {useState, useEffect} from 'react';
import { useLocalStorage } from '../lib/useLocalStorage';
import { ToastContainer, toast } from 'react-toastify';
import moment from 'moment';
import axios from "axios";

export const Context = createContext();

export const ContextProvider = ({children}) => {

    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    const CURRENT_VERSION = "0.1";

    const [appVersion, setAppVersion] = useLocalStorage('version', CURRENT_VERSION);
    
    const [isLoading, setIsLoading] = useState(true);

    const toastOptions = {
        position: "top-right",
        autoClose: 2500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
    };


    //PRIVATE DATA
    const [privateData, setPrivateData] = useLocalStorage('privateData', {
        SERVER_TOKEN: {
            name: 'Server Token',
            type: 'text',
            value: '',
        },
        BCN_USER: {
            name: 'BCN: Username',
            type: 'text',
            value: '',
        },
        BCN_PSWD: {
            name: 'BCN: Password',
            type: 'password',
            value: '',
        },
        CAIXA_USER: {
            name: 'CAIXA: Username',
            type: 'text',
            value: '',
        },
        CAIXA_PSWD: {
            name: 'CAIXA: Password',
            type: 'password',
            value: '',
        },
        PRIME_USER: {
            name: 'PRIME: Username',
            type: 'text',
            value: '',
        },
        PRIME_PSWD: {
            name: 'PRIME: Password',
            type: 'password',
            value: '',
        },
    });

    
    //BANKS
    const [lastBanksUpdate, setLastbanksUpdate] = useLocalStorage('last-bank-update', Date.now());
    const [banksLoading, setBanksLoading] = useState(false);
    const [bankAssets, setBankAssets] = useLocalStorage('bankAssets', {
        bcn: {
            value: "0",
            currency: "CVE"
        },
        caixa: {
            value: "0",
            currency: "CVE"
        }
    });
    const loadBanksData = () => {
        setBanksLoading(true);
        const bcnPromise = loadBankData('bcn');
        const caixaPromise = loadBankData('caixa');
        Promise.all([bcnPromise, caixaPromise]).then(() => {
            setBanksLoading(false);
            setLastbanksUpdate(Date.now());
        });
    }
    const loadBankData = (bankName) => {
        const params = {
            token: privateData.SERVER_TOKEN.value,
            userName: privateData[`${bankName.toUpperCase()}_USER`].value,
            password: privateData[`${bankName.toUpperCase()}_PSWD`].value,
        };
        const popup = toast.loading(`Updating ${bankName.toUpperCase()} data...`, toastOptions);
        const bankPromise = axios.get(`${API_URL}/cv-assets/${bankName}`, {params})
        .then((response) => {
            setBankAssets(curr => {
                console.log({curr});
                return {...curr, [bankName]: response.data};
            });
            toast.update(popup, {
                ...toastOptions,
                render: `${bankName.toUpperCase()} updated.`, 
                type: "success", 
                isLoading: false,
            });
        })
        .catch(err => {
            console.error(err);
            toast.update(popup, { 
                ...toastOptions, 
                render: `${bankName.toUpperCase()}: ${err.response?.data ?? err.message}`, 
                type: "error", 
                isLoading: false,
            });
        });
        return bankPromise;
    }
        

    //PRIME
    const [lastMeetingUpdate, setLastMeetingUpdate] = useLocalStorage('last-meeting-update', Date.now());
    const [meetingsLoading, setMeetingsLoading] = useState(false);
    const [meetings, setMeetings] = useLocalStorage('meetings', []);
    const loadMeetings = () => {
        setMeetingsLoading(true);
        const params = {
            token: privateData.SERVER_TOKEN.value,
            userName: privateData[`PRIME_USER`].value,
            password: privateData[`PRIME_PSWD`].value,
        };
        const popup = toast.loading(`Updating meetings...`, toastOptions);
        const meetingsPromise = axios.get(`${API_URL}/cv-prime/meetings`, {params})
        .then((response) => {
            setMeetings(response.data);
            setMeetingsLoading(false);
            setLastMeetingUpdate(Date.now());
            toast.update(popup, {
                ...toastOptions,
                render: `Meetings updated.`, 
                type: "success", 
                isLoading: false,
            });
        })
        .catch(err => {
            console.error(err);
            toast.update(popup, { 
                ...toastOptions, 
                render: `Couldn't update meetings: ${err.response?.data ?? err.message}`, 
                type: "error", 
                isLoading: false,
            });
        });
        return meetingsPromise;
    }


    useEffect(()=>{
        setIsLoading(false);
        if(appVersion !== CURRENT_VERSION){
        }else{
        }
    },[]);


    return (
        <Context.Provider value={{
            toastOptions,
            isLoading, banksLoading,
            privateData, setPrivateData,
            bankAssets, setBankAssets, loadBanksData, lastBanksUpdate,
            meetings, loadMeetings, meetingsLoading, lastMeetingUpdate
        }}>
            {children}
        </Context.Provider>
    )
}