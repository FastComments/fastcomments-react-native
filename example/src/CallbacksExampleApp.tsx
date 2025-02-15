import * as React from 'react';

import { FastCommentsCommentWidget } from '../../src/index';
import { useState } from 'react';
import { FastCommentsCommentWidgetConfig } from 'fastcomments-typescript';
import { ScrollView, StyleSheet, Text } from 'react-native';

export default function CallbacksExampleApp() {
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

  const [config] = useState<FastCommentsCommentWidgetConfig>({
    tenantId: myTenantId,
    urlId: myAppPageId,
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

  // Uncomment this to test changing pages without reloading the whole widget.
  // We could use this to change the logged in user, as well.
  // useEffect(() => {
  //   setTimeout(function () {
  //     setConfig({
  //       ...config,
  //       urlId: 'new-page-id'
  //     });
  //   }, 2000);
  // }, []);

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
