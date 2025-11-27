import { v4 as uuidv4 } from 'uuid'

export function generateCorrelationId(): string {
	return uuidv4()
}

export const CORRELATION_ID_HEADER = 'x-correlation-id'
