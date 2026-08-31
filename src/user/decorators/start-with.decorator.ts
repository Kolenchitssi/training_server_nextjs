import {
  registerDecorator,
  ValidationArguments,
  type ValidationOptions,
} from 'class-validator';

export const StartWith = (prefix: string, validationOptions?: ValidationOptions) => {
  return (object: Object, propertyName: string) => {
    registerDecorator({
      // registerDecorator это функция из библиотеки class-validator, которая регистрирует пользовательский валидатор.
      name: 'startWith', // Это имя валидатора, которое будет использоваться в сообщениях об ошибках.
      target: object.constructor, // Это цель, к которой применяется валидатор.
      propertyName, // Это имя свойства, к которому применяется валидатор.
      constraints: [prefix], // Это массив дополнительных параметров, которые будут переданы валидатору.
      options: validationOptions, // Это объект с дополнительными параметрами валидации.
      validator: {
        // Это объект, который содержит методы для выполнения валидации.
        validate(value: any, args: ValidationArguments) {
          // Метод validate выполняет проверку значения свойства.
          // Проверяем, что значение является строкой и начинается с указанного префикса.
          return typeof value === 'string' && value.startsWith(prefix);
        },
        defaultMessage(args: ValidationArguments) {
          // Метод defaultMessage возвращает сообщение об ошибке, если валидация не прошла.
          const [prefix] = args.constraints;
          return `Property must start with "${prefix}"`;
        },
      },
    });
  };
};
