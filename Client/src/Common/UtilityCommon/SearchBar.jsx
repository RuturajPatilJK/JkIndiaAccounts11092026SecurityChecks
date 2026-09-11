import React, { useState } from "react";
import { FiSearch, FiMic, FiX } from "react-icons/fi";

function SearchBar({ value, onChange, onSearch }) {
  const [isFocused, setIsFocused] = useState(false);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  const handleClear = () => {
    onChange({ target: { value: '' } });
  };

  return (
    <div className="flex justify-end my-8 mr-4">
      <div className={`relative flex items-center w-full max-w-md h-14 bg-white rounded-full shadow-lg transition-all duration-300 ${isFocused ? 'ring-2 ring-green-400 shadow-md' : ''}`}>
        <div className="absolute left-5 text-gray-400">
          <FiSearch className="w-5 h-5" />
        </div>
        
        <input
          type="text"
          className="w-full h-full pl-14 pr-12 rounded-full border-none outline-none text-gray-700 placeholder-gray-400 focus:ring-0"
          placeholder="Search for anything..."
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          autoComplete="off"
        />
        
        {value && (
          <button
            onClick={handleClear}
            className="absolute right-16 p-1 text-gray-400 hover:text-gray-600 transition-colors bg-transparent"
          >
            <FiX className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}

export default SearchBar;