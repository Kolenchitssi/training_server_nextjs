import { Module } from '@nestjs/common';
import { ValueClassExampleService } from './value-class-example.service';
import { ValueClassExampleController } from './value-class-example.controller';
import { ValueNotClassExampleModule } from '../value-not-class-example/value-not-class-example.module';

@Module({
  imports: [ValueNotClassExampleModule],
  controllers: [ValueClassExampleController],
  providers: [
    ValueClassExampleService,
    {
      provide: 'FIRST_V',
      useValue: 'First v',
    },
  ],
  exports: [ValueClassExampleService],
})
export class ValueClassExampleModule {}
