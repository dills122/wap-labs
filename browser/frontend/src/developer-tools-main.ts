import './styles.css';
import { bindDeveloperToolsWindow } from './app/developer-tools-bridge';
import { developerDrawerTemplate } from './app/shell/developer-drawer-template';

const app = document.querySelector<HTMLElement>('#developer-tools-app');
if (!app) throw new Error('missing #developer-tools-app root');

app.innerHTML = developerDrawerTemplate('window');
const workspace = app.querySelector<HTMLElement>('#developer-tools-workspace');
if (!workspace) throw new Error('missing developer tools workspace');

let dispose: (() => void) | undefined;
void bindDeveloperToolsWindow(workspace).then((cleanup) => {
  dispose = cleanup;
});

if (import.meta.hot) {
  import.meta.hot.dispose(() => dispose?.());
}
