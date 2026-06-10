import React, { ReactElement, useEffect, useRef, useState } from 'react';
import WebView from 'react-native-webview';
import type {
  FastCommentsSSO,
  FastCommentsCommentWidgetConfig,
} from 'fastcomments-typescript';
import { ActivityIndicator, ColorValue, Linking } from 'react-native';
import {
  WebViewErrorEvent,
  WebViewMessageEvent,
  WebViewNavigationEvent,
  WebViewNavigation,
} from 'react-native-webview/lib/WebViewTypes';

export interface FastCommentsWidgetParameters {
  config: FastCommentsCommentWidgetConfig;
  backgroundColor?: ColorValue | undefined;
  onLoad?: (event: WebViewNavigationEvent) => void;
  onError?: (error: WebViewErrorEvent) => void;
  openURL?: (url: string) => boolean;
  showsVerticalScrollIndicator?: boolean;
  /**
   * On Android, when true the widget claims vertical drag gestures for its
   * internal scrolling, which prevents a parent ScrollView/FlatList from
   * scrolling. Leave false (the default) for auto-height widgets embedded in
   * a scrollable screen; only enable for fixed-height widgets that need to
   * scroll internally.
   */
  nestedScrollEnabled?: boolean;
  renderLoading?: () => ReactElement;
  renderError?: (
    errorDomain: string | undefined,
    errorCode: number,
    errorDesc: string
  ) => ReactElement;
}

