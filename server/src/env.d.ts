declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL: string;
      REDIS_URL: string;
      PORT: string;
      SESSION_SECRET: string;
      CORS_ORIGIN: string;
      GMAIL_USER: string;
      GMAIL_PASSWORD: string;
      AWS_BUCKET_NAME: string;
      AWS_BUCKET_REGION: string;
      AWS_ACCESS_KEY_ID: string;
      AWS_SECRET_ACCESS_KEY: string;
    }
  }
}

export {}
