import React, {useState} from 'react';
import WebView from 'react-native-webview';
import {FastCommentsCommentWidgetConfig} from 'fastcomments-typescript';
import {ActivityIndicator, ColorValue} from 'react-native';
import {WebViewErrorEvent, WebViewNavigationEvent} from 'react-native-webview/lib/WebViewTypes';

export interface FastCommentsWidgetParameters {
  config: FastCommentsCommentWidgetConfig;
  backgroundColor?: ColorValue | undefined;
  onLoad?: (event: WebViewNavigationEvent) => void;
  onError?: (error: WebViewErrorEvent) => void;
}

export function FastCommentsEmbedCore({config, backgroundColor, onLoad, onError} : FastCommentsWidgetParameters, widgetId: string) {
    if (config.urlId === null || config.urlId === undefined) {
        throw new Error('FastComments Error: A "urlId" is required! This should be a "urlId" property on the config object, that points to a bucket where comments will be stored and render from.');
    }

    if (typeof config.urlId === 'number') {
        config.urlId = '' + config.urlId;
    }

    const [height, setHeight] = useState(500);

    let lastHeight = 0;
    let webview: WebView | null;

    const configFunctions: Record<string, Function> = {};

    for (const key in config) {
        // @ts-ignore
        if (typeof config[key] === 'function') {
            // @ts-ignore
            configFunctions[key] = config[key];
            // @ts-ignore
            delete config[key];
        }
    }

    if (config.sso) {
        if (config.sso.loginCallback) {
            configFunctions.loginCallback = config.sso.loginCallback;
            // @ts-ignore
            config.sso.loginCallback = true;
        }
        if (config.sso.logoutCallback) {
            configFunctions.logoutCallback = config.sso.logoutCallback;
            // @ts-ignore
            config.sso.logoutCallback = true;
        }
    }

    config = JSON.parse(JSON.stringify(config)); // un-freeze
    // @ts-ignore
    config.instanceId = Math.random() + '.' + Date.now();
    // @ts-ignore
    const host = config.apiHost ? config.apiHost : 'https://fastcomments.com';

    function updateHeight(value: number) {
        if (
            // Always handle the widget growing.
            value > lastHeight
            // Only handle the widget shrinking, if it's by more than 50px.
            || Math.abs(value - lastHeight) > 100
            // Handle the widget hiding itself.
            || value === 0
        ) {
            lastHeight = value;
            setHeight(value);
        }
    }

    function eventHandler(e: any) {
        try {
            const data = JSON.parse(e.nativeEvent.data);

            // @ts-ignore
            if (data.instanceId !== config.instanceId) {
                return;
            }

            if (data.type === 'update-height') {
                updateHeight(data.height);
            } else if (data.type === 'update-comment-count') {
                configFunctions.commentCountUpdated && configFunctions.commentCountUpdated(data.count);
            } else if (data.type === 'redirect') {
                configFunctions.openURL && configFunctions.openURL(data.url);
            } else if (data.type === 'login') {
                // @ts-ignore
                configFunctions.loginCallback && configFunctions.loginCallback(config.instanceId);
            } else if (data.type === 'logout') {
                // @ts-ignore
                configFunctions.logoutCallback && configFunctions.logoutCallback(config.instanceId);
            } else if (data.type === 'reply-success') {
                configFunctions.onReplySuccess && configFunctions.onReplySuccess(data.comment);
            } else if (data.type === 'vote-success') {
                configFunctions.onVoteSuccess && configFunctions.onVoteSuccess(data.comment, data.voteId, data.direction, data.status);
            } else if (data.type === 'on-init') {
                configFunctions.onInit && configFunctions.onInit();
            } else if (data.type === 'on-render') {
                configFunctions.onRender && configFunctions.onRender();
            } else if (data.type === 'on-image-clicked') {
                configFunctions.onImageClicked && configFunctions.onImageClicked(data.src);
            } else if (data.type === 'on-authentication-change') {
                configFunctions.onAuthenticationChange && configFunctions.onAuthenticationChange(data.changeType, data.data);
            } else if (data.type === 'on-comments-rendered') {
                configFunctions.onCommentsRendered && configFunctions.onCommentsRendered(data.comments);
            } else if (data.type === 'open-profile') {
                if (configFunctions.onOpenProfile) {
                  if(configFunctions.onOpenProfile(data.userId) && webview) {
                    const js = `
                      (function () {
                          window.dispatchEvent(new MessageEvent('message', {
                              data: '${JSON.stringify({
                                  type: 'profile-loaded',
                                    // @ts-ignore
                                  instanceId: config.instanceId
                              })}'
                          }));
                      })();
                    `;
                    webview.injectJavaScript(js);
                  }
                }
            }
        } catch (err) {
            // @ts-ignore
          if (config.apiHost) { // only log errors during testing
                console.error(e, err);
            }
        }
    }

    for (const key in config) {
        // @ts-ignore
      const configValue = config[key];
        if (configValue === undefined) {
           // @ts-ignore
            delete config[key];
        } else if (typeof configValue === 'number') { // example: startingPage
           // @ts-ignore
            config[key] = configValue;
        } else if (typeof configValue !== 'object') {
           // @ts-ignore
            config[key] = encodeURIComponent(configValue);
        } else {
           // @ts-ignore
            config[key] = configValue;
        }
    }

    const uri = host + '/embed?config=' + encodeURIComponent(JSON.stringify(config)) + '&wId=' + widgetId;

    return (
        <WebView
            ref={ref => {
              webview = ref;
            }}
            style={{ height, backgroundColor }}
            startInLoadingState={true}
            renderLoading={() => <ActivityIndicator size="small" />}
            scalesPageToFit={true}
            source={{uri}}
            domStorageEnabled={true}
            javaScriptEnabled={true}
            onMessage={event => eventHandler(event)}
            onError={onError}
            onLoad={onLoad}/>
    );
}
