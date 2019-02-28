export interface Trigger {
  id: string;
  name: string;
  description?: string;
  ref: string;
  createdAt: string;
  updatedAt: string;
  // todo: add interface
  settings: any;
  handlers: Handler[];
}

export interface Handler {
  resourceId: string;
  createdAt?: string;
  updatedAt?: string;
  settings: { [settingName: string]: any };
  outputs: { [outputName: string]: any };
  actionMappings?: {
    input: { [inputName: string]: any };
    output: { [outputName: string]: any };
  };
}
