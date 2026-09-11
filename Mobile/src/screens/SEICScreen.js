import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  TouchableOpacity, Dimensions,
} from 'react-native';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import { getSEICEvents, getSEICSponsors } from '../services/api';
import { C, FONTS } from '../theme';
import KPICard from '../components/KPICard';
import ChartCard from '../components/ChartCard';
import ScreenHeader from '../components/ScreenHeader';

const LOGO = require('../../assets/seic.png');

const { width: SW } = Dimensions.get('window');
const PAD = 18;
const CHART_W = SW - PAD * 2 - 32;
const ACCENT = '#96c23d';

const fmt = (n) => {
  if (n === undefined || n === null) return '—';
  const v = parseFloat(n);
  if (isNaN(v)) return '—';
  return Math.round(v).toLocaleString('en-IN');
};

const fmtINR = (n) => {
  if (!n) return '—';
  const v = parseFloat(n);
  if (isNaN(v)) return '—';
  return '₹' + Math.round(v).toLocaleString('en-IN');
};

const fmtDate = (s) => {
  if (!s) return '';
  const p = s.split('-');
  if (p.length === 3) return `${p[2]}-${p[1]}-${p[0].slice(-2)}`;
  return s;
};

const PIE_COLORS = ['#96c23d', '#6fa832', '#4a7a20', '#c9a24b', '#7c3aed', '#0ea5e9'];

