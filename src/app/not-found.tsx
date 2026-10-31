import Link from "next/link";
export default function NotFound(){return <div className="empty-state"><h1>This workspace could not be found.</h1><p>Return to your Singapore estate dashboard.</p><Link className="button button-primary" href="/dashboard">Back to dashboard</Link></div>;}
