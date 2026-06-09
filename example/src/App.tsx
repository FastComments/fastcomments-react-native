import * as React from 'react';

import { FastCommentsCommentWidget } from '../../src/index';
import { ScrollView, StyleSheet } from 'react-native';
import { useTheme } from './ShowcaseApp';

const DARK_BG = '#0b0b0b';
const LIGHT_BG = '#ffffff';

export default function App() {
  const { isDark } = useTheme();
  const FAST_COMMENTS_TENANT_ID = 'demo';
  const urlId = 'native-test';
  const url = 'https://example.com/external-page';
  // Keep the timestamp stable across renders so the widget key only changes on
  // theme toggle, not on every render.
  const timestampRef = React.useRef(Date.now());

  // Simulate postData from customer's app
  const postData = {
    projectId: 'test-project-123',
  };

  const ssoConfig = {
    timestamp: timestampRef.current,
  };

  const widgetConfig = () => {
    const baseConfig: any = {
      tenantId: FAST_COMMENTS_TENANT_ID,
      urlId: urlId || '',
      url,
      originalReferrer: 'Original Referrer',
      sendEvents: true,
      hasDarkBackground: isDark,
    };

    const mentionGroupIds =
      postData && postData.projectId ? [postData.projectId] : undefined;

    if (mentionGroupIds && mentionGroupIds.length > 0) {
      baseConfig.mentionGroupIds = mentionGroupIds;
    }

    return baseConfig;
  };

  const widgetKey = `${urlId}::${ssoConfig.timestamp}::${isDark ? 'd' : 'l'}`;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? DARK_BG : LIGHT_BG }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <FastCommentsCommentWidget
        key={widgetKey}
        config={widgetConfig()}
        backgroundColor={isDark ? DARK_BG : 'transparent'}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
});
