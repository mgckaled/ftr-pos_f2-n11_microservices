import { z } from 'zod'

export const createOrderSchema = z.object({
	items: z
		.array(
			z.object({
				productId: z.uuid({ message: 'Product ID inválido' }),
				quantity: z.number().int().positive({ message: 'Quantidade deve ser positiva' }),
			})
		)
		.min(1, { message: 'Pedido deve conter ao menos um item' }),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>
