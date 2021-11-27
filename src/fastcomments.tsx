import React, {useState} from 'react';
import WebView from 'react-native-webview';

export default function FastCommentsWidget({config}) {
    if (config.urlId === null || config.urlId === undefined) {
        throw new Error('FastComments Error: A "urlId" is required! This should be a "urlId" property on the config object, that points to a bucket where comments will be stored and render from.');
    }

    if (typeof config.urlId === 'number') {
        config.urlId = '' + config.urlId;
    }

    const [height, setHeight] = useState(500);

    let lastHeight = 0;

    const configFunctions = {};

    for (const key in config) {
        if (typeof config[key] === 'function') {
            configFunctions[key] = config[key];
            delete config[key];
        }
    }

    if (config.sso) {
        if (config.sso.loginCallback) {
            configFunctions.loginCallback = config.sso.loginCallback;
            config.sso.loginCallback = true;
        }
        if (config.sso.logoutCallback) {
            configFunctions.logoutCallback = config.sso.logoutCallback;
            config.sso.logoutCallback = true;
        }
    }

    config = JSON.parse(JSON.stringify(config)); // un-freeze
    config.instanceId = Math.random() + '.' + Date.now();
    const host = config.apiHost ? config.apiHost : 'https://fastcomments.com';

    function updateHeight(value) {
        console.log('Setting height to ', value);
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

    function eventHandler(e) {
        // if (!e.data || e.origin !== host) {
        //     return;
        // }

        console.log('Got Message', e.nativeEvent.data);
        try {
            const data = JSON.parse(e.nativeEvent.data);

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
                configFunctions.loginCallback && configFunctions.loginCallback(config.instanceId);
            } else if (data.type === 'logout') {
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
            }
        } catch (err) {
            if (config.apiHost) { // only log errors during testing
                console.error(e, err);
            }
        }
    }

    for (const key in config) {
        const configValue = config[key];
        if (configValue === undefined) {
            delete config[key];
        } else if (typeof configValue === 'number') { // example: startingPage
            config[key] = configValue;
        } else if (typeof configValue !== 'object') {
            config[key] = encodeURIComponent(configValue);
        } else {
            config[key] = configValue;
        }
    }

    const uri = host + '/embed?config=' + encodeURIComponent(JSON.stringify(config)) + '&wId=comment-ui-v2';

    console.log('Loading', uri);
    return (
        <WebView
            style={{height}}
            startInLoadingState={true}
            scalesPageToFit={true}
            source={{uri}}
            domStorageEnabled={true}
            javaScriptEnabled={true}
            onMessage={event => eventHandler(event)}
            onError={error => console.log('FastComments WebView failed to load', error)}
            onLoad={() => console.log('Rendered')}/>
    );
}
