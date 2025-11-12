// src/lib/notify.js
import { toast } from "react-toastify";

/** Toast de éxito uniforme (abajo-derecha, 3s, tema dark – ya tienes <ToastContainer/>) */
export const ok = (msg) =>
  toast.success(msg, {
    icon: "✅",
    autoClose: 3000,
  });

/** Toast de error uniforme */
export const fail = (msg) =>
  toast.error(msg || "Ocurrió un error", {
    icon: "⚠️",
    autoClose: 4000,
  });

/** Atajos semánticos para mensajes comunes */
export const notify = {
  routineSaved: (name = "Rutina") => ok(`📦 ${name} guardada`),
  routineDeleted: (name = "Rutina") => ok(`🗑️ ${name} eliminada`),
  routineUpdated: (name = "Rutina") => ok(`✏️ ${name} actualizada`),
  sessionLogged: () => ok("🕒 Sesión registrada"),
};
