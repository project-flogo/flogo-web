import {Directive, ElementRef, Input} from '@angular/core';

@Directive({
  selector: '[jsonDownloader]',
  host: {
    '(click)': 'onClick()',
  }
})
export class JsonDownloader {
  private _el: HTMLElement;
  private _link: HTMLAnchorElement;

  @Input('jsonDownloader')
  generateObject: () => Promise<{fileName: string, data: any}[]|{fileName: string, data: any}> = () => null;

  constructor(private el: ElementRef) {
    this._el = el.nativeElement;
  }

  ngOnInit() {
  }

  onClick() {
    this.generateObject()
      .then(result => {
          let outputs = [];

          if(result) {
              outputs = <{fileName: string, data: any}[]> ( (result.constructor == Array) ? result : [result] );

              this._link = document.createElement('a');
              this._link.setAttribute('download', 'flow.json');
              this._link.style.display = 'none';
              document.body.appendChild(this._link);
          }

          outputs.forEach((output)=> {
              let jsonString = JSON.stringify(output.data);
              let dataString = `data:text/json;charset=utf-8,${encodeURIComponent(jsonString)}`;

              this._link.setAttribute('href', dataString);
              this._link.setAttribute('download', output.fileName || 'flow.json');
              //if download attribute is not supported
              if (!('download' in this._link)) {
                  this._link.setAttribute('target', '_blank');
              }
              this._link.click();
          });

          if(result) {
              document.body.removeChild(this._link);
          }

      });
  }

}
