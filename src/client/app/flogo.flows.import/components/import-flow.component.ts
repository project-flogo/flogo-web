import { Component, ElementRef, EventEmitter, Input, Output } from '@angular/core';
import { RESTAPIFlowsService } from '../../../common/services/restapi/flows-api.service';
import { notification } from '../../../common/utils';

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

  constructor(elementRef: ElementRef, private _flowsAPIs: RESTAPIFlowsService) {
    this._elmRef = elementRef;
    this.importError = new EventEmitter<any>();
    this.importSuccess = new EventEmitter<any>();
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
    // fileElm.click();
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

  onFileChange(evt: any) {
    this.importFile = <File> _.get(evt, 'target.files[0]');

    if (_.isUndefined(this.importFile)) {
      console.error('Invalid file to import');
    } else {
      var reader = new FileReader();
      reader.onload = ((theFile) => {
        return (e) => {
          try {
            let flow = JSON.parse(e.target.result);
            this.repeatedName = flow.name;
          } catch (err) {
          }

          this.uploadFlow(this.importFile, null);
        }
      })(this.importFile);

      reader.readAsText(this.importFile);
    }
  }

}
