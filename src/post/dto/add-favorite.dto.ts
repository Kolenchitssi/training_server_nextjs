import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

// DTO для добавления поста в избранное.
// В этом случае логика отдельная и явная: мы задаём только обязательное поле postId.
export class AddFavoriteDto {
  @ApiProperty({
    example: 7,
    description: 'ID поста, который нужно добавить в избранное текущего пользователя',
    type: Number,
  })
  @IsInt({ message: 'postId должен быть целым числом' })
  @Min(1, { message: 'postId должен быть больше 0' })
  postId!: number;
}
