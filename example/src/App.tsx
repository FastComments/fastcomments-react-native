import * as React from 'react';

import { FastCommentsCommentWidget } from '../../src/index';
import { ScrollView, StyleSheet } from 'react-native';
import { useTheme } from './ShowcaseApp';

export default function App() {
  const { isDark } = useTheme();
  const FAST_COMMENTS_TENANT_ID = 'demo';
  const urlId = 'native-test';
  const url = 'https://example.com/external-page';
  const now = Date.now();

  // Simulate postData from customer's app
  const postData = {
    projectId: 'test-project-123',
  };

  const ssoConfig = {
    timestamp: now,
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
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <FastCommentsCommentWidget
        key={widgetKey}
        config={widgetConfig()}
        backgroundColor="transparent"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flexGrow: 1,
  },
});
