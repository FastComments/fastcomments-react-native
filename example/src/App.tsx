import * as React from 'react';

import { StyleSheet, View, Text } from 'react-native';
import { FastCommentsCommentWidget } from '../../src/index';

export default function App() {

  return (
    <View style={styles.container}>
      <Text>Test:</Text>
      <FastCommentsCommentWidget tenantId="demo" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
});
