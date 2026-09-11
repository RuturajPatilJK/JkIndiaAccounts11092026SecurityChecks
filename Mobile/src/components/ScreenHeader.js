import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, FONTS } from '../theme';

export default function ScreenHeader({ title, subtitle, accent = C.accent, onBack, badge, logoSrc, logoBg }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
        <Text style={[styles.backIcon, { color: accent }]}>{'←'}</Text>
      </TouchableOpacity>

      {logoSrc ? (
        <View style={[styles.logoPill, { backgroundColor: logoBg || 'rgba(255,255,255,0.93)' }]}>
          <Image source={logoSrc} style={styles.logoImg} resizeMode="contain" />
        </View>
      ) : null}

      <View style={styles.titleArea}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{title}</Text>
          {badge ? (
            <View style={[styles.badge, { backgroundColor: accent + '33', borderColor: accent + '66' }]}>
              <View style={[styles.badgeDot, { backgroundColor: accent }]} />
              <Text style={[styles.badgeText, { color: accent }]}>{badge}</Text>
            </View>
          ) : null}
        </View>
        {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: C.bg,
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
    flexShrink: 0,
  },
  backIcon: { fontSize: 18, fontFamily: FONTS.bold },
  logoPill: {
    width: 44,
    height: 44,
    borderRadius: 10,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  logoImg: { width: 36, height: 36 },
  titleArea: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { color: C.text, fontSize: 17, fontFamily: FONTS.bold },
  sub: { color: C.muted, fontSize: 11, fontFamily: FONTS.regular, marginTop: 2 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
    borderWidth: 1,
  },
  badgeDot: { width: 5, height: 5, borderRadius: 99 },
  badgeText: { fontSize: 10, fontFamily: FONTS.bold, letterSpacing: 0.5 },
});
