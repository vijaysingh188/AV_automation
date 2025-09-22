import React, { useEffect, useState } from "react";

function Homepage() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/homeadmin")
      .then(res => res.json())
      .then(data => setMessage(data.message))
      .catch(() => setMessage("Failed to load homepage."));
  }, []);

  return (
    <div style={{ textAlign: "center", marginTop: "3rem" }}>
      <h1>Homepage</h1>
      <p>{message}</p>
    </div>
  );
}

export default Homepage;