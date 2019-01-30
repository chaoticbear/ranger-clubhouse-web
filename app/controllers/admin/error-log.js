import Controller from '@ember/controller';
import { computed } from '@ember-decorators/object';

export default class AdminErrorLogController extends Controller {

  @computed('page')
  get previousPage() {
    return this.page - 1;
  }

  @computed('page')
  get nextPage() {
    return this.page + 1;
  }
}
