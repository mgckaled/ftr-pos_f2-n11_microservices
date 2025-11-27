import { Controller, Get, Post, Param, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common'
import { InventoryService } from './inventory.service'
import { ReserveInventoryDto } from './dto/reserve-inventory.dto'
import { ReleaseInventoryDto } from './dto/release-inventory.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('inventory')
export class InventoryController {
	constructor(private inventoryService: InventoryService) {}

	@Get('products')
	async findAll(
		@Query('page', new ParseIntPipe({ optional: true })) page?: number,
		@Query('limit', new ParseIntPipe({ optional: true })) limit?: number
	) {
		return this.inventoryService.findAllProducts(page, limit)
	}

	@Get('products/:productId')
	async findOne(@Param('productId') productId: string) {
		return this.inventoryService.findProductById(productId)
	}

	@Post('reserve')
	@UseGuards(JwtAuthGuard)
	async reserve(@Body() reserveDto: ReserveInventoryDto) {
		return this.inventoryService.reserve(reserveDto.orderId, reserveDto.items)
	}

	@Post('release')
	@UseGuards(JwtAuthGuard)
	async release(@Body() releaseDto: ReleaseInventoryDto) {
		return this.inventoryService.release(releaseDto.orderId)
	}

	@Post('commit')
	@UseGuards(JwtAuthGuard)
	async commit(@Body() releaseDto: ReleaseInventoryDto) {
		return this.inventoryService.commit(releaseDto.orderId)
	}
}
