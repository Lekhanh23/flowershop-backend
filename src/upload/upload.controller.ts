import { BadRequestException, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('upload')
export class UploadController {
    @Post()
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './uploads',
            filename: (req, file, callback) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                const ext = extname(file.originalname);
                callback(null, `${uniqueSuffix}${ext}`);
            },
        }),
        fileFilter: (req, file, callback) => {
            if(!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
                return callback(
                     new BadRequestException("Chỉ chấp nhận file ảnh (jpg, jpeg, png, gif)!"),
                     false,
                );
            }
            callback(null, true);
        },
        limits: {
            fileSize: 5 * 1024 * 1024,
        },
      }),
    )
    uploadFile(@UploadedFile() file: Express.Multer.File) {
        if(!file) {
            throw new BadRequestException("Không có file nào được upload!");
        }
        return {
            filename: file.filename,
            path: `/uploads/${file.filename}`,
        };
    }
}
