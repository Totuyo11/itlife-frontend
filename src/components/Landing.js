import React from "react";

function Landing() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      <h1 className="text-5xl font-extrabold text-center mb-6">
        Bienvenido a <span className="text-red-500">FitLife</span>
      </h1>
      <p className="text-lg text-gray-300 mb-10 text-center max-w-xl">
        Transforma tu cuerpo, mente y rutina diaria. Esta es tu oportunidad de empezar fuerte 💪
      </p>
      <form className="w-full max-w-md bg-white text-black rounded-xl p-6 space-y-4 shadow-lg">
        <input
          type="text"
          placeholder="Nombre"
          className="w-full px-4 py-2 rounded border border-gray-300"
        />
        <input
          type="email"
          placeholder="Correo"
          className="w-full px-4 py-2 rounded border border-gray-300"
        />
        <input
          type="password"
          placeholder="Contraseña"
          className="w-full px-4 py-2 rounded border border-gray-300"
        />
        <button
          type="submit"
          className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 font-bold"
        >
          Crear cuenta
        </button>
      </form>
    </div>
  );
}

export default Landing;
