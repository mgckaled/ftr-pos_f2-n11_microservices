import { IsEmail, IsString, MinLength, Matches } from 'class-validator'

export class RegisterDto {
	@IsEmail({}, { message: 'Email inválido' })
	email: string

	@IsString()
	@MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres' })
	@Matches(/[A-Z]/, { message: 'Senha deve conter ao menos uma letra maiúscula' })
	@Matches(/[a-z]/, { message: 'Senha deve conter ao menos uma letra minúscula' })
	@Matches(/[0-9]/, { message: 'Senha deve conter ao menos um número' })
	password: string

	@IsString()
	@MinLength(3, { message: 'Nome deve ter no mínimo 3 caracteres' })
	name: string
}
