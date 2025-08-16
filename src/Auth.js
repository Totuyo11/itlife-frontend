import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';

const Auth = () => {
  const [isRegistering, setIsRegistering] = useState(false);

  return (
    <div>
      {isRegistering ? (
        <Register onSwitch={() => setIsRegistering(false)} />
      ) : (
        <Login onSwitch={() => setIsRegistering(true)} />
      )}
    </div>
  );
};

export default Auth;
