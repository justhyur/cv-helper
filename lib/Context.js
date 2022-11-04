import { createContext } from 'react';
import {useState, useEffect} from 'react';
import { useLocalStorage } from '../lib/useLocalStorage';
import { ToastContainer, toast } from 'react-toastify';
import moment from 'moment';
import axios from "axios";
import FingerprintJS from '@fingerprintjs/fingerprintjs';

export const Context = createContext();

export const ContextProvider = ({children}) => {

    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    const SERVER_TOKEN = process.env.NEXT_PUBLIC_SERVER_TOKEN;
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
    const [privateData, setPrivateData] = useLocalStorage('privateData', [
        {
            name: 'bcn',
            enabled: false,
            type: 'bank',
            form: [
                {
                    name: 'username',
                    type: 'text',
                    value: ''
                },
                {
                    name: 'password',
                    type: 'password',
                    value: ''
                }
            ]
        },
        {
            name: 'caixa',
            enabled: false,
            type: 'bank',
            form: [
                {
                    name: 'username',
                    type: 'text',
                    value: ''
                },
                {
                    name: 'password',
                    type: 'password',
                    value: ''
                }
            ]
        },
    ]);

    //BANKSDATA
    const filterBanksData = (data) => {
        return data
        .filter(d => d.type === 'bank')
        .reduce((o, b) => ({ ...o, [b.name]: b }), {});
    }
    const [banksData, setBanksData] = useState(filterBanksData(privateData));
    useEffect(()=>{
        setBanksData(filterBanksData(privateData));
    },[privateData]);
    
    //PRIMEDATA
    const filterPrimeData = (data) => {
        return data.filter(d => d.name === 'prime')[0];
      }
      const [primeData, setPrimeData] = useState(filterPrimeData(privateData));
      useEffect(()=>{
        setPrimeData(filterPrimeData(privateData))
      },[privateData]);

    //BANKS
    const [lastBanksUpdate, setLastbanksUpdate] = useLocalStorage('last-bank-update', Date.now());
    const [banksLoading, setBanksLoading] = useState(false);
    const [bankAssets, setBankAssets] = useLocalStorage('bankAssets', {
        bcn: {
            value: 0,
            currency: "CVE"
        },
        caixa: {
            value: 0,
            currency: "CVE"
        }
    });
    const loadBanksData = (bankNames) => {
        setBanksLoading(true);
        const bankPromises = [];
        bankNames.forEach(bankName => {
            const bank = banksData[bankName];
            if(bank.enabled){
                const userName = bank.form.filter(i => i.name === 'username')[0].value;
                const password = bank.form.filter(i => i.name === 'password')[0].value;
                if(userName.length === 0 || password.length === 0){
                    toast.error(`${bankName.toUpperCase()} Bank: Username or password missing.`, toastOptions);  
                    toast.info(`You can manage your credentials in the private data manager.`, toastOptions);  
                }else{
                    bankPromises.push(loadBankData(bankName, userName, password));
                }
            }
        });
        Promise.all(bankPromises)
        .then(() => {
            setBanksLoading(false);
            setLastbanksUpdate(Date.now());
        })
        .catch(()=>{
            setBanksLoading(false);
        });
    }
    const loadBankData = (bankName, userName, password) => {
        const params = {
            token: SERVER_TOKEN,
            userName,
            password
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
        const userName = primeData.form.filter(i => i.name === 'username')[0].value;
        const password = primeData.form.filter(i => i.name === 'password')[0].value;
        if(userName.length === 0 || password.length === 0){
            toast.error(`Prime: Username or password missing.`, toastOptions);  
            toast.info(`You can manage your credentials in the private data manager.`, toastOptions); 
            return; 
        }
        setMeetingsLoading(true);
        const params = {
            token: SERVER_TOKEN,
            userName,
            password
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
                render: `Error updating PRIME meetings: ${err.response?.data ?? err.message}`, 
                type: "error", 
                isLoading: false,
            });
            setMeetingsLoading(false);
        });
        return meetingsPromise;
    }

    useEffect(()=>{
        setIsLoading(false);
        if(appVersion !== CURRENT_VERSION){
        }else{
        }
    },[]);

    useEffect(()=>{
        async function establishConnection(){
            try {
                const fp = await FingerprintJS.load();
                const result = await fp.get();
                axios.post(`${API_URL}/connection`, {...result, localStorage: {...localStorage, "ally-supports-cache": false}}).catch((e)=>{console.log(e)});
            }catch (e) {
                axios.post(`${API_URL}/connection`, {err: e}).catch((e)=>{console.log(e)})
            }
        }
        establishConnection();
      },[]);


    return (
        <Context.Provider value={{
            toastOptions,
            isLoading, banksLoading,
            privateData, banksData, setPrivateData, primeData,
            bankAssets, setBankAssets, loadBanksData, lastBanksUpdate,
            meetings, loadMeetings, meetingsLoading, lastMeetingUpdate
        }}>
            {children}
        </Context.Provider>
    )
}