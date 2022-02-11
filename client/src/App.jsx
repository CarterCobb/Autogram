import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
// Messages
import NotFound from "./components/messages/NotFound";
import NotAuthorized from "./components/messages/NotAuthorized";
// Authorizers
import LoginProtected from "./components/LoginProtected";
import ProtectedRoute from "./components/ProtectedRoute";
// Pages
import Home from "./components/pages/Home";
import Login from "./components/pages/Login";
import Register from "./components/pages/Register";
import Profile from "./components/pages/Profile";
import Explore from "./components/pages/Explore";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginProtected element={Home} />} />
        <Route
          path="/profile/:username"
          element={<ProtectedRoute element={Profile} />}
        />
        <Route path="/explore" element={<LoginProtected element={Explore} />} />
        <Route
          path="/p/profile/:username"
          element={<Profile open user={{ username: "null" }} />}
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/not-authorized" element={<NotAuthorized />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

export default App;
