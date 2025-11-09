import { DataSource } from 'typeorm';
export declare class InitialDataSeed {
    private dataSource;
    constructor(dataSource: DataSource);
    run(): Promise<void>;
    private createDefaultConsumers;
    private generateApiKey;
}
export declare function runSeed(dataSource: DataSource): Promise<void>;
