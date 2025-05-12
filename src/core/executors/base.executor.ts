import { BaseContext } from "../context/base.context";
import { ModuleContext } from "../context/module.context";
import { IModule } from "../Interface";

export class NodeExecutor{
    constructor(
        private readonly nodeType: string , 
        private readonly module  : IModule ,
        private readonly parameters: any,
    ){}

    generateContext(paramaters:any):BaseContext{
        try {
            return new ModuleContext(paramaters);
        } catch (error) {
            throw error;
        }
    }

    async bundledependecy():Promise<any>{
        try {
            const context = this.generateContext(this.parameters);
            return context;
        } catch (error) {
            throw new Error("Failed to Bundle Dependencies");
        }
    }

    async run(): Promise<any> {
        try {
            //Create a context here and execute the module 
        } catch (error) {
            throw new Error("Failed to Run Execution Node ");
        }
    }
}