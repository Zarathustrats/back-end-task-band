declare namespace NodeJS {
  interface ProcessEnv {
    PORT: number;
    DB_DIALECT: Dialect;
    DB_HOST: string;
    DB_PORT: number;
    DB_USERNAME: string;
    DB_PASSWORD: string;
    DB_NAME: string;
    PRIVATE_KEY: string;
  }
}
