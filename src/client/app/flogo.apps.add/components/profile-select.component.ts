import {Component, AfterViewInit, Output, ViewChild} from "@angular/core";
import {ModalComponent} from "ng2-bs3-modal/ng2-bs3-modal";
import {EventEmitter} from "@angular/common/src/facade/async";
import {ProfilesAPIService} from "../../../common/services/restapi/v2/profiles-api.service";
import {FLOGO_PROFILE_TYPE} from "../../../common/constants";

interface DeviceProfile {
  type: string;
  id: string;
}

@Component({
  selector: 'flogo-apps-profile-selection',
  templateUrl: 'profile-selection.tpl.html',
  styleUrls: ['profile-selection.less']
})
export class ProfileSelectionComponent  implements AfterViewInit {
  @ViewChild('profileSelectionModal') profileSelectionModal: ModalComponent;

  @Output() onClose: EventEmitter<any> = new EventEmitter();
  @Output() onAdd: EventEmitter<any> = new EventEmitter();

  showList: boolean = false;
  devicesList: DeviceProfile[];
  FLOGO_PROFILE_TYPE: typeof FLOGO_PROFILE_TYPE = FLOGO_PROFILE_TYPE;

  constructor(private profilesService: ProfilesAPIService) {}

  ngAfterViewInit() {
    this.openModal();
  }

  openModal() {
    this.profileSelectionModal.open();
  }

  closeModal() {
    this.profileSelectionModal.close();
    this.onModalCloseOrDismiss();
  }

  onModalCloseOrDismiss() {
    this.onClose.emit();
  }

  showDevicesList() {
    this.profilesService.getProfilesList().then((response) => {
      this.showList = true;
      this.devicesList = response;
    });
  }

  onAddProfile(profileType: FLOGO_PROFILE_TYPE, profile?: string) {
    let profileDetails:any = {profileType};
    if(profileType === FLOGO_PROFILE_TYPE.DEVICE){
      profileDetails.profile ="github.com/TIBCOSoftware/flogo-contrib/device/profile/feather_m0_wifi";
      profileDetails.deviceType = profile;
    }
    this.onAdd.emit(profileDetails);
  }
}
