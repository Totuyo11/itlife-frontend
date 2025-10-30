import React from 'react';
import { useNavigate } from 'react-router-dom';

const routines = [
  { title: 'Piernas 🔥', description: 'Sentadillas, zancadas y más.' },
  { title: 'Pecho 💪', description: 'Press banca, lagartijas y más.' },
  { title: 'Espalda 🐍', description: 'Remo, peso muerto y más.' },
  { title: 'Full Body 🧠', description: 'Entrena todo en una sesión.' },
];

function RoutineCards() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h2 className="text-3xl font-bold text-center mb-8">Rutinas Fitlife</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {routines.map((routine, idx) => (
          <div key={idx} className="bg-white rounded-lg p-6 shadow hover:shadow-lg transition">
            <h3 className="text-xl font-semibold mb-2">{routine.title}</h3>
            <p className="text-gray-700">{routine.description}</p>
          </div>
        ))}
      </div>
      <div className="mt-10 text-center">
        <button
          onClick={() => navigate('/home')}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg shadow hover:bg-blue-600"
        >
          ⬅️ Volver al Inicio
        </button>
      </div>
    </div>
  );
}

export default RoutineCards;

