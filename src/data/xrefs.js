/* Central lookup: identifier text (as it appears inside <code>...</code> in
   prose) -> the API Reference anchor it should link to. Anchor IDs must
   match ApiReferencePage.jsx's slug()/method anchor scheme exactly. */
const API = '/sdk/reference/api';

export const XREFS = {
  'DapplePot': `${API}#dapplepot_sdk-dapplepot`,
  'DapplePotBlockedError': `${API}#dapplepot_sdk-dapplepotblockederror`,
  'DapplePotSessionTerminatedError': `${API}#dapplepot_sdk-dapplepotsessionterminatederror`,
  'BaseScrubber': `${API}#dapplepot_sdk-scrubbers-basescrubber`,
  'RegexScrubber': `${API}#dapplepot_sdk-scrubbers-regexscrubber`,
  'dp.session()': `${API}#dapplepot_sdk-dapplepot-session`,
  'dp.node()': `${API}#dapplepot_sdk-dapplepot-node`,
  'dp.callback_handler()': `${API}#dapplepot_sdk-dapplepot-callback_handler`,
  'dp.instrument_anthropic()': `${API}#dapplepot_sdk-dapplepot-instrument_anthropic`,
  'dp.instrument_openai()': `${API}#dapplepot_sdk-dapplepot-instrument_openai`,
  'dp.shutdown()': `${API}#dapplepot_sdk-dapplepot-shutdown`,
};
