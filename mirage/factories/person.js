import { Factory, faker } from 'ember-cli-mirage';
import moment from 'moment';

export default Factory.extend({
  status: 'active',
  callsign() { return faker.random.uuid(); },
  callsign_approved: true,
  email() { return faker.internet.email(); },
  first_name() { return faker.name.firstName(); },
  mi() { return faker.random.alphaNumeric(2) },
  last_name() { return faker.name.lastName(); },
  street1() { return faker.address.streetAddress(true); },
  street2() { return faker.address.secondaryAddress() },
  apt: '',
  city() { return faker.address.city(); },
  state() { return faker.address.stateAbbr(); },
  country: 'USA',
  zip() { return faker.address.zipCode(); },
  home_phone() { return faker.phone.phoneNumberFormat(); },
  alt_phone() { return faker.phone.phoneNumberFormat(); },
  user_authorized: true,
  create_date() { return moment().format('YYYY-MM-DD hh:mm:ss'); },
  password: 'ineedashower!',
  camp_location() { return faker.address.latitude() + faker.address.longitude(); },
  teeshirt_size_style: 'Mens Crew S',
  longsleeveshirt_size_style: 'Mens Regular S',
  gender: ''
});