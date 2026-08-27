import{Body,Controller,Get,Post}from"@nestjs/common";import{CreateBranchDto}from"./branch.dto";import{BranchesService}from"./branches.service";
@Controller("branches")export class BranchesController{constructor(private readonly service:BranchesService){}@Get()list(){return this.service.list()}@Post()create(@Body()input:CreateBranchDto){return this.service.create(input)}}
