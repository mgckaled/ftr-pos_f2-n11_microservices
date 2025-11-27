import { IsArray, IsUUID, IsNumber, Min, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

class ReserveItemDto {
  @IsUUID('4', { message: 'Product ID deve ser um UUID válido' })
  productId: string;

  @IsNumber()
  @Min(1, { message: 'Quantidade deve ser no mínimo 1' })
  quantity: number;
}

export class ReserveInventoryDto {
  @IsUUID('4', { message: 'Order ID deve ser um UUID válido' })
  orderId: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Deve conter ao menos um item' })
  @ValidateNested({ each: true })
  @Type(() => ReserveItemDto)
  items: ReserveItemDto[];
}
