import { Card } from '../components/ui';

export default function Profile() {
  return (
    <div className="detail-grid">
      <Card>
        <div className="row"><div className="avatar">PM</div><span className="badge success">Property Manager</span></div>
        <h3>Jordan Miller</h3>
        <div className="small muted">jordan@propora.io · (415) 555-0199</div>
        <div className="form-grid" style={{ marginTop: 16 }}>
          <div className="field"><label htmlFor="fn">Full name</label><input id="fn" defaultValue="Jordan Miller" /></div>
          <div className="field"><label htmlFor="em">Email</label><input id="em" defaultValue="jordan@propora.io" /></div>
          <div className="field"><label htmlFor="ph">Phone</label><input id="ph" defaultValue="(415) 555-0199" /></div>
          <div className="field"><label htmlFor="co">Company</label><input id="co" defaultValue="Propora Management" /></div>
        </div>
        <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
          <button className="btn btn-teal" type="button">Save changes</button>
          <button className="btn btn-ghost" type="button">Change password</button>
        </div>
      </Card>
      <Card>
        <strong>Preferences</strong>
        <div className="list">
          <div className="list-row"><span>Email notifications</span><strong>On</strong></div>
          <div className="list-row"><span>Rent reminders</span><strong>3 days before</strong></div>
          <div className="list-row"><span>Currency</span><strong>USD</strong></div>
          <div className="list-row"><span>Theme</span><strong>Teal light</strong></div>
        </div>
      </Card>
    </div>
  );
}
