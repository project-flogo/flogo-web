import { Component, Inject } from '@angular/core';
import { ModalInstance, MODAL_TOKEN } from '@flogo-web/lib-client/modal';

export interface UserParams {
  name: string;
}

@Component({
  selector: 'demo-modal-content',
  template: `
    <flogo-modal size="small" (close)="modalInstance.close()">
      <flogo-modal-header>
        <h2 data-flogo-modal-title>
          Hello {{ user.name || 'stranger' }}, do you like this modal?
        </h2>
      </flogo-modal-header>
      <flogo-modal-body> Please choose an answer</flogo-modal-body>
      <flogo-modal-footer [stretchChildren]="true">
        <button class="action" data-cy="modal-response-yes" (click)="reply('yup!')">
          Yup!
        </button>
        <button class="action" data-cy="modal-response-no" (click)="reply('meh')">
          Meh
        </button>
      </flogo-modal-footer>
    </flogo-modal>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .action {
        width: 2.5rem;
      }

      .action + .action {
        margin-left: 0.5rem;
      }
    `,
  ],
})
export class ModalContentComponent {
  user: UserParams;
  constructor(public modalInstance: ModalInstance<UserParams>) {
    this.user = this.modalInstance.data;
  }

  reply(message: string) {
    this.modalInstance.close(message);
  }
}
