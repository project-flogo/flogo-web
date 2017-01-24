import fs from 'fs';

import {fileExists} from './utils/file';

import _ from 'lodash';
import Pouchdb from 'pouchdb';
import pouchDbLoad from 'pouchdb-load';
Pouchdb.plugin(pouchDbLoad);

const PREFIX_AUTO_GENERATE = 'auto-generate-id';
const FLOW = 'flows';
const DIAGRAM = 'diagram';
const DELIMITER = ":";
const DEFAULT_USER_ID = 'flogoweb-admin';

export class DBService {

  constructor(name, options){
    console.log("DBService initial, name: ", name);
    this.name = name;
    this.options = options;
    this._sync = null;
  }

  init() {
    return this._initDB(this.name, this.options).then(() => this.db);
  }

  getIdentifier(identifier){
    identifier&&(identifier=identifier.toUpperCase());
    if(identifier == 'PREFIX_AUTO_GENERATE'){
      return PREFIX_AUTO_GENERATE;
    }else if(identifier == 'FLOW'){
      return FLOW;
    }else if(identifier == 'DIAGRAM'){
      return DIAGRAM;
    }else if(identifier == 'DELIMITER'){
      return DELIMITER;
    }else if(identifier == 'DEFAULT_USER_ID'){
      return DEFAULT_USER_ID;
    }else{
      return undefined;
    }
  }

  /**
   * generate a unique id
   */
  generateID(userID){
    // if userID isn't passed, then use default 'flogoweb'
    if(!userID){
      // TODO for now, is optional. When we implement user login, then this is required
      userID = DEFAULT_USER_ID;
    }
    let timestamp = new Date().toISOString();
    let random = Math.random();
    let id = `${PREFIX_AUTO_GENERATE}${DELIMITER}${userID}${DELIMITER}${timestamp}${DELIMITER}${random}`;

    return id;
  }

  /**
   * generate an id of flow
   * @param {string} [userID] - the id of currently user.
   */
  generateFlowID(userID){
    // if userID isn't passed, then use default 'flogoweb'
    if(!userID){
      // TODO for now, is optional. When we implement user login, then this is required
      userID = DEFAULT_USER_ID;
    }

    let timestamp = new Date().toISOString();
    let id = `${FLOW}${DELIMITER}${userID}${DELIMITER}${timestamp}`;

    console.log("[info]flowID: ", id);
    return id;
  }

  /**
   * create a doc to db
   * @param {Object} doc
   */
  createFlow(doc){
    return new Promise((resolve, reject)=>{
      if(!doc) reject("Please pass doc");

      // TODO: i see no reason for this? perhaps we wanted to have only one database at the beggining? need to investigate further, commenting out for now
      // if(!doc.$table){
      //   console.error("[Error]doc.$table is required. You must pass. ", doc);
      //   reject("[Error]doc.$table is required.");
      // }

      this.failWhenNameExists(doc.name, doc.appId)
        .then(()=> {
          // if this doc don't have id, generate an id for it
          if(!doc._id){
            doc._id = this.generateID();
            console.log("[warning]We generate an id for you, but suggest you give a meaningful id to this document.");
          }

          doc['created_at'] = new Date().toISOString();
          doc['updated_at'] = new Date().toISOString();

          this._db.put(doc).then((response)=>{
            resolve(response);
          }).catch((err)=>{
            console.error(err);
            reject(err);
          });
        })
        .catch((err)=> {
          let response = _.assign({},{status:500}, err);
          if(err.details.ERROR_CODE == 'NAME_EXISTS') {
            response.message = "Flow's name exists, please choose another name";
          }
          reject(response);
        })


    });
  }

  /**
   * Get a document searching by name
   */
  failWhenNameExists(name, appId) {
    let searchName = (name || '').toLowerCase().trim();
    return new Promise((resolve, reject) => {
      this._db
        .query(function(doc, emit) { emit((doc.name || '').toLowerCase().trim()); }, { key: searchName, include_docs: true })
        .then((response) => {
          let rows = response && response.rows ? response.rows : [];
          if (appId) {
            rows = rows.filter(row => row && row.doc && row.doc.appId === appId);
          }
          let doc = rows.length > 0 ? rows[0].doc : null;
          if(doc == null) {
            resolve({status:200, message:"Document doesn't exists"});
          } else {
            reject({status:400, details: {message:"Fail - Another document exists with the same name",
                    ERROR_CODE:"NAME_EXISTS"}});
          }
        }).catch(function (err) {
        reject({status:500, message: err.message});
      });
    });
  }

  /**
   * update a doc
   * @param {Object} doc
   */
  update(doc){
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

      doc.updated_at = new Date().toISOString();

      this._db.get(doc._id).then(
        ( dbDoc )=> {

          doc = _.cloneDeep( doc );
          delete doc[ '_rev' ];
          _.assign( dbDoc, doc );

          return this._db.put( dbDoc ).then((response)=>{
            resolve(response);
          }).catch((err)=>{
            console.error(err);
            reject(err);
          });
      });
    });
  }

  allDocs(options){
    let defaultOptions = {
      include_docs: true
    };
    return new Promise((resolve, reject)=>{
      let ops = _.merge({}, defaultOptions, options||{});
      this._db.allDocs(ops).then((response)=>{
        let res = [];
        if(ops.include_docs){
          let rows = response&&response.rows||[];
          rows.forEach((item)=>{
            res.push(item&&item.doc);
          });
        }else{
          res = response;
        }
        resolve(res);
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

  /**
   * @param dumpPath path to dump file
   */
  verifyInitialDataLoad(dumpPath) {

    if(!fileExists(dumpPath)) {
      console.warn(`[warn] Did not try to load dump to db, path "${dumpPath}" does not exist`);
      return Promise.resolve(false);
    }

    let db = this._db;
    return db.get('_local/initial_load_complete')
      .catch(function (err) {
        if (err.status !== 404) { // 404 means not found
          throw err;
        }
        console.log(`Will load from ${dumpPath}`);
        return loadFile(dumpPath)
          .then(content => db.load(content))
          .then(() => db.put({_id: '_local/initial_load_complete'}));
      }).then(function () {
        console.info('Initial db data load completed');
    }).catch(function (err) {
      console.info('Could not load db initial data');
      console.error(err);
      console.error(err.stack);
    });

    function loadFile(path) {
      return new Promise((resolve, reject) => {
        fs.readFile(path, {'encoding': 'utf8'}, (err, data)=> {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
      })
    }

  }

  get db(){
    return this._db;
  }

  _initDB(name, options){
    let db = new Pouchdb(name);
    // PouchDB will be initialled when you call it. So this code is to make sure db is created
    return db
      .info()
      .then((response)=>{
        this._db = db;
        console.log("[_initDB][response]", response);
        return db;
      })
      .catch((error)=>{
        console.log("[_initDB][error]", error);
      });
  }


  areSamplesInstalled() {
    return this._db.get('_local/installed_samples');
  }

  markSamplesAsInstalled() {
    this._db.put({_id: '_local/installed_samples'});
  }

}
