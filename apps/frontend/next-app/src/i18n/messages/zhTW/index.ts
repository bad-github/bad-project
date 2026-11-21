import common from './common';
import home from './home';
import navigation from './navigation';
import status from './status';
import portfolio from './portfolio';
import showcase from './showcase';
import skill from './skill';

const messages = {
  Common: common,
  Navigation: navigation,
  Home: home,
  Status: status,
  Portfolio: portfolio,
  Showcase: showcase,
  Skill: skill,
} as const;

export default messages;
