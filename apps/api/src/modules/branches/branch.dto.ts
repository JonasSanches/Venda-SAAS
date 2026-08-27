import{IsIn,IsString,Length,MinLength}from"class-validator";
export class CreateBranchDto{@IsString()@MinLength(2)name!:string;@IsString()@MinLength(11)taxId!:string;@IsIn(["SP","RJ"])state!:"SP"|"RJ";@IsString()@Length(7,7)cityCode!:string;@IsString()@MinLength(2)taxRegime!:string;@IsString()@MinLength(2)stateRegistration!:string}
