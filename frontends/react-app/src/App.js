import { useState, useEffect, useCallback } from 'react';
import './bulma.min.css';

const ONE_DAY = 24 * 60 * 60 * 1000;

function Header() {
  return (
    <div className="block">
      <h1>Total Life Appointments</h1>
    </div>
  );
}

function unixTimeToDate(unixTime) {
  let date = new Date(unixTime);
  return date.toISOString().split('T')[0];
}

function DateFilter(props) {
  let { onChanged } = props;

  let today = new Date().getTime()

  let [startDate, setStartDate] = useState(unixTimeToDate(today));
  let [endDate, setEndDate] = useState(unixTimeToDate(today + ONE_DAY * 7))

  useEffect(() => {
    onChanged(new Date(startDate).getTime(), new Date(endDate).getTime());
  }, [startDate, endDate, onChanged]);

  let onStartDateChanged = (e) => {
    setStartDate(e.target.value);
  }

  let onEndDateChanged = (e) => {
    setEndDate(e.target.value);
  }

  return (
    <div className="block">
      <h2>Filter by Date</h2>
      <div className="field is-grouped">
        <input type="date" value={startDate} onChange={onStartDateChanged}/>
        <input type="date" value={endDate} onChange={onEndDateChanged}/>
      </div>
    </div>
  );
}

function AppointmentRow(props) {
  let {appointment} = props;

  return (
    <div className="columns">
      <div className="column">{appointment.id}</div>
      <div className="column">{appointment.patient_id}</div>
      <div className="column">{appointment.clinician_id}</div>
      <div className="column">{appointment.timestamp}</div>
    </div>
  );
}

function AppointmentTable() {
  let [data, setData] = useState([]);

  let dateRangeChanged = useCallback((startDate, endDate) => {
    fetch(`http://localhost:3002/appointments/range/${startDate}/${endDate}`)
      .then(response => response.json())
      .then(data => setData(data.appointments));
  }, []);

  return (
    <div className="block">
      <h2> Appointments </h2>
      <DateFilter onChanged={dateRangeChanged}/>
      <div className="block">
        <div className="columns">
          <div className="column">Appointment ID</div>
          <div className="column">Patient ID</div>
          <div className="column">Clinician ID</div>
          <div className="column">Timestamp</div>
        </div>
      </div>
      <div className="block">
        { data.map((appointment) => <AppointmentRow key={appointment.id} appointment={appointment}/>) }
      </div>
    </div>
  );
}

function App() {

  return (
    <div className="App">
      <Header />
      <AppointmentTable />


    </div>
  );
}

export default App;
