import React, { ReactElement, useEffect, useRef, useState } from 'react';
import WebView from 'react-native-webview';
import type {
  FastCommentsSSO,
  FastCommentsCommentWidgetConfig,
} from 'fastcomments-typescript';
import { ActivityIndicator, ColorValue, Keyboard, Linking, View } from 'react-native';
import {
  WebViewErrorEvent,
  WebViewMessageEvent,
  WebViewNavigationEvent,
  WebViewNavigation,
} from 'react-native-webview/lib/WebViewTypes';
import {
  buildKeyboardAvoidanceScript,
  computeKeyboardAvoidHeight,
} from './keyboard-avoidance';

export interface FastCommentsWidgetParameters {
  config: FastCommentsCommentWidgetConfig;
  backgroundColor?: ColorValue | undefined;
  onLoad?: (event: WebViewNavigationEvent) => void;
  onError?: (error: WebViewErrorEvent) => void;
  openURL?: (url: string) => boolean;
  showsVerticalScrollIndicator?: boolean;
  renderLoading?: () => ReactElement;
  renderError?: (
    errorDomain: string | undefined,
    errorCode: number,
    errorDesc: string
  ) => ReactElement;
  /**
   * The comment UI is rendered inside a WebView whose height tracks its
   * content, so by default a focused comment field can end up hidden behind the
   * on-screen keyboard. When the keyboard opens we temporarily shrink the
   * WebView to the space above it and scroll the focused field into view. Set
   * this to `true` to disable that behavior (e.g. if you handle keyboard
   * avoidance yourself in the host layout).
   */
  disableKeyboardAvoidance?: boolean;
}

export function FastCommentsEmbedCore(
  props: FastCommentsWidgetParameters,
  widgetId: string
) {
  const [uri, setURI] = useState('');
  // The full content height the embedded page reports. While the keyboard is
  // open we render `cappedHeight` instead, so the focused field has room to
  // scroll above the keyboard (see keyboard-avoidance.ts).
  const [autoHeight, setAutoHeight] = useState(500);
  const [cappedHeight, setCappedHeight] = useState<number | null>(null);
  const instanceIdRef = useRef<string>(
    props.config.instanceId ?? Math.random() + '.' + Date.now()
  );

  const webviewRef = useRef<WebView | null>(null);
  const containerRef = useRef<View | null>(null);
  const lastHeightRef = useRef(0);
  const autoHeightRef = useRef(500);
  const inputFocusedRef = useRef(false);
  const keyboardTopYRef = useRef<number | null>(null);
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
    if (
      // Always handle the widget growing.
      value > lastHeightRef.current ||
      // Only handle the widget shrinking, if it's by more than 50px.
      Math.abs(value - lastHeightRef.current) > 100 ||
      // Handle the widget hiding itself.
      value === 0
    ) {
      lastHeightRef.current = value;
      autoHeightRef.current = value;
      setAutoHeight(value);
    }
  }

  // Ask the embedded page to scroll the focused field into view, after the
  // WebView has resized. Fires twice to cover the keyboard animation settling.
  function scheduleScrollIntoView() {
    const inject = () => {
      webviewRef.current?.injectJavaScript(
        'window.__fcScrollFocusedIntoView && window.__fcScrollFocusedIntoView(); true;'
      );
    };
    setTimeout(inject, 50);
    setTimeout(inject, 300);
  }

  // When a field is focused and the keyboard is up, shrink the WebView so its
  // bottom edge sits at the top of the keyboard, then pull the field into view.
  function applyKeyboardAvoidance() {
    if (props.disableKeyboardAvoidance) {
      return;
    }
    if (!inputFocusedRef.current || keyboardTopYRef.current === null) {
      return;
    }
    const node = containerRef.current;
    if (!node) {
      return;
    }
    node.measureInWindow((_x, y) => {
      const keyboardTopY = keyboardTopYRef.current;
      if (keyboardTopY === null) {
        return;
      }
      const effective = computeKeyboardAvoidHeight({
        autoHeight: autoHeightRef.current,
        containerTopY: y,
        keyboardTopY,
      });
      setCappedHeight(effective < autoHeightRef.current ? effective : null);
      scheduleScrollIntoView();
    });
  }

  function clearKeyboardAvoidance() {
    keyboardTopYRef.current = null;
    setCappedHeight(null);
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
      } else if (data.type === 'fc-input-focus') {
        inputFocusedRef.current = true;
        applyKeyboardAvoidance();
      } else if (data.type === 'fc-input-blur') {
        inputFocusedRef.current = false;
      } else if (data.type === 'open-profile') {
        if (configFunctions.onOpenProfile) {
          if (configFunctions.onOpenProfile(data.userId) && webviewRef.current) {
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
            webviewRef.current.injectJavaScript(js);
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

  useEffect(() => {
    if (props.disableKeyboardAvoidance) {
      return undefined;
    }
    const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
      keyboardTopYRef.current = e.endCoordinates.screenY;
      applyKeyboardAvoidance();
    });
    const changeSub = Keyboard.addListener('keyboardDidChangeFrame', (e) => {
      if (keyboardTopYRef.current !== null) {
        keyboardTopYRef.current = e.endCoordinates.screenY;
        applyKeyboardAvoidance();
      }
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      clearKeyboardAvoidance();
    });
    return () => {
      showSub.remove();
      changeSub.remove();
      hideSub.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.disableKeyboardAvoidance]);

  const effectiveHeight = cappedHeight !== null ? cappedHeight : autoHeight;
  const injectedJavaScript = props.disableKeyboardAvoidance
    ? undefined
    : buildKeyboardAvoidanceScript(instanceIdRef.current);

  return (
    <View
      ref={containerRef}
      // collapsable={false} keeps this View in the native hierarchy on Android
      // so measureInWindow works when positioning above the keyboard.
      collapsable={false}
      style={{ backgroundColor: props.backgroundColor }}
    >
      <WebView
        ref={(ref) => {
          webviewRef.current = ref;
        }}
        style={{ height: effectiveHeight, backgroundColor: props.backgroundColor }}
        startInLoadingState={true}
        renderLoading={
          props.renderLoading ?? (() => <ActivityIndicator size="small" />)
        }
        renderError={props.renderError}
        scalesPageToFit={true}
        source={{ uri }}
        injectedJavaScript={injectedJavaScript}
        domStorageEnabled={true}
        javaScriptEnabled={true}
        nestedScrollEnabled={true}
        overScrollMode="never"
        showsVerticalScrollIndicator={props.showsVerticalScrollIndicator}
        onMessage={(event) => eventHandler(event)}
        onShouldStartLoadWithRequest={shouldStartLoadWithRequest}
        onError={props.onError}
        onLoad={props.onLoad}
      />
    </View>
  );
}
