import React from "react";
import Form from 'react-bootstrap/Form';

function PerPageSelect({ value, onChange }) {
  const options = [15, 25, 50, 100];

  return (
    <div className="controls">
      <Form.Group
       
        style={{ display: "flex", alignItems: "center"}}
      >
        {/* <Form.Label id="perPage-label">
          Show Entries
        </Form.Label> */}
        <Form.Select
          aria-label="Posts Per Page"
          value={value}
          onChange={onChange}
          style={{ width: "80px",height :"40px"}} 
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Form.Select>
      </Form.Group>
    </div>
  );
}

export default PerPageSelect;
