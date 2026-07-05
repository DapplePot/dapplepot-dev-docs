import { Link } from 'react-router-dom';
import { XREFS } from '../data/xrefs.js';

/* Renders `children` as inline code that's ALSO a real link to its API
   Reference section. Uses react-router's Link (not a plain <a>) so
   cross-page navigation stays client-side — a plain <a> would force a full
   page reload, and the browser tries to scroll to the #hash before React
   has even rendered the target, so the scroll silently fails. Falls back
   to plain <code> if the name isn't in the lookup, so a typo never
   produces a dead link. */
const Xref = ({ children }) => {
  const to = XREFS[children];
  if (!to) return <code>{children}</code>;
  return (
    <Link to={to} className="xref-link">
      <code>{children}</code>
    </Link>
  );
};

export default Xref;
