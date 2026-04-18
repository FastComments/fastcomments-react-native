import {
  FastCommentsEmbedCore,
  FastCommentsWidgetParameters,
} from './embed-core';

export function FastCommentsCommentWidget(
  params: FastCommentsWidgetParameters
) {
  return FastCommentsEmbedCore(params, 'comment-ui-v2');
}
