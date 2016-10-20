import { Component, OnChanges, SimpleChange, EventEmitter } from '@angular/core';

@Component( {
  selector : 'flogo-installer-list-view',
  moduleId : module.id,
  inputs : [ 'installables: flogoInstallables' ],
  outputs : [ 'itemAction: flogoOnItemAction' ],
  templateUrl : 'list-view.tpl.html',
  styleUrls : [ 'list-view.component.css' ]
} )
export class FlogoInstallerListViewComponent implements OnChanges {
  installables : any[];
  _installables : any[];
  itemAction = new EventEmitter();

  constructor() {
    this.init();
  }

  init() {
    console.log( 'Initialise Flogo Installer List View Component.' );
  }


  ngOnChanges( changes : {
    [key : string] : SimpleChange
  } ) {

    if ( _.has( changes, 'installables' ) ) {
      this.onInstallablesChange( changes[ 'installables' ].currentValue );
    }

  }

  onInstallablesChange( newVal ) {
    this._installables = newVal;
  }

  // by pass child events.
  onItemAction( info : any ) {
    console.log( info );
    this.itemAction.emit( info );
  }
}
