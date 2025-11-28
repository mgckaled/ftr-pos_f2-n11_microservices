import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { getProxyConfig } from './config/proxy.config'

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
		}),
	],
})
export class AppModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		const services = getProxyConfig()

		// Proxy para Auth Service
		consumer
			.apply(
				createProxyMiddleware({
					target: services.auth,
					changeOrigin: true,
					pathRewrite: {
						'^/api/auth': '',
					},
					on: {
						proxyReq: (proxyReq, req, res) => {
							console.log(`[Proxy] ${req.method} ${req.url} -> ${services.auth}`)
						},
						error: (err, req, res) => {
							console.error(`[Proxy Error] ${req.url}:`, err.message)
						},
					},
				}),
			)
			.forRoutes('/api/auth')

		// Proxy para Orders Service
		consumer
			.apply(
				createProxyMiddleware({
					target: services.orders,
					changeOrigin: true,
					pathRewrite: {
						'^/api/orders': '',
					},
					on: {
						proxyReq: (proxyReq, req, res) => {
							console.log(`[Proxy] ${req.method} ${req.url} -> ${services.orders}`)
						},
						error: (err, req, res) => {
							console.error(`[Proxy Error] ${req.url}:`, err.message)
						},
					},
				}),
			)
			.forRoutes('/api/orders')

		// Proxy para Inventory Service
		consumer
			.apply(
				createProxyMiddleware({
					target: services.inventory,
					changeOrigin: true,
					pathRewrite: {
						'^/api/inventory': '',
					},
					on: {
						proxyReq: (proxyReq, req, res) => {
							console.log(
								`[Proxy] ${req.method} ${req.url} -> ${services.inventory}`,
							)
						},
						error: (err, req, res) => {
							console.error(`[Proxy Error] ${req.url}:`, err.message)
						},
					},
				}),
			)
			.forRoutes('/api/inventory')

		// Proxy para Analytics Service
		consumer
			.apply(
				createProxyMiddleware({
					target: services.analytics,
					changeOrigin: true,
					pathRewrite: {
						'^/api/analytics': '',
					},
					on: {
						proxyReq: (proxyReq, req, res) => {
							console.log(
								`[Proxy] ${req.method} ${req.url} -> ${services.analytics}`,
							)
						},
						error: (err, req, res) => {
							console.error(`[Proxy Error] ${req.url}:`, err.message)
						},
					},
				}),
			)
			.forRoutes('/api/analytics')
	}
}
