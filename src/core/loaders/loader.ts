import { ILoader, IModule } from "../Interface";
import { BaseLoader } from "./base.loader";
import { DirectoryLoader } from "./directory.loader";

export type Class<T = object, A extends unknown[] = unknown[]> = new (...args: A) => T;

export class ModuleLoader {
    private readonly loaders: Record<string, BaseLoader> = {};
    

    init() {
        try {
            this.loadModules(DirectoryLoader);
        } catch (error) {
            throw new Error(`Failed to initialize ModuleLoader: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    private loadModules<T extends DirectoryLoader>(Constructor: Class<T, ConstructorParameters<typeof DirectoryLoader>>) {
        try {
            const loader = new Constructor();
            this.loaders[loader.packageName] = loader;
            return loader;
        } catch (error) {
            throw new Error(`Failed to load modules: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    private resolveLoaderForModule(packageName: string) {
        try {
            const loader = this.loaders[packageName];

            if (!loader) {
                throw new Error(`Loader not found for package: ${packageName}`);
            }
            if (!loader.known.length) {
                throw new Error(`No modules found for package: ${packageName}`);
            }
            return loader;
        } catch (error) {
            throw error;
        }
    }

    getModuleByType(moduleType: string) {
        try {
            const [packageName, type] = moduleType.split('.');
            if (!packageName || !type) {
                throw new Error(`Invalid module type format: ${moduleType}. Expected format: type`);
            }

            const loader = this.resolveLoaderForModule(packageName);
            const loadedModule = loader.modules.find(module =>
                module.className === type
            );

            if (!loadedModule) {
                throw new Error(`Module not found for type: ${moduleType}`);
            }
            return loadedModule.module;
        } catch (error) {
            throw error;
        }
    }

    getAllModules(): Record<string, IModule> {
        const result: Record<string, IModule> = {};

        Object.entries(this.loaders).forEach(([packageName, loader]) => {
            const directoryLoader = loader as DirectoryLoader;
            directoryLoader.modules.forEach(({ className, module }) => {
                result[`${packageName}.${className.toLowerCase()}`] = module;
            });
        });

        return result;
    }
}