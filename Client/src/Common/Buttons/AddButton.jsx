import React, { useState } from "react";

const AddButton = React.forwardRef(({ openPopup, isEditing, setFocusToFirstField }, ref) => {
  const [isHovered, setIsHovered] = useState(false);

  const buttonStyles = {
    position: "relative",
    width: "100px",
    height: "50px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #34974d",
    backgroundColor: isHovered ? "#34974d" : "#3aa856",
    overflow: "hidden",
    transition: "all 0.3s",
  };

  const buttonTextStyles = {
    transform: isHovered ? "translateX(30px)" : "translateX(0)",
    color: isHovered ? "transparent" : "#fff",
    fontWeight: 600,
    whiteSpace: "nowrap",
    transition: "all 0.3s",
  };

  const buttonIconStyles = {
    position: "absolute",
    transform: isHovered ? "translateX(0)" : "translateX(109px)",
    height: "100%",
    width: isHovered ? "148px" : "39px",
    backgroundColor: "#34974d",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s",
  };

  const svgStyles = {
    width: "30px",
    stroke: "#fff",
  };

  const handleClick = () => {
    openPopup("add");
    setFocusToFirstField(); 
  };

  return (
    <button
      ref={ref}
      style={buttonStyles}
      onClick={handleClick}
      disabled={!isEditing}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          handleClick();
        }
      }}
    >
      <span className="button__text" style={buttonTextStyles}>
        Add
      </span>
      <span className="button__icon" style={buttonIconStyles}>
        <svg
          style={svgStyles}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </span>
    </button>
  );
});

export default AddButton;
