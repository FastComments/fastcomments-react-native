import React, { useEffect, useState } from 'react';
import WebView from 'react-native-webview';
import type {
  FastCommentsSSO,
  FastCommentsCommentWidgetConfig,
} from 'fastcomments-typescript';
import { ActivityIndicator, ColorValue, Linking } from 'react-native';
import {
  WebViewErrorEvent,
  WebViewNavigationEvent,
  WebViewNavigation,
} from 'react-native-webview/lib/WebViewTypes';

export interface FastCommentsWidgetParameters {
  config: FastCommentsCommentWidgetConfig;
  backgroundColor?: ColorValue | undefined;
  onLoad?: (event: WebViewNavigationEvent) => void;
  onError?: (error: WebViewErrorEvent) => void;
  openURL?: (url: string) => boolean;
}

export function FastCommentsEmbedCore(
  props: FastCommentsWidgetParameters,
  widgetId: string
) {
  const [uri, setURI] = useState('');

  const [height, setHeight] = useState(500);

  let lastHeight = 0;
  let webview: WebView | null;
  const configFunctions: Pick<
    FastCommentsCommentWidgetConfig,
    | 'commentCountUpdated'
    | 'onReplySuccess'
    | 'onVoteSuccess'
    | 'onInit'
    | 'onRender'
    | 'onImageClicked'
    | 'onAuthenticationChange'
    | 'onCommentsRendered'
  > & {
    loginCallback?: FastCommentsSSO['loginCallback'];
    logoutCallback?: FastCommentsSSO['logoutCallback'];
  } = {};
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

  for (const key in props.config) {
    if (typeof (props.config as any)[key] === 'function') {
      (configFunctions as any)[key] = (props.config as any)[key];
    }
  }

  function updateHeight(value: number) {
    if (
      // Always handle the widget growing.
      value > lastHeight ||
      // Only handle the widget shrinking, if it's by more than 50px.
      Math.abs(value - lastHeight) > 100 ||
      // Handle the widget hiding itself.
      value === 0
    ) {
      lastHeight = value;
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

  function eventHandler(e: any) {
    try {
      const data = JSON.parse(e.nativeEvent.data);

      if (data.instanceId !== props.config.instanceId) {
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
          configFunctions.loginCallback(props.config.instanceId!);
      } else if (data.type === 'logout') {
        // eslint-disable-next-line prettier/prettier
        configFunctions.logoutCallback && configFunctions.logoutCallback(props.config.instanceId!);
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
        // TODO add onOpenProfile to config
        if ((configFunctions as any).onOpenProfile) {
          if ((configFunctions as any).onOpenProfile(data.userId) && webview) {
            const js = `
                      (function () {
                          window.dispatchEvent(new MessageEvent('message', {
                              data: '${JSON.stringify({
                                type: 'profile-loaded',
                                instanceId: props.config.instanceId,
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
    if (!config.instanceId) {
      (config as any).instanceId = Math.random() + '.' + Date.now();
    }

    const deRefConfig = JSON.parse(JSON.stringify(config)); // un-freeze and de-ref

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
      renderLoading={() => <ActivityIndicator size="small" />}
      scalesPageToFit={true}
      source={{ uri }}
      domStorageEnabled={true}
      javaScriptEnabled={true}
      nestedScrollEnabled={true}
      overScrollMode="never"
      onMessage={(event) => eventHandler(event)}
      onShouldStartLoadWithRequest={shouldStartLoadWithRequest}
      onError={props.onError}
      onLoad={props.onLoad}
    />
  );
}
