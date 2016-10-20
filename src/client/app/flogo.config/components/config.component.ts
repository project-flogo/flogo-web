import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Http, Headers, RequestOptions } from '@angular/http';
import { ConfigurationService } from '../../../common/services/configuration.service';

const MAIN_DB = 'db';
const DBS_ARR = [ 'activities', 'triggers', MAIN_DB ];
const SERVERS_ARR = [ 'engine', 'stateServer', 'flowServer' ];

@Component( {
  selector : 'flogo-config',
  moduleId : module.id,
  templateUrl : 'config.tpl.html',
  styleUrls : [ 'config.component.css' ]
} )
export class FlogoConfigComponent {
  _config : any;
  _servers : any[];
  _dbs : any[];
  _appDB : any;
  location = location; // expose window.location

  constructor( private _router : Router, private http:Http,  private _configurationService: ConfigurationService  ) {
    this.init();
  }

  init() {
        this._config = this._configurationService.configuration;
        this._appDB = _.cloneDeep( this._config[MAIN_DB] );

        this._dbs = _.reduce( this._config, ( result : any[], value : any, key : string ) => {
          if ( DBS_ARR.indexOf( key ) !== -1 ) {
            if(!value.testPath) {
              value.testPath = value.name;
            }

            value.name = value.testPath;
            result.push( {
              _label : _.startCase( key ),
              _key : key,
              config : value
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
            value.name = key;
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

    _.each( this._servers, ( server : any )=> {
      if ( SERVERS_ARR.indexOf( server._key ) !== -1 ) {
        config[ server._key ] = _.cloneDeep( server.config );
      }
    } );

    _.each( this._dbs, ( db : any )=> {
      if ( DBS_ARR.indexOf( db._key ) !== -1 ) {
        config[ db._key ] =  _.cloneDeep( db.config ) ;
      }
    } );


    console.groupCollapsed( 'Save configuration' );
    console.log( _.cloneDeep( config ) );
    console.groupEnd();

    this._configurationService.save();

  }

  onCancel() {
    this._router.navigate( [ '/' ] );
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

    this._configurationService.resetConfiguration()
        .then((config) => {
          this.init();
          console.log('Configuration restored')
        });

  }

  getDatabaseName(db) {
    db = db || "";
    return db.replace("Database","");
  }
}
