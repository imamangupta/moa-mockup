import { ILoader } from "../Interface";
import { BaseLoader } from "./base.loder";
import { DirectioryLoader } from "./directory.loder";

export type Class<T = object, A extends unknown[] = unknown[]> = new (...args: A) => T;

export class ModuleLoader {
    
    loaded : ILoader ; 

    constructor(){
        this.loaded = {};
    }

    async init(){
        try {
            await this.loadModules(DirectioryLoader);
        } catch (error) {
            throw new Error('Failed to load Modules : ' + error);
        }
    }


    private async loadModules<T extends DirectioryLoader>(constructor : Class<T  ,ConstructorParameters<typeof DirectioryLoader>> ){
        try {
           const loder = new constructor();
           this.loaded[loder.packageName] = loder;
            return loder;
        } catch (error) {
            throw new Error('Failed to load Modules : ' + error);
        }
    }

    private resolveLoaderForModule(packagename:string){
        try {
            const loader = this.loaded[packagename];
            if (!loader) {
                throw new Error(`Loader not found for package: ${packagename}`);
            }
            if(!loader.known.length || !loader.known.length){
                throw new Error(`No modules found for package: ${packagename}`);
            }
            return loader;
        } catch (error) {
            throw new Error("Failed to resolve loader for module : " + error);
        }
    }

    getModuleByType(moduleType:  string){
        try {
            const [packageName  , type] = moduleType.split('.');
            const loader  = this.resolveLoaderForModule(packageName);
            const {modules} = loader;
            const loadedInstance  = modules.find(module=>module.className === type);
            if (!loadedInstance) {
                throw new Error(`loadedInstance not found for type: ${moduleType}`);
            }
            return loadedInstance.module;
        } catch (error) {
            throw error;
        }
    }
}