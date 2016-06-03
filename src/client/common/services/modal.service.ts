import {Injectable} from '@angular/core';

@Injectable()
export class FlogoModal {
    constructor() {
    }
  confirmDelete(message, styles?: {
    [key : string] : string;
    }) {
      var options = {primary: 'DELETE', secondary:'CANCEL'};
      return this.confirm('Confirm deletion', message, options);
    }
    confirm(title, message, options, styles?: {
        [key : string] : string;
    }) {
      var buttons = _.assign({}, {primary:'YES', secondary:'NO'}, options);
        let style = '';
        for(let attr in styles) {
            style += `${attr}: ${styles[attr]};`
        }
        window.jQuery('flogo-app').append(`
            <div class="flogo-common-service-modal-container fade">
                <div class="flogo-common-service-modal-detail fade clearfix" style="${style}">
                    <div class="flogo-common-service-modal-confirm">${title}</div>
                    <div class="flogo-common-service-modal-message">${message}</div>
                    <button class="flogo-common-service-modal-button flogo-common-service-modal-button-primary">${buttons.primary}</button>
                    <button class="flogo-common-service-modal-button flogo-common-service-modal-button-secondary">${buttons.secondary}</button>
                </div>
            </div>
        `);
        let modalContainer = window.jQuery('.flogo-common-service-modal-container');
        let modalDetail = window.jQuery('.flogo-common-service-modal-container .flogo-common-service-modal-detail');
        return new Promise((resolve, reject) => {
            setTimeout(function() {
                modalContainer.addClass('in');
                modalDetail.addClass('in');
            }, 100);

            modalDetail.find('button').click(function() {
                if(window.jQuery(this).text() == buttons.primary) {
                    resolve(true);
                } else {
                    resolve(false);
                }
                modalContainer.removeClass('in');
                modalDetail.removeClass('in');
                setTimeout(function() {
                    modalContainer.remove();
                }, 500);
            });
        });
    }
}
