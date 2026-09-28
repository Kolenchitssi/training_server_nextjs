import { Module } from '@nestjs/common';
import { valueNotClassExampleValue } from './value-not-class-example.service';
import { ValueNotClassExampleController } from './value-not-class-example.controller';

@Module({
  controllers: [ValueNotClassExampleController],
  providers: [
    {
      provide: 'VALUE_NOT_CLASS_EXAMPLE',
      useValue: valueNotClassExampleValue,
    },
  ],
  exports: ['VALUE_NOT_CLASS_EXAMPLE'],
})
export class ValueNotClassExampleModule {}
