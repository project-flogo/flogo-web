import {Directive, ElementRef, Input, Output, EventEmitter, OnChanges, SimpleChange} from '@angular/core';
import {RESTAPIFlowsService} from '../services/restapi/flows-api.service';

@Directive({
    selector: '[myContenteditable]',
    host: {
        '(mouseenter)': 'onMouseEnter()',
        '(mouseleave)': 'onMouseLeave()',
        '(focus)': 'onFocus()',
        '(blur)': 'onBlur()'
    },
    providers: [RESTAPIFlowsService]
})
export class Contenteditable {
    private _el: HTMLElement;
    private $el: any;
    private colorFlag: boolean;

    @Input()
        myContenteditable: string;
    @Input()
        placeholder: string;

    @Output()
        myContenteditableChange = new EventEmitter();

    constructor(private el: ElementRef, private _flow: RESTAPIFlowsService) {
        this._el = el.nativeElement;
        this.$el = window.jQuery(this._el);
    }
    ngOnInit() {
        if(this.myContenteditable != undefined) this.$el.html(this.myContenteditable);
        this.$el.attr('contenteditable', 'true');
        this.$el.css({'paddingRight': '38px', 'marginLeft': '-10px', 'paddingLeft': '10px', 'borderRadius': '4px', 'outline': 'none','lineHeight': parseInt(this.$el.css('lineHeight')) - 2 + 'px', 'border': '1px solid transparent'});
        this._initPlaceholder();
        let origColor = this.$el.css('color');
        if(origColor == 'rgb(255, 255, 255)') {
            this.colorFlag = true;
        }
    }
    onMouseEnter() {
        if(document.activeElement != this._el) {
            this.$el.css({'background': '#fff url("/assets/svg/flogo.flows.detail.edit.icon.svg") center right no-repeat'});
            if(this.colorFlag) {
                this.$el.css('color', '#666');
            }
        }
    }
    onMouseLeave() {
        if(document.activeElement != this._el) {
            this.$el.css({'background': '', 'border': '1px solid transparent'});
            if(this.colorFlag)  this.$el.css('color', 'rgb(255, 255, 255)');
        } else {
            // omit
        }
    }
    onFocus() {
        this.$el.css({'background': '#fff', 'border': '1px solid #0082d5'});
        if(this.colorFlag)  this.$el.css('color', 'rgb(102, 102, 102)');
        if(this.$el.find('span')) {
            this.$el.find('span').eq(0).remove();
        }
    }
    onBlur() {
        if(this.placeholder || this.$el.text() !== '') {
            this.$el.css({'background': '', 'border': '1px solid transparent'});
            if(this.colorFlag)  this.$el.css('color', 'rgb(255, 255, 255)');
            if(this.$el.text() === '' && this.myContenteditable === undefined) {
                // omit
            } else if(this.$el.text() !== this.myContenteditable) {
                this.myContenteditableChange.emit(this.$el.text());
            }
            this._initPlaceholder();
        } else {
            this.$el.focus();
            let cur = 0,
                sumFlash = 5,
                warmEle = this.$el,
                timer;
            timer = setInterval(() => {
                if(cur <= sumFlash) {
                    if(cur % 2) {
                        warmEle.css('border', '#0082d5 solid 1px');
                    } else {
                        warmEle.css('border', '#ff9948 solid 1px');
                    }
                    cur++;
                } else {
                    clearInterval(timer);
                }
            }, 100)
        }

    }
    private _initPlaceholder() {
        if(this.$el.text() == '') {
            this.$el.append(`<span>${this.placeholder}</span>`)
        } else {
            if(this.$el.find('span')) {
                this.$el.find('span').eq(0).remove();
            }
        }
    }
}
