import {UIModelConverterService} from "./ui-model-converter.service";
import {RESTAPITriggersService} from "../../../common/services/restapi/triggers-api.service";
import {RESTAPIActivitiesService} from "../../../common/services/restapi/activities-api.service";
import {ErrorService} from "../../../common/services/error.service";
import {
  mockActivitiesDetails, mockErrorFlow, mockErrorHandler, mockFlow, mockResultantUIFlow, mockResultantUIFlowWithError,
  mockResultantUIFlowWithTransformations, mockTransformationData
} from "./ui-model-flow.mock";
import {mockErrorTrigger, mockTrigger, mockTriggerDetails} from "./ui-model-trigger.mock";
import Spy = jasmine.Spy;
import {FlogoProfileService} from "../../../common/services/profile.service";
import {RESTAPIContributionsService} from "../../../common/services/restapi/v2/contributions.service";

describe("Service: UI Model Converter", function(this: {
  service: UIModelConverterService,
  errorService: ErrorService,
  triggerServiceMock: RESTAPITriggersService,
  activityServiceMock: RESTAPIActivitiesService,
  profileService: FlogoProfileService,
  contribServiceMock: RESTAPIContributionsService
}){

  beforeEach(()=>{
    this.triggerServiceMock = jasmine.createSpyObj<RESTAPITriggersService>('triggerService', [
      'getTriggerDetails'
    ]);
    this.activityServiceMock = jasmine.createSpyObj<RESTAPIActivitiesService>('activityService', [
      'getActivityDetails'
    ]);
    this.contribServiceMock = jasmine.createSpyObj<RESTAPIContributionsService>('contribService', [
      'getContributionDetails'
    ]);
    this.errorService = new ErrorService();
    this.profileService = new FlogoProfileService(this.triggerServiceMock,
      this.activityServiceMock, this.contribServiceMock);
    this.service = new UIModelConverterService(this.triggerServiceMock,
      this.activityServiceMock, this.contribServiceMock, this.profileService, this.errorService);
  });

  it('Should throw error when trigger does not have a ref', ()=> {
    let thrownError: Error;
    try{
      this.service.getWebFlowModel(mockFlow, mockErrorTrigger);
    } catch (error) {
      thrownError = error;
      expect(error.name).toEqual('Trigger: Wrong input json file');
      expect(error.type).toEqual('ValidationError');
    }
    expect(thrownError).toBeDefined();
  });

  it('Should throw error when Activity does not have a activityRef', ()=> {
    let thrownError: Error;
    try{
      var spy = <Spy>this.triggerServiceMock.getTriggerDetails;
      spy.and.returnValue({});
      this.service.getWebFlowModel(mockErrorFlow, mockTrigger);
    } catch (error) {
      thrownError = error;
      expect(error.name).toEqual('Activity: Wrong input json file');
      expect(error.type).toEqual('ValidationError');
    }
    expect(thrownError).toBeDefined();
  });

  it('Should convert the Engine Flow Model to UI Flow model', (done) => {
    var spyTriggerService = <Spy>this.triggerServiceMock.getTriggerDetails;
    spyTriggerService.and.returnValue(Promise.resolve(mockTriggerDetails));
    var spyActivityService = <Spy>this.activityServiceMock.getActivityDetails;
    spyActivityService.and.callFake(function(activityRef){
      if(activityRef === 'github.com/TIBCOSoftware/flogo-contrib/activity/log') {
        return Promise.resolve(mockActivitiesDetails[0]);
      } else {
        return Promise.resolve(mockActivitiesDetails[1]);
      }
    });
    this.service.getWebFlowModel(mockFlow, mockTrigger)
      .then((flow)=> {
        let flowWithoutId = formFlowWithoutId(flow);
        expect(_.isEqual(flowWithoutId,mockResultantUIFlow)).toEqual(true);
        done();
      });
  });

  it('Should have error handler in UI Flow model', (done) => {
    let thisTestData: any = Object.assign({}, mockFlow);
    let spyTriggerService = <Spy>this.triggerServiceMock.getTriggerDetails;
    spyTriggerService.and.returnValue(mockTriggerDetails);
    let spyActivityService = <Spy>this.activityServiceMock.getActivityDetails;
    spyActivityService.and.callFake(function(activityRef){
      if(activityRef === 'github.com/TIBCOSoftware/flogo-contrib/activity/log') {
        return mockActivitiesDetails[0];
      } else {
        return mockActivitiesDetails[1];
      }
    });
    thisTestData.data.flow.errorHandlerTask = mockErrorHandler.errorHandlerTask;
    this.service.getWebFlowModel(thisTestData, mockTrigger)
      .then((flow)=>{
        let flowWithoutId = formFlowWithoutId(flow);
        expect(_.isEqual(flowWithoutId,mockResultantUIFlowWithError)).toEqual(true);
        done();
      });
  });

  it('Should maintain the transformation details of a tile', (done) => {
    let thisTestData: any = Object.assign({}, mockFlow);
    var spyTriggerService = <Spy>this.triggerServiceMock.getTriggerDetails;
    spyTriggerService.and.returnValue(mockTriggerDetails);
    var spyActivityService = <Spy>this.activityServiceMock.getActivityDetails;
    spyActivityService.and.callFake(function(activityRef){
      if(activityRef === 'github.com/TIBCOSoftware/flogo-contrib/activity/log') {
        return mockActivitiesDetails[0];
      } else {
        return mockActivitiesDetails[1];
      }
    });
    thisTestData.data.flow.rootTask.tasks[0].attributes = mockTransformationData.attributes;
    thisTestData.data.flow.rootTask.tasks[0].inputMappings = mockTransformationData.inputMappings;
    this.service.getWebFlowModel(thisTestData, mockTrigger)
      .then((flow)=>{
        let flowWithoutId = formFlowWithoutId(flow);
        expect(_.isEqual(flowWithoutId,mockResultantUIFlowWithTransformations)).toEqual(true);
        done();
      });
  });

  function formFlowWithoutId(flow) {
    let dummyIndex = 0;
    let noIdFlow: any = Object.assign({},_.pick(flow, ['name', 'description', 'appId', 'app']), {
      paths: {
        root: {},
        nodes: {},
      },
      items: {},
    });
    noIdFlow.paths.root.is = "some_id_" + dummyIndex++;
    let allNodes = flow.paths.nodes, allItems = flow.items;
    for(let nodeKey in allNodes) {
      noIdFlow.paths.nodes["some_id_"+dummyIndex] = allNodes[nodeKey];
      noIdFlow.paths.nodes["some_id_"+dummyIndex].id = "some_id_"+dummyIndex;
      noIdFlow.paths.nodes["some_id_"+dummyIndex].taskID = "some_id_"+dummyIndex;
      noIdFlow.paths.nodes["some_id_"+dummyIndex].children = _.map(allNodes[nodeKey].children, (v,i) => "some_id_"+i);
      noIdFlow.paths.nodes["some_id_"+dummyIndex].parents = _.map(allNodes[nodeKey].parents, (v,i) => "some_id_"+i);
      dummyIndex += 1;
    }
    for(let itemKey in allItems) {
      noIdFlow.items["some_id_"+dummyIndex] = allItems[itemKey];
      noIdFlow.items["some_id_"+dummyIndex].id = "some_id_"+dummyIndex;
      if(allItems[itemKey].nodeId){
        noIdFlow.items["some_id_"+dummyIndex].nodeId = "some_id_"+dummyIndex;
      }
      dummyIndex += 1;
    }
    if(flow.errorHandler){
      noIdFlow.errorHandler = formFlowWithoutId(flow.errorHandler);
    }
    return noIdFlow;
  }
});
