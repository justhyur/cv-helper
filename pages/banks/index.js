import Head from 'next/head';
import {useState, useEffect, useContext} from 'react';
import { Context } from '/lib/Context';
import Link from 'next/link';
import moment from 'moment';
import Image from 'next/image';

export default function Banks() {

  const [isMounted, setIsMounted] = useState(false);

  const {
    banksCredentials, loadBanksData,
    isLoading, banksLoading,
    banksData, activeCurrencies,
    preferredCurrency, convert,
  } = useContext(Context);

  const banksDisabled = () => {
    return !banksCredentials.bcn.enabled && !banksCredentials.caixa.enabled;
  }

  const enabledBanks = () => {
    const banks = [];
    if(banksCredentials.bcn.enabled){
      banks.push('bcn');
    }
    if(banksCredentials.caixa.enabled){
      banks.push('caixa');
    }
    return banks;
  }

  useEffect(()=>{
    setIsMounted(true);
    Object.keys(banksData).forEach(bankName => {
      const secondsAfterLastUpdate = (Date.now() - banksData[bankName].date) / 1000;
      if( !banksLoading[bankName] && (!banksData[bankName].date || secondsAfterLastUpdate > (60 * 5)) ){
        loadBanksData([bankName]);
      }
    });
  },[]);

  const [totalAssets, setTotalAssets] = useState({});
  useEffect(()=>{
    let sum = 0;
    Object.values(banksData).forEach( data => {
      if(!data.available){return}
      const {currency, value} = data.available;
      sum += convert(value, currency, preferredCurrency);
    });
    setTotalAssets(sum);
  },[banksData])

  return (
    <div className="my-container">
      <Head>
        <title>CV Helper - Online banking</title>
        <meta name="description" content="Created by Hyur" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="main">
        <div className="sub-header">
          <h2>Online banking</h2>
          {!isLoading && isMounted && !banksDisabled() && <div className="text-center">Click to bank asset for more details.</div>}
        </div>
        {!isLoading && isMounted && <>
          {banksDisabled() ?
            <div>
              <h3 style={{textAlign: "center"}}>Enable at least one bank in your settings.</h3>
              <div className="buttons">
                <Link className="button grey" href="/banks/settings">Settings</Link>
              </div>
            </div>
          :<>
            <div className="buttons">
              <button 
                disabled={banksLoading.bcn && banksLoading.caixa}
                className={`button yellow`} 
                onClick={()=>{loadBanksData(['bcn', 'caixa'])}}
                >Refresh All
              </button>
              <Link className="button grey" href="/banks/settings">Settings</Link>
            </div>
            <div className="bank-assets">
              {Object.keys(banksData).map( (key, i) => (
                  <div className={`bank-asset ${key}`} key={`${key}${i}`}>
                    {((key === 'total' && enabledBanks().length > 1) || banksCredentials[key]?.enabled) &&
                      <Link className={`bank-link ${key}`} href={`/banks/${key}`}>
                        <div className="date">
                          {banksData[key].date ? moment(banksData[key].date).format("DD/MM/YYYY HH:mm") : '...'}
                        </div>
                        <h2>{key.toUpperCase()}</h2>
                        <div className="ordered-assets">
                          {activeCurrencies.map(code => (
                            <div key={code} className={`asset ${code === preferredCurrency? 'primary' : 'secondary'}`}>{banksData[key].available ? convert(banksData[key].available.value, banksData[key].available.currency, code, true).substring(1) : '...'}</div>
                          ))}
                        </div>
                      </Link>  
                    }
                  </div>
              ))}
            </div>
          </>}
        </>}
      </main>
    </div>
  )
}
