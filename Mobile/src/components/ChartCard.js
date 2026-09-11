import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { C, FONTS } from '../theme';

export default function ChartCard({ title, children, style }) {
  return (
    <View style={[styles.card, style]}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 14,
  },
  title: {
    color: C.muted,
    fontSize: 11,
    fontFamily: FONTS.semi,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 14,
  },
});
