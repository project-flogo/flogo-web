import { Component } from 'angular2/core';
import { getFlogoGlobalConfig, updateFlogoGlobalConfig, resetFlogoGlobalConfig } from '../../../common/utils';
import { Router } from 'angular2/router';
import { ServiceStatusIndicatorComponent } from './service-status-indicator.component';
import { Http, Headers, RequestOptions } from 'angular2/http';

const DBS_ARR = [ 'activities', 'triggers', 'models' ];
const SERVERS_ARR = [ 'engine', 'stateServer', 'flowServer' ];

@Component( {
  selector : 'flogo-_config',
  moduleId : module.id,
  directives: [ServiceStatusIndicatorComponent],
  templateUrl : '_config.tpl.html',
  styleUrls : [ '_config.component.css' ]
} )

export class Flogo_ConfigComponent {
  private _config : any;
  private _servers : any[];
  private _dbs : any[];
  private _appDB : any;
  private location = location; // expose window.location

  constructor( private _router : Router, private http:Http ) {
    this.init();
  }

  init() {
    this._config = getFlogoGlobalConfig();

    this._appDB = _.cloneDeep( this._config.db );

    this._dbs = _.reduce( this._config, ( result : any[], value : any, key : string ) => {
      if ( DBS_ARR.indexOf( key ) !== -1 ) {
        result.push( {
          _label : _.startCase( key ),
          _key : key,
          config : value.db
        } );
      }

      return result;
    }, [] );

    this._servers = _.reduce( this._config, ( result : any[], value : any, key : string ) => {
      if ( SERVERS_ARR.indexOf( key ) !== -1 ) {
        let _display = false;

        // for now we just has the restart feature for 8080(default engine)
        if(value&&value.port == '8080'){
          _display = true
        }
        result.push( {
          _label : _.startCase( key ),
          _key : key,
          _display: _display,
          config : value
        } );
      }

      return result;
    }, [] );
  }

  onSave() {
    let config = <any>{};

    config.db = _.cloneDeep( this._appDB );

    _.each( this._servers, ( server : any )=> {
      if ( SERVERS_ARR.indexOf( server._key ) !== -1 ) {
        config[ server._key ] = _.cloneDeep( server.config );
      }
    } );

    _.each( this._dbs, ( db : any )=> {
      if ( DBS_ARR.indexOf( db._key ) !== -1 ) {
        config[ db._key ] = { db : _.cloneDeep( db.config ) };
      }
    } );

    console.groupCollapsed( 'Save configuration' );
    console.log( _.cloneDeep( config ) );
    console.groupEnd();

    updateFlogoGlobalConfig( config );
  }

  onCancel() {
    this._router.navigate( [ 'FlogoHome' ] );
  }

  onRestart(server:any){
    console.log(server);
    let port = server&&server.config&&server.config.port||undefined;
    if(port == '8080'){
      let headers = new Headers(
        {
          'Accept' : 'application/json'
        }
      );

      let options = new RequestOptions( { headers : headers } );

      this.http.get( `/v1/api/engine/restart`, options )
        .toPromise()
        .then((res)=>{
          console.log("Restart test engine successful. res: ", res);
        }).catch((err)=>{
          console.log("Restart test engine errror. err: ", err);
        });

    }
  }

  onRestartBuild(){
    let headers = new Headers(
      {
        'Accept' : 'application/json'
      }
    );

    let options = new RequestOptions( { headers : headers } );

    this.http.get( `/v1/api/engine/restart?name=build`, options )
      .toPromise()
      .then((res)=>{
        console.log("Restart build engine successful. res: ", res);
      }).catch((err)=>{
        console.log("Restart build engine errror. err: ", err);
      });
  }

  onResetDefault () {
    resetFlogoGlobalConfig();
    this.init();
  }
}
