import {
	ExceptionFilter,
	Catch,
	ArgumentsHost,
	HttpException,
	HttpStatus,
} from '@nestjs/common'
import { Response } from 'express'

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
	catch(exception: unknown, host: ArgumentsHost) {
		const ctx = host.switchToHttp()
		const response = ctx.getResponse<Response>()

		let status = HttpStatus.INTERNAL_SERVER_ERROR
		let message = 'Internal server error'

		if (exception instanceof HttpException) {
			status = exception.getStatus()
			const exceptionResponse = exception.getResponse()
			message =
				typeof exceptionResponse === 'string'
					? exceptionResponse
					: (exceptionResponse as any).message || message
		}

		// Handle apenas erros críticos: 401, 403, 502
		if (status === HttpStatus.UNAUTHORIZED) {
			response.status(status).json({
				statusCode: status,
				message: 'Unauthorized',
				error: 'Authentication required',
			})
		} else if (status === HttpStatus.FORBIDDEN) {
			response.status(status).json({
				statusCode: status,
				message: 'Forbidden',
				error: 'Insufficient permissions',
			})
		} else if (status === HttpStatus.BAD_GATEWAY) {
			response.status(status).json({
				statusCode: status,
				message: 'Bad Gateway',
				error: 'Service unavailable',
			})
		} else {
			// Para outros erros, propaga sem modificação
			response.status(status).json({
				statusCode: status,
				message,
			})
		}
	}
}
