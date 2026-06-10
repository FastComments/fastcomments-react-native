import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { FastCommentsCommentWidget } from '../index';

jest.mock('react-native-webview', () => {
  const ReactLib = require('react');
  return {
    __esModule: true,
    default: ReactLib.forwardRef(() => null),
  };
});

const WebView = require('react-native-webview').default;

function render(element: React.ReactElement): ReactTestRenderer {
  let renderer: ReactTestRenderer | undefined;
  act(() => {
    renderer = create(element);
  });
  return renderer!;
}

describe('FastCommentsEmbedCore scroll behavior', () => {
  const config = { tenantId: 'demo', urlId: 'test' };

  it('defaults nestedScrollEnabled to false so parent scroll views keep the gesture', () => {
    const renderer = render(<FastCommentsCommentWidget config={config} />);
    const webview = renderer.root.findByType(WebView);
    expect(webview.props.nestedScrollEnabled).toBe(false);
  });

  it('passes nestedScrollEnabled through when explicitly enabled', () => {
    const renderer = render(
      <FastCommentsCommentWidget config={config} nestedScrollEnabled={true} />
    );
    const webview = renderer.root.findByType(WebView);
    expect(webview.props.nestedScrollEnabled).toBe(true);
  });
});
