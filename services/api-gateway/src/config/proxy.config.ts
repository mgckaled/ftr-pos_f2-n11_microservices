export const getProxyConfig = () => {
	const isDocker = process.env.NODE_ENV === 'docker'

	return {
		auth: isDocker
			? 'http://auth-service:3000'
			: (process.env.AUTH_SERVICE_URL || 'http://localhost:3000'),
		orders: isDocker
			? 'http://orders-service:3001'
			: (process.env.ORDERS_SERVICE_URL || 'http://localhost:3001'),
		inventory: isDocker
			? 'http://inventory-service:3002'
			: (process.env.INVENTORY_SERVICE_URL || 'http://localhost:3002'),
		analytics: isDocker
			? 'http://analytics-service:3004'
			: (process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3004'),
	}
}
