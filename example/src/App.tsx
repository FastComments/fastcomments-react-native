import * as React from 'react';

import {FastCommentsCommentWidget} from '../../src/index';

export default function App() {
  const myTenantId = 'demo'; // Your tenant id. Can be fetched from https://fastcomments.com/auth/my-account/api-secret
  const myAppPageId = 'native-test'; // the ID or URL of the comment thread in your app.
  const config = {
    tenantId: myTenantId,
    urlId: myAppPageId
  };

  return (
      <FastCommentsCommentWidget config={config}/>
  );
}
