export default () => ({
  port: parseInt(process.env.APP_PORT, 10),
  database: {
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT, 10),
  },
  origin: process.env.CORS_ORIGIN,
});
