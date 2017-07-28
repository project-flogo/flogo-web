import {FlogoFlowService} from "./flow.service";
import {UIModelConverterService} from "./ui-model-converter.service";
import Spy = jasmine.Spy;
import {mockResultantUIFlow} from "./ui-model-flow.mock";
import {resultantFlowModelForCanvas} from "./flow-for-canvas.mock";
import {MockAPIFlowsService} from "../../../common/services/restapi/v2/flows-api.service.mock";
import {MockBackend} from "@angular/http/testing";
import {BaseRequestOptions, Http} from "@angular/http";
import {HttpUtilsService} from "../../../common/services/restapi/http-utils.service";
import {FlowsService} from "../../../common/services/flows.service";

describe("Service: Flow", function(this: {
  service: FlogoFlowService,
  modelConverter: UIModelConverterService,
  commonFlowsService: FlowsService,
  mockRESTAPI: MockAPIFlowsService,

  utilsService: HttpUtilsService
}){

  beforeEach(()=>{
    this.modelConverter = jasmine.createSpyObj<UIModelConverterService>('converterService', [
      'getWebFlowModel'
    ]);
    this.commonFlowsService = jasmine.createSpyObj<FlowsService>('commonFlowsService', [
      'deleteFlowWithTrigger'
    ]);
    this.mockRESTAPI = new MockAPIFlowsService(new Http(new MockBackend(), new BaseRequestOptions()), new HttpUtilsService());
    this.service = new FlogoFlowService(this.mockRESTAPI, this.modelConverter, this.commonFlowsService);
  });

  it("Should get the Flow Details and convert it to work with canvas component", ()=>{
    var spyConverterService = <Spy>this.modelConverter.getWebFlowModel;
    spyConverterService.and.returnValue(Promise.resolve(Object.assign({},mockResultantUIFlow)));
    this.service.getFlow("dummy")
      .then((response) => {
        expect(_.isEqual(response, resultantFlowModelForCanvas)).toEqual(true);
      });
  });

});
