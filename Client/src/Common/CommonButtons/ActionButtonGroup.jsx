// import React, { useRef, useEffect, useState } from 'react';
// import {
//   FaPlus,
//   FaSave,
//   FaEdit,
//   FaTrash,
//   FaTimes,
//   FaArrowLeft
// } from 'react-icons/fa';

// const ActionButtonGroup = ({
//   handleAddOne,
//   addOneButtonEnabled,
//   handleSaveOrUpdate,
//   saveButtonEnabled,
//   isEditMode,
//   handleEdit,
//   editButtonEnabled,
//   handleDelete,
//   deleteButtonEnabled,
//   handleCancel,
//   cancelButtonEnabled,
//   handleBack,
//   backButtonEnabled,
//   permissions,
//   nextTabIndex,
//   component,
//   isDeleted,
// }) => {
//   const editButtonRef = useRef(null);
//   const updateButtonRef = useRef(null);
//   const resaleMillDropdownRef = useRef(null);
//   const [focusedButton, setFocusedButton] = useState(null);

//   useEffect(() => {
//     if (editButtonEnabled && editButtonRef.current) {
//       editButtonRef.current.focus();
//     }
//   }, [editButtonEnabled]);

//   useEffect(() => {
//     if (isEditMode && updateButtonRef.current) {
//       updateButtonRef.current.focus();
//     }
//   }, [isEditMode]);

//   const handleKeyDown = (event, handler) => {
//     if (event.key === "Enter") {
//       event.preventDefault();
//       handler();
//       if (handler === handleAddOne || handler === handleEdit) {
//         if (resaleMillDropdownRef.current) {
//           resaleMillDropdownRef.current.focus();
//         }
//       } else if (handler === handleCancel) {
//         editButtonRef.current.focus();
//       } else if (handler === handleEdit) {
//         updateButtonRef.current.focus();
//       }
//     }
//   };

//   const getButtonStyle = (enabled, permission, buttonKey) => {
//     const isEnabled = enabled && permission !== "N";
//     const isFocused = focusedButton === buttonKey;

//     return {
//       backgroundColor: isFocused
//         ? "#FFEE58"
//         : isEnabled
//           ? "#1976d2"
//           : "#e0e0e0",
//       color: isFocused
//         ? "#333"
//         : isEnabled
//           ? "#fff"
//           : "#888",
//       border: "none",
//       borderRadius: "4px",
//       cursor: isEnabled ? "pointer" : "not-allowed",
//       minWidth: "80px",
//       height: "32px",
//       fontSize: "13px",
//       fontWeight: "500",
//       display: "flex",
//       alignItems: "center",
//       justifyContent: "center",
//       gap: "6px",
//       padding: "0 10px",
//       boxShadow: isFocused ? "0px 2px 6px rgba(0, 0, 0, 0.15)" : "none",
//       transform: isFocused ? "scale(1.02)" : "scale(1)",
//       transition: "all 0.2s ease-in-out",
//       outline: "none",
//     };
//   };

//   const handleCancelClick = () => {
//     handleCancel();
//     setTimeout(() => {
//       if (editButtonRef.current) {
//         editButtonRef.current.focus();
//         setFocusedButton("edit");
//       }
//     }, 0);
//   };

//   return (
//     <div
//       style={{
//         marginTop: "-20px",
//         marginBottom: "10px",
//         display: "flex",
//         gap: "1px",
//         flexWrap: "wrap",
//       }}
//     >
//       <button
//         onClick={handleAddOne}
//         disabled={!addOneButtonEnabled || permissions?.canSave === "N"}
//         onKeyDown={(event) => handleKeyDown(event, handleAddOne)}
//         onFocus={() => setFocusedButton("add")}
//         onBlur={() => setFocusedButton(null)}
//         style={getButtonStyle(addOneButtonEnabled, permissions?.canSave, "add")}
//         tabIndex={nextTabIndex}
//       >
//         <FaPlus /> Add
//       </button>

//       {isEditMode ? (
//         <button
//           ref={updateButtonRef}
//           onClick={handleSaveOrUpdate}
//           onKeyDown={(event) => handleKeyDown(event, handleSaveOrUpdate)}
//           id="update"
//           type='submit'
//           onFocus={() => setFocusedButton("update")}
//           onBlur={() => setFocusedButton(null)}
//           style={getButtonStyle(true, "Y", "update")}
//           tabIndex={nextTabIndex}
//         >
//           <FaSave /> Update
//         </button>
//       ) : (
//         <button
//           onClick={handleSaveOrUpdate}
//           disabled={isDeleted || !saveButtonEnabled || permissions?.canSave === "N"}
//           onKeyDown={(event) => handleKeyDown(event, handleSaveOrUpdate)}
//           id="save"
//           type='submit'
//           onFocus={() => setFocusedButton("save")}
//           onBlur={() => setFocusedButton(null)}
//           style={getButtonStyle(saveButtonEnabled, permissions?.canSave, "save")}
//           tabIndex={nextTabIndex}
//         >
//           <FaSave /> Save
//         </button>
//       )}

