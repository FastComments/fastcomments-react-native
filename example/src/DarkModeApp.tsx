import * as React from 'react';

import { FastCommentsCommentWidget } from '../../src/index';
import { useTheme } from './ShowcaseApp';

export default function DarkModeApp() {
  const { isDark } = useTheme();
  const myTenantId = 'demo'; // Your tenant id. Can be fetched from https://fastcomments.com/auth/my-account/api-secret
  const myAppPageId = 'native-test'; // the ID or URL of the comment thread in your app.
  const config = {
    tenantId: myTenantId,
    urlId: myAppPageId,
    hasDarkBackground: isDark,
  };

  return <FastCommentsCommentWidget key={isDark ? 'd' : 'l'} config={config} backgroundColor={isDark ? '#000' : '#fff'} />;
}
