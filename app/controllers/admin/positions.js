import ClubhouseController from 'clubhouse/controllers/clubhouse-controller';
import {action} from '@ember/object';
import {cached, tracked} from '@glimmer/tracking';
import PositionTypes from 'clubhouse/constants/position-types';
import {TECH_NINJA} from 'clubhouse/constants/roles';
import _ from 'lodash';
import { later }from '@ember/runloop';

export default class PositionController extends ClubhouseController {
  @tracked positions;
  @tracked position = null;

  @tracked typeFilter = 'All';
  @tracked activeFilter = 'all';
  @tracked allRangersFilter = '-';
  @tracked viewAs = 'list';
  @tracked teams;
  @tracked rolesById;
  @tracked roleOptions;

  activeOptions = [
    {id: 'all', title: 'All'},
    {id: 'active', title: 'Active'},
    {id: 'inactive', title: 'Inactive'},
  ];

  allRangersOptions = [
    ['-', 'all'],
    ['All Rangers', 'all-rangers'],
    ['Not-All Rangers', 'not']
  ];

  viewAsOptions = [
    ['List', 'list'],
    ['Teams', 'teams']
  ];


  constructor() {
    super(...arguments);

    const types = PositionTypes.slice();
    types.unshift('All');
    this.typeOptions = types;
  }

  get canManagePositions() {
    return this.session.hasRole(TECH_NINJA)
  }

  @cached
  get viewByTeams() {
    const groups = _.groupBy(this.positions.toArray(), 'team_id');

    const teams = this.teams.map((team) => ({
      id: team.id,
      title: team.title,
      team_positions: groups[team.id] ?? [],
    }));

    teams.unshift({
      title: 'General Positions / Unassociated with Team',
      team_positions: this.positions.filter((p) => !p.team_id || !groups[p.team_id])
    });

    return teams;
  }

  @cached
  get viewPositions() {
    let positions = this.positions;
    const {typeFilter, activeFilter, allRangersFilter} = this;

    if (typeFilter !== 'All') {
      positions = positions.filterBy('type', typeFilter);
    }

    if (activeFilter) {
      if (activeFilter === 'active') {
        positions = positions.filterBy('active', true);
      } else if (activeFilter === 'inactive') {
        positions = positions.filterBy('active', false);
      }
    }

    if (allRangersFilter !== '-') {
      positions = positions.filterBy('all_rangers', (allRangersFilter === 'all-rangers'));
    }

    return positions;
  }

  @cached
  get positionScrollItems() {
    return this.viewPositions.map((p) => ({
      id: `position-${p.id}`,
      title: p.title
    }));
  }

  @cached
  get teamScrollList() {
    const list = [];

    this.viewByTeams.forEach((t) => {
      if (t.id) {
        list.push({
          id: `team-${t.id}`,
          title: t.title
        });
      }
    });

    return list;
  }

  @action
  showAsClick(type) {
    this.showAsPositions = (type === 'positions');
    this.showAsTeams = !this.showAsPositions;
  }

  @action
  newAction() {
    this.position = this.store.createRecord('position', {type: 'Frontline'});
  }

  @action
  editAction(position) {
    this.position = position;
  }

  @action
  deleteAction() {
    this.modal.confirm(`Confirm Deleting "${this.position.title}"`,
      `By deleting this position important historical information will be lost. Are you use you want to do this?`,
      async () => {
        try {
          await this.position.destroyRecord();
          this.toast.success('The position has been deleted.');
          this.position = null;
          this.house.scrollToTop();
        } catch (response) {
          this.house.handleErrorResponse(response)
        }
      });
  }

  @action
  saveAction(model, isValid) {
    const isNew = model.isNew;

    if (!isValid) {
      return;
    }

    this.house.saveModel(model, `The position has been ${isNew ? 'created' : 'updated'}.`, async () => {
      try {
        if (isNew) {
          await this.positions.update(); // refresh the list.
        }
        this._scrollToPosition(this.position.id);
        this.position = null;
      } catch (response) {
        this.house.handleErrorResponse(response);
      }
    });
  }

  @action
  cancelAction() {
    if (!this.position.isNew) {
      this._scrollToPosition(this.position.id);
    } else {
      this.house.scrollToTop();
    }
    this.position = null;
  }

  _scrollToPosition(positionId) {
    later(() => this.house.scrollToElement(`#position-${positionId}`), 100);
    
  }
}
