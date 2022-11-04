import Head from 'next/head';
import {useState, useEffect, useContext} from 'react';
import { Context } from '../lib/Context';
import Link from 'next/link';
import moment from "moment";

export default function Banks() {

  const [isMounted, setIsMounted] = useState(false);

  const {
    banksData, loadBanksData,
    isLoading, banksLoading, lastBanksUpdate,
    bankAssets
  } = useContext(Context);

  const banksDisabled = () => {
    return !banksData.bcn.enabled && !banksData.caixa.enabled;
  }

  const enabledBanks = () => {
    const banks = [];
    if(banksData.bcn.enabled){
      banks.push('bcn');
    }
    if(banksData.caixa.enabled){
      banks.push('caixa');
    }
    return banks;
  }

  useEffect(()=>{
    setIsMounted(true);
    const secondsAfterLastUpdate = (Date.now() - lastBanksUpdate) / 1000;
    if(enabledBanks().length > 0 && secondsAfterLastUpdate > (60 * 5)){
      loadBanksData(['bcn', 'caixa']);
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
        sum += Number(asset.value)
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
          {!isLoading && isMounted && !banksDisabled() && <div className="text-center"><b>Last update:</b> {moment(lastBanksUpdate).format("DD/MM/YYYY HH:mm")}</div>}
        </div>
        {!isLoading && isMounted && <>
          {banksDisabled() ?
            <div>
              <h3 style={{textAlign: "center"}}>Enable at least one bank in your private data manager.</h3>
              <div className="buttons">
                <Link className="button grey" href="/private-data?last=banks">Manage private data</Link>
              </div>
            </div>
          :<>
            <div className="buttons">
              <button 
                disabled={banksLoading}
                className={`button yellow`} 
                onClick={()=>{loadBanksData(['bcn', 'caixa'])}}
                >Refresh All
              </button>
              <Link className="button grey" href="/private-data?last=banks">Manage private data</Link>
            </div>
            {enabledBanks().length > 1 &&
              <div className="bank-assets">
                <div className="bank-asset total">
                    <h3 className="name">TOTAL ASSETS</h3>
                    <div className="asset">{formatAssetValue(sumAssets(bankAssets))} CVE</div>
                    <div className="asset"><i>{formatAssetValue(cveToEur(sumAssets(bankAssets)))} EUR</i></div>
                </div>
              </div>
            }
            <div className="bank-assets">
              {Object.entries(bankAssets).map( ([name, asset]) => {
                if(enabledBanks().includes(name))
                return(
                  <div className="bank-asset" key={`asset_${name}`}>
                    <button 
                      disabled={banksLoading}
                      className={`button yellow`} 
                      onClick={()=>{loadBanksData([name])}}
                      >Refresh
                    </button>
                    <h3 className="name">{name.toUpperCase()} Assets</h3>
                    <div className="asset">{formatAssetValue(asset.value)} {asset.currency}</div>
                    <div className="asset"><i>{formatAssetValue(cveToEur(asset.value))} EUR</i></div>
                  </div>
              )})}
            </div>
          </>}
        </>}
      </main>
    </div>
  )
}
