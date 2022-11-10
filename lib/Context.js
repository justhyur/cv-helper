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
    const CURRENCY_API_URL = process.env.NEXT_PUBLIC_CURRENCY_API_URL;
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

    
    //BANK DATA
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

    //Currencies
    const filterCurrencies = (data) => {
        return data.filter(d => d.type === 'currency' && d.enabled).map(c => c.name);
    }
    const [activeCurrencies, setActiveCurrencies] = useState(filterCurrencies(bankSettings));
    useEffect(()=>{
        setActiveCurrencies(filterCurrencies(bankSettings))
    },[bankSettings]);

    const [updatingRates, setUpdatingRates] = useState(false);
    const [lastRatesUpdate, setLastRatesUpdate] = useLocalStorage('lastRatesUpdate', 0);
    const [rates, setRates] = useLocalStorage('rates', {
        "CVEUSD": 0.0090387352,
        "USDCVE": 110.6349481285833,
        "CVEEUR": 0.0090686497,
        "EURCVE": 110.26999973325687,
        "EURUSD": 0.99670133,
        "USDEUR": 1.0033095872361282
    });
    const updateRates = () => {
        setUpdatingRates(true);
        const loadCouples = (couples) => {
            if(couples.length > 0){
                const [from, to] = couples[0];
                axios.get(`${CURRENCY_API_URL}/convert`, {params: {token: SERVER_TOKEN, amount: 1, from, to}})
                .then(res => {
                    console.log(res.data)
                    setRates(curr => ({...curr, [`${from}${to}`] : res.data.value, [`${to}${from}`]: 1/res.data.value }));
                    couples.shift();
                    setTimeout(()=>{loadCouples(couples)}, 1000);
                })
                .catch(err=>{
                    console.log(err);
                    setTimeout(()=>{loadCouples(couples)}, 5000);
                })
            }else{
                setLastRatesUpdate(Date.now());
                setUpdatingRates(false);
            }
        }
        const couples = [["EUR", "CVE"], ["EUR", "USD"], ["CVE", "USD"]];
        loadCouples(couples);
    }
    useEffect(()=>{
        const updateEvery = 10 * 60 * 1000;
        if(Date.now() - lastRatesUpdate > updateEvery){
            updateRates();
        }
    },[]);

    //BANKS
    const [banksLoading, setBanksLoading] = useState({bcn: false, caixa: false});
    useEffect(()=>{
        console.log(banksLoading)
    },[banksLoading])
    const [banksData, setBanksData] = useLocalStorage('banksData', {bcn: {}, caixa: {}});
    const loadBanksData = (bankNames) => {
        bankNames.forEach(bankName => {
            const bank = banksCredentials[bankName];
            if(bank?.enabled && !banksLoading[bankName]){
                const userName = bank.form.filter(i => i.name === 'username')[0].value;
                const password = bank.form.filter(i => i.name === 'password')[0].value;
                if(userName.length === 0 || password.length === 0){
                    toast.error(`${bankName.toUpperCase()} Bank: Username or password missing.`, toastOptions);  
                    toast.info(`You can manage your credentials in the private data manager.`, toastOptions);  
                }else{
                    loadBankData(bankName, userName, password);
                }
            }
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
            setBanksData(curr => {
                const newBanksData = {...curr, [bankName]: response.data};
                return {...newBanksData, total: totalizeBanks(newBanksData)};
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
    const totalizeBanks = (banks) => {
        const total = {
            accounting: {value: 0, currency: preferredCurrency},
            available: {value: 0, currency: preferredCurrency},
            date: Date.now(),
            movements: []
        };
        Object.entries(banks).forEach(([bankName, data])=>{
            if(bankName !== 'total'){
                Object.entries(data).forEach(([key, prop])=>{
                    switch(key){
                        case 'accounting': case 'available':
                            total[key].value += convert(prop.value, prop.currency, preferredCurrency);
                        break;
                        case 'movements':
                            prop.forEach(m => {
                                total[key].push({ ...m, origin: bankName, amount: {
                                    currency: preferredCurrency, 
                                    value: convert(m.amount.value, m.amount.currency, preferredCurrency),
                                    formatted: convert(m.amount.value, m.amount.currency, preferredCurrency, true),
                                }});
                            });
                        break;
                    }
                });  
            }
        });
        total.accounting.formatted = format(total.accounting.value, preferredCurrency);
        total.available.formatted = format(total.accounting.value, preferredCurrency);
        total.movements = total.movements.sort((a,b)=>moment(a.date, "DD/MM/YYYY") > moment(b.date, "DD/MM/YYYY")? -1 : 1);
        return total;
    }
    
    //PRIME DATA
    const [primeSettings, setPrimeSettings] = useLocalStorage('primeSettings', [
        {
            name: 'prime',
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
        {
            name: 'declined',
            action: 'show',
            type: 'currency',
            enabled: true,
        },
        {
            name: 'pending',
            action: 'show',
            type: 'currency',
            enabled: true,
        },
    ]);

    //PRIME
    const branchCodes = [
        {
          name: 'Palmarejo Baixo',
          value: '112'
        },
        {
          name: 'Palmarejo',
          value: '111'
        },
        {
          name: 'Mindelo',
          value: '110'
        },
      ];
    const [lastMeetingUpdate, setLastMeetingUpdate] = useLocalStorage('last-meeting-update', Date.now());
    const [meetingsLoading, setMeetingsLoading] = useState(false);
    const [meetings, setMeetings] = useLocalStorage('meetings', []);
    useEffect(()=>{
        console.log(meetings)
    },[meetings]);
    const loadMeetings = (userName, password) => {
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
                render: `Error updating meetings: ${err.response?.data ?? err.message}`, 
                type: "error", 
                isLoading: false,
            });
            setMeetingsLoading(false);
        });
        return meetingsPromise;
    }

    const [isBooking, setIsBooking] = useState(false);
    const [primeLogs, setPrimeLogs] = useState(null);
    const bookMeetings = (userName, password, data) => {
        setIsBooking(true);
        const params = {
            token: SERVER_TOKEN,
            userName,
            password,
            ...data
        };
        const s = parseInt(data.numDays) > 1 ? 's' : '';
        const popup = toast.loading(`Booking meeting${s}...`, toastOptions);
        const bookPromise = axios.get(`${API_URL}/cv-prime/book`, {params})
        .then((res) => {
            toast.dismiss(popup);
            if(res.data.bookedDays.length === 1){
                const day = res.data.bookedDays[0];
                const message = day.booked? toast.success : toast.error;
                message(day.message, toastOptions);
            }else{
                setPrimeLogs(res.data.bookedDays);
            }
            if(res.data.meetings){
                setMeetings(res.data.meetings);
            }
            setIsBooking(false);
        })
        .catch(err => {
            console.error(err);
            toast.update(popup, { 
                ...toastOptions, 
                render: `Error booking meeting${s}: ${err.response?.data ?? err.message}`, 
                type: "error", 
                isLoading: false,
            });
            setIsBooking(false);
        });
        return bookPromise;

    }

    useEffect(()=>{
        setIsLoading(false);
        if(appVersion !== CURRENT_VERSION){
        }else{
        }
    },[]);

    const convert = (value, from, to, formatted) => {
        const converted = rates[from+to] ? rates[from+to]*value : from === to ? value : null;
        if(converted === null){
            return '....';
        }
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
            banksCredentials,
            banksData, setBanksData, loadBanksData, activeCurrencies,
            meetings, loadMeetings, meetingsLoading, lastMeetingUpdate,
            preferredCurrency, convert, format, isBooking, bookMeetings,
            branchCodes, primeLogs, setPrimeLogs, lastRatesUpdate, rates, updateRates, updatingRates
        }}>
            {children}
        </Context.Provider>
    )
}