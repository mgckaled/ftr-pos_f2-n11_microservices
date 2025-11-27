import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as crypto from 'crypto'

@Injectable()
export class JwksService {
	constructor(private configService: ConfigService) {}

	getJwks() {
		const publicKey = this.configService.get<string>('JWT_PUBLIC_KEY')

		if (!publicKey) {
			throw new Error('JWT_PUBLIC_KEY not configured')
		}

		const jwk = this.pemToJwk(publicKey)

		return {
			keys: [
				{
					kty: 'RSA',
					use: 'sig',
					kid: 'key-1',
					alg: 'RS256',
					n: jwk.n,
					e: jwk.e,
				},
			],
		}
	}

	private pemToJwk(pem: string): { n: string; e: string } {
		const pemHeader = '-----BEGIN PUBLIC KEY-----'
		const pemFooter = '-----END PUBLIC KEY-----'
		const pemContents = pem.replace(pemHeader, '').replace(pemFooter, '').replace(/\s/g, '')

		const buffer = Buffer.from(pemContents, 'base64')
		const publicKey = crypto.createPublicKey({
			key: buffer,
			format: 'der',
			type: 'spki',
		})

		const jwk = publicKey.export({ format: 'jwk' })

		return {
			n: jwk.n as string,
			e: jwk.e as string,
		}
	}
}
