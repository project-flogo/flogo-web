//import {enableProdMode} from '@angular/core';

import { platformBrowser }    from '@angular/platform-browser';
import { MainModuleNgFactory } from './aot/main.module.ngfactory';

//enableProdMode();

platformBrowser().bootstrapModuleFactory(MainModuleNgFactory);
