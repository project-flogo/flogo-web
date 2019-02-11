export module FlogoAppModel {
  export interface App {
    name: string;
    version: string;
    appModel: string;
    // only >= v0.9.0
    imports?: string[];
    description?: string;
    properties?: AppProperty[];
    triggers?: Trigger[];
    resources?: Resource[];
  }

  export interface AppProperty {
    name: string;
    type: string;
    value: string;
  }

  export interface Trigger {
    id: string;
    ref?: string;
    // only >= v0.9.0
    type?: string;
    // todo: confirm required
    settings?: Settings;
    handlers?: Handler[];
  }

  export interface Resource<T = unknown> {
    id: string;
    data: T;
  }

  export interface Settings {
    [settingName: string]: any;
  }

  type MappingType = 'assign' | 'literal' | 'expression' | 'object' | 'array';

  export interface Mapping {
    type: MappingType;
    value: any;
    mapTo: string;
  }

  export type Handler = NewHandler | LegacyHandler;

  // only >= v0.9.0
  export interface NewHandler {
    settings: Settings;
    action: {
      ref?: string;
      type?: string;
      settings: Settings;
      input: {
        [inputName: string]: any;
      };
      output: {
        [outputName: string]: any;
      };
    };
  }

  export interface LegacyHandler {
    settings: Settings;
    action: {
      ref: string;
      data: object;
      mappings?: {
        input?: Mapping[];
        output?: Mapping[];
      };
    };
  }
}

// todo: move into flow plugin once modularization is finalized
export module ResourceActionModel {
  import Settings = FlogoAppModel.Settings;

  export interface FlowResourceData {
    name: string;
    description: string;
    metadata: {
      input?: MetadataDefinition[];
      output?: MetadataDefinition[];
    };
    tasks?: Task[];
    links?: Link[];
    errorHandler?: {
      tasks?: Task[];
      links?: Link[];
    };
  }

  export interface Link {
    from: string;
    to: string;
    type?: string;
    value?: any;
  }

  export interface Task {
    id: string;
    name: string;
    type?: 'standard' | 'iterator';
    settings?: Settings;
    activity: Activity;
  }

  export type Activity = NewActivity | LegacyActivity;

  /**
   * from >= v0.9.0
   * */
  export interface NewActivity {
    ref?: string;
    type?: string;
    settings?: {
      [settingName: string]: any;
    };
    input?: {
      [inputName: string]: any;
    };
  }

  export interface LegacyActivity {
    ref: string;
    mappings?: {
      input?: FlogoAppModel.Mapping[];
      output?: FlogoAppModel.Mapping[];
    };
    input?: {
      [inputName: string]: any;
    };
  }

  export interface MetadataDefinition {
    name: string;
    type: string;
  }
}
