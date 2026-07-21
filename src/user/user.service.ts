import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from './user.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable() // Это декоратор, который делает класс UserService доступным
// для внедрения зависимостей в других частях приложения.

/* Декоратор, помечающий класс как провайдер. Провайдеры могут быть внедрены
 в другие классы посредством внедрения параметров конструктора с использованием 
 встроенной в Nest системы внедрения зависимостей (DI).

При внедрении провайдера он должен быть видим в области видимости модуля 
(если говорить упрощенно, содержащего модуля) класса, в который он внедряется.
 Это можно сделать следующим образом:
- определить провайдера в той же области видимости модуля;
- экспортировать провайдера из одной области видимости модуля и импортировать этот модуль 
в область видимости модуля класса, в который он внедряется;
- экспортировать провайдера из модуля, помеченного как глобальный с помощью декоратора @Global(). */
export class UserService {
  private users: User[] = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
      address: '123 Main St',
      age: 30,
    },
    {
      id: 2,
      name: 'Jane Doe',
      email: 'jane.doe@example.com',
      address: '456 Elm St',
      age: 25,
    },
  ];

  getAllUsers(): User[] {
    return this.users;
  }

  getUserById(id: string): User {
    const user = this.users.find((user) => user.id === Number(id));
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  // DTO (Data Transfer Object) - это объект, который используется для передачи данных между слоями приложения.
  // В данном случае, CreateUserDto используется для передачи данных при создании нового пользователя.
  createUser(dto: CreateUserDto): User {
    const newId = this.users.length + 1;
    const newUser: User = { id: newId, ...dto };
    this.users.push(newUser);
    return newUser;
  }

  updateUser(id: string, dto: UpdateUserDto): User {
    const user = this.getUserById(id);
    const updatedUser = { ...user, ...dto };
    const index = this.users.findIndex((user) => user.id === Number(id));
    console.log('index:', index);
    this.users[index] = updatedUser;
    return updatedUser;
  }

  partialUpdateUser(id: string, dto: Partial<UpdateUserDto>): User {
    const user = this.getUserById(id);
    // const updatedUser = { ...user, ...dto };
    // const index = this.users.findIndex((user) => user.id === Number(id));
    // this.users[index] = updatedUser;
    // return updatedUser;

    //так  короче но осторожно с вложенными объектами или массивами
    Object.assign(user, dto);
    /* Как работает:
        Мутирует target — свойства добавляются (или перезаписываются) прямо в первый переданный объект
        Возвращает тот же target (не новый объект, если только target не примитив)
        Поверхностное копирование (shallow copy) — вложенные объекты копируются по ссылке
        Поддерживает несколько источников: Object.assign(target, source1, source2, source3) */
    return user;
  }
  deleteUser(id: string): User {
    const user = this.getUserById(id);
    this.users = this.users.filter((user) => user.id !== Number(id));
    return user;
  }
}
