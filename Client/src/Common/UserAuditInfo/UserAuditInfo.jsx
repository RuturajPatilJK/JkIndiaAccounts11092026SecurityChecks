import React from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

const UserAuditInfo = ({ createdBy, modifiedBy, title }) => {
  return (
    <>
      <Box sx={{
        padding: '10px',
        marginTop: '20px',
        maxWidth: '250px',
        width: '80%',
        borderRadius: '4px',
      }}>
        <Typography variant="subtitle2" gutterBottom component="h2" sx={{
          fontSize: '14px',
          color: 'blue',
          fontWeight: 'bold',
          letterSpacing: '1px',
          borderBottom: '2px solid blue',
          paddingBottom: '5px',
        }}>
          Created By: {createdBy}
        </Typography>
      </Box>

      <Box sx={{
        padding: '10px',
        float: 'right',
        maxWidth: '250px',
        width: '80%',
        marginTop: '-43px',
        borderRadius: '4px',
      }}>
        <Typography variant="subtitle2" gutterBottom component="h2" sx={{
          fontSize: '14px',
          color: 'blue',
          margin: 0,
          fontWeight: 'bold',
          letterSpacing: '1px',
          borderBottom: '2px solid blue',
          paddingBottom: '5px',
        }}>
          Modified By: {modifiedBy}
        </Typography>
      </Box>

      <Typography variant="subtitle2" gutterBottom component="h2" sx={{
        fontSize: '20px',
        color: 'black',
        fontWeight: 'bold',
        letterSpacing: '1px',
        marginTop:"-30px",
        textAlign:"center",
        marginLeft:"200px"
      }}>
        {title}
      </Typography>
    </>
  );
};

export default UserAuditInfo;
