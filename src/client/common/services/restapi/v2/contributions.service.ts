import {Injectable} from "@angular/core";
import {Http} from "@angular/http";
import {HttpUtilsService} from "../http-utils.service";

@Injectable()
export class RESTAPIContributionsService {
  pathToService:string ="contributions/devices";
  constructor(private _http: Http, private httpUtils: HttpUtilsService) {}

  getContributionDetails(ref: string){
    return this._http.get(this.httpUtils.apiPrefix(this.pathToService+'?filter[ref]=' + ref)).toPromise()
      .then(response => response.json().data[0]);
  }

  listContribs(type){
    return this._http.get(this.httpUtils.apiPrefix(this.pathToService+'?filter[type]=' + type)).toPromise();
  }
}
