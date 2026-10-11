import Logo from "./Logo";

export default function SetupNeeded() {
  return (
    <div className="center-page">
      <div className="card narrow">
        <Logo size={48} />
        <h1>Connect Firebase</h1>
        <p>Red.Dot needs a Firebase project for sign-in and the live database.</p>
        <ol>
          <li>Create a free project at console.firebase.google.com</li>
          <li>Add a Web app and copy its config</li>
          <li>Copy <code>.env.example</code> to <code>.env.local</code> and paste the values</li>
          <li>Restart <code>npm run dev</code></li>
        </ol>
        <p className="muted">Full steps are in SETUP.md.</p>
      </div>
    </div>
  );
}
