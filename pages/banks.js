import Head from 'next/head';
import {useState, useEffect, useContext} from 'react';
import { Context } from '../lib/Context';
import Link from 'next/link';
import axios from "axios";

export default function Banks() {

  const {
    toastOptions,
    isLoading, isUpdating,
    runtime, setRuntime, bot,
    bankAssets
  } = useContext(Context);

  return (
    <div className="container">
      <Head>
        <title>CV Helper - Online banking</title>
        <meta name="description" content="Created by Hyur" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="main">
        <div className="sub-header">
          <h2>Online banking</h2>
        </div>
        {!isLoading && <>
          <div className="buttons">
            <button 
              disabled={isUpdating}
              className={`button`} 
              onClick={()=>{bot();}}
              >Update
            </button>
            <button 
              className={`button ${runtime ? 'red' : 'green'}`} 
              onClick={()=>{setRuntime(curr=>!curr);}}
              >{runtime ? 'Stop Autoupdate' : 'Start Autoupdate'}
            </button>
            <Link className="button yellow" href="/private-data?last=banks">Manage private data</Link>
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
    </div>
  )
}
