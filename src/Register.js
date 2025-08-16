import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase"; // asegúrate que esto está bien

export default function Register() {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (contrasena !== confirmar) {
      setError("Las contraseñas no coinciden");
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, correo, contrasena);
      console.log("✅ Usuario registrado");
      // Aquí puedes redirigir si quieres
    } catch (error) {
      console.error("Error al registrar:", error);
      setError("Error: " + error.message); // ← aquí se muestra el mensaje real
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-slate-900 text-white rounded-lg">
      <h2 className="text-2xl font-bold text-red-400 mb-4">Registro</h2>

      <input
        type="text"
        placeholder="Nombre"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        className="w-full p-2 rounded bg-slate-800 mb-3"
        required
      />
      <input
        type="email"
        placeholder="Correo electrónico"
        value={correo}
        onChange={(e) => setCorreo(e.target.value)}
        className="w-full p-2 rounded bg-slate-800 mb-3"
        required
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={contrasena}
        onChange={(e) => setContrasena(e.target.value)}
        className="w-full p-2 rounded bg-slate-800 mb-3"
        required
      />
      <input
        type="password"
        placeholder="Confirmar contraseña"
        value={confirmar}
        onChange={(e) => setConfirmar(e.target.value)}
        className="w-full p-2 rounded bg-slate-800 mb-3"
        required
      />

      {error && (
        <p className="text-red-500 text-sm text-center mb-3">{error}</p>
      )}

      <button
        type="submit"
        className="w-full p-2 bg-red-500 hover:bg-red-600 rounded font-semibold"
      >
        Registrarse
      </button>

      <p className="text-center mt-4 text-sm text-gray-300">
        ¿Ya tienes cuenta? <a href="/login" className="text-blue-400 underline">Inicia sesión</a>
      </p>
    </form>
  );
}
