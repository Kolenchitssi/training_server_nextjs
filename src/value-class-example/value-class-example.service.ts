import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class ValueClassExampleService {
  constructor(
    @Inject('FIRST_V') private myValue1: string,
    @Inject('VALUE_NOT_CLASS_EXAMPLE') private readonly myValue2: string,
  ) {}
  // мы можем использовать полученные переменные myValue1 и myValue2 в методах сервиса
  getValues() {
    console.log('myValue1:', this.myValue1, 'myValue2:', this.myValue2);
    return {
      myValue1: this.myValue1,
      myValue2: this.myValue2,
    };
  }
}
