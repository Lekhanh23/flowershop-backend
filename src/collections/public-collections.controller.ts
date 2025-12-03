import { Controller, Get, Param, ParseIntPipe } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CollectionsService } from "./collections.service";

@ApiTags('Collections (Public)')
@Controller('collections')
export class PublicCollectionsController{
    constructor(private readonly collectionsService : CollectionsService) {}
    @Get()
    findAll() {
        return this.collectionsService.findAllPublic();
    }
    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.collectionsService.findOne(id);
    }
}