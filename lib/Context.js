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
        theme: "light",
    };

    const [privateData, setPrivateData] = useLocalStorage('privateData', {
        BCN_USER: {
            type: 'text',
            value: '',
        },
        BCN_PSWD: {
            type: 'password',
            value: '',
        },
        CAIXA_USER: {
            type: 'text',
            value: '',
        },
        CAIXA_PSWD: {
            type: 'password',
            value: '',
        },
        SERVER_TOKEN: {
            type: 'text',
            value: '',
        },
    });

    const [bankAssets, setBankAssets] = useLocalStorage('bankAssets', {
        bcn: 'Loading data...',
        caixa: 'Loading data...'
    });

    //BOT
    const [runtime, setRuntime] = useLocalStorage('runtime', true);
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
        const promises = [];
        promises.push(loadBankData('bcn'));
        promises.push(loadBankData('caixa'));
        Promise.all(promises).then(() => {
            setIsUpdating(false);
        });
    }


    const baseURL = "http://localhost:8080";
    // const baseURL = "https://hyur-server.herokuapp.com";
    const loadBankData = (bankName) => {
        const params = {
            token: privateData.SERVER_TOKEN.value,
            userName: privateData[`${bankName.toUpperCase()}_USER`].value,
            password: privateData[`${bankName.toUpperCase()}_PSWD`].value,
        };
        console.log(`Loading ${bankName.toUpperCase()}...`);
        return axios.get(`${baseURL}/cv-assets/${bankName}`, {params})
        .then((response) => {
            setBankAssets(curr => {
                console.log({curr});
                return {...curr, [bankName]: response.data};
            });
            console.log(`${bankName.toUpperCase()} loaded.`);
            toast.success(`${bankName.toUpperCase()} updated.`);
        })
        .catch(err => {
            console.error(err);
            toast.error(`Error updating ${bankName.toUpperCase()}`);
        });
    }
        
    useEffect(()=>{
        setIsLoading(false);
    },[]);

    useEffect(()=>{
        console.log(bankAssets)
    },[bankAssets])

    return (
        <Context.Provider value={{
            toastOptions,
            isLoading, isUpdating,
            privateData, setPrivateData,
            runtime, setRuntime, bot,
            bankAssets, setBankAssets
        }}>
            {children}
        </Context.Provider>
    )
}