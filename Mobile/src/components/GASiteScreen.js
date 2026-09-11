import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  Dimensions, TouchableOpacity,
} from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-gifted-charts';
import { getGA4 } from '../services/api';
import { C, FONTS, RANGE_OPTIONS } from '../theme';
import KPICard from './KPICard';
import RangeBar from './RangeBar';
import ChartCard from './ChartCard';
import ScreenHeader from './ScreenHeader';

const { width: SW } = Dimensions.get('window');
const PAD = 18;
const CHART_W = SW - PAD * 2 - 32;

const fmt = (n) => {
  if (n === undefined || n === null || n === '') return '—';
  const v = parseFloat(n);
  if (isNaN(v)) return '—';
  return Math.round(v).toLocaleString('en-IN');
};

const fmtPct = (n) => {
  if (!n) return '—';
  return (parseFloat(n) * 100).toFixed(1) + '%';
};

const fmtDur = (n) => {
  if (!n) return '—';
  const v = parseFloat(n);
  const m = Math.floor(v / 60);
  const s = Math.round(v % 60);
  return `${m}m ${s}s`;
};

const PIE_COLORS = ['#c9a24b', '#0ea5e9', '#22c55e', '#a855f7', '#f97316'];
const CHANNEL_COLORS = ['#0ea5e9', '#22c55e', '#a855f7', '#f97316', '#ec4899', '#14b8a6', '#f43f5e', '#8b5cf6'];

