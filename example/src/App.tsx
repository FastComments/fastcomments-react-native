import * as React from 'react';

import { FastCommentsCommentWidget } from '../../src/index';
import { useState } from 'react';
import type { FastCommentsCommentWidgetConfig } from 'fastcomments-typescript';

export default function App() {
  const myTenantId = 'demo'; // Your tenant id. Can be fetched from https://fastcomments.com/auth/my-account/api-secret
  const myAppPageId = 'native-test'; // the ID or URL of the comment thread in your app.
  const myAppPageUrl = 'https://example.com/external-page'; // you can optional set a url to an external page
  const myAppPageTitle = 'Example Title'; // ... and you probably want a title for this content

  const [config] = useState<FastCommentsCommentWidgetConfig>({
    tenantId: myTenantId,
    urlId: myAppPageId,
    url: myAppPageUrl,
    pageTitle: myAppPageTitle
  });

  // Uncomment this to test changing pages without reloading the whole widget.
  // We could use this to change the logged in user, as well.
  // useEffect(() => {
  //   setTimeout(function () {
  //     setConfig({
  //       ...config,
  //       urlId: 'new-page-id'
  //     });
  //   }, 2000);
  // }, []);

  return <FastCommentsCommentWidget config={config} />;
}
