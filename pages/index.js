import Head from 'next/head';
import {useState, useEffect, useContext} from 'react';
import { Context } from '../lib/Context';
import { ToastContainer, toast } from 'react-toastify';
import Link from 'next/link';
import axios from "axios";

export default function Home() {

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
    runtime, setRuntime, bot,
    bankAssets
  } = useContext(Context);

  return (
    <div className="container">
      <Head>
        <title>CV Helper</title>
        <meta name="description" content="Created by Hyur" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="main">
        <h1 className="title">
          Hyur&apos;s <b>CV Helper</b>
        </h1>
        {!isLoading && <>
          <div className="buttons">
            <Link className="button" href="/private-data">Manage private data</Link>
            <button 
              className={`button ${runtime ? 'red' : 'green'}`} 
              onClick={()=>{setRuntime(curr=>!curr); bot();}}
              >{runtime ? 'Stop Runtime' : 'Start Runtime'}
            </button>
          </div>
          <div className="bank-assets">
            {Object.entries(bankAssets).map( ([name, asset]) => (
              <div className="bank-asset" key={`asset_${name}`}>
                <h3 className="name">{name.toUpperCase()}</h3>
                <div className="asset">{asset}</div>
              </div>
            ))}
          </div>
        </>}
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
