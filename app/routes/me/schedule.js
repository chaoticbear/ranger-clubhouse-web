import Route from '@ember/routing/route';
import MeRouteMixin from 'clubhouse/mixins/route/me';
import requestYear from 'clubhouse/utils/request-year';
import RSVP from 'rsvp';

export default class MeScheduleRoute extends Route.extend(MeRouteMixin) {
  queryParams = {
    year: { refreshModel: true }
  };

  beforeModel() {
    const user = this.session.user;
    if (user.isPastProspective || user.isBonked) {
      this.toast.error('You are not permitted sign up for trainings or shifts at this time.');
      this.transitionTo('me.overview');
    }
  }

  model(params) {
    const person_id = this.session.userId;
    const year = requestYear(params);

    this.store.unloadAll('schedule');

    return RSVP.hash({
      signedUpSlots: this.store.query('schedule', { person_id, year }).then((result) => result.toArray()),
      slots: this.store.query('schedule', { person_id, year, shifts_available: 1 }),
      scheduleSummary: this.ajax.request(`person/${person_id}/schedule/summary`, { data: { year } }).then((result) => result.summary),
      permission: this.ajax.request(`person/${person_id}/schedule/permission`, { data: { year } })
        .then((results) => results.permission),
      creditsEarned: this.ajax.request(`person/${person_id}/credits`, { data: { year } })
        .then((result) => result.credits),
      year
    });
  }

  setupController(controller, model) {
    super.setupController(...arguments);

    const person = this.session.user;

    if (!model.permission.signup_allowed && (person.isAuditor || person.isProspective || person.isAlpha)) {
      this.toast.error('You need to complete one or more items in the checklist before being allowed to sign up.');
      this.transitionTo('me.overview');
    }
  }

  resetController(controller, isExiting) {
    if (isExiting) {
      controller.set('year', null);
    }
  }
}
