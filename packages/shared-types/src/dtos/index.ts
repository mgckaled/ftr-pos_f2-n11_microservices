export interface CreateOrderDto {
	items: Array<{
		productId: string
		quantity: number
	}>
}

export interface OrderDto {
	orderId: string
	userId: string
	status: 'PENDING' | 'CONFIRMED' | 'CANCELLED'
	totalAmount: number
	items: Array<{
		productId: string
		quantity: number
		price: number
	}>
	createdAt: Date
	updatedAt: Date
}

export interface ProductDto {
	productId: string
	name: string
	description: string
	price: number
	availableQuantity: number
}

export interface ReserveInventoryDto {
	orderId: string
	items: Array<{
		productId: string
		quantity: number
	}>
}
