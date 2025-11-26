import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email({ message: 'Email inválido' }),
  password: z
    .string()
    .min(8, { message: 'Senha deve ter no mínimo 8 caracteres' })
    .regex(/[A-Z]/, { message: 'Senha deve conter ao menos uma letra maiúscula' })
    .regex(/[a-z]/, { message: 'Senha deve conter ao menos uma letra minúscula' })
    .regex(/[0-9]/, { message: 'Senha deve conter ao menos um número' }),
  name: z.string().min(3, { message: 'Nome deve ter no mínimo 3 caracteres' }),
});

export const loginSchema = z.object({
  email: z.email({ message: 'Email inválido' }),
  password: z.string().min(1, { message: 'Senha é obrigatória' }),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
