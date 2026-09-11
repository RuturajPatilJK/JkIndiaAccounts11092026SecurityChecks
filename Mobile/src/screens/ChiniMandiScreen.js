import React from 'react';
import GASiteScreen from '../components/GASiteScreen';

const LOGO = require('../../assets/chinimandi.png');

export default function ChiniMandiScreen({ navigation }) {
  return (
    <GASiteScreen
      navigation={navigation}
      siteKey="chinimandi"
      title="ChiniMandi"
      subtitle="chinimandi.com"
      accent="#c9a24b"
      url="chinimandi.com"
      logoSrc={LOGO}
      logoBg="rgba(255,255,255,0.95)"
    />
  );
}
