export interface IFlogoApplicationModel {
    id: string,
    name: string,
    version: string,
    description: string,
    createdAt: any,
    updatedAt: any,
    flows?: IFlogoApplicationFlowModel[]
}

export interface IFlogoApplicationFlowModel {
    id: string,
    name: string,
    description: string,
    createdAt: any
}
