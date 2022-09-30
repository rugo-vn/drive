import { RugoException } from '@rugo-vn/service';

export class ValidationError extends RugoException {
  constructor (msg) {
    super(msg);

    this.status = 400;
  }
}
