import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastCtx = createContext({ notify: () => {} });

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);

  const notify = useCallback((message, variant = 'info', ttl = 3200) => {
    const id = Math.random().toString(36).slice(2);
    setItems((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => setItems((prev) => prev.filter(i => i.id !== id)), ttl);
  }, []);

  return (
    <ToastCtx.Provider value={{ notify }}>
      {children}
      <div className="toaster">
        {items.map(i => (
          <div key={i.id} className={`toast toast-${i.variant}`} role="status">
            {i.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);
