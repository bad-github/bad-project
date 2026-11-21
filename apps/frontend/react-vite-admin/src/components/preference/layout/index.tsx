import {useEffect} from 'react';

export default function Layout() {
  useEffect(() => {
    console.log('Layout effect');
  }, []);
  return <div>Layout</div>;
}
