import { Controller, Get } from '@nestjs/common';
import { JwksService } from './jwks.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('JWKS')
@Controller()
export class JwksController {
  constructor(private jwksService: JwksService) {}

  @Get('.well-known/jwks.json')
  @ApiOperation({ summary: 'Get JSON Web Key Set (JWKS)' })
  @ApiResponse({ status: 200, description: 'JWKS retrieved successfully' })
  getJwks() {
    return this.jwksService.getJwks();
  }
}
