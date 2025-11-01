import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common'; // Bạn có thể có dòng này

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Đảm bảo bạn có 2 dòng này:
  app.useGlobalPipes(new ValidationPipe());
  app.setGlobalPrefix('api');
  
  // VÀ QUAN TRỌNG NHẤT LÀ DÒNG NÀY:
  await app.listen(3000); 
  // Nếu không có dòng trên, app sẽ không "chạy"
}
bootstrap();