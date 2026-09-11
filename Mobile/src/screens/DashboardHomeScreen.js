import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  SafeAreaView, Animated, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { C, FONTS } from '../theme';

const LOGOS = {
  EBuySugar:   require('../../assets/ebuysugar.png'),
  ChiniMandi:  require('../../assets/chinimandi.png'),
  BioEnergy:   require('../../assets/bioenergytimes.png'),
  AgriInsights:require('../../assets/agriinsite.png'),
  SEIC:        require('../../assets/seic.png'),
};
const JK_LOGO = require('../../assets/jkindia.png');

const CARDS = [
  {
    screen:   'EBuySugar',
    label:    'eBuySugar',
    sub:      'Online sugar trading platform analytics',
    gradient: ['#431407', '#1a0703'],
    accent:   '#f59e0b',
    url:      'ebuysugar.com',
    logoBg:   'rgba(255,255,255,0.93)',
  },
  {
    screen:   'ChiniMandi',
    label:    'ChiniMandi',
    sub:      'Sugar industry news & market prices',
    gradient: ['#013720', '#01200f'],
    accent:   '#c9a24b',
    url:      'chinimandi.com',
    logoBg:   'rgba(255,255,255,0.93)',
  },
  {
    screen:   'BioEnergy',
    label:    'BioEnergy Times',
    sub:      'Renewable energy & biofuel insights',
    gradient: ['#0a3d1a', '#041509'],
    accent:   '#22c55e',
    url:      'bioenergytimes.com',
    logoBg:   'rgba(255,255,255,0.93)',
  },
  {
    screen:   'AgriInsights',
    label:    'AgriInsights',
    sub:      'Agriculture & commodity portal analytics',
    gradient: ['#093a3a', '#021414'],
    accent:   '#06b6d4',
    url:      'agriinsite.com',
    logoBg:   'rgba(255,255,255,0.93)',
  },
  {
    screen:   'SEIC',
    label:    'SEIC Conference',
    sub:      'Sugar & Ethanol India Conference · seic.events',
    gradient: ['#2e1065', '#0d0520'],
    accent:   '#96c23d',
    url:      'seic.events',
    logoBg:   '#7ba832',
  },
];

export default function DashboardHomeScreen({ navigation }) {
  const [username, setUsername]   = useState('');
  const [company, setCompany]     = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    AsyncStorage.multiGet(['username', 'Company_Name']).then(pairs => {
      setUsername(pairs[0][1] || 'User');
      setCompany(pairs[1][1] || '');
    });
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.clear();
    navigation.replace('Login');
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ backgroundColor: C.bg }}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoPill}>
              <Image source={JK_LOGO} style={styles.headerLogoImg} resizeMode="contain" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Google Analytics</Text>
              <Text style={styles.headerSub}>Live Dashboard · JK India eAgriTech</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn} activeOpacity={0.75}>
            <Text style={styles.logoutText}>Sign out</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll}>
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* User chip */}
          <View style={styles.userChip}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{username?.[0]?.toUpperCase() || 'U'}</Text>
            </View>
            <View>
              <Text style={styles.userName}>{username}</Text>
              {company ? <Text style={styles.userCompany}>{company}</Text> : null}
            </View>
          </View>

          <Text style={styles.sectionLabel}>Select Dashboard</Text>

          {CARDS.map((card) => (
            <TouchableOpacity
              key={card.screen}
              onPress={() => navigation.navigate(card.screen)}
              activeOpacity={0.82}
              style={styles.cardOuter}
            >
              <LinearGradient colors={card.gradient} style={styles.card}>
                {/* Shine overlay */}
                <View style={styles.shine} pointerEvents="none" />
                <View style={styles.cardBody}>
                  <View style={[styles.logoWrap, { backgroundColor: card.logoBg }]}>
                    <Image
                      source={LOGOS[card.screen]}
                      style={styles.cardLogo}
                      resizeMode="contain"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardLabel, { color: card.accent }]}>{card.label}</Text>
                    <Text style={styles.cardSub}>{card.sub}</Text>
                    <Text style={[styles.cardUrl, { color: card.accent + 'aa' }]}>{card.url}</Text>
                  </View>
                  <View style={[styles.arrowBadge, { borderColor: card.accent + '44', backgroundColor: card.accent + '18' }]}>
                    <Text style={[styles.arrowText, { color: card.accent }]}>→</Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}

          <Text style={styles.footer}>GA4 · Live · Real-time Analytics</Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  logoPill: {
    width: 44, height: 44, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.93)',
    borderWidth: 1.5, borderColor: 'rgba(201,162,75,0.4)',
    padding: 3,
  },
  headerLogoImg: { width: 36, height: 36 },
  headerTitle: { color: C.text, fontSize: 16, fontFamily: FONTS.bold },
  headerSub: { color: C.muted, fontSize: 11, fontFamily: FONTS.regular, marginTop: 1 },
  logoutBtn: {
    backgroundColor: C.surface,
    borderRadius: 8,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  logoutText: { color: C.muted, fontSize: 12, fontFamily: FONTS.semi },
  scroll: { padding: 18, paddingTop: 14 },
  userChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: C.border,
  },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#0e5e40',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: C.accent, fontSize: 16, fontFamily: FONTS.bold },
  userName: { color: C.text, fontSize: 15, fontFamily: FONTS.semi },
  userCompany: { color: C.muted, fontSize: 12, fontFamily: FONTS.regular, marginTop: 1 },
  sectionLabel: {
    color: C.dimmed,
    fontSize: 10,
    fontFamily: FONTS.semi,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  cardOuter: { marginBottom: 13, borderRadius: 20, overflow: 'hidden' },
  card: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    position: 'relative',
    overflow: 'hidden',
  },
  shine: {
    position: 'absolute',
    top: -60, right: -60,
    width: 180, height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  cardBody: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  logoWrap: {
    width: 52, height: 52, borderRadius: 12,
    padding: 5, alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  cardLogo: { width: 42, height: 42 },
  cardLabel: { fontSize: 17, fontFamily: FONTS.bold, marginBottom: 4 },
  cardSub: { color: C.muted, fontSize: 12.5, fontFamily: FONTS.regular, lineHeight: 18 },
  cardUrl: { fontSize: 11, fontFamily: FONTS.semi, marginTop: 4, letterSpacing: 0.3 },
  arrowBadge: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, flexShrink: 0,
  },
  arrowText: { fontSize: 16, fontFamily: FONTS.bold },
  footer: {
    color: C.dimmed,
    fontSize: 11,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
});
