import React from 'react';
import {errorManager} from '../error-manager';

interface Props {
  fallback?: (error: any, reset: () => void) => React.ReactNode;
  children: React.ReactNode;
}

interface State {
  error: any;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = {error: null};

  static getDerivedStateFromError(error: any) {
    return {error};
  }

  componentDidCatch(error: any, info: any) {
    errorManager.report(error, info);
  }

  reset = () => {
    this.setState({error: null});
  };

  render() {
    if (this.state.error) {
      return this.props.fallback ? this.props.fallback(this.state.error, this.reset) : null;
    }

    return this.props.children;
  }
}