export function FastCommentsEmbedCore(
  props: FastCommentsWidgetParameters,
  widgetId: string
) {
  const [uri, setURI] = useState('');
  const [height, setHeight] = useState(500);
  const instanceIdRef = useRef<string>(
    props.config.instanceId ?? Math.random() + '.' + Date.now()
  );

  const lastHeightRef = useRef(0);
  let webview: WebView | null;
  const callbackKeys = [
    'commentCountUpdated',
    'onReplySuccess',
    'onVoteSuccess',
    'onInit',
    'onRender',
    'onImageClicked',
    'onAuthenticationChange',
    'onCommentsRendered',
    'onOpenProfile',
  ] as const;

  type ConfigCallbacks = Pick<
    FastCommentsCommentWidgetConfig,
    (typeof callbackKeys)[number]
  > & {
    loginCallback?: FastCommentsSSO['loginCallback'];
    logoutCallback?: FastCommentsSSO['logoutCallback'];
  };

  const configFunctions: ConfigCallbacks = {};
  if (props.config.sso) {
    if (props.config.sso.loginCallback) {
      configFunctions.loginCallback = props.config.sso.loginCallback;
      (props.config.sso.loginCallback as unknown as boolean) = true;
    }
    if (props.config.sso.logoutCallback) {
      configFunctions.logoutCallback = props.config.sso.logoutCallback;
      (props.config.sso.logoutCallback as unknown as boolean) = true;
    }
  }

  for (const key of callbackKeys) {
    const val = props.config[key];
    if (typeof val === 'function') {
      // Safe: key is constrained to callbackKeys which are all valid on both types
      (configFunctions as Record<string, unknown>)[key] = val;
    }
  }

  function updateHeight(value: number) {
    // Track the height the embedded page reports and update whenever it
    // actually changes (grow or shrink). Using a ref that persists across
    // renders avoids redundant re-renders when the same height is re-reported.
    if (value !== lastHeightRef.current) {
      lastHeightRef.current = value;
      setHeight(value);
    }
  }

  function shouldStartLoadWithRequest(request: WebViewNavigation): boolean {
    const requestUrl = request.url;
    const currentUrl = uri;
    
    // Allow navigation within FastComments domains
    if (requestUrl.includes('fastcomments.com') || 
        requestUrl.includes('eu.fastcomments.com') ||
        requestUrl === currentUrl) {
      return true;
    }
    
    // For external URLs, try to open in system browser
    if (props.openURL) {
      return !props.openURL(requestUrl);
    } else {
      Linking.openURL(requestUrl).catch(err => 
        console.error('Failed to open URL:', err)
      );
      return false;
    }
  }

  function eventHandler(e: WebViewMessageEvent) {
    try {
      const data = JSON.parse(e.nativeEvent.data);

      if (data.instanceId !== instanceIdRef.current) {
        return;
      }

      if (data.type === 'update-height') {
        updateHeight(data.height);
      } else if (data.type === 'update-comment-count') {
        configFunctions.commentCountUpdated &&
          configFunctions.commentCountUpdated(data.count);
      } else if (data.type === 'redirect') {
        if (props.openURL) {
          props.openURL(data.url);
        } else {
          Linking.openURL(data.url).catch(err => 
            console.error('Failed to open URL:', err)
          );
        }
      } else if (data.type === 'login') {
        configFunctions.loginCallback &&
          configFunctions.loginCallback(instanceIdRef.current);
      } else if (data.type === 'logout') {
        configFunctions.logoutCallback &&
          configFunctions.logoutCallback(instanceIdRef.current);
      } else if (data.type === 'reply-success') {
        configFunctions.onReplySuccess &&
          configFunctions.onReplySuccess(data.comment);
      } else if (data.type === 'vote-success') {
        configFunctions.onVoteSuccess &&
          configFunctions.onVoteSuccess(
            data.comment,
            data.voteId,
            data.direction,
            data.status
          );
      } else if (data.type === 'on-init') {
        configFunctions.onInit && configFunctions.onInit();
      } else if (data.type === 'on-render') {
        configFunctions.onRender && configFunctions.onRender();
      } else if (data.type === 'on-image-clicked') {
        configFunctions.onImageClicked &&
          configFunctions.onImageClicked(data.src);
      } else if (data.type === 'on-authentication-change') {
        configFunctions.onAuthenticationChange &&
          configFunctions.onAuthenticationChange(data.changeType, data.data);
      } else if (data.type === 'on-comments-rendered') {
        configFunctions.onCommentsRendered &&
          configFunctions.onCommentsRendered(data.comments);
      } else if (data.type === 'open-profile') {
        if (configFunctions.onOpenProfile) {
          if (configFunctions.onOpenProfile(data.userId) && webview) {
            const js = `
                      (function () {
                          window.dispatchEvent(new MessageEvent('message', {
                              data: '${JSON.stringify({
                                type: 'profile-loaded',
                                instanceId: instanceIdRef.current,
                              })}'
                          }));
                      })();
                    `;
            webview.injectJavaScript(js);
          }
        }
      }
    } catch (err) {
      if (props.config.apiHost) {
        // only log errors during testing
        console.error(e, err);
      }
    }
  }

  useEffect(() => {
    const config = props.config;
    if (config.urlId === null || config.urlId === undefined) {
      throw new Error(
        'FastComments Error: A "urlId" is required! This should be a "urlId" property on the config object, that points to a bucket where comments will be stored and render from.'
      );
    }
    const deRefConfig = JSON.parse(JSON.stringify(config)); // un-freeze and de-ref
    deRefConfig.instanceId = instanceIdRef.current;

    for (const key in deRefConfig) {
      if (typeof (deRefConfig as any)[key] === 'function') {
        delete (deRefConfig as any)[key];
      }
    }

    const host = deRefConfig.apiHost
      ? deRefConfig.apiHost
      : deRefConfig.region === 'eu'
      ? 'https://eu.fastcomments.com'
      : 'https://fastcomments.com';

    for (const key in deRefConfig) {
      const configValue = (deRefConfig as any)[key];
      if (configValue === undefined) {
        delete (deRefConfig as any)[key];
      } else if (typeof configValue === 'number') {
        // example: startingPage
        (deRefConfig as any)[key] = configValue;
      } else if (typeof configValue !== 'object') {
        (deRefConfig as any)[key] = encodeURIComponent(configValue);
      } else {
        (deRefConfig as any)[key] = configValue;
      }
    }
    setURI(
      host +
        '/embed?config=' +
        encodeURIComponent(JSON.stringify(deRefConfig)) +
        '&wId=' +
        widgetId
    );
  }, [props.config, widgetId]);

  return (
    <WebView
      ref={(ref) => {
        webview = ref;
      }}
      style={{ height, backgroundColor: props.backgroundColor }}
      startInLoadingState={true}
      renderLoading={
        props.renderLoading ?? (() => <ActivityIndicator size="small" />)
      }
      renderError={props.renderError}
      scalesPageToFit={true}
      source={{ uri }}
      domStorageEnabled={true}
      javaScriptEnabled={true}
      nestedScrollEnabled={props.nestedScrollEnabled ?? false}
      overScrollMode="never"
      showsVerticalScrollIndicator={props.showsVerticalScrollIndicator}
      onMessage={(event) => eventHandler(event)}
      onShouldStartLoadWithRequest={shouldStartLoadWithRequest}
      onError={props.onError}
      onLoad={props.onLoad}
    />
  );
}
