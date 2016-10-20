import { Component, EventEmitter, SimpleChange, OnChanges } from '@angular/core';

@Component( {
  selector : 'flogo-installer-category-selector',
  moduleId : module.id,
  inputs : [ 'categories: flogoCategories' ],
  outputs : [ 'categorySelected: flogoOnCategorySelected' ],
  templateUrl : 'category-selector.tpl.html',
  styleUrls : [ 'category-selector.component.css' ]
} )
export class FlogoInstallerCategorySelectorComponent implements OnChanges {

  categories: any[];
  categorySelected = new EventEmitter();

  constructor() {
    this.init();
  }

  init() {
    console.log( 'Initialise Flogo Installer Category Selector Component.' );
  }

  ngOnChanges( changes : {
    [key : string] : SimpleChange
  } ) {

    if ( _.has( changes, 'categories' ) ) {
      this.onCategoriesChange( changes[ 'categories' ].currentValue );
    }

  }

  onCategoriesChange( newValue ) {
    console.log( 'onCategoriesChange' );
    console.log( newValue );
  }

  onCategorySelected( categoryName : string ) {
    this.categorySelected.emit( categoryName );
  }
}
