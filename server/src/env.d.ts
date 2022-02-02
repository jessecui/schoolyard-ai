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
    }
  }
}

export {}
