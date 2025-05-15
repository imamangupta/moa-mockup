import { IModule } from "../Interface";
import { BaseLoader } from "./base.loader";
import * as fs from "fs/promises";
import * as path from "path";
import Redis from "ioredis";

export interface ModuleInfo {
    className: string;
    classPath: string;
    type: string;
}

export interface LoadedModule {
    className: string;
    module: IModule;
}

export interface redisoptionsType {
    host?: string,
    port?: number,
    password?: string,
    db?: number,
    prefix?: string
}

export class RedisLoader implements BaseLoader {
    private _packageName: string = '';
    private _knownModules: ModuleInfo[] = [];
    private _loadedModules: LoadedModule[] = [];

    private _redis: Redis;
    private _modulePrefix: string = 'module:';
    private _moduleListKey: string = 'modules:list';

    constructor(options?: redisoptionsType) {
        this._redis = new Redis({
            host: options?.host || 'localhost',
            port: options?.port || 6379,
            password: options?.password,
            db: options?.db || 0
        });
        
        if (options?.prefix) {
            this._modulePrefix = `${options.prefix}:module:`;
            this._moduleListKey = `${options.prefix}:modules:list`;
        }

        this._knownModules = [];
        this._loadedModules = [];
        this.loadAll();
    }

    async loadAll(): Promise<void> {
        this._packageName = process.env.PACKAGE_NAME || 'smart-modules';
        
        const modulesFromCache = await this.loadModulesFromCache();
        
        if (!modulesFromCache) {
            const parentPath = path.join(__dirname, '..', '..', 'modules');
            await this.loadKnownModules(parentPath);
            await this.loadModulesIntoMemory();
            await this.cacheModules();
        }
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

    private async loadModulesIntoMemory(): Promise<void> {
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

    private async cacheModules(): Promise<void> {
        try {
            const pipeline = this._redis.pipeline();

            const moduleList = this._knownModules.map(info => JSON.stringify(info));
            pipeline.del(this._moduleListKey);
            if (moduleList.length > 0) {
                pipeline.rpush(this._moduleListKey, ...moduleList);
            }

            for (const { className, module } of this._loadedModules) {
                const moduleKey = `${this._modulePrefix}${className.toLowerCase()}`;
                const serializedModule = this.serializeModule(module);
                pipeline.set(moduleKey, serializedModule);
            }

            await pipeline.exec();
            console.log(`Successfully cached ${this._loadedModules.length} modules in Redis`);
        } catch (error) {
            console.error(`Failed to cache modules in Redis: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    private async loadModulesFromCache(): Promise<boolean> {
        try {
            
            const moduleInfoList = await this._redis.lrange(this._moduleListKey, 0, -1);
            if (!moduleInfoList || moduleInfoList.length === 0) {
                return false;
            }

            this._knownModules = moduleInfoList.map((info: string) => JSON.parse(info) as ModuleInfo);
            
            const pipeline = this._redis.pipeline();
            const moduleKeys = this._knownModules.map(info => 
                `${this._modulePrefix}${info.className.toLowerCase()}`
            );
            
            for (const key of moduleKeys) {
                pipeline.get(key);
            }
            
            const results = await pipeline.exec();
            if (!results) {
                return false;
            }
            
            this._loadedModules = [];
            for (let i = 0; i < results.length; i++) {
                const [err, data] = results[i] as [Error | null, string | null];
                if (err || !data) continue;
                
                const className = this._knownModules[i].className;
                const module = this.deserializeModule(data);
                if (module) {
                    this._loadedModules.push({ className, module });
                }
            }
            
            console.log(`Successfully loaded ${this._loadedModules.length} modules from Redis cache`);
            return this._loadedModules.length > 0;
        } catch (error) {
            console.error(`Failed to load modules from Redis cache: ${error instanceof Error ? error.message : String(error)}`);
            return false;
        }
    }

    private serializeModule(module: IModule): string {
        try {
            return JSON.stringify(module);
        } catch (error) {
            console.error(`Failed to serialize module: ${error instanceof Error ? error.message : String(error)}`);
            return '';
        }
    }

    private deserializeModule(serialized: string): IModule | null {
        try {
            return JSON.parse(serialized) as IModule;
        } catch (error) {
            console.error(`Failed to deserialize module: ${error instanceof Error ? error.message : String(error)}`);
            return null;
        }
    }

    async flushAll(): Promise<void> {
        try {
            
            this._loadedModules = [];
            this._knownModules = [];
            
            const keys = await this._redis.keys(`${this._modulePrefix}*`);
            keys.push(this._moduleListKey);
            
            if (keys.length > 0) {
                await this._redis.del(...keys);
                console.log(`Flushed ${keys.length} modules from Redis cache`);
            }
        } catch (error) {
            throw new Error(`Failed to flush all modules: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async disconnect(): Promise<void> {
        await this._redis.quit();
    }
}