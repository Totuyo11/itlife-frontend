// src/Home.js
import React, { useEffect, useState } from 'react';
import './Home.css';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

import img1 from './assets/welcome1.png';
import img2 from './assets/welcome2.png';
import img3 from './assets/welcome3.png';
import img4 from './assets/welcome4.png';

const cards = [
  {
    text: "Este es tu nuevo espacio para romperla en cada entrenamiento y construir una versión más fuerte, sana y motivada de ti mismo. Si amas moverte, entrenar, superarte y sentirte bien por dentro y por fuera... entonces este lugar es para ti.",
    img: img1,
  },
  {
    text: "*Fit Life* no es solo otra app de ejercicios. Es tu compañero de batalla fitness. Aquí vas a encontrar rutinas hechas a tu medida, consejos que sí sirven, frases que te empujan cuando las ganas se acaban, y un diseño que te motiva desde el primer clic.",
    img: img2,
  },
  {
    text: "¿Quieres bajar grasa? ¿Subir masa? ¿Volverte un atleta híbrido? ¿Recomponer tu cuerpo? Lo tenemos todo cubierto. No importa si estás empezando o llevas años dándole duro al gym, *Fit Life se adapta a ti*.",
    img: img3,
  },
  {
    text: "Porque no se trata de tener el mejor cuerpo, se trata de sentirte increíble contigo mismo, de construir hábitos que te acerquen cada día a tu mejor versiónAquí no hay excusas, solo progreso, Aquí no hay metas imposibles, solo pasos que aún no diste",
    img: img4,
  },
];

function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsub();
  }, []);

  return (
    <div className="home-container">
      <h1 className="home-title">Bienvenido a <span>FitLife</span></h1>

      <div className="welcome-cards">
        {cards.map((card, idx) => (
          <div className="welcome-card" key={idx}>
            <div className="welcome-card-text">{card.text}</div>
            <img src={card.img} alt={`card-${idx}`} />
          </div>
        ))}
      </div>

      {!user && (
        <button className="start-button" onClick={() => navigate('/login')}>
          Comenzar
        </button>
      )}
    </div>
  );
}

export default Home;
