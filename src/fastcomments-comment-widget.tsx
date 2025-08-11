import { FastCommentsCommentWidgetConfig } from 'fastcomments-typescript';
import { FastCommentsEmbedCore } from './embed-core';
import { ColorValue } from 'react-native';

export interface FastCommentsWidgetParameters {
  config: FastCommentsCommentWidgetConfig;
  backgroundColor?: ColorValue | undefined;
  showsVerticalScrollIndicator?: boolean;
}

export function FastCommentsCommentWidget(
  params: FastCommentsWidgetParameters
) {
  return FastCommentsEmbedCore(params, 'comment-ui-v2');
}
