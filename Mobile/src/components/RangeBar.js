import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { C, FONTS } from '../theme';

export default function RangeBar({ options, selected, onSelect, accent = C.accent }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll} contentContainerStyle={styles.container}>
      {options.map((opt) => {
        const active = selected === opt.key;
        return (
          <TouchableOpacity
            key={opt.key}
            onPress={() => onSelect(opt.key)}
            style={[styles.pill, active && { backgroundColor: accent, borderColor: accent }]}
            activeOpacity={0.75}
          >
            <Text style={[styles.pillText, active && { color: '#fff', fontFamily: FONTS.bold }]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0 },
  container: { paddingHorizontal: 4, paddingVertical: 2, gap: 8, flexDirection: 'row' },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
  },
  pillText: {
    color: C.muted,
    fontSize: 13,
    fontFamily: FONTS.semi,
  },
});
