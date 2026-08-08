import { createApp } from './app.factory';

async function bootstrap() {
  const app = await createApp();
  // console.log("hallo");
  await app.listen(3000);
}

bootstrap();
