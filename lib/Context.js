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
    const [primeSettings, setPrimeSettings] = useLocalStorage('primeSettings', [
        {
            name: 'prime_data',
            enabled: false,
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
    
    const [bankSettings, setBankSettings] = useLocalStorage('bankSettings', [
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
        {
            name: 'CVE',
            action: 'show',
            type: 'currency',
            enabled: true,
        },
        {
            name: 'EUR',
            action: 'show',
            type: 'currency',
            enabled: false,
        },
        {
            name: 'USD',
            action: 'show',
            type: 'currency',
            enabled: false,
        },
        {
            name: 'preferred currency',
            type: 'select',
            options: ['CVE', 'EUR', 'USD'],
            value: 'CVE',
        },
    ]);

    //banksCredentials
    const filterBanksData = (data) => {
        return data
        .filter(d => d.type === 'bank')
        .reduce((o, b) => ({ ...o, [b.name]: b }), {});
    }
    const [banksCredentials, setBanksCredentials] = useState(filterBanksData(bankSettings));
    useEffect(()=>{
        setBanksCredentials(filterBanksData(bankSettings));
    },[bankSettings]);

    const filterPreferredCurrency = (data) => {
        return data
        .filter(d => d.name === 'preferred currency')[0].value
    }
    const [preferredCurrency, setPreferredCurrency] = useState(filterPreferredCurrency(bankSettings))
    useEffect(()=>{
        setPreferredCurrency(filterPreferredCurrency(bankSettings));
    },[bankSettings]);
    
    //PRIMEDATA
    const filterPrimeData = (data) => {
        return data.filter(d => d.name === 'prime')[0];
    }
    const [primeData, setPrimeData] = useState(filterPrimeData(primeSettings));
    useEffect(()=>{
        setPrimeData(filterPrimeData(primeSettings))
    },[primeSettings]);

    //Currencies
    const filterCurrencies = (data) => {
        return data.filter(d => d.type === 'currency' && d.enabled).map(c => c.name);
    }
    const [activeCurrencies, setActiveCurrencies] = useState(filterCurrencies(bankSettings));
    useEffect(()=>{
        setActiveCurrencies(filterCurrencies(bankSettings))
    },[bankSettings]);

    const [rates, setRates] = useState({});
    useEffect(()=>{
        const couples = [["CVE", "EUR"], ["CVE", "USD"], ["EUR", "USD"]];
        couples.forEach( ([from, to]) => {
            const params = {
                token: SERVER_TOKEN,
                amount: 1,
                from,
                to
            };
            axios.get(`${API_URL}/convert/`, {params})
            .then(response => {
                setRates(curr => ({...curr, [from+to]: response.data, [to+from]: 1/response.data}));
            })
            .catch(err => {
                console.error(err);
            });
        })
    },[]);

    //BANKS
    const [banksLoading, setBanksLoading] = useState({bcn: false, caixa: false});
    const [banksData, setBanksData] = useLocalStorage('banksData', {bcn: {}, caixa: {}});
    const loadBanksData = (bankNames) => {
        const bankPromises = [];
        bankNames.forEach(bankName => {
            const bank = banksCredentials[bankName];
            if(bank.enabled && !banksLoading[bankName]){
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
            setBanksLoading({bcn: false, caixa: false});
        })
        .catch(()=>{
            setBanksLoading({bcn: false, caixa: false});
        });
    }
    const loadBankData = (bankName, userName, password) => {
        setBanksLoading(curr => ({...curr, [bankName]: true}));
        const params = {
            token: SERVER_TOKEN,
            userName,
            password
        };
        const popup = toast.loading(`Updating ${bankName.toUpperCase()} data...`, toastOptions);
        const bankPromise = axios.get(`${API_URL}/cv-assets/${bankName}`, {params})
        .then((response) => {
            console.log(response.data);
            setBanksData(curr => {
                return {...curr, [bankName]: response.data};
            });
            setBanksLoading(curr => ({...curr, [bankName]: false}));
            toast.update(popup, {
                ...toastOptions,
                render: `${bankName.toUpperCase()} updated.`, 
                type: "success", 
                isLoading: false,
            });
        })
        .catch(err => {
            console.error(err);
            setBanksLoading(curr => ({...curr, [bankName]: false}));
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

    const convert = (value, from, to, formatted) => {
        const converted = rates[from+to] ? rates[from+to]*value : value;
        const newValue = Math.round(converted * 100) / 100;
        return formatted? format(newValue, to) : newValue;
    }

    const format = (value, currency) => {
        let stringValue = value.toString();
        let isNegative;
        if(stringValue[0] === '-' || stringValue[0] === '+'){
            if(stringValue[0] === '-') {isNegative = true;}
            stringValue = stringValue.substr(1, stringValue.length);
        }
        let decimals = stringValue.split('.')[1] || '00';
        if(decimals.length < 2){
            while(decimals.length < 2){
                decimals += '0';
            }
        }
        const integers =  stringValue.split('.')[0];
        let newString = '';
        for(let i=0; i<integers.length; i++){
            const check = integers.length - 1 - i;
            newString = integers[check] + newString;
            if( (i+1)%3 === 0 && integers[check - 1] ){
            newString = ',' + newString;
            }
        }
        return `${isNegative? '-' : '+'}${newString}${decimals ? '.'+decimals : ''} ${currency}`;
    }

    return (
        <Context.Provider value={{
            toastOptions,
            isLoading, banksLoading,
            bankSettings, setBankSettings, primeSettings, setPrimeSettings, 
            banksCredentials, primeData,
            banksData, setBanksData, loadBanksData, activeCurrencies,
            meetings, loadMeetings, meetingsLoading, lastMeetingUpdate,
            preferredCurrency, convert, format
        }}>
            {children}
        </Context.Provider>
    )
}