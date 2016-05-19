import { Injectable, NgZone } from '@angular/core';
import { activitySchemaToTask, getDBURL } from '../utils';
import { activitySchemaToTrigger } from '../utils';

@Injectable()
export class FlogoDBService{

  // PouchDB instance
  private _db:PouchDB;
  private _activitiesDB: PouchDB;
  private _triggersDB: PouchDB;
  private _sync:Object;
  private _syncActivities: Object;
  public PREFIX_AUTO_GENERATE:string = 'auto-generate-id';
  public FLOW:string = 'flows';
  public DIAGRAM:string = 'diagram';
  public DELIMITER:string = ":";
  public DEFAULT_USER_ID = 'flogoweb-admin';

  constructor(private _ngZone: NgZone){
    // When create this service, initial pouchdb
    this._initDB();

    this._ngZone.onError.subscribe(
      ( err : any )=> {
        if ( _.isFunction( err && err.error && err.error.promise && err.error.promise.catch ) ) {
          err.error.promise.catch(
            ( err : any )=> {
              console.info( err );
            }
          );
        }
      }
    );
  }

  /**
   * initial a pouchdb
   */
  private _initDB(): FlogoDBService{
    let appDBConfig = (<any>window).FLOGO_GLOBAL.db;
    let activitiesDBConfig = (<any>window).FLOGO_GLOBAL.activities.db;
    let triggersDBConfig = (<any>window).FLOGO_GLOBAL.triggers.db;

    // this._activitiesDB = new PouchDB(`${activitiesDBConfig.name}-local`);
    this._activitiesDB = new PouchDB( getDBURL( activitiesDBConfig ) );
    this._activitiesDB.info().then(function(db){
      console.log('[DB] Activities: ', db);
    }).catch(function(err:Object){
      console.error(err);
    });

    // this._triggersDB = new PouchDB(`${triggersDBConfig.name}-local`);
    this._triggersDB = new PouchDB( getDBURL( triggersDBConfig ) );
    this._triggersDB.info().then(function(db){
      console.log('[DB] Triggers: ', db);
    }).catch(function(err:Object){
      console.error(err);
    });

    // this._db = new PouchDB(`${appDBConfig.name}-local`);
    this._db = new PouchDB( getDBURL( appDBConfig ) );
    // create db in browser
    this._db.info().then(function(db){
      console.log('[DB] Application: ', db);
    }).catch(function(err:Object){
      console.error(err);
    });

    // Comment out and connect to remote db directly
    // this._syncActivities = PouchDB.sync( `${activitiesDBConfig.name}-local`,
    //   activitiesDBConfig.port ?
    //   `${activitiesDBConfig.protocol}://${activitiesDBConfig.host}:${activitiesDBConfig.port}/${activitiesDBConfig.name}` :
    //   `${activitiesDBConfig.protocol}://${activitiesDBConfig.host}}/${activitiesDBConfig.name}`,
    //   {
    //     live : false,
    //     retry : true
    //   } );

    // Comment out and connect to remote db directly
    // this._sync = PouchDB.sync( `${appDBConfig.name}-local`,
    //   appDBConfig.port ?
    //   `${appDBConfig.protocol}://${appDBConfig.host}:${appDBConfig.port}/${appDBConfig.name}` :
    //   `${appDBConfig.protocol}://${appDBConfig.host}}/${appDBConfig.name}`,
    //   {
    //     live : false,
    //     retry : true
    //   } )
    //   .on('change', function (info) {
    //   // handle change
    //   console.group("[DB Sync] Change");
    //   console.log("info: ", info);
    //   console.groupEnd();
    // }).on('paused', function () {
    //   // replication paused (e.g. user went offline)
    //   console.group("[DB Sync] Paused");
    //   console.groupEnd();
    // }).on('active', function () {
    //   // replicate resumed (e.g. user went back online)
    //   console.group("[DB Sync] Active");
    //   console.groupEnd();
    // }).on('denied', function (info) {
    //   // a document failed to replicate (e.g. due to permissions)
    //   console.group("[DB Sync] Denied");
    //   console.log("info: ", info);
    //   console.groupEnd();
    // }).on('complete', function (info) {
    //   // handle complete
    //   console.group("[DB Sync] Complete");
    //   console.log("info: ", info);
    //   console.groupEnd();
    // }).on('error', function (err) {
    //   // handle error
    //   console.group("[DB Sync] Error");
    //   console.log("err: ", err);
    //   console.groupEnd();
    // });

    return this;
  }

  /**
   * generate a unique id
   */
  generateID(userID: string): string{
    // if userID isn't passed, then use default 'flogoweb'
    if(!userID){
      // TODO for now, is optional. When we implement user login, then this is required
      userID = this.DEFAULT_USER_ID;
    }
    let timestamp = new Date().toISOString();
    let random = Math.random();
    let id = `${this.PREFIX_AUTO_GENERATE}${this.DELIMITER}${userID}${this.DELIMITER}${timestamp}${this.DELIMITER}${random}`;

    return id;
  }

  /**
   * generate an id of flow
   * @param {string} [userID] - the id of currently user.
   */
  generateFlowID(userID: string): string{
    // if userID isn't passed, then use default 'flogoweb'
    if(!userID){
      // TODO for now, is optional. When we implement user login, then this is required
      userID = this.DEFAULT_USER_ID;
    }

    let timestamp = new Date().toISOString();
    let id = `${this.FLOW}${this.DELIMITER}${userID}${this.DELIMITER}${timestamp}`;

    console.log("[info]flowID: ", id);
    return id;
  }

