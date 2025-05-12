import { IContext, IDataObject, IDtoParams, IModuleInputParmeters } from "../Interface";

export abstract class BaseContext implements IContext{
    paramaters: IDataObject | IDtoParams | IModuleInputParmeters;
    
    constructor(parameters: IDataObject | IDtoParams | IModuleInputParmeters) {
        this.paramaters = parameters;
    }

    async resolveParameters(): Promise<IDataObject> {
        // Implement the logic to resolve parameters
        return this.paramaters as IDataObject;
    }

    async getParameters(): Promise<IDataObject> {
        // Implement the logic to get parameters
        return this.paramaters as IDataObject;
    }

    async getNodeOutputByNodeType(nodeType: string): Promise<IDataObject> {
        // Implement the logic to get node output by node type
        return {} as IDataObject;
    }

    async resolveReference(reference: string, nodeId: string): Promise<IDataObject> {
        // Implement the logic to resolve reference
        return {} as IDataObject;
    }

    async getNodeDetails(): Promise<IDataObject> {
        // Implement the logic to get node details
        return {} as IDataObject;
    }
}