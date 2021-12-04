import {FastCommentsCommentWidgetConfig} from 'fastcomments-typescript';
import {FastCommentsEmbedCore} from './embed-core';

export interface FastCommentsWidgetParameters {
  config: FastCommentsCommentWidgetConfig
}

export function FastCommentsCommentWidget(params: FastCommentsWidgetParameters) {
  return FastCommentsEmbedCore(params, 'comment-ui-v2');
}
