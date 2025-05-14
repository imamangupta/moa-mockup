import { IModule } from "../Interface";
import * as fs from "fs/promises";
import * as path from "path";
import { BaseLoader } from "./base.loader";

export interface ModuleInfo {
    className: string;
    classPath: string;
    type: string;
}

export interface LoadedModule {
    className: string;
    module: IModule;
}

export class DirectoryLoader implements BaseLoader {
    private _packageName: string = '';
    private _knownModules: ModuleInfo[] = [];
    private _loadedModules: LoadedModule[] = [];

    constructor() {
        this._knownModules = [];
        this._loadedModules = [];
        this.loadAll();
    }

    async loadAll(): Promise<void> {
        this._packageName = process.env.PACKAGE_NAME || 'smart-modules';
        const parentPath = path.join(__dirname, '..', '..', 'modules');
        await this.loadKnownModules(parentPath);
        this.loadModulesIntoMemory();
    }

    get modules(): LoadedModule[] {
        return this._loadedModules;
    }

    get known(): ModuleInfo[] {
        return this._knownModules;
    }

    get packageName(): string {
        return this._packageName;
    }

    async loadKnownModules(parentPath: string): Promise<void> {
        
        try {

            const folders = await fs.readdir(parentPath, { withFileTypes: true });

            for (const folder of folders) {
                if (folder.isDirectory()) {
                    const folderPath = path.join(parentPath, folder.name);
                    const files = await fs.readdir(folderPath);

                    for (const file of files) {
                        if (file.match(/\.module\.(ts|js)$/)) {
                            const className = file.split('.')[0];
                            const classPath = path.join(folderPath, file);
                            this._knownModules.push({
                                className,
                                classPath,
                                type: `${this._packageName}.${className.toLowerCase()}`
                            });
                        }
                    }
                }
            }
            
        } catch (error) {
            throw new Error(`Failed to load known modules: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    private loadModulesIntoMemory() {

        try {

            for (const module of this._knownModules) {
                try {
                    const { className, classPath } = module;
                    const ModuleClass = require(classPath)[className];

                    const moduleInstance = new ModuleClass();
                    this._loadedModules.push({ className, module: moduleInstance });
                
                } catch (moduleError) {
                    console.error(`Failed to load module: ${moduleError}`);
                }

            }

        } catch (error) {
            throw new Error(`Failed to load modules into memory: ${error instanceof Error ? error.message : String(error)}`);
        }

    }

    flushAll(): void {

        try {
            this._loadedModules = [];
            this._knownModules = [];
        } catch (error) {
            throw new Error(`Failed to flush all modules: ${error instanceof Error ? error.message : String(error)}`);
        }

    }
}