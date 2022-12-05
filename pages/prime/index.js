import Head from 'next/head';
import {useState, useEffect, useContext} from 'react';
import { Context } from '/lib/Context';
import Link from 'next/link';
import {FaRegCheckCircle, FaInfoCircle, FaTimesCircle} from 'react-icons/fa';
import moment from 'moment';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Input, Label } from 'reactstrap';
import TimePicker from '/lib/react-time-picker';
import DatePicker from '/lib/react-date-picker';
import { toast } from 'react-toastify';

export default function Prime() {

  const [isMounted, setIsMounted] = useState(false);

  const {
    isLoading,
    meetings, loadMeetings, meetingsLoading, lastMeetingUpdate,
    primeSettings, branchCodes, bookMeetings, acceptBookings, isBooking, toastOptions,
    primeLogs, setPrimeLogs
  } = useContext(Context);

  const primeData = primeSettings.filter(a=>a.name.toLowerCase()==='prime')[0];
  const userName = primeData.form.filter(i => i.name === 'username')[0].value;
  const password = primeData.form.filter(i => i.name === 'password')[0].value;
  const declinedActive = primeSettings.filter(a=>a.name.toLowerCase()==='declined')[0].enabled;
  const pendingActive = primeSettings.filter(a=>a.name.toLowerCase()==='pending')[0].enabled;

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
      loadMeetings(userName, password);
    }
    fixPickedTime();
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

  const [modalOpen, setModalOpen] = useState(false);
  const toggleModal = () => {setModalOpen(curr=>!curr)}

  const today = new Date();
  const getMinDate = () => {
    const timeStamp = today.getTime();
    const hours = parseInt(moment(timeStamp).format("HH"));
    const minutes = parseInt(moment(timeStamp).format("mm"));
    const tomorrow = moment(timeStamp).add(1, "days");
    return hours > 20 || (hours === 20 && minutes > 0) ? moment(`${tomorrow.format("DD/MM/YYYY")} 07:00`, "DD/MM/YYYY HH:mm").toDate() : today; 
  }

  const [bookForm, setBookForm] = useState({
    branchCode: branchCodes[0].value,
    timeStamp: getMinDate().getTime(),
    numDays: "1",
    numMinutes: "00:15",
    acceptBookings: false,
    skipWeekends: true,
  });
  
  const changeFormValue = (key, value) => {
    setBookForm(curr=>({...curr, [key]: value}));
  }

  const [pickedDate, setPickedDate] = useState(getMinDate());
  const [pickedTime, setPickedTime] = useState(moment(getMinDate()).format("HH:mm"));
  useEffect(()=>{
    const dateString = `${moment(pickedDate.getTime()).format("DD/MM/YYYY")} ${pickedTime}`;
    const timeStamp = moment(dateString, "DD/MM/YYYY HH:mm").toDate().getTime();
    changeFormValue('timeStamp', timeStamp);
  },[pickedDate, pickedTime]);
  const roundTime = () => {
    setPickedTime(curr=>{
      const hour = parseInt(curr.split(':')[0]);
      const minutes = parseInt(curr.split(':')[1]);
      if(minutes % 15 !== 0 || hour < 7 || hour > 19 || (hour === 19 && minutes > 45) ){
        let newHour, newMinutes;
        if(hour < 7){
          newHour = 7;
          newMinutes = '00';
        }else if( (hour === 19 && minutes > 45) || hour > 19){
          newHour = 19;
          newMinutes = 45;
        }else{
          newMinutes = minutes + 15 - minutes % 15;
          newHour = newMinutes === 60? hour + 1 : hour;
        }
        const newTime = `${newHour}:${newMinutes === 60? '00' : newMinutes}`;
        return newTime;
      }
      return curr;
    });
  }
  const fixPickedTime = () => {
    roundTime();
    const pickedDateFormatted = moment(pickedDate.getTime()).format("DD/MM/YYYY");
    const now = moment(Date.now());
    const isToday = pickedDateFormatted === now.format("DD/MM/YYYY");
    const dateString = `${pickedDateFormatted} ${pickedTime}`;
    if(isToday && moment(dateString, "DD/MM/YYYY HH:mm").unix() < now.unix()){
      setPickedTime(now.format("HH:mm"));
      roundTime();
    }
    fixMeetingDuration();
  }
  
  const fixMeetingDuration = () => {
    let hours = parseInt(bookForm.numMinutes.split(':')[0]);
    let minutes = parseInt(bookForm.numMinutes.split(':')[1]);
    const availableMinutes = moment("20:00", "HH:mm").diff(moment(pickedTime, "HH:mm"), "minutes");
    const totalMinutes = (hours * 60) + minutes;
    if(totalMinutes > availableMinutes){
      hours = Math.floor(availableMinutes/60);
      minutes = ( (availableMinutes/60) - hours) * 60;
    }
    if(hours < 0){hours = 0}
    const lessThan15 = hours === 0 && minutes < 15;
    if(lessThan15 || minutes % 15 !== 0){
      minutes = lessThan15 ? 15 : minutes + 15 - (minutes % 15);
    }
    const newTime = `${minutes === 60? hours + 1 : hours}:${minutes === 60? '00' : minutes}`;
    changeFormValue('numMinutes', newTime);
  }

  const [isFormEditing, setIsFormEditing] = useState(false);
  const [chooseEndDate, setChooseEndDate] = useState(false);
  const [chooseEndTime, setChooseEndTime] = useState(false);

  const sumHours = (a, b, sign) => {
    a = a.split(":");
    b = b.split(":");
    const totMins = parseInt(a[0])*60 + parseInt(a[1]) + ((parseInt(b[0])*60 + parseInt(b[1])) * sign);
    const hours = Math.floor(totMins/60);
    const minutes = ( (totMins/60) - hours) * 60;
    return `${hours}:${minutes}`;
  }

  const [futureMeetings, setFutureMeetings] = useState([]);7
  useEffect(()=>{
    const fMeetings = [];
    meetings.sort((a,b)=>( dateAorB(a, b)? -1 : 1)).forEach( (m) => {
      const startTime = dateAndTime(m);
      const endTime = moment(startTime).add(m.duration.split(' min')[0], 'minutes');
      const today = moment(new Date());
      if(
        endTime >= today && 
        (declinedActive || (!declinedActive && m.state.toLowerCase()!=='declined') ) &&
        (pendingActive || (!pendingActive && m.state.toLowerCase()!=='pending') )
      ){
        fMeetings.push(m);
      }
    });
    setFutureMeetings(fMeetings);
  },[meetings]);

  return (<>
    {/* FORM MODAL */}
    <Modal centered scrollable fullscreen="sm"  isOpen={modalOpen} toggle={toggleModal} >
      <ModalHeader toggle={toggleModal}>Book meeting</ModalHeader>
      <ModalBody>
        <Form>
          <FormGroup>
            <Label for="branchCode">
              Branch
            </Label>
            <Input
              id="branchCode"
              type="select"
              value={bookForm.branchCode}
              onChange={(e)=>{changeFormValue('branchCode', e.target.value)}}
            >
              {branchCodes.map(({name, value})=>(
                <option key={name} value={value}>{name}</option>
              ))}
            </Input>
          </FormGroup>
          <FormGroup>
            <Label for="timeStamp">
              Start time (07:00 - 20:00)
            </Label>
            <div className="date-time form-control">
              <DatePicker 
                format={"dd/MM/y"}
                minDate={getMinDate()}
                value={pickedDate}
                onChange={(e)=>{setPickedDate(e); fixPickedTime();}}
                onCalendarOpen={()=>{setIsFormEditing(true)}}
                onCalendarClose={()=>{
                  fixPickedTime();
                  setIsFormEditing(false);
                }}
              />
              <TimePicker 
                format={"HH:mm"} 
                disableClock={true}
                minDate={'07:00'}
                value={pickedTime}
                onChange={(e)=>{setPickedTime(e)}}
                onClockOpen={()=>{setIsFormEditing(true)}}
                onClockClose={()=>{
                  fixPickedTime();
                  setIsFormEditing(false);
                }}
              />
            </div>
          </FormGroup>
          <FormGroup switch>
              <Label for="chooseEndTime">
                End time
              </Label>
              <Input
                id="chooseEndTime"
                type="switch"
                checked={chooseEndTime}
                onChange={()=>{setChooseEndTime(curr=>!curr)}}
              />
            </FormGroup>
          {chooseEndTime ?
            <FormGroup>
              <div className="date-time form-control">
                <TimePicker 
                  format={"HH:mm"} 
                  disableClock={true}
                  minDate={"00:15"}
                  value={sumHours(pickedTime, bookForm.numMinutes, 1)}
                  onChange={(e)=>{changeFormValue('numMinutes', sumHours(e, pickedTime, -1))}}
                  onClockOpen={()=>{setIsFormEditing(true)}}
                  onClockClose={()=>{
                    fixMeetingDuration();
                    setIsFormEditing(false);
                  }}
                />
              </div>
            </FormGroup>
          :
            <FormGroup>
              <Label for="timeStamp">
                Meeting duration
              </Label>
              <div className="date-time form-control">
                <TimePicker 
                  format={"HH:mm"} 
                  disableClock={true}
                  minDate={"00:15"}
                  value={bookForm.numMinutes}
                  onChange={(e)=>{changeFormValue('numMinutes', e)}}
                  onClockOpen={()=>{setIsFormEditing(true)}}
                  onClockClose={()=>{
                    fixMeetingDuration();
                    setIsFormEditing(false);
                  }}
                />
              </div>
            </FormGroup>
          }
          <FormGroup switch>
              <Label for="chooseEndDate">
                End date
              </Label>
              <Input
                id="chooseEndDate"
                type="switch"
                checked={chooseEndDate}
                onChange={()=>{setChooseEndDate(curr=>!curr)}}
              />
            </FormGroup>
          {chooseEndDate?
            <FormGroup>
              <div className="date-time form-control">
                <DatePicker 
                  format={"dd/MM/y"}
                  minDate={getMinDate()}
                  value={moment(pickedDate.getTime()).add(bookForm.numDays-1, "days").toDate()}
                  onChange={(e)=>{
                    const dateA = moment(moment(e.getTime()).format("DD/MM/YYYY"), "DD/MM/YYYY");
                    const dateB = moment(moment(pickedDate.getTime()).format("DD/MM/YYYY"), "DD/MM/YYYY");
                    const diff = dateA.diff(dateB, "days") + 1;
                    changeFormValue('numDays', diff.toString());
                  }}
                  onCalendarOpen={()=>{setIsFormEditing(true)}}
                  onCalendarClose={()=>{setIsFormEditing(false);}}
                />
              </div>
            </FormGroup>
          :
            <FormGroup>
              <Label for="numDays">
                Repeat for (days)
              </Label>
              <Input
                id="numDays"
                type="number"
                value={bookForm.numDays}
                min={1}
                onChange={(e)=>{changeFormValue('numDays', e.target.value)}}
                onFocus={()=>{setIsFormEditing(true);}}
                onBlur={()=>{
                  changeFormValue('numDays', bookForm.numDays < 1 ? 1 : bookForm.numDays);
                  setIsFormEditing(false);
                }}
              />
            </FormGroup>
          }
          {bookForm.numDays > 1 &&
            <FormGroup switch>
              <Label for="acceptBookings">
                Skip weekends (repeat)
              </Label>
              <Input
                id="acceptBookings"
                type="switch"
                checked={bookForm.skipWeekends}
                onChange={()=>{changeFormValue('skipWeekends', !bookForm.skipWeekends)}}
              />
            </FormGroup>
          }
          <FormGroup switch>
            <Label for="acceptBookings">
              Accept bookings automatically
            </Label>
            <Input
              id="acceptBookings"
              type="switch"
              checked={bookForm.acceptBookings}
              onChange={()=>{changeFormValue('acceptBookings', !bookForm.acceptBookings)}}
            />
          </FormGroup>
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button disabled={isBooking || isFormEditing} color="primary" onClick={()=>{
          const [numHours, numMinutes] = bookForm.numMinutes.split(":");
          bookMeetings(userName, password, {
            ...bookForm, 
            numMinutes: parseInt(numHours*60) + parseInt(numMinutes),
            skipWeekends: bookForm.numDays.toString() === '1'? false : bookForm.skipWeekends,
          }).then(toggleModal);
        }}>
          Book
        </Button>{' '}
        <Button color="secondary" onClick={toggleModal}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>

    {/* PRIME LOGS */}
    <Modal centered scrollable fullscreen="md" isOpen={primeLogs !== null} toggle={()=>{setPrimeLogs(null)}} >
      <ModalHeader toggle={()=>{setPrimeLogs(null)}}>Booking logs</ModalHeader>
      <ModalBody>
        <div className="logs">
          {primeLogs && primeLogs.map( (log, i) => (
            <div key={`log${i}`} className={`log ${log.booked ? 'booked' : 'error'}`}>
              <span className="time">{moment(log.date).format("DD/MM/YYYY | HH:mm - ")}</span><span className="message">
                {log.message}<br></br>
                {log.alreadyBookedSlots?.length > 0 && log.alreadyBookedSlots.map((slot, ss) => {
                  let thisOne = slot.split(' - ');
                  const thisTime = [moment(`01/01/2000 ${thisOne[0]}`, "DD/MM/YYYY HH:mm").toDate().getTime(), moment(`01/01/2000 ${thisOne[1]}`, "DD/MM/YYYY HH:mm").toDate().getTime()];
                  let prevOne = log.alreadyBookedSlots[ss-1]?.split(' - ');
                  const prevTime = prevOne && [moment(`01/01/2000 ${prevOne[0]}`, "DD/MM/YYYY HH:mm").toDate().getTime(), moment(`01/01/2000 ${prevOne[1]}`, "DD/MM/YYYY HH:mm").toDate().getTime()];
                  let nextOne = log.alreadyBookedSlots[ss+1]?.split(' - ');
                  const nextTime = nextOne && [moment(`01/01/2000 ${nextOne[0]}`, "DD/MM/YYYY HH:mm").toDate().getTime(), moment(`01/01/2000 ${nextOne[1]}`, "DD/MM/YYYY HH:mm").toDate().getTime()];
                  return(
                    <span key={`log${i}slot${ss}`}>
                      {(!prevTime || thisTime[0] !== prevTime[1] ) && `From ${thisOne[0]}`}
                      {(!nextTime || thisTime[1] !== nextTime[0] ) && ` to ${thisOne[1]} is already booked.`}
                    </span>  
                  )
                })
                }
              </span>
            </div>
          ))}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button color="primary" onClick={()=>{setPrimeLogs(null)}}>
          Ok
        </Button>
      </ModalFooter>
    </Modal>

    <div className="my-container">
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
              <h3 style={{textAlign: "center"}}>Enable Prime in your settings.</h3>
              <div className="buttons">
                <Link className="button grey" href="/prime/settings">Settings</Link>
              </div>
            </div>
          :<>
            <div className="buttons">
              <button className="button" onClick={toggleModal}>New Meeting</button>
              <button className="button yellow" disabled={meetingsLoading} onClick={()=>{loadMeetings(userName, password)}}>Refresh</button>
              <button className="button green" disabled={!futureMeetings || (futureMeetings && futureMeetings.filter(m=>m.state === 'Pending').length === 0)} onClick={()=>{acceptBookings(userName, password, meetings.length)}}>Accept meetings</button>
              <Link className="button grey" href="/prime/settings">Settings</Link>
            </div>
            {futureMeetings.length > 0 ?
              <div className="meetings">
                <div className='tr'>
                  <div className="th">Branch</div>
                  <div className="th">Date</div>
                  <div className="th">Time</div>
                  <div className="th">Duration</div>
                  <div className="th">State</div>
                </div>
                {futureMeetings.map( (m, i) => {
                  const startTime = dateAndTime(m);
                  const endTime = moment(startTime).add(m.duration.split(' min')[0], 'minutes');
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
                        <span className="state-text">{m.state}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            :
              <h2>No meetings found</h2>
            }
          </>}
        </>}
      </main>

    </div>
  </>)
}
