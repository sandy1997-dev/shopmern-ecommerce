import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store"; 

export default function AutoLogout() {
  const { logout, user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return; 

    let timeoutId;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        logout(); 
        navigate("/login"); 
      }, 900000); // 15 minutes
    };

    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, resetTimer));

    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, [user, logout, navigate]);

  return null; 
}