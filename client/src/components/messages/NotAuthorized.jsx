import React from "react";
import { useLocation } from "react-router-dom";

const useQuery = () => new URLSearchParams(useLocation().search);

const NotAuthorized = () => {
  const query = useQuery();
  return (
    <div>
      <h1>Not Authorized</h1>
      <p>
        <strong>{`Reason: ${
          query.get("r") ||
          "Unknown Reason. Any changes you intended to make have been rolled back. Please log back in and try again."
        }`}</strong>
      </p>
    </div>
  );
};

export default NotAuthorized;
