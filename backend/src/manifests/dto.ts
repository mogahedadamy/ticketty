import { IsNotEmpty, IsString } from 'class-validator';

export class GenerateManifestDto {
  @IsString()
  @IsNotEmpty()
  tripId: string;
}