export default function GASiteScreen({ navigation, siteKey, title, subtitle, accent, url, logoSrc, logoBg }) {
  const [range, setRange]       = useState('week');
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const fetch = useCallback((r) => {
    setLoading(true);
    setError(null);
    getGA4(siteKey, r)
      .then(res => setData(res.data?.[siteKey] || null))
      .catch(e => setError(e.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [siteKey]);

  useEffect(() => { fetch(range); }, [fetch, range]);

  const kpi = data?.kpi || {};
  const trend = (data?.trend || []).slice(-14);
  const devices = data?.devices || [];
  const channels = data?.channels || [];
  const pages = data?.pages || [];
  const newsroom = data?.newsroom || {};

  // Chart data — Trend (line chart)
  const trendData = trend.map((t, i) => ({
    value: Math.round(t.activeUsers || 0),
    label: i % 3 === 0 ? (t.date || '').slice(4).replace(/(\d{2})(\d{2})/, '$1/$2') : '',
    dataPointText: '',
  }));

  // Device pie
  const pieData = devices.map((d, i) => ({
    value: Math.round(d.activeUsers || d.sessions || 0),
    color: PIE_COLORS[i % PIE_COLORS.length],
    text: (d.deviceCategory || '').slice(0, 1).toUpperCase(),
    label: d.deviceCategory || '',
  }));

  // Top pages bar
  const pageBar = pages.slice(0, 6).map((p, i) => ({
    value: Math.round(p.screenPageViews || 0),
    label: (p.pageTitle || '').slice(0, 20),
    frontColor: accent,
    topLabelComponent: () => (
      <Text style={{ color: C.muted, fontSize: 9, fontFamily: FONTS.regular }}>
        {fmt(p.screenPageViews)}
      </Text>
    ),
  }));

  // Channel bar
  const channelBar = channels.slice(0, 6).map((c, i) => ({
    value: Math.round(c.sessions || c.activeUsers || 0),
    label: (c.sessionDefaultChannelGroup || '').replace(' Search', '').slice(0, 12),
    frontColor: CHANNEL_COLORS[i % CHANNEL_COLORS.length],
  }));

  const TABS = ['overview', 'trends', 'devices', 'pages'];

  return (
    <View style={styles.root}>
      <ScreenHeader
        title={title}
        subtitle={url}
        accent={accent}
        badge="Live"
        logoSrc={logoSrc}
        logoBg={logoBg}
        onBack={() => navigation.goBack()}
      />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Range selector */}
        <RangeBar
          options={RANGE_OPTIONS}
          selected={range}
          onSelect={(r) => { setRange(r); fetch(r); }}
          accent={accent}
        />

        {loading && (
          <View style={styles.loadBox}>
            <ActivityIndicator color={accent} size="large" />
            <Text style={styles.loadText}>Fetching analytics…</Text>
          </View>
        )}

        {error && !loading && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠ {error}</Text>
            <TouchableOpacity onPress={() => fetch(range)} style={[styles.retryBtn, { borderColor: accent }]}>
              <Text style={[styles.retryText, { color: accent }]}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && data && (
          <>
            {/* Tab bar */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabRow}>
              {TABS.map(tab => (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  style={[styles.tab, activeTab === tab && { backgroundColor: accent, borderColor: accent }]}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.tabText, activeTab === tab && { color: '#fff', fontFamily: FONTS.bold }]}>
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* ── Overview ── */}
            {activeTab === 'overview' && (
              <>
                <View style={styles.kpiRow}>
                  <KPICard label="Active Users"  value={fmt(kpi.activeUsers)} accent={accent} />
                  <KPICard label="Page Views"    value={fmt(kpi.screenPageViews)} accent={accent} />
                </View>
                <View style={styles.kpiRow}>
                  <KPICard label="New Users"     value={fmt(kpi.newUsers)} accent={accent} />
                  <KPICard label="Sessions"      value={fmt(kpi.sessions)} accent={accent} />
                </View>
                <View style={styles.kpiRow}>
                  <KPICard label="Bounce Rate"   value={fmtPct(kpi.bounceRate)} accent={C.muted} />
                  <KPICard label="Avg Duration"  value={fmtDur(kpi.averageSessionDuration)} accent={C.muted} />
                </View>

                {/* Newsroom */}
                {newsroom.total > 0 && (
                  <ChartCard title="Newsroom · WordPress API">
                    <View style={styles.newsRow}>
                      <View style={styles.newsItem}>
                        <Text style={[styles.newsVal, { color: accent }]}>{fmt(newsroom.total)}</Text>
                        <Text style={styles.newsLabel}>Total Articles</Text>
                      </View>
                      <View style={styles.newsDivider} />
                      <View style={styles.newsItem}>
                        <Text style={[styles.newsVal, { color: '#0ea5e9' }]}>{fmt(newsroom.traffic?.users)}</Text>
                        <Text style={styles.newsLabel}>Users (WP)</Text>
                      </View>
                      <View style={styles.newsDivider} />
                      <View style={styles.newsItem}>
                        <Text style={[styles.newsVal, { color: '#22c55e' }]}>{fmt(newsroom.traffic?.views)}</Text>
                        <Text style={styles.newsLabel}>Views (WP)</Text>
                      </View>
                    </View>
                  </ChartCard>
                )}
              </>
            )}

            {/* ── Trends ── */}
            {activeTab === 'trends' && (
              <ChartCard title={`Active Users — Last ${trend.length} Days`}>
                {trendData.length > 0 ? (
                  <LineChart
                    data={trendData}
                    width={CHART_W}
                    height={180}
                    color={accent}
                    thickness={2.5}
                    curved
                    hideDataPoints={trendData.length > 10}
                    dataPointsColor={accent}
                    dataPointsRadius={4}
                    xAxisLabelTextStyle={{ color: C.dimmed, fontSize: 9, fontFamily: FONTS.regular }}
                    yAxisTextStyle={{ color: C.dimmed, fontSize: 9, fontFamily: FONTS.regular }}
                    xAxisColor={C.border}
                    yAxisColor={C.border}
                    rulesColor={C.border}
                    backgroundColor="transparent"
                    noOfSections={4}
                    adjustToWidth
                    formatYLabel={(v) => {
                      const n = parseFloat(v);
                      if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
                      return String(Math.round(n));
                    }}
                  />
                ) : (
                  <Text style={styles.noData}>No trend data</Text>
                )}
              </ChartCard>
            )}

            {/* ── Devices ── */}
            {activeTab === 'devices' && (
              <>
                {pieData.length > 0 ? (
                  <ChartCard title="Device Breakdown">
                    <View style={styles.pieWrap}>
                      <PieChart
                        data={pieData}
                        donut
                        radius={90}
                        innerRadius={56}
                        centerLabelComponent={() => (
                          <View style={{ alignItems: 'center' }}>
                            <Text style={{ color: C.text, fontFamily: FONTS.bold, fontSize: 18 }}>
                              {fmt(kpi.activeUsers)}
                            </Text>
                            <Text style={{ color: C.muted, fontFamily: FONTS.regular, fontSize: 10 }}>users</Text>
                          </View>
                        )}
                      />
                    </View>
                    <View style={styles.legend}>
                      {pieData.map((d) => (
                        <View key={d.label} style={styles.legendItem}>
                          <View style={[styles.legendDot, { backgroundColor: d.color }]} />
                          <Text style={styles.legendLabel}>{d.label}</Text>
                          <Text style={[styles.legendVal, { color: d.color }]}>{fmt(d.value)}</Text>
                        </View>
                      ))}
                    </View>
                  </ChartCard>
                ) : (
                  <Text style={styles.noData}>No device data</Text>
                )}

                {channelBar.length > 0 && (
                  <ChartCard title="Traffic Channels">
                    <BarChart
                      data={channelBar}
                      width={CHART_W}
                      height={160}
                      barWidth={28}
                      spacing={14}
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
                  </ChartCard>
                )}
              </>
            )}

            {/* ── Pages ── */}
            {activeTab === 'pages' && (
              <ChartCard title="Top Pages by Views">
                {pageBar.length > 0 ? (
                  <BarChart
                    data={pageBar}
                    width={CHART_W}
                    height={200}
                    barWidth={32}
                    spacing={12}
                    roundedTop
                    xAxisLabelTextStyle={{ color: C.dimmed, fontSize: 8, fontFamily: FONTS.regular }}
                    yAxisTextStyle={{ color: C.dimmed, fontSize: 9, fontFamily: FONTS.regular }}
                    xAxisColor={C.border}
                    yAxisColor={C.border}
                    rulesColor={C.border}
                    backgroundColor="transparent"
                    noOfSections={4}
                    isAnimated
                    showValuesAsTopLabel
                    topLabelContainerStyle={{ marginBottom: 2 }}
                  />
                ) : (
                  <Text style={styles.noData}>No pages data</Text>
                )}

                {pages.length > 0 && (
                  <View style={{ marginTop: 16 }}>
                    {pages.map((p, i) => (
                      <View key={i} style={styles.pageRow}>
                        <View style={[styles.pageRank, { backgroundColor: accent + '22' }]}>
                          <Text style={[styles.pageRankText, { color: accent }]}>{i + 1}</Text>
                        </View>
                        <Text style={styles.pageTitle} numberOfLines={1}>{p.pageTitle || 'Untitled'}</Text>
                        <Text style={[styles.pageViews, { color: accent }]}>{fmt(p.screenPageViews)}</Text>
                      </View>
                    ))}
                  </View>
                )}
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
  kpiRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  noData: { color: C.muted, fontFamily: FONTS.regular, fontSize: 13, textAlign: 'center', paddingVertical: 20 },
  newsRow: { flexDirection: 'row', alignItems: 'center' },
  newsItem: { flex: 1, alignItems: 'center' },
  newsVal: { fontSize: 22, fontFamily: FONTS.bold },
  newsLabel: { color: C.muted, fontSize: 11, fontFamily: FONTS.regular, marginTop: 3 },
  newsDivider: { width: 1, height: 36, backgroundColor: C.border },
  pieWrap: { alignItems: 'center', paddingVertical: 12 },
  legend: { marginTop: 16, gap: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { flex: 1, color: C.text, fontFamily: FONTS.regular, fontSize: 13 },
  legendVal: { fontFamily: FONTS.bold, fontSize: 14 },
  pageRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border },
  pageRank: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  pageRankText: { fontSize: 12, fontFamily: FONTS.bold },
  pageTitle: { flex: 1, color: C.text, fontFamily: FONTS.regular, fontSize: 13 },
  pageViews: { fontFamily: FONTS.bold, fontSize: 13 },
});