//       <button
//         ref={editButtonRef}
//         onClick={handleEdit}
//         disabled={isDeleted || !editButtonEnabled || permissions?.canEdit === "N"}
//         onKeyDown={(event) => handleKeyDown(event, handleEdit)}
//         onFocus={() => setFocusedButton("edit")}
//         onBlur={() => setFocusedButton(null)}
//         style={getButtonStyle(editButtonEnabled, permissions?.canEdit, "edit")}
//       >
//         <FaEdit /> Edit
//       </button>

//       <button
//         onClick={handleDelete}
//         disabled={isDeleted || !deleteButtonEnabled || permissions?.canDelete === "N"}
//         onKeyDown={(event) => handleKeyDown(event, handleDelete)}
//         onFocus={() => setFocusedButton("delete")}
//         onBlur={() => setFocusedButton(null)}
//         style={getButtonStyle(deleteButtonEnabled, permissions?.canDelete, "delete")}
//         tabIndex={nextTabIndex}
//       >
//         <FaTrash /> Delete
//       </button>

//       <button
//         onClick={handleCancelClick}
//         disabled={isDeleted || !cancelButtonEnabled}
//         onKeyDown={(event) => handleKeyDown(event, handleCancelClick)}
//         onFocus={() => setFocusedButton("cancel")}
//         onBlur={() => setFocusedButton(null)}
//         style={getButtonStyle(cancelButtonEnabled, "Y", "cancel")}
//         tabIndex={nextTabIndex}
//       >
//         <FaTimes /> Cancel
//       </button>

//       <button
//         onClick={handleBack}
//         disabled={!backButtonEnabled}
//         onKeyDown={(event) => handleKeyDown(event, handleBack)}
//         onFocus={() => setFocusedButton("back")}
//         onBlur={() => setFocusedButton(null)}
//         style={getButtonStyle(backButtonEnabled, "Y", "back")}
//         tabIndex={nextTabIndex}
//       >
//         <FaArrowLeft /> Back
//       </button>

//       {component}
//     </div>
//   );
// };

// export default ActionButtonGroup;














import React, { useRef, useEffect, useState } from 'react';
import {
  FaPlus,
  FaSave,
  FaEdit,
  FaTrash,
  FaTimes,
  FaArrowLeft
} from 'react-icons/fa';

