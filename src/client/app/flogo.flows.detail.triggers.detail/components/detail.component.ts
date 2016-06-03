import {Component} from '@angular/core';
import {PostService} from '../../../common/services/post.service';

@Component({
  selector: 'flogo-flows-detail-triggers-detail',
  moduleId: module.id,
  templateUrl: 'detail.tpl.html',
  styleUrls: ['detail.component.css']
})

export class FlogoFlowsDetailTriggersDetail{
  constructor(private _postService: PostService){
    this.initSubscribe();
  }

  private initSubscribe(){

  }
}
