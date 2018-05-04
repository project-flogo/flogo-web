import { UIModelConverterService } from './ui-model-converter.service';
import { ErrorService } from '../../core/services/error.service';
import {
  mockActivitiesDetails,
  mockErrorFlow,
  mockErrorHandler,
  mockFlow,
  mockResultantUIFlow,
  mockResultantUIFlowWithError,
  mockResultantUIFlowWithTransformations,
  mockTransformationData
} from './ui-model-flow.mock';
import { mockTriggerDetails } from './ui-model-trigger.mock';
import { RESTAPIContributionsService } from '../../core/services/restapi/v2/contributions.service';
import Spy = jasmine.Spy;
import {FLOGO_PROFILE_TYPE} from '@flogo/core/constants';
import {ActionBase} from '@flogo/core';

describe('Service: UI Model Converter', function (this: {
  service: UIModelConverterService,
  errorService: ErrorService,
  contribServiceMock: RESTAPIContributionsService,
  emptySchemaRegistry: Map<string, ActionBase>
}) {

  beforeEach(() => {
    this.contribServiceMock = jasmine.createSpyObj<RESTAPIContributionsService>('contribService', [
      'getContributionDetails'
    ]);
    this.errorService = new ErrorService();
    this.service = new UIModelConverterService(this.contribServiceMock, this.errorService);
    this.service.setProfile(FLOGO_PROFILE_TYPE.MICRO_SERVICE);
    this.emptySchemaRegistry = new Map(<[string, ActionBase][]> []);
  });

  it('Should throw error when Activity does not have a activityRef', () => {
    let thrownError: Error;
    try {
      const spy = <Spy>this.contribServiceMock.getContributionDetails;
      spy.and.returnValue({});
      this.service.getWebFlowModel(mockErrorFlow, this.emptySchemaRegistry);
    } catch (error) {
      thrownError = error;
      expect(error.name).toEqual('Activity: Wrong input json file');
      expect(error.type).toEqual('ValidationError');
    }
    expect(thrownError).toBeDefined();
  });

  it('Should convert the Engine Flow Model to UI Flow model', (done) => {
    const thisTestData: any = _.cloneDeep(mockFlow);
    const spyTriggerService = <Spy>this.contribServiceMock.getContributionDetails;
    spyTriggerService.and.returnValue(Promise.resolve(mockTriggerDetails));
    const spyActivityService = <Spy>this.contribServiceMock.getContributionDetails;
    spyActivityService.and.callFake(function (type, activityRef) {
      if (activityRef === 'github.com/TIBCOSoftware/flogo-contrib/activity/log') {
        return Promise.resolve(mockActivitiesDetails[0]);
      } else {
        return Promise.resolve(mockActivitiesDetails[1]);
      }
    });
    this.service.getWebFlowModel(thisTestData, this.emptySchemaRegistry)
      .then((flow) => {
        const flowWithoutId = formFlowWithoutId(_.cloneDeep(flow));
        expect(flowWithoutId).toEqual(mockResultantUIFlow);
        done();
      });
  });

  it('Should have error handler in UI Flow model', (done) => {
    const thisTestData: any = _.cloneDeep(mockFlow);
    const spyTriggerService = <Spy>this.contribServiceMock.getContributionDetails;
    spyTriggerService.and.returnValue(mockTriggerDetails);
    const spyActivityService = <Spy>this.contribServiceMock.getContributionDetails;
    spyActivityService.and.callFake(function (type, activityRef) {
      if (activityRef === 'github.com/TIBCOSoftware/flogo-contrib/activity/log') {
        return mockActivitiesDetails[0];
      } else {
        return mockActivitiesDetails[1];
      }
    });
    thisTestData.data.flow.errorHandlerTask = mockErrorHandler.errorHandlerTask;
    this.service.getWebFlowModel(thisTestData, this.emptySchemaRegistry)
      .then((flow) => {
        const flowWithoutId = formFlowWithoutId(_.cloneDeep(flow));
        expect(flowWithoutId).toEqual(mockResultantUIFlowWithError);
        done();
      });
  });

  it('Should maintain the transformation details of a tile', (done) => {
    const thisTestData: any = _.cloneDeep(mockFlow);
    const spyTriggerService = <Spy>this.contribServiceMock.getContributionDetails;
    spyTriggerService.and.returnValue(mockTriggerDetails);
    const spyActivityService = <Spy>this.contribServiceMock.getContributionDetails;
    spyActivityService.and.callFake(function (type, activityRef) {
      if (activityRef === 'github.com/TIBCOSoftware/flogo-contrib/activity/log') {
        return mockActivitiesDetails[0];
      } else {
        return mockActivitiesDetails[1];
      }
    });
    thisTestData.data.flow.rootTask.tasks[0].attributes = mockTransformationData.attributes;
    thisTestData.data.flow.rootTask.tasks[0].inputMappings = mockTransformationData.inputMappings;
    this.service.getWebFlowModel(thisTestData, this.emptySchemaRegistry)
      .then((flow) => {
        const flowWithoutId = formFlowWithoutId(_.cloneDeep(flow));
        expect(flowWithoutId).toEqual(mockResultantUIFlowWithTransformations);
        done();
      });
  });

  function formFlowWithoutId(flow) {
    let dummyIndex = 0;
    const noIdFlow: any = Object.assign({}, _.pick(flow, ['name', 'description', 'appId', 'app', 'metadata']), {
      paths: {
        root: {},
        nodes: {},
      },
      items: {},
    });
    noIdFlow.paths.root.is = 'some_id_' + dummyIndex++;
    const allNodes = flow.paths.nodes;
    const allItems = flow.items;
    /* tslint:disable:forin */
    for (const nodeKey in allNodes) {
      noIdFlow.paths.nodes['some_id_' + dummyIndex] = allNodes[nodeKey];
      noIdFlow.paths.nodes['some_id_' + dummyIndex].id = 'some_id_' + dummyIndex;
      noIdFlow.paths.nodes['some_id_' + dummyIndex].taskID = 'some_id_' + dummyIndex;
      noIdFlow.paths.nodes['some_id_' + dummyIndex].children = _.map(allNodes[nodeKey].children, (v, i) => 'some_id_' + i);
      noIdFlow.paths.nodes['some_id_' + dummyIndex].parents = _.map(allNodes[nodeKey].parents, (v, i) => 'some_id_' + i);
      dummyIndex += 1;
    }
    for (const itemKey in allItems) {
      noIdFlow.items['some_id_' + dummyIndex] = allItems[itemKey];
      noIdFlow.items['some_id_' + dummyIndex].id = 'some_id_' + dummyIndex;
      if (allItems[itemKey].nodeId) {
        noIdFlow.items['some_id_' + dummyIndex].nodeId = 'some_id_' + dummyIndex;
      }
      dummyIndex += 1;
    }
    /* tslint:enable:forin */
    if (flow.errorHandler) {
      noIdFlow.errorHandler = formFlowWithoutId(flow.errorHandler);
    }
    return noIdFlow;
  }
});
