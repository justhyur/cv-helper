import Head from 'next/head';
import {useState, useEffect, useContext} from 'react';
import { Context } from '../lib/Context';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Link from 'next/link';

export default function PrivateData() {

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

  const {
    isLoading,
    privateData, setPrivateData
  } = useContext(Context);

  const [localData, setLocalData] = useState(privateData);
  useEffect(()=>{
    setLocalData(privateData);
  },[privateData]);

  return (
    <div className="container">
      <Head>
        <title>CV Helper - Private Data</title>
        <meta name="description" content="Created by Hyur" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="main">
        <h1 className="title">
            Manage private data
        </h1>
        <div className="private-datas">
          {isLoading ?
            <div className="loader">Private data is loading...</div>
          :<>
            {Object.entries(localData).map( ([name, data]) => (
              <div className="private-data" key={`privateData_${name}`}>
                <h3>{name}</h3>
                <input type={data.type} placeholder={name} value={data.value} onChange={(e)=>{
                  setLocalData(curr => ({...curr,
                    [name]: {...data, value: e.target.value}
                  }));
                }}/>
                <button onClick={()=>{
                  setPrivateData(curr => ({
                    ...curr,
                    [name]: localData[name]
                  }));
                  toast.success(`${name} was updated.`, toastOptions)
                }}>Save</button>
              </div>
            ))}
          </>}

          <button onClick={()=>{
              setPrivateData(localData);
              toast.success(`All Private Data was updated.`, toastOptions);
            }}>Save All</button>

        </div>
        <Link className="button" href="/">Back to Dashboard</Link>
      </main>

      <ToastContainer
        position="top-right"
        autoClose={2500}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

    </div>
  )
}
