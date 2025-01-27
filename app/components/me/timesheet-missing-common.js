import Component from '@glimmer/component';
import {action, set} from '@ember/object';
import {validatePresence} from 'ember-changeset-validations/validators';
import {service} from '@ember/service';
import {DIRT, TRAINING} from 'clubhouse/constants/positions';
import validateDateTime from 'clubhouse/validators/datetime';
import {tracked} from '@glimmer/tracking';
import _ from 'lodash';

export default class MeTimesheetMissingCommonComponent extends Component {
  @service house;
  @service modal;
  @service session;
  @service shiftManage;
  @service store;
  @service toast;

  @tracked entry = null;
  @tracked isSubmitting = false;

  timesheetValidations = {
    on_duty: [validateDateTime({before: 'off_duty'}), validatePresence(true)],
    off_duty: [validateDateTime({after: 'on_duty'}), validatePresence(true)],
    additional_notes: [validatePresence(true)]
  };

  /**
   * Create a list of positions options to check, ensure Dirt is the top most option.
   */

  constructor() {
    super(...arguments);

    const positions = this.args.positions.filter((p) => p.id !== TRAINING).map((p) => [p.title, p.id]);
    const dirt = positions.find((p) => p[1] === DIRT);
    if (dirt) {
      _.pull(positions, dirt);
      positions.unshift(dirt);
    }

    this.positionOptions = positions;
  }

  get isMe() {
    return +this.args.person.id === this.session.userId;
  }

  /**
   * Start a new timesheet missing request
   */

  @action
  newRequestAction() {
    this.entry = this.store.createRecord('timesheet-missing', {
      person_id: this.args.person.id,
      position_id: this.positionOptions[0][1],
    });
  }

  /**
   * Edit an existing request
   * @param {TimesheetMissingModel} timesheetMissing
   */

  @action
  editAction(timesheetMissing) {
    timesheetMissing.reload().then(() => {
      if (timesheetMissing.isApproved) {
        this.modal.info('Missing Timesheet Entry Request Approved!', 'Hold up! The timesheet entry has been approved since this page has been refreshed.');
        return;
      }
      this.entry = timesheetMissing;
    }).catch((response) => this.house.handleErrorResponse(response));
  }

  /**
   * Cancel the form
   */

  @action
  cancelAction() {
    this.entry = null;
  }

  /**
   * Save a timesheet missing request
   * @param {TimesheetMissingModel} model
   * @param {boolean} isValid
   */

  @action
  async saveAction(model, isValid) {
    if (!isValid) {
      return;
    }

    const isNew = model.isNew;

    if (!model.isDirty) {
      this.entry = null;
      this.modal.info('', `You did not enter any ${isNew ? 'new' : ''} information.`);
      return;
    }

    if (model._changes['position_id'] || model._changes['on_duty'] || model._changes['off_duty']) {
      await this.shiftManage.checkDateTime(model.position_id, model.on_duty, model.off_duty, () => this._saveCommon(model));
    } else {
      await this._saveCommon(model);
    }
  }

  async _saveCommon(model) {
    const isNew = model.isNew;

    try {
      this.isSubmitting = true;
      await model.save();
      this.toast.success(`Your request has been successfully ${isNew ? 'submitted' : 'updated'}.`);
      if (isNew) {
        this.args.timesheetsMissing.update();
      }
      this.entry = null;
      set(this.args.timesheetInfo, 'timesheet_confirmed', false);
    } catch (response) {
      this.house.handleErrorResponse(response)
    } finally {
      this.isSubmitting = false;
    }
  }

  /**
   * Delete a missing entry request, confirm before proceeding.
   * @param {TimesheetMissingModel} timesheetMissing
   */

  @action
  deleteAction(timesheetMissing) {
    this.modal.confirm(
      'Are you sure wish to delete this?',
      'You are about to delete the timesheet missing request. Please confirm you want to do this.',
      () => timesheetMissing.destroyRecord().then(() => this.toast.success('The request has been deleted.'))
    );
  }

  /**
   * Helper to color the row header. (aka entry status header)
   *
   * @param {TimesheetMissingModel} ts
   * @returns {string}
   */

  requestClass(ts) {
    if (ts.isApproved) {
      return 'text-success';
    }

    if (ts.isRejected) {
      return 'text-bg-danger';
    }

    if (ts.isPending) {
      return 'text-bg-secondary';
    }

    return ''
  }
}
