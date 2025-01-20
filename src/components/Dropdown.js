import React, { useState } from "react";
import "./Dropdown.css"; // Import CSS file for styling

const Dropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState("Select an option");

  const options = ["Option 1", "Option 2", "Option 3", "Option 4"];

  const handleToggle = () => {
    setIsOpen(!isOpen); // Toggle dropdown visibility
  };

  const handleOptionClick = (option) => {
    setSelectedOption(option); // Update selected option
    setIsOpen(false); // Close the dropdown
  };

  return (
    <div className="dropdown-container">
      <button onClick={handleToggle} className="dropdown-button">
        {selectedOption} ▼
      </button>
      {isOpen && (
        <ul className="dropdown-menu">
          {options.map((option, index) => (
            <li
              key={index}
              className="dropdown-item"
              onClick={() => handleOptionClick(option)}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Dropdown;
