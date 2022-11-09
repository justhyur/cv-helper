import Head from 'next/head';
import {useState, useEffect, useContext} from 'react';
import { Context } from '/lib/Context';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import moment from 'moment';

export default function Bank() {

  const [isMounted, setIsMounted] = useState(false);
  
  const {
    banksCredentials, loadBanksData,
    isLoading, banksLoading, convert, format,
    banksData, activeCurrencies, preferredCurrency
  } = useContext(Context);

  const bankIds = Object.keys(banksCredentials);

  const router = useRouter();
  const [id, setId] = useState(null);
  useEffect(()=>{
    if(router.isReady){
      const thisId = router.query.id;
      if(bankIds.includes(thisId) || thisId === 'total'){
        setId(thisId)
      }else{
        router.push('/banks');
      }
    }
  },[router.isReady])

  useEffect(()=>{
    if(id){
      if(!banksCredentials[id]?.enabled && id !== 'total'){
        router.push('/banks');
        return;
      }
      setIsMounted(true);
      if(id === 'total'){
        Object.keys(banksData).forEach(bankName => {
          if(bankName !== 'total'){
            const secondsAfterLastUpdate = (Date.now() - banksData[bankName].date) / 1000;
            if( !banksLoading[bankName] && (!banksData[bankName].date || secondsAfterLastUpdate > (60 * 5)) ){
              loadBanksData([bankName]);
            }
          }
        });
      }else{
        const secondsAfterLastUpdate = (Date.now() - banksData[id].date) / 1000;
        if( !banksLoading[id] && (!banksData[id].date || secondsAfterLastUpdate > (60 * 5)) ){
          loadBanksData([id]);
        }
      }
    }
  },[id]);

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

  if(id) return (
    <div className="my-container">
      <Head>
        <title>CV Helper - {id.toUpperCase()} Online banking</title>
        <meta name="description" content="Created by Hyur" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="main">
        <div className="sub-header">
          <h2 className={id}>{id.toUpperCase()} <Link className={`main-link`} href="/banks"><b>Online banking</b></Link></h2>
          {!isLoading && isMounted && banksData[id].date && <div className="text-center"><b>Last update:</b> {moment(banksData[id].date).format("DD/MM/YYYY HH:mm")}</div>}
        </div>
        {!isLoading && isMounted && <>
            <div className="buttons">
              <button 
                disabled={id === 'total'? (banksLoading.bcn && banksLoading.caixa) : banksLoading[id]}
                className={`button yellow`} 
                onClick={()=>{loadBanksData(id === 'total' ? ['bcn', 'caixa'] : [id])}}
                >Refresh {id === 'total' && 'All'}
              </button>
              <Link className="button grey" href={`/banks/settings`}>Settings</Link>
            </div>
            {!banksData[id] || !banksData[id].date?
              <h2>Loading data...</h2> 
            :
              <div className={`bank-data ${id}`}>
                {id !== 'total' && 
                <section>
                  <h3>Account number</h3>
                  <b className="content">{banksData[id].accountNumber}</b>
                </section>
                }
                {(banksData[id].accounting || banksData[id].available) &&
                  <section>
                    <h3>Account Balances</h3>
                    <main>
                      {banksData[id].accounting &&
                        <section>
                          <h4>Accounting</h4>
                          <div className="ordered-assets">
                            {activeCurrencies.map(code => (
                              <div key={code} className={`asset ${code === preferredCurrency? 'primary' : 'secondary'}`}>{banksData[id].accounting ? convert(banksData[id].accounting.value, banksData[id].accounting.currency, code, true).substring(1) : '...'}</div>
                            ))}
                          </div>
                        </section>
                      }
                      {banksData[id].available && 
                        <section>
                          <h4>Available</h4>
                          <div className="ordered-assets">
                            {activeCurrencies.map(code => (
                              <div key={code} className={`asset ${code === preferredCurrency? 'primary' : 'secondary'}`}>{banksData[id].available ? convert(banksData[id].available.value, banksData[id].available.currency, code, true).substring(1) : '...'}</div>
                            ))}
                          </div>
                        </section>
                      }
                    </main>
                  </section>
                }
                {banksData[id].movements &&
                  <section>
                    <h3>Movements</h3>
                    {banksData[id].movements.length === 0 ?
                      <div className="content">No movements</div>
                    :
                      <div className="movements">
                        <div className={`tr row-${id} head`}>
                          {Object.keys(banksData[id].movements[0]).map( (key, i) => {
                            return (
                              <div className={`th col${i}`} key={`${key}${i}`}>{key}</div>
                            )})}
                        </div>
                        {banksData[id].movements.map( (m, i) => {
                          const today = moment(Date.now()).format('DD/MM/YYYY');
                          return (
                            <div className={`tr row-${id} ${m.date === today? 'today' : ''}`} key={`movement${i}`}>
                              <div className={`td col0`}>{m.date}</div>
                              <div className={`td col1`}>{m.description}</div>
                              <div className={`td col2 ${m.amount?.value > 0? 'pos' : 'neg'}`}>
                                {m.amount &&
                                  <div className="ordered-assets">
                                    {activeCurrencies.map(code => (
                                      <div key={code} className={`asset ${code === preferredCurrency? 'primary' : 'secondary'}`}>{convert(m.amount.value, m.amount.currency, code, true)}</div>
                                      ))}
                                  </div>
                                }
                              </div>
                              {id === 'total' && <Link href={`/banks/${m.origin}`} onClick={()=>{setId(m.origin)}} className={`td col3 ${m.origin}`}>{m.origin.toUpperCase()}</Link>}
                            </div>
                        )})}
                      </div>
                    }
                  </section>
                }
              </div>
            }
        </>}
      </main>
    </div>
  )
}
