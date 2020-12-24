export const INSTALL_CONTRIBUTION = formEndPoint('/contributions/microservices');
export const IMPORT_APP = formEndPoint('/apps:import');
export const EXPORT_APP = formEndPoint('/apps/*:export');
export const EXPORT_ACTIONS = formEndPoint('/apps/*:export?type=flows');
export const GET_INSTALLED_ACTIVITIES = formEndPoint(
  '/contributions/microservices?filter[type]=activity'
);
export const RUN_STREAM = formEndPoint('/upload/simulationData');
export const SHIM_BUILD_API = formEndPoint('/triggers/*:shim?os=*&arch=*');

export function formEndPoint(api) {
  const HOSTNAME = 'http://localhost:3303';
  const BASE_PATH = '/api/v2';
  return `${HOSTNAME}${BASE_PATH}${api}`;
}