export default function SEICScreen({ navigation }) {
  const [events, setEvents]             = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventPicker, setShowEventPicker] = useState(false);
  const [stats, setStats]               = useState(null);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);
  const [error, setError]               = useState(null);
  const [activeTab, setActiveTab]       = useState('kpis');

  useEffect(() => {
    setLoadingEvents(true);
    getSEICEvents()
      .then(res => {
        const list = Array.isArray(res.data) ? res.data : [];
        setEvents(list);
        if (list.length > 0) setSelectedEvent(list[0]);
      })
      .catch(e => setError(e.message || 'Failed to load events'))
      .finally(() => setLoadingEvents(false));
  }, []);

  const fetchStats = useCallback((eventCode) => {
    if (!eventCode) return;
    setLoadingStats(true);
    setError(null);
    getSEICSponsors(eventCode)
      .then(res => setStats(res.data || null))
      .catch(e => setError(e.message || 'Failed to load stats'))
      .finally(() => setLoadingStats(false));
  }, []);

  useEffect(() => {
    if (selectedEvent) fetchStats(selectedEvent.EventMasterId);
  }, [selectedEvent, fetchStats]);

  const sponsors = stats?.sponsors || [];
  const kpiSummary = stats?.summary || stats || {};

  // KPIs
  const totalSponsors  = sponsors.length || kpiSummary.total_sponsors || 0;
  const totalAmount    = sponsors.reduce((a, s) => a + parseFloat(s.Sponsorship_Amount || 0), 0) || kpiSummary.total_amount || 0;
  const paidCount      = sponsors.filter(s => s.Payment_Status === 'Paid' || s.payment_status === 'paid').length;
  const pendingCount   = totalSponsors - paidCount;

  // Sponsor tier chart
  const tierMap = {};
  sponsors.forEach(s => {
    const tier = s.Sponsorship_Type || s.sponsorship_type || 'Other';
    tierMap[tier] = (tierMap[tier] || 0) + 1;
  });
  const tierEntries = Object.entries(tierMap).sort((a, b) => b[1] - a[1]);

  const tierBar = tierEntries.map(([name, val], i) => ({
    value: val,
    label: name.slice(0, 12),
    frontColor: PIE_COLORS[i % PIE_COLORS.length],
  }));

  const statusPie = [
    { value: paidCount, color: '#22c55e', label: 'Paid', text: 'P' },
    { value: pendingCount, color: '#f97316', label: 'Pending', text: 'N' },
  ].filter(d => d.value > 0);

  const top5 = [...sponsors]
    .sort((a, b) => parseFloat(b.Sponsorship_Amount || 0) - parseFloat(a.Sponsorship_Amount || 0))
    .slice(0, 5);

  const TABS = ['kpis', 'tiers', 'status', 'sponsors'];

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="SEIC Conference"
        subtitle="seic.events · Sugar & Ethanol India"
        accent={ACCENT}
        badge="Live"
        logoSrc={LOGO}
        logoBg="#7ba832"
        onBack={() => navigation.goBack()}
      />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Event selector */}
        {loadingEvents ? (
          <ActivityIndicator color={ACCENT} style={{ marginVertical: 16 }} />
        ) : events.length > 0 ? (
          <>
            <TouchableOpacity
              style={styles.eventPicker}
              onPress={() => setShowEventPicker(v => !v)}
              activeOpacity={0.8}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.eventPickerLabel}>SEIC Event</Text>
                <Text style={styles.eventPickerName} numberOfLines={1}>
                  {selectedEvent?.EventMaster_Name || 'Select event…'}
                </Text>
                {selectedEvent && (
                  <Text style={styles.eventPickerDates}>
                    {fmtDate(selectedEvent.Start_Date)} → {fmtDate(selectedEvent.End_Date)}
                  </Text>
                )}
              </View>
              <Text style={[styles.pickerChevron, { color: ACCENT }]}>{showEventPicker ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {showEventPicker && (
              <View style={styles.eventDropdown}>
                {events.map(ev => (
                  <TouchableOpacity
                    key={ev.EventMasterId}
                    style={[styles.eventDropItem, selectedEvent?.EventMasterId === ev.EventMasterId && styles.eventDropItemActive]}
                    onPress={() => { setSelectedEvent(ev); setShowEventPicker(false); }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.eventDropName, selectedEvent?.EventMasterId === ev.EventMasterId && { color: ACCENT }]}>
                      {ev.EventMaster_Name}
                    </Text>
                    <Text style={styles.eventDropDates}>
                      {fmtDate(ev.Start_Date)} → {fmtDate(ev.End_Date)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        ) : null}

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠ {error}</Text>
          </View>
        )}

        {loadingStats ? (
          <View style={styles.loadBox}>
            <ActivityIndicator color={ACCENT} size="large" />
            <Text style={styles.loadText}>Loading SEIC data…</Text>
          </View>
        ) : stats || sponsors.length > 0 ? (
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
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* ── KPIs ── */}
            {activeTab === 'kpis' && (
              <>
                <View style={styles.kpiRow}>
                  <KPICard label="Total Sponsors" value={fmt(totalSponsors)} accent={ACCENT} />
                  <KPICard label="Paid"            value={fmt(paidCount)}    accent="#22c55e" />
                </View>
                <View style={styles.kpiRow}>
                  <KPICard label="Pending"         value={fmt(pendingCount)} accent="#f97316" />
                  <KPICard label="Total Amount"    value={fmtINR(totalAmount)} accent={ACCENT} />
                </View>
              </>
            )}

            {/* ── Tiers ── */}
            {activeTab === 'tiers' && (
              <ChartCard title="Sponsors by Tier">
                {tierBar.length > 0 ? (
                  <>
                    <BarChart
                      data={tierBar}
                      width={CHART_W}
                      height={180}
                      barWidth={34}
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
                    />
                    <View style={{ marginTop: 14 }}>
                      {tierEntries.map(([tier, count], i) => (
                        <View key={tier} style={styles.tierRow}>
                          <View style={[styles.tierDot, { backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }]} />
                          <Text style={styles.tierName}>{tier}</Text>
                          <Text style={[styles.tierCount, { color: PIE_COLORS[i % PIE_COLORS.length] }]}>{fmt(count)}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                ) : (
                  <Text style={styles.noData}>No tier data</Text>
                )}
              </ChartCard>
            )}

            {/* ── Status ── */}
            {activeTab === 'status' && (
              <ChartCard title="Payment Status">
                {statusPie.length > 0 ? (
                  <>
                    <View style={styles.pieWrap}>
                      <PieChart
                        data={statusPie}
                        donut
                        radius={90}
                        innerRadius={58}
                        centerLabelComponent={() => (
                          <View style={{ alignItems: 'center' }}>
                            <Text style={{ color: C.text, fontFamily: FONTS.bold, fontSize: 18 }}>{fmt(totalSponsors)}</Text>
                            <Text style={{ color: C.muted, fontFamily: FONTS.regular, fontSize: 10 }}>sponsors</Text>
                          </View>
                        )}
                      />
                    </View>
                    <View style={styles.legend}>
                      {statusPie.map(d => (
                        <View key={d.label} style={styles.legendItem}>
                          <View style={[styles.legendDot, { backgroundColor: d.color }]} />
                          <Text style={styles.legendLabel}>{d.label}</Text>
                          <Text style={[styles.legendVal, { color: d.color }]}>{fmt(d.value)}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                ) : (
                  <Text style={styles.noData}>No payment data</Text>
                )}
              </ChartCard>
            )}

            {/* ── Sponsors ── */}
            {activeTab === 'sponsors' && (
              <ChartCard title={`Top Sponsors by Amount`}>
                {top5.length > 0 ? (
                  <>
                    {top5.map((s, i) => (
                      <View key={i} style={styles.sponsorRow}>
                        <View style={[styles.sponsorRank, { backgroundColor: ACCENT + '22' }]}>
                          <Text style={[styles.sponsorRankText, { color: ACCENT }]}>{i + 1}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.sponsorName} numberOfLines={1}>
                            {s.Sponsor_Name || s.sponsor_name || `Sponsor ${i + 1}`}
                          </Text>
                          <Text style={styles.sponsorTier}>
                            {s.Sponsorship_Type || s.sponsorship_type || '—'}
                          </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={[styles.sponsorAmt, { color: ACCENT }]}>
                            {fmtINR(s.Sponsorship_Amount || s.amount)}
                          </Text>
                          <View style={[
                            styles.statusBadge,
                            { backgroundColor: (s.Payment_Status === 'Paid' || s.payment_status === 'paid') ? '#22c55e22' : '#f9731622',
                              borderColor:     (s.Payment_Status === 'Paid' || s.payment_status === 'paid') ? '#22c55e55' : '#f9731655' }
                          ]}>
                            <Text style={[styles.statusText, { color: (s.Payment_Status === 'Paid' || s.payment_status === 'paid') ? '#22c55e' : '#f97316' }]}>
                              {s.Payment_Status || s.payment_status || 'N/A'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))}

                    {sponsors.length > 5 && (
                      <Text style={styles.moreText}>+ {sponsors.length - 5} more sponsors</Text>
                    )}
                  </>
                ) : (
                  <Text style={styles.noData}>No sponsor data</Text>
                )}
              </ChartCard>
            )}
          </>
        ) : !loadingStats && !error ? (
          <Text style={styles.noData}>Select an event to load analytics.</Text>
        ) : null}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: PAD, paddingTop: 14 },
  eventPicker: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.surface, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: `${ACCENT}55`, marginBottom: 8,
  },
  eventPickerLabel: { color: ACCENT, fontSize: 10, fontFamily: FONTS.semi, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 },
  eventPickerName: { color: C.text, fontSize: 15, fontFamily: FONTS.bold },
  eventPickerDates: { color: C.muted, fontSize: 11, fontFamily: FONTS.regular, marginTop: 2 },
  pickerChevron: { fontSize: 14, fontFamily: FONTS.bold },
  eventDropdown: {
    backgroundColor: '#0d1a0a', borderWidth: 1, borderColor: `${ACCENT}44`,
    borderRadius: 12, marginBottom: 12, overflow: 'hidden',
  },
  eventDropItem: { padding: 13, borderBottomWidth: 1, borderBottomColor: C.border },
  eventDropItemActive: { backgroundColor: `${ACCENT}18` },
  eventDropName: { color: C.text, fontFamily: FONTS.semi, fontSize: 14 },
  eventDropDates: { color: C.muted, fontFamily: FONTS.regular, fontSize: 11, marginTop: 2 },
  loadBox: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  loadText: { color: C.muted, fontFamily: FONTS.regular, fontSize: 13 },
  errorBox: { alignItems: 'center', paddingVertical: 16 },
  errorText: { color: C.error, fontFamily: FONTS.semi, fontSize: 13, textAlign: 'center' },
  tabScroll: { flexGrow: 0, marginBottom: 16 },
  tabRow: { gap: 8, flexDirection: 'row' },
  tab: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 99, borderWidth: 1, borderColor: C.border,
    backgroundColor: C.surface,
  },
  tabText: { color: C.muted, fontSize: 13, fontFamily: FONTS.semi },
  kpiRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  tierRow: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: C.border },
  tierDot: { width: 9, height: 9, borderRadius: 4.5 },
  tierName: { flex: 1, color: C.text, fontFamily: FONTS.regular, fontSize: 13 },
  tierCount: { fontFamily: FONTS.bold, fontSize: 14 },
  pieWrap: { alignItems: 'center', paddingVertical: 10 },
  legend: { marginTop: 14, gap: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { flex: 1, color: C.text, fontFamily: FONTS.regular, fontSize: 13 },
  legendVal: { fontFamily: FONTS.bold, fontSize: 14 },
  sponsorRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  sponsorRank: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  sponsorRankText: { fontSize: 12, fontFamily: FONTS.bold },
  sponsorName: { color: C.text, fontFamily: FONTS.semi, fontSize: 13 },
  sponsorTier: { color: C.muted, fontFamily: FONTS.regular, fontSize: 11, marginTop: 2 },
  sponsorAmt: { fontFamily: FONTS.bold, fontSize: 13 },
  statusBadge: {
    borderWidth: 1, borderRadius: 6,
    paddingHorizontal: 7, paddingVertical: 2, marginTop: 3,
  },
  statusText: { fontSize: 10, fontFamily: FONTS.semi },
  moreText: { color: C.muted, fontFamily: FONTS.regular, fontSize: 12, textAlign: 'center', paddingTop: 10 },
  noData: { color: C.muted, fontFamily: FONTS.regular, fontSize: 13, textAlign: 'center', paddingVertical: 30 },
});
