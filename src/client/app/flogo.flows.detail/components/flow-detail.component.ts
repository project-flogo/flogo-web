import {Component} from '@angular/core';
import {PostService} from '../../../common/services/post.service';

@Component({
  selector: 'flogo-canvas',
  moduleId: module.id,
  templateUrl: 'flow-detail.tpl.html',
  styleUrls: ['flow-detail.component.css']
})


export class FlogoFlowsDetail{
  constructor(private _postService: PostService){
    this.initSubscribe();
  }

  private initSubscribe(){
    //this._postService.subscribe({
    //  channel: "flogo-flows-detail-graphic",
    //  topic: "add-trigger",
    //  callback: function(){
    //    console.group("FlogoNavbarComponent -> constructor");
    //    console.log("receive: ", arguments);
    //    console.groupEnd();
    //  }
    //});
  }
}
