import Head from 'next/head';
import {useState, useEffect, useContext} from 'react';
import { Context } from '../lib/Context';
import { ToastContainer, toast } from 'react-toastify';
import Link from 'next/link';

export default function PrivateData() {

  const {
    isLoading, toastOptions,
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
                <div className="input">
                  <input type={data.type} placeholder={name} value={data.value} onChange={(e)=>{
                    setLocalData(curr => ({...curr,
                      [name]: {...data, value: e.target.value}
                    }));
                  }}/>
                  <button className="button yellow" onClick={()=>{
                    setPrivateData(curr => ({
                      ...curr,
                      [name]: localData[name]
                    }));
                    toast.success(`${name} was updated.`, toastOptions)
                  }}>Save</button>
                </div>
              </div>
            ))}
          </>}


        </div>
        <div className="buttons">
          <button className="button green" onClick={()=>{
              setPrivateData(localData);
              toast.success(`All Private Data was updated.`, toastOptions);
            }}>Save All</button>
          <Link className="button" href="/">Back to Dashboard</Link>
        </div>
      </main>

    </div>
  )
}
