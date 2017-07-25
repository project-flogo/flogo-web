export interface IFlogoApplicationModel {
    id: string,
    name: string,
    version: string,
    description: string,
    createdAt: any,
    updatedAt: any,
    flows?: IFlogoApplicationFlowModel[]
    triggers?: Array<Trigger>;
    actions?: Array<Action>;
    type?: string;
    device?: any;
}

export interface IFlogoApplicationFlowModel {
    id: string,
    name: string,
    description: string,
    createdAt: any
}

export interface Trigger {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  settings: any;
  handlers: any[];
}

export interface Action {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  data: {
    // todo: complete flow interface
    flow: any
  };
}