  /**
   * create a doc to db
   * @param {Object} doc
   */
  create(doc: Object): Object{
    return new Promise((resolve, reject)=>{
      if(!doc) reject("Please pass doc");

      if(!doc.$table){
        console.error("[Error]doc.$table is required. You must pass. ", doc);
        reject("[Error]doc.$table is required.");
      }

      // if this doc don't have id, generate an id for it
      if(!doc._id){
        doc._id = this.generateID();
        console.log("[warning]We generate an id for you, but suggest you give a meaningful id to this document.");
      }

      if(!doc['created_at']){
        doc['created_at'] = new Date().toISOString();
      }
      this._db.put(doc).then((response)=>{
        console.log("response: ", response);
        resolve(response);
      }).catch((err)=>{
        console.error(err);
        reject(err);
      });
    });
  }

  /**
   * update a doc
   * @param {Object} doc
   */
  update(doc: Object): Object{
    return new Promise((resolve, reject)=>{
      if(!doc) reject("Please pass doc");

      // if this doc don't have id, generate an id for it
      if(!doc._id){
        console.error("[Error] Your doc don't have a valid _id");
        reject("[Error] Your doc don't have a valid _id");
      }

      if(!doc._rev){
        console.error("[Error] Your doc don't have valid _rev");
        reject("[Error] Your doc don't have valid _rev");
      }

      if(!doc.$table){
        console.error("[Error]doc.$table is required. You must pass. ", doc);
        reject("[Error]doc.$table is required.");
      }

      if(!doc['updated_at']){
        doc['updated_at'] = new Date().toISOString();
      }
      this._db.get(doc._id).then(
        ( dbDoc : any )=> {

          doc = _.cloneDeep( doc );
          delete doc[ '_rev' ];
          _.assign( dbDoc, doc );

          return this._db.put( dbDoc ).then((response)=>{
            console.log("response: ", response);
            resolve(response);
          }).catch((err)=>{
            console.error(err);
            reject(err);
          });
      });
    });
  }

  allDocs(options:Object){
    return new Promise((resolve, reject)=>{
      this._db.allDocs(options).then((response)=>{
        console.log("[allDocs]response: ", response);
        resolve(response);
      }).catch((err)=>{
        console.error(err);
        reject(err);
      });
    });
  }
  /**
   * remove doc. You can pass doc object or doc._id and doc._rev
   */
  remove(){
    let parameters = arguments;
    return new Promise((resolve, reject)=>{
      let doc, docId, docRev;
      // user pass doc
      if(parameters.length==1){
        doc = parameters[0];
        if(typeof doc != "object"){
          console.error("[error]Please pass correct doc object");
          reject("[error]Please pass correct doc object");
        }
        this._db.remove(doc).then((response)=>{
          resolve(response);
        }).catch((err)=>{
          reject(err);
        })
      }else if(parameters.length>1){ // remove by _id and _rev
        docId = parameters[0];
        docRev = parameters[1];

        if(!docId||!docRev){
          console.error("[error]Please pass correct doc._id and doc._rev");
          reject("[error]Please pass correct doc._id and doc._rev");
        }

        this._db.remove(docId, docRev).then((response)=>{
          resolve(response);
        }).catch((err)=>{
          reject(err);
        })
      }
    });
  }

  getFlow( id : string ) {
    return this._db.get( id );
  }

  // force to retrieve all of the activities without number limitation
  getAllActivities() {
    return this.getActivities(false);
  }

  // retrieve all of the activities with limit up to 200
  getActivities( limit = 200 ) {
    // TODO
    //  currently due to DB sync issue, force to sync the local DB with remote each time querying all activities
    let activitiesDBConfig = (<any>window).FLOGO_GLOBAL.activities.db;
    return PouchDB.sync(
      `${activitiesDBConfig.name}-local`,
      getDBURL(activitiesDBConfig),
      {
        live : false,
        retry : true
      }
      )
      .then(
        ()=> {
          // the real logic to get all activities
          return this._activitiesDB.allDocs(
            {
              include_docs : true,
              limit : limit
            }
            )
            .then(
              ( docs : any ) => {
                // get doc information from non-empty records
                return _.map(
                  _.filter( docs.rows, ( doc : any ) => !_.isEmpty( _.get( doc, 'doc.schema', '' ) ) ),
                  ( doc : any )=> {
                    return activitySchemaToTask( doc.doc.schema );
                  }
                );
              }
            );
        }
      )
      .catch(
        ( err : any )=> {
          console.log( err );
          return err;
        }
      );
  }

  // TODO
  getInstallableActivities() {
    return Promise.resolve( [] );
  }

  // retrieve all of the triggers without number limitation
  getAllTriggers() {
    return this.getTriggers();
  }

// retrieve all of the activities with limit up to 200
  getTriggers( limit = 200 ) {
    // TODO
    //  currently due to DB sync issue, force to sync the local DB with remote each time querying all activities
    let triggersDBConfig = (<any>window).FLOGO_GLOBAL.triggers.db;
    return PouchDB.sync(
      `${triggersDBConfig.name}-local`,
      getDBURL(triggersDBConfig),
      {
        live : false,
        retry : true
      }
      )
      .then(
        ()=> {
          // the real logic to get all activities
          return this._triggersDB.allDocs(
            {
              include_docs : true,
              limit : limit
            }
            )
            .then(
              ( docs : any ) => {
                // get doc information from non-empty records
                return _.map(
                  _.filter( docs.rows, ( doc : any ) => !_.isEmpty( _.get( doc, 'doc.schema', '' ) ) ),
                  ( doc : any )=> {
                    return activitySchemaToTrigger( doc.doc.schema );
                  }
                );
              }
            );
        }
      )
      .catch(
        ( err : any )=> {
          console.log( err );
          return err;
        }
      );
  }





}
