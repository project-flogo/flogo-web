import {Injectable} from '@angular/core';

@Injectable()
export class PostService{

  constructor(){
    console.log("PostService");
    if(!postal){
      console.error("PostService is depended on postal, it seems you didn't load postal");
    }
  }

  publish(envelope:any){
    return postal.publish(envelope);
  }

  subscribe(options:any){
    return postal.subscribe(options);
  }

  unsubscribe(sub:any){
    return postal.unsubscribe(sub);
  }
}
