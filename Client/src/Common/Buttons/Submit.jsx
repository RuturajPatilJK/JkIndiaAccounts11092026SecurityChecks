import { Button } from '@mui/material';
import { BsArrowUpRightSquareFill } from 'react-icons/bs'; 

const SubmitButton = ({ onClick, disabled, label = "Submit" }) => {
  return (
    <Button
      variant="contained"
      color="primary"
      onClick={onClick}
      disabled={disabled}
      sx={{
        display: 'flex',
        padding: '8px 20px',
        fontSize: '12px',
        color: 'white',
        background: '#6225e6',
        transition: '1s',
        transform: 'skewX(-15deg)',
        border: 'none',
        cursor: 'pointer',
        '&:focus': {
          outline: 'none',
        },
      }}
    >
      {label}
      <span className="span">
        <BsArrowUpRightSquareFill />
      </span>
      <span className="second"></span>
    </Button>
  );
};

export default SubmitButton;
