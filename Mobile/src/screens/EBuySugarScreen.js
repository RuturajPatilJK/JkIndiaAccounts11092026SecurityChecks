import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  TextInput, TouchableOpacity, Dimensions,
} from 'react-native';
import { BarChart, LineChart } from 'react-native-gifted-charts';
import { getEBuySugar } from '../services/api';
import { C, FONTS, EBS_RANGE_OPTIONS } from '../theme';
import KPICard from '../components/KPICard';
import RangeBar from '../components/RangeBar';
import ChartCard from '../components/ChartCard';
import ScreenHeader from '../components/ScreenHeader';

const LOGO = require('../../assets/ebuysugar.png');

const { width: SW } = Dimensions.get('window');
const PAD = 18;
const CHART_W = SW - PAD * 2 - 32;
const ACCENT = '#b45309';
const EBS_COLS = ['#b45309', '#d97706', '#f59e0b', '#fbbf24', '#92400e', '#78350f'];

const fmt = (n) => {
  if (n === undefined || n === null || n === '') return '—';
  const v = parseFloat(String(n).replace(/[₹,\s]/g, ''));
  if (isNaN(v)) return String(n);
  return Math.round(v).toLocaleString('en-IN');
};

const fmtCr = (v) => {
  const n = parseFloat(v) || 0;
  const cr = n / 10000000;
  if (cr >= 1000) return (cr / 1000).toFixed(1) + 'K Cr';
  return cr.toFixed(2) + ' Cr';
};

const fmtMonth = (ym) => {
  if (!ym || ym.length < 7) return ym || '';
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(ym.slice(5, 7), 10) - 1]} '${ym.slice(2, 4)}`;
};

const parseEBS = (info = []) => {
  const m = {};
  info.forEach((item) => { m[item.id] = item; });
  return {
    availableSugar:        m[1]?.count,
    activeSellerCount:     m[2]?.count,
    availableQty:          m[3]?.count,
    filteredSaleVolumeRs:  m[4]?.count,
    filteredSaleVolumeQtl: m[5]?.count,
    totalSaleVolumeRs:     m[6]?.count,
    totalSaleVolumeQtl:    m[7]?.count,
    filteredRegUsers:      m[8]?.count,
    totalUsers:            m[9]?.count,
    monthlyTrades:         Array.isArray(m[10]?.count) ? m[10].count : [],
    filteredTradesCount:   m[11]?.count,
    filteredActiveUsers:   m[12]?.count,
    monthlyActiveUsers:    Array.isArray(m[13]?.count) ? m[13].count : [],
  };
};

const today = () => new Date().toISOString().slice(0, 10);

