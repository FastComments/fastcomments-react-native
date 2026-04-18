import { AppRegistry } from 'react-native';
import ShowcaseApp from './src/ShowcaseApp';
import appInfo from './app.json';

AppRegistry.registerComponent(appInfo.name, () => ShowcaseApp);
AppRegistry.runApplication(appInfo.name, {
  initialProps: {},
  rootTag: document.getElementById('root'),
});
