import { type ArgumentMetadata, Injectable, type PipeTransform } from '@nestjs/common';

@Injectable()
export class StringToLowercasePipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    console.log('metadata:', metadata);

    if (typeof value === 'string') {
      return value.toLowerCase();
    }
    return value;
  }
}
