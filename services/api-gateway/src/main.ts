import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { HttpExceptionFilter } from './filters/http-exception.filter'
import { apiReference } from '@scalar/nestjs-api-reference'

async function bootstrap() {
	const app = await NestFactory.create(AppModule)

	// Global Exception Filter
	app.useGlobalFilters(new HttpExceptionFilter())

	// CORS
	app.enableCors()

	// Scalar API Reference
	app.use(
		'/reference',
		apiReference({
			spec: {
				content: {
					openapi: '3.1.0',
					info: {
						title: 'Microservices API Gateway',
						version: '1.0.0',
						description:
							'API Gateway centralizado para microsserviços de Auth, Orders, Inventory e Analytics',
					},
					servers: [
						{
							url: 'http://localhost:4000',
							description: 'API Gateway - Local',
						},
						{
							url: 'http://localhost:4000',
							description: 'API Gateway - Docker',
						},
					],
					paths: {
						'/api/auth/register': {
							post: {
								tags: ['Auth'],
								summary: 'Registrar novo usuário',
								description: 'Endpoint para criar uma nova conta de usuário',
								requestBody: {
									required: true,
									content: {
										'application/json': {
											schema: {
												type: 'object',
												properties: {
													email: { type: 'string', format: 'email' },
													password: { type: 'string', minLength: 6 },
													name: { type: 'string' },
												},
												required: ['email', 'password', 'name'],
											},
										},
									},
								},
								responses: {
									'201': {
										description: 'Usuário criado com sucesso',
									},
									'400': {
										description: 'Dados inválidos',
									},
								},
							},
						},
						'/api/auth/login': {
							post: {
								tags: ['Auth'],
								summary: 'Autenticar usuário',
								description: 'Endpoint para realizar login e obter token JWT',
								requestBody: {
									required: true,
									content: {
										'application/json': {
											schema: {
												type: 'object',
												properties: {
													email: { type: 'string', format: 'email' },
													password: { type: 'string' },
												},
												required: ['email', 'password'],
											},
										},
									},
								},
								responses: {
									'200': {
										description: 'Login realizado com sucesso',
									},
									'401': {
										description: 'Credenciais inválidas',
									},
								},
							},
						},
						'/api/orders': {
							get: {
								tags: ['Orders'],
								summary: 'Listar pedidos',
								description: 'Retorna lista de pedidos do usuário autenticado',
								security: [{ bearerAuth: [] }],
								responses: {
									'200': {
										description: 'Lista de pedidos',
									},
									'401': {
										description: 'Não autenticado',
									},
								},
							},
							post: {
								tags: ['Orders'],
								summary: 'Criar novo pedido',
								description: 'Cria um novo pedido com validação de estoque',
								security: [{ bearerAuth: [] }],
								requestBody: {
									required: true,
									content: {
										'application/json': {
											schema: {
												type: 'object',
												properties: {
													items: {
														type: 'array',
														items: {
															type: 'object',
															properties: {
																productId: { type: 'string' },
																quantity: { type: 'number' },
															},
														},
													},
												},
											},
										},
									},
								},
								responses: {
									'201': {
										description: 'Pedido criado com sucesso',
									},
									'400': {
										description: 'Dados inválidos',
									},
									'401': {
										description: 'Não autenticado',
									},
								},
							},
						},
						'/api/inventory/products': {
							get: {
								tags: ['Inventory'],
								summary: 'Listar produtos',
								description: 'Retorna lista de produtos disponíveis em estoque',
								responses: {
									'200': {
										description: 'Lista de produtos',
									},
								},
							},
						},
						'/api/inventory/products/{id}': {
							get: {
								tags: ['Inventory'],
								summary: 'Obter produto por ID',
								description: 'Retorna detalhes de um produto específico',
								parameters: [
									{
										name: 'id',
										in: 'path',
										required: true,
										schema: { type: 'string' },
									},
								],
								responses: {
									'200': {
										description: 'Detalhes do produto',
									},
									'404': {
										description: 'Produto não encontrado',
									},
								},
							},
						},
						'/api/analytics/metrics': {
							get: {
								tags: ['Analytics'],
								summary: 'Obter métricas gerais',
								description: 'Retorna métricas agregadas do sistema',
								security: [{ bearerAuth: [] }],
								responses: {
									'200': {
										description: 'Métricas do sistema',
									},
									'401': {
										description: 'Não autenticado',
									},
								},
							},
						},
					},
					components: {
						securitySchemes: {
							bearerAuth: {
								type: 'http',
								scheme: 'bearer',
								bearerFormat: 'JWT',
							},
						},
					},
				},
			},
		}),
	)

	const port = process.env.PORT || 4000
	await app.listen(port)
	console.log(`API Gateway running on http://localhost:${port}`)
	console.log(`API Reference available at http://localhost:${port}/reference`)
}

bootstrap()
