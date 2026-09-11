import React from "react";

const FancyButton = ({ onClick, disabled, children, color = "#7808d0" }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ "--clr": color, whiteSpace: "nowrap" }}
      className="fancy-button"
    >
      <span className="button__icon-wrapper">
        <svg
          viewBox="0 0 14 15"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="button__icon-svg"
          width="10"
        >
          <path
            d="M13.376 11.552l-.264-10.44-10.44-.24.024 2.28 6.96-.048L.2 12.56l1.488 1.488 9.432-9.432-.048 6.912 2.304.024z"
            fill="currentColor"
          />
        </svg>
        <svg
          viewBox="0 0 14 15"
          fill="none"
          width="10"
          xmlns="http://www.w3.org/2000/svg"
          className="button__icon-svg button__icon-svg--copy"
        >
          <path
            d="M13.376 11.552l-.264-10.44-10.44-.24.024 2.28 6.96-.048L.2 12.56l1.488 1.488 9.432-9.432-.048 6.912 2.304.024z"
            fill="currentColor"
          />
        </svg>
      </span>
      {children}
     <style jsx>{`
  .fancy-button {
    line-height: 1;
    text-decoration: none;
    display: inline-flex;
    border: none;
    cursor: pointer;
    align-items: center;
    gap: 0.3rem;
    background-color: var(--clr);
    color: #fff;
    border-radius: 999px;
    font-weight: 600;
    font-size: 0.875rem;
    padding: 0.4rem 1rem;
    padding-left: 16px;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: background-color 0.3s;
  }

  .fancy-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .button__icon-wrapper {
    flex-shrink: 0;
    width: 22px;
    height: 22px;
    position: relative;
    color: var(--clr);
    background-color: #fff;
    border-radius: 50%;
    display: grid;
    place-items: center;
    overflow: hidden;
  }

  .fancy-button:hover {
    background-color: #000;
  }

  .fancy-button:hover .button__icon-wrapper {
    color: #000;
  }

  .button__icon-svg--copy {
    position: absolute;
    transform: translate(-150%, 150%);
  }

  .fancy-button:hover .button__icon-svg:first-child {
    transition: transform 0.3s ease-in-out;
    transform: translate(150%, -150%);
  }

  .fancy-button:hover .button__icon-svg--copy {
    transition: transform 0.3s ease-in-out 0.1s;
    transform: translate(0);
  }
`}</style>

    </button>
  );
};

export default FancyButton;
