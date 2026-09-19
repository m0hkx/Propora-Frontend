import { Card } from '../components/ui';
import { useAuth } from '../auth/useAuth';

export default function Profile() {
  const { user } = useAuth();
  const name = user?.name ?? 'Account';
  const initials = name.split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="grid grid-cols-[1fr_360px] gap-4 max-compact:grid-cols-1">
      <Card>
        <div className="row"><div className="avatar">{initials}</div><span className="badge success">Property Manager</span></div>
        <h3 className="font-display text-xl font-bold">{name}</h3>
        <div className="small muted">{user?.email}</div>
        <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1 mt-4">
          <div className="field"><label htmlFor="fn">Full name</label><input id="fn" defaultValue={name} /></div>
          <div className="field"><label htmlFor="em">Email</label><input id="em" defaultValue={user?.email} /></div>
          <div className="field"><label htmlFor="ph">Phone</label><input id="ph" placeholder="Not set" /></div>
          <div className="field"><label htmlFor="co">Company</label><input id="co" placeholder="Not set" /></div>
        </div>
        <div className="mt-3.5 flex gap-2.5">
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
