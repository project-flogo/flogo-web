import { Component, OnChanges, SimpleChange, EventEmitter } from '@angular/core';

@Component( {
  selector : 'flogo-installer-list-view-item',
  moduleId : module.id,
  inputs : [ 'item: flogoItem' ],
  outputs : [ 'onItemAction: flogoOnItemAction' ],
  templateUrl : 'item.tpl.html',
  styleUrls : [ 'item.component.css' ]
} )
export class FlogoInstallerListViewItemComponent implements OnChanges {

  item : any;
  _item : any;
  onItemAction = new EventEmitter();

  constructor() {
    this.init();
  }

  init() {
    console.log( 'Initialise Flogo Installer List View Item Component.' );
  }

  ngOnChanges( changes : {
    [key : string] : SimpleChange
  } ) {

    if ( _.has( changes, 'item' ) ) {
      this.onInstallablesChange( changes[ 'item' ].currentValue );
    }

  }

  onInstallablesChange( newVal ) {
    this._item = itemToViewItem( newVal );
  }

  onInstall() {
    console.log( 'On Install.' );
    this.onItemAction.emit( {
      action : 'install',
      item : this.item
    } );
  }

  onUninstall() {
    console.log( 'On Uninstall.' );
    this.onItemAction.emit( {
      action : 'uninstall',
      item : this.item
    } );
  }
}

/* utility functions */

function itemToViewItem( item : any ) {

  let viewItem = {
    displayName : item.title || item.name,
    description : item.description,
    version : item.version,
    icon : '',
    author : `${item.author}`,
    createTime : moment( item.createTime )
      .fromNow(),
    isInstalled : item.isInstalled
  }

  return viewItem;
}
