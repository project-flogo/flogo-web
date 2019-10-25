import { Injectable } from '@angular/core';
import { RestApiService } from '@flogo-web/lib-client/core';

@Injectable()
export class SimulationConfigurationService {
  constructor(private restApi: RestApiService) {}

  uploadSimulationDataFile(body) {
    const url = 'upload/simulationData';
    const headers = {
      enctype: 'multipart/form-data',
    };
    return this.restApi.post(url, body, { headers });
  }

  getSimulationDataPath(resourceId) {
    const url = this.prepareUrl(resourceId);
    return this.restApi.get(url);
  }

  removeSimulationDataFile(resourceId) {
    const url = this.prepareUrl(resourceId);
    return this.restApi.delete(url);
  }

  prepareUrl(resourceId) {
    return `resources/simulateDataPath/${resourceId}`;
  }
}
