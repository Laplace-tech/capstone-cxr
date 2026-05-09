// apps/frontend/src/components/common/ErrorBoundary.jsx

import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary] UI render failed", error, info);
  }

  handleRecover = () => {
    this.setState({ hasError: false });
    this.props.onRecover?.();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <section className="state-card product-panel safe-error-card" role="alert">
        <span className="eyebrow">Recovery Mode</span>
        <h2>화면 표시를 복구했습니다</h2>
        <p>
          일시적인 화면 렌더링 문제가 감지되어 안전 화면으로 전환했습니다.
          아래 버튼을 누르면 현재 데모 화면으로 다시 돌아갑니다.
        </p>
        <button className="secondary-button" type="button" onClick={this.handleRecover}>
          화면 복구
        </button>
      </section>
    );
  }
}

export default ErrorBoundary;
