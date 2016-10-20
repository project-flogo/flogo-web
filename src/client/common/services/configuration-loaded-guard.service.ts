import { Injector } from '@angular/core';
import { ConfigurationService } from './configuration.service';

import { Injectable }     from '@angular/core';
import { CanActivate }    from '@angular/router';

@Injectable()
export class ConfigurationLoadedGuard implements CanActivate {

  private _config : ConfigurationService;

  constructor(config : ConfigurationService) {
    this._config = config;
  }

  canActivate() {
    return this._config.getConfiguration()
      .then(() => {
        return true;
      })
      .catch((err) => {
        console.log(err);
        return false;
      });
  }
}
