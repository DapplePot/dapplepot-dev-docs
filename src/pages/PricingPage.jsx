import Note from '../components/Note.jsx';

const PricingPage = () => (
  <>
    <span className="eyebrow">Pricing</span>
    <h1>Pricing</h1>
    <p className="lede">This page is a placeholder — content coming soon.</p>

    <Note tone="info" title="In the meantime">
      Reach out via the{' '}
      <a href="https://app.dapplepot.com" target="_blank" rel="noopener noreferrer">DapplePot dashboard</a>{' '}
      or your account contact for current plan details.
    </Note>
  </>
);

PricingPage.headings = [];

export default PricingPage;
