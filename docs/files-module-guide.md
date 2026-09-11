# Files Module Guide

## Что было сделано

В проект добавлен отдельный доменный модуль `files`, который отвечает за сохранение, удаление и выдачу публичного URL файлов.

Новая структура:

- `src/files/files.module.ts`
- `src/files/files.service.ts`
- `src/files/storage/file-storage.interface.ts`
- `src/files/storage/file-storage.tokens.ts`
- `src/files/storage/file-storage.types.ts`
- `src/files/storage/local-storage.service.ts`

Также добавлены endpoint'ы для аватара пользователя:

- `GET /api/user/avatar` — получить URL текущего аватара
- `POST /api/user/avatar` — загрузить/обновить аватар

И добавлен endpoint для картинок поста:

- `POST /api/post/:id/images` — загрузить 1..5 картинок поста владельцем

## Зачем выделен отдельный модуль

Причина: файлы становятся отдельной предметной областью.

Сегодня это аватары, а завтра:

- документы
- изображения товаров
- чат-вложения
- правила доступа к разным типам файлов
- lifecycle (очистка старых файлов, ретеншн)

Поэтому `files` лучше держать отдельно от `common`, а в `common` оставлять только truly shared вещи (guards, pipes, decorators, utils).

## Как это работает сейчас

### 1. Контракт хранилища

Интерфейс `FileStorage` задает единый API:

- `saveFile(...)`
- `deleteFile(...)`
- `getPublicUrl(...)`

Бизнес-сервисы (например, `UserService`) не знают, local это storage или другой провайдер.

### 2. Выбор драйвера хранения

В `FilesModule` через DI выбирается реализация по `FILE_STORAGE_DRIVER`.

Сейчас поддерживается:

- `local`

Комментарий: в коде оставлена точка расширения через `switch`, чтобы позже можно было добавить новый провайдер, когда он будет окончательно выбран.

### 3. Локальное хранение

`LocalStorageService`:

- сохраняет файлы в папку из `FILE_STORAGE_LOCAL_ROOT` (по умолчанию `uploads`)
- строит URL через `FILE_STORAGE_PUBLIC_BASE_PATH` (по умолчанию `/uploads`)
- делает нормализацию сегментов пути
- защищает от `path traversal`

### 4. Публикация статических файлов

В `main.ts` подключена раздача статических файлов из локального storage root.

Итог: после сохранения файл доступен по URL вида:

`/uploads/avatars/<uuid>.jpg`
`/uploads/posts/<post-id>-<uuid>.jpg`

### 5. Аватары пользователя

В `UserService` используется `FilesService`:

- при upload файл сохраняется в `avatars/<uuid>.<ext>`
- в БД хранится ключ файла `avatarPath` (не полный URL)
- если БД обновить не удалось, новый файл удаляется (rollback на уровне файлов)
- при успешной замене удаляется предыдущий файл
- если удаление старого файла не удалось, операция не откатывается (новый аватар уже сохранен),
  а старый файл остается как "orphan" для последующей очистки

Важно: оригинальное имя файла (например, `avatar.png`) не используется,
чтобы избежать дублей и конфликтов имен.

### 6. Картинки постов

В `PostService` используется `FilesService`:

- загрузка разрешена только владельцу поста
- имя файла строится как `postId + '-' + uuid` (например `7-f4f36273-3ab8-4b6a-b495-e6df2f3678cd.jpg`)
- за один запрос можно отправить до 5 файлов
- суммарно у одного поста может быть не более 5 картинок
- в БД хранится только относительный путь (ключ) в `post_images.path` (без полного URL)
- каждый файл сохраняется отдельной записью в таблице `post_images`

## Валидация загрузки

Для `POST /api/user/avatar`:

- разрешены только `image/jpeg` и `image/png`
- максимум `10 MB` (или значение `MAX_UPLOAD_SIZE_MB`)
- ошибки валидации отдаются как `422 Unprocessable Entity`

Для `POST /api/post/:id/images` применяются такие же правила:

- только `image/jpeg` и `image/png`
- максимум `10 MB` (или `MAX_UPLOAD_SIZE_MB`)
- максимум `5` файлов в одном запросе
- `403`, если пост не принадлежит текущему пользователю
- `400`, если с учетом уже загруженных файлов лимит 5 на пост превышен

## Изменения в БД

Добавлено поле в `User`:

- `avatarPath String? @map("avatar_path")`

Создана миграция:

- `prisma/migrations/20260831110000_add_user_avatar_path/migration.sql`

Добавлено поле в `Post`:

- `imagePath String? @map("image_path")`

Добавлена таблица `PostImage` для хранения нескольких изображений поста.

Создана миграция:

- `prisma/migrations/20260831125500_add_post_image_path/migration.sql`
- `prisma/migrations/20260831152000_add_post_images_table/migration.sql`

## Конфигурация окружения

Добавлены переменные:

- `FILE_STORAGE_DRIVER` (по умолчанию `local`)
- `FILE_STORAGE_LOCAL_ROOT` (по умолчанию `uploads`)
- `FILE_STORAGE_PUBLIC_BASE_PATH` (по умолчанию `/uploads`)
- `MAX_UPLOAD_SIZE_MB` (по умолчанию `10`)

## Что уже проверено

Проверки выполнены:

- `npm run build`
- `npm test -- user.service.spec.ts user.controller.spec.ts`
- `npm test -- post.service.spec.ts post.controller.spec.ts`
- `npx prisma validate`

Все проверки прошли успешно.

## TODO (следующие шаги)

1. Применить миграцию к локальной базе:
   - `npx prisma migrate dev`

2. Когда будет выбран провайдер облачного хранения, добавить новый адаптер в `src/files/storage/` и расширить `FilesModule`.

3. Вынести политику валидации upload в files-домен:
   - единые лимиты
   - единые правила file type
   - переиспользование для других сущностей

4. Добавить e2e тест multipart upload для `/api/user/avatar`.

5. Добавить e2e тест multipart upload для `/api/post/:id/images`.

6. (Опционально) Добавить обработку изображений через `sharp`:
   - ресайз
   - компрессия
   - нормализация ориентации

## Пример запроса на загрузку аватара

```bash
curl -X POST http://localhost:5001/api/user/avatar \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -F "avatar=@C:/images/avatar.jpg"
```

Пример ответа:

```json
{
  "avatarUrl": "/uploads/avatars/f4f36273-3ab8-4b6a-b495-e6df2f3678cd.jpg"
}
```

## Пример запроса на загрузку картинки поста

```bash
curl -X POST http://localhost:5001/api/post/7/images \
   -H "Authorization: Bearer <JWT_TOKEN>" \
    -F "images=@C:/images/post-cover-1.jpg" \
    -F "images=@C:/images/post-cover-2.png"
```

Пример ответа:

```json
{
  "imageUrls": [
    "/uploads/posts/7-f4f36273-3ab8-4b6a-b495-e6df2f3678cd.jpg",
    "/uploads/posts/7-b0f84f9a-2f32-43f7-bef3-0507f2c4ee3f.png"
  ]
}
```

## Что хранится в БД

В БД хранится только относительный путь файла (ключ), например:

`avatars/fbcebc6b-2864-41d1-a6e4-dc5dd3041c3d.jpg`
`avatars/f4f36273-3ab8-4b6a-b495-e6df2f3678cd.jpg`
`posts/7-f4f36273-3ab8-4b6a-b495-e6df2f3678cd.jpg`
`posts/7-b0f84f9a-2f32-43f7-bef3-0507f2c4ee3f.png`

Полный URL вида `http://localhost:3000/uploads/avatars/...` в БД не сохраняется.
