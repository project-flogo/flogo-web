import {FlogoProfileService} from "./profile.service";
import {FLOGO_PROFILE_TYPE} from "../constants";

describe("Service: FlogoProfileService", function(this: {
  testService: FlogoProfileService
}){
  let mockDeviceAppData = {
    "type": "flogo:device",
    "triggers": [
      {
        "ref": "github.com/TIBCOSoftware/flogo-contrib/trigger/rest",
        "settings": {"port": null},
        "handlers": [
          {
            "settings": {
              "method": null,
              "path": null,
              "autoIdReply": null,
              "useReplyHandler": null
            },
            "outputs": {
              "params": null,
              "pathParams": null,
              "queryParams": null,
              "content": null
            },
            "actionId": "someID",
          }
        ]
      }
    ],
    "actions": [
      {
        "data": {
          "flow": {
            "type": 1,
            "attributes": [],
            "rootTask": {}
          }
        }
      }
    ],
    "device": {
      "deviceType": "Intel ARC32",
      "profile": "github.com/TIBCOSoftware/flogo-contrib/device/profile/feather_m0_wifi"
    }
  };

  let mockMicroServiceAppData = {
    "type": "flogo:app",
    "triggers": [
      {
        "ref": "github.com/TIBCOSoftware/flogo-contrib/trigger/rest",
        "settings": {"port": null},
        "handlers": [
          {
            "settings": {
              "method": null,
              "path": null,
              "autoIdReply": null,
              "useReplyHandler": null
            },
            "outputs": {
              "params": null,
              "pathParams": null,
              "queryParams": null,
              "content": null
            },
            "actionId": "someID",
          }
        ]
      }
    ],
    "actions": [
      {
        "data": {
          "flow": {
            "type": 1,
            "attributes": [],
            "rootTask": {}
          }
        }
      }
    ]
  };

  beforeAll(() => {
    this.testService = new FlogoProfileService();
  });

  it("Should return MICRO_SERVICE enum for Microservice type of profile", () => {
    let profileType = this.testService.getProfileType(mockMicroServiceAppData);
    expect(profileType).toEqual(FLOGO_PROFILE_TYPE.MICRO_SERVICE);
  });

  it("Should return DEVICE enum for Device type of profile", () => {
    let profileType = this.testService.getProfileType(mockDeviceAppData);
    expect(profileType).toEqual(FLOGO_PROFILE_TYPE.DEVICE);
  });
});
