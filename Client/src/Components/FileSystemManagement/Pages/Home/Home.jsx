import React, { useRef } from "react";
import "./Home.css";
import { useNavigate } from "react-router-dom";
import logo from "../../../../Assets/fileimage.jpg";
import logo1 from "../../../../Assets/filesearch.jpg";
import cupboard from "../../../../Assets/cupboard.png";
import fileshift from "../../../../Assets/fileshift.jpg";
import CardButton from "../../../../Common/FileSystemManagementCommon/CardButton";

const Home = () => {
  const navigate = useNavigate();
  const cupBoardButtonRef = useRef(null);

  const handleCupBoardClick = () => {
    navigate("/filesystemcupboardUtility");
  };

  const handleFileInfo = () => {
    navigate("/filemanagementutility");
  };

  const handleSearchFile = () => {
    navigate("/searchfile");
  };

  const handlefileShifting = () => {
    navigate("/fileshifting");
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '80vh',
      gap: '2rem',
      flexWrap: 'wrap',
      padding: '20px'
    }}>
      <CardButton
        image={cupboard}
        title="CupBoard Master"
        onClick={handleCupBoardClick}
        variant="primary"
      />

      <CardButton
        image={logo}
        title="File Information"
        onClick={handleFileInfo}
      />

      <CardButton
        image={logo1}
        title="File Search"
        onClick={handleSearchFile}
      />
      <CardButton
        image={fileshift}
        title="File Shifting"
        onClick={handlefileShifting}
      />
    </div>
  );
};

export default Home;