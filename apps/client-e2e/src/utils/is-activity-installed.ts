import { BaseContributionSchema } from '@flogo-web/core';
import { getInstalledActivities } from './get-installed-activities';

export const isActivityInstalled = activityRef => {
  return getInstalledActivities().then(response => {
    const installedActivities = response?.body?.data || [];
    return installedActivities.find(
      (activity: BaseContributionSchema) => activity.ref === activityRef
    );
  });
};
