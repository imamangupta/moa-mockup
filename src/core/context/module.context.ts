import { BaseContext } from "./base.context";
import { IDataObject, IDtoParams, IModuleInputParmeters } from "../Interface";

export class ModuleContext extends BaseContext{

    constructor(parameters: IDataObject | IDtoParams | IModuleInputParmeters) {
        super(parameters);
    }


    /*
        TODO: 
        1. Implement ZOD to validate input parameters using the model itslef its called in ,
        2. Implement the logic to validate parameters.
        3. Implement the logic to resolve parameters.
    */
    validateParameters(): boolean {
        try {
            
            return true; // Implement the validation logic here
        } catch (error) {
            throw new Error(`Validation failed: ${error}`);
        }
    }

    override async resolveParameters(): Promise<IDataObject> {
        // Implement the logic to resolve parameters
        return this.paramaters as IDataObject;
    }

}