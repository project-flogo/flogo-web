import { Component, ElementRef, EventEmitter, Input, Output } from '@angular/core';
import { RESTAPIFlowsService } from '../../../common/services/restapi/flows-api.service';
import {  RESTAPIActivitiesService } from '../../../common/services/restapi/activities-api.service';
import {  RESTAPITriggersService } from '../../../common/services/restapi/triggers-api.service';
import {  RESTAPITriggersService as RESTAPITriggersServiceV2 } from '../../../common/services/restapi/v2/triggers-api.service';
import {  APIFlowsService as APIFlowsServiceV2 } from '../../../common/services/restapi/v2/flows-api.service';
import {  RESTAPIHandlersService } from '../../../common/services/restapi/v2/handlers-api.service';
import { flogoFlowToJSON } from "../../flogo.flows.detail.diagram/models/flow.model";
import { notification, objectFromArray } from '../../../common/utils';

@Component( {
  selector : 'flogo-flows-import',
  moduleId : module.id,
  templateUrl : 'import-flow.tpl.html',
  styleUrls : [ 'import-flow.component.css' ]
} )
export class FlogoFlowsImport {
  @Input()
  public appId : string;
  @Output()
  public importError: EventEmitter<any>;
  @Output()
  public importSuccess: EventEmitter<any>;
  public showFileNameDialog: boolean = false;
  public repeatedName: string = '';
  public importFile: any;
  private _elmRef: ElementRef;
  public installedActivities: any[];
  public installedTriggers: any[];

  constructor(elementRef: ElementRef, private _flowsAPIs: RESTAPIFlowsService,
              private _activitiesAPIs: RESTAPIActivitiesService,
              private _triggersAPIs: RESTAPITriggersService,
              private _triggersAPIsV2: RESTAPITriggersServiceV2,
              private _handlersAPIs: RESTAPIHandlersService,
              private _flowAPIsV2: APIFlowsServiceV2) {
    this._elmRef = elementRef;
    this.importError = new EventEmitter<any>();
    this.importSuccess = new EventEmitter<any>();
    this.installedActivities = null;
    this.installedTriggers = null;
  }

  public selectFile(evt: any) {
    let fileElm = jQuery(this._elmRef.nativeElement)
      .find('.flogo-flows-import-input-file');

    // clean the previous selected file
    try {
      fileElm.val('');
    } catch (err) {
      console.error(err);
    }

    // trigger the file input.
    fileElm.click();
  }

  getErrorMessageActivitiesNotInstalled(errors) {
    let errorMessage = '';
    let details = errors.details;
    let errorTriggers = '';
    let errorActivities = '';

    if (details.triggers.length) {
      errorTriggers = ` Missing trigger: "${details.triggers[0]}".`;
    }

    if (details.activities.length) {
      let activities = details.activities.map((item) => {
        return `"${item}"`
      })

      errorActivities += `Missing Activities: ${activities.join(', ')}`;
    }
    errorMessage = `Flow could not be imported, some triggers/activities are not installed.${errorTriggers} ${errorActivities}`;

    return errorMessage;
  }


  onCorrectName(name: string) {
    this.resetValidationFlags();
    this.uploadFlow(this.importFile, name);
  }

  onClose(closed: boolean) {
    this.resetValidationFlags();
  }

  resetValidationFlags() {
    this.showFileNameDialog = false;
    this.repeatedName = '';
  }

  uploadFlow(flow, flowName) {
   this._flowsAPIs.importFlow(flow, this.appId, flowName)
      .then((result: any) => {
        this.importSuccess.emit(result);
      })
      .catch((error: any) => {
        let errorCode = error.details && error.details.ERROR_CODE || '';

        switch (errorCode) {
          case 'NAME_EXISTS':
            this.showFileNameDialog = true;
            break;

          case 'ERROR_VALIDATION':
            let errorMessage = this.getErrorMessageActivitiesNotInstalled(error);
            this.importError.emit({response: errorMessage});
            break;

          default:
            this.importError.emit(error);
            break;
        }
      });
  }

  private setRefFieldByActivityType(items, triggers, activities) {
    let modifiedItems = Object.assign({}, items);

    for(var key in modifiedItems) {

      if(modifiedItems[key].hasOwnProperty('triggerType')) {
        let triggerFound = triggers.find((trigger) => trigger.triggerType === modifiedItems[key].triggerType);
        if(triggerFound) {
          modifiedItems[key].ref = triggerFound.ref;
        }
      }

      if(modifiedItems[key].hasOwnProperty('activityType')) {
        let activityFound = activities.find((activity) => activity.activityType === modifiedItems[key].activityType);
        if(activityFound) {
          modifiedItems[key].ref = activityFound.ref;
        }
      }
    }

    return modifiedItems;
  }

  private getTrigger(items) {
    let trigger = null;

    for(var key in items) {
      let currentItem = items[key];
      if(currentItem.hasOwnProperty('triggerType')) {
        return currentItem;
      }
    }

    return trigger;
  }

  onFileChange(evt: any) {
      this.importFile = <File> _.get(evt, 'target.files[0]');

      if (_.isUndefined(this.importFile)) {
        console.error('Invalid file to import');
      } else {
        var reader = new FileReader();
        reader.onload = ((theFile) => {
          return (e) => {
            try {
              let uiFlow = JSON.parse(e.target.result);
              this.importFlow(uiFlow)
                .then((handler)=> {
                  this.importSuccess.emit(handler);
                })
                .catch(err => {
                  this.importError.emit({response: 'Error importing flow'});
                });
            } catch (err) {
              this.importError.emit(err);
            }
          }
        })(this.importFile);

        reader.readAsText(this.importFile);
      }
}

  importFlow(uiFlow: any) {
    return new Promise((resolve, reject) => {
      let promises = [];
      promises.push(this.installedActivities ? Promise.resolve(this.installedActivities) : this._activitiesAPIs.getActivities());
      promises.push(this.installedTriggers ? Promise.resolve(this.installedTriggers) : this._triggersAPIs.getTriggers());

      Promise.all(promises)
        .then((installed) => {
          [this.installedActivities, this.installedTriggers] = installed;
          let endpointSettings, outputs, trigger, newTrigger,action;

          try {
            uiFlow.items = this.setRefFieldByActivityType(uiFlow.items, this.installedTriggers, this. installedActivities);
            if(!uiFlow.id) {
              uiFlow.id = new Date().toDateString();
            }
            const { name, description, flow } = flogoFlowToJSON(uiFlow);
            action = { name, description, data: { flow } };

            trigger = this.getTrigger(uiFlow.items);
            newTrigger = Object.assign({}, _.pick(trigger, 'name', 'description', 'ref'), {settings: null} );
            newTrigger.settings = objectFromArray(trigger.settings);

            endpointSettings = objectFromArray(trigger.endpoint.settings);
            outputs = objectFromArray(trigger.outputs);
          }catch(err) {
            reject(err);
          }

          this._triggersAPIsV2.createTrigger(this.appId, newTrigger)
            .then((createdTrigger)=> {
              this._flowAPIsV2.createFlow(this.appId, action)
                .then((createdFlow) => {
                  this._handlersAPIs.updateHandler(createdTrigger.id, createdFlow.id, {settings: endpointSettings, outputs})
                    .then((createdHandler) => {
                      resolve(createdHandler);
                    });
                });
            })
            .catch((err)=> {
              reject(err);
            });
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

}
