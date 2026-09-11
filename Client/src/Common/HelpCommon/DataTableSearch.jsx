import React, { useState } from "react";

function DataTableSearch({ data, onSearch }) {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    onSearch(event.target.value);
  };

  const containerStyle = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    marginTop: "10px",
  };

  const inputContainerStyle = {
    height: "45px",
    display: "flex",
    alignItems: "center",
    backgroundColor: "#fff",
    border: "1px solid green",
    borderRadius: "25px",
    overflow: "hidden",
    paddingLeft: "15px",
    boxShadow: "2px 2px 10px rgba(0, 0, 0, 0.075)",
    width: "350px",
  };

  const inputStyle = {
    width: "250px",
    height: "100%",
    border: "none",
    outline: "none",
    fontSize: "1em",
    caretColor: "rgb(255, 81, 0)",
  };

  const labelStyle = {
    cursor: "text",
    padding: "0px 12px",
  };

  const searchIconStyle = {
    width: "13px",
    height: "13px",
    fill: "rgb(114, 114, 114)",
  };

  const micButtonStyle = {
    padding: "0px 15px 0px 12px",
    border: "none",
    backgroundColor: "transparent",
    height: "45px",
    cursor: "pointer",
    transition: "0.3s",
  };

  const micIconStyle = {
    width: "14px",
    height: "14px",
    fill: "rgb(255, 81, 0)",
  };

  const borderStyle = {
    height: "40%",
    width: "1.3px",
    backgroundColor: "rgb(223, 223, 223)",
  };

  return (
    <div style={containerStyle}>
      <div style={inputContainerStyle}>
        <input
          type="text"
          placeholder="Search..."
          autoComplete="off"
          style={inputStyle}
          value={searchTerm}
          onChange={handleSearch}
        />

        <label htmlFor="input" style={labelStyle}>
          <svg viewBox="0 0 512 512" style={searchIconStyle}>
            <path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z" />
          </svg>
        </label>

        <div style={borderStyle}></div>

        {/* <button
          style={micButtonStyle}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "rgb(255, 230, 230)")}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          <svg viewBox="0 0 384 512" style={micIconStyle}>
            <path d="M192 0C139 0 96 43 96 96V256c0 53 43 96 96 96s96-43 96-96V96c0-53-43-96-96-96zM64 216c0-13.3-10.7-24-24-24s-24 10.7-24 24v40c0 89.1 66.2 162.7 152 174.4V464H120c-13.3 0-24 10.7-24 24s10.7 24 24 24h72 72c13.3 0 24-10.7 24-24s-10.7-24-24-24H216V430.4c85.8-11.7 152-85.3 152-174.4V216c0-13.3-10.7-24-24-24s-24 10.7-24 24v40c0 70.7-57.3 128-128 128s-128-57.3-128-128V216z" />
          </svg>
        </button> */}
      </div>
    </div>
  );
}

export default DataTableSearch;
