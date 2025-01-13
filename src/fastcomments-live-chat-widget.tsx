import { FastCommentsCommentWidgetConfig } from 'fastcomments-typescript';
import { FastCommentsEmbedCore } from './embed-core';

export interface FastCommentsWidgetParameters {
  config: FastCommentsCommentWidgetConfig;
}

export function FastCommentsLiveChatWidget(
  params: FastCommentsWidgetParameters
) {
  return FastCommentsEmbedCore(params, 'live-chat');
}
