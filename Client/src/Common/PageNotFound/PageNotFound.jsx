// src/NotAuthorized.jsx
import React from "react";
import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import notAuthorizedImage from "../../Assets/NotAuthorized.png";

const NotAuthorized = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate("/dashboard");
  };

  return (
    <div style={styles.container}>
      <div style={styles.imageContainer}>
        <img
          src={notAuthorizedImage}
          alt="Not Authorized"
          style={styles.image}
        />
      </div>
      <h4 > Sorry,You Do Not Have Permission To View This Page!.</h4>
      <Button variant="contained" color="primary" onClick={handleBack}>
        Go Back
      </Button>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    height: "80vh",
    textAlign: "center",
  },
  imageContainer: {
    width: "200px",
    height: "200px",
    marginBottom: "20px",
    animation: "float 3s ease-in-out infinite",
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },
  title: {
    fontSize: "2rem",
    marginBottom: "20px",
  }
};

export default NotAuthorized;