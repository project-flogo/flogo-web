import { GET_INSTALLED_ACTIVITIES } from './request-endpoints';

export const getInstalledActivities = () => cy.request(GET_INSTALLED_ACTIVITIES);
