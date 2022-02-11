import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import AccountAPI from "../api/account";
import { Spin } from "antd";

/**
 * Protects routes from global use.
 * @param {Object} `Object gets descructed~
 */
const ProtectedRoute = ({ element: Component, ...rest }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    let mounted = true;
    if (mounted)
      AccountAPI.getUser((user) => {
        if (user) setUser(user);
        else setUser("NONE");
      });
    return () => (mounted = false);
  }, []);

  if (user === null)
    return (
      <div className="center-403">
        <Spin size="large" tip="Authenticating user..." />
      </div>
    );

  if (user !== "NONE") return <Component {...rest} user={user} />;
  else return <Navigate to={`/not-authorized?r=${user.error}`} replace />;
};

export default ProtectedRoute;