export default function EBuySugarScreen({ navigation }) {
  const [range, setRange]     = useState('today');
  const [start, setStart]     = useState(today());
  const [end, setEnd]         = useState(today());
  const [raw, setRaw]         = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [activeTab, setActiveTab] = useState('kpis');

  const fetch = useCallback((r, s, e) => {
    setLoading(true);
    setError(null);
    getEBuySugar(r, s, e)
      .then(res => setRaw(res.data || null))
      .catch(er => setError(er.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetch('today', '', ''); }, [fetch]);

  const handleRange = (r) => {
    setRange(r);
    if (r !== 'custom') fetch(r, '', '');
  };

  const handleCustomApply = () => fetch('custom', start, end);

  const parsed = raw ? parseEBS(raw.info || []) : null;

  const tradeData = parsed
    ? [...parsed.monthlyTrades].reverse().map((m) => ({
        value: parseInt(m.total_trades) || 0,
        label: (m.month_year || '').slice(-5),
        qty: parseInt(m.total_qty_sold) || 0,
        saleValueCr: parseFloat(m.total_sale_value) / 10000000,
        frontColor: ACCENT,
      }))
    : [];

  const saleValueData = tradeData.map((d) => ({
    value: parseFloat(d.saleValueCr.toFixed(2)),
    label: d.label,
  }));

  const usersData = parsed
    ? [...parsed.monthlyActiveUsers].reverse().map((m, i) => ({
        value: parseInt(m.total_active_users) || 0,
        label: fmtMonth(m.month).replace(/ '.*/, ''),
        frontColor: EBS_COLS[i % EBS_COLS.length],
      }))
    : [];

  const TABS = ['kpis', 'trades', 'users'];

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="eBuySugar"
        subtitle="ebuysugar.com · Online Sugar Trading"
        accent={ACCENT}
        badge="Live"
        logoSrc={LOGO}
        logoBg="rgba(255,255,255,0.95)"
        onBack={() => navigation.goBack()}
      />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Range bar */}
        <RangeBar options={EBS_RANGE_OPTIONS} selected={range} onSelect={handleRange} accent={ACCENT} />

        {/* Custom date row */}
        {range === 'custom' && (
          <View style={styles.customRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.dateLabel}>Start</Text>
              <TextInput style={styles.dateInput} value={start} onChangeText={setStart}
                placeholder="YYYY-MM-DD" placeholderTextColor={C.dimmed} color={C.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.dateLabel}>End</Text>
              <TextInput style={styles.dateInput} value={end} onChangeText={setEnd}
                placeholder="YYYY-MM-DD" placeholderTextColor={C.dimmed} color={C.text} />
            </View>
            <TouchableOpacity style={[styles.applyBtn, { borderColor: ACCENT }]} onPress={handleCustomApply}>
              <Text style={[styles.applyText, { color: ACCENT }]}>Apply</Text>
            </TouchableOpacity>
          </View>
        )}

        {loading && (
          <View style={styles.loadBox}>
            <ActivityIndicator color={ACCENT} size="large" />
            <Text style={styles.loadText}>Loading eBuySugar data…</Text>
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

        {!loading && parsed && (
          <>
            {/* Tab bar */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabRow}>
              {TABS.map(tab => (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  style={[styles.tab, activeTab === tab && { backgroundColor: ACCENT, borderColor: ACCENT }]}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.tabText, activeTab === tab && { color: '#fff', fontFamily: FONTS.bold }]}>
                    {tab === 'kpis' ? 'Overview' : tab === 'trades' ? 'Trade Activity' : 'Active Users'}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* ── Overview / KPIs ── */}
            {activeTab === 'kpis' && (
              <>
                {/* Period metrics */}
                <Text style={styles.groupLabel}>Period Metrics ({range.replace(/_/g, ' ').toUpperCase()})</Text>
                <View style={styles.kpiRow}>
                  <KPICard label="Sell Volume (Qtl)"   value={fmt(parsed.filteredSaleVolumeQtl)} accent={ACCENT} />
                  <KPICard label="Sale Amount"         value={parsed.filteredSaleVolumeRs || '—'} accent={ACCENT} />
                </View>
                <View style={styles.kpiRow}>
                  <KPICard label="No. of Trades"       value={fmt(parsed.filteredTradesCount)}    accent={ACCENT} />
                  <KPICard label="New Users"            value={fmt(parsed.filteredRegUsers)}       accent='#d97706' />
                </View>
                <View style={styles.kpiRow}>
                  <KPICard label="Daily Active Users"  value={fmt(parsed.filteredActiveUsers)}    accent='#f59e0b' />
                  <View style={{ flex: 1 }} />
                </View>

                {/* All-time metrics */}
                <Text style={[styles.groupLabel, { marginTop: 8 }]}>All-Time Platform Totals</Text>
                <View style={styles.kpiRow}>
                  <KPICard label="Total Sale (Qtl)"    value={fmt(parsed.totalSaleVolumeQtl)} accent={C.muted} />
                  <KPICard label="Total Sale Value"    value={parsed.totalSaleVolumeRs || '—'} accent={C.muted} />
                </View>
                <View style={styles.kpiRow}>
                  <KPICard label="Available Sugar"     value={fmt(parsed.availableSugar)}    accent={C.muted} />
                  <KPICard label="Active Sellers"      value={fmt(parsed.activeSellerCount)} accent={C.muted} />
                </View>
                <View style={styles.kpiRow}>
                  <KPICard label="Available Qty (Qtl)" value={fmt(parsed.availableQty)}     accent={C.muted} />
                  <KPICard label="Total Users"          value={fmt(parsed.totalUsers)}       accent={C.muted} />
                </View>
              </>
            )}

            {/* ── Trade Activity ── */}
            {activeTab === 'trades' && (
              <>
                <ChartCard title="Monthly Trade Count">
                  {tradeData.length > 0 ? (
                    <BarChart
                      data={tradeData}
                      width={CHART_W}
                      height={180}
                      barWidth={28}
                      spacing={10}
                      roundedTop
                      frontColor={ACCENT}
                      xAxisLabelTextStyle={{ color: C.dimmed, fontSize: 8, fontFamily: FONTS.regular }}
                      yAxisTextStyle={{ color: C.dimmed, fontSize: 9, fontFamily: FONTS.regular }}
                      xAxisColor={C.border}
                      yAxisColor={C.border}
                      rulesColor={C.border}
                      backgroundColor="transparent"
                      noOfSections={4}
                      isAnimated
                    />
                  ) : <Text style={styles.noData}>No trade data available</Text>}
                </ChartCard>

                <ChartCard title="Monthly Sale Value (₹ Crore)">
                  {saleValueData.length > 0 ? (
                    <LineChart
                      data={saleValueData}
                      width={CHART_W}
                      height={180}
                      color={ACCENT}
                      thickness={2.5}
                      curved
                      hideDataPoints={saleValueData.length > 10}
                      dataPointsColor={ACCENT}
                      dataPointsRadius={4}
                      xAxisLabelTextStyle={{ color: C.dimmed, fontSize: 8, fontFamily: FONTS.regular }}
                      yAxisTextStyle={{ color: C.dimmed, fontSize: 9, fontFamily: FONTS.regular }}
                      xAxisColor={C.border}
                      yAxisColor={C.border}
                      rulesColor={C.border}
                      backgroundColor="transparent"
                      noOfSections={4}
                      adjustToWidth
                      formatYLabel={(v) => parseFloat(v).toFixed(1) + ' Cr'}
                    />
                  ) : <Text style={styles.noData}>No sale value data</Text>}
                </ChartCard>

                {/* Trade table */}
                {tradeData.length > 0 && (
                  <ChartCard title="Monthly Breakdown">
                    <View style={styles.tableHeader}>
                      <Text style={[styles.thCell, { flex: 1.2 }]}>Month</Text>
                      <Text style={[styles.thCell, { flex: 0.8 }]}>Trades</Text>
                      <Text style={[styles.thCell, { flex: 1 }]}>Qty (Qtl)</Text>
                      <Text style={[styles.thCell, { flex: 1.2 }]}>Value (Cr)</Text>
                    </View>
                    {tradeData.map((row, i) => (
                      <View key={i} style={[styles.tableRow, i % 2 === 0 && styles.tableRowAlt]}>
                        <Text style={[styles.tdCell, { flex: 1.2, color: ACCENT }]}>{row.label}</Text>
                        <Text style={[styles.tdCell, { flex: 0.8 }]}>{fmt(row.value)}</Text>
                        <Text style={[styles.tdCell, { flex: 1 }]}>{fmt(row.qty)}</Text>
                        <Text style={[styles.tdCell, { flex: 1.2 }]}>₹{row.saleValueCr.toFixed(2)} Cr</Text>
                      </View>
                    ))}
                  </ChartCard>
                )}
              </>
            )}

            {/* ── Active Users ── */}
            {activeTab === 'users' && (
              <ChartCard title="Monthly Active Users">
                {usersData.length > 0 ? (
                  <>
                    <BarChart
                      data={usersData}
                      width={CHART_W}
                      height={200}
                      barWidth={28}
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
                    <View style={{ marginTop: 14 }}>
                      {usersData.map((d, i) => (
                        <View key={i} style={styles.userRow}>
                          <View style={[styles.userDot, { backgroundColor: d.frontColor }]} />
                          <Text style={styles.userMonth}>{d.label}</Text>
                          <Text style={[styles.userVal, { color: d.frontColor }]}>{fmt(d.value)}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                ) : <Text style={styles.noData}>No active users data</Text>}
              </ChartCard>
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
  applyBtn: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, alignSelf: 'flex-end' },
  applyText: { fontFamily: FONTS.semi, fontSize: 13 },
  loadBox: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  loadText: { color: C.muted, fontFamily: FONTS.regular, fontSize: 13 },
  errorBox: { alignItems: 'center', paddingVertical: 30, gap: 12 },
  errorText: { color: C.error, fontFamily: FONTS.semi, fontSize: 14, textAlign: 'center' },
  retryBtn: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 9 },
  retryText: { fontFamily: FONTS.semi, fontSize: 14 },
  tabScroll: { flexGrow: 0, marginBottom: 16 },
  tabRow: { gap: 8, flexDirection: 'row' },
  tab: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 99, borderWidth: 1, borderColor: C.border,
    backgroundColor: C.surface,
  },
  tabText: { color: C.muted, fontSize: 13, fontFamily: FONTS.semi },
  groupLabel: {
    color: C.dimmed, fontSize: 10, fontFamily: FONTS.semi,
    textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10,
  },
  kpiRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  noData: { color: C.muted, fontFamily: FONTS.regular, fontSize: 13, textAlign: 'center', paddingVertical: 24 },
  tableHeader: {
    flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 4,
    borderBottomWidth: 1.5, borderBottomColor: C.border, marginBottom: 2,
  },
  thCell: { color: C.dimmed, fontSize: 10, fontFamily: FONTS.bold, textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 4 },
  tableRowAlt: { backgroundColor: 'rgba(255,255,255,0.025)', borderRadius: 6 },
  tdCell: { color: C.text, fontSize: 12, fontFamily: FONTS.regular },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: C.border },
  userDot: { width: 9, height: 9, borderRadius: 4.5 },
  userMonth: { flex: 1, color: C.text, fontFamily: FONTS.regular, fontSize: 13 },
  userVal: { fontFamily: FONTS.bold, fontSize: 14 },
});
