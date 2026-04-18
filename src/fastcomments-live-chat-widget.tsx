import {
  FastCommentsEmbedCore,
  FastCommentsWidgetParameters,
} from './embed-core';

export function FastCommentsLiveChatWidget(
  params: FastCommentsWidgetParameters
) {
  return FastCommentsEmbedCore(params, 'live-chat');
}
