import { Component, ElementRef, EventEmitter, Input, OnInit, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { TranslateService } from 'ng2-translate/ng2-translate';
import { PostService } from '../../../common/services/post.service';

import { IFlogoApplicationModel } from '../../../common/application.model';
import { RESTAPIApplicationsService }  from '../../../common/services/restapi/applications-api.service';
import { notification } from '../../../common/utils';
import { ERROR_CONSTRAINT } from '../../../common/constants';
import { RESTAPITriggersService as RESTAPITriggersServiceV2 } from '../../../common/services/restapi/v2/triggers-api.service';
import { PUB_EVENTS } from '../messages';
import {FlogoProfileService} from "../../../common/services/profile.service";

@Component({
  selector: 'flogo-select-trigger',
  // moduleId: module.id,
  templateUrl: 'select-trigger.tpl.html',
  styleUrls: ['select-trigger.less']
})
export class FlogoSelectTriggerComponent implements OnInit, OnChanges {
  @Input() appDetails: any;
  public installedTriggers = [];
  public installTriggerActivated = false;
  public onInstalled = new EventEmitter();
  private addTriggerMsg : any;
  public displayExisting: boolean;

  public existingTriggers = [];


  constructor(public translate: TranslateService,
              private postService: PostService,
              private profileService: FlogoProfileService,
              private triggersServiceV2: RESTAPITriggersServiceV2) {
    this.displayExisting = true;
  }

  ngOnInit() {
  }

  getExistingTriggers() {
    return this.triggersServiceV2.listTriggersApp(this.appDetails.appId);
  }

  loadInstalledTriggers() {

    return this.profileService.getTriggers(this.appDetails.appProfileType)
      .then(
        ( triggers : any )=> {
          this.installedTriggers = triggers;
          return triggers;
        }
      )
      .then((installed) => {
        this.getExistingTriggers()
          .then((triggers) => {
            if(!triggers.length)  {
              this.displayExisting = false;
            }

            const allInstalled = {};

            installed.forEach((item) => {
              allInstalled[item.ref] = Object.assign({},item);
            });

            this.existingTriggers = [];
            triggers.forEach((existing)=> {
              const found = Object.assign({}, allInstalled[existing.ref]);
              if(found) {
                found.id = existing.id;
                found.name = existing.name;
                found.description = existing.description;
                this.existingTriggers.push(found);
              }
            });

          });

      })
      .then(()=> {
        return this.existingTriggers;
      })
      .catch(
        ( err : any )=> {
          console.error( err );
        }
      );
  }

  ngOnChanges(changes: SimpleChanges) {
    if(changes['appDetails']) {
      this.loadInstalledTriggers();
    }
  }


  public openInstallTriggerWindow() {
    this.installTriggerActivated = true;
  }

  public closeModal() {
    this.installTriggerActivated = false;
  }

  public onInstalledAction( response : any ) {
    this.loadInstalledTriggers();
    // bubble the event.
    this.onInstalled.emit( response );
  }

  sendAddTriggerMsg( trigger : any, installType: string ) {
    this.postService.publish(
      _.assign(
        {}, PUB_EVENTS.addTrigger, {
          data : _.assign(
            {},
            this.addTriggerMsg, { id: 'root' },
            { trigger : _.cloneDeep( trigger ) },
            { installType: installType }
          )
        }
      )
    );
  }
}
