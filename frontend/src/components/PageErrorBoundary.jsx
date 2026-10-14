import { Component } from 'react';

export default class PageErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <section role="alert">
          <h2>Unable to open this page</h2>
          <p>Please reload to try again. Your saved data is still available.</p>
          <button type="button" onClick={() => window.location.reload()}>Reload page</button>
          {' '}<a href="/">Return to dashboard</a>
        </section>
      );
    }
    return this.props.children;
  }
}
