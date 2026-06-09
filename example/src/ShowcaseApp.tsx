import * as React from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, Image, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import App from './App';
import CallbacksExampleApp from './CallbacksExampleApp';

type Theme = 'light' | 'dark';
type ThemeContextValue = { theme: Theme; isDark: boolean; setTheme: (t: Theme) => void };

export const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  isDark: true,
  setTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

type ExampleKey = 'basic' | 'callbacks';

type ExampleMeta = {
  key: ExampleKey;
  label: string;
  kind: string;
  blurb: string;
  Component: React.ComponentType;
};

const EXAMPLES: ExampleMeta[] = [
  { key: 'basic', label: 'Live Comment Widget', kind: 'widget', blurb: 'The flagship live commenting widget. Replies, voting, moderation.', Component: App },
  { key: 'callbacks', label: 'Event Callbacks', kind: 'config demo', blurb: 'Every lifecycle and action event mirrored in a live log.', Component: CallbacksExampleApp },
];

let userOverride: Theme | null = null;

export default function ShowcaseApp() {
  const [selected, setSelected] = useState<ExampleKey>('basic');
  const [theme, setThemeState] = useState<Theme>(() => {
    if (userOverride) return userOverride;
    return Appearance.getColorScheme() === 'light' ? 'light' : 'dark';
  });

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      if (!userOverride) {
        setThemeState(colorScheme === 'light' ? 'light' : 'dark');
      }
    });
    return () => sub.remove();
  }, []);

  const setTheme = (next: Theme) => {
    userOverride = next;
    setThemeState(next);
  };

  const themeValue = useMemo<ThemeContextValue>(
    () => ({ theme, isDark: theme === 'dark', setTheme }),
    [theme]
  );

  const current = EXAMPLES.find((e) => e.key === selected) ?? EXAMPLES[0];
  const Current = current.Component;
  const isDark = theme === 'dark';
  const p = isDark ? PALETTE.dark : PALETTE.light;

  return (
    <ThemeContext.Provider value={themeValue}>
      <SafeAreaView style={[styles.safe, { backgroundColor: p.bg }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={p.bg} />
        <View style={styles.header}>
          <View style={styles.brand}>
            <Image
              source={{ uri: isDark
                ? 'https://fastcomments.com/images/svg/v2/logo_white.svg'
                : 'https://fastcomments.com/images/svg/v2/logo.svg' }}
              style={styles.brandLogo}
              resizeMode="contain"
            />
            <View>
              <Text style={[styles.brandName, { color: p.ink }]}>FastComments</Text>
              <Text style={[styles.brandSlug, { color: p.inkMute }]}>react-native · showcase</Text>
            </View>
          </View>
          <View style={[styles.themeToggle, { borderColor: p.borderStrong }]}>
            <TouchableOpacity
              onPress={() => setTheme('light')}
              style={[styles.themeBtn, !isDark && styles.themeBtnActive]}
            >
              <Text style={[styles.themeBtnText, { color: p.inkMute }, !isDark && styles.themeBtnTextActive]}>Light</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setTheme('dark')}
              style={[styles.themeBtn, isDark && styles.themeBtnActive]}
            >
              <Text style={[styles.themeBtnText, { color: p.inkMute }, isDark && styles.themeBtnTextActive]}>Dark</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={[styles.divider, { backgroundColor: p.border }]} />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabBar}
          contentContainerStyle={styles.tabRow}
        >
          {EXAMPLES.map((e) => {
            const active = e.key === selected;
            return (
              <TouchableOpacity
                key={e.key}
                onPress={() => setSelected(e.key)}
                style={[styles.tab, { borderColor: p.border, backgroundColor: p.panel }, active && { borderColor: '#8453ed', backgroundColor: p.panelRaised }]}
                activeOpacity={0.85}
              >
                <Text style={[styles.tabKind, { color: p.inkMute }, active && styles.tabKindActive]}>
                  {e.kind.toUpperCase()}
                </Text>
                <Text style={[styles.tabLabel, { color: p.inkDim }, active && { color: p.ink }]}>{e.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.crumb}>
          <Text style={styles.crumbText}>
            <Text style={{ color: p.inkMute }}>{current.kind.toUpperCase()}  /  </Text>
            <Text style={{ color: p.ink }}>{current.label}</Text>
          </Text>
          <Text style={[styles.blurb, { color: p.inkDim }]}>{current.blurb}</Text>
        </View>

        <View style={[styles.stage, { borderColor: p.border, backgroundColor: p.lightPanelBg }]}>
          <Current />
        </View>
      </SafeAreaView>
    </ThemeContext.Provider>
  );
}

const PALETTE = {
  dark: {
    bg: '#030303',
    panel: '#0d0d0d',
    panelRaised: '#121212',
    border: '#1f1f22',
    borderStrong: '#2a2a2f',
    ink: '#fcfcfc',
    inkDim: '#a6a6a6',
    inkMute: '#686868',
    lightPanelBg: '#0b0b0b',
  },
  light: {
    bg: '#f7f7f8',
    panel: '#ffffff',
    panelRaised: '#f1f1f4',
    border: '#e4e4e7',
    borderStrong: '#d4d4d8',
    ink: '#0b0b0f',
    inkDim: '#4a4a52',
    inkMute: '#8a8a93',
    lightPanelBg: '#ffffff',
  },
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandLogo: {
    width: 32,
    height: 38,
  },
  brandName: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  brandSlug: {
    fontSize: 9.5,
    letterSpacing: 2,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  themeToggle: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 999,
    padding: 3,
  },
  themeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  themeBtnActive: {
    backgroundColor: '#5356ec',
  },
  themeBtnText: {
    fontSize: 9.5,
    letterSpacing: 1.8,
    fontWeight: '600',
  },
  themeBtnTextActive: {
    color: '#ffffff',
  },
  tabBar: {
    flexGrow: 0,
    flexShrink: 0,
  },
  tabRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
    alignItems: 'flex-start',
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
  },
  tabKind: {
    fontSize: 9,
    letterSpacing: 1.6,
    marginBottom: 3,
  },
  tabKindActive: {
    color: '#a8bdff',
  },
  tabLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  crumb: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  crumbText: {
    fontSize: 10.5,
    letterSpacing: 1.5,
  },
  blurb: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
  },
  stage: {
    flex: 1,
    marginHorizontal: 14,
    marginBottom: 14,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
