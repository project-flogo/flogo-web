import { Component, SimpleChange } from 'angular2/core';
import {ROUTER_DIRECTIVES} from 'angular2/router';
import {FlogoTaskContainerComponent} from '../../flogo.task.container/components/task.container.component';
import {BehaviorSubject} from 'rxjs/Rx';

@Component({
  selector: 'flogo-task',
  styleUrls: ['task.css'],
  moduleId: module.id,
  templateUrl: 'task.tpl.html',
  directives: [ROUTER_DIRECTIVES, FlogoTaskContainerComponent],
  inputs: ['data:task']
})

export class FlogoTaskComponent{
  modifiedState: any;
  inputSchema: string;
  inputState: string;
  inputSchemaSubject: any;
  inputStateSubject: any;
  modifiedStateSubject: any;
  data: any;

  setData(data:any) {
    this.data = data;
  }

  getStateData() {
    return {
      "name": "pets-query",
      "inputs": [
        {
          "name": "url",
          "value": "http://localhost"
        },
        {
          "name": "port",
          "value": "8081"
        },
        {
          "name": "payload",
          "value": {
            "age": 3,
            "type": "dog"
          }
        }
      ],
      "outputs": [
        {
          "name": "result",
          "value": false
        }
      ]
    }

  }

  getSchema() {
    return {
      "name": "pets-query",
      "title": "Pets query",
      "inputs" : [
        {
          "name": "url",
          "type": "string",
          "title": "URL"
        },
        {
          "name": "port",
          "type": "number",
          "title": "Port"
        },
        {
          "name": "payload",
          "type": "object",
          "title": "Payload"
        }
      ],
      "outputs": [
        {
          "name": "result",
          "type": "boolean",
          "title": "Is OK?"
        }
      ]
    }
  }

  stringify(json:any) {
    return JSON.stringify(json, null, 2);
  }

  changeInputSchema(event:any) {
    this.inputSchemaSubject.next(event.value);
  }

  changeInputState(event:any) {
    this.inputStateSubject.next(event.value);
  }

  _init() {
    this.inputSchema = this.stringify(this.getSchema());
    this.inputState  = this.stringify(this.getStateData());

    this.inputSchemaSubject = new BehaviorSubject(this.inputSchema);
    this.inputStateSubject  = new BehaviorSubject(this.inputState);
    this.modifiedStateSubject  = new BehaviorSubject({});

    this.modifiedStateSubject.subscribe(
      (value:any) => {
        this.modifiedState = JSON.stringify(value, null, 2);
      }

    );
  }

  ngOnChanges(
    changes : {
      [ propKey : string ] : SimpleChange
    }
  ) {

    console.log( changes );

    if ( changes[ 'data' ] ) {
      if ( this.data ) {
        this._init();
      }
    }
  }

  onGetModifiedState(state:any) {
  }

}
