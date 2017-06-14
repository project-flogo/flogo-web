import { Component, Input, SimpleChanges, OnChanges, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { ModalComponent } from 'ng2-bs3-modal/ng2-bs3-modal';
import { TranslateService } from 'ng2-translate/ng2-translate';

import { PostService } from '../../../common/services/post.service';
import { SanitizeService } from '../../../common/services/sanitize.service';
import { APIFlowsService } from '../../../common/services/restapi/v2/flows-api.service';
import { PUB_EVENTS } from '../message';
import { UniqueNameValidator } from '../validators/unique-name.validator';


@Component({
    selector: 'flogo-flows-add',
    // moduleId: module.id,
    templateUrl: 'add.tpl.html',
    styleUrls: ['add.component.less']
})
export class FlogoFlowsAddComponent implements OnChanges {
  @ViewChild('modal')
  public modal: ModalComponent;
  @Input()
  public appId: string;
  public flow: FormGroup;
  private triggerId: string;

  constructor(public translate: TranslateService,
    private postService: PostService,
    private flowsService: APIFlowsService,
    private formBuilder: FormBuilder,
    private sanitizer: SanitizeService
  ) {
    this.resetForm();
  }

  public ngOnChanges(changes: SimpleChanges) {
    const appIdChange = changes['appId'];
    if (appIdChange && appIdChange.currentValue !== appIdChange.previousValue) {
      this.resetForm();
    }
  }

  public open(triggerId?) {
    this.triggerId = triggerId;
    this.resetForm();
    this.modal.open();
  }

  public createFlow({ value, valid }: { value: { name: string, description?: string }, valid: boolean }) {
    if (this.triggerId) {
      value['triggerId'] = this.triggerId;
    }
    value.name =  this.sanitizer.sanitizeHTMLInput(value.name);
    value.description = this.sanitizer.sanitizeHTMLInput(value.description);

    this.postService.publish(_.assign({}, PUB_EVENTS.addFlow, {data: value}));
    this.closeAddFlowModal();
  }

  public closeAddFlowModal() {
      this.resetForm();
      this.triggerId = null;
      this.modal.close();
  }

  private resetForm() {
    this.flow = this.formBuilder.group({
      name: ['', [],
        Validators.composeAsync([
          // we need to wrap into a compose async validator, otherwise async validators overwrite sync validators
          (control: AbstractControl) => Promise.resolve(Validators.required(control)),
          UniqueNameValidator.make(this.flowsService, this.appId)
        ])
      ],
      description: ['']
    });
  }
}
