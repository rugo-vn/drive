import { RugoError } from '@rugo-vn/service';

export class ValidationError extends RugoError {
  constructor (msg) {
    super(msg);

    this.status = 400;
  }
}
