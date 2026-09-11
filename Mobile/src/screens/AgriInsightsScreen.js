import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  TextInput, TouchableOpacity, Dimensions,
} from 'react-native';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import { getAgriInsights } from '../services/api';
import { C, FONTS, AI_RANGE_OPTIONS } from '../theme';
import KPICard from '../components/KPICard';
import RangeBar from '../components/RangeBar';
import ChartCard from '../components/ChartCard';
import ScreenHeader from '../components/ScreenHeader';

const LOGO = require('../../assets/agriinsite.png');

const { width: SW } = Dimensions.get('window');
const PAD = 18;
const CHART_W = SW - PAD * 2 - 32;
const ACCENT = '#06b6d4';
const CAT_COLORS = ['#013720', '#c9a24b', '#0b6e6e', '#b45309', '#7c3aed', '#0ea5e9', '#dc2626', '#16a34a'];

const fmt = (n) => {
  if (n === undefined || n === null) return '—';
  const v = parseFloat(n);
  if (isNaN(v)) return '—';
  return Math.round(v).toLocaleString('en-IN');
};

const today = () => new Date().toISOString().slice(0, 10);

export default function AgriInsightsScreen({ navigation }) {
  const [range, setRange]       = useState('today');
  const [start, setStart]       = useState(today());
  const [end, setEnd]           = useState(today());
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  const fetch = useCallback((r, s, e) => {
    setLoading(true);
    setError(null);
    getAgriInsights(r, s, e)
      .then(res => setData(res.data || null))
      .catch(er => setError(er.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetch('today', '', ''); }, [fetch]);

  const handleRange = (r) => {
    setRange(r);
    if (r !== 'custom') fetch(r, '', '');
  };

  const handleCustomApply = () => fetch('custom', start, end);

  const categories = data?.categories || {};
  const catEntries = Object.entries(categories).sort((a, b) => b[1] - a[1]);
  const languages = data?.languages || {};
  const langEntries = Object.entries(languages).sort((a, b) => b[1] - a[1]);

  // Category bar chart
  const catBar = catEntries.slice(0, 8).map(([name, val], i) => ({
    value: val,
    label: name.slice(0, 14),
    frontColor: CAT_COLORS[i % CAT_COLORS.length],
  }));

  // Language pie
  const langPie = langEntries.slice(0, 6).map(([lang, val], i) => ({
    value: val,
    color: CAT_COLORS[i % CAT_COLORS.length],
    label: lang,
    text: lang.slice(0, 2).toUpperCase(),
  }));

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="AgriInsights"
        subtitle="agriinsite.com"
        accent={ACCENT}
        badge="Live"
        logoSrc={LOGO}
        logoBg="rgba(255,255,255,0.95)"
        onBack={() => navigation.goBack()}
      />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Range bar */}
        <RangeBar options={AI_RANGE_OPTIONS} selected={range} onSelect={handleRange} accent={ACCENT} />

        {/* Custom date row */}
        {range === 'custom' && (
          <View style={styles.customRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.dateLabel}>Start Date</Text>
              <TextInput
                style={styles.dateInput}
                value={start}
                onChangeText={setStart}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={C.dimmed}
                color={C.text}
                fontFamily={FONTS.regular}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.dateLabel}>End Date</Text>
              <TextInput
                style={styles.dateInput}
                value={end}
                onChangeText={setEnd}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={C.dimmed}
                color={C.text}
                fontFamily={FONTS.regular}
              />
            </View>
            <TouchableOpacity style={[styles.applyBtn, { borderColor: ACCENT }]} onPress={handleCustomApply} activeOpacity={0.8}>
              <Text style={[styles.applyText, { color: ACCENT }]}>Apply</Text>
            </TouchableOpacity>
          </View>
        )}

        {loading && (
          <View style={styles.loadBox}>
            <ActivityIndicator color={ACCENT} size="large" />
            <Text style={styles.loadText}>Fetching AgriInsights…</Text>
          </View>
        )}

        {error && !loading && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠ {error}</Text>
            <TouchableOpacity onPress={() => fetch(range, start, end)} style={[styles.retryBtn, { borderColor: ACCENT }]}>
              <Text style={[styles.retryText, { color: ACCENT }]}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && data && (
          <>
            {/* KPIs */}
            <View style={styles.kpiRow}>
              <KPICard label="Total Articles" value={fmt(data.total)} accent={ACCENT} />
              <KPICard label="Users (WP)"     value={fmt(data.traffic?.users)} accent="#22c55e" />
            </View>
            <View style={styles.kpiRow}>
              <KPICard label="Page Views"     value={fmt(data.traffic?.views)} accent="#a855f7" />
              <KPICard label="Categories"     value={fmt(catEntries.length)} accent={C.muted} />
            </View>

            {/* Category bar chart */}
            {catBar.length > 0 && (
              <ChartCard title="Articles by Category">
                <BarChart
                  data={catBar}
                  width={CHART_W}
                  height={200}
                  barWidth={30}
                  spacing={10}
                  roundedTop
                  xAxisLabelTextStyle={{ color: C.dimmed, fontSize: 8, fontFamily: FONTS.regular }}
                  yAxisTextStyle={{ color: C.dimmed, fontSize: 9, fontFamily: FONTS.regular }}
                  xAxisColor={C.border}
                  yAxisColor={C.border}
                  rulesColor={C.border}
                  backgroundColor="transparent"
                  noOfSections={4}
                  isAnimated
                />
                <View style={{ marginTop: 12 }}>
                  {catEntries.slice(0, 8).map(([name, val], i) => (
                    <View key={name} style={styles.catRow}>
                      <View style={[styles.catDot, { backgroundColor: CAT_COLORS[i % CAT_COLORS.length] }]} />
                      <Text style={styles.catName} numberOfLines={1}>{name}</Text>
                      <Text style={[styles.catVal, { color: CAT_COLORS[i % CAT_COLORS.length] }]}>{fmt(val)}</Text>
                    </View>
                  ))}
                </View>
              </ChartCard>
            )}

            {/* Languages pie */}
            {langPie.length > 0 && (
              <ChartCard title="Articles by Language">
                <View style={styles.pieWrap}>
                  <PieChart
                    data={langPie}
                    donut
                    radius={80}
                    innerRadius={50}
                    centerLabelComponent={() => (
                      <View style={{ alignItems: 'center' }}>
                        <Text style={{ color: C.text, fontFamily: FONTS.bold, fontSize: 16 }}>{fmt(data.total)}</Text>
                        <Text style={{ color: C.muted, fontFamily: FONTS.regular, fontSize: 9 }}>total</Text>
                      </View>
                    )}
                  />
                </View>
                <View style={styles.legend}>
                  {langPie.map((d) => (
                    <View key={d.label} style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: d.color }]} />
                      <Text style={styles.legendLabel}>{d.label}</Text>
                      <Text style={[styles.legendVal, { color: d.color }]}>{fmt(d.value)}</Text>
                    </View>
                  ))}
                </View>
              </ChartCard>
            )}

            {catEntries.length === 0 && langEntries.length === 0 && (
              <Text style={styles.noData}>No category or language data for this range.</Text>
            )}
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: PAD, paddingTop: 14 },
  customRow: { flexDirection: 'row', gap: 8, marginTop: 10, marginBottom: 6, alignItems: 'flex-end' },
  dateLabel: { color: C.dimmed, fontSize: 10, fontFamily: FONTS.semi, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  dateInput: {
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    borderRadius: 10, padding: 10, fontSize: 13, color: C.text,
  },
  applyBtn: {
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 14,
    paddingVertical: 10, alignSelf: 'flex-end',
  },
  applyText: { fontFamily: FONTS.semi, fontSize: 13 },
  loadBox: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  loadText: { color: C.muted, fontFamily: FONTS.regular, fontSize: 13 },
  errorBox: { alignItems: 'center', paddingVertical: 30, gap: 12 },
  errorText: { color: C.error, fontFamily: FONTS.semi, fontSize: 14, textAlign: 'center' },
  retryBtn: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 9 },
  retryText: { fontFamily: FONTS.semi, fontSize: 14 },
  kpiRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: C.border },
  catDot: { width: 9, height: 9, borderRadius: 4.5 },
  catName: { flex: 1, color: C.text, fontFamily: FONTS.regular, fontSize: 13 },
  catVal: { fontFamily: FONTS.bold, fontSize: 13 },
  pieWrap: { alignItems: 'center', paddingVertical: 8 },
  legend: { marginTop: 14, gap: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { flex: 1, color: C.text, fontFamily: FONTS.regular, fontSize: 13 },
  legendVal: { fontFamily: FONTS.bold, fontSize: 14 },
  noData: { color: C.muted, fontFamily: FONTS.regular, fontSize: 13, textAlign: 'center', paddingVertical: 30 },
});
