import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { C, FONTS } from '../theme';

export default function KPICard({ label, value, accent = C.accent, sub }) {
  return (
    <View style={[styles.card, { borderTopColor: accent }]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color: accent }]}>{value ?? '—'}</Text>
      {sub ? <Text style={styles.sub}>{sub}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 14,
    borderTopWidth: 2.5,
    borderWidth: 1,
    borderColor: C.border,
    minWidth: 100,
  },
  label: {
    color: C.muted,
    fontSize: 11,
    fontFamily: FONTS.semi,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  value: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    letterSpacing: -0.5,
  },
  sub: {
    color: C.dimmed,
    fontSize: 11,
    fontFamily: FONTS.regular,
    marginTop: 3,
  },
});
