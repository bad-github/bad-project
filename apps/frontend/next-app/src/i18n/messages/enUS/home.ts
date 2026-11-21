const home = {
  name: 'bad',
  avatarAlt: "bad's profile picture",
  birthday: '1996/12/01',
  location: 'Chongqing, China',
  school: 'Chengdu University of Information Technology',
  major: 'Computer Science and Technology',
  email: 'gouych@gmail.com',
  job: 'Full-stack Engineer',
  signatureLabel: "Gou Yongchao's signature",
  aboutTitle: 'About Me',
  paragraphs: {
    introduction: "Hi, I'm bad, a software developer with over seven years of experience.",
    career: "I've worked at three companies, contributing to projects in telecommunications, logistics, and automotive software. Working across different fields has taught me to approach problems from both business and user perspectives, and to appreciate the value software brings to real-world situations.",
    spareTime: "Outside of work, I enjoy exploring open-source projects, writing down my thoughts, and trying things out, learning something new from each experience.",
  },
} as const;

export default home;
