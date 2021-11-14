import * as React from 'react'
import { WebView } from 'react-native-webview';
import {FastCommentsCommentWidgetConfig} from "fastcomments-typescript";

enum LoadStatus {
  Started,
  ScriptLoaded,
  Done,
  Error
}

interface FastCommentsState {
  status: LoadStatus,
  widgetId: string | null
}

export class FastCommentsCommentWidget extends React.Component<FastCommentsCommentWidgetConfig, FastCommentsState> {

  render() {
    return <WebView source={{ uri: 'https://fastcomments.com/embed?config=%7B%22tenantId%22%3A%22nYrnfYEv%22%2C%22urlId%22%3A%22https%253A%252F%252Fblog.fastcomments.com%252F(12-30-2019)-fastcomments-demo.html%22%2C%22countAll%22%3A%22true%22%2C%22url%22%3A%22https%253A%252F%252Ffastcomments.com%252Fdemo%22%2C%22pageTitle%22%3A%22FastComments%2520-%2520Demo%22%2C%22instanceId%22%3A%220.9860912724161741.1636912799953%22%7D&wId=comment-ui-v2' }} />;
  }
}
