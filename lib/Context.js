import { createContext } from 'react';
import {useState, useEffect} from 'react';
import { useLocalStorage } from '../lib/useLocalStorage';
import { ToastContainer, toast } from 'react-toastify';
import axios from "axios";

export const Context = createContext();

export const ContextProvider = ({children}) => {
    
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

    const [bankAssets, setBankAssets] = useLocalStorage('bankAssets', {
        bcn: 'Loading data...',
        caixa: 'Loading data...'
    });

    //BOT
    const [runtime, setRuntime] = useLocalStorage('runtime', false);
    const [count, setCount] = useState(0);
    const [isUpdating, setIsUpdating] = useState(false);
    useEffect(() => {
        const timer = setTimeout(() => {
            if(runtime){
                bot();
                setCount(count+1);
            }
        }, 60000);
        return () => clearTimeout(timer)
    }, [count, runtime]);
    const bot = () => {
        setIsUpdating(true);
        const bcnPromise = loadBankData('bcn');
        const caixaPromise = loadBankData('caixa');
        Promise.all([bcnPromise, caixaPromise]).then(() => {
            setIsUpdating(false);
        });
    }


    const API_URL = process.env.NEXT_PUBLIC_API_URL;
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
    const [meetingsLoaded, setMeetingsLoaded] = useState(false);
    const [meetings, setMeetings] = useState([]);
    const loadMeetings = () => {
        setMeetingsLoaded(false);
        const params = {
            token: privateData.SERVER_TOKEN.value,
            userName: privateData[`PRIME_USER`].value,
            password: privateData[`PRIME_PSWD`].value,
        };
        const popup = toast.loading(`Loading meetings...`, toastOptions);
        const meetingsPromise = axios.get(`${API_URL}/cv-prime/meetings`, {params})
        .then((response) => {
            setMeetings(response.data);
            setMeetingsLoaded(true);
            toast.dismiss(popup);
        })
        .catch(err => {
            console.error(err);
            toast.update(popup, { 
                ...toastOptions, 
                render: `Couldn't load meetings: ${err.response?.data ?? err.message}`, 
                type: "error", 
                isLoading: false,
            });
        });
        return meetingsPromise;
    }


    useEffect(()=>{
        setIsLoading(false);
        loadMeetings();
    },[]);


    return (
        <Context.Provider value={{
            toastOptions,
            isLoading, isUpdating,
            privateData, setPrivateData,
            runtime, setRuntime, bot,
            bankAssets, setBankAssets,
            meetings, loadMeetings, meetingsLoaded
        }}>
            {children}
        </Context.Provider>
    )
}