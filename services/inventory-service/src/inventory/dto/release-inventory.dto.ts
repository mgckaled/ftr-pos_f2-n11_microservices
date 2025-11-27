import { IsUUID } from 'class-validator'

export class ReleaseInventoryDto {
	@IsUUID('4', { message: 'Order ID deve ser um UUID válido' })
	orderId: string
}
