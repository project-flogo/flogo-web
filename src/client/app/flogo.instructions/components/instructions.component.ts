import { Component, EventEmitter, OnChanges, SimpleChange, ViewChild } from '@angular/core';
import { ModalComponent } from 'ng2-bs3-modal/ng2-bs3-modal';

@Component( {
    selector : 'flogo-instructions',
    moduleId : module.id,
    templateUrl : 'instructions.tpl.html',
    inputs : ['isActivated'],
    outputs : ['onClosedModal: flogoOnClosedModal'],
    styleUrls : [ 'instructions.component.css' ]
} )
export class FlogoInstructionsComponent implements OnChanges {

    @ViewChild( 'instructionsModal' ) modal : ModalComponent;
    isActivated : boolean;
    onClosedModal = new EventEmitter();
    steps = [
        {title:'Configure the trigger', description: '', icon: 'instructions-step-1', screenshot:'graphic-1.jpg'} ,
        {title:'Add and configure activities', description: '', icon: 'instructions-step-2', screenshot:'graphic-2.jpg'} ,
        {title:'Run and test at any time', description: '', icon: 'instructions-step-3', screenshot:'graphic-3.svg'} ,
        {title:'Build and run', description: '', icon: 'instructions-step-4', screenshot:'graphic-4.svg'}
    ];
    currentIndex : number;
    currentStep : any;
    STEPS_LENGTH = this.steps.length - 1;

    constructor( ) {
        this.init();
    }

    init() {
        this.currentIndex = 0;
        this.currentStep = this.steps[this.currentIndex] ;
    }

    clickOption(step:any, index:number) {
        this.currentStep = step;
        this.currentIndex = index;
    }

    clickNext(event) {
        if(this.currentIndex < this.STEPS_LENGTH ) {
            this.currentIndex += 1;
        }
        this.currentStep = this.steps[this.currentIndex];
    }

    clickBack(event) {
        if(this.currentIndex > 0 ) {
            this.currentIndex -= 1;
        }
        this.currentStep = this.steps[this.currentIndex];
    }



    ngOnChanges( changes : {
        [key : string] : SimpleChange
    } ) {

        if(_.has(changes, 'isActivated')) {
            if(changes['isActivated'].currentValue == true) {
                this.openModal();
            }
        }
    }

    openModal() {
        this.init();
        this.modal.open('lg');
    }

    closeModal() {
        this.modal.close();
        this.onClosedModal.emit(true);
    }

    onModalCloseOrDismiss(event) {
        this.onClosedModal.emit(true);
    }

    onInstallAction( url : string ) {
    }
}
