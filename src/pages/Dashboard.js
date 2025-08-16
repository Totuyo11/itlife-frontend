import React, { useEffect, useState } from 'react';
import { onValue, ref, set } from 'firebase/database';
import { auth, db } from './firebase';
import './Dashboard.css';

function Dashboard() {
  const [progreso, setProgreso] = useState({});
  const [user, setUser] = useState(null);
  const [fechaHoy, setFechaHoy] = useState('');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
        const fechaISO = new Date().toISOString().split('T')[0];
        setFechaHoy(fechaISO);

        const progresoRef = ref(db, `progreso/${user.uid}`);
        onValue(progresoRef, (snapshot) => {
          const data = snapshot.val() || {};
          setProgreso(data);
        });
      }
    });
    return () => unsubscribe();
  }, []);

  const marcarCompletado = () => {
    if (!user || !fechaHoy) return;
    const hoyRef = ref(db, `progreso/${user.uid}/${fechaHoy}`);
    set(hoyRef, true);
  };

  return (
    <div className="dashboard-container">
      <h2>📅 Tu Progreso</h2>
      <button className="completar-btn" onClick={marcarCompletado}>
        ✅ Marcar como completado hoy
      </button>

      <div className="calendario">
        {Object.entries(progreso).map(([fecha, done]) => (
          <div key={fecha} className={`dia ${done ? 'completado' : ''}`}>
            {fecha}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
