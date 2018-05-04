export namespace flow {
  export interface Flow {
    name?: string;
    rootTask: RootTask;
    errorHandlerTask?: RootTask;
    attributes?: Attribute[];
    inputMappings?: Mapping[];
    explicitReply?: boolean;
  }

  export interface Attribute {
    name: string;
    type: string;
    value: any;
  }

  interface RootTask {
    id: string;
    type?: number;
    name?: string;
    description?: string;
    attributes?: Attribute[];
    inputMappings?: Mapping[];
    tasks?: Task[];
    links?: Link[];
  }
  export interface Task extends RootTask {
    activityRef: string;
    settings?: any;
    outputMappings?: Mapping[];
    // make type required
    type: number;
  }

  export interface Mapping {
    mapTo: string;
    type: number;
    value: any;
  }

  export interface Link {
    id: number|string;
    name?: string;
    from: string;
    to: string;
    type?: number;
    value?: string;
  }

}

