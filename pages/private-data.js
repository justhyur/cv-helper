import Head from 'next/head';
import {useState, useEffect, useContext} from 'react';
import { Context } from '../lib/Context';
import { ToastContainer, toast } from 'react-toastify';
import { useRouter } from "next/router";
import Link from 'next/link';
import Toggle from 'react-toggle'
import "react-toggle/style.css" // for ES6 modules

export default function PrivateData() {

  const [isMounted, setIsMounted] = useState(false);
  useEffect(()=>{
    setIsMounted(true);
  },[]);

  const {
    isLoading, toastOptions,
    privateData, setPrivateData
  } = useContext(Context);

  const { query } = useRouter();

  const [localData, setLocalData] = useState([]);
  useEffect(()=>{
    setLocalData(JSON.parse(JSON.stringify(privateData)));
  },[privateData]);

  const capitalize = (word) => {
    return word.charAt(0).toUpperCase()+word.substr(1);
  }

  return (
    <div className="container">
      <Head>
        <title>CV Helper - Private data manager</title>
        <meta name="description" content="Created by Hyur" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="main">
        <div className="sub-header">
          <h2>Private data manager</h2>
        </div>
        <div className="private-datas">
          {!isLoading && isMounted && localData.length > 0 && <>
            {localData.map( (data, d) => (
              <div className="private-data-group" key={`data_${d}`}>
                <label className="enabler">
                  <span className="title">Enable {data.name.toUpperCase()} {data.type === 'bank' && '(Bank)'}</span>
                  <Toggle
                    checked={data.enabled}
                    onChange={(e)=>{
                      setPrivateData(curr => {
                        const newData = [...curr];
                        newData[d].enabled = e.target.checked;
                        return newData;
                      });
                    }}
                  />
                </label>
                {data.enabled &&
                  <div className="private-data">
                    <h2>{data.name.toUpperCase()}</h2>
                    {data.form.map((section, s) => (
                      <section key={`section${d}${s}`}>
                        <h3>{capitalize(section.name)}</h3>
                        <div className="input">
                          <input type={section.type} placeholder={`Insert ${section.name}...`} value={section.value} onChange={(e)=>{
                            setLocalData(curr => {
                              const newData = [...curr];
                              newData[d].form[s].value = e.target.value;
                              return newData;
                            });
                          }}/>
                          <button className="button yellow" onClick={()=>{
                            setPrivateData(curr => {
                              const newData = [...curr];
                              newData[d].form[s].value = localData[d].form[s].value;
                              return newData;
                            });
                            toast.success(`${data.name.toUpperCase()}'s ${section.name} was updated.`, toastOptions)
                          }}>Save</button>
                        </div>
                      </section>
                    ))}
                  </div>
                }
              </div>
            ))}
          </>}
        </div>
        <div className="buttons">
          <button className="button green" onClick={()=>{
              setPrivateData(localData);
              toast.success(`All Private Data was updated.`, toastOptions);
            }}>Save All</button>
          <Link className="button" href={`/${query.last ?? ''}`}>Go back</Link>
        </div>
      </main>

    </div>
  )
}
