import React, { useRef } from 'react';
import TextField from '@mui/material/TextField';

const CustomTextFeild = ({ value, onChange, name, onBlur, inputProps = {}, ...props }) => {
  const inputRef = useRef(null);

  const handleChange = (e) => {
    const cursorPos = e.target.selectionStart;
    const newValue = e.target.value;

    onChange(e);

    setTimeout(() => {
      const input = inputRef.current;
      if (input && document.activeElement === input) {
        input.setSelectionRange(cursorPos, cursorPos);
      }
    }, 0);
  };

  return (
    <TextField
      inputRef={inputRef}
      value={value}
      onChange={handleChange}
      name={name}
      onBlur={onBlur}
      autoComplete='off'
      inputProps={{
        ...inputProps,
        style: { textAlign: 'right', fontWeight: 'bold', ...inputProps.style },
      }}
      {...props}
    />
  );
};

export default CustomTextFeild;
