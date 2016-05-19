import {Component} from '@angular/core';
import {ROUTER_DIRECTIVES} from '@angular/router-deprecated';
import {PostService} from '../../../common/services/post.service';

@Component({
  selector: 'flogo-navbar',
  moduleId: module.id,
  templateUrl: 'navbar.tpl.html',
  styleUrls: ['navbar.component.css'],
  directives: [ROUTER_DIRECTIVES]
})

export class FlogoNavbarComponent{

}
