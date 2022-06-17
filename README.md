# fastcomments-react-native

React Native FastComments Components

## Installation

```sh
npm install fastcomments-react-native
```

## Usage - The Live Comment Widget

The API is slightly different compared to `fastcomments-react`. With native, we pass a config object which follows [this structure](https://github.com/FastComments/fastcomments-typescript/blob/main/src/fast-comments-comment-widget-config.ts#L35).

```js
import { FastCommentsCommentWidget } from 'fastcomments-react-native';

// ...

  const myTenantId = 'demo'; // Your tenant id. Can be fetched from https://fastcomments.com/auth/my-account/api-secret
  const myAppPageId = 'native-test'; // the ID or URL of the comment thread in your app.
  const [config, setConfig] = useState({
    tenantId: myTenantId,
    urlId: myAppPageId
  });

  // by calling setConfig(), we can do things like change the current page, or the currently logged in user
  // See example/src/App.tsx

  return (
      <FastCommentsCommentWidget config={config}/>
  );
```

## Usage - The Live Chat Widget

```js
import { FastCommentsLiveChatWidget } from 'fastcomments-react-native';

// ...

  const myTenantId = 'demo'; // Your tenant id. Can be fetched from https://fastcomments.com/auth/my-account/api-secret
  const myAppPageId = 'native-test'; // the ID or URL of the comment thread in your app.
  const config = {
    tenantId: myTenantId,
    urlId: myAppPageId
  };

  return (
      <FastCommentsLiveChatWidget config={config}/>
  );
```

## Usage - SSO

FastComments uses HMAC for Secure SSO. To use, have your backend create the SSO object (`sso` config property) and pass it
to the comment widget.

You can find examples for various backends, here: https://github.com/FastComments/fastcomments-code-examples/tree/master/sso

## Peer Dependencies

`fastcomments-react-native` requires `react-native-webview`. As such, you should follow the installation steps for `react-native-webview`.

### Account Region (ATTENTION: EU Customers)

If your account is located in the EU, set `region = 'eu'` in the widget configuration.
Otherwise, you do not have to define `region`.

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT
