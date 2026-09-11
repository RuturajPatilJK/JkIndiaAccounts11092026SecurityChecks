import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
  Animated, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCompanies, userLogin, getGAPermission } from '../services/api';
import { C, FONTS } from '../theme';

const JK_LOGO = require('../../assets/jkindia.png');

export default function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [companies, setCompanies]           = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showPicker, setShowPicker]         = useState(false);
  const [username, setUsername]             = useState('');
  const [password, setPassword]             = useState('');
  const [showPass, setShowPass]             = useState(false);
  const [loading, setLoading]               = useState(false);
  const [loadingCo, setLoadingCo]           = useState(true);
  const [error, setError]                   = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }).start();
    checkSession();
    loadCompanies();
  }, []);

  const checkSession = async () => {
    const user = await AsyncStorage.getItem('username');
    if (user) navigation.replace('DashboardHome');
  };

  const loadCompanies = async () => {
    try {
      const res = await getCompanies();
      const list = res.data.Company_Data || [];
      setCompanies(list);
      if (list.length > 0) setSelectedCompany(list[0]);
    } catch {
      setError('Could not load companies. Check server connection.');
    } finally {
      setLoadingCo(false);
    }
  };

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Username and password are required.');
      return;
    }
    if (!selectedCompany) {
      setError('Please select a company.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await userLogin(username.trim(), password, selectedCompany.Company_Code);
      const uid = res.data.user_id;

      let hasGA = false;
      try {
        const perm = await getGAPermission(selectedCompany.Company_Code, uid);
        hasGA = perm.data?.UserDetails?.canView === 'Y';
      } catch {}

      await AsyncStorage.multiSet([
        ['username', username.trim()],
        ['uid', String(uid)],
        ['Company_Code', String(selectedCompany.Company_Code)],
        ['Company_Name', selectedCompany.Company_Name_E || ''],
        ['has_ga_permission', hasGA ? 'Y' : 'N'],
      ]);

      navigation.replace('DashboardHome');
    } catch (e) {
      setError(e.response?.data?.error || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#042a1c', '#0a1810', '#080c14']} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* Brand */}
            <View style={styles.brand}>
              <View style={styles.logoBadge}>
                <Image source={JK_LOGO} style={styles.logoImg} resizeMode="contain" />
              </View>
              <Text style={styles.brandName}>JK India · eAgriTech</Text>
              <Text style={styles.brandSub}>Google Analytics Platform</Text>
            </View>

            {/* Card */}
            <View style={styles.card}>
              <Text style={styles.cardHeading}>Sign In</Text>
              <Text style={styles.cardHint}>Select your company, then enter credentials.</Text>

              {/* Company picker */}
              <Text style={styles.label}>Company</Text>
              {loadingCo ? (
                <ActivityIndicator color={C.accent} style={{ marginVertical: 12 }} />
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.input, styles.pickerRow]}
                    onPress={() => setShowPicker(v => !v)}
                    activeOpacity={0.8}
                  >
                    <Text style={{ color: selectedCompany ? C.text : C.muted, fontFamily: FONTS.regular, fontSize: 15 }}>
                      {selectedCompany?.Company_Name_E || 'Select company…'}
                    </Text>
                    <Text style={{ color: C.muted, fontSize: 13 }}>{showPicker ? '▲' : '▼'}</Text>
                  </TouchableOpacity>
                  {showPicker && (
                    <View style={styles.dropdown}>
                      {companies.map((co) => (
                        <TouchableOpacity
                          key={co.Company_Code}
                          style={[styles.dropItem, selectedCompany?.Company_Code === co.Company_Code && styles.dropItemActive]}
                          onPress={() => { setSelectedCompany(co); setShowPicker(false); }}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.dropText, selectedCompany?.Company_Code === co.Company_Code && { color: C.accent, fontFamily: FONTS.bold }]}>
                            {co.Company_Name_E}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </>
              )}

              {/* Username */}
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={t => { setUsername(t); setError(''); }}
                placeholder="Enter username"
                placeholderTextColor={C.muted}
                autoCapitalize="none"
                autoCorrect={false}
                color={C.text}
                fontFamily={FONTS.regular}
              />

              {/* Password */}
              <Text style={styles.label}>Password</Text>
              <View style={[styles.input, styles.passRow]}>
                <TextInput
                  style={{ flex: 1, color: C.text, fontFamily: FONTS.regular, fontSize: 15 }}
                  value={password}
                  onChangeText={t => { setPassword(t); setError(''); }}
                  placeholder="Enter password"
                  placeholderTextColor={C.muted}
                  secureTextEntry={!showPass}
                  autoCorrect={false}
                />
                <TouchableOpacity onPress={() => setShowPass(v => !v)}>
                  <Text style={{ color: C.muted, fontSize: 15, paddingLeft: 8 }}>{showPass ? '👁' : '🔒'}</Text>
                </TouchableOpacity>
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity
                style={[styles.loginBtn, loading && { opacity: 0.6 }]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                <LinearGradient colors={['#0e5e40', '#045e32']} style={styles.loginBtnInner}>
                  {loading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.loginBtnText}>Sign In  →</Text>
                  }
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <Text style={styles.footer}>JK India eAgriTech · Analytics v1.0</Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, padding: 24 },
  brand: { alignItems: 'center', marginBottom: 32 },
  logoBadge: {
    width: 80, height: 80, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.93)',
    borderWidth: 2, borderColor: 'rgba(201,162,75,0.4)',
    padding: 6,
  },
  logoImg: { width: 68, height: 68 },
  brandName: { color: C.text, fontSize: 21, fontFamily: FONTS.bold, marginBottom: 5 },
  brandSub: { color: C.muted, fontSize: 13, fontFamily: FONTS.regular },
  card: {
    backgroundColor: 'rgba(255,255,255,0.055)',
    borderRadius: 22,
    padding: 24,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardHeading: { color: C.text, fontSize: 22, fontFamily: FONTS.bold, marginBottom: 6 },
  cardHint: { color: C.muted, fontSize: 13, fontFamily: FONTS.regular, marginBottom: 20, lineHeight: 18 },
  label: {
    color: C.dimmed,
    fontSize: 11,
    fontFamily: FONTS.semi,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 13,
    fontSize: 15,
  },
  pickerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  passRow: { flexDirection: 'row', alignItems: 'center' },
  dropdown: {
    backgroundColor: '#0d2a1e',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    marginTop: 4,
    overflow: 'hidden',
  },
  dropItem: { padding: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  dropItemActive: { backgroundColor: 'rgba(201,162,75,0.1)' },
  dropText: { color: C.text, fontFamily: FONTS.regular, fontSize: 14 },
  errorText: { color: C.error, fontSize: 13, fontFamily: FONTS.regular, marginTop: 12 },
  loginBtn: { marginTop: 24, borderRadius: 14, overflow: 'hidden' },
  loginBtnInner: { padding: 16, alignItems: 'center' },
  loginBtnText: { color: '#fff', fontSize: 16, fontFamily: FONTS.bold, letterSpacing: 0.4 },
  footer: { color: C.dimmed, fontSize: 11, fontFamily: FONTS.regular, textAlign: 'center', marginTop: 28 },
});
