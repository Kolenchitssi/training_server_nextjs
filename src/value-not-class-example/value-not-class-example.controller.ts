import { Controller, Get, Inject } from '@nestjs/common';
import { valueNotClassExampleValue } from './value-not-class-example.service';

@Controller('value-not-class-example')
export class ValueNotClassExampleController {
  constructor(
    @Inject('VALUE_NOT_CLASS_EXAMPLE')
    private readonly valueNotClassExample: typeof valueNotClassExampleValue,
  ) {}

  @Get()
  getValues() {
    return this.valueNotClassExample;
  }
}
