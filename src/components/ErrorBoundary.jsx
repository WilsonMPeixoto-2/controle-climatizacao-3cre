import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error('Erro capturado pelo ErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const errorMessage = this.state.error?.message || 'Erro não especificado';
    const componentStack = this.state.errorInfo?.componentStack || '';

    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: 'var(--color-page-bg, #f4f7fb)',
          color: 'var(--color-text, #172033)',
          fontFamily: 'var(--font-sans, Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif)'
        }}
      >
        <section
          role="alert"
          aria-live="assertive"
          style={{
            width: 'min(760px, 100%)',
            border: '1px solid var(--color-border, rgba(15, 23, 42, 0.12))',
            borderRadius: '22px',
            background: 'var(--color-card-bg, #ffffff)',
            boxShadow: '0 22px 70px rgba(15, 23, 42, 0.16)',
            padding: '28px'
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '44px',
              height: '44px',
              borderRadius: '14px',
              marginBottom: '16px',
              background: 'rgba(14, 165, 233, 0.12)',
              color: 'var(--color-primary, #0ea5e9)',
              fontWeight: 800
            }}
          >
            !
          </div>

          <h1 style={{ margin: '0 0 10px', fontSize: 'clamp(1.35rem, 3vw, 1.9rem)', lineHeight: 1.15 }}>
            Ocorreu um erro inesperado
          </h1>

          <p style={{ margin: '0 0 20px', color: 'var(--color-text-muted, #64748b)', lineHeight: 1.6 }}>
            A tela não pôde ser carregada corretamente. Recarregue a página para tentar novamente. Se o problema persistir,
            registre o ocorrido para análise da equipe responsável.
          </p>

          <button
            type="button"
            onClick={this.handleReload}
            style={{
              border: '0',
              borderRadius: '12px',
              padding: '12px 18px',
              cursor: 'pointer',
              fontWeight: 800,
              color: '#ffffff',
              background: 'var(--color-primary, #0ea5e9)',
              boxShadow: '0 12px 32px rgba(14, 165, 233, 0.28)'
            }}
          >
            Recarregar página
          </button>

          <details style={{ marginTop: '22px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 700, color: 'var(--color-text-muted, #64748b)' }}>
              Detalhes técnicos
            </summary>
            <pre
              style={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                marginTop: '12px',
                padding: '14px',
                borderRadius: '12px',
                background: 'rgba(15, 23, 42, 0.06)',
                color: 'var(--color-text, #172033)',
                fontSize: '12px',
                lineHeight: 1.5,
                maxHeight: '260px',
                overflow: 'auto'
              }}
            >
              {`${errorMessage}\n${componentStack}`}
            </pre>
          </details>
        </section>
      </main>
    );
  }
}

export default ErrorBoundary;
