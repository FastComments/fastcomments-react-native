import { AppRegistry } from 'react-native';
import App from './src/App';
// import CallbacksExampleApp from './src/CallbacksExampleApp';
// import DarkModeApp from './src/DarkModeApp';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
