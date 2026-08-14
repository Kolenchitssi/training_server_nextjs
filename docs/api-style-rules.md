# Правила API-стиля проекта

## 1. Resource routes

Используем `:id` в URL, когда речь идёт о конкретной сущности.

Примеры:

- `GET /post/5`
- `PATCH /post/5`
- `DELETE /post/5`

Это REST-стиль для работы с одним объектом.

## 2. Action routes

Используем отдельный маршрут без `:id`, если это действие над сущностью, а не CRUD.

Примеры:

- `POST /post/favorite`
- `DELETE /post/favorite`
- `POST /post/like`
- `POST /user/archive`

Для таких маршрутов лучше использовать тело запроса `body` с DTO.

## 3. Current user from token

Текущего пользователя берём из `req.user.id`, а не из body.

Пример:

- `@Req() req: Request & { user: { id: string } }`
- `req.user.id`

Это безопаснее, потому что данные аутентификации уже проверены через `AuthGuard`.

## 4. DTO for body validation

Для body используем DTO с `class-validator` и Swagger annotations.

Пример:

```ts
export class AddFavoriteDto {
  @ApiProperty({ example: 7, description: 'ID поста' })
  @IsInt()
  @Min(1)
  postId!: number;
}
```

Это даёт:

- валидацию входа
- понятную документацию в Swagger
- единый контракт между frontend и backend

## 4.1. Когда один DTO, а когда несколько

Нет строгого правила “всегда два DTO”. Правило такое:

- если у двух endpoint'ов одинаковый контракт, одинаковые поля и одинаковая валидация — используем один DTO
- если контракты разные, отличаются поля, логика или Swagger-описание — делаем отдельные DTO

Пример для favorite:

- `POST /post/favorite` и `DELETE /post/favorite` имеют одинаковый вход `{ postId: 7 }`
- поэтому в проекте можно использовать один общий DTO, но для ясности и поиска по файлам мы приняли вариант с отдельными файлами:
  - `add-favorite.dto.ts`
  - `remove-favorite.dto.ts`

Так соблюдается правило “один класс = один файл = одна операция” и при этом сохраняется понятный API-контракт.

## 5. Auth in Swagger

Для защищённых маршрутов добавляем:

- `@UseGuards(AuthGuard)`
- `@ApiBearerAuth('bearer')`

Так Swagger показывает, что endpoint требует JWT.

## 6. When to use path params vs body

- `:id` — когда это работа с конкретным ресурсом
- `body` — когда это действие или связь

Примеры:

- `/post/5` → ресурс
- `/post/favorite` + `{ postId: 5 }` → действие над ресурсом

## 7. Favorited relation pattern

Для избранного используем relation `favoritePosts` и получаем текущего пользователя из токена.

Пример:

```ts
return this.postService.addPostToFavorites(req.user.id, dto.postId);
```

## 8. Naming convention for DTO files

Для DTO используем понятные и предсказуемые имена:

- `create-user.dto.ts` — DTO для создания
- `update-user.dto.ts` — DTO для обновления
- `add-favorite.dto.ts` — DTO для добавления действия
- `remove-favorite.dto.ts` — DTO для удаления действия
- `login.dto.ts` — DTO для логина
- `*.response.dto.ts` — если DTO должно описывать ответ сервера

Правило простое:

- имя файла должно показывать, что это за операция
- для action-методов используем `add-*`, `remove-*`, `like-*`, `archive-*`
- для CRUD — `create-*`, `update-*`, `delete-*` (если надо)

Это помогает быстро находить нужный файл и поддерживать единый стиль по проекту.

## 9. Keep the project consistent

Новые endpoints лучше писать в одном стиле:

- REST-resource routes → `:id`
- action routes → `POST/DELETE` + DTO body
- auth via token
- Swagger docs for all protected endpoints

This project should stay readable and predictable for junior developers.
