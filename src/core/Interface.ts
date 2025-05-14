import { Connection, Model } from "mongoose";
import { IocGatewayType } from "./constants";
import { BaseLoader } from "./loaders/base.loader";
import { DirectoryLoader } from "./loaders/directory.loader";


export interface IModuleLoader {
    loadModules(): Promise<void>;
    getModule(moduleName: string): Promise<any>;
    flushModules(): Promise<void>;
}

export interface IocModule{
    name  :  string  ; 
}

export type ITypes = String | number | boolean | object | Function | any[] | null;

export interface IDataObject {
    [key: string]: ITypes;
}

export interface  ISchemas {
    [key: string]: IDataObject;
}

export interface ILoader{
    [key:string] : DirectoryLoader
}

export interface IDtoParams{}        ///Only to be used with Class-validator based paramaters 

export interface IModuleInputParmeters{
    resources : IDataObject 
    operations  : IDataObject
}

export interface IContext{
    paramaters : IDataObject  | IDtoParams | IModuleInputParmeters ;
    workflow ? : any ;  //Replace this with Proper Workflow Instance ;  
    resolveParameters(): Promise<IDataObject>;
    getParameters(): Promise<IDataObject>;
    getNodeOutputByNodeType(nodeType: string): Promise<IDataObject>;
    resolveReference(reference:string , nodeId:string): Promise<IDataObject>;
    getNodeDetails(): Promise<IDataObject>;
}

export interface NodeExecutionParams{
    nodeId: string;
    nodeType: string;
    parameters: IDataObject | IDtoParams | IModuleInputParmeters;
    workflow?: any; // Replace this with Proper Workflow Instance ;  
}


//Declare Document instances before Intiaizing the model
export interface IRepoModule<T> extends IocModule{
    moduleName : string;
    connection  :  Connection; 
    schema : ISchemas;
    model : Model<T>;
    initModel(): Promise<void>;
    findById(id: string): Promise<T | null>;
    findOne(query: IDataObject): Promise<T | null>;
    find(query: IDataObject): Promise<T[]>;
    create(data: IDataObject): Promise<T>;
    update(id: string, data: IDataObject): Promise<T | null>;
    delete(id: string): Promise<T | null>;
    deleteMany(query: IDataObject): Promise<T[]>;
    findByIdAndUpdate(id: string, data: IDataObject): Promise<T | null>;
    findByIdAndDelete(id: string): Promise<T | null>;
    findOneAndUpdate(query: IDataObject, data: IDataObject): Promise<T | null>;
    findOneAndDelete(query: IDataObject): Promise<T | null>;
}


export interface IOCgateway{
    gatewayType : IocGatewayType;
    setPod(pod : IRepoModule<any>): void;
    getPod(): IRepoModule<any>;
}


export interface IEngagePod{
    (podName:string): Promise<IRepoModule<any>>;
}


export interface IModuleFunctions {
    name  : string;
    paramaters : Array<IDataObject>;    //can be a DTO  using class-validator , can be a JSON as well  , resolve in context executor
}

export interface IHttpMethods  extends IModuleFunctions{
    method : string;
    endpoint : string;
}

export interface ModuleDescription{
    displayName: string;   
    supportedFunctions : IModuleFunctions[];
    httpMethods: IHttpMethods[];
}

export interface IContextExecutor{ 
    getParameters(): Promise<IDataObject>;
    getNodeParametersByName(name: string): Promise<IDataObject>;
    getNodeDetails(): Promise<IDataObject>;
}


export interface IModule{
    description: ModuleDescription;
    repoModule: IRepoModule<any>;   
}