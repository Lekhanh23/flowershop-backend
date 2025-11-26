import { IsString, IsNotEmpty, IsOptional, IsJSON } from "class-validator";

export class CreateApplicationDto {
    @IsString()
    @IsOptional()
    resumeText?: string;

    @IsOptional()
    applicationData?: any;

    @IsString()
    @IsOptional()
    documents?: string;
}