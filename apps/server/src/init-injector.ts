import { createRootContainer } from './injector';
import { loadPlugins } from './plugins';

const { rootContainer, registerResourcePlugin } = createRootContainer();
loadPlugins(registerResourcePlugin);

export { rootContainer, registerResourcePlugin };
