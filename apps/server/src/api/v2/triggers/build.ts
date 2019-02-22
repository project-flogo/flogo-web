import { buildHandler } from '../shared/build-handler';
import { getNameForAppBinary } from '../shared/name-for-app-binary';

export const buildTrigger = buildHandler(async (context, options) => {
  const triggerId = context.params.triggerId;
  const buildResult = await context.appsService.buildShim(triggerId, options);
  return {
    content: buildResult.data,
    fileName: buildResult.plugin
      ? `${buildResult.trigger}.zip`
      : getNameForAppBinary(buildResult.appName, options.compile),
  };
});
