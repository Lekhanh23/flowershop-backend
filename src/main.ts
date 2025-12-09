import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common'; // Bạn có thể có dòng này
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { log } from 'console';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Cấu hình CORS
  app.enableCors({
    origin: 'http://localhost:3001', 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  //Kích hoạt Validation (kiểm tra dữ liệu đầu vào DTO)
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, //Tự động loại bỏ các field thừa không có trong DTO
    transform: true, //Tự động chuyển đổi dữ liệu 
  }));

  //Đặt tiền tố /api cho các route
  app.setGlobalPrefix('api');
  
  //Cấu hình thư mục Public để xem ảnh Upload
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  //Cấu hình Swagger
  const config = new DocumentBuilder().setTitle('Flowershop API')
  .setDescription('Tài liệu API cho dự án Flowershop').setVersion('1.0').addBearerAuth().build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  
  await app.listen(3000); 
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`Swagger Docs: ${await app.getUrl()}/api/docs`);
  
}
bootstrap();