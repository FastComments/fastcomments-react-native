import * as React from 'react';

import { FastCommentsCommentWidget } from '../../src/index';
import { useEffect, useState } from 'react';
import { FastCommentsCommentWidgetConfig } from 'fastcomments-typescript';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useTheme } from './ShowcaseApp';

export default function CallbacksExampleApp() {
  const { isDark } = useTheme();
  const myTenantId = 'demo'; // Your tenant id. Can be fetched from https://fastcomments.com/auth/my-account/api-secret
  const myAppPageId = 'native-test'; // the ID or URL of the comment thread in your app.

  const [callbacksCalled, setCallbacksCalled] = useState<string[]>([]);

  function setCalled(name: string, value?: string | number) {
    if (value !== undefined) {
      callbacksCalled.push(`Called: ${name}: ${value}`);
    } else {
      callbacksCalled.push(`Called: ${name}`);
    }
    setCallbacksCalled([...callbacksCalled]);
  }

  const [config, setConfig] = useState<FastCommentsCommentWidgetConfig>({
    tenantId: myTenantId,
    urlId: myAppPageId,
    hasDarkBackground: isDark,
    onInit: () => {
      setCalled('onInit');
    },
    onAuthenticationChange: (event, relatedData) => {
      setCalled('onAuthenticationChange', JSON.stringify({ event, relatedData }));
    },
    onRender: () => {
      setCalled('onRender');
    },
    onCommentsRendered: (comments) => {
      setCalled('onCommentsRendered', comments.length + ' objects passed');
    },
    onReplySuccess: (comment) => {
      setCalled('onReplySuccess', JSON.stringify(comment));
    },
    onVoteSuccess: (comment, voteId, direction, status) => {
      setCalled('onVoteSuccess', JSON.stringify({ comment, voteId, direction, status }));
    },
    onImageClicked: (imageSrc) => {
      setCalled('onImageClicked', imageSrc);
    },
    onOpenProfile: (context) => {
      setCalled('onOpenProfile', JSON.stringify(context));
      return true;
    },
    onUserBlocked: (userId, comment, isBlocked) => {
      setCalled('onUserBlocked', JSON.stringify({ userId, comment, isBlocked }));
    },
    onCommentFlagged: (userId, comment, isFlagged) => {
      setCalled('onCommentFlagged', JSON.stringify({ userId, comment, isFlagged }));
    },
    onCommentEdited: (userId, comment) => {
      setCalled('onCommentEdited', JSON.stringify({ userId, comment }));
    },
    onCommentDeleted: (userId, comment) => {
      setCalled('onCommentDeleted', JSON.stringify({ userId, comment }));
    },
    commentCountUpdated: (newCount) => {
      setCalled('commentCountUpdated', newCount);
    },
    onCommentSubmitStart: (comment, continueSubmitFn, _cancelFn) => {
      setCalled('onCommentSubmitStart', JSON.stringify(comment));
      continueSubmitFn();
    }
  });

  useEffect(() => {
    setConfig((prev) => ({ ...prev, hasDarkBackground: isDark }));
  }, [isDark]);

  return (
    <ScrollView style={styles.container}>
      {callbacksCalled.map((value) => (
        <Text>{value}</Text>
      ))}
      <FastCommentsCommentWidget config={config} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
