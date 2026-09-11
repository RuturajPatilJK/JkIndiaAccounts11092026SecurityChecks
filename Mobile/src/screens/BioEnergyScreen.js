import React from 'react';
import GASiteScreen from '../components/GASiteScreen';

const LOGO = require('../../assets/bioenergytimes.png');

export default function BioEnergyScreen({ navigation }) {
  return (
    <GASiteScreen
      navigation={navigation}
      siteKey="bioenergy"
      title="BioEnergy Times"
      subtitle="bioenergytimes.com"
      accent="#22c55e"
      url="bioenergytimes.com"
      logoSrc={LOGO}
      logoBg="rgba(255,255,255,0.95)"
    />
  );
}
