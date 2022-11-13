import Head from 'next/head';
import {useState, useEffect, useContext} from 'react';
import { Context } from '/lib/Context';
import { ToastContainer, toast } from 'react-toastify';
import moment from 'moment';
import Link from 'next/link';
import Toggle from 'react-toggle'
import "react-toggle/style.css" // for ES6 modules

export default function Settings({type, settings, setSettings}) {

  const [isMounted, setIsMounted] = useState(false);
  useEffect(()=>{
    setIsMounted(true);
  },[]);

  const {
    isLoading, toastOptions,
    lastRatesUpdate, rates,
    updateRates, updatingRates
  } = useContext(Context);

  const Type = type.charAt(0).toUpperCase()+type.substring(1);

  const [localSettings, setLocalSettings] = useState([]);
  useEffect(()=>{
    setLocalSettings(JSON.parse(JSON.stringify(settings)));
  },[settings]);

  const capitalize = (word) => {
    return word.charAt(0).toUpperCase()+word.substr(1);
  }

  return (
    <div className="my-container">
      <Head>
        <title>CV Helper - {JSON.stringify(Type).replaceAll('"','')} Settings</title>
        <meta name="description" content="Created by Hyur" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="main">
        <div className="sub-header">
          <h2>{Type} Settings</h2>
        </div>
        <div className="settings">
          {!isLoading && isMounted && localSettings.length > 0 && <>
            {localSettings.map( (data, index) => (
                <div key={`setting${index}`} className="setting">
                    {data.enabled !== undefined &&
                        <label className="enabler">
                            <span className="title">{data.action ?? 'enable'} {data.name.toUpperCase()}</span>
                            <Toggle
                            checked={data.enabled}
                            onChange={(e)=>{
                                setSettings(curr => {
                                    const newData = [...curr];
                                    newData[index].enabled = e.target.checked;
                                    return newData;
                                });
                            }}
                            />
                        </label>
                    }
                    {data.form && data.enabled &&
                        <div className="form">
                        <h2>{data.name.toUpperCase()}</h2>
                        {data.form.map((section, s) => (
                            <section key={`section${index}${s}`}>
                            <h3>{capitalize(section.name)}</h3>
                            <div className="input">
                                <input type={section.type} placeholder={`Insert ${section.name}...`} value={section.value} onChange={(e)=>{
                                    setLocalSettings(curr => {
                                        const newData = [...curr];
                                        newData[index].form[s].value = e.target.value;
                                        return newData;
                                    });
                                }}/>
                                <button className="button yellow" onClick={()=>{
                                setSettings(curr => {
                                    const newData = [...curr];
                                    newData[index].form[s].value = localSettings[index].form[s].value;
                                    return newData;
                                });
                                toast.success(`${data.name.toUpperCase()}'s ${section.name} was updated.`, toastOptions)
                                }}>Save</button>
                            </div>
                            </section>
                        ))}
                        </div>
                    }
                    {data.type === 'select' &&
                        <label className="selector">
                            <span className="title">{data.name}</span>
                            <select value={data.value} onChange={(e)=>{
                                setSettings(curr => {
                                    const newData = [...curr];
                                    newData[index].value = e.target.value;
                                    return newData;
                                });
                            }}>
                            {data.options.map( (option, i) => (
                                <option key={`${data.name}option${i}`} value={option}>{option}</option>
                            ))}
                            </select>
                        </label>
                    }
                </div>
            ))}
          </>}
        </div>
        <div className="currency-rates">
          <h3>Currency Rates</h3>
          {type === 'banks' && rates && <>
              <div className="convertion-rates">
                {Object.entries(rates).map(([text, value])=>(value > 1 && 
                  <div key={text} className="rate">
                    <span className="text">{text.substring(0, 3)}/{text.substring(3, 6)}</span> {Math.round(value*10000)/10000}
                  </div>
                ))}
              </div>
              {lastRatesUpdate ? <div className="last-update"><strong>Last update</strong> {moment(lastRatesUpdate).format("DD/MM/YYYY HH:mm")}</div> : ''}
          </>}
          <div className="buttons">
              <button disabled={updatingRates} className="button" style={{fontSize: ".75em", maxWidth: "150px"}} onClick={updateRates}>Update Rates</button>
          </div>
      </div>
        <div className="buttons">
          <button className="button green" onClick={()=>{
              setSettings(localSettings);
              toast.success(`${Type} settings were successfully updated.`, toastOptions);
            }}>Save All</button>
          <Link className="button" href={`/${type}`}>Go back</Link>
        </div>
      </main>

    </div>
  )
}