const ActionButtonGroup = ({
  handleAddOne,
  addOneButtonEnabled,
  handleSaveOrUpdate,
  saveButtonEnabled,
  isEditMode,
  handleEdit,
  editButtonEnabled,
  handleDelete,
  deleteButtonEnabled,
  handleCancel,
  cancelButtonEnabled,
  handleBack,
  backButtonEnabled,
  permissions,
  nextTabIndex,
  component,
  isDeleted,
}) => {
  const editButtonRef = useRef(null);
  const updateButtonRef = useRef(null);
  const resaleMillDropdownRef = useRef(null);
  const [focusedButton, setFocusedButton] = useState(null);
  const [hoveredButton, setHoveredButton] = useState(null);
  const [pressedButton, setPressedButton] = useState(null);

  useEffect(() => {
    if (editButtonEnabled && editButtonRef.current) {
      editButtonRef.current.focus();
    }
  }, [editButtonEnabled]);

  useEffect(() => {
    if (isEditMode && updateButtonRef.current) {
      updateButtonRef.current.focus();
    }
  }, [isEditMode]);

  const handleKeyDown = (event, handler) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handler();
      if (handler === handleAddOne || handler === handleEdit) {
        if (resaleMillDropdownRef.current) {
          resaleMillDropdownRef.current.focus();
        }
      } else if (handler === handleCancel) {
        editButtonRef.current.focus();
      } else if (handler === handleEdit) {
        updateButtonRef.current.focus();
      }
    }
  };

  const handleMouseDown = (buttonKey) => {
    setPressedButton(buttonKey);
  };

  const handleMouseUp = () => {
    setPressedButton(null);
  };

  const handleMouseEnter = (buttonKey) => {
    setHoveredButton(buttonKey);
  };

  const handleMouseLeave = () => {
    setHoveredButton(null);
  };

  const getButtonClasses = (enabled, permission, buttonKey, isSpecial = false) => {
    const isEnabled = enabled && permission !== "N";
    const isFocused = focusedButton === buttonKey;
    const isHovered = hoveredButton === buttonKey;
    const isPressed = pressedButton === buttonKey;
    const isDisabled = !isEnabled;

    // Base classes for all buttons
    let baseClasses = "relative min-w-[80px] h-8 px-2.5 font-medium text-sm flex items-center justify-center gap-1.5 rounded-md border-none outline-none transition-all duration-200 ease-out shadow-sm ";
    
    // Focus ring styles (for accessibility)
    const focusRing = "focus:ring-2 focus:ring-offset-1 focus:ring-blue-400 focus:ring-opacity-50 ";
    
    // Animation classes
    const animations = "transform-gpu transition-all duration-200 ease-out hover:scale-105 active:scale-95 ";
    
    // Special animation for certain buttons
    const specialAnimations = isSpecial ? "hover:shadow-lg active:shadow-md " : "";
    
    // Button-specific colors and states
    if (isDisabled) {
      return baseClasses + "bg-gray-200 text-gray-500 cursor-not-allowed opacity-70 shadow-none hover:scale-100 active:scale-100 ";
    }

    let colorClasses = "";
    switch(buttonKey) {
      case 'add':
        colorClasses = "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white ";
        break;
      case 'save':
        colorClasses = "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white ";
        break;
      case 'update':
        colorClasses = "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white animate-pulse-subtle ";
        break;
      case 'edit':
        colorClasses = "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white ";
        break;
      case 'delete':
        colorClasses = "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white ";
        break;
      case 'cancel':
        colorClasses = "bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white ";
        break;
      case 'back':
        colorClasses = "bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white ";
        break;
      default:
        colorClasses = "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white ";
    }

    // Hover effects
    const hoverEffects = isHovered ? "shadow-md ring-1 ring-white ring-opacity-30 " : "";
    
    // Pressed effect
    const pressedEffect = isPressed ? "scale-95 shadow-inner " : "";
    
    // Focus effect
    const focusEffect = isFocused ? "ring-2 ring-yellow-400 ring-opacity-70 shadow-lg " : "";

    return baseClasses + focusRing + animations + specialAnimations + colorClasses + 
           hoverEffects + pressedEffect + focusEffect;
  };

  const handleCancelClick = () => {
    handleCancel();
    setTimeout(() => {
      if (editButtonRef.current) {
        editButtonRef.current.focus();
        setFocusedButton("edit");
      }
    }, 0);
  };

  return (
    <div className="mt-[-20px] mb-2.5 flex gap-1 flex-wrap items-center p-1 rounded-lg ">
      <button
        onClick={handleAddOne}
        disabled={!addOneButtonEnabled || permissions?.canSave === "N"}
        onKeyDown={(event) => handleKeyDown(event, handleAddOne)}
        onFocus={() => setFocusedButton("add")}
        onBlur={() => setFocusedButton(null)}
        onMouseDown={() => handleMouseDown("add")}
        onMouseUp={handleMouseUp}
        onMouseEnter={() => handleMouseEnter("add")}
        onMouseLeave={handleMouseLeave}
        className={getButtonClasses(addOneButtonEnabled, permissions?.canSave, "add", true)}
        tabIndex={nextTabIndex}
      >
        <FaPlus className="transition-transform duration-200 group-hover:rotate-90" /> 
        <span className="relative">
          Add
          <span className="absolute -bottom-1 left-0 w-0 group-hover:w-full h-0.5 bg-white transition-all duration-300"></span>
        </span>
      </button>

      {isEditMode ? (
        <button
          ref={updateButtonRef}
          onClick={handleSaveOrUpdate}
          onKeyDown={(event) => handleKeyDown(event, handleSaveOrUpdate)}
          id="update"
          type='submit'
          onFocus={() => setFocusedButton("update")}
          onBlur={() => setFocusedButton(null)}
          onMouseDown={() => handleMouseDown("update")}
          onMouseUp={handleMouseUp}
          onMouseEnter={() => handleMouseEnter("update")}
          onMouseLeave={handleMouseLeave}
          className={getButtonClasses(true, "Y", "update", true)}
          tabIndex={nextTabIndex}
        >
          <FaSave className="animate-bounce-slow" /> 
          <span className="relative">
            Update
            <span className="absolute -bottom-1 left-0 w-0 group-hover:w-full h-0.5 bg-white transition-all duration-300"></span>
          </span>
        </button>
      ) : (
        <button
          onClick={handleSaveOrUpdate}
          disabled={isDeleted || !saveButtonEnabled || permissions?.canSave === "N"}
          onKeyDown={(event) => handleKeyDown(event, handleSaveOrUpdate)}
          id="save"
          type='submit'
          onFocus={() => setFocusedButton("save")}
          onBlur={() => setFocusedButton(null)}
          onMouseDown={() => handleMouseDown("save")}
          onMouseUp={handleMouseUp}
          onMouseEnter={() => handleMouseEnter("save")}
          onMouseLeave={handleMouseLeave}
          className={getButtonClasses(saveButtonEnabled, permissions?.canSave, "save")}
          tabIndex={nextTabIndex}
        >
          <FaSave className="transition-transform duration-300 hover:rotate-12" /> 
          <span className="relative">
            Save
            <span className="absolute -bottom-1 left-0 w-0 group-hover:w-full h-0.5 bg-white transition-all duration-300"></span>
          </span>
        </button>
      )}

      <button
        ref={editButtonRef}
        onClick={handleEdit}
        disabled={isDeleted || !editButtonEnabled || permissions?.canEdit === "N"}
        onKeyDown={(event) => handleKeyDown(event, handleEdit)}
        onFocus={() => setFocusedButton("edit")}
        onBlur={() => setFocusedButton(null)}
        onMouseDown={() => handleMouseDown("edit")}
        onMouseUp={handleMouseUp}
        onMouseEnter={() => handleMouseEnter("edit")}
        onMouseLeave={handleMouseLeave}
        className={getButtonClasses(editButtonEnabled, permissions?.canEdit, "edit")}
      >
        <FaEdit className="transition-transform duration-300 hover:rotate-45" /> 
        <span className="relative">
          Edit
          <span className="absolute -bottom-1 left-0 w-0 group-hover:w-full h-0.5 bg-white transition-all duration-300"></span>
        </span>
      </button>

      <button
        onClick={handleDelete}
        disabled={isDeleted || !deleteButtonEnabled || permissions?.canDelete === "N"}
        onKeyDown={(event) => handleKeyDown(event, handleDelete)}
        onFocus={() => setFocusedButton("delete")}
        onBlur={() => setFocusedButton(null)}
        onMouseDown={() => handleMouseDown("delete")}
        onMouseUp={handleMouseUp}
        onMouseEnter={() => handleMouseEnter("delete")}
        onMouseLeave={handleMouseLeave}
        className={getButtonClasses(deleteButtonEnabled, permissions?.canDelete, "delete")}
        tabIndex={nextTabIndex}
      >
        <FaTrash className="transition-transform duration-300 hover:scale-110" /> 
        <span className="relative">
          Delete
          <span className="absolute -bottom-1 left-0 w-0 group-hover:w-full h-0.5 bg-white transition-all duration-300"></span>
        </span>
      </button>

      <button
        onClick={handleCancelClick}
        disabled={isDeleted || !cancelButtonEnabled}
        onKeyDown={(event) => handleKeyDown(event, handleCancelClick)}
        onFocus={() => setFocusedButton("cancel")}
        onBlur={() => setFocusedButton(null)}
        onMouseDown={() => handleMouseDown("cancel")}
        onMouseUp={handleMouseUp}
        onMouseEnter={() => handleMouseEnter("cancel")}
        onMouseLeave={handleMouseLeave}
        className={getButtonClasses(cancelButtonEnabled, "Y", "cancel")}
        tabIndex={nextTabIndex}
      >
        <FaTimes className="transition-transform duration-300 hover:rotate-90" /> 
        <span className="relative">
          Cancel
          <span className="absolute -bottom-1 left-0 w-0 group-hover:w-full h-0.5 bg-white transition-all duration-300"></span>
        </span>
      </button>

      <button
        onClick={handleBack}
        disabled={!backButtonEnabled}
        onKeyDown={(event) => handleKeyDown(event, handleBack)}
        onFocus={() => setFocusedButton("back")}
        onBlur={() => setFocusedButton(null)}
        onMouseDown={() => handleMouseDown("back")}
        onMouseUp={handleMouseUp}
        onMouseEnter={() => handleMouseEnter("back")}
        onMouseLeave={handleMouseLeave}
        className={getButtonClasses(backButtonEnabled, "Y", "back")}
        tabIndex={nextTabIndex}
      >
        <FaArrowLeft className="transition-all duration-300 hover:-translate-x-1" /> 
        <span className="relative">
          Back
          <span className="absolute -bottom-1 left-0 w-0 group-hover:w-full h-0.5 bg-white transition-all duration-300"></span>
        </span>
      </button>

      {component}
    </div>
  );
};

export default ActionButtonGroup;

