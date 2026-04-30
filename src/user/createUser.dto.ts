import { Type } from "class-transformer";
import { IsBoolean, IsNotEmpty, IsOptional, IsString, ValidateNested } from "class-validator";
// import { CreateUserSettingsDto } from "./createUserSettings.dto";


export class CreateUserDto {
    // This is the Data Transfer Object (DTO) for creating a new user.
    // It defines the structure and validation rules for the user data.
    
    
    @IsString()
    name: string;

    @IsString()
    email: string;

    




}