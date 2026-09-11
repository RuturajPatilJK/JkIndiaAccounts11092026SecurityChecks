import React from 'react';
import QRCode from 'qrcode.react';

const QRCodeComponent = ({ value }) => {
  return (
    <div> 
      <QRCode value={value} size={280}  />
    </div>
  );
};

export default QRCodeComponent;
