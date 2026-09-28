import { Controller, Get } from '@nestjs/common';
import { ValueClassExampleService } from './value-class-example.service';

@Controller('value-class-example')
export class ValueClassExampleController {
  constructor(private readonly valueClassExampleService: ValueClassExampleService) {}

  @Get()
  getValues() {
    return this.valueClassExampleService.getValues();
  }
}
