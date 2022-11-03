import Head from 'next/head';
import {useState, useEffect, useContext} from 'react';
import { Context } from '../lib/Context';
import Link from 'next/link';
import moment from "moment";

export default function Banks() {

  const [isMounted, setIsMounted] = useState(false);

  const {
    loadBanksData,
    isLoading, banksLoading, lastBanksUpdate,
    bankAssets
  } = useContext(Context);

  useEffect(()=>{
    setIsMounted(true);
    const secondsAfterLastUpdate = (Date.now() - lastBanksUpdate) / 1000;
    if(secondsAfterLastUpdate > (60 * 5)){
      loadBanksData();
    }
  },[]);

  const formatAssetValue = (value) => {
    const stringValue = value.toString();
    const decimals =  stringValue.split('.')[1];
    const integers =  stringValue.split('.')[0];
    let newString = '';
    for(let i=0; i<integers.length; i++){
      const check = integers.length - 1 - i;
      newString = integers[check] + newString;
      if( (i+1)%3 === 0 && integers[check - 1] ){
        newString = ',' + newString;
      }
    }
    // return integers;
    return `${newString}${decimals ? '.'+decimals : ''}`;
  }

  const sumAssets = (assets) => {
    let sum = 0;
    Object.entries(assets).forEach( ([name, asset]) => {
        sum += asset.value
    })
    return sum;
  }

  const cveToEur = (cve) => {
    return Math.round(cve / 110 * 100) / 100;
  }

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
          {isMounted && <div className="text-center"><b>Last update:</b> {moment(lastBanksUpdate).format("DD/MM/YYYY HH:mm")}</div>}
        </div>
        {!isLoading && <>
          <div className="buttons">
            <button 
              disabled={banksLoading}
              className={`button yellow`} 
              onClick={loadBanksData}
              >Refresh
            </button>
            <Link className="button grey" href="/private-data?last=banks">Manage private data</Link>
          </div>
          <div className="bank-assets">
            <div className="bank-asset total">
                <h3 className="name">TOTAL ASSETS</h3>
                <div className="asset">{formatAssetValue(sumAssets(bankAssets))} CVE</div>
                <div className="asset"><i>{formatAssetValue(cveToEur(sumAssets(bankAssets)))} EUR</i></div>
            </div>
          </div>
          <div className="bank-assets">
            {Object.entries(bankAssets).map( ([name, asset]) => (
              <div className="bank-asset" key={`asset_${name}`}>
                <h3 className="name">{name.toUpperCase()}</h3>
                <div className="asset">{formatAssetValue(asset.value)} {asset.currency}</div>
                <div className="asset"><i>{formatAssetValue(cveToEur(asset.value))} EUR</i></div>
              </div>
            ))}
          </div>
        </>}
      </main>
    </div>
  )
}
