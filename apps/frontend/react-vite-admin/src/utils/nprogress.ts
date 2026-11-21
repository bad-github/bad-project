import NProgress from 'nprogress';

NProgress.configure({
  showSpinner: false,
  // easing: 'linear',
});

const start = () => {
  if (NProgress.isRendered()) {
    NProgress.remove();
  }
  NProgress.start();
};

const done = () => {
  if (NProgress.isRendered()) {
    NProgress.done();
  }
};

const remove = () => {
  if (NProgress.isRendered()) {
    NProgress.remove();
  }
};

const once = (time = 400) => {
  if (NProgress.isRendered()) {
    NProgress.remove();
  }
  NProgress.start();
  setTimeout(() => NProgress.done(), time);
};

export default {
  start,
  done,
  remove,
  once,
};
