import React from "react";

function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
      <div className="bg-white p-10 rounded-2xl shadow-2xl max-w-2xl w-full text-center">
        <h1 className="text-4xl font-bold mb-4 text-gray-800">FitLife 🏋️‍♂️</h1>
        <p className="text-lg text-gray-600 mb-6">
          Encuentra tu rutina ideal para entrenar desde casa o el gym.
        </p>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-full shadow-md transition-all">
          Empezar ahora
        </button>
      </div>
    </div>
  );
}

export default Landing;
