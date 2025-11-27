import { IsArray, IsUUID, IsNumber, Min, ValidateNested, ArrayMinSize } from 'class-validator'
import { Type } from 'class-transformer'

class OrderItemDto {
	@IsUUID('4', { message: 'Product ID deve ser um UUID válido' })
	productId: string

	@IsNumber()
	@Min(1, { message: 'Quantidade deve ser no mínimo 1' })
	quantity: number
}

export class CreateOrderDto {
	@IsArray()
	@ArrayMinSize(1, { message: 'Pedido deve conter ao menos um item' })
	@ValidateNested({ each: true })
	@Type(() => OrderItemDto)
	items: OrderItemDto[]
}
