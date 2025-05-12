import { IModule } from "../Interface";
import * as fs from "fs";
import * as path from "path";
import { BaseLoader } from "./base.loder";

export class DirectioryLoader implements BaseLoader{
    packageName : string  =  ''; 
    knownModules : {className  : string  , classPath : string , type : string }[] = [];
    loadedModules : {className  : string  , module : IModule}[] = [];

    constructor(){
        this.knownModules = [];
        this.loadedModules = [];
        this.loadAll();
    }
    
    loadAll(){
        this.packageName = process.env.PACKAGE_NAME || 'smart-modules';
        const parentPath = path.join(__dirname, '..', '..', 'modules');
        this.loadKnownModules(parentPath);
        this.loadModulesIntoMemory();
    }

    get modules():{className  : string  , module : IModule}[]{
        return this.loadedModules;
    }

    get known():{className  : string  , classPath : string , type : string }[]{
        return this.knownModules;
    }
    
    loadKnownModules(parentPath : string){
        try {
            const folders =  fs.readdirSync(parentPath, { withFileTypes: true });
            for(const folder of folders) {
                if (folder.isDirectory()) {
                    const folderPath = path.join(parentPath, folder.name);
                    const files = fs.readdirSync(folderPath);
                    for (const file of files) {
                        if (file.includes('.module.ts') || file.includes('.module.js')) {
                            const className = file.split('.')[0];
                            const classPath = path.join(folderPath, file);
                            this.knownModules.push({ className, classPath  , type :  `${this.packageName}.${className.toLowerCase()}`});
                        }
                    }
                }
            }
        } catch (error) {
            throw error;
        }
    }


    private loadModulesIntoMemory(){
        try {
            for (const module of this.knownModules) {
                const { className, classPath } = module;
                const ModuleClass = require(classPath)[className];
                const moduleInstance = new ModuleClass();
                this.loadedModules.push({ className, module: moduleInstance });
            }
        } catch (error) {
            throw error;
        }
    }


    flushAll(): void {
        try {
            this.loadedModules = [];
            this.knownModules = [];
        } catch (error) {
            throw error;
        }
    }
}