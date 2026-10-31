"use client";
export default function ErrorPage({reset}:{reset:()=>void}){return <div className="empty-state"><h1>Something interrupted this view.</h1><p>Your saved browser project is not affected.</p><button className="button button-primary" onClick={reset}>Try again</button></div>;}
