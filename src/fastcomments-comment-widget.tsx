import {FastCommentsCommentWidgetConfig} from 'fastcomments-typescript';
import {FastCommentsEmbedCore} from './embed-core';
import {ColorValue} from 'react-native';

export interface FastCommentsWidgetParameters {
  config: FastCommentsCommentWidgetConfig
  backgroundColor?: ColorValue | undefined
}

export function FastCommentsCommentWidget(params: FastCommentsWidgetParameters) {
  return FastCommentsEmbedCore(params, 'comment-ui-v2');
}
