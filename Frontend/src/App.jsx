import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Login from "./Pages/Login.jsx";
import Signup from "./Pages/Signup.jsx";
import Diary from "./Pages/Diary.jsx";

// Only lets logged-in users see the page; everyone else goes back to login
function RequireLogin({ children }) {
  return localStorage.getItem("user") ? children : <Navigate to="/" replace />;
}

export default function App() {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Login
            onLogin={() => navigate("/Home")}
            onGoToSignup={() => navigate("/Signup")}
          />
        }
      />
      <Route
        path="/Signup"
        element={
          <Signup
            onSignupSuccess={() => navigate("/")}
            onGoToLogin={() => navigate("/")}
          />
        }
      />
      <Route
        path="/Home"
        element={
          <RequireLogin>
            <Diary onSignOut={() => navigate("/")} />
          </RequireLogin>
        }
      />
    </Routes>
  );
}