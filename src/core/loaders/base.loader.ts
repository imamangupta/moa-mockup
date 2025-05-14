export abstract class BaseLoader {
    
    abstract loadAll(): Promise<void>;
    abstract flushAll(): void;
    abstract get modules(): any[];
    abstract get known(): any[];
    
}