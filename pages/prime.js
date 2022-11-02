import Head from 'next/head';
import {useState, useEffect, useContext} from 'react';
import { Context } from '../lib/Context';
import Link from 'next/link';
import axios from "axios";
import {FaRegCheckCircle, FaInfoCircle, FaTimesCircle} from 'react-icons/fa';
import moment from 'moment';

export default function Banks() {

  const {
    meetings, loadMeetings, meetingsLoaded
  } = useContext(Context);

  useEffect(()=>{
    console.log(meetings)
  },[meetings]);

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
        </div>
          <div className="buttons">
            <button className="button">New Meeting</button>
            <button className="button yellow" disabled={!meetingsLoaded} onClick={loadMeetings}>Refresh</button>
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
              {meetings.map( (m, i) => {
                const startTime = moment(`${m.date}T${m.time.split(' - ')[0]}:00`);
                if( parseInt(startTime.format('HH')) < 6 ){
                  startTime.add(12, 'hours');
                }
                const duration = m.duration.split(' min')[0];
                const endTime = moment(startTime).add(duration, 'minutes');
                const today = moment(new Date());
                const isToday = today.format('DD/MM/YYYY') === startTime.format('DD/MM/YYYY');
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
              })}
            </div>
          :
            <h2>No meetings found</h2>
          }
      </main>
    </div>
  )
}
