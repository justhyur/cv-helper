import Head from 'next/head';
import {useState, useEffect, useContext} from 'react';
import { Context } from '../lib/Context';
import Link from 'next/link';
import axios from "axios";
import {FaRegCheckCircle, FaInfoCircle, FaTimesCircle} from 'react-icons/fa';
import moment from 'moment';

export default function Banks() {

  const [isMounted, setIsMounted] = useState(false);

  const {
    isLoading,
    meetings, loadMeetings, meetingsLoading, lastMeetingUpdate,
    primeData,
  } = useContext(Context);

  const stateColor = (state) => {
    switch(state.toLowerCase()){
      case 'accepted':
        return 'green';
      case 'pending':
        return 'yellow';
      case 'declined':
        return 'red';
    }
  }

  const stateIcon = (state) => {
    switch(state.toLowerCase()){
      case 'accepted':
        return <FaRegCheckCircle/>;
      case 'pending':
        return <FaInfoCircle/>;
      case 'declined':
        return <FaTimesCircle/>;
    }
  }

  useEffect(()=>{
    setIsMounted(true);
    const secondsAfterLastUpdate = (Date.now() - lastMeetingUpdate) / 1000;
    if(primeData.enabled && secondsAfterLastUpdate > (60 * 5)){
      loadMeetings();
    }
  },[]);

  const dateAndTime = ({date, time}) => {
    const newDate = moment(`${date}T${time.split(' - ')[0]}:00`);
    if( parseInt(newDate.format('HH')) < 6 ){
      newDate.add(12, 'hours');
    }
    return newDate;
  }

  const dateAorB = (a, b) => {
    const dateA = dateAndTime(a);
    const dateB = dateAndTime(b);
    return dateA < dateB;
  }

  return (
    <div className="container">
      <Head>
        <title>CV Helper - Prime meetings</title>
        <meta name="description" content="Created by Hyur" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="main">
        <div className="sub-header">
          <h2>Prime meetings</h2>
          {!isLoading && isMounted && primeData.enabled && <div className="text-center"><b>Last update:</b> {moment(lastMeetingUpdate).format("DD/MM/YYYY HH:mm")}</div>}
        </div>
        {!isLoading && isMounted && <>
          {!primeData.enabled ?
            <div>
              <h3 style={{textAlign: "center"}}>Enable Prime in your private data manager.</h3>
              <div className="buttons">
                <Link className="button grey" href="/private-data?last=prime">Manage private data</Link>
              </div>
            </div>
          :<>
            <div className="buttons">
              <button className="button">New Meeting</button>
              <button className="button yellow" disabled={meetingsLoading} onClick={loadMeetings}>Refresh</button>
              <Link className="button grey" href="/private-data?last=prime">Manage private data</Link>
            </div>
            {meetings.length > 0 ?
              <div className="meetings">
                <div className='tr'>
                  <div className="th">Branch</div>
                  <div className="th">Date</div>
                  <div className="th">Time</div>
                  <div className="th">Duration</div>
                  <div className="th">State</div>
                </div>
                {meetings.sort((a,b)=>( dateAorB(a, b)? -1 : 1)).map( (m, i) => {
                  const startTime = dateAndTime(m);
                  const endTime = moment(startTime).add(m.duration.split(' min')[0], 'minutes');
                  const today = moment(new Date());
                  const yesterday = moment(new Date()).add(-1, 'days');
                  const isToday = today.format('DD/MM/YYYY') === startTime.format('DD/MM/YYYY');
                  if(endTime > yesterday){
                    return(
                      <div className={`tr ${isToday? 'today' : ''}`} key={`meeting${i}`}>
                        <div className="td branch">{m.branch}</div>
                        <div className="td">{moment(m.date).format('DD/MM/YYYY')}</div>
                        <div className="td">{startTime.format('HH:mm')} - {endTime.format('HH:mm')}</div>
                        <div className="td">{m.duration}</div>
                        <div className={`td state ${stateColor(m.state)}`}>
                          {stateIcon(m.state)}
                          {m.state}
                        </div>
                      </div>
                    )
                  }
                })}
              </div>
            :
              <h2>No meetings found</h2>
            }
          </>}
        </>}
      </main>
    </div>
  )
}
