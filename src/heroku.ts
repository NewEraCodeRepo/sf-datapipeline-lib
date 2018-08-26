import ProcessEnv = NodeJS.ProcessEnv;

import { existsSync, writeFileSync } from "fs";

import { IGlobalConfiguration } from "node-rdkafka";

export interface ICertFile {
    path: string;
    contents: string;
}

export interface ICertFileMap {
    [index: string]: ICertFile;
}

export function hasKafkaSSLEnabled(env: ProcessEnv): boolean {
    return env.KAFKA_CLIENT_CERT !== undefined &&
        env.KAFKA_CLIENT_CERT_KEY !== undefined &&
        env.KAFKA_TRUSTED_CERT !== undefined;
}

export function toCertFiles(env: ProcessEnv, path: string): ICertFileMap {
    const map: ICertFileMap = {};
    if (env.KAFKA_CLIENT_CERT_KEY) {
        map["client.key"] = {
            contents: env.KAFKA_CLIENT_CERT_KEY as string,
            path: `${path}/client.key`,
        };
    }
    if (env.KAFKA_CLIENT_CERT) {
        map["client.pem"] = {
            contents: env.KAFKA_CLIENT_CERT as string,
            path: `${path}/client.pem`,
        };
    }
    if (env.KAFKA_TRUSTED_CERT) {
        map["server.pem"] = {
            contents: env.KAFKA_TRUSTED_CERT as string,
            path: `${path}/server.pem`,
        };
    }
    return map;
}

export function addKafkaSSLSettings(
    config: IGlobalConfiguration, map: ICertFileMap): IGlobalConfiguration {
    return {
        "security.protocol": "ssl",
        "ssl.ca.location": map["server.pem"].path,
        "ssl.certificate.location": map["client.pem"].path,
        "ssl.key.location": map["client.key"].path,
        ...config,
    };
}

export function writeSSLFiles(map: ICertFileMap): void {
    const filePromises = Object.keys(map).forEach((key: string) => { // tslint:disable-line
        const certFile: ICertFile = map[key];
        if (!existsSync(certFile.path)) {
            writeFileSync(certFile.path, certFile.contents);
        }
    });
}
