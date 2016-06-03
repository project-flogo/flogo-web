import {Component} from '@angular/core';
import {InformationPopupComponent, CopyToClipboardComponent} from '../../../common/components/components';

@Component({
  selector: 'flogo-transform-help',
  directives: [CopyToClipboardComponent, InformationPopupComponent],
  moduleId: module.id,
  styleUrls: ['help.component.css'],
  templateUrl: 'help.tpl.html'
})
export class HelpComponent {
}
